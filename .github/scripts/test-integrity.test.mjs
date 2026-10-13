import assert from 'node:assert/strict'
import { afterEach, describe, it } from 'node:test'

import {
  buildSummary,
  classifyFiles,
  countMarkers,
  countTestCases,
  evaluate,
  isTestFile,
  main,
} from './test-integrity.mjs'

describe('isTestFile', () => {
  const testFiles = [
    'src/x/__tests__/helper.ts',
    'src/x/__tests__/nested/fixture.json',
    '__tests__/root.ts',
    'src/features/budget/__tests__/budget.test.tsx',
    'src/shared/lib/format.test.ts',
    'format.test.ts',
    'src/widgets/chart/chart.test.tsx',
    'e2e/foo.spec.ts',
    'e2e/flows/pockets.spec.ts',
  ]
  for (const path of testFiles) {
    it(`treats ${path} as a test file`, () => {
      assert.equal(isTestFile(path), true)
    })
  }

  const otherFiles = [
    'src/foo.spec.ts',
    'docs/test.md',
    'src/test/setup.ts',
    'src/shared/lib/format.ts',
    'src/shared/lib/format.test.js',
    'src/shared/lib/format.test.ts.bak',
    'src/x/__tests__',
    'src/x/my__tests__/helper.ts',
    'e2e/foo.spec.tsx',
    'e2e/helpers.ts',
    'docs/e2e/foo.spec.ts',
    'jest.config.mjs',
  ]
  for (const path of otherFiles) {
    it(`does not treat ${path} as a test file`, () => {
      assert.equal(isTestFile(path), false)
    })
  }

  it('returns false for a missing path', () => {
    assert.equal(isTestFile(undefined), false)
    assert.equal(isTestFile(null), false)
  })
})

describe('countMarkers', () => {
  const single = [
    "it.skip('a', () => {})",
    "test.skip('a', () => {})",
    "describe.skip('a', () => {})",
    "test.describe.skip('a', () => {})",
    'test.skip(isMobile, "reason")',
    "it.only('a', () => {})",
    "describe.only('a', () => {})",
    "it.todo('a')",
    "test.todo('a')",
    "it.failing('a', () => {})",
    "test.failing('a', () => {})",
    "xit('a', () => {})",
    "xtest('a', () => {})",
    "xdescribe('a', () => {})",
    "fit('a', () => {})",
    "fdescribe('a', () => {})",
    "it.skip ('a', () => {})",
    "  xit ('a', () => {})",
    "it.skip(\n  'a',\n  () => {}\n)",
  ]
  for (const source of single) {
    it(`counts one marker in ${JSON.stringify(source)}`, () => {
      assert.equal(countMarkers(source), 1)
    })
  }

  const none = [
    "it('a', () => {})",
    "test('a', () => {})",
    "describe('a', () => {})",
    'process.exit(1)',
    'exit(1)',
    'benefit(user)',
    'outfit(user)',
    'refit(model)',
    'chart.fit(bounds)',
    'my_xit(1)',
    '$fit(1)',
    'const skip = true',
    'skip(3)',
    'only(3)',
    'const fit = 1',
    'xdescribed(1)',
  ]
  for (const source of none) {
    it(`counts no marker in ${JSON.stringify(source)}`, () => {
      assert.equal(countMarkers(source), 0)
    })
  }

  it('sums every marker in a file', () => {
    const source = [
      "describe.only('suite', () => {",
      "  it.skip('a', () => {})",
      "  xit('b', () => {})",
      "  it.todo('c')",
      "  fit('d', () => {})",
      "  it('e', () => {})",
      '})',
    ].join('\n')
    assert.equal(countMarkers(source), 5)
  })

  it('counts a marker inside a comment or a string (documented limit)', () => {
    assert.equal(countMarkers("// it.skip('a', () => {})"), 1)
    assert.equal(countMarkers("const s = 'use it.only( to focus'"), 1)
  })
})

