import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  buildResearchReview,
  commitResearchReview,
  inspectResearchCandidate,
} from '../src/research-synthesis.mjs'
import { createResearchPlan, transitionResearchRun } from '../src/research-run.mjs'

const sha256 = async value => createHash('sha256').update(String(value)).digest('hex')

function run() {
  return transitionResearchRun(createResearchPlan({
    id: 'run-synthesis',
    projectId: 'project-a',
    question: 'Wie belastbar ist die Wirkung?',
    claimId: 'claim-a',
    claimText: 'In dieser Stichprobe war die Fehlerrate nach einer Sitzung niedriger.',
    allowedTools: ['search', 'metadata', 'reader', 'import'],
    searchPaths: [
      { id: 'support', purpose: 'support', tool: 'search', input: { query: 'lower error rate' } },
      { id: 'counter', purpose: 'counter-evidence', tool: 'search', input: { query: 'no effect replication' } },
      { id: 'limits', purpose: 'limitations', tool: 'search', input: { query: 'sample limitations' } },
    ],
    stopConditions: { maxToolCalls: 12, maxSources: 6, maxConsecutiveFailures: 3 },
    createdAt: 100,
  }), 'running', { at: 110 })
}

function candidate(id, relation = 'supports', overrides = {}) {
  const excerpt = relation === 'counters'
    ? 'In der Replikation zeigte sich nach einer Sitzung kein belastbarer Unterschied.'
    : 'In dieser Stichprobe war die Fehlerrate nach einer Sitzung niedriger.'
  return {
    id,
    projectId: 'project-a',
    runId: 'run-synthesis',
    claimId: 'claim-a',
    relation,
    accessLevel: 'original-excerpt',
    originalRef: `https://example.org/${id}`,
    title: `Quelle ${id}`,
    sourceType: 'web',
    original: {
      mediaType: 'text/html',
      sections: [{ id: 'results', heading: 'Results', text: excerpt }],
    },
    locator: { kind: 'section', address: { sectionId: 'results' }, excerpt },
    verification: { status: 'verified' },
    limitation: relation === 'limits' ? 'Die Stichprobe ist klein.' : '',
    ...overrides,
  }
}

test('RESEARCH-02: Metadaten und Abstracts werden nicht als Originalfundstelle aufgewertet', () => {
  const metadata = inspectResearchCandidate(candidate('meta', 'supports', {
    accessLevel: 'metadata',
    original: null,
    locator: null,
    verification: null,
  }))
  const abstract = inspectResearchCandidate(candidate('abstract', 'supports', {
    accessLevel: 'abstract',
  }))
  const original = inspectResearchCandidate(candidate('full'))
  assert.equal(metadata.usableAsEvidence, false)
  assert.equal(metadata.maximumClaim, 'bibliographic-identity')
  assert.equal(abstract.usableAsEvidence, false)
  assert.equal(abstract.maximumClaim, 'abstract-visible-content')
  assert.equal(original.usableAsEvidence, true)
})

test('RESEARCH-02: gemischter Lauf bewahrt Metadaten und Abstract als Material, importiert aber nur verifizierte Originalfundstellen', async () => {
  const lauf = run()
  const review = buildResearchReview({
    run: lauf,
    candidates: [
      candidate('meta', 'supports', { accessLevel: 'metadata', original: null, locator: null, verification: null }),
      candidate('abstract', 'supports', { accessLevel: 'abstract', verification: { status: 'unverified' } }),
      candidate('original', 'supports'),
    ],
    searchOutcomes: [
      { purpose: 'counter-evidence', status: 'completed', found: 0 },
      { purpose: 'limitations', status: 'completed', found: 0 },
    ],
  })
  assert.deepEqual(review.support.map(item => item.id), ['original'])
  assert.deepEqual(review.researchMaterial.map(item => [item.id, item.maximumClaim]), [
    ['meta', 'bibliographic-identity'],
    ['abstract', 'abstract-visible-content'],
  ])
  const outcome = await commitResearchReview({
    project: { id: 'project-a', sources: [], evidenceBundles: [], researchRuns: [lauf] },
    run: lauf,
    review,
    at: 500,
  }, { sha256 })
  assert.equal(outcome.committed, true)
  assert.deepEqual(outcome.project.sources.map(source => source.origin.immutableRef), ['https://example.org/original'])
  assert.doesNotMatch(JSON.stringify(outcome.project.sources), /example\.org\/(?:meta|abstract)/)
})

