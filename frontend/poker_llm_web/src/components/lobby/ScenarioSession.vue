<template>
  <section class="scenario-session" aria-labelledby="scenario-session-title">
    <header class="session-header">
      <div>
        <span class="section-kicker">Scenario chain · 短情境链</span>
        <h3 id="scenario-session-title" ref="stageHeading" tabindex="-1">
          Scenario {{ currentIndex + 1 }} / {{ session.items.length }}
        </h3>
        <p>
          Two independent decision nodes. Answer first, then reveal the admitted truth source.
          两个独立决策节点；先作答，再揭示已准入真值来源。
        </p>
      </div>
      <button type="button" class="secondary-button" @click="exitSession">
        End & review · 结束并复盘
      </button>
    </header>

    <div class="progress-copy">
      <span>{{ nodeStage === 'preflop' ? 'Node 1 · Preflop tendency' : 'Node 2 · Independent Price Bridge' }}</span>
      <span>{{ completedNodeCount }} / {{ session.items.length * 2 }} nodes answered</span>
    </div>
    <div class="progress-track" aria-hidden="true">
      <span :style="{ width: `${progressPercent}%` }"></span>
    </div>

    <div class="scenario-strip" aria-label="Current scenario conditions">
      <span>Heads-up</span>
      <span>SB / Button</span>
      <span>100 BB</span>
      <span>Unopened</span>
      <span>Open 2.5 BB</span>
    </div>

    <aside class="selection-note" aria-label="Scenario scheduling reason">
      <strong>{{ selectionReasonCopy.title }}</strong>
      <span>{{ selectionReasonCopy.detail }}</span>
    </aside>

    <section v-if="nodeStage === 'preflop'" class="decision-surface" aria-labelledby="preflop-node-title">
      <div class="node-heading">
        <div>
          <span class="node-label">Node 1 · L3 baseline</span>
          <h4 id="preflop-node-title">Preflop range tendency · 翻前范围倾向</h4>
        </div>
        <span class="evidence-badge">L3 · Versioned baseline</span>
      </div>

      <div class="preflop-layout">
        <div class="canonical-hand-block">
          <span>Hero canonical hand · 起手牌类别</span>
          <strong>{{ currentScenario.canonicalHand }}</strong>
          <small>One of 169 hand classes in this single defined spot.</small>
        </div>

        <div class="action-block">
          <span class="prompt-label">Your action · 你的行动</span>
          <h4>Action folds to you on the Button. What do you choose?</h4>
          <div class="action-grid three" role="group" aria-label="Choose a preflop action">
            <button
              v-for="action in preflopNode.actions"
              :key="action.id"
              :ref="setActionButton"
              type="button"
              :class="{
                selected: selectedAction === action.id,
                primary: preflopEvaluation && preflopNode.truth.primaryActions.includes(action.id)
              }"
              :disabled="Boolean(preflopEvaluation)"
              :aria-pressed="selectedAction === action.id"
              @click="answerPreflop(action.id)"
            >
              <span>{{ preflopActionLabel(action.id) }}</span>
              <small>{{ preflopActionLabelZh(action.id) }}</small>
              <em v-if="preflopEvaluation">{{ action.frequency }}%</em>
            </button>
          </div>
          <p v-if="!preflopEvaluation" class="hidden-truth">
            Frequencies remain hidden until you answer · 作答前不显示频率
          </p>
        </div>
      </div>

      <section
        v-if="preflopEvaluation"
        ref="feedbackHeading"
        class="feedback-panel"
        :class="`feedback-${preflopEvaluation.evaluationResult}`"
        tabindex="-1"
        aria-live="polite"
      >
        <div class="feedback-heading">
          <div>
            <span>Baseline alignment · 与基准的一致程度</span>
            <h4>{{ preflopFeedbackCopy.title }}</h4>
          </div>
          <strong>{{ preflopEvaluation.selectedFrequency }}%</strong>
        </div>
        <p>{{ preflopFeedbackCopy.detail }}</p>

        <div class="frequency-row" aria-label="Baseline action frequencies">
          <span
            v-for="action in preflopNode.actions"
            :key="action.id"
            :class="{ dominant: preflopNode.truth.primaryActions.includes(action.id) }"
          >
            {{ preflopActionLabel(action.id) }} <strong>{{ action.frequency }}%</strong>
          </span>
        </div>

        <div class="explanation-box">
          <p>Feedback compares only the action frequencies in this admitted preflop snapshot.</p>
          <p>反馈只比较这份已准入翻前快照中的行动频率。</p>
          <small>L3 baseline · internal heuristic snapshot · not solver-calibrated</small>
        </div>

        <aside v-if="selectedAction === 'fold'" class="counterfactual-note">
          <strong>Counterfactual optional bridge · 反事实可选桥接</strong>
          <p>
            This price exercise is optional and does not mean the hand continued after folding.
            该价格练习可选；它不代表你弃牌后这手牌真实继续。
          </p>
        </aside>

        <div class="feedback-actions">
          <button type="button" class="primary-button" @click="continueToPriceBridge">
            Continue to independent Price Bridge · 继续独立价格概念练习
          </button>
          <button type="button" class="secondary-button" @click="skipPriceBridge">
            Skip bridge · Next scenario · 跳过桥接 · 下一情境
          </button>
        </div>
      </section>
    </section>

    <section v-else class="decision-surface" aria-labelledby="price-node-title">
      <div class="node-heading">
        <div>
          <span class="node-label">Node 2 · Independent concept bridge</span>
          <h4 id="price-node-title">Price one Fold / Call decision · 独立价格决策</h4>
        </div>
        <span class="evidence-badge math">L1 · Math fact</span>
      </div>

      <aside class="bridge-boundary">
        <strong>Source: pot-odds-v1 · Independent concept bridge</strong>
        <p>
          Price Bridge is an independent concept exercise, not a continuation of this hand.
          价格桥接是独立的概念练习，不是这手牌在真实牌局中的后续发展。
        </p>
      </aside>

      <div class="math-facts">
        <div>
          <span>Pot before bet · 下注前底池</span>
          <strong>{{ formatBB(priceQuestion.potBeforeBetBB) }}</strong>
        </div>
        <div>
          <span>Villain bet · 对手下注</span>
          <strong>{{ formatBB(priceQuestion.villainBetBB) }}</strong>
        </div>
        <div>
          <span>Your call · 你的跟注</span>
          <strong>{{ formatBB(priceQuestion.callAmountBB) }}</strong>
        </div>
        <div>
          <span>Given Hero equity · 已给定胜率</span>
          <strong>{{ formatPct(priceQuestion.heroEquityPct) }}</strong>
        </div>
      </div>

      <div class="price-actions">
        <div>
          <span class="prompt-label">Your decision · 你的决定</span>
          <h4>Fold or Call?</h4>
        </div>
        <div class="action-grid two" role="group" aria-label="Choose Fold or Call">
          <button
            v-for="action in priceNode.actions"
            :key="action.id"
            :ref="setActionButton"
            type="button"
            :class="{
              selected: selectedAction === action.id,
              primary: priceEvaluation && priceEvaluation.correctAction === action.id
            }"
            :disabled="Boolean(priceEvaluation)"
            :aria-pressed="selectedAction === action.id"
            @click="answerPrice(action.id)"
          >
            <span>{{ action.id }}</span>
            <small>{{ action.id === 'Fold' ? '弃牌' : '跟注' }}</small>
          </button>
        </div>
      </div>
      <p v-if="!priceEvaluation" class="hidden-truth">
        Required equity, EV, and recommendation remain hidden until you answer.
        作答前不显示价格门槛、EV 或推荐行动。
      </p>

      <section
        v-if="priceEvaluation"
        ref="feedbackHeading"
        class="feedback-panel"
        :class="priceEvaluation.evaluationResult === 'math_alignment' ? 'feedback-primary_alignment' : 'feedback-off_range'"
        tabindex="-1"
        aria-live="polite"
      >
        <div class="feedback-heading">
          <div>
            <span>Fixed math feedback · 固定数学反馈</span>
            <h4>
              {{ priceEvaluation.evaluationResult === 'math_alignment'
                ? 'Matches the fixed math · 符合固定数学结果'
                : 'Review the price threshold · 复习价格门槛' }}
            </h4>
          </div>
          <strong>{{ priceEvaluation.correctAction }}</strong>
        </div>

        <div class="math-results">
          <div><span>Your action</span><strong>{{ priceEvaluation.userAction }}</strong></div>
          <div><span>Recommended</span><strong>{{ priceEvaluation.correctAction }}</strong></div>
          <div><span>Final pot if Call</span><strong>{{ formatBB(priceEvaluation.finalPotBB) }}</strong></div>
          <div><span>Required equity</span><strong>{{ formatPct(priceEvaluation.requiredEquityPct) }}</strong></div>
          <div><span>Equity edge</span><strong>{{ formatSignedPct(priceEvaluation.equityEdgePct) }}</strong></div>
          <div><span>Simplified Call EV</span><strong>{{ formatSignedBB(priceEvaluation.callEvBB) }}</strong></div>
        </div>

        <div class="explanation-box">
          <p>{{ priceExplanation.zh }}</p>
          <p>{{ priceExplanation.en }}</p>
          <small>
            This is a fixed math exercise. It does not estimate equity for the previous hand.
            这是固定数学练习，不会估算上一手牌对对手范围的真实 equity。
          </small>
        </div>

        <div class="feedback-actions">
          <button type="button" class="primary-button" @click="advanceScenario">
            {{ isLastScenario ? 'View session review · 查看本轮复盘' : 'Next scenario · 下一情境' }}
          </button>
        </div>
      </section>
    </section>

    <footer class="session-footer">
      <span>{{ currentItem.scenarioId }}</span>
      <span>{{ session.schedulerVersion }}</span>
      <span>Independent teaching nodes · no simulated hand continuation</span>
    </footer>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { USER_OBSERVATION_RECORD_TYPE } from '@/training/scenarios/evidence-levels.js'
