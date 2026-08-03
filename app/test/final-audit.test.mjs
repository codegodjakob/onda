import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ensureFinalAuditStore,
  recordFinalAudit,
  runFinalAudit,
} from '../src/final-audit.mjs'

function finding(id, category, status, priority = 'normal', overrides = {}) {
  return {
    id,
    category,
    status,
    priority,
    short: `${category} ${status}`,
    target: `${id} Ziel`,
    provenance: { actor: 'agent', action: 'assessment' },
    createdAt: 10,
    ...overrides,
  }
}

function fixture() {
  const docs = [{
    id: 'd-a',
    projectId: 'p-a',
    title: 'Prüftext',
    findings: [
      finding('fact-open', 'fact', 'open', 'critical'),
      finding('logic-root', 'logic', 'open', 'high'),
      finding('method-parked', 'method', 'open', 'critical', { rootCauseId: 'logic-root' }),
      finding('wording-resolved', 'wording', 'resolved'),
      finding('content-dismissed', 'content', 'dismissed'),
      finding('citation-risk', 'citation', 'risk-accepted', 'critical'),
      finding('style-superseded', 'wording', 'superseded'),
    ],
    decisions: [],
  }]
  const project = {
    id: 'p-a',
    languageProfile: { projectId: 'p-a', genre: 'scientific' },
    argumentModel: {
      projectId: 'p-a',
      claims: [{
        id: 'claim-a',
        projectId: 'p-a',
        textId: 'd-a',
        blockId: 'b-a',
        centrality: 'central',
        evidenceStatus: 'supported',
        text: 'Belegte Aussage',
      }],
      relations: [],
      findings: [],
      events: [],
      deliberationRounds: [],
    },
    sources: [],
    evidenceBundles: [],
    citations: [],
    bibliography: [],
    languageReports: { projectId: 'p-a', byText: {}, history: [], decisions: [] },
  }
  return { project, docs }
}

test('AUDIT-01: alle Zustände bleiben erreichbar und Integrität steht vor Stil', () => {
  const { project, docs } = fixture()
  const audit = runFinalAudit({ project, docs, textId: 'd-a', at: 100 })
  assert.deepEqual(audit.groups.map(group => group.kind), [
    'integrity',
    'evidence',
    'citation',
    'accepted-risk',
    'other',
    'style',
  ])
  assert.deepEqual(audit.statusCounts, {
    open: 2,
    parked: 1,
    resolved: 1,
    dismissed: 1,
    'risk-accepted': 1,
    superseded: 1,
  })
  assert.equal(audit.groups.at(-1).kind, 'style')
})

test('AUDIT-02: offene kritische wissenschaftliche Integritätsprobleme blockieren unabhängig von Stil', () => {
  const { project, docs } = fixture()
  const audit = runFinalAudit({ project, docs, textId: 'd-a', at: 100 })
  assert.equal(audit.status, 'blocked')
  assert.deepEqual(
    audit.blockers.map(item => item.sourceId).sort(),
    ['fact-open', 'method-parked'],
  )
  assert.equal(audit.blockers.some(item => item.category === 'wording'), false)
  assert.match(audit.statusLabel, /nicht freigabereif/i)
})

test('AUDIT-02: fehlende Bibliografie und ungeprüfte zentrale Beleglage werden eigene harte Blocker', () => {
  const { project, docs } = fixture()
  docs[0].findings = []
  project.argumentModel.claims[0].evidenceStatus = 'unverified'
  project.citations = [{ key: 'missing2026', locator: { blockId: 'b-cite', start: 4 } }]
  const audit = runFinalAudit({ project, docs, textId: 'd-a', at: 100 })
  assert.equal(audit.status, 'blocked')
  assert.deepEqual(
    new Set(audit.blockers.map(item => item.code)),
    new Set(['claim-evidence-unverified', 'bibliography-missing']),
  )
})

test('AUDIT-03/07: identische Grundlage erzeugt denselben strukturellen Audit und keine doppelte Historie', () => {
  const { project, docs } = fixture()
  docs[0].findings = docs[0].findings.filter(item => (
    !['fact-open', 'method-parked', 'logic-root'].includes(item.id)
  ))
  const first = runFinalAudit({ project, docs, textId: 'd-a', at: 100 })
  const second = runFinalAudit({ project, docs, textId: 'd-a', at: 999 })
  assert.equal(first.status, 'review-required')
  assert.equal(first.fingerprint, second.fingerprint)
  assert.deepEqual(
    { ...first, auditedAt: 0 },
    { ...second, auditedAt: 0 },
  )
  recordFinalAudit({ project, audit: first })
  recordFinalAudit({ project, audit: second })
  assert.equal(project.finalAudits.history.length, 1)
  assert.equal(project.finalAudits.byText['d-a'].fingerprint, first.fingerprint)
})

test('AUDIT-07: blockerfreier Zustand bleibt Nutzerentscheidung und zeigt alle Versionen', () => {
  const { project, docs } = fixture()
  docs[0].findings = docs[0].findings.map(item => ({ ...item, status: 'resolved' }))
  const audit = runFinalAudit({ project, docs, textId: 'd-a', at: 100 })
  assert.equal(audit.status, 'clear-of-hard-blockers')
  assert.match(audit.statusLabel, /keine harten Auditblocker/i)
  assert.match(audit.userDecisionNotice, /Nutzer/)
  assert.equal(audit.ruleVersion, '2026-07-30.1')
  assert.equal(audit.modelVersion, 1)
  assert.equal(audit.dataVersion, 1)
})

test('Audit weist fremde Texte und beschädigte Stores fail-closed ab, ohne Appstart zu blockieren', () => {
  const { project, docs } = fixture()
  assert.throws(() => runFinalAudit({ project, docs, textId: 'd-foreign', at: 100 }), /text/i)
  project.finalAudits = {
    projectId: 'p-a',
    byText: {
      bad: { projectId: 'p-b', textId: 'bad', fingerprint: 'x' },
    },
    history: [{ projectId: 'p-b', textId: 'bad' }],
  }
  const store = ensureFinalAuditStore(project)
  assert.deepEqual(store.byText, {})
  assert.deepEqual(store.history, [])
})
