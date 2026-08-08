import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile as execFileCallback } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import {
  flattenEvals,
  ladeEvalKatalog,
  summarisiereEvalKatalog,
  validiereEvalKatalog,
  validiereEvalErgebnisse,
} from '../evals/lib/eval-catalog.mjs'

const KATALOG_PFAD = fileURLToPath(new URL('../evals/v2-fertigzustand.json', import.meta.url))
const CLI_PFAD = fileURLToPath(new URL('../evals/run-v2-evals.mjs', import.meta.url))
const execFile = promisify(execFileCallback)
const EXTERNE_LIVE_GATES = [
  'INV-06',
  'EFFECT-06',
  'SYSTEM-03',
  'SYSTEM-09',
  'ONDA-UI-18',
]

test('V2-Eval-Katalog lädt reproduzierbar und enthält den vollständigen Zielumfang', async () => {
  const katalog = await ladeEvalKatalog(KATALOG_PFAD)
  const zusammenfassung = summarisiereEvalKatalog(katalog)

  assert.deepEqual(zusammenfassung, {
    suites: 19,
    evals: 152,
    hardGates: 144,
    scoredGates: 8,
    externalLiveGates: 5,
  })
  assert.equal(flattenEvals(katalog).length, 152)
})

test('V2-Eval-Katalog erfüllt alle Struktur- und Konsistenzregeln', async () => {
  const katalog = await ladeEvalKatalog(KATALOG_PFAD)
  assert.deepEqual(validiereEvalKatalog(katalog), [])
})

test('alle Eval-IDs sind eindeutig und gehören zur umgebenden Suite', async () => {
  const katalog = await ladeEvalKatalog(KATALOG_PFAD)
  const evals = flattenEvals(katalog)
  const ids = evals.map(eintrag => eintrag.id)

  assert.equal(new Set(ids).size, ids.length)
  for (const suite of katalog.suites) {
    for (const eintrag of suite.evals) {
      assert.match(eintrag.id, new RegExp(`^${suite.id}-\\d{2}$`))
    }
  }
})

test('alle 22 Onda-UI-Abnahmekriterien sind harte Katalog-Gates', async () => {
  const katalog = await ladeEvalKatalog(KATALOG_PFAD)
  const gates = flattenEvals(katalog).filter(eintrag => eintrag.id.startsWith('ONDA-UI-'))
  assert.deepEqual(
    gates.map(eintrag => eintrag.id),
    Array.from({ length: 22 }, (_, index) => `ONDA-UI-${String(index + 1).padStart(2, '0')}`),
  )
  assert.ok(gates.every(eintrag => (
    eintrag.gate === 'hard'
    && eintrag.automation
    && eintrag.evidence.length
    && eintrag.source.length
  )))
})

test('Rubrikgewichte ergeben exakt 1 und externe Live-Gates sind explizit bekannt', async () => {
  const katalog = await ladeEvalKatalog(KATALOG_PFAD)
  const gewicht = katalog.rubric.reduce((summe, dimension) => summe + dimension.weight, 0)

  assert.equal(gewicht, 1)
  assert.deepEqual(katalog.externalLiveGateIds, EXTERNE_LIVE_GATES)
  const alleIds = new Set(flattenEvals(katalog).map(eintrag => eintrag.id))
  EXTERNE_LIVE_GATES.forEach(id => assert.ok(alleIds.has(id), `externes Live-Gate ${id} fehlt`))
})

