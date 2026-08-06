import {
  ANNOTATION_SECTIONS,
  COMPONENT_DEFINITIONS,
  DIALOG_FAMILIES,
  PALETTE,
  PHASE_DEFINITIONS,
  PLUGIN_ORIGIN,
  RADIUS_TOKENS,
  SECTION_DEFINITIONS,
  TARGET_DOCUMENT_NAME,
  TARGET_FILE_KEY,
  TARGET_PAGE_NAME,
  TYPE_SCALE,
  TYPE_WEIGHTS,
} from './definitions.mjs'

export function buildDesignPlan() {
  return {
    sections: SECTION_DEFINITIONS,
    annotations: ANNOTATION_SECTIONS,
    dialogs: DIALOG_FAMILIES,
    components: COMPONENT_DEFINITIONS,
    phases: PHASE_DEFINITIONS,
    palette: PALETTE,
    radii: RADIUS_TOKENS,
    typography: { family: 'ABC Diatype', sizes: TYPE_SCALE, weights: TYPE_WEIGHTS },
  }
}

export function validateDesignPlan(plan) {
  const errors = []
  const names = plan.sections.map(section => section.name)
  if (names.length !== 39) errors.push(`Expected 39 sections, got ${names.length}`)
  if (new Set(names).size !== names.length) errors.push('Section names must be unique')
  if (plan.annotations.length !== 29) errors.push(`Expected 29 annotations, got ${plan.annotations.length}`)
  if (plan.dialogs.length !== 7) errors.push(`Expected 7 dialog families, got ${plan.dialogs.length}`)
  if (plan.annotations.some(annotation => annotation.views.length !== 6)) errors.push('Every annotation needs six views')
  if (Object.values(plan.palette).some(color => !isGrayColor(color))) errors.push('Palette contains a non-gray color')
  if (plan.radii.some(radius => !isValidRadius(radius.value, radius.geometry))) errors.push('Radius policy is invalid')
  return errors
}

export function computeOndaOrigin(children, persistedOrigin) {
  if (Number.isFinite(persistedOrigin)) return persistedOrigin
  const maxExistingRight = children.reduce((max, child) => {
    const right = Number(child.x || 0) + Number(child.width || 0)
    return Math.max(max, right)
  }, 0)
  return Math.ceil((maxExistingRight + 2000) / 100) * 100
}

export function validateTargetContext({ fileKey, documentName, pageName }) {
  if (pageName !== TARGET_PAGE_NAME) {
    return { ok: false, fallback: !fileKey, warning: `Falsche Seite: erwartet „${TARGET_PAGE_NAME}“.` }
  }
  if (fileKey) {
    return fileKey === TARGET_FILE_KEY
      ? { ok: true, fallback: false, warning: '' }
      : { ok: false, fallback: false, warning: 'Falsche Figma-Datei: der Dateischlüssel stimmt nicht mit „Claude Code“ überein.' }
  }
  if (documentName !== TARGET_DOCUMENT_NAME) {
    return { ok: false, fallback: true, warning: `Dateischlüssel nicht verfügbar und Dokumentname ist nicht „${TARGET_DOCUMENT_NAME}“.` }
  }
  return {
    ok: true,
    fallback: true,
    warning: 'Dateischlüssel nicht verfügbar; Ziel über „Claude Code“ und „Page 1“ geprüft.',
  }
}

export function canReuseOwnedNode(node, baselineIds = new Set()) {
  return node?.owner === PLUGIN_ORIGIN && (!baselineIds.has(node.id) || node.owner === PLUGIN_ORIGIN)
}

export function protectedChildIds({ nodeType, children, baselineIds = new Set() }) {
  if (nodeType !== 'PAGE') return children.map(child => child.id)
  return children
    .filter(child => baselineIds.has(child.id) || child.owner !== PLUGIN_ORIGIN)
    .map(child => child.id)
}

export function isGrayColor(color) {
  if (!color || ![color.r, color.g, color.b].every(Number.isFinite)) return false
  return color.r === color.g && color.g === color.b
}

export function isValidRadius(value, geometry = 'RECTANGLE') {
  if (![0, 4, 6, 8, 999].includes(value)) return false
  return value !== 999 || geometry === 'ELLIPSE'
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]))
  }
  return value
}

function rotateRight(value, amount) {
  return (value >>> amount) | (value << (32 - amount))
}

