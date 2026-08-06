import {
  ANNOTATION_SECTIONS,
  COMPONENT_DEFINITIONS,
  DIALOG_FAMILIES,
  LEDGER_KEY,
  PALETTE,
  PLUGIN_ORIGIN,
  RADIUS_TOKENS,
  SECTION_DEFINITIONS,
  TARGET_DOCUMENT_NAME,
  TARGET_FILE_KEY,
  TARGET_PAGE_NAME,
  TYPE_SCALE,
  TYPE_WEIGHTS,
  annotationBatch,
} from './definitions.mjs'
import {
  buildVerificationReport,
  canReuseOwnedNode,
  computeOndaOrigin,
  hashBaselineRecords,
  isGrayColor,
  isValidRadius,
  orderRecordsByBaselineIds,
  protectedChildIds,
  validateDesignPlan,
  validateTargetContext,
  buildDesignPlan,
} from './plan.mjs'

const SECTION_WIDTH = 2100
const SECTION_CELL_WIDTH = 2400
const SECTION_CELL_HEIGHT = 11000
const SECTION_COLUMNS = 3
const CREATED_MARKER_KEY = 'ondaOrigin'

let lastInspection = null

figma.showUI(__html__, { width: 420, height: 720, themeColors: true })

function color(key) {
  const value = PALETTE[key]
  return { r: value.r, g: value.g, b: value.b }
}

function solid(key, opacity = 1) {
  return { type: 'SOLID', color: color(key), opacity }
}

function cloneSerializable(value) {
  try {
    return JSON.parse(JSON.stringify(value, (_key, entry) => {
      if (typeof entry === 'symbol') return 'MIXED'
      if (typeof entry === 'function') return undefined
      return entry
    }))
  } catch (_error) {
    return String(value)
  }
}

function childIndex(node) {
  const parent = node.parent
  return parent && 'children' in parent ? parent.children.indexOf(node) : -1
}

function nodeRecord(node, baselineIds = null) {
  const children = 'children' in node
    ? protectedChildIds({
      nodeType: node.type,
      children: node.children.map(child => ({ id: child.id, owner: child.getPluginData(CREATED_MARKER_KEY) })),
      baselineIds: baselineIds || new Set(node.children.map(child => child.id)),
    })
    : []
  const parent = node.parent
  const parentType = parent?.type || null
  const autoLayout = 'layoutMode' in node ? {
    layoutMode: node.layoutMode,
    primaryAxisSizingMode: node.primaryAxisSizingMode,
    counterAxisSizingMode: node.counterAxisSizingMode,
    primaryAxisAlignItems: node.primaryAxisAlignItems,
    counterAxisAlignItems: node.counterAxisAlignItems,
    itemSpacing: node.itemSpacing,
    paddingTop: node.paddingTop,
    paddingRight: node.paddingRight,
    paddingBottom: node.paddingBottom,
    paddingLeft: node.paddingLeft,
    layoutWrap: node.layoutWrap,
    layoutSizingHorizontal: node.layoutSizingHorizontal,
    layoutSizingVertical: node.layoutSizingVertical,
  } : null
  let mainComponentId = null
  let mainComponentKey = null
  if (node.type === 'INSTANCE') {
    try {
      mainComponentId = node.mainComponent?.id || null
      mainComponentKey = node.mainComponent?.key || null
    } catch (_error) {
      mainComponentId = null
      mainComponentKey = null
    }
  }
  const layoutChild = 'layoutPositioning' in node ? {
    layoutPositioning: node.layoutPositioning,
    layoutAlign: node.layoutAlign,
    layoutGrow: node.layoutGrow,
    constraints: 'constraints' in node ? cloneSerializable(node.constraints) : null,
  } : null
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    parentId: parent?.id || null,
    parentType,
    index: childIndex(node),
    bounds: 'x' in node ? { x: node.x, y: node.y, width: node.width, height: node.height } : null,
    absoluteRenderBounds: 'absoluteRenderBounds' in node ? cloneSerializable(node.absoluteRenderBounds) : null,
    absoluteBoundingBox: 'absoluteBoundingBox' in node ? cloneSerializable(node.absoluteBoundingBox) : null,
    visible: 'visible' in node ? node.visible : null,
    opacity: 'opacity' in node ? node.opacity : null,
    text: node.type === 'TEXT' ? node.characters : null,
    childIds: children,
    fills: 'fills' in node ? cloneSerializable(node.fills) : null,
    strokes: 'strokes' in node ? cloneSerializable(node.strokes) : null,
    effects: 'effects' in node ? cloneSerializable(node.effects) : null,
    mainComponentId,
    mainComponentKey,
    componentSetId: parent?.type === 'COMPONENT_SET' ? parent.id : null,
    componentKey: (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') ? node.key : null,
    autoLayout,
    layoutChild,
  }
}

function collectRecordsFromDocument(baselineIds = null) {
  const records = []
  function visit(node) {
    const belongs = !baselineIds || baselineIds.has(node.id)
    if (belongs) records.push(nodeRecord(node, baselineIds))
    if ('children' in node) {
      for (const child of node.children) visit(child)
    }
  }
  if (!baselineIds || baselineIds.has(figma.root.id)) records.push(nodeRecord(figma.root, baselineIds))
  for (const page of figma.root.children) {
    if (!baselineIds || baselineIds.has(page.id)) records.push(nodeRecord(page, baselineIds))
    for (const child of page.children) visit(child)
  }
  return records
}

function pageInvariantSnapshot() {
  return figma.root.children.map((page, index) => ({ id: page.id, name: page.name, index }))
}

