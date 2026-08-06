import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

test('die qualitative Onda-Rubrik ist begrenzt, nachvollziehbar und über der Zielschwelle', async () => {
  const rubric = JSON.parse(await readFile(resolve(root, 'evals/onda-ui-rubric.json'), 'utf8'))
  const expected = ['designSystem', 'caseFit', 'hierarchyCalm', 'interactionSafety', 'responsive', 'accessibility', 'reliability']
  assert.equal(rubric.maxIterations, 3)
  assert.ok(rubric.iterations.length >= 1 && rubric.iterations.length <= rubric.maxIterations)
  assert.deepEqual(Object.keys(rubric.current.dimensions), expected)
  const scores = Object.values(rubric.current.dimensions).map(item => item.score)
  assert.ok(scores.every(score => score >= 1 && score <= 5))
  assert.ok(scores.every(score => score >= rubric.threshold), 'jede Qualitätsdimension muss die Schwelle erreichen')
  const computed = Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2))
  assert.equal(rubric.current.average, computed)
  assert.ok(rubric.current.average >= rubric.threshold)
  assert.equal(rubric.current.allNonExternalHardGatesPass, true)
  assert.equal(rubric.current.remainingExternalGate, 'ONDA-UI-18')
  assert.match(rubric.current.externalGateStatus, /bewusst nicht ausgeführt.*kein Schlüssel/i)
  assert.ok(rubric.iterations.every(item => item.average >= 0 && Array.isArray(item.findings) && Array.isArray(item.changes)))
  for (const evidence of rubric.current.evidence) await access(resolve(root, evidence))
})
