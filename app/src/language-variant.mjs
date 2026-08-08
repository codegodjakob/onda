// Der Wächter über jede Umformulierung — PUR, node-testbar, kein DOM.
//
// Die Frage: Sagt der neue Satz noch dasselbe wie der alte? Verglichen werden Verneinung,
// Einschränkungswörter, Zahlen, Belege, Zitate, Verweise, geschützte Begriffe und die
// Stimme. Weicht auch nur eines ab, gilt der Vorschlag als abgelehnt, und der Grund wird
// beim Namen genannt.
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js), aufgerufen aus orthography.mjs.
function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function requiredText(value, label) {
  const result = typeof value === 'string' ? value.trim() : ''
  if (!result) throw new TypeError(`${label} is required`)
  return result
}

function normalizedMatches(value, pattern) {
  return (String(value || '').match(pattern) || [])
    .map(item => item.replace(/\s+/g, ' ').trim().toLocaleLowerCase('de-DE'))
    .sort()
}

function equalLists(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function negations(value) {
  return normalizedMatches(value, /\b(?:nicht|kein(?:e|en|er|es|em)?|nie|ohne)\b/giu)
}

function quantities(value) {
  return normalizedMatches(value, /\b\d+(?:[.,]\d+)?\s*(?:%|Prozent|kg|g|km|m|cm|ms|s|Euro|€)?\b/giu)
}

function citations(value) {
  return normalizedMatches(value, /\([^)]*\b(?:19|20)\d{2}[a-z]?\b[^)]*\)|\[\d+(?:\s*,\s*\d+)*\]/gu)
}

function modality(value) {
  return normalizedMatches(
    value,
    /\b(?:muss|müssen|kann|können|könnte|könnten|darf|dürfen|soll|sollen|wird|werden|garantiert|immer|nie|vielleicht|möglicherweise)\b/giu,
  )
}

function quotations(value) {
  return normalizedMatches(value, /„[^“\n]+“|»[^«\n]+«|"[^"\n]+"/gu)
}

