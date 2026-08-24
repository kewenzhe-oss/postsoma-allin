<template>
  <article class="odds-drill" aria-labelledby="pot-odds-title">
    <header class="drill-header">
      <div>
        <span class="section-kicker">{{ copy.kicker }}</span>
        <h2 id="pot-odds-title">{{ copy.title }}</h2>
        <p>{{ copy.description }}</p>
      </div>
      <div class="version-stack">
        <span class="version-badge">pot-odds-v1</span>
        <small v-if="phase !== 'intro'">{{ copy.sessionSeed }} {{ session.seed }}</small>
      </div>
    </header>

    <template v-if="phase !== 'complete'">
      <div class="session-progress">
        <div>
          <strong>{{ phase === 'intro' ? copy.fixedExercises(session.questions.length) : copy.questionProgress(currentIndex + 1, session.questions.length) }}</strong>
          <span>{{ sessionModeLabel }}</span>
        </div>
        <div class="progress-track" aria-hidden="true">
          <span :style="{ width: `${progressPercent}%` }"></span>
        </div>
      </div>

      <section class="decision-surface" :aria-label="copy.questionAria">
        <div class="question-facts">
          <div>
            <span>{{ copy.potBeforeBet }}</span>
            <strong>{{ formatBB(currentQuestion.potBeforeBetBB) }}</strong>
          </div>
          <div>
            <span>{{ copy.villainBet }}</span>
            <strong>{{ formatBB(currentQuestion.villainBetBB) }}</strong>
          </div>
          <div>
            <span>{{ copy.yourCall }}</span>
            <strong>{{ formatBB(currentQuestion.callAmountBB) }}</strong>
          </div>
        </div>

        <ol class="step-indicator" :aria-label="copy.builderProgressAria">
          <li :class="stepIndicatorClass('build-pot')">
            <span>1</span><strong>{{ copy.stepBuild }}</strong>
          </li>
          <li :class="stepIndicatorClass('price-call')">
            <span>2</span><strong>{{ copy.stepPrice }}</strong>
          </li>
          <li :class="stepIndicatorClass('compare-assumption')">
            <span>3</span><strong>{{ copy.stepCompare }}</strong>
          </li>
        </ol>

        <section v-if="trainingStep === 'build-pot'" class="builder-step" aria-labelledby="build-pot-step-title">
          <div class="step-heading">
            <span class="prompt-label">{{ copy.stepOf(1) }}</span>
            <h3 id="build-pot-step-title" ref="stepHeading" tabindex="-1">{{ copy.buildQuestion }}</h3>
            <p>{{ copy.buildHint }}</p>
          </div>

          <div class="number-options" role="group" :aria-label="copy.finalPotAria">
            <button
              v-for="option in buildPotOptions"
              :key="option.id"
              type="button"
              :class="{ selected: buildPotAnswer?.id === option.id, correct: buildPotAnswer && option.isCorrect }"
              :disabled="phase !== 'active' || Boolean(buildPotAnswer)"
              :aria-pressed="buildPotAnswer?.id === option.id"
              @click="answerBuildPot(option)"
            >
              {{ formatBB(option.value) }}
            </button>
          </div>

          <p v-if="phase === 'intro'" class="answer-state">
            {{ copy.startUnlock }}
          </p>
          <p v-else-if="!buildPotAnswer" class="answer-state ready">
            {{ copy.addAmounts }}
          </p>

          <section
            v-if="buildPotAnswer"
            ref="stepFeedbackHeading"
            class="step-feedback"
            tabindex="-1"
            aria-live="polite"
          >
            <span class="feedback-label">{{ copy.stepFeedback(1) }}</span>
            <h4>{{ buildPotAnswer.isCorrect ? copy.finalPotCorrect : copy.reviewPotParts }}</h4>
            <p>{{ buildPotDiagnostic }}</p>
            <code>{{ formatBB(currentQuestion.potBeforeBetBB) }} + {{ formatBB(currentQuestion.villainBetBB) }} + {{ formatBB(currentQuestion.callAmountBB) }} = {{ formatBB(correctFinalPot) }}</code>
            <button type="button" class="primary-button compact" @click="continueToPriceCall">
              {{ copy.continuePrice }}
            </button>
          </section>
        </section>

        <section v-else-if="trainingStep === 'price-call'" class="builder-step" aria-labelledby="price-call-step-title">
          <div class="step-heading">
            <span class="prompt-label">{{ copy.stepOf(2) }}</span>
            <h3 id="price-call-step-title" ref="stepHeading" tabindex="-1">{{ copy.priceQuestion }}</h3>
            <p>{{ copy.priceHint }}</p>
          </div>

          <div class="formula-hint">
            <span>{{ copy.formula }}</span>
          </div>

          <div class="number-options" role="group" :aria-label="copy.requiredEquityAria">
            <button
              v-for="option in priceCallOptions"
              :key="option.id"
              type="button"
              :class="{ selected: priceCallAnswer?.id === option.id, correct: priceCallAnswer && option.isCorrect }"
              :disabled="Boolean(priceCallAnswer)"
              :aria-pressed="priceCallAnswer?.id === option.id"
              @click="answerPriceCall(option)"
            >
              {{ formatPct(option.value) }}
            </button>
          </div>
          <p v-if="!priceCallAnswer" class="answer-state ready">{{ copy.assumptionHidden }}</p>

          <section
            v-if="priceCallAnswer"
            ref="stepFeedbackHeading"
            class="step-feedback"
            tabindex="-1"
            aria-live="polite"
          >
            <span class="feedback-label">{{ copy.stepFeedback(2) }}</span>
            <h4>{{ priceCallAnswer.isCorrect ? copy.thresholdCorrect : copy.reviewDenominator }}</h4>
            <p>{{ priceCallDiagnostic }}</p>
            <code>{{ formatBB(currentQuestion.callAmountBB) }} ÷ {{ formatBB(correctFinalPot) }} = {{ formatPct(correctRequiredEquity) }}</code>
            <small>{{ copy.thresholdBoundary }}</small>
            <button type="button" class="primary-button compact" @click="continueToCompareAssumption">
              {{ copy.continueCompare }}
            </button>
          </section>
        </section>

        <section v-else-if="trainingStep === 'compare-assumption'" class="builder-step" aria-labelledby="compare-step-title">
          <div class="step-heading">
            <span class="prompt-label">{{ copy.stepOf(3) }}</span>
            <h3 id="compare-step-title" ref="stepHeading" tabindex="-1">{{ copy.compareQuestion }}</h3>
            <p>{{ copy.compareHint }}</p>
          </div>

          <aside class="assumption-reveal">
            <span>{{ copy.exerciseAssumption }}</span>
            <strong>Hero equity = {{ formatPct(currentQuestion.heroEquityPct) }}</strong>
            <p>{{ copy.assumptionBoundary }}</p>
          </aside>

          <div class="comparison-options" role="group" :aria-label="copy.compareAria">
            <button
              v-for="option in assumptionOptions"
              :key="option.id"
              type="button"
              :disabled="Boolean(assumptionAnswer)"
              :aria-pressed="assumptionAnswer === option.id"
              :class="{ selected: assumptionAnswer === option.id }"
              @click="answerAssumption(option.id)"
            >
              <span>{{ localizedOptionLabel(option) }}</span>
            </button>
          </div>
          <p class="answer-state ready">{{ copy.compareFirst }}</p>
        </section>
      </section>

      <div v-if="phase === 'intro'" class="start-row">
        <button type="button" class="primary-button" @click="beginPreparedSession">
          {{ copy.start }}
        </button>
        <p>{{ copy.startBoundary }}</p>
      </div>

      <section
        v-if="trainingStep === 'feedback' && evaluation"
        ref="stepFeedbackHeading"
        class="feedback-panel"
        :class="{ aligned: assumptionWasCorrect, review: !assumptionWasCorrect }"
        tabindex="-1"
        aria-live="polite"
      >
        <div class="feedback-heading">
          <div>
            <span class="feedback-label">{{ copy.reviewKicker }}</span>
            <h3>{{ feedbackTitle }}</h3>
          </div>
          <span class="quality-badge">
            {{ assumptionWasCorrect ? copy.comparisonAligned : copy.reviewComparison }}
          </span>
        </div>

        <div class="reasoning-review">
          <section :class="{ needsReview: !buildPotAnswer.isCorrect }">
            <span>1. {{ copy.stepBuild }}</span>
            <p>{{ copy.yourAnswer }}: <strong>{{ formatBB(buildPotAnswer.value) }}</strong></p>
            <p>{{ copy.correctFinalPot }}: <strong>{{ formatBB(evaluation.finalPotBB) }}</strong></p>
            <small>{{ buildPotDiagnostic }}</small>
          </section>
          <section :class="{ needsReview: !priceCallAnswer.isCorrect }">
            <span>2. {{ copy.stepPrice }}</span>
            <p>{{ copy.yourAnswer }}: <strong>{{ formatPct(priceCallAnswer.value) }}</strong></p>
            <p>{{ copy.requiredEquity }}: <strong>{{ formatPct(evaluation.requiredEquityPct) }}</strong></p>
            <small>{{ priceCallDiagnostic }}</small>
          </section>
          <section :class="{ needsReview: !assumptionWasCorrect }">
            <span>3. {{ copy.stepCompare }}</span>
            <p>{{ copy.yourRead }}: <strong>{{ assumptionAnswerLabel }}</strong></p>
            <p>{{ copy.statedEquity }}: <strong>{{ formatPct(evaluation.heroEquityPct) }}</strong></p>
            <p>{{ copy.edge }}: <strong :class="evaluation.equityEdgePct >= 0 ? 'positive' : 'negative'">{{ formatSignedPct(evaluation.equityEdgePct) }}</strong></p>
          </section>
        </div>

        <div class="action-comparison">
          <div>
            <span>{{ copy.impliedAction }}</span>
            <strong>{{ evaluation.userAction }}</strong>
          </div>
          <div>
            <span>{{ copy.frozenTendency }}</span>
            <strong>{{ evaluation.isBreakEven ? copy.breakEvenCall : evaluation.correctAction }}</strong>
          </div>
        </div>

        <div class="concept-boundaries">
          <h4>{{ copy.meaningTitle }}</h4>
          <dl>
            <div><dt>Pot odds</dt><dd>{{ copy.potOddsDefinition }}</dd></div>
            <div><dt>Required equity</dt><dd>{{ copy.requiredEquityDefinition }}</dd></div>
            <div><dt>Hero equity</dt><dd>{{ copy.heroEquityDefinition }}</dd></div>
            <div><dt>Draw-hit probability</dt><dd>{{ copy.drawProbabilityDefinition }}</dd></div>
            <div><dt>EV</dt><dd>{{ copy.evDefinition }} {{ copy.simplifiedCallEv }}: {{ formatSignedBB(evaluation.callEvBB) }}</dd></div>
          </dl>
          <p>{{ copy.potOddsBoundary }}</p>
        </div>

        <div class="explanation-box">
          <p>{{ localizedExplanation }}</p>
          <small v-if="evaluation.isBreakEven">
            {{ copy.breakEvenBoundary }}
          </small>
        </div>

        <div class="result-separation">
          <strong>Decision quality ≠ Hand result</strong>
          <p>{{ copy.resultBoundary }}</p>
          <span>handResult: null</span>
        </div>

        <div class="feedback-actions">
          <button type="button" class="primary-button compact" @click="advanceQuestion">
            {{ isLastQuestion ? copy.viewResults : copy.nextDecision }}
          </button>
          <button
            type="button"
            class="secondary-button"
            :disabled="mistakeCount === 0"
            @click="startMistakeSession"
          >
            {{ copy.reviewPrices }} ({{ mistakeCount }})
          </button>
        </div>
      </section>
    </template>

    <section v-else class="session-complete" aria-live="polite">
      <span class="section-kicker">{{ copy.completeKicker }}</span>
      <h3 ref="completeHeading" tabindex="-1">{{ session.mode === 'mistakes' ? copy.priceReviewComplete : copy.sessionComplete }}</h3>
      <p>{{ copy.completeIntro }}</p>

      <div class="summary-grid">
        <div>
          <strong>{{ sessionScores.buildPot }} / {{ session.questions.length }}</strong>
          <span>{{ copy.stepBuild }}</span>
        </div>
        <div>
          <strong>{{ sessionScores.priceCall }} / {{ session.questions.length }}</strong>
          <span>{{ copy.stepPrice }}</span>
        </div>
        <div>
          <strong>{{ sessionScores.compare }} / {{ session.questions.length }}</strong>
          <span>{{ copy.stepCompare }}</span>
        </div>
      </div>

      <p class="review-queue-note">{{ copy.reviewQueue }}: {{ mistakeCount }}</p>

      <div class="complete-actions">
        <button type="button" class="primary-button compact" @click="startNewStandardSession">
          {{ copy.newSession }}
        </button>
        <button
          type="button"
          class="secondary-button"
          :disabled="mistakeCount === 0"
          @click="startMistakeSession"
        >
          {{ copy.reviewPrices }} ({{ mistakeCount }})
        </button>
      </div>
      <p v-if="mistakeNotice" class="mistake-notice" role="status">{{ mistakeNotice }}</p>

      <ApplyHub
        source="pot_odds_ev"
        @select-mode="emit('apply-mode', $event)"
      />
    </section>

    <footer class="assumption-note">
      <span>{{ copy.staticSource }}: pot-odds-v1</span>
      <span>{{ copy.modelLimits }}</span>
      <span>{{ copy.localRecord }}: postsoma_pot_odds_training_v1</span>
    </footer>
  </article>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import ApplyHub from '@/components/lobby/ApplyHub.vue'
