// Die Zitatprüfung, deterministisch und ohne Modell. Drei Fragen: Stimmt ein direktes Zitat
// zeichengenau mit der verifizierten Fundstelle überein (nach Angleich von Anführungszeichen
// und Leerraum)? Meint die Quellenangabe wirklich das geprüfte Werk — Ausgabe, Fassung,
// Bestätigung? Und stimmen die Belege im Text mit dem Literaturverzeichnis und dem
// geforderten Stil zusammen? Eine Paraphrase darf außerdem nicht stärker behaupten als die
// Quelle. Rein rechnend, kein DOM, node-testbar.
//
// Gehört zur Browser-App (src/editor.js): benutzt von final-audit.mjs.
const STRENGTH = Object.freeze({
  descriptive: 0,
  associational: 1,
  correlational: 1,
  predictive: 2,
  causal: 3,
  universal: 4,
})

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function normalizeText(value) {
  return text(value)
    .replace(/[„“”]/g, '"')
    .replace(/[‚‘’]/g, "'")
    .replace(/\s+/g, ' ')
}

function finding(code, message, locator) {
  return {
    code,
    severity: 'critical',
    message,
    locatorId: locator?.id || null,
    locator: clone(locator?.address || null),
  }
}

export function auditQuotationOrParaphrase(input) {
  const locator = input?.locator
  if (!locator || locator.verification?.status !== 'verified') {
    return [finding('source-locator-unverified', 'Die Fundstelle ist nicht am Original verifiziert.', locator)]
  }

  const findings = []
  if (input.kind === 'quote') {
    if (normalizeText(input.text) !== normalizeText(locator.excerpt)) {
      findings.push(finding('quote-mismatch', 'Das direkte Zitat weicht von der verifizierten Fundstelle ab.', locator))
    }
    if (input.sourceType === 'pdf' && locator.kind !== 'page') {
      findings.push(finding('quote-page-missing', 'Das direkte Zitat aus der paginierten Quelle benötigt eine Seitenfundstelle.', locator))
    }
    return findings
  }

  if (input.kind === 'paraphrase') {
    const requestedStrength = STRENGTH[input.strength] ?? 0
    const allowedStrength = STRENGTH[locator.allowedStrength] ?? 0
    if (requestedStrength > allowedStrength) {
      findings.push(finding('paraphrase-strength-overreach', 'Die Paraphrase behauptet mehr, als die Fundstelle trägt.', locator))
    }
    const supportedScope = new Set((locator.supportedScope || []).map(normalizeText))
    const outsideScope = (input.scope || []).map(normalizeText).filter(scope => scope && !supportedScope.has(scope))
    if (outsideScope.length) {
      findings.push(finding('paraphrase-scope-overreach', `Die Reichweite ist nicht belegt: ${outsideScope.join(', ')}.`, locator))
    }
    return findings
  }

  return [finding('citation-kind-unknown', 'Zitatart ist unbekannt.', locator)]
}

function comparable(value) {
  if (Array.isArray(value)) return value.map(entry => comparable(entry)).join('|')
  if (value === null || value === undefined) return ''
  return String(value).trim().toLocaleLowerCase('de')
}

export function verifyBibliographicIdentity({ metadata = {}, confirmations = [], versions = [] } = {}) {
  const result = {}
  const conflicts = []
  Object.entries(metadata || {}).forEach(([field, candidate]) => {
    const base = candidate && typeof candidate === 'object' && !Array.isArray(candidate)
      ? clone(candidate)
      : { value: clone(candidate), status: candidate == null ? 'unknown' : 'user-provided' }
    const matches = confirmations.filter(confirmation => confirmation?.field === field)
    if (!matches.length) {
      base.status = base.value === null || base.value === undefined || base.value === '' ? 'unknown' : (base.status || 'user-provided')
      result[field] = base
      return
    }
    const matching = matches.find(confirmation => comparable(confirmation.value) === comparable(base.value))
    if (matching) {
      base.status = 'confirmed'
      base.evidence = clone(matching.evidence || null)
    } else {
      base.status = 'conflict'
      base.conflictingValues = matches.map(confirmation => ({
        value: clone(confirmation.value),
        evidence: clone(confirmation.evidence || null),
      }))
      conflicts.push({ field, storedValue: clone(base.value), candidates: clone(base.conflictingValues) })
    }
    result[field] = base
  })
  return { metadata: result, conflicts, versions: clone(versions || []) }
}

export function auditCitationConsistency({ inText = [], bibliography = [], requiredStyle = '' } = {}) {
  const findings = []
  const citationsByKey = new Map()
  for (const citation of inText) {
    const key = text(citation?.key)
    if (!key) continue
    const list = citationsByKey.get(key) || []
    list.push(citation)
    citationsByKey.set(key, list)
  }
  const entriesByKey = new Map()
  for (const entry of bibliography) {
    const key = text(entry?.key)
    if (!key) continue
    const list = entriesByKey.get(key) || []
    list.push(entry)
    entriesByKey.set(key, list)
  }

  citationsByKey.forEach((citations, key) => {
    if (entriesByKey.has(key)) return
    citations.forEach(citation => findings.push({
      code: 'bibliography-missing',
      severity: 'critical',
      message: `Für ${key} fehlt ein Literaturverzeichniseintrag.`,
      locator: clone(citation.locator || null),
    }))
  })
  entriesByKey.forEach((entries, key) => {
    if (entries.length > 1) {
      entries.slice(1).forEach(entry => findings.push({
        code: 'bibliography-duplicate',
        severity: 'error',
        message: `${key} steht mehrfach im Literaturverzeichnis.`,
        locator: clone(entry.locator || null),
      }))
    }
    entries.forEach(entry => {
      if (!citationsByKey.has(key) && entry.cited !== true) {
        findings.push({
          code: 'bibliography-orphan',
          severity: 'warning',
          message: `${key} wird im Text nicht zitiert.`,
          locator: clone(entry.locator || null),
        })
      }
      if (requiredStyle && entry.style !== requiredStyle) {
        findings.push({
          code: 'bibliography-style',
          severity: 'warning',
          message: `${key} weicht vom geforderten Stil ${requiredStyle} ab.`,
          locator: clone(entry.locator || null),
        })
      }
    })
  })
  return findings
}
