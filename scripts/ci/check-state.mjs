// Pure classification of a GitHub Actions run of the E2E workflow.
// It looks at the job steps, not only at the run status: GitHub can keep a job
// `in_progress` after every step finished, so the run status alone does not
// tell a hanging test from a run GitHub has not closed yet.
// Used by `wait-for-check.mjs`; kept free of I/O so it can be tested on
// recorded `gh api` responses.

export const DEFAULTS = {
  workflow: 'E2E',
  job: 'e2e',
  testStep: 'Run e2e tests',
  expected: 15,
  closeGrace: 3,
  timeout: 40,
  interval: 60,
}

/** States after which waiting cannot change the result without a rerun. */
export const TERMINAL = new Set([
  'passed',
  'failed',
  'cancelled',
  'cancelled-in-queue',
  'cancelled-after-pass',
])

export const EXIT = {
  passed: 0,
  failed: 1,
  cancelled: 1,
  'cancelled-in-queue': 1,
  'cancelled-after-pass': 1,
  'stuck-running': 2,
  timeout: 3,
  error: 4,
}

const GREEN = new Set(['success', 'skipped', 'neutral'])
const minutes = (from, to) => (to - Date.parse(from)) / 60000
const round = (value) => Math.round(value * 10) / 10

/** Picks the latest run of the workflow, ignoring skipped runs. */
export function selectRun(runs, workflow = DEFAULTS.workflow) {
  return (
    runs
      .filter((run) => run.name === workflow && run.conclusion !== 'skipped')
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0] ??
    null
  )
}

function stepSummary(step) {
  if (!step) return null
  return {
    name: step.name,
    status: step.status,
    conclusion: step.conclusion,
    startedAt: step.started_at,
    completedAt: step.completed_at,
  }
}

/**
 * Classifies one run attempt.
 * `run` is a workflow run (or null when none exists yet), `jobs` its jobs for
 * the same attempt, `now` a millisecond timestamp.
 */
export function classify(run, jobs, now, opts = {}) {
  const o = { ...DEFAULTS, ...opts }
  if (!run) {
    return {
      state: 'waiting-run',
      terminal: false,
      message:
        'no run for this commit yet; GitHub has not started the E2E workflow',
    }
  }

  const job = jobs.find((j) => j.name === o.job) ?? jobs[0] ?? null
  const steps = job?.steps ?? []
  const test = steps.find((s) => s.name === o.testStep) ?? null
  const started = steps.some((s) => s.status !== 'queued' && s.started_at)
  const allDone =
    steps.length > 0 && steps.every((s) => s.status === 'completed')
  const allGreen = allDone && steps.every((s) => GREEN.has(s.conclusion))
  const testPassed = test?.conclusion === 'success'
  const failedStep = steps.find(
    (s) => s.conclusion === 'failure' || s.conclusion === 'timed_out'
  )
  const lastStepEnd = steps
    .map((s) => (s.completed_at ? Date.parse(s.completed_at) : 0))
    .reduce((a, b) => Math.max(a, b), 0)

  const base = {
    runId: run.id,
    attempt: run.run_attempt,
    sha: run.head_sha,
    runStatus: run.status,
    runConclusion: run.conclusion,
    jobId: job?.id ?? null,
    jobStatus: job?.status ?? null,
    jobConclusion: job?.conclusion ?? null,
    testStep: stepSummary(test),
  }
  const result = (state, message, extra = {}) => ({
    state,
    terminal: TERMINAL.has(state),
    message,
    ...base,
    ...extra,
  })

  if (run.status === 'completed') {
    if (run.conclusion === 'success')
      return result('passed', 'all steps passed')
    if (run.conclusion === 'cancelled') {
      if (!job || !job.started_at || !started) {
        return result(
          'cancelled-in-queue',
          'cancelled before the job started (superseded in the concurrency group)'
        )
      }
      if (allGreen && testPassed) {
        return result(
          'cancelled-after-pass',
          'tests passed, but GitHub cancelled the job after the last step; rerun to get a green check'
        )
      }
      return result(
        'cancelled',
        test?.conclusion === 'cancelled'
          ? 'cancelled while tests were running (job timeout: likely a real hang)'
          : 'cancelled before tests passed'
      )
    }
    return result('failed', `run ${run.conclusion}`, {
      failedStep: stepSummary(failedStep),
    })
  }

  if (!job || !job.started_at || !started || job.status === 'queued') {
    return result(
      'queued',
      'waiting for a runner or for its CI slot queue e2e-slot-<n>'
    )
  }

  if (test && test.status === 'in_progress' && test.started_at) {
    const elapsed = round(minutes(test.started_at, now))
    return elapsed > o.expected
      ? result(
          'stuck-running',
          `test step running ${elapsed} min, longer than ${o.expected} min`,
          { elapsed }
        )
      : result('running', `test step running ${elapsed} min`, { elapsed })
  }

  if (allDone && testPassed && allGreen) {
    const since = round((now - lastStepEnd) / 60000)
    if (since >= o.closeGrace) {
      return result(
        'stuck-after-pass',
        `all steps passed ${since} min ago, but GitHub has not completed the ${
          job.status === 'completed' ? 'run' : 'job'
        }`,
        { since }
      )
    }
    return result('running', 'all steps passed; GitHub is closing the job', {
      since,
    })
  }

  if (failedStep) {
    return result(
      'running',
      `step "${failedStep.name}" failed; job is finishing`,
      {
        failedStep: stepSummary(failedStep),
      }
    )
  }
  return result('running', 'job is preparing the test step')
}

