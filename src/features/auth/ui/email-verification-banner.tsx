'use client'

import { useState, useTransition } from 'react'

import { resendEmailVerification } from '@/shared/api'

interface EmailVerificationBannerProps {
  email: string
}

export function EmailVerificationBanner({
  email,
}: EmailVerificationBannerProps) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

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

  return (
    <section className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Подтвердите email</p>
          <p className="mt-1 text-amber-100/80">
            Подтверждение не блокирует работу, но поможет защитить аккаунт.
            Отправьте письмо на {email}, если ссылка ещё не приходила или
            устарела.
          </p>
          {message ? <p className="mt-2 text-emerald-200">{message}</p> : null}
          {error ? <p className="mt-2 text-red-200">{error}</p> : null}
        </div>
        <button
          type="button"
          onClick={handleResend}
          disabled={isPending}
          className="w-full rounded-lg border border-amber-300/40 px-4 py-2 font-medium text-amber-50 transition-colors hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending ? 'Отправляем...' : 'Отправить ещё раз'}
        </button>
      </div>
    </section>
  )
}