import { getPotOddsExplanation } from '@/training/explanations/pot-odds-explanations.js'
import {
  evaluateScenarioNodeAction,
  getScenarioTransition
} from '@/utils/training/scenarioScheduler.js'

const props = defineProps({
  session: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['observation', 'complete', 'exit'])

const currentIndex = ref(0)
const nodeStage = ref('preflop')
const selectedAction = ref(null)
const preflopEvaluation = ref(null)
const priceEvaluation = ref(null)
const completedNodeCount = ref(0)
const skippedBridgeCount = ref(0)
const stageHeading = ref(null)
const feedbackHeading = ref(null)
const actionButtons = ref([])

const currentItem = computed(() => props.session.items[currentIndex.value])
const currentScenario = computed(() => currentItem.value.scenario)
const preflopNode = computed(() => currentScenario.value.nodes[0])
const priceNode = computed(() => currentScenario.value.nodes[1])
const priceQuestion = computed(() => priceNode.value.truth.question)
const isLastScenario = computed(() => currentIndex.value === props.session.items.length - 1)
const progressPercent = computed(() => (
  Math.round((completedNodeCount.value / (props.session.items.length * 2)) * 100)
))
const priceExplanation = computed(() => getPotOddsExplanation(priceQuestion.value.explanationKey))

const selectionReasonCopy = computed(() => {
  const reason = currentItem.value.selectionReason
  if (reason === 'mistake_review' || reason === 'quota_reallocation_review') {
    return { title: 'Mistake review · 错题复习', detail: 'A previous off-range or math-review observation brought this scenario back.' }
  }
  if (reason === 'mistake_review_cooldown_override') {
    return { title: 'Mistake review overrides cooldown · 错题优先于冷却', detail: 'A real review candidate can return inside the normal cooldown window.' }
  }
  if (reason === 'boundary' || reason === 'quota_reallocation_boundary') {
    return { title: 'Boundary practice · 边界练习', detail: 'This hand contains a mixed or tied baseline frequency.' }
  }
  if (reason === 'cooldown_release_oldest_first') {
    return { title: 'Cooldown released · 已释放冷却', detail: 'The scheduler used the longest-unseen eligible scenario to avoid duplicates.' }
  }
  return { title: 'Fresh selection · 近期未出现', detail: 'This scenario was selected outside the active cooldown set.' }
})

const preflopFeedbackCopy = computed(() => {
  const result = preflopEvaluation.value?.evaluationResult
  if (result === 'primary_alignment') {
    return {
      title: 'Matches the primary baseline tendency · 符合主要 baseline 倾向',
      detail: 'Your action shares the highest frequency in this versioned training baseline.'
    }
  }
  if (result === 'acceptable_mix') {
    return {
      title: 'A supported mixed action, but not the primary tendency · 可接受的混合行动，但非主要倾向',
      detail: 'This action has positive frequency. It is a boundary-learning signal, not an error.'
    }
  }
  if (result === 'boundary_tie') {
    return {
      title: 'Multiple actions share the top frequency · 多个行动并列为最高频',
      detail: 'There is no single dominant action at this boundary in baseline-v1.'
    }
  }
  return {
    title: 'This action has 0% frequency in this training baseline · 该行动在当前训练 baseline 中频率为 0%',
    detail: 'Treat this as an L3 baseline review signal, not a universal poker verdict.'
  }
})

const setActionButton = (element) => {
  if (element && !actionButtons.value.includes(element)) actionButtons.value.push(element)
}

const focusStage = () => nextTick(() => stageHeading.value?.focus())
const focusFeedback = () => nextTick(() => feedbackHeading.value?.focus())
const focusFirstAction = () => nextTick(() => actionButtons.value.find((button) => !button.disabled)?.focus())

const resetNodeInteraction = () => {
  selectedAction.value = null
  preflopEvaluation.value = null
  priceEvaluation.value = null
  actionButtons.value = []
}

const createObservation = (node, actionId, evaluationResult) => ({
  recordType: USER_OBSERVATION_RECORD_TYPE,
  replayId: node.replayKey,
  scenarioId: currentScenario.value.id,
  scenarioVersion: currentScenario.value.version,
  nodeId: node.id,
  sourceVersion: node.truth.sourceVersion,
  userAction: actionId,
  evaluationResult,
  answeredAt: new Date().toISOString()
})

const answerPreflop = (actionId) => {
  if (preflopEvaluation.value) return
  selectedAction.value = actionId
  const result = evaluateScenarioNodeAction({ node: preflopNode.value, actionId })
  preflopEvaluation.value = result
  completedNodeCount.value += 1
  emit('observation', createObservation(preflopNode.value, actionId, result.evaluationResult))
  focusFeedback()
}

const continueToPriceBridge = () => {
  if (!preflopEvaluation.value) return
  const transition = getScenarioTransition({
    node: preflopNode.value,
    actionId: selectedAction.value
  })
  if (transition.targetNodeId !== priceNode.value.id || !transition.requiresUserInitiation) return
  nodeStage.value = 'price'
  resetNodeInteraction()
  focusStage()
  focusFirstAction()
}

const finishOrAdvance = () => {
  if (isLastScenario.value) {
    emit('complete', { skippedBridgeCount: skippedBridgeCount.value })
    return
  }
  currentIndex.value += 1
  nodeStage.value = 'preflop'
  resetNodeInteraction()
  focusStage()
  focusFirstAction()
}

const skipPriceBridge = () => {
  if (!preflopEvaluation.value) return
  skippedBridgeCount.value += 1
  finishOrAdvance()
}

const answerPrice = (actionId) => {
  if (priceEvaluation.value) return
  selectedAction.value = actionId
  const result = evaluateScenarioNodeAction({ node: priceNode.value, actionId })
  priceEvaluation.value = result
  completedNodeCount.value += 1
  emit('observation', createObservation(priceNode.value, actionId, result.evaluationResult))
  focusFeedback()
}

const advanceScenario = () => {
  if (!priceEvaluation.value) return
  finishOrAdvance()
}

const exitSession = () => emit('exit', { skippedBridgeCount: skippedBridgeCount.value })

const preflopActionLabel = (actionId) => ({
  raise: 'Raise 2.5x',
  limp: 'Limp',
  fold: 'Fold'
})[actionId] || actionId

const preflopActionLabelZh = (actionId) => ({
  raise: '加注 2.5x',
  limp: '跛入',
  fold: '弃牌'
})[actionId] || actionId

const formatNumber = (value, digits = 2) => Number(value.toFixed(digits)).toString()
const formatBB = (value) => `${formatNumber(value)} BB`
const formatPct = (value) => `${formatNumber(value)}%`
const formatSignedPct = (value) => `${value >= 0 ? '+' : ''}${formatNumber(value)} pts`
const formatSignedBB = (value) => `${value >= 0 ? '+' : ''}${formatNumber(value)} BB`

onMounted(() => {
  focusStage()
  focusFirstAction()
})
</script>

<style scoped>
.scenario-session {
  width: 100%;
  min-width: 0;
}

.session-header,
.node-heading,
.feedback-heading,
.progress-copy {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.section-kicker,
.node-label,
.prompt-label {
  color: var(--accent-primary);
  font-size: var(--font-size-meta);
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.session-header h3,
.node-heading h4 {
  margin-top: 0.3rem;
  color: var(--text-primary);
}

.session-header h3:focus,
.feedback-panel:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 4px;
}

.session-header p {
  max-width: 66ch;
  margin-top: 0.35rem;
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.55;
}

.progress-copy {
  margin-top: 1rem;
  color: var(--text-secondary);
  font-size: 0.74rem;
}

.progress-track {
  height: 4px;
  margin-top: 0.45rem;
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

.scenario-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.45rem;
  margin-top: 0.9rem;
}

.scenario-strip span {
  padding: 0.58rem 0.62rem;
  color: var(--text-secondary);
  text-align: center;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.7rem;
  font-weight: 750;
}

.selection-note,
.bridge-boundary,
.counterfactual-note {
  margin-top: 0.7rem;
  padding: 0.72rem 0.82rem;
  background: rgba(217, 173, 88, 0.06);
  border: 1px solid rgba(217, 173, 88, 0.22);
  border-left: 3px solid var(--accent-primary);
  border-radius: var(--radius-md);
}

.selection-note strong,
.selection-note span,
.bridge-boundary strong,
.counterfactual-note strong {
  display: block;
}

.selection-note strong,
.bridge-boundary strong,
.counterfactual-note strong {
  color: var(--accent-primary-strong);
  font-size: 0.76rem;
}

.selection-note span,
.bridge-boundary p,
.counterfactual-note p {
  margin-top: 0.22rem;
  color: var(--text-secondary);
  font-size: 0.72rem;
  line-height: 1.5;
}

.decision-surface {
  margin-top: 0.8rem;
  padding: clamp(1rem, 2.5vw, 1.35rem);
  background: rgba(7, 5, 4, 0.56);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.evidence-badge {
  flex-shrink: 0;
  padding: 0.4rem 0.65rem;
  color: var(--accent-primary-strong);
  background: rgba(217, 173, 88, 0.08);
  border: 1px solid rgba(217, 173, 88, 0.24);
  border-radius: var(--radius-pill);
  font-size: 0.7rem;
  font-weight: 850;
  white-space: nowrap;
}

.evidence-badge.math {
  color: var(--success);
  border-color: color-mix(in srgb, var(--success) 35%, transparent);
}

.preflop-layout {
  display: grid;
  grid-template-columns: minmax(150px, 0.55fr) minmax(0, 1.7fr);
  gap: 1.2rem;
  margin-top: 1rem;
}

.canonical-hand-block {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.canonical-hand-block span,
.canonical-hand-block small {
  color: var(--text-tertiary);
  font-size: 0.68rem;
  line-height: 1.45;
}

.canonical-hand-block strong {
  margin: 0.35rem 0;
  color: var(--accent-primary-strong);
  font-family: var(--font-family-mono);
  font-size: clamp(2rem, 5vw, 3.4rem);
}

.action-block h4,
.price-actions h4 {
  margin-top: 0.3rem;
  color: var(--text-primary);
  font-size: 1rem;
}

.action-grid {
  display: grid;
  gap: 0.55rem;
  margin-top: 0.75rem;
}

.action-grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.action-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.action-grid button,
.primary-button,
.secondary-button {
  min-height: 44px;
  border-radius: var(--radius-md);
  font-weight: 850;
  transition: filter 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  touch-action: manipulation;
}

.action-grid button {
  min-width: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  padding: 0.62rem 0.72rem;
  color: var(--text-secondary);
  text-align: left;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid var(--border-subtle);
}

.action-grid button span,
.action-grid button small {
  grid-column: 1;
}

.action-grid button small {
  color: var(--text-tertiary);
  font-size: 0.66rem;
}

.action-grid button em {
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: center;
  color: var(--text-tertiary);
  font-family: var(--font-family-mono);
  font-size: 0.72rem;
  font-style: normal;
}

.action-grid button:not(:disabled):hover,
.primary-button:hover:not(:disabled),
.secondary-button:hover:not(:disabled) {
  filter: brightness(1.1);
}

.action-grid button.selected {
  color: var(--text-inverse);
  background: var(--accent-primary-strong);
  border-color: var(--accent-primary-strong);
}

.action-grid button.selected small,
.action-grid button.selected em {
  color: rgba(16, 11, 10, 0.72);
}

.action-grid button.primary:not(.selected) {
  border-color: color-mix(in srgb, var(--success) 52%, transparent);
  background: color-mix(in srgb, var(--success) 12%, transparent);
}

.action-grid button:disabled {
  cursor: not-allowed;
  opacity: 0.66;
}

.action-grid button:focus-visible,
.primary-button:focus-visible,
.secondary-button:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.hidden-truth {
  margin-top: 0.55rem;
  color: var(--text-tertiary);
  font-size: 0.7rem;
}

.feedback-panel {
  margin-top: 0.9rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--accent-primary);
  border-radius: var(--radius-md);
}

.feedback-primary_alignment {
  border-left-color: var(--success);
}

.feedback-acceptable_mix,
.feedback-boundary_tie {
  border-left-color: var(--warning);
}

.feedback-off_range {
  border-left-color: var(--danger);
}

.feedback-heading span {
  color: var(--text-tertiary);
  font-size: 0.67rem;
}

.feedback-heading h4 {
  margin-top: 0.24rem;
  color: var(--text-primary);
  font-size: 0.98rem;
}

.feedback-heading > strong {
  color: var(--accent-primary-strong);
  font-family: var(--font-family-mono);
}

.feedback-panel > p {
  margin-top: 0.35rem;
  color: var(--text-secondary);
  font-size: 0.78rem;
  line-height: 1.5;
}

.frequency-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.65rem;
}

.frequency-row span {
  padding: 0.32rem 0.5rem;
  color: var(--text-tertiary);
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  font-size: 0.68rem;
}

.frequency-row span.dominant {
  color: var(--text-primary);
  border-color: color-mix(in srgb, var(--success) 35%, transparent);
}

.explanation-box {
  margin-top: 0.7rem;
  padding: 0.72rem 0.82rem;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.explanation-box p {
  color: var(--text-secondary);
  font-size: 0.76rem;
  line-height: 1.5;
}

.explanation-box p + p {
  margin-top: 0.2rem;
  color: var(--text-tertiary);
}

.explanation-box small {
  display: block;
  margin-top: 0.45rem;
  color: var(--accent-primary);
  font-size: 0.65rem;
  line-height: 1.45;
}

.feedback-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.8rem;
}

.primary-button,
.secondary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.68rem 0.9rem;
  font-size: 0.78rem;
}

.primary-button {
  color: var(--text-inverse);
  background: linear-gradient(180deg, var(--accent-primary-strong), var(--accent-primary));
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.secondary-button {
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-subtle);
}

.math-facts,
.math-results {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
  margin-top: 0.8rem;
}

.math-results {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.math-facts > div,
.math-results > div {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  min-width: 0;
  padding: 0.65rem;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.math-facts span,
.math-results span {
  color: var(--text-tertiary);
  font-size: 0.65rem;
}

.math-facts strong,
.math-results strong {
  color: var(--text-primary);
  font-family: var(--font-family-mono);
  font-size: 0.86rem;
  overflow-wrap: anywhere;
}

.price-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 0.8fr);
  gap: 1rem;
  align-items: center;
  margin-top: 0.9rem;
}

.session-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.35rem 0.8rem;
  margin-top: 0.75rem;
  padding-top: 0.7rem;
  color: var(--text-tertiary);
  border-top: 1px solid var(--border-subtle);
  font-family: var(--font-family-mono);
  font-size: 0.59rem;
}

@media (max-width: 760px) {
  .session-header,
  .node-heading,
  .feedback-heading {
    flex-direction: column;
  }

  .preflop-layout,
  .price-actions {
    grid-template-columns: 1fr;
  }

  .scenario-strip,
  .math-facts,
  .math-results {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .scenario-strip,
  .action-grid.three,
  .action-grid.two,
  .math-facts,
  .math-results {
    grid-template-columns: 1fr;
  }

  .feedback-actions,
  .session-footer,
  .progress-copy {
    flex-direction: column;
    align-items: stretch;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .progress-track span,
  .action-grid button,
  .primary-button,
  .secondary-button {
    transition: none;
  }
}
</style>
