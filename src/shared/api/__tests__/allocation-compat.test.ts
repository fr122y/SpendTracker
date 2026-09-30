import {
  percentageFromAmountKopecks,
  salaryRublesToKopecks,
} from '../allocation-compat'

describe('allocation-compat', () => {
  it('converts salary rubles to safe kopecks with UI-compatible rounding', () => {
    expect(salaryRublesToKopecks(1_000_000)).toBe(100_000_000)
    expect(salaryRublesToKopecks(73_000.005)).toBe(7_300_001)
  })

  it('keeps an amount-derived percentage precise enough to survive a round trip', () => {
    const percentage = percentageFromAmountKopecks(33_333_333, 100_000_000)

    expect(percentage).toBeCloseTo(33.333333, 8)
    expect(Math.round((100_000_000 * percentage) / 100)).toBe(33_333_333)
  })

  it('refuses to convert a legacy amount without positive income', () => {
    expect(() => percentageFromAmountKopecks(1_500_000, 0)).toThrow(
      'положительного дохода'
    )
  })
})
