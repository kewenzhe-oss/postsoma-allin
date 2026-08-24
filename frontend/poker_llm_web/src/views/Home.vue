<template>
  <div class="home-container">
    <LobbyHeader 
      :currentMode="currentMode" 
      @back="currentMode = 'select'" 
      @open-ranges="openGuideSection('start')"
    />

    <div class="lobby-main">
      <transition name="fade-slide" mode="out-in">
        <!-- Layer 1: Decision training first, free play second -->
        <div v-if="currentMode === 'select'" class="home-learning-flow">
          <DecisionFrameworkIntro />

          <section ref="toolsSection" class="tools-section" aria-labelledby="tools-title">
            <div class="tools-heading">
              <div>
                <span class="section-kicker">{{ copy.tools.kicker }}</span>
                <h2 id="tools-title">{{ copy.tools.title }}</h2>
              </div>
              <p>{{ copy.tools.intro }}</p>
            </div>

            <div class="tool-grid">
              <article class="tool-card">
                <div class="tool-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                  </svg>
                </div>
                <span class="tool-question">{{ copy.tools.rangeQuestion }}</span>
                <h3>{{ copy.tools.rangeTitle }}</h3>
                <p>{{ copy.tools.rangeDetail }}</p>
                <button type="button" @click="openGuideSection('reference')">
                  {{ copy.tools.rangeCta }}
                </button>
              </article>

              <article class="tool-card">
                <div class="tool-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
                    <path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2" />
                  </svg>
                </div>
                <span class="tool-question">{{ copy.tools.priceQuestion }}</span>
                <h3>{{ copy.tools.priceTitle }}</h3>
                <p>{{ copy.tools.priceDetail }}</p>
                <button type="button" @click="openTrainingWorkspace('pot-odds')">
                  {{ copy.tools.priceCta }}
                </button>
              </article>

              <article class="tool-card">
                <div class="tool-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                  </svg>
                </div>
                <span class="tool-question">{{ copy.tools.explorerQuestion }}</span>
                <h3>{{ copy.tools.explorerTitle }}</h3>
                <p>{{ copy.tools.explorerDetail }}</p>
                <button type="button" @click="openGuideSection('explorer')">
                  {{ copy.tools.explorerCta }}
                </button>
              </article>
            </div>

            <section
              v-show="activeTrainingPath"
              ref="toolWorkspace"
              class="tool-workspace"
              aria-labelledby="active-tool-title"
            >
              <header class="tool-workspace-header">
                <div>
                  <span class="section-kicker">{{ copy.tools.workspaceKicker }}</span>
                  <h3 id="active-tool-title" ref="activeToolHeading" tabindex="-1">
                    {{ activeToolCopy.title }}
                  </h3>
                  <p>{{ activeToolCopy.detail }}</p>
                </div>
                <button type="button" class="close-workspace" @click="closeTrainingWorkspace">
                  {{ copy.tools.close }}
                </button>
              </header>

              <TodaysDecision
                v-show="activeTrainingPath === 'preflop'"
                @open-ranges="openGuideSection('reference')"
                @apply-mode="handleTrainingApply"
              />
              <PotOddsDecision
                v-show="activeTrainingPath === 'pot-odds'"
                @apply-mode="handleTrainingApply"
              />
            </section>
          </section>

          <section class="trust-section" aria-labelledby="trust-title">
            <details>
              <summary>
                <span>
                  <h2 id="trust-title">{{ copy.trust.title }}</h2>
                  <small>{{ copy.trust.intro }}</small>
                </span>
                <span class="summary-action">{{ copy.trust.action }}</span>
              </summary>

              <div class="trust-grid">
                <article>
                  <span>{{ copy.trust.rangeLabel }}</span>
                  <h3>{{ rangeId }} · {{ rangeVersion }}</h3>
                  <p>{{ copy.trust.rangeDetail }}</p>
                </article>
                <article>
                  <span>{{ copy.trust.priceLabel }}</span>
                  <h3>{{ potOddsVersion }} · {{ copy.trust.fixedMath }}</h3>
                  <p>{{ copy.trust.priceDetail }}</p>
                </article>
                <article>
                  <span>{{ copy.trust.evidenceLabel }}</span>
                  <h3>{{ copy.trust.evidenceFormula }}</h3>
                  <p>{{ copy.trust.evidenceDetail }}</p>
                </article>
                <article>
                  <span>{{ copy.trust.freePlayLabel }}</span>
                  <h3>{{ copy.trust.freePlayTitle }}</h3>
                  <p>{{ copy.trust.freePlayDetail }}</p>
                </article>
              </div>
            </details>
          </section>

          <section class="playground-section" aria-labelledby="playground-title">
            <div class="playground-heading">
              <div>
                <span class="section-kicker">{{ copy.apply.kicker }}</span>
                <h2 id="playground-title">{{ copy.apply.title }}</h2>
              </div>
              <p>{{ copy.apply.intro }}</p>
            </div>

            <ModeSelector @select-mode="handleModeSelection" />
          </section>
        </div>

        <!-- Layer 2A: Human vs Human -->
        <div v-else class="match-mode-flow">
          <aside
            v-if="trainingSourceContext"
            class="training-context-banner"
            :aria-label="copy.sourceContextAria"
          >
            <span>{{ copy.sourceContextLabel }}</span>
            <strong>{{ trainingSourceContext.title }}</strong>
            <p>{{ trainingSourceContext.detail }}</p>
            <small>
              {{ copy.sourceContextBoundary }}
            </small>
          </aside>

          <!-- Layer 2A: Human vs Human -->
          <HumanMatchPanel v-if="currentMode === 'hvh'" />

          <!-- Layer 2B: Human vs AI -->
          <AIMatchPanel v-else />
        </div>
      </transition>
    </div>

    <SiteFooter v-if="currentMode === 'select'" />

    <!-- Teleportable Tactical Tool Modal -->
    <RangeViewerModal
      v-model="showRangeViewer"
      :entry-section="guideEntrySection"
      @select-training="handleGuideTrainingSelection"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LobbyHeader from '@/components/lobby/LobbyHeader.vue'
