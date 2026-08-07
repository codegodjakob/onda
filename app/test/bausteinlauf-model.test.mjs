import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FUNKTIONEN,
  UMSCHREIB_GRENZE,
  pruefeBausteinBedarf,
  strukturSignatur,
} from '../src/bausteinlauf-model.mjs'

function absatz(id, text, type = 'paragraph') {
  return { id, type, role: type === 'heading' ? 'heading' : 'paragraph', text, excerpt: text.slice(0, 160) }
}

test('die Struktur-Signatur haengt an Bestand und Reihenfolge, nicht am Wortlaut', () => {
  const a = [absatz('b1', 'Erster Absatz.'), absatz('b2', 'Zweiter Absatz.')]
  const b = [absatz('b1', 'Erster Absatz, umformuliert.'), absatz('b2', 'Zweiter Absatz.')]
  const c = [absatz('b2', 'Zweiter Absatz.'), absatz('b1', 'Erster Absatz.')]
  const d = [absatz('b1', 'Erster Absatz.'), absatz('b2', 'Zweiter Absatz.'), absatz('b3', 'Neu.')]

  assert.equal(strukturSignatur(a), strukturSignatur(b))
  assert.notEqual(strukturSignatur(a), strukturSignatur(c))
  assert.notEqual(strukturSignatur(a), strukturSignatur(d))
})

test('Absaetze ohne Kennung zaehlen nicht zur Signatur', () => {
  const mit = [absatz('b1', 'Text.'), absatz(null, 'Noch ohne Kennung.')]
  const ohne = [absatz('b1', 'Text.')]
  assert.equal(strukturSignatur(mit), strukturSignatur(ohne))
})

test('ohne Bestand ist ein Lauf noetig und alle Absaetze sind offen', () => {
  const blocks = [absatz('b1', 'Ein Befund.'), absatz('b2', 'Eine Einordnung.')]
  const ergebnis = pruefeBausteinBedarf({ blocks, bestand: null })
  assert.equal(ergebnis.noetig, true)
  assert.equal(ergebnis.grund, 'kein-bestand')
  assert.deepEqual(ergebnis.offene, ['b1', 'b2'])
})

test('ein vollstaendig benannter, unveraenderter Text braucht keinen Lauf', () => {
  const blocks = [absatz('b1', 'Ein Befund.')]
  const bestand = {
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Befund', beschreibung: '', funktion: 'evidence' }],
    zuordnung: { b1: { artId: 'art-1', zeichen: 'Ein Befund.'.length } },
    laufSignatur: strukturSignatur(blocks),
    standAt: 1,
  }
  const ergebnis = pruefeBausteinBedarf({ blocks, bestand })
  assert.equal(ergebnis.noetig, false)
  assert.equal(ergebnis.grund, 'aktuell')
  assert.deepEqual(ergebnis.offene, [])
})

test('ein neuer Absatz macht einen Lauf noetig und ist ALLEIN offen', () => {
  const alt = [absatz('b1', 'Ein Befund.')]
  const bestand = {
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Befund', beschreibung: '', funktion: 'evidence' }],
    zuordnung: { b1: { artId: 'art-1', zeichen: 'Ein Befund.'.length } },
    laufSignatur: strukturSignatur(alt),
    standAt: 1,
  }
  const blocks = [...alt, absatz('b2', 'Ein zweiter Gedanke.')]
  const ergebnis = pruefeBausteinBedarf({ blocks, bestand })
  assert.equal(ergebnis.noetig, true)
  assert.equal(ergebnis.grund, 'ohne-namen')
  // Entscheidend: NICHT ['b1','b2']. Sonst benennt jede Eingabetaste den ganzen Text neu.
  assert.deepEqual(ergebnis.offene, ['b2'])
})

test('ein entfernter Absatz allein loest nichts aus', () => {
  const alt = [absatz('b1', 'Ein Befund.'), absatz('b2', 'Eine Einordnung.')]
  const bestand = {
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Befund', beschreibung: '', funktion: 'evidence' }],
    zuordnung: {
      b1: { artId: 'art-1', zeichen: 'Ein Befund.'.length },
      b2: { artId: 'art-1', zeichen: 'Eine Einordnung.'.length },
    },
    laufSignatur: strukturSignatur(alt),
    standAt: 1,
  }
  const ergebnis = pruefeBausteinBedarf({ blocks: [absatz('b1', 'Ein Befund.')], bestand })
  assert.equal(ergebnis.noetig, false)
  assert.equal(ergebnis.grund, 'aktuell')
})

