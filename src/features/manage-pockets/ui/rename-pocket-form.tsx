'use client'

import { useState } from 'react'

import { useRenamePocket } from '@/entities/pocket'
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
  const renamePocket = useRenamePocket()
  const normalizedName = name.trim()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (
      !normalizedName ||
      normalizedName === initialName ||
      renamePocket.isPending
    ) {
      return
    }

    try {
      await renamePocket.mutateAsync({ id: pocketId, name: normalizedName })
      onDone()
    } catch {
      // The mutation state renders the retry message below.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        label="Новое название"
        value={name}
        onChange={(event) => setName(event.target.value)}
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
      {renamePocket.isError && (
        <p role="alert" className="text-sm text-red-400 sm:basis-full">
          Не удалось переименовать карман. Попробуйте ещё раз.
        </p>
      )}
    </form>
  )
}
