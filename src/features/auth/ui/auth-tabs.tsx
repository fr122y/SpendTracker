'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { CredentialsSignInForm } from './credentials-sign-in-form'
import { RegisterForm } from './register-form'
import { SignInButton } from './sign-in-button'

type AuthTab = 'signin' | 'register'

function getAuthErrorMessage(errorParam: string | null): string {
  if (errorParam === 'UseCredentialsSignIn') {
    return 'Этот email уже зарегистрирован через пароль. Войдите по email и паролю.'
  }

  if (errorParam === 'OAuthAccountNotLinked') {
    return 'Для этого email используйте тот же способ входа, что и раньше.'
  }

  return ''
}

export function AuthTabs() {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin')
  const searchParams = useSearchParams()

  const authErrorMessage = useMemo(
    () => getAuthErrorMessage(searchParams.get('error')),
    [searchParams]
  )

  return (
    <div>
      <div className="mb-6 flex border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab('signin')}
          className={`flex-1 border-b-2 px-2 pb-3 text-sm font-medium transition-colors ${
            activeTab === 'signin'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Вход
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('register')}
          className={`flex-1 border-b-2 px-2 pb-3 text-sm font-medium transition-colors ${
            activeTab === 'register'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Регистрация
        </button>
      </div>

      {activeTab === 'signin' ? (
        <CredentialsSignInForm
          defaultError={authErrorMessage}
          onSwitchToRegister={() => setActiveTab('register')}
        />
      ) : (
        <RegisterForm onSwitchToSignIn={() => setActiveTab('signin')} />
      )}

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-700" />
        <span className="text-xs text-zinc-500">или</span>
        <div className="h-px flex-1 bg-zinc-700" />
      </div>

      <SignInButton />
    </div>
  )
}
