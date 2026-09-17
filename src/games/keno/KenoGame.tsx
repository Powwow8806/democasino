import { useMemo, useState } from 'react'
import { GameShell } from '../../components/game/GameShell'
import { BetControls } from '../../components/wallet/BetControls'
import { Button } from '../../components/ui/Button'
import { useWallet } from '../../store/wallet'
import { applyEdge } from '../../lib/ev'
import { formatMoney, formatMult } from '../../lib/format'
import { createRng, shuffle } from '../../lib/rng'
import { sounds } from '../../lib/sound'

/** Payout tables by picks → hits (fair-ish, then edged). */
const PAY: Record<number, Record<number, number>> = {
  1: { 1: 3.6 },
  2: { 2: 12 },
  3: { 2: 2.2, 3: 42 },
  4: { 2: 1.5, 3: 8, 4: 90 },
  5: { 3: 3.5, 4: 18, 5: 350 },
  6: { 3: 2.2, 4: 8, 5: 70, 6: 1400 },
  7: { 3: 1.5, 4: 5, 5: 25, 6: 200, 7: 5000 },
  8: { 4: 4, 5: 15, 6: 80, 7: 800, 8: 15000 },
  9: { 4: 2.5, 5: 8, 6: 40, 7: 300, 8: 3000, 9: 25000 },
  10: { 5: 5, 6: 20, 7: 100, 8: 1000, 9: 5000, 10: 50000 },
}

export function KenoGame() {
  const placeBet = useWallet((s) => s.placeBet)
  const settle = useWallet((s) => s.settle)
  const houseEdge = useWallet((s) => s.houseEdge)
  const soundOn = useWallet((s) => s.soundEnabled)
  const balance = useWallet((s) => s.balance)

  const [bet, setBet] = useState(10)
  const [picks, setPicks] = useState<Set<number>>(new Set())
  const [drawn, setDrawn] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [hits, setHits] = useState(0)
  const [flash, setFlash] = useState<'win' | 'lose' | null>(null)

  const toggle = (n: number) => {
    if (busy) return
    setPicks((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else if (next.size < 10) next.add(n)
      return next
    })
  }

  const play = async () => {
    if (busy || picks.size < 1) return
    const a = Math.round(bet * 100) / 100
    if (a <= 0 || a > balance) return
    if (!placeBet(a)) return
    setBusy(true)
    setFlash(null)
    const { next } = createRng()
    const nums = Array.from({ length: 40 }, (_, i) => i + 1)
    const draw = shuffle(nums, next).slice(0, 10)
    setDrawn(draw)
    const hit = draw.filter((n) => picks.has(n)).length
    setHits(hit)
    const table = PAY[picks.size] ?? {}
    const fair = table[hit] ?? 0
    const mult = fair > 0 ? applyEdge(fair, houseEdge()) : 0
    const payout = Math.round(a * mult * 100) / 100
    settle({ game: 'keno', amount: a, payout, detail: `${hit}/${picks.size} hits · ${formatMult(mult)}` })
    setFlash(payout > 0 ? 'win' : 'lose')
    if (soundOn) (payout > 0 ? sounds.win : sounds.lose)()
    setBusy(false)
  }

  const payPreview = useMemo(() => {
    const table = PAY[picks.size]
    if (!table) return null
    return Object.entries(table).map(([h, m]) => `${h}: ${formatMult(applyEdge(m, houseEdge()))}`)
  }, [picks.size, houseEdge])

  const sidebar = (
    <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-4">
      <BetControls bet={bet} setBet={setBet} disabled={busy} />
      <p className="text-sm text-nv-muted">Picked {picks.size}/10</p>
      {payPreview && <p className="text-xs text-nv-muted">Pays {payPreview.join(' · ')}</p>}
      <Button variant="primary" full disabled={busy || picks.size < 1 || bet <= 0 || bet > balance} onClick={play}>
        Draw
      </Button>
      <Button full disabled={busy} onClick={() => { setPicks(new Set()); setDrawn([]); }}>Clear</Button>
    </div>
  )

  return (
    <GameShell gameId="keno" sidebar={sidebar}>
      <div className={`${flash === 'win' ? 'anim-win' : flash === 'lose' ? 'anim-lose' : ''}`}>
        <div className="grid grid-cols-8 gap-1.5 max-w-lg mx-auto">
          {Array.from({ length: 40 }, (_, i) => i + 1).map((n) => {
            const sel = picks.has(n)
            const hit = drawn.includes(n) && sel
            const drawnMiss = drawn.includes(n) && !sel
            return (
              <button
                key={n}
                type="button"
                disabled={busy}
                onClick={() => toggle(n)}
                className={`touch-target aspect-square rounded-lg text-xs font-bold border ${
                  hit
                    ? 'bg-nv-green text-black border-nv-green'
                    : sel
                      ? 'bg-nv-cyan/30 border-nv-cyan text-nv-cyan'
                      : drawnMiss
                        ? 'bg-nv-red/20 border-nv-red/40'
                        : 'bg-nv-card border-nv-border'
                }`}
              >
                {n}
              </button>
            )
          })}
        </div>
        {drawn.length > 0 && <p className="text-center mt-4 text-nv-muted">Hits: {hits}</p>}
      </div>
    </GameShell>
  )
}
