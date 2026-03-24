import { renderHook } from '@testing-library/react'

import { useCategorize } from '../model/use-categorize'

const mockMutateAsync = jest.fn()
const mockMatcher = jest.fn()
const mockCreateMatcher = jest.fn((mappings?: unknown[]) => {
  void mappings
  return mockMatcher
})

jest.mock('@/entities/keyword-mapping', () => ({
  createMatcher: (mappings: unknown[]) => mockCreateMatcher(mappings),
  useKeywordMappings: jest.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useSaveKeywordMapping: jest.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}))

describe('useCategorize', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('builds matcher from mappings and categorizes synchronously', () => {
    const { useKeywordMappings } = jest.requireMock(
      '@/entities/keyword-mapping'
    )
    useKeywordMappings.mockReturnValueOnce({
      data: [{ id: '1', keyword: 'молоко' }],
      isLoading: false,
    })
    mockMatcher.mockReturnValueOnce({ found: true, categoryId: 'c1' })

    const { result } = renderHook(() => useCategorize())
    const match = result.current.categorize('молоко')

    expect(mockCreateMatcher).toHaveBeenCalledWith([
      { id: '1', keyword: 'молоко' },
    ])
    expect(match).toEqual({ found: true, categoryId: 'c1' })
  })

  it('saves mapping through mutation', async () => {
    const { result } = renderHook(() => useCategorize())

    await result.current.saveMappingAndGetResult('кофе', 'c2')

    expect(mockMutateAsync).toHaveBeenCalledWith({
      keyword: 'кофе',
      categoryId: 'c2',
    })
  })

  it('exposes mappingsLoaded flag', () => {
    const { useKeywordMappings } = jest.requireMock(
      '@/entities/keyword-mapping'
    )
    useKeywordMappings.mockReturnValueOnce({
      data: [],
      isLoading: true,
    })

    const { result } = renderHook(() => useCategorize())
    expect(result.current.mappingsLoaded).toBe(false)
  })
})
