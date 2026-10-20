import { act, renderHook, waitFor } from '@testing-library/react'

import { resetPendingIds, trackPendingId } from '@/shared/lib/pending-ids'

import {
  EXPENSE_FLUSH_DELETES_URL,
  flushExpenseDeletesOnHide,
  PENDING_EXPENSE_DELETES_STORAGE_KEY,
  recoverExpenseDeletes,
  resetPendingExpenseDeletes,
  scheduleExpenseDelete,
  undoExpenseDelete,
  usePendingExpenseDeleteIds,
} from '../model/pending-deletes'

const ID = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'

const fetchMock = jest.fn()

function stored(): { id: string; dueAt: number }[] {
  return JSON.parse(
    window.localStorage.getItem(PENDING_EXPENSE_DELETES_STORAGE_KEY) ?? '[]'
  )
}

function sentIds(call = 0): string[] {
  return JSON.parse(fetchMock.mock.calls[call][1].body).ids
}

describe('deferred expense deletes', () => {
  beforeEach(() => {
    resetPendingExpenseDeletes()
    resetPendingIds()
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ ok: true })
    global.fetch = fetchMock
  })

  it('stores a waiting delete until it is undone', () => {
    scheduleExpenseDelete(ID, jest.fn(), 5000)
    expect(stored()).toEqual([{ id: ID, dueAt: expect.any(Number) }])
    expect(undoExpenseDelete(ID)).toBe(true)
    expect(stored()).toEqual([])
  })

  it('forgets a delete the server action committed', async () => {
    jest.useFakeTimers()
    const commit = jest.fn().mockResolvedValue(undefined)
    scheduleExpenseDelete(ID, commit, 5000)
    await act(async () => {
      jest.advanceTimersByTime(5000)
    })
    jest.useRealTimers()
    await waitFor(() => expect(stored()).toEqual([]))
    expect(commit).toHaveBeenCalledTimes(1)
  })

  it('sends waiting deletes with a keepalive request when the page hides', async () => {
    const commit = jest.fn()
    const onConfirmed = jest.fn()
    scheduleExpenseDelete(ID, commit, 5000)
    const { result } = renderHook(() => usePendingExpenseDeleteIds())
    expect(result.current.has(ID)).toBe(true)

    act(() => flushExpenseDeletesOnHide(onConfirmed))

    expect(fetchMock).toHaveBeenCalledWith(
      EXPENSE_FLUSH_DELETES_URL,
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
        credentials: 'same-origin',
      })
    )
    expect(sentIds()).toEqual([ID])
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledWith([ID]))
    expect(stored()).toEqual([])
    expect(commit).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.has(ID)).toBe(false))
    // The undo window has closed.
    expect(undoExpenseDelete(ID)).toBe(false)
  })

  it('falls back to the server action when the keepalive request fails', async () => {
    fetchMock.mockResolvedValue({ ok: false })
    const commit = jest.fn().mockResolvedValue(undefined)
    scheduleExpenseDelete(ID, commit, 5000)

    flushExpenseDeletesOnHide(jest.fn())

    await waitFor(() => expect(commit).toHaveBeenCalledTimes(1))
  })

  it('keeps the entry of an insert still running and resends after it lands', async () => {
    const insert = trackPendingId(ID)
    scheduleExpenseDelete(ID, jest.fn(), 5000)

    flushExpenseDeletesOnHide(jest.fn())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
    expect(stored()).toEqual([{ id: ID, dueAt: expect.any(Number) }])

    insert.resolve(ID)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(sentIds(1)).toEqual([ID])
    await waitFor(() => expect(stored()).toEqual([]))
  })

  it('resends past-due deletes of an earlier page load and hides them until confirmed', async () => {
    let finish!: (value: { ok: boolean }) => void
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const now = Date.now()
    window.localStorage.setItem(
      PENDING_EXPENSE_DELETES_STORAGE_KEY,
      JSON.stringify([
        { id: ID, dueAt: now - 1 },
        { id: OTHER, dueAt: now + 4000 },
      ])
    )
    const onConfirmed = jest.fn()
    const { result } = renderHook(() => usePendingExpenseDeleteIds())

    act(() => recoverExpenseDeletes(onConfirmed, now))

    expect(sentIds()).toEqual([ID])
    expect(result.current.has(ID)).toBe(true)
    expect(result.current.has(OTHER)).toBe(false)

    await act(async () => finish({ ok: true }))

    expect(onConfirmed).toHaveBeenCalledWith([ID])
    expect(result.current.has(ID)).toBe(false)
    // Another tab's delete inside its undo window is left to that tab.
    expect(stored()).toEqual([{ id: OTHER, dueAt: now + 4000 }])
  })

  it('keeps unconfirmed deletes for the next load', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    window.localStorage.setItem(
      PENDING_EXPENSE_DELETES_STORAGE_KEY,
      JSON.stringify([{ id: ID, dueAt: 0 }])
    )
    const onConfirmed = jest.fn()
    recoverExpenseDeletes(onConfirmed)
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
    expect(onConfirmed).not.toHaveBeenCalled()
    expect(stored()).toEqual([{ id: ID, dueAt: 0 }])
  })

  it('recovers once per page', () => {
    window.localStorage.setItem(
      PENDING_EXPENSE_DELETES_STORAGE_KEY,
      JSON.stringify([{ id: ID, dueAt: 0 }])
    )
    recoverExpenseDeletes(jest.fn())
    recoverExpenseDeletes(jest.fn())
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
