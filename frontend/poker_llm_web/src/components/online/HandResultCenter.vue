<template>
  <!--
    HandResultCenter.vue
    Shown in the table center after hand_finished, until the next hand_started.
    Replaces CommunityCards in the center zone.
    Backend auto-starts the next hand after 5 seconds, so this is a display-only component.
  -->
  <div class="hand-result-center">
    <div class="result-header">
      <span class="hand-badge">HAND #{{ result.hand_number }}</span>
      <span class="result-label">{{ endedByLabel }}</span>
    </div>

    <!-- Winners list -->
    <div class="winners-area">
      <div
        v-for="(winner, idx) in result.winners"
        :key="idx"
        class="winner-row"
      >
        <span class="winner-name">{{ winner.display_name || winner.player_id }}</span>
        <span class="winner-amount">+{{ winner.amount }}</span>
      </div>
      <div v-if="result.winners.length === 0" class="winner-row no-winner">
        <span>—</span>
      </div>
    </div>

    <!-- Showdown Hand Description -->
    <div v-if="result.showdown_info" class="showdown-desc">
      <div class="desc-badge">WINNING HAND</div>
      <div class="desc-text">{{ result.showdown_info.winningHandDescription }}</div>
    </div>

    <!-- Pot summary -->
    <div class="pot-summary">
      <span class="pot-label">POT</span>
      <span class="pot-amount">{{ result.awarded_pot }}</span>
    </div>

    <!-- Countdown / status -->
    <div class="next-hand-notice">
      Next hand starting soon
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /**
   * latestHandResult from online.js store:
   * {
   *   hand_number,
   *   winners: [{ player_id, display_name, amount }],
   *   awarded_pot,
   *   ended_by: 'fold' | 'showdown' | 'unknown'
   * }
   */
  result: {
    type: Object,
    required: true
  }
})

const endedByLabel = computed(() => {
  if (props.result.ended_by === 'fold') return 'Won by fold'
  if (props.result.ended_by === 'showdown') return 'Showdown'
  return 'Hand complete'
})
</script>

<style scoped>
.hand-result-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background-color: rgba(8, 11, 15, 0.58);
  border: 1px solid rgba(241, 199, 106, 0.26);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(6px);
  min-width: 260px;
  text-align: center;
}

/* ── Header ───────────────────────────────────────── */
.result-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.hand-badge {
  font-size: 11px;
  color: var(--text-tertiary);
  letter-spacing: 1.5px;
  font-weight: 600;
}

.result-label {
  font-size: 0.92rem;
  font-weight: 850;
  letter-spacing: 0.01em;
  color: var(--accent-turn);
  text-transform: none;
}

/* ── Winners ──────────────────────────────────────── */
.winners-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.winner-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 12px;
  background-color: rgba(121, 216, 144, 0.12);
  border: 1px solid rgba(121, 216, 144, 0.24);
  border-radius: var(--radius-sm);
}

.winner-row.no-winner {
  background-color: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: var(--text-tertiary);
}

.winner-name {
  color: var(--text-primary);
  font-weight: 850;
  font-size: 15px;
}

.winner-amount {
  color: var(--success);
  font-weight: 900;
  font-size: 15px;
}

/* ── Showdown Description ────────────────────────── */
.showdown-desc {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 4px 0;
  padding: 8px;
  background-color: rgba(217, 173, 88, 0.1);
  border-radius: var(--radius-sm);
  width: 100%;
}

.desc-badge {
  font-size: 9px;
  color: var(--accent-turn);
  letter-spacing: 1px;
  font-weight: 700;
  margin-bottom: 2px;
}

.desc-text {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}

/* ── Pot summary ──────────────────────────────────── */
.pot-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 14px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  border: 1px solid var(--border-subtle);
}

.pot-label {
  font-size: 10px;
  color: var(--text-secondary);
  letter-spacing: 1.5px;
  font-weight: 700;
}

.pot-amount {
  font-size: 18px;
  font-weight: 800;
  color: var(--accent-turn);
}

/* ── Next hand notice ─────────────────────────────── */
.next-hand-notice {
  font-size: 11px;
  color: var(--text-tertiary);
  letter-spacing: 0.5px;
}
</style>
