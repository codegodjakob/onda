import test from 'node:test'
import assert from 'node:assert/strict'
import { pruefeHinweislaufGate, verarbeiteHinweisantwort, versucheHinweislauf } from '../src/hinweislauf-model.mjs'
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

// ---- versucheHinweislauf (Fix-Runde 1) --------------------------------------
// versucheHinweislauf ist der vollstaendige, testbare Ablauf EINES Versuchs: Gate ->
// Sperre synchron VOR jedem await -> hatSchluessel() -> Konsistenzpruefung NACH dem await
// -> Kontext -> runTask -> Antwort verarbeiten. Alle IO-Abhaengigkeiten sind Parameter.

function basisVersuch(extra = {}) {
  return {
    hatDokument: true,
    istBeispielprojekt: false,
    laeuftBereits: false,
    docText: 'Neuer Text',
    signatur: 'neu',
    letzteSignatur: 'alt',
    sperreSetzen: () => {},
    hatSchluessel: async () => true,
    istNochDasselbeDokument: () => true,
    verstaendnis: null,
    blocks: [],
    findings: [],
    decisions: [],
    runTask: async () => ({ daten: { hinweise: [] } }),
    setzeAgentStatus: () => {},
    ...extra,
  }
}

test('Fix-Runde 1, Finding 1 (Critical): Sperre wird synchron VOR dem ersten await gesetzt', async () => {
  const reihenfolge = []
  let sperreGesetztVorAwait = false
  const versprechen = versucheHinweislauf(basisVersuch({
    sperreSetzen: wert => { reihenfolge.push(['sperre', wert]); sperreGesetztVorAwait = wert === true },
    hatSchluessel: async () => { reihenfolge.push(['schluessel-check']); return true },
  }))
  // Direkt nach dem Aufruf (noch VOR dem ersten await-Tick) muss die Sperre bereits stehen --
  // das ist exakt die Eigenschaft, die einen doppelten teuren Lauf verhindert.
  assert.equal(sperreGesetztVorAwait, true, 'sperreSetzen(true) muss synchron laufen, bevor irgendein await beginnt')
  await versprechen
  assert.deepEqual(reihenfolge[0], ['sperre', true], 'Sperre muss vor dem Schluessel-Check gesetzt sein')
})

test('Fix-Runde 1, Finding 1 (Critical): zwei kollidierende Ausloeser -> runTask laeuft nur einmal, der zweite wird als lauf-aktiv geblockt', async () => {
  let sperre = false
  let runTaskAufrufe = 0
  let schluesselFreigeben
  const schluesselWartet = new Promise(resolve => { schluesselFreigeben = resolve })
  const hatSchluessel = () => schluesselWartet.then(() => true) // haengt wie ein echter Keychain-/Bridge-Aufruf

  const eingabe = () => basisVersuch({
    laeuftBereits: sperre, // wird bei jedem Aufruf FRISCH gelesen -- wie hinweislaufAktiv in workspace.js
    sperreSetzen: wert => { sperre = wert },
    hatSchluessel,
    runTask: async () => { runTaskAufrufe += 1; return { daten: { hinweise: [] } } },
  })

  // Zwei Ausloeser kurz hintereinander (z.B. Schreibpause + Chat-Bitte, die H-3 anschliesst):
  // der erste laeuft synchron bis zu seinem eigenen await und setzt dabei die Sperre bereits.
  const ersterVersuch = versucheHinweislauf(eingabe())
  const zweiterVersuch = versucheHinweislauf(eingabe())
  schluesselFreigeben()
  const [ergebnis1, ergebnis2] = await Promise.all([ersterVersuch, zweiterVersuch])

  assert.equal(runTaskAufrufe, 1, 'runTask darf bei Kollision nur einmal aufgerufen werden -- sonst doppelte Kosten')
  const erfolgreiche = [ergebnis1, ergebnis2].filter(e => e.gestartet && e.erfolg)
  const geblockte = [ergebnis1, ergebnis2].filter(e => e.grund === 'lauf-aktiv')
  assert.equal(erfolgreiche.length, 1, 'genau ein Versuch darf durchlaufen')
  assert.equal(geblockte.length, 1, 'der andere muss als lauf-aktiv geblockt werden')
})

test('Fix-Runde 1, Finding 1: Sperre wird in JEDEM Pfad zurueckgesetzt (Erfolg, Fehler, kein Schluessel)', async () => {
  const sperrenVerlauf = []
  const sperreSetzen = wert => sperrenVerlauf.push(wert)

  await versucheHinweislauf(basisVersuch({ sperreSetzen, hatSchluessel: async () => true }))
  await versucheHinweislauf(basisVersuch({ sperreSetzen, hatSchluessel: async () => false }))
  await versucheHinweislauf(basisVersuch({
    sperreSetzen, hatSchluessel: async () => true, runTask: async () => { throw { typ: 'ueberlastet' } },
  }))

  assert.deepEqual(sperrenVerlauf, [true, false, true, false, true, false], 'jeder Lauf muss die Sperre setzen und wieder loesen')
})

test('Fix-Runde 1, Finding 1: bei blockiertem Gate wird die Sperre gar nicht erst angefasst', async () => {
  let sperreAufrufe = 0
  const ergebnis = await versucheHinweislauf(basisVersuch({
    laeuftBereits: true,
    sperreSetzen: () => { sperreAufrufe += 1 },
  }))
  assert.deepEqual(ergebnis, { gestartet: false, grund: 'lauf-aktiv' })
  assert.equal(sperreAufrufe, 0, 'ein bereits blockierter Lauf darf die Sperre nicht anfassen')
})

