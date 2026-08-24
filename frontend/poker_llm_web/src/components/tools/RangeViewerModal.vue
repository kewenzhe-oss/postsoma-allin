<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="gto-modal-overlay" @click.self="closeModal">
        <div
          ref="modalContentRef"
          class="gto-modal-content animate-scaleIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="decision-guide-title"
          tabindex="-1"
          @keydown="handleModalKeydown"
        >
          <!-- Close Button -->
          <button
            ref="closeButtonRef"
            class="gto-close-btn"
            type="button"
            @click="closeModal"
            :aria-label="t('closeGuideLabel')"
          >
            <span class="close-icon">&times;</span>
          </button>

          <!-- Header -->
          <div class="gto-modal-header">
            <div class="header-identity">
              <div class="header-top-row">
                <div class="gto-title-badge">{{ t('badge') }}</div>
              </div>
              <div class="gto-title-row">
                <h2 id="decision-guide-title" class="gto-modal-title">{{ t('title') }}</h2>
                <button
                  class="gto-guide-badge"
                  type="button"
                  @click="selectPrimarySection('start')"
                >
                  {{ t('guide') }}
                </button>
              </div>
              <p class="gto-modal-desc motto">
                {{ t('motto') }}
              </p>
            </div>

            <div class="header-language-row">
              <LocaleSwitcher />
            </div>
          </div>

          <div
            class="guide-primary-tabs"
            role="tablist"
            :aria-label="t('primaryNavLabel')"
            @keydown="handlePrimaryTabKeydown"
          >
            <button
              v-for="section in primarySections"
              :id="`decision-guide-tab-${section.id}`"
              :key="section.id"
              :ref="(el) => setPrimaryTabRef(el, section.id)"
              class="guide-primary-tab"
              :class="{ active: primarySection === section.id }"
              type="button"
              role="tab"
              :aria-selected="primarySection === section.id"
              :aria-controls="`decision-guide-panel-${section.id}`"
              :tabindex="primarySection === section.id ? 0 : -1"
              @click="selectPrimarySection(section.id)"
            >
              <span class="primary-tab-kicker">{{ section.kicker }}</span>
              <span>{{ section.label }}</span>
            </button>
          </div>

          <section
            v-if="primarySection === 'start'"
            id="decision-guide-panel-start"
            class="guide-landing animate-fadeIn"
            role="tabpanel"
            aria-labelledby="decision-guide-tab-start"
            tabindex="0"
          >
            <div class="guide-landing-hero">
              <p class="guide-eyebrow">{{ t('startEyebrow') }}</p>
              <h3>{{ t('startTitle') }}</h3>
              <p>{{ t('startDesc') }}</p>
            </div>

            <ol class="decision-flow" :aria-label="t('fiveQuestionsLabel')">
              <li v-for="(step, index) in guideSteps" :key="step.id" class="decision-flow-step">
                <span class="flow-number" aria-hidden="true">{{ index + 1 }}</span>
                <div>
                  <strong>{{ step.title }}</strong>
                  <span>{{ step.question }}</span>
                </div>
              </li>
            </ol>

            <div class="guide-landing-actions">
              <button type="button" class="guide-action primary" @click="handleTrainingCta('preflop')">
                {{ t('trainPreflopCta') }}
              </button>
              <button type="button" class="guide-action" @click="handleTrainingCta('pot-odds')">
                {{ t('trainPotOddsCta') }}
              </button>
              <button type="button" class="guide-action" @click="selectPrimarySection('reference')">
                {{ t('viewRangeCta') }}
              </button>
              <button type="button" class="guide-action secondary" @click="selectPrimarySection('explorer')">
                {{ t('openExplorerCta') }}
              </button>
            </div>

            <p class="guide-truth-boundary">{{ t('guideTruthBoundary') }}</p>
          </section>

          <section
            v-else-if="primarySection === 'concepts'"
            id="decision-guide-panel-concepts"
            class="concepts-panel animate-fadeIn"
            role="tabpanel"
            aria-labelledby="decision-guide-tab-concepts"
            tabindex="0"
          >
            <div class="section-intro">
              <p class="guide-eyebrow">{{ t('conceptsEyebrow') }}</p>
              <h3>{{ t('conceptsTitle') }}</h3>
              <p>{{ t('conceptsDesc') }}</p>
            </div>

            <div class="concept-card-grid">
              <article v-for="(card, index) in conceptCards" :key="card.id" class="concept-card">
                <div class="concept-card-heading">
                  <span class="concept-index" aria-hidden="true">0{{ index + 1 }}</span>
                  <h4>{{ card.title }}</h4>
                </div>
                <p class="concept-question">{{ card.question }}</p>
                <p class="concept-principle">{{ card.principle }}</p>
                <p class="concept-reminder">{{ card.reminder }}</p>
                <button type="button" class="concept-cta" @click="handleConceptCta(card.cta)">
                  {{ card.ctaLabel }}
                </button>
              </article>
            </div>
          </section>


          <!-- REFERENCE: PREFLOP MATRIX -->
          <section
            v-else-if="primarySection === 'reference'"
            id="decision-guide-panel-reference"
            class="gto-tab-content animate-fadeIn"
            role="tabpanel"
            aria-labelledby="decision-guide-tab-reference"
            tabindex="0"
          >
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

            <div v-if="currentSpot === 'sb_open'" class="reference-source-card baseline-source-card">
              <div class="reference-source-header">
                <div>
                  <span class="reference-source-kicker">{{ t('referenceVerifiedBaseline') }}</span>
                  <div class="reference-source-ids">
                    <strong>{{ HU_BTN_RFI_RANGE_ID }}</strong>
                    <span>{{ HU_BTN_RFI_RANGE_VERSION }}</span>
                  </div>
                </div>
                <span v-if="!HU_BTN_RFI_ASSUMPTIONS.solverOutput" class="reference-boundary-badge">
                  {{ t('referenceNotSolver') }}
                </span>
              </div>
              <p class="reference-scenario">{{ baselineScenarioLabel }}</p>
              <div class="reference-facts">
                <span>{{ t('referenceOpenSize') }}: {{ HU_BTN_RFI_ASSUMPTIONS.openSizeBb }} BB</span>
                <span>{{ t('referenceSourceLabel') }}: {{ baselineSourceLabel }}</span>
              </div>
              <p class="reference-boundary-copy">{{ baselineBoundaryNote }}</p>
            </div>

            <div v-else class="reference-source-card bb-source-card">
              <span class="reference-source-kicker">{{ t('referenceBbTitle') }}</span>
              <p class="reference-boundary-copy">{{ t('referenceBbBoundary') }}</p>
            </div>

            <div class="reference-actions">
              <button type="button" class="guide-action primary" @click="handleTrainingCta('preflop')">
                {{ t('trainPreflopCta') }}
              </button>
              <button type="button" class="guide-action secondary" @click="selectPrimarySection('start')">
                {{ t('backToGuideCta') }}
              </button>
            </div>

            <!-- Single-Core layout (Matrix居中独占，Legend移至底部横向排布) -->
            <div class="gto-main-layout">
              <div class="gto-matrix-container">
                <div class="gto-hand-matrix" role="group" :aria-label="t('rangeGridLabel')">
                  <button
                    v-for="combo in combos"
                    :key="combo"
                    :ref="(el) => setMatrixCellRef(el, combo)"
                    type="button"
                    class="gto-matrix-cell"
                    :class="[getComboTypeClass(combo), { active: hoveredCombo === combo }]"
                    :style="{ background: getCellBg(combo) }"
                    :aria-label="getComboAriaLabel(combo)"
                    :aria-pressed="hoveredCombo === combo"
                    :tabindex="focusedCombo === combo ? 0 : -1"
                    @pointerenter="hoveredCombo = combo"
                    @focus="handleComboFocus(combo)"
                    @click="onComboClick(combo)"
                    @keydown="handleComboKeydown($event, combo)"
                  >
                    <span class="combo-label">{{ combo }}</span>
                  </button>
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
                  <span class="legend-label">{{ getSecondaryActionLabel() }}: <strong>{{ getActionStats.secondary }}%</strong></span>
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
                      <div class="weight-pill call" v-if="getComboWeights(hoveredCombo)[1] > 0">{{ getSecondaryActionLabel() }}: {{ getComboWeights(hoveredCombo)[1] }}%</div>
                      <div class="weight-pill fold" v-if="getComboWeights(hoveredCombo)[2] > 0">{{ t('legendFold') }}: {{ getComboWeights(hoveredCombo)[2] }}%</div>
                    </div>
                    <div class="details-reference-meta">
                      <span><strong>{{ t('currentSpotLabel') }}:</strong> {{ getCurrentSpotLabel() }}</span>
                      <span><strong>{{ t('primaryTendencyLabel') }}:</strong> {{ getPrimaryActionLabel(hoveredCombo) }}</span>
                      <template v-if="selectedSnapshotEntry">
                        <span><strong>{{ t('referenceFamilyLabel') }}:</strong> {{ selectedSnapshotEntry.handFamily }}</span>
                        <span><strong>{{ t('referenceClassificationLabel') }}:</strong> {{ selectedSnapshotEntry.classification }}</span>
                        <span><strong>{{ t('referenceVersionLabel') }}:</strong> {{ selectedSnapshotEntry.rangeVersion }}</span>
                      </template>
                    </div>
                    <div class="details-tip">
                      <span class="tip-label">{{ t('coachInsight') }}:</span> {{ getComboAdvice(hoveredCombo) }}
                    </div>
                    <button type="button" class="details-explorer-btn" @click="loadComboIntoExplorer(hoveredCombo)">
                      {{ t('useHandInExplorerCta') }}
                    </button>
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
          </section>

          <section
            v-else
            id="decision-guide-panel-explorer"
            class="explorer-shell animate-fadeIn"
            role="tabpanel"
            aria-labelledby="decision-guide-tab-explorer"
            tabindex="0"
          >
            <div class="section-intro explorer-intro">
              <p class="guide-eyebrow">{{ t('explorerEyebrow') }}</p>
              <h3>{{ t('explorerTitle') }}</h3>
              <p>{{ t('explorerDesc') }}</p>
            </div>

            <p class="explorer-boundary-note">{{ t('explorerBoundary') }}</p>

            <div
              class="explorer-tabs"
              role="tablist"
              :aria-label="t('explorerNavLabel')"
              @keydown="handleExplorerTabKeydown"
            >
              <button
                v-for="tab in explorerTabs"
                :id="`explorer-tab-${tab.id}`"
                :key="tab.id"
                :ref="(el) => setExplorerTabRef(el, tab.id)"
                class="explorer-tab"
                :class="{ active: activeTab === tab.id }"
                type="button"
                role="tab"
                :aria-selected="activeTab === tab.id"
                :aria-controls="`explorer-panel-${tab.id}`"
                :tabindex="activeTab === tab.id ? 0 : -1"
                @click="selectExplorerTab(tab.id)"
              >
                {{ tab.label }}
                <span v-if="tab.id === 'price' && priceBadgeText" class="tab-badge-status">{{ priceBadgeText }}</span>
                <span v-if="tab.id === 'draws' && drawsBadgeText" class="tab-badge-status">{{ drawsBadgeText }}</span>
                <span v-if="tab.id === 'board' && boardBadgeText" class="tab-badge-status">{{ boardBadgeText }}</span>
              </button>
            </div>

            <div
              v-if="activeTab === 'spot'"
              id="explorer-panel-spot"
              class="math-cheat-sheet animate-fadeIn"
              role="tabpanel"
              aria-labelledby="explorer-tab-spot"
              tabindex="0"
            >
              <div class="tab-decide-banner">
                <span class="decide-icon" aria-hidden="true">01</span>
                <div class="decide-text-container">
                  <span class="decide-banner-title">{{ t('spotSetupTitle') }}</span>
                  <ul class="decide-questions-list">
                    <li>• {{ t('spotSetupQ1') }}</li>
                    <li>• {{ t('spotSetupQ2') }}</li>
                    <li>• {{ t('spotSetupQ3') }}</li>
                  </ul>
                </div>
              </div>

              <div class="spot-setup-layout">
                <div class="spot-card-panel">
                  <div class="spot-panel-heading">
                    <div>
                      <h3>{{ t('spotCardsTitle') }}</h3>
                      <p>{{ t('spotCardsDesc') }}</p>
                    </div>
                    <button
                      v-if="hasLiveGameState"
                      class="sync-live-btn"
                      type="button"
                      @click="syncFromLiveGame"
                    >
                      {{ t('syncLive') }}
                    </button>
                  </div>

                  <div class="postflop-input-bar spot-input-bar">
                    <div class="input-group hero-hand-input-group">
                      <div class="input-group-label-stack">
                        <span class="group-label">{{ t('heroHandLabel') }}</span>
                        <span class="hand-input-helper-note">{{ t('handbook.heroHandHelperNote') }}</span>
                      </div>
                      <div class="card-slots-and-notice">
                        <div
                          ref="heroHandInputRef"
                          class="card-slots hero-card-slots"
                          :class="{ 'glow-pulse-highlight': highlightOddsInput }"
                        >
                          <div v-for="(card, idx) in 2" :key="'hero-' + idx" class="card-slot-wrapper">
                            <button
                              type="button"
                              class="interactive-card-slot"
                              :class="{ empty: !coachState.heroCards[idx] }"
                              :aria-label="getCardSlotLabel('hero', idx, coachState.heroCards[idx])"
                              @click="openCardPicker('hero', idx)"
                            >
                              <CardView v-if="coachState.heroCards[idx]" :cardStr="coachState.heroCards[idx]" :visible="true" />
                              <span v-else class="empty-slot-content" aria-hidden="true"><span class="plus-icon">+</span></span>
                            </button>
                            <button
                              v-if="coachState.heroCards[idx]"
                              class="clear-slot-btn"
                              type="button"
                              @click.stop="clearCard('hero', idx)"
                              :aria-label="t('clearCard')"
                            >
                              &times;
                            </button>
                          </div>
                        </div>
                        <transition name="fade-fast">
                          <span v-if="loadNoticeText" class="load-notice-text">{{ loadNoticeText }}</span>
                        </transition>
                      </div>
                    </div>

                    <div class="input-group">
                      <span class="group-label">{{ t('boardFlopLabel') }}</span>
                      <div class="card-slots">
                        <div v-for="(card, idx) in 3" :key="'board-' + idx" class="card-slot-wrapper">
                          <button
                            type="button"
                            class="interactive-card-slot"
                            :class="{ empty: !coachState.boardCards[idx] }"
                            :aria-label="getCardSlotLabel('board', idx, coachState.boardCards[idx])"
                            @click="openCardPicker('board', idx)"
                          >
                            <CardView v-if="coachState.boardCards[idx]" :cardStr="coachState.boardCards[idx]" :visible="true" />
                            <span v-else class="empty-slot-content" aria-hidden="true"><span class="plus-icon">+</span></span>
                          </button>
                          <button
                            v-if="coachState.boardCards[idx]"
                            class="clear-slot-btn"
                            type="button"
                            @click.stop="clearCard('board', idx)"
                            :aria-label="t('clearCard')"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="evaluatedHand" class="spot-made-hand-readout" aria-live="polite">
                    <span>{{ t('currentMadeHandLabel') }}</span>
                    <strong>{{ evaluatedHandLabel }}</strong>
                  </div>
                  <div v-else class="explorer-question-state">
                    <p>{{ t('spotEmptyIntro') }}</p>
                    <ul>
                      <li>{{ t('emptyGuideMadeHand') }}</li>
                      <li>{{ t('emptyGuideValue') }}</li>
                      <li>{{ t('emptyGuideDirtyOuts') }}</li>
                    </ul>
                  </div>
                </div>

                <aside class="live-snapshot-card" :aria-label="t('liveSnapshotTitle')">
                  <div class="snapshot-heading">
                    <span class="snapshot-kicker">{{ t('snapshotContextLabel') }}</span>
                    <h3>{{ t('liveSnapshotTitle') }}</h3>
                  </div>
                  <dl v-if="hasLiveSnapshot" class="snapshot-values">
                    <div>
                      <dt>{{ t('liveStreetLabel') }}</dt>
                      <dd>{{ liveStageLabel }}</dd>
                    </div>
                    <div>
                      <dt>{{ t('currentPotSnapshotLabel') }}</dt>
                      <dd>{{ formatSnapshotValue(liveSnapshot.currentPot) }}</dd>
                    </div>
                    <div>
                      <dt>{{ t('currentToCallSnapshotLabel') }}</dt>
                      <dd>{{ formatSnapshotValue(liveSnapshot.toCall) }}</dd>
                    </div>
                  </dl>
                  <p v-else class="snapshot-empty">{{ t('liveSnapshotEmpty') }}</p>
                  <p class="snapshot-boundary">{{ t('liveSnapshotBoundary') }}</p>
                </aside>
              </div>
            </div>

            <div
              v-else-if="activeTab === 'price'"
              id="explorer-panel-price"
              class="math-cheat-sheet animate-fadeIn"
              role="tabpanel"
              aria-labelledby="explorer-tab-price"
              tabindex="0"
            >
              <div class="tab-decide-banner">
                <span class="decide-icon" aria-hidden="true">02</span>
                <div class="decide-text-container">
                  <span class="decide-banner-title">{{ t('thinkingFrameworkTitle') }}</span>
                  <ul class="decide-questions-list">
                    <li>• {{ t('mathQ1') }}</li>
                    <li>• {{ t('mathQ2') }}</li>
                    <li>• {{ t('mathQ3') }}</li>
                  </ul>
                </div>
              </div>

              <div class="price-lab-layout">
                <div class="math-card console-card price-lab-card">
                  <div class="math-card-header">
                    <span class="math-card-icon" aria-hidden="true">%</span>
                    <div class="math-card-header-text">
                      <h3>{{ t('mathTitle') }}</h3>
                      <p class="math-card-desc">{{ t('mathDesc') }}</p>
                    </div>
                  </div>

                  <div class="math-inputs-container">
                    <div class="math-input-row price-input-row">
                      <div class="math-input-field">
                        <label for="explorer-pot-before-bet">{{ t('potBeforeBetInputLabel') }}</label>
                        <input
                          id="explorer-pot-before-bet"
                          v-model.number="manualPrice.potBeforeBet"
                          type="number"
                          min="0"
                          step="any"
                          inputmode="decimal"
                          placeholder="100"
                          class="premium-math-input"
                        />
                        <span class="input-helper">{{ t('potBeforeBetHelper') }}</span>
                      </div>
                      <div class="math-input-field">
                        <label for="explorer-villain-bet">{{ t('villainBetInputLabel') }}</label>
                        <input
                          id="explorer-villain-bet"
                          v-model.number="manualPrice.villainBet"
                          type="number"
                          min="0"
                          step="any"
                          inputmode="decimal"
                          placeholder="50"
                          class="premium-math-input"
                        />
                        <span class="input-helper">{{ t('villainBetHelper') }}</span>
                      </div>
                      <div class="math-input-field">
                        <label for="explorer-your-call">{{ t('yourCallInputLabel') }}</label>
                        <input
                          id="explorer-your-call"
                          v-model.number="manualPrice.yourCall"
                          type="number"
                          min="0"
                          step="any"
                          inputmode="decimal"
                          placeholder="50"
                          class="premium-math-input"
                        />
                        <span class="input-helper">{{ t('yourCallHelper') }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="math-formula-box">
                    <div class="formula-line">{{ t('requiredEquityFormula') }}</div>
                    <p class="price-formula-note">{{ t('priceFormulaBoundary') }}</p>
                  </div>

                  <div v-if="hasValidManualPrice" class="price-results" aria-live="polite">
                    <div class="result-item-row">
                      <span class="result-label">{{ t('finalPotLabel') }}</span>
                      <strong class="result-value font-mono">{{ formatPriceValue(finalPotIfCall) }}</strong>
                    </div>
                    <div class="result-item-row">
                      <span class="result-label">{{ t('requiredEquityLabel') }}</span>
                      <strong class="result-value font-mono">{{ manualRequiredEquity.toFixed(2) }}%</strong>
                    </div>
                  </div>
                  <div v-else class="price-empty-state">
                    {{ t('priceInputsPrompt') }}
                  </div>

                  <div class="price-truth-boundary">
                    <strong>{{ t('priceThresholdTitle') }}</strong>
                    <p>{{ t('priceThresholdDesc') }}</p>
                  </div>
                </div>

                <div class="price-side-stack">
                  <div class="educational-card">
                    <h4 class="card-title">{{ t('uncertaintyTitle') }}</h4>
                    <p class="card-body">{{ t('uncertaintyP1') }}</p>
                  </div>
                  <div class="educational-card">
                    <h4 class="card-title">{{ t('handbook.math.betSizeTitle') }}</h4>
                    <p class="card-body">{{ t('handbook.math.betSizeBody') }}</p>
                  </div>
                  <div class="educational-card">
                    <h4 class="card-title">{{ t('handbook.math.impliedOddsTitle') }}</h4>
                    <p class="card-body">{{ t('handbook.math.impliedOddsBody') }}</p>
                  </div>
                  <button type="button" class="guide-action" @click="handleTrainingCta('pot-odds')">
                    {{ t('trainPotOddsCta') }}
                  </button>
                </div>
              </div>
            </div>

          <!-- TAB 3: DRAWS -->
          <div
            v-else-if="activeTab === 'draws'"
            id="explorer-panel-draws"
            class="math-cheat-sheet animate-fadeIn"
            role="tabpanel"
            aria-labelledby="explorer-tab-draws"
            tabindex="0"
          >
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

            <div v-if="!isDrawAnalysisReady" class="postflop-empty-state explorer-invitation">
              <div class="empty-state-content">
                <span class="invitation-kicker">{{ t('optionalExplorerLabel') }}</span>
                <h3>{{ t('drawsEmptyTitle') }}</h3>
                <p class="desc">{{ t('drawsEmptyDesc') }}</p>
                <ul class="empty-guidance-list">
                  <li>{{ t('emptyGuideMadeHand') }}</li>
                  <li>{{ t('emptyGuideEquity') }}</li>
                  <li>{{ t('emptyGuideDirtyOuts') }}</li>
                </ul>
                <button type="button" class="guide-action" @click="selectExplorerTab('spot')">
                  {{ t('openSpotSetupCta') }}
                </button>
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
                    <p class="math-card-desc" v-else>{{ t('strongMadeDesc') }}</p>
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

                  <div class="linkage-status-bar neutral-boundary animate-fadeIn">
                    {{ t('drawTruthBoundary') }}
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
                        <strong>{{ t('strongMadeLens1') }}</strong>
                        {{ t('handbook.draws.strongMadePoint1') }}
                      </li>
                      <li>
                        <strong>{{ t('strongMadeLens2') }}</strong>
                        {{ t('handbook.draws.strongMadePoint2') }}
                      </li>
                      <li>
                        <strong>{{ t('strongMadeLens3') }}</strong>
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
          <div
            v-else-if="activeTab === 'board'"
            id="explorer-panel-board"
            class="math-cheat-sheet animate-fadeIn"
            role="tabpanel"
            aria-labelledby="explorer-tab-board"
            tabindex="0"
          >
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

            <div v-if="!isPostflopReady" class="postflop-empty-state explorer-invitation">
              <div class="empty-state-content">
                <span class="invitation-kicker">{{ t('optionalExplorerLabel') }}</span>
                <h3>{{ t('boardEmptyTitle') }}</h3>
                <p class="desc">{{ t('boardEmptyDesc') }}</p>
                <ul class="empty-guidance-list">
                  <li>{{ t('boardEmptyQ1') }}</li>
                  <li>{{ t('boardEmptyQ2') }}</li>
                  <li>{{ t('boardEmptyQ3') }}</li>
                </ul>
                <button type="button" class="guide-action" @click="selectExplorerTab('spot')">
                  {{ t('openSpotSetupCta') }}
                </button>
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
          </section>
        </div>
      </div>
    </Transition>

    <!-- Card Picker Modal Popup Overlay -->
    <Transition name="modal-fade">
      <div v-if="showCardPicker" class="picker-modal-overlay" @click.self="closeCardPicker">
        <div class="picker-modal-content animate-scaleIn">
          <button class="picker-close-btn" @click="closeCardPicker" :aria-label="t('closePickerLabel')">&times;</button>
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
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useOnlineStore } from '@/stores/online'
import { normalizeCard } from '@/utils/cardFormat'
import { evaluateHoldemHand } from '@/utils/pokerEvaluator'
import {
  HU_BTN_RFI_RANGE_ID,
  HU_BTN_RFI_RANGE_VERSION,
  HU_BTN_RFI_ASSUMPTIONS,
  HU_169_HAND_MATRIX_ORDER,
  HU_BTN_RFI_100BB_V1_BY_HAND
} from '@/training/ranges/hu-btn-rfi-100bb-v1.js'
import { PREFLOP_EXPLANATIONS } from '@/training/explanations/preflop-explanations.js'
import CardView from '@/components/online/CardView.vue'
import LocaleSwitcher from '@/components/common/LocaleSwitcher.vue'
import { isZh } from '@/i18n/locale.js'

