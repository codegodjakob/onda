#!/usr/bin/env node

import { execFile as execFileCallback, spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { containsSecretMarker, processArgumentsAreSecretFree, redactSecrets } from '../src/eval-redaction.mjs'

const execFile = promisify(execFileCallback)
const here = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(here, '..')
const repositoryRoot = resolve(appRoot, '..')
const executable = resolve(repositoryRoot, 'Onda.app/Contents/MacOS/Onda')
const evidencePath = resolve(here, 'results/native-live-latest.json')
const work = await mkdtemp(resolve(tmpdir(), 'onda-live-probe-'))
const resultPath = resolve(work, 'result.json')
const childArguments = ['--llm-probe', resultPath]

if (!processArgumentsAreSecretFree([executable, ...childArguments])) {
  throw new Error('Native-Probe abgebrochen: unsichere Prozessargumente.')
}

let child = null
let stdout = ''
let stderr = ''
try {
  child = spawn(executable, childArguments, {
    cwd: repositoryRoot,
    env: { ...process.env, AIWT_DATA_DIR: resolve(work, 'data') },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout.on('data', chunk => { stdout += chunk.toString('utf8') })
  child.stderr.on('data', chunk => { stderr += chunk.toString('utf8') })

  // Prüft den tatsächlich gestarteten Prozess, gibt seine Argumente aber nie aus.
  try {
    const processSnapshot = await execFile('ps', ['-p', String(child.pid), '-o', 'command='], { maxBuffer: 1024 * 1024 })
    if (!processArgumentsAreSecretFree([processSnapshot.stdout])) {
      throw new Error('Native-Probe abgebrochen: Geheimnismuster in Prozessargumenten.')
    }
  } catch (error) {
    if (error?.message?.includes('Geheimnismuster')) throw error
    throw new Error('Native-Prozessargumente konnten nicht sicher geprüft werden.')
  }

  const completion = await new Promise((resolveExit, rejectExit) => {
    let forceTimer = null
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
      forceTimer = setTimeout(() => child.kill('SIGKILL'), 2_000)
    }, 190_000)
    child.once('error', error => {
      clearTimeout(timeout)
      if (forceTimer) clearTimeout(forceTimer)
      rejectExit(error)
    })
    child.once('exit', (code, signal) => {
      clearTimeout(timeout)
      if (forceTimer) clearTimeout(forceTimer)
      resolveExit({ code, signal, timedOut })
    })
  })
  if (completion.timedOut) {
    const evidence = {
      passed: false,
      keyPresent: null,
      requestCount: null,
      nativeRequestCount: null,
      task: 'hinweise',
      model: 'claude-opus-5',
      durationMs: 190_000,
      usage: null,
      annotationKind: null,
      schemaValid: false,
      errorType: 'keychain-authorization-timeout',
      processArgumentsSecretFree: true,
      processStopped: true,
    }
    await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
    throw new Error('Native-Probe überschritt 190 Sekunden und wurde vollständig beendet.')
  }

  // Auch unvorhergesehene native Ausgaben werden nie sichtbar oder persistent.
  if (containsSecretMarker(stdout) || containsSecretMarker(stderr)) {
    throw new Error('Native-Probe erzeugte eine unsichere Prozessausgabe.')
  }
  const raw = await readFile(resultPath, 'utf8')
  const safe = redactSecrets(raw)
  if (safe !== raw || containsSecretMarker(safe)) {
    throw new Error('Native-Probe erzeugte einen unsicheren Ergebnisbeleg.')
  }
  const result = JSON.parse(safe)
  const passed = completion.code === 0
    && result.passed === true
    && result.keyPresent === true
    && result.requestCount === 1
    && result.nativeRequestCount === 1
    && result.schemaValid === true
    && typeof result.annotationKind === 'string'
  const evidence = { ...result, processArgumentsSecretFree: true, passed }
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
  process.stdout.write(`Native Live-Probe: ${passed ? 'PASS' : 'FAIL'} · 1 Anfrage · ${result.annotationKind || 'keine Anmerkungsart'} · ${result.durationMs || 0} ms\n`)
  if (!passed) process.exitCode = 1
} finally {
  if (child && child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM')
    await new Promise(resolveWait => {
      const force = setTimeout(() => { child.kill('SIGKILL'); resolveWait() }, 2_000)
      child.once('exit', () => { clearTimeout(force); resolveWait() })
    })
  }
  await rm(work, { recursive: true, force: true })
}
