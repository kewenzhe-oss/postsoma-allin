import pytest
from online.engine_adapter import OnlinePokerEngineAdapter
from engine_info import GameStage

def test_sb_calls_bb_checks():
    # Initial setup
    adapter = OnlinePokerEngineAdapter(small_blind=5, big_blind=10, initial_chips=1000)
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()
    
    # Check who the SB is. SB acts first preflop.
    sb_id = adapter.current_turn_player_id()
    assert sb_id is not None
    bb_id = "p2" if sb_id == "p1" else "p1"
    
    # SB calls (places 5 more chips to match BB's 10)
    result = adapter.submit_action(sb_id, "CALL")
    assert result.accepted is True
    
    # Verification after SB calls
    assert adapter.current_turn_player_id() == bb_id
    assert adapter.table.stage == GameStage.PREFLOP
    
    # Check available actions for BB
    available_actions = adapter.get_available_actions(bb_id)
    action_names = [a.action for a in available_actions]
    assert "CHECK" in action_names
    assert "RAISE" in action_names
    
    # BB checks
    result_bb = adapter.submit_action(bb_id, "CHECK")
    assert result_bb.accepted is True
    
    # Verification after BB checks
    assert adapter.table.stage == GameStage.FLOP

def test_sb_calls_bb_raises():
    adapter = OnlinePokerEngineAdapter(small_blind=5, big_blind=10, initial_chips=1000)
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()
    
    sb_id = adapter.current_turn_player_id()
    bb_id = "p2" if sb_id == "p1" else "p1"
    
    # SB calls
    result = adapter.submit_action(sb_id, "CALL")
    assert result.accepted is True
    
    # BB raises to 30
    result_bb = adapter.submit_action(bb_id, "RAISE", amount=30)
    assert result_bb.accepted is True
    
    # Verification after BB raises
    assert adapter.current_turn_player_id() == sb_id
    assert adapter.table.stage == GameStage.PREFLOP
    
    # SB available actions
    available_actions = adapter.get_available_actions(sb_id)
    action_names = [a.action for a in available_actions]
    assert "FOLD" in action_names
    assert "CALL" in action_names
    assert "RAISE" in action_names

def test_sb_raises_bb_calls():
    adapter = OnlinePokerEngineAdapter(small_blind=5, big_blind=10, initial_chips=1000)
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()
    
    sb_id = adapter.current_turn_player_id()
    bb_id = "p2" if sb_id == "p1" else "p1"
    
    # SB raises to 30
    result = adapter.submit_action(sb_id, "RAISE", amount=30)
    assert result.accepted is True
    
    # BB calls (places 20 more chips to match 30)
    result_bb = adapter.submit_action(bb_id, "CALL")
    assert result_bb.accepted is True
    
    # Verification after BB calls
    assert adapter.table.stage == GameStage.FLOP
