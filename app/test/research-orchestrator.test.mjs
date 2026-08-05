import test from 'node:test'
import assert from 'node:assert/strict'
import { createResearchAdapter } from '../src/research-adapter.mjs'
import { executeResearchPaths } from '../src/research-orchestrator.mjs'
import { createResearchPlan, transitionResearchRun } from '../src/research-run.mjs'

function runningPlan(overrides = {}) {
  const plan = createResearchPlan({
    id: 'run-orchestrator',
    projectId: 'project-a',
    question: 'Welche Evidenz trägt die Aussage?',
    claimId: 'claim-a',
    claimText: 'Eine enge Aussage.',
    allowedTools: ['search'],
    searchPaths: [
      { id: 'support', purpose: 'support', tool: 'search', input: { query: 'support' } },
      { id: 'counter', purpose: 'counter-evidence', tool: 'search', input: { query: 'counter' } },
      { id: 'limits', purpose: 'limitations', tool: 'search', input: { query: 'limits' } },
    ],
    stopConditions: { maxToolCalls: 6, maxSources: 4, maxConsecutiveFailures: 2 },
    createdAt: 1,
    ...overrides,
  })
  return transitionResearchRun(plan, 'running', { at: 2 })
}

test('RESEARCH-01/05: Orchestrator führt geplante Wege aus und endet prüfbereit', async () => {
  const adapter = createResearchAdapter({
    name: 'fixture',
    version: '1',
    tools: ['search'],
    invoke: async (_tool, input) => ({
      id: `result-${input.query}`,
      candidates: input.query === 'support'
        ? [{
            id: 'candidate-support',
            projectId: 'project-a',
            runId: 'run-orchestrator',
            claimId: 'claim-a',
            relation: 'supports',
            accessLevel: 'metadata',
            originalRef: 'https://example.org/one',
            apiKey: 'CANARY-must-not-persist',
          }]
        : [],
    }),
  })
  let tick = 10
  const result = await executeResearchPaths(runningPlan(), {
    adapter,
    now: () => ++tick,
    idFactory: path => `event-${path.id}`,
  })
  assert.equal(result.status, 'review-ready')
  assert.equal(result.toolEvents.length, 3)
  assert.equal(result.candidates.length, 1)
  assert.equal(JSON.stringify(result).includes('CANARY-must-not-persist'), false)
  assert.deepEqual(result.searchOutcomes.map(item => item.purpose), ['support', 'counter-evidence', 'limitations'])
})

test('RESEARCH-06: Abbruchsignal pausiert atomar und Fortsetzung wiederholt Erfolge nicht', async () => {
  let calls = 0
  const controller = new AbortController()
  const adapter = createResearchAdapter({
    name: 'fixture',
    version: '1',
    tools: ['search'],
    invoke: async (_tool, input, { signal }) => {
      calls += 1
      if (input.query === 'counter') {
        controller.abort()
        const error = new Error('aborted')
        error.name = 'AbortError'
        throw error
      }
      if (signal?.aborted) {
        const error = new Error('aborted')
        error.name = 'AbortError'
        throw error
      }
      return { id: `result-${input.query}`, candidates: [] }
    },
  })
  const paused = await executeResearchPaths(runningPlan(), {
    adapter,
    signal: controller.signal,
    now: () => calls + 20,
    idFactory: path => `event-${path.id}`,
  })
  assert.equal(paused.status, 'paused')
  assert.equal(paused.toolEvents.length, 2)

  const resumed = transitionResearchRun(paused, 'running', { at: 40 })
  const healthy = createResearchAdapter({
    name: 'fixture',
    version: '1',
    tools: ['search'],
    invoke: async (_tool, input) => ({ id: `retry-${input.query}`, candidates: [] }),
  })
  const done = await executeResearchPaths(resumed, {
    adapter: healthy,
    now: () => ++calls + 50,
    idFactory: path => `retry-${path.id}`,
  })
  assert.equal(done.status, 'review-ready')
  assert.equal(done.toolEvents.filter(event => event.input.query === 'support').length, 1)
})

test('RESEARCH-06: zwei aufeinanderfolgende Fehler erreichen die Stopbedingung', async () => {
  let tick = 0
  const adapter = createResearchAdapter({
    name: 'fixture',
    version: '1',
    tools: ['search'],
    invoke: async () => { throw new Error('offline') },
  })
  const failed = await executeResearchPaths(runningPlan(), {
    adapter,
    now: () => ++tick + 10,
    idFactory: path => `failed-${path.id}`,
  })
  assert.equal(failed.status, 'failed')
  assert.equal(failed.toolEvents.length, 2)
  assert.equal(failed.candidates.length, 0)
})

test('RESEARCH-03: gesperrter Originalzugang erweitert den laufenden Plan automatisch nur um legale Wege', async () => {
  const plan = runningPlan({
    allowedTools: ['search', 'metadata'],
    searchPaths: [
      { id: 'original', purpose: 'support', tool: 'search', input: { query: 'original' } },
      { id: 'counter', purpose: 'counter-evidence', tool: 'search', input: { query: 'counter' } },
      { id: 'limits', purpose: 'limitations', tool: 'search', input: { query: 'limits' } },
    ],
    stopConditions: { maxToolCalls: 12, maxSources: 4, maxConsecutiveFailures: 2 },
  })
  const calls = []
  const adapter = createResearchAdapter({
    name: 'legal-fixture',
    version: '1',
    tools: ['search', 'metadata'],
    invoke: async (tool, input) => {
      calls.push({ tool, input })
      if (input.query === 'original') {
        return {
          id: 'blocked-original',
          candidates: [],
          accessFailure: { title: 'A Study', doi: '10.1000/example', sourceState: 'paywalled-v1' },
        }
      }
      return { id: `legal-${calls.length}`, candidates: [] }
    },
  })
  let tick = 100
  const result = await executeResearchPaths(plan, {
    adapter,
    now: () => ++tick,
    idFactory: path => `event-${path.id}`,
  })
  assert.equal(result.status, 'review-ready')
  assert.equal(result.searchPaths.length, 12)
  assert.equal(result.toolEvents.length, 12)
  assert.equal(result.searchPaths.slice(3).every(path => path.legalAlternative === true), true)
  assert.equal(new Set(result.searchPaths.map(path => path.fingerprint || path.id)).size, 12)
  assert.doesNotMatch(JSON.stringify(result).toLowerCase(), /bypass|credential|password|cookie/)
})
