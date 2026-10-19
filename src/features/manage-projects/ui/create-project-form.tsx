'use client'

import { useProjectStore } from '@/entities/project'
import { parseAmountInput, useFormDraft, useSubmitLock } from '@/shared/lib'
import { Button, Input, MathInput } from '@/shared/ui'

interface CreateProjectFormProps {
  /** Called after a project is submitted, so the parent can close the form. */
  onCreated?: () => void
}

export function CreateProjectForm({ onCreated }: CreateProjectFormProps = {}) {
  const [name, setName] = useFormDraft('create-project', 'name', '')
  const [budget, setBudget] = useFormDraft('create-project', 'budget', '')

  const addProject = useProjectStore((state) => state.addProject)
  const runLocked = useSubmitLock()

  const parsedBudget = parseAmountInput(budget)
  const isFormValid = Boolean(name.trim()) && parsedBudget.ok

  const submit = () => {
    if (!name.trim() || !parsedBudget.ok) return

    addProject({
      id: crypto.randomUUID(),
      name: name.trim(),
      budget: parsedBudget.value,
    })

    setName('')
    setBudget('')
    onCreated?.()
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void runLocked(submit)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        placeholder="Название проекта"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <MathInput
        placeholder="Бюджет, напр. 50000+5000"
        aria-label="Бюджет проекта"
        value={budget}
        onValueChange={(value) => setBudget(value)}
      />
      <Button type="submit" disabled={!isFormValid}>
        Создать проект
      </Button>
    </form>
  )
}
