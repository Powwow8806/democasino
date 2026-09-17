# NeonVault — Demo Social Casino

**DEMO MODE — PLAY MONEY ONLY.** No real-money deposits, withdrawals, crypto, payments, or gambling APIs. Original branding (not affiliated with any real casino).

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Framer Motion
- Zustand (wallet + settings, persisted to `localStorage`)
- React Router

## Run

```bash
cd democasino
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Open the local URL (typically `http://localhost:5173`). Works best on desktop and **iPhone Safari** (responsive layout, ≥44px touch targets, safe-area insets, mobile drawer nav, 16px inputs to reduce zoom).

## Play money

- Starting balance: **$100,000.00**
- Reset from the account menu (Demo ▾ → Reset Balance)
- Shared wallet across all games

## EV slider

The top-bar **EV slider** adjusts simulated house edge globally:

- Left (−EV): higher house edge (harder for the player)
- Center: ~1% house edge
- Right (+EV): lower / negative house edge (player-favourable demo)

All game payouts that use multipliers call into the shared EV helpers so the slider stays consistent.

## Blackjack rules

- Reshuffled deck each hand (demo simplification)
- **Blackjack pays 3:2**
- Dealer **stands on all 17s** (including soft 17)
- **Double** on any two-card hand
- **Split** once (pairs only)
- No insurance
- Win payouts are adjusted by the EV slider

## Provably fair (demo)

`/provably-fair` demonstrates a seeded Mulberry32 PRNG. Game outcomes use the shared RNG in `src/lib/rng.ts` — no hardcoded wins.

## Games

Originals: Mines, Dice, Plinko, Jumbo Plinko, Crash, Limbo, Coin Flip, HiLo, Keno, Wheel, Towers, Moles  
Classics: European Roulette, Blackjack  
Slots: Vault Slots + Neon Reels, Vault Fruits, Cyber Gems, Aurora Wilds, Quantum Spin (original themes)

## Disclaimer

This is a **front-end demo** for UI/UX and game-math prototyping. It is **not** a real casino. No real money can be deposited or withdrawn.
