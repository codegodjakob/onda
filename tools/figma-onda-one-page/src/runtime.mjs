import {
  ANNOTATION_SECTIONS,
  COMPONENT_DEFINITIONS,
  CORE_OVERVIEW_DEFINITION,
  CORE_VIEW_DEFINITIONS,
  DIALOG_FAMILIES,
  FOUNDATION_EXPECTATIONS,
  LEDGER_KEY,
  PALETTE,
  PLUGIN_ORIGIN,
  RADIUS_TOKENS,
  SEMANTIC_COLOR_ROLES,
  SECONDARY_VIEW_DEFINITIONS,
  SECTION_DEFINITIONS,
  SPACING_TOKENS,
  TARGET_DOCUMENT_NAME,
  TARGET_FILE_KEY,
  TARGET_PAGE_NAME,
  TYPE_SCALE,
  TYPE_WEIGHTS,
  annotationBatch,
} from './definitions.mjs'
import {
  authorizeMutation,
  buildBaselineShards,
  buildComponentRecoveryActions,
  buildSecondaryViewRecoveryActions,
  CORE_LEGACY_VIEW_NAMES,
  buildVerificationReport,
  canReuseOwnedNode,
  collectFieldVariableIds,
  collectComponentInventoryLocations,
  collectComponentPropertyInventory,
  collectTextRangeBindings,
  collectVisibleFillBindings,
  computeOndaOrigin,
  collectComponentCandidateLocations,
  executeComponentMutation,
  executeGuardedComponentCommand,
  executeGuardedCoreViewCommand,
  executeGuardedSecondaryViewCommand,
  executeStagingAssembly,
  executeFoundationMutation,
  hashBaselineRecords,
  isGrayColor,
  isValidRadius,
  orderRecordsByBaselineIds,
  protectedChildIds,
  readEffectStyleId,
  readMainComponentIdentity,
  reconcileLegacyCoreChildren,
  revalidateComponentNodeRecords,
  restoreBaselineShards,
  selectOwnedEntity,
  selectFontDecision,
  foundationCodeSyntax,
  foundationSwatchLabelToken,
  validateDesignPlan,
  validateComponentMutationInventory,
  validateCoreViewMutationInventory,
  validateFoundationMutationInventory,
  validateSecondaryViewMutationInventory,
  validatePhaseTransition,
  validateTargetContext,
  buildDesignPlan,
} from './plan.mjs'

const SECTION_WIDTH = 2100
const SECTION_CELL_WIDTH = 2400
const SECTION_CELL_HEIGHT = 11000
const SECTION_COLUMNS = 3
const CREATED_MARKER_KEY = 'ondaOrigin'
const BASELINE_SHARD_PREFIX = 'ondaBaselineShard:'

let lastInspection = null

figma.showUI(__html__, { width: 420, height: 720, themeColors: true })

function foundationEntityRecord(entity) {
  return {
    id: entity.id,
    name: entity.name,
    owner: entity.getSharedPluginData('onda', 'owner'),
    entity,
  }
}

function markFoundationEntity(entity) {
  entity.setSharedPluginData('onda', 'owner', PLUGIN_ORIGIN)
  return entity
}

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

async function nodeRecord(node, baselineIds = null) {
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
      const identity = await readMainComponentIdentity(node)
      mainComponentId = identity.id
      mainComponentKey = identity.key
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

async function collectRecordsFromDocument(baselineIds = null) {
  const records = []
  async function visit(node) {
    const belongs = !baselineIds || baselineIds.has(node.id)
    if (belongs) records.push(await nodeRecord(node, baselineIds))
    if ('children' in node) {
      for (const child of node.children) await visit(child)
    }
  }
  if (!baselineIds || baselineIds.has(figma.root.id)) records.push(await nodeRecord(figma.root, baselineIds))
  for (const page of figma.root.children) {
    if (!baselineIds || baselineIds.has(page.id)) records.push(await nodeRecord(page, baselineIds))
    for (const child of page.children) await visit(child)
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

function writeBaselineShards(page, records) {
  const previous = readLedger(page)?.baseline?.shardCount || 0
  const shards = buildBaselineShards(records)
  for (const [index, shard] of shards.entries()) page.setPluginData(`${BASELINE_SHARD_PREFIX}${index}`, shard)
  for (let index = shards.length; index < previous; index += 1) page.setPluginData(`${BASELINE_SHARD_PREFIX}${index}`, '')
  return shards.length
}

function readBaselineRecords(page, ledger) {
  const count = Number(ledger?.baseline?.shardCount || 0)
  if (!count) return []
  return restoreBaselineShards(Array.from({ length: count }, (_, index) => page.getPluginData(`${BASELINE_SHARD_PREFIX}${index}`)))
}

function inspectFonts(fonts) {
  return selectFontDecision(fonts)
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
  const records = ledger ? null : await collectRecordsFromDocument()
  const topLevelIds = ledger ? [] : page.children.map(node => node.id)
  const result = {
    target,
    documentId: figma.root.id,
    pageId: page.id,
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
      topLevelIds,
      topLevelCount: topLevelIds.length,
      pages: pageInvariantSnapshot(),
    },
  }
  lastInspection = result
  return result
}

function inspectionMessage(inspection) {
  const targetText = inspection.target.ok || inspection.target.readOnlyOk
    ? `Ziel geprüft: ${inspection.documentName} · ${inspection.pageName}.`
    : inspection.target.warning
  const readOnlyWarning = inspection.target.readOnlyOk ? inspection.target.warning : ''
  const fontText = inspection.fontDecision.warning || 'ABC Diatype mit exakten Schnitten verfügbar.'
  return `${targetText} ${readOnlyWarning} ${fontText}`.trim()
}

async function requireMutationContext() {
  let inspection = lastInspection || await inspectCurrentTarget()
  const page = figma.currentPage
  if (inspection.documentId !== figma.root.id || inspection.pageId !== page.id) inspection = await inspectCurrentTarget()
  const authorization = authorizeMutation(inspection.target)
  if (!authorization.ok) throw new Error(authorization.warning || inspection.target.warning)
  let ledger = readLedger(page)
  if (ledger?.version === 1) {
    const legacyIds = ledger.baseline.nodeIds || []
    const currentRecords = orderRecordsByBaselineIds(await collectRecordsFromDocument(new Set(legacyIds)), legacyIds)
    if (hashBaselineRecords(currentRecords) !== ledger.baseline.hash) throw new Error('Legacy-Baseline weicht ab; sichere Shard-Migration abgebrochen.')
    const shardCount = writeBaselineShards(page, currentRecords)
    ledger.version = 2
    ledger.baseline = {
      hash: ledger.baseline.hash,
      shardCount,
      recordCount: currentRecords.length,
      topLevelCount: ledger.baseline.topLevelCount,
      pages: ledger.baseline.pages,
    }
    writeLedger(page, ledger)
  }
  if (!ledger) {
    const baseline = inspection.pendingBaseline
    if (!baseline) throw new Error('Inspect muss vor der ersten Mutation erneut ausgeführt werden.')
    function boundsTree(node) {
      return {
        x: node.x, width: node.width, absoluteRenderBounds: node.absoluteRenderBounds,
        children: 'children' in node ? node.children.map(boundsTree) : [],
      }
    }
    const origin = computeOndaOrigin(page.children.map(boundsTree))
    const shardCount = writeBaselineShards(page, baseline.records)
    ledger = {
      version: 2,
      origin: { x: origin, y: 0 },
      target: {
        fileKey: figma.fileKey || null,
        documentName: figma.root.name,
        pageId: page.id,
        pageName: page.name,
      },
      fontDecision: inspection.fontDecision,
      baseline: {
        hash: baseline.hash,
        shardCount,
        recordCount: baseline.records.length,
        topLevelCount: baseline.topLevelCount,
        pages: baseline.pages,
      },
      phases: { inspect: { status: 'success', at: new Date().toISOString() } },
      createdAt: new Date().toISOString(),
    }
    writeLedger(page, ledger)
  }
  if (ledger.target.pageId !== page.id || ledger.target.pageName !== TARGET_PAGE_NAME) {
    throw new Error('Das gespeicherte Onda-Ledger gehört nicht zur aktuellen Page 1.')
  }
  const records = readBaselineRecords(page, ledger)
  Object.defineProperty(ledger, 'baselineRecords', { value: records, enumerable: false, configurable: true })
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
    }, new Set((ledger.baselineRecords || []).map(record => record.id)))
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
  const frame = existing || figma.createFrame()
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
  if (!existing) parent.appendChild(frame)
  if (Number.isFinite(options.x)) frame.x = options.x
  if (Number.isFinite(options.y)) frame.y = options.y
  frame.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  return { node: frame, created: !existing }
}

async function loadDecisionFonts(decision) {
  const fontNames = TYPE_WEIGHTS.map(weight => ({ family: decision.family, style: decision.styles[weight] }))
  const unique = [...new Map(fontNames.map(font => [`${font.family}/${font.style}`, font])).values()]
  await Promise.all(unique.map(font => figma.loadFontAsync(font)))
}

function textNode(parent, name, characters, decision, options = {}) {
  const existing = directChild(parent, name, ['TEXT'])
  const text = existing || figma.createText()
  text.name = name
  const weight = options.weight || 400
  text.fontName = { family: decision.family, style: decision.styles[weight] }
  text.fontSize = options.size || 15
  const scale = TYPE_SCALE.find(item => item.size === text.fontSize)
  text.lineHeight = { unit: 'PIXELS', value: scale?.lineHeight || Math.round(text.fontSize * 1.45) }
  text.characters = characters
  text.fills = [solid(options.dark ? 'gray/000' : options.muted ? 'gray/500' : 'gray/900')]
  if (!existing) parent.appendChild(text)
  if (options.width) {
    text.textAutoResize = 'HEIGHT'
    text.resize(options.width, Math.max(text.height, 16))
  }
  text.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  return { node: text, created: !existing }
}

function heading(parent, title, decision, subtitle = '') {
  textNode(parent, `${title} / Titel`, title, decision, { size: 40, weight: 700, width: 1500 })
  if (subtitle) textNode(parent, `${title} / Untertitel`, subtitle, decision, { size: 15, muted: true, width: 1500 })
}

function foundationVariableNamesByCollection() {
  return new Map([
    ['Onda · Primitive', Object.keys(PALETTE)],
    ['Onda · Dimension', [...SPACING_TOKENS.map(token => token.name), ...RADIUS_TOKENS.map(token => token.name)]],
    ['Onda · Semantic · Light', SEMANTIC_COLOR_ROLES.map(role => role.name)],
    ['Onda · Semantic · Dark', SEMANTIC_COLOR_ROLES.map(role => role.name)],
    ['Onda · Typography', [
      ...TYPE_SCALE.map(scale => `font-size/${scale.size}`),
      ...TYPE_WEIGHTS.map(weight => `font-weight/${weight}`),
    ]],
  ])
}

async function collectFoundationMutationInventory() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync()
  const collectionById = new Map(collections.map(collection => [collection.id, collection]))
  const variables = await figma.variables.getLocalVariablesAsync()
  const textStyles = await figma.getLocalTextStylesAsync()
  const effectStyles = await figma.getLocalEffectStylesAsync()
  return {
    collections: collections.map(collection => ({
      id: collection.id,
      name: collection.name,
      owner: collection.getSharedPluginData('onda', 'owner'),
      modes: collection.modes.map(mode => ({ modeId: mode.modeId, name: mode.name })),
    })),
    variables: variables.map(variable => {
      const collection = collectionById.get(variable.variableCollectionId)
      return {
        id: variable.id,
        name: variable.name,
        owner: variable.getSharedPluginData('onda', 'owner'),
        collectionId: variable.variableCollectionId,
        collectionName: collection?.name || '',
        resolvedType: variable.resolvedType,
        scopes: [...variable.scopes],
        modeId: collection?.modes?.[0]?.modeId || null,
      }
    }),
    textStyles: textStyles.map(style => ({
      id: style.id,
      name: style.name,
      owner: style.getSharedPluginData('onda', 'owner'),
    })),
    effectStyles: effectStyles.map(style => ({
      id: style.id,
      name: style.name,
      owner: style.getSharedPluginData('onda', 'owner'),
    })),
  }
}

async function preflightFoundationMutation() {
  const inventory = await collectFoundationMutationInventory()
  const result = validateFoundationMutationInventory(inventory)
  if (!result.valid) throw new Error(`Foundation-Preflight abgebrochen:\n${result.errors.join('\n')}`)
  return inventory
}

async function preflightFoundationOwnership() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync()
  const variables = await figma.variables.getLocalVariablesAsync()
  for (const [collectionName, variableNames] of foundationVariableNamesByCollection()) {
    const collectionRecord = selectOwnedEntity(collections.map(foundationEntityRecord), collectionName, 'VariableCollection')
    if (!collectionRecord) continue
    const collectionVariables = variables
      .filter(variable => variable.variableCollectionId === collectionRecord.id)
      .map(foundationEntityRecord)
    for (const variableName of variableNames) selectOwnedEntity(collectionVariables, variableName, 'Variable')
  }
  const textStyles = (await figma.getLocalTextStylesAsync()).map(foundationEntityRecord)
  for (const definition of FOUNDATION_EXPECTATIONS.textStyles) selectOwnedEntity(textStyles, definition.name, 'TextStyle')
  const effectStyles = (await figma.getLocalEffectStylesAsync()).map(foundationEntityRecord)
  for (const name of FOUNDATION_EXPECTATIONS.effectStyles) selectOwnedEntity(effectStyles, name, 'EffectStyle')
}

async function ensureCollection(name, modeName) {
  const collections = await figma.variables.getLocalVariableCollectionsAsync()
  const existing = selectOwnedEntity(collections.map(foundationEntityRecord), name, 'VariableCollection')?.entity
  if (existing) {
    if (existing.modes[0]?.name !== modeName) existing.renameMode(existing.modes[0].modeId, modeName)
    return { collection: existing, modeId: existing.modes[0].modeId, created: false }
  }
  const collection = figma.variables.createVariableCollection(name)
  markFoundationEntity(collection)
  collection.renameMode(collection.modes[0].modeId, modeName)
  return { collection, modeId: collection.modes[0].modeId, created: true }
}

async function ensureVariable(collection, modeId, definition) {
  const variables = await figma.variables.getLocalVariablesAsync()
  const existing = selectOwnedEntity(
    variables.filter(variable => variable.variableCollectionId === collection.id).map(foundationEntityRecord),
    definition.name,
    'Variable',
  )?.entity
  if (existing && existing.resolvedType !== definition.type) throw new Error(`Onda-Variable hat den falschen Typ: ${definition.name}`)
  const variable = existing || figma.variables.createVariable(definition.name, collection, definition.type)
  if (!existing) markFoundationEntity(variable)
  variable.setValueForMode(modeId, definition.value)
  if (definition.type !== 'BOOLEAN') variable.scopes = definition.scopes || []
  variable.setVariableCodeSyntax('WEB', definition.codeSyntax)
  return { variable, created: !existing }
}

