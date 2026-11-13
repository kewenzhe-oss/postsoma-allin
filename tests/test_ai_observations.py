from online.opponent_model import OpponentModelTracker
from online.game_session import GameSession
from online.schemas import EngineEvent

def test_preflop_once_per_hand_and_pressure_denominator():
    p=OpponentModelTracker('hero','Hero')
    p.new_hand(1)
    p.observe_action('hero','CALL',10,'preflop')
    p.observe_action('hero','RAISE',20,'preflop')
    p.observe_action('hero','CALL',30,'flop')
    assert p.summarize().vpip_count == 1
    p.observe_ai_raised()
    p.observe_action('hero','CALL',10,'turn')
    p.observe_ai_raised()
    p.observe_action('hero','FOLD',0,'river')
    assert p._pressure_opportunities == 2
    assert p.summarize().fold_to_raise_count == 1
    assert not any('overfolds' in label for label in p.summarize().tendency_labels)

def test_only_showdowns_count_and_split_is_not_win():
    p=OpponentModelTracker('hero','Hero')
    winners=[{'player_id':'hero'},{'player_id':'ai_seat'}]
    p.observe_hand_result(1,winners,'ai_seat','fold')
    assert p.summarize().showdown_count == 0
    p.observe_hand_result(2,winners,'ai_seat','showdown')
    assert p.summarize().showdown_count == 1
    assert p.summarize().showdown_win_count == 0

import pytest
from unittest.mock import AsyncMock
from online.ai_schemas import AIDecision
import online.game_session as module

@pytest.mark.asyncio
async def test_failed_model_retries_and_pauses_without_an_action(monkeypatch):
    session=GameSession('test','human_vs_ai',{'provider_name':'test'})
    session._restart_turn_timer = lambda: None
    session.add_player('hero','Hero')
    session.add_player('ai_seat','AI')
    events=session.adapter.start_hand()
    session._on_hand_started(next(e for e in events if e.type=='hand_started'))
    session.adapter.table.current_player_idx=next(i for i,p in enumerate(session.adapter.table.players) if p.name=='ai_seat')
    failed=AsyncMock(return_value=AIDecision(action='FOLD',parse_status='emergency_fallback',fallback_reason='timeout'))
    monkeypatch.setattr(module._ai_engine,'decide',failed)
    monkeypatch.setattr(module.asyncio,'sleep',AsyncMock())
    before=len(session.adapter.event_log())
    await session._ai_turn_routine()
    assert failed.await_count == 2
    assert not session._decision_memory.get_recent()
    action_events = [e for e in session.adapter.event_log()[before:] if e.type == 'player_action_applied']
    assert not action_events
    assert any(e.type == 'ai_unavailable' for e in session.adapter.event_log()[before:])


def test_ai_engine_fallback_rules():
    from online.poker_ai_engine import PokerAIEngine
    engine = PokerAIEngine()
    actions_with_check = [{"action": "CHECK"}, {"action": "RAISE", "min_amount": 20, "max_amount": 200}]
    actions_with_call_fold = [{"action": "FOLD"}, {"action": "CALL", "amount": 20}, {"action": "RAISE", "min_amount": 40, "max_amount": 200}]

    # When to_call == 0, default to CHECK
    res1 = engine._fallback(actions_with_check, "timeout", to_call=0)
    assert res1.action == "CHECK"
    assert res1.parse_status == "emergency_fallback"

    # When to_call > 0, default to FOLD
    res2 = engine._fallback(actions_with_call_fold, "timeout", to_call=20)
    assert res2.action == "FOLD"
    assert res2.parse_status == "emergency_fallback"


