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

  it('labels pocket purchases distinctly', () => {
    render(
      <ExpenseCard
        expense={{ ...mockExpense, pocketId: 'pocket-1' }}
        onDelete={jest.fn()}
      />
    )

    expect(screen.getByText('Покупка из кармана')).toBeInTheDocument()
  })

  it('labels and allows editing a pocket transfer amount', async () => {
    const onEdit = jest.fn()
    render(
      <ExpenseCard
        expense={{
          ...mockExpense,
          pocketId: 'pocket-1',
          operationType: 'pocket_transfer',
          category: 'Перевод из кармана',
          emoji: '↗️',
        }}
        onDelete={jest.fn()}
        onEdit={onEdit}
      />
    )

    expect(screen.getAllByText('Перевод из кармана')).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: /edit amount/i }))
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, '150')
    fireEvent.blur(input)

    expect(onEdit).toHaveBeenCalledWith('1', { amount: 150 })
  })

  it('shows the pocket name on a pocket purchase', () => {
    render(
      <ExpenseCard
        expense={{ ...mockExpense, pocketId: 'pocket-1' }}
        pocketName="Кафе"
        onDelete={jest.fn()}
      />
    )

    expect(screen.getByText('Из кармана: Кафе')).toBeInTheDocument()
    expect(screen.queryByText('Покупка из кармана')).not.toBeInTheDocument()
  })

  it('shows the pocket name on a pocket transfer', () => {
    render(
      <ExpenseCard
        expense={{
          ...mockExpense,
          pocketId: 'pocket-1',
          operationType: 'pocket_transfer',
          category: 'Перевод из кармана',
          emoji: '↗️',
        }}
        pocketName="Кафе"
        onDelete={jest.fn()}
      />
    )

    // The category line reads «Перевод из кармана»; the badge names only the pocket.
    expect(screen.getByText('Кафе')).toBeInTheDocument()
    expect(screen.getAllByText(/Перевод из кармана/)).toHaveLength(1)
  })

  it('styles a pocket transfer apart from expenses', () => {
    const { container } = render(
      <ExpenseCard
        expense={{
          ...mockExpense,
          pocketId: 'pocket-1',
          operationType: 'pocket_transfer',
          category: 'Перевод из кармана',
        }}
        pocketName="Кафе"
      />
    )

    const card = container.querySelector('[data-operation-type]')
    expect(card).toHaveAttribute('data-operation-type', 'pocket_transfer')
    expect(card).toHaveClass('border-dashed')
    expect(screen.getByRole('button', { name: /edit amount/i })).toHaveClass(
      'text-violet-300'
    )
  })

  it('shows a placeholder instead of the generic badge while the name loads', () => {
    render(
      <ExpenseCard
        expense={{ ...mockExpense, pocketId: 'pocket-1' }}
        isPocketNameLoading
      />
    )

    expect(screen.getByTestId('pocket-badge-placeholder-1')).toBeInTheDocument()
    expect(screen.queryByText('Покупка из кармана')).not.toBeInTheDocument()
  })

  it('ignores the loading flag on an operation without a pocket', () => {
    render(<ExpenseCard expense={mockExpense} isPocketNameLoading />)

    expect(
      screen.queryByTestId('pocket-badge-placeholder-1')
    ).not.toBeInTheDocument()
    expect(screen.getByText('Личный расход')).toBeInTheDocument()
  })

  it('ignores a pocket name on an operation without a pocket', () => {
    render(
      <ExpenseCard
        expense={mockExpense}
        pocketName="Кафе"
        onDelete={jest.fn()}
      />
    )

    expect(screen.getByText('Личный расход')).toBeInTheDocument()
    expect(screen.queryByText(/Кафе/)).not.toBeInTheDocument()
  })

  it('renders shared budget metadata for shared expenses', () => {
    render(
      <ExpenseCard
        expense={{
          ...mockExpense,
          sharedBudgetId: 'shared-1',
          sharedBudgetName: 'Дом',
          authorName: 'Партнер',
        }}
        onDelete={jest.fn()}
      />
    )

    expect(screen.getByText('Общий расход')).toBeInTheDocument()
    expect(screen.getByText(/Общий бюджет:/)).toHaveTextContent(
      'Общий бюджет: Дом'
    )
    expect(screen.getByText('Автор: Партнер')).toBeInTheDocument()
  })

  it('does not render date by default', () => {
    render(<ExpenseCard expense={mockExpense} onDelete={jest.fn()} />)
    expect(screen.queryByText('15.01.2024')).not.toBeInTheDocument()
  })

  it('renders formatted date when showDate is enabled', () => {
    render(<ExpenseCard expense={mockExpense} onDelete={jest.fn()} showDate />)

    expect(screen.getByText('15.01.2024')).toBeInTheDocument()
  })

  it('opens confirmation dialog when delete button is clicked', () => {
    const onDelete = jest.fn()
    render(<ExpenseCard expense={mockExpense} onDelete={onDelete} />)

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    fireEvent.click(deleteButton)

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Удалить операцию?')).toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it('does not call onDelete when delete confirmation is canceled', () => {
    const onDelete = jest.fn()
    render(<ExpenseCard expense={mockExpense} onDelete={onDelete} />)

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('calls onDelete with correct id when delete is confirmed', () => {
    const onDelete = jest.fn()
    render(<ExpenseCard expense={mockExpense} onDelete={onDelete} />)

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith('1')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
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

    it('saves the current value on Enter', async () => {
      const onEdit = jest.fn()
      render(
        <ExpenseCard
          expense={mockExpense}
          onDelete={jest.fn()}
          onEdit={onEdit}
        />
      )

      await userEvent.click(
        screen.getByRole('button', { name: /edit amount/i })
      )
      const input = screen.getByRole('textbox')
      await userEvent.clear(input)
      await userEvent.type(input, '325')
      await userEvent.keyboard('{Enter}')

      expect(onEdit).toHaveBeenCalledTimes(1)
      expect(onEdit).toHaveBeenCalledWith('1', { amount: 325 })
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('cancels an amount edit on Escape', async () => {
      const onEdit = jest.fn()
      render(
        <ExpenseCard
          expense={mockExpense}
          onDelete={jest.fn()}
          onEdit={onEdit}
        />
      )

      await userEvent.click(
        screen.getByRole('button', { name: /edit amount/i })
      )
      const input = screen.getByRole('textbox')
      await userEvent.clear(input)
      await userEvent.type(input, '999')
      await userEvent.keyboard('{Escape}')

      expect(onEdit).not.toHaveBeenCalled()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /edit amount/i })
      ).toHaveTextContent('250')
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

  describe('full editor and delete confirmation', () => {
    it('opens the full editor from the edit button', () => {
      const onOpenEditor = jest.fn()
      render(<ExpenseCard expense={mockExpense} onOpenEditor={onOpenEditor} />)

      fireEvent.click(screen.getByRole('button', { name: 'Изменить операцию' }))
      expect(onOpenEditor).toHaveBeenCalledWith(mockExpense)
    })

    it('hides the edit button for an archived pocket operation', () => {
      render(
        <ExpenseCard
          expense={{ ...mockExpense, pocketId: 'pocket-1' }}
          onOpenEditor={jest.fn()}
          isPocketArchived
        />
      )
      expect(
        screen.queryByRole('button', { name: 'Изменить операцию' })
      ).not.toBeInTheDocument()
    })

    it('names the record in the delete confirmation and mentions no loss when undo exists', () => {
      render(
        <ExpenseCard expense={mockExpense} onDelete={jest.fn()} canUndoDelete />
      )
      fireEvent.click(screen.getByRole('button', { name: 'delete' }))

      const [year, month, day] = mockExpense.date.split('-')
      expect(
        screen.getByText(
          `«${mockExpense.description}» · ${mockExpense.amount} ₽ · ${day}.${month}.${year}`
        )
      ).toBeInTheDocument()
      expect(
        screen.queryByText(/без возможности восстановления/)
      ).not.toBeInTheDocument()
    })

    it('keeps the irreversible warning where undo is not offered', () => {
      render(<ExpenseCard expense={mockExpense} onDelete={jest.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: 'delete' }))
      expect(
        screen.getByText(/без возможности восстановления/)
      ).toBeInTheDocument()
    })
  })
})
