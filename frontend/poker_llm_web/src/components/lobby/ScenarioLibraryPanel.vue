<template>
  <article class="library-panel" aria-labelledby="scenario-library-title">
    <header v-if="view !== 'session'" class="library-header">
      <div>
        <span class="section-kicker">Scenario Library · 情境库</span>
        <h2 id="scenario-library-title" ref="viewHeading" tabindex="-1">
          {{ viewTitle }}
        </h2>
        <p>
          Short, auditable learning chains with visible source and limitation boundaries.
          展示来源、限制与调度状态的短情境练习。
        </p>
      </div>
      <div class="header-badges" aria-label="Library status">
        <span>1 admitted pack</span>
        <span>{{ pack.version }}</span>
      </div>
    </header>

    <section v-if="view === 'overview'" class="overview" aria-label="Scenario pack overview">
      <div class="pack-card">
        <div class="pack-heading">
          <div>
            <span class="pack-number">Scenario 01 · 受限训练包</span>
            <h3>HU Button First-In</h3>
          </div>
          <span class="admission-badge">Admitted · 已准入</span>
        </div>

        <div class="condition-grid" aria-label="Pack conditions">
          <div><span>Format</span><strong>Heads-up</strong></div>
          <div><span>Position</span><strong>SB / Button</strong></div>
          <div><span>Stack</span><strong>100 BB</strong></div>
          <div><span>Prior action</span><strong>Unopened</strong></div>
          <div><span>Open size</span><strong>2.5 BB</strong></div>
          <div><span>Rake</span><strong>Unknown · 未知</strong></div>
        </div>

        <div class="evidence-row">
          <span class="evidence-badge">L3 · Versioned training baseline</span>
          <strong>Internal heuristic snapshot</strong>
          <span>Not solver-calibrated</span>
        </div>

        <aside class="scope-warning">
          <strong>One defined preflop spot · 单一明确翻前场景</strong>
          <p>
            {{ pack.scenarios.length }} hand classes in one defined preflop spot.
            {{ pack.scenarios.length }} 个起手牌类别，属于同一个明确的翻前场景。
          </p>
          <p>
            Not applicable to 6-max / MTT / BB defend / different rake / stack / ante / open size.
          </p>
        </aside>

        <div class="pack-footer">
          <div>
            <span>Source · 来源</span>
            <strong>{{ pack.source.toolOrPublisher }} · {{ pack.source.sourceUrlOrMethod }}</strong>
          </div>
          <button type="button" class="primary-button" @click="showDetails">
            Inspect scenario · 查看情境
          </button>
        </div>
      </div>

      <p class="local-record-note">
        Independent local observations: {{ storageRecord.observations.length }} / {{ maxObservations }}
        · postsoma_scenario_library_v1
      </p>
    </section>

    <section v-else-if="view === 'details'" class="details" aria-label="Scenario pack details">
      <button type="button" class="text-button" @click="showOverview">
        Back to library · 返回情境库
      </button>

      <div class="detail-grid">
        <section class="detail-card">
          <span class="detail-label">Pack conditions · 场景条件</span>
          <h3>{{ pack.title.en }}</h3>
          <p>{{ pack.title.zh }}</p>
          <dl>
            <div><dt>Format</dt><dd>Heads-up cash · 2 players</dd></div>
            <div><dt>Hero</dt><dd>SB / Button</dd></div>
            <div><dt>Stack</dt><dd>{{ pack.effectiveStackBB }} BB</dd></div>
            <div><dt>Prior action</dt><dd>Unopened · no prior sequence</dd></div>
            <div><dt>Open size</dt><dd>{{ pack.openSizeBB }} BB</dd></div>
            <div><dt>Rake assumption</dt><dd>Unknown · 抽水假设未知</dd></div>
          </dl>
        </section>

        <section class="detail-card evidence-card">
          <span class="detail-label">Evidence / Source / Version</span>
          <h3>{{ evidence.name.en }} · {{ evidence.name.zh }}</h3>
          <p>{{ evidence.definition.en }}</p>
          <p>{{ evidence.definition.zh }}</p>
          <dl>
            <div><dt>Evidence</dt><dd>{{ evidence.id }}</dd></div>
            <div><dt>Pack version</dt><dd>{{ pack.version }}</dd></div>
            <div><dt>Source type</dt><dd>Internal heuristic snapshot</dd></div>
            <div><dt>Publisher</dt><dd>{{ pack.source.toolOrPublisher }}</dd></div>
            <div><dt>License</dt><dd>{{ pack.source.license }}</dd></div>
          </dl>
          <small>
            Internally consistent and auditable, but not Solver calibrated.
            内部一致且可审计，但不是 Solver 校准策略。
          </small>
        </section>
      </div>

      <section class="limitations-card">
        <span class="detail-label">Complete limitations · 完整限制</span>
        <ul>
          <li v-for="limitation in pack.limitations" :key="limitation">{{ limitation }}</li>
        </ul>
        <p>
          These limits are part of the training contract, not optional fine print.
          这些限制是训练契约的一部分，不是可隐藏的小字说明。
        </p>
      </section>

      <section class="bridge-card">
        <div>
          <span class="detail-label">Node 2 · L1 Math fact</span>
          <h3>Independent Price Bridge · 独立价格桥接</h3>
        </div>
        <p>
          Price Bridge is an independent concept exercise, not a continuation of this hand.
          价格桥接是独立的概念练习，不是这手牌在真实牌局中的后续发展。
        </p>
        <small>
          It reuses 8 fixed pot-odds-v1 questions. Different Scenario IDs can reference the same math concept.
          它复用 8 道固定数学题；不同 Scenario ID 可能映射到相同价格概念。
        </small>
      </section>

      <section class="dedupe-card">
        <span class="detail-label">This session · 本轮真实去重边界</span>
        <ul>
          <li>Scenario IDs are unique · Scenario ID 不重复。</li>
          <li>Preflop hand classes are unique · 翻前手牌类别不重复。</li>
          <li>Price Bridges use 8 fixed math questions and may repeat across scenarios.</li>
          <li>All current position-specific scenarios are SB/Button.</li>
          <li>This is not a multi-position or full-hand simulation · 不是多位置或完整牌局模拟。</li>
        </ul>
      </section>

      <aside class="start-summary">
        <div>
          <strong>Target: {{ schedulerConfig.sessionSize }} unique Scenario IDs</strong>
          <span>Cooldown: latest {{ schedulerConfig.cooldown.recentScenarioCount }} scenarios or {{ schedulerConfig.cooldown.durationHours }} hours</span>
          <span>Stored observations available: {{ storageRecord.observations.length }}</span>
        </div>
        <button type="button" class="primary-button" @click="startSession">
          Start a unique session · 开始不重复练习
        </button>
      </aside>
      <p v-if="startError" class="error-message" role="alert">{{ startError }}</p>
    </section>

    <section v-else-if="view === 'session'" class="session-view">
      <aside v-if="sessionWasShortened" class="session-notice" role="status">
        <strong>Session shortened to {{ activeSession.items.length }} unique scenarios.</strong>
        <span>为避免重复情境，本轮练习已缩短。</span>
      </aside>
      <ScenarioSession
        :session="activeSession"
        @observation="recordObservation"
        @complete="completeSession"
        @exit="exitSession"
      />
    </section>

    <section v-else class="review" aria-label="Scenario session review">
      <div class="review-status" :class="{ exited: sessionOutcome.exited }">
        <span class="detail-label">Session Review · 本轮复盘</span>
        <h3>{{ sessionOutcome.exited ? 'Session ended early · 已提前结束' : 'Session complete · 本轮完成' }}</h3>
        <p>
          {{ completedScenarioCount }} Scenario IDs answered out of {{ activeSession.items.length }} scheduled.
          实际完成 {{ completedScenarioCount }} 个不重复翻前情境。
        </p>
      </div>

      <div class="review-grid" aria-label="Decision result counts">
        <div><strong>{{ resultCounts.primary_alignment }}</strong><span>Primary alignment · 主要倾向</span></div>
        <div><strong>{{ resultCounts.acceptable_mix }}</strong><span>Acceptable mix · 混合可接受</span></div>
        <div><strong>{{ resultCounts.boundary_tie }}</strong><span>Boundary tie · 并列边界</span></div>
        <div><strong>{{ resultCounts.off_range }}</strong><span>Off range · 0% 行动</span></div>
        <div><strong>{{ resultCounts.math_alignment }}</strong><span>Math aligned · 数学一致</span></div>
        <div><strong>{{ resultCounts.math_review }}</strong><span>Math review · 数学复习</span></div>
      </div>

      <section class="review-section">
        <span class="detail-label">Scheduled source mix · 调度来源</span>
        <div class="source-grid">
          <div><strong>{{ sourceCounts.fresh }}</strong><span>Fresh · 近期未出现</span></div>
          <div><strong>{{ sourceCounts.mistake_review }}</strong><span>Mistake review · 错题复习</span></div>
          <div><strong>{{ sourceCounts.mistake_review_cooldown_override }}</strong><span>Review cooldown override · 错题覆盖冷却</span></div>
          <div><strong>{{ sourceCounts.boundary }}</strong><span>Boundary · 边界情境</span></div>
          <div><strong>{{ sourceCounts.cooldown_release }}</strong><span>Cooldown released · 释放冷却</span></div>
        </div>
      </section>

      <section class="review-section facts-section">
        <span class="detail-label">Scheduled uniqueness · 已调度内容的去重情况</span>
        <ul>
          <li>{{ uniqueScenarioCount }} unique Scenario IDs.</li>
          <li>{{ uniqueHandCount }} unique preflop hand classes.</li>
          <li>{{ uniquePriceQuestionCount }} unique Price Bridge questions used from an 8-question fixed pool.</li>
          <li>One position only: SB/Button · 当前只有一个位置。</li>
          <li>{{ sessionOutcome.skippedBridgeCount }} independent Price Bridges skipped by choice.</li>
        </ul>
      </section>

      <section class="review-section diagnostics-section">
        <span class="detail-label">Scheduler diagnostics · 调度诊断</span>
        <aside class="library-limitation">
          <strong>Current library limitation · 当前情境库限制</strong>
          <p>
            Only one admitted position-specific strategy pack is available: SB/Button.
            目前只有一个通过准入的位置策略包：SB/Button。
          </p>
        </aside>

        <ul v-if="diagnosticMessages.length">
          <li v-for="message in diagnosticMessages" :key="message">{{ message }}</li>
        </ul>
        <p v-else>No scheduler degradation was required · 本轮无需调度降级。</p>
      </section>

      <div class="review-actions">
        <button type="button" class="primary-button" @click="startSession">
          Start another session · 再练一轮
        </button>
        <button type="button" class="secondary-button" @click="showDetails">
          Back to pack details · 返回训练包详情
        </button>
      </div>

      <footer class="review-footer">
        <span>Session {{ activeSession.sessionId }}</span>
        <span>Seed {{ sessionCapture.seed }}</span>
        <span>Observations stored: {{ storageRecord.observations.length }} / {{ maxObservations }}</span>
      </footer>
    </section>
  </article>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import ScenarioSession from '@/components/lobby/ScenarioSession.vue'
