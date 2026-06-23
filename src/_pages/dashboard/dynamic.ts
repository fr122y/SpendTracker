'use client'

import dynamic from 'next/dynamic'

import type { Dashboard } from './ui/dashboard'

export const DashboardDynamic = dynamic(
  () => import('./ui/dashboard').then((mod) => mod.Dashboard),
  { ssr: false }
) as typeof Dashboard
