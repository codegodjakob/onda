// W9 — der Import-Sortierungs-Waechter.
//
// Er prueft eine einzige Sache: Steht der Importblock von app/src/workspace.js
// alphabetisch nach Modulpfad?
//
// Warum das ueberhaupt jemanden kuemmert: workspace.js ist mit rund 5.800 Zeilen die
// groesste Datei des Projekts, aber die Stelle, an der zwei gleichzeitig arbeitende
// Agenten aufeinanderprallen, sind nicht die 5.800 Zeilen -- es sind die ersten 147.
// Dort liegen 41 import-Anweisungen, an denen JEDER neue Baustein vorbeimuss. Wuchsen
// sie wie frueher der Reihe nach an, haengte jeder neue Import seine Zeile ans selbe
// Ende. Zwei Agenten, die am selben Tag je einen Baustein anschliessen, schreiben dann
// zwei verschiedene Zeilen an dieselbe Stelle -- und genau das kann git nicht von
// allein aufloesen, das muss ein Mensch von Hand entwirren.
//
// Sortiert liegt die Nachbarschaft nicht mehr am Zeitpunkt, sondern am Namen. Wer
// „quellen-typ" anschliesst, landet bei den Quellen; wer „audit-panel" anschliesst,
// landet weit oben bei den A's. Das ist kein Ordnungssinn, das ist Konfliktvermeidung.
//
// Ehrlich dazu, damit niemand mehr erwartet als da ist: Es entschaerft die Nachbarschaft,
// es beseitigt sie nicht. Zwei Agenten, die beide etwas mit „quellen-" anlegen, landen
// weiterhin auf benachbarten Zeilen. Der Waechter macht den Zufall zur Regel, mehr nicht.
//
// Was hier ausdruecklich NICHT geprueft wird:
//   - Andere Dateien. workspace.js ist die einzige mit einem Importblock dieser Groesse;
//     die uebrigen haben fuenf bis zehn Importe, da ist nichts zu kollidieren. Waechst
//     eine zweite Datei in diese Groessenordnung, gehoert sie unten in GEHUETET dazu.
//   - Ob die Importe sinnvoll sind, ob sie benutzt werden, ob sie doppelt sind. Das
//     sieht der Bauschritt (npm run build) besser.
//
// Die Sortierregel, in Worten: verglichen wird der Pfad in den Anfuehrungszeichen, Zeichen
// fuer Zeichen, aufsteigend. Ein Punkt (.) steht im Zeichensatz vor einem Klammeraffen (@),
// darum stehen die eigenen Dateien (./…) vor den Fremdpaketen (@tiptap/…). Das ist keine
// Geschmacksfrage, sondern die einfachste Regel, die man ohne Nachschlagen anwenden kann.
//
// Ein Kommentar ueber einem Import gehoert zu diesem Import und wandert mit ihm mit.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const WURZEL = fileURLToPath(new URL('../../', import.meta.url))

// Die gehueteten Dateien. Jede mit dem Grund, warum ihr Importblock gross genug ist,
// um eine Kollisionsstelle zu sein.
const GEHUETET = [
  {
    pfad: 'app/src/workspace.js',
    grund: '41 Importe, die groesste Datei des Projekts — die Stelle, an der jeder neue Baustein vorbeimuss.',
  },
]

// ---------------------------------------------------------------------------------------
// Den Importblock lesen: von der ersten import-Zeile bis zur ersten Zeile, die weder
// Kommentar noch leer noch Teil eines Imports ist.
// ---------------------------------------------------------------------------------------

function leseImportblock(text) {
  const zeilen = text.split('\n')
  let i = 0
  while (i < zeilen.length && !/^import\b/.test(zeilen[i])) i++

  const pfade = []
  let offen = false

  for (; i < zeilen.length; i++) {
    const zeile = zeilen[i]
    if (!offen) {
      if (zeile.trim() === '') continue
      if (/^\s*\/\//.test(zeile)) continue // Kommentar gehoert zum naechsten Import
      if (!/^import\b/.test(zeile)) break // hier hoert der Importblock auf
      offen = true
    }
    const treffer = zeile.match(/from\s+['"]([^'"]+)['"]/) || zeile.match(/^import\s+['"]([^'"]+)['"]/)
    if (treffer) {
      pfade.push({ pfad: treffer[1], zeile: i + 1 })
      offen = false
    }
  }

  return pfade
}

// ---------------------------------------------------------------------------------------
// Pruefen
// ---------------------------------------------------------------------------------------

console.log('Import-Sortierungs-Waechter (W9) — stehen die Importe alphabetisch?\n')

const befunde = []

for (const datei of GEHUETET) {
  let text
  try {
    text = readFileSync(join(WURZEL, datei.pfad), 'utf8')
  } catch (fehler) {
    befunde.push({ pfad: datei.pfad, art: 'fehlt', text: String(fehler.message) })
    continue
  }

  const pfade = leseImportblock(text)

  if (pfade.length === 0) {
    befunde.push({
      pfad: datei.pfad,
      art: 'leer',
      text: 'Kein Importblock gefunden. Entweder ist die Datei umgebaut worden oder der Waechter liest falsch.',
    })
    continue
  }

  const brueche = []
  for (let k = 1; k < pfade.length; k++) {
    if (pfade[k - 1].pfad > pfade[k].pfad) {
      brueche.push({ vorher: pfade[k - 1], nachher: pfade[k] })
    }
  }

  console.log(`  ${datei.pfad}: ${pfade.length} Importe geprueft, ${brueche.length} an falscher Stelle.`)

  if (brueche.length > 0) befunde.push({ pfad: datei.pfad, art: 'unsortiert', brueche })
}

console.log('')

if (befunde.length === 0) {
  console.log('GRUEN: Jeder gehuetete Importblock steht alphabetisch nach Modulpfad.')
  process.exit(0)
}

for (const befund of befunde) {
  if (befund.art === 'unsortiert') {
    console.log(`ROT: ${befund.pfad} — ${befund.brueche.length} Import${befund.brueche.length === 1 ? ' steht' : 'e stehen'} an der falschen Stelle:\n`)
    for (const bruch of befund.brueche) {
      console.log(`  Zeile ${bruch.nachher.zeile}: '${bruch.nachher.pfad}'`)
      console.log(`      gehoert VOR Zeile ${bruch.vorher.zeile}: '${bruch.vorher.pfad}'`)
    }
    console.log('\nSo wird es wieder gruen: die genannte import-Anweisung (samt einem etwaigen')
    console.log('Kommentar darueber) ausschneiden und dort einsetzen, wo ihr Pfad alphabetisch hingehoert.')
  } else {
    console.log(`ROT: ${befund.pfad} — ${befund.text}`)
  }
  console.log('')
}

process.exit(1)
