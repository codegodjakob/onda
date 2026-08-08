// Der Rauchlauf: startet alle Rauchtests unter app/test/ — jeden einzeln, jeden zu Ende.
//
// Warum es diese Datei gibt: vorher stand in package.json eine Shell-Schleife mit
// `|| exit 1`. Die brach beim ERSTEN roten Test ab und verdeckte alles Folgende —
// wer einen roten Test reparierte, fand dahinter den nächsten, und so fort. Man sah
// nie den ganzen Stand. Dieser Läufer startet jede Datei, AUCH WENN DIE VORIGE ROT
// WAR, und meldet am Ende eine Übersicht. Der Ausgang (exit code) ist trotzdem 1,
// sobald mindestens einer rot war — die Bau-Kette merkt den Fehler also weiterhin.

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

const gruen = []
const rot = []

for (const datei of dateien) {
  const pfad = `test/${datei}`
  console.log(`— ${pfad}`)
  const lauf = spawnSync(process.execPath, [pfad], { cwd: APP_DIR, stdio: 'inherit' })
  const bestanden = lauf.status === 0
  if (bestanden) {
    gruen.push(pfad)
    console.log(`  ✓ ${pfad}: grün\n`)
  } else {
    rot.push(pfad)
    console.log(`  ✗ ${pfad}: ROT (Ausgang ${lauf.status ?? lauf.signal})\n`)
  }
}

console.log('Übersicht der Rauchtests:')
for (const pfad of dateien.map((d) => `test/${d}`)) {
  console.log(`  ${rot.includes(pfad) ? 'ROT ' : 'grün'}  ${pfad}`)
}
console.log(`\nRauchlauf-Übersicht: ${dateien.length} gesamt, ${gruen.length} grün, ${rot.length} rot.`)

if (rot.length > 0) {
  console.log(`Rot waren: ${rot.join(', ')}`)
  process.exit(1)
}
