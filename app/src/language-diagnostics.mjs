// Der gemeinsame Vertrag für Sprachbefunde — PUR, node-testbar, kein DOM.
//
// Hier steht, welche fünf Arten von Sprachbefund es überhaupt gibt (vom harten Normfehler
// bis zur Integritätswarnung) und welche Felder jeder einzelne tragen muss. Dazu die
// Grunduntersuchung eines Textes auf Rechtschreibung, Grammatik und Register. Die
// Nachbarmodule language-modality.mjs und language-patterns.mjs bauen ihre Befunde über
// dieselbe Fabrik, damit die Oberfläche nur eine Form kennen muss.
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js), eingebunden über language-ui.mjs.
import { ORTHOGRAPHY_RULES } from './orthography-rules.mjs'

export const LANGUAGE_DIAGNOSTIC_CLASSES = Object.freeze([
  'norm-error',
  'grammar-observation',
  'register-observation',
  'effect-hypothesis',
  'integrity-warning',
])

const CLASS_SET = new Set(LANGUAGE_DIAGNOSTIC_CLASSES)
const CONFIDENCE_SET = new Set(['low', 'medium', 'high'])

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

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

function normalizeAnchor(value) {
  if (!isObject(value)) throw new TypeError('Language diagnostic anchor is required')
  const exact = requiredText(value.exact, 'Language diagnostic anchor exact text')
  if (
    !Number.isInteger(value.start)
    || !Number.isInteger(value.end)
    || value.start < 0
    || value.end <= value.start
    || value.end - value.start !== exact.length
  ) {
    throw new TypeError('Language diagnostic anchor range is invalid')
  }
  return { exact, start: value.start, end: value.end }
}

export function createLanguageDiagnostic(input) {
  if (!isObject(input)) throw new TypeError('Language diagnostic is required')
  if (!Number.isFinite(input.createdAt)) throw new TypeError('Language diagnostic time is required')
  const diagnosticClass = requiredText(input.class, 'Language diagnostic class')
  if (!CLASS_SET.has(diagnosticClass)) throw new TypeError(`Language diagnostic class is invalid: ${diagnosticClass}`)
  const confidence = requiredText(input.confidence, 'Language diagnostic confidence')
  if (!CONFIDENCE_SET.has(confidence)) throw new TypeError('Language diagnostic confidence is invalid')
  if (!isObject(input.provenance)) throw new TypeError('Language diagnostic provenance is required')
  return {
    id: requiredText(input.id, 'Language diagnostic id'),
    projectId: requiredText(input.projectId, 'Language diagnostic project'),
    textId: requiredText(input.textId, 'Language diagnostic text'),
    blockId: requiredText(input.blockId, 'Language diagnostic block'),
    blockIndex: Number.isInteger(input.blockIndex) && input.blockIndex >= 0 ? input.blockIndex : null,
    sourceTextOffset: Number.isInteger(input.sourceTextOffset) && input.sourceTextOffset >= 0
      ? input.sourceTextOffset
      : 0,
    anchor: normalizeAnchor(input.anchor),
    class: diagnosticClass,
    family: requiredText(input.family, 'Language diagnostic family'),
    label: requiredText(input.label, 'Language diagnostic label'),
    message: requiredText(input.message, 'Language diagnostic message'),
    reason: requiredText(input.reason, 'Language diagnostic reason'),
    reviewQuestion: requiredText(input.reviewQuestion, 'Language diagnostic review question'),
    confidence,
    requiredContext: Array.isArray(input.requiredContext)
      ? [...new Set(input.requiredContext.map(String).map(value => value.trim()).filter(Boolean))]
      : [],
    suggestion: input.suggestion ? clone(input.suggestion) : null,
    provenance: {
      actor: requiredText(input.provenance.actor, 'Language diagnostic provenance actor'),
      action: requiredText(input.provenance.action, 'Language diagnostic provenance action'),
    },
    fingerprint: requiredText(input.fingerprint, 'Language diagnostic fingerprint'),
    createdAt: input.createdAt,
  }
}

function diagnostic({
  projectId,
  textId,
  block,
  exact,
  start,
  diagnosticClass,
  family,
  label,
  message,
  reason,
  reviewQuestion,
  confidence,
  requiredContext = [],
  suggestion = null,
  at,
}) {
  const fingerprint = stableHash([
    projectId,
    textId,
    block.id,
    start,
    exact,
    diagnosticClass,
    family,
  ].join('\u241f'))
  return createLanguageDiagnostic({
    id: `language-diagnostic:${textId}:${block.id}:${fingerprint}`,
    projectId,
    textId,
    blockId: block.id,
    blockIndex: block.index,
    sourceTextOffset: block.sourceTextOffset,
    anchor: { exact, start, end: start + exact.length },
    class: diagnosticClass,
    family,
    label,
    message,
    reason,
    reviewQuestion,
    confidence,
    requiredContext,
    suggestion,
    provenance: { actor: 'agent', action: 'language-analysis' },
    fingerprint,
    createdAt: at,
  })
}

