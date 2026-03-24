import Fuse from 'fuse.js'

import type { KeywordMapping } from '@/shared/types'
import type { IFuseOptions } from 'fuse.js'

export type MatchResult = ({ found: true } & KeywordMapping) | { found: false }

const FUSE_OPTIONS = {
  keys: ['keyword'],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2,
} satisfies IFuseOptions<KeywordMapping>

function normalizeDescription(description: string): string {
  return description.trim().toLowerCase()
}

export function createMatcher(mappings: KeywordMapping[]) {
  const fuse = new Fuse(mappings, FUSE_OPTIONS)

  return function match(description: string): MatchResult {
    const normalized = normalizeDescription(description)
    if (!normalized) {
      return { found: false }
    }

    const fullResults = fuse.search(normalized)
    if (fullResults.length > 0 && (fullResults[0].score ?? 1) < 0.4) {
      return { found: true, ...fullResults[0].item }
    }

    const words = normalized.split(/\s+/).filter((word) => word.length >= 2)
    for (const word of words) {
      const wordResults = fuse.search(word)
      if (wordResults.length > 0 && (wordResults[0].score ?? 1) < 0.3) {
        return { found: true, ...wordResults[0].item }
      }
    }

    return { found: false }
  }
}
