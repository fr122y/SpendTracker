import 'server-only'

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

type PostgresClient = ReturnType<typeof postgres>

const globalForDb = globalThis as typeof globalThis & {
  __postgresClient?: PostgresClient
}

const client =
  globalForDb.__postgresClient ??
  postgres(process.env.DATABASE_URL!, {
    // Supabase Supavisor pooler (port 6543) handles TLS at the load-balancer
    // level, so postgres.js must NOT attempt its own SSL handshake — it would
    // hang waiting for a TLS response the pooler never sends.
    prepare: false,
    ssl: false,
    connect_timeout: 10,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__postgresClient = client
}

export const db = drizzle(client, { schema })
