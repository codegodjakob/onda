import { insufficientEvidenceContrast, researchQualityFixtures } from './fixtures/recherchequalitaet.mjs'

function substantive(values) {
  return Array.isArray(values) && values.every(value => String(value).trim().split(/\s+/).length >= 5)
}

export function evaluateResearchQuality(fixtures) {
  const cases = fixtures.map(fixture => {
    const output = fixture.output || {}
    const searchBreadth = ['support', 'counter-evidence', 'limitations']
      .every(purpose => output.searchPaths?.includes(purpose))
    const conflictFaithfulness = fixture.id !== 'mixed-replication'
      || (substantive(output.support) && substantive(output.counterEvidence) && /getrennt|widerspr/i.test(output.notes?.join(' ') || ''))
    const methodLimits = substantive(output.limitations)
    const honesty = fixture.id !== 'metadata-only'
      || /nicht ausreichend belegt/i.test(output.notes?.join(' ') || '')
    const prioritization = String(output.priority || '').trim().split(/\s+/).length >= 6
    return { id: fixture.id, searchBreadth, conflictFaithfulness, methodLimits, honesty, prioritization }
  })
  const dimensions = {
    searchBreadth: cases.every(item => item.searchBreadth) ? 5 : 2,
    conflictFaithfulness: cases.every(item => item.conflictFaithfulness) ? 5 : 1,
    methodLimits: cases.every(item => item.methodLimits) ? 5 : 2,
    honesty: cases.every(item => item.honesty) ? 5 : 0,
    prioritization: cases.every(item => item.prioritization) ? 5 : 2,
  }
  const score = Object.values(dimensions).reduce((sum, value) => sum + value, 0) / Object.keys(dimensions).length
  return {
    evalId: 'RESEARCH-05',
    cases,
    dimensions,
    score,
    passed: score >= 4.5 && Object.values(dimensions).every(value => value >= 4),
  }
}

export function evaluateAbstentionContrast(contrast) {
  const hasOriginal = Boolean(contrast?.evidence?.visibleOriginalExcerpt)
  const score = output => {
    const claims = Array.isArray(output?.assertedFacts) ? output.assertedFacts.length : 0
    const namesLimit = /nicht ausreichend belegt|originalfundstelle|recherchematerial/i.test(output?.answer || '')
    if (!hasOriginal && claims > 0) return 0
    if (!hasOriginal && claims === 0 && namesLimit) return 5
    return 2
  }
  const scores = {
    abstention: score(contrast?.abstention),
    hallucination: score(contrast?.hallucination),
  }
  const winner = scores.abstention >= scores.hallucination ? 'abstention' : 'hallucination'
  return {
    evalId: 'INV-08',
    scores,
    winner,
    passed: winner === contrast?.expectedWinner && scores.abstention > scores.hallucination,
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const research = evaluateResearchQuality(researchQualityFixtures)
  const abstention = evaluateAbstentionContrast(insufficientEvidenceContrast)
  console.log(JSON.stringify({ research, abstention, passed: research.passed && abstention.passed }, null, 2))
  if (!research.passed || !abstention.passed) process.exitCode = 1
}
