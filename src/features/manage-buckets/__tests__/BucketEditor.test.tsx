import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { BucketEditor } from '../ui/bucket-editor'

import type { AllocationBucket } from '@/shared/types'

const defaultBuckets: AllocationBucket[] = [
  {
    id: '1',
    label: 'Накопления',
    basis: 'percentage' as const,
    percentage: 20,
    amountKopecks: null,
  },
  {
    id: '2',
    label: 'Инвестиции',
    basis: 'percentage' as const,
    percentage: 10,
    amountKopecks: null,
  },
]
let mockBuckets: AllocationBucket[] = defaultBuckets

const mockUpdateBuckets = jest.fn()
const mockSetSalary = jest.fn()
let mockSalary = 0
let mockBucketsLoading = false
let mockSettingsLoading = false
let mockUseUnstableBucketRefs = false

jest.mock('@/entities/bucket', () => ({
  useBuckets: () => ({
    data: mockUseUnstableBucketRefs ? [...mockBuckets] : mockBuckets,
    isLoading: false,
  }),
  useUpdateBuckets: () => ({ mutate: mockUpdateBuckets, isPending: false }),
  useBucketStore: (
    selector: (state: {
      buckets: typeof mockBuckets
      isLoading: boolean
      updateBuckets: jest.Mock
    }) => unknown
  ) =>
    selector({
      buckets: mockUseUnstableBucketRefs ? [...mockBuckets] : mockBuckets,
      isLoading: mockBucketsLoading,
      updateBuckets: mockUpdateBuckets,
    }),
}))

jest.mock('@/entities/settings', () => ({
  useSettings: () => ({
    data: {
      weeklyLimit: 10000,
      salaryDay: 10,
      advanceDay: 25,
      salary: mockSalary,
    },
    isLoading: false,
  }),
  useUpdateSettings: () => ({ mutate: mockSetSalary, isPending: false }),
  useSettingsStore: (
    selector: (state: {
      salary: number
      isLoading: boolean
      setSalary: jest.Mock
    }) => unknown
  ) =>
    selector({
      salary: mockSalary,
      isLoading: mockSettingsLoading,
      setSalary: mockSetSalary,
    }),
}))

function getOperationsSummary(): HTMLElement {
  const summary = screen
    .getByText('Операции (остаток)')
    .parentElement?.querySelector<HTMLElement>('[aria-live="polite"]')
  if (!summary) throw new Error('Operations summary is not rendered')
  return summary
}

