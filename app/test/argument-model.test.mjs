import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ARGUMENT_CONFIDENCE,
  ARGUMENT_RELATION_TYPES,
  appendArgumentEvent,
  correctArgumentClaim,
  correctArgumentRelation,
  createArgumentClaim,
  createArgumentEvent,
  createArgumentRelation,
  ensureArgumentModel,
  validateArgumentEvidenceRefs,
  validateArgumentModelIntegrity,
} from '../src/argument-model.mjs'

const provenance = { actor: 'agent', action: 'claim-ledger' }

function claim(id, projectId = 'p-a', overrides = {}) {
  return createArgumentClaim({
    id,
    projectId,
    textId: 'd-a',
    anchor: {
      blockId: `block-${id}`,
      exact: `Aussage ${id}.`,
      start: 0,
      end: `Aussage ${id}.`.length,
    },
    text: `Aussage ${id}.`,
    kind: 'fact',
    centrality: 'supporting',
    validity: 'asserted',
    evidenceStatus: 'unverified',
    uncertainty: 'medium',
    evidenceRefs: [],
    provenance,
    fingerprint: `fingerprint-${id}`,
    createdAt: 10,
    ...overrides,
  })
}

test('ARG-01: Claim trägt Projekt, exakten Anker, Gültigkeit, Evidenzlage und Unsicherheit', () => {
  const result = claim('claim-1', 'p-a', {
    centrality: 'central',
    evidenceStatus: 'mixed',
    uncertainty: 'high',
    evidenceRefs: [{ sourceId: 'source-1', locatorId: 'locator-1', bundleId: 'bundle-1' }],
  })
  assert.deepEqual(result.anchor, {
    blockId: 'block-claim-1',
    exact: 'Aussage claim-1.',
    start: 0,
    end: 16,
  })
  assert.equal(result.projectId, 'p-a')
  assert.equal(result.centrality, 'central')
  assert.equal(result.evidenceStatus, 'mixed')
  assert.equal(result.uncertainty, 'high')
  assert.equal(result.provenance.actor, 'agent')
})

test('ARG-01: ungültige Claim-Arten, Zustände, Anker und Herkunft scheitern geschlossen', () => {
  const base = {
    id: 'bad',
    projectId: 'p-a',
    textId: 'd-a',
    anchor: { blockId: 'block-bad', exact: 'Behauptung.', start: 0, end: 11 },
    text: 'Behauptung.',
    kind: 'fact',
    centrality: 'central',
    validity: 'asserted',
    evidenceStatus: 'unverified',
    uncertainty: 'medium',
    evidenceRefs: [],
    provenance,
    fingerprint: 'fingerprint',
    createdAt: 10,
  }
  assert.throws(() => createArgumentClaim({ ...base, kind: 'guess' }), /kind/i)
  assert.throws(() => createArgumentClaim({ ...base, validity: 'true' }), /validity/i)
  assert.throws(() => createArgumentClaim({ ...base, evidenceStatus: 'proven' }), /evidence/i)
  assert.throws(() => createArgumentClaim({ ...base, uncertainty: 'certain' }), /uncertainty/i)
  assert.throws(() => createArgumentClaim({ ...base, anchor: { ...base.anchor, end: 4 } }), /anchor/i)
  assert.throws(() => createArgumentClaim({ ...base, provenance: {} }), /provenance/i)
})

test('ARG-02: alle fünf Relationstypen besitzen explizite Schlussbrücke und Sicherheit', () => {
  const claims = [claim('a'), claim('b')]
  assert.deepEqual(ARGUMENT_RELATION_TYPES, ['supports', 'counters', 'qualifies', 'explains', 'depends-on'])
  assert.deepEqual(ARGUMENT_CONFIDENCE, ['low', 'medium', 'high'])
  const relations = ARGUMENT_RELATION_TYPES.map((type, index) => createArgumentRelation({
    id: `relation-${index}`,
    projectId: 'p-a',
    fromClaimId: 'a',
    toClaimId: 'b',
    type,
    warrant: `Schlussbrücke ${type}`,
    confidence: 'medium',
    provenance,
    createdAt: 20 + index,
  }, { claims }))
  assert.deepEqual(relations.map(relation => relation.type), ARGUMENT_RELATION_TYPES)
  assert.equal(relations.every(relation => relation.origin.warrant.startsWith('Schlussbrücke')), true)
})

