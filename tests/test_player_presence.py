from unittest.mock import Mock
from online.game_session import GameSession

def test_disconnect_pauses_actions_and_timer():
    session=GameSession('presence','human_vs_human')
    session.turn_timer_task=Mock()
    session.set_presence('hero',False)
    assert session.absent_players == {'hero':'disconnected'}
    session.turn_timer_task.cancel.assert_called_once()
    assert not session.submit_action('hero','FOLD')
    session.set_presence('hero',False,left=True)
    assert session.absent_players['hero']=='left'

def test_reconnect_clears_presence_and_resumes_when_all_present():
    session=GameSession('presence','human_vs_human')
    session.absent_players={'a':'disconnected','b':'left'}
    session._restart_turn_timer=Mock()
    session.set_presence('a',True)
    session._restart_turn_timer.assert_not_called()
    session.set_presence('b',True)
    assert not session.absent_players
    session._restart_turn_timer.assert_called_once()
