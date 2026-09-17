import { applyEdge } from '../../lib/ev'
import { createRng, pickIndex } from '../../lib/rng'

export interface SymbolDef {
  id: string
  label: string
  color: string
  /** Relative weight on reel */
  weight: number
  /** 3/4/5 of a kind payouts (× bet) before edge */
  pays: [number, number, number]
}

export interface SlotTheme {
  id: string
  name: string
  symbols: SymbolDef[]
  wildId?: string
  /** Volatility flavor: scales top pays feel */
  vol: 'med' | 'high'
}

export function spinReels(theme: SlotTheme, cols = 5, rows = 3, seed?: number): string[][] {
  const { next } = createRng(seed)
  const bag: string[] = []
  for (const s of theme.symbols) {
    for (let i = 0; i < s.weight; i++) bag.push(s.id)
  }
  const grid: string[][] = []
  for (let c = 0; c < cols; c++) {
    const col: string[] = []
    for (let r = 0; r < rows; r++) col.push(bag[pickIndex(bag.length, next)])
    grid.push(col)
  }
  return grid
}

/** Evaluate left-to-right paylines (3 lines). */
export function evalSlots(grid: string[][], theme: SlotTheme, bet: number, houseEdge: number): { payout: number; lines: string[] } {
  const linesIdx = [
    [0, 0, 0, 0, 0], // mid
    [1, 1, 1, 1, 1], // top (row1 if 0=top... we use row 0 top)
    [2, 2, 2, 2, 2],
  ]
  // grid[col][row]
  const lines: string[] = []
  let raw = 0
  const byId = Object.fromEntries(theme.symbols.map((s) => [s.id, s]))
  const wild = theme.wildId

  for (const rows of linesIdx) {
    const seq = rows.map((r, c) => grid[c][r])
    let base = seq.find((id) => id !== wild) ?? seq[0]
    let count = 0
    for (const id of seq) {
      if (id === base || id === wild || base === wild) {
        if (base === wild && id !== wild) base = id
        count++
      } else break
    }
    if (count >= 3) {
      const sym = byId[base]
      if (sym) {
        const pay = sym.pays[count - 3]
        raw += pay
        lines.push(`${count}× ${sym.label}`)
      }
    }
  }

  // scatter-ish: count top symbol across grid for high vol bonus feel
  if (theme.vol === 'high') {
    const top = theme.symbols.reduce((a, b) => (b.pays[2] > a.pays[2] ? b : a))
    let n = 0
    for (const col of grid) for (const cell of col) if (cell === top.id) n++
    if (n >= 3) {
      raw += top.pays[Math.min(2, n - 3)] * (n >= 5 ? 2 : 1)
      lines.push(`Scatter ${top.label}×${n}`)
    }
  }

  const mult = raw > 0 ? applyEdge(raw, houseEdge) : 0
  const payout = Math.round(bet * mult * 100) / 100
  return { payout, lines }
}

