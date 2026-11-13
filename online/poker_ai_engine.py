"""
poker_ai_engine.py — Core adaptive AI decision engine.

Output format: plain text single line "ACTION [amount]"
This is the most reliably parsed format across all LLM providers.
JSON format was abandoned because responseMimeType caused Gemini issues
and nested arrays broke the simple regex parser.
"""

import os
import asyncio
import logging
from typing import Optional
import httpx

from online.ai_schemas import AIDecisionRequest, AIDecision
from online.ai_providers import PROVIDER_ALLOWLIST, resolve_endpoint
from online.ai_action_parser import parse_response

logger = logging.getLogger(__name__)


class PokerAIEngine:
    """Stateless engine — each call is independent. State lives in GameSession."""

    async def review_match(self, observations: dict, ai_config: dict) -> str:
        import json
        provider_key = ai_config.get('provider_name', '').lower()
        provider_info = PROVIDER_ALLOWLIST.get(provider_key)
        if not provider_info:
            raise ValueError('Unknown AI provider')
        model = ai_config.get('model', '')
        endpoint, protocol = resolve_endpoint(provider_info, model, ai_config.get('base_url'))
        prompt = (
            'Analyze the human player\'s performance in this completed heads-up Texas Hold\'em match using only the public match data below.\n'
            'Return ONLY a valid JSON object with two keys: "zh" (Simplified Chinese) and "en" (English).\n'
            'Each of "zh" and "en" MUST be an object with these exact 5 keys:\n'
            '{\n'
            '  "style_label": "2-6 word player archetype tag (e.g. 松凶激进型 / Loose-Aggressive)",\n'
            '  "style_verdict": "1-2 concise sentences diagnosing the player\'s overall playing style and risk appetite across the match.",\n'
            '  "play_pattern": "1-2 concise sentences detailing preflop entry/raise/shove habits, postflop aggression vs passivity, bet sizing, and showdown tendencies.",\n'
            '  "data_summary": "1-2 concise sentences interpreting the numerical metrics (VPIP, PFR, fold-to-pressure, showdown win rate, river pressure, all-ins).",\n'
            '  "improvements": ["3 concise, actionable adjustments citing real hand numbers or spots from hand_summaries and explaining the better alternative line."]\n'
            '}\n'
            'Rules:\n'
            '- Output raw JSON only (no markdown fences, no commentary outside JSON).\n'
            '- Ground every claim in statistics, match_outcome, and hand_summaries (never fabricate hidden cards).\n'
            '- Be direct, specific, and insightful like a poker coach. Avoid generic filler or hedging disclaimers such as "sample is small so cannot judge definitively".\n\n'
            + json.dumps(observations, ensure_ascii=False)
        )
        if protocol == 'gemini':
            raw = await _call_gemini(endpoint, ai_config.get('api_key', ''), prompt, max_tokens=3600, timeout_seconds=60.0)
        else:
            raw = await _call_openai_compat(endpoint, ai_config.get('api_key', ''), model, prompt, max_tokens=3600, timeout_seconds=60.0)
        return raw

    async def decide(self, request: AIDecisionRequest, ai_config: dict) -> AIDecision:
        available = request.available_actions
        if not available:
            return AIDecision(action="FOLD", parse_status="emergency_fallback",
                              fallback_reason="no available actions")

        provider_key = ai_config.get("provider_name", "").lower()
        model        = ai_config.get("model", "")
        api_key      = ai_config.get("api_key", "")
        custom_url   = ai_config.get("base_url") or None

        provider_info = PROVIDER_ALLOWLIST.get(provider_key)
        if not provider_info:
            logger.warning("PokerAIEngine: unknown provider '%s'", provider_key)
            return self._fallback(available, "unknown provider", to_call=request.to_call)

        try:
            endpoint, protocol = resolve_endpoint(provider_info, model, custom_url)
        except ValueError:
            return self._fallback(available, "no endpoint", to_call=request.to_call)

        prompt = _build_prompt(request)

        try:
            if protocol == "gemini":
                raw = await _call_gemini(endpoint, api_key, prompt)
            else:
                raw = await _call_openai_compat(endpoint, api_key, model, prompt)

            logger.info("AI[%s] h=%s %s → %r", provider_key, request.hand_number, request.stage, raw)

            result = parse_response(raw, available)
            if result.action == "RAISE" and result.amount is None:
                return self._fallback(available, "missing or illegal raise amount", to_call=request.to_call)
            logger.info("AI parsed: %s %s (status=%s)", result.action, result.amount, result.parse_status)

            return AIDecision(
                action=result.action, amount=result.amount,
                confidence=result.confidence, reason=result.reason,
                strategy_tags=result.strategy_tags,
                parse_status=result.parse_status, fallback_reason=result.fallback_reason,
            )

        except httpx.TimeoutException:
            logger.warning("PokerAIEngine: timeout")
            return self._fallback(available, "timeout", to_call=request.to_call)
        except httpx.HTTPStatusError as e:
            logger.warning("PokerAIEngine: HTTP %s — %s", e.response.status_code, e.response.text[:120])
            return self._fallback(available, f"HTTP {e.response.status_code}", to_call=request.to_call)
        except Exception as e:
            logger.error("PokerAIEngine: error: %s", e, exc_info=True)
            return self._fallback(available, str(e)[:80], to_call=request.to_call)

    def _fallback(self, available: list, reason: str, to_call: int = 0) -> AIDecision:
        valid = {a["action"] for a in available}
        # In poker fallback:
        # If to_call == 0 and CHECK is available, default to CHECK.
        # If to_call > 0 and FOLD is available, default to FOLD to avoid chip bleed.
        if to_call == 0 and "CHECK" in valid:
            action = "CHECK"
        elif "FOLD" in valid:
            action = "FOLD"
        elif "CHECK" in valid:
            action = "CHECK"
        elif "CALL" in valid:
            action = "CALL"
        else:
            action = available[0]["action"]
        return AIDecision(action=action, parse_status="emergency_fallback",
                          fallback_reason=reason, reason=f"fallback:{reason}")



