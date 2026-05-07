/**
 * cardFormat.js — Frontend card normalization utility
 *
 * The backend (Card.__str__) produces strings like:
 *   "♠A", "♥10", "♦Q", "♣7"
 *   (suit symbol FIRST, then rank string)
 *
 * This helper normalizes any incoming card representation into a stable shape
 * so every component can rely on the same fields without guessing the format.
 *
 * Supported input formats:
 *   "♥A"  "♦10" "♣Q"  "♠7"          ← primary backend format
 *   "Ah"  "Td"  "Ks"  "2c"           ← alternate alphanumeric (rank+suit)
 *   "AH"  "TD"  "KS"  "2C"           ← uppercase alphanumeric
 *   "10H" "10D" "10S" "10C"           ← ten with full value
 *   { suit: "HEARTS", value: 10 }     ← object with enum-style suit
 *   { suit: "H", rank: "A" }          ← object with short suit
 *
 * Output shape:
 * {
 *   rank: "A" | "K" | "Q" | "J" | "10" | "9" | ... | "2",
 *   suit: "hearts" | "diamonds" | "clubs" | "spades",
 *   suitSymbol: "♥" | "♦" | "♣" | "♠",
 *   color: "red" | "black",
 *   code: "AH" | "KD" | "10S" | ...,   ← uppercase rank + suit initial
 *   valid: true | false                 ← false means fallback "?" rendered
 * }
 */

const SUIT_SYMBOL_MAP = {
  '♠': 'spades',
  '♥': 'hearts',
  '♦': 'diamonds',
  '♣': 'clubs',
}

const SUIT_CHAR_MAP = {
  s: 'spades',
  S: 'spades',
  h: 'hearts',
  H: 'hearts',
  d: 'diamonds',
  D: 'diamonds',
  c: 'clubs',
  C: 'clubs',
}

const SUIT_NAME_MAP = {
  SPADES: 'spades',
  HEARTS: 'hearts',
  DIAMONDS: 'diamonds',
  CLUBS: 'clubs',
  SPADE: 'spades',
  HEART: 'hearts',
  DIAMOND: 'diamonds',
  CLUB: 'clubs',
}

const SUIT_TO_SYMBOL = {
  spades:   '♠',
  hearts:   '♥',
  diamonds: '♦',
  clubs:    '♣',
}

const RED_SUITS = new Set(['hearts', 'diamonds'])

const RANK_VALUE_MAP = {
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
  1:  'A',
}

/**
 * Normalize a rank string to one of: 2-9, "10", "J", "Q", "K", "A"
 */
function normalizeRank(raw) {
  if (!raw) return null
  const s = String(raw).trim().toUpperCase()
  if (s === 'T' || s === '10') return '10'
  if (s === 'J') return 'J'
  if (s === 'Q') return 'Q'
  if (s === 'K') return 'K'
  if (s === 'A' || s === '1') return 'A'
  const n = parseInt(s, 10)
  if (!isNaN(n) && n >= 2 && n <= 14) {
    return RANK_VALUE_MAP[n] || String(n)
  }
  return null
}

/**
 * Build the normalized card object from resolved suit/rank.
 */
function buildCard(suit, rank) {
  const symbol = SUIT_TO_SYMBOL[suit] || '?'
  const color = RED_SUITS.has(suit) ? 'red' : 'black'
  const suitCode = { spades: 'S', hearts: 'H', diamonds: 'D', clubs: 'C' }[suit] || '?'
  return {
    rank,
    suit,
    suitSymbol: symbol,
    color,
    code: `${rank}${suitCode}`,
    valid: true,
  }
}

/**
 * Fallback card used when parsing fails completely.
 */
function fallbackCard(rawInput) {
  return {
    rank: '?',
    suit: 'unknown',
    suitSymbol: '?',
    color: 'black',
    code: '??',
    valid: false,
    _raw: rawInput,
  }
}

/**
 * Parse a string card representation.
 * Handles: "♥A", "♦10", "Ah", "AH", "10H", "10h"
 */
function parseCardString(str) {
  const s = str.trim()

  // --- Primary backend format: suit-symbol first ---
  // e.g. "♠A", "♥10", "♦Q", "♣7"
  const firstChar = s.charAt(0)
  if (SUIT_SYMBOL_MAP[firstChar]) {
    const suit = SUIT_SYMBOL_MAP[firstChar]
    const rankRaw = s.slice(1)
    const rank = normalizeRank(rankRaw)
    if (rank) return buildCard(suit, rank)
  }

  // --- Alphanumeric: rank then suit char ---
  // "Ah", "AH", "Td", "2c", "10H", "10S"
  // Attempt: last character is suit, rest is rank
  const lastChar = s.slice(-1)
  const suitFromLast = SUIT_CHAR_MAP[lastChar]
  if (suitFromLast) {
    const rankRaw = s.slice(0, -1)
    const rank = normalizeRank(rankRaw)
    if (rank) return buildCard(suitFromLast, rank)
  }

  return null
}

/**
 * Parse an object card representation.
 * Handles: { suit: "HEARTS", value: 10 }, { suit: "H", rank: "A" }
 */
function parseCardObject(obj) {
  if (!obj || typeof obj !== 'object') return null

  // Suit resolution
  let suit = null
  if (obj.suit) {
    const suitStr = String(obj.suit).toUpperCase()
    suit = SUIT_NAME_MAP[suitStr] || SUIT_CHAR_MAP[obj.suit] || null
  }
  if (!suit) return null

  // Rank resolution
  const rankRaw = obj.rank ?? obj.value ?? null
  const rank = normalizeRank(rankRaw)
  if (!rank) return null

  return buildCard(suit, rank)
}

/**
 * Main export: normalize any card input to the standard shape.
 * Returns fallbackCard if parsing fails.
 */
export function normalizeCard(input) {
  if (!input) return fallbackCard(input)

  if (typeof input === 'string') {
    const result = parseCardString(input)
    return result || fallbackCard(input)
  }

  if (typeof input === 'object') {
    const result = parseCardObject(input)
    return result || fallbackCard(input)
  }

  return fallbackCard(input)
}

/**
 * Normalize an array of cards. Missing slots return null (not fallbackCard)
 * so components can render placeholder slots.
 */
export function normalizeCards(inputs) {
  if (!Array.isArray(inputs)) return []
  return inputs.map(c => (c ? normalizeCard(c) : null))
}
