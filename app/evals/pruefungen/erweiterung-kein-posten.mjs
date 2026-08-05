#!/usr/bin/env node
// ERWEITERUNG-04 — „Ein Angebot ist kein offener Posten."
//
// Was hier geprüft wird: Eine Erweiterung darf nirgends mitgezählt werden. Kein
// Eintrag in der Warteschlange, keine Zahl neben einem Knopf, kein Anklopfen.
// Eine Zahl neben „Fehler" macht aus einem Geschenk eine Hausaufgabe — deshalb ist
// die Abwesenheit jeder Zählung hier eine gemessene Größe und keine Absichtserklärung.
//
// Geprüft wird auf zwei Wegen, weil einer allein nicht reicht:
//   1. Am Verhalten: die Warteschlange bekommt ein Dokument mit Hinweisen UND
//      Erweiterungen und darf trotzdem nur die Hinweise kennen.
//   2. An der Bauweise: das Modul, das die beiden Zähler zeichnet, kennt das Wort
//      Erweiterung nicht — es kann sie also strukturell nicht anzeigen. Und der
//      Erweiterungslauf ruft keinen der beiden Wege auf, über die der Agent sonst
//      von sich aus anklopft.
//
// Was hier NICHT geprüft wird: wie die Seitenspalte aussieht. Das ist Gestalt und
// gehört in die Browser-Prüfung, nicht hierher.

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { getFindingQueue, isIntegrityCategory } from '../../src/reasoning-model.mjs'
import {
  ERWEITERUNGS_ARTEN,
  ensureErweiterungen,
  legeErweiterungWeg,
  merkeErweiterung,
  sichtbareErweiterungen,
} from '../../src/erweiterung-model.mjs'

const fehler = []
const src = new URL('../../src/', import.meta.url)

function lies(datei) {
  return readFile(fileURLToPath(new URL(datei, src)), 'utf8')
}

// Kommentare entfernen, bevor im Quelltext nach Aufrufen gesucht wird: der Code sagt
// an dieser Stelle ausdrücklich im Kommentar, was er NICHT tut. Ohne dieses Abziehen
// würde die Prüfung genau diesen Satz finden und falsch Alarm schlagen.
function ohneKommentare(text) {
  return text.split('\n').map(zeile => zeile.replace(/\/\/.*$/, '')).join('\n')
}

const ERWEITERUNGEN = [
  { id: 'erw-1', art: 'weiterfuehrung', status: 'neu', gedanke: 'ZWEITERKANALMARKE-eins', muster: 'm', stellen: [{ text: 'Leitungen', index: 0, laenge: 9, blockId: 'b1' }], createdAt: 1 },
  { id: 'erw-2', art: 'feld', status: 'gemerkt', gedanke: 'ZWEITERKANALMARKE-zwei', muster: 'm', stellen: [], createdAt: 2 },
  { id: 'erw-3', art: 'verbindung', status: 'neu', gedanke: 'ZWEITERKANALMARKE-drei', muster: 'm', stellen: [{ text: 'a', index: 0, laenge: 1, blockId: 'b1' }, { text: 'b', index: 5, laenge: 1, blockId: 'b1' }], createdAt: 3 },
]

function baueDoc({ mitHinweisen = true } = {}) {
  return {
    id: 'd1',
    findings: mitHinweisen
      ? [
        { id: 'f1', category: 'fact', status: 'open', placement: 'passage', target: 'Leitungen', createdAt: 1 },
        { id: 'f2', category: 'style', status: 'open', placement: 'document', createdAt: 2 },
        { id: 'f3', category: 'logic', status: 'open', placement: 'document', createdAt: 3 },
      ]
      : [],
    decisions: [],
    erweiterungen: ERWEITERUNGEN.map(eintrag => ({ ...eintrag })),
  }
}

// --- Teil 1: die Warteschlange zählt nur Hinweise ----------------------------
const doc = baueDoc()
ensureErweiterungen(doc)
const queue = getFindingQueue(doc)