import DecisionFrameworkIntro from '@/components/lobby/DecisionFrameworkIntro.vue'
import ModeSelector from '@/components/lobby/ModeSelector.vue'
import HumanMatchPanel from '@/components/lobby/HumanMatchPanel.vue'
import AIMatchPanel from '@/components/lobby/AIMatchPanel.vue'
import TodaysDecision from '@/components/lobby/TodaysDecision.vue'
import PotOddsDecision from '@/components/lobby/PotOddsDecision.vue'
import RangeViewerModal from '@/components/tools/RangeViewerModal.vue'
import SiteFooter from '@/components/common/SiteFooter.vue'
import {
  HU_BTN_RFI_RANGE_ID,
  HU_BTN_RFI_RANGE_VERSION
} from '@/training/ranges/hu-btn-rfi-100bb-v1.js'
import { POT_ODDS_DRILL_VERSION } from '@/training/drills/pot-odds-v1.js'
import { isZh } from '@/i18n/locale.js'

const showRangeViewer = ref(false)
const guideEntrySection = ref('start')
const activeTrainingPath = ref(null)
const toolsSection = ref(null)
const toolWorkspace = ref(null)
const activeToolHeading = ref(null)
const TRAINING_PATHS = Object.freeze(['preflop', 'pot-odds'])
const GUIDE_ENTRY_SECTIONS = Object.freeze(['start', 'reference', 'explorer'])
const rangeId = HU_BTN_RFI_RANGE_ID
const rangeVersion = HU_BTN_RFI_RANGE_VERSION
const potOddsVersion = POT_ODDS_DRILL_VERSION

