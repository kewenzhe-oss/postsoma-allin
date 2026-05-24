<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="gto-modal-overlay" @click.self="closeModal">
        <div class="gto-modal-content animate-scaleIn">
          <!-- Close Button -->
          <button class="gto-close-btn" @click="closeModal" aria-label="Close modal">
            <span class="close-icon">&times;</span>
          </button>

          <!-- Header -->
          <div class="gto-modal-header">
            <div class="gto-title-badge">POSTSOMA · TACTICAL HANDBOOK</div>
            <div class="gto-title-row">
              <h2 class="gto-modal-title">1v1 Tactical Handbook</h2>
              <!-- Collapsible Guide Microcopy Badge -->
              <button 
                class="gto-guide-badge" 
                @click="showGuide = !showGuide"
                :class="{ active: showGuide }"
              >
                <span class="badge-icon">❓</span> Guide
              </button>
            </div>
            <p class="gto-modal-desc">
              100BB Heads-Up GTO Preflop & Postflop Math Guide.
            </p>

            <!-- Guide Popover Dropdown -->
            <Transition name="fade-slide-fast">
              <div v-if="showGuide" class="gto-guide-dropdown">
                <span class="guide-title">Preflop Matrix Quick Guide</span>
                <div class="guide-grid">
                  <div class="guide-column">
                    <p>• <strong>Pairs</strong> (e.g., AA, KK) lie on the diagonal.</p>
                    <p>• <strong>Suited hands</strong> ending with 's' (e.g., AKs) lie in the top-right triangle.</p>
                    <p>• <strong>Offsuit hands</strong> ending with 'o' (e.g., AKo) lie in the bottom-left triangle.</p>
                  </div>
                  <div class="guide-column">
                    <p>• <span class="guide-color raise-dot"></span> <strong>Red (Raise):</strong> Take the aggressive line.</p>
                    <p>• <span class="guide-color call-dot"></span> <strong>Green (Call/Limp):</strong> Take the defensive line.</p>
                    <p>• <span class="guide-color fold-dot"></span> <strong>Black (Fold):</strong> Save your stack.</p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Secondary Tab Selector -->
          <div class="gto-tabs">
            <button 
              class="gto-tab-btn" 
              :class="{ active: activeTab === 'range' }" 
              @click="activeTab = 'range'"
            >
              🎯 Preflop Ranges
            </button>
            <button 
              class="gto-tab-btn" 
              :class="{ active: activeTab === 'math' }" 
              @click="activeTab = 'math'"
            >
              📊 Matchday Math
            </button>
          </div>

          <!-- TAB 1: PREFLOP MATRIX -->
          <div v-if="activeTab === 'range'" class="gto-tab-content animate-fadeIn">
            <!-- Spot selector -->
            <div class="gto-spot-selector">
              <button 
                class="spot-tab" 
                :class="{ active: currentSpot === 'sb_open' }"
                @click="currentSpot = 'sb_open'"
              >
                <span class="spot-role sb">SB (Button)</span>
                <span class="spot-action">Open-Raise / RFI</span>
              </button>
              <button 
                class="spot-tab" 
                :class="{ active: currentSpot === 'bb_def' }"
                @click="currentSpot = 'bb_def'"
              >
                <span class="spot-role bb">BB (Big Blind)</span>
                <span class="spot-action">Defend vs SB Open (2.5x)</span>
              </button>
            </div>

            <!-- Single-Core layout (Matrix居中独占，Legend移至底部横向排布) -->
            <div class="gto-main-layout">
              <div class="gto-matrix-container">
                <div class="gto-hand-matrix">
                  <div 
                    v-for="combo in combos" 
                    :key="combo"
                    class="gto-matrix-cell"
                    :class="[getComboTypeClass(combo), { active: hoveredCombo === combo }]"
                    :style="{ background: getCellBg(combo) }"
                    @pointerenter="hoveredCombo = combo"
                    @click="hoveredCombo = combo"
                  >
                    <span class="combo-label">{{ combo }}</span>
                  </div>
                </div>
              </div>

              <!-- Polished Compact Horizontal Legend -->
              <div class="gto-horizontal-legend">
                <div class="legend-item">
                  <span class="legend-color raise"></span>
                  <span class="legend-label">Raise: <strong>{{ getActionStats.raise }}%</strong></span>
                </div>
                <div class="legend-item">
                  <span class="legend-color call"></span>
                  <span class="legend-label">Call/Limp: <strong>{{ getActionStats.call }}%</strong></span>
                </div>
                <div class="legend-item">
                  <span class="legend-color fold"></span>
                  <span class="legend-label">Fold: <strong>{{ getActionStats.fold }}%</strong></span>
                </div>
              </div>
            </div>

            <!-- Bottom description panel (Progressive Disclosure) -->
            <div class="gto-bottom-details">
              <transition name="fade" mode="out-in">
                <div :key="hoveredCombo || 'none'" class="details-content">
                  <template v-if="hoveredCombo">
                    <div class="details-main-info">
                      <span class="details-combo" :class="getComboTypeClass(hoveredCombo)">{{ hoveredCombo }}</span>
                      <span class="details-combo-desc">({{ getComboFullTypeName(hoveredCombo) }})</span>
                    </div>
                    <div class="details-weights">
                      <div class="weight-pill raise">Raise: {{ getComboWeights(hoveredCombo)[0] }}%</div>
                      <div class="weight-pill call" v-if="getComboWeights(hoveredCombo)[1] > 0">Call/Limp: {{ getComboWeights(hoveredCombo)[1] }}%</div>
                      <div class="weight-pill fold" v-if="getComboWeights(hoveredCombo)[2] > 0">Fold: {{ getComboWeights(hoveredCombo)[2] }}%</div>
                    </div>
                    <div class="details-tip">
                      <span class="tip-label">COACH INSIGHT:</span> {{ getComboAdvice(hoveredCombo) }}
                    </div>
                  </template>
                  <template v-else>
                    <div class="details-empty-placeholder">
                      👉 Hover or tap any cell in the matrix to view GTO coaching action weights & real-time tactical advice.
                    </div>
                  </template>
                </div>
              </transition>
            </div>
          </div>

          <!-- TAB 2: MATCHDAY MATH (2:1 Asymmetric Console Layout) -->
          <div v-else class="math-cheat-sheet animate-fadeIn">
            <div class="math-card-grid">
              <!-- Left Column: Decision Console (Formula + worked example + rules in one cohesive card) -->
              <div class="math-card console-card">
                <div class="math-card-header">
                  <span class="math-card-icon">🎛️</span>
                  <div class="math-card-header-text">
                    <h3>Call Decision Console</h3>
                    <p class="math-card-desc">Verify if calling postflop bet size is mathematically profitable in the long run.</p>
                  </div>
                </div>

                <div class="math-console-inner">
                  <!-- Formula -->
                  <div class="math-formula-box">
                    <div class="formula-line">
                      Pot Odds = <span class="term-text risk">Risk</span> / (<span class="term-text risk">Risk</span> + <span class="term-text reward">Reward</span>)
                    </div>
                    <div class="formula-terms">
                      <p><span class="term-color-dot risk"></span> <strong>Risk</strong> = Chips to Call.</p>
                      <p><span class="term-color-dot reward"></span> <strong>Reward</strong> = Chips currently in pot (Pot + Bet).</p>
                    </div>
                  </div>

                  <!-- Worked Example -->
                  <div class="math-example-box">
                    <span class="example-title">💡 WORKED EXAMPLE (Standard 1v1 Spot)</span>
                    <div class="example-body">
                      • <strong>Pot:</strong> $90 chips | <strong>Opponent's Bet:</strong> $45 chips <br/>
                      • <strong>Your Risk to Call:</strong> $45 | <strong>Total Reward:</strong> $135 <span class="subtext">($90 + $45)</span> <br/>
                      • <strong>The Math:</strong> $45 / ($45 + $135) = $45 / $180 = <strong>25.0% Pot Odds</strong>
                    </div>
                  </div>

                  <!-- The Rules -->
                  <div class="decision-rules-box">
                    <div class="rule-item call">
                      <span class="rule-formula">Success % &ge; Required Equity</span>
                      <span class="rule-decision text-success">👉 Profitable CALL</span>
                    </div>
                    <div class="rule-item fold">
                      <span class="rule-formula">Success % &lt; Required Equity</span>
                      <span class="rule-decision text-danger">👉 Profitable FOLD</span>
                    </div>
                  </div>
                </div>

                <div class="math-coach-tip">
                  <span class="tip-title">⚡ TACTICAL GOLDEN RULE:</span>
                  Required Equity is simply your Pot Odds converted into a percentage. If your actual win chance (e.g. 35% Flush Draw) is higher than the minimum win chance required (e.g. 25%), calling is mathematically guaranteed to print money in the long run!
                </div>
              </div>

              <!-- Right Column: Draw Odds reference sheet -->
              <div class="math-card odds-card">
                <div class="math-card-header">
                  <span class="math-card-icon">🎯</span>
                  <div class="math-card-header-text">
                    <h3>Draw Odds</h3>
                    <p class="math-card-desc">Chances of hitting your draw on next street.</p>
                  </div>
                </div>

                <div class="math-table">
                  <div class="table-row header">
                    <span>Common Draw</span>
                    <span>Outs</span>
                    <span class="text-right">Success %</span>
                  </div>
                  <div class="table-row">
                    <span>Gutshot Draw <span class="card-example">(e.g., QJ on 9-8-2)</span></span>
                    <span class="val font-bold">4 Outs</span>
                    <span class="val text-danger text-right">16.5%</span>
                  </div>
                  <div class="table-row">
                    <span>OESD Draw <span class="card-example">(e.g., JT on 9-8-2)</span></span>
                    <span class="val font-bold">8 Outs</span>
                    <span class="val text-warning text-right">31.5%</span>
                  </div>
                  <div class="table-row">
                    <span>Flush Draw <span class="card-example">(e.g., 2 hearts on board)</span></span>
                    <span class="val font-bold">9 Outs</span>
                    <span class="val text-warning text-right">35.0%</span>
                  </div>
                  <div class="table-row highlight">
                    <span>Monster Combo <span class="card-example">(straight + flush draw)</span></span>
                    <span class="val font-bold">15 Outs</span>
                    <span class="val text-success text-right">54.0%</span>
                  </div>
                </div>

                <div class="odds-legend-tip">
                  <span class="tip-title">OUTS DEFINITION:</span>
                  The number of remaining cards in the deck that will give you the winning hand.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const closeModal = () => {
  emit('update:modelValue', false)
}

