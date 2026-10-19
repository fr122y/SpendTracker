import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import {
  buildSummary,
  collectChangedPaths,
  comparePackageJson,
  deepEqual,
  findProtectedPaths,
  matchPattern,
  parsePatterns,
} from './protected-paths.mjs'

const listText = readFileSync(
  new URL('../protected-paths.txt', import.meta.url),
  'utf8'
)
const patterns = parsePatterns(listText)

describe('parsePatterns', () => {
  it('drops comments and blank lines and trims whitespace', () => {
    const text = '# heading\n\n  .github/**  \r\n\t# indented comment\na.json\n'
    assert.deepEqual(parsePatterns(text), ['.github/**', 'a.json'])
  })

  it('reads exactly the agreed list from the repository file', () => {
    assert.deepEqual(
      [...patterns].sort(),
      [
        '.github/**',
        '.husky/**',
        '.prettierignore',
        '.prettierrc',
        'commitlint.config.cjs',
        'eslint.config.mjs',
        'jest.config.mjs',
        'openspec/config.yaml',
        'scripts/commitlint/**',
        'playwright.config.ts',
        'src/test/mocks/**',
        'src/test/setup.ts',
        'tsconfig.json',
      ].sort()
    )
  })

  it('does not list package.json, which the script handles specially', () => {
    assert.equal(matchPattern('package.json', patterns), null)
  })
})

describe('matchPattern against the repository list', () => {
  const protectedCases = [
    ['.github/workflows/x.yml', '.github/**'],
    ['.github/protected-paths.txt', '.github/**'],
    ['.github/scripts/protected-paths.mjs', '.github/**'],
    ['.github/pull_request_template.md', '.github/**'],
    ['.husky/pre-commit', '.husky/**'],
    ['.husky/_/husky.sh', '.husky/**'],
    ['eslint.config.mjs', 'eslint.config.mjs'],
    ['tsconfig.json', 'tsconfig.json'],
    ['jest.config.mjs', 'jest.config.mjs'],
    ['playwright.config.ts', 'playwright.config.ts'],
    ['commitlint.config.cjs', 'commitlint.config.cjs'],
    ['.prettierrc', '.prettierrc'],
    ['.prettierignore', '.prettierignore'],
    ['src/test/setup.ts', 'src/test/setup.ts'],
    ['src/test/mocks/server.ts', 'src/test/mocks/**'],
    ['src/test/mocks/handlers/auth.ts', 'src/test/mocks/**'],
    ['openspec/config.yaml', 'openspec/config.yaml'],
  ]
  for (const [path, rule] of protectedCases) {
    it(`protects ${path}`, () => {
      assert.equal(matchPattern(path, patterns), rule)
    })
  }

  const freeCases = [
    'docs/.github/x',
    'docs/.github/workflows/x.yml',
    '.github',
    '.githubx/workflows/x.yml',
    'src/.husky/pre-commit',
    '.husky',
    'eslint.config.mjs.bak',
    'src/eslint.config.mjs',
    'e2e/tsconfig.json',
    'tsconfig.json5',
    'tsconfig.tsbuildinfo',
    'tsconfigXjson',
    'TSCONFIG.JSON',
    'jest.config.mjsx',
    'e2e/playwright.config.ts',
    'docs/commitlint.config.cjs',
    '.prettierrc.json',
    'src/.prettierignore',
    'src/test/setup.tsx',
    'src/test/setup.test.ts',
    'app/src/test/setup.ts',
    'src/test/mocks',
    'src/test/mocksx/server.ts',
    'src/test/utils.ts',
    'openspec/config.yaml.bak',
    'openspec/changes/x/config.yaml',
    'openspec/changes/add-x/proposal.md',
    'package.json',
    'package-lock.json',
    'AGENTS.md',
    '.claude/settings.json',
    '.agents/skills/x/SKILL.md',
    'src/shared/api/auth.ts',
    'drizzle/0001_init.sql',
    'vercel.json',
  ]
  for (const path of freeCases) {
    it(`does not protect ${path}`, () => {
      assert.equal(matchPattern(path, patterns), null)
    })
  }
})

