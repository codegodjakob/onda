import test from 'node:test'
import assert from 'node:assert/strict'
import * as definitions from '../src/definitions.mjs'
import * as plan from '../src/plan.mjs'

const AGENT_SOURCES = [
  ['Gespräch · Bereit', ['aura@State=Idle', 'agent-message@Role=User', 'composer@State=Empty']],
  ['Gespräch · Antwort entsteht', ['aura@State=Working', 'agent-message@State=Streaming', 'composer@State=Draft']],
  ['Gespräch · Antwort bereit', ['aura@State=Complete', 'agent-message@Role=Agent', 'evidence-card@Status=Unverified', 'source-card@Status=Ready']],
  ['Gespräch · Fehler & Rückkehr', ['aura@State=Error', 'agent-message@State=Error', 'composer@State=Draft', 'status-symbol@Status=Error']],
  ['Entscheidungsverlauf', ['decision-card@Status=Pending', 'decision-card@Status=Accepted', 'decision-card@Status=Rejected', 'decision-card@Status=Overridden']],
  ['Evidence · Prüfmatrix', ['evidence-card@Status=Unverified', 'evidence-card@Status=Verified', 'evidence-card@Status=Conflict', 'evidence-card@Status=Missing', 'tag@Kind=Source']],
  ['Quellen · Bereit und Laden', ['source-card@Status=Ready', 'source-card@Status=Loading']],
  ['Quellen · Ungültig oder offline', ['source-card@Status=Invalid', 'source-card@Status=Offline', 'evidence-card@Status=Missing']],
  ['Import · Auswahl und Validierung', ['import-panel@State=Empty', 'import-panel@State=Validating']],
  ['Import · Bereit', ['import-panel@State=Ready', 'source-card@Status=Ready']],
  ['Import · Fehler', ['import-panel@State=Error', 'status-symbol@Status=Error']],
  ['Leser · Fundstelle', ['reader-panel@State=Reading', 'reader-panel@State=Highlight', 'evidence-card@Status=Verified']],
  ['Leser · Nicht verfügbar', ['reader-panel@State=Unavailable', 'source-card@Status=Offline', 'status-symbol@Status=Error']],
  ['Recherche · Übersicht', ['research-card@Status=Planned', 'research-card@Status=Running', 'research-card@Status=Paused', 'research-card@Status=Ready']],
  ['Recherche · Fehler', ['research-card@Status=Error', 'aura@State=Error', 'status-symbol@Status=Error']],
]

const SECONDARY = [
  ['Einstellungen · Bereit', ['field@State=Filled', 'select@State=Selected', 'mode-toggle@Mode=Text, State=Active', 'button@Kind=Primary, State=Default', 'button@Kind=Secondary, State=Default']],
  ['Einstellungen · Validierungsfehler', ['field@State=Error', 'select@State=Open', 'mode-toggle@Mode=Text, State=Active', 'button@Kind=Primary, State=Default', 'button@Kind=Secondary, State=Default']],
  ['Link-Menü · Geöffnet', ['menu-item@State=Default', 'menu-item@State=Hover', 'menu-item@State=Selected', 'menu-item@State=Disabled']],
  ['Slash-Menü · Suche leer', ['search@State=Empty', 'menu-item@State=Default', 'menu-item@State=Default']],
  ['Slash-Menü · Treffer', ['search@State=Results', 'menu-item@State=Default', 'menu-item@State=Selected']],
  ['Slash-Menü · Keine Treffer', ['search@State=No Results', 'empty-state@Context=No Active Annotation', 'button@Kind=Secondary, State=Default']],
  ['Blockeinfügung · Position wählen', ['select@State=Open', 'menu-item@State=Selected', 'dialog-action@Kind=Primary', 'dialog-action@Kind=Secondary']],
  ['Quellenleser · Fundstelle übernehmen', ['reader-panel@State=Highlight', 'evidence-card@Status=Verified', 'dialog-action@Kind=Primary', 'dialog-action@Kind=Secondary']],
  ['Rechercheablauf · Pausiert und Fehler', ['research-card@Status=Paused', 'research-card@Status=Error', 'menu-item@State=Default', 'menu-item@State=Default']],
]

const RESPONSIVE = [
  ['Responsive / Bibliothek · 1440 Light', 1440, 'Light', 'Bibliothek', ['nav-item@State=Default', 'search@State=Empty', 'select@State=Selected', 'list-row@State=Default']],
  ['Responsive / Bibliothek · 1024 Light', 1024, 'Light', 'Bibliothek', ['nav-item@State=Default', 'search@State=Empty', 'select@State=Selected', 'list-row@State=Default']],
  ['Responsive / Bibliothek · 720 Light', 720, 'Light', 'Bibliothek', ['nav-item@State=Collapsed', 'search@State=Empty', 'select@State=Selected', 'list-row@State=Default']],
  ['Responsive / Bibliothek · 320 Light', 320, 'Light', 'Bibliothek', ['nav-item@State=Collapsed', 'search@State=Empty', 'select@State=Selected', 'list-row@State=Default']],
  ['Responsive / Editor · 1440 Light', 1440, 'Light', 'Editor', ['nav-item@State=Default', 'mode-toggle@Mode=Text, State=Active', 'review-bar@Status=Open', 'annotation-anchor@Kind=Text, State=Idle', 'annotation-card@State=Open']],
  ['Responsive / Editor · 1024 Light', 1024, 'Light', 'Editor', ['nav-item@State=Default', 'mode-toggle@Mode=Text, State=Active', 'review-bar@Status=Open', 'annotation-anchor@Kind=Text, State=Idle', 'annotation-card@State=Open']],
  ['Responsive / Editor · 720 Light', 720, 'Light', 'Editor', ['nav-item@State=Collapsed', 'mode-toggle@Mode=Text, State=Active', 'review-bar@Status=Open', 'annotation-anchor@Kind=Text, State=Idle', 'annotation-card@State=Open']],
  ['Responsive / Editor · 320 Light', 320, 'Light', 'Editor', ['nav-item@State=Collapsed', 'mode-toggle@Mode=Text, State=Active', 'review-bar@Status=Open', 'annotation-anchor@Kind=Text, State=Idle', 'annotation-card@State=Open']],
  ['Responsive / Bibliothek · 1440 Dark', 1440, 'Dark', 'Bibliothek', ['nav-item@State=Default', 'search@State=Empty', 'select@State=Selected', 'list-row@State=Default']],
  ['Responsive / Bibliothek · 320 Dark', 320, 'Dark', 'Bibliothek', ['nav-item@State=Collapsed', 'search@State=Empty', 'select@State=Selected', 'list-row@State=Default']],
  ['Responsive / Editor · 1440 Dark', 1440, 'Dark', 'Editor', ['nav-item@State=Default', 'mode-toggle@Mode=Text, State=Active', 'review-bar@Status=Open', 'annotation-anchor@Kind=Text, State=Idle', 'annotation-card@State=Open']],
  ['Responsive / Editor · 320 Dark', 320, 'Dark', 'Editor', ['nav-item@State=Collapsed', 'mode-toggle@Mode=Text, State=Active', 'review-bar@Status=Open', 'annotation-anchor@Kind=Text, State=Idle', 'annotation-card@State=Open']],
  ['Responsive / Annotation · Beleg fehlt · Dark', 720, 'Dark', 'Annotation', ['annotation-anchor@Kind=Text, State=Active', 'annotation-form@Form=Source', 'annotation-card@State=Open', 'dialog-action@Kind=Primary', 'dialog-action@Kind=Secondary']],
  ['Responsive / Agent · Streaming · Dark', 720, 'Dark', 'Agent', ['aura@State=Working', 'agent-message@State=Streaming', 'composer@State=Draft', 'dialog-action@Kind=Disabled']],
  ['Responsive / Evidence · Konflikt · Dark', 720, 'Dark', 'Evidence', ['evidence-card@Status=Conflict', 'source-card@Status=Invalid', 'reader-panel@State=Highlight']],
  ['Responsive / Dialog · Lang · Dark', 720, 'Dark', 'Dialog', ['dialog@Size=Long', 'dialog-action@Kind=Primary', 'dialog-action@Kind=Secondary']],
]

