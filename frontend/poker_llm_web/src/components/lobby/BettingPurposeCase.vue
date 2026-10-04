<template>
  <article class="purpose-case" :aria-label="isZh ? '下注目的与相对牌力' : 'Betting purpose and relative strength'">
    <h2>{{ isZh ? '同一手顶对，为什么行动会改变？' : 'Same top pair: why does the action change?' }}</h2>
    <p>{{ isZh ? '三个案例共 12 个追问：比较范围、改变对手反应，再检查信息与结果。作答仅用于当前案例，不保存记录。' : 'Three cases with 12 questions: compare ranges, change responses, then review information and results. Answers stay within this case and are not saved.' }}</p>
    <nav class="case-picker" :aria-label="isZh ? '选择概念案例' : 'Choose a concept case'">
      <button v-for="item in BETTING_PURPOSE_CASES" :key="item.id" type="button" :aria-pressed="selected === item.id" @click="selected = item.id">{{ item.title[isZh ? 'zh' : 'en'] }}</button>
    </nav>
    <p>{{ isZh ? '这是固定引导案例；切换案例可探索不同结论，“再练一次”用于回看同一推理。' : 'These are fixed guided cases. Switch cases for different conclusions; retry revisits the same reasoning.' }}</p>
    <LearningQuestions :key="selected" :questions="current.questions" :title="isZh ? '下注目的 · 范围 · 风险' : 'Purpose · Range · Risk'" />
  </article>
</template>
<script setup>
import { computed, ref } from 'vue'
import { isZh } from '@/i18n/locale.js'
import LearningQuestions from './LearningQuestions.vue'
import { BETTING_PURPOSE_CASES } from '@/training/drills/betting-purpose.js'
const selected=ref('relative')
const current=computed(()=>BETTING_PURPOSE_CASES.find(item=>item.id===selected.value))
</script>
<style scoped>
.purpose-case { padding:clamp(1rem,3vw,2rem); border:1px solid var(--border-strong); border-radius:var(--radius-xl); background:var(--bg-panel-solid); color:var(--text-primary); }
p { line-height:1.7; }
.case-picker { display:flex; flex-wrap:wrap; gap:.7rem; }
button { min-height:44px; padding:.7rem 1rem; border:1px solid var(--border-strong); border-radius:var(--radius-md); background:var(--bg-panel-solid); color:var(--text-primary); font:inherit; cursor:pointer; }
button[aria-pressed="true"] { border-color:var(--accent-primary); color:var(--accent-primary); }
button:focus-visible { outline:2px solid var(--accent-primary); outline-offset:3px; }
</style>