const HOME_COPY = Object.freeze({
  en: Object.freeze({
    tools: Object.freeze({
      kicker: 'TOOLS · CLARIFY ONE QUESTION',
      title: 'Open the tool that answers your next question',
      intro: 'The five-question flow stays primary. Use a tool when you need to inspect Range, Price, Hand, or Risk more closely.',
      rangeQuestion: 'Range · What could we each have?',
      rangeTitle: 'Range reference',
      rangeDetail: 'Inspect the fixed HU reference, its frequencies, version, and limits.',
      rangeCta: 'View range reference',
      priceQuestion: 'Price · What does this price require?',
      priceTitle: 'Price Builder',
      priceDetail: 'Build the final pot and required-equity threshold before comparing a stated exercise assumption.',
      priceCta: 'Open Price Builder',
      explorerQuestion: 'Hand + Risk · What information is missing?',
      explorerTitle: 'Hand Explorer',
      explorerDetail: 'Study a hand, board, draw-hit probability, price, and uncertainty without a strategy verdict.',
      explorerCta: 'Open Explorer',
      workspaceKicker: 'FOCUSED TOOL',
      close: 'Close tool'
    }),
    trust: Object.freeze({
      title: 'Why trust this?',
      intro: 'See what is math, what is a reference, and what remains uncertain.',
      action: 'View limits',
      rangeLabel: 'Range reference',
      rangeDetail: 'Fixed and versioned for Heads-up · SB/Button · 100 BB · Unopened · Open 2.5 BB. It is an internal reference, not solver output or a universal strategy.',
      priceLabel: 'Price assumptions',
      fixedMath: 'fixed math',
      priceDetail: 'Pot and threshold formulas are mathematical facts. Hero equity is a stated exercise assumption, not range-based equity calculated by the app.',
      evidenceLabel: 'Evidence boundaries',
      evidenceFormula: 'Fact ≠ reference ≠ outcome',
      evidenceDetail: 'Math facts, strategy references, explanations, and single-hand outcomes answer different questions and must not overwrite one another.',
      freePlayLabel: 'Free play',
      freePlayTitle: 'No verified training score',
      freePlayDetail: 'Friends, AI opinions, and one runout help you apply the five questions. They do not become training truth, and AI is not the training judge.'
    }),
    apply: Object.freeze({
      kicker: 'APPLY · TAKE THE FIVE QUESTIONS TO THE TABLE',
      title: 'Use the process in free play',
      intro: 'Play privately with a friend or experiment with your BYOK AI. These modes are for application and discussion: no verified training score, and AI is not the training judge.'
    }),
    sourceContextAria: 'Training source context',
    sourceContextLabel: 'From training',
    sourceContextBoundary: 'This label is temporary lobby UI only. It is not sent in room, join, WebSocket, or AI payloads.'
  }),
  zh: Object.freeze({
    tools: Object.freeze({
      kicker: '工具 · 看清一个问题',
      title: '按需打开能回答当前问题的工具',
      intro: '五问流程始终是主线。需要深入观察范围、价格、手牌或风险时，再打开对应工具。',
      rangeQuestion: '手牌范围（Range）：我与对手可能有什么？',
      rangeTitle: '范围参考',
      rangeDetail: '查看固定 HU 范围参考的频率、版本与适用边界。',
      rangeCta: '查看范围参考',
      priceQuestion: '价格（Price）：这个价格要求什么？',
      priceTitle: '价格计算',
      priceDetail: '先建立最终底池和最低所需权益，再比较题目给定的权益假设。',
      priceCta: '打开价格计算',
      explorerQuestion: '手牌与风险：还缺哪些信息？',
      explorerTitle: '牌局观察',
      explorerDetail: '观察具体手牌、牌面、听牌命中概率、价格与不确定性，不输出策略裁决。',
      explorerCta: '打开自由实验台',
      workspaceKicker: '当前工具',
      close: '收起工具'
    }),
    trust: Object.freeze({
      title: '训练依据',
      intro: '了解哪些是数学事实、哪些是参考，以及哪些信息仍不确定。',
      action: '查看边界',
      rangeLabel: '范围参考',
      rangeDetail: '固定并版本化，适用于 Heads-up · SB/Button · 100 BB · Unopened · Open 2.5 BB。它是内部参考，不是 solver 输出或通用策略。',
      priceLabel: '价格假设',
      fixedMath: '固定数学',
      priceDetail: '底池和门槛公式是数学事实。Hero 权益是题设假设，不是应用根据对手范围计算出的真实权益。',
      evidenceLabel: '依据边界',
      evidenceFormula: '事实 ≠ 参考 ≠ 结果',
      evidenceDetail: '数学事实、策略参考、教学解释与单手结果回答不同问题，不能相互覆盖。',
      freePlayLabel: '自由对局',
      freePlayTitle: '不提供已验证的训练评分',
      freePlayDetail: '朋友、AI 意见和一次发牌结果可以帮助你应用五问，但不会成为训练真值；AI 不是训练裁判。'
    }),
    apply: Object.freeze({
      kicker: '应用 · 把五问带进牌局',
      title: '在自由对局中应用思考流程',
      intro: '和朋友进行私人对局，或使用自己的 AI 自由实验。这些模式用于应用与讨论，不提供已验证的训练评分；AI 不是训练裁判。'
    }),
    sourceContextAria: '训练来源信息',
    sourceContextLabel: '来自训练',
    sourceContextBoundary: '这只是大厅中的临时来源提示，不会写入房间、加入请求、WebSocket 或 AI payload。'
  })
})

