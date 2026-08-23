import {
  HU_BTN_RFI_100BB_V1,
  HU_BTN_RFI_100BB_V1_BY_HAND,
  HU_BTN_RFI_ASSUMPTIONS,
  HU_BTN_RFI_RANGE_ID,
  HU_BTN_RFI_RANGE_VERSION
} from '../../training/ranges/hu-btn-rfi-100bb-v1.js'

export const PREFLOP_TRAINING_ACTIONS = Object.freeze([
  Object.freeze({ id: 'raise', label: 'Raise 2.5x', labelZh: '加注 2.5x' }),
  Object.freeze({ id: 'limp', label: 'Limp', labelZh: '跛入' }),
  Object.freeze({ id: 'fold', label: 'Fold', labelZh: '弃牌' })
])

export const PREFLOP_SESSION_HAND_COUNT = 10

const SUITS = Object.freeze([
  Object.freeze({ code: 's', symbol: '♠', name: 'spades', isRed: false }),
  Object.freeze({ code: 'h', symbol: '♥', name: 'hearts', isRed: true }),
  Object.freeze({ code: 'd', symbol: '♦', name: 'diamonds', isRed: true }),
  Object.freeze({ code: 'c', symbol: '♣', name: 'clubs', isRed: false })
])

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

const shuffle = (items, random) => {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

const toCard = (rank, suit) => Object.freeze({
  rank,
  suit: suit.code,
  suitSymbol: suit.symbol,
  suitName: suit.name,
  isRed: suit.isRed,
  label: `${rank}${suit.symbol}`
})

const createHeroCards = (canonicalHand, replayId) => {
  const random = createSeededRandom(replayId)
  const firstRank = canonicalHand[0]
  const secondRank = canonicalHand[1]
  const handType = canonicalHand.length === 2
    ? 'pair'
    : canonicalHand.endsWith('s') ? 'suited' : 'offsuit'

  if (handType === 'suited') {
    const suit = SUITS[Math.floor(random() * SUITS.length)]
    return Object.freeze([toCard(firstRank, suit), toCard(secondRank, suit)])
  }

  const firstSuitIndex = Math.floor(random() * SUITS.length)
  let secondSuitIndex = Math.floor(random() * (SUITS.length - 1))
  if (secondSuitIndex >= firstSuitIndex) secondSuitIndex += 1

  return Object.freeze([
    toCard(firstRank, SUITS[firstSuitIndex]),
    toCard(secondRank, SUITS[secondSuitIndex])
  ])
}

const createTrainingHand = (rangeEntry, seed, index, mode) => {
  const replayId = `${HU_BTN_RFI_RANGE_ID}:${seed}:${index + 1}:${rangeEntry.hand}`

  return Object.freeze({
    id: replayId,
    replayId,
    seed,
    concept: 'preflop_range',
    sessionMode: mode,
    scenario: Object.freeze({
      id: HU_BTN_RFI_RANGE_ID,
      format: 'heads_up',
      position: 'sb_button',
      effectiveStackBb: 100,
      potState: 'unopened',
      openSizeBb: 2.5,
      rangeVersion: HU_BTN_RFI_RANGE_VERSION,
      assumptions: HU_BTN_RFI_ASSUMPTIONS
    }),
    hero: Object.freeze({
      canonicalHand: rangeEntry.hand,
      cards: createHeroCards(rangeEntry.hand, replayId)
    }),
    actions: PREFLOP_TRAINING_ACTIONS,
    baseline: Object.freeze({
      primaryAction: rangeEntry.primaryAction,
      primaryActions: rangeEntry.primaryActions,
      frequencies: Object.freeze({
        raise: rangeEntry.raiseFrequency,
        limp: rangeEntry.limpFrequency,
        fold: rangeEntry.foldFrequency
      }),
      handFamily: rangeEntry.handFamily,
      classification: rangeEntry.classification,
      matrixPosition: rangeEntry.matrixPosition,
      rangeVersion: rangeEntry.rangeVersion
    }),
    explanationKey: rangeEntry.explanationKey
  })
}

const resolvePool = (handPool) => {
  if (!handPool?.length) return HU_BTN_RFI_100BB_V1

  return [...new Set(handPool)]
    .map((hand) => HU_BTN_RFI_100BB_V1_BY_HAND[hand])
    .filter(Boolean)
}

export const createPreflopSession = ({
  seed = Date.now(),
  mode = 'standard',
  handPool = null,
  count = PREFLOP_SESSION_HAND_COUNT
} = {}) => {
  const pool = resolvePool(handPool)
  if (!pool.length) throw new Error('Cannot create a preflop session from an empty hand pool')

  const normalizedSeed = hashSeed(seed)
  const random = createSeededRandom(`${normalizedSeed}:${mode}`)
  const selected = []

  while (selected.length < count) {
    selected.push(...shuffle(pool, random).slice(0, count - selected.length))
  }

  return Object.freeze({
    id: `${HU_BTN_RFI_RANGE_ID}:${normalizedSeed}:${mode}`,
    seed: normalizedSeed,
    mode,
    rangeVersion: HU_BTN_RFI_RANGE_VERSION,
    hands: Object.freeze(selected.map((entry, index) => (
      createTrainingHand(entry, normalizedSeed, index, mode)
    )))
  })
}

export const evaluatePreflopAction = (trainingHand, action) => {
  if (!PREFLOP_TRAINING_ACTIONS.some(({ id }) => id === action)) {
    throw new Error(`Unsupported preflop action: ${action}`)
  }

  const frequencies = trainingHand.baseline.frequencies
  const chosenFrequency = frequencies[action]
  const highestFrequency = Math.max(...Object.values(frequencies))
  const followsPrimaryTendency = chosenFrequency === highestFrequency
  const isInMix = chosenFrequency > 0
  const alignment = followsPrimaryTendency
    ? 'primary_tendency'
    : isInMix ? 'acceptable_mix' : 'baseline_deviation'

  return Object.freeze({
    action,
    chosenFrequency,
    highestFrequency,
    followsPrimaryTendency,
    isInMix,
    alignment,
    isMistakeCandidate: !followsPrimaryTendency
  })
}

export const getActionLabel = (action) => (
  PREFLOP_TRAINING_ACTIONS.find(({ id }) => id === action)?.label || action
)