const dictionary = {
  en: {
    badge: 'POSTSOMA · DECISION GUIDE',
    title: 'Decision Guide',
    guide: 'Start Here',
    motto: 'Build a repeatable way to read range, price, equity, and risk before you act. Learn the framework first; explore a concrete hand only when it helps.',
    closeGuideLabel: 'Close Decision Guide',
    primaryNavLabel: 'Decision Guide sections',
    navStartKicker: '01',
    navStart: 'Start Here',
    navConceptsKicker: '02',
    navConcepts: 'Concepts',
    navReferenceKicker: '03',
    navReference: 'Reference',
    navExplorerKicker: '04',
    navExplorer: 'Explorer',
    startEyebrow: 'A five-question decision loop',
    startTitle: 'Think through the spot before chasing an answer.',
    startDesc: 'These questions transfer from a ten-hand drill to a live heads-up table. No cards, pot inputs, room, or API key are required to begin.',
    fiveQuestionsLabel: 'Five-question poker decision flow',
    stepHandTitle: 'Hand · What am I holding?',
    stepHandQuestion: 'Read rank, suits, connectivity, blockers, and postflop playability.',
    stepContextTitle: 'Context · What situation am I in?',
    stepContextQuestion: 'Locate position, effective stack, and the action before you.',
    stepRangeTitle: 'Range · What can each player arrive with?',
    stepRangeQuestion: 'Think in frequencies and tendencies, not only playable or unplayable.',
    stepPriceTitle: 'Price · What does this price require?',
    stepPriceQuestion: 'Compare the cost of continuing with the equity the price demands.',
    stepRiskTitle: 'Risk · What could distort the judgment?',
    stepRiskQuestion: 'Check dirty outs, rake, future action, and result-oriented thinking.',
    trainPreflopCta: 'Open HU Range Practice',
    trainPotOddsCta: 'Open Price Builder',
    viewRangeCta: 'View Range Reference',
    openExplorerCta: 'Explorer · Study a Specific Spot',
    guideTruthBoundary: 'Training answers come from a versioned baseline or fixed math model. The Guide teaches a process; it does not create a new strategy truth.',
    conceptsEyebrow: 'Five lenses, one decision',
    conceptsTitle: 'Portable concepts for uncertain spots',
    conceptsDesc: 'Each lens gives you one question, one principle, and one reason to stay humble about the answer.',
    conceptHandTitle: 'Hand',
    conceptHandQuestion: 'What is this hand capable of—not just how high is it?',
    conceptHandPrinciple: 'Hand value also comes from suits, connectivity, blockers, and postflop playability.',
    conceptHandReminder: 'Two hands with similar raw strength can realize equity very differently.',
    conceptHandCta: 'Explore a specific hand',
    conceptContextTitle: 'Context',
    conceptContextQuestion: 'What changed before I had to decide?',
    conceptContextPrinciple: 'Position, effective stack, and prior action change the value of the same two cards.',
    conceptContextReminder: 'A hand does not carry one universal action across every spot.',
    conceptContextCta: 'Open the Explorer',
    conceptRangeTitle: 'Range',
    conceptRangeQuestion: 'Which hands and frequencies belong in this spot?',
    conceptRangePrinciple: 'A range is not simply playable or unplayable; edge hands can be frequency and mixed-strategy decisions.',
    conceptRangeReminder: 'baseline-v1 is a versioned training reference—not solver output or the only correct strategy.',
    conceptRangeCta: 'Open the range reference',
    conceptPriceTitle: 'Price',
    conceptPriceQuestion: 'What minimum real equity does the current price require?',
    conceptPricePrinciple: 'Look at price before outcome. A half-pot bet usually requires about 25% equity to call in the fixed no-rake example.',
    conceptPriceReminder: 'That threshold is a math example, not a complete strategy verdict.',
    conceptPriceCta: 'Practice Pot Odds / EV',
    conceptRiskTitle: 'Risk',
    conceptRiskQuestion: 'Which hidden assumptions could make the estimate too optimistic?',
    conceptRiskPrinciple: 'Dirty outs, rake, future betting, and range shifts can all change what your estimate means.',
    conceptRiskReminder: 'Draw-hit probability is not true equity versus a range, and one hand result does not define decision quality.',
    conceptRiskCta: 'Inspect a concrete example',
    explorerEyebrow: 'Optional concrete-hand workspace',
    explorerTitle: 'Explorer · Free-form experiment',
    explorerDesc: 'Add Hero cards and a flop only when you want to inspect a concrete example. The core concepts remain available without any input.',
    explorerNavLabel: 'Explorer tools',
    explorerBoundary: 'This is a simplified concept workspace—not a solver, a complete strategy answer, or a source of training truth.',
    tabSpot: 'Spot Setup',
    tabPrice: 'Price',
    spotSetupTitle: 'Spot Setup · Describe what is visible',
    spotSetupQ1: 'Do I already have a made hand or showdown value?',
    spotSetupQ2: 'Am I paying to improve, or continuing with value I already hold?',
    spotSetupQ3: 'Which range, position, and future-street risks are still unknown?',
    spotCardsTitle: 'Hero hand and flop',
    spotCardsDesc: 'Cards are optional. Add them only to inspect hand class, draw possibilities, or board texture.',
    currentMadeHandLabel: 'Current made-hand reading',
    spotEmptyIntro: 'No input is required. Start with questions that still matter before a concrete example exists:',
    emptyGuideMadeHand: 'Do I already hold a made hand or meaningful showdown value?',
    emptyGuideValue: 'Am I paying to improve, or continuing with value already present?',
    emptyGuideEquity: 'Have I mistaken draw-hit probability for true equity versus a range?',
    emptyGuideDirtyOuts: 'Which outs may be dirty, and which future-street risks are missing?',
    liveSnapshotTitle: 'Live game snapshot',
    snapshotContextLabel: 'Context only',
    liveStreetLabel: 'Street / stage',
    stagePreflop: 'Preflop',
    stageFlop: 'Flop',
    stageTurn: 'Turn',
    stageRiver: 'River',
    stageShowdown: 'Showdown',
    currentPotSnapshotLabel: 'Current pot snapshot',
    currentToCallSnapshotLabel: 'Current to-call snapshot',
    liveSnapshotEmpty: 'No live table snapshot is available. Manual exploration remains available.',
    liveSnapshotBoundary: 'Sync shows the current cards and committed-chip state. It does not reconstruct betting history, pot before bet, or Villain bet—and it is not training truth.',
    potBeforeBetInputLabel: 'Pot before bet',
    potBeforeBetHelper: 'Enter the pot before Villain makes this bet.',
    villainBetInputLabel: 'Villain bet',
    villainBetHelper: 'Enter this bet manually; it is not inferred from a live snapshot.',
    yourCallInputLabel: 'Your call',
    yourCallHelper: 'The additional amount Hero would put in now.',
    requiredEquityFormula: 'Required equity = Your call ÷ (Pot before bet + Villain bet + Your call)',
    priceFormulaBoundary: 'A simplified, no-rake price threshold for the current additional investment.',
    finalPotLabel: 'Final pot if you call',
    priceInputsPrompt: 'Enter all three manual fields to reveal the final pot and price threshold.',
    priceThresholdTitle: 'Price threshold—not an action verdict',
    priceThresholdDesc: 'Required equity is the true equity threshold for continuing. Explorer does not estimate Hero’s true equity versus Villain’s range, so it cannot judge Call or Fold.',
    badgePriceThreshold: 'threshold',
    drawsEmptyTitle: 'Inspect draw-hit probability when cards help',
    drawsEmptyDesc: 'Add both Hero cards and a flop in Spot Setup to inspect possible draws. Until then, use the questions below.',
    openSpotSetupCta: 'Open Spot Setup',
    drawTruthBoundary: 'Draw-hit probability builds intuition about improvement. It is not true equity versus Villain’s range and cannot decide Call or Fold by itself.',
    strongMadeDesc: 'A made hand may already have showdown value. Draw-hit probability describes improvement, not the full value of continuing.',
    strongMadeLens1: 'Current value: ',
    strongMadeLens2: 'Future risk: ',
    strongMadeLens3: 'Range context: ',
    boardEmptyTitle: 'Observe a board when a concrete flop helps',
    boardEmptyDesc: 'Add a flop in Spot Setup when you want to classify its texture. The questions remain useful before any cards are entered.',
    boardEmptyQ1: 'Is the board paired, monotone, or connected?',
    boardEmptyQ2: 'Which draws or made hands could this texture support?',
    boardEmptyQ3: 'What range and action context would be needed before choosing a line?',
    optionalExplorerLabel: 'Optional example',
    exploreSpecificTitle: 'Explore a specific postflop spot',
    exploreSpecificDesc: 'Add Hero cards and a flop when you want to inspect a concrete example.',
    basicConceptsAvailable: 'You can return to Start Here, Concepts, or Reference at any time—learning is not locked behind these inputs.',
    useHandInExplorerCta: 'Use this hand in Explorer',
    rangeGridLabel: '169 starting-hand range reference',
    currentSpotLabel: 'Current spot',
    primaryTendencyLabel: 'Primary tendency',
    cardSlotHero: 'Hero card',
    cardSlotBoard: 'Flop card',
    thinkingFrameworkTitle: 'Thinking Framework',
    preflopQ1: 'Can I enter the hand?',
    preflopQ2: 'How playable is this hand heads-up?',
    preflopQ3: 'What line fits this spot: raise, call, or fold?',
    mathQ1: 'What is the pot before the bet?',
    mathQ2: 'What am I paying, and what is the final pot if I call?',
    mathQ3: 'Does my estimated real equity meet the price—and have I kept it separate from draw-hit probability?',
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
    tabMath: 'Price',
    tabDraws: 'Draws',
    tabBoard: 'Board',
    decidePreflop: 'What this helps you decide: Your baseline preflop opening and defending strategies based on position and hand strength to avoid entry mistakes.',
    decideMath: 'What this helps you inspect: the real-equity threshold created by a manually defined price.',
    decideDraws: 'What this helps you inspect: approximate and exact draw-hit probability under fixed unseen-card assumptions.',
    decideBoard: 'What this helps you inspect: visible texture features and the range questions they create.',
    sbButton: 'SB (Button)',
    bbBigBlind: 'BB (Big Blind)',
    openRaiseRfi: 'Open-Raise / RFI',
    defendVsSbOpen: 'Defend vs SB Open (2.5x)',
    legendRaise: 'Raise',
    legendLimp: 'Limp',
    legendCall: 'Call',
    legendFold: 'Fold',
    referenceVerifiedBaseline: 'Versioned range reference',
    referenceNotSolver: 'Not solver output',
    referenceOpenSize: 'Open size',
    referenceSourceLabel: 'Source',
    referenceLegacySnapshotSource: 'Fixed snapshot of the legacy local heuristic',
    referenceBaselineBoundary: 'A versioned training baseline, not the only correct strategy.',
    referenceBbTitle: 'BB defend reference · Facing an SB 2.5x open',
    referenceBbBoundary: 'This spot keeps the existing local BB defend heuristic. It is not the baseline-v1 Button RFI snapshot.',
    referenceFamilyLabel: 'Hand family',
    referenceClassificationLabel: 'Classification',
    referenceVersionLabel: 'Version',
    referenceDataUnavailable: 'Reference data unavailable',
    referenceExplanationFallback: 'This cell belongs to the versioned baseline. Use its frequencies as a learning reference, not an absolute strategy verdict.',
    assumptionHeadsUp: 'Heads-up',
    assumptionSbButton: 'SB/Button',
    assumptionUnopenedPot: 'Unopened Pot',
    backToGuideCta: 'Back to Decision Guide',
    placeholder: 'Click, focus, or hover a matrix cell to inspect its reference frequencies and short tactical note.',
    coachInsight: 'COACH INSIGHT',
    pocketPair: 'Pocket Pair',
    suitedHand: 'Suited Hand',
    offsuitHand: 'Offsuit Hand',
    mathTitle: 'Price Experiment',
    mathDesc: 'Change three explicit manual inputs to see the final pot and required-equity threshold. No live value is inserted here.',
    potOddsFormula: 'Required equity = Your call / Final pot if you call',
    riskLabel: 'Risk (Chips to Call):',
    riskDesc: 'Chips to call.',
    rewardLabel: 'Reward (Total Pot):',
    rewardDesc: 'Final pot is derived only from the three manual experiment fields.',
    requiredEquityLabel: 'Required real-equity threshold',
    requiredEquityDesc: 'The minimum true equity required by this simplified price; Explorer does not calculate it for your hand.',
    exampleTitle: '💡 WORKED EXAMPLE (Standard 1v1 Spot)',
    examplePot: 'Pot:',
    exampleOppBet: 'Opponent\'s Bet:',
    exampleRisk: 'Your Risk to Call:',
    exampleReward: 'Total Reward:',
    exampleMath: 'The Math:',
    actualEqGteReq: 'Estimated real equity and the price threshold are separate inputs.',
    actualEqLtReq: 'Draw-hit probability is not a substitute for real equity.',
    profitableCall: 'Use the verified Pot Odds / EV Drill to practice scored decisions.',
    profitableFold: 'Explorer shows a threshold, not a Call/Fold verdict.',
    mathGoldenRuleTitle: 'PRICE BOUNDARY:',
    mathGoldenRuleText: 'Pot odds describe the minimum true equity required by a price. Opponent range, rake, dirty outs, future betting, reverse implied odds, and split pots can change the real decision.',
    uncertaintyTitle: 'Decision Under Uncertainty',
    uncertaintyDesc: 'A price threshold is useful only when its assumptions stay visible.',
    uncertaintyP1: 'Outs and draw-hit probability describe possible improvement. True equity depends on how Hero performs against Villain’s range; Explorer does not calculate that range-based value.',
    goDrawsLink: 'Open Draws to inspect outs and draw-hit probability without turning them into an action verdict.',
    drawsTitle: 'Common Draw Odds',
    drawsDesc: 'Chances of hitting a candidate improvement card based on raw outs.',
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
    rule24Desc: 'Quick mental math for approximate draw-hit probability—not true equity versus a range.',
    f2rCalc: 'Outs × 4 %',
    f2rNote: 'Use on the Flop when estimating the total chance of hitting by the River.',
    t2rCalc: 'Outs × 2 %',
    t2rNote: 'Use on the Turn when only one card is left to deal.',
    cleanOutsTitle: '⚠️ CLEAN OUTS WARNING:',
    cleanOutsText: 'Not all outs are clean. If hitting one of your out cards completes a stronger hand (like a flush or higher straight) for your opponent, that card is a dirty out. You must discount these from your calculations.',
    'handbook.draws.linkageProfitable': 'Draw-hit probability is an improvement estimate, not an action verdict.',
    'handbook.draws.linkageUnprofitable': 'True equity versus a range is required before comparing a hand with a price threshold.',
    'handbook.draws.linkageNeedsInput': 'Price and draw-hit probability remain separate concept tools.',
    'handbook.draws.flopOnlyHint': '(Flop only)',
    'handbook.draws.turnOnlyHint': '(Turn only)',
    'handbook.draws.strongMadeTitle': 'Strong Made Hand, No Draw Needed',
    'handbook.draws.strongMadePoint1': 'Ask how much showdown value the current made hand already carries before focusing on improvement.',
    'handbook.draws.strongMadePoint2': 'Notice which turn and river cards could weaken that value or complete visible draws.',
    'handbook.draws.strongMadePoint3': 'Position, prior action, and Villain’s range are still required before choosing a betting line.',
    'handbook.preflop.positionTitle': 'Why Position Matters',
    'handbook.preflop.positionBody': 'In heads-up poker, the small blind/button acts first preflop but has position postflop.\nActing last gives you more information before deciding whether to bet, call, or control the pot.\nThis is why the Button/SB can open wider, while the BB defends with a price but often plays out of position postflop.',
    'handbook.math.betSizeTitle': 'How Bet Size Changes the Decision',
    'handbook.math.betSizeBody': 'A larger price requires more true equity to continue.\nA draw-hit percentage alone cannot tell whether that threshold is met because made-hand value and Villain’s range are missing.\nUse the fields here to inspect only how the price threshold changes.',
    'handbook.math.impliedOddsTitle': 'What Are Implied Odds?',
    'handbook.math.impliedOddsBody': 'Sometimes direct pot odds are not enough.\nBut if you can win more chips later when you hit, calling may still have a reason.\nThis is called implied odds.\nDo not overuse implied odds: if your opponent will not pay later, or your outs are not clean, implied odds can be overestimated.',
    'handbook.draws.outsWinsTitle': 'Outs Do Not Always Mean Wins',
    'handbook.draws.outsWinsBody': 'An out improves your hand, but it does not guarantee you win.\nIf a card also completes a stronger hand for your opponent, it may be a dirty out.\nFor example, a low flush can lose to a higher flush; on paired boards, a completed flush can still lose to a full house.',
    'handbook.draws.madeHandVsDrawTitle': 'Made Hand vs Draw',
    'handbook.draws.madeHandVsDrawBody': 'Made Hand: already has showdown value, such as pair, two pair, or trips.\nDraw: may be behind now, but can improve on the turn or river.\nMade hands often think about protection and value; draws focus more on outs, pot odds, and implied odds.',
    'handbook.draws.linkageNeedsInput': 'Price and draw-hit probability remain separate concept tools.',
    'handbook.draws.flopOnlyHint': '(Flop only)',
    'handbook.draws.turnOnlyHint': '(Turn only)',
    'handbook.heroHandHelperNote': '* Click chart to load default suits, click slot to change.',
    boardTitle: 'Postflop Board Textures',
    boardComingSoon: 'Coming Soon',
    boardDesc: 'Classify visible board texture and use it to ask better range and risk questions without prescribing an action.',
    postflopLockedTitle: 'Explore a specific postflop spot',
    postflopLockedDesc: 'Add Hero cards and a flop when you want to inspect a concrete example.',
    heroHandLabel: 'Hero Hand',
    boardFlopLabel: 'Board (Flop)',
    syncLive: 'Sync live game snapshot',
    syncLiveTooltip: 'Copy current cards and committed-chip context without changing the manual price experiment',
    potSizeInputLabel: 'Pot before bet',
    callAmountInputLabel: 'Your call',
    highestDrawLabel: 'Highest Draw Detected',
    drawEquityLabel: 'Draw-hit probability (to River)',
    noMajorDraw: 'No major draw',
    coachAdviceTitle: 'CONCEPT BOUNDARY',
    callingReasonable: 'Explorer does not issue a Call/Fold judgment.',
    callingUnprofitable: 'Explorer does not issue a Call/Fold judgment.',
    addPotAndCall: 'Enter the three manual price fields to inspect a threshold.',
    activeDrawsTitle: 'Current Hand Draws',
    activeDrawsDesc: 'Possible draws, raw outs, and draw-hit probability for the selected cards. This is not range-based equity.',
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
    boardTacticalDesc: 'Questions about texture, ranges, and risks—not a prescribed action.',
    flushDrawsLabel: 'Flush Potential',
    straightDrawsLabel: 'Straight Potential',
    coachBoardInsight: 'Observation prompt',
    yesFlushDraw: 'Flush draws possible (2+ suited)',
    noFlushDraw: 'No flush draws (Rainbow)',
    yesStraightDraw: 'Straight draws possible (connected)',
    noStraightDraw: 'No straight draws (disconnected)',
    texture_wet: 'Wet Board',
    texture_semiWet: 'Semi-Wet Board',
    texture_dry: 'Dry Board',
    badgeOuts: 'Outs',
    badgeRequired: 'Price threshold',
    needsPotBadge: 'Add price',
    pickerTitle: 'Card Picker',
    pickerHeroSub: 'Select card for your hand',
    pickerBoardSub: 'Select card for the flop',
    closePickerLabel: 'Close card picker',
    clearCard: 'Clear Slot',
    cancel: 'Cancel'
  },
  zh: {
    badge: 'POSTSOMA · 决策指南',
    title: '决策指南',
    guide: '回到开始',
    motto: '行动前，用可重复的流程看清范围、价格、概率与风险。先理解思考框架；只有在需要时，才研究一手具体牌。',
    closeGuideLabel: '关闭决策指南',
    primaryNavLabel: '决策指南分区',
    navStartKicker: '01',
    navStart: '开始',
    navConceptsKicker: '02',
    navConcepts: '概念',
    navReferenceKicker: '03',
    navReference: '范围参考',
    navExplorerKicker: '04',
    navExplorer: '自由实验',
    startEyebrow: '五问决策流程',
    startTitle: '先看懂局面，再寻找答案。',
    startDesc: '这五个问题可以从十手训练迁移到单挑牌桌。开始学习不需要填牌、输入底池、创建房间或配置 API Key。',
    fiveQuestionsLabel: '扑克五问决策流程',
    stepHandTitle: '手牌：我拿到的是什么？',
    stepHandQuestion: '同时观察点数、花色、连接性、阻断牌与翻后可玩性。',
    stepContextTitle: '局面：我处于什么局面？',
    stepContextQuestion: '确认位置、有效筹码，以及轮到我前发生了什么。',
    stepRangeTitle: '范围：我的范围与对手范围是什么？',
    stepRangeQuestion: '用频率和倾向思考，而不是只分“能玩 / 不能玩”。',
    stepPriceTitle: '价格：这个价格要求什么？',
    stepPriceQuestion: '比较继续付出的成本与价格要求的最低真实 equity。',
    stepRiskTitle: '风险：哪些风险会让判断失真？',
    stepRiskQuestion: '检查脏 outs、rake、后续行动，以及结果导向偏差。',
    trainPreflopCta: '进入 HU 范围参考练习',
    trainPotOddsCta: '打开价格计算',
    viewRangeCta: '打开范围矩阵',
    openExplorerCta: '研究具体牌局',
    guideTruthBoundary: '训练答案来自版本化 baseline 或固定数学模型。决策指南提供思考流程，不创造新的策略真值。',
    conceptsEyebrow: '五个视角，一次决策',
    conceptsTitle: '可迁移到不确定局面的核心概念',
    conceptsDesc: '每个视角只给你一个问题、一条原则，以及一个需要对结论保持克制的理由。',
    conceptHandTitle: '手牌（Hand）',
    conceptHandQuestion: '这手牌能做什么，而不只是它现在有多大？',
    conceptHandPrinciple: '牌力也来自花色、连接性、blocker 与翻后可玩性。',
    conceptHandReminder: '原始强度接近的两手牌，最终实现 equity 的能力可能差很多。',
    conceptHandCta: '研究一手具体牌',
    conceptContextTitle: '局面（Context）',
    conceptContextQuestion: '轮到我决定前，哪些条件已经改变？',
    conceptContextPrinciple: '位置、有效筹码和前面行动会改变同一手牌的价值。',
    conceptContextReminder: '同一手牌不会在所有局面中对应一个固定行动。',
    conceptContextCta: '打开自由实验台',
    conceptRangeTitle: '手牌范围（Range）',
    conceptRangeQuestion: '这个局面包含哪些手牌与行动频率？',
    conceptRangePrinciple: '范围不是简单“能玩 / 不能玩”；边缘牌可能是频率或混合策略问题。',
    conceptRangeReminder: 'baseline-v1 是版本化训练参考，不是 solver 输出，也不是唯一正确策略。',
    conceptRangeCta: '打开范围参考',
    conceptPriceTitle: '价格（Price）',
    conceptPriceQuestion: '当前价格要求多少最低真实 equity？',
    conceptPricePrinciple: '先看价格，不先看结果。在固定、无 rake 示例中，面对半池下注通常需要约 25% equity。',
    conceptPriceReminder: '这个门槛是数学示例，不是完整策略裁判。',
    conceptPriceCta: '练 Pot Odds / EV',
    conceptRiskTitle: '风险（Risk）',
    conceptRiskQuestion: '哪些隐藏假设会让估计过于乐观？',
    conceptRiskPrinciple: '脏 outs、rake、后续下注与范围变化都会改变估计的含义。',
    conceptRiskReminder: '听牌命中概率不等于对对手范围的真实 equity；单手结果也不定义决策质量。',
    conceptRiskCta: '观察一个具体例子',
    explorerEyebrow: '可选的具体牌局工作区',
    explorerTitle: '自由实验台',
    explorerDesc: '只有在想研究一手具体牌时，才添加 Hero Hand 与 Flop。基础概念无需任何输入即可学习。',
    explorerNavLabel: '自由实验工具',
    explorerBoundary: '这是用于观察概念的简化工作区，不是 solver、完整策略答案或训练真值来源。',
    tabSpot: '具体局面',
    tabPrice: '价格实验',
    spotSetupTitle: '具体局面',
    spotSetupQ1: '我是否已经拥有成牌或摊牌价值？',
    spotSetupQ2: '我是在为改善牌付费，还是已经拥有可以继续的价值？',
    spotSetupQ3: '范围、位置和后续街风险中，还有哪些信息未知？',
    spotCardsTitle: 'Hero 手牌与 Flop',
    spotCardsDesc: '牌面输入是可选的；只在想观察牌型、听牌可能或牌面结构时添加。',
    currentMadeHandLabel: '当前成牌观察',
    spotEmptyIntro: '无需输入也能开始。先问这些在具体牌面出现前依然重要的问题：',
    emptyGuideMadeHand: '我是否已经拥有成牌或足够的摊牌价值？',
    emptyGuideValue: '我是在为改善牌付费，还是已经拥有可以继续的价值？',
    emptyGuideEquity: '我是否把听牌命中概率误当成了对范围的真实 equity？',
    emptyGuideDirtyOuts: '哪些 outs 可能不干净，哪些后续街风险尚未计入？',
    liveSnapshotTitle: '实时牌局快照',
    snapshotContextLabel: '仅作局面参考',
    liveStreetLabel: '当前街 / 阶段',
    stagePreflop: '翻前',
    stageFlop: '翻牌',
    stageTurn: '转牌',
    stageRiver: '河牌',
    stageShowdown: '摊牌',
    currentPotSnapshotLabel: '当前底池快照',
    currentToCallSnapshotLabel: '当前待跟金额快照',
    liveSnapshotEmpty: '当前没有可用的实时牌桌快照；手动实验仍可正常使用。',
    liveSnapshotBoundary: '同步只展示此刻的牌面与已投入筹码状态，不重建完整下注历史、下注前底池或对手本次下注，也不是训练真值。',
    potBeforeBetInputLabel: '下注前底池',
    potBeforeBetHelper: '手动输入对手本次下注发生前的底池。',
    villainBetInputLabel: '对手下注',
    villainBetHelper: '请手动输入；不会从实时快照推断。',
    yourCallInputLabel: '你的跟注',
    yourCallHelper: 'Hero 此刻需要额外投入的金额。',
    requiredEquityFormula: '所需真实 equity = 你的跟注 ÷（下注前底池 + 对手下注 + 你的跟注）',
    priceFormulaBoundary: '这是一个不含 rake 的简化当前增量投入价格门槛。',
    finalPotLabel: '跟注后最终底池',
    priceInputsPrompt: '填写三个手动字段后，才会显示最终底池与价格门槛。',
    priceThresholdTitle: '这是价格门槛，不是行动裁判',
    priceThresholdDesc: '所需 equity 是继续投入要求的真实 equity 门槛。Explorer 不计算 Hero 对 Villain 范围的真实 equity，因此不能裁定 Call 或 Fold。',
    badgePriceThreshold: '价格门槛',
    drawsEmptyTitle: '在具体牌面有帮助时观察听牌命中概率',
    drawsEmptyDesc: '在“具体局面”中添加两张 Hero 手牌与 Flop，即可观察可能听牌；未填写时先使用以下问题。',
    openSpotSetupCta: '打开具体局面',
    drawTruthBoundary: '听牌命中概率只用于建立改善牌的直觉；它不是 Hero 对 Villain 范围的真实 equity，也不能单独决定 Call 或 Fold。',
    strongMadeDesc: '成牌可能已经拥有摊牌价值。听牌命中概率描述的是改善机会，不是继续行动的全部价值。',
    strongMadeLens1: '当前价值：',
    strongMadeLens2: '后续风险：',
    strongMadeLens3: '范围语境：',
    boardEmptyTitle: '需要具体 Flop 时再观察牌面',
    boardEmptyDesc: '想分类牌面结构时，再到“具体局面”添加 Flop；未输入牌面也可以先思考以下问题。',
    boardEmptyQ1: '牌面是否成对、单色或连接？',
    boardEmptyQ2: '这种结构可能支持哪些听牌或成牌？',
    boardEmptyQ3: '在选择行动前，还需要哪些范围与行动信息？',
    optionalExplorerLabel: '可选具体例子',
    exploreSpecificTitle: '研究一手具体翻后局面',
    exploreSpecificDesc: '想研究具体翻后局面时，再添加 Hero Hand 和 Flop。',
    basicConceptsAvailable: '你可以随时返回“开始”“概念”或“范围参考”；学习不会被输入表单锁住。',
    useHandInExplorerCta: '用此手牌在 Explorer 中查看',
    rangeGridLabel: '169 格起手牌范围参考',
    currentSpotLabel: '当前局面',
    primaryTendencyLabel: '主要倾向',
    cardSlotHero: 'Hero 手牌',
    cardSlotBoard: 'Flop 公共牌',
    thinkingFrameworkTitle: '思考框架',
    preflopQ1: '我能不能进入这手牌？',
    preflopQ2: '这手牌在单挑里可玩性如何？',
    preflopQ3: '这里更适合加注、跟注还是弃牌？',
    mathQ1: '对手下注前的底池是多少？',
    mathQ2: '我需要支付多少，跟注后的最终底池是多少？',
    mathQ3: '我估计的真实 equity 是否达到价格门槛，并且没有把它与听牌命中概率混为一谈？',
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
    tabMath: '价格实验',
    tabDraws: '听牌',
    tabBoard: '牌面',
    decidePreflop: '帮助你决策：基于位置与起手牌强度的翻牌前动作基准，避免盲目入池。',
    decideMath: '帮助你观察：手动定义的价格会产生怎样的真实 equity 门槛。',
    decideDraws: '帮助你观察：在固定未知牌假设下，用近似与精确公式估算听牌命中概率。',
    decideBoard: '帮助你观察：可见的牌面结构，以及它带来的范围与风险问题。',
    sbButton: 'SB (小盲/庄家)',
    bbBigBlind: 'BB (大盲)',
    openRaiseRfi: '开池加注 / RFI',
    defendVsSbOpen: '防守对抗 SB 开池 (2.5x)',
    legendRaise: '加注',
    legendLimp: 'Limp',
    legendCall: '跟注',
    legendFold: '弃牌',
    referenceVerifiedBaseline: '版本化范围参考',
    referenceNotSolver: '不是 solver 输出',
    referenceOpenSize: '开池尺度',
    referenceSourceLabel: '数据来源',
    referenceLegacySnapshotSource: '既有本地启发式规则的固定快照',
    referenceBaselineBoundary: '这是版本化训练 baseline，不是唯一正确策略。',
    referenceBbTitle: 'BB 防守参考：面对 SB 2.5x 开池',
    referenceBbBoundary: '此场景继续使用既有本地 BB 防守启发式，不属于 baseline-v1 Button RFI 快照。',
    referenceFamilyLabel: '手牌家族',
    referenceClassificationLabel: '分类',
    referenceVersionLabel: '版本',
    referenceDataUnavailable: '暂无参考数据',
    referenceExplanationFallback: '该格属于版本化 baseline；请将频率作为学习参考，而不是绝对策略裁判。',
    assumptionHeadsUp: 'Heads-up',
    assumptionSbButton: 'SB/Button',
    assumptionUnopenedPot: 'Unopened Pot',
    backToGuideCta: '返回决策指南',
    placeholder: '点击、聚焦或悬停矩阵格，查看参考行动频率与简短提示。',
    coachInsight: '教练建议',
    pocketPair: '口袋对子',
    suitedHand: '同花手牌',
    offsuitHand: '不同花手牌',
    mathTitle: '价格实验',
    mathDesc: '调整三个含义明确的手动字段，观察最终底池与所需 equity 门槛；实时数据不会写入这里。',
    potOddsFormula: '所需 equity = 你的跟注 / 跟注后最终底池',
    riskLabel: '跟注成本 (Risk):',
    riskDesc: '跟注需要投入的筹码量。',
    rewardLabel: '可赢底池 (Reward):',
    rewardDesc: '最终底池只由三个手动实验字段派生。',
    requiredEquityLabel: '所需真实 equity 门槛',
    requiredEquityDesc: '这个简化价格要求的最低真实 equity；Explorer 不替你的手牌计算该值。',
    exampleTitle: '💡 算例 (标准单挑场景)',
    examplePot: '底池:',
    exampleOppBet: '对手下注:',
    exampleRisk: '你的跟注风险/成本:',
    exampleReward: '可赢底池/总回报:',
    exampleMath: '数学计算:',
    actualEqGteReq: '估计的真实 equity 与价格门槛是两个独立输入。',
    actualEqLtReq: '听牌命中概率不能替代真实 equity。',
    profitableCall: '请使用固定真值的 Pot Odds / EV Drill 练习评分决策。',
    profitableFold: 'Explorer 只展示门槛，不输出 Call/Fold 裁判。',
    mathGoldenRuleTitle: '价格边界：',
    mathGoldenRuleText: 'Pot odds 只描述当前价格要求的最低真实 equity。对手范围、rake、脏 outs、后续下注、反向隐含赔率与分池都会改变真实决策。',
    uncertaintyTitle: '不确定性下的决策科学',
    uncertaintyDesc: '只有把假设留在视野中，价格门槛才有教学价值。',
    uncertaintyP1: 'Outs 与听牌命中概率描述可能的改善。真实 equity 取决于 Hero 对 Villain 范围的整体表现；Explorer 不计算这个范围对抗值。',
    goDrawsLink: '打开“改善概率”，观察 outs 与听牌命中概率，但不要把它们变成行动裁判。',
    drawsTitle: '常见听牌命中概率表',
    drawsDesc: '基于 raw outs 估算在不同阶段击中候选改善牌的概率。',
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
    rule24Desc: '快速脑算听牌命中概率的口诀，不是对范围的真实 equity。',
    f2rCalc: '补牌数 × 4 %',
    f2rNote: '适用于翻牌圈，估算到河牌时的总成牌概率。',
    t2rCalc: '补牌数 × 2 %',
    t2rNote: '适用于转牌圈，估算发最后一张河牌时的成牌概率。',
    cleanOutsTitle: '⚠️ 干净补牌说明:',
    cleanOutsText: '并非所有补牌都是干净的。如果某张补牌在让你改善的同时，也可能完成对手更强的手牌（如更高顺子或同花），它就是“脏补牌”；估算命中概率时应把这项风险单独标出。',
    'handbook.draws.linkageProfitable': '听牌命中概率是改善估计，不是行动裁判。',
    'handbook.draws.linkageUnprofitable': '比较价格门槛前，仍需要对手范围下的真实 equity。',
    'handbook.draws.linkageNeedsInput': '价格与听牌命中概率保持为两个独立的概念工具。',
    'handbook.draws.flopOnlyHint': '(翻牌圈再用)',
    'handbook.draws.turnOnlyHint': '(转牌圈再用)',
    'handbook.draws.strongMadeTitle': '当前是强成牌，无需追牌',
    'handbook.draws.strongMadePoint1': '在关注改善机会前，先问当前成牌已经拥有多少摊牌价值。',
    'handbook.draws.strongMadePoint2': '观察哪些转牌或河牌会削弱现有价值，或完成明显听牌。',
    'handbook.draws.strongMadePoint3': '选择下注线路前，仍需要位置、前面行动与 Villain 范围。',
    'handbook.preflop.positionTitle': '位置为什么重要？',
    'handbook.preflop.positionBody': '在单挑中，小盲/庄家翻前先行动，但翻后有位置优势。\n有位置的一方可以最后看到对手行动，再决定下注、跟注或控制底池。\n所以 Button/SB 可以玩更宽的范围；BB 虽然已经投入盲注，但翻后通常处于不利位置。',
    'handbook.math.betSizeTitle': '下注尺度如何改变决策？',
    'handbook.math.betSizeBody': '价格越高，继续所需的真实 equity 越高。\n听牌命中概率本身无法说明是否达到门槛，因为当前成牌价值与 Villain 范围仍然未知。\n这里的字段只用于观察价格门槛如何变化。',
    'handbook.math.impliedOddsTitle': '什么是隐含赔率？',
    'handbook.math.impliedOddsBody': '有时候直接底池赔率不够，但如果你成牌后有机会从对手那里赢到更多筹码，跟注仍可能有理由。\n这叫隐含赔率。\n不要滥用隐含赔率：如果对手不会继续支付，或你的补牌不是干净补牌，隐含赔率会被高估。',
    'handbook.draws.outsWinsTitle': '补牌 ≠ 一定赢牌',
    'handbook.draws.outsWinsBody': '补牌只是让你的牌变强的牌，不代表一定获胜。\n如果某张补牌同时可能完成对手更强的牌，它就是“脏补牌”。\n例如低同花可能输给更高同花；成对牌面上，完成同花也可能输给葫芦。',
    'handbook.draws.madeHandVsDrawTitle': '成牌 vs 听牌',
    'handbook.draws.madeHandVsDrawBody': '成牌：现在已经有摊牌价值，例如一对、两对、三条。\n听牌：现在可能还落后，但有机会在转牌或河牌变强。\n成牌更关注保护和价值下注；听牌更关注补牌、底池赔率 and 隐含赔率。',
    'handbook.draws.linkageNeedsInput': '价格与听牌命中概率保持为两个独立的概念工具。',
    'handbook.draws.flopOnlyHint': '(翻牌圈再用)',
    'handbook.draws.turnOnlyHint': '(转牌圈再用)',
    'handbook.heroHandHelperNote': '* 点击图表可载入默认花色，点槽位可微调',
    boardTitle: '翻后牌面结构分析',
    boardComingSoon: '即将推出',
    boardDesc: '识别可见牌面结构，并据此提出更好的范围与风险问题，而不是直接指定行动。',
    postflopLockedTitle: '研究一手具体翻后局面',
    postflopLockedDesc: '想研究具体翻后局面时，再添加 Hero Hand 和 Flop。',
    heroHandLabel: '你的手牌',
    boardFlopLabel: '公共牌 (翻牌)',
    syncLive: '同步实时牌局快照',
    syncLiveTooltip: '复制当前牌面与已投入筹码上下文，不改变手动价格实验',
    potSizeInputLabel: '下注前底池',
    callAmountInputLabel: '你的跟注',
    highestDrawLabel: '检测到的最强听牌',
    drawEquityLabel: '听牌命中概率 (到河牌)',
    noMajorDraw: '无主要听牌',
    coachAdviceTitle: '概念边界',
    callingReasonable: 'Explorer 不输出 Call/Fold 判断。',
    callingUnprofitable: 'Explorer 不输出 Call/Fold 判断。',
    addPotAndCall: '填写三个手动价格字段后即可观察门槛。',
    activeDrawsTitle: '当前手牌听牌分析',
    activeDrawsDesc: '基于所选牌面观察可能听牌、raw outs 与听牌命中概率；这不是对范围的真实 equity。',
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
    boardTacticalDesc: '关于牌面、范围与风险的问题，不是指定行动。',
    flushDrawsLabel: '同花潜力',
    straightDrawsLabel: '顺子潜力',
    coachBoardInsight: '观察提示',
    yesFlushDraw: '存在同花听牌可能 (2张及以上同色)',
    noFlushDraw: '无同花听牌 (彩虹牌面)',
    yesStraightDraw: '存在顺子听牌可能 (连牌)',
    noStraightDraw: '无顺子听牌 (散牌)',
    texture_wet: '湿润牌面',
    texture_semiWet: '半湿润牌面',
    texture_dry: '干燥牌面',
    badgeOuts: '张补牌',
    badgeRequired: '价格门槛',
    needsPotBadge: '添加价格',
    pickerTitle: '选择扑克牌',
    pickerHeroSub: '选择你的手牌',
    pickerBoardSub: '选择翻牌公共牌',
    closePickerLabel: '关闭选牌器',
    clearCard: '清除该槽',
    cancel: '取消'
  }
}

