import { render, screen } from '@testing-library/react'

import { ProgressBar } from '../progress-bar'

describe('ProgressBar', () => {
  it('renders with correct percentage', () => {
    render(<ProgressBar value={50} max={100} />)
    // The bar should have a visual indicator at 50%
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '50')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
  })

  it('displays label when provided', () => {
    render(<ProgressBar value={50} max={100} label="Progress" />)
    expect(screen.getByText('Progress')).toBeInTheDocument()
  })

  it('shows green color for low percentage (0-50%)', () => {
    render(<ProgressBar value={30} max={100} data-testid="progress" />)
    const bar = screen.getByTestId('progress')
    const indicator = bar.querySelector('[class*="bg-emerald"]')
    expect(indicator).toBeInTheDocument()
  })

  it('shows yellow color for medium percentage (50-80%)', () => {
    render(<ProgressBar value={70} max={100} data-testid="progress" />)
    const bar = screen.getByTestId('progress')
    const indicator = bar.querySelector('[class*="bg-yellow"]')
    expect(indicator).toBeInTheDocument()
  })

  it('shows red color for high percentage (80-100%)', () => {
    render(<ProgressBar value={90} max={100} data-testid="progress" />)
    const bar = screen.getByTestId('progress')
    const indicator = bar.querySelector('[class*="bg-red"]')
    expect(indicator).toBeInTheDocument()
  })

  it('caps at 100% when value exceeds max', () => {
    render(<ProgressBar value={150} max={100} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '150')
  })

  it('shows percentage text when showPercentage is true', () => {
    render(<ProgressBar value={75} max={100} showPercentage />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })
})
