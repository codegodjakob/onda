// Die Abarbeitung der geplanten Recherchewege — kein DOM; die Adapter kommen herein.
//
// Geht die Wege eines Recherchelaufs der Reihe nach durch, überspringt, was schon erledigt
// ist (research-run.mjs kennt den Fingerabdruck jedes Wegs), und schreibt jeden Fund in den
// Lauf zurück. Kein Weg wird zweimal bezahlt.
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js).
import { executeResearchTool, legalAlternativePaths } from './research-adapter.mjs'
import {
  appendResearchCandidate,
  canAttemptResearchPath,
  researchPathFingerprint,
  transitionResearchRun,
} from './research-run.mjs'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function pathCompleted(run, path) {
  const fingerprint = researchPathFingerprint(path)
  return (run.toolEvents || []).some(event => (
    event.pathFingerprint === fingerprint && event.status === 'completed'
  ))
}

function normalizedCandidate(candidate) {
  return {
    id: candidate?.id,
    relation: candidate?.relation,
    accessLevel: candidate?.accessLevel,
    originalRef: candidate?.originalRef,
    title: candidate?.title,
    sourceType: candidate?.sourceType,
    original: candidate?.original,
    locator: candidate?.locator,
    verification: candidate?.verification,
    limitation: candidate?.limitation,
  }
}

function erweitereUmLegaleZugaenge(run, result, adapter) {
  const fehler = result?.accessFailure
  if (!fehler || typeof fehler !== 'object') return run
  const vorhanden = new Set((run.searchPaths || []).map(path => researchPathFingerprint(path)))
  const ergaenzungen = legalAlternativePaths({
    title: fehler.title,
    doi: fehler.doi,
    sourceState: fehler.sourceState || 'inaccessible',
  }).filter(path => (
    run.allowedTools?.includes(path.tool)
    && adapter?.tools?.includes(path.tool)
    && !vorhanden.has(path.fingerprint)
  )).map(path => ({ ...path, legalAlternative: true }))
  if (!ergaenzungen.length) return run
  return { ...run, searchPaths: [...run.searchPaths, ...ergaenzungen] }
}

export async function executeResearchPaths(run, {
  adapter,
  signal = null,
  now = Date.now,
  idFactory = path => `research-event-${path.id}-${now()}`,
  onProgress = null,
} = {}) {
  if (run?.status !== 'running') throw new TypeError('Research run must be running')
  let current = clone(run)
  current.searchOutcomes = Array.isArray(current.searchOutcomes) ? current.searchOutcomes : []

  // Indexschleife bewusst: Ein fehlgeschlagener legaler Zugang kann waehrend des Laufs
  // zusaetzliche legale Pfade anhaengen. Ein for-of-Iterator bliebe am alten Array haengen,
  // sobald current durch die immutable Aktualisierung ersetzt wird.
  for (let pathIndex = 0; pathIndex < current.searchPaths.length; pathIndex += 1) {
    const path = current.searchPaths[pathIndex]
    if (pathCompleted(current, path)) continue
    if (!canAttemptResearchPath(current, path)) continue
    if (signal?.aborted) {
      return transitionResearchRun(current, 'paused', { at: now(), reason: 'user-pause' })
    }
    const outcome = await executeResearchTool(current, {
      adapter,
      tool: path.tool,
      input: path.input,
      sourceState: path.sourceState || null,
      signal,
    }, {
      now,
      idFactory: () => idFactory(path),
    })
    current = outcome.run
    const latestEvent = current.toolEvents.at(-1)
    const candidates = Array.isArray(outcome.result?.candidates) ? outcome.result.candidates : []
    current.searchOutcomes.push({
      pathId: path.id,
      purpose: path.purpose,
      status: latestEvent.status,
      found: candidates.length,
      resultRef: latestEvent.resultRef,
    })
    current = erweitereUmLegaleZugaenge(current, outcome.result, adapter)
    candidates.forEach(candidate => {
      if (current.candidates.length >= current.stopConditions.maxSources) return
      current = appendResearchCandidate(current, {
        ...normalizedCandidate(candidate),
        projectId: current.projectId,
        runId: current.id,
        claimId: current.claimId,
        status: 'research-material',
      })
    })
    if (typeof onProgress === 'function') await onProgress(clone(current))

    if (latestEvent.status === 'cancelled') {
      return transitionResearchRun(current, 'paused', { at: now(), reason: 'tool-cancelled' })
    }
    if (current.budget.consecutiveFailures >= current.stopConditions.maxConsecutiveFailures) {
      return transitionResearchRun(current, 'failed', { at: now(), reason: 'failure-stop-condition' })
    }
    if (current.budget.toolCalls >= current.stopConditions.maxToolCalls) break
  }

  return transitionResearchRun(current, 'review-ready', { at: now(), reason: 'planned-paths-complete' })
}
