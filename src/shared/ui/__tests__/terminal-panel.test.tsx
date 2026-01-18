import { render, screen, fireEvent } from '@testing-library/react'

import { TerminalPanel } from '../terminal-panel'

describe('TerminalPanel', () => {
  it('renders children correctly', () => {
    render(
      <TerminalPanel title="Test Panel">
        <p>Content</p>
      </TerminalPanel>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('displays title', () => {
    render(<TerminalPanel title="Test Title">Content</TerminalPanel>)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('displays icon when provided', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>
    render(
      <TerminalPanel title="Test" icon={<TestIcon />}>
        Content
      </TerminalPanel>
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('shows delete button in edit mode', () => {
    const handleDelete = jest.fn()
    render(
      <TerminalPanel title="Test" isEditMode onDelete={handleDelete}>
        Content
      </TerminalPanel>
    )
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', () => {
    const handleDelete = jest.fn()
    render(
      <TerminalPanel title="Test" isEditMode onDelete={handleDelete}>
        Content
      </TerminalPanel>
    )

    fireEvent.click(screen.getByRole('button'))
    expect(handleDelete).toHaveBeenCalledTimes(1)
  })

  it('hides delete button when not in edit mode', () => {
    const handleDelete = jest.fn()
    render(
      <TerminalPanel title="Test" isEditMode={false} onDelete={handleDelete}>
        Content
      </TerminalPanel>
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('applies dark theme styling', () => {
    render(
      <TerminalPanel title="Test" data-testid="panel">
        Content
      </TerminalPanel>
    )
    const panel = screen.getByTestId('panel')
    expect(panel).toHaveClass('bg-zinc-900/30')
  })
})