import { getPotOddsExplanation } from '@/training/explanations/pot-odds-explanations.js'
import {
  calculateEquityEdge,
  calculateFinalPot,
  calculateRequiredEquity,
  createPotOddsSession,
  evaluateFoldCallDecision,
  evaluatePotOddsAnswer
} from '@/utils/training/potOddsTraining.js'
import {
  loadPotOddsTrainingState,
  recordPotOddsTrainingAnswer
} from '@/utils/training/potOddsTrainingStorage.js'
import { isZh } from '@/i18n/locale.js'

const emit = defineEmits(['apply-mode'])
const phase = ref('intro')
const session = ref(createPotOddsSession())
const currentIndex = ref(0)
const trainingStep = ref('build-pot')
const buildPotAnswer = ref(null)
const priceCallAnswer = ref(null)
const assumptionAnswer = ref(null)
const evaluation = ref(null)
const stepHeading = ref(null)
const stepFeedbackHeading = ref(null)
const completeHeading = ref(null)
const storageState = ref(loadPotOddsTrainingState())
const mistakeNotice = ref('')
const sessionScores = ref({ buildPot: 0, priceCall: 0, compare: 0, aligned: 0, review: 0 })

const COPY = Object.freeze({
  en: Object.freeze({
    kicker: 'POT ODDS / EV · PRICE PRACTICE',
    title: 'Build the price before you decide',
    description: 'Build the final pot, price the call, then compare a stated equity assumption.',
    sessionSeed: 'Session seed',
    fixedExercises: (count) => `${count} fixed price exercises`,
    questionProgress: (current, total) => `Question ${current} / ${total}`,
    questionAria: 'Pot odds question',
    potBeforeBet: 'Pot before bet',
    villainBet: 'Villain bet',
    yourCall: 'Your call',
    builderProgressAria: 'Price Builder progress',
    stepBuild: 'Build the pot',
    stepPrice: 'Price the call',
    stepCompare: 'Compare the assumption',
    stepOf: (step) => `Step ${step} of 3`,
    buildQuestion: 'If you call, what is the final pot?',
    buildHint: 'Add the starting pot, Villain’s bet, and your call.',
    finalPotAria: 'Choose the final pot in big blinds',
    startUnlock: 'Start to unlock Step 1. Later steps stay hidden.',
    addAmounts: 'Add all three amounts before choosing. The correct pot stays hidden.',
    stepFeedback: (step) => `Step ${step} feedback`,
    finalPotCorrect: 'Final pot built correctly',
    reviewPotParts: 'Review what enters the pot',
    continuePrice: 'Continue to price the call',
    priceQuestion: 'What real equity does this price require?',
    priceHint: 'Use your call as the numerator and the complete final pot as the denominator.',
    formula: 'Required equity = Your call ÷ Final pot',
    requiredEquityAria: 'Choose the required equity percentage',
    assumptionHidden: 'The exercise assumption stays hidden until Step 3.',
    thresholdCorrect: 'Price threshold calculated',
    reviewDenominator: 'Review the denominator',
    thresholdBoundary: 'This is a price threshold, not Hero’s actual equity.',
    continueCompare: 'Compare the stated assumption',
    compareQuestion: 'Does this stated equity meet the price threshold?',
    compareHint: 'Compare the two percentages before mapping the result to Fold or Call.',
    exerciseAssumption: 'Exercise assumption',
    assumptionBoundary: 'This is a fixed exercise assumption. It is not calculated from the previous numbers or from a poker hand.',
    compareAria: 'Compare stated equity with the price threshold',
    compareFirst: 'Compare the percentages first; do not guess Fold or Call.',
    start: 'Start Pot Odds practice',
    startBoundary: 'No room · no API key · no AI · no live game state',
    reviewKicker: 'PRICE BUILDER REVIEW',
    comparisonAligned: 'Comparison aligned',
    reviewComparison: 'Review comparison',
    yourAnswer: 'Your answer',
    correctFinalPot: 'Correct final pot',
    requiredEquity: 'Required equity',
    yourRead: 'Your read',
    statedEquity: 'Stated equity',
    edge: 'Edge',
    impliedAction: 'Action implied by your comparison',
    frozenTendency: 'Frozen-assumption tendency',
    breakEvenCall: 'Break-even → Call in v1',
    meaningTitle: 'What this means',
    potOddsDefinition: 'The price threshold for investing more.',
    requiredEquityDefinition: 'The minimum real equity required by this price.',
    heroEquityDefinition: 'A fixed exercise assumption, not real hand equity calculated by the app.',
    drawProbabilityDefinition: 'The chance of improving, not real equity against an opponent range.',
    evDefinition: 'Long-run value only under the stated assumptions; this exercise prioritizes price.',
    simplifiedCallEv: 'Simplified Call EV',
    potOddsBoundary: 'Pot odds tell you what the price requires. They do not calculate your equity against an opponent range.',
    breakEvenBoundary: 'Break-even stays distinct here; pot-odds-v1 maps exact equality to Call only for deterministic legacy scoring.',
    resultBoundary: 'No runout is simulated and no winner or single-hand profit is shown. One result cannot validate or invalidate the decision.',
    viewResults: 'View session results',
    nextDecision: 'Next decision',
    reviewPrices: 'Review flagged prices',
    completeKicker: 'SESSION COMPLETE',
    priceReviewComplete: 'Price review complete',
    sessionComplete: 'Price Builder session complete',
    completeIntro: 'Review the three reasoning skills separately. Existing mistake storage still follows the final Fold / Call mapping.',
    reviewQueue: 'Final-action review queue',
    newSession: 'New fixed session',
    staticSource: 'Static source',
    modelLimits: 'No rake, future betting, implied odds, range shifts, or split-pot adjustment',
    localRecord: 'Local record',
    standardMode: '8-question fixed set',
    mistakeMode: 'Flagged-price review',
    noReview: 'No flagged price questions yet',
    buildCorrect: 'You included the starting pot, Villain’s bet, and Hero’s call.',
    buildOmitCall: 'Hero’s call was missing. Your call also enters the final pot.',
    buildDoubleCall: 'Hero’s call was counted twice. Add it once, after the starting pot and Villain bet.',
    priceCorrect: 'The denominator is the complete final pot after calling.',
    priceOmitCall: 'The denominator omitted Hero’s call. Required equity uses Your call ÷ Final pot.',
    priceStartingPotOnly: 'Pot before bet is not the final pot; Villain’s bet and Hero’s call must also be included.',
    breakEvenAligned: 'Break-even boundary recognized',
    breakEvenReview: 'Review the exact-equality boundary',
    comparisonDone: 'You compared the stated assumption with the price',
    comparisonReviewTitle: 'Review how the stated equity compares with the threshold'
  }),
  zh: Object.freeze({
    kicker: '底池赔率 / EV · 价格练习',
    title: '先建立价格，再做决定',
    description: '先建立最终底池，再计算权益门槛，最后比较题目给定的权益假设。',
    sessionSeed: '本轮 seed',
    fixedExercises: (count) => `${count} 道固定价格练习`,
    questionProgress: (current, total) => `第 ${current} / ${total} 题`,
    questionAria: '底池赔率题目',
    potBeforeBet: '下注前底池',
    villainBet: '对手下注',
    yourCall: '你的跟注',
    builderProgressAria: '价格计算进度',
    stepBuild: '建立底池',
    stepPrice: '计算价格门槛',
    stepCompare: '比较题设假设',
    stepOf: (step) => `第 ${step} / 3 步`,
    buildQuestion: '如果跟注，最终底池是多少？',
    buildHint: '把下注前底池、对手下注和你的跟注相加。',
    finalPotAria: '选择最终底池 BB 数值',
    startUnlock: '开始后解锁第一步，后续步骤仍会保持隐藏。',
    addAmounts: '选择前先计入三笔金额；正确底池不会提前揭示。',
    stepFeedback: (step) => `第 ${step} 步反馈`,
    finalPotCorrect: '最终底池计算正确',
    reviewPotParts: '检查哪些筹码进入底池',
    continuePrice: '继续计算价格门槛',
    priceQuestion: '这个价格要求多少真实权益？',
    priceHint: '分子使用你的跟注，分母使用完整最终底池。',
    formula: '最低所需权益 = 你的跟注 ÷ 最终底池',
    requiredEquityAria: '选择最低所需权益百分比',
    assumptionHidden: '题设权益假设会在第三步揭示。',
    thresholdCorrect: '价格门槛计算正确',
    reviewDenominator: '检查公式分母',
    thresholdBoundary: '这只是价格门槛，不等于 Hero 的实际权益。',
    continueCompare: '比较题设权益假设',
    compareQuestion: '题设权益是否达到价格门槛？',
    compareHint: '先比较两个百分比，再映射为 Fold 或 Call。',
    exerciseAssumption: '题设假设',
    assumptionBoundary: '这是本题给定的固定权益假设，不是由前述数字或一手具体牌局计算出的真实权益。',
    compareAria: '比较题设权益与价格门槛',
    compareFirst: '先比较百分比，不直接猜 Fold 或 Call。',
    start: '开始底池赔率练习',
    startBoundary: '无需房间 · 无需 API Key · 无 AI · 无实时牌局状态',
    reviewKicker: '价格计算复盘',
    comparisonAligned: '比较一致',
    reviewComparison: '复习比较步骤',
    yourAnswer: '你的答案',
    correctFinalPot: '正确最终底池',
    requiredEquity: '最低所需权益',
    yourRead: '你的判断',
    statedEquity: '题设权益',
    edge: '权益差',
    impliedAction: '由你的比较推导出的行动',
    frozenTendency: '固定假设下的倾向',
    breakEvenCall: '刚好持平 → v1 固定映射为 Call',
    meaningTitle: '这些概念分别意味着什么',
    potOddsDefinition: '继续投入所需的价格门槛。',
    requiredEquityDefinition: '该价格要求的最低真实权益。',
    heroEquityDefinition: '本题给定的固定假设，不是系统算出的真实牌局权益。',
    drawProbabilityDefinition: '改善命中概率，不等于对手范围下的真实权益。',
    evDefinition: '只表示已定义假设下的长期价值；本练习优先训练价格。',
    simplifiedCallEv: '简化 Call EV',
    potOddsBoundary: '底池赔率只说明价格要求，不会计算你对对手范围的真实权益。',
    breakEvenBoundary: '这里单独标记刚好持平；pot-odds-v1 仅为了确定性的旧评分，把严格相等映射为 Call。',
    resultBoundary: '本题不模拟实际 runout，也不显示赢家或单手盈亏。一次结果不能证明或否定这次决策。',
    viewResults: '查看本轮结果',
    nextDecision: '下一题',
    reviewPrices: '复习价格候选',
    completeKicker: '本轮完成',
    priceReviewComplete: '价格候选复习完成',
    sessionComplete: '价格计算练习完成',
    completeIntro: '分别查看三项推理能力。现有复习记录仍沿用最终 Fold / Call 映射。',
    reviewQueue: '最终行动复习队列',
    newSession: '新一轮固定练习',
    staticSource: '固定数据源',
    modelLimits: '不含抽水、后续下注、隐含赔率、范围变化或分池调整',
    localRecord: '本地记录',
    standardMode: '8 题固定题库',
    mistakeMode: '价格候选复习',
    noReview: '暂无价格复习候选',
    buildCorrect: '你计入了下注前底池、对手下注和 Hero 跟注。',
    buildOmitCall: '漏算了 Hero 的跟注；这笔钱也会进入最终底池。',
    buildDoubleCall: 'Hero 跟注被重复计算；在下注前底池和对手下注之后，只需计入一次。',
    priceCorrect: '分母是跟注后的完整最终底池。',
    priceOmitCall: '分母漏掉了 Hero 跟注。最低所需权益使用“你的跟注 ÷ 最终底池”。',
    priceStartingPotOnly: '下注前底池不是最终底池；还必须计入对手下注和 Hero 跟注。',
    breakEvenAligned: '已识别刚好持平的边界',
    breakEvenReview: '复习严格相等的边界',
    comparisonDone: '你已将题设权益与价格门槛进行比较',
    comparisonReviewTitle: '复习题设权益与门槛的比较方式'
  })
})

