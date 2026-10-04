<template>
  <article class="decision-lab" :aria-label="local(lab.title)">
    <span class="section-kicker">{{ lab.version }}</span>
    <h2>{{ local(lab.title) }}</h2>
    <p>{{ local(lab.intro) }}</p>
    <p>{{ isZh ? '每个案例保留条件变化追问；新一轮优先选择上一轮未出现的案例。' : 'Each case keeps its changed-condition question; new rounds prioritize unseen cases.' }}</p>
    <p>{{ isZh ? '尚需复习：' : 'Unresolved: ' }}{{ state.mistakes.length }} · {{ isZh ? '作答保存在此浏览器' : 'Answers saved in this browser' }}</p>
    <div class="lab-actions">
      <button type="button" @click="start(false)">{{ isZh ? '新一轮练习' : 'New practice session' }}</button>
      <button type="button" :disabled="!state.mistakes.length" @click="start(true)">{{ isZh ? '复习本工具错题' : 'Review this tool’s mistakes' }}</button>
    </div>
    <LearningQuestions :key="round" :questions="questions" :title="isZh ? (review ? '错题复习' : '案例与条件变化') : (review ? 'Mistake review' : 'Cases and changed conditions')" :allow-restart="false" @answer="state = recordLabAnswer(kind, $event)" />
  </article>
</template>
<script setup>
import { computed, ref } from 'vue'
import { isZh } from '@/i18n/locale.js'
import LearningQuestions from './LearningQuestions.vue'
import { DECISION_LABS } from '@/training/drills/decision-labs-v1.js'
import { loadLabState, recordLabAnswer, createLabSession } from '@/utils/training/decisionLabTraining.js'
const props=defineProps({kind:{type:String,required:true}})
const lab=computed(()=>DECISION_LABS[props.kind])
const state=ref(loadLabState(props.kind))
const questions=ref(createLabSession(props.kind,Date.now()))
const review=ref(false), round=ref(0)
const local=value=>value[isZh.value?'zh':'en']
function start(isReview) {
  state.value=loadLabState(props.kind)
  if(isReview&&!state.value.mistakes.length) return
  review.value=isReview
  questions.value=createLabSession(props.kind,Date.now(),isReview?state.value.mistakes:null,questions.value.map(question=>question.id))
  round.value++
}
</script>
<style scoped>
.decision-lab { padding:clamp(1rem,3vw,2rem); border:1px solid var(--border-strong); border-radius:var(--radius-xl); color:var(--text-primary); background:var(--bg-panel-solid); }
h2 { margin-block:.7rem; } p { font-size:1rem; line-height:1.7; }
.lab-actions { display:flex; flex-wrap:wrap; gap:.7rem; margin-block:1rem; }
button { min-height:44px; padding:.7rem 1rem; font:inherit; color:var(--text-primary); background:var(--bg-panel-solid); border:1px solid var(--border-strong); border-radius:var(--radius-md); cursor:pointer; }
button:disabled { opacity:.6; cursor:default; } button:focus-visible { outline:2px solid var(--accent-primary); outline-offset:3px; }
</style>
