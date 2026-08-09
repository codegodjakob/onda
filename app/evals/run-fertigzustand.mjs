#!/usr/bin/env node
// Misst den Fertigzustand FRISCH: jede Bindung wird in diesem Lauf ausgeführt,
// und nur was hier erfolgreich läuft, gilt als bestanden.
//
// Der Unterschied zu den Etappen-Ergebnissen: dort durfte ein Eval "bestanden"
// heißen, weil ein früherer Lauf das gesagt hatte. Diese Weiterreichung ist
// bauartbedingt blind gegen spätere Regressionen — hier gibt es sie nicht.
// Ohne gebundene, jetzt gelaufene Prüfung ist ein Eval nicht bestanden.
//
// Der Lauf bewacht auch den Maßstab selbst: Er hinterlegt im Ergebnis, womit
// er gemessen hat (Katalog samt Bindungen), und meldet jede inhaltliche
// Abweichung vom letzten Lauf als eigenen Abschnitt „Maßstab geändert".

import { execFile, spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { flattenEvals, ladeEvalKatalog, validiereEvalErgebnisse } from '../src/eval-catalog.mjs'
import { runQualityRubric } from './run-quality-rubric.mjs'
import { urteileJeEval } from '../src/bindungs-urteil.mjs'
import { serverAntwortet, standDerPruefung } from '../src/messbarkeit.mjs'
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
const ergebnisPfad = resolve(hier, 'results/fertigzustand-latest.json')
const protokollOrdner = resolve(hier, 'results/laeufe')

const katalog = await ladeEvalKatalog(katalogPfad)
const { bindungen, _ungebunden_begruendung: ungebunden, _live_gates: liveGates } =
  JSON.parse(await readFile(bindungsPfad, 'utf8'))

const evals = flattenEvals(katalog)
const liveIds = new Set(katalog.externalLiveGateIds)

// Der Vergleichsstand des letzten Laufs. Der Maßstab dieses Laufs steht erst nach
// dem Lauf fest, weil zu ihm gehört, WIE jede Prüfung geurteilt hat — siehe unten.
let vorherigerLauf = null
try {
  vorherigerLauf = JSON.parse(await readFile(ergebnisPfad, 'utf8'))
} catch {
  vorherigerLauf = null
}

// Jede Prüfdatei einmal bewerten, auch wenn mehrere Evals sie teilen. Ein abgestürzter
// Playwright-Prozess ist kein Produkturteil: genau dieser klar erkennbare Infrastrukturfehler
// darf einmal in einem frischen Prozess wiederholt werden. Assertions und Timeouts nie.
const pruefungen = [...new Set(Object.values(bindungen).flat())]

// Welche Evals hängen an welcher Datei? Umgekehrte Bindung — sie sagt jeder Prüfung,
// über welche Kennungen sie überhaupt zu urteilen hat.
const evalsProDatei = new Map()
for (const [id, dateien] of Object.entries(bindungen)) {
  for (const datei of dateien) evalsProDatei.set(datei, [...(evalsProDatei.get(datei) || []), id])
}
await mkdir(protokollOrdner, { recursive: true })

// VORSTART. Die Browser-Prüfungen brauchen den lokalen Server auf 4173. Bis zum
// 9.8.2026 musste man ihn von Hand starten, und wer das vergaß, bekam keinen Hinweis,
// sondern 23 rote Evals — darunter alle sieben DESIGN-Zusagen, an denen nichts kaputt
// war. Eine Voraussetzung, an die man denken MUSS, ist eine Voraussetzung, die der
// Lauf selbst herstellen sollte.
const SERVER_URL = 'http://127.0.0.1:4173/'
let selbstGestarteterServer = null
if (await serverAntwortet(SERVER_URL)) {
  process.stdout.write('Lokaler Server auf 4173: läuft bereits.\n')
} else {
  process.stdout.write('Lokaler Server auf 4173 antwortet nicht — wird für diesen Lauf gestartet …\n')
  selbstGestarteterServer = spawn('node', ['scripts/dev-server.mjs', '--port=4173'],
    { cwd: appWurzel, stdio: 'ignore', detached: false })
  // BEIDES ist noetig, und das eine ohne das andere hat den Lauf schon haengen lassen:
  //   unref()  — Node wartet sonst am Ende auf dieses Kind und beendet sich NIE. Genau
  //              so hing der erste Versuch dieses Vorstarts: alle Zahlen standen
  //              gedruckt da, der Prozess lief trotzdem weiter.
  //   kill()   — ohne das bliebe nach jedem Lauf ein Server auf 4173 zurueck.
  selbstGestarteterServer.unref()
  const serverBeenden = () => {
    if (selbstGestarteterServer && !selbstGestarteterServer.killed) {
      selbstGestarteterServer.kill()
    }
  }
  process.once('exit', serverBeenden)
  for (const zeichen of ['SIGINT', 'SIGTERM']) {
    process.once(zeichen, () => { serverBeenden(); process.exit(130) })
  }
  if (await serverAntwortet(SERVER_URL, 25, 400)) {
    process.stdout.write('Lokaler Server auf 4173: steht.\n')
  } else {
    // Nicht stillschweigend weiterlaufen: ohne Server misst dieser Lauf die App nicht,
    // und jedes rote Browser-Eval wäre eine Behauptung über etwas Ungemessenes.
    process.stdout.write('WARNUNG: Der Server ließ sich nicht starten. Alle Browser-Prüfungen '
      + 'dieses Laufs werden als NICHT MESSBAR gemeldet, nicht als fehlgeschlagen.\n')
  }
}

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
  // Beurteilt wird immer nur der LETZTE Versuch. Sonst zaehlte bei einem
  // Wiederholungslauf die Ausgabe des abgestuerzten Versuchs mit.
  let letzteAusgabe = ''
  for (let versuch = 1; versuch <= 2; versuch += 1) {
    try {
      const { stdout, stderr } = await ausfuehren('node', argumente, {
        cwd: appWurzel,
        maxBuffer: 32 * 1024 * 1024,
        timeout: 300_000,
      })
      letzteAusgabe = `${stdout}\n${stderr}`
      ausgabe += `${versuch > 1 ? '\n--- frischer Infrastruktur-Wiederholungslauf ---\n' : ''}${letzteAusgabe}`
      // Exit 0 ist die Grundbedingung (sonst wirft execFile). Bei --test zusaetzlich
      // die TAP-Ausgabe pruefen, weil der Laeufer einzelne Fehlschlaege sammelt.
      ok = !istTestDatei || !/^not ok /m.test(stdout)
      break
    } catch (ursache) {
      const fehlAusgabe = `${ursache.stdout || ''}\n${ursache.stderr || ''}\n${ursache.message}`
      letzteAusgabe = fehlAusgabe
      ausgabe += `${versuch > 1 ? '\n--- frischer Infrastruktur-Wiederholungslauf ---\n' : ''}${fehlAusgabe}`
      const browserProzessAbgestuerzt = datei === 'test/v2-smoke.mjs'
        && /Target page, context or browser has been closed/.test(fehlAusgabe)
      if (!browserProzessAbgestuerzt || versuch === 2) break
    }
  }
  // Eine Pruefung, die mehrere Zusagen misst, darf mehrere Urteile abgeben — aber nur,
  // wenn sie das selbst ankuendigt. Ohne Ankuendigung gilt ihr Urteil wie bisher fuer
  // alle ihre Evals. Siehe src/bindungs-urteil.mjs.
  const stand = urteileJeEval({
    gebundeneIds: evalsProDatei.get(datei) || [],
    ausgabe: letzteAusgabe,
    dateiOk: ok,
  })
  await writeFile(protokoll, ausgabe, 'utf8')
  // Konnte diese Prüfung die App überhaupt erreichen? Siehe src/messbarkeit.mjs.
  const messbarkeit = standDerPruefung({ ok, ausgabe: letzteAusgabe })
  laufErgebnis.set(datei, {
    ok,
    messbarkeit,
    modus: stand.modus,
    urteile: stand.urteile,
    belegart,
    protokoll: `evals/results/laeufe/${name}.log`,
    dauerMs: Date.now() - start,
  })
  // Bei „je-eval" sagt die Zeile, WIE VIELE Zusagen halten — nicht nur, dass die Datei
  // als Ganzes rot ist. Genau diese Auskunft fehlte, solange fuenf Gestalt-Zusagen
  // hinter einem einzigen Kreuz verschwanden.
  const kennungen = Object.values(stand.urteile)
  const anteilText = stand.modus === 'je-eval'
    ? `  (${kennungen.filter(u => u.ok).length}/${kennungen.length} Kennungen)`
    : ''
  process.stdout.write(`  [${index + 1}/${pruefungen.length}] ${ok ? '✓' : '✗'} ${datei}${anteilText}\n`)
}

