from poker_engine import PokerTable
from engine_info import Player, Action
from online.ai_action_parser import parse_response

def table():
    t = PokerTable()
    a, b = Player('a', 200), Player('b', 200)
    t.players = [a, b]
    t.current_bet = 10
    return t, a, b

def test_previous_raise_increment_controls_minimum():
    t, a, b = table()
    assert t.process_action(a, Action.RAISE, 30)
    assert t.last_full_raise == 20
    assert not t.process_action(b, Action.RAISE, 49)
    assert t.process_action(b, Action.RAISE, 50)
    assert t.last_full_raise == 20
    assert t.process_action(a, Action.RAISE, 70)

def test_short_all_in_does_not_reopen_for_prior_raiser():
    t, a, b = table()
    assert t.process_action(a, Action.RAISE, 30)
    b.chips = 35
    assert t.process_action(b, Action.ALL_IN)
    assert t.current_bet == 35
    assert t.last_full_raise == 20
    assert not t.can_raise(a)
    assert not t.process_action(a, Action.ALL_IN)
    assert t.process_action(a, Action.CALL)

def test_full_all_in_reopens_and_new_street_resets():
    t, a, b = table()
    assert t.process_action(a, Action.RAISE, 30)
    b.chips = 50
    assert t.process_action(b, Action.ALL_IN)
    assert t.can_raise(a)
    t.initialize_deck()
    t.move_to_next_stage()
    assert t.last_full_raise == 10
    assert not t.acted_at_bet

def test_malformed_metadata_and_failure_do_not_force_call():
    actions=[{'action':'FOLD'},{'action':'CALL','amount':10}]
    assert parse_response('invalid',actions).action == 'FOLD'
    assert parse_response('{"action":"CALL","confidence":"oops","strategy_tags":null}',actions).action == 'CALL'
