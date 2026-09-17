import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { GameShell } from '../../components/game/GameShell'
import { Button } from '../../components/ui/Button'
import { useWallet } from '../../store/wallet'
import { applyEdge } from '../../lib/ev'
import { formatMoney } from '../../lib/format'
import { createRng, randomInt } from '../../lib/rng'
import { sounds } from '../../lib/sound'

const WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
]
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

type BetKind =
  | { type: 'straight'; n: number }
  | { type: 'color'; color: 'red' | 'black' }
  | { type: 'parity'; parity: 'even' | 'odd' }
  | { type: 'dozen'; dozen: 1 | 2 | 3 }
  | { type: 'lowhigh'; side: 'low' | 'high' }

const CHIP = [1, 5, 10, 25, 100]

function fairPayout(kind: BetKind): number {
  switch (kind.type) {
    case 'straight':
      return 36
    case 'color':
    case 'parity':
    case 'lowhigh':
      return 2
    case 'dozen':
      return 3
  }
}

function wins(kind: BetKind, n: number): boolean {
  if (n === 0) return kind.type === 'straight' && kind.n === 0
  switch (kind.type) {
    case 'straight':
      return kind.n === n
    case 'color':
      return kind.color === 'red' ? RED.has(n) : !RED.has(n)
    case 'parity':
      return kind.parity === 'even' ? n % 2 === 0 : n % 2 === 1
    case 'dozen':
      return kind.dozen === 1 ? n <= 12 : kind.dozen === 2 ? n <= 24 : n >= 25
    case 'lowhigh':
      return kind.side === 'low' ? n <= 18 : n >= 19
  }
}

function betKey(b: BetKind): string {
  return JSON.stringify(b)
}

