import { POT_ODDS_DRILL_VERSION } from '../../training/drills/pot-odds-v1.js'
import { POT_ODDS_CATALOG_VERSION, POT_ODDS_QUESTION_CATALOG_BY_ID } from '../../training/drills/pot-odds-catalog-v2.js'

export const POT_ODDS_TRAINING_STORAGE_KEY = 'postsoma_pot_odds_training_v1'

const STORAGE_VERSION = 1
const MAX_RECENT_ANSWERS = 160
export const POT_ODDS_SKILLS = Object.freeze(['buildPot', 'priceCall', 'compare', 'reason', 'variation', 'action'])
const blankMistakes = () => Object.fromEntries(POT_ODDS_SKILLS.map(skill => [skill, []]))

const emptyState = () => ({
  storageVersion: STORAGE_VERSION,
  drillVersion: POT_ODDS_DRILL_VERSION,
  catalogVersion: POT_ODDS_CATALOG_VERSION,
  recentAnswers: [],
  mistakeQuestionIds: [],
  skillMistakes: blankMistakes()
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

    const skillMistakes = Object.fromEntries(POT_ODDS_SKILLS.map(skill => {
      const source = parsed.skillMistakes?.[skill] ?? (skill === 'action' && !parsed.skillMistakes ? parsed.mistakeQuestionIds : [])
      const knownIds = (Array.isArray(source) ? source : []).filter(id => typeof id === 'string' && Object.hasOwn(POT_ODDS_QUESTION_CATALOG_BY_ID, id))
      return [skill, [...new Set(knownIds)]]
    }))
    return {
      skillMistakes,
      storageVersion: STORAGE_VERSION,
      drillVersion: POT_ODDS_DRILL_VERSION,
      catalogVersion: POT_ODDS_CATALOG_VERSION,
      recentAnswers: parsed.recentAnswers.slice(0, MAX_RECENT_ANSWERS),
      mistakeQuestionIds: [...new Set(Object.values(skillMistakes).flat())]
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

export const recordPotOddsSkillAnswer = (question, skill, isCorrect, details = {}) => {
  if (!POT_ODDS_SKILLS.includes(skill) || typeof isCorrect !== 'boolean' || !Object.hasOwn(POT_ODDS_QUESTION_CATALOG_BY_ID, question.id)) throw new Error('Invalid price skill observation')
  const state = loadPotOddsTrainingState()
  const pending = new Set(state.skillMistakes[skill])
  if (isCorrect) pending.delete(question.id)
  else pending.add(question.id)
  const skillMistakes = { ...state.skillMistakes, [skill]: [...pending] }
  const answer = { ...details, questionId: question.id, questionVersion: question.version, skill, isCorrect, isMistake: !isCorrect, answeredAt: new Date().toISOString() }
  const nextState = { ...state, skillMistakes, recentAnswers: [answer, ...state.recentAnswers].slice(0, MAX_RECENT_ANSWERS), mistakeQuestionIds: [...new Set(Object.values(skillMistakes).flat())] }
  persist(nextState)
  return nextState
}

export const recordPotOddsTrainingAnswer = (question, evaluation) => recordPotOddsSkillAnswer(question, 'action', evaluation.isRecommendedAction, {
  userAction: evaluation.userAction, recommendedAction: evaluation.correctAction, equityEdgePct: evaluation.equityEdgePct
})

export const getPotOddsReviewPriority = (state, skill = null) => {
  const ids = skill ? state.skillMistakes[skill] || [] : state.mistakeQuestionIds
  const weight = id => POT_ODDS_SKILLS.reduce((total, key) => total + (state.skillMistakes[key].includes(id) ? state.skillMistakes[key].length : 0), 0)
  return [...ids].sort((left, right) => weight(right) - weight(left) || left.localeCompare(right))
}
