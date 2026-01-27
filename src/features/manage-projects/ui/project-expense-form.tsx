'use client'

import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { useCategoryStore } from '@/entities/category'
import { useExpenseStore } from '@/entities/expense'
import { useSessionStore } from '@/entities/session'
import { categorizeExpenseAction } from '@/shared/api'
import { formatDate } from '@/shared/lib'
import { Button, Input } from '@/shared/ui'

const FALLBACK_RESULT = {
  category: 'Другое',
  emoji: '📝',
}

interface ProjectExpenseFormProps {
  projectId: string
}

export function ProjectExpenseForm({ projectId }: ProjectExpenseFormProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  const addExpense = useExpenseStore((state) => state.addExpense)
  const categories = useCategoryStore((state) => state.categories)
  const selectedDate = useSessionStore((state) => state.selectedDate)

  const mutation = useMutation({
    mutationFn: async ({
      description,
      amount,
    }: {
      description: string
      amount: number
    }) => {
      return categorizeExpenseAction(description, amount, categories)
    },
    onSuccess: (result) => {
      addExpense({
        id: crypto.randomUUID(),
        description,
        amount: Number(amount),
        date: formatDate(selectedDate),
        category: result.category,
        emoji: result.emoji,
        projectId,
      })
      setDescription('')
      setAmount('')
    },
    onError: () => {
      addExpense({
        id: crypto.randomUUID(),
        description,
        amount: Number(amount),
        date: formatDate(selectedDate),
        category: FALLBACK_RESULT.category,
        emoji: FALLBACK_RESULT.emoji,
        projectId,
      })
      setDescription('')
      setAmount('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !amount) return

    mutation.mutate({
      description: description.trim(),
      amount: Number(amount),
    })
  }

  const isFormValid = description.trim() && amount && Number(amount) > 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        placeholder="Описание расхода"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={mutation.isPending}
      />
      <Input
        type="number"
        placeholder="Сумма"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min={0}
        step={1}
        disabled={mutation.isPending}
      />
      <Button
        type="submit"
        disabled={!isFormValid || mutation.isPending}
        isLoading={mutation.isPending}
      >
        Добавить
      </Button>
    </form>
  )
}
