import test from 'node:test'
import assert from 'node:assert/strict'
import { UMSCHREIB_GRENZE } from '../src/bausteinarten-vertrag.mjs'
import { pruefeBausteinBedarf, strukturSignatur } from '../src/bausteinlauf-model.mjs'

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

test('eine Id, die via Namensumleitung verbraucht wurde, bleibt fuer spätere Eintraege gesperrt', () => {
  const bestand = normalisiereBausteinarten({
    arten: [
      { id: 'a1', name: 'Befund', funktion: 'evidence' },
      { id: 'x', name: 'Befund', funktion: 'claim' },  // Namensdup: umleitung.set('x', 'a1'), kein art
      { id: 'x', name: 'Anderes', funktion: 'transition' },  // Geblockt: 'x' ist bereits in umleitung
    ],
    zuordnung: {
      b1: { artId: 'x', zeichen: 5 },
    },
  })
  // Nur der erste Eintrag bleibt; der dritte wurde abgelehnt weil seine Id schon verbraucht ist
  assert.equal(bestand.arten.length, 1)
  assert.equal(bestand.arten[0].name, 'Befund')
  assert.equal(bestand.arten[0].id, 'a1')

  // b1 mit artId 'x' loest zur ersten Art auf, nicht zu einer dritten
  assert.equal(bestand.zuordnung.b1.artId, 'a1')
  assert.equal(bestand.zuordnung.b1.artId, bestand.arten[0].id)
})

import { verarbeiteBausteinantwort } from '../src/bausteinlauf-model.mjs'

const DREI = [
  { id: 'b1', type: 'paragraph', role: 'paragraph', text: 'Die tragende Aussage dieses Textes.' },
  { id: 'b2', type: 'paragraph', role: 'paragraph', text: 'Eine Zahl aus der Erhebung.' },
  { id: 'b3', type: 'paragraph', role: 'paragraph', text: 'Was daraus folgt.' },
]

const ANTWORT = {
  textsorte: 'Wissenschaftliche Arbeit',
  arten: [
    { name: 'Kernaussage', beschreibung: 'Die These des Textes.', funktion: 'claim' },
    { name: 'Befund', beschreibung: 'Ein Ergebnis der Erhebung.', funktion: 'evidence' },
    { name: 'Einordnung', beschreibung: 'Ordnet ein Ergebnis ein.', funktion: null },
  ],
  zuordnung: [
    { blockId: 'b1', art: 'Kernaussage' },
    { blockId: 'b2', art: 'Befund' },
    { blockId: 'b3', art: 'Einordnung' },
  ],
}

test('eine saubere Antwort wird vollstaendig uebernommen', () => {
  const { bestand, verworfen } = verarbeiteBausteinantwort({ antwort: ANTWORT, blocks: DREI, jetzt: 7 })
  assert.equal(verworfen, 0)
  assert.equal(bestand.textsorte, 'Wissenschaftliche Arbeit')
  assert.deepEqual(bestand.arten.map(art => art.name), ['Kernaussage', 'Befund', 'Einordnung'])
  assert.equal(bestand.standAt, 7)
  assert.equal(bestand.laufSignatur, 'b1|b2|b3')
  assert.equal(bestand.zuordnung.b2.zeichen, 'Eine Zahl aus der Erhebung.'.length)
  assert.deepEqual([...bausteinRollen(bestand)], [['b1', 'claim'], ['b2', 'evidence']])
  assert.equal(bausteinNamen(bestand).get('b3'), 'Einordnung')
})

test('eine Zuordnung auf einen unbekannten Absatz wird verworfen, nicht geraten', () => {
  const antwort = { ...ANTWORT, zuordnung: [...ANTWORT.zuordnung, { blockId: 'b-gibt-es-nicht', art: 'Befund' }] }
  const { bestand, verworfen } = verarbeiteBausteinantwort({ antwort, blocks: DREI, jetzt: 1 })
  assert.equal(verworfen, 1)
  assert.equal(bestand.zuordnung['b-gibt-es-nicht'], undefined)
})

test('eine Zuordnung auf eine nicht genannte Art wird verworfen', () => {
  const antwort = { ...ANTWORT, zuordnung: [{ blockId: 'b1', art: 'Pointe' }] }
  const { bestand, verworfen } = verarbeiteBausteinantwort({ antwort, blocks: DREI, jetzt: 1 })
  assert.equal(verworfen, 1)
  assert.equal(Object.keys(bestand.zuordnung).length, 0)
})

test('eine Ueberschrift bekommt nie einen Namen, auch wenn das Modell es versucht', () => {
  const blocks = [...DREI, { id: 'h1', type: 'heading', role: 'heading', text: 'Ein Titel' }]
  const antwort = { ...ANTWORT, zuordnung: [...ANTWORT.zuordnung, { blockId: 'h1', art: 'Befund' }] }
  const { bestand, verworfen } = verarbeiteBausteinantwort({ antwort, blocks, jetzt: 1 })
  assert.equal(verworfen, 1)
  assert.equal(bestand.zuordnung.h1, undefined)
})

