import test from 'node:test'
import assert from 'node:assert/strict'

import { containsSecretMarker, processArgumentsAreSecretFree, redactSecrets } from '../src/eval-redaction.mjs'

test('native Belege redigieren synthetische Schlüssel und Autorisierungswerte', () => {
  const raw = 'Authorization: Bearer sk-ant-example x-api-key=sk-example api-key: sk-third'
  const safe = redactSecrets(raw)
  assert.equal(safe.includes('sk-ant-example'), false)
  assert.equal(safe.includes('sk-example'), false)
  assert.equal(safe.includes('sk-third'), false)
  assert.equal(safe.includes('[REDACTED]'), true)
  assert.equal(containsSecretMarker(safe), false)
})

test('Prozessargumente dürfen nie Schlüssel oder Schlüssel-Header tragen', () => {
  assert.equal(processArgumentsAreSecretFree(['/Applications/Onda.app/Contents/MacOS/Onda', '--llm-probe', '/tmp/result.json']), true)
  assert.equal(processArgumentsAreSecretFree(['--authorization=Bearer sk-ant-example']), false)
  assert.equal(processArgumentsAreSecretFree(['--x-api-key', 'sk-example']), false)
})