import { EVIDENCE_LEVELS_BY_ID } from '@/training/scenarios/evidence-levels.js'
import { SCENARIO_01_HU_BTN_FIRST_IN_100BB_V1 } from '@/training/scenarios/scenario-library-v1.js'
import { SCENARIO_SCHEDULER_V1 } from '@/training/scenarios/scheduler-config-v1.js'
import { createScenarioSession } from '@/utils/training/scenarioScheduler.js'
import {
  SCENARIO_TRAINING_MAX_OBSERVATIONS,
  appendScenarioObservation,
  getRecentScenarioObservations,
  loadScenarioTrainingRecord
} from '@/utils/training/scenarioTrainingStorage.js'

const pack = SCENARIO_01_HU_BTN_FIRST_IN_100BB_V1
const schedulerConfig = SCENARIO_SCHEDULER_V1
const maxObservations = SCENARIO_TRAINING_MAX_OBSERVATIONS
const evidence = EVIDENCE_LEVELS_BY_ID[pack.evidenceLevel]

const view = ref('overview')
const viewHeading = ref(null)
const activeSession = ref(null)
const sessionCapture = ref(null)
const sessionObservations = ref([])
const sessionOutcome = ref({ exited: false, skippedBridgeCount: 0 })
const storageRecord = ref(loadScenarioTrainingRecord())
const startError = ref('')