@pytest.mark.asyncio
async def test_call_openai_compat_retries_on_timeout(monkeypatch):
    import httpx
    from online.poker_ai_engine import _call_openai_compat

    call_count = 0

    class MockResponse:
        def raise_for_status(self): pass
        def json(self):
            return {"choices": [{"message": {"content": "CALL"}}]}

    class MockAsyncClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): pass
        async def post(self, *args, **kwargs):
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise httpx.ReadTimeout("Mock read timeout")
            return MockResponse()

    monkeypatch.setattr(httpx, "AsyncClient", MockAsyncClient)
    res = await _call_openai_compat("http://mock/endpoint", "test_key", "test_model", "test_prompt")
    assert call_count == 2
    assert res == "CALL"


def test_hand_one_observations_and_ledger_memory_injected_into_prompt():
    from online.ai_prompt_builder import build_opponent_profile_summary
    from online.poker_ai_engine import _build_prompt

    session = GameSession("mem-room", "human_vs_ai", {"provider_name": "openai", "model": "gpt-4o-mini", "api_key": "k"})
    session._restart_turn_timer = lambda: None
    session.add_player("hero", "Alice")
    session.add_player("ai_seat", "AI")
    events = session.adapter.start_hand()
    session._on_hand_started(next(e for e in events if e.type == "hand_started"))

    # In Hand #1, as soon as the human acts once, profile summary must NOT be 'unknown'
    session._opponent_model.observe_action("hero", "RAISE", 30, "preflop")
    summary_h1 = build_opponent_profile_summary(session._opponent_model.summarize())
    assert "unknown" not in summary_h1
    assert "R=1" in summary_h1
    assert "Voluntary preflop hands=1/1" in summary_h1
    assert "Preflop raises=1/1" in summary_h1

    # Simulate Hand #1 finishing at showdown with revealed hole cards
    session._on_hand_finished(EngineEvent(
        seq=99,
        type="hand_finished",
        payload={
            "hand_number": 1,
            "ended_by": "showdown",
            "winners": [{"player_id": "hero", "display_name": "Alice", "amount": 60}],
            "showdown_info": {
                "players": [
                    {"player_id": "hero", "display_name": "Alice", "hole_cards": ["♠A", "♥K"], "hand_name": "One Pair"},
                    {"player_id": "ai_seat", "display_name": "AI", "hole_cards": ["♣Q", "♦J"], "hand_name": "High Card"},
                ]
            },
        },
    ))

    # Start Hand #2 and build the AI decision request + prompt
    session._on_hand_started(EngineEvent(seq=100, type="hand_started", payload={"hand_number": 2}))
    req_h2 = session._build_decision_request()
    prompt_h2 = _build_prompt(req_h2)

    assert "H#1: opp line [preflop:RAISE(30)] -> showdown showed [♠A ♥K, One Pair]" in prompt_h2


def test_vpip_pfr_bluff_frequency_and_adaptation_guidance():
    from online.ai_prompt_builder import build_opponent_profile_summary

    tracker = OpponentModelTracker("hero", "Alice")

    # Hand 1: Loose aggressive preflop raise + river bluff caught at showdown with High Card
    tracker.new_hand(1)
    tracker.observe_action("hero", "RAISE", 30, "preflop")
    tracker.observe_action("hero", "RAISE", 80, "river")
    tracker.observe_hand_result(
        1,
        winners=[{"player_id": "ai_seat"}],
        ai_player_id="ai_seat",
        ended_by="showdown",
        showdown_info={"players": [{"player_id": "hero", "hand_name": "High Card"}]},
    )

    # Hand 2: Loose preflop raise + river all-in bluff caught at showdown
    tracker.new_hand(2)
    tracker.observe_action("hero", "RAISE", 30, "preflop")
    tracker.observe_action("hero", "ALL_IN", 200, "river")
    tracker.observe_hand_result(
        2,
        winners=[{"player_id": "ai_seat"}],
        ai_player_id="ai_seat",
        ended_by="showdown",
        showdown_info={"players": [{"player_id": "hero", "hand_name": "High Card"}]},
    )

    profile = tracker.summarize()
    assert profile.vpip_count == 2
    assert profile.pfr_count == 2
    assert profile.river_aggression_count == 2
    assert profile.aggressive_showdown_count == 2
    assert profile.bluff_showdown_count == 2
    assert profile.bluff_rate == 1.0
    assert "capable of bluffing" in profile.tendency_labels
    assert "widen bluff-catching calls" in profile.adaptation_guidance

    summary = build_opponent_profile_summary(profile)
    assert "Voluntary preflop hands=2/2" in summary
    assert "Preflop raises=2/2" in summary
    assert "BluffRate" not in summary
    assert "Adaptation:" not in summary


