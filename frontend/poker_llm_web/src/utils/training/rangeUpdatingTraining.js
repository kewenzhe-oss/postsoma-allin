import { variedSelection } from './sessionVariation.js'
import { RANGE_UPDATING_VERSION, RANGE_UPDATING_QUESTIONS } from '../../training/drills/range-updating-v1.js'
export const RANGE_UPDATING_STORAGE_KEY = 'postsoma_range_updating_v1'
const knownIds = new Set(RANGE_UPDATING_QUESTIONS.map(question => question.id))
const empty = () => ({ version: RANGE_UPDATING_VERSION, mistakes: [], answers: [] })
export function loadRangeUpdatingState() {
  try {
    if (typeof localStorage === 'undefined') return empty()
    const value = JSON.parse(localStorage.getItem(RANGE_UPDATING_STORAGE_KEY) || 'null')
    if (value?.version !== RANGE_UPDATING_VERSION || !Array.isArray(value.mistakes) || !Array.isArray(value.answers)) return empty()
    return { version: RANGE_UPDATING_VERSION, mistakes: [...new Set(value.mistakes.filter(id => knownIds.has(id)))], answers: value.answers.filter(answer => knownIds.has(answer?.id)).slice(0, 80) }
  } catch { return empty() }
}
export function recordRangeUpdatingAnswer({ id, selectedId }) {
  const question = RANGE_UPDATING_QUESTIONS.find(question => question.id === id)
  if (!question || !question.options.some(option => option.id === selectedId)) throw new Error('Invalid range updating answer')
  const state = loadRangeUpdatingState()
  const isCorrect = selectedId === question.correctId
  const mistakes = new Set(state.mistakes)
  if (isCorrect) mistakes.delete(id)
  else mistakes.add(id)
  const next = { ...state, mistakes: [...mistakes], answers: [{ id, selectedId, isCorrect, answeredAt: new Date().toISOString() }, ...state.answers].slice(0, 80) }
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(RANGE_UPDATING_STORAGE_KEY, JSON.stringify(next)) } catch { /* Practice works without storage. */ }
  return next
}
export function createRangeUpdatingSession({ seed, ids = null, previousIds = [] }) {
  let value = [...String(seed)].reduce((sum, char) => Math.imul(sum, 31) + char.charCodeAt(0), 17) >>> 0
  const shuffle = items => {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
      value = (Math.imul(value, 1664525) + 1013904223) >>> 0
      const j = value % (i + 1)
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }
  if (ids) return shuffle(RANGE_UPDATING_QUESTIONS.filter(question => ids.includes(question.id))).slice(0, 6)
  return shuffle(['raise', 'call', 'check'].flatMap(action => variedSelection(RANGE_UPDATING_QUESTIONS.filter(question => question.action === action),2, String(seed)+action,previousIds)))
}
