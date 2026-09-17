import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { GameShell } from '../../components/game/GameShell'
import { BetControls } from '../../components/wallet/BetControls'
import { Button } from '../../components/ui/Button'
import { useWallet } from '../../store/wallet'
import type { GameId } from '../../types'
import { THEMES, spinReels, evalSlots } from './slotEngine'
import { formatMoney } from '../../lib/format'
import { sounds } from '../../lib/sound'

export function SlotsGame({ themeId, gameId }: { themeId: string; gameId: GameId }) {
  const placeBet = useWallet((s) => s.placeBet)
  const settle = useWallet((s) => s.settle)
  const houseEdge = useWallet((s) => s.houseEdge)
  const soundOn = useWallet((s) => s.soundEnabled)
  const animOn = useWallet((s) => s.animEnabled)
  const balance = useWallet((s) => s.balance)

  const theme = THEMES[themeId] ?? THEMES.slots
  const [bet, setBet] = useState(10)
  const [grid, setGrid] = useState(() => spinReels(theme))
  const [spinning, setSpinning] = useState(false)
  const [lines, setLines] = useState<string[]>([])
  const [flash, setFlash] = useState<'win' | 'lose' | null>(null)
  const [auto, setAuto] = useState(false)

  const byId = useMemo(() => Object.fromEntries(theme.symbols.map((s) => [s.id, s])), [theme])

  const doSpin = async () => {
    if (spinning) return false
    const a = Math.round(bet * 100) / 100
    if (a <= 0 || a > useWallet.getState().balance) return false
    if (!placeBet(a)) return false
    setSpinning(true)
    setFlash(null)
    setLines([])
    if (soundOn) sounds.click()
    if (animOn) {
      for (let i = 0; i < 6; i++) {
        setGrid(spinReels(theme))
        await new Promise((r) => setTimeout(r, 60))
      }
    }
    const g = spinReels(theme)
    setGrid(g)
    const { payout, lines: L } = evalSlots(g, theme, a, houseEdge())
    setLines(L)
    settle({ game: gameId, amount: a, payout, detail: L.join(', ') || 'No win' })
    setFlash(payout > 0 ? 'win' : 'lose')
    if (soundOn) (payout > 0 ? sounds.win : sounds.tick)()
    setSpinning(false)
    return true
  }

  const startAuto = async () => {
    if (auto || spinning) return
    setAuto(true)
    for (let i = 0; i < 10; i++) {
      const ok = await doSpin()
      if (!ok) break
      await new Promise((r) => setTimeout(r, 400))
    }
    setAuto(false)
  }

  const sidebar = (
    <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-4">
      <BetControls bet={bet} setBet={setBet} disabled={spinning} />
      <Button variant="primary" full disabled={spinning || bet <= 0 || bet > balance} onClick={() => void doSpin()}>
        Spin · ${formatMoney(bet)}
      </Button>
      <Button variant="accent" full disabled={spinning || auto} onClick={() => void startAuto()}>
        Auto ×10
      </Button>
      {lines.length > 0 && (
        <ul className="text-xs text-nv-green space-y-1">
          {lines.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-nv-muted">Original theme · High-vol feel · DEMO PLAY MONEY ONLY</p>
    </div>
  )

  return (
    <GameShell gameId={gameId} sidebar={sidebar}>
      <div className={`${flash === 'win' ? 'anim-win' : flash === 'lose' ? 'anim-lose' : ''}`}>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 max-w-lg mx-auto">
          {[0, 1, 2].map((row) =>
            [0, 1, 2, 3, 4].map((col) => {
              const id = grid[col][row]
              const sym = byId[id]
              return (
                <motion.div
                  key={`${col}-${row}-${spinning ? 's' : id}`}
                  initial={animOn && spinning ? { y: -12, opacity: 0.5 } : false}
                  animate={{ y: 0, opacity: 1 }}
                  className="aspect-square rounded-xl border border-nv-border bg-nv-bg flex flex-col items-center justify-center text-[10px] sm:text-xs font-bold"
                  style={{ color: sym?.color, boxShadow: `inset 0 0 20px ${sym?.color}22` }}
                >
                  <span className="text-lg sm:text-xl">{sym?.label.slice(0, 2)}</span>
                  <span className="opacity-80 truncate max-w-full px-0.5">{sym?.label}</span>
                </motion.div>
              )
            }),
          )}
        </div>
        <p className="text-center text-nv-muted text-sm mt-4">{theme.name}</p>
      </div>
    </GameShell>
  )
}

export const VaultSlots = () => <SlotsGame themeId="slots" gameId="slots" />
export const NeonReels = () => <SlotsGame themeId="neon-reels" gameId="neon-reels" />
export const VaultFruits = () => <SlotsGame themeId="vault-fruits" gameId="vault-fruits" />
export const CyberGems = () => <SlotsGame themeId="cyber-gems" gameId="cyber-gems" />
export const AuroraWilds = () => <SlotsGame themeId="aurora-wilds" gameId="aurora-wilds" />
export const QuantumSpin = () => <SlotsGame themeId="quantum-spin" gameId="quantum-spin" />
