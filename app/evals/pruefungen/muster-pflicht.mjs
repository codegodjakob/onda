#!/usr/bin/env node
// MUSTER-01, MUSTER-02, MUSTER-04 — das Prinzip hinter der Rückmeldung.
//
// Der Anspruch dahinter: Onda soll „hinter jedem Feedback das dahinterliegende System
// offenbaren". Ein Hinweis, der nur diese eine Stelle repariert, macht diesen einen Text
// besser. Das Prinzip dahinter macht die schreibende Person besser.
//
// Warum das ein Pflichtfeld sein muss und keine Bitte im Auftragstext: Die Feldliste der
// Antwort ist geschlossen (additionalProperties: false). Steht das Prinzip nicht in der
// Liste, KANN das Modell es nicht einmal freiwillig nachreichen — die Bitte im Auftragstext
// liefe dann jedes Mal ins Leere, ohne dass es irgendwo auffiele.
//
// Drei Aussagen:
//   01 — jede der elf Rückmeldungsarten beider Kanäle muss ihr Prinzip mitliefern
//   02 — es ist Pflichtfeld in einer geschlossenen Feldliste, nicht nur eine Bitte im Text
//   04 — es ist der schreibenden Person zu sehen, nicht nur gespeichert

import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { ERWEITERUNGEN_SCHEMA, HINWEISE_SCHEMA } from '../../src/agent-tasks.mjs'
import { ERWEITERUNG_ANWEISUNG, HINWEIS_ANWEISUNG } from '../../src/agent-prompts.mjs'
import { ERWEITERUNGS_ARTEN } from '../../src/erweiterung-model.mjs'
import { hinweisZuFinding } from '../../src/agent-findings.mjs'
import { verarbeiteErweiterungsantwort } from '../../src/erweiterungslauf-model.mjs'

const fehler = []
const srcOrdner = new URL('../../src/', import.meta.url)

const hinweisEintrag = HINWEISE_SCHEMA.properties?.hinweise?.items
const erweiterungEintrag = ERWEITERUNGEN_SCHEMA.properties?.erweiterungen?.items

const KANAELE = [
  { name: 'Hinweise', eintrag: hinweisEintrag, artenFeld: 'kategorie' },
  { name: 'Erweiterungen', eintrag: erweiterungEintrag, artenFeld: 'art' },
]

// --- 01: die Arten vollständig, keine ohne Prinzip ---------------------------
const hinweisArten = hinweisEintrag?.properties?.kategorie?.enum || []
const erweiterungsArten = erweiterungEintrag?.properties?.art?.enum || []
const alleArten = [...hinweisArten, ...erweiterungsArten]

// Gegenprobe: ohne Arten hätte „jede Art trägt ihr Prinzip" keinen Inhalt.
if (hinweisArten.length < 8) {
  fehler.push(`Gegenprobe: nur ${hinweisArten.length} Hinweisarten gefunden, erwartet mindestens acht — die Prüfung misst zu wenig.`)
}
if (erweiterungsArten.length !== ERWEITERUNGS_ARTEN.length) {
  fehler.push(
    `Gegenprobe: das Schema kennt ${erweiterungsArten.length} Erweiterungsarten, das Modell `
    + `${ERWEITERUNGS_ARTEN.length}. Zwei Listen sind zwei Wahrheiten.`,
  )
}
for (const art of ERWEITERUNGS_ARTEN) {
  if (!erweiterungsArten.includes(art)) fehler.push(`Gegenprobe: die Erweiterungsart ${art} fehlt im Antwortschema.`)
}
if (new Set(alleArten).size !== alleArten.length) {
  fehler.push('Gegenprobe: eine Art kommt in beiden Kanälen vor — dann meint dasselbe Wort zweierlei.')
}

