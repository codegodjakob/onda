import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as plan from '../src/plan.mjs'
import { COMPONENT_DEFINITIONS, PLUGIN_ORIGIN } from '../src/definitions.mjs'
import { createValidFoundationEvidence } from './foundation-fixture.mjs'
import { createValidComponentEvidence } from './component-fixture.mjs'

const ROOT = resolve(import.meta.dirname, '..')

function mockNode({ id, name, type, owner = '', children = [], pluginData = {} }) {
  const node = {
    id, name, type, children,
    getPluginData(key) { return key === 'ondaOrigin' ? owner : pluginData[key] || '' },
  }
  for (const child of children) child.parent = node
  return node
}

function exactButton() {
  const foundation = createValidFoundationEvidence()
  return { foundation, set: createValidComponentEvidence(foundation).find(item => item.id === 'button') }
}

test('collector captures target container ancestry and nested lookalike Sections cause executable zero-write rejection', async () => {
  assert.equal(typeof plan.collectComponentInventoryLocations, 'function')
  const directSet = mockNode({ id: 'set:direct', name: 'Onda/Button', type: 'COMPONENT_SET', owner: PLUGIN_ORIGIN })
  const directSection = mockNode({ id: 'section:direct', name: '02 · Komponenten', type: 'SECTION', owner: PLUGIN_ORIGIN, children: [directSet] })
  const nestedSet = mockNode({ id: 'set:nested', name: 'Onda/Button', type: 'COMPONENT_SET', owner: PLUGIN_ORIGIN })
  const nestedSection = mockNode({ id: 'section:nested', name: '02 · Komponenten', type: 'SECTION', owner: PLUGIN_ORIGIN, children: [nestedSet] })
  const foreign = mockNode({ id: 'foreign', name: 'Foreign', type: 'FRAME', children: [nestedSection] })
  const page = mockNode({ id: 'page:1', name: 'Page 1', type: 'PAGE', children: [directSection, foreign] })
  const locations = plan.collectComponentInventoryLocations(page)
  assert.deepEqual(locations.containers.map(item => ({
    nodeId: item.nodeId, owner: item.owner, parentId: item.parentId, parentType: item.parentType, parentName: item.parentName,
  })), [
    { nodeId: 'section:direct', owner: PLUGIN_ORIGIN, parentId: 'page:1', parentType: 'PAGE', parentName: 'Page 1' },
    { nodeId: 'section:nested', owner: PLUGIN_ORIGIN, parentId: 'foreign', parentType: 'FRAME', parentName: 'Foreign' },
  ])
  assert.equal(locations.candidates.find(item => item.nodeId === 'set:nested').containerId, 'section:nested')
  assert.equal(locations.candidates.find(item => item.nodeId === 'set:nested').containerParentType, 'FRAME')

  const writes = []
  await assert.rejects(() => plan.executeGuardedComponentCommand({
    command: 'component-button',
    phases: { inspect: { status: 'success' }, foundations: { status: 'success' } },
    preflight: async () => {
      const result = plan.validateComponentMutationInventory({
        targetPage: locations.targetPage,
        containers: locations.containers,
        sets: locations.candidates.filter(item => item.name === 'Onda/Button').map(item => ({ ...item, variants: [], componentProperties: [] })),
        samples: [], staging: [],
      }, 'button')
      if (!result.valid) throw new Error(result.errors.join('\n'))
    },
    requireContext: async () => { writes.push('context'); return {} },
    mutate: async () => { writes.push('component') },
  }))
  assert.deepEqual(writes, [])
})

test('partial sample linked to owned Focus is recoverable and recovery explicitly relinks Default', () => {
  const { set } = exactButton()
  const focus = structuredClone(set.variants.find(item => item.name === 'Kind=Primary, State=Focus'))
  const inventory = {
    targetPage: { id: 'page:1', name: 'Page 1', type: 'PAGE' },
    containers: [{ nodeId: set.parentId, name: set.parentName, type: set.parentType, owner: PLUGIN_ORIGIN, parentId: 'page:1', parentType: 'PAGE', parentName: 'Page 1' }],
    sets: [{ ...structuredClone(set), variants: [focus], componentProperties: [] }],
    samples: [{ ...structuredClone(set.sample), mainComponentId: focus.nodeId }],
    staging: [],
  }
  assert.equal(plan.validateComponentMutationInventory(inventory, 'button').valid, true)
  const actions = plan.buildComponentRecoveryActions(inventory, 'button')
  assert.ok(actions.some(action => action.type === 'variant' && action.variantName === 'Kind=Primary, State=Default'))
  assert.ok(actions.some(action => action.type === 'relink-sample' && action.variantName === 'Kind=Primary, State=Default'))

  const outside = structuredClone(inventory)
  outside.samples[0].mainComponentId = 'component:foreign'
  assert.equal(plan.validateComponentMutationInventory(outside, 'button').valid, false)
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  assert.match(runtime, /sample\.swapComponent\(defaultComponent\)/)
})

