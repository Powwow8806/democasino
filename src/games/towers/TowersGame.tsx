import { useState } from 'react'
import { GameShell } from '../../components/game/GameShell'
import { BetControls } from '../../components/wallet/BetControls'
import { Button } from '../../components/ui/Button'
import { useWallet } from '../../store/wallet'
import { applyEdge } from '../../lib/ev'
import { formatMoney, formatMult } from '../../lib/format'
import { createRng, pickIndex } from '../../lib/rng'
import { sounds } from '../../lib/sound'

const ROWS = 8
const COLS = 3 // 1 trap per row

export function TowersGame() {
  const placeBet = useWallet((s) => s.placeBet)
  const settle = useWallet((s) => s.settle)
  const houseEdge = useWallet((s) => s.houseEdge)
  const soundOn = useWallet((s) => s.soundEnabled)
  const balance = useWallet((s) => s.balance)

  const [bet, setBet] = useState(10)
  const [active, setActive] = useState(false)
  const [traps, setTraps] = useState<number[]>([])
  const [level, setLevel] = useState(0)
  const [picked, setPicked] = useState<(number | null)[]>(Array(ROWS).fill(null))
  const [bust, setBust] = useState(false)
  const [flash, setFlash] = useState<'win' | 'lose' | null>(null)

  const fairStep = COLS / (COLS - 1)
  const mult = level === 0 ? 1 : applyEdge(Math.pow(fairStep, level), houseEdge())

  const start = () => {
    if (active) return
    const a = Math.round(bet * 100) / 100
    if (a <= 0 || a > balance) return
    if (!placeBet(a)) return
    const { next } = createRng()
    const t = Array.from({ length: ROWS }, () => pickIndex(COLS, next))
    setTraps(t)
    setLevel(0)
    setPicked(Array(ROWS).fill(null))
    setBust(false)
    setFlash(null)
    setActive(true)
    if (soundOn) sounds.click()
  }

  const pick = (row: number, col: number) => {
    if (!active || bust || row !== level) return
    if (traps[row] === col) {
      setBust(true)
      setActive(false)
      setFlash('lose')
      setPicked((p) => {
        const n = [...p]
        n[row] = col
        return n
      })
      if (soundOn) sounds.lose()
      settle({ game: 'towers', amount: bet, payout: 0, detail: `Fell at floor ${row + 1}` })
      return
    }
    const newLevel = level + 1
    setPicked((p) => {
      const n = [...p]
      n[row] = col
      return n
    })
    setLevel(newLevel)
    if (soundOn) sounds.reveal()
    if (newLevel >= ROWS) {
      const m = applyEdge(Math.pow(fairStep, ROWS), houseEdge())
      const payout = Math.round(bet * m * 100) / 100
      setActive(false)
      setFlash('win')
      if (soundOn) sounds.cashout()
      settle({ game: 'towers', amount: bet, payout, detail: `Summit · ${formatMult(m)}` })
    }
  }

  const cashOut = () => {
    if (!active || level === 0) return
    const payout = Math.round(bet * mult * 100) / 100
    setActive(false)
    setFlash('win')
    if (soundOn) sounds.cashout()
    settle({ game: 'towers', amount: bet, payout, detail: `Floor ${level} · ${formatMult(mult)}` })
  }

  const sidebar = (
    <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-4">
      <BetControls bet={bet} setBet={setBet} disabled={active} />
      {!active ? (
        <Button variant="primary" full disabled={bet <= 0 || bet > balance} onClick={start}>Climb</Button>
      ) : (
        <>
          <div className="flex justify-between text-sm"><span className="text-nv-muted">Multiplier</span><span className="text-nv-cyan font-bold">{formatMult(mult)}</span></div>
          <Button variant="success" full disabled={level === 0} onClick={cashOut}>Cash Out ${formatMoney(bet * mult)}</Button>
        </>
      )}
    </div>
  )

  return (
    <GameShell gameId="towers" sidebar={sidebar}>
      <div className={`space-y-2 max-w-sm mx-auto ${flash === 'win' ? 'anim-win' : flash === 'lose' ? 'anim-lose' : ''}`}>
        {[...Array(ROWS)].map((_, row) => {
          const r = ROWS - 1 - row // top is highest
          return (
            <div key={r} className="grid grid-cols-3 gap-2">
              {Array.from({ length: COLS }, (_, col) => {
                const chosen = picked[r] === col
                const showTrap = (!active || bust) && traps[r] === col
                const clickable = active && r === level
                return (
                  <button
                    key={col}
                    type="button"
                    disabled={!clickable}
                    onClick={() => pick(r, col)}
                    className={`touch-target h-12 rounded-xl border text-sm font-bold ${
                      showTrap
                        ? 'bg-nv-red/30 border-nv-red text-nv-red'
                        : chosen
                          ? 'bg-nv-green/30 border-nv-green text-nv-green'
                          : clickable
                            ? 'bg-nv-card border-nv-cyan/40 hover:bg-nv-cyan/10'
                            : 'bg-nv-bg border-nv-border opacity-60'
                    }`}
                  >
                    {showTrap ? 'X' : chosen ? '✓' : r + 1}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </GameShell>
  )
}
