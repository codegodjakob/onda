import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as definitions from '../src/definitions.mjs'
import * as plan from '../src/plan.mjs'
import { createValidFoundationEvidence } from './foundation-fixture.mjs'
import { createValidComponentEvidence } from './component-fixture.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const LIBRARY_NAMES = [
  'Bibliothek / Projekte · Gefüllt',
  'Bibliothek / Dokumente · Gefüllt',
  'Bibliothek / Papierkorb · Gefüllt',
  'Bibliothek / Suche · Treffer',
  'Bibliothek / Suche · Keine Treffer',
  'Bibliothek / Sortierung · Menü offen',
  'Bibliothek / Leerzustand',
  'Bibliothek / Fehler · Wiederholen',
]
const EDITOR_NAMES = [
  'Editor / Textmodus · Bereit',
  'Editor / Notizmodus · Bereit',
  'Editor / Review · Offen',
  'Editor / Ruhig · Anmerkungen verborgen',
  'Editor / Seitenleiste · Eingeklappt',
  'Editor / Fokusmodus',
  'Editor / Speichern · Läuft',
  'Editor / Speichern · Gespeichert',
  'Editor / Speichern · Fehler',
  'Editor / Keine aktive Anmerkung',
]
const ALL_NAMES = [...LIBRARY_NAMES, ...EDITOR_NAMES]

const EXPECTED_COPY = {
  'Bibliothek / Projekte · Gefüllt': ['Onda Write · Projekte', 'Projekt „Beispiel: Calm Technology“ mit 12 Dokumenten.', 'Projekte sind bereit.', 'Projekt öffnen'],
  'Bibliothek / Dokumente · Gefüllt': ['Onda Write · Dokumente', '„Beispiel: Calm Technology“ · 12 Dokumente, zuletzt „Die leise Architektur eines Arguments“.', 'Nach „Zuletzt bearbeitet“ sortiert.', 'Dokument öffnen'],
  'Bibliothek / Papierkorb · Gefüllt': ['Onda Write · Papierkorb', 'Zwei Dokumente können wiederhergestellt oder bewusst endgültig gelöscht werden.', 'Papierkorb · 2 Dokumente', 'Auswahl wiederherstellen oder endgültig löschen'],
  'Bibliothek / Suche · Treffer': ['Onda Write · Suche', 'Suchbegriff „calm“ findet das Projekt „Beispiel: Calm Technology“.', '3 Treffer', 'Treffer öffnen'],
  'Bibliothek / Suche · Keine Treffer': ['Onda Write · Suche', 'Für den Suchbegriff „unruhe“ wurden keine Projekte oder Dokumente gefunden.', 'Keine Treffer', 'Suche löschen'],
  'Bibliothek / Sortierung · Menü offen': ['Onda Write · Sortierung', 'Sortieroptionen: Zuletzt bearbeitet, Titel oder Erstellt.', 'Menü geöffnet', 'Sortierung auswählen'],
  'Bibliothek / Leerzustand': ['Onda Write · Projekte', 'Noch keine Projekte. Ein neues Projekt bündelt Dokumente und Quellen.', 'Bibliothek ist leer', 'Projekt erstellen'],
  'Bibliothek / Fehler · Wiederholen': ['Onda Write · Bibliothek', 'Projekte konnten nicht geladen werden. Sucheingabe und bereits sichtbare Daten bleiben erhalten.', 'Laden fehlgeschlagen', 'Erneut versuchen'],
  'Editor / Textmodus · Bereit': ['Onda Write · Textmodus', '„Die leise Architektur eines Arguments“ ist als Fließtext geöffnet.', 'Textmodus · Bereit', 'Text prüfen'],
  'Editor / Notizmodus · Bereit': ['Onda Write · Notizmodus', 'Notizen bleiben vom Dokumenttext getrennt und können gezielt ergänzt werden.', 'Notizmodus · Bereit', 'Notiz hinzufügen'],
  'Editor / Review · Offen': ['Onda Write · Review', 'Drei Hinweise warten auf eine bewusste redaktionelle Entscheidung.', 'Review offen · 3 Hinweise', 'Nächsten Hinweis prüfen'],
  'Editor / Ruhig · Anmerkungen verborgen': ['Onda Write · Ruhiger Modus', 'Anmerkungen sind nur verborgen; der Text und alle Entscheidungen bleiben erhalten.', 'Anmerkungen verborgen', 'Anmerkungen wieder anzeigen'],
  'Editor / Seitenleiste · Eingeklappt': ['Onda Write · Editor', 'Die linke Navigation ist eingeklappt und die Schreibfläche bleibt vollständig nutzbar.', 'Seitenleiste eingeklappt', 'Seitenleiste öffnen'],
  'Editor / Fokusmodus': ['Onda Write · Fokusmodus', 'Navigation und Hinweise treten zurück, damit die breite Schreibfläche im Mittelpunkt steht.', 'Fokusmodus aktiv', 'Fokusmodus verlassen'],
  'Editor / Speichern · Läuft': ['Onda Write · Speichern', 'Die aktuelle Fassung wird gespeichert; der Inhalt bleibt währenddessen sichtbar.', 'Speichern läuft …', 'Weiter schreiben'],
  'Editor / Speichern · Gespeichert': ['Onda Write · Gespeichert', 'Die aktuelle Fassung wurde gespeichert.', 'Gespeichert', 'Weiter schreiben'],
  'Editor / Speichern · Fehler': ['Onda Write · Speichern', 'Speichern ist fehlgeschlagen. Der Inhalt bleibt lokal sichtbar und erhalten.', 'Speichern fehlgeschlagen', 'Erneut versuchen'],
  'Editor / Keine aktive Anmerkung': ['Onda Write · Editor', 'Keine Anmerkung ist ausgewählt. Der Dokumenttext bleibt bearbeitbar.', 'Keine aktive Anmerkung', 'Anmerkungen anzeigen'],
}

