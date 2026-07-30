import test from 'node:test'
import assert from 'node:assert/strict'
import {
  evaluateArgumentPathQuality,
  evaluateCounterargumentContrast,
  evaluateCounterargumentQuality,
} from '../evals/run-c2-quality.mjs'
import {
  argumentPathQualityFixtures,
  counterargumentContrast,
  counterargumentQualityFixtures,
} from '../evals/fixtures/argumentqualitaet.mjs'

test('ARG-04: faire Gegenargumente bestehen die feste Qualitätsrubrik in mehreren Genres', () => {
  const result = evaluateCounterargumentQuality(counterargumentQualityFixtures)
  assert.equal(result.evalId, 'ARG-04')
  assert.equal(result.passed, true)
  assert.ok(result.score >= 4.5)
  assert.equal(Object.values(result.dimensions).every(value => value >= 4), true)
})

test('ARG-04: belegtreue Auswahl schlägt die plausible Strohmann-Variante', () => {
  const result = evaluateCounterargumentContrast(counterargumentContrast)
  assert.equal(result.passed, true)
  assert.equal(result.winner, 'grounded')
  assert.ok(result.scores.grounded > result.scores.strawman)
})

test('ARG-07: alternative Argumentationswege sind substanziell statt kosmetisch verschieden', () => {
  const result = evaluateArgumentPathQuality(argumentPathQualityFixtures)
  assert.equal(result.evalId, 'ARG-07')
  assert.equal(result.passed, true)
  assert.ok(result.score >= 4.5)
  assert.equal(Object.values(result.dimensions).every(value => value >= 4), true)
  assert.equal(result.cases.every(item => item.substantiveDifference), true)
  assert.equal(result.cases.every(item => item.impactRisk), true)
})
