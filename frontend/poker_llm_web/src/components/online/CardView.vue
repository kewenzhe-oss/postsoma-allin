<template>
  <!-- Face-down card -->
  <div v-if="!visible" class="card-view card-back">
    <div class="back-pattern"></div>
  </div>

  <!-- Fallback "?" card for invalid card data -->
  <div v-else-if="!card.valid" class="card-view card-unknown">
    <span class="unknown-rank">?</span>
  </div>

  <!-- Normal face-up card -->
  <div v-else class="card-view card-face" :class="card.color">
    <div class="card-corner top-left">
      <div class="corner-rank">{{ card.rank }}</div>
      <div class="corner-suit">{{ card.suitSymbol }}</div>
    </div>
    <div class="card-center-suit">{{ card.suitSymbol }}</div>
    <div class="card-corner bottom-right">
      <div class="corner-rank">{{ card.rank }}</div>
      <div class="corner-suit">{{ card.suitSymbol }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { normalizeCard } from '@/utils/cardFormat'

const props = defineProps({
  /**
   * Card string in backend format (e.g. "♥A", "♦10") or any supported format.
   * Can also be a pre-normalized card object. Optional — if omitted and visible=false,
   * renders card back.
   */
  cardStr: {
    type: [String, Object],
    default: null
  },
  /**
   * Whether to show the card face (true) or card back (false).
   * When false, cardStr is ignored.
   */
  visible: {
    type: Boolean,
    default: true
  }
})

const card = computed(() => normalizeCard(props.cardStr))
</script>

<style scoped>
.card-view {
  width: clamp(46px, 7vw, 62px);
  aspect-ratio: 5 / 7;
  height: auto;
  border-radius: clamp(6px, 1vw, 9px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.32);
  user-select: none;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

/* ── Face-up card ─────────────────────────────────── */
.card-face {
  background:
    linear-gradient(145deg, #fff8e8, #e7dcc3);
  border: 1px solid rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
  gap: 0;
}

.top-left {
  top: 4px;
  left: 5px;
}

.bottom-right {
  bottom: 4px;
  right: 5px;
  transform: rotate(180deg);
}

.corner-rank {
  font-size: clamp(10px, 1.7vw, 14px);
  font-weight: 900;
  line-height: 1;
  font-family: 'Inter', 'Georgia', serif;
}

.corner-suit {
  font-size: clamp(8px, 1.35vw, 11px);
  line-height: 1;
}

.card-center-suit {
  font-size: clamp(20px, 3.3vw, 30px);
  line-height: 1;
}

/* Red suits */
.card-face.red .corner-rank,
.card-face.red .corner-suit,
.card-face.red .card-center-suit {
  color: #C62828;
}

/* Black suits */
.card-face.black .corner-rank,
.card-face.black .corner-suit,
.card-face.black .card-center-suit {
  color: #1A1A1A;
}

/* ── Card back ────────────────────────────────────── */
.card-back {
  background:
    linear-gradient(145deg, #651c20, #24100f);
  border: 1px solid rgba(217, 173, 88, 0.24);
}

.back-pattern {
  width: 100%;
  height: 100%;
  background:
    repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.08) 0px,
      rgba(255, 255, 255, 0.08) 3px,
      transparent 3px,
      transparent 9px
    ),
    repeating-linear-gradient(
      -45deg,
      rgba(255, 255, 255, 0.04) 0px,
      rgba(255, 255, 255, 0.04) 3px,
      transparent 3px,
      transparent 9px
    );
  border-radius: inherit;
}

/* ── Unknown / fallback card ──────────────────────── */
.card-unknown {
  background-color: var(--bg-panel-raised);
  border: 1px dashed rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.unknown-rank {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: bold;
}
</style>
