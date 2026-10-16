/**
 * Runs all pending SQL migration files from the drizzle/ folder via the
 * transaction pooler (IPv4), bypassing the IPv6 issue in WSL2.
 *
 * Each file and its ledger row are applied in one simple query on a fresh
 * connection, with a deadline and a ledger-checked retry. See
 * scripts/db-migrate-runner.mjs for the flow and its limitations (no
 * `CREATE INDEX CONCURRENTLY` or other transaction-incompatible statements).
 *
 * Usage: node scripts/db-migrate.mjs
 */

import fs from 'fs'
import path from 'path'
import postgres from 'postgres'
import { runMigrations } from './db-migrate-runner.mjs'

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  }
}

const databaseUrl = process.env.DATABASE_URL
const migrationsDir = path.resolve(process.cwd(), 'drizzle')

await runMigrations({
  connect: () =>
    postgres(databaseUrl, {
      ssl: false,
      prepare: false,
      connect_timeout: 10,
      max: 1,
    }),
  files: fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')),
  readFile: (file) => fs.readFileSync(path.join(migrationsDir, file), 'utf-8'),
})