if (queue.pendingCount !== 3) {
  fehler.push(`Warteschlange: pendingCount ist ${queue.pendingCount}, erwartet 3 — genau die drei offenen Hinweise.`)
}

const queueText = JSON.stringify(queue)
for (const eintrag of ERWEITERUNGEN) {
  if (queueText.includes(eintrag.id) || queueText.includes(eintrag.gedanke)) {
    fehler.push(`Warteschlange: Erweiterung ${eintrag.id} (${eintrag.art}) steht in der Warteschlange.`)
  }
}

// Gegenprobe: ohne Hinweise muss die Zahl null sein, obwohl drei Erweiterungen da sind.
// Ohne diese Probe wäre die Abwesenheit oben nichts wert — dann zählte die Prüfung nur,
// dass drei Hinweise drei Hinweise sind.
const nurErweiterungen = baueDoc({ mitHinweisen: false })
ensureErweiterungen(nurErweiterungen)
const leereQueue = getFindingQueue(nurErweiterungen)
if (sichtbareErweiterungen(nurErweiterungen).length !== 3) {
  fehler.push('Gegenprobe: die drei Erweiterungen sind gar nicht da — die Prüfung wäre wertlos.')
}
if (leereQueue.pendingCount !== 0 || leereQueue.current !== null || leereQueue.upcoming.length) {
  fehler.push(`Gegenprobe: drei Erweiterungen ohne einen einzigen Hinweis ergeben pendingCount ${leereQueue.pendingCount} statt 0.`)
}

// --- Teil 2: die gelieferte Oberfläche kennt keinen Erweiterungs-Zähler ------
// Bis zum 05.08.2026 prüfte dieser Teil `panels.js` — ein Modul, das nie ausgeliefert
// wurde. Der Beleg maß Totes: er hätte auch dann bestanden, wenn die echte Oberfläche
// voller Zähler gewesen wäre. Geprüft wird jetzt die Datei, die die Seitenspalte
// wirklich zeichnet, und zusätzlich das gebaute Bündel — das ist das, was beim Nutzer
// ankommt, und es lässt sich nicht durch eine ungenutzte Datei beruhigen.
const oberflaeche = await lies('workspace.js')

// Die Zähl-Anzeigen der lebenden Oberfläche. Steht in derselben Zeile wie eine dieser
// Marken das Wort Erweiterung, könnte eine Zahl den zweiten Kanal meinen.
const ZAEHL_MARKEN = ['onda-badge', 'rail-badge', 'pendingCount', 'Badge']
for (const zeile of oberflaeche.split('\n')) {
  if (!ZAEHL_MARKEN.some(marke => zeile.includes(marke))) continue
  if (/erweiterung/i.test(zeile)) {
    fehler.push(`src/workspace.js: eine Zähl-Anzeige nennt den Erweiterungs-Kanal — "${zeile.trim().slice(0, 90)}"`)
  }
}

// Gegenprobe: gäbe es GAR keine Zähl-Anzeige mehr, prüfte die Schleife oben nichts und
// wäre stillschweigend grün. Diese Zeile macht daraus einen sichtbaren Fehlschlag.
if (!ZAEHL_MARKEN.some(marke => oberflaeche.includes(marke))) {
  fehler.push('src/workspace.js: keine einzige Zähl-Anzeige gefunden — die Prüfung misst nicht mehr, was sie messen soll.')
}

// Und im ausgelieferten Bündel: der Abschnitt der Seitenspalte trägt keine Zahl.
const buendel = await lies('../dist/editor.bundle.js').catch(() => '')
if (buendel && /onda-side-erweiterungen[^"]*"[^)]{0,400}?badge/i.test(buendel)) {
  fehler.push('dist/editor.bundle.js: der Erweiterungs-Abschnitt trägt im gelieferten Programm ein Abzeichen.')
}