# ── Prompt ────────────────────────────────────────────────────────────────────

def _build_prompt(req: AIDecisionRequest) -> str:
    community   = " ".join(req.community_cards) if req.community_cards else "none"
    hole        = " ".join(req.hole_cards)
    actions_str = " | ".join(a["action"] for a in req.available_actions)

    raise_hint = ""
    for a in req.available_actions:
        if a["action"] == "RAISE":
            raise_hint = f"\n  RAISE amount: {a.get('min_amount','?')} to {a.get('max_amount','?')}"

    opp = req.opponent_profile_summary or "Opponent: style unknown"

    hist = ""
    if req.action_history:
        parts = []
        for ev in req.action_history:
            who = "ME" if ev.get("player_id") == req.ai_player_id else "OPP"
            act_name = ev.get("action", "")
            if act_name in ("RAISE", "ALL_IN") and ev.get("bet_in_round", 0) > 0:
                amt = f"(to {ev['bet_in_round']})"
            elif ev.get("amount", 0) > 0:
                amt = f"({ev['amount']})"
            else:
                amt = ""
            parts.append(f"[{ev.get('stage', 'unknown')}] {who}:{ev['action']}{amt}")
        hist = "  History: " + " ".join(parts) + "\n"

    mem = ""
    if req.previous_ai_notes:
        mem = "  My recent decisions: " + " / ".join(req.previous_ai_notes[-3:]) + "\n"

    unmatched = max(0, req.opponent_total_bet - (req.ai_total_bet + req.ai_stack))
    eligible_pot = max(0, req.pot - unmatched)
    effective_total = min(req.ai_total_bet + req.ai_stack, req.opponent_total_bet + req.opponent_stack)
    effective_remaining = max(0, effective_total - req.ai_total_bet)
    pot_after_call = eligible_pot + req.to_call
    call_equity = req.to_call / pot_after_call if req.to_call and pot_after_call else 0
    blind = max(1, req.big_blind)

    return (
        f"Choose the next action in this simulated heads-up Texas Hold'em hand, using the current state and observed history.\n"
        f"\n"
        f"Hand #{req.hand_number} [{req.stage}]\n"
        f"  Cards: {hole} | Board: {community}\n"
        f"  Position: {req.position}; blinds: {req.small_blind}/{req.big_blind}; street bet already invested: {req.ai_bet_in_round}\n"
        f"  Pot: {req.pot}  To-call: {req.to_call}  Stacks: me={req.ai_stack} opp={req.opponent_stack}\n"
        f"  Total committed this hand: me={req.ai_total_bet} opp={req.opponent_total_bet}\n"
        f"  Effective remaining exposure: {effective_remaining} ({effective_remaining / blind:.2f} big blinds); my stack: {req.ai_stack / blind:.2f} big blinds; opponent stack: {req.opponent_stack / blind:.2f} big blinds.\n"
        f"  Eligible pot before calling: {eligible_pot}; unmatched opponent chips returned if called: {unmatched}; actual call: {req.to_call}; pot after call: {pot_after_call}; immediate call break-even equity: {call_equity:.2%}.\n"
        f"  {opp}\n"
        f"{hist}{mem}"
        f"\n"
        f"Legal: {actions_str}{raise_hint}\n"
        f"\n"
        f"Game information:\n"
        f"  - Evaluate amounts in context of the pot, effective stacks, blinds and action history. Decide your own strategy; interpret small samples cautiously.\n"
        f"  - RAISE amount is the TOTAL street bet, not additional chips.\n"
        f"  - To-call is capped at your remaining stack. If CALL is unavailable and ALL_IN is legal, ALL_IN may be the only way to call a larger bet; unmatched chips are returned. Consider the actual price and pot odds.\n"
        f"  - Opponent hole cards are hidden except where shown in completed-hand history.\n"
        f"\n"
        f"Reply in 2 lines (a brief 1-sentence reason, then your final action on the last line):\n"
        f"Reason: <short tactical reason referencing hand, price, or opponent tendency>\n"
        f"Decision: FOLD | CHECK | CALL | RAISE <amount> | ALL_IN\n"
        f"\n"
        f"Decision:"
    )