function deepFrozen(value) {
  if (!value || typeof value !== 'object') return true
  return Object.isFrozen(value) && Object.values(value).every(deepFrozen)
}

function mapping(view) {
  return view.instances.map(instance => `${instance.setId}@${instance.variant}`)
}

function expectedVariantCopy(instance) {
  const component = definitions.COMPONENT_DEFINITIONS.find(item => item.id === instance.setId)
  const variant = component.variants.find(item => item.name === instance.variant)
  return Object.fromEntries(component.roles
    .filter(role => role.type === 'TEXT')
    .map(role => [role.name, variant.copy[role.name]]))
}

function namedView(group, name) {
  return definitions.SECONDARY_VIEW_DEFINITIONS[group].find(view => view.name === name)
}

function mappedInstance(view, setId, variant) {
  return view.instances.find(instance => instance.setId === setId && instance.variant === variant)
}

const TARGET_SECTION_NAMES = ['07 · Agent & Quellen', '09 · Menüs & Nebenansichten', '10 · Responsive & Dark']

function secondaryDefinitions() {
  return Object.entries(definitions.SECONDARY_VIEW_DEFINITIONS)
    .flatMap(([group, views]) => views.map(view => ({ group, view })))
}

function secondaryInventory({ complete = true } = {}) {
  const variables = [
    { id: 'variable:surface', name: 'color/surface' },
    { id: 'variable:border', name: 'color/border' },
    ...definitions.SPACING_TOKENS.map(token => ({ id: `variable:${token.name}`, name: token.name })),
  ]
  const components = definitions.COMPONENT_DEFINITIONS.map(component => ({
    id: component.id, nodeId: `set:${component.id}`, name: component.name, type: 'COMPONENT_SET', owner: definitions.PLUGIN_ORIGIN,
    childIds: component.variants.map((_, index) => `component:${component.id}:${index}`), childCount: component.variants.length,
    variants: component.variants.map((variant, index) => ({
      nodeId: `component:${component.id}:${index}`, name: variant.name, type: 'COMPONENT', owner: definitions.PLUGIN_ORIGIN,
      parentId: `set:${component.id}`, parentType: 'COMPONENT_SET', parentName: component.name,
    })),
  }))
  const targetPage = {
    id: 'page:1', nodeId: 'page:1', name: 'Page 1', type: 'PAGE',
    childIds: complete ? TARGET_SECTION_NAMES.map((_, index) => `section:secondary:${index}`) : [], childCount: complete ? 3 : 0,
    bounds: { x: 0, y: 0, width: 2200, height: 12000 }, absoluteBounds: { x: 0, y: 0, width: 2200, height: 12000 },
    fills: [], strokes: [], effects: [], effectStyleId: null, opacity: 1, visible: true,
    pluginData: { owner: '' },
  }
  if (!complete) return { targetPage, sections: [], views: [], legacyViews: [], components, variables }
  const sections = TARGET_SECTION_NAMES.map((name, index) => ({
    nodeId: `section:secondary:${index}`, name, type: 'SECTION', owner: definitions.PLUGIN_ORIGIN,
    parentId: targetPage.id, parentType: 'PAGE', parentName: targetPage.name,
    childIds: [], childCount: 0, x: 0, y: index * 4000,
    bounds: { x: 0, y: index * 4000, width: 2200, height: 3800 }, absoluteBounds: { x: 0, y: index * 4000, width: 2200, height: 3800 },
    fills: [], strokes: [], effects: [], effectStyleId: null, opacity: 1, visible: true,
    pluginData: { owner: definitions.PLUGIN_ORIGIN },
  }))
  const sectionByName = new Map(sections.map(section => [section.name, section]))
  const sectionIndexes = new Map(TARGET_SECTION_NAMES.map(name => [name, 0]))
  const views = secondaryDefinitions().map(({ group, view }, viewIndex) => {
    const section = sectionByName.get(view.sectionName)
    const index = sectionIndexes.get(view.sectionName)
    sectionIndexes.set(view.sectionName, index + 1)
    const nodeId = `secondary:view:${viewIndex}`
    const bounds = { x: 80, y: section.y + 100 + index * 1100, width: view.width, height: 960 }
    const regionIds = new Map(view.regions.map((region, regionIndex) => [region.name, `secondary:region:${viewIndex}:${regionIndex}`]))
    const spacingBinding = value => value === 0 ? [] : [`variable:spacing/${value}`]
    const layoutRegions = view.regions.map((region, regionIndex) => ({
      nodeId: regionIds.get(region.name), name: region.name, type: 'FRAME', owner: definitions.PLUGIN_ORIGIN,
      parentId: region.parentName === view.name ? nodeId : regionIds.get(region.parentName), parentType: 'FRAME', parentName: region.parentName,
      childIds: [], childCount: 0, x: regionIndex * 5, y: regionIndex * 7, width: region.width, height: region.height,
      bounds: { x: regionIndex * 5, y: regionIndex * 7, width: region.width, height: region.height },
      absoluteBounds: { x: bounds.x + regionIndex * 5, y: bounds.y + regionIndex * 7, width: region.width, height: region.height },
      layoutMode: region.layoutMode, primaryAxisSizingMode: 'FIXED', counterAxisSizingMode: 'FIXED',
      primaryAxisAlignItems: 'MIN', counterAxisAlignItems: 'MIN', itemSpacing: region.itemSpacing,
      paddingTop: region.padding.top, paddingRight: region.padding.right, paddingBottom: region.padding.bottom, paddingLeft: region.padding.left,
      layoutWrap: 'NO_WRAP', layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED', layoutPositioning: 'AUTO', layoutAlign: 'INHERIT', layoutGrow: 0,
      fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, boundVariables: { color: { id: 'variable:surface' } } }],
      strokes: [{ type: 'SOLID', color: { r: .82, g: .82, b: .82 }, boundVariables: { color: { id: 'variable:border' } } }], strokeWeight: 1,
      fillBindings: [{ index: 0, type: 'SOLID', variableIds: ['variable:surface'] }], strokeBindings: [{ index: 0, type: 'SOLID', variableIds: ['variable:border'] }],
      fieldVariableIds: {
        itemSpacing: spacingBinding(region.itemSpacing),
        paddingTop: spacingBinding(region.padding.top), paddingRight: spacingBinding(region.padding.right),
        paddingBottom: spacingBinding(region.padding.bottom), paddingLeft: spacingBinding(region.padding.left),
      }, effects: [], effectStyleId: null,
      opacity: 1, visible: true, cornerRadius: 0, pluginData: { owner: definitions.PLUGIN_ORIGIN },
    }))
    const regionByName = new Map(layoutRegions.map(region => [region.name, region]))
    const copyNodes = view.copyContracts.map((contract, copyIndex) => ({
      nodeId: `secondary:copy:${viewIndex}:${copyIndex}`, name: `Copy / ${contract.role}`, type: 'TEXT', owner: definitions.PLUGIN_ORIGIN,
      parentId: regionIds.get(contract.region), parentType: 'FRAME', parentName: contract.region,
      role: contract.role, characters: contract.characters, childIds: [], childCount: 0,
      bounds: { x: 16, y: 16 + copyIndex * 30, width: 240, height: 22 },
      absoluteBounds: { x: bounds.x + 16, y: bounds.y + 16 + copyIndex * 30, width: 240, height: 22 },
      fills: [{ type: 'SOLID', color: { r: .08, g: .08, b: .08 } }], strokes: [], fillBindings: [], strokeBindings: [],
      fieldVariableIds: { fontSize: ['variable:body'] }, textRangeBindings: [{ start: 0, end: contract.characters.length, variableIds: ['variable:text'] }],
      effects: [], effectStyleId: null, opacity: 1, visible: true, pluginData: { owner: definitions.PLUGIN_ORIGIN, role: contract.role },
    }))
    const instances = view.instances.map((contract, instanceIndex) => {
      const component = definitions.COMPONENT_DEFINITIONS.find(item => item.id === contract.setId)
      const variantIndex = component.variants.findIndex(item => item.name === contract.variant)
      const instanceId = `secondary:instance:${viewIndex}:${instanceIndex}`
      const roleDescendants = component.roles.filter(role => role.type === 'TEXT').map((role, roleIndex) => ({
        nodeId: `secondary:role:${viewIndex}:${instanceIndex}:${roleIndex}`, name: `Role/${role.name}`, type: 'TEXT', owner: definitions.PLUGIN_ORIGIN,
        parentId: instanceId, parentType: 'INSTANCE', parentName: contract.name, parentInstanceId: instanceId,
        ancestorIds: [instanceId], role: role.name, characters: contract.roleCopy[role.name], childIds: [], childCount: 0,
        bounds: { x: 12 + roleIndex * 20, y: 12, width: 60, height: 22 },
        absoluteBounds: { x: bounds.x + 12 + roleIndex * 20, y: bounds.y + 12, width: 60, height: 22 },
        fills: [{ type: 'SOLID', color: { r: .08, g: .08, b: .08 } }], strokes: [], fillBindings: [], strokeBindings: [],
        fieldVariableIds: { fontSize: ['variable:body'] }, textRangeBindings: [], effects: [], effectStyleId: null,
        opacity: 1, visible: true, pluginData: { owner: definitions.PLUGIN_ORIGIN, role: role.name },
      }))
      return {
        nodeId: instanceId, name: contract.name, type: 'INSTANCE', owner: definitions.PLUGIN_ORIGIN,
        parentId: regionIds.get(contract.region), parentType: 'FRAME', parentName: contract.region, region: contract.region,
        childIds: roleDescendants.map(role => role.nodeId), childCount: roleDescendants.length,
        bounds: { x: 24, y: 80 + instanceIndex * 80, width: contract.expectedWidth, height: contract.expectedHeight },
        absoluteBounds: { x: bounds.x + 24, y: bounds.y + 80 + instanceIndex * 80, width: contract.expectedWidth, height: contract.expectedHeight },
        repeatedScreen: true, documentation: false,
        mainComponentId: `component:${contract.setId}:${variantIndex}`, componentId: `component:${contract.setId}:${variantIndex}`,
        componentSetId: `set:${contract.setId}`, componentSetName: component.name, variantName: contract.variant,
        labelValue: contract.label, componentProperties: { Label: { type: 'TEXT', value: contract.label } }, roleCopy: structuredClone(contract.roleCopy),
        fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }], strokes: [], fillBindings: [], strokeBindings: [], fieldVariableIds: {},
        effects: [], effectStyleId: component.effectStyleName ? `style:${component.id}` : null, opacity: 1, visible: true, cornerRadius: component.radius,
        pluginData: { owner: definitions.PLUGIN_ORIGIN, repeatedScreen: 'true', documentation: '' }, roleDescendants,
      }
    })
    for (const region of layoutRegions) {
      region.childIds = [
        ...layoutRegions.filter(child => child.parentId === region.nodeId).map(child => child.nodeId),
        ...copyNodes.filter(child => child.parentId === region.nodeId).map(child => child.nodeId),
        ...instances.filter(child => child.parentId === region.nodeId).map(child => child.nodeId),
      ]
      region.childCount = region.childIds.length
    }
    const marker = { group, theme: view.theme, subject: view.subject || null, breakpoint: view.breakpoint ?? null }
    const record = {
      nodeId, name: view.name, type: 'FRAME', owner: definitions.PLUGIN_ORIGIN,
      parentId: section.nodeId, parentType: 'SECTION', parentName: section.name,
      childIds: layoutRegions.filter(region => region.parentId === nodeId).map(region => region.nodeId), childCount: layoutRegions.filter(region => region.parentId === nodeId).length,
      x: bounds.x, y: bounds.y, width: view.width, height: 960, bounds, absoluteBounds: bounds,
      layoutMode: view.layoutMode, primaryAxisSizingMode: 'FIXED', counterAxisSizingMode: 'FIXED', primaryAxisAlignItems: 'MIN', counterAxisAlignItems: 'MIN',
      itemSpacing: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, layoutWrap: 'NO_WRAP', layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED',
      fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }], strokes: [], fillBindings: [], strokeBindings: [], fieldVariableIds: {},
      effects: [], effectStyleId: null, opacity: 1, visible: true, cornerRadius: 0,
      secondaryView: marker, group, theme: view.theme, subject: view.subject || null, breakpoint: view.breakpoint ?? null,
      pluginData: { owner: definitions.PLUGIN_ORIGIN, secondaryView: JSON.stringify(marker) },
      layoutRegions, copyNodes, instances, standIns: [],
    }
    section.childIds.push(nodeId)
    section.childCount += 1
    return record
  })
  return { targetPage, sections, views, legacyViews: [], components, variables }
}

