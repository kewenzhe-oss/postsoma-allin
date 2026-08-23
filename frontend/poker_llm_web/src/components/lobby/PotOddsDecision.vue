<template>
  <article class="odds-drill" aria-labelledby="pot-odds-title">
    <header class="drill-header">
      <div>
        <span class="section-kicker">Pot Odds / EV · 底池赔率微训练</span>
        <h2 id="pot-odds-title">Price one Fold / Call decision</h2>
        <p>
          Answer from frozen local inputs, then reveal the verified math.
          <span>先作答，再看确定性公式结果。</span>
        </p>
      </div>
      <div class="version-stack">
        <span class="version-badge">pot-odds-v1</span>
        <small v-if="phase !== 'intro'">Session seed {{ session.seed }}</small>
      </div>
    </header>

    <template v-if="phase !== 'complete'">
      <div class="session-progress">
        <div>
          <strong>{{ phase === 'intro' ? `${session.questions.length} fixed decisions` : `Question ${currentIndex + 1} / ${session.questions.length}` }}</strong>
          <span>{{ sessionModeLabel }}</span>
        </div>
        <div class="progress-track" aria-hidden="true">
          <span :style="{ width: `${progressPercent}%` }"></span>
        </div>
      </div>

      <section class="decision-surface" aria-label="Pot odds question">
        <div class="question-facts">
          <div>
            <span>Pot before bet · 下注前底池</span>
            <strong>{{ formatBB(currentQuestion.potBeforeBetBB) }}</strong>
          </div>
          <div>
            <span>Villain bet · 对手下注</span>
            <strong>{{ formatBB(currentQuestion.villainBetBB) }}</strong>
          </div>
          <div>
            <span>Your call · 你的跟注</span>
            <strong>{{ formatBB(currentQuestion.callAmountBB) }}</strong>
          </div>
          <div class="equity-fact">
            <span>Hero equity · 你的胜率</span>
            <strong>{{ formatPct(currentQuestion.heroEquityPct) }}</strong>
          </div>
        </div>

        <div class="action-area">
          <div>
            <span class="prompt-label">Your decision · 你的决定</span>
            <h3>Would you Fold or Call?</h3>
          </div>
          <div class="decision-actions" role="group" aria-label="Choose Fold or Call">
            <button
              v-for="action in actions"
              :key="action.id"
              ref="actionButtons"
              type="button"
              :class="{
                selected: evaluation?.userAction === action.id,
                recommended: evaluation && evaluation.correctAction === action.id
              }"
              :disabled="phase !== 'active' || Boolean(evaluation)"
              :aria-pressed="evaluation?.userAction === action.id"
              @click="selectAction(action.id)"
            >
              <span>{{ action.label }}</span>
              <small>{{ action.labelZh }}</small>
            </button>
          </div>
          <p v-if="phase === 'intro'" class="answer-state">
            Start to unlock the actions. Final pot, threshold, EV, and recommendation remain hidden.
          </p>
          <p v-else-if="!evaluation" class="answer-state ready">
            Verified result hidden until you answer · 作答前不揭示答案
          </p>
        </div>
      </section>

      <div v-if="phase === 'intro'" class="start-row">
        <button type="button" class="primary-button" @click="beginPreparedSession">
          Start Pot Odds Drill · 开始训练
        </button>
        <p>No room · no API key · no AI · no live game state</p>
      </div>

      <section
        v-if="evaluation"
        class="feedback-panel"
        :class="{ aligned: evaluation.isRecommendedAction, review: !evaluation.isRecommendedAction }"
        aria-live="polite"
      >
        <div class="feedback-heading">
          <div>
            <span class="feedback-label">Decision quality · 决策质量</span>
            <h3>{{ feedbackTitle }}</h3>
          </div>
          <span class="quality-badge">
            {{ evaluation.isRecommendedAction ? 'Aligned · 一致' : 'Review · 复习' }}
          </span>
        </div>

        <div class="action-comparison">
          <div>
            <span>Your action · 你的行动</span>
            <strong>{{ evaluation.userAction }}</strong>
          </div>
          <div>
            <span>Recommended · 固定推荐</span>
            <strong>{{ evaluation.correctAction }}</strong>
          </div>
        </div>

        <div class="math-grid">
          <div>
            <span>Pot before bet</span>
            <strong>{{ formatBB(currentQuestion.potBeforeBetBB) }}</strong>
          </div>
          <div>
            <span>Villain bet</span>
            <strong>{{ formatBB(currentQuestion.villainBetBB) }}</strong>
          </div>
          <div>
            <span>Your call</span>
            <strong>{{ formatBB(currentQuestion.callAmountBB) }}</strong>
          </div>
          <div>
            <span>Final pot if Call</span>
            <strong>{{ formatBB(evaluation.finalPotBB) }}</strong>
          </div>
          <div>
            <span>Required equity</span>
            <strong>{{ formatPct(evaluation.requiredEquityPct) }}</strong>
          </div>
          <div>
            <span>Your equity</span>
            <strong>{{ formatPct(evaluation.heroEquityPct) }}</strong>
          </div>
          <div>
            <span>Equity edge</span>
            <strong :class="evaluation.equityEdgePct >= 0 ? 'positive' : 'negative'">
              {{ formatSignedPct(evaluation.equityEdgePct) }}
            </strong>
          </div>
          <div>
            <span>Simplified Call EV</span>
            <strong :class="evaluation.callEvBB >= 0 ? 'positive' : 'negative'">
              {{ formatSignedBB(evaluation.callEvBB) }}
            </strong>
          </div>
        </div>

        <div class="formula-box">
          <code>Required equity = call ÷ (pot before bet + villain bet + call)</code>
          <code>Call EV = hero equity × final pot − call amount</code>
          <small>Fold EV = 0 BB for this incremental decision.</small>
        </div>

        <div class="explanation-box">
          <p>{{ explanation.zh }}</p>
          <p>{{ explanation.en }}</p>
          <small v-if="evaluation.isBreakEven">
            Break-even boundary: pot-odds-v1 keeps Call as the deterministic recommendation when equity exactly equals the threshold.
          </small>
        </div>

        <div class="result-separation">
          <strong>Decision quality ≠ Hand result</strong>
          <p>
            本题不模拟实际 runout，也不显示赢家或单手输赢。单手结果不会决定这次决策是否合理。
            No runout is simulated; one hand result cannot validate or invalidate the decision.
          </p>
          <span>handResult: null</span>
        </div>

        <div class="feedback-actions">
          <button type="button" class="primary-button compact" @click="advanceQuestion">
            {{ isLastQuestion ? 'View session result · 查看本轮结果' : 'Next decision · 下一题' }}
          </button>
          <button
            type="button"
            class="secondary-button"
            :disabled="mistakeCount === 0"
            @click="startMistakeSession"
          >
            Mistakes only · 只练错题 ({{ mistakeCount }})
          </button>
        </div>
      </section>
    </template>

    <section v-else class="session-complete" aria-live="polite">
      <span class="section-kicker">Session complete · 本轮完成</span>
      <h3>{{ session.mode === 'mistakes' ? 'Mistake review complete' : 'Pot Odds session complete' }}</h3>
      <p>
        Scores reflect agreement with frozen pot-odds-v1 math, never a simulated hand result.
      </p>

      <div class="summary-grid">
        <div>
          <strong>{{ sessionScores.aligned }}</strong>
          <span>Aligned · 推荐一致</span>
        </div>
        <div>
          <strong>{{ sessionScores.review }}</strong>
          <span>Review · 待复习</span>
        </div>
        <div>
          <strong>{{ mistakeCount }}</strong>
          <span>Mistake queue · 错题队列</span>
        </div>
      </div>

      <div class="complete-actions">
        <button type="button" class="primary-button compact" @click="startNewStandardSession">
          New fixed session · 新一轮
        </button>
        <button
          type="button"
          class="secondary-button"
          :disabled="mistakeCount === 0"
          @click="startMistakeSession"
        >
          Mistakes only · 只练错题 ({{ mistakeCount }})
        </button>
      </div>
      <p v-if="mistakeNotice" class="mistake-notice" role="status">{{ mistakeNotice }}</p>

      <ApplyHub
        source="pot_odds_ev"
        @select-mode="emit('apply-mode', $event)"
      />
    </section>

    <footer class="assumption-note">
      <span>Static source: pot-odds-v1</span>
      <span>No rake, future betting, implied odds, range shifts, or split-pot adjustment</span>
      <span>Local record: postsoma_pot_odds_training_v1</span>
    </footer>
  </article>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import ApplyHub from '@/components/lobby/ApplyHub.vue'
