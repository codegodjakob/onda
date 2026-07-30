export const ARGUMENT_CLAIM_KINDS = Object.freeze(['fact', 'definition', 'value', 'inference'])
export const ARGUMENT_CENTRALITY = Object.freeze(['central', 'supporting'])
export const ARGUMENT_VALIDITY = Object.freeze(['asserted', 'qualified', 'contested', 'withdrawn'])
export const ARGUMENT_EVIDENCE_STATUS = Object.freeze(['supported', 'mixed', 'insufficient', 'review-required', 'unverified'])
export const ARGUMENT_UNCERTAINTY = Object.freeze(['low', 'medium', 'high'])
export const ARGUMENT_RELATION_TYPES = Object.freeze(['supports', 'counters', 'qualifies', 'explains', 'depends-on'])
export const ARGUMENT_CONFIDENCE = Object.freeze(['low', 'medium', 'high'])

const CLAIM_KIND_SET = new Set(ARGUMENT_CLAIM_KINDS)
const CENTRALITY_SET = new Set(ARGUMENT_CENTRALITY)
const VALIDITY_SET = new Set(ARGUMENT_VALIDITY)
const EVIDENCE_STATUS_SET = new Set(ARGUMENT_EVIDENCE_STATUS)
const UNCERTAINTY_SET = new Set(ARGUMENT_UNCERTAINTY)
const RELATION_TYPE_SET = new Set(ARGUMENT_RELATION_TYPES)
const CONFIDENCE_SET = new Set(ARGUMENT_CONFIDENCE)

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  if (value === undefined) return undefined
  return JSON.parse(JSON.stringify(value))
}

function requiredText(value, label) {
  const result = typeof value === 'string' ? value.trim() : ''
  if (!result) throw new TypeError(`${label} is required`)
  return result
}

function normalizedEnum(value, allowed, label) {
  const result = requiredText(value, label)
  if (!allowed.has(result)) throw new TypeError(`${label} is invalid: ${result}`)
  return result
}

function normalizeProvenance(value) {
  if (!isObject(value)) throw new TypeError('Argument provenance is required')
  const result = {
    actor: requiredText(value.actor, 'Argument provenance actor'),
    action: requiredText(value.action, 'Argument provenance action'),
  }
  if (Array.isArray(value.originIds)) {
    result.originIds = [...new Set(value.originIds.map(item => String(item).trim()).filter(Boolean))]
  }
  return result
}

function normalizeAnchor(value) {
  if (!isObject(value)) throw new TypeError('Claim anchor is required')
  const exact = requiredText(value.exact, 'Claim anchor exact text')
  if (!Number.isInteger(value.start) || !Number.isInteger(value.end) || value.start < 0 || value.end <= value.start) {
    throw new TypeError('Claim anchor range is invalid')
  }
  if (value.end - value.start !== exact.length) {
    throw new TypeError('Claim anchor range must match exact text')
  }
  return {
    blockId: requiredText(value.blockId, 'Claim anchor blockId'),
    exact,
    start: value.start,
    end: value.end,
  }
}

function normalizeEvidenceRefs(value) {
  if (!Array.isArray(value)) throw new TypeError('Claim evidenceRefs must be an array')
  return value.map(reference => {
    if (!isObject(reference)) throw new TypeError('Claim evidence reference is invalid')
    const normalized = {}
    for (const key of ['sourceId', 'locatorId', 'bundleId']) {
      if (typeof reference[key] === 'string' && reference[key].trim()) normalized[key] = reference[key].trim()
    }
    if (!Object.keys(normalized).length) throw new TypeError('Claim evidence reference requires an id')
    return normalized
  })
}

export function ensureArgumentModel(project) {
  if (!isObject(project)) throw new TypeError('Project is required')
  const model = isObject(project.argumentModel) ? project.argumentModel : {}
  model.schemaVersion = 1
  for (const key of ['claims', 'relations', 'findings', 'paths', 'deliberations', 'events']) {
    if (!Array.isArray(model[key])) model[key] = []
  }
  if (!isObject(model.lastAnalysis)) model.lastAnalysis = null
  if (typeof project.id === 'string' && project.id.trim()) {
    for (const key of ['claims', 'relations', 'findings', 'paths', 'deliberations', 'events']) {
      model[key].forEach(entity => {
        if (isObject(entity) && !entity.projectId) entity.projectId = project.id
      })
    }
  }
  project.argumentModel = model
  return project
}

