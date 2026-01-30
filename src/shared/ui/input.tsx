import { forwardRef, type InputHTMLAttributes } from 'react'

import { cn } from '@/shared/lib'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-zinc-400"
          >
            {label}
          </label>
        )}
        {/* ⚡ Auto-fix: Removed text-ellipsis overflow-hidden - inputs should allow horizontal text scroll while typing (Principle: Engineering UX) */}
        {/* Input fields need to show full content as user types - truncation prevents visibility of long bucket names */}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-md transition-colors',
            'bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-600',
            'hover:border-zinc-600',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-zinc-700',
            error &&
              'border-red-500 focus-visible:ring-red-500 hover:border-red-400',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
