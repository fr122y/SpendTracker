// commitlint rule `change-trailer`: every commit message carries exactly one
// line `Change: <id>`, where `<id>` is an existing OpenSpec change or `none`.
//
// - `<id>` exists when `openspec/changes/<id>/` or
//   `openspec/changes/archive/YYYY-MM-DD-<id>/` is a directory under the
//   repository root (the current working directory of commitlint).
// - `Change: none` is allowed only for the types in NONE_TYPES. A feat, fix,
//   refactor, or perf commit names the change it implements or fixes.
// - Merge, revert, `fixup!`, and `squash!` commits never reach this rule:
//   commitlint skips them through its default ignores.
// - The Pull Request title is linted by the same configuration but carries no
//   trailers; the workflow sets COMMITLINT_PR_TITLE=1 for that step only.
//
// See docs/engineering/change-request.md#trailers.

const fs = require('node:fs')
const path = require('node:path')

const RULE_NAME = 'change-trailer'
const NONE = 'none'
/** Commit types that may use `Change: none`. */
const NONE_TYPES = ['ci', 'build', 'chore', 'docs', 'test', 'style']

const CHANGE_LINE = /^Change:/
const CHANGE_TRAILER = /^Change: ([a-z0-9][a-z0-9-]*)$/
const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/
const CHANGES_DIR = path.join('openspec', 'changes')
const ARCHIVE = 'archive'

/** Returns every line of a commit message that starts with `Change:`. */
function changeLines(message) {
  if (typeof message !== 'string') return []
  return message
    .split(/\r?\n/)
    .filter((line) => !line.startsWith('#'))
    .map((line) => line.trimEnd())
    .filter((line) => CHANGE_LINE.test(line))
}

/** Lists the change ids known under `<root>/openspec/changes`, archive included. */
function knownChangeIds(root) {
  const ids = new Set()
  const dirs = (dir) => {
    try {
      return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    } catch {
      return []
    }
  }
  const changes = path.join(root, CHANGES_DIR)
  for (const name of dirs(changes)) {
    if (name !== ARCHIVE) ids.add(name)
  }
  for (const name of dirs(path.join(changes, ARCHIVE))) {
    const id = name.replace(DATE_PREFIX, '')
    if (id) ids.add(id)
  }
  return ids
}

/**
 * Validates one commit message. Returns `[true]` or `[false, reason]`.
 * `known` is the set of existing change ids.
 */
function validateChangeTrailer(message, type, known) {
  const lines = changeLines(message)
  const example = 'Change: <change-id>'
  if (lines.length === 0) {
    return [
      false,
      `the message must end with one trailer line \`${example}\` ` +
        `(an OpenSpec change under openspec/changes/) or \`Change: none\` ` +
        `(only for ${NONE_TYPES.join(', ')} commits); ` +
        'see docs/engineering/change-request.md#trailers',
    ]
  }
  if (lines.length > 1) {
    return [
      false,
      `the message has ${lines.length} \`Change:\` lines; keep exactly one`,
    ]
  }
  const match = lines[0].match(CHANGE_TRAILER)
  if (!match) {
    return [
      false,
      `\`${lines[0]}\` is not \`${example}\`: one space after the colon, ` +
        'then a kebab-case id or `none`',
    ]
  }
  const id = match[1]
  if (id === NONE) {
    if (NONE_TYPES.includes(type)) return [true]
    return [
      false,
      `\`Change: none\` is not allowed for a ${type || 'untyped'} commit; ` +
        `only ${NONE_TYPES.join(', ')} commits may use it. Name the change ` +
        'this commit implements or fixes',
    ]
  }
  if (!known.has(id)) {
    return [
      false,
      `\`Change: ${id}\` names no OpenSpec change: neither ` +
        `openspec/changes/${id}/ nor openspec/changes/archive/YYYY-MM-DD-${id}/ ` +
        'exists',
    ]
  }
  return [true]
}

function changeTrailerRule(parsed, when = 'always') {
  if (when === 'never') return [true]
  if (process.env.COMMITLINT_PR_TITLE === '1') return [true]
  return validateChangeTrailer(
    parsed.raw,
    parsed.type,
    knownChangeIds(process.cwd())
  )
}

module.exports = {
  NONE_TYPES,
  RULE_NAME,
  changeLines,
  knownChangeIds,
  validateChangeTrailer,
  plugin: { rules: { [RULE_NAME]: changeTrailerRule } },
}
