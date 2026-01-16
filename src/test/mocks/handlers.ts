import { http, HttpResponse } from 'msw'

export const handlers = [
  // AI categorization endpoint mock
  http.post('/api/categorize', async ({ request }) => {
    const body = await request.json()

    return HttpResponse.json({
      category: 'Еда',
      confidence: 0.95,
    })
  }),
]
