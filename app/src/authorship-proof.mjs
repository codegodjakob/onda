import { buildProjectProvenanceSnapshot } from './provenance-model.mjs'

const ACTIVITY_BY_KIND = Object.freeze({
  'agent-proposal-adopted': 'Formulierungsvorschläge wurden wortgleich übernommen.',
  'agent-proposal-edited': 'Formulierungsvorschläge wurden verändert übernommen.',
  'agent-analysis': 'Textanalyse und Hinweise wurden bereitgestellt.',
})
const ACTIVITY_ORDER = Object.freeze([
  'agent-proposal-adopted',
  'agent-proposal-edited',
  'agent-analysis',
])

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function requiredText(value, label) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) throw new TypeError(`${label} is required`)
  return normalized
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map(key => (
      `${JSON.stringify(key)}:${stableJson(value[key])}`
    )).join(',')}}`
  }
  return JSON.stringify(value)
}

function stableHash(value) {
  let hash = 2166136261
  for (const character of String(value)) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function normalizedText(value) {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ')
    : ''
}

function contribution({
  id,
  projectId,
  textId,
  kind,
  actor,
  activity,
  originEventIds,
  observedAt = null,
}) {
  return {
    id: requiredText(id, 'Authorship contribution'),
    projectId,
    textId,
    kind,
    actor,
    activity,
    originEventIds: [...new Set(originEventIds.filter(Boolean))],
    observedAt: Number.isFinite(observedAt) ? observedAt : null,
    basis: 'local-observable-event',
  }
}

function compareContributions(a, b) {
  return (
    (a.observedAt ?? Number.MAX_SAFE_INTEGER) - (b.observedAt ?? Number.MAX_SAFE_INTEGER)
    || a.id.localeCompare(b.id, 'de')
  )
}

function decisionContribution({ projectId, doc, finding, decision }) {
  const proposal = normalizedText(finding.action || finding.target)
  const applied = normalizedText(decision.appliedText || decision.resultingText)
  const base = {
    id: `authorship:${doc.id}:${decision.id}`,
    projectId,
    textId: doc.id,
    originEventIds: [finding.id, decision.id],
    observedAt: decision.at,
  }
  if (decision.kind === 'reject') {
    return contribution({
      ...base,
      kind: 'agent-proposal-not-adopted',
      actor: 'user',
      activity: 'Ein Agentenvorschlag wurde nicht übernommen.',
    })
  }
  if (decision.kind !== 'accept' || !proposal || !applied) return null
  if (proposal === applied) {
    return contribution({
      ...base,
      kind: 'agent-proposal-adopted',
      actor: 'agent',
      activity: ACTIVITY_BY_KIND['agent-proposal-adopted'],
    })
  }
  return contribution({
    ...base,
    kind: 'agent-proposal-edited',
    actor: 'user-and-agent',
    activity: ACTIVITY_BY_KIND['agent-proposal-edited'],
  })
}

export function buildAuthorshipProof({ project, docs = [] } = {}) {
  if (!isObject(project)) throw new TypeError('Authorship project is required')
  const projectId = requiredText(project.id, 'Authorship project')
  const projectDocs = (Array.isArray(docs) ? docs : [])
    .filter(doc => isObject(doc) && doc.projectId === projectId && typeof doc.id === 'string')
  const docIds = new Set(projectDocs.map(doc => doc.id))
  const snapshot = buildProjectProvenanceSnapshot({ project, docs: projectDocs })
  const contributions = []

  snapshot.records.filter(record => record.kind === 'user-text' && record.actor === 'user')
    .forEach(record => {
      contributions.push(contribution({
        id: `authorship:${record.id}:user-original`,
        projectId,
        textId: record.id,
        kind: 'user-original',
        actor: 'user',
        activity: 'Nutzertext wurde lokal erfasst.',
        originEventIds: [record.id],
        observedAt: record.createdAt,
      }))
    })

  projectDocs.forEach(doc => {
    const findings = (Array.isArray(doc.findings) ? doc.findings : [])
      .filter(finding => isObject(finding) && finding.provenance?.actor === 'agent')
    const findingById = new Map(findings.map(finding => [finding.id, finding]))
    const decidedFindingIds = new Set()
    ;(Array.isArray(doc.decisions) ? doc.decisions : []).filter(isObject).forEach(decision => {
      const finding = findingById.get(decision.findingId)
      if (!finding) return
      decidedFindingIds.add(finding.id)
      const mapped = decisionContribution({ projectId, doc, finding, decision })
      if (mapped) contributions.push(mapped)
    })
    findings.filter(finding => !decidedFindingIds.has(finding.id)).forEach(finding => {
      contributions.push(contribution({
        id: `authorship:${doc.id}:${finding.id}:analysis`,
        projectId,
        textId: doc.id,
        kind: 'agent-analysis',
        actor: 'agent',
        activity: ACTIVITY_BY_KIND['agent-analysis'],
        originEventIds: [finding.id],
        observedAt: finding.createdAt,
      }))
    })
  })

  ;(Array.isArray(project.languageReports?.decisions) ? project.languageReports.decisions : [])
    .filter(event => (
      isObject(event)
      && event.projectId === projectId
      && docIds.has(event.textId)
      && event.provenance?.actor === 'user'
    ))
    .forEach(event => {
      contributions.push(contribution({
        id: `authorship:${event.textId}:${event.id}`,
        projectId,
        textId: event.textId,
        kind: 'user-review-decision',
        actor: 'user',
        activity: 'Der Nutzer hat eine Analyse oder Wirkungshypothese bewertet.',
        originEventIds: [event.id],
        observedAt: event.at,
      }))
    })

  contributions.sort(compareContributions)
  const structural = {
    schemaVersion: 1,
    kind: 'private-observable-authorship-proof',
    projectId,
    generatedFrom: 'local-observable-events',
    observationLimit: 'Nicht beobachtete Beiträge werden nicht geschätzt.',
    contributions,
  }
  return {
    ...structural,
    fingerprint: stableHash(stableJson(structural)),
  }
}

export function buildAiUsageDeclaration({ proof, enabled } = {}) {
  if (enabled !== true) return null
  if (!isObject(proof) || proof.kind !== 'private-observable-authorship-proof') {
    throw new TypeError('Observable authorship proof is required')
  }
  const projectId = requiredText(proof.projectId, 'AI usage project')
  const contributions = Array.isArray(proof.contributions) ? proof.contributions : []
  const activities = []
  const sourceEventIds = []
  ACTIVITY_ORDER.forEach(kind => {
    const matching = contributions.filter(item => item?.kind === kind)
    if (!matching.length) return
    activities.push(ACTIVITY_BY_KIND[kind])
    matching.forEach(item => sourceEventIds.push(...(item.originEventIds || [])))
  })
  const uniqueSourceEventIds = [...new Set(sourceEventIds)]
  const status = activities.length ? 'documented' : 'no-observed-agent-contribution'
  return {
    schemaVersion: 1,
    kind: 'ai-usage-declaration',
    projectId,
    status,
    activities,
    statement: activities.length
      ? `Dokumentierte KI-Nutzung: ${activities.join(' ')}`
      : 'Im lokalen Verlauf ist kein übernommener Agentenbeitrag und keine Agentenanalyse dokumentiert.',
    sourceEventIds: uniqueSourceEventIds,
    basis: 'local-observable-events',
  }
}
