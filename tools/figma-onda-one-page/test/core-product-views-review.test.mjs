import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as definitions from '../src/definitions.mjs'
import * as plan from '../src/plan.mjs'

const ROOT = resolve(import.meta.dirname, '..')

function componentFor(contract) {
  return definitions.COMPONENT_DEFINITIONS.find(component => component.id === contract.setId)
}

function nestedPartialInventory(definition) {
  const page = { id: 'page:1', name: definitions.TARGET_PAGE_NAME, type: 'PAGE' }
  const sections = ['00 · Übersicht', '03 · Bibliothek', '04 · Editor'].map((name, index) => ({
    nodeId: `section:${index}`,
    name,
    type: 'SECTION',
    owner: definitions.PLUGIN_ORIGIN,
    parentId: page.id,
    parentType: 'PAGE',
    parentName: page.name,
  }))
  const section = sections.find(item => item.name === definition.sectionName)
  const view = {
    nodeId: 'view:1',
    name: definition.name,
    type: 'FRAME',
    owner: definitions.PLUGIN_ORIGIN,
    parentId: section.nodeId,
    parentType: 'SECTION',
    parentName: section.name,
    layoutMode: definition.layoutMode,
    layoutRegions: [],
    copyNodes: [],
    instances: [],
    standIns: [],
  }
  const idByName = new Map([[definition.name, view.nodeId]])
  for (const [index, region] of definition.regions.entries()) idByName.set(region.name, `region:${index}`)
  view.layoutRegions = definition.regions.map((region, index) => ({
    nodeId: `region:${index}`,
    name: region.name,
    type: 'FRAME',
    owner: definitions.PLUGIN_ORIGIN,
    parentId: idByName.get(region.parentName),
    parentType: 'FRAME',
    parentName: region.parentName,
    layoutMode: region.layoutMode,
    childCount: definition.regions.filter(child => child.parentName === region.name).length,
  }))
  return { targetPage: page, sections, overview: null, views: [view], legacyViews: [] }
}

test('core contract is a real nested Auto Layout hierarchy and assigns every child to an actual parent region', () => {
  for (const view of definitions.CORE_VIEW_DEFINITIONS) {
    assert.notEqual(view.layoutMode, 'NONE', `${view.name}: outer frame must use Auto Layout`)
    const regionByName = new Map(view.regions.map(region => [region.name, region]))
    for (const region of view.regions) {
      assert.notEqual(region.layoutMode, 'NONE', `${view.name}/${region.name}: region must use Auto Layout`)
      assert.ok(region.parentName === view.name || regionByName.has(region.parentName), `${view.name}/${region.name}: missing real parent`)
    }
    for (const copy of view.copyContracts) {
      assert.equal(typeof copy.characters, 'string', `${view.name}/${copy.role}: copy needs content and region`)
      assert.ok(regionByName.has(copy.region), `${view.name}/${copy.role}: copy region missing`)
    }
    for (const instance of view.instances) assert.ok(regionByName.has(instance.region), `${view.name}/${instance.name}: instance region missing`)
  }
})

test('every Editor view carries the Calm Technology document and state-specific review relation; every Library rail has full navigation, history, and user context', () => {
  const fixture = definitions.CORE_EDITOR_DOCUMENT_FIXTURE
  assert.ok(fixture && Object.isFrozen(fixture), 'CORE_EDITOR_DOCUMENT_FIXTURE missing')
  assert.equal(fixture.title, 'Calm Technology')
  assert.ok(fixture.blocks.filter(block => block.kind === 'heading').length >= 2)
  assert.ok(fixture.blocks.filter(block => block.kind === 'paragraph').length >= 4)
  const editors = definitions.CORE_VIEW_DEFINITIONS.filter(view => view.section === 'Editor')
  assert.ok(editors.every(view => view.document === fixture), 'all Editor frames must share the frozen document fixture')
  assert.equal(new Set(editors.map(view => JSON.stringify(view.reviewContext))).size, editors.length, 'review relation must be state-specific')
  for (const view of definitions.CORE_VIEW_DEFINITIONS.filter(item => item.section === 'Bibliothek')) {
    const expectedHistory = view.name === 'Bibliothek / Leerzustand' ? 'Verlauf / Leer' : 'Verlauf / Calm Technology'
    for (const name of ['Navigation / Projekte', 'Navigation / Dokumente', 'Navigation / Papierkorb', expectedHistory, 'Nutzer / Jakob']) {
      const item = view.instances.find(instance => instance.name === name)
      assert.ok(item, `${view.name}: ${name} missing`)
      assert.equal(item.region, 'Layout / Rail')
      assert.ok(['nav-item', 'list-row'].includes(item.setId), `${name}: must be a real Nav/List instance`)
    }
  }
})

