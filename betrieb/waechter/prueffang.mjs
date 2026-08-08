// W2 — der Prueffang-Waechter.
//
// Er prueft eine einzige Sache: Laeuft wirklich JEDE Pruefung, die im Ordner liegt?
//
// Warum das noetig ist: Ein Pruefstand, der schweigt, ist gefaehrlicher als gar keiner.
// Wenn beim Aufraeumen eine Pruefdatei in einen Unterordner wandert und das Muster im
// Startbefehl sie nicht mehr greift, dann wird nichts rot. Der Lauf meldet weiterhin
// "alles bestanden" — er hat die Datei nur nie angefasst. Das Gruen luegt, und niemand
// merkt es, bis der Fehler beim Nutzer ankommt.
//
// Also zaehlt dieser Waechter zweimal, aus zwei ganz verschiedenen Richtungen:
//   1. Aus dem DATEISYSTEM: was liegt unter app/test/? (rekursiv, also auch in
//      Unterordnern -- genau die Stelle, an der das flache Zaehlen blind wird)
//   2. Aus dem LAUF: welche Dateien hat "npm run test:unit" tatsaechlich abgearbeitet?
// Weichen die beiden Zahlen ab, ist er rot und nennt jede Datei, die durchs Netz faellt.
//
// Was er ausdruecklich NICHT beurteilt: ob die Pruefungen bestehen. Das misst "npm test",
// und es waere doppelt gemoppelt, es hier noch einmal zu bewerten. Dieser Waechter
// beantwortet die andere, leisere Frage -- ob ueberhaupt alles gemessen WURDE. Wieviele
// Pruefungen gerade gefallen sind, druckt er trotzdem mit; verschwiegen wird nichts.
//
// Wie er an die zweite Zahl kommt: Node kann dem Pruefstand einen eigenen
// Berichterstatter mitgeben (--test-reporter). Dieser Waechter IST sein eigener
// Berichterstatter -- er gibt sich selbst an den Lauf mit und liest hinterher die
// Zeilen, die er sich dabei selbst geschrieben hat. Darum stehen in dieser einen Datei
// zwei Rollen, sauber getrennt (siehe "Rolle 1" und "Rolle 2" weiter unten).

import { readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join, resolve, relative, sep } from 'node:path'

const WURZEL = fileURLToPath(new URL('../../', import.meta.url))
const APP = join(WURZEL, 'app')
const TESTORDNER = join(APP, 'test')
const ICH_SELBST = fileURLToPath(import.meta.url)

// Die zwei Marken, mit denen die Berichterstatter-Rolle der Waechter-Rolle zuruft.
// Sie stehen am Zeilenanfang und sind absichtlich haesslich: so verwechselt sie niemand
// mit gewoehnlicher Ausgabe des Pruefstands.
const MARKE_DATEI = 'PRUEFFANG-DATEI'
const MARKE_ZAHLEN = 'PRUEFFANG-ZAHLEN'

// Untergrenzen. Ohne sie waere der Waechter still gruen, wenn der ganze Ordner
// verschwaende: null gefunden, null gelaufen, die Zahlen stimmen ueberein. Die Werte
// liegen bewusst unter dem heutigen Stand (95 Einheits-, 14 Rauchpruefungen am
// 8.8.2026) -- sie sollen einen Einsturz melden, nicht jede einzelne geloeschte Datei.
const UNTERGRENZE_EINHEIT = 90
const UNTERGRENZE_RAUCH = 13

// =========================================================================================
// Rolle 1: der Berichterstatter
//
// Node laedt diese Datei ein zweites Mal, mitten im Pruefstand, und uebergibt ihr den
// Strom aller Ereignisse. Uns interessiert daran nur eins: welche DATEI gehoert zu
// jedem Ereignis. Am Ende gibt der Berichterstatter je eine Zeile pro Datei aus, dazu
// eine Zeile mit den bestandenen und gefallenen Pruefungen.
//
// Achtung auf die Pfadform: Node nennt dieselbe Datei mal absolut
// (/…/app/test/x.test.mjs), mal von app/ aus (test/x.test.mjs). Beides wird darum
// spaeter gegen app/ aufgeloest, sonst zaehlte man eine Datei doppelt.
// =========================================================================================

