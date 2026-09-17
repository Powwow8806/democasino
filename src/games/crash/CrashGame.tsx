import { useEffect, useRef, useState } from 'react'
import { GameShell } from '../../components/game/GameShell'
import { BetControls } from '../../components/wallet/BetControls'
import { Button } from '../../components/ui/Button'
import { useWallet } from '../../store/wallet'
import { crashPoint } from '../../lib/rng'
import { createRng } from '../../lib/rng'
import { formatMoney, formatMult, clamp } from '../../lib/format'
import { sounds } from '../../lib/sound'

type Phase = 'idle' | 'running' | 'crashed'

export function CrashGame() {
  const placeBet = useWallet((s) => s.placeBet)
  const settle = useWallet((s) => s.settle)
  const houseEdge = useWallet((s) => s.houseEdge)
  const soundOn = useWallet((s) => s.soundEnabled)
  const balance = useWallet((s) => s.balance)

  const [bet, setBet] = useState(10)
  const [phase, setPhase] = useState<Phase>('idle')
  const [display, setDisplay] = useState(1)
  const [crashAt, setCrashAt] = useState(1)
  const [autoCash, setAutoCash] = useState(2)
  const [inRound, setInRound] = useState(false)
  const [cashedOut, setCashedOut] = useState(false)
  const [history, setHistory] = useState<number[]>([])
  const [flash, setFlash] = useState<'win' | 'lose' | null>(null)
  const raf = useRef<number>(0)
  const startTs = useRef(0)
  const crashRef = useRef(1)
  const betRef = useRef(bet)
  const autoRef = useRef(autoCash)
  const cashedRef = useRef(false)
  const inRoundRef = useRef(false)

  useEffect(() => { betRef.current = bet }, [bet])
  useEffect(() => { autoRef.current = autoCash }, [autoCash])

  const doCash = (mult: number) => {
    if (!inRoundRef.current || cashedRef.current) return
    cashedRef.current = true
    setCashedOut(true)
    const a = betRef.current
    const payout = Math.round(a * mult * 100) / 100
    settle({ game: 'crash', amount: a, payout, detail: `Cash @ ${formatMult(mult)}` })
    setFlash('win')
    if (soundOn) sounds.cashout()
  }

  const tick = (ts: number) => {
    if (!startTs.current) startTs.current = ts
    const elapsed = (ts - startTs.current) / 1000
    // exponential growth approx: 1 * e^(0.06*t) style
    const m = Math.floor(Math.pow(Math.E, 0.06 * elapsed) * 100) / 100
    const capped = Math.min(m, crashRef.current)
    setDisplay(capped)
    if (inRoundRef.current && !cashedRef.current && capped >= autoRef.current) {
      doCash(autoRef.current)
    }
    if (capped >= crashRef.current) {
      setPhase('crashed')
      setHistory((h) => [crashRef.current, ...h].slice(0, 20))
      if (inRoundRef.current && !cashedRef.current) {
        settle({ game: 'crash', amount: betRef.current, payout: 0, detail: `Crashed @ ${formatMult(crashRef.current)}` })
        setFlash('lose')
        if (soundOn) sounds.lose()
      }
      inRoundRef.current = false
      setInRound(false)
      return
    }
    raf.current = requestAnimationFrame(tick)
  }

  const start = () => {
    if (phase === 'running') return
    const a = Math.round(bet * 100) / 100
    const join = a > 0 && a <= balance
    if (join) {
      if (!placeBet(a)) return
      inRoundRef.current = true
      setInRound(true)
    } else {
      inRoundRef.current = false
      setInRound(false)
    }
    cashedRef.current = false
    setCashedOut(false)
    setFlash(null)
    const { next } = createRng()
    const point = crashPoint(next, houseEdge())
    crashRef.current = point
    setCrashAt(point)
    setDisplay(1)
    setPhase('running')
    startTs.current = 0
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(tick)
    if (soundOn) sounds.click()
  }

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const sidebar = (
    <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-4">
      <BetControls bet={bet} setBet={setBet} disabled={phase === 'running' && inRound} />
      <div>
        <label className="text-xs text-nv-muted uppercase">Auto cash-out</label>
        <input
          type="number"
          min={1.01}
          step={0.01}
          value={autoCash}
          disabled={phase === 'running'}
          onChange={(e) => setAutoCash(clamp(Number(e.target.value), 1.01, 100000))}
          className="w-full touch-target mt-1 rounded-xl bg-nv-bg border border-nv-border px-3"
        />
      </div>
      {phase !== 'running' ? (
        <Button variant="primary" full onClick={start}>
          {bet > 0 && bet <= balance ? `Bet $${formatMoney(bet)}` : 'Watch round'}
        </Button>
      ) : (
        <Button
          variant="success"
          full
          disabled={!inRound || cashedOut}
          onClick={() => doCash(display)}
        >
          Cash Out {formatMult(display)}
        </Button>
      )}
      <div className="flex flex-wrap gap-1">
        {history.map((h, i) => (
          <span key={i} className={`text-xs px-2 py-1 rounded-lg ${h >= 2 ? 'bg-nv-green/20 text-nv-green' : 'bg-nv-red/20 text-nv-red'}`}>
            {formatMult(h)}
          </span>
        ))}
      </div>
    </div>
  )

  return (
    <GameShell gameId="crash" sidebar={sidebar}>
      <div className={`relative min-h-[300px] rounded-xl bg-nv-bg border border-nv-border p-4 ${flash === 'win' ? 'anim-win' : flash === 'lose' ? 'anim-lose' : ''}`}>
        <div className={`text-5xl sm:text-7xl font-black tabular-nums text-center mt-8 ${phase === 'crashed' ? 'text-nv-red' : 'text-nv-cyan'}`}>
          {formatMult(display)}
        </div>
        <p className="text-center text-nv-muted mt-2 text-sm">
          {phase === 'idle' && 'Place a bet to join the next round'}
          {phase === 'running' && (inRound ? (cashedOut ? 'Cashed out!' : 'Running…') : 'Spectating')}
          {phase === 'crashed' && `Crashed at ${formatMult(crashAt)}`}
        </p>
        <svg viewBox="0 0 400 120" className="w-full mt-6 h-28">
          <polyline
            fill="none"
            stroke={phase === 'crashed' ? '#f43f5e' : '#22d3ee'}
            strokeWidth="3"
            points={Array.from({ length: 40 }, (_, i) => {
              const t = (i / 39) * Math.log(Math.max(1.01, display))
              const x = (i / 39) * 400
              const y = 110 - Math.min(100, (Math.exp(t) - 1) * 40)
              return `${x},${y}`
            }).join(' ')}
          />
        </svg>
      </div>
    </GameShell>
  )
}