const copy = computed(() => COPY[isZh.value ? 'zh' : 'en'])

const assumptionOptions = Object.freeze([
  Object.freeze({ id: 'below', label: 'Below threshold', labelZh: '低于门槛' }),
  Object.freeze({ id: 'meets', label: 'Meets threshold', labelZh: '达到门槛' }),
  Object.freeze({ id: 'break-even', label: 'Break-even', labelZh: '刚好持平' })
])

const localizedOptionLabel = (option) => isZh.value ? option.labelZh : option.label

const currentQuestion = computed(() => session.value.questions[currentIndex.value])
const isLastQuestion = computed(() => currentIndex.value === session.value.questions.length - 1)
const mistakeCount = computed(() => storageState.value.mistakeQuestionIds.length)
const explanation = computed(() => getPotOddsExplanation(currentQuestion.value.explanationKey))
const localizedExplanation = computed(() => explanation.value[isZh.value ? 'zh' : 'en'])
const correctFinalPot = computed(() => calculateFinalPot(
  currentQuestion.value.potBeforeBetBB,
  currentQuestion.value.villainBetBB,
  currentQuestion.value.callAmountBB
))
const correctRequiredEquity = computed(() => calculateRequiredEquity(
  currentQuestion.value.potBeforeBetBB,
  currentQuestion.value.villainBetBB,
  currentQuestion.value.callAmountBB
))
const currentTruth = computed(() => evaluateFoldCallDecision(currentQuestion.value))
const currentEquityEdge = computed(() => calculateEquityEdge(
  currentQuestion.value.heroEquityPct,
  correctRequiredEquity.value
))
const expectedAssumptionOutcome = computed(() => {
  if (currentTruth.value.isBreakEven) return 'break-even'
  return currentEquityEdge.value > 0 ? 'meets' : 'below'
})
const assumptionWasCorrect = computed(() => (
  Boolean(assumptionAnswer.value) && assumptionAnswer.value === expectedAssumptionOutcome.value
))
const assumptionAnswerLabel = computed(() => {
  const option = assumptionOptions.find(({ id }) => id === assumptionAnswer.value)
  return option ? localizedOptionLabel(option) : '—'
})
const progressPercent = computed(() => {
  if (phase.value === 'intro') return 0
  return Math.round(((currentIndex.value + (evaluation.value ? 1 : 0)) / session.value.questions.length) * 100)
})
const sessionModeLabel = computed(() => (
  session.value.mode === 'mistakes' ? copy.value.mistakeMode : copy.value.standardMode
))
const feedbackTitle = computed(() => {
  if (evaluation.value?.isBreakEven) {
    return assumptionWasCorrect.value
      ? copy.value.breakEvenAligned
      : copy.value.breakEvenReview
  }
  return assumptionWasCorrect.value
    ? copy.value.comparisonDone
    : copy.value.comparisonReviewTitle
})

