import assert from 'node:assert/strict'

import {
  EVIDENCE_LEVELS,
  EVIDENCE_LEVELS_BY_ID,
  L1_math_fact,
  L2_enumerated_probability,
  L3_versioned_training_baseline,
  L4_solver_export,
  L5_heuristic_or_ai_explanation,
  L6_hand_result,
  USER_OBSERVATION_RECORD_TYPE
} from '../src/training/scenarios/evidence-levels.js'
import {
  SCENARIO_01_HU_BTN_FIRST_IN_100BB_V1,
  SCENARIO_LIBRARY_V1
} from '../src/training/scenarios/scenario-library-v1.js'
import {
  SCENARIO_01_PACK_ID,
  classifyPreflopFrequencyProfile
} from '../src/training/scenarios/scenario-adapters.js'
import { SCENARIO_SCHEDULER_V1 } from '../src/training/scenarios/scheduler-config-v1.js'
import {
  HU_BTN_RFI_100BB_V1_BY_HAND,
  HU_BTN_RFI_RANGE_VERSION
} from '../src/training/ranges/hu-btn-rfi-100bb-v1.js'
import { PREFLOP_EXPLANATIONS } from '../src/training/explanations/preflop-explanations.js'
import {
  POT_ODDS_DRILL_VERSION,
  POT_ODDS_QUESTIONS_V1_BY_ID
} from '../src/training/drills/pot-odds-v1.js'
import {
  createScenarioSession,
  evaluateScenarioNodeAction,
  getScenarioTransition
} from '../src/utils/training/scenarioScheduler.js'
import {
  SCENARIO_TRAINING_MAX_OBSERVATIONS,
  SCENARIO_TRAINING_SCHEMA_VERSION,
  SCENARIO_TRAINING_STORAGE_KEY,
  appendScenarioObservation,
  getRecentScenarioObservations,
  loadScenarioTrainingRecord,
  saveScenarioTrainingRecord
} from '../src/utils/training/scenarioTrainingStorage.js'

const EVIDENCE_IDS = [
  L1_math_fact,
  L2_enumerated_probability,
  L3_versioned_training_baseline,
  L4_solver_export,
  L5_heuristic_or_ai_explanation,
  L6_hand_result
]

assert.deepEqual(EVIDENCE_IDS, [
  'L1_math_fact',
  'L2_enumerated_probability',
  'L3_versioned_training_baseline',
  'L4_solver_export',
  'L5_heuristic_or_ai_explanation',
  'L6_hand_result'
])
assert.equal(USER_OBSERVATION_RECORD_TYPE, 'user_observation')
assert.equal(EVIDENCE_LEVELS.length, EVIDENCE_IDS.length)
assert.equal(new Set(EVIDENCE_LEVELS.map(({ id }) => id)).size, EVIDENCE_IDS.length)
for (const id of EVIDENCE_IDS) {
  const level = EVIDENCE_LEVELS_BY_ID[id]
  assert.equal(level.id, id)
  assert.equal(typeof level.name.en, 'string')
  assert.equal(typeof level.name.zh, 'string')
  assert.equal(typeof level.definition.en, 'string')
  assert.equal(typeof level.definition.zh, 'string')
  assert.equal(typeof level.canScoreTraining, 'boolean')
  assert.equal(typeof level.uiCaution.en, 'string')
  assert.equal(typeof level.uiCaution.zh, 'string')
  assert.equal(typeof level.prohibitedMisuse.en, 'string')
  assert.equal(typeof level.prohibitedMisuse.zh, 'string')
}
assert.equal(EVIDENCE_LEVELS_BY_ID[L5_heuristic_or_ai_explanation].canScoreTraining, false)
assert.equal(EVIDENCE_LEVELS_BY_ID[L6_hand_result].canScoreTraining, false)

assert.equal(SCENARIO_LIBRARY_V1.length, 1, 'Only one pack may be admitted in v1')
const pack = SCENARIO_01_HU_BTN_FIRST_IN_100BB_V1
assert.equal(pack.id, 'scenario-01-hu-btn-first-in-100bb-v1')
assert.equal(pack.id, SCENARIO_01_PACK_ID)
assert.equal(pack.version, 'scenario-library-v1')
assert.equal(pack.admissionStatus, 'admitted')
assert.equal(pack.source.type, 'internal_heuristic')
assert.equal(pack.source.toolOrPublisher, 'POSTSOMA · ALLIN')
assert.equal(pack.source.license, 'project-owned')
assert.equal(pack.source.attribution, null)
assert.equal(pack.source.sourceUrlOrMethod, 'hu-btn-rfi-100bb-v1 snapshot method')
assert.equal(pack.source.generatedAt, null)
assert.equal(pack.source.reviewedAt, null)
assert.deepEqual(pack.rakeAssumption, { model: 'unknown', percentage: null, capBB: null })
assert.equal(pack.evidenceLevel, L3_versioned_training_baseline)
assert.deepEqual(pack.limitations, [
  'Not solver-calibrated',
  'Not applicable to 6-max',
  'Not applicable to MTT',
  'Not applicable to BB defend',
  'Not applicable to different stack, rake, ante, or open-size assumptions',
  'Does not generate or represent a postflop continuation'
])

