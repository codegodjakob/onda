// Rechtschreibkorrekturen planen und anwenden — PUR, node-testbar, kein DOM.
//
// Erst wird geplant (welche Regel greift wo, und darf sie hier überhaupt von selbst
// greifen — das sagt das Sprachprofil), dann angewendet. Jede einzelne Ersetzung muss zwei
// Gegenproben bestehen: sie gehört zu ihrer Regel (orthography-rules.mjs), und sie
// verändert die Aussage nicht (language-variant.mjs).
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js), aufgerufen aus language-ui.mjs.
import { ensureLanguageProfile } from './language-profile.mjs'
import { validateOrthographyRuleApplication } from './orthography-rules.mjs'
import { evaluateLanguageVariant } from './language-variant.mjs'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function requiredText(value, label) {
  const result = typeof value === 'string' ? value.trim() : ''
  if (!result) throw new TypeError(`${label} is required`)
  return result
}

function normalizeProfile(profile, projectId) {
  const normalizedProjectId = requiredText(projectId, 'Orthography project')
  const next = ensureLanguageProfile({
    id: normalizedProjectId,
    languageProfile: clone(profile),
  })
  if (next.projectId !== normalizedProjectId) throw new TypeError('Orthography project mismatch')
  return next
}

function validCorrection(correction, projectId, textId) {
  return Boolean(
    correction
    && correction.projectId === projectId
    && correction.textId === textId
    && typeof correction.diagnosticId === 'string'
    && correction.diagnosticId
    && typeof correction.blockId === 'string'
    && correction.blockId
    && Number.isInteger(correction.blockIndex)
    && correction.blockIndex >= 0
    && Number.isInteger(correction.sourceTextOffset)
    && correction.sourceTextOffset >= 0
    && correction.kind === 'orthography'
    && correction.unambiguous === true
    && correction.meaningGuard === 'accepted'
    && correction.anchor
    && Number.isInteger(correction.anchor.start)
    && Number.isInteger(correction.anchor.end)
    && correction.anchor.start >= 0
    && correction.anchor.end > correction.anchor.start
    && typeof correction.anchor.exact === 'string'
    && correction.anchor.end - correction.anchor.start === correction.anchor.exact.length
    && validateOrthographyRuleApplication({
      ruleId: correction.ruleId,
      exact: correction.anchor.exact,
      replacement: correction.replacement,
    })
  )
}

export function planOrthographyCorrections({
  profile,
  projectId,
  textId,
  diagnostics = [],
}) {
  const normalizedProfile = normalizeProfile(profile, projectId)
  const normalizedTextId = requiredText(textId, 'Orthography text')
  if (!Array.isArray(diagnostics)) throw new TypeError('Orthography diagnostics are required')
  diagnostics.forEach(item => {
    if (item?.projectId !== projectId) throw new TypeError('Orthography diagnostic project mismatch')
    if (item?.textId !== normalizedTextId) throw new TypeError('Orthography diagnostic text mismatch')
  })
  if (!normalizedProfile.orthographyAutomation) {
    return {
      projectId,
      textId: normalizedTextId,
      status: 'disabled',
      corrections: [],
    }
  }
  const corrections = diagnostics
    .filter(item => (
      item?.class === 'norm-error'
      && item.suggestion?.kind === 'orthography'
      && item.suggestion?.unambiguous === true
      && typeof item.suggestion?.replacement === 'string'
      && item.suggestion.replacement
      && Number.isInteger(item.blockIndex)
      && item.blockIndex >= 0
      && validateOrthographyRuleApplication({
        ruleId: item.suggestion.ruleId,
        exact: item.anchor?.exact,
        replacement: item.suggestion.replacement,
      })
    ))
    .map(item => {
      const structureSignature = `${item.blockId}:${item.blockIndex}`
      const originalText = item.anchor.exact.toLocaleLowerCase('de-DE')
      const candidateText = item.suggestion.replacement.toLocaleLowerCase('de-DE')
      const guard = evaluateLanguageVariant({
        projectId,
        original: {
          text: originalText,
          evidenceStatus: 'orthography-only',
          structureSignature,
        },
        candidate: {
          text: candidateText,
          evidenceStatus: 'orthography-only',
          structureSignature,
          direction: 'language',
        },
        safeTransformations: [[originalText, candidateText]],
      })
      return {
        diagnosticId: item.id,
        projectId,
        textId: normalizedTextId,
        blockId: item.blockId,
        blockIndex: item.blockIndex,
        sourceTextOffset: item.sourceTextOffset || 0,
        anchor: clone(item.anchor),
        replacement: item.suggestion.replacement,
        ruleId: item.suggestion.ruleId,
        kind: item.suggestion.kind,
        unambiguous: item.suggestion.unambiguous,
        meaningGuard: guard.status,
      }
    })
    .filter(item => item.meaningGuard === 'accepted')
    .sort((left, right) => (
      right.blockIndex - left.blockIndex
      || right.anchor.start - left.anchor.start
    ))
  return {
    projectId,
    textId: normalizedTextId,
    status: corrections.length ? 'ready' : 'empty',
    corrections,
  }
}

export function applyOrthographyCorrections({
  profile,
  projectId,
  textId,
  plan,
  applyCorrections,
  at = Date.now(),
}) {
  if (!Number.isFinite(at)) throw new TypeError('Orthography application time is required')
  const next = normalizeProfile(profile, projectId)
  const normalizedTextId = requiredText(textId, 'Orthography text')
  if (!plan || plan.projectId !== projectId || plan.textId !== normalizedTextId) {
    throw new TypeError('Orthography plan scope mismatch')
  }
  if (!next.orthographyAutomation || plan.status === 'disabled') {
    return { profile: next, applied: [], skipped: [] }
  }
  if (typeof applyCorrections !== 'function') throw new TypeError('Orthography apply adapter is required')
  const corrections = Array.isArray(plan.corrections) ? plan.corrections : []
  if (
    corrections.some(correction => !validCorrection(correction, projectId, normalizedTextId))
    || new Set(corrections.map(correction => correction.diagnosticId)).size !== corrections.length
  ) {
    throw new TypeError('Orthography plan contains an invalid correction')
  }
  const didApply = corrections.length > 0 && applyCorrections(clone(corrections)) === true
  const applied = didApply ? clone(corrections) : []
  const skipped = didApply ? [] : clone(corrections)
  applied.forEach(correction => {
    next.events.push({
      id: `language-profile-event:orthography-applied:${correction.diagnosticId}:${at}`,
      projectId,
      textId: normalizedTextId,
      blockId: correction.blockId,
      kind: 'orthography-applied',
      ruleId: correction.ruleId,
      oldText: correction.anchor.exact,
      newText: correction.replacement,
      anchor: clone(correction.anchor),
      provenance: { actor: 'user', action: 'orthography-apply' },
      at,
    })
  })
  return { profile: next, applied, skipped }
}
