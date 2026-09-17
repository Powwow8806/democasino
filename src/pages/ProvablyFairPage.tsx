import { createRng, randomSeed } from '../lib/rng'
import { useState } from 'react'
import { Button } from '../components/ui/Button'

export function ProvablyFairPage() {
  const [seed, setSeed] = useState(() => randomSeed())
  const [rolls, setRolls] = useState<number[]>([])

  const run = () => {
    const { next } = createRng(seed)
    const out: number[] = []
    for (let i = 0; i < 10; i++) out.push(Math.floor(next() * 10000) / 100)
    setRolls(out)
  }

  return (
    <div className="mx-auto max-w-2xl px-3 sm:px-4 space-y-4">
      <h1 className="text-2xl font-bold">Provably Fair (Demo Style)</h1>
      <p className="text-nv-muted text-sm leading-relaxed">
        NeonVault uses a seeded Mulberry32 PRNG for game outcomes. Each round can be associated with a numeric
        seed. This page lets you verify that the same seed always produces the same sequence — a simplified
        illustration of provably-fair concepts for this <strong>play-money demo</strong>.
      </p>
      <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-3">
        <label className="block text-xs text-nv-muted uppercase">Seed</label>
        <input
          type="number"
          value={seed}
          onChange={(e) => setSeed(Number(e.target.value) >>> 0)}
          className="w-full touch-target rounded-xl bg-nv-bg border border-nv-border px-3 outline-none focus:border-nv-cyan"
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={run}>Generate 10 rolls</Button>
          <Button onClick={() => setSeed(randomSeed())}>New random seed</Button>
        </div>
        {rolls.length > 0 && (
          <ol className="text-sm font-mono space-y-1 text-nv-cyan">
            {rolls.map((r, i) => (
              <li key={i}>
                #{i + 1}: {r.toFixed(2)}
              </li>
            ))}
          </ol>
        )}
      </div>
      <p className="text-xs text-nv-muted">
        DEMO MODE — PLAY MONEY ONLY. Outcomes are simulated locally in your browser. No real-money gambling.
      </p>
    </div>
  )
}
