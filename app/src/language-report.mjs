// Das Gedächtnis der Sprachprüfung im Projekt — PUR, node-testbar, kein DOM.
//
// Legt je Text den letzten Sprachbericht ab, führt die Liste der Entscheidungen dazu
// (übernommen, verworfen) und gibt auf Wunsch ein Dossier heraus. Ohne diesen Speicher
// wäre jede Prüfung die erste: dieselben Befunde kämen nach jedem Neustart wieder.
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js).
function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function requiredText(value, label) {
  const result = typeof value === 'string' ? value.trim() : ''
  if (!result) throw new TypeError(`${label} is required`)
  return result
}

function stableHash(value) {
  let hash = 2166136261
  for (const character of String(value)) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function ensureLanguageReportStore(project) {
  if (!isObject(project)) throw new TypeError('Language report project is required')
  const projectId = requiredText(project.id, 'Language report project')
  const store = isObject(project.languageReports) ? project.languageReports : {}
  if (store.projectId && store.projectId !== projectId) {
    throw new TypeError('Language report store belongs to a foreign project')
  }
  store.schemaVersion = 1
  store.projectId = projectId
  if (!isObject(store.byText)) store.byText = {}
  if (!Array.isArray(store.history)) store.history = []
  if (!Array.isArray(store.decisions)) store.decisions = []
  Object.entries(store.byText).forEach(([textId, report]) => {
    if (!isObject(report) || report.projectId !== projectId || report.textId !== textId) {
      delete store.byText[textId]
    }
  })
  store.history = store.history.filter(event => (
    isObject(event)
    && event.projectId === projectId
    && typeof event.textId === 'string'
    && event.textId
  ))
  store.decisions = store.decisions.filter(event => (
    isObject(event)
    && event.projectId === projectId
    && typeof event.textId === 'string'
    && event.textId
  ))
  project.languageReports = store
  return store
}

function reportPayload(report) {
  return {
    schemaVersion: 1,
    projectId: requiredText(report.projectId, 'Language report project'),
    textId: requiredText(report.textId, 'Language report text'),
    analyzedAt: report.analyzedAt,
    context: clone(report.context),
    diagnostics: clone(report.diagnostics),
    effect: clone(report.effect),
    rhetoric: clone(report.rhetoric),
    fairness: clone(report.fairness),
  }
}

function reportFingerprint(report) {
  const comparable = clone(report)
  delete comparable.analyzedAt
  if (comparable.effect) delete comparable.effect.analyzedAt
  if (comparable.rhetoric) delete comparable.rhetoric.analyzedAt
  if (comparable.fairness) delete comparable.fairness.analyzedAt
  comparable.diagnostics?.forEach(item => { delete item.createdAt })
  comparable.rhetoric?.devices?.forEach(item => { delete item.createdAt })
  comparable.fairness?.findings?.forEach(item => { delete item.createdAt })
  return stableHash(JSON.stringify(comparable))
}

export function recordLanguageReport({ project, report, at = report?.analyzedAt } = {}) {
  if (!Number.isFinite(at)) throw new TypeError('Language report time is required')
  const store = ensureLanguageReportStore(project)
  const next = reportPayload(report)
  if (next.projectId !== store.projectId) throw new TypeError('Language report project mismatch')
  const fingerprint = reportFingerprint(next)
  next.fingerprint = fingerprint
  const previous = store.byText[next.textId]
  store.byText[next.textId] = clone(next)
  const eventId = `language-report-event:${store.projectId}:${next.textId}:${fingerprint}`
  if (
    (!previous || previous.fingerprint !== fingerprint)
    && !store.history.some(event => event.id === eventId)
  ) {
    store.history.push({
      id: eventId,
      projectId: store.projectId,
      textId: next.textId,
      kind: 'analysis-recorded',
      reportFingerprint: fingerprint,
      counts: {
        diagnostics: next.diagnostics.length,
        fairness: next.fairness.findings.length,
        passages: next.effect.passages.length,
        rhetoric: next.rhetoric.devices.length,
      },
      report: clone(next),
      provenance: { actor: 'agent', action: 'language-analysis' },
      at,
    })
  }
  return clone(next)
}

export function recordLanguageDecision({
  project,
  textId,
  findingId,
  entityKind = 'finding',
  decision,
  correction = null,
  note = '',
  at = Date.now(),
} = {}) {
  if (!Number.isFinite(at)) throw new TypeError('Language decision time is required')
  const store = ensureLanguageReportStore(project)
  const normalizedTextId = requiredText(textId, 'Language decision text')
  const normalizedFindingId = requiredText(findingId, 'Language decision finding')
  const normalizedEntityKind = requiredText(entityKind, 'Language decision entity')
  const normalizedDecision = requiredText(decision, 'Language decision')
  if (!['finding', 'effect-passage', 'rhetorical-device'].includes(normalizedEntityKind)) {
    throw new TypeError('Language decision entity is invalid')
  }
  if (!['reviewed', 'kept-open', 'corrected-elsewhere', 'corrected', 'abstained'].includes(normalizedDecision)) {
    throw new TypeError('Language decision is invalid')
  }
  let normalizedCorrection = null
  if (normalizedDecision === 'corrected') {
    if (!isObject(correction)) throw new TypeError('Language decision correction is required')
    normalizedCorrection = {
      field: requiredText(correction.field, 'Language decision correction field'),
      previous: requiredText(correction.previous, 'Language decision previous value'),
      next: requiredText(correction.next, 'Language decision corrected value'),
      reason: requiredText(correction.reason, 'Language decision correction reason'),
    }
  } else if (correction !== null && correction !== undefined) {
    throw new TypeError('Language decision correction is only allowed for corrected decisions')
  }
  const event = {
    id: `language-decision:${store.projectId}:${normalizedTextId}:${normalizedFindingId}:${at}`,
    projectId: store.projectId,
    textId: normalizedTextId,
    findingId: normalizedFindingId,
    entityKind: normalizedEntityKind,
    kind: 'finding-decision',
    decision: normalizedDecision,
    correction: normalizedCorrection,
    note: String(note || '').trim(),
    provenance: { actor: 'user', action: 'language-finding-review' },
    at,
  }
  store.decisions.push(event)
  return clone(event)
}

export function exportLanguageDossier({ project, textId } = {}) {
  const store = ensureLanguageReportStore(project)
  const normalizedTextId = requiredText(textId, 'Language export text')
  const report = store.byText[normalizedTextId]
  if (!report) throw new TypeError('Language report is not available for this text')
  const profile = clone(project.languageProfile || null)
  if (isObject(profile)) {
    profile.events = (Array.isArray(profile.events) ? profile.events : [])
      .filter(event => !event?.textId || event.textId === normalizedTextId)
    if (profile.lastAnalysis?.textId !== normalizedTextId) delete profile.lastAnalysis
  }
  return {
    schemaVersion: 1,
    kind: 'aiwt-language-dossier',
    projectId: store.projectId,
    textId: normalizedTextId,
    profile,
    report: clone(report),
    history: clone(store.history.filter(event => event.textId === normalizedTextId)),
    decisions: clone(store.decisions.filter(event => event.textId === normalizedTextId)),
    exportedAt: report.analyzedAt,
  }
}
