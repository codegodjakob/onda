#!/usr/bin/env node
// Misst den Fertigzustand FRISCH: jede Bindung wird in diesem Lauf ausgeführt,
// und nur was hier erfolgreich läuft, gilt als bestanden.
//
// Der Unterschied zu den Etappen-Ergebnissen: dort durfte ein Eval "bestanden"
// heißen, weil ein früherer Lauf das gesagt hatte. Diese Weiterreichung ist
// bauartbedingt blind gegen spätere Regressionen — hier gibt es sie nicht.
// Ohne gebundene, jetzt gelaufene Prüfung ist ein Eval nicht bestanden.
//
// Der Lauf bewacht auch den Maßstab selbst: Der Maßstab, der gelten soll
// (Katalog samt Bindungen), liegt in evals/massstab.lock.json — von Hand
// gepflegt, versioniert. Jede inhaltliche Abweichung des heutigen Katalogs
// davon meldet der Lauf als eigenen Abschnitt „Maßstab geändert". Womit er
// tatsächlich gemessen hat, hinterlegt er zusätzlich im Ergebnis.

import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { flattenEvals, ladeEvalKatalog, validiereEvalErgebnisse } from '../src/eval-catalog.mjs'
import { runQualityRubric } from './run-quality-rubric.mjs'
import {
  belegartAusVollzug,
  formatiereMassstabAenderungen,
  massstabSchnappschuss,
  vergleicheMassstab,
} from '../src/massstab-waechter.mjs'

const ausfuehren = promisify(execFile)
const hier = dirname(fileURLToPath(import.meta.url))
const appWurzel = resolve(hier, '..')

const katalogPfad = resolve(hier, 'v2-fertigzustand.json')
const bindungsPfad = resolve(hier, 'bindungen.json')
const sperrPfad = resolve(hier, 'massstab.lock.json')
// Nur zum Schreiben. Der Lauf liest sein eigenes Ergebnis nicht mehr — siehe unten.
const ergebnisPfad = resolve(hier, 'results/fertigzustand-latest.json')
const protokollOrdner = resolve(hier, 'results/laeufe')

const katalog = await ladeEvalKatalog(katalogPfad)
const { bindungen, _ungebunden_begruendung: ungebunden, _live_gates: liveGates } =
  JSON.parse(await readFile(bindungsPfad, 'utf8'))

const evals = flattenEvals(katalog)
const liveIds = new Set(katalog.externalLiveGateIds)

// --- Maßstabs-Wächter: Womit misst dieser Lauf, und womit soll er messen? ----
// Der Vergleichsmaßstab steht in evals/massstab.lock.json — einer eigenen,
// versionierten Datei, die nur von Hand geändert wird. Weicht der heutige
// Katalog davon ab, erscheint das unten als eigener Abschnitt „Maßstab
// geändert" — niemals stumm. Fehlt die Sperrdatei, wird auch DAS gesagt, statt
// „unverändert" zu raten.
//
// Warum nicht mehr aus der Ergebnisdatei: Der Lauf las bisher seinen eigenen
// letzten Bericht und überschrieb ihn danach — Messgerät und Messprotokoll
// waren dieselbe Datei. Bei jedem Zusammenführen von Zweigen stand sie im
// Konflikt; wurde er „mit dem main-Stand" aufgelöst, verlor der Zweig sein
// Maßstabs-Gedächtnis und der Wächter meldete danach „unverändert", ohne je
// verglichen zu haben. Die Sperrdatei trennt beides: hier das Maß, dort das
// Protokoll.
const massstab = massstabSchnappschuss(katalog, bindungen)
let gesperrterMassstab = null
try {
  gesperrterMassstab = JSON.parse(await readFile(sperrPfad, 'utf8'))
} catch {
  gesperrterMassstab = null
}
const massstabAenderungen = vergleicheMassstab(gesperrterMassstab, massstab)
const massstabVergleich = massstabAenderungen === null
  ? { status: 'kein-vergleichsstand', aenderungen: [] }
  : { status: massstabAenderungen.length ? 'geaendert' : 'unveraendert', aenderungen: massstabAenderungen }

