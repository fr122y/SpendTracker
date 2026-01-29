'use client'

import { DashboardGrid } from '@/widgets/dashboard-grid'
import { DashboardHeader } from '@/widgets/dashboard-header'

// Main Dashboard Page
export function Dashboard() {
  return (
    <div className="flex h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 overflow-hidden">
        <DashboardGrid />
      </main>
    </div>
  )
}