async function createFoundationVariables() {
  const primitiveInfo = await ensureCollection('Onda · Primitive', 'Value')
  const dimensionInfo = await ensureCollection('Onda · Dimension', 'Value')
  const lightInfo = await ensureCollection('Onda · Semantic · Light', 'Light')
  const darkInfo = await ensureCollection('Onda · Semantic · Dark', 'Dark')
  const typographyInfo = await ensureCollection('Onda · Typography', 'Value')
  const created = []
  const primitiveByName = {}
  const variablesByKey = new Map()
  for (const [name, value] of Object.entries(PALETTE)) {
    const result = await ensureVariable(primitiveInfo.collection, primitiveInfo.modeId, {
      name, type: 'COLOR', value, scopes: [], codeSyntax: foundationCodeSyntax('Onda · Primitive', name),
    })
    primitiveByName[name] = result.variable
    variablesByKey.set(`Onda · Primitive\u0000${name}`, result.variable)
    if (result.created) created.push(result.variable.id)
  }
  for (const role of SEMANTIC_COLOR_ROLES) {
    for (const [info, primitiveName] of [
      [lightInfo, role.light], [darkInfo, role.dark],
    ]) {
      const result = await ensureVariable(info.collection, info.modeId, {
        name: role.name,
        type: 'COLOR',
        value: figma.variables.createVariableAlias(primitiveByName[primitiveName]),
        scopes: role.scopes,
        codeSyntax: foundationCodeSyntax(info.collection.name, role.name),
      })
      variablesByKey.set(`${info.collection.name}\u0000${role.name}`, result.variable)
      if (result.created) created.push(result.variable.id)
    }
  }
  const dimensions = [
    ...SPACING_TOKENS.map(token => ({ ...token, scope: 'GAP' })),
    ...RADIUS_TOKENS.map(token => ({ name: token.name, value: token.value, scope: 'CORNER_RADIUS' })),
  ]
  for (const item of dimensions) {
    const result = await ensureVariable(dimensionInfo.collection, dimensionInfo.modeId, {
      name: item.name, type: 'FLOAT', value: item.value, scopes: [item.scope], codeSyntax: foundationCodeSyntax('Onda · Dimension', item.name),
    })
    variablesByKey.set(`Onda · Dimension\u0000${item.name}`, result.variable)
    if (result.created) created.push(result.variable.id)
  }
  for (const item of TYPE_SCALE) {
    const result = await ensureVariable(typographyInfo.collection, typographyInfo.modeId, {
      name: `font-size/${item.size}`, type: 'FLOAT', value: item.size, scopes: ['FONT_SIZE'], codeSyntax: foundationCodeSyntax('Onda · Typography', `font-size/${item.size}`),
    })
    variablesByKey.set(`Onda · Typography\u0000font-size/${item.size}`, result.variable)
    if (result.created) created.push(result.variable.id)
  }
  for (const weight of TYPE_WEIGHTS) {
    const result = await ensureVariable(typographyInfo.collection, typographyInfo.modeId, {
      name: `font-weight/${weight}`, type: 'FLOAT', value: weight, scopes: ['FONT_WEIGHT'], codeSyntax: foundationCodeSyntax('Onda · Typography', `font-weight/${weight}`),
    })
    variablesByKey.set(`Onda · Typography\u0000font-weight/${weight}`, result.variable)
    if (result.created) created.push(result.variable.id)
  }
  return {
    collections: [primitiveInfo, dimensionInfo, lightInfo, darkInfo, typographyInfo].map(info => info.collection.id),
    createdVariableIds: created,
    variablesByKey,
  }
}

async function createFoundationStyles(decision, variablesByKey) {
  const existingText = await figma.getLocalTextStylesAsync()
  const createdText = []
  const textStyles = []
  for (const definition of FOUNDATION_EXPECTATIONS.textStyles) {
    const existing = selectOwnedEntity(existingText.map(foundationEntityRecord), definition.name, 'TextStyle')?.entity
    const style = existing || figma.createTextStyle()
    if (!existing) markFoundationEntity(style)
    style.name = definition.name
    style.fontName = { family: decision.family, style: decision.styles[definition.weight] }
    style.fontSize = definition.size
    style.lineHeight = { unit: 'PIXELS', value: definition.lineHeight }
    style.letterSpacing = { unit: 'PIXELS', value: 0 }
    style.textCase = 'ORIGINAL'
    style.textDecoration = 'NONE'
    style.setBoundVariable('fontSize', variablesByKey.get(`Onda · Typography\u0000font-size/${definition.size}`))
    style.setBoundVariable('fontWeight', variablesByKey.get(`Onda · Typography\u0000font-weight/${definition.weight}`))
    textStyles.push(style)
    if (!existing) createdText.push(style.id)
  }
  const existingEffects = await figma.getLocalEffectStylesAsync()
  const createdEffects = []
  const effectStyles = []
  const effects = [
    { name: 'Onda/Shadow/Overlay', radius: 24, opacity: 0.16, y: 8 },
  ]
  for (const effect of effects) {
    const existing = selectOwnedEntity(existingEffects.map(foundationEntityRecord), effect.name, 'EffectStyle')?.entity
    const style = existing || figma.createEffectStyle()
    if (!existing) markFoundationEntity(style)
    style.name = effect.name
    style.effects = [{
      type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: effect.opacity },
      offset: { x: 0, y: effect.y }, radius: effect.radius, spread: 0,
      visible: true, blendMode: 'NORMAL',
    }]
    effectStyles.push(style)
    if (!existing) createdEffects.push(style.id)
  }
  return { createdTextStyleIds: createdText, createdEffectStyleIds: createdEffects, textStyles, effectStyles }
}

function ensureVariableSwatch(parent, layer, name, variable, fallback, decision, labelVariable, fontSizeVariable, fontWeightVariable) {
  const width = layer === 'primitive' ? 160 : 220
  const swatchName = layer === 'primitive' ? `Swatch / ${name}` : `Swatch / ${layer} / ${name}`
  const swatch = autoFrame(parent, swatchName, {
    width, height: 150, padding: 12, gap: 8, fill: fallback, radius: 4,
  }).node
  swatch.effects = []
  swatch.fills = [figma.variables.setBoundVariableForPaint(solid(fallback), 'color', variable)]
  swatch.setPluginData('ondaFoundationArtifact', 'swatch')
  swatch.setPluginData('ondaFoundationLayer', layer)
  swatch.setPluginData('ondaBoundVariableId', variable.id)
  const label = textNode(swatch, `${swatchName} / Label`, name, decision, {
    size: 12, weight: 500, dark: ['gray/700', 'gray/900', 'gray/1000'].includes(fallback), width: width - 24,
  }).node
  label.fills = [figma.variables.setBoundVariableForPaint(label.fills[0], 'color', labelVariable)]
  label.setBoundVariable('fontSize', fontSizeVariable)
  label.setBoundVariable('fontWeight', fontWeightVariable)
  label.setPluginData('ondaFoundationTextVariableId', labelVariable.id)
  return swatch
}

function ensureSpacingBar(parent, token, variable, decision) {
  const row = autoFrame(parent, `Spacing / ${token.value}`, {
    width: 220, height: 96, direction: 'VERTICAL', padding: 12, gap: 8, radius: 4,
  }).node
  row.effects = []
  const existing = directChild(row, `Spacing Bar / ${token.value}`)
  if (existing && existing.type !== 'RECTANGLE') throw new Error(`Ungültiger bestehender Spacing-Sample: ${token.name}`)
  const bar = existing || figma.createRectangle()
  bar.name = `Spacing Bar / ${token.value}`
  bar.resize(token.value, 16)
  bar.fills = [solid('gray/700')]
  bar.effects = []
  bar.setBoundVariable('width', variable)
  bar.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  bar.setPluginData('ondaFoundationArtifact', 'spacing-bar')
  bar.setPluginData('ondaBoundVariableId', variable.id)
  if (!existing) row.appendChild(bar)
  textNode(row, `Spacing / ${token.value} / Label`, `${token.name} · ${token.value}px`, decision, { size: 12, weight: 500, width: 190 })
  return bar
}

function ensureRadiusSample(parent, token, variable) {
  const name = `Radius / ${token.value}`
  const expectedType = token.geometry === 'ELLIPSE' ? 'ELLIPSE' : 'RECTANGLE'
  const existing = directChild(parent, name)
  if (existing && existing.type !== expectedType) throw new Error(`Ungültiger bestehender Foundation-Sample: ${name}`)
  const sample = existing || (expectedType === 'ELLIPSE' ? figma.createEllipse() : figma.createRectangle())
  sample.name = name
  sample.resize(112, 112)
  sample.fills = [solid('gray/100')]
  sample.strokes = [solid('gray/700')]
  sample.effects = []
  sample.strokeWeight = 1
  if (expectedType === 'RECTANGLE') {
    sample.cornerRadius = token.value
    for (const field of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) sample.setBoundVariable(field, variable)
  }
  if (expectedType === 'ELLIPSE') {
    sample.setBoundVariable('maxWidth', variable)
    sample.setBoundVariable('maxHeight', variable)
  }
  if (!existing) parent.appendChild(sample)
  sample.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  sample.setPluginData('ondaFoundationArtifact', 'radius-sample')
  sample.setPluginData('ondaFoundationGeometry', expectedType)
  sample.setPluginData('ondaBoundVariableId', variable.id)
  return { node: sample, created: !existing }
}

async function ensureEffectStyleCard(parent, style, decision) {
  const card = autoFrame(parent, `Effect / ${style.name}`, { width: 780, height: 150, padding: 24, gap: 8, radius: 8 }).node
  await card.setEffectStyleIdAsync(style.id)
  card.setPluginData('ondaFoundationArtifact', 'effect-style')
  card.setPluginData('ondaEffectStyleName', style.name)
  textNode(card, `Effect / ${style.name} / Label`, style.name, decision, { size: 15, weight: 700, width: 700 })
  textNode(card, `Effect / ${style.name} / Detail`, 'Schatten sind ausschließlich für Floating- und Overlay-Flächen vorgesehen.', decision, { size: 12, muted: true, width: 700 })
  return card
}

async function bindFoundationArtifacts(section) {
  const surface = await localVariable('color/surface', 'Onda · Semantic · Light')
  const background = await localVariable('color/background', 'Onda · Semantic · Light')
  const text = await localVariable('color/text', 'Onda · Semantic · Light')
  const muted = await localVariable('color/text-muted', 'Onda · Semantic · Light')
  const border = await localVariable('color/border', 'Onda · Semantic · Light')
  const spacing = await localVariable('spacing/24', 'Onda · Dimension')
  if (background) section.fills = [figma.variables.setBoundVariableForPaint(solid('gray/025'), 'color', background)]
  const nodes = collectOndaNodes([section])
  for (const node of nodes) {
    const artifact = node.getPluginData('ondaFoundationArtifact')
    if (node.type === 'FRAME' && artifact !== 'swatch' && surface) node.fills = [figma.variables.setBoundVariableForPaint(solid('gray/000'), 'color', surface)]
    if ('strokes' in node && border && node.strokes?.length) node.strokes = [figma.variables.setBoundVariableForPaint(solid('gray/200'), 'color', border)]
    if (node.type === 'TEXT') {
      const variable = /Untertitel|Fontstatus|Label/.test(node.name) ? muted : text
      if (!node.getPluginData('ondaFoundationTextVariableId')) {
        if (variable) node.fills = [figma.variables.setBoundVariableForPaint(solid(variable === muted ? 'gray/500' : 'gray/900'), 'color', variable)]
      }
    }
    if (node.type === 'FRAME' && spacing) node.setBoundVariable('itemSpacing', spacing)
    if ('effects' in node && artifact !== 'effect-style') node.effects = []
    node.setPluginData('ondaFoundationBound', 'true')
  }
}

