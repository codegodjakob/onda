// W4 — der Verweis-Waechter.
//
// Er prueft eine einzige Sache: Jeder Dateipfad, den das Projekt ueber sich selbst behauptet,
// zeigt auf eine Datei, die es wirklich gibt.
//
// Warum das VOR jedem Verschieben stehen muss: Ein toter Verweis tut nicht weh. Er bricht
// nichts, keine Pruefung wird rot, niemand merkt es. Er wird nur langsam wertlos -- und wenn
// spaeter jemand dem Zeiger folgt, steht er vor einer Datei, die es seit Monaten nicht mehr
// gibt. Genau das war schon der Fall: app/src/lauf-tor.mjs und app/src/workspace.js
// verwiesen beide auf "system/LEITSTAND.md", eine Datei, die im Baum nie existierte.
//
// Drei Quellen werden gelesen:
//   1. app/evals/bindungen.json       -- welche Pruefung welches Eval belegt
//   2. app/evals/v2-fertigzustand.json -- der Katalog, der den Fertigzustand definiert
//   3. Kommentarzeilen unter app/src/, app/evals/, app/test/, tools/
//
// ZWEI WURZELN: Katalog und Bindungen meinen dieselbe Datei mit verschiedenen Pfaden --
// der Katalog sagt "app/evals/pruefungen/gestalt.mjs" (vom Projektwurzelverzeichnis aus),
// die Bindungen sagen "evals/pruefungen/gestalt.mjs" (vom Ordner app/ aus). Beide sind
// richtig, beide muessen aufgeloest werden. Darum wird jeder Pfad gegen beide Wurzeln
// probiert und gilt als gefunden, sobald EINE davon greift.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'

const WURZEL = fileURLToPath(new URL('../../', import.meta.url))
const APP = join(WURZEL, 'app')

// Die Endungen, die ueberhaupt als Dateiverweis zaehlen. Reihenfolge ist wichtig: 'json'
// muss VOR 'js' stehen, sonst frisst 'js' das Wort "app/package.json" zu "app/package.js" auf.
const PFADMUSTER = /[A-Za-z0-9_@][A-Za-z0-9_@./-]*\.(?:mjs|cjs|json|jsx?|md|html|css|swift)\b/g

// Ordner, die nie gelesen werden: fremder oder erzeugter Code. Ein Buendel (dist/) enthaelt
// die Kommentare seiner Quelldateien noch einmal, mit Pfaden, die nur im Buendel gelten --
// das waere lauter Fehlalarm ueber Zeilen, die niemand von Hand geschrieben hat.
const UEBERSPRUNGENE_ORDNER = new Set(['node_modules', 'dist', 'build', '.git'])

// ---------------------------------------------------------------------------------------
// Ausnahmen. Jede einzeln begruendet -- eine Ausnahme ohne Grund ist ein Loch im Netz.
//
// Gemeinsamer Nenner: Das sind Verweise, die GAR NICHT auf eine heutige Datei zeigen
// sollen. Prosa ueber Vergangenes, ein erfundenes Beispiel, oder ein Name, der etwas
// anderes bezeichnet als eine Datei im Baum.
// ---------------------------------------------------------------------------------------
const AUSNAHMEN = new Map([
  ['app/src/kanaele/neuer-kanal.mjs', 'Erfundenes Beispiel ("z.B.") fuer einen kuenftigen Unterordner.'],
  ['neuer-kanal.mjs', 'Erfundenes Beispiel fuer einen kuenftigen Kanal, keine heutige Datei.'],
  ['panels.js', 'Prosa ueber Vergangenes: die Datei war "laengst nicht mehr im Bundle" — genau das erzaehlt der Kommentar.'],
  ['data.json', 'Name der gespeicherten Nutzerdatei zur Laufzeit, keine Datei im Projektbaum.'],
  ['bilanz-varianten.mjs', 'Prosa ueber Vergangenes: der Vorgaenger von anmerkung-wortlaut.mjs, am 7.8.2026 bewusst abgeschafft.'],
])

// ---------------------------------------------------------------------------------------
// Auflosung
// ---------------------------------------------------------------------------------------

function sammleDateien(ordner, endungen) {
  const gefunden = []
  let eintraege
  try {
    eintraege = readdirSync(ordner, { withFileTypes: true })
  } catch {
    return gefunden
  }
  for (const eintrag of eintraege) {
    const pfad = join(ordner, eintrag.name)
    if (eintrag.isDirectory()) {
      if (UEBERSPRUNGENE_ORDNER.has(eintrag.name) || eintrag.name.startsWith('.')) continue
      gefunden.push(...sammleDateien(pfad, endungen))
    } else if (endungen.some((e) => eintrag.name.endsWith(e))) {
      gefunden.push(pfad)
    }
  }
  return gefunden
}

// Verzeichnis aller Dateinamen im Baum (ohne Ordner) -- fuer Verweise OHNE Schraegstrich.
// Ein Kommentar, der nur "settings-model.mjs" sagt, meint "die Datei, die so heisst"; wo
// sie liegt, sagt er bewusst nicht. Er verrottet erst, wenn es sie nirgends mehr gibt.
const namensverzeichnis = new Set()
for (const pfad of sammleDateien(WURZEL, ['.mjs', '.cjs', '.js', '.jsx', '.json', '.md', '.html', '.css', '.swift'])) {
  namensverzeichnis.add(basename(pfad))
}