export const THEMES: Record<string, SlotTheme> = {
  slots: {
    id: 'slots',
    name: 'Vault Slots',
    vol: 'med',
    wildId: 'wild',
    symbols: [
      { id: 'cherry', label: 'Cherry', color: '#f97316', weight: 8, pays: [1.5, 4, 12] },
      { id: 'lemon', label: 'Lemon', color: '#fbbf24', weight: 7, pays: [1.8, 5, 15] },
      { id: 'bell', label: 'Bell', color: '#94a3b8', weight: 5, pays: [3, 10, 30] },
      { id: 'bar', label: 'BAR', color: '#e2e8f0', weight: 4, pays: [5, 15, 50] },
      { id: 'seven', label: '7', color: '#f43f5e', weight: 2, pays: [10, 40, 100] },
      { id: 'wild', label: 'WILD', color: '#a855f7', weight: 3, pays: [0, 0, 0] },
    ],
  },
  'neon-reels': {
    id: 'neon-reels',
    name: 'Neon Reels',
    vol: 'high',
    wildId: 'wild',
    symbols: [
      { id: 'bolt', label: 'Bolt', color: '#22d3ee', weight: 7, pays: [2, 6, 20] },
      { id: 'grid', label: 'Grid', color: '#38bdf8', weight: 6, pays: [2.5, 8, 28] },
      { id: 'pulse', label: 'Pulse', color: '#a855f7', weight: 4, pays: [5, 18, 60] },
      { id: 'city', label: 'City', color: '#c084fc', weight: 3, pays: [8, 30, 120] },
      { id: 'nova', label: 'Nova', color: '#f0abfc', weight: 1, pays: [20, 80, 400] },
      { id: 'wild', label: 'WILD', color: '#34d399', weight: 2, pays: [0, 0, 0] },
    ],
  },
  'vault-fruits': {
    id: 'vault-fruits',
    name: 'Vault Fruits',
    vol: 'high',
    wildId: 'wild',
    symbols: [
      { id: 'berry', label: 'Berry', color: '#fb7185', weight: 8, pays: [1.2, 3, 10] },
      { id: 'mango', label: 'Mango', color: '#fb923c', weight: 6, pays: [2, 7, 22] },
      { id: 'kiwi', label: 'Kiwi', color: '#a3e635', weight: 5, pays: [3, 12, 40] },
      { id: 'dragon', label: 'Dragon', color: '#f472b6', weight: 3, pays: [8, 35, 150] },
      { id: 'golden', label: 'Golden', color: '#fbbf24', weight: 1, pays: [25, 100, 500] },
      { id: 'wild', label: 'WILD', color: '#22d3ee', weight: 2, pays: [0, 0, 0] },
    ],
  },
  'cyber-gems': {
    id: 'cyber-gems',
    name: 'Cyber Gems',
    vol: 'high',
    wildId: 'wild',
    symbols: [
      { id: 'ruby', label: 'Ruby', color: '#f43f5e', weight: 7, pays: [2, 5, 18] },
      { id: 'sapphire', label: 'Sapphire', color: '#3b82f6', weight: 6, pays: [2.5, 8, 25] },
      { id: 'emerald', label: 'Emerald', color: '#34d399', weight: 4, pays: [5, 20, 70] },
      { id: 'obsidian', label: 'Obsidian', color: '#a78bfa', weight: 3, pays: [10, 45, 180] },
      { id: 'quantum', label: 'Quantum', color: '#e879f9', weight: 1, pays: [30, 120, 600] },
      { id: 'wild', label: 'WILD', color: '#fbbf24', weight: 2, pays: [0, 0, 0] },
    ],
  },
  'aurora-wilds': {
    id: 'aurora-wilds',
    name: 'Aurora Wilds',
    vol: 'high',
    wildId: 'wild',
    symbols: [
      { id: 'frost', label: 'Frost', color: '#bae6fd', weight: 7, pays: [1.8, 5, 16] },
      { id: 'pine', label: 'Pine', color: '#4ade80', weight: 6, pays: [2.2, 7, 24] },
      { id: 'aurora', label: 'Aurora', color: '#2dd4bf', weight: 4, pays: [6, 22, 80] },
      { id: 'owl', label: 'Owl', color: '#818cf8', weight: 3, pays: [12, 50, 200] },
      { id: 'borealis', label: 'Borealis', color: '#c4b5fd', weight: 1, pays: [40, 150, 800] },
      { id: 'wild', label: 'WILD', color: '#f0f9ff', weight: 2, pays: [0, 0, 0] },
    ],
  },
  'quantum-spin': {
    id: 'quantum-spin',
    name: 'Quantum Spin',
    vol: 'high',
    wildId: 'wild',
    symbols: [
      { id: 'qubit', label: 'Qubit', color: '#67e8f9', weight: 7, pays: [2, 6, 20] },
      { id: 'wave', label: 'Wave', color: '#818cf8', weight: 5, pays: [3, 12, 45] },
      { id: 'entangle', label: 'Entangle', color: '#e879f9', weight: 4, pays: [7, 28, 100] },
      { id: 'singularity', label: 'Singularity', color: '#f43f5e', weight: 2, pays: [15, 70, 280] },
      { id: 'omega', label: 'Omega', color: '#fbbf24', weight: 1, pays: [50, 200, 1000] },
      { id: 'wild', label: 'WILD', color: '#a855f7', weight: 2, pays: [0, 0, 0] },
    ],
  },
}