export default async function* fangBericht(quelle) {
  const dateien = new Set()
  let bestanden = 0
  let gefallen = 0

  for await (const ereignis of quelle) {
    const datei = ereignis?.data?.file
    if (typeof datei === 'string' && datei.length > 0) dateien.add(datei)
    if (ereignis.type === 'test:pass') bestanden += 1
    if (ereignis.type === 'test:fail') gefallen += 1
  }

  for (const datei of [...dateien].sort()) yield `${MARKE_DATEI} ${datei}\n`
  yield `${MARKE_ZAHLEN} ${bestanden} ${gefallen}\n`
}

// =========================================================================================
// Rolle 2: der Waechter
// =========================================================================================

// Alles unter app/test/, rekursiv. { recursive: true } gibt es seit Node 22; es liefert
// relative Pfade, unter Windows mit Rueckstrichen -- die werden gleich vereinheitlicht.
// Vorbild fuer das rekursive Lesen: app/test/lauf-tor-waechter.test.mjs:15-24.
function alleDateienImTestordner() {
  return readdirSync(TESTORDNER, { recursive: true })
    .map((name) => String(name).split('\\').join('/'))
    .filter((name) => name.endsWith('.mjs'))
    .filter((name) => {
      try {
        return statSync(join(TESTORDNER, name)).isFile()
      } catch {
        return false
      }
    })
    .sort()
}

// Die zwei Arten von Pruefungen, jede nach genau der Regel, nach der sie auch gestartet
// wird: die Einheitspruefungen nach der Endung, die Rauchpruefungen nach dem Wort
// "smoke" im Dateinamen (dieselbe Regel wie in app/scripts/rauchlauf.mjs).
function findePruefungen() {
  const alle = alleDateienImTestordner()
  return {
    einheit: alle.filter((name) => name.endsWith('.test.mjs')),
    rauch: alle.filter((name) => name.split('/').pop().includes('smoke')),
  }
}

// Startet den echten Befehl -- nicht eine Nachbildung davon. Der ganze Wert dieses
// Waechters haengt daran, dass hier "npm run test:unit" laeuft und nicht irgendein
// eigenes Muster: nur so faellt auf, wenn das Muster in app/package.json zu eng wird.
function laufeEinheitspruefungen() {
  const umgebung = { ...process.env }
  const bisher = umgebung.NODE_OPTIONS ? `${umgebung.NODE_OPTIONS} ` : ''
  umgebung.NODE_OPTIONS = `${bisher}--test-reporter=${ICH_SELBST}`

  const lauf = spawnSync('npm', ['run', 'test:unit'], {
    cwd: APP,
    env: umgebung,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })

  const ausgabe = `${lauf.stdout || ''}${lauf.stderr || ''}`
  const gelaufen = new Set()
  let bestanden = null
  let gefallen = null

  for (const zeile of ausgabe.split('\n')) {
    if (zeile.startsWith(`${MARKE_DATEI} `)) {
      // Beide Pfadformen (absolut und von app/ aus) auf denselben absoluten Pfad bringen.
      gelaufen.add(resolve(APP, zeile.slice(MARKE_DATEI.length + 1).trim()))
    } else if (zeile.startsWith(`${MARKE_ZAHLEN} `)) {
      const [a, b] = zeile.slice(MARKE_ZAHLEN.length + 1).trim().split(/\s+/).map(Number)
      bestanden = a
      gefallen = b
    }
  }

  return {
    ausgang: lauf.status === null ? 1 : lauf.status,
    gelaufen,
    bestanden,
    gefallen,
  }
}

function alsListe(pfade) {
  return [...pfade].map((p) => relative(APP, p).split(sep).join('/')).sort()
}

