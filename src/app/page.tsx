import dynamic from 'next/dynamic'

const Dashboard = dynamic(
  () => import('@/_pages/dashboard').then((mod) => mod.Dashboard),
  { ssr: false }
)

export default function Home() {
  return <Dashboard />
}
