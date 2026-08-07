import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as definitions from '../src/definitions.mjs'
import * as plan from '../src/plan.mjs'

const ROOT = resolve(import.meta.dirname, '..')

function ownedNode(name, type = 'TEXT') {
  return { name, type, visible: true, layoutPositioning: 'AUTO', owner: definitions.PLUGIN_ORIGIN }
}

function mockFrame(children) {
  return {
    children,
    appendChild(node) {
      const old = this.children.indexOf(node)
      if (old >= 0) this.children.splice(old, 1)
      this.children.push(node)
      node.parent = this
    },
    insertChild(index, node) {
      const old = this.children.indexOf(node)
      if (old >= 0) this.children.splice(old, 1)
      this.children.splice(index, 0, node)
      node.parent = this
    },
  }
}

function priorPhases() {
  return Object.fromEntries([
    ['inspect', { status: 'success' }],
    ['foundations', { status: 'success' }],
    ...definitions.COMPONENT_DEFINITIONS.map(component => [`component-${component.id}`, { status: 'success' }]),
  ])
}

function minimalInventory() {
  return {
    targetPage: { nodeId: 'page:1', id: 'page:1', name: 'Page 1', type: 'PAGE', x: 0, y: 0, fills: [] },
    sections: [], overview: null, views: [], legacyViews: [],
  }
}

function barrierInventory() {
  const inventory = minimalInventory()
  inventory.sections = [
    { nodeId: 'section:0', name: '00 · Übersicht', type: 'SECTION', owner: definitions.PLUGIN_ORIGIN, parentId: 'page:1', parentType: 'PAGE', parentName: 'Page 1', x: 0, y: 0, layoutMode: 'NONE', fills: [], strokes: [], effects: [] },
    { nodeId: 'section:1', name: '03 · Bibliothek', type: 'SECTION', owner: definitions.PLUGIN_ORIGIN, parentId: 'page:1', parentType: 'PAGE', parentName: 'Page 1', x: 0, y: 0, layoutMode: 'NONE', fills: [], strokes: [], effects: [] },
  ]
  inventory.overview = { nodeId: 'overview:1', name: definitions.CORE_OVERVIEW_DEFINITION.name, type: 'FRAME', owner: definitions.PLUGIN_ORIGIN, parentId: 'section:0', parentType: 'SECTION', parentName: '00 · Übersicht', x: 0, y: 0, fills: [], strokes: [], effects: [], lines: [], standIns: [] }
  const definition = definitions.CORE_VIEW_DEFINITIONS[0]
  const contract = definition.instances[0]
  inventory.views = [{
    nodeId: 'view:1', name: definition.name, type: 'FRAME', owner: definitions.PLUGIN_ORIGIN,
    parentId: 'section:1', parentType: 'SECTION', parentName: '03 · Bibliothek',
    layoutRegions: [{ nodeId: 'region:1', name: 'Layout / Rail', type: 'FRAME', owner: definitions.PLUGIN_ORIGIN, parentId: 'view:1', parentType: 'FRAME', parentName: definition.name, layoutMode: 'VERTICAL', childCount: 1 }],
    copyNodes: [], standIns: [], instances: [{
      nodeId: 'instance:1', name: contract.name, type: 'INSTANCE', owner: definitions.PLUGIN_ORIGIN,
      parentId: 'region:1', parentType: 'FRAME', parentName: 'Layout / Rail', roleDescendants: [{
        nodeId: 'role:1', name: 'Role/Label', type: 'TEXT', owner: definitions.PLUGIN_ORIGIN,
        parentId: 'instance:1', parentType: 'INSTANCE', parentName: contract.name, parentInstanceId: 'instance:1',
        role: 'Label', characters: 'Projekte', bounds: { x: 0, y: 0, width: 60, height: 22 }, fills: [], strokes: [], effects: [], visible: true,
      }],
    }],
  }]
  return inventory
}

function estimatedWrappedCopyHeight(contract, availableWidth) {
  const heading = contract.kind === 'title' || contract.role === 'title'
  const fontSize = heading ? 21 : 15
  const lineHeight = heading ? 28 : 22
  let lines = 1
  let lineWidth = 0
  for (const word of String(contract.characters).trim().split(/\s+/)) {
    const wordWidth = definitions.estimateCoreTextWidth(word) * fontSize / 15
    const gapWidth = lineWidth ? definitions.estimateCoreTextWidth(' ') * fontSize / 15 : 0
    if (lineWidth && lineWidth + gapWidth + wordWidth > availableWidth) {
      lines += 1
      lineWidth = wordWidth
    } else lineWidth += gapWidth + wordWidth
  }
  return lines * lineHeight
}

