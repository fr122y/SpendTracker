import { act, fireEvent, render, screen } from '@testing-library/react'

import { CalculatorLauncher } from '../ui/calculator-launcher'

import type { AllocationBucket } from '@/shared/types'

let mockViewport: 'mobile' | 'tablet' | 'desktop' = 'desktop'
let mockSalary = 80000
let mockBuckets: AllocationBucket[] = [
  { id: 'a', label: 'Подушка безопасности на чёрный день', percentage: 20 },
  { id: 'b', label: 'Инвестиции', percentage: 10 },
]

jest.mock('@/shared/lib', () => ({
  ...jest.requireActual('@/shared/lib'),
  useViewport: () => mockViewport,
}))

jest.mock('@/entities/bucket', () => ({
  useBucketStore: (
    selector: (state: { buckets: AllocationBucket[] }) => unknown
  ) => selector({ buckets: mockBuckets }),
}))

jest.mock('@/entities/settings', () => ({
  useSettingsStore: (selector: (state: { salary: number }) => unknown) =>
    selector({ salary: mockSalary }),
}))

const writeText = jest.fn<Promise<void>, [string]>()

beforeEach(() => {
  mockViewport = 'desktop'
  mockSalary = 80000
  mockBuckets = [
    { id: 'a', label: 'Подушка безопасности на чёрный день', percentage: 20 },
    { id: 'b', label: 'Инвестиции', percentage: 10 },
  ]
  writeText.mockReset().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
})

function open() {
  render(<CalculatorLauncher />)
  fireEvent.click(screen.getByRole('button', { name: 'Открыть калькулятор' }))
  return screen.getByRole('dialog', { name: 'Калькулятор' })
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
      screen.getByRole('button', { name: 'Открыть калькулятор' })
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens as a dialog on desktop and closes with the close control', () => {
    const dialog = open()

    expect(dialog).toHaveAttribute('data-presentation', 'dialog')
    press('Закрыть калькулятор')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens as a bottom sheet on mobile and closes on swipe down', () => {
    mockViewport = 'mobile'
    const sheet = open()

    expect(sheet).toHaveAttribute('data-presentation', 'sheet')

    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 130 }] })
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.touchStart(sheet, { touches: [{ clientY: 100 }] })
    fireEvent.touchEnd(sheet, { changedTouches: [{ clientY: 260 }] })
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

    expect(expression()).toHaveTextContent('1000 + 250,5 × 2')
    expect(result()).toHaveTextContent('1 501')

    press('Равно')
    expect(expression()).toHaveTextContent('1501')
  })

  it('supports backspace, clear, and shows no result for division by zero', () => {
    open()
    press('5', 'Разделить', '0')
    expect(result()).toHaveTextContent('—')

    press('Стереть')
    expect(expression()).toHaveTextContent('5 ÷')
    press('Очистить')
    expect(expression()).toHaveTextContent('0')
  })

  it('shows savings chips and inserts their amounts as plain numbers', () => {
    open()

    expect(
      screen.getByRole('button', { name: 'Месячный доход · 80 000 ₽' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Инвестиции · 8 000 ₽' })
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Подушка безопасности на чёрный день · 16 000 ₽',
      })
    )
    expect(expression()).toHaveTextContent('16000')

    press('Плюс')
    fireEvent.click(
      screen.getByRole('button', { name: 'Операции (остаток) · 56 000 ₽' })
    )
    press('Разделить', '2', 'Равно')
    expect(result()).toHaveTextContent('44 000')
  })

  it('copies the result as a plain number and confirms', async () => {
    open()
    press('1', '2', '3', '4', '5', 'Десятичная запятая', '6', '7')

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Скопировать' }))
    })

    expect(writeText).toHaveBeenCalledWith('12345.67')
    expect(screen.getByText('Скопировано')).toBeInTheDocument()
  })

  it('disables copying without a result and reports clipboard failures', async () => {
    open()
    expect(screen.getByRole('button', { name: 'Скопировать' })).toBeDisabled()

    writeText.mockRejectedValue(new Error('denied'))
    press('7')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Скопировать' }))
    })

    expect(screen.getByText('Не удалось скопировать')).toBeInTheDocument()
  })
})