// --- Teil 3: der Kanal klopft nicht an ---------------------------------------
const workspace = ohneKommentare(await lies('workspace.js'))
const start = workspace.indexOf('async function fuehreErweiterungslaufAus')
if (start < 0) {
  fehler.push('src/workspace.js: fuehreErweiterungslaufAus nicht gefunden — der Kanal wurde umbenannt oder entfernt.')
} else {
  const rest = workspace.slice(start)
  const ende = rest.indexOf('\n}\n')
  const koerper = ende > 0 ? rest.slice(0, ende) : rest
  for (const anklopfen of ['ergaenzeEchteInitiative', 'meldeAgentInitiative']) {
    if (koerper.includes(anklopfen)) {
      fehler.push(`src/workspace.js: der Erweiterungslauf ruft ${anklopfen} — eine Erweiterung klopft damit an, statt liegen zu bleiben.`)
    }
  }
}

// --- Teil 4: zwei Gesten, keine Verhandlung ----------------------------------
// Merken und Weglegen, mehr nicht. Kein „nur diesmal / nicht mehr in diesem Text /
// nie" wie beim Verwerfen eines Hinweises: diese Leiter gibt es, weil ein Hinweis
// eine Forderung war, die man abwehren können muss. Ein Angebot muss man nicht abwehren.
const gesten = baueDoc({ mitHinweisen: false })
ensureErweiterungen(gesten)
merkeErweiterung(gesten, 'erw-1', 10)
if (gesten.erweiterungen.find(e => e.id === 'erw-1').status !== 'gemerkt') {
  fehler.push('Geste Merken: der Zustand wurde nicht auf gemerkt gesetzt.')
}
if (!sichtbareErweiterungen(gesten).some(e => e.id === 'erw-1')) {
  fehler.push('Geste Merken: das Gemerkte ist aus der Sicht verschwunden — merken ist kein Wegräumen.')
}
legeErweiterungWeg(gesten, 'erw-3', 11)
if (sichtbareErweiterungen(gesten).some(e => e.id === 'erw-3')) {
  fehler.push('Geste Weglegen: das Weggelegte ist noch sichtbar.')
}
if (!gesten.erweiterungen.some(e => e.id === 'erw-3')) {
  fehler.push('Geste Weglegen: das Weggelegte wurde gelöscht — dann käme es beim nächsten Lauf wieder.')
}

const zustaende = new Set(gesten.erweiterungen.map(e => e.status))
for (const zustand of zustaende) {
  if (!['neu', 'gemerkt', 'weg'].includes(zustand)) {
    fehler.push(`Ein vierter Zustand ist erreichbar: ${zustand}.`)
  }
}

// Ein unbekannter Zustand aus einer älteren oder beschädigten Ablage darf keine
// vierte Geste aufmachen — er fällt auf „neu" zurück.
const fremd = { erweiterungen: [{ id: 'x', art: 'feld', status: 'risiko-angenommen', stellen: [], gedanke: 'g', muster: 'm', createdAt: 1 }] }
ensureErweiterungen(fremd)
if (fremd.erweiterungen[0].status !== 'neu') {
  fehler.push(`Ein fremder Zustand überlebt die Selbstheilung: ${fremd.erweiterungen[0].status}.`)
}

// Keine der drei Arten ist eine Integritätsfrage — an sie kann sich also weder die
// bewusste Risikoannahme noch das Schlussaudit heften.
for (const art of ERWEITERUNGS_ARTEN) {
  if (isIntegrityCategory(art)) {
    fehler.push(`Erweiterungsart ${art} gilt als Integritätsfrage — damit wäre sie ein offener Posten mit Konsequenz.`)
  }
}

// --- Bericht -----------------------------------------------------------------
if (fehler.length) {
  process.stderr.write(`ERWEITERUNG-04 FEHLGESCHLAGEN:\n  ${fehler.join('\n  ')}\n`)
  process.exit(1)
}
process.stdout.write(
  'ERWEITERUNG-04: drei Erweiterungen neben drei Hinweisen — die Warteschlange zählt 3, '
  + 'die beiden Zähl-Anzeigen kennen den Kanal nicht, der Lauf klopft nicht an, '
  + 'und es gibt genau zwei Gesten: merken und weglegen.\n',
)