const viewTitle = computed(() => ({
  overview: 'Auditable short scenarios · 可审计短情境',
  details: 'Scenario 01 conditions and evidence · 条件与证据',
  review: 'What this session actually trained · 本轮实际训练内容'
})[view.value] || 'Scenario Library · 情境库')

const focusViewHeading = () => nextTick(() => viewHeading.value?.focus())

const setView = (nextView) => {
  view.value = nextView
  if (nextView !== 'session') focusViewHeading()
}

const showOverview = () => setView('overview')
const showDetails = () => {
  storageRecord.value = loadScenarioTrainingRecord()
  setView('details')
}

const startSession = () => {
  startError.value = ''
  const capturedDate = new Date()
  const captured = Object.freeze({
    seed: capturedDate.getTime(),
    now: capturedDate.toISOString(),
    packId: pack.id
  })
  const latestRecord = loadScenarioTrainingRecord()
  const observations = getRecentScenarioObservations(latestRecord, {
    limit: SCENARIO_TRAINING_MAX_OBSERVATIONS
  })

  try {
    const session = createScenarioSession({
      packId: captured.packId,
      seed: captured.seed,
      now: captured.now,
      recentObservations: observations,
      targetCount: schedulerConfig.sessionSize,
      config: schedulerConfig
    })
    if (!session.items.length) throw new Error('No unique scenarios are currently schedulable')

    storageRecord.value = latestRecord
    activeSession.value = session
    sessionCapture.value = captured
    sessionObservations.value = []
    sessionOutcome.value = { exited: false, skippedBridgeCount: 0 }
    view.value = 'session'
  } catch (error) {
    startError.value = `Unable to start this local session · 无法开始本地练习：${error.message}`
  }
}