const activeTab = ref('range')
const currentSpot = ref('sb_open')
const hoveredCombo = ref(null)
const showGuide = ref(false)

// 169 Hand Combos standard poker matrix layout
const combos = [
  "AA", "AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s",
  "AKo", "KK", "KQs", "KJs", "KTs", "K9s", "K8s", "K7s", "K6s", "K5s", "K4s", "K3s", "K2s",
  "AQo", "KQo", "QQ", "QJs", "QTs", "Q9s", "Q8s", "Q7s", "Q6s", "Q5s", "Q4s", "Q3s", "Q2s",
  "AJo", "KJo", "QJo", "JJ", "JTs", "J9s", "J8s", "J7s", "J6s", "J5s", "J4s", "J3s", "J2s",
  "ATo", "KTo", "QTo", "JTo", "TT", "T9s", "T8s", "T7s", "T6s", "T5s", "T4s", "T3s", "T2s",
  "A9o", "K9o", "Q9o", "J9o", "T9o", "99", "98s", "97s", "96s", "95s", "94s", "93s", "92s",
  "A8o", "K8o", "Q8o", "J8o", "T8o", "98o", "88", "87s", "86s", "85s", "84s", "83s", "82s",
  "A7o", "K7o", "Q7o", "J7o", "T7o", "97o", "87o", "77", "76s", "75s", "74s", "73s", "72s",
  "A6o", "K6o", "Q6o", "J6o", "T6o", "96o", "86o", "76o", "66", "65s", "64s", "63s", "62s",
  "A5o", "K5o", "Q5o", "J5o", "T5o", "95o", "85o", "75o", "65o", "55", "54s", "53s", "52s",
  "A4o", "K4o", "Q4o", "J4o", "T4o", "94o", "84o", "74o", "64o", "54o", "44", "43s", "42s",
  "A3o", "K3o", "Q3o", "J3o", "T3o", "93o", "83o", "73o", "63o", "53o", "43o", "33", "32s",
  "A2o", "K2o", "Q2o", "J2o", "T2o", "92o", "82o", "72o", "62o", "52o", "42o", "32o", "22",
]

