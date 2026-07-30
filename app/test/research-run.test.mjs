import test from 'node:test'
import assert from 'node:assert/strict'
import {
  appendResearchCandidate,
  appendToolEvent,
  canAttemptResearchPath,
  createResearchPlan,
  ensureProjectResearchShape,
  researchPathFingerprint,
  transitionResearchRun,
} from '../src/research-run.mjs'

function basePlan(overrides = {}) {
  return {
    id: 'run-1',
    projectId: 'project-a',
    question: 'Welche Befunde tragen die Aussage?',
    claimId: 'claim-1',
    claimText: 'Die Intervention senkt in dieser Stichprobe die Fehlerrate.',
    allowedTools: ['search', 'metadata', 'reader', 'import'],
    searchPaths: [
      { id: 'support', purpose: 'support', tool: 'search', input: { query: 'intervention error rate study' } },
      { id: 'counter', purpose: 'counter-evidence', tool: 'search', input: { query: 'intervention no effect replication' } },
      { id: 'limits', purpose: 'limitations', tool: 'search', input: { query: 'intervention limitations sample' } },
    ],
    stopConditions: { maxToolCalls: 12, maxSources: 6, maxConsecutiveFailures: 3 },
    createdAt: 100,
    ...overrides,
  }
}

test('RESEARCH-01: ein vollständiger Plan existiert vor dem ersten Werkzeugereignis', () => {
  const run = createResearchPlan(basePlan())
  assert.equal(run.status, 'planned')
  assert.equal(run.history[0].kind, 'planned')
  assert.deepEqual(run.toolEvents, [])
  assert.equal(run.question, basePlan().question)
  assert.deepEqual(run.stopConditions, basePlan().stopConditions)
  assert.deepEqual(run.searchPaths.map(path => path.purpose), ['support', 'counter-evidence', 'limitations'])
})

test('RESEARCH-01: unvollständige oder nicht begrenzte Pläne werden abgewiesen', () => {
  assert.throws(() => createResearchPlan(basePlan({ question: '' })), /question/i)
  assert.throws(() => createResearchPlan(basePlan({ allowedTools: ['shell'] })), /tool/i)
  assert.throws(() => createResearchPlan(basePlan({ searchPaths: basePlan().searchPaths.slice(0, 1) })), /counter-evidence/i)
  assert.throws(() => createResearchPlan(basePlan({ stopConditions: { maxToolCalls: 0 } })), /stop/i)
})

test('AC-B2-6: nur legale Statusübergänge sind möglich und bleiben historisch', () => {
  const planned = createResearchPlan(basePlan())
  const running = transitionResearchRun(planned, 'running', { at: 110, reason: 'user-start' })
  const paused = transitionResearchRun(running, 'paused', { at: 120, reason: 'user-pause' })
  const resumed = transitionResearchRun(paused, 'running', { at: 130, reason: 'user-resume' })
  const review = transitionResearchRun(resumed, 'review-ready', { at: 140, reason: 'paths-complete' })
  const cancelled = transitionResearchRun(review, 'cancelled', { at: 150, reason: 'user-cancel' })
  assert.deepEqual(cancelled.history.map(event => event.nextStatus), [
    'planned', 'running', 'paused', 'running', 'review-ready', 'cancelled',
  ])
  assert.throws(() => transitionResearchRun(cancelled, 'running', { at: 160 }), /transition/i)
})

test('AC-B2-6: Werkzeugereignisse und Kandidaten mutieren den vorherigen Lauf nicht', () => {
  const run = transitionResearchRun(createResearchPlan(basePlan()), 'running', { at: 110 })
  const withEvent = appendToolEvent(run, {
    id: 'event-1',
    status: 'completed',
    tool: 'search',
    claimId: 'claim-1',
    input: { query: 'x' },
    pathFingerprint: 'path-x',
    startedAt: 120,
    endedAt: 121,
    adapter: { name: 'fixture', version: '1' },
    resultRef: 'result-1',
  })
  const withCandidate = appendResearchCandidate(withEvent, {
    id: 'candidate-1',
    projectId: 'project-a',
    runId: 'run-1',
    claimId: 'claim-1',
    relation: 'supports',
    accessLevel: 'metadata',
    status: 'research-material',
  })
  assert.equal(run.toolEvents.length, 0)
  assert.equal(withEvent.candidates.length, 0)
  assert.equal(withCandidate.toolEvents.length, 1)
  assert.equal(withCandidate.candidates.length, 1)
  assert.throws(() => appendResearchCandidate(withEvent, {
    id: 'foreign',
    projectId: 'project-b',
    runId: 'run-1',
    claimId: 'claim-1',
  }), /project/i)
})

test('RESEARCH-04: ein identischer Fehlweg bleibt bis zur Zustandsänderung gesperrt', () => {
  const run = transitionResearchRun(createResearchPlan(basePlan()), 'running', { at: 110 })
  const path = { tool: 'search', input: { query: 'same query', limit: 10 }, sourceState: 'paywalled-v1' }
  const fingerprint = researchPathFingerprint(path)
  const failed = appendToolEvent(run, {
    id: 'failed-1',
    status: 'failed',
    tool: 'search',
    claimId: 'claim-1',
    input: path.input,
    pathFingerprint: fingerprint,
    sourceState: path.sourceState,
    startedAt: 120,
    endedAt: 121,
    adapter: { name: 'fixture', version: '1' },
    resultRef: null,
  })
  assert.equal(canAttemptResearchPath(failed, path), false)
  assert.equal(canAttemptResearchPath(failed, { ...path, sourceState: 'repository-found-v2' }), true)
  assert.equal(researchPathFingerprint({ ...path, input: { limit: 10, query: 'same query' } }), fingerprint)
})

test('AC-B2-9: ältere und beschädigte Projekte migrieren additiv', () => {
  const legacy = { id: 'project-a', sources: [{ id: 'keep' }], evidenceBundles: [] }
  assert.deepEqual(ensureProjectResearchShape(legacy).researchRuns, [])
  const corrupt = { id: 'project-b', researchRuns: { bad: true } }
  assert.deepEqual(ensureProjectResearchShape(corrupt).researchRuns, [])
})