function readLedger(page) {
  const raw = page.getPluginData(LEDGER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch (_error) { return null }
}

function writeLedger(page, ledger) {
  page.setPluginData(LEDGER_KEY, JSON.stringify(ledger))
}

function fontStyleForWeight(fonts, family, weight) {
  const preferences = weight === 400
    ? ['Regular', 'Book', 'Normal']
    : weight === 500
      ? ['Medium', 'Semi Medium', 'Regular']
      : ['Bold', 'Semi Bold', 'Semibold', 'Medium']
  const styles = fonts.filter(font => font.fontName.family === family).map(font => font.fontName.style)
  return preferences.find(style => styles.includes(style)) || styles[0] || null
}

function inspectFonts(fonts) {
  const exactFamily = fonts.some(font => font.fontName.family === 'ABC Diatype')
  const family = exactFamily
    ? 'ABC Diatype'
    : fonts.some(font => font.fontName.family === 'Inter')
      ? 'Inter'
      : fonts[0]?.fontName.family
  if (!family) throw new Error('Keine verwendbare Schrift in Figma gefunden.')
  const styles = Object.fromEntries(TYPE_WEIGHTS.map(weight => [weight, fontStyleForWeight(fonts, family, weight)]))
  if (Object.values(styles).some(style => !style)) throw new Error(`Keine vollständigen Schriftschnitte für ${family} gefunden.`)
  const warning = exactFamily
    ? ''
    : `ABC Diatype ist nicht verfügbar. Sichtbarer System-Fallback: ${family}.`
  return { requestedFamily: 'ABC Diatype', family, styles, exact: exactFamily, warning }
}

async function inspectCurrentTarget() {
  await figma.loadAllPagesAsync()
  const page = figma.currentPage
  const target = validateTargetContext({
    fileKey: figma.fileKey,
    documentName: figma.root.name,
    pageName: page.name,
  })
  const fonts = await figma.listAvailableFontsAsync()
  const fontDecision = inspectFonts(fonts)
  const ledger = readLedger(page)
  const records = ledger ? null : collectRecordsFromDocument()
  const topLevelIds = ledger ? ledger.baseline.topLevelIds : page.children.map(node => node.id)
  const result = {
    target,
    fileKey: figma.fileKey || null,
    expectedFileKey: TARGET_FILE_KEY,
    documentName: figma.root.name,
    expectedDocumentName: TARGET_DOCUMENT_NAME,
    pageName: page.name,
    expectedPageName: TARGET_PAGE_NAME,
    pageCount: figma.root.children.length,
    fontDecision,
    ledger,
    pendingBaseline: ledger ? null : {
      records,
      hash: hashBaselineRecords(records),
      nodeHashes: records.map(record => ({ id: record.id, hash: hashBaselineRecords([record]) })),
      nodeIds: records.map(record => record.id),
      topLevelIds,
      topLevelCount: topLevelIds.length,
      pages: pageInvariantSnapshot(),
    },
  }
  lastInspection = result
  return result
}

function inspectionMessage(inspection) {
  const targetText = inspection.target.ok
    ? `Ziel geprüft: ${inspection.documentName} · ${inspection.pageName}.`
    : inspection.target.warning
  const fontText = inspection.fontDecision.warning || 'ABC Diatype mit exakten Schnitten verfügbar.'
  return `${targetText} ${inspection.target.warning && inspection.target.ok ? inspection.target.warning : ''} ${fontText}`.trim()
}

async function requireMutationContext() {
  const inspection = lastInspection || await inspectCurrentTarget()
  if (!inspection.target.ok) throw new Error(inspection.target.warning)
  const page = figma.currentPage
  let ledger = readLedger(page)
  if (!ledger) {
    const baseline = inspection.pendingBaseline
    if (!baseline) throw new Error('Inspect muss vor der ersten Mutation erneut ausgeführt werden.')
    const origin = computeOndaOrigin(page.children)
    ledger = {
      version: 1,
      origin: { x: origin, y: 0 },
      target: {
        fileKey: figma.fileKey || null,
        documentName: figma.root.name,
        pageId: page.id,
        pageName: page.name,
        fallback: inspection.target.fallback,
      },
      fontDecision: inspection.fontDecision,
      baseline: {
        hash: baseline.hash,
        nodeHashes: baseline.nodeHashes,
        nodeIds: baseline.nodeIds,
        topLevelIds: baseline.topLevelIds,
        topLevelCount: baseline.topLevelCount,
        pages: baseline.pages,
      },
      phases: {},
      createdAt: new Date().toISOString(),
    }
    writeLedger(page, ledger)
  }
  if (ledger.target.pageId !== page.id || ledger.target.pageName !== TARGET_PAGE_NAME) {
    throw new Error('Das gespeicherte Onda-Ledger gehört nicht zur aktuellen Page 1.')
  }
  return { page, ledger }
}

function markPhase(page, ledger, command, counts) {
  ledger.phases[command] = { status: 'success', at: new Date().toISOString(), counts }
  ledger.updatedAt = new Date().toISOString()
  writeLedger(page, ledger)
}

function sectionPosition(index, origin) {
  return {
    x: origin.x + index % SECTION_COLUMNS * SECTION_CELL_WIDTH,
    y: origin.y + Math.floor(index / SECTION_COLUMNS) * SECTION_CELL_HEIGHT,
  }
}

function resizeNode(node, width, height) {
  if (typeof node.resizeWithoutConstraints === 'function') node.resizeWithoutConstraints(width, height)
  else node.resize(width, height)
}

function ensureSection(page, ledger, name, height = 1800) {
  const existing = page.children.find(node => node.name === name)
  if (existing) {
    const reusable = existing.type === 'SECTION' && canReuseOwnedNode({
      id: existing.id,
      owner: existing.getPluginData(CREATED_MARKER_KEY),
    }, new Set(ledger.baseline.nodeIds))
    if (!reusable) throw new Error(`Namenskollision mit geschütztem Bestand: ${name}`)
    return { node: existing, created: false }
  }
  const definitionIndex = SECTION_DEFINITIONS.findIndex(section => section.name === name)
  if (definitionIndex < 0) throw new Error(`Unbekannte Section: ${name}`)
  const section = figma.createSection()
  section.name = name
  const position = sectionPosition(definitionIndex, ledger.origin)
  section.x = position.x
  section.y = position.y
  resizeNode(section, SECTION_WIDTH, height)
  section.fills = [solid('gray/025')]
  section.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  page.appendChild(section)
  return { node: section, created: true }
}

function directChild(parent, name, types = null) {
  if (!('children' in parent)) return null
  return parent.children.find(node => node.name === name && (!types || types.includes(node.type))) || null
}

function autoFrame(parent, name, options = {}) {
  const existing = directChild(parent, name, ['FRAME'])
  if (existing) return { node: existing, created: false }
  const frame = figma.createFrame()
  frame.name = name
  frame.layoutMode = options.direction || 'VERTICAL'
  frame.primaryAxisSizingMode = options.primarySizing || 'AUTO'
  frame.counterAxisSizingMode = 'FIXED'
  frame.primaryAxisAlignItems = options.primaryAlign || 'MIN'
  frame.counterAxisAlignItems = options.counterAlign || 'MIN'
  frame.itemSpacing = options.gap ?? 12
  frame.paddingTop = options.padding ?? 24
  frame.paddingRight = options.padding ?? 24
  frame.paddingBottom = options.padding ?? 24
  frame.paddingLeft = options.padding ?? 24
  frame.fills = [solid(options.dark ? 'gray/900' : options.fill || 'gray/000')]
  frame.strokes = [solid(options.dark ? 'gray/700' : 'gray/200')]
  frame.strokeWeight = 1
  frame.cornerRadius = options.radius ?? 6
  frame.clipsContent = true
  resizeNode(frame, options.width || 620, options.height || 120)
  parent.appendChild(frame)
  if (Number.isFinite(options.x)) frame.x = options.x
  if (Number.isFinite(options.y)) frame.y = options.y
  frame.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  return { node: frame, created: true }
}

async function loadDecisionFonts(decision) {
  const fontNames = TYPE_WEIGHTS.map(weight => ({ family: decision.family, style: decision.styles[weight] }))
  const unique = [...new Map(fontNames.map(font => [`${font.family}/${font.style}`, font])).values()]
  await Promise.all(unique.map(font => figma.loadFontAsync(font)))
}

function textNode(parent, name, characters, decision, options = {}) {
  const existing = directChild(parent, name, ['TEXT'])
  if (existing) return { node: existing, created: false }
  const text = figma.createText()
  text.name = name
  const weight = options.weight || 400
  text.fontName = { family: decision.family, style: decision.styles[weight] }
  text.fontSize = options.size || 15
  const scale = TYPE_SCALE.find(item => item.size === text.fontSize)
  text.lineHeight = { unit: 'PIXELS', value: scale?.lineHeight || Math.round(text.fontSize * 1.45) }
  text.characters = characters
  text.fills = [solid(options.dark ? 'gray/000' : options.muted ? 'gray/500' : 'gray/900')]
  parent.appendChild(text)
  if (options.width) {
    text.textAutoResize = 'HEIGHT'
    text.resize(options.width, Math.max(text.height, 16))
  }
  return { node: text, created: true }
}

function heading(parent, title, decision, subtitle = '') {
  textNode(parent, `${title} / Titel`, title, decision, { size: 40, weight: 700, width: 1500 })
  if (subtitle) textNode(parent, `${title} / Untertitel`, subtitle, decision, { size: 15, muted: true, width: 1500 })
}

async function ensureCollection(name, modeName) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync()
  const existing = collections.find(collection => collection.name === name)
  if (existing) return { collection: existing, modeId: existing.modes[0].modeId, created: false }
  const collection = figma.variables.createVariableCollection(name)
  collection.renameMode(collection.modes[0].modeId, modeName)
  return { collection, modeId: collection.modes[0].modeId, created: true }
}