function componentMeta(contract) {
  const set = definitions.COMPONENT_DEFINITIONS.find(item => item.id === contract.setId)
  const variantIndex = set.variants.findIndex(item => item.name === contract.variant)
  return { set, variantIndex }
}

function coreEvidence() {
  const core = definitions.CORE_VIEW_DEFINITIONS
  const overviewDefinition = definitions.CORE_OVERVIEW_DEFINITION
  const page = { id: 'page:1', name: 'Page 1', type: 'PAGE' }
  const sectionNames = ['00 · Übersicht', '03 · Bibliothek', '04 · Editor']
  const sections = sectionNames.map((name, index) => ({
    nodeId: `section:core:${index}`, name, type: 'SECTION', owner: definitions.PLUGIN_ORIGIN,
    parentId: page.id, parentType: 'PAGE', parentName: page.name,
  }))
  const sectionByName = new Map(sections.map(section => [section.name, section]))
  const usedSetIds = new Set(core.flatMap(definition => definition.instances.map(instance => instance.setId)))
  const components = definitions.COMPONENT_DEFINITIONS.filter(definition => usedSetIds.has(definition.id)).map(definition => ({
    id: definition.id,
    nodeId: `set:${definition.id}`,
    name: definition.name,
    type: 'COMPONENT_SET',
    owner: definitions.PLUGIN_ORIGIN,
    variants: definition.variants.map((variant, index) => ({ nodeId: `component:${definition.id}:${index}`, name: variant.name, type: 'COMPONENT', owner: definitions.PLUGIN_ORIGIN })),
  }))
  const indexes = new Map([['03 · Bibliothek', 0], ['04 · Editor', 0]])
  const views = core.map((definition, viewIndex) => {
    const section = sectionByName.get(definition.sectionName)
    const index = indexes.get(definition.sectionName)
    indexes.set(definition.sectionName, index + 1)
    const nodeId = `core-view:${viewIndex}`
    const viewBounds = { x: 80, y: 100 + index * 900, width: 1440, height: definition.height }
    const regionIdByName = new Map(definition.regions.map((region, regionIndex) => [region.name, `core-region:${viewIndex}:${regionIndex}`]))
    const regionByName = new Map(definition.regions.map(region => [region.name, region]))
    function regionBounds(region) {
      const parent = region.parentName === definition.name ? { layoutMode: definition.layoutMode } : regionByName.get(region.parentName)
      const siblings = definition.regions.filter(item => item.parentName === region.parentName)
      const before = siblings.slice(0, siblings.indexOf(region))
      return {
        x: parent.layoutMode === 'HORIZONTAL' ? before.reduce((total, item) => total + item.width + (parent.itemSpacing || 0), 0) : 0,
        y: parent.layoutMode === 'VERTICAL' ? before.reduce((total, item) => total + item.height + (parent.itemSpacing || 0), 0) : 0,
        width: region.width,
        height: region.height,
      }
    }
    const absoluteRegionBounds = new Map()
    function regionAbsoluteBounds(region) {
      if (absoluteRegionBounds.has(region.name)) return absoluteRegionBounds.get(region.name)
      const local = regionBounds(region)
      const parent = region.parentName === definition.name ? viewBounds : regionAbsoluteBounds(regionByName.get(region.parentName))
      const absolute = { x: parent.x + local.x, y: parent.y + local.y, width: local.width, height: local.height }
      absoluteRegionBounds.set(region.name, absolute)
      return absolute
    }
    const childOffsets = new Map()
    function childBounds(regionName, width, height) {
      const region = regionByName.get(regionName)
      const current = childOffsets.get(regionName) || 0
      const horizontal = region.layoutMode === 'HORIZONTAL'
      const bounds = {
        x: region.padding.left + (horizontal ? current : 0),
        y: region.padding.top + (horizontal ? 0 : current),
        width,
        height,
      }
      childOffsets.set(regionName, current + (horizontal ? width : height) + region.itemSpacing)
      return bounds
    }
    const copyNodes = definition.copyContracts.map((contract, copyIndex) => {
      const bounds = childBounds(contract.region, regionByName.get(contract.region).width - regionByName.get(contract.region).padding.left - regionByName.get(contract.region).padding.right, contract.kind === 'title' || contract.role === 'title' ? 28 : 22)
      const regionAbsolute = regionAbsoluteBounds(regionByName.get(contract.region))
      return {
        nodeId: `core-copy:${viewIndex}:${copyIndex}`,
        name: `Copy / ${contract.role}`,
        type: 'TEXT',
        owner: definitions.PLUGIN_ORIGIN,
        parentId: regionIdByName.get(contract.region),
        parentType: 'FRAME',
        parentName: contract.region,
        role: contract.role,
        characters: contract.characters,
        visible: true,
        fills: [{ type: 'SOLID', color: { r: 0.08, g: 0.08, b: 0.08 } }],
        strokes: [], effects: [],
        bounds,
        absoluteBounds: { x: regionAbsolute.x + bounds.x, y: regionAbsolute.y + bounds.y, width: bounds.width, height: bounds.height },
      }
    })
    const instances = definition.instances.map((contract, instanceIndex) => {
      const { set, variantIndex } = componentMeta(contract)
      const region = regionByName.get(contract.region)
      const bounds = childBounds(contract.region, contract.expectedWidth, contract.expectedHeight)
      const regionAbsolute = regionAbsoluteBounds(region)
      const absoluteBounds = { x: regionAbsolute.x + bounds.x, y: regionAbsolute.y + bounds.y, width: bounds.width, height: bounds.height }
      const roleDescendants = []
      let roleOffset = 0
      for (const [roleIndex, roleDefinition] of set.roles.filter(role => role.type === 'TEXT').entries()) {
        const characters = contract.roleCopy[roleDefinition.name]
        const roleWidth = definitions.estimateCoreTextWidth(characters, roleDefinition.name)
        const roleHeight = roleDefinition.name === 'Description' ? 16 : 22
        const horizontal = set.direction === 'HORIZONTAL'
        const roleBounds = { x: set.padding.left + (horizontal ? roleOffset : 0), y: set.padding.top + (horizontal ? 0 : roleOffset), width: roleWidth, height: roleHeight }
        roleOffset += (horizontal ? roleWidth : roleHeight) + set.gap
        roleDescendants.push({
          nodeId: `core-role:${viewIndex}:${instanceIndex}:${roleIndex}`,
          name: `Role/${roleDefinition.name}`, type: 'TEXT', owner: definitions.PLUGIN_ORIGIN,
          parentId: `core-instance:${viewIndex}:${instanceIndex}`, parentType: 'INSTANCE', parentName: contract.name,
          parentInstanceId: `core-instance:${viewIndex}:${instanceIndex}`, role: roleDefinition.name, characters, visible: true, opacity: 1,
          bounds: roleBounds,
          absoluteBounds: { x: absoluteBounds.x + roleBounds.x, y: absoluteBounds.y + roleBounds.y, width: roleBounds.width, height: roleBounds.height },
          fills: [{ type: 'SOLID', color: { r: 0.08, g: 0.08, b: 0.08 } }], strokes: [], effects: [], fillBindings: [], strokeBindings: [],
        })
      }
      return {
        nodeId: `core-instance:${viewIndex}:${instanceIndex}`,
        name: contract.name,
        type: 'INSTANCE',
        owner: definitions.PLUGIN_ORIGIN,
        parentId: regionIdByName.get(contract.region),
        parentType: 'FRAME',
        parentName: contract.region,
        repeatedScreen: true,
        documentation: false,
        mainComponentId: `component:${contract.setId}:${variantIndex}`,
        componentSetId: `set:${contract.setId}`,
        componentSetName: set.name,
        variantName: contract.variant,
        labelValue: contract.label,
        roleCopy: structuredClone(contract.roleCopy),
        componentProperties: { Label: { type: 'TEXT', value: contract.label } },
        region: contract.region,
        bounds,
        absoluteBounds,
        roleDescendants,
        fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
        strokes: [{ type: 'SOLID', color: { r: 0.7, g: 0.7, b: 0.7 } }],
        effects: [],
      }
    })
    return {
      nodeId,
      name: definition.name,
      type: 'FRAME',
      owner: definitions.PLUGIN_ORIGIN,
      parentId: section.nodeId,
      parentType: section.type,
      parentName: section.name,
      width: definition.width,
      height: definition.height,
      cornerRadius: definition.radius,
      effects: [],
      layoutMode: definition.layoutMode,
      itemSpacing: 0,
      paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
      fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
      strokes: [{ type: 'SOLID', color: { r: 0.82, g: 0.82, b: 0.82 } }],
      bounds: viewBounds,
      absoluteBounds: viewBounds,
      coreView: { section: definition.section, state: definition.state, width: definition.width, reviewRelation: definition.reviewContext?.relation || null },
      layoutRegions: definition.regions.map((region, regionIndex) => ({
        nodeId: `core-region:${viewIndex}:${regionIndex}`,
        name: region.name,
        type: 'FRAME',
        owner: definitions.PLUGIN_ORIGIN,
        parentId: region.parentName === definition.name ? nodeId : regionIdByName.get(region.parentName),
        parentType: 'FRAME',
        parentName: region.parentName,
        bounds: regionBounds(region),
        absoluteBounds: regionAbsoluteBounds(region),
        width: region.width,
        height: region.height,
        layoutMode: region.layoutMode,
        itemSpacing: region.itemSpacing,
        paddingTop: region.padding.top,
        paddingRight: region.padding.right,
        paddingBottom: region.padding.bottom,
        paddingLeft: region.padding.left,
        cornerRadius: 0,
        effects: [],
        fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
        strokes: [{ type: 'SOLID', color: { r: 0.82, g: 0.82, b: 0.82 } }],
        visible: true,
        childCount: definition.regions.filter(child => child.parentName === region.name).length
          + definition.copyContracts.filter(copy => copy.region === region.name).length
          + definition.instances.filter(instance => instance.region === region.name).length,
      })),
      copyNodes,
      instances,
      standIns: [],
    }
  })
  const overviewSection = sectionByName.get('00 · Übersicht')
  return {
    targetPage: page,
    sections,
    overview: {
      nodeId: 'overview:coverage', name: overviewDefinition.name, type: 'FRAME', owner: definitions.PLUGIN_ORIGIN,
      parentId: overviewSection.nodeId, parentType: 'SECTION', parentName: overviewSection.name,
      width: overviewDefinition.width, cornerRadius: overviewDefinition.radius, effects: [],
      fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
      lines: overviewDefinition.lines.map((characters, index) => ({
        nodeId: `overview-line:${index}`, name: `Coverage / ${index + 1}`, type: 'TEXT', owner: definitions.PLUGIN_ORIGIN,
        parentId: 'overview:coverage', parentType: 'FRAME', parentName: overviewDefinition.name, characters, visible: true,
      })),
      standIns: [],
    },
    components,
    views,
  }
}