function estimatedRegionContentHeight(view, regionName) {
  const region = view.regions.find(item => item.name === regionName)
  const availableWidth = region.width - region.padding.left - region.padding.right
  const copyHeights = view.copyContracts.filter(copy => copy.region === regionName).map(copy => estimatedWrappedCopyHeight(copy, availableWidth))
  const instanceHeights = view.instances.filter(instance => instance.region === regionName).map(instance => instance.expectedHeight)
  const childHeights = [...copyHeights, ...instanceHeights]
  return region.padding.top + region.padding.bottom
    + childHeights.reduce((total, height) => total + height, 0)
    + Math.max(0, childHeights.length - 1) * region.itemSpacing
}

test('owned legacy children converge executable-style to hidden absolute stand-ins before Rail/Main insertion, while unowned children abort without writes', () => {
  assert.equal(typeof plan.reconcileLegacyCoreChildren, 'function', 'reconcileLegacyCoreChildren missing')
  const legacyTitle = ownedNode('Bibliothek / Alt / Titel')
  const legacyButton = ownedNode('Bibliothek / Alt / Aktion', 'FRAME')
  const frame = mockFrame([legacyTitle, legacyButton])
  const first = plan.reconcileLegacyCoreChildren(frame, new Set(['Layout / Rail', 'Layout / Main']))
  const rail = ownedNode('Layout / Rail', 'FRAME')
  const main = ownedNode('Layout / Main', 'FRAME')
  frame.appendChild(rail)
  frame.appendChild(main)
  assert.deepEqual(first.map(node => node.name), ['Bibliothek / Alt / Titel', 'Bibliothek / Alt / Aktion'])
  assert.ok(first.every(node => node.visible === false && node.layoutPositioning === 'ABSOLUTE'))
  assert.deepEqual(frame.children.filter(node => node.visible).map(node => node.name), ['Layout / Rail', 'Layout / Main'])
  const afterFirst = structuredClone(frame.children.map(({ name, visible, layoutPositioning }) => ({ name, visible, layoutPositioning })))
  plan.reconcileLegacyCoreChildren(frame, new Set(['Layout / Rail', 'Layout / Main']))
  assert.deepEqual(frame.children.map(({ name, visible, layoutPositioning }) => ({ name, visible, layoutPositioning })), afterFirst)
  const foreign = ownedNode('Fremder Bestand')
  foreign.owner = ''
  const unsafe = mockFrame([foreign])
  assert.throws(() => plan.reconcileLegacyCoreChildren(unsafe, new Set()), /ungeschützt|unowned|fremd/i)
  assert.equal(foreign.visible, true)
  assert.equal(foreign.layoutPositioning, 'AUTO')
})

test('component minimum widths are calculated from every horizontal visible role and every Core instance receives a safe exact width', () => {
  assert.equal(typeof definitions.componentMinimumWidth, 'function', 'componentMinimumWidth missing')
  assert.equal(typeof definitions.estimateCoreTextWidth, 'function', 'estimateCoreTextWidth missing')
  let checked = 0
  for (const view of definitions.CORE_VIEW_DEFINITIONS) {
    const regions = new Map(view.regions.map(region => [region.name, region]))
    for (const instance of view.instances) {
      const component = definitions.COMPONENT_DEFINITIONS.find(item => item.id === instance.setId)
      const minimum = definitions.componentMinimumWidth(component, instance.roleCopy)
      const region = regions.get(instance.region)
      assert.equal(instance.minimumWidth, minimum, `${view.name}/${instance.name}: stale minimum width`)
      assert.ok(instance.expectedWidth >= minimum, `${view.name}/${instance.name}: internal role overflow`)
      assert.ok(region.width - region.padding.left - region.padding.right >= instance.expectedWidth, `${view.name}/${instance.name}: region narrower than instance`)
      checked += 1
    }
  }
  assert.equal(checked, 119)
})

