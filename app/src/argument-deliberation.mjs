import {
  createArgumentEvent,
  ensureArgumentModel,
} from './argument-model.mjs'

const EVIDENCE_RANK = Object.freeze({
  supported: 5,
  mixed: 4,
  'review-required': 2,
  insufficient: 1,
  unverified: 0,
})
const CONFIDENCE_RANK = Object.freeze({ high: 3, medium: 2, low: 1 })

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function requiredText(value, label) {
  const result = typeof value === 'string' ? value.trim() : ''
  if (!result) throw new TypeError(`${label} is required`)
  return result
}

function projectClaims(model, projectId) {
  const claims = (model.claims || []).filter(claim => claim?.status !== 'stale')
  if (
    claims.some(claim => claim.projectId !== projectId)
    || (model.relations || []).some(relation => relation?.projectId !== projectId)
  ) {
    throw new TypeError('Argument deliberation contains a foreign project')
  }
  return claims
}

function centralClaim(model, projectId, centralClaimId) {
  const claims = projectClaims(model, projectId)
  const central = claims.find(claim => claim.id === centralClaimId)
  if (!central) throw new TypeError('Central claim is unknown')
  return { claims, central }
}

function counterScore(claim, relation) {
  return (EVIDENCE_RANK[claim.evidenceStatus] || 0) * 100
    + (CONFIDENCE_RANK[relation.confidence] || 0) * 10
    + Math.min((claim.evidenceRefs || []).length, 9)
}

function bundleLimitations(claim, bundles, projectId) {
  const bundleIds = new Set((claim.evidenceRefs || []).map(reference => reference.bundleId).filter(Boolean))
  return [...new Set((Array.isArray(bundles) ? bundles : [])
    .filter(bundle => (
      bundle?.projectId === projectId
      && (bundleIds.has(bundle.id) || bundle.claimText === claim.text)
    ))
    .flatMap(bundle => Array.isArray(bundle.limitations) ? bundle.limitations : [])
    .map(required => String(required).trim())
    .filter(Boolean))]
}

export function selectStrongestCounterargument({
  model,
  projectId,
  centralClaimId,
  evidenceBundles = [],
}) {
  const normalized = ensureArgumentModel({ argumentModel: clone(model) }).argumentModel
  const { claims, central } = centralClaim(normalized, projectId, centralClaimId)
  const candidates = normalized.relations
    .filter(relation => (
      relation.projectId === projectId
      && relation.type === 'counters'
      && relation.toClaimId === central.id
    ))
    .map(relation => ({
      relation,
      claim: claims.find(claim => claim.id === relation.fromClaimId),
    }))
    .filter(candidate => (
      candidate.claim
      && ['supported', 'mixed'].includes(candidate.claim.evidenceStatus)
      && candidate.claim.evidenceRefs?.length
    ))
    .sort((a, b) => (
      counterScore(b.claim, b.relation) - counterScore(a.claim, a.relation)
      || a.claim.id.localeCompare(b.claim.id)
    ))

  if (!candidates.length) {
    return {
      status: 'insufficient',
      centralClaimId,
      reason: 'Kein direkt belegtes Gegenargument im Projektmaterial.',
    }
  }
  const strongest = candidates[0]
  const effect = (
    central.evidenceStatus === 'mixed'
    || /\b(?:allgemein|alle|immer|grundsätzlich|generell)\b/iu.test(central.text)
  ) ? 'qualifies' : 'reconsider'
  return {
    status: 'found',
    centralClaimId,
    counterClaim: clone(strongest.claim),
    relation: clone(strongest.relation),
    evidenceRefs: clone(strongest.claim.evidenceRefs),
    limitations: bundleLimitations(strongest.claim, evidenceBundles, projectId),
    impact: {
      targetClaimId: central.id,
      effect,
      reason: effect === 'qualifies'
        ? 'Der Gegenbefund begrenzt die Reichweite der allgemeinen Wirkungsaussage.'
        : 'Der Gegenbefund verlangt eine erneute Abwägung der zentralen Aussage.',
    },
  }
}

function activeClaim(claims, id) {
  return claims.find(claim => claim.id === id && claim.status !== 'stale')
}

function pathBase(id, strategy, central, premiseClaim, bridge, perspective, evidenceStrategy, impact, risk) {
  return {
    id,
    strategy,
    premiseClaimId: premiseClaim.id,
    premise: premiseClaim.text,
    bridge,
    centralClaimId: central.id,
    claim: central.text,
    perspective,
    evidenceStrategy,
    impact,
    risk,
  }
}

export function validateArgumentPaths(paths) {
  const list = Array.isArray(paths) ? paths : []
  const required = ['strategy', 'premiseClaimId', 'premise', 'bridge', 'perspective', 'evidenceStrategy', 'impact', 'risk']
  const complete = list.length >= 2 && list.every(path => (
    required.every(key => typeof path?.[key] === 'string' && path[key].trim())
  ))
  const signatures = new Set(list.map(path => [
    path.premiseClaimId,
    path.bridge,
    path.perspective,
    path.evidenceStrategy,
  ].map(value => String(value || '').trim().toLocaleLowerCase('de-DE')).join('\u241f')))
  const strategies = new Set(list.map(path => path?.strategy))
  return {
    valid: Boolean(complete && signatures.size === list.length && strategies.size === list.length),
    distinctSignatures: signatures.size,
    complete,
  }
}

