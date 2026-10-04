"""Seeded full-hand simulations and independent seven-card ranking checks."""
from collections import Counter
from itertools import combinations
import random

from engine_info import Card, Suit, GameStage, Player
from poker_engine import PokerTable
from online.engine_adapter import OnlinePokerEngineAdapter


def reference_five(cards):
    values = sorted((c.value for c in cards), reverse=True)
    groups = sorted(((n, v) for v, n in Counter(values).items()), reverse=True)
    flush = len({c.suit for c in cards}) == 1
    unique = sorted(set(values), reverse=True)
    straight = unique[0] if len(unique) == 5 and unique[0]-unique[-1] == 4 else (5 if unique == [14,5,4,3,2] else 0)
    if flush and straight: return (9 if straight == 14 else 8, straight)
    if groups[0][0] == 4: return (7, groups[0][1], groups[1][1])
    if [g[0] for g in groups] == [3,2]: return (6, groups[0][1], groups[1][1])
    if flush: return (5, *values)
    if straight: return (4, straight)
    if groups[0][0] == 3: return (3, groups[0][1], *sorted((v for n,v in groups if n==1),reverse=True))
    if [g[0] for g in groups[:2]] == [2,2]: return (2, groups[0][1], groups[1][1], groups[2][1])
    if groups[0][0] == 2: return (1, groups[0][1], *sorted((v for n,v in groups if n==1),reverse=True))
    return (0, *values)


def test_best_five_against_independent_reference():
    rng = random.Random(205033)
    deck = [Card(s,v) for s in Suit for v in range(2,15)]
    table = PokerTable()
    player = Player('audit',1000)
    for _ in range(600):
        cards = rng.sample(deck,7)
        player.hand, table.community_cards = cards[:2], cards[2:]
        rank, best, _, _ = table.evaluate_player_best_five(player)
        expected = max(reference_five(combo) for combo in combinations(cards,5))
        assert reference_five(best) == expected
        assert rank.value == expected[0] + 1
        assert len({str(c) for c in best}) == 5
        assert set(map(str,best)) <= set(map(str,cards))


def test_250_complete_hands_preserve_chips_cards_and_results():
    rng = random.Random(1042026)
    endings = set()
    for _ in range(250):
        adapter = OnlinePokerEngineAdapter()
        adapter.add_player('p1','One'); adapter.add_player('p2','Two')
        players = adapter.table.players
        players[0].chips = rng.randint(20,1000); players[1].chips = rng.randint(20,1000)
        starting = sum(p.chips for p in players)
        adapter.start_hand()
        initial_holes = [[str(c) for c in p.hand] for p in players]
        finished = None
        for turn in range(100):
            assert sum(p.chips for p in players) + adapter.table.pot == starting
            actor = adapter.current_turn_player_id()
            assert actor is not None
            actions = adapter.get_available_actions(actor)
            action = rng.choice(actions)
            amount = rng.randint(action.min_amount,action.max_amount) if action.action == 'RAISE' else action.amount
            result = adapter.submit_action(actor,action.action,amount)
            assert result.accepted, (action,amount)
            assert [[str(c) for c in p.hand] for p in players] == initial_holes
            all_cards = [str(c) for p in players for c in p.hand] + list(map(str,adapter.table.community_cards))
            assert len(set(all_cards)) == len(all_cards)
            finished = next((e.payload for e in result.events if e.type == 'hand_finished'),None)
            if finished: break
        assert finished is not None, 'Hand failed to terminate'
        assert sum(p.chips for p in players) == starting
        endings.add(finished['ended_by'])
        assert sum(w['amount'] for w in finished['winners']) == finished['awarded_pot']
        assert sum(p['net_change'] for p in finished['settlements']) == 0
        if finished['ended_by'] == 'showdown':
            info = finished['showdown_info']
            winner = next(p for p in info['players'] if p['player_id'] == finished['winners'][0]['player_id'])
            assert info['winning_hand_desc'] == winner['hand_description']
            assert info['winning_hand_desc_zh'] == winner['hand_description_zh']
            assert info['winning_cards'] == winner['best_five_cards']
    assert endings == {'fold','showdown'}


def test_same_pair_secondary_kickers_remain_visible_in_description():
    table = PokerTable()
    a, b = Player('a',100), Player('b',100)
    table.community_cards = [Card(Suit.SPADE,7),Card(Suit.HEART,7),Card(Suit.CLUB,14),Card(Suit.DIAMOND,3),Card(Suit.CLUB,2)]
    a.hand = [Card(Suit.HEART,12),Card(Suit.HEART,10)]
    b.hand = [Card(Suit.DIAMOND,11),Card(Suit.DIAMOND,9)]
    rank_a, _, desc_a, vals_a = table.evaluate_player_best_five(a)
    rank_b, _, desc_b, vals_b = table.evaluate_player_best_five(b)
    assert table.compare_hands((rank_a,vals_a),(rank_b,vals_b)) == 1
    assert desc_a != desc_b
    assert 'Queen' in desc_a and 'Jack' in desc_b
    assert 'Q' in table.describe_hand_zh(rank_a,vals_a)