export function createArgumentClaim(input) {
  if (!isObject(input)) throw new TypeError('Argument claim is required')
  if (!Number.isFinite(input.createdAt)) throw new TypeError('Claim createdAt is required')
  const kind = normalizedEnum(input.kind, CLAIM_KIND_SET, 'Claim kind')
  const centrality = normalizedEnum(input.centrality, CENTRALITY_SET, 'Claim centrality')
  const validity = normalizedEnum(input.validity, VALIDITY_SET, 'Claim validity')
  return {
    id: requiredText(input.id, 'Claim id'),
    projectId: requiredText(input.projectId, 'Claim project'),
    textId: requiredText(input.textId, 'Claim text'),
    anchor: normalizeAnchor(input.anchor),
    text: requiredText(input.text, 'Claim text value'),
    kind,
    centrality,
    validity,
    evidenceStatus: normalizedEnum(input.evidenceStatus, EVIDENCE_STATUS_SET, 'Claim evidence status'),
    uncertainty: normalizedEnum(input.uncertainty, UNCERTAINTY_SET, 'Claim uncertainty'),
    evidenceRefs: normalizeEvidenceRefs(input.evidenceRefs),
    provenance: normalizeProvenance(input.provenance),
    fingerprint: requiredText(input.fingerprint, 'Claim fingerprint'),
    createdAt: input.createdAt,
    status: input.status === 'stale' ? 'stale' : 'active',
    origin: isObject(input.origin) ? clone(input.origin) : { kind, centrality, validity },
    corrections: Array.isArray(input.corrections) ? clone(input.corrections) : [],
  }
}

export function createArgumentRelation(input, { claims = [] } = {}) {
  if (!isObject(input)) throw new TypeError('Argument relation is required')
  if (!Number.isFinite(input.createdAt)) throw new TypeError('Relation createdAt is required')
  const projectId = requiredText(input.projectId, 'Relation project')
  const fromClaimId = requiredText(input.fromClaimId, 'Relation source claim')
  const toClaimId = requiredText(input.toClaimId, 'Relation target claim')
  if (fromClaimId === toClaimId) throw new TypeError('Relation self reference is not allowed')
  const from = claims.find(claim => claim?.id === fromClaimId)
  const to = claims.find(claim => claim?.id === toClaimId)
  if (!from || !to) throw new TypeError('Relation claims are required')
  if (from.projectId !== projectId || to.projectId !== projectId) {
    throw new TypeError('Relation project does not match both claims')
  }
  const type = normalizedEnum(input.type, RELATION_TYPE_SET, 'Relation type')
  const warrant = requiredText(input.warrant, 'Relation warrant')
  const confidence = normalizedEnum(input.confidence, CONFIDENCE_SET, 'Relation confidence')
  return {
    id: requiredText(input.id, 'Relation id'),
    projectId,
    fromClaimId,
    toClaimId,
    type,
    warrant,
    confidence,
    provenance: normalizeProvenance(input.provenance),
    createdAt: input.createdAt,
    origin: { type, warrant, confidence },
    corrections: Array.isArray(input.corrections) ? clone(input.corrections) : [],
  }
}

export function createArgumentEvent(input) {
  if (!isObject(input)) throw new TypeError('Argument event is required')
  if (!Number.isFinite(input.at)) throw new TypeError('Argument event time is required')
  return {
    id: requiredText(input.id, 'Argument event id'),
    projectId: requiredText(input.projectId, 'Argument event project'),
    kind: requiredText(input.kind, 'Argument event kind'),
    entityId: requiredText(input.entityId, 'Argument event entity'),
    snapshot: clone(input.snapshot ?? null),
    provenance: normalizeProvenance(input.provenance),
    at: input.at,
  }
}

export function appendArgumentEvent(model, event) {
  const next = ensureArgumentModel({ argumentModel: clone(model) }).argumentModel
  const normalized = createArgumentEvent(event)
  if (next.events.some(candidate => candidate?.id === normalized.id)) {
    throw new TypeError(`Duplicate argument event: ${normalized.id}`)
  }
  next.events.push(clone(normalized))
  return next
}

export function correctArgumentRelation({
  model,
  relationId,
  projectId,
  type,
  warrant,
  confidence,
  at,
}) {
  if (!Number.isFinite(at)) throw new TypeError('Relation correction time is required')
  const next = ensureArgumentModel({ argumentModel: clone(model) }).argumentModel
  const relation = next.relations.find(candidate => candidate?.id === relationId)
  if (!relation) throw new TypeError('Relation correction target is unknown')
  if (relation.projectId !== projectId) throw new TypeError('Relation correction project mismatch')
  const corrected = {
    type: normalizedEnum(type, RELATION_TYPE_SET, 'Relation type'),
    warrant: requiredText(warrant, 'Relation warrant'),
    confidence: normalizedEnum(confidence, CONFIDENCE_SET, 'Relation confidence'),
  }
  const previous = {
    type: relation.type,
    warrant: relation.warrant,
    confidence: relation.confidence,
  }
  const correction = {
    id: `argument-correction:${relation.id}:${at}`,
    ...corrected,
    provenance: { actor: 'user', action: 'relation-correct' },
    at,
  }
  relation.type = corrected.type
  relation.warrant = corrected.warrant
  relation.confidence = corrected.confidence
  relation.corrections = Array.isArray(relation.corrections) ? relation.corrections : []
  relation.corrections.push(correction)
  return appendArgumentEvent(next, createArgumentEvent({
    id: `argument-event:relation-corrected:${relation.id}:${at}`,
    projectId,
    kind: 'relation-corrected',
    entityId: relation.id,
    snapshot: { previous, next: corrected },
    provenance: correction.provenance,
    at,
  }))
}

