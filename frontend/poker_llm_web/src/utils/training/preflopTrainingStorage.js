import { HU_BTN_RFI_RANGE_VERSION, HU_BTN_RFI_100BB_V1_BY_HAND } from '../../training/ranges/hu-btn-rfi-100bb-v1.js'

export const PREFLOP_TRAINING_STORAGE_KEY = 'postsoma_preflop_training_v1'

const STORAGE_VERSION = 1
const MAX_RECENT_ANSWERS = 40

const emptyState = () => ({
  storageVersion: STORAGE_VERSION,
  rangeVersion: HU_BTN_RFI_RANGE_VERSION,
  recentAnswers: [],
  mistakeHands: [],
  skillMistakes: { action: [], reason: [], variation: [] }
})

export const loadPreflopTrainingState = () => {
  if (typeof localStorage === 'undefined') return emptyState()

  try {
    const parsed = JSON.parse(localStorage.getItem(PREFLOP_TRAINING_STORAGE_KEY) || 'null')
    if (
      parsed?.storageVersion !== STORAGE_VERSION ||
      parsed?.rangeVersion !== HU_BTN_RFI_RANGE_VERSION ||
      !Array.isArray(parsed.recentAnswers) ||
      !Array.isArray(parsed.mistakeHands)
    ) {
      return emptyState()
    }

    const skillMistakes = Object.fromEntries(['action', 'reason', 'variation'].map(skill => {
      const source = parsed.skillMistakes?.[skill] ?? (skill === 'action' && !parsed.skillMistakes ? parsed.mistakeHands : [])
      return [skill, [...new Set((Array.isArray(source) ? source : []).filter(hand => typeof hand === 'string' && Object.hasOwn(HU_BTN_RFI_100BB_V1_BY_HAND, hand)))]]
    }))
    return {
      skillMistakes,
      storageVersion: STORAGE_VERSION,
      rangeVersion: HU_BTN_RFI_RANGE_VERSION,
      recentAnswers: parsed.recentAnswers.slice(0, MAX_RECENT_ANSWERS),
      mistakeHands: [...new Set(Object.values(skillMistakes).flat())]
    }
  } catch {
    return emptyState()
  }
}

const persist = (state) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(PREFLOP_TRAINING_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Training remains usable when storage is blocked or full.
  }
}

export const recordPreflopTrainingAnswer = (trainingHand, evaluation) => {
  const state = loadPreflopTrainingState()
  const canonicalHand = trainingHand.hero.canonicalHand
  const mistakeHands = new Set(state.skillMistakes.action)

  if (evaluation.isMistakeCandidate) {
    mistakeHands.add(canonicalHand)
  } else {
    mistakeHands.delete(canonicalHand)
  }

  const answer = {
    replayId: trainingHand.replayId,
    hand: canonicalHand,
    userAction: evaluation.action,
    userActionFrequency: evaluation.chosenFrequency,
    baselinePrimaryAction: trainingHand.baseline.primaryAction,
    followsPrimaryTendency: evaluation.followsPrimaryTendency,
    alignment: evaluation.alignment,
    classification: trainingHand.baseline.classification,
    answeredAt: new Date().toISOString()
  }

  const nextState = {
    storageVersion: STORAGE_VERSION,
    rangeVersion: HU_BTN_RFI_RANGE_VERSION,
    skillMistakes: { ...state.skillMistakes, action: [...mistakeHands] },
    recentAnswers: [answer, ...state.recentAnswers].slice(0, MAX_RECENT_ANSWERS),
    mistakeHands: [...new Set([...mistakeHands, ...state.skillMistakes.reason, ...state.skillMistakes.variation])]
  }

  persist(nextState)
  return nextState
}

export const recordPreflopReasoningAnswer = (trainingHand, { id: skill, isCorrect, selectedId }) => {
  const hand = trainingHand.hero.canonicalHand
  if (!['reason', 'variation'].includes(skill) || typeof isCorrect !== 'boolean' || !Object.hasOwn(HU_BTN_RFI_100BB_V1_BY_HAND, hand)) throw new Error('Invalid preflop reasoning observation')
  const state = loadPreflopTrainingState()
  const pending = new Set(state.skillMistakes[skill])
  if (isCorrect) pending.delete(hand)
  else pending.add(hand)
  const skillMistakes = { ...state.skillMistakes, [skill]: [...pending] }
  const next = { ...state, skillMistakes, mistakeHands: [...new Set(Object.values(skillMistakes).flat())], recentAnswers: [{ hand, replayId: trainingHand.replayId, skill, selectedId, isCorrect, answeredAt: new Date().toISOString() }, ...state.recentAnswers].slice(0, MAX_RECENT_ANSWERS) }
  persist(next)
  return next
}
