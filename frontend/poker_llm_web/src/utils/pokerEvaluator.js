import { Hand } from './pokersolver'
import { normalizeCard } from './cardFormat'

/**
 * pokerEvaluator.js
 * 
 * A centralized adapter for the 'pokersolver' library.
 * This file isolates all third-party poker evaluation logic from our UI components,
 * taking our internal card format as input and returning structured results.
 */

/**
 * Converts a project-format card (or raw string) into the format expected by pokersolver.
 * Example: { rank: "10", suit: "spades" } -> "Ts"
 *          { rank: "A", suit: "hearts" } -> "Ah"
 * 
 * @param {Object|string} cardInput 
 * @returns {string|null} The pokersolver format card (e.g. "Ts", "Ah")
 */
export function toSolverFormat(cardInput) {
  const normalized = normalizeCard(cardInput)
  if (!normalized || !normalized.valid) return null
  
  // pokersolver uses 'T' for 10
  const rank = normalized.rank === '10' ? 'T' : normalized.rank
  // pokersolver uses lowercase first letter of suit ('h', 's', 'd', 'c')
  const suit = normalized.suit.charAt(0).toLowerCase()
  
  return rank + suit
}

/**
 * Evaluates a single hand given hole cards and board cards.
 * 
 * @param {Array} holeCards - 2 cards (project format)
 * @param {Array} boardCards - up to 5 cards (project format)
 * @returns {Object|null} The evaluated hand result, or null if insufficient cards
 */
export function evaluateHoldemHand(holeCards, boardCards) {
  if (!holeCards || !boardCards) return null
  
  const allCardsRaw = [...holeCards, ...boardCards]
  const allCardsSolved = allCardsRaw.map(toSolverFormat).filter(Boolean)
  
  // Need at least 5 cards to make a poker hand
  if (allCardsSolved.length < 5) return null
  
  try {
    const solved = Hand.solve(allCardsSolved)
    return {
      // original pokersolver format array of the winning 5 cards
      winningCardsSolverFormat: solved.cards.map(c => c.value + c.suit),
      handName: solved.name,
      handDescription: solved.descr,
      rankValue: solved.rank
    }
  } catch (err) {
    console.error("Error evaluating hand:", err)
    return null
  }
}

/**
 * Compares two hands (hero vs villain) and returns a structured showdown result.
 * 
 * @param {string} heroId 
 * @param {Array} heroHoles 
 * @param {string} villainId 
 * @param {Array} villainHoles 
 * @param {Array} boardCards 
 * @returns {import('@/types').ShowdownResult | null}
 */
export function buildShowdownResult(heroId, heroHoles, villainId, villainHoles, boardCards) {
  // 1. Gather cards
  const heroAll = [...heroHoles, ...boardCards].map(toSolverFormat).filter(Boolean)
  const villainAll = [...villainHoles, ...boardCards].map(toSolverFormat).filter(Boolean)
  
  if (heroAll.length < 5 || villainAll.length < 5) return null
  
  // 2. Solve both hands
  let heroSolved, villainSolved
  try {
    heroSolved = Hand.solve(heroAll)
    villainSolved = Hand.solve(villainAll)
  } catch (e) {
    console.error("Error solving hands for showdown:", e)
    return null
  }
  
  // 3. Determine winners
  const winners = Hand.winners([heroSolved, villainSolved])
  
  const heroIsWinner = winners.includes(heroSolved)
  const villainIsWinner = winners.includes(villainSolved)
  
  let winnerId = null
  let winnerSeat = null
  let isTie = false
  
  if (heroIsWinner && villainIsWinner) {
    isTie = true
  } else if (heroIsWinner) {
    winnerId = heroId
    winnerSeat = 'hero'
  } else {
    winnerId = villainId
    winnerSeat = 'villain'
  }
  
  // 4. Construct final structured result
  // Use the best hand of the winner (or hero if tie) for the overall summary
  const topHand = heroIsWinner ? heroSolved : villainSolved
  
  return {
    winnerId,
    winnerSeat,
    isTie,
    reason: 'showdown',
    hero: {
      handName: heroSolved.name,
      handDescription: heroSolved.descr,
      cards: heroSolved.cards.map(c => c.value + c.suit)
    },
    villain: {
      handName: villainSolved.name,
      handDescription: villainSolved.descr,
      cards: villainSolved.cards.map(c => c.value + c.suit)
    },
    winningHandName: topHand.name,
    winningHandDescription: topHand.descr
  }
}
