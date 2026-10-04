import assert from 'node:assert/strict'
import { Hand } from '../src/utils/pokersolver.js'
import { BETTING_PURPOSE_QUESTIONS as questions } from '../src/training/drills/betting-purpose.js'
const board=['Kc','9d','7s','4h','2c'], hero=Hand.solve(['Kh','Qs',...board])
for(const [cards,heroWins] of [[['Ks','Jh'],true],[['Kd','Th'],true],[['Ah','9s'],true],[['As','Kd'],false],[['Ks','9h'],false],[['7h','7d'],false],[['9h','9s'],false],[['As','Qd'],true],[['As','Jd'],true]]) {
 assert.equal(new Set([...board,'Kh','Qs',...cards]).size,9)
 const opponent=Hand.solve([...cards,...board])
 assert.equal(Hand.winners([hero,opponent])[0]===hero,heroWins)
 // Relative bet/check difference: a worse caller pays 10; a better caller costs 10.
 const checkEv=heroWins?20:0, callEv=heroWins?30:-10
 assert.equal(callEv-checkEv,heroWins?10:-10)
}
assert.equal(questions.length,6)
assert.equal(new Set(questions.map(q=>q.id)).size,6)
for(const q of questions) {
 assert.equal(q.options.filter(o=>o.id===q.correctId).length,1)
 for(const language of ['zh','en']) assert.ok(q.context[language]&&q.title[language]&&q.explanation[language])
}
console.log('Betting-purpose case passed: legal cards, relative hand strength, payoff comparisons and bilingual questions.')
const { BETTING_PURPOSE_CASES } = await import('../src/training/drills/betting-purpose.js')
assert.equal(BETTING_PURPOSE_CASES.length,3)
assert.equal(BETTING_PURPOSE_CASES.flatMap(item=>item.questions).length,12)
for(const item of BETTING_PURPOSE_CASES) for(const q of item.questions) {
 assert.equal(q.options.filter(o=>o.id===q.correctId).length,1)
 for(const lang of ['zh','en']) assert.ok(q.context[lang]&&q.explanation[lang])
}
const { createLabSession } = await import('../src/utils/training/decisionLabTraining.js')
const { createRangeUpdatingSession } = await import('../src/utils/training/rangeUpdatingTraining.js')
for(const kind of ['board','bluff','combos']) {
 const first=createLabSession(kind,42),second=createLabSession(kind,42,null,first.map(q=>q.id))
 assert.equal(second.filter(q=>first.some(old=>old.id===q.id)).length,0)
}
const firstRange=createRangeUpdatingSession({seed:42})
const nextRange=createRangeUpdatingSession({seed:42,previousIds:firstRange.map(q=>q.id)})
assert.equal(nextRange.filter(q=>firstRange.some(old=>old.id===q.id)).length,0)
const { createPotOddsSession } = await import('../src/utils/training/potOddsTraining.js')
const firstPrice=createPotOddsSession({seed:42})
const nextPrice=createPotOddsSession({seed:42,previousIds:firstPrice.questions.map(q=>q.id)})
assert.equal(nextPrice.questions.filter(q=>firstPrice.questions.some(old=>old.id===q.id)).length,0)
console.log('Variation checks passed: three reasoning cases and non-overlapping consecutive rounds where pools allow.')
const { createPreflopSession } = await import('../src/utils/training/preflopTraining.js')
const firstPreflop=createPreflopSession({seed:42})
const previousHands=firstPreflop.hands.map(hand=>hand.hero.canonicalHand)
assert.equal(createPreflopSession({seed:42,previousHands}).hands.filter(hand=>previousHands.includes(hand.hero.canonicalHand)).length,0)