async function ensureVariable(collection, modeId, definition) {
  const variables = await figma.variables.getLocalVariablesAsync()
  const existing = variables.find(variable => variable.variableCollectionId === collection.id && variable.name === definition.name)
  if (existing) return { variable: existing, created: false }
  const variable = figma.variables.createVariable(definition.name, collection, definition.type)
  variable.setValueForMode(modeId, definition.value)
  if (definition.type !== 'BOOLEAN') variable.scopes = definition.scopes || []
  variable.setVariableCodeSyntax('WEB', `var(${definition.css})`)
  return { variable, created: true }
}

async function createFoundationVariables() {
  const primitiveInfo = await ensureCollection('Onda · Primitive', 'Value')
  const dimensionInfo = await ensureCollection('Onda · Dimension', 'Value')
  const lightInfo = await ensureCollection('Onda · Semantic · Light', 'Light')
  const darkInfo = await ensureCollection('Onda · Semantic · Dark', 'Dark')
  const typographyInfo = await ensureCollection('Onda · Typography', 'Value')
  const created = []
  const primitiveByName = {}
  for (const [name, value] of Object.entries(PALETTE)) {
    const result = await ensureVariable(primitiveInfo.collection, primitiveInfo.modeId, {
      name, type: 'COLOR', value, scopes: [], css: `--onda-${name.replace('/', '-')}`,
    })
    primitiveByName[name] = result.variable
    if (result.created) created.push(result.variable.id)
  }
  const semanticRoles = [
    { name: 'color/background', light: 'gray/025', dark: 'gray/1000', scopes: ['FRAME_FILL', 'SHAPE_FILL'] },
    { name: 'color/surface', light: 'gray/000', dark: 'gray/900', scopes: ['FRAME_FILL', 'SHAPE_FILL'] },
    { name: 'color/text', light: 'gray/900', dark: 'gray/000', scopes: ['TEXT_FILL'] },
    { name: 'color/text-muted', light: 'gray/500', dark: 'gray/300', scopes: ['TEXT_FILL'] },
    { name: 'color/border', light: 'gray/200', dark: 'gray/700', scopes: ['STROKE_COLOR'] },
    { name: 'color/inverted', light: 'gray/900', dark: 'gray/000', scopes: ['FRAME_FILL', 'SHAPE_FILL'] },
    { name: 'color/on-inverted', light: 'gray/000', dark: 'gray/900', scopes: ['TEXT_FILL'] },
  ]
  for (const role of semanticRoles) {
    for (const [info, primitiveName, suffix] of [
      [lightInfo, role.light, 'light'], [darkInfo, role.dark, 'dark'],
    ]) {
      const result = await ensureVariable(info.collection, info.modeId, {
        name: role.name,
        type: 'COLOR',
        value: figma.variables.createVariableAlias(primitiveByName[primitiveName]),
        scopes: role.scopes,
        css: `--onda-${role.name.replaceAll('/', '-')}-${suffix}`,
      })
      if (result.created) created.push(result.variable.id)
    }
  }
  const dimensions = [
    ...[4, 8, 12, 16, 24, 32, 40].map(value => ({ name: `spacing/${value}`, value, scope: 'GAP' })),
    ...RADIUS_TOKENS.map(token => ({ name: token.name, value: token.value, scope: 'CORNER_RADIUS' })),
  ]
  for (const item of dimensions) {
    const result = await ensureVariable(dimensionInfo.collection, dimensionInfo.modeId, {
      name: item.name, type: 'FLOAT', value: item.value, scopes: [item.scope], css: `--onda-${item.name.replaceAll('/', '-')}`,
    })
    if (result.created) created.push(result.variable.id)
  }
  for (const item of TYPE_SCALE) {
    const result = await ensureVariable(typographyInfo.collection, typographyInfo.modeId, {
      name: `font-size/${item.size}`, type: 'FLOAT', value: item.size, scopes: ['FONT_SIZE'], css: `--onda-font-size-${item.size}`,
    })
    if (result.created) created.push(result.variable.id)
  }
  for (const weight of TYPE_WEIGHTS) {
    const result = await ensureVariable(typographyInfo.collection, typographyInfo.modeId, {
      name: `font-weight/${weight}`, type: 'FLOAT', value: weight, scopes: ['FONT_WEIGHT'], css: `--onda-font-weight-${weight}`,
    })
    if (result.created) created.push(result.variable.id)
  }
  return {
    collections: [primitiveInfo, dimensionInfo, lightInfo, darkInfo, typographyInfo].map(info => info.collection.id),
    createdVariableIds: created,
  }
}