test('component geometry is derived from definitions, including the real 136 px Select height, and regions can contain their children', () => {
  assert.equal(typeof definitions.componentRenderedHeight, 'function', 'componentRenderedHeight missing')
  const select = definitions.COMPONENT_DEFINITIONS.find(component => component.id === 'select')
  assert.equal(definitions.componentRenderedHeight(select), 136)
  for (const view of definitions.CORE_VIEW_DEFINITIONS) {
    const regionByName = new Map(view.regions.map(region => [region.name, region]))
    for (const instance of view.instances) {
      const height = definitions.componentRenderedHeight(componentFor(instance))
      assert.equal(instance.expectedHeight, height, `${view.name}/${instance.name}: fake component height`)
      assert.ok(regionByName.get(instance.region).height >= height, `${view.name}/${instance.name}: region cannot contain component`)
    }
  }
})

test('every visible component text role has honest instance-local copy with no generic Essay or Projekt Nordstern residue', () => {
  for (const view of definitions.CORE_VIEW_DEFINITIONS) for (const instance of view.instances) {
    const component = componentFor(instance)
    const textRoles = component.roles.filter(role => role.type === 'TEXT').map(role => role.name).sort()
    assert.deepEqual(Object.keys(instance.roleCopy || {}).sort(), textRoles, `${view.name}/${instance.name}: incomplete role copy`)
    assert.doesNotMatch(Object.values(instance.roleCopy).join('\n'), /\bEssay\b|Projekt Nordstern/, `${view.name}/${instance.name}: generic residue`)
  }
  const select = definitions.CORE_VIEW_DEFINITIONS.flatMap(view => view.instances).find(instance => instance.setId === 'select')
  assert.ok(select.roleCopy.Value && select.roleCopy.Status && select.roleCopy.Chevron)
  const row = definitions.CORE_VIEW_DEFINITIONS.flatMap(view => view.instances).find(instance => instance.setId === 'list-row')
  assert.ok(row.roleCopy.Title && row.roleCopy.Meta && row.roleCopy.Status && row.roleCopy.Action)
})

test('nested mutation inventory is recovery-safe and rejects unowned, duplicate, or wrong-parent nodes before any write', async () => {
  const definition = definitions.CORE_VIEW_DEFINITIONS[0]
  const valid = nestedPartialInventory(definition)
  assert.equal(plan.validateCoreViewMutationInventory(valid).valid, true)
  const unowned = structuredClone(valid)
  unowned.views[0].layoutRegions[0].owner = 'other-plugin'
  assert.equal(plan.validateCoreViewMutationInventory(unowned).valid, false)
  const duplicate = structuredClone(valid)
  duplicate.views[0].layoutRegions.push(structuredClone(duplicate.views[0].layoutRegions[0]))
  duplicate.views[0].layoutRegions.at(-1).nodeId = 'region:duplicate'
  assert.equal(plan.validateCoreViewMutationInventory(duplicate).valid, false)
  const wrongParent = structuredClone(valid)
  wrongParent.views[0].layoutRegions.at(-1).parentId = 'region:wrong'
  assert.equal(plan.validateCoreViewMutationInventory(wrongParent).valid, false)
  let writes = 0
  await assert.rejects(() => plan.executeGuardedCoreViewCommand({
    command: 'core-views',
    phases: { inspect: { status: 'success' }, foundations: { status: 'success' }, ...Object.fromEntries(definitions.COMPONENT_DEFINITIONS.map(item => [`component-${item.id}`, { status: 'success' }])) },
    preflight: async () => valid,
    requireContext: async () => ({ page: {} }),
    collectCurrentInventory: async () => wrongParent,
    mutate: async () => { writes += 1 },
  }), /Core|TOCTOU/)
  assert.equal(writes, 0)
})