export function generateArgumentPaths({
  model,
  projectId,
  centralClaimId,
  counterargument = null,
}) {
  const normalized = ensureArgumentModel({ argumentModel: clone(model) }).argumentModel
  const { claims, central } = centralClaim(normalized, projectId, centralClaimId)
  const paths = []

  const supportRelation = normalized.relations.find(relation => {
    const premise = activeClaim(claims, relation.fromClaimId)
    return relation.projectId === projectId
      && relation.type === 'supports'
      && relation.toClaimId === central.id
      && premise
      && ['supported', 'mixed'].includes(premise.evidenceStatus)
      && premise.evidenceRefs?.length
  })
  if (supportRelation) {
    const premise = activeClaim(claims, supportRelation.fromClaimId)
    paths.push(pathBase(
      `argument-path:evidence-first:${central.id}`,
      'evidence-first',
      central,
      premise,
      supportRelation.warrant,
      'Vom engsten Originalbefund zur qualifizierten Kernaussage.',
      'Zuerst Fundstelle und Reichweite, danach die Kernaussage.',
      'Die Begründung beginnt prüfbar und macht die Schlussbrücke früh sichtbar.',
      'Der Weg trägt nur so weit wie Population, Messung und Unsicherheit des Ausgangsbelegs.',
    ))
  }

  if (counterargument?.status === 'found') {
    const premise = activeClaim(claims, counterargument.counterClaim.id)
    if (premise) {
      paths.push(pathBase(
        `argument-path:objection-first:${central.id}`,
        'objection-first',
        central,
        premise,
        counterargument.relation.warrant,
        'Vom stärksten fairen Einwand zur begrenzten eigenen Position.',
        'Gegenbeleg und Grenze zuerst, danach verbleibende Stützung und qualifizierte These.',
        'Der Weg nimmt den naheliegenden Einwand ernst und erhöht die argumentative Fairness.',
        'Der Einwand kann die zentrale Aussage stärker einschränken als ursprünglich beabsichtigt.',
      ))
    }
  }

  const dependency = normalized.relations.find(relation => (
    relation.projectId === projectId
    && relation.type === 'depends-on'
    && relation.fromClaimId === central.id
    && activeClaim(claims, relation.toClaimId)?.kind === 'definition'
  ))
  if (dependency) {
    const premise = activeClaim(claims, dependency.toClaimId)
    paths.push(pathBase(
      `argument-path:definition-first:${central.id}`,
      'definition-first',
      central,
      premise,
      dependency.warrant,
      'Von der Begriffsgrenze über den Geltungsbereich zur Kernaussage.',
      'Definition und Messgrenze zuerst, danach Belege nur innerhalb dieses Rahmens.',
      'Der Weg verhindert, dass ein mehrdeutiger Begriff die Schlussfolgerung still erweitert.',
      'Eine umstrittene oder zu enge Definition kann die gesamte Argumentation verschieben.',
    ))
  }

  const validation = validateArgumentPaths(paths)
  if (!validation.valid) {
    return {
      status: 'insufficient',
      centralClaimId,
      paths: [],
      reason: 'Der Graph trägt noch keine zwei substanziell verschiedenen Argumentationswege.',
    }
  }
  return { status: 'ready', centralClaimId, paths, validation }
}

function normalizeRoundEntry(kind, entry) {
  if (!entry || !Number.isFinite(entry.at)) throw new TypeError(`Deliberation ${kind} time is required`)
  const actor = requiredText(entry.actor, `Deliberation ${kind} actor`)
  if (!['user', 'agent'].includes(actor)) throw new TypeError(`Deliberation ${kind} actor is invalid`)
  return {
    kind,
    text: requiredText(entry.text, `Deliberation ${kind}`),
    actor,
    at: entry.at,
  }
}

export function createDeliberationRound(input, { claims = [] } = {}) {
  const projectId = requiredText(input?.projectId, 'Deliberation project')
  const claimId = requiredText(input?.claimId, 'Deliberation claim')
  const claim = claims.find(candidate => candidate?.id === claimId)
  if (!claim || claim.projectId !== projectId) throw new TypeError('Deliberation project does not match claim')
  const entries = [
    normalizeRoundEntry('critique', input.critique),
    normalizeRoundEntry('response', input.response),
    normalizeRoundEntry('revision', input.revision),
  ]
  if (!(entries[0].at < entries[1].at && entries[1].at < entries[2].at)) {
    throw new TypeError('Deliberation entries must be chronological')
  }
  return {
    id: requiredText(input.id, 'Deliberation id'),
    projectId,
    claimId,
    entries,
    createdAt: entries[0].at,
    completedAt: entries[2].at,
  }
}

export function appendDeliberationRound(model, round) {
  const next = ensureArgumentModel({ argumentModel: clone(model) }).argumentModel
  if (next.deliberations.some(candidate => candidate?.id === round?.id)) {
    throw new TypeError(`Duplicate deliberation round: ${round?.id}`)
  }
  const entries = Array.isArray(round?.entries) ? round.entries : []
  const normalized = createDeliberationRound({
    id: round?.id,
    projectId: round?.projectId,
    claimId: round?.claimId,
    critique: entries.find(entry => entry?.kind === 'critique'),
    response: entries.find(entry => entry?.kind === 'response'),
    revision: entries.find(entry => entry?.kind === 'revision'),
  }, { claims: next.claims })
  next.deliberations.push(normalized)
  const event = createArgumentEvent({
    id: `argument-event:deliberation:${normalized.id}:${normalized.completedAt}`,
    projectId: normalized.projectId,
    kind: 'deliberation-recorded',
    entityId: normalized.id,
    snapshot: {
      claimId: normalized.claimId,
      entryKinds: normalized.entries.map(entry => entry.kind),
    },
    provenance: { actor: 'user', action: 'deliberation-complete' },
    at: normalized.completedAt,
  })
  if (next.events.some(candidate => candidate?.id === event.id)) {
    throw new TypeError(`Duplicate argument event: ${event.id}`)
  }
  next.events.push(event)
  return next
}
