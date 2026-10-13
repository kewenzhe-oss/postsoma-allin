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
async def test_failed_model_retries_and_executes_fallback_without_polluting_memory(monkeypatch):
    session=GameSession('test','human_vs_ai',{'provider_name':'test'})
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
    assert len(action_events) == 1
    assert action_events[0].payload['action'] == 'FOLD'
    assert not any(e.type == 'ai_unavailable' for e in session.adapter.event_log()[before:])


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