function hauptlauf() {
  console.log('Prueffang-Waechter (W2) — laeuft wirklich jede Pruefung, die im Ordner liegt?\n')

  const { einheit, rauch } = findePruefungen()
  console.log(`  ${String(einheit.length).padStart(4)} Einheitspruefungen (*.test.mjs) unter app/test/ gefunden`)
  console.log(`  ${String(rauch.length).padStart(4)} Rauchpruefungen (*smoke*.mjs) unter app/test/ gefunden\n`)

  const klagen = []

  if (einheit.length < UNTERGRENZE_EINHEIT) {
    klagen.push(
      `Nur ${einheit.length} Einheitspruefungen gefunden, erwartet waren mindestens ${UNTERGRENZE_EINHEIT}. ` +
        'Entweder ist etwas geloescht worden, oder app/test/ liegt nicht mehr dort, wo dieser Waechter sucht.',
    )
  }
  if (rauch.length < UNTERGRENZE_RAUCH) {
    klagen.push(
      `Nur ${rauch.length} Rauchpruefungen gefunden, erwartet waren mindestens ${UNTERGRENZE_RAUCH}.`,
    )
  }

  console.log('  Lauf: npm run test:unit (mit diesem Waechter als Berichterstatter)')
  const lauf = laufeEinheitspruefungen()
  console.log(
    `  ${lauf.gelaufen.size} Einheitspruefungen tatsaechlich abgearbeitet, ` +
      `${lauf.bestanden ?? '?'} bestanden, ${lauf.gefallen ?? '?'} gefallen.\n`,
  )

  if (lauf.bestanden === null) {
    klagen.push(
      'Der Lauf hat keine einzige Zeile des Berichterstatters geliefert. Damit ist die zweite ' +
        'Zahl gar nicht gemessen — und ein Waechter, der nicht messen kann, darf nicht gruen sein.',
    )
  }

  const gefundenAbsolut = new Set(einheit.map((name) => join(TESTORDNER, name)))
  const nichtGelaufen = alsListe([...gefundenAbsolut].filter((p) => !lauf.gelaufen.has(p)))
  const nichtGefunden = alsListe([...lauf.gelaufen].filter((p) => !gefundenAbsolut.has(p)))

  if (nichtGelaufen.length > 0) {
    klagen.push(
      `${nichtGelaufen.length} Pruefdatei(en) liegen im Ordner, wurden vom Lauf aber nie angefasst:\n` +
        nichtGelaufen.map((p) => `      ${p}`).join('\n') +
        '\n    Meist greift das Muster in app/package.json (test:unit) sie nicht mehr.',
    )
  }
  if (nichtGefunden.length > 0) {
    klagen.push(
      `${nichtGefunden.length} Datei(en) hat der Lauf abgearbeitet, die dieser Waechter nicht ` +
        `als Pruefung erkennt:\n` +
        nichtGefunden.map((p) => `      ${p}`).join('\n'),
    )
  }

  // Der Ausgang des Laufs gehoert nicht in das Urteil dieses Waechters (siehe Kopf der
  // Datei) -- aber er gehoert auf den Schirm, damit ihn niemand uebersieht.
  if (lauf.ausgang !== 0 || lauf.gefallen) {
    console.log(
      `  HINWEIS: Der Lauf selbst war rot (${lauf.gefallen ?? '?'} gefallen, Ausgang ${lauf.ausgang}). ` +
        'Das ist ein eigener Befund und Sache von "npm test" — dieser Waechter misst nur,\n' +
        '           ob alles gemessen wurde.\n',
    )
  }

  if (klagen.length === 0) {
    console.log(
      `GRUEN: ${einheit.length} gefunden, ${lauf.gelaufen.size} gelaufen — keine Pruefung faellt durchs Netz.`,
    )
    return 0
  }

  console.log(`ROT: ${klagen.length} Befund${klagen.length === 1 ? '' : 'e'}.\n`)
  for (const klage of klagen) console.log(`  - ${klage}`)
  return 1
}

// Nur wenn diese Datei als Programm gestartet wurde, laeuft der Waechter. Wird sie als
// Berichterstatter mitten in den Pruefstand geladen, steht hier bewusst nichts — sonst
// startete sie sich selbst in einer endlosen Kette.
const ALS_PROGRAMM =
  typeof process.argv[1] === 'string' && resolve(process.argv[1]) === ICH_SELBST

if (ALS_PROGRAMM) process.exit(hauptlauf())