function nestInventoryChild(child, container, prefix) {
  const childId = child.nodeId
  const inner = {
    nodeId: `${prefix}:inner`, name: `${prefix} / Inner`, type: 'FRAME', owner: definitions.PLUGIN_ORIGIN,
    parentId: `${prefix}:outer`, parentType: 'GROUP', parentName: `${prefix} / Outer`, childIds: [childId], childCount: 1,
  }
  const outer = {
    nodeId: `${prefix}:outer`, name: `${prefix} / Outer`, type: 'GROUP', owner: definitions.PLUGIN_ORIGIN,
    parentId: container.nodeId, parentType: container.type, parentName: container.name, childIds: [inner.nodeId], childCount: 1,
  }
  const childIndex = container.childIds.indexOf(childId)
  assert.notEqual(childIndex, -1)
  container.childIds.splice(childIndex, 1, outer.nodeId)
  child.parentId = inner.nodeId
  child.parentType = inner.type
  child.parentName = inner.name
  child.ancestorIds = [inner.nodeId, outer.nodeId, container.nodeId]
  child.ancestorChain = [inner, outer]
  return { inner, outer }
}

function withUntouchedPageChildren(inventory = secondaryInventory()) {
  const untouchedPageChildren = [
    {
      nodeId: 'section:untouched:08', name: '08 · Dialoge', type: 'SECTION', owner: definitions.PLUGIN_ORIGIN,
      parentId: inventory.targetPage.nodeId, parentType: 'PAGE', parentName: inventory.targetPage.name,
      childIds: ['untouched:08:existing-child'], childCount: 1, visible: true,
    },
    {
      nodeId: 'section:untouched:11', name: '11 · Prototyp', type: 'SECTION', owner: definitions.PLUGIN_ORIGIN,
      parentId: inventory.targetPage.nodeId, parentType: 'PAGE', parentName: inventory.targetPage.name,
      childIds: ['untouched:11:existing-child'], childCount: 1, visible: true,
    },
    {
      nodeId: 'foreign:baseline:notes', name: 'Research notes', type: 'FRAME', owner: 'another-plugin',
      parentId: inventory.targetPage.nodeId, parentType: 'PAGE', parentName: inventory.targetPage.name,
      childIds: ['foreign:baseline:notes:child'], childCount: 1, visible: true,
    },
  ]
  inventory.untouchedPageChildren = untouchedPageChildren
  inventory.targetPage.childIds = [
    inventory.sections[0].nodeId,
    untouchedPageChildren[0].nodeId,
    inventory.sections[1].nodeId,
    inventory.sections[2].nodeId,
    untouchedPageChildren[1].nodeId,
    untouchedPageChildren[2].nodeId,
  ]
  inventory.targetPage.childCount = inventory.targetPage.childIds.length
  return inventory
}

