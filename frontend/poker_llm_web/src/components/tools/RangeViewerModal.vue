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
            <div class="header-top-row">
              <div class="gto-title-badge">{{ t('badge') }}</div>
              <!-- Language Switcher -->
              <div class="lang-switcher">
                <button 
                  class="lang-btn" 
                  :class="{ active: currentLang === 'en' }" 
                  @click="setLanguage('en')"
                >
                  English
                </button>
                <span class="lang-divider">|</span>
                <button 
                  class="lang-btn" 
                  :class="{ active: currentLang === 'zh' }" 
                  @click="setLanguage('zh')"
                >
                  中文
                </button>
              </div>
            </div>
            <div class="gto-title-row">
              <h2 class="gto-modal-title">{{ t('title') }}</h2>
              <!-- Collapsible Guide Microcopy Badge -->
              <button 
                class="gto-guide-badge" 
                @click="showGuide = !showGuide"
                :class="{ active: showGuide }"
              >
                <span class="badge-icon">❓</span> {{ t('guide') }}
              </button>
            </div>
            <p class="gto-modal-desc motto">
              {{ t('motto') }}
            </p>

            <!-- Guide Popover Dropdown -->
            <Transition name="fade-slide-fast">
              <div v-if="showGuide" class="gto-guide-dropdown">
                <span class="guide-title">{{ t('guideTitle') }}</span>
                <div class="guide-grid">
                  <div class="guide-column">
                    <p>{{ t('guidePoint1') }}</p>
                    <p>{{ t('guidePoint2') }}</p>
                    <p>{{ t('guidePoint3') }}</p>
                  </div>
                  <div class="guide-column">
                    <p>• <span class="guide-color raise-dot"></span> <strong>{{ t('guideRaise') }}</strong></p>
                    <p>• <span class="guide-color call-dot"></span> <strong>{{ t('guideCall') }}</strong></p>
                    <p>• <span class="guide-color fold-dot"></span> <strong>{{ t('guideFold') }}</strong></p>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Secondary Tab Selector -->
          <div class="gto-tabs">
            <button 
              class="gto-tab-btn" 
              :class="{ active: activeTab === 'preflop' }" 
              @click="activeTab = 'preflop'"
            >
              🎯 {{ t('tabPreflop') }}
            </button>
            <button 
              class="gto-tab-btn" 
              :class="{ active: activeTab === 'math' }" 
              @click="activeTab = 'math'"
            >
              📊 {{ t('tabMath') }}
              <span v-if="mathBadgeText" class="tab-badge-status">{{ mathBadgeText }}</span>
            </button>
            <button 
              class="gto-tab-btn" 
              :class="{ active: activeTab === 'draws' }" 
              @click="activeTab = 'draws'"
            >
              🎯 {{ t('tabDraws') }}
              <span v-if="drawsBadgeText" class="tab-badge-status">{{ drawsBadgeText }}</span>
            </button>
            <button 
              class="gto-tab-btn" 
              :class="{ active: activeTab === 'board' }" 
              @click="activeTab = 'board'"
            >
              🃏 {{ t('tabBoard') }}
              <span v-if="boardBadgeText" class="tab-badge-status">{{ boardBadgeText }}</span>
            </button>
          </div>

          <!-- Postflop Card Inputs (visible in Math, Draws, and Board tabs) -->
          <div v-if="activeTab !== 'preflop'" class="postflop-input-bar">
            <!-- Hero Hand Input -->
            <div class="input-group hero-hand-input-group">
              <div class="input-group-label-stack">
                <span class="group-label">{{ t('heroHandLabel') }}</span>
                <span class="hand-input-helper-note">
                  {{ t('handbook.heroHandHelperNote') }}
                </span>
              </div>
              <div class="card-slots-and-notice">
                <div 
                  ref="heroHandInputRef"
                  class="card-slots hero-card-slots"
                  :class="{ 'glow-pulse-highlight': highlightOddsInput }"
                >
                  <div 
                    v-for="(card, idx) in 2" 
                    :key="'hero-' + idx"
                    class="card-slot-wrapper"
                  >
                    <div 
                      class="interactive-card-slot"
                      :class="{ empty: !coachState.heroCards[idx] }"
                      @click="openCardPicker('hero', idx)"
                    >
                      <CardView v-if="coachState.heroCards[idx]" :cardStr="coachState.heroCards[idx]" :visible="true" />
                      <div v-else class="empty-slot-content">
                        <span class="plus-icon">+</span>
                      </div>
                    </div>
                    <button 
                      v-if="coachState.heroCards[idx]" 
                      class="clear-slot-btn" 
                      @click.stop="clearCard('hero', idx)"
                      aria-label="Clear card"
                    >
                      &times;
                    </button>
                  </div>
                </div>
                <!-- Light notice text displayed in case of load notification -->
                <transition name="fade-fast">
                  <span v-if="loadNoticeText" class="load-notice-text">
                    {{ loadNoticeText }}
                  </span>
                </transition>
              </div>
            </div>

            <!-- Board Flop Input -->
            <div class="input-group">
              <span class="group-label">{{ t('boardFlopLabel') }}</span>
              <div class="card-slots">
                <div 
                  v-for="(card, idx) in 3" 
                  :key="'board-' + idx"
                  class="card-slot-wrapper"
                >
                  <div 
                    class="interactive-card-slot"
                    :class="{ empty: !coachState.boardCards[idx] }"
                    @click="openCardPicker('board', idx)"
                  >
                    <CardView v-if="coachState.boardCards[idx]" :cardStr="coachState.boardCards[idx]" :visible="true" />
                    <div v-else class="empty-slot-content">
                      <span class="plus-icon">+</span>
                    </div>
                  </div>
                  <button 
                    v-if="coachState.boardCards[idx]" 
                    class="clear-slot-btn" 
                    @click.stop="clearCard('board', idx)"
                    aria-label="Clear card"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </div>

            <!-- Reset to Live Game button -->
            <button 
              v-if="isLiveGameDiff" 
              class="sync-live-btn" 
              @click="syncFromLiveGame"
            >
              🔄 {{ t('syncLive') }}
            </button>
          </div>


          <!-- TAB 1: PREFLOP MATRIX -->
          <div v-if="activeTab === 'preflop'" class="gto-tab-content animate-fadeIn">
            <!-- Deciding tagline -->
            <div class="tab-decide-banner">
              <span class="decide-icon">💡</span>
              <div class="decide-text-container">
                <span class="decide-banner-title">{{ t('thinkingFrameworkTitle') }}</span>
                <ul class="decide-questions-list">
                  <li>• {{ t('preflopQ1') }}</li>
                  <li>• {{ t('preflopQ2') }}</li>
                  <li>• {{ t('preflopQ3') }}</li>
                </ul>
              </div>
            </div>

            <!-- Spot selector -->
            <div class="gto-spot-selector">
              <button 
                class="spot-tab" 
                :class="{ active: currentSpot === 'sb_open' }"
                @click="currentSpot = 'sb_open'"
              >
                <span class="spot-role sb">{{ t('sbButton') }}</span>
                <span class="spot-action">{{ t('openRaiseRfi') }}</span>
              </button>
              <button 
                class="spot-tab" 
                :class="{ active: currentSpot === 'bb_def' }"
                @click="currentSpot = 'bb_def'"
              >
                <span class="spot-role bb">{{ t('bbBigBlind') }}</span>
                <span class="spot-action">{{ t('defendVsSbOpen') }}</span>
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
                    @click="onComboClick(combo)"
                  >
                    <span class="combo-label">{{ combo }}</span>
                  </div>
                </div>
              </div>

              <!-- Polished Compact Horizontal Legend -->
              <div class="gto-horizontal-legend">
                <div class="legend-item">
                  <span class="legend-color raise"></span>
                  <span class="legend-label">{{ t('legendRaise') }}: <strong>{{ getActionStats.raise }}%</strong></span>
                </div>
                <div class="legend-item">
                  <span class="legend-color call"></span>
                  <span class="legend-label">{{ t('legendCall') }}: <strong>{{ getActionStats.call }}%</strong></span>
                </div>
                <div class="legend-item">
                  <span class="legend-color fold"></span>
                  <span class="legend-label">{{ t('legendFold') }}: <strong>{{ getActionStats.fold }}%</strong></span>
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
                      <span class="details-combo-desc">({{ t(getComboFullTypeNameKey(hoveredCombo)) }})</span>
                    </div>
                    <div class="details-weights">
                      <div class="weight-pill raise">{{ t('legendRaise') }}: {{ getComboWeights(hoveredCombo)[0] }}%</div>
                      <div class="weight-pill call" v-if="getComboWeights(hoveredCombo)[1] > 0">{{ t('legendCall') }}: {{ getComboWeights(hoveredCombo)[1] }}%</div>
                      <div class="weight-pill fold" v-if="getComboWeights(hoveredCombo)[2] > 0">{{ t('legendFold') }}: {{ getComboWeights(hoveredCombo)[2] }}%</div>
                    </div>
                    <div class="details-tip">
                      <span class="tip-label">{{ t('coachInsight') }}:</span> {{ getComboAdvice(hoveredCombo) }}
                    </div>
                  </template>
                  <template v-else>
                    <div class="details-empty-placeholder">
                      {{ t('placeholder') }}
                    </div>
                  </template>
                </div>
              </transition>
            </div>

            <!-- Position Educational Card -->
            <div class="educational-card">
              <h4 class="card-title">
                <span>⚓</span> {{ t('handbook.preflop.positionTitle') }}
              </h4>
              <p class="card-body">{{ t('handbook.preflop.positionBody') }}</p>
            </div>
          </div>

          <!-- TAB 2: MATH -->
          <div v-else-if="activeTab === 'math'" class="math-cheat-sheet animate-fadeIn">
            <!-- Deciding tagline -->
            <div class="tab-decide-banner">
              <span class="decide-icon">💡</span>
              <div class="decide-text-container">
                <span class="decide-banner-title">{{ t('thinkingFrameworkTitle') }}</span>
                <ul class="decide-questions-list">
                  <li>• {{ t('mathQ1') }}</li>
                  <li>• {{ t('mathQ2') }}</li>
                  <li>• {{ t('mathQ3') }}</li>
                </ul>
              </div>
            </div>

            <div v-if="!isPostflopReady" class="postflop-empty-state">
              <div class="empty-state-content">
                <span class="empty-state-icon">🔒</span>
                <h3>{{ t('postflopLockedTitle') }}</h3>
                <p class="desc">{{ t('postflopLockedDesc') }}</p>
              </div>
            </div>

            <div v-else class="math-card-grid">
              <!-- Left Column: Decision Console -->
              <div class="math-card console-card">
                <div class="math-card-header">
                  <span class="math-card-icon">🎛️</span>
                  <div class="math-card-header-text">
                    <h3>{{ t('mathTitle') }}</h3>
                    <p class="math-card-desc">{{ t('mathDesc') }}</p>
                  </div>
                </div>

                <!-- Postflop Math Assistant Inputs -->
                <div class="math-inputs-container">
                  <div class="math-input-row">
                    <div class="math-input-field">
                      <label>{{ t('potSizeInputLabel') }}</label>
                      <input 
                        type="number" 
                        v-model.number="coachState.pot" 
                        placeholder="e.g. 100"
                        class="premium-math-input"
                      />
                    </div>
                    <div class="math-input-field">
                      <label>{{ t('callAmountInputLabel') }}</label>
                      <input 
                        type="number" 
                        v-model.number="coachState.callAmount" 
                        placeholder="e.g. 30"
                        class="premium-math-input"
                      />
                    </div>
                  </div>
                </div>

                <!-- Dynamic Results Readout -->
                <div class="math-dynamic-results">
                  <div class="result-item-row">
                    <span class="result-label">{{ t('highestDrawLabel') }}:</span>
                    <span v-if="highestDraw" class="result-value text-accent">
                      {{ t(highestDraw.labelKey) }} ({{ highestDraw.outs }} Outs)
                    </span>
                    <span v-else class="result-value text-muted">{{ t('noMajorDraw') }}</span>
                  </div>

                  <div class="result-item-row">
                    <span class="result-label">{{ t('drawEquityLabel') }}:</span>
                    <span class="result-value font-mono">
                      {{ highestDraw ? highestDraw.toRiverProbability + '%' : '0.0%' }}
                    </span>
                  </div>

                  <div class="result-item-row">
                    <span class="result-label">{{ t('requiredEquityLabel') }}:</span>
                    <span class="result-value font-mono">
                      {{ requiredEquity !== null ? requiredEquity.toFixed(1) + '%' : '—' }}
                    </span>
                  </div>
                </div>

                <!-- Coach Guidance / Advice Alert Box -->
                <div class="math-coach-guidance-box" :class="guidanceClass">
                  <span class="guidance-title">{{ t('coachAdviceTitle') }}</span>
                  <p class="guidance-text">{{ mathCoachAdviceText }}</p>
                </div>

                <div class="math-console-inner">
                  <!-- Formula -->
                  <div class="math-formula-box">
                    <div class="formula-line">
                      {{ t('potOddsFormula') }}
                    </div>
                    <div class="formula-terms">
                      <p><span class="term-color-dot risk"></span> <strong>{{ t('riskLabel') }}</strong> {{ t('riskDesc') }}</p>
                      <p><span class="term-color-dot reward"></span> <strong>{{ t('rewardLabel') }}</strong> {{ t('rewardDesc') }}</p>
                      <p><span class="term-color-dot risk" style="background-color: var(--accent-primary)"></span> <strong>{{ t('requiredEquityLabel') }}</strong> {{ t('requiredEquityDesc') }}</p>
                    </div>
                  </div>

                  <!-- Worked Example -->
                  <div class="math-example-box">
                    <span class="example-title">{{ t('exampleTitle') }}</span>
                    <div class="example-body">
                      • <strong>{{ t('examplePot') }}</strong> $90 | <strong>{{ t('exampleOppBet') }}</strong> $45 <br/>
                      • <strong>{{ t('exampleRisk') }}</strong> $45 | <strong>{{ t('exampleReward') }}</strong> $135 <br/>
                      • <strong>{{ t('exampleMath') }}</strong> $45 / ($45 + $135) = $45 / $180 = <strong>25.0% Pot Odds = Required Equity</strong>
                    </div>
                  </div>

                  <!-- The Rules -->
                  <div class="decision-rules-box">
                    <div class="rule-item call">
                      <span class="rule-formula">{{ t('actualEqGteReq') }}</span>
                      <span class="rule-decision text-success">{{ t('profitableCall') }}</span>
                    </div>
                    <div class="rule-item fold">
                      <span class="rule-formula">{{ t('actualEqLtReq') }}</span>
                      <span class="rule-decision text-danger">{{ t('profitableFold') }}</span>
                    </div>
                  </div>
                </div>

                <div class="math-coach-tip">
                  <span class="tip-title">{{ t('mathGoldenRuleTitle') }}</span>
                  {{ t('mathGoldenRuleText') }}
                </div>
              </div>

              <!-- Right Column Wrapper Stack -->
              <div class="math-right-col-stack">
                <!-- Concept Explanation Card -->
                <div class="math-card odds-card">
                  <div class="math-card-header">
                    <span class="math-card-icon">🧠</span>
                    <div class="math-card-header-text">
                      <h3>{{ t('uncertaintyTitle') }}</h3>
                      <p class="math-card-desc">{{ t('uncertaintyDesc') }}</p>
                    </div>
                  </div>

                  <div class="concept-explanation">
                    <p class="concept-p">
                      {{ t('uncertaintyP1') }}
                    </p>
                  </div>

                  <div class="odds-legend-tip font-bold text-center" style="font-size: 0.8rem; line-height: 1.4; border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-top: auto;">
                    <span class="accent-link" @click="activeTab = 'draws'">{{ t('goDrawsLink') }}</span>
                  </div>
                </div>

                <!-- Bet Size Card -->
                <div class="educational-card">
                  <h4 class="card-title">
                    <span>📏</span> {{ t('handbook.math.betSizeTitle') }}
                  </h4>
                  <p class="card-body">{{ t('handbook.math.betSizeBody') }}</p>
                </div>

                <!-- Implied Odds Card -->
                <div class="educational-card">
                  <h4 class="card-title">
                    <span>💰</span> {{ t('handbook.math.impliedOddsTitle') }}
                  </h4>
                  <p class="card-body">{{ t('handbook.math.impliedOddsBody') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: DRAWS -->
          <div v-else-if="activeTab === 'draws'" class="math-cheat-sheet animate-fadeIn">
            <!-- Deciding tagline -->
            <div class="tab-decide-banner">
              <span class="decide-icon">💡</span>
              <div class="decide-text-container">
                <span class="decide-banner-title">{{ t('thinkingFrameworkTitle') }}</span>
                <ul class="decide-questions-list">
                  <li>• {{ t('drawsQ1') }}</li>
                  <li>• {{ t('drawsQ2') }}</li>
                  <li>• {{ t('drawsQ3') }}</li>
                </ul>
              </div>
            </div>

            <div v-if="!isPostflopReady" class="postflop-empty-state">
              <div class="empty-state-content">
                <span class="empty-state-icon">🔒</span>
                <h3>{{ t('postflopLockedTitle') }}</h3>
                <p class="desc">{{ t('postflopLockedDesc') }}</p>
              </div>
            </div>

            <div v-else class="math-card-grid">
              <!-- Left: Draws Table -->
              <div class="math-card table-card" :class="{ 'strong-made-highlight': isStrongMadeHand }" style="padding: 1.25rem;">
                <div class="math-card-header">
                  <span class="math-card-icon">{{ isStrongMadeHand ? '🃏' : '🎯' }}</span>
                  <div class="math-card-header-text">
                    <h3 :class="{ 'text-success-strong': isStrongMadeHand }">
                      {{ isStrongMadeHand ? t('handbook.draws.strongMadeTitle') : t('activeDrawsTitle') }}
                    </h3>
                    <p class="math-card-desc" v-if="!isStrongMadeHand">{{ t('activeDrawsDesc') }}</p>
                    <p class="math-card-desc" v-else>
                      {{ currentLang === 'zh' ? '已击中强成牌，重心从“追牌胜率”转向“获取价值”。' : 'Made a strong hand. Shift focus from draws to maximizing value.' }}
                    </p>
                  </div>
                </div>

                <template v-if="!isStrongMadeHand">
                  <!-- Active Draws List -->
                  <div v-if="activeDraws.length > 0" class="math-table active-draws-table">
                    <div class="table-row header">
                      <span>{{ t('thDraw') }}</span>
                      <span class="text-center">{{ t('thOuts') }}</span>
                      <span class="text-center">{{ t('thF2T') }}</span>
                      <span class="text-center">{{ t('thF2R') }}</span>
                    </div>
                    <div 
                      v-for="draw in activeDraws" 
                      :key="draw.type" 
                      class="table-row"
                      :class="{ highlight: draw.outs >= 8, 'highlight-danger': draw.cleanOutsWarning }"
                    >
                      <span>
                        <strong>{{ t(draw.labelKey) }}</strong>
                        <span v-if="draw.cleanOutsWarning" class="card-example text-danger-soft">
                          ⚠️ {{ t('dirtyOutsWarningText') }}
                        </span>
                      </span>
                      <span class="val font-bold text-center active-draw-outs-cell">
                        {{ draw.outs }} {{ currentLang === 'zh' ? '补牌' : 'Outs' }}
                        <span v-if="draw.cleanOuts < draw.outs" class="clean-outs-info">
                          <span class="warning-icon">⚠️</span>(≈{{ draw.cleanOuts }} {{ currentLang === 'zh' ? '洁净' : 'Clean' }})
                        </span>
                      </span>
                      <span class="val text-center pct-val">
                        <span class="main-pct">~{{ draw.ruleOf2Next }}%</span>
                        <span class="sub-pct">{{ draw.nextCardProbability }}%</span>
                      </span>
                      <span class="val text-center pct-val">
                        <span class="main-pct">~{{ draw.ruleOf4Total }}%</span>
                        <span class="sub-pct">{{ draw.toRiverProbability }}%</span>
                      </span>
                    </div>
                  </div>
                  <div v-else class="no-draws-placeholder">
                    <p>{{ t('noDrawsDetected') }}</p>
                  </div>

                  <!-- Linkage Status Bar -->
                  <div 
                    class="linkage-status-bar animate-fadeIn" 
                    :class="linkageStatusClass"
                  >
                    {{ linkageText }}
                  </div>

                  <!-- Section Divider -->
                  <div class="reference-table-divider">
                    <span>{{ t('referenceTableTitle') }}</span>
                  </div>

                  <div class="math-table draws-table">
                    <div class="table-row header">
                      <span>{{ t('thDraw') }}</span>
                      <span class="text-center">{{ t('thOuts') }}</span>
                      <span class="text-center">{{ t('thF2T') }}</span>
                      <span class="text-center">{{ t('thT2R') }}</span>
                      <span class="text-center">{{ t('thF2R') }}</span>
                    </div>

                    <div class="table-row">
                      <span>
                        <strong>{{ t('drawPair') }}</strong>
                        <span class="card-example">{{ t('drawPairDesc') }}</span>
                      </span>
                      <span class="val font-bold text-center">2</span>
                      <span class="val text-danger text-center">4.3%</span>
                      <span class="val text-danger text-center">4.3%</span>
                      <span class="val text-danger text-center">8.4%</span>
                    </div>

                    <div class="table-row">
                      <span>
                        <strong>{{ t('drawGutshot') }}</strong>
                        <span class="card-example">{{ t('drawGutshotDesc') }}</span>
                      </span>
                      <span class="val font-bold text-center">4</span>
                      <span class="val text-danger text-center">8.5%</span>
                      <span class="val text-danger text-center">8.7%</span>
                      <span class="val text-danger text-center">16.5%</span>
                    </div>

                    <div class="table-row">
                      <span>
                        <strong>{{ t('drawOvercards') }}</strong>
                        <span class="card-example">{{ t('drawOvercardsDesc') }}</span>
                      </span>
                      <span class="val font-bold text-center">6</span>
                      <span class="val text-warning text-center">12.8%</span>
                      <span class="val text-warning text-center">13.0%</span>
                      <span class="val text-warning text-center">24.1%</span>
                    </div>

                    <div class="table-row">
                      <span>
                        <strong>{{ t('drawOesd') }}</strong>
                        <span class="card-example">{{ t('drawOesdDesc') }}</span>
                      </span>
                      <span class="val font-bold text-center">8</span>
                      <span class="val text-warning text-center">17.0%</span>
                      <span class="val text-warning text-center">17.4%</span>
                      <span class="val text-warning text-center">31.5%</span>
                    </div>

                    <div class="table-row">
                      <span>
                        <strong>{{ t('drawFlush') }}</strong>
                        <span class="card-example">{{ t('drawFlushDesc') }}</span>
                      </span>
                      <span class="val font-bold text-center">9</span>
                      <span class="val text-warning text-center">19.2%</span>
                      <span class="val text-warning text-center">19.6%</span>
                      <span class="val text-warning text-center">35.0%</span>
                    </div>

                    <div class="table-row highlight">
                      <span>
                        <strong>{{ t('drawCombo12') }}</strong>
                        <span class="card-example">{{ t('drawCombo12Desc') }}</span>
                      </span>
                      <span class="val font-bold text-center">12</span>
                      <span class="val text-success text-center">25.5%</span>
                      <span class="val text-success text-center">26.1%</span>
                      <span class="val text-success text-center">45.0%</span>
                    </div>

                    <div class="table-row highlight">
                      <span>
                        <strong>{{ t('drawCombo15') }}</strong>
                        <span class="card-example">{{ t('drawCombo15Desc') }}</span>
                      </span>
                      <span class="val font-bold text-center">15</span>
                      <span class="val text-success text-center">31.9%</span>
                      <span class="val text-success text-center">32.6%</span>
                      <span class="val text-success text-center">54.1%</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <!-- Strong Made Hand Content -->
                  <div class="strong-made-container animate-fadeIn">
                    <ul class="strong-made-list">
                      <li>
                        <strong>{{ currentLang === 'zh' ? '底池保护：' : 'Pot Protection: ' }}</strong>
                        {{ t('handbook.draws.strongMadePoint1') }}
                      </li>
                      <li>
                        <strong>{{ currentLang === 'zh' ? '避免给免费牌：' : 'Avoid Giving Free Cards: ' }}</strong>
                        {{ t('handbook.draws.strongMadePoint2') }}
                      </li>
                      <li>
                        <strong>{{ currentLang === 'zh' ? '如何 Value Bet：' : 'How to Value Bet: ' }}</strong>
                        {{ t('handbook.draws.strongMadePoint3') }}
                      </li>
                    </ul>
                  </div>
                </template>
              </div>

              <!-- Right Column Wrapper Stack -->
              <div class="draws-right-col-stack">
                <!-- Rules & Clean Outs Card -->
                <div v-if="!isStrongMadeHand" class="math-card rules-card">
                  <div class="math-card-header">
                    <span class="math-card-icon">📏</span>
                    <div class="math-card-header-text">
                      <h3>{{ t('rule24Title') }}</h3>
                      <p class="math-card-desc">{{ t('rule24Desc') }}</p>
                    </div>
                  </div>

                  <div class="rules-explanation-box">
                    <div 
                      class="formula-block" 
                      :class="{ 'dim-opacity': hasActiveStreet && isTurnStreet }"
                    >
                      <div class="rule-equation">
                        <span class="label">{{ t('thF2R') }} ≈</span>
                        <div class="formula-flex-container text-success">
                          <span>{{ currentLang === 'zh' ? '补牌数' : 'Outs' }}</span>
                          <span>×</span>
                          <span>4%</span>
                        </div>
                        <span v-if="hasActiveStreet && isTurnStreet" class="street-hint">
                          {{ t('handbook.draws.flopOnlyHint') }}
                        </span>
                      </div>
                      <p class="rule-note">{{ t('f2rNote') }}</p>
                    </div>
                    
                    <div 
                      class="formula-block mt-2" 
                      :class="{ 'dim-opacity': hasActiveStreet && isFlopStreet }"
                    >
                      <div class="rule-equation">
                        <span class="label">{{ t('thT2R') }} ≈</span>
                        <div class="formula-flex-container text-warning">
                          <span>{{ currentLang === 'zh' ? '补牌数' : 'Outs' }}</span>
                          <span>×</span>
                          <span>2%</span>
                        </div>
                        <span v-if="hasActiveStreet && isFlopStreet" class="street-hint">
                          {{ t('handbook.draws.turnOnlyHint') }}
                        </span>
                      </div>
                      <p class="rule-note">{{ t('t2rNote') }}</p>
                    </div>
                  </div>

                  <div class="math-coach-tip clean-outs-warning">
                    <span class="tip-title text-danger" style="color: #ff6b6e;">{{ t('cleanOutsTitle') }}</span>
                    {{ t('cleanOutsText') }}
                  </div>
                </div>

                <!-- Outs wins Card -->
                <div class="educational-card">
                  <h4 class="card-title">
                    <span>⚠️</span> {{ t('handbook.draws.outsWinsTitle') }}
                  </h4>
                  <p class="card-body">{{ t('handbook.draws.outsWinsBody') }}</p>
                </div>

                <!-- Made Hand vs Draw Card -->
                <div class="educational-card">
                  <h4 class="card-title">
                    <span>⚔️</span> {{ t('handbook.draws.madeHandVsDrawTitle') }}
                  </h4>
                  <p class="card-body">{{ t('handbook.draws.madeHandVsDrawBody') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 4: BOARD -->
          <div v-else-if="activeTab === 'board'" class="math-cheat-sheet animate-fadeIn">
            <!-- Deciding tagline -->
            <div class="tab-decide-banner">
              <span class="decide-icon">💡</span>
              <div class="decide-text-container">
                <span class="decide-banner-title">{{ t('thinkingFrameworkTitle') }}</span>
                <ul class="decide-questions-list">
                  <li>• {{ t('boardQ1') }}</li>
                  <li>• {{ t('boardQ2') }}</li>
                  <li>• {{ t('boardQ3') }}</li>
                </ul>
              </div>
            </div>

            <div v-if="!isPostflopReady" class="postflop-empty-state">
              <div class="empty-state-content">
                <span class="empty-state-icon">🔒</span>
                <h3>{{ t('postflopLockedTitle') }}</h3>
                <p class="desc">{{ t('postflopLockedDesc') }}</p>
              </div>
            </div>

            <div v-else class="board-analyzer-container">
              <div class="board-analyzer-grid">
                <!-- Card A: Board Reading / 牌面阅读 -->
                <div class="board-card explanation-card reading-card">
                  <div class="math-card-header">
                    <span class="math-card-icon">📖</span>
                    <div class="math-card-header-text">
                      <h3>{{ t('boardReadingTitle') }}</h3>
                      <p class="math-card-desc">{{ t('boardReadingDesc') }}</p>
                    </div>
                  </div>
                  
                  <div class="coach-explanation-header">
                    <h4 class="explanation-title">{{ coachExplanation.summaryTitle }}</h4>
                    <p class="explanation-summary">{{ coachExplanation.oneLineSummary }}</p>
                    
                    <!-- Localized tags -->
                    <div class="explanation-tags">
                      <span v-for="tag in coachExplanation.tags" :key="tag" class="explanation-tag-pill">
                        {{ tag }}
                      </span>
                    </div>
                  </div>

                  <div class="explanation-sections">
                    <div class="explanation-section">
                      <span class="section-subtitle">{{ t('whatWeSeeTitle') }}</span>
                      <ul class="explanation-list">
                        <li v-for="item in coachExplanation.whatWeSee" :key="item">{{ item }}</li>
                      </ul>
                    </div>

                    <div class="explanation-section">
                      <span class="section-subtitle">{{ t('whyItMattersTitle') }}</span>
                      <ul class="explanation-list">
                        <li v-for="item in coachExplanation.whyItMatters" :key="item">{{ item }}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- Card B: Decision Lens / 决策视角 -->
                <div class="board-card explanation-card lens-card">
                  <div class="math-card-header">
                    <span class="math-card-icon">🔍</span>
                    <div class="math-card-header-text">
                      <h3>{{ t('decisionLensTitle') }}</h3>
                      <p class="math-card-desc">{{ t('decisionLensDesc') }}</p>
                    </div>
                  </div>

                  <div class="explanation-sections">
                    <div class="explanation-section">
                      <span class="section-subtitle">{{ t('howToThinkTitle') }}</span>
                      <ul class="explanation-list accent-list">
                        <li v-for="item in coachExplanation.howToThink" :key="item">{{ item }}</li>
                      </ul>
                    </div>

                    <div v-if="coachExplanation.warnings && coachExplanation.warnings.length > 0" class="explanation-section warning-section">
                      <span class="section-subtitle warning-text">{{ t('warningsTitle') }}</span>
                      <ul class="explanation-list warning-list">
                        <li v-for="item in coachExplanation.warnings" :key="item">{{ item }}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Card Picker Modal Popup Overlay -->
    <Transition name="modal-fade">
      <div v-if="showCardPicker" class="picker-modal-overlay" @click.self="closeCardPicker">
        <div class="picker-modal-content animate-scaleIn">
          <button class="picker-close-btn" @click="closeCardPicker" aria-label="Close picker">&times;</button>
          <h3 class="picker-title">{{ t('pickerTitle') }}</h3>
          <p class="picker-subtitle">
            {{ activeSlotType === 'hero' ? t('pickerHeroSub') : t('pickerBoardSub') }}
          </p>

          <!-- Grid -->
          <div class="picker-grid">
            <div class="picker-header-row">
              <div class="picker-header-cell rank-label"></div>
              <div 
                v-for="suit in allSuits" 
                :key="suit.name" 
                class="picker-header-cell suit-header"
                :class="suit.color"
              >
                {{ suit.symbol }}
              </div>
            </div>

            <div 
              v-for="rank in allRanks" 
              :key="rank" 
              class="picker-row"
            >
              <div class="picker-cell rank-label">{{ rank }}</div>
              <div 
                v-for="suit in allSuits" 
                :key="suit.name" 
                class="picker-cell card-option"
                :class="[suit.color, { disabled: isCardUnavailable(rank + suit.code) }]"
                @click="!isCardUnavailable(rank + suit.code) && selectCard(rank + suit.code)"
              >
                <span class="card-option-text">{{ rank }}{{ suit.symbol }}</span>
              </div>
            </div>
          </div>

          <div class="picker-actions">
            <button class="picker-btn clear-btn" @click="selectCard(null)">{{ t('clearCard') }}</button>
            <button class="picker-btn cancel-btn" @click="closeCardPicker">{{ t('cancel') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useOnlineStore } from '@/stores/online'
import { normalizeCard } from '@/utils/cardFormat'
import { evaluateHoldemHand } from '@/utils/pokerEvaluator'
import CardView from '@/components/online/CardView.vue'

const dictionary = {
  en: {
    badge: 'POSTSOMA · DECISION GUIDE',
    title: 'Tactical Handbook',
    guide: 'Guide',
    motto: 'Poker is not only about luck. Every hand is a decision under uncertainty. This guide does not tell you the "correct move". It teaches you what to look at before making a decision: your hand, the board, your outs, the price, and the risk.',
    thinkingFrameworkTitle: 'Thinking Framework',
    preflopQ1: 'Can I enter the hand?',
    preflopQ2: 'How playable is this hand heads-up?',
    preflopQ3: 'What line fits this spot: raise, call, or fold?',
    mathQ1: 'Is the price good?',
    mathQ2: 'What do I need to pay?',
    mathQ3: 'Is my chance to improve higher than the required equity?',
    drawsQ1: 'What can improve me?',
    drawsQ2: 'How many clean outs do I have?',
    drawsQ3: 'How often do I improve by the river?',
    boardQ1: 'What does this board change?',
    boardQ2: 'Who might this board help?',
    boardQ3: 'What should I be careful about?',
    boardReadingTitle: 'Board Reading',
    boardReadingDesc: 'What the current community cards tell us about the situation.',
    decisionLensTitle: 'Decision Lens',
    decisionLensDesc: 'How to frame your thinking and identify potential traps.',
    whatWeSeeTitle: 'What We See',
    whyItMattersTitle: 'Why It Matters',
    howToThinkTitle: 'How To Think',
    warningsTitle: 'Warnings',
    texture_trips: 'Trip Board',
    guideTitle: 'Preflop Matrix Quick Guide',
    guidePoint1: '• Pairs (e.g., AA, KK) lie on the diagonal.',
    guidePoint2: '• Suited hands ending with \'s\' (e.g., AKs) lie in the top-right.',
    guidePoint3: '• Offsuit hands ending with \'o\' (e.g., AKo) lie in the bottom-left.',
    guideRaise: 'Red (Raise): Take the aggressive line.',
    guideCall: 'Green (Call/Limp): Take the defensive line.',
    guideFold: 'Black (Fold): Save your stack.',
    tabPreflop: 'Preflop',
    tabMath: 'Math',
    tabDraws: 'Draws',
    tabBoard: 'Board',
    decidePreflop: 'What this helps you decide: Your baseline preflop opening and defending strategies based on position and hand strength to avoid entry mistakes.',
    decideMath: 'What this helps you decide: Whether a call is mathematically profitable based on pot odds and required equity.',
    decideDraws: 'What this helps you decide: How likely you are to hit your draw on future streets, using standard poker calculations.',
    decideBoard: 'What this helps you decide: Analyzing board texture changes and runouts to predict opponent ranges.',
    sbButton: 'SB (Button)',
    bbBigBlind: 'BB (Big Blind)',
    openRaiseRfi: 'Open-Raise / RFI',
    defendVsSbOpen: 'Defend vs SB Open (2.5x)',
    legendRaise: 'Raise',
    legendCall: 'Call/Limp',
    legendFold: 'Fold',
    placeholder: '👉 Click or hover any cell in the matrix to view GTO coaching action weights & real-time tactical advice.',
    coachInsight: 'COACH INSIGHT',
    pocketPair: 'Pocket Pair',
    suitedHand: 'Suited Hand',
    offsuitHand: 'Offsuit Hand',
    mathTitle: 'Call Decision Console',
    mathDesc: 'Verify if calling a postflop bet is profitable in the long run.',
    potOddsFormula: 'Pot Odds = Risk / (Risk + Reward)',
    riskLabel: 'Risk (Chips to Call):',
    riskDesc: 'Chips to call.',
    rewardLabel: 'Reward (Total Pot):',
    rewardDesc: 'Chips currently in pot + opponent bet.',
    requiredEquityLabel: 'Required Equity:',
    requiredEquityDesc: 'Pot Odds converted to %, the minimum win percentage needed to break even.',
    exampleTitle: '💡 WORKED EXAMPLE (Standard 1v1 Spot)',
    examplePot: 'Pot:',
    exampleOppBet: 'Opponent\'s Bet:',
    exampleRisk: 'Your Risk to Call:',
    exampleReward: 'Total Reward:',
    exampleMath: 'The Math:',
    actualEqGteReq: 'Actual Equity ≥ Required Equity',
    actualEqLtReq: 'Actual Equity < Required Equity',
    profitableCall: '👉 Profitable CALL (+EV)',
    profitableFold: 'Calling is unfavorable by direct odds / Folding avoids a negative-EV call',
    mathGoldenRuleTitle: '⚡ TACTICAL GOLDEN RULE:',
    mathGoldenRuleText: 'Required Equity is simply your Pot Odds converted into a percentage. If your actual win chance (e.g. 35% Flush Draw) is higher than the minimum win chance required (e.g. 25%), calling is mathematically guaranteed to print money in the long run!',
    uncertaintyTitle: 'Decision Under Uncertainty',
    uncertaintyDesc: 'Poker is not gambling if played with math.',
    uncertaintyP1: 'Every bet or call you make represents a transaction with risk and return. By using Outs to calculate your Actual Equity, and comparing it against Pot Odds, you transform guesswork into a structured financial decision.',
    goDrawsLink: '💡 Go to the Draws Tab to learn how to calculate your Outs and Actual Equity!',
    drawsTitle: 'Common Draw Odds',
    drawsDesc: 'Chances of hitting your draw based on your Outs (remaining winning cards in the deck).',
    thDraw: 'Draw',
    thOuts: 'Outs',
    thF2T: 'F→T',
    thT2R: 'T→R',
    thF2R: 'F→R',
    drawPair: 'Pocket Pair to Set',
    drawPairDesc: 'Pairs below board (e.g. 55 on Q-9-2)',
    drawGutshot: 'Gutshot Straight Draw',
    drawGutshotDesc: 'QJ on 9-8-2 (needs a Ten)',
    drawOvercards: 'Two Overcards',
    drawOvercardsDesc: 'AK on Q-7-2 (needs A or K)',
    drawOesd: 'OESD (Open-Ended)',
    drawOesdDesc: 'JT on 9-8-2 (needs Q or 7)',
    drawFlush: 'Flush Draw',
    drawFlushDesc: 'Two cards of same suit on flop',
    drawCombo12: 'Combo Draw (12 Outs)',
    drawCombo12Desc: 'e.g. Flush + Gutshot',
    drawCombo15: 'Monster Combo (15 Outs)',
    drawCombo15Desc: 'OESD + Flush Draw',
    rule24Title: 'Rule of 2 and 4',
    rule24Desc: 'Quick mental math to estimate equity on the fly.',
    f2rCalc: 'Outs × 4 %',
    f2rNote: 'Use on the Flop when estimating the total chance of hitting by the River.',
    t2rCalc: 'Outs × 2 %',
    t2rNote: 'Use on the Turn when only one card is left to deal.',
    cleanOutsTitle: '⚠️ CLEAN OUTS WARNING:',
    cleanOutsText: 'Not all outs are clean. If hitting one of your out cards completes a stronger hand (like a flush or higher straight) for your opponent, that card is a dirty out. You must discount these from your calculations.',
    'handbook.draws.linkageProfitable': '✅ Profitable Call: Current Draw Equity {draw} > Required Equity {req}, mathematically supports calling.',
    'handbook.draws.linkageUnprofitable': '❌ Direct odds are unfavorable: your draw equity {draw} is below the required equity {req}. Without implied odds or strategic reasons, folding is usually more disciplined.',
    'handbook.draws.linkageNeedsInput': '💡 Go to Math tab and input pot data to receive calling advice.',
    'handbook.draws.flopOnlyHint': '(Flop only)',
    'handbook.draws.turnOnlyHint': '(Turn only)',
    'handbook.draws.strongMadeTitle': 'Strong Made Hand, No Draw Needed',
    'handbook.draws.strongMadePoint1': 'Your opponent may hold a second-best hand; charge them the wrong price to continue.',
    'handbook.draws.strongMadePoint2': 'On coordinated boards (flush/straight draws), consider betting or raising instead of checking.',
    'handbook.draws.strongMadePoint3': 'Based on your opponent\'s calling range, decide between thin or thick value bets.',
    'handbook.preflop.positionTitle': 'Why Position Matters',
    'handbook.preflop.positionBody': 'In heads-up poker, the small blind/button acts first preflop but has position postflop.\nActing last gives you more information before deciding whether to bet, call, or control the pot.\nThis is why the Button/SB can open wider, while the BB defends with a price but often plays out of position postflop.',
    'handbook.math.betSizeTitle': 'How Bet Size Changes the Decision',
    'handbook.math.betSizeBody': 'The larger the bet, the more equity you need to continue.\nThe same draw may be profitable against a small bet but unprofitable against a large bet.\nExample: Pot 100, call 25 needs about 16.7% equity; call 100 needs about 33.3% equity.',
    'handbook.math.impliedOddsTitle': 'What Are Implied Odds?',
    'handbook.math.impliedOddsBody': 'Sometimes direct pot odds are not enough.\nBut if you can win more chips later when you hit, calling may still have a reason.\nThis is called implied odds.\nDo not overuse implied odds: if your opponent will not pay later, or your outs are not clean, implied odds can be overestimated.',
    'handbook.draws.outsWinsTitle': 'Outs Do Not Always Mean Wins',
    'handbook.draws.outsWinsBody': 'An out improves your hand, but it does not guarantee you win.\nIf a card also completes a stronger hand for your opponent, it may be a dirty out.\nFor example, a low flush can lose to a higher flush; on paired boards, a completed flush can still lose to a full house.',
    'handbook.draws.madeHandVsDrawTitle': 'Made Hand vs Draw',
    'handbook.draws.madeHandVsDrawBody': 'Made Hand: already has showdown value, such as pair, two pair, or trips.\nDraw: may be behind now, but can improve on the turn or river.\nMade hands often think about protection and value; draws focus more on outs, pot odds, and implied odds.',
    'handbook.draws.linkageNeedsInput': '💡 Go to Math tab and input pot data to receive calling advice.',
    'handbook.draws.flopOnlyHint': '(Flop only)',
    'handbook.draws.turnOnlyHint': '(Turn only)',
    'handbook.heroHandHelperNote': '* Click chart to load default suits, click slot to change.',
    boardTitle: 'Postflop Board Textures',
    boardComingSoon: 'Coming Soon',
    boardDesc: 'We are developing a real-time board analyzer to help you classify board textures (wet, dry, static, dynamic) and understand range advantage shifts.',
    postflopLockedTitle: 'Postflop Analysis Locked',
    postflopLockedDesc: 'Add the flop to unlock postflop analysis.',
    heroHandLabel: 'Hero Hand',
    boardFlopLabel: 'Board (Flop)',
    syncLive: 'Sync Live Game',
    syncLiveTooltip: 'Reset to current live game cards',
    potSizeInputLabel: 'Pot Size ($)',
    callAmountInputLabel: 'Call Amount ($)',
    highestDrawLabel: 'Highest Draw Detected',
    drawEquityLabel: 'Draw Equity (to River)',
    noMajorDraw: 'No major draw',
    coachAdviceTitle: 'MATHEMATICAL GUIDANCE',
    callingReasonable: 'Calling may be mathematically reasonable if other risks are acceptable.',
    callingUnprofitable: 'Calling is mathematically unprofitable based on direct odds alone.',
    addPotAndCall: 'Add pot and call amount to compare against pot odds.',
    activeDrawsTitle: 'Current Hand Draws',
    activeDrawsDesc: 'Draws and outs calculated dynamically for your input hand.',
    referenceTableTitle: 'Common Draw Reference Table',
    noDrawsDetected: 'No major draws detected (straight, flush, or set mining).',
    dirtyOutsWarningText: 'Some outs might complete a stronger opponent hand.',
    drawNutFlush: 'Nut Flush Draw',
    boardTextureTitle: 'Board Texture Analysis',
    boardTextureDesc: 'Dynamic classification of the public board texture and runout.',
    boardTextureLabel: 'Texture Classification',
    pairedBoard: 'Paired Board',
    monotoneBoard: 'Monotone Board',
    twoToneBoard: 'Two-Tone Board',
    rainbowBoard: 'Rainbow Board',
    connectedBoard: 'Connected Board',
    boardTacticalTitle: 'Tactical Context',
    boardTacticalDesc: 'Strategic overview of range advantages and draws.',
    flushDrawsLabel: 'Flush Potential',
    straightDrawsLabel: 'Straight Potential',
    coachBoardInsight: 'Coach Insight',
    yesFlushDraw: 'Flush draws possible (2+ suited)',
    noFlushDraw: 'No flush draws (Rainbow)',
    yesStraightDraw: 'Straight draws possible (connected)',
    noStraightDraw: 'No straight draws (disconnected)',
    texture_wet: 'Wet Board',
    texture_semiWet: 'Semi-Wet Board',
    texture_dry: 'Dry Board',
    badgeOuts: 'Outs',
    badgeRequired: 'Required',
    needsPotBadge: 'Needs Pot',
    pickerTitle: 'Card Picker',
    pickerHeroSub: 'Select card for your hand',
    pickerBoardSub: 'Select card for the flop',
    clearCard: 'Clear Slot',
    cancel: 'Cancel'
  },
  zh: {
    badge: 'POSTSOMA · 决策指南',
    title: '战术手册',
    guide: '指南',
    motto: '扑克不仅仅关乎运气。每一手牌都是在不确定性下的决策。这个指南不会直接告诉你“标准答案”。它教你在做决定前应该先看什么：你的手牌、公共牌、补牌、跟注成本和风险。',
    thinkingFrameworkTitle: '思考框架',
    preflopQ1: '我能不能进入这手牌？',
    preflopQ2: '这手牌在单挑里可玩性如何？',
    preflopQ3: '这里更适合加注、跟注还是弃牌？',
    mathQ1: '这个价格划算吗？',
    mathQ2: '我需要付出多少？',
    mathQ3: '我的成牌概率是否高于所需胜率？',
    drawsQ1: '什么牌能让我变强？',
    drawsQ2: '我有多少干净补牌？',
    drawsQ3: '到河牌前有多大机会改善？',
    boardQ1: '这张牌面改变了什么？',
    boardQ2: '它可能更帮助谁？',
    boardQ3: '我需要警惕什么？',
    boardReadingTitle: '牌面阅读',
    boardReadingDesc: '从当前的公共牌中我们可以读取出什么信息。',
    decisionLensTitle: '决策视角',
    decisionLensDesc: '如何构建你的思考路径并识别潜在陷阱。',
    whatWeSeeTitle: '当前看到什么',
    whyItMattersTitle: '为什么重要',
    howToThinkTitle: '应该怎么思考',
    warningsTitle: '警惕风险',
    texture_trips: '公共三条',
    guideTitle: '翻前矩阵快速指南',
    guidePoint1: '• 对子手牌（例如 AA、KK）分布在对角线上。',
    guidePoint2: '• 同花手牌以 \'s\' 结尾（例如 AKs），位于右上方。',
    guidePoint3: '• 不同花手牌以 \'o\' 结尾（例如 AKo），位于左下方。',
    guideRaise: '红色 (加注): 主动加注。',
    guideCall: '绿色 (跟注/跟入): 防守型跟注。',
    guideFold: '黑色 (弃牌): 弃牌保护筹码。',
    tabPreflop: '翻前',
    tabMath: '赔率',
    tabDraws: '听牌',
    tabBoard: '牌面',
    decidePreflop: '帮助你决策：基于位置与起手牌强度的翻牌前动作基准，避免盲目入池。',
    decideMath: '帮助你决策：根据底池赔率与所需胜率，计算长期看跟注是否能够盈利。',
    decideDraws: '帮助你决策：基于你的补牌数（Outs），估算在转牌或河牌圈击中听牌的概率，用数学代替直觉。',
    decideBoard: '帮助你决策：分析公共牌结构与发牌走向，预测对手的范围分布与胜率变化。',
    sbButton: 'SB (小盲/庄家)',
    bbBigBlind: 'BB (大盲)',
    openRaiseRfi: '开池加注 / RFI',
    defendVsSbOpen: '防守对抗 SB 开池 (2.5x)',
    legendRaise: '加注',
    legendCall: '跟注/跟入',
    legendFold: '弃牌',
    placeholder: '👉 点击或悬停矩阵中的任意格子，查看 GTO 动作权重与即时战术建议。',
    coachInsight: '教练建议',
    pocketPair: '口袋对子',
    suitedHand: '同花手牌',
    offsuitHand: '不同花手牌',
    mathTitle: '跟注决策控制台',
    mathDesc: '验证在长期博弈中，跟注对手的下注在数学期望上是否盈利。',
    potOddsFormula: '底池赔率 = 跟注成本 / (跟注成本 + 可赢底池)',
    riskLabel: '跟注成本 (Risk):',
    riskDesc: '跟注需要投入的筹码量。',
    rewardLabel: '可赢底池 (Reward):',
    rewardDesc: '当前底池已有的筹码总数（底池 + 对手下注）。',
    requiredEquityLabel: '所需最低胜率:',
    requiredEquityDesc: '底池赔率转换为百分比，即保本所需的最低赢牌概率。',
    exampleTitle: '💡 算例 (标准单挑场景)',
    examplePot: '底池:',
    exampleOppBet: '对手下注:',
    exampleRisk: '你的跟注风险/成本:',
    exampleReward: '可赢底池/总回报:',
    exampleMath: '数学计算:',
    actualEqGteReq: '实际胜率 ≥ 所需最低胜率',
    actualEqLtReq: '实际胜率 < 所需最低胜率',
    profitableCall: '👉 跟注盈利 (+EV)',
    profitableFold: '跟注在直接赔率上不利 / 弃牌避免一次负期望跟注。',
    mathGoldenRuleTitle: '⚡ 战术黄金法则:',
    mathGoldenRuleText: '所需最低胜率正是底池赔率转换为百分比的形式。如果你手牌的实际成牌概率（例如 35% 同花听牌）高于跟注所需的最低胜率（例如 25%），那么在长期来看，跟注是数学上能必定盈利的决策！',
    uncertaintyTitle: '不确定性下的决策科学',
    uncertaintyDesc: '依靠数学做决策时，扑克绝非赌博。',
    uncertaintyP1: '你的每一次下注或跟注都是一笔伴随风险与收益的交易。通过使用补牌估算你的实际成牌概率，并与底池赔率进行对比，你可以将盲目猜测转化为严谨的期望值决策。',
    goDrawsLink: '💡 导航到 听牌 标签页，学习如何计算补牌数与实际胜率！',
    drawsTitle: '常见听牌胜率表',
    drawsDesc: '基于你的补牌数估算在不同阶段成牌的概率。',
    thDraw: '听牌类型',
    thOuts: '补牌',
    thF2T: '翻→转',
    thT2R: '转→河',
    thF2R: '翻→河',
    drawPair: '口袋对子中暗三',
    drawPairDesc: '低于公共牌的对子 (例如 55 在 Q-9-2 牌面)',
    drawGutshot: '内卡顺子听牌',
    drawGutshotDesc: 'QJ 在 9-8-2 (需要一张十)',
    drawOvercards: '两张高牌',
    drawOvercardsDesc: 'AK 在 Q-7-2 (需要 A 或 K)',
    drawOesd: '两头顺子听牌 (OESD)',
    drawOesdDesc: 'JT 在 9-8-2 (需要 Q 或 7)',
    drawFlush: '同花听牌',
    drawFlushDesc: '翻牌圈两张同花且手牌两张同花',
    drawCombo12: '组合听牌 (12张补牌)',
    drawCombo12Desc: '例如 同花听牌 + 卡顺听牌',
    drawCombo15: '超强组合听牌 (15张补牌)',
    drawCombo15Desc: '同花听牌 + 两头顺子听牌',
    rule24Title: '二四法则',
    rule24Desc: '实战中快速脑算估算成牌概率的口诀。',
    f2rCalc: '补牌数 × 4 %',
    f2rNote: '适用于翻牌圈，估算到河牌时的总成牌概率。',
    t2rCalc: '补牌数 × 2 %',
    t2rNote: '适用于转牌圈，估算发最后一张河牌时的成牌概率。',
    cleanOutsTitle: '⚠️ 干净补牌说明:',
    cleanOutsText: '并非所有补牌都是干净的。如果某张补牌在让你成牌的同时，也完成了对手更强的手牌（如更高顺子或同花），那这就是一张“脏补牌”，计算胜率时必须打折或扣除。',
    'handbook.draws.linkageProfitable': '✅ 跟注有利：当前听牌胜率 {draw} > 所需胜率 {req}，数学上支持跟注',
    'handbook.draws.linkageUnprofitable': '❌ 直接赔率不利：当前听牌胜率 {draw} < 所需最低胜率 {req}。如果没有隐含赔率或策略理由，弃牌通常更稳妥。',
    'handbook.draws.linkageNeedsInput': '💡 前往赔率标签输入底池数据，即可获得跟注建议',
    'handbook.draws.flopOnlyHint': '(翻牌圈再用)',
    'handbook.draws.turnOnlyHint': '(转牌圈再用)',
    'handbook.draws.strongMadeTitle': '当前是强成牌，无需追牌',
    'handbook.draws.strongMadePoint1': '对手也可能持有次强成牌，你的目标是让他以错误赔率跟注。',
    'handbook.draws.strongMadePoint2': '有听牌可能的牌面（同花面/连接面），考虑 Bet / Raise 而非 Check。',
    'handbook.draws.strongMadePoint3': '根据对手跟注范围，选择薄价值下注还是超价值下注。',
    'handbook.preflop.positionTitle': '位置为什么重要？',
    'handbook.preflop.positionBody': '在单挑中，小盲/庄家翻前先行动，但翻后有位置优势。\n有位置的一方可以最后看到对手行动，再决定下注、跟注或控制底池。\n所以 Button/SB 可以玩更宽的范围；BB 虽然已经投入盲注，但翻后通常处于不利位置。',
    'handbook.math.betSizeTitle': '下注尺度如何改变决策？',
    'handbook.math.betSizeBody': '下注越大，你需要支付的跟注成本越高，所需胜率也越高。\n同样一副听牌，面对小注可能可以跟注，面对大注可能就不划算。\n例子：底池 100，跟注 25 需要约 16.7% 胜率；跟注 100 需要约 33.3% 胜率。',
    'handbook.math.impliedOddsTitle': '什么是隐含赔率？',
    'handbook.math.impliedOddsBody': '有时候直接底池赔率不够，但如果你成牌后有机会从对手那里赢到更多筹码，跟注仍可能有理由。\n这叫隐含赔率。\n不要滥用隐含赔率：如果对手不会继续支付，或你的补牌不是干净补牌，隐含赔率会被高估。',
    'handbook.draws.outsWinsTitle': '补牌 ≠ 一定赢牌',
    'handbook.draws.outsWinsBody': '补牌只是让你的牌变强的牌，不代表一定获胜。\n如果某张补牌同时可能完成对手更强的牌，它就是“脏补牌”。\n例如低同花可能输给更高同花；成对牌面上，完成同花也可能输给葫芦。',
    'handbook.draws.madeHandVsDrawTitle': '成牌 vs 听牌',
    'handbook.draws.madeHandVsDrawBody': '成牌：现在已经有摊牌价值，例如一对、两对、三条。\n听牌：现在可能还落后，但有机会在转牌或河牌变强。\n成牌更关注保护和价值下注；听牌更关注补牌、底池赔率 and 隐含赔率。',
    'handbook.draws.linkageNeedsInput': '💡 前往赔率标签输入底池数据，即可获得跟注建议',
    'handbook.draws.flopOnlyHint': '(翻牌圈再用)',
    'handbook.draws.turnOnlyHint': '(转牌圈再用)',
    'handbook.heroHandHelperNote': '* 点击图表可载入默认花色，点槽位可微调',
    boardTitle: '翻后牌面结构分析',
    boardComingSoon: '即将推出',
    boardDesc: '我们正在开发实时公共牌面分析器，帮助你分类牌面特征（湿润、干燥、静态、动态）并理解范围优势的转移。',
    postflopLockedTitle: '翻后分析已锁定',
    postflopLockedDesc: '加入公共牌后，可以解锁翻后分析。',
    heroHandLabel: '你的手牌',
    boardFlopLabel: '公共牌 (翻牌)',
    syncLive: '同步实时牌局',
    syncLiveTooltip: '重置为当前实时牌局的手牌和公牌',
    potSizeInputLabel: '底池大小 ($)',
    callAmountInputLabel: '跟注金额 ($)',
    highestDrawLabel: '检测到的最强听牌',
    drawEquityLabel: '听牌胜率 (到河牌)',
    noMajorDraw: '无主要听牌',
    coachAdviceTitle: '数学决策指导',
    callingReasonable: '如果额外风险可接受，跟注在数学上可能合理。',
    callingUnprofitable: '仅从直接赔率来看，跟注在数学上不合理。',
    addPotAndCall: '输入底池和跟注金额后，可以比较底池赔率。',
    activeDrawsTitle: '当前手牌听牌分析',
    activeDrawsDesc: '根据你输入的手牌与公牌实时计算的成牌概率。',
    referenceTableTitle: '标准听牌参考表',
    noDrawsDetected: '未检测到主要听牌 (如顺子、同花或暗三)。',
    dirtyOutsWarningText: '部分补牌可能会帮助对手完成更强牌型。',
    drawNutFlush: '坚果同花听牌',
    boardTextureTitle: '牌面结构分析',
    boardTextureDesc: '基于公共牌结构的实时牌面特征分类。',
    boardTextureLabel: '结构分类',
    pairedBoard: '对子牌面',
    monotoneBoard: '单色同花牌面',
    twoToneBoard: '双色牌面',
    rainbowBoard: '彩虹牌面',
    connectedBoard: '连牌牌面',
    boardTacticalTitle: '战术背景',
    boardTacticalDesc: '范围优势与听牌的战术解读。',
    flushDrawsLabel: '同花潜力',
    straightDrawsLabel: '顺子潜力',
    coachBoardInsight: '教练建议',
    yesFlushDraw: '存在同花听牌可能 (2张及以上同色)',
    noFlushDraw: '无同花听牌 (彩虹牌面)',
    yesStraightDraw: '存在顺子听牌可能 (连牌)',
    noStraightDraw: '无顺子听牌 (散牌)',
    texture_wet: '湿润牌面',
    texture_semiWet: '半湿润牌面',
    texture_dry: '干燥牌面',
    badgeOuts: '张补牌',
    badgeRequired: '最低需胜率',
    needsPotBadge: '需底池',
    pickerTitle: '选择扑克牌',
    pickerHeroSub: '选择你的手牌',
    pickerBoardSub: '选择翻牌公共牌',
    clearCard: '清除该槽',
    cancel: '取消'
  }
}

const getBrowserLanguage = () => {
  const saved = localStorage.getItem('postsoma_decision_guide_lang')
  if (saved === 'en' || saved === 'zh') return saved
  const navLang = navigator.language || navigator.userLanguage || ''
  if (navLang.startsWith('zh')) return 'zh'
  return 'en'
}

const currentLang = ref(getBrowserLanguage())

const setLanguage = (lang) => {
  currentLang.value = lang
  localStorage.setItem('postsoma_decision_guide_lang', lang)
}

const t = (key) => {
  return dictionary[currentLang.value]?.[key] || dictionary['en'][key] || key
}

const getComboFullTypeNameKey = (combo) => {
  if (combo.length === 2) return 'pocketPair'
  return combo.endsWith('s') ? 'suitedHand' : 'offsuitHand'
}

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

const activeTab = ref('preflop')
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
  const lang = currentLang.value
  
  if (currentSpot.value === 'sb_open') {
    if (weights[0] === 100) {
      if (meta.val1 >= 10 && meta.type === 'pair') {
        return lang === 'en'
          ? `${combo} is a premier pocket pair. Open-raise 100% of the time to build a pot immediately.`
          : `${combo} 是顶级口袋对，100% 频率开池加注，立即做大底池。`
      }
      if (meta.val1 === 14) {
        return lang === 'en'
          ? `Suited Ace ${combo} plays incredibly well postflop. Mandatory raise to seize initiative.`
          : `同花 A ${combo} 翻牌后极具操作性，强制加注以夺取主动权。`
      }
      return lang === 'en'
        ? `${combo} is a strong open-raise hand in heads-up. Push your equity edge and raise.`
        : `${combo} 是单挑中强力的开池加注手牌。推满胜率优势并加注。`
    }
    if (weights[1] > 0) {
      return lang === 'en'
        ? `${combo} is a medium-strength marginal hand. Mix raise and limp to protect your limping range and play a small pot.`
        : `${combo} 是中等强度的边际牌。混合加注与跟入以保护你的跟入范围，并玩一个小底池。`
    }
    return lang === 'en'
      ? `${combo} is too weak to play profitably in Heads-Up even with position. Fast fold.`
      : `${combo} 太弱，即使有位置也无法在单挑中实现盈利。快速弃牌。`
  } else {
    if (weights[0] >= 80) {
      if (meta.val1 >= 11 && meta.type === 'pair') {
        return lang === 'en'
          ? `JJ+ represents a dominant preflop premium. 3-bet high frequency for value and stack protection.`
          : `JJ+ 代表翻前绝对统治力。高频 3-bet 以获取价值和保护筹码。`
      }
      if (meta.val1 === 14 && meta.val2 === 5) {
        return lang === 'en'
          ? `A5s is the ultimate 3-bet bluff card; it blocks AA/AK and possesses great wheel equity.`
          : `A5s 是极佳的 3-bet 诈唬牌；阻断了 AA/AK 且具备良好的顺子/同花潜力。`
      }
      return lang === 'en'
        ? `3-bet ${combo} to put maximum pressure on SB's wide opening range.`
        : `3-bet ${combo} 对 SB 宽广的开池范围施加最大压力。`
    }
    if (weights[0] > 0 && weights[1] > 0) {
      return lang === 'en'
        ? `${combo} sits right on the threshold. Mix between 3-bet bluffs and defensive calling to stay unexploitable.`
        : `${combo} 处于边缘地带。在 3-bet 诈唬和防守跟注之间进行混合，保持不可被剥削。`
    }
    if (weights[1] === 100) {
      if (meta.type === 'pair') {
        return lang === 'en'
          ? `Pocket pair ${combo} has great set-mining value. Call and seek a set on the flop.`
          : `口袋对 ${combo} 具有极高的中暗三价值。跟注并在翻牌圈寻找暗三机会。`
      }
      if (meta.type === 'suited') {
        return lang === 'en'
          ? `Suited ${combo} has strong flush and straight equity. Perfect candidate for calling to play postflop.`
          : `同花 ${combo} 具有极强的同花与顺子权益。非常适合跟注进入翻牌后。`
      }
      return lang === 'en'
        ? `Flat call with ${combo} to defend your big blind in-position against a wide SB open.`
        : `用 ${combo} 平跟，利用位置优势防守大盲，对抗 SB 宽广的开池。`
    }
    return lang === 'en'
      ? `${combo} is too weak to defend out-of-position against a raise. Safe fold.`
      : `${combo} 太弱，无法在不利位置防守对抗加注。安全弃牌。`
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

// ─── POSTFLOP DYNAMIC SYSTEM STATE & LOGIC ───
const onlineStore = useOnlineStore()

const heroHandInputRef = ref(null)
const highlightOddsInput = ref(false)
const loadNoticeText = ref('')
let highlightTimeoutId = null

const comboToDefaultCards = (combo) => {
  if (!combo || combo.length < 2) return [null, null]
  const mapRank = (char) => char === 'T' ? '10' : char
  const r1 = mapRank(combo[0])
  const r2 = mapRank(combo[1])
  if (combo.length === 2) {
    return [`${r1}S`, `${r2}H`]
  }
  if (combo.endsWith('s')) {
    return [`${r1}S`, `${r2}S`]
  }
  if (combo.endsWith('o')) {
    return [`${r1}S`, `${r2}H`]
  }
  return [null, null]
}

const loadComboIntoOdds = (combo) => {
  const [c1, c2] = comboToDefaultCards(combo)
  coachState.value.heroCards = [c1, c2]
  if (currentLang.value === 'zh') {
    loadNoticeText.value = `已从图表载入: ${combo}`
  } else {
    loadNoticeText.value = `Loaded from chart: ${combo}`
  }
  activeTab.value = 'math'
  highlightOddsInput.value = true
  if (highlightTimeoutId) {
    clearTimeout(highlightTimeoutId)
  }
  highlightTimeoutId = setTimeout(() => {
    highlightOddsInput.value = false
    loadNoticeText.value = ''
  }, 1500)
  nextTick(() => {
    if (heroHandInputRef.value) {
      heroHandInputRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

const onComboClick = (combo) => {
  hoveredCombo.value = combo
  loadComboIntoOdds(combo)
}

const coachState = ref({
  language: currentLang.value,
  heroCards: [null, null],
  boardCards: [null, null, null],
  pot: null,
  callAmount: null
})

// Sync language
watch(currentLang, (val) => {
  coachState.value.language = val
})

// Resolve cards helper
const toUiFormat = (cardStr) => {
  if (!cardStr) return null
  const normalized = normalizeCard(cardStr)
  return normalized && normalized.valid ? normalized.code : null
}

const syncFromLiveGame = () => {
  if (onlineStore.publicState) {
    coachState.value.pot = onlineStore.publicState.pot || null
    
    const hero = onlineStore.heroPlayer
    const opponent = onlineStore.opponentPlayer
    if (hero && opponent) {
      const heroBet = hero.current_bet || 0
      const oppBet = opponent.current_bet || 0
      if (oppBet > heroBet) {
        coachState.value.callAmount = oppBet - heroBet
      } else {
        coachState.value.callAmount = null
      }
    } else {
      coachState.value.callAmount = null
    }
  } else {
    coachState.value.pot = null
    coachState.value.callAmount = null
  }

  const liveHole = onlineStore.privateState?.hole_cards || []
  const liveCommunity = onlineStore.publicState?.community_cards || []

  coachState.value.heroCards = [null, null]
  for (let i = 0; i < 2; i++) {
    if (liveHole[i]) {
      coachState.value.heroCards[i] = toUiFormat(liveHole[i])
    }
  }

  coachState.value.boardCards = [null, null, null]
  for (let i = 0; i < 3; i++) {
    if (liveCommunity[i]) {
      coachState.value.boardCards[i] = toUiFormat(liveCommunity[i])
    }
  }
}

// Sync on modal open
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    syncFromLiveGame()
  }
})

// Sync on live game changes
watch([
  () => onlineStore.privateState?.hole_cards,
  () => onlineStore.publicState?.community_cards
], () => {
  if (props.modelValue) {
    syncFromLiveGame()
  }
}, { deep: true })

// Check if user manually deviated from live game
const isLiveGameDiff = computed(() => {
  if (!props.modelValue) return false
  
  const liveHole = onlineStore.privateState?.hole_cards || []
  const liveCommunity = onlineStore.publicState?.community_cards || []
  
  // Compare hero cards
  for (let i = 0; i < 2; i++) {
    const liveC = toUiFormat(liveHole[i])
    const localC = coachState.value.heroCards[i]
    if (liveC !== localC) return true
  }

  // Compare board cards (first 3 flop cards)
  for (let i = 0; i < 3; i++) {
    const liveC = toUiFormat(liveCommunity[i])
    const localC = coachState.value.boardCards[i]
    if (liveC !== localC) return true
  }

  // Compare pot and callAmount
  const livePot = onlineStore.publicState?.pot || null
  if (livePot !== coachState.value.pot) return true

  const hero = onlineStore.heroPlayer
  const opponent = onlineStore.opponentPlayer
  let liveCall = null
  if (hero && opponent) {
    const heroBet = hero.current_bet || 0
    const oppBet = opponent.current_bet || 0
    if (oppBet > heroBet) {
      liveCall = oppBet - heroBet
    }
  }
  if (liveCall !== coachState.value.callAmount) return true

  return false
})

// Postflop Input Readiness Check
const isPostflopReady = computed(() => {
  return coachState.value.boardCards.filter(Boolean).length >= 3
})

// Card Picker state & logic
const showCardPicker = ref(false)
const activeSlotType = ref(null) // 'hero' | 'board'
const activeSlotIndex = ref(null) // 0, 1 or 2

const openCardPicker = (type, index) => {
  activeSlotType.value = type
  activeSlotIndex.value = index
  showCardPicker.value = true
}

const closeCardPicker = () => {
  showCardPicker.value = false
  activeSlotType.value = null
  activeSlotIndex.value = null
}

const selectCard = (cardCode) => {
  if (activeSlotType.value === 'hero') {
    coachState.value.heroCards[activeSlotIndex.value] = cardCode
  } else if (activeSlotType.value === 'board') {
    coachState.value.boardCards[activeSlotIndex.value] = cardCode
  }
  closeCardPicker()
}

const clearCard = (type, index) => {
  if (type === 'hero') {
    coachState.value.heroCards[index] = null
  } else if (type === 'board') {
    coachState.value.boardCards[index] = null
  }
}

const selectedCardsSet = computed(() => {
  const set = new Set()
  coachState.value.heroCards.forEach(c => { if (c) set.add(c) })
  coachState.value.boardCards.forEach(c => { if (c) set.add(c) })
  return set
})

const isCardUnavailable = (cardCode) => {
  if (!selectedCardsSet.value.has(cardCode)) return false
  const currentCard = activeSlotType.value === 'hero'
    ? coachState.value.heroCards[activeSlotIndex.value]
    : coachState.value.boardCards[activeSlotIndex.value]
  return cardCode !== currentCard
}

const allRanks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
const allSuits = [
  { name: 'spades', symbol: '♠', code: 'S', color: 'black' },
  { name: 'hearts', symbol: '♥', code: 'H', color: 'red' },
  { name: 'diamonds', symbol: '♦', code: 'D', color: 'red' },
  { name: 'clubs', symbol: '♣', code: 'C', color: 'black' }
]

// ─── BOARD ANALYZER ───
const analyzeBoard = (cards) => {
  const parsed = cards.map(c => normalizeCard(c)).filter(c => c.valid)
  if (parsed.length < 3) {
    return {
      isPaired: false,
      isMonotone: false,
      isTwoTone: false,
      isRainbow: false,
      hasHighCard: false,
      isConnected: false,
      isTrips: false,
      texture: 'dry',
      possibleDraws: { flushPossible: false, straightPossible: false }
    }
  }

  const rankValues = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 }
  
  // 1. Paired check
  const rankCounts = {}
  parsed.forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1 })
  const maxRankCount = Math.max(...Object.values(rankCounts))
  const isPaired = maxRankCount >= 2
  const isTrips = maxRankCount === 3

  // 2. Suit checks
  const suitCounts = {}
  parsed.forEach(c => { suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1 })
  const maxSuitCount = Math.max(...Object.values(suitCounts))
  const uniqueSuitsCount = Object.keys(suitCounts).length
  
  const isMonotone = maxSuitCount === parsed.length
  const isTwoTone = (uniqueSuitsCount === 2 && parsed.length >= 2) || (maxSuitCount === 2 && parsed.length === 3)
  const isRainbow = uniqueSuitsCount === parsed.length

  // 3. High card check (10 or higher)
  const hasHighCard = parsed.some(c => rankValues[c.rank] >= 10)

  // 4. Connectedness and straight draw check
  const sortedVals = parsed.map(c => rankValues[c.rank]).sort((a, b) => a - b)
  
  let straightPossible = false
  let isConnected = false
  
  for (let i = 0; i < sortedVals.length; i++) {
    for (let j = i + 1; j < sortedVals.length; j++) {
      const diff = Math.abs(sortedVals[i] - sortedVals[j])
      if (diff >= 1 && diff <= 4) {
        straightPossible = true
      }
      if (diff >= 1 && diff <= 2) {
        isConnected = true
      }
    }
  }
  
  // Check low straight wheel potential
  if (sortedVals.includes(14)) {
    const sortedValsWithAce1 = [1, ...sortedVals.filter(v => v !== 14)].sort((a, b) => a - b)
    for (let i = 0; i < sortedValsWithAce1.length; i++) {
      for (let j = i + 1; j < sortedValsWithAce1.length; j++) {
        const diff = Math.abs(sortedValsWithAce1[i] - sortedValsWithAce1[j])
        if (diff >= 1 && diff <= 4) {
          straightPossible = true
        }
        if (diff >= 1 && diff <= 2) {
          isConnected = true
        }
      }
    }
  }

  // 5. Texture classification
  let texture = 'dry'
  if (isTrips) {
    texture = 'trips'
  } else if (isMonotone || (isTwoTone && isConnected && hasHighCard)) {
    texture = 'wet'
  } else if (isTwoTone || isConnected || isPaired) {
    texture = 'semiWet'
  } else {
    texture = 'dry'
  }

  return {
    isPaired,
    isMonotone,
    isTwoTone,
    isRainbow,
    hasHighCard,
    isConnected,
    isTrips,
    texture,
    possibleDraws: {
      flushPossible: maxSuitCount >= 2,
      straightPossible
    }
  }
}

const boardAnalysis = computed(() => {
  return analyzeBoard(coachState.value.boardCards)
})

const coachBoardInsightText = computed(() => {
  const analysis = boardAnalysis.value
  const lang = currentLang.value
  
  if (analysis.texture === 'wet') {
    return lang === 'en'
      ? "Wet boards favor the caller's range and contain numerous active straight and flush draws. High variance postflop action is common. Avoid building massive pots without very strong made hands or premium draws."
      : "湿润牌面有利于跟注者的范围，包含大量活跃的顺子和同花听牌。翻牌后动作波动较大。若无强成牌或优质听牌，应避免盲目做大底池。"
  } else if (analysis.texture === 'semiWet') {
    return lang === 'en'
      ? "Semi-wet boards present some backdoor draws and high card value threats. Keep bets sizes balanced and probe for opponent's response before committing massive chips."
      : "半湿润牌面存在部分后门听牌和高牌价值威胁。下注尺度应保持平衡，在投入大量筹码前先试探对手的反应。"
  } else {
    return lang === 'en'
      ? "Dry boards are highly static. Players rarely hit strong draws here, meaning range advantages are stable. Small continuation bets can often take down the pot effectively."
      : "干燥牌面静态特征明显。玩家在此很难击中强听牌，范围优势非常稳定。小尺度的持续下注通常能高效拿下底池。"
  }
})

// ─── DRAW ANALYZER ───
const analyzeDraws = (hCardsRaw, bCardsRaw) => {
  const hCards = hCardsRaw.map(c => normalizeCard(c)).filter(c => c.valid)
  const bCards = bCardsRaw.map(c => normalizeCard(c)).filter(c => c.valid)

  if (hCards.length < 2 || bCards.length < 3) {
    return []
  }

  const allCards = [...hCards, ...bCards]
  const rankValues = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 }

  // Analyze board characteristics for clean outs estimation
  const bSuitCounts = {}
  bCards.forEach(c => { bSuitCounts[c.suit] = (bSuitCounts[c.suit] || 0) + 1 })
  const boardHasFlushDraw = Object.values(bSuitCounts).some(count => count >= 2)

  const bRankVals = bCards.map(c => rankValues[c.rank]).sort((a, b) => a - b)
  let boardHasConnected = false
  for (let i = 0; i < bRankVals.length; i++) {
    for (let j = i + 1; j < bRankVals.length; j++) {
      const diff = Math.abs(bRankVals[i] - bRankVals[j])
      if (diff >= 1 && diff <= 2) {
        boardHasConnected = true
      }
    }
  }
  if (bRankVals.includes(14)) {
    const bValsWithAce1 = [1, ...bRankVals.filter(v => v !== 14)].sort((a, b) => a - b)
    for (let i = 0; i < bValsWithAce1.length; i++) {
      for (let j = i + 1; j < bValsWithAce1.length; j++) {
        const diff = Math.abs(bValsWithAce1[i] - bValsWithAce1[j])
        if (diff >= 1 && diff <= 2) {
          boardHasConnected = true
        }
      }
    }
  }

  const draws = []

  // 1. Flush Draws
  const suitCounts = {}
  allCards.forEach(c => { suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1 })
  
  let flushSuit = null
  let maxSuitCount = 0
  Object.entries(suitCounts).forEach(([suit, count]) => {
    if (count > maxSuitCount) {
      maxSuitCount = count
      flushSuit = suit
    }
  })

  if (maxSuitCount === 4) {
    const boardHasAceOfSuit = bCards.some(c => c.suit === flushSuit && c.rank === 'A')
    const boardHasKingOfSuit = bCards.some(c => c.suit === flushSuit && c.rank === 'K')
    
    const heroHasAceOfSuit = hCards.some(c => c.suit === flushSuit && c.rank === 'A')
    const heroHasKingOfSuit = hCards.some(c => c.suit === flushSuit && c.rank === 'K')

    let isNutFlush = false
    if (heroHasAceOfSuit && !boardHasAceOfSuit) {
      isNutFlush = true
    } else if (heroHasKingOfSuit && boardHasAceOfSuit && !boardHasKingOfSuit) {
      isNutFlush = true
    }

    if (isNutFlush) {
      draws.push({
        type: 'nutFlushDraw',
        labelKey: 'drawNutFlush',
        outs: 9,
        cleanOutsWarning: false
      })
    } else {
      draws.push({
        type: 'flushDraw',
        labelKey: 'drawFlush',
        outs: 9,
        cleanOutsWarning: true
      })
    }
  }

  // 2. Straight Draws
  const hasStraight = (rankSet) => {
    const sorted = Array.from(rankSet).sort((a, b) => a - b)
    let consecutive = 0
    let last = -99
    for (const val of sorted) {
      if (val === last + 1) {
        consecutive++
        if (consecutive >= 4) return true
      } else if (val !== last) {
        consecutive = 0
      }
      last = val
    }
    return false
  }

  const seenRanks = new Set(allCards.map(c => rankValues[c.rank]))
  const straightOuts = []
  
  for (let r = 2; r <= 14; r++) {
    const rankStr = Object.keys(rankValues).find(key => rankValues[key] === r)
    const currentCount = allCards.filter(c => c.rank === rankStr).length
    if (currentCount >= 4) continue

    const testRanks = new Set(seenRanks)
    testRanks.add(r)
    if (r === 14) testRanks.add(1)

    if (hasStraight(testRanks) && !hasStraight(seenRanks)) {
      const outsCount = 4 - currentCount
      straightOuts.push({ rank: r, outs: outsCount })
    }
  }

  const totalStraightOuts = straightOuts.reduce((sum, o) => sum + o.outs, 0)
  
  if (totalStraightOuts >= 8) {
    draws.push({
      type: 'oesd',
      labelKey: 'drawOesd',
      outs: totalStraightOuts,
      cleanOutsWarning: false
    })
  } else if (totalStraightOuts === 4) {
    draws.push({
      type: 'gutshot',
      labelKey: 'drawGutshot',
      outs: 4,
      cleanOutsWarning: false
    })
  }

  // 3. Two Overcards
  const maxBoardVal = Math.max(...bCards.map(c => rankValues[c.rank]))
  const h1Val = rankValues[hCards[0].rank]
  const h2Val = rankValues[hCards[1].rank]

  if (h1Val > maxBoardVal && h2Val > maxBoardVal && h1Val !== h2Val) {
    const o1Count = bCards.filter(c => rankValues[c.rank] === h1Val).length
    const o2Count = bCards.filter(c => rankValues[c.rank] === h2Val).length
    const overcardOuts = (3 - o1Count) + (3 - o2Count)
    
    draws.push({
      type: 'overcards',
      labelKey: 'drawOvercards',
      outs: overcardOuts,
      cleanOutsWarning: true
    })
  }

  // 4. Pocket Pair to Set
  if (h1Val === h2Val) {
    const isSetMining = !bCards.some(c => rankValues[c.rank] === h1Val)
    if (isSetMining) {
      draws.push({
        type: 'setMining',
        labelKey: 'drawPair',
        outs: 2,
        cleanOutsWarning: false
      })
    }
  }

  draws.sort((a, b) => b.outs - a.outs)

  const isFlop = bCards.length === 3
  const isTurn = bCards.length === 4

  return draws.map(draw => {
    const outs = draw.outs
    let nextCardProbability = 0
    let toRiverProbability = 0
    let ruleOf2Next = outs * 2
    let ruleOf4Total = outs * 4

    if (isFlop) {
      nextCardProbability = (outs / 47) * 100
      toRiverProbability = (1 - ((47 - outs) / 47) * ((46 - outs) / 46)) * 100
    } else if (isTurn) {
      nextCardProbability = (outs / 46) * 100
      toRiverProbability = (outs / 46) * 100
      ruleOf4Total = outs * 2
    }

    // Clean Outs calculation
    let cleanOuts = outs
    if (draw.type === 'oesd' && boardHasFlushDraw) {
      cleanOuts = Math.max(0, outs - 2)
    } else if (draw.type === 'gutshot' && boardHasFlushDraw) {
      cleanOuts = Math.max(0, outs - 1)
    } else if (draw.type === 'setMining' && boardHasConnected) {
      cleanOuts = Math.max(0, outs - 1)
    }

    return {
      ...draw,
      nextCardProbability: parseFloat(nextCardProbability.toFixed(1)),
      toRiverProbability: parseFloat(toRiverProbability.toFixed(1)),
      ruleOf2Next,
      ruleOf4Total,
      cleanOuts
    }
  })
}

const activeDraws = computed(() => {
  return analyzeDraws(coachState.value.heroCards, coachState.value.boardCards)
})

const highestDraw = computed(() => {
  if (activeDraws.value.length === 0) return null
  return activeDraws.value[0]
})

const evaluatedHand = computed(() => {
  const hero = coachState.value.heroCards.filter(Boolean)
  const board = coachState.value.boardCards.filter(Boolean)
  if (hero.length < 2 || board.length < 3) return null
  return evaluateHoldemHand(hero, board)
})

const isStrongMadeHand = computed(() => {
  if (!evaluatedHand.value) return false
  const strongRanks = [
    'Four of a Kind',
    'Full House',
    'Flush',
    'Straight',
    'Three of a Kind',
    'Two Pair'
  ]
  const hasStrongRank = strongRanks.includes(evaluatedHand.value.handName)
  const hasNoDraws = bestDrawEquity.value === 0
  return hasStrongRank && hasNoDraws
})

// ─── LINKAGE & STREET COMPUTED PROPERTIES ───
const bestDrawEquity = computed(() => {
  return highestDraw.value ? highestDraw.value.toRiverProbability : 0
})

const linkageStatusClass = computed(() => {
  if (requiredEquity.value === null) {
    return 'needs-input'
  }
  return bestDrawEquity.value >= requiredEquity.value ? 'profitable' : 'unprofitable'
})

const linkageText = computed(() => {
  if (requiredEquity.value === null) {
    return t('handbook.draws.linkageNeedsInput')
  }
  const drawEqStr = bestDrawEquity.value.toFixed(1) + '%'
  const reqEqStr = requiredEquity.value.toFixed(1) + '%'
  if (bestDrawEquity.value >= requiredEquity.value) {
    return t('handbook.draws.linkageProfitable')
      .replace('{draw}', drawEqStr)
      .replace('{req}', reqEqStr)
  } else {
    return t('handbook.draws.linkageUnprofitable')
      .replace('{draw}', drawEqStr)
      .replace('{req}', reqEqStr)
  }
})

const currentStreet = computed(() => {
  return onlineStore.publicState?.stage || null
})

const isFlopStreet = computed(() => {
  return currentStreet.value === 'flop'
})

const isTurnStreet = computed(() => {
  return currentStreet.value === 'turn'
})

const hasActiveStreet = computed(() => {
  return currentStreet.value === 'flop' || currentStreet.value === 'turn'
})

// ─── MATH ASSISTANT ───
const requiredEquity = computed(() => {
  const p = parseFloat(coachState.value.pot)
  const c = parseFloat(coachState.value.callAmount)
  if (isNaN(p) || isNaN(c) || p <= 0 || c <= 0) return null
  return (c / (p + c + c)) * 100
})

const mathCoachAdviceText = computed(() => {
  const p = parseFloat(coachState.value.pot)
  const c = parseFloat(coachState.value.callAmount)
  if (isNaN(p) || isNaN(c) || p <= 0 || c <= 0) {
    return t('addPotAndCall')
  }

  const reqEq = requiredEquity.value
  const drawEq = highestDraw.value ? highestDraw.value.toRiverProbability : 0

  if (drawEq >= reqEq) {
    return t('callingReasonable')
  } else {
    return t('callingUnprofitable')
  }
})

const guidanceClass = computed(() => {
  const p = parseFloat(coachState.value.pot)
  const c = parseFloat(coachState.value.callAmount)
  if (isNaN(p) || isNaN(c) || p <= 0 || c <= 0) return 'neutral'
  const reqEq = requiredEquity.value
  const drawEq = highestDraw.value ? highestDraw.value.toRiverProbability : 0
  return drawEq >= reqEq ? 'success' : 'warning'
})

// ─── TAB BADGES ───
const boardBadgeText = computed(() => {
  if (coachState.value.boardCards.filter(Boolean).length < 3) return ''
  const analysis = boardAnalysis.value
  return t('texture_' + analysis.texture)
})

const drawsBadgeText = computed(() => {
  if (coachState.value.heroCards.filter(Boolean).length < 2 || coachState.value.boardCards.filter(Boolean).length < 3) return ''
  const draws = activeDraws.value
  if (draws.length === 0) return t('noMajorDraw')
  const maxOuts = draws[0].outs
  return `${maxOuts} ${t('badgeOuts')}`
})

const mathBadgeText = computed(() => {
  if (coachState.value.heroCards.filter(Boolean).length < 2 || coachState.value.boardCards.filter(Boolean).length < 3) return ''
  const reqEq = requiredEquity.value
  if (reqEq === null) return t('needsPotBadge')
  return `${reqEq.toFixed(1)}% ${t('badgeRequired')}`
})

const buildCoachExplanation = (heroCards, boardCards, boardAnalysis, drawAnalysis, mathAnalysis, activeTab, language) => {
  const isZh = language === 'zh'
  
  // Parse inputs
  const parsedBoard = boardCards.map(c => normalizeCard(c)).filter(c => c?.valid)
  const parsedHero = heroCards.map(c => normalizeCard(c)).filter(c => c?.valid)
  
  const rankValues = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 }
  
  // Check if trips board
  const rankCounts = {}
  parsedBoard.forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1 })
  const maxRankCount = Math.max(...Object.values(rankCounts), 0)
  const isTrips = maxRankCount === 3
  
  if (isTrips) {
    const tripsRank = parsedBoard[0]?.rank || 'J'
    let r1 = 'K'
    let r2 = '8'
    let hasPocketPair = false
    
    if (parsedHero.length >= 2) {
      const sortedHero = [...parsedHero].sort((a, b) => rankValues[b.rank] - rankValues[a.rank])
      r1 = sortedHero[0].rank
      r2 = sortedHero[1].rank
      hasPocketPair = r1 === r2
    } else if (parsedHero.length === 1) {
      r1 = parsedHero[0].rank
      r2 = '?'
    }
    
    if (isZh) {
      return {
        summaryTitle: "公共三条 · 踢脚竞争",
        oneLineSummary: `公共牌已经有三张 ${tripsRank}，双方都共享三条；你的手牌主要变成踢脚比较。`,
        whatWeSee: [
          `公共牌已经形成三张 ${tripsRank}。`,
          "没有直接同花听牌，也几乎没有顺子压力。"
        ],
        whyItMatters: [
          "如果你没有口袋对子，最终牌力通常取决于谁的踢脚更高。",
          "这是偏静态牌面，很多转牌不会大幅改变局势。"
        ],
        howToThink: hasPocketPair ? [
          `你拿 ${r1}-${r2} 时，形成了葫芦 (${tripsRank}-${tripsRank}-${tripsRank}-${r1}-${r2})。`,
          "你击败了其他单张踢脚的手牌，但会输给更高的口袋对子（更高葫芦）或四条。",
          "面对大额下注，要思考对手是否在代表更高的口袋对子、四条，或在静态牌面施压。"
        ] : [
          `你拿 ${r1}-${r2} 时，常见摊牌形态是 ${tripsRank}-${tripsRank}-${tripsRank}-${r1}-${r2}。`,
          `你赢低踢脚，但会输给 ${r1 === 'A' ? '' : 'A 高、'}${r1 === 'Q' || r1 === 'A' ? '' : 'Q 高、'}任何口袋对子，或更高的踢脚。`,
          "面对大额下注，要思考对手是否在代表更好踢脚、口袋对子，或在静态牌面施压。"
        ],
        warnings: hasPocketPair ? [] : ["注意：你没有口袋对子，你的三条极其依赖踢脚强度。"],
        tags: ["公共三条", "静态牌面", "踢脚竞争"]
      }
    } else {
      return {
        summaryTitle: "Trip Board · Kicker Battle",
        oneLineSummary: `Everyone shares three ${tripsRank}s; your private cards mostly act as kickers.`,
        whatWeSee: [
          `The board already contains three ${tripsRank}s.`,
          "There are no direct flush or straight draws."
        ],
        whyItMatters: [
          "If you do not hold a pocket pair, your final hand often depends on kicker strength.",
          "This is a static board: many turn cards will not dramatically change the situation."
        ],
        howToThink: hasPocketPair ? [
          `With ${r1}-${r2}, you hold a full house (${tripsRank}-${tripsRank}-${tripsRank}-${r1}-${r2}).`,
          "You beat other kickers, but lose to higher pocket pairs (higher full house) or quads.",
          "Large bets may represent a higher pocket pair, quads, or pressure on a static board."
        ] : [
          `With ${r1}-${r2}, your common showdown shape is ${tripsRank}-${tripsRank}-${tripsRank}-${r1}-${r2}.`,
          `You beat lower kickers, but lose to ${r1 === 'A' ? '' : 'A-high, '}${r1 === 'Q' || r1 === 'A' ? '' : 'Q-high, '}higher kickers, or any pocket pair.`,
          "Large bets may represent a better kicker, a pocket pair, or pressure on a static board."
        ],
        warnings: hasPocketPair ? [] : ["Warning: You do not hold a pocket pair; your trips hand relies entirely on kicker strength."],
        tags: ["Trip Board", "Static Board", "Kicker Battle"]
      }
    }
  }
  
  // Non-trips boards
  const texture = boardAnalysis.texture // 'wet' | 'semiWet' | 'dry'
  
  // Dynamic tags generation (requirement 4)
  const tags = []
  if (isZh) {
    if (boardAnalysis.hasHighCard) tags.push("高牌面")
    if (boardAnalysis.isPaired) tags.push("成对牌面")
    if (boardAnalysis.isTwoTone) tags.push("两同花牌面")
    if (boardAnalysis.isRainbow) tags.push("彩虹牌面")
    if (boardAnalysis.isMonotone) tags.push("单色同花牌面")
    if (boardAnalysis.isConnected) tags.push("连牌牌面")
    
    // Add default texture tag
    if (texture === 'wet') tags.push("湿润牌面")
    else if (texture === 'semiWet') tags.push("半湿润牌面")
    else tags.push("干燥牌面")
  } else {
    if (boardAnalysis.hasHighCard) tags.push("High-card board")
    if (boardAnalysis.isPaired) tags.push("Paired board")
    if (boardAnalysis.isTwoTone) tags.push("Two-tone board")
    if (boardAnalysis.isRainbow) tags.push("Rainbow board")
    if (boardAnalysis.isMonotone) tags.push("Monotone board")
    if (boardAnalysis.isConnected) tags.push("Connected board")
    
    // Add default texture tag
    if (texture === 'wet') tags.push("Wet Board")
    else if (texture === 'semiWet') tags.push("Semi-Wet Board")
    else tags.push("Dry Board")
  }
  
  if (texture === 'wet') {
    if (isZh) {
      return {
        summaryTitle: "湿润牌面 · 听牌丰富",
        oneLineSummary: "公共牌高度关联，同花与顺子听牌非常活跃。",
        whatWeSee: [
          "公共牌有同花色或点数相连的卡牌。",
          "对手极易持有强听牌或已完成的强牌。"
        ],
        whyItMatters: [
          "牌力价值非常动态：翻牌顶对在转牌或河牌极易被超越。",
          "预期波动较大，这里很容易形成大底池。"
        ],
        howToThink: [
          "持有成牌（如顶对）时，需要思考是否通过足够大的下注收取高额买牌成本。",
          "持有听牌时，确认补牌是否干净且当前底池赔率足够合理。",
          "面对后续危险牌发出后的激进攻击，通常需要谨慎应对。"
        ],
        warnings: [
          "避免仅持有中等一对比牌时盲目跟注或投入过多筹码。"
        ],
        tags
      }
    } else {
      return {
        summaryTitle: "Wet Board · Draw Heavy",
        oneLineSummary: "The board is rich with coordination; straight and flush draws are highly active.",
        whatWeSee: [
          "Multiple cards of the same suit or connected ranks are present.",
          "Opponents can easily hold strong draws or completed hands."
        ],
        whyItMatters: [
          "Hand values are dynamic: today's top pair can easily be beaten on the turn or river.",
          "Expect high variance. Large pots are frequently built in these spots."
        ],
        howToThink: [
          "With a made hand (like Top Pair), consider charging draws a high price to see the next card.",
          "With a draw, verify your outs are clean and pot odds justify continuing.",
          "Be highly cautious when facing intense aggression on completed runouts."
        ],
        warnings: [
          "Avoid committing too many chips with marginal one-pair hands."
        ],
        tags
      }
    }
  } else if (texture === 'semiWet') {
    if (isZh) {
      return {
        summaryTitle: "半湿润牌面 · 后门潜力",
        oneLineSummary: "存在部分活跃听牌，后门听牌可能性开放。",
        whatWeSee: [
          "花色或点数部分相连，且通常包含至少一张高牌或对子。",
          "双方均存在后门同花或顺子的机会。"
        ],
        whyItMatters: [
          "牌面结构可能随着转牌的发出而发生显著改变。",
          "持续下注很常见，但做大底池需要更强的成牌支持。"
        ],
        howToThink: [
          "注意潜在的后门听牌可能在转牌变成活跃听牌。",
          "保持合理的下注尺度，试探对手的牌力强度。",
          "在做大底池前，思考你的位置与踢脚强度。"
        ],
        warnings: [
          "不要低估后续街可能成牌的后门潜力。"
        ],
        tags
      }
    } else {
      return {
        summaryTitle: "Semi-Wet Board · Backdoor Potential",
        oneLineSummary: "Some draws are active, and backdoor possibilities are open.",
        whatWeSee: [
          "A mixture of disconnected suits or ranks, with at least one high card or pair.",
          "Backdoor flush or straight opportunities exist for both sides."
        ],
        whyItMatters: [
          "The board texture can shift significantly depending on the turn card.",
          "Continuation bets are common, but massive pots require stronger justification."
        ],
        howToThink: [
          "Watch for potential backdoor draws turning into active draws on the turn.",
          "Balance your bet sizes to probe for opponent's hand strength.",
          "Consider your position and kicker strength before inflating the pot."
        ],
        warnings: [
          "Do not underestimate backdoor possibilities on future streets."
        ],
        tags
      }
    }
  } else {
    // dry board
    if (isZh) {
      return {
        summaryTitle: "干燥牌面 · 静态稳定",
        oneLineSummary: "无直接同花或顺子听牌可能；手牌相对价值较稳定。",
        whatWeSee: [
          "公共牌点数散乱且花色各异（彩虹牌面）。",
          "无成对牌面，也没有同花色的两张牌。"
        ],
        whyItMatters: [
          "这是偏静态牌面：转牌和河牌很难改变谁领先的局面。",
          "持续下注在此非常有效，可迫使对手弃掉弱牌。"
        ],
        howToThink: [
          "如果你持有领先手牌，由于听牌极少，你无需激进防守。",
          "如果选择下注，小尺度下注通常已足够达到战术目的。",
          "如果平时被动的对手突然展现极强攻势，做好弃牌准备。"
        ],
        warnings: [
          "如果对手愿意做大底池，切忌过度游戏边际牌。"
        ],
        tags
      }
    } else {
      return {
        summaryTitle: "Dry Board · Highly Static",
        oneLineSummary: "No direct flush or straight draws are possible; hand values are stable.",
        whatWeSee: [
          "Cards are disconnected in both rank and suit (Rainbow).",
          "No pair on board, and no two cards of the same suit."
        ],
        whyItMatters: [
          "This is a static board: turn and river cards are unlikely to change who is ahead.",
          "Continuation bets are highly effective here to fold out weak hands."
        ],
        howToThink: [
          "If you have the best hand, you don\'t need to protect it aggressively as few draws exist.",
          "If you bet, a small sizing is often sufficient to achieve your tactical goal.",
          "Be prepared to fold if a passive opponent suddenly shows intense aggression."
        ],
        warnings: [
          "Do not overplay marginal hands if the opponent is willing to build a large pot."
        ],
        tags
      }
    }
  }
}

