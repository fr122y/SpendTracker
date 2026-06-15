'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { acceptSharedBudgetInvite } from '@/shared/api/shared-budget-invite-actions'

import type { SharedBudgetInvitePreview } from '@/shared/types'

interface AcceptInviteButtonProps {
  token: string
}

function getResultMessage(result: SharedBudgetInvitePreview): string {
  switch (result.status) {
    case 'accepted':
      return 'Вы присоединились к общему бюджету.'
    case 'duplicate-member':
      return 'Вы уже участвуете в этом общем бюджете.'
    case 'expired':
      return 'Срок действия приглашения истёк.'
    case 'used':
      return 'Это приглашение уже использовано.'
    case 'archived':
      return 'Этот общий бюджет уже архивирован.'
    default:
      return 'Приглашение недействительно.'
  }
}

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<SharedBudgetInvitePreview | null>(null)

  function handleAccept() {
    startTransition(async () => {
      const nextResult = await acceptSharedBudgetInvite(token)
      setResult(nextResult)

      if (nextResult.status === 'accepted') {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={isPending || result?.status === 'accepted'}
        onClick={handleAccept}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Присоединяем...' : 'Принять приглашение'}
      </button>

      {result ? (
        <p className="text-center text-sm text-zinc-300">
          {getResultMessage(result)}
        </p>
      ) : null}
    </div>
  )
}
