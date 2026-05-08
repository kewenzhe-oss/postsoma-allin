"""
ai_agent.py — Calls the user-supplied LLM to decide the AI player's poker action.

Supported protocols:
  • "openai"  — standard /chat/completions  (OpenAI, DeepSeek, Qwen, OpenRouter, Custom)
  • "gemini"  — Google generativelanguage REST  (generateContent)

Key design decisions:
  - The prompt uses a system+user message structure to anchor the AI into a confident,
    aggressive playing style. Pure "assistant" prompts tend to over-index on CHECK.
  - Parser searches the ENTIRE response (not just line start) for the action keyword,
    then extracts a raise amount with regex if present.
  - Fallback order on parse failure: CALL > CHECK > FOLD (never freeze the game).
  - raw_text is logged at INFO so operators can see the model's reasoning.
"""

import re
import logging
import httpx
from typing import Optional
from online.ai_providers import PROVIDER_ALLOWLIST

logger = logging.getLogger(__name__)

# ── Prompt builder ──────────────────────────────────────────────────────────

_SYSTEM_PERSONA = (
    "You are a sharp, aggressive heads-up poker professional. "
    "You exploit passive opponents mercilessly: you raise strong hands, "
    "semi-bluff draws, and c-bet frequently. "
    "You are NOT afraid to fold weak hands, but you never simply check when "
    "a bet would be profitable. "
    "You always respond with a single action token and nothing else."
)

def _build_prompt(game_snapshot: dict) -> str:
    hole = game_snapshot.get("hole_cards", [])
    community = game_snapshot.get("community_cards", [])
    pot = game_snapshot.get("pot", 0)
    current_bet = game_snapshot.get("current_bet", 0)
    my_chips = game_snapshot.get("my_chips", 0)
    my_bet_in_round = game_snapshot.get("my_bet_in_round", 0)
    stage = game_snapshot.get("stage", "PREFLOP")
    available_actions = game_snapshot.get("available_actions", [])
    opponent_chips = game_snapshot.get("opponent_chips", 0)
    opponent_bet = game_snapshot.get("opponent_bet_in_round", 0)
    small_blind = game_snapshot.get("small_blind", 5)
    big_blind = game_snapshot.get("big_blind", 10)

    actions_list = [a["action"] for a in available_actions]
    actions_str = " | ".join(actions_list)

    raise_info = ""
    for a in available_actions:
        if a["action"] == "RAISE":
            raise_info = f"\n  RAISE amount must be an integer between {a.get('min_amount','?')} and {a.get('max_amount','?')} (total chips bet this round)"

    community_str = " ".join(community) if community else "none"
    to_call = current_bet - my_bet_in_round  # chips I actually need to add

    return (
        f"=== HEADS-UP NO-LIMIT TEXAS HOLD'EM ===\n"
        f"Stage     : {stage}\n"
        f"My cards  : {' '.join(hole)}\n"
        f"Board     : {community_str}\n"
        f"Pot       : {pot}  |  To call: {to_call}  |  SB/BB: {small_blind}/{big_blind}\n"
        f"My chips  : {my_chips} (bet this round: {my_bet_in_round})\n"
        f"Opp chips : {opponent_chips} (bet this round: {opponent_bet})\n"
        f"\n"
        f"LEGAL ACTIONS: {actions_str}{raise_info}\n"
        f"\n"
        f"Respond with EXACTLY ONE token from the legal actions above.\n"
        f"If RAISE, append the integer amount separated by a space.\n"
        f"Examples: FOLD | CALL | CHECK | RAISE 60 | ALL_IN\n"
        f"\n"
        f"DECISION:"
    )


# ── LLM callers ────────────────────────────────────────────────────────────

