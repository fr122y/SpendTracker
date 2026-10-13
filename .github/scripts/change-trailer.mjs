// Fails a pull request that touches an OpenSpec change folder when none of its
// commit messages carries the trailer `Change: <change-id>` for that change.
//
// Runs on `pull_request_target`, so this script always comes from the base
// branch. It reads the pull request only through the REST API and never checks
// out or executes code from the pull request head.
//
// Known limits. Only changes whose folders the pull request touches are
// required; a commit that belongs to a change but touches no change folder is
// not detected. `Refs: <task-id>` is not checked at all: the task register
// lives outside this repository. A `Change:` line counts wherever it stands in
// a commit message, not only in the final trailer block.

import { appendFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const PAGE_SIZE = 100
/** GitHub lists at most this many commits for one pull request. */
export const COMMIT_LIST_LIMIT = 250

const CHANGES_ROOT = 'openspec/changes/'
const ARCHIVE_DIRECTORY = 'archive'
const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/
// The key is case-sensitive and starts the line; the id is one token.
const CHANGE_TRAILER = /^Change:\s*(\S+)\s*$/

/**
 * Returns the OpenSpec change id a repo-relative path belongs to, or null.
 *
 * - `openspec/changes/<id>/…` gives `<id>`.
 * - `openspec/changes/archive/<dir>/…` gives `<dir>` without a leading
 *   `YYYY-MM-DD-`.
 *
 * A file directly in `openspec/changes/` or in `openspec/changes/archive/`
 * belongs to no change.
 */
export function changeIdFromPath(path) {
  if (typeof path !== 'string' || !path.startsWith(CHANGES_ROOT)) return null
  const segments = path.slice(CHANGES_ROOT.length).split('/')
  if (segments[0] !== ARCHIVE_DIRECTORY) {
    return segments.length >= 2 && segments[0] ? segments[0] : null
  }
  if (segments.length < 3 || !segments[1]) return null
  return segments[1].replace(DATE_PREFIX, '') || null
}

/**
 * Collects the change ids touched by REST "pull request files" entries, from
 * both the current and the previous name of each file. Sorted, no duplicates.
 */
export function collectTouchedChangeIds(files) {
  const ids = new Set()
  for (const file of files) {
    for (const path of [file.filename, file.previous_filename]) {
      const id = changeIdFromPath(path)
      if (id !== null) ids.add(id)
    }
  }
  return [...ids].sort()
}

/** Returns the ids of every `Change: <id>` line in one commit message. */
export function parseChangeTrailers(message) {
  if (typeof message !== 'string') return []
  const ids = []
  for (const line of message.split(/\r?\n/)) {
    const match = line.match(CHANGE_TRAILER)
    if (match) ids.push(match[1])
  }
  return ids
}

/** Collects the `Change:` ids of all commit messages. Sorted, no duplicates. */
export function collectTrailerIds(messages) {
  return [...new Set(messages.flatMap(parseChangeTrailers))].sort()
}

/**
 * Returns the touched change ids that no commit names in a `Change:` trailer.
 * Comparison is exact. Trailers naming other changes are allowed.
 */
export function findMissing(touchedIds, trailerIds) {
  const present = new Set(trailerIds)
  return touchedIds.filter((id) => !present.has(id))
}

/** Builds the Markdown shown in the workflow run summary on a failure. */
export function buildSummary(missing, trailerIds) {
  const found =
    trailerIds.length > 0
      ? trailerIds.map((id) => `\`Change: ${id}\``).join(', ')
      : 'none'
  return [
    '## Change trailer: commits are not linked to their OpenSpec change',
    '',
    'This pull request changes files of the OpenSpec changes below, but no',
    'commit message in it names them. The trailer is what lets `git blame` on',
    'any line lead to the proposal that explains it.',
    '',
    '| OpenSpec change | Line to add to a commit message |',
    '| --- | --- |',
    ...missing.map((id) => `| \`${id}\` | \`Change: ${id}\` |`),
    '',
    `\`Change:\` trailers found in this pull request's commits: ${found}.`,
    '',
    'Put the line in a commit message, at the end, next to any',
    '`Co-Authored-By:` line. The pull request description does not count:',
    'the squash commit on `main` is built from the commit messages.',
    '',
    'To fix it without rewriting history, push one more commit that carries',
    'the trailer. An empty commit is enough:',
    '',
    '```bash',
    'git commit --allow-empty',
    '```',
    '',
    'with a commit message that ends with:',
    '',
    '```text',
    ...missing.map((id) => `Change: ${id}`),
    '```',
    '',
  ].join('\n')
}

function requireEnv(env, name) {
  const value = env[name]
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

// The API helpers below repeat the few lines in `protected-paths.mjs` and
// `test-integrity.mjs` on purpose: the checks stay independent files with no
// shared module.
async function getJson(env, path) {
  const apiUrl = env.GITHUB_API_URL || 'https://api.github.com'
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${requireEnv(env, 'GITHUB_TOKEN')}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'change-trailer-check',
    },
  })
  if (!response.ok) {
    throw new Error(`GitHub API ${path} failed with HTTP ${response.status}`)
  }
  return response.json()
}

