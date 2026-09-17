export type GameId =
  | 'mines'
  | 'dice'
  | 'plinko'
  | 'jumbo-plinko'
  | 'crash'
  | 'roulette'
  | 'blackjack'
  | 'hilo'
  | 'moles'
  | 'limbo'
  | 'coinflip'
  | 'keno'
  | 'wheel'
  | 'towers'
  | 'slots'
  | 'neon-reels'
  | 'vault-fruits'
  | 'cyber-gems'
  | 'aurora-wilds'
  | 'quantum-spin'

export type GameCategory = 'originals' | 'classics' | 'slots'

export interface GameMeta {
  id: GameId
  name: string
  category: GameCategory
  path: string
  description: string
  accent: string
  available: boolean
}

export interface BetRecord {
  id: string
  game: GameId
  amount: number
  payout: number
  multiplier: number
  won: boolean
  timestamp: number
  detail?: string
}

export interface SessionStats {
  totalWagered: number
  totalWon: number
  biggestWin: number
  biggestMultiplier: number
  wins: number
  losses: number
  bets: number
}

export type PlinkoRisk = 'low' | 'medium' | 'high'