const currentLang = computed(() => isZh.value ? 'zh' : 'en')

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
  },
  entrySection: {
    type: String,
    default: 'start'
  }
})

const emit = defineEmits(['update:modelValue', 'select-training'])
const route = useRoute()

const modalContentRef = ref(null)
const closeButtonRef = ref(null)
const primarySection = ref('start')
const activeTab = ref('spot')
const primaryTabRefs = new Map()
const explorerTabRefs = new Map()
let lastFocusedElement = null
const ENTRY_SECTIONS = Object.freeze(['start', 'reference', 'explorer'])

const getEntrySection = () => (
  ENTRY_SECTIONS.includes(props.entrySection) ? props.entrySection : 'start'
)

const primarySections = computed(() => [
  { id: 'start', kicker: t('navStartKicker'), label: t('navStart') },
  { id: 'concepts', kicker: t('navConceptsKicker'), label: t('navConcepts') },
  { id: 'reference', kicker: t('navReferenceKicker'), label: t('navReference') },
  { id: 'explorer', kicker: t('navExplorerKicker'), label: t('navExplorer') }
])

const explorerTabs = computed(() => [
  { id: 'spot', label: t('tabSpot') },
  { id: 'price', label: t('tabPrice') },
  { id: 'draws', label: t('tabDraws') },
  { id: 'board', label: t('tabBoard') }
])

