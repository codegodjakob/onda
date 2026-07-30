import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveSafeBlockRelations } from '../src/argument-projection.mjs'
import { createArgumentClaim, ensureArgumentModel } from '../src/argument-model.mjs'

function claim(id, text, blockId, overrides = {}) {
  return createArgumentClaim({
    id,
    projectId: 'p-a',
    textId: 'd-a',
    anchor: { blockId, exact: text, start: 0, end: text.length },
    text,
    kind: 'fact',
    centrality: 'supporting',
    validity: 'asserted',
    evidenceStatus: 'unverified',
    uncertainty: 'high',
    evidenceRefs: [],
    provenance: { actor: 'user', action: 'text-claim' },
    fingerprint: `fingerprint-${id}`,
    createdAt: 10,
    ...overrides,
  })
}

test('eindeutige Rollen erzeugen vorsichtige Stütz-, Gegen- und Definitionsbeziehungen', () => {
  const central = claim('central', 'Die Maßnahme wirkt allgemein.', 'b-central', { centrality: 'central' })
  const support = claim('support', 'Die Fehlerrate sank im Versuch.', 'b-support')
  const counter = claim('counter', 'Die Replikation fand keinen Unterschied.', 'b-counter', { validity: 'contested' })
  const definition = claim('definition', 'Wirkung bezeichnet eine niedrigere Fehlerrate.', 'b-definition', { kind: 'definition' })
  const model = ensureArgumentModel({ argumentModel: { claims: [central, support, counter, definition] } }).argumentModel
  const next = deriveSafeBlockRelations({
    model,
    projectId: 'p-a',
    blocks: [
      { id: 'b-central', role: 'claim' },
      { id: 'b-support', role: 'evidence' },
      { id: 'b-counter', role: 'counterpoint' },
      { id: 'b-definition', role: 'paragraph' },
    ],
    at: 100,
  })
  assert.deepEqual(next.relations.map(relation => relation.type), ['supports', 'counters', 'depends-on'])
  assert.deepEqual(next.relations.map(relation => [relation.fromClaimId, relation.toClaimId]), [
    ['support', 'central'],
    ['counter', 'central'],
    ['central', 'definition'],
  ])
  assert.equal(next.relations.every(relation => relation.warrant.trim().length > 20), true)
  assert.equal(next.relations.every(relation => relation.provenance.actor === 'agent'), true)
})

test('mehrere zentrale Aussagen führen zu Enthaltung; Nutzerkorrekturen werden nie überschrieben', () => {
  const central = claim('central', 'Die Maßnahme wirkt.', 'b-central', { centrality: 'central' })
  const second = claim('central-2', 'Die Maßnahme ist günstig.', 'b-central-2', { centrality: 'central' })
  const support = claim('support', 'Die Fehlerrate sank.', 'b-support')
  const ambiguous = ensureArgumentModel({ argumentModel: { claims: [central, second, support] } }).argumentModel
  const unchanged = deriveSafeBlockRelations({
    model: ambiguous,
    projectId: 'p-a',
    blocks: [
      { id: 'b-central', role: 'claim' },
      { id: 'b-central-2', role: 'claim' },
      { id: 'b-support', role: 'evidence' },
    ],
    at: 100,
  })
  assert.deepEqual(unchanged.relations, [])

  const first = deriveSafeBlockRelations({
    model: ensureArgumentModel({ argumentModel: { claims: [central, support] } }).argumentModel,
    projectId: 'p-a',
    blocks: [
      { id: 'b-central', role: 'claim' },
      { id: 'b-support', role: 'evidence' },
    ],
    at: 100,
  })
  first.relations[0].warrant = 'Bindende Nutzerkorrektur.'
  first.relations[0].corrections = [{ provenance: { actor: 'user' } }]
  const again = deriveSafeBlockRelations({
    model: first,
    projectId: 'p-a',
    blocks: [
      { id: 'b-central', role: 'claim' },
      { id: 'b-support', role: 'evidence' },
    ],
    at: 200,
  })
  assert.equal(again.relations.length, 1)
  assert.equal(again.relations[0].warrant, 'Bindende Nutzerkorrektur.')
  assert.equal(again.relations[0].corrections.length, 1)
})

test('fremde Projektansprüche werden fail-closed abgewiesen', () => {
  const foreign = claim('foreign', 'Fremder Inhalt wirkt.', 'b-foreign', { projectId: 'p-b' })
  assert.throws(() => deriveSafeBlockRelations({
    model: ensureArgumentModel({ argumentModel: { claims: [foreign] } }).argumentModel,
    projectId: 'p-a',
    blocks: [{ id: 'b-foreign', role: 'claim' }],
    at: 100,
  }), /foreign project/i)
})
