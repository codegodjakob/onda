import test from 'node:test'
import assert from 'node:assert/strict'
import {
  assessSourceForClaim,
  buildEvidenceBundle,
  propagateSourceEvent,
  validateNoGlobalTruthScore,
} from '../src/evidence-bundle.mjs'

const sourceActive = { id: 'src-1', projectId: 'p-a', status: 'active' }
const sourceCounter = { id: 'src-2', projectId: 'p-a', status: 'active' }
const locSupport = { id: 'loc-1', projectId: 'p-a', sourceId: 'src-1', verification: { status: 'verified' } }
const locCounter = { id: 'loc-2', projectId: 'p-a', sourceId: 'src-2', verification: { status: 'verified' } }

function completeInput() {
  return {
    id: 'bundle-1',
    projectId: 'p-a',
    claimId: 'claim-1',
    claimText: 'In dieser Studie sank die Fehlerrate um zwölf Prozent.',
    support: [{ sourceId: 'src-1', locatorId: 'loc-1', relation: 'supports' }],
    counterEvidence: [{ sourceId: 'src-2', locatorId: 'loc-2', relation: 'counters' }],
    limitations: ['Kleine Stichprobe und kurzer Beobachtungszeitraum.'],
    methodologicalDifferences: ['Die Gegenstudie verwendet eine andere Aufgabenklasse.'],
    scope: 'Gilt für die untersuchte Aufgabe und Stichprobe.',
    uncertainty: 'Übertragbarkeit auf Langtexte bleibt offen.',
    allowedStrength: 'Die Studie berichtet eine Verringerung; sie beweist keine allgemeine Kausalwirkung.',
    notSupported: ['Keine Aussage über langfristige Aufmerksamkeit.'],
    qualityAssessments: [],
    createdAt: 100,
  }
}

test('EVID-03: vollständiges Belegbündel ist claim-spezifisch und macht Grenzen sichtbar', () => {
  const bundle = buildEvidenceBundle(completeInput(), {
    sources: [sourceActive, sourceCounter],
    locators: [locSupport, locCounter],
  })
  assert.equal(bundle.claimId, 'claim-1')
  assert.equal(bundle.claimText, 'In dieser Studie sank die Fehlerrate um zwölf Prozent.')
  assert.equal(bundle.status, 'mixed')
  assert.equal(bundle.support.length, 1)
  assert.equal(bundle.counterEvidence.length, 1)
  assert.equal(bundle.limitations.length, 1)
  assert.equal(bundle.methodologicalDifferences.length, 1)
  assert.match(bundle.scope, /Aufgabe/)
  assert.match(bundle.uncertainty, /offen/)
  assert.match(bundle.allowedStrength, /keine allgemeine Kausalwirkung/)
  assert.deepEqual(bundle.notSupported, ['Keine Aussage über langfristige Aufmerksamkeit.'])
  assert.deepEqual(bundle.provenance, { actor: 'user', action: 'evidence-assemble' })
})

test('EVID-03: unvollständige oder nicht verifizierte Beleglage wird nie supported', () => {
  const incomplete = buildEvidenceBundle({ ...completeInput(), uncertainty: '' }, {
    sources: [sourceActive, sourceCounter],
    locators: [locSupport, locCounter],
  })
  assert.equal(incomplete.status, 'insufficient')
  assert.ok(incomplete.missingFields.includes('uncertainty'))

  const stale = buildEvidenceBundle(completeInput(), {
    sources: [sourceActive, sourceCounter],
    locators: [{ ...locSupport, verification: { status: 'unverified' } }, locCounter],
  })
  assert.equal(stale.status, 'review-required')
  assert.equal(stale.support[0].usable, false)
})

test('INV-04: projektfremde Quellen und Fundstellen können ein Bündel nicht stützen', () => {
  const isolated = buildEvidenceBundle(completeInput(), {
    sources: [{ ...sourceActive, projectId: 'p-b' }, sourceCounter],
    locators: [{ ...locSupport, projectId: 'p-b' }, locCounter],
  })
  assert.equal(isolated.status, 'review-required')
  assert.equal(isolated.support[0].usable, false)
})

test('EVID-04: Quellenqualität wird pro Claim begründet und enthält keinen globalen Wahrheitswert', () => {
  const assessment = assessSourceForClaim({
    claimId: 'claim-1',
    sourceId: 'src-1',
    relevance: { finding: 'Direkt auf dieselbe Aufgabenklasse bezogen.', strength: 'direct' },
    method: { finding: 'Randomisierte Vergleichsstudie; Abbruchquote nicht berichtet.', strength: 'mixed' },
    recency: { finding: '2025 veröffentlicht; für die aktuelle Softwareversion zeitnah.', strength: 'current' },
    independence: { finding: 'Von einem unabhängigen Forschungsteam.', strength: 'independent' },
    transparency: { finding: 'Materialien offen, Auswertungsskript fehlt.', strength: 'mixed' },
    sample: { finding: '84 Personen aus einer Universität.', strength: 'limited' },
    conflicts: { finding: 'Keine Finanzierung durch den Hersteller angegeben.', strength: 'none-declared' },
    convergence: { finding: 'Eine zweite Studie berichtet denselben Trend mit anderer Methode.', strength: 'convergent' },
    conclusion: 'Für den engen Claim brauchbar; Generalisierung und Kausalstärke begrenzen.',
  })
  assert.equal(assessment.claimId, 'claim-1')
  assert.match(assessment.dimensions.method.finding, /Abbruchquote/)
  assert.match(assessment.conclusion, /begrenzen/)
  assert.doesNotThrow(() => validateNoGlobalTruthScore(assessment))

  assert.throws(() => validateNoGlobalTruthScore({
    claimId: 'claim-1',
    truthScore: 0.93,
  }), /global|score|wahrheit/i)
})

test('EVID-08: Rücknahme und Versionswechsel setzen betroffene Bündel auf review-required und bewahren Historie', () => {
  const bundle = buildEvidenceBundle(completeInput(), {
    sources: [sourceActive, sourceCounter],
    locators: [locSupport, locCounter],
  })
  const update = propagateSourceEvent([bundle], {
    id: 'event-1',
    sourceId: 'src-1',
    kind: 'retracted',
    at: 200,
    reason: 'Rücknahme',
  })
  assert.equal(update[0].status, 'review-required')
  assert.equal(update[0].history.at(-1).eventId, 'event-1')
  assert.equal(update[0].history.at(-1).previousStatus, 'mixed')
  assert.equal(bundle.status, 'mixed')

  const unrelated = propagateSourceEvent([bundle], {
    id: 'event-2',
    sourceId: 'src-x',
    kind: 'corrected',
    at: 201,
  })
  assert.equal(unrelated[0], bundle)

  const roundtrip = JSON.parse(JSON.stringify(update))
  assert.equal(roundtrip[0].history[0].sourceId, 'src-1')
})
