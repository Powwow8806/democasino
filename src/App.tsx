import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { HomePage } from './pages/HomePage'
import { StatsPage } from './pages/StatsPage'
import { ProvablyFairPage } from './pages/ProvablyFairPage'
import { MinesGame } from './games/mines/MinesGame'
import { DiceGame } from './games/dice/DiceGame'
import { PlinkoGame, JumboPlinkoGame } from './games/plinko/PlinkoGame'
import { CrashGame } from './games/crash/CrashGame'
import { RouletteGame } from './games/roulette/RouletteGame'
import { BlackjackGame } from './games/blackjack/BlackjackGame'
import { HiLoGame } from './games/hilo/HiLoGame'
import { MolesGame } from './games/moles/MolesGame'
import { LimboGame } from './games/limbo/LimboGame'
import { CoinFlipGame } from './games/coinflip/CoinFlipGame'
import { KenoGame } from './games/keno/KenoGame'
import { WheelGame } from './games/wheel/WheelGame'
import { TowersGame } from './games/towers/TowersGame'
import {
  VaultSlots,
  NeonReels,
  VaultFruits,
  CyberGems,
  AuroraWilds,
  QuantumSpin,
} from './games/slots/SlotsGame'

export default function App() {
  return (
    <BrowserRouter basename="/democasino">
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="provably-fair" element={<ProvablyFairPage />} />
          <Route path="games/mines" element={<MinesGame />} />
          <Route path="games/dice" element={<DiceGame />} />
          <Route path="games/plinko" element={<PlinkoGame />} />
          <Route path="games/jumbo-plinko" element={<JumboPlinkoGame />} />
          <Route path="games/crash" element={<CrashGame />} />
          <Route path="games/roulette" element={<RouletteGame />} />
          <Route path="games/blackjack" element={<BlackjackGame />} />
          <Route path="games/hilo" element={<HiLoGame />} />
          <Route path="games/moles" element={<MolesGame />} />
          <Route path="games/limbo" element={<LimboGame />} />
          <Route path="games/coinflip" element={<CoinFlipGame />} />
          <Route path="games/keno" element={<KenoGame />} />
          <Route path="games/wheel" element={<WheelGame />} />
          <Route path="games/towers" element={<TowersGame />} />
          <Route path="games/slots" element={<VaultSlots />} />
          <Route path="games/neon-reels" element={<NeonReels />} />
          <Route path="games/vault-fruits" element={<VaultFruits />} />
          <Route path="games/cyber-gems" element={<CyberGems />} />
          <Route path="games/aurora-wilds" element={<AuroraWilds />} />
          <Route path="games/quantum-spin" element={<QuantumSpin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
