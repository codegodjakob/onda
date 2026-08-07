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

import {
  bausteinNamen,
  bausteinRollen,
  bestandAusAltenRollen,
  normalisiereBausteinarten,
} from '../src/bausteinlauf-model.mjs'
import { ensureWorkspaceState } from '../src/workspace-model.mjs'

test('Unfug wird zu null, nicht zu einer halben Ablage', () => {
  assert.equal(normalisiereBausteinarten(null), null)
  assert.equal(normalisiereBausteinarten('Befund'), null)
  assert.equal(normalisiereBausteinarten({ arten: [] }), null)
  assert.equal(normalisiereBausteinarten({ arten: [{ name: '   ' }] }), null)
})

test('eine gueltige Ablage bleibt erhalten und bekommt fehlende Felder', () => {
  const bestand = normalisiereBausteinarten({
    textsorte: 'Essay',
    arten: [{ id: 'art-1', name: 'Wendung', funktion: 'transition' }],
    zuordnung: { b1: { artId: 'art-1', zeichen: 42 } },
  })
  assert.equal(bestand.textsorte, 'Essay')
  assert.deepEqual(bestand.arten, [{ id: 'art-1', name: 'Wendung', beschreibung: '', funktion: 'transition' }])
  assert.deepEqual(bestand.zuordnung, { b1: { artId: 'art-1', zeichen: 42 } })
  assert.equal(bestand.laufSignatur, '')
  assert.equal(bestand.standAt, 0)
})

test('eine unbekannte Funktion wird zu null, die Art selbst bleibt', () => {
  const bestand = normalisiereBausteinarten({
    arten: [{ id: 'art-1', name: 'Pointe', funktion: 'zuspitzung' }],
  })
  assert.equal(bestand.arten[0].funktion, null)
  assert.equal(bestand.arten[0].name, 'Pointe')
})

test('eine Zuordnung auf eine unbekannte Art faellt weg', () => {
  const bestand = normalisiereBausteinarten({
    arten: [{ id: 'art-1', name: 'Befund', funktion: null }],
    zuordnung: { b1: { artId: 'art-1', zeichen: 5 }, b2: { artId: 'art-99', zeichen: 5 } },
  })
  assert.deepEqual(Object.keys(bestand.zuordnung), ['b1'])
})

test('doppelte Namen werden zusammengefasst, der erste gewinnt', () => {
  const bestand = normalisiereBausteinarten({
    arten: [
      { id: 'art-1', name: 'Befund', funktion: 'evidence' },
      { id: 'art-2', name: 'befund', funktion: 'claim' },
    ],
    zuordnung: { b1: { artId: 'art-2', zeichen: 5 } },
  })
  assert.equal(bestand.arten.length, 1)
  assert.equal(bestand.arten[0].id, 'art-1')
  assert.equal(bestand.zuordnung.b1.artId, 'art-1')
})

const ALT_JSON = {
  content: [
    { type: 'paragraph', attrs: { blockId: 'b1', semanticRole: 'claim' }, content: [{ type: 'text', text: 'Die tragende Aussage.' }] },
    { type: 'paragraph', attrs: { blockId: 'b2', semanticRole: 'counterpoint' }, content: [{ type: 'text', text: 'Der Einwand.' }] },
    { type: 'paragraph', attrs: { blockId: 'b3', semanticRole: 'paragraph' }, content: [{ type: 'text', text: 'Ein gewoehnlicher Absatz.' }] },
    { type: 'heading', attrs: { blockId: 'h1', level: 2, semanticRole: 'heading' }, content: [{ type: 'text', text: 'Zwischentitel' }] },
  ],
}

test('alte Sechser-Rollen ergeben einen Anfangsbestand mit den alten Woertern', () => {
  const bestand = bestandAusAltenRollen(ALT_JSON, 1234)
  assert.equal(bestand.textsorte, null)
  assert.deepEqual(bestand.arten.map(art => art.name), ['Kernbehauptung', 'Gegenposition'])
  assert.deepEqual(bestand.arten.map(art => art.funktion), ['claim', 'counterpoint'])
  assert.deepEqual(Object.keys(bestand.zuordnung), ['b1', 'b2'])
  assert.equal(bestand.zuordnung.b1.zeichen, 'Die tragende Aussage.'.length)
  assert.equal(bestand.standAt, 1234)
  assert.equal(bestand.laufSignatur, 'b1|b2|b3|h1')
})

