/**
 * Runs all pending SQL migration files from drizzle/ folder
 * via the transaction pooler (IPv4), bypassing the IPv6 issue in WSL2.
 *
 * Usage: node scripts/db-migrate.mjs
 */

import fs from 'fs'
import path from 'path'
import postgres from 'postgres'

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

const sql = postgres(process.env.DATABASE_URL, {
  ssl: false,
  prepare: false,
  connect_timeout: 10,
})

// Track applied migrations
await sql`
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMP NOT NULL DEFAULT now()
  )
`

const applied = new Set(
  (await sql`SELECT name FROM __drizzle_migrations`).map((r) => r.name)
)

const migrationsDir = path.resolve(process.cwd(), 'drizzle')
const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

let count = 0
for (const file of files) {
  if (applied.has(file)) {
    console.log(`  skip: ${file} (already applied)`)
    continue
  }

  const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
  console.log(`  apply: ${file}`)
  await sql.unsafe(content)
  await sql`INSERT INTO __drizzle_migrations (name) VALUES (${file})`
  count++
}

console.log(count > 0 ? `\nDone: ${count} migration(s) applied.` : '\nNothing to apply.')
await sql.end()