async function runFoundations(page, ledger) {
  await preflightFoundationOwnership()
  await loadDecisionFonts(ledger.fontDecision)
  const variables = await createFoundationVariables()
  const styles = await createFoundationStyles(ledger.fontDecision, variables.variablesByKey)
  const sectionResult = ensureSection(page, ledger, '01 · Foundations', 6400)
  const section = sectionResult.node
  resizeNode(section, SECTION_WIDTH, 6400)
  const doc = autoFrame(section, 'Foundations / Dokumentation', { x: 80, y: 100, width: 1940, padding: 40, gap: 24, radius: 6 }).node
  doc.effects = []
  heading(doc, 'Foundations', ledger.fontDecision, 'Monochrom · Radien 0/4/6/8 · ABC Diatype bevorzugt · Light und Dark als getrennte Single-Mode-Semantik')
  textNode(doc, 'Foundations / Fontstatus', ledger.fontDecision.warning || '✓ ABC Diatype ist verfügbar.', ledger.fontDecision, {
    size: 15, weight: 700, width: 1800,
  })
  const palette = autoFrame(section, 'Foundations / Graustufen', { x: 80, y: 600, width: 1940, direction: 'HORIZONTAL', padding: 32, gap: 12, radius: 6 }).node
  palette.effects = []
  const labelFontSizeVariable = variables.variablesByKey.get('Onda · Typography\u0000font-size/12')
  const labelFontWeightVariable = variables.variablesByKey.get('Onda · Typography\u0000font-weight/500')
  for (const name of Object.keys(PALETTE)) {
    const labelToken = foundationSwatchLabelToken('primitive', name)
    const labelVariable = variables.variablesByKey.get(`${labelToken.collectionName}\u0000${labelToken.variableName}`)
    ensureVariableSwatch(palette, 'primitive', name, variables.variablesByKey.get(`Onda · Primitive\u0000${name}`), name, ledger.fontDecision, labelVariable, labelFontSizeVariable, labelFontWeightVariable)
  }
  for (const [collectionName, layer, key, y] of [
    ['Onda · Semantic · Light', 'semantic-light', 'light', 1050],
    ['Onda · Semantic · Dark', 'semantic-dark', 'dark', 1500],
  ]) {
    const semantic = autoFrame(section, `Foundations / ${key === 'light' ? 'Semantic Light' : 'Semantic Dark'}`, { x: 80, y, width: 1940, direction: 'HORIZONTAL', padding: 32, gap: 12, radius: 6 }).node
    semantic.effects = []
    for (const role of SEMANTIC_COLOR_ROLES) {
      const labelToken = foundationSwatchLabelToken(layer, role[key])
      const labelVariable = variables.variablesByKey.get(`${labelToken.collectionName}\u0000${labelToken.variableName}`)
      ensureVariableSwatch(semantic, layer, role.name, variables.variablesByKey.get(`${collectionName}\u0000${role.name}`), role[key], ledger.fontDecision, labelVariable, labelFontSizeVariable, labelFontWeightVariable)
    }
  }
  const spacing = autoFrame(section, 'Foundations / Spacing', { x: 80, y: 1950, width: 1940, direction: 'HORIZONTAL', padding: 32, gap: 20, radius: 6 }).node
  spacing.effects = []
  for (const token of SPACING_TOKENS) ensureSpacingBar(spacing, token, variables.variablesByKey.get(`Onda · Dimension\u0000${token.name}`), ledger.fontDecision)

  const type = autoFrame(section, 'Foundations / Typografie', { x: 80, y: 2400, width: 1940, padding: 32, gap: 20, radius: 6 }).node
  type.effects = []
  for (const [index, style] of styles.textStyles.entries()) {
    const definition = FOUNDATION_EXPECTATIONS.textStyles[index]
    const specimen = textNode(type, `Typografie / ${definition.role}`, `${definition.role} · ${definition.size}px · ${definition.weight} · Onda schreibt klar und ruhig.`, ledger.fontDecision, {
      size: definition.size, weight: definition.weight, width: 1800,
    }).node
    await specimen.setTextStyleIdAsync(style.id)
    specimen.setBoundVariable('fontSize', variables.variablesByKey.get(`Onda · Typography\u0000font-size/${definition.size}`))
    specimen.setBoundVariable('fontWeight', variables.variablesByKey.get(`Onda · Typography\u0000font-weight/${definition.weight}`))
    specimen.setPluginData('ondaFoundationArtifact', 'text-style')
    specimen.setPluginData('ondaTextStyleName', style.name)
  }
  const typographyVariables = autoFrame(section, 'Foundations / Typography Variables', { x: 80, y: 3600, width: 1940, direction: 'HORIZONTAL', padding: 32, gap: 20, radius: 6 }).node
  typographyVariables.effects = []
  for (const scale of TYPE_SCALE) textNode(typographyVariables, `Typography Variable / font-size/${scale.size}`, `font-size/${scale.size}`, ledger.fontDecision, { size: 12, width: 180 })
  for (const weight of TYPE_WEIGHTS) textNode(typographyVariables, `Typography Variable / font-weight/${weight}`, `font-weight/${weight}`, ledger.fontDecision, { size: 12, weight, width: 180 })

  const radius = autoFrame(section, 'Foundations / Radien', { x: 80, y: 4050, width: 1940, direction: 'HORIZONTAL', padding: 32, gap: 20, radius: 6 }).node
  radius.effects = []
  for (const token of RADIUS_TOKENS) {
    ensureRadiusSample(radius, token, variables.variablesByKey.get(`Onda · Dimension\u0000${token.name}`))
  }
  const effects = autoFrame(section, 'Foundations / Effects', { x: 80, y: 4500, width: 1940, direction: 'HORIZONTAL', padding: 48, gap: 40, radius: 6 }).node
  effects.effects = []
  for (const style of styles.effectStyles) await ensureEffectStyleCard(effects, style, ledger.fontDecision)
  await bindFoundationArtifacts(section)
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

function componentDefinition(componentId) {
  const definition = COMPONENT_DEFINITIONS.find(component => component.id === componentId)
  if (!definition) throw new Error(`Unbekannte Komponente: ${componentId}`)
  return definition
}

function componentPropertyInventory(set) {
  if (!set || set.type !== 'COMPONENT_SET') return []
  return collectComponentPropertyInventory(set.componentPropertyDefinitions || {})
}

function componentRoleInventory(component) {
  if (!component || !('children' in component)) return []
  return component.children.map(role => ({
    nodeId: role.id,
    name: role.name,
    type: role.type,
    owner: role.getPluginData(CREATED_MARKER_KEY),
    parentId: component.id,
    parentType: component.type,
    parentName: component.name,
    characterPropertyKey: role.type === 'TEXT' ? role.componentPropertyReferences?.characters || null : null,
  }))
}

function collectComponentSectionCandidates(page) {
  return collectComponentInventoryLocations(page)
}

async function collectComponentMutationInventory(componentId) {
  await figma.loadAllPagesAsync()
  componentDefinition(componentId)
  const locations = collectComponentSectionCandidates(figma.currentPage)
  const candidates = locations.candidates
  const sampleNames = new Set(COMPONENT_DEFINITIONS.map(definition => `${definition.name} / Dokumentationsinstanz`))
  const stagingNodes = candidates.filter(candidate => candidate.stagingComponent || candidate.stagingVariant)
  const setNodes = candidates.filter(candidate => !sampleNames.has(candidate.node.name) && !candidate.stagingComponent && !candidate.stagingVariant)
  const sampleNodes = candidates.filter(({ node }) => sampleNames.has(node.name))
  const effectStyleRecords = (await figma.getLocalEffectStylesAsync()).map(foundationEntityRecord)
  const effectStyleById = new Map(effectStyleRecords.map(record => [record.id, record]))
  async function effectStyleInventory(node) {
    const effectStyleId = await readEffectStyleId(node)
    const style = effectStyleId ? effectStyleById.get(effectStyleId) : null
    return { effectStyleId, effectStyleName: style?.name || null, effectStyleOwner: style?.owner || null }
  }
  function ancestry(location) {
    return {
      parentId: location.parentId, parentType: location.parentType, parentName: location.parentName,
      containerId: location.containerId, containerType: location.containerType, containerName: location.containerName,
      containerOwner: location.containerOwner, containerParentId: location.containerParentId,
      containerParentType: location.containerParentType, containerParentName: location.containerParentName,
    }
  }
  const samples = []
  for (const location of sampleNodes) {
    const sample = location.node
    const identity = sample.type === 'INSTANCE' ? await readMainComponentIdentity(sample) : { id: null }
    samples.push({
      nodeId: sample.id,
      name: sample.name,
      type: sample.type,
      owner: sample.getPluginData(CREATED_MARKER_KEY),
      ...ancestry(location),
      documentation: sample.getPluginData('ondaDocumentationInstance') === 'true',
      repeatedScreen: sample.getPluginData('ondaRepeatedScreenInstance') === 'true',
      mainComponentId: identity.id,
    })
  }
  const sets = await Promise.all(setNodes.map(async location => {
    const set = location.node
    return {
      nodeId: set.id,
      name: set.name,
      type: set.type,
      owner: set.getPluginData(CREATED_MARKER_KEY),
      ...ancestry(location),
      componentProperties: componentPropertyInventory(set),
      variants: 'children' in set ? await Promise.all(set.children.map(async variant => ({
        nodeId: variant.id,
        name: variant.name,
        type: variant.type,
        owner: variant.getPluginData(CREATED_MARKER_KEY),
        parentId: set.id,
        parentType: set.type,
        parentName: set.name,
        ...await effectStyleInventory(variant),
        roles: componentRoleInventory(variant),
      }))) : [],
    }
  }))
  const staging = await Promise.all(stagingNodes.map(async location => {
    const component = location.node
    return {
      nodeId: component.id,
      name: component.name,
      type: component.type,
      owner: component.getPluginData(CREATED_MARKER_KEY),
      stagingComponent: location.stagingComponent,
      stagingVariant: location.stagingVariant,
      ...ancestry(location),
      ...await effectStyleInventory(component),
      roles: componentRoleInventory(component),
    }
  }))
  return {
    targetPage: locations.targetPage,
    containers: locations.containers.map(({ node: _node, ...container }) => container),
    sets,
    samples,
    staging,
  }
}

async function preflightComponentMutation(componentId) {
  const inventory = await collectComponentMutationInventory(componentId)
  const result = validateComponentMutationInventory(inventory, componentId)
  if (!result.valid) throw new Error(result.errors.join('\n'))
  return inventory
}

async function componentVariables() {
  const requests = [
    ['surface', 'color/surface', 'Onda · Semantic · Light'],
    ['inverted', 'color/inverted', 'Onda · Semantic · Light'],
    ['text', 'color/text', 'Onda · Semantic · Light'],
    ['textMuted', 'color/text-muted', 'Onda · Semantic · Light'],
    ['onInverted', 'color/on-inverted', 'Onda · Semantic · Light'],
    ['border', 'color/border', 'Onda · Semantic · Light'],
    ['spacing8', 'spacing/8', 'Onda · Dimension'],
    ['spacing12', 'spacing/12', 'Onda · Dimension'],
    ['spacing16', 'spacing/16', 'Onda · Dimension'],
    ['spacing24', 'spacing/24', 'Onda · Dimension'],
    ['spacing32', 'spacing/32', 'Onda · Dimension'],
    ['radiusNone', 'radius/none', 'Onda · Dimension'],
    ['radiusControl', 'radius/control', 'Onda · Dimension'],
    ['radiusStatic', 'radius/static', 'Onda · Dimension'],
    ['radiusOverlay', 'radius/overlay', 'Onda · Dimension'],
    ['radiusCircle', 'radius/circle', 'Onda · Dimension'],
  ]
  const entries = await Promise.all(requests.map(async ([key, name, collection]) => [key, await localVariable(name, collection)]))
  const variables = Object.fromEntries(entries)
  const missing = requests.filter(([key]) => !variables[key]).map(([, name, collection]) => `${collection}/${name}`)
  if (missing.length) throw new Error(`Komponentenvariablen fehlen: ${missing.join(', ')}`)
  const effectStyleRecords = (await figma.getLocalEffectStylesAsync()).map(foundationEntityRecord)
  const effectStyleByName = {}
  for (const name of new Set(COMPONENT_DEFINITIONS.map(definition => definition.effectStyleName).filter(Boolean))) {
    const effectStyle = selectOwnedEntity(effectStyleRecords, name, 'EffectStyle')?.entity
    if (!effectStyle) throw new Error(`Komponenten-Effektstil fehlt: ${name}`)
    effectStyleByName[name] = effectStyle
  }
  return {
    ...variables,
    effectStyleByName,
    semanticByToken: {
      'color/surface': variables.surface,
      'color/inverted': variables.inverted,
      'color/text': variables.text,
      'color/text-muted': variables.textMuted,
      'color/on-inverted': variables.onInverted,
      'color/border': variables.border,
    },
    dimensionByToken: {
      'spacing/8': variables.spacing8,
      'spacing/12': variables.spacing12,
      'spacing/16': variables.spacing16,
      'spacing/24': variables.spacing24,
      'spacing/32': variables.spacing32,
      'radius/none': variables.radiusNone,
      'radius/control': variables.radiusControl,
      'radius/static': variables.radiusStatic,
      'radius/overlay': variables.radiusOverlay,
      'radius/circle': variables.radiusCircle,
    },
  }
}

function boundComponentPaint(token, variable) {
  const palette = {
    'color/surface': 'gray/000',
    'color/inverted': 'gray/900',
    'color/text': 'gray/900',
    'color/text-muted': 'gray/500',
    'color/on-inverted': 'gray/000',
    'color/border': 'gray/300',
  }
  return [figma.variables.setBoundVariableForPaint(solid(palette[token]), 'color', variable)]
}

function configureComponentRole(role, roleDefinition, copy, decision, textVariable, variables) {
  role.name = `Role/${roleDefinition.name}`
  role.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  role.effects = []
  role.fills = boundComponentPaint(textVariable.name, textVariable.variable)
  if (role.type === 'TEXT') {
    role.fontName = { family: decision.family, style: decision.styles[roleDefinition.name === 'Icon' ? 700 : 500] }
    role.fontSize = roleDefinition.name === 'Description' ? 12 : 15
    role.lineHeight = { unit: 'PIXELS', value: roleDefinition.name === 'Description' ? 16 : 22 }
    role.characters = copy[roleDefinition.name]
  } else {
    role.resize(16, 16)
    role.setBoundVariable('maxWidth', variables.radiusCircle)
    role.setBoundVariable('maxHeight', variables.radiusCircle)
  }
}

async function configureComponentVariant(component, definition, variantDefinition, decision, variables) {
  component.name = variantDefinition.name
  component.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  component.layoutMode = definition.direction
  component.primaryAxisSizingMode = 'AUTO'
  component.counterAxisSizingMode = 'AUTO'
  component.primaryAxisAlignItems = 'CENTER'
  component.counterAxisAlignItems = 'CENTER'
  component.itemSpacing = definition.gap
  component.paddingTop = definition.padding.top
  component.paddingRight = definition.padding.right
  component.paddingBottom = definition.padding.bottom
  component.paddingLeft = definition.padding.left
  component.cornerRadius = definition.radius
  component.minHeight = definition.targetHeight
  component.opacity = variantDefinition.opacity
  component.fills = boundComponentPaint(variantDefinition.surfaceToken, variables.semanticByToken[variantDefinition.surfaceToken])
  component.strokes = boundComponentPaint('color/border', variables.border)
  component.strokeWeight = variantDefinition.strokeWeight
  component.effects = []
  if (definition.effectStyleName) {
    const effectStyle = variables.effectStyleByName[definition.effectStyleName]
    if (!effectStyle) throw new Error(`Komponenten-Effektstil fehlt: ${definition.effectStyleName}`)
    await component.setEffectStyleIdAsync(effectStyle.id)
  }
  component.setBoundVariable('itemSpacing', variables.dimensionByToken[definition.gapToken])
  component.setBoundVariable('paddingTop', variables.dimensionByToken[definition.paddingTokens.top])
  component.setBoundVariable('paddingLeft', variables.dimensionByToken[definition.paddingTokens.left])
  component.setBoundVariable('paddingRight', variables.dimensionByToken[definition.paddingTokens.right])
  component.setBoundVariable('paddingBottom', variables.dimensionByToken[definition.paddingTokens.bottom])
  for (const field of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) component.setBoundVariable(field, variables.dimensionByToken[definition.radiusToken])
  const textVariable = { name: variantDefinition.textToken, variable: variables.semanticByToken[variantDefinition.textToken] }
  for (const roleDefinition of definition.roles) {
    const role = component.children.find(node => node.name === `Role/${roleDefinition.name}`)
    if (!role || role.type !== roleDefinition.type) throw new Error(`Rolle fehlt: ${definition.name}/${variantDefinition.name}/${roleDefinition.name}`)
    configureComponentRole(role, roleDefinition, variantDefinition.copy, decision, textVariable, variables)
  }
}

function createComponentRoleNode(component, roleDefinition) {
  const role = roleDefinition.type === 'TEXT' ? figma.createText() : figma.createEllipse()
  role.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  role.name = `Role/${roleDefinition.name}`
  component.appendChild(role)
  return role
}

function createComponentVariantNode(parent, definition, variantDefinition, staging = false) {
  const component = figma.createComponent()
  component.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  if (staging) {
    component.setPluginData('ondaStagingComponent', definition.id)
    component.setPluginData('ondaStagingVariant', variantDefinition.name)
  }
  component.name = variantDefinition.name
  parent.appendChild(component)
  for (const roleDefinition of definition.roles) createComponentRoleNode(component, roleDefinition)
  return component
}

function componentLabelProperty(set, definition) {
  const existing = componentPropertyInventory(set).find(property => property.name === 'Label' && property.type === 'TEXT')
  if (existing) {
    if (typeof set.editComponentProperty === 'function') set.editComponentProperty(existing.key, { defaultValue: definition.variants[0].copy[definition.labelRole] })
    return existing.key
  }
  return set.addComponentProperty('Label', 'TEXT', definition.variants[0].copy[definition.labelRole])
}

async function runComponent(page, ledger, componentId, validatedInventory) {
  await loadDecisionFonts(ledger.fontDecision)
  const definition = componentDefinition(componentId)
  const variables = await componentVariables()
  const resolved = await revalidateComponentNodeRecords({
    inventory: validatedInventory,
    targetPage: page,
    getNodeById: id => figma.getNodeByIdAsync(id),
  })
  const validatedContainer = (validatedInventory.containers || [])[0]
  if (!validatedContainer && directChild(page, '02 · Komponenten')) throw new Error('TOCTOU: Komponenten-Section erschien nach Preflight.')
  if (!validatedContainer) ensureSection(page, ledger, '02 · Komponenten', 4000)
  const section = validatedContainer ? resolved.get(validatedContainer.nodeId) : directChild(page, '02 · Komponenten', ['SECTION'])
  if (!section || section.getPluginData(CREATED_MARKER_KEY) !== PLUGIN_ORIGIN) throw new Error('Direkte, Onda-eigene Komponenten-Section fehlt.')
  if (section.parent?.id !== page.id || section.parent?.type !== 'PAGE' || section.name !== '02 · Komponenten') throw new Error('TOCTOU: Komponenten-Section ist nicht mehr direkt.')
  const setRecord = (validatedInventory.sets || []).find(item => item.name === definition.name)
  let set = setRecord ? resolved.get(setRecord.nodeId) : null
  const created = !set
  if (!set) {
    const staging = (validatedInventory.staging || [])
      .filter(item => item.stagingComponent === componentId)
      .map(item => ({ variantName: item.stagingVariant, node: resolved.get(item.nodeId) }))
    for (const entry of staging) {
      for (const roleDefinition of definition.roles) {
        if (!directChild(entry.node, `Role/${roleDefinition.name}`, [roleDefinition.type])) createComponentRoleNode(entry.node, roleDefinition)
      }
    }
    set = await executeStagingAssembly({
      staging,
      expectedVariantNames: definition.variants.map(variant => variant.name),
      createVariant: async variantName => {
        const variantDefinition = definition.variants.find(variant => variant.name === variantName)
        return { variantName, node: createComponentVariantNode(section, definition, variantDefinition, true) }
      },
      combine: async entries => {
        const combined = figma.combineAsVariants(entries.map(entry => entry.node), section)
        combined.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
        combined.name = definition.name
        return combined
      },
      clearStaging: async entry => {
        entry.node.setPluginData('ondaStagingComponent', '')
        entry.node.setPluginData('ondaStagingVariant', '')
      },
    })
  } else {
    const recoveryActions = buildComponentRecoveryActions(validatedInventory, componentId)
    for (const action of recoveryActions) {
      if (action.type === 'variant') {
        const variantDefinition = definition.variants.find(variant => variant.name === action.variantName)
        createComponentVariantNode(set, definition, variantDefinition)
      }
      if (action.type === 'role') {
        const component = directChild(set, action.variantName, ['COMPONENT'])
        const roleDefinition = definition.roles.find(role => `Role/${role.name}` === action.roleName)
        createComponentRoleNode(component, roleDefinition)
      }
    }
  }
  set.name = definition.name
  set.description = `${definition.label}: monochrome Tier-${definition.tier}-Komponente mit Auto Layout, semantischen Variablen und expliziten Zuständen.`
  set.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  set.setPluginData('ondaComponentId', definition.id)
  set.layoutMode = 'HORIZONTAL'
  set.layoutWrap = 'WRAP'
  set.primaryAxisSizingMode = 'AUTO'
  set.counterAxisSizingMode = 'AUTO'
  set.itemSpacing = 24
  set.paddingTop = 32
  set.paddingRight = 32
  set.paddingBottom = 32
  set.paddingLeft = 32
  set.fills = [solid('gray/050')]
  set.strokes = [solid('gray/200')]
  set.strokeWeight = 1
  set.cornerRadius = 4
  set.effects = []
  for (const variantDefinition of definition.variants) {
    const component = set.children.find(node => node.type === 'COMPONENT' && node.name === variantDefinition.name)
    if (!component) throw new Error(`Variante fehlt: ${definition.name}/${variantDefinition.name}`)
    await configureComponentVariant(component, definition, variantDefinition, ledger.fontDecision, variables)
  }
  const labelKey = componentLabelProperty(set, definition)
  for (const component of set.children) {
    if (component.type !== 'COMPONENT') continue
    for (const role of component.children) {
      const roleName = role.name.slice('Role/'.length)
      if (role.type === 'TEXT' && roleName === definition.labelRole) role.componentPropertyReferences = { characters: labelKey }
    }
  }
  const index = COMPONENT_DEFINITIONS.findIndex(component => component.id === componentId)
  set.x = 80 + index % 2 * 980
  set.y = 120 + Math.floor(index / 2) * 900
  const sampleName = `${definition.name} / Dokumentationsinstanz`
  const sampleRecord = (validatedInventory.samples || []).find(item => item.name === sampleName)
  let sample = sampleRecord ? resolved.get(sampleRecord.nodeId) : null
  if (!sample) {
    sample = set.children.find(node => node.type === 'COMPONENT' && node.name === definition.variants[0].name).createInstance()
    sample.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
    section.appendChild(sample)
  }
  const defaultComponent = directChild(set, definition.variants[0].name, ['COMPONENT'])
  const sampleIdentity = await readMainComponentIdentity(sample)
  if (sampleIdentity.id !== defaultComponent.id) sample.swapComponent(defaultComponent)
  sample.name = sampleName
  sample.x = set.x
  sample.y = set.y + set.height + 40
  sample.effects = []
  sample.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  sample.setPluginData('ondaDocumentationInstance', 'true')
  sample.setPluginData('ondaRepeatedScreenInstance', '')
  return { component: definition.name, status: created ? 'created' : 'reused', variantCount: set.children.length, documentationInstanceCount: 1 }
}

function componentSetById(page, componentId) {
  const definition = COMPONENT_DEFINITIONS.find(component => component.id === componentId)
  const section = directChild(page, '02 · Komponenten', ['SECTION'])
  return (section?.children || []).filter(node => node.type === 'COMPONENT_SET'
    && node.name === definition?.name
    && node.getPluginData('ondaComponentId') === componentId)
}

function parseCoreMarker(node) {
  const raw = node.getPluginData('ondaCoreView')
  if (!raw) return null
  try { return JSON.parse(raw) } catch (_error) { return { invalid: true } }
}

function coreBaseRecord(node) {
  return {
    nodeId: node.id,
    name: node.name,
    type: node.type,
    owner: node.getPluginData(CREATED_MARKER_KEY),
    parentId: node.parent?.id || null,
    parentType: node.parent?.type || null,
    parentName: node.parent?.name || null,
  }
}

function coreVisualRecord(node) {
  const record = {
    x: 'x' in node ? node.x : null,
    y: 'y' in node ? node.y : null,
    width: 'width' in node ? node.width : null,
    height: 'height' in node ? node.height : null,
    bounds: 'x' in node ? { x: node.x, y: node.y, width: node.width, height: node.height } : null,
    absoluteBounds: cloneSerializable(node.absoluteBoundingBox || node.absoluteRenderBounds || null),
    fills: 'fills' in node ? cloneSerializable(node.fills) : null,
    strokes: 'strokes' in node ? cloneSerializable(node.strokes) : null,
    strokeWeight: 'strokeWeight' in node ? node.strokeWeight : null,
    effects: 'effects' in node ? cloneSerializable(node.effects) : null,
    opacity: 'opacity' in node ? node.opacity : null,
    visible: 'visible' in node ? node.visible : null,
    fillBindings: 'fills' in node ? collectVisibleFillBindings(node.fills) : [],
    strokeBindings: 'strokes' in node ? collectVisibleFillBindings(node.strokes) : [],
    fieldVariableIds: collectFieldVariableIds(node, [
      'itemSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius',
    ]),
    textRangeBindings: node.type === 'TEXT' ? collectTextRangeBindings(node) : [],
    pluginData: typeof node.getPluginData === 'function' ? {
      owner: node.getPluginData(CREATED_MARKER_KEY),
      coreView: node.getPluginData('ondaCoreView'),
      repeatedScreen: node.getPluginData('ondaRepeatedScreenInstance'),
      documentation: node.getPluginData('ondaDocumentationInstance'),
    } : {},
  }
  if ('layoutMode' in node) Object.assign(record, {
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
  })
  if ('layoutPositioning' in node) Object.assign(record, {
    layoutPositioning: node.layoutPositioning,
    layoutAlign: node.layoutAlign,
    layoutGrow: node.layoutGrow,
    constraints: 'constraints' in node ? cloneSerializable(node.constraints) : null,
  })
  return record
}

function coreLabelValue(instance) {
  const entries = Object.entries(instance.componentProperties || {})
  const label = entries.find(([key]) => key.split('#')[0] === 'Label')
  return label ? label[1]?.value ?? null : null
}

async function coreInstanceRecord(instance, contract = null) {
  let main = null
  try {
    const identity = await readMainComponentIdentity(instance)
    main = identity.id ? await figma.getNodeByIdAsync(identity.id) : null
  } catch (_error) {
    main = null
  }
  const set = main?.parent?.type === 'COMPONENT_SET' ? main.parent : null
  const roleCopy = {}
  const roleDescendants = []
  for (const role of Object.keys(contract?.roleCopy || {})) {
    const roleNode = instance.findOne(node => node.type === 'TEXT' && node.name === `Role/${role}`)
    roleCopy[role] = roleNode?.characters ?? null
    if (roleNode) roleDescendants.push({
      ...coreBaseRecord(roleNode),
      ...coreVisualRecord(roleNode),
      parentInstanceId: instance.id,
      role,
      characters: roleNode.characters,
    })
  }
  return {
    ...coreBaseRecord(instance),
    ...coreVisualRecord(instance),
    repeatedScreen: instance.getPluginData('ondaRepeatedScreenInstance') === 'true',
    documentation: instance.getPluginData('ondaDocumentationInstance') === 'true',
    mainComponentId: main?.id || null,
    componentSetId: set?.id || null,
    componentSetName: set?.name || null,
    variantName: main?.name || null,
    labelValue: coreLabelValue(instance),
    componentProperties: cloneSerializable(instance.componentProperties || {}),
    roleCopy,
    roleDescendants,
  }
}

async function coreViewRecord(node, definition, legacy = false) {
  const copyRoles = new Set((definition?.copyContracts || []).map(copy => copy.role))
  const instanceContracts = new Map((definition?.instances || []).map(instance => [instance.name, instance]))
  const layoutNames = new Set((definition?.regions || []).map(region => region.name))
  const layoutRegions = []
  const copyNodes = []
  const instances = []
  const standIns = []
  async function visit(child) {
    const role = child.name.startsWith('Copy / ') ? child.name.slice('Copy / '.length) : null
    if (child.type === 'FRAME' && layoutNames.has(child.name)) {
      layoutRegions.push({
        ...coreBaseRecord(child),
        ...coreVisualRecord(child),
        cornerRadius: child.cornerRadius,
        childCount: child.children.length,
        childIds: child.children.map(node => node.id),
      })
      for (const descendant of child.children) await visit(descendant)
    } else if (child.type === 'TEXT' && role && copyRoles.has(role)) {
      copyNodes.push({ ...coreBaseRecord(child), ...coreVisualRecord(child), role, characters: child.characters })
    } else if (child.type === 'INSTANCE' && instanceContracts.has(child.name)) {
      const contract = instanceContracts.get(child.name)
      instances.push({ ...await coreInstanceRecord(child, contract), region: contract.region })
    } else {
      standIns.push({ ...coreBaseRecord(child), ...coreVisualRecord(child) })
    }
  }
  for (const child of node.children) await visit(child)
  return {
    ...coreBaseRecord(node),
    ...coreVisualRecord(node),
    legacy,
    width: node.width,
    height: node.height,
    cornerRadius: node.cornerRadius,
    coreView: parseCoreMarker(node),
    layoutRegions,
    copyNodes,
    instances,
    standIns,
  }
}

async function collectCoreViewMutationInventory(page = figma.currentPage) {
  await figma.loadAllPagesAsync()
  const sectionNames = new Set(['00 · Übersicht', '03 · Bibliothek', '04 · Editor'])
  const canonicalNames = new Set(CORE_VIEW_DEFINITIONS.map(definition => definition.name))
  const legacyNames = new Set(Object.keys(CORE_LEGACY_VIEW_NAMES))
  const sections = []
  const candidates = []
  const overviewCandidates = []
  function visit(node) {
    if (node.type === 'SECTION' && sectionNames.has(node.name)) sections.push({ ...coreBaseRecord(node), ...coreVisualRecord(node) })
    if (node.type === 'FRAME') {
      if (node.name === CORE_OVERVIEW_DEFINITION.name) overviewCandidates.push(node)
      else if (canonicalNames.has(node.name) || legacyNames.has(node.name) || node.getPluginData('ondaCoreView')) candidates.push(node)
    }
    if ('children' in node) for (const child of node.children) visit(child)
  }
  for (const child of page.children) visit(child)
  const views = []
  const legacyViews = []
  for (const node of candidates) {
    const canonicalName = CORE_LEGACY_VIEW_NAMES[node.name] || node.name
    const definition = CORE_VIEW_DEFINITIONS.find(item => item.name === canonicalName)
    const legacy = !parseCoreMarker(node)
    const record = await coreViewRecord(node, definition, legacy)
    if (legacy) legacyViews.push(record)
    else views.push(record)
  }
  const overviewNode = overviewCandidates.length === 1 ? overviewCandidates[0] : null
  const overview = overviewNode ? {
    ...coreBaseRecord(overviewNode),
    ...coreVisualRecord(overviewNode),
    cornerRadius: overviewNode.cornerRadius,
    lines: overviewNode.children.filter(child => child.type === 'TEXT' && child.name.startsWith('Coverage / ')).map(child => ({
      ...coreBaseRecord(child), ...coreVisualRecord(child), characters: child.characters,
    })),
    standIns: overviewNode.children.filter(child => !(child.type === 'TEXT' && child.name.startsWith('Coverage / '))).map(child => ({
      ...coreBaseRecord(child), ...coreVisualRecord(child),
    })),
  } : null
  if (overviewCandidates.length > 1) {
    for (const duplicate of overviewCandidates) views.push(await coreViewRecord(duplicate, null, false))
  }
  return {
    targetPage: { ...coreBaseRecord(page), ...coreVisualRecord(page), id: page.id },
    sections,
    overview,
    views,
    legacyViews,
  }
}

async function preflightCoreViewMutation() {
  const inventory = await collectCoreViewMutationInventory(figma.currentPage)
  const validation = validateCoreViewMutationInventory(inventory)
  if (!validation.valid) throw new Error(validation.errors.join('\n'))
  return inventory
}

function ownedCoreVariant(page, contract) {
  const definition = COMPONENT_DEFINITIONS.find(component => component.id === contract.setId)
  const sets = componentSetById(page, contract.setId)
  if (sets.length !== 1 || sets[0].getPluginData(CREATED_MARKER_KEY) !== PLUGIN_ORIGIN) throw new Error(`Core-View Component Set fehlt oder ist mehrdeutig: ${definition?.name || contract.setId}`)
  const variants = sets[0].children.filter(node => node.type === 'COMPONENT' && node.name === contract.variant)
  if (variants.length !== 1 || variants[0].getPluginData(CREATED_MARKER_KEY) !== PLUGIN_ORIGIN) throw new Error(`Core-View Variante fehlt oder ist mehrdeutig: ${definition.name}/${contract.variant}`)
  return variants[0]
}

async function ensureVariantInstance(parent, variant, contract, root = parent) {
  let instance = root.findOne(node => node.type === 'INSTANCE' && node.name === contract.name)
  if (!instance) {
    instance = variant.createInstance()
  }
  if (instance.parent !== parent) parent.appendChild(instance)
  const identity = await readMainComponentIdentity(instance)
  if (identity.id !== variant.id) instance.swapComponent(variant)
  instance.name = contract.name
  instance.visible = true
  instance.effects = []
  instance.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  instance.setPluginData('ondaDocumentationInstance', '')
  instance.setPluginData('ondaRepeatedScreenInstance', 'true')
  const labelKey = Object.keys(instance.componentProperties || {}).find(key => key.split('#')[0] === 'Label')
  if (!labelKey) throw new Error(`Label-Property fehlt: ${contract.name}`)
  instance.setProperties({ [labelKey]: contract.label })
  for (const [role, characters] of Object.entries(contract.roleCopy)) {
    const roleNode = instance.findOne(node => node.type === 'TEXT' && node.name === `Role/${role}`)
    if (!roleNode) throw new Error(`Textrolle fehlt: ${contract.name}/Role/${role}`)
    roleNode.characters = characters
  }
  return instance
}

async function resolveCoreInventoryNodes(inventory, page) {
  const records = [
    ...(inventory.sections || []),
    ...(inventory.overview ? [inventory.overview] : []),
    ...(inventory.overview?.lines || []),
    ...(inventory.overview?.standIns || []),
    ...(inventory.views || []),
    ...(inventory.legacyViews || []),
    ...(inventory.views || []).flatMap(view => [...(view.layoutRegions || []), ...(view.copyNodes || []), ...(view.instances || []), ...(view.standIns || [])]),
    ...(inventory.legacyViews || []).flatMap(view => [...(view.layoutRegions || []), ...(view.copyNodes || []), ...(view.instances || []), ...(view.standIns || [])]),
  ]
  const resolved = new Map()
  for (const record of records) {
    const node = await figma.getNodeByIdAsync(record.nodeId)
    if (!node || node.type !== record.type || node.name !== record.name || node.parent?.id !== record.parentId || node.getPluginData(CREATED_MARKER_KEY) !== record.owner) throw new Error(`TOCTOU: Core-Knoten ersetzt oder verschoben: ${record.name}`)
    resolved.set(record.nodeId, node)
  }
  if (page.id !== inventory.targetPage?.id) throw new Error('TOCTOU: Core-Zielseite wurde gewechselt.')
  return resolved
}

function coreRegionFill(regionName) {
  return regionName === 'Layout / Rail' || regionName === 'Layout / Review' ? 'gray/050' : regionName === 'Layout / Toolbar' ? 'gray/025' : 'gray/000'
}

function configureCoreLayoutRegions(frame, definition) {
  const regions = new Map()
  for (const regionDefinition of definition.regions) {
    const parent = regionDefinition.parentName === definition.name ? frame : regions.get(regionDefinition.parentName)
    if (!parent) throw new Error(`Layout-Elternregion fehlt: ${definition.name}/${regionDefinition.name}`)
    let region = frame.findOne(node => node.type === 'FRAME' && node.name === regionDefinition.name)
    if (!region) {
      region = figma.createFrame()
      region.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
    }
    if (region.parent !== parent) parent.appendChild(region)
    region.name = regionDefinition.name
    region.layoutMode = regionDefinition.layoutMode
    region.primaryAxisSizingMode = 'FIXED'
    region.counterAxisSizingMode = 'FIXED'
    region.primaryAxisAlignItems = 'MIN'
    region.counterAxisAlignItems = 'MIN'
    region.itemSpacing = regionDefinition.itemSpacing
    region.paddingTop = regionDefinition.padding.top
    region.paddingRight = regionDefinition.padding.right
    region.paddingBottom = regionDefinition.padding.bottom
    region.paddingLeft = regionDefinition.padding.left
    resizeNode(region, regionDefinition.width, regionDefinition.height)
    region.fills = [solid(coreRegionFill(regionDefinition.name))]
    region.strokes = [solid('gray/200')]
    region.strokeWeight = 1
    region.cornerRadius = 0
    region.effects = []
    region.visible = true
    region.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
    parent.appendChild(region)
    regions.set(regionDefinition.name, region)
  }
  return regions
}

function configureCoreCopy(frame, definition, decision, regions) {
  const nodes = []
  const indexes = new Map()
  for (const contract of definition.copyContracts) {
    const parent = regions.get(contract.region)
    let copy = frame.findOne(node => node.type === 'TEXT' && node.name === `Copy / ${contract.role}`)
    if (copy && copy.parent !== parent) parent.appendChild(copy)
    copy = textNode(parent, `Copy / ${contract.role}`, contract.characters, decision, {
      size: contract.kind === 'title' || contract.role === 'title' ? 21 : contract.kind === 'heading' ? 15 : 15,
      weight: contract.kind === 'title' || contract.kind === 'heading' || ['title', 'status'].includes(contract.role) ? 700 : 400,
      muted: ['body', 'paragraph'].includes(contract.role) || contract.kind === 'paragraph',
      width: parent.width - parent.paddingLeft - parent.paddingRight,
    }).node
    copy.visible = true
    const index = indexes.get(contract.region) || 0
    parent.insertChild(index, copy)
    indexes.set(contract.region, index + 1)
    nodes.push(copy)
  }
  return nodes
}

function positionCoreInstance(instance, contract, regions) {
  const region = regions.get(contract.region)
  const availableWidth = region.width - region.paddingLeft - region.paddingRight
  if (contract.expectedWidth > availableWidth) throw new Error(`Core-Instanz breiter als Region: ${contract.name}`)
  resizeNode(instance, contract.expectedWidth, contract.expectedHeight)
}

async function runCoreViews(page, ledger, writeBarrierInventory, resolved) {
  const variants = new Map()
  for (const definition of CORE_VIEW_DEFINITIONS) for (const contract of definition.instances) {
    const key = `${contract.setId}\u0000${contract.variant}`
    if (!variants.has(key)) variants.set(key, ownedCoreVariant(page, contract))
  }

  const overviewRecord = writeBarrierInventory.overview
  const overviewSectionRecord = (writeBarrierInventory.sections || []).find(record => record.name === '00 · Übersicht')
  const overviewSection = overviewSectionRecord ? resolved.get(overviewSectionRecord.nodeId) : ensureSection(page, ledger, '00 · Übersicht', 1800).node
  const overviewFrame = overviewRecord ? resolved.get(overviewRecord.nodeId) : autoFrame(overviewSection, CORE_OVERVIEW_DEFINITION.name, { x: 80, y: 100, width: 1940, padding: 40, gap: 20, radius: 6 }).node
  overviewFrame.name = CORE_OVERVIEW_DEFINITION.name
  overviewFrame.effects = []
  overviewFrame.cornerRadius = CORE_OVERVIEW_DEFINITION.radius
  overviewFrame.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  for (const child of overviewFrame.children) if (!(child.type === 'TEXT' && child.name.startsWith('Coverage / '))) child.visible = false
  for (const [index, line] of CORE_OVERVIEW_DEFINITION.lines.entries()) {
    const node = textNode(overviewFrame, `Coverage / ${index + 1}`, line, ledger.fontDecision, { size: index === 0 ? 21 : 15, weight: index === 0 ? 700 : 500, width: 1860 }).node
    node.visible = true
    overviewFrame.insertChild(index, node)
  }

  const sectionRecords = new Map((writeBarrierInventory.sections || []).map(record => [record.name, record]))
  const allRecords = [...(writeBarrierInventory.views || []), ...(writeBarrierInventory.legacyViews || [])]
  const sectionIndexes = new Map([['03 · Bibliothek', 0], ['04 · Editor', 0]])
  for (const definition of CORE_VIEW_DEFINITIONS) {
    const sectionRecord = sectionRecords.get(definition.sectionName)
    const section = sectionRecord ? resolved.get(sectionRecord.nodeId) : ensureSection(page, ledger, definition.sectionName, 1800).node
    const record = allRecords.find(candidate => (CORE_LEGACY_VIEW_NAMES[candidate.name] || candidate.name) === definition.name)
    if (record) resolved.get(record.nodeId).name = definition.name
    const index = sectionIndexes.get(definition.sectionName)
    sectionIndexes.set(definition.sectionName, index + 1)
    let frame = directChild(section, definition.name, ['FRAME'])
    if (!frame) {
      frame = figma.createFrame()
      frame.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
      section.appendChild(frame)
    }
    frame.name = definition.name
    const expectedTopLevelNames = new Set(definition.regions.filter(region => region.parentName === definition.name).map(region => region.name))
    reconcileLegacyCoreChildren(frame, expectedTopLevelNames)
    frame.layoutMode = definition.layoutMode
    frame.primaryAxisSizingMode = 'FIXED'
    frame.counterAxisSizingMode = 'FIXED'
    frame.primaryAxisAlignItems = 'MIN'
    frame.counterAxisAlignItems = 'MIN'
    frame.itemSpacing = 0
    frame.paddingTop = 0
    frame.paddingRight = 0
    frame.paddingBottom = 0
    frame.paddingLeft = 0
    frame.x = 80
    frame.y = 100 + index * 900
    resizeNode(frame, definition.width, definition.height)
    frame.fills = [solid('gray/000')]
    frame.strokes = [solid('gray/200')]
    frame.strokeWeight = 1
    frame.effects = []
    frame.cornerRadius = 0
    frame.clipsContent = true
    frame.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
    frame.setPluginData('ondaCoreView', JSON.stringify({ section: definition.section, state: definition.state, width: 1440, reviewRelation: definition.reviewContext?.relation || null }))
    const regions = configureCoreLayoutRegions(frame, definition)
    const copyNodes = configureCoreCopy(frame, definition, ledger.fontDecision, regions)
    const copyCountByRegion = new Map(definition.copyContracts.map(contract => [contract.region, definition.copyContracts.filter(item => item.region === contract.region).length]))
    const instanceCountByRegion = new Map()
    for (const [instanceIndex, contract] of definition.instances.entries()) {
      const variant = variants.get(`${contract.setId}\u0000${contract.variant}`)
      const parent = regions.get(contract.region)
      const instance = await ensureVariantInstance(parent, variant, contract, frame)
      positionCoreInstance(instance, contract, regions)
      const localIndex = instanceCountByRegion.get(contract.region) || 0
      parent.insertChild((copyCountByRegion.get(contract.region) || 0) + localIndex, instance)
      instanceCountByRegion.set(contract.region, localIndex + 1)
    }
  }
  const library = directChild(page, '03 · Bibliothek', ['SECTION'])
  const editor = directChild(page, '04 · Editor', ['SECTION'])
  resizeNode(library, SECTION_WIDTH, 100 + 8 * 900 + 100)
  resizeNode(editor, SECTION_WIDTH, 100 + 10 * 900 + 100)
  return {
    sections: 3,
    libraryViews: 8,
    editorViews: 10,
    componentInstances: CORE_VIEW_DEFINITIONS.reduce((count, definition) => count + definition.instances.length, 0),
  }
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

const SECONDARY_SECTION_NAMES = Object.freeze([
  '07 · Agent & Quellen',
  '09 · Menüs & Nebenansichten',
  '10 · Responsive & Dark',
])

const SECONDARY_LEGACY_VIEW_SECTIONS = Object.freeze({
  'Agent · Ruhe': '07 · Agent & Quellen',
  'Agent · Gespräch': '07 · Agent & Quellen',
  'Agent · Antwort mit Fundstelle': '07 · Agent & Quellen',
  'Agent · Fehler und Rückkehr': '07 · Agent & Quellen',
  'Dokumentmenü · geschlossen': '09 · Menüs & Nebenansichten',
  'Dokumentmenü · offen': '09 · Menüs & Nebenansichten',
  'Quellenleser · offen': '09 · Menüs & Nebenansichten',
  'Recherchelauf · pausiert': '09 · Menüs & Nebenansichten',
  'Entscheidungsverlauf · gefüllt': '09 · Menüs & Nebenansichten',
  'Leerer Zustand · Recovery': '09 · Menüs & Nebenansichten',
  'Editor / 1440px · Responsive': '10 · Responsive & Dark',
  'Editor / 1024px · Responsive': '10 · Responsive & Dark',
  'Editor / 720px · Responsive': '10 · Responsive & Dark',
  'Editor / 320px · Kleinbreite': '10 · Responsive & Dark',
  'Editor / 1440px · Dark': '10 · Responsive & Dark',
})

function indexSecondaryVariableCollections(collections) {
  const requiredNames = [
    'Onda · Semantic · Light',
    'Onda · Semantic · Dark',
    'Onda · Dimension',
  ]
  return new Map(requiredNames.map(name => {
    const matches = collections.filter(collection => collection.name === name)
    if (matches.length !== 1) throw new Error(`Secondary-Variable-Collection fehlt oder ist mehrdeutig: ${name}`)
    return [name, matches[0]]
  }))
}

function secondaryVariableContext() {
  return Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
  ]).then(([collections, localVariables]) => {
    const collectionByName = indexSecondaryVariableCollections(collections)
    const exactVariable = (collectionName, name) => {
      const collection = collectionByName.get(collectionName)
      if (!collection) throw new Error(`Secondary-Variable-Collection fehlt: ${collectionName}`)
      const matches = localVariables.filter(variable => variable.variableCollectionId === collection.id && variable.name === name)
      if (matches.length !== 1) throw new Error(`Secondary-Variable fehlt oder ist mehrdeutig: ${collectionName}/${name}`)
      return matches[0]
    }
    const semantic = collectionName => ({
      surface: exactVariable(collectionName, 'color/surface'),
      border: exactVariable(collectionName, 'color/border'),
      text: exactVariable(collectionName, 'color/text'),
      textMuted: exactVariable(collectionName, 'color/text-muted'),
    })
    const dimensionValues = [...new Set(SECONDARY_VIEW_DEFINITIONS.agentSources
      .concat(SECONDARY_VIEW_DEFINITIONS.secondary, SECONDARY_VIEW_DEFINITIONS.responsive)
      .flatMap(definition => definition.regions.flatMap(region => [
        region.itemSpacing,
        region.padding.top,
        region.padding.right,
        region.padding.bottom,
        region.padding.left,
      ]))
      .filter(value => value > 0))]
    return {
      semanticByTheme: {
        Light: semantic('Onda · Semantic · Light'),
        Dark: semantic('Onda · Semantic · Dark'),
      },
      dimensionByValue: new Map(dimensionValues.map(value => [value, exactVariable('Onda · Dimension', `spacing/${value}`)])),
      inventory: [
        ...['Light', 'Dark'].flatMap(theme => Object.values(semantic(`Onda · Semantic · ${theme}`)).map(variable => ({
          id: variable.id,
          nodeId: variable.id,
          name: variable.name,
          collectionName: `Onda · Semantic · ${theme}`,
        }))),
        ...dimensionValues.map(value => {
          const variable = exactVariable('Onda · Dimension', `spacing/${value}`)
          return { id: variable.id, nodeId: variable.id, name: variable.name, collectionName: 'Onda · Dimension' }
        }),
      ],
    }
  })
}

