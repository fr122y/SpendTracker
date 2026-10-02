import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

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
})
