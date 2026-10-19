'use client'

import { Calculator } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn, isMobile, useBackDismiss, useViewport } from '@/shared/lib'

import { CalculatorPanel } from './calculator-panel'
import { shouldCloseOnSwipe } from '../lib/swipe'

const SCROLL_LOCK_SELECTOR = '[data-grid-container]'

/** Locks page scroll (html, body, and the app's scroll container) while active. */
function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    const elements: HTMLElement[] = [
      document.documentElement,
      document.body,
      ...Array.from(
        document.querySelectorAll<HTMLElement>(SCROLL_LOCK_SELECTOR)
      ),
    ]
    const previous = elements.map((element) => element.style.overflow)
    for (const element of elements) element.style.overflow = 'hidden'

    return () => {
      elements.forEach((element, index) => {
        element.style.overflow = previous[index]
      })
    }
  }, [active])
}

/** Floating button that opens the calculator: a dialog on desktop, a bottom sheet on mobile. */
export function CalculatorLauncher() {
  const [isOpen, setIsOpen] = useState(false)
  const viewport = useViewport()
  const isSheet = isMobile(viewport)
  const swipeStartY = useRef<number | null>(null)

  const close = () => setIsOpen(false)
  // Browser Back closes the calculator instead of leaving the page.
  useBackDismiss(isOpen, close)

  useScrollLock(isOpen && isSheet)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const startSwipe = (y: number | undefined) => {
    swipeStartY.current = y ?? null
  }

  const endSwipe = (y: number | undefined) => {
    const startY = swipeStartY.current
    swipeStartY.current = null
    if (startY !== null && y !== undefined && shouldCloseOnSwipe(startY, y)) {
      close()
    }
  }

  const swipeHandlers = isSheet
    ? {
        onTouchStart: (event: React.TouchEvent) =>
          startSwipe(event.touches[0]?.clientY),
        onTouchEnd: (event: React.TouchEvent) =>
          endSwipe(event.changedTouches[0]?.clientY),
        onPointerDown: (event: React.PointerEvent) => {
          if (event.pointerType !== 'mouse') startSwipe(event.clientY)
        },
        onPointerUp: (event: React.PointerEvent) => {
          if (event.pointerType !== 'mouse') endSwipe(event.clientY)
        },
      }
    : {}

  if (!isOpen) {
    return (
      <button
        type="button"
        aria-label="Открыть калькулятор"
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed right-4 bottom-4 z-40 flex h-12 w-12 items-center justify-center rounded-full',
          'bg-emerald-600 text-white shadow-lg shadow-black/40 transition-colors hover:bg-emerald-500',
          'sm:right-6 sm:bottom-6 sm:h-14 sm:w-14'
        )}
      >
        <Calculator className="h-6 w-6" aria-hidden="true" />
      </button>
    )
  }

  return (
    <>
      {isSheet && (
        <div
          data-testid="calculator-backdrop"
          className="animate-fade-in fixed inset-0 z-50 bg-black/60"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <div
        role="dialog"
        aria-label="Калькулятор"
        data-presentation={isSheet ? 'sheet' : 'dialog'}
        {...swipeHandlers}
        className={cn(
          'animate-slide-up fixed z-50 border border-zinc-700 bg-zinc-900 shadow-2xl',
          isSheet
            ? 'inset-x-0 bottom-0 touch-pan-x rounded-t-2xl px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]'
            : 'right-6 bottom-6 w-96 rounded-xl p-4'
        )}
      >
        {isSheet && (
          <div
            aria-hidden="true"
            className="mx-auto mb-2 h-1 w-10 rounded-full bg-zinc-600"
          />
        )}
        <CalculatorPanel onClose={close} />
      </div>
    </>
  )
}
