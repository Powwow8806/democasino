import { Link } from 'react-router-dom'
import { Menu, Wallet, ChevronDown, Volume2, VolumeX, Sparkles, RotateCcw, BarChart3, Shield } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useWallet } from '../../store/wallet'
import { formatMoney } from '../../lib/format'
import { sliderToHouseEdge } from '../../lib/ev'

interface Props {
  onMenu: () => void
}

export function TopBar({ onMenu }: Props) {
  const balance = useWallet((s) => s.balance)
  const evSlider = useWallet((s) => s.evSlider)
  const setEvSlider = useWallet((s) => s.setEvSlider)
  const sound = useWallet((s) => s.soundEnabled)
  const setSound = useWallet((s) => s.setSound)
  const anim = useWallet((s) => s.animEnabled)
  const setAnim = useWallet((s) => s.setAnim)
  const reset = useWallet((s) => s.resetBalance)
  const edge = sliderToHouseEdge(evSlider)
  const [acctOpen, setAcctOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAcctOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <header className="sticky top-[var(--demo-banner,28px)] z-40 border-b border-nv-border bg-nv-panel/95 backdrop-blur">
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5">
        <button
          type="button"
          className="lg:hidden touch-target inline-flex items-center justify-center rounded-xl border border-nv-border bg-nv-card px-3"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <Link to="/" className="hidden sm:flex items-center gap-2 mr-2">
          <Sparkles size={18} className="text-nv-cyan" />
          <span className="font-bold">NeonVault</span>
        </Link>

        {/* EV Slider */}
        <div className="flex-1 min-w-0 max-w-md">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-nv-muted mb-0.5">
            <span className="text-nv-red">−EV</span>
            <span className="truncate px-1">
              House edge {edge >= 0 ? '+' : ''}
              {(edge * 100).toFixed(1)}%
            </span>
            <span className="text-nv-green">+EV</span>
          </div>
          <input
            type="range"
            min={-100}
            max={100}
            value={evSlider}
            onChange={(e) => setEvSlider(Number(e.target.value))}
            className="w-full h-2 accent-nv-cyan cursor-pointer"
            aria-label="Expected value slider"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-1.5 rounded-xl border border-nv-border bg-nv-card px-2.5 sm:px-3 py-2 touch-target">
            <Wallet size={16} className="text-nv-cyan shrink-0" />
            <span className="font-semibold text-sm sm:text-base tabular-nums">${formatMoney(balance)}</span>
          </div>

          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setAcctOpen((o) => !o)}
              className="touch-target inline-flex items-center gap-1 rounded-xl border border-nv-border bg-nv-card px-2.5 py-2 text-sm"
            >
              <span className="hidden sm:inline">Demo</span>
              <ChevronDown size={16} />
            </button>
            {acctOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-nv-border bg-nv-panel shadow-xl py-2 z-50">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 touch-target"
                  onClick={() => { setSound(!sound); }}
                >
                  {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  Sound {sound ? 'On' : 'Off'}
                </button>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 touch-target"
                  onClick={() => setAnim(!anim)}
                >
                  <Sparkles size={16} />
                  Animations {anim ? 'On' : 'Off'}
                </button>
                <Link
                  to="/stats"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 touch-target"
                  onClick={() => setAcctOpen(false)}
                >
                  <BarChart3 size={16} /> Session Stats
                </Link>
                <Link
                  to="/provably-fair"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 touch-target"
                  onClick={() => setAcctOpen(false)}
                >
                  <Shield size={16} /> Provably Fair
                </Link>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-nv-amber hover:bg-white/5 touch-target"
                  onClick={() => {
                    if (confirm('Reset play-money balance to $100,000.00 and clear session stats?')) {
                      reset()
                      setAcctOpen(false)
                    }
                  }}
                >
                  <RotateCcw size={16} /> Reset Balance
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
