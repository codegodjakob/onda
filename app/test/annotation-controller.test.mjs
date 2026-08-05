import test from 'node:test'
import assert from 'node:assert/strict'
import {
  annotationSummary,
  createAnnotationController,
  normalizeAnnotationWorkspace,
  orderedAnnotations,
} from '../src/annotation-controller.mjs'

function findings() {
  return [
    { id: 'taste', status: 'open', anmerkungsart: 'wortwahl', createdAt: 1 },
    { id: 'error', status: 'open', anmerkungsart: 'beleg', createdAt: 3 },
    { id: 'recommend', status: 'open', anmerkungsart: 'satzstil', createdAt: 2 },
    { id: 'done', status: 'resolved', anmerkungsart: 'grammatik', createdAt: 0 },
  ]
}

function harness(extraWorkspace = {}) {
  const workspace = normalizeAnnotationWorkspace(extraWorkspace)
  const state = { findings: findings(), workspace, applied: [], undone: [], persisted: 0 }
  const controller = createAnnotationController({
    getFindings: () => state.findings,
    getWorkspace: () => state.workspace,
    persist: () => { state.persisted += 1 },
    accept: finding => { state.applied.push(finding.id); finding.status = 'resolved'; return { ok: true, id: `op-${finding.id}` } },
    undo: operation => { state.undone.push(operation.id); return { ok: true } },
  })
  return { state, controller }
}

test('Zusammenfassung zählt Fehler, Empfehlungen und Geschmack getrennt', () => {
  assert.deepEqual(annotationSummary(findings()), {
    fehler: 1,
    empfehlungen: 1,
    geschmack: 1,
    total: 3,
  })
})

test('Reihenfolge folgt Fehler, Empfehlung, Geschmack und bleibt stabil', () => {
  assert.deepEqual(orderedAnnotations(findings(), 'aufschauen').map(item => item.id), [
    'error', 'recommend', 'taste',
  ])
})

test('stiller Modus behält die Zähler, liefert aber keine aktive Oberfläche', () => {
  const { controller } = harness({ quietAnnotations: true })
  assert.equal(controller.current('aufschauen'), null)
  assert.equal(controller.summary().total, 3)
})

test('aktive Auswahl, Weiter und Zurück verwenden eine einzige ID', () => {
  const { state, controller } = harness()
  assert.equal(controller.current('aufschauen').id, 'error')
  assert.equal(controller.next('aufschauen').id, 'recommend')
  assert.equal(state.workspace.activeAnnotationId, 'recommend')
  assert.equal(controller.previous('aufschauen').id, 'error')
})

test('Modus und Ruhe werden normalisiert und persistiert', () => {
  const workspace = normalizeAnnotationWorkspace({ annotationMode: 'kaputt', quietAnnotations: 'ja', undoStack: 'kaputt' })
  assert.equal(workspace.annotationMode, 'text')
  assert.equal(workspace.quietAnnotations, false)
  assert.deepEqual(workspace.undoStack, [])

  const { state, controller } = harness()
  controller.setMode('notiz')
  controller.setQuiet(true)
  assert.equal(state.workspace.annotationMode, 'notiz')
  assert.equal(state.workspace.quietAnnotations, true)
  assert.equal(state.persisted, 2)
})

test('Undo-Stack ist auf 20 Einträge begrenzt und wird zuletzt zuerst abgearbeitet', () => {
  const { state, controller } = harness()
  for (let index = 0; index < 22; index += 1) controller.pushUndo({ ok: true, id: `op-${index}` })
  assert.equal(state.workspace.undoStack.length, 20)
  assert.equal(state.workspace.undoStack[0].id, 'op-2')
  assert.equal(controller.undoLast().ok, true)
  assert.deepEqual(state.undone, ['op-21'])
})

test('Sammelannahme erfasst nur sichere Korrekturen, keine Quellen- oder Geschmacksfälle', () => {
  const { state, controller } = harness()
  state.findings.push(
    { id: 'spelling', status: 'open', anmerkungsart: 'rechtschreibung', action: 'neu' },
    { id: 'grammar', status: 'open', anmerkungsart: 'grammatik', action: 'neu' },
    { id: 'punctuation', status: 'open', anmerkungsart: 'zeichensetzung', action: 'neu' },
  )
  const result = controller.acceptAllSafeCorrections()
  assert.equal(result.ok, true)
  assert.deepEqual(state.applied, ['spelling', 'grammar', 'punctuation'])
  assert.equal(state.findings.find(item => item.id === 'error').status, 'open')
  assert.equal(state.findings.find(item => item.id === 'taste').status, 'open')
})

test('kaputte Adapter oder leere Warteschlange bleiben ruhig und deterministisch', () => {
  const controller = createAnnotationController({ getFindings: () => null, getWorkspace: () => null })
  assert.deepEqual(controller.summary(), { fehler: 0, empfehlungen: 0, geschmack: 0, total: 0 })
  assert.equal(controller.current(), null)
  assert.deepEqual(controller.acceptAllSafeCorrections(), { ok: false, reason: 'no-safe-corrections' })
  assert.deepEqual(controller.undoLast(), { ok: false, reason: 'nothing-to-undo' })
})