function houseStyleProtects(text, exact, houseStyle) {
  const normalizedText = text.toLocaleLowerCase('de-DE')
  const normalizedExact = exact.toLocaleLowerCase('de-DE')
  return (Array.isArray(houseStyle) ? houseStyle : []).some(rule => {
    const normalizedRule = String(rule).trim().toLocaleLowerCase('de-DE')
    if (!normalizedRule.includes(normalizedExact)) return false
    return normalizedText.includes(normalizedRule)
      || /^(?:erlaubt|eigenname|produktname|schreibweise)\s*:/u.test(normalizedRule)
  })
}

function protectedTextRanges(text, block) {
  const ranges = Array.isArray(block?.protectedRanges)
    ? block.protectedRanges
      .filter(range => Number.isInteger(range?.start) && Number.isInteger(range?.end))
      .map(range => ({ start: range.start, end: range.end, kind: range.kind || 'rich-text' }))
    : []
  if (block?.type === 'blockquote' || block?.type === 'codeBlock') {
    ranges.push({ start: 0, end: text.length, kind: block.type })
  }
  const patterns = [
    /\b(?:https?:\/\/|www\.)[^\s<>"'»“]+/giu,
    /„[^“\n]+“/gu,
    /»[^«\n]+«/gu,
    /"[^"\n]+"/gu,
    /'[^'\n]+'/gu,
    /\b[\p{Lu}][\p{L}\p{M}-]*\s+(?:GmbH|AG|KG|SE|e\.?\s*V\.?|Inc\.?|Ltd\.?)\b/gu,
    /\b(?:Hotel|Firma|Marke|Produkt|Projekt|Institut|Agentur|Verlag|Restaurant|Caf[eé]|Praxis|Kanzlei)\s+[\p{Lu}][\p{L}\p{M}-]*\b/gu,
  ]
  patterns.forEach(pattern => {
    for (const match of text.matchAll(pattern)) {
      ranges.push({ start: match.index, end: match.index + match[0].length })
    }
  })
  return ranges
}

function textRangeIsProtected(ranges, start, end) {
  return ranges.some(range => start >= range.start && end <= range.end)
}

