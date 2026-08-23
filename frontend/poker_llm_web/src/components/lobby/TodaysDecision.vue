<template>
  <article class="decision-card" aria-labelledby="todays-decision-title">
    <div class="decision-card__header">
      <div>
        <span class="section-kicker">Today’s Decision · 今日一手</span>
        <h2 id="todays-decision-title">10-hand preflop range drill</h2>
        <p class="section-description">
          Choose first, then reveal the fixed baseline. No login, API key, room, or AI request.
          <span>先行动，再查看固定基准。</span>
        </p>
      </div>
      <div class="session-meta">
        <span class="baseline-badge">baseline-v1</span>
        <span v-if="phase !== 'intro'" class="seed-label">Seed {{ session.seed }}</span>
      </div>
    </div>

    <div class="scenario-strip" aria-label="Training scenario">
      <div class="scenario-item">
        <span class="scenario-label">Format · 赛制</span>
        <strong>Heads-up</strong>
      </div>
      <div class="scenario-item">
        <span class="scenario-label">Position · 位置</span>
        <strong>SB / Button</strong>
      </div>
      <div class="scenario-item">
        <span class="scenario-label">Effective stack · 有效筹码</span>
        <strong>100 BB</strong>
      </div>
      <div class="scenario-item">
        <span class="scenario-label">Pot state · 底池状态</span>
        <strong>Unopened</strong>
      </div>
    </div>

    <template v-if="phase !== 'complete'">
      <div class="session-progress" :aria-label="`Hand ${currentIndex + 1} of ${session.hands.length}`">
        <div class="progress-copy">
          <strong>{{ phase === 'intro' ? 'Ready for 10 hands' : `Hand ${currentIndex + 1} / ${session.hands.length}` }}</strong>
          <span>{{ sessionModeLabel }}</span>
        </div>
        <div class="progress-track" aria-hidden="true">
          <span :style="{ width: `${progressPercent}%` }"></span>
        </div>
      </div>

      <div class="decision-stage">
        <div class="hero-hand">
          <span class="stage-label">Hero hand · 手牌</span>
          <strong class="canonical-hand">{{ currentHand.hero.canonicalHand }}</strong>
          <div class="playing-cards" :aria-label="currentHand.hero.cards.map(({ label }) => label).join(' ') ">
            <span
              v-for="card in currentHand.hero.cards"
              :key="`${card.rank}${card.suit}`"
              class="playing-card"
              :class="{ red: card.isRed }"
            >
              <span class="card-rank">{{ card.rank }}</span>
              <span class="card-suit" aria-hidden="true">{{ card.suitSymbol }}</span>
            </span>
          </div>
        </div>

        <div class="decision-prompt">
          <span class="stage-label">Your action · 你的行动</span>
          <h3>Action folds to you on the Button. What is your move?</h3>
          <p>按钮位无人入池，轮到你行动。</p>

          <div class="action-options" role="group" aria-label="Choose a preflop action">
            <button
              v-for="action in currentHand.actions"
              :key="action.id"
              ref="actionButtons"
              type="button"
              class="action-option"
              :class="{
                selected: evaluation?.action === action.id,
                primary: evaluation && currentHand.baseline.primaryActions.includes(action.id)
              }"
              :disabled="phase !== 'active' || Boolean(evaluation)"
              :aria-pressed="evaluation?.action === action.id"
              @click="selectAction(action.id)"
            >
              <span>{{ action.label }}</span>
              <small>{{ action.labelZh }}</small>
              <em v-if="evaluation">{{ currentHand.baseline.frequencies[action.id] }}%</em>
            </button>
          </div>

          <p v-if="phase === 'intro'" class="action-helper">
            Start the session to unlock actions. The baseline stays hidden until you answer.
          </p>
          <p v-else-if="!evaluation" class="action-helper active">
            Baseline hidden · 基准尚未揭示
          </p>
        </div>
      </div>

      <div v-if="phase === 'intro'" class="intro-actions">
        <button type="button" class="primary-button" @click="beginPreparedSession">
          <span>Start 10 hands · 开始作答</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>
        <p>Fixed local data · 可重放 seed · no scoring by AI</p>
      </div>

      <section
        v-if="evaluation"
        class="feedback-panel"
        :class="`feedback-panel--${evaluation.alignment}`"
        aria-live="polite"
      >
        <div class="feedback-heading">
          <div>
            <span class="feedback-eyebrow">Immediate feedback · 即时反馈</span>
            <h3>{{ feedbackTitle }}</h3>
          </div>
          <span class="alignment-badge">{{ evaluation.chosenFrequency }}% in baseline</span>
        </div>

        <div class="feedback-facts">
          <div>
            <span>Hero hand</span>
            <strong>{{ currentHand.hero.canonicalHand }}</strong>
          </div>
          <div>
            <span>Your choice · 你的选择</span>
            <strong>{{ actionLabel(evaluation.action) }}</strong>
          </div>
          <div>
            <span>Baseline tendency · 基准倾向</span>
            <strong>{{ primaryActionSummary }}</strong>
          </div>
          <div>
            <span>169 matrix · 矩阵位置</span>
            <strong>
              #{{ currentHand.baseline.matrixPosition.index + 1 }}
              · R{{ currentHand.baseline.matrixPosition.row }} C{{ currentHand.baseline.matrixPosition.column }}
            </strong>
          </div>
        </div>

        <div class="frequency-row" aria-label="Baseline action frequencies">
          <span
            v-for="action in currentHand.actions"
            :key="action.id"
            :class="{ dominant: currentHand.baseline.primaryActions.includes(action.id) }"
          >
            {{ action.label }} <strong>{{ currentHand.baseline.frequencies[action.id] }}%</strong>
          </span>
        </div>

        <div class="feedback-explanation">
          <p>{{ feedbackCopy }}</p>
          <p>{{ explanation.zh }}</p>
          <p class="english-explanation">{{ explanation.en }}</p>
          <small>
            baseline-v1 is a fixed learning snapshot, not solver output or an absolute strategy.
            它不是唯一或绝对正确的扑克答案。
          </small>
        </div>

        <div class="feedback-actions">
          <button type="button" class="primary-button compact" @click="advanceHand">
            {{ isLastHand ? '再来一手 · 查看本轮结果' : '再来一手 · Next hand' }}
          </button>
          <button type="button" class="secondary-button" @click="emit('open-ranges')">
            看完整范围 · Full range
          </button>
          <button
            type="button"
            class="secondary-button"
            :disabled="mistakeCount === 0"
            @click="startMistakeSession"
          >
            只练错题 · Mistakes ({{ mistakeCount }})
          </button>
        </div>
      </section>
    </template>

    <section v-else class="session-complete" aria-live="polite">
      <span class="section-kicker">Session complete · 本轮完成</span>
      <h3>{{ session.mode === 'mistakes' ? 'Mistake review finished' : '10 decisions completed' }}</h3>
      <p>
        This summary measures alignment with baseline-v1’s main tendency—not poker truth and not hand results.
        这里统计的是与基准主要倾向的一致程度。
      </p>

      <div class="score-grid">
        <div>
          <strong>{{ sessionScores.primary }}</strong>
          <span>Main tendency · 主要倾向</span>
        </div>
        <div>
          <strong>{{ sessionScores.mixed }}</strong>
          <span>In mix · 混合可接受</span>
        </div>
        <div>
          <strong>{{ sessionScores.deviation }}</strong>
          <span>Outside mix · 范围外</span>
        </div>
        <div>
          <strong>{{ mistakeCount }}</strong>
          <span>Review queue · 错题候选</span>
        </div>
      </div>

      <div class="complete-actions">
        <button type="button" class="primary-button compact" @click="startNewStandardSession">
          New 10 hands · 新一轮
        </button>
        <button type="button" class="secondary-button" @click="emit('open-ranges')">
          看完整范围 · Full range
        </button>
        <button
          type="button"
          class="secondary-button"
          :disabled="mistakeCount === 0"
          @click="startMistakeSession"
        >
          只练错题 · Mistakes ({{ mistakeCount }})
        </button>
      </div>

      <p v-if="mistakeNotice" class="mistake-notice" role="status">{{ mistakeNotice }}</p>

      <ApplyHub
        source="preflop_range"
        @select-mode="emit('apply-mode', $event)"
      />
    </section>

    <footer class="data-note">
      <span>Range: hu-btn-rfi-100bb-v1</span>
      <span>Local record: postsoma_preflop_training_v1</span>
    </footer>
  </article>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import ApplyHub from '@/components/lobby/ApplyHub.vue'