const copy = computed(() => HOME_COPY[isZh.value ? 'zh' : 'en'])

const activeToolCopy = computed(() => ({
  preflop: {
    title: isZh.value ? 'HU 范围参考练习' : 'HU range reference practice',
    detail: isZh.value
      ? '仅在标明场景下使用固定 baseline-v1 参考的本地练习。'
      : 'A local exercise using the fixed baseline-v1 reference for its one stated scenario.'
  },
  'pot-odds': {
    title: isZh.value ? '价格计算' : 'Price Builder',
    detail: isZh.value
      ? '使用固定数学输入；Hero 权益会在后续作为题设假设揭示。'
      : 'Fixed math inputs; Hero equity is revealed later as a stated exercise assumption.'
  }
})[activeTrainingPath.value] || { title: '', detail: '' })

const focusTrainingWorkspace = () => {
  nextTick(() => {
    toolWorkspace.value?.scrollIntoView({ block: 'start' })
    activeToolHeading.value?.focus({ preventScroll: true })
  })
}

const openTrainingWorkspace = (path, { focus = true } = {}) => {
  if (!TRAINING_PATHS.includes(path)) return
  activeTrainingPath.value = path
  if (focus) focusTrainingWorkspace()
}

const openGuideSection = (section) => {
  guideEntrySection.value = GUIDE_ENTRY_SECTIONS.includes(section) ? section : 'start'
  showRangeViewer.value = true
}

const TRAINING_SOURCE_CONTEXTS = Object.freeze({
  preflop_range: Object.freeze({
    en: Object.freeze({
      title: 'Take the preflop range reference into heads-up play',
      detail: 'Apply baseline tendencies in free play; the table result does not rescore the completed exercise.'
    }),
    zh: Object.freeze({
      title: '把翻前范围参考带入一对一对局',
      detail: '在自由对局中应用 baseline 倾向；牌桌结果不会重新评分已经完成的练习。'
    })
  }),
  pot_odds_ev: Object.freeze({
    en: Object.freeze({
      title: 'Recognize price and risk in a dynamic spot',
      detail: 'Practice noticing price and uncertainty; live outcomes do not replace the fixed pot-odds-v1 feedback.'
    }),
    zh: Object.freeze({
      title: '在动态局面中识别价格与风险',
      detail: '练习识别价格与不确定性；实时结果不会取代固定 pot-odds-v1 反馈。'
    })
  })
})

const route = useRoute()
const router = useRouter()

watch([() => route.query.mode, () => route.query.training], ([mode, training]) => {
  if (mode === 'hvh' || mode === 'hva') {
    activeTrainingPath.value = null
    return
  }

  if (TRAINING_PATHS.includes(training)) {
    openTrainingWorkspace(training)
    return
  }

  activeTrainingPath.value = null
}, { immediate: true })

const currentMode = computed({
  get: () => {
    const mode = route.query.mode
    return mode === 'hvh' || mode === 'hva' ? mode : 'select'
  },
  set: (mode) => {
    if (mode === 'select') {
      router.push({ name: 'Home' })
    } else {
      router.push({ name: 'Home', query: { mode } })
    }
  }
})

const trainingSourceContext = computed(() => {
  if (currentMode.value === 'select') return null
  const source = route.query.from
  const sourceCopy = typeof source === 'string' ? TRAINING_SOURCE_CONTEXTS[source] : null
  return sourceCopy ? sourceCopy[isZh.value ? 'zh' : 'en'] : null
})