const coachExplanation = computed(() => {
  return buildCoachExplanation(
    coachState.value.heroCards,
    coachState.value.boardCards,
    boardAnalysis.value,
    activeDraws.value,
    {
      pot: coachState.value.pot,
      callAmount: coachState.value.callAmount,
      requiredEquity: requiredEquity.value
    },
    activeTab.value,
    currentLang.value
  )
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
.header-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  width: 100%;
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
}
.lang-switcher {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle);
  padding: 0.25rem 0.6rem;
  border-radius: var(--radius-pill);
  line-height: 1;
}
.lang-btn {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.1rem 0.3rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.lang-btn:hover {
  color: var(--text-primary);
}
.lang-btn.active {
  color: var(--accent-primary-strong);
  text-shadow: 0 0 8px rgba(217, 173, 88, 0.4);
}
.lang-divider {
  font-size: 0.7rem;
  color: var(--border-strong);
  user-select: none;
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

/* ----------------------------------------------------
   New Components: Tags, Banners, and Draws Grid
   ---------------------------------------------------- */
.tab-decide-banner {
  background: rgba(217, 173, 88, 0.04);
  border-left: 3px solid var(--accent-primary);
  padding: 0.75rem 1rem;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}
.decide-icon {
  font-size: 1.1rem;
  line-height: 1.3;
}
.decide-text {
  font-size: 0.84rem;
  color: var(--text-primary);
  line-height: 1.45;
}
.decide-zh {
  display: block;
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.15rem;
}

.gto-modal-desc.motto {
  font-style: italic;
  color: var(--text-primary);
  font-size: 0.9rem;
  border-left: 2px solid var(--border-strong);
  padding-left: 0.75rem;
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
  line-height: 1.4;
}
.gto-modal-desc.sub-motto {
  color: var(--text-secondary);
  font-size: 0.82rem;
  padding-left: 0.75rem;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.draws-table .table-row {
  grid-template-columns: 2fr 1.1fr 1.2fr 1.2fr 1.2fr;
}
.draws-table .table-row.header {
  font-size: 0.65rem;
}

.rules-explanation-box {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.rule-equation {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.rule-equation .label {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 700;
}
.rule-equation .val-calc {
  font-family: var(--font-family-mono);
  font-size: 1.15rem;
  font-weight: 850;
}
.rule-note {
  font-size: 0.72rem;
  color: var(--text-tertiary);
  margin: 0;
  line-height: 1.35;
}

.concept-explanation {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.concept-p {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--text-primary);
}
.concept-p-zh {
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--text-secondary);
  border-top: 1px dashed rgba(255, 255, 255, 0.06);
  padding-top: 0.6rem;
}
.accent-link {
  color: var(--accent-primary-strong);
  text-decoration: underline;
  cursor: pointer;
}
.accent-link:hover {
  color: var(--text-primary);
}
.zh-link-text {
  display: block;
  font-size: 0.74rem;
  color: var(--text-tertiary);
  margin-top: 0.25rem;
}

.coming-soon-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  padding: 3rem 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  min-height: 280px;
}
.coming-soon-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  max-width: 500px;
}
.coming-soon-icon {
  font-size: 3rem;
  line-height: 1;
  margin-bottom: 0.5rem;
  animation: pulse-slow 2s infinite alternate;
}
.coming-soon-content h3 {
  font-size: 1.25rem;
  font-weight: 850;
  color: var(--text-primary);
  margin: 0;
}
.coming-soon-content h3.zh-title {
  font-size: 1.1rem;
  font-weight: 750;
  color: var(--text-secondary);
  margin-top: -0.2rem;
}
.coming-soon-content p {
  font-size: 1rem;
  color: var(--accent-primary-strong);
  font-weight: 700;
  margin: 0;
}
.coming-soon-content .desc {
  font-size: 0.8rem;
  color: var(--text-tertiary);
  line-height: 1.5;
  margin-top: 0.5rem;
}

@keyframes pulse-slow {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(1.1); opacity: 1; }
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
  .draws-table .table-row {
    grid-template-columns: 1.5fr 0.8fr 1fr 1fr 1fr;
    font-size: 0.68rem;
    padding: 0.5rem 0.3rem;
  }
  .draws-table .table-row.header {
    font-size: 0.55rem;
  }
}

@media (max-width: 520px) {
  .gto-modal-overlay {
    padding: 0.75rem;
  }
  .gto-modal-content {
    padding: 1rem;
    gap: 1.2rem;
  }
  .gto-modal-title {
    font-size: 1.35rem;
  }
  .gto-tabs {
    gap: 0.8rem;
  }
  .gto-tab-btn {
    font-size: 0.9rem;
    padding-bottom: 0.5rem;
  }
  .tab-decide-banner {
    padding: 0.6rem 0.8rem;
  }
}

@media (max-width: 480px) {
  .gto-matrix-container {
    padding: 0.2rem;
    border-radius: var(--radius-md);
  }
  .gto-hand-matrix {
    gap: 1px;
  }
  .gto-matrix-cell {
    font-size: 0.45rem;
  }
}

/* ─── POSTFLOP DYNAMIC SYSTEM STYLES ─── */
.postflop-input-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle);
  padding: 0.95rem 1.4rem;
  border-radius: var(--radius-lg);
  margin-bottom: 1.25rem;
}

