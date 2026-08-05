#!/usr/bin/env node

import { execFile as execFileCallback } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { flattenEvals, ladeEvalKatalog } from '../src/eval-catalog.mjs'
import { containsSecretMarker, redactSecrets } from '../src/eval-redaction.mjs'

const execFile = promisify(execFileCallback)
const here = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(here, '..')
const logRoot = resolve(here, 'results/onda-ui-runs')
const qualitativeRubricPath = resolve(here, 'onda-ui-rubric.json')
const liveNative = process.argv.includes('--live-native')
const resultName = liveNative ? 'onda-ui-live-latest.json' : 'onda-ui-automated-latest.json'
const resultPath = resolve(here, 'results', resultName)
const iterationArgument = process.argv.find(argument => argument.startsWith('--iteration='))
const iteration = Number(iterationArgument?.split('=')[1] || process.env.ITERATION || 1)

const checks = [
  {
    id: 'contract',
    command: process.execPath,
    args: ['--test', 'test/annotation-contract.test.mjs', 'test/annotation-schema.test.mjs', 'test/onda-design-contract.test.mjs'],
  },
  {
    id: 'operations',
    command: process.execPath,
    args: ['--test', 'test/annotation-operations.test.mjs', 'test/annotation-controller.test.mjs'],
  },
  {
    id: 'gateway',
    command: process.execPath,
    args: ['--test', 'test/agent-gateway.test.mjs', 'test/agent-tasks.test.mjs'],
  },
  {
    id: 'workspace',
    command: process.execPath,
    args: ['--test', 'test/workspace-model.test.mjs'],
  },
  {
    id: 'browser',
    command: process.execPath,
    args: ['test/onda-ui-smoke.mjs'],
  },
  {
    id: 'accessibility',
    command: process.execPath,
    args: ['test/d2-accessibility.test.mjs'],
  },
  {
    id: 'build',
    command: 'npm',
    args: ['run', 'build'],
  },
]
if (liveNative) {
  checks.push({
    id: 'native-live',
    command: process.execPath,
    args: ['evals/run-native-live-probe.mjs'],
  })
}
Object.freeze(checks)

const criterionChecks = Object.freeze({
  'ONDA-UI-01': ['contract', 'browser'],
  'ONDA-UI-02': ['contract', 'browser'],
  'ONDA-UI-03': ['contract', 'gateway', 'browser'],
  'ONDA-UI-04': ['operations', 'browser'],
  'ONDA-UI-05': ['operations', 'browser'],
  'ONDA-UI-06': ['operations', 'browser'],
  'ONDA-UI-07': ['operations', 'browser'],
  'ONDA-UI-08': ['operations', 'browser'],
  'ONDA-UI-09': ['contract', 'browser'],
  'ONDA-UI-10': ['contract', 'browser'],
  'ONDA-UI-11': ['operations', 'browser'],
  'ONDA-UI-12': ['operations', 'browser'],
  'ONDA-UI-13': ['operations', 'workspace', 'browser'],
  'ONDA-UI-14': ['operations', 'browser'],
  'ONDA-UI-15': ['contract', 'workspace', 'browser'],
  'ONDA-UI-16': ['browser'],
  'ONDA-UI-17': ['accessibility', 'browser'],
  'ONDA-UI-18': ['native-live'],
  'ONDA-UI-19': ['contract', 'operations', 'gateway', 'workspace', 'browser', 'accessibility', 'build'],
  'ONDA-UI-20': ['contract', 'browser'],
  'ONDA-UI-21': ['gateway', 'browser'],
  'ONDA-UI-22': ['workspace', 'browser'],
})

const rubricDimensions = Object.freeze([
  ['designSystem', 'Designsystemtreue', ['ONDA-UI-01', 'ONDA-UI-16']],
  ['caseFit', 'Passende Gestalt je Anwendungsfall', ['ONDA-UI-02', 'ONDA-UI-03', 'ONDA-UI-04', 'ONDA-UI-05', 'ONDA-UI-06', 'ONDA-UI-07', 'ONDA-UI-08', 'ONDA-UI-09', 'ONDA-UI-10']],
  ['hierarchyCalm', 'Visuelle Hierarchie und Ruhe', ['ONDA-UI-11', 'ONDA-UI-14', 'ONDA-UI-20']],
  ['interactionSafety', 'Entscheidungsklarheit und Reversibilität', ['ONDA-UI-04', 'ONDA-UI-12', 'ONDA-UI-13']],
  ['responsive', 'Responsive Robustheit', ['ONDA-UI-16']],
  ['accessibility', 'Barrierefreiheit', ['ONDA-UI-17']],
  ['reliability', 'Funktionale Zuverlässigkeit', ['ONDA-UI-15', 'ONDA-UI-18', 'ONDA-UI-19', 'ONDA-UI-21', 'ONDA-UI-22']],
])