test('der rohe JSON-Katalog enthält keine doppelten Given/When/Then-Schlüssel in einem Eval', async () => {
  const roh = await readFile(KATALOG_PFAD, 'utf8')
  const evalObjekte = roh.split(/\n        \{\n          "id": "/).slice(1)

  assert.equal(evalObjekte.length, 152)
  for (const [index, ausschnitt] of evalObjekte.entries()) {
    const objekt = ausschnitt.split(/\n        \}(?:,|\n)/, 1)[0]
    for (const schluessel of ['given', 'when', 'then']) {
      const treffer = objekt.match(new RegExp(`"${schluessel}":`, 'g')) || []
      assert.equal(treffer.length, 1, `Eval ${index + 1} enthält ${treffer.length}× "${schluessel}"`)
    }
  }
})

test('Eval-Ergebnisse verlangen genau einen ehrlichen Status pro Katalog-Eval', async () => {
  const katalog = await ladeEvalKatalog(KATALOG_PFAD)
  const ergebnis = {
    schemaVersion: 1,
    catalogVersion: katalog.catalogVersion,
    stage: 'A',
    iteration: 1,
    generatedAt: '2026-07-30T13:00:00.000Z',
    gitCommit: 'abc1234',
    rubricScores: Object.fromEntries(katalog.rubric.map(dimension => [dimension.id, 4])),
    evals: flattenEvals(katalog).map(eintrag => ({
      id: eintrag.id,
      status: 'future-stage',
      evidence: [],
      note: 'Spätere Etappe',
    })),
  }
  const inv01 = ergebnis.evals.find(eintrag => eintrag.id === 'INV-01')
  inv01.status = 'passed'
  inv01.evidence = [{ kind: 'browser', path: 'test/v2-smoke.mjs', command: 'node test/v2-smoke.mjs' }]
  const inv06 = ergebnis.evals.find(eintrag => eintrag.id === 'INV-06')
  inv06.status = 'external-open'
  inv06.note = 'Mac-Live-Test ohne Netz noch offen'
  const scored = ergebnis.evals.find(eintrag => eintrag.id === 'EVID-04')
  scored.status = 'passed'
  scored.evidence = [{ kind: 'fixture', path: 'evals/run-b1-quality.mjs' }]
  scored.score = 4.5
  scored.scoreRationale = 'Goldfälle und Kontrastfälle erreichen den Zielwert.'

  assert.deepEqual(validiereEvalErgebnisse(katalog, ergebnis), [])
})

test('Eval-Ergebnisse weisen unbelegte Erfolge, unbekannte IDs und falsche Live-Status zurück', async () => {
  const katalog = await ladeEvalKatalog(KATALOG_PFAD)
  const ergebnis = {
    schemaVersion: 1,
    catalogVersion: katalog.catalogVersion,
    stage: 'A',
    iteration: 1,
    generatedAt: '2026-07-30T13:00:00.000Z',
    gitCommit: 'abc1234',
    rubricScores: Object.fromEntries(katalog.rubric.map(dimension => [dimension.id, 4])),
    evals: flattenEvals(katalog).map(eintrag => ({
      id: eintrag.id,
      status: 'future-stage',
      evidence: [],
      note: 'Spätere Etappe',
    })),
  }
  ergebnis.evals.find(eintrag => eintrag.id === 'INV-01').status = 'passed'
  ergebnis.evals.find(eintrag => eintrag.id === 'WORK-01').status = 'external-open'
  ergebnis.evals.push({ id: 'NICHT-DA', status: 'passed', evidence: [{ kind: 'unit', path: 'x' }] })

  const fehler = validiereEvalErgebnisse(katalog, ergebnis).join('\n')
  assert.match(fehler, /INV-01.*Beleg/)
  assert.match(fehler, /WORK-01.*kein externes Live-Gate/)
  assert.match(fehler, /NICHT-DA.*unbekannt/)
})

test('bestandene Scored-Gates brauchen einen echten Wert und eine Begründung', async () => {
  const katalog = await ladeEvalKatalog(KATALOG_PFAD)
  const ergebnis = {
    schemaVersion: 1,
    catalogVersion: katalog.catalogVersion,
    stage: 'FERTIGZUSTAND',
    iteration: 1,
    generatedAt: '2026-08-05T13:00:00.000Z',
    gitCommit: 'abc1234',
    rubricScores: Object.fromEntries(katalog.rubric.map(dimension => [dimension.id, 4.5])),
    evals: flattenEvals(katalog).map(eintrag => ({
      id: eintrag.id,
      status: 'future-stage',
      evidence: [],
      note: 'Noch nicht gemessen',
    })),
  }
  const scored = ergebnis.evals.find(eintrag => eintrag.id === 'EVID-04')
  scored.status = 'passed'
  scored.evidence = [{ kind: 'fixture', path: 'evals/run-b1-quality.mjs' }]

  const fehler = validiereEvalErgebnisse(katalog, ergebnis).join('\n')
  assert.match(fehler, /EVID-04.*Score zwischen 0 und 5/)
  assert.match(fehler, /EVID-04.*Begründung/)
})

test('Eval-CLI prüft den Katalog und liefert eine maschinenlesbare Zusammenfassung', async () => {
  const { stdout, stderr } = await execFile(process.execPath, [CLI_PFAD])
  assert.equal(stderr, '')
  const bericht = JSON.parse(stdout)

  assert.equal(bericht.valid, true)
  assert.deepEqual(bericht.catalog, {
    suites: 19,
    evals: 152,
    hardGates: 144,
    scoredGates: 8,
    externalLiveGates: 5,
  })
  assert.equal(bericht.result, null)
})
