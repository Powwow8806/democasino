import { applyEdge } from './ev'
import { createRng, shuffle } from './rng'

export const GRID = 25

export function minePositions(mineCount: number, seed?: number): number[] {
  const { next } = createRng(seed)
  const idx = Array.from({ length: GRID }, (_, i) => i)
  return shuffle(idx, next).slice(0, mineCount)
}

/** Fair multiplier after `revealed` safe tiles with `mines` mines on 25 grid. */
export function fairMultiplier(mines: number, revealed: number): number {
  if (revealed <= 0) return 1
  const safe = GRID - mines
  if (revealed > safe) return 0
  let mult = 1
  for (let i = 0; i < revealed; i++) {
    mult *= (GRID - i) / (safe - i)
  }
  return mult
}

export function minesMultiplier(mines: number, revealed: number, houseEdge: number): number {
  if (revealed <= 0) return 1
  return applyEdge(fairMultiplier(mines, revealed), houseEdge)
}
