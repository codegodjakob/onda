// W8b — der Kopfkommentar-Waechter.
//
// Er prueft eine einzige Sache: Faengt jede .mjs-Datei unter app/src/ mit einem
// Kommentar an?
//
// Warum das ueberhaupt jemanden kuemmert: Wer wissen will, was eine Datei ist, hat zwei
// Moeglichkeiten. Entweder er schlaegt in einer zentralen Liste nach -- oder die Datei
// sagt es ihm selbst. Zentrale Listen verrotten, weil man sie beim Anlegen einer Datei
// vergisst und beim Loeschen erst recht. Die erste Zeile der Datei vergisst man nicht,
// weil man sie zwangslaeufig sieht, sobald man die Datei oeffnet. Darum steht die
// Auskunft dort und nirgends sonst.
//
// EHRLICH ZU SEINER GRENZE, damit niemand mehr erwartet als da ist: Dieser Waechter
// kauft ANWESENHEIT, nicht QUALITAET. Eine Zeile „// diese Datei macht Sachen" besteht
// ihn ohne weiteres. Er kann nicht lesen, ob der Satz stimmt, ob er noch stimmt, oder
// ob er ueberhaupt etwas sagt. Was er verhindert, ist genau ein Fall, und der ist
// haeufig genug: die Datei, die ohne ein Wort der Erklaerung neu dazukommt. Ob der Satz
// taugt, entscheidet ein Mensch beim Lesen des Pull Requests -- diese Grenze steht
// ebenso in KONVENTIONEN.md, damit sie nicht nur hier im Quelltext steht.
//
// Der Ordner wird REKURSIV gelesen ({ recursive: true }, Node 22). Ein Waechter, der nur
// die oberste Ebene sieht, ist an dem Tag blind, an dem jemand einen Unterordner anlegt
// -- und das ist genau der Tag, an dem man ihn braucht. Vorbild fuer das rekursive
// Lesen: betrieb/waechter/alle.mjs und betrieb/waechter/ort.mjs.
//
// Was hier ausdruecklich NICHT geprueft wird:
//   - .js-Dateien. Die fuenf aus der Zeit vor den Modulen (workspace.js, editor.js,
//     ui.js, example.js, block-identity.js) sind ein eigener Fall; hier geht es um die
//     Dateien, von denen es kuenftig mehr gibt.
//   - app/test/. Ein Test sagt durch seine Beschreibungen selbst, was er prueft.
//   - Die Laenge oder der Inhalt des Kommentars. Siehe oben: Anwesenheit, nicht Qualitaet.
//
// Als Kommentaranfang gilt // (Zeilenkommentar) oder /* (Blockkommentar), jeweils in der
// ersten Zeile, die nicht leer ist. Leerzeilen davor sind erlaubt und werden ueberlesen.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, relative, sep } from 'node:path'

const WURZEL = fileURLToPath(new URL('../../', import.meta.url))
const GEHUETETER_ORDNER = 'app/src'

// ---------------------------------------------------------------------------------------
// Die Dateien einsammeln
// ---------------------------------------------------------------------------------------

function findeDateien(ordner) {
  return readdirSync(ordner, { recursive: true })
    .map((name) => join(ordner, String(name)))
    .filter((pfad) => pfad.endsWith('.mjs'))
    .filter((pfad) => statSync(pfad).isFile())
    .sort()
}

// ---------------------------------------------------------------------------------------
// Die eine Frage je Datei
// ---------------------------------------------------------------------------------------

function ersteEchteZeile(text) {
  for (const zeile of text.split('\n')) {
    if (zeile.trim() === '') continue
    return zeile
  }
  return ''
}

function faengtMitKommentarAn(zeile) {
  const gestutzt = zeile.trimStart()
  return gestutzt.startsWith('//') || gestutzt.startsWith('/*')
}

// ---------------------------------------------------------------------------------------
// Pruefen
// ---------------------------------------------------------------------------------------

console.log('Kopfkommentar-Waechter (W8b) — sagt jede Datei selbst, was sie ist?\n')

const ordner = join(WURZEL, GEHUETETER_ORDNER)

if (!existsSync(ordner)) {
  console.log(`ROT: Den Ordner ${GEHUETETER_ORDNER}/ gibt es nicht.`)
  console.log('Entweder ist er umgezogen oder dieser Waechter sucht an der falschen Stelle.')
  process.exit(1)
}

const dateien = findeDateien(ordner)
const ohneKommentar = []

for (const pfad of dateien) {
  const zeile = ersteEchteZeile(readFileSync(pfad, 'utf8'))
  if (!faengtMitKommentarAn(zeile)) {
    ohneKommentar.push({
      name: `${GEHUETETER_ORDNER}/${relative(ordner, pfad).split(sep).join('/')}`,
      zeile: zeile.trim(),
    })
  }
}

console.log(
  `  ${GEHUETETER_ORDNER}/: ${dateien.length} .mjs-Dateien geprueft, ${ohneKommentar.length} ohne Kopfkommentar.\n`,
)

if (ohneKommentar.length === 0) {
  console.log('GRUEN: Jede .mjs-Datei unter app/src/ faengt mit einem Kommentar an.')
  console.log('(Anwesenheit, nicht Qualitaet — ob der Satz etwas taugt, sieht nur ein Mensch.)')
  process.exit(0)
}

console.log(
  `ROT: ${ohneKommentar.length} Datei${ohneKommentar.length === 1 ? ' faengt' : 'en fangen'} nicht mit einem Kommentar an:\n`,
)

for (const befund of ohneKommentar) {
  console.log(`  ${befund.name}`)
  console.log(`      erste Zeile: ${befund.zeile === '' ? '(die Datei ist leer)' : befund.zeile}`)
}

console.log('\nSo wird es wieder gruen: ganz oben in die genannte Datei einen Kommentar setzen,')
console.log('der in zwei bis drei Saetzen sagt, WAS die Datei ist und WARUM es sie gibt. Kein')
console.log('Aufsatz — der naechste Leser soll nach der ersten Zeile wissen, ob er hier richtig ist.')

process.exit(1)
