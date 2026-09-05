"""
ai_action_parser.py — Hardened multi-pass action parser for AI responses.

Pass 1: JSON parse (supports structured JSON output with reasoning/confidence/tags).
Pass 2: Explicit anchor search (matches 'Decision: <ACTION> [amount]' or 'Action: <ACTION>').
Pass 3: Last line decision parse (matches single action on the final line, immune to CoT words).
Pass 4: Emergency safe-action fallback if all passes fail.

Prevents reasoning sentences like "I won't ALL-IN, so I fold" from falsely triggering ALL-IN.
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


@dataclass
class ParseResult:
    action: str
    amount: Optional[int] = None
    confidence: float = 0.5
    reason: str = ""
    strategy_tags: List[str] = field(default_factory=list)
    parse_status: str = "ok"          # "json_ok" | "anchored_ok" | "last_line_ok" | "emergency_fallback"
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

    # ── Pass 2: Explicit anchor search (e.g. 'Decision: CALL') ───────────────
    anchor_result = _try_anchored_parse(text, valid, available_actions)
    if anchor_result:
        logger.info("Parser: anchor parse succeeded → %s %s", anchor_result.action, anchor_result.amount)
        return anchor_result

    # ── Pass 3: Last line decision parse (e.g. final line 'FOLD') ───────────
    last_line_result = _try_last_line_parse(text, valid, available_actions)
    if last_line_result:
        logger.info("Parser: last line parse succeeded → %s %s", last_line_result.action, last_line_result.amount)
        return last_line_result

    # ── Pass 4: Emergency safe fallback ──────────────────────────────────────
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
        return None

    amount = _parse_amount(obj.get("amount"), normalized, available_actions)
    confidence = float(obj.get("confidence", 0.5))
    confidence = max(0.0, min(1.0, confidence))
    reason = str(obj.get("reason", ""))[:200]
    tags = [str(t) for t in obj.get("strategy_tags", []) if isinstance(t, str)][:5]

    return ParseResult(
        action=normalized,
        amount=amount,
        confidence=confidence,
        reason=reason,
        strategy_tags=tags,
        parse_status="json_ok",
    )


# ── Pass 2: Anchor search ─────────────────────────────────────────────────────

def _try_anchored_parse(
    text: str,
    valid: set,
    available_actions: List[Dict[str, Any]],
) -> Optional[ParseResult]:
    """
    Search for lines with explicit decision markers, e.g.:
      'Decision: RAISE 30'
      '**Action**: CALL'
      'Final Decision: ALL_IN'
    Scans from bottom to top so that final conclusion takes precedence.
    """
    lines = [l.strip() for l in text.strip().splitlines() if l.strip()]
    anchor_pattern = re.compile(
        r'(?:DECISION|ACTION|FINAL\s+ACTION|CHOICE|MY\s+MOVE)\s*[:：\-]\s*[*`_]*([A-Za-z_\-]+(?:\s+[A-Za-z_\-]+)?)[*`_]*(?:\s+[*`_]*\$?(\d+)[*`_]*)?',
        re.IGNORECASE
    )

    for line in reversed(lines):
        m = anchor_pattern.search(line)
        if m:
            raw_act = m.group(1).upper().replace("-", "_").replace(" ", "_")
            normalized = _normalize_action(raw_act)
            if normalized and normalized in valid:
                amount = None
                if normalized == "RAISE":
                    raw_amt = m.group(2)
                    if raw_amt:
                        amount = int(raw_amt)
                    amount = _clamp_raise(amount, available_actions)
                return ParseResult(
                    action=normalized,
                    amount=amount,
                    parse_status="anchored_ok",
                )

    return None


# ── Pass 3: Last line parse ───────────────────────────────────────────────────

def _try_last_line_parse(
    text: str,
    valid: set,
    available_actions: List[Dict[str, Any]],
) -> Optional[ParseResult]:
    """
    Check if the last non-empty line contains a single decision action word, e.g.:
      'RAISE 50'
      'FOLD'
      '**CALL**'
    """
    lines = [l.strip() for l in text.strip().splitlines() if l.strip()]
    if not lines:
        return None

    # Inspect up to the last 2 lines in reverse
    for line in reversed(lines[-2:]):
        # Strip common markdown formatting
        cleaned = re.sub(r'[*`_#>]', '', line).strip()
        # Match single action word, optionally followed by an amount
        m = re.match(
            r'^(?:I\s+)?(ALL[-_]?IN|ALL\s+IN|RAISE|BET|CALL|CHECK|FOLD)(?:\s+\$?(\d+))?[.!]?$',
            cleaned,
            re.IGNORECASE
        )
        if m:
            raw_act = m.group(1).upper().replace("-", "_").replace(" ", "_")
            normalized = _normalize_action(raw_act)
            if normalized and normalized in valid:
                amount = None
                if normalized == "RAISE":
                    raw_amt = m.group(2)
                    if raw_amt:
                        amount = int(raw_amt)
                    amount = _clamp_raise(amount, available_actions)
                return ParseResult(
                    action=normalized,
                    amount=amount,
                    parse_status="last_line_ok",
                )

    return None


# ── Pass 4: Safe fallback ─────────────────────────────────────────────────────

def _safe_fallback(valid: set) -> str:
    for preferred in ("CHECK", "CALL", "FOLD"):
        if preferred in valid:
            return preferred
    return next(iter(valid))  # last resort: first available


# ── Helpers ───────────────────────────────────────────────────────────────────

def _normalize_action(raw: str) -> Optional[str]:
    """Normalize action string to canonical form, or None if unrecognized."""
    clean = re.sub(r'[^A-Z_\- ]', '', raw.upper().strip())
    clean = clean.replace("-", "_").replace(" ", "_")
    return _NORMALIZE.get(clean)


def _parse_amount(
    raw_amount: Any,
    action: str,
    available_actions: List[Dict[str, Any]],
) -> Optional[int]:
    """Parse and clamp RAISE amount. Returns None for non-RAISE actions."""
    if action != "RAISE":
        return None
    if raw_amount is None:
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
