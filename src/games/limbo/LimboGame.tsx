import { useState } from 'react'
import { GameShell } from '../../components/game/GameShell'
import { BetControls } from '../../components/wallet/BetControls'
import { Button } from '../../components/ui/Button'
import { useWallet } from '../../store/wallet'
import { applyEdge } from '../../lib/ev'
import { formatMoney, formatMult, clamp } from '../../lib/format'
import { createRng } from '../../lib/rng'
import { sounds } from '../../lib/sound'

export function LimboGame() {
  const placeBet = useWallet((s) => s.placeBet)
  const settle = useWallet((s) => s.settle)
  const houseEdge = useWallet((s) => s.houseEdge)
  const soundOn = useWallet((s) => s.soundEnabled)
  const balance = useWallet((s) => s.balance)

  const [bet, setBet] = useState(10)
  const [target, setTarget] = useState(2)
  const [result, setResult] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<'win' | 'lose' | null>(null)

  const edge = houseEdge()
  const winChance = 1 / Math.max(1.01, target)
  const payoutMult = applyEdge(target, edge)

  const play = () => {
    if (busy) return
    const a = Math.round(bet * 100) / 100
    if (a <= 0 || a > balance) return
    if (!placeBet(a)) return
    setBusy(true)
    const { next } = createRng()
    // result multiplier distribution similar to crash
    const r = Math.max(1e-12, next())
    const res = Math.max(1, Math.floor(((1 - edge) / r) * 100) / 100)
    setResult(res)
    const won = res >= target
    const payout = won ? Math.round(a * payoutMult * 100) / 100 : 0
    setFlash(won ? 'win' : 'lose')
    if (soundOn) (won ? sounds.win : sounds.lose)()
    settle({ game: 'limbo', amount: a, payout, detail: `Target ${formatMult(target)} · got ${formatMult(res)}` })
    setBusy(false)
  }

  const sidebar = (
    <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-4">
      <BetControls bet={bet} setBet={setBet} disabled={busy} />
      <div>
        <label className="text-xs text-nv-muted uppercase">Target multiplier</label>
        <input
          type="number"
          min={1.01}
          step={0.01}
          value={target}
          disabled={busy}
          onChange={(e) => setTarget(clamp(Number(e.target.value), 1.01, 1000000))}
          className="w-full touch-target mt-1 rounded-xl bg-nv-bg border border-nv-border px-3 outline-none focus:border-nv-cyan"
        />
      </div>
      <div className="text-sm flex justify-between"><span className="text-nv-muted">Payout</span><span className="text-nv-cyan font-bold">{formatMult(payoutMult)}</span></div>
      <div className="text-sm flex justify-between"><span className="text-nv-muted">Win chance ≈</span><span>{(winChance * 100).toFixed(2)}%</span></div>
      <Button variant="primary" full disabled={busy || bet <= 0 || bet > balance} onClick={play}>Bet</Button>
    </div>
  )

  return (
    <GameShell gameId="limbo" sidebar={sidebar}>
      <div className={`flex flex-col items-center justify-center min-h-[280px] ${flash === 'win' ? 'anim-win' : flash === 'lose' ? 'anim-lose' : ''}`}>
        <div className="text-6xl sm:text-8xl font-black text-nv-cyan tabular-nums">
          {result !== null ? formatMult(result) : '1.00×'}
        </div>
        <p className="text-nv-muted mt-4">Target {formatMult(target)}</p>
      </div>
    </GameShell>
  )
}