const formatNumber = (value, digits = 2) => Number(value.toFixed(digits)).toString()
const formatBB = (value) => `${formatNumber(value)} BB`
const formatPct = (value) => `${formatNumber(value)}%`
const formatSignedPct = (value) => `${value >= 0 ? '+' : ''}${formatNumber(value)} pts`
const formatSignedBB = (value) => `${value >= 0 ? '+' : ''}${formatNumber(value)} BB`

const rotateOptions = (options, offset) => {
  const start = Math.abs(offset) % options.length
  return [...options.slice(start), ...options.slice(0, start)]
}

const buildPotOptions = computed(() => {
  const question = currentQuestion.value
  const correct = correctFinalPot.value
  return rotateOptions([
    { id: 'omit-call', value: question.potBeforeBetBB + question.villainBetBB, isCorrect: false },
    { id: 'complete-pot', value: correct, isCorrect: true },
    { id: 'double-call', value: correct + question.callAmountBB, isCorrect: false }
  ], question.seed)
})

const priceCallOptions = computed(() => {
  const question = currentQuestion.value
  const currentPot = question.potBeforeBetBB + question.villainBetBB
  return rotateOptions([
    { id: 'complete-denominator', value: correctRequiredEquity.value, isCorrect: true },
    { id: 'omit-call-denominator', value: (question.callAmountBB / currentPot) * 100, isCorrect: false },
    { id: 'pot-before-only', value: (question.callAmountBB / question.potBeforeBetBB) * 100, isCorrect: false }
  ], question.seed + 1)
})

