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
        self._vpip_count = 0
        self._vpip_this_hand = False
        self._pfr_count = 0
        self._pfr_this_hand = False
        self._river_aggression_count = 0
        self._postflop_aggressive_this_hand = False
        self._aggressive_this_hand = False
        self._pressure_opportunities = 0      # any non-check, non-fold preflop action

        # Showdown stats
        self._showdown_count = 0
        self._showdown_win_count = 0
        self._aggressive_showdown_count = 0
        self._bluff_showdown_count = 0

        # Pressure response: did opponent fold after AI raised?
        self._fold_to_raise_count = 0
        self._last_ai_raised_this_hand: bool = False

        # Hand tracking
        self._hands_observed = 0
        self._current_hand: int = -1

        # Short notes ring buffer (max 5)
        self._notes: List[str] = []
        self._current_hand_actions: List[str] = []

    # ── Public interface ──────────────────────────────────────────────────────

    def new_hand(self, hand_number: int):
        """Call at hand_started to reset per-hand tracking."""
        if hand_number != self._current_hand:
            if self._current_hand >= 0:
                self._hands_observed += 1
            self._current_hand = hand_number
            self._last_ai_raised_this_hand = False
            self._vpip_this_hand = False
            self._pfr_this_hand = False
            self._postflop_aggressive_this_hand = False
            self._aggressive_this_hand = False
            self._current_hand_actions = []

    def observe_ai_raised(self):
        """Called when AI raised this street, to track opponent fold-to-raise."""
        self._last_ai_raised_this_hand = True

    def observe_action(self, player_id: str, action: str, amount: int, stage: str, previous_bet: Optional[int] = None):
        """
        Record an opponent action from a player_action_applied event.
        Only called when player_id matches this tracker's target.
        """
        if player_id != self.player_id:
            return

        action_upper = action.upper()
        stage_lower = (stage or "").lower()
        aggressive_action = action_upper == 'RAISE' or (action_upper in ('ALL_IN', 'ALL-IN') and (previous_bet is None or amount > previous_bet))
        if self._last_ai_raised_this_hand:
            self._pressure_opportunities += 1
            if action_upper == 'FOLD':
                self._fold_to_raise_count += 1
            self._last_ai_raised_this_hand = False
        if stage_lower == 'preflop' and action_upper in ('CALL','RAISE','ALL_IN','ALL-IN') and not self._vpip_this_hand:
            self._vpip_count += 1
            self._vpip_this_hand = True
        if stage_lower == 'preflop' and aggressive_action and not self._pfr_this_hand:
            self._pfr_count += 1
            self._pfr_this_hand = True
        if aggressive_action:
            self._aggressive_this_hand = True
            if stage_lower in ('flop', 'turn', 'river'):
                self._postflop_aggressive_this_hand = True
            if stage_lower == 'river':
                self._river_aggression_count += 1

        if action_upper == "RAISE":
            self._raise_count += 1
        elif action_upper == "CALL":
            self._call_count += 1
        elif action_upper == "CHECK":
            self._check_count += 1
        elif action_upper == "FOLD":
            self._fold_count += 1
            if self._last_ai_raised_this_hand:
                self._fold_to_raise_count += 1
                self._last_ai_raised_this_hand = False
        elif action_upper in ("ALL_IN", "ALL-IN"):
            self._all_in_count += 1

        amt_str = f"({amount})" if amount and amount > 0 else ""
        stage_short = (stage or "?").lower()
        self._current_hand_actions.append(f"{stage_short}:{action_upper}{amt_str}")

    def observe_hand_result(
        self,
        hand_number: int,
        winners: list,
        ai_player_id: str,
        ended_by: str = "",
        showdown_info: Optional[Dict] = None,
    ):
        """
        Update showdown stats from hand_finished event.
        winners = [{"player_id": ..., "display_name": ..., "amount": ...}]
        A showdown is inferred when both players went to showdown (ended_by=showdown);
        simple heuristic: if opponent appears in winners and hand went to showdown.
        """
        if ended_by != "showdown":
            return
        winner_ids = {w.get("player_id") for w in winners}
        # Only count if BOTH players contributed (i.e., not a walk/fold win)
        if self.player_id in winner_ids or ai_player_id in winner_ids:
            self._showdown_count += 1
            opp_won_exclusively = self.player_id in winner_ids and ai_player_id not in winner_ids
            if opp_won_exclusively:
                self._showdown_win_count += 1

            # Track bluff frequency at showdown when opponent took an aggressive line
            if self._postflop_aggressive_this_hand or self._aggressive_this_hand:
                self._aggressive_showdown_count += 1
                opp_hand_name = ""
                if showdown_info and isinstance(showdown_info.get("players"), list):
                    opp_sd = next((p for p in showdown_info["players"] if p.get("player_id") == self.player_id), None)
                    if opp_sd:
                        opp_hand_name = str(opp_sd.get("hand_name") or opp_sd.get("hand_description") or "").lower()
                is_air = "high card" in opp_hand_name or "高牌" in opp_hand_name
                if is_air or (self._postflop_aggressive_this_hand and not opp_won_exclusively and self.player_id not in winner_ids):
                    self._bluff_showdown_count += 1

    def add_note(self, note: str):
        """Add a short observation note (max 6 kept, oldest dropped)."""
        self._notes.append(note)
        if len(self._notes) > 6:
            self._notes.pop(0)

    def match_statistics(self) -> dict:
        hands = self._hands_observed + (1 if self._current_hand >= 0 else 0)
        return {
            'hands': hands,
            'vpip_count': self._vpip_count,
            'pfr_count': self._pfr_count,
            'pressure_opportunities': self._pressure_opportunities,
            'fold_to_pressure_count': self._fold_to_raise_count,
            'showdowns': self._showdown_count,
            'showdown_wins': self._showdown_win_count,
            'river_aggression_count': self._river_aggression_count,
        }

    def format_current_hand_line(self) -> str:
        """Return compact trajectory of opponent actions in the current hand."""
        if not self._current_hand_actions:
            return "no actions"
        return " -> ".join(self._current_hand_actions)

    def summarize(self) -> OpponentProfile:
        """Compute derived scores and tendency labels."""
        total_actions = (
            self._raise_count + self._call_count +
            self._check_count + self._fold_count + self._all_in_count
        )
        hands_seen = max(1, self._hands_observed + (1 if self._current_hand >= 0 else 0))

        # Aggression: (raise + all_in) / (raise + all_in + call + check)
        non_fold = total_actions - self._fold_count
        aggression = (
            (self._raise_count + self._all_in_count) / non_fold
            if non_fold > 0 else 0.3
        )

        # Looseness: vpip / total actions (rough proxy)
        looseness = (
            self._vpip_count / hands_seen
            if total_actions > 0 else 0.3
        )

        bluff_rate = (
            self._bluff_showdown_count / self._aggressive_showdown_count
            if self._aggressive_showdown_count > 0 else 0.0
        )

        labels = ['Observations only; infer tendencies cautiously, especially with small samples.',
                  f'Voluntary preflop hands={self._vpip_count}/{hands_seen}',
                  f'Preflop raises={self._pfr_count}/{hands_seen}',
                  f'Folds facing AI pressure={self._fold_to_raise_count}/{self._pressure_opportunities}',
                  f'Caught bluffing / failed pressure at showdown={self._bluff_showdown_count}/{self._aggressive_showdown_count}']
        derived = _compute_tendency_labels(
            aggression=aggression,
            looseness=looseness,
            fold_to_raise=self._fold_to_raise_count,
            all_in_count=self._all_in_count,
            total_actions=total_actions,
            showdown_win=self._showdown_win_count,
            showdown=self._showdown_count,
            bluff_showdowns=self._bluff_showdown_count,
            river_aggression=self._river_aggression_count,
        )
        for item in derived:
            if item == "unknown / insufficient data":
                continue
            if item not in labels and "overfolds" not in item:
                labels.append(item)
            elif "overfolds" in item and self._pressure_opportunities >= 3 and (self._fold_to_raise_count / self._pressure_opportunities) >= 0.67:
                labels.append(item)

        adaptation = _compute_adaptation_guidance(
            aggression=aggression,
            looseness=looseness,
            fold_to_raise=self._fold_to_raise_count,
            pressure_opps=self._pressure_opportunities,
            bluff_showdowns=self._bluff_showdown_count,
            river_aggression=self._river_aggression_count,
            total_actions=total_actions,
        )

        return OpponentProfile(
            player_id=self.player_id,
            display_name=self.display_name,
            hands_observed=self._hands_observed,
            vpip_count=self._vpip_count,
            pfr_count=self._pfr_count,
            raise_count=self._raise_count,
            call_count=self._call_count,
            fold_count=self._fold_count,
            check_count=self._check_count,
            all_in_count=self._all_in_count,
            river_aggression_count=self._river_aggression_count,
            aggressive_showdown_count=self._aggressive_showdown_count,
            bluff_showdown_count=self._bluff_showdown_count,
            showdown_count=self._showdown_count,
            showdown_win_count=self._showdown_win_count,
            fold_to_raise_count=self._fold_to_raise_count,
            aggression_score=round(aggression, 2),
            looseness_score=round(looseness, 2),
            bluff_rate=round(bluff_rate, 2),
            tendency_labels=labels,
            adaptation_guidance=adaptation,
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
    bluff_showdowns: int = 0,
    river_aggression: int = 0,
) -> List[str]:
    """
    Generate human-readable tendency labels for the opponent.
    These are used in the AI prompt to adapt strategy.
    """
    labels: List[str] = []

    if total_actions < 6:
        if bluff_showdowns >= 1:
            return ["capable of bluffing"]
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
    if bluff_showdowns >= 1 or river_aggression >= 2:
        labels.append("frequent bluffer / river pressure")
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


def _compute_adaptation_guidance(
    aggression: float,
    looseness: float,
    fold_to_raise: int,
    pressure_opps: int,
    bluff_showdowns: int,
    river_aggression: int,
    total_actions: int,
) -> str:
    """Produce concise tactical adjustments based on observed player style."""
    tips: List[str] = []
    if bluff_showdowns >= 1 or (river_aggression >= 2 and aggression >= 0.5):
        tips.append("Opponent bluffs / applies heavy river pressure -> widen bluff-catching calls with medium-strength made hands and trap with strong hands.")
    if pressure_opps >= 2 and (fold_to_raise / pressure_opps) >= 0.65:
        tips.append("Opponent folds often to aggression -> increase continuation bets and positional steals.")
    elif looseness >= 0.6 and aggression < 0.35 and total_actions >= 3:
        tips.append("Opponent is a loose-passive caller -> avoid pure bluffs and value-bet thinner with top/middle pair.")
    elif looseness <= 0.35 and aggression >= 0.5 and total_actions >= 4:
        tips.append("Opponent is tight-aggressive -> respect large raises unless holding strong equity.")
    return " ".join(tips)
