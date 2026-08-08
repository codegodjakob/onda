import test from 'node:test'
import assert from 'node:assert/strict'
import {
  kostenJeUebernahme,
  monatsZaehlung,
  verdichteEntscheidungen,
  weglegenQuote,
  MINDESTZAHL_ERTRAG,
  WOERTLICH_BEHALTEN,
} from '../src/lauf-bilanz.mjs'

// ---- Helfer ------------------------------------------------------------------
// Baut `anzahl` Erweiterungen mit dem gewuenschten Status. Die Stellen/Art-Felder
// interessieren weglegenQuote nicht -- nur der Status zaehlt.
function macheErweiterungen(status, anzahl) {
  const liste = []
  for (let i = 0; i < anzahl; i += 1) {
    liste.push({ id: `e-${status}-${i}`, art: 'weiterfuehrung', status })
  }
  return liste
}

function macheDokument(erweiterungen, { trashed = false } = {}) {
  return { erweiterungen, trashed }
}

// ---- weglegenQuote -------------------------------------------------------------

test('weglegenQuote zaehlt gemerkt/weg und sagt unter der Mindestzahl ehrlich "noch zu wenig"', () => {
  // 3 gemerkt + 4 weg -> bewertbar 7, das liegt unter MINDESTZAHL_ERTRAG (10):
  // ehrliches "noch zu wenig" statt einer Prozentzahl, die bei 7 Faellen nur Rauschen waere.
  const wenigeDokumente = [
    macheDokument([...macheErweiterungen('gemerkt', 3), ...macheErweiterungen('weg', 4)]),
  ]
  const wenig = weglegenQuote(wenigeDokumente)
  assert.equal(wenig.gemerkt, 3)
  assert.equal(wenig.weg, 4)
  assert.equal(wenig.neu, 0)
  assert.equal(wenig.bewertbar, 7)
  assert.equal(wenig.quote, null)
  assert.equal(wenig.aussage, 'noch-zu-wenig')

  // 7 gemerkt + 5 weg -> bewertbar 12, das reicht: eine echte Quote (5 von 12 weggelegt).
  const genugDokumente = [
    macheDokument([...macheErweiterungen('gemerkt', 7), ...macheErweiterungen('weg', 5)]),
  ]
  const genug = weglegenQuote(genugDokumente)
  assert.equal(genug.gemerkt, 7)
  assert.equal(genug.weg, 5)
  assert.equal(genug.bewertbar, 12)
  assert.equal(genug.quote, 5 / 12)
  assert.equal(genug.aussage, 'quote')

  // Nur 'neu' -- gar nichts wurde je entschieden. Das ist keine "noch zu wenig"-Lage
  // (die suggeriert: es liegt schon etwas vor, nur zu wenig), sondern schlicht 'keine'.
  const nurNeu = weglegenQuote([macheDokument(macheErweiterungen('neu', 6))])
  assert.equal(nurNeu.bewertbar, 0)
  assert.equal(nurNeu.quote, null)
  assert.equal(nurNeu.aussage, 'keine')

  // Ein weggeworfenes Dokument zaehlt nicht mit, egal was in ihm steht.
  const mitPapierkorb = weglegenQuote([
    macheDokument([...macheErweiterungen('gemerkt', 7), ...macheErweiterungen('weg', 5)]),
    macheDokument(macheErweiterungen('weg', 50), { trashed: true }),
  ])
  assert.equal(mitPapierkorb.bewertbar, 12, 'trashed-Dokumente duerfen die Zahlen nicht veraendern')
  assert.equal(mitPapierkorb.aussage, 'quote')

  // Muell wirft nie -- kaputte Eingaben zaehlen als leer.
  assert.doesNotThrow(() => weglegenQuote(null))
  assert.doesNotThrow(() => weglegenQuote(undefined))
  assert.doesNotThrow(() => weglegenQuote('kaputt'))
  const ausMuell = weglegenQuote([
    null,
    42,
    'text',
    { erweiterungen: 'kein-array' },
    { erweiterungen: [null, 7, { status: 'unbekannt' }, { status: 'gemerkt' }] },
  ])
  assert.equal(ausMuell.gemerkt, 1)
  assert.equal(ausMuell.weg, 0)
  assert.equal(ausMuell.bewertbar, 1)
  assert.equal(ausMuell.aussage, 'noch-zu-wenig')
})

// ---- monatsZaehlung -------------------------------------------------------------

