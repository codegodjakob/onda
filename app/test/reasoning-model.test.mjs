import test from 'node:test'
import assert from 'node:assert/strict'

import {
  decideFinding,
  ensureProjectUnderstanding,
  ensureReasoningModel,
  getFindingQueue,
} from '../src/reasoning-model.mjs'

test('normalizes project understanding without discarding existing fields', () => {
  const project = { understanding: { task: 'Hausarbeit' } }

  const result = ensureProjectUnderstanding(project)

  assert.equal(result.task, 'Hausarbeit')
  assert.deepEqual(result.audience, [])
  assert.deepEqual(result.protectedIntentions, [])
  assert.equal(project.understanding, result)
})

test('keeps project understanding identity stable across repeated rendering', () => {
  const project = { understanding: { task: 'Essay', audience: [] } }

  const first = ensureProjectUnderstanding(project)
  const second = ensureProjectUnderstanding(project)

  assert.equal(second, first)
})

test('migrates legacy coach and lane entries into one finding collection once', () => {
  const doc = {
    coach: [{ id: 'c1', type: 'Struktur', status: 'open', text: 'These fehlt' }],
    lane: [{ id: 'l1', kind: 'form', status: 'open', target: 'sehr gut', short: 'Unpraezise' }],
  }

  ensureReasoningModel(doc)
  ensureReasoningModel(doc)

  assert.equal(doc.findings.length, 2)
  assert.equal(doc.findings.find(x => x.id === 'c1').placement, 'document')
  assert.equal(doc.findings.find(x => x.id === 'l1').placement, 'passage')
})

test('preserves existing findings and decisions during repeated normalization', () => {
  const doc = {
    findings: [{ id: 'f1', status: 'resolved' }],
    decisions: [{ id: 'd1', findingId: 'f1', kind: 'accept', at: 1 }],
  }

  ensureReasoningModel(doc)
  ensureReasoningModel(doc)

  assert.equal(doc.findings.length, 1)
  assert.equal(doc.decisions.length, 1)
})

test('normalizes only explicit nonempty finding claims without deriving one', () => {
  const doc = { findings: [
    { id: 'valid', claim: '  Eine exakt zu belegende Aussage.  ' },
    {
      id: 'blank',
      claim: '   ',
      target: 'Passage im Text',
      short: 'Beobachtung des Agenten',
      text: 'Handlungsanweisung',
    },
    { id: 'missing', target: 'Andere Passage', short: 'Noch ein Hinweis' },
  ] }

  ensureReasoningModel(doc)

  assert.equal(doc.findings[0].claim, 'Eine exakt zu belegende Aussage.')
  assert.equal(Object.hasOwn(doc.findings[1], 'claim'), false)
  assert.equal(Object.hasOwn(doc.findings[2], 'claim'), false)
})

test('surfaces one unblocked root cause and parks its dependants', () => {
  const doc = { findings: [
    { id: 'style', status: 'open', priority: 'normal', category: 'wording', createdAt: 1 },
    { id: 'root', status: 'open', priority: 'high', category: 'logic', createdAt: 2 },
    { id: 'child', status: 'open', priority: 'critical', category: 'source', rootCauseId: 'root', createdAt: 3 },
  ] }

  const queue = getFindingQueue(doc)

  assert.equal(queue.current.id, 'root')
  assert.deepEqual(queue.parked.map(x => x.id), ['child'])
  assert.equal(queue.pendingCount, 3)
})

test('uses integrity before age when priorities match', () => {
  const doc = { findings: [
    { id: 'wording', status: 'open', priority: 'high', category: 'wording', createdAt: 1 },
    { id: 'source', status: 'open', priority: 'high', category: 'source', createdAt: 2 },
  ] }

  assert.equal(getFindingQueue(doc).current.id, 'source')
})

test('records rejection of an integrity finding as accepted risk', () => {
  const doc = { findings: [{ id: 'source', status: 'open', category: 'source', priority: 'critical' }] }

  const finding = decideFinding(doc, 'source', { kind: 'reject', reason: 'Abgabe heute' }, 42)

  assert.equal(finding.status, 'risk-accepted')
  assert.equal(doc.decisions[0].at, 42)
  assert.equal(doc.decisions[0].reason, 'Abgabe heute')
  assert.equal(getFindingQueue(doc).acceptedRisks.length, 1)
})

test('dismisses a wording proposal without creating an integrity risk', () => {
  const doc = { findings: [{ id: 'wording', status: 'open', category: 'wording' }] }

  const finding = decideFinding(doc, 'wording', { kind: 'reject' }, 42)

  assert.equal(finding.status, 'dismissed')
  assert.equal(getFindingQueue(doc).acceptedRisks.length, 0)
})

test('records accepted and edited suggestions without changing text itself', () => {
  const doc = { findings: [{ id: 'wording', status: 'open', category: 'wording', action: 'Kuerzer.' }] }

  const finding = decideFinding(doc, 'wording', { kind: 'accept', appliedText: 'Praeziser.' }, 42)

  assert.equal(finding.status, 'resolved')
  assert.equal(doc.decisions[0].appliedText, 'Praeziser.')
  assert.equal(finding.action, 'Kuerzer.')
})

test('rejects unknown findings and duplicate decisions', () => {
  const doc = { findings: [{ id: 'f1', status: 'open', category: 'wording' }] }

  assert.throws(() => decideFinding(doc, 'missing', { kind: 'accept' }, 42), /nicht gefunden/)
  decideFinding(doc, 'f1', { kind: 'accept' }, 42)
  assert.throws(() => decideFinding(doc, 'f1', { kind: 'reject' }, 43), /bereits entschieden/)
})