const getComboTypeClass = (combo) => {
  if (combo.length === 2) return 'pair'
  return combo.endsWith('s') ? 'suited' : 'offsuit'
}

const getComboFullTypeName = (combo) => {
  if (combo.length === 2) return 'Pocket Pair'
  return combo.endsWith('s') ? 'Suited Hand' : 'Offsuit Hand'
}

const ranks = { 'A':14, 'K':13, 'Q':12, 'J':11, 'T':10, '9':9, '8':8, '7':7, '6':6, '5':5, '4':4, '3':3, '2':2 }

const getComboMetadata = (combo) => {
  const r1 = combo[0]
  const r2 = combo[1]
  const type = getComboTypeClass(combo)
  const val1 = ranks[r1]
  const val2 = ranks[r2]
  return { r1, r2, type, val1, val2 }
}

const generateSbOpenWeights = (combo) => {
  const meta = getComboMetadata(combo)
  if (meta.type === 'pair') {
    if (meta.val1 >= 6) return [100, 0, 0]
    return [70, 30, 0]
  }
  if (meta.type === 'suited') {
    if (meta.val1 === 14) return [100, 0, 0]
    if (meta.val1 === 13) return [100, 0, 0]
    if (meta.val1 === 12) return [100, 0, 0]
    if (meta.val1 === 11) return [100, 0, 0]
    if (meta.val1 === 10 && meta.val2 >= 3) return [100, 0, 0]
    if (meta.val1 === 9 && meta.val2 >= 5) return [100, 0, 0]
    if (meta.val1 === 8 && meta.val2 >= 5) return [100, 0, 0]
    if (meta.val1 === 7 && meta.val2 >= 4) return [100, 0, 0]
    if (meta.val1 === 6 && meta.val2 >= 4) return [100, 0, 0]
    if (meta.val1 === 5 && meta.val2 >= 3) return [100, 0, 0]
    if (meta.val1 === 4 && meta.val2 >= 3) return [100, 0, 0]
    if (meta.val1 === 10 || meta.val1 === 9 || meta.val1 === 8 || meta.val1 === 7) return [20, 80, 0]
    return [0, 50, 50]
  }
  if (meta.type === 'offsuit') {
    if (meta.val1 === 14) return [100, 0, 0]
    if (meta.val1 === 13 && meta.val2 >= 5) return [100, 0, 0]
    if (meta.val1 === 12 && meta.val2 >= 8) return [100, 0, 0]
    if (meta.val1 === 11 && meta.val2 >= 8) return [100, 0, 0]
    if (meta.val1 === 10 && meta.val2 >= 8) return [100, 0, 0]
    if (meta.val1 === 9 && meta.val2 >= 8) return [100, 0, 0]
    if (meta.val1 === 13 && meta.val2 >= 2) return [0, 80, 20]
    if (meta.val1 === 12 && meta.val2 >= 5) return [0, 70, 30]
    if (meta.val1 === 11 && meta.val2 >= 7) return [0, 60, 40]
    if (meta.val1 === 10 && meta.val2 >= 7) return [0, 50, 50]
    return [0, 0, 100]
  }
  return [0, 0, 100]
}

