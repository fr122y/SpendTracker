'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { resetPassword } from '@/shared/api'

import { PasswordInput } from './password-input'

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter()
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

    const result = await resetPassword({ token, password })

    if (!result.success) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    router.push('/login?reset=success')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordInput
        placeholder="Новый пароль"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        showLabel="Показать новый пароль"
        hideLabel="Скрыть новый пароль"
      />

      <PasswordInput
        placeholder="Повторите пароль"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        showLabel="Показать повтор пароля"
        hideLabel="Скрыть повтор пароля"
      />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Сохранение...' : 'Сохранить новый пароль'}
      </button>

      <p className="text-center text-sm text-zinc-400">
        <Link
          href="/login"
          className="text-emerald-400 transition-colors hover:text-emerald-300"
        >
          Вернуться ко входу
        </Link>
      </p>
    </form>
  )
}