import { getPotOddsExplanation } from '@/training/explanations/pot-odds-explanations.js'
import {
  FOLD_CALL_ACTIONS,
  createPotOddsSession,
  evaluatePotOddsAnswer
} from '@/utils/training/potOddsTraining.js'
import {
  loadPotOddsTrainingState,
  recordPotOddsTrainingAnswer
} from '@/utils/training/potOddsTrainingStorage.js'

const emit = defineEmits(['apply-mode'])
const actions = FOLD_CALL_ACTIONS
const phase = ref('intro')
const session = ref(createPotOddsSession())
const currentIndex = ref(0)
const evaluation = ref(null)
const actionButtons = ref([])
const storageState = ref(loadPotOddsTrainingState())
const mistakeNotice = ref('')
const sessionScores = ref({ aligned: 0, review: 0 })

const currentQuestion = computed(() => session.value.questions[currentIndex.value])
const isLastQuestion = computed(() => currentIndex.value === session.value.questions.length - 1)
const mistakeCount = computed(() => storageState.value.mistakeQuestionIds.length)
const explanation = computed(() => getPotOddsExplanation(currentQuestion.value.explanationKey))
const progressPercent = computed(() => {
  if (phase.value === 'intro') return 0
  return Math.round(((currentIndex.value + (evaluation.value ? 1 : 0)) / session.value.questions.length) * 100)
})
const sessionModeLabel = computed(() => (
  session.value.mode === 'mistakes' ? 'Mistake-only review · 错题复练' : '8-question fixed set · 8 题固定题库'
))
const feedbackTitle = computed(() => {
  if (evaluation.value?.isBreakEven) {
    return evaluation.value.isRecommendedAction
      ? 'Break-even boundary recognized · 命中保本边界'
      : 'Break-even uses Call in this version · 本版本边界推荐 Call'
  }
  return evaluation.value?.isRecommendedAction
    ? 'Your action matches the verified math · 行动符合数学基准'
    : 'Your action differs from the verified math · 建议复习此题'
})