function secondaryBoundPaint(paint, variable) {
  return figma.variables.setBoundVariableForPaint(paint, 'color', variable)
}

function applySecondaryThemeBinding({ node, theme, variables, bindPaint }) {
  const semantic = theme === 'Dark' ? variables.semanticByTheme.Dark : variables.semanticByTheme.Light
  if (Array.isArray(node.fills) && node.fills.length) {
    const variable = node.type === 'TEXT' || node.type === 'ELLIPSE' ? semantic.text : semantic.surface
    node.fills = node.fills.map(paint => paint?.type === 'SOLID' ? bindPaint(paint, variable) : paint)
  }
  if (Array.isArray(node.strokes) && node.strokes.length) {
    node.strokes = node.strokes.map(paint => paint?.type === 'SOLID' ? bindPaint(paint, semantic.border) : paint)
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) applySecondaryThemeBinding({ node: child, theme, variables, bindPaint })
  }
}

function bindSecondaryNodeTheme(node, theme, variables) {
  const semantic = theme === 'Dark' ? variables.semanticByTheme.Dark : variables.semanticByTheme.Light
  applySecondaryThemeBinding({
    node,
    theme,
    variables,
    bindPaint: (paint, variable) => figma.variables.setBoundVariableForPaint(paint, 'color', variable),
  })
  return semantic
}

