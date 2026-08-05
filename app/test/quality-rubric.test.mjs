import test from 'node:test'
import assert from 'node:assert/strict'

import { runQualityRubric } from '../evals/run-quality-rubric.mjs'

test('Gesamtrubrik entsteht aus echten Gold-, Kontrast- und Vollausgabe-Scorern', () => {
  const result = runQualityRubric()
  assert.equal(result.passed, true, JSON.stringify(result, null, 2))
  assert.deepEqual(Object.keys(result.scoredEvalScores).sort(), [
    'ARG-04', 'ARG-07', 'EFFECT-01', 'EFFECT-02', 'EFFECT-03', 'EVID-04', 'RESEARCH-05',
  ])
  assert.equal(Object.values(result.scoredEvalScores).every(score => score >= 4), true)
  assert.equal(Object.values(result.rubricScores).every(score => score >= 4), true)
  assert.ok(result.weightedScore >= 4.5)
  assert.equal(Object.keys(result.rubricRationales).length, 6)
  assert.equal(Object.values(result.rubricRationales).every(text => text.length > 60), true)
})

test('Ruhe und Barrierefreiheit behaupten ohne menschlichen Live-Nachweis keine perfekte 5', () => {
  const result = runQualityRubric()
  assert.equal(result.rubricScores.calm, 4.5)
  assert.equal(result.rubricScores.access_privacy, 4.5)
  assert.match(result.rubricRationales.calm, /gedeckelt/)
  assert.match(result.rubricRationales.access_privacy, /extern/)
})

test('Gesamtrubrik ist reproduzierbar und nicht aus der Anzahl grüner Evals abgeleitet', () => {
  const first = runQualityRubric()
  const second = runQualityRubric()
  assert.deepEqual(first, second)
  assert.equal('coverage' in first, false)
  assert.notEqual(first.rubricScores.calm, first.rubricScores.truth)
})
