import test from 'node:test'
import assert from 'node:assert/strict'
import { pruefeHinweislaufGate, verarbeiteHinweisantwort } from '../src/hinweislauf-model.mjs'
import { baueDocText } from '../src/agent-findings.mjs'

// ---- pruefeHinweislaufGate ---------------------------------------------------
// Reihenfolge laut Task-Brief: kein Dokument -> Beispielprojekt -> Lauf schon aktiv ->
// leerer Text -> unveraenderter Text seit dem letzten Lauf. hatSchluessel() bleibt
// bewusst ausserhalb dieser reinen Funktion (async, wird erst danach geprueft).

test('Gate: kein Dokument -> kein-dokument', () => {
  const gate = pruefeHinweislaufGate({
    hatDokument: false, istBeispielprojekt: false, laeuftBereits: false,
    docText: 'Text', signatur: 'a', letzteSignatur: null,
  })
  assert.deepEqual(gate, { erlaubt: false, grund: 'kein-dokument' })
})

test('Gate: Beispielprojekt blockiert immer, auch bei geaendertem Text', () => {
  const gate = pruefeHinweislaufGate({
    hatDokument: true, istBeispielprojekt: true, laeuftBereits: false,
    docText: 'Text', signatur: 'neu', letzteSignatur: 'alt',
  })
  assert.deepEqual(gate, { erlaubt: false, grund: 'beispielprojekt' })
})

test('Gate: bereits laufender Lauf blockiert einen zweiten', () => {
  const gate = pruefeHinweislaufGate({
    hatDokument: true, istBeispielprojekt: false, laeuftBereits: true,
    docText: 'Text', signatur: 'neu', letzteSignatur: 'alt',
  })
  assert.deepEqual(gate, { erlaubt: false, grund: 'lauf-aktiv' })
})

test('Gate: leerer oder reiner Whitespace-Text blockiert', () => {
  const gate = pruefeHinweislaufGate({
    hatDokument: true, istBeispielprojekt: false, laeuftBereits: false,
    docText: '   \n  ', signatur: 'a', letzteSignatur: null,
  })
  assert.deepEqual(gate, { erlaubt: false, grund: 'leer' })
})

test('Gate: unveraenderter Text (gleiche Signatur wie beim letzten Lauf) blockiert', () => {
  const gate = pruefeHinweislaufGate({
    hatDokument: true, istBeispielprojekt: false, laeuftBereits: false,
    docText: 'Text', signatur: 'gleiche-signatur', letzteSignatur: 'gleiche-signatur',
  })
  assert.deepEqual(gate, { erlaubt: false, grund: 'unveraendert' })
})

test('Gate: erlaubt, wenn Text vorhanden, neu gegenueber dem letzten Lauf und kein Lauf aktiv', () => {
  const gate = pruefeHinweislaufGate({
    hatDokument: true, istBeispielprojekt: false, laeuftBereits: false,
    docText: 'Neuer Text', signatur: 'neu', letzteSignatur: 'alt',
  })
  assert.deepEqual(gate, { erlaubt: true })
})

test('Gate: allererste Pruefung (letzteSignatur null, noch nie gelaufen) ist erlaubt', () => {
  const gate = pruefeHinweislaufGate({
    hatDokument: true, istBeispielprojekt: false, laeuftBereits: false,
    docText: 'Text', signatur: 'irgendeine-signatur', letzteSignatur: null,
  })
  assert.deepEqual(gate, { erlaubt: true })
})

// ---- verarbeiteHinweisantwort ------------------------------------------------

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

const BLOCKS = [
  { id: 'b1', text: 'Erster Absatz. jede Unterbrechung schadet dem Denken.' },
  { id: 'b2', text: 'Zweiter Absatz mit anderem Anker drin.' },
]
const DOC_TEXT = baueDocText(BLOCKS)

test('gefundener Anker wird zu Finding, landet in uebernommen, wird dem richtigen Block zugeordnet', () => {
  const ergebnis = verarbeiteHinweisantwort({
    geliefert: [beispielHinweis()], docText: DOC_TEXT, blocks: BLOCKS, findings: [], decisions: [], jetzt: 1000,
  })
  assert.equal(ergebnis.gestartet, 1)
  assert.equal(ergebnis.uebernommen.length, 1)
  assert.equal(ergebnis.verworfen, 0)
  assert.equal(ergebnis.uebernommen[0].blockId, 'b1')
  assert.equal(ergebnis.uebernommen[0].target, 'jede Unterbrechung schadet dem Denken')
})

