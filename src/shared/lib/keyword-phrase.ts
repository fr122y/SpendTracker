/**
 * Normalizes a keyword rule or an expense description for matching:
 * trims, lowercases, and collapses inner whitespace to single spaces.
 */
export function normalizeKeywordPhrase(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}
