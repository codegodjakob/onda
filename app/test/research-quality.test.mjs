import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateAbstentionContrast, evaluateResearchQuality } from '../evals/run-b2-quality.mjs'
import { insufficientEvidenceContrast, researchQualityFixtures } from '../evals/fixtures/recherchequalitaet.mjs'

test('RESEARCH-05: Gold-Fixtures erreichen die feste Qualitätsschwelle', () => {
  const result = evaluateResearchQuality(researchQualityFixtures)
  assert.equal(result.passed, true)
  assert.ok(result.score >= 4.5)
  assert.equal(Object.values(result.dimensions).every(value => value >= 4), true)
})

test('INV-08: ehrliche Enthaltung schlägt die plausible Erfindung bei fehlendem Original', () => {
  const result = evaluateAbstentionContrast(insufficientEvidenceContrast)
  assert.equal(result.passed, true)
  assert.equal(result.winner, 'abstention')
  assert.ok(result.scores.abstention > result.scores.hallucination)
})
