import test from 'node:test'
import assert from 'node:assert/strict'
import {
  emptyLocalState,
  exportAllLocalData,
  importAllLocalData,
  validateAllLocalDataExport,
} from '../src/data-control.mjs'

function fullStateWithSecretCanaries() {
  return {
    schemaVersion: 12,
    active: 'd-a',
    activeProject: 'p-a',
    settings: {
      theme: 'paper',
      apiKey: 'CANARY-SECRET-API',
      nested: { authorization: 'CANARY-SECRET-AUTH', calm: true },
    },
    memoryStore: {
      schemaVersion: 1,
      records: [{
        id: 'memory-a',
        projectId: 'p-a',
        kind: 'understanding',
        snapshot: { task: 'Lesbarer Text' },
        provenance: { actor: 'user', action: 'confirm' },
      }],
      sessions: [{ id: 'session-a', sessionToken: 'CANARY-SECRET-SESSION' }],
    },
    projects: [
      {
        id: 'p-a',
        name: 'Alpha',
        sources: [{
          id: 'source-a',
          projectId: 'p-a',
          title: 'Quelle A',
          provenance: { actor: 'user', action: 'import' },
        }],
        evidenceBundles: [{
          id: 'bundle-a',
          projectId: 'p-a',
          status: 'supported',
          provenance: { actor: 'user', action: 'evidence-assemble' },
        }],
        researchRuns: [{ id: 'research-a', projectId: 'p-a', status: 'completed' }],
        argumentModel: {
          projectId: 'p-a',
          claims: [],
          relations: [],
          findings: [],
          events: [{ id: 'argument-decision', projectId: 'p-a', kind: 'claim-corrected' }],
          deliberationRounds: [],
        },
        languageReports: {
          projectId: 'p-a',
          byText: {},
          history: [],
          decisions: [{ id: 'language-decision', projectId: 'p-a', textId: 'd-a' }],
        },
        finalAudits: {
          projectId: 'p-a',
          byText: {},
          history: [{ id: 'audit-decision', projectId: 'p-a', textId: 'd-a' }],
        },
      },
      {
        id: 'p-b',
        name: 'Beta',
        sources: [{
          id: 'source-b',
          projectId: 'p-b',
          title: 'Quelle B',
          provenance: { actor: 'user', action: 'import' },
        }],
        evidenceBundles: [],
        researchRuns: [],
      },
    ],
    docs: [
      {
        id: 'd-a',
        projectId: 'p-a',
        title: 'Text A',
        body: '<p>A</p>',
        decisions: [{ id: 'decision-a', findingId: 'finding-a', kind: 'accept' }],
        provenance: { actor: 'user', action: 'document-create' },
      },
      {
        id: 'd-b',
        projectId: 'p-a',
        title: 'Text B',
        body: '<p>B</p>',
        decisions: [],
      },
      {
        id: 'd-c',
        projectId: 'p-b',
        title: 'Text C',
        body: '<p>C</p>',
        decisions: [],
      },
    ],
  }
}

test('SYSTEM-10: Gesamtexport bewahrt alle Domänen und entfernt Secrets', () => {
  const payload = exportAllLocalData({ state: fullStateWithSecretCanaries(), at: 100 })
  assert.deepEqual(payload.manifest.counts, {
    projects: 2,
    texts: 3,
    sources: 2,
    decisions: 4,
    provenanceRecords: 5,
  })
  assert.equal(validateAllLocalDataExport(payload).valid, true)
  assert.equal(JSON.stringify(payload).includes('CANARY-SECRET'), false)
  assert.deepEqual(importAllLocalData(payload), payload.state)
  assert.equal(payload.appStateSchemaVersion, 12)
})

test('SYSTEM-10: Export ist zeitunabhängig strukturell reproduzierbar und verändert den Zustand nicht', () => {
  const state = fullStateWithSecretCanaries()
  const original = structuredClone(state)
  const first = exportAllLocalData({ state, at: 100 })
  const second = exportAllLocalData({ state, at: 999 })
  assert.equal(first.fingerprint, second.fingerprint)
  assert.deepEqual({ ...first, exportedAt: 0 }, { ...second, exportedAt: 0 })
  assert.deepEqual(state, original)
})

test('SYSTEM-10: beschädigter Fingerprint, Manifest oder Pflichtbestand wird atomar abgewiesen', () => {
  const payload = exportAllLocalData({ state: fullStateWithSecretCanaries(), at: 100 })
  const brokenFingerprint = structuredClone(payload)
  brokenFingerprint.fingerprint = 'kaputt'
  assert.deepEqual(validateAllLocalDataExport(brokenFingerprint), {
    valid: false,
    category: 'fingerprint',
    errors: ['Der strukturelle Fingerprint stimmt nicht.'],
  })
  assert.throws(() => importAllLocalData(brokenFingerprint), /fingerprint/i)

  const brokenManifest = structuredClone(payload)
  brokenManifest.manifest.counts.texts = 999
  assert.equal(validateAllLocalDataExport(brokenManifest).category, 'manifest')
  assert.throws(() => importAllLocalData(brokenManifest), /manifest/i)

  const missingDocs = structuredClone(payload)
  delete missingDocs.state.docs
  assert.equal(validateAllLocalDataExport(missingDocs).category, 'collection')
  assert.throws(() => importAllLocalData(missingDocs), /collection/i)
})

test('SYSTEM-10: verwaiste Projekt- und Aktiv-Referenzen werden vor dem Import abgewiesen', () => {
  const payload = exportAllLocalData({ state: fullStateWithSecretCanaries(), at: 100 })
  const dangling = structuredClone(payload)
  dangling.state.docs[0].projectId = 'p-missing'
  dangling.manifest = payload.manifest
  dangling.fingerprint = payload.fingerprint
  const result = validateAllLocalDataExport(dangling)
  assert.equal(result.valid, false)
  assert.equal(result.category, 'reference')

  const active = structuredClone(payload)
  active.state.active = 'd-missing'
  const activeResult = validateAllLocalDataExport(active)
  assert.equal(activeResult.valid, false)
  assert.equal(activeResult.category, 'reference')
})

test('Leerer Löschzustand enthält keine Projekte, Texte, Erinnerung oder aktive Referenzen', () => {
  assert.deepEqual(emptyLocalState(), {
    schemaVersion: 12,
    docs: [],
    active: null,
    projects: [],
    activeProject: null,
    settings: {},
    memoryStore: { schemaVersion: 1, records: [], events: [] },
  })
})

test('Fremde Exportarten, ungültige Zeiten und zyklische Zustände werden fail-closed abgewiesen', () => {
  assert.throws(() => exportAllLocalData({ state: {}, at: Number.NaN }), /time/i)
  const cyclic = fullStateWithSecretCanaries()
  cyclic.settings.self = cyclic.settings
  assert.throws(() => exportAllLocalData({ state: cyclic, at: 100 }), /cyclic/i)
  assert.deepEqual(validateAllLocalDataExport({ kind: 'foreign' }), {
    valid: false,
    category: 'format',
    errors: ['Das Datenpaket besitzt ein unbekanntes Format.'],
  })
})
