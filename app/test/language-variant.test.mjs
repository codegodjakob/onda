import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateLanguageVariant } from '../src/language-variant.mjs'

function evaluate(candidateText, overrides = {}) {
  return evaluateLanguageVariant({
    projectId: 'p-a',
    original: {
      text: 'Die Methode senkte die Fehlerrate nicht um 12 % (Meyer 2024).',
      structureSignature: 'paragraph>link',
      evidenceStatus: 'mixed',
    },
    candidate: {
      text: candidateText,
      structureSignature: 'paragraph>link',
      evidenceStatus: 'mixed',
      direction: 'language',
      ...overrides,
    },
    protectedTerms: ['Fehlerrate', 'Meyer'],
  })
}

test('LANG-06: bedeutungstreue sprachliche Variante wird als Vorschlag zugelassen', () => {
  const result = evaluate('Die Methode verringerte die Fehlerrate nicht um 12 % (Meyer 2024).')
  assert.equal(result.status, 'accepted')
  assert.deepEqual(result.reasons, [])
  assert.equal(result.checks.negation, true)
  assert.equal(result.checks.quantities, true)
  assert.equal(result.checks.citations, true)
  assert.equal(result.checks.structure, true)
})

test('LANG-06: Negation, Zahl, Referent, Zitat, Evidenzstatus oder Strukturdrift werden verworfen', () => {
  const fixtures = [
    ['Die Methode verringerte die Fehlerrate um 12 % (Meyer 2024).', {}, 'negation'],
    ['Die Methode verringerte die Fehlerrate nicht um 21 % (Meyer 2024).', {}, 'quantities'],
    ['Die Methode verringerte die Fehlerzahl nicht um 12 % (Meyer 2024).', {}, 'protected-terms'],
    ['Die Methode verringerte die Fehlerrate nicht um 12 %.', {}, 'citations'],
    ['Die Methode verringerte die Fehlerrate nicht um 12 % (Meyer 2024).', { evidenceStatus: 'supported' }, 'evidence-status'],
    ['Die Methode verringerte die Fehlerrate nicht um 12 % (Meyer 2024).', { structureSignature: 'heading' }, 'structure'],
  ]
  fixtures.forEach(([text, overrides, reason]) => {
    const result = evaluate(text, overrides)
    assert.equal(result.status, 'rejected')
    assert.ok(result.reasons.includes(reason), JSON.stringify(result))
  })
})

test('LANG-06: Modalität, Claim-Reichweite, Grenzen, Links, Zitate, Stimme und geschützte Absicht werden bewahrt', () => {
  const original = {
    text: 'Acme kann im Pilotprojekt helfen; die Grenze bleibt „nur Berlin“. https://example.org',
    structureSignature: 'paragraph>link',
    evidenceStatus: 'mixed',
    namedReferents: ['Acme', 'Berlin'],
    claimScope: 'Pilotprojekt Berlin',
    limitations: ['nur Berlin'],
    voiceSignature: 'sachlich-direkt',
  }
  const base = {
    ...original,
    direction: 'language',
  }
  const changes = [
    { text: original.text.replace('kann', 'muss') },
    { claimScope: 'alle Städte' },
    { limitations: [] },
    { namedReferents: ['Acme'] },
    { text: original.text.replace('https://example.org', 'https://example.com') },
    { text: original.text.replace('„nur Berlin“', '„ganz Deutschland“') },
    { voiceSignature: 'werblich-dringlich' },
    { text: original.text.replace('Pilotprojekt', 'Vorhaben') },
  ]
  changes.forEach(change => {
    const result = evaluateLanguageVariant({
      projectId: 'p-a',
      original,
      candidate: { ...base, ...change },
      protectedIntentions: ['Pilotprojekt'],
    })
    assert.equal(result.status, 'rejected', JSON.stringify(change))
  })
})

test('LANG-06: gleiche Negations- und Zahlenmengen dürfen nicht zwischen Referenten wandern', () => {
  const result = evaluateLanguageVariant({
    projectId: 'p-a',
    original: {
      text: 'Die Fehlerrate sank nicht um 12 %. Die Kosten sanken um 5 %.',
      structureSignature: 'paragraph',
      evidenceStatus: 'supported',
    },
    candidate: {
      text: 'Die Fehlerrate sank um 5 %. Die Kosten sanken nicht um 12 %.',
      structureSignature: 'paragraph',
      evidenceStatus: 'supported',
      direction: 'language',
    },
  })
  assert.equal(result.status, 'rejected')
  assert.equal(result.checks.negation, true)
  assert.equal(result.checks.quantities, true)
  assert.equal(result.checks['referent-associations'], false)
})

test('LANG-06: Prädikatsumkehr ist keine bedeutungstreue Sprachvariante', () => {
  const result = evaluate('Die Methode erhöhte die Fehlerrate nicht um 12 % (Meyer 2024).')
  assert.equal(result.status, 'rejected')
  assert.equal(result.checks['proven-safe-transformation'], false)
})

test('LANG-06/07: neue argumentative Richtung bleibt getrennt und erzeugt keine Tarnoptimierung', () => {
  const result = evaluate(
    'Die Methode verringerte die Fehlerrate nicht um 12 % (Meyer 2024).',
    { direction: 'argument' },
  )
  assert.equal(result.status, 'new-direction')
  assert.equal(JSON.stringify(result).match(/KI-Wahrscheinlichkeit|Detektor|menschlicher wirken/iu), null)
})
