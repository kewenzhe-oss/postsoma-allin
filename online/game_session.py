"""
game_session.py — Orchestrates an online poker room session.

Key responsibilities:
  - Manage the engine adapter (two-player game state)
  - Route human actions from WebSocket
  - Detect AI turns and invoke PokerAIEngine
  - Track opponent behavior via OpponentModelTracker
  - Track AI decisions via DecisionMemory
  - Broadcast ai_thought events after each AI decision
  - Perform heuristic hand-end reflection

Security invariants:
  - ai_config (API keys) is kept in memory only; never serialized or logged
  - AI only sees its own private hole cards (via get_private_state("ai_seat"))
  - All AI actions pass through the same engine validation as human actions
"""

import asyncio
import logging
from dataclasses import asdict
from typing import Dict, Any, List, Optional, Callable

from online.engine_adapter import OnlinePokerEngineAdapter
from online.schemas import EngineEvent
from online.ai_schemas import (
    AIDecisionRequest, AIDecision, AIThoughtEvent,
    DecisionMemoryEntry,
)
from online.opponent_model import OpponentModelTracker
from online.decision_memory import DecisionMemory
from online.ai_prompt_builder import build_opponent_profile_summary
from online.poker_ai_engine import PokerAIEngine

logger = logging.getLogger(__name__)

AI_SEAT_ID = "ai_seat"
_ai_engine = PokerAIEngine()  # stateless singleton


