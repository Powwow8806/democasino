import { useMemo, useState } from 'react'
import { GameShell } from '../../components/game/GameShell'
import { BetControls } from '../../components/wallet/BetControls'
import { Button } from '../../components/ui/Button'
import { useWallet } from '../../store/wallet'
import { payoutFromChance } from '../../lib/ev'
import { formatMoney, formatMult, formatPct, clamp } from '../../lib/format'
import { createRng } from '../../lib/rng'
import { sounds } from '../../lib/sound'

export function DiceGame() {
  const placeBet = useWallet((s) => s.placeBet)
  const settle = useWallet((s) => s.settle)
  const houseEdge = useWallet((s) => s.houseEdge)
  const soundOn = useWallet((s) => s.soundEnabled)
  const balance = useWallet((s) => s.balance)

  const [bet, setBet] = useState(10)
  const [target, setTarget] = useState(50)
  const [rollOver, setRollOver] = useState(true)
  const [lastRoll, setLastRoll] = useState<number | null>(null)
  const [history, setHistory] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [auto, setAuto] = useState(false)
  const [autoLeft, setAutoLeft] = useState(0)
  const [flash, setFlash] = useState<'win' | 'lose' | null>(null)

  const winChance = useMemo(() => (rollOver ? (100 - target) / 100 : target / 100), [rollOver, target])
  const mult = payoutFromChance(winChance, houseEdge())

  const playOnce = async (): Promise<boolean> => {
    const a = Math.round(bet * 100) / 100
    if (a <= 0 || a > useWallet.getState().balance) return false
    if (!placeBet(a)) return false
    const { next } = createRng()
    const roll = Math.floor(next() * 10000) / 100
    const won = rollOver ? roll > target : roll < target
    const payout = won ? Math.round(a * mult * 100) / 100 : 0
    setLastRoll(roll)
    setHistory((h) => [...h.slice(-39), roll])
    setFlash(won ? 'win' : 'lose')
    if (soundOn) (won ? sounds.win : sounds.lose)()
    settle({
      game: 'dice',
      amount: a,
      payout,
      detail: `${rollOver ? 'Over' : 'Under'} ${target} · rolled ${roll.toFixed(2)}`,
    })
    return true
  }

  const onBet = async () => {
    if (busy) return
    setBusy(true)
    await playOnce()
    setBusy(false)
  }

  const startAuto = async () => {
    if (busy || auto) return
    setAuto(true)
    setBusy(true)
    let left = autoLeft > 0 ? autoLeft : 10
    setAutoLeft(left)
    while (left > 0) {
      const ok = await playOnce()
      if (!ok) break
      left -= 1
      setAutoLeft(left)
      await new Promise((r) => setTimeout(r, 350))
      if (!useWallet.getState().balance || bet > useWallet.getState().balance) break
    }
    setAuto(false)
    setBusy(false)
  }

  const sidebar = (
    <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-4">
      <BetControls bet={bet} setBet={setBet} disabled={busy} />
      <div className="flex gap-2">
        <Button full variant={rollOver ? 'primary' : 'secondary'} disabled={busy} onClick={() => setRollOver(true)}>
          Roll Over
        </Button>
        <Button full variant={!rollOver ? 'primary' : 'secondary'} disabled={busy} onClick={() => setRollOver(false)}>
          Roll Under
        </Button>
      </div>
      <div>
        <label className="text-xs text-nv-muted uppercase">Target: {target.toFixed(2)}</label>
        <input
          type="range"
          min={2}
          max={98}
          step={0.01}
          value={target}
          disabled={busy}
          onChange={(e) => setTarget(clamp(Number(e.target.value), 2, 98))}
          className="w-full accent-nv-purple"
        />
      </div>
      <div className="rounded-xl bg-nv-bg border border-nv-border p-3 text-sm space-y-1">
        <div className="flex justify-between"><span className="text-nv-muted">Win chance</span><span>{formatPct(winChance)}</span></div>
        <div className="flex justify-between"><span className="text-nv-muted">Payout</span><span className="text-nv-purple font-bold">{formatMult(mult)}</span></div>
        <div className="flex justify-between"><span className="text-nv-muted">Profit on win</span><span className="text-nv-green">${formatMoney(bet * mult - bet)}</span></div>
      </div>
      <Button variant="primary" full disabled={busy || bet <= 0 || bet > balance} onClick={onBet}>
        Roll
      </Button>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          min={1}
          max={100}
          value={autoLeft || 10}
          disabled={busy}
          onChange={(e) => setAutoLeft(clamp(Number(e.target.value), 1, 100))}
          className="w-20 touch-target rounded-xl bg-nv-bg border border-nv-border px-2"
        />
        <Button full variant="accent" disabled={busy} onClick={startAuto}>
          Auto Bet
        </Button>
      </div>
    </div>
  )

  const minH = history.length ? Math.min(...history) : 0
  const maxH = history.length ? Math.max(...history) : 100

  return (
    <GameShell gameId="dice" sidebar={sidebar}>
      <div className={`flex flex-col items-center gap-6 ${flash === 'win' ? 'anim-win' : flash === 'lose' ? 'anim-lose' : ''}`}>
        <div className="text-6xl sm:text-7xl font-black tabular-nums text-nv-purple">
          {lastRoll !== null ? lastRoll.toFixed(2) : '—'}
        </div>
        <p className="text-sm text-nv-muted">
          {rollOver ? `Roll over ${target}` : `Roll under ${target}`} · {formatMult(mult)}
        </p>
        <div className="w-full max-w-md h-32 rounded-xl bg-nv-bg border border-nv-border p-2">
          <svg viewBox="0 0 400 100" className="w-full h-full">
            {history.length > 1 && (
              <polyline
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
                points={history
                  .map((v, i) => {
                    const x = (i / Math.max(1, history.length - 1)) * 400
                    const y = 100 - ((v - minH) / Math.max(1, maxH - minH)) * 90 - 5
                    return `${x},${y}`
                  })
                  .join(' ')}
              />
            )}
            {history.map((v, i) => {
              const x = (i / Math.max(1, history.length - 1)) * 400
              const y = 100 - ((v - minH) / Math.max(1, maxH - minH)) * 90 - 5
              const won = rollOver ? v > target : v < target
              return <circle key={i} cx={x} cy={y} r="3" fill={won ? '#34d399' : '#f43f5e'} />
            })}
          </svg>
        </div>
      </div>
    </GameShell>
  )
}
