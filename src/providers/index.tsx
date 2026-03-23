'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'

import { queryClient } from '@/shared/api'
import { ReatomProvider } from '@/shared/lib/reatom'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ReatomProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ReatomProvider>
    </SessionProvider>
  )
}
