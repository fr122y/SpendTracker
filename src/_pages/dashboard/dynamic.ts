'use client'

import dynamic from 'next/dynamic'

export const DashboardDynamic = dynamic(
  () => import('./ui/dashboard').then((mod) => mod.Dashboard),
  { ssr: false }
)