async function createFoundationStyles(decision) {
  const existingText = await figma.getLocalTextStylesAsync()
  const createdText = []
  for (const scale of TYPE_SCALE) {
    for (const weight of TYPE_WEIGHTS) {
      const name = `Onda/Type/${scale.size} · ${weight}`
      if (existingText.some(style => style.name === name)) continue
      const style = figma.createTextStyle()
      style.name = name
      style.fontName = { family: decision.family, style: decision.styles[weight] }
      style.fontSize = scale.size
      style.lineHeight = { unit: 'PIXELS', value: scale.lineHeight }
      style.letterSpacing = { unit: 'PIXELS', value: 0 }
      createdText.push(style.id)
    }
  }
  const existingEffects = await figma.getLocalEffectStylesAsync()
  const createdEffects = []
  const effects = [
    { name: 'Onda/Shadow/Floating', radius: 12, opacity: 0.12, y: 4 },
    { name: 'Onda/Shadow/Overlay', radius: 24, opacity: 0.16, y: 8 },
  ]
  for (const effect of effects) {
    if (existingEffects.some(style => style.name === effect.name)) continue
    const style = figma.createEffectStyle()
    style.name = effect.name
    style.effects = [{
      type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: effect.opacity },
      offset: { x: 0, y: effect.y }, radius: effect.radius, spread: 0,
      visible: true, blendMode: 'NORMAL',
    }]
    createdEffects.push(style.id)
  }
  return { createdTextStyleIds: createdText, createdEffectStyleIds: createdEffects }
}

async function runFoundations(page, ledger) {
  await loadDecisionFonts(ledger.fontDecision)
  const variables = await createFoundationVariables()
  const styles = await createFoundationStyles(ledger.fontDecision)
  const sectionResult = ensureSection(page, ledger, '01 · Foundations', 3000)
  const section = sectionResult.node
  const doc = autoFrame(section, 'Foundations / Dokumentation', { x: 80, y: 100, width: 1940, padding: 40, gap: 24, radius: 6 }).node
  heading(doc, 'Foundations', ledger.fontDecision, 'Monochrom · Radien 0/4/6/8 · ABC Diatype bevorzugt · Light und Dark als getrennte Single-Mode-Semantik')
  textNode(doc, 'Foundations / Fontstatus', ledger.fontDecision.warning || '✓ ABC Diatype ist verfügbar.', ledger.fontDecision, {
    size: 15, weight: 700, width: 1800,
  })
  const palette = autoFrame(section, 'Foundations / Graustufen', { x: 80, y: 620, width: 1940, direction: 'HORIZONTAL', padding: 32, gap: 12, radius: 6 }).node
  for (const name of Object.keys(PALETTE)) {
    const swatch = autoFrame(palette, `Swatch / ${name}`, { width: 150, height: 160, padding: 12, gap: 8, fill: name, radius: 4 }).node
    swatch.fills = [solid(name)]
    textNode(swatch, `Swatch / ${name} / Label`, name, ledger.fontDecision, { size: 12, weight: 500, dark: ['gray/700', 'gray/900', 'gray/1000'].includes(name), width: 120 })
  }
  const type = autoFrame(section, 'Foundations / Typografie', { x: 80, y: 1000, width: 1940, padding: 32, gap: 20, radius: 6 }).node
  for (const scale of TYPE_SCALE) {
    for (const weight of TYPE_WEIGHTS) {
      textNode(type, `Typografie / ${scale.size} / ${weight}`, `${scale.size}px · ${weight} · Onda schreibt klar und ruhig.`, ledger.fontDecision, {
        size: scale.size, weight, width: 1800,
      })
    }
  }
  const radius = autoFrame(section, 'Foundations / Radien', { x: 80, y: 2250, width: 1940, direction: 'HORIZONTAL', padding: 32, gap: 20, radius: 6 }).node
  for (const token of RADIUS_TOKENS) {
    const sample = token.geometry === 'ELLIPSE' ? figma.createEllipse() : figma.createRectangle()
    sample.name = `Radius / ${token.value}`
    sample.resize(112, 112)
    sample.fills = [solid('gray/100')]
    sample.strokes = [solid('gray/700')]
    sample.strokeWeight = 1
    if (token.geometry !== 'ELLIPSE') sample.cornerRadius = token.value
    radius.appendChild(sample)
  }
  return {
    sectionCreated: sectionResult.created,
    collectionCount: variables.collections.length,
    variablesCreated: variables.createdVariableIds.length,
    textStylesCreated: styles.createdTextStyleIds.length,
    effectStylesCreated: styles.createdEffectStyleIds.length,
  }
}

async function localVariable(name, collectionName) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync()
  const collection = collections.find(item => item.name === collectionName)
  if (!collection) return null
  const variables = await figma.variables.getLocalVariablesAsync()
  return variables.find(variable => variable.variableCollectionId === collection.id && variable.name === name) || null
}

async function bindComponentSurface(component, dark = false) {
  const fillVariable = await localVariable('color/inverted', dark ? 'Onda · Semantic · Dark' : 'Onda · Semantic · Light')
  const radiusVariable = await localVariable('radius/control', 'Onda · Dimension')
  const spacingVariable = await localVariable('spacing/12', 'Onda · Dimension')
  if (fillVariable) {
    component.fills = [figma.variables.setBoundVariableForPaint(solid('gray/900'), 'color', fillVariable)]
  }
  if (radiusVariable) {
    for (const field of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) component.setBoundVariable(field, radiusVariable)
  }
  if (spacingVariable) component.setBoundVariable('itemSpacing', spacingVariable)
}

function componentVariant(parent, definition, decision, state, index) {
  const component = figma.createComponent()
  component.name = `State=${state}`
  component.layoutMode = 'HORIZONTAL'
  component.primaryAxisSizingMode = 'AUTO'
  component.counterAxisSizingMode = 'AUTO'
  component.primaryAxisAlignItems = 'CENTER'
  component.counterAxisAlignItems = 'CENTER'
  component.itemSpacing = 8
  component.paddingTop = 12
  component.paddingRight = 16
  component.paddingBottom = 12
  component.paddingLeft = 16
  component.cornerRadius = definition.id === 'dialog' ? 8 : 4
  component.fills = [solid(index === 0 ? 'gray/900' : 'gray/000')]
  component.strokes = [solid('gray/500')]
  component.strokeWeight = state === 'Focus' ? 2 : 1
  parent.appendChild(component)
  const marker = figma.createText()
  marker.name = 'Statussymbol'
  marker.fontName = { family: decision.family, style: decision.styles[700] }
  marker.fontSize = 15
  marker.characters = state === 'Focus' ? '◎' : '●'
  marker.fills = [solid(index === 0 ? 'gray/000' : 'gray/900')]
  component.appendChild(marker)
  const label = figma.createText()
  label.name = 'label'
  label.fontName = { family: decision.family, style: decision.styles[500] }
  label.fontSize = 15
  label.characters = definition.label
  label.fills = [solid(index === 0 ? 'gray/000' : 'gray/900')]
  component.appendChild(label)
  return { component, label }
}

