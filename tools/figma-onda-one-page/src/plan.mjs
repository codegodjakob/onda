import {
  ANNOTATION_SECTIONS,
  COMPONENT_DEFINITIONS,
  DIALOG_FAMILIES,
  FOUNDATION_EXPECTATIONS,
  PALETTE,
  PHASE_DEFINITIONS,
  PLUGIN_ORIGIN,
  RADIUS_TOKENS,
  SEMANTIC_COLOR_ROLES,
  SECTION_DEFINITIONS,
  SPACING_TOKENS,
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
  function furthestRight(node) {
    const own = node?.absoluteRenderBounds
      ? Number(node.absoluteRenderBounds.x || 0) + Number(node.absoluteRenderBounds.width || 0)
      : Number(node?.x || 0) + Number(node?.width || 0)
    return Math.max(own, ...(node?.children || []).map(furthestRight))
  }
  const maxExistingRight = Math.max(0, ...children.map(furthestRight))
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
    ok: false,
    readOnlyOk: true,
    fallback: true,
    warning: 'Dateischlüssel nicht verfügbar. „Claude Code“ und „Page 1“ sind nur ein Lesehinweis; Inspect bleibt read-only und Mutationen sind deaktiviert.',
  }
}

export function authorizeMutation(target) {
  return target?.ok && !target.fallback
    ? { ok: true, manual: false, warning: '' }
    : { ok: false, manual: false, warning: target?.warning || 'Mutation erfordert den exakten privaten Dateischlüssel.' }
}

export function canReuseOwnedNode(node, baselineIds = new Set()) {
  return node?.owner === PLUGIN_ORIGIN && (!baselineIds.has(node.id) || node.owner === PLUGIN_ORIGIN)
}

export function selectOwnedEntity(entities, name, kind) {
  const matching = entities.filter(entity => entity.name === name)
  if (matching.length > 1) throw new Error(`Mehrdeutige ${kind}-Namenskollision: ${name}`)
  if (!matching.length) return null
  if (matching[0].owner !== PLUGIN_ORIGIN) throw new Error(`Ungeschützte ${kind}-Namenskollision: ${name}`)
  return matching[0]
}

export function foundationSwatchLabelToken(layer, paintToken) {
  const paint = PALETTE[paintToken]
  if (!paint) throw new Error(`Unbekannter Foundation-Farbwert: ${paintToken}`)
  const darkSemantic = layer === 'semantic-dark'
  const collectionName = darkSemantic ? 'Onda · Semantic · Dark' : 'Onda · Semantic · Light'
  const darkPaint = paint.r < 0.55
  return {
    collectionName,
    variableName: darkSemantic === darkPaint ? 'color/text' : 'color/on-inverted',
  }
}

function foundationTokenSlug(value) {
  return value.replaceAll(' · ', '-').replaceAll('/', '-').replaceAll(' ', '-').toLowerCase()
}

export function foundationCodeSyntax(collectionName, variableName) {
  const prefix = {
    'Onda · Primitive': 'primitive',
    'Onda · Dimension': 'dimension',
    'Onda · Semantic · Light': 'semantic-light',
    'Onda · Semantic · Dark': 'semantic-dark',
    'Onda · Typography': 'typography',
  }[collectionName]
  if (!prefix) throw new Error(`Unbekannte Foundation-Collection: ${collectionName}`)
  return `var(--${prefix}-${foundationTokenSlug(variableName)})`
}