const guideSteps = computed(() => [
  { id: 'hand', title: t('stepHandTitle'), question: t('stepHandQuestion') },
  { id: 'context', title: t('stepContextTitle'), question: t('stepContextQuestion') },
  { id: 'range', title: t('stepRangeTitle'), question: t('stepRangeQuestion') },
  { id: 'price', title: t('stepPriceTitle'), question: t('stepPriceQuestion') },
  { id: 'risk', title: t('stepRiskTitle'), question: t('stepRiskQuestion') }
])

const conceptCards = computed(() => [
  {
    id: 'hand',
    title: t('conceptHandTitle'),
    question: t('conceptHandQuestion'),
    principle: t('conceptHandPrinciple'),
    reminder: t('conceptHandReminder'),
    cta: 'explorer',
    ctaLabel: t('conceptHandCta')
  },
  {
    id: 'context',
    title: t('conceptContextTitle'),
    question: t('conceptContextQuestion'),
    principle: t('conceptContextPrinciple'),
    reminder: t('conceptContextReminder'),
    cta: 'explorer',
    ctaLabel: t('conceptContextCta')
  },
  {
    id: 'range',
    title: t('conceptRangeTitle'),
    question: t('conceptRangeQuestion'),
    principle: t('conceptRangePrinciple'),
    reminder: t('conceptRangeReminder'),
    cta: 'reference',
    ctaLabel: t('conceptRangeCta')
  },
  {
    id: 'price',
    title: t('conceptPriceTitle'),
    question: t('conceptPriceQuestion'),
    principle: t('conceptPricePrinciple'),
    reminder: t('conceptPriceReminder'),
    cta: 'pot-odds',
    ctaLabel: t('conceptPriceCta')
  },
  {
    id: 'risk',
    title: t('conceptRiskTitle'),
    question: t('conceptRiskQuestion'),
    principle: t('conceptRiskPrinciple'),
    reminder: t('conceptRiskReminder'),
    cta: 'explorer',
    ctaLabel: t('conceptRiskCta')
  }
])

