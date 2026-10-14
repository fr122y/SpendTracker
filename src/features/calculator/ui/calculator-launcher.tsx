'use client'

import { Calculator } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn, isMobile, useViewport } from '@/shared/lib'

import { CalculatorPanel } from './calculator-panel'

const SWIPE_CLOSE_DISTANCE = 80

/** Floating button that opens the calculator: a dialog on desktop, a bottom sheet on mobile. */
export function CalculatorLauncher() {
  const [isOpen, setIsOpen] = useState(false)
  const viewport = useViewport()
  const isSheet = isMobile(viewport)
  const touchStartY = useRef<number | null>(null)

  const close = () => setIsOpen(false)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartY.current = event.touches[0]?.clientY ?? null
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    const startY = touchStartY.current
    touchStartY.current = null
    const endY = event.changedTouches[0]?.clientY
    if (startY === null || endY === undefined) return
    if (endY - startY > SWIPE_CLOSE_DISTANCE) close()
  }

  return (
    <>
      <button
        type="button"
        aria-label="Открыть калькулятор"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'fixed right-4 bottom-4 z-40 flex h-12 w-12 items-center justify-center rounded-full',
          'bg-emerald-600 text-white shadow-lg shadow-black/40 transition-colors hover:bg-emerald-500',
          'sm:right-6 sm:bottom-6 sm:h-14 sm:w-14'
        )}
      >
        <Calculator className="h-6 w-6" aria-hidden="true" />
      </button>

      {isOpen && isSheet && (
        <div
          className="animate-fade-in fixed inset-0 z-50 bg-black/60"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-label="Калькулятор"
          data-presentation={isSheet ? 'sheet' : 'dialog'}
          onTouchStart={isSheet ? handleTouchStart : undefined}
          onTouchEnd={isSheet ? handleTouchEnd : undefined}
          className={cn(
            'animate-slide-up fixed z-50 border border-zinc-700 bg-zinc-900 shadow-2xl',
            isSheet
              ? 'inset-x-0 bottom-0 rounded-t-2xl px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]'
              : 'right-6 bottom-24 w-80 rounded-xl p-4'
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
      )}
    </>
  )
}
