// Der Rauchlauf: startet alle Rauchtests unter app/test/ — jeden einzeln, jeden zu Ende.
//
// Warum es diese Datei gibt: vorher stand in package.json eine Shell-Schleife mit
// `|| exit 1`. Die brach beim ERSTEN roten Test ab und verdeckte alles Folgende —
// wer einen roten Test reparierte, fand dahinter den nächsten, und so fort. Man sah
// nie den ganzen Stand. Dieser Läufer startet jede Datei, AUCH WENN DIE VORIGE ROT
// WAR, und meldet am Ende eine Übersicht. Der Ausgang (exit code) ist trotzdem 1,
// sobald mindestens einer rot war — die Bau-Kette merkt den Fehler also weiterhin.
//
// DREI ZUSTÄNDE, NICHT ZWEI — nachgetragen am 09.08.2026:
// „Kaputt" und „hier nicht messbar" sind nicht dasselbe. test/etappe-d2-smoke.mjs prüft
// in zwei Browsern; in Chromium läuft er durch und meldet PASS, dann bricht er ab, weil
// Firefox auf dieser Maschine gar nicht installiert ist. Als das schlicht als ROT zählte,
// stand der Rauchlauf dauerhaft auf Rot — und ein Netz, das immer rot ist, sieht man nach
// einer Woche nicht mehr an. Genau dieselbe Überlegung steht in betrieb/waechter/verweise.mjs
// bei den Ausnahmen.
//
// Die Erkennung ist ABSICHTLICH eng: nur Playwrights eigene Meldung „Executable doesn't
// exist" für einen benannten Browser. Alles andere bleibt rot. Ein zu weiter Filter würde
// echte Fehler verschlucken, und das wäre schlimmer als das Problem, das er löst.
//
// Der Ausgang ist 0, wenn nur Unmessbares übrig ist — sonst wäre auf jeder Maschine ohne
// alle Browser jede Bau-Kette rot. Verschwiegen wird dabei nichts: Die Zahl steht in der
// Übersicht, mit dem Grund und dem Befehl, der die Lücke schließt.

import { readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// scripts/ liegt direkt unter app/ — von hier aus ein Verzeichnis nach oben ist die
// Wurzel, aus der die Rauchtests gestartet werden müssen (sie erwarten app/ als
// Arbeitsverzeichnis, genau wie die alte Shell-Schleife).
const APP_DIR = fileURLToPath(new URL('..', import.meta.url))
const TEST_DIR = fileURLToPath(new URL('../test/', import.meta.url))

// { recursive: true } (Node 22), damit ein künftiger Unterordner (z.B.
// app/test/etappe-e/neuer-smoke.mjs) nicht stillschweigend übergangen wird — ein
// flaches readdirSync würde Unterverzeichnisse und alles darin verschlucken.
// Vorbild: app/test/lauf-tor-waechter.test.mjs:15-24.
function findeRauchtests() {
  return readdirSync(TEST_DIR, { recursive: true })
    .map((name) => String(name).split('\\').join('/'))
    .filter((name) => name.endsWith('.mjs'))
    .filter((name) => name.split('/').pop().includes('smoke'))
    .sort()
}

const dateien = findeRauchtests()

if (dateien.length === 0) {
  console.error('Rauchlauf: keine Rauchtests unter app/test/ gefunden — das ist verdächtig.')
  process.exit(1)
}

console.log(`Rauchlauf: ${dateien.length} Rauchtests gefunden.\n`)

// Nur diese eine Meldung gilt als „nicht messbar". Playwright schreibt sie, wenn der
// Browser fehlt, den ein Test anfordert. Der Browsername wird mitgelesen, damit die
// Übersicht sagen kann, WELCHER fehlt.
const BROWSER_FEHLT = /Executable doesn't exist at\s+(\S*?(chromium|firefox|webkit)\S*)/i

function fehlenderBrowser(ausgabe) {
  const treffer = ausgabe.match(BROWSER_FEHLT)
  return treffer ? treffer[2].toLowerCase() : null
}

const gruen = []
const rot = []
const unmessbar = []

for (const datei of dateien) {
  const pfad = `test/${datei}`
  console.log(`— ${pfad}`)
  // 'pipe' statt 'inherit', weil der Ausgang allein nicht sagt, WARUM ein Test scheiterte.
  // Die Ausgabe wird unverändert weitergereicht — sie darf nicht verlorengehen.
  const lauf = spawnSync(process.execPath, [pfad], { cwd: APP_DIR, encoding: 'utf8' })
  const ausgabe = `${lauf.stdout ?? ''}${lauf.stderr ?? ''}`
  if (ausgabe.trim()) console.log(ausgabe.trimEnd())

  if (lauf.status === 0) {
    gruen.push(pfad)
    console.log(`  ✓ ${pfad}: grün\n`)
    continue
  }

  const browser = fehlenderBrowser(ausgabe)
  if (browser) {
    unmessbar.push({ pfad, browser })
    console.log(`  ~ ${pfad}: NICHT MESSBAR — ${browser} ist auf dieser Maschine nicht installiert\n`)
  } else {
    rot.push(pfad)
    console.log(`  ✗ ${pfad}: ROT (Ausgang ${lauf.status ?? lauf.signal})\n`)
  }
}

const unmessbarePfade = unmessbar.map((eintrag) => eintrag.pfad)

console.log('Übersicht der Rauchtests:')
for (const pfad of dateien.map((d) => `test/${d}`)) {
  let marke = 'grün'
  if (rot.includes(pfad)) marke = 'ROT '
  else if (unmessbarePfade.includes(pfad)) marke = '~   '
  console.log(`  ${marke}  ${pfad}`)
}
console.log(
  `\nRauchlauf-Übersicht: ${dateien.length} gesamt, ${gruen.length} grün, ${rot.length} rot, ${unmessbar.length} nicht messbar.`,
)

if (unmessbar.length > 0) {
  const browser = [...new Set(unmessbar.map((eintrag) => eintrag.browser))]
  console.log(`\nNicht messbar (nicht bestanden, aber auch nicht kaputt): ${unmessbarePfade.join(', ')}`)
  console.log(`  Grund: ${browser.join(' und ')} ${browser.length === 1 ? 'fehlt' : 'fehlen'} auf dieser Maschine.`)
  console.log(`  So wird die Lücke geschlossen:  npx playwright install ${browser.join(' ')}`)
  console.log('  Solange sie offen ist, ist dieser Teil der Oberfläche UNGEPRÜFT — nicht in Ordnung.')
}

if (rot.length > 0) {
  console.log(`\nRot waren: ${rot.join(', ')}`)
  process.exit(1)
}
