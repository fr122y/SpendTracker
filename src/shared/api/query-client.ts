import { QueryCache, QueryClient } from '@tanstack/react-query'

import { handleRequestFailure } from '@/shared/lib/session-expiry'

/**
 * Data younger than this is not refetched when the tab regains focus or the
 * network returns, so a quick tab switch costs no requests. Initial reads are
 * about ten sequential Server Actions (T-028), so every refetch is expensive.
 */
export const STALE_TIME_MS = 30_000

/**
 * The shared client. Stale queries refetch when the tab regains focus or the
 * browser reconnects, except while a mutation is pending (running or paused
 * offline): a refetch then could overwrite an optimistic row with data that
 * does not include it yet. The mutation refetches its own data when it
 * settles, and the next focus picks up the rest.
 *
 * Mutations use the default `networkMode: 'online'`: offline they pause after
 * their optimistic update and continue when the network returns.
 */
export function createQueryClient(): QueryClient {
  const noPendingMutations = () => client.isMutating() === 0
  const client: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: () => {
        void handleRequestFailure()
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        refetchOnWindowFocus: noPendingMutations,
        refetchOnReconnect: noPendingMutations,
      },
    },
  })
  return client
}

export const queryClient = createQueryClient()