describe('matchPattern glob semantics', () => {
  it('keeps * inside one path segment', () => {
    assert.equal(matchPattern('a/x.yml', ['a/*.yml']), 'a/*.yml')
    assert.equal(matchPattern('a/b/x.yml', ['a/*.yml']), null)
    assert.equal(matchPattern('a/x.yaml', ['a/*.yml']), null)
  })

  it('lets ** span any depth, including none in the middle', () => {
    assert.equal(matchPattern('a/b', ['a/**/b']), 'a/**/b')
    assert.equal(matchPattern('a/x/y/b', ['a/**/b']), 'a/**/b')
    assert.equal(matchPattern('a/x/c', ['a/**/b']), null)
    assert.equal(matchPattern('x/a/b', ['a/**/b']), null)
  })

  it('treats regular expression characters as literals', () => {
    assert.equal(matchPattern('a+b(c).ts', ['a+b(c).ts']), 'a+b(c).ts')
    assert.equal(matchPattern('aab(c)xts', ['a+b(c).ts']), null)
  })

  it('returns the first matching rule', () => {
    assert.equal(matchPattern('a/b', ['a/**', 'a/b']), 'a/**')
  })
})

describe('collectChangedPaths', () => {
  it('counts both names of a rename and removes duplicates', () => {
    const files = [
      { filename: 'src/a.ts', status: 'modified' },
      {
        filename: 'docs/old-hook',
        previous_filename: '.husky/pre-commit',
        status: 'renamed',
      },
      { filename: 'src/a.ts', status: 'modified' },
    ]
    assert.deepEqual(collectChangedPaths(files), [
      'src/a.ts',
      'docs/old-hook',
      '.husky/pre-commit',
    ])
  })
})

describe('findProtectedPaths', () => {
  it('flags a protected file renamed out of a protected location', () => {
    const paths = collectChangedPaths([
      {
        filename: 'config/ts.json',
        previous_filename: 'tsconfig.json',
        status: 'renamed',
      },
    ])
    assert.deepEqual(findProtectedPaths(paths, patterns), [
      { path: 'tsconfig.json', rule: 'tsconfig.json' },
    ])
  })

  it('flags a file renamed into a protected location', () => {
    const paths = collectChangedPaths([
      {
        filename: '.github/workflows/new.yml',
        previous_filename: 'docs/new.yml',
        status: 'renamed',
      },
    ])
    assert.deepEqual(findProtectedPaths(paths, patterns), [
      { path: '.github/workflows/new.yml', rule: '.github/**' },
    ])
  })

  it('returns nothing for application and documentation changes', () => {
    const paths = ['src/app/page.tsx', 'docs/context/OPEN_QUESTIONS.md']
    assert.deepEqual(findProtectedPaths(paths, patterns), [])
  })
})

describe('deepEqual', () => {
  it('ignores object key order at every level', () => {
    assert.equal(
      deepEqual({ a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 }),
      true
    )
  })

  it('keeps array order significant', () => {
    assert.equal(deepEqual(['a', 'b'], ['b', 'a']), false)
    assert.equal(deepEqual(['a', 'b'], ['a', 'b']), true)
  })

  it('tells apart missing, null, array, and object values', () => {
    assert.equal(deepEqual(undefined, undefined), true)
    assert.equal(deepEqual(undefined, {}), false)
    assert.equal(deepEqual(null, {}), false)
    assert.equal(deepEqual([], {}), false)
    assert.equal(deepEqual({ a: undefined }, { b: undefined }), false)
    assert.equal(deepEqual('1', 1), false)
  })
})

