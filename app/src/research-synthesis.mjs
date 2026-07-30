import { importSource } from './source-model.mjs'
import { createLocator, resolveLocator } from './locator-model.mjs'
import { buildEvidenceBundle } from './evidence-bundle.mjs'
import { transitionResearchRun } from './research-run.mjs'

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function sourceKey(candidate) {
  return text(candidate.originalRef).toLocaleLowerCase('de')
}

export function inspectResearchCandidate(candidate) {
  if (!isObject(candidate)) throw new TypeError('Research candidate is required')
  const accessLevel = text(candidate.accessLevel)
  const maximumClaim = accessLevel === 'metadata'
    ? 'bibliographic-identity'
    : accessLevel === 'abstract'
      ? 'abstract-visible-content'
      : accessLevel === 'original-excerpt'
        ? 'original-visible-content'
        : 'none'
  const usableAsEvidence = Boolean(
    accessLevel === 'original-excerpt'
    && isObject(candidate.original)
    && isObject(candidate.locator)
    && text(candidate.locator.excerpt)
    && candidate.verification?.status === 'verified',
  )
  return {
    ...clone(candidate),
    accessLevel,
    maximumClaim,
    usableAsEvidence,
    evidenceStatus: usableAsEvidence ? 'candidate-verified' : 'research-material',
  }
}

export function buildResearchReview({ run, candidates = [], searchOutcomes = [] } = {}) {
  if (!run?.id || !run?.projectId || !run?.claimId) throw new TypeError('Research run is required')
  const seen = new Set()
  const support = []
  const counterEvidence = []
  const limitations = []
  const duplicates = []

  candidates.forEach(candidate => {
    if (candidate?.projectId !== run.projectId) throw new TypeError('Research candidate project mismatch')
    if (candidate?.runId !== run.id) throw new TypeError('Research candidate run mismatch')
    if (candidate?.claimId !== run.claimId) throw new TypeError('Research candidate claim mismatch')
    const inspected = inspectResearchCandidate(candidate)
    const key = sourceKey(inspected) || `candidate:${inspected.id}`
    if (seen.has(key)) {
      duplicates.push(inspected)
      return
    }
    seen.add(key)
    if (inspected.relation === 'counters') counterEvidence.push(inspected)
    else if (inspected.relation === 'limits') limitations.push(inspected)
    else support.push(inspected)
  })

  const notes = []
  const openGaps = []
  for (const purpose of ['counter-evidence', 'limitations']) {
    const outcomes = searchOutcomes.filter(outcome => outcome?.purpose === purpose)
    const completed = outcomes.some(outcome => outcome.status === 'completed')
    const found = outcomes.reduce((sum, outcome) => sum + (Number.isFinite(outcome.found) ? outcome.found : 0), 0)
    if (!completed) {
      openGaps.push(purpose)
    } else if (found === 0) {
      notes.push(purpose === 'counter-evidence'
        ? 'Gegenbelegsuche abgeschlossen; kein Gegenbeleg gefunden.'
        : 'Grenzensuche abgeschlossen; keine methodische Grenze gefunden.')
    }
  }

  return {
    runId: run.id,
    projectId: run.projectId,
    claimId: run.claimId,
    claimText: run.claimText,
    support,
    counterEvidence,
    limitations,
    duplicates,
    notes,
    openGaps,
    conflictStatus: counterEvidence.length ? 'mixed' : support.length ? 'support-only' : 'insufficient',
    createdAt: run.updatedAt,
  }
}

function originForCandidate(candidate) {
  const sourceType = text(candidate.sourceType) || 'web'
  if (sourceType === 'text') return { kind: 'pasted-text', immutableRef: candidate.originalRef }
  if (sourceType === 'doi') return { kind: 'doi', immutableRef: candidate.originalRef, originalUrl: candidate.originalRef }
  if (['web'].includes(sourceType) || /^https:\/\//.test(candidate.originalRef)) {
    return { kind: 'url', immutableRef: candidate.originalRef, originalUrl: candidate.originalRef }
  }
  return { kind: 'file', immutableRef: candidate.originalRef }
}

