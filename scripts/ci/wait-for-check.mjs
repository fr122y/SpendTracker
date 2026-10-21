#!/usr/bin/env node
// Waits for the E2E check of a Pull Request or commit and says what
// state it is really in, judging by the job steps. See "Waiting For CI" in
// docs/engineering/agent-workflow.md.
//
// Usage: npm run ci:wait -- <pr-number|sha> [--workflow NAME]
//   [--expected 15] [--timeout 40] [--interval 60] [--rerun] [--once] [--json]
//
// Calls GitHub through the `gh` CLI, so it uses the caller's `gh` login.

import { execFileSync } from 'node:child_process'

import {
  EXIT,
  classify,
  parseArgs,
  passedSummary,
  selectRun,
  stepLog,
} from './check-state.mjs'

const REPO = 'repos/{owner}/{repo}'

function gh(args, { json = true } = {}) {
  const out = execFileSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return json ? JSON.parse(out) : out
}

const api = (path) => gh(['api', `${REPO}/${path}`])

function jobLog(jobId) {
  try {
    return gh(['api', `${REPO}/actions/jobs/${jobId}/logs`], { json: false })
  } catch {
    return ''
  }
}

function headSha(opts) {
  return opts.sha ?? api(`pulls/${opts.pr}`).head.sha
}

function snapshot(opts) {
  const sha = headSha(opts)
  const { workflow_runs: runs } = api(
    `actions/runs?head_sha=${sha}&per_page=100`
  )
  const run = selectRun(runs, opts.workflow)
  const jobs = run
    ? api(`actions/runs/${run.id}/attempts/${run.run_attempt}/jobs`).jobs
    : []
  const state = classify(run, jobs, Date.now(), { expected: opts.expected })
  return { sha, run, jobs, state: { ...state, sha } }
}

function queueAhead(run, workflow) {
  try {
    const active = ['in_progress', 'queued', 'waiting', 'pending'].flatMap(
      (status) => api(`actions/runs?status=${status}&per_page=50`).workflow_runs
    )
    return active.filter(
      (r) =>
        r.name === workflow &&
        r.id !== run.id &&
        Date.parse(r.created_at) < Date.parse(run.created_at)
    ).length
  } catch {
    return null
  }
}

/** Adds log-derived details: "N passed" or the failed step's tail. */
function enrich(snap, opts) {
  const { state, run } = snap
  if (state.state === 'queued' && run) {
    const ahead = queueAhead(run, opts.workflow)
    if (ahead !== null) state.ahead = ahead
  }
  const wantsPassed = [
    'stuck-after-pass',
    'cancelled-after-pass',
    'passed',
  ].includes(state.state)
  const wantsFailure = state.state === 'failed' && state.jobId
  if ((wantsPassed || wantsFailure) && state.jobId) {
    const log = jobLog(state.jobId)
    if (wantsPassed) state.summary = passedSummary(log)
    if (wantsFailure) {
      const job = snap.jobs.find((j) => j.id === state.jobId)
      const step = job?.steps.find((s) => s.name === state.failedStep?.name)
      state.logTail = stepLog(log, step, 40)
    }
  }
  return state
}

function line(state) {
  const time = new Date().toISOString().slice(11, 19)
  const where = state.runId ? ` run ${state.runId}#${state.attempt}` : ''
  const extra = [
    state.summary,
    state.ahead !== undefined ? `${state.ahead} run(s) ahead` : null,
  ]
    .filter(Boolean)
    .join(', ')
  return `${time} ${state.state}${where}: ${state.message}${extra ? ` (${extra})` : ''}`
}

function printDetails(state) {
  if (state.state === 'failed' && state.failedStep) {
    console.log(`failed step: ${state.failedStep.name}`)
    for (const l of state.logTail ?? []) console.log(`  ${l}`)
  }
  if (state.state === 'stuck-after-pass') {
    console.log(
      'tests already passed; continue other work. Check https://www.githubstatus.com/ if this lasts.'
    )
  }
}

function rerun(runId) {
  gh(['run', 'rerun', String(runId)], { json: false })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  let opts
  try {
    opts = parseArgs(process.argv.slice(2))
  } catch (error) {
    console.error(`ci:wait: ${error.message}`)
    console.error(
      'usage: npm run ci:wait -- <pr-number|sha> [--workflow NAME] [--expected 15] [--timeout 40] [--interval 60] [--rerun] [--once] [--json]'
    )
    return EXIT.error
  }

  const deadline = Date.now() + opts.timeout * 60000
  const reruns = new Set()
  let last = null
  let lastKey = null

  for (;;) {
    let snap
    try {
      snap = snapshot(opts)
    } catch (error) {
      console.error(`ci:wait: ${String(error.stderr || error.message).trim()}`)
      return EXIT.error
    }
    const state = enrich(snap, opts)
    last = state
    const key = `${state.state}:${state.runId}:${state.attempt}`
    if (key !== lastKey && !opts.json) {
      console.log(line(state))
      printDetails(state)
    }
    lastKey = key

    const canRerun =
      opts.rerun &&
      ['cancelled-after-pass', 'cancelled-in-queue'].includes(state.state) &&
      !reruns.has(key)
    if (canRerun) {
      try {
        rerun(state.runId)
        reruns.add(key)
        if (!opts.json) console.log(`rerun requested for run ${state.runId}`)
      } catch (error) {
        console.error(
          `ci:wait: rerun failed: ${String(error.stderr || error.message).trim()}`
        )
        return EXIT.error
      }
    } else if ((state.terminal && !reruns.has(key)) || opts.once) {
      break
    }

    if (Date.now() + opts.interval * 1000 > deadline) {
      if (opts.json) console.log(JSON.stringify(last, null, 2))
      else
        console.log(`timeout after ${opts.timeout} min in state ${last.state}`)
      return last.state === 'stuck-running'
        ? EXIT['stuck-running']
        : EXIT.timeout
    }
    await sleep(opts.interval * 1000)
  }

  if (opts.json) console.log(JSON.stringify(last, null, 2))
  if (last.state in EXIT) return EXIT[last.state]
  return EXIT.timeout
}

process.exitCode = await main()
