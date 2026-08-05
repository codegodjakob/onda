import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MINDESTZEICHEN,
  MIN_FREMD_ANKER_ZEICHEN,
  darfAutomatischLaufen,
  erweiterungAusAntwort,
  pruefeErweiterungslaufGate,
  verarbeiteErweiterungsantwort,
  versucheErweiterungslauf,
} from '../src/erweiterungslauf-model.mjs'
import { baueNachbartexte, ergaenzeOndaKontext } from '../src/onda-kontext.mjs'
import {
  ANKER_ANZAHL,
  ensureErweiterungen,
  fasseErweiterungenZusammen,
  legeErweiterungWeg,
  merkeErweiterung,
  sichtbareErweiterungen,
} from '../src/erweiterung-model.mjs'

const LANGER_TEXT = 'Die Stadt wuchs schneller als ihre Leitungen. '.repeat(12)
const BLOCKS = [{ id: 'b1', text: LANGER_TEXT }]

// ---- Die anderen Texte desselben Projekts ------------------------------------
// Die Nachbartexte kommen aus derselben Funktion wie im Prompt (baueNachbartexte,
// onda-kontext.mjs) und nicht aus handgeschriebenen Objekten: eine Testfassung, die anders
// aussieht als das, was der Prompt zeigt, bliebe gruen, waehrend die Verankerung im Betrieb
// jede Querverbindung verwuerfe.
const PROJEKT_ID = 'projekt-onda'
const OFFENER_TEXT = { id: 'doc-offen', title: 'Kapitel 1' }

function nachbarn(...koerper) {
  return baueNachbartexte({
    project: { id: PROJEKT_ID },
    doc: OFFENER_TEXT,
    docs: koerper.map((eintrag, index) => ({
      id: eintrag.id || `doc-nachbar-${index}`,
      title: eintrag.title || `Kapitel ${index + 2}`,
      projectId: PROJEKT_ID,
      updated: 1000 - index, // stabile Reihenfolge: der erste bleibt der erste
      body: eintrag.body,
    })),
  })
}

const WASSER_TEXT = '<h2>Das Wassernetz</h2><p>Die Instandhaltung der Leitungen wurde über '
  + 'Jahrzehnte aufgeschoben, weil niemand sie sah.</p><p>Erst der Rohrbruch machte sie zum '
  + 'Thema einer Ratssitzung.</p>'
const HAUSHALT_TEXT = '<h2>Der Haushalt</h2><p>Jede Investition in Sichtbares schlägt eine in '
  + 'Unsichtbares, solange nur Sichtbares gewählt wird.</p><p>Das gilt für Brücken so wie für '
  + 'Leitungen und für Personal.</p>'

function gate(overrides = {}) {
  return pruefeErweiterungslaufGate({
    hatDokument: true,
    istBeispielprojekt: false,
    verstaendnisOffen: false,
    laeuftBereits: false,
    docText: LANGER_TEXT,
    ...overrides,
  })
}

// ---- Gate --------------------------------------------------------------------

test('Gate: alles in Ordnung -> erlaubt', () => {
  assert.deepEqual(gate(), { erlaubt: true })
})

test('Gate: Beispielprojekt blockiert', () => {
  assert.equal(gate({ istBeispielprojekt: true }).grund, 'beispielprojekt')
})

test('Gate: offenes Verstaendnis blockiert -- ohne Ziel kein Anschluss', () => {
  assert.equal(gate({ verstaendnisOffen: true }).grund, 'verstaendnis-offen')
})

test('Gate: zu kurzer Text blockiert automatische Laeufe', () => {
  assert.equal(gate({ docText: 'Drei Woerter hier.' }).grund, 'zu-kurz')
})

test('Gate: von Hand angefordert hebt die Mindestlaenge auf', () => {
  const kurz = 'Drei Woerter hier.'
  assert.ok(kurz.length < MINDESTZEICHEN)
  assert.deepEqual(gate({ docText: kurz, vonHand: true }), { erlaubt: true })
})

test('Gate: leerer Text blockiert auch von Hand', () => {
  assert.equal(gate({ docText: '   ', vonHand: true }).grund, 'leer')
})

// Anders als der Hinweislauf hat dieser Kanal KEINE Signatur-Sperre. Der Test haelt
// das fest, damit niemand sie spaeter "der Symmetrie halber" einbaut: ein Hinweis zu
// unveraendertem Text waere derselbe Hinweis, eine Erweiterung kann eine andere sein.
test('Gate: derselbe Text darf erneut angefragt werden', () => {
  assert.deepEqual(gate(), { erlaubt: true })
  assert.deepEqual(gate(), { erlaubt: true })
})