assert.equal(pack.scenarios.length, 169)
assert.equal(new Set(pack.scenarios.map(({ id }) => id)).size, 169)
const allNodes = pack.scenarios.flatMap(({ nodes }) => nodes)
assert.equal(allNodes.length, 338)
assert.equal(new Set(allNodes.map(({ id }) => id)).size, allNodes.length)
assert.equal(new Set(allNodes.map(({ replayKey }) => replayKey)).size, allNodes.length)

const frequencyByAction = (entry, actionId) => ({
  raise: entry.raiseFrequency,
  limp: entry.limpFrequency,
  fold: entry.foldFrequency
})[actionId]

for (const scenario of pack.scenarios) {
  assert.equal(scenario.id, `scenario-01:${scenario.canonicalHand}`)
  assert.equal(scenario.nodes.length, 2)
  assert.ok(scenario.nodes.every(({ nodeType }) => nodeType === 'hero_decision'))

  const [preflopNode, priceNode] = scenario.nodes
  assert.equal(preflopNode.id, `${scenario.id}:preflop-decision`)
  assert.equal(priceNode.id, `${scenario.id}:price-bridge`)

  const sourceEntry = HU_BTN_RFI_100BB_V1_BY_HAND[scenario.canonicalHand]
  assert.ok(sourceEntry, `${scenario.canonicalHand} must exist in the canonical snapshot`)
  assert.equal(preflopNode.truth.rangeEntry, sourceEntry, 'Node 1 must retain the canonical object reference')
  assert.equal(preflopNode.truth.kind, 'strategy_frequency')
  assert.equal(preflopNode.truth.evidenceLevel, L3_versioned_training_baseline)
  assert.equal(preflopNode.truth.sourceVersion, HU_BTN_RFI_RANGE_VERSION)
  assert.equal(preflopNode.truth.primaryAction, sourceEntry.primaryAction)
  assert.deepEqual(preflopNode.truth.primaryActions, sourceEntry.primaryActions)
  assert.equal(preflopNode.truth.explanationKey, sourceEntry.explanationKey)
  assert.ok(PREFLOP_EXPLANATIONS[sourceEntry.explanationKey])
  assert.deepEqual(preflopNode.actions.map(({ id }) => id), ['raise', 'limp', 'fold'])
  for (const action of preflopNode.actions) {
    assert.equal(action.frequency, frequencyByAction(sourceEntry, action.id))
  }
  assert.equal(
    preflopNode.actions.reduce((sum, { frequency }) => sum + frequency, 0),
    100
  )
  assert.equal(
    preflopNode.difficultyOrBoundaryTag,
    classifyPreflopFrequencyProfile(sourceEntry, SCENARIO_SCHEDULER_V1.boundaryRules.nearTopFrequencyGapPct)
  )

  const question = POT_ODDS_QUESTIONS_V1_BY_ID[priceNode.truth.questionId]
  assert.ok(question, `${priceNode.truth.questionId} must exist in pot-odds-v1`)
  assert.equal(priceNode.truth.question, question, 'Node 2 must retain the canonical question object reference')
  assert.equal(priceNode.truth.kind, 'fold_call_math')
  assert.equal(priceNode.truth.evidenceLevel, L1_math_fact)
  assert.equal(priceNode.truth.sourceVersion, POT_ODDS_DRILL_VERSION)
  assert.equal(priceNode.semantic, 'independent_concept_bridge')

  const existingNodeIds = new Set(scenario.nodes.map(({ id }) => id))
  for (const transition of preflopNode.transitions) {
    assert.ok(existingNodeIds.has(transition.targetNodeId))
    assert.equal(transition.revealFeedbackBeforeTransition, true)
    assert.equal(transition.requiresUserInitiation, true)
    assert.equal(transition.continuationClaim, false)
    assert.ok(['independent_concept_bridge', 'counterfactual_optional_bridge'].includes(transition.semantic))
  }
  const foldTransition = getScenarioTransition({ node: preflopNode, actionId: 'fold' })
  assert.equal(foldTransition.semantic, 'counterfactual_optional_bridge')
  assert.equal(foldTransition.targetNodeId, priceNode.id)
  for (const transition of priceNode.transitions) {
    assert.equal(transition.type, 'complete')
    assert.equal(transition.targetNodeId, null)
    assert.equal(transition.semantic, 'independent_concept_bridge')
    assert.equal(transition.continuationClaim, false)
  }
}

