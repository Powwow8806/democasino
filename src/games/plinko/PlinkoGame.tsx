import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { GameShell } from '../../components/game/GameShell'
import { BetControls } from '../../components/wallet/BetControls'
import { Button } from '../../components/ui/Button'
import { useWallet } from '../../store/wallet'
import { plinkoMultipliers, simulatePlinko } from '../../lib/plinko'
import type { PlinkoRisk } from '../../types'
import { formatMoney, formatMult, clamp } from '../../lib/format'
import { sounds } from '../../lib/sound'

export function PlinkoGame({ jumbo = false }: { jumbo?: boolean }) {
  const placeBet = useWallet((s) => s.placeBet)
  const settle = useWallet((s) => s.settle)
  const houseEdge = useWallet((s) => s.houseEdge)
  const soundOn = useWallet((s) => s.soundEnabled)
  const animOn = useWallet((s) => s.animEnabled)
  const balance = useWallet((s) => s.balance)

  const [bet, setBet] = useState(10)
  const [rows, setRows] = useState(jumbo ? 16 : 12)
  const [risk, setRisk] = useState<PlinkoRisk>('medium')
  const [balls, setBalls] = useState(1)
  const [dropping, setDropping] = useState(false)
  const [activeBalls, setActiveBalls] = useState<{ id: number; bucket: number; path: number[] }[]>([])
  const [lastBuckets, setLastBuckets] = useState<number[]>([])

  const edge = houseEdge()
  const mults = useMemo(() => plinkoMultipliers(rows, risk, edge), [rows, risk, edge])

  const drop = async () => {
    if (dropping) return
    const count = clamp(balls, 1, jumbo ? 20 : 10)
    const a = Math.round(bet * 100) / 100
    const totalCost = Math.round(a * count * 100) / 100
    if (a <= 0 || totalCost > balance) return
    setDropping(true)
    const newBalls: { id: number; bucket: number; path: number[] }[] = []
    for (let i = 0; i < count; i++) {
      if (!placeBet(a)) break
      const sim = simulatePlinko(rows)
      newBalls.push({ id: Date.now() + i, bucket: sim.bucket, path: sim.path })
    }
    setActiveBalls(newBalls)
    if (soundOn) sounds.click()
    await new Promise((r) => setTimeout(r, animOn ? 900 + rows * 40 : 100))
    const buckets: number[] = []
    for (const b of newBalls) {
      const m = mults[b.bucket] ?? 0
      const payout = Math.round(a * m * 100) / 100
      buckets.push(b.bucket)
      settle({
        game: jumbo ? 'jumbo-plinko' : 'plinko',
        amount: a,
        payout,
        detail: `Row bucket ${b.bucket} · ${formatMult(m)}`,
      })
      if (soundOn) (payout >= a ? sounds.win : sounds.tick)()
    }
    setLastBuckets(buckets)
    setActiveBalls([])
    setDropping(false)
  }

  const sidebar = (
    <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-4">
      <BetControls bet={bet} setBet={setBet} disabled={dropping} />
      {!jumbo && (
        <div>
          <label className="text-xs text-nv-muted uppercase">Rows: {rows}</label>
          <input type="range" min={8} max={16} value={rows} disabled={dropping} onChange={(e) => setRows(Number(e.target.value))} className="w-full accent-nv-green" />
        </div>
      )}
      <div className="flex gap-2">
        {(['low', 'medium', 'high'] as PlinkoRisk[]).map((r) => (
          <Button key={r} full disabled={dropping} variant={risk === r ? 'primary' : 'secondary'} onClick={() => setRisk(r)} className="capitalize text-xs px-2">
            {r}
          </Button>
        ))}
      </div>
      <div>
        <label className="text-xs text-nv-muted uppercase">Balls: {balls}</label>
        <input type="range" min={1} max={jumbo ? 20 : 10} value={balls} disabled={dropping} onChange={(e) => setBalls(Number(e.target.value))} className="w-full accent-nv-green" />
      </div>
      <Button variant="success" full disabled={dropping || bet <= 0 || bet * balls > balance} onClick={drop}>
        Drop {balls > 1 ? `${balls} balls` : 'ball'}
      </Button>
    </div>
  )

  const width = jumbo ? 360 : 300
  const height = jumbo ? 420 : 340

  return (
    <GameShell gameId={jumbo ? 'jumbo-plinko' : 'plinko'} sidebar={sidebar}>
      <div className="flex flex-col items-center gap-3 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${jumbo ? 'max-w-lg' : 'max-w-md'}`}>
          {/* pegs */}
          {Array.from({ length: rows }, (_, r) =>
            Array.from({ length: r + 1 }, (_, c) => {
              const x = width / 2 - (r * 18) / 2 + c * 18
              const y = 30 + r * ((height - 80) / rows)
              return <circle key={`${r}-${c}`} cx={x} cy={y} r={jumbo ? 3.5 : 3} fill="#2a2a35" />
            }),
          )}
          {/* balls animating */}
          {activeBalls.map((b) => {
            let x = width / 2
            let y = 20
            // approximate final position from path
            const rights = b.path.reduce((s, d) => s + d, 0)
            const endX = width / 2 - (rows * 18) / 2 + rights * 18
            const endY = height - 40
            return (
              <motion.circle
                key={b.id}
                r={jumbo ? 7 : 6}
                fill="#34d399"
                initial={{ cx: x, cy: y }}
                animate={{ cx: endX, cy: endY }}
                transition={{ duration: animOn ? 0.9 + rows * 0.04 : 0.1, ease: 'easeIn' }}
              />
            )
          })}
          {/* buckets */}
          {mults.map((m, i) => {
            const x = width / 2 - ((mults.length - 1) * 18) / 2 + i * 18
            const hot = lastBuckets.includes(i)
            return (
              <g key={i}>
                <rect x={x - 8} y={height - 28} width={16} height={22} rx={3} fill={hot ? '#34d39955' : '#18181f'} stroke="#2a2a35" />
                <text x={x} y={height - 12} textAnchor="middle" fontSize="6" fill={m >= 1 ? '#34d399' : '#f43f5e'}>
                  {m >= 10 ? m.toFixed(0) : m.toFixed(1)}
                </text>
              </g>
            )
          })}
        </svg>
        <p className="text-xs text-nv-muted">Multipliers update with EV slider · DEMO PLAY MONEY</p>
      </div>
    </GameShell>
  )
}

export function JumboPlinkoGame() {
  return <PlinkoGame jumbo />
}
