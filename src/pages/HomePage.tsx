import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GAMES } from '../lib/games'
import { useWallet } from '../store/wallet'
import { formatMoney } from '../lib/format'
import { TrendingUp, Users, Zap } from 'lucide-react'

const HIGH_ROLLERS = [
  { name: 'NovaRex', game: 'Crash', amount: 42850.0 },
  { name: 'CyanFox', game: 'Mines', amount: 18220.5 },
  { name: 'VaultKitty', game: 'Plinko', amount: 9100.0 },
  { name: 'PixelAce', game: 'Roulette', amount: 15600.0 },
  { name: 'Aurora99', game: 'Neon Reels', amount: 27400.25 },
]

export function HomePage() {
  const stats = useWallet((s) => s.stats)
  const balance = useWallet((s) => s.balance)
  const originals = GAMES.filter((g) => g.category === 'originals')
  const classics = GAMES.filter((g) => g.category === 'classics')
  const slots = GAMES.filter((g) => g.category === 'slots')

  const Card = ({ g }: { g: (typeof GAMES)[0] }) => (
    <Link to={g.path} className="group block">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="rounded-2xl border border-nv-border bg-nv-card p-4 h-full hover:border-nv-cyan/40 transition neon-glow"
        style={{ ['--glow' as string]: g.accent }}
      >
        <div
          className="mb-3 h-24 sm:h-28 rounded-xl flex items-center justify-center text-3xl font-black tracking-tight"
          style={{
            background: `linear-gradient(135deg, ${g.accent}33, transparent 70%), #0e0e14`,
            color: g.accent,
          }}
        >
          {g.name.split(' ')[0].slice(0, 2).toUpperCase()}
        </div>
        <h3 className="font-semibold group-hover:text-nv-cyan transition">{g.name}</h3>
        <p className="text-xs text-nv-muted mt-1 line-clamp-2">{g.description}</p>
      </motion.div>
    </Link>
  )

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-4 space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-nv-border bg-gradient-to-br from-nv-panel via-nv-card to-nv-bg p-6 sm:p-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-nv-cyan/20 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-nv-purple/20 blur-3xl" />
        <div className="relative">
          <p className="text-nv-cyan text-xs font-semibold tracking-widest uppercase mb-2">Social Casino Demo</p>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight mb-3">
            NeonVault
            <span className="block text-lg sm:text-2xl font-semibold text-nv-muted mt-1">
              Play-money thrills. Zero real risk.
            </span>
          </h1>
          <p className="max-w-xl text-nv-muted text-sm sm:text-base mb-6">
            Mines, Crash, Plinko, Roulette, Blackjack, original slots and more — all running on shared demo
            balance with a global EV slider. No deposits. No withdrawals. No crypto.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/games/mines"
              className="touch-target inline-flex items-center rounded-xl bg-nv-cyan px-5 py-3 font-semibold text-black"
            >
              Play Mines
            </Link>
            <Link
              to="/stats"
              className="touch-target inline-flex items-center rounded-xl border border-nv-border bg-nv-panel px-5 py-3"
            >
              Session Stats
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-nv-muted">
              <Zap size={16} className="text-nv-amber" /> Balance ${formatMoney(balance)}
            </div>
            <div className="flex items-center gap-2 text-nv-muted">
              <TrendingUp size={16} className="text-nv-green" /> Wagered ${formatMoney(stats.totalWagered)}
            </div>
            <div className="flex items-center gap-2 text-nv-muted">
              <Users size={16} className="text-nv-purple" /> Live demo lobby
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Sim. players online', value: '1,284' },
          { label: 'Bets this minute', value: '392' },
          { label: 'Biggest sim. win', value: '$84,220' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-nv-border bg-nv-panel p-4 text-center">
            <div className="text-2xl font-bold text-nv-cyan">{s.value}</div>
            <div className="text-xs text-nv-muted mt-1">{s.label}</div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Originals</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {originals.map((g) => (
            <Card key={g.id} g={g} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Classics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {classics.map((g) => (
            <Card key={g.id} g={g} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Slots</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {slots.map((g) => (
            <Card key={g.id} g={g} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-nv-border bg-nv-panel p-4 sm:p-6">
        <h2 className="text-lg font-bold mb-3">Simulated High Rollers</h2>
        <ul className="space-y-2">
          {HIGH_ROLLERS.map((h) => (
            <li
              key={h.name}
              className="flex items-center justify-between gap-2 rounded-xl bg-nv-bg/50 border border-nv-border/50 px-3 py-2.5 text-sm"
            >
              <span>
                <span className="font-semibold text-nv-cyan">{h.name}</span>
                <span className="text-nv-muted"> won on {h.game}</span>
              </span>
              <span className="text-nv-green font-semibold tabular-nums">${formatMoney(h.amount)}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-nv-muted mt-3">Simulated feed for demo atmosphere — not real players.</p>
      </section>
    </div>
  )
}