function mutationInventory() {
  const evidence = coreEvidence()
  return { targetPage: evidence.targetPage, sections: evidence.sections, overview: evidence.overview, views: evidence.views, legacyViews: [] }
}

function priorPhases() {
  return Object.fromEntries([
    ['inspect', { status: 'success' }],
    ['foundations', { status: 'success' }],
    ...definitions.COMPONENT_DEFINITIONS.map(component => [`component-${component.id}`, { status: 'success' }]),
  ])
}

function verificationSnapshot(coreViews) {
  const foundation = createValidFoundationEvidence()
  const componentTargetPage = { id: 'page:1', name: 'Page 1', type: 'PAGE' }
  const componentContainers = [{ nodeId: 'section:components', name: '02 · Komponenten', type: 'SECTION', owner: definitions.PLUGIN_ORIGIN, parentId: componentTargetPage.id, parentType: 'PAGE', parentName: componentTargetPage.name }]
  return {
    targetAuthorized: true,
    pageCount: 1,
    pageName: 'Page 1',
    sections: definitions.SECTION_DEFINITIONS.map(item => ({ name: item.name, type: 'SECTION', parentType: 'PAGE', parentName: 'Page 1', owner: definitions.PLUGIN_ORIGIN })),
    annotationViews: definitions.ANNOTATION_SECTIONS.flatMap(annotation => annotation.views.map(view => ({ kind: annotation.kind, view: view.name }))),
    dialogStates: definitions.DIALOG_FAMILIES.flatMap(family => family.states.map(state => ({ family: family.name, state }))),
    componentSets: createValidComponentEvidence(foundation),
    componentTargetPage,
    componentContainers,
    instanceCount: definitions.COMPONENT_DEFINITIONS.length + 80,
    documentationInstanceCount: definitions.COMPONENT_DEFINITIONS.length,
    repeatedScreenInstanceCount: 80,
    foundation,
    coreViews,
    intersections: [], clearance: 2000, overflowNodes: [], undersizedHitTargets: [],
    reactionCount: 4, requiredReactionCount: 4,
    baselineHash: 'abc', currentBaselineHash: 'abc', baselineMismatches: [],
    baselinePages: [{ id: 'page', name: 'Page 1', index: 0 }], currentPages: [{ id: 'page', name: 'Page 1', index: 0 }],
    phases: Object.fromEntries(['inspect', 'foundations', ...definitions.COMPONENT_DEFINITIONS.map(component => `component-${component.id}`), 'core-views', ...Array.from({ length: 6 }, (_, index) => `annotations-${index + 1}`), 'dialogs-and-secondary'].map(id => [id, { status: 'success' }])),
  }
}

