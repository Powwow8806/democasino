import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { GameShell } from '../../components/game/GameShell'
import { BetControls } from '../../components/wallet/BetControls'
import { Button } from '../../components/ui/Button'
import { useWallet } from '../../store/wallet'
import { applyEdge } from '../../lib/ev'
import { formatMoney, formatMult } from '../../lib/format'
import { createRng } from '../../lib/rng'
import { sounds } from '../../lib/sound'

const SEGMENTS = [
  { label: '2×', mult: 2, color: '#22d3ee' },
  { label: '0×', mult: 0, color: '#2a2a35' },
  { label: '3×', mult: 3, color: '#a855f7' },
  { label: '0×', mult: 0, color: '#2a2a35' },
  { label: '5×', mult: 5, color: '#34d399' },
  { label: '0×', mult: 0, color: '#2a2a35' },
  { label: '2×', mult: 2, color: '#22d3ee' },
  { label: '0×', mult: 0, color: '#2a2a35' },
  { label: '10×', mult: 10, color: '#fbbf24' },
  { label: '0×', mult: 0, color: '#2a2a35' },
]

export function WheelGame() {
  const placeBet = useWallet((s) => s.placeBet)
  const settle = useWallet((s) => s.settle)
  const houseEdge = useWallet((s) => s.houseEdge)
  const soundOn = useWallet((s) => s.soundEnabled)
  const animOn = useWallet((s) => s.animEnabled)
  const balance = useWallet((s) => s.balance)

  const [bet, setBet] = useState(10)
  const [spinning, setSpinning] = useState(false)
  const [rot, setRot] = useState(0)
  const [result, setResult] = useState<number | null>(null)
  const [flash, setFlash] = useState<'win' | 'lose' | null>(null)

  const edged = useMemo(
    () => SEGMENTS.map((s) => ({ ...s, mult: s.mult > 0 ? applyEdge(s.mult, houseEdge()) : 0 })),
    [houseEdge],
  )

  const spin = async () => {
    if (spinning) return
    const a = Math.round(bet * 100) / 100
    if (a <= 0 || a > balance) return
    if (!placeBet(a)) return
    setSpinning(true)
    setFlash(null)
    const { next } = createRng()
    const idx = Math.floor(next() * SEGMENTS.length)
    const seg = edged[idx]
    const ang = 360 / SEGMENTS.length
    const target = 360 * 5 + (360 - idx * ang - ang / 2)
    setRot((r) => r + target)
    if (animOn) await new Promise((r) => setTimeout(r, 2800))
    setResult(seg.mult)
    const payout = Math.round(a * seg.mult * 100) / 100
    settle({ game: 'wheel', amount: a, payout, detail: formatMult(seg.mult) })
    setFlash(payout > 0 ? 'win' : 'lose')
    if (soundOn) (payout > 0 ? sounds.win : sounds.lose)()
    setSpinning(false)
  }

  const sidebar = (
    <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-4">
      <BetControls bet={bet} setBet={setBet} disabled={spinning} />
      <Button variant="accent" full disabled={spinning || bet <= 0 || bet > balance} onClick={spin}>
        Spin · ${formatMoney(bet)}
      </Button>
      {result !== null && <p className="text-center text-nv-cyan font-bold">{formatMult(result)}</p>}
    </div>
  )

  const gradient = edged.map((s, i) => `${s.color} ${(i / edged.length) * 100}% ${((i + 1) / edged.length) * 100}%`).join(', ')

  return (
    <GameShell gameId="wheel" sidebar={sidebar}>
      <div className={`flex flex-col items-center ${flash === 'win' ? 'anim-win' : flash === 'lose' ? 'anim-lose' : ''}`}>
        <div className="relative">
          <div className="absolute left-1/2 -top-1 -translate-x-1/2 z-10 text-nv-amber text-2xl">▼</div>
          <motion.div
            animate={{ rotate: rot }}
            transition={{ duration: animOn && spinning ? 2.8 : 0, ease: [0.12, 0.7, 0.1, 1] }}
            className="h-56 w-56 sm:h-64 sm:w-64 rounded-full border-4 border-nv-border shadow-xl"
            style={{ background: `conic-gradient(${gradient})` }}
          />
        </div>
      </div>
    </GameShell>
  )
}
