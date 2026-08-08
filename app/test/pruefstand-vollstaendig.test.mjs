// Ist der Prüfstand vollständig? — dieselbe Zählung wie der Prüffang-Wächter (W2),
// nur als gewöhnliche Prüfung, damit sie bei jedem „npm test" von selbst mitläuft.
//
// Die Gefahr, gegen die das hier steht: Beim Aufräumen wandert eine Prüfdatei in einen
// Unterordner, und der Startbefehl greift sie nicht mehr. Dann wird nichts rot — der
// Lauf meldet weiterhin „alles bestanden", er hat die Datei nur nie angefasst. Ein
// Prüfstand, der schweigt, ist gefährlicher als gar keiner.
//
// Der Wächter unter betrieb/waechter/prueffang.mjs beantwortet das von außen: er startet
// den Lauf und schaut nach, welche Dateien wirklich drankamen. Diese Prüfung hier
// beantwortet dieselbe Frage von innen und ohne den Lauf noch einmal zu starten — täte
// sie das, startete sie sich selbst in einer endlosen Kette. Statt zu messen, rechnet
// sie nach: greift das Muster aus app/package.json jede Datei, die im Ordner liegt?

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const TEST_DIR = fileURLToPath(new URL('./', import.meta.url))
const APP_DIR = fileURLToPath(new URL('../', import.meta.url))

// Untergrenzen. Ohne sie wäre diese Prüfung still grün, wenn der ganze Ordner
// verschwände: null Dateien gefunden, null Dateien unerfasst, alles in Ordnung. Die
// Werte liegen bewusst unter dem Stand vom 8. August 2026 (95 Einheits-, 14
// Rauchprüfungen) — sie sollen einen Einsturz melden, nicht jede einzelne Datei.
const UNTERGRENZE_EINHEIT = 90
const UNTERGRENZE_RAUCH = 13

// { recursive: true } (Node 22): liefert auch, was in Unterordnern liegt. Genau dort
// wird ein flaches Lesen blind, und genau dorthin verschieben Aufräumarbeiten Dateien.
function alleDateien() {
  return readdirSync(TEST_DIR, { recursive: true })
    .map(name => String(name).split('\\').join('/'))
    .filter(name => name.endsWith('.mjs'))
    .filter(name => {
      try {
        return statSync(join(TEST_DIR, name)).isFile()
      } catch {
        return false
      }
    })
    .sort()
}

function skripte() {
  return JSON.parse(readFileSync(join(APP_DIR, 'package.json'), 'utf8')).scripts || {}
}

// Übersetzt ein Dateimuster in eine Regel. Zwei Sternchen samt Schrägstrich stehen für
// „beliebig viele Ordner dazwischen", ein einzelnes Sternchen für „beliebiger Name,
// aber kein Ordnerwechsel". Genau diese Unterscheidung ist die Falle: ohne die zwei
// Sternchen reicht das Muster nur eine Ebene tief.
function musterZuRegel(muster) {
  const uebersetzt = muster
    .split('**/')
    .map(teil => teil.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*'))
    .join('(?:.*/)?')
  return new RegExp(`^${uebersetzt}$`)
}

test('Jede Einheitsprüfung im Ordner wird vom Muster in app/package.json erfasst', () => {
  const befehl = skripte()['test:unit']
  assert.ok(befehl, 'In app/package.json gibt es kein Skript test:unit mehr')

  // In Anführungszeichen, sonst löst die Kommandozeile das Muster selbst auf — und die
  // löst es flach auf, eine Ebene tief. Der Unterschied ist unsichtbar und tödlich.
  const muster = befehl.match(/"([^"]+)"/)?.[1]
  assert.ok(muster, `Das Dateimuster in test:unit steht ohne Anführungszeichen: ${befehl}`)

  const regel = musterZuRegel(muster)
  const einheit = alleDateien().filter(name => name.endsWith('.test.mjs'))

  assert.ok(einheit.length >= UNTERGRENZE_EINHEIT,
    `Nur ${einheit.length} Einheitsprüfungen unter app/test/ gefunden, erwartet waren `
    + `mindestens ${UNTERGRENZE_EINHEIT}.`)

  const unerfasst = einheit.filter(name => !regel.test(`test/${name}`))
  assert.deepEqual(unerfasst, [],
    `Diese Prüfdateien liegen im Ordner, aber das Muster ${muster} greift sie nicht — `
    + 'sie laufen nie und niemand merkt es.')
})

test('Jede Rauchprüfung im Ordner wird vom Rauchlauf gefunden', () => {
  const befehl = skripte()['test:smoke']
  assert.ok(befehl, 'In app/package.json gibt es kein Skript test:smoke mehr')
  assert.match(befehl, /rauchlauf\.mjs/,
    `test:smoke startet nicht mehr den Rauchlauf, sondern: ${befehl}`)

  // Der Rauchlauf muss selbst rekursiv suchen, sonst verschluckt er Unterordner.
  const rauchlauf = readFileSync(join(APP_DIR, 'scripts/rauchlauf.mjs'), 'utf8')
  assert.match(rauchlauf, /recursive:\s*true/,
    'app/scripts/rauchlauf.mjs liest den Prüfordner wieder flach')

  // Dieselbe Regel, nach der der Rauchlauf startet: eine .mjs-Datei, deren Name das
  // Wort smoke enthält.
  const rauch = alleDateien().filter(name => name.split('/').pop().includes('smoke'))
  assert.ok(rauch.length >= UNTERGRENZE_RAUCH,
    `Nur ${rauch.length} Rauchprüfungen unter app/test/ gefunden, erwartet waren `
    + `mindestens ${UNTERGRENZE_RAUCH}.`)
})
