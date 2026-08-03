import { auditCitationConsistency, auditQuotationOrParaphrase } from './citation-audit.mjs'

export const FINAL_AUDIT_RULE_VERSION = '2026-07-30.1'
export const FINAL_AUDIT_MODEL_VERSION = 1

const GROUPS = Object.freeze([
  ['integrity', 'Integrität'],
  ['evidence', 'Belege'],
  ['citation', 'Zitation'],
  ['accepted-risk', 'Angenommene Risiken'],
  ['other', 'Weitere Hinweise'],
  ['style', 'Stil'],
])
const GROUP_RANK = new Map(GROUPS.map(([kind], index) => [kind, index]))
const PRIORITY_RANK = Object.freeze({ critical: 0, high: 1, normal: 2, low: 3 })
const STATUS_RANK = Object.freeze({
  open: 0,
  parked: 1,
  'risk-accepted': 2,
  resolved: 3,
  dismissed: 4,
  superseded: 5,
})
const INTEGRITY_CATEGORIES = new Set(['fact', 'method', 'logic'])
const CRITICAL_CATEGORIES = new Set(['fact', 'source', 'citation', 'method', 'logic'])
const STYLE_CATEGORIES = new Set(['wording', 'register', 'style'])
const WEAK_EVIDENCE = new Set(['insufficient', 'review-required', 'unverified'])

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

function groupFor(category, status) {
  if (status === 'risk-accepted') return 'accepted-risk'
  if (INTEGRITY_CATEGORIES.has(category)) return 'integrity'
  if (category === 'source' || category === 'evidence') return 'evidence'
  if (category === 'citation') return 'citation'
  if (STYLE_CATEGORIES.has(category)) return 'style'
  return 'other'
}

function normalizedStatus(finding, openIds) {
  const status = String(finding?.status || 'open')
  if (status === 'open' && finding?.rootCauseId && openIds.has(finding.rootCauseId)) {
    return 'parked'
  }
  return Object.hasOwn(STATUS_RANK, status) ? status : 'open'
}

function isScientific(project) {
  return project?.languageProfile?.genre === 'scientific'
}

function auditEntry({
  id,
  sourceId = id,
  origin,
  category,
  status = 'open',
  priority = 'normal',
  code = null,
  message = '',
  locator = null,
  hardBlocker = false,
}) {
  const normalizedCategory = String(category || 'content')
  const normalizedStatus = Object.hasOwn(STATUS_RANK, status) ? status : 'open'
  const normalizedPriority = Object.hasOwn(PRIORITY_RANK, priority) ? priority : 'normal'
  return {
    id: requiredText(id, 'Audit entry'),
    sourceId: requiredText(sourceId, 'Audit source'),
    origin: String(origin || 'finding'),
    category: normalizedCategory,
    group: groupFor(normalizedCategory, normalizedStatus),
    status: normalizedStatus,
    priority: normalizedPriority,
    code: code ? String(code) : null,
    message: String(message || '').trim(),
    locator: clone(locator),
    hardBlocker: hardBlocker === true,
  }
}

function compareEntries(a, b) {
  return (
    (GROUP_RANK.get(a.group) ?? 99) - (GROUP_RANK.get(b.group) ?? 99)
    || (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99)
    || (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99)
    || a.id.localeCompare(b.id, 'de')
  )
}

function collectFindingEntries({ project, doc }) {
  const findings = Array.isArray(doc.findings) ? doc.findings : []
  const openIds = new Set(findings.filter(item => item?.status === 'open').map(item => item.id))
  const scientific = isScientific(project)
  return findings.filter(isObject).map((finding, index) => {
    const status = normalizedStatus(finding, openIds)
    const category = String(finding.category || 'content')
    const priority = String(finding.priority || 'normal')
    return auditEntry({
      id: `finding:${finding.id || index}`,
      sourceId: String(finding.id || `finding-${index}`),
      origin: 'finding',
      category,
      status,
      priority,
      code: finding.code || null,
      message: finding.short || finding.message || finding.text || 'Hinweis',
      locator: finding.anchor || finding.locator || (
        finding.blockId ? { blockId: finding.blockId } : null
      ),
      hardBlocker: scientific
        && ['open', 'parked'].includes(status)
        && priority === 'critical'
        && CRITICAL_CATEGORIES.has(category),
    })
  })
}

function collectClaimEntries({ project, textId }) {
  if (!isScientific(project)) return []
  const claims = Array.isArray(project.argumentModel?.claims) ? project.argumentModel.claims : []
  return claims.filter(claim => (
    isObject(claim)
    && (!claim.projectId || claim.projectId === project.id)
    && (!claim.textId || claim.textId === textId)
    && claim.centrality === 'central'
    && WEAK_EVIDENCE.has(claim.evidenceStatus)
    && claim.status !== 'stale'
  )).map((claim, index) => auditEntry({
    id: `claim-evidence:${claim.id || index}`,
    sourceId: String(claim.id || `claim-${index}`),
    origin: 'claim',
    category: 'source',
    status: 'open',
    priority: 'critical',
    code: `claim-evidence-${claim.evidenceStatus}`,
    message: `Die zentrale Aussage besitzt den Belegstatus ${claim.evidenceStatus}.`,
    locator: claim.anchor || (claim.blockId ? { blockId: claim.blockId } : null),
    hardBlocker: true,
  }))
}

