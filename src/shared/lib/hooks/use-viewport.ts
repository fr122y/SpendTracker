'use client'

import { useEffect, useState } from 'react'

export type Viewport = 'mobile' | 'tablet' | 'desktop'

const BREAKPOINTS = {
  tablet: 768,
  desktop: 1280,
  /** A landscape screen lower than this is a phone turned sideways. */
  phoneLandscapeHeight: 500,
} as const

/**
 * Picks the layout by the shorter side of the screen: a phone stays a phone
 * when it is rotated to landscape. The `wide:` CSS variant in `globals.css`
 * mirrors this rule; keep them in sync.
 */
export function getViewport(width: number, height: number): Viewport {
  if (width < BREAKPOINTS.tablet) return 'mobile'
  if (width > height && height < BREAKPOINTS.phoneLandscapeHeight) {
    return 'mobile'
  }
  if (width < BREAKPOINTS.desktop) return 'tablet'
  return 'desktop'
}

/**
 * Hook to detect current viewport size, or `null` until it is measured on the
 * client. Renders on the server and during hydration return `null`, so a
 * caller can show a viewport-neutral placeholder instead of guessing a layout.
 * Returns 'mobile' for < 768px or a landscape phone (height < 500px), 'tablet'
 * for 768px - 1279px, 'desktop' for >= 1280px.
 */
export function useResolvedViewport(): Viewport | null {
  const [viewport, setViewport] = useState<Viewport | null>(null)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const handleResize = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setViewport(getViewport(window.innerWidth, window.innerHeight))
      }, 100) // 100ms debounce
    }

    // Set initial value
    setViewport(getViewport(window.innerWidth, window.innerHeight))

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  return viewport
}

/**
 * Hook to detect current viewport size.
 * Returns 'mobile' for < 768px, 'tablet' for 768px - 1279px, 'desktop' for >= 1280px.
 * SSR-safe: defaults to 'desktop' during server rendering.
 */
export function useViewport(): Viewport {
  return useResolvedViewport() ?? 'desktop'
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