function capitalizedTokenIsUncertainName(text, exact, start) {
  if (!/^\p{Lu}/u.test(exact)) return false
  const prefix = text.slice(0, start).trimEnd()
  return Boolean(prefix) && !/[.!?…]["'»“)]?$/u.test(prefix)
}

function normDiagnostics({ projectId, textId, block, context, at }) {
  const text = String(block.text || '')
  const houseStyle = context.known?.houseStyle || []
  const protectedRanges = protectedTextRanges(text, block)
  const result = []
  ORTHOGRAPHY_RULES.forEach(rule => {
    for (const match of text.matchAll(rule.pattern)) {
      const exact = match[0]
      if (textRangeIsProtected(protectedRanges, match.index, match.index + exact.length)) continue
      if (capitalizedTokenIsUncertainName(text, exact, match.index)) continue
      if (houseStyleProtects(text, exact, houseStyle)) continue
      result.push(diagnostic({
        projectId,
        textId,
        block,
        exact,
        start: match.index,
        diagnosticClass: 'norm-error',
        family: 'orthography',
        label: 'Normfehler',
        message: rule.message,
        reason: 'Die Form gehört zu einer kleinen Liste eindeutiger, kontextunabhängiger Schreibungen.',
        reviewQuestion: 'Soll diese eindeutige Schreibweise bewusst übernommen werden?',
        confidence: 'high',
        suggestion: {
          kind: 'orthography',
          replacement: rule.replacement(exact),
          ruleId: rule.id,
          unambiguous: true,
        },
        at,
      }))
    }
  })
  return result
}

function grammarDiagnostics({ projectId, textId, block, at }) {
  const text = String(block.text || '')
  const match = /\b(der|die|das|ein|eine)\s+\1\b/iu.exec(text)
  if (!match) return []
  return [diagnostic({
    projectId,
    textId,
    block,
    exact: match[0],
    start: match.index,
    diagnosticClass: 'grammar-observation',
    family: 'grammar',
    label: 'Grammatische Auffälligkeit',
    message: 'Der Artikel steht unmittelbar doppelt.',
    reason: 'Die Wiederholung kann ein Tippfehler sein, kann aber ohne Satzkontext nicht automatisch aufgelöst werden.',
    reviewQuestion: 'Ist der doppelte Artikel beabsichtigt oder soll einer entfallen?',
    confidence: 'medium',
    at,
  })]
}

function registerDiagnostics({ projectId, textId, block, context, at }) {
  const genre = context.known?.genre
  if (genre !== 'scientific') return []
  const text = String(block.text || '')
  const match = /\b(?:mega|krass|superduper)\b/iu.exec(text)
  if (!match) return []
  return [diagnostic({
    projectId,
    textId,
    block,
    exact: match[0],
    start: match.index,
    diagnosticClass: 'register-observation',
    family: 'register',
    label: 'Registerbeobachtung',
    message: 'Die Formulierung wirkt im angegebenen wissenschaftlichen Register ungewöhnlich informell.',
    reason: 'Der Befund folgt aus dem korrigierbaren Genreprofil, nicht aus einem allgemeinen Wortverbot.',
    reviewQuestion: 'Passt diese informelle Form zum angegebenen wissenschaftlichen Register?',
    confidence: 'medium',
    requiredContext: ['genre'],
    at,
  })]
}

export function analyzeLanguageDiagnostics({
  projectId,
  textId,
  blocks = [],
  context,
  at = Date.now(),
}) {
  const normalizedProjectId = requiredText(projectId, 'Language analysis project')
  const normalizedTextId = requiredText(textId, 'Language analysis text')
  if (!Number.isFinite(at)) throw new TypeError('Language analysis time is required')
  if (!isObject(context) || context.projectId !== normalizedProjectId) {
    throw new TypeError('Language analysis context project mismatch')
  }
  if (!Array.isArray(blocks)) throw new TypeError('Language analysis blocks are required')
  const diagnostics = []
  blocks.forEach((block, index) => {
    if (!block?.id || typeof block.text !== 'string' || !block.text.trim()) return
    const normalizedBlock = {
      ...block,
      index: Number.isInteger(block.index) ? block.index : index,
      sourceTextOffset: Number.isInteger(block.sourceTextOffset) ? block.sourceTextOffset : 0,
    }
    diagnostics.push(...normDiagnostics({
      projectId: normalizedProjectId,
      textId: normalizedTextId,
      block: normalizedBlock,
      context,
      at,
    }))
    diagnostics.push(...grammarDiagnostics({
      projectId: normalizedProjectId,
      textId: normalizedTextId,
      block: normalizedBlock,
      at,
    }))
    if (context.known?.genre) {
      diagnostics.push(...registerDiagnostics({
        projectId: normalizedProjectId,
        textId: normalizedTextId,
        block: normalizedBlock,
        context,
        at,
      }))
    }
  })
  const variantPairs = context.known?.region === 'CH'
    ? [['Strasse', 'Straße']]
    : context.known?.region === 'AT'
      ? [['Jänner', 'Januar']]
      : context.known?.region === 'DE'
        ? [['Januar', 'Jänner']]
        : []
  variantPairs.forEach(([preferred, alternative]) => {
    const preferredPattern = new RegExp(`\\b${preferred}\\b`, 'iu')
    const alternativePattern = new RegExp(`\\b${alternative}\\b`, 'iu')
    const preferredBlock = blocks.find(block => preferredPattern.test(block?.text || ''))
    const alternativeBlock = blocks.find(block => alternativePattern.test(block?.text || ''))
    if (!preferredBlock || !alternativeBlock) return
    const match = alternativePattern.exec(alternativeBlock.text)
    const normalizedBlock = {
      ...alternativeBlock,
      index: Number.isInteger(alternativeBlock.index) ? alternativeBlock.index : blocks.indexOf(alternativeBlock),
      sourceTextOffset: Number.isInteger(alternativeBlock.sourceTextOffset) ? alternativeBlock.sourceTextOffset : 0,
    }
    diagnostics.push(diagnostic({
      projectId: normalizedProjectId,
      textId: normalizedTextId,
      block: normalizedBlock,
      exact: match[0],
      start: match.index,
      diagnosticClass: 'register-observation',
      family: 'variant-consistency',
      label: 'Variantenbeobachtung',
      message: 'Im Text stehen zwei legitime regionale Varianten nebeneinander.',
      reason: `Für ${context.known.region} ist „${preferred}“ im Profil naheliegend; „${alternative}“ bleibt eine legitime Variante und ist kein Normfehler.`,
      reviewQuestion: 'Soll der Text aus Konsistenzgründen einer regionalen Variante folgen?',
      confidence: 'medium',
      requiredContext: ['region'],
      at,
    }))
  })
  return {
    projectId: normalizedProjectId,
    textId: normalizedTextId,
    contextComplete: context.complete === true,
    missingContext: clone(context.missing || []),
    skippedFamilies: context.known?.genre ? [] : ['register', 'anti-slop'],
    diagnostics,
    analyzedAt: at,
  }
}

export function orthographyRules() {
  return ORTHOGRAPHY_RULES.map(rule => ({ id: rule.id, message: rule.message }))
}
