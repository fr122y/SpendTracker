'use client'

import { useEffect, useState } from 'react'

export type Viewport = 'mobile' | 'tablet' | 'desktop'

const BREAKPOINTS = {
  tablet: 768,
  desktop: 1280,
} as const

function getViewport(width: number): Viewport {
  if (width < BREAKPOINTS.tablet) return 'mobile'
  if (width < BREAKPOINTS.desktop) return 'tablet'
  return 'desktop'
}

/**
 * Hook to detect current viewport size.
 * Returns 'mobile' for < 768px, 'tablet' for 768px - 1279px, 'desktop' for >= 1280px.
 * SSR-safe: defaults to 'desktop' during server rendering.
 */
export function useViewport(): Viewport {
  const [viewport, setViewport] = useState<Viewport>('desktop')

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setViewport(getViewport(window.innerWidth))
      }, 100) // 100ms debounce
    }

    // Set initial value
    setViewport(getViewport(window.innerWidth))

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  return viewport
}

/**
 * Utility function to check if viewport is mobile.
 */
export function isMobile(viewport: Viewport): boolean {
  return viewport === 'mobile'
}

/**
 * Utility function to check if viewport is tablet or smaller.
 */
export function isTabletOrSmaller(viewport: Viewport): boolean {
  return viewport === 'mobile' || viewport === 'tablet'
}
