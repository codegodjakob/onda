import test from 'node:test'
import assert from 'node:assert/strict'
import {
  belegartAusVollzug,
  formatiereMassstabAenderungen,
  massstabSchnappschuss,
  vergleicheMassstab,
} from '../src/massstab-waechter.mjs'

function beispielKatalog() {
  return {
    catalogVersion: '2026-08-04.1',
    thresholds: { allApplicableHardGatesMustPass: true, minimumWeightedScore: 4.6 },
    rubric: [
      { id: 'truth', label: 'Wahrheit und Evidenz', weight: 0.6 },
      { id: 'calm', label: 'Ruhe', weight: 0.4 },
    ],
    evidenceKinds: ['unit', 'integration', 'browser'],
    externalLiveGateIds: ['INV-06'],
    suites: [
      {
        id: 'INV',
        evals: [
          {
            id: 'INV-07',
            title: 'Beispieltext bleibt Beispiel',
            gate: 'hard',
            automation: 'browser',
            given: 'ein frisches Profil',
            when: 'der Beispieltext geladen wird',
            then: 'wird er nie als eigener Text gezählt',
            evidence: ['test/example-seed.test.mjs'],
            source: ['docs/ONDA-SYSTEM.md'],
          },
          {
            id: 'INV-06',
            title: 'Offline-Würde',
            gate: 'hard',
            automation: 'manual-live',
            given: 'kein Netz',
            when: 'ein Lauf startet',
            then: 'bleibt die App benutzbar',
            evidence: ['manuell'],
            source: ['docs/ONDA-SYSTEM.md'],
          },
        ],
      },
    ],
  }
}

const BINDUNGEN = { 'INV-07': ['test/example-seed.test.mjs'] }

test('unveränderter Maßstab meldet keine Änderung', () => {
  const vorher = massstabSchnappschuss(beispielKatalog(), BINDUNGEN)
  const jetzt = massstabSchnappschuss(beispielKatalog(), BINDUNGEN)
  assert.deepEqual(vergleicheMassstab(vorher, jetzt), [])
})

test('ohne Vergleichsstand gibt es kein stilles „unverändert“', () => {
  const jetzt = massstabSchnappschuss(beispielKatalog(), BINDUNGEN)
  assert.equal(vergleicheMassstab(null, jetzt), null)
  assert.equal(vergleicheMassstab(undefined, jetzt), null)
})

test('eine absichtliche Test-Umdefinition erscheint mit Feld, alter und neuer Fassung', () => {
  const vorher = massstabSchnappschuss(beispielKatalog(), BINDUNGEN)
  const geaendert = beispielKatalog()
  geaendert.suites[0].evals[0].then = 'wird er manchmal gezählt, das ist ok'
  const jetzt = massstabSchnappschuss(geaendert, BINDUNGEN)

  const aenderungen = vergleicheMassstab(vorher, jetzt)
  assert.deepEqual(aenderungen, [{
    bereich: 'eval',
    art: 'geaendert',
    id: 'INV-07',
    feld: 'then',
    vorher: 'wird er nie als eigener Text gezählt',
    jetzt: 'wird er manchmal gezählt, das ist ok',
  }])

  const zeilen = formatiereMassstabAenderungen(aenderungen)
  assert.equal(zeilen.length, 1)
  assert.match(zeilen[0], /Eval INV-07, Feld then/)
  assert.match(zeilen[0], /nie als eigener Text/)
  assert.match(zeilen[0], /manchmal gezählt/)
})

test('entfernte und hinzugekommene Evals werden beide gemeldet', () => {
  const vorher = massstabSchnappschuss(beispielKatalog(), BINDUNGEN)
  const geaendert = beispielKatalog()
  const [inv07] = geaendert.suites[0].evals.splice(0, 1)
  geaendert.suites[0].evals.push({ ...inv07, id: 'INV-99', title: 'Ganz neues Eval' })
  const jetzt = massstabSchnappschuss(geaendert, BINDUNGEN)

  const aenderungen = vergleicheMassstab(vorher, jetzt)
  assert.deepEqual(aenderungen.map(a => [a.art, a.id]).sort(), [
    ['entfernt', 'INV-07'],
    ['hinzugefuegt', 'INV-99'],
  ])
  const zeilen = formatiereMassstabAenderungen(aenderungen).join('\n')
  assert.match(zeilen, /Eval INV-07 entfernt/)
  assert.match(zeilen, /Eval INV-99 hinzugekommen/)
})

test('geänderte Schwellen und Rubrikgewichte werden gemeldet', () => {
  const vorher = massstabSchnappschuss(beispielKatalog(), BINDUNGEN)
  const geaendert = beispielKatalog()
  geaendert.thresholds.minimumWeightedScore = 3.0
  geaendert.rubric[0].weight = 0.7
  geaendert.rubric[1].weight = 0.3
  const jetzt = massstabSchnappschuss(geaendert, BINDUNGEN)

  const aenderungen = vergleicheMassstab(vorher, jetzt)
  assert.deepEqual(aenderungen.map(a => [a.bereich, a.feld || a.id]).sort(), [
    ['rubrik', 'calm'],
    ['rubrik', 'truth'],
    ['schwellen', 'minimumWeightedScore'],
  ])
  const zeilen = formatiereMassstabAenderungen(aenderungen).join('\n')
  assert.match(zeilen, /Schwelle minimumWeightedScore: 4\.6 → 3/)
})