async function runComponent(page, ledger, componentId) {
  await loadDecisionFonts(ledger.fontDecision)
  const definition = COMPONENT_DEFINITIONS.find(component => component.id === componentId)
  if (!definition) throw new Error(`Unbekannte Komponente: ${componentId}`)
  const earlierMissing = COMPONENT_DEFINITIONS.filter(component => component.tier < definition.tier).filter(component => {
    const section = page.children.find(node => node.type === 'SECTION' && node.name === '02 · Komponenten')
    return !section || !section.findOne(node => node.type === 'COMPONENT_SET' && node.name === component.name)
  })
  if (earlierMissing.length) throw new Error(`Zuerst Abhängigkeiten erzeugen: ${earlierMissing.map(component => component.label).join(', ')}`)
  const section = ensureSection(page, ledger, '02 · Komponenten', 4000).node
  const existing = section.findOne(node => node.type === 'COMPONENT_SET' && node.name === definition.name)
  if (existing) {
    return { component: definition.name, status: 'reused', variantCount: existing.children.length }
  }
  const variants = [
    componentVariant(section, definition, ledger.fontDecision, 'Default', 0),
    componentVariant(section, definition, ledger.fontDecision, 'Focus', 1),
  ]
  for (const variant of variants) await bindComponentSurface(variant.component)
  const set = figma.combineAsVariants(variants.map(item => item.component), section)
  set.name = definition.name
  set.description = `${definition.label}: monochrome Onda-Komponente mit Auto Layout, Variablenbindung und sichtbarem Fokuszustand.`
  set.fills = [solid('gray/050')]
  set.strokes = [solid('gray/200')]
  set.strokeWeight = 1
  set.cornerRadius = 6
  const index = COMPONENT_DEFINITIONS.findIndex(component => component.id === componentId)
  set.x = 80 + index % 2 * 920
  set.y = 120 + Math.floor(index / 2) * 700
  let maxX = 0
  for (const [variantIndex, child] of set.children.entries()) {
    child.x = 40 + variantIndex * 280
    child.y = 80
    maxX = Math.max(maxX, child.x + child.width)
  }
  resizeNode(set, Math.max(720, maxX + 40), 240)
  const labelKey = set.addComponentProperty('Label', 'TEXT', definition.label)
  for (const variant of set.children) {
    const label = variant.findOne(node => node.type === 'TEXT' && node.name === 'label')
    if (label) label.componentPropertyReferences = { characters: labelKey }
  }
  const instance = set.children[0].createInstance()
  instance.name = `${definition.name} / Beispielinstanz`
  instance.x = set.x
  instance.y = set.y + set.height + 40
  section.appendChild(instance)
  return { component: definition.name, status: 'created', variantCount: set.children.length, instanceCount: 1 }
}

function componentSet(page, name) {
  const section = page.children.find(node => node.type === 'SECTION' && node.name === '02 · Komponenten')
  return section?.findOne(node => node.type === 'COMPONENT_SET' && node.name === name) || null
}

function placeInstance(parent, set, name) {
  if (!set || !set.children.length) return null
  const existing = directChild(parent, name, ['INSTANCE'])
  if (existing) return existing
  const instance = set.children[0].createInstance()
  instance.name = name
  parent.appendChild(instance)
  return instance
}

function createLibraryView(section, decision, state, x) {
  const frame = autoFrame(section, `Bibliothek / ${state}`, { x, y: 180, width: 900, padding: 32, gap: 20, radius: 0 }).node
  textNode(frame, `Bibliothek / ${state} / Titel`, state, decision, { size: 21, weight: 700, width: 800 })
  textNode(frame, `Bibliothek / ${state} / Suche`, '⌕  Projekte und Dokumente durchsuchen', decision, { size: 15, width: 800 })
  const rows = state.includes('Leer') ? ['Noch kein Projekt · Projekt anlegen'] : ['Buchprojekt · 12 Dokumente', 'Essay · 4 Dokumente', 'Notizen · 21 Einträge']
  for (const [index, row] of rows.entries()) textNode(frame, `Bibliothek / ${state} / Zeile ${index + 1}`, `${index + 1}. ${row}`, decision, { size: 15, width: 800 })
  return frame
}

function createEditorView(section, decision, state, x, dark = false, width = 1440) {
  const frame = autoFrame(section, `Editor / ${state}`, { x, y: 180, width, padding: 0, gap: 0, radius: 0, dark, direction: 'HORIZONTAL' }).node
  const nav = autoFrame(frame, `Editor / ${state} / Navigation`, { width: Math.min(264, Math.round(width * .25)), padding: 24, gap: 16, radius: 0, dark, fill: dark ? 'gray/900' : 'gray/050' }).node
  textNode(nav, `Editor / ${state} / Navigation / Marke`, 'ONDA', decision, { size: 21, weight: 700, dark, width: 210 })
  for (const label of ['Struktur', 'Projektverständnis', 'Quellen', 'Einstellungen']) textNode(nav, `Editor / ${state} / Navigation / ${label}`, `□ ${label}`, decision, { size: 15, weight: 500, dark, width: 210 })
  const document = autoFrame(frame, `Editor / ${state} / Schreibfläche`, { width: width - Math.min(264, Math.round(width * .25)), padding: width <= 320 ? 16 : 48, gap: 24, radius: 0, dark }).node
  textNode(document, `Editor / ${state} / Dokumenttitel`, 'Die leise Architektur eines Arguments', decision, { size: width <= 320 ? 21 : 40, weight: 700, dark, width: Math.max(240, width - 400) })
  textNode(document, `Editor / ${state} / Absatz 1`, 'Ein guter Text zeigt nicht nur, was behauptet wird. Er macht sichtbar, wie Beobachtung, Beleg und Schlussfolgerung miteinander verbunden sind.', decision, { size: 15, dark, width: Math.max(240, width - 420) })
  textNode(document, `Editor / ${state} / Status`, state.includes('Review') ? '◎ REVIEW OFFEN · 3 Hinweise · Nächster Hinweis' : '✓ DOKUMENT BEREIT · keine offenen Hinweise', decision, { size: 12, weight: 700, dark, width: Math.max(240, width - 420) })
  return frame
}