describe('countTestCases', () => {
  const single = [
    "it('a', () => {})",
    "test('a', () => {})",
    "  it ('a', () => {})",
    "it(\n  'a',\n  () => {}\n)",
    "it.concurrent('a', async () => {})",
    "test.concurrent('a', async () => {})",
    "it.each([1, 2, 3])('n %i', (n) => {})",
    "test.each([[1, 2], [3, 4]])('%i %i', (a, b) => {})",
    "it.each<[string, number]>([['a', 1]])('%s', () => {})",
    "it.each`\n a | b\n ${1} | ${2}\n`('$a $b', () => {})",
    "it.concurrent.each([1, 2])('n %i', async (n) => {})",
    ";it('a', () => {})",
    "{it('a', () => {})}",
  ]
  for (const source of single) {
    it(`counts one test case in ${JSON.stringify(source)}`, () => {
      assert.equal(countTestCases(source), 1)
    })
  }

  const none = [
    "describe('a', () => {})",
    'submit(form)',
    'wait(100)',
    'await(1)',
    'emit(event)',
    'exit(1)',
    'latest(1)',
    'contest(1)',
    '/abc/.test(value)',
    'pattern.test(value)',
    'user.it(1)',
    "it.skip('a', () => {})",
    "it.only('a', () => {})",
    "it.todo('a')",
    "it.failing('a', () => {})",
    "test.skip('a', () => {})",
    "xit('a', () => {})",
    "xtest('a', () => {})",
    "fit('a', () => {})",
    "test.describe('a', () => {})",
    'test.beforeEach(async () => {})',
    "test.step('a', async () => {})",
    'const it = 1',
    'it.eachOther(1)',
    '$it(1)',
    'my_test(1)',
  ]
  for (const source of none) {
    it(`counts no test case in ${JSON.stringify(source)}`, () => {
      assert.equal(countTestCases(source), 0)
    })
  }

  it('sums the test cases of a file and ignores the marker forms', () => {
    const source = [
      "describe('suite', () => {",
      "  it('a', () => { submit(form); wait(1) })",
      "  test('b', () => { expect(/x/.test('x')).toBe(true) })",
      "  it.each([1, 2])('c %i', () => {})",
      "  it.skip('d', () => {})",
      "  xit('e', () => {})",
      '})',
    ].join('\n')
    assert.equal(countTestCases(source), 3)
    assert.equal(countMarkers(source), 2)
  })

  it('counts a test call inside a comment (documented limit)', () => {
    assert.equal(countTestCases("// it('a', () => {})"), 1)
  })
})

