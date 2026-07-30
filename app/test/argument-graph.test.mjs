import test from 'node:test'
import assert from 'node:assert/strict'
import {
  analyzeArgumentGraph,
  analyzeArgumentImpact,
  buildArgumentGraph,
  mergeArgumentFindings,
  reconcileArgumentRegression,
  resolveArgumentFinding,
} from '../src/argument-graph.mjs'
import {
  createArgumentClaim,
  createArgumentRelation,
  ensureArgumentModel,
} from '../src/argument-model.mjs'

function claim(id, overrides = {}) {
  const exact = overrides.text || `Claim ${id} trägt eine überprüfbare Aussage.`
  return createArgumentClaim({
    id,
    projectId: 'p-a',
    textId: 'd-a',
    anchor: { blockId: `block-${id}`, exact, start: 0, end: exact.length },
    text: exact,
    kind: 'fact',
    centrality: 'supporting',
    validity: 'asserted',
    evidenceStatus: 'supported',
    uncertainty: 'low',
    evidenceRefs: [],
    provenance: { actor: 'user', action: 'text-claim' },
    fingerprint: `fingerprint-${id}`,
    createdAt: 10,
    ...overrides,
  })
}

function relation(id, fromClaimId, toClaimId, type, claims, overrides = {}) {
  return createArgumentRelation({
    id,
    projectId: 'p-a',
    fromClaimId,
    toClaimId,
    type,
    warrant: `${fromClaimId} ist für ${toClaimId} relevant.`,
    confidence: 'high',
    provenance: { actor: 'agent', action: 'argument-derived' },
    createdAt: 20,
    ...overrides,
  }, { claims })
}

function model(claims, relations, findings = []) {
  return ensureArgumentModel({
    id: 'p-a',
    argumentModel: { claims, relations, findings },
  }).argumentModel
}

test('Graphindex bildet alle Relationstypen in die richtige Auswirkungsrichtung ab', () => {
  const claims = ['a', 'b', 'c', 'd', 'e', 'f'].map(id => claim(id))
  const relations = [
    relation('supports', 'a', 'b', 'supports', claims),
    relation('counters', 'b', 'c', 'counters', claims),
    relation('qualifies', 'c', 'd', 'qualifies', claims),
    relation('explains', 'd', 'e', 'explains', claims),
    relation('depends', 'f', 'e', 'depends-on', claims),
  ]
  const graph = buildArgumentGraph(model(claims, relations), { projectId: 'p-a' })
  assert.deepEqual([...graph.outgoing.get('a')], ['b'])
  assert.deepEqual([...graph.outgoing.get('b')], ['c'])
  assert.deepEqual([...graph.outgoing.get('c')], ['d'])
  assert.deepEqual([...graph.outgoing.get('d')], ['e'])
  assert.deepEqual([...graph.outgoing.get('e')], ['f'])
  assert.deepEqual([...graph.incoming.get('f')], ['e'])
})

test('ARG-03: gemeinsame ungeklärte Annahme wird Grundursache und abhängige Lücken bleiben geparkt', () => {
  const assumption = claim('assumption', {
    kind: 'inference',
    evidenceStatus: 'unverified',
    uncertainty: 'high',
  })
  const symptomA = claim('symptom-a', { centrality: 'central', evidenceStatus: 'insufficient', uncertainty: 'high' })
  const symptomB = claim('symptom-b', { centrality: 'central', evidenceStatus: 'review-required', uncertainty: 'medium' })
  const claims = [assumption, symptomA, symptomB]
  const relations = [
    relation('depends-a', 'symptom-a', 'assumption', 'depends-on', claims),
    relation('depends-b', 'symptom-b', 'assumption', 'depends-on', claims),
  ]
  const report = analyzeArgumentGraph(model(claims, relations), { projectId: 'p-a', at: 100 })
  const root = report.findings.find(finding => finding.kind === 'root-cause')
  assert.equal(root.claimId, 'assumption')
  const parked = report.findings.filter(finding => finding.status === 'parked')
  assert.deepEqual(parked.map(finding => finding.claimId).sort(), ['symptom-a', 'symptom-b'])
  assert.equal(parked.every(finding => finding.rootCauseClaimId === 'assumption'), true)
})

