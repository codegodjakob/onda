import test from 'node:test'
import assert from 'node:assert/strict'
import {
  KATEGORIE_ZU_CATEGORY,
  baueDocText,
  blockFuerAnkerIndex,
  fasseEntscheidungenZusammen,
  fasseOffeneHinweiseZusammen,
  hinweisZuFinding,
} from '../src/agent-findings.mjs'
import { decideFinding, ensureReasoningModel, getFindingQueue, isIntegrityCategory } from '../src/reasoning-model.mjs'
import { dedupeHinweise } from '../src/anchor-verify.mjs'

const ankerGefunden = { gefunden: true, index: 0, normalisiert: false }

function beispielHinweis(extra = {}) {
  return {
    kategorie: 'logik',
    anker: 'jede Unterbrechung schadet dem Denken',
    beobachtung: 'Die These ist absolut formuliert.',
    relevanz: 'Absolute Thesen sind leicht angreifbar.',
    folge: 'Ein einziges Gegenbeispiel entkräftet den Absatz.',
    vorschlag: null,
    istGrundursache: false,
    integritaet: true,
    ...extra,
  }
}

test('Kategorie-Mapping deckt alle 8 deutschen Kategorien ab und trifft die Integritätsregel', () => {
  assert.deepEqual(Object.keys(KATEGORIE_ZU_CATEGORY).sort(), [
    'erklaerung', 'fakt', 'logik', 'methode', 'quelle', 'sprache', 'struktur', 'wirkung',
  ])
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.fakt), true)
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.quelle), true)
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.methode), true)
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.logik), true)
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.struktur), false)
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.wirkung), false)
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.erklaerung), false)
  assert.equal(isIntegrityCategory(KATEGORIE_ZU_CATEGORY.sprache), false)
})

test('hinweisZuFinding liefert ein Finding in exakt der bestehenden Passage-Form', () => {
  const finding = hinweisZuFinding(beispielHinweis(), ankerGefunden, 'b-eins', 1000)
  assert.equal(finding.placement, 'passage')
  assert.equal(finding.status, 'open')
  assert.equal(finding.target, 'jede Unterbrechung schadet dem Denken')
  assert.equal(finding.short, 'Die These ist absolut formuliert.')
  assert.equal(finding.why, 'Absolute Thesen sind leicht angreifbar.')
  assert.equal(finding.folge, 'Ein einziges Gegenbeispiel entkräftet den Absatz.')
  assert.equal(finding.category, 'logic')
  assert.equal(finding.kiKategorie, 'logik')
  assert.equal(finding.kind, 'inhalt')
  assert.equal(finding.form, 'note')
  assert.equal(finding.blockId, 'b-eins')
  assert.equal(finding.createdAt, 1000)
  assert.deepEqual(finding.sources, [])
  assert.deepEqual(finding.variants, [])
  assert.equal(finding.action, '')
  assert.ok(finding.id.startsWith('ki-'))
})

test('Vorschlag innerhalb des Ankers wird zur Markierung mit anwendbarer Neufassung', () => {
  const finding = hinweisZuFinding(beispielHinweis({
    kategorie: 'sprache',
    anker: 'fragmentieren die Aufmerksamkeit spürbar',
    vorschlag: { bisher: 'fragmentieren', neu: 'zerteilen' },
    integritaet: false,
  }), ankerGefunden, 'b-eins', 1000)
  assert.equal(finding.kind, 'form')
  assert.equal(finding.category, 'wording')
  assert.equal(finding.form, 'mark')
  assert.equal(finding.action, 'zerteilen die Aufmerksamkeit spürbar')
  assert.deepEqual(finding.variants, ['zerteilen die Aufmerksamkeit spürbar'])
})

test('Vorschlag ohne wortgleiches bisher im Anker wird still verworfen — Hinweis bleibt als Notiz', () => {
  const finding = hinweisZuFinding(beispielHinweis({
    vorschlag: { bisher: 'kommt im Anker nicht vor', neu: 'egal' },
  }), ankerGefunden, 'b-eins', 1000)
  assert.equal(finding.action, '')
  assert.deepEqual(finding.variants, [])
  assert.equal(finding.form, 'note')
})

test('Integritätshinweise erhalten die zu belegende Aussage als claim, andere nicht', () => {
  const integritaet = hinweisZuFinding(beispielHinweis({ kategorie: 'fakt' }), ankerGefunden, 'b-eins', 1000)
  const stil = hinweisZuFinding(beispielHinweis({ kategorie: 'wirkung', integritaet: false }), ankerGefunden, 'b-eins', 1000)
  assert.equal(integritaet.claim, integritaet.target)
  assert.equal(stil.claim, undefined)
})

test('nicht gefundener Anker und leerer Anker liefern null', () => {
  assert.equal(hinweisZuFinding(beispielHinweis(), { gefunden: false, index: null, normalisiert: false }, 'b-eins'), null)
  assert.equal(hinweisZuFinding(beispielHinweis({ anker: '' }), ankerGefunden, 'b-eins'), null)
})

test('baueDocText und blockFuerAnkerIndex bilden Anker-Fundstellen auf Bausteine ab', () => {
  const blocks = [
    { id: 'b-eins', text: 'Erster Absatz.' },
    { id: 'b-zwei', text: 'Zweiter Absatz mit Anker.' },
  ]
  const docText = baueDocText(blocks)
  assert.equal(docText, 'Erster Absatz.\n\nZweiter Absatz mit Anker.')
  assert.equal(blockFuerAnkerIndex(blocks, docText.indexOf('Erster')), 'b-eins')
  assert.equal(blockFuerAnkerIndex(blocks, docText.indexOf('Anker')), 'b-zwei')
  assert.equal(blockFuerAnkerIndex(blocks, docText.length + 5), null)
  assert.equal(blockFuerAnkerIndex(blocks, -1), null)
  assert.equal(blockFuerAnkerIndex(blocks, null), null)
})

