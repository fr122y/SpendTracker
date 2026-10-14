/**
 * Shortest abbreviation of a savings label, following the Russian
 * typographic practice of ГОСТ Р 7.0.12-2011 and the owner's approved table.
 */

const VOWELS = new Set('аеёиоуыэюя')
const NO_CUT_AFTER = new Set('йьъ')
const CYRILLIC = /[а-яё]/i
const CYRILLIC_WORD = /^[а-яё-]+$/i
const SERVICE_WORDS = new Set([
  'а',
  'без',
  'в',
  'во',
  'да',
  'для',
  'до',
  'за',
  'и',
  'из',
  'или',
  'к',
  'ко',
  'на',
  'над',
  'не',
  'но',
  'о',
  'об',
  'обо',
  'от',
  'по',
  'при',
  'про',
  'с',
  'со',
  'у',
  'через',
])

function isConsonant(char: string): boolean {
  const lower = char.toLowerCase()
  return CYRILLIC.test(lower) && !VOWELS.has(lower) && !NO_CUT_AFTER.has(lower)
}

function isVowel(char: string): boolean {
  return VOWELS.has(char.toLowerCase())
}

/**
 * Cuts a word after a consonant that precedes a vowel, keeping at least two
 * letters; never ends on «й», «ь», «ъ». Words of up to four letters, and words
 * with no valid cut, are kept whole.
 */
export function abbreviateWord(word: string): string {
  if (word.length <= 4) return word

  for (let i = 2; i < word.length - 1; i++) {
    if (isConsonant(word[i - 1]) && isVowel(word[i])) {
      return `${word.slice(0, i)}.`
    }
  }

  return word
}

export function abbreviateLabel(label: string): string {
  const trimmed = label.trim()
  if (trimmed === '') return ''

  const parts = trimmed
    .replace(/\([^)]*\)/g, ' ')
    .split(/\s+/)
    .filter((part) => part !== '' && !SERVICE_WORDS.has(part.toLowerCase()))

  const cyrillicCount = parts.filter((part) => CYRILLIC_WORD.test(part)).length
  let cyrillicSeen = 0
  const result: string[] = []

  for (const part of parts) {
    if (!CYRILLIC_WORD.test(part)) {
      result.push(part)
      continue
    }

    cyrillicSeen++
    if (cyrillicSeen === 1) {
      result.push(abbreviateWord(part))
    } else if (cyrillicCount === 2) {
      // Owner's table: «Месячный доход» → «Мес. д.»
      result.push(`${part[0]}.`)
    }
    // Longer labels keep only the first word: «Отпуск на море …» → «Отп.»
  }

  return result.length > 0 ? result.join(' ') : trimmed
}
