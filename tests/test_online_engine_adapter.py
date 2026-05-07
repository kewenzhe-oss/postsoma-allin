import pytest
from online.engine_adapter import OnlinePokerEngineAdapter
from online.schemas import PublicGameState, PrivateGameState

def test_cannot_start_hand_with_less_than_two_players():
    adapter = OnlinePokerEngineAdapter()
    adapter.add_player("p1", "Player 1")
    assert adapter.can_start_hand() is False
    with pytest.raises(ValueError):
        adapter.start_hand()

def test_only_two_players_allowed():
    adapter = OnlinePokerEngineAdapter()
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    with pytest.raises(ValueError):
        adapter.add_player("p3", "Player 3")

def test_duplicate_player_id_rejected():
    adapter = OnlinePokerEngineAdapter()
    adapter.add_player("p1", "Player 1")
    with pytest.raises(ValueError):
        adapter.add_player("p1", "Player 1")

def test_start_hand_deals_private_cards_without_leaking_to_public_state():
    adapter = OnlinePokerEngineAdapter()
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()
    
    public_state = adapter.get_public_state()
    # Check that public state does not leak hole cards
    assert not hasattr(public_state, "hole_cards")
    for player in public_state.players:
        assert not hasattr(player, "hole_cards")
        
    p1_private = adapter.get_private_state("p1")
    p2_private = adapter.get_private_state("p2")
    
    assert len(p1_private.private_player_state.hole_cards) == 2
    assert len(p2_private.private_player_state.hole_cards) == 2
    assert p1_private.private_player_state.hole_cards != p2_private.private_player_state.hole_cards

def test_current_turn_player_is_available_after_start_hand():
    adapter = OnlinePokerEngineAdapter()
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()
    
    current_turn = adapter.current_turn_player_id()
    assert current_turn is not None
    assert current_turn in ["p1", "p2"]
    
    for player_id in ["p1", "p2"]:
        if player_id == current_turn:
            assert adapter.is_player_turn(player_id) is True
        else:
            assert adapter.is_player_turn(player_id) is False

def test_non_turn_player_action_is_rejected_and_state_not_mutated():
    adapter = OnlinePokerEngineAdapter()
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()
    
    current_turn = adapter.current_turn_player_id()
    non_turn = "p2" if current_turn == "p1" else "p1"
    
    public_state_before = adapter.get_public_state()
    
    result = adapter.submit_action(non_turn, "FOLD")
    assert result.accepted is False
    
    public_state_after = adapter.get_public_state()
    assert public_state_before == public_state_after

def test_current_player_can_fold():
    adapter = OnlinePokerEngineAdapter()
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()
    
    current_turn = adapter.current_turn_player_id()
    
    result = adapter.submit_action(current_turn, "FOLD")
    assert result.accepted is True
    
    event_types = [e.type for e in result.events]
    assert "player_action_applied" in event_types
    # PokerEngine automatically moves to showdown or finishes the round if folded
    # which causes a state change.
    
def test_public_state_after_action_contains_pot_chips_stage_and_turn_but_no_hole_cards():
    adapter = OnlinePokerEngineAdapter()
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()
    
    current_turn = adapter.current_turn_player_id()
    result = adapter.submit_action(current_turn, "CALL")
    assert result.accepted is True
    
    public_state = adapter.get_public_state()
    assert hasattr(public_state, "pot")
    assert hasattr(public_state, "current_bet")
    assert hasattr(public_state, "stage")
    assert hasattr(public_state, "current_turn_player_id")
    for player in public_state.players:
        assert hasattr(player, "chips")
        assert not hasattr(player, "hole_cards")

def test_event_sequence_increments_monotonically():
    adapter = OnlinePokerEngineAdapter()
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()
    
    current_turn = adapter.current_turn_player_id()
    adapter.submit_action(current_turn, "CALL")
    
    log = adapter.event_log()
    assert len(log) > 0
    
    seqs = [e.seq for e in log]
    # Check monotonic
    for i in range(1, len(seqs)):
        assert seqs[i] > seqs[i-1]

def test_unknown_player_private_state_rejected():
    adapter = OnlinePokerEngineAdapter()
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()
    
    with pytest.raises(ValueError):
        adapter.get_private_state("unknown")
