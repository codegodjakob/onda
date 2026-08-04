// Zahlen-Drift-Wächter — Befund 6 der Systemanalyse (Issue #18).
//
// Eine von Hand kopierte Zahl veraltet mit der ersten Änderung ihrer Quelle.
// Deshalb gilt für die Prosa-Dateien: Test- und Eval-Stände tragen entweder ein
// Messdatum auf derselben Zeile, oder sie müssen dem Maschinenwert entsprechen.
// Testzahlen ohne Datum sind immer ein Fehler, weil es für sie keine billige
// maschinenlesbare Quelle gibt — die Anzahl zeigt nur der Lauf selbst.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const PROSA_DATEIEN = [
  'CLAUDE.md',
  'CONTEXT.md',
  'docs/ONDA-SYSTEM.md',
  'docs/ABNAHME-ETAPPE-A.md',
]

// "446 bestandene Tests", "265 von 265 Tests", "77 Ziel-Evals", "83 Evals" …
// Bewusst eng: nur Zahlen, die direkt (ggf. über bekannte Zwischenwörter) einen
// Test- oder Eval-Stand behaupten. "17 native Selbsttests" zählt nicht.
const BEHAUPTUNG =
  /\b(\d+)\s+(?:von\s+\d+\s+)?(?:bestandene[nr]?\s+)?(?:beobachtbaren?\s+)?(?:Ziel-)?(?:Unit-)?(Tests?|Evals?)\b/g

// Ein volles Datum auf derselben Zeile kennzeichnet eine historische Messung.
const DATUM =
  /\b\d{1,2}\.\s?(?:Januar|Februar|März|Maerz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+\d{4}\b|\b\d{1,2}\.\d{1,2}\.\d{4}\b/

function katalogEvalAnzahl() {
  const katalog = JSON.parse(
    readFileSync(join(wurzel, 'app', 'evals', 'v2-fertigzustand.json'), 'utf8'),
  )
  return katalog.suites.reduce((summe, suite) => summe + (suite.evals?.length ?? 0), 0)
}

test('Prosa-Dateien behaupten keine undatierten oder falschen Test-/Eval-Stände', () => {
  const evalAnzahl = katalogEvalAnzahl()
  const verstoesse = []

  for (const datei of PROSA_DATEIEN) {
    const zeilen = readFileSync(join(wurzel, datei), 'utf8').split('\n')
    zeilen.forEach((zeile, index) => {
      for (const treffer of zeile.matchAll(BEHAUPTUNG)) {
        const zahl = Number(treffer[1])
        const art = treffer[2].startsWith('Test') ? 'Tests' : 'Evals'
        const datiert = DATUM.test(zeile)
        if (datiert) continue
        if (art === 'Evals' && zahl === evalAnzahl) continue
        verstoesse.push(
          `${datei}:${index + 1} behauptet „${treffer[0]}" ohne Messdatum` +
            (art === 'Evals'
              ? ` (Katalog hat aktuell ${evalAnzahl} Evals)`
              : ' (Testzahlen: Messdatum ergänzen oder durch Messquellen-Verweis ersetzen)'),
        )
      }
    })
  }

  assert.deepEqual(
    verstoesse,
    [],
    `Zahlen-Drift gefunden:\n${verstoesse.join('\n')}\n` +
      'Regel: Test-/Eval-Stände in der Prosa tragen ein Messdatum auf derselben Zeile ' +
      'oder verweisen auf die Messquelle (node evals/run-fertigzustand.mjs).',
  )
})
