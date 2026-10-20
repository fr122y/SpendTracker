'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'

import { queryClient } from '@/shared/api'
import { ReatomProvider } from '@/shared/lib/reatom'

import { AppFreshnessController } from './app-freshness-controller'
import { NetworkStatus } from './network-status'
import { UnsavedChangesGuard } from './unsaved-changes-guard'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ReatomProvider>
        <QueryClientProvider client={queryClient}>
          <AppFreshnessController />
          <UnsavedChangesGuard />
          {children}
          <NetworkStatus />
          <Toaster
            position="bottom-right"
            containerAriaLabel="Уведомления"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </QueryClientProvider>
      </ReatomProvider>
    </SessionProvider>
  )
}
