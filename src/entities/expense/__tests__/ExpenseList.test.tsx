import { render, screen } from '@testing-library/react'

import { ExpenseList } from '../ui/expense-list'

import type { Expense } from '@/shared/types'

const purchase: Expense = {
  id: 'purchase',
  description: 'Latte',
  amount: 300,
  date: '2026-01-23',
  category: 'Кафе и рестораны',
  emoji: '☕',
  pocketId: 'pocket-1',
}

const transfer: Expense = {
  id: 'transfer',
  description: 'Groceries from pocket',
  amount: 400,
  date: '2026-01-23',
  category: 'Перевод из кармана',
  emoji: '↗️',
  pocketId: 'pocket-2',
  operationType: 'pocket_transfer',
}

const personal: Expense = {
  id: 'personal',
  description: 'Bus',
  amount: 50,
  date: '2026-01-23',
  category: 'Транспорт',
  emoji: '🚌',
}

describe('ExpenseList', () => {
  it('gives each pocket operation the name of its own pocket', () => {
    render(
      <ExpenseList
        expenses={[purchase, transfer, personal]}
        pocketNames={
          new Map([
            ['pocket-1', 'Кафе'],
            ['pocket-2', 'Отпуск'],
          ])
        }
        onDelete={jest.fn()}
      />
    )

    expect(screen.getByText('Из кармана: Кафе')).toBeInTheDocument()
    expect(screen.getByText('Перевод из кармана: Отпуск')).toBeInTheDocument()
    expect(screen.getByText('Личный расход')).toBeInTheDocument()
  })

  it('keeps the badge without a name for a pocket missing from the names', () => {
    render(
      <ExpenseList
        expenses={[purchase, transfer]}
        pocketNames={new Map([['pocket-2', 'Отпуск']])}
        onDelete={jest.fn()}
      />
    )

    expect(screen.getByText('Покупка из кармана')).toBeInTheDocument()
    expect(screen.getByText('Перевод из кармана: Отпуск')).toBeInTheDocument()
  })

  it('keeps the badges without names when no names are passed', () => {
    render(<ExpenseList expenses={[purchase, transfer]} onDelete={jest.fn()} />)

    expect(screen.getByText('Покупка из кармана')).toBeInTheDocument()
    // Category and badge of the transfer both read «Перевод из кармана».
    expect(screen.getAllByText('Перевод из кармана')).toHaveLength(2)
  })
})
