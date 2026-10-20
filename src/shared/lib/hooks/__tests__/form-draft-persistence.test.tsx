import { act, renderHook } from '@testing-library/react'

import {
  PERSISTED_DRAFTS_KEY,
  hasUnsavedFormInput,
  holdSubmittedDraft,
  persistFormDrafts,
  resetFormDrafts,
  restorePersistedFormDrafts,
  useFormDraft,
} from '../use-form-draft'

function renderForm() {
  return renderHook(() => {
    const [description, setDescription] = useFormDraft(
      'expense',
      'description',
      '',
      { input: true }
    )
    const [scenario, setScenario] = useFormDraft(
      'expense',
      'scenario',
      'personal'
    )
    return { description, setDescription, scenario, setScenario }
  })
}

describe('form draft persistence', () => {
  beforeEach(() => {
    resetFormDrafts()
    window.sessionStorage.clear()
  })

  it('counts only non-empty input fields as unsaved input', () => {
    const { result } = renderForm()
    expect(hasUnsavedFormInput()).toBe(false)

    act(() => result.current.setScenario('pocket'))
    expect(hasUnsavedFormInput()).toBe(false)

    act(() => result.current.setDescription('  '))
    expect(hasUnsavedFormInput()).toBe(false)

    act(() => result.current.setDescription('Кофе'))
    expect(hasUnsavedFormInput()).toBe(true)
  })

  it('restores persisted drafts into a mounted form once', () => {
    const first = renderForm()
    act(() => first.result.current.setDescription('Кофе'))
    persistFormDrafts()
    first.unmount()
    resetFormDrafts()

    const second = renderForm()
    expect(second.result.current.description).toBe('Кофе')
    expect(window.sessionStorage.getItem(PERSISTED_DRAFTS_KEY)).toBeNull()
  })

  it('persists a submitted form that has no new input', () => {
    const { result } = renderForm()
    act(() => result.current.setDescription('Обед'))
    holdSubmittedDraft('expense')
    act(() => result.current.setDescription(''))

    persistFormDrafts()

    expect(
      JSON.parse(window.sessionStorage.getItem(PERSISTED_DRAFTS_KEY) ?? '{}')
    ).toMatchObject({ 'expense:description': 'Обед' })
  })

  it('prefers new input over a submitted draft', () => {
    const { result } = renderForm()
    act(() => result.current.setDescription('Обед'))
    holdSubmittedDraft('expense')
    act(() => result.current.setDescription('Ужин'))

    persistFormDrafts()

    expect(
      JSON.parse(window.sessionStorage.getItem(PERSISTED_DRAFTS_KEY) ?? '{}')
    ).toMatchObject({ 'expense:description': 'Ужин' })
  })

  it('forgets a submitted draft once the save succeeded', () => {
    const { result } = renderForm()
    act(() => result.current.setDescription('Обед'))
    const release = holdSubmittedDraft('expense')
    act(() => result.current.setDescription(''))
    release()

    persistFormDrafts()

    expect(
      JSON.parse(window.sessionStorage.getItem(PERSISTED_DRAFTS_KEY) ?? '{}')
    ).toMatchObject({ 'expense:description': '' })
  })

  it('ignores a malformed stored entry', () => {
    window.sessionStorage.setItem(PERSISTED_DRAFTS_KEY, '{not json')
    restorePersistedFormDrafts()
    const { result } = renderForm()
    expect(result.current.description).toBe('')
  })
})
