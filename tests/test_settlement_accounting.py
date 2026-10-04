from poker_engine import PokerTable
from engine_info import Player

def setup(a_bet,b_bet):
    t=PokerTable()
    a,b=Player('a',100-a_bet),Player('b',100-b_bet)
    a.total_bet=a_bet
    b.total_bet=b_bet
    t.players=[a,b]
    t.pot=a_bet+b_bet
    return t,a,b

def test_short_stack_win_returns_unmatched_excess():
    t,a,b=setup(20,60)
    t.award_pot([a])
    rows={p['player_id']:p for p in t.last_settlement['players']}
    assert rows['a']['received']==40
    assert rows['a']['net_change']==20
    assert rows['b']['returned']==40
    assert rows['b']['net_change']==-20
    assert t.last_settlement['contested_pot']==40
    assert a.chips+b.chips==200

def test_equal_hand_split_and_refund():
    t,a,b=setup(20,60)
    t.award_pot([a,b])
    rows=t.last_settlement['players']
    assert [p['received'] for p in rows]==[20,20]
    assert [p['net_change'] for p in rows]==[0,0]
    assert sum(p['returned'] for p in rows)==40
    assert a.chips==b.chips==100