test('eine getauschte Bindung ist eine Maßstabs-Änderung', () => {
  const vorher = massstabSchnappschuss(beispielKatalog(), BINDUNGEN)
  const jetzt = massstabSchnappschuss(beispielKatalog(), { 'INV-07': ['test/schwaecherer-test.mjs'] })

  const aenderungen = vergleicheMassstab(vorher, jetzt)
  assert.deepEqual(aenderungen, [{
    bereich: 'bindung',
    art: 'geaendert',
    id: 'INV-07',
    vorher: ['test/example-seed.test.mjs'],
    jetzt: ['test/schwaecherer-test.mjs'],
  }])
})

test('Belegarten-Vokabular und Live-Gate-Liste werden überwacht', () => {
  const vorher = massstabSchnappschuss(beispielKatalog(), BINDUNGEN)
  const geaendert = beispielKatalog()
  geaendert.evidenceKinds = ['unit', 'integration']
  geaendert.externalLiveGateIds = ['INV-06', 'INV-07']
  const jetzt = massstabSchnappschuss(geaendert, BINDUNGEN)

  const aenderungen = vergleicheMassstab(vorher, jetzt)
  assert.deepEqual(aenderungen.map(a => [a.bereich, a.art, a.id]).sort(), [
    ['belegarten', 'entfernt', 'browser'],
    ['live-gates', 'hinzugefuegt', 'INV-07'],
  ])
})

test('die Belegart folgt dem Vollzug, nicht der Behauptung', () => {
  assert.equal(belegartAusVollzug('test/etappe-a-smoke.mjs', "import { chromium } from 'playwright'\n"), 'browser')
  assert.equal(belegartAusVollzug('test/v2-smoke.mjs', "const { chromium } = require('playwright')\n"), 'browser')
  assert.equal(belegartAusVollzug('test/d2-accessibility.test.mjs', "import { chromium } from 'playwright'\n"), 'browser')
  assert.equal(belegartAusVollzug('test/example-seed.test.mjs', "import test from 'node:test'\n"), 'unit')
  assert.equal(belegartAusVollzug('evals/pruefungen/schluessel-leck.mjs', "import { readFile } from 'node:fs/promises'\n"), 'integration')
})

test('Playwright nur im Kommentar macht keinen Browser-Beleg', () => {
  const quelltext = "// hier absichtlich KEIN 'playwright'\nimport test from 'node:test'\n"
  assert.equal(belegartAusVollzug('test/beispiel.test.mjs', quelltext), 'unit')
})

// Eine Prüfdatei kann je Eval urteilen (sie kündigt das mit „# je-eval:" an) oder als
// Ganzes. Das ändert, WIE gemessen wird, ohne dass sich Katalog oder Bindung anfassen
// lassen — genau die stille Maßstabsänderung, gegen die es den Wächter gibt. Fällt eine
// Prüfung von „je-eval" auf „datei" zurück, weil jemand die Ankündigung entfernt hat,
// muss das im Bericht stehen.
test('verliert eine Prüfung ihre Einzelurteile, steht das im Bericht', () => {
  const jeEval = massstabSchnappschuss(beispielKatalog(), BINDUNGEN, {
    'test/example-seed.test.mjs': 'je-eval',
  })
  const alsGanzes = massstabSchnappschuss(beispielKatalog(), BINDUNGEN, {
    'test/example-seed.test.mjs': 'datei',
  })

  assert.deepEqual(vergleicheMassstab(jeEval, jeEval), [])
  assert.deepEqual(vergleicheMassstab(jeEval, alsGanzes), [{
    bereich: 'urteilsweise',
    art: 'entfernt',
    id: 'test/example-seed.test.mjs',
    vorher: 'je-eval',
  }])
  // Der Satz muss ohne Fachwissen verständlich sein: Was ist passiert, und was heisst das?
  assert.match(
    formatiereMassstabAenderungen(vergleicheMassstab(jeEval, alsGanzes))[0],
    /nicht mehr je Eval/,
  )
  assert.match(
    formatiereMassstabAenderungen(vergleicheMassstab(alsGanzes, jeEval))[0],
    /urteilt jetzt je Eval/,
  )
})

test('das Sammelurteil ist der Normalfall und macht keinen Lärm', () => {
  // Nur die Ausnahme gehört in den Maßstab. Stünde jede Prüfung mit „datei“ darin,
  // meldete der erste Lauf nach dem Umbau 78 Änderungen — und keine davon besagt etwas.
  const ohne = massstabSchnappschuss(beispielKatalog(), BINDUNGEN)
  const alleAlsGanzes = massstabSchnappschuss(beispielKatalog(), BINDUNGEN, {
    'test/example-seed.test.mjs': 'datei',
    'test/noch-eine.test.mjs': 'datei',
  })
  assert.deepEqual(vergleicheMassstab(ohne, alleAlsGanzes), [])
})