const formatNumber = (value, digits = 2) => Number(value.toFixed(digits)).toString()
const formatBB = (value) => `${formatNumber(value)} BB`
const formatPct = (value) => `${formatNumber(value)}%`
const formatSignedPct = (value) => `${value >= 0 ? '+' : ''}${formatNumber(value)} pts`
const formatSignedBB = (value) => `${value >= 0 ? '+' : ''}${formatNumber(value)} BB`

const focusFirstAction = () => {
  nextTick(() => actionButtons.value[0]?.focus())
}

const beginPreparedSession = () => {
  phase.value = 'active'
  focusFirstAction()
}

const resetSessionState = () => {
  currentIndex.value = 0
  evaluation.value = null
  mistakeNotice.value = ''
  sessionScores.value = { aligned: 0, review: 0 }
  phase.value = 'active'
  focusFirstAction()
}

const startNewStandardSession = () => {
  session.value = createPotOddsSession({ seed: Date.now(), mode: 'standard' })
  resetSessionState()
}

const startMistakeSession = () => {
  const latestState = loadPotOddsTrainingState()
  storageState.value = latestState
  if (!latestState.mistakeQuestionIds.length) {
    mistakeNotice.value = 'No Pot Odds review questions yet · 暂无 Pot Odds 错题'
    return
  }

  session.value = createPotOddsSession({
    seed: Date.now(),
    mode: 'mistakes',
    questionIds: latestState.mistakeQuestionIds
  })
  resetSessionState()
}

const selectAction = (action) => {
  if (phase.value !== 'active' || evaluation.value) return
  const result = evaluatePotOddsAnswer(currentQuestion.value, action)
  evaluation.value = result
  storageState.value = recordPotOddsTrainingAnswer(currentQuestion.value, result)

  if (result.isRecommendedAction) sessionScores.value.aligned += 1
  else sessionScores.value.review += 1
}

