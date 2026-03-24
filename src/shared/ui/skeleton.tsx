import { cn } from '@/shared/lib'

import type { HTMLAttributes } from 'react'

type SkeletonProps = HTMLAttributes<HTMLDivElement>

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded bg-zinc-800/80', className)}
      {...props}
    />
  )
}

interface SkeletonTextProps extends SkeletonProps {
  widthClassName?: string
}

export function SkeletonText({
  className,
  widthClassName = 'w-full',
  ...props
}: SkeletonTextProps) {
  return (
    <Skeleton
      className={cn('h-4 rounded', widthClassName, className)}
      {...props}
    />
  )
}

export function SkeletonCircle({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn('rounded-full', className)} {...props} />
}

export function SkeletonRect({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn('rounded-lg', className)} {...props} />
}
