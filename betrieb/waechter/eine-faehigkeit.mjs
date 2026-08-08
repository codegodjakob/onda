// W7 — der Faehigkeiten-Waechter.
//
// Er prueft eine einzige Sache: Keine zwei Faehigkeiten (SKILL.md) tragen denselben Namen.
// Und die Gestaltungsfaehigkeit „onda-design" gibt es genau einmal.
//
// Warum das noetig ist: Bis zum 8.8.2026 lagen ZWEI Dateien namens SKILL.md im Projekt,
// beide mit „name: onda-design", und sie widersprachen sich in der Farbfrage.
//   design-system/SKILL.md    sagte: ein Akzent, Sky #8db2c9
//   design-system-2/SKILL.md  sagte: keine Farbe, achromatisch, Akzent = Tinte #1c1a17
// Das ist der gefaehrlichste Fehlertyp, den dieses Projekt hatte, weil er unsichtbar ist:
// Ein Agent laedt die eine Datei und baut blau, der naechste laedt die andere und baut
// grau. Beide halten sich fuer folgsam, beide koennen ihren Fehler gar nicht sehen -- welche
// Anweisung sie bekommen haben, haengt allein an der Ladereihenfolge. Ein Pruefstand kann
// so etwas nicht auffangen: Er misst gegen EINE der beiden Wahrheiten und nennt die andere
// falsch. Darum wird hier nicht der Inhalt beurteilt, sondern gezaehlt.
//
// Seit dem Aufraeumen gilt: design/SKILL.md ist die Gestaltungswahrheit. Der Vorgaenger
// liegt zum Nachschlagen unter design/archiv-v1/ -- ausdruecklich OHNE SKILL.md, denn
// sonst waeren es sofort wieder zwei.
//
// Zwei Fragen:
//   1. Traegt ein Name zweimal? (der eigentliche Schutz)
//   2. Gibt es „onda-design" genau einmal? (nicht null: eine Gestaltungswahrheit, die
//      niemand mehr findet, ist auch keine)

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative, sep } from 'node:path'

const WURZEL = fileURLToPath(new URL('../../', import.meta.url))

// Der Name, der genau einmal vorkommen muss. Er steht hier ausgeschrieben, weil er der
// konkrete Fall ist, der schon einmal eingetreten ist -- eine Regel ohne den Fall, gegen
// den sie gebaut wurde, wird beim naechsten Aufraeumen versehentlich weggestrichen.
const PFLICHTNAME = 'onda-design'

// Ordner, die nicht gelesen werden. Jeder mit Grund -- ein uebersprungener Ordner ohne
// Grund waere ein Loch im Netz.
const UEBERSPRUNGENE_ORDNER = new Map([
  ['node_modules', 'Fremde Pakete. Bringen ihre eigenen Faehigkeiten mit, die uns nicht gehoeren.'],
  ['.git', 'Die Versionsverwaltung selbst, keine Arbeitsdateien.'],
  ['.worktrees', 'Nebenarbeitsordner: dort liegt derselbe Baum noch einmal — jede Datei waere ein Doppelbefund.'],
  ['.superpowers', 'Fremdes Werkzeug, eingebunden, nicht Teil dieses Projekts.'],
  ['dist', 'Erzeugte Buendel.'],
  ['build', 'Erzeugte Buendel.'],
])

// ---------------------------------------------------------------------------------------
// Sammeln
// ---------------------------------------------------------------------------------------

function sammleSkills(ordner) {
  let eintraege
  try {
    eintraege = readdirSync(ordner, { withFileTypes: true })
  } catch {
    return []
  }
  const gefunden = []
  for (const eintrag of eintraege) {
    const pfad = join(ordner, eintrag.name)
    if (eintrag.isDirectory()) {
      if (UEBERSPRUNGENE_ORDNER.has(eintrag.name)) continue
      gefunden.push(...sammleSkills(pfad))
    } else if (eintrag.name === 'SKILL.md') {
      gefunden.push(pfad)
    }
  }
  return gefunden
}

// Der Name steht im Kopf der Datei, zwischen zwei Zeilen aus drei Strichen:
//   ---
//   name: onda-design
//   ---
// Fehlt der Kopf, hat die Datei keinen Namen -- das ist kein Fehler dieses Waechters,
// aber sie kann dann auch mit keiner anderen kollidieren.
function liesNamen(pfad) {
  let text
  try {
    text = readFileSync(pfad, 'utf8')
  } catch {
    return null
  }
  const zeilen = text.split('\n')
  if (zeilen[0].trim() !== '---') return null
  for (let i = 1; i < zeilen.length; i += 1) {
    const zeile = zeilen[i]
    if (zeile.trim() === '---') break
    const treffer = /^name:\s*(.+?)\s*$/.exec(zeile)
    if (treffer) return treffer[1].replace(/^['"]|['"]$/g, '')
  }
  return null
}

function alsProjektpfad(pfad) {
  return relative(WURZEL, pfad).split(sep).join('/')
}

// ---------------------------------------------------------------------------------------
// Der Lauf
// ---------------------------------------------------------------------------------------

const dateien = sammleSkills(WURZEL).filter((p) => statSync(p).isFile()).sort()

const nachName = new Map() // Name -> Liste von Projektpfaden
const ohneNamen = []

for (const datei of dateien) {
  const projektpfad = alsProjektpfad(datei)
  const name = liesNamen(datei)
  if (name === null) {
    ohneNamen.push(projektpfad)
    continue
  }
  if (!nachName.has(name)) nachName.set(name, [])
  nachName.get(name).push(projektpfad)
}

const doppelte = [...nachName.entries()].filter(([, pfade]) => pfade.length > 1)
const pflicht = nachName.get(PFLICHTNAME) || []

console.log('Faehigkeiten-Waechter (W7) — traegt eine Faehigkeit ihren Namen allein?\n')
console.log(`  ${dateien.length} SKILL.md gefunden (ohne ${[...UEBERSPRUNGENE_ORDNER.keys()].join(', ')}).`)
for (const [name, pfade] of [...nachName.entries()].sort()) {
  console.log(`  ${pfade.length === 1 ? 'einmal ' : 'MEHRFACH'}  ${name}`)
  for (const pfad of pfade) console.log(`             ${pfad}`)
}
for (const pfad of ohneNamen) {
  console.log(`  ohne Namen  ${pfad}  (kein name: im Kopf — kollidiert mit nichts)`)
}
console.log('')

if (doppelte.length === 0 && pflicht.length === 1) {
  console.log(`GRUEN: Jeder Faehigkeitsname kommt genau einmal vor, „${PFLICHTNAME}" eingeschlossen.`)
  process.exit(0)
}

if (doppelte.length > 0) {
  console.log(`ROT: ${doppelte.length} Name${doppelte.length === 1 ? '' : 'n'} wird von mehreren Faehigkeiten getragen:\n`)
  for (const [name, pfade] of doppelte) {
    console.log(`  „${name}" — ${pfade.length} mal:`)
    for (const pfad of pfade) console.log(`      ${pfad}`)
  }
  console.log('\nWelche Datei ein Agent laedt, entscheidet dann die Ladereihenfolge, nicht das')
  console.log('Projekt. Eine der beiden muss gehen — oder einen eigenen Namen bekommen.')
  console.log('')
}

if (pflicht.length === 0) {
  console.log(`ROT: Es gibt keine Faehigkeit „${PFLICHTNAME}" mehr.`)
  console.log('     Sie ist die Gestaltungswahrheit des Projekts und gehoert nach design/SKILL.md.')
}

process.exit(1)
