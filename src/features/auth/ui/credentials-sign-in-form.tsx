'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'

import { PasswordInput } from './password-input'

interface CredentialsSignInFormProps {
  onSwitchToRegister?: () => void
  defaultError?: string
  callbackUrl?: string
}

export function CredentialsSignInForm({
  onSwitchToRegister,
  defaultError,
  callbackUrl = '/',
}: CredentialsSignInFormProps) {
  const router = useRouter()
  const [error, setError] = useState(defaultError ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Until React hydrates the form, a click would submit it natively and put
  // the credentials into a URL; the button waits for hydration instead.
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => setIsHydrated(true), [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Read the fields, not React state: text typed into the server-rendered
    // form before hydration is in the DOM but never reached state.
    const fields = new FormData(event.currentTarget)
    const email = String(fields.get('email') ?? '')
    const password = String(fields.get('password') ?? '')

    setError('')
    setIsSubmitting(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Неверный email или пароль')
      setIsSubmitting(false)
      return
    }

    // Replace, so browser Back does not return to /login.
    router.replace(callbackUrl)
    router.refresh()
  }

  return (
    <form method="post" onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        name="email"
        placeholder="Email"
        required
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />

      <PasswordInput
        placeholder="Пароль"
        name="password"
        showLabel="Показать пароль"
        hideLabel="Скрыть пароль"
      />

      <div className="text-right">
        <Link
          href="/forgot-password"
          className="inline-flex min-h-11 items-center text-sm text-emerald-400 transition-colors hover:text-emerald-300 wide:min-h-0"
        >
          Забыли пароль?
        </Link>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={!isHydrated || isSubmitting}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Вход...' : 'Войти'}
      </button>

      {onSwitchToRegister ? (
        <p className="text-center text-sm text-zinc-400">
          Нет аккаунта?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-emerald-400 transition-colors hover:text-emerald-300 wide:min-h-0 wide:min-w-0"
          >
            Зарегистрироваться
          </button>
        </p>
      ) : null}
    </form>
  )
}
