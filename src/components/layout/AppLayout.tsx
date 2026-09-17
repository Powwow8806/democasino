import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { DemoBanner } from '../ui/DemoBanner'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh flex flex-col" style={{ ['--demo-banner' as string]: '28px' }}>
      <DemoBanner />
      <div className="flex flex-1 min-h-0">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenu={() => setMenuOpen(true)} />
          <main className="flex-1 overflow-y-auto scrollbar-thin py-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