const generateBbDefWeights = (combo) => {
  const meta = getComboMetadata(combo)
  if (meta.type === 'pair') {
    if (meta.val1 >= 11) return [100, 0, 0]
    if (meta.val1 === 10) return [40, 60, 0]
    return [0, 100, 0]
  }
  if (meta.type === 'suited') {
    if (meta.val1 === 14 && meta.val2 >= 10) return [100, 0, 0]
    if (meta.val1 === 14 && (meta.val2 === 5 || meta.val2 === 4)) return [80, 20, 0]
    if (meta.val1 === 13 && meta.val2 >= 11) return [40, 60, 0]
    if (meta.val1 === 12 && meta.val2 === 11) return [30, 70, 0]
    if (meta.val1 === 11 && meta.val2 === 10) return [40, 60, 0]
    if (meta.val1 === 10 && meta.val2 === 9) return [40, 60, 0]
    if (meta.val1 === 9 && meta.val2 === 8) return [30, 70, 0]
    if (meta.val1 === 8 && meta.val2 === 7) return [30, 70, 0]
    if (meta.val1 === 14) return [0, 100, 0]
    if (meta.val1 === 13 && meta.val2 >= 2) return [0, 100, 0]
    if (meta.val1 === 12 && meta.val2 >= 2) return [0, 100, 0]
    if (meta.val1 === 11 && meta.val2 >= 4) return [0, 100, 0]
    if (meta.val1 === 10 && meta.val2 >= 6) return [0, 100, 0]
    if (meta.val1 === 9 && meta.val2 >= 6) return [0, 100, 0]
    if (meta.val1 === 8 && meta.val2 >= 6) return [0, 100, 0]
    if (meta.val1 === 7 && meta.val2 >= 5) return [0, 100, 0]
    if (meta.val1 === 6 && meta.val2 >= 5) return [0, 100, 0]
    if (meta.val1 === 5 && meta.val2 >= 4) return [0, 100, 0]
    return [0, 0, 100]
  }
  if (meta.type === 'offsuit') {
    if (meta.val1 === 14 && meta.val2 === 13) return [100, 0, 0]
    if (meta.val1 === 14 && meta.val2 === 12) return [80, 20, 0]
    if (meta.val1 === 14 && meta.val2 === 11) return [40, 60, 0]
    if (meta.val1 === 14 && meta.val2 >= 7) return [0, 100, 0]
    if (meta.val1 === 13 && meta.val2 >= 9) return [0, 100, 0]
    if (meta.val1 === 12 && meta.val2 >= 9) return [0, 100, 0]
    if (meta.val1 === 11 && meta.val2 >= 9) return [0, 100, 0]
    if (meta.val1 === 10 && meta.val2 >= 8) return [0, 100, 0]
    if (meta.val1 === 9 && meta.val2 === 8) return [0, 100, 0]
    if (meta.val1 === 8 && meta.val2 === 7) return [0, 80, 20]
    return [0, 0, 100]
  }
  return [0, 0, 100]
}

