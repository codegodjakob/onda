import test from 'node:test'
import assert from 'node:assert/strict'
import { runD2QualityEvals } from '../evals/run-d2-quality.mjs'

const REQUIRED_D2_EVALS = [
  'AUDIT-01',
  'AUDIT-02',
  'AUDIT-03',
  'AUDIT-04',
  'AUDIT-05',
  'AUDIT-06',
  'AUDIT-07',
  'SYSTEM-10',
  'SYSTEM-11',
]

test('D2-Korpus: alle Schlussaudit- und Exportdimensionen erreichen die feste Qualitätsschwelle', () => {
  const result = runD2QualityEvals()
  assert.equal(result.passed, true, JSON.stringify(result, null, 2))
  assert.deepEqual(result.evalIds, REQUIRED_D2_EVALS)
  assert.equal(result.score >= 4.5, true)
  assert.equal(Object.values(result.dimensions).every(value => value >= 4), true)
  assert.equal(result.cases.every(item => item.passed), true)
  assert.equal(result.completeOutputs.length >= 6, true)
})

test('D2-Kontrast: Integritätskontext schlägt stilgetriebene Scheinfertigstellung klar', () => {
  const result = runD2QualityEvals()
  assert.equal(result.contrast.contextAware.score >= 4.5, true)
  assert.equal(result.contrast.naiveCompletion.score <= 1, true)
  assert.equal(result.contrast.contextAware.criticalBlockerOverridesStyle, true)
  assert.equal(result.contrast.contextAware.readyVerdictClaimed, false)
  assert.equal(result.contrast.contextAware.originProbabilityClaimed, false)
  assert.equal(result.contrast.contextAware.rawUiOrScriptExported, false)
  assert.equal(result.contrast.contextAware.secretExported, false)
})

test('D2-Eval leitet die Bewertung aus vollständigen, reproduzierbaren Ausgaben ab', () => {
  const first = runD2QualityEvals()
  const second = runD2QualityEvals()
  assert.deepEqual(first, second)
  assert.equal(first.cases.find(item => item.id === 'scientific-integrity')?.output.status, 'blocked')
  assert.equal(first.cases.find(item => item.id === 'accepted-risk')?.output.status, 'review-required')
  assert.equal(first.cases.find(item => item.id === 'clean-essay')?.output.status, 'clear-of-hard-blockers')
  assert.equal(first.accessibility.automatedViolations, 0)
  assert.equal(first.accessibility.browserEngines, 3)
})