test('unerwaehnte Absaetze behalten ihren bisherigen Namen', () => {
  const erst = verarbeiteBausteinantwort({ antwort: ANTWORT, blocks: DREI, jetzt: 1 }).bestand
  const nurB3 = {
    textsorte: 'Wissenschaftliche Arbeit',
    arten: ANTWORT.arten,
    zuordnung: [{ blockId: 'b3', art: 'Kernaussage' }],
  }
  const { bestand } = verarbeiteBausteinantwort({ antwort: nurB3, blocks: DREI, bestand: erst, jetzt: 2 })
  assert.equal(bausteinNamen(bestand).get('b1'), 'Kernaussage')
  assert.equal(bausteinNamen(bestand).get('b2'), 'Befund')
  assert.equal(bausteinNamen(bestand).get('b3'), 'Kernaussage')
})

test('ein Absatz, den es nicht mehr gibt, faellt aus dem uebernommenen Bestand', () => {
  const erst = verarbeiteBausteinantwort({ antwort: ANTWORT, blocks: DREI, jetzt: 1 }).bestand
  const ohneB2 = DREI.filter(block => block.id !== 'b2')
  const { bestand } = verarbeiteBausteinantwort({
    antwort: { ...ANTWORT, zuordnung: [] }, blocks: ohneB2, bestand: erst, jetzt: 2,
  })
  assert.equal(bestand.zuordnung.b2, undefined)
  assert.equal(bausteinNamen(bestand).get('b1'), 'Kernaussage')
})

test('eine Antwort ohne verwertbare Arten aendert nichts', () => {
  const erst = verarbeiteBausteinantwort({ antwort: ANTWORT, blocks: DREI, jetzt: 1 }).bestand
  const { bestand, verworfen } = verarbeiteBausteinantwort({
    antwort: { textsorte: '', arten: [], zuordnung: [] }, blocks: DREI, bestand: erst, jetzt: 2,
  })
  assert.equal(bestand, erst)
  assert.equal(verworfen, 0)
})

test('ohne bisherigen Bestand ergibt eine leere Antwort null', () => {
  const { bestand } = verarbeiteBausteinantwort({ antwort: null, blocks: DREI, jetzt: 1 })
  assert.equal(bestand, null)
})

// Diese Pruefung darf sich NICHT durch Zufall der Positionen decken lassen: Runde 2 nennt
// dieselben Arten in anderer Reihenfolge und laesst eine weg, darum verschieben sich die
// erzeugten Ids (art-1/art-2/...) gegenueber Runde 1. Nur die Namensbruecke
// (alteNamen.get(eintrag.artId) -> Name -> nachName.get(Name)) loest das richtig auf; eine
// positionsbasierte Abkuerzung (die alte artId einfach weiterreichen) wuerde JEDEN anderen
// Test in dieser Datei bestehen und hier trotzdem falsch benennen oder ein Waisenkind
// uebernehmen.
test('die Namensbruecke haelt, wenn Runde 2 die Arten umsortiert und eine weglaesst', () => {
  const erst = verarbeiteBausteinantwort({ antwort: ANTWORT, blocks: DREI, jetzt: 1 }).bestand
  const zweiteRunde = {
    textsorte: 'Wissenschaftliche Arbeit',
    arten: [
      { name: 'Einordnung', beschreibung: 'Ordnet ein Ergebnis ein.', funktion: null },
      { name: 'Kernaussage', beschreibung: 'Die These des Textes.', funktion: 'claim' },
    ],
    zuordnung: [],
  }
  const { bestand } = verarbeiteBausteinantwort({ antwort: zweiteRunde, blocks: DREI, bestand: erst, jetzt: 2 })
  const idVon = name => bestand.arten.find(art => art.name === name).id

  // b1 war Kernaussage und bleibt es -- ueber den Namen, nicht ueber die (jetzt andere) Id.
  assert.equal(bausteinNamen(bestand).get('b1'), 'Kernaussage')
  assert.equal(bestand.zuordnung.b1.artId, idVon('Kernaussage'))

  // b3 war Einordnung und bleibt es -- ebenfalls ueber den Namen.
  assert.equal(bausteinNamen(bestand).get('b3'), 'Einordnung')
  assert.equal(bestand.zuordnung.b3.artId, idVon('Einordnung'))

  // b2 war Befund; Runde 2 nennt diese Art nicht mehr -- ein Waisenkind, verworfen.
  assert.equal(bestand.zuordnung.b2, undefined)
})

import { versucheBausteinlauf } from '../src/bausteinlauf-model.mjs'

