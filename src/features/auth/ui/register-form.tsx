'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

import { registerUser } from '@/shared/api'

interface RegisterFormProps {
  onSwitchToSignIn?: () => void
}

export function RegisterForm({ onSwitchToSignIn }: RegisterFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    setIsSubmitting(true)

    const result = await registerUser({
      name,
      email,
      password,
    })

    if (!result.success) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    await signIn('credentials', {
      email,
      password,
      callbackUrl: '/',
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Имя"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />

      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />

      <input
        type="password"
        placeholder="Подтвердите пароль"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>

      {onSwitchToSignIn ? (
        <p className="text-center text-sm text-zinc-400">
          Уже есть аккаунт?{' '}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-emerald-400 transition-colors hover:text-emerald-300"
          >
            Войти
          </button>
        </p>
      ) : null}
    </form>
  )
}
