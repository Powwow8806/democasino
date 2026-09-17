import { useState } from 'react'
import { GameShell } from '../../components/game/GameShell'
import { BetControls } from '../../components/wallet/BetControls'
import { Button } from '../../components/ui/Button'
import { useWallet } from '../../store/wallet'
import { applyEdge } from '../../lib/ev'
import { formatMoney, formatMult } from '../../lib/format'
import { createRng, randomInt } from '../../lib/rng'
import { sounds } from '../../lib/sound'

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const SUITS = ['♠', '♥', '♦', '♣']

function cardLabel(v: number) {
  return `${RANKS[v]}${SUITS[v % 4]}`
}

export function HiLoGame() {
  const placeBet = useWallet((s) => s.placeBet)
  const settle = useWallet((s) => s.settle)
  const houseEdge = useWallet((s) => s.houseEdge)
  const soundOn = useWallet((s) => s.soundEnabled)
  const balance = useWallet((s) => s.balance)

  const [bet, setBet] = useState(10)
  const [active, setActive] = useState(false)
  const [card, setCard] = useState(7)
  const [mult, setMult] = useState(1)
  const [streak, setStreak] = useState(0)
  const [flash, setFlash] = useState<'win' | 'lose' | null>(null)
  const edge = houseEdge()

  const hiChance = card < 12 ? (12 - card) / 13 : 0
  const loChance = card > 0 ? card / 13 : 0
  const hiMult = hiChance > 0 ? applyEdge(1 / hiChance, edge) : 0
  const loMult = loChance > 0 ? applyEdge(1 / loChance, edge) : 0

  const start = () => {
    if (active) return
    const a = Math.round(bet * 100) / 100
    if (a <= 0 || a > balance) return
    if (!placeBet(a)) return
    const { next } = createRng()
    setCard(randomInt(0, 12, next))
    setMult(1)
    setStreak(0)
    setActive(true)
    setFlash(null)
    if (soundOn) sounds.click()
  }

  const guess = (dir: 'hi' | 'lo') => {
    if (!active) return
    const { next } = createRng()
    const nextCard = randomInt(0, 12, next)
    const ok = dir === 'hi' ? nextCard > card : nextCard < card
    // ties lose for simplicity (or skip) — treat equal as loss of streak cashout opportunity = lose
    if (!ok || nextCard === card) {
      setCard(nextCard)
      setActive(false)
      setFlash('lose')
      if (soundOn) sounds.lose()
      settle({ game: 'hilo', amount: bet, payout: 0, detail: `${dir} fail` })
      return
    }
    const step = dir === 'hi' ? hiMult : loMult
    const newMult = Math.round(mult * step * 10000) / 10000
    setMult(newMult)
    setCard(nextCard)
    setStreak((s) => s + 1)
    if (soundOn) sounds.reveal()
  }

  const cashOut = () => {
    if (!active || streak === 0) return
    const payout = Math.round(bet * mult * 100) / 100
    setActive(false)
    setFlash('win')
    if (soundOn) sounds.cashout()
    settle({ game: 'hilo', amount: bet, payout, detail: `Streak ${streak} · ${formatMult(mult)}` })
  }

  const sidebar = (
    <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-4">
      <BetControls bet={bet} setBet={setBet} disabled={active} />
      {!active ? (
        <Button variant="primary" full disabled={bet <= 0 || bet > balance} onClick={start}>Deal</Button>
      ) : (
        <>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span className="text-nv-muted">Multiplier</span><span className="text-nv-purple font-bold">{formatMult(mult)}</span></div>
            <div className="flex justify-between"><span className="text-nv-muted">Cash out</span><span className="text-nv-green">${formatMoney(bet * mult)}</span></div>
          </div>
          <Button variant="success" full disabled={streak === 0} onClick={cashOut}>Cash Out</Button>
          <Button full disabled={hiChance <= 0} onClick={() => guess('hi')}>Higher {formatMult(hiMult)}</Button>
          <Button full disabled={loChance <= 0} onClick={() => guess('lo')}>Lower {formatMult(loMult)}</Button>
        </>
      )}
    </div>
  )

  return (
    <GameShell gameId="hilo" sidebar={sidebar}>
      <div className={`flex flex-col items-center justify-center min-h-[280px] gap-4 ${flash === 'win' ? 'anim-win' : flash === 'lose' ? 'anim-lose' : ''}`}>
        <div className="h-40 w-28 rounded-2xl border-2 border-nv-border bg-white text-black flex items-center justify-center text-4xl font-bold shadow-xl">
          {cardLabel(card)}
        </div>
        <p className="text-nv-muted text-sm">Streak {streak} · Higher / Lower</p>
      </div>
    </GameShell>
  )
}