test('monatsZaehlung zaehlt accept-Entscheidungen und gemerkte Erweiterungen nur im Monat', () => {
  const juli = Date.UTC(2026, 6, 15, 12) // lokale lauf-journal-Logik nutzt lokale Monate; UTC-Mitte des Tages ist stabil genug fuer diesen Test
  const august = Date.UTC(2026, 7, 3, 12)

  const dokumente = [
    {
      decisions: [
        { findingId: 'f1', kind: 'accept', outcome: 'resolved', at: juli },
        { findingId: 'f2', kind: 'reject', outcome: 'dismissed', at: juli }, // reject zaehlt nie, egal welcher Monat
        { findingId: 'f3', kind: 'accept', outcome: 'resolved', at: august },
        { findingId: 'f4', kind: 'accept', outcome: 'resolved', at: august },
        { findingId: 'f5', kind: 'reject', outcome: 'risk-accepted', at: august },
      ],
      erweiterungen: [
        { id: 'x1', status: 'gemerkt', entschiedenAt: juli },
        { id: 'x2', status: 'weg', entschiedenAt: juli }, // weg zaehlt nie
        { id: 'x3', status: 'gemerkt', entschiedenAt: august },
        { id: 'x4', status: 'gemerkt', entschiedenAt: august },
        { id: 'x5', status: 'neu', entschiedenAt: august }, // neu zaehlt nie (noch nicht entschieden)
      ],
    },
    // Ein trashed-Dokument darf die Zaehlung nicht veraendern.
    {
      trashed: true,
      decisions: [{ findingId: 'f9', kind: 'accept', outcome: 'resolved', at: juli }],
      erweiterungen: [{ id: 'x9', status: 'gemerkt', entschiedenAt: juli }],
    },
  ]

  const monatJuli = `${new Date(juli).getFullYear()}-${String(new Date(juli).getMonth() + 1).padStart(2, '0')}`
  const monatAugust = `${new Date(august).getFullYear()}-${String(new Date(august).getMonth() + 1).padStart(2, '0')}`

  const zaehlungJuli = monatsZaehlung(dokumente, monatJuli)
  assert.equal(zaehlungJuli.angenommeneHinweise, 1)
  assert.equal(zaehlungJuli.gemerkteErweiterungen, 1)

  const zaehlungAugust = monatsZaehlung(dokumente, monatAugust)
  assert.equal(zaehlungAugust.angenommeneHinweise, 2)
  assert.equal(zaehlungAugust.gemerkteErweiterungen, 2)

  // Ein Monat ohne jeden Treffer bleibt bei null, nicht undefined oder ein Absturz.
  const leer = monatsZaehlung(dokumente, '1999-01')
  assert.equal(leer.angenommeneHinweise, 0)
  assert.equal(leer.gemerkteErweiterungen, 0)

  // Muell wirft nie.
  assert.doesNotThrow(() => monatsZaehlung(null, '2026-07'))
  assert.doesNotThrow(() => monatsZaehlung(dokumente, null))
  const ausMuell = monatsZaehlung(
    [null, { decisions: 'kaputt', erweiterungen: [{ status: 'gemerkt', entschiedenAt: 'nicht-numerisch' }] }],
    monatJuli,
  )
  assert.equal(ausMuell.angenommeneHinweise, 0)
  assert.equal(ausMuell.gemerkteErweiterungen, 0)
})

// ---- kostenJeUebernahme -------------------------------------------------------------

