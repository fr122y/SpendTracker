import {
  AMOUNT_FORMAT_ERROR,
  AMOUNT_NEGATIVE_ERROR,
  AMOUNT_POSITIVE_ERROR,
  MAX_MONEY_AMOUNT,
  isValidMoneyAmount,
  parseAmountInput,
} from '../money-amount'

const MAX_ERROR = 'Не больше 100 000 000 ₽'

describe('parseAmountInput', () => {
  it.each([
    ['1 500', 1500, '1500'],
    ['1 500', 1500, '1500'],
    ['1 500', 1500, '1500'],
    ['1 500,50', 1500.5, '1500.5'],
    ['1500.75', 1500.75, '1500.75'],
    ['500+50', 550, '550'],
    ['30000+5000*2', 40000, '40000'],
    ['(100+50)*2', 300, '300'],
    ['100/3', 33.33, '33.33'],
    ['12.345', 12.35, '12.35'],
    ['0.1+0.2', 0.3, '0.3'],
    [' 42 ', 42, '42'],
    ['100000000', 100_000_000, '100000000'],
    ['100000000.004', 100_000_000, '100000000'],
  ])('accepts %j as %p', (raw, value, display) => {
    expect(parseAmountInput(raw)).toEqual({ ok: true, value, display })
  })

  it.each([
    ['15 руб', AMOUNT_FORMAT_ERROR],
    ['15₽', AMOUNT_FORMAT_ERROR],
    ['1e5', AMOUNT_FORMAT_ERROR],
    ['1.2.3', AMOUNT_FORMAT_ERROR],
    ['500+', AMOUNT_FORMAT_ERROR],
    ['(500', AMOUNT_FORMAT_ERROR],
    ['100/0', AMOUNT_FORMAT_ERROR],
    ['abc', AMOUNT_FORMAT_ERROR],
    ['-100', AMOUNT_POSITIVE_ERROR],
    ['0', AMOUNT_POSITIVE_ERROR],
    ['0.004', AMOUNT_POSITIVE_ERROR],
    ['100-100', AMOUNT_POSITIVE_ERROR],
    ['100000000.01', MAX_ERROR],
    ['999999999999', MAX_ERROR],
  ])('rejects %j with %p', (raw, error) => {
    expect(parseAmountInput(raw)).toEqual(
      expect.objectContaining({ ok: false, error })
    )
  })

  it.each(['', '   '])('reports %j as empty', (raw) => {
    expect(parseAmountInput(raw)).toEqual(
      expect.objectContaining({ ok: false, reason: 'empty' })
    )
  })

  it('accepts zero only when allowed, never a negative amount', () => {
    expect(parseAmountInput('0', { allowZero: true })).toEqual({
      ok: true,
      value: 0,
      display: '0',
    })
    expect(parseAmountInput('-1', { allowZero: true })).toEqual(
      expect.objectContaining({ ok: false, error: AMOUNT_NEGATIVE_ERROR })
    )
  })

  it('applies a custom maximum', () => {
    expect(parseAmountInput('1001', { max: 1000 })).toEqual(
      expect.objectContaining({ ok: false, error: 'Не больше 1 000 ₽' })
    )
  })
})

describe('isValidMoneyAmount', () => {
  it.each([0.01, 1500, MAX_MONEY_AMOUNT])('accepts %p', (value) => {
    expect(isValidMoneyAmount(value)).toBe(true)
  })

  it.each([
    0,
    -1,
    MAX_MONEY_AMOUNT + 0.01,
    1e12,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    '100',
    null,
  ])('rejects %p', (value) => {
    expect(isValidMoneyAmount(value)).toBe(false)
  })

  it('accepts zero with allowZero', () => {
    expect(isValidMoneyAmount(0, { allowZero: true })).toBe(true)
    expect(isValidMoneyAmount(-0.01, { allowZero: true })).toBe(false)
  })
})