export function sha256Hex(input) {
  const text = unescape(encodeURIComponent(String(input)))
  const words = []
  for (let index = 0; index < text.length; index += 1) {
    words[index >> 2] = (words[index >> 2] || 0) | text.charCodeAt(index) << (24 - (index % 4) * 8)
  }
  const bitLength = text.length * 8
  words[bitLength >> 5] = (words[bitLength >> 5] || 0) | 0x80 << (24 - bitLength % 32)
  words[((bitLength + 64 >> 9) << 4) + 15] = bitLength

  const constants = []
  const initial = []
  let prime = 2
  while (constants.length < 64) {
    let isPrime = true
    for (let factor = 2; factor * factor <= prime; factor += 1) {
      if (prime % factor === 0) { isPrime = false; break }
    }
    if (isPrime) {
      if (initial.length < 8) initial.push((Math.sqrt(prime) % 1 * 0x100000000) | 0)
      constants.push((Math.cbrt(prime) % 1 * 0x100000000) | 0)
    }
    prime += 1
  }

  const hash = initial.slice()
  for (let offset = 0; offset < words.length; offset += 16) {
    const schedule = new Array(64)
    for (let index = 0; index < 64; index += 1) {
      if (index < 16) schedule[index] = words[offset + index] | 0
      else {
        const x = schedule[index - 15]
        const y = schedule[index - 2]
        const sigma0 = rotateRight(x, 7) ^ rotateRight(x, 18) ^ x >>> 3
        const sigma1 = rotateRight(y, 17) ^ rotateRight(y, 19) ^ y >>> 10
        schedule[index] = (schedule[index - 16] + sigma0 + schedule[index - 7] + sigma1) | 0
      }
    }
    let [a, b, c, d, e, f, g, h] = hash
    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)
      const choose = e & f ^ ~e & g
      const temp1 = (h + sum1 + choose + constants[index] + schedule[index]) | 0
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)
      const majority = a & b ^ a & c ^ b & c
      const temp2 = (sum0 + majority) | 0
      h = g; g = f; f = e; e = (d + temp1) | 0; d = c; c = b; b = a; a = (temp1 + temp2) | 0
    }
    hash[0] = (hash[0] + a) | 0
    hash[1] = (hash[1] + b) | 0
    hash[2] = (hash[2] + c) | 0
    hash[3] = (hash[3] + d) | 0
    hash[4] = (hash[4] + e) | 0
    hash[5] = (hash[5] + f) | 0
    hash[6] = (hash[6] + g) | 0
    hash[7] = (hash[7] + h) | 0
  }
  return hash.map(value => (value >>> 0).toString(16).padStart(8, '0')).join('')
}

export function hashBaselineRecords(records) {
  return sha256Hex(JSON.stringify(canonicalize(records)))
}

export function orderRecordsByBaselineIds(records, baselineIds) {
  const byId = new Map(records.map(record => [record.id, record]))
  return baselineIds.map(id => byId.get(id)).filter(Boolean)
}

export function compareBaselineState(baseline, current) {
  const baselineHash = hashBaselineRecords(baseline.records)
  const currentBaselineHash = hashBaselineRecords(current.records)
  const currentById = new Map(current.records.map(record => [record.id, record]))
  const baselineMismatches = baseline.records
    .filter(record => {
      const currentRecord = currentById.get(record.id)
      return !currentRecord || hashBaselineRecords([record]) !== hashBaselineRecords([currentRecord])
    })
    .map(record => record.id)
  const pageInvariant = hashBaselineRecords(baseline.pages) === hashBaselineRecords(current.pages)
  return {
    preservedBaselineHash: baselineHash === currentBaselineHash && baselineMismatches.length === 0,
    baselineHash,
    currentBaselineHash,
    baselineMismatches,
    pageInvariant,
  }
}

function duplicates(values) {
  const seen = new Set()
  const repeated = new Set()
  for (const value of values) {
    if (seen.has(value)) repeated.add(value)
    seen.add(value)
  }
  return [...repeated].sort()
}

export function buildVerificationReport(snapshot) {
  const requiredNames = new Set(SECTION_DEFINITIONS.map(section => section.name))
  const presentNames = new Set(snapshot.sectionNames || [])
  return {
    pageCount: Number(snapshot.pageCount || 0),
    sectionCount: (snapshot.sectionNames || []).length,
    missingSections: [...requiredNames].filter(name => !presentNames.has(name)),
    annotationCount: new Set(snapshot.annotationKinds || []).size,
    dialogFamilyCount: new Set(snapshot.dialogFamilies || []).size,
    nonGrayPaints: (snapshot.paints || []).filter(color => !isGrayColor(color)).length,
    invalidRadii: (snapshot.radii || []).filter(radius => !isValidRadius(radius.value, radius.geometry)).length,
    duplicateNames: duplicates(snapshot.topLevelNames || []),
    preservedBaselineTopLevelCount: Math.min(
      Number(snapshot.baselineTopLevelCount || 0),
      Number(snapshot.preservedTopLevelCount || 0),
    ),
    preservedBaselineHash: Boolean(snapshot.baselineHash)
      && snapshot.baselineHash === snapshot.currentBaselineHash
      && (snapshot.baselineMismatches || []).length === 0,
    baselineMismatches: snapshot.baselineMismatches || [],
    pageInvariant: hashBaselineRecords(snapshot.baselinePages || []) === hashBaselineRecords(snapshot.currentPages || []),
  }
}