test('staging assembly survives injected combine failure, reuses exact owned loose components, then clears markers idempotently', async () => {
  assert.equal(typeof plan.executeStagingAssembly, 'function')
  const expected = COMPONENT_DEFINITIONS.find(item => item.id === 'button').variants.map(item => item.name)
  const staging = []
  let createCount = 0
  let combineCount = 0
  const options = {
    staging,
    expectedVariantNames: expected,
    createVariant: async variantName => {
      createCount += 1
      return { node: { id: `loose:${variantName}`, owner: PLUGIN_ORIGIN, stagingComponent: 'button', stagingVariant: variantName }, variantName }
    },
    combine: async entries => {
      combineCount += 1
      if (combineCount === 1) throw new Error('injected combine failure')
      return { id: 'set:button', entries }
    },
    clearStaging: async entry => { entry.node.stagingComponent = ''; entry.node.stagingVariant = '' },
  }
  await assert.rejects(() => plan.executeStagingAssembly(options), /injected combine failure/)
  assert.equal(staging.length, expected.length)
  assert.equal(new Set(staging.map(item => item.variantName)).size, expected.length)
  const set = await plan.executeStagingAssembly(options)
  assert.equal(set.entries.length, expected.length)
  assert.equal(createCount, expected.length)
  assert.ok(staging.every(item => item.node.stagingComponent === '' && item.node.stagingVariant === ''))
})

test('component-property inventory preserves every type while validators reject non-variant extras and wrong Label types', () => {
  assert.equal(typeof plan.collectComponentPropertyInventory, 'function')
  const records = plan.collectComponentPropertyInventory({
    'Label#1': { type: 'TEXT', defaultValue: 'Weiter' },
    'Kind#2': { type: 'VARIANT', defaultValue: 'Primary', variantOptions: ['Primary', 'Secondary'] },
    'Enabled#3': { type: 'BOOLEAN', defaultValue: true },
    'Icon#4': { type: 'INSTANCE_SWAP', defaultValue: 'component:key' },
  })
  assert.deepEqual(records.map(item => item.type), ['TEXT', 'VARIANT', 'BOOLEAN', 'INSTANCE_SWAP'])
  const inventory = { sets: [], samples: [], staging: [] }
  const { set } = exactButton()
  inventory.sets = [structuredClone(set)]
  inventory.samples = [structuredClone(set.sample)]
  inventory.sets[0].componentProperties.push(records[2])
  assert.equal(plan.validateComponentMutationInventory(inventory, 'button').valid, false)
  inventory.sets[0].componentProperties = [{ ...records[0], type: 'BOOLEAN' }]
  assert.equal(plan.validateComponentMutationInventory(inventory, 'button').valid, false)
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  const start = runtime.indexOf('function componentPropertyInventory')
  const end = runtime.indexOf('\nfunction componentRoleInventory', start)
  const source = runtime.slice(start, end)
  assert.match(source, /collectComponentPropertyInventory\(set\.componentPropertyDefinitions/)
  assert.doesNotMatch(source, /\.filter\(/)
})

test('validated preflight inventory is passed to mutation and ID revalidation blocks TOCTOU replacement before writes', async () => {
  assert.equal(typeof plan.revalidateComponentNodeRecords, 'function')
  const { set } = exactButton()
  const inventory = { sets: [set], samples: [set.sample], staging: [] }
  const writes = []
  await assert.rejects(() => plan.executeGuardedComponentCommand({
    command: 'component-button',
    phases: { inspect: { status: 'success' }, foundations: { status: 'success' } },
    preflight: async () => inventory,
    requireContext: async () => ({ page: { id: 'page:1', name: 'Page 1', type: 'PAGE' } }),
    mutate: async (context, validatedInventory) => {
      assert.equal(validatedInventory, inventory)
      await plan.revalidateComponentNodeRecords({
        inventory: validatedInventory,
        targetPage: context.page,
        getNodeById: async id => ({
          id, name: id === set.nodeId ? set.name : set.sample.name,
          type: id === set.nodeId ? set.type : set.sample.type,
          parent: { id: 'section:components', type: 'SECTION', name: '02 · Komponenten' },
          getPluginData: () => '',
        }),
      })
      writes.push('component')
    },
  }))
  assert.deepEqual(writes, [])
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  assert.match(runtime, /getNodeByIdAsync/)
  assert.doesNotMatch(runtime.slice(runtime.indexOf('async function runComponent'), runtime.indexOf('\nfunction componentSet')), /collectComponentMutationInventory/)
})
