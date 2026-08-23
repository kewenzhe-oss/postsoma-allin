<template>
  <div class="home-container">
    <LobbyHeader 
      :currentMode="currentMode" 
      @back="currentMode = 'select'" 
      @open-ranges="showRangeViewer = true"
    />

    <div class="lobby-main">
      <transition name="fade-slide" mode="out-in">
        <!-- Layer 1: Decision training first, free play second -->
        <div v-if="currentMode === 'select'" class="home-learning-flow">
          <section class="training-workspace" aria-labelledby="training-path-title">
            <div class="training-path-header">
              <div>
                <span class="section-kicker">Learn · Decide · Review</span>
                <h2 id="training-path-title">Choose a training path</h2>
              </div>
              <p>Preflop range stays first. Pot Odds / EV adds a separate fixed-math decision path.</p>
            </div>

            <div class="training-path-tabs" role="tablist" aria-label="Training type">
              <button
                id="preflop-training-tab"
                type="button"
                role="tab"
                :aria-selected="activeTrainingPath === 'preflop'"
                aria-controls="preflop-training-panel"
                :class="{ active: activeTrainingPath === 'preflop' }"
                @click="activeTrainingPath = 'preflop'"
              >
                <span>Preflop Range</span>
                <small>范围倾向 · 10 hands</small>
              </button>
              <button
                id="pot-odds-training-tab"
                type="button"
                role="tab"
                :aria-selected="activeTrainingPath === 'pot-odds'"
                aria-controls="pot-odds-training-panel"
                :class="{ active: activeTrainingPath === 'pot-odds' }"
                @click="activeTrainingPath = 'pot-odds'"
              >
                <span>Pot Odds / EV</span>
                <small>固定数学 · Fold / Call</small>
              </button>
            </div>

            <TodaysDecision
              v-show="activeTrainingPath === 'preflop'"
              id="preflop-training-panel"
              role="tabpanel"
              aria-labelledby="preflop-training-tab"
              @open-ranges="showRangeViewer = true"
              @apply-mode="handleTrainingApply"
            />
            <PotOddsDecision
              v-show="activeTrainingPath === 'pot-odds'"
              id="pot-odds-training-panel"
              role="tabpanel"
              aria-labelledby="pot-odds-training-tab"
              @apply-mode="handleTrainingApply"
            />
          </section>

          <section class="playground-section" aria-labelledby="playground-title">
            <div class="playground-heading">
              <div>
                <span class="section-kicker">Apply · Playground · 自由对局</span>
                <h2 id="playground-title">Put the idea into play</h2>
              </div>
              <p>
                After a short drill, apply the concept at a private table or experiment with a BYOK AI opponent. These free-play modes do not provide verified training scores.
              </p>
            </div>

            <ModeSelector @select-mode="handleModeSelection" />
          </section>
        </div>

        <!-- Layer 2A: Human vs Human -->
        <div v-else class="match-mode-flow">
          <aside
            v-if="trainingSourceContext"
            class="training-context-banner"
            aria-label="Training source context"
          >
            <span>From training · 来自训练</span>
            <strong>{{ trainingSourceContext.title }}</strong>
            <p>{{ trainingSourceContext.detail }}</p>
            <small>
              This label is temporary lobby UI only. It is not sent in room, join, WebSocket, or AI payloads.
            </small>
          </aside>

          <!-- Layer 2A: Human vs Human -->
          <HumanMatchPanel v-if="currentMode === 'hvh'" />

          <!-- Layer 2B: Human vs AI -->
          <AIMatchPanel v-else />
        </div>
      </transition>
    </div>

    <!-- Teleportable Tactical Tool Modal -->
    <RangeViewerModal
      v-model="showRangeViewer"
      @select-training="handleGuideTrainingSelection"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LobbyHeader from '@/components/lobby/LobbyHeader.vue'
import ModeSelector from '@/components/lobby/ModeSelector.vue'
import HumanMatchPanel from '@/components/lobby/HumanMatchPanel.vue'
import AIMatchPanel from '@/components/lobby/AIMatchPanel.vue'
import TodaysDecision from '@/components/lobby/TodaysDecision.vue'
import PotOddsDecision from '@/components/lobby/PotOddsDecision.vue'
import RangeViewerModal from '@/components/tools/RangeViewerModal.vue'

const showRangeViewer = ref(false)
const activeTrainingPath = ref('preflop')

const TRAINING_SOURCE_CONTEXTS = Object.freeze({
  preflop_range: Object.freeze({
    title: 'Preflop Range · 把翻前范围带入一对一对局',
    detail: 'Apply baseline tendencies in free play; the table result does not rescore the completed drill.'
  }),
  pot_odds_ev: Object.freeze({
    title: 'Pot Odds / EV · 在动态局面中识别价格与风险',
    detail: 'Practice noticing price and uncertainty; live outcomes do not replace the fixed pot-odds-v1 feedback.'
  })
})

const route = useRoute()
const router = useRouter()

watch(() => route.query.training, (training) => {
  if (training === 'preflop' || training === 'pot-odds') {
    activeTrainingPath.value = training
  }
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
  return typeof source === 'string' ? TRAINING_SOURCE_CONTEXTS[source] || null : null
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

const handleGuideTrainingSelection = (training) => {
  if (training !== 'preflop' && training !== 'pot-odds') return
  activeTrainingPath.value = training
  showRangeViewer.value = false
}
</script>

<style scoped>
.home-container {
  width: 100%;
  margin: 0 auto;
  padding: clamp(1.25rem, 2.5vw, 2rem) clamp(1.25rem, 4vw, 3.5rem) clamp(1.25rem, 4vw, 3.5rem);
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

.training-workspace {
  width: 100%;
  max-width: 1040px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.training-path-header {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  align-items: end;
  gap: clamp(1rem, 4vw, 3rem);
}

.training-path-header h2 {
  margin-top: 0.3rem;
  color: var(--text-primary);
  font-size: clamp(1.25rem, 3vw, 1.65rem);
  font-weight: 850;
}

.training-path-header p {
  color: var(--text-secondary);
  font-size: 0.86rem;
  line-height: 1.55;
}

.training-path-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  max-width: 680px;
}

.training-path-tabs button {
  min-height: 58px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 0.65rem 0.9rem;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 850;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
  touch-action: manipulation;
}

.training-path-tabs button small {
  margin-top: 0.12rem;
  color: var(--text-tertiary);
  font-size: 0.68rem;
}

.training-path-tabs button:hover {
  transform: translateY(-2px);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

.training-path-tabs button.active {
  color: var(--text-inverse);
  background: linear-gradient(180deg, var(--accent-primary-strong), var(--accent-primary));
  border-color: var(--accent-primary-strong);
  box-shadow: 0 8px 20px rgba(217, 173, 88, 0.11);
}

.training-path-tabs button.active small {
  color: rgba(16, 11, 10, 0.7);
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
  .training-path-header,
  .playground-heading {
    grid-template-columns: 1fr;
    align-items: start;
  }
}

@media (max-width: 520px) {
  .training-path-tabs {
    grid-template-columns: 1fr;
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

  .training-path-tabs button {
    transition: none;
  }

  .training-path-tabs button:hover {
    transform: none;
  }
}
</style>
