import pytest
import asyncio
from online.game_session import GameSession

@pytest.mark.asyncio
async def test_game_session_auto_starts_and_auto_folds():
    session = GameSession("room_1", "hvsh")
    session.turn_timeout_seconds = 0.1 # fast timeout for testing
    
    session.add_player("p1", "Player 1")
    session.add_player("p2", "Player 2")
    
    # Trigger start
    session.check_start()
    
    # Hand should be started
    assert len(session.adapter.event_log()) > 0
    assert session.turn_timer_task is not None
    
    current_turn = session.adapter.current_turn_player_id()
    
    # Wait for timeout
    await asyncio.sleep(0.3)
    
    # After timeout, the current_turn player should have auto-folded,
    # meaning the turn should have advanced or hand ended.
    new_turn = session.adapter.current_turn_player_id()
    assert new_turn != current_turn
    
    if session.turn_timer_task:
        session.turn_timer_task.cancel()