// --- 02: Pflichtfeld in geschlossener Liste, in beiden Kanälen ---------------
for (const { name, eintrag, artenFeld } of KANAELE) {
  if (!eintrag) {
    fehler.push(`MUSTER-02, ${name}: das Antwortschema hat keine Eintragsform — die Prüfung läuft leer.`)
    continue
  }
  const felder = Object.keys(eintrag.properties || {})
  if (!felder.includes(artenFeld)) {
    fehler.push(`MUSTER-01, ${name}: das Feld für die Art (${artenFeld}) fehlt — die Arten sind nicht mehr auffindbar.`)
  }
  if (!Array.isArray(eintrag.required) || !eintrag.required.includes('muster')) {
    fehler.push(
      `MUSTER-02, ${name}: das Prinzip ist kein Pflichtfeld. Ohne Pflicht liefert ein Modell das Feld `
      + 'genau dann nicht, wenn es schwerfällt — und das ist der Fall, in dem es zählt.',
    )
  }
  if (eintrag.properties?.muster?.type !== 'string') {
    fehler.push(`MUSTER-02, ${name}: das Prinzip ist kein Text.`)
  }
  if (String(eintrag.properties?.muster?.description || '').trim().length <= 40) {
    fehler.push(
      `MUSTER-02, ${name}: das Prinzip hat keine tragfähige Erklärung im Schema. `
      + 'Ein unerklärtes Pflichtfeld füllt ein Modell mit der Beobachtung noch einmal.',
    )
  }
  if (eintrag.additionalProperties !== false) {
    fehler.push(
      `MUSTER-02, ${name}: die Feldliste ist offen. Dann sagt das Pflichtfeld nichts darüber aus, `
      + 'was tatsächlich zurückkommt.',
    )
  }
}

// Die Reihenfolge zählt bei strukturierter Ausgabe: erst begreifen, warum es zählt
// (folge), dann verallgemeinern (muster), dann erst eine Fassung anbieten (vorschlag).
const hinweisFelder = Object.keys(hinweisEintrag?.properties || {})
if (hinweisFelder.includes('folge') && hinweisFelder.indexOf('muster') < hinweisFelder.indexOf('folge')) {
  fehler.push('MUSTER-02: das Prinzip steht vor der Folge — verallgemeinert wird, bevor klar ist, warum es zählt.')
}
if (hinweisFelder.includes('vorschlag') && hinweisFelder.indexOf('muster') > hinweisFelder.indexOf('vorschlag')) {
  fehler.push('MUSTER-02: das Prinzip steht hinter dem Vorschlag — dann ist die Fassung schon geschrieben, bevor jemand verallgemeinert.')
}

// --- 02: der Auftragstext erklärt es, in beiden Kanälen ----------------------
for (const [name, anweisung] of [['Hinweise', HINWEIS_ANWEISUNG], ['Erweiterungen', ERWEITERUNG_ANWEISUNG]]) {
  if (!anweisung.includes('muster')) {
    fehler.push(`MUSTER-02, ${name}: der Auftragstext verlangt das Prinzip nicht — das Schema allein sagt nicht, was hineingehört.`)
    continue
  }
  // Es muss der nächste Text gemeint sein, nicht dieser. Sonst ist das Prinzip die
  // Beobachtung noch einmal, nur allgemeiner formuliert.
  if (!/nächsten Text/u.test(anweisung)) {
    fehler.push(
      `MUSTER-02, ${name}: der Auftragstext sagt nicht, dass das Prinzip beim NÄCHSTEN Text wieder tragen muss. `
      + 'Ohne das schreibt ein Modell die Beobachtung ein zweites Mal.',
    )
  }
}

// --- 01, am Verhalten: das Prinzip überlebt die Verarbeitung ----------------
const hinweis = {
  kategorie: 'logik',
  anker: 'Der Anker steht wörtlich im Text.',
  beobachtung: 'Beobachtung.',
  relevanz: 'Relevanz.',
  folge: 'Folge.',
  muster: 'MARKANTES-PRINZIP-4e9b bleibt beim nächsten Text anwendbar.',
  vorschlag: null,
  istGrundursache: false,
  integritaet: true,
}
const docText = hinweis.anker
const ankerErgebnis = { gefunden: true, index: 0, normalisiert: false, laenge: docText.length }
const finding = hinweisZuFinding(hinweis, ankerErgebnis, 'b-eins', docText, 1000)
if (finding?.muster !== hinweis.muster) {
  fehler.push(
    `MUSTER-01: das Prinzip überlebt die Verarbeitung eines Hinweises nicht (steht: ${JSON.stringify(finding?.muster)}). `
    + 'Ein Pflichtfeld, das unterwegs verlorengeht, ist kein Pflichtfeld.',
  )
}

