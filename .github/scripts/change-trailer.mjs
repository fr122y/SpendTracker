// Fails a pull request when
//
// 1. it touches an OpenSpec change folder and none of its commit messages
//    carries the trailer `Change: <change-id>` for that change (`Change: none`
//    never satisfies this), or
// 2. a commit message names a `Change: <id>` that does not exist: neither in
//    the base checkout (`openspec/changes/<id>/` or
//    `openspec/changes/archive/YYYY-MM-DD-<id>/`) nor among the change folders
//    the pull request itself touches. Merge, revert, `fixup!`, `squash!`, and
//    `amend!` commits are skipped, as commitlint skips them.
//
// That every commit carries exactly one `Change:` line is checked per commit
// by commitlint (`scripts/commitlint/change-trailer-rule.cjs`), not here.
//
// Runs on `pull_request_target`, so this script always comes from the base
// branch. It reads the pull request only through the REST API and never checks
// out or executes code from the pull request head.
//
// Known limits. Only changes whose folders the pull request touches are
// required; a commit that names the wrong existing change is not detected. `Refs: <task-id>` is not checked at all: the task register
// lives outside this repository. A `Change:` line counts wherever it stands in
// a commit message, not only in the final trailer block.

import { appendFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PAGE_SIZE = 100
/** GitHub lists at most this many commits for one pull request. */
export const COMMIT_LIST_LIMIT = 250

const CHANGES_ROOT = 'openspec/changes/'
const ARCHIVE_DIRECTORY = 'archive'
const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/
// The key is case-sensitive and starts the line; the id is one token.
const CHANGE_TRAILER = /^Change:\s*(\S+)\s*$/
/** `Change: none` marks a commit that belongs to no change. */
export const NO_CHANGE = 'none'
// The commits commitlint skips by default and this check skips too.
const IGNORED_MESSAGE = /^(?:Merge |Revert |(?:fixup|squash|amend)! )/

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

/**
 * Lists the change ids that exist under `<root>/openspec/changes/`: active
 * folders and archived ones without their `YYYY-MM-DD-` prefix. A missing
 * folder gives an empty set.
 */
export function knownChangeIds(root) {
  const directories = (path) => {
    try {
      return readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    } catch (error) {
      if (error.code === 'ENOENT') return []
      throw error
    }
  }
  const changes = join(root, CHANGES_ROOT)
  const ids = new Set()
  for (const name of directories(changes)) {
    if (name !== ARCHIVE_DIRECTORY) ids.add(name)
  }
  for (const name of directories(join(changes, ARCHIVE_DIRECTORY))) {
    const id = name.replace(DATE_PREFIX, '')
    if (id) ids.add(id)
  }
  return ids
}

/** True for merge, revert, `fixup!`, `squash!`, and `amend!` commits. */
export function isIgnoredCommit(commit) {
  if (Array.isArray(commit?.parents) && commit.parents.length > 1) return true
  return IGNORED_MESSAGE.test(commit?.commit?.message ?? '')
}

/**
 * Returns the `Change:` ids of the commits that name no known change, other
 * than `none`. Sorted, no duplicates. Ignored commits are skipped.
 */
export function findUnknown(commits, knownIds) {
  const unknown = new Set()
  for (const commit of commits) {
    if (isIgnoredCommit(commit)) continue
    for (const id of parseChangeTrailers(commit.commit.message)) {
      if (id !== NO_CHANGE && !knownIds.has(id)) unknown.add(id)
    }
  }
  return [...unknown].sort()
}

/** Builds the Markdown shown on an unknown change id. */
export function buildUnknownSummary(unknown) {
  return [
    '## Change trailer: commits name OpenSpec changes that do not exist',
    '',
    'Each id must be an existing change: `openspec/changes/<id>/` on the base',
    'branch or in this pull request, or',
    '`openspec/changes/archive/YYYY-MM-DD-<id>/`. Use `Change: none` only for',
    'ci, build, chore, docs, test, and style commits.',
    '',
    ...unknown.map((id) => `- \`Change: ${id}\``),
    '',
    'Push a commit with the corrected trailer; do not rewrite pushed history.',
    '',
  ].join('\n')
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

  const known = knownChangeIds(env.REPO_ROOT || process.cwd())
  for (const id of touched) known.add(id)
  const unknown = findUnknown(commits, known)
  const trailers = collectTrailerIds(messages).filter((id) => id !== NO_CHANGE)
  const missing = findMissing(touched, trailers)

  console.log(
    'change-trailer: OpenSpec changes touched: ' +
      (touched.join(', ') || 'none')
  )
  console.log(
    `change-trailer: Change trailers in ${commits.length} commit(s): ` +
      (trailers.join(', ') || 'none')
  )
  if (unknown.length > 0) {
    console.log('change-trailer: commits name changes that do not exist:')
    for (const id of unknown) console.log(`  Change: ${id}`)
    if (env.GITHUB_STEP_SUMMARY) {
      appendFileSync(env.GITHUB_STEP_SUMMARY, buildUnknownSummary(unknown))
    }
  }
  if (missing.length === 0) {
    if (unknown.length > 0) return 1
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
