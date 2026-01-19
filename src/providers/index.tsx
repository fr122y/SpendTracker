'use client'

import { QueryClientProvider } from '@tanstack/react-query'

import { queryClient } from '@/shared/api'
import { ReatomProvider } from '@/shared/lib/reatom'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ReatomProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ReatomProvider>
  )
}
