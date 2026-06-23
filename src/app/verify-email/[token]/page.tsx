import Link from 'next/link'

import { verifyEmail, type EmailVerificationTokenStatus } from '@/shared/api'

interface VerifyEmailPageProps {
  params: Promise<{
    token: string
  }>
}

const STATUS_COPY: Record<
  EmailVerificationTokenStatus,
  {
    title: string
    description: string
    actionHref: string
    actionLabel: string
  }
> = {
  success: {
    title: 'Email подтверждён',
    description: 'Теперь аккаунт SmartSpend помечен как подтверждённый.',
    actionHref: '/',
    actionLabel: 'Вернуться в приложение',
  },
  expired: {
    title: 'Ссылка устарела',
    description: 'Откройте приложение и отправьте новое письмо подтверждения.',
    actionHref: '/',
    actionLabel: 'Вернуться в приложение',
  },
  used: {
    title: 'Ссылка уже использована',
    description: 'Этот email уже был подтверждён по этой ссылке.',
    actionHref: '/',
    actionLabel: 'Вернуться в приложение',
  },
  invalid: {
    title: 'Ссылка недействительна',
    description: 'Проверьте ссылку из письма или отправьте письмо повторно.',
    actionHref: '/',
    actionLabel: 'Вернуться в приложение',
  },
}

export default async function VerifyEmailPage({
  params,
}: VerifyEmailPageProps) {
  const { token } = await params
  const status = await verifyEmail(token)
  const copy = STATUS_COPY[status]

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center shadow-2xl shadow-black/30">
        <h1 className="font-mono text-2xl font-bold text-emerald-400">
          {copy.title}
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-300">
          {copy.description}
        </p>
        <Link
          href={copy.actionHref}
          className="mt-6 inline-flex rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
        >
          {copy.actionLabel}
        </Link>
      </section>
    </main>
  )
}
