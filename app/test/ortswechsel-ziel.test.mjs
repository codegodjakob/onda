// Der Ortswechsel hat ZWEI Enden.
//
// Bis zum 8.8.2026 hatte er nur eines. `finding.move` — die Kennung des Zielbausteins —
// wurde ausschliesslich von den Beispieldaten (src/example.js) und von Test-Fixtures
// gesetzt. Aus einem echten Hinweislauf kam es nie: das Antwortschema kannte kein Feld
// dafuer. Die Folge war nicht bloss eine fehlende Marke im Text, sondern eine Anmerkung,
// deren Knopf nichts tut: planAnnotationOperation antwortet ohne Ziel mit
// { ok: false, reason: 'missing-target-block' }.
//
// Hier steht die Kette von einem Ende zum anderen, in der Reihenfolge, in der sie
// arbeitet: Schema -> Aufloesung des Zitats zum Baustein -> Uebernahme oder Verwerfen ->
// Ausfuehrbarkeit. Dass die Marke im Browser auch sichtbar wird, prueft
// onda-ui-smoke.mjs (assertOrtswechselZeigtSeinZiel).

import test from 'node:test'
import assert from 'node:assert/strict'

import { baueDocText, loeseVerschiebungAuf } from '../src/agent-findings.mjs'
import { verarbeiteHinweisantwort } from '../src/hinweislauf-model.mjs'
import { planAnnotationOperation } from '../src/annotation-operations.mjs'

const BLOCKS = [
  { id: 'b1', type: 'paragraph', text: 'Die Methode folgte einem festen Ablauf über drei Wochen.' },
  { id: 'b2', type: 'paragraph', text: 'Wir wollten wissen, ob die Umstellung im Alltag trägt.' },
  { id: 'b3', type: 'paragraph', text: 'Am Ende standen zwölf Gespräche und ein klares Bild.' },
]
const DOC_TEXT = baueDocText(BLOCKS)

function ortswechsel(extra = {}) {
  return {
    kategorie: 'struktur',
    anmerkungsart: 'verschieben',
    anker: 'Die Methode folgte einem festen Ablauf',
    beobachtung: 'Die Methode steht vor der Frage, die sie beantwortet.',
    relevanz: 'Wer den Weg vor dem Ziel liest, weiß nicht, wozu er dient.',
    folge: 'Der Einstieg wirkt technisch statt neugierig.',
    muster: 'Die Frage steht vor dem Weg, der sie beantwortet.',
    vorschlagsart: 'keiner',
    stilmittelId: null,
    vorschlag: null,
    istGrundursache: false,
    integritaet: false,
    gewinn: 'traegt',
    verschiebung: { zielAnker: 'Wir wollten wissen', lage: 'danach' },
    ...extra,
  }
}

test('Das Zitat der Zielstelle wird zur Baustein-Kennung, die das Verschieben braucht', () => {
  const ziel = loeseVerschiebungAuf(
    { zielAnker: 'Wir wollten wissen', lage: 'danach' }, DOC_TEXT, BLOCKS, 'b1',
  )
  assert.equal(ziel.fromBlockId, 'b1')
  assert.equal(ziel.toBlockId, 'b2')
  // 'davor'/'danach' ist die Sprache des Modells, 'before'/'after' die von
  // annotation-operations.mjs. Die Uebersetzung passiert hier und nirgends sonst.
  assert.equal(ziel.position, 'after')
  // Die Aufschrift entsteht aus dem Dokument, nicht aus einem weiteren Modellfeld.
  assert.match(ziel.to, /^Nach: Wir wollten wissen/)
})

test('„davor" wird zu before — sonst landet der Absatz auf der falschen Seite', () => {
  const ziel = loeseVerschiebungAuf(
    { zielAnker: 'Am Ende standen zwölf', lage: 'davor' }, DOC_TEXT, BLOCKS, 'b1',
  )
  assert.equal(ziel.toBlockId, 'b3')
  assert.equal(ziel.position, 'before')
  assert.match(ziel.to, /^Vor: Am Ende standen/)
})

test('Kein auffindbares Ziel heißt kein Ziel — nicht ein geratenes', () => {
  const faelle = [
    ['Zitat steht nicht im Text', { zielAnker: 'Das hat hier nie jemand geschrieben', lage: 'danach' }],
    ['leeres Zitat', { zielAnker: '', lage: 'danach' }],
    ['unbekannte Lage', { zielAnker: 'Wir wollten wissen', lage: 'daneben' }],
    ['Lage fehlt', { zielAnker: 'Wir wollten wissen' }],
    ['ganz ohne Angabe', null],
  ]
  for (const [was, verschiebung] of faelle) {
    assert.equal(loeseVerschiebungAuf(verschiebung, DOC_TEXT, BLOCKS, 'b1'), null, was)
  }
})

test('Ein Ziel im eigenen Absatz ist keine Bewegung', () => {
  // Sonst entstuende ein Hinweis, der den Absatz neben sich selbst schieben will —
  // planMoveBlock lehnt das mit 'same-block' ab, die Autorin saehe einen toten Knopf.
  assert.equal(loeseVerschiebungAuf(
    { zielAnker: 'Die Methode folgte', lage: 'danach' }, DOC_TEXT, BLOCKS, 'b1',
  ), null)
})

test('Der übernommene Hinweis lässt sich tatsächlich ausführen', () => {
  const ergebnis = verarbeiteHinweisantwort({
    geliefert: [ortswechsel()], docText: DOC_TEXT, blocks: BLOCKS, jetzt: 1000,
  })
  assert.equal(ergebnis.uebernommen.length, 1)
  const finding = ergebnis.uebernommen[0]
  assert.equal(finding.move.toBlockId, 'b2')

  // Der eigentliche Beweis: derselbe Weg, den der Knopf „Verschieben" geht.
  const plan = planAnnotationOperation(finding, { blocks: BLOCKS })
  assert.equal(plan.ok, true, plan.reason)
  assert.deepEqual(plan.after.blocks.map(block => block.id), ['b2', 'b1', 'b3'])
})

test('Ein Ortswechsel ohne auflösbares Ziel wird verworfen, nicht halb gezeigt', () => {
  // Fail-closed wie beim Anker selbst. Ein „das gehört woanders hin" ohne Wohin ist
  // keine halbe Anmerkung — es ist eine Aufforderung, die niemand befolgen kann.
  const ergebnis = verarbeiteHinweisantwort({
    geliefert: [ortswechsel({ verschiebung: { zielAnker: 'gibt es hier nicht', lage: 'danach' } })],
    docText: DOC_TEXT,
    blocks: BLOCKS,
    jetzt: 1000,
  })
  assert.equal(ergebnis.uebernommen.length, 0)
  assert.equal(ergebnis.verworfen, 1)
})

test('Nur der Ortswechsel verlangt ein Ziel — die anderen 28 Arten bleiben unberührt', () => {
  // Sonst waere aus einer neuen Anforderung an EINE Art still eine an alle geworden,
  // und jeder Hinweis ohne verschiebung-Feld waere verschwunden.
  const ergebnis = verarbeiteHinweisantwort({
    geliefert: [ortswechsel({ anmerkungsart: 'absatzstil', kategorie: 'sprache', verschiebung: null })],
    docText: DOC_TEXT,
    blocks: BLOCKS,
    jetzt: 1000,
  })
  assert.equal(ergebnis.uebernommen.length, 1)
  assert.equal(ergebnis.uebernommen[0].move, undefined)
})
