import assert from 'node:assert/strict'
import {
  assertPotOddsQuestionCatalog,
  calculateCallEv,
  calculateEquityEdge,
  calculateFinalPot,
  calculateRequiredEquity,
  createPotOddsSession,
  evaluateFoldCallDecision
} from '../src/utils/training/potOddsTraining.js'
import { POT_ODDS_QUESTION_CATALOG, POT_ODDS_SESSION_MIX } from '../src/training/drills/pot-odds-catalog-v2.js'
import { POT_ODDS_QUESTIONS_V1 } from '../src/training/drills/pot-odds-v1.js'
import { loadPotOddsTrainingState, recordPotOddsTrainingAnswer, POT_ODDS_TRAINING_STORAGE_KEY } from '../src/utils/training/potOddsTrainingStorage.js'

const approximatelyEqual = (actual, expected, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be approximately ${expected}`)
}

approximatelyEqual(calculateRequiredEquity(90, 30, 30), 20)
approximatelyEqual(calculateRequiredEquity(100, 50, 50), 25)
approximatelyEqual(calculateRequiredEquity(90, 60, 60), 28.571428571428573)
approximatelyEqual(calculateRequiredEquity(100, 100, 100), 33.33333333333333)

assert.ok(calculateEquityEdge(30, 25) > 0)
assert.ok(calculateEquityEdge(20, 25) < 0)

const finalPot = calculateFinalPot(100, 50, 50)
assert.ok(calculateCallEv(finalPot, 50, 30) > 0)
assert.ok(calculateCallEv(finalPot, 50, 20) < 0)
approximatelyEqual(calculateCallEv(finalPot, 50, 25), 0)

const positiveDecision = evaluateFoldCallDecision({
  potBeforeBetBB: 100,
  villainBetBB: 50,
  callAmountBB: 50,
  heroEquityPct: 30
})
const negativeDecision = evaluateFoldCallDecision({
  potBeforeBetBB: 100,
  villainBetBB: 50,
  callAmountBB: 50,
  heroEquityPct: 20
})
const breakEvenDecision = evaluateFoldCallDecision({
  potBeforeBetBB: 100,
  villainBetBB: 50,
  callAmountBB: 50,
  heroEquityPct: 25
})

assert.equal(positiveDecision.correctAction, 'Call')
assert.ok(positiveDecision.callEvBB > 0)
assert.equal(negativeDecision.correctAction, 'Fold')
assert.ok(negativeDecision.callEvBB < 0)
assert.equal(breakEvenDecision.correctAction, 'Call')
assert.equal(breakEvenDecision.isBreakEven, true)
approximatelyEqual(breakEvenDecision.callEvBB, 0)

assert.equal(assertPotOddsQuestionCatalog(), true)

assert.equal(POT_ODDS_QUESTION_CATALOG.length, 32)
assert.equal(new Set(POT_ODDS_QUESTION_CATALOG.map(question => question.id)).size, 32)
for (const original of POT_ODDS_QUESTIONS_V1) {
  const retained = POT_ODDS_QUESTION_CATALOG.find(question => question.id === original.id)
  assert.deepEqual({ ...retained, trainingGroup: undefined }, { ...original, trainingGroup: undefined }, 'Legacy questions must remain unchanged')
}
for (const question of POT_ODDS_QUESTION_CATALOG.filter(question => question.trainingGroup !== 'core')) {
  const truth = evaluateFoldCallDecision(question)
  assert.ok(question.explanation.zh && question.explanation.en)
  if (question.trainingGroup === 'break_even') {
    assert.equal(truth.isBreakEven, true)
    approximatelyEqual(truth.callEvBB, 0)
  }
  if (question.trainingGroup === 'near_threshold') {
    assert.ok(Math.abs(truth.equityEdgePct) > 0 && Math.abs(truth.equityEdgePct) <= 0.11)
    assert.equal(truth.isBreakEven, false, 'Rounded display must not turn a near-threshold question into a tie')
  }
}
for (const seed of [1, 2, 20, 123, 20261003]) {
  const session = createPotOddsSession({ seed })
  assert.equal(session.questions.length, 8)
  assert.equal(new Set(session.questions.map(question => question.id)).size, 8)
  assert.deepEqual(session, createPotOddsSession({ seed }), 'Seed must reproduce the same selection and order')
  for (const [group, count] of Object.entries(POT_ODDS_SESSION_MIX)) {
    assert.equal(session.questions.filter(question => question.trainingGroup === group).length, count)
  }
}
const reviewIds = POT_ODDS_QUESTION_CATALOG.slice(0, 12).map(question => question.id)
const review = createPotOddsSession({ seed: 1, mode: 'mistakes', questionIds: reviewIds })
assert.equal(review.questions.length, 8)
assert.ok(review.questions.every(question => reviewIds.includes(question.id)))

// Preserve the user's existing v1 review queue while accepting new catalog IDs.
const localValues = new Map()
globalThis.localStorage = { getItem: key => localValues.get(key) ?? null, setItem: (key, value) => localValues.set(key, value) }
localStorage.setItem(POT_ODDS_TRAINING_STORAGE_KEY, JSON.stringify({ storageVersion: 1, drillVersion: 'pot-odds-v1', recentAnswers: [], mistakeQuestionIds: ['half-pot-fold-01'] }))
assert.deepEqual(loadPotOddsTrainingState().mistakeQuestionIds, ['half-pot-fold-01'])
const addedQuestion = POT_ODDS_QUESTION_CATALOG.find(question => question.trainingGroup === 'overbet')
recordPotOddsTrainingAnswer(addedQuestion, { ...evaluateFoldCallDecision(addedQuestion), userAction: 'Call', isRecommendedAction: false })
assert.ok(loadPotOddsTrainingState().mistakeQuestionIds.includes(addedQuestion.id))
assert.ok(loadPotOddsTrainingState().mistakeQuestionIds.includes('half-pot-fold-01'))
assert.equal(loadPotOddsTrainingState().recentAnswers[0].questionVersion, addedQuestion.version)
delete globalThis.localStorage

console.log('Pot Odds / EV self-check passed: 32 questions, legacy compatibility, boundary precision, balanced 8-question sessions, deterministic replay and review storage.')
