'use client'

import { ArrowLeft, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { WIDGET_REGISTRY } from '@/features/widget-registry'
import { cn } from '@/shared/lib'

import type { WidgetId } from '@/shared/types'

interface MobileWidgetModalProps {
  widgetId: WidgetId
  onClose: () => void
}

export function MobileWidgetModal({
  widgetId,
  onClose,
}: MobileWidgetModalProps) {
  const widget = WIDGET_REGISTRY[widgetId]
  const [isVisible, setIsVisible] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number | null>(null)
  const currentYRef = useRef<number>(0)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(onClose, 200) // Match transition duration
  }, [onClose])

  // Animate in on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  // Swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    currentYRef.current = 0
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null) return

    const deltaY = e.touches[0].clientY - startYRef.current
    currentYRef.current = deltaY

    // Only allow swipe down from top of modal
    if (deltaY > 0 && modalRef.current) {
      modalRef.current.style.transform = `translateY(${deltaY}px)`
    }
  }

  const handleTouchEnd = () => {
    if (modalRef.current) {
      modalRef.current.style.transform = ''
    }

    // Close if swiped down more than 100px
    if (currentYRef.current > 100) {
      handleClose()
    }

    startYRef.current = null
    currentYRef.current = 0
  }

  if (!widget) return null

  const Component = widget.component
  const Icon = widget.icon

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col bg-zinc-950',
        'transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Header */}
      <header
        ref={modalRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'flex shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-3',
          'transition-transform duration-200'
        )}
      >
        {/* Back button - Normalized focus ring styling for consistency */}
        <button
          type="button"
          onClick={handleClose}
          className={cn(
            'flex items-center justify-center',
            'min-h-11 min-w-11 rounded-lg',
            'text-zinc-400 transition-colors',
            'hover:bg-zinc-800 hover:text-zinc-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500'
          )}
          aria-label="Назад"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-1 items-center gap-2">
          <Icon className="h-5 w-5 text-emerald-400" />
          <h2 className="font-mono text-base font-semibold text-zinc-100">
            {widget.title}
          </h2>
        </div>

        {/* Close button - Normalized focus ring styling for consistency */}
        <button
          type="button"
          onClick={handleClose}
          className={cn(
            'flex items-center justify-center',
            'min-h-11 min-w-11 rounded-lg',
            'text-zinc-400 transition-colors',
            'hover:bg-zinc-800 hover:text-zinc-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500'
          )}
          aria-label="Закрыть"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Widget Content */}
      <main className="flex-1 overflow-y-auto p-4">
        <Component />
      </main>
    </div>
  )
}