test('kostenJeUebernahme teilt Journal-Kosten durch Uebernahmen — Fehllaeufe und fremde Kanaele bleiben draussen', () => {
  // Die Beispielzahlen aus dem Plan: 2 Uebernahmen liegen weit unter MINDESTZAHL_ERTRAG (10) --
  // die Kosten und die Uebernahmen-Zahl stimmen, aber "Basis beachten": eine Cent-Zahl aus nur
  // zwei Faellen waere Rauschen, deshalb bleibt centsJeUebernahme hier null (dieselbe Regel wie
  // bei weglegenQuote).
  const journalKlein = {
    eintraege: [
      { kanal: 'hinweis', ergebnis: 'geliefert', kostenCents: 30, uebernommen: 2 },
      { kanal: 'erweiterung', ergebnis: 'verworfen', kostenCents: 20, uebernommen: 0 },
      { kanal: 'chat', ergebnis: 'geliefert', kostenCents: 50, uebernommen: 5 }, // fremder Kanal, zaehlt nirgends mit
      { kanal: 'hinweis', ergebnis: 'fehler', kostenCents: 999, uebernommen: 999 }, // Fehllauf, zaehlt nirgends mit
    ],
  }
  const klein = kostenJeUebernahme(journalKlein)
  assert.equal(klein.kostenCents, 50, 'nur hinweis (30) + erweiterung (20), chat und Fehllauf bleiben draussen')
  assert.equal(klein.uebernommen, 2)
  assert.equal(klein.centsJeUebernahme, null)
  assert.equal(klein.aussage, 'noch-zu-wenig')

  // Mit genug Uebernahmen (>= MINDESTZAHL_ERTRAG) wird aus derselben Rechnung eine echte Zahl.
  const journalGross = {
    eintraege: [
      { kanal: 'hinweis', ergebnis: 'geliefert', kostenCents: 150, uebernommen: 6 },
      { kanal: 'erweiterung', ergebnis: 'geliefert', kostenCents: 100, uebernommen: 4 },
    ],
  }
  const gross = kostenJeUebernahme(journalGross)
  assert.equal(gross.kostenCents, 250)
  assert.equal(gross.uebernommen, 10)
  assert.equal(gross.centsJeUebernahme, 25)
  assert.equal(gross.aussage, 'quote')

  // Kein Journal, keine Eintraege -- 'keine', kein Absturz.
  const leer = kostenJeUebernahme({ eintraege: [] })
  assert.equal(leer.uebernommen, 0)
  assert.equal(leer.centsJeUebernahme, null)
  assert.equal(leer.aussage, 'keine')

  assert.doesNotThrow(() => kostenJeUebernahme(null))
  assert.doesNotThrow(() => kostenJeUebernahme(undefined))
  assert.doesNotThrow(() => kostenJeUebernahme({ eintraege: 'kaputt' }))
  const ausMuell = kostenJeUebernahme({ eintraege: [null, 'x', { kanal: 'hinweis', kostenCents: 'viel', uebernommen: 'zwei' }] })
  assert.equal(ausMuell.kostenCents, 0)
  assert.equal(ausMuell.uebernommen, 0)
})

// ---- verdichteEntscheidungen -------------------------------------------------------------

const KATEGORIEN_5 = Object.freeze(['fakt', 'logik', 'quelle', 'sprache', 'struktur'])
const AUSGAENGE_3 = Object.freeze(['resolved', 'dismissed', 'risk-accepted'])

// Baut `anzahl` Entscheidungs-Eintraege in der Ausgabeform von fasseEntscheidungenZusammen
// plus `at`. at faellt mit wachsendem i, i=0 ist also immer der juengste Eintrag -- das gilt
// unabhaengig von `anzahl`, solange dieselbe Formel benutzt wird (wichtig fuer den WACHSTUM-Test,
// der zwei verschiedene `anzahl` vergleicht und dieselben ersten zwoelf erwartet).
function baueEntscheidungen(anzahl, { einheitlicheLaenge = false } = {}) {
  const eintraege = []
  for (let i = 0; i < anzahl; i += 1) {
    eintraege.push({
      anker: einheitlicheLaenge ? 'Ankertext einheitlicher Laenge' : `Anker ${i}`,
      kategorie: KATEGORIEN_5[i % KATEGORIEN_5.length],
      kurz: einheitlicheLaenge ? 'Kurzbeschreibung einheitlicher Laenge' : `Kurz ${i}`,
      entscheidung: AUSGAENGE_3[i % AUSGAENGE_3.length],
      begruendung: einheitlicheLaenge ? 'Begruendungstext einheitlicher Laenge' : `Begruendung ${i}`,
      at: 1_000_000 - i,
    })
  }
  return eintraege
}