// Und der Unterschied zwischen den Kanälen ist gewollt: Bei der Erweiterung ist das
// Prinzip der ganze Ertrag, ein fehlendes verwirft den Eintrag. Beim Hinweis trägt die
// Stelle auch allein — ein fehlendes Prinzip darf ihn nicht wegwerfen.
const ohneMuster = { ...hinweis, muster: '' }
const findingOhne = hinweisZuFinding(ohneMuster, ankerErgebnis, 'b-eins', docText, 1000)
if (!findingOhne) {
  fehler.push('MUSTER-01: ein Hinweis ohne Prinzip wird weggeworfen — beim Hinweis ist das Prinzip eine Zugabe, kein Tor.')
}

const erweiterungsAntwort = verarbeiteErweiterungsantwort({
  geliefert: [
    { art: 'feld', anker: [], gedanke: 'Ein Nachbargebiet fehlt noch.', muster: 'Ein Werkzeug hat immer eine leichte Richtung.' },
    { art: 'feld', anker: [], gedanke: 'Ein zweites Nachbargebiet fehlt auch.', muster: '   ' },
  ],
  docText,
  blocks: [{ id: 'b-eins', text: docText }],
  jetzt: 1000,
})
if (erweiterungsAntwort.uebernommen.length !== 1 || erweiterungsAntwort.verworfen !== 1) {
  fehler.push(
    `MUSTER-01: eine Erweiterung ohne Prinzip wird nicht verworfen `
    + `(übernommen ${erweiterungsAntwort.uebernommen.length}, verworfen ${erweiterungsAntwort.verworfen}). `
    + 'Dort ist das Prinzip der ganze Ertrag.',
  )
}

// --- 04: das Prinzip ist zu sehen -------------------------------------------
// Über alle Quelldateien, nicht nur über eine: Zieht jemand das Zeichnen in ein anderes
// Modul um, soll die Prüfung das mittragen und nicht falsch anschlagen.
const quelltexte = []
for (const name of (await readdir(fileURLToPath(srcOrdner))).sort()) {
  if (!name.endsWith('.js') && !name.endsWith('.mjs')) continue
  const roh = await readFile(fileURLToPath(new URL(name, srcOrdner)), 'utf8')
  quelltexte.push([name, roh.split('\n').map(zeile => zeile.replace(/\/\/.*$/, '')).join('\n')])
}

for (const [was, muster] of [['Hinweis', /\bfinding\.muster\b/], ['Erweiterung', /\berweiterung\.muster\b/]]) {
  const treffer = quelltexte.filter(([, text]) => muster.test(text)).map(([name]) => name)
  if (!treffer.length) {
    fehler.push(
      `MUSTER-04, ${was}: nirgends in src/ wird das Prinzip einer ${was}-Karte gelesen. `
      + 'Dann liegt es nur in einer Datei, und der ganze Aufwand ist für die schreibende Person unsichtbar.',
    )
  }
}

// --- Bericht -----------------------------------------------------------------
if (fehler.length) {
  process.stderr.write(`MUSTER-Pflicht FEHLGESCHLAGEN:\n  ${fehler.join('\n  ')}\n`)
  process.exit(1)
}
process.stdout.write(
  `MUSTER: alle ${alleArten.length} Rückmeldungsarten beider Kanäle tragen ihr Prinzip als Pflichtfeld.\n`,
)
process.stdout.write(`  Hinweise: ${hinweisArten.join(', ')}\n`)
process.stdout.write(`  Erweiterungen: ${erweiterungsArten.join(', ')}\n`)
