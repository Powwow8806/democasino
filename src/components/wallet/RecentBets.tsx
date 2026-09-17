import { useWallet } from '../../store/wallet'
import { formatMoney, formatMult } from '../../lib/format'
import { getGame } from '../../lib/games'

export function RecentBets({ limit = 8 }: { limit?: number }) {
  const bets = useWallet((s) => s.recentBets).slice(0, limit)
  if (!bets.length) {
    return <p className="text-sm text-nv-muted">No bets yet — play a game!</p>
  }
  return (
    <ul className="space-y-2">
      {bets.map((b) => {
        const g = getGame(b.game)
        return (
          <li
            key={b.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-nv-bg/60 border border-nv-border/60 px-3 py-2 text-sm"
          >
            <span className="truncate text-nv-muted">{g?.name ?? b.game}</span>
            <span className={b.payout >= b.amount ? 'text-nv-green' : 'text-nv-red'}>
              {b.payout >= b.amount ? '+' : ''}
              ${formatMoney(b.payout - b.amount)} · {formatMult(b.multiplier)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