const setPrimaryTabRef = (element, id) => {
  if (element) primaryTabRefs.set(id, element)
  else primaryTabRefs.delete(id)
}

const selectPrimarySection = (section) => {
  if (!['start', 'concepts', 'reference', 'explorer'].includes(section)) return
  primarySection.value = section
}

const handlePrimaryTabKeydown = (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  const sections = primarySections.value
  const activeIndex = sections.findIndex((section) => section.id === primarySection.value)
  let nextIndex = activeIndex
  if (event.key === 'ArrowLeft') nextIndex = (activeIndex - 1 + sections.length) % sections.length
  if (event.key === 'ArrowRight') nextIndex = (activeIndex + 1) % sections.length
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = sections.length - 1
  event.preventDefault()
  const nextSection = sections[nextIndex].id
  selectPrimarySection(nextSection)
  nextTick(() => primaryTabRefs.get(nextSection)?.focus())
}

const handleConceptCta = (cta) => {
  if (cta === 'preflop' || cta === 'pot-odds') {
    handleTrainingCta(cta)
    return
  }
  if (cta === 'explorer') activeTab.value = 'spot'
  selectPrimarySection(cta)
}

const setExplorerTabRef = (element, id) => {
  if (element) explorerTabRefs.set(id, element)
  else explorerTabRefs.delete(id)
}

