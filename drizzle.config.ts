import * as fs from 'fs'
import * as path from 'path'

import { defineConfig } from 'drizzle-kit'

// Load .env.local manually — drizzle-kit only picks up .env by default.
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  }
}

// drizzle-kit requires a direct connection (not pgBouncer pooler).
// Use DIRECT_URL for migrations, DATABASE_URL (pooler) is for the app runtime.
export default defineConfig({
  schema: './src/shared/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
})
