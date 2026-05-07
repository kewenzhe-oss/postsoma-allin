"""
ai_action_parser.py — Hardened two-pass action parser for AI responses.

Pass 1: Try to parse a JSON object with action/amount/confidence/reason/strategy_tags.
Pass 2: Fallback to regex keyword search (supports messy model outputs).
Pass 3: Emergency safe-action fallback if both passes fail.

Returns a ParseResult with decision + parse_status + optional fallback_reason.
"""

import re
import json
import logging
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

# Action normalization table
_NORMALIZE: Dict[str, str] = {
    "ALL_IN":  "ALL_IN",
    "ALL-IN":  "ALL_IN",
    "ALLIN":   "ALL_IN",
    "ALL IN":  "ALL_IN",
    "RAISE":   "RAISE",
    "BET":     "RAISE",
    "CALL":    "CALL",
    "CHECK":   "CHECK",
    "FOLD":    "FOLD",
}

_KEYWORD_PRIORITY = ["ALL_IN", "ALL-IN", "ALLIN", "RAISE", "BET", "CALL", "FOLD", "CHECK"]


@dataclass
class ParseResult:
    action: str
    amount: Optional[int] = None
    confidence: float = 0.5
    reason: str = ""
    strategy_tags: List[str] = field(default_factory=list)
    parse_status: str = "ok"          # "json_ok" | "regex_fallback" | "emergency_fallback"
    fallback_reason: Optional[str] = None


def parse_response(
    text: str,
    available_actions: List[Dict[str, Any]],
) -> ParseResult:
    """
    Parse the raw LLM response into a ParseResult.
    Never raises. Always returns a valid action from available_actions.
    """
    if not available_actions:
        return ParseResult(action="FOLD", parse_status="emergency_fallback",
                           fallback_reason="no available actions")

    valid = {a["action"].upper() for a in available_actions}

    # ── Pass 1: JSON parse ────────────────────────────────────────────────────
    json_result = _try_json_parse(text, valid, available_actions)
    if json_result:
        logger.info("Parser: JSON parse succeeded → %s %s", json_result.action, json_result.amount)
        return json_result

    # ── Pass 2: Regex keyword search ─────────────────────────────────────────
    regex_result = _try_regex_parse(text, valid, available_actions)
    if regex_result:
        logger.info("Parser: regex fallback → %s %s", regex_result.action, regex_result.amount)
        return regex_result

    # ── Pass 3: Emergency safe fallback ──────────────────────────────────────
    safe = _safe_fallback(valid)
    logger.warning("Parser: emergency fallback → %s (raw text: %r)", safe, text[:80])
    return ParseResult(
        action=safe,
        parse_status="emergency_fallback",
        fallback_reason=f"could not parse response: {text[:60]!r}",
    )


# ── Pass 1: JSON ──────────────────────────────────────────────────────────────

def _try_json_parse(
    text: str,
    valid: set,
    available_actions: List[Dict[str, Any]],
) -> Optional[ParseResult]:
    """Attempt to extract and parse a JSON object from the response."""
    # Find the first {...} block (handles leading/trailing text)
    m = re.search(r'\{[^{}]*\}', text, re.DOTALL)
    if not m:
        return None
    try:
        obj = json.loads(m.group())
    except (json.JSONDecodeError, ValueError):
        return None

    raw_action = str(obj.get("action", "")).upper().strip()
    normalized = _normalize_action(raw_action)
    if not normalized or normalized not in valid:
        # JSON had action but it's not legal this turn
        return None

    amount = _parse_amount(obj.get("amount"), normalized, available_actions)
    confidence = float(obj.get("confidence", 0.5))
    confidence = max(0.0, min(1.0, confidence))
    reason = str(obj.get("reason", ""))[:200]  # cap length
    tags = [str(t) for t in obj.get("strategy_tags", []) if isinstance(t, str)][:5]

    return ParseResult(
        action=normalized,
        amount=amount,
        confidence=confidence,
        reason=reason,
        strategy_tags=tags,
        parse_status="json_ok",
    )


# ── Pass 2: Regex ─────────────────────────────────────────────────────────────

def _try_regex_parse(
    text: str,
    valid: set,
    available_actions: List[Dict[str, Any]],
) -> Optional[ParseResult]:
    """Search for action keywords anywhere in the response."""
    upper = text.upper()

    for keyword in _KEYWORD_PRIORITY:
        normalized = _normalize_action(keyword)
        if not normalized or normalized not in valid:
            continue
        # Match as whole word (handles ALL_IN, ALL-IN, ALLIN variants)
        pattern = keyword.replace("-", r"[\-_]?").replace(" ", r"\s*")
        if re.search(r'\b' + pattern + r'\b', upper):
            amount = None
            if normalized == "RAISE":
                m = re.search(r'(?:RAISE|BET)\s+(\d+)', upper)
                if not m:
                    m = re.search(r'(\d+)', upper)
                if m:
                    amount = int(m.group(1))
                amount = _clamp_raise(amount, available_actions)
            return ParseResult(
                action=normalized,
                amount=amount,
                parse_status="regex_fallback",
                fallback_reason="JSON parse failed; used keyword search",
            )

    return None


# ── Pass 3: Safe fallback ─────────────────────────────────────────────────────

def _safe_fallback(valid: set) -> str:
    for preferred in ("CALL", "CHECK", "FOLD"):
        if preferred in valid:
            return preferred
    return next(iter(valid))  # last resort: first available


# ── Helpers ───────────────────────────────────────────────────────────────────

def _normalize_action(raw: str) -> Optional[str]:
    """Normalize action string to canonical form, or None if unrecognized."""
    return _NORMALIZE.get(raw.upper().strip())


def _parse_amount(
    raw_amount: Any,
    action: str,
    available_actions: List[Dict[str, Any]],
) -> Optional[int]:
    """Parse and clamp RAISE amount. Returns None for non-RAISE actions."""
    if action != "RAISE":
        return None
    if raw_amount is None:
        # Use min raise
        for a in available_actions:
            if a["action"] == "RAISE":
                return a.get("min_amount")
        return None
    try:
        amount = int(raw_amount)
    except (ValueError, TypeError):
        return None
    return _clamp_raise(amount, available_actions)


def _clamp_raise(amount: Optional[int], available_actions: List[Dict[str, Any]]) -> Optional[int]:
    """Clamp a raise amount to [min_amount, max_amount] from available_actions."""
    if amount is None:
        for a in available_actions:
            if a["action"] == "RAISE":
                return a.get("min_amount")
        return None
    for a in available_actions:
        if a["action"] == "RAISE":
            lo = a.get("min_amount") or 0
            hi = a.get("max_amount") or amount
            return max(lo, min(hi, amount))
    return amount
