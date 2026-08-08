// Behauptungsstärke gegen Belegelage — PUR, node-testbar, kein DOM.
//
// Prüft, ob ein Satz mehr behauptet, als er belegt: "beweist", "zweifellos", "ausnahmslos"
// bei dünner oder strittiger Quellenlage — und umgekehrt eine Aussage, die sich mit
// "vielleicht" kleiner macht, als sie ist. Die Befunde entstehen über die Fabrik aus
// language-diagnostics.mjs und sehen deshalb aus wie alle anderen Sprachbefunde.
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js), eingebunden über language-ui.mjs.
import { createLanguageDiagnostic } from './language-diagnostics.mjs'

const TOO_STRONG = /\b(?:beweist|bewiesen|zweifellos|ausnahmslos|garantiert|immer|unbestreitbar)\b/iu
const UNIVERSAL_REACH = /\b(?:ausnahmslos|garantiert|immer|alle[nrms]?|jede[rmns]?)\b/iu
const WEAK_MARKERS = /\b(?:könnte|vielleicht|möglicherweise|eventuell|unter Umständen)\b/giu
const WEAK_EVIDENCE = new Set(['mixed', 'insufficient', 'review-required', 'unverified'])

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function requiredText(value, label) {
  const result = typeof value === 'string' ? value.trim() : ''
  if (!result) throw new TypeError(`${label} is required`)
  return result
}

function fingerprint(parts) {
  let hash = 2166136261
  for (const character of parts.join('\u241f')) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function modalityDiagnostic({
  claim,
  match,
  diagnosticClass,
  direction,
  message,
  reason,
  at,
}) {
  const start = claim.anchor.start + match.index
  const token = fingerprint([claim.id, direction, match[0], claim.evidenceStatus])
  return {
    ...createLanguageDiagnostic({
      id: `language-modality:${claim.id}:${token}`,
      projectId: claim.projectId,
      textId: claim.textId,
      blockId: claim.anchor.blockId,
      anchor: { exact: match[0], start, end: start + match[0].length },
      class: diagnosticClass,
      family: 'modality',
      label: 'Evidenzkalibrierung',
      message,
      reason,
      reviewQuestion: direction === 'too-strong'
        ? 'Ist diese Reichweite durch den Claim und seine Beleglage tatsächlich gedeckt?'
        : 'Ist diese Abschwächung sachlich erforderlich oder verdeckt sie einen direkt gestützten Befund?',
      confidence: 'high',
      requiredContext: ['claim-evidence'],
      provenance: { actor: 'agent', action: 'claim-modality-analysis' },
      fingerprint: token,
      createdAt: at,
    }),
    claimId: claim.id,
    direction,
    evidenceStatus: claim.evidenceStatus,
  }
}

export function analyzeClaimModality({
  model,
  projectId,
  textId,
  at = Date.now(),
}) {
  const normalizedProjectId = requiredText(projectId, 'Language modality project')
  const normalizedTextId = requiredText(textId, 'Language modality text')
  if (!Number.isFinite(at)) throw new TypeError('Language modality time is required')
  const claims = Array.isArray(model?.claims) ? model.claims : []
  if (claims.some(claim => claim?.projectId !== normalizedProjectId)) {
    throw new TypeError('Language modality contains a foreign project')
  }
  const diagnostics = []
  const evaluatedClaims = claims
    .filter(claim => claim?.status !== 'stale' && claim.textId === normalizedTextId)
  evaluatedClaims.forEach(claim => {
      const strong = TOO_STRONG.exec(claim.text)
      if (strong && WEAK_EVIDENCE.has(claim.evidenceStatus)) {
        diagnostics.push(modalityDiagnostic({
          claim,
          match: strong,
          diagnosticClass: 'integrity-warning',
          direction: 'too-strong',
          message: 'Die Behauptungsstärke geht über die dokumentierte Beleglage hinaus.',
          reason: `Der Claim trägt den Evidenzstatus ${claim.evidenceStatus}; der markierte Ausdruck behauptet höhere Sicherheit.`,
          at,
        }))
        return
      }
      const universal = UNIVERSAL_REACH.exec(claim.text)
      if (
        universal
        && claim.evidenceStatus === 'supported'
        && claim.origin?.scope !== 'universal-supported'
      ) {
        diagnostics.push(modalityDiagnostic({
          claim,
          match: universal,
          diagnosticClass: 'integrity-warning',
          direction: 'too-strong',
          message: 'Die universelle Reichweite ist durch einen direkt gestützten Einzelclaim noch nicht gedeckt.',
          reason: 'Der Evidenzstatus bestätigt den Claim, aber keine ausnahmslose Übertragung über Population, Zeit und Kontext.',
          at,
        }))
        return
      }
      const weak = [...claim.text.matchAll(WEAK_MARKERS)]
      if (claim.evidenceStatus === 'supported' && weak.length >= 1) {
        diagnostics.push(modalityDiagnostic({
          claim,
          match: weak[0],
          diagnosticClass: 'register-observation',
          direction: 'too-weak',
          message: 'Die Abschwächung kann die direkt gestützte Aussage unnötig undeutlich machen.',
          reason: 'Der Claim ist direkt gestützt; die Beobachtung verlangt dennoch eine Autorenentscheidung über die gewünschte Vorsicht.',
          at,
        }))
      }
    })
  return {
    projectId: normalizedProjectId,
    textId: normalizedTextId,
    evaluatedClaimIds: evaluatedClaims.map(claim => claim.id),
    evidenceStatuses: [...new Set(evaluatedClaims.map(claim => claim.evidenceStatus))],
    diagnostics: clone(diagnostics),
    analyzedAt: at,
  }
}