/** Finds the Playwright summary such as "109 passed (9.6m)" in a log. */
export function passedSummary(log) {
  const matches = [...String(log).matchAll(/(\d+) passed \(([^)]+)\)/g)]
  const last = matches.at(-1)
  return last ? `${last[1]} passed (${last[2]})` : null
}

/**
 * Returns the log lines written while a step ran. Job logs prefix each line
 * with an ISO timestamp; the step timestamps have one-second precision.
 */
export function stepLog(log, step, tail = 40) {
  if (!step?.started_at) return []
  const from = Date.parse(step.started_at)
  const to = step.completed_at ? Date.parse(step.completed_at) + 1000 : Infinity
  const lines = String(log)
    .split(/\r?\n/)
    .filter((line) => {
      const stamp = Date.parse(`${line.slice(0, 19)}Z`)
      return !Number.isNaN(stamp) && stamp >= from && stamp < to
    })
  return lines.slice(-tail)
}

/** Parses CLI arguments. Throws on an unknown option. */
export function parseArgs(argv) {
  const opts = {
    target: null,
    workflow: DEFAULTS.workflow,
    expected: DEFAULTS.expected,
    timeout: DEFAULTS.timeout,
    interval: DEFAULTS.interval,
    rerun: false,
    once: false,
    json: false,
  }
  const numeric = new Set(['expected', 'timeout', 'interval'])
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) {
      if (opts.target) throw new Error(`unexpected argument: ${arg}`)
      opts.target = arg
      continue
    }
    const [name, inline] = arg.slice(2).split(/=(.*)/s)
    if (['rerun', 'once', 'json'].includes(name)) opts[name] = true
    else if (name === 'watch') opts.once = false
    else if (name === 'workflow' || numeric.has(name)) {
      const value = inline ?? argv[(i += 1)]
      if (value === undefined) throw new Error(`--${name} needs a value`)
      opts[name] = numeric.has(name) ? Number(value) : value
      if (numeric.has(name) && !(opts[name] > 0)) {
        throw new Error(`--${name} must be a positive number`)
      }
    } else throw new Error(`unknown option: ${arg}`)
  }
  if (!opts.target) throw new Error('missing <pr-number|sha>')
  if (/^\d+$/.test(opts.target)) opts.pr = Number(opts.target)
  else if (/^[0-9a-f]{7,40}$/i.test(opts.target)) opts.sha = opts.target
  else throw new Error(`not a PR number or commit SHA: ${opts.target}`)
  return opts
}
