import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import {
  buildSummary,
  changeIdFromPath,
  collectTouchedChangeIds,
  collectTrailerIds,
  findMissing,
  main,
  parseChangeTrailers,
} from './change-trailer.mjs'

describe('changeIdFromPath', () => {
  const cases = [
    ['openspec/changes/add-foo/proposal.md', 'add-foo'],
    ['openspec/changes/add-foo/.openspec.yaml', 'add-foo'],
    ['openspec/changes/add-foo/specs/budget/spec.md', 'add-foo'],
    ['openspec/changes/archive/2026-10-13-add-foo/proposal.md', 'add-foo'],
    ['openspec/changes/archive/2026-10-13-add-foo/specs/x/spec.md', 'add-foo'],
    // An archive directory without a date prefix keeps its name.
    ['openspec/changes/archive/add-foo/tasks.md', 'add-foo'],
    // Only a leading date is removed.
    [
      'openspec/changes/archive/2026-10-13-fix-2026-01-01-report/tasks.md',
      'fix-2026-01-01-report',
    ],
    // A date-like name outside the archive is an id as written.
    ['openspec/changes/2026-10-13-add-foo/tasks.md', '2026-10-13-add-foo'],
    ['openspec/changes/archived/tasks.md', 'archived'],
  ]
  for (const [path, id] of cases) {
    it(`reads ${id} from ${path}`, () => {
      assert.equal(changeIdFromPath(path), id)
    })
  }

  const none = [
    'openspec/changes/README.md',
    'openspec/changes/archive/README.md',
    'openspec/changes/archive',
    'openspec/changes/archive/2026-10-13-add-foo',
    'openspec/changes/add-foo',
    'openspec/changes//proposal.md',
    'openspec/changes/archive//proposal.md',
    'openspec/changes/archive/2026-10-13-/proposal.md',
    'openspec/specs/budget/spec.md',
    'openspec/config.yaml',
    'docs/openspec/changes/add-foo/proposal.md',
    'src/openspec/changes/archive/2026-10-13-add-foo/tasks.md',
    'Openspec/changes/add-foo/proposal.md',
  ]
  for (const path of none) {
    it(`reads no change id from ${path}`, () => {
      assert.equal(changeIdFromPath(path), null)
    })
  }

  it('returns null for a missing path', () => {
    assert.equal(changeIdFromPath(undefined), null)
    assert.equal(changeIdFromPath(null), null)
  })
})

describe('collectTouchedChangeIds', () => {
  it('returns nothing when no change folder is touched', () => {
    assert.deepEqual(
      collectTouchedChangeIds([
        { filename: 'src/a.ts', status: 'modified' },
        { filename: 'openspec/specs/budget/spec.md', status: 'modified' },
      ]),
      []
    )
  })

  it('returns each id once, sorted', () => {
    assert.deepEqual(
      collectTouchedChangeIds([
        { filename: 'openspec/changes/b-change/tasks.md', status: 'added' },
        { filename: 'openspec/changes/a-change/tasks.md', status: 'modified' },
        { filename: 'openspec/changes/b-change/proposal.md', status: 'added' },
      ]),
      ['a-change', 'b-change']
    )
  })

  it('gives one id for a change renamed into the archive', () => {
    assert.deepEqual(
      collectTouchedChangeIds([
        {
          filename: 'openspec/changes/archive/2026-10-13-add-foo/tasks.md',
          previous_filename: 'openspec/changes/add-foo/tasks.md',
          status: 'renamed',
        },
      ]),
      ['add-foo']
    )
  })

  it('reads the previous name of a file moved out of a change', () => {
    assert.deepEqual(
      collectTouchedChangeIds([
        {
          filename: 'docs/notes.md',
          previous_filename: 'openspec/changes/add-foo/notes.md',
          status: 'renamed',
        },
      ]),
      ['add-foo']
    )
  })

  it('reads both names when a change folder is renamed', () => {
    assert.deepEqual(
      collectTouchedChangeIds([
        {
          filename: 'openspec/changes/new-name/tasks.md',
          previous_filename: 'openspec/changes/old-name/tasks.md',
          status: 'renamed',
        },
      ]),
      ['new-name', 'old-name']
    )
  })

  it('counts a removed change file', () => {
    assert.deepEqual(
      collectTouchedChangeIds([
        { filename: 'openspec/changes/add-foo/tasks.md', status: 'removed' },
      ]),
      ['add-foo']
    )
  })
})