export function foundationVariableDefinitions() {
  const definitions = []
  function add(collectionName, modeName, name, resolvedType, scopes, value) {
    definitions.push({
      collectionName,
      modeName,
      name,
      resolvedType,
      scopes: [...scopes],
      codeSyntax: foundationCodeSyntax(collectionName, name),
      value,
    })
  }
  for (const [name, value] of Object.entries(PALETTE)) add('Onda · Primitive', 'Value', name, 'COLOR', [], value)
  for (const role of SEMANTIC_COLOR_ROLES) {
    add('Onda · Semantic · Light', 'Light', role.name, 'COLOR', role.scopes, { alias: ['Onda · Primitive', role.light] })
    add('Onda · Semantic · Dark', 'Dark', role.name, 'COLOR', role.scopes, { alias: ['Onda · Primitive', role.dark] })
  }
  for (const token of SPACING_TOKENS) add('Onda · Dimension', 'Value', token.name, 'FLOAT', ['GAP'], token.value)
  for (const token of RADIUS_TOKENS) add('Onda · Dimension', 'Value', token.name, 'FLOAT', ['CORNER_RADIUS'], token.value)
  for (const scale of TYPE_SCALE) add('Onda · Typography', 'Value', `font-size/${scale.size}`, 'FLOAT', ['FONT_SIZE'], scale.size)
  for (const weight of TYPE_WEIGHTS) add('Onda · Typography', 'Value', `font-weight/${weight}`, 'FLOAT', ['FONT_WEIGHT'], weight)
  return definitions
}

function sameArray(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((value, index) => value === expected[index])
}

function sameObject(actual, expected) {
  if (!actual || typeof actual !== 'object' || Array.isArray(actual)) return false
  const actualKeys = Object.keys(actual).sort()
  const expectedKeys = Object.keys(expected).sort()
  return sameArray(actualKeys, expectedKeys)
    && actualKeys.every(key => {
      const left = actual[key]
      const right = expected[key]
      return right && typeof right === 'object' ? sameObject(left, right) : left === right
    })
}

function strictSingle(items, predicate, errors, label) {
  const matching = items.filter(predicate)
  if (matching.length !== 1) errors.push(`${label}: erwartet 1, gefunden ${matching.length}`)
  return matching.length === 1 ? matching[0] : null
}

