import { http, HttpResponse } from 'msw'

export const handlers = [
  // AI categorization endpoint mock
  http.post('/api/categorize', async () => {
    return HttpResponse.json({
      category: 'Еда',
      confidence: 0.95,
    })
  }),
]