const getComboWeights = (combo) => {
  if (currentSpot.value === 'sb_open') {
    return generateSbOpenWeights(combo)
  } else {
    return generateBbDefWeights(combo)
  }
}

const getCellBg = (combo) => {
  const weights = getComboWeights(combo)
  const colors = ['#9f292d', '#1f7a4f', '#100b0a'] // Raise, Call, Fold
  const total = weights.reduce((a, b) => a + b, 0)
  if (total === 0) return 'var(--bg-panel-solid)'
  
  const activeActions = weights.map((w, idx) => w > 0 ? idx : -1).filter(idx => idx !== -1)
  if (activeActions.length === 1) {
    return colors[activeActions[0]]
  }
  
  let bgString = "linear-gradient(to left"
  let sum = 0;
  weights.forEach((w, idx) => {
    const percentage = (w / total) * 100
    if (percentage > 0) {
      sum += percentage
      bgString += `, ${colors[idx]} ${sum - percentage}%, ${colors[idx]} ${sum}%`
    }
  })
  bgString += ")"
  return bgString
}

const getComboAdvice = (combo) => {
  const weights = getComboWeights(combo)
  const meta = getComboMetadata(combo)
  
  if (currentSpot.value === 'sb_open') {
    if (weights[0] === 100) {
      if (meta.val1 >= 10 && meta.type === 'pair') return `${combo} is a premier pocket pair. Open-raise 100% of the time to build a pot immediately.`
      if (meta.val1 === 14) return `Suited Ace ${combo} plays incredibly well postflop. Mandatory raise to seize initiative.`
      return `${combo} is a strong open-raise hand in heads-up. Push your equity edge and raise.`
    }
    if (weights[1] > 0) {
      return `${combo} is a medium-strength marginal hand. Mix raise and limp to protect your limping range and play a small pot.`
    }
    return `${combo} is too weak to play profitably in Heads-Up even with position. Fast fold.`
  } else {
    if (weights[0] >= 80) {
      if (meta.val1 >= 11 && meta.type === 'pair') return `JJ+ represents a dominant preflop premium. 3-bet high frequency for value and stack protection.`
      if (meta.val1 === 14 && meta.val2 === 5) return `A5s is the ultimate 3-bet bluff card; it blocks AA/AK and possesses great wheel equity.`
      return `3-bet ${combo} to put maximum pressure on SB's wide opening range.`
    }
    if (weights[0] > 0 && weights[1] > 0) {
      return `${combo} sits right on the threshold. Mix between 3-bet bluffs and defensive calling to stay unexploitable.`
    }
    if (weights[1] === 100) {
      if (meta.type === 'pair') return `Pocket pair ${combo} has great set-mining value. Call and seek a set on the flop.`
      if (meta.type === 'suited') return `Suited ${combo} has strong flush and straight equity. Perfect candidate for calling to play postflop.`
      return `Flat call with ${combo} to defend your big blind in-position against a wide SB open.`
    }
    return `${combo} is too weak to defend out-of-position against a raise. Safe fold.`
  }
}

