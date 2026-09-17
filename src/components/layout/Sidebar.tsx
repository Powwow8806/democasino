import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { GAMES } from '../../lib/games'
import { useWallet } from '../../store/wallet'
import { Search, X, Sparkles, History, Star, Dice5, Spade, Cherry } from 'lucide-react'
import { useMemo, useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: Props) {
  const [q, setQ] = useState('')
  const favourites = useWallet((s) => s.favourites)
  const recent = useWallet((s) => s.recentGames)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return GAMES
    return GAMES.filter((g) => g.name.toLowerCase().includes(term) || g.category.includes(term))
  }, [q])

  const originals = filtered.filter((g) => g.category === 'originals')
  const classics = filtered.filter((g) => g.category === 'classics')
  const slots = filtered.filter((g) => g.category === 'slots')
  const favGames = GAMES.filter((g) => favourites.includes(g.id))
  const recentGames = recent.map((id) => GAMES.find((g) => g.id === id)).filter(Boolean)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm touch-target transition ${
      isActive ? 'bg-nv-cyan/15 text-nv-cyan border border-nv-cyan/30' : 'text-nv-muted hover:text-nv-text hover:bg-white/5'
    }`

  const Section = ({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) => (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-2 px-3 text-[11px] uppercase tracking-wider text-nv-muted">
        {icon}
        {title}
      </div>
      <nav className="space-y-1">{children}</nav>
    </div>
  )

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 py-4 border-b border-nv-border">
        <NavLink to="/" onClick={onClose} className="flex items-center gap-2 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-nv-cyan to-nv-purple flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-black" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-nv-text truncate">NeonVault</div>
            <div className="text-[10px] text-nv-cyan truncate">DEMO · PLAY MONEY</div>
          </div>
        </NavLink>
        <button type="button" className="lg:hidden touch-target rounded-lg p-2 text-nv-muted" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-nv-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search games…"
            className="w-full touch-target rounded-xl bg-nv-bg border border-nv-border pl-9 pr-3 text-sm outline-none focus:border-nv-cyan"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-6">
        {favGames.length > 0 && (
          <Section title="Favourites" icon={<Star size={12} />}>
            {favGames.map((g) => (
              <NavLink key={g.id} to={g.path} onClick={onClose} className={linkClass}>
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: g.accent }} />
                {g.name}
              </NavLink>
            ))}
          </Section>
        )}
        {recentGames.length > 0 && (
          <Section title="Recently played" icon={<History size={12} />}>
            {recentGames.map((g) =>
              g ? (
                <NavLink key={g.id} to={g.path} onClick={onClose} className={linkClass}>
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: g.accent }} />
                  {g.name}
                </NavLink>
              ) : null,
            )}
          </Section>
        )}
        <Section title="Originals" icon={<Dice5 size={12} />}>
          {originals.map((g) => (
            <NavLink key={g.id} to={g.path} onClick={onClose} className={linkClass}>
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: g.accent }} />
              {g.name}
              {!g.available && <span className="ml-auto text-[10px] text-nv-muted">Soon</span>}
            </NavLink>
          ))}
        </Section>
        <Section title="Classics" icon={<Spade size={12} />}>
          {classics.map((g) => (
            <NavLink key={g.id} to={g.path} onClick={onClose} className={linkClass}>
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: g.accent }} />
              {g.name}
            </NavLink>
          ))}
        </Section>
        <Section title="Slots" icon={<Cherry size={12} />}>
          {slots.map((g) => (
            <NavLink key={g.id} to={g.path} onClick={onClose} className={linkClass}>
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: g.accent }} />
              {g.name}
            </NavLink>
          ))}
        </Section>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-nv-border bg-nv-panel h-[calc(100dvh-var(--demo-banner,28px))] sticky top-[var(--demo-banner,28px)]">
        {content}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[min(100%,300px)] bg-nv-panel border-r border-nv-border shadow-2xl transition-transform duration-300 pt-[env(safe-area-inset-top)] ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {content}
        </aside>
      </div>
    </>
  )
}
