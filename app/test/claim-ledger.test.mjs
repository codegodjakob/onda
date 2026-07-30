import test from 'node:test'
import assert from 'node:assert/strict'
import {
  splitAtomicClaims,
  synchronizeClaimLedger,
} from '../src/claim-ledger.mjs'
import {
  correctArgumentClaim,
  ensureArgumentModel,
} from '../src/argument-model.mjs'

function emptyModel() {
  return ensureArgumentModel({ id: 'p-a' }).argumentModel
}

function textFixture(blocks, projectId = 'p-a') {
  return [{
    textId: 'd-a',
    projectId,
    blocks,
  }]
}

function bundle(id, claimText, status, projectId = 'p-a') {
  return {
    id,
    projectId,
    claimText,
    status,
    support: [{ sourceId: `source-${id}`, locatorId: `locator-${id}`, usable: status !== 'insufficient' }],
    counterEvidence: [],
  }
}

test('ARG-01: gemischter Satz wird in nicht überlappende Claims mit eigener Beleglage zerlegt', () => {
  const sentence = 'Die Fehlerrate sank um zwölf Prozent, und die Stichprobe umfasste 84 Personen.'
  const result = synchronizeClaimLedger({
    projectId: 'p-a',
    model: emptyModel(),
    texts: textFixture([{ id: 'block-1', role: 'claim', text: sentence }]),
    evidenceBundles: [
      bundle('effect', 'Die Fehlerrate sank um zwölf Prozent', 'supported'),
      bundle('sample', 'die Stichprobe umfasste 84 Personen.', 'review-required'),
    ],
    at: 100,
  })
  assert.equal(result.claims.length, 2)
  assert.deepEqual(result.claims.map(claim => claim.text), [
    'Die Fehlerrate sank um zwölf Prozent',
    'die Stichprobe umfasste 84 Personen.',
  ])
  assert.deepEqual(result.claims.map(claim => claim.evidenceStatus), ['supported', 'review-required'])
  assert.deepEqual(result.claims.map(claim => claim.uncertainty), ['low', 'medium'])
  assert.equal(result.claims[0].anchor.end <= result.claims[1].anchor.start, true)
  for (const claim of result.claims) {
    assert.equal(sentence.slice(claim.anchor.start, claim.anchor.end), claim.anchor.exact)
    assert.equal(claim.anchor.blockId, 'block-1')
    assert.equal(claim.centrality, 'central')
  }
})

test('Clause-Splitter trennt Semikolon und echte koordinierte Teilsätze, nicht aber Liste, Frage oder Fragment', () => {
  const clauses = splitAtomicClaims('Die Quelle ist aktuell; die Methode bleibt begrenzt. Der Bericht nennt Daten und Methoden. Gilt das überall? Kurzer Hinweis.')
  assert.deepEqual(clauses.map(item => item.text), [
    'Die Quelle ist aktuell',
    'die Methode bleibt begrenzt.',
    'Der Bericht nennt Daten und Methoden.',
  ])
  assert.equal(clauses.every(item => item.start >= 0 && item.end > item.start), true)
})

test('Clause-Splitter bewahrt unvollständige aber-Ergänzungen und überspringt Listenblöcke', () => {
  assert.deepEqual(
    splitAtomicClaims('Das Verfahren ist schnell, aber nicht billig.').map(item => item.text),
    ['Das Verfahren ist schnell, aber nicht billig.'],
  )
  assert.deepEqual(splitAtomicClaims('- Die Methode ist schnell.'), [])
  const result = synchronizeClaimLedger({
    projectId: 'p-a',
    model: emptyModel(),
    texts: textFixture([
      { id: 'list', type: 'bulletList', role: 'paragraph', text: 'Die Methode ist schnell.' },
      { id: 'claim', type: 'paragraph', role: 'claim', text: 'Die Methode ist reproduzierbar.' },
    ]),
    evidenceBundles: [],
    at: 100,
  })
  assert.deepEqual(result.claims.map(claim => claim.text), ['Die Methode ist reproduzierbar.'])
})

