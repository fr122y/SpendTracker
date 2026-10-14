import { act, fireEvent, render, screen } from '@testing-library/react'

import { EMPTY_STATE } from '../lib/expression'
import { updateCalculator } from '../model/calculator-store'
import { CalculatorLauncher } from '../ui/calculator-launcher'

import type { AllocationBucket } from '@/shared/types'

let mockViewport: 'mobile' | 'tablet' | 'desktop' = 'desktop'
let mockSalary = 80000
let mockBuckets: AllocationBucket[] = []

jest.mock('@/shared/lib', () => ({
  ...jest.requireActual('@/shared/lib'),
  useViewport: () => mockViewport,
}))

jest.mock('@/entities/bucket', () => ({
  useBucketStore: (
    selector: (state: {
      buckets: AllocationBucket[]
      isLoading: boolean
    }) => unknown
  ) => selector({ buckets: mockBuckets, isLoading: false }),
}))

jest.mock('@/entities/settings', () => ({
  useSettingsStore: (
    selector: (state: { salary: number; isLoading: boolean }) => unknown
  ) => selector({ salary: mockSalary, isLoading: false }),
}))

const writeText = jest.fn<Promise<void>, [string]>()

beforeEach(() => {
  mockViewport = 'desktop'
  mockSalary = 80000
  mockBuckets = [
    { id: 'a', label: 'Подушка', percentage: 20 },
    { id: 'b', label: 'Инвестиции', percentage: 10 },
    { id: 'c', label: 'Подушка безопасности на чёрный день', percentage: 0 },
  ]
  localStorage.clear()
  updateCalculator(() => EMPTY_STATE)
  writeText.mockReset().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
})

const launcherName = 'Открыть калькулятор'

function open() {
  const view = render(<CalculatorLauncher />)
  fireEvent.click(screen.getByRole('button', { name: launcherName }))
  return {
    ...view,
    dialog: screen.getByRole('dialog', { name: 'Калькулятор' }),
  }
}

function press(...names: string[]) {
  for (const name of names) {
    fireEvent.click(screen.getByRole('button', { name }))
  }
}

const expression = () => screen.getByTestId('calculator-expression')
const result = () => screen.getByTestId('calculator-result')