describe('classifyFiles', () => {
  it('reports a removed test file as deleted', () => {
    const result = classifyFiles([
      { filename: 'src/a/__tests__/a.test.ts', status: 'removed' },
      { filename: 'e2e/a.spec.ts', status: 'removed' },
    ])
    assert.deepEqual(result, {
      deleted: [
        { path: 'src/a/__tests__/a.test.ts', detail: null },
        { path: 'e2e/a.spec.ts', detail: null },
      ],
      compared: [],
    })
  })

  it('ignores files that are not test files, whatever their status', () => {
    const result = classifyFiles([
      { filename: 'src/a/a.ts', status: 'removed' },
      { filename: 'src/a/b.ts', status: 'modified' },
      { filename: 'src/a/c.ts', status: 'added' },
      { filename: 'docs/test.md', status: 'modified' },
      { filename: 'src/foo.spec.ts', status: 'removed' },
      {
        filename: 'src/a/e.ts',
        previous_filename: 'src/a/d.ts',
        status: 'renamed',
      },
    ])
    assert.deepEqual(result, { deleted: [], compared: [] })
  })

  it('compares a modified test file with itself at the base', () => {
    const result = classifyFiles([
      { filename: 'src/a/a.test.ts', status: 'modified' },
      { filename: 'src/a/b.test.ts', status: 'changed' },
    ])
    assert.deepEqual(result.compared, [
      { path: 'src/a/a.test.ts', basePath: 'src/a/a.test.ts' },
      { path: 'src/a/b.test.ts', basePath: 'src/a/b.test.ts' },
    ])
  })

  it('treats an added or copied test file as new', () => {
    const result = classifyFiles([
      { filename: 'src/a/new.test.ts', status: 'added' },
      {
        filename: 'src/a/copy.test.ts',
        previous_filename: 'src/a/a.test.ts',
        status: 'copied',
      },
    ])
    assert.deepEqual(result.compared, [
      { path: 'src/a/new.test.ts', basePath: null },
      { path: 'src/a/copy.test.ts', basePath: null },
    ])
  })

  it('treats a rename between test paths as a comparison, not a deletion', () => {
    const result = classifyFiles([
      {
        filename: 'src/b/__tests__/a.test.ts',
        previous_filename: 'src/a/__tests__/a.test.ts',
        status: 'renamed',
      },
    ])
    assert.deepEqual(result, {
      deleted: [],
      compared: [
        {
          path: 'src/b/__tests__/a.test.ts',
          basePath: 'src/a/__tests__/a.test.ts',
        },
      ],
    })
  })

  it('treats a rename out of the test patterns as a deletion', () => {
    const result = classifyFiles([
      {
        filename: 'src/a/a.test.ts.disabled',
        previous_filename: 'src/a/a.test.ts',
        status: 'renamed',
      },
    ])
    assert.deepEqual(result, {
      deleted: [
        {
          path: 'src/a/a.test.ts',
          detail:
            'renamed to src/a/a.test.ts.disabled, which is not a test file',
        },
      ],
      compared: [],
    })
  })

  it('treats a rename into the test patterns as a new test file', () => {
    const result = classifyFiles([
      {
        filename: 'src/a/__tests__/helper.ts',
        previous_filename: 'src/a/helper.ts',
        status: 'renamed',
      },
    ])
    assert.deepEqual(result, {
      deleted: [],
      compared: [{ path: 'src/a/__tests__/helper.ts', basePath: null }],
    })
  })

  it('skips unchanged entries and rejects an unknown status', () => {
    assert.deepEqual(
      classifyFiles([{ filename: 'src/a/a.test.ts', status: 'unchanged' }]),
      { deleted: [], compared: [] }
    )
    assert.throws(
      () => classifyFiles([{ filename: 'src/a/a.test.ts', status: 'odd' }]),
      /Unknown file status "odd"/
    )
  })
})

