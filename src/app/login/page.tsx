import { AuthTabs } from '@/features/auth'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-2xl font-bold text-emerald-400">
            SmartSpend Terminal
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Персональный финансовый трекер
          </p>
        </div>
        <AuthTabs />
      </div>
    </div>
  )
}