describe('parseChangeTrailers', () => {
  it('reads a trailer from the final block', () => {
    const message = [
      'ci(ci): add a check',
      '',
      'Why the check exists.',
      '',
      'Change: add-foo',
      'Refs: T-027',
      'Co-Authored-By: Someone <someone@example.com>',
    ].join('\n')
    assert.deepEqual(parseChangeTrailers(message), ['add-foo'])
  })

  it('reads several trailers', () => {
    assert.deepEqual(
      parseChangeTrailers('docs(repo): archive\n\nChange: a\nChange: b\n'),
      ['a', 'b']
    )
  })

  it('accepts CRLF line endings', () => {
    assert.deepEqual(
      parseChangeTrailers('fix(ui): x\r\n\r\nChange: add-foo\r\nRefs: T-1\r\n'),
      ['add-foo']
    )
  })

  it('accepts trailing spaces and any spacing after the colon', () => {
    assert.deepEqual(parseChangeTrailers('t\n\nChange: add-foo   '), [
      'add-foo',
    ])
    assert.deepEqual(parseChangeTrailers('t\n\nChange:add-foo'), ['add-foo'])
    assert.deepEqual(parseChangeTrailers('t\n\nChange:\tadd-foo\t'), [
      'add-foo',
    ])
  })

  it('reads a trailer in the middle of a squash-style body', () => {
    const message = [
      'ci(ci): add a check (#54)',
      '',
      '* ci(ci): add a check',
      '',
      'Body of the first commit.',
      '',
      'Change: add-foo',
      '',
      '* docs(repo): follow-up',
      '',
      'Co-authored-by: Someone <someone@example.com>',
    ].join('\n')
    assert.deepEqual(parseChangeTrailers(message), ['add-foo'])
  })

  it('treats the key as case-sensitive', () => {
    assert.deepEqual(parseChangeTrailers('t\n\nchange: add-foo'), [])
    assert.deepEqual(parseChangeTrailers('t\n\nCHANGE: add-foo'), [])
  })

  it('ignores lines that are not a whole trailer', () => {
    const rejected = [
      ' Change: add-foo',
      '* Change: add-foo',
      'OpenSpec-Change: add-foo',
      'Change: add-foo and more',
      'Change:',
      'Change:   ',
      'Change add-foo',
      'Changes: add-foo',
      'See Change: add-foo',
    ]
    for (const line of rejected) {
      assert.deepEqual(parseChangeTrailers(`t\n\n${line}`), [], line)
    }
  })

  it('keeps the id exactly as written', () => {
    assert.deepEqual(parseChangeTrailers('t\n\nChange: Add-Foo'), ['Add-Foo'])
  })

  it('returns nothing for a missing message', () => {
    assert.deepEqual(parseChangeTrailers(undefined), [])
    assert.deepEqual(parseChangeTrailers(''), [])
  })
})

describe('collectTrailerIds', () => {
  it('merges the trailers of all commits, sorted, without duplicates', () => {
    assert.deepEqual(
      collectTrailerIds([
        'a\n\nChange: b-change',
        'b\n\nno trailer',
        'c\n\nChange: a-change\nChange: b-change',
      ]),
      ['a-change', 'b-change']
    )
  })
})

describe('findMissing', () => {
  it('passes when every touched id has a trailer', () => {
    assert.deepEqual(findMissing(['a', 'b'], ['a', 'b']), [])
  })

  it('allows trailers for changes the pull request does not touch', () => {
    assert.deepEqual(findMissing(['a'], ['a', 'older-change']), [])
    assert.deepEqual(findMissing([], ['older-change']), [])
  })

  it('reports each touched id without a trailer', () => {
    assert.deepEqual(findMissing(['a', 'b', 'c'], ['b']), ['a', 'c'])
  })

  it('compares ids exactly', () => {
    assert.deepEqual(findMissing(['add-foo'], ['Add-Foo']), ['add-foo'])
    assert.deepEqual(findMissing(['add-foo'], ['add-foo-2']), ['add-foo'])
    assert.deepEqual(findMissing(['add-foo'], ['2026-10-13-add-foo']), [
      'add-foo',
    ])
  })
})

