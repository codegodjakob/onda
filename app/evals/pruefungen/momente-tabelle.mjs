#!/usr/bin/env node
// MOMENT-01, MOMENT-02, MOMENT-03, MOMENT-06 — die Zuordnung Art → Moment, Zeile für Zeile.
//
// Was hier geprüft wird: Jede der elf Rückmeldungsarten steht auf genau dem Moment,
// der für sie entschieden wurde — und auf keinem früheren. Die Node-Tests belegen
// einzelne Zeilen der Tabelle; diese Prüfung belegt sie alle, damit keine Zeile still
// verrutschen kann.
//
// Die Regel dahinter: eine Rückmeldung erscheint in dem Moment, in dem man sie
// beantworten kann, ohne den Gedanken zu verlieren.
//   sofort       — die Formulierung, dort wo sie steht
//   innehalten   — die vier Integritätsfragen, nach dem fertigen Satz
//   aufschauen   — alles, was Abstand braucht: Aufbau, Wirkung, Erklärung
//                  und der ganze zweite Kanal
//
// Und: Momente sind aufsteigend, nicht ausschließend. Wer aufschaut, hat auch
// innegehalten — sonst verschwände ein Formulierungshinweis wieder, sobald man die
// Hand von der Tastatur nimmt.

import {
  MOMENTE,
  MOMENT_BEGRUENDUNG,
  darfErscheinen,
  momentFuerArt,
  momentTabelle,
} from '../../src/momente-model.mjs'
import { HINWEISE_SCHEMA } from '../../src/agent-tasks.mjs'
import { ERWEITERUNGS_ARTEN } from '../../src/erweiterung-model.mjs'

const fehler = []

// Die entschiedene Tabelle, hier ausgeschrieben. Verrutscht eine Zeile im Modell,
// schlägt diese Prüfung an — und zwar mit dem Namen der Zeile.
const ERWARTET = Object.freeze({
  sprache: 'sofort',
  fakt: 'innehalten',
  quelle: 'innehalten',
  methode: 'innehalten',
  logik: 'innehalten',
  struktur: 'aufschauen',
  wirkung: 'aufschauen',
  erklaerung: 'aufschauen',
  weiterfuehrung: 'aufschauen',
  feld: 'aufschauen',
  verbindung: 'aufschauen',
})

const RANG = { sofort: 0, innehalten: 1, aufschauen: 2 }

// --- Vollständigkeit: keine Art ohne Zeile, keine Zeile ohne Art --------------
const hinweisArten = HINWEISE_SCHEMA.properties.hinweise.items.properties.kategorie.enum
const alleArten = [...hinweisArten, ...ERWEITERUNGS_ARTEN]

if (alleArten.length !== Object.keys(ERWARTET).length) {
  fehler.push(
    `Es gibt ${alleArten.length} Rückmeldungsarten, aber ${Object.keys(ERWARTET).length} erwartete Zeilen. `
    + 'Eine neue Art braucht eine entschiedene Zuordnung, keinen stillen Rückfall.',
  )
}
for (const art of alleArten) {
  if (!ERWARTET[art]) fehler.push(`Art ohne entschiedene Zeile: ${art}.`)
}
if (momentTabelle().length !== alleArten.length) {
  fehler.push(`Die Tabelle im Modell hat ${momentTabelle().length} Zeilen, die Arten sind ${alleArten.length}.`)
}

// --- Zeile für Zeile ----------------------------------------------------------
for (const [art, erwartet] of Object.entries(ERWARTET)) {
  const ist = momentFuerArt(art)
  if (ist !== erwartet) {
    fehler.push(`${art}: steht auf „${ist}", entschieden war „${erwartet}".`)
    continue
  }
  // Nicht früher als der eigene Moment: was Abstand braucht, darf sich nicht
  // mitten ins Schreiben drängen.
  for (const moment of MOMENTE) {
    const erlaubt = darfErscheinen(art, moment)
    const sollte = RANG[erwartet] <= RANG[moment]
    if (erlaubt !== sollte) {
      fehler.push(
        `${art} im Moment „${moment}": ${erlaubt ? 'erscheint' : 'erscheint nicht'}, `
        + `richtig wäre ${sollte ? 'erscheinen' : 'nicht erscheinen'}.`,
      )
    }
  }
}

// --- Aufsteigend, nicht ausschließend ----------------------------------------
for (const art of Object.keys(ERWARTET)) {
  if (!darfErscheinen(art, 'aufschauen')) {
    fehler.push(`${art} verschwindet beim Aufschauen — Momente sollen aufsteigend sein, nicht ausschließend.`)
  }
}
if (!darfErscheinen('sprache', 'innehalten')) {
  fehler.push('Ein Formulierungshinweis verschwindet beim Innehalten — die Hand von der Tastatur zu nehmen darf nichts wegnehmen.')
}

// --- Jede Zeile trägt eine Begründung ----------------------------------------
for (const zeile of momentTabelle()) {
  const grund = MOMENT_BEGRUENDUNG[zeile.art]
  if (!grund || grund.trim().length <= 40) {
    fehler.push(`${zeile.art}: keine tragfähige Begründung für den Moment.`)
  }
}

// --- Kein toter Moment --------------------------------------------------------
const belegt = new Set(Object.values(ERWARTET))
for (const moment of MOMENTE) {
  if (!belegt.has(moment)) fehler.push(`Der Moment „${moment}" hat keine einzige Art — er wäre tot.`)
}

// --- Bericht -----------------------------------------------------------------
if (fehler.length) {
  process.stderr.write(`MOMENT-Tabelle FEHLGESCHLAGEN:\n  ${fehler.join('\n  ')}\n`)
  process.exit(1)
}
const nachMoment = MOMENTE.map(moment => {
  const arten = Object.keys(ERWARTET).filter(art => ERWARTET[art] === moment)
  return `${moment}: ${arten.join(', ')}`
})
process.stdout.write(`MOMENT-Tabelle: alle ${alleArten.length} Arten stehen auf dem entschiedenen Moment.\n`)
nachMoment.forEach(zeile => process.stdout.write(`  ${zeile}\n`))
