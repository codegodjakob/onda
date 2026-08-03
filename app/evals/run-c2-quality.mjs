import {
  createArgumentClaim,
  createArgumentRelation,
  ensureArgumentModel,
} from '../src/argument-model.mjs'
import {
  generateArgumentPaths,
  selectStrongestCounterargument,
  validateArgumentPaths,
} from '../src/argument-deliberation.mjs'
import {
  argumentPathQualityFixtures,
  counterargumentContrast,
  counterargumentQualityFixtures,
} from './fixtures/argumentqualitaet.mjs'

function wordCount(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length
}

function scoreDimension(cases, key, failureScore = 1) {
  return cases.every(item => item[key]) ? 5 : failureScore
}

function claim(projectId, role, specification, createdAt) {
  const text = specification.text
  const evidenceRefs = specification.evidenceStatus === 'unverified'
    ? []
    : [{
        sourceId: `${projectId}:source:${role}`,
        locatorId: `${projectId}:locator:${role}`,
        bundleId: `${projectId}:bundle:${role}`,
      }]
  return createArgumentClaim({
    id: `${projectId}:claim:${role}`,
    projectId,
    textId: `${projectId}:text`,
    anchor: {
      blockId: `${projectId}:block:${role}`,
      exact: text,
      start: 0,
      end: text.length,
    },
    text,
    kind: role === 'definition' ? 'definition' : 'fact',
    centrality: role === 'central' ? 'central' : 'supporting',
    validity: role === 'central' && specification.evidenceStatus === 'mixed' ? 'qualified' : 'asserted',
    evidenceStatus: specification.evidenceStatus,
    uncertainty: specification.evidenceStatus === 'supported' ? 'low' : 'medium',
    evidenceRefs,
    provenance: { actor: 'user', action: 'fixture-claim' },
    fingerprint: `${projectId}:fingerprint:${role}`,
    createdAt,
  })
}

function relation(projectId, role, fromClaimId, toClaimId, type, claims, createdAt) {
  const warrants = {
    supports: 'Der Ausgangsbefund betrifft den behaupteten Endpunkt und stützt deshalb den engen Kern der Aussage.',
    counters: 'Der Gegenbefund betrifft denselben Endpunkt und begrenzt deshalb die Reichweite der zentralen Aussage.',
    'depends-on': 'Die zentrale Aussage hängt von dieser ausdrücklichen Begriffsgrenze ab.',
  }
  return createArgumentRelation({
    id: `${projectId}:relation:${role}`,
    projectId,
    fromClaimId,
    toClaimId,
    type,
    warrant: warrants[type],
    confidence: 'high',
    provenance: { actor: 'agent', action: 'fixture-relation' },
    createdAt,
  }, { claims })
}

export function materializeArgumentFixture(fixture) {
  const central = claim(fixture.projectId, 'central', fixture.central, 10)
  const support = claim(fixture.projectId, 'support', fixture.support, 11)
  const claims = [central, support]
  if (fixture.counter) claims.push(claim(fixture.projectId, 'counter', fixture.counter, 12))
  if (fixture.definition) claims.push(claim(fixture.projectId, 'definition', fixture.definition, 13))
  const relations = [
    relation(
      fixture.projectId,
      'support-central',
      support.id,
      central.id,
      'supports',
      claims,
      20,
    ),
  ]
  const counter = claims.find(item => item.id.endsWith(':counter'))
  if (counter) {
    relations.push(relation(
      fixture.projectId,
      'counter-central',
      counter.id,
      central.id,
      'counters',
      claims,
      21,
    ))
  }
  const definition = claims.find(item => item.id.endsWith(':definition'))
  if (definition) {
    relations.push(relation(
      fixture.projectId,
      'central-definition',
      central.id,
      definition.id,
      'depends-on',
      claims,
      22,
    ))
  }
  const evidenceBundles = counter ? [{
    id: `${fixture.projectId}:bundle:counter`,
    projectId: fixture.projectId,
    claimText: counter.text,
    limitations: fixture.counter.limitations,
  }] : []
  const model = ensureArgumentModel({
    id: fixture.projectId,
    argumentModel: { claims, relations },
  }).argumentModel
  return { ...fixture, model, claims, relations, central, support, counter, definition, evidenceBundles }
}

function counterCase(fixture) {
  const materialized = materializeArgumentFixture(fixture)
  const output = selectStrongestCounterargument({
    model: materialized.model,
    projectId: fixture.projectId,
    centralClaimId: materialized.central.id,
    evidenceBundles: materialized.evidenceBundles,
  })
  const expectedFound = Boolean(materialized.counter)
  const exactCounter = !expectedFound || (
    output.status === 'found'
    && output.counterClaim?.text === materialized.counter.text
    && output.relation?.fromClaimId === materialized.counter.id
    && output.relation?.toClaimId === materialized.central.id
  )
  const sourceRefs = new Set((materialized.counter?.evidenceRefs || []).map(reference => JSON.stringify(reference)))
  const traceableEvidence = !expectedFound || (
    output.evidenceRefs?.length > 0
    && output.evidenceRefs.every(reference => sourceRefs.has(JSON.stringify(reference)))
  )
  const expectedLimitations = fixture.counter?.limitations || []
  const namedLimitations = !expectedFound || expectedLimitations.every(limit => output.limitations?.includes(limit))
  const specificImpact = !expectedFound || (
    output.impact?.targetClaimId === materialized.central.id
    && ['qualifies', 'reconsider'].includes(output.impact?.effect)
    && wordCount(output.impact?.reason) >= 7
  )
  const honestAbstention = expectedFound || (
    output.status === 'insufficient'
    && /kein direkt belegtes gegenargument/iu.test(output.reason || '')
    && output.counterClaim === undefined
    && output.evidenceRefs === undefined
  )
  return {
    id: fixture.id,
    output,
    grounding: exactCounter && traceableEvidence,
    fairnessExactness: exactCounter,
    evidenceAndLimits: traceableEvidence && namedLimitations,
    impactSpecificity: specificImpact,
    honestAbstention,
  }
}

