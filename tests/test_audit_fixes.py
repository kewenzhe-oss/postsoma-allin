import pytest
from engine_info import Card, Suit, GameStage
from poker_engine import PokerTable, HandRank
from online.engine_adapter import OnlinePokerEngineAdapter
from online.ai_action_parser import parse_response, ParseResult


def test_target_bet_raise_accounting():
    """Verify that Raise To (target total) correctly deducts additional_chips = target_total - player.bet_in_round."""
    adapter = OnlinePokerEngineAdapter(small_blind=5, big_blind=10, initial_chips=1000)
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()

    sb_id = adapter.current_turn_player_id()
    bb_id = "p2" if sb_id == "p1" else "p1"
    sb_player = next(p for p in adapter.table.players if p.name == sb_id)
    bb_player = next(p for p in adapter.table.players if p.name == bb_id)

    # Preflop: SB posted 5, BB posted 10
    assert sb_player.bet_in_round == 5
    assert sb_player.chips == 995
    assert bb_player.bet_in_round == 10
    assert bb_player.chips == 990
    assert adapter.table.pot == 15

    # SB raises to 30 (Raise To 30).
    # Additional chips needed = 30 - 5 = 25.
    res_sb = adapter.submit_action(sb_id, "RAISE", amount=30)
    assert res_sb.accepted is True
    assert sb_player.bet_in_round == 30
    assert sb_player.chips == 970  # 1000 - 30
    assert adapter.table.pot == 40  # 10 + 30

    # BB re-raises to 80 (Raise To 80).
    # BB has already bet 10. Additional chips = 80 - 10 = 70.
    res_bb = adapter.submit_action(bb_id, "RAISE", amount=80)
    assert res_bb.accepted is True
    assert bb_player.bet_in_round == 80
    assert bb_player.chips == 920  # 1000 - 80
    assert adapter.table.pot == 110  # 30 + 80

    # SB calls the 80. SB has already bet 30, needs 80 - 30 = 50 additional.
    res_call = adapter.submit_action(sb_id, "CALL")
    assert res_call.accepted is True
    assert sb_player.chips == 920  # 1000 - 80
    assert adapter.table.pot == 160  # 80 + 80


def test_heads_up_blinds_and_positions():
    """Verify 1v1 Heads-Up rule: Dealer/Button posts SB and acts first preflop; BB acts first postflop."""
    adapter = OnlinePokerEngineAdapter(small_blind=5, big_blind=10, initial_chips=1000)
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()

    dealer_pos = adapter.table.dealer_position
    dealer_player = adapter.table.players[dealer_pos]
    non_dealer_player = adapter.table.players[1 - dealer_pos]

    # Dealer is SB (5 chips), other is BB (10 chips)
    assert dealer_player.bet_in_round == 5
    assert dealer_player.chips == 995

    assert non_dealer_player.bet_in_round == 10
    assert non_dealer_player.chips == 990

    # Verify public state exposes dealer_player_id
    pub = adapter.get_public_state()
    assert pub.dealer_position == 0
    assert pub.dealer_player_id == "p1"

    # Preflop: Dealer (SB) acts first
    assert adapter.current_turn_player_id() == dealer_player.name

    # SB calls 10, then BB checks -> advances to Flop
    adapter.submit_action(dealer_player.name, "CALL")
    assert adapter.current_turn_player_id() == non_dealer_player.name
    adapter.submit_action(non_dealer_player.name, "CHECK")

    # Now on Flop: BB (non-dealer) must act first!
    assert adapter.table.stage == GameStage.FLOP
    assert adapter.current_turn_player_id() == non_dealer_player.name

    # Check that in hand 2, dealer rotates to p2
    adapter.submit_action(non_dealer_player.name, "FOLD")  # finish hand 1
    adapter.start_hand()  # hand 2
    pub2 = adapter.get_public_state()
    assert pub2.dealer_position == 1
    assert pub2.dealer_player_id == "p2"


def test_straight_high_wheel_precedence():
    """Verify check_straight prioritizes high straights (e.g. 7-6-5-4-3) over wheel (5-4-3-2-A)."""
    table = PokerTable()

    # Hand containing A, 7, 6, 5, 4, 3, 2
    cards = [
        Card(Suit.SPADE, 14),   # Ace
        Card(Suit.HEART, 7),
        Card(Suit.DIAMOND, 6),
        Card(Suit.CLUB, 5),
        Card(Suit.SPADE, 4),
        Card(Suit.HEART, 3),
        Card(Suit.DIAMOND, 2),
    ]

    straight = table.check_straight(cards)
    # Must be 7-high straight [7, 6, 5, 4, 3], NOT [5, 4, 3, 2, 1]
    assert straight == [7, 6, 5, 4, 3]

    # When only wheel is possible [A, 5, 4, 3, 2, 9, K]
    wheel_cards = [
        Card(Suit.SPADE, 14),
        Card(Suit.HEART, 5),
        Card(Suit.DIAMOND, 4),
        Card(Suit.CLUB, 3),
        Card(Suit.SPADE, 2),
        Card(Suit.HEART, 9),
        Card(Suit.DIAMOND, 13),
    ]
    wheel_straight = table.check_straight(wheel_cards)
    assert wheel_straight == [5, 4, 3, 2, 1]


