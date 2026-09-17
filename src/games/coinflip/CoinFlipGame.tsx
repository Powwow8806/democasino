import { useState } from 'react'
import { motion } from 'framer-motion'
import { GameShell } from '../../components/game/GameShell'
import { BetControls } from '../../components/wallet/BetControls'
import { Button } from '../../components/ui/Button'
import { useWallet } from '../../store/wallet'
import { applyEdge } from '../../lib/ev'
import { formatMoney, formatMult } from '../../lib/format'
import { createRng } from '../../lib/rng'
import { sounds } from '../../lib/sound'

export function CoinFlipGame() {
  const placeBet = useWallet((s) => s.placeBet)
  const settle = useWallet((s) => s.settle)
  const houseEdge = useWallet((s) => s.houseEdge)
  const soundOn = useWallet((s) => s.soundEnabled)
  const animOn = useWallet((s) => s.animEnabled)
  const balance = useWallet((s) => s.balance)

  const [bet, setBet] = useState(10)
  const [pick, setPick] = useState<'heads' | 'tails'>('heads')
  const [result, setResult] = useState<'heads' | 'tails' | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [flash, setFlash] = useState<'win' | 'lose' | null>(null)

  const mult = applyEdge(2, houseEdge())

  const play = async () => {
    if (spinning) return
    const a = Math.round(bet * 100) / 100
    if (a <= 0 || a > balance) return
    if (!placeBet(a)) return
    setSpinning(true)
    setFlash(null)
    const { next } = createRng()
    const res = next() < 0.5 ? 'heads' : 'tails'
    if (animOn) await new Promise((r) => setTimeout(r, 700))
    setResult(res)
    const won = res === pick
    const payout = won ? Math.round(a * mult * 100) / 100 : 0
    setFlash(won ? 'win' : 'lose')
    if (soundOn) (won ? sounds.win : sounds.lose)()
    settle({ game: 'coinflip', amount: a, payout, detail: `${pick} vs ${res}` })
    setSpinning(false)
  }

  const sidebar = (
    <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-4">
      <BetControls bet={bet} setBet={setBet} disabled={spinning} />
      <div className="flex gap-2">
        <Button full variant={pick === 'heads' ? 'primary' : 'secondary'} disabled={spinning} onClick={() => setPick('heads')}>Heads</Button>
        <Button full variant={pick === 'tails' ? 'accent' : 'secondary'} disabled={spinning} onClick={() => setPick('tails')}>Tails</Button>
      </div>
      <p className="text-sm text-nv-muted">Payout {formatMult(mult)}</p>
      <Button variant="success" full disabled={spinning || bet <= 0 || bet > balance} onClick={play}>Flip · ${formatMoney(bet)}</Button>
    </div>
  )

  return (
    <GameShell gameId="coinflip" sidebar={sidebar}>
      <div className={`flex flex-col items-center justify-center min-h-[280px] ${flash === 'win' ? 'anim-win' : flash === 'lose' ? 'anim-lose' : ''}`}>
        <motion.div
          animate={spinning ? { rotateY: 720 } : { rotateY: 0 }}
          transition={{ duration: animOn ? 0.7 : 0 }}
          className="h-36 w-36 rounded-full border-4 border-nv-amber bg-gradient-to-br from-nv-amber to-orange-600 flex items-center justify-center text-2xl font-black text-black shadow-lg"
        >
          {result === 'tails' ? 'T' : 'H'}
        </motion.div>
        <p className="mt-4 text-nv-muted capitalize">{result ?? 'Ready'} · You picked {pick}</p>
      </div>
    </GameShell>
  )
}
