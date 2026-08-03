import test from 'node:test'
import assert from 'node:assert/strict'
import { buildProjectProvenanceSnapshot } from '../src/provenance-model.mjs'

test('INV-02: Nutzertext, Agenteneinordnung, Quelle, Fundstelle und belegtes Wissen behalten ihre Herkunft', () => {
  const project = {
    id: 'p-a',
    sources: [{
      id: 'src-1',
      projectId: 'p-a',
      importedAt: 10,
      provenance: { actor: 'user', action: 'import' },
      locators: [{
        id: 'loc-1',
        projectId: 'p-a',
        sourceId: 'src-1',
        claimId: 'claim-1',
        provenance: { actor: 'user', action: 'locator-create' },
      }],
    }],
    evidenceBundles: [{
      id: 'bundle-1',
      projectId: 'p-a',
      claimId: 'claim-1',
      status: 'supported',
      createdAt: 20,
      provenance: { actor: 'user', action: 'evidence-assemble' },
      support: [{ sourceId: 'src-1', locatorId: 'loc-1', usable: true }],
    }],
  }
  const docs = [{
    id: 'doc-1',
    projectId: 'p-a',
    updated: 30,
    provenance: { actor: 'user', action: 'document-create' },
    findings: [{
      id: 'finding-1',
      createdAt: 40,
      provenance: { actor: 'agent', action: 'hinweise' },
    }],
  }]
  const snapshot = buildProjectProvenanceSnapshot({ project, docs })
  assert.deepEqual(snapshot.records.map(record => [record.kind, record.actor]), [
    ['user-text', 'user'],
    ['agent-assessment', 'agent'],
    ['research-material', 'user'],
    ['source-locator', 'user'],
    ['verified-knowledge', 'user'],
  ])
  assert.deepEqual(snapshot.records.at(-1).sourceIds, ['src-1'])
  assert.doesNotThrow(() => JSON.parse(JSON.stringify(snapshot)))
})

test('INV-03: unvollständiges oder unbrauchbares Belegbündel wird nie als belegtes Wissen projiziert', () => {
  const project = {
    id: 'p-a',
    sources: [],
    evidenceBundles: [{
      id: 'bundle-open',
      projectId: 'p-a',
      claimId: 'claim-open',
      status: 'review-required',
      createdAt: 1,
      support: [{ sourceId: 'plausibel-aber-nicht-importiert', locatorId: 'erfunden', usable: false }],
      provenance: { actor: 'agent', action: 'evidence-proposal' },
    }],
  }
  const snapshot = buildProjectProvenanceSnapshot({ project, docs: [] })
  assert.equal(snapshot.records[0].kind, 'evidence-draft')
  assert.equal(snapshot.records[0].status, 'review-required')
  assert.equal(snapshot.records.some(record => record.kind === 'verified-knowledge'), false)
})

test('INV-04: projektfremde Provenienz wird vollständig ausgelassen', () => {
  const snapshot = buildProjectProvenanceSnapshot({
    project: { id: 'p-a', sources: [], evidenceBundles: [] },
    docs: [{
      id: 'doc-foreign',
      projectId: 'p-b',
      provenance: { actor: 'user', action: 'document-create' },
      findings: [],
    }],
  })
  assert.deepEqual(snapshot.records, [])
})