const recordObservation = (observation) => {
  storageRecord.value = appendScenarioObservation(observation)
  sessionObservations.value.push(observation)
}

const finishSession = (payload, exited) => {
  sessionOutcome.value = {
    exited,
    skippedBridgeCount: payload?.skippedBridgeCount || 0
  }
  setView('review')
}

const completeSession = (payload) => finishSession(payload, false)
const exitSession = (payload) => finishSession(payload, true)

const resultCounts = computed(() => {
  const counts = {
    primary_alignment: 0,
    acceptable_mix: 0,
    boundary_tie: 0,
    off_range: 0,
    math_alignment: 0,
    math_review: 0
  }
  sessionObservations.value.forEach(({ evaluationResult }) => {
    if (Object.prototype.hasOwnProperty.call(counts, evaluationResult)) counts[evaluationResult] += 1
  })
  return counts
})

const sourceCounts = computed(() => {
  const counts = {
    fresh: 0,
    mistake_review: 0,
    mistake_review_cooldown_override: 0,
    boundary: 0,
    cooldown_release: 0
  }
  activeSession.value?.items.forEach(({ selectionReason }) => {
    if (selectionReason === 'fresh' || selectionReason === 'quota_reallocation_fresh') counts.fresh += 1
    else if (selectionReason === 'mistake_review' || selectionReason === 'quota_reallocation_review') counts.mistake_review += 1
    else if (selectionReason === 'mistake_review_cooldown_override') counts.mistake_review_cooldown_override += 1
    else if (selectionReason === 'boundary' || selectionReason === 'quota_reallocation_boundary') counts.boundary += 1
    else if (selectionReason === 'cooldown_release_oldest_first') counts.cooldown_release += 1
  })
  return counts
})

const completedScenarioCount = computed(() => new Set(
  sessionObservations.value
    .filter(({ nodeId }) => nodeId.endsWith(':preflop-decision'))
    .map(({ scenarioId }) => scenarioId)
).size)

const uniqueScenarioCount = computed(() => new Set(
  activeSession.value?.items.map(({ scenarioId }) => scenarioId) || []
).size)

const uniqueHandCount = computed(() => new Set(
  activeSession.value?.items.map(({ scenario }) => scenario.canonicalHand) || []
).size)

const uniquePriceQuestionCount = computed(() => new Set(
  activeSession.value?.items.map(({ scenario }) => scenario.nodes[1].truth.questionId) || []
).size)

const sessionWasShortened = computed(() => (
  activeSession.value &&
  activeSession.value.diagnostics.scheduledCount < activeSession.value.diagnostics.requestedCount
))

