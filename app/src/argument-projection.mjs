import {
  createArgumentEvent,
  createArgumentRelation,
  ensureArgumentModel,
} from './argument-model.mjs'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function relationPlan(claim, central, role) {
  if (claim.kind === 'definition') {
    return {
      fromClaimId: central.id,
      toClaimId: claim.id,
      type: 'depends-on',
      warrant: 'Die zentrale Aussage hängt von der im selben Text ausdrücklich gesetzten Begriffsgrenze ab.',
    }
  }
  if (role === 'evidence') {
    return {
      fromClaimId: claim.id,
      toClaimId: central.id,
      type: 'supports',
      warrant: 'Der als Beleg markierte Baustein wird der einzigen zentralen Aussage dieses Textes zugeordnet.',
    }
  }
  if (role === 'counterpoint') {
    return {
      fromClaimId: claim.id,
      toClaimId: central.id,
      type: 'counters',
      warrant: 'Der als Gegenposition markierte Baustein wird der einzigen zentralen Aussage dieses Textes gegenübergestellt.',
    }
  }
  return null
}

export function deriveSafeBlockRelations({
  model,
  projectId,
  blocks = [],
  at = Date.now(),
}) {
  if (typeof projectId !== 'string' || !projectId.trim()) throw new TypeError('Argument projection project is required')
  if (!Number.isFinite(at)) throw new TypeError('Argument projection time is required')
  const next = ensureArgumentModel({ argumentModel: clone(model) }).argumentModel
  if (
    next.claims.some(claim => claim?.projectId !== projectId)
    || next.relations.some(relation => relation?.projectId !== projectId)
  ) {
    throw new TypeError('Argument projection contains a foreign project')
  }
  const roles = new Map((Array.isArray(blocks) ? blocks : []).map(block => [block?.id, block?.role]))
  const activeClaims = next.claims.filter(claim => claim?.status !== 'stale')
  const textIds = [...new Set(activeClaims.map(claim => claim.textId))]

  textIds.forEach(textId => {
    const textClaims = activeClaims.filter(claim => claim.textId === textId)
    const centralClaims = textClaims.filter(claim => claim.centrality === 'central')
    if (centralClaims.length !== 1) return
    const central = centralClaims[0]
    textClaims.forEach(claim => {
      if (claim.id === central.id) return
      const plan = relationPlan(claim, central, roles.get(claim.anchor?.blockId))
      if (!plan) return
      const existing = next.relations.find(relation => (
        relation.fromClaimId === plan.fromClaimId && relation.toClaimId === plan.toClaimId
      ))
      if (existing) return
      const relation = createArgumentRelation({
        id: `argument-relation:auto:${plan.type}:${plan.fromClaimId}:${plan.toClaimId}`,
        projectId,
        ...plan,
        confidence: 'medium',
        provenance: {
          actor: 'agent',
          action: 'safe-block-relation',
          originIds: [claim.anchor.blockId, central.anchor.blockId],
        },
        createdAt: at,
      }, { claims: activeClaims })
      next.relations.push(relation)
      const eventId = `argument-event:relation-derived:${relation.id}:${at}`
      if (!next.events.some(event => event?.id === eventId)) {
        next.events.push(createArgumentEvent({
          id: eventId,
          projectId,
          kind: 'relation-derived',
          entityId: relation.id,
          snapshot: {
            type: relation.type,
            fromClaimId: relation.fromClaimId,
            toClaimId: relation.toClaimId,
          },
          provenance: relation.provenance,
          at,
        }))
      }
    })
  })
  return next
}
