<template>
  <!-- Outer wrapper — establishes a stacking context for z-index -->
  <div
    class="seat-wrapper"
    :class="{
      'is-active-turn': isCurrentTurn,
      'is-folded': player.folded,
      'is-opponent': isOpponent,
      'is-revealed': isOpponent && holeCards && holeCards.length > 0
    }"
  >
    <!-- ── Cards area ──────────────────────────────── -->
    <!--
      For the HERO (bottom): cards render ABOVE the info-card.
      For the OPPONENT (top): cards render BELOW the info-card.
      z-index is always higher than the info-card panel.
    -->
    <div class="cards-area" v-if="shouldShowCards">
      <!-- Show actual face cards if holeCards provided (hero private OR showdown reveal) -->
      <template v-if="holeCards && holeCards.length > 0">
        <CardView
          v-for="(card, idx) in holeCards"
          :key="idx"
          :cardStr="card"
          :visible="true"
          :highlighted="isCardHighlighted(card)"
          class="hole-card"
          :class="`card-slot-${idx}`"
        />
      </template>
      <!-- Card backs: opponent pre-showdown OR waiting for deal -->
      <template v-else>
        <CardView :visible="false" class="hole-card card-slot-0" />
        <CardView :visible="false" class="hole-card card-slot-1" />
      </template>
    </div>

    <!-- ── Info panel ──────────────────────────────── -->
    <div class="info-card">
      <div class="name-row">
        <span class="dealer-btn" v-if="isDealer" title="Dealer">D</span>
        <span class="ai-badge" v-if="player.player_id === 'ai_seat'" title="AI Opponent">AI</span>
        <span class="name">{{ player.display_name }}</span>
      </div>
      <div class="chips-row">
        <span class="chip-icon">●</span>
        <span class="chips">{{ player.chips }}</span>
      </div>

      <!-- Status badges -->
      <div class="status-tag folded-tag" v-if="player.folded">Folded</div>
      <div class="status-tag allin-tag" v-else-if="player.all_in">All-in</div>
      <div class="status-tag reveal-tag" v-else-if="isOpponent && holeCards && holeCards.length > 0">Shown</div>
      <div class="status-tag turn-tag" v-else-if="isCurrentTurn">{{ isOpponent ? 'Acting' : 'Your turn' }}</div>
    </div>

    <!-- ── Current round bet chip ─────────────────── -->
    <div class="bet-chip" v-if="player.bet_in_round > 0">
      <span>{{ player.bet_in_round }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CardView from './CardView.vue'
import { normalizeCard } from '@/utils/cardFormat'

const props = defineProps({
  player: {
    type: Object,
    required: true
  },
  isCurrentTurn: {
    type: Boolean,
    default: false
  },
  isDealer: {
    type: Boolean,
    default: false
  },
  /**
   * Hero's private hole cards array (e.g. ["♥A", "♣K"]).
   * Empty for opponent seats — will show card backs instead.
   */
  holeCards: {
    type: Array,
    default: () => []
  },
  /**
   * Whether this seat belongs to the local player (hero).
   */
  isOpponent: {
    type: Boolean,
    default: false
  },
  /**
   * Cards to highlight if they form part of winning combination
   */
  highlightCards: {
    type: Array,
    default: () => []
  }
})

const isCardHighlighted = (cardStr) => {
  if (!props.highlightCards || props.highlightCards.length === 0 || !cardStr) return false
  const norm = normalizeCard(cardStr)
  if (!norm.valid) return false
  return props.highlightCards.some(hc => {
    const hNorm = normalizeCard(hc)
    return hNorm.valid && hNorm.code === norm.code
  })
}

// Always show card area — folded seats show greyed-out backs still
const shouldShowCards = computed(() => true)
</script>

<style scoped>
/* ── Wrapper: stacking context ────────────────────── */
.seat-wrapper {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  /* Important: establish stacking context so z-index children work correctly */
}

/* ── Cards area ───────────────────────────────────── */
.cards-area {
  display: flex;
  gap: 7px;
  position: relative;
  z-index: 10; /* ABOVE info-card's z-index */
}

/* Hero (bottom seat): cards above the info panel — gap so name/chips visible */
.seat-wrapper:not(.is-opponent) .cards-area {
  order: -1; /* render first in DOM flow = visually above */
  margin-bottom: 8px; /* clear gap between cards and info panel top */
}

/* Opponent (top seat): cards below the info panel — gap so name/chips visible */
.seat-wrapper.is-opponent .cards-area {
  order: 1; /* render after info panel = visually below */
  margin-top: 8px; /* clear gap between info panel bottom and cards */
}

/* Slight fan effect */
.hole-card.card-slot-0 {
  transform: rotate(-4deg) translateY(2px);
  transform-origin: bottom center;
}
.hole-card.card-slot-1 {
  transform: rotate(4deg) translateY(2px);
  transform-origin: bottom center;
}

/* ── Info panel ───────────────────────────────────── */
.info-card {
  background:
    linear-gradient(180deg, rgba(217, 173, 88, 0.075), rgba(255, 255, 255, 0.02)),
    rgba(18, 27, 33, 0.92);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.68rem 1.05rem;
  min-width: 144px;
  text-align: center;
  box-shadow: var(--shadow-sm);
  position: relative;
  z-index: 5; /* lower than cards-area */
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.is-active-turn .info-card {
  border-color: rgba(241, 199, 106, 0.55);
  box-shadow: 0 0 0 1px rgba(241, 199, 106, 0.18), 0 0 22px rgba(241, 199, 106, 0.2);
}

.is-folded .info-card {
  opacity: 0.55;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 4px;
}

.dealer-btn {
  background-color: var(--text-primary);
  color: var(--bg-panel-solid);
  font-weight: 900;
  font-size: 9px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-badge {
  background-color: rgba(31, 122, 79, 0.26);
  color: #a8d7b7;
  font-weight: 900;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(217, 173, 88, 0.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 2px;
}

.name {
  color: var(--text-primary);
  font-weight: 800;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.chips-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: var(--accent-turn);
  font-size: 15px;
  font-weight: 700;
}

.chip-icon {
  font-size: 10px;
  color: var(--accent-turn);
}

/* Status badges */
.status-tag {
  font-size: 0.64rem;
  font-weight: 850;
  border-radius: var(--radius-pill);
  padding: 2px 7px;
  margin-top: 6px;
  display: inline-block;
  letter-spacing: 0;
  text-transform: none;
}

.folded-tag {
  background-color: rgba(255, 255, 255, 0.06);
  color: var(--text-tertiary);
}

.allin-tag {
  background-color: rgba(230, 111, 104, 0.14);
  color: #f1aaa5;
}

.turn-tag {
  background-color: rgba(241, 199, 106, 0.16);
  color: var(--accent-turn);
  border: 1px solid rgba(241, 199, 106, 0.34);
}

.reveal-tag {
  background-color: rgba(217, 173, 88, 0.13);
  color: var(--accent-turn);
  border: 1px solid rgba(217, 173, 88, 0.28);
}

/* Showdown reveal: amber glow on opponent's info-card */
.is-revealed .info-card {
  border-color: rgba(217, 173, 88, 0.4);
  box-shadow: 0 0 18px rgba(217, 173, 88, 0.14);
}


/* ── Bet chip ─────────────────────────────────────── */
.bet-chip {
  position: absolute;
  background-color: var(--bg-app);
  border: 2px solid var(--accent-turn);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-turn);
  font-weight: 800;
  font-size: 11px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
  z-index: 15;
  white-space: nowrap;
}

@media (max-width: 720px) {
  .info-card {
    min-width: 132px;
    padding: 0.58rem 0.85rem;
  }

  .name {
    max-width: 86px;
  }
}

/* Bet chip position: hero side = towards center (top), opponent side = towards center (bottom) */
.seat-wrapper:not(.is-opponent) .bet-chip {
  top: calc(100% - 18px);  /* below seat near table center */
  right: -12px;
}

.seat-wrapper.is-opponent .bet-chip {
  bottom: calc(100% - 18px);
  right: -12px;
}
</style>
