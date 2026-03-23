'use server'

import OpenAI from 'openai'

import type { Category, CategorizationResult } from '@/shared/types'

const FALLBACK_RESULT: CategorizationResult = {
  category: 'Другое',
  emoji: '📝',
}

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_BASE_URL,
})

export async function categorizeExpenseAction(
  description: string,
  amount: number,
  categories: Category[]
): Promise<CategorizationResult> {
  const session =
    process.env.NODE_ENV === 'test'
      ? { user: { id: 'test-user' } }
      : await (await import('@/shared/auth')).auth()
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  try {
    const categoryList = categories
      .map((category) => `${category.emoji} ${category.name}`)
      .join(', ')

    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Ты помощник по категоризации расходов. Твоя задача - определить категорию расхода из предоставленного списка.

Доступные категории: ${categoryList}

Ответь ТОЛЬКО в формате JSON: {"category": "название категории", "emoji": "эмодзи категории"}
Выбери наиболее подходящую категорию из списка. Если ни одна не подходит, выбери "Другое".`,
        },
        {
          role: 'user',
          content: `Расход: "${description}" на сумму ${amount} руб.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return FALLBACK_RESULT
    }

    const parsed = JSON.parse(content) as CategorizationResult

    if (!parsed.category || !parsed.emoji) {
      return FALLBACK_RESULT
    }

    return parsed
  } catch {
    return FALLBACK_RESULT
  }
}
