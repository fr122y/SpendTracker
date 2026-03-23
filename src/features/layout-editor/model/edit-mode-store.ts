'use client'

import { action, atom, wrap } from '@reatom/core'
import { useSyncExternalStore } from 'react'

export const isEditModeAtom = atom(false, 'isEditModeAtom')

export const toggleEditMode = action(() => {
  isEditModeAtom.set(!isEditModeAtom())
}, 'toggleEditMode')

export const resetEditMode = action(() => {
  isEditModeAtom.set(false)
}, 'resetEditMode')

interface EditModeState {
  isEditMode: boolean
  toggleEditMode: () => void
}

const actions = {
  toggleEditMode: () => wrap(toggleEditMode)(),
}

let cachedState: EditModeState | null = null
let cachedIsEditMode: boolean | null = null

const getState = (): EditModeState => {
  const isEditMode = isEditModeAtom()

  if (cachedState === null || cachedIsEditMode !== isEditMode) {
    cachedIsEditMode = isEditMode
    cachedState = {
      isEditMode,
      ...actions,
    }
  }

  return cachedState
}

const subscribe = (callback: () => void) => {
  return isEditModeAtom.subscribe(callback)
}

export function useEditMode(): EditModeState
export function useEditMode<T>(selector: (state: EditModeState) => T): T
export function useEditMode<T>(selector?: (state: EditModeState) => T) {
  const state = useSyncExternalStore(subscribe, getState, getState)

  if (selector) {
    return selector(state)
  }

  return state
}