def test_parser_extracts_reason_from_two_line_response():
    from online.ai_action_parser import parse_response
    available = [{"action": "FOLD"}, {"action": "CALL", "amount": 20}, {"action": "RAISE", "min_amount": 40, "max_amount": 200}]
    raw = "Reason: Pot odds are 3:1 and opponent bluffs river frequently.\nDecision: CALL"
    res = parse_response(raw, available)
    assert res.action == "CALL"
    assert res.parse_status == "anchored_ok"
    assert "Pot odds are 3:1" in res.reason


def test_ai_request_caps_call_at_remaining_stack():
    from online.poker_ai_engine import _build_prompt
    session = GameSession('short-call', 'human_vs_ai', {})
    session.add_player('hero', 'Hero')
    session.add_player('ai_seat', 'AI')
    session.adapter.table.players[1].chips = 13
    events = session.adapter.start_hand()
    session._on_hand_started(next(event for event in events if event.type == 'hand_started'))
    result = session.adapter.submit_action('hero', 'ALL_IN')
    assert result.accepted
    request = session._build_decision_request()
    assert request.ai_stack == 3
    assert request.to_call == 3
    assert any(action['action'] == 'ALL_IN' for action in request.available_actions)
    prompt = _build_prompt(request)
    assert 'Eligible pot before calling: 23' in prompt
    assert 'unmatched opponent chips returned if called: 987' in prompt
    assert 'pot after call: 26' in prompt
    assert 'break-even equity: 11.54%' in prompt


def test_short_all_in_call_is_not_recorded_as_preflop_raise():
    tracker = OpponentModelTracker('hero', 'Hero')
    tracker.new_hand(1)
    tracker.observe_action('hero', 'ALL_IN', 13, 'preflop', previous_bet=100)
    profile = tracker.summarize()
    assert profile.vpip_count == 1
    assert profile.pfr_count == 0
    assert profile.river_aggression_count == 0


@pytest.mark.asyncio
async def test_ai_thoughts_revealed_after_each_finished_hand(monkeypatch):
    session = GameSession("seal-room", "human_vs_ai", {"provider_name": "openai", "model": "gpt-4o-mini", "api_key": "k"})
    session._restart_turn_timer = lambda: None
    session.add_player("hero", "Alice")
    session.add_player("ai_seat", "AI")
    events = session.adapter.start_hand()
    session._on_hand_started(next(e for e in events if e.type == "hand_started"))

    # Ensure it is AI's turn and choose a legal non-terminal action (CALL or CHECK)
    if session.adapter.current_turn_player_id() == "hero":
        session.submit_action("hero", "CALL")
    legal_act = next(a.action for a in session.adapter.get_available_actions("ai_seat") if a.action in ("CALL", "CHECK"))
    monkeypatch.setattr(module.asyncio, "sleep", AsyncMock())
    monkeypatch.setattr(
        module._ai_engine,
        "decide",
        AsyncMock(return_value=AIDecision(action=legal_act, reason="Strong pocket pair, flatting preflop", strategy_tags=["trap"])),
    )

    await session._ai_turn_routine()

    # 1) Mid-hand: ai_thought MUST NOT be broadcast while hand is still active
    assert not [e for e in session.adapter.event_log() if e.type == "ai_thought"]

    session._on_hand_finished(EngineEvent(
        seq=50,
        type="hand_finished",
        payload={"hand_number": 1, "ended_by": "fold", "winners": [{"player_id": "ai_seat"}]},
    ))
    thoughts = [e for e in session.adapter.event_log() if e.type == "ai_thought"]
    assert len(thoughts) == 1
    assert thoughts[0].payload["hand_number"] == 1
    assert thoughts[0].payload["revealed_at"] == "hand_finished"

    session._on_hand_started(EngineEvent(seq=51, type="hand_started", payload={"hand_number": 2}))
    session._current_hand_ai_thoughts.append({
        "hand_number": 2,
        "stage": "river",
        "ai_player_id": "ai_seat",
        "action": "CALL",
        "amount": 20,
        "thought_summary": "Bluff-catching river with second pair",
        "confidence": 0.7,
        "strategy_tags": ["bluff-catch"],
        "parse_status": "json_ok",
    })
    session._on_hand_finished(EngineEvent(
        seq=52,
        type="hand_finished",
        payload={"hand_number": 2, "ended_by": "showdown", "winners": [{"player_id": "ai_seat"}]},
    ))
    thoughts_after_sd = [e for e in session.adapter.event_log() if e.type == "ai_thought"]
    assert len(thoughts_after_sd) == 2
    assert thoughts_after_sd[1].payload["hand_number"] == 2
    assert thoughts_after_sd[1].payload["revealed_at"] == "hand_finished"


