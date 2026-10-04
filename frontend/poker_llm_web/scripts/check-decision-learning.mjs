import assert from 'node:assert/strict'
import { GUIDED_CASE, createReasoningFollowups } from '../src/training/lessons/decision-learning.js'
import { POT_ODDS_QUESTION_CATALOG } from '../src/training/drills/pot-odds-catalog-v2.js'
import { createPreflopSession } from '../src/utils/training/preflopTraining.js'
import { evaluateFoldCallDecision } from '../src/utils/training/potOddsTraining.js'

// Check the teaching case against an independent enumeration of its outcomes.
const riverOutcomes = [...Array(8).fill(0), ...Array(4).fill(1)]
const equityPct = 100 * riverOutcomes.reduce((sum, win) => sum + win, 0) / riverOutcomes.length
const riverTruth = evaluateFoldCallDecision({ potBeforeBetBB: 12, villainBetBB: 6, callAmountBB: 6, heroEquityPct: equityPct })
assert.equal(riverTruth.requiredEquityPct, 25)
assert.ok(Math.abs(riverTruth.callEvBB - 2) < 1e-9)
assert.equal(riverTruth.correctAction, 'Call')
assert.deepEqual(GUIDED_CASE.steps.map(step => step.id), ['hand', 'context', 'range', 'price', 'risk', 'decision'])

const questionSets = [GUIDED_CASE.steps]
for (const original of POT_ODDS_QUESTION_CATALOG) {
  const followups = createReasoningFollowups('pot-odds', original, 'Call')
  const changed = followups[1].input
  assert.deepEqual({ ...changed, heroEquityPct: original.heroEquityPct }, original, 'Only equity may change')
  assert.notEqual(changed.heroEquityPct, original.heroEquityPct)
  assert.ok(changed.heroEquityPct >= 0 && changed.heroEquityPct <= 100)
  const truth = evaluateFoldCallDecision(changed)
  assert.equal(truth.correctAction, followups[1].correctId)
  assert.notEqual(truth.correctAction, evaluateFoldCallDecision(original).correctAction, 'A variation must cross the decision threshold')
  questionSets.push(followups)
}
for (const hand of createPreflopSession({ seed: 123, mode: 'standard' }).hands) {
  for (const action of hand.actions) {
    const followups = createReasoningFollowups('preflop', hand, action.id)
    assert.equal(followups[1].correctId, 'recheck', '20 BB strategy must not be invented')
    questionSets.push(followups)
  }
}
for (const questions of questionSets) {
  for (const question of questions) {
    assert.equal(question.options.filter(option => option.id === question.correctId).length, 1)
    for (const language of ['zh', 'en']) {
      assert.ok(question.title[language] && question.explanation[language])
      assert.ok(question.options.every(option => option.label[language]))
    }
  }
}
console.log('Decision learning checks passed: guided-case EV, single-condition changes, crossed thresholds, reference boundaries and bilingual questions.')
