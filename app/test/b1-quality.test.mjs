import test from 'node:test'
import assert from 'node:assert/strict'
import { assessSourceForClaim, validateNoGlobalTruthScore } from '../src/evidence-bundle.mjs'
import { EVIDENZQUALITAET_GOLD, scoreEvidenzqualitaet } from '../evals/fixtures/evidenzqualitaet.mjs'

test('EVID-04 Goldrubrik: claim-spezifische Einordnungen erreichen mindestens 4,5/5', () => {
  const outputs = EVIDENZQUALITAET_GOLD.map(gold => assessSourceForClaim(gold.input))
  outputs.forEach(output => assert.doesNotThrow(() => validateNoGlobalTruthScore(output)))
  const result = scoreEvidenzqualitaet(outputs)
  assert.equal(result.passed, true)
  assert.ok(result.score >= 4.5)
  assert.ok(Object.values(result.rubric).every(value => value >= 4))
})
