// Der Sammler: fuehrt JEDEN Waechter unter betrieb/waechter/ aus und meldet eine Uebersicht.
//
// Der Punkt der ganzen Datei: Ein neuer Waechter ist eine neue DATEI, kein Eintrag in einer
// Liste. Listen, in die man sich eintragen muss, sind Listen, die man zu ergaenzen vergisst
// -- und ein vergessener Waechter ist schlimmer als keiner, weil das Gruen dann luegt.
//
// Darum wird der Ordner mit { recursive: true } gelesen (Node 22): auch ein kuenftiger
// Unterordner (betrieb/waechter/daten/xyz.mjs) wird gefunden. Vorbild fuer das rekursive
// Lesen: app/test/lauf-tor-waechter.test.mjs:15-24.
//
// Rot ist ansteckend: endet auch nur EIN Waechter mit einem Fehler, endet dieser Sammler
// mit 1. Aber er bricht nicht ab -- jeder Waechter laeuft, damit man alle Befunde auf
// einmal sieht statt einen nach dem anderen.
import { readdirSync, statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join, relative, sep } from 'node:path'

const HIER = fileURLToPath(new URL('.', import.meta.url))
const WURZEL = fileURLToPath(new URL('../../', import.meta.url))
const ICH_SELBST = fileURLToPath(import.meta.url)

function findeWaechter() {
  return readdirSync(HIER, { recursive: true })
    .map((name) => join(HIER, String(name)))
    .filter((pfad) => pfad.endsWith('.mjs'))
    .filter((pfad) => pfad !== ICH_SELBST)
    .filter((pfad) => statSync(pfad).isFile())
    .sort()
}

const waechter = findeWaechter()

if (waechter.length === 0) {
  console.log('Keine Waechter gefunden unter betrieb/waechter/ — nichts zu pruefen.')
  process.exit(0)
}

console.log(`${waechter.length} Waechter gefunden. Ich fuehre sie der Reihe nach aus.\n`)

const ergebnisse = []

for (const pfad of waechter) {
  const name = relative(HIER, pfad).split(sep).join('/')
  console.log(`--- ${name} ${'-'.repeat(Math.max(0, 60 - name.length))}`)
  const lauf = spawnSync(process.execPath, [pfad], { cwd: WURZEL, stdio: 'inherit' })
  const code = lauf.status === null ? 1 : lauf.status
  ergebnisse.push({ name, code })
  console.log('')
}

const rote = ergebnisse.filter((e) => e.code !== 0)

console.log('='.repeat(64))
console.log('UEBERSICHT')
for (const e of ergebnisse) {
  console.log(`  ${e.code === 0 ? 'gruen' : 'ROT  '}  ${e.name}`)
}
console.log(
  `${ergebnisse.length} Waechter: ${ergebnisse.length - rote.length} gruen, ${rote.length} rot.`,
)

process.exit(rote.length === 0 ? 0 : 1)
