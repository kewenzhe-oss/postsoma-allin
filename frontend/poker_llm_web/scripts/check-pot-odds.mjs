import assert from 'node:assert/strict'
import {
  assertPotOddsQuestionCatalog,
  calculateCallEv,
  calculateEquityEdge,
  calculateFinalPot,
  calculateRequiredEquity,
  evaluateFoldCallDecision
} from '../src/utils/training/potOddsTraining.js'

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

console.log('Pot Odds / EV self-check passed: formulas, edges, EV signs, break-even, and static catalog are consistent.')