describe('evaluate', () => {
  const tests = (count, extra = '') =>
    Array.from({ length: count }, (_, i) => `it('case ${i}', () => {})`).join(
      '\n'
    ) + `\n${extra}`
  const entry = (path, baseText, headText, basePath = path) => ({
    path,
    basePath: baseText === null ? null : basePath,
    baseText,
    headText,
  })

  it('passes when nothing is deleted and nothing changes', () => {
    const result = evaluate([], [])
    assert.deepEqual(result, { violations: [], totals: { base: 0, head: 0 } })
  })

  it('reports a deleted test file', () => {
    const { violations } = evaluate(
      [{ path: 'e2e/a.spec.ts', detail: null }],
      []
    )
    assert.deepEqual(violations, [
      { path: 'e2e/a.spec.ts', rule: 'deleted', detail: 'deleted' },
    ])
  })

  it('passes a modified test file with the same counts', () => {
    const base = tests(3, 'expect(a).toBe(1)')
    const head = tests(3, 'expect(a).toBe(2)')
    const { violations } = evaluate([], [entry('a.test.ts', base, head)])
    assert.deepEqual(violations, [])
  })

  it('passes a modified test file that gains test cases', () => {
    const { violations, totals } = evaluate(
      [],
      [entry('a.test.ts', tests(3), tests(5))]
    )
    assert.deepEqual(violations, [])
    assert.deepEqual(totals, { base: 3, head: 5 })
  })

  it('reports an added marker with both counts', () => {
    const head = "it('a', () => {})\nit.skip('b', () => {})\n"
    const { violations } = evaluate([], [entry('a.test.ts', tests(2), head)])
    assert.deepEqual(violations, [
      { path: 'a.test.ts', rule: 'markers', detail: 'markers 0 -> 1' },
      { path: 'a.test.ts', rule: 'test cases', detail: 'test cases 2 -> 1' },
    ])
  })

  it('passes existing markers that stay in a changed file', () => {
    const base =
      "test('a', async () => {\n  test.skip(isMobile, 'x')\n})\n" +
      "test('b', async () => {\n  test.skip(isMobile, 'y')\n})\n"
    const head = base.replace("'x'", "'changed reason'") + "test('c', () => {})"
    const { violations } = evaluate(
      [],
      [entry('e2e/pockets.spec.ts', base, head)]
    )
    assert.deepEqual(violations, [])
  })

  it('passes when a marker is removed or replaced one for one', () => {
    const base = "it.skip('a', () => {})\nit.only('b', () => {})\n"
    assert.deepEqual(
      evaluate([], [entry('a.test.ts', base, "it.skip('a', () => {})\n")])
        .violations,
      []
    )
    assert.deepEqual(
      evaluate(
        [],
        [
          entry(
            'a.test.ts',
            base,
            "it.skip('a', () => {})\nxit('b', () => {})\n"
          ),
        ]
      ).violations,
      []
    )
  })

  it('reports a new test file that carries a marker', () => {
    const head = "it('a', () => {})\nit.only('b', () => {})\n"
    const { violations, totals } = evaluate(
      [],
      [entry('new.test.ts', null, head)]
    )
    assert.deepEqual(violations, [
      { path: 'new.test.ts', rule: 'markers', detail: 'markers 0 -> 1' },
    ])
    assert.deepEqual(totals, { base: 0, head: 0 })
  })

  it('passes a new test file without markers', () => {
    const { violations } = evaluate([], [entry('new.test.ts', null, tests(4))])
    assert.deepEqual(violations, [])
  })

  it('reports per-file decreases when the total drops', () => {
    const { violations, totals } = evaluate(
      [],
      [
        entry('a.test.ts', tests(12), tests(9)),
        entry('b.test.ts', tests(4), tests(5)),
        entry('c.test.ts', tests(2), tests(1)),
      ]
    )
    assert.deepEqual(violations, [
      { path: 'a.test.ts', rule: 'test cases', detail: 'test cases 12 -> 9' },
      { path: 'c.test.ts', rule: 'test cases', detail: 'test cases 2 -> 1' },
    ])
    assert.deepEqual(totals, { base: 18, head: 15 })
  })

  it('passes test cases moved between existing test files', () => {
    const { violations } = evaluate(
      [],
      [
        entry('a.test.ts', tests(12), tests(9)),
        entry('b.test.ts', tests(4), tests(7)),
      ]
    )
    assert.deepEqual(violations, [])
  })

  it('does not let a new test file offset a decrease', () => {
    const { violations, totals } = evaluate(
      [],
      [
        entry('a.test.ts', tests(12), tests(9)),
        entry('new.test.ts', null, tests(20)),
      ]
    )
    assert.deepEqual(violations, [
      { path: 'a.test.ts', rule: 'test cases', detail: 'test cases 12 -> 9' },
    ])
    assert.deepEqual(totals, { base: 12, head: 9 })
  })

  it('compares a renamed file with its previous name', () => {
    const renamed = entry('b/a.test.ts', tests(5), tests(5), 'a/a.test.ts')
    assert.deepEqual(evaluate([], [renamed]).violations, [])

    const shrunk = entry('b/a.test.ts', tests(5), tests(3), 'a/a.test.ts')
    assert.deepEqual(evaluate([], [shrunk]).violations, [
      {
        path: 'b/a.test.ts',
        rule: 'test cases',
        detail: 'test cases 5 -> 3 (renamed from a/a.test.ts)',
      },
    ])

    const skipped = entry(
      'b/a.test.ts',
      tests(1),
      tests(1, "it.skip('x', () => {})"),
      'a/a.test.ts'
    )
    assert.deepEqual(evaluate([], [skipped]).violations, [
      { path: 'b/a.test.ts', rule: 'markers', detail: 'markers 0 -> 1' },
    ])
  })

  it('catches a test converted to skip under the marker rule', () => {
    const base = "it('a', () => {})\nit('b', () => {})\n"
    const head =
      "it('a', () => {})\nit.skip('b', () => {})\nit('c', () => {})\n"
    const { violations } = evaluate([], [entry('a.test.ts', base, head)])
    assert.deepEqual(violations, [
      { path: 'a.test.ts', rule: 'markers', detail: 'markers 0 -> 1' },
    ])
  })
})

