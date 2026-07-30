import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildStyleMemoryContext,
  createTransferRequest,
  decideMemoryTransfer,
  retrieveMemoryContext,
} from '../src/memory-retrieval.mjs'
import { createMemoryEntry, ensureMemoryStore } from '../src/memory-model.mjs'

function entry(id, level, content, scope, type = 'knowledge', sensitivity = 'standard') {
  const deletionRule = level === 'text' ? 'with-text' : level === 'project' ? 'with-project' : 'manual'
  return createMemoryEntry({
    id,
    level,
    type,
    content,
    scope,
    provenance: { actor: 'user', action: 'confirm', originEventIds: [`event-${id}`] },
    sensitivity,
    deletionRule,
    createdAt: 10,
  })
}

test('INV-05: Retrieval enthält nur Text, Projekt und ausdrücklich freigegebene globale Einträge', () => {
  const canary = 'CANARY-PROJEKT-A-VERTRAULICH'
  const store = ensureMemoryStore({
    entries: [
      entry('text-a', 'text', canary, { projectId: 'p-a', textId: 'd-a' }, 'knowledge', 'sensitive'),
      entry('project-a', 'project', canary, { projectId: 'p-a' }, 'knowledge', 'sensitive'),
      entry('project-b', 'project', 'Ziel B', { projectId: 'p-b' }),
      entry('topic-b', 'topic', 'Freigegebenes Fachwissen', { topicId: 'topic-1', projectIds: ['p-b'] }),
      entry('personal-b', 'personal', 'Kurze klare Sätze', { ownerId: 'local-author', projectIds: ['p-b'] }, 'voice', 'personal'),
    ],
  })
  const context = retrieveMemoryContext({ store, projectId: 'p-b', textId: 'd-b' })
  const serialized = JSON.stringify(context)
  assert.equal(serialized.includes(canary), false)
  assert.deepEqual(context.records.map(item => item.entry.id), ['project-b', 'topic-b', 'personal-b'])
  assert.equal(context.records.every(item => item.reason && item.entry.provenance), true)
})

test('MEMORY-04: Ablehnung verhindert Übernahme, Freigabe erzeugt Consent und zielgebundenen Eintrag', () => {
  const source = entry('source-memory', 'project', 'Nur nach Freigabe', { projectId: 'p-a' }, 'knowledge', 'sensitive')
  const store = ensureMemoryStore({ entries: [source] })
  const requested = createTransferRequest(store, {
    id: 'transfer-1',
    entryId: source.id,
    fromProjectId: 'p-a',
    toProjectId: 'p-b',
    suggestedLevel: 'topic',
    at: 20,
  })
  assert.equal(JSON.stringify(requested.transfers).includes('Nur nach Freigabe'), false)
  const rejected = decideMemoryTransfer(requested, 'transfer-1', { approved: false, actor: 'user', at: 30 })
  assert.equal(rejected.entries.length, 1)
  assert.equal(rejected.transfers[0].status, 'rejected')

  const approved = decideMemoryTransfer(requested, 'transfer-1', { approved: true, actor: 'user', at: 31 })
  assert.equal(approved.entries.length, 2)
  assert.equal(approved.transfers[0].status, 'approved')
  assert.equal(approved.consents.length, 1)
  assert.deepEqual(approved.entries[1].scope.projectIds, ['p-b'])
  assert.deepEqual(retrieveMemoryContext({ store: approved, projectId: 'p-b' }).records.map(item => item.entry.id), [
    'memory-transfer-1',
  ])
})

test('MEMORY-05: Autorenstimme und Projektstimme bleiben getrennt und unterschiedlich verbindlich', () => {
  const store = ensureMemoryStore({
    entries: [
      entry('project-voice-a', 'project', 'Sachlich und institutionell', { projectId: 'p-a' }, 'voice'),
      entry('project-voice-b', 'project', 'Knapp und direkt', { projectId: 'p-b' }, 'voice'),
      entry('personal-voice', 'personal', 'Bildhafte Einstiege bevorzugt', { ownerId: 'local-author', projectIds: ['p-a', 'p-b'] }, 'voice', 'personal'),
    ],
  })
  const a = buildStyleMemoryContext({ store, projectId: 'p-a' })
  const b = buildStyleMemoryContext({ store, projectId: 'p-b' })
  assert.deepEqual(a.projectVoice, ['Sachlich und institutionell'])
  assert.deepEqual(b.projectVoice, ['Knapp und direkt'])
  assert.deepEqual(a.personalPreferences, ['Bildhafte Einstiege bevorzugt'])
  assert.equal(a.binding.projectVoice, 'project-decision')
  assert.equal(a.binding.personalPreferences, 'non-binding-preference')
})

test('Projektfremde oder fehlende Transfereinträge werden abgewiesen', () => {
  const store = ensureMemoryStore({
    entries: [entry('source', 'project', 'A', { projectId: 'p-a' })],
  })
  assert.throws(() => createTransferRequest(store, {
    id: 'bad',
    entryId: 'source',
    fromProjectId: 'p-x',
    toProjectId: 'p-b',
    at: 20,
  }), /project/i)
})
