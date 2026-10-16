/**
 * Migration runner core, kept free of process and environment access so it can
 * be tested with a fake client factory. The CLI is scripts/db-migrate.mjs.
 *
 * Every database round trip uses a fresh connection and exactly one simple
 * (parameter-free) query:
 *
 * 1. One connection creates the ledger table if needed and reads its names.
 * 2. Each pending file gets its own connection and one query: the file content
 *    followed by its ledger INSERT. Postgres runs a multi-statement simple query
 *    as one implicit transaction, so the file and its ledger row commit together
 *    or not at all.
 *
 * Why: from some networks (WSL to the Supabase Supavisor pooler) a connection
 * stalls after a few queries, or during connect. A stall between a file and a
 * separate ledger INSERT used to leave a migration applied but unrecorded.
 *
 * Why parameter-free: with `prepare: false`, postgres.js 3.4.8 sends a
 * parameterised query as Parse/Describe + Flush before any Sync. Through the
 * Supavisor transaction pooler the describe reply never arrives. The strict
 * filename pattern plus quote escaping keep the ledger literal safe.
 *
 * Limitation: because a file runs inside one implicit transaction, it must not
 * contain statements that refuse to run in a transaction block, such as
 * `CREATE INDEX CONCURRENTLY`, `VACUUM`, or `ALTER TYPE ... ADD VALUE` on older
 * servers, and must not issue its own BEGIN/COMMIT. Such a change needs a
 * separate, manually applied step.
 *
 * Timeouts and retries: every attempt has a client-side deadline. After a
 * timeout or connection error the runner opens a new connection and checks the
 * ledger. If the name is there, the previous attempt committed; otherwise the
 * file is retried, up to `maxAttempts` attempts. A SQL error from the server is
 * never retried.
 */

export const MIGRATION_FILENAME = /^[\w.-]+\.sql$/

export const DEFAULT_DEADLINE_MS = 60_000
export const DEFAULT_MAX_ATTEMPTS = 3

const LEDGER_DDL = `CREATE TABLE IF NOT EXISTS __drizzle_migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMP NOT NULL DEFAULT now()
)`

const TRANSIENT_CODES = new Set([
  'CONNECT_TIMEOUT',
  'CONNECTION_CLOSED',
  'CONNECTION_ENDED',
  'CONNECTION_DESTROYED',
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EAI_AGAIN',
])

export class DeadlineError extends Error {
  constructor(ms) {
    super(`query did not finish within ${ms} ms`)
    this.name = 'DeadlineError'
  }
}

/** A timeout or a dropped connection; a server-side SQL error is not. */
export function isTransientError(error) {
  if (error instanceof DeadlineError) return true
  if (!error || error.name === 'PostgresError') return false
  return TRANSIENT_CODES.has(error.code) || TRANSIENT_CODES.has(error.errno)
}

export function ledgerLiteral(name) {
  if (!MIGRATION_FILENAME.test(name)) {
    throw new Error(`Unexpected migration filename: ${JSON.stringify(name)}`)
  }
  return `'${name.replace(/'/g, "''")}'`
}

export function buildApplyQuery(name, content) {
  return `${content}\n;\nINSERT INTO __drizzle_migrations (name) VALUES (${ledgerLiteral(name)});`
}

/** Runs `work` on a fresh connection under one deadline, then ends it. */
async function runOnFreshClient(connect, work, deadlineMs) {
  const client = connect()
  let timer
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new DeadlineError(deadlineMs)), deadlineMs)
  })
  try {
    const rows = await Promise.race([work(client), deadline])
    clearTimeout(timer)
    await client.end({ timeout: 5 }).catch(() => {})
    return rows
  } catch (error) {
    clearTimeout(timer)
    await client.end({ timeout: 0 }).catch(() => {})
    throw error
  }
}

/**
 * @param {object} options
 * @param {() => {unsafe: (q: string) => Promise<any[]>, end: (o?: object) => Promise<void>}} options.connect
 *   returns a new, unused client on every call.
 * @param {string[]} options.files migration filenames, unsorted is fine.
 * @param {(name: string) => string} options.readFile returns a file's SQL.
 * @param {(line: string) => void} [options.log]
 */
export async function runMigrations({
  connect,
  files,
  readFile,
  log = console.log,
  deadlineMs = DEFAULT_DEADLINE_MS,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
}) {
  const run = (query) =>
    runOnFreshClient(connect, (client) => client.unsafe(query), deadlineMs)

  const readLedger = () =>
    runOnFreshClient(
      connect,
      async (client) => {
        await client.unsafe(LEDGER_DDL)
        const rows = await client.unsafe(
          'SELECT name FROM __drizzle_migrations'
        )
        return new Set(rows.map((r) => r.name))
      },
      deadlineMs
    )
  const isRecorded = async (name) =>
    (
      await run(
        `SELECT 1 FROM __drizzle_migrations WHERE name = ${ledgerLiteral(name)}`
      )
    ).length > 0

  const applied = await withRetries('ledger', readLedger)

  let count = 0
  for (const file of [...files].sort()) {
    if (applied.has(file)) {
      log(`  skip: ${file} (already applied)`)
      continue
    }

    const query = buildApplyQuery(file, readFile(file))
    log(`  apply: ${file}`)

    let applyError = null
    for (let attempt = 1; ; attempt++) {
      try {
        if (applyError && (await isRecorded(file))) {
          log(`  recorded-by-previous-attempt: ${file}`)
          break
        }
        await run(query)
        break
      } catch (error) {
        if (!isTransientError(error)) throw error
        if (attempt >= maxAttempts) {
          throw new Error(
            `Migration ${file} failed after ${maxAttempts} attempts; ` +
              `last error: ${error.message}. Check the ledger before rerunning.`,
            { cause: error }
          )
        }
        applyError = error
        log(
          `  retry: ${file} (attempt ${attempt + 1}/${maxAttempts} after: ${error.message})`
        )
      }
    }
    count++
  }

  log(
    count > 0 ? `\nDone: ${count} migration(s) applied.` : '\nNothing to apply.'
  )
  return count

  async function withRetries(label, fn) {
    for (let attempt = 1; ; attempt++) {
      try {
        return await fn()
      } catch (error) {
        if (!isTransientError(error) || attempt >= maxAttempts) throw error
        log(
          `  retry: ${label} (attempt ${attempt + 1}/${maxAttempts} after: ${error.message})`
        )
      }
    }
  }
}
