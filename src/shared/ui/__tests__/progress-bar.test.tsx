import { render, screen } from '@testing-library/react'

import { ProgressBar } from '../progress-bar'

describe('ProgressBar', () => {
  it('renders with correct ARIA attributes', () => {
    render(<ProgressBar value={50} max={100} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '50')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('displays label when provided', () => {
    render(<ProgressBar value={50} max={100} label="Progress" />)
    expect(screen.getByText('Progress')).toBeInTheDocument()
  })

  it('shows percentage text when showPercentage is true', () => {
    render(<ProgressBar value={75} max={100} showPercentage />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('maintains ARIA attributes when value exceeds max', () => {
    render(<ProgressBar value={150} max={100} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '150')
  })
})
