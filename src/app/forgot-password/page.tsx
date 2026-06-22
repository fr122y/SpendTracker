import { ForgotPasswordForm } from '@/features/auth'

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <section className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-2xl font-bold text-emerald-400">
            Сброс пароля
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Введите email аккаунта. Если он зарегистрирован по паролю, мы
            отправим ссылку для сброса.
          </p>
        </div>

        <ForgotPasswordForm />
      </section>
    </main>
  )
}
