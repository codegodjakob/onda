import test from 'node:test'
import assert from 'node:assert/strict'
import {
  auditCitationConsistency,
  auditQuotationOrParaphrase,
  verifyBibliographicIdentity,
} from '../src/citation-audit.mjs'

test('EVID-05: passendes direktes Zitat mit Seitenanker bleibt ohne Befund', () => {
  const findings = auditQuotationOrParaphrase({
    kind: 'quote',
    text: 'Die Stichprobe umfasst 84 Personen.',
    sourceType: 'pdf',
    locator: {
      id: 'loc-1',
      kind: 'page',
      address: { page: 7 },
      excerpt: 'Die Stichprobe umfasst 84 Personen.',
      verification: { status: 'verified' },
    },
  })
  assert.deepEqual(findings, [])
})

test('EVID-05: verändertes Zitat, fehlende Seite und überdehnte Paraphrase werden fundstellengenau markiert', () => {
  const altered = auditQuotationOrParaphrase({
    kind: 'quote',
    text: 'Die Stichprobe umfasst 184 Personen.',
    sourceType: 'pdf',
    locator: {
      id: 'loc-quote',
      kind: 'text',
      address: { start: 0, end: 36 },
      excerpt: 'Die Stichprobe umfasst 84 Personen.',
      verification: { status: 'verified' },
    },
  })
  assert.deepEqual(altered.map(item => item.code).sort(), ['quote-mismatch', 'quote-page-missing'])
  assert.ok(altered.every(item => item.locatorId === 'loc-quote'))

  const overreach = auditQuotationOrParaphrase({
    kind: 'paraphrase',
    text: 'Das Werkzeug verbessert langfristig bei allen Menschen die Aufmerksamkeit.',
    strength: 'causal',
    scope: ['alle Menschen', 'langfristig'],
    sourceType: 'web',
    locator: {
      id: 'loc-paraphrase',
      kind: 'section',
      address: { sectionId: 'results' },
      excerpt: 'In dieser Stichprobe war die Fehlerrate nach einer Sitzung niedriger.',
      verification: { status: 'verified' },
      allowedStrength: 'associational',
      supportedScope: ['diese Stichprobe', 'eine Sitzung'],
    },
  })
  assert.deepEqual(overreach.map(item => item.code).sort(), ['paraphrase-scope-overreach', 'paraphrase-strength-overreach'])
})

test('EVID-06: bibliografische Identität bestätigt Felder einzeln und erhält Konflikte und Versionen', () => {
  const result = verifyBibliographicIdentity({
    metadata: {
      author: { value: ['M. Weiser', 'J. S. Brown'], status: 'user-provided' },
      title: { value: 'The Coming Age of Calm Technology', status: 'user-provided' },
      year: { value: 1996, status: 'user-provided' },
      doi: { value: '10.1000/calm.old', status: 'user-provided' },
      isbn: { value: null, status: 'unknown' },
    },
    confirmations: [
      { field: 'author', value: ['M. Weiser', 'J. S. Brown'], evidence: 'publisher' },
      { field: 'title', value: 'The Coming Age of Calm Technology', evidence: 'publisher' },
      { field: 'year', value: 1996, evidence: 'publisher' },
      { field: 'doi', value: '10.1000/calm.new', evidence: 'crossref' },
    ],
    versions: [
      { id: 'v1', label: 'Konferenzfassung', year: 1996 },
      { id: 'v2', label: 'Archivfassung', year: 1997 },
    ],
  })
  assert.equal(result.metadata.author.status, 'confirmed')
  assert.equal(result.metadata.title.status, 'confirmed')
  assert.equal(result.metadata.year.status, 'confirmed')
  assert.equal(result.metadata.doi.status, 'conflict')
  assert.equal(result.metadata.isbn.status, 'unknown')
  assert.equal(result.conflicts[0].field, 'doi')
  assert.equal(result.versions.length, 2)
})

test('EVID-07: fehlende, verwaiste, doppelte und stilabweichende Verzeichniseinträge tragen Locators', () => {
  const findings = auditCitationConsistency({
    inText: [
      { key: 'weiser1996', locator: { blockId: 'b-1', start: 12 } },
      { key: 'missing2026', locator: { blockId: 'b-2', start: 4 } },
    ],
    bibliography: [
      { key: 'weiser1996', style: 'apa-7', locator: { entry: 1 } },
      { key: 'weiser1996', style: 'apa-7', locator: { entry: 2 } },
      { key: 'orphan2020', style: 'apa-7', locator: { entry: 3 } },
      { key: 'wrongstyle2021', style: 'chicago', cited: true, locator: { entry: 4 } },
    ],
    requiredStyle: 'apa-7',
  })
  assert.deepEqual(new Set(findings.map(item => item.code)), new Set([
    'bibliography-missing',
    'bibliography-orphan',
    'bibliography-duplicate',
    'bibliography-style',
  ]))
  assert.ok(findings.every(item => item.locator))

  assert.deepEqual(auditCitationConsistency({
    inText: [{ key: 'weiser1996', locator: { blockId: 'b-1' } }],
    bibliography: [{ key: 'weiser1996', style: 'apa-7', locator: { entry: 1 } }],
    requiredStyle: 'apa-7',
  }), [])
})