const handleModeSelection = (mode) => {
  currentMode.value = mode
}

const handleTrainingApply = ({ mode, source } = {}) => {
  if (mode !== 'hvh' && mode !== 'hva') return
  if (!Object.prototype.hasOwnProperty.call(TRAINING_SOURCE_CONTEXTS, source)) {
    handleModeSelection(mode)
    return
  }

  router.push({
    name: 'Home',
    query: { mode, from: source }
  })
}

const closeTrainingWorkspace = () => {
  activeTrainingPath.value = null
  if (!Object.prototype.hasOwnProperty.call(route.query, 'training')) return
  const query = { ...route.query }
  delete query.training
  router.replace({ name: 'Home', query })
  nextTick(() => toolsSection.value?.focus?.())
}

const handleGuideTrainingSelection = (training) => {
  if (!TRAINING_PATHS.includes(training)) return
  showRangeViewer.value = false
  openTrainingWorkspace(training, { focus: false })
  nextTick(() => nextTick(() => focusTrainingWorkspace()))
}
</script>

<style scoped>
.home-container {
  width: 100%;
  margin: 0 auto;
  padding: clamp(1.25rem, 2.5vw, 2rem) clamp(1.25rem, 4vw, 3.5rem) clamp(1.25rem, 4vw, 3.5rem);
  padding-top: max(5.25rem, calc(env(safe-area-inset-top) + 4.25rem));
  font-family: var(--font-family);
  background:
    radial-gradient(circle at 50% 18%, rgba(15, 74, 50, 0.56), transparent 28rem),
    radial-gradient(circle at 16% 18%, rgba(101, 28, 32, 0.26), transparent 22rem),
    radial-gradient(circle at 84% 18%, rgba(217, 173, 88, 0.14), transparent 22rem),
    linear-gradient(180deg, rgba(0, 0, 0, 0.38), transparent 42%),
    var(--bg-app);
  color: var(--text-primary);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: clip;
  position: relative;
}

.home-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(217, 173, 88, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(217, 173, 88, 0.022) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(circle at 50% 16%, black, transparent 78%);
  pointer-events: none;
}

.lobby-main {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  z-index: 1;
}

.home-learning-flow {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(2.5rem, 7vw, 5rem);
}

