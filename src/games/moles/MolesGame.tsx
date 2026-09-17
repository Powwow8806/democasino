import { useState } from 'react'
import { GameShell } from '../../components/game/GameShell'
import { BetControls } from '../../components/wallet/BetControls'
import { Button } from '../../components/ui/Button'
import { useWallet } from '../../store/wallet'
import { applyEdge } from '../../lib/ev'
import { formatMoney, formatMult } from '../../lib/format'
import { createRng, shuffle } from '../../lib/rng'
import { sounds } from '../../lib/sound'

const HOLES = 9

export function MolesGame() {
  const placeBet = useWallet((s) => s.placeBet)
  const settle = useWallet((s) => s.settle)
  const houseEdge = useWallet((s) => s.houseEdge)
  const soundOn = useWallet((s) => s.soundEnabled)
  const balance = useWallet((s) => s.balance)

  const [bet, setBet] = useState(10)
  const [traps, setTraps] = useState(3)
  const [active, setActive] = useState(false)
  const [bad, setBad] = useState<Set<number>>(new Set())
  const [hit, setHit] = useState<Set<number>>(new Set())
  const [flash, setFlash] = useState<'win' | 'lose' | null>(null)

  const revealed = hit.size
  const fair = revealed === 0 ? 1 : (() => {
    let m = 1
    const safe = HOLES - traps
    for (let i = 0; i < revealed; i++) m *= (HOLES - i) / (safe - i)
    return m
  })()
  const mult = revealed === 0 ? 1 : applyEdge(fair, houseEdge())

  const start = () => {
    if (active) return
    const a = Math.round(bet * 100) / 100
    if (a <= 0 || a > balance) return
    if (!placeBet(a)) return
    const { next } = createRng()
    const idx = shuffle(Array.from({ length: HOLES }, (_, i) => i), next).slice(0, traps)
    setBad(new Set(idx))
    setHit(new Set())
    setFlash(null)
    setActive(true)
    if (soundOn) sounds.click()
  }

  const whack = (i: number) => {
    if (!active || hit.has(i)) return
    if (bad.has(i)) {
      setActive(false)
      setFlash('lose')
      setHit((h) => new Set(h).add(i))
      if (soundOn) sounds.lose()
      settle({ game: 'moles', amount: bet, payout: 0, detail: 'Bomb mole' })
      return
    }
    const nextHit = new Set(hit).add(i)
    setHit(nextHit)
    if (soundOn) sounds.reveal()
    if (nextHit.size >= HOLES - traps) {
      const m = applyEdge(
        (() => {
          let x = 1
          const safe = HOLES - traps
          for (let j = 0; j < safe; j++) x *= (HOLES - j) / (safe - j)
          return x
        })(),
        houseEdge(),
      )
      const payout = Math.round(bet * m * 100) / 100
      setActive(false)
      setFlash('win')
      if (soundOn) sounds.cashout()
      settle({ game: 'moles', amount: bet, payout, detail: `Cleared · ${formatMult(m)}` })
    }
  }

  const cashOut = () => {
    if (!active || revealed === 0) return
    const payout = Math.round(bet * mult * 100) / 100
    setActive(false)
    setFlash('win')
    if (soundOn) sounds.cashout()
    settle({ game: 'moles', amount: bet, payout, detail: formatMult(mult) })
  }

  const sidebar = (
    <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-4">
      <BetControls bet={bet} setBet={setBet} disabled={active} />
      <div>
        <label className="text-xs text-nv-muted uppercase">Bomb moles: {traps}</label>
        <input type="range" min={1} max={5} value={traps} disabled={active} onChange={(e) => setTraps(Number(e.target.value))} className="w-full accent-nv-green" />
      </div>
      {!active ? (
        <Button variant="primary" full disabled={bet <= 0 || bet > balance} onClick={start}>Start</Button>
      ) : (
        <>
          <div className="flex justify-between text-sm"><span className="text-nv-muted">Mult</span><span className="text-nv-green font-bold">{formatMult(mult)}</span></div>
          <Button variant="success" full disabled={revealed === 0} onClick={cashOut}>Cash Out ${formatMoney(bet * mult)}</Button>
        </>
      )}
    </div>
  )

  return (
    <GameShell gameId="moles" sidebar={sidebar}>
      <div className={`grid grid-cols-3 gap-3 max-w-sm mx-auto ${flash === 'win' ? 'anim-win' : flash === 'lose' ? 'anim-lose' : ''}`}>
        {Array.from({ length: HOLES }, (_, i) => {
          const isHit = hit.has(i)
          const isBad = (!active && bad.has(i)) || (isHit && bad.has(i))
          return (
            <button
              key={i}
              type="button"
              disabled={!active || isHit}
              onClick={() => whack(i)}
              className={`touch-target aspect-square rounded-full border-4 text-2xl ${
                isBad ? 'bg-nv-red/40 border-nv-red' : isHit ? 'bg-nv-green/30 border-nv-green' : 'bg-nv-card border-nv-border hover:border-nv-green/50'
              }`}
            >
              {isBad ? '💣' : isHit ? '🐹' : '🕳️'}
            </button>
          )
        })}
      </div>
    </GameShell>
  )
}
