"""
ai_schemas.py — Data contracts for the Adaptive Poker AI Engine.

All AI-specific schemas live here to keep them isolated from the core
game schemas in schemas.py. Nothing here touches the poker engine directly.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


# ── Per-decision request (what the AI sees) ─────────────────────────────────

@dataclass
class AIDecisionRequest:
    """
    Everything the AI is allowed to know when making a decision.
    Strictly NO opponent private hole cards before showdown.
    """
    room_id: str
    hand_number: int
    ai_player_id: str
    opponent_player_id: str
    stage: str                       # PREFLOP / FLOP / TURN / RIVER / SHOWDOWN
    hole_cards: List[str]            # AI's own private cards
    community_cards: List[str]       # public board
    pot: int
    current_bet: int                 # current round total bet to match
    to_call: int                     # chips AI actually needs to add
    ai_stack: int
    opponent_stack: int
    ai_bet_in_round: int
    opponent_bet_in_round: int
    small_blind: int
    big_blind: int
    available_actions: List[Dict[str, Any]]  # [{action, min_amount, max_amount}]
    action_history: List[Dict[str, Any]]     # this-hand public actions [{player_id, action, amount}]
    opponent_profile_summary: Optional[str] = None   # human-readable label string
    previous_ai_notes: List[str] = field(default_factory=list)  # recent decision summaries


# ── AI decision output ───────────────────────────────────────────────────────

@dataclass
class AIDecision:
    action: str                         # FOLD | CHECK | CALL | RAISE | ALL_IN
    amount: Optional[int] = None        # required for RAISE
    confidence: float = 0.5            # 0.0–1.0
    reason: str = ""                    # one short sentence
    strategy_tags: List[str] = field(default_factory=list)  # e.g. ["value-bet", "bluff"]
    parse_status: str = "ok"            # "ok" | "json_ok" | "regex_fallback" | "emergency_fallback"
    fallback_reason: Optional[str] = None


# ── ai_thought WebSocket broadcast payload ───────────────────────────────────

@dataclass
class AIThoughtEvent:
    hand_number: int
    stage: str
    ai_player_id: str
    thought_summary: str               # short, player-facing sentence
    confidence: float
    strategy_tags: List[str] = field(default_factory=list)
    parse_status: str = "ok"           # lets frontend show "(fallback)" badge if needed


# ── Session-level opponent model ─────────────────────────────────────────────

@dataclass
class OpponentProfile:
    player_id: str
    display_name: str
    hands_observed: int = 0
    vpip_count: int = 0         # voluntarily put chips in pot
    raise_count: int = 0
    call_count: int = 0
    fold_count: int = 0
    check_count: int = 0
    all_in_count: int = 0
    showdown_count: int = 0
    showdown_win_count: int = 0
    fold_to_raise_count: int = 0    # folded after opponent raised
    aggression_score: float = 0.5   # 0=passive, 1=aggressive
    looseness_score: float = 0.5    # 0=tight, 1=loose
    tendency_labels: List[str] = field(default_factory=list)
    recent_notes: List[str] = field(default_factory=list)


# ── Decision memory entry ────────────────────────────────────────────────────

@dataclass
class DecisionMemoryEntry:
    hand_number: int
    stage: str
    action: str
    amount: Optional[int]
    reason: str
    strategy_tags: List[str]
    opponent_profile_labels: List[str]
    confidence: float
    # Filled in after hand_finished:
    outcome: str = "unknown"   # "won" | "lost" | "split" | "unknown"
    chips_delta: Optional[int] = None
    result_note: str = ""
