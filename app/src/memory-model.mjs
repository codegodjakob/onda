export const MEMORY_LEVELS = Object.freeze(['text', 'project', 'topic', 'personal'])
export const MEMORY_SENSITIVITIES = Object.freeze(['standard', 'sensitive', 'personal'])
export const MEMORY_DELETION_RULES = Object.freeze(['with-text', 'with-project', 'manual', 'all'])

const LEVEL_SET = new Set(MEMORY_LEVELS)
const SENSITIVITY_SET = new Set(MEMORY_SENSITIVITIES)
const DELETION_SET = new Set(MEMORY_DELETION_RULES)

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  if (value === undefined) return undefined
  return JSON.parse(JSON.stringify(value))
}

function text(value, label) {
  const result = typeof value === 'string' ? value.trim() : ''
  if (!result) throw new TypeError(`${label} is required`)
  return result
}

function stringList(value) {
  return Array.isArray(value)
    ? [...new Set(value.map(item => String(item).trim()).filter(Boolean))]
    : []
}

function normalizeProvenance(value) {
  if (!isObject(value)) throw new TypeError('Memory provenance is required')
  const actor = text(value.actor, 'Memory provenance actor')
  const action = text(value.action, 'Memory provenance action')
  const originEventIds = stringList(value.originEventIds)
  if (!originEventIds.length) throw new TypeError('Memory provenance originEventIds are required')
  return { actor, action, originEventIds }
}

function normalizeScope(level, scope) {
  if (!isObject(scope)) throw new TypeError(`Memory ${level} scope is required`)
  if (level === 'text') {
    return {
      projectId: text(scope.projectId, 'Memory text scope projectId'),
      textId: text(scope.textId, 'Memory text scope textId'),
    }
  }
  if (level === 'project') {
    return { projectId: text(scope.projectId, 'Memory project scope projectId') }
  }
  if (level === 'topic') {
    const projectIds = stringList(scope.projectIds)
    if (!projectIds.length) throw new TypeError('Memory topic scope projectIds are required')
    return {
      topicId: text(scope.topicId, 'Memory topic scope topicId'),
      projectIds,
    }
  }
  const projectIds = stringList(scope.projectIds)
  const allProjects = scope.allProjects === true
  if (!projectIds.length && !allProjects) throw new TypeError('Memory personal scope projectIds or allProjects are required')
  return {
    ownerId: text(scope.ownerId, 'Memory personal scope ownerId'),
    ...(projectIds.length ? { projectIds } : {}),
    ...(allProjects ? { allProjects: true } : {}),
  }
}

export function ensureMemoryStore(raw) {
  const store = isObject(raw) ? raw : {}
  store.schemaVersion = 1
  if (!Array.isArray(store.events)) store.events = []
  if (!Array.isArray(store.entries)) store.entries = []
  if (!Array.isArray(store.transfers)) store.transfers = []
  if (!Array.isArray(store.consents)) store.consents = []
  if (!isObject(store.index)) store.index = {}
  return store
}

export function ensureProjectMemoryShape(project) {
  if (!isObject(project)) throw new TypeError('Project is required')
  const memory = isObject(project.memory) ? project.memory : {}
  memory.enabled = memory.enabled !== false
  if (!Array.isArray(memory.eventIds)) memory.eventIds = []
  if (!isObject(memory.dossier)) memory.dossier = null
  project.memory = memory
  if (!Array.isArray(project.memoryTerms)) project.memoryTerms = []
  return project
}

export function createMemoryEntry(input) {
  if (!isObject(input)) throw new TypeError('Memory entry is required')
  const level = text(input.level, 'Memory level')
  if (!LEVEL_SET.has(level)) throw new TypeError(`Unsupported memory level: ${level}`)
  const sensitivity = text(input.sensitivity, 'Memory sensitivity')
  if (!SENSITIVITY_SET.has(sensitivity)) throw new TypeError(`Unsupported memory sensitivity: ${sensitivity}`)
  const deletionRule = text(input.deletionRule, 'Memory deletion rule')
  if (!DELETION_SET.has(deletionRule)) throw new TypeError(`Unsupported memory deletion rule: ${deletionRule}`)
  if (!Number.isFinite(input.createdAt)) throw new TypeError('Memory createdAt is required')
  return {
    id: text(input.id, 'Memory id'),
    level,
    type: text(input.type, 'Memory type'),
    content: text(input.content, 'Memory content'),
    scope: normalizeScope(level, input.scope),
    provenance: normalizeProvenance(input.provenance),
    sensitivity,
    deletionRule,
    createdAt: input.createdAt,
    status: ['active', 'superseded', 'deleted'].includes(input.status) ? input.status : 'active',
  }
}

export function createMemoryEvent(input) {
  if (!isObject(input)) throw new TypeError('Memory event is required')
  if (!isObject(input.provenance)) throw new TypeError('Memory event provenance is required')
  if (!SENSITIVITY_SET.has(input.sensitivity)) throw new TypeError('Memory event sensitivity is invalid')
  if (!Number.isFinite(input.at)) throw new TypeError('Memory event time is required')
  return {
    id: text(input.id, 'Memory event id'),
    projectId: text(input.projectId, 'Memory event project'),
    kind: text(input.kind, 'Memory event kind'),
    entityId: text(input.entityId, 'Memory event entity'),
    snapshot: clone(input.snapshot ?? null),
    provenance: {
      actor: text(input.provenance.actor, 'Memory event actor'),
      action: text(input.provenance.action, 'Memory event action'),
    },
    sensitivity: input.sensitivity,
    at: input.at,
  }
}

export function appendMemoryEvent(store, event) {
  const next = clone(ensureMemoryStore(clone(store)))
  const normalized = createMemoryEvent(event)
  if (next.events.some(candidate => candidate?.id === normalized.id)) {
    throw new TypeError(`Duplicate memory event: ${normalized.id}`)
  }
  next.events.push(clone(normalized))
  return next
}