function secondaryDefinitionsWithGroups() {
  return Object.entries(SECONDARY_VIEW_DEFINITIONS)
    .flatMap(([group, definitions]) => definitions.map(definition => ({ group, definition })))
}

function parseSecondaryMarker(node) {
  const raw = node.getPluginData('secondaryView')
  if (!raw) return null
  try { return JSON.parse(raw) } catch (_error) { return { invalid: true } }
}

function secondaryPluginData(node) {
  return {
    owner: node.getPluginData(CREATED_MARKER_KEY),
    secondaryView: node.getPluginData('secondaryView'),
    ondaSecondaryView: node.getPluginData('ondaSecondaryView'),
    responsiveFrame: node.getPluginData('responsiveFrame'),
    ondaResponsiveFrame: node.getPluginData('ondaResponsiveFrame'),
    role: node.getPluginData('role'),
    legacy: node.getPluginData('legacy'),
    secondaryRegionContract: node.getPluginData('secondaryRegionContract'),
    repeatedScreen: node.getPluginData('ondaRepeatedScreenInstance'),
    documentation: node.getPluginData('ondaDocumentationInstance'),
  }
}

function secondaryNodeRecord(node) {
  const record = {
    ...coreBaseRecord(node),
    ...coreVisualRecord(node),
    pluginData: secondaryPluginData(node),
  }
  if ('children' in node) {
    record.childIds = node.children.map(child => child.id)
    record.childCount = node.children.length
  } else {
    record.childIds = []
    record.childCount = 0
  }
  return record
}

function secondaryAncestorRecord(node) {
  return secondaryNodeRecord(node)
}

function secondaryRecordedAncestry(node, root) {
  const chain = []
  let parent = node.parent
  while (parent && parent !== root) {
    chain.push(secondaryAncestorRecord(parent))
    parent = parent.parent
  }
  return {
    ancestorChain: chain,
    ancestorIds: [...chain.map(record => record.nodeId), root.id],
  }
}

function collectSecondaryInstanceRoleRecords(instance, recordNode = secondaryNodeRecord, recordedAncestry = secondaryRecordedAncestry) {
  const instanceRecord = recordNode(instance)
  const roleDescendants = instance.findAll(node => node.name.startsWith('Role/')).map(roleNode => {
    const role = roleNode.name.slice('Role/'.length)
    return {
      ...recordNode(roleNode),
      parentInstanceId: instance.id,
      role,
      ...(roleNode.type === 'TEXT' ? { characters: roleNode.characters } : {}),
      ...recordedAncestry(roleNode, instance),
    }
  })
  return {
    instanceRecord,
    roleDescendants,
    roleCopy: Object.fromEntries(roleDescendants
      .filter(role => role.type === 'TEXT' && role.visible !== false)
      .map(role => [role.role, role.characters])),
  }
}

