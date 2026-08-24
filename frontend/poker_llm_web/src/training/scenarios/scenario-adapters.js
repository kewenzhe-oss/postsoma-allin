import {
  HU_BTN_RFI_100BB_V1,
  HU_BTN_RFI_RANGE_ID,
  HU_BTN_RFI_RANGE_VERSION
} from '../ranges/hu-btn-rfi-100bb-v1.js'
import {
  POT_ODDS_DRILL_VERSION,
  POT_ODDS_QUESTIONS_V1
} from '../drills/pot-odds-v1.js'
import {
  L1_math_fact,
  L3_versioned_training_baseline
} from './evidence-levels.js'

export const SCENARIO_01_PACK_ID = 'scenario-01-hu-btn-first-in-100bb-v1'
export const SCENARIO_LIBRARY_VERSION = 'scenario-library-v1'
export const SCENARIO_01_VERSION = 'scenario-01-v1'
export const SCENARIO_NODE_VERSION = 'scenario-node-v1'

export const PREFLOP_SCENARIO_ACTIONS = Object.freeze(['raise', 'limp', 'fold'])
export const PRICE_BRIDGE_ACTIONS = Object.freeze(['Fold', 'Call'])

const frequencyForAction = (entry, actionId) => ({
  raise: entry.raiseFrequency,
  limp: entry.limpFrequency,
  fold: entry.foldFrequency
})[actionId]

export const classifyPreflopFrequencyProfile = (
  entry,
  nearTopFrequencyGapPct = 5
) => {
  const ranked = PREFLOP_SCENARIO_ACTIONS
    .map((actionId) => ({ actionId, frequency: frequencyForAction(entry, actionId) }))
    .sort((left, right) => right.frequency - left.frequency || left.actionId.localeCompare(right.actionId))
  const positiveActions = ranked.filter(({ frequency }) => frequency > 0)
  const topFrequency = ranked[0].frequency
  const secondFrequency = ranked[1].frequency
  const topActions = ranked
    .filter(({ frequency }) => Math.abs(frequency - topFrequency) <= Number.EPSILON)
    .map(({ actionId }) => actionId)

  if (
    topActions.length > 1 ||
    (positiveActions.length > 1 && topFrequency - secondFrequency <= nearTopFrequencyGapPct)
  ) {
    return 'boundary'
  }

  if (positiveActions.length > 1 || topFrequency < 100) return 'mixed_frequency'
  return 'core'
}

export const evaluatePreflopFrequencyAction = ({ node, actionId }) => {
  if (!node || node.truth?.kind !== 'strategy_frequency') {
    throw new Error('A strategy_frequency node is required')
  }
  if (!PREFLOP_SCENARIO_ACTIONS.includes(actionId)) {
    throw new Error(`Unsupported preflop scenario action: ${actionId}`)
  }

  const entry = node.truth.rangeEntry
  const selectedFrequency = frequencyForAction(entry, actionId)
  const frequencies = PREFLOP_SCENARIO_ACTIONS.map((candidateAction) => ({
    actionId: candidateAction,
    frequency: frequencyForAction(entry, candidateAction)
  }))
  const highestFrequency = Math.max(...frequencies.map(({ frequency }) => frequency))
  const highestActions = frequencies
    .filter(({ frequency }) => Math.abs(frequency - highestFrequency) <= Number.EPSILON)
    .map(({ actionId: candidateAction }) => candidateAction)

  let evaluationResult = 'off_range'
  if (selectedFrequency > 0 && highestActions.length > 1 && highestActions.includes(actionId)) {
    evaluationResult = 'boundary_tie'
  } else if (selectedFrequency > 0 && highestActions.includes(actionId)) {
    evaluationResult = 'primary_alignment'
  } else if (selectedFrequency > 0) {
    evaluationResult = 'acceptable_mix'
  }

  return Object.freeze({
    evaluationResult,
    actionId,
    selectedFrequency,
    highestFrequency,
    primaryActions: entry.primaryActions,
    isErrorCandidate: evaluationResult === 'off_range',
    isBoundaryCandidate: evaluationResult === 'acceptable_mix' || evaluationResult === 'boundary_tie'
  })
}

const createReplayKey = ({ scenarioId, nodeId }) => (
  `${SCENARIO_01_PACK_ID}@${SCENARIO_LIBRARY_VERSION}` +
  `/${scenarioId}@${SCENARIO_01_VERSION}` +
  `/${nodeId}@${SCENARIO_NODE_VERSION}`
)

