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
import { dedupeHinweise, findeAnker } from '../src/anchor-verify.mjs'

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

// Fix-Runde 2, Finding 3 (Important): hinweisZuFinding baut target/claim seit dem Fix aus
// docText.slice(index, index+laenge) -- dem ECHTEN Wortlaut im Dokument -- statt aus der
// Modell-Schreibweise (hinweis.anker). Die meisten Tests hier pruefen NICHT die
// Anker-Verifikation selbst (das deckt anchor-verify.test.mjs ab), sondern die Umwandlung --
// darum baut dieser Helfer einen exakten Treffer nach: docText ist genau der Anker-Text, an
// Index 0, wie es ein echtes findeAnker() fuer eine unveraenderte Fundstelle ebenfalls liefern
// wuerde. Der eigene Regressionstest weiter unten deckt den Fall ab, in dem sich target und
// anker unterscheiden (typografische Anfuehrungszeichen).
function ankerErgebnisFuer(anker) {
  return { gefunden: true, index: 0, normalisiert: false, laenge: anker.length }
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
  const hinweis = beispielHinweis()
  const finding = hinweisZuFinding(hinweis, ankerErgebnisFuer(hinweis.anker), 'b-eins', hinweis.anker, 1000)
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
  assert.deepEqual(finding.provenance, { actor: 'agent', action: 'hinweise', createdAt: 1000 })
  assert.deepEqual(finding.sources, [])
  assert.deepEqual(finding.variants, [])
  assert.equal(finding.action, '')
  assert.ok(finding.id.startsWith('ki-'))
})

test('Vorschlag innerhalb des Ankers wird zur Markierung mit anwendbarer Neufassung', () => {
  const hinweis = beispielHinweis({
    kategorie: 'sprache',
    anker: 'fragmentieren die Aufmerksamkeit spürbar',
    vorschlag: { bisher: 'fragmentieren', neu: 'zerteilen' },
    integritaet: false,
  })
  const finding = hinweisZuFinding(hinweis, ankerErgebnisFuer(hinweis.anker), 'b-eins', hinweis.anker, 1000)
  assert.equal(finding.kind, 'form')
  assert.equal(finding.category, 'wording')
  assert.equal(finding.form, 'mark')
  assert.equal(finding.action, 'zerteilen die Aufmerksamkeit spürbar')
  assert.deepEqual(finding.variants, ['zerteilen die Aufmerksamkeit spürbar'])
})

test('Vorschlag ohne wortgleiches bisher im Anker wird still verworfen — Hinweis bleibt als Notiz', () => {
  const hinweis = beispielHinweis({
    vorschlag: { bisher: 'kommt im Anker nicht vor', neu: 'egal' },
  })
  const finding = hinweisZuFinding(hinweis, ankerErgebnisFuer(hinweis.anker), 'b-eins', hinweis.anker, 1000)
  assert.equal(finding.action, '')
  assert.deepEqual(finding.variants, [])
  assert.equal(finding.form, 'note')
})

test('Integritätshinweise erhalten die zu belegende Aussage als claim, andere nicht', () => {
  const hinweisFakt = beispielHinweis({ kategorie: 'fakt' })
  const hinweisWirkung = beispielHinweis({ kategorie: 'wirkung', integritaet: false })
  const integritaet = hinweisZuFinding(hinweisFakt, ankerErgebnisFuer(hinweisFakt.anker), 'b-eins', hinweisFakt.anker, 1000)
  const stil = hinweisZuFinding(hinweisWirkung, ankerErgebnisFuer(hinweisWirkung.anker), 'b-eins', hinweisWirkung.anker, 1000)
  assert.equal(integritaet.claim, integritaet.target)
  assert.equal(stil.claim, undefined)
})

test('nicht gefundener Anker und leerer Anker liefern null', () => {
  assert.equal(hinweisZuFinding(beispielHinweis(), { gefunden: false, index: null, normalisiert: false, laenge: null }, 'b-eins', 'Text'), null)
  assert.equal(hinweisZuFinding(beispielHinweis({ anker: '' }), ankerErgebnisFuer('x'), 'b-eins', 'Text'), null)
})

// Fix-Runde 2, Finding 3 (Important): das ist der Kern-Regressionstest fuer den Fix. Das Modell
// zitiert oft mit geraden Anfuehrungszeichen, das Dokument traegt aber typografische ("smart
// quotes"). findeAnker findet den Anker trotzdem (normalisiert), aber VOR dem Fix setzte
// hinweisZuFinding target = hinweis.anker (die Modell-Schreibweise) -- "annehmen"/"eigene
// Fassung" und die Markierung im Editor scheiterten dann, weil target nicht wortwoertlich im
// Dokument vorkam. target muss der ECHTE Wortlaut aus dem Dokument sein.
test('hinweisZuFinding: target ist der echte Dokument-Wortlaut, nicht die Modell-Schreibweise (typografische Anfuehrungszeichen)', () => {
  const docText = 'Sie nannte es „ein stilles Werkzeug“ in ihrem Aufsatz.'
  const hinweis = beispielHinweis({ anker: '"ein stilles Werkzeug"', kategorie: 'wirkung', integritaet: false })
  const ankerErgebnis = findeAnker(docText, hinweis.anker)
  assert.equal(ankerErgebnis.gefunden, true)
  assert.equal(ankerErgebnis.normalisiert, true, 'Testvoraussetzung: der Treffer muss normalisiert sein (typografische Anfuehrungszeichen)')

  const finding = hinweisZuFinding(hinweis, ankerErgebnis, 'b-eins', docText, 1000)
  assert.equal(finding.target, '„ein stilles Werkzeug“')
  assert.notEqual(finding.target, hinweis.anker, 'target darf nicht mehr die Modell-Schreibweise sein')
  assert.ok(docText.includes(finding.target), 'target muss woertlich im Dokument vorkommen')
})

