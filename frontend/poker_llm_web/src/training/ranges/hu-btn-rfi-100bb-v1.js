export const HU_BTN_RFI_RANGE_ID = 'hu-btn-rfi-100bb-v1'
export const HU_BTN_RFI_RANGE_VERSION = 'baseline-v1'

export const HU_BTN_RFI_ASSUMPTIONS = Object.freeze({
  format: 'heads_up',
  position: 'sb_button',
  effectiveStackBb: 100,
  potState: 'unopened',
  openSizeBb: 2.5,
  sourceKind: 'legacy_heuristic_snapshot',
  sourceReference: 'RangeViewerModal.vue:generateSbOpenWeights',
  manualStrategyEdits: false,
  solverOutput: false,
  note: 'A fixed learning baseline derived from the legacy local heuristic. It is not a solver output or the only valid poker strategy.'
})

// Static, auditable snapshot of all 169 hand classes. The grouped form keeps the
// source compact while preserving every hand-to-frequency assignment explicitly.
const SNAPSHOT_GROUPS = Object.freeze([
  {
    hands: 'AA KK QQ JJ TT 99 88 77 66'.split(' '),
    frequencies: [100, 0, 0],
    primaryAction: 'raise',
    handFamily: 'pair',
    classification: 'pair_raise',
    explanationKey: 'pair_raise'
  },
  {
    hands: '55 44 33 22'.split(' '),
    frequencies: [70, 30, 0],
    primaryAction: 'raise',
    handFamily: 'pair',
    classification: 'small_pair_mix',
    explanationKey: 'small_pair_mix'
  },
  {
    hands: (
      'AKs AQs AJs ATs A9s A8s A7s A6s A5s A4s A3s A2s ' +
      'KQs KJs KTs K9s K8s K7s K6s K5s K4s K3s K2s ' +
      'QJs QTs Q9s Q8s Q7s Q6s Q5s Q4s Q3s Q2s ' +
      'JTs J9s J8s J7s J6s J5s J4s J3s J2s ' +
      'T9s T8s T7s T6s T5s T4s T3s ' +
      '98s 97s 96s 95s 87s 86s 85s 76s 75s 74s 65s 64s 54s 53s 43s'
    ).split(' '),
    frequencies: [100, 0, 0],
    primaryAction: 'raise',
    handFamily: 'suited',
    classification: 'suited_raise',
    explanationKey: 'suited_raise'
  },
  {
    hands: 'T2s 94s 93s 92s 84s 83s 82s 73s 72s'.split(' '),
    frequencies: [20, 80, 0],
    primaryAction: 'limp',
    handFamily: 'suited',
    classification: 'suited_limp_heavy_mix',
    explanationKey: 'suited_limp_heavy_mix'
  },
  {
    hands: '63s 62s 52s 42s 32s'.split(' '),
    frequencies: [0, 50, 50],
    primaryAction: 'limp',
    primaryActions: ['limp', 'fold'],
    handFamily: 'suited',
    classification: 'suited_boundary_mix',
    explanationKey: 'suited_boundary_mix'
  },
  {
    hands: (
      'AKo AQo AJo ATo A9o A8o A7o A6o A5o A4o A3o A2o ' +
      'KQo KJo KTo K9o K8o K7o K6o K5o ' +
      'QJo QTo Q9o Q8o JTo J9o J8o T9o T8o 98o'
    ).split(' '),
    frequencies: [100, 0, 0],
    primaryAction: 'raise',
    handFamily: 'offsuit',
    classification: 'offsuit_raise',
    explanationKey: 'offsuit_raise'
  },
  {
    hands: 'K4o K3o K2o'.split(' '),
    frequencies: [0, 80, 20],
    primaryAction: 'limp',
    handFamily: 'offsuit',
    classification: 'offsuit_king_limp_mix',
    explanationKey: 'offsuit_high_card_limp_mix'
  },
  {
    hands: 'Q7o Q6o Q5o'.split(' '),
    frequencies: [0, 70, 30],
    primaryAction: 'limp',
    handFamily: 'offsuit',
    classification: 'offsuit_queen_limp_mix',
    explanationKey: 'offsuit_high_card_limp_mix'
  },
  {
    hands: 'J7o'.split(' '),
    frequencies: [0, 60, 40],
    primaryAction: 'limp',
    handFamily: 'offsuit',
    classification: 'offsuit_jack_limp_mix',
    explanationKey: 'offsuit_high_card_limp_mix'
  },
  {
    hands: 'T7o'.split(' '),
    frequencies: [0, 50, 50],
    primaryAction: 'limp',
    primaryActions: ['limp', 'fold'],
    handFamily: 'offsuit',
    classification: 'offsuit_boundary_mix',
    explanationKey: 'offsuit_boundary_mix'
  },
  {
    hands: (
      '97o 87o J6o T6o 96o 86o 76o J5o T5o 95o 85o 75o 65o ' +
      'Q4o J4o T4o 94o 84o 74o 64o 54o Q3o J3o T3o 93o 83o ' +
      '73o 63o 53o 43o Q2o J2o T2o 92o 82o 72o 62o 52o 42o 32o'
    ).split(' '),
    frequencies: [0, 0, 100],
    primaryAction: 'fold',
    handFamily: 'offsuit',
    classification: 'offsuit_fold',
    explanationKey: 'offsuit_fold'
  }
])

