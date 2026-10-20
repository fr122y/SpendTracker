import { formatMoney } from '@/shared/lib'

export function formatPocketCurrency(amount: number) {
  return formatMoney(amount)
}

/** Month name in the nominative case, lowercase: `октябрь`. */
export function formatPocketMonthName(period: string) {
  const [year, month] = period.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('ru-RU', {
    month: 'long',
  })
}

/** Standalone month label: `Октябрь 2026`. */
export function formatPocketPeriod(period: string) {
  const name = formatPocketMonthName(period)
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${period.slice(0, 4)}`
}
