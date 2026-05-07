"""
opponent_model.py — Session-level opponent modeling from public information only.

Tracks what the opponent does (actions, showdowns) across the current match.
Cleared when the session ends; never written to any database.

Data sources (all public):
  - player_action_applied events: action, amount, player_id
  - hand_finished events: winners list (who won = showdown result)

NOT used (private info):
  - opponent hole cards before showdown
"""

import logging
from typing import Dict, List, Optional
from online.ai_schemas import OpponentProfile

logger = logging.getLogger(__name__)


class OpponentModelTracker:
    """
    Maintains running statistics about the opponent across the session.
    Call observe_action() for every player_action_applied event,
    and observe_hand_result() for every hand_finished event.
    """

    def __init__(self, player_id: str, display_name: str):
        self.player_id = player_id
        self.display_name = display_name

        # Action counts
        self._raise_count = 0
        self._call_count = 0
        self._check_count = 0
        self._fold_count = 0
        self._all_in_count = 0
        self._vpip_count = 0      # any non-check, non-fold preflop action

        # Showdown stats
        self._showdown_count = 0
        self._showdown_win_count = 0

        # Pressure response: did opponent fold after AI raised?
        self._fold_to_raise_count = 0
        self._last_ai_raised_this_hand: bool = False

        # Hand tracking
        self._hands_observed = 0
        self._current_hand: int = -1

        # Short notes ring buffer (max 5)
        self._notes: List[str] = []

    # ── Public interface ──────────────────────────────────────────────────────

    def new_hand(self, hand_number: int):
        """Call at hand_started to reset per-hand tracking."""
        if hand_number != self._current_hand:
            if self._current_hand >= 0:
                self._hands_observed += 1
            self._current_hand = hand_number
            self._last_ai_raised_this_hand = False

    def observe_ai_raised(self):
        """Called when AI raised this street, to track opponent fold-to-raise."""
        self._last_ai_raised_this_hand = True

    def observe_action(self, player_id: str, action: str, amount: int, stage: str):
        """
        Record an opponent action from a player_action_applied event.
        Only called when player_id matches this tracker's target.
        """
        if player_id != self.player_id:
            return

        action_upper = action.upper()

        if action_upper == "RAISE":
            self._raise_count += 1
            self._vpip_count += 1
        elif action_upper == "CALL":
            self._call_count += 1
            self._vpip_count += 1
        elif action_upper == "CHECK":
            self._check_count += 1
        elif action_upper == "FOLD":
            self._fold_count += 1
            if self._last_ai_raised_this_hand:
                self._fold_to_raise_count += 1
                self._last_ai_raised_this_hand = False
        elif action_upper in ("ALL_IN", "ALL-IN"):
            self._all_in_count += 1
            self._vpip_count += 1

    def observe_hand_result(self, hand_number: int, winners: list, ai_player_id: str):
        """
        Update showdown stats from hand_finished event.
        winners = [{"player_id": ..., "display_name": ..., "amount": ...}]
        A showdown is inferred when both players went to showdown (ended_by=showdown);
        simple heuristic: if opponent appears in winners and hand went to showdown.
        """
        winner_ids = {w.get("player_id") for w in winners}
        # Only count if BOTH players contributed (i.e., not a walk/fold win)
        if self.player_id in winner_ids or ai_player_id in winner_ids:
            self._showdown_count += 1
            if self.player_id in winner_ids:
                self._showdown_win_count += 1

    def add_note(self, note: str):
        """Add a short observation note (max 5 kept, oldest dropped)."""
        self._notes.append(note)
        if len(self._notes) > 5:
            self._notes.pop(0)

    def summarize(self) -> OpponentProfile:
        """Compute derived scores and tendency labels."""
        total_actions = (
            self._raise_count + self._call_count +
            self._check_count + self._fold_count + self._all_in_count
        )

        # Aggression: (raise + all_in) / (raise + all_in + call + check)
        non_fold = total_actions - self._fold_count
        aggression = (
            (self._raise_count + self._all_in_count) / non_fold
            if non_fold > 0 else 0.3
        )

        # Looseness: vpip / total actions (rough proxy)
        looseness = (
            self._vpip_count / total_actions
            if total_actions > 0 else 0.3
        )

        labels = _compute_tendency_labels(
            aggression=aggression,
            looseness=looseness,
            fold_to_raise=self._fold_to_raise_count,
            all_in_count=self._all_in_count,
            total_actions=total_actions,
            showdown_win=self._showdown_win_count,
            showdown=self._showdown_count,
        )

        return OpponentProfile(
            player_id=self.player_id,
            display_name=self.display_name,
            hands_observed=self._hands_observed,
            vpip_count=self._vpip_count,
            raise_count=self._raise_count,
            call_count=self._call_count,
            fold_count=self._fold_count,
            check_count=self._check_count,
            all_in_count=self._all_in_count,
            showdown_count=self._showdown_count,
            showdown_win_count=self._showdown_win_count,
            fold_to_raise_count=self._fold_to_raise_count,
            aggression_score=round(aggression, 2),
            looseness_score=round(looseness, 2),
            tendency_labels=labels,
            recent_notes=list(self._notes),
        )


# ── Label generator ──────────────────────────────────────────────────────────

def _compute_tendency_labels(
    aggression: float,
    looseness: float,
    fold_to_raise: int,
    all_in_count: int,
    total_actions: int,
    showdown_win: int,
    showdown: int,
) -> List[str]:
    """
    Generate human-readable tendency labels for the opponent.
    These are used in the AI prompt to adapt strategy.
    """
    labels: List[str] = []

    if total_actions < 6:
        return ["unknown / insufficient data"]

    # Primary style
    if aggression >= 0.5 and looseness >= 0.5:
        labels.append("loose-aggressive")
    elif aggression >= 0.5 and looseness < 0.5:
        labels.append("tight-aggressive")
    elif aggression < 0.3 and looseness >= 0.5:
        labels.append("loose-passive")
    elif aggression < 0.3 and looseness < 0.4:
        labels.append("tight-passive")

    # Special tendencies
    if fold_to_raise >= 3:
        labels.append("overfolds to pressure")
    if all_in_count >= 2 and total_actions < 20:
        labels.append("frequent all-in")
    if showdown > 0 and (showdown_win / showdown) >= 0.7:
        labels.append("strong showdown hands")
    if showdown > 0 and (showdown_win / showdown) <= 0.3:
        labels.append("weak showdown hands")

    # Passive indicators
    if aggression < 0.15:
        labels.append("rarely raises")
    if looseness < 0.25:
        labels.append("very tight")

    return labels if labels else ["balanced"]