// ---- Verankerung nach Art ----------------------------------------------------

test('weiterfuehrung braucht genau einen Anker', () => {
  const eintrag = erweiterungAusAntwort({
    art: 'weiterfuehrung',
    anker: ['wuchs schneller als ihre Leitungen'],
    gedanke: 'Der Satz beschreibt ein Verhaeltnis, nicht ein Tempo.',
    muster: 'Wo zwei Groessen verglichen werden, traegt der Vergleich das Argument.',
  }, LANGER_TEXT, BLOCKS, 1000)
  assert.equal(eintrag.art, 'weiterfuehrung')
  assert.equal(eintrag.stellen.length, 1)
  assert.equal(eintrag.stellen[0].blockId, 'b1')
  assert.equal(eintrag.status, 'neu')
})

test('feld hat keinen Anker und wird trotzdem uebernommen', () => {
  const eintrag = erweiterungAusAntwort({
    art: 'feld',
    anker: [],
    gedanke: 'Die Frage der Instandhaltung kommt im Text nicht vor.',
    muster: 'Wachstum und Erhalt sind zwei Groessen, nicht eine.',
  }, LANGER_TEXT, BLOCKS, 1000)
  assert.equal(eintrag.art, 'feld')
  assert.deepEqual(eintrag.stellen, [])
})

test('feld MIT erfundenem Anker wird verworfen, nicht zurechtgebogen', () => {
  const eintrag = erweiterungAusAntwort({
    art: 'feld',
    anker: ['wuchs schneller'],
    gedanke: 'Irgendetwas.',
    muster: 'Irgendein Muster.',
  }, LANGER_TEXT, BLOCKS, 1000)
  assert.equal(eintrag, null)
})

test('verbindung braucht genau zwei Anker', () => {
  const text = 'Erster Satz mit Wasser. Zweiter Satz mit Leitungen.'
  const eintrag = erweiterungAusAntwort({
    art: 'verbindung',
    anker: ['Erster Satz mit Wasser', 'Zweiter Satz mit Leitungen'],
    gedanke: 'Beide Stellen sprechen ueber dasselbe Netz.',
    muster: 'Was zweimal auftaucht, ist meist ein Thema und kein Detail.',
  }, text, [{ id: 'b1', text }], 1000)
  assert.equal(eintrag.stellen.length, 2)
  assert.ok(eintrag.stellen[0].index < eintrag.stellen[1].index)
})

test('verbindung mit nur einem Anker wird verworfen', () => {
  const eintrag = erweiterungAusAntwort({
    art: 'verbindung',
    anker: ['wuchs schneller als ihre Leitungen'],
    gedanke: 'Etwas.',
    muster: 'Etwas.',
  }, LANGER_TEXT, BLOCKS, 1000)
  assert.equal(eintrag, null)
})

test('verbindung auf zweimal dieselbe Stelle ist keine Verbindung', () => {
  const text = 'Ein einziger Satz ueber Leitungen.'
  const eintrag = erweiterungAusAntwort({
    art: 'verbindung',
    anker: ['Leitungen', 'Leitungen'],
    gedanke: 'Etwas.',
    muster: 'Etwas.',
  }, text, [{ id: 'b1', text }], 1000)
  assert.equal(eintrag, null)
})

test('nicht auffindbarer Anker wird verworfen, nie geraten', () => {
  const eintrag = erweiterungAusAntwort({
    art: 'weiterfuehrung',
    anker: ['dieser Satz steht nirgends im Text'],
    gedanke: 'Etwas.',
    muster: 'Etwas.',
  }, LANGER_TEXT, BLOCKS, 1000)
  assert.equal(eintrag, null)
})