export function validateFoundationEvidence(evidence = {}) {
  const errors = []
  const collections = Array.isArray(evidence.collections) ? evidence.collections : []
  const variables = Array.isArray(evidence.variables) ? evidence.variables : []
  const expectedCollections = Object.entries(FOUNDATION_EXPECTATIONS.collections)
  if (collections.length !== expectedCollections.length) errors.push(`Collections: erwartet ${expectedCollections.length}, gefunden ${collections.length}`)
  const collectionByName = new Map()
  for (const [name, expectation] of expectedCollections) {
    const collection = strictSingle(collections, item => item.name === name, errors, `Collection ${name}`)
    if (!collection) continue
    collectionByName.set(name, collection)
    if (collection.owner !== PLUGIN_ORIGIN) errors.push(`Collection ${name}: owner`)
    if (!Array.isArray(collection.modes) || collection.modes.length !== 1 || collection.modes[0].name !== expectation.mode) errors.push(`Collection ${name}: mode`)
  }
  if (new Set(collections.map(item => item.id)).size !== collections.length) errors.push('Collections: duplicate ids')

  const definitions = foundationVariableDefinitions()
  if (variables.length !== definitions.length) errors.push(`Variables: erwartet ${definitions.length}, gefunden ${variables.length}`)
  if (new Set(variables.map(item => item.id)).size !== variables.length) errors.push('Variables: duplicate ids')
  const variableByKey = new Map()
  for (const definition of definitions) {
    const key = `${definition.collectionName}\u0000${definition.name}`
    const variable = strictSingle(variables, item => `${item.collectionName}\u0000${item.name}` === key, errors, `Variable ${definition.collectionName}/${definition.name}`)
    if (!variable) continue
    variableByKey.set(key, variable)
    const collection = collectionByName.get(definition.collectionName)
    if (variable.collectionId !== collection?.id) errors.push(`Variable ${key}: collection id`)
    if (variable.owner !== PLUGIN_ORIGIN) errors.push(`Variable ${key}: owner`)
    if (variable.resolvedType !== definition.resolvedType) errors.push(`Variable ${key}: type`)
    if (!sameArray([...(variable.scopes || [])].sort(), [...definition.scopes].sort())) errors.push(`Variable ${key}: scopes`)
    if (variable.codeSyntax?.WEB !== definition.codeSyntax) errors.push(`Variable ${key}: code syntax`)
    if (variable.modeId !== collection?.modes?.[0]?.modeId) errors.push(`Variable ${key}: mode id`)
    if (definition.value?.alias) {
      const aliasKey = `${definition.value.alias[0]}\u0000${definition.value.alias[1]}`
      const expectedAlias = variables.find(item => `${item.collectionName}\u0000${item.name}` === aliasKey)
      if (variable.value?.type !== 'VARIABLE_ALIAS' || variable.value.id !== expectedAlias?.id) errors.push(`Variable ${key}: alias`)
    } else if (typeof definition.value === 'object') {
      if (!sameObject(variable.value, definition.value)) errors.push(`Variable ${key}: value`)
    } else if (variable.value !== definition.value) errors.push(`Variable ${key}: value`)
  }

  function variableId(collectionName, name) {
    return variableByKey.get(`${collectionName}\u0000${name}`)?.id
  }
  const expectedSwatches = []
  for (const name of Object.keys(PALETTE)) {
    const labelToken = foundationSwatchLabelToken('primitive', name)
    expectedSwatches.push({
      name: `Swatch / ${name}`,
      parentName: 'Foundations / Graustufen',
      variableId: variableId('Onda · Primitive', name),
      labelName: `Swatch / ${name} / Label`,
      labelVariableId: variableId(labelToken.collectionName, labelToken.variableName),
    })
  }
  for (const [collectionName, layer, valueKey, parentName] of [
    ['Onda · Semantic · Light', 'semantic-light', 'light', 'Foundations / Semantic Light'],
    ['Onda · Semantic · Dark', 'semantic-dark', 'dark', 'Foundations / Semantic Dark'],
  ]) {
    for (const role of SEMANTIC_COLOR_ROLES) {
      const name = `Swatch / ${layer} / ${role.name}`
      const labelToken = foundationSwatchLabelToken(layer, role[valueKey])
      expectedSwatches.push({
        name,
        parentName,
        variableId: variableId(collectionName, role.name),
        labelName: `${name} / Label`,
        labelVariableId: variableId(labelToken.collectionName, labelToken.variableName),
      })
    }
  }
  const swatches = Array.isArray(evidence.swatches) ? evidence.swatches : []
  if (swatches.length !== expectedSwatches.length) errors.push(`Swatches: erwartet ${expectedSwatches.length}, gefunden ${swatches.length}`)
  if (new Set(swatches.map(item => item.nodeId)).size !== swatches.length) errors.push('Swatches: duplicate node ids')
  for (const expected of expectedSwatches) {
    const swatch = strictSingle(swatches, item => item.name === expected.name, errors, `Swatch ${expected.name}`)
    if (!swatch) continue
    if (swatch.type !== 'FRAME' || swatch.parentName !== expected.parentName) errors.push(`Swatch ${expected.name}: structure`)
    if (swatch.fillVariableId !== expected.variableId) errors.push(`Swatch ${expected.name}: fill binding`)
    if (swatch.labelName !== expected.labelName || swatch.labelFillVariableId !== expected.labelVariableId) errors.push(`Swatch ${expected.name}: label binding`)
  }

  const spacingBars = Array.isArray(evidence.spacingBars) ? evidence.spacingBars : []
  if (spacingBars.length !== SPACING_TOKENS.length) errors.push(`Spacing: erwartet ${SPACING_TOKENS.length}, gefunden ${spacingBars.length}`)
  if (new Set(spacingBars.map(item => item.nodeId)).size !== spacingBars.length) errors.push('Spacing: duplicate node ids')
  for (const token of SPACING_TOKENS) {
    const name = `Spacing Bar / ${token.value}`
    const bar = strictSingle(spacingBars, item => item.name === name, errors, `Spacing ${name}`)
    if (!bar) continue
    if (bar.type !== 'RECTANGLE' || bar.parentName !== `Spacing / ${token.value}` || bar.containerName !== 'Foundations / Spacing') errors.push(`Spacing ${name}: structure`)
    if (bar.width !== token.value) errors.push(`Spacing ${name}: value`)
    if (bar.widthVariableId !== variableId('Onda · Dimension', token.name)) errors.push(`Spacing ${name}: binding`)
  }

  const radiusSamples = Array.isArray(evidence.radiusSamples) ? evidence.radiusSamples : []
  if (radiusSamples.length !== RADIUS_TOKENS.length) errors.push(`Radius: erwartet ${RADIUS_TOKENS.length}, gefunden ${radiusSamples.length}`)
  if (new Set(radiusSamples.map(item => item.nodeId)).size !== radiusSamples.length) errors.push('Radius: duplicate node ids')
  for (const token of RADIUS_TOKENS) {
    const name = `Radius / ${token.value}`
    const sample = strictSingle(radiusSamples, item => item.name === name, errors, `Radius ${name}`)
    if (!sample) continue
    const tokenId = variableId('Onda · Dimension', token.name)
    if (sample.type !== token.geometry || sample.parentName !== 'Foundations / Radien') errors.push(`Radius ${name}: structure`)
    if (token.geometry === 'ELLIPSE') {
      if (sample.width !== 112 || sample.height !== 112 || sample.boundVariableIds?.maxWidth !== tokenId || sample.boundVariableIds?.maxHeight !== tokenId) errors.push(`Radius ${name}: ellipse mapping`)
    } else {
      const fields = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']
      if (sample.cornerRadius !== token.value || !fields.every(field => sample.boundVariableIds?.[field] === tokenId)) errors.push(`Radius ${name}: rectangle binding`)
    }
  }

  const textStyles = Array.isArray(evidence.textStyles) ? evidence.textStyles : []
  const textSpecimens = Array.isArray(evidence.textSpecimens) ? evidence.textSpecimens : []
  if (textStyles.length !== FOUNDATION_EXPECTATIONS.textStyles.length) errors.push(`Text styles: erwartet ${FOUNDATION_EXPECTATIONS.textStyles.length}, gefunden ${textStyles.length}`)
  if (textSpecimens.length !== FOUNDATION_EXPECTATIONS.textStyles.length) errors.push(`Text specimens: erwartet ${FOUNDATION_EXPECTATIONS.textStyles.length}, gefunden ${textSpecimens.length}`)
  if (new Set(textStyles.map(item => item.id)).size !== textStyles.length) errors.push('Text styles: duplicate ids')
  if (new Set(textSpecimens.map(item => item.nodeId)).size !== textSpecimens.length) errors.push('Text specimens: duplicate ids')
  for (const definition of FOUNDATION_EXPECTATIONS.textStyles) {
    const style = strictSingle(textStyles, item => item.name === definition.name, errors, `Text style ${definition.name}`)
    const specimen = strictSingle(textSpecimens, item => item.name === `Typografie / ${definition.role}`, errors, `Text specimen ${definition.role}`)
    if (!style) continue
    const sizeId = variableId('Onda · Typography', `font-size/${definition.size}`)
    const weightId = variableId('Onda · Typography', `font-weight/${definition.weight}`)
    if (style.owner !== PLUGIN_ORIGIN) errors.push(`Text style ${definition.name}: owner`)
    if (style.fontName?.family !== evidence.fontDecision?.family || style.fontName?.style !== evidence.fontDecision?.styles?.[definition.weight]) errors.push(`Text style ${definition.name}: font`)
    if (style.fontSize !== definition.size || style.lineHeight?.unit !== 'PIXELS' || style.lineHeight?.value !== definition.lineHeight) errors.push(`Text style ${definition.name}: metrics`)
    if (style.letterSpacing?.unit !== 'PIXELS' || style.letterSpacing?.value !== 0 || style.textCase !== 'ORIGINAL' || style.textDecoration !== 'NONE') errors.push(`Text style ${definition.name}: properties`)
    if (style.boundVariableIds?.fontSize !== sizeId || style.boundVariableIds?.fontWeight !== weightId) errors.push(`Text style ${definition.name}: variable mapping`)
    if (specimen && (specimen.type !== 'TEXT' || specimen.parentName !== 'Foundations / Typografie' || specimen.textStyleId !== style.id || specimen.boundVariableIds?.fontSize !== sizeId || specimen.boundVariableIds?.fontWeight !== weightId)) errors.push(`Text specimen ${definition.role}: link`)
  }

  const effectStyles = Array.isArray(evidence.effectStyles) ? evidence.effectStyles : []
  const effectConsumers = Array.isArray(evidence.effectConsumers) ? evidence.effectConsumers : []
  if (effectStyles.length !== 1) errors.push(`Effect styles: erwartet 1, gefunden ${effectStyles.length}`)
  const overlay = strictSingle(effectStyles, item => item.name === 'Onda/Shadow/Overlay', errors, 'Overlay effect style')
  if (overlay) {
    if (overlay.owner !== PLUGIN_ORIGIN) errors.push('Overlay effect style: owner')
    const effect = Array.isArray(overlay.effects) && overlay.effects.length === 1 ? overlay.effects[0] : null
    if (!effect || effect.type !== 'DROP_SHADOW' || !sameObject(effect.color, { r: 0, g: 0, b: 0, a: 0.16 }) || !sameObject(effect.offset, { x: 0, y: 8 }) || effect.radius !== 24 || effect.spread !== 0 || effect.visible !== true || effect.blendMode !== 'NORMAL') errors.push('Overlay effect style: properties')
    if (!effect || !isGrayColor(effect.color)) errors.push('Overlay effect style: monochrome')
    if (effectConsumers.length !== 1) errors.push(`Overlay consumers: erwartet 1, gefunden ${effectConsumers.length}`)
    const consumer = strictSingle(effectConsumers, item => item.name === 'Effect / Onda/Shadow/Overlay', errors, 'Overlay consumer')
    if (consumer && (consumer.type !== 'FRAME' || consumer.parentName !== 'Foundations / Effects' || consumer.effectStyleId !== overlay.id || !sameArray(consumer.fields, ['effectStyleId']))) errors.push('Overlay consumer: invalid')
  }
  return { valid: errors.length === 0, errors }
}

