'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { PasswordInput } from '@/features/auth'
import { Button } from '@/shared/ui'

import { changeAccountPassword, updateAccountName } from './actions'

const inputClassName =
  'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'

function FormStatus({ error, message }: { error: string; message: string }) {
  if (error) {
    return (
      <p role="alert" className="text-sm text-red-400">
        {error}
      </p>
    )
  }

  if (message) {
    return (
      <p role="status" className="text-sm text-emerald-400">
        {message}
      </p>
    )
  }

  return null
}

function formatAccountValue(value: string | null | undefined) {
  return value?.trim() ? value : 'Не указано'
}

interface AccountProfileSectionProps {
  name: string | null
  email: string | null
  provider: string
}

export function AccountProfileSection({
  name,
  email,
  provider,
}: AccountProfileSectionProps) {
  const [savedName, setSavedName] = useState(name)

  return (
    <>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl shadow-black/20">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
              Имя
            </dt>
            <dd className="mt-2 break-words text-sm text-zinc-100">
              {formatAccountValue(savedName)}
            </dd>
          </div>

          <div>
            <dt className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
              Эл. почта
            </dt>
            <dd className="mt-2 break-words text-sm text-zinc-100">
              {formatAccountValue(email)}
            </dd>
          </div>

          <div>
            <dt className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
              Вход
            </dt>
            <dd className="mt-2 text-sm text-zinc-100">{provider}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="mb-4 font-mono text-base font-bold text-white">
          Изменить имя
        </h2>
        <ChangeNameForm initialName={savedName ?? ''} onSaved={setSavedName} />
      </div>
    </>
  )
}

export function ChangeNameForm({
  initialName,
  onSaved,
}: {
  initialName: string
  onSaved?: (name: string) => void
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    const result = await updateAccountName({ name })

    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setName(name.trim())
    onSaved?.(name.trim())
    setMessage('Имя сохранено')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm text-zinc-400">Имя</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={50}
          required
          className={inputClassName}
        />
      </label>
      <FormStatus error={error} message={message} />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Сохраняем…' : 'Сохранить имя'}
      </Button>
    </form>
  )
}

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (newPassword !== confirmPassword) {
      setError('Новые пароли не совпадают')
      return
    }

    setIsSubmitting(true)

    const result = await changeAccountPassword({
      currentPassword,
      newPassword,
      confirmPassword,
    })

    setIsSubmitting(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setMessage('Пароль изменён')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordInput
        placeholder="Текущий пароль"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        showLabel="Показать текущий пароль"
        hideLabel="Скрыть текущий пароль"
      />
      <PasswordInput
        placeholder="Новый пароль"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        showLabel="Показать новый пароль"
        hideLabel="Скрыть новый пароль"
      />
      <PasswordInput
        placeholder="Повторите новый пароль"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        showLabel="Показать повтор нового пароля"
        hideLabel="Скрыть повтор нового пароля"
      />
      <FormStatus error={error} message={message} />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Сохраняем…' : 'Сменить пароль'}
      </Button>
    </form>
  )
}
