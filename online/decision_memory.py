"""
decision_memory.py — AI's short-term memory of its own decisions.

Keeps the last N decisions so the prompt can include recent context:
  "I previously called on flop vs passive opponent; lost."
  "I raised preflop; opponent folded."

Rules:
  - Max 10 entries stored (ring buffer).
  - Only the last 3–5 are passed to the prompt to avoid context bloat.
  - Outcomes filled in after hand_finished.
  - Never stores API keys or raw prompts.
"""

import logging
from typing import List, Optional
from online.ai_schemas import DecisionMemoryEntry

logger = logging.getLogger(__name__)

MAX_ENTRIES = 10


class DecisionMemory:
    def __init__(self):
        self._entries: List[DecisionMemoryEntry] = []

    # ── Write ─────────────────────────────────────────────────────────────────

    def record(self, entry: DecisionMemoryEntry):
        """Append a new decision entry. Drops oldest if over MAX_ENTRIES."""
        self._entries.append(entry)
        if len(self._entries) > MAX_ENTRIES:
            self._entries.pop(0)
        logger.debug(
            "DecisionMemory: recorded hand=%s stage=%s action=%s",
            entry.hand_number, entry.stage, entry.action,
        )

    def update_outcome(
        self,
        hand_number: int,
        won: Optional[bool],
        chips_delta: Optional[int] = None,
        note: str = "",
    ):
        """
        After hand_finished, fill in the outcome for all entries from that hand.
        won=True means AI won the hand, won=False means lost, None=split/unknown.
        """
        for e in self._entries:
            if e.hand_number == hand_number and e.outcome == "unknown":
                if won is None:
                    e.outcome = "split"
                elif won:
                    e.outcome = "won"
                else:
                    e.outcome = "lost"
                e.chips_delta = chips_delta
                e.result_note = note
                logger.debug(
                    "DecisionMemory: outcome set hand=%s → %s chips_delta=%s",
                    hand_number, e.outcome, chips_delta,
                )

    # ── Read ──────────────────────────────────────────────────────────────────

    def get_recent(self, n: int = 5) -> List[DecisionMemoryEntry]:
        """Return the last n entries (most recent last)."""
        return self._entries[-n:]

    def format_for_prompt(self, n: int = 3) -> List[str]:
        """
        Compact string representations of the last n decisions for prompt injection.
        Format: "Hand #X [STAGE] → ACTION (outcome: won/lost/unknown) — reason"
        """
        recent = self.get_recent(n)
        lines = []
        for e in recent:
            amt = f" {e.amount}" if e.amount else ""
            delta = f", chips_delta={e.chips_delta:+d}" if e.chips_delta is not None else ""
            line = (
                f"Hand #{e.hand_number} [{e.stage}] → {e.action}{amt} "
                f"(outcome: {e.outcome}{delta}) — {e.reason or 'no reason'}"
            )
            lines.append(line)
        return lines