const selectExplorerTab = (tab) => {
  if (!explorerTabs.value.some((item) => item.id === tab)) return
  activeTab.value = tab
}

const handleExplorerTabKeydown = (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  const tabs = explorerTabs.value
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab.value)
  let nextIndex = activeIndex
  if (event.key === 'ArrowLeft') nextIndex = (activeIndex - 1 + tabs.length) % tabs.length
  if (event.key === 'ArrowRight') nextIndex = (activeIndex + 1) % tabs.length
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = tabs.length - 1
  event.preventDefault()
  const nextTab = tabs[nextIndex].id
  selectExplorerTab(nextTab)
  nextTick(() => explorerTabRefs.get(nextTab)?.focus())
}

const handleTrainingCta = (training) => {
  if (training !== 'preflop' && training !== 'pot-odds') return
  if (route.name === 'Room') {
    const trainingUrl = new URL('/', window.location.origin)
    trainingUrl.searchParams.set('training', training)
    window.open(trainingUrl.toString(), '_blank', 'noopener,noreferrer')
    return
  }
  emit('select-training', training)
  closeModal()
}

const closeModal = () => {
  emit('update:modelValue', false)
}

const currentSpot = ref('sb_open')
const hoveredCombo = ref(null)

// Reference and Drill share the same canonical 13×13 order.
const combos = HU_169_HAND_MATRIX_ORDER

const focusedCombo = ref(combos[0])
const matrixCellRefs = new Map()

const setMatrixCellRef = (element, combo) => {
  if (element) matrixCellRefs.set(combo, element)
  else matrixCellRefs.delete(combo)
}

const handleComboFocus = (combo) => {
  focusedCombo.value = combo
  hoveredCombo.value = combo
}

const handleComboKeydown = (event, combo) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onComboClick(combo)
    return
  }

  const currentIndex = combos.indexOf(combo)
  let nextIndex = currentIndex
  if (event.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1)
  if (event.key === 'ArrowRight') nextIndex = Math.min(combos.length - 1, currentIndex + 1)
  if (event.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 13)
  if (event.key === 'ArrowDown') nextIndex = Math.min(combos.length - 1, currentIndex + 13)
  if (event.key === 'Home') nextIndex = Math.floor(currentIndex / 13) * 13
  if (event.key === 'End') nextIndex = Math.min(combos.length - 1, Math.floor(currentIndex / 13) * 13 + 12)
  if (nextIndex === currentIndex) return
  event.preventDefault()
  const nextCombo = combos[nextIndex]
  focusedCombo.value = nextCombo
  hoveredCombo.value = nextCombo
  nextTick(() => matrixCellRefs.get(nextCombo)?.focus())
}

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

// Legacy comparison source only. Reference truth comes from the static snapshot;
// scripts/check-preflop-range.mjs extracts this function to verify migration parity.
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
    const entry = HU_BTN_RFI_100BB_V1_BY_HAND[combo]
    if (!entry) return [0, 0, 100]
    return [entry.raiseFrequency, entry.limpFrequency, entry.foldFrequency]
  }
  return generateBbDefWeights(combo)
}

const selectedSnapshotEntry = computed(() => {
  if (currentSpot.value !== 'sb_open' || !hoveredCombo.value) return null
  return HU_BTN_RFI_100BB_V1_BY_HAND[hoveredCombo.value] || null
})

const baselineScenarioLabel = computed(() => {
  const assumptions = HU_BTN_RFI_ASSUMPTIONS
  const format = assumptions.format === 'heads_up' ? t('assumptionHeadsUp') : assumptions.format
  const position = assumptions.position === 'sb_button' ? t('assumptionSbButton') : assumptions.position
  const potState = assumptions.potState === 'unopened' ? t('assumptionUnopenedPot') : assumptions.potState
  return `${format} · ${position} · ${assumptions.effectiveStackBb} BB · ${potState}`
})

const baselineSourceLabel = computed(() => (
  HU_BTN_RFI_ASSUMPTIONS.sourceKind === 'legacy_heuristic_snapshot'
    ? t('referenceLegacySnapshotSource')
    : HU_BTN_RFI_ASSUMPTIONS.sourceKind
))

const baselineBoundaryNote = computed(() => (
  currentLang.value === 'en'
    ? HU_BTN_RFI_ASSUMPTIONS.note
    : t('referenceBaselineBoundary')
))

const getReferenceActionLabel = (action) => {
  if (action === 'raise') return t('legendRaise')
  if (action === 'limp') return t('legendLimp')
  if (action === 'call') return t('legendCall')
  if (action === 'fold') return t('legendFold')
  return action
}

const getSecondaryActionLabel = () => (
  currentSpot.value === 'sb_open' ? t('legendLimp') : t('legendCall')
)

const getCurrentSpotLabel = () => {
  return currentSpot.value === 'sb_open'
    ? `${t('sbButton')} · ${t('openRaiseRfi')}`
    : `${t('bbBigBlind')} · ${t('defendVsSbOpen')}`
}

const getPrimaryActionLabel = (combo) => {
  if (currentSpot.value === 'sb_open') {
    const entry = HU_BTN_RFI_100BB_V1_BY_HAND[combo]
    if (!entry) return t('referenceDataUnavailable')
    const orderedPrimaryActions = [
      entry.primaryAction,
      ...entry.primaryActions.filter((action) => action !== entry.primaryAction)
    ]
    return orderedPrimaryActions
      .map((action) => `${getReferenceActionLabel(action)} ${entry[`${action}Frequency`]}%`)
      .join(' / ')
  }

  const weights = getComboWeights(combo)
  const labels = [t('legendRaise'), t('legendCall'), t('legendFold')]
  const highestWeight = Math.max(...weights)
  return weights
    .map((weight, index) => weight === highestWeight ? `${labels[index]} ${weight}%` : null)
    .filter(Boolean)
    .join(' / ')
}

