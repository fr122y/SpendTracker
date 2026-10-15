'use client'

import { useState } from 'react'

import { useProjectStore } from '@/entities/project'
import { useSubmitLock } from '@/shared/lib'
import { Button, Input, MathInput } from '@/shared/ui'

interface CreateProjectFormProps {
  /** Called after a project is submitted, so the parent can close the form. */
  onCreated?: () => void
}

export function CreateProjectForm({ onCreated }: CreateProjectFormProps = {}) {
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')

  const addProject = useProjectStore((state) => state.addProject)
  const runLocked = useSubmitLock()

  const submit = () => {
    if (!name.trim() || !budget || Number(budget) <= 0) return

    addProject({
      id: crypto.randomUUID(),
      name: name.trim(),
      budget: Number(budget),
    })

    setName('')
    setBudget('')
    onCreated?.()
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void runLocked(submit)
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