test('Grundursache wird high priorisiert und parkt Geschwister über rootCauseId in der bestehenden Queue', () => {
  const grundursache = hinweisZuFinding(beispielHinweis({ istGrundursache: true }), ankerGefunden, 'b-eins', 1000)
  const folgehinweis = hinweisZuFinding(beispielHinweis({
    kategorie: 'struktur', anker: 'anderer Anker im Text', integritaet: false,
  }), ankerGefunden, 'b-zwei', 1001)
  folgehinweis.rootCauseId = grundursache.id
  assert.equal(grundursache.priority, 'high')
  assert.equal(grundursache.istGrundursache, true)
  const doc = ensureReasoningModel({ findings: [folgehinweis, grundursache], decisions: [] })
  const queue = getFindingQueue(doc)
  assert.equal(queue.current.id, grundursache.id)
  assert.deepEqual(queue.parked.map(finding => finding.id), [folgehinweis.id])
})

test('fasseEntscheidungenZusammen und fasseOffeneHinweiseZusammen trennen entschieden und offen', () => {
  const entschieden = hinweisZuFinding(beispielHinweis({ kategorie: 'quelle' }), ankerGefunden, 'b-eins', 1000)
  const offen = hinweisZuFinding(beispielHinweis({ kategorie: 'struktur', anker: 'offener Anker', integritaet: false }), ankerGefunden, 'b-zwei', 1001)
  const doc = ensureReasoningModel({ findings: [entschieden, offen], decisions: [] })
  decideFinding(doc, entschieden.id, { kind: 'reject', reason: 'Quelle folgt später.' }, 2000)

  const entscheidungen = fasseEntscheidungenZusammen(doc.findings, doc.decisions)
  assert.deepEqual(entscheidungen, [{
    anker: 'jede Unterbrechung schadet dem Denken',
    kategorie: 'quelle',
    kurz: 'Die These ist absolut formuliert.',
    entscheidung: 'risk-accepted',
    begruendung: 'Quelle folgt später.',
  }])
  const offene = fasseOffeneHinweiseZusammen(doc.findings)
  assert.deepEqual(offene, [{
    anker: 'offener Anker',
    kategorie: 'struktur',
    kurz: 'Die These ist absolut formuliert.',
  }])
})

test('Dedupe-Regressionstest: Wiederholungs-Sperre greift für alle 8 Kategorien', () => {
  // Szenario 1: Integritäts-Kategorie (quelle) — bereits entschieden, darf nicht wieder vorgeschlagen werden
  const entschiedenerQuellen = hinweisZuFinding(beispielHinweis({ kategorie: 'quelle' }), ankerGefunden, 'b-eins', 1000)
  const doc1 = ensureReasoningModel({ findings: [entschiedenerQuellen], decisions: [] })
  decideFinding(doc1, entschiedenerQuellen.id, { kind: 'reject', reason: 'Quelle folgt später.' }, 2000)

  // Frischer Hinweis mit gleichem Anker + Kategorie → sollte gefiltert werden
  const frischerQuellen = beispielHinweis({ kategorie: 'quelle' })
  const dedupiert1 = dedupeHinweise([frischerQuellen], doc1.findings, doc1.decisions)
  assert.equal(dedupiert1.length, 0, 'Wiederholung quelle sollte gefiltert werden')

  // Szenario 2: Nicht-Integritäts-Kategorie (wirkung) — bereits entschieden, darf nicht wieder vorgeschlagen werden
  const entschiedenerWirkung = hinweisZuFinding(beispielHinweis({ kategorie: 'wirkung', anker: 'Anderer Anker', integritaet: false }), ankerGefunden, 'b-zwei', 1000)
  const doc2 = ensureReasoningModel({ findings: [entschiedenerWirkung], decisions: [] })
  decideFinding(doc2, entschiedenerWirkung.id, { kind: 'accept', reason: '' }, 2000)

  const frischerWirkung = beispielHinweis({ kategorie: 'wirkung', anker: 'Anderer Anker', integritaet: false })
  const dedupiert2 = dedupeHinweise([frischerWirkung], doc2.findings, doc2.decisions)
  assert.equal(dedupiert2.length, 0, 'Wiederholung wirkung sollte gefiltert werden')

  // Szenario 3: Anderer Anker — sollte NICHT gefiltert werden (unterschiedlicher Anker)
  const frischerAndererAnker = beispielHinweis({ kategorie: 'quelle', anker: 'völlig neuer Anker' })
  const dedupiert3 = dedupeHinweise([frischerAndererAnker], doc1.findings, doc1.decisions)
  assert.equal(dedupiert3.length, 1, 'Neuer Anker sollte NICHT gefiltert werden')

  // Szenario 4: Andere Kategorie — sollte NICHT gefiltert werden (unterschiedliche Kategorie)
  const frischerAndereKategorie = beispielHinweis({ kategorie: 'methode' })
  const dedupiert4 = dedupeHinweise([frischerAndereKategorie], doc1.findings, doc1.decisions)
  assert.equal(dedupiert4.length, 1, 'Andere Kategorie sollte NICHT gefiltert werden')
})
