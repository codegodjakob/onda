import {
  appendToolEvent,
  canAttemptResearchPath,
  researchPathFingerprint,
} from './research-run.mjs'

const SECRET_KEY = /(api[-_]?key|password|passwd|secret|token|cookie|authorization|credential|session)/i

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function cleanString(value) {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  return /^bearer\s+/i.test(trimmed) ? '[redacted]' : trimmed
}

export function redactResearchSecrets(value, parentKey = '') {
  if (SECRET_KEY.test(parentKey)) return '[redacted]'
  if (Array.isArray(value)) return value.map(item => redactResearchSecrets(item))
  if (isObject(value)) {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = redactResearchSecrets(value[key], key)
      return result
    }, {})
  }
  return typeof value === 'string' ? cleanString(value) : value
}

function safeError(error) {
  if (error?.name === 'AbortError') return 'Research tool cancelled'
  if (error?.name === 'TypeError') return 'Research tool unavailable'
  return 'Research tool failed'
}

function safeResultReference(result) {
  const candidate = result?.id || result?.ref || result?.resultRef || null
  if (candidate === null || candidate === undefined) return null
  return cleanString(String(candidate)).slice(0, 500)
}

export function createResearchAdapter({ name, version, tools, invoke } = {}) {
  const adapterName = typeof name === 'string' ? name.trim() : ''
  const adapterVersion = typeof version === 'string' ? version.trim() : ''
  if (!adapterName || !adapterVersion) throw new TypeError('Research adapter name and version are required')
  if (!Array.isArray(tools) || !tools.length) throw new TypeError('Research adapter tools are required')
  if (typeof invoke !== 'function') throw new TypeError('Research adapter invoke function is required')
  return Object.freeze({
    name: adapterName,
    version: adapterVersion,
    tools: Object.freeze([...new Set(tools)]),
    invoke,
  })
}

export async function executeResearchTool(run, {
  adapter,
  tool,
  input = {},
  sourceState = null,
  signal = null,
} = {}, {
  now = Date.now,
  idFactory = () => `research-event-${now()}`,
} = {}) {
  if (run?.status !== 'running') throw new TypeError('Research run must be running before a tool call')
  if (!run.allowedTools?.includes(tool)) throw new TypeError(`Research plan does not allow ${tool}`)
  if (!adapter?.tools?.includes(tool)) throw new TypeError(`Research adapter does not provide ${tool}`)
  const normalizedInput = redactResearchSecrets(input)
  const path = { tool, input: normalizedInput, sourceState }
  if (!canAttemptResearchPath(run, path)) {
    throw new TypeError('Research path already failed for the same source state')
  }
  if (run.budget?.toolCalls >= run.stopConditions?.maxToolCalls) {
    throw new TypeError('Research tool-call budget exhausted')
  }
  const startedAt = now()
  const eventId = idFactory()
  let result = null
  let status = 'completed'
  let errorText = null
  try {
    result = await adapter.invoke(tool, input, { signal, runId: run.id, claimId: run.claimId })
  } catch (error) {
    status = error?.name === 'AbortError' ? 'cancelled' : 'failed'
    errorText = safeError(error)
  }
  const endedAt = now()
  const event = {
    id: eventId,
    tool,
    claimId: run.claimId,
    input: normalizedInput,
    sourceState: typeof sourceState === 'string' ? sourceState : null,
    pathFingerprint: researchPathFingerprint(path),
    status,
    startedAt,
    endedAt,
    adapter: { name: adapter.name, version: adapter.version },
    resultRef: status === 'completed' ? safeResultReference(result) : null,
    ...(errorText ? { error: errorText } : {}),
  }
  return {
    run: appendToolEvent(run, event),
    result: status === 'completed' ? result : null,
    error: errorText,
  }
}

export function legalAlternativePaths({ title = '', doi = '', sourceState = 'inaccessible' } = {}) {
  const normalizedTitle = String(title || '').trim()
  const normalizedDoi = String(doi || '').trim()
  const definitions = [
    ['doi-search', 'metadata', { doi: normalizedDoi || null, title: normalizedTitle || null }],
    ['title-search', 'search', { query: normalizedTitle || normalizedDoi }],
    ['preprint', 'search', { query: `${normalizedTitle || normalizedDoi} preprint` }],
    ['repository', 'search', { query: `${normalizedTitle || normalizedDoi} repository` }],
    ['library-catalog', 'search', { query: `${normalizedTitle || normalizedDoi} library catalog` }],
    ['author-manuscript', 'search', { query: `${normalizedTitle || normalizedDoi} author manuscript` }],
    ['other-version', 'metadata', { doi: normalizedDoi || null, title: normalizedTitle || null, versions: true }],
    ['supplement', 'search', { query: `${normalizedTitle || normalizedDoi} supplement` }],
    ['alternative-primary', 'search', { query: `${normalizedTitle || normalizedDoi} alternative primary source` }],
  ]
  return definitions.map(([kind, tool, input], index) => {
    const path = { id: `legal-${index + 1}-${kind}`, kind, purpose: 'access', tool, input, sourceState }
    return { ...path, fingerprint: researchPathFingerprint(path) }
  })
}