export async function commitResearchReview({
  project,
  run,
  review,
  at = Date.now(),
} = {}, {
  sha256,
} = {}) {
  if (!project?.id || project.id !== run?.projectId || review?.projectId !== project.id) {
    return { committed: false, project, run, error: 'project-mismatch' }
  }
  if (!['running', 'review-ready'].includes(run.status)) {
    return { committed: false, project, run, error: 'run-not-reviewable' }
  }
  if (typeof sha256 !== 'function') return { committed: false, project, run, error: 'checksum-unavailable' }

  const selected = [...(review.support || []), ...(review.counterEvidence || []), ...(review.limitations || [])]
  if (!selected.length || !(review.support || []).length) {
    return { committed: false, project, run, error: 'verified-support-required' }
  }
  if (selected.some(candidate => !candidate.usableAsEvidence)) {
    return { committed: false, project, run, error: 'unverified-candidate' }
  }

  try {
    const nextProject = clone(project)
    nextProject.sources = Array.isArray(nextProject.sources) ? nextProject.sources : []
    nextProject.evidenceBundles = Array.isArray(nextProject.evidenceBundles) ? nextProject.evidenceBundles : []
    const importedSources = []
    const locators = []
    const referencesByCandidate = new Map()

    for (const candidate of selected) {
      if (nextProject.sources.some(source => source?.origin?.immutableRef === candidate.originalRef)) {
        throw new TypeError('duplicate-source')
      }
      const source = await importSource({
        id: `source-${run.id}-${candidate.id}`,
        projectId: project.id,
        type: candidate.sourceType || 'web',
        origin: originForCandidate(candidate),
        original: candidate.original,
        metadata: {
          title: { value: candidate.title || 'Recherchequelle', status: 'confirmed' },
        },
        importedAt: at,
        provenance: { actor: 'agent', action: 'research-import' },
      }, { sha256 })
      const locator = await createLocator({
        id: `locator-${run.id}-${candidate.id}`,
        projectId: project.id,
        sourceId: source.id,
        claimId: run.claimId,
        claimText: run.claimText,
        kind: candidate.locator.kind,
        address: candidate.locator.address,
        excerpt: candidate.locator.excerpt,
        provenance: { actor: 'agent', action: 'research-locator' },
      }, { sha256 })
      const resolved = await resolveLocator({ projectId: project.id, source, locator, sha256 })
      if (resolved.status !== 'verified') throw new TypeError(`locator-${resolved.reason || 'unverified'}`)
      locator.verification = resolved.verification
      source.locators.push(locator)
      importedSources.push(source)
      locators.push(locator)
      referencesByCandidate.set(candidate.id, { sourceId: source.id, locatorId: locator.id })
    }

    const support = review.support.map(candidate => ({ ...referencesByCandidate.get(candidate.id), relation: 'supports' }))
    const counterEvidence = review.counterEvidence.map(candidate => ({ ...referencesByCandidate.get(candidate.id), relation: 'counters' }))
    const limitationTexts = review.limitations
      .map(candidate => text(candidate.limitation) || text(candidate.locator?.excerpt))
      .filter(Boolean)
    const bundle = buildEvidenceBundle({
      id: `bundle-${run.id}`,
      projectId: project.id,
      claimId: run.claimId,
      claimText: run.claimText,
      support,
      counterEvidence,
      limitations: limitationTexts,
      methodologicalDifferences: review.methodologicalDifferences || [],
      scope: review.scope || 'Gilt nur im von den sichtbaren Originalfundstellen beschriebenen Kontext.',
      uncertainty: review.uncertainty || (counterEvidence.length
        ? 'Die Befunde widersprechen einander; Richtung und Reichweite bleiben offen.'
        : 'Außerhalb der geprüften Fundstellen bleibt die Übertragbarkeit offen.'),
      allowedStrength: review.allowedStrength || (counterEvidence.length
        ? 'Als gemischte Beleglage formulieren, nicht als gesicherten Effekt.'
        : 'Nur als Befund der geprüften Quelle formulieren.'),
      notSupported: review.notSupported || ['Keine Verallgemeinerung über die geprüfte Population und Situation hinaus.'],
      provenance: { actor: 'agent', action: 'research-commit' },
      createdAt: at,
    }, { sources: importedSources, locators })

    nextProject.sources.push(...importedSources)
    nextProject.evidenceBundles.push(bundle)
    const reviewableRun = run.status === 'review-ready'
      ? run
      : transitionResearchRun(run, 'review-ready', { at, reason: 'verified-review-complete' })
    const completedRun = transitionResearchRun(reviewableRun, 'completed', { at, reason: 'verified-results-committed' })
    completedRun.candidates = selected.map(candidate => ({ ...clone(candidate), status: 'committed' }))
    completedRun.review = clone(review)
    const index = Array.isArray(nextProject.researchRuns)
      ? nextProject.researchRuns.findIndex(candidate => candidate?.id === run.id)
      : -1
    if (!Array.isArray(nextProject.researchRuns)) nextProject.researchRuns = []
    if (index >= 0) nextProject.researchRuns[index] = completedRun
    else nextProject.researchRuns.push(completedRun)
    return { committed: true, project: nextProject, run: completedRun, bundle }
  } catch (error) {
    return { committed: false, project, run, error: text(error?.message) || 'research-commit-failed' }
  }
}
