import { redirect } from 'next/navigation'

import { DashboardDynamic } from '@/_pages/dashboard'
import { getCurrentEmailVerificationStatus } from '@/shared/api'
import { authFresh } from '@/shared/auth'

export default async function Home() {
  // A page load checks the session against the database at once (one query):
  // a signed-out, outdated, or pre-`sid` session goes to the login page
  // instead of a dashboard whose every request would fail.
  const session = await authFresh()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const emailVerification = await getCurrentEmailVerificationStatus()

  return <DashboardDynamic emailVerification={emailVerification} />
}