import { getPreflopExplanation } from '@/training/explanations/preflop-explanations.js'
import {
  createPreflopSession,
  evaluatePreflopAction,
  getActionLabel
} from '@/utils/training/preflopTraining.js'
import {
  loadPreflopTrainingState,
  recordPreflopTrainingAnswer
} from '@/utils/training/preflopTrainingStorage.js'

const emit = defineEmits(['open-ranges', 'apply-mode'])

const phase = ref('intro')
const session = ref(createPreflopSession())
const currentIndex = ref(0)
const evaluation = ref(null)
const actionButtons = ref([])
const mistakeNotice = ref('')
const storageState = ref(loadPreflopTrainingState())
const sessionScores = ref({ primary: 0, mixed: 0, deviation: 0 })

const currentHand = computed(() => session.value.hands[currentIndex.value])
const mistakeCount = computed(() => storageState.value.mistakeHands.length)
const isLastHand = computed(() => currentIndex.value === session.value.hands.length - 1)
const progressPercent = computed(() => {
  if (phase.value === 'intro') return 0
  return Math.round(((currentIndex.value + (evaluation.value ? 1 : 0)) / session.value.hands.length) * 100)
})
const sessionModeLabel = computed(() => (
  session.value.mode === 'mistakes' ? 'Mistake-only review · 只练错题' : 'Standard session · 标准练习'
))
const explanation = computed(() => getPreflopExplanation(currentHand.value.explanationKey))
const primaryActionSummary = computed(() => (
  currentHand.value.baseline.primaryActions
    .map((action) => `${getActionLabel(action)} ${currentHand.value.baseline.frequencies[action]}%`)
    .join(' / ')
))
const feedbackTitle = computed(() => {
  if (evaluation.value?.alignment === 'primary_tendency') {
    return 'Matches the main tendency · 命中主要倾向'
  }
  if (evaluation.value?.alignment === 'acceptable_mix') {
    return 'Acceptable mix, not the main tendency · 可接受，但不是主要倾向'
  }
  return 'Outside this baseline mix · 偏离本基准范围'
})
const feedbackCopy = computed(() => {
  if (!evaluation.value) return ''
  if (evaluation.value.alignment === 'primary_tendency') {
    if (currentHand.value.baseline.primaryActions.length > 1) {
      return 'This hand has no single dominant line in baseline-v1; your choice matches one of the joint-highest frequencies.'
    }
    return `${getActionLabel(evaluation.value.action)} is the main recommendation at ${evaluation.value.chosenFrequency}% in baseline-v1.`
  }
  if (evaluation.value.alignment === 'acceptable_mix') {
    return `${getActionLabel(evaluation.value.action)} appears at ${evaluation.value.chosenFrequency}%, so it is inside the mix but below the main tendency.`
  }
  return `baseline-v1 assigns 0% to ${getActionLabel(evaluation.value.action)} here. Treat this as a review signal, not an absolute poker verdict.`
})

