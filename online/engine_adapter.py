from typing import List, Optional, Dict, Any
from engine_info import Action, Player, GameStage
from poker_engine import PokerTable
from online.schemas import (
    Seat, PublicPlayerState, PrivatePlayerState, PublicGameState,
    PrivateGameState, AvailableAction, EngineEvent, ActionRequest, ActionResult
)

# Map frontend action strings to engine Action enum values
_ACTION_STRING_MAP: Dict[str, str] = {
    "FOLD":    "fold",
    "CHECK":   "check",
    "CALL":    "call",
    "RAISE":   "raise",
    "ALL_IN":  "all-in",
    # Also accept lowercase variants directly
    "fold":    "fold",
    "check":   "check",
    "call":    "call",
    "raise":   "raise",
    "all_in":  "all-in",
    "all-in":  "all-in",
}


class OnlinePokerEngineAdapter:
    def __init__(
        self,
        small_blind: int = 5,
        big_blind: int = 10,
        initial_chips: int = 1000,
    ):
        self.table = PokerTable(small_blind=small_blind, big_blind=big_blind, max_players=2)
        self.initial_chips = initial_chips
        self.seats: List[Seat] = []
        self._seq = 0
        self._events: List[EngineEvent] = []
        self._game_over: bool = False  # set True once a player runs out of chips after a hand

    def _next_seq(self) -> int:
        self._seq += 1
        return self._seq

    def _add_event(self, event_type: str, payload: Dict[str, Any]) -> EngineEvent:
        event = EngineEvent(seq=self._next_seq(), type=event_type, payload=payload)
        self._events.append(event)
        return event

    def add_player(self, player_id: str, display_name: str) -> None:
        if len(self.seats) >= 2:
            raise ValueError("Maximum 2 players allowed.")
        if any(seat.player_id == player_id for seat in self.seats):
            raise ValueError(f"Player ID {player_id} already exists.")
            
        self.seats.append(Seat(player_id=player_id, display_name=display_name))
        
        # Add to underlying PokerTable — use player_id as the internal name
        player = Player(name=player_id, chips=self.initial_chips)
        self.table.add_player(player)

    def can_start_hand(self) -> bool:
        return len(self.seats) == 2

    def start_hand(self) -> List[EngineEvent]:
        if not self.can_start_hand():
            raise ValueError("Need exactly 2 players to start a hand.")
            
        self.table.start_new_hand()
        
        events = []
        events.append(self._add_event("hand_started", {"hand_number": self.table.hand_number}))
        events.append(self._add_event("blinds_posted", {
            "small_blind": self.table.small_blind,
            "big_blind": self.table.big_blind,
            "pot": self.table.pot
        }))
        
        # Private hole cards — each sent separately so connection_manager can filter by player
        for p in self.table.players:
            display_name = next((s.display_name for s in self.seats if s.player_id == p.name), p.name)
            events.append(self._add_event("private_hole_cards", {
                "player_id": p.name,
                "display_name": display_name,
                "cards": [str(card) for card in p.hand]
            }))
            
        events.append(self._add_event("state_updated", {"trigger": "hand_started"}))
        return events

    def get_public_state(self) -> PublicGameState:
        # Only reveal hole cards at/after showdown
        is_showdown = self.table.stage == GameStage.SHOWDOWN

        players = []
        for p in self.table.players:
            display_name = next(
                (s.display_name for s in self.seats if s.player_id == p.name),
                p.name
            )
            # Reveal cards only when the hand has reached showdown AND player hasn't folded
            revealed = None
            if is_showdown and not p.folded and p.hand:
                revealed = [str(card) for card in p.hand]

            players.append(PublicPlayerState(
                player_id=p.name,
                display_name=display_name,
                chips=p.chips,
                bet_in_round=p.bet_in_round,
                total_bet=p.total_bet,
                folded=p.folded,
                all_in=p.all_in,
                is_active=p.is_active,
                revealed_hole_cards=revealed
            ))

        # ── Compute game-level status ────────────────────────
        has_started = bool(self._events)  # any events = hand has started
        bankrupt = [p for p in self.table.players if p.chips <= 0]

        if self._game_over:
            game_status = "game_over"
        elif not has_started or len(self.seats) < 2:
            game_status = "waiting_for_players"
        elif is_showdown:
            game_status = "showdown"
        else:
            game_status = "in_hand"

        # match_winner is set only on game_over
        match_winner = None
        if self._game_over:
            winner_player = next(
                (p for p in self.table.players if p.chips > 0),
                None
            )
            if winner_player:
                dn = next(
                    (s.display_name for s in self.seats if s.player_id == winner_player.name),
                    winner_player.name
                )
                match_winner = {
                    "player_id": winner_player.name,
                    "display_name": dn,
                    "chips": winner_player.chips
                }

        # can_start_next_hand: hand finished, both players solvent, not game_over
        solvent_count = sum(1 for p in self.table.players if p.chips > 0)
        can_next = (
            not self._game_over
            and has_started
            and solvent_count == 2
            and self.table.is_round_complete()
        )

        return PublicGameState(
            seats=self.seats,
            players=players,
            community_cards=[str(card) for card in self.table.community_cards],
            pot=self.table.pot,
            current_bet=self.table.current_bet,
            stage=self.table.stage.value,
            current_turn_player_id=self.current_turn_player_id(),
            dealer_position=self.table.dealer_position,
            small_blind=self.table.small_blind,
            big_blind=self.table.big_blind,
            game_status=game_status,
            match_winner=match_winner,
            can_start_next_hand=can_next
        )

    def get_private_state(self, player_id: str) -> PrivateGameState:
        player = next((p for p in self.table.players if p.name == player_id), None)
        if not player:
            raise ValueError(f"Unknown player_id {player_id}")
            
        return PrivateGameState(
            public_state=self.get_public_state(),
            private_player_state=PrivatePlayerState(
                player_id=player_id,
                hole_cards=[str(card) for card in player.hand]
            )
        )

    def get_available_actions(self, player_id: str) -> List[AvailableAction]:
        if not self.is_player_turn(player_id):
            return []
            
        player = next((p for p in self.table.players if p.name == player_id), None)
        if not player:
            return []

        actions = []
        actions.append(AvailableAction(action="FOLD"))

        call_amount = self.table.current_bet - player.bet_in_round

        if call_amount <= 0:
            # No bet to call — player can check
            actions.append(AvailableAction(action="CHECK"))
        elif player.chips >= call_amount:
            actions.append(AvailableAction(action="CALL"))
        else:
            # Cannot even call — only ALL_IN
            actions.append(AvailableAction(action="ALL_IN"))
            return actions

        # Raise: minimum is current_bet + big_blind (one big blind increment),
        # but at least current_bet * 2 when there's already a bet.
        # Use table.big_blind as the minimum raise size.
        min_raise_total = self.table.current_bet + self.table.big_blind
        if call_amount > 0:
            # Standard: must raise by at least the size of the previous raise/bet
            min_raise_total = max(min_raise_total, self.table.current_bet * 2)

        if player.chips > call_amount and player.chips >= min_raise_total:
            actions.append(AvailableAction(
                action="RAISE",
                min_amount=min_raise_total,
                max_amount=player.chips + player.bet_in_round  # total amount (including already-bet)
            ))

        if player.chips > 0:
            # ALL_IN is always available if the player has chips
            # (avoid duplicate if already added above)
            if not any(a.action == "ALL_IN" for a in actions):
                actions.append(AvailableAction(action="ALL_IN"))

        return actions

    def submit_action(
        self,
        player_id: str,
        action: str,
        amount: Optional[int] = None,
    ) -> ActionResult:
        if not self.is_player_turn(player_id):
            return ActionResult(accepted=False, error_message="Not your turn.")
            
        player = next((p for p in self.table.players if p.name == player_id), None)
        if not player:
            return ActionResult(accepted=False, error_message="Player not found.")

        # Normalize action string → engine Action enum
        normalized = _ACTION_STRING_MAP.get(action.upper(), action.lower())
        # Special case: "all_in" isn't in the map, handle separately
        if action.upper() in ("ALL_IN", "ALLIN"):
            normalized = "all-in"

        action_enum = None
        try:
            action_enum = Action(normalized)
        except ValueError:
            return ActionResult(accepted=False, error_message=f"Invalid action type: {action!r}")

        # For RAISE: amount here is the TOTAL round bet the player wants to reach,
        # but poker_engine.process_action expects the incremental raise amount.
        # Convert if needed.
        engine_amount = amount or 0
        if action_enum == Action.RAISE and amount is not None:
            # Frontend sends absolute total; engine expects total amount to place_bet
            # (engine's place_bet already caps by chips, so pass total target)
            engine_amount = amount

        # Capture pot BEFORE action (for reporting in events)
        pot_before = self.table.pot

        success = self.table.process_action(player, action_enum, engine_amount, "Online Action")
        if not success:
            return ActionResult(accepted=False, error_message="Action rejected by engine.")

        events = []
        events.append(self._add_event("player_action_applied", {
            "player_id": player_id,
            "display_name": next(
                (s.display_name for s in self.seats if s.player_id == player_id),
                player_id
            ),
            "action": action.upper(),
            "amount": engine_amount,
            "pot_after": self.table.pot
        }))

        # Advance betting round / progress stages
        old_stage = self.table.stage
        active_non_folded = [p for p in self.table.players if p.is_active and not p.folded]

        while (
            self.table.is_round_complete()
            and len(active_non_folded) > 1
            and self.table.stage != GameStage.SHOWDOWN
        ):
            self.table.move_to_next_stage()
            if old_stage != self.table.stage:
                events.append(self._add_event("community_cards_dealt", {
                    "stage": self.table.stage.value,
                    "cards": [str(card) for card in self.table.community_cards]
                }))
                old_stage = self.table.stage
            active_non_folded = [p for p in self.table.players if p.is_active and not p.folded]

        # Check hand end conditions
        # NOTE: When stage == SHOWDOWN, trigger immediately — do NOT wait for another
        # player action (is_round_complete() may be False right after stage transition).
        hand_number = self.table.hand_number
        hand_finished = False

        at_showdown = self.table.stage == GameStage.SHOWDOWN
        if at_showdown or (self.table.is_round_complete() and len(active_non_folded) <= 1):
            # Capture pot BEFORE award
            pot_to_award = self.table.pot

            if (
                self.table.stage != GameStage.SHOWDOWN
                and len(active_non_folded) <= 1
            ):
                # Uncontested: award pot directly
                self.table.award_pot(active_non_folded)
            elif self.table.stage == GameStage.SHOWDOWN:
                # showdown() calls award_pot internally; check if it was already called
                if self.table.pot > 0:
                    self.table.showdown()

            # Build winners from game_result_log
            winners_payload = []
            result = self.table.game_result_log.get(hand_number)
            if result:
                for wi in result.winners:
                    display_name = next(
                        (s.display_name for s in self.seats if s.player_id == wi.player_name),
                        wi.player_name
                    )
                    winners_payload.append({
                        "player_id": wi.player_name,
                        "display_name": display_name,
                        "amount": wi.amount
                    })

            # Determine ended_by
            ended_by = "showdown" if self.table.stage == GameStage.SHOWDOWN else "fold"

            events.append(self._add_event("hand_finished", {
                "hand_number": hand_number,
                "awarded_pot": pot_to_award,
                "winners": winners_payload,
                "ended_by": ended_by
            }))
            hand_finished = True

        events.append(self._add_event("state_updated", {"trigger": "player_action"}))

        # Advance turn pointer if hand is still in progress
        if not hand_finished and not self.table.is_round_complete():
            self.table.next_player()

        return ActionResult(accepted=True, events=events)

    def is_player_turn(self, player_id: str) -> bool:
        return self.current_turn_player_id() == player_id

    def current_turn_player_id(self) -> Optional[str]:
        if not self.table.players:
            return None
        if self._game_over or self.table.stage == GameStage.SHOWDOWN:
            return None

        idx = self.table.current_player_idx
        if 0 <= idx < len(self.table.players):
            player = self.table.players[idx]
            if player.is_active and not player.folded and not player.all_in:
                return player.name

        return None

    def event_log(self) -> List[EngineEvent]:
        return self._events.copy()
