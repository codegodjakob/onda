import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeClaimModality } from '../src/language-modality.mjs'
import { createArgumentClaim, ensureArgumentModel } from '../src/argument-model.mjs'

function claim(id, text, evidenceStatus) {
  return createArgumentClaim({
    id,
    projectId: 'p-a',
    textId: 'd-a',
    anchor: { blockId: `b-${id}`, exact: text, start: 0, end: text.length },
    text,
    kind: 'fact',
    centrality: 'central',
    validity: 'asserted',
    evidenceStatus,
    uncertainty: evidenceStatus === 'supported' ? 'low' : 'high',
    evidenceRefs: evidenceStatus === 'supported' ? [{ bundleId: `bundle-${id}` }] : [],
    provenance: { actor: 'user', action: 'text-claim' },
    fingerprint: `fingerprint-${id}`,
    createdAt: 1,
  })
}

test('LANG-04: starke Modalität bei schwacher Evidenz wird claim-spezifisch beanstandet', () => {
  const claims = [
    claim('weak', 'Die Studie beweist zweifellos eine Wirkung.', 'unverified'),
    claim('mixed', 'Der Befund legt eine Wirkung nahe.', 'mixed'),
    claim('supported', 'Die Messung zeigt den Rückgang in dieser Stichprobe.', 'supported'),
  ]
  const model = ensureArgumentModel({ argumentModel: { claims } }).argumentModel
  const report = analyzeClaimModality({
    model,
    projectId: 'p-a',
    textId: 'd-a',
    at: 100,
  })
  assert.equal(report.diagnostics.length, 1)
  assert.equal(report.diagnostics[0].claimId, 'weak')
  assert.equal(report.diagnostics[0].class, 'integrity-warning')
  assert.equal(report.diagnostics[0].direction, 'too-strong')
  assert.match(report.diagnostics[0].reason, /unverified/)
  assert.equal(JSON.stringify(report).includes('supported'), true)
})

test('LANG-04: unnötige Abschwächung bei direkter Stützung bleibt Beobachtung, nicht Fehler', () => {
  const claims = [
    claim('hedged', 'Die Messung könnte einen Rückgang zeigen.', 'supported'),
  ]
  const report = analyzeClaimModality({
    model: ensureArgumentModel({ argumentModel: { claims } }).argumentModel,
    projectId: 'p-a',
    textId: 'd-a',
    at: 100,
  })
  assert.equal(report.diagnostics.length, 1)
  assert.equal(report.diagnostics[0].class, 'register-observation')
  assert.equal(report.diagnostics[0].direction, 'too-weak')
  assert.equal(report.diagnostics[0].label.includes('Fehler'), false)
})

test('LANG-04: direkt gestützte Evidenz rechtfertigt keine undokumentierte universelle Reichweite', () => {
  const claims = [
    claim('universal', 'Die Methode wirkt immer bei allen Gruppen.', 'supported'),
    claim('bounded', 'Die Methode wirkt in der untersuchten Gruppe.', 'supported'),
  ]
  const report = analyzeClaimModality({
    model: ensureArgumentModel({ argumentModel: { claims } }).argumentModel,
    projectId: 'p-a',
    textId: 'd-a',
    at: 100,
  })
  assert.deepEqual(report.diagnostics.map(item => item.claimId), ['universal'])
  assert.equal(report.diagnostics[0].direction, 'too-strong')
  assert.match(report.diagnostics[0].reason, /Population/)
})

test('Modalitätsprüfung ist text- und projektisoliert', () => {
  const claims = [
    claim('local', 'Die Studie beweist alles.', 'unverified'),
    { ...claim('other-text', 'Die Studie beweist nichts.', 'unverified'), textId: 'd-b' },
  ]
  const model = ensureArgumentModel({ argumentModel: { claims } }).argumentModel
  const report = analyzeClaimModality({ model, projectId: 'p-a', textId: 'd-a', at: 100 })
  assert.deepEqual(report.diagnostics.map(item => item.claimId), ['local'])
  assert.throws(() => analyzeClaimModality({
    model,
    projectId: 'p-b',
    textId: 'd-a',
    at: 100,
  }), /project/i)
})