function withUntouchedPageCandidate(candidate, inventory = withUntouchedPageChildren()) {
  const child = {
    nodeId: `untouched:probe:${inventory.untouchedPageChildren.length}`,
    type: 'FRAME', owner: 'another-plugin', childIds: [], childCount: 0, visible: true,
    parentId: inventory.targetPage.nodeId, parentType: 'PAGE', parentName: inventory.targetPage.name,
    ...candidate,
  }
  inventory.untouchedPageChildren.push(child)
  inventory.targetPage.childIds.push(child.nodeId)
  inventory.targetPage.childCount = inventory.targetPage.childIds.length
  return { inventory, child }
}

function priorSecondaryPhases() {
  return Object.fromEntries([
    'inspect', 'foundations',
    ...definitions.COMPONENT_DEFINITIONS.map(component => `component-${component.id}`),
    'core-views', ...Array.from({ length: 6 }, (_, index) => `annotations-${index + 1}`),
  ].map(id => [id, { status: 'success' }]))
}

async function rejectBeforeSecondaryWrite(currentInventory, pattern = /Secondary|TOCTOU|Nebenansicht/i) {
  const before = secondaryInventory()
  let writes = 0
  await assert.rejects(() => plan.executeGuardedSecondaryViewCommand({
    command: 'dialogs-and-secondary', phases: priorSecondaryPhases(),
    preflight: async () => before,
    requireContext: async () => ({ page: before.targetPage }),
    collectCurrentInventory: async () => structuredClone(currentInventory),
    mutate: async () => { writes += 1 },
  }), pattern)
  assert.equal(writes, 0)
}

test('deeply frozen secondary contract defines the exact ordered 15/9/16 matrix with complete nested instance contracts', () => {
  const matrix = definitions.SECONDARY_VIEW_DEFINITIONS
  assert.ok(matrix, 'SECONDARY_VIEW_DEFINITIONS missing')
  assert.equal(deepFrozen(matrix), true)
  const groups = [
    ['agentSources', AGENT_SOURCES, 'Agent & Quellen / ', '07 · Agent & Quellen'],
    ['secondary', SECONDARY, 'Nebenansicht / ', '09 · Menüs & Nebenansichten'],
  ]
  for (const [groupName, expected, prefix, sectionName] of groups) {
    const views = matrix[groupName]
    assert.deepEqual(views.map(view => view.name), expected.map(([name]) => `${prefix}${name}`))
    for (const [view, [, expectedMapping]] of views.map((view, index) => [view, expected[index]])) {
      assert.equal(view.sectionName, sectionName)
      assert.equal(view.width, 1440)
      assert.equal(view.theme, 'Light')
      assert.notEqual(view.layoutMode, 'NONE')
      assert.ok(view.regions.length > 1)
      assert.deepEqual(mapping(view), expectedMapping)
    }
  }
  assert.deepEqual(matrix.responsive.map(view => view.name), RESPONSIVE.map(([name]) => name))
  for (const [view, [, width, theme, subject, expectedMapping]] of matrix.responsive.map((view, index) => [view, RESPONSIVE[index]])) {
    assert.equal(view.sectionName, '10 · Responsive & Dark')
    assert.equal(view.width, width)
    assert.equal(view.theme, theme)
    assert.equal(view.subject, subject)
    assert.equal(view.breakpoint, width === 720 && /Dark$/.test(view.name) && !/Bibliothek|Editor/.test(view.name) ? 'reference' : width)
    assert.notEqual(view.layoutMode, 'NONE')
    assert.deepEqual(mapping(view), expectedMapping)
    if (width === 320) {
      assert.equal(view.layoutMode, 'VERTICAL')
      assert.ok(view.regions.every(region => Object.values(region.padding).every(value => value === 16)))
    }
  }
  const all = Object.values(matrix).flat()
  assert.equal(all.length, 40)
  for (const view of all) {
    const regions = new Set(view.regions.map(region => region.name))
    assert.ok(view.regions.every(region => region.parentName === view.name || regions.has(region.parentName)))
    assert.ok(view.regions.every(region => region.layoutMode !== 'NONE'))
    assert.ok(view.copyContracts.every(copy => regions.has(copy.region)))
    for (const instance of view.instances) {
      const component = definitions.COMPONENT_DEFINITIONS.find(item => item.id === instance.setId)
      assert.ok(component, `${view.name}/${instance.name}: unknown component`)
      assert.ok(regions.has(instance.region), `${view.name}/${instance.name}: unknown region`)
      assert.equal(instance.expectedHeight, definitions.componentRenderedHeight(component))
      assert.deepEqual(Object.keys(instance.roleCopy).sort(), component.roles.filter(role => role.type === 'TEXT').map(role => role.name).sort())
    }
  }
})

test('Agent and Quellen variants preserve their explicit German state semantics and coherent source/evidence states', () => {
  for (const view of definitions.SECONDARY_VIEW_DEFINITIONS.agentSources) {
    for (const instance of view.instances) assert.deepEqual(
      instance.roleCopy,
      expectedVariantCopy(instance),
      `${view.name}/${instance.setId}@${instance.variant}: state copy overwritten`,
    )
  }
  const invalid = namedView('agentSources', 'Agent & Quellen / Quellen · Ungültig oder offline')
  assert.equal(mappedInstance(invalid, 'source-card', 'Status=Invalid').roleCopy.Status, 'Ungültig')
  assert.equal(mappedInstance(invalid, 'source-card', 'Status=Offline').roleCopy.Status, 'Offline')
  assert.deepEqual(mappedInstance(invalid, 'evidence-card', 'Status=Missing').roleCopy, {
    Symbol: '—', Claim: 'Kein Beleg verknüpft', Source: 'Quelle fehlt', Confidence: 'Nicht bewertbar', Action: 'Quelle hinzufügen',
  })
  const matrix = namedView('agentSources', 'Agent & Quellen / Evidence · Prüfmatrix')
  assert.deepEqual(matrix.instances.filter(instance => instance.setId === 'evidence-card').map(instance => instance.roleCopy.Confidence), [
    'Einschätzung: offen', 'Einschätzung: hoch', 'Einschätzung: unklar', 'Nicht bewertbar',
  ])
})