async function runCoreViews(page, ledger) {
  await loadDecisionFonts(ledger.fontDecision)
  const overview = ensureSection(page, ledger, '00 · Übersicht', 1800).node
  const overviewDoc = autoFrame(overview, 'Übersicht / Coverage', { x: 80, y: 100, width: 1940, padding: 40, gap: 20, radius: 6 }).node
  heading(overviewDoc, 'Onda Produktdesign', ledger.fontDecision, 'Eine bestehende Figma-Seite · 39 Sections · 29 Anmerkungsarten · 7 vollständige Dialogfamilien')
  for (const line of ['39 / 39 Sections geplant', '29 / 29 Anmerkungsarten geplant', '7 / 7 Dialogfamilien vollständig benannt', 'Light + Dark · ausschließlich Graustufen', 'Radien: 0 · 4 · 6 · 8 · echte Kreise']) {
    textNode(overviewDoc, `Übersicht / ${line}`, `✓ ${line}`, ledger.fontDecision, { size: 15, weight: 500, width: 1800 })
  }
  const library = ensureSection(page, ledger, '03 · Bibliothek', 1700).node
  createLibraryView(library, ledger.fontDecision, 'Leerzustand', 80)
  createLibraryView(library, ledger.fontDecision, 'Gefüllte Bibliothek', 1080)
  const editor = ensureSection(page, ledger, '04 · Editor', 2500).node
  const clean = createEditorView(editor, ledger.fontDecision, 'Desktop · Bereit', 80)
  const review = createEditorView(editor, ledger.fontDecision, 'Desktop · Review offen', 80)
  review.y = 1300
  const button = componentSet(page, 'Onda/Button')
  if (button) {
    placeInstance(clean, button, 'Editor / Bereit / Hauptaktion')
    placeInstance(review, button, 'Editor / Review / Hauptaktion')
  }
  return { sections: 3, libraryViews: 2, editorViews: 2, componentInstances: button ? 2 : 0 }
}

function annotationStatus(viewName, operationAvailable) {
  if (viewName === 'Open') return '○ OFFEN · Entscheidung ausstehend'
  if (viewName === 'Accept · Undo') return operationAvailable ? '✓ ÜBERNOMMEN · ↶ RÜCKGÄNGIG' : '— NICHT VERFÜGBAR · redaktioneller Hinweis'
  if (viewName === 'Reject · Scope') return '× ABGELEHNT · GÜLTIG FÜR: nur hier / Dokument / persönlich'
  if (viewName === 'Error · Retry') return '! FEHLER · ↻ ERNEUT VERSUCHEN'
  if (viewName === 'Responsive · 320 px') return '↔ 320 PX · Aktionen untereinander'
  return '◐ DARK · Status durch Text + Symbol + Linie'
}

function createAnnotationView(section, annotation, view, decision, index) {
  const dark = view.name === 'Dark'
  const width = view.name === 'Responsive · 320 px' ? 320 : 580
  const x = 80 + index % 3 * 640
  const y = 140 + Math.floor(index / 3) * 620
  const frame = autoFrame(section, `${annotation.label} / ${view.name}`, { x, y, width, padding: view.name === 'Responsive · 320 px' ? 16 : 24, gap: 14, radius: 8, dark }).node
  frame.effects = [{
    type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: dark ? .28 : .1 },
    offset: { x: 0, y: 4 }, radius: 12, spread: 0, visible: true, blendMode: 'NORMAL',
  }]
  textNode(frame, `${annotation.label} / ${view.name} / Anker`, `[${String(index + 1).padStart(2, '0')}] ANKER · ${annotation.scope}`, decision, { size: 12, weight: 700, dark, width: width - 48 })
  textNode(frame, `${annotation.label} / ${view.name} / Titel`, annotation.label, decision, { size: 21, weight: 700, dark, width: width - 48 })
  textNode(frame, `${annotation.label} / ${view.name} / Befund`, `„Dieser Ausschnitt braucht eine klare redaktionelle Entscheidung.“`, decision, { size: 15, dark, width: width - 48 })
  textNode(frame, `${annotation.label} / ${view.name} / Detail`, view.detail, decision, { size: 12, muted: !dark, dark, width: width - 48 })
  textNode(frame, `${annotation.label} / ${view.name} / Status`, annotationStatus(view.name, Boolean(annotation.operation)), decision, { size: 12, weight: 700, dark, width: width - 48 })
  textNode(frame, `${annotation.label} / ${view.name} / Aktion`, view.name === 'Error · Retry' ? '↻ Erneut versuchen   ·   Abbrechen' : 'Weiter   ·   Zurück', decision, { size: 15, weight: 500, dark, width: width - 48 })
  frame.setPluginData('ondaAnnotationKind', annotation.kind)
  frame.setPluginData('ondaAnnotationView', view.name)
  return frame
}

async function runAnnotationBatch(page, ledger, batchIndex) {
  await loadDecisionFonts(ledger.fontDecision)
  const batch = annotationBatch(batchIndex)
  let createdSections = 0
  let createdViews = 0
  for (const annotation of batch) {
    const result = ensureSection(page, ledger, annotation.sectionName, 1500)
    if (result.created) createdSections += 1
    result.node.setPluginData('ondaAnnotationKind', annotation.kind)
    for (const [index, view] of annotation.views.entries()) {
      const existed = directChild(result.node, `${annotation.label} / ${view.name}`, ['FRAME'])
      createAnnotationView(result.node, annotation, view, ledger.fontDecision, index)
      if (!existed) createdViews += 1
    }
  }
  return { batch: batchIndex + 1, annotationCount: batch.length, createdSections, createdViews }
}

function createAgentAndSources(section, decision) {
  const views = [
    ['Agent · Ruhe', '○ AURA RUHIG', 'Der Agent wartet, bis er bewusst geöffnet wird.'],
    ['Agent · Gespräch', '● AGENT AKTIV', 'Welche Aussage möchtest du als Nächstes belegen?'],
    ['Agent · Antwort mit Fundstelle', '✓ ANTWORT · 2 FUNDSTELLEN', 'Die Antwort trennt Beobachtung, Schluss und Quelle.'],
    ['Agent · Fehler und Rückkehr', '! VERBINDUNG FEHLT', 'Erneut versuchen · KI-Anschluss öffnen · Abbrechen'],
  ]
  for (const [index, [name, status, body]] of views.entries()) {
    const frame = autoFrame(section, name, { x: 80 + index % 2 * 980, y: 160 + Math.floor(index / 2) * 620, width: 900, padding: 32, gap: 16, radius: 8 }).node
    textNode(frame, `${name} / Status`, status, decision, { size: 12, weight: 700, width: 820 })
    textNode(frame, `${name} / Titel`, name, decision, { size: 21, weight: 700, width: 820 })
    textNode(frame, `${name} / Inhalt`, body, decision, { size: 15, width: 820 })
    textNode(frame, `${name} / Aktionen`, 'Antworten · Fundstelle öffnen · Zurück zum Editor', decision, { size: 15, weight: 500, width: 820 })
  }
}

