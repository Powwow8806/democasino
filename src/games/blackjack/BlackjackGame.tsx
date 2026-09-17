import { useState } from 'react'
import { GameShell } from '../../components/game/GameShell'
import { BetControls } from '../../components/wallet/BetControls'
import { Button } from '../../components/ui/Button'
import { useWallet } from '../../store/wallet'
import { applyEdge } from '../../lib/ev'
import { formatMoney } from '../../lib/format'
import { createRng, shuffle } from '../../lib/rng'
import { sounds } from '../../lib/sound'

type Card = { r: number; s: number } // r 1-13, s 0-3
type Hand = Card[]

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

function label(c: Card) {
  return `${RANKS[c.r - 1]}${SUITS[c.s]}`
}

function value(hand: Hand): number {
  let t = 0
  let aces = 0
  for (const c of hand) {
    if (c.r === 1) {
      aces++
      t += 11
    } else if (c.r >= 10) t += 10
    else t += c.r
  }
  while (t > 21 && aces > 0) {
    t -= 10
    aces--
  }
  return t
}

function isBJ(hand: Hand) {
  return hand.length === 2 && value(hand) === 21
}

function freshDeck(next: () => number): Card[] {
  const d: Card[] = []
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push({ r, s })
  return shuffle(d, next)
}

type Phase = 'idle' | 'player' | 'dealer' | 'done'

