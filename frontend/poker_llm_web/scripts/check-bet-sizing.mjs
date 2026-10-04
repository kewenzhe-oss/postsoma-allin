import assert from 'node:assert/strict'
import { POT_SIZES, potBetAmount, raiseTarget, raiseAmounts } from '../src/utils/poker/betSizing.js'
assert.deepEqual(POT_SIZES.map(f => potBetAmount(40, f)), [13,20,30,40,60,80])
// Already committed chips must not be paid twice or change the chosen percentage.
for (const heroBet of [0,5,10,30]) {
 const invest = potBetAmount(40, 1)
 const target = raiseTarget(invest, heroBet)
 assert.equal(target, 40 + heroBet)
 const breakdown = raiseAmounts({pot:40,currentBet:40,heroBet}, target)
 assert.equal(breakdown.invest, 40)
 assert.equal(breakdown.potAfterAction, 80)
}
// Facing a bet of 20, half of pot 40 is a call, not a legal raise.
const minRaise = 40, heroBet = 0
assert.ok(raiseTarget(potBetAmount(40, .5), heroBet) < minRaise)
assert.equal(raiseTarget(potBetAmount(40, 2), heroBet), 80)
console.log('PASS: pot proportions, street-total conversion, no double payment, insufficient raise')
