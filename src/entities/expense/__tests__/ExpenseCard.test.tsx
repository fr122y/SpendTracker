import { render, screen, fireEvent } from '@testing-library/react'

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
})