test('reines Umsortieren macht ALLE Absaetze offen — die Stelle traegt Bedeutung', () => {
  const alt = [absatz('b1', 'Die These.'), absatz('b2', 'Der Beleg.'), absatz('b3', 'Der Schluss.')]
  const bestand = {
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Befund', beschreibung: '', funktion: 'evidence' }],
    zuordnung: {
      b1: { artId: 'art-1', zeichen: 'Die These.'.length },
      b2: { artId: 'art-1', zeichen: 'Der Beleg.'.length },
      b3: { artId: 'art-1', zeichen: 'Der Schluss.'.length },
    },
    laufSignatur: strukturSignatur(alt),
    standAt: 1,
  }
  const blocks = [alt[2], alt[0], alt[1]]
  const ergebnis = pruefeBausteinBedarf({ blocks, bestand })
  assert.equal(ergebnis.noetig, true)
  assert.equal(ergebnis.grund, 'umsortiert')
  assert.deepEqual(ergebnis.offene.sort(), ['b1', 'b2', 'b3'])
})

test('Weiterschreiben in einem benannten Absatz loest nichts aus', () => {
  const text = 'Ein Befund, der schon etwas laenger dasteht und Bestand hat.'
  const bestand = {
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Befund', beschreibung: '', funktion: 'evidence' }],
    zuordnung: { b1: { artId: 'art-1', zeichen: text.length } },
    laufSignatur: strukturSignatur([absatz('b1', text)]),
    standAt: 1,
  }
  const blocks = [absatz('b1', `${text} Und noch ein Halbsatz.`)]
  assert.equal(pruefeBausteinBedarf({ blocks, bestand }).noetig, false)
})

test('mehr als die Haelfte umgeschrieben macht den Absatz wieder offen', () => {
  const text = 'Kurz.'
  const bestand = {
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Befund', beschreibung: '', funktion: 'evidence' }],
    zuordnung: { b1: { artId: 'art-1', zeichen: text.length } },
    laufSignatur: strukturSignatur([absatz('b1', text)]),
    standAt: 1,
  }
  const blocks = [absatz('b1', 'Deutlich laenger geworden, weit mehr als das Doppelte an Zeichen.')]
  const ergebnis = pruefeBausteinBedarf({ blocks, bestand })
  assert.equal(ergebnis.noetig, true)
  assert.equal(ergebnis.grund, 'umgeschrieben')
  assert.deepEqual(ergebnis.offene, ['b1'])
})

test('die Grenze ist von aussen setzbar und wirkt an beiden Raendern', () => {
  const bestand = {
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Befund', beschreibung: '', funktion: 'evidence' }],
    zuordnung: { b1: { artId: 'art-1', zeichen: 100 } },
    laufSignatur: strukturSignatur([absatz('b1', 'x')]),
    standAt: 1,
  }
  const blocks = [absatz('b1', 'y'.repeat(160))]           // +60 %
  assert.equal(pruefeBausteinBedarf({ blocks, bestand, grenze: 0.8 }).noetig, false)
  assert.equal(pruefeBausteinBedarf({ blocks, bestand, grenze: 0.5 }).noetig, true)
  assert.equal(UMSCHREIB_GRENZE, 0.5)
})

test('Ueberschriften und leere Absaetze brauchen nie einen Namen', () => {
  const blocks = [
    absatz('h1', 'Warum es wichtig ist', 'heading'),
    absatz('b1', '   '),
    absatz('b2', 'Ein echter Absatz.'),
  ]
  const ergebnis = pruefeBausteinBedarf({ blocks, bestand: null })
  assert.deepEqual(ergebnis.offene, ['b2'])
})

test('die Funktionsschluessel bleiben genau die, die die Rechenlogik vergleicht', () => {
  assert.deepEqual([...FUNKTIONEN], ['claim', 'evidence', 'counterpoint', 'transition', 'question'])
})