export function BlackjackGame() {
  const placeBet = useWallet((s) => s.placeBet)
  const settle = useWallet((s) => s.settle)
  const houseEdge = useWallet((s) => s.houseEdge)
  const soundOn = useWallet((s) => s.soundEnabled)
  const balance = useWallet((s) => s.balance)

  const [bet, setBet] = useState(25)
  const [phase, setPhase] = useState<Phase>('idle')
  const [deck, setDeck] = useState<Card[]>([])
  const [player, setPlayer] = useState<Hand[]>([[]])
  const [dealer, setDealer] = useState<Hand>([])
  const [handIdx, setHandIdx] = useState(0)
  const [bets, setBets] = useState<number[]>([])
  const [msg, setMsg] = useState('')
  const [hideDealer, setHideDealer] = useState(true)

  const draw = (d: Card[]): [Card, Card[]] => {
    const c = d[0]
    return [c, d.slice(1)]
  }

  const finishHand = (
    pHands: Hand[],
    dHand: Hand,
    handBets: number[],
  ) => {
    const dv = value(dHand)
    const edge = houseEdge()
    let totalPayout = 0
    const notes: string[] = []
    pHands.forEach((h, i) => {
      const pv = value(h)
      const a = handBets[i]
      if (pv > 21) {
        notes.push(`Hand ${i + 1} bust`)
        return
      }
      if (isBJ(h) && pHands.length === 1 && !isBJ(dHand)) {
        const pay = Math.round(a * applyEdge(2.5, edge) * 100) / 100 // 3:2 ≈ 2.5x return incl stake
        totalPayout += pay
        notes.push('Blackjack!')
        return
      }
      if (dv > 21 || pv > dv) {
        totalPayout += Math.round(a * applyEdge(2, edge) * 100) / 100
        notes.push(`Hand ${i + 1} win`)
      } else if (pv === dv) {
        totalPayout += a
        notes.push(`Hand ${i + 1} push`)
      } else {
        notes.push(`Hand ${i + 1} lose`)
      }
    })
    const totalBet = handBets.reduce((s, x) => s + x, 0)
    settle({ game: 'blackjack', amount: totalBet, payout: totalPayout, detail: notes.join(', ') })
    setMsg(notes.join(' · ') || 'Done')
    setPhase('done')
    if (soundOn) (totalPayout >= totalBet ? sounds.win : sounds.lose)()
  }

  const dealerPlay = (d: Card[], pHands: Hand[], handBets: number[], dHand: Hand) => {
    setPhase('dealer')
    setHideDealer(false)
    let deckNow = d
    let dh = [...dHand]
    // dealer stands soft 17
    while (value(dh) < 17) {
      const [c, rest] = draw(deckNow)
      dh = [...dh, c]
      deckNow = rest
    }
    setDealer(dh)
    setDeck(deckNow)
    finishHand(pHands, dh, handBets)
  }

  const deal = () => {
    if (phase !== 'idle' && phase !== 'done') return
    const a = Math.round(bet * 100) / 100
    if (a <= 0 || a > balance) return
    if (!placeBet(a)) return
    const { next } = createRng()
    let d = freshDeck(next)
    let p: Hand = []
    let dh: Hand = []
    let c: Card
    ;[c, d] = draw(d); p = [...p, c]
    ;[c, d] = draw(d); dh = [...dh, c]
    ;[c, d] = draw(d); p = [...p, c]
    ;[c, d] = draw(d); dh = [...dh, c]
    setDeck(d)
    setPlayer([p])
    setDealer(dh)
    setBets([a])
    setHandIdx(0)
    setHideDealer(true)
    setMsg('')
    if (soundOn) sounds.click()
    if (isBJ(p) || isBJ(dh)) {
      setHideDealer(false)
      finishHand([p], dh, [a])
      return
    }
    setPhase('player')
  }

  const hit = () => {
    if (phase !== 'player') return
    let d = deck
    const hands = player.map((h) => [...h])
    const [c, rest] = draw(d)
    hands[handIdx] = [...hands[handIdx], c]
    setDeck(rest)
    setPlayer(hands)
    if (soundOn) sounds.reveal()
    if (value(hands[handIdx]) > 21) {
      if (handIdx + 1 < hands.length) setHandIdx(handIdx + 1)
      else dealerPlay(rest, hands, bets, dealer)
    }
  }

  const stand = () => {
    if (phase !== 'player') return
    if (handIdx + 1 < player.length) setHandIdx(handIdx + 1)
    else dealerPlay(deck, player, bets, dealer)
  }

  const double = () => {
    if (phase !== 'player') return
    if (player[handIdx].length !== 2) return
    const a = bets[handIdx]
    if (a > balance) return
    if (!placeBet(a)) return
    const newBets = [...bets]
    newBets[handIdx] = a * 2
    setBets(newBets)
    let d = deck
    const hands = player.map((h) => [...h])
    const [c, rest] = draw(d)
    hands[handIdx] = [...hands[handIdx], c]
    setDeck(rest)
    setPlayer(hands)
    if (handIdx + 1 < hands.length) {
      setHandIdx(handIdx + 1)
    } else {
      dealerPlay(rest, hands, newBets, dealer)
    }
  }

  const split = () => {
    if (phase !== 'player') return
    const h = player[handIdx]
    if (h.length !== 2 || h[0].r !== h[1].r) return
    if (player.length >= 2) return // one split max for simplicity
    const a = bets[handIdx]
    if (a > balance) return
    if (!placeBet(a)) return
    let d = deck
    let c1: Card, c2: Card
    ;[c1, d] = draw(d)
    ;[c2, d] = draw(d)
    const left: Hand = [h[0], c1]
    const right: Hand = [h[1], c2]
    const hands = [...player]
    hands.splice(handIdx, 1, left, right)
    const newBets = [...bets]
    newBets.splice(handIdx, 1, a, a)
    setDeck(d)
    setPlayer(hands)
    setBets(newBets)
    if (soundOn) sounds.click()
  }

  const CardView = ({ c, hidden }: { c?: Card; hidden?: boolean }) => (
    <div className={`h-20 w-14 sm:h-24 sm:w-16 rounded-xl border flex items-center justify-center text-lg font-bold shadow ${
      hidden ? 'bg-nv-purple/40 border-nv-purple text-nv-text' : 'bg-white text-black border-nv-border'
    }`}>
      {hidden || !c ? '🂠' : label(c)}
    </div>
  )

  const sidebar = (
    <div className="rounded-2xl border border-nv-border bg-nv-panel p-4 space-y-4">
      <BetControls bet={bet} setBet={setBet} disabled={phase === 'player' || phase === 'dealer'} />
      {(phase === 'idle' || phase === 'done') && (
        <Button variant="primary" full disabled={bet <= 0 || bet > balance} onClick={deal}>Deal</Button>
      )}
      {phase === 'player' && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="accent" onClick={hit}>Hit</Button>
          <Button variant="secondary" onClick={stand}>Stand</Button>
          <Button onClick={double} disabled={player[handIdx]?.length !== 2 || bets[handIdx] > balance}>Double</Button>
          <Button
            onClick={split}
            disabled={
              player[handIdx]?.length !== 2 ||
              player[handIdx][0].r !== player[handIdx][1].r ||
              player.length >= 2 ||
              bets[handIdx] > balance
            }
          >
            Split
          </Button>
        </div>
      )}
      <div className="text-xs text-nv-muted leading-relaxed border-t border-nv-border pt-3">
        <strong className="text-nv-text">Rules:</strong> 6-deck shoe simulated as reshuffled single deck each hand.
        Blackjack pays 3:2. Dealer stands on all 17s. Double on any two cards. Split once (pairs). No insurance.
        EV slider applies to win payouts.
      </div>
    </div>
  )

  return (
    <GameShell gameId="blackjack" sidebar={sidebar}>
      <div className="space-y-6">
        <div>
          <p className="text-xs text-nv-muted mb-2">Dealer {hideDealer ? '' : `· ${value(dealer)}`}</p>
          <div className="flex gap-2 flex-wrap">
            {dealer.map((c, i) => (
              <CardView key={i} c={c} hidden={hideDealer && i === 1} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-nv-muted mb-2">You</p>
          {player.map((h, i) => (
            <div key={i} className={`mb-3 ${phase === 'player' && i === handIdx ? 'ring-2 ring-nv-cyan rounded-xl p-2' : ''}`}>
              <div className="flex gap-2 flex-wrap">
                {h.map((c, j) => (
                  <CardView key={j} c={c} />
                ))}
              </div>
              <p className="text-sm mt-1 text-nv-muted">
                Value {value(h)} · Bet ${formatMoney(bets[i] ?? bet)}
              </p>
            </div>
          ))}
        </div>
        {msg && <p className="text-center font-semibold text-nv-cyan">{msg}</p>}
      </div>
    </GameShell>
  )
}
