import { act, renderHook } from '@testing-library/react'

import { useBackDismiss } from '../use-back-dismiss'

// jsdom runs history.back() asynchronously and then fires popstate.
const waitForPopState = () =>
  new Promise<void>((resolve) =>
    window.addEventListener('popstate', () => resolve(), { once: true })
  )

describe('useBackDismiss', () => {
  it('adds one history entry while open and removes it on a normal close', async () => {
    const start = window.history.length
    const onClose = jest.fn()
    const { rerender } = renderHook(
      ({ isOpen }) => useBackDismiss(isOpen, onClose),
      { initialProps: { isOpen: true } }
    )
    expect(window.history.length).toBe(start + 1)
    const entryState = window.history.state

    const popped = waitForPopState()
    rerender({ isOpen: false })
    await act(() => popped)

    expect(window.history.state).not.toEqual(entryState)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes the dialog on browser Back', async () => {
    const onClose = jest.fn()
    renderHook(() => useBackDismiss(true, onClose))

    const popped = waitForPopState()
    window.history.back()
    await act(() => popped)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes only the topmost dialog on Back', async () => {
    const closeParent = jest.fn()
    const closeChild = jest.fn()
    renderHook(() => useBackDismiss(true, closeParent))
    renderHook(() => useBackDismiss(true, closeChild))

    const popped = waitForPopState()
    window.history.back()
    await act(() => popped)

    expect(closeChild).toHaveBeenCalledTimes(1)
    expect(closeParent).not.toHaveBeenCalled()
  })
})
