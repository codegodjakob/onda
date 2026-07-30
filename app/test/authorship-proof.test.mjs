import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAiUsageDeclaration,
  buildAuthorshipProof,
} from '../src/authorship-proof.mjs'

function mixedFixture() {
  const docs = [{
    id: 'd-a',
    projectId: 'p-a',
    title: 'Beitragstest',
    updated: 10,
    provenance: { actor: 'user', action: 'document-create', createdAt: 1 },
    findings: [
      {
        id: 'f-adopted',
        projectId: 'p-a',
        action: 'Wortgleich übernommen.',
        provenance: { actor: 'agent', action: 'hinweise' },
      },
      {
        id: 'f-edited',
        projectId: 'p-a',
        action: 'Agentenfassung.',
        provenance: { actor: 'agent', action: 'hinweise' },
      },
      {
        id: 'f-rejected',
        projectId: 'p-a',
        action: 'Nicht genutzt.',
        provenance: { actor: 'agent', action: 'hinweise' },
      },
    ],
    decisions: [
      {
        id: 'decision-adopted',
        findingId: 'f-adopted',
        kind: 'accept',
        appliedText: 'Wortgleich übernommen.',
        resultingText: 'Wortgleich übernommen.',
        at: 20,
      },
      {
        id: 'decision-edited',
        findingId: 'f-edited',
        kind: 'accept',
        appliedText: 'Vom Nutzer veränderte Fassung.',
        resultingText: 'Vom Nutzer veränderte Fassung.',
        at: 21,
      },
      {
        id: 'decision-rejected',
        findingId: 'f-rejected',
        kind: 'reject',
        appliedText: '',
        resultingText: 'Eigener Originalton.',
        at: 22,
      },
    ],
  }]
  const project = {
    id: 'p-a',
    sources: [],
    evidenceBundles: [],
    languageReports: {
      projectId: 'p-a',
      byText: {},
      history: [],
      decisions: [{
        id: 'language-review',
        projectId: 'p-a',
        textId: 'd-a',
        findingId: 'effect-a',
        entityKind: 'effect-passage',
        kind: 'finding-decision',
        decision: 'reviewed',
        provenance: { actor: 'user', action: 'language-finding-review' },
        at: 30,
      }],
    },
  }
  return { project, docs }
}

test('AUDIT-04: Autorschaftsnachweis beschreibt nur beobachtbare Beitragsarten', () => {
  const { project, docs } = mixedFixture()
  const proof = buildAuthorshipProof({ project, docs })
  assert.deepEqual(new Set(proof.contributions.map(item => item.kind)), new Set([
    'user-original',
    'agent-proposal-adopted',
    'agent-proposal-edited',
    'agent-proposal-not-adopted',
    'user-review-decision',
  ]))
  assert.equal(
    /aufmerksamkeit|verständnis|kognitiv|wahrscheinlichkeit|\d+\s*%/iu.test(JSON.stringify(proof)),
    false,
  )
  assert.equal(proof.observationLimit, 'Nicht beobachtete Beiträge werden nicht geschätzt.')
})

test('AUDIT-04: unveränderte und veränderte Übernahme werden aus Vorschlag und Entscheidung belegt', () => {
  const { project, docs } = mixedFixture()
  const proof = buildAuthorshipProof({ project, docs })
  const adopted = proof.contributions.find(item => item.kind === 'agent-proposal-adopted')
  const edited = proof.contributions.find(item => item.kind === 'agent-proposal-edited')
  const rejected = proof.contributions.find(item => item.kind === 'agent-proposal-not-adopted')
  assert.deepEqual(adopted.originEventIds, ['f-adopted', 'decision-adopted'])
  assert.deepEqual(edited.originEventIds, ['f-edited', 'decision-edited'])
  assert.deepEqual(rejected.originEventIds, ['f-rejected', 'decision-rejected'])
  assert.equal(adopted.actor, 'agent')
  assert.equal(edited.actor, 'user-and-agent')
  assert.equal(rejected.actor, 'user')
})

test('AUDIT-06: KI-Nutzungserklärung ist optional und nennt nur belegte Tätigkeiten', () => {
  const { project, docs } = mixedFixture()
  const proof = buildAuthorshipProof({ project, docs })
  assert.equal(buildAiUsageDeclaration({ proof, enabled: false }), null)
  const declaration = buildAiUsageDeclaration({ proof, enabled: true })
  assert.equal(declaration.status, 'documented')
  assert.deepEqual(declaration.activities, [
    'Formulierungsvorschläge wurden wortgleich übernommen.',
    'Formulierungsvorschläge wurden verändert übernommen.',
  ])
  assert.doesNotMatch(declaration.statement, /verfasst|generiert|wahrscheinlich|\d+\s*%/iu)
  assert.deepEqual(
    new Set(declaration.sourceEventIds),
    new Set(['f-adopted', 'decision-adopted', 'f-edited', 'decision-edited']),
  )
})

test('AUDIT-06: reine Analyse ohne übernommene Agentenfassung behauptet keinen Agententext', () => {
  const proof = buildAuthorshipProof({
    project: {
      id: 'p-a',
      sources: [],
      evidenceBundles: [],
      languageReports: {
        projectId: 'p-a',
        decisions: [{
          id: 'review-a',
          projectId: 'p-a',
          textId: 'd-a',
          decision: 'reviewed',
          provenance: { actor: 'user', action: 'language-finding-review' },
          at: 10,
        }],
      },
    },
    docs: [{
      id: 'd-a',
      projectId: 'p-a',
      provenance: { actor: 'user', action: 'document-create' },
      findings: [{
        id: 'analysis-a',
        provenance: { actor: 'agent', action: 'language-analysis' },
      }],
      decisions: [],
    }],
  })
  const declaration = buildAiUsageDeclaration({ proof, enabled: true })
  assert.equal(declaration.status, 'documented')
  assert.deepEqual(declaration.activities, ['Textanalyse und Hinweise wurden bereitgestellt.'])
  assert.doesNotMatch(declaration.statement, /text (?:verfasst|generiert)/iu)
})

test('Autorschaftsnachweis bleibt deterministisch und weist projektfremde Ereignisse ab', () => {
  const { project, docs } = mixedFixture()
  docs.push({
    id: 'd-foreign',
    projectId: 'p-b',
    provenance: { actor: 'user', action: 'document-create' },
    findings: [{ id: 'CANARY-FOREIGN', provenance: { actor: 'agent', action: 'hinweise' } }],
    decisions: [],
  })
  project.languageReports.decisions.push({
    id: 'CANARY-FOREIGN-DECISION',
    projectId: 'p-b',
    textId: 'd-foreign',
    decision: 'reviewed',
  })
  const first = buildAuthorshipProof({ project, docs })
  const second = buildAuthorshipProof({ project, docs: [...docs].reverse() })
  assert.equal(first.fingerprint, second.fingerprint)
  assert.deepEqual(first, second)
  assert.equal(JSON.stringify(first).includes('CANARY-FOREIGN'), false)
})
