'use client'

import { X } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'

import { resendEmailVerification } from '@/shared/api'

/** Session key: a dismissed banner returns in the next browser session. */
export const EMAIL_BANNER_DISMISSED_KEY = 'email-verification-banner-dismissed'

function readDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(EMAIL_BANNER_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function storeDismissed(): void {
  try {
    window.sessionStorage.setItem(EMAIL_BANNER_DISMISSED_KEY, '1')
  } catch {
    // Storage unavailable: the banner stays hidden for this page view only.
  }
}

interface EmailVerificationBannerProps {
  email: string
}

export function EmailVerificationBanner({
  email,
}: EmailVerificationBannerProps) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isDismissed, setIsDismissed] = useState(false)

  // Read after mount: sessionStorage is unavailable during server rendering.
  useEffect(() => {
    if (readDismissed()) setIsDismissed(true)
  }, [])

  function handleDismiss() {
    storeDismissed()
    setIsDismissed(true)
  }

  function handleResend() {
    setMessage('')
    setError('')

    startTransition(async () => {
      const result = await resendEmailVerification()

      if (result.success) {
        setMessage(result.message)
        return
      }

      setError(result.error)
    })
  }

  if (isDismissed) return null

  return (
    <section
      aria-label="Подтверждение email"
      className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2">
        <div className="min-w-0 flex-1">
          <p>
            <span className="font-medium">Подтвердите email</span>
            <span className="hidden text-amber-100/80 sm:inline">
              {' '}
              — подтверждение не блокирует работу, но поможет защитить аккаунт.
              Письмо уйдёт на {email}.
            </span>
          </p>
          {message ? <p className="mt-1 text-emerald-200">{message}</p> : null}
          {error ? <p className="mt-1 text-red-200">{error}</p> : null}
        </div>
        <button
          type="button"
          onClick={handleResend}
          disabled={isPending}
          className="min-h-11 shrink-0 rounded-lg border border-amber-300/40 px-3 py-1 font-medium text-amber-50 transition-colors hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Отправляем...' : 'Отправить ещё раз'}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Скрыть напоминание"
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-amber-100/80 transition-colors hover:bg-amber-300/10 hover:text-amber-50"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