function dialogStatus(state) {
  const lower = state.toLowerCase()
  if (lower.includes('fehler') || lower.includes('blockiert') || lower.includes('nicht belastbar')) return '! FEHLER / BLOCKADE · Recovery sichtbar'
  if (lower.includes('läuft') || lower.includes('geprüft') || lower.includes('wird')) return '… ARBEITSSTAND · Abbrechen bleibt erreichbar'
  if (lower.includes('leer') || lower.includes('fehlt') || lower.includes('deaktiviert')) return '○ AUSGANGSLAGE · nächste Handlung sichtbar'
  return '✓ BESTÄTIGT / ENTSCHEIDUNGSBEREIT'
}

function createDialogs(section, decision) {
  let row = 0
  let count = 0
  for (const family of DIALOG_FAMILIES) {
    for (const [index, state] of family.states.entries()) {
      const x = 80 + index % 3 * 640
      const y = 120 + row * 500
      const name = `${family.name} / ${state}`
      const frame = autoFrame(section, name, { x, y, width: 580, padding: 24, gap: 14, radius: 8 }).node
      frame.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: .1 }, offset: { x: 0, y: 4 }, radius: 12, spread: 0, visible: true, blendMode: 'NORMAL' }]
      textNode(frame, `${name} / Familie`, family.name.toUpperCase(), decision, { size: 12, weight: 700, width: 520 })
      textNode(frame, `${name} / Zustand`, state, decision, { size: 21, weight: 700, width: 520 })
      textNode(frame, `${name} / Status`, dialogStatus(state), decision, { size: 12, weight: 700, width: 520 })
      textNode(frame, `${name} / Inhalt`, 'Der Dialog zeigt Status, Begründung und den nächsten sicheren Schritt. Lange Inhalte bleiben scrollbar.', decision, { size: 15, width: 520 })
      textNode(frame, `${name} / Aktionen`, 'Schließen · Zurück · Fortfahren / Erneut versuchen', decision, { size: 15, weight: 500, width: 520 })
      frame.setPluginData('ondaDialogFamily', family.name)
      frame.setPluginData('ondaDialogState', state)
      count += 1
    }
    row += Math.ceil(family.states.length / 3)
  }
  return count
}

function createMenus(section, decision) {
  const views = [
    ['Dokumentmenü · geschlossen', 'Mehr Aktionen · nicht geöffnet'],
    ['Dokumentmenü · offen', 'Umbenennen · Duplizieren · Exportieren · Archivieren'],
    ['Quellenleser · offen', 'Original verifiziert · Fundstelle übernehmen · Zurück'],
    ['Recherchelauf · pausiert', 'Fortsetzen · Plan ändern · Lauf abbrechen'],
    ['Entscheidungsverlauf · gefüllt', 'Übernommen · Rückgängig · Abgelehnt · Gültigkeit geändert'],
    ['Leerer Zustand · Recovery', 'Noch keine Daten · Importieren oder zum Editor zurückkehren'],
  ]
  for (const [index, [name, detail]] of views.entries()) {
    const frame = autoFrame(section, name, { x: 80 + index % 2 * 980, y: 140 + Math.floor(index / 2) * 560, width: 900, padding: 28, gap: 16, radius: name.includes('menü · offen') ? 8 : 6 }).node
    textNode(frame, `${name} / Titel`, name, decision, { size: 21, weight: 700, width: 820 })
    textNode(frame, `${name} / Inhalt`, detail, decision, { size: 15, width: 820 })
    textNode(frame, `${name} / Fokus`, '◎ Fokus sichtbar · Trefferflächen mindestens 44 × 44 px', decision, { size: 12, weight: 700, width: 820 })
  }
}

function createResponsiveDark(section, decision) {
  const widths = [1440, 1024, 720, 320]
  for (const [index, width] of widths.entries()) {
    const view = createEditorView(section, decision, `${width}px · ${width === 320 ? 'Kleinbreite' : 'Responsive'}`, 80, false, width)
    view.y = 120 + index * 1100
  }
  const dark = createEditorView(section, decision, '1440px · Dark', 80, true, 1440)
  dark.y = 4520
}

function createPrototype(section, decision) {
  const flows = [
    ['Hauptablauf', 'Bibliothek → Projekt → Dokument → Anmerkung → Übernehmen → Rückgängig → Schlussaudit → Export'],
    ['Projektwissen', 'Projektverständnis → Projektgedächtnis / Argumentationsdossier / Sprache & Wirkung → Editor'],
    ['Quellen & Recherche', 'Quellen → Import → Recherche planen → Lauf → Prüfung → Fundstelle übernehmen'],
    ['Agent & Beleg', 'Aura → Agentengespräch → Antwort → Fundstelle → Editor'],
  ]
  for (const [index, [name, path]] of flows.entries()) {
    const frame = autoFrame(section, `Prototyp / ${name}`, { x: 80, y: 120 + index * 500, width: 1940, padding: 32, gap: 20, radius: 6 }).node
    textNode(frame, `Prototyp / ${name} / Titel`, name, decision, { size: 21, weight: 700, width: 1800 })
    textNode(frame, `Prototyp / ${name} / Pfad`, path, decision, { size: 15, weight: 500, width: 1800 })
    textNode(frame, `Prototyp / ${name} / Recovery`, 'Fehler → Wiederholen / Einrichten / Korrigieren / Abbrechen · keine tote Zwischenstation', decision, { size: 12, weight: 700, width: 1800 })
  }
}

async function runDialogsAndSecondary(page, ledger) {
  await loadDecisionFonts(ledger.fontDecision)
  const agent = ensureSection(page, ledger, '07 · Agent & Quellen', 1700).node
  createAgentAndSources(agent, ledger.fontDecision)
  const dialogs = ensureSection(page, ledger, '08 · Dialoge', 9800).node
  const dialogStateCount = createDialogs(dialogs, ledger.fontDecision)
  const menus = ensureSection(page, ledger, '09 · Menüs & Nebenansichten', 2200).node
  createMenus(menus, ledger.fontDecision)
  const responsive = ensureSection(page, ledger, '10 · Responsive & Dark', 6200).node
  createResponsiveDark(responsive, ledger.fontDecision)
  const prototype = ensureSection(page, ledger, '11 · Prototyp', 2400).node
  createPrototype(prototype, ledger.fontDecision)
  return { sections: 5, dialogFamilies: DIALOG_FAMILIES.length, dialogStates: dialogStateCount, responsiveWidths: 4, darkReferences: 1, prototypeFlows: 4 }
}

function collectOndaNodes(sections) {
  const nodes = []
  function visit(node) {
    nodes.push(node)
    if ('children' in node) for (const child of node.children) visit(child)
  }
  for (const section of sections) visit(section)
  return nodes
}