class GameSession:
    def __init__(self, room_id: str, mode: str, ai_config: Optional[Dict[str, Any]] = None):
        self.room_id = room_id
        self.mode = mode
        self.ai_config = ai_config  # BYOKProviderConfig dict — never logged or serialized

        self.adapter = OnlinePokerEngineAdapter()
        self.players_connected: Dict[str, bool] = {}
        self.turn_timer_task: Optional[asyncio.Task] = None
        self.turn_timeout_seconds = 60
        self.tokens: Dict[str, str] = {}  # token -> player_id

        # Session-level AI intelligence (cleared on session end, never persisted)
        self._opponent_model: Optional[OpponentModelTracker] = None
        self._decision_memory = DecisionMemory()

        # Per-hand action history (public actions only)
        self._hand_action_history: List[Dict[str, Any]] = []
        self._current_hand_number: int = 0

        # Event listeners (for broadcasting to websockets)
        self.on_event_generated: Optional[Callable[[EngineEvent], None]] = None

        # Serial lock: ensures only one AI routine runs at a time.
        # Prevents the race where a slow LLM call from the previous street
        # finishes after the new street has already started a fresh routine.
        self._ai_lock = asyncio.Lock()

    # ── Player management ─────────────────────────────────────────────────────

    def add_player(self, player_id: str, display_name: str, player_token: str = ""):
        self.adapter.add_player(player_id, display_name)
        self.players_connected[player_id] = False
        if player_token:
            self.tokens[player_token] = player_id

        # Initialize opponent model when we know who the human is
        if self.mode == "human_vs_ai" and player_id != AI_SEAT_ID:
            self._opponent_model = OpponentModelTracker(
                player_id=player_id,
                display_name=display_name,
            )

    def check_start(self):
        if self.adapter.can_start_hand() and not self.adapter.event_log():
            events = self.adapter.start_hand()
            self._dispatch_events(events)
            # Track hand_started from this path too
            for ev in events:
                if ev.type == "hand_started":
                    self._on_hand_started(ev)
            self._restart_turn_timer()

    # ── Action submission ─────────────────────────────────────────────────────

    def submit_action(self, player_id: str, action: str, amount: Optional[int] = None) -> bool:
        result = self.adapter.submit_action(player_id, action, amount)
        if not result.accepted:
            return False

        self._dispatch_events(result.events)

        # Track public actions for opponent model + AI history
        for ev in result.events:
            if ev.type == "player_action_applied":
                self._on_action_applied(ev)
            elif ev.type == "hand_started":
                self._on_hand_started(ev)
            elif ev.type == "hand_finished":
                self._on_hand_finished(ev)

        self._restart_turn_timer()

        if any(e.type == "hand_finished" for e in result.events):
            if self.turn_timer_task:
                self.turn_timer_task.cancel()

            active_players = [p for p in self.adapter.table.players if p.chips > 0]

            if len(active_players) < 2:
                self._end_game()
            else:
                asyncio.create_task(self._delayed_start_next_hand())

        return True

    # ── Event observers ───────────────────────────────────────────────────────

    def _on_hand_started(self, ev: EngineEvent):
        self._current_hand_number = ev.payload.get("hand_number", self._current_hand_number + 1)
        self._hand_action_history = []
        if self._opponent_model:
            self._opponent_model.new_hand(self._current_hand_number)

    def _on_action_applied(self, ev: EngineEvent):
        """Record action for history and opponent model tracking."""
        pid = ev.payload.get("player_id", "")
        action = ev.payload.get("action", "")
        amount = ev.payload.get("amount", 0)

        self._hand_action_history.append({
            "player_id": pid,
            "action": action,
            "amount": amount,
        })

        # Track opponent actions in model
        if self._opponent_model and pid == self._opponent_model.player_id:
            self._opponent_model.observe_action(pid, action, amount, "")

        # Track when AI raises (for fold-to-raise detection)
        if pid == AI_SEAT_ID and action.upper() in ("RAISE", "ALL_IN"):
            if self._opponent_model:
                self._opponent_model.observe_ai_raised()

    def _on_hand_finished(self, ev: EngineEvent):
        """Update opponent model, AI memory outcomes, and generate reflection."""
        hand_number = ev.payload.get("hand_number", self._current_hand_number)
        winners = ev.payload.get("winners", [])
        ended_by = ev.payload.get("ended_by", "")

        # Update opponent model showdown count
        if self._opponent_model:
            self._opponent_model.observe_hand_result(hand_number, winners, AI_SEAT_ID)

        # Determine if AI won
        winner_ids = {w.get("player_id") for w in winners}
        ai_won = AI_SEAT_ID in winner_ids
        opp_won = self._opponent_model and self._opponent_model.player_id in winner_ids
        chips_delta = None
        if winners:
            for w in winners:
                if w.get("player_id") == AI_SEAT_ID:
                    chips_delta = w.get("amount")

        # Update decision memory outcomes
        won_flag = True if ai_won else (None if not opp_won else False)
        reflection_note = _heuristic_reflection(
            ai_won=ai_won,
            ended_by=ended_by,
            opponent_profile=self._opponent_model.summarize() if self._opponent_model else None,
        )
        self._decision_memory.update_outcome(
            hand_number=hand_number,
            won=won_flag,
            chips_delta=chips_delta,
            note=reflection_note,
        )

        # Add a note to opponent model
        if self._opponent_model and reflection_note:
            self._opponent_model.add_note(reflection_note)

    # ── AI turn ───────────────────────────────────────────────────────────────

    def _restart_turn_timer(self):
        # Cancel whatever is running (AI routine or human timer).
        # Note: asyncio task cancellation is cooperative — the old task may still
        # be executing until its next `await`. The _ai_lock below ensures that
        # the new AI routine will not start running until the old one fully exits.
        if self.turn_timer_task:
            self.turn_timer_task.cancel()

        current_turn = self.adapter.current_turn_player_id()
        if not current_turn:
            return

        if current_turn == AI_SEAT_ID and self.mode == "human_vs_ai" and self.ai_config:
            self.turn_timer_task = asyncio.create_task(self._ai_turn_routine())
        else:
            self.turn_timer_task = asyncio.create_task(self._turn_timer_routine(current_turn))

    async def _ai_turn_routine(self):
        """
        Build AIDecisionRequest → call PokerAIEngine → submit action → broadcast thought.

        Uses _ai_lock to guarantee serial execution: if a prior AI routine is still
        running (e.g. awaiting a slow LLM response when a street change triggered a
        cancel + restart), the new routine will wait until the old one fully exits
        before acquiring the lock.  This prevents two concurrent routines from each
        submitting an action for the same turn.
        """
        async with self._ai_lock:
            # Re-check whether it is still the AI's turn after acquiring the lock.
            # The prior routine may have already submitted an action that advanced the turn.
            current_turn = self.adapter.current_turn_player_id()
            if current_turn != AI_SEAT_ID:
                logger.debug("AI routine acquired lock but turn has moved on; skipping.")
                return

            # Brief perceptual delay so the frontend can show "AI thinking…"
            try:
                await asyncio.sleep(1.0)
            except asyncio.CancelledError:
                # Cancelled during the delay — exit cleanly without submitting.
                logger.debug("AI routine cancelled during initial sleep.")
                return

            try:
                request = self._build_decision_request()

                # Yield to the event loop so a pending cancel can arrive before we
                # start the expensive LLM call.
                await asyncio.sleep(0)

                decision: AIDecision = await _ai_engine.decide(request, self.ai_config)

                # One more cancellation check before we mutate game state.
                # (CancelledError would propagate here anyway, but being explicit
                # makes the intent obvious.)
                logger.info(
                    "AI decision hand=%s stage=%s: %s %s (conf=%.2f parse=%s)",
                    request.hand_number, request.stage,
                    decision.action, decision.amount,
                    decision.confidence, decision.parse_status,
                )

                # Record in decision memory
                profile = self._opponent_model.summarize() if self._opponent_model else None
                self._decision_memory.record(DecisionMemoryEntry(
                    hand_number=request.hand_number,
                    stage=request.stage,
                    action=decision.action,
                    amount=decision.amount,
                    reason=decision.reason,
                    strategy_tags=decision.strategy_tags,
                    opponent_profile_labels=profile.tendency_labels if profile else [],
                    confidence=decision.confidence,
                ))

                # Broadcast ai_thought event
                thought_text = decision.reason or _default_thought(decision.action, request)
                self._broadcast_ai_thought(AIThoughtEvent(
                    hand_number=request.hand_number,
                    stage=request.stage,
                    ai_player_id=AI_SEAT_ID,
                    thought_summary=thought_text,
                    confidence=decision.confidence,
                    strategy_tags=decision.strategy_tags,
                    parse_status=decision.parse_status,
                ))

                # Final guard: only submit if it is still the AI's turn.
                # (Should always be True here, but defend against edge cases.)
                if self.adapter.current_turn_player_id() == AI_SEAT_ID:
                    self.submit_action(AI_SEAT_ID, decision.action, decision.amount)
                else:
                    logger.warning("AI routine completed but turn has moved; dropping action.")

            except asyncio.CancelledError:
                # Cancelled while waiting for LLM — exit without submitting anything.
                logger.debug("AI routine cancelled during LLM call; no action submitted.")
                raise  # Re-raise so asyncio cleans up the task properly

            except Exception as e:
                logger.error("AI turn routine failed: %s", e, exc_info=True)
                # Emergency fallback — never freeze the game on an unexpected error.
                # Only apply if it's still the AI's turn (avoids stale fallback after a
                # retry that somehow succeeded on a different path).
                if self.adapter.current_turn_player_id() == AI_SEAT_ID:
                    available = self.adapter.get_available_actions(AI_SEAT_ID)
                    for preferred in ("CALL", "CHECK", "FOLD"):
                        if any(a.action == preferred for a in available):
                            logger.warning("AI fallback action: %s", preferred)
                            self.submit_action(AI_SEAT_ID, preferred)
                            break

    def _build_decision_request(self) -> AIDecisionRequest:
        """Build the AIDecisionRequest from current engine state. AI-safe: no hidden cards."""
        pub = self.adapter.get_public_state()
        ai_private = self.adapter.get_private_state(AI_SEAT_ID)
        available = self.adapter.get_available_actions(AI_SEAT_ID)

        ai_player = next((p for p in pub.players if p.player_id == AI_SEAT_ID), None)
        opponent = next((p for p in pub.players if p.player_id != AI_SEAT_ID), None)

        to_call = max(0, pub.current_bet - (ai_player.bet_in_round if ai_player else 0))

        # Build opponent profile summary
        profile_summary = None
        if self._opponent_model:
            profile = self._opponent_model.summarize()
            profile_summary = build_opponent_profile_summary(profile)

        return AIDecisionRequest(
            room_id=self.room_id,
            hand_number=self._current_hand_number,
            ai_player_id=AI_SEAT_ID,
            opponent_player_id=opponent.player_id if opponent else "",
            stage=pub.stage,
            hole_cards=ai_private.private_player_state.hole_cards,   # AI's own only
            community_cards=pub.community_cards,
            pot=pub.pot,
            current_bet=pub.current_bet,
            to_call=to_call,
            ai_stack=ai_player.chips if ai_player else 0,
            opponent_stack=opponent.chips if opponent else 0,
            ai_bet_in_round=ai_player.bet_in_round if ai_player else 0,
            opponent_bet_in_round=opponent.bet_in_round if opponent else 0,
            small_blind=pub.small_blind,
            big_blind=pub.big_blind,
            available_actions=[
                {"action": a.action, "min_amount": a.min_amount, "max_amount": a.max_amount}
                for a in available
            ],
            action_history=list(self._hand_action_history),
            opponent_profile_summary=profile_summary,
            previous_ai_notes=self._decision_memory.format_for_prompt(n=3),
        )

    def _broadcast_ai_thought(self, thought: AIThoughtEvent):
        """Dispatch ai_thought as an EngineEvent so connection_manager forwards it."""
        # Only send thought_summary, confidence, tags — not raw prompt or API key
        ev = self.adapter._add_event("ai_thought", {
            "hand_number": thought.hand_number,
            "stage": thought.stage,
            "ai_player_id": thought.ai_player_id,
            "thought_summary": thought.thought_summary[:300],  # hard cap
            "confidence": thought.confidence,
            "strategy_tags": thought.strategy_tags,
            "parse_status": thought.parse_status,
        })
        self._dispatch_events([ev])

    # ── Game end ──────────────────────────────────────────────────────────────

    def _end_game(self):
        self.adapter._game_over = True

        final_stacks = []
        for p in self.adapter.table.players:
            dn = next(
                (s.display_name for s in self.adapter.seats if s.player_id == p.name),
                p.name,
            )
            final_stacks.append({"player_id": p.name, "display_name": dn, "chips": p.chips})

        winner_player = next((p for p in self.adapter.table.players if p.chips > 0), None)
        winner_payload = None
        if winner_player:
            dn = next(
                (s.display_name for s in self.adapter.seats if s.player_id == winner_player.name),
                winner_player.name,
            )
            winner_payload = {"player_id": winner_player.name, "display_name": dn, "chips": winner_player.chips}

        game_over_ev = self.adapter._add_event("game_over", {
            "winner": winner_payload,
            "final_stacks": final_stacks,
        })
        self._dispatch_events([game_over_ev])
        state_ev = self.adapter._add_event("state_updated", {"trigger": "game_over"})
        self._dispatch_events([state_ev])

    # ── Next hand ─────────────────────────────────────────────────────────────

    async def _delayed_start_next_hand(self):
        await asyncio.sleep(5)
        try:
            events = self.adapter.start_hand()
            self._dispatch_events(events)
            for ev in events:
                if ev.type == "hand_started":
                    self._on_hand_started(ev)
            self._restart_turn_timer()
        except ValueError:
            pass

    # ── Event dispatch ────────────────────────────────────────────────────────

    def _dispatch_events(self, events: List[EngineEvent]):
        if self.on_event_generated:
            for ev in events:
                self.on_event_generated(ev)

    # ── Human turn timeout ────────────────────────────────────────────────────

    async def _turn_timer_routine(self, player_id: str):
        try:
            await asyncio.sleep(self.turn_timeout_seconds)
            if self.adapter.current_turn_player_id() == player_id:
                self.submit_action(player_id, "FOLD")
        except asyncio.CancelledError:
            pass


