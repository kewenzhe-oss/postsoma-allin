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
import json
import re
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
        self.absent_players = {}
        self.turn_timer_task: Optional[asyncio.Task] = None
        self._delayed_start_task: Optional[asyncio.Task] = None
        self.turn_timeout_seconds = 60
        self.tokens: Dict[str, str] = {}  # token -> player_id

        # Session-level AI intelligence (cleared on session end, never persisted)
        self._opponent_model: Optional[OpponentModelTracker] = None
        self._decision_memory = DecisionMemory()

        # Per-hand action history (public actions only)
        self._hand_action_history: List[Dict[str, Any]] = []
        self._current_hand_number: int = 0
        self._current_hand_ai_thoughts: List[Dict[str, Any]] = []

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
            if self.adapter.can_advance_street():
                asyncio.create_task(self._run_all_in_runout())
            else:
                self._restart_turn_timer()

        elif self.adapter.current_turn_player_id() == AI_SEAT_ID and (not self.turn_timer_task or self.turn_timer_task.done()):
            self._restart_turn_timer()

    # ── Action submission ─────────────────────────────────────────────────────

    def submit_action(self, player_id: str, action: str, amount: Optional[int] = None) -> bool:
        if self.absent_players:
            return False
        result = self.adapter.submit_action(player_id, action, amount, step_all_in=True)
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
                hf_ev = next((e for e in result.events if e.type == "hand_finished"), None)
                self._end_game(self._extract_deciding_hand(hf_ev))
            else:
                self._delayed_start_task = asyncio.create_task(self._delayed_start_next_hand())
        elif self.adapter.can_advance_street():
            if self.turn_timer_task:
                self.turn_timer_task.cancel()
            asyncio.create_task(self._run_all_in_runout())

        return True

    async def _run_all_in_runout(self):
        """Asynchronously advance community cards with 1.2s delay during all-in lockdown."""
        try:
            while self.adapter.can_advance_street():
                await asyncio.sleep(1.2)
                events = self.adapter.advance_single_street()
                self._dispatch_events(events)
                for ev in events:
                    if ev.type == "hand_finished":
                        self._on_hand_finished(ev)

                if any(e.type == "hand_finished" for e in events):
                    if self.turn_timer_task:
                        self.turn_timer_task.cancel()
                    active_players = [p for p in self.adapter.table.players if p.chips > 0]
                    if len(active_players) < 2:
                        hf_ev = next((e for e in events if e.type == "hand_finished"), None)
                        self._end_game(self._extract_deciding_hand(hf_ev))
                    else:
                        self._delayed_start_task = asyncio.create_task(self._delayed_start_next_hand())
                    break
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error("Error during all-in runout: %s", e, exc_info=True)

    # ── Event observers ───────────────────────────────────────────────────────

    def _on_hand_started(self, ev: EngineEvent):
        self._current_hand_number = ev.payload.get("hand_number", self._current_hand_number + 1)
        self._hand_action_history = []
        self._current_hand_ai_thoughts = []
        self._ai_hand_start_stack = next((p.chips + p.bet_in_round for p in self.adapter.table.players if p.name == AI_SEAT_ID), 0)
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
            "stage": ev.payload.get("stage", ""),
            "bet_in_round": ev.payload.get("bet_in_round", 0),
        })

        # Track opponent actions in model
        if self._opponent_model and pid == self._opponent_model.player_id:
            reported_amt = ev.payload.get("bet_in_round", amount) if action.upper() in ("RAISE", "ALL_IN") else amount
            self._opponent_model.observe_action(pid, action, reported_amt, ev.payload.get("stage", ""), ev.payload.get("previous_bet"))

        # Track when AI raises (for fold-to-raise detection)
        if pid == AI_SEAT_ID and (action.upper() == "RAISE" or (action.upper() == "ALL_IN" and ev.payload.get("bet_in_round", 0) > ev.payload.get("previous_bet", 0))):
            if self._opponent_model:
                self._opponent_model.observe_ai_raised()

    def _on_hand_finished(self, ev: EngineEvent):
        """Update opponent model, AI memory outcomes, and generate reflection."""
        hand_number = ev.payload.get("hand_number", self._current_hand_number)
        winners = ev.payload.get("winners", [])
        ended_by = ev.payload.get("ended_by", "")
        showdown_info = ev.payload.get("showdown_info") or None

        # Update opponent model showdown count
        if self._opponent_model:
            self._opponent_model.observe_hand_result(
                hand_number, winners, AI_SEAT_ID, ended_by, showdown_info=showdown_info
            )

        # Determine if AI won
        winner_ids = {w.get("player_id") for w in winners}
        ai_won = AI_SEAT_ID in winner_ids
        opp_won = self._opponent_model and self._opponent_model.player_id in winner_ids
        ai_stack = next((p.chips for p in self.adapter.table.players if p.name == AI_SEAT_ID), 0)
        chips_delta = ai_stack - getattr(self, '_ai_hand_start_stack', ai_stack)
        won_flag = None if ai_won and opp_won else (True if ai_won else False if opp_won else None)

        opp_line = self._opponent_model.format_current_hand_line() if self._opponent_model else ""
        showdown_detail = ""
        if ended_by == "showdown" and showdown_info and self._opponent_model:
            opp_sd = next((p for p in (showdown_info.get("players") or []) if p.get("player_id") == self._opponent_model.player_id), None)
            if opp_sd:
                holes = " ".join(opp_sd.get("hole_cards") or [])
                hdesc = opp_sd.get("hand_name") or opp_sd.get("hand_description") or ""
                if holes:
                    showdown_detail = f" showed [{holes}{', ' + hdesc if hdesc else ''}]"

        reflection_note = (
            f"H#{hand_number}: opp line [{opp_line}] -> {ended_by}{showdown_detail} "
            f"(my net {chips_delta:+d}).".strip()
        )
        self._last_ai_outcome = (hand_number, won_flag, chips_delta, reflection_note)
        self._decision_memory.update_outcome(
            hand_number=hand_number,
            won=won_flag,
            chips_delta=chips_delta,
            note=reflection_note,
        )

        # Add a note to opponent model
        if self._opponent_model and reflection_note:
            self._opponent_model.add_note(reflection_note)
        if self._current_hand_ai_thoughts:
            for thought_payload in self._current_hand_ai_thoughts:
                thought_payload["revealed_at"] = "hand_finished"
                self._broadcast_ai_thought_payload(thought_payload)
            self._current_hand_ai_thoughts = []

    # ── AI turn ───────────────────────────────────────────────────────────────

    def set_presence(self, player_id, connected, left=False):
        self.players_connected[player_id] = connected
        if connected:
            self.absent_players.pop(player_id, None)
            if not self.absent_players:
                if self.adapter.get_public_state().can_start_next_hand:
                    self._delayed_start_task = asyncio.create_task(self._delayed_start_next_hand())
                else:
                    self._restart_turn_timer()
        else:
            self.absent_players[player_id] = 'left' if left else 'disconnected'
            if self.turn_timer_task:
                self.turn_timer_task.cancel()

    def _restart_turn_timer(self):
        # Cancel whatever is running (AI routine or human timer).
        # Note: asyncio task cancellation is cooperative — the old task may still
        # be executing until its next `await`. The _ai_lock below ensures that
        # the new AI routine will not start running until the old one fully exits.
        if self.turn_timer_task:
            self.turn_timer_task.cancel()

        if self.absent_players:
            return
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
        queued_version = (self._current_hand_number, self.adapter.table.stage, len(self.adapter.event_log()))
        async with self._ai_lock:
            if (self._current_hand_number, self.adapter.table.stage, len(self.adapter.event_log())) != queued_version:
                return
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

                version = (request.hand_number, request.stage, len(self.adapter.event_log()))
                for attempt in range(2):
                    decision = await _ai_engine.decide(request, self.ai_config)
                    current = self.adapter.get_public_state()
                    if (self._current_hand_number, current.stage, len(self.adapter.event_log())) != version or self.adapter.current_turn_player_id() != AI_SEAT_ID:
                        return
                    if decision.parse_status == "emergency_fallback":
                        continue
                    profile = self._opponent_model.summarize() if self._opponent_model else None
                    reason_text = decision.reason or 'No explanation provided by the model.'
                    tags_list = list(decision.strategy_tags)
                    entry = DecisionMemoryEntry(hand_number=request.hand_number, stage=request.stage,
                        action=decision.action, amount=decision.amount, reason=reason_text,
                        strategy_tags=tags_list, opponent_profile_labels=profile.tendency_labels if profile else [],
                        confidence=decision.confidence)
                    thought_payload = {
                        "hand_number": request.hand_number,
                        "stage": request.stage,
                        "ai_player_id": AI_SEAT_ID,
                        "action": decision.action,
                        "amount": decision.amount,
                        "thought_summary": reason_text[:300],
                        "confidence": decision.confidence,
                        "strategy_tags": tags_list,
                        "parse_status": decision.parse_status,
                    }
                    self._current_hand_ai_thoughts.append(thought_payload)
                    # Apply and confirm first. submit_action processes hand results synchronously.
                    if not self.submit_action(AI_SEAT_ID, decision.action, decision.amount):
                        if self._current_hand_ai_thoughts and self._current_hand_ai_thoughts[-1] is thought_payload:
                            self._current_hand_ai_thoughts.pop()
                        continue
                    self._decision_memory.record(entry)
                    outcome = getattr(self, '_last_ai_outcome', None)
                    if outcome and outcome[0] == request.hand_number:
                        self._decision_memory.update_outcome(outcome[0], outcome[1], outcome[2], outcome[3])
                    return

                self._dispatch_events([self.adapter._add_event("ai_unavailable", {"message": "AI 连接或响应异常，牌局暂停。请重新连接以重试。"})])

            except asyncio.CancelledError:
                # Cancelled while waiting for LLM — exit without submitting anything.
                logger.debug("AI routine cancelled during LLM call; no action submitted.")
                raise  # Re-raise so asyncio cleans up the task properly

            except Exception as e:
                logger.error("AI turn routine failed: %s", e, exc_info=True)
                self._dispatch_events([self.adapter._add_event("ai_unavailable", {"message": "AI 暂时不可用，牌局暂停。请重新连接以重试。"})])

    def _build_decision_request(self) -> AIDecisionRequest:
        """Build the AIDecisionRequest from current engine state. AI-safe: no hidden cards."""
        pub = self.adapter.get_public_state()
        ai_private = self.adapter.get_private_state(AI_SEAT_ID)
        available = self.adapter.get_available_actions(AI_SEAT_ID)

        ai_player = next((p for p in pub.players if p.player_id == AI_SEAT_ID), None)
        opponent = next((p for p in pub.players if p.player_id != AI_SEAT_ID), None)

        to_call = min(ai_player.chips, max(0, pub.current_bet - ai_player.bet_in_round)) if ai_player else 0

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
                {"action": a.action, "amount": a.amount, "min_amount": a.min_amount, "max_amount": a.max_amount}
                for a in available
            ],
            action_history=list(self._hand_action_history),
            opponent_profile_summary=profile_summary,
            previous_ai_notes=self._decision_memory.format_for_prompt(n=3),
            ai_total_bet=ai_player.total_bet if ai_player else 0,
            opponent_total_bet=opponent.total_bet if opponent else 0,
            position="button/small blind (acts first preflop, last postflop)" if pub.dealer_player_id == AI_SEAT_ID else "big blind (acts last preflop, first postflop)",
        )

    def _broadcast_ai_thought(self, thought: AIThoughtEvent):
        """Dispatch ai_thought as an EngineEvent so connection_manager forwards it."""
        # Only send thought_summary, confidence, tags — not raw prompt or API key
        self._broadcast_ai_thought_payload({
            "hand_number": thought.hand_number,
            "stage": thought.stage,
            "ai_player_id": thought.ai_player_id,
            "thought_summary": thought.thought_summary[:300],  # hard cap
            "confidence": thought.confidence,
            "strategy_tags": thought.strategy_tags,
            "parse_status": thought.parse_status,
        })

    def _broadcast_ai_thought_payload(self, payload: Dict[str, Any]):
        """Dispatch a sanitized ai_thought payload event."""
        ev = self.adapter._add_event("ai_thought", dict(payload))
        self._dispatch_events([ev])

    # ── Game end ──────────────────────────────────────────────────────────────

    def _extract_deciding_hand(self, hand_finished_ev: Optional[EngineEvent]) -> Optional[Dict[str, Any]]:
        """Extract rich snapshot of the decisive hand for game_over recap."""
        if not hand_finished_ev or not hand_finished_ev.payload:
            return None
        payload = hand_finished_ev.payload
        showdown_info = payload.get("showdown_info") or {}
        return {
            "hand_number": payload.get("hand_number"),
            "ended_by": payload.get("ended_by"),
            "awarded_pot": payload.get("awarded_pot"),
            "settlements": payload.get("settlements", []),
            "community_cards": list(payload.get("community_cards", [str(c) for c in self.adapter.table.community_cards])),
            "showdown_info": showdown_info,
            "winners": payload.get("winners") or [],
            "winning_reason": showdown_info.get("winning_reason", ""),
            "winning_reason_zh": showdown_info.get("winning_reason_zh", ""),
            "winning_cards": showdown_info.get("winning_cards", []),
        }

    def _end_game(self, deciding_hand_data: Optional[Dict[str, Any]] = None):
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

        stats = self._opponent_model.match_statistics() if self._opponent_model else None
        review_enabled = bool(stats and self.mode == 'human_vs_ai' and self.ai_config)
        game_over_ev = self.adapter._add_event("game_over", {
            "winner": winner_payload,
            "final_stacks": final_stacks,
            "deciding_hand": deciding_hand_data,
            "player_statistics": stats,
            "review_status": 'pending' if review_enabled else 'unavailable',
        })
        self._dispatch_events([game_over_ev])
        state_ev = self.adapter._add_event("state_updated", {"trigger": "game_over"})
        self._dispatch_events([state_ev])
        if review_enabled:
            try:
                asyncio.get_running_loop().create_task(self._generate_match_review(stats, winner_payload, final_stacks))
            except RuntimeError:
                self._dispatch_events([self.adapter._add_event('ai_match_review', {'status': 'error'})])

    def _build_review_observations(
        self,
        stats: dict,
        winner_payload: Optional[Dict[str, Any]] = None,
        final_stacks: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        human_id = self._opponent_model.player_id
        hands_by_number: Dict[int, Dict[str, Any]] = {}
        hand_order: List[int] = []
        current_hand = 0
        for event in self.adapter.event_log():
            if event.type == 'hand_started':
                current_hand = int(event.payload.get('hand_number', current_hand + 1))
                if current_hand not in hands_by_number:
                    hand_order.append(current_hand)
                    hands_by_number[current_hand] = {
                        'hand': current_hand,
                        'human_position': 'SB/BTN' if event.payload.get('dealer_player_id') == human_id else 'BB',
                        'actions': [],
                        'board': [],
                        'ended_by': '',
                        'pot': 0,
                        'human_net': None,
                        'showdown': [],
                    }
            elif event.type == 'player_action_applied' and current_hand in hands_by_number:
                actor = 'human' if event.payload.get('player_id') == human_id else 'ai'
                stage = event.payload.get('stage') or ''
                action = (event.payload.get('action') or '').upper()
                bet_in_round = event.payload.get('bet_in_round') or 0
                amount = event.payload.get('amount') or 0
                pot_after = event.payload.get('pot_after')
                if action in ('RAISE', 'ALL_IN') and bet_in_round > 0:
                    amt_desc = f'(to {bet_in_round})'
                elif amount > 0:
                    amt_desc = f'({amount})'
                else:
                    amt_desc = ''
                pot_desc = f' pot={pot_after}' if pot_after is not None else ''
                hands_by_number[current_hand]['actions'].append(f'{stage}:{actor}:{action}{amt_desc}{pot_desc}')
            elif event.type == 'hand_finished':
                finished_hand = int(event.payload.get('hand_number', current_hand))
                entry = hands_by_number.get(finished_hand)
                if not entry:
                    continue
                entry['ended_by'] = event.payload.get('ended_by') or ''
                entry['pot'] = event.payload.get('awarded_pot') or 0
                entry['board'] = list(event.payload.get('community_cards') or [])
                settlements = event.payload.get('settlements') or []
                human_settlement = next((item for item in settlements if item.get('player_id') == human_id), None)
                if human_settlement is not None:
                    entry['human_net'] = human_settlement.get('net_change')
                showdown_info = event.payload.get('showdown_info') or {}
                if entry['ended_by'] == 'showdown' and isinstance(showdown_info.get('players'), list):
                    entry['showdown'] = [
                        {
                            'player': 'human' if sd_player.get('player_id') == human_id else 'ai',
                            'cards': list(sd_player.get('hole_cards') or []),
                            'hand': sd_player.get('hand_name') or sd_player.get('hand_description') or '',
                        }
                        for sd_player in showdown_info['players']
                    ]

        ordered_hands = [hands_by_number[num] for num in hand_order]
        if len(ordered_hands) > 24:
            selected_nums = {item['hand'] for item in ordered_hands[:3]} | {item['hand'] for item in ordered_hands[-16:]}
            notable = sorted(
                (item for item in ordered_hands if item['hand'] not in selected_nums),
                key=lambda item: (1 if item['ended_by'] == 'showdown' else 0, item['pot']),
                reverse=True,
            )[:5]
            selected_nums |= {item['hand'] for item in notable}
            ordered_hands = [item for item in ordered_hands if item['hand'] in selected_nums]

        match_outcome = {
            'winner': ('human' if winner_payload.get('player_id') == human_id else 'ai') if winner_payload else None,
            'final_stacks': [
                {'player': 'human' if item.get('player_id') == human_id else 'ai', 'chips': item.get('chips', 0)}
                for item in (final_stacks or [])
            ],
            'total_hands': stats.get('hands', len(hand_order)),
        }
        return {
            'match_outcome': match_outcome,
            'statistics': stats,
            'hand_summaries': ordered_hands,
            'recent_hand_notes': self._opponent_model.summarize().recent_notes,
        }

    @staticmethod
    def _normalize_review_section(section: Any):
        if isinstance(section, str):
            cleaned = section.strip()
            return cleaned[:3000] if cleaned else None
        if not isinstance(section, dict):
            return None
        style_label = str(section.get('style_label') or '').strip()[:120]
        style_verdict = str(section.get('style_verdict') or '').strip()[:1200]
        play_pattern = str(section.get('play_pattern') or '').strip()[:1200]
        data_summary = str(section.get('data_summary') or '').strip()[:1200]
        raw_improvements = section.get('improvements')
        improvements: List[str] = []
        if isinstance(raw_improvements, list):
            for item in raw_improvements:
                text = str(item or '').strip()
                if text:
                    improvements.append(text[:500])
                if len(improvements) >= 5:
                    break
        elif isinstance(raw_improvements, str) and raw_improvements.strip():
            improvements.append(raw_improvements.strip()[:500])
        if not (style_verdict or play_pattern or data_summary or improvements):
            return None
        return {
            'style_label': style_label,
            'style_verdict': style_verdict,
            'play_pattern': play_pattern,
            'data_summary': data_summary,
            'improvements': improvements,
        }

    async def _generate_match_review(
        self,
        stats: dict,
        winner_payload: Optional[Dict[str, Any]] = None,
        final_stacks: Optional[List[Dict[str, Any]]] = None,
    ):
        observations = self._build_review_observations(stats, winner_payload, final_stacks)
        try:
            raw = await _ai_engine.review_match(observations, self.ai_config)
            match = re.search(r'\{[\s\S]*\}', raw)
            review = json.loads(match.group()) if match else {}
            if not isinstance(review, dict):
                raise ValueError('Invalid match review')
            zh_section = self._normalize_review_section(review.get('zh'))
            en_section = self._normalize_review_section(review.get('en'))
            if not zh_section or not en_section:
                raise ValueError('Invalid match review')
            payload = {'status': 'ready', 'zh': zh_section, 'en': en_section}
        except Exception:
            logger.warning('AI match review failed for room %s', self.room_id, exc_info=True)
            payload = {'status': 'error'}
        self._dispatch_events([self.adapter._add_event('ai_match_review', payload)])

    # ── Next hand ─────────────────────────────────────────────────────────────

    def trigger_next_hand(self):
        """Immediately trigger next hand if the previous hand is finished, skipping remaining delay."""
        if not self.adapter.get_public_state().can_start_next_hand:
            return
        if self._delayed_start_task and not self._delayed_start_task.done():
            self._delayed_start_task.cancel()
        asyncio.create_task(self._start_hand_now())

    async def _delayed_start_next_hand(self):
        try:
            await asyncio.sleep(3.5)
            await self._start_hand_now()
        except asyncio.CancelledError:
            pass

    async def _start_hand_now(self):
        if self.absent_players:
            logger.info("Cannot start next hand: absent players %s", self.absent_players)
            return
        if not self.adapter.get_public_state().can_start_next_hand:
            logger.info("Cannot start next hand: can_start_next_hand is False")
            return
        try:
            events = self.adapter.start_hand()
            self._dispatch_events(events)
            for ev in events:
                if ev.type == "hand_started":
                    self._on_hand_started(ev)
            if self.adapter.can_advance_street():
                asyncio.create_task(self._run_all_in_runout())
            else:
                self._restart_turn_timer()
        except ValueError as e:
            logger.warning("ValueError while starting next hand: %s", e)

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