function paintsFromNodes(nodes) {
  const paints = []
  for (const node of nodes) {
    for (const property of ['fills', 'strokes']) {
      if (!(property in node) || !Array.isArray(node[property])) continue
      for (const paint of node[property]) {
        if (paint?.type === 'SOLID' && paint.color) paints.push(paint.color)
      }
    }
    if ('effects' in node && Array.isArray(node.effects)) {
      for (const effect of node.effects) if (effect?.color) paints.push({ r: effect.color.r, g: effect.color.g, b: effect.color.b })
    }
  }
  return paints
}

function radiiFromNodes(nodes) {
  const radii = []
  for (const node of nodes) {
    if (!('cornerRadius' in node) || typeof node.cornerRadius !== 'number') continue
    radii.push({ value: node.cornerRadius, geometry: node.type === 'ELLIPSE' ? 'ELLIPSE' : 'RECTANGLE', id: node.id, name: node.name })
  }
  return radii
}

function currentBaselineEvidence(page, ledger) {
  const baselineIds = new Set(ledger.baseline.nodeIds)
  const records = orderRecordsByBaselineIds(collectRecordsFromDocument(baselineIds), ledger.baseline.nodeIds)
  const currentById = new Map(records.map(record => [record.id, hashBaselineRecords([record])]))
  const mismatches = ledger.baseline.nodeHashes.filter(item => currentById.get(item.id) !== item.hash).map(item => item.id)
  const currentHash = hashBaselineRecords(records)
  const presentTopLevel = page.children.filter(node => ledger.baseline.topLevelIds.includes(node.id)).length
  return {
    records,
    currentHash,
    mismatches,
    presentTopLevel,
    pages: pageInvariantSnapshot(),
  }
}

async function runVerify() {
  const inspection = await inspectCurrentTarget()
  if (!inspection.target.ok) throw new Error(inspection.target.warning)
  const page = figma.currentPage
  const ledger = readLedger(page)
  if (!ledger) throw new Error('Noch kein Onda-Ledger vorhanden. Inspect und mindestens eine Mutationsphase ausführen.')
  const requiredNames = new Set(SECTION_DEFINITIONS.map(section => section.name))
  const sections = page.children.filter(node => node.type === 'SECTION' && requiredNames.has(node.name))
  const allNodes = collectOndaNodes(sections)
  const annotationKinds = sections.map(section => section.getPluginData('ondaAnnotationKind')).filter(Boolean)
  const dialogFamilies = allNodes.map(node => node.getPluginData?.('ondaDialogFamily')).filter(Boolean)
  const baseline = currentBaselineEvidence(page, ledger)
  const report = buildVerificationReport({
    pageCount: figma.root.children.length,
    sectionNames: sections.map(section => section.name),
    annotationKinds,
    dialogFamilies,
    paints: paintsFromNodes(allNodes),
    radii: radiiFromNodes(allNodes),
    topLevelNames: sections.map(section => section.name),
    baselineTopLevelCount: ledger.baseline.topLevelCount,
    preservedTopLevelCount: baseline.presentTopLevel,
    baselineHash: ledger.baseline.hash,
    currentBaselineHash: baseline.currentHash,
    baselineMismatches: baseline.mismatches,
    baselinePages: ledger.baseline.pages,
    currentPages: baseline.pages,
  })
  report.targetFileKey = figma.fileKey || null
  report.targetPageName = page.name
  report.expectedFileKey = TARGET_FILE_KEY
  report.fontFallback = ledger.fontDecision.exact ? '' : ledger.fontDecision.warning
  report.planErrors = validateDesignPlan(buildDesignPlan())
  report.sectionTypeFallbacks = SECTION_DEFINITIONS.filter(definition => {
    const matching = page.children.find(node => node.name === definition.name)
    return matching && matching.type !== 'SECTION'
  }).map(definition => definition.name)
  report.nonGrayPaintNodeCount = paintsFromNodes(allNodes).filter(paint => !isGrayColor(paint)).length
  report.invalidRadiusNodes = radiiFromNodes(allNodes).filter(radius => !isValidRadius(radius.value, radius.geometry)).map(radius => ({ id: radius.id, name: radius.name, value: radius.value }))
  report.preservedBaselineHash = report.preservedBaselineHash && baseline.mismatches.length === 0
  report.baselineHash = ledger.baseline.hash
  report.currentBaselineHash = baseline.currentHash
  return report
}

function postResult(command, ok, message, counts = null, unlockMutations = Boolean(lastInspection?.target.ok)) {
  figma.ui.postMessage({ type: 'phase-result', command, ok, message, counts, unlockMutations })
}

async function handleCommand(command) {
  if (command === 'inspect') {
    const inspection = await inspectCurrentTarget()
    postResult(command, inspection.target.ok, inspectionMessage(inspection), {
      pageCount: inspection.pageCount,
      baselineTopLevelCount: inspection.ledger?.baseline.topLevelCount ?? inspection.pendingBaseline.topLevelCount,
      baselineNodeCount: inspection.ledger?.baseline.nodeIds.length ?? inspection.pendingBaseline.nodeIds.length,
      fontFamily: inspection.fontDecision.family,
      exactFont: inspection.fontDecision.exact,
      targetFallback: inspection.target.fallback,
    }, inspection.target.ok)
    return
  }
  if (command === 'verify') {
    const report = await runVerify()
    const hardPass = report.pageInvariant
      && report.preservedBaselineHash
      && report.pageCount === 1
      && report.sectionCount === 39
      && report.missingSections.length === 0
      && report.annotationCount === 29
      && report.dialogFamilyCount === 7
      && report.nonGrayPaints === 0
      && report.invalidRadii === 0
      && report.duplicateNames.length === 0
      && report.planErrors.length === 0
    postResult(command, hardPass, hardPass ? 'Alle strukturellen Hard Gates bestanden.' : 'Verify hat offene Hard Gates gefunden.', report, true)
    return
  }
  const { page, ledger } = await requireMutationContext()
  let counts
  if (command === 'foundations') counts = await runFoundations(page, ledger)
  else if (command === 'core-views') counts = await runCoreViews(page, ledger)
  else if (command === 'dialogs-and-secondary') counts = await runDialogsAndSecondary(page, ledger)
  else if (command.startsWith('component-')) counts = await runComponent(page, ledger, command.slice('component-'.length))
  else if (command.startsWith('annotations-')) counts = await runAnnotationBatch(page, ledger, Number(command.slice('annotations-'.length)) - 1)
  else throw new Error(`Unbekannter Befehl: ${command}`)
  markPhase(page, ledger, command, counts)
  postResult(command, true, 'Phase erfolgreich abgeschlossen und strukturell gezählt.', counts, true)
}

figma.ui.onmessage = async message => {
  if (!message || message.type !== 'run-command') return
  try {
    await handleCommand(message.command)
  } catch (error) {
    postResult(message.command, false, error instanceof Error ? error.message : String(error), null, Boolean(lastInspection?.target.ok))
  }
}