// Jede Prüfdatei einmal bewerten, auch wenn mehrere Evals sie teilen. Ein abgestürzter
// Playwright-Prozess ist kein Produkturteil: genau dieser klar erkennbare Infrastrukturfehler
// darf einmal in einem frischen Prozess wiederholt werden. Assertions und Timeouts nie.
const pruefungen = [...new Set(Object.values(bindungen).flat())]
await mkdir(protokollOrdner, { recursive: true })

process.stdout.write(`Führe ${pruefungen.length} Prüfungen aus …\n`)

const laufErgebnis = new Map()
for (const [index, datei] of pruefungen.entries()) {
  const name = datei.replace(/[^a-zA-Z0-9]+/g, '-')
  const protokoll = resolve(protokollOrdner, `${name}.log`)
  // Nur echte node:test-Dateien laufen unter --test. Die Smoke-Dateien sind
  // eigenstaendige Skripte; wickelt man sie in --test, laufen sie entweder anders
  // (v2-smoke schlug so fehl, obwohl es eigenstaendig besteht) oder scheinbar
  // erfolgreich durch, ohne je ihre Belegzeile zu drucken. Beides verfaelscht.
  const istTestDatei = datei.endsWith('.test.mjs')
  const argumente = istTestDatei ? ['--test', datei] : [datei]
  // Belegart aus dem Vollzug, nicht aus der Katalog-Behauptung: „browser" gibt
  // es nur, wenn diese Datei wirklich einen Browser startet (Playwright lädt).
  let quelltext = ''
  try { quelltext = await readFile(resolve(appWurzel, datei), 'utf8') } catch { quelltext = '' }
  const belegart = belegartAusVollzug(datei, quelltext)
  const start = Date.now()
  let ok = false
  let ausgabe = ''
  for (let versuch = 1; versuch <= 2; versuch += 1) {
    try {
      const { stdout, stderr } = await ausfuehren('node', argumente, {
        cwd: appWurzel,
        maxBuffer: 32 * 1024 * 1024,
        timeout: 300_000,
      })
      ausgabe += `${versuch > 1 ? '\n--- frischer Infrastruktur-Wiederholungslauf ---\n' : ''}${stdout}\n${stderr}`
      // Exit 0 ist die Grundbedingung (sonst wirft execFile). Bei --test zusaetzlich
      // die TAP-Ausgabe pruefen, weil der Laeufer einzelne Fehlschlaege sammelt.
      ok = !istTestDatei || !/^not ok /m.test(stdout)
      break
    } catch (ursache) {
      const fehlAusgabe = `${ursache.stdout || ''}\n${ursache.stderr || ''}\n${ursache.message}`
      ausgabe += `${versuch > 1 ? '\n--- frischer Infrastruktur-Wiederholungslauf ---\n' : ''}${fehlAusgabe}`
      const browserProzessAbgestuerzt = datei === 'test/v2-smoke.mjs'
        && /Target page, context or browser has been closed/.test(fehlAusgabe)
      if (!browserProzessAbgestuerzt || versuch === 2) break
    }
  }
  await writeFile(protokoll, ausgabe, 'utf8')
  laufErgebnis.set(datei, { ok, belegart, protokoll: `evals/results/laeufe/${name}.log`, dauerMs: Date.now() - start })
  process.stdout.write(`  [${index + 1}/${pruefungen.length}] ${ok ? '✓' : '✗'} ${datei}\n`)
}

// Separater Qualitätsrichter: Goldfälle, Kontraste und vollständige Ausgaben. Diese Werte
// hängen nicht davon ab, wie viele Bindungen grün sind. Das CLI-Skript selbst läuft oben
// zusätzlich als frischer, protokollierter Beleg für jedes bewertete Gate.
const qualitaet = runQualityRubric()

