import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { BucketEditor } from '../ui/bucket-editor'

const mockBuckets = [
  { id: '1', label: 'Накопления', percentage: 20 },
  { id: '2', label: 'Инвестиции', percentage: 10 },
]

const mockUpdateBuckets = jest.fn()
const mockSetSalary = jest.fn()
let mockSalary = 0

jest.mock('@/entities/bucket', () => ({
  useBuckets: () => ({
    data: mockBuckets,
    isLoading: false,
  }),
  useUpdateBuckets: () => ({ mutate: mockUpdateBuckets, isPending: false }),
  useBucketStore: (
    selector: (state: {
      buckets: typeof mockBuckets
      updateBuckets: jest.Mock
    }) => unknown
  ) =>
    selector({
      buckets: mockBuckets,
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
    selector: (state: { salary: number; setSalary: jest.Mock }) => unknown
  ) =>
    selector({
      salary: mockSalary,
      setSalary: mockSetSalary,
    }),
}))

describe('BucketEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSalary = 0
  })

  it('renders list of buckets with labels and percentages', () => {
    render(<BucketEditor />)

    expect(screen.getByDisplayValue('Накопления')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Инвестиции')).toBeInTheDocument()
    expect(screen.getByDisplayValue('20')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
  })

  it('shows remaining percentage for Operations', () => {
    render(<BucketEditor />)

    // Total is 30%, so Operations should be 70%
    expect(screen.getByText(/операции/i)).toBeInTheDocument()
    expect(screen.getByText(/70%/)).toBeInTheDocument()
  })

  it('updates bucket percentage on change', async () => {
    render(<BucketEditor />)

    const savingsInput = screen.getByDisplayValue('20')
    fireEvent.change(savingsInput, { target: { value: '25' } })
    fireEvent.blur(savingsInput)

    await waitFor(() => {
      expect(mockUpdateBuckets).toHaveBeenCalledWith([
        { id: '1', label: 'Накопления', percentage: 25 },
        { id: '2', label: 'Инвестиции', percentage: 10 },
      ])
    })
  })

  it('prevents total exceeding 100%', async () => {
    render(<BucketEditor />)

    const savingsInput = screen.getByDisplayValue('20')
    fireEvent.change(savingsInput, { target: { value: '95' } })
    fireEvent.blur(savingsInput)

    // Operations would be -5%, which is not allowed
    // Should show error or clamp value
    await waitFor(() => {
      expect(screen.getByText(/превышает 100%/i)).toBeInTheDocument()
    })
    expect(mockUpdateBuckets).not.toHaveBeenCalled()
  })

  it('allows adding new bucket', async () => {
    render(<BucketEditor />)

    const addButton = screen.getByRole('button', { name: /добавить/i })
    expect(addButton).toBeInTheDocument()

    fireEvent.click(addButton)

    await waitFor(() => {
      expect(mockUpdateBuckets).toHaveBeenCalledWith([
        { id: '1', label: 'Накопления', percentage: 20 },
        { id: '2', label: 'Инвестиции', percentage: 10 },
        expect.objectContaining({ label: '', percentage: 0 }),
      ])
    })
  })

  it('allows deleting a bucket', async () => {
    render(<BucketEditor />)

    const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(mockUpdateBuckets).toHaveBeenCalledWith([
        { id: '2', label: 'Инвестиции', percentage: 10 },
      ])
    })
  })

  it('allows editing bucket label', async () => {
    render(<BucketEditor />)

    const labelInput = screen.getByDisplayValue('Накопления')
    fireEvent.change(labelInput, { target: { value: 'Сбережения' } })
    fireEvent.blur(labelInput)

    await waitFor(() => {
      expect(mockUpdateBuckets).toHaveBeenCalledWith([
        { id: '1', label: 'Сбережения', percentage: 20 },
        { id: '2', label: 'Инвестиции', percentage: 10 },
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
    expect(screen.getByText(/20\s?000/)).toBeInTheDocument()
    expect(screen.getByText(/10\s?000/)).toBeInTheDocument()
  })

  it('shows calculated amount for operations remainder', () => {
    mockSalary = 100000
    render(<BucketEditor />)

    // Operations = 70% of 100000 = 70000
    expect(screen.getByText(/70\s?000/)).toBeInTheDocument()
  })

  it('does not show calculated amounts when salary is zero', () => {
    mockSalary = 0
    render(<BucketEditor />)

    // Should not show calculated amounts in bucket rows
    // The only ₽ should be in the salary input label
    const rubleElements = screen.getAllByText(/₽/)
    expect(rubleElements).toHaveLength(1) // Only the salary input suffix
  })
})