test('Dark responsive references use subject-specific annotation, streaming, conflict, and long-dialog copy without generic labels', () => {
  const annotation = namedView('responsive', 'Responsive / Annotation · Beleg fehlt · Dark')
  assert.deepEqual(mappedInstance(annotation, 'annotation-card', 'State=Open').roleCopy, {
    Type: 'Empfehlung', Title: 'Beleg fehlt', Body: 'Diese Aussage braucht eine überprüfbare Quelle.', Scope: 'Nur diesmal',
    'Primary Action': 'Quelle verknüpfen', 'Secondary Action': 'Später prüfen', Status: 'Offen',
  })
  assert.deepEqual(mappedInstance(annotation, 'dialog-action', 'Kind=Primary').roleCopy, { Symbol: '→', Label: 'Quelle verknüpfen', Hint: 'Geprüfte Fundstelle übernehmen' })
  assert.deepEqual(mappedInstance(annotation, 'dialog-action', 'Kind=Secondary').roleCopy, { Symbol: '←', Label: 'Später prüfen', Hint: 'Hinweis bleibt offen' })

  const agent = namedView('responsive', 'Responsive / Agent · Streaming · Dark')
  assert.equal(mappedInstance(agent, 'aura', 'State=Working').roleCopy.Label, 'Aura prüft den Auftrag')
  assert.equal(mappedInstance(agent, 'agent-message', 'State=Streaming').roleCopy.Status, 'Wird geladen')
  assert.deepEqual(mappedInstance(agent, 'dialog-action', 'Kind=Disabled').roleCopy, { Symbol: '×', Label: 'Senden gesperrt', Hint: 'Antwort wird noch erstellt' })

  const conflict = namedView('responsive', 'Responsive / Evidence · Konflikt · Dark')
  assert.deepEqual(mappedInstance(conflict, 'evidence-card', 'Status=Conflict').roleCopy, {
    Symbol: '!', Claim: 'Quellen widersprechen sich', Source: 'Zwei abweichende Fundstellen', Confidence: 'Einschätzung: unklar', Action: 'Konflikt prüfen',
  })
  assert.deepEqual(mappedInstance(conflict, 'source-card', 'Status=Invalid').roleCopy, {
    Type: 'Ungültige Quelle', Title: 'Eine Konfliktquelle kann nicht gelesen werden', Meta: 'Adresse oder Format der Fundstelle prüfen', Status: 'Ungültig', Action: 'Andere Quelle wählen',
  })
  assert.match(mappedInstance(conflict, 'reader-panel', 'State=Highlight').roleCopy.Excerpt, /abweichende Fundstelle/)

  const longDialog = namedView('responsive', 'Responsive / Dialog · Lang · Dark')
  const dialog = mappedInstance(longDialog, 'dialog', 'Size=Long')
  assert.deepEqual(dialog.roleCopy, {
    Eyebrow: 'Exportprüfung', Title: 'Datenkontrolle und Export', Body: 'Prüfe offene Hinweise, Datenumfang und Exportziel, bevor du fortfährst.',
    Status: 'Bitte vollständig lesen', 'Primary Action': 'Fortfahren', 'Secondary Action': 'Zurück',
  })
  assert.equal(mappedInstance(longDialog, 'dialog-action', 'Kind=Primary').roleCopy.Label, dialog.roleCopy['Primary Action'])
  assert.equal(mappedInstance(longDialog, 'dialog-action', 'Kind=Secondary').roleCopy.Label, dialog.roleCopy['Secondary Action'])
  assert.doesNotMatch(JSON.stringify(definitions.SECONDARY_VIEW_DEFINITIONS.responsive.slice(12)), /(Annotation|Agent|Evidence|Dialog) · 720px · Dark|Details prüfen|Kontext:/)
})

test('secondary mutation recovery accepts fresh, exact, safe partial, and recognized owned legacy inventories and converges idempotently', () => {
  assert.equal(typeof plan.validateSecondaryViewMutationInventory, 'function', 'validateSecondaryViewMutationInventory missing')
  assert.equal(typeof plan.buildSecondaryViewRecoveryActions, 'function', 'buildSecondaryViewRecoveryActions missing')
  const fresh = secondaryInventory({ complete: false })
  assert.deepEqual(plan.validateSecondaryViewMutationInventory(fresh), { valid: true, errors: [] })
  const freshActions = plan.buildSecondaryViewRecoveryActions(fresh)
  assert.deepEqual(freshActions.slice(0, 3), TARGET_SECTION_NAMES.map(sectionName => ({ type: 'section', sectionName })))
  assert.equal(freshActions.filter(action => action.type === 'view').length, 40)

  const exact = secondaryInventory()
  assert.deepEqual(plan.validateSecondaryViewMutationInventory(exact), { valid: true, errors: [] })
  assert.deepEqual(plan.buildSecondaryViewRecoveryActions(exact), [])
  assert.deepEqual(plan.buildSecondaryViewRecoveryActions(structuredClone(exact)), [], 'second exact recovery must be idempotent')

  const partial = secondaryInventory()
  partial.views.pop()
  partial.sections[2].childIds.pop()
  partial.sections[2].childCount -= 1
  const first = partial.views[0]
  const removedCopy = first.copyNodes.pop()
  const removedCopyParent = first.layoutRegions.find(region => region.nodeId === removedCopy.parentId)
  removedCopyParent.childIds = removedCopyParent.childIds.filter(id => id !== removedCopy.nodeId)
  removedCopyParent.childCount = removedCopyParent.childIds.length
  const detail = first.layoutRegions.find(region => region.name === 'Layout / Detail')
  first.layoutRegions = first.layoutRegions.filter(region => region !== detail)
  first.instances = first.instances.filter(instance => instance.parentId !== detail.nodeId)
  const content = first.layoutRegions.find(region => region.name === 'Layout / Content')
  content.childIds = content.childIds.filter(id => id !== detail.nodeId)
  content.childCount = content.childIds.length
  const removedInstance = partial.views[1].instances.pop()
  const removedInstanceParent = partial.views[1].layoutRegions.find(region => region.nodeId === removedInstance.parentId)
  removedInstanceParent.childIds = removedInstanceParent.childIds.filter(id => id !== removedInstance.nodeId)
  removedInstanceParent.childCount = removedInstanceParent.childIds.length
  const removedRole = partial.views[2].instances[0].roleDescendants.pop()
  partial.views[2].instances[0].childIds = partial.views[2].instances[0].childIds.filter(id => id !== removedRole.nodeId)
  partial.views[2].instances[0].childCount = partial.views[2].instances[0].childIds.length
  partial.views[3].instances[0].mainComponentId = null
  assert.deepEqual(plan.validateSecondaryViewMutationInventory(partial), { valid: true, errors: [] })
  const partialActions = plan.buildSecondaryViewRecoveryActions(partial)
  for (const type of ['view', 'region', 'copy', 'instance', 'copy-instance', 'relink-instance']) {
    assert.ok(partialActions.some(action => action.type === type), `missing deterministic ${type} recovery`)
  }

  const legacy = secondaryInventory({ complete: false })
  legacy.sections.push({
    nodeId: 'section:legacy:07', name: '07 · Agent & Quellen', type: 'SECTION', owner: definitions.PLUGIN_ORIGIN,
    parentId: 'page:1', parentType: 'PAGE', parentName: 'Page 1', childIds: ['legacy:agent'], childCount: 1,
  })
  legacy.targetPage.childIds = ['section:legacy:07']
  legacy.targetPage.childCount = 1
  legacy.legacyViews.push({
    nodeId: 'legacy:agent', name: 'Agent · Ruhe', type: 'FRAME', owner: definitions.PLUGIN_ORIGIN,
    parentId: 'section:legacy:07', parentType: 'SECTION', parentName: '07 · Agent & Quellen', visible: true,
    childIds: ['legacy:agent:title'], childCount: 1,
    standIns: [{ nodeId: 'legacy:agent:title', name: 'Agent · Ruhe / Titel', type: 'TEXT', owner: definitions.PLUGIN_ORIGIN, parentId: 'legacy:agent', parentType: 'FRAME', parentName: 'Agent · Ruhe', visible: true }],
  })
  assert.deepEqual(plan.validateSecondaryViewMutationInventory(legacy), { valid: true, errors: [] })
  assert.ok(plan.buildSecondaryViewRecoveryActions(legacy).some(action => action.type === 'hide-legacy-view' && action.legacyName === 'Agent · Ruhe'))
  const responsiveLegacy = structuredClone(legacy)
  responsiveLegacy.sections[0] = { ...responsiveLegacy.sections[0], nodeId: 'section:legacy:10', name: '10 · Responsive & Dark', childIds: ['legacy:responsive'] }
  responsiveLegacy.targetPage.childIds = ['section:legacy:10']
  responsiveLegacy.legacyViews[0] = {
    ...responsiveLegacy.legacyViews[0], nodeId: 'legacy:responsive', name: 'Editor / 320px · Kleinbreite', parentId: 'section:legacy:10', parentName: '10 · Responsive & Dark',
    ondaResponsiveFrame: '320', pluginData: { owner: definitions.PLUGIN_ORIGIN, ondaResponsiveFrame: '320' }, childIds: [], childCount: 0, standIns: [],
  }
  assert.equal(plan.validateSecondaryViewMutationInventory(responsiveLegacy).valid, true)
})