function existiertDatei(pfad) {
  try {
    return statSync(pfad).isFile()
  } catch {
    return false
  }
}

// Loest einen genannten Pfad gegen die erlaubten Wurzeln auf. Gibt den gefundenen Pfad
// zurueck oder null.
function loeseAuf(kandidat, zusatzWurzel) {
  const wurzeln = [WURZEL, APP]
  if (zusatzWurzel) wurzeln.push(zusatzWurzel)
  for (const wurzel of wurzeln) {
    const versuch = resolve(wurzel, kandidat)
    if (existiertDatei(versuch)) return versuch
  }
  return null
}

// ---------------------------------------------------------------------------------------
// Quelle 1 und 2: die beiden JSON-Dateien
// ---------------------------------------------------------------------------------------

function pfadeAusJson(datei) {
  const text = readFileSync(datei, 'utf8')
  const daten = JSON.parse(text) // wirft, wenn die Datei kaputt ist -- das darf sie
  const flach = JSON.stringify(daten)
  const gefunden = new Map()
  for (const treffer of flach.match(PFADMUSTER) || []) {
    if (!gefunden.has(treffer)) gefunden.set(treffer, relative(WURZEL, datei).split(sep).join('/'))
  }
  return gefunden
}

// ---------------------------------------------------------------------------------------
// Quelle 3: Kommentarzeilen im Code
// ---------------------------------------------------------------------------------------

const KOMMENTAR_ORDNER = ['app/src', 'app/evals', 'app/test', 'tools']

function pfadeAusKommentaren() {
  const gefunden = new Map()
  for (const ordner of KOMMENTAR_ORDNER) {
    for (const datei of sammleDateien(join(WURZEL, ordner), ['.mjs', '.cjs', '.js'])) {
      const zeilen = readFileSync(datei, 'utf8').split('\n')
      zeilen.forEach((zeile, nummer) => {
        // Nur REINE Kommentarzeilen. Eine Zeile mit Code davor koennte einen Pfad in einem
        // Zeichenketten-Literal enthalten, der zur Laufzeit erst zusammengesetzt wird --
        // den kann ein Textscanner nicht ehrlich beurteilen.
        const getrimmt = zeile.trim()
        if (!getrimmt.startsWith('//')) return
        for (const treffer of getrimmt.slice(2).match(PFADMUSTER) || []) {
          const stelle = `${relative(WURZEL, datei).split(sep).join('/')}:${nummer + 1}`
          if (!gefunden.has(treffer)) gefunden.set(treffer, stelle)
        }
      })
    }
  }
  return gefunden
}

// ---------------------------------------------------------------------------------------
// Der Lauf
// ---------------------------------------------------------------------------------------

const quellen = [
  { name: 'app/evals/bindungen.json', pfade: pfadeAusJson(join(APP, 'evals/bindungen.json')), streng: true },
  { name: 'app/evals/v2-fertigzustand.json', pfade: pfadeAusJson(join(APP, 'evals/v2-fertigzustand.json')), streng: true },
  { name: 'Kommentare (app/src, app/evals, app/test, tools)', pfade: pfadeAusKommentaren(), streng: false },
]

const tote = []
let geprueft = 0
let uebersprungen = 0

for (const quelle of quellen) {
  for (const [kandidat, stelle] of quelle.pfade) {
    if (AUSNAHMEN.has(kandidat)) {
      uebersprungen += 1
      continue
    }
    geprueft += 1
    // Bei Kommentaren zaehlt zusaetzlich der Ordner der Datei selbst als Wurzel -- ein
    // Kommentar in app/src/ meint mit "agent-gateway.mjs" den Nachbarn.
    const zusatz = quelle.streng ? null : join(WURZEL, dirname(stelle.split(':')[0]))
    let gefunden = loeseAuf(kandidat, zusatz)
    // Ein Verweis ohne Schraegstrich nennt nur den Dateinamen. Er gilt als heil, solange
    // eine Datei dieses Namens irgendwo im Baum liegt.
    if (!gefunden && !quelle.streng && !kandidat.includes('/') && namensverzeichnis.has(kandidat)) {
      gefunden = kandidat
    }
    if (!gefunden) tote.push({ kandidat, stelle, quelle: quelle.name })
  }
}

console.log('Verweis-Waechter (W4) — zeigt jeder genannte Pfad auf eine echte Datei?\n')
for (const quelle of quellen) {
  console.log(`  ${String(quelle.pfade.size).padStart(4)} Pfade genannt in ${quelle.name}`)
}
console.log(`\n  ${geprueft} Pfade geprueft, ${uebersprungen} begruendet ausgenommen.\n`)

if (tote.length === 0) {
  console.log('GRUEN: Kein toter Verweis.')
  process.exit(0)
}

console.log(`ROT: ${tote.length} toter Verweis${tote.length === 1 ? '' : 'e'} — genannt, aber nicht vorhanden:\n`)
for (const t of tote) {
  console.log(`  ${t.kandidat}`)
  const woher = t.stelle.startsWith(t.quelle) ? t.stelle : `${t.stelle}  (${t.quelle})`
  console.log(`      genannt in ${woher}`)
}
console.log('\nEntweder die Datei ist weg (dann den Verweis nachziehen),')
console.log('oder der Verweis war nie richtig (dann ihn richtigstellen).')
process.exit(1)