const getActionStats = computed(() => {
  let raiseCount = 0
  let callCount = 0
  let foldCount = 0
  combos.forEach(combo => {
    const w = getComboWeights(combo)
    raiseCount += w[0]
    callCount += w[1]
    foldCount += w[2]
  })
  const total = 16900
  return {
    raise: (raiseCount / total * 100).toFixed(0),
    call: (callCount / total * 100).toFixed(0),
    fold: (foldCount / total * 100).toFixed(0)
  }
})
</script>

<style scoped>
/* ----------------------------------------------------
   Aesthetic Overlay & Dialog Layout
   ---------------------------------------------------- */
.gto-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.gto-modal-content {
  position: relative;
  width: 100%;
  max-width: 860px;
  background:
    radial-gradient(circle at 50% 0%, rgba(217, 173, 88, 0.08), transparent 30rem),
    rgba(24, 18, 15, 0.94);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-xl);
  padding: 2.5rem;
  box-shadow: 
    var(--shadow-lg),
    0 0 40px rgba(217, 173, 88, 0.06);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
  max-height: 92vh;
  overflow-y: auto;
}

/* Close button */
.gto-close-btn {
  position: absolute;
  top: 1.2rem;
  right: 1.4rem;
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all 0.2s ease;
  border-radius: 50%;
}
.gto-close-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.06);
}
.close-icon {
  font-size: 26px;
  line-height: 1;
}

/* Header styles */
.gto-modal-header {
  text-align: left;
  position: relative;
}
.gto-title-badge {
  display: inline-block;
  font-size: 0.72rem;
  color: var(--accent-primary);
  font-weight: 800;
  letter-spacing: 0.12em;
  border: 1px solid rgba(217, 173, 88, 0.25);
  background: rgba(217, 173, 88, 0.06);
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-xs);
  margin-bottom: 0.5rem;
}
.gto-title-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.4rem;
}

/* Gold Collapsible Guide Badge */
.gto-guide-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(217, 173, 88, 0.06);
  border: 1px solid rgba(217, 173, 88, 0.2);
  color: var(--accent-primary-strong);
  font-weight: 800;
  font-size: 0.7rem;
  padding: 0.22rem 0.65rem;
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}
.gto-guide-badge:hover,
.gto-guide-badge.active {
  background: rgba(217, 173, 88, 0.16);
  border-color: var(--accent-primary);
  color: var(--text-primary);
  box-shadow: 0 0 10px rgba(217, 173, 88, 0.2);
}
.badge-icon {
  font-size: 0.8rem;
}

.gto-modal-title {
  font-size: 1.65rem;
  font-weight: 820;
  margin-bottom: 0.4rem;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}
.gto-modal-desc {
  font-size: 0.88rem;
  color: var(--text-tertiary);
  line-height: 1.5;
  margin: 0;
}

/* Guide dropdown container styles */
.gto-guide-dropdown {
  background: rgba(18, 13, 10, 0.96);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  padding: 1rem 1.4rem;
  margin-top: 1rem;
  box-shadow: var(--shadow-md), 0 0 25px rgba(217, 173, 88, 0.05);
}
.guide-title {
  display: block;
  font-weight: 800;
  color: var(--accent-primary);
  font-size: 0.85rem;
  margin-bottom: 0.6rem;
  letter-spacing: 0.02em;
}
.guide-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
.guide-column p {
  margin: 0 0 0.45rem 0;
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.45;
}
.guide-column p:last-child {
  margin-bottom: 0;
}
.guide-color {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 0.35rem;
  vertical-align: middle;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.guide-color.raise-dot { background: #9f292d; }
.guide-color.call-dot { background: #1f7a4f; }
.guide-color.fold-dot { background: #100b0a; }

.raise-color { color: #ff6b6e; }
.call-color { color: #52d992; }
.fold-color { color: var(--text-secondary); }

/* GTO Tab Selector */
.gto-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-subtle);
  gap: 1.8rem;
  margin-bottom: 0.4rem;
}
.gto-tab-btn {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: 1.05rem;
  font-weight: 800;
  padding: 0.5rem 0.2rem 0.8rem;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}
.gto-tab-btn:hover {
  color: var(--text-primary);
}
.gto-tab-btn.active {
  color: var(--accent-primary-strong);
}
.gto-tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-primary);
  border-radius: 2px;
}

/* Spot Tabs */
.gto-spot-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
  background: rgba(0, 0, 0, 0.24);
  padding: 0.35rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  margin-bottom: 1.4rem;
}
.spot-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.65rem;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-weight: 750;
  font-size: 0.94rem;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid transparent;
}
.spot-tab:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.03);
}
.spot-tab.active {
  background: var(--bg-panel-raised);
  color: var(--text-primary);
  border-color: var(--border-subtle);
  box-shadow: var(--shadow-sm);
}