test('secondary recovery repairs wrong-but-truthy exact component links from the supplied component index', () => {
  const exact = secondaryInventory()
  assert.deepEqual(plan.buildSecondaryViewRecoveryActions(exact), [])

  const wrongLinks = secondaryInventory()
  const linked = wrongLinks.views[0].instances[0]
  linked.mainComponentId = 'component:wrong-but-truthy'
  linked.componentSetId = 'set:wrong-but-truthy'
  assert.ok(plan.buildSecondaryViewRecoveryActions(wrongLinks).some(action => action.type === 'relink-instance' && action.instanceName === linked.name))
})

test('secondary recovery repairs missing or corrupt contract-derived region variable bindings', () => {
  assert.deepEqual(plan.buildSecondaryViewRecoveryActions(secondaryInventory()).filter(action => action.type === 'bind-region'), [])
  for (const corrupt of [
    region => { region.fillBindings = [] },
    region => { region.strokeBindings[0].variableIds = ['variable:wrong-but-truthy'] },
    region => { region.fieldVariableIds.paddingLeft = [] },
  ]) {
    const missingBinding = secondaryInventory()
    const region = missingBinding.views[0].layoutRegions.find(candidate => candidate.paddingLeft > 0)
    corrupt(region)
    assert.ok(plan.buildSecondaryViewRecoveryActions(missingBinding).some(action => action.type === 'bind-region' && action.regionName === region.name))
  }
})

test('complete recursive modern Role and legacy-child ancestry chains reject every wrong recorded hop', () => {
  const modern = secondaryInventory()
  const instance = modern.views[0].instances[0]
  const role = instance.roleDescendants[0]
  nestInventoryChild(role, instance, 'nested:modern')
  assert.deepEqual(plan.validateSecondaryViewMutationInventory(modern), { valid: true, errors: [] })
  for (const corrupt of [
    chain => { chain[0].parentId = 'nested:wrong-parent' },
    chain => { chain[0].parentType = 'SECTION' },
    chain => { chain[0].parentName = 'Nested / Wrong' },
    chain => { chain[1].parentId = 'instance:wrong' },
    chain => { chain[1].owner = '' },
  ]) {
    const candidate = structuredClone(modern)
    corrupt(candidate.views[0].instances[0].roleDescendants[0].ancestorChain)
    assert.equal(plan.validateSecondaryViewMutationInventory(candidate).valid, false)
  }

  const legacy = secondaryInventory({ complete: false })
  const section = {
    nodeId: 'section:nested:legacy', name: '07 · Agent & Quellen', type: 'SECTION', owner: definitions.PLUGIN_ORIGIN,
    parentId: 'page:1', parentType: 'PAGE', parentName: 'Page 1', childIds: ['legacy:nested'], childCount: 1,
  }
  const child = {
    nodeId: 'legacy:nested:child', name: 'Agent · Ruhe / Titel', type: 'TEXT', owner: definitions.PLUGIN_ORIGIN,
    parentId: 'legacy:nested', parentType: 'FRAME', parentName: 'Agent · Ruhe', visible: true,
  }
  const legacyView = {
    nodeId: 'legacy:nested', name: 'Agent · Ruhe', type: 'FRAME', owner: definitions.PLUGIN_ORIGIN,
    parentId: section.nodeId, parentType: 'SECTION', parentName: section.name, visible: true,
    childIds: [child.nodeId], childCount: 1, standIns: [child],
  }
  legacy.targetPage.childIds = [section.nodeId]
  legacy.targetPage.childCount = 1
  legacy.sections = [section]
  legacy.legacyViews = [legacyView]
  nestInventoryChild(child, legacyView, 'nested:legacy')
  assert.deepEqual(plan.validateSecondaryViewMutationInventory(legacy), { valid: true, errors: [] })
  const wrongLegacy = structuredClone(legacy)
  wrongLegacy.legacyViews[0].standIns[0].ancestorChain[1].parentName = 'Agent · Falsch'
  assert.equal(plan.validateSecondaryViewMutationInventory(wrongLegacy).valid, false)
})

test('unaccounted direct child IDs invalidate every container inventory and guarded execution performs zero writes', async () => {
  const invalid = secondaryInventory()
  invalid.views[0].childIds.push('unaccounted:visible-or-unknown-child')
  invalid.views[0].childCount += 1
  const validation = plan.validateSecondaryViewMutationInventory(invalid)
  assert.equal(validation.valid, false)
  assert.match(validation.errors.join('\n'), /unaccounted:visible-or-unknown-child/)

  let writes = 0
  await assert.rejects(() => plan.executeGuardedSecondaryViewCommand({
    command: 'dialogs-and-secondary', phases: priorSecondaryPhases(),
    preflight: async () => invalid,
    requireContext: async () => ({ page: invalid.targetPage }),
    collectCurrentInventory: async () => structuredClone(invalid),
    mutate: async () => { writes += 1 },
  }), /unaccounted:visible-or-unknown-child|Inventar ungültig/)
  assert.equal(writes, 0)
})

test('untouched non-target Page children remain accepted and snapshotted while recovery stays scoped to Sections 07/09/10', async () => {
  const inventory = withUntouchedPageChildren()
  assert.deepEqual(plan.validateSecondaryViewMutationInventory(inventory), { valid: true, errors: [] })
  const actions = plan.buildSecondaryViewRecoveryActions(inventory)
  assert.deepEqual(actions, [])
  assert.equal(actions.some(action => /08 · Dialoge|11 · Prototyp/.test(JSON.stringify(action))), false)

  let writes = 0
  const result = await plan.executeGuardedSecondaryViewCommand({
    command: 'dialogs-and-secondary', phases: priorSecondaryPhases(),
    preflight: async () => inventory,
    requireContext: async () => ({ page: inventory.targetPage }),
    collectCurrentInventory: async () => structuredClone(inventory),
    mutate: async (_context, finalInventory) => { writes += 1; return finalInventory.targetPage.childIds },
  })
  assert.deepEqual(result, inventory.targetPage.childIds)
  assert.equal(writes, 1)
})

test('untouched Page child identity drift between barriers still rejects with zero writes', async () => {
  const before = withUntouchedPageChildren()
  const current = structuredClone(before)
  current.untouchedPageChildren[0].name = '08 · Dialoge · Drift'
  let writes = 0
  await assert.rejects(() => plan.executeGuardedSecondaryViewCommand({
    command: 'dialogs-and-secondary', phases: priorSecondaryPhases(),
    preflight: async () => before,
    requireContext: async () => ({ page: before.targetPage }),
    collectCurrentInventory: async () => structuredClone(current),
    mutate: async () => { writes += 1 },
  }), /wurde nach Preflight verändert/)
  assert.equal(writes, 0)
})

