import {
  assertValidOperationAmount,
  assertValidOperationDate,
  assertValidPocketBudget,
  assertValidPocketPeriod,
  normalizePocketName,
} from '../pocket-helpers'

describe('pocket validation helpers', () => {
  it('accepts and rejects YYYY-MM periods', () => {
    expect(() => assertValidPocketPeriod('2026-02')).not.toThrow()
    expect(() => assertValidPocketPeriod('2026-13')).toThrow(
      'Pocket period must use YYYY-MM format'
    )
  })

  it('validates calendar dates rather than only their string shape', () => {
    expect(() => assertValidOperationDate('2024-02-29')).not.toThrow()
    expect(() => assertValidOperationDate('2026-02-29')).toThrow(
      'Operation date is invalid'
    )
    expect(() => assertValidOperationDate('2026-2-09')).toThrow(
      'Operation date must use YYYY-MM-DD format'
    )
  })

  it('requires positive finite operation amounts and non-negative finite budgets', () => {
    expect(() => assertValidOperationAmount(0.01)).not.toThrow()
    expect(() => assertValidOperationAmount(0)).toThrow(
      'Operation amount must be a positive finite number'
    )
    expect(() => assertValidOperationAmount(Number.NaN)).toThrow(
      'Operation amount must be a positive finite number'
    )
    expect(() => assertValidPocketBudget(0)).not.toThrow()
    expect(() => assertValidPocketBudget(-1)).toThrow(
      'Pocket budget must be a non-negative finite number'
    )
    expect(() => assertValidPocketBudget(Number.POSITIVE_INFINITY)).toThrow(
      'Pocket budget must be a non-negative finite number'
    )
  })

  it('trims a non-empty pocket name and enforces its length', () => {
    expect(normalizePocketName('  Накопления  ')).toBe('Накопления')
    expect(() => normalizePocketName(' ')).toThrow(
      'Pocket name must contain 1 to 80 characters'
    )
    expect(() => normalizePocketName('x'.repeat(81))).toThrow(
      'Pocket name must contain 1 to 80 characters'
    )
  })
})
