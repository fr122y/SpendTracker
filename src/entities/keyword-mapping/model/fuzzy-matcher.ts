import { normalizeKeywordPhrase } from '@/shared/lib/keyword-phrase'

import type { KeywordMapping, SharedKeywordMapping } from '@/shared/types'

type MatchableKeywordMapping = KeywordMapping | SharedKeywordMapping

export type MatchResult =
  | ({ found: true } & MatchableKeywordMapping)
  | { found: false }

/** Words shorter than this are matched only exactly, never by prefix or typo. */
const MIN_APPROXIMATE_LENGTH = 4
/** Shortest stem left after stripping an inflectional ending. */
const MIN_STEM_LENGTH = 3
/** Common Russian noun and adjective inflectional endings, longest first. */
const INFLECTION_ENDINGS = [
  'ами',
  'ями',
  'ого',
  'его',
  'ому',
  'ему',
  'ом',
  'ем',
  'ой',
  'ей',
  'ам',
  'ям',
  'ах',
  'ях',
  'ов',
  'ев',
  'ью',
  'ье',
  'ым',
  'им',
  'ых',
  'их',
  'ую',
  'юю',
  'ая',
  'яя',
  'ое',
  'ее',
  'ые',
  'ие',
  'а',
  'я',
  'о',
  'е',
  'ы',
  'и',
  'у',
  'ю',
  'ь',
  'й',
]

/** The word itself plus every stem left by stripping one known ending. */
function inflectionStems(word: string): Set<string> {
  const stems = new Set([word])
  for (const ending of INFLECTION_ENDINGS) {
    if (
      word.endsWith(ending) &&
      word.length - ending.length >= MIN_STEM_LENGTH
    ) {
      stems.add(word.slice(0, -ending.length))
    }
  }
  return stems
}

function sharesInflectionStem(a: Set<string>, b: Set<string>): boolean {
  for (const stem of a) {
    if (stem.length >= MIN_STEM_LENGTH && b.has(stem)) return true
  }
  return false
}

function tokenize(phrase: string): string[] {
  return phrase.split(/[^\p{L}\p{N}]+/u).filter(Boolean)
}

function allowedTypos(length: number): number {
  if (length < MIN_APPROXIMATE_LENGTH) return 0
  return length >= 6 ? 2 : 1
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      )
    }
    previous = current
  }
  return previous[b.length]
}

function indexOfSequence(haystack: string[], needle: string[]): number {
  if (needle.length === 0 || needle.length > haystack.length) return -1
  for (let start = 0; start + needle.length <= haystack.length; start += 1) {
    if (needle.every((token, offset) => haystack[start + offset] === token)) {
      return start
    }
  }
  return -1
}

interface Candidate {
  mapping: MatchableKeywordMapping
  /** Lower is better: 0 whole word, 1 same stem with another ending, 2 + typos. */
  rank: number
  position: number
  keywordLength: number
}

function isBetter(next: Candidate, current: Candidate | null): boolean {
  if (!current) return true
  if (next.rank !== current.rank) return next.rank < current.rank
  if (next.keywordLength !== current.keywordLength) {
    return next.keywordLength > current.keywordLength
  }
  return next.position < current.position
}

function matchFuzzyRule(
  mapping: MatchableKeywordMapping,
  tokens: string[]
): Candidate | null {
  const keywordTokens = tokenize(normalizeKeywordPhrase(mapping.keyword))
  if (keywordTokens.length === 0) return null
  const keywordLength = keywordTokens.join(' ').length

  const position = indexOfSequence(tokens, keywordTokens)
  if (position >= 0) {
    return { mapping, rank: 0, position, keywordLength }
  }

  // Approximate matching compares one keyword with one whole word, never a
  // substring inside a longer word: «тест» must not match «ресторан».
  if (keywordTokens.length !== 1) return null
  const [keyword] = keywordTokens
  if (keyword.length < MIN_APPROXIMATE_LENGTH) return null

  const keywordStems = inflectionStems(keyword)
  let best: Candidate | null = null
  for (const [index, token] of tokens.entries()) {
    let rank: number | null = null
    if (sharesInflectionStem(keywordStems, inflectionStems(token))) {
      rank = 1
    } else {
      const limit = allowedTypos(Math.min(token.length, keyword.length))
      if (limit > 0 && Math.abs(token.length - keyword.length) <= limit) {
        const distance = levenshtein(token, keyword)
        if (distance <= limit) rank = 2 + distance
      }
    }
    if (rank === null) continue
    const candidate = { mapping, rank, position: index, keywordLength }
    if (isBetter(candidate, best)) best = candidate
  }
  return best
}

/**
 * Picks the category rule for an expense description:
 * 1. an `exact` rule equal to the whole normalized description;
 * 2. a `fuzzy` rule whose words appear as whole words of the description
 *    (the longest keyword wins, then the earliest);
 * 3. a `fuzzy` single-word rule sharing a stem with a whole word once a
 *    known Russian inflectional ending is stripped, then with a small typo.
 */
export function createMatcher(mappings: MatchableKeywordMapping[]) {
  const exactRules = new Map<string, MatchableKeywordMapping>()
  const fuzzyRules: MatchableKeywordMapping[] = []
  for (const mapping of mappings) {
    if (mapping.matchType === 'exact') {
      exactRules.set(normalizeKeywordPhrase(mapping.keyword), mapping)
    } else {
      fuzzyRules.push(mapping)
    }
  }

  return function match(description: string): MatchResult {
    const normalized = normalizeKeywordPhrase(description)
    if (!normalized) {
      return { found: false }
    }

    const exact = exactRules.get(normalized)
    if (exact) {
      return { found: true, ...exact }
    }

    const tokens = tokenize(normalized)
    let best: Candidate | null = null
    for (const mapping of fuzzyRules) {
      const candidate = matchFuzzyRule(mapping, tokens)
      if (candidate && isBetter(candidate, best)) best = candidate
    }

    return best ? { found: true, ...best.mapping } : { found: false }
  }
}
