<template>
  <section class="guided-case">
    <details>
      <summary>{{ local(GUIDED_CASE.title) }} <span>{{ isZh ? '开始引导案例' : 'Start guided case' }}</span></summary>
      <p>{{ local(GUIDED_CASE.context) }}</p>
      <aside>{{ local(GUIDED_CASE.assumption) }}</aside>
      <LearningQuestions :questions="GUIDED_CASE.steps" :title="isZh ? '五问到决定' : 'Five questions to a decision'" />
    </details>
  </section>
</template>
<script setup>
import LearningQuestions from './LearningQuestions.vue'
import { GUIDED_CASE } from '@/training/lessons/decision-learning.js'
import { isZh } from '@/i18n/locale.js'
const local = value => value[isZh.value ? 'zh' : 'en']
</script>
<style scoped>
.guided-case { width: 100%; max-width: 1040px; padding: clamp(1rem, 3vw, 1.5rem); border: 1px solid var(--border-strong); border-radius: var(--radius-xl); background: var(--bg-panel-solid); color: var(--text-primary); }
summary { min-height: 44px; cursor: pointer; font-weight: 700; line-height: 1.7; }
summary span { margin-left: 1rem; color: var(--accent-primary); font-size: .9rem; }
summary:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 3px; }
p, aside { font-size: 1rem; line-height: 1.7; margin-top: 1rem; }
aside { padding: 1rem; border-left: 3px solid var(--accent-primary); color: var(--text-secondary); }
</style>
