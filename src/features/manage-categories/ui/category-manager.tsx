'use client'

import { useState } from 'react'

import { useCategoryStore } from '@/entities/category'
import { Button, Input } from '@/shared/ui'

export function CategoryManager() {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [error, setError] = useState('')

  const categories = useCategoryStore((state) => state.categories)
  const addCategory = useCategoryStore((state) => state.addCategory)
  const deleteCategory = useCategoryStore((state) => state.deleteCategory)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim() || !emoji.trim()) return

    const isDuplicate = categories.some(
      (cat) => cat.name.toLowerCase() === name.trim().toLowerCase()
    )

    if (isDuplicate) {
      setError('Категория с таким названием уже существует')
      return
    }

    addCategory({
      id: crypto.randomUUID(),
      name: name.trim(),
      emoji: emoji.trim(),
    })

    setName('')
    setEmoji('')
  }

  const isFormValid = name.trim() && emoji.trim()

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <ul className="flex flex-col gap-2">
        {categories.map((category) => (
          <li
            key={category.id}
            className="flex flex-col gap-2 rounded-lg bg-zinc-800/50 p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{category.emoji}</span>
              <span className="text-zinc-200">{category.name}</span>
            </div>
            <Button
              variant="danger"
              onClick={() => deleteCategory(category.id)}
              aria-label={`Удалить ${category.name}`}
              className="w-full sm:w-auto"
            >
              Удалить
            </Button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="flex-1">
            <Input
              placeholder="Название категории"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              error={error}
            />
          </div>
          <div className="w-full sm:w-24">
            <Input
              placeholder="Эмодзи"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={2}
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={!isFormValid}
          className="w-full sm:w-auto"
        >
          Добавить категорию
        </Button>
      </form>
    </div>
  )
}
