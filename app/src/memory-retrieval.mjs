// Was aus dem Gedächtnis überhaupt bis zum Modell vordringt — PUR, node-testbar, kein DOM.
//
// Wählt aus dem Speicher die Einträge, die für genau dieses Projekt und diesen Text
// gelten. Etwas von einem Projekt in ein anderes zu tragen geschieht nicht von selbst:
// dafür gibt es eine Anfrage, der zugestimmt oder die abgelehnt wird.
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js); der Text daraus fließt über
// onda-kontext.mjs in die Anfrage ans Modell.
import { createMemoryEntry, ensureMemoryStore } from './memory-model.mjs'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function text(value, label) {
  const result = typeof value === 'string' ? value.trim() : ''
  if (!result) throw new TypeError(`${label} is required`)
  return result
}

function entryApplies(entry, projectId, textId) {
  if (entry.status !== 'active') return false
  if (entry.level === 'text') return entry.scope?.projectId === projectId && entry.scope?.textId === textId
  if (entry.level === 'project') return entry.scope?.projectId === projectId
  if (entry.level === 'topic') return entry.scope?.projectIds?.includes(projectId)
  if (entry.level === 'personal') return entry.scope?.allProjects === true || entry.scope?.projectIds?.includes(projectId)
  return false
}

function selectionReason(entry) {
  if (entry.level === 'text') return 'Aktiver Text und Ursprungsprojekt stimmen überein.'
  if (entry.level === 'project') return 'Eintrag gehört zum aktiven Projekt.'
  if (entry.level === 'topic') return 'Themenwissen wurde ausdrücklich für dieses Projekt freigegeben.'
  return 'Persönliche Präferenz wurde ausdrücklich für dieses Projekt freigegeben.'
}

export function retrieveMemoryContext({ store, projectId, textId = null }) {
  const normalized = ensureMemoryStore(clone(store))
  return {
    schemaVersion: 1,
    projectId,
    textId,
    records: normalized.entries
      .filter(entry => entryApplies(entry, projectId, textId))
      .map(entry => ({ entry: clone(entry), reason: selectionReason(entry) })),
  }
}

export function buildStyleMemoryContext({ store, projectId, textId = null }) {
  const records = retrieveMemoryContext({ store, projectId, textId }).records
    .filter(record => record.entry.type === 'voice')
  return {
    projectVoice: records.filter(record => record.entry.level === 'project').map(record => record.entry.content),
    personalPreferences: records.filter(record => record.entry.level === 'personal').map(record => record.entry.content),
    binding: {
      projectVoice: 'project-decision',
      personalPreferences: 'non-binding-preference',
    },
  }
}

export function createTransferRequest(store, input) {
  const next = ensureMemoryStore(clone(store))
  const entry = next.entries.find(candidate => candidate?.id === input?.entryId)
  if (!entry) throw new TypeError('Memory transfer entry is required')
  if (entry.level !== 'project' || entry.scope?.projectId !== input.fromProjectId) {
    throw new TypeError('Memory transfer project mismatch')
  }
  if (input.fromProjectId === input.toProjectId) throw new TypeError('Memory transfer target project must differ')
  if (!Number.isFinite(input.at)) throw new TypeError('Memory transfer time is required')
  const id = text(input.id, 'Memory transfer id')
  if (next.transfers.some(transfer => transfer?.id === id)) throw new TypeError(`Duplicate memory transfer: ${id}`)
  next.transfers.push({
    id,
    entryId: entry.id,
    fromProjectId: text(input.fromProjectId, 'Memory transfer source project'),
    toProjectId: text(input.toProjectId, 'Memory transfer target project'),
    suggestedLevel: input.suggestedLevel === 'personal' ? 'personal' : 'topic',
    sensitivity: entry.sensitivity,
    contentPreview: entry.sensitivity === 'standard' ? entry.content : null,
    status: 'pending',
    requestedAt: input.at,
  })
  return next
}

export function decideMemoryTransfer(store, transferId, { approved, actor, at }) {
  const next = ensureMemoryStore(clone(store))
  const index = next.transfers.findIndex(transfer => transfer?.id === transferId)
  if (index < 0) throw new TypeError('Memory transfer is unknown')
  const transfer = next.transfers[index]
  if (transfer.status !== 'pending') throw new TypeError('Memory transfer was already decided')
  if (actor !== 'user') throw new TypeError('Memory transfer requires explicit user consent')
  if (!Number.isFinite(at)) throw new TypeError('Memory transfer decision time is required')
  transfer.status = approved ? 'approved' : 'rejected'
  transfer.decidedAt = at
  transfer.decidedBy = 'user'
  if (!approved) return next

  const source = next.entries.find(entry => entry.id === transfer.entryId)
  if (!source) throw new TypeError('Memory transfer source entry is missing')
  const consentId = `consent-${transfer.id}`
  next.consents.push({
    id: consentId,
    transferId: transfer.id,
    fromProjectId: transfer.fromProjectId,
    toProjectId: transfer.toProjectId,
    approved: true,
    actor: 'user',
    at,
  })
  const level = transfer.suggestedLevel
  const scope = level === 'personal'
    ? { ownerId: 'local-author', projectIds: [transfer.toProjectId] }
    : { topicId: `topic-${source.id}`, projectIds: [transfer.toProjectId] }
  next.entries.push(createMemoryEntry({
    id: `memory-${transfer.id}`,
    level,
    type: source.type,
    content: source.content,
    scope,
    provenance: {
      actor: 'user',
      action: 'memory-transfer-consent',
      originEventIds: source.provenance.originEventIds,
    },
    sensitivity: source.sensitivity,
    deletionRule: 'manual',
    createdAt: at,
  }))
  return next
}
