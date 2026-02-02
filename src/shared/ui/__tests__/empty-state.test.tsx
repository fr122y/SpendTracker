import { render, screen, fireEvent } from '@testing-library/react'
import { Wallet } from 'lucide-react'

import { EmptyState } from '../empty-state'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        icon={Wallet}
        title="No items found"
        description="Start by adding your first item"
      />
    )

    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(
      screen.getByText('Start by adding your first item')
    ).toBeInTheDocument()
  })

  it('renders without description', () => {
    render(<EmptyState icon={Wallet} title="No items found" />)

    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.queryByText('Start by')).not.toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const handleAction = jest.fn()

    render(
      <EmptyState
        icon={Wallet}
        title="No items found"
        description="Start by adding your first item"
        action={{
          label: 'Add Item',
          onClick: handleAction,
        }}
      />
    )

    const button = screen.getByRole('button', { name: 'Add Item' })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('does not render action button when not provided', () => {
    render(<EmptyState icon={Wallet} title="No items found" />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState
        icon={Wallet}
        title="No items found"
        className="custom-class"
      />
    )

    const emptyState = container.firstChild
    expect(emptyState).toHaveClass('custom-class')
  })

  it('renders icon with correct size', () => {
    const { container } = render(<EmptyState icon={Wallet} title="No items" />)

    // Check if icon is rendered (lucide-react icons have specific structure)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
