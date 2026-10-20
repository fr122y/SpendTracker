import {
  AMOUNT_FORMAT_ERROR,
  AMOUNT_NEGATIVE_ERROR,
  AMOUNT_POSITIVE_ERROR,
  MAX_MONEY_AMOUNT,
  formatAmountInput,
  formatMoney,
  isValidMoneyAmount,
  normalizeMoneyAmount,
  parseAmountInput,
} from '../money-amount'

const MAX_ERROR = 'Не больше 100 000 000 ₽'

describe('parseAmountInput', () => {
  it.each([
    ['1 500', 1500, '1500'],
    ['1 500', 1500, '1500'],
    ['1 500', 1500, '1500'],
    ['1 500,50', 1500.5, '1500,50'],
    ['1500.75', 1500.75, '1500,75'],
    ['500+50', 550, '550'],
    ['30000+5000*2', 40000, '40000'],
    ['(100+50)*2', 300, '300'],
    ['100/3', 33.33, '33,33'],
    ['12.345', 12.35, '12,35'],
    ['0.1+0.2', 0.3, '0,30'],
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

describe('normalizeMoneyAmount', () => {
  it.each([
    [1500.005, 1500.01],
    [0.1 + 0.2, 0.3],
    [99_999_999.994, 99_999_999.99],
    [-0.001, 0],
    [250, 250],
  ])('rounds %p to kopecks as %p', (value, expected) => {
    expect(normalizeMoneyAmount(value)).toBe(expected)
  })

  it.each(['100', null, undefined, Number.NaN])(
    'returns %p unchanged for the validator',
    (value) => {
      expect(normalizeMoneyAmount(value)).toBe(value)
    }
  )

  it('rounds a sub-kopeck amount to zero, which a positive rule rejects', () => {
    expect(isValidMoneyAmount(normalizeMoneyAmount(0.004))).toBe(false)
  })
})

describe('formatMoney', () => {
  it.each([
    [0, '0\u00A0₽'],
    [350, '350\u00A0₽'],
    [1234, '1\u00A0234\u00A0₽'],
    [350.5, '350,50\u00A0₽'],
    [0.5, '0,50\u00A0₽'],
    [1500.5, '1\u00A0500,50\u00A0₽'],
    [234.56, '234,56\u00A0₽'],
    [100_000_000, '100\u00A0000\u00A0000\u00A0₽'],
    [12.345, '12,35\u00A0₽'],
    [24691.4, '24\u00A0691,40\u00A0₽'],
    [-1500.5, '-1\u00A0500,50\u00A0₽'],
  ])('formats %p as %j', (value, expected) => {
    expect(formatMoney(value)).toBe(expected)
  })
})

describe('formatAmountInput', () => {
  it.each([
    [1500, '1500'],
    [1500.5, '1500,50'],
    [123.45, '123,45'],
    [0.1, '0,10'],
    [33.333, '33,33'],
  ])('formats %p as %j', (value, expected) => {
    expect(formatAmountInput(value)).toBe(expected)
  })

  it('round-trips through parseAmountInput', () => {
    expect(parseAmountInput(formatAmountInput(1500.5))).toEqual({
      ok: true,
      value: 1500.5,
      display: '1500,50',
    })
  })
})
