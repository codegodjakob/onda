import test from 'node:test'
import assert from 'node:assert/strict'
import {
  appendDeliberationRound,
  createDeliberationRound,
  generateArgumentPaths,
  selectStrongestCounterargument,
  validateArgumentPaths,
} from '../src/argument-deliberation.mjs'
import {
  createArgumentClaim,
  createArgumentRelation,
  ensureArgumentModel,
} from '../src/argument-model.mjs'

function claim(id, text, overrides = {}) {
  return createArgumentClaim({
    id,
    projectId: 'p-a',
    textId: 'd-a',
    anchor: { blockId: `block-${id}`, exact: text, start: 0, end: text.length },
    text,
    kind: 'fact',
    centrality: 'supporting',
    validity: 'asserted',
    evidenceStatus: 'supported',
    uncertainty: 'low',
    evidenceRefs: [{ sourceId: `source-${id}`, locatorId: `locator-${id}`, bundleId: `bundle-${id}` }],
    provenance: { actor: 'user', action: 'text-claim' },
    fingerprint: `fingerprint-${id}`,
    createdAt: 10,
    ...overrides,
  })
}

function relation(id, fromClaimId, toClaimId, type, claims, confidence = 'high') {
  return createArgumentRelation({
    id,
    projectId: 'p-a',
    fromClaimId,
    toClaimId,
    type,
    warrant: type === 'counters'
      ? 'Der Befund betrifft denselben Endpunkt und begrenzt deshalb die allgemeine Wirkungsaussage.'
      : `${fromClaimId} trägt ${toClaimId} über eine explizite Schlussbrücke.`,
    confidence,
    provenance: { actor: 'agent', action: 'argument-derived' },
    createdAt: 20,
  }, { claims })
}

function richFixture() {
  const central = claim('central', 'Die Intervention senkt die Fehlerrate allgemein.', {
    centrality: 'central',
    evidenceStatus: 'mixed',
    uncertainty: 'medium',
  })
  const support = claim('support', 'In der Hauptstudie sank die Fehlerrate nach einer Sitzung.')
  const counter = claim('counter', 'Die unabhängige Replikation fand für denselben Endpunkt keinen belastbaren Unterschied.', {
    evidenceStatus: 'mixed',
    uncertainty: 'medium',
  })
  const weak = claim('weak', 'Ein Kommentar bezweifelt die Wirkung.', {
    evidenceStatus: 'unverified',
    uncertainty: 'high',
    evidenceRefs: [],
  })
  const definition = claim('definition', 'Fehlerrate bezeichnet den Anteil falsch gelöster Aufgaben.', {
    kind: 'definition',
  })
  const claims = [central, support, counter, weak, definition]
  const relations = [
    relation('support-central', 'support', 'central', 'supports', claims),
    relation('counter-central', 'counter', 'central', 'counters', claims),
    relation('weak-central', 'weak', 'central', 'counters', claims, 'low'),
    relation('central-definition', 'central', 'definition', 'depends-on', claims),
  ]
  const model = ensureArgumentModel({
    id: 'p-a',
    argumentModel: { claims, relations },
  }).argumentModel
  const evidenceBundles = [{
    id: 'bundle-counter',
    projectId: 'p-a',
    claimText: counter.text,
    status: 'mixed',
    limitations: ['Die Replikation ist klein und auf einen Hochschulkontext begrenzt.'],
  }]
  return { model, central, support, counter, weak, definition, evidenceBundles }
}

test('ARG-04: stärkster direkter belegter Einwand schlägt schwachen unbelegten Einwand', () => {
  const fixture = richFixture()
  const result = selectStrongestCounterargument({
    model: fixture.model,
    projectId: 'p-a',
    centralClaimId: fixture.central.id,
    evidenceBundles: fixture.evidenceBundles,
  })
  assert.equal(result.status, 'found')
  assert.equal(result.counterClaim.id, 'counter')
  assert.equal(result.counterClaim.text, fixture.counter.text)
  assert.equal(result.relation.id, 'counter-central')
  assert.deepEqual(result.evidenceRefs, fixture.counter.evidenceRefs)
  assert.deepEqual(result.limitations, ['Die Replikation ist klein und auf einen Hochschulkontext begrenzt.'])
  assert.equal(result.impact.targetClaimId, 'central')
  assert.equal(result.impact.effect, 'qualifies')
  assert.match(result.impact.reason, /Reichweite|allgemein/i)
})

test('ARG-04: ohne belegtes Gegenmaterial entsteht ehrliche Enthaltung statt Strohmann', () => {
  const fixture = richFixture()
  fixture.model.relations = fixture.model.relations.filter(item => item.id === 'weak-central')
  const result = selectStrongestCounterargument({
    model: fixture.model,
    projectId: 'p-a',
    centralClaimId: fixture.central.id,
    evidenceBundles: [],
  })
  assert.deepEqual(result, {
    status: 'insufficient',
    centralClaimId: 'central',
    reason: 'Kein direkt belegtes Gegenargument im Projektmaterial.',
  })
  assert.equal(JSON.stringify(result).includes(fixture.weak.text), false)
})

test('ARG-07: Wege unterscheiden sich substanziell und zeigen Auswirkung sowie Risiko', () => {
  const fixture = richFixture()
  const counterargument = selectStrongestCounterargument({
    model: fixture.model,
    projectId: 'p-a',
    centralClaimId: fixture.central.id,
    evidenceBundles: fixture.evidenceBundles,
  })
  const result = generateArgumentPaths({
    model: fixture.model,
    projectId: 'p-a',
    centralClaimId: fixture.central.id,
    counterargument,
  })
  assert.equal(result.status, 'ready')
  assert.deepEqual(result.paths.map(path => path.strategy), [
    'evidence-first',
    'objection-first',
    'definition-first',
  ])
  assert.equal(result.paths.every(path => path.premise && path.bridge && path.evidenceStrategy), true)
  assert.equal(result.paths.every(path => path.impact && path.risk), true)
  const validation = validateArgumentPaths(result.paths)
  assert.equal(validation.valid, true)
  assert.equal(validation.distinctSignatures, 3)
})

