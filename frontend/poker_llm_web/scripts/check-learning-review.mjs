import assert from 'node:assert/strict'
import { POT_ODDS_QUESTION_CATALOG } from '../src/training/drills/pot-odds-catalog-v2.js'
import { recordPotOddsSkillAnswer, recordPotOddsTrainingAnswer, loadPotOddsTrainingState, getPotOddsReviewPriority, POT_ODDS_TRAINING_STORAGE_KEY } from '../src/utils/training/potOddsTrainingStorage.js'
import { createPotOddsSession } from '../src/utils/training/potOddsTraining.js'
import { createPreflopSession, evaluatePreflopAction } from '../src/utils/training/preflopTraining.js'
import { loadPreflopTrainingState, recordPreflopTrainingAnswer, recordPreflopReasoningAnswer } from '../src/utils/training/preflopTrainingStorage.js'
import { RANGE_UPDATING_QUESTIONS, updateRangeWeights } from '../src/training/drills/range-updating-v1.js'
import { createRangeUpdatingSession, loadRangeUpdatingState, recordRangeUpdatingAnswer } from '../src/utils/training/rangeUpdatingTraining.js'

const values = new Map()
globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
const [first, second, third] = POT_ODDS_QUESTION_CATALOG
localStorage.setItem(POT_ODDS_TRAINING_STORAGE_KEY, JSON.stringify({ storageVersion: 1, drillVersion: 'pot-odds-v1', recentAnswers: [], mistakeQuestionIds: [first.id] }))
assert.deepEqual(loadPotOddsTrainingState().skillMistakes.action, [first.id], 'Legacy action mistakes must migrate')
recordPotOddsSkillAnswer(first, 'buildPot', false)
recordPotOddsSkillAnswer(first, 'reason', false)
recordPotOddsTrainingAnswer(first, { isRecommendedAction: true })
let state = loadPotOddsTrainingState()
assert.ok(state.mistakeQuestionIds.includes(first.id), 'A correct final action must not erase earlier skill mistakes')
recordPotOddsSkillAnswer(first, 'buildPot', true)
state = loadPotOddsTrainingState()
assert.deepEqual(state.skillMistakes.buildPot, [])
assert.deepEqual(state.skillMistakes.reason, [first.id], 'Only the corrected skill should clear')
recordPotOddsSkillAnswer(second, 'priceCall', false)
recordPotOddsSkillAnswer(third, 'priceCall', false)
state = loadPotOddsTrainingState()
const priority = getPotOddsReviewPriority(state)
assert.ok(priority.indexOf(second.id) < priority.indexOf(first.id), 'More widespread weak skills should be reviewed first')
assert.deepEqual(new Set(getPotOddsReviewPriority(state, 'reason')), new Set([first.id]))
const review = createPotOddsSession({ seed: 1, mode: 'mistakes', questionIds: priority, prioritizeReview: true })
assert.deepEqual(review.questions.map(question => question.id), priority)
recordPotOddsSkillAnswer(first, 'reason', true)
assert.ok(!loadPotOddsTrainingState().mistakeQuestionIds.includes(first.id))
assert.throws(() => recordPotOddsSkillAnswer(first, 'unknown', false))

const preflopHand = createPreflopSession({ seed: 42 }).hands[0]
recordPreflopReasoningAnswer(preflopHand, { id: 'reason', isCorrect: false, selectedId: 'guarantee' })
const primaryAction = preflopHand.baseline.primaryActions[0]
recordPreflopTrainingAnswer(preflopHand, evaluatePreflopAction(preflopHand, primaryAction))
assert.ok(loadPreflopTrainingState().mistakeHands.includes(preflopHand.hero.canonicalHand), 'An aligned reference action must preserve the reasoning mistake')
recordPreflopReasoningAnswer(preflopHand, { id: 'variation', isCorrect: false, selectedId: 'same' })
recordPreflopReasoningAnswer(preflopHand, { id: 'reason', isCorrect: true, selectedId: 'reference' })
assert.equal(loadPreflopTrainingState().skillMistakes.reason.length, 0)
assert.equal(loadPreflopTrainingState().skillMistakes.variation.length, 1)
recordPreflopReasoningAnswer(preflopHand, { id: 'variation', isCorrect: true, selectedId: 'recheck' })
assert.equal(loadPreflopTrainingState().mistakeHands.length, 0)

assert.equal(RANGE_UPDATING_QUESTIONS.length, 12)
assert.equal(new Set(RANGE_UPDATING_QUESTIONS.map(question => question.id)).size, 12)
for (const question of RANGE_UPDATING_QUESTIONS) {
  const result = updateRangeWeights(question.groups)
  assert.ok(Math.abs(result.reduce((sum, share) => sum + share, 0) - 1) < 1e-12)
  assert.ok(result.every(share => share > 0 && share < 1), 'An action should not collapse the range to one group')
  const totalObservations = question.groups.reduce((sum, group) => sum + group.combos * group.frequencyPct, 0)
  question.groups.forEach((group, index) => assert.ok(Math.abs(result[index] - group.combos * group.frequencyPct / totalObservations) < 1e-12))
  const ranked = [...result].sort((a, b) => b - a)
  assert.ok(ranked[0] > ranked[1], 'Each question must have one best-supported group')
  assert.equal(question.correctId, question.groups[result.indexOf(ranked[0])].id)
  assert.ok(question.explanation.zh && question.explanation.en && question.context.zh && question.context.en)
}
// High action likelihood alone does not imply the largest posterior share.
const bluffRaise = RANGE_UPDATING_QUESTIONS[1]
assert.equal(bluffRaise.correctId, 'group-2')
assert.equal(bluffRaise.groups[0].frequencyPct, 90)
assert.throws(() => updateRangeWeights([{ combos: 1, frequencyPct: 0 }]))
const mixed = createRangeUpdatingSession({ seed: 42 })
assert.equal(mixed.length, 6)
for (const action of ['raise', 'call', 'check']) assert.equal(mixed.filter(question => question.action === action).length, 2)
assert.deepEqual(mixed, createRangeUpdatingSession({ seed: 42 }))
const rangeQuestion = mixed[0]
const wrong = rangeQuestion.options.find(option => option.id !== rangeQuestion.correctId).id
recordRangeUpdatingAnswer({ id: rangeQuestion.id, selectedId: wrong })
assert.deepEqual(loadRangeUpdatingState().mistakes, [rangeQuestion.id])
assert.deepEqual(createRangeUpdatingSession({ seed: 42, ids: loadRangeUpdatingState().mistakes }).map(question => question.id), [rangeQuestion.id])
recordRangeUpdatingAnswer({ id: rangeQuestion.id, selectedId: rangeQuestion.correctId })
assert.deepEqual(loadRangeUpdatingState().mistakes, [])

localStorage.setItem(POT_ODDS_TRAINING_STORAGE_KEY, '{broken')
assert.equal(loadPotOddsTrainingState().mistakeQuestionIds.length, 0)
globalThis.localStorage = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
assert.doesNotThrow(() => recordPotOddsSkillAnswer(first, 'reason', false))
assert.doesNotThrow(() => recordRangeUpdatingAnswer({ id: rangeQuestion.id, selectedId: wrong }))
delete globalThis.localStorage
console.log('Learning review checks passed: skill isolation, legacy migration, weak-skill priority, Bayesian range updates, balanced sessions and safe storage.')
