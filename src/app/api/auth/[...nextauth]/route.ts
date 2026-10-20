import { handlers, withSessionCheck } from '@/shared/auth'

import type { NextRequest } from 'next/server'

// `GET /api/auth/session` is how the client tells an ended session from any
// other failure (T-054): it checks against the database at once, so a revoked
// session answers `null` and its cookie is cleared.
export function GET(request: NextRequest) {
  return withSessionCheck('force', () => handlers.GET(request))
}

export const { POST } = handlers
