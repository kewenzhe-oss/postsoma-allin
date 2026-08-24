import { SCENARIO_LIBRARY_V1_BY_ID } from '../../training/scenarios/scenario-library-v1.js'
import { SCENARIO_SCHEDULER_V1 } from '../../training/scenarios/scheduler-config-v1.js'
import { evaluatePreflopFrequencyAction } from '../../training/scenarios/scenario-adapters.js'
import { evaluatePotOddsAnswer } from './potOddsTraining.js'

const CATEGORY_ORDER = Object.freeze(['fresh', 'review', 'boundary'])
const REVIEW_RESULTS = new Set(['off_range', 'math_review'])
const BOUNDARY_RESULTS = new Set(['acceptable_mix', 'boundary_tie'])

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

const deterministicShuffle = (items, seed) => {
  const copy = [...items]
  const random = createSeededRandom(seed)
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

const normalizeNow = (now) => {
  if (now === undefined || now === null) {
    throw new Error('createScenarioSession requires an explicit now value')
  }
  const timestamp = now instanceof Date ? now.getTime() : new Date(now).getTime()
  if (!Number.isFinite(timestamp)) throw new Error('createScenarioSession received an invalid now value')
  return Object.freeze({ timestamp, iso: new Date(timestamp).toISOString() })
}

const normalizeTargetCount = (targetCount, config) => {
  const resolved = targetCount ?? config.sessionSize
  if (!Number.isInteger(resolved) || resolved < 0) {
    throw new RangeError('targetCount must be a non-negative integer')
  }
  return resolved
}

const calculateQuotas = (targetCount, mix) => {
  const totalWeight = CATEGORY_ORDER.reduce((sum, category) => sum + Number(mix[category] || 0), 0)
  if (!(totalWeight > 0)) throw new Error('Scheduler mix must contain a positive weight')

  const rows = CATEGORY_ORDER.map((category, order) => {
    const exact = targetCount * (Number(mix[category] || 0) / totalWeight)
    return { category, order, exact, quota: Math.floor(exact), remainder: exact - Math.floor(exact) }
  })
  let remaining = targetCount - rows.reduce((sum, row) => sum + row.quota, 0)
  const ranked = [...rows].sort((left, right) => (
    right.remainder - left.remainder || left.order - right.order
  ))
  for (let index = 0; index < remaining; index += 1) ranked[index % ranked.length].quota += 1
  return Object.freeze(Object.fromEntries(rows.map(({ category, quota }) => [category, quota])))
}

const normalizeObservations = (recentObservations, nowTimestamp) => (
  (Array.isArray(recentObservations) ? recentObservations : [])
    .map((observation, inputIndex) => ({
      observation,
      inputIndex,
      timestamp: new Date(observation?.answeredAt).getTime()
    }))
    .filter(({ observation, timestamp }) => (
      observation &&
      typeof observation.scenarioId === 'string' &&
      Number.isFinite(timestamp) &&
      timestamp <= nowTimestamp
    ))
    .sort((left, right) => (
      right.timestamp - left.timestamp ||
      left.inputIndex - right.inputIndex ||
      left.observation.scenarioId.localeCompare(right.observation.scenarioId)
    ))
)

const createObservationIndex = ({ observations, nowTimestamp, config }) => {
  const latestByNode = new Map()
  const lastSeenByScenario = new Map()
  const recentScenarioIds = new Set()

  for (const row of observations) {
    const { observation, timestamp } = row
    const nodeKey = `${observation.scenarioId}:${observation.nodeId || ''}`
    if (!latestByNode.has(nodeKey)) latestByNode.set(nodeKey, observation)
    if (!lastSeenByScenario.has(observation.scenarioId)) {
      lastSeenByScenario.set(observation.scenarioId, timestamp)
    }
    if (recentScenarioIds.size < config.cooldown.recentScenarioCount) {
      recentScenarioIds.add(observation.scenarioId)
    }
  }

  const durationMs = config.cooldown.durationHours * 60 * 60 * 1000
  const coolingScenarioIds = new Set(recentScenarioIds)
  for (const [scenarioId, timestamp] of lastSeenByScenario) {
    if (nowTimestamp - timestamp <= durationMs) coolingScenarioIds.add(scenarioId)
  }

  return { latestByNode, lastSeenByScenario, coolingScenarioIds }
}

const scenarioObservationCategory = (scenario, latestByNode) => {
  const latestResults = scenario.nodes
    .map((node) => latestByNode.get(`${scenario.id}:${node.id}`)?.evaluationResult)
    .filter(Boolean)
  if (latestResults.some((result) => REVIEW_RESULTS.has(result))) return 'review'
  if (latestResults.some((result) => BOUNDARY_RESULTS.has(result))) return 'boundary'

  const preflopNode = scenario.nodes.find(({ truth }) => truth.kind === 'strategy_frequency')
  return preflopNode?.difficultyOrBoundaryTag === 'core' ? 'fresh' : 'boundary'
}

const createCandidatePools = ({ pack, observationIndex, seed }) => {
  const pools = { fresh: [], review: [], boundary: [] }
  const cooling = []

  for (const scenario of pack.scenarios) {
    const category = scenarioObservationCategory(scenario, observationIndex.latestByNode)
    const isCooling = observationIndex.coolingScenarioIds.has(scenario.id)
    const candidate = Object.freeze({
      scenario,
      category,
      isCooling,
      lastSeenAt: observationIndex.lastSeenByScenario.get(scenario.id) ?? null
    })

    if (category === 'review') {
      pools.review.push(candidate)
    } else if (isCooling) {
      cooling.push(candidate)
    } else {
      pools[category].push(candidate)
    }
  }

  for (const category of CATEGORY_ORDER) {
    pools[category] = deterministicShuffle(pools[category], `${seed}:${category}`)
  }
  cooling.sort((left, right) => (
    (left.lastSeenAt ?? Number.NEGATIVE_INFINITY) - (right.lastSeenAt ?? Number.NEGATIVE_INFINITY) ||
    left.scenario.id.localeCompare(right.scenario.id)
  ))
  return { pools, cooling }
}

const selectionReasonFor = (candidate, category, fallback = false) => {
  if (category === 'review' && candidate.isCooling) return 'mistake_review_cooldown_override'
  if (fallback) return `quota_reallocation_${category}`
  return category === 'review' ? 'mistake_review' : category
}

const toSessionItem = (candidate, selectionReason) => Object.freeze({
  scenarioId: candidate.scenario.id,
  scenarioVersion: candidate.scenario.version,
  replayId: candidate.scenario.replayId,
  sourceVersion: candidate.scenario.sourceVersion,
  selectionReason,
  nodeIds: Object.freeze(candidate.scenario.nodes.map(({ id }) => id)),
  scenario: candidate.scenario
})

const createDiversityWarnings = ({ items, config, pack }) => {
  const warnings = []
  const selectedConcepts = new Set(items.flatMap(({ scenario }) => scenario.conceptTags || []))
  const selectedPositions = new Set(items.map(({ scenario }) => scenario.heroPosition).filter(Boolean))
  const availableConcepts = new Set(pack.scenarios.flatMap(({ conceptTags }) => conceptTags || []))
  const availablePositions = new Set(pack.scenarios.map(({ heroPosition }) => heroPosition).filter(Boolean))

  if (selectedConcepts.size < config.diversity.minimumConcepts) {
    warnings.push(Object.freeze({
      type: availableConcepts.size < config.diversity.minimumConcepts
        ? 'minimum_concepts_unavailable'
        : 'minimum_concepts_not_met',
      requested: config.diversity.minimumConcepts,
      available: availableConcepts.size,
      scheduled: selectedConcepts.size,
      relaxed: Boolean(config.diversity.relaxWhenUnavailable)
    }))
  }
  if (selectedPositions.size < config.diversity.minimumPositions) {
    warnings.push(Object.freeze({
      type: availablePositions.size < config.diversity.minimumPositions
        ? 'minimum_positions_unavailable'
        : 'minimum_positions_not_met',
      requested: config.diversity.minimumPositions,
      available: availablePositions.size,
      scheduled: selectedPositions.size,
      relaxed: Boolean(config.diversity.relaxWhenUnavailable)
    }))
  }
  return warnings
}

export const evaluateScenarioNodeAction = ({ node, actionId }) => {
  if (!node || node.nodeType !== 'hero_decision') throw new Error('A Hero decision node is required')
  if (node.truth?.kind === 'strategy_frequency') {
    return evaluatePreflopFrequencyAction({ node, actionId })
  }
  if (node.truth?.kind === 'fold_call_math') {
    const result = evaluatePotOddsAnswer(node.truth.question, actionId)
    return Object.freeze({
      ...result,
      evaluationResult: result.isRecommendedAction ? 'math_alignment' : 'math_review',
      isErrorCandidate: !result.isRecommendedAction,
      isBoundaryCandidate: false
    })
  }
  throw new Error(`Unsupported scenario truth kind: ${node.truth?.kind}`)
}

export const getScenarioTransition = ({ node, actionId }) => {
  if (!node || !Array.isArray(node.transitions)) throw new Error('A node with transitions is required')
  const transition = node.transitions.find((candidate) => candidate.actionId === actionId)
  if (!transition) throw new Error(`No transition for action ${actionId}`)
  return transition
}

export const createScenarioSession = ({
  packId,
  seed,
  now,
  recentObservations = [],
  targetCount,
  config = SCENARIO_SCHEDULER_V1
}) => {
  const pack = SCENARIO_LIBRARY_V1_BY_ID[packId]
  if (!pack || pack.admissionStatus !== 'admitted') {
    throw new Error(`Unknown or unadmitted scenario pack: ${packId}`)
  }
  if (seed === undefined || seed === null) throw new Error('createScenarioSession requires an explicit seed')

  const normalizedNow = normalizeNow(now)
  const requestedCount = normalizeTargetCount(targetCount, config)
  const quotas = calculateQuotas(requestedCount, config.mix)
  const observations = normalizeObservations(recentObservations, normalizedNow.timestamp)
  const observationIndex = createObservationIndex({
    observations,
    nowTimestamp: normalizedNow.timestamp,
    config
  })
  const { pools, cooling } = createCandidatePools({ pack, observationIndex, seed })
  const selected = []
  const selectedIds = new Set()
  const quotaShortfalls = []
  const cooldownOverrides = []

  const addCandidate = (candidate, reason) => {
    if (!candidate || selectedIds.has(candidate.scenario.id)) return false
    selectedIds.add(candidate.scenario.id)
    selected.push(toSessionItem(candidate, reason))
    if (reason === 'mistake_review_cooldown_override') {
      cooldownOverrides.push(Object.freeze({
        scenarioId: candidate.scenario.id,
        lastAnsweredAt: candidate.lastSeenAt === null ? null : new Date(candidate.lastSeenAt).toISOString(),
        reason
      }))
    }
    return true
  }

  for (const category of CATEGORY_ORDER) {
    let filled = 0
    for (const candidate of pools[category]) {
      if (filled >= quotas[category]) break
      if (addCandidate(candidate, selectionReasonFor(candidate, category))) filled += 1
    }
    if (filled < quotas[category]) {
      quotaShortfalls.push(Object.freeze({
        category,
        requested: quotas[category],
        scheduledFromCategory: filled,
        shortfall: quotas[category] - filled
      }))
    }
  }

  if (selected.length < requestedCount) {
    for (const category of CATEGORY_ORDER) {
      for (const candidate of pools[category]) {
        if (selected.length >= requestedCount) break
        addCandidate(candidate, selectionReasonFor(candidate, category, true))
      }
      if (selected.length >= requestedCount) break
    }
  }

  if (selected.length < requestedCount) {
    for (const candidate of cooling) {
      if (selected.length >= requestedCount) break
      if (addCandidate(candidate, 'cooldown_release_oldest_first')) {
        cooldownOverrides.push(Object.freeze({
          scenarioId: candidate.scenario.id,
          lastAnsweredAt: candidate.lastSeenAt === null ? null : new Date(candidate.lastSeenAt).toISOString(),
          reason: 'cooldown_release_oldest_first'
        }))
      }
    }
  }

  const diversityWarnings = createDiversityWarnings({ items: selected, config, pack })
  const fallbackReasons = []
  if (quotaShortfalls.length) fallbackReasons.push('configured_mix_unavailable_reallocated')
  if (diversityWarnings.length) fallbackReasons.push('diversity_constraint_relaxed_or_unavailable')
  if (cooldownOverrides.some(({ reason }) => reason === 'cooldown_release_oldest_first')) {
    fallbackReasons.push('cooldown_released_oldest_first')
  }
  if (selected.length < requestedCount) fallbackReasons.push('session_shortened_unique_scenarios_exhausted')

  const sessionId = (
    `${packId}:${config.version}:${hashSeed(`${seed}:${normalizedNow.iso}:${requestedCount}`)}`
  )

  return Object.freeze({
    sessionId,
    seed,
    schedulerVersion: config.version,
    packId,
    items: Object.freeze(selected),
    diagnostics: Object.freeze({
      requestedCount,
      scheduledCount: selected.length,
      quotaShortfalls: Object.freeze(quotaShortfalls),
      cooldownOverrides: Object.freeze(cooldownOverrides),
      diversityWarnings: Object.freeze(diversityWarnings),
      fallbackReasons: Object.freeze(fallbackReasons)
    })
  })
}
