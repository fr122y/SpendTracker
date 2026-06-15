import Link from 'next/link'

import { getSharedBudgetInvitePreview } from '@/shared/api'
import { auth } from '@/shared/auth'

import { AcceptInviteButton } from './accept-invite-button'

import type { SharedBudgetInvitePreview } from '@/shared/types'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

function getInviteTitle(preview: SharedBudgetInvitePreview): string {
  switch (preview.status) {
    case 'valid':
      return 'Приглашение в общий бюджет'
    case 'duplicate-member':
      return 'Вы уже участник'
    case 'expired':
      return 'Срок приглашения истёк'
    case 'used':
      return 'Приглашение уже использовано'
    case 'archived':
      return 'Бюджет архивирован'
    default:
      return 'Приглашение недействительно'
  }
}

function getInviteDescription(preview: SharedBudgetInvitePreview): string {
  const budgetName = preview.sharedBudgetName
    ? `«${preview.sharedBudgetName}»`
    : 'общему бюджету'

  switch (preview.status) {
    case 'valid':
      return `Вас пригласили присоединиться к ${budgetName}.`
    case 'duplicate-member':
      return `Вы уже присоединились к ${budgetName}.`
    case 'expired':
      return 'Попросите владельца общего бюджета создать новую ссылку.'
    case 'used':
      return 'Одноразовая ссылка больше не может быть использована.'
    case 'archived':
      return 'Новые участники не могут присоединиться к архивному бюджету.'
    default:
      return 'Проверьте ссылку или попросите владельца создать новое приглашение.'
  }
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const [session, preview] = await Promise.all([
    auth(),
    getSharedBudgetInvitePreview(token),
  ])
  const callbackUrl = `/invite/${encodeURIComponent(token)}`
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
  const isLoggedIn = Boolean(session?.user?.id)

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <section className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-2xl font-bold text-emerald-400">
            {getInviteTitle(preview)}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {getInviteDescription(preview)}
          </p>
        </div>

        {preview.status === 'valid' ? (
          isLoggedIn ? (
            <AcceptInviteButton token={token} />
          ) : (
            <Link
              href={loginHref}
              className="block w-full rounded-lg bg-emerald-600 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-500"
            >
              Войти или зарегистрироваться
            </Link>
          )
        ) : (
          <Link
            href="/"
            className="block w-full rounded-lg bg-zinc-800 px-4 py-3 text-center text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            На главную
          </Link>
        )}
      </section>
    </main>
  )
}
