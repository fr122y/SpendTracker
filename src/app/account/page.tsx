import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth, getAccountProfile } from '@/shared/auth'
import { Button } from '@/shared/ui'

import { AccountProfileSection, ChangePasswordForm } from './account-forms'
import { signOutCurrentUser } from './actions'

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
              Аккаунт
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

        <AccountProfileSection
          name={profile.name}
          email={profile.email}
          provider={profile.provider}
        />

        {profile.hasPassword ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="mb-4 font-mono text-base font-bold text-white">
              Сменить пароль
            </h2>
            <ChangePasswordForm />
          </div>
        ) : null}

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-mono text-base font-bold text-white">
                Завершить сессию
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Выход завершит текущую сессию и вернёт вас на страницу входа.
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
