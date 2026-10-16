import {
  DeadlineError,
  buildApplyQuery,
  runMigrations,
} from '../db-migrate-runner.mjs'

const PG17 = 170011

/**
 * Fake postgres.js factory. `ledger` is the committed state; `behave(query)`
 * may return 'hang', 'hang-after-commit', an Error to reject with, or nothing.
 */
function fakeDb({
  ledger = [],
  behave = () => undefined,
  version = PG17,
} = {}) {
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
        if (query.includes('server_version_num'))
          return [{ version, names: JSON.stringify([...committed]) }]
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
    sleep: async () => {},
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
    expect(db.clients[0].queries[1]).toContain('server_version_num')
    expect(db.clients[1].queries).toEqual([
      buildApplyQuery('0001_b.sql', contents['0001_b.sql'], PG17),
    ])
    expect(db.clients[1].queries[0]).toBe(
      `/* spendtracker-migrate:0001_b.sql */\nSET LOCAL lock_timeout = '10s';\nSET LOCAL transaction_timeout = '45s';\n${contents['0001_b.sql']}\n;\nINSERT INTO __drizzle_migrations (name) VALUES ('0001_b.sql');`
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

  describe('after a transient failure', () => {
    const hangOnce = () => {
      let hung = false
      return (q) => {
        if (q.includes('INSERT') && !hung) {
          hung = true
          return 'hang'
        }
      }
    }

    it('waits until the failed attempt start + server bound + margin before re-checking the ledger', async () => {
      let clock = 1_000
      const events = []
      const db = fakeDb({
        behave: (q) => {
          if (q.includes('WHERE name =')) events.push(`check@${clock}`)
          if (q.includes('INSERT')) {
            events.push(`apply@${clock}`)
            if (events.filter((e) => e.startsWith('apply')).length === 1) {
              clock += 60_000 - 15_000 // client gave up after 45 s of fake time
              return Object.assign(new Error('read ETIMEDOUT'), {
                code: 'ETIMEDOUT',
              })
            }
          }
        },
      })
      const { promise } = setup(db, ['0000_a.sql'], {
        now: () => clock,
        sleep: async (ms) => {
          events.push(`sleep(${ms})`)
          clock += ms
        },
      })
      await expect(promise).resolves.toBe(1)
      expect(events).toEqual([
        'apply@1000',
        'sleep(10000)',
        'check@56000',
        'apply@56000',
      ])
    })

    it('treats lock_not_available after a transient failure as transient and retries', async () => {
      const lockBusy = Object.assign(
        new Error('canceling statement due to lock timeout'),
        { name: 'PostgresError', code: '55P03' }
      )
      let applies = 0
      const db = fakeDb({
        behave: (q) => {
          if (!q.includes('INSERT')) return
          applies++
          if (applies === 1) return 'hang'
          if (applies === 2) return lockBusy
        },
      })
      const { lines, promise } = setup(db, ['0000_a.sql'])
      await expect(promise).resolves.toBe(1)
      expect(applies).toBe(3)
      expect(lines.filter((l) => l.startsWith('  retry: 0000_a.sql'))).toEqual([
        `  retry: 0000_a.sql (attempt 2/3 after: ${new DeadlineError(50).message})`,
        '  retry: 0000_a.sql (attempt 3/3 after: canceling statement due to lock timeout)',
      ])
    })

    it('uses statement_timeout instead of transaction_timeout before Postgres 17', async () => {
      const db = fakeDb({ version: 160004 })
      const { promise } = setup(db, ['0000_a.sql'])
      await expect(promise).resolves.toBe(1)
      const apply = db.clients[1].queries[0]
      expect(apply).toContain("SET LOCAL lock_timeout = '10s';")
      expect(apply).toContain("SET LOCAL statement_timeout = '45s';")
      expect(apply).not.toContain('transaction_timeout')
    })

    it('treats a SQL error as success when the ledger shows an earlier attempt committed', async () => {
      const dup = Object.assign(new Error('relation already exists'), {
        name: 'PostgresError',
        code: '42P07',
      })
      let applies = 0
      const db = fakeDb({
        behave: (q) => {
          if (!q.includes('INSERT')) return
          applies++
          if (applies === 1) return 'hang'
          db.committed.add('0000_a.sql')
          return dup
        },
      })
      const { lines, promise } = setup(db, ['0000_a.sql'])
      await expect(promise).resolves.toBe(1)
      expect(applies).toBe(2)
      expect(lines).toContain('  recorded-by-previous-attempt: 0000_a.sql')
      expect(lines.at(-1)).toBe('\nDone: 1 migration(s) applied.')
    })
  })

  it('fails immediately on a SQL error with no earlier transient failure, without a ledger check', async () => {
    const dup = Object.assign(new Error('relation already exists'), {
      name: 'PostgresError',
      code: '42P07',
    })
    const db = fakeDb({
      behave: (q) => (q.includes('INSERT') ? dup : undefined),
    })
    const { promise } = setup(db, ['0000_a.sql'])
    await expect(promise).rejects.toBe(dup)
    const all = db.clients.flatMap((c) => c.queries)
    expect(all.some((q) => q.includes('WHERE name ='))).toBe(false)
  })
})
