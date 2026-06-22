'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(defaultError ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

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

    router.push(callbackUrl)
    router.refresh()
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

      <PasswordInput
        placeholder="Пароль"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        showLabel="Показать пароль"
        hideLabel="Скрыть пароль"
      />

      <div className="text-right">
        <Link
          href="/forgot-password"
          className="text-sm text-emerald-400 transition-colors hover:text-emerald-300"
        >
          Забыли пароль?
        </Link>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
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
            className="text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Зарегистрироваться
          </button>
        </p>
      ) : null}
    </form>
  )
}
