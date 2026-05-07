<template>
  <div class="community-area">
    <!-- Stage label -->
    <div class="stage-label" v-if="stage && stage !== 'preflop'">
      {{ stageLabel }}
    </div>

    <!-- Pot display -->
    <div class="pot-container">
      <div class="pot-label">MAIN POT</div>
      <div class="pot-value">
        <span class="chip-dot">●</span>
        {{ pot }}
      </div>
    </div>

    <!-- 5 community card slots -->
    <div class="cards-row">
      <template v-for="i in 5" :key="i">
        <CardView
          v-if="cards[i - 1]"
          :cardStr="cards[i - 1]"
          :visible="true"
          class="community-card"
        />
        <div v-else class="card-placeholder"></div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import CardView from './CardView.vue'

const props = defineProps({
  cards: {
    type: Array,
    default: () => []
  },
  pot: {
    type: Number,
    default: 0
  },
  stage: {
    type: String,
    default: null
  },
  /** Last awarded pot from hand_finished event — shown after pot resets to 0 */
  awardedPot: {
    type: Number,
    default: null
  }
})

const stageLabel = computed(() => {
  if (!props.stage) return ''
  return props.stage.charAt(0).toUpperCase() + props.stage.slice(1)
})
</script>

<style scoped>
.community-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

.stage-label {
  font-size: var(--font-size-meta);
  font-weight: 850;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
  background-color: rgba(0, 0, 0, 0.28);
  padding: 0.22rem 0.7rem;
  border-radius: var(--radius-pill);
}

.pot-container {
  background-color: rgba(0, 0, 0, 0.34);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  padding: 0.45rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(4px);
}

.pot-label {
  font-size: 0.62rem;
  color: var(--text-secondary);
  letter-spacing: 1px;
  font-weight: 600;
}

.pot-value {
  color: var(--accent-turn);
  font-size: clamp(1.15rem, 2.5vw, 1.45rem);
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 5px;
}

.chip-dot {
  font-size: 9px;
}

/* 5-card row */
.cards-row {
  display: flex;
  gap: clamp(5px, 1vw, 10px);
  align-items: center;
}

.card-placeholder {
  width: clamp(46px, 7vw, 62px);
  aspect-ratio: 5 / 7;
  border-radius: clamp(6px, 1vw, 9px);
  border: 1px dashed rgba(246, 240, 228, 0.2);
  background-color: rgba(0, 0, 0, 0.15);
}
</style>