test('die Uebernahme liest das ROHE Dokument, nicht die Bloecke', () => {
  // Ab Task 7 traegt ein Block aus collectBlockSnapshots die alte Rolle nicht mehr.
  // Wer diese Funktion mit Bloecken fuettert, bekaeme still null -- und alte Dokumente
  // verloeren ihre Rollen unbemerkt. Diese Pruefung nagelt die Quelle fest.
  const bloeckeStattJson = [{ id: 'b1', type: 'paragraph', role: 'claim', text: 'Die tragende Aussage.' }]
  assert.equal(bestandAusAltenRollen(bloeckeStattJson, 1), null)
  assert.ok(bestandAusAltenRollen(ALT_JSON, 1))
})

test('ohne alte Rollen entsteht kein Anfangsbestand', () => {
  const ohne = { content: [{ type: 'paragraph', attrs: { blockId: 'b1' }, content: [{ type: 'text', text: 'Nur Text.' }] }] }
  assert.equal(bestandAusAltenRollen(ohne, 1), null)
})

test('Nachschlagekarten trennen unsichtbare Funktion von sichtbarem Namen', () => {
  const bestand = normalisiereBausteinarten({
    arten: [
      { id: 'art-1', name: 'Befund', funktion: 'evidence' },
      { id: 'art-2', name: 'Einordnung', funktion: null },
    ],
    zuordnung: { b1: { artId: 'art-1', zeichen: 5 }, b2: { artId: 'art-2', zeichen: 5 } },
  })
  assert.deepEqual([...bausteinRollen(bestand)], [['b1', 'evidence']])
  assert.deepEqual([...bausteinNamen(bestand)], [['b1', 'Befund'], ['b2', 'Einordnung']])
})

test('ensureWorkspaceState raeumt eine kaputte Ablage weg und laesst eine gute stehen', () => {
  const kaputt = { workspace: { bausteinarten: { arten: 'nein' } } }
  ensureWorkspaceState(kaputt)
  assert.equal(kaputt.workspace.bausteinarten, null)

  const gut = {
    workspace: {
      bausteinarten: { arten: [{ id: 'art-1', name: 'Befund', funktion: 'evidence' }], zuordnung: {} },
    },
  }
  ensureWorkspaceState(gut)
  assert.equal(gut.workspace.bausteinarten.arten[0].name, 'Befund')
})

test('eine semanticRole von "constructor" wird nicht als gueltige alte Rolle behandelt', () => {
  const docJson = {
    content: [
      { type: 'paragraph', attrs: { blockId: 'b1', semanticRole: 'constructor' }, content: [{ type: 'text', text: 'Verdaechtiger Text.' }] },
      { type: 'paragraph', attrs: { blockId: 'b2', semanticRole: 'claim' }, content: [{ type: 'text', text: 'Eine echte Behauptung.' }] },
    ],
  }
  const bestand = bestandAusAltenRollen(docJson, 1)
  // b1 bleibt unzugeordnet, nur b2 (mit echtem claim) ergibt eine Art
  assert.equal(bestand.arten.length, 1)
  assert.equal(bestand.arten[0].funktion, 'claim')
  assert.deepEqual(Object.keys(bestand.zuordnung), ['b2'])
})

test('bei doppelten Ids gewinnt der erste Eintrag, der zweite faellt weg', () => {
  const bestand = normalisiereBausteinarten({
    arten: [
      { id: 'art-dup', name: 'Befund', funktion: 'evidence' },
      { id: 'art-dup', name: 'Einordnung', funktion: null },
    ],
    zuordnung: {
      b1: { artId: 'art-dup', zeichen: 5 },
      b2: { artId: 'art-dup', zeichen: 5 },
    },
  })
  // Nur der erste Eintrag bleibt
  assert.equal(bestand.arten.length, 1)
  assert.equal(bestand.arten[0].name, 'Befund')
  assert.equal(bestand.arten[0].funktion, 'evidence')

  // Zuordnungen lösen beide zum ERSTEN Eintrag auf
  assert.equal(bestand.zuordnung.b1.artId, bestand.arten[0].id)
  assert.equal(bestand.zuordnung.b2.artId, bestand.arten[0].id)
  assert.equal(bestand.zuordnung.b1.artId, 'art-dup')
  assert.equal(bestand.zuordnung.b2.artId, 'art-dup')
})
