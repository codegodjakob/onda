// Die Fundstelle in einer Quelle — kein DOM; die Prüfsummen-Funktion kommt herein.
//
// Ein Locator sagt, WO in einer Quelle etwas steht: Seite, Abschnitt, Textstelle oder
// Zeitmarke. Beim Auflösen wird zuerst geprüft, ob die Quelle noch unverändert ist
// (source-model.mjs) und ob die zitierte Stelle dort wörtlich vorkommt — eine Fundstelle
// in einer stillschweigend ausgetauschten Datei wäre ein falscher Beleg.
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js).
import { verifySourceIntegrity } from './source-model.mjs'

export const LOCATOR_KINDS = Object.freeze(['page', 'section', 'text', 'time'])

const KIND_SET = new Set(LOCATOR_KINDS)

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function requiredText(value, label) {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) throw new TypeError(`${label} is required`)
  return text
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function validNonNegative(value) {
  return Number.isFinite(value) && value >= 0
}

function validateAddress(kind, address) {
  if (!isObject(address)) throw new TypeError(`${kind} address is required`)
  if (kind === 'page' && (!Number.isInteger(address.page) || address.page < 1)) {
    throw new TypeError('Page locator requires a positive page')
  }
  if (kind === 'section' && !String(address.sectionId || '').trim()) {
    throw new TypeError('Section locator requires a section id')
  }
  if (kind === 'text' && (!validNonNegative(address.start) || !validNonNegative(address.end) || address.end < address.start)) {
    throw new TypeError('Text locator requires a valid start and end')
  }
  if (kind === 'time' && (!validNonNegative(address.startMs) || !validNonNegative(address.endMs) || address.endMs <= address.startMs)) {
    throw new TypeError('Time locator requires a valid start and end')
  }
}

function originalRegion(source, locator) {
  const original = isObject(source.original) ? source.original : {}
  const address = locator.address
  if (locator.kind === 'page') {
    return (Array.isArray(original.pages) ? original.pages : [])
      .find(page => page?.page === address.page)?.text || ''
  }
  if (locator.kind === 'section') {
    return (Array.isArray(original.sections) ? original.sections : [])
      .find(section => section?.id === address.sectionId)?.text || ''
  }
  if (locator.kind === 'text') {
    return String(original.text || '').slice(address.start, address.end)
  }
  if (locator.kind === 'time') {
    return (Array.isArray(original.segments) ? original.segments : [])
      .filter(segment => segment?.endMs > address.startMs && segment?.startMs < address.endMs)
      .map(segment => segment.text || '')
      .join(' ')
  }
  return ''
}

function unresolved(locator, reason) {
  return {
    ...clone(locator),
    status: 'unverified',
    reason,
    verification: { status: 'unverified', reason },
  }
}

export async function createLocator(input, { sha256 } = {}) {
  if (!isObject(input)) throw new TypeError('Locator input is required')
  const id = requiredText(input.id, 'Locator id')
  const projectId = requiredText(input.projectId, 'Project')
  const sourceId = requiredText(input.sourceId, 'Source')
  const claimId = requiredText(input.claimId, 'Claim')
  const kind = requiredText(input.kind, 'Locator kind')
  if (!KIND_SET.has(kind)) throw new TypeError(`Unsupported locator kind: ${kind}`)
  validateAddress(kind, input.address)
  const excerpt = requiredText(input.excerpt, 'Excerpt')
  if (typeof sha256 !== 'function') throw new TypeError('SHA-256 function is required')
  const excerptChecksum = await sha256(excerpt)
  if (typeof excerptChecksum !== 'string' || !/^[a-f0-9]{64}$/i.test(excerptChecksum)) {
    throw new TypeError('SHA-256 function returned an invalid checksum')
  }
  return {
    id,
    projectId,
    sourceId,
    claimId,
    claimText: typeof input.claimText === 'string' ? input.claimText.trim() : '',
    kind,
    address: clone(input.address),
    excerpt,
    excerptChecksum: excerptChecksum.toLowerCase(),
    provenance: input.provenance && typeof input.provenance === 'object'
      ? clone(input.provenance)
      : { actor: 'user', action: 'locator-create' },
    verification: { status: 'unverified', reason: 'not-resolved' },
  }
}

export async function resolveLocator({ projectId, source, locator, sha256 }) {
  if (!source || !locator) return unresolved(locator || {}, 'missing-source-or-locator')
  if (source.projectId !== projectId || locator.projectId !== projectId) return unresolved(locator, 'project-mismatch')
  if (source.id !== locator.sourceId) return unresolved(locator, 'source-mismatch')
  if (source.status !== 'active') return unresolved(locator, 'source-not-active')
  if (typeof sha256 !== 'function') return unresolved(locator, 'checksum-unavailable')
  if (source.checksumSha256) {
    const integrity = await verifySourceIntegrity(source, { sha256 })
    if (!integrity.valid) return unresolved(locator, integrity.reason)
  }

  const currentChecksum = await sha256(String(locator.excerpt || ''))
  if (currentChecksum.toLowerCase() !== String(locator.excerptChecksum || '').toLowerCase()) {
    return unresolved(locator, 'excerpt-checksum-mismatch')
  }
  const region = originalRegion(source, locator)
  if (!region || !region.includes(locator.excerpt)) return unresolved(locator, 'excerpt-not-in-original')

  return {
    ...clone(locator),
    status: 'verified',
    reason: null,
    verification: { status: 'verified', reason: null },
  }
}