# ── Heuristic reflection helpers ──────────────────────────────────────────────

def _heuristic_reflection(ai_won: bool, ended_by: str, opponent_profile=None) -> str:
    """Generate a short reflection note without calling the LLM."""
    labels = opponent_profile.tendency_labels if opponent_profile else []

    if ended_by == "fold":
        if ai_won:
            if "overfolds to pressure" in labels:
                return "Opponent folded again under pressure; continue aggressive play."
            return "Opponent folded; pressure strategy working."
        else:
            return "I folded; consider defending more against opponent bets."
    elif ended_by == "showdown":
        if ai_won:
            return "Won at showdown; value-betting strategy is paying off."
        else:
            if "loose-aggressive" in labels or "frequent all-in" in labels:
                return "Lost showdown to aggressive opponent; tighten calling range."
            return "Lost showdown; reassess hand strength estimates."
    return ""


def _default_thought(action: str, request: AIDecisionRequest) -> str:
    """Generate a short default thought when the model provides no reason."""
    stage = request.stage
    to_call = request.to_call
    if action == "FOLD":
        return f"Weak hand on {stage}; folding is best."
    if action == "CHECK":
        return f"Checking on {stage} to see free card."
    if action == "CALL":
        return f"Calling {to_call} on {stage}; pot odds are reasonable."
    if action == "RAISE":
        return f"Raising on {stage} to build pot or apply pressure."
    if action == "ALL_IN":
        return f"Going all-in on {stage}."
    return f"Playing {action} on {stage}."