def test_board_only_flush_splits_and_uses_five_original_board_cards():
    adapter = OnlinePokerEngineAdapter()
    adapter.add_player('p1','One'); adapter.add_player('p2','Two');adapter.start_hand()
    a,b = adapter.table.players
    a.hand=[Card(Suit.SPADE,8),Card(Suit.CLUB,3)]
    b.hand=[Card(Suit.DIAMOND,9),Card(Suit.SPADE,2)]
    adapter.table.community_cards=[Card(Suit.HEART,v) for v in [4,13,14,2,6]]
    adapter.table.stage=GameStage.SHOWDOWN
    payload=adapter._finish_hand_at_showdown()[0].payload
    assert len(payload['winners']) == 2
    assert set(payload['showdown_info']['winning_cards']) == set(payload['community_cards'])
    assert payload['showdown_info']['winning_hand_desc_zh'] == '同花 (A、K、6、4、2)'
    assert '分池' in payload['showdown_info']['winning_reason_zh']


import asyncio
import pytest
from online.ai_schemas import AIDecision
from online.game_session import GameSession


@pytest.mark.asyncio
async def test_concurrent_ai_routines_submit_once_and_only_use_own_cards(monkeypatch):
    session=GameSession('ai-audit','human_vs_ai')
    session.add_player('hero','Human');session.add_player('ai_seat','AI')
    events=session.adapter.start_hand()
    session._on_hand_started(next(e for e in events if e.type=='hand_started'))
    session._restart_turn_timer=lambda:None
    if session.adapter.current_turn_player_id()=='hero':
        assert session.submit_action('hero','CALL')
    calls=[]
    async def decide(request, config):
        calls.append(request)
        ai=next(p for p in session.adapter.table.players if p.name=='ai_seat')
        assert request.hole_cards==list(map(str,ai.hand))
        assert not hasattr(request,'opponent_hole_cards')
        action=next(a['action'] for a in request.available_actions if a['action'] in ('CHECK','CALL'))
        return AIDecision(action=action)
    monkeypatch.setattr('online.game_session._ai_engine.decide',decide)
    await asyncio.gather(session._ai_turn_routine(),session._ai_turn_routine())
    assert len(calls)==1
    actions=[e for e in session.adapter.event_log() if e.type=='player_action_applied' and e.payload['player_id']=='ai_seat']
    assert len(actions)==1


@pytest.mark.parametrize('codes,expected_rank',[
    ('Ah Kh Qh Jh Th 2c 3d',10),
    ('9s 8s 7s 6s 5s Ah 2c',9),
    ('8s 8h 8c 8d Ah Kd 2c',8),
    ('7s 7h 7c 4d 4h As 2c',7),
    ('Kh Jh 9h 6h 3h As 2c',6),
    ('7s 6h 5c 4d 3s Ah 9c',5),
    ('Qs Qh Qc 9d As 2c 4h',4),
    ('Ks Kh 8c 8d As 4c 2h',3),
    ('Js Jh Ac Kd 9s 7c 2h',2),
    ('As Kh Jc 9d 7s 4c 2h',1),
])
def test_each_hand_category_matches_exact_best_five(codes,expected_rank):
    suits={'s':Suit.SPADE,'h':Suit.HEART,'c':Suit.CLUB,'d':Suit.DIAMOND}
    faces={'A':14,'K':13,'Q':12,'J':11,'T':10}
    cards=[Card(suits[c[-1]],faces[c[0]] if c[0] in faces else int(c[0])) for c in codes.split()]
    table=PokerTable();p=Player('audit',100);p.hand=cards[:2];table.community_cards=cards[2:]
    rank,best,desc,values=table.evaluate_player_best_five(p)
    assert rank.value==expected_rank
    assert reference_five(best)==max(reference_five(c) for c in combinations(cards,5))
    assert desc and table.describe_hand_zh(rank,values)


@pytest.mark.asyncio
async def test_invalid_ai_raise_never_changes_chips_or_emits_an_action(monkeypatch):
    session=GameSession('invalid-ai-audit','human_vs_ai')
    session.add_player('hero','Human');session.add_player('ai_seat','AI')
    events=session.adapter.start_hand();session._on_hand_started(next(e for e in events if e.type=='hand_started'))
    session._restart_turn_timer=lambda:None
    if session.adapter.current_turn_player_id()=='hero': assert session.submit_action('hero','CALL')
    before=[(p.chips,p.bet_in_round) for p in session.adapter.table.players]
    async def decide(request, config): return AIDecision(action='RAISE',amount=100000)
    monkeypatch.setattr('online.game_session._ai_engine.decide',decide)
    await session._ai_turn_routine()
    assert [(p.chips,p.bet_in_round) for p in session.adapter.table.players]==before
    assert not [e for e in session.adapter.event_log() if e.type=='player_action_applied' and e.payload['player_id']=='ai_seat']
    assert session.adapter.event_log()[-1].type=='ai_unavailable'
