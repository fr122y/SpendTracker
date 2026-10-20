// Fails a pull request that changes the files defining the repository's checks.
//
// Runs on `pull_request_target`, so this script and the path list always come
// from the base branch. It reads the pull request only through the REST API
// and never checks out or executes code from the pull request head.

import { appendFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const PACKAGE_JSON = 'package.json'
export const PACKAGE_JSON_KEYS = ['scripts', 'lint-staged']

export const E2E_SPECS = '.github/e2e-specs.txt'
const E2E_SPEC_PATH = /^e2e\/[A-Za-z0-9][A-Za-z0-9._-]*\.spec\.ts$/

const LIST_PATH = new URL('../protected-paths.txt', import.meta.url)
const PAGE_SIZE = 100

/** Parses the list file: one glob per line, `#` comments, blank lines. */
export function parsePatterns(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
}

/**
 * Compiles a glob into an anchored, case-sensitive regular expression.
 * `**` matches any depth, `*` matches within one segment, the rest is literal.
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

/** Returns the first pattern that matches the path, or null. */
export function matchPattern(path, patterns) {
  return patterns.find((glob) => globToRegExp(glob).test(path)) ?? null
}

/**
 * Flattens REST "pull request files" entries into the set of touched paths.
 * A rename touches both its new and its previous name.
 */
export function collectChangedPaths(files) {
  const paths = new Set()
  for (const file of files) {
    if (file.filename) paths.add(file.filename)
    if (file.previous_filename) paths.add(file.previous_filename)
  }
  return [...paths]
}

/** Returns `{ path, rule }` for every changed path matched by a pattern. */
export function findProtectedPaths(paths, patterns) {
  const hits = []
  for (const path of paths) {
    const rule = matchPattern(path, patterns)
    if (rule !== null) hits.push({ path, rule })
  }
  return hits
}

/** Deep equality that ignores object key order but keeps array order. */
export function deepEqual(a, b) {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object') return false
  if (a === null || b === null) return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    return a.length === b.length && a.every((item, i) => deepEqual(item, b[i]))
  }
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  return (
    keysA.length === keysB.length &&
    keysA.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]))
  )
}

function parseManifest(text) {
  if (typeof text !== 'string') return null
  try {
    const value = JSON.parse(text)
    const isObject =
      typeof value === 'object' && value !== null && !Array.isArray(value)
    return isObject ? value : null
  } catch {
    return null
  }
}

/**
 * Compares `package.json` at the base and at the head.
 * Takes the raw file text, or null when the file does not exist on that side.
 * Returns a rule description when the change is protected, or null.
 */
export function comparePackageJson(baseText, headText) {
  if (headText === null) return `${PACKAGE_JSON} (deleted)`
  if (baseText === null) return `${PACKAGE_JSON} (missing at base)`
  const base = parseManifest(baseText)
  const head = parseManifest(headText)
  if (base === null || head === null) return `${PACKAGE_JSON} (unparsable)`
  const changed = PACKAGE_JSON_KEYS.filter(
    (key) => !deepEqual(base[key], head[key])
  )
  return changed.length > 0
    ? `${PACKAGE_JSON} (${changed.join(', ')} changed)`
    : null
}

function splitLines(text) {
  const lines = text.split(/\r?\n/)
  if (lines.at(-1) === '') lines.pop()
  return lines
}

function isIgnorableLine(line) {
  const trimmed = line.trim()
  return trimmed === '' || trimmed.startsWith('#')
}

/**
 * Returns the lines the head adds to the base, or null when the head removes
 * or modifies any base line (the base lines must stay in order as a
 * subsequence of the head).
 */
export function listAddedLines(baseText, headText) {
  const base = splitLines(baseText)
  const head = splitLines(headText)
  const added = []
  let next = 0
  for (const line of head) {
    if (next < base.length && line === base[next]) next += 1
    else added.push(line)
  }
  return next === base.length ? added : null
}

/** Returns the added non-comment lines: the candidate spec paths. */
export function listAddedSpecs(baseText, headText) {
  const added = listAddedLines(baseText, headText) ?? []
  return added.filter((line) => !isIgnorableLine(line))
}

/**
 * Judges a change of `.github/e2e-specs.txt` that touches no other protected
 * path. It passes (returns null) only when the head adds lines and changes
 * nothing else, and every added line is blank, a `#` comment, or a new path
 * `e2e/<name>.spec.ts` that exists in the head tree (`existing`, a Set) and
 * is not already listed. Otherwise returns a rule description.
 */
export function compareE2eSpecs(baseText, headText, existing) {
  if (headText === null) return `${E2E_SPECS} (deleted)`
  if (baseText === null) return `${E2E_SPECS} (missing at base)`
  const added = listAddedLines(baseText, headText)
  if (added === null) return `${E2E_SPECS} (lines removed or modified)`
  const listed = new Set(
    splitLines(baseText)
      .filter((line) => !isIgnorableLine(line))
      .map((line) => line.trim())
  )
  for (const line of added) {
    if (isIgnorableLine(line)) continue
    const path = line.trim()
    if (!E2E_SPEC_PATH.test(path)) {
      return `${E2E_SPECS} (added line is not an e2e/<name>.spec.ts path: ${path})`
    }
    if (listed.has(path)) return `${E2E_SPECS} (duplicate entry: ${path})`
    if (!existing.has(path)) {
      return `${E2E_SPECS} (added spec does not exist in the head: ${path})`
    }
    listed.add(path)
  }
  return null
}

