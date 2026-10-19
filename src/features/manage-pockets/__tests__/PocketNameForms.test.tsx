import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { resetFormDrafts } from '@/shared/lib/hooks/use-form-draft'

import { CreatePocketForm } from '../ui/create-pocket-form'
import { RenamePocketForm } from '../ui/rename-pocket-form'

class MockPocketNameConflictError extends Error {
  constructor(readonly conflictingName: string) {
    super('Active pocket with the same name exists')
  }
}

const mockCreatePocket = jest.fn()
const mockRenamePocket = jest.fn()
let mockPockets: Array<{
  id: string
  name: string
  archivedAt?: string
  createdAt: string
}> = []

jest.mock('@/entities/pocket', () => ({
  usePockets: () => ({ data: mockPockets }),
  useCreatePocket: () => ({ mutateAsync: mockCreatePocket, isPending: false }),
  useRenamePocket: () => ({ mutateAsync: mockRenamePocket, isPending: false }),
  get PocketNameConflictError() {
    return MockPocketNameConflictError
  },
}))

const CONFLICT_MESSAGE = 'Карман с таким названием уже есть'

// Form drafts outlive a rendered form; start every test with empty ones.
beforeEach(() => resetFormDrafts())

describe('pocket name forms', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreatePocket.mockResolvedValue(undefined)
    mockRenamePocket.mockResolvedValue(undefined)
    mockPockets = [
      { id: 'pocket-1', name: 'Отпуск', createdAt: '2026-01-01T00:00:00Z' },
      {
        id: 'pocket-2',
        name: 'Ремонт',
        archivedAt: '2026-02-01T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]
  })

  it('creates one pocket for a rapid double and triple submit', async () => {
    let resolveRequest!: () => void
    mockCreatePocket.mockImplementationOnce(
      () => new Promise<void>((resolve) => (resolveRequest = resolve))
    )
    render(<CreatePocketForm />)
    fireEvent.change(screen.getByLabelText('Название кармана'), {
      target: { value: 'Дабл ТЕСТ' },
    })
    const form = screen
      .getByRole('button', { name: 'Создать карман' })
      .closest('form')!

    fireEvent.submit(form)
    fireEvent.submit(form)
    fireEvent.submit(form)

    expect(mockCreatePocket).toHaveBeenCalledTimes(1)
    await act(async () => resolveRequest())
    expect(mockCreatePocket).toHaveBeenCalledWith({ name: 'Дабл ТЕСТ' })
    expect(mockCreatePocket).toHaveBeenCalledTimes(1)
  })

  it('rejects an active pocket name ignoring case and outer spaces', () => {
    render(<CreatePocketForm />)
    fireEvent.change(screen.getByLabelText('Название кармана'), {
      target: { value: '  оТПУСК ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать карман' }))

    expect(screen.getByRole('alert')).toHaveTextContent(CONFLICT_MESSAGE)
    expect(mockCreatePocket).not.toHaveBeenCalled()
  })

  it('allows the name of an archived pocket', async () => {
    render(<CreatePocketForm />)
    fireEvent.change(screen.getByLabelText('Название кармана'), {
      target: { value: 'ремонт' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать карман' }))

    await waitFor(() =>
      expect(mockCreatePocket).toHaveBeenCalledWith({ name: 'ремонт' })
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the server name conflict instead of the generic error', async () => {
    mockCreatePocket.mockRejectedValueOnce(
      new MockPocketNameConflictError('Ноутбук')
    )
    render(<CreatePocketForm />)
    fireEvent.change(screen.getByLabelText('Название кармана'), {
      target: { value: 'Ноутбук' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать карман' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(CONFLICT_MESSAGE)
  })

  it('rejects renaming to another active pocket name', async () => {
    mockPockets.push({
      id: 'pocket-3',
      name: 'Подарки',
      createdAt: '2026-01-01T00:00:00Z',
    })
    render(
      <RenamePocketForm
        pocketId="pocket-3"
        initialName="Подарки"
        onDone={jest.fn()}
      />
    )
    fireEvent.change(screen.getByLabelText('Новое название'), {
      target: { value: 'отпуск ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(screen.getByRole('alert')).toHaveTextContent(CONFLICT_MESSAGE)
    expect(mockRenamePocket).not.toHaveBeenCalled()
  })

  it('allows changing only the case of the own name', async () => {
    const onDone = jest.fn()
    render(
      <RenamePocketForm
        pocketId="pocket-1"
        initialName="Отпуск"
        onDone={onDone}
      />
    )
    fireEvent.change(screen.getByLabelText('Новое название'), {
      target: { value: 'ОТПУСК' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(onDone).toHaveBeenCalled())
    expect(mockRenamePocket).toHaveBeenCalledWith({
      id: 'pocket-1',
      name: 'ОТПУСК',
    })
  })
})
