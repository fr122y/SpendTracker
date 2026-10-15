/**
 * Comparison key for pocket names: active pockets of one user must differ by
 * this key, so " Отпуск" and "отпуск" count as the same name.
 */
export function getPocketNameKey(name: string): string {
  return name.trim().toLocaleLowerCase('ru-RU')
}

/** Returns the pocket whose name equals `name` by key, ignoring `excludeId`. */
export function findPocketNameConflict<T extends { id: string; name: string }>(
  candidates: readonly T[],
  name: string,
  excludeId?: string
): T | undefined {
  const key = getPocketNameKey(name)
  return candidates.find(
    (candidate) =>
      candidate.id !== excludeId && getPocketNameKey(candidate.name) === key
  )
}

export const POCKET_NAME_CONFLICT_MESSAGE = 'Карман с таким названием уже есть'
