import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_PUNKTE,
  VARIANTEN,
  bilanzText,
  bilanzVorlesetext,
  istVariante,
  normalisiereVariante,
  punkteFuer,
} from '../src/bilanz-varianten.mjs'

const KEINE = { fehler: 0, empfehlungen: 0, geschmack: 0, total: 0 }
const EINE_EMPFEHLUNG = { fehler: 0, empfehlungen: 1, geschmack: 0, total: 1 }
const GEMISCHT = { fehler: 2, empfehlungen: 1, geschmack: 3, total: 6 }

// ---- Die heutige Fassung bleibt vergleichbar ---------------------------------

test('Bilanz nennt alle drei Arten, auch die mit null', () => {
  assert.equal(bilanzText('bilanz', EINE_EMPFEHLUNG), '0 Fehler · 1 Empfehlung · 0 Geschmack')
})

test('Bilanz sagt auch im Leerzustand etwas', () => {
  assert.equal(bilanzText('bilanz', KEINE), 'Keine offenen Anmerkungen')
})

// ---- Satz: eine Null ist keine Auskunft --------------------------------------

test('Satz nennt nur, was wirklich da ist', () => {
  assert.equal(bilanzText('satz', EINE_EMPFEHLUNG), '1 Empfehlung wartet.')
  assert.equal(bilanzText('satz', GEMISCHT), '2 Fehler, 1 Empfehlung und 3 zu Geschmack warten.')
})

test('Satz schweigt im Leerzustand, statt eine Null zu melden', () => {
  // "Keine offenen Anmerkungen" macht aus dem Fehlen wieder eine Bilanz mit dem
  // Wert null. Die ruhigeren Fassungen sagen an dieser Stelle schlicht nichts.
  assert.equal(bilanzText('satz', KEINE), null)
})

// ---- Punkte: sehen, DASS etwas da ist ----------------------------------------

test('Punkte zeigt je offener Anmerkung einen Punkt und keinen Text', () => {
  assert.equal(bilanzText('punkte', GEMISCHT), null)
  assert.equal(punkteFuer('punkte', GEMISCHT).length, 6)
})

test('Punkte sind gedeckelt — sonst zaehlt man sie und hat wieder eine Tafel', () => {
  const viele = { fehler: 20, empfehlungen: 20, geschmack: 20, total: 60 }
  assert.equal(punkteFuer('punkte', viele).length, MAX_PUNKTE)
})

test('Punkte stehen in fester Rangfolge — Fehler zuerst', () => {
  assert.deepEqual(punkteFuer('punkte', GEMISCHT),
    ['fehler', 'fehler', 'empfehlungen', 'geschmack', 'geschmack', 'geschmack'])
})

test('nur die Punkte-Fassung erzeugt Punkte', () => {
  for (const variante of ['bilanz', 'satz', 'still']) {
    assert.deepEqual(punkteFuer(variante, GEMISCHT), [], variante)
  }
})

// ---- Still: gar keine Auskunft -----------------------------------------------

test('Still zeigt nichts, auch wenn etwas da ist', () => {
  assert.equal(bilanzText('still', GEMISCHT), null)
  assert.deepEqual(punkteFuer('still', GEMISCHT), [])
})

// ---- Was fuer ALLE Fassungen gilt --------------------------------------------

test('Vorlesegeraete bekommen immer den vollen Wortlaut', () => {
  // Die Zurueckhaltung ist eine Frage der Augen, nicht der Zugaenglichkeit —
  // dieselbe Regel wie bei den Struktur-Karten.
  assert.equal(bilanzVorlesetext(GEMISCHT), '2 Fehler · 1 Empfehlung · 3 Geschmack')
  assert.equal(bilanzVorlesetext(KEINE), 'Keine offenen Anmerkungen')
})

test('keine Fassung erfindet eine Zahl, die es nicht gibt', () => {
  for (const variante of VARIANTEN) {
    const text = bilanzText(variante, EINE_EMPFEHLUNG) || ''
    assert.equal(/\b[2-9]\d*\b/.test(text), false, `${variante}: ${text}`)
  }
})

test('unbekannte Fassung faellt auf den heutigen Stand, nicht auf Schweigen', () => {
  // Fail-closed andersherum als sonst: wer sich vertippt, soll die Auskunft nicht
  // verlieren. Eine stille Oberflaeche waere hier der gefaehrlichere Fehler.
  assert.equal(normalisiereVariante('gibtsnicht'), 'bilanz')
  assert.equal(normalisiereVariante(''), 'bilanz')
  assert.equal(normalisiereVariante(undefined), 'bilanz')
  assert.equal(istVariante('still'), true)
  assert.equal(istVariante('tafel'), false)
})