describe('buildSummary', () => {
  it('lists every violation and explains what to do', () => {
    const summary = buildSummary(
      [
        { path: 'e2e/a.spec.ts', rule: 'deleted', detail: 'deleted' },
        { path: 'a.test.ts', rule: 'markers', detail: 'markers 0 -> 1' },
        { path: 'b.test.ts', rule: 'test cases', detail: 'test cases 12 -> 9' },
      ],
      { base: 12, head: 9 }
    )
    assert.match(summary, /weakens existing tests/)
    assert.match(summary, /`e2e\/a\.spec\.ts` \| deleted/)
    assert.match(summary, /`a\.test\.ts` \| markers 0 -> 1/)
    assert.match(summary, /`b\.test\.ts` \| test cases 12 -> 9/)
    assert.match(summary, /changed existing test files: 12 -> 9/)
    assert.match(summary, /intentional friction/)
    assert.match(summary, /Restore the tests, or ask the/)
    assert.match(summary, /only the repository owner/)
    assert.match(summary, /`Protect main`/)
    assert.match(summary, /`verify`\s+is green/)
  })

  it('omits the total line when the total did not drop', () => {
    const summary = buildSummary(
      [{ path: 'a.test.ts', rule: 'markers', detail: 'markers 0 -> 1' }],
      { base: 3, head: 3 }
    )
    assert.doesNotMatch(summary, /changed existing test files/)
  })
})

