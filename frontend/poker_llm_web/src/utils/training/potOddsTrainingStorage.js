import { POT_ODDS_DRILL_VERSION } from '../../training/drills/pot-odds-v1.js'

export const POT_ODDS_TRAINING_STORAGE_KEY = 'postsoma_pot_odds_training_v1'

const STORAGE_VERSION = 1
const MAX_RECENT_ANSWERS = 40

const emptyState = () => ({
  storageVersion: STORAGE_VERSION,
  drillVersion: POT_ODDS_DRILL_VERSION,
  recentAnswers: [],
  mistakeQuestionIds: []
})

export const loadPotOddsTrainingState = () => {
  if (typeof localStorage === 'undefined') return emptyState()

  try {
    const parsed = JSON.parse(localStorage.getItem(POT_ODDS_TRAINING_STORAGE_KEY) || 'null')
    if (
      parsed?.storageVersion !== STORAGE_VERSION ||
      parsed?.drillVersion !== POT_ODDS_DRILL_VERSION ||
      !Array.isArray(parsed.recentAnswers) ||
      !Array.isArray(parsed.mistakeQuestionIds)
    ) {
      return emptyState()
    }

    return {
      storageVersion: STORAGE_VERSION,
      drillVersion: POT_ODDS_DRILL_VERSION,
      recentAnswers: parsed.recentAnswers.slice(0, MAX_RECENT_ANSWERS),
      mistakeQuestionIds: [...new Set(parsed.mistakeQuestionIds.filter((id) => typeof id === 'string'))]
    }
  } catch {
    return emptyState()
  }
}

const persist = (state) => {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(POT_ODDS_TRAINING_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // The drill remains functional when client storage is blocked or full.
  }
}

export const recordPotOddsTrainingAnswer = (question, evaluation) => {
  const state = loadPotOddsTrainingState()
  const mistakeQuestionIds = new Set(state.mistakeQuestionIds)

  if (evaluation.isRecommendedAction) {
    mistakeQuestionIds.delete(question.id)
  } else {
    mistakeQuestionIds.add(question.id)
  }

  const answer = {
    questionId: question.id,
    userAction: evaluation.userAction,
    recommendedAction: evaluation.correctAction,
    equityEdgePct: evaluation.equityEdgePct,
    answeredAt: new Date().toISOString(),
    isMistake: !evaluation.isRecommendedAction
  }

  const nextState = {
    storageVersion: STORAGE_VERSION,
    drillVersion: POT_ODDS_DRILL_VERSION,
    recentAnswers: [answer, ...state.recentAnswers].slice(0, MAX_RECENT_ANSWERS),
    mistakeQuestionIds: [...mistakeQuestionIds]
  }

  persist(nextState)
  return nextState
}