test('Zirkelschluss wird mit vollständigem geschlossenem Pfad sichtbar', () => {
  const claims = ['a', 'b', 'c'].map(id => claim(id))
  const relations = [
    relation('ab', 'a', 'b', 'supports', claims),
    relation('bc', 'b', 'c', 'supports', claims),
    relation('ca', 'c', 'a', 'supports', claims),
  ]
  const report = analyzeArgumentGraph(model(claims, relations), { projectId: 'p-a', at: 100 })
  assert.deepEqual(report.cycles, [['a', 'b', 'c', 'a']])
  assert.equal(report.findings.some(finding => finding.kind === 'cycle' && finding.claimIds.length === 3), true)
})

test('ARG-05: Claim-Änderung markiert nur gerichtete abhängige Claims und lässt unabhängigen Teilgraph bytegleich', () => {
  const claims = ['a', 'b', 'c', 'x', 'y'].map(id => claim(id))
  const relations = [
    relation('ab', 'a', 'b', 'supports', claims),
    relation('bc', 'b', 'c', 'qualifies', claims),
    relation('xy', 'x', 'y', 'supports', claims),
  ]
  const input = model(claims, relations, [
    { id: 'finding-c', kind: 'gap', claimId: 'c', status: 'open', basisFingerprint: 'old' },
    { id: 'finding-y', kind: 'gap', claimId: 'y', status: 'open', basisFingerprint: 'old' },
  ])
  const independentBefore = JSON.stringify({
    x: input.claims.find(item => item.id === 'x'),
    y: input.claims.find(item => item.id === 'y'),
    xy: input.relations.find(item => item.id === 'xy'),
    findingY: input.findings.find(item => item.id === 'finding-y'),
  })
  const result = analyzeArgumentImpact({
    model: input,
    projectId: 'p-a',
    change: { kind: 'claim', entityId: 'a', fingerprint: 'claim-a-v2', reason: 'Aussage präzisiert' },
    at: 200,
  })
  assert.deepEqual(result.impact.affectedClaimIds, ['a', 'b', 'c'])
  assert.deepEqual(result.impact.affectedRelationIds, ['ab', 'bc'])
  assert.deepEqual(result.impact.affectedFindingIds, ['finding-c'])
  assert.equal(result.model.claims.find(item => item.id === 'c').review.status, 'review-required')
  const independentAfter = JSON.stringify({
    x: result.model.claims.find(item => item.id === 'x'),
    y: result.model.claims.find(item => item.id === 'y'),
    xy: result.model.relations.find(item => item.id === 'xy'),
    findingY: result.model.findings.find(item => item.id === 'finding-y'),
  })
  assert.equal(independentAfter, independentBefore)
})

test('ARG-05: ein Gegenargument löst keine falsche Wirkungskaskade in die angegriffene These aus', () => {
  const counter = claim('counter')
  const central = claim('central', { centrality: 'central' })
  const claims = [counter, central]
  const relations = [relation('counter-central', 'counter', 'central', 'counters', claims)]
  const result = analyzeArgumentImpact({
    model: model(claims, relations),
    projectId: 'p-a',
    change: { kind: 'claim', entityId: 'counter', fingerprint: 'counter-v2', reason: 'Gegenbeleg geändert' },
    at: 200,
  })
  assert.deepEqual(result.impact.affectedClaimIds, ['counter'])
  assert.deepEqual(result.impact.affectedRelationIds, [])
  assert.equal(result.model.claims.find(item => item.id === 'central').review, undefined)
  assert.equal(result.model.relations[0].review, undefined)
})

