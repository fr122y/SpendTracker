'use client'

import { Check } from 'lucide-react'

import { CATEGORY_COLORS, cn, getFallbackCategoryColor } from '@/shared/lib'

interface CategoryColorPickerProps {
  /** The category name, for the automatic color preview. */
  name: string
  value: string | null
  onChange: (color: string | null) => void
}

export function CategoryColorPicker({
  name,
  value,
  onChange,
}: CategoryColorPickerProps) {
  const options = [
    {
      value: null,
      label: 'Автоматически',
      swatch: getFallbackCategoryColor(name),
    },
    ...CATEGORY_COLORS.map((color) => ({
      value: color.value as string | null,
      label: color.label,
      swatch: color.value as string,
    })),
  ]

  return (
    <div
      role="radiogroup"
      aria-label="Цвет категории"
      className="flex flex-col gap-2"
    >
      <span className="text-sm text-zinc-400">Цвет</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = option.value === value
          return (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={option.label}
              title={option.label}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border-2 text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
                isSelected ? 'border-zinc-100' : 'border-transparent',
                option.value === null && 'text-[10px] font-semibold'
              )}
              style={{ backgroundColor: option.swatch }}
            >
              {isSelected ? (
                <Check className="h-4 w-4" />
              ) : option.value === null ? (
                'A'
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