export function protectedChildIds({ nodeType, children, baselineIds = new Set() }) {
  if (nodeType !== 'PAGE') return children.map(child => child.id)
  return children
    .filter(child => baselineIds.has(child.id) || child.owner !== PLUGIN_ORIGIN)
    .map(child => child.id)
}

export function isGrayColor(color) {
  if (!color || ![color.r, color.g, color.b].every(Number.isFinite)) return false
  return Math.max(color.r, color.g, color.b) - Math.min(color.r, color.g, color.b) <= 0.002 + 1e-9
}

const FONT_STYLES = Object.freeze({
  400: Object.freeze(['Regular', 'Book', 'Normal']),
  500: Object.freeze(['Medium']),
  700: Object.freeze(['Bold']),
})

function stylesForFamily(fonts, family) {
  return new Set(fonts.filter(font => font.fontName.family === family).map(font => font.fontName.style))
}

function exactWeightStyles(fonts, family) {
  const available = stylesForFamily(fonts, family)
  const entries = TYPE_WEIGHTS.map(weight => [weight, FONT_STYLES[weight].find(style => available.has(style)) || null])
  return Object.fromEntries(entries)
}

export function selectFontDecision(fonts) {
  const abcStyles = exactWeightStyles(fonts, 'ABC Diatype')
  const missingAbc = TYPE_WEIGHTS.filter(weight => !abcStyles[weight])
  if (!missingAbc.length) {
    return { requestedFamily: 'ABC Diatype', family: 'ABC Diatype', styles: abcStyles, exact: true, warning: '' }
  }
  const families = [...new Set(fonts.map(font => font.fontName.family))]
  const fallbackFamily = ['Inter', ...families.filter(family => family !== 'ABC Diatype' && family !== 'Inter')]
    .find(family => TYPE_WEIGHTS.every(weight => exactWeightStyles(fonts, family)[weight]))
  if (!fallbackFamily) throw new Error(`Keine Schriftfamilie mit geeigneten Schnitten für 400, 500 und 700 gefunden; ABC Diatype fehlt: ${missingAbc.join(', ')}.`)
  return {
    requestedFamily: 'ABC Diatype',
    family: fallbackFamily,
    styles: exactWeightStyles(fonts, fallbackFamily),
    exact: false,
    warning: `ABC Diatype hat keine geeigneten Schnitte für ${missingAbc.join(', ')}. Sichtbarer System-Fallback: ${fallbackFamily}.`,
  }
}