const createPreflopNode = ({ entry, scenarioId, priceNodeId }) => {
  const nodeId = `${scenarioId}:preflop-decision`
  const createTransition = (actionId) => Object.freeze({
    actionId,
    type: 'optional_goto',
    targetNodeId: priceNodeId,
    semantic: actionId === 'fold'
      ? 'counterfactual_optional_bridge'
      : 'independent_concept_bridge',
    revealFeedbackBeforeTransition: true,
    requiresUserInitiation: true,
    continuationClaim: false
  })

  return Object.freeze({
    id: nodeId,
    version: SCENARIO_NODE_VERSION,
    replayKey: createReplayKey({ scenarioId, nodeId }),
    nodeType: 'hero_decision',
    street: 'preflop',
    trainingGoal: 'preflop_range_tendency',
    visibleInformation: Object.freeze({
      canonicalHand: entry.hand,
      heroPosition: 'sb_button',
      effectiveStackBB: 100,
      priorAction: 'unopened',
      openSizeBB: 2.5
    }),
    actions: Object.freeze(PREFLOP_SCENARIO_ACTIONS.map((actionId) => Object.freeze({
      id: actionId,
      frequency: frequencyForAction(entry, actionId)
    }))),
    truth: Object.freeze({
      kind: 'strategy_frequency',
      evidenceLevel: L3_versioned_training_baseline,
      sourceId: HU_BTN_RFI_RANGE_ID,
      sourceVersion: HU_BTN_RFI_RANGE_VERSION,
      rangeEntry: entry,
      primaryAction: entry.primaryAction,
      primaryActions: entry.primaryActions,
      explanationKey: entry.explanationKey
    }),
    difficultyOrBoundaryTag: classifyPreflopFrequencyProfile(entry),
    applicability: Object.freeze({
      format: 'heads_up_cash',
      heroPosition: 'sb_button',
      effectiveStackBB: 100,
      priorAction: 'unopened',
      openSizeBB: 2.5
    }),
    limitations: Object.freeze([
      'Scores alignment with baseline-v1, not universal poker correctness',
      'Does not represent a postflop continuation'
    ]),
    transitions: Object.freeze(PREFLOP_SCENARIO_ACTIONS.map(createTransition))
  })
}

const createPriceBridgeNode = ({ question, scenarioId }) => {
  const nodeId = `${scenarioId}:price-bridge`
  return Object.freeze({
    id: nodeId,
    version: SCENARIO_NODE_VERSION,
    replayKey: createReplayKey({ scenarioId, nodeId }),
    nodeType: 'hero_decision',
    street: 'independent_math_spot',
    trainingGoal: 'fold_call_price_math',
    semantic: 'independent_concept_bridge',
    visibleInformation: Object.freeze({
      questionId: question.id
    }),
    actions: Object.freeze(PRICE_BRIDGE_ACTIONS.map((actionId) => Object.freeze({ id: actionId }))),
    truth: Object.freeze({
      kind: 'fold_call_math',
      evidenceLevel: L1_math_fact,
      sourceId: POT_ODDS_DRILL_VERSION,
      sourceVersion: POT_ODDS_DRILL_VERSION,
      questionId: question.id,
      question
    }),
    applicability: Object.freeze({
      semantic: 'independent_concept_bridge',
      dependsOnCanonicalHand: false,
      dependsOnOpponentAction: false,
      dependsOnRunout: false
    }),
    limitations: Object.freeze([
      'Independent concept bridge, not a continuation of the preflop decision',
      'Does not infer strategy from Hero hand, opponent range, opponent action, or a runout'
    ]),
    transitions: Object.freeze(PRICE_BRIDGE_ACTIONS.map((actionId) => Object.freeze({
      actionId,
      type: 'complete',
      targetNodeId: null,
      semantic: 'independent_concept_bridge',
      continuationClaim: false
    })))
  })
}

export const adaptScenario01FromCanonicalSources = () => Object.freeze(
  HU_BTN_RFI_100BB_V1.map((entry, index) => {
    const scenarioId = `scenario-01:${entry.hand}`
    const priceQuestion = POT_ODDS_QUESTIONS_V1[index % POT_ODDS_QUESTIONS_V1.length]
    const priceNodeId = `${scenarioId}:price-bridge`
    const preflopNode = createPreflopNode({ entry, scenarioId, priceNodeId })
    const priceNode = createPriceBridgeNode({ question: priceQuestion, scenarioId })

    return Object.freeze({
      id: scenarioId,
      version: SCENARIO_01_VERSION,
      replayId: `${SCENARIO_01_PACK_ID}@${SCENARIO_LIBRARY_VERSION}/${scenarioId}@${SCENARIO_01_VERSION}`,
      sourceVersion: HU_BTN_RFI_RANGE_VERSION,
      canonicalHand: entry.hand,
      conceptTags: Object.freeze(['preflop_range', 'price']),
      heroPosition: 'sb_button',
      nodes: Object.freeze([preflopNode, priceNode])
    })
  })
)

export const SCENARIO_01_SCENARIOS = adaptScenario01FromCanonicalSources()

export const SCENARIO_01_SCENARIOS_BY_ID = Object.freeze(
  Object.fromEntries(SCENARIO_01_SCENARIOS.map((scenario) => [scenario.id, scenario]))
)