@pytest.mark.asyncio
async def test_final_ai_fold_is_published_after_hand_finished(monkeypatch):
    session = GameSession('review-fold', 'human_vs_ai', {'provider_name': 'test'})
    session._restart_turn_timer = lambda: None
    session.add_player('hero', 'Hero')
    session.add_player('ai_seat', 'AI')
    events = session.adapter.start_hand()
    session._on_hand_started(next(event for event in events if event.type == 'hand_started'))
    assert session.submit_action('hero', 'CALL')
    monkeypatch.setattr(module.asyncio, 'sleep', AsyncMock())
    monkeypatch.setattr(module._ai_engine, 'decide', AsyncMock(return_value=AIDecision(action='FOLD', reason='I fold')))
    await session._ai_turn_routine()
    events = session.adapter.event_log()
    finished_index = next(index for index, event in enumerate(events) if event.type == 'hand_finished')
    thought_index = next(index for index, event in enumerate(events) if event.type == 'ai_thought')
    assert thought_index > finished_index
    assert events[thought_index].payload['thought_summary'] == 'I fold'
    if session._delayed_start_task:
        session._delayed_start_task.cancel()


@pytest.mark.asyncio
@pytest.mark.parametrize('winner_id', ['hero', 'ai_seat'])
async def test_match_review_generated_for_either_winner(monkeypatch, winner_id):
    import asyncio
    session = GameSession('review', 'human_vs_ai', {'provider_name': 'test', 'api_key': 'secret'})
    session.add_player('hero', 'Hero')
    session.add_player('ai_seat', 'AI')
    events = session.adapter.start_hand()
    session._on_hand_started(next(event for event in events if event.type == 'hand_started'))
    session._opponent_model.observe_action('hero', 'CALL', 5, 'preflop')
    for player in session.adapter.table.players:
        player.chips = 100 if player.name == winner_id else 0
    review = AsyncMock(return_value='{"zh":"观察","en":"Observation"}')
    monkeypatch.setattr(module._ai_engine, 'review_match', review)
    session._end_game()
    await asyncio.sleep(0)
    result = next(event.payload for event in session.adapter.event_log() if event.type == 'game_over')
    report = next(event.payload for event in session.adapter.event_log() if event.type == 'ai_match_review')
    assert result['winner']['player_id'] == winner_id
    assert result['player_statistics']['hands'] == 1
    assert result['player_statistics']['vpip_count'] == 1
    assert report == {'status': 'ready', 'zh': '观察', 'en': 'Observation'}
    assert 'secret' not in str(review.await_args.args[0])
    assert 'private_hole_cards' not in str(review.await_args.args[0])