const buildPotDiagnostic = computed(() => {
  if (!buildPotAnswer.value) return ''
  if (buildPotAnswer.value.isCorrect) {
    return copy.value.buildCorrect
  }
  if (buildPotAnswer.value.id === 'omit-call') {
    return copy.value.buildOmitCall
  }
  return copy.value.buildDoubleCall
})

const priceCallDiagnostic = computed(() => {
  if (!priceCallAnswer.value) return ''
  if (priceCallAnswer.value.isCorrect) {
    return copy.value.priceCorrect
  }
  if (priceCallAnswer.value.id === 'omit-call-denominator') {
    return copy.value.priceOmitCall
  }
  return copy.value.priceStartingPotOnly
})

const stepOrder = Object.freeze(['build-pot', 'price-call', 'compare-assumption'])
const stepIndicatorClass = (step) => {
  const targetIndex = stepOrder.indexOf(step)
  const currentIndexValue = trainingStep.value === 'feedback'
    ? stepOrder.length
    : stepOrder.indexOf(trainingStep.value)
  return {
    active: targetIndex === currentIndexValue,
    complete: targetIndex < currentIndexValue
  }
}

const focusStep = () => nextTick(() => stepHeading.value?.focus())
const focusStepFeedback = () => nextTick(() => stepFeedbackHeading.value?.focus())
const focusComplete = () => nextTick(() => completeHeading.value?.focus())