describe('BucketEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBuckets = defaultBuckets.map((bucket) => ({ ...bucket }))
    mockSalary = 0
    mockBucketsLoading = false
    mockSettingsLoading = false
    mockUseUnstableBucketRefs = false
  })

  it('does not loop when store returns a new buckets array reference', () => {
    mockUseUnstableBucketRefs = true

    expect(() => render(<BucketEditor />)).not.toThrow()
  })

  it('renders skeleton while data is loading', () => {
    mockBucketsLoading = true

    render(<BucketEditor />)

    expect(screen.getByTestId('bucket-editor-skeleton')).toBeInTheDocument()
    expect(screen.queryByLabelText(/доход/i)).not.toBeInTheDocument()
  })

  it('renders list of buckets with labels and percentages', () => {
    render(<BucketEditor />)

    expect(screen.getByDisplayValue('Накопления')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Инвестиции')).toBeInTheDocument()
    expect(screen.getByLabelText('Процент категории Накопления')).toHaveValue(
      '20'
    )
    expect(screen.getByLabelText('Процент категории Инвестиции')).toHaveValue(
      '10'
    )
  })

  it('shows remaining percentage for Operations', () => {
    render(<BucketEditor />)

    // Total is 30%, so Operations should be 70%
    expect(screen.getByText(/операции/i)).toBeInTheDocument()
    expect(screen.getByText(/70%/)).toBeInTheDocument()
  })

  it('updates bucket percentage on change', async () => {
    render(<BucketEditor />)

    const savingsInput = screen.getByLabelText('Процент категории Накопления')
    fireEvent.change(savingsInput, { target: { value: '25' } })
    fireEvent.blur(savingsInput)

    await waitFor(() => {
      expect(mockUpdateBuckets).toHaveBeenCalledWith([
        {
          ...defaultBuckets[0],
          percentage: 25,
        },
        defaultBuckets[1],
      ])
    })
  })

  it('saves a percentage overage and shows the exact negative remainder', async () => {
    mockSalary = 100000
    render(<BucketEditor />)

    const savingsInput = screen.getByLabelText('Процент категории Накопления')
    fireEvent.change(savingsInput, { target: { value: '95' } })
    fireEvent.blur(savingsInput)

    await waitFor(() => {
      expect(mockUpdateBuckets).toHaveBeenCalledWith([
        {
          ...defaultBuckets[0],
          percentage: 95,
        },
        defaultBuckets[1],
      ])
    })
    expect(screen.getByRole('alert')).toHaveTextContent(
      /Распределено больше дохода на 5\s*000 ₽/
    )
    expect(getOperationsSummary()).toHaveTextContent(/−5%[\s\S]*−5\s*000 ₽/)
    expect(screen.queryByText(/превышает 100%/i)).not.toBeInTheDocument()
  })

  it('saves an amount and changes the category basis', async () => {
    mockSalary = 80000
    render(<BucketEditor />)

    const savingsInput = screen.getByLabelText('Сумма категории Накопления')
    fireEvent.change(savingsInput, { target: { value: '15000' } })
    fireEvent.blur(savingsInput)

    await waitFor(() => {
      expect(mockUpdateBuckets).toHaveBeenCalledWith([
        {
          ...defaultBuckets[0],
          basis: 'amount',
          percentage: 0,
          amountKopecks: 1_500_000,
        },
        defaultBuckets[1],
      ])
    })
    expect(screen.getByText('Закреплена сумма')).toBeInTheDocument()
    expect(screen.getByLabelText('Процент категории Накопления')).toHaveValue(
      '18,75'
    )
  })

  it('saves a direct amount over income and shows the exact overage', async () => {
    mockSalary = 10000
    mockBuckets[1] = { ...mockBuckets[1], percentage: 0 }
    render(<BucketEditor />)

    const savingsInput = screen.getByLabelText('Сумма категории Накопления')
    fireEvent.change(savingsInput, { target: { value: '15000' } })
    fireEvent.blur(savingsInput)

    await waitFor(() => {
      expect(mockUpdateBuckets).toHaveBeenCalledWith([
        {
          ...defaultBuckets[0],
          basis: 'amount',
          percentage: 0,
          amountKopecks: 1_500_000,
        },
        { ...defaultBuckets[1], percentage: 0 },
      ])
    })
    expect(screen.getByRole('alert')).toHaveTextContent(
      /Распределено больше дохода на 5\s*000 ₽/
    )
    expect(getOperationsSummary()).toHaveTextContent(/−50%[\s\S]*−5\s*000 ₽/)
  })

  it('does not switch a rounded amount basis on an untouched percentage blur', () => {
    mockSalary = 73000
    mockBuckets[0] = {
      ...mockBuckets[0],
      basis: 'amount',
      percentage: 0,
      amountKopecks: 1_000_000,
    }

    render(<BucketEditor />)

    const percentageInput = screen.getByLabelText(
      'Процент категории Накопления'
    )
    expect(percentageInput).toHaveValue('13,7')
    fireEvent.focus(percentageInput)
    fireEvent.blur(percentageInput)

    expect(mockUpdateBuckets).not.toHaveBeenCalled()
    expect(screen.getByText('Закреплена сумма')).toBeInTheDocument()
  })

  it('allows adding new bucket', async () => {
    render(<BucketEditor />)

    const addButton = screen.getByRole('button', { name: /добавить/i })
    expect(addButton).toBeInTheDocument()

    fireEvent.click(addButton)

    await waitFor(() => {
      expect(mockUpdateBuckets).toHaveBeenCalledWith([
        defaultBuckets[0],
        defaultBuckets[1],
        expect.objectContaining({
          label: '',
          basis: 'percentage',
          percentage: 0,
          amountKopecks: null,
        }),
      ])
    })
  })

  it('opens confirmation dialog when delete bucket button is clicked', () => {
    render(<BucketEditor />)

    const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
    fireEvent.click(deleteButtons[0])

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Удалить категорию бюджета?')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Категория «Накопления» будет удалена из распределения бюджета.'
      )
    ).toBeInTheDocument()
    expect(mockUpdateBuckets).not.toHaveBeenCalled()
  })

  it('does not delete a bucket when deletion is canceled', () => {
    render(<BucketEditor />)

    const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
    fireEvent.click(deleteButtons[0])
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }))

    expect(mockUpdateBuckets).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('allows deleting a bucket when deletion is confirmed', async () => {
    render(<BucketEditor />)

    const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
    fireEvent.click(deleteButtons[0])
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }))

    await waitFor(() => {
      expect(mockUpdateBuckets).toHaveBeenCalledWith([defaultBuckets[1]])
    })
  })

  it('allows editing bucket label', async () => {
    render(<BucketEditor />)

    const labelInput = screen.getByDisplayValue('Накопления')
    fireEvent.change(labelInput, { target: { value: 'Сбережения' } })
    fireEvent.blur(labelInput)

    await waitFor(() => {
      expect(mockUpdateBuckets).toHaveBeenCalledWith([
        { ...defaultBuckets[0], label: 'Сбережения' },
        defaultBuckets[1],
      ])
    })
  })

  it('shows total allocation percentage', () => {
    render(<BucketEditor />)

    expect(screen.getByText(/30%/)).toBeInTheDocument() // Total of buckets
  })

  it('renders salary input field', () => {
    render(<BucketEditor />)

    expect(screen.getByLabelText(/доход/i)).toBeInTheDocument()
  })

  it('updates salary on input change', async () => {
    render(<BucketEditor />)

    const salaryInput = screen.getByLabelText(/доход/i)
    fireEvent.change(salaryInput, { target: { value: '100000' } })
    fireEvent.blur(salaryInput)

    await waitFor(() => {
      expect(mockSetSalary).toHaveBeenCalledWith(100000)
    })
  })

  it('shows calculated amounts when salary is set', () => {
    mockSalary = 100000
    render(<BucketEditor />)

    // 20% of 100000 = 20000, 10% of 100000 = 10000
    expect(screen.getByLabelText('Сумма категории Накопления')).toHaveValue(
      '20000'
    )
    expect(screen.getByLabelText('Сумма категории Инвестиции')).toHaveValue(
      '10000'
    )
  })

  it('shows calculated amount for operations remainder', () => {
    mockSalary = 100000
    render(<BucketEditor />)

    // Operations = 70% of 100000 = 70000
    expect(screen.getByText(/70\s?000/)).toBeInTheDocument()
  })

  it('saves an amount without income and shows a percentage placeholder', async () => {
    mockSalary = 0
    render(<BucketEditor />)

    const amountInput = screen.getByLabelText('Сумма категории Накопления')
    fireEvent.change(amountInput, { target: { value: '15000' } })
    fireEvent.blur(amountInput)

    await waitFor(() => {
      expect(mockUpdateBuckets).toHaveBeenCalledWith([
        {
          ...defaultBuckets[0],
          basis: 'amount',
          percentage: 0,
          amountKopecks: 1_500_000,
        },
        defaultBuckets[1],
      ])
    })
    expect(screen.getByLabelText('Процент категории Накопления')).toHaveValue(
      '—'
    )
    expect(screen.getByLabelText('Сумма категории Накопления')).toHaveValue(
      '15000'
    )
  })

  it('shows the amount basis after income is entered', () => {
    mockSalary = 80000
    mockBuckets[0] = {
      ...mockBuckets[0],
      basis: 'amount',
      percentage: 0,
      amountKopecks: 1_500_000,
    }
    render(<BucketEditor />)

    expect(screen.getByLabelText('Процент категории Накопления')).toHaveValue(
      '18,75'
    )
    expect(screen.getByLabelText('Сумма категории Накопления')).toHaveValue(
      '15000'
    )
  })

  it('preserves an amount basis when income changes', async () => {
    mockSalary = 80000
    mockBuckets[0] = {
      ...mockBuckets[0],
      basis: 'amount',
      percentage: 0,
      amountKopecks: 1_500_000,
    }
    render(<BucketEditor />)

    const salaryInput = screen.getByLabelText(/доход/i)
    fireEvent.change(salaryInput, { target: { value: '100000' } })
    fireEvent.blur(salaryInput)

    await waitFor(() => {
      expect(mockSetSalary).toHaveBeenCalledWith(100000)
    })
    expect(screen.getByLabelText('Сумма категории Накопления')).toHaveValue(
      '15000'
    )
    expect(screen.getByLabelText('Процент категории Накопления')).toHaveValue(
      '15'
    )
    expect(screen.getByLabelText('Сумма категории Инвестиции')).toHaveValue(
      '10000'
    )
  })

  it('keeps a fixed amount and warns when income is reduced below it', async () => {
    mockSalary = 80000
    mockBuckets = [
      {
        ...defaultBuckets[0],
        basis: 'amount',
        percentage: 0,
        amountKopecks: 1_500_000,
      },
      { ...defaultBuckets[1], percentage: 0 },
    ]
    render(<BucketEditor />)

    const salaryInput = screen.getByLabelText(/доход/i)
    fireEvent.change(salaryInput, { target: { value: '10000' } })
    fireEvent.blur(salaryInput)

    await waitFor(() => {
      expect(mockSetSalary).toHaveBeenCalledWith(10000)
    })
    expect(screen.getByLabelText('Сумма категории Накопления')).toHaveValue(
      '15000'
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      /Распределено больше дохода на 5\s*000 ₽/
    )
    expect(getOperationsSummary()).toHaveTextContent(/−50%[\s\S]*−5\s*000 ₽/)
  })

  it('rejects an amount outside the safe kopeck range without throwing', () => {
    mockSalary = 100000
    render(<BucketEditor />)

    const savingsInput = screen.getByLabelText('Сумма категории Накопления')
    fireEvent.change(savingsInput, {
      target: { value: String(Number.MAX_SAFE_INTEGER) },
    })
    fireEvent.blur(savingsInput)

    expect(screen.getByText(/поддерживаемый диапазон/i)).toBeInTheDocument()
    expect(mockUpdateBuckets).not.toHaveBeenCalled()
  })
})