test('ARG-02/INV-05: projektfremde, unbekannte, selbstbezogene oder unbegründete Kanten werden abgewiesen', () => {
  const claims = [claim('a'), claim('b'), claim('foreign', 'p-b')]
  const base = {
    id: 'relation',
    projectId: 'p-a',
    fromClaimId: 'a',
    toClaimId: 'b',
    type: 'supports',
    warrant: 'A trägt B, weil die Beobachtung die Aussage direkt stützt.',
    confidence: 'high',
    provenance,
    createdAt: 20,
  }
  assert.throws(() => createArgumentRelation({ ...base, toClaimId: 'foreign' }, { claims }), /project/i)
  assert.throws(() => createArgumentRelation({ ...base, fromClaimId: 'a', toClaimId: 'a' }, { claims }), /self/i)
  assert.throws(() => createArgumentRelation({ ...base, type: 'causes' }, { claims }), /type/i)
  assert.throws(() => createArgumentRelation({ ...base, warrant: ' ' }, { claims }), /warrant/i)
  assert.throws(() => createArgumentRelation({ ...base, confidence: 'absolute' }, { claims }), /confidence/i)
})

test('ARG-02: Nutzerkorrektur ist bindende Projektion und erhält Ursprung sowie Ereignis', () => {
  const claims = [claim('a'), claim('b')]
  const relation = createArgumentRelation({
    id: 'relation-1',
    projectId: 'p-a',
    fromClaimId: 'a',
    toClaimId: 'b',
    type: 'supports',
    warrant: 'Die Beobachtung trägt die Schlussfolgerung.',
    confidence: 'medium',
    provenance,
    createdAt: 20,
  }, { claims })
  const model = ensureArgumentModel({ argumentModel: { claims, relations: [relation] } }).argumentModel
  const before = JSON.stringify(model)
  const corrected = correctArgumentRelation({
    model,
    relationId: relation.id,
    projectId: 'p-a',
    type: 'qualifies',
    warrant: 'Die Beobachtung begrenzt die Reichweite, statt die Aussage vollständig zu stützen.',
    confidence: 'high',
    at: 30,
  })
  assert.equal(JSON.stringify(model), before)
  assert.equal(corrected.relations[0].type, 'qualifies')
  assert.equal(corrected.relations[0].confidence, 'high')
  assert.equal(corrected.relations[0].origin.type, 'supports')
  assert.equal(corrected.relations[0].corrections.length, 1)
  assert.equal(corrected.events.at(-1).kind, 'relation-corrected')
  assert.equal(corrected.events.at(-1).provenance.actor, 'user')
})

test('ARG-01: Nutzerkorrektur eines Claims ist bindend und erhält die textnahe Herkunft', () => {
  const original = claim('a', 'p-a', {
    centrality: 'central',
    kind: 'fact',
    validity: 'asserted',
  })
  const model = ensureArgumentModel({ argumentModel: { claims: [original] } }).argumentModel
  const next = correctArgumentClaim({
    model,
    claimId: original.id,
    projectId: 'p-a',
    kind: 'inference',
    centrality: 'supporting',
    validity: 'qualified',
    at: 30,
  })
  assert.equal(next.claims[0].kind, 'inference')
  assert.equal(next.claims[0].centrality, 'supporting')
  assert.equal(next.claims[0].validity, 'qualified')
  assert.deepEqual(next.claims[0].origin, {
    kind: 'fact',
    centrality: 'central',
    validity: 'asserted',
  })
  assert.equal(next.claims[0].anchor.exact, original.anchor.exact)
  assert.equal(next.claims[0].corrections.length, 1)
  assert.equal(next.events.at(-1).kind, 'claim-corrected')
  assert.throws(() => correctArgumentClaim({
    model,
    claimId: original.id,
    projectId: 'p-b',
    kind: 'fact',
    centrality: 'central',
    validity: 'asserted',
    at: 31,
  }), /project/i)
})

