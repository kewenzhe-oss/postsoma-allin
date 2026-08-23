import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

import {
  HU_BTN_RFI_100BB_V1,
  HU_BTN_RFI_ASSUMPTIONS,
  HU_169_HAND_MATRIX_ORDER
} from '../src/training/ranges/hu-btn-rfi-100bb-v1.js'
import { PREFLOP_EXPLANATIONS } from '../src/training/explanations/preflop-explanations.js'

const ACTIONS = ['raise', 'limp', 'fold']
const EPSILON = 1e-9

assert.equal(HU_BTN_RFI_100BB_V1.length, 169, 'Snapshot must contain exactly 169 entries')
assert.equal(
  new Set(HU_BTN_RFI_100BB_V1.map(({ hand }) => hand)).size,
  169,
  'Snapshot hand keys must be unique'
)
assert.equal(HU_169_HAND_MATRIX_ORDER.length, 169, 'Matrix order must contain exactly 169 entries')
assert.equal(new Set(HU_169_HAND_MATRIX_ORDER).size, 169, 'Matrix order hand keys must be unique')

HU_BTN_RFI_100BB_V1.forEach((entry, index) => {
  const frequencyValues = [entry.raiseFrequency, entry.limpFrequency, entry.foldFrequency]
  const frequencyTotal = frequencyValues.reduce((sum, value) => sum + value, 0)
  assert.ok(
    Math.abs(frequencyTotal - 100) <= EPSILON,
    `${entry.hand} frequencies must total 100, received ${frequencyTotal}`
  )

  assert.equal(entry.hand, HU_169_HAND_MATRIX_ORDER[index], `Matrix hand mismatch at index ${index}`)
  assert.equal(entry.matrixPosition.index, index, `${entry.hand} matrix index mismatch`)
  assert.equal(entry.matrixPosition.row, Math.floor(index / 13) + 1, `${entry.hand} matrix row mismatch`)
  assert.equal(entry.matrixPosition.column, (index % 13) + 1, `${entry.hand} matrix column mismatch`)

  const highestFrequency = Math.max(...frequencyValues)
  const expectedPrimaryActions = ACTIONS.filter((_, actionIndex) => (
    Math.abs(frequencyValues[actionIndex] - highestFrequency) <= EPSILON
  ))
  assert.ok(
    expectedPrimaryActions.includes(entry.primaryAction),
    `${entry.hand} primaryAction must be one of the highest-frequency actions`
  )
  assert.deepEqual(
    [...entry.primaryActions].sort(),
    [...expectedPrimaryActions].sort(),
    `${entry.hand} primaryActions must include every joint-highest action`
  )
  assert.ok(
    Object.hasOwn(PREFLOP_EXPLANATIONS, entry.explanationKey),
    `${entry.hand} explanationKey ${entry.explanationKey} is missing`
  )
})

assert.deepEqual(
  {
    format: HU_BTN_RFI_ASSUMPTIONS.format,
    position: HU_BTN_RFI_ASSUMPTIONS.position,
    effectiveStackBb: HU_BTN_RFI_ASSUMPTIONS.effectiveStackBb,
    potState: HU_BTN_RFI_ASSUMPTIONS.potState,
    openSizeBb: HU_BTN_RFI_ASSUMPTIONS.openSizeBb,
    solverOutput: HU_BTN_RFI_ASSUMPTIONS.solverOutput
  },
  {
    format: 'heads_up',
    position: 'sb_button',
    effectiveStackBb: 100,
    potState: 'unopened',
    openSizeBb: 2.5,
    solverOutput: false
  },
  'Snapshot assumptions must remain scoped to the baseline-v1 Button RFI scenario'
)

const modalSource = fs.readFileSync(
  new URL('../src/components/tools/RangeViewerModal.vue', import.meta.url),
  'utf8'
)

const extractDeclaration = (name, nextName) => {
  const startToken = `const ${name} =`
  const endToken = `const ${nextName} =`
  const start = modalSource.indexOf(startToken)
  const end = modalSource.indexOf(endToken, start + startToken.length)
  assert.notEqual(start, -1, `Could not find ${name} in RangeViewerModal.vue`)
  assert.notEqual(end, -1, `Could not find the end of ${name} in RangeViewerModal.vue`)
  return modalSource.slice(start, end)
}

const legacyComparisonSource = [
  extractDeclaration('getComboTypeClass', 'getComboFullTypeName'),
  extractDeclaration('ranks', 'getComboMetadata'),
  extractDeclaration('getComboMetadata', 'generateSbOpenWeights'),
  extractDeclaration('generateSbOpenWeights', 'generateBbDefWeights'),
  'globalThis.__generateSbOpenWeights = generateSbOpenWeights'
].join('\n\n')

const legacyContext = {}
vm.runInNewContext(legacyComparisonSource, legacyContext, {
  filename: 'RangeViewerModal.vue#legacy-sb-open-comparison',
  timeout: 1000
})

const parityMismatches = HU_BTN_RFI_100BB_V1.flatMap((entry) => {
  const legacyWeights = legacyContext.__generateSbOpenWeights(entry.hand)
  const snapshotWeights = [entry.raiseFrequency, entry.limpFrequency, entry.foldFrequency]
  return legacyWeights.every((value, index) => Math.abs(value - snapshotWeights[index]) <= EPSILON)
    ? []
    : [{ hand: entry.hand, legacyWeights, snapshotWeights }]
})

assert.deepEqual(
  parityMismatches,
  [],
  `Snapshot drifted from the retained legacy SB-open comparison: ${JSON.stringify(parityMismatches)}`
)

console.log(
  'Preflop range self-check passed: 169 keys, frequencies, matrix coordinates, primary actions, explanations, assumptions, and legacy SB-open parity are consistent.'
)
