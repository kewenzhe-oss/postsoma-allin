export const POT_SIZES = [1/3, 0.5, 0.75, 1, 1.5, 2]

// UI amounts always mean chips paid by the player now.
export function potBetAmount(pot, fraction) {
  return Math.round(pot * fraction)
}
// RAISE requests use the player's total commitment on the current street.
export function raiseTarget(invest, heroBet) {
  return invest + heroBet
}
export function raiseAmounts({ pot, currentBet, heroBet }, target) {
  const toCall = Math.max(0, currentBet - heroBet)
  const invest = Math.max(0, target - heroBet)
  return { toCall, potAfterCall: pot + toCall, target, invest, potAfterAction: pot + invest }
}