export const HU_169_HAND_MATRIX_ORDER = Object.freeze([
  'AA', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
  'AKo', 'KK', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
  'AQo', 'KQo', 'QQ', 'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
  'AJo', 'KJo', 'QJo', 'JJ', 'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
  'ATo', 'KTo', 'QTo', 'JTo', 'TT', 'T9s', 'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
  'A9o', 'K9o', 'Q9o', 'J9o', 'T9o', '99', '98s', '97s', '96s', '95s', '94s', '93s', '92s',
  'A8o', 'K8o', 'Q8o', 'J8o', 'T8o', '98o', '88', '87s', '86s', '85s', '84s', '83s', '82s',
  'A7o', 'K7o', 'Q7o', 'J7o', 'T7o', '97o', '87o', '77', '76s', '75s', '74s', '73s', '72s',
  'A6o', 'K6o', 'Q6o', 'J6o', 'T6o', '96o', '86o', '76o', '66', '65s', '64s', '63s', '62s',
  'A5o', 'K5o', 'Q5o', 'J5o', 'T5o', '95o', '85o', '75o', '65o', '55', '54s', '53s', '52s',
  'A4o', 'K4o', 'Q4o', 'J4o', 'T4o', '94o', '84o', '74o', '64o', '54o', '44', '43s', '42s',
  'A3o', 'K3o', 'Q3o', 'J3o', 'T3o', '93o', '83o', '73o', '63o', '53o', '43o', '33', '32s',
  'A2o', 'K2o', 'Q2o', 'J2o', 'T2o', '92o', '82o', '72o', '62o', '52o', '42o', '32o', '22'
])

const groupedSnapshot = SNAPSHOT_GROUPS.flatMap((group) => {
  const [raiseFrequency, limpFrequency, foldFrequency] = group.frequencies
  const primaryActions = group.primaryActions || [group.primaryAction]

  return group.hands.map((hand) => ({
    hand,
    raiseFrequency,
    limpFrequency,
    foldFrequency,
    primaryAction: group.primaryAction,
    primaryActions: Object.freeze([...primaryActions]),
    handFamily: group.handFamily,
    classification: group.classification,
    explanationKey: group.explanationKey,
    rangeVersion: HU_BTN_RFI_RANGE_VERSION,
    assumptions: HU_BTN_RFI_ASSUMPTIONS
  }))
})

const snapshotHandCount = new Set(groupedSnapshot.map(({ hand }) => hand)).size
const hasInvalidFrequency = groupedSnapshot.some(({ raiseFrequency, limpFrequency, foldFrequency }) => (
  raiseFrequency + limpFrequency + foldFrequency !== 100
))

if (
  groupedSnapshot.length !== 169 ||
  snapshotHandCount !== 169 ||
  HU_169_HAND_MATRIX_ORDER.length !== 169 ||
  new Set(HU_169_HAND_MATRIX_ORDER).size !== 169 ||
  hasInvalidFrequency
) {
  throw new Error('Invalid hu-btn-rfi-100bb-v1 range snapshot')
}

const groupedSnapshotByHand = Object.fromEntries(
  groupedSnapshot.map((entry) => [entry.hand, entry])
)

const snapshot = HU_169_HAND_MATRIX_ORDER.map((hand, index) => {
  const entry = groupedSnapshotByHand[hand]
  if (!entry) throw new Error(`Missing ${hand} in hu-btn-rfi-100bb-v1 range snapshot`)

  return Object.freeze({
    ...entry,
    matrixPosition: Object.freeze({
      index,
      row: Math.floor(index / 13) + 1,
      column: (index % 13) + 1
    })
  })
})

export const HU_BTN_RFI_100BB_V1 = Object.freeze(snapshot)

export const HU_BTN_RFI_100BB_V1_BY_HAND = Object.freeze(
  Object.fromEntries(HU_BTN_RFI_100BB_V1.map((entry) => [entry.hand, entry]))
)