test('ARG-07: kosmetische oder unvollständige Wege werden verworfen; zu dünner Graph enthält Lücke', () => {
  const fixture = richFixture()
  const cosmetic = [
    {
      id: 'a',
      strategy: 'same',
      premiseClaimId: 'support',
      premise: 'A',
      bridge: 'Gleiche Brücke',
      perspective: 'gleich',
      evidenceStrategy: 'gleich',
      impact: 'Wirkung',
      risk: 'Risiko',
    },
    {
      id: 'b',
      strategy: 'same',
      premiseClaimId: 'support',
      premise: 'A anders',
      bridge: 'Gleiche Brücke',
      perspective: 'gleich',
      evidenceStrategy: 'gleich',
      impact: 'Wirkung',
      risk: '',
    },
  ]
  assert.equal(validateArgumentPaths(cosmetic).valid, false)

  fixture.model.relations = []
  const result = generateArgumentPaths({
    model: fixture.model,
    projectId: 'p-a',
    centralClaimId: fixture.central.id,
    counterargument: { status: 'insufficient', centralClaimId: fixture.central.id, reason: 'Kein Einwand.' },
  })
  assert.equal(result.status, 'insufficient')
  assert.deepEqual(result.paths, [])
  assert.match(result.reason, /zwei/)
})

test('AC-C2-8: Kritik, Autorenantwort und Revision bleiben getrennt, chronologisch und append-only', () => {
  const fixture = richFixture()
  const round = createDeliberationRound({
    id: 'round-1',
    projectId: 'p-a',
    claimId: 'central',
    critique: { text: 'Die These verallgemeinert über die untersuchte Population hinaus.', actor: 'agent', at: 100 },
    response: { text: 'Ich möchte die Aussage auf den untersuchten Kontext begrenzen.', actor: 'user', at: 110 },
    revision: { text: 'In der untersuchten Population sank die Fehlerrate nach einer Sitzung.', actor: 'agent', at: 120 },
  }, { claims: fixture.model.claims })
  assert.deepEqual(round.entries.map(entry => entry.kind), ['critique', 'response', 'revision'])
  assert.deepEqual(round.entries.map(entry => entry.actor), ['agent', 'user', 'agent'])
  assert.deepEqual(round.entries.map(entry => entry.at), [100, 110, 120])
  const before = JSON.stringify(fixture.model)
  const next = appendDeliberationRound(fixture.model, round)
  assert.equal(JSON.stringify(fixture.model), before)
  assert.equal(next.deliberations.length, 1)
  assert.equal(next.events.at(-1).kind, 'deliberation-recorded')
  assert.throws(() => appendDeliberationRound(next, round), /duplicate/i)
})

test('eine Prüfrunde kann ehrlich ohne erfundene Revision enden', () => {
  const fixture = richFixture()
  const round = createDeliberationRound({
    id: 'round-without-revision',
    projectId: 'p-a',
    claimId: 'central',
    critique: { text: 'Die Reichweite ist noch nicht geklärt.', actor: 'agent', at: 100 },
    response: { text: 'Ich prüfe erst die Population.', actor: 'user', at: 110 },
  }, { claims: fixture.model.claims })
  assert.deepEqual(round.entries.map(entry => entry.kind), ['critique', 'response'])
  assert.equal(round.completedAt, 110)
  const next = appendDeliberationRound(fixture.model, round)
  assert.deepEqual(next.deliberations[0].entries.map(entry => entry.kind), ['critique', 'response'])
})

test('Prüfrunden und Deliberation bleiben im Projekt und benötigen echte getrennte Beiträge', () => {
  const fixture = richFixture()
  const base = {
    id: 'bad-round',
    projectId: 'p-a',
    claimId: 'central',
    critique: { text: 'Kritik', actor: 'agent', at: 100 },
    response: { text: 'Antwort', actor: 'user', at: 110 },
    revision: { text: 'Revision', actor: 'agent', at: 120 },
  }
  assert.throws(() => createDeliberationRound({ ...base, projectId: 'p-b' }, { claims: fixture.model.claims }), /project/i)
  assert.throws(() => createDeliberationRound({ ...base, response: { text: '', actor: 'user', at: 110 } }, { claims: fixture.model.claims }), /response/i)
  assert.throws(() => createDeliberationRound({
    ...base,
    revision: { text: 'Revision', actor: 'agent', at: 105 },
  }, { claims: fixture.model.claims }), /chronological/i)
})

test('Gegenargumente und Wege weisen projektfremde Beziehungen fail-closed ab', () => {
  const fixture = richFixture()
  fixture.model.relations.push({
    ...fixture.model.relations[0],
    id: 'foreign-relation',
    projectId: 'p-b',
  })
  assert.throws(() => selectStrongestCounterargument({
    model: fixture.model,
    projectId: 'p-a',
    centralClaimId: fixture.central.id,
    evidenceBundles: fixture.evidenceBundles,
  }), /foreign project/i)
  assert.throws(() => generateArgumentPaths({
    model: fixture.model,
    projectId: 'p-a',
    centralClaimId: fixture.central.id,
  }), /foreign project/i)
})