const diagnosticMessages = computed(() => {
  if (!activeSession.value) return []
  const diagnostics = activeSession.value.diagnostics
  const messages = []

  diagnostics.quotaShortfalls.forEach(({ category, requested, scheduledFromCategory }) => {
    messages.push(
      `${category}: requested ${requested}, available ${scheduledFromCategory}; remaining slots were transparently reallocated when possible.`
    )
  })
  diagnostics.cooldownOverrides.forEach(({ reason }) => {
    messages.push(reason === 'mistake_review_cooldown_override'
      ? 'A genuine review item returned inside cooldown · 真实错题覆盖了冷却限制。'
      : 'The longest-unseen cooled scenario was released to avoid duplicates · 已释放最久未见的冷却情境。')
  })
  diagnostics.diversityWarnings.forEach(({ type }) => {
    if (type.includes('positions')) {
      messages.push('Position diversity is unavailable because only SB/Button is admitted · 当前仅有 SB/Button，无法提供位置多样性。')
    } else {
      messages.push('The configured concept diversity could not be fully satisfied · 无法完全满足概念多样性配置。')
    }
  })
  if (diagnostics.fallbackReasons.includes('session_shortened_unique_scenarios_exhausted')) {
    messages.push('Session shortened to avoid repeating scenarios · 为避免重复情境，本轮练习已缩短。')
  }
  if (diagnostics.fallbackReasons.includes('configured_mix_unavailable_reallocated')) {
    messages.push('Unavailable fresh/review/boundary quota was reallocated without duplicating a Scenario ID · 缺失配额已透明调配，未重复 Scenario ID。')
  }
  return [...new Set(messages)]
})
</script>

