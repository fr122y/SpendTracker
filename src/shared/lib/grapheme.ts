function segmentGraphemes(value: string): string[] {
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  return Array.from(segmenter.segment(value), (part) => part.segment)
}

/** Number of user-perceived characters: a ZWJ emoji such as 👨‍👩‍👧 counts as 1. */
export function countGraphemes(value: string): number {
  return segmentGraphemes(value).length
}

/** Keeps at most `limit` graphemes, never cutting a ZWJ or flag sequence. */
export function limitGraphemes(value: string, limit: number): string {
  return segmentGraphemes(value).slice(0, limit).join('')
}
