<template>
  <article class="range-updating" aria-labelledby="range-updating-title">
    <span class="section-kicker">{{ isZh ? '范围更新 · 组合与行动频率' : 'RANGE UPDATING · COMBOS AND ACTION LIKELIHOODS' }}</span>
    <h2 id="range-updating-title">{{ isZh ? '观察行动，再更新范围' : 'Observe an action, then update the range' }}</h2>
    <p>{{ isZh ? '12 道冻结题设，覆盖加注、跟注与过牌。每轮 6 题；训练如何更新相对权重，不猜唯一底牌。' : '12 frozen exercises covering raises, calls and checks. Six questions per round; update relative weights instead of guessing one hand.' }}</p>
    <p>{{ isZh ? '仍需复习：' : 'Unresolved questions: ' }}{{ state.mistakes.length }} · {{ RANGE_UPDATING_VERSION }}</p>
    <div class="range-controls">
      <button type="button" @click="start(false)">{{ isZh ? '新一轮混合练习' : 'New mixed session' }}</button>
      <button type="button" :disabled="!state.mistakes.length" @click="start(true)">{{ isZh ? '复习范围更新错题' : 'Review range updating mistakes' }}</button>
    </div>
    <LearningQuestions :key="round" :questions="questions" :title="isZh ? (review ? '错题复习' : '范围更新练习') : (review ? 'Mistake review' : 'Range updating practice')" :allow-restart="false" @answer="record" />
    <p>{{ isZh ? '每次作答保存在此浏览器。题设行动频率来自内部教学假设，不是书中的 Solver 数据。' : 'Each answer is saved in this browser. Action likelihoods are internal teaching assumptions, not solver data from the book.' }}</p>
  </article>
</template>
<script setup>
import { ref } from 'vue'
import LearningQuestions from './LearningQuestions.vue'
import { isZh } from '@/i18n/locale.js'
import { RANGE_UPDATING_VERSION } from '@/training/drills/range-updating-v1.js'
import { loadRangeUpdatingState, recordRangeUpdatingAnswer, createRangeUpdatingSession } from '@/utils/training/rangeUpdatingTraining.js'
const state = ref(loadRangeUpdatingState())
const questions = ref(createRangeUpdatingSession({ seed: Date.now() }))
const review = ref(false)
const round = ref(0)
function start(isReview) {
  state.value = loadRangeUpdatingState()
  if (isReview && !state.value.mistakes.length) return
  review.value = isReview
  questions.value = createRangeUpdatingSession({ seed: Date.now(), ids: isReview ? state.value.mistakes : null, previousIds: questions.value.map(question=>question.id) })
  round.value += 1
}
function record(answer) {
  state.value = recordRangeUpdatingAnswer(answer)
}
</script>
<style scoped>
.range-updating { padding: clamp(1rem, 3vw, 2rem); border: 1px solid var(--border-strong); border-radius: var(--radius-xl); color: var(--text-primary); background: var(--bg-panel-solid); }
h2 { margin-block: .7rem; } p { font-size: 1rem; line-height: 1.7; }
.range-controls { display: flex; flex-wrap: wrap; gap: .7rem; margin-block: 1rem; }
button { min-height: 44px; padding: .7rem 1rem; font: inherit; color: var(--text-primary); background: var(--bg-panel-solid); border: 1px solid var(--border-strong); border-radius: var(--radius-md); cursor: pointer; }
button:disabled { opacity: .6; cursor: default; } button:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 3px; }
</style>
