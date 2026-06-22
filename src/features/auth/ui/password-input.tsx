'use client'

import { Eye, EyeOff } from 'lucide-react'
import { type ChangeEvent, useState } from 'react'

interface PasswordInputProps {
  placeholder: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  showLabel: string
  hideLabel: string
}

export function PasswordInput({
  placeholder,
  value,
  onChange,
  showLabel,
  hideLabel,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)
  const Icon = isVisible ? EyeOff : Eye

  return (
    <div className="relative">
      <input
        type={isVisible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 pr-12 text-sm text-zinc-200 placeholder-zinc-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />
      <button
        type="button"
        aria-label={isVisible ? hideLabel : showLabel}
        onClick={() => setIsVisible((current) => !current)}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-zinc-500 transition-colors hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800"
      >
        <Icon aria-hidden="true" size={18} />
      </button>
    </div>
  )
}
