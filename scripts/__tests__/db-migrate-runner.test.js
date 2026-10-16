import {
  DeadlineError,
  buildApplyQuery,
  runMigrations,
} from '../db-migrate-runner.mjs'

const LEDGER_SELECT = 'SELECT name FROM __drizzle_migrations'

/**
 * Fake postgres.js factory. `ledger` is the committed state; `behave(query)`
 * may return 'hang', 'hang-after-commit', an Error to reject with, or nothing.
 */
function fakeDb({ ledger = [], behave = () => undefined } = {}) {
  const committed = new Set(ledger)
  const clients = []
  const connect = () => {
    const client = {
      queries: [],
      ended: null,
      unsafe: jest.fn(async (query) => {
        client.queries.push(query)
        const action = behave(query, clients.length)
        if (action instanceof Error) throw action
        const insert = query.match(
          /INSERT INTO __drizzle_migrations \(name\) VALUES \('(.+)'\);$/
        )
        if (action === 'hang') return new Promise(() => {})
        if (insert) committed.add(insert[1])
        if (action === 'hang-after-commit') return new Promise(() => {})
        if (query === LEDGER_SELECT)
          return [...committed].map((name) => ({ name }))
        const check = query.match(/WHERE name = '(.+)'$/)
        if (check) return committed.has(check[1]) ? [{ '?column?': 1 }] : []
        return []
      }),
      end: jest.fn(async (opts) => {
        client.ended = opts ?? {}
      }),
    }
    clients.push(client)
    return client
  }
  return { connect, clients, committed }
}

function setup(db, files, extra = {}) {
  const lines = []
  const contents = Object.fromEntries(
    files.map((f) => [f, `CREATE TABLE "${f}" (id int);`])
  )
  const promise = runMigrations({
    connect: db.connect,
    files,
    readFile: (f) => contents[f],
    log: (line) => lines.push(line),
    deadlineMs: 50,
    ...extra,
  })
  return { lines, promise, contents }
}

describe('db-migrate runner', () => {
  it('opens one fresh client per pending file and sends file plus ledger INSERT as one query', async () => {
    const db = fakeDb({ ledger: ['0000_a.sql'] })
    const { lines, promise, contents } = setup(db, [
      '0002_c.sql',
      '0000_a.sql',
      '0001_b.sql',
    ])
    await expect(promise).resolves.toBe(2)

    expect(db.clients).toHaveLength(3)
    expect(db.clients[0].queries).toHaveLength(2)
    expect(db.clients[0].queries[1]).toBe(LEDGER_SELECT)
    expect(db.clients[1].queries).toEqual([
      buildApplyQuery('0001_b.sql', contents['0001_b.sql']),
    ])
    expect(db.clients[1].queries[0]).toBe(
      `${contents['0001_b.sql']}\n;\nINSERT INTO __drizzle_migrations (name) VALUES ('0001_b.sql');`
    )
    expect(db.clients[2].queries).toHaveLength(1)
    for (const client of db.clients) expect(client.end).toHaveBeenCalledTimes(1)

    expect(lines).toEqual([
      '  skip: 0000_a.sql (already applied)',
      '  apply: 0001_b.sql',
      '  apply: 0002_c.sql',
      '\nDone: 2 migration(s) applied.',
    ])
  })

  it('prints the nothing-to-apply line when every file is recorded', async () => {
    const db = fakeDb({ ledger: ['0000_a.sql'] })
    const { lines, promise } = setup(db, ['0000_a.sql'])
    await expect(promise).resolves.toBe(0)
    expect(db.clients).toHaveLength(1)
    expect(lines).toEqual([
      '  skip: 0000_a.sql (already applied)',
      '\nNothing to apply.',
    ])
  })

  it('after a timeout checks the ledger on a new client, then retries the file', async () => {
    let hung = false
    const db = fakeDb({
      behave: (q) => {
        if (q.includes('INSERT') && !hung) {
          hung = true
          return 'hang'
        }
      },
    })
    const { lines, promise } = setup(db, ['0000_a.sql'])
    await expect(promise).resolves.toBe(1)

    expect(db.clients).toHaveLength(4)
    expect(db.clients[1].end).toHaveBeenCalledWith({ timeout: 0 })
    expect(db.clients[2].queries).toEqual([
      "SELECT 1 FROM __drizzle_migrations WHERE name = '0000_a.sql'",
    ])
    expect(db.clients[3].queries[0]).toContain("VALUES ('0000_a.sql');")
    expect(db.committed.has('0000_a.sql')).toBe(true)
    expect(lines).toEqual([
      '  apply: 0000_a.sql',
      `  retry: 0000_a.sql (attempt 2/3 after: ${new DeadlineError(50).message})`,
      '\nDone: 1 migration(s) applied.',
    ])
  })

  it('does not reapply a file whose timed-out attempt actually committed', async () => {
    let hung = false
    const db = fakeDb({
      behave: (q) => {
        if (q.includes('INSERT') && !hung) {
          hung = true
          return 'hang-after-commit'
        }
      },
    })
    const { lines, promise } = setup(db, ['0000_a.sql'])
    await expect(promise).resolves.toBe(1)

    expect(db.clients).toHaveLength(3)
    const applyQueries = db.clients
      .flatMap((c) => c.queries)
      .filter((q) => q.includes('INSERT'))
    expect(applyQueries).toHaveLength(1)
    expect(lines).toContain('  recorded-by-previous-attempt: 0000_a.sql')
    expect(lines.at(-1)).toBe('\nDone: 1 migration(s) applied.')
  })

  it('retries a dropped connection and fails loudly after three attempts', async () => {
    const drop = Object.assign(new Error('read ETIMEDOUT'), {
      code: 'ETIMEDOUT',
    })
    const db = fakeDb({
      behave: (q) => (q.includes('INSERT') ? drop : undefined),
    })
    const { lines, promise } = setup(db, ['0000_a.sql'])
    await expect(promise).rejects.toThrow(
      /Migration 0000_a\.sql failed after 3 attempts/
    )
    expect(lines.filter((l) => l.startsWith('  retry:'))).toHaveLength(2)
    const applyQueries = db.clients
      .flatMap((c) => c.queries)
      .filter((q) => q.includes('INSERT'))
    expect(applyQueries).toHaveLength(3)
  })

  it('does not retry after a SQL error from the server', async () => {
    const sqlError = Object.assign(
      new Error('duplicate key value violates unique constraint'),
      {
        name: 'PostgresError',
        code: '23505',
      }
    )
    const db = fakeDb({
      behave: (q) => (q.includes('INSERT') ? sqlError : undefined),
    })
    const { lines, promise } = setup(db, ['0000_a.sql', '0001_b.sql'])
    await expect(promise).rejects.toBe(sqlError)
    expect(db.clients).toHaveLength(2)
    expect(db.clients[1].end).toHaveBeenCalledWith({ timeout: 0 })
    expect(lines).toEqual(['  apply: 0000_a.sql'])
  })

  it('throws on an invalid migration filename before sending it', async () => {
    const db = fakeDb()
    const { promise } = setup(db, ["0000_a'; DROP TABLE x; --.sql"])
    await expect(promise).rejects.toThrow(/Unexpected migration filename/)
    expect(db.clients).toHaveLength(1)
  })
})
