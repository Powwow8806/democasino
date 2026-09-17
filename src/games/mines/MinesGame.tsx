import { useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GameShell } from '../../components/game/GameShell'
import { BetControls } from '../../components/wallet/BetControls'
import { Button } from '../../components/ui/Button'
import { useWallet } from '../../store/wallet'
import { GRID, minePositions, minesMultiplier } from '../../lib/mines'
import { formatMoney, formatMult } from '../../lib/format'
import { sounds } from '../../lib/sound'
import { randomSeed } from '../../lib/rng'

type CellState = 'hidden' | 'safe' | 'mine'

interface PrevGame {
  mines: number[]
  revealed: number[]
  mineCount: number
  won: boolean
  multiplier: number
}

export function MinesGame() {
  const placeBet = useWallet((s) => s.placeBet)
  const settle = useWallet((s) => s.settle)
  const houseEdge = useWallet((s) => s.houseEdge)
  const soundOn = useWallet((s) => s.soundEnabled)
  const animOn = useWallet((s) => s.animEnabled)
  const balance = useWallet((s) => s.balance)

  const [bet, setBet] = useState(10)
  const [mineCount, setMineCount] = useState(3)
  const [active, setActive] = useState(false)
  const [mines, setMines] = useState<Set<number>>(new Set())
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [cells, setCells] = useState<CellState[]>(Array(GRID).fill('hidden'))
  const [bust, setBust] = useState(false)
  const [cashed, setCashed] = useState(false)
  const [flash, setFlash] = useState<'win' | 'lose' | null>(null)
  const [prev, setPrev] = useState<PrevGame | null>(null)
  const [showPrev, setShowPrev] = useState(false)
  const [autoPickBusy, setAutoPickBusy] = useState(false)

  const edge = houseEdge()
  const safeRevealed = revealed.size
  const mult = minesMultiplier(mineCount, safeRevealed, edge)
  const nextMult = minesMultiplier(mineCount, safeRevealed + 1, edge)
  const potential = Math.round(bet * mult * 100) / 100
  const maxSafe = GRID - mineCount

  const resetBoard = () => {
    setCells(Array(GRID).fill('hidden'))
    setRevealed(new Set())
    setMines(new Set())
    setBust(false)
    setCashed(false)
    setFlash(null)
    setShowPrev(false)
  }

  const startGame = useCallback(() => {
    if (active) return
    const a = Math.round(bet * 100) / 100
    if (a <= 0 || a > balance) return
    if (!placeBet(a)) return
    if (soundOn) sounds.click()
    resetBoard()
    const positions = minePositions(mineCount, randomSeed())
    setMines(new Set(positions))
    setActive(true)
  }, [active, bet, balance, placeBet, mineCount, soundOn])

  const endLoss = useCallback(
    (mineSet: Set<number>, rev: Set<number>) => {
      setBust(true)
      setActive(false)
      setFlash('lose')
      if (soundOn) sounds.lose()
      settle({ game: 'mines', amount: bet, payout: 0, detail: `Hit mine · ${mineCount} mines` })
      setPrev({
        mines: [...mineSet],
        revealed: [...rev],
        mineCount,
        won: false,
        multiplier: 0,
      })
      setCells((c) => {
        const next = [...c]
        for (let i = 0; i < GRID; i++) {
          if (mineSet.has(i)) next[i] = 'mine'
          else if (rev.has(i)) next[i] = 'safe'
          else next[i] = 'safe'
        }
        return next
      })
    },
    [bet, mineCount, settle, soundOn],
  )

  const revealCell = useCallback(
    (idx: number) => {
      if (!active || bust || cashed) return
      if (revealed.has(idx)) return

      if (mines.has(idx)) {
        const rev = new Set(revealed)
        endLoss(mines, rev)
        return
      }

      const rev = new Set(revealed)
      rev.add(idx)
      setRevealed(rev)
      setCells((c) => {
        const next = [...c]
        next[idx] = 'safe'
        return next
      })
      if (soundOn) sounds.reveal()

      if (rev.size >= maxSafe) {
        const m = minesMultiplier(mineCount, rev.size, edge)
        const payout = Math.round(bet * m * 100) / 100
        setActive(false)
        setCashed(true)
        setFlash('win')
        if (soundOn) sounds.cashout()
        settle({ game: 'mines', amount: bet, payout, detail: `Cleared board · ${formatMult(m)}` })
        setPrev({
          mines: [...mines],
          revealed: [...rev],
          mineCount,
          won: true,
          multiplier: m,
        })
        setCells((c) => {
          const next = [...c]
          for (let i = 0; i < GRID; i++) {
            if (mines.has(i)) next[i] = 'mine'
            else next[i] = 'safe'
          }
          return next
        })
      }
    },
    [active, bust, cashed, revealed, mines, endLoss, soundOn, maxSafe, mineCount, edge, bet, settle],
  )

  const cashOut = () => {
    if (!active || bust || cashed || safeRevealed === 0) return
    const payout = potential
    setActive(false)
    setCashed(true)
    setFlash('win')
    if (soundOn) sounds.cashout()
    settle({ game: 'mines', amount: bet, payout, detail: `Cash out · ${formatMult(mult)}` })
    setPrev({
      mines: [...mines],
      revealed: [...revealed],
      mineCount,
      won: true,
      multiplier: mult,
    })
    setCells((c) => {
      const next = [...c]
      for (let i = 0; i < GRID; i++) {
        if (mines.has(i)) next[i] = 'mine'
        else if (revealed.has(i)) next[i] = 'safe'
        else next[i] = 'hidden'
      }
      return next
    })
  }

  const autoPick = async () => {
    if (!active || autoPickBusy || bust || cashed) return
    setAutoPickBusy(true)
    const hidden = Array.from({ length: GRID }, (_, i) => i).filter((i) => !revealed.has(i))
    if (!hidden.length) {
      setAutoPickBusy(false)
      return
    }
    const pick = hidden[Math.floor(Math.random() * hidden.length)]
    await new Promise((r) => setTimeout(r, animOn ? 180 : 0))
    revealCell(pick)
    setAutoPickBusy(false)
  }


  // Instant bet: start and immediately reveal random safe or bust
  const doInstant = () => {
    if (active) return
    const a = Math.round(bet * 100) / 100
    if (a <= 0 || a > balance) return
    if (!placeBet(a)) return
    if (soundOn) sounds.click()
    resetBoard()
    const positions = minePositions(mineCount, randomSeed())
    const mineSet = new Set(positions)
    setMines(mineSet)
    const pick = Math.floor(Math.random() * GRID)
    if (mineSet.has(pick)) {
      setRevealed(new Set())
      setActive(false)
      setBust(true)
      setFlash('lose')
      if (soundOn) sounds.lose()
      settle({ game: 'mines', amount: a, payout: 0, detail: `Instant · hit mine` })
      setPrev({ mines: positions, revealed: [], mineCount, won: false, multiplier: 0 })
      setCells(Array.from({ length: GRID }, (_, i) => (mineSet.has(i) ? 'mine' : 'safe')))
    } else {
      const rev = new Set([pick])
      setRevealed(rev)
      setCells(Array.from({ length: GRID }, (_, i) => (i === pick ? 'safe' : 'hidden')))
      setActive(true)
      if (soundOn) sounds.reveal()
    }
  }

  const showPrevious = () => {
    if (!prev) return
    setShowPrev(true)
    setActive(false)
    setCells(
      Array.from({ length: GRID }, (_, i) => {
        if (prev.mines.includes(i)) return 'mine'
        if (prev.revealed.includes(i)) return 'safe'
        return 'safe'
      }),
    )
  }

  const gridClass = useMemo(
    () => `grid grid-cols-5 gap-1.5 sm:gap-2 ${flash === 'win' ? 'anim-win' : flash === 'lose' ? 'anim-lose' : ''}`,
    [flash],
  )

  const sidebar = (
    <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-4">
      <BetControls bet={bet} setBet={setBet} disabled={active} />
      <div>
        <label className="block text-xs text-nv-muted uppercase tracking-wider mb-2">
          Mines: {mineCount}
        </label>
        <input
          type="range"
          min={1}
          max={24}
          value={mineCount}
          disabled={active}
          onChange={(e) => setMineCount(Number(e.target.value))}
          className="w-full accent-nv-cyan"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {[1, 3, 5, 10, 24].map((n) => (
            <button
              key={n}
              type="button"
              disabled={active}
              onClick={() => setMineCount(n)}
              className={`touch-target rounded-lg px-3 text-xs border ${
                mineCount === n ? 'border-nv-cyan text-nv-cyan' : 'border-nv-border text-nv-muted'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {!active ? (
        <div className="space-y-2">
          <Button variant="primary" full onClick={startGame} disabled={bet <= 0 || bet > balance}>
            Bet ${formatMoney(bet)}
          </Button>
          <Button variant="accent" full onClick={doInstant} disabled={bet <= 0 || bet > balance}>
            Instant Bet
          </Button>
          <Button full onClick={showPrevious} disabled={!prev}>
            Previous Game Reveal
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="rounded-xl bg-nv-bg border border-nv-border p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-nv-muted">Multiplier</span>
              <span className="text-nv-cyan font-bold">{formatMult(mult)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-nv-muted">Next tile</span>
              <span>{formatMult(nextMult)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-nv-muted">Cash out</span>
              <span className="text-nv-green font-bold">${formatMoney(potential)}</span>
            </div>
          </div>
          <Button variant="success" full onClick={cashOut} disabled={safeRevealed === 0}>
            Cash Out ${formatMoney(potential)}
          </Button>
          <Button full onClick={autoPick} disabled={autoPickBusy}>
            Auto Pick
          </Button>
        </div>
      )}

      {showPrev && prev && (
        <p className="text-xs text-nv-muted">
          Previous: {prev.won ? `Won ${formatMult(prev.multiplier)}` : 'Busted'} · {prev.mineCount} mines
        </p>
      )}
    </div>
  )

  return (
    <GameShell gameId="mines" sidebar={sidebar}>
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs text-nv-muted text-center">
          5×5 grid · Tap gems · Avoid mines · Cash out anytime · DEMO PLAY MONEY
        </p>
        <div className={`${gridClass} w-full max-w-md mx-auto`}>
          {cells.map((state, i) => (
            <motion.button
              key={i}
              type="button"
              whileTap={active && state === 'hidden' ? { scale: 0.92 } : undefined}
              onClick={() => revealCell(i)}
              disabled={!active || state !== 'hidden'}
              className={`aspect-square touch-target rounded-xl border text-lg sm:text-xl font-bold flex items-center justify-center transition ${
                state === 'hidden'
                  ? 'bg-nv-card border-nv-border hover:border-nv-cyan/50 active:bg-nv-cyan/10'
                  : state === 'safe'
                    ? 'bg-nv-green/20 border-nv-green/40 text-nv-green'
                    : 'bg-nv-red/25 border-nv-red/50 text-nv-red'
              }`}
              aria-label={`Cell ${i + 1}`}
            >
              <AnimatePresence mode="wait">
                {state === 'safe' && (
                  <motion.span initial={animOn ? { scale: 0 } : false} animate={{ scale: 1 }}>
                    ◆
                  </motion.span>
                )}
                {state === 'mine' && (
                  <motion.span initial={animOn ? { scale: 0 } : false} animate={{ scale: 1 }}>
                    ✦
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
        {(cashed || bust) && (
          <div className={`text-center font-bold text-lg ${cashed ? 'text-nv-green' : 'text-nv-red'}`}>
            {cashed ? `Cashed out ${formatMult(prev?.multiplier ?? mult)}` : 'Boom! Hit a mine'}
          </div>
        )}
      </div>
    </GameShell>
  )
}
