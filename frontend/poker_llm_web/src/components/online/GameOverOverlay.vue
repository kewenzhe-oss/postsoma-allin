<template>
  <!--
    GameOverOverlay.vue
    Shown when game_status === "game_over" or latestGameResult is set.
    Covers the table surface (not the header or debug panel).
  -->
  <div class="game-over-overlay">
    <div class="game-over-card">
      <!-- Title -->
      <div class="go-header">
        <h2 class="go-title">Game over</h2>
      </div>

      <!-- Match winner -->
      <div class="match-winner" v-if="result.winner">
        <span class="winner-label">Match winner</span>
        <div class="winner-row">
          <span class="winner-name">{{ result.winner.display_name || result.winner.player_id }}</span>
          <span class="winner-chips">{{ result.winner.chips }} chips</span>
        </div>
      </div>

      <!-- Final stacks -->
      <div class="final-stacks" v-if="result.final_stacks && result.final_stacks.length">
        <div class="stacks-label">Final stacks</div>
        <div
          v-for="(player, idx) in result.final_stacks"
          :key="idx"
          class="stack-row"
          :class="{ 'is-winner': result.winner && player.player_id === result.winner.player_id, 'is-bust': player.chips <= 0 }"
        >
          <span class="stack-name">{{ player.display_name || player.player_id }}</span>
          <span class="stack-chips">{{ player.chips }}</span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="go-actions">
        <button class="btn-rematch" @click="emit('rematch')">
          Rematch
        </button>
        <button class="btn-lobby" @click="emit('back-to-lobby')">
          Back to Lobby
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  /**
   * latestGameResult from online.js store:
   * {
   *   winner: { player_id, display_name, chips } | null,
   *   final_stacks: [{ player_id, display_name, chips }]
   * }
   */
  result: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['rematch', 'back-to-lobby'])
</script>

<style scoped>
/* ── Overlay: covers table area, not header ──────── */
.game-over-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(5, 8, 12, 0.82);
  backdrop-filter: blur(4px);
  z-index: 200;
  /* Prevent overlay bleeding into header via pointer-events */
  pointer-events: all;
}

/* ── Card ─────────────────────────────────────────── */
.game-over-card {
  background-color: var(--bg-panel-solid);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: 2.5rem 2.5rem 2rem;
  min-width: 320px;
  max-width: 420px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: var(--shadow-lg);
  text-align: center;
}

/* ── Header ──────────────────────────────────────── */
.go-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.go-title {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0;
  color: var(--text-primary);
  text-transform: none;
}

/* ── Match winner ────────────────────────────────── */
.match-winner {
  background-color: rgba(121, 216, 144, 0.09);
  border: 1px solid rgba(121, 216, 144, 0.24);
  border-radius: var(--radius-md);
  padding: 1rem 1.5rem;
}

.winner-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--success);
  margin-bottom: 0.6rem;
}

.winner-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.winner-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);
}

.winner-chips {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-turn);
  background-color: rgba(241, 199, 106, 0.12);
  padding: 2px 10px;
  border-radius: 12px;
}

/* ── Final stacks ────────────────────────────────── */
.final-stacks {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stacks-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin-bottom: 4px;
}

.stack-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  background-color: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
}

.stack-row.is-winner {
  background-color: rgba(121, 216, 144, 0.08);
  border-color: rgba(121, 216, 144, 0.22);
}

.stack-row.is-bust {
  opacity: 0.5;
}

.stack-name {
  color: var(--text-primary);
  font-weight: 600;
  font-size: 14px;
}

.stack-chips {
  font-size: 15px;
  font-weight: 800;
  color: var(--accent-turn);
}

.stack-row.is-bust .stack-chips {
  color: var(--text-tertiary);
}

/* ── Action buttons ──────────────────────────────── */
.go-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.btn-rematch,
.btn-lobby {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0;
  border: none;
  transition: opacity 0.15s ease, transform 0.1s ease;
}

.btn-rematch:hover,
.btn-lobby:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}
.btn-rematch:active,
.btn-lobby:active {
  transform: translateY(0);
}

.btn-rematch {
  background: linear-gradient(180deg, var(--accent-primary-strong), var(--accent-primary));
  color: var(--text-inverse);
}

.btn-lobby {
  background-color: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border: 1px solid var(--border-strong);
}
</style>