test('Fix-Runde 1, Finding 2 (Important): Dokumentwechsel waehrend hatSchluessel() -> Abbruch, runTask wird NICHT aufgerufen', async () => {
  let runTaskAufrufe = 0
  const ergebnis = await versucheHinweislauf(basisVersuch({
    verstaendnis: { task: 'Projekt A' },
    docText: 'Text aus Dokument A',
    istNochDasselbeDokument: () => false, // simuliert: waehrend hatSchluessel() wurde Dokument/Projekt gewechselt
    runTask: async () => { runTaskAufrufe += 1; return { daten: { hinweise: [] } } },
  }))
  assert.deepEqual(ergebnis, { gestartet: false, grund: 'dokument-gewechselt' })
  assert.equal(runTaskAufrufe, 0, 'nach einem erkannten Dokumentwechsel darf niemals runTask aufgerufen werden')
})

test('Fix-Runde 1, Finding 2: ohne Drift erreichen docText UND verstaendnis DESSELBEN Aufrufs den Request an runTask', async () => {
  let empfangenerKontext = null
  await versucheHinweislauf(basisVersuch({
    docText: 'MARKANTER-DOKTEXT-projekt-a',
    verstaendnis: { task: 'MARKANTES-VERSTAENDNIS-projekt-a' },
    istNochDasselbeDokument: () => true,
    runTask: async (taskName, kontext) => { empfangenerKontext = kontext; return { daten: { hinweise: [] } } },
  }))
  assert.ok(empfangenerKontext, 'runTask haette aufgerufen werden muessen')
  assert.equal(empfangenerKontext.docText, 'MARKANTER-DOKTEXT-projekt-a')
  assert.deepEqual(empfangenerKontext.verstaendnis, { task: 'MARKANTES-VERSTAENDNIS-projekt-a' })
})

test('versucheHinweislauf: Gate-Ablehnung (z.B. beispielprojekt) ruft weder hatSchluessel noch runTask auf', async () => {
  let schluesselAufrufe = 0
  let runTaskAufrufe = 0
  const ergebnis = await versucheHinweislauf(basisVersuch({
    istBeispielprojekt: true,
    hatSchluessel: async () => { schluesselAufrufe += 1; return true },
    runTask: async () => { runTaskAufrufe += 1; return { daten: { hinweise: [] } } },
  }))
  assert.deepEqual(ergebnis, { gestartet: false, grund: 'beispielprojekt' })
  assert.equal(schluesselAufrufe, 0)
  assert.equal(runTaskAufrufe, 0)
})

test('versucheHinweislauf: kein Schluessel -> gestartet:false, Sperre trotzdem sauber geloest', async () => {
  const sperrenVerlauf = []
  const ergebnis = await versucheHinweislauf(basisVersuch({
    sperreSetzen: wert => sperrenVerlauf.push(wert),
    hatSchluessel: async () => false,
  }))
  assert.deepEqual(ergebnis, { gestartet: false, grund: 'kein-schluessel' })
  assert.deepEqual(sperrenVerlauf, [true, false])
})

test('versucheHinweislauf: Erfolg liefert uebernommene Findings, Verwurf-Zaehler und Grundursache durch', async () => {
  const blocks = [{ id: 'b1', text: 'jede Unterbrechung schadet dem Denken.' }]
  const docText = baueDocText(blocks)
  const hinweis = {
    kategorie: 'logik', anker: 'jede Unterbrechung schadet dem Denken', beobachtung: 'zu absolut',
    relevanz: 'angreifbar', folge: 'Gegenbeispiel genuegt', vorschlag: null, istGrundursache: true, integritaet: true,
  }
  const ergebnis = await versucheHinweislauf(basisVersuch({
    docText,
    blocks,
    runTask: async () => ({ daten: { hinweise: [hinweis] } }),
  }))
  assert.equal(ergebnis.gestartet, true)
  assert.equal(ergebnis.erfolg, true)
  assert.equal(ergebnis.uebernommen.length, 1)
  assert.equal(ergebnis.uebernommen[0].istGrundursache, true)
  assert.equal(ergebnis.grundursache.id, ergebnis.uebernommen[0].id)
  assert.equal(ergebnis.verworfen, 0)
})

test('versucheHinweislauf: Fehler bei runTask -> gestartet:true, erfolg:false, Fehlertyp durchgereicht', async () => {
  const ergebnis = await versucheHinweislauf(basisVersuch({
    runTask: async () => { throw { typ: 'ratenlimit' } },
  }))
  assert.deepEqual(ergebnis, { gestartet: true, erfolg: false, fehler: 'ratenlimit' })
})

test('versucheHinweislauf: setzeAgentStatus durchlaeuft laeuft -> bereit bei Erfolg, laeuft -> fehler bei Fehlschlag', async () => {
  const stati = []
  await versucheHinweislauf(basisVersuch({ setzeAgentStatus: s => stati.push(s.zustand) }))
  assert.deepEqual(stati, ['laeuft', 'bereit'])

  stati.length = 0
  await versucheHinweislauf(basisVersuch({
    setzeAgentStatus: s => stati.push(s.zustand),
    runTask: async () => { throw { typ: 'schema' } },
  }))
  assert.deepEqual(stati, ['laeuft', 'fehler'])
})