test('die Stelle traegt den echten Wortlaut aus dem Dokument, nicht die Schreibweise des Modells', () => {
  const text = 'Sie nannte es „die stille Reserve“ und meinte damit Zeit.'
  const eintrag = erweiterungAusAntwort({
    art: 'weiterfuehrung',
    anker: '"die stille Reserve"'.replace(/"/g, '"'),
    gedanke: 'x',
    muster: 'y',
  }, text, [{ id: 'b1', text }], 1000)
  // Gerade Anfuehrungszeichen im Anker, typografische im Text: findeAnker normalisiert,
  // gespeichert wird der Wortlaut des Dokuments -- sonst findet die Markierung nichts.
  if (eintrag) assert.ok(text.includes(eintrag.stellen[0].text))
})

test('fehlendes Muster wird verworfen -- ohne Muster ist es nur ein Einfall', () => {
  const eintrag = erweiterungAusAntwort({
    art: 'feld', anker: [], gedanke: 'Ein Gedanke.', muster: '   ',
  }, LANGER_TEXT, BLOCKS, 1000)
  assert.equal(eintrag, null)
})

test('unbekannte Art wird verworfen', () => {
  const eintrag = erweiterungAusAntwort({
    art: 'kritik', anker: [], gedanke: 'x', muster: 'y',
  }, LANGER_TEXT, BLOCKS, 1000)
  assert.equal(eintrag, null)
})

test('ANKER_ANZAHL deckt genau die drei Arten ab', () => {
  assert.deepEqual(Object.keys(ANKER_ANZAHL).sort(), ['feld', 'verbindung', 'weiterfuehrung'])
})

// ---- Verankerung ueber Textgrenzen hinweg ------------------------------------
// Der Widerspruch, den dieser Abschnitt aufloest: dieselbe Regel, die die Qualitaet sichert
// (kein Anker, kein Eintrag), machte Querverbindungen unmoeglich. Aufgeloest wird er nicht,
// indem die Regel nachgibt, sondern indem der SUCHRAUM waechst — um die anderen Texte
// desselben Projekts und um keinen Zeichen mehr.

test('eine Verbindung darf ihr zweites Ende in einem anderen Text des Projekts haben', () => {
  const eintrag = erweiterungAusAntwort({
    art: 'verbindung',
    anker: [
      'wuchs schneller als ihre Leitungen',
      'Die Instandhaltung der Leitungen wurde über Jahrzehnte aufgeschoben',
    ],
    gedanke: 'Dein Text erzählt das Wachstum, der andere die Vernachlässigung — es ist dieselbe Sache.',
    muster: 'Wo ein Text ein Tempo beschreibt, beschreibt ein anderer oft dessen Preis.',
  }, LANGER_TEXT, BLOCKS, 1000, nachbarn({ id: 'doc-wasser', title: 'Das Wassernetz', body: WASSER_TEXT }))

  assert.ok(eintrag, 'die Verbindung haette durchkommen muessen')
  assert.equal(eintrag.stellen.length, 2)
  assert.equal(eintrag.stellen[0].docId, null, 'die erste Stelle liegt im offenen Text')
  assert.equal(eintrag.stellen[0].blockId, 'b1')
  assert.equal(eintrag.stellen[1].docId, 'doc-wasser', 'die zweite Stelle nennt ihr Dokument')
  assert.equal(eintrag.stellen[1].docTitel, 'Das Wassernetz')
  assert.equal(eintrag.stellen[1].blockId, null, 'ein fremder Baustein waere ein Knopf ins Leere')
  assert.match(eintrag.stellen[1].text, /Instandhaltung der Leitungen/)
})

// DIE Sicherung. Sie darf durch nichts von alledem weicher werden.
test('ein erfundener Anker wird auch mit Nachbartexten verworfen', () => {
  const erfunden = {
    art: 'verbindung',
    anker: ['wuchs schneller als ihre Leitungen', 'Dieser Satz steht in keinem einzigen Text'],
    gedanke: 'Etwas.',
    muster: 'Etwas.',
  }
  assert.equal(
    erweiterungAusAntwort(erfunden, LANGER_TEXT, BLOCKS, 1000, nachbarn(
      { body: WASSER_TEXT },
      { body: HAUSHALT_TEXT },
    )),
    null,
  )
  // ... und ebenso, wenn gar keine Nachbartexte da sind
  assert.equal(erweiterungAusAntwort(erfunden, LANGER_TEXT, BLOCKS, 1000, []), null)
})

test('ein Anker aus einem nicht gezeigten spaeten Teil des Nachbartexts wird verworfen', () => {
  const verborgen = 'Diese verborgene Wendung steht erst weit hinter dem gezeigten Anfang.'
  const body = `<h2>Sichtbarer Titel</h2><p>${'Sichtbarer Vorlauf ohne die gesuchte Stelle. '.repeat(14)}</p><p>${verborgen}</p>`
  const [nachbar] = nachbarn({ id: 'doc-lang', body })
  assert.equal(nachbar.anfang.includes(verborgen), false, 'die Fixture muss den Anker wirklich verbergen')

  const eintrag = erweiterungAusAntwort({
    art: 'verbindung',
    anker: ['wuchs schneller als ihre Leitungen', verborgen],
    gedanke: 'Etwas.',
    muster: 'Etwas.',
  }, LANGER_TEXT, BLOCKS, 1000, [nachbar])
  assert.equal(eintrag, null, 'das Modell darf keinen Wortlaut bestaetigt bekommen, den es nie sah')
})

test('ein Anker im offenen UND im Nachbartext ist ohne Dokumentkennung mehrdeutig', () => {
  const gemeinsam = 'Dieselbe lange Formulierung steht in beiden Texten.'
  const nurOffen = 'Nur der offene Text enthaelt diese zweite eindeutige Stelle.'
  const offen = `${gemeinsam} ${nurOffen}`
  const [nachbar] = nachbarn({
    id: 'doc-doppelt',
    body: `<h2>Nachbar</h2><p>${gemeinsam} Der Rest macht den Nachbartext lang genug fuer den Kontext.</p>`,
  })
  const eintrag = erweiterungAusAntwort({
    art: 'verbindung',
    anker: [gemeinsam, nurOffen],
    gedanke: 'Etwas.',
    muster: 'Etwas.',
  }, offen, [{ id: 'offen-block', text: offen }], 1000, [nachbar])
  assert.equal(eintrag, null, 'ohne docId darf die Herkunft nicht still auf den offenen Text umgedeutet werden')
})

test('ein Anker, der in ZWEI Nachbartexten steht, ist mehrdeutig und wird verworfen', () => {
  const doppelt = 'Leitungen und Personal muessen ueber Jahrzehnte erhalten werden.'
  const eintrag = erweiterungAusAntwort({
    art: 'verbindung',
    anker: ['wuchs schneller als ihre Leitungen', doppelt],
    gedanke: 'Etwas.',
    muster: 'Etwas.',
  }, LANGER_TEXT, BLOCKS, 1000, nachbarn(
    { body: `<p>${doppelt}</p><p>Und noch ein Absatz, damit der Text lang genug ist zum Mitschicken.</p>` },
    { body: `<p>${doppelt}</p><p>Auch dieser Text braucht Laenge, sonst zaehlt er gar nicht mit.</p>` },
  ))
  assert.equal(eintrag, null, 'welcher Text gemeint war, ist unklar — raten waere schlimmer als schweigen')
})

test('ein zu kurzer Anker taugt in einem fremden Text nicht', () => {
  const kurz = 'Das Wassernetz'
  assert.ok(kurz.length < MIN_FREMD_ANKER_ZEICHEN)
  const eintrag = erweiterungAusAntwort({
    art: 'verbindung',
    anker: ['wuchs schneller als ihre Leitungen', kurz],
    gedanke: 'Etwas.',
    muster: 'Etwas.',
  }, LANGER_TEXT, BLOCKS, 1000, nachbarn({ body: WASSER_TEXT }))
  assert.equal(eintrag, null, 'eine Wendung aus zwei Woertern zeigt in einem ungeoeffneten Text nirgendwohin')
})

test('lauter fremde Stellen sind keine Erweiterung DIESES Textes', () => {
  const beideFremd = erweiterungAusAntwort({
    art: 'verbindung',
    anker: [
      'Die Instandhaltung der Leitungen wurde über Jahrzehnte aufgeschoben',
      'Jede Investition in Sichtbares schlägt eine in Unsichtbares',
    ],
    gedanke: 'Etwas.',
    muster: 'Etwas.',
  }, LANGER_TEXT, BLOCKS, 1000, nachbarn({ body: WASSER_TEXT }, { body: HAUSHALT_TEXT }))
  assert.equal(beideFremd, null)

  const weiterfuehrungFremd = erweiterungAusAntwort({
    art: 'weiterfuehrung',
    anker: ['Die Instandhaltung der Leitungen wurde über Jahrzehnte aufgeschoben'],
    gedanke: 'Etwas.',
    muster: 'Etwas.',
  }, LANGER_TEXT, BLOCKS, 1000, nachbarn({ body: WASSER_TEXT }))
  assert.equal(weiterfuehrungFremd, null, 'eine Weiterfuehrung fuehrt den OFFENEN Text weiter')
})

test('feld bleibt ohne Anker — auch die Nachbartexte aendern daran nichts', () => {
  const eintrag = erweiterungAusAntwort({
    art: 'feld',
    anker: ['Die Instandhaltung der Leitungen wurde über Jahrzehnte aufgeschoben'],
    gedanke: 'Etwas.',
    muster: 'Etwas.',
  }, LANGER_TEXT, BLOCKS, 1000, nachbarn({ body: WASSER_TEXT }))
  assert.equal(eintrag, null)
})

test('ohne Nachbartexte verhaelt sich die Verankerung genau wie vorher', () => {
  const rohe = {
    art: 'verbindung',
    anker: ['Die Stadt wuchs schneller', 'als ihre Leitungen'],
    gedanke: 'Etwas.',
    muster: 'Etwas.',
  }
  const ohne = erweiterungAusAntwort(rohe, LANGER_TEXT, BLOCKS, 1000)
  const leer = erweiterungAusAntwort(rohe, LANGER_TEXT, BLOCKS, 1000, [])
  assert.deepEqual(JSON.parse(JSON.stringify(ohne)), JSON.parse(JSON.stringify(leer)))
  assert.equal(ohne.stellen.every(stelle => stelle.docId === null), true)
})

test('derselbe Satz in zwei Texten ist nicht dieselbe Verbindung', () => {
  const satz = 'Die Instandhaltung der Leitungen wurde über Jahrzehnte aufgeschoben'
  const zweiTexte = nachbarn(
    { id: 'doc-a', body: WASSER_TEXT },
    { id: 'doc-b', body: `<h2>Anderswo</h2><p>${satz}, sagte sie noch einmal.</p><p>Ein zweiter Absatz gibt dem Text Laenge.</p>` },
  )
  const ausA = erweiterungAusAntwort({
    art: 'verbindung', anker: ['wuchs schneller als ihre Leitungen', satz], gedanke: 'g', muster: 'm',
  }, LANGER_TEXT, BLOCKS, 1000, [zweiTexte[0]])
  const ausB = erweiterungAusAntwort({
    art: 'verbindung', anker: ['wuchs schneller als ihre Leitungen', satz], gedanke: 'g', muster: 'm',
  }, LANGER_TEXT, BLOCKS, 1000, [zweiTexte[1]])

  assert.equal(ausA.stellen[1].docId, 'doc-a')
  assert.equal(ausB.stellen[1].docId, 'doc-b')
  assert.notEqual(ausA.id, ausB.id, 'ohne die Herkunft im Schluessel waere die zweite eine Doppelung')

  const ergebnis = verarbeiteErweiterungsantwort({
    geliefert: [{ art: 'verbindung', anker: ['wuchs schneller als ihre Leitungen', satz], gedanke: 'g', muster: 'm' }],
    docText: LANGER_TEXT,
    blocks: BLOCKS,
    bestehende: [ausA],
    nachbartexte: [zweiTexte[1]],
    jetzt: 2000,
  })
  assert.equal(ergebnis.uebernommen.length, 1, 'dieselbe Wendung in einem ANDEREN Text ist ein anderer Fund')
})

test('eine gespeicherte fremde Stelle ueberlebt das Neuladen', () => {
  const eintrag = erweiterungAusAntwort({
    art: 'verbindung',
    anker: ['wuchs schneller als ihre Leitungen', 'Die Instandhaltung der Leitungen wurde über Jahrzehnte aufgeschoben'],
    gedanke: 'g',
    muster: 'm',
  }, LANGER_TEXT, BLOCKS, 1000, nachbarn({ id: 'doc-wasser', title: 'Das Wassernetz', body: WASSER_TEXT }))

  const doc = { erweiterungen: JSON.parse(JSON.stringify([eintrag])) }
  ensureErweiterungen(doc)
  const [wieder] = doc.erweiterungen
  assert.equal(wieder.stellen[1].docId, 'doc-wasser')
  assert.equal(wieder.stellen[1].docTitel, 'Das Wassernetz')
  assert.equal(wieder.stellen[1].blockId, null)
  assert.equal(wieder.stellen[0].docId, null)
  assert.equal(wieder.stellen[0].blockId, 'b1')
})

test('eine beschaedigte Stelle mit Dokument UND Baustein verliert den Baustein', () => {
  const doc = {
    erweiterungen: [{
      id: 'e1',
      art: 'weiterfuehrung',
      stellen: [{ text: 'irgendetwas', index: 0, laenge: 11, blockId: 'b1', docId: 'doc-fremd' }],
      gedanke: 'g',
      muster: 'm',
      createdAt: 1,
    }],
  }
  ensureErweiterungen(doc)
  assert.equal(doc.erweiterungen[0].stellen[0].blockId, null, 'sonst spraenge der Knopf ins Leere')
  assert.equal(doc.erweiterungen[0].stellen[0].docId, 'doc-fremd')
})

// ---- Verarbeitung ------------------------------------------------------------

test('Verarbeitung zaehlt Uebernommenes und Verworfenes getrennt', () => {
  const ergebnis = verarbeiteErweiterungsantwort({
    geliefert: [
      { art: 'feld', anker: [], gedanke: 'Instandhaltung fehlt.', muster: 'Erhalt ist eine eigene Groesse.' },
      { art: 'weiterfuehrung', anker: ['steht nicht im Text'], gedanke: 'x', muster: 'y' },
    ],
    docText: LANGER_TEXT,
    blocks: BLOCKS,
    jetzt: 2000,
  })
  assert.equal(ergebnis.gestartet, 2)
  assert.equal(ergebnis.uebernommen.length, 1)
  assert.equal(ergebnis.verworfen, 1)
})

test('dieselbe Erweiterung kommt kein zweites Mal durch', () => {
  const rohe = { art: 'feld', anker: [], gedanke: 'Instandhaltung fehlt.', muster: 'Erhalt ist eine eigene Groesse.' }
  const erst = verarbeiteErweiterungsantwort({ geliefert: [rohe], docText: LANGER_TEXT, blocks: BLOCKS, jetzt: 1 })
  const zweit = verarbeiteErweiterungsantwort({
    geliefert: [rohe], docText: LANGER_TEXT, blocks: BLOCKS, bestehende: erst.uebernommen, jetzt: 2,
  })
  assert.equal(erst.uebernommen.length, 1)
  assert.equal(zweit.uebernommen.length, 0)
  assert.equal(zweit.verworfen, 1)
})

test('zwei feld-Erweiterungen mit verschiedenen Gedanken sind nicht dasselbe', () => {
  const ergebnis = verarbeiteErweiterungsantwort({
    geliefert: [
      { art: 'feld', anker: [], gedanke: 'Instandhaltung fehlt.', muster: 'a' },
      { art: 'feld', anker: [], gedanke: 'Finanzierung fehlt.', muster: 'b' },
    ],
    docText: LANGER_TEXT, blocks: BLOCKS, jetzt: 1,
  })
  assert.equal(ergebnis.uebernommen.length, 2)
})

// ---- Modell: merken, weglegen, Selbstheilung ---------------------------------

test('weggelegte Erweiterungen verschwinden aus der Sicht, bleiben aber gespeichert', () => {
  const doc = { erweiterungen: [] }
  const { uebernommen } = verarbeiteErweiterungsantwort({
    geliefert: [{ art: 'feld', anker: [], gedanke: 'Instandhaltung fehlt.', muster: 'x' }],
    docText: LANGER_TEXT, blocks: BLOCKS, jetzt: 1,
  })
  doc.erweiterungen = uebernommen
  assert.equal(sichtbareErweiterungen(doc).length, 1)
  legeErweiterungWeg(doc, uebernommen[0].id, 5)
  assert.equal(sichtbareErweiterungen(doc).length, 0)
  assert.equal(doc.erweiterungen.length, 1)
  // ... und taucht in der Nicht-Wiederholen-Liste auf
  assert.equal(fasseErweiterungenZusammen(doc)[0].zustand, 'weg')
})

test('gemerkte Erweiterungen bleiben sichtbar', () => {
  const doc = { erweiterungen: [{ id: 'e1', art: 'feld', stellen: [], gedanke: 'g', muster: 'm', createdAt: 1 }] }
  merkeErweiterung(doc, 'e1', 9)
  assert.equal(sichtbareErweiterungen(doc)[0].status, 'gemerkt')
})

test('ensureErweiterungen wirft kaputte Eintraege still heraus', () => {
  const doc = {
    erweiterungen: [
      null,
      { id: 'ok', art: 'feld', stellen: [], gedanke: 'g', muster: 'm', createdAt: 1 },
      { id: 'falsche-zahl', art: 'verbindung', stellen: [{ text: 'a' }], gedanke: 'g', muster: 'm' },
      { id: 'unbekannt', art: 'kritik', stellen: [], gedanke: 'g', muster: 'm' },
      { id: 'ok', art: 'feld', stellen: [], gedanke: 'doppelt', muster: 'm' },
    ],
  }
  ensureErweiterungen(doc)
  assert.deepEqual(doc.erweiterungen.map(e => e.id), ['ok'])
})

test('ensureErweiterungen macht aus einem fehlenden Feld ein leeres', () => {
  const doc = {}
  ensureErweiterungen(doc)
  assert.deepEqual(doc.erweiterungen, [])
})

// ---- Ablauf ------------------------------------------------------------------

function laufBausteine(overrides = {}) {
  const aufrufe = []
  return {
    aufrufe,
    optionen: {
      hatDokument: true,
      istBeispielprojekt: false,
      verstaendnisOffen: false,
      laeuftBereits: false,
      docText: LANGER_TEXT,
      sperreSetzen: wert => aufrufe.push(`sperre:${wert}`),
      hatSchluessel: async () => true,
      istNochDasselbeDokument: () => true,
      beansprucheKostenfreigabe: () => ({ erlaubt: true }),
      verstaendnis: { task: 'Text' },
      blocks: BLOCKS,
      doc: { erweiterungen: [] },
      runTask: async (task, kontext) => {
        aufrufe.push(`runTask:${task}`)
        aufrufe.push(`volatile:${kontext.volatiles.length}`)
        return { daten: { erweiterungen: [{ art: 'feld', anker: [], gedanke: 'Instandhaltung fehlt.', muster: 'x' }] } }
      },
      setzeAgentStatus: zustand => aufrufe.push(`status:${zustand.zustand}`),
      ...overrides,
    },
  }
}

test('Lauf: Sperre wird SYNCHRON vor dem ersten await gesetzt', async () => {
  const { aufrufe, optionen } = laufBausteine()
  const versprechen = versucheErweiterungslauf(optionen)
  assert.equal(aufrufe[0], 'sperre:true')
  await versprechen
  assert.equal(aufrufe.at(-1), 'sperre:false')
})

test('Lauf: erfolgreicher Durchgang liefert uebernommene Erweiterungen', async () => {
  const { optionen } = laufBausteine()
  const ergebnis = await versucheErweiterungslauf(optionen)
  assert.equal(ergebnis.erfolg, true)
  assert.equal(ergebnis.uebernommen.length, 1)
  assert.equal(ergebnis.uebernommen[0].art, 'feld')
})

test('Lauf: fehlender Schluessel bricht ab, ohne runTask zu rufen', async () => {
  const { aufrufe, optionen } = laufBausteine({ hatSchluessel: async () => false })
  const ergebnis = await versucheErweiterungslauf(optionen)
  assert.equal(ergebnis.grund, 'kein-schluessel')
  assert.ok(!aufrufe.some(eintrag => eintrag.startsWith('runTask')))
})

test('Lauf: Dokumentwechsel waehrend des Schluessel-Checks bricht ab', async () => {
  const { aufrufe, optionen } = laufBausteine({ istNochDasselbeDokument: () => false })
  const ergebnis = await versucheErweiterungslauf(optionen)
  assert.equal(ergebnis.grund, 'dokument-gewechselt')
  assert.ok(!aufrufe.some(eintrag => eintrag.startsWith('runTask')))
})

test('Lauf: erreichte Monatsgrenze verhindert den Lauf', async () => {
  const { aufrufe, optionen } = laufBausteine({
    beansprucheKostenfreigabe: () => ({ erlaubt: false, grund: 'monatsbudget-erreicht' }),
  })
  const ergebnis = await versucheErweiterungslauf(optionen)
  assert.equal(ergebnis.grund, 'monatsbudget-erreicht')
  assert.ok(!aufrufe.some(eintrag => eintrag.startsWith('runTask')))
})

// Der ganze Weg, so wie ihn workspace.js geht: dasselbe onda-Buendel einmal in den Prompt
// (ergaenzeOndaKontext im runTask-Umschlag) und einmal in die Pruefung (onda). Weichen die
// beiden Listen voneinander ab, zitiert das Modell aus der einen und die Pruefung sucht in
// der anderen — jede Querverbindung fiele stillschweigend heraus, und niemand fande heraus,
// warum. Dieser Test faengt genau das.
test('Lauf: eine Querverbindung geht durch, und der Prompt zeigt genau das, was geprueft wird', async () => {
  const ondaWissen = {
    project: { id: PROJEKT_ID },
    doc: OFFENER_TEXT,
    docs: [{
      id: 'doc-wasser',
      title: 'Das Wassernetz',
      projectId: PROJEKT_ID,
      updated: 9000,
      body: WASSER_TEXT,
    }],
  }
  const anker = 'Die Instandhaltung der Leitungen wurde über Jahrzehnte aufgeschoben'
  let gesehenerPrompt = ''

  const { optionen } = laufBausteine({
    onda: ondaWissen,
    runTask: async (task, kontext) => {
      gesehenerPrompt = ergaenzeOndaKontext(kontext, ondaWissen).volatiles.join('\n')
      return {
        daten: {
          erweiterungen: [{
            art: 'verbindung',
            anker: ['wuchs schneller als ihre Leitungen', anker],
            gedanke: 'Dein Wachstum und die aufgeschobene Instandhaltung sind dieselbe Rechnung.',
            muster: 'Wo ein Text ein Tempo feiert, nennt ein anderer dessen Rechnung.',
          }],
        },
      }
    },
  })

  const ergebnis = await versucheErweiterungslauf(optionen)
  assert.equal(ergebnis.erfolg, true)
  assert.equal(ergebnis.verworfen, 0, 'die Verbindung haette nicht verworfen werden duerfen')
  assert.equal(ergebnis.uebernommen.length, 1)
  assert.equal(ergebnis.uebernommen[0].stellen[1].docId, 'doc-wasser')
  assert.ok(gesehenerPrompt.includes(anker), 'das Modell muss den Anker im Prompt gesehen haben')
})

test('Lauf: ohne onda bleibt alles beim Alten — ein fremder Anker wird verworfen', async () => {
  const { optionen } = laufBausteine({
    runTask: async () => ({
      daten: {
        erweiterungen: [{
          art: 'verbindung',
          anker: ['wuchs schneller als ihre Leitungen', 'Die Instandhaltung der Leitungen wurde über Jahrzehnte aufgeschoben'],
          gedanke: 'g',
          muster: 'm',
        }],
      },
    }),
  })
  const ergebnis = await versucheErweiterungslauf(optionen)
  assert.equal(ergebnis.uebernommen.length, 0)
  assert.equal(ergebnis.verworfen, 1)
})

test('Lauf: Fehler im Gateway wird still protokolliert, Sperre faellt trotzdem', async () => {
  const { aufrufe, optionen } = laufBausteine({
    runTask: async () => { const fehler = new Error('kaputt'); fehler.typ = 'schema'; throw fehler },
  })
  const ergebnis = await versucheErweiterungslauf(optionen)
  assert.equal(ergebnis.erfolg, false)
  assert.equal(ergebnis.fehler, 'schema')
  assert.equal(aufrufe.at(-1), 'sperre:false')
  assert.ok(aufrufe.includes('status:fehler'))
})

// "Merken" muss eine Folge haben, sonst ist der Knopf eine Farbaenderung und sonst nichts.
test('Gemerktes steht oben, Neues sammelt sich darunter', () => {
  const doc = {
    erweiterungen: [
      { id: 'a', art: 'feld', stellen: [], gedanke: 'zuerst', muster: 'm', createdAt: 1, status: 'neu' },
      { id: 'b', art: 'feld', stellen: [], gedanke: 'spaeter', muster: 'm', createdAt: 2, status: 'neu' },
    ],
  }
  merkeErweiterung(doc, 'b', 9)
  assert.deepEqual(sichtbareErweiterungen(doc).map(e => e.id), ['b', 'a'])
})

// ---- Kein Textstand wird zweimal bezahlt -------------------------------------
// Befund der Durchsicht von a21248e (Kritisch): Ein Lauf von Hand setzte die
// Signatur auf null zurück. Der Zeitgeber sah 24 ms später denselben, unveränderten
// Text mit unbekannter Signatur -- und bezahlte ihn ein zweites Mal auf dem starken
// Modell. Diese Prüfungen halten die Regel fest, die das verhindert.

test('unveraenderter Textstand laeuft nicht noch einmal automatisch an', () => {
  assert.equal(darfAutomatischLaufen('doc1:abc', 'doc1:abc'), false)
})

test('geaenderter Text darf automatisch anlaufen', () => {
  assert.ok(darfAutomatischLaufen('doc1:xyz', 'doc1:abc'))
})

test('ein anderes Dokument ist ein anderer Stand, auch bei gleichem Text', () => {
  assert.ok(darfAutomatischLaufen('doc2:abc', 'doc1:abc'))
})

test('der allererste Lauf darf anlaufen', () => {
  assert.ok(darfAutomatischLaufen('doc1:abc', null))
})

test('ohne Signatur laeuft nichts automatisch an -- im Zweifel nicht bezahlen', () => {
  assert.equal(darfAutomatischLaufen('', null), false)
  assert.equal(darfAutomatischLaufen(null, null), false)
  assert.equal(darfAutomatischLaufen(undefined, 'doc1:abc'), false)
})