test('hinweisZuFinding: ohne ermittelbare Laenge wird der Hinweis fail-closed verworfen statt geraten', () => {
  const hinweis = beispielHinweis()
  assert.equal(hinweisZuFinding(hinweis, { gefunden: true, index: 0, normalisiert: false, laenge: null }, 'b-eins', hinweis.anker, 1000), null)
  assert.equal(hinweisZuFinding(hinweis, { gefunden: true, index: 0, normalisiert: false }, 'b-eins', hinweis.anker, 1000), null)
})

test('hinweisZuFinding: ungueltige Indizes/Laengen (negativ, null) werden fail-closed verworfen', () => {
  const hinweis = beispielHinweis()
  assert.equal(hinweisZuFinding(hinweis, { gefunden: true, index: -1, normalisiert: false, laenge: 5 }, 'b-eins', 'irgendein Text', 1000), null)
  assert.equal(hinweisZuFinding(hinweis, { gefunden: true, index: 0, normalisiert: false, laenge: 0 }, 'b-eins', 'irgendein Text', 1000), null)
  assert.equal(hinweisZuFinding(hinweis, { gefunden: true, index: 0, normalisiert: false, laenge: -3 }, 'b-eins', 'irgendein Text', 1000), null)
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
  const hinweisGrundursache = beispielHinweis({ istGrundursache: true })
  const hinweisFolge = beispielHinweis({ kategorie: 'struktur', anker: 'anderer Anker im Text', integritaet: false })
  const grundursache = hinweisZuFinding(hinweisGrundursache, ankerErgebnisFuer(hinweisGrundursache.anker), 'b-eins', hinweisGrundursache.anker, 1000)
  const folgehinweis = hinweisZuFinding(hinweisFolge, ankerErgebnisFuer(hinweisFolge.anker), 'b-zwei', hinweisFolge.anker, 1001)
  folgehinweis.rootCauseId = grundursache.id
  assert.equal(grundursache.priority, 'high')
  assert.equal(grundursache.istGrundursache, true)
  const doc = ensureReasoningModel({ findings: [folgehinweis, grundursache], decisions: [] })
  const queue = getFindingQueue(doc)
  assert.equal(queue.current.id, grundursache.id)
  assert.deepEqual(queue.parked.map(finding => finding.id), [folgehinweis.id])
})

test('fasseEntscheidungenZusammen und fasseOffeneHinweiseZusammen trennen entschieden und offen', () => {
  const hinweisEntschieden = beispielHinweis({ kategorie: 'quelle' })
  const hinweisOffen = beispielHinweis({ kategorie: 'struktur', anker: 'offener Anker', integritaet: false })
  const entschieden = hinweisZuFinding(hinweisEntschieden, ankerErgebnisFuer(hinweisEntschieden.anker), 'b-eins', hinweisEntschieden.anker, 1000)
  const offen = hinweisZuFinding(hinweisOffen, ankerErgebnisFuer(hinweisOffen.anker), 'b-zwei', hinweisOffen.anker, 1001)
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
  const hinweisEntschiedenerQuellen = beispielHinweis({ kategorie: 'quelle' })
  const entschiedenerQuellen = hinweisZuFinding(hinweisEntschiedenerQuellen, ankerErgebnisFuer(hinweisEntschiedenerQuellen.anker), 'b-eins', hinweisEntschiedenerQuellen.anker, 1000)
  const doc1 = ensureReasoningModel({ findings: [entschiedenerQuellen], decisions: [] })
  decideFinding(doc1, entschiedenerQuellen.id, { kind: 'reject', reason: 'Quelle folgt später.' }, 2000)

  // Frischer Hinweis mit gleichem Anker + Kategorie → sollte gefiltert werden
  const frischerQuellen = beispielHinweis({ kategorie: 'quelle' })
  const dedupiert1 = dedupeHinweise([frischerQuellen], doc1.findings, doc1.decisions)
  assert.equal(dedupiert1.length, 0, 'Wiederholung quelle sollte gefiltert werden')

  // Szenario 2: Nicht-Integritäts-Kategorie (wirkung) — bereits entschieden, darf nicht wieder vorgeschlagen werden
  const hinweisEntschiedenerWirkung = beispielHinweis({ kategorie: 'wirkung', anker: 'Anderer Anker', integritaet: false })
  const entschiedenerWirkung = hinweisZuFinding(hinweisEntschiedenerWirkung, ankerErgebnisFuer(hinweisEntschiedenerWirkung.anker), 'b-zwei', hinweisEntschiedenerWirkung.anker, 1000)
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
