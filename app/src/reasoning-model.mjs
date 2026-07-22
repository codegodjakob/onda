const UNDERSTANDING_DEFAULTS = Object.freeze({
  task: '',
  audience: [],
  desiredEffect: '',
  evidenceStandard: '',
  protectedIntentions: [],
  openQuestions: [],
  updatedAt: null,
})

const PRIORITY_RANK = Object.freeze({ critical: 0, high: 1, normal: 2, low: 3 })
const INTEGRITY_CATEGORIES = new Set(['fact', 'source', 'citation', 'method', 'logic'])
const COMPLETED_STATUSES = new Set(['resolved', 'dismissed', 'superseded'])

function cleanList(value) {
  if (!Array.isArray(value)) return []
  return value.map(item => String(item).trim()).filter(Boolean)
}

export function ensureProjectUnderstanding(project) {
  const current = project && typeof project.understanding === 'object' && project.understanding
    ? project.understanding
    : {}
  Object.entries(UNDERSTANDING_DEFAULTS).forEach(([key, value]) => {
    if (current[key] === undefined) current[key] = Array.isArray(value) ? [] : value
  })
  current.audience = cleanList(current.audience)
  current.protectedIntentions = cleanList(current.protectedIntentions)
  current.openQuestions = cleanList(current.openQuestions)
  project.understanding = current
  return current
}

function legacyStatus(status) {
  if (status === 'done') return 'resolved'
  if (status === 'rejected') return 'dismissed'
  return status || 'open'
}

function coachCategory(entry) {
  const type = String(entry.type || '').toLowerCase()
  if (type.includes('quelle')) return 'source'
  if (type.includes('zitat')) return 'citation'
  if (type.includes('methode')) return 'method'
  if (type.includes('logik')) return 'logic'
  if (type.includes('struktur')) return 'structure'
  return 'content'
}

function normalizeFinding(finding, placement, index) {
  const normalized = finding
  normalized.id = normalized.id || `legacy-${placement}-${index}`
  normalized.placement = normalized.placement || placement
  normalized.status = legacyStatus(normalized.status)
  normalized.category = normalized.category || (
    placement === 'passage'
      ? (normalized.kind === 'form' ? 'wording' : 'content')
      : coachCategory(normalized)
  )
  normalized.priority = normalized.priority || (normalized.tone === 'warn' ? 'high' : 'normal')
  normalized.createdAt = Number.isFinite(normalized.createdAt) ? normalized.createdAt : index
  normalized.short = normalized.short || normalized.text || 'Hinweis'
  if (typeof normalized.claim === 'string' && normalized.claim.trim()) {
    normalized.claim = normalized.claim.trim()
  } else {
    delete normalized.claim
  }
  return normalized
}

export function ensureReasoningModel(doc) {
  if (!Array.isArray(doc.findings)) doc.findings = []
  if (!Array.isArray(doc.decisions)) doc.decisions = []

  const ids = new Set(doc.findings.map(item => item && item.id).filter(Boolean))
  const addLegacy = (items, placement) => {
    if (!Array.isArray(items)) return
    items.forEach((item, index) => {
      const normalized = normalizeFinding(item, placement, index)
      if (!ids.has(normalized.id)) {
        doc.findings.push(normalized)
        ids.add(normalized.id)
      }
    })
  }

  addLegacy(doc.coach, 'document')
  addLegacy(doc.lane, 'passage')
  doc.findings.forEach((finding, index) => normalizeFinding(
    finding,
    finding.placement || (finding.target ? 'passage' : 'document'),
    index,
  ))
  return doc
}

export function isIntegrityCategory(category) {
  return INTEGRITY_CATEGORIES.has(category)
}

function compareFindings(a, b) {
  const priority = (PRIORITY_RANK[a.priority] ?? PRIORITY_RANK.normal)
    - (PRIORITY_RANK[b.priority] ?? PRIORITY_RANK.normal)
  if (priority) return priority
  const integrity = Number(isIntegrityCategory(b.category)) - Number(isIntegrityCategory(a.category))
  if (integrity) return integrity
  const created = (a.createdAt || 0) - (b.createdAt || 0)
  if (created) return created
  return String(a.id).localeCompare(String(b.id), 'de')
}

export function getFindingQueue(doc) {
  ensureReasoningModel(doc)
  const open = doc.findings.filter(finding => finding.status === 'open')
  const openIds = new Set(open.map(finding => finding.id))
  const parked = open
    .filter(finding => finding.rootCauseId && openIds.has(finding.rootCauseId))
    .sort(compareFindings)
  const parkedIds = new Set(parked.map(finding => finding.id))
  const ready = open.filter(finding => !parkedIds.has(finding.id)).sort(compareFindings)

  return {
    current: ready[0] || null,
    upcoming: ready.slice(1),
    parked,
    acceptedRisks: doc.findings.filter(finding => finding.status === 'risk-accepted').sort(compareFindings),
    completed: doc.findings.filter(finding => COMPLETED_STATUSES.has(finding.status)).sort(compareFindings),
    pendingCount: open.length,
  }
}

export function decideFinding(doc, findingId, decision, at = Date.now()) {
  ensureReasoningModel(doc)
  const finding = doc.findings.find(item => item.id === findingId)
  if (!finding) throw new Error(`Hinweis ${findingId} nicht gefunden`)
  if (finding.status !== 'open') throw new Error(`Hinweis ${findingId} wurde bereits entschieden`)
  if (!decision || (decision.kind !== 'accept' && decision.kind !== 'reject')) {
    throw new Error('Entscheidung muss accept oder reject sein')
  }

  let outcome = 'resolved'
  if (decision.kind === 'reject') {
    outcome = isIntegrityCategory(finding.category) ? 'risk-accepted' : 'dismissed'
  }
  finding.status = outcome
  finding.decidedAt = at

  doc.decisions.push({
    id: `decision-${finding.id}-${at}`,
    findingId: finding.id,
    kind: decision.kind,
    outcome,
    reason: decision.reason || '',
    appliedText: decision.appliedText || '',
    at,
  })
  return finding
}
