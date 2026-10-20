'use client'

import { useState } from 'react'

import {
  PocketNameConflictError,
  useCreatePocket,
  usePockets,
} from '@/entities/pocket'
import {
  findPocketNameConflict,
  POCKET_NAME_CONFLICT_MESSAGE,
  useSubmitLock,
  useFormDraft,
} from '@/shared/lib'
import { Button, Input } from '@/shared/ui'

import type { Pocket } from '@/shared/types'

export function CreatePocketForm({
  onCreated,
}: {
  /** Receives the saved pocket, with its stored id. */
  onCreated?: (pocket: Pocket | undefined) => void
}) {
  const [name, setName] = useFormDraft('create-pocket', 'name', '', {
    input: true,
  })
  const [submitError, setSubmitError] = useState<
    'name_conflict' | 'failed' | null
  >(null)
  const { data: pockets = [] } = usePockets()
  const createPocket = useCreatePocket()
  const runLocked = useSubmitLock()
  const normalizedName = name.trim()

  const submit = async () => {
    if (!normalizedName) return
    setSubmitError(null)

    const activePockets = pockets.filter((pocket) => !pocket.archivedAt)
    if (findPocketNameConflict(activePockets, normalizedName)) {
      setSubmitError('name_conflict')
      return
    }

    try {
      const pocket = await createPocket.mutateAsync({ name: normalizedName })
      setName('')
      onCreated?.(pocket)
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
        label="Название кармана"
        placeholder="Например, отпуск"
        value={name}
        onChange={(event) => {
          setName(event.target.value)
          setSubmitError(null)
        }}
        maxLength={80}
        required
        disabled={createPocket.isPending}
      />
      <Button
        type="submit"
        disabled={!normalizedName || createPocket.isPending}
        isLoading={createPocket.isPending}
        className="sm:self-end"
      >
        Создать карман
      </Button>
      {submitError && (
        <p role="alert" className="text-sm text-red-400 sm:basis-full">
          {submitError === 'name_conflict'
            ? POCKET_NAME_CONFLICT_MESSAGE
            : 'Не удалось создать карман. Попробуйте ещё раз.'}
        </p>
      )}
    </form>
  )
}