test('all ten Editor document and Review regions fit realistic wrapped Runtime content within 696 px and the annotation Empty State lives in Review', () => {
  const editors = definitions.CORE_VIEW_DEFINITIONS.filter(view => view.section === 'Editor')
  assert.equal(editors.length, 10)
  for (const view of editors) {
    for (const regionName of ['Layout / Document', 'Layout / Review']) {
      const region = view.regions.find(item => item.name === regionName)
      const estimatedHeight = estimatedRegionContentHeight(view, region.name)
      assert.ok(estimatedHeight <= region.height, `${view.name}/${region.name}: wrapped content ${estimatedHeight}px exceeds ${region.height}px`)
    }
  }
  const noActive = editors.find(view => view.name === 'Editor / Keine aktive Anmerkung')
  const empty = noActive.instances.find(instance => instance.name === 'Leerzustand / Anmerkung')
  assert.equal(empty.region, 'Layout / Review')
})

test('Library and compact Editor rails use width-safe Nav Items; compact rails contain only honest collapsed navigation and Icon Buttons are never 48 px', () => {
  for (const view of definitions.CORE_VIEW_DEFINITIONS.filter(item => item.section === 'Bibliothek')) {
    const historyName = view.name === 'Bibliothek / Leerzustand' ? 'Verlauf / Leer' : 'Verlauf / Calm Technology'
    for (const name of [historyName, 'Nutzer / Jakob']) assert.equal(view.instances.find(item => item.name === name)?.setId, 'nav-item')
  }
  for (const view of definitions.CORE_VIEW_DEFINITIONS.filter(item => ['Seitenleiste · Eingeklappt', 'Fokusmodus'].includes(item.state))) {
    const rail = view.regions.find(region => region.name === 'Layout / Rail')
    const railInstances = view.instances.filter(instance => instance.region === rail.name)
    assert.ok(railInstances.length > 0 && railInstances.every(instance => instance.setId === 'nav-item' && instance.variant === 'State=Collapsed'))
    assert.ok(railInstances.every(instance => instance.roleCopy.Icon && !instance.roleCopy.Label && !instance.roleCopy.Count && !instance.roleCopy.Status))
    assert.ok(railInstances.every(instance => instance.label === instance.roleCopy.Label), 'collapsed Label property must match its empty Role/Label override')
  }
  for (const instance of definitions.CORE_VIEW_DEFINITIONS.flatMap(view => view.instances).filter(item => item.setId === 'icon-button')) assert.ok(instance.expectedWidth > 48)
})

test('all 119 instance Role-copy contracts are screen-semantic and search/no-results copy is internally consistent', () => {
  assert.equal(typeof definitions.validateCoreRoleCopySemantics, 'function', 'validateCoreRoleCopySemantics missing')
  const result = definitions.validateCoreRoleCopySemantics(definitions.CORE_VIEW_DEFINITIONS)
  assert.deepEqual(result, { valid: true, errors: [], checked: 119 })
  const results = definitions.CORE_VIEW_DEFINITIONS.find(view => view.name === 'Bibliothek / Suche · Treffer')
  assert.equal(results.instances.find(instance => instance.setId === 'search').roleCopy.Count, '3 Treffer')
  const noResults = definitions.CORE_VIEW_DEFINITIONS.find(view => view.name === 'Bibliothek / Suche · Keine Treffer')
  const empty = noResults.instances.find(instance => instance.setId === 'empty-state')
  assert.deepEqual(empty.roleCopy, { Symbol: '○', Title: 'Keine Treffer', Description: 'Suchbegriff ändern', Action: 'Suche löschen' })
  const corrupted = structuredClone(definitions.CORE_VIEW_DEFINITIONS)
  corrupted[0].instances[0].roleCopy.Status = 'Generischer Zustand'
  assert.equal(definitions.validateCoreRoleCopySemantics(corrupted).valid, false)
})

