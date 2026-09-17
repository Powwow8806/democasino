import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BetRecord, GameId, SessionStats } from '../types'
import { uid } from '../lib/format'
import { sliderToHouseEdge } from '../lib/ev'

const START_BALANCE = 100_000

const emptyStats = (): SessionStats => ({
  totalWagered: 0,
  totalWon: 0,
  biggestWin: 0,
  biggestMultiplier: 0,
  wins: 0,
  losses: 0,
  bets: 0,
})

interface WalletState {
  balance: number
  evSlider: number
  soundEnabled: boolean
  animEnabled: boolean
  favourites: GameId[]
  recentGames: GameId[]
  recentBets: BetRecord[]
  stats: SessionStats
  houseEdge: () => number
  setEvSlider: (v: number) => void
  setSound: (v: boolean) => void
  setAnim: (v: boolean) => void
  toggleFavourite: (id: GameId) => void
  touchGame: (id: GameId) => void
  /** Place a bet; returns false if invalid / insufficient. */
  placeBet: (amount: number) => boolean
  /** Credit payout (can be 0 for loss). Records bet. */
  settle: (opts: {
    game: GameId
    amount: number
    payout: number
    detail?: string
  }) => void
  resetBalance: () => void
  canBet: (amount: number) => boolean
}

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      balance: START_BALANCE,
      evSlider: 0,
      soundEnabled: true,
      animEnabled: true,
      favourites: [],
      recentGames: [],
      recentBets: [],
      stats: emptyStats(),

      houseEdge: () => sliderToHouseEdge(get().evSlider),

      setEvSlider: (v) => set({ evSlider: Math.max(-100, Math.min(100, v)) }),
      setSound: (v) => set({ soundEnabled: v }),
      setAnim: (v) => set({ animEnabled: v }),

      toggleFavourite: (id) =>
        set((s) => ({
          favourites: s.favourites.includes(id)
            ? s.favourites.filter((x) => x !== id)
            : [...s.favourites, id],
        })),

      touchGame: (id) =>
        set((s) => ({
          recentGames: [id, ...s.recentGames.filter((x) => x !== id)].slice(0, 12),
        })),

      canBet: (amount) => {
        const a = Number(amount)
        return Number.isFinite(a) && a > 0 && a <= get().balance + 1e-9
      },

      placeBet: (amount) => {
        const a = Math.round(amount * 100) / 100
        if (!get().canBet(a)) return false
        set((s) => ({ balance: Math.round((s.balance - a) * 100) / 100 }))
        return true
      },

      settle: ({ game, amount, payout, detail }) => {
        const p = Math.max(0, Math.round(payout * 100) / 100)
        const a = Math.max(0, amount)
        const won = p > a
        const mult = a > 0 ? p / a : 0
        const profit = p - a
        const record: BetRecord = {
          id: uid('bet'),
          game,
          amount: a,
          payout: p,
          multiplier: mult,
          won: p >= a && p > 0,
          timestamp: Date.now(),
          detail,
        }
        set((s) => {
          const stats = { ...s.stats }
          stats.bets += 1
          stats.totalWagered += a
          stats.totalWon += p
          if (p > 0 && profit > 0) {
            stats.wins += 1
            if (profit > stats.biggestWin) stats.biggestWin = profit
            if (mult > stats.biggestMultiplier) stats.biggestMultiplier = mult
          } else if (p < a) {
            stats.losses += 1
          } else if (p === a && p > 0) {
            // push — count neither
          } else {
            stats.losses += 1
          }
          return {
            balance: Math.round((s.balance + p) * 100) / 100,
            recentBets: [record, ...s.recentBets].slice(0, 50),
            stats,
          }
        })
      },

      resetBalance: () =>
        set({
          balance: START_BALANCE,
          recentBets: [],
          stats: emptyStats(),
        }),
    }),
    {
      name: 'neonvault-wallet',
      partialize: (s) => ({
        balance: s.balance,
        evSlider: s.evSlider,
        soundEnabled: s.soundEnabled,
        animEnabled: s.animEnabled,
        favourites: s.favourites,
        recentGames: s.recentGames,
        recentBets: s.recentBets,
        stats: s.stats,
      }),
    },
  ),
)

export const START_BALANCE_AMOUNT = START_BALANCE
