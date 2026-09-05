from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass
class Seat:
    player_id: str
    display_name: str

@dataclass
class PublicPlayerState:
    player_id: str
    display_name: str
    chips: int
    bet_in_round: int
    total_bet: int
    folded: bool
    all_in: bool
    is_active: bool
    # Revealed at showdown only — None pre-showdown.
    # List of card strings e.g. ["♠A", "♥K"]
    revealed_hole_cards: Optional[List[str]] = None

@dataclass
class PrivatePlayerState:
    player_id: str
    hole_cards: List[str]

@dataclass
class PublicGameState:
    seats: List[Seat]
    players: List[PublicPlayerState]
    community_cards: List[str]
    pot: int
    current_bet: int
    stage: str
    current_turn_player_id: Optional[str]
    dealer_position: int
    small_blind: int
    big_blind: int
    # ── Game-level status ────────────────────────────
    # "waiting_for_players" | "in_hand" | "hand_finished" | "game_over"
    game_status: str = "waiting_for_players"
    # Set when game_status == "game_over"
    match_winner: Optional[Dict[str, Any]] = None
    # True when hand is over AND both players still have chips
    can_start_next_hand: bool = False
    dealer_player_id: Optional[str] = None

@dataclass
class PrivateGameState:
    public_state: PublicGameState
    private_player_state: PrivatePlayerState

@dataclass
class AvailableAction:
    action: str
    amount: Optional[int] = None
    min_amount: Optional[int] = None
    max_amount: Optional[int] = None

@dataclass
class EngineEvent:
    seq: int
    type: str
    payload: Dict[str, Any]

@dataclass
class ActionRequest:
    player_id: str
    available_actions: List[AvailableAction]

@dataclass
class ActionResult:
    accepted: bool
    error_message: Optional[str] = None
    events: List[EngineEvent] = field(default_factory=list)