const advanceQuestion = () => {
  if (!evaluation.value) return
  if (isLastQuestion.value) {
    phase.value = 'complete'
    return
  }

  currentIndex.value += 1
  evaluation.value = null
  focusFirstAction()
}
</script>

<style scoped>
.odds-drill {
  width: 100%;
  max-width: 1040px;
  padding: clamp(1.2rem, 3vw, 2rem);
  color: var(--text-primary);
  background:
    radial-gradient(circle at 92% 0%, rgba(31, 122, 79, 0.16), transparent 18rem),
    linear-gradient(145deg, rgba(217, 173, 88, 0.07), transparent 50%),
    var(--bg-panel-solid);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}

.odds-drill::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(217, 173, 88, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(217, 173, 88, 0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

.odds-drill > * {
  position: relative;
  z-index: 1;
}

.drill-header,
.feedback-heading,
.session-progress > div:first-child {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
}

.section-kicker,
.prompt-label,
.feedback-label {
  color: var(--accent-primary);
  font-size: var(--font-size-meta);
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.drill-header h2 {
  margin-top: 0.35rem;
  font-size: clamp(1.45rem, 3vw, 2rem);
  font-weight: 850;
}

.drill-header p {
  max-width: 65ch;
  margin-top: 0.45rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

.drill-header p span {
  color: var(--text-tertiary);
}

.version-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  flex-shrink: 0;
}

.version-stack small {
  color: var(--text-tertiary);
  font-family: var(--font-family-mono);
  font-size: 0.68rem;
}

.version-badge,
.quality-badge {
  padding: 0.4rem 0.68rem;
  color: var(--accent-primary-strong);
  background: rgba(217, 173, 88, 0.08);
  border: 1px solid rgba(217, 173, 88, 0.24);
  border-radius: var(--radius-pill);
  font-size: 0.72rem;
  font-weight: 850;
  white-space: nowrap;
}

.session-progress {
  margin-top: 1.2rem;
}

.session-progress > div:first-child {
  align-items: center;
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.session-progress strong {
  color: var(--text-primary);
}

.progress-track {
  height: 4px;
  margin-top: 0.5rem;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-pill);
}

.progress-track span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--accent-primary), var(--accent-primary-strong));
  border-radius: inherit;
  transition: width 0.22s ease;
}

.decision-surface {
  margin-top: 0.9rem;
  padding: clamp(1rem, 2.5vw, 1.45rem);
  background: rgba(7, 5, 4, 0.58);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.question-facts,
.math-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
}

.question-facts > div,
.math-grid > div,
.action-comparison > div,
.summary-grid > div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.75rem 0.8rem;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.question-facts span,
.math-grid span,
.action-comparison span,
.summary-grid span {
  color: var(--text-tertiary);
  font-size: 0.68rem;
}

.question-facts strong,
.math-grid strong,
.action-comparison strong {
  color: var(--text-primary);
  font-family: var(--font-family-mono);
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
}

.question-facts .equity-fact {
  border-color: rgba(217, 173, 88, 0.28);
  background: rgba(217, 173, 88, 0.07);
}

.action-area {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.85fr);
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.action-area h3,
.feedback-heading h3,
.session-complete h3 {
  margin-top: 0.3rem;
  font-size: clamp(1.05rem, 2vw, 1.3rem);
}

.decision-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

.decision-actions button {
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 0.65rem 0.85rem;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.94rem;
  font-weight: 850;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.decision-actions button small {
  margin-top: 0.12rem;
  color: var(--text-tertiary);
  font-size: 0.68rem;
}

.decision-actions button:not(:disabled):hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  background: rgba(217, 173, 88, 0.08);
}

.decision-actions button.selected {
  color: var(--text-inverse);
  background: var(--accent-primary-strong);
  border-color: var(--accent-primary-strong);
}

.decision-actions button.selected small {
  color: rgba(16, 11, 10, 0.7);
}

.decision-actions button.recommended:not(.selected) {
  border-color: rgba(47, 154, 97, 0.6);
  background: rgba(47, 154, 97, 0.12);
}

.decision-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.64;
}

.answer-state {
  grid-column: 1 / -1;
  margin: -0.3rem 0 0;
  color: var(--text-tertiary);
  font-size: 0.72rem;
}

.answer-state.ready {
  color: var(--success);
}