const forbiddenNodeKeys = new Set([
  'board',
  'turn',
  'river',
  'runout',
  'villainRange',
  'postflopAction',
  'postflopStrategy',
  'cBetStrategy'
])
const assertNoForbiddenNodeKeys = (value, path = 'node', visited = new Set()) => {
  if (!value || typeof value !== 'object' || visited.has(value)) return
  visited.add(value)
  for (const [key, child] of Object.entries(value)) {
    assert.equal(forbiddenNodeKeys.has(key), false, `Forbidden scenario field ${path}.${key}`)
    assertNoForbiddenNodeKeys(child, `${path}.${key}`, visited)
  }
}
allNodes.forEach((node) => assertNoForbiddenNodeKeys(node))

const coreNode = pack.scenarios.find(({ canonicalHand }) => canonicalHand === 'AA').nodes[0]
assert.equal(evaluateScenarioNodeAction({ node: coreNode, actionId: 'raise' }).evaluationResult, 'primary_alignment')
assert.equal(evaluateScenarioNodeAction({ node: coreNode, actionId: 'limp' }).evaluationResult, 'off_range')

const mixedNode = pack.scenarios.find(({ canonicalHand }) => canonicalHand === '55').nodes[0]
assert.equal(evaluateScenarioNodeAction({ node: mixedNode, actionId: 'raise' }).evaluationResult, 'primary_alignment')
assert.equal(evaluateScenarioNodeAction({ node: mixedNode, actionId: 'limp' }).evaluationResult, 'acceptable_mix')
assert.equal(evaluateScenarioNodeAction({ node: mixedNode, actionId: 'fold' }).evaluationResult, 'off_range')

const boundaryNode = pack.scenarios.find(({ canonicalHand }) => canonicalHand === '63s').nodes[0]
assert.equal(evaluateScenarioNodeAction({ node: boundaryNode, actionId: 'limp' }).evaluationResult, 'boundary_tie')
assert.equal(evaluateScenarioNodeAction({ node: boundaryNode, actionId: 'fold' }).evaluationResult, 'boundary_tie')
assert.equal(evaluateScenarioNodeAction({ node: boundaryNode, actionId: 'raise' }).evaluationResult, 'off_range')

const priceNode = pack.scenarios[0].nodes[1]
const mathAligned = evaluateScenarioNodeAction({ node: priceNode, actionId: priceNode.truth.question.correctAction })
assert.equal(mathAligned.evaluationResult, 'math_alignment')
const oppositeMathAction = priceNode.truth.question.correctAction === 'Call' ? 'Fold' : 'Call'
assert.equal(
  evaluateScenarioNodeAction({ node: priceNode, actionId: oppositeMathAction }).evaluationResult,
  'math_review'
)

const now = '2026-08-23T12:00:00.000Z'
const deterministicInput = {
  packId: pack.id,
  seed: 'scenario-check-seed',
  now,
  recentObservations: [],
  targetCount: 10,
  config: SCENARIO_SCHEDULER_V1
}
const sessionA = createScenarioSession(deterministicInput)
const sessionB = createScenarioSession(deterministicInput)
assert.deepEqual(sessionA, sessionB, 'Scheduler output must be completely deterministic')
assert.equal(sessionA.items.length, 10)
assert.equal(new Set(sessionA.items.map(({ scenarioId }) => scenarioId)).size, sessionA.items.length)
assert.equal(
  new Set(sessionA.items.flatMap(({ nodeIds }) => nodeIds)).size,
  sessionA.items.flatMap(({ nodeIds }) => nodeIds).length
)
assert.ok(sessionA.diagnostics.diversityWarnings.some(({ type }) => type === 'minimum_positions_unavailable'))
assert.ok(sessionA.diagnostics.quotaShortfalls.some(({ category }) => category === 'review'))
assert.ok(sessionA.diagnostics.fallbackReasons.includes('configured_mix_unavailable_reallocated'))

const observationFor = ({ scenario, node, result, answeredAt, action = 'fold' }) => ({
  recordType: USER_OBSERVATION_RECORD_TYPE,
  replayId: node.replayKey,
  scenarioId: scenario.id,
  scenarioVersion: scenario.version,
  nodeId: node.id,
  sourceVersion: node.truth.sourceVersion,
  userAction: action,
  evaluationResult: result,
  answeredAt
})

