// Wiederkehrende Sprachmuster über mehrere Absätze — PUR, node-testbar, kein DOM.
//
// Sucht, was erst im Zusammenhang auffällt: dieselbe Übergangsformel ("Darüber hinaus",
// "Des Weiteren") mehrfach hintereinander. Ein einzelner Absatz ist dafür blind, deshalb
// bekommt dieses Modul die Blöcke am Stück. Befundform aus language-diagnostics.mjs.
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js), eingebunden über language-ui.mjs.
import { createLanguageDiagnostic } from './language-diagnostics.mjs'

const CONNECTOR = /^\s*(Darüber hinaus|Des Weiteren|Zusätzlich|Abschließend)\b/iu

function requiredText(value, label) {
  const result = typeof value === 'string' ? value.trim() : ''
  if (!result) throw new TypeError(`${label} is required`)
  return result
}

function stableHash(value) {
  let hash = 2166136261
  for (const character of String(value)) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function analyzeLanguagePatterns({
  projectId,
  textId,
  context,
  blocks = [],
  at = Date.now(),
}) {
  const normalizedProjectId = requiredText(projectId, 'Language pattern project')
  const normalizedTextId = requiredText(textId, 'Language pattern text')
  if (!Number.isFinite(at)) throw new TypeError('Language pattern time is required')
  if (!context || context.projectId !== normalizedProjectId) {
    throw new TypeError('Language pattern context project mismatch')
  }
  const missingContext = ['genre', 'passageFunction']
    .filter(field => !context.known?.[field])
  if (missingContext.length) {
    return {
      projectId: normalizedProjectId,
      textId: normalizedTextId,
      diagnostics: [],
      status: 'abstained',
      missingContext,
      analyzedAt: at,
    }
  }
  const matches = (Array.isArray(blocks) ? blocks : []).flatMap(block => {
    if (!block?.id || typeof block.text !== 'string') return []
    const match = CONNECTOR.exec(block.text)
    return match ? [{ block, match }] : []
  })
  const unfunctional = matches.filter(({ block }) => (
    block.role !== 'transition'
    && context.known?.passageFunction !== 'transition'
  ))
  const diagnostics = []
  if (unfunctional.length >= 3) {
    const { block, match } = unfunctional[0]
    const exact = match[1]
    const start = match.index + match[0].indexOf(exact)
    const token = stableHash([normalizedProjectId, normalizedTextId, exact, unfunctional.length].join(':'))
    diagnostics.push(createLanguageDiagnostic({
      id: `language-pattern:${normalizedTextId}:${token}`,
      projectId: normalizedProjectId,
      textId: normalizedTextId,
      blockId: block.id,
      anchor: { exact, start, end: start + exact.length },
      class: 'register-observation',
      family: 'anti-slop',
      label: 'Musterbeobachtung',
      message: 'Die wiederholte Übergangsformel auf ihre konkrete Funktion prüfen.',
      reason: `Die dokumentweite Häufung tritt ${unfunctional.length}-mal ohne markierte Übergangsfunktion auf; der Ausdruck selbst ist nicht verboten.`,
      reviewQuestion: 'Welche konkrete Übergangs- oder Informationsfunktion erfüllt jede Wiederholung?',
      confidence: 'medium',
      requiredContext: ['passageFunction', 'genre'],
      provenance: { actor: 'agent', action: 'language-pattern-analysis' },
      fingerprint: token,
      createdAt: at,
    }))
  }
  return {
    projectId: normalizedProjectId,
    textId: normalizedTextId,
    diagnostics,
    status: 'analyzed',
    missingContext: [],
    analyzedAt: at,
  }
}
