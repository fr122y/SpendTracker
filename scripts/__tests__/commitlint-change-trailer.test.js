import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import rule from '../commitlint/change-trailer-rule.cjs'

const {
  NONE_TYPES,
  RULE_NAME,
  changeLines,
  knownChangeIds,
  plugin,
  validateChangeTrailer,
} = rule

const known = new Set(['add-foo', 'old-change'])
const check = (message, type = 'feat') =>
  validateChangeTrailer(message, type, known)

describe('validateChangeTrailer', () => {
  it('accepts an existing change id', () => {
    expect(check('feat(budget): x\n\nBody.\n\nChange: add-foo')).toEqual([true])
    expect(
      check('fix(budget): x\n\nChange: old-change\nRefs: T-1', 'fix')
    ).toEqual([true])
  })

  it.each(NONE_TYPES)('accepts Change: none for a %s commit', (type) => {
    expect(check(`${type}(repo): x\n\nChange: none`, type)).toEqual([true])
  })

  it.each(['feat', 'fix', 'refactor', 'perf', 'revert'])(
    'rejects Change: none for a %s commit',
    (type) => {
      const [valid, reason] = check(`${type}(ui): x\n\nChange: none`, type)
      expect(valid).toBe(false)
      expect(reason).toMatch(/not allowed for a .+ commit/)
    }
  )

  it('rejects a message without the trailer', () => {
    const [valid, reason] = check('docs(docs): x', 'docs')
    expect(valid).toBe(false)
    expect(reason).toMatch(/Change: <change-id>/)
  })

  it('rejects more than one Change line, even with the same id', () => {
    expect(check('feat(ui): x\n\nChange: add-foo\nChange: old-change')[0]).toBe(
      false
    )
    expect(check('feat(ui): x\n\nChange: add-foo\nChange: add-foo')[0]).toBe(
      false
    )
  })

  it('rejects an unknown id', () => {
    const [valid, reason] = check('feat(ui): x\n\nChange: add-bar')
    expect(valid).toBe(false)
    expect(reason).toMatch(/names no OpenSpec change/)
  })

  it.each([
    'Change:add-foo',
    'Change: Add-Foo',
    'Change: add-foo extra',
    'Change: openspec/changes/add-foo',
    'Change: 2026-10-13-add-foo extra',
  ])('rejects the malformed line %s', (line) => {
    expect(check(`feat(ui): x\n\n${line}`)[0]).toBe(false)
  })

  it('ignores trailing spaces and comment lines', () => {
    expect(check('feat(ui): x\n\nChange: add-foo  \r\n# Change: x')).toEqual([
      true,
    ])
  })

  it('does not accept a lower-case key', () => {
    expect(check('feat(ui): x\n\nchange: add-foo')[0]).toBe(false)
  })
})

describe('changeLines', () => {
  it('returns only lines that start with Change:', () => {
    expect(changeLines('a\n Change: x\nChange: y\nRefs: T-1')).toEqual([
      'Change: y',
    ])
    expect(changeLines(undefined)).toEqual([])
  })
})

describe('knownChangeIds', () => {
  let root
  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'change-trailer-'))
    const changes = path.join(root, 'openspec', 'changes')
    fs.mkdirSync(path.join(changes, 'active-change'), { recursive: true })
    fs.mkdirSync(path.join(changes, 'archive', '2026-10-13-done-change'), {
      recursive: true,
    })
    fs.writeFileSync(path.join(changes, 'README.md'), '')
  })
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }))

  it('lists active and archived changes without the date prefix', () => {
    expect([...knownChangeIds(root)].sort()).toEqual([
      'active-change',
      'done-change',
    ])
  })

  it('returns nothing without an openspec folder', () => {
    expect(knownChangeIds(path.join(root, 'missing')).size).toBe(0)
  })
})

describe('plugin rule', () => {
  const rule = plugin.rules[RULE_NAME]
  const realTitle = process.env.COMMITLINT_PR_TITLE
  afterEach(() => {
    if (realTitle === undefined) delete process.env.COMMITLINT_PR_TITLE
    else process.env.COMMITLINT_PR_TITLE = realTitle
  })

  it('checks ids against the repository it runs in', () => {
    delete process.env.COMMITLINT_PR_TITLE
    const archived = fs
      .readdirSync(path.join(process.cwd(), 'openspec/changes/archive'))
      .find((name) => /^\d{4}-\d{2}-\d{2}-/.test(name))
    const id = archived.replace(/^\d{4}-\d{2}-\d{2}-/, '')
    expect(rule({ raw: `fix(ui): x\n\nChange: ${id}`, type: 'fix' })).toEqual([
      true,
    ])
    expect(rule({ raw: 'fix(ui): x', type: 'fix' })[0]).toBe(false)
  })

  it('skips the pull request title', () => {
    process.env.COMMITLINT_PR_TITLE = '1'
    expect(rule({ raw: 'fix(ui): x', type: 'fix' })).toEqual([true])
  })
})