async def _call_openai_compat(endpoint: str, api_key: str, model: str, prompt: str) -> str:
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": _SYSTEM_PERSONA},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": 16,
        "temperature": 0.7,   # higher = less deterministically CHECK
        "stop": ["\n", "."],  # stop after the first token/line
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(endpoint, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


async def _call_gemini(endpoint: str, api_key: str, prompt: str) -> str:
    url = f"{endpoint}?key={api_key}"
    full_prompt = f"{_SYSTEM_PERSONA}\n\n{prompt}"
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {
            "maxOutputTokens": 16,
            "temperature": 0.7,
            "stopSequences": ["\n", "."],
        },
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()


# ── Response parser ─────────────────────────────────────────────────────────

def _parse_action(text: str, available_actions: list) -> tuple[str, Optional[int]]:
    """
    Robustly parse the LLM text output into (action, amount).

    Strategy:
      1. Upper-case the entire text and search for any legal keyword ANYWHERE in it
         (not just at line start — models sometimes prefix with spaces or punctuation).
      2. For RAISE, extract the first integer found after the keyword.
      3. Validate the parsed action is in the available set.
      4. Fallback order on failure: CALL > CHECK > FOLD (never freeze).
    """
    if not available_actions:
        return "FOLD", None

    valid = {a["action"].upper() for a in available_actions}
    upper_text = text.strip().upper() if text else ""

    # Priority order for searching (most decisive first)
    search_order = ["ALL_IN", "RAISE", "CALL", "FOLD", "CHECK"]

    for keyword in search_order:
        # Accept both ALL_IN and ALL-IN spellings
        patterns = [keyword]
        if keyword == "ALL_IN":
            patterns.append("ALL-IN")
            patterns.append("ALLIN")

        for pat in patterns:
            normalized = "ALL_IN" if keyword == "ALL_IN" else keyword
            if normalized not in valid:
                continue
            # Search anywhere in the response
            if re.search(r'\b' + pat.replace("_", "[_-]?") + r'\b', upper_text):
                amount = None
                if normalized == "RAISE":
                    # Find the integer that follows RAISE (or anywhere nearby)
                    m = re.search(r'RAISE\s+(\d+)', upper_text)
                    if not m:
                        m = re.search(r'(\d+)', upper_text)
                    if m:
                        amount = int(m.group(1))
                        # Clamp to valid range
                        for a in available_actions:
                            if a["action"] == "RAISE":
                                lo = a.get("min_amount") or 0
                                hi = a.get("max_amount") or amount
                                amount = max(lo, min(hi, amount))
                                break
                    else:
                        # Use min raise if no number found
                        for a in available_actions:
                            if a["action"] == "RAISE":
                                amount = a.get("min_amount")
                                break
                logger.info("Parser matched keyword=%r → action=%s amount=%s (text=%r)", pat, normalized, amount, text)
                return normalized, amount

    # ── Fallback ────────────────────────────────────────────────────────
    logger.warning("Parser found no keyword in response %r; using fallback", text)
    for preferred in ("CALL", "CHECK", "FOLD"):
        if preferred in valid:
            return preferred, None
    return available_actions[0]["action"], None


# ── Public interface ─────────────────────────────────────────────────────────

async def decide_action(
    ai_config: dict,
    game_snapshot: dict,
) -> tuple[str, Optional[int]]:
    """
    Call the LLM and return (action, amount).
    Never raises — returns a safe fallback on any error.
    """
    provider_key = ai_config.get("provider_name", "").lower()
    model = ai_config.get("model", "")
    api_key = ai_config.get("api_key", "")
    custom_base_url = ai_config.get("base_url") or None
    available_actions = game_snapshot.get("available_actions", [])

    if not available_actions:
        return "FOLD", None

    provider_info = PROVIDER_ALLOWLIST.get(provider_key)
    if not provider_info:
        logger.warning("AI agent: unknown provider '%s', defaulting to CALL/CHECK", provider_key)
        return _parse_action("", available_actions)

    protocol = provider_info.get("protocol", "openai")

    # Resolve endpoint
    if custom_base_url:
        endpoint = custom_base_url.rstrip("/")
        if protocol == "openai" and not endpoint.endswith("/chat/completions"):
            if endpoint.endswith("/v1"):
                endpoint += "/chat/completions"
            else:
                endpoint += "/v1/chat/completions"
    else:
        raw = provider_info.get("base_url")
        if not raw:
            logger.warning("AI agent: no base_url for provider '%s'", provider_key)
            return _parse_action("", available_actions)
        endpoint = raw.format(model=model)

    prompt = _build_prompt(game_snapshot)

    try:
        if protocol == "gemini":
            raw_text = await _call_gemini(endpoint, api_key, prompt)
        else:
            raw_text = await _call_openai_compat(endpoint, api_key, model, prompt)

        logger.info("AI raw response from %s/%s: %r", provider_key, model, raw_text)
        action, amount = _parse_action(raw_text, available_actions)
        logger.info("AI final decision: %s %s", action, amount)
        return action, amount

    except httpx.TimeoutException:
        logger.warning("AI agent: LLM call timed out after 20s, falling back")
    except httpx.HTTPStatusError as e:
        logger.warning("AI agent: LLM HTTP %s error, falling back", e.response.status_code)
    except Exception as e:
        logger.warning("AI agent: unexpected error (%s), falling back", e)

    return _parse_action("", available_actions)