describe('CalculatorLauncher', () => {
  it('shows a floating button and keeps the calculator closed initially', () => {
    render(<CalculatorLauncher />)

    expect(
      screen.getByRole('button', { name: launcherName })
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('hides the launcher while the desktop dialog is open and closes with ×', () => {
    const { dialog } = open()

    expect(dialog).toHaveAttribute('data-presentation', 'dialog')
    expect(
      screen.queryByRole('button', { name: launcherName })
    ).not.toBeInTheDocument()

    press('Закрыть калькулятор')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: launcherName })
    ).toBeInTheDocument()
  })

  it('closes the desktop dialog on Escape', () => {
    open()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens a bottom sheet on mobile, locks page scroll, and closes on swipe down', () => {
    mockViewport = 'mobile'
    const grid = document.createElement('div')
    grid.setAttribute('data-grid-container', '')
    document.body.appendChild(grid)

    const { dialog: sheet } = open()

    expect(sheet).toHaveAttribute('data-presentation', 'sheet')
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(grid.style.overflow).toBe('hidden')

    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 150 }] })
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 260 }] })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
    expect(grid.style.overflow).toBe('')
    grid.remove()
  })

  it('closes the mobile sheet on a backdrop tap', () => {
    mockViewport = 'mobile'
    open()
    fireEvent.click(screen.getByTestId('calculator-backdrop'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('computes an expression entered with on-screen buttons', () => {
    open()
    press(
      '1',
      '0',
      '0',
      '0',
      'Плюс',
      '2',
      '5',
      '0',
      'Десятичная запятая',
      '5',
      'Умножить',
      '2'
    )

    expect(expression()).toHaveTextContent('1000+250,5×2')
    expect(result()).toHaveTextContent('1 501')

    press('Равно')
    expect(expression()).toHaveTextContent('1501')
  })

  it('supports backspace, clear, and shows no result for division by zero', () => {
    open()
    press('5', 'Разделить', '0')
    expect(result()).toHaveTextContent('—')

    press('Стереть')
    expect(expression()).toHaveTextContent('5÷')
    press('Очистить')
    expect(expression()).toHaveTextContent('0')
  })

  it('shows chips with full short labels and inserts live abbreviated values', () => {
    const { rerender } = open()

    expect(
      screen.getByRole('button', { name: 'Месячный доход · 80 000 ₽' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Операции (остаток) · 56 000 ₽' })
    ).toBeInTheDocument()

    press('1', '0', '0', 'Подушка · 16 000 ₽')
    expect(expression()).toHaveTextContent('100+Под.')
    expect(result()).toHaveTextContent('16 100')

    mockSalary = 100000
    rerender(<CalculatorLauncher />)
    expect(result()).toHaveTextContent('20 100')
  })

  it('separates a digit typed after a value with plus', () => {
    open()
    press('5', 'Плюс', 'Подушка · 16 000 ₽', '7')

    expect(expression()).toHaveTextContent('5+Под.+7')
    expect(result()).toHaveTextContent('16 012')
  })

  it('shows the last known amount when a bucket is deleted', () => {
    const { rerender } = open()
    press('Подушка · 16 000 ₽')

    mockBuckets = mockBuckets.filter((bucket) => bucket.id !== 'a')
    rerender(<CalculatorLauncher />)
    expect(expression()).toHaveTextContent('16000')
    expect(result()).toHaveTextContent('16 000')
  })

  it('moves the caret with arrows and by tapping the expression', () => {
    open()
    press('1', '2', 'Плюс', '3')

    press('Курсор влево', 'Курсор влево', '5')
    expect(expression()).toHaveTextContent('125+3')
    expect(expression()).toHaveAttribute('data-caret', '3')

    fireEvent.click(screen.getAllByTestId('calculator-token')[0])
    expect(expression()).toHaveAttribute('data-caret', '1')
    press('9')
    expect(expression()).toHaveTextContent('1925+3')

    press(
      'Курсор вправо',
      'Курсор вправо',
      'Курсор вправо',
      'Курсор вправо',
      'Курсор вправо'
    )
    expect(expression()).toHaveAttribute('data-caret', '6')
    expect(screen.getByTestId('calculator-caret')).toBeInTheDocument()
  })

  it('keeps the expression after closing and remounting', () => {
    const { unmount } = open()
    press('4', '2')
    press('Закрыть калькулятор')
    unmount()

    render(<CalculatorLauncher />)
    fireEvent.click(screen.getByRole('button', { name: launcherName }))
    expect(expression()).toHaveTextContent('42')
  })

  it('copies the result with an icon button and confirms', async () => {
    open()
    press('1', '2', '3', '4', '5', 'Десятичная запятая', '6', '7')

    const copy = screen.getByRole('button', { name: 'Скопировать' })
    expect(copy).toHaveAttribute('data-copied', 'false')
    await act(async () => {
      fireEvent.click(copy)
    })

    expect(writeText).toHaveBeenCalledWith('12345.67')
    expect(copy).toHaveAttribute('data-copied', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Скопировано')
  })

  it('disables copying without a result and reports clipboard failures', async () => {
    open()
    expect(screen.getByRole('button', { name: 'Скопировать' })).toBeDisabled()

    writeText.mockRejectedValue(new Error('denied'))
    press('7')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Скопировать' }))
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'Не удалось скопировать'
    )
  })

  describe('physical keyboard', () => {
    const typeKeys = (...keys: Array<string | [string, string]>) => {
      for (const entry of keys) {
        const [key, code] = Array.isArray(entry) ? entry : [entry, '']
        fireEvent.keyDown(document.body, { key, code })
      }
    }

    it('types an expression and shows the result on Enter', () => {
      open()
      typeKeys('1', '2', '*', '3')
      expect(expression()).toHaveTextContent('12×3')
      typeKeys('Enter')
      expect(expression()).toHaveTextContent('36')
    })

    it('accepts keypad keys, decimal keys, parentheses, and =', () => {
      open()
      typeKeys(
        '(',
        ['1', 'Numpad1'],
        [',', 'NumpadDecimal'],
        '5',
        ')',
        ['/', 'NumpadDivide'],
        '3',
        '='
      )
      expect(expression()).toHaveTextContent('0,5')
    })

    it('edits with Backspace, Delete, and arrows at the caret', () => {
      open()
      typeKeys('1', '2', '+', '3', 'ArrowLeft', 'ArrowLeft', '5')
      expect(expression()).toHaveTextContent('125+3')
      typeKeys('ArrowRight', 'Backspace')
      expect(expression()).toHaveTextContent('1253')
      typeKeys('Delete')
      expect(expression()).toHaveTextContent('0')
    })

    it('leaves typing in an outside input to that input', () => {
      render(<input aria-label="Сумма" />)
      open()
      const input = screen.getByRole('textbox', { name: 'Сумма' })
      input.focus()
      const notPrevented = fireEvent.keyDown(input, { key: '5' })
      expect(notPrevented).toBe(true)
      expect(expression()).toHaveTextContent('0')
    })

    it('ignores modifier shortcuts and prevents defaults only for handled keys', () => {
      open()
      expect(
        fireEvent.keyDown(document.body, { key: 'c', ctrlKey: true })
      ).toBe(true)
      expect(
        fireEvent.keyDown(document.body, { key: '5', metaKey: true })
      ).toBe(true)
      expect(fireEvent.keyDown(document.body, { key: 'a' })).toBe(true)
      expect(expression()).toHaveTextContent('0')
      expect(fireEvent.keyDown(document.body, { key: '/' })).toBe(false)
      expect(fireEvent.keyDown(document.body, { key: '7' })).toBe(false)
      expect(expression()).toHaveTextContent('7')
    })

    it('stops handling keys after the calculator closes', () => {
      open()
      press('Закрыть калькулятор')
      expect(fireEvent.keyDown(document.body, { key: '5' })).toBe(true)
      fireEvent.click(screen.getByRole('button', { name: launcherName }))
      expect(expression()).toHaveTextContent('0')
    })

    it('starts a new expression after Enter unless an operator follows', () => {
      open()
      typeKeys('6', '*', '6', 'Enter', '(', '2', '+', '3', ')', '/', '4')
      expect(expression()).toHaveTextContent('(2+3)÷4')
      expect(result()).toHaveTextContent('1,25')
      typeKeys('Enter', '+', '5')
      expect(expression()).toHaveTextContent('1,25+5')
    })

    it('does not also evaluate when Enter activates a focused calculator button', () => {
      open()
      typeKeys('2', '+', '3')
      const seven = screen.getByRole('button', { name: '7' })
      seven.focus()
      expect(fireEvent.keyDown(seven, { key: 'Enter' })).toBe(true)
      expect(expression()).toHaveTextContent('2+3')
    })
  })
})
