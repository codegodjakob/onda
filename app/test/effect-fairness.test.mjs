import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeEffectFairness } from '../src/effect-fairness.mjs'
import {
  createArgumentClaim,
  createArgumentRelation,
  ensureArgumentModel,
} from '../src/argument-model.mjs'

function argumentFixture() {
  const centralText = 'Das Angebot garantiert jeder Gemeinde sinkende Kosten.'
  const counterText = 'In kleinen Gemeinden stiegen die Folgekosten im ersten Jahr.'
  const central = createArgumentClaim({
    id: 'central',
    projectId: 'p-a',
    textId: 'd-a',
    anchor: { blockId: 'b-central', exact: centralText, start: 0, end: centralText.length },
    text: centralText,
    kind: 'fact',
    centrality: 'central',
    validity: 'asserted',
    evidenceStatus: 'unverified',
    uncertainty: 'high',
    evidenceRefs: [],
    provenance: { actor: 'user', action: 'text-claim' },
    fingerprint: 'central-fingerprint',
    createdAt: 1,
  })
  const counter = createArgumentClaim({
    id: 'counter',
    projectId: 'p-a',
    textId: 'd-b',
    anchor: { blockId: 'b-counter', exact: counterText, start: 0, end: counterText.length },
    text: counterText,
    kind: 'fact',
    centrality: 'supporting',
    validity: 'contested',
    evidenceStatus: 'supported',
    uncertainty: 'low',
    evidenceRefs: [{ bundleId: 'counter-bundle' }],
    provenance: { actor: 'user', action: 'text-claim' },
    fingerprint: 'counter-fingerprint',
    createdAt: 2,
  })
  const relation = createArgumentRelation({
    id: 'counter-central',
    projectId: 'p-a',
    fromClaimId: counter.id,
    toClaimId: central.id,
    type: 'counters',
    warrant: 'Die beobachteten Folgekosten widersprechen der universellen Kostenzusage.',
    confidence: 'high',
    provenance: { actor: 'agent', action: 'safe-block-relation' },
    createdAt: 3,
  }, { claims: [central, counter] })
  return ensureArgumentModel({
    argumentModel: { claims: [central, counter], relations: [relation] },
  }).argumentModel
}

function context(overrides = {}) {
  return {
    projectId: 'p-a',
    complete: true,
    known: {
      genre: 'marketing',
      passageFunction: 'activate',
      audience: ['kommunale Entscheiderinnen'],
      goal: 'Angebot prüfen',
      ...overrides,
    },
    missing: [],
    sources: {},
  }
}

test('EFFECT-05: falsche Zuspitzung, ausgelassene Gegeninformation und Ausnutzung stehen vor Stil', () => {
  const report = analyzeEffectFairness({
    projectId: 'p-a',
    textId: 'd-a',
    context: context(),
    blocks: [{
      id: 'b-central',
      role: 'claim',
      text: 'Das Angebot garantiert jeder Gemeinde sinkende Kosten. Nur heute: Du willst doch nicht schuld am Scheitern sein.',
    }],
    argumentModel: argumentFixture(),
    at: 100,
  })
  assert.deepEqual(report.findings.map(item => item.kind), [
    'unsupported-intensification',
    'omitted-counterinformation',
    'exploitative-personalization',
  ])
  assert.equal(report.findings.every(item => item.class === 'integrity-warning'), true)
  assert.equal(report.findings.every(item => item.anchor?.exact && item.reviewQuestion && item.fingerprint), true)
  assert.equal(report.findings.every(item => ['critical', 'high'].includes(item.priority)), true)
  assert.equal(report.findings[0].priority, 'critical')
  assert.equal(report.findings[0].order < report.styleOrder, true)
})

test('EFFECT-05: wahrhaftiger, begrenzter Nutzenhinweis ohne Ausnutzung bleibt unbehelligt', () => {
  const model = argumentFixture()
  model.claims[0].text = 'In der untersuchten Gruppe sanken die direkten Kosten.'
  model.claims[0].anchor.exact = model.claims[0].text
  model.claims[0].anchor.end = model.claims[0].text.length
  model.claims[0].evidenceStatus = 'supported'
  model.claims[0].evidenceRefs = [{ bundleId: 'support' }]
  model.relations = []
  const report = analyzeEffectFairness({
    projectId: 'p-a',
    textId: 'd-a',
    context: context(),
    blocks: [{ id: 'b-central', role: 'claim', text: model.claims[0].text }],
    argumentModel: model,
    at: 100,
  })
  assert.deepEqual(report.findings, [])
})

test('Fairnessprüfung läuft nur in passendem persuasivem Profil und bleibt projektisoliert', () => {
  const model = argumentFixture()
  const essay = analyzeEffectFairness({
    projectId: 'p-a',
    textId: 'd-a',
    context: context({ genre: 'essay' }),
    blocks: [{ id: 'b-central', role: 'claim', text: 'Du willst doch nicht scheitern.' }],
    argumentModel: model,
    at: 100,
  })
  assert.deepEqual(essay.findings, [])
  assert.equal(essay.status, 'not-applicable')
  assert.throws(() => analyzeEffectFairness({
    projectId: 'p-b',
    textId: 'd-a',
    context: context(),
    blocks: [],
    argumentModel: model,
    at: 100,
  }), /project/i)
})

test('Fairnessprüfung zeigt bei unbekanntem Genre eine Enthaltung, unterdrückt aber offensichtlichen Druck nicht', () => {
  const unknown = context({ genre: '' })
  unknown.complete = false
  unknown.missing = ['genre']
  const report = analyzeEffectFairness({
    projectId: 'p-a',
    textId: 'd-a',
    context: unknown,
    blocks: [{
      id: 'b-central',
      role: 'claim',
      text: 'Das Angebot garantiert jede Einsparung. Nur heute: Du willst doch nicht scheitern.',
    }],
    argumentModel: argumentFixture(),
    at: 100,
  })
  assert.equal(report.status, 'limited')
  assert.deepEqual(report.missingContext, ['genre'])
  assert.deepEqual(report.findings.map(item => item.kind), [
    'unsupported-intensification',
    'exploitative-personalization',
  ])
})

test('Fairnessprüfung nennt nur aktive direkt belegte Gegeninformation als ausgelassen', () => {
  const model = argumentFixture()
  const counter = model.claims.find(claim => claim.id === 'counter')
  counter.status = 'stale'
  counter.evidenceStatus = 'unverified'
  counter.evidenceRefs = []
  const report = analyzeEffectFairness({
    projectId: 'p-a',
    textId: 'd-a',
    context: context(),
    blocks: [{ id: 'b-central', role: 'claim', text: model.claims[0].text }],
    argumentModel: model,
    at: 100,
  })
  assert.equal(report.findings.some(item => item.kind === 'omitted-counterinformation'), false)
})