export function evaluateCounterargumentQuality(fixtures) {
  const cases = fixtures.map(counterCase)
  const dimensions = {
    grounding: scoreDimension(cases, 'grounding', 0),
    fairnessExactness: scoreDimension(cases, 'fairnessExactness', 0),
    evidenceAndLimits: scoreDimension(cases, 'evidenceAndLimits', 1),
    impactSpecificity: scoreDimension(cases, 'impactSpecificity', 2),
    honestAbstention: scoreDimension(cases, 'honestAbstention', 0),
  }
  const score = Object.values(dimensions).reduce((sum, value) => sum + value, 0)
    / Object.keys(dimensions).length
  return {
    evalId: 'ARG-04',
    cases,
    dimensions,
    score,
    passed: score >= 4.5 && Object.values(dimensions).every(value => value >= 4),
  }
}

function scoreCounterCandidate(output, expected) {
  let score = 0
  if (output?.counterClaim?.text === expected.counter.text) score += 1
  if (output?.relation?.fromClaimId === expected.counter.id && output?.relation?.toClaimId === expected.central.id) score += 1
  if (output?.evidenceRefs?.length && output.evidenceRefs.every(reference => (
    expected.counter.evidenceRefs.some(candidate => JSON.stringify(candidate) === JSON.stringify(reference))
  ))) score += 1
  const expectedLimitations = expected.evidenceBundles.flatMap(bundle => bundle.limitations || [])
  if (expectedLimitations.every(limit => output?.limitations?.includes(limit))) score += 1
  if (output?.impact?.targetClaimId === expected.central.id && wordCount(output?.impact?.reason) >= 7) score += 1
  return score
}

export function evaluateCounterargumentContrast(contrast) {
  const expected = materializeArgumentFixture(contrast.fixture)
  const grounded = selectStrongestCounterargument({
    model: expected.model,
    projectId: expected.projectId,
    centralClaimId: expected.central.id,
    evidenceBundles: expected.evidenceBundles,
  })
  const scores = {
    grounded: scoreCounterCandidate(grounded, expected),
    strawman: scoreCounterCandidate(contrast.strawman, expected),
  }
  const winner = scores.grounded >= scores.strawman ? 'grounded' : 'strawman'
  return {
    evalId: 'ARG-04-CONTRAST',
    scores,
    winner,
    passed: winner === contrast.expectedWinner && scores.grounded > scores.strawman,
  }
}

function pathCase(fixture) {
  const materialized = materializeArgumentFixture(fixture)
  const counterargument = selectStrongestCounterargument({
    model: materialized.model,
    projectId: fixture.projectId,
    centralClaimId: materialized.central.id,
    evidenceBundles: materialized.evidenceBundles,
  })
  const output = generateArgumentPaths({
    model: materialized.model,
    projectId: fixture.projectId,
    centralClaimId: materialized.central.id,
    counterargument,
  })
  const validation = validateArgumentPaths(output.paths)
  const strategies = new Set((output.paths || []).map(path => path.strategy))
  const substantiveSignatures = new Set((output.paths || []).map(path => (
    [path.premiseClaimId, path.bridge, path.perspective, path.evidenceStrategy]
      .map(value => String(value || '').trim().toLocaleLowerCase('de-DE'))
      .join('\u241f')
  )))
  return {
    id: fixture.id,
    output,
    substantiveDifference: output.status === 'ready'
      && validation.valid
      && strategies.size >= 3
      && substantiveSignatures.size === output.paths.length,
    explicitBridge: output.status === 'ready' && output.paths.every(path => wordCount(path.bridge) >= 7),
    evidenceStrategy: output.status === 'ready' && output.paths.every(path => wordCount(path.evidenceStrategy) >= 7),
    impactRisk: output.status === 'ready' && output.paths.every(path => (
      wordCount(path.impact) >= 8 && wordCount(path.risk) >= 8
    )),
    nonCosmetic: output.status === 'ready'
      && output.paths.every(path => wordCount(path.perspective) >= 6)
      && substantiveSignatures.size === output.paths.length,
  }
}

export function evaluateArgumentPathQuality(fixtures) {
  const cases = fixtures.map(pathCase)
  const dimensions = {
    substantiveDifference: scoreDimension(cases, 'substantiveDifference', 0),
    explicitBridge: scoreDimension(cases, 'explicitBridge', 2),
    evidenceStrategy: scoreDimension(cases, 'evidenceStrategy', 2),
    impactRisk: scoreDimension(cases, 'impactRisk', 1),
    nonCosmetic: scoreDimension(cases, 'nonCosmetic', 0),
  }
  const score = Object.values(dimensions).reduce((sum, value) => sum + value, 0)
    / Object.keys(dimensions).length
  return {
    evalId: 'ARG-07',
    cases,
    dimensions,
    score,
    passed: score >= 4.5 && Object.values(dimensions).every(value => value >= 4),
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const counterargument = evaluateCounterargumentQuality(counterargumentQualityFixtures)
  const counterargumentContrastResult = evaluateCounterargumentContrast(counterargumentContrast)
  const paths = evaluateArgumentPathQuality(argumentPathQualityFixtures)
  const passed = counterargument.passed && counterargumentContrastResult.passed && paths.passed
  console.log(JSON.stringify({ counterargument, counterargumentContrast: counterargumentContrastResult, paths, passed }, null, 2))
  if (!passed) process.exitCode = 1
}
