// Aus dem Argumentmodell wird ein Graph: Aussagen als Knoten, Beziehungen als Kanten.
// Darauf sitzen die Untersuchungen — welche Aussage hängt in der Luft, welcher Widerspruch
// bleibt unbeantwortet (analyzeArgumentGraph), was zieht eine Änderung nach sich
// (analyzeArgumentImpact), und wie werden Befunde über Läufe hinweg zusammengeführt, statt
// bei jedem Lauf neu zu entstehen. Rein rechnend, kein DOM, node-testbar.
//
// Gehört zur Browser-App (src/editor.js): benutzt von argument-ui.mjs und
// source-library-ui.mjs, beide eingebunden über src/workspace.js.
import {
  createArgumentEvent,
  ensureArgumentModel,
} from './argument-model.mjs'

const CHANGE_KINDS = new Set(['claim', 'definition', 'source', 'decision', 'relation'])
const IMPACT_RELATION_TYPES = new Set(['supports', 'qualifies', 'explains', 'depends-on'])

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function requiredText(value, label) {
  const result = typeof value === 'string' ? value.trim() : ''
  if (!result) throw new TypeError(`${label} is required`)
  return result
}

function validateProject(model, projectId) {
  const normalizedProjectId = requiredText(projectId, 'Argument graph project')
  const foreignClaim = (model.claims || []).find(claim => claim?.projectId !== normalizedProjectId)
  const foreignRelation = (model.relations || []).find(relation => relation?.projectId !== normalizedProjectId)
  const foreignFinding = (model.findings || []).find(finding => finding?.projectId && finding.projectId !== normalizedProjectId)
  if (foreignClaim || foreignRelation || foreignFinding) {
    throw new TypeError('Argument graph contains a foreign project')
  }
  return normalizedProjectId
}

function dependencyDirection(relation) {
  return relation.type === 'depends-on'
    ? { source: relation.toClaimId, target: relation.fromClaimId }
    : { source: relation.fromClaimId, target: relation.toClaimId }
}

export function buildArgumentGraph(model, { projectId } = {}) {
  const normalized = ensureArgumentModel({ argumentModel: clone(model) }).argumentModel
  const activeClaims = normalized.claims.filter(claim => claim?.status !== 'stale')
  validateProject({ ...normalized, claims: activeClaims }, projectId)
  const nodes = new Map(activeClaims.map(claim => [claim.id, claim]))
  const outgoing = new Map(activeClaims.map(claim => [claim.id, new Set()]))
  const incoming = new Map(activeClaims.map(claim => [claim.id, new Set()]))
  const relationFlow = new Map()

  normalized.relations.forEach(relation => {
    if (!nodes.has(relation.fromClaimId) || !nodes.has(relation.toClaimId)) return
    const direction = dependencyDirection(relation)
    outgoing.get(direction.source).add(direction.target)
    incoming.get(direction.target).add(direction.source)
    relationFlow.set(relation.id, direction)
  })
  return { projectId, nodes, outgoing, incoming, relationFlow }
}

function canonicalCycle(cycle) {
  const open = cycle.slice(0, -1)
  const rotations = open.map((_, index) => {
    const rotated = [...open.slice(index), ...open.slice(0, index)]
    return [...rotated, rotated[0]]
  })
  return rotations.sort((a, b) => a.join('\u241f').localeCompare(b.join('\u241f')))[0]
}

function detectCycles(graph) {
  const state = new Map()
  const stack = []
  const cycles = []
  const seen = new Set()

  function visit(nodeId) {
    state.set(nodeId, 1)
    stack.push(nodeId)
    for (const nextId of graph.outgoing.get(nodeId) || []) {
      if (!state.has(nextId)) {
        visit(nextId)
      } else if (state.get(nextId) === 1) {
        const index = stack.lastIndexOf(nextId)
        const canonical = canonicalCycle([...stack.slice(index), nextId])
        const key = canonical.join('\u241f')
        if (!seen.has(key)) {
          seen.add(key)
          cycles.push(canonical)
        }
      }
    }
    stack.pop()
    state.set(nodeId, 2)
  }

  for (const nodeId of graph.nodes.keys()) {
    if (!state.has(nodeId)) visit(nodeId)
  }
  return cycles.sort((a, b) => a.join('\u241f').localeCompare(b.join('\u241f')))
}

function reachableFrom(graph, startId) {
  const visited = new Set([startId])
  const queue = [startId]
  while (queue.length) {
    const current = queue.shift()
    for (const next of graph.outgoing.get(current) || []) {
      if (visited.has(next)) continue
      visited.add(next)
      queue.push(next)
    }
  }
  return visited
}

function basisFingerprint(parts) {
  return parts.map(value => String(value || '')).join('\u241f')
}

