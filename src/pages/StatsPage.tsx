import { useWallet } from '../store/wallet'
import { formatMoney, formatMult, formatPct } from '../lib/format'
import { RecentBets } from '../components/wallet/RecentBets'
import { START_BALANCE_AMOUNT } from '../store/wallet'

export function StatsPage() {
  const stats = useWallet((s) => s.stats)
  const balance = useWallet((s) => s.balance)
  const profit = balance - START_BALANCE_AMOUNT
  const winRate = stats.wins + stats.losses > 0 ? stats.wins / (stats.wins + stats.losses) : 0

  const items = [
    { label: 'Session profit', value: `${profit >= 0 ? '+' : ''}$${formatMoney(profit)}`, color: profit >= 0 ? 'text-nv-green' : 'text-nv-red' },
    { label: 'Total wagered', value: `$${formatMoney(stats.totalWagered)}` },
    { label: 'Total returned', value: `$${formatMoney(stats.totalWon)}` },
    { label: 'Biggest win', value: `$${formatMoney(stats.biggestWin)}` },
    { label: 'Biggest multiplier', value: formatMult(stats.biggestMultiplier) },
    { label: 'Win rate', value: formatPct(winRate) },
    { label: 'Bets placed', value: String(stats.bets) },
    { label: 'Wins / Losses', value: `${stats.wins} / ${stats.losses}` },
  ]

  return (
    <div className="mx-auto max-w-3xl px-3 sm:px-4 space-y-6">
      <h1 className="text-2xl font-bold">Session Stats</h1>
      <div className="grid grid-cols-2 gap-3">
        {items.map((i) => (
          <div key={i.label} className="rounded-2xl border border-nv-border bg-nv-panel p-4">
            <div className="text-xs text-nv-muted uppercase tracking-wider">{i.label}</div>
            <div className={`text-xl font-bold mt-1 tabular-nums ${i.color ?? ''}`}>{i.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-nv-border bg-nv-panel p-4">
        <h2 className="font-semibold mb-3">Recent Bets</h2>
        <RecentBets limit={20} />
      </div>
    </div>
  )
}
