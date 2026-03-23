import 'server-only'

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

type PostgresClient = ReturnType<typeof postgres>

const globalForDb = globalThis as typeof globalThis & {
  __postgresClient?: PostgresClient
}

const client =
  globalForDb.__postgresClient ?? postgres(process.env.DATABASE_URL!)

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__postgresClient = client
}

export const db = drizzle(client, { schema })