// --- Jedes Eval bewerten -----------------------------------------------------
const ergebnisEvals = evals.map(eintrag => {
  const gebunden = bindungen[eintrag.id]

  if (gebunden?.length) {
    const laeufe = gebunden.map(datei => laufErgebnis.get(datei))
    const score = qualitaet.scoredEvalScores[eintrag.id]
    const scoreOk = eintrag.gate !== 'scored'
      || (Number.isFinite(score) && score >= katalog.thresholds.minimumDimensionScore)
    const allesOk = laeufe.every(lauf => lauf?.ok) && scoreOk
    const belege = gebunden.map((datei, i) => ({
      kind: laeufe[i]?.belegart ?? belegartAusVollzug(datei, ''),
      path: laeufe[i]?.protokoll || datei,
      command: datei.endsWith('.test.mjs') ? `node --test ${datei}` : `node ${datei}`,
    }))
    return allesOk
      ? {
        id: eintrag.id,
        status: 'passed',
        evidence: belege,
        ...(eintrag.gate === 'scored' ? {
          score,
          scoreRationale: qualitaet.scoredEvalRationales[eintrag.id],
        } : {}),
      }
      : {
        id: eintrag.id,
        status: 'failed',
        evidence: belege,
        note: scoreOk
          ? `Gebundene Prüfung in diesem Lauf fehlgeschlagen: ${gebunden.filter((d, i) => !laeufe[i]?.ok).join(', ')}`
          : `Qualitätsrubrik ${score ?? 'ohne Wert'} liegt unter ${katalog.thresholds.minimumDimensionScore}.`,
      }
  }

  if (liveIds.has(eintrag.id)) {
    return {
      id: eintrag.id,
      status: 'external-open',
      evidence: [],
      note: liveGates?.[eintrag.id] || 'Braucht einen echten KI-Zugang; noch kein Schlüssel hinterlegt.',
    }
  }

  return {
    id: eintrag.id,
    status: 'failed',
    evidence: [],
    note: `Keine frische Prüfung gebunden — unbewiesen. ${ungebunden?.[eintrag.id] || ''}`.trim(),
  }
})

// --- Rubrik und Abdeckung getrennt halten -----------------------------------
const zaehler = { passed: 0, failed: 0, 'external-open': 0 }
ergebnisEvals.forEach(e => { zaehler[e.status] = (zaehler[e.status] || 0) + 1 })
const anwendbar = ergebnisEvals.length - zaehler['external-open']
const anteil = anwendbar ? zaehler.passed / anwendbar : 0

const gitCommit = (await ausfuehren('git', ['rev-parse', 'HEAD'], { cwd: appWurzel })).stdout.trim()

const aktuelleSchleife = {
  iteration: Number(process.env.ITERATION || 1),
  passed: zaehler.passed,
  failed: zaehler.failed,
  externalOpen: zaehler['external-open'],
  weightedScore: qualitaet.weightedScore,
}
// Die Ergebnisdatei wird ab hier nur noch geschrieben, nie gelesen. Frueher
// holte sich der Lauf die Schleifen frueherer Durchgaenge aus genau der Datei,
// die er gleich ueberschrieb. Ohne gesetzte Umgebungsvariable ITERATION (und
// die setzt im Projekt niemand) war diese Uebernahme ohnehin wirkungslos: Es
// gibt keinen frueheren Durchgang mit kleinerer Nummer als 1.
const loops = [aktuelleSchleife]

