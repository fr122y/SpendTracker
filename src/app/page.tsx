import { DashboardDynamic } from '@/_pages/dashboard'
import { getCurrentEmailVerificationStatus } from '@/shared/api'

export default async function Home() {
  const emailVerification = await getCurrentEmailVerificationStatus()

  return <DashboardDynamic emailVerification={emailVerification} />
}