<style scoped>
.library-panel {
  width: 100%;
  max-width: 1040px;
  min-width: 0;
  padding: clamp(1.2rem, 3vw, 2rem);
  color: var(--text-primary);
  background:
    radial-gradient(circle at 92% 0%, rgba(217, 173, 88, 0.13), transparent 20rem),
    linear-gradient(145deg, rgba(31, 122, 79, 0.08), transparent 52%),
    var(--bg-panel-solid);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.library-header,
.pack-heading,
.pack-footer,
.start-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.section-kicker,
.detail-label,
.pack-number {
  color: var(--accent-primary);
  font-size: var(--font-size-meta);
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.library-header h2 {
  margin-top: 0.35rem;
  font-size: clamp(1.45rem, 3vw, 2rem);
  font-weight: 850;
}

.library-header h2:focus {
  outline: 2px solid var(--accent-primary);
  outline-offset: 4px;
}

.library-header p {
  max-width: 66ch;
  margin-top: 0.42rem;
  color: var(--text-secondary);
  font-size: 0.86rem;
  line-height: 1.55;
}

.header-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  flex-shrink: 0;
}

.header-badges span,
.admission-badge,
.evidence-badge {
  padding: 0.4rem 0.65rem;
  color: var(--accent-primary-strong);
  background: rgba(217, 173, 88, 0.08);
  border: 1px solid rgba(217, 173, 88, 0.24);
  border-radius: var(--radius-pill);
  font-size: 0.69rem;
  font-weight: 850;
  white-space: nowrap;
}

.overview,
.details,
.review {
  margin-top: 1rem;
}

.pack-card,
.detail-card,
.limitations-card,
.bridge-card,
.dedupe-card,
.review-section {
  min-width: 0;
  padding: clamp(1rem, 2.5vw, 1.35rem);
  background: rgba(7, 5, 4, 0.52);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.pack-heading h3,
.detail-card h3,
.bridge-card h3,
.review-status h3 {
  margin-top: 0.28rem;
  color: var(--text-primary);
  font-size: clamp(1.05rem, 2vw, 1.28rem);
}

.condition-grid,
.review-grid,
.source-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
  margin-top: 0.9rem;
}

.condition-grid > div,
.review-grid > div,
.source-grid > div {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  min-width: 0;
  padding: 0.65rem 0.72rem;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.condition-grid span,
.review-grid span,
.source-grid span {
  color: var(--text-tertiary);
  font-size: 0.66rem;
  line-height: 1.4;
}

.condition-grid strong,
.review-grid strong,
.source-grid strong {
  color: var(--text-primary);
  font-size: 0.86rem;
  overflow-wrap: anywhere;
}

.review-grid strong,
.source-grid strong {
  color: var(--accent-primary-strong);
  font-size: 1.45rem;
}

.evidence-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.74rem;
}

.scope-warning,
.library-limitation,
.session-notice {
  margin-top: 0.75rem;
  padding: 0.78rem 0.88rem;
  background: rgba(217, 173, 88, 0.06);
  border: 1px solid rgba(217, 173, 88, 0.24);
  border-left: 3px solid var(--accent-primary);
  border-radius: var(--radius-md);
}

.scope-warning strong,
.library-limitation strong,
.session-notice strong,
.session-notice span {
  display: block;
  color: var(--accent-primary-strong);
  font-size: 0.76rem;
}

.scope-warning p,
.library-limitation p,
.session-notice span {
  margin-top: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.73rem;
  line-height: 1.5;
}

.pack-footer {
  align-items: center;
  margin-top: 0.85rem;
}

.pack-footer > div,
.start-summary > div {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  min-width: 0;
}

.pack-footer span,
.start-summary span,
.local-record-note,
.review-footer {
  color: var(--text-tertiary);
  font-size: 0.68rem;
}

.pack-footer strong {
  color: var(--text-secondary);
  font-size: 0.74rem;
  overflow-wrap: anywhere;
}

.local-record-note {
  margin-top: 0.65rem;
  font-family: var(--font-family-mono);
}

.text-button {
  min-height: 44px;
  padding: 0.55rem 0;
  color: var(--accent-primary-strong);
  background: transparent;
  border: 0;
  font-size: 0.76rem;
  font-weight: 850;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.detail-card > p,
.limitations-card > p,
.bridge-card > p,
.bridge-card > small,
.review-status p,
.diagnostics-section > p {
  margin-top: 0.35rem;
  color: var(--text-secondary);
  font-size: 0.76rem;
  line-height: 1.5;
}

.detail-card dl {
  margin-top: 0.75rem;
}

.detail-card dl > div {
  display: grid;
  grid-template-columns: minmax(90px, 0.65fr) minmax(0, 1.35fr);
  gap: 0.6rem;
  padding: 0.42rem 0;
  border-top: 1px solid var(--border-subtle);
}

.detail-card dt {
  color: var(--text-tertiary);
  font-size: 0.67rem;
}

.detail-card dd {
  color: var(--text-secondary);
  font-size: 0.72rem;
  overflow-wrap: anywhere;
}

.evidence-card small,
.bridge-card small {
  display: block;
  margin-top: 0.55rem;
  color: var(--accent-primary);
  font-size: 0.68rem;
  line-height: 1.5;
}

.limitations-card,
.bridge-card,
.dedupe-card,
.review-section {
  margin-top: 0.75rem;
}

.limitations-card ul,
.dedupe-card ul,
.review-section ul {
  margin: 0.55rem 0 0;
  padding-left: 1.1rem;
}

.limitations-card li,
.dedupe-card li,
.review-section li {
  margin-top: 0.28rem;
  color: var(--text-secondary);
  font-size: 0.73rem;
  line-height: 1.48;
}

.bridge-card {
  border-left: 3px solid var(--success);
}

.start-summary {
  align-items: center;
  margin-top: 0.8rem;
  padding: 0.9rem;
  background: rgba(31, 122, 79, 0.08);
  border: 1px solid color-mix(in srgb, var(--success) 28%, transparent);
  border-radius: var(--radius-md);
}

.start-summary strong {
  color: var(--text-primary);
  font-size: 0.82rem;
}

.primary-button,
.secondary-button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.68rem 0.9rem;
  border-radius: var(--radius-md);
  font-size: 0.79rem;
  font-weight: 850;
  transition: filter 0.18s ease, border-color 0.18s ease;
  touch-action: manipulation;
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

.primary-button:hover,
.secondary-button:hover,
.text-button:hover {
  filter: brightness(1.1);
}

.primary-button:focus-visible,
.secondary-button:focus-visible,
.text-button:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.error-message {
  margin-top: 0.5rem;
  color: var(--danger);
  font-size: 0.76rem;
}

.session-view {
  min-width: 0;
}

.review-status {
  padding: 0.9rem 1rem;
  background: color-mix(in srgb, var(--success) 9%, transparent);
  border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
  border-radius: var(--radius-md);
}

.review-status.exited {
  background: rgba(217, 173, 88, 0.06);
  border-color: rgba(217, 173, 88, 0.24);
}

.source-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.library-limitation {
  margin-top: 0.6rem;
}

.review-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 0.8rem;
}

.review-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.35rem 0.8rem;
  margin-top: 0.8rem;
  padding-top: 0.7rem;
  border-top: 1px solid var(--border-subtle);
  font-family: var(--font-family-mono);
  overflow-wrap: anywhere;
}

@media (max-width: 760px) {
  .library-header,
  .pack-heading,
  .pack-footer,
  .start-summary {
    flex-direction: column;
    align-items: stretch;
  }

  .header-badges {
    align-items: flex-start;
  }

  .detail-grid,
  .condition-grid,
  .review-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .source-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .library-panel {
    padding: 1rem;
  }

  .detail-grid,
  .condition-grid,
  .review-grid,
  .source-grid {
    grid-template-columns: 1fr;
  }

  .review-actions,
  .review-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .primary-button,
  .secondary-button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .primary-button,
  .secondary-button {
    transition: none;
  }
}
</style>
