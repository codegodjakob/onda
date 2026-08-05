#!/usr/bin/env node
// Misst den Fertigzustand FRISCH: jede Bindung wird in diesem Lauf ausgeführt,
// und nur was hier erfolgreich läuft, gilt als bestanden.
//
// Der Unterschied zu den Etappen-Ergebnissen: dort durfte ein Eval "bestanden"
// heißen, weil ein früherer Lauf das gesagt hatte. Diese Weiterreichung ist
// bauartbedingt blind gegen spätere Regressionen — hier gibt es sie nicht.
// Ohne gebundene, jetzt gelaufene Prüfung ist ein Eval nicht bestanden.

import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { flattenEvals, ladeEvalKatalog, validiereEvalErgebnisse } from '../src/eval-catalog.mjs'
import { runQualityRubric } from './run-quality-rubric.mjs'

const ausfuehren = promisify(execFile)
const hier = dirname(fileURLToPath(import.meta.url))
const appWurzel = resolve(hier, '..')

const katalogPfad = resolve(hier, 'v2-fertigzustand.json')
const bindungsPfad = resolve(hier, 'bindungen.json')
const ergebnisPfad = resolve(hier, 'results/fertigzustand-latest.json')
const protokollOrdner = resolve(hier, 'results/laeufe')

const katalog = await ladeEvalKatalog(katalogPfad)
const { bindungen, _ungebunden_begruendung: ungebunden, _live_gates: liveGates } =
  JSON.parse(await readFile(bindungsPfad, 'utf8'))

const evals = flattenEvals(katalog)
const liveIds = new Set(katalog.externalLiveGateIds)

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
  laufErgebnis.set(datei, { ok, protokoll: `evals/results/laeufe/${name}.log`, dauerMs: Date.now() - start })
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
      kind: eintrag.automation === 'user-study' ? 'user-study' : belegArtFuer(eintrag.automation),
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
let loops = [aktuelleSchleife]
try {
  const vorher = JSON.parse(await readFile(ergebnisPfad, 'utf8'))
  if (vorher.catalogVersion === katalog.catalogVersion && Array.isArray(vorher.loops)) {
    loops = [
      ...vorher.loops.filter(lauf => Number.isInteger(lauf?.iteration) && lauf.iteration < aktuelleSchleife.iteration),
      aktuelleSchleife,
    ].slice(-katalog.thresholds.maximumIterationsPerStage)
  }
} catch {
  // Der erste Lauf hat naturgemaess noch kein Vorergebnis.
}

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
  evals: ergebnisEvals,
}

const fehler = validiereEvalErgebnisse(katalog, ergebnis)
await mkdir(dirname(ergebnisPfad), { recursive: true })
await writeFile(ergebnisPfad, `${JSON.stringify(ergebnis, null, 2)}\n`, 'utf8')

process.stdout.write('\n')
process.stdout.write(`Bestanden:      ${zaehler.passed}\n`)
process.stdout.write(`Nicht belegt:   ${zaehler.failed}\n`)
process.stdout.write(`Live-Gates:     ${zaehler['external-open']}\n`)
process.stdout.write(`Qualität:       ${qualitaet.weightedScore} / 5  (Gold-, Kontrast- und Vollausgabe-Rubrik)\n`)
process.stdout.write(`Abdeckung:      ${Math.round(anteil * 100)} % der anwendbaren Evals frisch belegt\n`)
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

function belegArtFuer(automation) {
  const erlaubt = new Set(katalog.evidenceKinds)
  return erlaubt.has(automation) ? automation : 'integration'
}
