import {
  POT_ODDS_DRILL_VERSION,
  POT_ODDS_QUESTIONS_V1,
  POT_ODDS_QUESTIONS_V1_BY_ID
} from '../../training/drills/pot-odds-v1.js'

export const FOLD_CALL_ACTIONS = Object.freeze([
  Object.freeze({ id: 'Fold', label: 'Fold', labelZh: '弃牌' }),
  Object.freeze({ id: 'Call', label: 'Call', labelZh: '跟注' })
])

const BREAK_EVEN_EPSILON = 1e-9

const requireFiniteNonNegative = (value, name) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite non-negative number`)
  }
}

const requireEquity = (value) => {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new RangeError('heroEquityPct must be between 0 and 100')
  }
}

export const calculateFinalPot = (potBeforeBetBB, villainBetBB, callAmountBB) => {
  requireFiniteNonNegative(potBeforeBetBB, 'potBeforeBetBB')
  requireFiniteNonNegative(villainBetBB, 'villainBetBB')
  requireFiniteNonNegative(callAmountBB, 'callAmountBB')
  return potBeforeBetBB + villainBetBB + callAmountBB
}

export const calculateRequiredEquity = (potBeforeBetBB, villainBetBB, callAmountBB) => {
  const finalPotBB = calculateFinalPot(potBeforeBetBB, villainBetBB, callAmountBB)
  if (finalPotBB <= 0) throw new RangeError('finalPotBB must be greater than zero')
  return (callAmountBB / finalPotBB) * 100
}

export const calculateEquityEdge = (heroEquityPct, requiredEquityPct) => {
  requireEquity(heroEquityPct)
  requireEquity(requiredEquityPct)
  return heroEquityPct - requiredEquityPct
}

export const calculateCallEv = (finalPotBB, callAmountBB, heroEquityPct) => {
  requireFiniteNonNegative(finalPotBB, 'finalPotBB')
  requireFiniteNonNegative(callAmountBB, 'callAmountBB')
  requireEquity(heroEquityPct)
  return (heroEquityPct / 100) * finalPotBB - callAmountBB
}

export const evaluateFoldCallDecision = (input) => {
  const {
    potBeforeBetBB,
    villainBetBB,
    callAmountBB,
    heroEquityPct
  } = input

  const finalPotBB = calculateFinalPot(potBeforeBetBB, villainBetBB, callAmountBB)
  const requiredEquityPct = calculateRequiredEquity(potBeforeBetBB, villainBetBB, callAmountBB)
  const equityEdgePct = calculateEquityEdge(heroEquityPct, requiredEquityPct)
  const callEvBB = calculateCallEv(finalPotBB, callAmountBB, heroEquityPct)
  const isBreakEven = Math.abs(equityEdgePct) <= BREAK_EVEN_EPSILON
  const correctAction = heroEquityPct >= requiredEquityPct ? 'Call' : 'Fold'

  return Object.freeze({
    finalPotBB,
    requiredEquityPct,
    heroEquityPct,
    equityEdgePct,
    callEvBB,
    foldEvBB: 0,
    correctAction,
    isBreakEven,
    handResult: null
  })
}

export const evaluatePotOddsAnswer = (question, userAction) => {
  if (!FOLD_CALL_ACTIONS.some(({ id }) => id === userAction)) {
    throw new Error(`Unsupported Fold/Call action: ${userAction}`)
  }

  const truth = evaluateFoldCallDecision(question)
  const isRecommendedAction = userAction === truth.correctAction

  return Object.freeze({
    ...truth,
    userAction,
    isRecommendedAction,
    decisionQuality: isRecommendedAction ? 'aligned' : 'review'
  })
}

const hashSeed = (value) => {
  const text = String(value)
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const createSeededRandom = (seed) => {
  let state = hashSeed(seed)
  return () => {
    state += 0x6D2B79F5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

const shuffle = (items, random) => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

const resolveQuestionPool = (questionIds) => {
  if (!questionIds?.length) return POT_ODDS_QUESTIONS_V1
  return [...new Set(questionIds)]
    .map((id) => POT_ODDS_QUESTIONS_V1_BY_ID[id])
    .filter(Boolean)
}

export const createPotOddsSession = ({ seed = Date.now(), mode = 'standard', questionIds = null } = {}) => {
  const pool = resolveQuestionPool(questionIds)
  if (!pool.length) throw new Error('Cannot create a Pot Odds session from an empty question pool')

  const normalizedSeed = hashSeed(seed)
  const random = createSeededRandom(`${normalizedSeed}:${mode}`)

  return Object.freeze({
    id: `${POT_ODDS_DRILL_VERSION}:${normalizedSeed}:${mode}`,
    seed: normalizedSeed,
    mode,
    version: POT_ODDS_DRILL_VERSION,
    questions: Object.freeze(shuffle(pool, random))
  })
}

export const assertPotOddsQuestionCatalog = () => {
  for (const question of POT_ODDS_QUESTIONS_V1) {
    const truth = evaluateFoldCallDecision(question)
    if (Math.abs(truth.requiredEquityPct - question.requiredEquityPct) > BREAK_EVEN_EPSILON) {
      throw new Error(`Required equity mismatch for ${question.id}`)
    }
    if (truth.correctAction !== question.correctAction) {
      throw new Error(`Correct action mismatch for ${question.id}`)
    }
    if (truth.handResult !== null || question.handResult !== null) {
      throw new Error(`Hand result must stay null for ${question.id}`)
    }
  }
  return true
}