.match-mode-flow {
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.training-context-banner {
  width: 100%;
  padding: 0.9rem 1rem;
  background: rgba(217, 173, 88, 0.06);
  border: 1px solid rgba(217, 173, 88, 0.22);
  border-left: 3px solid var(--accent-primary);
  border-radius: var(--radius-md);
}

.training-context-banner span,
.training-context-banner small {
  display: block;
  color: var(--text-tertiary);
  font-size: 0.66rem;
}

.training-context-banner span {
  color: var(--accent-primary);
  font-weight: 850;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.training-context-banner strong {
  display: block;
  margin-top: 0.3rem;
  color: var(--text-primary);
  font-size: 0.92rem;
}

.training-context-banner p {
  margin-top: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.78rem;
  line-height: 1.5;
}

.training-context-banner small {
  margin-top: 0.42rem;
  line-height: 1.45;
}

.tools-section {
  width: 100%;
  max-width: 1040px;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.tools-heading {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  align-items: end;
  gap: clamp(1rem, 4vw, 3rem);
}

.tools-heading h2 {
  margin-top: 0.3rem;
  color: var(--text-primary);
  font-size: clamp(1.25rem, 3vw, 1.65rem);
  font-weight: 850;
}

.tools-heading p {
  color: var(--text-secondary);
  font-size: 0.86rem;
  line-height: 1.55;
}

.tools-heading p span {
  display: block;
  margin-top: 0.2rem;
  color: var(--text-tertiary);
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}

.tool-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1rem;
  background:
    linear-gradient(145deg, rgba(217, 173, 88, 0.055), transparent 52%),
    rgba(255, 255, 255, 0.025);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.tool-icon {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-primary-strong);
  background: rgba(217, 173, 88, 0.07);
  border: 1px solid rgba(217, 173, 88, 0.2);
  border-radius: 12px;
}

.tool-icon svg {
  width: 21px;
  height: 21px;
}

.tool-question {
  margin-top: 0.85rem;
  color: var(--accent-primary);
  font-size: 0.68rem;
  font-weight: 850;
}

.tool-card h3 {
  margin-top: 0.3rem;
  color: var(--text-primary);
  font-size: 1.05rem;
  font-weight: 850;
}

.tool-card p {
  margin-top: 0.45rem;
  color: var(--text-tertiary);
  font-size: 0.76rem;
  line-height: 1.55;
}

.tool-card button,
.close-workspace {
  min-height: 44px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font: inherit;
  font-size: 0.76rem;
  font-weight: 850;
  transition: transform 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.tool-card button {
  width: 100%;
  margin-top: auto;
  padding: 0.68rem 0.8rem;
  text-align: left;
}

.tool-card p + button {
  margin-top: 1rem;
}

.tool-card button:hover,
.close-workspace:hover {
  transform: translateY(-2px);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.tool-card button:focus-visible,
.close-workspace:focus-visible,
.tool-workspace-header h3:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 3px;
}

.tool-workspace {
  scroll-margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.tool-workspace-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.tool-workspace-header h3 {
  margin-top: 0.3rem;
  color: var(--text-primary);
  font-size: clamp(1.1rem, 2.5vw, 1.4rem);
}

.tool-workspace-header h3:focus {
  outline: none;
}

.tool-workspace-header p {
  margin-top: 0.3rem;
  color: var(--text-tertiary);
  font-size: 0.78rem;
  line-height: 1.5;
}

.close-workspace {
  flex-shrink: 0;
  padding: 0.55rem 0.8rem;
}

.trust-section {
  width: 100%;
  max-width: 920px;
}

.trust-section details {
  overflow: clip;
  background: rgba(255, 255, 255, 0.022);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.trust-section summary {
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 1rem;
  cursor: pointer;
  list-style: none;
  color: var(--text-secondary);
}

.trust-section summary::-webkit-details-marker {
  display: none;
}

.trust-section summary > span:first-child {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.trust-section summary h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 0.92rem;
  font-weight: 850;
}

.trust-section summary small,
.summary-action {
  color: var(--text-tertiary);
  font-size: 0.7rem;
  line-height: 1.45;
}

.summary-action {
  flex-shrink: 0;
  color: var(--accent-primary-strong);
  font-weight: 800;
}

.trust-section summary:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: -3px;
}

.trust-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  padding: 0 1rem 1rem;
}

.trust-grid article {
  min-width: 0;
  padding: 0.8rem 0.85rem;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.trust-grid article > span {
  color: var(--accent-primary);
  font-size: 0.66rem;
  font-weight: 850;
}

.trust-grid h3 {
  margin-top: 0.3rem;
  color: var(--text-primary);
  font-family: var(--font-family-mono);
  font-size: 0.78rem;
  overflow-wrap: anywhere;
}

.trust-grid p {
  margin-top: 0.38rem;
  color: var(--text-tertiary);
  font-size: 0.72rem;
  line-height: 1.55;
}

.playground-section {
  width: 100%;
  max-width: 920px;
  padding-bottom: clamp(1rem, 3vw, 2rem);
}

.playground-heading {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  align-items: end;
  gap: clamp(1rem, 4vw, 3rem);
  margin-bottom: 1.2rem;
}

.section-kicker {
  color: var(--accent-primary);
  font-size: var(--font-size-meta);
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.playground-heading h2 {
  margin-top: 0.3rem;
  color: var(--text-primary);
  font-size: clamp(1.35rem, 3vw, 1.85rem);
  font-weight: 850;
}

.playground-heading p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.55;
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

@media (max-width: 700px) {
  .tools-heading,
  .playground-heading {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .tool-grid {
    grid-template-columns: 1fr;
  }

  .trust-grid {
    grid-template-columns: 1fr;
  }

  .tool-workspace-header {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 520px) {
  .tool-card,
  .tool-workspace {
    min-width: 0;
  }

  .trust-section summary {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: none;
  }

  .fade-slide-enter-from,
  .fade-slide-leave-to {
    transform: none;
  }

  .tool-card button,
  .close-workspace {
    transition: none;
  }

  .tool-card button:hover,
  .close-workspace:hover {
    transform: none;
  }
}
</style>