test('untouched Page classification rejects every modern, legacy, responsive, marker, and owned-role disguise with zero writes', async t => {
  const modernName = definitions.SECONDARY_VIEW_DEFINITIONS.agentSources[0].name
  const cases = [
    ['modern exact name plus marker', {
      name: modernName, owner: definitions.PLUGIN_ORIGIN,
      secondaryView: { group: 'agentSources' },
      pluginData: { owner: definitions.PLUGIN_ORIGIN, secondaryView: JSON.stringify({ group: 'agentSources' }) },
    }],
    ['modern exact name without marker', { name: modernName }],
    ['neutral name with secondary marker', {
      name: 'Neutral marked Page child',
      pluginData: { secondaryView: JSON.stringify({ group: 'secondary' }) },
    }],
    ['exact 07/09 legacy name', { name: 'Agent · Ruhe' }],
    ['responsive legacy name and marker', {
      name: 'Editor / 320px · Kleinbreite', owner: definitions.PLUGIN_ORIGIN,
      ondaResponsiveFrame: '320', pluginData: { owner: definitions.PLUGIN_ORIGIN, ondaResponsiveFrame: '320' },
    }],
    ['unknown Onda-marked candidate', {
      name: 'Unknown Onda-marked Page child',
      ondaSecondaryView: 'true', pluginData: { ondaSecondaryView: 'true' },
    }],
    ['unknown owned target-shaped frame', {
      name: 'Unknown owned Page child', owner: definitions.PLUGIN_ORIGIN,
      pluginData: { owner: definitions.PLUGIN_ORIGIN },
    }],
    ['unknown plugin-owned target-shaped frame', {
      name: 'Unknown plugin-owned Page child',
      pluginData: { owner: definitions.PLUGIN_ORIGIN },
    }],
    ['unknown Role-marked candidate', {
      name: 'Unknown Role-marked Page child', role: 'secondary-view',
      pluginData: { role: 'secondary-view' },
    }],
    ['unknown legacy-marked candidate', {
      name: 'Unknown legacy-marked Page child', legacy: true,
    }],
  ]

  for (const [label, candidate] of cases) {
    await t.test(label, async () => {
      const { inventory, child } = withUntouchedPageCandidate(candidate)
      const validation = plan.validateSecondaryViewMutationInventory(inventory)
      assert.equal(validation.valid, false)
      assert.ok(validation.errors.some(error => error.includes(child.name)), 'invalid candidate must be named')

      let writes = 0
      await assert.rejects(() => plan.executeGuardedSecondaryViewCommand({
        command: 'dialogs-and-secondary', phases: priorSecondaryPhases(),
        preflight: async () => inventory,
        requireContext: async () => ({ page: inventory.targetPage }),
        collectCurrentInventory: async () => structuredClone(inventory),
        mutate: async () => { writes += 1 },
      }), new RegExp(child.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      assert.equal(writes, 0, 'mutate must not run')
    })
  }
})

test('secondary mutation inventory names and rejects duplicates, unowned nested nodes, wrong ancestry, unknown marked candidates, exact-name lookalikes, and visible residue', async () => {
  const invalidCases = [
    ['duplicate modern view', value => { value.views.push({ ...structuredClone(value.views[0]), nodeId: 'duplicate:view' }) }, () => definitions.SECONDARY_VIEW_DEFINITIONS.agentSources[0].name],
    ['duplicate legacy view', value => {
      const section = value.sections[0]
      value.legacyViews.push({ nodeId: 'legacy:1', name: 'Agent · Ruhe', type: 'FRAME', owner: definitions.PLUGIN_ORIGIN, parentId: section.nodeId, parentType: 'SECTION', parentName: section.name, visible: false, standIns: [] })
      value.legacyViews.push({ nodeId: 'legacy:2', name: 'Agent · Ruhe', type: 'FRAME', owner: definitions.PLUGIN_ORIGIN, parentId: section.nodeId, parentType: 'SECTION', parentName: section.name, visible: false, standIns: [] })
    }, () => 'Agent · Ruhe'],
    ['unowned region', value => { value.views[0].layoutRegions[0].owner = '' }, value => value.views[0].layoutRegions[0].name],
    ['unowned copy', value => { value.views[0].copyNodes[0].owner = '' }, value => value.views[0].copyNodes[0].name],
    ['unowned instance', value => { value.views[0].instances[0].owner = '' }, value => value.views[0].instances[0].name],
    ['unowned recursive role', value => { value.views[0].instances[0].roleDescendants[0].owner = '' }, value => value.views[0].instances[0].roleDescendants[0].name],
    ['wrong Section type', value => { value.sections[0].type = 'FRAME' }, value => value.sections[0].name],
    ['wrong View type', value => { value.views[0].type = 'SECTION' }, value => value.views[0].name],
    ['wrong Region type', value => { value.views[0].layoutRegions[0].type = 'GROUP' }, value => value.views[0].layoutRegions[0].name],
    ['wrong Copy type', value => { value.views[0].copyNodes[0].type = 'FRAME' }, value => value.views[0].copyNodes[0].name],
    ['wrong Instance type', value => { value.views[0].instances[0].type = 'FRAME' }, value => value.views[0].instances[0].name],
    ['wrong Role type', value => { value.views[0].instances[0].roleDescendants[0].type = 'FRAME' }, value => value.views[0].instances[0].roleDescendants[0].name],
    ['wrong Legacy type', value => {
      value.legacyViews.push({ nodeId: 'legacy:wrong-type', name: 'Agent · Ruhe', type: 'SECTION', owner: definitions.PLUGIN_ORIGIN, parentId: value.sections[0].nodeId, parentType: 'SECTION', parentName: value.sections[0].name, visible: false, childIds: [], childCount: 0, standIns: [] })
    }, () => 'Agent · Ruhe'],
    ['wrong nested parent', value => { value.views[0].layoutRegions[3].parentId = 'region:wrong' }, value => value.views[0].layoutRegions[3].name],
    ['unknown marked candidate', value => { value.views.push({ nodeId: 'unknown:view', name: 'Responsive / Überraschung', type: 'FRAME', owner: definitions.PLUGIN_ORIGIN, parentId: value.sections[2].nodeId, parentType: 'SECTION', parentName: value.sections[2].name, secondaryView: { group: 'responsive' }, layoutRegions: [], copyNodes: [], instances: [], standIns: [] }) }, () => 'Responsive / Überraschung'],
    ['unowned exact-name lookalike', value => { value.views.push({ ...structuredClone(value.views[0]), nodeId: 'lookalike:view', owner: '' }) }, () => definitions.SECONDARY_VIEW_DEFINITIONS.agentSources[0].name],
    ['duplicate region', value => { value.views[0].layoutRegions.push({ ...structuredClone(value.views[0].layoutRegions[0]), nodeId: 'duplicate:region' }) }, value => value.views[0].layoutRegions[0].name],
    ['duplicate copy', value => { value.views[0].copyNodes.push({ ...structuredClone(value.views[0].copyNodes[0]), nodeId: 'duplicate:copy' }) }, value => value.views[0].copyNodes[0].name],
    ['duplicate instance', value => { value.views[0].instances.push({ ...structuredClone(value.views[0].instances[0]), nodeId: 'duplicate:instance' }) }, value => value.views[0].instances[0].name],
    ['duplicate role', value => { value.views[0].instances[0].roleDescendants.push({ ...structuredClone(value.views[0].instances[0].roleDescendants[0]), nodeId: 'duplicate:role' }) }, value => value.views[0].instances[0].roleDescendants[0].name],
    ['visible owned residue', value => { value.views[0].standIns.push({ nodeId: 'residue:visible', name: 'Veralteter sichtbarer Knopf', type: 'FRAME', owner: definitions.PLUGIN_ORIGIN, parentId: value.views[0].nodeId, parentType: 'FRAME', parentName: value.views[0].name, visible: true }) }, () => 'Veralteter sichtbarer Knopf'],
  ]
  for (const [label, corrupt, candidateName] of invalidCases) {
    const value = secondaryInventory()
    corrupt(value)
    const result = plan.validateSecondaryViewMutationInventory(value)
    assert.equal(result.valid, false, label)
    assert.match(result.errors.join('\n'), new RegExp(candidateName(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${label}: candidate must be named`)
    await rejectBeforeSecondaryWrite(value)
  }
})

test('canonical secondary snapshot covers full mutable identity, hierarchy, order, geometry, style, binding, Role-copy, exact links, and marker state', () => {
  assert.equal(typeof plan.canonicalSecondaryViewMutationSnapshot, 'function', 'canonicalSecondaryViewMutationSnapshot missing')
  const inventory = secondaryInventory()
  const baseline = JSON.stringify(plan.canonicalSecondaryViewMutationSnapshot(inventory))
  const drifts = [
    value => { value.targetPage.childIds.reverse() },
    value => { value.sections[0].bounds.width += 1 },
    value => { value.views[0].layoutMode = 'VERTICAL' },
    value => { value.views[0].secondaryView.group = 'secondary' },
    value => { value.views[0].pluginData.secondaryView = '{}' },
    value => { value.views[0].layoutRegions[0].paddingLeft += 1 },
    value => { value.views[0].layoutRegions[0].childIds.reverse() },
    value => { value.views[0].layoutRegions[0].fills[0].boundVariables.color.id = 'variable:replacement' },
    value => { value.views[0].copyNodes[0].characters = 'Drift' },
    value => { value.views[0].copyNodes[0].textRangeBindings[0].variableIds = ['variable:replacement'] },
    value => { value.views[0].instances[0].componentProperties.Label.value = 'Drift' },
    value => { value.views[0].instances[0].roleCopy.Label = 'Drift' },
    value => { value.views[0].instances[0].mainComponentId = 'component:replacement' },
    value => { value.views[0].instances[0].componentSetId = 'set:replacement' },
    value => { value.views[0].instances[0].variantName = 'State=Replacement' },
    value => { value.views[0].instances[0].effectStyleId = 'style:replacement' },
    value => { value.views[0].instances[0].roleDescendants[0].absoluteBounds.width += 1 },
    value => { value.views[0].instances[0].roleDescendants[0].effects.push({ type: 'DROP_SHADOW' }) },
  ]
  for (const drift of drifts) {
    const changed = structuredClone(inventory)
    drift(changed)
    assert.notEqual(JSON.stringify(plan.canonicalSecondaryViewMutationSnapshot(changed)), baseline)
  }
})

test('guarded secondary command validates order first and rejects duplicate, same-ID, and post-resolve drift at two fresh barriers with zero writes', async () => {
  assert.equal(typeof plan.executeGuardedSecondaryViewCommand, 'function', 'executeGuardedSecondaryViewCommand missing')
  let preflightCalls = 0
  await assert.rejects(() => plan.executeGuardedSecondaryViewCommand({
    command: 'dialogs-and-secondary', phases: {}, preflight: async () => { preflightCalls += 1; return secondaryInventory() },
    requireContext: async () => ({}), collectCurrentInventory: async () => secondaryInventory(), mutate: async () => {},
  }), /Reihenfolge/)
  assert.equal(preflightCalls, 0)

  const duplicate = secondaryInventory()
  duplicate.views.push({ ...structuredClone(duplicate.views[0]), nodeId: 'race:duplicate' })
  await rejectBeforeSecondaryWrite(duplicate)

  for (const drift of [
    value => { value.views[0].bounds.width += 1 },
    value => { value.views[0].layoutRegions[0].childIds.reverse() },
    value => { value.views[0].instances[0].mainComponentId = 'component:same-id-drift' },
    value => { value.views[0].instances[0].roleDescendants[0].characters = 'same-ID copy drift' },
  ]) {
    const before = secondaryInventory()
    const current = structuredClone(before)
    drift(current)
    await rejectBeforeSecondaryWrite(current, /TOCTOU/)
  }

  for (const drift of [
    value => { value.targetPage.effects.push({ type: 'DROP_SHADOW' }) },
    value => { value.sections[0].childIds.reverse() },
    value => { value.views[0].copyNodes[0].fills.push({ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }) },
    value => { value.views[0].instances[0].roleDescendants[0].bounds.width += 1 },
  ]) {
    const before = secondaryInventory()
    let current = structuredClone(before)
    let reads = 0
    let writes = 0
    await assert.rejects(() => plan.executeGuardedSecondaryViewCommand({
      command: 'dialogs-and-secondary', phases: priorSecondaryPhases(),
      preflight: async () => before,
      requireContext: async () => ({ page: before.targetPage }),
      collectCurrentInventory: async () => { reads += 1; return structuredClone(current) },
      resolveInventoryNodes: async () => { drift(current); return new Map([['secondary:view:0', { id: 'secondary:view:0' }]]) },
      mutate: async () => { writes += 1 },
    }), /TOCTOU/)
    assert.equal(reads, 2)
    assert.equal(writes, 0)
  }

  {
    const before = secondaryInventory()
    const current = structuredClone(before)
    let writes = 0
    await assert.rejects(() => plan.executeGuardedSecondaryViewCommand({
      command: 'dialogs-and-secondary', phases: priorSecondaryPhases(),
      preflight: async () => before,
      requireContext: async () => {
        before.views[0].bounds.width += 1
        current.views[0].bounds.width += 1
        return { page: before.targetPage }
      },
      collectCurrentInventory: async () => structuredClone(current),
      mutate: async () => { writes += 1 },
    }), /TOCTOU/)
    assert.equal(writes, 0, 'context callback must not be able to rewrite the retained preflight baseline')
  }

  {
    const before = secondaryInventory()
    const current = structuredClone(before)
    let writes = 0
    await assert.rejects(() => plan.executeGuardedSecondaryViewCommand({
      command: 'dialogs-and-secondary', phases: priorSecondaryPhases(),
      preflight: async () => before,
      requireContext: async () => ({ page: before.targetPage }),
      collectCurrentInventory: async () => structuredClone(current),
      resolveInventoryNodes: async (_context, retainedInventory) => {
        retainedInventory.views[0].bounds.width += 1
        current.views[0].bounds.width += 1
        return new Map()
      },
      mutate: async () => { writes += 1 },
    }), /TOCTOU/)
    assert.equal(writes, 0, 'resolver must not be able to rewrite the retained current baseline')
  }

  const exact = secondaryInventory()
  const resolved = new Map([['secondary:view:0', { id: 'secondary:view:0' }]])
  let reads = 0
  let received = null
  const result = await plan.executeGuardedSecondaryViewCommand({
    command: 'dialogs-and-secondary', phases: priorSecondaryPhases(),
    preflight: async () => exact,
    requireContext: async () => ({ page: exact.targetPage }),
    collectCurrentInventory: async () => { reads += 1; return structuredClone(exact) },
    resolveInventoryNodes: async () => resolved,
    mutate: async (context, finalInventory, resolvedNodes) => { received = { context, finalInventory, resolvedNodes }; return 'mutated-once' },
  })
  assert.equal(result, 'mutated-once')
  assert.equal(reads, 2)
  assert.equal(received.context.page.id, 'page:1')
  assert.deepEqual(received.finalInventory, exact)
  assert.equal(received.resolvedNodes, resolved)
})
