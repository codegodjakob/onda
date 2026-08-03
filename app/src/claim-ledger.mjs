import {
  createArgumentClaim,
  createArgumentEvent,
  ensureArgumentModel,
} from './argument-model.mjs'

const CLAIM_ROLES = new Set(['claim', 'evidence', 'counterpoint', 'paragraph'])
const PREDICATE_WORDS = new Set([
  'ist', 'sind', 'war', 'waren', 'wird', 'werden', 'blieb', 'bleibt', 'bleiben',
  'hat', 'haben', 'kann', 'können', 'muss', 'müssen', 'soll', 'sollen',
  'darf', 'dürfen', 'sank', 'sinkt', 'stieg', 'steigt', 'umfasst', 'umfasste',
  'zeigt', 'zeigen', 'nennt', 'stützt', 'widerspricht', 'bedeutet', 'begrenzt',
  'trägt', 'folgt', 'erklärt', 'qualifiziert', 'senkt', 'erhöht', 'verringert',
])

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function stableHash(value) {
  let hash = 2166136261
  for (const character of String(value)) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function trimRange(source, start, end) {
  let nextStart = start
  let nextEnd = end
  while (nextStart < nextEnd && /\s/.test(source[nextStart])) nextStart += 1
  while (nextEnd > nextStart && /\s/.test(source[nextEnd - 1])) nextEnd -= 1
  return { start: nextStart, end: nextEnd }
}

function words(value) {
  return (value.match(/[\p{L}\p{N}%-]+/gu) || [])
}

function hasPredicate(value) {
  return words(value).some(word => {
    const normalized = word.toLocaleLowerCase('de-DE')
    return PREDICATE_WORDS.has(normalized) || /(?:iert|ierte|ierten|isierten|isierte)$/.test(normalized)
  })
}

function hasClause(value) {
  const tokens = words(value)
  return tokens.length >= 3 && hasPredicate(value)
}

function splitAtDelimiters(source, range) {
  const value = source.slice(range.start, range.end)
  const strong = /;\s*|,\s+(?:und|aber|doch|während)\s+/giu
  const match = strong.exec(value)
  if (match) {
    const delimiterStart = range.start + match.index
    const left = trimRange(source, range.start, delimiterStart)
    const right = trimRange(source, delimiterStart + match[0].length, range.end)
    if (hasClause(source.slice(left.start, left.end)) && hasClause(source.slice(right.start, right.end))) {
      return [...splitAtDelimiters(source, left), ...splitAtDelimiters(source, right)]
    }
  }

  const conjunction = /\s+und\s+/giu
  for (const candidate of value.matchAll(conjunction)) {
    const delimiterStart = range.start + candidate.index
    const left = trimRange(source, range.start, delimiterStart)
    const right = trimRange(source, delimiterStart + candidate[0].length, range.end)
    if (hasPredicate(source.slice(left.start, left.end)) && hasPredicate(source.slice(right.start, right.end))) {
      return [...splitAtDelimiters(source, left), ...splitAtDelimiters(source, right)]
    }
  }
  return [range]
}

export function splitAtomicClaims(value) {
  const source = String(value || '')
  const sentencePattern = /[^.!?]+[.!?]?/gu
  const ranges = []
  for (const match of source.matchAll(sentencePattern)) {
    const sentence = trimRange(source, match.index, match.index + match[0].length)
    if (sentence.end <= sentence.start) continue
    ranges.push(...splitAtDelimiters(source, sentence))
  }
  return ranges.reduce((result, range) => {
    const exact = source.slice(range.start, range.end)
    if (
      !exact
      || /^(?:[-*•]|\d+[.)])\s+/u.test(exact)
      || exact.endsWith('?')
      || words(exact).length < 3
      || !hasPredicate(exact)
    ) return result
    result.push({ text: exact, start: range.start, end: range.end })
    return result
  }, [])
}

function normalizeComparable(value) {
  return text(value)
    .toLocaleLowerCase('de-DE')
    .replace(/[.!?,;:]+$/u, '')
    .replace(/\s+/g, ' ')
}

function evidenceForClaim(claimText, bundles, projectId) {
  const target = normalizeComparable(claimText)
  const matching = bundles.filter(bundle => (
    bundle?.projectId === projectId
    && normalizeComparable(bundle.claimText) === target
  ))
  if (!matching.length) return { evidenceStatus: 'unverified', uncertainty: 'high', evidenceRefs: [] }

  const statuses = [...new Set(matching.map(bundle => (
    ['supported', 'mixed', 'insufficient', 'review-required'].includes(bundle.status)
      ? bundle.status
      : 'unverified'
  )))]
  let evidenceStatus = statuses[0]
  if (statuses.length > 1) evidenceStatus = 'mixed'
  const uncertainty = evidenceStatus === 'supported'
    ? 'low'
    : ['mixed', 'review-required'].includes(evidenceStatus) ? 'medium' : 'high'
  const evidenceRefs = matching.flatMap(bundle => {
    const references = [...(bundle.support || []), ...(bundle.counterEvidence || [])]
    if (!references.length) return [{ bundleId: bundle.id }]
    return references.map(reference => ({
      bundleId: bundle.id,
      ...(reference.sourceId ? { sourceId: reference.sourceId } : {}),
      ...(reference.locatorId ? { locatorId: reference.locatorId } : {}),
    }))
  })
  return { evidenceStatus, uncertainty, evidenceRefs }
}

