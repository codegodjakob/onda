import test from 'node:test'
import assert from 'node:assert/strict'
import { pruefeHinweislaufGate, pruefePausenAusloeser, verarbeiteHinweisantwort, versucheHinweislauf } from '../src/hinweislauf-model.mjs'
import { baueDocText } from '../src/agent-findings.mjs'
import {
  bilanziereRueckmeldung,
  entscheideRueckkopplung,
  erstelleRueckkopplungsvorschlag,
} from '../src/rueckkopplung-model.mjs'

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

test('WORK-02: offenes Projektverstaendnis blockiert Hinweise, bis der Entwurf steht', () => {
  const gate = pruefeHinweislaufGate({
    hatDokument: true,
    istBeispielprojekt: false,
    verstaendnisOffen: true,
    laeuftBereits: false,
    docText: 'Vorhandener Text',
    signatur: 'neu',
    letzteSignatur: null,
  })
  assert.deepEqual(gate, { erlaubt: false, grund: 'verstaendnis-offen' })
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

// ---- pruefePausenAusloeser (H-3: Auslöser (a) Schreibpause) ------------------
// Reine Vor-Entscheidung, OB und nach wie viel ms ein Hinweislauf-Versuch fuer die
// Schreibpause geplant werden soll. Die autoritative Gate-Pruefung (Beispielprojekt/
// Schluessel/aktiv/Signatur) bleibt zusaetzlich in pruefeHinweislaufGate/versucheHinweislauf
// zum Zeitpunkt des tatsaechlichen Starts -- diese Funktion vermeidet nur unnoetige
// Zeitgeber. leseSignatur() liest den (teuren) Dokumenttext erst, wenn alle guenstigen
// Vorbedingungen bereits erfuellt sind (kein Editor-Durchlauf waehrend Komposition oder
// laufendem Hinweislauf bei jedem Tastendruck).

function basisAusloeser(extra = {}) {
  return {
    hatDokument: true,
    istBeispielprojekt: false,
    laeuftBereits: false,
    hatEingabeStatus: true,
    lastInputAt: 1000,
    editorSichtbar: true,
    isComposing: false,
    leseSignatur: () => 'neue-signatur',
    letzteSignatur: 'alte-signatur',
    idleMs: 3000,
    jetzt: 1000,
    ...extra,
  }
}

test('Pausen-Ausloeser: kein Dokument -> kein-dokument, Signatur wird nicht gelesen', () => {
  let aufrufe = 0
  const ergebnis = pruefePausenAusloeser(basisAusloeser({
    hatDokument: false,
    leseSignatur: () => { aufrufe += 1; return 'irrelevant' },
  }))
  assert.deepEqual(ergebnis, { planen: false, grund: 'kein-dokument' })
  assert.equal(aufrufe, 0, 'Signatur darf nicht gelesen werden, wenn schon vorher klar ist, dass nichts zu tun ist')
})

test('Pausen-Ausloeser: Beispielprojekt blockiert immer, auch bei gueltiger Eingabe', () => {
  const ergebnis = pruefePausenAusloeser(basisAusloeser({ istBeispielprojekt: true }))
  assert.deepEqual(ergebnis, { planen: false, grund: 'beispielprojekt' })
})

test('Pausen-Ausloeser: bereits laufender Hinweislauf blockiert einen zweiten Plan', () => {
  const ergebnis = pruefePausenAusloeser(basisAusloeser({ laeuftBereits: true }))
  assert.deepEqual(ergebnis, { planen: false, grund: 'lauf-aktiv' })
})

test('Pausen-Ausloeser: kein Eingabe-Status (Dokument noch nie aktiviert) -> keine-eingabe', () => {
  const ergebnis = pruefePausenAusloeser(basisAusloeser({ hatEingabeStatus: false }))
  assert.deepEqual(ergebnis, { planen: false, grund: 'keine-eingabe' })
})

test('Pausen-Ausloeser: lastInputAt nicht endlich (noch keine echte Eingabe) -> keine-eingabe', () => {
  const ergebnis = pruefePausenAusloeser(basisAusloeser({ lastInputAt: Number.NaN }))
  assert.deepEqual(ergebnis, { planen: false, grund: 'keine-eingabe' })
})

test('Pausen-Ausloeser: Editor nicht sichtbar (anderes Dokument/anderer Tab) -> editor-nicht-sichtbar', () => {
  const ergebnis = pruefePausenAusloeser(basisAusloeser({ editorSichtbar: false }))
  assert.deepEqual(ergebnis, { planen: false, grund: 'editor-nicht-sichtbar' })
})

test('Pausen-Ausloeser: IME-Komposition aktiv -> komposition, Signatur wird nicht gelesen', () => {
  let aufrufe = 0
  const ergebnis = pruefePausenAusloeser(basisAusloeser({
    isComposing: true,
    leseSignatur: () => { aufrufe += 1; return 'irrelevant' },
  }))
  assert.deepEqual(ergebnis, { planen: false, grund: 'komposition' })
  assert.equal(aufrufe, 0, 'Signatur darf waehrend Komposition nicht gelesen werden')
})

test('Pausen-Ausloeser: unveraenderter Text (gleiche Signatur wie beim letzten Lauf) -> unveraendert', () => {
  let aufrufe = 0
  const ergebnis = pruefePausenAusloeser(basisAusloeser({
    leseSignatur: () => { aufrufe += 1; return 'gleiche-signatur' },
    letzteSignatur: 'gleiche-signatur',
  }))
  assert.deepEqual(ergebnis, { planen: false, grund: 'unveraendert' })
  assert.equal(aufrufe, 1, 'die Signatur muss fuer den Vergleich genau einmal gelesen werden')
})

test('Pausen-Ausloeser: alle Vorbedingungen erfuellt und Text neu -> planen mit Rest-Idle-Zeit als Verzoegerung', () => {
  let aufrufe = 0
  const ergebnis = pruefePausenAusloeser(basisAusloeser({
    leseSignatur: () => { aufrufe += 1; return 'neue-signatur' },
    letzteSignatur: 'alte-signatur',
    lastInputAt: 1000,
    jetzt: 1000,
    idleMs: 3000,
  }))
  assert.deepEqual(ergebnis, { planen: true, verzoegerungMs: 3000 })
  assert.equal(aufrufe, 1, 'die Signatur darf fuer einen geplanten Lauf nur einmal gelesen werden')
})

test('Pausen-Ausloeser: Idle-Zeit teilweise verstrichen -> Verzoegerung ist die verbleibende Restzeit', () => {
  const ergebnis = pruefePausenAusloeser(basisAusloeser({
    lastInputAt: 1000,
    jetzt: 1800, // 800ms seit der letzten Eingabe vergangen
    idleMs: 3000,
  }))
  assert.deepEqual(ergebnis, { planen: true, verzoegerungMs: 2200 })
})

test('Pausen-Ausloeser: Idle-Zeit bereits ueberschritten -> Verzoegerung faellt nie unter 24ms', () => {
  const ergebnis = pruefePausenAusloeser(basisAusloeser({
    lastInputAt: 1000,
    jetzt: 10000, // laengst ueber der Idle-Schwelle
    idleMs: 3000,
  }))
  assert.deepEqual(ergebnis, { planen: true, verzoegerungMs: 24 })
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

// Fix-Runde 2, Finding 3 (Important): End-zu-Ende-Beleg fuer den Fix ueber verarbeiteHinweisantwort
// (Gate -> findeAnker -> hinweisZuFinding, der echte Produktionspfad). Das Modell zitiert oft mit
// geraden Anfuehrungszeichen, das Dokument traegt aber typografische ("smart quotes"). Vor dem Fix
// landete hier die Modell-Schreibweise als target -- "annehmen"/"eigene Fassung" und die
// Markierung im Editor scheiterten, weil target nicht wortwoertlich im Dokument vorkam.
test('typografische vs. gerade Anfuehrungszeichen: target im uebernommenen Finding ist der echte Dokument-Wortlaut', () => {
  const blocks = [{ id: 'b1', text: 'Sie nannte es „ein stilles Werkzeug“ in ihrem Aufsatz.' }]
  const docText = baueDocText(blocks)
  const hinweis = beispielHinweis({ anker: '"ein stilles Werkzeug"', kategorie: 'wirkung', integritaet: false })
  const ergebnis = verarbeiteHinweisantwort({
    geliefert: [hinweis], docText, blocks, findings: [], decisions: [], jetzt: 1000,
  })
  assert.equal(ergebnis.uebernommen.length, 1)
  assert.equal(ergebnis.verworfen, 0)
  assert.equal(ergebnis.uebernommen[0].target, '„ein stilles Werkzeug“')
  assert.notEqual(ergebnis.uebernommen[0].target, hinweis.anker)
  assert.ok(docText.includes(ergebnis.uebernommen[0].target), 'target muss woertlich im Dokument vorkommen')
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
    verstaendnisOffen: false,
    laeuftBereits: false,
    docText: 'Neuer Text',
    signatur: 'neu',
    letzteSignatur: 'alt',
    sperreSetzen: () => {},
    hatSchluessel: async () => true,
    istNochDasselbeDokument: () => true,
    beansprucheKostenfreigabe: null,
    verstaendnis: null,
    blocks: [],
    findings: [],
    decisions: [],
    runTask: async () => ({ daten: { hinweise: [] } }),
    setzeAgentStatus: () => {},
    ...extra,
  }
}

test('SYSTEM-08: ein blockiertes Automatikbudget verhindert den teuren Hinweislauf', async () => {
  let runTaskAufrufe = 0
  const ergebnis = await versucheHinweislauf(basisVersuch({
    beansprucheKostenfreigabe: () => ({ erlaubt: false, grund: 'monatsbudget-erreicht' }),
    runTask: async () => {
      runTaskAufrufe += 1
      return { daten: { hinweise: [] } }
    },
  }))
  assert.deepEqual(ergebnis, { gestartet: false, grund: 'monatsbudget-erreicht' })
  assert.equal(runTaskAufrufe, 0)
})

test('SYSTEM-08: die Budgetfreigabe wird erst nach Schluessel- und Dokumentpruefung beansprucht', async () => {
  let freigabeAufrufe = 0
  const ohneSchluessel = await versucheHinweislauf(basisVersuch({
    hatSchluessel: async () => false,
    beansprucheKostenfreigabe: () => {
      freigabeAufrufe += 1
      return { erlaubt: true }
    },
  }))
  assert.equal(ohneSchluessel.grund, 'kein-schluessel')
  assert.equal(freigabeAufrufe, 0)

  const gewechselt = await versucheHinweislauf(basisVersuch({
    istNochDasselbeDokument: () => false,
    beansprucheKostenfreigabe: () => {
      freigabeAufrufe += 1
      return { erlaubt: true }
    },
  }))
  assert.equal(gewechselt.grund, 'dokument-gewechselt')
  assert.equal(freigabeAufrufe, 0)
})

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

// ---- Die Textart reicht bis ans Finding durch --------------------------------
// Die Regel (textart-regeln.mjs) war gebaut und getestet, aber niemand uebergab je
// eine Textart -- sie wartete auf ihr Argument. Diese Pruefungen halten die Leitung
// offen: ohne sie waere bei einem Plakattext das Verwerfen einer Quellenfrage
// weiterhin ein "bewusst angenommenes Risiko".

test('die Textart reist bis ans Finding mit', () => {
  const text = 'Die Stadt wuchs schneller als ihre Leitungen.'
  const { uebernommen } = verarbeiteHinweisantwort({
    geliefert: [{
      kategorie: 'quelle', anker: 'wuchs schneller als ihre Leitungen',
      beobachtung: 'ohne Beleg', relevanz: 'zaehlt', folge: 'bleibt unbelegt',
      muster: 'Eine Zahl braucht ihre Herkunft.', vorschlag: null,
      istGrundursache: false, integritaet: true,
    }],
    docText: text,
    blocks: [{ id: 'b1', text }],
    jetzt: 1000,
    textart: 'campaign',
  })
  assert.equal(uebernommen.length, 1)
  assert.equal(uebernommen[0].textart, 'campaign')
})

test('ohne Textart bleibt es beim vorsichtigen Fall', () => {
  const text = 'Die Stadt wuchs schneller als ihre Leitungen.'
  const { uebernommen } = verarbeiteHinweisantwort({
    geliefert: [{
      kategorie: 'quelle', anker: 'wuchs schneller als ihre Leitungen',
      beobachtung: 'ohne Beleg', relevanz: 'zaehlt', folge: 'bleibt unbelegt',
      muster: 'Eine Zahl braucht ihre Herkunft.', vorschlag: null,
      istGrundursache: false, integritaet: true,
    }],
    docText: text,
    blocks: [{ id: 'b1', text }],
    jetzt: 1000,
  })
  assert.equal(uebernommen.length, 1)
  // Fail-closed: eine fehlende Textart nimmt niemandem eine Sicherung.
  assert.ok(uebernommen[0].claim, 'ohne Textart muss die Quellenfrage eine Integritaetsfrage bleiben')
})

test('Stilmittelvorschlag ohne bekannte Textart wird fail-closed verworfen', () => {
  const text = 'Klarer Kurs, kluge Köpfe.'
  const { uebernommen, verworfen } = verarbeiteHinweisantwort({
    geliefert: [beispielHinweis({
      kategorie: 'sprache', anker: 'Klarer Kurs', integritaet: false,
      vorschlagsart: 'stilmittel', stilmittelId: 'alliteration',
      vorschlag: { bisher: 'Klarer Kurs', neu: 'Klarer Kurs, kluge Köpfe' },
    })],
    docText: text,
    blocks: [{ id: 'b1', text }],
    jetzt: 1000,
  })
  assert.equal(uebernommen.length, 0)
  assert.equal(verworfen, 1)
})

test('Stilmittelvorschlag wird in unpassender Textart verworfen und in tragender Textart angenommen', () => {
  const text = 'Klarer Kurs für die Methode.'
  const hinweis = beispielHinweis({
    kategorie: 'sprache', anker: 'Klarer Kurs', integritaet: false,
    vorschlagsart: 'stilmittel', stilmittelId: 'alliteration',
    vorschlag: { bisher: 'Klarer Kurs', neu: 'Klarer Kurs, kluge Köpfe' },
  })
  const wissenschaftlich = verarbeiteHinweisantwort({
    geliefert: [hinweis], docText: text, blocks: [{ id: 'b1', text }], jetzt: 1000,
    textart: 'scientific',
  })
  const kampagne = verarbeiteHinweisantwort({
    geliefert: [hinweis], docText: text, blocks: [{ id: 'b1', text }], jetzt: 1000,
    textart: 'campaign',
  })
  assert.equal(wissenschaftlich.uebernommen.length, 0)
  assert.equal(wissenschaftlich.verworfen, 1)
  assert.equal(kampagne.uebernommen.length, 1)
  assert.equal(kampagne.uebernommen[0].stilmittelId, 'alliteration')
  assert.equal(kampagne.uebernommen[0].vorschlagsart, 'stilmittel')
})

test('unbekanntes Stilmittel wird verworfen, normaler Formulierungsvorschlag bleibt möglich', () => {
  const text = 'Klarer Kurs für die Methode.'
  const unbekannt = verarbeiteHinweisantwort({
    geliefert: [beispielHinweis({
      kategorie: 'sprache', anker: 'Klarer Kurs', integritaet: false,
      vorschlagsart: 'stilmittel', stilmittelId: 'erfundene-figur',
      vorschlag: { bisher: 'Klarer Kurs', neu: 'Klarer Kurs, kluge Köpfe' },
    })],
    docText: text, blocks: [{ id: 'b1', text }], jetzt: 1000, textart: 'campaign',
  })
  const formulierung = verarbeiteHinweisantwort({
    geliefert: [beispielHinweis({
      kategorie: 'sprache', anker: 'Klarer Kurs', integritaet: false,
      vorschlagsart: 'formulierung', stilmittelId: null,
      vorschlag: { bisher: 'Klarer Kurs', neu: 'Ein klarer Kurs' },
    })],
    docText: text, blocks: [{ id: 'b1', text }], jetzt: 1000,
  })
  assert.equal(unbekannt.uebernommen.length, 0)
  assert.equal(unbekannt.verworfen, 1)
  assert.equal(formulierung.uebernommen.length, 1)
  assert.equal(formulierung.uebernommen[0].vorschlagsart, 'formulierung')
  assert.equal(formulierung.uebernommen[0].stilmittelId, null)
})

// ---- Die Rueckkopplung reicht bis in die echte Anfrage durch ------------------
// Dieselbe Lehre wie bei der Textart: Ein Parameter, den niemand uebergibt, ist eine
// Leitung ohne Strom. versucheHinweislauf baut den Kontext selbst; wenn die Bilanz dort
// nicht ankommt, sieht das Modell sie nie -- und alle Bilanz-Unit-Tests blieben gruen.

test('die Rueckkopplungsbilanz erreicht den Kontext, den versucheHinweislauf an runTask gibt', async () => {
  const findings = []
  const decisions = []
  const anlegen = (art, status, anzahl) => {
    for (let i = 0; i < anzahl; i += 1) {
      const id = `${art}-${status}-${i}`
      findings.push({ id, kiKategorie: art, status })
      decisions.push({ findingId: id, outcome: status })
    }
  }
  anlegen('struktur', 'dismissed', 18)
  anlegen('struktur', 'resolved', 2)
  anlegen('fakt', 'resolved', 9)
  anlegen('fakt', 'dismissed', 3)

  let gesehenerKontext = null
  const vorschlag = erstelleRueckkopplungsvorschlag(
    bilanziereRueckmeldung({ dokumente: [{ findings, decisions }] }),
  )
  const freigegeben = entscheideRueckkopplung(vorschlag, { approved: true, actor: 'user', at: 1 })
  await versucheHinweislauf(basisVersuch({
    rueckkopplung: freigegeben,
    runTask: async (task, kontext) => {
      gesehenerKontext = kontext
      return { daten: { hinweise: [] } }
    },
  }))
  const text = (gesehenerKontext?.volatiles || []).join('\n')
  assert.ok(text.includes('struktur: 18 von 20'), 'die Bilanz fehlt im Kontext des Laufs')
  assert.ok(text.includes('Streiche keine Art aus deinem Repertoire'), text)
})

test('ohne Rueckkopplung sieht der Kontext genau aus wie zuvor', async () => {
  let ohne = null
  await versucheHinweislauf(basisVersuch({
    runTask: async (task, kontext) => { ohne = kontext; return { daten: { hinweise: [] } } },
  }))
  let leer = null
  await versucheHinweislauf(basisVersuch({
    rueckkopplung: bilanziereRueckmeldung({ dokumente: [] }),
    runTask: async (task, kontext) => { leer = kontext; return { daten: { hinweise: [] } } },
  }))
  assert.deepEqual(leer.volatiles, ohne.volatiles, 'eine leere Bilanz darf keinen Block erzeugen')
})
