import { L3_versioned_training_baseline } from './evidence-levels.js'
import {
  SCENARIO_01_PACK_ID,
  SCENARIO_01_SCENARIOS,
  SCENARIO_LIBRARY_VERSION
} from './scenario-adapters.js'

export { SCENARIO_LIBRARY_VERSION }

export const SCENARIO_01_HU_BTN_FIRST_IN_100BB_V1 = Object.freeze({
  id: SCENARIO_01_PACK_ID,
  version: SCENARIO_LIBRARY_VERSION,
  admissionStatus: 'admitted',
  title: Object.freeze({
    en: 'Scenario 01 · Heads-up Button First-In · 100 BB',
    zh: '情境 01 · 单挑 Button 首入池 · 100 BB'
  }),
  conceptTags: Object.freeze(['preflop_range', 'price']),
  format: 'heads_up_cash',
  playerCount: 2,
  heroPosition: 'sb_button',
  effectiveStackBB: 100,
  priorAction: Object.freeze({
    state: 'unopened',
    sequence: Object.freeze([])
  }),
  openSizeBB: 2.5,
  rakeAssumption: Object.freeze({
    model: 'unknown',
    percentage: null,
    capBB: null
  }),
  source: Object.freeze({
    type: 'internal_heuristic',
    toolOrPublisher: 'POSTSOMA · ALLIN',
    license: 'project-owned',
    attribution: null,
    sourceUrlOrMethod: 'hu-btn-rfi-100bb-v1 snapshot method',
    generatedAt: null,
    reviewedAt: null
  }),
  evidenceLevel: L3_versioned_training_baseline,
  limitations: Object.freeze([
    'Not solver-calibrated',
    'Not applicable to 6-max',
    'Not applicable to MTT',
    'Not applicable to BB defend',
    'Not applicable to different stack, rake, ante, or open-size assumptions',
    'Does not generate or represent a postflop continuation'
  ]),
  scenarios: SCENARIO_01_SCENARIOS
})

export const SCENARIO_LIBRARY_V1 = Object.freeze([
  SCENARIO_01_HU_BTN_FIRST_IN_100BB_V1
])

export const SCENARIO_LIBRARY_V1_BY_ID = Object.freeze(
  Object.fromEntries(SCENARIO_LIBRARY_V1.map((pack) => [pack.id, pack]))
)
