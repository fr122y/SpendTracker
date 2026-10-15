import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  POCKET_PURCHASE_HINT,
  POCKET_TRANSFER_HINT,
} from '@/entities/pocket/model/hints'

import { PocketOperationForm } from '../ui/pocket-operation-form'

const mockAddExpense = jest.fn().mockResolvedValue(undefined)
let mockResolveMappings: (() => void) | null = null

jest.mock('@/entities/keyword-mapping', () => {
  const { useEffect, useState } = jest.requireActual('react')
  const { createMatcher } = jest.requireActual(
    '@/entities/keyword-mapping/model/fuzzy-matcher'
  )

  return {
    createMatcher,
    useKeywordMappings: () => {
      const [data, setData] = useState([])
      const [isLoading, setIsLoading] = useState(true)

      useEffect(() => {
        mockResolveMappings = () => {
          setData([
            {
              id: 'mapping-vacuum',
              keyword: 'пылесос',
              categoryId: 'vacuum',
              categoryName: 'Техника',
              categoryEmoji: '🧹',
            },
          ])
          setIsLoading(false)
        }

        return () => {
          mockResolveMappings = null
        }
      }, [])

      return { data, isLoading }
    },
    useSaveKeywordMapping: () => ({
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
    }),
    useSharedKeywordMappings: () => ({ data: [], isLoading: false }),
    useSaveSharedKeywordMapping: () => ({
      mutateAsync: jest.fn().mockResolvedValue(undefined),
      isPending: false,
    }),
  }
})

jest.mock('@/entities/category', () => {
  const { useCategorize } = jest.requireActual(
    '@/entities/category/model/use-categorize'
  )

  return {
    useCategorize,
    useCategoryStore: (
      selector: (state: {
        categories: { id: string; name: string; emoji: string }[]
      }) => unknown
    ) =>
      selector({
        categories: [
          { id: 'vacuum', name: 'Техника', emoji: '🧹' },
          { id: 'other', name: 'Другое', emoji: '📝' },
        ],
      }),
  }
})

jest.mock('@/entities/expense', () => ({
  useAddExpense: () => ({
    mutateAsync: mockAddExpense,
    isPending: false,
    isError: false,
  }),
}))

jest.mock('@/entities/pocket', () =>
  jest.requireActual('@/entities/pocket/model/hints')
)

describe('PocketOperationForm effect hints', () => {
  it('explains a purchase', () => {
    render(
      <PocketOperationForm
        pocketId="pocket-1"
        kind="purchase"
        selectedDate={new Date(2026, 0, 21)}
      />
    )

    expect(screen.getByText(POCKET_PURCHASE_HINT)).toBeInTheDocument()
    expect(screen.queryByText(POCKET_TRANSFER_HINT)).not.toBeInTheDocument()
  })

  it('explains a transfer', () => {
    render(
      <PocketOperationForm
        pocketId="pocket-1"
        kind="transfer"
        selectedDate={new Date(2026, 0, 21)}
      />
    )

    expect(screen.getByText(POCKET_TRANSFER_HINT)).toBeInTheDocument()
    expect(screen.queryByText(POCKET_PURCHASE_HINT)).not.toBeInTheDocument()
  })
})

describe('PocketOperationForm keyword loading', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockResolveMappings = null
  })

  it('retries a blurred description with its latest value after mappings load', async () => {
    render(
      <PocketOperationForm
        pocketId="pocket-1"
        kind="purchase"
        selectedDate={new Date(2026, 0, 21)}
      />
    )

    const comment = screen.getByLabelText('Комментарий')
    fireEvent.change(comment, { target: { value: 'Старый текст' } })
    fireEvent.blur(comment)
    fireEvent.change(comment, { target: { value: 'Пылесос' } })

    expect(screen.getByText('Подбираем категорию…')).toBeInTheDocument()
    expect(screen.queryByText('Категория:')).not.toBeInTheDocument()

    await waitFor(() => expect(mockResolveMappings).toBeInstanceOf(Function))
    act(() => mockResolveMappings?.())

    await waitFor(() => {
      expect(screen.getByText('Категория:')).toBeInTheDocument()
      expect(screen.getByText('🧹 Техника')).toBeInTheDocument()
    })
    expect(screen.queryByLabelText('Категория покупки')).not.toBeInTheDocument()
  })

  it('has no date field and saves the operation on the current selected date', async () => {
    const { rerender } = render(
      <PocketOperationForm
        pocketId="pocket-1"
        kind="transfer"
        selectedDate={new Date(2026, 0, 21)}
      />
    )

    expect(screen.queryByLabelText('Дата')).not.toBeInTheDocument()

    rerender(
      <PocketOperationForm
        pocketId="pocket-1"
        kind="transfer"
        selectedDate={new Date(2026, 0, 23)}
      />
    )
    fireEvent.change(screen.getByLabelText('Комментарий'), {
      target: { value: 'На продукты' },
    })
    fireEvent.change(screen.getByLabelText('Сумма'), {
      target: { value: '300' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Перевести в расходы' }))

    await waitFor(() =>
      expect(mockAddExpense).toHaveBeenCalledWith({
        description: 'На продукты',
        amount: 300,
        date: '2026-01-23',
        pocketId: 'pocket-1',
        operationType: 'pocket_transfer',
      })
    )
  })
})
