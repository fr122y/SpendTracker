// Fails a pull request that weakens the existing test suite: it deletes a test
// file, adds skip/only markers, or lowers the number of test cases.
//
// Runs on `pull_request_target`, so this script always comes from the base
// branch. It reads the pull request only through the REST API and never checks
// out or executes code from the pull request head.
//
// Known limits. Counting is plain text matching, not parsing: a marker or a
// test call inside a string or a comment counts. Loosened assertions, updated
// snapshots, and convenient mocks are not detected. Changing a test is normal
// and passes; only the three rules below fail.

import { appendFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Repo-relative globs that define a test file. */
export const TEST_FILE_PATTERNS = [
  '**/__tests__/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  'e2e/**/*.spec.ts',
]

const PAGE_SIZE = 100

// `.skip(`, `.only(`, `.todo(`, `.failing(` on any receiver.
const MEMBER_MARKER = /\.(?:skip|only|todo|failing)\s*\(/g
// `xit(`, `fit(` and friends as whole identifiers, not as a member of another
// object and not as the tail of a longer name (`exit(`, `benefit(`).
const IDENTIFIER_MARKER =
  /(?<![\w$.])(?:xit|xtest|xdescribe|fit|fdescribe)\s*\(/g
// `it(` / `test(` as whole identifiers, with the optional `.concurrent` and
// `.each` variants. `.each` counts once, whatever the table size. Marker forms
// (`it.skip(`, `xit(`) do not match, so rule 2 reports them instead.
const TEST_CASE =
  /(?<![\w$.])(?:it|test)(?:\.concurrent)?(?:\s*\(|\.each(?![\w$]))/g

/**
 * Compiles a glob into an anchored, case-sensitive regular expression.
 * `**` matches any depth, `*` matches within one segment, the rest is literal.
 * Same semantics as the glob matcher in `protected-paths.mjs`.
 */
export function globToRegExp(glob) {
  const source = glob
    .split('/')
    .map((segment, index, segments) => {
      const isLast = index === segments.length - 1
      if (segment === '**') {
        return isLast ? '.*' : '(?:[^/]+/)*'
      }
      const literal = segment
        .split('*')
        .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
        .join('[^/]*')
      return isLast ? literal : `${literal}/`
    })
    .join('')
  return new RegExp(`^${source}$`)
}

const TEST_FILE_EXPRESSIONS = TEST_FILE_PATTERNS.map(globToRegExp)

/** True when the path is a test file by `TEST_FILE_PATTERNS`. */
export function isTestFile(path) {
  return (
    typeof path === 'string' &&
    TEST_FILE_EXPRESSIONS.some((expression) => expression.test(path))
  )
}

function countMatches(text, expression) {
  return [...text.matchAll(expression)].length
}

/** Counts skip/only markers in a file's text. */
export function countMarkers(text) {
  return (
    countMatches(text, MEMBER_MARKER) + countMatches(text, IDENTIFIER_MARKER)
  )
}

/** Counts test cases in a file's text, excluding the marker forms. */
export function countTestCases(text) {
  return countMatches(text, TEST_CASE)
}

/**
 * Sorts REST "pull request files" entries into what each rule needs.
 *
 * - `deleted`: test files that stop existing as test files (rule 1).
 * - `compared`: test files whose content is read at both commits. `basePath`
 *   is null for a file that is new as a test file; otherwise it is the path at
 *   the base, which differs from `path` after a rename.
 */
export function classifyFiles(files) {
  const deleted = []
  const compared = []
  for (const file of files) {
    const { filename, status } = file
    const previous = file.previous_filename ?? null
    if (status === 'unchanged') continue
    if (status === 'removed') {
      if (isTestFile(filename)) deleted.push({ path: filename, detail: null })
      continue
    }
    if (status === 'renamed') {
      const wasTest = isTestFile(previous)
      const isTest = isTestFile(filename)
      if (wasTest && !isTest) {
        // The file survives but no runner picks it up any more.
        deleted.push({
          path: previous,
          detail: `renamed to ${filename}, which is not a test file`,
        })
      } else if (isTest) {
        compared.push({ path: filename, basePath: wasTest ? previous : null })
      }
      continue
    }
    if (!isTestFile(filename)) continue
    if (status === 'modified' || status === 'changed') {
      compared.push({ path: filename, basePath: filename })
    } else if (status === 'added' || status === 'copied') {
      compared.push({ path: filename, basePath: null })
    } else {
      throw new Error(`Unknown file status "${status}" for ${filename}`)
    }
  }
  return { deleted, compared }
}

/**
 * Applies the three rules.
 *
 * `deleted` comes from `classifyFiles`. `contents` holds one entry per
 * compared file: `{ path, basePath, baseText, headText }`, where `baseText`
 * is null for a file that is new as a test file.
 *
 * Returns `{ violations, totals }`. Each violation is
 * `{ path, rule, detail }` with rule `deleted`, `markers`, or `test cases`.
 */
export function evaluate(deleted, contents) {
  const violations = deleted.map(({ path, detail }) => ({
    path,
    rule: 'deleted',
    detail: detail ?? 'deleted',
  }))

  let baseTotal = 0
  let headTotal = 0
  const decreased = []

  for (const { path, basePath, baseText, headText } of contents) {
    const baseMarkers = baseText === null ? 0 : countMarkers(baseText)
    const headMarkers = countMarkers(headText)
    if (headMarkers > baseMarkers) {
      violations.push({
        path,
        rule: 'markers',
        detail: `markers ${baseMarkers} -> ${headMarkers}`,
      })
    }

    // A file that is new as a test file cannot offset a decrease elsewhere.
    if (baseText === null) continue
    const baseCases = countTestCases(baseText)
    const headCases = countTestCases(headText)
    baseTotal += baseCases
    headTotal += headCases
    if (headCases < baseCases) {
      const renamed = basePath !== path ? ` (renamed from ${basePath})` : ''
      decreased.push({
        path,
        rule: 'test cases',
        detail: `test cases ${baseCases} -> ${headCases}${renamed}`,
      })
    }
  }

  if (headTotal < baseTotal) violations.push(...decreased)

  return { violations, totals: { base: baseTotal, head: headTotal } }
}

/** Builds the Markdown shown in the workflow run summary on a failure. */
export function buildSummary(violations, totals) {
  const lines = [
    '## Test integrity: this pull request weakens existing tests',
    '',
    'Changing a test is normal and passes. This pull request does one of the',
    'three things the check blocks: it deletes a test file, adds a skip or',
    'only marker, or lowers the number of test cases in existing test files.',
    '',
    '| File | Finding |',
    '| --- | --- |',
    ...violations.map(({ path, detail }) => `| \`${path}\` | ${detail} |`),
    '',
  ]
  if (totals.head < totals.base) {
    lines.push(
      `Test cases across the changed existing test files: ${totals.base} -> ${totals.head}.`,
      ''
    )
  }
  lines.push(
    'This failure is intentional friction. Restore the tests, or ask the',
    'repository owner if the removal is intended. The check has no approval',
    'mechanism: only the repository owner can merge this pull request, using',
    'the bypass of the `Protect main` ruleset after confirming that `verify`',
    'is green.',
    ''
  )
  return lines.join('\n')
}

function requireEnv(env, name) {
  const value = env[name]
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

// The API helpers below repeat the few lines in `protected-paths.mjs` on
// purpose: the two checks stay independent files with no shared module.
async function request(env, path, accept) {
  const apiUrl = env.GITHUB_API_URL || 'https://api.github.com'
  return fetch(`${apiUrl}${path}`, {
    headers: {
      Accept: accept,
      Authorization: `Bearer ${requireEnv(env, 'GITHUB_TOKEN')}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'test-integrity-check',
    },
  })
}

async function getJson(env, path) {
  const response = await request(env, path, 'application/vnd.github+json')
  if (!response.ok) {
    throw new Error(`GitHub API ${path} failed with HTTP ${response.status}`)
  }
  return response.json()
}

/** Returns the file text at a commit. Throws when it is missing or not UTF-8. */
async function getFileText(env, repository, path, sha) {
  const encoded = path.split('/').map(encodeURIComponent).join('/')
  const apiPath = `/repos/${repository}/contents/${encoded}?ref=${sha}`
  const response = await request(
    env,
    apiPath,
    'application/vnd.github.raw+json'
  )
  if (!response.ok) {
    throw new Error(
      `Cannot read ${path} at ${sha}: GitHub API returned HTTP ${response.status}`
    )
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(
      await response.arrayBuffer()
    )
  } catch {
    throw new Error(`Cannot decode ${path} at ${sha} as UTF-8 text`)
  }
}

async function listPullRequestFiles(env, repository, number, expected) {
  const files = []
  for (let page = 1; files.length < expected; page += 1) {
    const batch = await getJson(
      env,
      `/repos/${repository}/pulls/${number}/files?per_page=${PAGE_SIZE}&page=${page}`
    )
    if (!Array.isArray(batch)) {
      throw new Error('GitHub API returned an unexpected file list')
    }
    files.push(...batch)
    if (batch.length < PAGE_SIZE) break
  }
  return files
}

/**
 * Returns the commit the file list is computed against. GitHub lists a pull
 * request's files relative to the merge base, not to the tip of the base
 * branch, so the "before" content must come from the same commit: otherwise a
 * test added to `main` after the branch started would look like a removal.
 */
async function getMergeBase(env, repository, baseSha, headSha) {
  const comparison = await getJson(
    env,
    `/repos/${repository}/compare/${baseSha}...${headSha}?per_page=1`
  )
  const sha = comparison.merge_base_commit?.sha
  if (typeof sha !== 'string' || !/^[0-9a-f]{40}$/.test(sha)) {
    throw new Error('GitHub API did not report a merge base commit')
  }
  return sha
}

export async function main(env = process.env) {
  const repository = requireEnv(env, 'GITHUB_REPOSITORY')
  const number = requireEnv(env, 'PR_NUMBER')
  const baseSha = requireEnv(env, 'BASE_SHA')
  const headSha = requireEnv(env, 'HEAD_SHA')
  if (!/^\d+$/.test(number)) throw new Error('PR_NUMBER is not a number')
  for (const sha of [baseSha, headSha]) {
    if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error('Invalid commit SHA')
  }

  const pull = await getJson(env, `/repos/${repository}/pulls/${number}`)
  if (pull.head?.sha !== headSha) {
    throw new Error(
      `Pull request head is ${pull.head?.sha}, expected ${headSha}; ` +
        'the file list would not describe the commit under check'
    )
  }
  const expected = pull.changed_files
  if (!Number.isInteger(expected)) {
    throw new Error('GitHub API did not report changed_files')
  }

  const files = await listPullRequestFiles(env, repository, number, expected)
  if (files.length < expected) {
    throw new Error(
      `Fetched ${files.length} of ${expected} changed files; ` +
        'refusing to pass an incomplete file list'
    )
  }

  const { deleted, compared } = classifyFiles(files)

  const contents = []
  if (compared.length > 0) {
    const mergeBase = await getMergeBase(env, repository, baseSha, headSha)
    for (const { path, basePath } of compared) {
      const [baseText, headText] = await Promise.all([
        basePath === null
          ? null
          : getFileText(env, repository, basePath, mergeBase),
        getFileText(env, repository, path, headSha),
      ])
      contents.push({ path, basePath, baseText, headText })
    }
  }

  const { violations, totals } = evaluate(deleted, contents)
  const checked = deleted.length + compared.length

  if (violations.length === 0) {
    console.log(
      `test-integrity: ${checked} changed test file(s), existing tests not weakened.`
    )
    return 0
  }

  console.log('test-integrity: this pull request weakens existing tests:')
  for (const { path, detail } of violations) {
    console.log(`  ${path}  (${detail})`)
  }
  if (totals.head < totals.base) {
    console.log(
      `Test cases across the changed existing test files: ${totals.base} -> ${totals.head}.`
    )
  }
  console.log(
    'Restore the tests or ask the owner. Only the owner can merge it, using ' +
      'the `Protect main` ruleset bypass after confirming `verify` is green.'
  )
  if (env.GITHUB_STEP_SUMMARY) {
    appendFileSync(env.GITHUB_STEP_SUMMARY, buildSummary(violations, totals))
  }
  return 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await main()
  } catch (error) {
    console.error(`test-integrity: failing closed: ${error.message}`)
    process.exitCode = 2
  }
}
