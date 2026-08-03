import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createResearchAdapter,
  executeResearchTool,
  legalAlternativePaths,
  redactResearchSecrets,
} from '../src/research-adapter.mjs'
import { createResearchPlan, transitionResearchRun } from '../src/research-run.mjs'

function runningPlan() {
  return transitionResearchRun(createResearchPlan({
    id: 'run-adapter',
    projectId: 'project-a',
    question: 'Was stützt oder widerlegt die Aussage?',
    claimId: 'claim-a',
    claimText: 'Eine Aussage.',
    allowedTools: ['search', 'metadata', 'reader', 'import'],
    searchPaths: [
      { id: 's', purpose: 'support', tool: 'search', input: { query: 'support' } },
      { id: 'c', purpose: 'counter-evidence', tool: 'search', input: { query: 'counter' } },
      { id: 'l', purpose: 'limitations', tool: 'search', input: { query: 'limitations' } },
    ],
    stopConditions: { maxToolCalls: 8, maxSources: 4, maxConsecutiveFailures: 2 },
    createdAt: 1,
  }), 'running', { at: 2 })
}

test('RESEARCH-07: Erfolg protokolliert normalisierte Eingabe und Adapterversion', async () => {
  const adapter = createResearchAdapter({
    name: 'fixture-search',
    version: '2026.07',
    tools: ['search'],
    invoke: async (_tool, input) => ({ id: 'result-7', query: input.query }),
  })
  let tick = 10
  const outcome = await executeResearchTool(runningPlan(), {
    adapter,
    tool: 'search',
    input: { z: 2, query: '  klare frage  ', a: 1 },
    sourceState: 'initial',
  }, { now: () => ++tick, idFactory: () => 'event-ok' })
  assert.equal(outcome.result.id, 'result-7')
  assert.equal(outcome.run.toolEvents.length, 1)
  assert.deepEqual(outcome.run.toolEvents[0].input, { a: 1, query: 'klare frage', z: 2 })
  assert.deepEqual(outcome.run.toolEvents[0].adapter, { name: 'fixture-search', version: '2026.07' })
  assert.equal(outcome.run.toolEvents[0].status, 'completed')
  assert.equal(outcome.run.toolEvents[0].resultRef, 'result-7')
})

test('RESEARCH-07: Fehler und Abbruch werden als Endstatus statt als halber Start protokolliert', async () => {
  const failure = createResearchAdapter({
    name: 'fixture',
    version: '1',
    tools: ['reader'],
    invoke: async () => { throw new Error('Reader offline') },
  })
  const failed = await executeResearchTool(runningPlan(), {
    adapter: failure,
    tool: 'reader',
    input: { url: 'https://example.org/a' },
  }, { now: () => 20, idFactory: () => 'event-fail' })
  assert.equal(failed.run.toolEvents[0].status, 'failed')
  assert.equal(failed.run.toolEvents[0].error, 'Research tool failed')

  const abort = createResearchAdapter({
    name: 'fixture',
    version: '1',
    tools: ['reader'],
    invoke: async () => {
      const error = new Error('aborted')
      error.name = 'AbortError'
      throw error
    },
  })
  const cancelled = await executeResearchTool(runningPlan(), {
    adapter: abort,
    tool: 'reader',
    input: { url: 'https://example.org/a' },
  }, { now: () => 30, idFactory: () => 'event-cancel' })
  assert.equal(cancelled.run.toolEvents[0].status, 'cancelled')
})

test('RESEARCH-07: verschachtelte Secrets und Bearer-Werte erreichen das Protokoll nicht', async () => {
  const canary = 'CANARY-super-secret-42'
  const cleaned = redactResearchSecrets({
    query: 'open',
    apiKey: canary,
    headers: { Authorization: `Bearer ${canary}`, Accept: 'text/html' },
    nested: [{ password: canary }, { cookie: canary }, { value: `Bearer ${canary}` }],
  })
  const serialized = JSON.stringify(cleaned)
  assert.equal(serialized.includes(canary), false)
  assert.equal(cleaned.apiKey, '[redacted]')
  assert.equal(cleaned.headers.Accept, 'text/html')

  const adapter = createResearchAdapter({
    name: 'fixture',
    version: '1',
    tools: ['search'],
    invoke: async () => ({ ref: 'safe-ref' }),
  })
  const outcome = await executeResearchTool(runningPlan(), {
    adapter,
    tool: 'search',
    input: { query: 'open', token: canary, nested: { sessionCookie: canary } },
  }, { now: () => 40, idFactory: () => 'event-secret' })
  assert.equal(JSON.stringify(outcome.run).includes(canary), false)
})

test('RESEARCH-03: nicht zugängliche Quellen erzeugen nur legale, deduplizierte Alternativen', () => {
  const paths = legalAlternativePaths({
    title: 'A Study',
    doi: '10.1000/example',
    sourceState: 'paywalled-v1',
  })
  assert.deepEqual(paths.map(path => path.kind), [
    'doi-search',
    'title-search',
    'preprint',
    'repository',
    'library-catalog',
    'author-manuscript',
    'other-version',
    'supplement',
    'alternative-primary',
  ])
  const serialized = JSON.stringify(paths).toLowerCase()
  assert.doesNotMatch(serialized, /bypass|password|credential|cookie/)
  assert.equal(new Set(paths.map(path => path.fingerprint)).size, paths.length)
})

test('Adapter verweigert nicht erlaubte Werkzeuge vor invoke', async () => {
  let calls = 0
  const adapter = createResearchAdapter({
    name: 'fixture',
    version: '1',
    tools: ['search', 'reader'],
    invoke: async () => { calls += 1 },
  })
  await assert.rejects(
    executeResearchTool(runningPlan(), { adapter, tool: 'import', input: {} }),
    /adapter.*import/i,
  )
  assert.equal(calls, 0)
})