// Separater Qualitätsrichter: Goldfälle, Kontraste und vollständige Ausgaben. Diese Werte
// hängen nicht davon ab, wie viele Bindungen grün sind. Das CLI-Skript selbst läuft oben
// zusätzlich als frischer, protokollierter Beleg für jedes bewertete Gate.
const qualitaet = runQualityRubric()

// --- Maßstabs-Wächter: Womit misst dieser Lauf, und womit maß der letzte? ----
// Jeder Lauf hinterlegt seinen Maßstab (Katalog, Bindungen und die Urteilsweise
// jeder Prüfung) im Ergebnis. Weicht der aktuelle davon ab, erscheint das unten
// als eigener Abschnitt „Maßstab geändert" — niemals stumm. Fehlt der
// Vergleichsstand (erster Lauf, gelöschte Ergebnisdatei), wird auch DAS gesagt,
// statt „unverändert" zu raten.
const urteilsweise = Object.fromEntries([...laufErgebnis].map(([datei, lauf]) => [datei, lauf.modus]))
const massstab = massstabSchnappschuss(katalog, bindungen, urteilsweise)
const massstabAenderungen = vergleicheMassstab(vorherigerLauf?.massstab, massstab)
const massstabVergleich = massstabAenderungen === null
  ? { status: 'kein-vergleichsstand', aenderungen: [] }
  : { status: massstabAenderungen.length ? 'geaendert' : 'unveraendert', aenderungen: massstabAenderungen }