const getComboAriaLabel = (combo) => {
  const [raise, call, fold] = getComboWeights(combo)
  return `${combo}, ${t(getComboFullTypeNameKey(combo))}. ${t('legendRaise')} ${raise}%, ${getSecondaryActionLabel()} ${call}%, ${t('legendFold')} ${fold}%`
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
  const lang = currentLang.value

  if (currentSpot.value === 'sb_open') {
    const entry = HU_BTN_RFI_100BB_V1_BY_HAND[combo]
    const explanation = entry ? PREFLOP_EXPLANATIONS[entry.explanationKey] : null
    return explanation?.[lang] || t('referenceExplanationFallback')
  }

  // BB defend keeps its existing local heuristic and detail guidance.
  const weights = getComboWeights(combo)
  const meta = getComboMetadata(combo)
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

const formatActionStats = (values) => {
  const scaled = values.map((value) => value * 10)
  const displayUnits = scaled.map(Math.floor)
  const remainderOrder = scaled
    .map((value, index) => ({ index, fraction: value - displayUnits[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
  const remainingUnits = Math.round(1000 - displayUnits.reduce((sum, value) => sum + value, 0))

  for (let index = 0; index < remainingUnits; index += 1) {
    displayUnits[remainderOrder[index % remainderOrder.length].index] += 1
  }

  return displayUnits.map((value) => (value / 10).toFixed(1))
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
  const totalHands = combos.length
  const [raise, secondary, fold] = formatActionStats([
    raiseCount / totalHands,
    callCount / totalHands,
    foldCount / totalHands
  ])
  return {
    raise,
    secondary,
    fold
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

const loadComboIntoExplorer = (combo) => {
  const [c1, c2] = comboToDefaultCards(combo)
  coachState.value.heroCards = [c1, c2]
  if (currentLang.value === 'zh') {
    loadNoticeText.value = `已从图表载入: ${combo}`
  } else {
    loadNoticeText.value = `Loaded from chart: ${combo}`
  }
  activeTab.value = 'spot'
  primarySection.value = 'explorer'
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
  focusedCombo.value = combo
}

const getCardSlotLabel = (slotType, index, card) => {
  const slotLabel = slotType === 'hero' ? t('cardSlotHero') : t('cardSlotBoard')
  return card ? `${slotLabel} ${index + 1}: ${card}` : `${slotLabel} ${index + 1}`
}

const coachState = ref({
  language: currentLang.value,
  heroCards: [null, null],
  boardCards: [null, null, null]
})

const manualPrice = ref({
  potBeforeBet: null,
  villainBet: null,
  yourCall: null
})

const liveSnapshot = ref({
  currentPot: null,
  toCall: null,
  stage: null
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

const finiteNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const deriveLiveToCall = (publicState, heroPlayer) => {
  const tableCurrentBet = finiteNumberOrNull(publicState?.current_bet)
  const heroBetInRound = finiteNumberOrNull(heroPlayer?.bet_in_round)
  if (tableCurrentBet === null || heroBetInRound === null) return null
  return Math.max(0, tableCurrentBet - heroBetInRound)
}

const syncFromLiveGame = () => {
  const publicState = onlineStore.publicState
  const hero = onlineStore.heroPlayer

  liveSnapshot.value = {
    currentPot: finiteNumberOrNull(publicState?.pot),
    toCall: deriveLiveToCall(publicState, hero),
    stage: typeof publicState?.stage === 'string' ? publicState.stage : null
  }

  const liveHole = onlineStore.privateState?.hole_cards || []
  const liveCommunity = publicState?.community_cards || []

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
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    primarySection.value = getEntrySection()
    activeTab.value = 'spot'
    hoveredCombo.value = null
    focusedCombo.value = combos[0]
    showCardPicker.value = false
    syncFromLiveGame()
    nextTick(() => {
      const entryTab = primaryTabRefs.get(primarySection.value)
      if (entryTab) entryTab.focus()
      else modalContentRef.value?.focus()
    })
    return
  }

  showCardPicker.value = false
  nextTick(() => {
    if (lastFocusedElement?.isConnected) lastFocusedElement.focus()
    lastFocusedElement = null
  })
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

const hasLiveGameState = computed(() => Boolean(onlineStore.publicState))

const hasLiveSnapshot = computed(() => {
  return liveSnapshot.value.currentPot !== null
    || liveSnapshot.value.toCall !== null
    || Boolean(liveSnapshot.value.stage)
})

const liveStageLabel = computed(() => {
  const stageKeys = {
    preflop: 'stagePreflop',
    flop: 'stageFlop',
    turn: 'stageTurn',
    river: 'stageRiver',
    showdown: 'stageShowdown'
  }
  const key = stageKeys[liveSnapshot.value.stage]
  return key ? t(key) : (liveSnapshot.value.stage || '—')
})

const formatSnapshotValue = (value) => {
  return value === null ? '—' : Number(value).toLocaleString(currentLang.value === 'zh' ? 'zh-CN' : 'en-US')
}

const formatPriceValue = (value) => {
  if (!Number.isFinite(value)) return '—'
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

const manualPriceValues = computed(() => ({
  potBeforeBet: finiteNumberOrNull(manualPrice.value.potBeforeBet),
  villainBet: finiteNumberOrNull(manualPrice.value.villainBet),
  yourCall: finiteNumberOrNull(manualPrice.value.yourCall)
}))

const hasValidManualPrice = computed(() => {
  const { potBeforeBet, villainBet, yourCall } = manualPriceValues.value
  return potBeforeBet !== null
    && villainBet !== null
    && yourCall !== null
    && potBeforeBet >= 0
    && villainBet > 0
    && yourCall > 0
})

const finalPotIfCall = computed(() => {
  if (!hasValidManualPrice.value) return null
  const { potBeforeBet, villainBet, yourCall } = manualPriceValues.value
  return potBeforeBet + villainBet + yourCall
})

const manualRequiredEquity = computed(() => {
  if (!hasValidManualPrice.value || finalPotIfCall.value <= 0) return null
  return (manualPriceValues.value.yourCall / finalPotIfCall.value) * 100
})

// Postflop Input Readiness Check
const isPostflopReady = computed(() => {
  return coachState.value.boardCards.filter(Boolean).length >= 3
})

const isDrawAnalysisReady = computed(() => {
  return coachState.value.heroCards.filter(Boolean).length >= 2 && isPostflopReady.value
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

const handleModalKeydown = (event) => {
  if (event.key !== 'Tab' || showCardPicker.value || !modalContentRef.value) return
  const focusable = Array.from(modalContentRef.value.querySelectorAll(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
  )).filter((element) => element.getClientRects().length > 0)
  if (!focusable.length) {
    event.preventDefault()
    modalContentRef.value.focus()
    return
  }
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

const handleGlobalKeydown = (event) => {
  if (!props.modelValue || event.key !== 'Escape') return
  event.preventDefault()
  if (showCardPicker.value) {
    closeCardPicker()
    return
  }
  closeModal()
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  if (highlightTimeoutId) clearTimeout(highlightTimeoutId)
})

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
      ? "Wet boards can support many straight and flush combinations. Ask which of those combinations each range can actually contain, which outs may be dirty, and how future cards could change the hand."
      : "湿润牌面可能支持较多顺子与同花组合。继续思考：双方范围实际包含哪些组合、哪些 outs 可能不干净，以及后续牌会如何改变局面。"
  } else if (analysis.texture === 'semiWet') {
    return lang === 'en'
      ? "Semi-wet boards leave some direct and backdoor changes available. Ask which turn cards shift range interaction before drawing a betting conclusion."
      : "半湿润牌面保留了一些直接与后门变化。先观察哪些转牌会改变双方范围互动，再讨论具体下注线路。"
  } else {
    return lang === 'en'
      ? "Dry boards expose fewer immediate draws, but that alone does not identify range advantage or a bet size. Ask who retains strong made hands and how prior action shapes each range."
      : "干燥牌面暴露的直接听牌较少，但这本身不能确定范围优势或下注尺度。仍需结合前面行动，观察谁的范围保留了更多强成牌。"
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

const evaluatedHandLabel = computed(() => {
  const handName = evaluatedHand.value?.handName
  if (!handName || currentLang.value === 'en') return handName || '—'
  const zhHandNames = {
    'High Card': '高牌',
    'One Pair': '一对',
    'Two Pair': '两对',
    'Three of a Kind': '三条',
    'Straight': '顺子',
    'Flush': '同花',
    'Full House': '葫芦',
    'Four of a Kind': '四条',
    'Straight Flush': '同花顺',
    'Royal Flush': '皇家同花顺'
  }
  return zhHandNames[handName] || handName
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
  const hasNoDraws = highestDraw.value === null
  return hasStrongRank && hasNoDraws
})

const currentStreet = computed(() => {
  return liveSnapshot.value.stage || null
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

const priceBadgeText = computed(() => {
  if (!hasValidManualPrice.value) return ''
  return `${manualRequiredEquity.value.toFixed(1)}% ${t('badgePriceThreshold')}`
})

const buildCoachExplanation = (heroCards, boardCards, boardAnalysis, language) => {
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
          "观察对手范围中可能存在的更高口袋对子、四条，以及较弱踢脚组合。",
          "下注尺度与前面行动会怎样改变这些组合的相对可能性？"
        ] : [
          `你拿 ${r1}-${r2} 时，常见摊牌形态是 ${tripsRank}-${tripsRank}-${tripsRank}-${r1}-${r2}。`,
          `哪些更高踢脚、${r1 === 'A' ? '' : 'A 高、'}${r1 === 'Q' || r1 === 'A' ? '' : 'Q 高、'}口袋对子仍可能出现在对手范围中？`,
          "下注尺度与前面行动会怎样改变这些组合的相对可能性？"
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
          "Inspect which higher pocket pairs, quads, and weaker kicker combinations remain in Villain's range.",
          "How do the bet size and prior action change the relative likelihood of those combinations?"
        ] : [
          `With ${r1}-${r2}, your common showdown shape is ${tripsRank}-${tripsRank}-${tripsRank}-${r1}-${r2}.`,
          `Which ${r1 === 'A' ? '' : 'A-high, '}${r1 === 'Q' || r1 === 'A' ? '' : 'Q-high, '}higher-kicker and pocket-pair combinations remain in Villain's range?`,
          "How do the bet size and prior action change the relative likelihood of those combinations?"
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
          "这种结构可以支持多种听牌与成牌组合。"
        ],
        whyItMatters: [
          "牌力价值更动态，部分转牌与河牌可能显著改变相对强度。",
          "双方范围实际包含哪些组合，仍取决于位置与前面行动。"
        ],
        howToThink: [
          "当前成牌有多少摊牌价值，哪些后续牌会削弱它？",
          "哪些补牌可能不干净，听牌命中概率与真实 equity 有何差异？",
          "位置、范围与前面行动还缺少哪些信息？"
        ],
        warnings: [
          "牌面结构本身不能确定下注尺度或行动。"
        ],
        tags
      }
    } else {
      return {
        summaryTitle: "Wet Board · Draw Heavy",
        oneLineSummary: "The board is rich with coordination; straight and flush draws are highly active.",
        whatWeSee: [
          "Multiple cards of the same suit or connected ranks are present.",
          "This structure can support several draw and made-hand combinations."
        ],
        whyItMatters: [
          "Hand values are more dynamic because some turn and river cards can shift relative strength.",
          "Which combinations actually exist still depends on position and prior action."
        ],
        howToThink: [
          "How much showdown value does the current made hand have, and which cards weaken it?",
          "Which outs may be dirty, and how does draw-hit probability differ from true equity?",
          "What position, range, and prior-action information is still missing?"
        ],
        warnings: [
          "Board texture alone cannot determine a bet size or action."
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
          "是否形成范围优势，仍取决于双方如何到达当前局面。"
        ],
        howToThink: [
          "哪些转牌会把后门潜力变成直接听牌？",
          "双方范围中哪些组合能自然到达当前牌面？",
          "在讨论下注尺度前，还缺少哪些位置与行动信息？"
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
          "Any range advantage still depends on how both players arrived at this spot."
        ],
        howToThink: [
          "Which turn cards convert backdoor potential into direct draws?",
          "Which combinations can naturally arrive here in each range?",
          "What position and action information is missing before discussing a bet size?"
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
          "直接听牌较少，但这并不自动确定哪一方拥有范围优势。"
        ],
        howToThink: [
          "双方范围中谁保留了更多强成牌与高牌组合？",
          "哪些转牌仍可能改变相对牌力？",
          "在讨论下注尺度前，位置与前面行动提供了什么信息？"
        ],
        warnings: [
          "干燥牌面标签本身不能给出下注或弃牌结论。"
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
          "Fewer direct draws do not automatically identify which player has range advantage."
        ],
        howToThink: [
          "Which range retains more strong made hands and high-card combinations?",
          "Which turn cards could still change relative hand strength?",
          "What do position and prior action tell you before discussing a bet size?"
        ],
        warnings: [
          "A dry-board label alone cannot prescribe a bet or fold."
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
  box-sizing: border-box;
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

.gto-modal-content > * {
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

/* Close button */
.gto-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all 0.2s ease;
  border-radius: 50%;
  z-index: 2;
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
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.header-identity {
  min-width: 0;
  padding-right: 76px;
}
.header-top-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 0.5rem;
  width: 100%;
}
.header-language-row {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  min-width: 0;
  margin-top: 1rem;
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
.gto-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-bottom: 0.4rem;
  min-width: 0;
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
  margin: 0;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}
.gto-modal-desc {
  font-size: 0.88rem;
  color: var(--text-tertiary);
  line-height: 1.5;
  margin: 0;
  overflow-wrap: anywhere;
}

.guide-primary-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
  padding: 0.35rem;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.guide-primary-tab {
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.65rem 0.75rem;
  background: transparent;
  color: var(--text-tertiary);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font: inherit;
  font-weight: 760;
  cursor: pointer;
  transition: color 0.18s ease, background-color 0.18s ease, border-color 0.18s ease;
}

.guide-primary-tab:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.035);
}

.guide-primary-tab.active {
  color: var(--text-primary);
  background: var(--bg-panel-raised);
  border-color: rgba(217, 173, 88, 0.3);
  box-shadow: var(--shadow-sm);
}

.primary-tab-kicker {
  color: var(--accent-primary);
  font-family: var(--font-family-mono);
  font-size: 0.66rem;
  letter-spacing: 0.08em;
}

.guide-landing,
.concepts-panel,
.explorer-shell {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.guide-landing-hero,
.section-intro {
  width: 100%;
  max-width: 690px;
  min-width: 0;
  box-sizing: border-box;
}

.guide-eyebrow {
  margin: 0 0 0.5rem;
  color: var(--accent-primary);
  font-size: 0.7rem;
  font-weight: 820;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.guide-landing-hero h3,
.section-intro h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(1.45rem, 3.2vw, 2.15rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.guide-landing-hero > p:last-child,
.section-intro > p:last-child {
  margin: 0.7rem 0 0;
  color: var(--text-secondary);
  font-size: 0.92rem;
  line-height: 1.65;
}

.decision-flow {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.14);
}

.decision-flow-step {
  min-width: 0;
  padding: 1rem 0.8rem;
  border-right: 1px solid var(--border-subtle);
}

.decision-flow-step:last-child {
  border-right: none;
}

.flow-number {
  display: inline-flex;
  width: 25px;
  height: 25px;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.65rem;
  border: 1px solid rgba(217, 173, 88, 0.35);
  border-radius: 50%;
  color: var(--accent-primary-strong);
  font: 700 0.7rem/1 var(--font-family-mono);
}

.decision-flow-step strong,
.decision-flow-step span {
  display: block;
}

.decision-flow-step strong {
  min-height: 2.5em;
  color: var(--text-primary);
  font-size: 0.78rem;
  line-height: 1.25;
}

.decision-flow-step div > span {
  margin-top: 0.5rem;
  color: var(--text-tertiary);
  font-size: 0.72rem;
  line-height: 1.45;
}

.guide-landing-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.guide-action,
.concept-cta,
.details-explorer-btn {
  min-height: 44px;
  border: 1px solid rgba(217, 173, 88, 0.28);
  border-radius: var(--radius-md);
  background: rgba(217, 173, 88, 0.07);
  color: var(--text-primary);
  font: inherit;
  font-size: 0.84rem;
  font-weight: 760;
  cursor: pointer;
  transition: background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.guide-action:hover,
.concept-cta:hover,
.details-explorer-btn:hover {
  background: rgba(217, 173, 88, 0.14);
  border-color: var(--accent-primary);
  transform: translateY(-1px);
}

.guide-action.primary {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #18110d;
}

.guide-action.secondary {
  color: var(--text-secondary);
  background: transparent;
  border-color: var(--border-strong);
}

.guide-truth-boundary {
  margin: 0;
  padding: 0.8rem 0.95rem;
  border-left: 3px solid var(--accent-primary);
  background: rgba(217, 173, 88, 0.055);
  color: var(--text-secondary);
  font-size: 0.78rem;
  line-height: 1.55;
}

.concept-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.concept-card {
  display: flex;
  flex-direction: column;
  min-height: 286px;
  padding: 1.15rem;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.concept-card:last-child {
  grid-column: 1 / -1;
  min-height: auto;
}

.concept-card-heading {
  display: flex;
  align-items: baseline;
  gap: 0.65rem;
}

.concept-card-heading h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.concept-index {
  color: var(--accent-primary);
  font-family: var(--font-family-mono);
  font-size: 0.68rem;
}

.concept-question {
  margin: 0.9rem 0 0;
  color: var(--text-primary);
  font-weight: 720;
  line-height: 1.45;
}

.concept-principle,
.concept-reminder {
  margin: 0.65rem 0 0;
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1.55;
}

.concept-reminder {
  padding-left: 0.7rem;
  border-left: 2px solid rgba(217, 173, 88, 0.4);
  color: var(--text-tertiary);
}

.concept-cta {
  align-self: flex-start;
  min-height: 40px;
  margin-top: auto;
  padding: 0.55rem 0.8rem;
}

.explorer-intro {
  padding: 0.95rem 1rem;
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--accent-primary);
  border-radius: var(--radius-md);
  background: rgba(0, 0, 0, 0.14);
}

.explorer-intro h3 {
  font-size: 1.25rem;
}

.explorer-boundary-note {
  margin: 0;
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(217, 173, 88, 0.2);
  border-radius: var(--radius-md);
  background: rgba(217, 173, 88, 0.045);
  color: var(--text-secondary);
  font-size: 0.78rem;
  line-height: 1.55;
}

.explorer-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.explorer-tab {
  min-height: 44px;
  padding: 0.6rem 0.95rem;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  color: var(--text-tertiary);
  font: inherit;
  font-size: 0.83rem;
  font-weight: 760;
  cursor: pointer;
}

.explorer-tab.active {
  color: var(--text-primary);
  border-color: rgba(217, 173, 88, 0.4);
  background: rgba(217, 173, 88, 0.1);
}

.explorer-tab:focus-visible,
.sync-live-btn:focus-visible,
.premium-math-input:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

.spot-setup-layout,
.price-lab-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(230px, 0.8fr);
  gap: 1rem;
  margin-top: 1rem;
}

.spot-card-panel,
.live-snapshot-card {
  padding: 1.15rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: rgba(0, 0, 0, 0.18);
}

.spot-panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.spot-panel-heading h3,
.snapshot-heading h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.spot-panel-heading p {
  margin: 0.35rem 0 0;
  color: var(--text-secondary);
  font-size: 0.78rem;
  line-height: 1.5;
}

.spot-input-bar {
  align-items: flex-start;
  margin: 0;
  padding: 1rem;
}

.spot-input-bar .input-group {
  align-items: flex-start;
  flex-direction: column;
}

.spot-made-hand-readout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1rem;
  padding: 0.75rem 0.85rem;
  border-left: 3px solid var(--accent-primary);
  background: rgba(217, 173, 88, 0.055);
  color: var(--text-secondary);
  font-size: 0.78rem;
}

.spot-made-hand-readout strong {
  color: var(--text-primary);
}

.explorer-question-state {
  margin-top: 1rem;
  padding: 0.85rem 0.95rem;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.018);
}

.explorer-question-state p,
.explorer-question-state ul {
  margin: 0;
}

.explorer-question-state p {
  color: var(--text-secondary);
  font-size: 0.78rem;
  line-height: 1.5;
}

.explorer-question-state ul,
.empty-guidance-list {
  padding-left: 1.1rem;
  color: var(--text-tertiary);
  font-size: 0.76rem;
  line-height: 1.55;
}

.explorer-question-state ul {
  margin-top: 0.55rem;
}

.live-snapshot-card {
  align-self: start;
}

.snapshot-kicker {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--accent-primary);
  font-size: 0.66rem;
  font-weight: 820;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.snapshot-values {
  display: grid;
  gap: 0.55rem;
  margin: 1rem 0;
}

.snapshot-values div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-subtle);
}

.snapshot-values dt,
.snapshot-values dd {
  margin: 0;
}

.snapshot-values dt {
  color: var(--text-tertiary);
  font-size: 0.72rem;
}

.snapshot-values dd {
  color: var(--text-primary);
  font: 760 0.78rem/1.2 var(--font-family-mono);
}

.snapshot-empty,
.snapshot-boundary {
  color: var(--text-tertiary);
  font-size: 0.73rem;
  line-height: 1.55;
}

.snapshot-empty {
  margin: 1rem 0;
}

.snapshot-boundary {
  margin: 0;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border-subtle);
}

.price-lab-card {
  min-width: 0;
}

.price-input-row {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.input-helper {
  color: var(--text-tertiary);
  font-size: 0.68rem;
  line-height: 1.4;
}

.price-formula-note {
  margin: 0;
  color: var(--text-tertiary);
  font-size: 0.72rem;
  line-height: 1.5;
  text-align: center;
}

.price-results {
  display: grid;
  gap: 0.6rem;
  padding: 0.9rem;
  border: 1px solid rgba(217, 173, 88, 0.25);
  border-radius: var(--radius-md);
  background: rgba(217, 173, 88, 0.055);
}

.price-empty-state {
  padding: 0.85rem;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  font-size: 0.75rem;
  line-height: 1.5;
  text-align: center;
}

.price-truth-boundary {
  padding: 0.85rem 0.95rem;
  border-left: 3px solid var(--accent-primary);
  background: rgba(217, 173, 88, 0.045);
}

.price-truth-boundary strong {
  color: var(--text-primary);
  font-size: 0.78rem;
}

.price-truth-boundary p {
  margin: 0.35rem 0 0;
  color: var(--text-secondary);
  font-size: 0.74rem;
  line-height: 1.55;
}

.price-side-stack {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.neutral-boundary {
  border-left: 4px solid var(--accent-primary);
  background: rgba(217, 173, 88, 0.055);
  color: var(--text-secondary);
}

.invitation-kicker {
  color: var(--accent-primary);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.invitation-note {
  margin: 0;
  color: var(--text-tertiary);
  font-size: 0.72rem;
  line-height: 1.5;
}

.details-explorer-btn {
  min-height: 40px;
  margin-top: 0.85rem;
  padding: 0.5rem 0.75rem;
}

.details-reference-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 1rem;
  margin-top: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.76rem;
  line-height: 1.45;
}

.details-reference-meta strong {
  color: var(--text-primary);
}

.gto-modal-content :is(button, input, [tabindex]):focus-visible {
  outline: 3px solid rgba(255, 218, 130, 0.9);
  outline-offset: 2px;
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

.reference-source-card {
  width: 100%;
  min-width: 0;
  margin-bottom: 0.8rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: rgba(0, 0, 0, 0.16);
  box-sizing: border-box;
}

.baseline-source-card {
  border-color: rgba(217, 173, 88, 0.26);
  background: rgba(217, 173, 88, 0.055);
}

.reference-source-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.reference-source-kicker {
  display: block;
  color: var(--accent-primary);
  font-size: 0.68rem;
  font-weight: 820;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.reference-source-ids {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.45rem 0.75rem;
  margin-top: 0.35rem;
}

.reference-source-ids strong {
  color: var(--text-primary);
  font-family: var(--font-family-mono);
  font-size: 0.92rem;
  overflow-wrap: anywhere;
}

.reference-source-ids span,
.reference-boundary-badge {
  padding: 0.25rem 0.55rem;
  border: 1px solid rgba(217, 173, 88, 0.28);
  border-radius: var(--radius-pill);
  color: var(--accent-primary-strong);
  font-size: 0.68rem;
  font-weight: 780;
}

.reference-boundary-badge {
  flex: 0 0 auto;
}

.reference-scenario {
  margin: 0.85rem 0 0;
  color: var(--text-primary);
  font-weight: 760;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.reference-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  margin-top: 0.55rem;
  color: var(--text-secondary);
  font-size: 0.76rem;
  line-height: 1.5;
}

.reference-boundary-copy {
  margin: 0.65rem 0 0;
  color: var(--text-tertiary);
  font-size: 0.76rem;
  line-height: 1.55;
}

.reference-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-bottom: 1.4rem;
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
  appearance: none;
  padding: 0;
  border: none;
  color: inherit;
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
  .guide-primary-tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .decision-flow {
    grid-template-columns: 1fr;
  }
  .decision-flow-step {
    display: grid;
    grid-template-columns: 34px 1fr;
    gap: 0.6rem;
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
  }
  .decision-flow-step:last-child {
    border-bottom: none;
  }
  .flow-number {
    margin-bottom: 0;
  }
  .decision-flow-step strong {
    min-height: auto;
  }
  .decision-flow-step div > span {
    margin-top: 0.3rem;
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
  .spot-setup-layout,
  .price-lab-layout {
    grid-template-columns: 1fr;
  }
  .price-input-row {
    grid-template-columns: 1fr;
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
  .gto-close-btn {
    top: 12px;
    right: 12px;
  }
  .header-identity {
    padding-right: 60px;
  }
  .header-language-row {
    justify-content: flex-start;
    margin-top: 0.85rem;
  }
  .gto-modal-title {
    font-size: 1.35rem;
  }
  .gto-title-row {
    align-items: flex-start;
    flex-direction: column;
  }
  .guide-primary-tabs,
  .guide-landing-actions,
  .concept-card-grid,
  .reference-actions {
    grid-template-columns: 1fr;
  }
  .reference-source-header {
    flex-direction: column;
  }
  .concept-card:last-child {
    grid-column: auto;
  }
  .guide-primary-tab {
    justify-content: flex-start;
    min-height: 48px;
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
  .spot-panel-heading {
    flex-direction: column;
  }
  .sync-live-btn {
    min-height: 44px;
    margin-left: 0;
  }
  .postflop-input-bar {
    padding: 0.85rem;
    gap: 1rem;
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
  padding: 0;
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

@media (max-width: 768px) {
  .spot-setup-layout,
  .price-lab-layout {
    grid-template-columns: 1fr;
  }

  .price-input-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .spot-panel-heading {
    flex-direction: column;
  }

  .sync-live-btn {
    min-height: 44px;
    margin-left: 0;
  }

  .spot-input-bar {
    padding: 0.85rem;
    gap: 1rem;
  }

  .spot-input-bar .input-group {
    width: 100%;
  }

  .card-slots-and-notice {
    flex-wrap: wrap;
  }
}
</style>