.postflop-input-bar .input-group {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.group-label {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.card-slots {
  display: flex;
  gap: 0.5rem;
}

.card-slot-wrapper {
  position: relative;
  width: 44px;
  height: 61.6px;
  flex-shrink: 0;
}

.interactive-card-slot {
  width: 100%;
  height: 100%;
  border-radius: 6px;
  border: 1px solid var(--border-strong);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  overflow: hidden;
}

.interactive-card-slot:hover {
  border-color: var(--accent-primary);
  background: rgba(217, 173, 88, 0.08);
  box-shadow: 0 0 10px rgba(217, 173, 88, 0.15);
}

.interactive-card-slot .card-view {
  width: 100% !important;
  height: 100% !important;
  border-radius: inherit;
  box-shadow: none;
}

.empty-slot-content {
  color: var(--text-tertiary);
  font-size: 1.2rem;
  font-weight: bold;
}

.clear-slot-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #C62828;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 11px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 5;
  transition: background 0.15s ease;
}

.clear-slot-btn:hover {
  background: #b71c1c;
}

.sync-live-btn {
  margin-left: auto;
  background: rgba(217, 173, 88, 0.08);
  border: 1px solid rgba(217, 173, 88, 0.25);
  color: var(--accent-primary-strong);
  font-weight: 800;
  font-size: 0.72rem;
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.sync-live-btn:hover {
  background: rgba(217, 173, 88, 0.18);
  border-color: var(--accent-primary);
  color: var(--text-primary);
  box-shadow: 0 0 8px rgba(217, 173, 88, 0.15);
}

/* Card Picker Popup */
.picker-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(12px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.picker-modal-content {
  position: relative;
  width: 100%;
  max-width: 380px;
  background: rgba(20, 15, 12, 0.98);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: center;
}

.picker-close-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.picker-close-btn:hover {
  color: var(--text-primary);
}

.picker-title {
  font-size: 1.1rem;
  font-weight: 850;
  color: var(--accent-primary);
  margin: 0;
  text-align: center;
}

.picker-subtitle {
  font-size: 0.76rem;
  color: var(--text-secondary);
  margin: 0;
  text-align: center;
  margin-top: -0.3rem;
}

.picker-grid {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 4px;
}

.picker-header-row, .picker-row {
  display: grid;
  grid-template-columns: 32px repeat(4, 1fr);
  gap: 4px;
  align-items: center;
}

.picker-header-cell, .picker-cell {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.74rem;
  font-weight: 800;
}

.picker-header-cell.suit-header {
  font-size: 1rem;
}

.picker-header-cell.suit-header.red { color: #ff6b6e; }
.picker-header-cell.suit-header.black { color: #fff; }

.picker-cell.rank-label {
  color: var(--text-tertiary);
  font-family: var(--font-family-mono);
}

.card-option {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--font-family-mono);
  transition: all 0.15s ease;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-option:hover {
  background: var(--accent-primary-strong);
  color: #000 !important;
  border-color: var(--accent-primary);
}

.card-option.disabled {
  opacity: 0.15;
  cursor: not-allowed;
  background: transparent;
  border-color: transparent;
  pointer-events: none;
}

.card-option.red { color: #ff6b6e; }
.card-option.black { color: #fff; }

.picker-actions {
  display: flex;
  gap: 0.8rem;
  width: 100%;
  margin-top: 0.5rem;
}

.picker-btn {
  flex: 1;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  font-weight: 800;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn {
  background: rgba(198, 40, 40, 0.12);
  border: 1px solid rgba(198, 40, 40, 0.3);
  color: #ff6b6e;
}
.clear-btn:hover {
  background: rgba(198, 40, 40, 0.22);
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-strong);
  color: var(--text-secondary);
}
.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

/* Postflop Empty State */
.postflop-empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 220px;
  text-align: center;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  background: rgba(0, 0, 0, 0.15);
  padding: 2rem;
}

.empty-state-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  max-width: 320px;
}

.empty-state-icon {
  font-size: 2.2rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.empty-state-content h3 {
  font-size: 1rem;
  font-weight: 850;
  color: var(--text-primary);
  margin: 0;
}

.empty-state-content .desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.45;
  margin: 0;
}

/* Math Inputs */
.math-inputs-container {
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 0.95rem;
}

.math-input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.math-input-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.math-input-field label {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.premium-math-input {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  padding: 0.45rem 0.75rem;
  color: var(--text-primary);
  font-family: var(--font-family-mono);
  font-size: 0.9rem;
  font-weight: 700;
  outline: none;
  transition: all 0.2s ease;
}

.premium-math-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 6px rgba(217, 173, 88, 0.2);
}

.math-dynamic-results {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  border-top: 1px solid var(--border-subtle);
  padding-top: 0.8rem;
}

.result-item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.result-label {
  color: var(--text-secondary);
}

.result-value {
  font-weight: 800;
}

.result-value.text-accent {
  color: var(--accent-primary-strong);
}

.math-coach-guidance-box {
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.math-coach-guidance-box.neutral {
  background: rgba(255, 255, 255, 0.02);
  border-color: var(--border-subtle);
}

.math-coach-guidance-box.success {
  background: rgba(31, 122, 79, 0.08);
  border-color: rgba(31, 122, 79, 0.25);
  color: #52d992;
}

.math-coach-guidance-box.warning {
  background: rgba(217, 173, 88, 0.06);
  border-color: rgba(217, 173, 88, 0.2);
  color: var(--accent-primary-strong);
}

.guidance-title {
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.06em;
}

.guidance-text {
  font-size: 0.8rem;
  margin: 0;
  line-height: 1.4;
  color: var(--text-primary);
}

/* Draws Reference Divider */
.reference-table-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.4rem 0 0.8rem;
}

.reference-table-divider::before,
.reference-table-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-subtle);
}

.reference-table-divider span {
  padding: 0 0.8rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.no-draws-placeholder {
  text-align: center;
  padding: 1.25rem;
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  color: var(--text-tertiary);
}

.text-danger-soft {
  color: #ff6b6e;
}

.rule-approx {
  font-size: 0.7rem;
  color: var(--text-tertiary);
  margin-left: 0.25rem;
}

/* Board texture */
.board-analyzer-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.board-analyzer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.board-analyzer-grid .board-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.texture-readout {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  font-weight: 800;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 0.8rem;
}

.texture-label {
  color: var(--text-secondary);
}

.texture-value {
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 900;
}

.texture-value.wet {
  background: rgba(198, 40, 40, 0.15);
  color: #ff6b6e;
}
.texture-value.semiWet {
  background: rgba(217, 173, 88, 0.12);
  color: var(--accent-primary-strong);
}
.texture-value.dry {
  background: rgba(31, 122, 79, 0.12);
  color: #52d992;
}

.board-details-checklist {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem 1rem;
}

.detail-check-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  opacity: 0.35;
  transition: opacity 0.2s ease;
}

.detail-check-item.active {
  opacity: 1;
}

.check-icon {
  font-weight: 900;
  font-size: 0.74rem;
}
.detail-check-item.active .check-icon {
  color: #52d992;
}
.detail-check-item:not(.active) .check-icon {
  color: var(--text-tertiary);
}

.detail-check-item.active .check-label {
  color: var(--text-primary);
  font-weight: 700;
}

.board-tactical-body {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.tactical-item {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
}

.tactical-bullet {
  color: var(--accent-primary-strong);
  font-size: 0.5rem;
  margin-top: 0.4rem;
}

.tactical-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.82rem;
}

.tactical-content strong {
  color: var(--text-secondary);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.tactical-content span {
  color: var(--text-primary);
  line-height: 1.4;
}

.tab-badge-status {
  display: inline-block;
  font-size: 0.62rem;
  background: rgba(217, 173, 88, 0.14);
  color: var(--accent-primary-strong);
  border: 1px solid rgba(217, 173, 88, 0.3);
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  font-weight: 900;
  margin-left: 0.4rem;
  vertical-align: middle;
  line-height: 1.2;
}

/* Educational Coach Explanation styles */
.decide-text-container {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.decide-banner-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--accent-primary-strong);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.decide-questions-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.decide-questions-list li {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.coach-explanation-header {
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 1rem;
  margin-bottom: 0.5rem;
}
.explanation-title {
  font-size: 1.2rem;
  font-weight: 850;
  color: var(--accent-primary-strong);
  margin: 0 0 0.4rem 0;
}
.explanation-summary {
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.45;
  margin: 0 0 0.8rem 0;
}
.explanation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.explanation-tag-pill {
  font-size: 0.72rem;
  font-weight: 800;
  background: rgba(217, 173, 88, 0.08);
  border: 1px solid rgba(217, 173, 88, 0.25);
  color: var(--accent-primary-strong);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
.explanation-sections {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.explanation-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.section-subtitle {
  font-size: 0.72rem;
  font-weight: 900;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.explanation-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.explanation-list li {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.45;
  padding-left: 0.8rem;
  position: relative;
}
.explanation-list li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: var(--text-tertiary);
}
.explanation-list.accent-list li::before {
  color: var(--accent-primary);
}
.explanation-list.warning-list li::before {
  display: none;
}
.explanation-list.warning-list li {
  padding-left: 0;
  color: #ff6b6e;
  font-weight: 700;
}
.warning-text {
  color: #ff6b6e !important;
}

/* Draws Tab UI Optimization */
.math-cheat-sheet:has(.draws-table) .math-card-grid {
  gap: 1.5rem !important;
  padding: 1.5rem !important;
}

.math-cheat-sheet:has(.draws-table) .table-card,
.math-cheat-sheet:has(.draws-table) .rules-card {
  padding: 1.25rem !important;
}

.active-draws-table {
  background: transparent !important;
  border: none !important;
}

.active-draws-table .table-row {
  grid-template-columns: 2.2fr 1fr 1.3fr 1.3fr !important;
  gap: 0.5rem !important;
  align-items: center !important;
  padding: 0.75rem 1rem !important;
}

.active-draws-table .table-row.header {
  background: transparent !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  padding-bottom: 0.5rem !important;
  margin-bottom: 1rem !important;
  font-size: 0.7rem !important;
  letter-spacing: 0.08em !important;
  opacity: 0.6 !important;
  text-transform: uppercase !important;
}

.active-draws-table .table-row:not(.header) {
  margin-bottom: 1rem !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: var(--radius-sm) !important;
  background: rgba(255, 255, 255, 0.02) !important;
}

.active-draws-table .table-row:not(.header):last-child {
  margin-bottom: 0 !important;
}

.active-draws-table .table-row:not(.header) span:nth-child(3),
.active-draws-table .table-row:not(.header) span:nth-child(4) {
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
}

.active-draws-table .table-row:not(.header) span:nth-child(3) .rule-approx,
.active-draws-table .table-row:not(.header) span:nth-child(4) .rule-approx {
  font-size: 0.7rem !important;
  color: var(--text-tertiary) !important;
  display: block !important;
  margin-top: 0.15rem !important;
  font-weight: normal !important;
}

.rules-explanation-box {
  padding: 1.25rem !important;
}

.rules-explanation-box .rule-equation.mt-2 {
  margin-top: 1rem !important;
}

.rules-explanation-box .val-calc {
  font-size: 1.4rem !important;
}

.rules-explanation-box .rule-note {
  margin-top: 0.5rem !important;
  line-height: 1.6 !important;
}

.draws-table {
  margin-top: 1.25rem !important;
}

.draws-table .table-row {
  padding: 0.5rem 0.75rem !important;
}

.draws-table .table-row.header {
  font-size: 0.7rem !important;
  letter-spacing: 0.08em !important;
  opacity: 0.6 !important;
}

.draws-table .table-row:not(.header):not(.highlight):nth-child(even) {
  background: rgba(255, 255, 255, 0.03) !important;
}

.active-draws-table .table-row > span:not(:first-child),
.draws-table .table-row > span:not(:first-child) {
  width: 100% !important;
  text-align: right !important;
}

.active-draws-table .table-row > span:first-child,
.draws-table .table-row > span:first-child {
  width: 100% !important;
  text-align: left !important;
}

.decide-banner-title {
  margin-bottom: 0.75rem !important;
  display: block !important;
}

.decide-questions-list li {
  line-height: 1.8 !important;
  margin-bottom: 0.25rem !important;
}

.decide-questions-list li:last-child {
  margin-bottom: 0 !important;
}

.tab-decide-banner {
  border-left: 4px solid var(--accent-primary) !important;
}

.gto-tab-btn {
  padding: 0.5rem 1rem !important;
}

.tab-badge-status {
  margin-left: 0.375rem !important;
}

/* Draws Tab Patch Fixes */
/* Patch 1: Reference Table Column Sticking */
.math-cheat-sheet:has(.draws-table) .reference-table .draw-row,
.math-cheat-sheet:has(.draws-table) .reference-table .draw-header,
.math-cheat-sheet:has(.draws-table) .draws-table .table-row,
.math-cheat-sheet:has(.draws-table) .draws-table .table-row.header {
  display: grid !important;
  grid-template-columns: 2fr 0.6fr 0.8fr 0.8fr 0.8fr !important;
  align-items: center !important;
  column-gap: 0.5rem !important;
}

.math-cheat-sheet:has(.draws-table) .reference-table .draw-header > *,
.math-cheat-sheet:has(.draws-table) .draws-table .table-row.header > * {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

/* Patch 2: Cards Width Ratio */
.math-cheat-sheet:has(.draws-table) .math-card-grid {
  grid-template-columns: 1.4fr 1fr !important;
  gap: 1.5rem !important;
  padding: 1.5rem !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

/* Patch 3: Full Width Expansion */
.math-cheat-sheet:has(.draws-table) {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  padding: 0 !important;
  flex: 1 !important;
}

/* Optimization CSS overrides */
:root {
  --color-text-muted: var(--text-tertiary);
}

.linkage-status-bar {
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 0.25rem;
  line-height: 1.5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.linkage-status-bar.profitable {
  border-left: 4px solid #52d992 !important;
  background: rgba(31, 122, 79, 0.08) !important;
  color: #52d992 !important;
}

.linkage-status-bar.unprofitable {
  border-left: 4px solid #ff6b6e !important;
  background: rgba(159, 41, 45, 0.08) !important;
  color: #ff6b6e !important;
}

.linkage-status-bar.needs-input {
  border-left: 4px solid var(--text-tertiary) !important;
  background: rgba(255, 255, 255, 0.02) !important;
  color: var(--text-secondary) !important;
}

.active-draw-outs-cell {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.35rem !important;
  white-space: nowrap !important;
}

.clean-outs-info {
  font-size: 0.78rem !important;
  font-weight: normal !important;
  color: var(--color-text-muted, var(--text-tertiary)) !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.15rem !important;
  margin-left: 0.25rem !important;
}

.clean-outs-info .warning-icon {
  color: #ffb74d !important;
  font-size: 0.74rem !important;
}

.active-draws-table .table-row:not(.header) .pct-val {
  font-size: unset !important;
  font-weight: unset !important;
  color: unset !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
}

.active-draws-table .table-row:not(.header) .pct-val .main-pct {
  font-size: 1.2rem !important;
  font-weight: 600 !important;
  color: #ffffff !important;
  line-height: 1.2 !important;
}

.active-draws-table .table-row:not(.header) .pct-val .sub-pct {
  font-size: 0.8rem !important;
  color: var(--color-text-muted, var(--text-tertiary)) !important;
  line-height: 1.2 !important;
  margin-top: 0.2rem !important;
}

.formula-block {
  transition: opacity 0.3s ease;
}

.formula-block.dim-opacity {
  opacity: 0.35;
}

.formula-block .rule-equation {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 0.5rem !important;
  flex-wrap: wrap !important;
}

.formula-flex-container {
  display: inline-flex !important;
  align-items: center !important;
  column-gap: 0.25rem !important;
  font-family: var(--font-family-mono) !important;
  font-size: 1.4rem !important;
  font-weight: 850 !important;
}

.formula-flex-container.text-success {
  color: #52d992 !important;
}

.formula-flex-container.text-warning {
  color: var(--accent-primary-strong) !important;
}

.formula-block .street-hint {
  font-size: 0.72rem !important;
  color: var(--text-tertiary) !important;
  margin-left: 0.5rem !important;
  font-weight: normal !important;
  display: inline-block !important;
}

/* Educational Info Cards */
.educational-card {
  background: rgba(217, 173, 88, 0.03) !important;
  border: 1px dashed rgba(217, 173, 88, 0.15) !important;
  border-radius: var(--radius-md) !important;
  padding: 1.1rem !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 0.6rem !important;
  margin-top: 1rem !important;
}

.educational-card .card-title {
  font-size: 0.95rem !important;
  font-weight: 850 !important;
  color: var(--accent-primary-strong) !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  gap: 0.4rem !important;
}

.educational-card .card-body {
  font-size: 0.82rem !important;
  color: var(--text-secondary) !important;
  line-height: 1.45 !important;
  margin: 0 !important;
  white-space: pre-line !important;
}

.math-right-col-stack,
.draws-right-col-stack {
  display: flex !important;
  flex-direction: column !important;
  gap: 1.25rem !important;
}

/* Strong Made Hand highlight styling overrides */
.strong-made-highlight {
  background: radial-gradient(circle at 50% 0%, rgba(31, 122, 79, 0.15), transparent 30rem), rgba(24, 18, 15, 0.94) !important;
  border: 1px solid rgba(82, 217, 146, 0.3) !important;
  box-shadow: 0 0 25px rgba(82, 217, 146, 0.05) !important;
}

.text-success-strong {
  color: #52d992 !important;
}

.strong-made-container {
  background: rgba(31, 122, 79, 0.08) !important;
  border: 1px dashed rgba(82, 217, 146, 0.25) !important;
  border-radius: var(--radius-md) !important;
  padding: 1.25rem !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 0.8rem !important;
}

.strong-made-list {
  list-style: none !important;
  padding: 0 !important;
  margin: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 0.95rem !important;
}

.strong-made-list li {
  font-size: 0.85rem !important;
  color: var(--text-secondary) !important;
  line-height: 1.55 !important;
  padding-left: 1.4rem !important;
  position: relative !important;
}

.strong-made-list li::before {
  content: "✅" !important;
  position: absolute !important;
  left: 0 !important;
  font-size: 0.85rem !important;
}

/* Combo Click to Postflop Input Linkage Styles */
.input-group-label-stack {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.hand-input-helper-note {
  font-size: 0.65rem;
  color: var(--text-tertiary);
  opacity: 0.7;
}

.card-slots-and-notice {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.hero-card-slots {
  border: 1px solid transparent;
  padding: 0.15rem;
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.hero-card-slots.glow-pulse-highlight {
  border-color: var(--accent-primary) !important;
  background: rgba(217, 173, 88, 0.08) !important;
  box-shadow: 0 0 15px rgba(217, 173, 88, 0.3) !important;
  animation: pulse-border 1.2s infinite alternate ease-in-out;
}

.load-notice-text {
  font-size: 0.72rem;
  color: var(--accent-primary);
  background: rgba(217, 173, 88, 0.1);
  border: 1px solid rgba(217, 173, 88, 0.2);
  border-radius: var(--radius-sm);
  padding: 0.2rem 0.5rem;
  font-weight: 500;
}

/* fade-fast transition */
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.15s ease;
}
.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}
</style>
