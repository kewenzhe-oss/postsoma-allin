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
    assert "Caught bluffing / failed pressure at showdown=2/2" in summary
    assert "BluffRate=1.00" in summary
    assert "Adaptation:" in summary


def test_parser_extracts_reason_from_two_line_response():
    from online.ai_action_parser import parse_response
    available = [{"action": "FOLD"}, {"action": "CALL", "amount": 20}, {"action": "RAISE", "min_amount": 40, "max_amount": 200}]
    raw = "Reason: Pot odds are 3:1 and opponent bluffs river frequently.\nDecision: CALL"
    res = parse_response(raw, available)
    assert res.action == "CALL"
    assert res.parse_status == "anchored_ok"
    assert "Pot odds are 3:1" in res.reason


@pytest.mark.asyncio
async def test_ai_thoughts_sealed_mid_hand_and_on_fold_revealed_at_showdown_or_game_over(monkeypatch):
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

    # 2) Hand ends by fold (mucked): ai_thought stays sealed, ai_thought_locked is emitted
    session._on_hand_finished(EngineEvent(
        seq=50,
        type="hand_finished",
        payload={"hand_number": 1, "ended_by": "fold", "winners": [{"player_id": "ai_seat"}]},
    ))
    assert not [e for e in session.adapter.event_log() if e.type == "ai_thought"]
    assert any(e.type == "ai_thought_locked" and e.payload["hand_number"] == 1 for e in session.adapter.event_log())

    # 3) Hand #2 reaches showdown: thoughts for Hand #2 unlock immediately with revealed_at='showdown'
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
    assert len(thoughts_after_sd) == 1
    assert thoughts_after_sd[0].payload["hand_number"] == 2
    assert thoughts_after_sd[0].payload["revealed_at"] == "showdown"

    # 4) Game over unlocks previously mucked Hand #1 thoughts with revealed_at='game_over'
    session._end_game()
    all_thoughts = [e for e in session.adapter.event_log() if e.type == "ai_thought"]
    assert len(all_thoughts) == 2
    mucked_revealed = next(e for e in all_thoughts if e.payload["hand_number"] == 1)
    assert mucked_revealed.payload["revealed_at"] == "game_over"


