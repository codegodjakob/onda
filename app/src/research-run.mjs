// Der Recherchelauf als Zustand — PUR, node-testbar, kein DOM.
//
// Was ein Lauf ist: ein Plan aus Wegen, ein Zustand (geplant, läuft, pausiert, zur Sichtung
// bereit, übernommen, abgebrochen, unterbrochen) mit ausdrücklich erlaubten Übergängen,
// ein Ereignisprotokoll und die Liste der Fundkandidaten.
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js).
export const RESEARCH_TOOLS = Object.freeze(['search', 'metadata', 'reader', 'import'])
export const RESEARCH_STATUSES = Object.freeze([
  'planned',
  'running',
  'paused',
  'review-ready',
  'completed',
  'cancelled',
  'failed',
])

const TOOL_SET = new Set(RESEARCH_TOOLS)
const PURPOSE_SET = new Set(['support', 'counter-evidence', 'limitations', 'access'])
const TRANSITIONS = Object.freeze({
  planned: new Set(['running', 'cancelled']),
  running: new Set(['paused', 'review-ready', 'cancelled', 'failed']),
  paused: new Set(['running', 'cancelled']),
  'review-ready': new Set(['running', 'completed', 'cancelled']),
  failed: new Set(['running', 'cancelled']),
  completed: new Set(),
  cancelled: new Set(),
})

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

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!isObject(value)) return typeof value === 'string' ? value.trim() : value
  return Object.keys(value).sort().reduce((result, key) => {
    if (value[key] !== undefined) result[key] = stableValue(value[key])
    return result
  }, {})
}

function positiveInteger(value, label, max) {
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new TypeError(`Valid ${label} stop condition is required`)
  }
  return value
}

function normalizePath(path, index, allowedTools) {
  if (!isObject(path)) throw new TypeError(`Search path ${index + 1} is required`)
  const id = requiredText(path.id, 'Search path id')
  const purpose = requiredText(path.purpose, 'Search path purpose')
  const tool = requiredText(path.tool, 'Search path tool')
  if (!PURPOSE_SET.has(purpose)) throw new TypeError(`Unsupported research purpose: ${purpose}`)
  if (!allowedTools.includes(tool)) throw new TypeError(`Search path uses unavailable tool: ${tool}`)
  if (!isObject(path.input)) throw new TypeError('Search path input is required')
  return {
    id,
    purpose,
    tool,
    input: stableValue(path.input),
    ...(typeof path.sourceState === 'string' && path.sourceState.trim()
      ? { sourceState: path.sourceState.trim() }
      : {}),
  }
}

export function ensureProjectResearchShape(project) {
  if (!isObject(project)) throw new TypeError('Project is required')
  if (!Array.isArray(project.researchRuns)) project.researchRuns = []
  return project
}

export function createResearchPlan(input, { idFactory = null, now = Date.now } = {}) {
  if (!isObject(input)) throw new TypeError('Research plan input is required')
  const projectId = requiredText(input.projectId, 'Project')
  const question = requiredText(input.question, 'Research question')
  const claimId = requiredText(input.claimId, 'Claim')
  const claimText = requiredText(input.claimText, 'Claim text')
  const createdAt = Number.isFinite(input.createdAt) ? input.createdAt : now()
  if (!Number.isFinite(createdAt)) throw new TypeError('Research plan time is required')
  const id = requiredText(input.id || (typeof idFactory === 'function' ? idFactory() : `research-${createdAt}`), 'Research id')

  if (!Array.isArray(input.allowedTools) || !input.allowedTools.length) {
    throw new TypeError('At least one allowed tool is required')
  }
  const allowedTools = [...new Set(input.allowedTools.map(tool => requiredText(tool, 'Research tool')))]
  const invalidTool = allowedTools.find(tool => !TOOL_SET.has(tool))
  if (invalidTool) throw new TypeError(`Unsupported research tool: ${invalidTool}`)

  if (!Array.isArray(input.searchPaths) || !input.searchPaths.length) {
    throw new TypeError('At least one search path is required')
  }
  const searchPaths = input.searchPaths.map((path, index) => normalizePath(path, index, allowedTools))
  if (new Set(searchPaths.map(path => path.id)).size !== searchPaths.length) {
    throw new TypeError('Search path ids must be unique')
  }
  for (const requiredPurpose of ['support', 'counter-evidence', 'limitations']) {
    if (!searchPaths.some(path => path.purpose === requiredPurpose)) {
      throw new TypeError(`Research plan requires a ${requiredPurpose} path`)
    }
  }

  if (!isObject(input.stopConditions)) throw new TypeError('Research stop conditions are required')
  const stopConditions = {
    maxToolCalls: positiveInteger(input.stopConditions.maxToolCalls, 'maxToolCalls', 100),
    maxSources: positiveInteger(input.stopConditions.maxSources, 'maxSources', 100),
    maxConsecutiveFailures: positiveInteger(input.stopConditions.maxConsecutiveFailures, 'maxConsecutiveFailures', 10),
  }

  return {
    id,
    projectId,
    question,
    claimId,
    claimText,
    allowedTools,
    searchPaths,
    stopConditions,
    budget: { toolCalls: 0, sources: 0, consecutiveFailures: 0 },
    status: 'planned',
    createdAt,
    updatedAt: createdAt,
    toolEvents: [],
    candidates: [],
    history: [{
      id: `${id}:planned:${createdAt}`,
      kind: 'planned',
      previousStatus: null,
      nextStatus: 'planned',
      at: createdAt,
      reason: 'plan-created',
    }],
  }
}

