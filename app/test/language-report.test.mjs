import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ensureLanguageReportStore,
  exportLanguageDossier,
  recordLanguageDecision,
  recordLanguageReport,
} from '../src/language-report.mjs'

function report(projectId, textId, diagnosticId = 'diag-a', at = 100) {
  return {
    projectId,
    textId,
    analyzedAt: at,
    context: { projectId, known: {}, missing: ['genre'] },
    diagnostics: [{ id: diagnosticId, projectId, textId, createdAt: at }],
    effect: { projectId, textId, passages: [], analyzedAt: at },
    rhetoric: { projectId, textId, devices: [], analyzedAt: at },
    fairness: { projectId, textId, findings: [], analyzedAt: at },
  }
}

test('D1-Dossier persistiert vollständige Berichte pro Text und dedupliziert unveränderte Analysen', () => {
  const project = { id: 'p-a', languageProfile: { projectId: 'p-a' } }
  recordLanguageReport({ project, report: report('p-a', 'd-a', 'diag-a', 100), at: 100 })
  recordLanguageReport({ project, report: report('p-a', 'd-b', 'diag-b', 101), at: 101 })
  recordLanguageReport({ project, report: report('p-a', 'd-a', 'diag-a', 102), at: 102 })
  assert.deepEqual(Object.keys(project.languageReports.byText).sort(), ['d-a', 'd-b'])
  assert.equal(project.languageReports.byText['d-a'].diagnostics[0].id, 'diag-a')
  assert.equal(project.languageReports.byText['d-b'].diagnostics[0].id, 'diag-b')
  assert.equal(project.languageReports.history.length, 2)
})

test('D1-Export enthält nur den gewählten Text samt Profil, Bericht, Historie und Entscheidungen', () => {
  const project = {
    id: 'p-a',
    languageProfile: {
      projectId: 'p-a',
      genre: 'essay',
      events: [
        { id: 'global', projectId: 'p-a', kind: 'profile-corrected', next: { genre: 'essay' } },
        {
          id: 'text-a',
          projectId: 'p-a',
          textId: 'd-a',
          kind: 'orthography-applied',
          oldText: 'warscheinlich',
          newText: 'wahrscheinlich',
        },
        {
          id: 'text-b',
          projectId: 'p-a',
          textId: 'd-b',
          kind: 'orthography-applied',
          oldText: 'CANARY-B-OLD',
          newText: 'CANARY-B-NEW',
        },
      ],
    },
  }
  recordLanguageReport({ project, report: report('p-a', 'd-a'), at: 100 })
  recordLanguageReport({ project, report: report('p-a', 'd-b', 'CANARY-B'), at: 101 })
  recordLanguageDecision({
    project,
    textId: 'd-a',
    findingId: 'diag-a',
    decision: 'reviewed',
    at: 102,
  })
  const exported = exportLanguageDossier({ project, textId: 'd-a' })
  assert.equal(exported.report.textId, 'd-a')
  assert.equal(exported.profile.genre, 'essay')
  assert.equal(exported.decisions.length, 1)
  assert.equal(JSON.stringify(exported).includes('CANARY-B'), false)
  assert.deepEqual(exported.profile.events.map(event => event.id), ['global', 'text-a'])
})

test('D1-Historie bewahrt jede inhaltlich verschiedene Vollanalyse unveränderlich', () => {
  const project = { id: 'p-a', languageProfile: { projectId: 'p-a' } }
  recordLanguageReport({ project, report: report('p-a', 'd-a', 'diag-old', 100), at: 100 })
  recordLanguageReport({ project, report: report('p-a', 'd-a', 'diag-new', 101), at: 101 })
  const exported = exportLanguageDossier({ project, textId: 'd-a' })
  assert.equal(exported.report.diagnostics[0].id, 'diag-new')
  assert.deepEqual(
    exported.history.map(event => event.report.diagnostics[0].id),
    ['diag-old', 'diag-new'],
  )
})

test('D1-Berichte und Entscheidungen weisen fremde Projekte und ungültige Daten fail-closed ab', () => {
  const project = { id: 'p-a' }
  ensureLanguageReportStore(project)
  assert.throws(() => recordLanguageReport({
    project,
    report: report('p-b', 'd-a'),
    at: 100,
  }), /project/i)
  assert.throws(() => recordLanguageDecision({
    project,
    textId: 'd-a',
    findingId: 'diag-a',
    decision: 'dismissed',
    at: 100,
  }), /invalid/i)
})

test('D1-Wirkungszuordnungen lassen sich korrigieren oder enthalten und bleiben als unveränderliche Entscheidungen erhalten', () => {
  const project = { id: 'p-a' }
  const correction = {
    field: 'function',
    previous: 'inform',
    next: 'explain',
    reason: 'Die Passage begründet einen Ursache-Wirkungs-Zusammenhang.',
  }
  const corrected = recordLanguageDecision({
    project,
    textId: 'd-a',
    findingId: 'effect:d-a:b-1',
    entityKind: 'effect-passage',
    decision: 'corrected',
    correction,
    at: 100,
  })
  correction.next = 'position'
  const abstained = recordLanguageDecision({
    project,
    textId: 'd-a',
    findingId: 'rhetoric:d-a:b-2:metaphor',
    entityKind: 'rhetorical-device',
    decision: 'abstained',
    at: 101,
  })
  assert.equal(corrected.correction.next, 'explain')
  assert.equal(abstained.entityKind, 'rhetorical-device')
  assert.deepEqual(project.languageReports.decisions.map(event => event.decision), ['corrected', 'abstained'])
  assert.throws(() => recordLanguageDecision({
    project,
    textId: 'd-a',
    findingId: 'effect:d-a:b-3',
    entityKind: 'effect-passage',
    decision: 'corrected',
    at: 102,
  }), /correction/i)
})