export function analyzeArgumentGraph(model, { projectId, at = Date.now() } = {}) {
  if (!Number.isFinite(at)) throw new TypeError('Argument graph analysis time is required')
  const normalized = ensureArgumentModel({ argumentModel: clone(model) }).argumentModel
  const graph = buildArgumentGraph(normalized, { projectId })
  const cycles = detectCycles(graph)
  const findings = []

  graph.nodes.forEach(claim => {
    if (
      claim.centrality === 'central'
      && ['unverified', 'insufficient', 'review-required'].includes(claim.evidenceStatus)
    ) {
      findings.push({
        id: `argument-finding:gap:${claim.id}`,
        projectId,
        kind: 'gap',
        claimId: claim.id,
        status: 'open',
        basisFingerprint: basisFingerprint([claim.fingerprint, claim.evidenceStatus]),
        createdAt: at,
      })
    }
  })

  normalized.relations.forEach(relation => {
    if (typeof relation?.warrant === 'string' && relation.warrant.trim()) return
    findings.push({
      id: `argument-finding:missing-warrant:${relation.id}`,
      projectId,
      kind: 'missing-warrant',
      relationId: relation.id,
      claimId: relation.toClaimId,
      status: 'open',
      basisFingerprint: basisFingerprint([relation.id, relation.type]),
      createdAt: at,
    })
  })

  const rootCandidates = [...graph.nodes.values()].filter(claim => (
    (graph.outgoing.get(claim.id)?.size || 0) >= 2
    && ['unverified', 'insufficient', 'review-required'].includes(claim.evidenceStatus)
  ))
  rootCandidates.forEach(root => {
    const reachable = reachableFrom(graph, root.id)
    const dependentFindings = findings.filter(finding => (
      finding.kind === 'gap'
      && finding.claimId !== root.id
      && reachable.has(finding.claimId)
    ))
    if (dependentFindings.length < 2) return
    findings.push({
      id: `argument-finding:root:${root.id}`,
      projectId,
      kind: 'root-cause',
      claimId: root.id,
      dependentFindingIds: dependentFindings.map(finding => finding.id),
      status: 'open',
      basisFingerprint: basisFingerprint([root.fingerprint, ...dependentFindings.map(finding => finding.basisFingerprint)]),
      createdAt: at,
    })
    dependentFindings.forEach(finding => {
      finding.status = 'parked'
      finding.rootCauseClaimId = root.id
    })
  })

  cycles.forEach(cycle => {
    findings.push({
      id: `argument-finding:cycle:${cycle.slice(0, -1).join(':')}`,
      projectId,
      kind: 'cycle',
      claimIds: cycle.slice(0, -1),
      cycle,
      status: 'open',
      basisFingerprint: basisFingerprint(cycle),
      createdAt: at,
    })
  })

  return { graph, cycles, findings }
}

function seedClaims(model, change) {
  if (change.kind === 'claim' || change.kind === 'definition') {
    return model.claims.filter(claim => claim.id === change.entityId).map(claim => claim.id)
  }
  if (change.kind === 'source') {
    return model.claims.filter(claim => (
      (claim.evidenceRefs || []).some(reference => reference.sourceId === change.entityId)
    )).map(claim => claim.id)
  }
  if (change.kind === 'relation') {
    const relation = model.relations.find(candidate => candidate?.id === change.entityId)
    if (!relation) return []
    return [dependencyDirection(relation).target]
  }
  return model.claims.filter(claim => (
    claim.provenance?.originIds?.includes(change.entityId)
    || (
      change.kind === 'decision'
      && change.textId
      && claim.textId === change.textId
      && (!change.blockId || claim.anchor?.blockId === change.blockId)
    )
  )).map(claim => claim.id)
}

function buildImpactOutgoing(model, graph) {
  const outgoing = new Map([...graph.nodes.keys()].map(claimId => [claimId, new Set()]))
  model.relations.forEach(relation => {
    if (!IMPACT_RELATION_TYPES.has(relation.type)) return
    const flow = graph.relationFlow.get(relation.id)
    if (!flow || !outgoing.has(flow.source) || !outgoing.has(flow.target)) return
    outgoing.get(flow.source).add(flow.target)
  })
  return outgoing
}