export function RouletteGame() {
  const placeBet = useWallet((s) => s.placeBet)
  const settle = useWallet((s) => s.settle)
  const houseEdge = useWallet((s) => s.houseEdge)
  const soundOn = useWallet((s) => s.soundEnabled)
  const animOn = useWallet((s) => s.animEnabled)
  const balance = useWallet((s) => s.balance)

  const [chip, setChip] = useState(5)
  const [bets, setBets] = useState<Record<string, { kind: BetKind; amount: number }>>({})
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [rotation, setRotation] = useState(0)
  const [flash, setFlash] = useState<'win' | 'lose' | null>(null)

  const totalBet = useMemo(() => Object.values(bets).reduce((s, b) => s + b.amount, 0), [bets])

  const addBet = (kind: BetKind) => {
    if (spinning) return
    if (chip > balance - totalBet) return
    const k = betKey(kind)
    setBets((prev) => {
      const cur = prev[k]
      return { ...prev, [k]: { kind, amount: (cur?.amount ?? 0) + chip } }
    })
    if (soundOn) sounds.click()
  }

  const clear = () => setBets({})

  const spin = async () => {
    if (spinning || totalBet <= 0 || totalBet > balance) return
    if (!placeBet(totalBet)) return
    setSpinning(true)
    setFlash(null)
    const { next } = createRng()
    const idx = randomInt(0, 36, next)
    const n = WHEEL[idx]
    const extra = 360 * 4 + (360 / 37) * idx
    setRotation((r) => r + extra)
    if (animOn) await new Promise((r) => setTimeout(r, 2200))
    setResult(n)
    const edge = houseEdge()
    let payout = 0
    for (const b of Object.values(bets)) {
      if (wins(b.kind, n)) {
        const fair = fairPayout(b.kind)
        const mult = applyEdge(fair, edge)
        // for even money, European house edge already in 0 — still apply EV slider
        payout += Math.round(b.amount * mult * 100) / 100
      }
    }
    settle({ game: 'roulette', amount: totalBet, payout, detail: `Ball ${n}` })
    setFlash(payout > 0 ? 'win' : 'lose')
    if (soundOn) (payout > 0 ? sounds.win : sounds.lose)()
    setBets({})
    setSpinning(false)
  }

  const sidebar = (
    <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-4">
      <div>
        <label className="text-xs text-nv-muted uppercase">Chip</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {CHIP.map((c) => (
            <button
              key={c}
              type="button"
              disabled={spinning}
              onClick={() => setChip(c)}
              className={`touch-target rounded-full h-11 w-11 text-xs font-bold border ${chip === c ? 'border-nv-cyan bg-nv-cyan text-black' : 'border-nv-border bg-nv-card'}`}
            >
              ${c}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm">Total bet: <span className="text-nv-cyan font-bold">${formatMoney(totalBet)}</span></p>
      <Button variant="primary" full disabled={spinning || totalBet <= 0 || totalBet > balance} onClick={spin}>Spin</Button>
      <Button full disabled={spinning} onClick={clear}>Clear bets</Button>
    </div>
  )

  return (
    <GameShell gameId="roulette" sidebar={sidebar}>
      <div className={`space-y-4 ${flash === 'win' ? 'anim-win' : flash === 'lose' ? 'anim-lose' : ''}`}>
        <div className="flex justify-center">
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: animOn && spinning ? 2.2 : 0, ease: [0.15, 0.8, 0.2, 1] }}
            className="h-40 w-40 sm:h-48 sm:w-48 rounded-full border-4 border-nv-amber bg-[conic-gradient(#0a0a0c_0_10deg,#b91c1c_10deg_20deg,#0a0a0c_20deg_30deg,#b91c1c_30deg_40deg,#166534_40deg_50deg,#b91c1c_50deg)] flex items-center justify-center shadow-xl"
          >
            <div className="h-16 w-16 rounded-full bg-nv-panel border border-nv-border flex items-center justify-center text-2xl font-black">
              {result ?? '•'}
            </div>
          </motion.div>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 max-w-3xl mx-auto">
          <button type="button" disabled={spinning} onClick={() => addBet({ type: 'straight', n: 0 })} className="touch-target col-span-6 sm:col-span-12 rounded-lg bg-nv-green/30 border border-nv-green/40 text-sm font-bold">
            0 {bets[betKey({ type: 'straight', n: 0 })] ? `$${bets[betKey({ type: 'straight', n: 0 })].amount}` : ''}
          </button>
          {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => {
            const k = betKey({ type: 'straight', n })
            return (
              <button
                key={n}
                type="button"
                disabled={spinning}
                onClick={() => addBet({ type: 'straight', n })}
                className={`touch-target rounded-lg text-xs font-semibold border ${RED.has(n) ? 'bg-nv-red/40 border-nv-red/50' : 'bg-nv-bg border-nv-border'}`}
              >
                {n}{bets[k] ? ` ·$${bets[k].amount}` : ''}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button disabled={spinning} onClick={() => addBet({ type: 'color', color: 'red' })}>Red</Button>
          <Button disabled={spinning} onClick={() => addBet({ type: 'color', color: 'black' })}>Black</Button>
          <Button disabled={spinning} onClick={() => addBet({ type: 'parity', parity: 'even' })}>Even</Button>
          <Button disabled={spinning} onClick={() => addBet({ type: 'parity', parity: 'odd' })}>Odd</Button>
          <Button disabled={spinning} onClick={() => addBet({ type: 'lowhigh', side: 'low' })}>1–18</Button>
          <Button disabled={spinning} onClick={() => addBet({ type: 'lowhigh', side: 'high' })}>19–36</Button>
          <Button disabled={spinning} onClick={() => addBet({ type: 'dozen', dozen: 1 })}>1st 12</Button>
          <Button disabled={spinning} onClick={() => addBet({ type: 'dozen', dozen: 2 })}>2nd 12</Button>
          <Button disabled={spinning} onClick={() => addBet({ type: 'dozen', dozen: 3 })}>3rd 12</Button>
        </div>
      </div>
    </GameShell>
  )
}