function links(value) {
  return normalizedMatches(value, /\b(?:https?:\/\/|www\.)[^\s<>"'»“]+/giu)
}

function optionalListEqual(left, right, field) {
  const leftHas = Array.isArray(left?.[field])
  const rightHas = Array.isArray(right?.[field])
  if (!leftHas && !rightHas) return true
  return equalLists(
    (left?.[field] || []).map(value => String(value).trim()).sort(),
    (right?.[field] || []).map(value => String(value).trim()).sort(),
  )
}

function optionalTextEqual(left, right, field) {
  const leftValue = typeof left?.[field] === 'string' ? left[field].trim() : ''
  const rightValue = typeof right?.[field] === 'string' ? right[field].trim() : ''
  if (!leftValue && !rightValue) return true
  return leftValue === rightValue
}

const SAFE_LEXICAL_GROUPS = Object.freeze([
  ['senkte', 'verringerte', 'reduzierte'],
  ['sank', 'verringerte-sich', 'reduzierte-sich'],
  ['steigert', 'erhöht', 'vergrößert'],
  ['stieg', 'erhöhte-sich', 'vergrößerte-sich'],
])

function lexicalTokens(value) {
  return [...String(value || '').matchAll(/[\p{L}\p{M}]+(?:-[\p{L}\p{M}]+)*/gu)]
    .map(match => match[0].toLocaleLowerCase('de-DE'))
}

function sameSafeGroup(left, right) {
  return SAFE_LEXICAL_GROUPS.some(group => group.includes(left) && group.includes(right))
}

function transformationPairs(value) {
  return (Array.isArray(value) ? value : [])
    .filter(pair => Array.isArray(pair) && pair.length === 2)
    .map(pair => pair.map(token => String(token).trim().toLocaleLowerCase('de-DE')))
}

function provenSafeTransformation(originalText, candidateText, safeTransformations) {
  const originalTokens = lexicalTokens(originalText)
  const candidateTokens = lexicalTokens(candidateText)
  if (originalTokens.length !== candidateTokens.length) return false
  const explicitPairs = transformationPairs(safeTransformations)
  return originalTokens.every((token, index) => {
    const candidateToken = candidateTokens[index]
    if (token === candidateToken) return true
    if (sameSafeGroup(token, candidateToken)) return true
    return explicitPairs.some(([left, right]) => (
      (left === token && right === candidateToken)
      || (right === token && left === candidateToken)
    ))
  })
}

const REFERENT_STOPWORDS = new Set([
  'der', 'die', 'das', 'ein', 'eine', 'im', 'in', 'am', 'an', 'zum', 'zur',
  'diese', 'dieser', 'dieses', 'es', 'sie', 'er', 'wir',
])

function factAssociations(value) {
  const map = {}
  String(value || '')
    .split(/[.;:!?]+|\b(?:aber|hingegen|während)\b/iu)
    .map(segment => segment.trim())
    .filter(Boolean)
    .forEach(segment => {
      const referents = [...segment.matchAll(/\b[\p{Lu}][\p{L}\p{M}-]*\b/gu)]
        .map(match => match[0].toLocaleLowerCase('de-DE'))
        .filter(term => !REFERENT_STOPWORDS.has(term))
      const facts = {
        negation: negations(segment),
        modality: modality(segment),
        quantities: quantities(segment),
      }
      referents.forEach(referent => {
        if (!map[referent]) map[referent] = []
        map[referent].push(facts)
      })
    })
  Object.values(map).forEach(entries => entries.sort((left, right) => (
    JSON.stringify(left).localeCompare(JSON.stringify(right))
  )))
  return map
}

export function evaluateLanguageVariant({
  projectId,
  original,
  candidate,
  protectedTerms = [],
  protectedIntentions = [],
  safeTransformations = [],
}) {
  requiredText(projectId, 'Language variant project')
  if (!isObject(original) || !isObject(candidate)) throw new TypeError('Language variant texts are required')
  const originalText = requiredText(original.text, 'Language variant original')
  const candidateText = requiredText(candidate.text, 'Language variant candidate')
  const checks = {
    negation: equalLists(negations(originalText), negations(candidateText)),
    modality: equalLists(modality(originalText), modality(candidateText)),
    quantities: equalLists(quantities(originalText), quantities(candidateText)),
    'referent-associations': JSON.stringify(factAssociations(originalText))
      === JSON.stringify(factAssociations(candidateText)),
    'proven-safe-transformation': provenSafeTransformation(
      originalText,
      candidateText,
      safeTransformations,
    ),
    citations: equalLists(citations(originalText), citations(candidateText)),
    quotations: equalLists(quotations(originalText), quotations(candidateText)),
    links: equalLists(links(originalText), links(candidateText)),
    limitations: optionalListEqual(original, candidate, 'limitations'),
    'named-referents': optionalListEqual(original, candidate, 'namedReferents'),
    'claim-scope': optionalTextEqual(original, candidate, 'claimScope'),
    voice: optionalTextEqual(original, candidate, 'voiceSignature'),
    'protected-terms': (Array.isArray(protectedTerms) ? protectedTerms : []).every(term => (
      candidateText.includes(String(term))
    )),
    'protected-intentions': (Array.isArray(protectedIntentions) ? protectedIntentions : []).every(intention => (
      candidateText.includes(String(intention))
    )),
    'evidence-status': requiredText(original.evidenceStatus, 'Language variant evidence status')
      === requiredText(candidate.evidenceStatus, 'Language variant candidate evidence status'),
    structure: requiredText(original.structureSignature, 'Language variant structure')
      === requiredText(candidate.structureSignature, 'Language variant candidate structure'),
  }
  const reasons = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name)
  let status = reasons.length ? 'rejected' : 'accepted'
  if (!reasons.length && candidate.direction === 'argument') status = 'new-direction'
  return {
    projectId,
    status,
    checks,
    reasons,
    direction: candidate.direction === 'argument' ? 'argument' : 'language',
  }
}