export function transitionResearchRun(run, nextStatus, { at = Date.now(), reason = null } = {}) {
  if (!isObject(run) || !RESEARCH_STATUSES.includes(run.status)) throw new TypeError('Valid research run is required')
  if (!TRANSITIONS[run.status]?.has(nextStatus)) {
    throw new TypeError(`Illegal research transition: ${run.status} -> ${nextStatus}`)
  }
  if (!Number.isFinite(at)) throw new TypeError('Research transition time is required')
  const next = clone(run)
  const previousStatus = run.status
  next.status = nextStatus
  next.updatedAt = at
  next.history = Array.isArray(next.history) ? next.history : []
  next.history.push({
    id: `${run.id}:${nextStatus}:${at}`,
    kind: 'status-change',
    previousStatus,
    nextStatus,
    at,
    reason: typeof reason === 'string' && reason.trim() ? reason.trim() : null,
  })
  return next
}

export function researchPathFingerprint({ tool, input, sourceState = null } = {}) {
  return JSON.stringify(stableValue({
    tool: requiredText(tool, 'Research tool'),
    input: isObject(input) ? input : {},
    sourceState: typeof sourceState === 'string' ? sourceState.trim() : null,
  }))
}

export function canAttemptResearchPath(run, path) {
  const fingerprint = researchPathFingerprint(path)
  return !(Array.isArray(run?.toolEvents) ? run.toolEvents : []).some(event => (
    event?.status === 'failed' && event.pathFingerprint === fingerprint
  ))
}

export function appendToolEvent(run, event) {
  if (!isObject(run) || !run.id) throw new TypeError('Research run is required')
  if (!isObject(event)) throw new TypeError('Tool event is required')
  const next = clone(run)
  next.toolEvents = Array.isArray(next.toolEvents) ? next.toolEvents : []
  const id = requiredText(event.id, 'Tool event id')
  if (next.toolEvents.some(candidate => candidate?.id === id)) throw new TypeError(`Duplicate tool event: ${id}`)
  const tool = requiredText(event.tool, 'Tool event tool')
  if (!next.allowedTools.includes(tool)) throw new TypeError(`Tool is not allowed by research plan: ${tool}`)
  if (!['completed', 'failed', 'cancelled'].includes(event.status)) throw new TypeError('Tool event requires a terminal status')
  next.toolEvents.push({
    ...clone(event),
    id,
    tool,
    claimId: requiredText(event.claimId || run.claimId, 'Tool event claim'),
    input: stableValue(event.input || {}),
  })
  next.budget = isObject(next.budget) ? next.budget : { toolCalls: 0, sources: 0, consecutiveFailures: 0 }
  next.budget.toolCalls = Number(next.budget.toolCalls || 0) + 1
  next.budget.consecutiveFailures = event.status === 'failed'
    ? Number(next.budget.consecutiveFailures || 0) + 1
    : 0
  next.updatedAt = Number.isFinite(event.endedAt) ? event.endedAt : next.updatedAt
  return next
}

export function appendResearchCandidate(run, candidate) {
  if (!isObject(run) || !run.id) throw new TypeError('Research run is required')
  if (!isObject(candidate)) throw new TypeError('Research candidate is required')
  if (candidate.projectId !== run.projectId) throw new TypeError('Research candidate project mismatch')
  if (candidate.runId !== run.id) throw new TypeError('Research candidate run mismatch')
  if (candidate.claimId !== run.claimId) throw new TypeError('Research candidate claim mismatch')
  if (['cancelled', 'completed'].includes(run.status)) throw new TypeError(`Cannot append candidate to ${run.status} research run`)
  const next = clone(run)
  next.candidates = Array.isArray(next.candidates) ? next.candidates : []
  const id = requiredText(candidate.id, 'Research candidate id')
  if (next.candidates.some(item => item?.id === id)) throw new TypeError(`Duplicate research candidate: ${id}`)
  next.candidates.push({ ...clone(candidate), id })
  next.budget = isObject(next.budget) ? next.budget : { toolCalls: 0, sources: 0, consecutiveFailures: 0 }
  next.budget.sources = next.candidates.length
  return next
}