test('Semantische Rollen bestimmen Zentralität und Claim-Art ohne Projekttext zu mutieren', () => {
  const texts = textFixture([
    { id: 'claim', role: 'claim', text: 'Calm Technology bedeutet Technik am Rand der Aufmerksamkeit.' },
    { id: 'evidence', role: 'evidence', text: 'Die Studie zeigt einen geringeren Fehleranteil.' },
    { id: 'counter', role: 'counterpoint', text: 'Die Replikation widerspricht dem berichteten Effekt.' },
    { id: 'question', role: 'question', text: 'Welche Grenze gilt hier?' },
  ])
  const before = JSON.stringify(texts)
  const result = synchronizeClaimLedger({
    projectId: 'p-a',
    model: emptyModel(),
    texts,
    evidenceBundles: [],
    at: 100,
  })
  assert.equal(JSON.stringify(texts), before)
  assert.deepEqual(result.claims.map(claim => claim.centrality), ['central', 'supporting', 'supporting'])
  assert.deepEqual(result.claims.map(claim => claim.kind), ['definition', 'fact', 'fact'])
})

test('Gleicher Quellzustand ist idempotent und erzeugt keine doppelten Claims oder Ereignisse', () => {
  const input = {
    projectId: 'p-a',
    texts: textFixture([{ id: 'block-1', role: 'claim', text: 'Die Fehlerrate sank.' }]),
    evidenceBundles: [],
    at: 100,
  }
  const first = synchronizeClaimLedger({ ...input, model: emptyModel() })
  const second = synchronizeClaimLedger({ ...input, model: first, at: 200 })
  assert.deepEqual(second.claims, first.claims)
  assert.deepEqual(second.events, first.events)
})

test('aktive Claims übernehmen eine geänderte Beleglage ohne Duplikat', () => {
  const claimText = 'Die Fehlerrate sank.'
  const texts = textFixture([{ id: 'block-1', role: 'claim', text: claimText }])
  const first = synchronizeClaimLedger({
    projectId: 'p-a',
    model: emptyModel(),
    texts,
    evidenceBundles: [bundle('effect', claimText, 'supported')],
    at: 100,
  })
  const second = synchronizeClaimLedger({
    projectId: 'p-a',
    model: first,
    texts,
    evidenceBundles: [bundle('effect', claimText, 'review-required')],
    at: 200,
  })
  assert.equal(second.claims.length, 1)
  assert.equal(second.claims[0].status, 'active')
  assert.equal(second.claims[0].evidenceStatus, 'review-required')
  assert.equal(second.claims[0].uncertainty, 'medium')
  assert.deepEqual(second.claims[0].evidenceRefs, first.claims[0].evidenceRefs)
})

test('Geänderter oder verschwundener Block macht nur abgeleitete Altclaims sichtbar stale', () => {
  const first = synchronizeClaimLedger({
    projectId: 'p-a',
    model: emptyModel(),
    texts: textFixture([
      { id: 'changed', role: 'claim', text: 'Die Fehlerrate sank.' },
      { id: 'stable', role: 'claim', text: 'Die Stichprobe umfasste 84 Personen.' },
    ]),
    evidenceBundles: [],
    at: 100,
  })
  const second = synchronizeClaimLedger({
    projectId: 'p-a',
    model: first,
    texts: textFixture([
      { id: 'changed', role: 'claim', text: 'Die Fehlerrate blieb gleich.' },
      { id: 'stable', role: 'claim', text: 'Die Stichprobe umfasste 84 Personen.' },
    ]),
    evidenceBundles: [],
    at: 200,
  })
  const oldChanged = second.claims.find(claim => claim.text === 'Die Fehlerrate sank.')
  const newChanged = second.claims.find(claim => claim.text === 'Die Fehlerrate blieb gleich.')
  const stable = second.claims.find(claim => claim.text === 'Die Stichprobe umfasste 84 Personen.')
  assert.equal(oldChanged.status, 'stale')
  assert.equal(oldChanged.evidenceStatus, 'review-required')
  assert.equal(newChanged.status, 'active')
  assert.equal(stable.status, 'active')
  assert.equal(stable.fingerprint, first.claims.find(claim => claim.text === stable.text).fingerprint)

  const third = synchronizeClaimLedger({
    projectId: 'p-a',
    model: second,
    texts: textFixture([{ id: 'stable', role: 'claim', text: 'Die Stichprobe umfasste 84 Personen.' }]),
    evidenceBundles: [],
    at: 300,
  })
  assert.equal(third.claims.find(claim => claim.text === 'Die Fehlerrate blieb gleich.').status, 'stale')
})