.spot-role {
  font-size: 0.72rem;
  font-weight: 900;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  letter-spacing: 0.04em;
}
.spot-role.sb {
  background: rgba(217, 173, 88, 0.14);
  color: var(--accent-turn);
}
.spot-role.bb {
  background: rgba(143, 47, 47, 0.18);
  color: var(--text-primary);
}

/* Single-Core layout (Matrix居中独占，取消左右双栏视觉拉扯) */
.gto-main-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  margin-bottom: 1.4rem;
}

/* 13x13 Grid Matrix Layout */
.gto-matrix-container {
  aspect-ratio: 1;
  width: 100%;
  max-width: 580px; /* 大气居中 */
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 0.5rem;
  position: relative;
}
.gto-hand-matrix {
  display: grid;
  grid-template-columns: repeat(13, 1fr);
  grid-template-rows: repeat(13, 1fr);
  gap: 2px;
  width: 100%;
  height: 100%;
}
.gto-matrix-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(0.55rem, 1.2vw, 0.75rem);
  font-family: var(--font-family-mono);
  font-weight: 700;
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  transition: transform 0.15s ease, filter 0.15s ease;
  user-select: none;
}
.combo-label {
  color: var(--text-primary);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.88);
}

.gto-matrix-cell:hover,
.gto-matrix-cell.active {
  transform: scale(1.16);
  z-index: 10;
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
  filter: brightness(1.2);
}

.gto-matrix-cell.pair {
  box-shadow: inset 0 0 0 1px rgba(217, 173, 88, 0.16);
}

