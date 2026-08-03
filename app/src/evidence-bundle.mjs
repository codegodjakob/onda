const FORBIDDEN_SCORE_KEY = /^(truthScore|truth_score|wahrheitsscore|globalScore|global_score|overallScore|overall_score|score)$/i
const QUALITY_DIMENSIONS = Object.freeze([
  'relevance',
  'method',
  'recency',
  'independence',
  'transparency',
  'sample',
  'conflicts',
  'convergence',
])
const PROPAGATING_EVENTS = new Set(['corrected', 'retracted', 'superseded', 'new-version', 'alternate-primary'])

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function validateNoGlobalTruthScore(value, path = 'assessment') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateNoGlobalTruthScore(entry, `${path}[${index}]`))
    return true
  }
  if (!isObject(value)) return true
  Object.entries(value).forEach(([key, entry]) => {
    if (FORBIDDEN_SCORE_KEY.test(key)) {
      throw new TypeError(`Global truth score is forbidden at ${path}.${key}`)
    }
    validateNoGlobalTruthScore(entry, `${path}.${key}`)
  })
  return true
}

function resolveReference(reference, projectId, sources, locators) {
  const source = sources.find(candidate => candidate?.id === reference?.sourceId)
  const locator = locators.find(candidate => candidate?.id === reference?.locatorId)
  const sameProject = source?.projectId === projectId && locator?.projectId === projectId
  const usable = Boolean(
    sameProject
    && locator.sourceId === source.id
    && source.status === 'active'
    && locator.verification?.status === 'verified',
  )
  return { ...clone(reference), usable }
}

export function buildEvidenceBundle(input, { sources = [], locators = [] } = {}) {
  if (!isObject(input)) throw new TypeError('Evidence bundle input is required')
  validateNoGlobalTruthScore(input)

  const projectId = text(input.projectId)
  const claimId = text(input.claimId)
  const claimText = text(input.claimText)
  if (!text(input.id) || !projectId || !claimId) throw new TypeError('Bundle id, project and claim are required')

  const support = (Array.isArray(input.support) ? input.support : [])
    .map(reference => resolveReference(reference, projectId, sources, locators))
  const counterEvidence = (Array.isArray(input.counterEvidence) ? input.counterEvidence : [])
    .map(reference => resolveReference(reference, projectId, sources, locators))
  const limitations = Array.isArray(input.limitations) ? input.limitations.map(text).filter(Boolean) : []
  const methodologicalDifferences = Array.isArray(input.methodologicalDifferences)
    ? input.methodologicalDifferences.map(text).filter(Boolean)
    : []
  const notSupported = Array.isArray(input.notSupported) ? input.notSupported.map(text).filter(Boolean) : []

  const values = {
    claimText,
    scope: text(input.scope),
    uncertainty: text(input.uncertainty),
    allowedStrength: text(input.allowedStrength),
  }
  const missingFields = Object.entries(values).filter(([, value]) => !value).map(([key]) => key)
  if (!support.length) missingFields.push('support')

  const unusableReference = [...support, ...counterEvidence].some(reference => !reference.usable)
  let status = 'supported'
  if (missingFields.length) status = 'insufficient'
  else if (unusableReference) status = 'review-required'
  else if (counterEvidence.some(reference => reference.usable)) status = 'mixed'

  return {
    id: text(input.id),
    projectId,
    claimId,
    claimText,
    support,
    counterEvidence,
    limitations,
    methodologicalDifferences,
    scope: values.scope,
    uncertainty: values.uncertainty,
    allowedStrength: values.allowedStrength,
    notSupported,
    qualityAssessments: Array.isArray(input.qualityAssessments) ? clone(input.qualityAssessments) : [],
    provenance: isObject(input.provenance)
      ? clone(input.provenance)
      : { actor: 'user', action: 'evidence-assemble' },
    status,
    missingFields: [...new Set(missingFields)],
    createdAt: Number.isFinite(input.createdAt) ? input.createdAt : null,
    history: Array.isArray(input.history) ? clone(input.history) : [],
  }
}

export function assessSourceForClaim(input) {
  if (!isObject(input) || !text(input.claimId) || !text(input.sourceId)) {
    throw new TypeError('Claim and source are required for a quality assessment')
  }
  validateNoGlobalTruthScore(input)
  const dimensions = QUALITY_DIMENSIONS.reduce((result, dimension) => {
    const candidate = input[dimension]
    if (!isObject(candidate) || !text(candidate.finding)) return result
    result[dimension] = {
      finding: text(candidate.finding),
      ...(text(candidate.strength) ? { strength: text(candidate.strength) } : {}),
    }
    return result
  }, {})
  if (!Object.keys(dimensions).length) throw new TypeError('At least one claim-relevant quality dimension is required')
  return {
    claimId: text(input.claimId),
    sourceId: text(input.sourceId),
    dimensions,
    conclusion: text(input.conclusion),
  }
}

export function propagateSourceEvent(bundles, event) {
  if (!Array.isArray(bundles) || !isObject(event) || !PROPAGATING_EVENTS.has(event.kind)) return bundles || []
  return bundles.map(bundle => {
    const references = [...(bundle.support || []), ...(bundle.counterEvidence || [])]
    if (!references.some(reference => reference.sourceId === event.sourceId)) return bundle
    const next = clone(bundle)
    const previousStatus = next.status
    next.status = 'review-required'
    next.history = Array.isArray(next.history) ? next.history : []
    next.history.push({
      eventId: event.id,
      sourceId: event.sourceId,
      kind: event.kind,
      at: event.at,
      reason: event.reason || null,
      previousStatus,
      nextStatus: 'review-required',
    })
    return next
  })
}
