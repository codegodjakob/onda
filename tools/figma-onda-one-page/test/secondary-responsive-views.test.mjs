import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as definitions from '../src/definitions.mjs'
import * as plan from '../src/plan.mjs'
import { createValidComponentEvidence } from './component-fixture.mjs'
import { createValidFoundationEvidence } from './foundation-fixture.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function runtimeSource() {
  return readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
}

function sourceFunction(source, name, nextName) {
  const start = source.indexOf(`function ${name}`)
  assert.notEqual(start, -1, `${name} missing from Runtime`)
  const end = nextName ? source.indexOf(`function ${nextName}`, start + 1) : source.length
  assert.notEqual(end, -1, `${nextName} missing after ${name}`)
  return source.slice(start, end)
}

function executableRuntimeFunction(source, name) {
  const asyncStart = source.indexOf(`async function ${name}`)
  const plainStart = source.indexOf(`function ${name}`)
  const start = asyncStart >= 0 ? asyncStart : plainStart
  assert.notEqual(start, -1, `${name} missing from Runtime`)
  const bodyMarker = source.indexOf(') {', start)
  assert.notEqual(bodyMarker, -1, `${name} has no function body marker`)
  const brace = bodyMarker + 2
  let depth = 0
  let quote = null
  let escaped = false
  for (let index = brace; index < source.length; index += 1) {
    const character = source[index]
    if (quote) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = null
      continue
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character
      continue
    }
    if (character === '{') depth += 1
    else if (character === '}') {
      depth -= 1
      if (depth === 0) return Function(`return (${source.slice(start, index + 1)})`)()
    }
  }
  assert.fail(`${name} has no balanced function body`)
}

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
    const bounds = { x: 80, y: section.y + 100 + index * 1100, width: view.width, height: view.height }
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
      x: bounds.x, y: bounds.y, width: view.width, height: view.height, bounds, absoluteBounds: bounds,
      layoutMode: view.layoutMode, primaryAxisSizingMode: 'FIXED', counterAxisSizingMode: 'FIXED', primaryAxisAlignItems: 'MIN', counterAxisAlignItems: 'MIN',
      itemSpacing: 0,
      paddingTop: view.width === 320 ? 16 : 0, paddingRight: view.width === 320 ? 16 : 0,
      paddingBottom: view.width === 320 ? 16 : 0, paddingLeft: view.width === 320 ? 16 : 0,
      layoutWrap: 'NO_WRAP', layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED',
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

const OVERLAY_EFFECT = Object.freeze({
  type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.16 },
  offset: { x: 0, y: 8 }, radius: 24, spread: 0, visible: true, blendMode: 'NORMAL',
})

