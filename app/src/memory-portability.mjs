// Gedächtnis mitnehmen und löschen — PUR, node-testbar, kein DOM.
//
// Zwei Rechte in einem Modul: alles herausgeben (Export, nachprüfbar) und alles wieder
// loswerden (Löschen nach Ebene). Beim Export werden Schlüssel, Passwörter und
// Sitzungsmarken geschwärzt — ein mitgenommenes Gedächtnis darf kein Zugangsdatum
// enthalten.
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js), bedient über memory-ui.mjs.
import { ensureMemoryStore } from './memory-model.mjs'

const SECRET_KEY = /(api[-_]?key|password|passwd|secret|token|cookie|authorization|credential|session)/i

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function redact(value, parentKey = '') {
  if (SECRET_KEY.test(parentKey)) return '[redacted]'
  if (Array.isArray(value)) return value.map(item => redact(item))
  if (isObject(value)) {
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = redact(value[key], key)
      return result
    }, {})
  }
  if (typeof value === 'string' && /^bearer\s+/i.test(value.trim())) return '[redacted]'
  return value
}

function entryTouchesProject(entry, projectId) {
  return entry.scope?.projectId === projectId || entry.scope?.projectIds?.includes(projectId)
}

function filterStoreForProject(store, projectId) {
  const entryIds = new Set(store.entries.filter(entry => entryTouchesProject(entry, projectId)).map(entry => entry.id))
  const transfers = store.transfers.filter(transfer => (
    transfer.fromProjectId === projectId || transfer.toProjectId === projectId || entryIds.has(transfer.entryId)
  ))
  const transferIds = new Set(transfers.map(transfer => transfer.id))
  return {
    ...clone(store),
    events: store.events.filter(event => event.projectId === projectId),
    entries: store.entries.filter(entry => entryIds.has(entry.id)),
    transfers,
    consents: store.consents.filter(consent => transferIds.has(consent.transferId)),
  }
}

export function exportMemory({ store, projects = [], scope }) {
  const normalized = ensureMemoryStore(clone(store))
  let selectedProjects
  let selectedStore
  if (scope?.kind === 'project') {
    selectedProjects = projects.filter(project => project?.id === scope.projectId)
    selectedStore = filterStoreForProject(normalized, scope.projectId)
  } else if (scope?.kind === 'level') {
    selectedProjects = projects
    const entries = normalized.entries.filter(entry => entry.level === scope.level)
    const ids = new Set(entries.map(entry => entry.id))
    selectedStore = {
      ...normalized,
      entries,
      transfers: normalized.transfers.filter(transfer => ids.has(transfer.entryId)),
    }
  } else {
    selectedProjects = projects
    selectedStore = normalized
  }
  return redact({
    schemaVersion: 1,
    kind: 'ai-writing-tool-memory-export',
    scope: clone(scope || { kind: 'all' }),
    projects: selectedProjects.map(project => ({
      id: project.id,
      name: project.name || '',
      memory: clone(project.memory || null),
    })),
    memory: selectedStore,
  })
}

export function validateMemoryExport(value) {
  const errors = []
  if (value?.schemaVersion !== 1) errors.push('schema-version')
  if (value?.kind !== 'ai-writing-tool-memory-export') errors.push('kind')
  if (!Array.isArray(value?.projects)) errors.push('projects')
  if (!Array.isArray(value?.memory?.events)) errors.push('events')
  if (!Array.isArray(value?.memory?.entries)) errors.push('entries')
  const eventIds = new Set(value?.memory?.events?.map(event => event.id) || [])
  ;(value?.projects || []).forEach(project => {
    ;(project.memory?.dossier?.originEventIds || []).forEach(id => {
      if (!eventIds.has(id)) errors.push(`missing-event:${id}`)
    })
  })
  return { valid: errors.length === 0, errors }
}

function removeProjectFromEntry(entry, projectId) {
  if (entry.scope?.projectId === projectId) return null
  if (!Array.isArray(entry.scope?.projectIds)) return entry
  const next = clone(entry)
  next.scope.projectIds = next.scope.projectIds.filter(id => id !== projectId)
  return next.scope.projectIds.length ? next : null
}

export function deleteMemoryScope({ store, projects = [], scope }) {
  const nextStore = ensureMemoryStore(clone(store))
  const nextProjects = clone(projects)
  let removedEntryIds = new Set()

  if (scope?.kind === 'project') {
    const projectId = scope.projectId
    nextStore.events = nextStore.events.filter(event => event.projectId !== projectId)
    const keptEntries = []
    nextStore.entries.forEach(entry => {
      const next = removeProjectFromEntry(entry, projectId)
      if (!next) removedEntryIds.add(entry.id)
      else keptEntries.push(next)
    })
    nextStore.entries = keptEntries
    nextStore.transfers = nextStore.transfers.filter(transfer => {
      const remove = transfer.fromProjectId === projectId
        || transfer.toProjectId === projectId
        || removedEntryIds.has(transfer.entryId)
      return !remove
    })
    const transferIds = new Set(nextStore.transfers.map(transfer => transfer.id))
    nextStore.consents = nextStore.consents.filter(consent => transferIds.has(consent.transferId))
    const project = nextProjects.find(candidate => candidate?.id === projectId)
    if (project) project.memory = { enabled: false, eventIds: [], dossier: null }
  } else if (scope?.kind === 'level') {
    const kept = []
    nextStore.entries.forEach(entry => {
      if (entry.level === scope.level) removedEntryIds.add(entry.id)
      else kept.push(entry)
    })
    nextStore.entries = kept
    nextStore.transfers = nextStore.transfers.filter(transfer => !removedEntryIds.has(transfer.entryId))
    const transferIds = new Set(nextStore.transfers.map(transfer => transfer.id))
    nextStore.consents = nextStore.consents.filter(consent => transferIds.has(consent.transferId))
  } else if (scope?.kind === 'all') {
    nextStore.events = []
    nextStore.entries = []
    nextStore.transfers = []
    nextStore.consents = []
    nextStore.index = {}
    nextProjects.forEach(project => {
      project.memory = { enabled: false, eventIds: [], dossier: null }
    })
  } else {
    throw new TypeError('Memory delete scope is invalid')
  }
  return { store: nextStore, projects: nextProjects }
}