# ── LLM callers ───────────────────────────────────────────────────────────────

def _get_http_timeout(timeout_seconds: Optional[float] = None) -> httpx.Timeout:
    if timeout_seconds is not None:
        return httpx.Timeout(timeout_seconds + 5.0, connect=10.0, read=timeout_seconds, write=10.0)
    total_timeout = float(os.getenv("AI_TIMEOUT", "25.0"))
    connect_timeout = float(os.getenv("AI_CONNECT_TIMEOUT", "10.0"))
    read_timeout = float(os.getenv("AI_READ_TIMEOUT", "25.0"))
    return httpx.Timeout(total_timeout, connect=connect_timeout, read=read_timeout, write=10.0)


def _extract_openai_text(data: dict) -> str:
    message = data["choices"][0]["message"]
    content = message.get("content")
    if isinstance(content, list):
        chunks = [item.get("text", "") for item in content if isinstance(item, dict) and isinstance(item.get("text"), str)]
        return "".join(chunks).strip()
    if isinstance(content, str):
        return content.strip()
    return ""


def _extract_gemini_text(data: dict) -> str:
    parts = data["candidates"][0]["content"]["parts"]
    non_thought = [part["text"] for part in parts if isinstance(part, dict) and isinstance(part.get("text"), str) and not part.get("thought")]
    selected = non_thought or [part["text"] for part in parts if isinstance(part, dict) and isinstance(part.get("text"), str)]
    if not selected:
        raise KeyError("text")
    return "\n".join(selected).strip()


async def _call_openai_compat(endpoint: str, api_key: str, model: str, prompt: str, max_tokens: int = 1000, timeout_seconds: Optional[float] = None) -> str:
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": 0.8,
    }
    timeout = _get_http_timeout(timeout_seconds)
    last_exc = None
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(
                    endpoint,
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json=payload,
                )
                resp.raise_for_status()
                return _extract_openai_text(resp.json())
        except (httpx.TimeoutException, httpx.RequestError) as exc:
            last_exc = exc
            if attempt == 0:
                logger.warning("PokerAIEngine: OpenAI HTTP call failed (%s), retrying (attempt 1/2)...", exc)
                await asyncio.sleep(0.5)
            else:
                logger.warning("PokerAIEngine: OpenAI HTTP call failed after retry (%s)", exc)
                raise last_exc


async def _call_gemini(endpoint: str, api_key: str, prompt: str, max_tokens: int = 1000, timeout_seconds: Optional[float] = None) -> str:
    url = f"{endpoint}?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.8,
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
    }
    timeout = _get_http_timeout(timeout_seconds)
    last_exc = None
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(url, json=payload)
                resp.raise_for_status()
                data = resp.json()
                try:
                    return _extract_gemini_text(data)
                except (KeyError, IndexError):
                    import json
                    with open("debug_gemini_error.json", "w") as f:
                        json.dump(data, f, indent=2)
                    logger.warning("Gemini extraction failed. Raw response: %s", data)
                    raise RuntimeError("Gemini empty response (likely safety filter or immediate stop sequence)")
        except (httpx.TimeoutException, httpx.RequestError) as exc:
            last_exc = exc
            if attempt == 0:
                logger.warning("PokerAIEngine: Gemini HTTP call failed (%s), retrying (attempt 1/2)...", exc)
                await asyncio.sleep(0.5)
            else:
                logger.warning("PokerAIEngine: Gemini HTTP call failed after retry (%s)", exc)
                raise last_exc