const beginPreparedSession = () => {
  phase.value = 'active'
  focusStep()
}

const resetQuestionState = () => {
  trainingStep.value = 'build-pot'
  buildPotAnswer.value = null
  priceCallAnswer.value = null
  assumptionAnswer.value = null
  evaluation.value = null
}

const resetSessionState = () => {
  currentIndex.value = 0
  resetQuestionState()
  mistakeNotice.value = ''
  sessionScores.value = { buildPot: 0, priceCall: 0, compare: 0, aligned: 0, review: 0 }
  phase.value = 'active'
  focusStep()
}

const startNewStandardSession = () => {
  session.value = createPotOddsSession({ seed: Date.now(), mode: 'standard' })
  resetSessionState()
}

const startMistakeSession = () => {
  const latestState = loadPotOddsTrainingState()
  storageState.value = latestState
  if (!latestState.mistakeQuestionIds.length) {
    mistakeNotice.value = copy.value.noReview
    return
  }

  session.value = createPotOddsSession({
    seed: Date.now(),
    mode: 'mistakes',
    questionIds: latestState.mistakeQuestionIds
  })
  resetSessionState()
}

const answerBuildPot = (option) => {
  if (phase.value !== 'active' || buildPotAnswer.value) return
  buildPotAnswer.value = option
  if (option.isCorrect) sessionScores.value.buildPot += 1
  focusStepFeedback()
}