@pytest.mark.asyncio
async def test_match_review_failure_retains_statistics(monkeypatch):
    import asyncio
    session = GameSession('review-error', 'human_vs_ai', {'provider_name': 'test'})
    session.add_player('hero', 'Hero')
    session.add_player('ai_seat', 'AI')
    events = session.adapter.start_hand()
    session._on_hand_started(next(event for event in events if event.type == 'hand_started'))
    monkeypatch.setattr(module._ai_engine, 'review_match', AsyncMock(side_effect=RuntimeError('failed')))
    session._end_game()
    await asyncio.sleep(0)
    result = next(event.payload for event in session.adapter.event_log() if event.type == 'game_over')
    report = next(event.payload for event in session.adapter.event_log() if event.type == 'ai_match_review')
    assert result['player_statistics']['hands'] == 1
    assert report['status'] == 'error'


@pytest.mark.asyncio
async def test_structured_match_review_includes_hand_summaries_and_fields(monkeypatch):
    import asyncio
    import json
    session = GameSession('review-structured', 'human_vs_ai', {'provider_name': 'openai', 'model': 'gpt-4o-mini', 'api_key': 'secret'})
    session._restart_turn_timer = lambda: None
    session.add_player('hero', 'Hero')
    session.add_player('ai_seat', 'AI')
    events = session.adapter.start_hand()
    session._on_hand_started(next(event for event in events if event.type == 'hand_started'))
    session._opponent_model.observe_action('hero', 'RAISE', 30, 'preflop')
    finished_payload = {
        'hand_number': 1,
        'ended_by': 'showdown',
        'awarded_pot': 60,
        'community_cards': ['♠A', '♦K', '♣7', '♥2', '♣9'],
        'settlements': [{'player_id': 'hero', 'received': 60, 'returned': 0, 'net_change': 30}],
        'winners': [{'player_id': 'hero', 'display_name': 'Hero', 'amount': 60}],
        'showdown_info': {
            'players': [
                {'player_id': 'hero', 'hole_cards': ['♠Q', '♠J'], 'hand_name': 'High Card'},
                {'player_id': 'ai_seat', 'hole_cards': ['♥4', '♦4'], 'hand_name': 'One Pair'},
            ]
        },
    }
    session._on_hand_finished(EngineEvent(seq=50, type='hand_finished', payload=finished_payload))
    session.adapter._events.append(EngineEvent(seq=51, type='hand_finished', payload=finished_payload))
    for player in session.adapter.table.players:
        player.chips = 2000 if player.name == 'hero' else 0

    structured_payload = {
        'zh': {
            'style_label': '松凶激进型',
            'style_verdict': '整体倾向积极施压。',
            'play_pattern': '翻前高频加注并主动争夺底池。',
            'data_summary': '入池率与翻前加注率均偏高。',
            'improvements': ['Hand #1 河牌避免用高牌盲目全下。'],
        },
        'en': {
            'style_label': 'Loose-Aggressive',
            'style_verdict': 'Applies frequent pressure across streets.',
            'play_pattern': 'High preflop raise rate and active postflop lines.',
            'data_summary': 'Elevated VPIP and PFR across the sample.',
            'improvements': ['In Hand #1, size down thin river bluffs.'],
        },
    }
    review_mock = AsyncMock(return_value=json.dumps(structured_payload, ensure_ascii=False))
    monkeypatch.setattr(module._ai_engine, 'review_match', review_mock)
    session._end_game()
    await asyncio.sleep(0)

    report = next(event.payload for event in session.adapter.event_log() if event.type == 'ai_match_review')
    assert report['status'] == 'ready'
    assert report['zh']['style_label'] == '松凶激进型'
    assert report['en']['improvements'] == ['In Hand #1, size down thin river bluffs.']
    passed_obs = review_mock.await_args.args[0]
    assert 'hand_summaries' in passed_obs
    assert passed_obs['hand_summaries'][0]['ended_by'] == 'showdown'
    assert 'secret' not in str(passed_obs)
    assert 'private_hole_cards' not in str(passed_obs)


