'use client'

import Link from 'next/link'
import { useState } from 'react'

import { requestPasswordReset } from '@/shared/api'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setMessage('')
    setError('')
    setIsSubmitting(true)

    const result = await requestPasswordReset({ email })

    if (result.success) {
      setMessage(result.message)
    } else {
      setError(result.error)
    }

    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />

      {message ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-200">
          {message}
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Отправка...' : 'Отправить ссылку'}
      </button>

      <p className="text-center text-sm text-zinc-400">
        Вспомнили пароль?{' '}
        <Link
          href="/login"
          className="text-emerald-400 transition-colors hover:text-emerald-300"
        >
          Войти
        </Link>
      </p>
    </form>
  )
}