function claimKind(value) {
  const normalized = normalizeComparable(value)
  if (/\b(?:bedeutet|definiert|bezeichnet)\b/u.test(normalized)) return 'definition'
  if (/\b(?:sollte|muss|müssen|soll|dürfen|darf)\b/u.test(normalized)) return 'value'
  if (/\b(?:daher|deshalb|folglich|somit)\b/u.test(normalized)) return 'inference'
  return 'fact'
}

function appendEventIfMissing(model, event) {
  if (model.events.some(candidate => candidate?.id === event.id)) return
  model.events.push(createArgumentEvent(event))
}

function derivedClaim(claim) {
  return ['text-claim', 'evidence-claim'].includes(claim?.provenance?.action)
}

export function synchronizeClaimLedger({
  projectId,
  model,
  texts = [],
  evidenceBundles = [],
  at = Date.now(),
}) {
  if (!text(projectId)) throw new TypeError('Claim ledger project is required')
  if (!Number.isFinite(at)) throw new TypeError('Claim ledger time is required')
  if (!Array.isArray(texts) || texts.some(item => item?.projectId !== projectId)) {
    throw new TypeError('Claim ledger text project mismatch')
  }
  const safeBundles = Array.isArray(evidenceBundles)
    ? evidenceBundles.filter(bundle => bundle?.projectId === projectId)
    : []
  const next = ensureArgumentModel({ argumentModel: clone(model) }).argumentModel
  const activeFingerprints = new Set()
  const suppliedTextIds = new Set(texts.map(item => item.textId))

  texts.forEach(textState => {
    const textId = text(textState.textId)
    if (!textId) throw new TypeError('Claim ledger text id is required')
    ;(Array.isArray(textState.blocks) ? textState.blocks : []).forEach(block => {
      if (
        !block?.id
        || ['bulletList', 'orderedList', 'taskList'].includes(block.type)
        || !CLAIM_ROLES.has(block.role || 'paragraph')
      ) return
      splitAtomicClaims(block.text).forEach(span => {
        const fingerprint = stableHash([
          projectId,
          textId,
          block.id,
          span.start,
          span.end,
          span.text,
        ].join('\u241f'))
        activeFingerprints.add(fingerprint)
        const evidence = evidenceForClaim(span.text, safeBundles, projectId)
        const existing = next.claims.find(claim => claim?.fingerprint === fingerprint)
        if (existing) {
          existing.evidenceStatus = evidence.evidenceStatus
          existing.uncertainty = evidence.uncertainty
          existing.evidenceRefs = evidence.evidenceRefs
          if (existing.status === 'stale') {
            existing.status = 'active'
            appendEventIfMissing(next, {
              id: `argument-event:claim-reactivated:${existing.id}:${at}`,
              projectId,
              kind: 'claim-reactivated',
              entityId: existing.id,
              snapshot: { fingerprint },
              provenance: { actor: 'agent', action: 'claim-ledger' },
              at,
            })
          }
          return
        }
        const id = `claim:${textId}:${block.id}:${fingerprint}`
        const claim = createArgumentClaim({
          id,
          projectId,
          textId,
          anchor: {
            blockId: block.id,
            exact: span.text,
            start: span.start,
            end: span.end,
          },
          text: span.text,
          kind: claimKind(span.text),
          centrality: block.role === 'claim' ? 'central' : 'supporting',
          validity: block.role === 'counterpoint' ? 'contested' : 'asserted',
          ...evidence,
          provenance: { actor: 'user', action: 'text-claim' },
          fingerprint,
          createdAt: at,
        })
        next.claims.push(claim)
        appendEventIfMissing(next, {
          id: `argument-event:claim-derived:${id}:${at}`,
          projectId,
          kind: 'claim-derived',
          entityId: id,
          snapshot: {
            textId,
            anchor: claim.anchor,
            evidenceStatus: claim.evidenceStatus,
          },
          provenance: { actor: 'agent', action: 'claim-ledger' },
          at,
        })
      })
    })
  })

  next.claims.forEach(claim => {
    if (
      claim?.projectId !== projectId
      || !suppliedTextIds.has(claim.textId)
      || activeFingerprints.has(claim.fingerprint)
      || !derivedClaim(claim)
      || claim.status === 'stale'
    ) return
    claim.status = 'stale'
    claim.evidenceStatus = 'review-required'
    claim.uncertainty = 'high'
    appendEventIfMissing(next, {
      id: `argument-event:claim-stale:${claim.id}:${at}`,
      projectId,
      kind: 'claim-stale',
      entityId: claim.id,
      snapshot: { fingerprint: claim.fingerprint, blockId: claim.anchor?.blockId || null },
      provenance: { actor: 'agent', action: 'claim-ledger' },
      at,
    })
  })
  next.lastAnalysis = {
    at,
    textIds: [...suppliedTextIds],
    activeClaimIds: next.claims.filter(claim => claim.status === 'active').map(claim => claim.id),
  }
  return next
}
