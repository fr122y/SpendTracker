import { render, screen, fireEvent } from '@testing-library/react'

import { ColumnResizer } from '../ui/column-resizer'

describe('ColumnResizer', () => {
  it('renders resizer handle', () => {
    render(
      <ColumnResizer columnId="col-1" onResize={jest.fn()} isEditMode={true} />
    )

    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('does not render when not in edit mode', () => {
    render(
      <ColumnResizer columnId="col-1" onResize={jest.fn()} isEditMode={false} />
    )

    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
  })

  it('has draggable attribute when in edit mode', () => {
    render(
      <ColumnResizer columnId="col-1" onResize={jest.fn()} isEditMode={true} />
    )

    const separator = screen.getByRole('separator')
    expect(separator).toHaveAttribute('draggable', 'true')
  })

  it('calls onResize when dragged', () => {
    const onResize = jest.fn()
    render(
      <ColumnResizer columnId="col-1" onResize={onResize} isEditMode={true} />
    )

    const separator = screen.getByRole('separator')

    const mockDataTransfer = {
      setData: jest.fn(),
      effectAllowed: '',
    }

    // Simulate drag start
    fireEvent.dragStart(separator, {
      clientX: 100,
      dataTransfer: mockDataTransfer,
    })

    // Simulate drag end
    fireEvent.dragEnd(separator, {
      clientX: 150,
    })

    expect(onResize).toHaveBeenCalled()
  })

  it('has proper aria label', () => {
    render(
      <ColumnResizer columnId="col-1" onResize={jest.fn()} isEditMode={true} />
    )

    expect(
      screen.getByLabelText(/изменить размер колонки/i)
    ).toBeInTheDocument()
  })
})
