import {
  EXIT,
  classify,
  parseArgs,
  passedSummary,
  selectRun,
  stepLog,
} from '../ci/check-state.mjs'
import cancelledInQueue from './fixtures/ci-wait/cancelled-in-queue.json'
import failed from './fixtures/ci-wait/failed.json'
import incident from './fixtures/ci-wait/incident-attempt-1.json'
import passed from './fixtures/ci-wait/incident-attempt-2.json'

const at = (iso) => Date.parse(iso)
const clone = (value) => JSON.parse(JSON.stringify(value))

// Run 39277150877 attempt 1 as GitHub showed it between the job timeout and
// the run close: every step green, job and run still open.
function incidentWhileOpen({ jobOpen }) {
  const fx = clone(incident)
  fx.run.status = 'in_progress'
  fx.run.conclusion = null
  const job = fx.jobs[0]
  if (jobOpen) {
    job.status = 'in_progress'
    job.conclusion = null
    job.completed_at = null
  }
  return fx
}

describe('classify', () => {
  it('reports stuck-after-pass while GitHub keeps a green job open', () => {
    const fx = incidentWhileOpen({ jobOpen: true })
    const state = classify(fx.run, fx.jobs, at('2026-10-19T15:41:00Z'))
    expect(state.state).toBe('stuck-after-pass')
    expect(state.terminal).toBe(false)
    expect(state.testStep.conclusion).toBe('success')
  })

  it('keeps stuck-after-pass after the job timeout until the run closes', () => {
    const fx = incidentWhileOpen({ jobOpen: false })
    const state = classify(fx.run, fx.jobs, at('2026-10-19T16:00:00Z'))
    expect(state.state).toBe('stuck-after-pass')
  })

  it('reports running for the first minutes after the last step', () => {
    const fx = incidentWhileOpen({ jobOpen: true })
    const state = classify(fx.run, fx.jobs, at('2026-10-19T15:39:00Z'))
    expect(state.state).toBe('running')
  })

  it('reports cancelled-after-pass once the run is closed', () => {
    const state = classify(
      incident.run,
      incident.jobs,
      at('2026-10-19T16:07:00Z')
    )
    expect(state.state).toBe('cancelled-after-pass')
    expect(state.terminal).toBe(true)
  })

  it('reports passed for a successful run', () => {
    const state = classify(passed.run, passed.jobs, at('2026-10-19T16:30:00Z'))
    expect(state.state).toBe('passed')
    expect(EXIT[state.state]).toBe(0)
  })

  it('reports failed with the failed step', () => {
    const state = classify(failed.run, failed.jobs, at('2026-10-19T11:00:00Z'))
    expect(state.state).toBe('failed')
    expect(state.failedStep.name).toBe('Run e2e tests')
    expect(EXIT[state.state]).toBe(1)
  })

  it('reports cancelled-in-queue for a run cancelled before its job', () => {
    const state = classify(
      cancelledInQueue.run,
      cancelledInQueue.jobs,
      at('2026-10-19T10:20:00Z')
    )
    expect(state.state).toBe('cancelled-in-queue')
  })

  it('reports cancelled when the job is cancelled during the tests', () => {
    const fx = clone(passed)
    fx.run.conclusion = 'cancelled'
    const test = fx.jobs[0].steps.find((s) => s.name === 'Run e2e tests')
    test.conclusion = 'cancelled'
    const state = classify(fx.run, fx.jobs, at('2026-10-19T16:30:00Z'))
    expect(state.state).toBe('cancelled')
  })

  describe('with the test step in progress', () => {
    function inProgress() {
      const fx = clone(passed)
      fx.run.status = 'in_progress'
      fx.run.conclusion = null
      const job = fx.jobs[0]
      job.status = 'in_progress'
      job.conclusion = null
      job.completed_at = null
      let reached = false
      for (const step of job.steps) {
        if (step.name === 'Run e2e tests') {
          reached = true
          step.status = 'in_progress'
          step.conclusion = null
          step.completed_at = null
        } else if (reached) {
          Object.assign(step, {
            status: 'queued',
            conclusion: null,
            started_at: null,
            completed_at: null,
          })
        }
      }
      return fx
    }

    it('reports running within the expected time', () => {
      const fx = inProgress()
      const state = classify(fx.run, fx.jobs, at('2026-10-19T16:15:00Z'))
      expect(state.state).toBe('running')
    })

    it('reports stuck-running past the expected time', () => {
      const fx = inProgress()
      const state = classify(fx.run, fx.jobs, at('2026-10-19T16:25:00Z'))
      expect(state.state).toBe('stuck-running')
      expect(EXIT[state.state]).toBe(2)
    })

    it('honours a custom expected time', () => {
      const fx = inProgress()
      const state = classify(fx.run, fx.jobs, at('2026-10-19T16:15:00Z'), {
        expected: 5,
      })
      expect(state.state).toBe('stuck-running')
    })
  })

  it('reports queued before the job starts', () => {
    const fx = clone(cancelledInQueue)
    fx.run.status = 'queued'
    fx.run.conclusion = null
    const state = classify(fx.run, [], at('2026-10-19T10:16:00Z'))
    expect(state.state).toBe('queued')
  })

  it('reports waiting-run without a run', () => {
    expect(classify(null, [], Date.now()).state).toBe('waiting-run')
  })
})

