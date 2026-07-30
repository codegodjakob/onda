export const SOURCE_TYPES = Object.freeze(['pdf', 'web', 'doi', 'text', 'audio', 'video'])
export const SOURCE_STATUSES = Object.freeze(['active', 'corrected', 'retracted', 'superseded'])
export const METADATA_STATUSES = Object.freeze(['confirmed', 'user-provided', 'conflict', 'unknown'])

const SOURCE_TYPE_SET = new Set(SOURCE_TYPES)
const METADATA_STATUS_SET = new Set(METADATA_STATUSES)
const EVENT_STATUS = Object.freeze({
  corrected: 'corrected',
  retracted: 'retracted',
  superseded: 'superseded',
  'new-version': 'superseded',
  'alternate-primary': 'corrected',
})

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  if (value === undefined) return undefined
  return JSON.parse(JSON.stringify(value))
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue)
  if (!isObject(value)) return value
  return Object.keys(value).sort().reduce((result, key) => {
    if (value[key] !== undefined) result[key] = stableValue(value[key])
    return result
  }, {})
}

function requiredText(value, label) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) throw new TypeError(`${label} is required`)
  return text
}

function normalizeMetadata(metadata) {
  if (!isObject(metadata)) return {}
  return Object.entries(metadata).reduce((result, [field, candidate]) => {
    if (!field.trim()) return result
    const entry = isObject(candidate) ? candidate : { value: candidate }
    const hasValue = entry.value !== undefined && entry.value !== null && entry.value !== ''
    const status = METADATA_STATUS_SET.has(entry.status)
      ? entry.status
      : (hasValue ? 'user-provided' : 'unknown')
    result[field] = {
      value: clone(entry.value ?? null),
      status,
      ...(entry.evidence ? { evidence: clone(entry.evidence) } : {}),
    }
    return result
  }, {})
}

export function sourcePayload(origin, original) {
  return JSON.stringify(stableValue({
    immutableRef: origin?.immutableRef || null,
    original: original || null,
  }))
}

export function ensureProjectEvidenceShape(project) {
  if (!isObject(project)) throw new TypeError('Project is required')
  if (!Array.isArray(project.sources)) project.sources = []
  if (!Array.isArray(project.evidenceBundles)) project.evidenceBundles = []
  return project
}

export async function importSource(input, { sha256, idFactory = null } = {}) {
  if (!isObject(input)) throw new TypeError('Source input is required')
  const projectId = requiredText(input.projectId, 'Project')
  const type = requiredText(input.type, 'Source type')
  if (!SOURCE_TYPE_SET.has(type)) throw new TypeError(`Unsupported source type: ${type}`)
  if (!isObject(input.origin)) throw new TypeError('Source origin is required')
  const immutableRef = requiredText(input.origin.immutableRef, 'Immutable reference')
  if (typeof sha256 !== 'function') throw new TypeError('SHA-256 function is required')
  if (!isObject(input.original)) throw new TypeError('Original source content is required')
  if (!Number.isFinite(input.importedAt)) throw new TypeError('Import time is required')

  const origin = { ...clone(input.origin), immutableRef }
  const original = clone(input.original)
  const checksumSha256 = await sha256(sourcePayload(origin, original))
  if (typeof checksumSha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(checksumSha256)) {
    throw new TypeError('SHA-256 function returned an invalid checksum')
  }

  const generatedId = typeof idFactory === 'function'
    ? idFactory()
    : `source-${input.importedAt}-${checksumSha256.slice(0, 12)}`
  const id = requiredText(input.id || generatedId, 'Source id')

  return {
    id,
    projectId,
    type,
    origin,
    original,
    checksumSha256: checksumSha256.toLowerCase(),
    importedAt: input.importedAt,
    provenance: isObject(input.provenance)
      ? clone(input.provenance)
      : { actor: 'user', action: 'import' },
    metadata: normalizeMetadata(input.metadata),
    derived: isObject(input.derived) ? clone(input.derived) : {},
    status: 'active',
    locators: [],
    history: [],
  }
}

export function recordSourceEvent(source, event) {
  if (!isObject(source) || !source.id) throw new TypeError('Source is required')
  if (!isObject(event)) throw new TypeError('Source event is required')
  const eventId = requiredText(event.id, 'Event id')
  const kind = requiredText(event.kind, 'Event kind')
  if (!Object.hasOwn(EVENT_STATUS, kind)) throw new TypeError(`Unsupported event kind: ${kind}`)
  if (!Number.isFinite(event.at)) throw new TypeError('Event time is required')

  const next = clone(source)
  next.history = Array.isArray(next.history) ? next.history : []
  if (next.history.some(item => item?.id === eventId)) throw new TypeError(`Duplicate event id: ${eventId}`)
  next.history.push({
    ...clone(event),
    id: eventId,
    kind,
    previousStatus: SOURCE_STATUSES.includes(source.status) ? source.status : 'active',
  })
  next.status = EVENT_STATUS[kind]
  if (event.replacementSourceId) next.replacementSourceId = String(event.replacementSourceId)
  return next
}
