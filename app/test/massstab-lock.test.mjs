// Der Massstab und seine Sperrdatei muessen dasselbe sagen.
//
// evals/massstab.lock.json ist das Mass, an dem der Fertigzustand gemessen wird:
// der Katalog samt Bindungen, so wie er gelten soll. Die Datei wird von Hand
// gepflegt. Wer den Katalog (evals/v2-fertigzustand.json) oder die Bindungen
// (evals/bindungen.json) aendert und die Sperrdatei vergisst, aendert stillschweigend
// das Mass — genau das soll hier rot werden, damit die Aenderung eine Entscheidung
// bleibt und kein Nebeneffekt.
//
// Der Lauf selbst (evals/run-fertigzustand.mjs) meldet dieselbe Abweichung als
// Abschnitt „Massstab geaendert"; er kostet aber Geld und Zeit. Diese Pruefung
// kostet nichts und laeuft bei jedem Testlauf mit.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ladeEvalKatalog } from '../evals/lib/eval-catalog.mjs'
import {
  formatiereMassstabAenderungen,
  massstabSchnappschuss,
  vergleicheMassstab,
} from '../evals/lib/massstab-waechter.mjs'

const appWurzel = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sperrPfad = resolve(appWurzel, 'evals/massstab.lock.json')
const katalogPfad = resolve(appWurzel, 'evals/v2-fertigzustand.json')
const bindungsPfad = resolve(appWurzel, 'evals/bindungen.json')

const sperre = JSON.parse(await readFile(sperrPfad, 'utf8'))
const katalog = await ladeEvalKatalog(katalogPfad)
const { bindungen } = JSON.parse(await readFile(bindungsPfad, 'utf8'))
const heute = massstabSchnappschuss(katalog, bindungen)

test('die Sperrdatei beschreibt denselben Massstab wie Katalog und Bindungen', () => {
  const aenderungen = vergleicheMassstab(sperre, heute)
  assert.notEqual(aenderungen, null, 'evals/massstab.lock.json ist leer oder kein Objekt')
  assert.deepEqual(
    aenderungen,
    [],
    'Katalog oder Bindungen wurden geaendert, die Sperrdatei nicht. Abweichungen:\n  · '
      + formatiereMassstabAenderungen(aenderungen).join('\n  · ')
      + '\nWenn die Aenderung gewollt ist: evals/massstab.lock.json von Hand nachziehen.',
  )
})

test('der Katalog hat den Umfang, den die Sperrdatei festhaelt', () => {
  // Die Zahlen stehen ausgeschrieben da, damit ein Schwund auffaellt, auch wenn
  // jemand Sperrdatei und Katalog gemeinsam schrumpfen laesst.
  assert.equal(katalog.suites.length, 19, 'Der Katalog hat nicht mehr 19 Suiten')
  const kriterien = katalog.suites.reduce((summe, suite) => summe + suite.evals.length, 0)
  assert.equal(kriterien, 152, 'Der Katalog hat nicht mehr 152 Kriterien')
  assert.equal(Object.keys(sperre.evals).length, kriterien)
})

test('jede Bindung der Sperrdatei gehoert zu einem Kriterium des Katalogs', () => {
  const ids = new Set(katalog.suites.flatMap(suite => suite.evals.map(eintrag => eintrag.id)))
  const verwaist = Object.keys(sperre.bindungen).filter(id => !ids.has(id))
  assert.deepEqual(verwaist, [], `Bindungen ohne Kriterium im Katalog: ${verwaist.join(', ')}`)
  assert.equal(Object.keys(sperre.bindungen).length, Object.keys(bindungen).length)
})

test('die Sperrdatei sagt, wozu sie da ist und wann sie gesetzt wurde', () => {
  assert.match(sperre._zweck || '', /Massstab/i)
  assert.match(sperre._gesetztAm || '', /^\d{4}-\d{2}-\d{2}$/)
})
