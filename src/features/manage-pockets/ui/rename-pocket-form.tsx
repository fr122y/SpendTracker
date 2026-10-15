'use client'

import { useState } from 'react'

import {
  PocketNameConflictError,
  usePockets,
  useRenamePocket,
} from '@/entities/pocket'
import {
  findPocketNameConflict,
  POCKET_NAME_CONFLICT_MESSAGE,
  useSubmitLock,
} from '@/shared/lib'
import { Button, Input } from '@/shared/ui'

export function RenamePocketForm({
  pocketId,
  initialName,
  onDone,
}: {
  pocketId: string
  initialName: string
  onDone: () => void
}) {
  const [name, setName] = useState(initialName)
  const [submitError, setSubmitError] = useState<
    'name_conflict' | 'failed' | null
  >(null)
  const { data: pockets = [] } = usePockets()
  const renamePocket = useRenamePocket()
  const runLocked = useSubmitLock()
  const normalizedName = name.trim()

  const submit = async () => {
    if (!normalizedName || normalizedName === initialName) return
    setSubmitError(null)

    const activePockets = pockets.filter((pocket) => !pocket.archivedAt)
    if (findPocketNameConflict(activePockets, normalizedName, pocketId)) {
      setSubmitError('name_conflict')
      return
    }

    try {
      await renamePocket.mutateAsync({ id: pocketId, name: normalizedName })
      onDone()
    } catch (error) {
      setSubmitError(
        error instanceof PocketNameConflictError ? 'name_conflict' : 'failed'
      )
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void runLocked(submit)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        label="Новое название"
        value={name}
        onChange={(event) => {
          setName(event.target.value)
          setSubmitError(null)
        }}
        maxLength={80}
        required
        disabled={renamePocket.isPending}
      />
      <div className="flex gap-2 sm:self-end">
        <Button
          type="submit"
          disabled={!normalizedName || renamePocket.isPending}
        >
          Сохранить
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Отмена
        </Button>
      </div>
      {submitError && (
        <p role="alert" className="text-sm text-red-400 sm:basis-full">
          {submitError === 'name_conflict'
            ? POCKET_NAME_CONFLICT_MESSAGE
            : 'Не удалось переименовать карман. Попробуйте ещё раз.'}
        </p>
      )}
    </form>
  )
}
