import { type LucideIcon } from 'lucide-react'

import { cn } from '@/shared/lib'

export interface EmptyStateProps {
  /**
   * The icon component to display (from lucide-react)
   */
  icon: LucideIcon
  /**
   * The main title text
   */
  title: string
  /**
   * Optional description text
   */
  description?: string
  /**
   * Optional action button configuration
   */
  action?: {
    label: string
    onClick: () => void
  }
  /**
   * Optional additional className
   */
  className?: string
}

/**
 * EmptyState Component
 *
 * A standardized empty state component following design system principles:
 * - Contrast: Uses zinc-500 for subtle, non-intrusive messaging
 * - Alignment: Center-aligned content for visual balance
 * - Proximity: Grouped icon, title, and description with appropriate spacing
 * - Typography: Responsive text sizes for readability
 *
 * @example
 * <EmptyState
 *   icon={Wallet}
 *   title="Нет операций за этот день"
 *   description="Добавьте первую операцию"
 *   action={{ label: "Добавить", onClick: handleAdd }}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        /* ⚡ Auto-fix: Center alignment for empty states (Principle: Alignment) */
        /* ⚡ Auto-fix: Vertical spacing using gap-3 for proximity (Principle: Proximity) */
        'flex flex-col items-center justify-center gap-3 py-8 sm:py-12',
        'animate-fade-in', // Fade in animation for smooth appearance
        className
      )}
    >
      {/* Icon */}
      <div className="text-zinc-600">
        <Icon
          className="h-12 w-12 sm:h-16 sm:w-16"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>

      {/* Title */}
      <h3 className="text-sm sm:text-base font-medium text-zinc-400 text-center">
        {title}
      </h3>

      {/* Description (Optional) */}
      {description && (
        <p className="text-xs sm:text-sm text-zinc-500 text-center max-w-xs">
          {description}
        </p>
      )}

      {/* Action Button (Optional) */}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            /* ⚡ Auto-fix: Using design tokens for button styling */
            'mt-2 px-4 py-2 min-h-11 rounded-md',
            'bg-zinc-800/50 border border-zinc-700',
            'text-xs sm:text-sm font-medium text-zinc-300',
            'transition-all duration-200',
            'hover:bg-zinc-800 hover:text-white hover:border-zinc-600',
            'active:scale-[0.98]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
