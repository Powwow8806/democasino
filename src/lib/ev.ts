/**
 * EV slider maps -100..+100 to a house-edge adjustment.
 * 0 = default house edge (~1% RTP 99%).
 * Negative = player disadvantage (higher house edge).
 * Positive = player advantage (lower / negative house edge).
 */
export function sliderToHouseEdge(slider: number): number {
  // slider -100 => edge 0.10, 0 => 0.01, +100 => -0.08
  const s = Math.max(-100, Math.min(100, slider))
  if (s <= 0) {
    return 0.01 + (-s / 100) * 0.09
  }
  return 0.01 - (s / 100) * 0.09
}

/** Apply house edge to a fair multiplier (fair * (1 - edge)). */
export function applyEdge(fairMultiplier: number, houseEdge: number): number {
  const m = fairMultiplier * (1 - houseEdge)
  return Math.max(1.01, Math.floor(m * 10000) / 10000)
}

export function payoutFromChance(winChance: number, houseEdge: number): number {
  const c = Math.max(0.0001, Math.min(0.9999, winChance))
  return applyEdge(1 / c, houseEdge)
}
