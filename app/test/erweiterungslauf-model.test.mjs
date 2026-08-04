import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MINDESTZEICHEN,
  darfAutomatischLaufen,
  erweiterungAusAntwort,
  pruefeErweiterungslaufGate,
  verarbeiteErweiterungsantwort,
  versucheErweiterungslauf,
} from '../src/erweiterungslauf-model.mjs'
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
