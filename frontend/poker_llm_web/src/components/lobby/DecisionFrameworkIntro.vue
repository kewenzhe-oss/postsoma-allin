<template>
  <section class="framework-intro" aria-labelledby="decision-framework-title">
    <header class="framework-header">
      <div>
        <span class="section-kicker">{{ copy.kicker }}</span>
        <h2 id="decision-framework-title">{{ copy.title }}</h2>
      </div>
      <p>{{ copy.intro }}</p>
    </header>

    <ol class="framework-flow" :aria-label="copy.flowLabel">
      <li v-for="(step, index) in steps" :id="step.id" :key="step.id" class="framework-step">
        <div class="step-marker" aria-hidden="true">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
        </div>
        <div class="step-copy">
          <span class="step-name">{{ step.name }}</span>
          <h3>{{ step.question }}</h3>
          <p>{{ step.detail }}</p>
        </div>
      </li>
    </ol>

    <p class="framework-note">
      <strong>Hand → Context → Range → Price → Risk → Decision</strong>
      <span>{{ copy.note }}</span>
    </p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { isZh } from '@/i18n/locale.js'

const COPY = Object.freeze({
  en: Object.freeze({
    kicker: 'LEARN · THE FIVE QUESTIONS',
    title: 'One decision, five connected questions',
    intro: 'Follow the same order before every decision. This is one thinking process—not five separate courses.',
    flowLabel: 'Hand, Context, Range, Price, Risk decision process',
    note: 'Separate what is known, assumed, and uncertain before looking for a reference.',
    steps: Object.freeze([
      { id: 'hand', name: 'Hand', question: 'What do I have?', detail: 'Start with made value, improvement paths, blockers, and postflop playability.' },
      { id: 'context', name: 'Context', question: 'What spot am I in?', detail: 'Confirm position, effective stack, pot state, and prior action.' },
      { id: 'range', name: 'Range', question: 'What could we each have?', detail: 'Think in combinations and frequencies, not only whether one hand feels strong.' },
      { id: 'price', name: 'Price', question: 'What does this price require?', detail: 'Build the final pot, then identify the threshold for investing more.' },
      { id: 'risk', name: 'Risk', question: 'What could distort the decision?', detail: 'Check missing information, dirty outs, rake, future investment, and result bias.' }
    ])
  }),
  zh: Object.freeze({
    kicker: '学习 · 五问流程',
    title: '一个决定，五个相连的问题',
    intro: '每次决定前按同一顺序思考。这是一个连续流程，不是五门独立课程。',
    flowLabel: '手牌、局面、范围、价格、风险决策流程',
    note: '先把已知、假设与不确定性分开，再寻找参考答案。',
    steps: Object.freeze([
      { id: 'hand', name: '手牌（Hand）', question: '我拿到什么？', detail: '先看当前牌力、改善可能、阻断牌与翻后潜力。' },
      { id: 'context', name: '局面（Context）', question: '我处于什么局面？', detail: '确认位置、有效筹码、底池状态与前序行动。' },
      { id: 'range', name: '手牌范围（Range）', question: '我与对手可能有什么？', detail: '用组合与频率思考，不只问一手牌强不强。' },
      { id: 'price', name: '价格（Price）', question: '这个价格要求什么？', detail: '建立最终底池，再判断继续投入需要的门槛。' },
      { id: 'risk', name: '风险（Risk）', question: '哪些风险会让判断失真？', detail: '检查信息缺口、脏 outs、抽水（rake）、未来投入与结果偏差。' }
    ])
  })
})

const copy = computed(() => isZh.value ? COPY.zh : COPY.en)
const steps = computed(() => copy.value.steps)
</script>

<style scoped>
.framework-intro {
  width: 100%;
  max-width: 1040px;
  padding: clamp(1.1rem, 3vw, 1.65rem);
  background:
    linear-gradient(145deg, rgba(31, 122, 79, 0.09), transparent 48%),
    rgba(255, 255, 255, 0.025);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.framework-header {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  align-items: end;
  gap: clamp(1rem, 4vw, 3rem);
}

.section-kicker {
  color: var(--accent-primary);
  font-size: var(--font-size-meta);
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.framework-header h2 {
  margin-top: 0.3rem;
  color: var(--text-primary);
  font-size: clamp(1.35rem, 3vw, 1.85rem);
  font-weight: 850;
  line-height: 1.15;
}

.framework-header p {
  color: var(--text-secondary);
  font-size: 0.88rem;
  line-height: 1.6;
}

.framework-flow {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0;
  margin: 1.25rem 0 0;
  padding: 0;
  list-style: none;
}

.framework-step {
  min-width: 0;
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 0.65rem;
  padding: 0.85rem 0.8rem;
  background: rgba(7, 5, 4, 0.36);
  border-block: 1px solid var(--border-subtle);
  border-right: 1px solid var(--border-subtle);
  position: relative;
}

.framework-step:first-child {
  border-left: 1px solid var(--border-subtle);
  border-radius: var(--radius-md) 0 0 var(--radius-md);
}

.framework-step:last-child {
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.step-marker {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
  background: var(--accent-primary-strong);
  border-radius: 50%;
  font-family: var(--font-family-mono);
  font-size: 0.68rem;
  font-weight: 900;
}

.step-name {
  display: block;
  color: var(--accent-primary-strong);
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.step-copy h3 {
  margin-top: 0.28rem;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 850;
  line-height: 1.35;
}

.step-copy p {
  margin-top: 0.35rem;
  color: var(--text-tertiary);
  font-size: 0.72rem;
  line-height: 1.5;
}

.framework-note {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.35rem 1rem;
  margin-top: 0.85rem;
  color: var(--text-tertiary);
  font-size: 0.72rem;
  line-height: 1.5;
}

.framework-note strong {
  color: var(--text-secondary);
  font-family: var(--font-family-mono);
}

@media (max-width: 900px) {
  .framework-flow {
    grid-template-columns: 1fr;
  }

  .framework-step {
    border: 1px solid var(--border-subtle);
    border-bottom: 0;
  }

  .framework-step:first-child {
    border-radius: var(--radius-md) var(--radius-md) 0 0;
  }

  .framework-step:last-child {
    border-bottom: 1px solid var(--border-subtle);
    border-radius: 0 0 var(--radius-md) var(--radius-md);
  }
}

@media (max-width: 700px) {
  .framework-header {
    grid-template-columns: 1fr;
    align-items: start;
  }
}

@media (max-width: 520px) {
  .framework-intro {
    padding: 1rem;
  }

  .framework-step {
    padding: 0.78rem 0.72rem;
  }
}
</style>
