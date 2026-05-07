"""
ai_prompt_builder.py — Structured prompt builder for the Adaptive Poker AI Engine.

Produces a complete prompt string from an AIDecisionRequest.
The prompt is structured into clearly labelled blocks so the model
can reliably parse context and produce JSON output.

Output format requested from the model:
{
  "action": "FOLD" | "CHECK" | "CALL" | "RAISE" | "ALL_IN",
  "amount": <integer or null>,
  "confidence": <0.0–1.0>,
  "reason": "<one short sentence>",
  "strategy_tags": ["<tag1>", ...]
}
"""

from online.ai_schemas import AIDecisionRequest

_ROLE_BLOCK = """\
You are an adaptive, professional heads-up Texas Hold'em AI.
You make decisions based on pot odds, hand strength, and opponent tendencies.
You never use hidden information (you cannot see the opponent's hole cards before showdown).
You respond ONLY with a valid JSON object — no explanations outside the JSON.\
"""

_STRATEGY_BLOCK = """\
Strategy guidelines (adapt based on opponent profile):
- If opponent is passive/tight: bet and raise more; steal blinds aggressively.
- If opponent overfolds to pressure: c-bet frequently; apply consistent pressure.
- If opponent is loose-aggressive or frequent all-in: tighten up; call wider with strong hands.
- If opponent calls too often: thin-value bet good hands; avoid bluffing.
- Do NOT check every street — bet or raise when you have equity or fold equity.
- Do NOT bluff randomly; only bluff with credible board texture or draw equity.
- Do NOT go all-in without a strong reason (big draw, strong value, or opponent is short).\
"""

_OUTPUT_FORMAT_BLOCK = """\
Respond with EXACTLY this JSON (no markdown, no extra text):
{
  "action": "FOLD" | "CHECK" | "CALL" | "RAISE" | "ALL_IN",
  "amount": <integer if RAISE, else null>,
  "confidence": <float 0.0–1.0>,
  "reason": "<one sentence explaining decision>",
  "strategy_tags": ["<tag>", ...]
}
Legal actions this turn: {actions_str}
{raise_constraint}\
"""


def build_prompt(request: AIDecisionRequest) -> str:
    """
    Build the full prompt string from an AIDecisionRequest.
    Safe: never includes opponent's private hole cards.
    """
    # ── Block 1: Role ─────────────────────────────────────────────────────────
    blocks = [_ROLE_BLOCK, ""]

    # ── Block 2: Current game state ───────────────────────────────────────────
    community_str = " ".join(request.community_cards) if request.community_cards else "(none)"
    blocks.append("=== CURRENT HAND STATE ===")
    blocks.append(f"Hand #     : {request.hand_number}")
    blocks.append(f"Stage      : {request.stage}")
    blocks.append(f"My cards   : {' '.join(request.hole_cards)}")
    blocks.append(f"Board      : {community_str}")
    blocks.append(f"Pot        : {request.pot}   To call: {request.to_call}   Blinds: {request.small_blind}/{request.big_blind}")
    blocks.append(f"My stack   : {request.ai_stack}  (bet this round: {request.ai_bet_in_round})")
    blocks.append(f"Opp stack  : {request.opponent_stack}  (bet this round: {request.opponent_bet_in_round})")
    blocks.append("")

    # ── Block 3: Opponent profile ──────────────────────────────────────────────
    blocks.append("=== OPPONENT PROFILE ===")
    if request.opponent_profile_summary:
        blocks.append(request.opponent_profile_summary)
    else:
        blocks.append("Insufficient data — treat as unknown.")
    blocks.append("")

    # ── Block 4: This hand action history (compact) ───────────────────────────
    if request.action_history:
        blocks.append("=== THIS HAND ACTION HISTORY ===")
        for ev in request.action_history[-20:]:  # cap at 20 to avoid bloat
            pid = ev.get("player_id", "?")
            label = "ME" if pid == request.ai_player_id else "OPP"
            act = ev.get("action", "?")
            amt = ev.get("amount", 0)
            amt_str = f" {amt}" if amt and int(amt) > 0 else ""
            blocks.append(f"  {label}: {act}{amt_str}")
        blocks.append("")

    # ── Block 5: Previous AI decision notes ───────────────────────────────────
    if request.previous_ai_notes:
        blocks.append("=== MY RECENT DECISIONS ===")
        for note in request.previous_ai_notes:
            blocks.append(f"  • {note}")
        blocks.append("")

    # ── Block 6: Strategy ─────────────────────────────────────────────────────
    blocks.append(_STRATEGY_BLOCK)
    blocks.append("")

    # ── Block 7: Output format ────────────────────────────────────────────────
    actions_str = " | ".join(a["action"] for a in request.available_actions)
    raise_constraint = ""
    for a in request.available_actions:
        if a["action"] == "RAISE":
            lo = a.get("min_amount", "?")
            hi = a.get("max_amount", "?")
            raise_constraint = f'If RAISE: amount must be an integer between {lo} and {hi}.'
            break

    blocks.append(
        _OUTPUT_FORMAT_BLOCK.format(
            actions_str=actions_str,
            raise_constraint=raise_constraint,
        )
    )

    return "\n".join(blocks)


def build_opponent_profile_summary(profile) -> str:
    """
    Convert an OpponentProfile into a compact human-readable string
    suitable for prompt injection.
    """
    if not profile or profile.hands_observed < 1:
        return "Opponent: unknown — no data yet."

    labels_str = ", ".join(profile.tendency_labels) if profile.tendency_labels else "balanced"
    notes_str = ""
    if profile.recent_notes:
        notes_str = " Notes: " + "; ".join(profile.recent_notes[-2:]) + "."

    return (
        f"Opponent ({profile.display_name}): {labels_str}. "
        f"Aggression={profile.aggression_score:.2f} Looseness={profile.looseness_score:.2f}. "
        f"Stats: R={profile.raise_count} C={profile.call_count} "
        f"F={profile.fold_count} Chk={profile.check_count} AI={profile.all_in_count}. "
        f"Showdown: {profile.showdown_win_count}/{profile.showdown_count} wins."
        f"{notes_str}"
    )