describe('buildSummary', () => {
  it('names each change, the line to add, and where it belongs', () => {
    const summary = buildSummary(['add-foo', 'add-bar'], ['other'])
    assert.match(summary, /\| `add-foo` \| `Change: add-foo` \|/)
    assert.match(summary, /\| `add-bar` \| `Change: add-bar` \|/)
    assert.match(
      summary,
      /found in this pull request's commits: `Change: other`/
    )
    assert.match(summary, /pull request description does not count/)
    assert.match(summary, /git commit --allow-empty/)
    assert.match(summary, /^Change: add-foo$/m)
    assert.match(summary, /^Change: add-bar$/m)
  })

  it('says when no trailer was found at all', () => {
    assert.match(buildSummary(['add-foo'], []), /commits: none\./)
  })
})

describe('main', () => {
  const HEAD = 'b'.repeat(40)
  const env = {
    GITHUB_REPOSITORY: 'owner/repo',
    GITHUB_TOKEN: 'token',
    GITHUB_API_URL: 'https://api.invalid',
    PR_NUMBER: '7',
    HEAD_SHA: HEAD,
  }
  const CHANGE_FILE = {
    filename: 'openspec/changes/add-foo/proposal.md',
    status: 'added',
  }
  const realFetch = globalThis.fetch
  const realLog = console.log
  afterEach(() => {
    globalThis.fetch = realFetch
    console.log = realLog
  })

  /**
   * Stubs `fetch` with a pull request made of `files` and commit `messages`.
   * The last commit is the head unless `commitShas` says otherwise.
   */
  function stub({
    files,
    messages = [],
    changedFiles,
    commitCount,
    commitShas,
    headSha = HEAD,
  }) {
    const requested = []
    const lines = []
    console.log = (line) => lines.push(line)
    const commits = messages.map((message, index) => ({
      sha:
        commitShas?.[index] ??
        (index === messages.length - 1
          ? HEAD
          : String(index).padStart(40, '0')),
      commit: { message },
    }))
    const page = (items, path) => {
      const number = Number(
        new URL(`https://x${path}`).searchParams.get('page')
      )
      return items.slice((number - 1) * 100, number * 100)
    }
    globalThis.fetch = async (url) => {
      const path = url.replace(env.GITHUB_API_URL, '')
      requested.push(path)
      const json = (value) => new Response(JSON.stringify(value))
      if (path === '/repos/owner/repo/pulls/7') {
        return json({
          head: { sha: headSha },
          changed_files: changedFiles ?? files.length,
          commits: commitCount ?? commits.length,
        })
      }
      if (path.startsWith('/repos/owner/repo/pulls/7/files?')) {
        return json(page(files, path))
      }
      if (path.startsWith('/repos/owner/repo/pulls/7/commits?')) {
        return json(page(commits, path))
      }
      return new Response('missing', { status: 404 })
    }
    return { requested, lines }
  }

  it('passes a pull request that touches no change folder with one line', async () => {
    const { requested, lines } = stub({
      files: [{ filename: 'src/a.ts', status: 'modified' }],
      messages: ['fix(ui): x'],
    })
    assert.equal(await main(env), 0)
    assert.deepEqual(lines, [
      'change-trailer: no OpenSpec change folder touched.',
    ])
    assert.equal(
      requested.some((path) => path.includes('/commits')),
      false
    )
  })

  it('passes when a commit names the touched change', async () => {
    const { lines } = stub({
      files: [CHANGE_FILE],
      messages: ['ci(ci): x', 'ci(ci): y\n\nChange: add-foo\nRefs: T-1'],
    })
    assert.equal(await main(env), 0)
    assert.match(lines.join('\n'), /changes touched: add-foo/)
    assert.match(lines.join('\n'), /in 2 commit\(s\): add-foo/)
  })

  it('passes with an extra trailer for an untouched change', async () => {
    stub({
      files: [CHANGE_FILE],
      messages: ['ci(ci): x\n\nChange: add-foo\nChange: older-change'],
    })
    assert.equal(await main(env), 0)
  })

  it('fails and names the line to add when a trailer is missing', async () => {
    const { lines } = stub({
      files: [
        CHANGE_FILE,
        {
          filename: 'openspec/changes/archive/2026-10-13-add-bar/tasks.md',
          previous_filename: 'openspec/changes/add-bar/tasks.md',
          status: 'renamed',
        },
      ],
      messages: ['ci(ci): x\n\nChange: add-foo'],
    })
    assert.equal(await main(env), 1)
    const output = lines.join('\n')
    assert.match(output, /add-bar {2}\(add the line: Change: add-bar\)/)
    assert.doesNotMatch(output, /add the line: Change: add-foo/)
    assert.match(output, /not in the pull request description/)
    assert.match(output, /git commit --allow-empty/)
  })

  it('does not accept a lower-case key', async () => {
    stub({ files: [CHANGE_FILE], messages: ['ci(ci): x\n\nchange: add-foo'] })
    assert.equal(await main(env), 1)
  })

  it('reads every page of files and commits', async () => {
    const files = Array.from({ length: 150 }, (_, index) => ({
      filename: `src/file-${index}.ts`,
      status: 'modified',
    }))
    files.push(CHANGE_FILE)
    const messages = Array.from({ length: 149 }, () => 'fix(ui): x')
    messages.push('fix(ui): y\n\nChange: add-foo')
    const { requested } = stub({ files, messages })
    assert.equal(await main(env), 0)
    assert.equal(requested.filter((p) => p.includes('/files?')).length, 2)
    assert.equal(requested.filter((p) => p.includes('/commits?')).length, 2)
  })

  it('fails closed when the head moved', async () => {
    stub({ files: [CHANGE_FILE], messages: ['x'], headSha: 'd'.repeat(40) })
    await assert.rejects(main(env), /Pull request head is d+, expected b+/)
  })

  it('fails closed on an incomplete file list', async () => {
    stub({ files: [CHANGE_FILE], messages: ['x'], changedFiles: 2 })
    await assert.rejects(main(env), /Fetched 1 of 2 changed files/)
  })

  it('fails closed on an incomplete commit list', async () => {
    stub({ files: [CHANGE_FILE], messages: ['x'], commitCount: 2 })
    await assert.rejects(main(env), /Fetched 1 of 2 commits; refusing/)
  })

  it('fails closed above the 250 commit limit of the API', async () => {
    const messages = Array.from({ length: 250 }, () => 'x\n\nChange: add-foo')
    stub({ files: [CHANGE_FILE], messages, commitCount: 251 })
    await assert.rejects(
      main(env),
      /Fetched 250 of 251 commits \(GitHub lists at most 250 commits/
    )
  })

  it('fails closed when the commit list lacks the head commit', async () => {
    stub({
      files: [CHANGE_FILE],
      messages: ['x\n\nChange: add-foo'],
      commitShas: ['c'.repeat(40)],
    })
    await assert.rejects(main(env), /does not contain the head b+/)
  })

  it('fails closed on missing counts or a commit without a message', async () => {
    stub({ files: [CHANGE_FILE], messages: ['x'] })
    const stubbed = globalThis.fetch
    globalThis.fetch = async (url) => {
      const response = await stubbed(url)
      if (!url.endsWith('/pulls/7')) return response
      const { head, changed_files } = await response.json()
      return new Response(JSON.stringify({ head, changed_files }))
    }
    await assert.rejects(main(env), /did not report commits/)

    globalThis.fetch = async (url) => {
      if (url.includes('/commits?')) {
        return new Response(JSON.stringify([{ sha: HEAD, commit: {} }]))
      }
      return stubbed(url)
    }
    await assert.rejects(main(env), /commit without a message/)
  })

  it('fails closed on an API error and on bad input', async () => {
    globalThis.fetch = async () => new Response('nope', { status: 500 })
    await assert.rejects(main(env), /failed with HTTP 500/)
    await assert.rejects(
      main({ ...env, HEAD_SHA: 'short' }),
      /Invalid commit SHA/
    )
    await assert.rejects(main({ ...env, PR_NUMBER: '7; x' }), /not a number/)
    await assert.rejects(
      main({ ...env, GITHUB_TOKEN: '' }),
      /Missing required environment variable GITHUB_TOKEN/
    )
  })
})
