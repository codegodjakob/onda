import test from 'node:test'
import assert from 'node:assert/strict'
import {
  correctDossierItem,
  synchronizeProjectMemory,
} from '../src/memory-dossier.mjs'
import { ensureMemoryStore, ensureProjectMemoryShape } from '../src/memory-model.mjs'

function fixture() {
  const project = ensureProjectMemoryShape({
    id: 'p-a',
    name: 'Projekt A',
    understanding: {
      task: 'Eine belastbare Analyse schreiben',
      audience: ['Fachpublikum'],
      desiredEffect: 'Grenzen und Befunde nachvollziehbar machen',
      evidenceStandard: 'Originalfundstellen',
      protectedIntentions: [],
      openQuestions: [],
      updatedAt: 100,
    },
    memoryTerms: [{ id: 'term-1', term: 'Calm Technology', meaning: 'Technik am Rand der Aufmerksamkeit', updatedAt: 105 }],
    sources: [{
      id: 'source-1',
      projectId: 'p-a',
      checksumSha256: 'abc',
      status: 'active',
      metadata: { title: { value: 'Originalstudie' } },
      locators: [],
    }],
    evidenceBundles: [{
      id: 'bundle-1',
      projectId: 'p-a',
      claimId: 'claim-1',
      claimText: 'Eine enge Aussage.',
      status: 'supported',
    }],
    researchRuns: [{ id: 'run-1', projectId: 'p-a', status: 'completed', updatedAt: 120, question: 'Was trägt die Aussage?' }],
  })
  const docs = [{
    id: 'd-a',
    projectId: 'p-a',
    title: 'Text A',
    body: '<p>Nutzertext bleibt unverändert.</p>',
    updated: 110,
    decisions: [{
      id: 'decision-1',
      action: 'accepted',
      findingId: 'finding-1',
      resultText: 'Eigene Fassung',
      at: 115,
      provenance: { actor: 'user', action: 'accepted' },
    }],
  }]
  return { project, docs, store: ensureMemoryStore(null) }
}

test('MEMORY-01/03: automatischer Rebuild erfasst Ziele, Begriffe, Quellen und Entscheidungen ohne Primärmutation', () => {
  const input = fixture()
  const projectBefore = JSON.stringify(input.project)
  const docsBefore = JSON.stringify(input.docs)
  const result = synchronizeProjectMemory(input)
  assert.equal(JSON.stringify(input.project), projectBefore)
  assert.equal(JSON.stringify(input.docs), docsBefore)
  assert.ok(result.store.events.length >= 6)
  assert.equal(result.dossier.goals.length, 3)
  assert.equal(result.dossier.terms[0].label, 'Calm Technology')
  assert.equal(result.dossier.sources[0].label, 'Originalstudie')
  assert.equal(result.dossier.decisions[0].value, 'Eigene Fassung')
  for (const section of ['goals', 'terms', 'sources', 'decisions', 'research']) {
    assert.equal(result.dossier[section].every(item => item.originEventIds.length > 0), true)
  }
})

test('MEMORY-01: gleicher Primärzustand erzeugt keine doppelten Ereignisse und denselben Dossierinhalt', () => {
  const first = synchronizeProjectMemory(fixture())
  const second = synchronizeProjectMemory({
    ...fixture(),
    store: first.store,
  })
  assert.equal(second.store.events.length, first.store.events.length)
  assert.deepEqual(second.dossier, first.dossier)
})

test('MEMORY-03: aktualisierte Entitäten erscheinen einmal mit aktuellem Wert und vollständiger Herkunft', () => {
  const input = fixture()
  const first = synchronizeProjectMemory(input)
  input.project.memoryTerms[0].meaning = 'Aktualisierte verbindliche Bedeutung'
  input.project.memoryTerms[0].updatedAt = 205
  input.project.sources[0].metadata.title.value = 'Originalstudie, zweite Fassung'
  input.project.sources[0].checksumSha256 = 'def'
  input.project.sources[0].importedAt = 210
  const second = synchronizeProjectMemory({ ...input, store: first.store })
  assert.equal(second.dossier.terms.length, 1)
  assert.equal(second.dossier.terms[0].value, 'Aktualisierte verbindliche Bedeutung')
  assert.equal(second.dossier.terms[0].originEventIds.length, 2)
  assert.equal(second.dossier.sources.length, 1)
  assert.equal(second.dossier.sources[0].label, 'Originalstudie, zweite Fassung')
  assert.equal(second.dossier.sources[0].originEventIds.length, 2)
})

test('MEMORY-01/03: Quellen- und Belegstatusänderungen werden als neue Ereignisse abgeleitet', () => {
  const input = fixture()
  const first = synchronizeProjectMemory(input)
  input.project.sources[0].status = 'retracted'
  input.project.sources[0].history = [{
    id: 'source-event-retracted',
    kind: 'retracted',
    at: 220,
    reason: 'Rücknahme durch Herausgeber',
  }]
  input.project.evidenceBundles[0].status = 'review-required'
  input.project.evidenceBundles[0].history = [{
    eventId: 'source-event-retracted',
    kind: 'retracted',
    at: 220,
  }]
  const second = synchronizeProjectMemory({ ...input, store: first.store })
  assert.equal(second.dossier.sources.length, 1)
  assert.equal(second.dossier.sources[0].value, 'retracted')
  assert.equal(second.dossier.sources[0].originEventIds.length, 2)
  assert.equal(second.dossier.evidence.length, 1)
  assert.equal(second.dossier.evidence[0].status, 'review-required')
  assert.equal(second.dossier.evidence[0].originEventIds.length, 2)
})

test('MEMORY-03: Korrektur überlagert das Dossier sichtbar, ohne Understanding zu ändern', () => {
  const input = fixture()
  const first = synchronizeProjectMemory(input)
  const goal = first.dossier.goals.find(item => item.id === 'goal:task')
  const corrected = correctDossierItem({
    project: input.project,
    docs: input.docs,
    store: first.store,
    targetId: goal.id,
    value: 'Eine eng begrenzte Analyse schreiben',
    at: 200,
  })
  assert.equal(corrected.dossier.goals.find(item => item.id === goal.id).value, 'Eine eng begrenzte Analyse schreiben')
  assert.equal(corrected.dossier.goals.find(item => item.id === goal.id).corrected, true)
  assert.equal(input.project.understanding.task, 'Eine belastbare Analyse schreiben')
  assert.match(corrected.store.events.at(-1).id, /correction/)
})

test('Deaktiviertes Projektgedächtnis wird nicht still neu aufgebaut', () => {
  const input = fixture()
  input.project.memory.enabled = false
  const result = synchronizeProjectMemory(input)
  assert.deepEqual(result.store.events, [])
  assert.equal(result.dossier, null)
})