export function analyzeArgumentImpact({
  model,
  projectId,
  change,
  at = Date.now(),
}) {
  if (!Number.isFinite(at)) throw new TypeError('Argument impact time is required')
  if (!change || !CHANGE_KINDS.has(change.kind)) throw new TypeError('Argument impact change kind is invalid')
  const fingerprint = requiredText(change.fingerprint, 'Argument impact fingerprint')
  const reason = requiredText(change.reason, 'Argument impact reason')
  const next = ensureArgumentModel({ argumentModel: clone(model) }).argumentModel
  const graph = buildArgumentGraph(next, { projectId })
  const impactOutgoing = buildImpactOutgoing(next, graph)
  const seeds = seedClaims(next, change)
  const affected = new Set()
  const queue = [...seeds]
  while (queue.length) {
    const current = queue.shift()
    if (affected.has(current)) continue
    affected.add(current)
    for (const dependent of impactOutgoing.get(current) || []) {
      if (!affected.has(dependent)) queue.push(dependent)
    }
  }

  const affectedClaimIds = next.claims.filter(claim => affected.has(claim.id)).map(claim => claim.id)
  const affectedRelationIds = next.relations.filter(relation => {
    if (!IMPACT_RELATION_TYPES.has(relation.type)) return false
    const flow = graph.relationFlow.get(relation.id)
    return flow && affected.has(flow.source) && affected.has(flow.target)
  }).map(relation => relation.id)
  const affectedFindingIds = next.findings.filter(finding => (
    affected.has(finding.claimId)
    || affected.has(finding.rootCauseClaimId)
    || (finding.claimIds || []).some(id => affected.has(id))
  )).map(finding => finding.id)

  const review = { status: 'review-required', reason, fingerprint, at }
  next.claims.forEach(claim => {
    if (affected.has(claim.id)) claim.review = clone(review)
  })
  next.relations.forEach(relation => {
    if (affectedRelationIds.includes(relation.id)) relation.review = clone(review)
  })
  next.findings.forEach(finding => {
    if (affectedFindingIds.includes(finding.id)) finding.review = clone(review)
  })

  const affectedEvidenceRefs = next.claims
    .filter(claim => affected.has(claim.id))
    .flatMap(claim => claim.evidenceRefs || [])
  const affectedAnchors = next.claims
    .filter(claim => affected.has(claim.id))
    .map(claim => clone(claim.anchor))
  const event = createArgumentEvent({
    id: `argument-event:impact:${change.kind}:${change.entityId}:${at}`,
    projectId,
    kind: 'impact-analyzed',
    entityId: change.entityId,
    snapshot: {
      changeKind: change.kind,
      fingerprint,
      reason,
      affectedClaimIds,
      affectedRelationIds,
      affectedFindingIds,
    },
    provenance: { actor: 'agent', action: 'impact-analysis' },
    at,
  })
  if (!next.events.some(candidate => candidate?.id === event.id)) next.events.push(event)

  return {
    model: next,
    impact: {
      change: clone(change),
      affectedClaimIds,
      affectedRelationIds,
      affectedFindingIds,
      affectedEvidenceRefs,
      affectedAnchors,
    },
  }
}

export function reconcileArgumentRegression({
  finding,
  projectId,
  basisFingerprint: nextBasis,
  reason,
  at = Date.now(),
}) {
  if (!finding || finding.projectId !== projectId) throw new TypeError('Argument regression project mismatch')
  if (!Number.isFinite(at)) throw new TypeError('Argument regression time is required')
  const basisFingerprintValue = requiredText(nextBasis, 'Argument regression basis fingerprint')
  const next = clone(finding)
  if (next.basisFingerprint === basisFingerprintValue) return next
  next.status = 'open'
  next.basisFingerprint = basisFingerprintValue
  next.reopenReason = requiredText(reason, 'Argument regression reason')
  next.reopenedAt = at
  return next
}

export function mergeArgumentFindings({
  previous = [],
  analyzed = [],
  projectId,
  at = Date.now(),
}) {
  if (!Number.isFinite(at)) throw new TypeError('Argument finding merge time is required')
  const old = Array.isArray(previous) ? previous : []
  const fresh = Array.isArray(analyzed) ? analyzed : []
  if (
    old.some(finding => finding?.projectId && finding.projectId !== projectId)
    || fresh.some(finding => finding?.projectId && finding.projectId !== projectId)
  ) {
    throw new TypeError('Argument finding merge project mismatch')
  }
  const freshIds = new Set(fresh.map(finding => finding.id))
  const merged = fresh.map(finding => {
    const existing = old.find(candidate => candidate?.id === finding.id)
    if (!existing) return clone(finding)
    if (existing.basisFingerprint === finding.basisFingerprint) {
      return { ...clone(finding), ...clone(existing), basisFingerprint: finding.basisFingerprint }
    }
    return reconcileArgumentRegression({
      finding: existing,
      projectId,
      basisFingerprint: finding.basisFingerprint,
      reason: 'Die argumentative Grundlage dieses Befunds hat sich geändert.',
      at,
    })
  })
  old
    .filter(finding => finding?.status === 'resolved' && !freshIds.has(finding.id))
    .forEach(finding => merged.push(clone(finding)))
  return merged
}

export function resolveArgumentFinding({
  model,
  projectId,
  findingId,
  resolution,
  at = Date.now(),
}) {
  if (!Number.isFinite(at)) throw new TypeError('Argument finding resolution time is required')
  const next = ensureArgumentModel({ argumentModel: clone(model) }).argumentModel
  const finding = next.findings.find(candidate => candidate?.id === findingId)
  if (!finding) throw new TypeError('Argument finding is unknown')
  if (finding.projectId !== projectId) throw new TypeError('Argument finding project mismatch')
  finding.status = 'resolved'
  finding.resolution = requiredText(resolution, 'Argument finding resolution')
  finding.resolvedAt = at
  const event = createArgumentEvent({
    id: `argument-event:finding-resolved:${finding.id}:${at}`,
    projectId,
    kind: 'finding-resolved',
    entityId: finding.id,
    snapshot: {
      basisFingerprint: finding.basisFingerprint,
      resolution: finding.resolution,
    },
    provenance: { actor: 'user', action: 'finding-resolve' },
    at,
  })
  if (next.events.some(candidate => candidate?.id === event.id)) {
    throw new TypeError(`Duplicate argument event: ${event.id}`)
  }
  next.events.push(event)
  return next
}
