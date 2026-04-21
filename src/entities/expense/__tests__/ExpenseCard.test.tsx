import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ExpenseCard } from '../ui/expense-card'

import type { Expense } from '@/shared/types'

const mockExpense: Expense = {
  id: '1',
  description: 'Coffee',
  amount: 250,
  date: '2024-01-15',
  category: 'Food',
  emoji: '☕',
}

describe('ExpenseCard', () => {
  it('renders emoji correctly', () => {
    render(<ExpenseCard expense={mockExpense} onDelete={jest.fn()} />)
    expect(screen.getByText('☕')).toBeInTheDocument()
  })

  it('renders description correctly', () => {
    render(<ExpenseCard expense={mockExpense} onDelete={jest.fn()} />)
    expect(screen.getByText('Coffee')).toBeInTheDocument()
  })

  it('renders amount correctly', () => {
    render(<ExpenseCard expense={mockExpense} onDelete={jest.fn()} />)
    expect(screen.getByText(/250/)).toBeInTheDocument()
  })

  it('renders category correctly', () => {
    render(<ExpenseCard expense={mockExpense} onDelete={jest.fn()} />)
    expect(screen.getByText('Food')).toBeInTheDocument()
  })

  it('does not render date by default', () => {
    render(<ExpenseCard expense={mockExpense} onDelete={jest.fn()} />)
    expect(screen.queryByText('15.01.2024')).not.toBeInTheDocument()
  })

  it('renders formatted date when showDate is enabled', () => {
    render(<ExpenseCard expense={mockExpense} onDelete={jest.fn()} showDate />)

    expect(screen.getByText('15.01.2024')).toBeInTheDocument()
  })

  it('calls onDelete with correct id when delete button is clicked', () => {
    const onDelete = jest.fn()
    render(<ExpenseCard expense={mockExpense} onDelete={onDelete} />)

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('delete button has accessible label', () => {
    render(<ExpenseCard expense={mockExpense} onDelete={jest.fn()} />)
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  describe('editing amount', () => {
    it('enters edit mode when amount is clicked and onEdit is provided', async () => {
      const onEdit = jest.fn()
      render(
        <ExpenseCard
          expense={mockExpense}
          onDelete={jest.fn()}
          onEdit={onEdit}
        />
      )

      const amountButton = screen.getByRole('button', { name: /edit amount/i })
      await userEvent.click(amountButton)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toHaveValue('250')
    })

    it('does not enter edit mode when onEdit is not provided', async () => {
      render(<ExpenseCard expense={mockExpense} onDelete={jest.fn()} />)

      const amountButton = screen.getByRole('button', { name: /edit amount/i })
      expect(amountButton).toBeDisabled()
    })

    it('calls onEdit with new amount on blur', async () => {
      const onEdit = jest.fn()
      render(
        <ExpenseCard
          expense={mockExpense}
          onDelete={jest.fn()}
          onEdit={onEdit}
        />
      )

      const amountButton = screen.getByRole('button', { name: /edit amount/i })
      await userEvent.click(amountButton)

      const input = screen.getByRole('textbox')
      await userEvent.clear(input)
      await userEvent.type(input, '300')
      fireEvent.blur(input)

      expect(onEdit).toHaveBeenCalledWith('1', { amount: 300 })
    })

    it('calls onEdit with evaluated math expression', async () => {
      const onEdit = jest.fn()
      render(
        <ExpenseCard
          expense={mockExpense}
          onDelete={jest.fn()}
          onEdit={onEdit}
        />
      )

      const amountButton = screen.getByRole('button', { name: /edit amount/i })
      await userEvent.click(amountButton)

      const input = screen.getByRole('textbox')
      await userEvent.clear(input)
      await userEvent.type(input, '200+100')
      fireEvent.blur(input)

      expect(onEdit).toHaveBeenCalledWith('1', { amount: 300 })
    })

    it('does not call onEdit when value is unchanged', async () => {
      const onEdit = jest.fn()
      render(
        <ExpenseCard
          expense={mockExpense}
          onDelete={jest.fn()}
          onEdit={onEdit}
        />
      )

      const amountButton = screen.getByRole('button', { name: /edit amount/i })
      await userEvent.click(amountButton)

      const input = screen.getByRole('textbox')
      fireEvent.blur(input)

      expect(onEdit).not.toHaveBeenCalled()
    })
  })
})