test('canonical Core snapshot covers all geometry, layout, paints, effects, role properties, ancestry, and catches same-ID drift at the final write barrier', async () => {
  const inventory = nestedPartialInventory(definitions.CORE_VIEW_DEFINITIONS[0])
  const view = inventory.views[0]
  Object.assign(view, { x: 10, y: 20, width: 1440, height: 800, bounds: { x: 10, y: 20, width: 1440, height: 800 }, fills: [{ color: { r: 1, g: 1, b: 1 } }], strokes: [], effects: [], itemSpacing: 0, paddingTop: 0 })
  Object.assign(view.layoutRegions[0], { bounds: { x: 0, y: 0, width: 240, height: 800 }, fills: [], strokes: [], effects: [], itemSpacing: 8, paddingTop: 16 })
  view.copyNodes.push({ nodeId: 'copy:1', name: 'Copy / title', type: 'TEXT', owner: definitions.PLUGIN_ORIGIN, parentId: view.layoutRegions[0].nodeId, parentType: 'FRAME', parentName: view.layoutRegions[0].name, role: 'title', characters: 'Calm Technology', visible: true, bounds: { x: 0, y: 0, width: 200, height: 28 }, fills: [], strokes: [], effects: [] })
  view.instances.push({ nodeId: 'instance:1', name: 'Navigation / Projekte', type: 'INSTANCE', owner: definitions.PLUGIN_ORIGIN, parentId: view.layoutRegions[0].nodeId, parentType: 'FRAME', parentName: view.layoutRegions[0].name, region: view.layoutRegions[0].name, bounds: { x: 0, y: 40, width: 200, height: 44 }, effects: [], mainComponentId: 'component:1', componentSetId: 'set:1', componentSetName: 'Onda/Nav Item', variantName: 'State=Active', roleCopy: { Label: 'Projekte' }, layoutMode: 'HORIZONTAL', repeatedScreen: true, documentation: false })
  const base = JSON.stringify(plan.canonicalCoreViewMutationSnapshot(inventory))
  for (const mutate of [
    value => { value.views[0].x += 1 },
    value => { value.views[0].fills[0].color.r = 0.9 },
    value => { value.views[0].layoutRegions[0].layoutMode = 'NONE' },
    value => { value.views[0].copyNodes[0].effects = [{ type: 'DROP_SHADOW' }] },
    value => { value.views[0].instances[0].roleCopy.Label = 'Falsch' },
    value => { value.views[0].instances[0].parentId = 'same-id-wrong-parent' },
  ]) {
    const drift = structuredClone(inventory)
    mutate(drift)
    assert.notEqual(JSON.stringify(plan.canonicalCoreViewMutationSnapshot(drift)), base, 'canonical snapshot missed mutable Core state')
  }
  const barrierInventory = nestedPartialInventory(definitions.CORE_VIEW_DEFINITIONS[0])
  let reads = 0
  let writes = 0
  await assert.rejects(() => plan.executeGuardedCoreViewCommand({
    command: 'core-views',
    phases: { inspect: { status: 'success' }, foundations: { status: 'success' }, ...Object.fromEntries(definitions.COMPONENT_DEFINITIONS.map(item => [`component-${item.id}`, { status: 'success' }])) },
    preflight: async () => barrierInventory,
    requireContext: async () => ({ page: {} }),
    collectCurrentInventory: async () => {
      reads += 1
      const current = structuredClone(barrierInventory)
      if (reads > 1) current.views[0].x = (current.views[0].x || 0) + 1
      return current
    },
    mutate: async () => { writes += 1 },
  }), /TOCTOU/)
  assert.equal(writes, 0)
  assert.equal(reads, 2, 'must re-inventory immediately before the first Core write')
})

test('runtime nests Core children, enables Auto Layout, overrides real Role nodes locally, and never mutates component definitions or sets', () => {
  const source = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  const start = source.indexOf('async function runCoreViews')
  const end = source.indexOf('\nasync function', start + 20)
  const coreRuntime = source.slice(start, end < 0 ? source.length : end)
  assert.match(source, /parent\.appendChild\(region\)/)
  assert.match(source, /region\.layoutMode\s*=\s*regionDefinition\.layoutMode/)
  assert.match(source, /findOne\([^)]*Role\//)
  assert.match(source, /roleNode\.characters\s*=/)
  assert.match(source, /resolveInventoryNodes:\s*async[\s\S]*resolveCoreInventoryNodes/)
  assert.doesNotMatch(coreRuntime, /createComponent|combineAsVariants|set\.appendChild|component\.appendChild/)
})
