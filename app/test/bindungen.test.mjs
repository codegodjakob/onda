// Der Wächter über die Bindungen — jedes Eval hat genau einen Weg, und keiner ist stumm.
//
// Der Anlass: Ein Eval ohne gebundene Prüfung fällt im Fertigzustand-Lauf auf „nicht
// bestanden". Das ist richtig so. Falsch wäre nur, wenn niemand SAGT, warum es keine
// Prüfung gibt. Genau dieser Unterschied trägt die vier Suiten SELF, GROW, DIVERGE und
// GENRE: Sie messen Zusagen, deren Messobjekt im Programm steht, deren Datenbasis aber
// noch fehlt. Solche Einträge sind bewusst rot — und bewusst heißt: mit ausgeschriebenem
// Grund, der das vorhandene Messobjekt benennt und das Fehlende dazu.
//
// Drei Wege gibt es, mehr nicht:
//   1. gebunden        — eine Prüfdatei urteilt in jedem Lauf frisch darüber,
//   2. externes Gate   — kein Programm kann den Beleg erzeugen (Live-Zugang, Nutzerantwort),
//   3. ohne Datenbasis — das Messobjekt steht, die Daten fehlen; rot, mit Begründung.
//
// Ein vierter Weg wäre das stille Ungebundene: rot ohne Wort. Den schließt dieser Test.

import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { flattenEvals, ladeEvalKatalog } from '../src/eval-catalog.mjs'

const appWurzel = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const katalog = await ladeEvalKatalog(resolve(appWurzel, 'evals/v2-fertigzustand.json'))
const bindungsDatei = JSON.parse(await readFile(resolve(appWurzel, 'evals/bindungen.json'), 'utf8'))

const alleIds = flattenEvals(katalog).map(eintrag => eintrag.id)
const gebunden = new Set(Object.keys(bindungsDatei.bindungen))
const ohneDatenbasis = new Set(Object.keys(bindungsDatei._ungebunden_begruendung))
const liveGates = new Set(katalog.externalLiveGateIds)

test('jedes Eval hat genau einen Weg: gebunden, externes Gate oder ausgeschrieben ohne Datenbasis', () => {
  const stumm = []
  const doppelt = []
  for (const id of alleIds) {
    const wege = [gebunden.has(id), liveGates.has(id), ohneDatenbasis.has(id)].filter(Boolean).length
    if (wege === 0) stumm.push(id)
    if (wege > 1) doppelt.push(id)
  }
  assert.deepEqual(stumm, [], 'Diese Evals wären rot, ohne dass jemand sagt warum. Bindung, Live-Gate oder Begründung eintragen.')
  assert.deepEqual(doppelt, [], 'Diese Evals stehen auf zwei Wegen zugleich — welcher gilt, wäre dann Auslegungssache.')
})

test('keine Bindung und keine Begründung zeigt auf ein Eval, das es nicht gibt', () => {
  const bekannt = new Set(alleIds)
  assert.deepEqual(Object.keys(bindungsDatei.bindungen).filter(id => !bekannt.has(id)), [])
  assert.deepEqual(Object.keys(bindungsDatei._ungebunden_begruendung).filter(id => !bekannt.has(id)), [])
  assert.deepEqual(Object.keys(bindungsDatei._live_gates).filter(id => !bekannt.has(id)), [])
})

test('jede gebundene Prüfdatei liegt wirklich da', async () => {
  const dateien = [...new Set(Object.values(bindungsDatei.bindungen).flat())]
  for (const datei of dateien) {
    await access(resolve(appWurzel, datei))
  }
})

// Warum eine Mindestlänge und Pflichtwörter: „noch offen" erklärt nichts. Wer eine
// Zusage bewusst rot führt, schuldet zwei Angaben — was heute schon da ist (das
// Messobjekt) und was genau fehlt. Ohne beides wäre der rote Eintrag eine Absichts-
// erklärung, und Absichtserklärungen sind das, wogegen dieser Katalog gebaut ist.
test('jede Begründung ohne Datenbasis nennt Messobjekt und Fehlendes', () => {
  for (const [id, grund] of Object.entries(bindungsDatei._ungebunden_begruendung)) {
    assert.match(grund, /^Noch ohne Datenbasis\./, `${id}: die Begründung muss mit „Noch ohne Datenbasis." beginnen`)
    assert.match(grund, /Messobjekt steht/, `${id}: die Begründung muss das vorhandene Messobjekt benennen`)
    assert.match(grund, /Was fehlt/, `${id}: die Begründung muss benennen, was fehlt`)
    assert.ok(grund.length >= 200, `${id}: die Begründung ist zu knapp, um beides zu tragen`)
  }
})

test('jedes externe Live-Gate ist begründet, und jede Begründung gehört zu einem', () => {
  for (const id of liveGates) {
    assert.ok(bindungsDatei._live_gates[id], `Live-Gate ${id} ohne Begründung`)
    // Niedrigere Latte als bei „ohne Datenbasis": Ein externes Gate muss nur sagen, welcher
    // Zustand fehlt, nicht was noch zu bauen wäre. „Nutzerstudie mit echten Leserinnen und
    // Lesern — von niemandem automatisierbar." ist vollständig und darf kurz bleiben.
    assert.ok(bindungsDatei._live_gates[id].length >= 40, `Live-Gate ${id}: die Begründung ist zu knapp`)
  }
  assert.deepEqual(Object.keys(bindungsDatei._live_gates).filter(id => !liveGates.has(id)), [])
})

// Der Zweck der vier neuen Suiten in einer Zeile: Sie sollen messen, was noch nicht
// gemessen wird. Wären sie alle gebunden und grün, hätten sie nichts hinzugefügt —
// wären sie alle rot, stünde kein einziges Messobjekt. Beides wäre ein Fehler, und
// beides fiele ohne diesen Test niemandem auf.
test('die vier Mess-Suiten stehen im Katalog und tragen echte Messobjekte', () => {
  const suiten = Object.fromEntries(katalog.suites.map(suite => [suite.id, suite.evals.map(e => e.id)]))
  for (const id of ['SELF', 'GROW', 'DIVERGE', 'GENRE']) {
    assert.ok(suiten[id], `Suite ${id} fehlt`)
    assert.ok(suiten[id].length >= 2, `Suite ${id} braucht mindestens zwei Einträge`)
  }
  const neue = ['SELF', 'GROW', 'DIVERGE', 'GENRE'].flatMap(id => suiten[id])
  assert.ok(neue.some(id => gebunden.has(id)), 'Keine der vier Suiten misst irgendetwas — dann fehlt das Messobjekt, nicht nur die Datenbasis.')
})