async function secondaryInstanceRecord(instance, contract) {
  let main = null
  try {
    const identity = await readMainComponentIdentity(instance)
    main = identity.id ? await figma.getNodeByIdAsync(identity.id) : null
  } catch (_error) {
    main = null
  }
  const set = main?.parent?.type === 'COMPONENT_SET' ? main.parent : null
  const { instanceRecord, roleDescendants, roleCopy } = collectSecondaryInstanceRoleRecords(instance)
  return {
    ...instanceRecord,
    region: contract.region,
    repeatedScreen: instance.getPluginData('ondaRepeatedScreenInstance') === 'true',
    documentation: instance.getPluginData('ondaDocumentationInstance') === 'true',
    mainComponentId: main?.id || null,
    componentId: main?.id || null,
    componentSetId: set?.id || null,
    componentSetName: set?.name || null,
    variantName: main?.name || null,
    labelValue: coreLabelValue(instance),
    componentProperties: cloneSerializable(instance.componentProperties || {}),
    roleCopy,
    roleDescendants,
  }
}

async function secondaryViewRecord(node, group, definition, legacy = false) {
  if (legacy) {
    const legacyChildren = []
    function collectLegacyLeaves(child) {
      if ('children' in child && child.children.length) {
        for (const nested of child.children) collectLegacyLeaves(nested)
        return
      }
      legacyChildren.push({
        ...secondaryNodeRecord(child),
        ...secondaryRecordedAncestry(child, node),
      })
    }
    for (const child of node.children) collectLegacyLeaves(child)
    return {
      ...secondaryNodeRecord(node),
      legacy: true,
      responsiveFrame: node.getPluginData('ondaResponsiveFrame') || node.getPluginData('responsiveFrame'),
      legacyChildren,
    }
  }
  const regionContracts = new Map(definition.regions.map(region => [region.name, region]))
  const copyContracts = new Map(definition.copyContracts.map(copy => [copy.role, copy]))
  const instanceContracts = new Map(definition.instances.map(instance => [instance.name, instance]))
  const layoutRegions = []
  const copyNodes = []
  const instances = []
  const standIns = []
  async function visit(child) {
    const copyRole = child.name.startsWith('Copy / ') ? child.name.slice('Copy / '.length) : null
    if (child.type === 'FRAME' && regionContracts.has(child.name)) {
      layoutRegions.push(secondaryNodeRecord(child))
      for (const nested of child.children) await visit(nested)
    } else if (child.type === 'TEXT' && copyContracts.has(copyRole)) {
      copyNodes.push({ ...secondaryNodeRecord(child), role: copyRole, characters: child.characters })
    } else if (child.type === 'INSTANCE' && instanceContracts.has(child.name)) {
      instances.push(await secondaryInstanceRecord(child, instanceContracts.get(child.name)))
    } else {
      standIns.push({ ...secondaryNodeRecord(child), ...secondaryRecordedAncestry(child, node) })
    }
  }
  for (const child of node.children) await visit(child)
  return {
    ...secondaryNodeRecord(node),
    secondaryView: parseSecondaryMarker(node),
    group,
    theme: definition.theme,
    subject: definition.subject || null,
    breakpoint: definition.breakpoint ?? null,
    layoutRegions,
    copyNodes,
    instances,
    standIns,
  }
}

function secondaryComponentInventory(page) {
  const usedIds = new Set(secondaryDefinitionsWithGroups().flatMap(({ definition }) => definition.instances.map(instance => instance.setId)))
  return COMPONENT_DEFINITIONS.filter(definition => usedIds.has(definition.id)).map(definition => {
    const sets = componentSetById(page, definition.id)
    if (sets.length !== 1 || sets[0].getPluginData(CREATED_MARKER_KEY) !== PLUGIN_ORIGIN) {
      throw new Error(`Secondary Component Set fehlt oder ist mehrdeutig: ${definition.name}`)
    }
    const set = sets[0]
    return {
      id: definition.id,
      nodeId: set.id,
      name: set.name,
      type: set.type,
      owner: set.getPluginData(CREATED_MARKER_KEY),
      childIds: set.children.map(child => child.id),
      childCount: set.children.length,
      variants: set.children.map(variant => ({
        ...secondaryAncestorRecord(variant),
      })),
    }
  })
}

function collectSecondaryUntouchedDescendantRecords(root, recordNode = secondaryNodeRecord) {
  const records = []
  function visit(parent) {
    if (!('children' in parent)) return
    for (const child of parent.children) {
      records.push(recordNode(child))
      visit(child)
    }
  }
  visit(root)
  return records
}

async function collectSecondaryViewMutationInventory(page = figma.currentPage) {
  await figma.loadAllPagesAsync()
  const definitionEntries = secondaryDefinitionsWithGroups()
  const definitionByName = new Map(definitionEntries.map(entry => [entry.definition.name, entry]))
  const targetSections = page.children.filter(node => node.type === 'SECTION' && SECONDARY_SECTION_NAMES.includes(node.name))
  const sections = targetSections.map(secondaryNodeRecord)
  const views = []
  const legacyViews = []
  for (const section of targetSections) {
    for (const child of section.children) {
      const entry = definitionByName.get(child.name)
      if (entry || child.getPluginData('secondaryView')) {
        views.push(await secondaryViewRecord(child, entry?.group || '', entry?.definition || { regions: [], copyContracts: [], instances: [], theme: 'Light' }))
      } else if (SECONDARY_LEGACY_VIEW_SECTIONS[child.name] === section.name) {
        legacyViews.push(await secondaryViewRecord(child, '', null, true))
      }
    }
  }
  const variables = await secondaryVariableContext()
  const targetPage = secondaryNodeRecord(page)
  const untouchedPageNodes = page.children.filter(node => !SECONDARY_SECTION_NAMES.includes(node.name))
  const untouchedPageChildren = untouchedPageNodes.map(secondaryNodeRecord)
  const untouchedPageDescendants = untouchedPageNodes.flatMap(node => collectSecondaryUntouchedDescendantRecords(node))
  return {
    targetPage,
    sections,
    views,
    legacyViews,
    untouchedPageChildren,
    untouchedPageDescendants,
    components: secondaryComponentInventory(page),
    variables: variables.inventory,
  }
}

async function preflightSecondaryViewMutation() {
  const inventory = await collectSecondaryViewMutationInventory(figma.currentPage)
  const validation = validateSecondaryViewMutationInventory(inventory)
  if (!validation.valid) throw new Error(validation.errors.join('\n'))
  return inventory
}

function secondaryMutableRecords(inventory) {
  return [
    ...(inventory.sections || []),
    ...(inventory.views || []),
    ...(inventory.legacyViews || []),
    ...(inventory.views || []).flatMap(view => [
      ...(view.layoutRegions || []),
      ...(view.copyNodes || []),
      ...(view.instances || []),
      ...(view.instances || []).flatMap(instance => (instance.roleDescendants || []).flatMap(role => [role, ...(role.ancestorChain || [])])),
      ...(view.standIns || []),
    ]),
    ...(inventory.legacyViews || []).flatMap(view => view.legacyChildren || []),
  ]
}

async function resolveSecondaryInventoryNodes({ page, ledger }, inventory) {
  if (page.id !== inventory.targetPage?.nodeId) throw new Error('TOCTOU: Secondary-Zielseite wurde gewechselt.')
  await loadDecisionFonts(ledger.fontDecision)
  const variables = await secondaryVariableContext()
  const resolved = new Map()
  for (const record of secondaryMutableRecords(inventory)) {
    const node = await figma.getNodeByIdAsync(record.nodeId)
    if (!node
      || node.type !== record.type
      || node.name !== record.name
      || node.parent?.id !== record.parentId
      || node.getPluginData(CREATED_MARKER_KEY) !== record.owner) {
      throw new Error(`TOCTOU: Secondary-Knoten ersetzt oder verschoben: ${record.name}`)
    }
    resolved.set(record.nodeId, node)
  }
  const variants = new Map()
  for (const { definition } of secondaryDefinitionsWithGroups()) for (const contract of definition.instances) {
    const key = `${contract.setId}\u0000${contract.variant}`
    if (!variants.has(key)) variants.set(key, ownedSecondaryVariant(page, contract))
  }
  return { nodes: resolved, variables, variants }
}

function applySecondaryContainerContract({ parent, node, contract, maximumWidth = contract.width, resize }) {
  if (node.parent !== parent) parent.appendChild(node)
  node.layoutMode = contract.layoutMode
  if (node.layoutMode === 'NONE') throw new Error(`Secondary Auto Layout fehlt: ${node.name}`)
  node.primaryAxisSizingMode = 'FIXED'
  node.counterAxisSizingMode = 'FIXED'
  node.primaryAxisAlignItems = 'MIN'
  node.counterAxisAlignItems = 'MIN'
  node.itemSpacing = contract.itemSpacing
  node.paddingTop = contract.padding.top
  node.paddingRight = contract.padding.right
  node.paddingBottom = contract.padding.bottom
  node.paddingLeft = contract.padding.left
  resize(node, Math.min(contract.width, maximumWidth), contract.height)
}

function configureSecondaryLayoutRegions(frame, definition, variables) {
  const regions = new Map()
  for (const regionDefinition of definition.regions) {
    const parent = regionDefinition.parentName === definition.name ? frame : regions.get(regionDefinition.parentName)
    if (!parent) throw new Error(`Secondary-Elternregion fehlt: ${definition.name}/${regionDefinition.name}`)
    let region = frame.findOne(node => node.type === 'FRAME' && node.name === regionDefinition.name)
    if (!region) {
      region = figma.createFrame()
      region.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
    }
    if (region.parent !== parent) parent.appendChild(region)
    region.name = regionDefinition.name
    const maximumWidth = definition.width === 320
      ? parent.width - parent.paddingLeft - parent.paddingRight
      : regionDefinition.width
    applySecondaryContainerContract({ parent, node: region, contract: regionDefinition, maximumWidth, resize: resizeNode })
    region.layoutMode = regionDefinition.layoutMode
    if (region.layoutMode === 'NONE') throw new Error(`Secondary Auto Layout fehlt: ${definition.name}/${region.name}`)
    region.fills = [solid(definition.theme === 'Dark' ? 'gray/900' : 'gray/000')]
    region.strokes = [solid(definition.theme === 'Dark' ? 'gray/700' : 'gray/200')]
    region.strokeWeight = 1
    region.cornerRadius = 0
    region.effects = []
    region.visible = true
    region.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
    region.setPluginData('secondaryRegionContract', JSON.stringify({ width: regionDefinition.width, height: regionDefinition.height }))
    for (const [field, value] of [
      ['itemSpacing', regionDefinition.itemSpacing],
      ['paddingTop', regionDefinition.padding.top],
      ['paddingRight', regionDefinition.padding.right],
      ['paddingBottom', regionDefinition.padding.bottom],
      ['paddingLeft', regionDefinition.padding.left],
    ]) if (value > 0) region.setBoundVariable(field, variables.dimensionByValue.get(value))
    bindSecondaryNodeTheme(region, definition.theme, variables)
    regions.set(regionDefinition.name, region)
  }
  return regions
}

function configureSecondaryCopy(frame, definition, decision, regions, variables) {
  const copyByRegion = new Map()
  for (const contract of definition.copyContracts) {
    const parent = regions.get(contract.region)
    let copy = frame.findOne(node => node.type === 'TEXT' && node.name === `Copy / ${contract.role}`)
    if (copy && copy.parent !== parent) parent.appendChild(copy)
    copy = textNode(parent, `Copy / ${contract.role}`, contract.characters, decision, {
      size: contract.kind === 'title' ? 21 : 15,
      weight: contract.kind === 'title' ? 700 : 400,
      muted: contract.kind !== 'title',
      dark: definition.theme === 'Dark',
      width: Math.max(40, parent.width - parent.paddingLeft - parent.paddingRight),
    }).node
    copy.visible = true
    copy.setPluginData('role', contract.role)
    bindSecondaryNodeTheme(copy, definition.theme, variables)
    const index = copyByRegion.get(contract.region) || 0
    parent.insertChild(index, copy)
    copyByRegion.set(contract.region, index + 1)
  }
  return copyByRegion
}

function ownedSecondaryVariant(page, contract) {
  const definition = COMPONENT_DEFINITIONS.find(component => component.id === contract.setId)
  const sets = componentSetById(page, contract.setId)
  if (sets.length !== 1 || sets[0].getPluginData(CREATED_MARKER_KEY) !== PLUGIN_ORIGIN) throw new Error(`Secondary Component Set fehlt oder ist mehrdeutig: ${definition?.name || contract.setId}`)
  const matches = sets[0].children.filter(node => node.name === contract.variant)
  if (matches.length !== 1
    || matches[0].type !== 'COMPONENT'
    || matches[0].getPluginData(CREATED_MARKER_KEY) !== PLUGIN_ORIGIN) {
    throw new Error(`Secondary Variante fehlt oder ist mehrdeutig: ${definition.name}/${contract.variant}`)
  }
  return matches[0]
}

async function applySecondaryInstanceContract({ parent, instance, variant, contract, definition, readIdentity, loadFonts, resize, bindTheme }) {
  const parentContentWidth = Number.isFinite(parent.width)
    ? parent.width - (parent.paddingLeft || 0) - (parent.paddingRight || 0)
    : contract.expectedWidth
  const availableWidth = definition.width === 320 ? Math.min(definition.width - 32, parentContentWidth) : contract.expectedWidth
  if (definition.width === 320 && Number.isFinite(contract.minimumWidth) && contract.minimumWidth > availableWidth) {
    throw new Error(`Secondary-Mindestbreite überschreitet verfügbaren Inhalt: ${contract.name} (${contract.minimumWidth}px > ${availableWidth}px)`)
  }
  const identity = await readIdentity(instance)
  if (identity.id !== variant.id) instance.swapComponent(variant)
  await loadFonts()
  if (instance.parent !== parent) parent.appendChild(instance)
  instance.name = contract.name
  const labelKey = Object.keys(instance.componentProperties || {}).find(key => key.split('#')[0] === 'Label')
  if (!labelKey) throw new Error(`Label-Property fehlt: ${contract.name}`)
  instance.setProperties({ [labelKey]: contract.label })
  for (const [role, characters] of Object.entries(contract.roleCopy)) {
    const roleNode = instance.findOne(node => node.type === 'TEXT' && node.name === `Role/${role}`)
    if (!roleNode) throw new Error(`Textrolle fehlt: ${contract.name}/Role/${role}`)
    roleNode.characters = characters
  }
  const width = Math.min(contract.expectedWidth, availableWidth)
  const height = Math.max(definition.width === 320 ? 44 : 0, contract.expectedHeight)
  resize(instance, width, height)
  bindTheme(instance, definition.theme)
  return instance
}

async function ensureSecondaryVariantInstance(parent, variant, contract, definition, decision, variables, root) {
  let instance = root.findOne(node => node.type === 'INSTANCE' && node.name === contract.name)
  if (!instance) instance = variant.createInstance()
  await applySecondaryInstanceContract({
    parent,
    instance,
    variant,
    contract,
    definition,
    readIdentity: readMainComponentIdentity,
    loadFonts: () => loadDecisionFonts(decision),
    resize: resizeNode,
    bindTheme: node => bindSecondaryNodeTheme(node, definition.theme, variables),
  })
  instance.visible = true
  instance.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  instance.setPluginData('ondaDocumentationInstance', '')
  instance.setPluginData('ondaRepeatedScreenInstance', 'true')
  for (const role of Object.keys(contract.roleCopy)) {
    const roleNode = instance.findOne(node => node.type === 'TEXT' && node.name === `Role/${role}`)
    if (!roleNode) throw new Error(`Textrolle fehlt: ${contract.name}/Role/${role}`)
    roleNode.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
  }
  return instance
}

function positionSecondaryInstance(instance, contract, definition, region) {
  const regionContentWidth = region.width - region.paddingLeft - region.paddingRight
  const availableWidth = definition.width === 320
    ? Math.min(definition.width - 32, regionContentWidth)
    : regionContentWidth
  const width = Math.min(contract.expectedWidth, availableWidth)
  const height = Math.max(definition.width === 320 ? 44 : 0, contract.expectedHeight)
  resizeNode(instance, width, contract.expectedHeight)
  if (height !== contract.expectedHeight) resizeNode(instance, width, height)
}

