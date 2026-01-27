import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

import { cn } from '@/shared/lib'

export interface ResponsiveContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Additional padding class overrides */
  paddingClass?: string
}

/**
 * Wrapper component with responsive padding.
 * Mobile: p-3 (12px), Tablet: p-4 (16px), Desktop: p-6 (24px)
 */
export const ResponsiveContainer = forwardRef<
  HTMLDivElement,
  ResponsiveContainerProps
>(({ className, paddingClass, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('p-3 sm:p-4 lg:p-6', paddingClass, className)}
      {...props}
    >
      {children}
    </div>
  )
})

ResponsiveContainer.displayName = 'ResponsiveContainer'
