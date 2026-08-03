import test from 'node:test'
import assert from 'node:assert/strict'
import { runD1QualityEvals } from '../evals/run-d1-quality.mjs'

test('D1-Korpus: alle Sprach- und Wirkungskategorien erreichen die feste Qualitätsschwelle', () => {
  const result = runD1QualityEvals()
  assert.equal(result.passed, true, JSON.stringify(result, null, 2))
  assert.equal(result.score, 5)
  assert.equal(Object.values(result.dimensions).every(value => value === 5), true)
  assert.equal(result.cases.length, 5)
  assert.equal(result.cases.every(item => (
    item.contextFidelity
    && item.statusCalibration
    && item.contextualPatterns
    && item.functionFit
    && item.fairnessFirst
    && item.noOriginVerdict
  )), true)
})

test('D1-Kontrast: kontextsensitive Diagnose schlägt pauschalen Humanizer 5 zu 0', () => {
  const result = runD1QualityEvals()
  assert.equal(result.contrast.contextAware.score, 5)
  assert.equal(result.contrast.naiveHumanizer.score, 0)
  assert.equal(result.contrast.contextAware.legitimateSwissVariantFlagged, false)
  assert.equal(result.contrast.contextAware.effectCertaintyClaimed, false)
  assert.equal(result.contrast.contextAware.originProbabilityClaimed, false)
})