export function correctArgumentClaim({
  model,
  claimId,
  projectId,
  kind,
  centrality,
  validity,
  at,
}) {
  if (!Number.isFinite(at)) throw new TypeError('Claim correction time is required')
  const next = ensureArgumentModel({ argumentModel: clone(model) }).argumentModel
  const claim = next.claims.find(candidate => candidate?.id === claimId)
  if (!claim) throw new TypeError('Claim correction target is unknown')
  if (claim.projectId !== projectId) throw new TypeError('Claim correction project mismatch')
  const corrected = {
    kind: normalizedEnum(kind, CLAIM_KIND_SET, 'Claim kind'),
    centrality: normalizedEnum(centrality, CENTRALITY_SET, 'Claim centrality'),
    validity: normalizedEnum(validity, VALIDITY_SET, 'Claim validity'),
  }
  const previous = {
    kind: claim.kind,
    centrality: claim.centrality,
    validity: claim.validity,
  }
  if (!isObject(claim.origin)) claim.origin = clone(previous)
  const correction = {
    id: `argument-correction:${claim.id}:${at}`,
    ...corrected,
    provenance: { actor: 'user', action: 'claim-correct' },
    at,
  }
  claim.kind = corrected.kind
  claim.centrality = corrected.centrality
  claim.validity = corrected.validity
  claim.corrections = Array.isArray(claim.corrections) ? claim.corrections : []
  claim.corrections.push(correction)
  return appendArgumentEvent(next, createArgumentEvent({
    id: `argument-event:claim-corrected:${claim.id}:${at}`,
    projectId,
    kind: 'claim-corrected',
    entityId: claim.id,
    snapshot: { previous, next: corrected },
    provenance: correction.provenance,
    at,
  }))
}

export function validateArgumentModelIntegrity({
  model,
  projectId,
}) {
  const normalizedProjectId = requiredText(projectId, 'Argument model project')
  const normalized = ensureArgumentModel({ argumentModel: clone(model) }).argumentModel
  const seenIds = new Set()
  const entities = [
    ...normalized.claims,
    ...normalized.relations,
    ...normalized.findings,
    ...normalized.paths,
    ...normalized.deliberations,
    ...normalized.events,
  ]
  entities.forEach(entity => {
    const id = requiredText(entity?.id, 'Argument entity id')
    if (seenIds.has(id)) throw new TypeError(`Duplicate argument entity: ${id}`)
    seenIds.add(id)
    if (entity?.projectId !== normalizedProjectId) {
      throw new TypeError(`Argument entity belongs to a foreign project: ${id}`)
    }
  })

  const claims = normalized.claims.map(createArgumentClaim)
  normalized.relations.forEach(relation => createArgumentRelation(relation, { claims }))
  normalized.events.forEach(createArgumentEvent)
  return true
}

export function validateArgumentEvidenceRefs({
  model,
  projectId,
  sources = [],
  evidenceBundles = [],
}) {
  const normalizedProjectId = requiredText(projectId, 'Argument evidence project')
  const sourceList = Array.isArray(sources) ? sources : []
  const bundleList = Array.isArray(evidenceBundles) ? evidenceBundles : []
  if (
    sourceList.some(source => source?.projectId !== normalizedProjectId)
    || bundleList.some(bundle => bundle?.projectId !== normalizedProjectId)
  ) {
    throw new TypeError('Argument evidence contains a foreign project')
  }
  const sourceIds = new Set(sourceList.map(source => source?.id).filter(Boolean))
  const locatorIds = new Set(sourceList.flatMap(source => (
    Array.isArray(source?.locators) ? source.locators.map(locator => locator?.id) : []
  )).filter(Boolean))
  const bundleIds = new Set(bundleList.map(bundle => bundle?.id).filter(Boolean))
  const claims = Array.isArray(model?.claims) ? model.claims : []
  if (claims.some(claim => claim?.projectId !== normalizedProjectId)) {
    throw new TypeError('Argument evidence contains a foreign project')
  }
  claims.forEach(claim => {
    ;(Array.isArray(claim?.evidenceRefs) ? claim.evidenceRefs : []).forEach(reference => {
      if (reference.sourceId && !sourceIds.has(reference.sourceId)) {
        throw new TypeError(`Argument evidence source is unknown: ${reference.sourceId}`)
      }
      if (reference.locatorId && !locatorIds.has(reference.locatorId)) {
        throw new TypeError(`Argument evidence locator is unknown: ${reference.locatorId}`)
      }
      if (reference.bundleId && !bundleIds.has(reference.bundleId)) {
        throw new TypeError(`Argument evidence bundle is unknown: ${reference.bundleId}`)
      }
    })
  })
  return true
}