function strictSecondaryEvidence() {
  const entries = secondaryDefinitions()
  const semanticNames = ['color/surface', 'color/inverted', 'color/border', 'color/text', 'color/text-muted', 'color/on-inverted']
  const spacingValues = [...new Set(entries.flatMap(({ view }) => view.regions.flatMap(region => [
    region.itemSpacing, region.padding.top, region.padding.right, region.padding.bottom, region.padding.left,
  ])).filter(value => value > 0))]
  const collections = ['Light', 'Dark'].map(theme => ({
    id: `collection:semantic:${theme.toLowerCase()}`, name: `Onda · Semantic · ${theme}`, owner: definitions.PLUGIN_ORIGIN,
  })).concat({ id: 'collection:dimension', name: 'Onda · Dimension', owner: definitions.PLUGIN_ORIGIN })
  const variables = ['Light', 'Dark'].flatMap(theme => semanticNames.map(name => ({
    id: `variable:${theme.toLowerCase()}:${name}`, name, owner: definitions.PLUGIN_ORIGIN,
    collectionId: `collection:semantic:${theme.toLowerCase()}`, collectionName: `Onda · Semantic · ${theme}`,
  }))).concat(spacingValues.map(value => ({
    id: `variable:dimension:spacing/${value}`, name: `spacing/${value}`, owner: definitions.PLUGIN_ORIGIN,
    collectionId: 'collection:dimension', collectionName: 'Onda · Dimension',
  })))
  const variableId = (collectionName, name) => variables.find(variable => variable.collectionName === collectionName && variable.name === name)?.id
  const components = definitions.COMPONENT_DEFINITIONS.map(component => ({
    id: component.id, nodeId: `set:${component.id}`, name: component.name, type: 'COMPONENT_SET', owner: definitions.PLUGIN_ORIGIN,
    variants: component.variants.map((variant, index) => ({
      nodeId: `component:${component.id}:${index}`, name: variant.name, type: 'COMPONENT', owner: definitions.PLUGIN_ORIGIN,
      parentId: `set:${component.id}`, parentType: 'COMPONENT_SET', parentName: component.name,
    })),
  }))
  const targetPage = {
    nodeId: 'page:secondary-evidence', name: definitions.TARGET_PAGE_NAME, type: 'PAGE',
    childIds: TARGET_SECTION_NAMES.map((_, index) => `section:evidence:${index}`), childCount: TARGET_SECTION_NAMES.length,
  }
  const sections = TARGET_SECTION_NAMES.map((name, index) => ({
    nodeId: `section:evidence:${index}`, name, type: 'SECTION', owner: definitions.PLUGIN_ORIGIN,
    parentId: targetPage.nodeId, parentType: 'PAGE', parentName: targetPage.name,
    childIds: [], childCount: 0,
    bounds: { x: 0, y: index * 100000, width: 2200, height: 1 },
    absoluteBounds: { x: 0, y: index * 100000, width: 2200, height: 1 },
  }))
  const sectionByName = new Map(sections.map(section => [section.name, section]))
  const sectionCursor = new Map(TARGET_SECTION_NAMES.map(name => [name, 100]))

  function paintEvidence(type, theme, kind, textToken = 'color/text', surfaceToken = 'color/surface') {
    const collection = `Onda · Semantic · ${theme}`
    const token = kind === 'stroke' ? 'color/border' : type === 'TEXT' || type === 'ELLIPSE' ? textToken : surfaceToken
    const gray = theme === 'Dark' ? (kind === 'stroke' ? .35 : type === 'TEXT' || type === 'ELLIPSE' ? .95 : .08) : (kind === 'stroke' ? .82 : type === 'TEXT' || type === 'ELLIPSE' ? .08 : 1)
    return [{ type: 'SOLID', color: { r: gray, g: gray, b: gray }, variableIds: [variableId(collection, token)] }]
  }

  function baseRecord({ nodeId, name, type, parent, bounds, theme, textToken = 'color/text', surfaceToken = 'color/surface', effects = [], effectStyleId = null }) {
    return {
      nodeId, name, type, owner: definitions.PLUGIN_ORIGIN,
      parentId: parent.nodeId, parentType: parent.type, parentName: parent.name,
      x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
      bounds: { ...bounds },
      absoluteBounds: { x: parent.absoluteBounds.x + bounds.x, y: parent.absoluteBounds.y + bounds.y, width: bounds.width, height: bounds.height },
      fills: paintEvidence(type, theme, 'fill', textToken, surfaceToken), strokes: type === 'TEXT' || type === 'ELLIPSE' ? [] : paintEvidence(type, theme, 'stroke', textToken, surfaceToken),
      fillBindings: paintEvidence(type, theme, 'fill', textToken, surfaceToken).map(({ type: paintType, variableIds }, index) => ({ index, type: paintType, variableIds })),
      strokeBindings: type === 'TEXT' || type === 'ELLIPSE' ? [] : paintEvidence(type, theme, 'stroke').map(({ type: paintType, variableIds }, index) => ({ index, type: paintType, variableIds })),
      effects: structuredClone(effects), effectStyleId, opacity: 1, visible: true,
      childIds: [], childCount: 0, pluginData: { owner: definitions.PLUGIN_ORIGIN },
    }
  }

  const views = entries.map(({ group, view }, viewIndex) => {
    const section = sectionByName.get(view.sectionName)
    const viewY = sectionCursor.get(view.sectionName)
    sectionCursor.set(view.sectionName, viewY + view.height + 76)
    const viewRecord = baseRecord({
      nodeId: `view:evidence:${viewIndex}`, name: view.name, type: 'FRAME', parent: section,
      bounds: { x: 80, y: viewY, width: view.width, height: view.height }, theme: view.theme,
    })
    viewRecord.layoutMode = view.layoutMode
    viewRecord.paddingTop = view.width === 320 ? 16 : 0
    viewRecord.paddingRight = view.width === 320 ? 16 : 0
    viewRecord.paddingBottom = view.width === 320 ? 16 : 0
    viewRecord.paddingLeft = view.width === 320 ? 16 : 0
    viewRecord.itemSpacing = 0
    viewRecord.secondaryView = { group, theme: view.theme, subject: view.subject || null, breakpoint: view.breakpoint ?? null }
    Object.assign(viewRecord, viewRecord.secondaryView)
    viewRecord.pluginData.secondaryView = JSON.stringify(viewRecord.secondaryView)
    const layoutRegions = []
    const copyNodes = []
    const instances = []
    const regionByName = new Map()

    function addChildren(parent, parentContractName) {
      const padding = {
        top: parent.paddingTop || 0, right: parent.paddingRight || 0,
        bottom: parent.paddingBottom || 0, left: parent.paddingLeft || 0,
      }
      const contentWidth = parent.width - padding.left - padding.right
      let cursor = parent.layoutMode === 'HORIZONTAL' ? padding.left : padding.top
      const childRecords = []
      const regionContracts = view.regions.filter(region => region.parentName === parentContractName)
      const copyContracts = view.copyContracts.filter(copy => copy.region === parentContractName)
      const instanceContracts = view.instances.filter(instance => instance.region === parentContractName)
      for (const [kind, contracts] of [['region', regionContracts], ['copy', copyContracts], ['instance', instanceContracts]]) for (const contract of contracts) {
        let width
        let height
        if (kind === 'region') {
          width = Math.min(contract.width, contentWidth)
          height = contract.height
        } else if (kind === 'copy') {
          width = contentWidth
          height = contract.expectedHeight
        } else {
          width = Math.min(contract.expectedWidth, contentWidth)
          height = Math.max(view.width === 320 ? 44 : 0, contract.expectedHeight)
        }
        const bounds = parent.layoutMode === 'HORIZONTAL'
          ? { x: cursor, y: padding.top, width, height }
          : { x: padding.left, y: cursor, width, height }
        if (kind === 'region') {
          const record = baseRecord({
            nodeId: `region:evidence:${viewIndex}:${layoutRegions.length}`, name: contract.name, type: 'FRAME', parent, bounds, theme: view.theme,
          })
          record.layoutMode = contract.layoutMode
          record.itemSpacing = contract.itemSpacing
          record.paddingTop = contract.padding.top
          record.paddingRight = contract.padding.right
          record.paddingBottom = contract.padding.bottom
          record.paddingLeft = contract.padding.left
          record.fieldVariableIds = Object.fromEntries([
            ['itemSpacing', contract.itemSpacing], ['paddingTop', contract.padding.top], ['paddingRight', contract.padding.right],
            ['paddingBottom', contract.padding.bottom], ['paddingLeft', contract.padding.left],
          ].map(([field, value]) => [field, value === 0 ? [] : [variableId('Onda · Dimension', `spacing/${value}`)]]))
          record.pluginData.secondaryRegionContract = JSON.stringify({ width: contract.width, height: contract.height })
          layoutRegions.push(record)
          regionByName.set(contract.name, record)
          childRecords.push(record)
          addChildren(record, contract.name)
        } else if (kind === 'copy') {
          const record = baseRecord({
            nodeId: `copy:evidence:${viewIndex}:${copyNodes.length}`, name: `Copy / ${contract.role}`, type: 'TEXT', parent, bounds, theme: view.theme,
            textToken: contract.kind === 'title' ? 'color/text' : 'color/text-muted',
          })
          Object.assign(record, { role: contract.role, characters: contract.characters, fieldVariableIds: {}, textRangeBindings: [] })
          record.pluginData.role = contract.role
          copyNodes.push(record)
          childRecords.push(record)
        } else {
          const component = definitions.COMPONENT_DEFINITIONS.find(item => item.id === contract.setId)
          const variantIndex = component.variants.findIndex(item => item.name === contract.variant)
          const allowedEffect = Boolean(component.effectStyleName)
          const record = baseRecord({
            nodeId: `instance:evidence:${viewIndex}:${instances.length}`, name: contract.name, type: 'INSTANCE', parent, bounds, theme: view.theme,
            surfaceToken: component.variants[variantIndex].surfaceToken,
            effects: allowedEffect ? [OVERLAY_EFFECT] : [], effectStyleId: allowedEffect ? 'effect-style:overlay' : null,
          })
          Object.assign(record, {
            region: contract.region, repeatedScreen: true, documentation: false,
            mainComponentId: `component:${contract.setId}:${variantIndex}`, componentId: `component:${contract.setId}:${variantIndex}`,
            componentSetId: `set:${contract.setId}`, componentSetName: component.name, variantName: contract.variant,
            labelValue: contract.label, componentProperties: { 'Label#fixture': { type: 'TEXT', value: contract.label } },
            roleCopy: structuredClone(contract.roleCopy), cornerRadius: component.radius,
          })
          const roleDescendants = []
          let roleCursor = component.direction === 'HORIZONTAL' ? component.padding.left : component.padding.top
          for (const [roleIndex, role] of component.roles.entries()) {
            const roleWidth = role.type === 'ELLIPSE' ? 16 : definitions.estimateCoreTextWidth(contract.roleCopy[role.name], role.name)
            const roleHeight = role.type === 'ELLIPSE' || role.name === 'Description' ? 16 : 22
            const roleBounds = component.direction === 'HORIZONTAL'
              ? { x: roleCursor, y: component.padding.top, width: roleWidth, height: roleHeight }
              : { x: component.padding.left, y: roleCursor, width: roleWidth, height: roleHeight }
            const roleRecord = baseRecord({
              nodeId: `${record.nodeId}:role:${roleIndex}`, name: `Role/${role.name}`, type: role.type, parent: record, bounds: roleBounds, theme: view.theme,
              textToken: component.variants[variantIndex].textToken,
            })
            Object.assign(roleRecord, {
              parentInstanceId: record.nodeId, ancestorIds: [record.nodeId], ancestorChain: [], role: role.name,
              ...(role.type === 'TEXT' ? { characters: contract.roleCopy[role.name] } : {}),
            })
            roleRecord.pluginData.role = role.name
            roleDescendants.push(roleRecord)
            roleCursor += (component.direction === 'HORIZONTAL' ? roleWidth : roleHeight) + component.gap
          }
          record.roleDescendants = roleDescendants
          record.childIds = roleDescendants.map(role => role.nodeId)
          record.childCount = record.childIds.length
          instances.push(record)
          childRecords.push(record)
        }
        cursor += (parent.layoutMode === 'HORIZONTAL' ? width : height) + (parent.itemSpacing || 0)
      }
      parent.childIds = childRecords.map(record => record.nodeId)
      parent.childCount = parent.childIds.length
    }

    addChildren(viewRecord, view.name)
    viewRecord.layoutRegions = layoutRegions
    viewRecord.copyNodes = copyNodes
    viewRecord.instances = instances
    viewRecord.standIns = []
    section.childIds.push(viewRecord.nodeId)
    section.childCount = section.childIds.length
    return viewRecord
  })
  for (const section of sections) {
    section.height = sectionCursor.get(section.name) + 100
    section.bounds.height = section.height
    section.absoluteBounds.height = section.height
  }
  return {
    targetPage, sections, views, legacyViews: [], components, collections, variables,
    effectStyles: [{ id: 'effect-style:overlay', name: 'Onda/Shadow/Overlay', owner: definitions.PLUGIN_ORIGIN, effects: [structuredClone(OVERLAY_EFFECT)] }],
  }
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
  inventory.untouchedPageDescendants = untouchedPageChildren.map((parent, index) => ({
    nodeId: parent.childIds[0], name: `Benign child ${index + 1}`, type: 'TEXT', owner: 'another-plugin',
    parentId: parent.nodeId, parentType: parent.type, parentName: parent.name,
    childIds: [], childCount: 0, visible: true, characters: `Benign ${index + 1}`,
  }))
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

function secondaryVerificationSnapshot(secondaryViews) {
  const foundation = createValidFoundationEvidence()
  return {
    targetAuthorized: true,
    pageCount: 1,
    pageName: definitions.TARGET_PAGE_NAME,
    sections: definitions.SECTION_DEFINITIONS.map(section => ({
      name: section.name,
      type: 'SECTION',
      parentType: 'PAGE',
      parentName: definitions.TARGET_PAGE_NAME,
      owner: definitions.PLUGIN_ORIGIN,
    })),
    annotationViews: definitions.ANNOTATION_SECTIONS.flatMap(annotation => annotation.views.map(view => ({ kind: annotation.kind, view: view.name }))),
    dialogStates: definitions.DIALOG_FAMILIES.flatMap(family => family.states.map(state => ({ family: family.name, state }))),
    componentSets: createValidComponentEvidence(foundation),
    componentTargetPage: { id: 'page:1', name: definitions.TARGET_PAGE_NAME, type: 'PAGE' },
    componentContainers: [{
      nodeId: 'section:components', name: '02 · Komponenten', type: 'SECTION', owner: definitions.PLUGIN_ORIGIN,
      parentId: 'page:1', parentType: 'PAGE', parentName: definitions.TARGET_PAGE_NAME,
    }],
    secondaryViews,
    instanceCount: definitions.COMPONENT_DEFINITIONS.length + 8,
    documentationInstanceCount: definitions.COMPONENT_DEFINITIONS.length,
    repeatedScreenInstanceCount: 8,
    foundation,
    intersections: [],
    clearance: 2000,
    overflowNodes: [],
    undersizedHitTargets: [],
    reactionCount: 4,
    requiredReactionCount: 4,
    baselineHash: 'baseline',
    currentBaselineHash: 'baseline',
    baselineMismatches: [],
    baselinePages: [{ id: 'page:1', name: definitions.TARGET_PAGE_NAME, index: 0 }],
    currentPages: [{ id: 'page:1', name: definitions.TARGET_PAGE_NAME, index: 0 }],
    phases: { ...priorSecondaryPhases(), 'dialogs-and-secondary': { status: 'success' } },
  }
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
  for (const descendant of current.untouchedPageDescendants.filter(record => record.parentId === current.untouchedPageChildren[0].nodeId)) descendant.parentName = '08 · Dialoge · Drift'
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

test('Runtime routes dialogs-and-secondary through the guarded three-section secondary adapter before any write', () => {
  const source = runtimeSource()
  assert.match(source, /SECONDARY_VIEW_DEFINITIONS/)
  assert.match(source, /executeGuardedSecondaryViewCommand/)
  assert.match(source, /async function collectSecondaryViewMutationInventory\(/)
  assert.match(source, /async function preflightSecondaryViewMutation\(/)
  assert.match(source, /async function resolveSecondaryInventoryNodes\(/)

  const handler = sourceFunction(source, 'handleCommand')
  const branch = handler.slice(handler.indexOf("if (command === 'dialogs-and-secondary')"))
  assert.match(branch, /executeGuardedSecondaryViewCommand\s*\(\s*\{/)
  assert.match(branch, /preflight:\s*preflightSecondaryViewMutation/)
  assert.match(branch, /collectCurrentInventory:\s*\(\{ page \}\)\s*=>\s*collectSecondaryViewMutationInventory\(page\)/)
  assert.match(branch, /resolveInventoryNodes:\s*resolveSecondaryInventoryNodes/)
  assert.match(branch, /mutate:\s*runMutation/)

  const mutation = sourceFunction(source, 'runDialogsAndSecondary', 'collectOndaNodes')
  assert.match(mutation, /runSecondaryViews\(/)
  assert.doesNotMatch(mutation, /createDialogs|createPrototype|08 · Dialoge|11 · Prototyp/)
})

test('Runtime resolves fonts, exact variables, nodes, and variants before the final barrier and performs no await before its first write', () => {
  const source = runtimeSource()
  const resolver = sourceFunction(source, 'resolveSecondaryInventoryNodes', 'applySecondaryContainerContract')
  assert.match(resolver, /await loadDecisionFonts\(ledger\.fontDecision\)/)
  assert.match(resolver, /await secondaryVariableContext\(\)/)
  assert.match(resolver, /variants/)
  assert.match(resolver, /return \{ nodes: resolved, variables, variants \}/)

  const render = sourceFunction(source, 'runSecondaryViews', 'createAgentAndSources')
  const firstWrite = render.indexOf('frame.name = definition.name')
  assert.ok(firstWrite >= 0, 'first secondary frame write missing')
  assert.equal(render.slice(0, firstWrite).includes('await '), false, 'secondary renderer must not yield after final barrier before its first write')
})

test('Runtime renders every secondary contract as real nested non-NONE Auto Layout and definition-sized instances', () => {
  const source = runtimeSource()
  const regions = sourceFunction(source, 'configureSecondaryLayoutRegions', 'configureSecondaryCopy')
  assert.match(regions, /regionDefinition\.parentName === definition\.name\s*\?\s*frame\s*:\s*regions\.get\(regionDefinition\.parentName\)/)
  assert.match(regions, /if \(region\.parent !== parent\) parent\.appendChild\(region\)/)
  assert.match(regions, /region\.layoutMode = regionDefinition\.layoutMode/)
  assert.match(regions, /if \(region\.layoutMode === 'NONE'\) throw new Error/)
  assert.match(regions, /applySecondaryContainerContract\(\{ parent, node: region, contract: regionDefinition, maximumWidth, resize: resizeNode \}\)/)

  const positioning = sourceFunction(source, 'positionSecondaryInstance', 'runSecondaryViews')
  assert.match(positioning, /resizeNode\(instance, [^,]+, contract\.expectedHeight\)/)
  assert.match(positioning, /definition\.width === 320/)
  assert.match(positioning, /Math\.max\(definition\.width === 320 \? 44 : 0, contract\.expectedHeight\)/)

  const render = sourceFunction(source, 'runSecondaryViews', 'createAgentAndSources')
  assert.match(render, /secondaryDefinitionsWithGroups\(\)/)
  assert.match(render, /frame\.layoutMode = definition\.layoutMode/)
  assert.match(render, /frame\.paddingTop = narrow \? 16 : 0/)
  assert.match(render, /frame\.paddingRight = narrow \? 16 : 0/)
  assert.match(render, /frame\.paddingBottom = narrow \? 16 : 0/)
  assert.match(render, /frame\.paddingLeft = narrow \? 16 : 0/)
})

test('Runtime awaits exact main-component identity and font loading before local Role copy changes', () => {
  const source = runtimeSource()
  const ensure = sourceFunction(source, 'applySecondaryInstanceContract', 'ensureSecondaryVariantInstance')
  const identity = ensure.indexOf('await readIdentity(instance)')
  const swap = ensure.indexOf('instance.swapComponent(variant)')
  const fonts = ensure.indexOf('await loadFonts()')
  const roleWrite = ensure.indexOf('roleNode.characters = characters')
  assert.ok(identity >= 0, 'secondary Instance identity must be awaited')
  assert.ok(swap > identity, 'swap must follow async main-component identity')
  assert.ok(fonts > swap, 'font loading must follow exact component resolution')
  assert.ok(roleWrite > fonts, 'local Role copy must follow font loading')

  const resolver = sourceFunction(source, 'resolveSecondaryInventoryNodes', 'applySecondaryContainerContract')
  assert.match(resolver, /await loadDecisionFonts\(ledger\.fontDecision\)/)
})

test('Runtime binds visible Dark secondary nodes to exact Dark semantic variables without Component or Component Set mutation', () => {
  const source = runtimeSource()
  const variables = sourceFunction(source, 'secondaryVariableContext', 'secondaryBoundPaint')
  assert.match(variables, /'Onda · Semantic · Light'/)
  assert.match(variables, /'Onda · Semantic · Dark'/)
  assert.match(variables, /variable\.variableCollectionId === collection\.id/)
  assert.match(variables, /semanticByTheme/)

  const binding = sourceFunction(source, 'bindSecondaryNodeTheme', 'secondaryDefinitionsWithGroups')
  assert.match(binding, /theme === 'Dark'\s*\?\s*variables\.semanticByTheme\.Dark\s*:\s*variables\.semanticByTheme\.Light/)
  assert.match(binding, /figma\.variables\.setBoundVariableForPaint/)
  const executableBinding = sourceFunction(source, 'applySecondaryThemeBinding', 'bindSecondaryNodeTheme')
  assert.match(executableBinding, /semantic\.semanticByToken\[textToken\]/)
  assert.match(executableBinding, /semantic\.semanticByToken\[surfaceToken\]/)
  assert.match(executableBinding, /for \(const child of node\.children\) applySecondaryThemeBinding\(\{ node: child, theme, variables, bindPaint, textToken, surfaceToken, recursive \}\)/)

  const copy = sourceFunction(source, 'configureSecondaryCopy', 'ownedSecondaryVariant')
  assert.match(copy, /contract\.kind === 'title'\s*\?\s*'color\/text'\s*:\s*'color\/text-muted'/)
  const instance = sourceFunction(source, 'ensureSecondaryVariantInstance', 'positionSecondaryInstance')
  assert.match(instance, /variantDefinition\.textToken/)
  assert.match(instance, /variantDefinition\.surfaceToken/)
  const render = sourceFunction(source, 'runSecondaryViews', 'createAgentAndSources')
  assert.match(render, /bindSecondaryNodeTheme\(frame, definition\.theme, variables, 'color\/text', 'color\/surface', false\)/)

  const mutation = source.slice(source.indexOf('async function collectSecondaryViewMutationInventory'), source.indexOf('function collectOndaNodes'))
  assert.doesNotMatch(mutation, /createComponent\(|combineAsVariants|addComponentProperty|editComponentProperty/)
  assert.doesNotMatch(mutation, /\.appendChild\([^)]*variant|variant\.appendChild|set\.appendChild/)
})

test('Runtime secondary variable inventory contains every variable identity at most once', () => {
  const source = runtimeSource()
  const uniqueRecords = executableRuntimeFunction(source, 'uniqueSecondaryVariableRecords')
  const surface = { id: 'variable:surface', name: 'color/surface' }
  const border = { id: 'variable:border', name: 'color/border' }
  const text = { id: 'variable:text', name: 'color/text' }

  assert.deepEqual(
    uniqueRecords([surface, border, surface, text, surface]),
    [surface, border, text],
    'the surface alias and semantic token entry must resolve to one inventory record',
  )

  const variables = sourceFunction(source, 'secondaryVariableContext', 'secondaryBoundPaint')
  assert.match(variables, /inventory:\s*uniqueSecondaryVariableRecords\(\[/)
  assert.match(variables, /\[context\.border, \.\.\.Object\.values\(context\.semanticByToken\)\]/)
  assert.doesNotMatch(variables, /\[context\.surface, context\.border/)
})

test('secondary recovery distinguishes exact Light and Dark semantic variable identities', () => {
  const inventory = secondaryInventory()
  const dimensionVariables = inventory.variables.filter(variable => variable.name.startsWith('spacing/'))
  inventory.variables = [
    { id: 'variable:light:surface', name: 'color/surface', collectionName: 'Onda · Semantic · Light' },
    { id: 'variable:light:border', name: 'color/border', collectionName: 'Onda · Semantic · Light' },
    { id: 'variable:dark:surface', name: 'color/surface', collectionName: 'Onda · Semantic · Dark' },
    { id: 'variable:dark:border', name: 'color/border', collectionName: 'Onda · Semantic · Dark' },
    ...dimensionVariables.map(variable => ({ ...variable, collectionName: 'Onda · Dimension' })),
  ]
  const themeByView = new Map(secondaryDefinitions().map(({ view }) => [view.name, view.theme]))
  for (const view of inventory.views) {
    const theme = themeByView.get(view.name)
    for (const region of view.layoutRegions) {
      region.fills[0].boundVariables.color.id = `variable:${theme.toLowerCase()}:surface`
      region.strokes[0].boundVariables.color.id = `variable:${theme.toLowerCase()}:border`
      region.fillBindings[0].variableIds = [`variable:${theme.toLowerCase()}:surface`]
      region.strokeBindings[0].variableIds = [`variable:${theme.toLowerCase()}:border`]
    }
  }
  assert.deepEqual(plan.buildSecondaryViewRecoveryActions(inventory), [])

  const dark = inventory.views.find(view => view.theme === 'Dark')
  dark.layoutRegions[0].fills[0].boundVariables.color.id = 'variable:light:surface'
  dark.layoutRegions[0].fillBindings[0].variableIds = ['variable:light:surface']
  assert.ok(plan.buildSecondaryViewRecoveryActions(inventory).some(action => action.type === 'bind-region' && action.viewName === dark.name))
})

test('executable Runtime adapters apply real nesting, exact height, async copy order, and Dark-only local bindings', async () => {
  const source = runtimeSource()
  const applyContainer = executableRuntimeFunction(source, 'applySecondaryContainerContract')
  const applyInstance = executableRuntimeFunction(source, 'applySecondaryInstanceContract')
  const applyTheme = executableRuntimeFunction(source, 'applySecondaryThemeBinding')

  const events = []
  const parent = {
    appendChild(node) {
      events.push(`append:${node.name}`)
      node.parent = this
    },
  }
  const region = { name: 'Layout / Detail', parent: null }
  applyContainer({
    parent,
    node: region,
    contract: {
      layoutMode: 'VERTICAL', width: 288, height: 720, itemSpacing: 12,
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
    },
    resize(node, width, height) { events.push(`resize:${width}x${height}`); node.width = width; node.height = height },
  })
  assert.equal(region.parent, parent)
  assert.equal(region.layoutMode, 'VERTICAL')
  assert.deepEqual([region.paddingTop, region.paddingRight, region.paddingBottom, region.paddingLeft], [16, 16, 16, 16])

  const narrowParent = { width: 320, paddingLeft: 16, paddingRight: 16, appendChild: parent.appendChild }
  const narrowShell = { name: 'Layout / Shell', parent: null }
  applyContainer({
    parent: narrowParent,
    node: narrowShell,
    contract: { layoutMode: 'VERTICAL', width: 320, height: 960, itemSpacing: 16, padding: { top: 16, right: 16, bottom: 16, left: 16 } },
    maximumWidth: narrowParent.width - narrowParent.paddingLeft - narrowParent.paddingRight,
    resize(node, width, height) { node.width = width; node.height = height },
  })
  assert.equal(narrowShell.width, 288, '320 outer padding must leave a contained 288px child width')

  const role = { type: 'TEXT', name: 'Role/Label', characters: 'alt' }
  const instance = {
    id: 'instance:1', name: 'Aktion', parent: null, componentProperties: { 'Label#1': { value: 'alt' } },
    swapComponent(variant) { events.push(`swap:${variant.id}`); this.main = variant },
    setProperties(properties) { events.push('properties'); this.properties = properties },
    findOne(predicate) { return predicate(role) ? role : null },
  }
  await applyInstance({
    parent,
    instance,
    variant: { id: 'component:expected' },
    contract: { name: 'Aktion', label: 'Neu', roleCopy: { Label: 'Lokale Kopie' }, expectedWidth: 180, expectedHeight: 52 },
    definition: { width: 320, theme: 'Dark' },
    readIdentity: async () => { events.push('identity'); return { id: 'component:wrong' } },
    loadFonts: async () => { events.push('fonts') },
    resize(node, width, height) { events.push(`instance-size:${width}x${height}`); node.width = width; node.height = height },
    bindTheme: () => events.push('bind:Dark'),
  })
  assert.equal(instance.parent, parent)
  assert.equal(instance.height, 52)
  assert.equal(role.characters, 'Lokale Kopie')
  assert.ok(events.indexOf('identity') < events.indexOf('swap:component:expected'))
  assert.ok(events.indexOf('swap:component:expected') < events.indexOf('fonts'))
  assert.ok(events.indexOf('fonts') < events.indexOf('properties'))

  const darkChild = { type: 'TEXT', fills: [{ type: 'SOLID' }], strokes: [], children: [] }
  const darkRoot = { type: 'FRAME', fills: [{ type: 'SOLID' }], strokes: [{ type: 'SOLID' }], children: [darkChild] }
  const variables = {
    semanticByTheme: {
      Light: {
        surface: { id: 'variable:light:surface' }, border: { id: 'variable:light:border' },
        semanticByToken: {
          'color/surface': { id: 'variable:light:surface' }, 'color/inverted': { id: 'variable:light:inverted' },
          'color/text': { id: 'variable:light:text' }, 'color/text-muted': { id: 'variable:light:text-muted' },
        },
      },
      Dark: {
        surface: { id: 'variable:dark:surface' }, border: { id: 'variable:dark:border' },
        semanticByToken: {
          'color/surface': { id: 'variable:dark:surface' }, 'color/inverted': { id: 'variable:dark:inverted' },
          'color/text': { id: 'variable:dark:text' }, 'color/text-muted': { id: 'variable:dark:text-muted' },
        },
      },
    },
  }
  applyTheme({
    node: darkRoot,
    theme: 'Dark',
    variables,
    textToken: 'color/text-muted',
    surfaceToken: 'color/inverted',
    bindPaint(_paint, variable) { return { boundVariableId: variable.id } },
  })
  const boundIds = [darkRoot, darkChild].flatMap(node => [...node.fills, ...node.strokes]).map(paint => paint.boundVariableId)
  assert.ok(boundIds.every(id => id.startsWith('variable:dark:')))
  assert.ok(boundIds.every(id => !id.includes(':light:')))
  assert.deepEqual(darkRoot.fills.map(paint => paint.boundVariableId), ['variable:dark:inverted'])
  assert.deepEqual(darkChild.fills.map(paint => paint.boundVariableId), ['variable:dark:text-muted'])
})

test('Runtime inventory retains every exact-set child, every duplicate or unknown visible Role, and recursive legacy leaves', () => {
  const source = runtimeSource()
  const components = sourceFunction(source, 'secondaryComponentInventory', 'collectSecondaryViewMutationInventory')
  assert.match(components, /variants:\s*set\.children\.map\(/)
  assert.doesNotMatch(components, /set\.children\.filter\(/)

  const instances = sourceFunction(source, 'secondaryInstanceRecord', 'secondaryViewRecord')
  assert.match(instances, /collectSecondaryInstanceRoleRecords\(instance\)/)
  assert.doesNotMatch(instances, /for \(const role of Object\.keys\(contract\.roleCopy\)\)/)
  const roleCollector = sourceFunction(source, 'collectSecondaryInstanceRoleRecords', 'secondaryInstanceRecord')
  assert.match(roleCollector, /instance\.findAll\(/)

  const views = sourceFunction(source, 'secondaryViewRecord', 'secondaryComponentInventory')
  assert.match(views, /collectLegacyLeaves/)
  assert.match(views, /for \(const child of node\.children\) collectLegacyLeaves\(child\)/)
})

function secondaryBoxContains(outer, inner) {
  return inner.x >= outer.x
    && inner.y >= outer.y
    && inner.x + inner.width <= outer.x + outer.width
    && inner.y + inner.height <= outer.y + outer.height
}

function secondaryBoxesOverlap(left, right) {
  return left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y
}

test('every 320 contract executes as a fully contained, non-overlapping nested vertical geometry in both axes', () => {
  const narrowViews = definitions.SECONDARY_VIEW_DEFINITIONS.responsive.filter(view => view.width === 320)
  assert.equal(narrowViews.length, 4)
  for (const view of narrowViews) {
    assert.equal(view.layoutMode, 'VERTICAL')
    assert.equal(view.width, 320)
    assert.ok(Number.isInteger(view.height) && view.height > 0, `${view.name}: missing derived frame height`)
    const outerPadding = { top: 16, right: 16, bottom: 16, left: 16 }
    const root = { name: view.name, box: { x: 0, y: 0, width: view.width, height: view.height }, layoutMode: view.layoutMode, itemSpacing: 0, padding: outerPadding }
    const nodes = new Map([[view.name, root]])
    const childContracts = new Map()
    for (const region of view.regions) {
      assert.notEqual(region.layoutMode, 'NONE')
      const children = childContracts.get(region.parentName) || []
      children.push({ kind: 'region', contract: region })
      childContracts.set(region.parentName, children)
    }
    for (const copy of view.copyContracts) {
      assert.ok(Number.isInteger(copy.expectedHeight) && copy.expectedHeight > 0, `${view.name}/${copy.role}: missing text height`)
      const copyWidth = 224
      const lineHeight = copy.kind === 'title' ? 28 : 22
      const fontScale = copy.kind === 'title' ? 21 / 15 : 1
      const wrappedLines = Math.max(1, Math.ceil(definitions.estimateCoreTextWidth(copy.characters) * fontScale / copyWidth))
      assert.ok(copy.expectedHeight >= wrappedLines * lineHeight, `${view.name}/${copy.role}: wrapped Copy height underestimated`)
      const children = childContracts.get(copy.region) || []
      children.push({ kind: 'copy', contract: copy })
      childContracts.set(copy.region, children)
    }
    for (const instance of view.instances) {
      assert.ok(instance.expectedHeight >= 44, `${view.name}/${instance.name}: target below 44px`)
      const children = childContracts.get(instance.region) || []
      children.push({ kind: 'instance', contract: instance })
      childContracts.set(instance.region, children)
    }

    function layout(parentName) {
      const parent = nodes.get(parentName)
      const padding = parent.padding
      const content = {
        x: parent.box.x + padding.left,
        y: parent.box.y + padding.top,
        width: parent.box.width - padding.left - padding.right,
        height: parent.box.height - padding.top - padding.bottom,
      }
      let cursor = parent.layoutMode === 'HORIZONTAL' ? content.x : content.y
      const laidOut = []
      for (const item of childContracts.get(parentName) || []) {
        const width = item.kind === 'region' ? item.contract.width : Math.min(item.contract.expectedWidth || content.width, content.width)
        const height = item.kind === 'copy' ? item.contract.expectedHeight : item.contract.height || item.contract.expectedHeight
        const box = parent.layoutMode === 'HORIZONTAL'
          ? { x: cursor, y: content.y, width, height }
          : { x: content.x, y: cursor, width, height }
        assert.equal(secondaryBoxContains(content, box), true, `${view.name}/${item.contract.name || item.contract.role}: overflow in x or y`)
        for (const sibling of laidOut) assert.equal(secondaryBoxesOverlap(sibling.box, box), false, `${view.name}: sibling overlap`)
        laidOut.push({ ...item, box })
        cursor += (parent.layoutMode === 'HORIZONTAL' ? width : height) + parent.itemSpacing
        if (item.kind === 'region') {
          nodes.set(item.contract.name, { name: item.contract.name, box, layoutMode: item.contract.layoutMode, itemSpacing: item.contract.itemSpacing, padding: item.contract.padding })
          layout(item.contract.name)
        }
        if (item.kind === 'instance') {
          const component = definitions.COMPONENT_DEFINITIONS.find(candidate => candidate.id === item.contract.setId)
          const roleContent = {
            x: box.x + component.padding.left,
            y: box.y + component.padding.top,
            width: box.width - component.padding.left - component.padding.right,
            height: box.height - component.padding.top - component.padding.bottom,
          }
          let roleCursor = component.direction === 'HORIZONTAL' ? roleContent.x : roleContent.y
          const roles = []
          for (const role of component.roles) {
            const roleHeight = role.type === 'ELLIPSE' || role.name === 'Description' ? 16 : 22
            const roleWidth = role.type === 'ELLIPSE' ? 16 : definitions.estimateCoreTextWidth(item.contract.roleCopy[role.name], role.name)
            const roleBox = component.direction === 'HORIZONTAL'
              ? { x: roleCursor, y: roleContent.y, width: roleWidth, height: roleHeight }
              : { x: roleContent.x, y: roleCursor, width: roleWidth, height: roleHeight }
            assert.equal(secondaryBoxContains(roleContent, roleBox), true, `${view.name}/${item.contract.name}/Role/${role.name}: overflow`)
            for (const sibling of roles) assert.equal(secondaryBoxesOverlap(sibling, roleBox), false, `${view.name}/${item.contract.name}: Role overlap`)
            roles.push(roleBox)
            roleCursor += (component.direction === 'HORIZONTAL' ? roleBox.width : roleBox.height) + component.gap
          }
        }
      }
    }
    layout(view.name)
  }
  assert.match(runtimeSource(), /frame\.clipsContent\s*=\s*false/)
  const sectionLayout = executableRuntimeFunction(runtimeSource(), 'secondarySectionLayout')
  const layout = sectionLayout(definitions.SECONDARY_VIEW_DEFINITIONS.responsive)
  for (let index = 1; index < layout.positions.length; index += 1) {
    const previous = layout.positions[index - 1]
    const current = layout.positions[index]
    assert.ok(previous.y + previous.height <= current.y, `${previous.name} overlaps ${current.name}`)
  }
  assert.ok(layout.height >= layout.positions.at(-1).y + layout.positions.at(-1).height)
})

test('every 320 Instance keeps honest complete compact copy within the real 192px Detail content width', async () => {
  const expectedBySet = {
    'nav-item': label => ({ Icon: '▤', Label: label, Count: '1', Status: 'Aktiv' }),
    search: () => ({ Icon: '⌕', Input: 'Suchen', Clear: '—', Count: '0' }),
    select: () => ({ Label: 'Ansicht', Value: 'Alle', Chevron: '⌄', Status: 'Bereit' }),
    'list-row': () => ({ Leading: '▤', Title: 'Text', Meta: '1 S.', Status: 'Klar', Action: '→' }),
    'mode-toggle': () => ({ 'Text Label': 'Text', 'Note Label': 'Notiz', Indicator: 'Aktiv' }),
    'review-bar': () => ({ Symbol: '◎', Message: '1 offen', 'Primary Action': '→', 'Secondary Action': 'Alle' }),
    'annotation-anchor': () => ({ Symbol: '¶', Label: 'Hinweis', Count: '1' }),
    'annotation-card': () => ({ Type: 'Hinweis', Title: 'Beleg', Body: 'Quelle fehlt.', Scope: 'Hier', 'Primary Action': 'Prüfen', 'Secondary Action': 'Später', Status: 'Offen' }),
  }
  const narrowViews = definitions.SECONDARY_VIEW_DEFINITIONS.responsive.filter(view => view.width === 320)
  for (const view of narrowViews) {
    const navigationLabel = view.subject === 'Bibliothek' ? 'Projekte' : 'Editor'
    for (const instance of view.instances) {
      const component = definitions.COMPONENT_DEFINITIONS.find(candidate => candidate.id === instance.setId)
      const expected = expectedBySet[instance.setId](navigationLabel)
      assert.deepEqual(instance.roleCopy, expected, `${view.name}/${instance.name}: compact semantic copy mismatch`)
      assert.deepEqual(Object.keys(instance.roleCopy).sort(), component.roles.filter(role => role.type === 'TEXT').map(role => role.name).sort())
      const visibleLabelRole = instance.setId === 'select' ? 'Value' : component.labelRole
      assert.equal(instance.label, instance.roleCopy[visibleLabelRole], `${view.name}/${instance.name}: Label property disagrees with visible label Role`)
      const computedMinimum = definitions.componentMinimumWidth(component, instance.roleCopy)
      assert.equal(instance.minimumWidth, computedMinimum)
      assert.ok(computedMinimum <= 192, `${view.name}/${instance.name}: ${computedMinimum}px exceeds real Detail content width`)
    }
  }

  const applyInstance = executableRuntimeFunction(runtimeSource(), 'applySecondaryInstanceContract')
  const role = { type: 'TEXT', name: 'Role/Label', characters: 'Alt' }
  const instance = {
    id: 'instance:too-wide', name: 'Zu breit', parent: null, componentProperties: { Label: { value: 'Alt' } },
    swapComponent() {}, setProperties() {}, findOne(predicate) { return predicate(role) ? role : null },
  }
  await assert.rejects(() => applyInstance({
    parent: { width: 224, paddingLeft: 16, paddingRight: 16, appendChild(node) { node.parent = this } },
    instance,
    variant: { id: 'component:expected' },
    contract: { name: 'Zu breit', label: 'Neu', roleCopy: { Label: 'Neu' }, minimumWidth: 193, expectedWidth: 193, expectedHeight: 44 },
    definition: { width: 320, theme: 'Light' },
    readIdentity: async () => ({ id: 'component:expected' }), loadFonts: async () => {}, resize() {}, bindTheme() {},
  }), /193.*192|192.*193|Mindestbreite/)
})

test('executable Instance collector preserves real direct children and recursively records typed Component roles', () => {
  const collect = executableRuntimeFunction(runtimeSource(), 'collectSecondaryInstanceRoleRecords')
  const instance = { id: 'instance:typed', name: 'Status', type: 'INSTANCE', children: [] }
  const group = { id: 'group:roles', name: 'Role group', type: 'GROUP', parent: instance, children: [] }
  const textRole = { id: 'role:label', name: 'Role/Label', type: 'TEXT', characters: 'Bereit', parent: group, children: [] }
  const ellipseRole = { id: 'role:dot', name: 'Role/Dot', type: 'ELLIPSE', parent: instance, children: [] }
  const benignSibling = { id: 'shape:decoration', name: 'Decoration', type: 'RECTANGLE', parent: group, children: [] }
  group.children.push(textRole, benignSibling)
  instance.children.push(group, ellipseRole)
  instance.findAll = predicate => {
    const found = []
    const visit = node => { for (const child of node.children || []) { if (predicate(child)) found.push(child); visit(child) } }
    visit(instance)
    return found
  }
  const recordNode = node => ({
    nodeId: node.id, name: node.name, type: node.type, owner: definitions.PLUGIN_ORIGIN,
    parentId: node.parent?.id || null, parentType: node.parent?.type || null, parentName: node.parent?.name || null,
    childIds: (node.children || []).map(child => child.id), childCount: (node.children || []).length,
  })
  const recordedAncestry = (node, root) => {
    const ancestorChain = []
    let parent = node.parent
    while (parent && parent !== root) { ancestorChain.push(recordNode(parent)); parent = parent.parent }
    return { ancestorChain, ancestorIds: [...ancestorChain.map(record => record.nodeId), root.id] }
  }
  const result = collect(instance, recordNode, recordedAncestry)
  assert.deepEqual(result.instanceRecord.childIds, ['group:roles', 'role:dot'])
  assert.equal(result.instanceRecord.childCount, 2)
  assert.deepEqual(result.roleDescendants.map(role => [role.role, role.type]), [['Label', 'TEXT'], ['Dot', 'ELLIPSE']])
  assert.deepEqual(result.roleDescendants[0].ancestorChain[0].childIds, ['role:label', 'shape:decoration'])
  assert.deepEqual(result.roleCopy, { Label: 'Bereit' })

  const inventory = secondaryInventory()
  const view = inventory.views.find(candidate => candidate.instances.some(item => item.componentSetName === 'Onda/Status Symbol'))
  const typed = view.instances.find(item => item.componentSetName === 'Onda/Status Symbol')
  const ellipse = {
    ...structuredClone(typed.roleDescendants[0]), nodeId: `${typed.nodeId}:dot`, name: 'Role/Dot', role: 'Dot', type: 'ELLIPSE', characters: undefined,
  }
  typed.roleDescendants.push(ellipse)
  typed.childIds.push(ellipse.nodeId)
  typed.childCount = typed.childIds.length
  assert.equal(plan.validateSecondaryViewMutationInventory(inventory).valid, true)
  const wrongType = structuredClone(inventory)
  wrongType.views.find(candidate => candidate.nodeId === view.nodeId).instances.find(item => item.nodeId === typed.nodeId).roleDescendants.at(-1).type = 'TEXT'
  assert.match(plan.validateSecondaryViewMutationInventory(wrongType).errors.join('\n'), /Role\/Dot/)
})

test('recursive untouched-subtree probe rejects hidden secondary candidates and snapshots benign descendant drift', async () => {
  const collect = executableRuntimeFunction(runtimeSource(), 'collectSecondaryUntouchedDescendantRecords')
  const root = { id: 'foreign:root', name: 'Foreign root', type: 'FRAME', children: [], parent: { id: 'page:1', name: 'Page 1', type: 'PAGE' } }
  const group = { id: 'foreign:group', name: 'Nested group', type: 'GROUP', children: [], parent: root }
  const hiddenTarget = { id: 'foreign:hidden-target', name: 'Responsive / Editor · 320 Dark', type: 'FRAME', children: [], parent: group }
  group.children.push(hiddenTarget)
  root.children.push(group)
  const records = collect(root, node => ({
    nodeId: node.id, name: node.name, type: node.type, owner: 'another-plugin',
    parentId: node.parent.id, parentType: node.parent.type, parentName: node.parent.name,
    childIds: node.children.map(child => child.id), childCount: node.children.length,
  }))
  assert.deepEqual(records.map(record => record.nodeId), ['foreign:group', 'foreign:hidden-target'])

  const benignInventory = withUntouchedPageChildren()
  const section02 = {
    nodeId: 'section:untouched:02', name: '02 · Komponenten', type: 'SECTION', owner: definitions.PLUGIN_ORIGIN,
    parentId: benignInventory.targetPage.nodeId, parentType: 'PAGE', parentName: benignInventory.targetPage.name,
    childIds: ['untouched:02:set'], childCount: 1, visible: true,
  }
  benignInventory.untouchedPageChildren.push(section02)
  benignInventory.targetPage.childIds.push(section02.nodeId)
  benignInventory.targetPage.childCount = benignInventory.targetPage.childIds.length
  benignInventory.untouchedPageDescendants.push(
    {
      nodeId: 'untouched:02:set', name: 'Onda/Button', type: 'COMPONENT_SET', owner: definitions.PLUGIN_ORIGIN,
      parentId: section02.nodeId, parentType: section02.type, parentName: section02.name,
      childIds: ['untouched:02:component'], childCount: 1, visible: true,
    },
    {
      nodeId: 'untouched:02:component', name: 'Kind=Primary, State=Default', type: 'COMPONENT', owner: definitions.PLUGIN_ORIGIN,
      parentId: 'untouched:02:set', parentType: 'COMPONENT_SET', parentName: 'Onda/Button',
      childIds: ['untouched:02:role'], childCount: 1, visible: true,
    },
    {
      nodeId: 'untouched:02:role', name: 'Role/Label', type: 'TEXT', owner: definitions.PLUGIN_ORIGIN,
      parentId: 'untouched:02:component', parentType: 'COMPONENT', parentName: 'Kind=Primary, State=Default',
      childIds: [], childCount: 0, visible: true, pluginData: { owner: definitions.PLUGIN_ORIGIN, role: 'Label' },
    },
  )
  const section08 = benignInventory.untouchedPageChildren.find(record => record.name === '08 · Dialoge')
  section08.childIds.push('untouched:08:dialog')
  section08.childCount = section08.childIds.length
  benignInventory.untouchedPageDescendants.push(
    {
      nodeId: 'untouched:08:dialog', name: 'Dialog / Export', type: 'FRAME', owner: definitions.PLUGIN_ORIGIN,
      parentId: section08.nodeId, parentType: section08.type, parentName: section08.name,
      childIds: ['untouched:08:dialog:role'], childCount: 1, visible: true,
    },
    {
      nodeId: 'untouched:08:dialog:role', name: 'Role/Title', type: 'TEXT', owner: definitions.PLUGIN_ORIGIN,
      parentId: 'untouched:08:dialog', parentType: 'FRAME', parentName: 'Dialog / Export',
      childIds: [], childCount: 0, visible: true, pluginData: { owner: definitions.PLUGIN_ORIGIN, role: 'Title' },
    },
  )
  assert.deepEqual(plan.validateSecondaryViewMutationInventory(benignInventory), { valid: true, errors: [] })

  const inventory = structuredClone(benignInventory)
  const foreignRoot = inventory.untouchedPageChildren.at(-1)
  const benign = inventory.untouchedPageDescendants.find(record => record.parentId === foreignRoot.nodeId)
  foreignRoot.childIds = [benign.nodeId, 'foreign:hidden-target']
  foreignRoot.childCount = 2
  inventory.untouchedPageDescendants.push({
    nodeId: 'foreign:hidden-target', name: hiddenTarget.name, type: 'FRAME', owner: 'another-plugin',
    parentId: foreignRoot.nodeId, parentType: foreignRoot.type, parentName: foreignRoot.name,
    childIds: [], childCount: 0, visible: true,
  })
  assert.match(plan.validateSecondaryViewMutationInventory(inventory).errors.join('\n'), /Responsive \/ Editor · 320 Dark/)
  await rejectBeforeSecondaryWrite(inventory, /Responsive \/ Editor · 320 Dark|unberühr/i)

  const exact = withUntouchedPageChildren()
  const changed = structuredClone(exact)
  changed.untouchedPageDescendants[0].characters = 'Benign drift'
  assert.notDeepEqual(plan.canonicalSecondaryViewMutationSnapshot(changed), plan.canonicalSecondaryViewMutationSnapshot(exact))
})

test('exact semantic collection indexing rejects duplicate Light, Dark, and Dimension collections before writes', () => {
  const indexCollections = executableRuntimeFunction(runtimeSource(), 'indexSecondaryVariableCollections')
  const required = ['Onda · Semantic · Light', 'Onda · Semantic · Dark', 'Onda · Dimension']
  assert.deepEqual([...indexCollections(required.map((name, index) => ({ id: `collection:${index}`, name }))).keys()], required)
  for (const collectionName of required) {
    let writes = 0
    const collections = required.map((name, index) => ({ id: `collection:${index}`, name }))
    collections.push({ id: `collection:duplicate:${collectionName}`, name: collectionName })
    assert.throws(() => indexCollections(collections, () => { writes += 1 }), new RegExp(collectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    assert.equal(writes, 0)
  }
})

test('strict modern secondary evidence API accepts one complete independently built fixture and hard-gates Verify', () => {
  assert.equal(typeof plan.validateSecondaryViewEvidence, 'function', 'validateSecondaryViewEvidence missing')
  const evidence = strictSecondaryEvidence()
  assert.deepEqual(plan.validateSecondaryViewEvidence(evidence), { valid: true, errors: [], counts: { agentSources: 15, secondary: 9, responsive: 16 } })
  const report = plan.buildVerificationReport(secondaryVerificationSnapshot(evidence))
  assert.equal(report.hardPass, true)
  assert.deepEqual({
    agentSources: report.agentSourceViewCount,
    secondary: report.secondaryViewCount,
    responsive: report.responsiveViewCount,
  }, { agentSources: 15, secondary: 9, responsive: 16 })
  assert.deepEqual(report.secondaryViewErrors, [])
})

test('strict secondary evidence derives exact Role text tokens from the selected Variant and keeps Summary Copy muted', async t => {
  const roleCase = (evidence, theme, textToken) => {
    for (const view of evidence.views.filter(candidate => candidate.theme === theme)) for (const instance of view.instances) {
      const component = definitions.COMPONENT_DEFINITIONS.find(candidate => candidate.name === instance.componentSetName)
      const variant = component?.variants.find(candidate => candidate.name === instance.variantName)
      if (variant?.textToken === textToken) return { view, instance, roles: instance.roleDescendants.filter(role => ['TEXT', 'ELLIPSE'].includes(role.type)) }
    }
    return null
  }
  const replaceFillToken = (record, theme, textToken) => {
    const variableIds = [`variable:${theme.toLowerCase()}:${textToken}`]
    record.fills[0].variableIds = variableIds
    record.fillBindings[0].variableIds = variableIds
  }
  const assertStrictFailure = (evidence, pattern, label) => {
    const strict = plan.validateSecondaryViewEvidence(evidence)
    assert.equal(strict.valid, false, `${label}: strict validator false-pass`)
    assert.match(strict.errors.join('\n'), pattern, `${label}: own named token error missing`)
    const report = plan.buildVerificationReport(secondaryVerificationSnapshot(evidence))
    assert.equal(report.hardPass, false, `${label}: Verify false-pass`)
    assert.match(report.secondaryViewErrors.join('\n'), pattern, `${label}: Verify omitted named token error`)
  }

  for (const theme of ['Light', 'Dark']) await t.test(`${theme} muted Variant rejects text binding`, () => {
    const evidence = strictSecondaryEvidence()
    const selected = roleCase(evidence, theme, 'color/text-muted')
    assert.ok(selected?.roles.length, `${theme}: no selected muted Variant roles in fixture`)
    for (const role of selected.roles) assert.deepEqual(role.fillBindings[0].variableIds, [`variable:${theme.toLowerCase()}:color/text-muted`])
    replaceFillToken(selected.roles[0], theme, 'color/text')
    assertStrictFailure(evidence, new RegExp(`${theme} Role semantic token color/text-muted binding`), `${theme} muted Variant`)
  })

  for (const theme of ['Light', 'Dark']) await t.test(`${theme} normal Variant rejects muted binding`, () => {
    const evidence = strictSecondaryEvidence()
    const selected = roleCase(evidence, theme, 'color/text')
    assert.ok(selected?.roles.length, `${theme}: no selected normal Variant roles in fixture`)
    for (const role of selected.roles) assert.deepEqual(role.fillBindings[0].variableIds, [`variable:${theme.toLowerCase()}:color/text`])
    replaceFillToken(selected.roles[0], theme, 'color/text-muted')
    assertStrictFailure(evidence, new RegExp(`${theme} Role semantic token color/text binding`), `${theme} normal Variant`)
  })

  for (const theme of ['Light', 'Dark']) await t.test(`${theme} Summary Copy rejects normal text binding`, () => {
    const evidence = strictSecondaryEvidence()
    const view = evidence.views.find(candidate => candidate.theme === theme)
    const summary = view.copyNodes.find(copy => copy.role === 'summary')
    assert.deepEqual(summary.fillBindings[0].variableIds, [`variable:${theme.toLowerCase()}:color/text-muted`])
    replaceFillToken(summary, theme, 'color/text')
    assertStrictFailure(evidence, new RegExp(`${theme} Copy semantic token color/text-muted binding`), `${theme} Summary Copy`)
  })
})

test('strict secondary evidence derives exact Instance surface tokens from the selected Variant', async t => {
  const instanceCase = (evidence, theme, surfaceToken) => {
    for (const view of evidence.views.filter(candidate => candidate.theme === theme)) for (const instance of view.instances) {
      const component = definitions.COMPONENT_DEFINITIONS.find(candidate => candidate.name === instance.componentSetName)
      const variant = component?.variants.find(candidate => candidate.name === instance.variantName)
      if (variant?.surfaceToken === surfaceToken) return { view, instance }
    }
    return null
  }
  const replaceFillToken = (record, theme, surfaceToken) => {
    const variableIds = [`variable:${theme.toLowerCase()}:${surfaceToken}`]
    record.fills[0].variableIds = variableIds
    record.fillBindings[0].variableIds = variableIds
  }
  const assertStrictFailure = (evidence, pattern, label) => {
    const strict = plan.validateSecondaryViewEvidence(evidence)
    assert.equal(strict.valid, false, `${label}: strict validator false-pass`)
    assert.match(strict.errors.join('\n'), pattern, `${label}: own named surface-token error missing`)
    const report = plan.buildVerificationReport(secondaryVerificationSnapshot(evidence))
    assert.equal(report.hardPass, false, `${label}: Verify false-pass`)
    assert.match(report.secondaryViewErrors.join('\n'), pattern, `${label}: Verify omitted named surface-token error`)
  }

  for (const theme of ['Light', 'Dark']) await t.test(`${theme} inverted Variant rejects surface binding`, () => {
    const evidence = strictSecondaryEvidence()
    const selected = instanceCase(evidence, theme, 'color/inverted')
    assert.ok(selected, `${theme}: no selected inverted Variant in fixture`)
    assert.deepEqual(selected.instance.fillBindings[0].variableIds, [`variable:${theme.toLowerCase()}:color/inverted`])
    replaceFillToken(selected.instance, theme, 'color/surface')
    assertStrictFailure(evidence, new RegExp(`${theme} Instance surface token color/inverted binding`), `${theme} inverted Variant`)
  })

  for (const theme of ['Light', 'Dark']) await t.test(`${theme} normal Variant rejects inverted binding`, () => {
    const evidence = strictSecondaryEvidence()
    const selected = instanceCase(evidence, theme, 'color/surface')
    assert.ok(selected, `${theme}: no selected normal-surface Variant in fixture`)
    assert.deepEqual(selected.instance.fillBindings[0].variableIds, [`variable:${theme.toLowerCase()}:color/surface`])
    replaceFillToken(selected.instance, theme, 'color/inverted')
    assertStrictFailure(evidence, new RegExp(`${theme} Instance surface token color/surface binding`), `${theme} normal-surface Variant`)
  })
})

test('every strict secondary corruption independently fails validation and Verify', async t => {
  const viewNamed = (evidence, name) => evidence.views.find(view => view.name === name)
  const narrowView = evidence => evidence.views.find(view => view.width === 320)
  const darkView = evidence => evidence.views.find(view => view.theme === 'Dark')
  const lightView = evidence => evidence.views.find(view => view.theme === 'Light')
  const firstTextRole = view => view.instances.flatMap(instance => instance.roleDescendants.map(role => ({ instance, role }))).find(({ role }) => role.type === 'TEXT')
  const firstEllipseRole = view => view.instances.flatMap(instance => instance.roleDescendants.map(role => ({ instance, role }))).find(({ role }) => role.type === 'ELLIPSE')
  const syncWidth = (record, width) => { record.width = width; record.bounds.width = width; record.absoluteBounds.width = width }
  const syncHeight = (record, height) => { record.height = height; record.bounds.height = height; record.absoluteBounds.height = height }
  const move = (record, x, y) => {
    record.x = x; record.y = y; record.bounds.x = x; record.bounds.y = y
    record.absoluteBounds.x = x; record.absoluteBounds.y = y
  }
  const corruptions = [
    ['missing view', /Cardinality|fehlt/i, evidence => {
      const [removed] = evidence.views.splice(0, 1)
      const section = evidence.sections.find(item => item.nodeId === removed.parentId)
      section.childIds = section.childIds.filter(id => id !== removed.nodeId); section.childCount = section.childIds.length
    }],
    ['extra view', /unerwartet|extra|Cardinality/i, evidence => {
      const section = evidence.sections[0]
      evidence.views.push({ ...structuredClone(evidence.views[0]), nodeId: 'view:evidence:extra', name: 'Secondary / Extra', layoutRegions: [], copyNodes: [], instances: [], childIds: [], childCount: 0 })
      section.childIds.push('view:evidence:extra'); section.childCount = section.childIds.length
    }],
    ['duplicate view', /doppelt|duplicate/i, evidence => {
      const section = evidence.sections[0]
      evidence.views.push({ ...structuredClone(evidence.views[0]), nodeId: 'view:evidence:duplicate', layoutRegions: [], copyNodes: [], instances: [], childIds: [], childCount: 0 })
      section.childIds.push('view:evidence:duplicate'); section.childCount = section.childIds.length
    }],
    ['wrong Section ancestry', /Section|Ancestry|parent/i, evidence => {
      const view = evidence.views[0]; const from = evidence.sections[0]; const to = evidence.sections[1]
      from.childIds = from.childIds.filter(id => id !== view.nodeId); from.childCount = from.childIds.length
      to.childIds.push(view.nodeId); to.childCount = to.childIds.length
      view.parentId = to.nodeId; view.parentName = to.name
    }],
    ['wrong View type', /type|Typ|View/i, evidence => { evidence.views[0].type = 'GROUP' }],
    ['wrong View width', /width|Breite/i, evidence => { syncWidth(evidence.views[0], evidence.views[0].width - 1) }],
    ['wrong theme', /theme|Theme/i, evidence => { evidence.views[0].theme = 'Dark' }],
    ['wrong marker', /marker|Marker/i, evidence => { evidence.views[0].secondaryView.breakpoint = 'wrong' }],
    ['wrong Component Set', /Component Set|Set/i, evidence => { evidence.views[0].instances[0].componentSetId = 'set:wrong' }],
    ['wrong Variant', /Variant/i, evidence => { evidence.views[0].instances[0].variantName = 'State=Wrong' }],
    ['View layoutMode NONE', /Auto Layout|layoutMode/i, evidence => { evidence.views[0].layoutMode = 'NONE' }],
    ['Region layoutMode NONE', /Auto Layout|layoutMode/i, evidence => { evidence.views[0].layoutRegions[0].layoutMode = 'NONE' }],
    ['fake self-reported height', /Bounds|height|Höhe/i, evidence => { evidence.views[0].height += 1 }],
    ['Region overflow', /Region.*overflow|overflow.*Region/i, evidence => { const region = evidence.views[0].layoutRegions[0]; region.absoluteBounds.x = evidence.views[0].absoluteBounds.x - 1 }],
    ['Copy overflow', /Copy.*overflow|overflow.*Copy/i, evidence => { const copy = evidence.views[0].copyNodes[0]; copy.absoluteBounds.x = -1 }],
    ['Instance overflow', /Instance.*overflow|overflow.*Instance/i, evidence => { const instance = evidence.views[0].instances[0]; instance.absoluteBounds.x = -1 }],
    ['Role overflow', /Role.*overflow|overflow.*Role/i, evidence => { const { role } = firstTextRole(evidence.views[0]); role.absoluteBounds.x = -1 }],
    ['sibling overlap', /overlap|überlapp/i, evidence => {
      const view = evidence.views.find(item => item.instances.length > 1)
      view.instances[1].absoluteBounds = { ...view.instances[0].absoluteBounds }
    }],
    ['Role overlap', /Role.*overlap|Role.*überlapp/i, evidence => {
      const view = evidence.views.find(item => item.instances.some(instance => instance.roleDescendants.length > 1))
      const instance = view.instances.find(item => item.roleDescendants.length > 1)
      instance.roleDescendants[1].absoluteBounds = { ...instance.roleDescendants[0].absoluteBounds }
    }],
    ['320 target below 44', /44|target|Ziel/i, evidence => { syncHeight(narrowView(evidence).instances[0], 43) }],
    ['wrong 320 padding', /320.*padding|padding.*320/i, evidence => { narrowView(evidence).paddingLeft = 15 }],
    ['wrong 320 direction', /320.*vertical|vertical.*320/i, evidence => { narrowView(evidence).layoutMode = 'HORIZONTAL' }],
    ['320 over-minimum Instance', /minimum|Mindestbreite/i, evidence => {
      const instance = narrowView(evidence).instances.find(item => {
        const contract = narrowView(evidence).name && definitions.SECONDARY_VIEW_DEFINITIONS.responsive.find(view => view.name === narrowView(evidence).name).instances.find(candidate => candidate.name === item.name)
        return contract.minimumWidth > 1
      })
      const definition = definitions.SECONDARY_VIEW_DEFINITIONS.responsive.find(view => view.name === narrowView(evidence).name)
      const contract = definition.instances.find(item => item.name === instance.name)
      syncWidth(instance, contract.minimumWidth - 1)
    }],
    ['missing Role', /Role.*fehlt|Rollenanzahl/i, evidence => {
      const instance = evidence.views[0].instances[0]; const [role] = instance.roleDescendants.splice(0, 1)
      instance.childIds = instance.childIds.filter(id => id !== role.nodeId); instance.childCount = instance.childIds.length
    }],
    ['duplicate Role', /Role.*doppelt|doppelte Role/i, evidence => {
      const instance = evidence.views[0].instances[0]; const duplicate = { ...structuredClone(instance.roleDescendants[0]), nodeId: 'role:evidence:duplicate' }
      instance.roleDescendants.push(duplicate); instance.childIds.push(duplicate.nodeId); instance.childCount = instance.childIds.length
    }],
    ['wrong Role type', /Role.*type|Role.*Typ/i, evidence => { firstTextRole(evidence.views[0]).role.type = 'ELLIPSE' }],
    ['wrong Role name', /Role.*name|Role.*Name/i, evidence => { firstTextRole(evidence.views[0]).role.name = 'Role/Wrong' }],
    ['wrong Role characters', /Role.*copy|Role.*Copy|characters/i, evidence => { firstTextRole(evidence.views[0]).role.characters = 'Widerspruch' }],
    ['incomplete roleCopy', /roleCopy|Role-Copy/i, evidence => { const instance = evidence.views[0].instances[0]; delete instance.roleCopy[Object.keys(instance.roleCopy)[0]] }],
    ['extra roleCopy', /roleCopy|Role-Copy/i, evidence => { evidence.views[0].instances[0].roleCopy.Extra = 'Nein' }],
    ['wrong label/property', /Label/i, evidence => { evidence.views[0].instances[0].componentProperties['Label#fixture'].value = 'Widerspruch' }],
    ['non-TEXT Role masquerades as copy', /Role-Copy|non-TEXT|Textrolle/i, evidence => {
      const pair = evidence.views.map(firstEllipseRole).find(Boolean); pair.instance.roleCopy[pair.role.role] = 'Falsch'; pair.role.characters = 'Falsch'
    }],
    ['contradictory search/count copy', /Role-Copy|Copy/i, evidence => {
      const view = viewNamed(evidence, 'Nebenansicht / Slash-Menü · Keine Treffer')
      const search = view.instances.find(instance => instance.componentSetName === 'Onda/Search')
      search.roleCopy.Count = '3 Treffer'; search.roleDescendants.find(role => role.role === 'Count').characters = '3 Treffer'
    }],
    ['contradictory empty-state copy', /Role-Copy|Copy/i, evidence => {
      const view = viewNamed(evidence, 'Nebenansicht / Slash-Menü · Keine Treffer')
      const empty = view.instances.find(instance => instance.componentSetName === 'Onda/Empty State')
      empty.roleCopy.Title = 'Treffer gefunden'; empty.roleDescendants.find(role => role.role === 'Title').characters = 'Treffer gefunden'
    }],
    ['contradictory recovery copy', /Role-Copy|Copy/i, evidence => {
      const view = viewNamed(evidence, 'Nebenansicht / Rechercheablauf · Pausiert und Fehler')
      const recovery = view.instances.find(instance => instance.roleCopy.Shortcut === 'Wiederherstellung')
      recovery.roleCopy.Shortcut = 'Löschen'; recovery.roleDescendants.find(role => role.role === 'Shortcut').characters = 'Löschen'
    }],
    ['colored paint', /grayscale|Graustufe|Farbe/i, evidence => { evidence.views[0].fills[0].color.r = .5 }],
    ['Light binding in Dark', /Dark.*binding|binding.*Dark/i, evidence => { darkView(evidence).fillBindings[0].variableIds = ['variable:light:color/surface'] }],
    ['Dark binding in Light', /Light.*binding|binding.*Light/i, evidence => { lightView(evidence).fillBindings[0].variableIds = ['variable:dark:color/surface'] }],
    ['missing semantic binding', /binding|Bindung/i, evidence => { evidence.views[0].fillBindings = [] }],
    ['wrong semantic role ID', /binding|Bindung/i, evidence => { evidence.views[0].fillBindings[0].variableIds = ['variable:light:color/border'] }],
    ['wrong Dimension binding', /Dimension|spacing|Abstand/i, evidence => { evidence.views[0].layoutRegions[0].fieldVariableIds.paddingLeft = ['variable:dimension:spacing/999'] }],
    ['unauthorized effect', /effect|Effekt/i, evidence => {
      const instance = evidence.views[0].instances.find(item => !['Onda/Annotation Card', 'Onda/Dialog'].includes(item.componentSetName))
      instance.effectStyleId = 'effect-style:overlay'; instance.effects = [structuredClone(OVERLAY_EFFECT)]
    }],
    ['missing overlay style', /overlay.*style|Overlay.*Stil/i, evidence => { evidence.effectStyles = [] }],
    ['wrong effect-style ID', /effect.*style|Effektstil/i, evidence => {
      const instance = evidence.views.flatMap(view => view.instances).find(item => ['Onda/Annotation Card', 'Onda/Dialog'].includes(item.componentSetName))
      instance.effectStyleId = 'effect-style:wrong'
    }],
    ['duplicate overlay effect', /effect.*cardinality|Effekt.*Anzahl|Effekt/i, evidence => {
      const instance = evidence.views.flatMap(view => view.instances).find(item => ['Onda/Annotation Card', 'Onda/Dialog'].includes(item.componentSetName))
      instance.effects.push(structuredClone(OVERLAY_EFFECT))
    }],
    ['extra overlay style', /overlay.*style|Overlay.*Stil/i, evidence => { evidence.effectStyles.push({ ...structuredClone(evidence.effectStyles[0]), id: 'effect-style:extra' }) }],
  ]
  assert.ok(corruptions.length >= 31)
  for (const [label, pattern, corrupt] of corruptions) await t.test(label, () => {
    const evidence = strictSecondaryEvidence()
    corrupt(evidence)
    const strict = plan.validateSecondaryViewEvidence(evidence)
    assert.equal(strict.valid, false, `${label}: strict validator false-pass`)
    assert.match(strict.errors.join('\n'), pattern, `${label}: own named strict error missing`)
    const report = plan.buildVerificationReport(secondaryVerificationSnapshot(evidence))
    assert.equal(report.hardPass, false, `${label}: Verify false-pass`)
    assert.ok(report.secondaryViewErrors.length > 0, `${label}: Verify omitted strict errors`)
  })
})

test('Verify keeps legacy compatibility only when modern secondary evidence is entirely absent', () => {
  const legacy = secondaryVerificationSnapshot(undefined)
  delete legacy.secondaryViews
  assert.equal(plan.buildVerificationReport(legacy).hardPass, true)

  const emptyModern = secondaryVerificationSnapshot({ views: [] })
  const emptyReport = plan.buildVerificationReport(emptyModern)
  assert.equal(emptyReport.hardPass, false)
  assert.ok(emptyReport.secondaryViewErrors.length > 0)

  const partialModern = secondaryVerificationSnapshot({ views: [strictSecondaryEvidence().views[0]] })
  const partialReport = plan.buildVerificationReport(partialModern)
  assert.equal(partialReport.hardPass, false)
  assert.ok(partialReport.secondaryViewErrors.length > 0)
})

test('Runtime Verify supplies complete read-only modern evidence for Sections 07/09/10 only', () => {
  const source = runtimeSource()
  const collectStart = source.indexOf('async function collectSecondaryViewEvidence')
  const verifyStart = source.indexOf('async function runVerify')
  assert.ok(collectStart >= 0, 'collectSecondaryViewEvidence missing')
  assert.ok(verifyStart > collectStart, 'secondary evidence collector must precede Verify')
  const collect = source.slice(collectStart, verifyStart)
  assert.match(collect, /collectSecondaryViewMutationInventory\(page\)/)
  assert.match(collect, /page\.findAll\(/, 'modern evidence detection must scan the Page recursively')
  assert.match(collect, /getLocalVariableCollectionsAsync/)
  assert.match(collect, /getLocalVariablesAsync/)
  assert.match(collect, /getLocalEffectStylesAsync/)
  assert.match(collect, /getSharedPluginData\('onda', 'owner'\) === PLUGIN_ORIGIN/, 'owned extra effect styles must remain visible to strict evidence')
  assert.match(collect, /style\.name === 'Onda\/Shadow\/Overlay'/, 'an unowned exact-name overlay lookalike must remain visible to strict evidence')
  assert.match(collect, /readEffectStyleId/)
  assert.match(collect, /absoluteBounds/)
  assert.match(collect, /childIds/)
  assert.doesNotMatch(collect, /08 · Dialoge|11 · Prototyp|createPrototype|setReactionsAsync/)
  const verify = source.slice(verifyStart, source.indexOf('function postResult', verifyStart))
  assert.match(verify, /await collectSecondaryViewEvidence\(page\)/)
  assert.match(verify, /secondaryViews:\s*secondaryViewEvidence/)
})
