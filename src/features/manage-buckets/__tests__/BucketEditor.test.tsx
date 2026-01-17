import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { BucketEditor } from '../ui/bucket-editor'

const mockBuckets = [
  { id: '1', label: 'Накопления', percentage: 20 },
  { id: '2', label: 'Инвестиции', percentage: 10 },
]

const mockUpdateBuckets = jest.fn()

jest.mock('@/entities/bucket', () => ({
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

describe('BucketEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
})
