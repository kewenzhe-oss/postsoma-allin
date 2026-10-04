<template>
  <section class="learning-questions" :aria-label="title">
    <header>
      <strong>{{ title }}</strong>
      <span>{{ index + 1 }} / {{ questions.length }}</span>
    </header>
    <aside v-if="current.tree" class="learning-feedback">{{ local(current.tree) }}</aside>
    <p v-if="current.context">{{ local(current.context) }}</p>
    <div v-if="current.groups" class="range-table">
      <table>
        <caption>{{ isZh ? '行动前范围与题设行动频率' : 'Prior range and assumed action likelihood' }}</caption>
        <thead><tr><th scope="col">{{ isZh ? '范围组' : 'Group' }}</th><th scope="col">{{ isZh ? '组合数' : 'Combos' }}</th><th scope="col">{{ isZh ? '该行动频率' : 'Action likelihood' }}</th></tr></thead>
        <tbody><tr v-for="group in current.groups" :key="group.id"><th scope="row">{{ local(group.label) }}</th><td>{{ group.combos }}</td><td>{{ group.frequencyPct }}%</td></tr></tbody>
      </table>
    </div>
    <h3 ref="heading" tabindex="-1">{{ local(current.title) }}</h3>
    <div class="learning-options" role="group" :aria-label="local(current.title)">
      <button v-for="option in current.options" :key="option.id" type="button"
        :disabled="Boolean(answer)" :aria-pressed="answer === option.id"
        :class="{ selected: answer === option.id }" @click="choose(option.id)">
        {{ local(option.label) }}
      </button>
    </div>
    <div v-if="answer" class="learning-feedback" role="status">
      <strong>{{ answer === current.correctId ? (isZh ? '理解一致' : 'Understanding aligned') : (isZh ? '这里需要复习' : 'Review this concept') }}</strong>
      <p>{{ local(current.explanation) }}</p>
    </div>
    <button v-if="answer && index < questions.length - 1" class="learning-next" type="button" @click="next">
      {{ isZh ? '继续下一问' : 'Continue to next question' }}
    </button>
    <template v-if="finished">
      <p class="learning-boundary">{{ isZh ? '已完成。本轮追问仅检查概念理解，不计入原有行动成绩。' : 'Completed. These questions check understanding separately from action scores.' }}</p>
      <details>
        <summary>{{ isZh ? '回看完整推理' : 'Review the full reasoning' }}</summary>
        <ol>
          <li v-for="(item, itemIndex) in questions" :key="item.id">
            <strong>{{ local(item.title) }}</strong>
            <p>{{ isZh ? '你的选择：' : 'Your choice: ' }}{{ local(item.options.find(option => option.id === answers[itemIndex]).label) }}</p>
            <p>{{ local(item.explanation) }}</p>
          </li>
        </ol>
      </details>
      <button v-if="allowRestart" class="learning-next" type="button" @click="restart">{{ isZh ? '再练一次' : 'Try again' }}</button>
    </template>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { isZh } from '@/i18n/locale.js'
const props = defineProps({ questions: { type: Array, required: true }, title: { type: String, required: true }, autofocus: Boolean, allowRestart: { type: Boolean, default: true } })
const emit = defineEmits(['complete', 'reset', 'answer'])
const index = ref(0)
const answers = ref([])
const heading = ref(null)
const current = computed(() => props.questions[index.value])
const answer = computed(() => answers.value[index.value])
const finished = computed(() => answers.value.length === props.questions.length)
const local = value => value[isZh.value ? 'zh' : 'en']
onMounted(() => { if (props.autofocus) heading.value?.focus() })
function choose(id) {
  if (answer.value) return
  answers.value[index.value] = id
  emit('answer', { id: current.value.id, selectedId: id, isCorrect: id === current.value.correctId })
  if (finished.value) emit('complete')
}
function next() {
  if (!answer.value || index.value >= props.questions.length - 1) return
  index.value += 1
  nextTick(() => heading.value?.focus())
}
function restart() {
  index.value = 0
  answers.value = []
  emit('reset')
  nextTick(() => heading.value?.focus())
}
</script>

<style scoped>
.learning-questions { margin-block: 1rem; padding: clamp(1rem, 3vw, 1.5rem); border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--bg-panel-solid); color: var(--text-primary); }
table { width: 100%; border-collapse: collapse; font-size: .95rem; }
caption { text-align: left; margin-block: .7rem; }
th, td { text-align: left; padding: .6rem .3rem; border-bottom: 1px solid var(--border-strong); }
header { display: flex; justify-content: space-between; gap: 1rem; color: var(--accent-primary); }
h3 { margin-block: 1rem; font-size: 1rem; line-height: 1.6; }
.learning-options { display: grid; gap: .65rem; }
button { min-height: 44px; padding: .75rem 1rem; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--bg-panel-solid); color: var(--text-primary); font: inherit; line-height: 1.5; text-align: left; cursor: pointer; }
button:hover:not(:disabled), button.selected { border-color: var(--accent-primary); }
button:disabled { cursor: default; }
button:focus-visible, summary:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 3px; }
.learning-feedback { margin-top: 1rem; padding: 1rem; border-left: 3px solid var(--accent-primary); }
p, li { font-size: .95rem; line-height: 1.7; overflow-wrap: anywhere; }
.learning-next { margin-top: 1rem; }
.learning-boundary { color: var(--text-secondary); }
summary { cursor: pointer; min-height: 44px; padding-block: .5rem; }
ol { padding-left: 1.3rem; }
li { margin-block: 1rem; }
</style>