function collectBundleEntries({ project, textId }) {
  if (!isScientific(project)) return []
  const bundles = Array.isArray(project.evidenceBundles) ? project.evidenceBundles : []
  return bundles.filter(bundle => (
    isObject(bundle)
    && (!bundle.projectId || bundle.projectId === project.id)
    && (!bundle.textId || bundle.textId === textId)
    && WEAK_EVIDENCE.has(bundle.status)
  )).map((bundle, index) => auditEntry({
    id: `evidence-bundle:${bundle.id || index}`,
    sourceId: String(bundle.id || `evidence-bundle-${index}`),
    origin: 'evidence-bundle',
    category: 'source',
    status: 'open',
    priority: bundle.priority === 'critical' ? 'critical' : 'high',
    code: `evidence-bundle-${bundle.status}`,
    message: `Das Belegbündel besitzt den Status ${bundle.status}.`,
    locator: bundle.locator || null,
    hardBlocker: bundle.priority === 'critical',
  }))
}

function collectCitationEntries({ project, textId }) {
  const inText = (Array.isArray(project.citations) ? project.citations : [])
    .filter(item => !item?.textId || item.textId === textId)
  const bibliography = (Array.isArray(project.bibliography) ? project.bibliography : [])
    .filter(item => !item?.textId || item.textId === textId)
  const consistency = auditCitationConsistency({
    inText,
    bibliography,
    requiredStyle: project.languageProfile?.citationStyle || '',
  })
  const scientific = isScientific(project)
  const entries = consistency.map((finding, index) => auditEntry({
    id: `citation-consistency:${finding.code}:${index}`,
    sourceId: `citation-consistency:${finding.code}:${index}`,
    origin: 'citation-consistency',
    category: 'citation',
    status: 'open',
    priority: finding.severity === 'critical' ? 'critical' : finding.severity === 'error' ? 'high' : 'normal',
    code: finding.code,
    message: finding.message,
    locator: finding.locator,
    hardBlocker: scientific && finding.severity === 'critical',
  }))

  const uses = (Array.isArray(project.citationUses) ? project.citationUses : [])
    .filter(item => !item?.textId || item.textId === textId)
  uses.forEach((use, useIndex) => {
    auditQuotationOrParaphrase(use).forEach((finding, findingIndex) => {
      entries.push(auditEntry({
        id: `citation-use:${use.id || useIndex}:${finding.code}:${findingIndex}`,
        sourceId: String(use.id || `citation-use-${useIndex}`),
        origin: 'citation-use',
        category: 'citation',
        status: 'open',
        priority: finding.severity === 'critical' ? 'critical' : 'high',
        code: finding.code,
        message: finding.message,
        locator: finding.locator,
        hardBlocker: scientific && finding.severity === 'critical',
      }))
    })
  })
  return entries
}

function collectFairnessEntries({ project, textId }) {
  const report = project.languageReports?.byText?.[textId]
  const findings = Array.isArray(report?.fairness?.findings) ? report.fairness.findings : []
  const scientific = isScientific(project)
  return findings.filter(finding => (
    isObject(finding) && ['open', 'risk-accepted'].includes(finding.status || 'open')
  )).map((finding, index) => {
    const priority = String(finding.priority || 'high')
    const status = finding.status || 'open'
    return auditEntry({
      id: `fairness:${finding.id || index}`,
      sourceId: String(finding.id || `fairness-${index}`),
      origin: 'language-fairness',
      category: 'logic',
      status,
      priority,
      code: finding.kind || 'effect-fairness',
      message: finding.message || finding.reason || 'Wirkungs- oder Fairnessrisiko',
      locator: finding.anchor || null,
      hardBlocker: scientific && status === 'open' && priority === 'critical',
    })
  })
}

function collectEntries({ project, doc, textId }) {
  return [
    ...collectFindingEntries({ project, doc }),
    ...collectClaimEntries({ project, textId }),
    ...collectBundleEntries({ project, textId }),
    ...collectCitationEntries({ project, textId }),
    ...collectFairnessEntries({ project, textId }),
  ].sort(compareEntries)
}

function groupEntries(entries) {
  return GROUPS.map(([kind, label]) => ({
    kind,
    label,
    count: entries.filter(entry => entry.group === kind).length,
    entries: entries.filter(entry => entry.group === kind).map(clone),
  }))
}

function countStatuses(entries) {
  const counts = {}
  entries.forEach(entry => {
    counts[entry.status] = (counts[entry.status] || 0) + 1
  })
  return counts
}

