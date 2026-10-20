import {
  createTempId,
  getKnownId,
  isPendingId,
  isPendingIdLostError,
  isTempId,
  PendingIdLostError,
  replaceRecordId,
  resetPendingIds,
  resolveId,
  resolveIdFields,
  subscribePendingIds,
  trackPendingId,
} from '../pending-ids'

describe('pending ids', () => {
  beforeEach(() => resetPendingIds())

  it('marks temporary ids', () => {
    expect(isTempId(createTempId())).toBe(true)
    expect(isTempId('5f0c…')).toBe(false)
    expect(isTempId(undefined)).toBe(false)
  })

  it('returns a saved id at once', async () => {
    await expect(resolveId('real-1')).resolves.toBe('real-1')
    expect(isPendingId('real-1')).toBe(false)
    expect(getKnownId('real-1')).toBe('real-1')
  })

  it('waits for the create and resolves to the stored id', async () => {
    const pending = trackPendingId('temp-1')
    const resolved = jest.fn()
    void resolveId('temp-1').then(resolved)
    await Promise.resolve()
    expect(resolved).not.toHaveBeenCalled()
    expect(isPendingId('temp-1')).toBe(true)
    expect(getKnownId('temp-1')).toBeUndefined()

    pending.resolve('real-1')

    await expect(resolveId('temp-1')).resolves.toBe('real-1')
    expect(resolved).toHaveBeenCalledWith('real-1')
    expect(isPendingId('temp-1')).toBe(false)
    expect(getKnownId('temp-1')).toBe('real-1')
  })

  it('waits for an insert that keeps its client id', async () => {
    const pending = trackPendingId('client-1')
    expect(isPendingId('client-1')).toBe(true)
    const result = resolveId('client-1')
    pending.resolve('client-1')
    await expect(result).resolves.toBe('client-1')
    expect(isPendingId('client-1')).toBe(false)
  })

  it('rejects waiting operations when the create fails', async () => {
    const pending = trackPendingId('temp-1')
    const result = resolveId('temp-1')
    pending.reject()
    await expect(result).rejects.toBeInstanceOf(PendingIdLostError)
    await expect(resolveId('temp-1')).rejects.toBeInstanceOf(PendingIdLostError)
    expect(isPendingIdLostError(new PendingIdLostError('temp-1'))).toBe(true)
    expect(isPendingIdLostError(new Error('other'))).toBe(false)
  })

  it('never sends an unknown temporary id', async () => {
    await expect(resolveId('temp-unknown')).rejects.toBeInstanceOf(
      PendingIdLostError
    )
    expect(isPendingId('temp-unknown')).toBe(true)
  })

  it('settles only once', async () => {
    const pending = trackPendingId('temp-1')
    pending.resolve('real-1')
    pending.reject()
    pending.resolve('real-2')
    await expect(resolveId('temp-1')).resolves.toBe('real-1')
  })

  it('resolves id fields and keeps the rest', async () => {
    const pending = trackPendingId('temp-pocket')
    const result = resolveIdFields(
      { pocketId: 'temp-pocket', projectId: undefined, amount: 5 },
      ['pocketId', 'projectId']
    )
    pending.resolve('pocket-1')
    await expect(result).resolves.toEqual({
      pocketId: 'pocket-1',
      projectId: undefined,
      amount: 5,
    })
  })

  it('notifies listeners when an id settles', () => {
    const listener = jest.fn()
    const unsubscribe = subscribePendingIds(listener)
    trackPendingId('temp-1').resolve('real-1')
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    trackPendingId('temp-2').reject()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('replaces one row id and keeps its fields', () => {
    const rows = [
      { id: 'temp-1', name: 'Новый' },
      { id: 'other', name: 'Старый' },
    ]
    expect(replaceRecordId(rows, 'temp-1', 'real-1')).toEqual([
      { id: 'real-1', name: 'Новый' },
      { id: 'other', name: 'Старый' },
    ])
    expect(replaceRecordId(undefined, 'temp-1', 'real-1')).toBeUndefined()
  })
})
