import Link from 'next/link'

import { ResetPasswordForm } from '@/features/auth'
import { getPasswordResetTokenStatus } from '@/shared/api'

import type { PasswordResetTokenStatus } from '@/shared/api'

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>
}

function getResetTitle(status: PasswordResetTokenStatus): string {
  switch (status) {
    case 'valid':
      return 'Новый пароль'
    case 'expired':
      return 'Срок ссылки истёк'
    case 'used':
      return 'Ссылка уже использована'
    default:
      return 'Ссылка недействительна'
  }
}

function getResetDescription(status: PasswordResetTokenStatus): string {
  switch (status) {
    case 'valid':
      return 'Задайте новый пароль для входа в SmartSpend.'
    case 'expired':
      return 'Запросите новую ссылку для сброса пароля.'
    case 'used':
      return 'Для повторной смены пароля запросите новую ссылку.'
    default:
      return 'Проверьте ссылку или запросите новую.'
  }
}

export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
  const { token } = await params
  const status = await getPasswordResetTokenStatus(token)

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <section className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-2xl font-bold text-emerald-400">
            {getResetTitle(status)}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {getResetDescription(status)}
          </p>
        </div>

        {status === 'valid' ? (
          <ResetPasswordForm token={token} />
        ) : (
          <Link
            href="/forgot-password"
            className="block w-full rounded-lg bg-emerald-600 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-500"
          >
            Запросить новую ссылку
          </Link>
        )}
      </section>
    </main>
  )
}