test('deeply frozen core contract defines exact 8 Library and 10 Editor product views with honest German copy and required component families', () => {
  const core = definitions.CORE_VIEW_DEFINITIONS
  assert.ok(Array.isArray(core), 'CORE_VIEW_DEFINITIONS missing')
  assert.equal(Object.isFrozen(core), true)
  assert.deepEqual(core.map(view => view.name), ALL_NAMES)
  assert.deepEqual(core.filter(view => view.section === 'Bibliothek').map(view => view.name), LIBRARY_NAMES)
  assert.deepEqual(core.filter(view => view.section === 'Editor').map(view => view.name), EDITOR_NAMES)
  for (const view of core) {
    assert.equal(Object.isFrozen(view), true)
    assert.equal(Object.isFrozen(view.copy), true)
    assert.equal(Object.isFrozen(view.instances), true)
    assert.equal(view.width, 1440)
    assert.equal(view.height, 800)
    assert.equal(view.radius, 0)
    assert.deepEqual(view.effects, [])
    assert.equal(view.regions.length, view.section === 'Bibliothek' ? 5 : 6)
    assert.equal(Object.isFrozen(view.regions), true)
    assert.ok(view.instances.every(instance => Object.isFrozen(instance) && view.regions.some(region => region.name === instance.region)))
    assert.deepEqual(Object.values(view.copy), EXPECTED_COPY[view.name])
    const minimum = /Leerzustand|Fehler/.test(view.name) ? 2 : 4
    assert.ok(view.instances.length >= minimum, `${view.name}: insufficient instance contract`)
  }
  const librarySets = new Set(core.filter(view => view.section === 'Bibliothek').flatMap(view => view.instances.map(instance => instance.setId)))
  for (const id of ['nav-item', 'search', 'select', 'list-row', 'empty-state', 'button', 'status-symbol', 'menu-item']) assert.ok(librarySets.has(id), `Library missing ${id}`)
  const editorSets = new Set(core.filter(view => view.section === 'Editor').flatMap(view => view.instances.map(instance => instance.setId)))
  for (const id of ['nav-item', 'mode-toggle', 'review-bar', 'annotation-anchor', 'button', 'icon-button', 'empty-state']) assert.ok(editorSets.has(id), `Editor missing ${id}`)
  assert.deepEqual(core[0].regions.map(region => region.name), ['Layout / Rail', 'Layout / Main', 'Layout / Header', 'Layout / Toolbar', 'Layout / Content'])
  assert.deepEqual(core[8].regions.map(region => region.name), ['Layout / Rail', 'Layout / Main', 'Layout / Toolbar', 'Layout / Body', 'Layout / Document', 'Layout / Review'])
  assert.ok(core.find(view => view.name === 'Editor / Seitenleiste · Eingeklappt').regions[0].width < core.find(view => view.name === 'Editor / Textmodus · Bereit').regions[0].width)
  assert.equal(definitions.COMPONENT_DEFINITIONS.length, 27)
  const overview = definitions.CORE_OVERVIEW_DEFINITION
  assert.equal(Object.isFrozen(overview), true)
  assert.deepEqual(overview.lines, ['Onda Write · Produktübersicht', 'Bibliothek · 8 Produktansichten', 'Editor · 10 Produktansichten', 'Komponenten · 27 Component Sets'])
  assert.equal(overview.radius, 6)
  assert.deepEqual(overview.effects, [])
  assert.doesNotMatch(overview.lines.join('\n'), /Anmerkung|Dialog/i)
})