const continueToPriceCall = () => {
  if (!buildPotAnswer.value) return
  trainingStep.value = 'price-call'
  focusStep()
}

const answerPriceCall = (option) => {
  if (priceCallAnswer.value) return
  priceCallAnswer.value = option
  if (option.isCorrect) sessionScores.value.priceCall += 1
  focusStepFeedback()
}

const continueToCompareAssumption = () => {
  if (!priceCallAnswer.value) return
  trainingStep.value = 'compare-assumption'
  focusStep()
}

const answerAssumption = (outcome) => {
  if (assumptionAnswer.value) return
  assumptionAnswer.value = outcome
  if (outcome === expectedAssumptionOutcome.value) sessionScores.value.compare += 1

  const action = outcome === 'below' ? 'Fold' : 'Call'
  const result = evaluatePotOddsAnswer(currentQuestion.value, action)
  evaluation.value = result
  storageState.value = recordPotOddsTrainingAnswer(currentQuestion.value, result)

  if (result.isRecommendedAction) sessionScores.value.aligned += 1
  else sessionScores.value.review += 1

  trainingStep.value = 'feedback'
  focusStepFeedback()
}

const advanceQuestion = () => {
  if (!evaluation.value) return
  if (isLastQuestion.value) {
    phase.value = 'complete'
    focusComplete()
    return
  }

  currentIndex.value += 1
  resetQuestionState()
  focusStep()
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

.question-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
}

.math-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
}

.step-indicator {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}