test('RESEARCH-05: Review hält Stützung, Widerspruch, Grenzen und erfolglose Suche getrennt', () => {
  const review = buildResearchReview({
    run: run(),
    candidates: [
      candidate('support'),
      candidate('counter', 'counters'),
      candidate('limits', 'limits'),
      candidate('duplicate', 'supports', { originalRef: 'https://example.org/support' }),
    ],
    searchOutcomes: [
      { purpose: 'counter-evidence', status: 'completed', found: 1 },
      { purpose: 'limitations', status: 'completed', found: 1 },
    ],
  })
  assert.equal(review.support.length, 1)
  assert.equal(review.counterEvidence.length, 1)
  assert.equal(review.limitations.length, 1)
  assert.equal(review.duplicates.length, 1)
  assert.equal(review.conflictStatus, 'mixed')
  assert.deepEqual(review.openGaps, [])
})

test('RESEARCH-05: ein ehrlicher Nullbefund bleibt sichtbar statt als Gegenbeleg erfunden zu werden', () => {
  const review = buildResearchReview({
    run: run(),
    candidates: [candidate('support')],
    searchOutcomes: [
      { purpose: 'counter-evidence', status: 'completed', found: 0 },
      { purpose: 'limitations', status: 'completed', found: 0 },
    ],
  })
  assert.deepEqual(review.counterEvidence, [])
  assert.match(review.notes.join(' '), /kein gegenbeleg gefunden/i)
  assert.match(review.notes.join(' '), /keine methodische grenze gefunden/i)
})

test('RESEARCH-06: Commit ist atomar und erzeugt nur aus Originalfundstellen B1-Wissen', async () => {
  const originalProject = { id: 'project-a', sources: [], evidenceBundles: [], researchRuns: [run()] }
  const review = buildResearchReview({
    run: run(),
    candidates: [candidate('support'), candidate('counter', 'counters'), candidate('limits', 'limits')],
    searchOutcomes: [
      { purpose: 'counter-evidence', status: 'completed', found: 1 },
      { purpose: 'limitations', status: 'completed', found: 1 },
    ],
  })
  const outcome = await commitResearchReview({
    project: originalProject,
    run: run(),
    review,
    at: 500,
  }, { sha256 })
  assert.equal(outcome.committed, true)
  assert.equal(originalProject.sources.length, 0)
  assert.equal(outcome.project.sources.length, 3)
  assert.equal(outcome.project.evidenceBundles.length, 1)
  assert.equal(outcome.project.evidenceBundles[0].status, 'mixed')
  assert.equal(outcome.run.status, 'completed')
  assert.equal(outcome.project.evidenceBundles[0].provenance.action, 'research-commit')
})

test('RESEARCH-06: ein ungültiger Kandidat lässt Projekt und Lauf bytegleich unangetastet', async () => {
  const project = { id: 'project-a', sources: [], evidenceBundles: [], researchRuns: [run()] }
  const bad = candidate('bad', 'supports', {
    locator: { kind: 'section', address: { sectionId: 'results' }, excerpt: 'Erfundener Ausschnitt' },
  })
  const review = buildResearchReview({
    run: run(),
    candidates: [bad],
    searchOutcomes: [
      { purpose: 'counter-evidence', status: 'completed', found: 0 },
      { purpose: 'limitations', status: 'completed', found: 0 },
    ],
  })
  const before = JSON.stringify(project)
  const outcome = await commitResearchReview({ project, run: run(), review, at: 500 }, { sha256 })
  assert.equal(outcome.committed, false)
  assert.equal(JSON.stringify(project), before)
  assert.equal(outcome.run.status, 'running')
})

test('Projektfremde Kandidaten werden vor der Verdichtung abgewiesen', () => {
  assert.throws(() => buildResearchReview({
    run: run(),
    candidates: [candidate('foreign', 'supports', { projectId: 'project-b' })],
    searchOutcomes: [],
  }), /project/i)
})