function secondarySectionLayout(definitions, start = 100, gap = 76, bottom = 100) {
  let y = start
  const positions = definitions.map(definition => {
    const position = { name: definition.name, y, height: definition.height }
    y += definition.height + gap
    return position
  })
  const last = positions[positions.length - 1]
  return { positions, height: last ? last.y + last.height + bottom : start + bottom }
}

async function runSecondaryViews(page, ledger, writeBarrierInventory, resolved) {
  const { nodes, variables, variants } = resolved
  const recoveryActions = buildSecondaryViewRecoveryActions(writeBarrierInventory)
  const sectionRecords = new Map((writeBarrierInventory.sections || []).map(record => [record.name, record]))
  const viewRecords = new Map((writeBarrierInventory.views || []).map(record => [record.name, record]))
  const sectionLayouts = new Map(SECONDARY_SECTION_NAMES.map(sectionName => [
    sectionName,
    secondarySectionLayout(secondaryDefinitionsWithGroups()
      .filter(({ definition }) => definition.sectionName === sectionName)
      .map(({ definition }) => definition)),
  ]))
  const positionByViewName = new Map([...sectionLayouts.values()].flatMap(layout => layout.positions.map(position => [position.name, position])))
  for (const { group, definition } of secondaryDefinitionsWithGroups()) {
    const sectionRecord = sectionRecords.get(definition.sectionName)
    const section = sectionRecord ? nodes.get(sectionRecord.nodeId) : ensureSection(page, ledger, definition.sectionName, 1800).node
    const viewRecord = viewRecords.get(definition.name)
    let frame = viewRecord ? nodes.get(viewRecord.nodeId) : null
    if (!frame) {
      frame = figma.createFrame()
      frame.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
      section.appendChild(frame)
    }
    frame.name = definition.name
    frame.layoutMode = definition.layoutMode
    if (frame.layoutMode === 'NONE') throw new Error(`Secondary Auto Layout fehlt: ${definition.name}`)
    frame.primaryAxisSizingMode = 'FIXED'
    frame.counterAxisSizingMode = 'FIXED'
    frame.primaryAxisAlignItems = 'MIN'
    frame.counterAxisAlignItems = 'MIN'
    frame.itemSpacing = 0
    const narrow = definition.width === 320
    frame.paddingTop = narrow ? 16 : 0
    frame.paddingRight = narrow ? 16 : 0
    frame.paddingBottom = narrow ? 16 : 0
    frame.paddingLeft = narrow ? 16 : 0
    frame.x = 80
    frame.y = positionByViewName.get(definition.name).y
    resizeNode(frame, definition.width, definition.height)
    frame.fills = [solid(definition.theme === 'Dark' ? 'gray/900' : 'gray/000')]
    frame.strokes = [solid(definition.theme === 'Dark' ? 'gray/700' : 'gray/200')]
    frame.strokeWeight = 1
    frame.effects = []
    frame.cornerRadius = 0
    frame.clipsContent = false
    frame.setPluginData(CREATED_MARKER_KEY, PLUGIN_ORIGIN)
    frame.setPluginData('secondaryView', JSON.stringify({
      group,
      theme: definition.theme,
      subject: definition.subject || null,
      breakpoint: definition.breakpoint ?? null,
    }))
    const regions = configureSecondaryLayoutRegions(frame, definition, variables)
    const copyByRegion = configureSecondaryCopy(frame, definition, ledger.fontDecision, regions, variables)
    const instanceByRegion = new Map()
    for (const contract of definition.instances) {
      const parent = regions.get(contract.region)
      const variant = variants.get(`${contract.setId}\u0000${contract.variant}`)
      const instance = await ensureSecondaryVariantInstance(parent, variant, contract, definition, ledger.fontDecision, variables, frame)
      positionSecondaryInstance(instance, contract, definition, parent)
      const localIndex = instanceByRegion.get(contract.region) || 0
      parent.insertChild((copyByRegion.get(contract.region) || 0) + localIndex, instance)
      instanceByRegion.set(contract.region, localIndex + 1)
    }
    bindSecondaryNodeTheme(frame, definition.theme, variables)
  }
  for (const legacy of writeBarrierInventory.legacyViews || []) {
    const node = nodes.get(legacy.nodeId)
    if (node) node.visible = false
    for (const child of legacy.legacyChildren || []) {
      const childNode = nodes.get(child.nodeId)
      if (childNode) childNode.visible = false
    }
  }
  for (const sectionName of SECONDARY_SECTION_NAMES) {
    const section = directChild(page, sectionName, ['SECTION'])
    resizeNode(section, SECTION_WIDTH, sectionLayouts.get(sectionName).height)
  }
  return {
    sections: SECONDARY_SECTION_NAMES.length,
    agentSourceViews: SECONDARY_VIEW_DEFINITIONS.agentSources.length,
    secondaryViews: SECONDARY_VIEW_DEFINITIONS.secondary.length,
    responsiveViews: SECONDARY_VIEW_DEFINITIONS.responsive.length,
    totalViews: secondaryDefinitionsWithGroups().length,
    recoveryActions: recoveryActions.length,
  }
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

async function createPrototype(section, decision) {
  const flows = [
    ['Hauptablauf', 'Bibliothek → Projekt → Dokument → Anmerkung → Übernehmen → Rückgängig → Schlussaudit → Export'],
    ['Projektwissen', 'Projektverständnis → Projektgedächtnis / Argumentationsdossier / Sprache & Wirkung → Editor'],
    ['Quellen & Recherche', 'Quellen → Import → Recherche planen → Lauf → Prüfung → Fundstelle übernehmen'],
    ['Agent & Beleg', 'Aura → Agentengespräch → Antwort → Fundstelle → Editor'],
  ]
  const frames = []
  for (const [index, [name, path]] of flows.entries()) {
    const frame = autoFrame(section, `Prototyp / ${name}`, { x: 80, y: 120 + index * 500, width: 1940, padding: 32, gap: 20, radius: 6 }).node
    frames.push(frame)
    textNode(frame, `Prototyp / ${name} / Titel`, name, decision, { size: 21, weight: 700, width: 1800 })
    textNode(frame, `Prototyp / ${name} / Pfad`, path, decision, { size: 15, weight: 500, width: 1800 })
    textNode(frame, `Prototyp / ${name} / Recovery`, 'Fehler → Wiederholen / Einrichten / Korrigieren / Abbrechen · keine tote Zwischenstation', decision, { size: 12, weight: 700, width: 1800 })
  }
  for (const [index, frame] of frames.entries()) {
    const destination = frames[(index + 1) % frames.length]
    await frame.setReactionsAsync([{
      trigger: { type: 'ON_CLICK' },
      actions: [{ type: 'NODE', destinationId: destination.id, navigation: 'NAVIGATE', transition: null, preserveScrollPosition: false }],
    }])
    frame.setPluginData('ondaPrototypeReaction', 'true')
  }
}

async function runDialogsAndSecondary(page, ledger, writeBarrierInventory, resolvedInventoryNodes) {
  return runSecondaryViews(page, ledger, writeBarrierInventory, resolvedInventoryNodes)
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

async function currentBaselineEvidence(page, ledger) {
  const baselineRecords = readBaselineRecords(page, ledger)
  const baselineIdsInOrder = baselineRecords.map(record => record.id)
  const baselineIds = new Set(baselineIdsInOrder)
  const records = orderRecordsByBaselineIds(await collectRecordsFromDocument(baselineIds), baselineIdsInOrder)
  const currentById = new Map(records.map(record => [record.id, hashBaselineRecords([record])]))
  const mismatches = baselineRecords
    .filter(record => currentById.get(record.id) !== hashBaselineRecords([record]))
    .map(record => record.id)
  const currentHash = hashBaselineRecords(records)
  const topLevelIds = baselineRecords.filter(record => record.parentId === page.id).map(record => record.id)
  const presentTopLevel = page.children.filter(node => topLevelIds.includes(node.id)).length
  return {
    baselineRecords,
    records,
    currentHash,
    mismatches,
    presentTopLevel,
    pages: pageInvariantSnapshot(),
  }
}

function renderRect(value) {
  const rect = value?.absoluteRenderBounds || value?.absoluteBoundingBox || value?.bounds
  if (!rect || ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)) return null
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
}

function rectanglesIntersect(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function geometryEvidence(page, sections, allNodes, ledger, baselineRecords) {
  const ondaRects = sections.map(node => ({ id: node.id, name: node.name, rect: renderRect(node) })).filter(item => item.rect)
  const baselineRects = baselineRecords
    .filter(record => record.type !== 'DOCUMENT' && record.type !== 'PAGE')
    .map(record => ({ id: record.id, name: record.name, rect: renderRect(record) }))
    .filter(item => item.rect)
  const intersections = []
  for (let left = 0; left < ondaRects.length; left += 1) {
    for (let right = left + 1; right < ondaRects.length; right += 1) {
      if (rectanglesIntersect(ondaRects[left].rect, ondaRects[right].rect)) intersections.push([ondaRects[left].name, ondaRects[right].name])
    }
  }
  for (const onda of ondaRects) {
    for (const foreign of baselineRects) if (rectanglesIntersect(onda.rect, foreign.rect)) intersections.push([onda.name, foreign.name])
  }
  const minOndaLeft = Math.min(...ondaRects.map(item => item.rect.x))
  const maxBaselineRight = Math.max(0, ...baselineRecords.map(renderRect).filter(Boolean).map(rect => rect.x + rect.width))
  const clearance = Number.isFinite(minOndaLeft) ? minOndaLeft - maxBaselineRight : 0
  const overflowNodes = []
  for (const frame of allNodes.filter(node => node.type === 'FRAME' && node.getPluginData('ondaResponsiveFrame'))) {
    const outer = renderRect(frame)
    if (!outer) continue
    for (const descendant of frame.findAll(() => true)) {
      const inner = renderRect(descendant)
      if (inner && (inner.x < outer.x - .5 || inner.x + inner.width > outer.x + outer.width + .5)) overflowNodes.push(descendant.id)
    }
  }
  const undersizedHitTargets = allNodes
    .filter(node => node.type === 'INSTANCE')
    .filter(node => node.width < 44 || node.height < 44)
    .map(node => node.id)
  return { intersections, clearance, overflowNodes: [...new Set(overflowNodes)], undersizedHitTargets }
}

async function collectFoundationEvidence(foundationSection, fontDecision) {
  function childFrame(name) {
    return foundationSection ? directChild(foundationSection, name, ['FRAME']) : null
  }
  function childNodes(parent, types = null) {
    if (!parent || !('children' in parent)) return []
    return parent.children.filter(node => !types || types.includes(node.type))
  }

  const expectedCollectionNames = new Set(Object.keys(FOUNDATION_EXPECTATIONS.collections))
  const allCollections = await figma.variables.getLocalVariableCollectionsAsync()
  const sourceCollections = allCollections.filter(collection => expectedCollectionNames.has(collection.name))
  const sourceCollectionIds = new Set(sourceCollections.map(collection => collection.id))
  const sourceVariables = (await figma.variables.getLocalVariablesAsync())
    .filter(variable => sourceCollectionIds.has(variable.variableCollectionId))
  const collectionById = new Map(sourceCollections.map(collection => [collection.id, collection]))
  const collections = sourceCollections.map(collection => ({
    id: collection.id,
    name: collection.name,
    owner: collection.getSharedPluginData('onda', 'owner'),
    modes: collection.modes.map(mode => ({ modeId: mode.modeId, name: mode.name })),
  }))
  const variables = sourceVariables.map(variable => {
    const collection = collectionById.get(variable.variableCollectionId)
    const modeId = collection?.modes?.[0]?.modeId || null
    return {
      id: variable.id,
      collectionId: variable.variableCollectionId,
      collectionName: collection?.name || '',
      name: variable.name,
      owner: variable.getSharedPluginData('onda', 'owner'),
      resolvedType: variable.resolvedType,
      scopes: [...variable.scopes],
      codeSyntax: cloneSerializable(variable.codeSyntax),
      modeId,
      value: modeId ? cloneSerializable(variable.valuesByMode[modeId]) : null,
    }
  })

  const swatches = []
  for (const parentName of ['Foundations / Graustufen', 'Foundations / Semantic Light', 'Foundations / Semantic Dark']) {
    const parent = childFrame(parentName)
    for (const swatch of childNodes(parent, ['FRAME']).filter(node => node.name.startsWith('Swatch / '))) {
      const labelName = `${swatch.name} / Label`
      const label = directChild(swatch, labelName, ['TEXT'])
      swatches.push({
        nodeId: swatch.id,
        name: swatch.name,
        parentName: parent?.name || '',
        type: swatch.type,
        fills: collectVisibleFillBindings(swatch.fills),
        labelName: label?.name || '',
        labelFills: collectVisibleFillBindings(label?.fills),
        labelCharactersLength: label?.characters?.length || 0,
        labelTextRanges: collectTextRangeBindings(label),
      })
    }
  }

  const spacing = childFrame('Foundations / Spacing')
  const spacingBars = childNodes(spacing, ['FRAME']).flatMap(row => childNodes(row, ['RECTANGLE']).map(bar => ({
    nodeId: bar.id,
    name: bar.name,
    parentName: row.name,
    containerName: spacing?.name || '',
    type: bar.type,
    width: bar.width,
    fills: collectVisibleFillBindings(bar.fills),
    fieldVariableIds: collectFieldVariableIds(bar, ['width']),
  })))

  const radius = childFrame('Foundations / Radien')
  const radiusFields = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius', 'maxWidth', 'maxHeight']
  const radiusSamples = childNodes(radius, ['RECTANGLE', 'ELLIPSE']).map(sample => ({
    nodeId: sample.id,
    name: sample.name,
    parentName: radius?.name || '',
    type: sample.type,
    width: sample.width,
    height: sample.height,
    cornerRadius: typeof sample.cornerRadius === 'number' ? sample.cornerRadius : null,
    fills: collectVisibleFillBindings(sample.fills),
    fieldVariableIds: collectFieldVariableIds(sample, radiusFields),
  }))

  const typography = childFrame('Foundations / Typografie')
  const textSpecimens = childNodes(typography, ['TEXT'])
    .filter(node => node.name.startsWith('Typografie / '))
    .map(node => ({
      nodeId: node.id,
      name: node.name,
      parentName: typography?.name || '',
      type: node.type,
      textStyleId: node.textStyleId,
      fills: collectVisibleFillBindings(node.fills),
      charactersLength: node.characters.length,
      textRanges: collectTextRangeBindings(node),
      fieldVariableIds: collectFieldVariableIds(node, ['fontSize', 'fontWeight']),
    }))
  const localTextStyles = (await figma.getLocalTextStylesAsync()).filter(style => style.name.startsWith('Onda/Type/'))
  const textStyles = localTextStyles.map(style => ({
    id: style.id,
    name: style.name,
    owner: style.getSharedPluginData('onda', 'owner'),
    fontName: cloneSerializable(style.fontName),
    fontSize: style.fontSize,
    lineHeight: cloneSerializable(style.lineHeight),
    letterSpacing: cloneSerializable(style.letterSpacing),
    textCase: style.textCase,
    textDecoration: style.textDecoration,
    fieldVariableIds: collectFieldVariableIds(style, ['fontSize', 'fontWeight']),
  }))

  const localEffectStyles = (await figma.getLocalEffectStylesAsync()).filter(style => style.name.startsWith('Onda/Shadow/'))
  const effectStyles = localEffectStyles.map(style => ({
    id: style.id,
    name: style.name,
    owner: style.getSharedPluginData('onda', 'owner'),
    effects: cloneSerializable(style.effects),
  }))
  const effectConsumers = []
  for (const style of localEffectStyles) {
    const consumers = await style.getStyleConsumersAsync()
    for (const consumer of consumers) {
      effectConsumers.push({
        nodeId: consumer.node.id,
        name: consumer.node.name,
        parentName: consumer.node.parent?.name || '',
        type: consumer.node.type,
        owner: consumer.node.getPluginData(CREATED_MARKER_KEY),
        componentId: consumer.node.parent?.type === 'COMPONENT_SET' ? consumer.node.parent.getPluginData('ondaComponentId') : '',
        cornerRadius: typeof consumer.node.cornerRadius === 'number' ? consumer.node.cornerRadius : null,
        effectStyleId: await readEffectStyleId(consumer.node),
        fields: [...consumer.fields].sort(),
        fills: collectVisibleFillBindings(consumer.node.fills),
      })
    }
  }

  return {
    fontDecision: cloneSerializable(fontDecision),
    collections,
    variables,
    swatches,
    spacingBars,
    radiusSamples,
    textStyles,
    textSpecimens,
    effectStyles,
    effectConsumers,
  }
}

function componentPaintEvidence(paints) {
  return collectVisibleFillBindings(paints).map(binding => ({
    ...binding,
    color: cloneSerializable(paints?.[binding.index]?.color),
  }))
}

async function collectComponentEvidence(page) {
  const definitionsByName = new Map(COMPONENT_DEFINITIONS.map(definition => [definition.name, definition]))
  const locations = collectComponentSectionCandidates(page)
  const candidates = locations.candidates
  const sampleNames = new Set(COMPONENT_DEFINITIONS.map(definition => `${definition.name} / Dokumentationsinstanz`))
  const setCandidates = candidates.filter(({ node }) => !sampleNames.has(node.name))
  const evidence = []
  for (const location of setCandidates) {
    const { node: set, parentId, parentType, parentName } = location
    const definition = definitionsByName.get(set.name)
    const variants = !('children' in set) ? [] : await Promise.all(set.children.map(async component => ({
      nodeId: component.id,
      name: component.name,
      owner: component.getPluginData(CREATED_MARKER_KEY),
      type: component.type,
      parentId: set.id,
      parentType: set.type,
      parentName: set.name,
      layoutMode: component.layoutMode,
      width: component.width,
      height: component.height,
      cornerRadius: component.cornerRadius,
      strokeWeight: component.strokeWeight,
      opacity: component.opacity,
      fills: componentPaintEvidence(component.fills),
      strokes: componentPaintEvidence(component.strokes),
      effects: cloneSerializable(component.effects),
      effectStyleId: await readEffectStyleId(component),
      fieldVariableIds: collectFieldVariableIds(component, [
        'itemSpacing', 'paddingTop', 'paddingLeft', 'paddingRight', 'paddingBottom',
        'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius',
      ]),
      dimensionValues: {
        itemSpacing: component.itemSpacing,
        paddingTop: component.paddingTop,
        paddingRight: component.paddingRight,
        paddingBottom: component.paddingBottom,
        paddingLeft: component.paddingLeft,
        minHeight: component.minHeight,
      },
      roles: !('children' in component) ? [] : component.children.map(role => ({
        nodeId: role.id,
        name: role.name,
        owner: role.getPluginData(CREATED_MARKER_KEY),
        type: role.type,
        parentId: component.id,
        parentType: component.type,
        parentName: component.name,
        characters: role.type === 'TEXT' ? role.characters : null,
        width: role.width,
        height: role.height,
        fills: componentPaintEvidence(role.fills),
        effects: cloneSerializable(role.effects),
        fieldVariableIds: collectFieldVariableIds(role, ['maxWidth', 'maxHeight']),
        characterPropertyKey: role.type === 'TEXT' ? role.componentPropertyReferences?.characters || null : null,
      })),
    })))
    const sampleName = `${set.name} / Dokumentationsinstanz`
    const samples = candidates.filter(({ node }) => node.name === sampleName)
    const sampleCandidate = samples.length === 1 ? samples[0] : null
    const identity = sampleCandidate?.node.type === 'INSTANCE'
      ? await readMainComponentIdentity(sampleCandidate.node)
      : { id: null }
    evidence.push({
      id: definition?.id || '',
      nodeId: set.id,
      name: set.name,
      owner: set.getPluginData(CREATED_MARKER_KEY),
      type: set.type,
      parentId,
      parentType,
      parentName,
      containerId: location.containerId,
      containerType: location.containerType,
      containerName: location.containerName,
      containerOwner: location.containerOwner,
      containerParentId: location.containerParentId,
      containerParentType: location.containerParentType,
      containerParentName: location.containerParentName,
      layoutMode: set.layoutMode,
      effects: cloneSerializable(set.effects),
      componentProperties: componentPropertyInventory(set),
      variants,
      sampleCount: samples.length,
      sample: sampleCandidate ? {
        nodeId: sampleCandidate.node.id,
        name: sampleCandidate.node.name,
        owner: sampleCandidate.node.getPluginData(CREATED_MARKER_KEY),
        type: sampleCandidate.node.type,
        parentId: sampleCandidate.parentId,
        parentType: sampleCandidate.parentType,
        parentName: sampleCandidate.parentName,
        containerId: sampleCandidate.containerId,
        containerType: sampleCandidate.containerType,
        containerName: sampleCandidate.containerName,
        containerOwner: sampleCandidate.containerOwner,
        containerParentId: sampleCandidate.containerParentId,
        containerParentType: sampleCandidate.containerParentType,
        containerParentName: sampleCandidate.containerParentName,
        mainComponentId: identity.id,
        documentation: sampleCandidate.node.getPluginData('ondaDocumentationInstance') === 'true',
        repeatedScreen: sampleCandidate.node.getPluginData('ondaRepeatedScreenInstance') === 'true',
        effects: cloneSerializable(sampleCandidate.node.effects),
      } : null,
    })
  }
  return {
    componentSets: evidence,
    targetPage: locations.targetPage,
    containers: locations.containers.map(({ node: _node, ...container }) => container),
  }
}

async function collectCoreViewEvidence(page) {
  const inventory = await collectCoreViewMutationInventory(page)
  const usedIds = new Set(CORE_VIEW_DEFINITIONS.flatMap(definition => definition.instances.map(instance => instance.setId)))
  const definitionsByName = new Map(COMPONENT_DEFINITIONS.filter(definition => usedIds.has(definition.id)).map(definition => [definition.name, definition]))
  const componentSection = directChild(page, '02 · Komponenten', ['SECTION'])
  const components = (componentSection?.children || [])
    .filter(node => node.type === 'COMPONENT_SET' && (usedIds.has(node.getPluginData('ondaComponentId')) || definitionsByName.has(node.name)))
    .map(set => ({
      id: set.getPluginData('ondaComponentId'),
      nodeId: set.id,
      name: set.name,
      type: set.type,
      owner: set.getPluginData(CREATED_MARKER_KEY),
      variants: [...set.children].filter(node => node.type === 'COMPONENT').map(variant => ({
        nodeId: variant.id,
        name: variant.name,
        type: variant.type,
        owner: variant.getPluginData(CREATED_MARKER_KEY),
      })),
    }))
  return {
    targetPage: inventory.targetPage,
    sections: inventory.sections,
    overview: inventory.overview,
    views: inventory.views,
    components,
  }
}

async function runVerify() {
  const inspection = await inspectCurrentTarget()
  const page = figma.currentPage
  const authorization = authorizeMutation(inspection.target)
  if (!authorization.ok) throw new Error(authorization.warning || inspection.target.warning)
  const ledger = readLedger(page)
  if (!ledger) throw new Error('Noch kein Onda-Ledger vorhanden. Inspect und mindestens eine Mutationsphase ausführen.')
  const requiredNames = new Set(SECTION_DEFINITIONS.map(section => section.name))
  const sections = page.children.filter(node => requiredNames.has(node.name))
  const allNodes = collectOndaNodes(sections)
  const annotationViews = allNodes.map(node => ({
    kind: node.getPluginData?.('ondaAnnotationKind'), view: node.getPluginData?.('ondaAnnotationView'),
  })).filter(item => item.kind && item.view)
  const dialogStates = allNodes.map(node => ({
    family: node.getPluginData?.('ondaDialogFamily'), state: node.getPluginData?.('ondaDialogState'),
  })).filter(item => item.family && item.state)
  const componentEvidence = await collectComponentEvidence(page)
  const coreViewEvidence = await collectCoreViewEvidence(page)
  const componentSets = componentEvidence.componentSets
  const baseline = await currentBaselineEvidence(page, ledger)
  const geometry = geometryEvidence(page, sections, allNodes, ledger, baseline.baselineRecords)
  const paints = paintsFromNodes(allNodes)
  const radii = radiiFromNodes(allNodes)
  const foundationSection = sections.find(node => node.name === '01 · Foundations')
  const foundationNodes = foundationSection ? collectOndaNodes([foundationSection]) : []
  const foundationEvidence = await collectFoundationEvidence(foundationSection, ledger.fontDecision)
  const effectsValid = allNodes.every(node => !('effects' in node) || !Array.isArray(node.effects) || node.effects.every(effect => !effect.color || isGrayColor(effect.color)))
  const fontStylesValid = TYPE_WEIGHTS.every(weight => ledger.fontDecision?.styles?.[weight])
  const reactionCount = (await Promise.all(allNodes.map(async node => (
    typeof node.getReactionsAsync === 'function' ? (await node.getReactionsAsync()).length : 0
  )))).reduce((total, count) => total + count, 0)
  const report = buildVerificationReport({
    targetAuthorized: authorization.ok,
    pageCount: figma.root.children.length,
    pageName: page.name,
    sections: sections.map(section => ({
      name: section.name,
      type: section.type,
      parentType: section.parent?.type,
      parentName: section.parent?.name,
      owner: section.getPluginData(CREATED_MARKER_KEY),
    })),
    annotationViews,
    dialogStates,
    componentSets,
    componentTargetPage: componentEvidence.targetPage,
    componentContainers: componentEvidence.containers,
    coreViews: coreViewEvidence,
    instanceCount: allNodes.filter(node => node.type === 'INSTANCE' && node.getPluginData('ondaDocumentationInstance') !== 'true').length,
    documentationInstanceCount: allNodes.filter(node => node.type === 'INSTANCE' && node.getPluginData('ondaDocumentationInstance') === 'true').length,
    repeatedScreenInstanceCount: allNodes.filter(node => node.type === 'INSTANCE' && node.getPluginData('ondaRepeatedScreenInstance') === 'true').length,
    foundation: {
      paintsValid: paints.every(isGrayColor),
      radiiValid: radii.every(radius => isValidRadius(radius.value, radius.geometry)),
      effectsValid,
      fontsValid: fontStylesValid,
      docsBound: foundationNodes.length > 0 && foundationNodes.every(node => node.getPluginData('ondaFoundationBound') === 'true'),
      ...foundationEvidence,
    },
    ...geometry,
    reactionCount,
    requiredReactionCount: 4,
    phases: ledger.phases,
    paints,
    radii,
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
  report.nonGrayPaintNodeCount = paints.filter(paint => !isGrayColor(paint)).length
  report.invalidRadiusNodes = radii.filter(radius => !isValidRadius(radius.value, radius.geometry)).map(radius => ({ id: radius.id, name: radius.name, value: radius.value }))
  report.preservedBaselineHash = report.preservedBaselineHash && baseline.mismatches.length === 0
  report.hardPass = report.hardPass && report.planErrors.length === 0
  report.baselineHash = ledger.baseline.hash
  report.currentBaselineHash = baseline.currentHash
  return report
}

function postResult(command, ok, message, counts = null, unlockMutations = false) {
  figma.ui.postMessage({ type: 'phase-result', command, ok, message, counts, unlockMutations })
}

async function handleCommand(command) {
  if (command === 'inspect') {
    const inspection = await inspectCurrentTarget()
    const authorization = authorizeMutation(inspection.target)
    postResult(command, Boolean(inspection.target.ok || inspection.target.readOnlyOk), inspectionMessage(inspection), {
      pageCount: inspection.pageCount,
      baselineTopLevelCount: inspection.ledger ? inspection.ledger.baseline.topLevelCount : inspection.pendingBaseline.topLevelCount,
      baselineNodeCount: inspection.ledger ? (inspection.ledger.baseline.recordCount ?? inspection.ledger.baseline.nodeIds?.length ?? 0) : inspection.pendingBaseline.records.length,
      fontFamily: inspection.fontDecision.family,
      exactFont: inspection.fontDecision.exact,
      targetFallback: inspection.target.fallback,
      completedPhases: Object.entries(inspection.ledger?.phases || {}).filter(([, value]) => value.status === 'success').map(([id]) => id),
    }, authorization.ok)
    return
  }
  if (command === 'verify') {
    const ledger = readLedger(figma.currentPage)
    const transition = validatePhaseTransition(command, ledger?.phases || {})
    if (!transition.ok) throw new Error(transition.warning)
    const report = await runVerify()
    const hardPass = report.hardPass
    postResult(command, hardPass, hardPass ? 'Alle strukturellen Hard Gates bestanden.' : 'Verify hat offene Hard Gates gefunden.', report, true)
    return
  }
  async function runMutation({ page, ledger }, validatedInventory = null, resolvedInventoryNodes = null) {
    const transition = validatePhaseTransition(command, ledger.phases)
    if (!transition.ok) throw new Error(transition.warning)
    let counts
    if (command === 'foundations') counts = await runFoundations(page, ledger)
    else if (command === 'core-views') counts = await runCoreViews(page, ledger, validatedInventory, resolvedInventoryNodes)
    else if (command === 'dialogs-and-secondary') counts = await runDialogsAndSecondary(page, ledger, validatedInventory, resolvedInventoryNodes)
    else if (command.startsWith('component-')) counts = await runComponent(page, ledger, command.slice('component-'.length), validatedInventory)
    else if (command.startsWith('annotations-')) counts = await runAnnotationBatch(page, ledger, Number(command.slice('annotations-'.length)) - 1)
    else throw new Error(`Unbekannter Befehl: ${command}`)
    markPhase(page, ledger, command, counts)
    postResult(command, true, 'Phase erfolgreich abgeschlossen und strukturell gezählt.', counts, true)
  }
  if (command === 'foundations') {
    await executeFoundationMutation({
      preflight: preflightFoundationMutation,
      requireContext: requireMutationContext,
      mutate: runMutation,
    })
    return
  }
  if (command.startsWith('component-')) {
    const componentId = command.slice('component-'.length)
    const phases = readLedger(figma.currentPage)?.phases || {}
    await executeGuardedComponentCommand({
      command,
      phases,
      preflight: () => preflightComponentMutation(componentId),
      requireContext: requireMutationContext,
      collectCurrentInventory: () => collectComponentMutationInventory(componentId),
      mutate: runMutation,
    })
    return
  }
  if (command === 'core-views') {
    const phases = readLedger(figma.currentPage)?.phases || {}
    await executeGuardedCoreViewCommand({
      command,
      phases,
      preflight: preflightCoreViewMutation,
      requireContext: requireMutationContext,
      collectCurrentInventory: ({ page }) => collectCoreViewMutationInventory(page),
      resolveInventoryNodes: async ({ page, ledger }, inventory) => {
        await loadDecisionFonts(ledger.fontDecision)
        return resolveCoreInventoryNodes(inventory, page)
      },
      mutate: runMutation,
    })
    return
  }
  if (command === 'dialogs-and-secondary') {
    const phases = readLedger(figma.currentPage)?.phases || {}
    await executeGuardedSecondaryViewCommand({
      command,
      phases,
      preflight: preflightSecondaryViewMutation,
      requireContext: requireMutationContext,
      collectCurrentInventory: ({ page }) => collectSecondaryViewMutationInventory(page),
      resolveInventoryNodes: resolveSecondaryInventoryNodes,
      mutate: runMutation,
    })
    return
  }
  const context = await requireMutationContext()
  await runMutation(context)
}

figma.ui.onmessage = async message => {
  if (!message) return
  try {
    if (message.type !== 'run-command') return
    await handleCommand(message.command)
  } catch (error) {
    postResult(message.command || 'unknown', false, error instanceof Error ? error.message : String(error), null, false)
  }
}