const actionLabel = (action) => getActionLabel(action)

const focusFirstAction = () => {
  nextTick(() => actionButtons.value[0]?.focus())
}

const resetSessionState = () => {
  currentIndex.value = 0
  evaluation.value = null
  mistakeNotice.value = ''
  sessionScores.value = { primary: 0, mixed: 0, deviation: 0 }
  phase.value = 'active'
  focusFirstAction()
}

const beginPreparedSession = () => {
  phase.value = 'active'
  focusFirstAction()
}

const startNewStandardSession = () => {
  session.value = createPreflopSession({ seed: Date.now(), mode: 'standard' })
  resetSessionState()
}

const startMistakeSession = () => {
  const latestState = loadPreflopTrainingState()
  storageState.value = latestState

  if (!latestState.mistakeHands.length) {
    mistakeNotice.value = 'No review candidates yet · 暂无错题候选'
    return
  }

  session.value = createPreflopSession({
    seed: Date.now(),
    mode: 'mistakes',
    handPool: latestState.mistakeHands
  })
  resetSessionState()
}

const selectAction = (action) => {
  if (phase.value !== 'active' || evaluation.value) return

  const result = evaluatePreflopAction(currentHand.value, action)
  evaluation.value = result
  storageState.value = recordPreflopTrainingAnswer(currentHand.value, result)

  if (result.alignment === 'primary_tendency') sessionScores.value.primary += 1
  if (result.alignment === 'acceptable_mix') sessionScores.value.mixed += 1
  if (result.alignment === 'baseline_deviation') sessionScores.value.deviation += 1
}

const advanceHand = () => {
  if (!evaluation.value) return
  if (isLastHand.value) {
    phase.value = 'complete'
    return
  }

  currentIndex.value += 1
  evaluation.value = null
  focusFirstAction()
}
</script>

<style scoped>
.decision-card {
  width: 100%;
  max-width: 1040px;
  padding: clamp(1.2rem, 3vw, 2rem);
  background:
    radial-gradient(circle at 88% 4%, rgba(217, 173, 88, 0.13), transparent 18rem),
    linear-gradient(145deg, rgba(31, 122, 79, 0.08), transparent 45%),
    var(--bg-panel-solid);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}

