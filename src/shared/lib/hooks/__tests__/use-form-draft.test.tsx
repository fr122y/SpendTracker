import { act, renderHook } from '@testing-library/react'

import { useFormDraft } from '../use-form-draft'

describe('useFormDraft', () => {
  it('keeps the value when the form remounts', () => {
    const first = renderHook(() => useFormDraft('form', 'description', ''))
    act(() => first.result.current[1]('Кофе'))
    expect(first.result.current[0]).toBe('Кофе')
    first.unmount()

    const second = renderHook(() => useFormDraft('form', 'description', ''))
    expect(second.result.current[0]).toBe('Кофе')
  })

  it('updates synchronously and supports functional updates', () => {
    const { result } = renderHook(() => useFormDraft('form', 'amount', '1'))
    act(() => {
      result.current[1]((previous) => `${previous}0`)
      result.current[1]((previous) => `${previous}0`)
    })
    expect(result.current[0]).toBe('100')
  })

  it('keeps drafts of different forms apart', () => {
    const a = renderHook(() => useFormDraft('pocket:a', 'amount', ''))
    const b = renderHook(() => useFormDraft('pocket:b', 'amount', ''))
    act(() => a.result.current[1]('500'))
    expect(b.result.current[0]).toBe('')
  })

  it('does not write drafts to browser storage', () => {
    const { result } = renderHook(() => useFormDraft('form', 'secret', ''))
    act(() => result.current[1]('value'))
    expect(window.localStorage.length).toBe(0)
    expect(window.sessionStorage.length).toBe(0)
  })
})
