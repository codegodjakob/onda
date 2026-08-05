import test from 'node:test'
import assert from 'node:assert/strict'

import { baueArbeitskontext, formatiereArbeitskontext } from '../src/arbeitskontext-model.mjs'

function projekt() {
  return {
    id: 'p-a',
    sources: [
      { id: 's-ok', projectId: 'p-a', type: 'pdf', status: 'active', metadata: { title: { value: 'MARKANTE-QUELLE' } }, origin: { immutableRef: 'project://p-a/q.pdf' }, provenance: { actor: 'user', action: 'import' } },
      { id: 's-ret', projectId: 'p-a', status: 'retracted', metadata: { title: { value: 'DARF-NICHT-REIN-RUECKNAHME' } } },
      { id: 's-foreign', projectId: 'p-b', status: 'active', metadata: { title: { value: 'DARF-NICHT-REIN-FREMD' } } },
    ],
    evidenceBundles: [
      { id: 'e-ok', projectId: 'p-a', claimId: 'c1', claimText: 'MARKANTER-BELEG-CLAIM', status: 'mixed', limitations: ['MARKANTE-GRENZE'], uncertainty: 'MARKANTE-UNSICHERHEIT', counterEvidence: [{ sourceId: 's2' }], support: [{ sourceId: 's-ok' }], provenance: { actor: 'user', action: 'evidence-assemble' } },
      { id: 'e-foreign', projectId: 'p-b', claimText: 'DARF-NICHT-REIN-BELEG', status: 'supported' },
    ],
    argumentModel: {
      claims: [
        { id: 'c1', projectId: 'p-a', textId: 'd-a', text: 'MARKANTE-AUSSAGE-A', status: 'active', validity: 'asserted' },
        { id: 'c2', projectId: 'p-a', textId: 'd-b', text: 'MARKANTE-AUSSAGE-B', status: 'active', validity: 'asserted' },
        { id: 'c-stale', projectId: 'p-a', textId: 'd-a', text: 'DARF-NICHT-REIN-ALT', status: 'stale', validity: 'asserted' },
      ],
      relations: [
        { id: 'r-ok', projectId: 'p-a', fromClaimId: 'c2', toClaimId: 'c1', type: 'supports', warrant: 'MARKANTE-BRUECKE', confidence: 'high', provenance: { actor: 'agent', action: 'argument-derived' } },
        { id: 'r-bad', projectId: 'p-a', fromClaimId: 'c-stale', toClaimId: 'c1', type: 'supports', warrant: 'DARF-NICHT-REIN-RELATION' },
      ],
    },
    languageReports: {
      projectId: 'p-a',
      byText: {
        'd-a': {
          projectId: 'p-a', textId: 'd-a',
          diagnostics: [{ id: 'diag-1', projectId: 'p-a', textId: 'd-a', label: 'MARKANTE-DIAGNOSE', message: 'MARKANTE-DIAGNOSE-MELDUNG', reason: 'MARKANTER-GRUND', reviewQuestion: 'MARKANTE-PRUEFFRAGE', confidence: 'high' }],
          effect: { projectId: 'p-a', textId: 'd-a', passages: [{ id: 'effect-1', projectId: 'p-a', textId: 'd-a', function: 'position', status: 'hypothesis', rationale: 'MARKANTE-WIRKUNGSGRUND' }] },
          rhetoric: { projectId: 'p-a', textId: 'd-a', devices: [{ id: 'rhet-1', projectId: 'p-a', textId: 'd-a', kind: 'contrast', function: 'MARKANTE-RHETORIK', effectStatus: 'hypothesis', reason: 'MARKANTE-RHETORIKGRENZE' }] },
          fairness: { projectId: 'p-a', textId: 'd-a', findings: [{ id: 'fair-1', projectId: 'p-a', textId: 'd-a', label: 'MARKANTE-FAIRNESS', reason: 'MARKANTE-FAIRNESSGRUND', confidence: 'medium' }] },
        },
        'd-b': { projectId: 'p-a', textId: 'd-b', diagnostics: [{ id: 'diag-fremdtext', label: 'DARF-NICHT-REIN-ANDERER-TEXT' }] },
      },
    },
  }
}

test('Arbeitskontext vereint relevante Quellen, Belege, Relationen, Wirkung und Sprache', () => {
  const ergebnis = baueArbeitskontext({ project: projekt(), doc: { id: 'd-a', projectId: 'p-a' } })
  const arten = new Set(ergebnis.items.map(item => item.kind))
  for (const art of ['source', 'evidence', 'relation', 'diagnostic', 'effect', 'rhetoric', 'fairness']) {
    assert.ok(arten.has(art), `${art} fehlt`)
  }
  const text = formatiereArbeitskontext(ergebnis)
  for (const canary of ['MARKANTE-QUELLE', 'MARKANTER-BELEG-CLAIM', 'MARKANTE-BRUECKE', 'MARKANTE-DIAGNOSE', 'MARKANTE-WIRKUNGSGRUND', 'MARKANTE-RHETORIK', 'MARKANTE-FAIRNESS']) {
    assert.match(text, new RegExp(canary))
  }
})

test('fremde, zurückgezogene, veraltete und textfremde Daten werden ausgeschlossen', () => {
  const ergebnis = baueArbeitskontext({ project: projekt(), doc: { id: 'd-a', projectId: 'p-a' } })
  const text = JSON.stringify(ergebnis)
  for (const canary of ['DARF-NICHT-REIN-RUECKNAHME', 'DARF-NICHT-REIN-FREMD', 'DARF-NICHT-REIN-BELEG', 'DARF-NICHT-REIN-ALT', 'DARF-NICHT-REIN-RELATION', 'DARF-NICHT-REIN-ANDERER-TEXT']) {
    assert.doesNotMatch(text, new RegExp(canary))
  }
  assert.ok(ergebnis.manifest.excluded.foreign >= 2)
  assert.ok(ergebnis.manifest.excluded.inactive >= 2)
})

test('Deduplizierung und Zeichenbudget sind deterministisch und im Manifest sichtbar', () => {
  const input = projekt()
  input.sources.push({ ...input.sources[0] })
  const a = baueArbeitskontext({ project: input, doc: { id: 'd-a', projectId: 'p-a' }, maxItems: 3, maxChars: 300 })
  const b = baueArbeitskontext({ project: input, doc: { id: 'd-a', projectId: 'p-a' }, maxItems: 3, maxChars: 300 })
  assert.deepEqual(a, b)
  assert.equal(new Set(a.items.map(item => `${item.kind}:${item.id}`)).size, a.items.length)
  assert.ok(a.items.length <= 3)
  assert.ok(a.manifest.excluded.duplicate >= 1)
  assert.ok(a.manifest.excluded.budget >= 1)
  assert.ok(a.manifest.usedChars <= 300)
})

test('fremdes Dokument oder beschädigte Eingabe liefert sicher keinen Kontext', () => {
  assert.deepEqual(baueArbeitskontext({ project: projekt(), doc: { id: 'd-a', projectId: 'p-b' } }).items, [])
  assert.deepEqual(baueArbeitskontext({ project: null, doc: null }).items, [])
})
