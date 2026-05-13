'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'

import { cn } from '@/shared/lib'

import { Button } from './button'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  isConfirming?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  confirmVariant = 'danger',
  isConfirming = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    requestAnimationFrame(() => {
      cancelButtonRef.current?.focus()
    })
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isConfirming) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isConfirming, onClose])

  if (!isOpen) {
    return null
  }

  const handleClose = () => {
    if (!isConfirming) {
      onClose()
    }
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      handleClose()
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md',
        'animate-fade-in'
      )}
      onClick={handleBackdropClick}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl',
          'animate-slide-up sm:p-6'
        )}
      >
        <div className="flex flex-col gap-2">
          <h2 id={titleId} className="text-lg font-semibold text-zinc-100">
            {title}
          </h2>
          {description && (
            <div id={descriptionId} className="text-sm text-zinc-400">
              {description}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isConfirming}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isConfirming}
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
