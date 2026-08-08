import test from 'node:test'
import assert from 'node:assert/strict'
import {
  markenBereich,
  markenBereiche,
  markiertAlleVorkommen,
} from '../src/annotation-marken.mjs'

// ---- Das Design System markiert die STELLE, nicht den Absatz ----------------
//
// Vorlage: components/annotation/annotation.card.html. Dort steht die Marke
// jeweils um genau die Woerter, um die es geht — nicht um den ganzen Absatz.
// Ohne diese Rechnung waere "1:1 uebernommen" nicht wahr: die App markierte
// bis hierher immer den kompletten Block.

const ABSATZ = 'Trotzdem behandeln wir sie wie einen Vorrat, aus dem man beliebig '
  + 'schöpfen kann — ein teurer Zeit vertreib.'

test('die Marke sitzt genau auf der genannten Stelle', () => {
  const bereich = markenBereich(ABSATZ, { anmerkungsart: 'rechtschreibung', target: 'Zeit vertreib' })
  assert.equal(ABSATZ.slice(bereich.von, bereich.bis), 'Zeit vertreib')
  assert.equal(bereich.kategorie, 'korrektur')
})

test('die Kategorie kommt aus dem Anmerkungsvertrag, nicht aus der Anmerkung', () => {
  // Vier Kategorien, vier Prinzipien (Mark.jsx): Rahmen, Flaeche, angehobener
  // Block, Akzentflaeche. Welche gilt, entscheidet die Art — nicht der Aufrufer.
  const faelle = [
    ['grammatik', 'korrektur'],
    ['satzstil', 'stil'],
    ['verschieben', 'struktur'],
    ['beleg', 'inhalt'],
    ['nachfrage', 'notiz'],
  ]
  faelle.forEach(([art, erwartet]) => {
    const bereich = markenBereich('Ein Satz mit Ziel darin.', { anmerkungsart: art, target: 'Ziel' })
    assert.equal(bereich.kategorie, erwartet, `${art} gehoert zu ${erwartet}`)
  })
})

test('eine Stelle, die nicht mehr im Text steht, wird NICHT markiert', () => {
  // Lieber gar keine Marke als eine an der falschen Stelle. Der Text ist das
  // Produkt — eine Marke, die irgendwo klebt, ist schlimmer als keine.
  assert.equal(markenBereich(ABSATZ, { anmerkungsart: 'wortwahl', target: 'kommt hier nicht vor' }), null)
  assert.equal(markenBereich(ABSATZ, { anmerkungsart: 'wortwahl', target: '' }), null)
  assert.equal(markenBereich(ABSATZ, { anmerkungsart: 'wortwahl', target: '   ' }), null)
  assert.equal(markenBereich('', { anmerkungsart: 'wortwahl', target: 'egal' }), null)
})

test('typografische Anfuehrungszeichen und Zeilenumbrueche treffen trotzdem', () => {
  // findeAnker normalisiert; das Modell schreibt oft gerade Anfuehrungszeichen,
  // im Dokument stehen typografische.
  const text = 'Sie nannte es „ruhige Technik" und meinte es ernst.'
  const bereich = markenBereich(text, { anmerkungsart: 'wortwahl', target: '"ruhige Technik"' })
  assert.ok(bereich, 'der Anker wurde trotz anderer Anfuehrungszeichen nicht gefunden')
  assert.equal(text.slice(bereich.von, bereich.bis), '„ruhige Technik"')
})

// ---- Sammelnde Arten markieren jedes Vorkommen und nummerieren -------------

const WIEDERHOLUNG = 'Die Aufmerksamkeit zerfällt in Bruchstücke, und mit der Aufmerksamkeit '
  + 'die Qualität. Wer seine Aufmerksamkeit schützt, schützt seine Arbeit.'

test('Wiederholung markiert jedes Vorkommen und zaehlt sie durch', () => {
  const bereiche = markenBereiche(WIEDERHOLUNG, { anmerkungsart: 'wiederholung', target: 'Aufmerksamkeit' })
  assert.equal(bereiche.length, 3)
  assert.deepEqual(bereiche.map(b => b.nummer), [1, 2, 3])
  bereiche.forEach(b => assert.equal(WIEDERHOLUNG.slice(b.von, b.bis), 'Aufmerksamkeit'))
  // aufsteigend sortiert — die Nummern muessen der Lesereihenfolge folgen
  assert.deepEqual(bereiche.map(b => b.von), [...bereiche.map(b => b.von)].sort((a, c) => a - c))
})

test('Terminologie markiert mehrere verschiedene Begriffe', () => {
  const text = 'Im Text stehen Nutzer, Anwender und User nebeneinander.'
  const bereiche = markenBereiche(text, {
    anmerkungsart: 'terminologie',
    targets: [{ text: 'Nutzer' }, { text: 'Anwender' }, { text: 'User' }],
  })
  assert.equal(bereiche.length, 3)
  assert.deepEqual(bereiche.map(b => text.slice(b.von, b.bis)), ['Nutzer', 'Anwender', 'User'])
  assert.deepEqual(bereiche.map(b => b.nummer), [1, 2, 3])
})

test('eine einzelne Stelle bekommt KEINE Nummer', () => {
  // Eine "1" an einer einzelnen Marke ist Rauschen: sie zaehlt nichts.
  const bereiche = markenBereiche('Ein Satz mit Ziel darin.', { anmerkungsart: 'wortwahl', target: 'Ziel' })
  assert.equal(bereiche.length, 1)
  assert.equal(bereiche[0].nummer, null)
})

test('ueberlappende Treffer werden nicht doppelt markiert', () => {
  // "aa" in "aaa" trifft zweimal, aber die zweite Marke laege in der ersten.
  const bereiche = markenBereiche('aaa', { anmerkungsart: 'wiederholung', target: 'aa' })
  assert.equal(bereiche.length, 1)
})

test('nur sammelnde Arten markieren alle Vorkommen', () => {
  // Eine Wortwahl-Korrektur an fuenf Stellen gleichzeitig waere fuenf offene
  // Vorschlaege, von denen keiner der gemeinte ist.
  assert.equal(markiertAlleVorkommen({ anmerkungsart: 'wiederholung' }), true)
  assert.equal(markiertAlleVorkommen({ anmerkungsart: 'terminologie' }), true)
  assert.equal(markiertAlleVorkommen({ anmerkungsart: 'wortwahl' }), false)
  assert.equal(markiertAlleVorkommen({ anmerkungsart: 'rechtschreibung' }), false)
  assert.equal(markiertAlleVorkommen({ anmerkungsart: 'beleg' }), false)
})
