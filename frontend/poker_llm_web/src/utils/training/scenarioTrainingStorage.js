import { USER_OBSERVATION_RECORD_TYPE } from '../../training/scenarios/evidence-levels.js'

export const SCENARIO_TRAINING_STORAGE_KEY = 'postsoma_scenario_library_v1'
export const SCENARIO_TRAINING_SCHEMA_VERSION = 1
export const SCENARIO_TRAINING_MAX_OBSERVATIONS = 200

const createEmptyRecord = () => ({
  schemaVersion: SCENARIO_TRAINING_SCHEMA_VERSION,
  observations: []
})

const resolveStorage = () => {
  try {
    return typeof globalThis !== 'undefined' && globalThis.localStorage
      ? globalThis.localStorage
      : null
  } catch {
    return null
  }
}

const isValidObservation = (observation) => (
  observation &&
  observation.recordType === USER_OBSERVATION_RECORD_TYPE &&
  typeof observation.replayId === 'string' &&
  typeof observation.scenarioId === 'string' &&
  typeof observation.scenarioVersion === 'string' &&
  typeof observation.nodeId === 'string' &&
  typeof observation.sourceVersion === 'string' &&
  typeof observation.userAction === 'string' &&
  typeof observation.evaluationResult === 'string' &&
  Number.isFinite(new Date(observation.answeredAt).getTime())
)

const sanitizeObservation = (observation) => ({
  recordType: USER_OBSERVATION_RECORD_TYPE,
  replayId: observation.replayId,
  scenarioId: observation.scenarioId,
  scenarioVersion: observation.scenarioVersion,
  nodeId: observation.nodeId,
  sourceVersion: observation.sourceVersion,
  userAction: observation.userAction,
  evaluationResult: observation.evaluationResult,
  answeredAt: new Date(observation.answeredAt).toISOString()
})

const sanitizeRecord = (record) => {
  if (
    !record ||
    record.schemaVersion !== SCENARIO_TRAINING_SCHEMA_VERSION ||
    !Array.isArray(record.observations)
  ) {
    return createEmptyRecord()
  }

  return {
    schemaVersion: SCENARIO_TRAINING_SCHEMA_VERSION,
    observations: record.observations
      .filter(isValidObservation)
      .map(sanitizeObservation)
      .sort((left, right) => (
        new Date(right.answeredAt).getTime() - new Date(left.answeredAt).getTime() ||
        left.replayId.localeCompare(right.replayId)
      ))
      .slice(0, SCENARIO_TRAINING_MAX_OBSERVATIONS)
  }
}

export const loadScenarioTrainingRecord = () => {
  const storage = resolveStorage()
  if (!storage) return createEmptyRecord()

  try {
    const raw = storage.getItem(SCENARIO_TRAINING_STORAGE_KEY)
    if (!raw) return createEmptyRecord()
    return sanitizeRecord(JSON.parse(raw))
  } catch {
    return createEmptyRecord()
  }
}

export const saveScenarioTrainingRecord = (record) => {
  const safeRecord = sanitizeRecord(record)
  const storage = resolveStorage()
  if (!storage) return false

  try {
    storage.setItem(SCENARIO_TRAINING_STORAGE_KEY, JSON.stringify(safeRecord))
    return true
  } catch {
    return false
  }
}

export const appendScenarioObservation = (observation) => {
  const current = loadScenarioTrainingRecord()
  if (!isValidObservation(observation)) return current

  const next = sanitizeRecord({
    schemaVersion: SCENARIO_TRAINING_SCHEMA_VERSION,
    observations: [sanitizeObservation(observation), ...current.observations]
  })
  saveScenarioTrainingRecord(next)
  return next
}

export const getRecentScenarioObservations = (record, { limit = 20 } = {}) => {
  if (!Number.isInteger(limit) || limit < 0) throw new RangeError('limit must be a non-negative integer')
  return sanitizeRecord(record).observations.slice(0, limit)
}
