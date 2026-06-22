import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth, getAccountProfile } from '@/shared/auth'
import { Button } from '@/shared/ui'

import { signOutCurrentUser } from './actions'

function formatAccountValue(value: string | null | undefined) {
  return value?.trim() ? value : 'Не указано'
}

export default async function AccountPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    redirect('/login')
  }

  const profile = await getAccountProfile(userId)

  if (!profile) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-zinc-100 sm:px-6">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
              Account
            </p>
            <h1 className="mt-2 font-mono text-2xl font-bold text-white">
              Личный кабинет
            </h1>
          </div>

          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-700 bg-zinc-800/50 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
          >
            На дашборд
          </Link>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl shadow-black/20">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
                Имя
              </dt>
              <dd className="mt-2 break-words text-sm text-zinc-100">
                {formatAccountValue(profile.name)}
              </dd>
            </div>

            <div>
              <dt className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
                Email
              </dt>
              <dd className="mt-2 break-words text-sm text-zinc-100">
                {formatAccountValue(profile.email)}
              </dd>
            </div>

            <div>
              <dt className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500">
                Вход
              </dt>
              <dd className="mt-2 text-sm text-zinc-100">{profile.provider}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-mono text-base font-bold text-white">
                Завершить сессию
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Выход завершит текущую сессию и вернет вас на страницу входа.
              </p>
            </div>

            <form action={signOutCurrentUser}>
              <Button type="submit" variant="danger">
                Выйти
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