const reviewScenario = pack.scenarios.find(({ canonicalHand }) => canonicalHand === 'AA')
const reviewObservation = observationFor({
  scenario: reviewScenario,
  node: reviewScenario.nodes[0],
  result: 'off_range',
  answeredAt: '2026-08-23T11:00:00.000Z'
})
const reviewOnlyConfig = Object.freeze({
  ...SCENARIO_SCHEDULER_V1,
  mix: Object.freeze({ fresh: 0, review: 1, boundary: 0 })
})
const reviewSession = createScenarioSession({
  packId: pack.id,
  seed: 'review-override',
  now,
  recentObservations: [reviewObservation],
  targetCount: 1,
  config: reviewOnlyConfig
})
assert.equal(reviewSession.items[0].scenarioId, reviewScenario.id)
assert.equal(reviewSession.items[0].selectionReason, 'mistake_review_cooldown_override')
assert.ok(reviewSession.diagnostics.cooldownOverrides.some(
  ({ reason }) => reason === 'mistake_review_cooldown_override'
))

const coolingObservations = pack.scenarios.map((scenario, index) => observationFor({
  scenario,
  node: scenario.nodes[0],
  result: 'primary_alignment',
  answeredAt: new Date(Date.parse(now) - (index + 1) * 60_000).toISOString(),
  action: scenario.nodes[0].truth.primaryAction
}))
const cooledSession = createScenarioSession({
  packId: pack.id,
  seed: 'cooldown-release',
  now,
  recentObservations: coolingObservations,
  targetCount: 3,
  config: SCENARIO_SCHEDULER_V1
})
assert.equal(cooledSession.items.length, 3)
assert.ok(cooledSession.items.every(({ selectionReason }) => selectionReason === 'cooldown_release_oldest_first'))
assert.equal(cooledSession.diagnostics.cooldownOverrides.length, 3)
assert.ok(cooledSession.diagnostics.fallbackReasons.includes('cooldown_released_oldest_first'))

const shortenedSession = createScenarioSession({
  packId: pack.id,
  seed: 'candidate-shortage',
  now,
  recentObservations: [],
  targetCount: 175,
  config: SCENARIO_SCHEDULER_V1
})
assert.equal(shortenedSession.items.length, 169)
assert.equal(new Set(shortenedSession.items.map(({ scenarioId }) => scenarioId)).size, 169)
assert.ok(shortenedSession.diagnostics.fallbackReasons.includes('session_shortened_unique_scenarios_exhausted'))

class MockStorage {
  constructor() {
    this.values = new Map()
    this.failWrites = false
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null
  }

  setItem(key, value) {
    if (this.failWrites) throw new Error('mock quota failure')
    this.values.set(key, String(value))
  }
}

const previousStorage = globalThis.localStorage
try {
  delete globalThis.localStorage
  assert.doesNotThrow(() => loadScenarioTrainingRecord())
  assert.deepEqual(loadScenarioTrainingRecord(), {
    schemaVersion: SCENARIO_TRAINING_SCHEMA_VERSION,
    observations: []
  })

  const mockStorage = new MockStorage()
  globalThis.localStorage = mockStorage
  mockStorage.setItem(SCENARIO_TRAINING_STORAGE_KEY, '{broken-json')
  assert.deepEqual(loadScenarioTrainingRecord().observations, [])
  mockStorage.setItem(SCENARIO_TRAINING_STORAGE_KEY, JSON.stringify({
    schemaVersion: 999,
    observations: [reviewObservation]
  }))
  assert.deepEqual(loadScenarioTrainingRecord().observations, [])

  assert.equal(saveScenarioTrainingRecord({
    schemaVersion: SCENARIO_TRAINING_SCHEMA_VERSION,
    observations: []
  }), true)
  const appended = appendScenarioObservation(reviewObservation)
  assert.equal(appended.observations.length, 1)
  assert.deepEqual(getRecentScenarioObservations(appended, { limit: 1 }), [reviewObservation])

  for (let index = 0; index < SCENARIO_TRAINING_MAX_OBSERVATIONS + 5; index += 1) {
    appendScenarioObservation({
      ...reviewObservation,
      replayId: `${reviewObservation.replayId}:${index}`,
      answeredAt: new Date(Date.parse(now) - index * 1000).toISOString()
    })
  }
  const capped = loadScenarioTrainingRecord()
  assert.equal(capped.observations.length, SCENARIO_TRAINING_MAX_OBSERVATIONS)
  const serialized = JSON.stringify(capped)
  for (const privateField of ['heroCards', 'board', 'aiKey', 'roomToken', 'opponent', 'websocket']) {
    assert.equal(serialized.includes(privateField), false)
  }

  mockStorage.failWrites = true
  assert.equal(saveScenarioTrainingRecord(capped), false)
  assert.doesNotThrow(() => appendScenarioObservation(reviewObservation))
} finally {
  if (previousStorage === undefined) delete globalThis.localStorage
  else globalThis.localStorage = previousStorage
}

console.log(
  'Scenario Library self-check passed: evidence, canonical adapters, two-node boundaries, scoring, deterministic scheduling, cooldown degradation, diversity diagnostics, and safe storage are consistent.'
)
