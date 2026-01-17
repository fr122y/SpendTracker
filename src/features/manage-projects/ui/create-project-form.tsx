'use client'

import { useState } from 'react'

import { useProjectStore } from '@/entities/project'
import { Button, Input } from '@/shared/ui'

export function CreateProjectForm() {
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')

  const addProject = useProjectStore((state) => state.addProject)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !budget || Number(budget) <= 0) return

    addProject({
      id: crypto.randomUUID(),
      name: name.trim(),
      budget: Number(budget),
    })

    setName('')
    setBudget('')
  }

  const isFormValid = name.trim() && budget && Number(budget) > 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        placeholder="Название проекта"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        type="number"
        placeholder="Бюджет"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
        min={0}
        step={1}
      />
      <Button type="submit" disabled={!isFormValid}>
        Создать проект
      </Button>
    </form>
  )
}
