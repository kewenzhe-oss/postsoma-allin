import pytest
from engine_info import Card, Suit, GameStage
from poker_engine import PokerTable, HandRank, Player
from online.engine_adapter import OnlinePokerEngineAdapter
from online.game_session import GameSession


def test_evaluate_player_best_five_full_house():
    """Verify evaluate_player_best_five selects the exact 5 cards and accurate description."""
    table = PokerTable()
    player = Player("p1", 1000)
    player.hand = [Card(Suit.SPADE, 13), Card(Suit.HEART, 13)] # Ks, Kh
    table.community_cards = [
        Card(Suit.DIAMOND, 13), # Kd
        Card(Suit.SPADE, 10),   # 10s
        Card(Suit.CLUB, 10),    # 10c
        Card(Suit.DIAMOND, 4),  # 4d
        Card(Suit.CLUB, 2),     # 2c
    ]

    rank, best_combo, desc, values = table.evaluate_player_best_five(player)
    assert rank == HandRank.FULL_HOUSE
    assert desc == "Full House, Kings full of Tens"
    assert len(best_combo) == 5

    best_cards_str = sorted([str(c) for c in best_combo])
    expected_str = sorted(["♠K", "♥K", "♦K", "♠10", "♣10"])
    assert best_cards_str == expected_str


def test_evaluate_player_best_five_kickers():
    """Verify two pair properly identifies and describes high kicker."""
    table = PokerTable()
    p1 = Player("p1", 1000)
    p1.hand = [Card(Suit.SPADE, 14), Card(Suit.HEART, 13)] # As, Kh
    table.community_cards = [
        Card(Suit.DIAMOND, 14), # Ad
        Card(Suit.SPADE, 12),   # Qs
        Card(Suit.CLUB, 12),    # Qc
        Card(Suit.DIAMOND, 8),  # 8d
        Card(Suit.CLUB, 2),     # 2c
    ]

    rank, best_combo, desc, values = table.evaluate_player_best_five(p1)
    assert rank == HandRank.TWO_PAIR
    assert "Two Pair, Aces and Queens (King kicker)" in desc

    p2 = Player("p2", 1000)
    p2.hand = [Card(Suit.CLUB, 14), Card(Suit.HEART, 11)] # Ac, Jh
    rank2, best_combo2, desc2, values2 = table.evaluate_player_best_five(p2)
    assert rank2 == HandRank.TWO_PAIR
    assert "Two Pair, Aces and Queens (Jack kicker)" in desc2

    # Verify p1 beats p2 on kicker
    assert table.compare_hands((rank, values), (rank2, values2)) == 1


def test_showdown_payload_contains_winning_cards_and_descriptions():
    """Verify engine_adapter._finish_hand_at_showdown populates winning_cards and best_five_cards."""
    adapter = OnlinePokerEngineAdapter(small_blind=5, big_blind=10, initial_chips=1000)
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()

    sb_id = adapter.current_turn_player_id()
    bb_id = "p2" if sb_id == "p1" else "p1"

    # Preflop: Call, Check
    adapter.submit_action(sb_id, "CALL")
    adapter.submit_action(bb_id, "CHECK")

    # Flop, Turn, River checks to reach showdown
    p_first = adapter.current_turn_player_id()
    p_second = "p2" if p_first == "p1" else "p1"

    adapter.submit_action(p_first, "CHECK")
    adapter.submit_action(p_second, "CHECK")
    adapter.submit_action(p_first, "CHECK")
    adapter.submit_action(p_second, "CHECK")
    adapter.submit_action(p_first, "CHECK")
    res = adapter.submit_action(p_second, "CHECK")

    assert res.accepted is True
    assert adapter.table.stage == GameStage.SHOWDOWN

    hf_events = [e for e in res.events if e.type == "hand_finished"]
    assert len(hf_events) == 1
    payload = hf_events[0].payload
    assert "showdown_info" in payload
    showdown_info = payload["showdown_info"]

    assert "winning_cards" in showdown_info
    assert len(showdown_info["winning_cards"]) == 5

    players_info = showdown_info["players"]
    assert len(players_info) == 2
    for p_info in players_info:
        assert "hand_description" in p_info
        assert len(p_info["best_five_cards"]) == 5
        assert len(p_info["hole_cards"]) == 2


@pytest.mark.asyncio
async def test_game_over_carries_deciding_hand_data():
    """Verify that when a player busts, game_over payload contains the deciding_hand snapshot."""
    session = GameSession(room_id="test_room", mode="pvp")
    session.add_player("p1", "Player 1")
    session.add_player("p2", "Player 2")
    # Start hand with 100 chips each
    session.adapter.table.players[0].chips = 100
    session.adapter.table.players[1].chips = 100

    events = session.adapter.start_hand()
    session._dispatch_events(events)

    sb_id = session.adapter.current_turn_player_id()
    bb_id = "p2" if sb_id == "p1" else "p1"

    captured_events = []
    session.on_event_generated = lambda ev: captured_events.append(ev)

    # SB all-in
    session.submit_action(sb_id, "ALL_IN")
    # BB calls all-in, step_all_in advances to showdown via _run_all_in_runout or loop
    session.submit_action(bb_id, "ALL_IN")

    # Let asynchronous all-in runout complete
    import asyncio
    await asyncio.sleep(4.0)

    # Check that game_over event was fired with deciding_hand
    game_over_events = [e for e in captured_events if e.type == "game_over"]
    assert len(game_over_events) == 1

    go_payload = game_over_events[0].payload
    assert "deciding_hand" in go_payload
    deciding = go_payload["deciding_hand"]
    assert deciding is not None
    assert "community_cards" in deciding
    assert len(deciding["community_cards"]) == 5
    assert "winning_cards" in deciding
    assert "winning_reason" in deciding
    assert "showdown_info" in deciding
