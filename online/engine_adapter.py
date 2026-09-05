from typing import List, Optional, Dict, Any
from engine_info import Action, Player, GameStage, Suit
from poker_engine import PokerTable, HandRank
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
        sb_player = self.table.players[self.table.dealer_position]
        bb_player = self.table.players[(self.table.dealer_position + 1) % len(self.table.players)]
        
        events.append(self._add_event("blinds_posted", {
            "small_blind": self.table.small_blind,
            "big_blind": self.table.big_blind,
            "small_blind_player_id": sb_player.name,
            "big_blind_player_id": bb_player.name,
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
            actions.append(AvailableAction(action="CALL", amount=call_amount, min_amount=call_amount, max_amount=call_amount))
        else:
            # Cannot even call — only ALL_IN
            actions.append(AvailableAction(action="ALL_IN", amount=player.chips, min_amount=player.chips, max_amount=player.chips))
            return actions

        # Raise: minimum is current_bet + big_blind (one big blind increment),
        # but at least current_bet * 2 when there's already a bet.
        min_raise_total = self.table.current_bet + self.table.big_blind
        if call_amount > 0:
            min_raise_total = max(min_raise_total, self.table.current_bet * 2)

        max_raise_total = player.chips + player.bet_in_round
        if player.chips > call_amount and max_raise_total >= min_raise_total:
            actions.append(AvailableAction(
                action="RAISE",
                min_amount=min_raise_total,
                max_amount=max_raise_total  # total amount (including already-bet)
            ))

        if player.chips > 0:
            # ALL_IN is always available if the player has chips
            if not any(a.action == "ALL_IN" for a in actions):
                actions.append(AvailableAction(action="ALL_IN", amount=player.chips, min_amount=player.chips, max_amount=player.chips))

        return actions

    def is_all_in_lockdown(self) -> bool:
        """True when no further actions can be taken because players are all-in."""
        active = [p for p in self.table.players if p.is_active and not p.folded]
        if len(active) <= 1:
            return False
        non_all_in = [p for p in active if not p.all_in]
        if len(non_all_in) == 0:
            return True
        if len(non_all_in) == 1:
            max_bet = max(p.bet_in_round for p in active)
            return non_all_in[0].bet_in_round >= max_bet
        return False

    def can_advance_street(self) -> bool:
        """True when table is in all-in lockdown and can advance to next street / showdown."""
        if not self.is_all_in_lockdown():
            return False
        active = [p for p in self.table.players if p.is_active and not p.folded]
        if len(active) <= 1:
            return False
        return self.table.stage != GameStage.SHOWDOWN and self.table.is_round_complete()

    def advance_single_street(self) -> List[EngineEvent]:
        """Advance exactly one stage (FLOP, TURN, RIVER, or SHOWDOWN) and return generated events."""
        if self.table.stage == GameStage.SHOWDOWN:
            return []

        events = []
        old_stage = self.table.stage
        self.table.move_to_next_stage()

        if self.table.stage != old_stage and self.table.stage != GameStage.SHOWDOWN:
            events.append(self._add_event("community_cards_dealt", {
                "stage": self.table.stage.value,
                "cards": [str(card) for card in self.table.community_cards]
            }))

        if self.table.stage == GameStage.SHOWDOWN:
            events.extend(self._finish_hand_at_showdown())

        events.append(self._add_event("state_updated", {"trigger": "street_advanced"}))
        return events

    def _finish_hand_at_showdown(self) -> List[EngineEvent]:
        events = []
        hand_number = self.table.hand_number

        pot_to_award = self.table.pot
        if pot_to_award == 0 and hasattr(self.table, "last_awarded_pot") and self.table.last_awarded_pot > 0:
            pot_to_award = self.table.last_awarded_pot

        if self.table.pot > 0:
            self.table.showdown()

        if pot_to_award == 0 and hasattr(self.table, "last_awarded_pot") and self.table.last_awarded_pot > 0:
            pot_to_award = self.table.last_awarded_pot

        result = self.table.game_result_log.get(hand_number)
        if pot_to_award == 0 and result and result.pot > 0:
            pot_to_award = result.pot

        winners_payload = []
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

        hand_rank_names = {
            HandRank.HIGH_CARD: "High Card",
            HandRank.ONE_PAIR: "Pair",
            HandRank.TWO_PAIR: "Two Pair",
            HandRank.THREE_OF_A_KIND: "Three of a Kind",
            HandRank.STRAIGHT: "Straight",
            HandRank.FLUSH: "Flush",
            HandRank.FULL_HOUSE: "Full House",
            HandRank.FOUR_OF_A_KIND: "Four of a Kind",
            HandRank.STRAIGHT_FLUSH: "Straight Flush",
            HandRank.ROYAL_FLUSH: "Royal Flush",
        }

        def card_to_code(card):
            suit_char = {
                Suit.SPADE: "S",
                Suit.HEART: "H",
                Suit.CLUB: "C",
                Suit.DIAMOND: "D"
            }[card.suit]
            rank_map = {11: 'J', 12: 'Q', 13: 'K', 14: 'A'}
            rank_char = rank_map.get(card.value, str(card.value))
            return f"{rank_char}{suit_char}"

        players_list = []
        for p in self.table.players:
            if not p.folded:
                display_name = next(
                    (s.display_name for s in self.seats if s.player_id == p.name),
                    p.name
                )
                hand_rank_enum, best_combo, hand_desc, _ = self.table.evaluate_player_best_five(p)
                hand_name = hand_rank_names.get(hand_rank_enum, hand_rank_enum.name)

                players_list.append({
                    "player_id": p.name,
                    "display_name": display_name,
                    "hole_cards": [str(c) for c in p.hand],
                    "hand_name": hand_name,
                    "hand_description": hand_desc,
                    "best_five_cards": [str(c) for c in best_combo],
                })

        winner_names = [w["display_name"] for w in winners_payload]
        winners_str = " and ".join(winner_names)
        first_winner_id = winners_payload[0]["player_id"] if winners_payload else None
        winning_cards = []
        winning_hand_desc = ""
        for p_info in players_list:
            if p_info["player_id"] == first_winner_id:
                winning_cards = p_info["best_five_cards"]
                winning_hand_desc = p_info["hand_description"]
                break

        if winning_hand_desc:
            winning_reason = f"{winners_str} wins with {winning_hand_desc}."
        else:
            winning_reason = f"{winners_str} wins."

        showdown_info = {
            "players": players_list,
            "winning_reason": winning_reason,
            "winning_cards": winning_cards
        }

        events.append(self._add_event("hand_finished", {
            "hand_number": hand_number,
            "awarded_pot": pot_to_award,
            "winners": winners_payload,
            "ended_by": "showdown",
            "showdown_info": showdown_info
        }))
        return events

    def _finish_hand_uncontested(self, active_non_folded: list) -> List[EngineEvent]:
        events = []
        hand_number = self.table.hand_number
        pot_to_award = self.table.pot
        self.table.award_pot(active_non_folded)
        if pot_to_award == 0 and hasattr(self.table, "last_awarded_pot") and self.table.last_awarded_pot > 0:
            pot_to_award = self.table.last_awarded_pot

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

        events.append(self._add_event("hand_finished", {
            "hand_number": hand_number,
            "awarded_pot": pot_to_award,
            "winners": winners_payload,
            "ended_by": "fold",
            "showdown_info": None
        }))
        return events

    def submit_action(
        self,
        player_id: str,
        action: str,
        amount: Optional[int] = None,
        step_all_in: bool = False,
    ) -> ActionResult:
        if not self.is_player_turn(player_id):
            return ActionResult(accepted=False, error_message="Not your turn.")

        player = next((p for p in self.table.players if p.name == player_id), None)
        if not player:
            return ActionResult(accepted=False, error_message="Player not found.")

        # Normalize action string → engine Action enum
        normalized = _ACTION_STRING_MAP.get(action.upper(), action.lower())
        if action.upper() in ("ALL_IN", "ALLIN"):
            normalized = "all-in"

        action_enum = None
        try:
            action_enum = Action(normalized)
        except ValueError:
            return ActionResult(accepted=False, error_message=f"Invalid action type: {action!r}")

        engine_amount = amount or 0
        if action_enum == Action.RAISE and amount is not None:
            engine_amount = amount

        initial_stage = self.table.stage
        success = self.table.process_action(player, action_enum, engine_amount, "Online Action")
        if not success:
            return ActionResult(accepted=False, error_message="Action rejected by engine.")

        # Get actual incremental bet amount placed
        actual_amount = engine_amount
        if self.table.action_history:
            last_action = self.table.action_history[-1]
            if last_action.player_name == player_id:
                actual_amount = last_action.amount

        events = []
        events.append(self._add_event("player_action_applied", {
            "player_id": player_id,
            "display_name": next(
                (s.display_name for s in self.seats if s.player_id == player_id),
                player_id
            ),
            "action": action.upper(),
            "amount": actual_amount,
            "bet_in_round": player.bet_in_round,
            "chips": player.chips,
            "pot_after": self.table.pot
        }))

        # Advance betting round / progress stages
        active_non_folded = [p for p in self.table.players if p.is_active and not p.folded]

        # Check fold condition first
        if len(active_non_folded) <= 1:
            events.extend(self._finish_hand_uncontested(active_non_folded))
        elif step_all_in and self.is_all_in_lockdown():
            # If step_all_in requested (e.g. by GameSession for staged animation delay):
            # Advance ONLY the first next street if current round is complete
            if self.table.is_round_complete() and self.table.stage != GameStage.SHOWDOWN:
                events.extend(self.advance_single_street())
        else:
            # Advance through streets until either an action is required or showdown reached
            while (
                self.table.is_round_complete()
                and len(active_non_folded) > 1
                and self.table.stage != GameStage.SHOWDOWN
            ):
                events.extend(self.advance_single_street())
                active_non_folded = [p for p in self.table.players if p.is_active and not p.folded]

        events.append(self._add_event("state_updated", {"trigger": "player_action"}))

        # Advance turn pointer if hand is still in progress and stage DID NOT change
        # (if stage changed, move_to_next_stage has already set current_player_idx)
        hand_finished = any(e.type == "hand_finished" for e in events)
        if not hand_finished and not self.table.is_round_complete() and initial_stage == self.table.stage:
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