test('verdichteEntscheidungen: die juengsten bleiben woertlich, aeltere werden Kategorien-Summen', () => {
  const eintraege = baueEntscheidungen(50)
  const ergebnis = verdichteEntscheidungen(eintraege, WOERTLICH_BEHALTEN)

  assert.equal(ergebnis.woertlich.length, WOERTLICH_BEHALTEN)
  // Juengste zuerst: i=0 hat das groesste `at`, muss also vorne stehen.
  assert.deepEqual(ergebnis.woertlich.map(e => e.anker), Array.from({ length: 12 }, (_, i) => `Anker ${i}`))
  // Kein Zeitstempel im Prompt-Ausgang.
  ergebnis.woertlich.forEach(eintrag => assert.equal('at' in eintrag, false))
  // Die uebrigen Felder bleiben erhalten.
  assert.equal(ergebnis.woertlich[0].kategorie, KATEGORIEN_5[0])
  assert.equal(ergebnis.woertlich[0].entscheidung, AUSGAENGE_3[0])

  // Die restlichen 38 (i=12..49) muessen vollstaendig in den Summen aufgehen.
  const erwartet = new Map(KATEGORIEN_5.map(k => [k, { angenommen: 0, verworfen: 0 }]))
  for (let i = 12; i < 50; i += 1) {
    const kategorie = KATEGORIEN_5[i % KATEGORIEN_5.length]
    const ausgang = AUSGAENGE_3[i % AUSGAENGE_3.length]
    const zeile = erwartet.get(kategorie)
    if (ausgang === 'resolved' || ausgang === 'risk-accepted') zeile.angenommen += 1
    else if (ausgang === 'dismissed') zeile.verworfen += 1
  }
  assert.equal(ergebnis.summen.length, KATEGORIEN_5.length)
  // Summen sind nach Kategorie sortiert -- stabile Prompts, keine zufaellige Reihenfolge.
  assert.deepEqual(ergebnis.summen.map(z => z.kategorie), [...KATEGORIEN_5].sort((a, b) => a.localeCompare(b, 'de')))
  ergebnis.summen.forEach(zeile => {
    const soll = erwartet.get(zeile.kategorie)
    assert.equal(zeile.angenommen, soll.angenommen, `angenommen bei ${zeile.kategorie}`)
    assert.equal(zeile.verworfen, soll.verworfen, `verworfen bei ${zeile.kategorie}`)
  })
  const summeAlt = ergebnis.summen.reduce((n, z) => n + z.angenommen + z.verworfen, 0)
  assert.equal(summeAlt, 38)

  // Eintraege ohne `at` sortieren als aelteste (0) -- sie landen ganz hinten, nicht vorne.
  const mitLuecke = [
    { anker: 'ohne-at', kategorie: 'fakt', kurz: '', entscheidung: 'resolved', begruendung: '' },
    { anker: 'mit-at', kategorie: 'fakt', kurz: '', entscheidung: 'resolved', begruendung: '', at: 5 },
  ]
  const verdichtet = verdichteEntscheidungen(mitLuecke, 1)
  assert.equal(verdichtet.woertlich[0].anker, 'mit-at')
  assert.equal(verdichtet.summen[0].angenommen, 1) // der Eintrag ohne `at` faellt in die Summe

  // Weniger Eintraege als woertlichBehalten -- alles bleibt woertlich, keine Summenzeilen.
  const wenige = verdichteEntscheidungen(baueEntscheidungen(5), WOERTLICH_BEHALTEN)
  assert.equal(wenige.woertlich.length, 5)
  assert.deepEqual(wenige.summen, [])

  // Muell wirft nie.
  assert.doesNotThrow(() => verdichteEntscheidungen(null))
  assert.doesNotThrow(() => verdichteEntscheidungen(undefined))
  const ausMuell = verdichteEntscheidungen([null, 42, 'x', { kategorie: 'fakt', entscheidung: 'resolved' }], 0)
  assert.deepEqual(ausMuell.woertlich, [])
  assert.equal(ausMuell.summen.length, 1)
  assert.equal(ausMuell.summen[0].angenommen, 1)
})

// Review-Nachtrag (Task 2): eine Fixture, deren `at` einfach mit wachsendem Index faellt,
// kann eine Implementierung nicht von einer unterscheiden, die unterhalb der Schwelle
// trotzdem sortiert -- beide liefern zufaellig dieselbe Reihenfolge. Diese Fixture bricht die
// Deckungsgleichheit absichtlich: Eintrag 0 steht zuerst im Array, ist aber NICHT der
// juengste (`at`). Die alte, unverdichtete Form kannte kein `at` und gab immer die
// Eingabereihenfolge zurueck -- das muss unterhalb der Schwelle so bleiben.
test('verdichteEntscheidungen: unterhalb der Schwelle bleibt die Eingabereihenfolge erhalten (kein Sortieren nach at)', () => {
  const eintraege = [
    { anker: 'A0', kategorie: 'fakt', kurz: '', entscheidung: 'resolved', begruendung: '', at: 300 },
    { anker: 'A1', kategorie: 'fakt', kurz: '', entscheidung: 'resolved', begruendung: '', at: 500 },
    { anker: 'A2', kategorie: 'fakt', kurz: '', entscheidung: 'resolved', begruendung: '', at: 100 },
    { anker: 'A3', kategorie: 'fakt', kurz: '', entscheidung: 'resolved', begruendung: '', at: 400 },
    { anker: 'A4', kategorie: 'fakt', kurz: '', entscheidung: 'resolved', begruendung: '', at: 200 },
  ]
  const ergebnis = verdichteEntscheidungen(eintraege, WOERTLICH_BEHALTEN)
  assert.deepEqual(ergebnis.woertlich.map(e => e.anker), ['A0', 'A1', 'A2', 'A3', 'A4'])
  assert.deepEqual(ergebnis.summen, [])
  ergebnis.woertlich.forEach(eintrag => assert.equal('at' in eintrag, false))
})

