export const POT_SIZES = [1/3, 0.5, 0.75, 1, 1.5, 2]
export function potRaiseTarget({pot,currentBet,heroBet}, fraction) {
 return Math.round(currentBet + (pot + Math.max(0,currentBet-heroBet))*fraction)
}
