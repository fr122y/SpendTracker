import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ConfirmDialog } from '../confirm-dialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Удалить проект?',
    description: 'Будут удалены все операции проекта.',
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <ConfirmDialog {...defaultProps} isOpen={false} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders title, description, and default actions when open', () => {
    render(<ConfirmDialog {...defaultProps} />)

    expect(screen.getByText('Удалить проект?')).toBeInTheDocument()
    expect(
      screen.getByText('Будут удалены все операции проекта.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument()
  })

  it('renders custom action labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Подтвердить"
        cancelLabel="Назад"
      />
    )

    expect(
      screen.getByRole('button', { name: 'Подтвердить' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Назад' })).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when cancel button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />)

    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    expect(defaultProps.onConfirm).not.toHaveBeenCalled()
  })

  it('calls onClose when Escape is pressed', () => {
    render(<ConfirmDialog {...defaultProps} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />)

    const backdrop = screen.getByRole('alertdialog').parentElement!
    fireEvent.click(backdrop)

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when dialog content is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />)

    fireEvent.click(screen.getByRole('alertdialog'))

    expect(defaultProps.onClose).not.toHaveBeenCalled()
  })

  it('uses alert dialog semantics', () => {
    render(<ConfirmDialog {...defaultProps} />)

    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Удалить проект?')
    expect(dialog).toHaveAccessibleDescription(
      'Будут удалены все операции проекта.'
    )
  })

  it('focuses cancel button when opened', async () => {
    render(<ConfirmDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Отмена' })).toHaveFocus()
    })
  })

  it('disables actions and shows loading state while confirming', () => {
    render(<ConfirmDialog {...defaultProps} isConfirming />)

    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeDisabled()
  })
})
