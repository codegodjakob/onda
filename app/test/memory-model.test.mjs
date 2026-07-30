import test from 'node:test'
import assert from 'node:assert/strict'
import {
  appendMemoryEvent,
  createMemoryEntry,
  createMemoryEvent,
  ensureMemoryStore,
  ensureProjectMemoryShape,
} from '../src/memory-model.mjs'

const provenance = { actor: 'user', action: 'confirm', originEventIds: ['event-origin'] }

test('MEMORY-02: jede der vier Ebenen besitzt genau ihren Geltungsbereich', () => {
  const fixtures = [
    ['text', { projectId: 'p-a', textId: 'd-a' }, 'with-text'],
    ['project', { projectId: 'p-a' }, 'with-project'],
    ['topic', { topicId: 'topic-a', projectIds: ['p-a'] }, 'manual'],
    ['personal', { ownerId: 'local-author', projectIds: ['p-a'] }, 'manual'],
  ]
  for (const [level, scope, deletionRule] of fixtures) {
    const entry = createMemoryEntry({
      id: `memory-${level}`,
      level,
      type: level === 'personal' ? 'voice' : 'knowledge',
      content: `Inhalt ${level}`,
      scope,
      provenance,
      sensitivity: level === 'personal' ? 'personal' : 'standard',
      deletionRule,
      createdAt: 10,
    })
    assert.equal(entry.level, level)
    assert.deepEqual(entry.scope, scope)
    assert.equal(entry.status, 'active')
  }
})

test('MEMORY-02: falsche Scopes, Provenienz, Sensitivität und Löschregeln scheitern geschlossen', () => {
  const base = {
    id: 'bad',
    level: 'text',
    type: 'knowledge',
    content: 'Inhalt',
    scope: { projectId: 'p-a', textId: 'd-a' },
    provenance,
    sensitivity: 'standard',
    deletionRule: 'with-text',
    createdAt: 10,
  }
  assert.throws(() => createMemoryEntry({ ...base, level: 'unknown' }), /level/i)
  assert.throws(() => createMemoryEntry({ ...base, scope: { projectId: 'p-a' } }), /textId/i)
  assert.throws(() => createMemoryEntry({ ...base, provenance: {} }), /provenance/i)
  assert.throws(() => createMemoryEntry({ ...base, sensitivity: 'secret-score' }), /sensitivity/i)
  assert.throws(() => createMemoryEntry({ ...base, deletionRule: 'never' }), /deletion/i)
})

test('MEMORY-01: Ereignisse werden unveränderlich angehängt und Duplikate abgewiesen', () => {
  const event = createMemoryEvent({
    id: 'event-1',
    projectId: 'p-a',
    kind: 'decision',
    entityId: 'decision-1',
    snapshot: { choice: 'Eigene Fassung' },
    provenance: { actor: 'user', action: 'decision' },
    sensitivity: 'standard',
    at: 20,
  })
  const empty = ensureMemoryStore(null)
  const next = appendMemoryEvent(empty, event)
  assert.equal(empty.events.length, 0)
  assert.deepEqual(next.events, [event])
  assert.throws(() => appendMemoryEvent(next, event), /duplicate/i)
  event.snapshot.choice = 'Mutiert'
  assert.equal(next.events[0].snapshot.choice, 'Eigene Fassung')
})

test('Migration repariert beschädigte Listen additiv und Projektgedächtnis startet aktiv', () => {
  const store = ensureMemoryStore({ events: {}, entries: null, transfers: 'bad', consents: [] })
  assert.deepEqual(store.events, [])
  assert.deepEqual(store.entries, [])
  assert.deepEqual(store.transfers, [])
  const project = ensureProjectMemoryShape({ id: 'p-a', sources: [{ id: 'keep' }], memory: [] })
  assert.equal(project.memory.enabled, true)
  assert.deepEqual(project.memory.eventIds, [])
  assert.equal(project.sources[0].id, 'keep')
})