.decision-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(217, 173, 88, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(217, 173, 88, 0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

.decision-card > * {
  position: relative;
  z-index: 1;
}

.decision-card__header,
.feedback-heading,
.progress-copy {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
}

.section-kicker,
.stage-label,
.scenario-label,
.feedback-eyebrow {
  color: var(--accent-primary);
  font-size: var(--font-size-meta);
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.decision-card h2 {
  margin-top: 0.35rem;
  color: var(--text-primary);
  font-size: clamp(1.45rem, 3vw, 2rem);
  font-weight: 850;
}

.section-description {
  margin-top: 0.45rem;
  color: var(--text-secondary);
  line-height: 1.55;
  max-width: 66ch;
}

.section-description span {
  color: var(--text-tertiary);
}

.session-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  flex-shrink: 0;
}

.baseline-badge,
.alignment-badge {
  color: var(--accent-primary-strong);
  background: rgba(217, 173, 88, 0.08);
  border: 1px solid rgba(217, 173, 88, 0.24);
  border-radius: var(--radius-pill);
  padding: 0.42rem 0.72rem;
  font-size: 0.74rem;
  font-weight: 850;
  white-space: nowrap;
}

.seed-label {
  color: var(--text-tertiary);
  font-family: var(--font-family-mono);
  font-size: 0.68rem;
}

.scenario-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 1.25rem;
}

.scenario-item {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  padding: 0.72rem 0.82rem;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.scenario-label {
  color: var(--text-tertiary);
  font-size: 0.62rem;
}

.scenario-item strong {
  color: var(--text-primary);
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
}

.session-progress {
  margin-top: 0.9rem;
}

.progress-copy {
  align-items: center;
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.progress-copy strong {
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
  transition: width 0.25s ease;
}

.decision-stage {
  display: grid;
  grid-template-columns: minmax(190px, 0.72fr) minmax(0, 1.8fr);
  gap: clamp(1rem, 3vw, 2rem);
  margin-top: 0.9rem;
  padding: clamp(1rem, 2.5vw, 1.45rem);
  background: rgba(7, 5, 4, 0.58);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.hero-hand {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  gap: 0.45rem;
  padding-right: clamp(1rem, 3vw, 2rem);
  border-right: 1px solid var(--border-subtle);
}

.canonical-hand {
  color: var(--text-secondary);
  font-family: var(--font-family-mono);
  font-size: 0.82rem;
}

.playing-cards {
  grid-column: 1 / -1;
  display: flex;
  gap: 0.65rem;
  margin-top: 0.25rem;
}

.playing-card {
  width: 68px;
  aspect-ratio: 0.72;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.55rem;
  color: #17110f;
  background: #f7ead3;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.36);
  font-family: var(--font-family-mono);
  font-weight: 900;
}

.playing-card.red {
  color: #a22b32;
}

.card-rank {
  font-size: 1.35rem;
  line-height: 1;
}

.card-suit {
  align-self: flex-end;
  font-size: 1.7rem;
  line-height: 1;
}

.decision-prompt {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.decision-prompt h3 {
  margin-top: 0.36rem;
  color: var(--text-primary);
  font-size: clamp(1.02rem, 2vw, 1.24rem);
  font-weight: 800;
}

.decision-prompt > p {
  margin-top: 0.18rem;
  color: var(--text-tertiary);
  font-size: 0.8rem;
}

.action-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.9rem;
}

.action-option {
  min-height: 58px;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.05rem 0.45rem;
  padding: 0.58rem 0.72rem;
  color: var(--text-secondary);
  text-align: left;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 800;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
  touch-action: manipulation;
}

.action-option span,
.action-option small {
  grid-column: 1;
}

.action-option small {
  color: var(--text-tertiary);
  font-size: 0.66rem;
}

.action-option em {
  grid-column: 2;
  grid-row: 1 / 3;
  color: var(--text-tertiary);
  font-family: var(--font-family-mono);
  font-size: 0.76rem;
  font-style: normal;
}

.action-option:not(:disabled):hover {
  transform: translateY(-2px);
  color: var(--text-primary);
  border-color: var(--border-strong);
  background: rgba(217, 173, 88, 0.08);
}

.action-option.selected {
  color: var(--text-inverse);
  background: var(--accent-primary-strong);
  border-color: var(--accent-primary-strong);
}

.action-option.selected small,
.action-option.selected em {
  color: rgba(16, 11, 10, 0.72);
}

.action-option.primary:not(.selected) {
  border-color: rgba(31, 122, 79, 0.68);
  background: rgba(31, 122, 79, 0.12);
}

.action-option:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.action-helper {
  margin-top: 0.5rem !important;
  font-size: 0.72rem !important;
}

.action-helper.active {
  color: #72b995 !important;
}

.intro-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.9rem;
}

.intro-actions p,
.data-note,
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
  gap: 0.55rem;
  padding: 0.68rem 0.95rem;
  border-radius: var(--radius-md);
  font-size: 0.86rem;
  font-weight: 850;
  transition: transform 0.18s ease, filter 0.18s ease, border-color 0.18s ease;
  touch-action: manipulation;
}

.primary-button {
  color: var(--text-inverse);
  background: linear-gradient(180deg, var(--accent-primary-strong), var(--accent-primary));
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 10px 24px rgba(217, 173, 88, 0.12);
}

.primary-button.compact {
  min-height: 44px;
}

.primary-button svg {
  width: 18px;
  height: 18px;
}

.secondary-button {
  min-height: 44px;
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
  padding: clamp(1rem, 2.4vw, 1.35rem);
  background: rgba(7, 5, 4, 0.54);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--accent-primary);
  border-radius: var(--radius-lg);
}

.feedback-panel--primary_tendency {
  border-left-color: #2f9a68;
}

.feedback-panel--acceptable_mix {
  border-left-color: var(--accent-primary-strong);
}

.feedback-panel--baseline_deviation {
  border-left-color: #a63a42;
}

.feedback-heading h3,
.session-complete h3 {
  margin-top: 0.28rem;
  color: var(--text-primary);
  font-size: clamp(1.05rem, 2vw, 1.3rem);
}

.feedback-facts,
.score-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
  margin-top: 0.9rem;
}

