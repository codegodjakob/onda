#!/usr/bin/env node
// DESIGN-06 — „Die Umgestaltungsentscheidungen sind getroffen."
//
// Das Prozess-Tor. Es prüft nicht, wie etwas aussieht, sondern ob es überhaupt
// gebaut werden durfte: Kein Punkt aus docs/REDESIGN-IDEEN.md wird umgesetzt,
// solange er auf „open" steht. Die Entscheidung liegt beim Nutzer, nicht bei der
// Umsetzung.
//
// Warum dieses Tor überhaupt existiert: Am 31.07.2026 lautete die Anweisung
// ausdrücklich „erst sammeln, dann umsetzen". Ohne eine Prüfung, die das nachhält,
// ist eine solche Anweisung nach zwei Wochen Arbeit nur noch eine Erinnerung.
//
// WOHER DIESES TOR WEISS, WAS UMGESETZT IST — und warum es das seit dem 06.08.2026
// selbst misst:
//
// Bis dahin las es evals/results/fertigzustand-latest.json, also den Stand des
// LETZTEN Laufs. Das ist genau die Weiterreichung, die der Gesamtlauf selbst
// verbietet („dort durfte ein Eval bestanden heißen, weil ein früherer Lauf das
// gesagt hatte"). Und sie ging schief: Am 06.08.2026 meldete dieses Tor grün und
// führte „Punkt 1 umgesetzt (DESIGN-01)" an — die Ergebnisdatei stammte aus Commit
// 6de1f5b, von vor dem ganzen Oberflächen-Umbau, während DESIGN-01 frisch gemessen
// durchfiel. Ein Tor, das den Stand von vorgestern beurteilt, ist kein Tor.
//
// Deshalb misst es jetzt selbst: es startet die Gestalt-Prüfung und liest deren
// Ergebnis aus diesem Lauf. Das kostet knapp drei Sekunden und kann nicht veralten.
// Läuft sie nicht (kein Server, kein Browser), bricht dieses Tor LAUT ab, statt
// eine alte Antwort weiterzureichen.

import { execFile } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const ausfuehren = promisify(execFile)
const hier = dirname(fileURLToPath(import.meta.url))
const appWurzel = resolve(hier, '../..')
const wurzel = resolve(hier, '../../..')

// Welcher Punkt der Ideensammlung wird von welchem Gestalt-Eval belegt. Diese
// Zuordnung ist der Kern der Prüfung: ohne sie wüsste niemand, welcher Punkt als
// „umgesetzt" gilt.
const PUNKT_ZU_EVALS = {
  '1': ['DESIGN-01'],
  '2': ['DESIGN-02', 'DESIGN-03'],
  '3': ['DESIGN-04'],
  '4d': ['DESIGN-05'],
}

const fehler = []
const belege = []

// --- Die Statustabelle lesen -------------------------------------------------
let ideen
try {
  ideen = readFileSync(resolve(wurzel, 'docs/REDESIGN-IDEEN.md'), 'utf8')
} catch {
  fehler.push('docs/REDESIGN-IDEEN.md ist nicht lesbar — ohne die Sammlung gibt es kein Tor.')
}

const status = new Map()
if (ideen) {
  // Zeilen der Form: | 4d | Thema | Wer | agreed | Datum |
  for (const zeile of ideen.split('\n')) {
    const spalten = zeile.split('|').map(feld => feld.trim())
    if (spalten.length < 5) continue
    const nummer = spalten[1].replace(/\*/g, '')
    if (!/^[0-9]+[a-f]?$/.test(nummer)) continue
    const rohStatus = spalten[4].replace(/\*/g, '').toLowerCase()
    status.set(nummer, rohStatus)
  }
  if (!status.size) fehler.push('In docs/REDESIGN-IDEEN.md wurde keine Statustabelle gefunden.')
}

// --- Die Gestalt-Prüfung JETZT laufen lassen ---------------------------------
const bestanden = new Set()
let ausgabe = ''
try {
  const lauf = await ausfuehren('node', ['evals/pruefungen/gestalt.mjs'], {
    cwd: appWurzel,
    maxBuffer: 8 * 1024 * 1024,
    timeout: 300_000,
  })
  ausgabe = lauf.stdout
} catch (ursache) {
  // Nicht bestandene Gestalt-Evals lassen das Skript mit Code 1 enden. Das ist
  // hier kein Abbruch, sondern eine Antwort: dann ist der Punkt eben nicht umgesetzt.
  ausgabe = ursache.stdout || ''
  if (!ausgabe) {
    fehler.push(
      'Die Gestalt-Prüfung liess sich nicht ausführen, also ist unbekannt, was umgesetzt ist: '
      + `${(ursache.message || '').split('\n')[0]}`,
    )
  }
}
for (const zeile of ausgabe.split('\n')) {
  const treffer = zeile.match(/^ok (DESIGN-\d+)/)
  if (treffer) bestanden.add(treffer[1])
}
// Eine Ausgabe ohne eine einzige Ergebniszeile heisst: gemessen wurde nichts.
const gemessen = /^(ok|not ok) DESIGN-\d+/m.test(ausgabe)
if (!fehler.length && !gemessen) {
  fehler.push('Die Gestalt-Prüfung hat kein einziges Ergebnis gemeldet — ohne Messung kein Urteil.')
}

// --- Die eigentliche Pruefung -------------------------------------------------
if (gemessen) {
  for (const [punkt, evals] of Object.entries(PUNKT_ZU_EVALS)) {
    const umgesetzt = evals.filter(id => bestanden.has(id))
    if (!umgesetzt.length) {
      belege.push(`Punkt ${punkt}: nicht umgesetzt (${evals.join(', ')} bestehen nicht) — nichts zu entscheiden.`)
      continue
    }
    const eintrag = status.get(punkt)
    if (eintrag === undefined) {
      fehler.push(`Punkt ${punkt} ist umgesetzt (${umgesetzt.join(', ')}), steht aber in keiner Statuszeile.`)
      continue
    }
    if (eintrag === 'agreed' || eintrag === 'vereinbart' || eintrag === 'verworfen' || eintrag === 'rejected') {
      belege.push(`Punkt ${punkt}: umgesetzt (${umgesetzt.join(', ')}) und entschieden ("${eintrag}").`)
      continue
    }
    fehler.push(
      `Punkt ${punkt} ist umgesetzt (${umgesetzt.join(', ')}), steht aber auf "${eintrag}". `
      + 'Umgesetzt wird erst, was entschieden ist — die Entscheidung liegt beim Nutzer.',
    )
  }
}

// Gegenprobe: die Prüfung darf nicht dadurch bestehen, dass sie nichts findet.
if (!fehler.length && !belege.some(zeile => zeile.includes('entschieden'))) {
  fehler.push('Kein einziger umgesetzter Punkt gefunden — die Zuordnung Punkt→Eval greift nicht mehr.')
}

if (fehler.length) {
  process.stdout.write('DESIGN-06 FEHLGESCHLAGEN:\n')
  fehler.forEach(zeile => process.stdout.write(`  ${zeile}\n`))
  process.exitCode = 1
} else {
  process.stdout.write('DESIGN-06: jeder umgesetzte Gestaltungspunkt trägt eine Entscheidung.\n')
  belege.forEach(zeile => process.stdout.write(`  ${zeile}\n`))
}
