export const POT_ODDS_DRILL_VERSION = 'pot-odds-v1'

export const POT_ODDS_DRILL_ASSUMPTIONS = Object.freeze({
  foldEvBB: 0,
  equityMeaning: 'Hero equity is the probability of winning the final pot after calling.',
  excludes: Object.freeze([
    'rake',
    'implied_odds',
    'reverse_implied_odds',
    'future_betting',
    'range_shifts',
    'split_pot_adjustments'
  ]),
  sunkCostRule: 'Only the incremental Fold/Call decision is evaluated. Chips invested before this decision are not recovered.',
  handResult: null
})

const replayId = (id) => `${POT_ODDS_DRILL_VERSION}:${id}`

const questions = [
  {
    id: 'third-pot-fold-01',
    replayId: replayId('third-pot-fold-01'),
    seed: 1301,
    concept: 'pot_odds_ev',
    version: POT_ODDS_DRILL_VERSION,
    potBeforeBetBB: 60,
    villainBetBB: 20,
    callAmountBB: 20,
    heroEquityPct: 18,
    requiredEquityPct: 20,
    correctAction: 'Fold',
    explanationKey: 'third_pot_below',
    difficulty: 'introductory',
    betScale: '1/3 pot',
    handResult: null
  },
  {
    id: 'third-pot-call-01',
    replayId: replayId('third-pot-call-01'),
    seed: 1302,
    concept: 'pot_odds_ev',
    version: POT_ODDS_DRILL_VERSION,
    potBeforeBetBB: 60,
    villainBetBB: 20,
    callAmountBB: 20,
    heroEquityPct: 25,
    requiredEquityPct: 20,
    correctAction: 'Call',
    explanationKey: 'third_pot_above',
    difficulty: 'introductory',
    betScale: '1/3 pot',
    handResult: null
  },
  {
    id: 'half-pot-fold-01',
    replayId: replayId('half-pot-fold-01'),
    seed: 1501,
    concept: 'pot_odds_ev',
    version: POT_ODDS_DRILL_VERSION,
    potBeforeBetBB: 80,
    villainBetBB: 40,
    callAmountBB: 40,
    heroEquityPct: 21,
    requiredEquityPct: 25,
    correctAction: 'Fold',
    explanationKey: 'half_pot_below',
    difficulty: 'introductory',
    betScale: '1/2 pot',
    handResult: null
  },
  {
    id: 'half-pot-call-01',
    replayId: replayId('half-pot-call-01'),
    seed: 1502,
    concept: 'pot_odds_ev',
    version: POT_ODDS_DRILL_VERSION,
    potBeforeBetBB: 80,
    villainBetBB: 40,
    callAmountBB: 40,
    heroEquityPct: 30,
    requiredEquityPct: 25,
    correctAction: 'Call',
    explanationKey: 'half_pot_above',
    difficulty: 'introductory',
    betScale: '1/2 pot',
    handResult: null
  },
  {
    id: 'two-thirds-pot-fold-01',
    replayId: replayId('two-thirds-pot-fold-01'),
    seed: 1601,
    concept: 'pot_odds_ev',
    version: POT_ODDS_DRILL_VERSION,
    potBeforeBetBB: 90,
    villainBetBB: 60,
    callAmountBB: 60,
    heroEquityPct: 24,
    requiredEquityPct: 28.571428571428573,
    correctAction: 'Fold',
    explanationKey: 'two_thirds_pot_below',
    difficulty: 'standard',
    betScale: '2/3 pot',
    handResult: null
  },
  {
    id: 'two-thirds-pot-call-01',
    replayId: replayId('two-thirds-pot-call-01'),
    seed: 1602,
    concept: 'pot_odds_ev',
    version: POT_ODDS_DRILL_VERSION,
    potBeforeBetBB: 90,
    villainBetBB: 60,
    callAmountBB: 60,
    heroEquityPct: 34,
    requiredEquityPct: 28.571428571428573,
    correctAction: 'Call',
    explanationKey: 'two_thirds_pot_above',
    difficulty: 'standard',
    betScale: '2/3 pot',
    handResult: null
  },
  {
    id: 'pot-size-fold-01',
    replayId: replayId('pot-size-fold-01'),
    seed: 2001,
    concept: 'pot_odds_ev',
    version: POT_ODDS_DRILL_VERSION,
    potBeforeBetBB: 50,
    villainBetBB: 50,
    callAmountBB: 50,
    heroEquityPct: 29,
    requiredEquityPct: 33.33333333333333,
    correctAction: 'Fold',
    explanationKey: 'pot_size_below',
    difficulty: 'standard',
    betScale: 'pot-sized',
    handResult: null
  },
  {
    id: 'pot-size-call-01',
    replayId: replayId('pot-size-call-01'),
    seed: 2002,
    concept: 'pot_odds_ev',
    version: POT_ODDS_DRILL_VERSION,
    potBeforeBetBB: 50,
    villainBetBB: 50,
    callAmountBB: 50,
    heroEquityPct: 39,
    requiredEquityPct: 33.33333333333333,
    correctAction: 'Call',
    explanationKey: 'pot_size_above',
    difficulty: 'standard',
    betScale: 'pot-sized',
    handResult: null
  }
]

export const POT_ODDS_QUESTIONS_V1 = Object.freeze(
  questions.map((question) => Object.freeze({
    ...question,
    assumptions: POT_ODDS_DRILL_ASSUMPTIONS
  }))
)

export const POT_ODDS_QUESTIONS_V1_BY_ID = Object.freeze(
  Object.fromEntries(POT_ODDS_QUESTIONS_V1.map((question) => [question.id, question]))
)

if (
  POT_ODDS_QUESTIONS_V1.length !== 8 ||
  new Set(POT_ODDS_QUESTIONS_V1.map(({ id }) => id)).size !== POT_ODDS_QUESTIONS_V1.length
) {
  throw new Error('Invalid pot-odds-v1 question catalog')
}