describe('comparePackageJson', () => {
  const base = {
    name: 'app',
    version: '1.0.0',
    scripts: { lint: 'eslint src --max-warnings 0', test: 'jest' },
    'lint-staged': { '*.ts': ['eslint --fix', 'prettier --write'] },
    dependencies: { next: '16.0.0' },
    devDependencies: { jest: '30.0.0' },
  }
  const text = (value) => JSON.stringify(value, null, 2)

  it('flags a changed script', () => {
    const head = { ...base, scripts: { ...base.scripts, test: 'true' } }
    assert.equal(
      comparePackageJson(text(base), text(head)),
      'package.json (scripts changed)'
    )
  })

  it('flags an added or removed script', () => {
    const added = { ...base, scripts: { ...base.scripts, x: 'y' } }
    const removed = { ...base, scripts: { lint: base.scripts.lint } }
    assert.notEqual(comparePackageJson(text(base), text(added)), null)
    assert.notEqual(comparePackageJson(text(base), text(removed)), null)
  })

  it('flags a changed lint-staged value', () => {
    const head = { ...base, 'lint-staged': { '*.ts': ['prettier --write'] } }
    assert.equal(
      comparePackageJson(text(base), text(head)),
      'package.json (lint-staged changed)'
    )
  })

  it('flags reordered lint-staged commands', () => {
    const head = {
      ...base,
      'lint-staged': { '*.ts': ['prettier --write', 'eslint --fix'] },
    }
    assert.notEqual(comparePackageJson(text(base), text(head)), null)
  })

  it('flags removal of the whole scripts or lint-staged key', () => {
    const noScripts = { ...base, scripts: undefined }
    const noLintStaged = { ...base, 'lint-staged': undefined }
    assert.equal(
      comparePackageJson(text(base), text(noScripts)),
      'package.json (scripts changed)'
    )
    assert.equal(
      comparePackageJson(text(base), text(noLintStaged)),
      'package.json (lint-staged changed)'
    )
  })

  it('names both keys when both change', () => {
    const head = { ...base, scripts: {}, 'lint-staged': {} }
    assert.equal(
      comparePackageJson(text(base), text(head)),
      'package.json (scripts, lint-staged changed)'
    )
  })

  it('passes a change to dependencies, devDependencies, and version only', () => {
    const head = {
      ...base,
      version: '1.1.0',
      dependencies: { next: '16.1.0', zod: '4.0.0' },
      devDependencies: { jest: '30.1.0' },
    }
    assert.equal(comparePackageJson(text(base), text(head)), null)
  })

  it('passes a change of key order only', () => {
    const head = {
      'lint-staged': base['lint-staged'],
      devDependencies: base.devDependencies,
      scripts: { test: 'jest', lint: 'eslint src --max-warnings 0' },
      dependencies: base.dependencies,
      version: base.version,
      name: base.name,
    }
    assert.equal(comparePackageJson(text(base), text(head)), null)
    assert.equal(comparePackageJson(text(base), JSON.stringify(base)), null)
  })

  it('treats a deleted package.json as protected', () => {
    assert.equal(comparePackageJson(text(base), null), 'package.json (deleted)')
  })

  it('treats a package.json missing at the base as protected', () => {
    assert.equal(
      comparePackageJson(null, text(base)),
      'package.json (missing at base)'
    )
  })

  it('treats an unparsable or non-object package.json as protected', () => {
    for (const broken of ['{ "scripts": ', '', '[]', 'null', '"x"']) {
      assert.equal(
        comparePackageJson(text(base), broken),
        'package.json (unparsable)'
      )
      assert.equal(
        comparePackageJson(broken, text(base)),
        'package.json (unparsable)'
      )
    }
  })
})

describe('buildSummary', () => {
  it('lists every hit and explains how the pull request gets merged', () => {
    const summary = buildSummary([
      { path: '.github/workflows/verify.yml', rule: '.github/**' },
      { path: 'package.json', rule: 'package.json (scripts changed)' },
    ])
    assert.match(
      summary,
      /`\.github\/workflows\/verify\.yml` \| `\.github\/\*\*`/
    )
    assert.match(summary, /package\.json \(scripts changed\)/)
    assert.match(summary, /intentional friction/)
    assert.match(summary, /only the repository owner/)
    assert.match(summary, /`Protect main`/)
    assert.match(summary, /`verify` is green/)
  })
})
