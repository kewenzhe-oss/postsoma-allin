<template>
  <section class="apply-hub" :aria-labelledby="headingId">
    <header class="apply-header">
      <div>
        <span class="section-kicker">{{ commonCopy.kicker }}</span>
        <h4 :id="headingId">{{ copy.title }}</h4>
      </div>
      <p>{{ copy.subtitle }}</p>
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

    <aside class="truth-boundary" :aria-label="commonCopy.boundaryAria">
      <strong>{{ commonCopy.boundaryTitle }}</strong>
      <ul>
        <li>{{ copy.truthSource }}</li>
        <li>{{ commonCopy.freePlayBoundary }}</li>
        <li>{{ commonCopy.outcomeBoundary }}</li>
      </ul>
    </aside>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import ModeSelector from '@/components/lobby/ModeSelector.vue'
import { isZh } from '@/i18n/locale.js'

const SOURCE_COPY = Object.freeze({
  preflop_range: Object.freeze({
    en: Object.freeze({
      title: 'Take your preflop range ideas into heads-up play',
      subtitle: 'Apply a limited reference in a dynamic environment.',
      detail: 'Notice how position, opponent actions, and uncertain outcomes feel after practicing a fixed baseline.',
      truthSource: 'The tendency feedback comes from the fixed, versioned baseline-v1—not from a friend or AI opinion.'
    }),
    zh: Object.freeze({
      title: '把翻前范围带入一对一对局',
      subtitle: '在动态环境中应用一份受限参考。',
      detail: '练习固定 baseline 后，观察位置、对手行动与不确定结果如何改变你的思考。',
      truthSource: '本训练的倾向反馈来自固定、版本化的 baseline-v1，而不是朋友或 AI 的评价。'
    })
  }),
  pot_odds_ev: Object.freeze({
    en: Object.freeze({
      title: 'Recognize price and risk in a dynamic spot',
      subtitle: 'Apply fixed math without treating a runout as proof.',
      detail: 'Use the fixed-math exercise as your anchor, then practice noticing bet sizes and uncertainty.',
      truthSource: 'The exercise answer comes from the fixed pot-odds-v1 math model—not from a table result or AI guess.'
    }),
    zh: Object.freeze({
      title: '在动态局面中识别价格与风险',
      subtitle: '应用固定数学，不把单手结果当作证明。',
      detail: '以固定数学练习为锚点，再观察下注尺度与不确定性。',
      truthSource: '本训练的答案来自固定 pot-odds-v1 数学模型，而不是牌桌结果或 AI 推测。'
    })
  })
})

const COMMON_COPY = Object.freeze({
  en: Object.freeze({
    kicker: 'APPLY · USE IT IN PLAY',
    boundaryAria: 'Training and free-play boundary',
    boundaryTitle: 'References and free play serve different roles',
    freePlayBoundary: 'Friend and AI games help you apply the five questions and experience uncertainty. They do not provide a verified training score.',
    outcomeBoundary: 'One result, a friend’s opinion, or AI output cannot become range or math truth. AI is not the training judge.'
  }),
  zh: Object.freeze({
    kicker: '应用 · 用实战巩固',
    boundaryAria: '训练参考与自由对局边界',
    boundaryTitle: '参考与自由对局各有边界',
    freePlayBoundary: '好友与 AI 对局用于应用五问、体验不确定性和维持趣味，不提供已验证的训练评分。',
    outcomeBoundary: '单手输赢、朋友意见或 AI 输出，不会变成范围参考或数学事实；AI 不是训练裁判。'
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

const copy = computed(() => SOURCE_COPY[props.source][isZh.value ? 'zh' : 'en'])
const commonCopy = computed(() => COMMON_COPY[isZh.value ? 'zh' : 'en'])
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