function utf8ByteLength(value) {
  return unescape(encodeURIComponent(value)).length
}

export function buildBaselineShards(records, maxBytes = 79_000) {
  const shards = []
  let current = []
  for (const record of records) {
    const candidate = JSON.stringify([...current, record])
    if (utf8ByteLength(candidate) >= maxBytes) {
      if (!current.length) throw new Error(`Ein Baseline-Datensatz überschreitet das Shard-Limit von ${maxBytes} Bytes.`)
      shards.push(JSON.stringify(current))
      current = [record]
      if (utf8ByteLength(JSON.stringify(current)) >= maxBytes) throw new Error(`Ein Baseline-Datensatz überschreitet das Shard-Limit von ${maxBytes} Bytes.`)
    } else current.push(record)
  }
  if (current.length || !shards.length) shards.push(JSON.stringify(current))
  return shards
}

export function restoreBaselineShards(shards) {
  return shards.flatMap((shard, index) => {
    const value = JSON.parse(shard)
    if (!Array.isArray(value)) throw new Error(`Baseline-Shard ${index} ist ungültig.`)
    return value
  })
}

const REQUIRED_PHASES = Object.freeze([
  'inspect',
  'foundations',
  ...COMPONENT_DEFINITIONS.map(component => `component-${component.id}`),
  'core-views',
  ...Array.from({ length: 6 }, (_, index) => `annotations-${index + 1}`),
  'dialogs-and-secondary',
])

