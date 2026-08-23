import { HU_BTN_RFI_RANGE_VERSION } from '../../training/ranges/hu-btn-rfi-100bb-v1.js'

export const PREFLOP_TRAINING_STORAGE_KEY = 'postsoma_preflop_training_v1'

const STORAGE_VERSION = 1
const MAX_RECENT_ANSWERS = 40

const emptyState = () => ({
  storageVersion: STORAGE_VERSION,
  rangeVersion: HU_BTN_RFI_RANGE_VERSION,
  recentAnswers: [],
  mistakeHands: []
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

    return {
      storageVersion: STORAGE_VERSION,
      rangeVersion: HU_BTN_RFI_RANGE_VERSION,
      recentAnswers: parsed.recentAnswers.slice(0, MAX_RECENT_ANSWERS),
      mistakeHands: [...new Set(parsed.mistakeHands.filter((hand) => typeof hand === 'string'))]
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
  const mistakeHands = new Set(state.mistakeHands)

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
    recentAnswers: [answer, ...state.recentAnswers].slice(0, MAX_RECENT_ANSWERS),
    mistakeHands: [...mistakeHands]
  }

  persist(nextState)
  return nextState
}
