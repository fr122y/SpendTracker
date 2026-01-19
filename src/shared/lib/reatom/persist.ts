import { withLocalStorage } from '@reatom/core'

export const createPersist = (key: string) => withLocalStorage(key)
