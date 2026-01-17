import type { Category } from '@/shared/types'

// Create mock at module scope
const mockCreate = jest.fn()

// Mock OpenAI - use hoisted variable reference
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    chat: {
      completions: {
        create: (...args: unknown[]) => mockCreate(...args),
      },
    },
  })),
}))

// Import after mock is set up - this must come after jest.mock
// eslint-disable-next-line import/order
import { categorizeExpenseAction } from '../ai-action'

const mockCategories: Category[] = [
  { id: '1', name: 'Продукты', emoji: '🛒' },
  { id: '2', name: 'Транспорт', emoji: '🚌' },
  { id: '3', name: 'Развлечения', emoji: '🎬' },
  { id: '4', name: 'Другое', emoji: '📝' },
]

describe('categorizeExpenseAction', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  it('should return valid JSON category on success', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({ category: 'Продукты', emoji: '🛒' }),
          },
        },
      ],
    })

    const result = await categorizeExpenseAction('Молоко', 100, mockCategories)

    expect(result.category).toBe('Продукты')
    expect(result.emoji).toBe('🛒')
  })

  it('should return fallback category when AI fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API Error'))

    const result = await categorizeExpenseAction(
      'Что-то непонятное',
      500,
      mockCategories
    )

    expect(result.category).toBe('Другое')
    expect(result.emoji).toBe('📝')
  })

  it('should return fallback on invalid JSON response', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'not valid json',
          },
        },
      ],
    })

    const result = await categorizeExpenseAction('Тест', 100, mockCategories)

    expect(result.category).toBe('Другое')
    expect(result.emoji).toBe('📝')
  })

  it('should return fallback when response has empty choices', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [],
    })

    const result = await categorizeExpenseAction('Тест', 100, mockCategories)

    expect(result.category).toBe('Другое')
    expect(result.emoji).toBe('📝')
  })
})
