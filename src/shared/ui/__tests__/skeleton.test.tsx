import { render, screen } from '@testing-library/react'

import {
  Skeleton,
  SkeletonCircle,
  SkeletonRect,
  SkeletonText,
} from '../skeleton'

describe('Skeleton', () => {
  it('renders base skeleton with pulse animation class', () => {
    render(<Skeleton data-testid="skeleton" />)

    expect(screen.getByTestId('skeleton')).toHaveClass('animate-pulse')
  })

  it('applies custom className', () => {
    render(<Skeleton data-testid="skeleton" className="h-10 w-20" />)

    expect(screen.getByTestId('skeleton')).toHaveClass('h-10', 'w-20')
  })

  it('renders skeleton text variant', () => {
    render(<SkeletonText data-testid="skeleton-text" widthClassName="w-32" />)

    expect(screen.getByTestId('skeleton-text')).toHaveClass('h-4', 'w-32')
  })

  it('renders skeleton circle variant', () => {
    render(<SkeletonCircle data-testid="skeleton-circle" className="h-8 w-8" />)

    expect(screen.getByTestId('skeleton-circle')).toHaveClass(
      'rounded-full',
      'h-8',
      'w-8'
    )
  })

  it('renders skeleton rect variant', () => {
    render(<SkeletonRect data-testid="skeleton-rect" className="h-8 w-8" />)

    expect(screen.getByTestId('skeleton-rect')).toHaveClass(
      'rounded-lg',
      'h-8',
      'w-8'
    )
  })
})