def test_ai_action_parser_cot_safety():
    """Verify AI parser handles CoT texts without falsely capturing keywords mentioned in reasoning."""
    available = [
        {"action": "FOLD"},
        {"action": "CALL", "amount": 20},
        {"action": "RAISE", "min_amount": 40, "max_amount": 500},
        {"action": "ALL_IN", "amount": 500},
    ]

    # 1. CoT mentions ALL-IN and RAISE negatively, final decision is FOLD via anchor
    text_with_cot_and_anchor = (
        "Thinking Process:\n"
        "The pot is large. I could ALL-IN or RAISE to 200, but opponent is too strong.\n"
        "Therefore I must give up this hand.\n\n"
        "Decision: FOLD"
    )
    res = parse_response(text_with_cot_and_anchor, available)
    assert res.action == "FOLD"
    assert res.parse_status == "anchored_ok"

    # 2. CoT mentions FOLD and ALL-IN, final line is CALL
    text_with_last_line = (
        "Opponent bets 20. Should I fold? Maybe. Should I all-in? No way.\n"
        "The pot odds are acceptable.\n"
        "CALL"
    )
    res2 = parse_response(text_with_last_line, available)
    assert res2.action == "CALL"
    assert res2.parse_status == "last_line_ok"

    # 3. Anchor with amount
    text_with_raise = (
        "I have pocket Aces.\n"
        "Action: RAISE 120"
    )
    res3 = parse_response(text_with_raise, available)
    assert res3.action == "RAISE"
    assert res3.amount == 120
    assert res3.parse_status == "anchored_ok"

    # 4. JSON block
    text_with_json = (
        'Here is my move:\n```json\n{"action": "RAISE", "amount": 60, "reason": "Value bet"}\n```'
    )
    res4 = parse_response(text_with_json, available)
    assert res4.action == "RAISE"
    assert res4.amount == 60
    assert res4.parse_status == "json_ok"


def test_awarded_pot_non_zero_on_showdown():
    """Verify that when a hand reaches showdown, hand_over event reports awarded_pot > 0."""
    adapter = OnlinePokerEngineAdapter(small_blind=5, big_blind=10, initial_chips=1000)
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()

    sb_id = adapter.current_turn_player_id()
    bb_id = "p2" if sb_id == "p1" else "p1"

    # Preflop: SB call, BB check
    adapter.submit_action(sb_id, "CALL")
    adapter.submit_action(bb_id, "CHECK")

    # Flop: check, check
    assert adapter.table.stage == GameStage.FLOP
    p_first = adapter.current_turn_player_id()
    p_second = "p2" if p_first == "p1" else "p1"
    adapter.submit_action(p_first, "CHECK")
    adapter.submit_action(p_second, "CHECK")

    # Turn: check, check
    assert adapter.table.stage == GameStage.TURN
    adapter.submit_action(p_first, "CHECK")
    adapter.submit_action(p_second, "CHECK")

    # River: check, check -> showdown
    assert adapter.table.stage == GameStage.RIVER
    adapter.submit_action(p_first, "CHECK")
    res_final = adapter.submit_action(p_second, "CHECK")

    assert res_final.accepted is True
    assert adapter.table.stage == GameStage.SHOWDOWN

    hand_finished_events = [e for e in res_final.events if e.type == "hand_finished"]
    assert len(hand_finished_events) == 1
    assert hand_finished_events[0].payload["awarded_pot"] == 20  # 10 + 10 = 20 chips
    assert adapter.table.last_awarded_pot == 20


def test_staged_all_in_runout():
    """Verify step_all_in allows controlled, street-by-street progression in all-in lockdown."""
    adapter = OnlinePokerEngineAdapter(small_blind=5, big_blind=10, initial_chips=100)
    adapter.add_player("p1", "Player 1")
    adapter.add_player("p2", "Player 2")
    adapter.start_hand()

    sb_id = adapter.current_turn_player_id()
    bb_id = "p2" if sb_id == "p1" else "p1"

    # SB goes all-in preflop (100 chips)
    adapter.submit_action(sb_id, "ALL_IN", step_all_in=True)

    # BB calls all-in (100 chips total) with step_all_in=True
    res = adapter.submit_action(bb_id, "ALL_IN", step_all_in=True)
    assert res.accepted is True

    # Table should be in lockdown, and advanced to FLOP only
    assert adapter.is_all_in_lockdown() is True
    assert adapter.table.stage == GameStage.FLOP
    assert len(adapter.table.community_cards) == 3

    # Advance to Turn
    assert adapter.can_advance_street() is True
    events_turn = adapter.advance_single_street()
    assert adapter.table.stage == GameStage.TURN
    assert len(adapter.table.community_cards) == 4
    assert any(e.type == "community_cards_dealt" and e.payload["stage"] == "turn" for e in events_turn)

    # Advance to River
    assert adapter.can_advance_street() is True
    events_river = adapter.advance_single_street()
    assert adapter.table.stage == GameStage.RIVER
    assert len(adapter.table.community_cards) == 5
    assert any(e.type == "community_cards_dealt" and e.payload["stage"] == "river" for e in events_river)

    # Advance to Showdown
    assert adapter.can_advance_street() is True
    events_showdown = adapter.advance_single_street()
    assert adapter.table.stage == GameStage.SHOWDOWN
    assert any(e.type == "hand_finished" for e in events_showdown)
    assert adapter.can_advance_street() is False