describe('main', () => {
  const BASE = 'a'.repeat(40)
  const HEAD = 'b'.repeat(40)
  const MERGE_BASE = 'c'.repeat(40)
  const env = {
    GITHUB_REPOSITORY: 'owner/repo',
    GITHUB_TOKEN: 'token',
    GITHUB_API_URL: 'https://api.invalid',
    PR_NUMBER: '7',
    BASE_SHA: BASE,
    HEAD_SHA: HEAD,
  }
  const realFetch = globalThis.fetch
  const realLog = console.log
  afterEach(() => {
    globalThis.fetch = realFetch
    console.log = realLog
  })

  /** Stubs `fetch` with a pull request made of `files` and file `contents`. */
  function stub({ files, contents = {}, changedFiles, headSha = HEAD }) {
    const requested = []
    const lines = []
    console.log = (line) => lines.push(line)
    globalThis.fetch = async (url) => {
      const path = decodeURIComponent(url.replace(env.GITHUB_API_URL, ''))
      requested.push(path)
      const json = (value) => new Response(JSON.stringify(value))
      if (path === '/repos/owner/repo/pulls/7') {
        return json({
          head: { sha: headSha },
          changed_files: changedFiles ?? files.length,
        })
      }
      if (path.startsWith('/repos/owner/repo/pulls/7/files')) return json(files)
      if (path.startsWith(`/repos/owner/repo/compare/${BASE}...${HEAD}`)) {
        return json({ merge_base_commit: { sha: MERGE_BASE } })
      }
      const match = path.match(
        /^\/repos\/owner\/repo\/contents\/(.+)\?ref=(.+)$/
      )
      const body = match ? contents[`${match[2]}:${match[1]}`] : undefined
      if (body === undefined) return new Response('missing', { status: 404 })
      return new Response(body)
    }
    return { requested, lines }
  }

  it('passes a pull request without test files and reads no content', async () => {
    const { requested, lines } = stub({
      files: [{ filename: 'src/a.ts', status: 'modified' }],
    })
    assert.equal(await main(env), 0)
    assert.equal(
      requested.some((path) => path.includes('/contents/')),
      false
    )
    assert.equal(
      requested.some((path) => path.includes('/compare/')),
      false
    )
    assert.deepEqual(lines, [
      'test-integrity: 0 changed test file(s), existing tests not weakened.',
    ])
  })

  it('reads the base content at the merge base and passes a normal edit', async () => {
    const { requested } = stub({
      files: [{ filename: 'src/[id]/a.test.ts', status: 'modified' }],
      contents: {
        [`${MERGE_BASE}:src/[id]/a.test.ts`]: "it('a', () => {})",
        [`${HEAD}:src/[id]/a.test.ts`]: "it('a', () => {})\nit('b', () => {})",
      },
    })
    assert.equal(await main(env), 0)
    assert.ok(
      requested.includes(
        `/repos/owner/repo/contents/src/[id]/a.test.ts?ref=${MERGE_BASE}`
      )
    )
  })

  it('fails with the rule and the numbers for each offending file', async () => {
    const { lines } = stub({
      files: [
        { filename: 'e2e/gone.spec.ts', status: 'removed' },
        { filename: 'src/a.test.ts', status: 'modified' },
        {
          filename: 'src/new/b.test.ts',
          previous_filename: 'src/old/b.test.ts',
          status: 'renamed',
        },
        { filename: 'src/c.test.ts', status: 'added' },
      ],
      contents: {
        [`${MERGE_BASE}:src/a.test.ts`]: "it('a', () => {})\nit('b', () => {})",
        [`${HEAD}:src/a.test.ts`]: "it('a', () => {})\nit.skip('b', () => {})",
        [`${MERGE_BASE}:src/old/b.test.ts`]: "it('a', () => {})",
        [`${HEAD}:src/new/b.test.ts`]: "it('a', () => {})",
        [`${HEAD}:src/c.test.ts`]: "it('a', () => {})\nit('b', () => {})",
      },
    })
    assert.equal(await main(env), 1)
    const output = lines.join('\n')
    assert.match(output, /e2e\/gone\.spec\.ts {2}\(deleted\)/)
    assert.match(output, /src\/a\.test\.ts {2}\(markers 0 -> 1\)/)
    assert.match(output, /src\/a\.test\.ts {2}\(test cases 2 -> 1\)/)
    assert.match(output, /changed existing test files: 3 -> 2/)
    assert.doesNotMatch(output, /src\/new\/b\.test\.ts/)
    assert.doesNotMatch(output, /src\/c\.test\.ts/)
  })

  it('fails closed when the pull request head moved', async () => {
    stub({ files: [], headSha: 'd'.repeat(40) })
    await assert.rejects(main(env), /Pull request head is d+, expected b+/)
  })

  it('fails closed on an incomplete file list', async () => {
    stub({
      files: [{ filename: 'src/a.ts', status: 'modified' }],
      changedFiles: 2,
    })
    await assert.rejects(main(env), /Fetched 1 of 2 changed files/)
  })

  it('fails closed when a test file cannot be fetched', async () => {
    stub({
      files: [{ filename: 'src/a.test.ts', status: 'modified' }],
      contents: { [`${HEAD}:src/a.test.ts`]: "it('a', () => {})" },
    })
    await assert.rejects(main(env), /Cannot read src\/a\.test\.ts at c+/)
  })

  it('fails closed when a test file is not UTF-8 text', async () => {
    stub({
      files: [{ filename: 'src/a/__tests__/image.png', status: 'added' }],
      contents: {
        [`${HEAD}:src/a/__tests__/image.png`]: new Uint8Array([
          0xff, 0xfe, 0x00,
        ]),
      },
    })
    await assert.rejects(
      main(env),
      /Cannot decode src\/a\/__tests__\/image\.png/
    )
  })

  it('fails closed on an API error and on invalid input', async () => {
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
