import { useWallet } from '../../store/wallet'
import { formatMoney } from '../../lib/format'
import { Button } from '../ui/Button'

const PRESETS = [1, 5, 10, 25, 50, 100, 250, 500, 1000]

interface Props {
  bet: number
  setBet: (n: number) => void
  disabled?: boolean
  min?: number
  maxOverride?: number
}

export function BetControls({ bet, setBet, disabled, min = 0.01, maxOverride }: Props) {
  const balance = useWallet((s) => s.balance)
  const max = maxOverride ?? balance

  const setSafe = (n: number) => {
    if (!Number.isFinite(n)) return
    const v = Math.round(Math.max(min, Math.min(max, n)) * 100) / 100
    setBet(v)
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs text-nv-muted uppercase tracking-wider">Bet Amount</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-nv-muted text-sm">$</span>
          <input
            type="number"
            inputMode="decimal"
            min={min}
            step="0.01"
            value={bet}
            disabled={disabled}
            onChange={(e) => setSafe(parseFloat(e.target.value))}
            className="w-full touch-target rounded-xl bg-nv-bg border border-nv-border pl-7 pr-3 py-2.5 text-nv-text outline-none focus:border-nv-cyan"
          />
        </div>
        <Button disabled={disabled} onClick={() => setSafe(bet / 2)} className="px-3 shrink-0">½</Button>
        <Button disabled={disabled} onClick={() => setSafe(bet * 2)} className="px-3 shrink-0">2×</Button>
        <Button disabled={disabled} onClick={() => setSafe(max)} className="px-3 shrink-0">Max</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled || p > balance}
            onClick={() => setSafe(p)}
            className="touch-target rounded-lg border border-nv-border bg-nv-card px-3 text-xs text-nv-muted hover:text-nv-text hover:border-nv-cyan/50 disabled:opacity-30"
          >
            ${p}
          </button>
        ))}
      </div>
      <p className="text-xs text-nv-muted">Balance: ${formatMoney(balance)}</p>
    </div>
  )
}
