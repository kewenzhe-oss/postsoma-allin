<template>
  <section class="apply-hub" :aria-labelledby="headingId">
    <header class="apply-header">
      <div>
        <span class="section-kicker">Apply · 用实战巩固</span>
        <h4 :id="headingId">{{ copy.titleZh }}</h4>
      </div>
      <p>{{ copy.titleEn }}</p>
    </header>

    <p class="apply-intro">
      {{ copy.detail }}
    </p>

    <ModeSelector
      compact
      show-quick-practice
      :heading-level="5"
      @select-mode="handleModeSelection"
    />

    <aside class="truth-boundary" aria-label="Training and free-play boundary">
      <strong>Verified training stays authoritative · 固定训练反馈仍是依据</strong>
      <ul>
        <li>{{ copy.truthSource }}</li>
        <li>好友与 AI 对局用于应用概念、体验不确定性和维持趣味，不提供固定训练评分。</li>
        <li>单手输赢、朋友意见或 AI 输出，都不能覆盖 baseline 或数学模型给出的训练反馈。</li>
      </ul>
    </aside>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import ModeSelector from '@/components/lobby/ModeSelector.vue'

const SOURCE_COPY = Object.freeze({
  preflop_range: Object.freeze({
    titleZh: '把翻前范围带入一对一对局',
    titleEn: 'Take your preflop range ideas into heads-up play.',
    detail: 'Notice how position, opponent actions, and uncertain outcomes feel after practicing a fixed baseline.',
    truthSource: '本训练的倾向反馈来自固定、版本化的 baseline-v1，而不是朋友或 AI 的评价。'
  }),
  pot_odds_ev: Object.freeze({
    titleZh: '在动态局面中识别价格与风险',
    titleEn: 'Recognize price and risk when the table becomes dynamic.',
    detail: 'Use the fixed-math drill as your anchor, then practice noticing bet sizes without treating a runout as proof.',
    truthSource: '本训练的答案来自固定 pot-odds-v1 数学模型，而不是牌桌结果或 AI 推测。'
  })
})

const props = defineProps({
  source: {
    type: String,
    required: true,
    validator: (value) => ['preflop_range', 'pot_odds_ev'].includes(value)
  }
})

const emit = defineEmits(['select-mode'])

const copy = computed(() => SOURCE_COPY[props.source])
const headingId = computed(() => `apply-hub-${props.source}`)

const handleModeSelection = (mode) => {
  if (mode !== 'hvh' && mode !== 'hva') return
  emit('select-mode', { mode, source: props.source })
}
</script>

<style scoped>
.apply-hub {
  margin-top: 1.2rem;
  padding: clamp(1rem, 2.5vw, 1.35rem);
  text-align: left;
  background:
    linear-gradient(145deg, rgba(31, 122, 79, 0.1), transparent 52%),
    rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(217, 173, 88, 0.24);
  border-radius: var(--radius-lg);
}

.apply-header {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  align-items: end;
  gap: 1rem;
}

.section-kicker {
  color: var(--accent-primary);
  font-size: var(--font-size-meta);
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.apply-header h4 {
  margin-top: 0.3rem;
  color: var(--text-primary);
  font-size: clamp(1.08rem, 2vw, 1.32rem);
  font-weight: 850;
}

.apply-header p,
.apply-intro {
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.55;
}

.apply-intro {
  margin: 0.65rem 0 0.9rem;
  color: var(--text-tertiary);
}

.truth-boundary {
  margin-top: 0.85rem;
  padding: 0.82rem 0.9rem;
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--accent-primary);
  border-radius: var(--radius-md);
}

.truth-boundary strong {
  color: var(--accent-primary-strong);
  font-size: 0.78rem;
}

.truth-boundary ul {
  margin: 0.48rem 0 0;
  padding-left: 1.1rem;
}

.truth-boundary li {
  margin-top: 0.24rem;
  font-size: 0.72rem;
  line-height: 1.5;
}

@media (max-width: 700px) {
  .apply-header {
    grid-template-columns: 1fr;
    align-items: start;
  }
}

@media (max-width: 520px) {
  .apply-hub {
    padding: 0.9rem;
  }
}
</style>