async function listAll(env, path, expected, what) {
  const items = []
  for (let page = 1; items.length < expected; page += 1) {
    const batch = await getJson(
      env,
      `${path}?per_page=${PAGE_SIZE}&page=${page}`
    )
    if (!Array.isArray(batch)) {
      throw new Error(`GitHub API returned an unexpected ${what} list`)
    }
    items.push(...batch)
    if (batch.length < PAGE_SIZE) break
  }
  return items
}

export async function main(env = process.env) {
  const repository = requireEnv(env, 'GITHUB_REPOSITORY')
  const number = requireEnv(env, 'PR_NUMBER')
  const headSha = requireEnv(env, 'HEAD_SHA')
  if (!/^\d+$/.test(number)) throw new Error('PR_NUMBER is not a number')
  if (!/^[0-9a-f]{40}$/.test(headSha)) throw new Error('Invalid commit SHA')

  const pullPath = `/repos/${repository}/pulls/${number}`
  const pull = await getJson(env, pullPath)
  if (pull.head?.sha !== headSha) {
    throw new Error(
      `Pull request head is ${pull.head?.sha}, expected ${headSha}; ` +
        'the lists would not describe the commit under check'
    )
  }
  const expectedFiles = pull.changed_files
  if (!Number.isInteger(expectedFiles)) {
    throw new Error('GitHub API did not report changed_files')
  }
  const expectedCommits = pull.commits
  if (!Number.isInteger(expectedCommits)) {
    throw new Error('GitHub API did not report commits')
  }

  const files = await listAll(env, `${pullPath}/files`, expectedFiles, 'file')
  if (files.length < expectedFiles) {
    throw new Error(
      `Fetched ${files.length} of ${expectedFiles} changed files; ` +
        'refusing to pass an incomplete file list'
    )
  }

  const touched = collectTouchedChangeIds(files)
  if (touched.length === 0) {
    console.log('change-trailer: no OpenSpec change folder touched.')
    return 0
  }

  const commits = await listAll(
    env,
    `${pullPath}/commits`,
    expectedCommits,
    'commit'
  )
  if (commits.length < expectedCommits) {
    const limit =
      expectedCommits > COMMIT_LIST_LIMIT
        ? ` (GitHub lists at most ${COMMIT_LIST_LIMIT} commits per pull request)`
        : ''
    throw new Error(
      `Fetched ${commits.length} of ${expectedCommits} commits${limit}; ` +
        'refusing to pass an incomplete commit list'
    )
  }
  const messages = commits.map((commit) => {
    const message = commit?.commit?.message
    if (typeof message !== 'string') {
      throw new Error('GitHub API returned a commit without a message')
    }
    return message
  })
  if (!commits.some((commit) => commit.sha === headSha)) {
    throw new Error(
      `Commit list does not contain the head ${headSha}; ` +
        'it would not describe the commit under check'
    )
  }

  const trailers = collectTrailerIds(messages)
  const missing = findMissing(touched, trailers)

  console.log(`change-trailer: OpenSpec changes touched: ${touched.join(', ')}`)
  console.log(
    `change-trailer: Change trailers in ${commits.length} commit(s): ` +
      (trailers.join(', ') || 'none')
  )
  if (missing.length === 0) {
    console.log('change-trailer: every touched change is named by a commit.')
    return 0
  }

  console.log('change-trailer: no commit message carries a trailer for:')
  for (const id of missing) {
    console.log(`  ${id}  (add the line: Change: ${id})`)
  }
  console.log(
    'The line must be in a commit message, not in the pull request ' +
      'description. Push a commit that carries it; an empty one is enough ' +
      '(`git commit --allow-empty`).'
  )
  if (env.GITHUB_STEP_SUMMARY) {
    appendFileSync(env.GITHUB_STEP_SUMMARY, buildSummary(missing, trailers))
  }
  return 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await main()
  } catch (error) {
    console.error(`change-trailer: failing closed: ${error.message}`)
    process.exitCode = 2
  }
}
