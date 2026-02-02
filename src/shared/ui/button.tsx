import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cn } from '@/shared/lib'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    /* ⚡ Auto-fix: Added active: states for click feedback (Principle: Interaction States) */
    /* ⚡ Auto-fix: Added focus-visible instead of focus for better keyboard UX */
    /* ⚡ Auto-fix: Added min-h-11 for 44px touch target compliance (Principle: Touch Targets) */
    /* ⚡ Auto-fix: Changed rounded to rounded-md for consistency (Principle: Repetition) */
    /* ⚡ Auto-fix: Added btn-press utility for press feedback (Principle: Interaction States) */
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-mono font-bold uppercase text-xs tracking-wider px-4 py-2 min-h-11 rounded-md transition-all btn-press focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed'

    /* ⚡ Auto-fix: Enhanced ghost variant with bg and border for affordance (Principle: Contrast) */
    /* ⚡ Auto-fix: Added shadow-md with blue glow to primary button (Principle: Proximity) */
    /* ⚡ Auto-fix: Added red border to danger for better visual distinction (Principle: Contrast) */
    const variants = {
      primary:
        'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-md shadow-blue-600/20',
      ghost:
        'bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 active:bg-zinc-700 text-zinc-400 hover:text-white',
      danger:
        'text-red-400 border border-red-500/30 hover:bg-red-500/10 active:bg-red-500/20',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