test('Manuelle oder korrigierte Claims bleiben bei Rebuild erhalten', () => {
  const model = emptyModel()
  model.claims.push({
    id: 'manual',
    projectId: 'p-a',
    textId: 'd-a',
    anchor: { blockId: 'gone', exact: 'Manuelle Aussage.', start: 0, end: 18 },
    text: 'Manuelle Aussage.',
    kind: 'fact',
    centrality: 'central',
    validity: 'qualified',
    evidenceStatus: 'unverified',
    uncertainty: 'high',
    evidenceRefs: [],
    provenance: { actor: 'user', action: 'manual-claim' },
    fingerprint: 'manual-fingerprint',
    createdAt: 1,
    status: 'active',
    corrections: [{ id: 'correction' }],
  })
  const result = synchronizeClaimLedger({
    projectId: 'p-a',
    model,
    texts: textFixture([]),
    evidenceBundles: [],
    at: 100,
  })
  assert.equal(result.claims[0].status, 'active')
})

test('korrigierte abgeleitete Claims bleiben im Audit, werden bei verschwundenem Anker aber prüfpflichtig', () => {
  const first = synchronizeClaimLedger({
    projectId: 'p-a',
    model: emptyModel(),
    texts: textFixture([{ id: 'derived', role: 'claim', text: 'Die Fehlerrate sank.' }]),
    evidenceBundles: [],
    at: 100,
  })
  const corrected = correctArgumentClaim({
    model: first,
    projectId: 'p-a',
    claimId: first.claims[0].id,
    kind: 'inference',
    centrality: 'central',
    validity: 'qualified',
    at: 110,
  })
  const rebuilt = synchronizeClaimLedger({
    projectId: 'p-a',
    model: corrected,
    texts: textFixture([]),
    evidenceBundles: [],
    at: 120,
  })
  assert.equal(rebuilt.claims.length, 1)
  assert.equal(rebuilt.claims[0].status, 'stale')
  assert.equal(rebuilt.claims[0].evidenceStatus, 'review-required')
  assert.equal(rebuilt.claims[0].kind, 'inference')
  assert.equal(rebuilt.claims[0].corrections.length, 1)
  assert.equal(rebuilt.events.some(event => event.kind === 'claim-stale'), true)
})

test('INV-05: projektfremde Texte werden abgewiesen und fremde Belege nie zugeordnet', () => {
  assert.throws(() => synchronizeClaimLedger({
    projectId: 'p-a',
    model: emptyModel(),
    texts: textFixture([{ id: 'foreign', role: 'claim', text: 'CANARY-FREMD.' }], 'p-b'),
    evidenceBundles: [],
    at: 100,
  }), /project/i)

  const result = synchronizeClaimLedger({
    projectId: 'p-a',
    model: emptyModel(),
    texts: textFixture([{ id: 'local', role: 'claim', text: 'Lokale Aussage bleibt lokal.' }]),
    evidenceBundles: [bundle('foreign', 'CANARY-FREMD.', 'supported', 'p-b')],
    at: 100,
  })
  assert.equal(JSON.stringify(result).includes('CANARY-FREMD'), false)
})
