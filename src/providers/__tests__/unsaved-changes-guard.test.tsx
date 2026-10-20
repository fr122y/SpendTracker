import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, renderHook } from '@testing-library/react'

import { resetFormDrafts, useFormDraft } from '@/shared/lib'

import {
  UnsavedChangesGuard,
  hasUnsavedChanges,
} from '../unsaved-changes-guard'

const mockLeaving = jest.fn(() => false)
jest.mock('@/shared/lib/session-expiry', () => ({
  ...jest.requireActual('@/shared/lib/session-expiry'),
  isLeavingForLogin: () => mockLeaving(),
}))

function typeDraft(value: string) {
  const { result } = renderHook(() =>
    useFormDraft('expense', 'description', '', { input: true })
  )
  act(() => result.current[1](value))
}

function dispatchBeforeUnload() {
  const event = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(event)
  return event.defaultPrevented
}

describe('unsaved changes guard', () => {
  beforeEach(() => {
    resetFormDrafts()
    mockLeaving.mockReturnValue(false)
  })

  it('allows leaving with no input and no pending saves', () => {
    expect(hasUnsavedChanges(0)).toBe(false)
  })

  it('warns about typed text', () => {
    typeDraft('Кофе')
    expect(hasUnsavedChanges(0)).toBe(true)
  })

  it('warns about a running or paused save', () => {
    expect(hasUnsavedChanges(1)).toBe(true)
  })

  it('stays silent while leaving for the login page', () => {
    typeDraft('Кофе')
    mockLeaving.mockReturnValue(true)
    expect(hasUnsavedChanges(1)).toBe(false)
  })

  it('cancels beforeunload only when something is unsaved', () => {
    const client = new QueryClient()
    render(
      <QueryClientProvider client={client}>
        <UnsavedChangesGuard />
      </QueryClientProvider>
    )
    expect(dispatchBeforeUnload()).toBe(false)

    typeDraft('Кофе')
    expect(dispatchBeforeUnload()).toBe(true)
  })
})