const ergebnis = {
  schemaVersion: 1,
  catalogVersion: katalog.catalogVersion,
  stage: 'FERTIGZUSTAND',
  iteration: Number(process.env.ITERATION || 1),
  generatedAt: new Date().toISOString(),
  gitCommit,
  rubricScores: qualitaet.rubricScores,
  weightedScore: qualitaet.weightedScore,
  scoreRationale:
    'Goldfälle, Kontrastkandidaten und vollständige reproduzierbare Ausgaben; Testabdeckung '
    + 'wird separat ausgewiesen und geht nicht als Qualitätsscore ein.',
  rubricRationales: qualitaet.rubricRationales,
  coverage: { passed: zaehler.passed, applicable: anwendbar, ratio: Number(anteil.toFixed(4)) },
  loops,
  massstabVergleich,
  massstab,
  evals: ergebnisEvals,
}

const fehler = validiereEvalErgebnisse(katalog, ergebnis)
await mkdir(dirname(ergebnisPfad), { recursive: true })
await writeFile(ergebnisPfad, `${JSON.stringify(ergebnis, null, 2)}\n`, 'utf8')

process.stdout.write('\n')
if (massstabVergleich.status === 'geaendert') {
  // Der Abschnitt steht VOR den Zahlen: Wer den Wert liest, soll zuerst
  // erfahren, dass sich das Maß geändert hat, mit dem er gemessen wurde.
  const seit = gesperrterMassstab?._gesetztAm ? ` (Sperrdatei vom ${gesperrterMassstab._gesetztAm})` : ''
  process.stdout.write(`MASSSTAB GEÄNDERT${seit} — dieser Lauf misst anders als der letzte:\n`)
  for (const zeile of formatiereMassstabAenderungen(massstabVergleich.aenderungen)) {
    process.stdout.write(`  · ${zeile}\n`)
  }
  process.stdout.write('\n')
}
process.stdout.write(`Bestanden:      ${zaehler.passed}\n`)
process.stdout.write(`Nicht belegt:   ${zaehler.failed}\n`)
process.stdout.write(`Live-Gates:     ${zaehler['external-open']}\n`)
process.stdout.write(`Qualität:       ${qualitaet.weightedScore} / 5  (Gold-, Kontrast- und Vollausgabe-Rubrik)\n`)
process.stdout.write(`Abdeckung:      ${Math.round(anteil * 100)} % der anwendbaren Evals frisch belegt\n`)
process.stdout.write(`Maßstab:        ${{
  geaendert: `GEÄNDERT — ${massstabVergleich.aenderungen.length} Änderung(en), Abschnitt oben`,
  unveraendert: 'unverändert gegenüber der Sperrdatei evals/massstab.lock.json',
  'kein-vergleichsstand': 'kein Vergleichsstand — evals/massstab.lock.json fehlt oder ist unlesbar',
}[massstabVergleich.status]}\n`)
process.stdout.write(`Ergebnis:       evals/results/fertigzustand-latest.json\n`)
const schwellenFehler = []
if (zaehler.failed) schwellenFehler.push(`${zaehler.failed} anwendbare Evals sind nicht bestanden.`)
if (qualitaet.weightedScore < katalog.thresholds.minimumWeightedScore) {
  schwellenFehler.push(`Gesamtqualität ${qualitaet.weightedScore} liegt unter ${katalog.thresholds.minimumWeightedScore}.`)
}
for (const [id, score] of Object.entries(qualitaet.rubricScores)) {
  if (score < katalog.thresholds.minimumDimensionScore) {
    schwellenFehler.push(`Rubrikdimension ${id} (${score}) liegt unter ${katalog.thresholds.minimumDimensionScore}.`)
  }
}
if (!qualitaet.passed) schwellenFehler.push('Mindestens ein Gold-, Kontrast- oder Vollausgabe-Scorer ist nicht bestanden.')

if (fehler.length || schwellenFehler.length) {
  if (schwellenFehler.length) process.stderr.write(`\nGate-Fehler:\n  ${schwellenFehler.join('\n  ')}\n`)
}
if (fehler.length) {
  process.stderr.write(`\nSchema-Fehler:\n  ${fehler.join('\n  ')}\n`)
}
if (fehler.length || schwellenFehler.length) process.exitCode = 1