test('Quellen-, Definitions- und Entscheidungsänderungen beginnen an den direkt referenzierenden Claims', () => {
  const sourceClaim = claim('source', {
    evidenceRefs: [{ sourceId: 'source-1', locatorId: 'locator-1', bundleId: 'bundle-1' }],
  })
  const definition = claim('definition', { kind: 'definition' })
  const decision = claim('decision', {
    provenance: { actor: 'user', action: 'text-claim', originIds: ['decision-1'] },
  })
  const target = claim('target')
  const claims = [sourceClaim, definition, decision, target]
  const relations = [
    relation('source-target', 'source', 'target', 'supports', claims),
    relation('definition-target', 'target', 'definition', 'depends-on', claims),
    relation('decision-target', 'decision', 'target', 'qualifies', claims),
  ]
  const input = model(claims, relations)
  const sourceImpact = analyzeArgumentImpact({
    model: input,
    projectId: 'p-a',
    change: { kind: 'source', entityId: 'source-1', fingerprint: 'source-v2', reason: 'Quelle zurückgezogen' },
    at: 200,
  }).impact
  assert.deepEqual(sourceImpact.affectedClaimIds, ['source', 'target'])

  const definitionImpact = analyzeArgumentImpact({
    model: input,
    projectId: 'p-a',
    change: { kind: 'definition', entityId: 'definition', fingerprint: 'definition-v2', reason: 'Definition korrigiert' },
    at: 201,
  }).impact
  assert.deepEqual(definitionImpact.affectedClaimIds, ['definition', 'target'])

  const decisionImpact = analyzeArgumentImpact({
    model: input,
    projectId: 'p-a',
    change: { kind: 'decision', entityId: 'decision-1', fingerprint: 'decision-v2', reason: 'Entscheidung geändert' },
    at: 202,
  }).impact
  assert.deepEqual(decisionImpact.affectedClaimIds, ['decision', 'target'])
})

test('ARG-06: gelöster Befund bleibt bei gleicher Grundlage geschlossen und öffnet nur mit neuem Anlass', () => {
  const finding = {
    id: 'finding-1',
    projectId: 'p-a',
    kind: 'gap',
    claimId: 'a',
    status: 'resolved',
    basisFingerprint: 'basis-v1',
    resolvedAt: 100,
  }
  const same = reconcileArgumentRegression({
    finding,
    projectId: 'p-a',
    basisFingerprint: 'basis-v1',
    reason: 'Unveränderte Grundlage',
    at: 200,
  })
  assert.equal(same.status, 'resolved')
  assert.equal(same.reopenReason, undefined)
  const changed = reconcileArgumentRegression({
    finding,
    projectId: 'p-a',
    basisFingerprint: 'basis-v2',
    reason: 'Neue Gegenquelle verändert die Beleglage',
    at: 201,
  })
  assert.equal(changed.status, 'open')
  assert.equal(changed.basisFingerprint, 'basis-v2')
  assert.equal(changed.reopenReason, 'Neue Gegenquelle verändert die Beleglage')
  assert.equal(changed.reopenedAt, 201)
  assert.equal(finding.status, 'resolved')
})

test('ARG-06: geschlossene Befundhistorie bleibt erhalten und öffnet bei neuer Grundlage sichtbar', () => {
  const claims = [claim('central', {
    centrality: 'central',
    evidenceStatus: 'unverified',
    uncertainty: 'high',
  })]
  const base = model(claims, [])
  const analyzed = analyzeArgumentGraph(base, { projectId: 'p-a', at: 100 }).findings
  base.findings = analyzed
  const resolved = resolveArgumentFinding({
    model: base,
    projectId: 'p-a',
    findingId: analyzed[0].id,
    resolution: 'Beleg wurde außerhalb des Dossiers geprüft.',
    at: 110,
  })
  assert.equal(resolved.findings[0].status, 'resolved')
  assert.equal(resolved.events.at(-1).kind, 'finding-resolved')

  const absentNow = mergeArgumentFindings({
    previous: resolved.findings,
    analyzed: [],
    projectId: 'p-a',
    at: 120,
  })
  assert.equal(absentNow.length, 1)
  assert.equal(absentNow[0].status, 'resolved')

  const changed = [{ ...analyzed[0], basisFingerprint: 'new-basis' }]
  const reopened = mergeArgumentFindings({
    previous: resolved.findings,
    analyzed: changed,
    projectId: 'p-a',
    at: 130,
  })
  assert.equal(reopened[0].status, 'open')
  assert.equal(reopened[0].reopenReason, 'Die argumentative Grundlage dieses Befunds hat sich geändert.')
})

test('Projektfremde Graph- und Änderungszugriffe scheitern geschlossen', () => {
  const claims = [claim('a')]
  const input = model(claims, [])
  assert.throws(() => buildArgumentGraph(input, { projectId: 'p-b' }), /project/i)
  assert.throws(() => analyzeArgumentImpact({
    model: input,
    projectId: 'p-b',
    change: { kind: 'claim', entityId: 'a', fingerprint: 'v2', reason: 'fremd' },
    at: 200,
  }), /project/i)
})