function laufAufbau(ueberschreibung = {}) {
  let gesperrt = false
  const aufrufe = []
  return {
    aufrufe,
    liestSperre: () => gesperrt,
    optionen: {
      hatDokument: true,
      istBeispielprojekt: false,
      laeuftBereits: false,
      blocks: DREI,
      bestand: null,
      docText: 'Ein Text.',
      verstaendnis: null,
      sperreSetzen: wert => { gesperrt = wert },
      hatSchluessel: async () => true,
      istNochDasselbeDokument: () => true,
      beansprucheKostenfreigabe: () => ({ erlaubt: true }),
      runTask: async (task, kontext) => { aufrufe.push({ task, kontext }); return { daten: ANTWORT } },
      setzeAgentStatus: () => {},
      jetzt: () => 9,
      ...ueberschreibung,
    },
  }
}

test('ein sauberer Lauf liefert einen Bestand und ruft genau einmal an', async () => {
  const aufbau = laufAufbau()
  const ergebnis = await versucheBausteinlauf(aufbau.optionen)
  assert.equal(ergebnis.gestartet, true)
  assert.equal(ergebnis.erfolg, true)
  assert.equal(aufbau.aufrufe.length, 1)
  assert.equal(aufbau.aufrufe[0].task, 'bausteinarten')
  assert.equal(bausteinNamen(ergebnis.bestand).get('b1'), 'Kernaussage')
  assert.equal(aufbau.liestSperre(), false, 'die Sperre wurde nicht wieder gelöst')
})

test('ohne Bedarf laeuft nichts', async () => {
  const erst = verarbeiteBausteinantwort({ antwort: ANTWORT, blocks: DREI, jetzt: 1 }).bestand
  const aufbau = laufAufbau({ bestand: erst })
  const ergebnis = await versucheBausteinlauf(aufbau.optionen)
  assert.deepEqual(ergebnis, { gestartet: false, grund: 'aktuell' })
  assert.equal(aufbau.aufrufe.length, 0)
})

test('das Beispielprojekt loest nie einen Aufruf aus', async () => {
  const aufbau = laufAufbau({ istBeispielprojekt: true })
  const ergebnis = await versucheBausteinlauf(aufbau.optionen)
  assert.equal(ergebnis.grund, 'beispielprojekt')
  assert.equal(aufbau.aufrufe.length, 0)
})

test('die Sperre steht VOR dem ersten await — zwei Ausloeser ergeben einen Aufruf', async () => {
  let gesperrt = false
  const aufrufe = []
  let loeseSchluessel
  const optionen = {
    ...laufAufbau().optionen,
    sperreSetzen: wert => { gesperrt = wert },
    hatSchluessel: () => new Promise(resolve => { loeseSchluessel = () => resolve(true) }),
    runTask: async () => { aufrufe.push(1); return { daten: ANTWORT } },
  }
  const erster = versucheBausteinlauf({ ...optionen, laeuftBereits: false })
  const zweiter = versucheBausteinlauf({ ...optionen, get laeuftBereits() { return gesperrt } })
  loeseSchluessel()
  const [a, b] = await Promise.all([erster, zweiter])
  assert.equal(aufrufe.length, 1)
  assert.equal(a.gestartet !== b.gestartet, true, 'genau einer der beiden darf starten')
})

test('ein Dokumentwechsel waehrend des Schluessel-Checks bricht ab, bevor etwas kostet', async () => {
  const aufbau = laufAufbau({ istNochDasselbeDokument: () => false })
  const ergebnis = await versucheBausteinlauf(aufbau.optionen)
  assert.equal(ergebnis.grund, 'dokument-gewechselt')
  assert.equal(aufbau.aufrufe.length, 0)
})

test('eine verweigerte Kostenfreigabe haelt den Lauf an', async () => {
  const aufbau = laufAufbau({ beansprucheKostenfreigabe: () => ({ erlaubt: false, grund: 'monatsbudget-erreicht' }) })
  const ergebnis = await versucheBausteinlauf(aufbau.optionen)
  assert.equal(ergebnis.grund, 'monatsbudget-erreicht')
  assert.equal(aufbau.aufrufe.length, 0)
})

test('ein Fehler wird gemeldet, nicht verschluckt — und die Sperre faellt', async () => {
  const status = []
  const aufbau = laufAufbau({
    runTask: async () => { const fehler = new Error('kaputt'); fehler.typ = 'schema'; throw fehler },
    setzeAgentStatus: zustand => status.push(zustand),
  })
  const ergebnis = await versucheBausteinlauf(aufbau.optionen)
  assert.equal(ergebnis.erfolg, false)
  assert.equal(ergebnis.fehler, 'schema')
  assert.equal(aufbau.liestSperre(), false)
  assert.equal(status.at(-1).zustand, 'fehler')
})
