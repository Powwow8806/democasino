import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import type { GameId } from '../../types'
import { getGame } from '../../lib/games'
import { useWallet } from '../../store/wallet'
import { RecentBets } from '../wallet/RecentBets'
import { useEffect } from 'react'

interface Props {
  gameId: GameId
  children: ReactNode
  sidebar?: ReactNode
}

export function GameShell({ gameId, children, sidebar }: Props) {
  const game = getGame(gameId)
  const favs = useWallet((s) => s.favourites)
  const toggle = useWallet((s) => s.toggleFavourite)
  const touch = useWallet((s) => s.touchGame)
  const isFav = favs.includes(gameId)

  useEffect(() => {
    touch(gameId)
  }, [gameId, touch])

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 pb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="touch-target inline-flex items-center justify-center rounded-xl border border-nv-border bg-nv-card px-3 text-nv-muted hover:text-nv-text"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: game?.accent }}>
              {game?.name ?? gameId}
            </h1>
            <p className="text-xs text-nv-muted truncate">{game?.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => toggle(gameId)}
          className="touch-target inline-flex items-center justify-center rounded-xl border border-nv-border bg-nv-card px-3"
          aria-label="Favourite"
        >
          <Star size={18} className={isFav ? 'fill-nv-amber text-nv-amber' : 'text-nv-muted'} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-2xl border border-nv-border bg-nv-panel p-3 sm:p-5 min-h-[320px]">
          {children}
        </div>
        <div className="space-y-4">
          {sidebar}
          <div className="rounded-2xl border border-nv-border bg-nv-panel p-4">
            <h3 className="text-sm font-semibold mb-3 text-nv-muted uppercase tracking-wider">Recent Bets</h3>
            <RecentBets />
          </div>
        </div>
      </div>
    </div>
  )
}