describe('selectRun', () => {
  it('picks the latest non-skipped run of the workflow', () => {
    const runs = [
      {
        id: 1,
        name: 'E2E',
        conclusion: 'success',
        created_at: '2026-10-19T10:00:00Z',
      },
      {
        id: 2,
        name: 'E2E',
        conclusion: 'skipped',
        created_at: '2026-10-19T12:00:00Z',
      },
      {
        id: 3,
        name: 'CI',
        conclusion: 'success',
        created_at: '2026-10-19T13:00:00Z',
      },
      {
        id: 4,
        name: 'E2E',
        conclusion: null,
        created_at: '2026-10-19T11:00:00Z',
      },
    ]
    expect(selectRun(runs).id).toBe(4)
    expect(selectRun([])).toBeNull()
  })
})

describe('log helpers', () => {
  const log = [
    '2026-10-19T15:28:05.1000000Z before',
    '2026-10-19T15:28:06.2000000Z Running 109 tests',
    '2026-10-19T15:37:43.1000000Z   109 passed (9.6m)',
    '2026-10-19T15:37:44.5000000Z after',
  ].join('\n')

  it('finds the Playwright passed summary', () => {
    expect(passedSummary(log)).toBe('109 passed (9.6m)')
    expect(passedSummary('nothing')).toBeNull()
  })

  it('cuts the lines of one step', () => {
    const step = {
      started_at: '2026-10-19T15:28:06Z',
      completed_at: '2026-10-19T15:37:43Z',
    }
    expect(stepLog(log, step)).toEqual([
      '2026-10-19T15:28:06.2000000Z Running 109 tests',
      '2026-10-19T15:37:43.1000000Z   109 passed (9.6m)',
    ])
    expect(stepLog(log, step, 1)).toHaveLength(1)
  })
})

describe('parseArgs', () => {
  it('reads a PR number and options', () => {
    const opts = parseArgs(['109', '--expected', '10', '--rerun', '--once'])
    expect(opts).toMatchObject({
      pr: 109,
      expected: 10,
      rerun: true,
      once: true,
    })
  })

  it('reads a commit SHA and an inline workflow', () => {
    const opts = parseArgs(['5eec09c', '--workflow=CI', '--json'])
    expect(opts).toMatchObject({ sha: '5eec09c', workflow: 'CI', json: true })
  })

  it('rejects bad input', () => {
    expect(() => parseArgs([])).toThrow('missing')
    expect(() => parseArgs(['109', '--nope'])).toThrow('unknown option')
    expect(() => parseArgs(['109', '--timeout', '0'])).toThrow('positive')
    expect(() => parseArgs(['main'])).toThrow('not a PR number')
  })
})