// ---- WACHSTUM: der eigentliche Abnahme-Kern von #13 -------------------------------------

test('WACHSTUM: die verdichtete Form waechst nicht linear mit der Entscheidungsgeschichte', () => {
  // Beide Fixtures benutzen dieselbe Formel fuer `at`, `kategorie`, `entscheidung` und
  // einheitlich lange Textfelder -- die ersten zwoelf (jeweils die juengsten) sind dadurch
  // in beiden Faellen BYTE-IDENTISCH im `woertlich`-Teil. Was zwischen 20 und 50 Eintraegen
  // wachsen darf, ist ausschliesslich die Groesse der Zahlen in den Kategorien-Summen (aus
  // 1-2 Ziffern werden hoechstens ein paar mehr) -- niemals die Zahl der Zeilen oder eine
  // rohe Kopie weiterer Einzeleintraege.
  const klein = verdichteEntscheidungen(baueEntscheidungen(20, { einheitlicheLaenge: true }), WOERTLICH_BEHALTEN)
  const gross = verdichteEntscheidungen(baueEntscheidungen(50, { einheitlicheLaenge: true }), WOERTLICH_BEHALTEN)

  const laengeKlein = JSON.stringify(klein).length
  const laengeGross = JSON.stringify(gross).length

  // Fester Zuschlag: pro Kategorie hoechstens ein paar Zeichen mehr (zwei Zahlenfelder, die im
  // schlimmsten Fall je eine Ziffer breiter werden). 8 Zeichen je Kategorie sind grosszuegig --
  // eine NICHT verdichtete Implementierung (die einfach alle Rohdaten mitschickt) haette pro
  // zusaetzlichem Eintrag ~80-120 JSON-Zeichen mehr, bei 30 zusaetzlichen Eintraegen also
  // mehrere Tausend -- weit jenseits dieser Schranke.
  const SUMMENZEILE_ZUSCHLAG = 8
  const zuschlag = KATEGORIEN_5.length * SUMMENZEILE_ZUSCHLAG

  assert.ok(
    laengeGross <= laengeKlein + zuschlag,
    `50-Eintraege-JSON (${laengeGross} Zeichen) darf hoechstens ${zuschlag} Zeichen groesser sein als `
    + `20-Eintraege-JSON (${laengeKlein} Zeichen) -- gemessen wurde ein Unterschied von ${laengeGross - laengeKlein}`,
  )
  // Ausdruecklich KEINE Tautologie: eine rohe (nicht verdichtete) Liste waechst linear --
  // 30 zusaetzliche Rohdaten-Eintraege waeren allein schon groesser als die gesamte kleine
  // Ausgabe. Das haelt fest, dass hier tatsaechlich verdichtet wurde.
  assert.ok(laengeGross < laengeKlein * 3, 'die Ausgabe darf nicht in der Naehe linearen Wachstums liegen')
})

// ---- Muell-Festigkeit ueber alle vier Funktionen -------------------------------------

test('alle vier Funktionen werfen nie bei kaputten Eingaben', () => {
  assert.doesNotThrow(() => weglegenQuote(123))
  assert.doesNotThrow(() => monatsZaehlung(123, 123))
  assert.doesNotThrow(() => kostenJeUebernahme(123))
  assert.doesNotThrow(() => verdichteEntscheidungen(123, 'nicht-numerisch'))
  assert.doesNotThrow(() => verdichteEntscheidungen([{ at: 'nicht-numerisch', kategorie: null, entscheidung: null }]))
})

// MINDESTZAHL_ERTRAG wird oben implizit ueber die 7/12/2/10-Faelle geprueft -- diese Zusatz-
// Assertion haelt die Konstante selbst fest, damit eine versehentliche Aenderung sofort auffaellt.
test('MINDESTZAHL_ERTRAG und WOERTLICH_BEHALTEN stehen wie im Plan festgelegt', () => {
  assert.equal(MINDESTZAHL_ERTRAG, 10)
  assert.equal(WOERTLICH_BEHALTEN, 12)
})