async function runCheck(check) {
  const startedAt = Date.now()
  let passed = false
  let output = ''
  try {
    const result = await execFile(check.command, check.args, {
      cwd: appRoot,
      timeout: 300_000,
      maxBuffer: 32 * 1024 * 1024,
      env: { ...process.env, NO_COLOR: '1' },
    })
    output = `${result.stdout || ''}\n${result.stderr || ''}`
    passed = true
  } catch (error) {
    output = `${error.stdout || ''}\n${error.stderr || ''}\n${error.message || error}`
  }
  const safeOutput = redactSecrets(output)
  if (containsSecretMarker(safeOutput)) throw new Error(`Redaktion fehlgeschlagen: ${check.id}`)
  const logPath = resolve(logRoot, `${check.id}.log`)
  await writeFile(logPath, safeOutput, 'utf8')
  return {
    id: check.id,
    passed,
    durationMs: Date.now() - startedAt,
    evidence: `evals/results/onda-ui-runs/${check.id}.log`,
    command: [check.command, ...check.args].join(' '),
  }
}

await mkdir(logRoot, { recursive: true })
const checkResults = []
for (const check of checks) {
  process.stdout.write(`Prüfe ${check.id} … `)
  const result = await runCheck(check)
  checkResults.push(result)
  process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'}\n`)
}

const catalog = await ladeEvalKatalog(resolve(here, 'v2-fertigzustand.json'))
const uiEntries = flattenEvals(catalog).filter(entry => entry.id.startsWith('ONDA-UI-'))
const byCheck = new Map(checkResults.map(result => [result.id, result]))
const criteria = uiEntries.map(entry => {
  if (entry.id === 'ONDA-UI-18') {
    if (liveNative) {
      const evidence = [byCheck.get('native-live')].filter(Boolean)
      const passed = evidence.length === 1 && evidence[0].passed
      return {
        criterion: entry.id,
        title: entry.title,
        gate: entry.gate,
        status: passed ? 'passed' : 'failed',
        score: passed ? 5 : 0,
        evidence: evidence.map(result => ({
          kind: result.id,
          path: result.evidence,
          command: result.command,
          durationMs: result.durationMs,
        })),
      }
    }
    return {
      criterion: entry.id,
      title: entry.title,
      gate: entry.gate,
      status: 'not-run',
      score: null,
      evidence: [],
      note: 'Bewusst ausgelassen: Ohne --live-native greift der Lauf nie auf einen echten Schlüssel zu.',
    }
  }
  const required = criterionChecks[entry.id] || []
  const evidence = required.map(id => byCheck.get(id)).filter(Boolean)
  const passed = required.length > 0 && evidence.every(result => result.passed)
  return {
    criterion: entry.id,
    title: entry.title,
    gate: entry.gate,
    status: passed ? 'passed' : 'failed',
    score: passed ? 5 : 0,
    evidence: evidence.map(result => ({
      kind: result.id,
      path: result.evidence,
      command: result.command,
      durationMs: result.durationMs,
    })),
  }
})

const qualitativeRubric = JSON.parse(await readFile(qualitativeRubricPath, 'utf8'))
const dimensions = Object.fromEntries(rubricDimensions.map(([id, label, ids]) => [id, {
  label,
  score: qualitativeRubric.current.dimensions[id].score,
  rationale: qualitativeRubric.current.dimensions[id].rationale,
  evidence: ids,
}]))
const dimensionScores = Object.values(dimensions).map(item => item.score)
const average = Number((dimensionScores.reduce((sum, score) => sum + score, 0) / dimensionScores.length).toFixed(2))
const automatable = liveNative ? criteria : criteria.filter(item => item.criterion !== 'ONDA-UI-18')
const hardGatesPass = automatable.every(item => item.status === 'passed')
const gitCommit = (await execFile('git', ['rev-parse', 'HEAD'], { cwd: appRoot })).stdout.trim()

const report = {
  schemaVersion: 1,
  catalogVersion: catalog.catalogVersion,
  generatedAt: new Date().toISOString(),
  gitCommit,
  mode: liveNative ? 'live-native' : 'without-live',
  iteration,
  threshold: 4.6,
  criteria,
  rubric: {
    source: 'evals/onda-ui-rubric.json',
    iteration: qualitativeRubric.current.iteration,
    dimensions,
    average,
    passed: average >= qualitativeRubric.threshold,
  },
  summary: {
    passed: criteria.filter(item => item.status === 'passed').length,
    failed: criteria.filter(item => item.status === 'failed').length,
    notRun: criteria.filter(item => item.status === 'not-run').length,
    automatableHardGatesPass: hardGatesPass,
  },
}

const safeReport = redactSecrets(JSON.stringify(report, null, 2))
if (containsSecretMarker(safeReport)) throw new Error('Der Onda-UI-Bericht enthält ein Geheimnismuster.')
await mkdir(dirname(resultPath), { recursive: true })
await writeFile(resultPath, `${safeReport}\n`, 'utf8')
process.stdout.write(`Onda UI: ${report.summary.passed}/${criteria.length} bestanden, ${report.summary.notRun} bewusst ausgelassen, Score ${average}/5\n`)
process.stdout.write(`Ergebnis: evals/results/${resultName}\n`)
if (!hardGatesPass || !report.rubric.passed || (liveNative && report.summary.failed)) process.exitCode = 1
