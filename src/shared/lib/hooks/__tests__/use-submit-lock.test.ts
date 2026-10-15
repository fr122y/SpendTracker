import { act, renderHook } from '@testing-library/react'

import { useSubmitLock } from '../use-submit-lock'

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('useSubmitLock', () => {
  it('runs one task for rapid repeated calls while the first is pending', async () => {
    const { result } = renderHook(() => useSubmitLock())
    const pending = deferred()
    const task = jest.fn(() => pending.promise)

    let runs: Promise<boolean>[] = []
    act(() => {
      runs = [result.current(task), result.current(task), result.current(task)]
    })

    expect(task).toHaveBeenCalledTimes(1)
    await act(async () => {
      pending.resolve()
      await Promise.all(runs)
    })
    await expect(Promise.all(runs)).resolves.toEqual([true, false, false])
  })

  it('releases the lock after the task settles, including on failure', async () => {
    const { result } = renderHook(() => useSubmitLock())
    const failing = deferred()

    const first = result.current(() => failing.promise)
    failing.reject(new Error('network'))
    await expect(first).rejects.toThrow('network')

    const task = jest.fn()
    await expect(result.current(task)).resolves.toBe(true)
    expect(task).toHaveBeenCalledTimes(1)
  })

  it('keeps the same lock across re-renders', async () => {
    const { result, rerender } = renderHook(() => useSubmitLock())
    const pending = deferred()
    const task = jest.fn(() => pending.promise)

    const first = result.current(task)
    rerender()
    await expect(result.current(task)).resolves.toBe(false)
    expect(task).toHaveBeenCalledTimes(1)
    pending.resolve()
    await expect(first).resolves.toBe(true)
  })
})