.start-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.9rem;
}

.start-row p,
.mistake-notice {
  color: var(--text-tertiary);
  font-size: 0.72rem;
}

.primary-button,
.secondary-button {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.68rem 0.95rem;
  border-radius: var(--radius-md);
  font-size: 0.86rem;
  font-weight: 850;
  transition: transform 0.18s ease, filter 0.18s ease;
}

.primary-button {
  color: var(--text-inverse);
  background: linear-gradient(180deg, var(--accent-primary-strong), var(--accent-primary));
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 10px 24px rgba(217, 173, 88, 0.12);
}

.primary-button.compact,
.secondary-button {
  min-height: 44px;
}

.secondary-button {
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
}

.primary-button:hover:not(:disabled),
.secondary-button:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.08);
}

.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.feedback-panel {
  margin-top: 0.9rem;
  padding: clamp(1rem, 2.5vw, 1.35rem);
  background: rgba(7, 5, 4, 0.54);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--warning);
  border-radius: var(--radius-lg);
}

.feedback-panel.aligned {
  border-left-color: var(--success);
}

.feedback-panel.review {
  border-left-color: var(--danger);
}

.action-comparison {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.9rem;
}

.math-grid {
  margin-top: 0.65rem;
}

.math-grid strong.positive {
  color: var(--success);
}

.math-grid strong.negative {
  color: var(--danger);
}

.formula-box,
.explanation-box,
.result-separation {
  margin-top: 0.75rem;
  padding: 0.82rem 0.9rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.formula-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.formula-box code {
  color: var(--text-secondary);
  font-family: var(--font-family-mono);
  font-size: 0.74rem;
  white-space: normal;
}

.formula-box small,
.explanation-box small,
.result-separation span {
  color: var(--accent-primary);
  font-size: 0.66rem;
}

.explanation-box p,
.result-separation p {
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1.5;
}

.explanation-box p + p {
  margin-top: 0.2rem;
  color: var(--text-tertiary);
  font-size: 0.74rem;
}

.result-separation {
  border-color: rgba(217, 173, 88, 0.28);
  background: rgba(217, 173, 88, 0.06);
}

.result-separation strong {
  color: var(--accent-primary-strong);
  font-size: 0.82rem;
}

.result-separation p {
  margin-top: 0.3rem;
}

.result-separation span {
  display: block;
  margin-top: 0.35rem;
  font-family: var(--font-family-mono);
}

.feedback-actions,
.complete-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.8rem;
}

.session-complete {
  margin-top: 1rem;
  padding: clamp(1.2rem, 3vw, 1.8rem);
  text-align: center;
  background: rgba(7, 5, 4, 0.52);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.session-complete > p {
  max-width: 66ch;
  margin: 0.45rem auto 0;
  color: var(--text-secondary);
  font-size: 0.84rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  max-width: 700px;
  margin: 1rem auto 0;
}

.summary-grid strong {
  color: var(--accent-primary-strong);
  font-size: 1.6rem;
}

.complete-actions {
  justify-content: center;
}

.mistake-notice {
  color: var(--accent-primary) !important;
}

.assumption-note {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.4rem 1rem;
  margin-top: 0.85rem;
  padding-top: 0.75rem;
  color: var(--text-tertiary);
  border-top: 1px solid var(--border-subtle);
  font-family: var(--font-family-mono);
  font-size: 0.61rem;
}

@media (max-width: 800px) {
  .drill-header,
  .feedback-heading {
    flex-direction: column;
  }

  .version-stack {
    align-items: flex-start;
  }

  .question-facts,
  .math-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .action-area {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .odds-drill {
    padding: 1rem;
  }

  .question-facts,
  .math-grid,
  .action-comparison,
  .summary-grid,
  .decision-actions {
    grid-template-columns: 1fr;
  }

  .start-row,
  .feedback-actions,
  .complete-actions,
  .assumption-note {
    flex-direction: column;
    align-items: stretch;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .decision-actions button,
  .primary-button,
  .secondary-button,
  .progress-track span {
    transition: none;
  }

  .decision-actions button:not(:disabled):hover,
  .primary-button:hover:not(:disabled),
  .secondary-button:hover:not(:disabled) {
    transform: none;
  }
}
</style>
