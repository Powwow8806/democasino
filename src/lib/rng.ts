/** Seeded mulberry32 PRNG — deterministic for a given seed. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0
}

export function createRng(seed?: number): { seed: number; next: () => number } {
  const s = seed ?? randomSeed()
  return { seed: s, next: mulberry32(s) }
}

/** Fisher–Yates shuffle using provided RNG. */
export function shuffle<T>(arr: T[], next: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickIndex(length: number, next: () => number): number {
  return Math.floor(next() * length)
}

export function randomInt(min: number, max: number, next: () => number): number {
  return Math.floor(next() * (max - min + 1)) + min
}

/** Crash point from exponential distribution with house edge. */
export function crashPoint(next: () => number, houseEdge: number): number {
  const e = Math.max(0, Math.min(0.99, houseEdge))
  const r = Math.max(1e-12, next())
  const point = (1 - e) / r
  return Math.max(1, Math.floor(point * 100) / 100)
}
