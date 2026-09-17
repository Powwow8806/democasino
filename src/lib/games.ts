import type { GameMeta } from '../types'

export const GAMES: GameMeta[] = [
  { id: 'mines', name: 'Mines', category: 'originals', path: '/games/mines', description: 'Avoid the mines, cash out anytime', accent: '#22d3ee', available: true },
  { id: 'dice', name: 'Dice', category: 'originals', path: '/games/dice', description: 'Roll over or under the target', accent: '#a855f7', available: true },
  { id: 'plinko', name: 'Plinko', category: 'originals', path: '/games/plinko', description: 'Drop balls through pegs', accent: '#34d399', available: true },
  { id: 'jumbo-plinko', name: 'Jumbo Plinko', category: 'originals', path: '/games/jumbo-plinko', description: 'Bigger board, bigger thrills', accent: '#fbbf24', available: true },
  { id: 'crash', name: 'Crash', category: 'originals', path: '/games/crash', description: 'Cash out before it crashes', accent: '#f43f5e', available: true },
  { id: 'limbo', name: 'Limbo', category: 'originals', path: '/games/limbo', description: 'Predict the multiplier', accent: '#38bdf8', available: true },
  { id: 'coinflip', name: 'Coin Flip', category: 'originals', path: '/games/coinflip', description: 'Heads or tails', accent: '#fb923c', available: true },
  { id: 'hilo', name: 'HiLo', category: 'originals', path: '/games/hilo', description: 'Higher or lower?', accent: '#c084fc', available: true },
  { id: 'keno', name: 'Keno', category: 'originals', path: '/games/keno', description: 'Pick numbers, match draws', accent: '#2dd4bf', available: true },
  { id: 'wheel', name: 'Wheel', category: 'originals', path: '/games/wheel', description: 'Spin the fortune wheel', accent: '#f472b6', available: true },
  { id: 'towers', name: 'Towers', category: 'originals', path: '/games/towers', description: 'Climb floors, avoid traps', accent: '#818cf8', available: true },
  { id: 'moles', name: 'Moles', category: 'originals', path: '/games/moles', description: 'Whack safe moles only', accent: '#a3e635', available: true },
  { id: 'roulette', name: 'Roulette', category: 'classics', path: '/games/roulette', description: 'European roulette', accent: '#ef4444', available: true },
  { id: 'blackjack', name: 'Blackjack', category: 'classics', path: '/games/blackjack', description: 'Beat the dealer to 21', accent: '#eab308', available: true },
  { id: 'slots', name: 'Vault Slots', category: 'slots', path: '/games/slots', description: 'Classic 5-reel base slots', accent: '#94a3b8', available: true },
  { id: 'neon-reels', name: 'Neon Reels', category: 'slots', path: '/games/neon-reels', description: 'High-vol neon nights', accent: '#22d3ee', available: true },
  { id: 'vault-fruits', name: 'Vault Fruits', category: 'slots', path: '/games/vault-fruits', description: 'Fruit frenzy multipliers', accent: '#f97316', available: true },
  { id: 'cyber-gems', name: 'Cyber Gems', category: 'slots', path: '/games/cyber-gems', description: 'Gem cascades & wilds', accent: '#a855f7', available: true },
  { id: 'aurora-wilds', name: 'Aurora Wilds', category: 'slots', path: '/games/aurora-wilds', description: 'Northern lights jackpots', accent: '#34d399', available: true },
  { id: 'quantum-spin', name: 'Quantum Spin', category: 'slots', path: '/games/quantum-spin', description: 'Quantum volatility', accent: '#f43f5e', available: true },
]

export function getGame(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id)
}
