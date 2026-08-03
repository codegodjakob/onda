import test from 'node:test'
import assert from 'node:assert/strict'
import {
  deleteMemoryScope,
  exportMemory,
  validateMemoryExport,
} from '../src/memory-portability.mjs'
import { createMemoryEntry, ensureMemoryStore, ensureProjectMemoryShape } from '../src/memory-model.mjs'

function project(id, secret = '') {
  return ensureProjectMemoryShape({
    id,
    name: `Project ${id}`,
    memory: {
      enabled: true,
      eventIds: [`event-${id}`],
      dossier: { projectId: id, goals: [{ id: 'goal', value: `Goal ${id}`, originEventIds: [`event-${id}`] }] },
    },
    sources: [{ id: `source-${id}`, original: `Original ${id}` }],
    userTextCanary: secret,
  })
}

function memoryEntry(id, level, scope) {
  return createMemoryEntry({
    id,
    level,
    type: 'knowledge',
    content: `Memory ${id}`,
    scope,
    provenance: { actor: 'user', action: 'confirm', originEventIds: [`event-${id}`] },
    sensitivity: 'standard',
    deletionRule: level === 'project' ? 'with-project' : 'manual',
    createdAt: 10,
  })
}

test('MEMORY-06: Projekt- und Gesamtexport sind vollständig, lesbar und referenziell gültig', () => {
  const projects = [project('p-a'), project('p-b')]
  const store = ensureMemoryStore({
    events: [
      { id: 'event-p-a', projectId: 'p-a', kind: 'understanding', entityId: 'p-a', snapshot: {}, provenance: { actor: 'user', action: 'confirm' }, sensitivity: 'standard', at: 1 },
      { id: 'event-p-b', projectId: 'p-b', kind: 'understanding', entityId: 'p-b', snapshot: {}, provenance: { actor: 'user', action: 'confirm' }, sensitivity: 'standard', at: 1 },
    ],
    entries: [
      memoryEntry('entry-a', 'project', { projectId: 'p-a' }),
      memoryEntry('entry-b', 'project', { projectId: 'p-b' }),
    ],
  })
  const one = exportMemory({ store, projects, scope: { kind: 'project', projectId: 'p-a' } })
  assert.equal(validateMemoryExport(one).valid, true)
  assert.deepEqual(one.projects.map(item => item.id), ['p-a'])
  assert.deepEqual(one.memory.entries.map(item => item.id), ['entry-a'])
  const all = exportMemory({ store, projects, scope: { kind: 'all' } })
  assert.equal(validateMemoryExport(all).valid, true)
  assert.equal(all.projects.length, 2)
})

test('SYSTEM-03: Secret-Schlüssel und Autorisierungswerte erscheinen nicht im Export', () => {
  const store = ensureMemoryStore({ entries: [] })
  store.apiKey = 'CANARY-secret-key'
  store.index = { authorization: 'Bearer CANARY-secret-key', safe: 'ok' }
  const exported = exportMemory({ store, projects: [project('p-a')], scope: { kind: 'all' } })
  assert.equal(JSON.stringify(exported).includes('CANARY-secret-key'), false)
  assert.equal(exported.memory.index.safe, 'ok')
})

test('MEMORY-06: Projektlöschung entfernt Ereignisse, Einträge, Transfers und Dossier, nicht aber Primärdaten anderer Projekte', () => {
  const projects = [project('p-a', 'CANARY-A'), project('p-b', 'CANARY-B')]
  const store = ensureMemoryStore({
    events: [
      { id: 'event-p-a', projectId: 'p-a', kind: 'understanding', entityId: 'p-a', snapshot: {}, provenance: { actor: 'user', action: 'confirm' }, sensitivity: 'standard', at: 1 },
      { id: 'event-p-b', projectId: 'p-b', kind: 'understanding', entityId: 'p-b', snapshot: {}, provenance: { actor: 'user', action: 'confirm' }, sensitivity: 'standard', at: 1 },
    ],
    entries: [
      memoryEntry('entry-a', 'project', { projectId: 'p-a' }),
      memoryEntry('entry-b', 'project', { projectId: 'p-b' }),
    ],
    transfers: [{ id: 't', entryId: 'entry-a', fromProjectId: 'p-a', toProjectId: 'p-b', status: 'pending' }],
  })
  const beforeB = JSON.stringify(projects[1])
  const result = deleteMemoryScope({ store, projects, scope: { kind: 'project', projectId: 'p-a' } })
  assert.equal(result.store.events.some(event => event.projectId === 'p-a'), false)
  assert.equal(result.store.entries.some(entry => entry.scope.projectId === 'p-a'), false)
  assert.equal(result.store.transfers.length, 0)
  assert.equal(result.projects[0].memory.enabled, false)
  assert.equal(result.projects[0].sources[0].original, 'Original p-a')
  assert.equal(result.projects[0].userTextCanary, 'CANARY-A')
  assert.equal(JSON.stringify(result.projects[1]), beforeB)
})

test('Ebenenlöschung entfernt nur die gewählte Ebene und abgeleitete Transfers', () => {
  const projectEntry = memoryEntry('project-entry', 'project', { projectId: 'p-a' })
  const topicEntry = memoryEntry('topic-entry', 'topic', { topicId: 'topic', projectIds: ['p-a'] })
  const store = ensureMemoryStore({
    entries: [projectEntry, topicEntry],
    transfers: [{ id: 't', entryId: 'topic-entry', fromProjectId: 'p-a', toProjectId: 'p-b', status: 'pending' }],
  })
  const result = deleteMemoryScope({ store, projects: [project('p-a')], scope: { kind: 'level', level: 'topic' } })
  assert.deepEqual(result.store.entries.map(entry => entry.id), ['project-entry'])
  assert.deepEqual(result.store.transfers, [])
})
