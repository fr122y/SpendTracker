/**
 * Picks the Russian plural form for a count: [one, few, many],
 * e.g. ['операция', 'операции', 'операций'].
 */
export function pluralizeRu(
  count: number,
  forms: readonly [one: string, few: string, many: string]
): string {
  const abs = Math.abs(Math.trunc(count))
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod100 >= 11 && mod100 <= 14) return forms[2]
  if (mod10 === 1) return forms[0]
  if (mod10 >= 2 && mod10 <= 4) return forms[1]
  return forms[2]
}
