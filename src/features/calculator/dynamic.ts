'use client'

import dynamic from 'next/dynamic'

import type { CalculatorLauncher } from './ui/calculator-launcher'

/** The calculator restores its expression from localStorage, so it renders client-only. */
export const CalculatorLauncherDynamic = dynamic(
  () =>
    import('./ui/calculator-launcher').then((mod) => mod.CalculatorLauncher),
  { ssr: false }
) as typeof CalculatorLauncher