test('Library empty-state rail is semantically empty and the collapsed-sidebar action uses an opening icon', () => {
  const emptyView = definitions.CORE_VIEW_DEFINITIONS.find(view => view.name === 'Bibliothek / Leerzustand')
  const expectedCounts = new Map([
    ['Navigation / Projekte', '0'],
    ['Navigation / Dokumente', '0'],
    ['Navigation / Papierkorb', '0'],
  ])
  for (const [name, count] of expectedCounts) assert.equal(emptyView.instances.find(instance => instance.name === name)?.roleCopy.Count, count)
  const history = emptyView.instances.find(instance => instance.region === 'Layout / Rail' && instance.name.startsWith('Verlauf /'))
  assert.equal(history?.name, 'Verlauf / Leer')
  assert.deepEqual(history?.roleCopy, { Icon: '↺', Label: 'Noch kein Verlauf', Count: '0', Status: 'Leer' })
  const sidebar = definitions.CORE_VIEW_DEFINITIONS.find(view => view.name === 'Editor / Seitenleiste · Eingeklappt')
  assert.equal(sidebar.instances.find(instance => instance.name === 'Aktion / Seitenleiste öffnen')?.roleCopy.Icon, '☰')
  for (const mutate of [
    views => { views.find(view => view.name === 'Bibliothek / Leerzustand').instances.find(instance => instance.name === 'Navigation / Dokumente').roleCopy.Count = '12' },
    views => { views.find(view => view.name === 'Bibliothek / Leerzustand').instances.find(instance => instance.name.startsWith('Verlauf /')).roleCopy.Label = 'Calm Technology' },
    views => { views.find(view => view.name === 'Editor / Seitenleiste · Eingeklappt').instances.find(instance => instance.name === 'Aktion / Seitenleiste öffnen').roleCopy.Icon = '+' },
  ]) {
    const corrupted = structuredClone(definitions.CORE_VIEW_DEFINITIONS)
    mutate(corrupted)
    assert.equal(definitions.validateCoreRoleCopySemantics(corrupted).valid, false)
  }
})

test('strict instance Role evidence checks recursive visible text, paints, effects, and absolute containment inside both instance and region', () => {
  assert.equal(typeof plan.validateCoreInstanceRoleEvidence, 'function', 'validateCoreInstanceRoleEvidence missing')
  const contract = definitions.CORE_VIEW_DEFINITIONS[0].instances.find(instance => instance.setId === 'button')
  const roles = Object.entries(contract.roleCopy).map(([role, characters], index) => ({
    nodeId: `role:${index}`, name: `Role/${role}`, type: 'TEXT', owner: definitions.PLUGIN_ORIGIN,
    parentInstanceId: 'instance:1', role, characters, visible: true,
    bounds: { x: 8 + index * 40, y: 10, width: 32, height: 22 },
    absoluteBounds: { x: 108 + index * 40, y: 110, width: 32, height: 22 },
    fills: [{ type: 'SOLID', color: { r: .08, g: .08, b: .08 } }], strokes: [], effects: [], opacity: 1,
  }))
  const instance = { nodeId: 'instance:1', bounds: { x: 0, y: 0, width: contract.expectedWidth, height: contract.expectedHeight }, absoluteBounds: { x: 100, y: 100, width: contract.expectedWidth, height: contract.expectedHeight }, roleDescendants: roles }
  const region = { bounds: { x: 0, y: 0, width: 800, height: 400 }, absoluteBounds: { x: 80, y: 80, width: 800, height: 400 } }
  assert.deepEqual(plan.validateCoreInstanceRoleEvidence(instance, contract, region), [])
  for (const mutate of [
    value => { value.roleDescendants[0].characters = 'Falsch' },
    value => { value.roleDescendants[0].absoluteBounds.x = 10 },
    value => { value.roleDescendants[0].fills[0].color.g = 1 },
    value => { value.roleDescendants[0].effects.push({ type: 'DROP_SHADOW' }) },
    value => { value.roleDescendants[0].visible = false },
  ]) {
    const bad = structuredClone(instance)
    mutate(bad)
    assert.ok(plan.validateCoreInstanceRoleEvidence(bad, contract, region).length > 0)
  }
})

