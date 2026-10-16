/**
 * Migration runner core, kept free of process and environment access so it can
 * be tested with a fake client factory. The CLI is scripts/db-migrate.mjs.
 *
 * Every step uses a fresh connection and simple (parameter-free) queries:
 *
 * 1. One connection sends two queries: it creates the ledger table if needed,
 *    then reads the ledger names and the server version.
 * 2. Each pending file gets its own connection and one query: a marker comment,
 *    the server-side time bounds, the file content, then its ledger INSERT.
 *    Postgres runs a multi-statement simple query as one implicit transaction,
 *    so the file and its ledger row commit together or not at all.

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
 * Timeouts and retries: every attempt has a 60 s client-side deadline. The
 * deadline only closes the client socket; it does not cancel the query on the
 * server, and the backend behind the pooler may keep running and holding locks.
 * So the server bounds each attempt itself, with SET LOCAL settings that end
 * with the implicit transaction and never leak into the pooled backend:
 *
 * - `transaction_timeout = '45s'` (Postgres 17+) ends the whole attempt, file
 *   and ledger row together, 45 s after it starts. Postgres 17 reports this by
 *   closing the session. Before 17 the runner uses `statement_timeout = '45s'`,
 *   which bounds each statement only, not the whole attempt.
 * - `lock_timeout = '10s'` makes a retry fail fast with 55P03 instead of queueing
 *   behind locks still held by an earlier attempt.
 *
 * After a timeout or connection error the runner waits until the failed
 * attempt's start + 45 s server bound + 10 s margin has passed. From then on the
 * earlier attempt has committed or rolled back (strictly on 17+), so the ledger
 * is authoritative: if the name is there, the earlier attempt committed;
 * otherwise the file is retried, up to `maxAttempts` attempts. After a
 * transient failure, a later 55P03, 57014 or 25P04 counts as transient too. Any
 * other SQL error is not retried; if an earlier attempt for the same file
 * failed transiently, the runner checks the ledger before failing, because
 * that attempt may have committed meanwhile (this also covers the per-statement
 * gap before Postgres 17).
 *
 * The marker comment `/* spendtracker-migrate:<name> *\/` at the start of the
 * query helps find an attempt in pg_stat_activity when debugging by hand.
 */

export const MIGRATION_FILENAME = /^[\w.-]+\.sql$/

export const DEFAULT_DEADLINE_MS = 60_000
export const DEFAULT_MAX_ATTEMPTS = 3
export const SERVER_BOUND_MS = 45_000
export const SETTLE_MARGIN_MS = 10_000

/** SQLSTATEs that, after a transient failure, mean "an earlier attempt is still in the way". */
const SERVER_TIMEOUT_CODES = new Set(['55P03', '57014', '25P04'])

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

/** Marker at the start of the apply query, for manual pg_stat_activity debugging. */
export function migrationMarker(name) {
  ledgerLiteral(name)
  return `/* spendtracker-migrate:${name} */`
}

export function serverBoundPrefix(serverVersionNum) {
  const bound = SERVER_BOUND_MS / 1000
  const total =
    serverVersionNum >= 170000
      ? `SET LOCAL transaction_timeout = '${bound}s';`
      : `SET LOCAL statement_timeout = '${bound}s';`
  return `SET LOCAL lock_timeout = '10s';\n${total}`
}

export function buildApplyQuery(name, content, serverVersionNum) {
  return `${migrationMarker(name)}\n${serverBoundPrefix(serverVersionNum)}\n${content}\n;\nINSERT INTO __drizzle_migrations (name) VALUES (${ledgerLiteral(name)});`
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
  settleMs = SERVER_BOUND_MS + SETTLE_MARGIN_MS,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now,
}) {
  const run = (query) =>
    runOnFreshClient(connect, (client) => client.unsafe(query), deadlineMs)

  const readLedger = () =>
    runOnFreshClient(
      connect,
      async (client) => {
        await client.unsafe(LEDGER_DDL)
        const [row] = await client.unsafe(
          "SELECT current_setting('server_version_num')::int AS version, " +
            "(SELECT coalesce(json_agg(name), '[]'::json) FROM __drizzle_migrations)::text AS names"
        )
        return { version: row.version, names: new Set(JSON.parse(row.names)) }
      },
      deadlineMs
    )
  const isRecorded = async (name) =>
    (
      await run(
        `SELECT 1 FROM __drizzle_migrations WHERE name = ${ledgerLiteral(name)}`
      )
    ).length > 0

  const { version, names: applied } = await withRetries('ledger', readLedger)

  let count = 0
  for (const file of [...files].sort()) {
    if (applied.has(file)) {
      log(`  skip: ${file} (already applied)`)
      continue
    }

    const query = buildApplyQuery(file, readFile(file), version)
    log(`  apply: ${file}`)

    let applyError = null
    let attemptStartedAt = 0
    for (let attempt = 1; ; attempt++) {
      try {
        if (applyError) {
          // Let the server bound end the failed attempt before trusting the ledger.
          const remaining = attemptStartedAt + settleMs - now()
          if (remaining > 0) await sleep(remaining)
          if (await isRecorded(file)) {
            log(`  recorded-by-previous-attempt: ${file}`)
            break
          }
        }
        attemptStartedAt = now()
        await run(query)
        break
      } catch (error) {
        const blockedByEarlierAttempt =
          applyError && SERVER_TIMEOUT_CODES.has(error?.code)
        if (!isTransientError(error) && !blockedByEarlierAttempt) {
          if (applyError && error.name === 'PostgresError') {
            // A timed-out earlier attempt may have committed while this one
            // waited on its locks, e.g. 42P07 or 23505 on the ledger row.
            if (await isRecorded(file).catch(() => false)) {
              log(`  recorded-by-previous-attempt: ${file}`)
              break
            }
          }
          throw error
        }
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
