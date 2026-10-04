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
async def test_failed_model_retries_without_action_or_memory(monkeypatch):
    session=GameSession('test','human_vs_ai',{'provider_name':'test'})
    session.add_player('hero','Hero')
    session.add_player('ai_seat','AI')
    events=session.adapter.start_hand()
    session._on_hand_started(next(e for e in events if e.type=='hand_started'))
    session.adapter.table.current_player_idx=next(i for i,p in enumerate(session.adapter.table.players) if p.name=='ai_seat')
    failed=AsyncMock(return_value=AIDecision(action='FOLD',parse_status='emergency_fallback'))
    monkeypatch.setattr(module._ai_engine,'decide',failed)
    monkeypatch.setattr(module.asyncio,'sleep',AsyncMock())
    before=len(session.adapter.event_log())
    await session._ai_turn_routine()
    assert failed.await_count == 2
    assert not session._decision_memory.get_recent()
    assert [e.type for e in session.adapter.event_log()[before:]] == ['ai_unavailable']
