import { POT_ODDS_DRILL_ASSUMPTIONS, POT_ODDS_QUESTIONS_V1 } from './pot-odds-v1.js'

export const POT_ODDS_CATALOG_VERSION = 'pot-odds-catalog-v2'
export const POT_ODDS_SESSION_SIZE = 8
export const POT_ODDS_SESSION_MIX = Object.freeze({ core: 2, small: 1, overbet: 1, break_even: 2, near_threshold: 2 })

// Each row is a reviewed, frozen exercise, not an equity estimate for a real hand.
// id, starting pot, bet/call, assumed equity %, teaching group
const rows = [
  ['fifth-pot-below-02', 50, 10, 12, 'small'],
  ['fifth-pot-above-02', 50, 10, 18, 'small'],
  ['quarter-pot-below-02', 60, 15, 14, 'small'],
  ['quarter-pot-above-02', 60, 15, 20, 'small'],
  ['sixth-pot-below-02', 60, 10, 10, 'small'],
  ['sixth-pot-above-02', 60, 10, 15, 'small'],
  ['125-pot-below-02', 40, 50, 32, 'overbet'],
  ['125-pot-above-02', 40, 50, 40, 'overbet'],
  ['150-pot-below-02', 40, 60, 34, 'overbet'],
  ['150-pot-above-02', 40, 60, 42, 'overbet'],
  ['double-pot-below-02', 30, 60, 36, 'overbet'],
  ['double-pot-above-02', 30, 60, 44, 'overbet'],
  ['sixth-pot-equal-02', 60, 10, 12.5, 'break_even'],
  ['quarter-pot-equal-02', 60, 15, 100 / 6, 'break_even'],
  ['third-pot-equal-02', 60, 20, 20, 'break_even'],
  ['half-pot-equal-02', 80, 40, 25, 'break_even'],
  ['full-pot-equal-02', 50, 50, 100 / 3, 'break_even'],
  ['double-pot-equal-02', 30, 60, 40, 'break_even'],
  ['quarter-pot-near-below-02', 60, 15, 16.6, 'near_threshold'],
  ['quarter-pot-near-above-02', 60, 15, 16.7, 'near_threshold'],
  ['half-pot-near-below-02', 80, 40, 24.9, 'near_threshold'],
  ['half-pot-near-above-02', 80, 40, 25.1, 'near_threshold'],
  ['full-pot-near-below-02', 50, 50, 33.3, 'near_threshold'],
  ['full-pot-near-above-02', 50, 50, 33.4, 'near_threshold']
]

const additions = rows.map(([id, pot, bet, equity, group], index) => {
  const threshold = bet / (pot + 2 * bet) * 100
  const equal = Math.abs(equity - threshold) <= 1e-9
  const callEv = equity / 100 * (pot + 2 * bet) - bet
  const pct = value => Number(value.toFixed(4)).toString()
  const equityDisplay = group === 'break_even' ? `${bet} / ${pot + 2 * bet} × 100%` : `${equity}%`
  return Object.freeze({
    id,
    replayId: `${POT_ODDS_CATALOG_VERSION}:${id}`,
    seed: 3000 + index,
    concept: 'pot_odds_ev',
    version: POT_ODDS_CATALOG_VERSION,
    potBeforeBetBB: pot,
    villainBetBB: bet,
    callAmountBB: bet,
    heroEquityPct: equity,
    heroEquityDisplay: equityDisplay,
    requiredEquityPct: threshold,
    correctAction: equity >= threshold || equal ? 'Call' : 'Fold',
    explanationKey: null,
    explanation: Object.freeze({
      zh: `跟注后底池为 ${pot} + ${bet} + ${bet} = ${pot + 2 * bet} BB；权益门槛约 ${pct(threshold)}%。题设权益为 ${equityDisplay}。${equal ? '跟注与弃牌的增量 EV 都为 0，经济上等价；评分约定将持平映射为 Call。' : `跟注 EV 为 ${pct(callEv)} BB，因此在冻结条件下${callEv > 0 ? '跟注' : '弃牌'}。`} 比较使用未四舍五入的数值；本题不含抽水或未来下注。`,
      en: `Final pot: ${pot} + ${bet} + ${bet} = ${pot + 2 * bet} BB; threshold approximately ${pct(threshold)}%. Stated equity: ${equityDisplay}. ${equal ? 'Call and Fold both have zero incremental EV and are economically equivalent; scoring maps equality to Call.' : `Call EV is ${pct(callEv)} BB, so ${callEv > 0 ? 'Call' : 'Fold'} under the frozen assumptions.`} Compare unrounded values. No rake or future betting.`
    }),
    difficulty: group === 'small' ? 'introductory' : group === 'overbet' ? 'standard' : 'boundary',
    trainingGroup: group,
    betScale: `${bet / pot} pot`,
    assumptions: POT_ODDS_DRILL_ASSUMPTIONS,
    handResult: null
  })
})

export const POT_ODDS_QUESTION_CATALOG = Object.freeze([
  ...POT_ODDS_QUESTIONS_V1.map(question => Object.freeze({ ...question, trainingGroup: 'core' })),
  ...additions
])
export const POT_ODDS_QUESTION_CATALOG_BY_ID = Object.freeze(Object.fromEntries(POT_ODDS_QUESTION_CATALOG.map(question => [question.id, question])))
