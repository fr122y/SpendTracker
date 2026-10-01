'use client'

import { useState } from 'react'

import { useCreatePocket } from '@/entities/pocket'
import { Button, Input } from '@/shared/ui'

export function CreatePocketForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState('')
  const createPocket = useCreatePocket()
  const normalizedName = name.trim()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!normalizedName || createPocket.isPending) return

    try {
      await createPocket.mutateAsync({ name: normalizedName })
      setName('')
      onCreated?.()
    } catch {
      // The mutation state renders the retry message below.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        label="Название кармана"
        placeholder="Например, отпуск"
        value={name}
        onChange={(event) => setName(event.target.value)}
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
      {createPocket.isError && (
        <p role="alert" className="text-sm text-red-400 sm:basis-full">
          Не удалось создать карман. Попробуйте ещё раз.
        </p>
      )}
    </form>
  )
}