test('canonical Core snapshot covers complete Section, Overview, line, and recursive Role visual/binding state', () => {
  const inventory = minimalInventory()
  inventory.sections.push({ nodeId: 'section:1', name: '00 · Übersicht', type: 'SECTION', owner: definitions.PLUGIN_ORIGIN, parentId: 'page:1', parentType: 'PAGE', parentName: 'Page 1', x: 1, y: 2, bounds: { x: 1, y: 2, width: 200, height: 300 }, layoutMode: 'NONE', fills: [], strokes: [], effects: [], opacity: 1, visible: true })
  inventory.overview = { nodeId: 'overview:1', name: definitions.CORE_OVERVIEW_DEFINITION.name, type: 'FRAME', owner: definitions.PLUGIN_ORIGIN, parentId: 'section:1', parentType: 'SECTION', parentName: '00 · Übersicht', x: 4, y: 5, bounds: { x: 4, y: 5, width: 1940, height: 200 }, layoutMode: 'VERTICAL', fills: [], strokes: [], effects: [], opacity: 1, visible: true, lines: [{ nodeId: 'line:1', name: 'Coverage / 1', type: 'TEXT', owner: definitions.PLUGIN_ORIGIN, parentId: 'overview:1', parentType: 'FRAME', parentName: definitions.CORE_OVERVIEW_DEFINITION.name, characters: 'Onda', bounds: { x: 0, y: 0, width: 100, height: 22 }, fills: [], strokes: [], effects: [], opacity: 1, visible: true, fillBindings: [] }], standIns: [] }
  inventory.views.push({ nodeId: 'view:1', name: definitions.CORE_VIEW_DEFINITIONS[0].name, type: 'FRAME', owner: definitions.PLUGIN_ORIGIN, parentId: 'section:2', parentType: 'SECTION', parentName: '03 · Bibliothek', layoutRegions: [], copyNodes: [], standIns: [], instances: [{ nodeId: 'instance:1', name: 'Navigation / Projekte', type: 'INSTANCE', owner: definitions.PLUGIN_ORIGIN, parentId: 'region:1', parentType: 'FRAME', parentName: 'Layout / Rail', roleDescendants: [{ nodeId: 'role:1', name: 'Role/Label', type: 'TEXT', owner: definitions.PLUGIN_ORIGIN, parentId: 'instance:1', parentType: 'INSTANCE', parentName: 'Navigation / Projekte', characters: 'Projekte', bounds: { x: 0, y: 0, width: 60, height: 22 }, fills: [], strokes: [], effects: [], opacity: 1, visible: true, fillBindings: [] }] }] })
  const baseline = JSON.stringify(plan.canonicalCoreViewMutationSnapshot(inventory))
  for (const mutate of [
    value => { value.sections[0].layoutMode = 'VERTICAL' },
    value => { value.overview.x += 1 },
    value => { value.overview.fills.push({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }) },
    value => { value.overview.lines[0].fillBindings.push({ variableIds: ['variable:1'] }) },
    value => { value.views[0].instances[0].roleDescendants[0].bounds.width += 1 },
    value => { value.views[0].instances[0].roleDescendants[0].effects.push({ type: 'DROP_SHADOW' }) },
  ]) {
    const drift = structuredClone(inventory)
    mutate(drift)
    assert.notEqual(JSON.stringify(plan.canonicalCoreViewMutationSnapshot(drift)), baseline)
  }
})

test('mutation inventory rejects unowned or detached recursive Role descendants before any guarded write', () => {
  const inventory = barrierInventory()
  assert.equal(plan.validateCoreViewMutationInventory(inventory).valid, true)
  for (const mutate of [
    role => { role.owner = '' },
    role => { role.parentId = 'instance:other' },
    role => { role.parentType = 'FRAME' },
    role => { role.parentInstanceId = 'instance:other' },
  ]) {
    const bad = structuredClone(inventory)
    mutate(bad.views[0].instances[0].roleDescendants[0])
    assert.equal(plan.validateCoreViewMutationInventory(bad).valid, false)
  }
})

test('guarded Core command resolves async identities before a final full re-inventory and rejects post-resolve drift with zero writes', async () => {
  for (const drift of [
    value => { value.targetPage.fills = [{ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }] },
    value => { value.sections[0].layoutMode = 'VERTICAL' },
    value => { value.overview.x += 1 },
    value => { value.overview.fills.push({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }) },
    value => { value.views[0].instances[0].roleDescendants[0].bounds.width += 1 },
    value => { value.views[0].instances[0].roleDescendants[0].fills.push({ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }) },
    value => { value.views[0].instances[0].roleDescendants[0].effects.push({ type: 'DROP_SHADOW' }) },
  ]) {
    const inventory = barrierInventory()
    let current = structuredClone(inventory)
    let reads = 0
    let writes = 0
    await assert.rejects(() => plan.executeGuardedCoreViewCommand({
      command: 'core-views', phases: priorPhases(),
      preflight: async () => inventory,
      requireContext: async () => ({ page: inventory.targetPage }),
      collectCurrentInventory: async () => { reads += 1; return structuredClone(current) },
      resolveInventoryNodes: async () => { drift(current); return new Map() },
      mutate: async () => { writes += 1 },
    }), /TOCTOU/)
    assert.equal(writes, 0)
    assert.equal(reads, 2)
  }
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  assert.match(runtime, /resolveInventoryNodes:\s*async/)
  assert.match(runtime, /roleDescendants/)
  assert.match(runtime, /reconcileLegacyCoreChildren/)
})