.step-indicator li {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.08rem 0.45rem;
  align-items: center;
  padding: 0.58rem 0.65rem;
  color: var(--text-tertiary);
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.step-indicator li > span {
  grid-row: 1 / 3;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
  border-radius: 50%;
  font-family: var(--font-family-mono);
  font-size: 0.72rem;
  font-weight: 850;
}

.step-indicator strong,
.step-indicator small {
  min-width: 0;
  overflow-wrap: anywhere;
}

.step-indicator strong {
  color: inherit;
  font-size: 0.76rem;
}

.step-indicator small {
  font-size: 0.64rem;
}

.step-indicator li.active {
  color: var(--text-primary);
  border-color: rgba(217, 173, 88, 0.42);
  background: rgba(217, 173, 88, 0.08);
}

.step-indicator li.active > span,
.step-indicator li.complete > span {
  color: var(--text-inverse);
  background: var(--accent-primary-strong);
  border-color: var(--accent-primary-strong);
}

.step-indicator li.complete {
  color: var(--text-secondary);
}

.builder-step {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.step-heading h3 {
  margin-top: 0.3rem;
  color: var(--text-primary);
  font-size: clamp(1.05rem, 2vw, 1.3rem);
}

.step-heading p {
  margin-top: 0.2rem;
  color: var(--text-tertiary);
  font-size: 0.8rem;
}

.step-heading h3:focus,
.step-feedback:focus,
.feedback-panel:focus,
.session-complete h3:focus {
  outline: none;
}

.number-options,
.comparison-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 1rem;
}

.number-options button,
.comparison-options button {
  min-height: 52px;
  padding: 0.65rem 0.8rem;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 850;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.comparison-options button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

.comparison-options button small {
  margin-top: 0.12rem;
  color: var(--text-tertiary);
  font-size: 0.68rem;
}

.number-options button:not(:disabled):hover,
.comparison-options button:not(:disabled):hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
  background: rgba(217, 173, 88, 0.08);
}

.number-options button.selected,
.comparison-options button.selected {
  color: var(--text-inverse);
  background: var(--accent-primary-strong);
  border-color: var(--accent-primary-strong);
}

.number-options button.correct:not(.selected) {
  color: var(--text-primary);
  border-color: rgba(47, 154, 97, 0.62);
  background: rgba(47, 154, 97, 0.12);
}

.number-options button:disabled,
.comparison-options button:disabled {
  cursor: not-allowed;
  opacity: 0.68;
}

.formula-hint,
.assumption-reveal,
.step-feedback,
.concept-boundaries {
  margin-top: 0.85rem;
  padding: 0.82rem 0.9rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.formula-hint {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
  color: var(--text-secondary);
  font-family: var(--font-family-mono);
  font-size: 0.78rem;
}

.formula-hint small,
.step-feedback small {
  color: var(--text-tertiary);
  font-size: 0.7rem;
  line-height: 1.5;
}

.assumption-reveal {
  border-color: rgba(217, 173, 88, 0.3);
  background: rgba(217, 173, 88, 0.065);
}

.assumption-reveal > span,
.step-feedback > span {
  display: block;
  color: var(--accent-primary);
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.assumption-reveal > strong {
  display: block;
  margin-top: 0.35rem;
  color: var(--text-primary);
  font-family: var(--font-family-mono);
  font-size: 1.2rem;
}

.assumption-reveal p,
.step-feedback p,
.concept-boundaries p {
  margin-top: 0.35rem;
  color: var(--text-secondary);
  font-size: 0.78rem;
  line-height: 1.5;
}

.step-feedback h4,
.concept-boundaries h4 {
  margin-top: 0.3rem;
  color: var(--text-primary);
  font-size: 0.98rem;
}

.step-feedback code {
  display: block;
  margin-top: 0.55rem;
  color: var(--text-primary);
  font-family: var(--font-family-mono);
  font-size: 0.76rem;
  white-space: normal;
  overflow-wrap: anywhere;
}

.step-feedback > small {
  display: block;
  margin-top: 0.45rem;
}

.step-feedback .primary-button {
  margin-top: 0.75rem;
}

.reasoning-review {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.9rem;
}

.reasoning-review section {
  min-width: 0;
  padding: 0.75rem 0.8rem;
  background: rgba(47, 154, 97, 0.07);
  border: 1px solid rgba(47, 154, 97, 0.25);
  border-radius: var(--radius-md);
}

.reasoning-review section.needsReview {
  background: rgba(166, 58, 66, 0.07);
  border-color: rgba(166, 58, 66, 0.3);
}

.reasoning-review span,
.reasoning-review small {
  color: var(--text-tertiary);
  font-size: 0.68rem;
  line-height: 1.45;
}

.reasoning-review p {
  margin-top: 0.28rem;
  color: var(--text-secondary);
  font-size: 0.76rem;
}

.reasoning-review strong {
  color: var(--text-primary);
}

.concept-boundaries dl {
  display: grid;
  gap: 0.4rem;
  margin: 0.65rem 0 0;
}

.concept-boundaries dl > div {
  display: grid;
  grid-template-columns: minmax(120px, 0.35fr) minmax(0, 1fr);
  gap: 0.65rem;
}

.concept-boundaries dt {
  color: var(--accent-primary-strong);
  font-size: 0.74rem;
  font-weight: 800;
}

.concept-boundaries dd {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.74rem;
  line-height: 1.45;
}

.positive {
  color: var(--success) !important;
}

.negative {
  color: var(--danger) !important;
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

.review-queue-note {
  color: var(--text-tertiary) !important;
  font-size: 0.74rem !important;
}

.number-options button:focus-visible,
.comparison-options button:focus-visible,
.primary-button:focus-visible,
.secondary-button:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 3px;
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
  .math-grid,
  .reasoning-review {
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
  .decision-actions,
  .number-options,
  .comparison-options,
  .reasoning-review,
  .concept-boundaries dl > div {
    grid-template-columns: 1fr;
  }

  .step-indicator li {
    grid-template-columns: 1fr;
    justify-items: center;
    padding: 0.5rem 0.25rem;
    text-align: center;
  }

  .step-indicator li > span {
    grid-row: auto;
    width: 26px;
    height: 26px;
  }

  .step-indicator strong {
    font-size: 0.66rem;
  }

  .step-indicator small {
    font-size: 0.6rem;
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
  .number-options button,
  .comparison-options button,
  .primary-button,
  .secondary-button,
  .progress-track span {
    transition: none;
  }

  .decision-actions button:not(:disabled):hover,
  .number-options button:not(:disabled):hover,
  .comparison-options button:not(:disabled):hover,
  .primary-button:hover:not(:disabled),
  .secondary-button:hover:not(:disabled) {
    transform: none;
  }
}
</style>
