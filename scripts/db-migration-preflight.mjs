import fs from 'node:fs'
import path from 'node:path'

import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL
const expectedValue = process.env.EXPECTED_PENDING_MIGRATIONS ?? ''
const preflightOnly = process.env.DB_MIGRATION_PREFLIGHT_ONLY === 'true'

if (!databaseUrl) {
  console.error('Preflight refused: DATABASE_URL is not configured.')
  process.exit(1)
}

const expected = expectedValue
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean)
const metadataOnly = expected.length === 1 && expected[0] === 'none'

if (expected.length === 0) {
  console.error('Preflight refused: expected migration list is empty.')
  process.exit(1)
}

if (metadataOnly && !preflightOnly) {
  console.error(
    'Preflight refused: expected migration list "none" requires preflight_only=true.'
  )
  process.exit(1)
}

const sql = postgres(databaseUrl, {
  ssl: false,
  prepare: false,
  connect_timeout: 10,
})

try {
  const [ledger] = await sql`
      SELECT to_regclass('public.__drizzle_migrations') AS table_name
    `
  const [allocationBucketTable] = await sql`
      SELECT to_regclass('public.allocation_bucket') AS table_name
    `

  if (!ledger?.table_name) {
    console.error('Preflight refused: migration ledger table is missing.')
    process.exitCode = 1
  } else if (!allocationBucketTable?.table_name) {
    console.error('Preflight refused: allocation_bucket table is missing.')
    process.exitCode = 1
  } else {
    const appliedRows = await sql`
      SELECT name FROM public.__drizzle_migrations ORDER BY name
    `
    const applied = new Set(appliedRows.map((row) => row.name))
    const migrationsDirectory = path.resolve(process.cwd(), 'drizzle')
    const migrationFiles = fs
      .readdirSync(migrationsDirectory)
      .filter((filename) => filename.endsWith('.sql'))
      .sort()
    const pending = migrationFiles.filter((filename) => !applied.has(filename))
    const allocationColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'allocation_bucket'
        AND column_name IN ('basis', 'amountKopecks')
      ORDER BY column_name
    `
    const presentAllocationColumns = allocationColumns.map(
      (row) => row.column_name
    )
    const expectedMatch = metadataOnly
      ? pending.length === 0
      : pending.length === expected.length &&
        pending.every((filename, index) => filename === expected[index])
    const t026Migration =
      expected.length === 1 &&
      expected[0] === '0012_income_allocation_basis.sql'
    const t026ColumnsAreAbsent = presentAllocationColumns.length === 0

    if (metadataOnly) {
      if (!expectedMatch) {
        console.error(
          'Preflight refused: pending migrations are not empty for a metadata-only check.'
        )
        process.exitCode = 1
      } else {
        const [salaryColumn] = await sql`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'user_settings'
            AND column_name = 'salary'
        `

        if (
          !presentAllocationColumns.includes('basis') ||
          !presentAllocationColumns.includes('amountKopecks') ||
          !salaryColumn
        ) {
          console.error(
            'Preflight refused: allocation basis, amount, or salary columns are missing.'
          )
          process.exitCode = 1
        } else {
          const [allocationSummary] = await sql`
            SELECT
              COUNT(*)::integer AS total_rows,
              COUNT(*) FILTER (WHERE basis = 'percentage')::integer AS percentage_basis_rows,
              COUNT(*) FILTER (WHERE basis = 'amount')::integer AS amount_basis_rows,
              COUNT(*) FILTER (WHERE "amountKopecks" IS NOT NULL)::integer AS rows_with_amount_kopecks
            FROM public.allocation_bucket
          `
          const [amountBasisWithoutPositiveSalary] = await sql`
            SELECT COUNT(*)::integer AS row_count
            FROM public.allocation_bucket AS bucket
            LEFT JOIN public.user_settings AS settings
              ON settings."userId" = bucket."userId"
            WHERE bucket.basis = 'amount'
              AND COALESCE(settings.salary, 0) <= 0
          `

          console.log(
            JSON.stringify(
              {
                migrationLedger: 'present',
                pendingMigrations: pending,
                allocationBucketColumns: presentAllocationColumns,
                allocationBucketRows: {
                  total: allocationSummary.total_rows,
                  percentageBasis: allocationSummary.percentage_basis_rows,
                  amountBasis: allocationSummary.amount_basis_rows,
                  withAmountKopecks: allocationSummary.rows_with_amount_kopecks,
                  amountBasisWithoutPositiveSalary:
                    amountBasisWithoutPositiveSalary.row_count,
                },
                mode: 'preflight-only',
              },
              null,
              2
            )
          )
          console.log(
            'Metadata preflight completed; no schema changes were applied.'
          )
        }
      }
    } else {
      console.log(
        JSON.stringify(
          {
            migrationLedger: 'present',
            appliedMigrations: appliedRows.map((row) => row.name),
            pendingMigrations: pending,
            allocationBucketColumns: presentAllocationColumns,
            mode: preflightOnly ? 'preflight-only' : 'apply-guarded',
          },
          null,
          2
        )
      )

      if (!expectedMatch) {
        console.error(
          'Preflight refused: pending migrations do not exactly match the expected list.'
        )
        process.exitCode = 1
      } else if (t026Migration && !t026ColumnsAreAbsent) {
        console.error(
          'Preflight refused: one or more T-026 allocation columns already exist.'
        )
        process.exitCode = 1
      } else if (preflightOnly) {
        console.log('Preflight completed; no schema changes were applied.')
      } else {
        console.log('Preflight passed; the migration step may proceed.')
      }
    }
  }
} catch (error) {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : 'unknown'
  console.error(
    `Preflight failed with database error code ${code}; refusing to migrate.`
  )
  process.exitCode = 1
} finally {
  await sql.end()
}
