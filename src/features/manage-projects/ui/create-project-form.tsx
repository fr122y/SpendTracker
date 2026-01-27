'use client'

import { useState } from 'react'

import { useProjectStore } from '@/entities/project'
import { Button, Input, MathInput } from '@/shared/ui'

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
      <MathInput
        placeholder="Бюджет (можно ввести выражение, напр. 50000+5000)"
        value={budget}
        onValueChange={(value) => setBudget(value)}
        min={0}
      />
      <Button type="submit" disabled={!isFormValid}>
        Создать проект
      </Button>
    </form>
  )
}