// Was ist gebrochen? Wo die Prüfung ihren Befund selbst nennt, steht er hier — sonst
// bleibt es beim alten Wortlaut, der nur die Datei benennen kann. „Eval X ist rot, weil
// irgendein Skript fehlschlug" war die Auskunft, die niemandem half.
function gebrochenText(urteile) {
  const gebrochen = urteile.filter(urteil => !urteil.ok)
  const ohneBefund = gebrochen.filter(urteil => !urteil.hinweis).map(urteil => urteil.datei)
  return [
    ohneBefund.length ? `Gebundene Prüfung in diesem Lauf fehlgeschlagen: ${ohneBefund.join(', ')}` : null,
    ...gebrochen.filter(urteil => urteil.hinweis).map(urteil => `${urteil.datei} meldet: ${urteil.hinweis}`),
  ].filter(Boolean).join(' · ')
}

// --- Jedes Eval bewerten -----------------------------------------------------
const ergebnisEvals = evals.map(eintrag => {
  const gebunden = bindungen[eintrag.id]

  if (gebunden?.length) {
    const laeufe = gebunden.map(datei => laufErgebnis.get(datei))
    // Das Urteil dieser Datei ÜBER DIESES Eval — je nach Prüfung ihr Sammelurteil
    // oder ihr eigenes Urteil zu genau dieser Kennung.
    const urteile = gebunden.map((datei, i) => ({
      datei,
      ...(laeufe[i]?.urteile?.[eintrag.id] ?? { ok: Boolean(laeufe[i]?.ok) }),
    }))
    const score = qualitaet.scoredEvalScores[eintrag.id]
    const scoreOk = eintrag.gate !== 'scored'
      || (Number.isFinite(score) && score >= katalog.thresholds.minimumDimensionScore)
    const allesOk = urteile.every(urteil => urteil.ok) && scoreOk
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
      : (() => {
        // Konnte auch nur eine der gebundenen Prüfungen die App gar nicht erreichen,
        // ist dieses Eval NICHT GEMESSEN — und das ist keine Aussage über die App.
        // Es zählt weiterhin nicht als bestanden (Schweigen darf nie grün sein), aber
        // es heißt nicht mehr „fehlgeschlagen". Siehe src/messbarkeit.mjs.
        const unmessbar = laeufe.find(lauf => lauf?.messbarkeit?.stand === 'nicht-messbar')
        if (unmessbar) {
          return {
            id: eintrag.id,
            status: 'not-measurable',
            evidence: belege,
            note: `Nicht gemessen — ${unmessbar.messbarkeit.grund} Abhilfe: ${unmessbar.messbarkeit.abhilfe}`,
          }
        }
        return {
          id: eintrag.id,
          status: 'failed',
          evidence: belege,
          note: scoreOk ? gebrochenText(urteile) : `Qualitätsrubrik ${score ?? 'ohne Wert'} liegt unter ${katalog.thresholds.minimumDimensionScore}.`,
        }
      })()
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
const zaehler = { passed: 0, failed: 0, 'external-open': 0, 'not-measurable': 0 }
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
  const seit = vorherigerLauf?.generatedAt ? ` (letzter Lauf: ${vorherigerLauf.generatedAt})` : ''
  process.stdout.write(`MASSSTAB GEÄNDERT${seit} — dieser Lauf misst anders als der letzte:\n`)
  for (const zeile of formatiereMassstabAenderungen(massstabVergleich.aenderungen)) {
    process.stdout.write(`  · ${zeile}\n`)
  }
  process.stdout.write('\n')
}
process.stdout.write(`Bestanden:      ${zaehler.passed}\n`)
process.stdout.write(`Nicht belegt:   ${zaehler.failed}${zaehler.failed ? '  (echte Befunde an der App)' : ''}\n`)
// Eigene Zeile, und nur wenn es sie gibt. Zusammengezählt mit „nicht belegt" hat dieser
// Lauf am 9.8.2026 25 Mängel gemeldet, von denen keiner existierte.
if (zaehler['not-measurable']) {
  process.stdout.write(`NICHT GEMESSEN: ${zaehler['not-measurable']}  (die Prüfung kam nicht an die App — kein Urteil über sie)\n`)
}
process.stdout.write(`Live-Gates:     ${zaehler['external-open']}\n`)
process.stdout.write(`Qualität:       ${qualitaet.weightedScore} / 5  (Gold-, Kontrast- und Vollausgabe-Rubrik)\n`)
process.stdout.write(`Abdeckung:      ${Math.round(anteil * 100)} % der anwendbaren Evals frisch belegt\n`)
process.stdout.write(`Maßstab:        ${{
  geaendert: `GEÄNDERT — ${massstabVergleich.aenderungen.length} Änderung(en), Abschnitt oben`,
  unveraendert: 'unverändert gegenüber dem letzten Lauf',
  'kein-vergleichsstand': 'kein Vergleichsstand vom letzten Lauf — Schnappschuss jetzt hinterlegt',
}[massstabVergleich.status]}\n`)
process.stdout.write(`Ergebnis:       evals/results/fertigzustand-latest.json\n`)
const schwellenFehler = []
if (zaehler.failed) schwellenFehler.push(`${zaehler.failed} anwendbare Evals sind nicht bestanden.`)
// Ungemessen ist NICHT grün — der Lauf bleibt rot, bis gemessen wurde. Nur der Grund
// steht sauber getrennt da, damit niemand anfängt, heile Dinge zu reparieren.
if (zaehler['not-measurable']) {
  const gruende = [...new Set(ergebnisEvals.filter(e => e.status === 'not-measurable')
    .map(e => (e.note || '').replace(/^Nicht gemessen — /, '')))]
  schwellenFehler.push(`${zaehler['not-measurable']} Evals konnten nicht gemessen werden (kein Befund an der App):\n    ${gruende.join('\n    ')}`)
}
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