test('Argumentereignisse sind append-only; Migration repariert Listen additiv und Duplikate scheitern', () => {
  const event = createArgumentEvent({
    id: 'argument-event-1',
    projectId: 'p-a',
    kind: 'claim-derived',
    entityId: 'claim-a',
    snapshot: { text: 'A' },
    provenance,
    at: 10,
  })
  const project = ensureArgumentModel({
    id: 'p-a',
    sources: [{ id: 'keep' }],
    argumentModel: { claims: null, relations: {}, findings: 'bad', paths: [], deliberations: [] },
  })
  assert.equal(project.argumentModel.schemaVersion, 1)
  assert.deepEqual(project.argumentModel.claims, [])
  assert.equal(project.sources[0].id, 'keep')
  const next = appendArgumentEvent(project.argumentModel, event)
  assert.deepEqual(project.argumentModel.events, [])
  assert.deepEqual(next.events, [event])
  assert.throws(() => appendArgumentEvent(next, event), /duplicate/i)
  event.snapshot.text = 'Mutiert'
  assert.equal(next.events[0].snapshot.text, 'A')
})

test('INV-05: Evidenzreferenzen müssen im selben Projekt tatsächlich existieren', () => {
  const referenced = claim('referenced', 'p-a', {
    evidenceRefs: [{ sourceId: 'source-a', locatorId: 'locator-a', bundleId: 'bundle-a' }],
  })
  const model = ensureArgumentModel({ argumentModel: { claims: [referenced] } }).argumentModel
  const sources = [{
    id: 'source-a',
    projectId: 'p-a',
    locators: [{ id: 'locator-a' }],
  }]
  const bundles = [{ id: 'bundle-a', projectId: 'p-a' }]
  assert.doesNotThrow(() => validateArgumentEvidenceRefs({
    model,
    projectId: 'p-a',
    sources,
    evidenceBundles: bundles,
  }))
  assert.throws(() => validateArgumentEvidenceRefs({
    model,
    projectId: 'p-a',
    sources: [{ ...sources[0], projectId: 'p-b' }],
    evidenceBundles: bundles,
  }), /foreign project/i)
  assert.throws(() => validateArgumentEvidenceRefs({
    model,
    projectId: 'p-a',
    sources: [],
    evidenceBundles: bundles,
  }), /source-a/i)
  assert.throws(() => validateArgumentEvidenceRefs({
    model,
    projectId: 'p-a',
    sources,
    evidenceBundles: [],
  }), /bundle-a/i)
})

test('INV-05: das persistierte Argumentmodell weist doppelte IDs und fremde Entitäten geschlossen ab', () => {
  const claims = [claim('a'), claim('b')]
  const relation = createArgumentRelation({
    id: 'relation-a-b',
    projectId: 'p-a',
    fromClaimId: 'a',
    toClaimId: 'b',
    type: 'supports',
    warrant: 'A stützt B auf derselben nachvollziehbaren Grundlage.',
    confidence: 'medium',
    provenance,
    createdAt: 20,
  }, { claims })
  const valid = ensureArgumentModel({
    argumentModel: {
      claims,
      relations: [relation],
      findings: [{
        id: 'finding-a',
        projectId: 'p-a',
        kind: 'gap',
        claimId: 'a',
        status: 'open',
        basisFingerprint: 'basis-a',
      }],
    },
  }).argumentModel
  assert.equal(validateArgumentModelIntegrity({ model: valid, projectId: 'p-a' }), true)

  const duplicate = structuredClone(valid)
  duplicate.findings[0].id = 'a'
  assert.throws(() => validateArgumentModelIntegrity({
    model: duplicate,
    projectId: 'p-a',
  }), /duplicate argument entity/i)

  const foreign = structuredClone(valid)
  foreign.relations[0].projectId = 'p-b'
  assert.throws(() => validateArgumentModelIntegrity({
    model: foreign,
    projectId: 'p-a',
  }), /foreign project/i)
})