test('strict core evidence accepts exact 18 real views and rejects independent view geometry, marker, copy, stand-in, cardinality, and link corruptions', () => {
  assert.equal(typeof plan.validateCoreViewEvidence, 'function')
  const valid = coreEvidence()
  assert.deepEqual(plan.validateCoreViewEvidence(valid), { valid: true, errors: [] })
  const corruptions = [
    value => { value.views.pop() },
    value => { value.views.push({ ...structuredClone(value.views[0]), nodeId: 'extra:view', name: 'Bibliothek / Extra', coreView: { section: 'Bibliothek', state: 'Extra', width: 1440 } }) },
    value => { value.views.push({ ...structuredClone(value.views[0]), nodeId: 'duplicate:view' }) },
    value => { value.views[0].parentName = '04 · Editor' },
    value => { value.views[0].width = 1439 },
    value => { value.views[0].height = 799 },
    value => { value.views[0].cornerRadius = 6 },
    value => { value.views[0].effects.push({ type: 'DROP_SHADOW' }) },
    value => { value.views[0].layoutMode = 'NONE' },
    value => { value.views[0].coreView.width = 900 },
    value => { value.views[0].copyNodes[0].characters = 'Generische Ansicht' },
    value => { value.views[0].copyNodes[0].fills = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }] },
    value => { value.views[0].copyNodes[0].effects.push({ type: 'DROP_SHADOW' }) },
    value => { value.views[0].layoutRegions[0].bounds.width -= 1 },
    value => { value.views[0].layoutRegions[0].layoutMode = 'NONE' },
    value => { value.views[0].layoutRegions[0].parentId = 'region:wrong-parent' },
    value => { value.views[0].layoutRegions[0].fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 1 } }] },
    value => { value.views[0].layoutRegions[0].effects.push({ type: 'DROP_SHADOW' }) },
    value => { value.views[0].layoutRegions[0].childCount -= 1 },
    value => { value.views[0].instances[0].bounds.x = 400 },
    value => { value.views[0].instances[0].bounds.height -= 1 },
    value => { value.views[0].instances[0].roleCopy.Label = 'Falsche sichtbare Rolle' },
    value => { value.views[0].instances[0].fills = [{ type: 'SOLID', color: { r: 0, g: 1, b: 0 } }] },
    value => { value.views[0].standIns.push({ nodeId: 'drawn:button', name: 'Gezeichneter Button', type: 'FRAME', visible: true }) },
    value => { value.views[0].instances.pop() },
    value => { value.views[0].instances[0].repeatedScreen = false },
    value => { value.views[0].instances[0].variantName = 'State=Wrong' },
    value => { value.views[0].instances[0].componentSetName = 'Onda/Button' },
    value => { value.views[0].instances[0].mainComponentId = 'component:wrong' },
    value => { value.overview.effects.push({ type: 'DROP_SHADOW' }) },
  ]
  for (const corrupt of corruptions) {
    const candidate = coreEvidence()
    corrupt(candidate)
    assert.equal(plan.validateCoreViewEvidence(candidate).valid, false)
  }
})