function statusCopy(status) {
  if (status === 'blocked') {
    return {
      statusLabel: 'Nicht freigabereif · harte Auditblocker offen',
      userDecisionNotice: 'Die App erteilt keine Freigabe. Beheben oder bewerten Sie die Blocker; die Publikationsentscheidung bleibt beim Nutzer.',
    }
  }
  if (status === 'review-required') {
    return {
      statusLabel: 'Prüfung erforderlich · offene Hinweise oder angenommene Risiken',
      userDecisionNotice: 'Der Audit dokumentiert Risiken, trifft aber keine Publikationsentscheidung. Diese bleibt beim Nutzer.',
    }
  }
  return {
    statusLabel: 'Keine harten Auditblocker gefunden',
    userDecisionNotice: 'Der Audit erteilt keine Freigabe. Die abschließende Publikationsentscheidung bleibt beim Nutzer.',
  }
}

export function runFinalAudit({ project, docs = [], textId, at = Date.now() } = {}) {
  if (!isObject(project)) throw new TypeError('Audit project is required')
  const projectId = requiredText(project.id, 'Audit project')
  const normalizedTextId = requiredText(textId, 'Audit text')
  if (!Number.isFinite(at)) throw new TypeError('Audit time is required')
  const doc = (Array.isArray(docs) ? docs : []).find(item => (
    item?.id === normalizedTextId && item?.projectId === projectId
  ))
  if (!doc) throw new TypeError('Audit text does not belong to this project')

  const entries = collectEntries({ project, doc, textId: normalizedTextId })
  const blockers = entries.filter(entry => entry.hardBlocker)
  const acceptedRisks = entries.filter(entry => entry.status === 'risk-accepted')
  const status = blockers.length
    ? 'blocked'
    : acceptedRisks.length || entries.some(entry => ['open', 'parked'].includes(entry.status))
      ? 'review-required'
      : 'clear-of-hard-blockers'
  const copy = statusCopy(status)
  const structural = {
    schemaVersion: 1,
    projectId,
    textId: normalizedTextId,
    ruleVersion: FINAL_AUDIT_RULE_VERSION,
    modelVersion: FINAL_AUDIT_MODEL_VERSION,
    dataVersion: Number(project.finalAudits?.dataVersion || project.audit?.dataVersion) || 1,
    status,
    ...copy,
    groups: groupEntries(entries),
    blockers: blockers.map(clone),
    acceptedRisks: acceptedRisks.map(clone),
    statusCounts: countStatuses(entries),
  }
  return {
    ...structural,
    fingerprint: stableHash(stableJson(structural)),
    auditedAt: at,
  }
}

export function ensureFinalAuditStore(project) {
  if (!isObject(project)) throw new TypeError('Audit project is required')
  const projectId = requiredText(project.id, 'Audit project')
  const store = isObject(project.finalAudits) ? project.finalAudits : {}
  if (store.projectId && store.projectId !== projectId) {
    throw new TypeError('Final audit store belongs to a foreign project')
  }
  store.schemaVersion = 1
  store.dataVersion = Number(store.dataVersion) || 1
  store.projectId = projectId
  if (!isObject(store.byText)) store.byText = {}
  if (!Array.isArray(store.history)) store.history = []
  Object.entries(store.byText).forEach(([textId, audit]) => {
    if (
      !isObject(audit)
      || audit.projectId !== projectId
      || audit.textId !== textId
      || typeof audit.fingerprint !== 'string'
      || !audit.fingerprint
    ) {
      delete store.byText[textId]
    }
  })
  store.history = store.history.filter(event => (
    isObject(event)
    && event.projectId === projectId
    && typeof event.textId === 'string'
    && event.textId
    && typeof event.auditFingerprint === 'string'
    && event.auditFingerprint
    && isObject(event.audit)
    && event.audit.projectId === projectId
    && event.audit.textId === event.textId
  ))
  project.finalAudits = store
  return store
}

export function recordFinalAudit({ project, audit } = {}) {
  if (!isObject(audit)) throw new TypeError('Final audit is required')
  if (!Number.isFinite(audit.auditedAt)) throw new TypeError('Final audit time is required')
  const store = ensureFinalAuditStore(project)
  if (audit.projectId !== store.projectId) throw new TypeError('Final audit project mismatch')
  const textId = requiredText(audit.textId, 'Final audit text')
  const fingerprint = requiredText(audit.fingerprint, 'Final audit fingerprint')
  const next = clone(audit)
  const previous = store.byText[textId]
  store.byText[textId] = next
  const id = `final-audit-event:${store.projectId}:${textId}:${fingerprint}`
  if (
    (!previous || previous.fingerprint !== fingerprint)
    && !store.history.some(event => event.id === id)
  ) {
    store.history.push({
      id,
      projectId: store.projectId,
      textId,
      kind: 'final-audit-recorded',
      auditFingerprint: fingerprint,
      audit: next,
      provenance: { actor: 'agent', action: 'deterministic-final-audit' },
      at: audit.auditedAt,
    })
  }
  return clone(next)
}
