#!/usr/bin/env node

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ladeEvalKatalog,
  summarisiereEvalKatalog,
  validiereEvalErgebnisse,
  validiereEvalKatalog,
} from '../src/eval-catalog.mjs'

const katalogPfad = fileURLToPath(new URL('./v2-fertigzustand.json', import.meta.url))
const argumente = process.argv.slice(2)
const resultIndex = argumente.indexOf('--result')
const resultPfad = resultIndex >= 0 ? argumente[resultIndex + 1] : null

if (resultIndex >= 0 && !resultPfad) {
  process.stderr.write('Nach --result fehlt der Pfad zur Ergebnisdatei.\n')
  process.exitCode = 2
} else {
  try {
    const katalog = await ladeEvalKatalog(katalogPfad)
    const katalogErrors = validiereEvalKatalog(katalog)
    let result = null
    let resultErrors = []

    if (resultPfad) {
      const ergebnis = await ladeEvalKatalog(resolve(resultPfad))
      resultErrors = validiereEvalErgebnisse(katalog, ergebnis)
      result = {
        path: resolve(resultPfad),
        stage: ergebnis.stage || null,
        iteration: ergebnis.iteration || null,
        statuses: (Array.isArray(ergebnis.evals) ? ergebnis.evals : []).reduce((summe, eintrag) => {
          const status = eintrag?.status || 'missing'
          summe[status] = (summe[status] || 0) + 1
          return summe
        }, {}),
      }
    }

    const errors = [...katalogErrors, ...resultErrors]
    process.stdout.write(`${JSON.stringify({
      valid: errors.length === 0,
      catalog: summarisiereEvalKatalog(katalog),
      result,
      errors,
    }, null, 2)}\n`)
    if (errors.length) process.exitCode = 1
  } catch (fehler) {
    process.stderr.write(`${fehler?.message || String(fehler)}\n`)
    process.exitCode = 2
  }
}
