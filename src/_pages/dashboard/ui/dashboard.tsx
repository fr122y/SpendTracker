'use client'

import { EmailVerificationBanner } from '@/features/auth'
import { DashboardGrid } from '@/widgets/dashboard-grid'
import { DashboardHeader } from '@/widgets/dashboard-header'

interface DashboardProps {
  emailVerification?: {
    requiresVerification: boolean
    email?: string
  }
}

export function Dashboard({ emailVerification }: DashboardProps) {
  return (
    <div className="flex h-screen flex-col">
      <DashboardHeader />
      {emailVerification?.requiresVerification && emailVerification.email ? (
        <EmailVerificationBanner email={emailVerification.email} />
      ) : null}
      <main className="flex-1 overflow-hidden">
        <DashboardGrid />
      </main>
    </div>
  )
}