test('Anker nicht im Dokument gefunden -> still verworfen (Zaehler), kein Finding, nie geraten', () => {
  const ergebnis = verarbeiteHinweisantwort({
    geliefert: [beispielHinweis({ anker: 'kommt im Text so nicht vor' })],
    docText: DOC_TEXT, blocks: BLOCKS, findings: [], decisions: [], jetzt: 1000,
  })
  assert.equal(ergebnis.gestartet, 1)
  assert.equal(ergebnis.uebernommen.length, 0)
  assert.equal(ergebnis.verworfen, 1)
})

test('bereits entschiedener Hinweis (gleicher Anker+Kategorie) wird ueber dedupeHinweise gefiltert', () => {
  const bestehendesFinding = {
    id: 'f1', target: 'jede Unterbrechung schadet dem Denken', category: 'logic', kategorie: 'logik', status: 'dismissed',
  }
  const ergebnis = verarbeiteHinweisantwort({
    geliefert: [beispielHinweis()], docText: DOC_TEXT, blocks: BLOCKS, findings: [bestehendesFinding], decisions: [], jetzt: 1000,
  })
  assert.equal(ergebnis.uebernommen.length, 0)
  assert.equal(ergebnis.verworfen, 1, 'Dedupe-Verwerfung muss auch im Laufprotokoll-Zaehler auftauchen')
})

test('Grundursache parkt ihre Geschwister ueber rootCauseId, sich selbst nicht', () => {
  const ergebnis = verarbeiteHinweisantwort({
    geliefert: [
      beispielHinweis({ istGrundursache: true }),
      beispielHinweis({ kategorie: 'struktur', anker: 'anderem Anker drin', integritaet: false }),
    ],
    docText: DOC_TEXT, blocks: BLOCKS, findings: [], decisions: [], jetzt: 1000,
  })
  assert.equal(ergebnis.uebernommen.length, 2)
  const grundursache = ergebnis.uebernommen.find(finding => finding.istGrundursache)
  const folge = ergebnis.uebernommen.find(finding => !finding.istGrundursache)
  assert.ok(grundursache && folge)
  assert.equal(ergebnis.grundursache.id, grundursache.id)
  assert.equal(folge.rootCauseId, grundursache.id)
  assert.equal(grundursache.rootCauseId, undefined, 'die Grundursache selbst bleibt ungeparkt')
})

test('kein Hinweis traegt istGrundursache -> grundursache ist null, kein rootCauseId gesetzt', () => {
  const ergebnis = verarbeiteHinweisantwort({
    geliefert: [beispielHinweis()], docText: DOC_TEXT, blocks: BLOCKS, findings: [], decisions: [], jetzt: 1000,
  })
  assert.equal(ergebnis.grundursache, null)
  assert.equal(ergebnis.uebernommen[0].rootCauseId, undefined)
})

test('leere oder fehlende geliefert-Liste ergibt ein leeres, sicheres Ergebnis', () => {
  const ohneListe = verarbeiteHinweisantwort({ geliefert: undefined, docText: DOC_TEXT, blocks: BLOCKS, findings: [], decisions: [], jetzt: 1000 })
  assert.deepEqual(ohneListe, { uebernommen: [], verworfen: 0, gestartet: 0, grundursache: null })

  const leereListe = verarbeiteHinweisantwort({ geliefert: [], docText: DOC_TEXT, blocks: BLOCKS, findings: [], decisions: [], jetzt: 1000 })
  assert.deepEqual(leereListe, { uebernommen: [], verworfen: 0, gestartet: 0, grundursache: null })
})

test('mehrere frische, unterschiedliche Hinweise werden alle uebernommen (kein falscher Verwurf)', () => {
  const ergebnis = verarbeiteHinweisantwort({
    geliefert: [
      beispielHinweis({ kategorie: 'quelle', anker: 'jede Unterbrechung schadet dem Denken' }),
      beispielHinweis({ kategorie: 'struktur', anker: 'anderem Anker drin', integritaet: false }),
    ],
    docText: DOC_TEXT, blocks: BLOCKS, findings: [], decisions: [], jetzt: 1000,
  })
  assert.equal(ergebnis.uebernommen.length, 2)
  assert.equal(ergebnis.verworfen, 0)
})
