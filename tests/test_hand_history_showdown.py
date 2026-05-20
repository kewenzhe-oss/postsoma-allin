import pytest
from engine_info import GameStage
from online.engine_adapter import OnlinePokerEngineAdapter

def test_fold_hand_history_safety():
    adapter = OnlinePokerEngineAdapter(small_blind=5, big_blind=10, initial_chips=1000)
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()
    
    # SB acts first preflop (dealer is SB)
    sb_id = adapter.current_turn_player_id()
    bb_id = "p2" if sb_id == "p1" else "p1"
    
    # SB folds!
    result = adapter.submit_action(sb_id, "FOLD")
    assert result.accepted is True
    
    # Check that hand_finished event was generated
    finished_event = next((e for e in result.events if e.type == "hand_finished"), None)
    assert finished_event is not None
    payload = finished_event.payload
    
    assert payload["ended_by"] == "fold"
    assert len(payload["winners"]) == 1
    assert payload["winners"][0]["player_id"] == bb_id
    assert payload["awarded_pot"] == 15  # 5 small blind + 10 big blind
    assert payload["showdown_info"] is None
    
    # Verify that folded player's hidden cards are NOT revealed in public payload
    public_state = adapter.get_public_state()
    for player in public_state.players:
        assert player.revealed_hole_cards is None

def test_showdown_reveal():
    adapter = OnlinePokerEngineAdapter(small_blind=5, big_blind=10, initial_chips=1000)
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()
    
    sb_id = adapter.current_turn_player_id()
    bb_id = "p2" if sb_id == "p1" else "p1"
    
    # Preflop
    adapter.submit_action(sb_id, "CALL")
    adapter.submit_action(bb_id, "CHECK")
    
    # Flop
    assert adapter.current_turn_player_id() == bb_id
    adapter.submit_action(bb_id, "CHECK")
    adapter.submit_action(sb_id, "CHECK")
    
    # Turn
    assert adapter.current_turn_player_id() == bb_id
    adapter.submit_action(bb_id, "CHECK")
    adapter.submit_action(sb_id, "CHECK")
    
    # River
    assert adapter.current_turn_player_id() == bb_id
    adapter.submit_action(bb_id, "CHECK")
    result = adapter.submit_action(sb_id, "CHECK")
    
    # Hand must be finished at showdown
    finished_event = next((e for e in result.events if e.type == "hand_finished"), None)
    assert finished_event is not None
    payload = finished_event.payload
    
    assert payload["ended_by"] == "showdown"
    assert "showdown_info" in payload
    showdown_info = payload["showdown_info"]
    assert showdown_info is not None
    assert "players" in showdown_info
    assert len(showdown_info["players"]) == 2
    
    for p in showdown_info["players"]:
        assert "player_id" in p
        assert "display_name" in p
        assert "hole_cards" in p
        assert len(p["hole_cards"]) == 2
        assert "hand_name" in p
        
    assert "winning_reason" in showdown_info
    assert len(payload["winners"]) >= 1

def test_history_event_order():
    adapter = OnlinePokerEngineAdapter(small_blind=5, big_blind=10, initial_chips=1000)
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()
    
    sb_id = adapter.current_turn_player_id()
    bb_id = "p2" if sb_id == "p1" else "p1"
    
    adapter.submit_action(sb_id, "CALL")
    adapter.submit_action(bb_id, "CHECK")
    
    # Flop
    adapter.submit_action(bb_id, "CHECK")
    adapter.submit_action(sb_id, "CHECK")
    
    # Turn
    adapter.submit_action(bb_id, "CHECK")
    adapter.submit_action(sb_id, "CHECK")
    
    # River
    adapter.submit_action(bb_id, "CHECK")
    adapter.submit_action(sb_id, "CHECK")
    
    # Get all event log
    log = adapter.event_log()
    types = [e.type for e in log]
    
    assert types.count("hand_started") == 1
    assert types.count("blinds_posted") == 1
    assert types.count("hand_finished") == 1
    
    # Verify sequence
    idx_start = types.index("hand_started")
    idx_blinds = types.index("blinds_posted")
    idx_flop = types.index("community_cards_dealt")
    idx_finished = types.index("hand_finished")
    
    assert idx_start < idx_blinds
    assert idx_blinds < idx_flop
    assert idx_flop < idx_finished
