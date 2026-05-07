"""
poker_ai_engine.py — Core adaptive AI decision engine.

Output format: plain text single line "ACTION [amount]"
This is the most reliably parsed format across all LLM providers.
JSON format was abandoned because responseMimeType caused Gemini issues
and nested arrays broke the simple regex parser.
"""

import logging
import httpx

from online.ai_schemas import AIDecisionRequest, AIDecision
from online.ai_providers import PROVIDER_ALLOWLIST
from online.ai_action_parser import parse_response

logger = logging.getLogger(__name__)


class PokerAIEngine:
    """Stateless engine — each call is independent. State lives in GameSession."""

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
            return self._fallback(available, "unknown provider")

        protocol = provider_info.get("protocol", "openai")

        endpoint = custom_url.rstrip("/") if custom_url else provider_info.get("base_url", "").format(model=model)
        if not endpoint:
            return self._fallback(available, "no endpoint")

        prompt = _build_prompt(request)

        try:
            if protocol == "gemini":
                raw = await _call_gemini(endpoint, api_key, prompt)
            else:
                raw = await _call_openai_compat(endpoint, api_key, model, prompt)

            logger.info("AI[%s] h=%s %s → %r", provider_key, request.hand_number, request.stage, raw)

            result = parse_response(raw, available)
            logger.info("AI parsed: %s %s (status=%s)", result.action, result.amount, result.parse_status)

            return AIDecision(
                action=result.action, amount=result.amount,
                confidence=result.confidence, reason=result.reason,
                strategy_tags=result.strategy_tags,
                parse_status=result.parse_status, fallback_reason=result.fallback_reason,
            )

        except httpx.TimeoutException:
            logger.warning("PokerAIEngine: timeout")
            return self._fallback(available, "timeout")
        except httpx.HTTPStatusError as e:
            logger.warning("PokerAIEngine: HTTP %s — %s", e.response.status_code, e.response.text[:120])
            return self._fallback(available, f"HTTP {e.response.status_code}")
        except Exception as e:
            logger.error("PokerAIEngine: error: %s", e, exc_info=True)
            return self._fallback(available, str(e)[:80])

    def _fallback(self, available: list, reason: str) -> AIDecision:
        valid = {a["action"] for a in available}
        for p in ("CALL", "CHECK", "FOLD"):
            if p in valid:
                return AIDecision(action=p, parse_status="emergency_fallback",
                                  fallback_reason=reason, reason=f"fallback:{reason}")
        return AIDecision(action=available[0]["action"], parse_status="emergency_fallback",
                          fallback_reason=reason)


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
        for ev in req.action_history[-10:]:
            who = "ME" if ev.get("player_id") == req.ai_player_id else "OPP"
            amt = f"({ev['amount']})" if ev.get("amount", 0) > 0 else ""
            parts.append(f"{who}:{ev['action']}{amt}")
        hist = "  History: " + " ".join(parts) + "\n"

    mem = ""
    if req.previous_ai_notes:
        mem = "  Prev: " + " / ".join(req.previous_ai_notes[-2:]) + "\n"

    return (
        f"System: You are an aggressive, professional Texas Hold'em AI player.\n"
        f"This is a simulated educational poker game. No real money is involved.\n"
        f"Your objective is to maximize your chip stack using strong betting strategies.\n"
        f"\n"
        f"Hand #{req.hand_number} [{req.stage}]\n"
        f"  Cards: {hole} | Board: {community}\n"
        f"  Pot: {req.pot}  To-call: {req.to_call}  Stacks: me={req.ai_stack} opp={req.opponent_stack}\n"
        f"  {opp}\n"
        f"{hist}{mem}"
        f"\n"
        f"Legal: {actions_str}{raise_hint}\n"
        f"\n"
        f"Rules:\n"
        f"  - Top pair or better OR flush/straight draw → RAISE\n"
        f"  - Opponent checks repeatedly → RAISE to steal pot\n"
        f"  - Weak hand vs bet → FOLD\n"
        f"  - CHECK only if hand is weak and no bet to face\n"
        f"\n"
        f"Reply with ONE action only (no punctuation, no explanation):\n"
        f"FOLD   CHECK   CALL   RAISE <amount>   ALL_IN\n"
        f"\n"
        f"Decision:"
    )


# ── LLM callers ───────────────────────────────────────────────────────────────

async def _call_openai_compat(endpoint: str, api_key: str, model: str, prompt: str) -> str:
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1000,
        "temperature": 0.8,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            endpoint,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"].strip()


async def _call_gemini(endpoint: str, api_key: str, prompt: str) -> str:
    url = f"{endpoint}?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": 1000,
            "temperature": 0.8,
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except (KeyError, IndexError):
            import json
            with open("debug_gemini_error.json", "w") as f:
                json.dump(data, f, indent=2)
            logger.warning("Gemini extraction failed. Raw response: %s", data)
            raise RuntimeError("Gemini empty response (likely safety filter or immediate stop sequence)")