/** Builds the Markdown shown in the workflow run summary on a hit. */
export function buildSummary(hits) {
  return [
    '## Protected paths: this pull request changes check definitions',
    '',
    'The files below define the checks that guard `main` (CI workflows,',
    'hooks, and lint, type, test, commit-message, or OpenSpec configuration).',
    '',
    '| File | Matched rule |',
    '| --- | --- |',
    ...hits.map(({ path, rule }) => `| \`${path}\` | \`${rule}\` |`),
    '',
    'This failure is intentional friction, not a defect to fix in the pull',
    'request. The check has no approval mechanism: only the repository owner',
    'can merge this pull request, using the bypass of the `Protect main`',
    'ruleset after confirming that `verify` is green.',
    '',
  ].join('\n')
}

function requireEnv(env, name) {
  const value = env[name]
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

async function request(env, path, accept) {
  const apiUrl = env.GITHUB_API_URL || 'https://api.github.com'
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      Accept: accept,
      Authorization: `Bearer ${requireEnv(env, 'GITHUB_TOKEN')}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'protected-paths-check',
    },
  })
  return response
}

async function getJson(env, path) {
  const response = await request(env, path, 'application/vnd.github+json')
  if (!response.ok) {
    throw new Error(`GitHub API ${path} failed with HTTP ${response.status}`)
  }
  return response.json()
}

/** Returns the raw file text at a commit, or null when it does not exist. */
async function getFileText(env, repository, path, sha) {
  const apiPath = `/repos/${repository}/contents/${path}?ref=${sha}`
  const response = await request(
    env,
    apiPath,
    'application/vnd.github.raw+json'
  )
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`GitHub API ${apiPath} failed with HTTP ${response.status}`)
  }
  return response.text()
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

export async function main(env = process.env) {
  const repository = requireEnv(env, 'GITHUB_REPOSITORY')
  const number = requireEnv(env, 'PR_NUMBER')
  const baseSha = requireEnv(env, 'BASE_SHA')
  const headSha = requireEnv(env, 'HEAD_SHA')
  if (!/^\d+$/.test(number)) throw new Error('PR_NUMBER is not a number')
  for (const sha of [baseSha, headSha]) {
    if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error('Invalid commit SHA')
  }

  const patterns = parsePatterns(readFileSync(LIST_PATH, 'utf8'))
  if (patterns.length === 0) throw new Error('The protected path list is empty')

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

  const paths = collectChangedPaths(files)
  const hits = findProtectedPaths(paths, patterns)

  if (paths.includes(PACKAGE_JSON)) {
    const [baseText, headText] = await Promise.all([
      getFileText(env, repository, PACKAGE_JSON, baseSha),
      getFileText(env, repository, PACKAGE_JSON, headSha),
    ])
    const rule = comparePackageJson(baseText, headText)
    if (rule !== null) hits.push({ path: PACKAGE_JSON, rule })
  }

  const onlyE2eSpecs = hits.length === 1 && hits[0].path === E2E_SPECS
  if (onlyE2eSpecs) {
    const entry = files.find((file) => file.filename === E2E_SPECS)
    if (entry?.status !== 'modified' || entry.previous_filename) {
      hits[0].rule = `${E2E_SPECS} (${entry?.status ?? 'renamed'})`
    } else {
      const [baseText, headText] = await Promise.all([
        getFileText(env, repository, E2E_SPECS, baseSha),
        getFileText(env, repository, E2E_SPECS, headSha),
      ])
      const existing = new Set()
      if (baseText !== null && headText !== null) {
        const candidates = listAddedSpecs(baseText, headText).filter((path) =>
          E2E_SPEC_PATH.test(path.trim())
        )
        const texts = await Promise.all(
          candidates.map((path) =>
            getFileText(env, repository, path.trim(), headSha)
          )
        )
        candidates.forEach((path, i) => {
          if (texts[i] !== null) existing.add(path.trim())
        })
      }
      const rule = compareE2eSpecs(baseText, headText, existing)
      if (rule === null) {
        console.log(
          `protected-paths: ${E2E_SPECS} only adds existing specs; allowed.`
        )
        hits.length = 0
      } else {
        hits[0].rule = rule
      }
    }
  }

  if (hits.length === 0) {
    console.log(
      `protected-paths: ${paths.length} changed path(s), none protected.`
    )
    return 0
  }

  console.log('protected-paths: this pull request changes check definitions:')
  for (const { path, rule } of hits) {
    console.log(`  ${path}  (rule: ${rule})`)
  }
  console.log(
    'Only the owner can merge it, using the `Protect main` ruleset bypass ' +
      'after confirming `verify` is green.'
  )
  if (env.GITHUB_STEP_SUMMARY) {
    appendFileSync(env.GITHUB_STEP_SUMMARY, buildSummary(hits))
  }
  return 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await main()
  } catch (error) {
    console.error(`protected-paths: failing closed: ${error.message}`)
    process.exitCode = 2
  }
}
