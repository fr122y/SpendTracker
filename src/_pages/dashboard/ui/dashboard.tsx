'use client'

import { EmailVerificationBanner } from '@/features/auth'
import { CalculatorLauncherDynamic } from '@/features/calculator'
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
    // Phones scroll the page as a whole; on wider screens the dashboard fills the
    // screen and its columns scroll on their own.
    <div className="flex min-h-dvh flex-col wide:h-screen wide:min-h-0">
      <DashboardHeader />
      {emailVerification?.requiresVerification && emailVerification.email ? (
        <EmailVerificationBanner email={emailVerification.email} />
      ) : null}
      <main className="flex-1 wide:min-h-0 wide:overflow-hidden">
        <DashboardGrid />
      </main>
      <CalculatorLauncherDynamic />
    </div>
  )
}
