import { fireEvent, render, screen, within } from '@testing-library/react'
import { useRef, useState } from 'react'

import { AnalysisCategoryDetailsDialog } from '../ui/analysis-category-details-dialog'

import type { CategoryStat, ExpenseScope } from '@/shared/lib'
import type { Expense } from '@/shared/types'

const SELECTED_DATE = new Date(2026, 0, 15)
const CATEGORY: CategoryStat = {
  name: 'Кафе',
  value: 600,
  personalValue: 600,
  sharedValue: 0,
  projectValue: 0,
  emoji: '☕',
  percent: 100,
}

function expense(
  id: string,
  description: string,
  amount: number,
  date = '2026-01-15',
  overrides: Partial<Expense> = {}
): Expense {
  return {
    id,
    description,
    amount,
    date,
    category: 'Кафе',
    emoji: '☕',
    ...overrides,
  }
}

interface DialogHarnessProps {
  expenses: Expense[]
  scope?: ExpenseScope
}

function DialogHarness({ expenses, scope = 'all' }: DialogHarnessProps) {
  const [isOpen, setIsOpen] = useState(true)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setIsOpen(true)}>
        Открыть детали
      </button>
      {isOpen && (
        <AnalysisCategoryDetailsDialog
          category={CATEGORY}
          expenses={expenses}
          selectedDate={SELECTED_DATE}
          scope={scope}
          triggerRef={triggerRef}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

describe('AnalysisCategoryDetailsDialog', () => {
  it('shows read-only expense rows grouped by descending date', () => {
    const expenses = [
      expense('older', 'столовка', 300, '2026-01-03'),
      expense('newer', 'столовая', 200, '2026-01-18'),
      expense('movement', 'Перевод', 500, '2026-01-21', {
        operationType: 'project_withdrawal',
        projectId: 'project-1',
      }),
    ]

    render(<DialogHarness expenses={expenses} />)

    const dateHeadings = screen.getAllByRole('heading', { level: 3 })
    expect(dateHeadings.map((heading) => heading.textContent)).toEqual([
      '18.01.2026',
      '03.01.2026',
    ])
    expect(screen.getByTestId('category-expense-newer')).toHaveTextContent(
      'столовая'
    )
    expect(
      within(screen.getByTestId('category-expense-newer')).queryByRole('button')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId('category-expense-movement')
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('analysis-category-details-dialog')).toHaveClass(
      'h-full',
      'md:max-w-3xl'
    )
    expect(
      screen.getByTestId('analysis-category-details-backdrop')
    ).toHaveClass('md:flex')
    expect(
      screen.getByTestId('analysis-category-details-backdrop').parentElement
    ).toBe(document.body)
  })

  it('keeps personal project expenses and read-only rows out of shared scope', () => {
    const expenses = [
      expense('personal', 'столовка', 100),
      expense('project', 'столовая', 200, '2026-01-16', {
        projectId: 'project-1',
      }),
      expense('shared', 'Кофе общий', 300, '2026-01-17', {
        sharedBudgetId: 'shared-1',
      }),
    ]

    render(<DialogHarness expenses={expenses} scope="personal" />)

    expect(screen.getByTestId('category-expense-personal')).toBeInTheDocument()
    expect(screen.getByTestId('category-expense-project')).toBeInTheDocument()
    expect(
      screen.queryByTestId('category-expense-shared')
    ).not.toBeInTheDocument()
    expect(
      screen.getByTestId('analysis-category-details-summary')
    ).toHaveTextContent('Найдено: 2 из 2 · 300 ₽ из 300 ₽')
  })

  it('inspects group spellings and applies selected name groups as an immediate OR filter', () => {
    const expenses = [
      expense('cafe-1', 'столовка', 300),
      expense('cafe-2', 'столовка', 200, '2026-01-16'),
      expense('cafe-3', 'столовая', 100, '2026-01-17'),
      expense('tea', 'чай', 50, '2026-01-18'),
      expense('water', 'вода', 40, '2026-01-19'),
    ]

    render(<DialogHarness expenses={expenses} />)

    expect(
      screen.getByTestId('analysis-category-details-summary')
    ).toHaveTextContent('Найдено: 5 из 5 · 690 ₽ из 690 ₽')

    const spellingDisclosure = screen.getByLabelText(
      'Варианты названия столовка'
    )
    fireEvent.click(spellingDisclosure)
    expect(
      within(spellingDisclosure.closest('details')!).getByText('столовая')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /столовка/ }))
    fireEvent.click(screen.getByRole('button', { name: /чай/ }))

    expect(
      screen.getByTestId('analysis-category-details-summary')
    ).toHaveTextContent('Найдено: 4 из 5 · 650 ₽ из 690 ₽')
    expect(screen.getByTestId('category-expense-cafe-3')).toBeInTheDocument()
    expect(screen.getByTestId('category-expense-tea')).toBeInTheDocument()
    expect(
      screen.queryByTestId('category-expense-water')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId('analysis-category-details-empty-filter')
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /чай/ }))
    expect(
      screen.getByTestId('analysis-category-details-summary')
    ).toHaveTextContent('Найдено: 3 из 5 · 600 ₽ из 690 ₽')

    fireEvent.click(screen.getByRole('button', { name: /столовка/ }))
    expect(
      screen.getByTestId('analysis-category-details-summary')
    ).toHaveTextContent('Найдено: 5 из 5 · 690 ₽ из 690 ₽')
  })

  it('shows eight groups first and keeps a selected hidden group visible when collapsed', () => {
    const expenses = Array.from({ length: 10 }, (_, index) =>
      expense(String(index), `Вариант ${index}`, 100)
    )

    render(<DialogHarness expenses={expenses} />)

    expect(
      screen.queryByRole('button', { name: /Вариант 9/ })
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Показать все (10)' }))
    fireEvent.click(screen.getByRole('button', { name: /Вариант 9/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Свернуть' }))

    expect(screen.getByRole('button', { name: /Вариант 9/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(
      screen.getByTestId('analysis-category-details-summary')
    ).toHaveTextContent('Найдено: 1 из 10 · 100 ₽ из 1 000 ₽')
  })

  it('shows a base empty state separately from a filter with no matches', () => {
    const { rerender } = render(<DialogHarness expenses={[]} />)

    expect(
      screen.getByTestId('analysis-category-details-empty-base')
    ).toBeInTheDocument()

    rerender(<DialogHarness expenses={[expense('tea', 'чай', 100)]} />)
    fireEvent.click(screen.getByRole('button', { name: /чай/ }))
    rerender(<DialogHarness expenses={[expense('water', 'вода', 100)]} />)

    expect(
      screen.getByTestId('analysis-category-details-empty-filter')
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId('analysis-category-details-empty-base')
    ).not.toBeInTheDocument()
  })

  it('traps focus, closes on Escape, restores the trigger, and resets filters on reopen', () => {
    const expenses = [
      expense('tea', 'чай', 100),
      ...Array.from({ length: 9 }, (_, index) =>
        expense(`item-${index}`, `Вариант ${index}`, 100)
      ),
    ]

    render(<DialogHarness expenses={expenses} />)

    const closeButton = screen.getByRole('button', {
      name: 'Закрыть расходы категории',
    })
    expect(closeButton).toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Показать все (10)' }))
    fireEvent.click(screen.getByRole('button', { name: /чай/ }))
    screen.getByRole('button', { name: 'Свернуть' }).focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(closeButton).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Открыть детали' })).toHaveFocus()
    expect(document.body.style.overflow).toBe('')

    fireEvent.click(screen.getByRole('button', { name: 'Открыть детали' }))
    expect(
      screen.getByTestId('analysis-category-details-summary')
    ).toHaveTextContent('Найдено: 10 из 10 · 1 000 ₽ из 1 000 ₽')
  })
})