.feedback-facts > div,
.score-grid > div {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  padding: 0.65rem 0.72rem;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.feedback-facts span,
.score-grid span {
  color: var(--text-tertiary);
  font-size: 0.66rem;
}

.feedback-facts strong,
.score-grid strong {
  color: var(--text-primary);
  font-size: 0.86rem;
  font-variant-numeric: tabular-nums;
}

.score-grid strong {
  color: var(--accent-primary-strong);
  font-size: 1.6rem;
}

.frequency-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.7rem;
}

.frequency-row span {
  padding: 0.35rem 0.55rem;
  color: var(--text-tertiary);
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  font-size: 0.7rem;
}

.frequency-row span.dominant {
  color: var(--text-primary);
  border-color: rgba(31, 122, 79, 0.42);
  background: rgba(31, 122, 79, 0.1);
}

.feedback-explanation {
  margin-top: 0.8rem;
  padding: 0.82rem 0.9rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md);
}

.feedback-explanation p {
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.5;
}

.feedback-explanation .english-explanation {
  margin-top: 0.22rem;
  color: var(--text-tertiary);
  font-size: 0.74rem;
}

.feedback-explanation small {
  display: block;
  margin-top: 0.5rem;
  color: var(--accent-primary);
  font-size: 0.66rem;
  line-height: 1.45;
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
  max-width: 68ch;
  margin: 0.45rem auto 0;
  color: var(--text-secondary);
  font-size: 0.84rem;
  line-height: 1.55;
}

.complete-actions {
  justify-content: center;
}

.mistake-notice {
  color: var(--accent-primary) !important;
}

.data-note {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 0.85rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-subtle);
  font-family: var(--font-family-mono);
  font-size: 0.62rem;
}

@media (max-width: 800px) {
  .decision-card__header,
  .feedback-heading {
    flex-direction: column;
  }

  .session-meta {
    align-items: flex-start;
  }

  .scenario-strip,
  .feedback-facts,
  .score-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .decision-stage {
    grid-template-columns: 1fr;
  }

  .hero-hand {
    padding-right: 0;
    padding-bottom: 1rem;
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
  }
}

@media (max-width: 520px) {
  .decision-card {
    padding: 1rem;
  }

  .scenario-strip,
  .action-options,
  .feedback-facts,
  .score-grid {
    grid-template-columns: 1fr;
  }

  .scenario-item {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .intro-actions,
  .feedback-actions,
  .complete-actions,
  .data-note {
    flex-direction: column;
    align-items: stretch;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .action-option,
  .primary-button,
  .secondary-button,
  .progress-track span {
    transition: none;
  }

  .action-option:not(:disabled):hover,
  .primary-button:hover:not(:disabled),
  .secondary-button:hover:not(:disabled) {
    transform: none;
  }
}
</style>