export function validatePhaseTransition(command, phases = {}) {
  if (command === 'inspect') return { ok: true, expected: 'inspect' }
  if (phases[command]?.status === 'success' && REQUIRED_PHASES.includes(command)) {
    const index = REQUIRED_PHASES.indexOf(command)
    const prerequisitesComplete = REQUIRED_PHASES.slice(0, index).every(id => phases[id]?.status === 'success')
    if (prerequisitesComplete) return { ok: true, expected: command, replay: true }
  }
  const next = REQUIRED_PHASES.find(id => phases[id]?.status !== 'success')
  if (command === 'verify') {
    return next ? { ok: false, expected: next, warning: `Vor Verify fehlt: ${next}.` } : { ok: true, expected: 'verify' }
  }
  return command === next
    ? { ok: true, expected: next }
    : { ok: false, expected: next || 'verify', warning: `Reihenfolge verletzt. Als Nächstes: ${next || 'verify'}.` }
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
  const sections = snapshot.sections || (snapshot.sectionNames || []).map(name => ({ name }))
  const sectionNames = sections.map(section => section.name)
  const presentNames = new Set(sectionNames)
  const expectedAnnotationViews = new Set(ANNOTATION_SECTIONS.flatMap(annotation => annotation.views.map(view => `${annotation.kind}\u0000${view.name}`)))
  const presentAnnotationViews = new Set((snapshot.annotationViews || []).map(item => `${item.kind}\u0000${item.view}`))
  const expectedDialogStates = new Set(DIALOG_FAMILIES.flatMap(family => family.states.map(state => `${family.name}\u0000${state}`)))
  const presentDialogStates = new Set((snapshot.dialogStates || []).map(item => `${item.family}\u0000${item.state}`))
  const sectionStructureValid = sections.length === SECTION_DEFINITIONS.length
    && sections.every(section => section.type === undefined || (
      section.type === 'SECTION'
      && section.parentType === 'PAGE'
      && section.parentName === TARGET_PAGE_NAME
      && section.owner === PLUGIN_ORIGIN
    ))
  const componentSets = snapshot.componentSets || []
  const expectedComponentIds = new Set(COMPONENT_DEFINITIONS.map(component => component.id))
  const componentStructureValid = componentSets.length === COMPONENT_DEFINITIONS.length
    && new Set(componentSets.map(item => item.id)).size === COMPONENT_DEFINITIONS.length
    && componentSets.every(item => expectedComponentIds.has(item.id))
    && componentSets.every(item => item.variants >= 2 && item.autoLayout && item.bound)
  const foundation = snapshot.foundation || {}
  const foundationStrict = validateFoundationEvidence(foundation)
  const foundationInventoryValid = foundationStrict.valid
  const foundationValid = ['paintsValid', 'radiiValid', 'effectsValid', 'fontsValid', 'docsBound'].every(key => foundation[key] === true)
    && foundationInventoryValid
  const annotationViewsValid = snapshot.annotationViews
    ? snapshot.annotationViews.length === expectedAnnotationViews.size && presentAnnotationViews.size === expectedAnnotationViews.size && [...expectedAnnotationViews].every(key => presentAnnotationViews.has(key))
    : new Set(snapshot.annotationKinds || []).size === ANNOTATION_SECTIONS.length
  const dialogStatesValid = snapshot.dialogStates
    ? snapshot.dialogStates.length === expectedDialogStates.size && presentDialogStates.size === expectedDialogStates.size && [...expectedDialogStates].every(key => presentDialogStates.has(key))
    : new Set(snapshot.dialogFamilies || []).size === DIALOG_FAMILIES.length
  const phasesComplete = snapshot.phases
    ? REQUIRED_PHASES.every(id => snapshot.phases[id]?.status === 'success')
    : true
  const report = {
    pageCount: Number(snapshot.pageCount || 0),
    sectionCount: sectionNames.length,
    missingSections: [...requiredNames].filter(name => !presentNames.has(name)),
    annotationCount: snapshot.annotationViews ? new Set(snapshot.annotationViews.map(item => item.kind)).size : new Set(snapshot.annotationKinds || []).size,
    annotationViewCount: presentAnnotationViews.size,
    annotationViewsValid,
    dialogFamilyCount: snapshot.dialogStates ? new Set(snapshot.dialogStates.map(item => item.family)).size : new Set(snapshot.dialogFamilies || []).size,
    dialogStateCount: presentDialogStates.size,
    dialogStatesValid,
    nonGrayPaints: (snapshot.paints || []).filter(color => !isGrayColor(color)).length,
    invalidRadii: (snapshot.radii || []).filter(radius => !isValidRadius(radius.value, radius.geometry)).length,
    duplicateNames: duplicates(snapshot.topLevelNames || sectionNames),
    sectionStructureValid,
    componentSetCount: componentSets.length,
    componentStructureValid,
    instanceCount: Number(snapshot.instanceCount || 0),
    repeatedScreenInstanceCount: Number(snapshot.repeatedScreenInstanceCount || 0),
    foundationValid,
    foundationInventoryValid,
    foundationErrors: foundationStrict.errors,
    intersections: snapshot.intersections || [],
    clearance: Number(snapshot.clearance ?? 0),
    overflowNodes: snapshot.overflowNodes || [],
    undersizedHitTargets: snapshot.undersizedHitTargets || [],
    reactionCount: Number(snapshot.reactionCount || 0),
    requiredReactionCount: Number(snapshot.requiredReactionCount || 0),
    phasesComplete,
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
  const modern = Boolean(snapshot.sections)
  report.hardPass = Boolean(snapshot.targetAuthorized)
    && report.pageCount === 1
    && snapshot.pageName === TARGET_PAGE_NAME
    && report.sectionCount === SECTION_DEFINITIONS.length
    && report.missingSections.length === 0
    && report.duplicateNames.length === 0
    && sectionStructureValid
    && annotationViewsValid
    && dialogStatesValid
    && componentStructureValid
    && report.instanceCount >= COMPONENT_DEFINITIONS.length
    && report.repeatedScreenInstanceCount > 0
    && foundationValid
    && report.intersections.length === 0
    && report.clearance >= 2000
    && report.overflowNodes.length === 0
    && report.undersizedHitTargets.length === 0
    && report.requiredReactionCount > 0
    && report.reactionCount >= report.requiredReactionCount
    && report.preservedBaselineHash
    && report.pageInvariant
    && phasesComplete
  if (!modern) delete report.hardPass
  return report
}
