import test from 'node:test'
import assert from 'node:assert/strict'

import {
  decideFinding,
  ensureProjectUnderstanding,
  ensureReasoningModel,
  getFindingQueue,
  isIntegrityCategory,
  istRisikoAnnahme,
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

test('normalisiert exakte Anmerkungsarten und leitet Altbestand konservativ ab', () => {
  const doc = { findings: [
    { id: 'exact', anmerkungsart: 'grammatik', category: 'wording' },
    { id: 'source', category: 'source' },
    { id: 'unknown', anmerkungsart: 'kaputt', category: 'unknown' },
  ] }

  ensureReasoningModel(doc)

  assert.equal(doc.findings[0].anmerkungsart, 'grammatik')
  assert.equal(doc.findings[1].anmerkungsart, 'beleg')
  assert.equal(doc.findings[2].anmerkungsart, 'anmerkung')
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
  const doc = { findings: [{ id: 'source', status: 'open', category: 'source', priority: 'critical', target: 'Die ursprüngliche Behauptung' }] }

  const finding = decideFinding(doc, 'source', { kind: 'reject', reason: 'Abgabe heute' }, 42)

  assert.equal(finding.status, 'risk-accepted')
  assert.equal(doc.decisions[0].at, 42)
  assert.equal(doc.decisions[0].reason, 'Abgabe heute')
  assert.equal(doc.decisions[0].resultingText, 'Die ursprüngliche Behauptung')
  assert.equal(getFindingQueue(doc).acceptedRisks.length, 1)
})

test('exakte Beleg-, Fakten- und Widerspruchsarten bleiben Integritätsentscheidungen', () => {
  for (const anmerkungsart of ['beleg', 'faktencheck', 'widerspruch']) {
    const doc = { findings: [{ id: anmerkungsart, status: 'open', category: 'content', anmerkungsart }] }
    const finding = decideFinding(doc, anmerkungsart, { kind: 'reject' }, 42)
    assert.equal(finding.status, 'risk-accepted', anmerkungsart)
  }
})

// Hier stand „zeichnet den gewählten Verwerfungsumfang nachvollziehbar auf". Der
// Umfang ist fort (Issue #38) — eine Anmerkung gilt einmal. Geblieben ist die Frage,
// die wirklich unterscheidet: Ist das Verwerfen dieser Anmerkung eine Risikoannahme?
// Sie lag bisher stumm INNEN in decideFinding; seit die Risiko-Tafel dieselbe Frage
// stellen muss, hat sie einen Namen — und deshalb hier eine eigene Prüfung.
test('istRisikoAnnahme trennt die Integritätsfragen von allem anderen', () => {
  // Die vier strengen Arten, wenn keine Textart feststeht (fail-closed).
  assert.equal(istRisikoAnnahme({ category: 'source' }), true)
  assert.equal(istRisikoAnnahme({ category: 'fact' }), true)
  assert.equal(istRisikoAnnahme({ category: 'method' }), true)
  assert.equal(istRisikoAnnahme({ category: 'logic' }), true)
  // Formulierung und Aufbau sind keine.
  assert.equal(istRisikoAnnahme({ category: 'wording' }), false)
  assert.equal(istRisikoAnnahme({ category: 'structure' }), false)
  // Auch ohne category trägt die Anmerkungsart die Frage.
  assert.equal(istRisikoAnnahme({ anmerkungsart: 'beleg' }), true)
  assert.equal(istRisikoAnnahme({ anmerkungsart: 'satzstil' }), false)
  // Nichts drin, nichts dran.
  assert.equal(istRisikoAnnahme(null), false)
  assert.equal(istRisikoAnnahme({}), false)
  // Geerbte Eigenschaften sind keine Anmerkungsarten — sonst würde ein Finding mit
  // anmerkungsart 'constructor' die Nachschlagetabelle austricksen.
  assert.equal(istRisikoAnnahme({ anmerkungsart: 'constructor' }), false)
  assert.equal(istRisikoAnnahme({ anmerkungsart: 'toString' }), false)
})

test('istRisikoAnnahme folgt der Textart — die Tafel erscheint nur, wo sie trägt', () => {
  // Im Gedicht kennt Onda gar keine Integritätsfrage. Dort ist Verwerfen nie eine
  // Risikoannahme, also erscheint die Tafel dort nie.
  assert.equal(istRisikoAnnahme({ category: 'source', textart: 'lyrik' }), false)
  assert.equal(istRisikoAnnahme({ anmerkungsart: 'beleg', textart: 'lyrik' }), false)
  // Ein Marketingtext darf zuspitzen und weglassen — aber eine falsche
  // Tatsachenbehauptung bleibt falsch. Der fehlende Beleg ist dort keine Frage mehr.
  assert.equal(istRisikoAnnahme({ category: 'fact', textart: 'marketing' }), true)
  assert.equal(istRisikoAnnahme({ category: 'source', textart: 'marketing' }), false)
})

test('die Buchführung benutzt dieselbe Regel wie die Tafel', () => {
  // Wenn diese beiden auseinanderliefen, erschiene die Tafel in Fällen, die als
  // 'dismissed' verbucht werden — oder eine Risikoannahme geschähe wortlos.
  for (const finding of [
    { id: 'a', status: 'open', category: 'source' },
    { id: 'b', status: 'open', category: 'wording' },
    { id: 'c', status: 'open', category: 'source', textart: 'lyrik' },
    { id: 'd', status: 'open', anmerkungsart: 'beleg' },
  ]) {
    const doc = { findings: [{ ...finding }] }
    const entschieden = decideFinding(doc, finding.id, { kind: 'reject' }, 42)
    assert.equal(
      entschieden.status === 'risk-accepted',
      istRisikoAnnahme(finding),
      `${finding.id}: Tafel und Buchführung sind sich uneinig`,
    )
  }
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
  assert.equal(doc.decisions[0].resultingText, 'Praeziser.')
  assert.equal(finding.action, 'Kuerzer.')
})

// Die Textart ist ein zusaetzlicher, optionaler Parameter: alle bisherigen Aufrufer rufen
// isIntegrityCategory weiterhin mit einem Argument und bekommen exakt das Verhalten von vorher.
test('isIntegrityCategory ohne Textart entscheidet wie bisher', () => {
  for (const category of ['fact', 'source', 'citation', 'method', 'logic']) {
    assert.equal(isIntegrityCategory(category), true, `${category} war und bleibt eine Integritaetsfrage`)
  }
  for (const category of ['wording', 'structure', 'content', '', undefined, null]) {
    assert.equal(isIntegrityCategory(category), false, `${String(category)} war und bleibt keine`)
  }
})

test('isIntegrityCategory mit Textart macht die Liste enger, nie weiter', () => {
  assert.equal(isIntegrityCategory('source', 'scientific'), true)
  assert.equal(isIntegrityCategory('source', 'campaign'), false)
  assert.equal(isIntegrityCategory('citation', 'campaign'), false)
  assert.equal(isIntegrityCategory('method', 'essay'), false)
  assert.equal(isIntegrityCategory('fact', 'campaign'), true)
  // Was hier nie eine Integritaetsfrage war, wird durch keine Textart zu einer.
  for (const textart of ['scientific', 'campaign', 'marketing', 'other']) {
    assert.equal(isIntegrityCategory('wording', textart), false)
    assert.equal(isIntegrityCategory('structure', textart), false)
    assert.equal(isIntegrityCategory('content', textart), false)
  }
  // Fail-closed: unbekannte oder leere Textart aendert nichts.
  for (const textart of ['reportage', 'gedicht', '', '   ', null, undefined]) {
    assert.equal(isIntegrityCategory('source', textart), true, `Textart ${String(textart)}`)
    assert.equal(isIntegrityCategory('method', textart), true, `Textart ${String(textart)}`)
  }
})

// Die Textart reist am Finding mit (agent-findings.mjs), damit Entscheidung und Umwandlung
// dieselbe Regel anwenden -- auch bei Findings, die aus einer alten Sitzung kommen.
test('decideFinding folgt der Textart am Finding, sonst der alten Regel', () => {
  const docPlakat = { findings: [{ id: 'source', status: 'open', category: 'source', textart: 'campaign', target: 'Sechs Wörter' }] }
  assert.equal(decideFinding(docPlakat, 'source', { kind: 'reject' }, 42).status, 'dismissed')

  const docAlt = { findings: [{ id: 'source', status: 'open', category: 'source', target: 'Eine Behauptung' }] }
  assert.equal(decideFinding(docAlt, 'source', { kind: 'reject' }, 42).status, 'risk-accepted')
})

test('rejects unknown findings and duplicate decisions', () => {
  const doc = { findings: [{ id: 'f1', status: 'open', category: 'wording' }] }

  assert.throws(() => decideFinding(doc, 'missing', { kind: 'accept' }, 42), /nicht gefunden/)
  decideFinding(doc, 'f1', { kind: 'accept' }, 42)
  assert.throws(() => decideFinding(doc, 'f1', { kind: 'reject' }, 43), /bereits entschieden/)
})