test('every required screen control is an owned repeated exact Variant INSTANCE with honest label override and no drawn replacement', () => {
  assert.equal(typeof plan.validateCoreViewEvidence, 'function')
  const valid = coreEvidence()
  for (const view of valid.views) {
    const definition = definitions.CORE_VIEW_DEFINITIONS.find(item => item.name === view.name)
    assert.equal(view.instances.length, definition.instances.length)
    assert.ok(view.instances.every(instance => instance.type === 'INSTANCE' && instance.owner === definitions.PLUGIN_ORIGIN && instance.repeatedScreen && !instance.documentation))
    assert.deepEqual(view.instances.map(instance => [instance.name, instance.componentSetName, instance.variantName, instance.labelValue]), definition.instances.map(contract => {
      const set = definitions.COMPONENT_DEFINITIONS.find(item => item.id === contract.setId)
      return [contract.name, set.name, contract.variant, contract.label]
    }))
    assert.deepEqual(view.standIns, [])
  }
  assert.deepEqual(plan.validateCoreViewEvidence(valid), { valid: true, errors: [] })
})

test('core mutation inventory accepts exact and safe partial owned views, returns recovery actions, and rejects duplicate, wrong-parent, unowned, and unknown marked candidates', () => {
  assert.equal(typeof plan.validateCoreViewMutationInventory, 'function')
  assert.equal(typeof plan.buildCoreViewRecoveryActions, 'function')
  const exact = mutationInventory()
  assert.deepEqual(plan.validateCoreViewMutationInventory(exact), { valid: true, errors: [] })
  assert.deepEqual(plan.buildCoreViewRecoveryActions(exact), [])
  const partial = mutationInventory()
  partial.views.pop()
  partial.views[0].copyNodes.pop()
  const removedRegion = partial.views[0].layoutRegions.pop()
  partial.views[0].instances = partial.views[0].instances.filter(instance => instance.parentId !== removedRegion.nodeId)
  partial.views[0].copyNodes = partial.views[0].copyNodes.filter(copy => copy.parentId !== removedRegion.nodeId)
  assert.deepEqual(plan.validateCoreViewMutationInventory(partial), { valid: true, errors: [] })
  const actions = plan.buildCoreViewRecoveryActions(partial)
  for (const type of ['view', 'region', 'copy', 'instance']) assert.ok(actions.some(action => action.type === type), type)
  const legacy = mutationInventory()
  const migrated = legacy.views.shift()
  migrated.name = 'Bibliothek / Gefüllte Bibliothek'
  migrated.legacy = true
  migrated.layoutRegions = []
  migrated.copyNodes = []
  migrated.instances = []
  migrated.standIns = [{
    nodeId: 'legacy:child', name: 'Bibliothek / Alt / Inhalt', type: 'TEXT', owner: definitions.PLUGIN_ORIGIN,
    parentId: migrated.nodeId, parentType: 'FRAME', parentName: migrated.name, visible: true,
  }]
  legacy.legacyViews.push(migrated)
  assert.equal(plan.validateCoreViewMutationInventory(legacy).valid, true)
  assert.ok(plan.buildCoreViewRecoveryActions(legacy).some(action => action.type === 'migrate-view'))
  for (const mutate of [
    value => { value.views.push({ ...structuredClone(value.views[0]), nodeId: 'view:duplicate' }) },
    value => { value.views[0].parentName = '04 · Editor' },
    value => { value.views[0].owner = '' },
    value => { value.views.push({ ...structuredClone(value.views[0]), nodeId: 'view:unknown', name: 'Bibliothek / Unbekannt', coreView: { section: 'Bibliothek', state: 'Unbekannt', width: 1440 } }) },
    value => { value.views[0].standIns.push({ nodeId: 'foreign:child', name: 'Fremd', type: 'FRAME', owner: '', parentId: value.views[0].nodeId, parentType: 'FRAME', parentName: value.views[0].name, visible: false }) },
    value => { value.overview.standIns.push({ nodeId: 'foreign:overview', name: 'Fremd', type: 'TEXT', owner: '', parentId: value.overview.nodeId, parentType: 'FRAME', parentName: value.overview.name, visible: false }) },
  ]) {
    const candidate = mutationInventory()
    mutate(candidate)
    assert.equal(plan.validateCoreViewMutationInventory(candidate).valid, false)
  }
})