/* Polished Compact Horizontal Legend */
.gto-horizontal-legend {
  display: flex;
  justify-content: center;
  gap: 2.2rem;
  background: rgba(0, 0, 0, 0.12);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  padding: 0.45rem 1.6rem;
  width: auto;
}
.gto-horizontal-legend .legend-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}
.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}
.legend-color.raise { background: #9f292d; }
.legend-color.call { background: #1f7a4f; }
.legend-color.fold { background: #100b0a; }

.legend-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.legend-label strong {
  font-family: var(--font-family-mono);
  color: var(--text-primary);
  margin-left: 0.2rem;
}

/* Bottom description panel (Progressive Disclosure) */
.gto-bottom-details {
  background: rgba(15, 10, 8, 0.8);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 1rem 1.4rem;
  min-height: 80px; /* 固高防抖 */
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.details-content {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.details-main-info {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.details-combo {
  font-size: 1.35rem;
  font-weight: 850;
  font-family: var(--font-family-mono);
  letter-spacing: -0.01em;
}
.details-combo.pair { color: var(--accent-primary-strong); }
.details-combo.suited { color: var(--text-primary); }
.details-combo.offsuit { color: var(--text-secondary); }

.details-combo-desc {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.details-weights {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 0.15rem;
}
.weight-pill {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-family: var(--font-family-mono);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.weight-pill.raise { background: rgba(159, 41, 45, 0.18); color: #ff6b6e; }
.weight-pill.call { background: rgba(31, 122, 79, 0.18); color: #52d992; }
.weight-pill.fold { background: rgba(255, 255, 255, 0.04); color: var(--text-secondary); }

.details-tip {
  font-size: 0.88rem;
  color: var(--text-primary);
  line-height: 1.45;
}
.tip-label {
  font-weight: 800;
  color: var(--accent-primary);
  font-size: 0.8rem;
  margin-right: 0.25rem;
}

.details-empty-placeholder {
  font-size: 0.82rem;
  color: var(--text-tertiary);
  text-align: center;
  font-style: italic;
  letter-spacing: 0.01em;
}

/* ----------------------------------------------------
   TAB 2: Matchday Math Sheet (2:1 Asymmetric Console Layout)
   ---------------------------------------------------- */
.math-cheat-sheet {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.math-card-grid {
  display: grid;
  grid-template-columns: 2fr 1.1fr; /* 黄金比例不对称分布 */
  gap: 1.25rem;
}
.math-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.math-card-header {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}
.math-card-icon {
  font-size: 1.5rem;
  line-height: 1.1;
}
.math-card-header-text h3 {
  font-size: 1.15rem;
  font-weight: 850;
  color: var(--text-primary);
  margin-bottom: 0.15rem;
}
.math-card-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0;
}

/* Left Column: Math Console Inside */
.math-console-inner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Card 1: Formula Box */
.math-formula-box {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.95rem;
}
.formula-line {
  font-family: var(--font-family-mono);
  font-size: 0.92rem;
  text-align: center;
  font-weight: 750;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}
.term-text.risk { color: #ff6b6e; }
.term-text.reward { color: #52d992; }

.formula-terms {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  padding-top: 0.65rem;
}
.formula-terms p {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin: 0;
  display: flex;
  align-items: center;
}
.term-color-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 0.35rem;
  flex-shrink: 0;
}
.term-color-dot.risk { background: #ff6b6e; }
.term-color-dot.reward { background: #52d992; }
.term-sub {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  margin-left: 0.2rem;
}

/* Card 1: Worked Example Box */
.math-example-box {
  background: rgba(217, 173, 88, 0.03);
  border: 1px dashed rgba(217, 173, 88, 0.14);
  border-radius: var(--radius-md);
  padding: 0.9rem 1.1rem;
}
.example-title {
  display: block;
  font-size: 0.72rem;
  font-weight: 900;
  color: var(--accent-primary-strong);
  letter-spacing: 0.04em;
  margin-bottom: 0.45rem;
}
.example-body {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
}
.example-body strong {
  color: var(--text-primary);
}
.example-body .subtext {
  font-size: 0.7rem;
  color: var(--text-tertiary);
}

/* Card 1: Decision Rules Box */
.decision-rules-box {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}
.rule-item {
  display: flex;
  flex-direction: column;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}
.rule-item.call {
  background: rgba(31, 122, 79, 0.06);
  border-color: rgba(31, 122, 79, 0.16);
}
.rule-item.fold {
  background: rgba(159, 41, 45, 0.06);
  border-color: rgba(159, 41, 45, 0.16);
}
.rule-formula {
  font-family: var(--font-family-mono);
  font-size: 0.78rem;
  font-weight: 750;
  color: var(--text-secondary);
  margin-bottom: 0.2rem;
}
.rule-decision {
  font-size: 0.82rem;
  font-weight: 850;
}

/* Coach tip block */
.math-coach-tip {
  margin-top: auto;
  background: rgba(217, 173, 88, 0.04);
  border: 1px solid rgba(217, 173, 88, 0.12);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--text-secondary);
}
.tip-title {
  font-weight: 900;
  color: var(--accent-primary);
  display: block;
  margin-bottom: 0.2rem;
  font-size: 0.74rem;
  letter-spacing: 0.04em;
}
.call-badge {
  background: rgba(31, 122, 79, 0.18);
  border: 1px solid rgba(31, 122, 79, 0.35);
  color: #52d992;
  padding: 0.02rem 0.35rem;
  border-radius: 4px;
  font-weight: 800;
  font-size: 0.74rem;
}

/* Card 2: Draw Odds Table (Right Column) */
.math-table {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.16);
}
.table-row {
  display: grid;
  grid-template-columns: 1fr 65px 70px;
  padding: 0.65rem 0.8rem;
  font-size: 0.8rem;
  border-bottom: 1px solid var(--border-subtle);
  align-items: center;
}
.table-row:last-child {
  border-bottom: none;
}
.table-row.header {
  background: rgba(255, 255, 255, 0.03);
  font-weight: 800;
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--text-tertiary);
  letter-spacing: 0.04em;
}
.card-example {
  display: block;
  font-size: 0.68rem;
  color: var(--text-tertiary);
  margin-top: 0.05rem;
}
.table-row.highlight {
  background: rgba(31, 122, 79, 0.08);
}
.table-row.highlight-danger {
  background: rgba(159, 41, 45, 0.08);
}
.table-row .val {
  font-family: var(--font-family-mono);
}

.odds-legend-tip {
  margin-top: auto;
  border-top: 1px solid var(--border-subtle);
  padding-top: 0.95rem;
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-slide-fast-enter-active,
.fade-slide-fast-leave-active {
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.fade-slide-fast-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.fade-slide-fast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .gto-modal-content {
    padding: 1.4rem;
  }
  .gto-main-layout {
    margin-bottom: 1rem;
  }
  .gto-horizontal-legend {
    flex-wrap: wrap;
    gap: 0.8rem 1.5rem;
    border-radius: var(--radius-md);
  }
  .math-card-grid {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
  .guide-grid {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }
}
</style>