test('guarded core command detects current-inventory duplicate and known-ID replacement after context with zero core writes', async () => {
  assert.equal(typeof plan.executeGuardedCoreViewCommand, 'function')
  for (const mutate of [
    value => { value.views.push({ ...structuredClone(value.views[0]), nodeId: 'view:race' }) },
    value => { value.views[0].nodeId = 'view:replacement' },
    value => { value.views[0].instances[0].mainComponentId = 'component:replacement' },
  ]) {
    const before = mutationInventory()
    const current = structuredClone(before)
    mutate(current)
    const writes = []
    await assert.rejects(() => plan.executeGuardedCoreViewCommand({
      command: 'core-views', phases: priorPhases(),
      preflight: async () => before,
      requireContext: async () => { writes.push('context'); return { page: before.targetPage } },
      collectCurrentInventory: async () => current,
      mutate: async () => { writes.push('core') },
    }), /TOCTOU/)
    assert.deepEqual(writes, ['context'])
  }
})

test('runtime replaces generic core builders with async exact variant-instance reuse, current-inventory preflight, deterministic layout, and no Component Set mutation', () => {
  assert.ok(Array.isArray(definitions.CORE_VIEW_DEFINITIONS), 'CORE_VIEW_DEFINITIONS missing')
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  assert.doesNotMatch(runtime, /function createLibraryView\(/)
  assert.doesNotMatch(runtime, /function createEditorView\(/)
  assert.match(runtime, /async function ensureVariantInstance\(/)
  assert.match(runtime, /await readMainComponentIdentity\(instance\)/)
  assert.match(runtime, /instance\.swapComponent\(variant\)/)
  assert.match(runtime, /setPluginData\('ondaRepeatedScreenInstance', 'true'\)/)
  assert.match(runtime, /setPluginData\('ondaCoreView'/)
  assert.match(runtime, /collectCoreViewMutationInventory/)
  assert.match(runtime, /executeGuardedCoreViewCommand/)
  assert.match(runtime, /collectCoreViewEvidence/)
  assert.match(runtime, /function configureCoreLayoutRegions/)
  assert.match(runtime, /frame\.layoutMode = definition\.layoutMode/)
  assert.match(runtime, /region\.layoutMode = regionDefinition\.layoutMode/)
  assert.match(runtime, /roleNode\.characters = characters/)
  assert.match(runtime, /resizeNode\(frame, definition\.width, definition\.height\)/)
  assert.match(runtime, /100 \+ index \* 900/)
  const coreRun = runtime.slice(runtime.indexOf('async function runCoreViews'), runtime.indexOf('function annotationStatus'))
  assert.doesNotMatch(coreRun, /createComponent\(|combineAsVariants|addComponentProperty|editComponentProperty/)
})

test('modern core evidence is a verification hard gate while legacy snapshots remain compatible without a modern false-pass', () => {
  assert.equal(typeof plan.validateCoreViewEvidence, 'function')
  const validCore = coreEvidence()
  const valid = verificationSnapshot(validCore)
  const report = plan.buildVerificationReport(valid)
  assert.equal(report.coreViewStructureValid, true)
  assert.equal(report.libraryViewCount, 8)
  assert.equal(report.editorViewCount, 10)
  assert.equal(report.hardPass, true)
  for (const corrupt of [
    value => { value.views.pop() },
    value => { value.views[0].instances[0].variantName = 'State=Wrong' },
    value => { value.views[0].standIns.push({ type: 'FRAME', visible: true }) },
  ]) {
    const candidate = verificationSnapshot(coreEvidence())
    corrupt(candidate.coreViews)
    const invalid = plan.buildVerificationReport(candidate)
    assert.equal(invalid.coreViewStructureValid, false)
    assert.equal(invalid.hardPass, false)
  }
  const legacy = verificationSnapshot(undefined)
  const legacyReport = plan.buildVerificationReport(legacy)
  assert.equal(legacyReport.hardPass, true)
  assert.equal('coreViewStructureValid' in legacyReport, false)
})
