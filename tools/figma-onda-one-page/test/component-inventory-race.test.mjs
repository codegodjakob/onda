import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as plan from '../src/plan.mjs'
import { PLUGIN_ORIGIN } from '../src/definitions.mjs'
import { createValidFoundationEvidence } from './foundation-fixture.mjs'
import { createValidComponentEvidence } from './component-fixture.mjs'

const PHASES = { inspect: { status: 'success' }, foundations: { status: 'success' } }
const ROOT = resolve(import.meta.dirname, '..')

function completeInventory() {
  const foundation = createValidFoundationEvidence()
  const sets = createValidComponentEvidence(foundation)
  return {
    targetPage: { id: 'page:1', name: 'Page 1', type: 'PAGE' },
    containers: [{ nodeId: 'section:components', name: '02 · Komponenten', type: 'SECTION', owner: PLUGIN_ORIGIN, parentId: 'page:1', parentType: 'PAGE', parentName: 'Page 1' }],
    sets,
    samples: sets.map(set => set.sample),
    staging: [],
  }
}

function mockNode({ id, name, type, owner = '', children = [], pluginData = {} }) {
  const node = {
    id,
    name,
    type,
    children,
    getPluginData(key) { return key === 'ondaOrigin' ? owner : pluginData[key] || '' },
  }
  for (const child of children) child.parent = node
  return node
}

async function expectRaceAbort({ mutateInventory, collectCurrentInventory }) {
  const preflightInventory = completeInventory()
  const currentInventory = structuredClone(preflightInventory)
  const contextLog = []
  const componentWrites = []
  await assert.rejects(() => plan.executeGuardedComponentCommand({
    command: 'component-button',
    phases: PHASES,
    preflight: async () => preflightInventory,
    requireContext: async () => {
      contextLog.push('context')
      if (mutateInventory) mutateInventory(currentInventory)
      return { page: currentInventory.targetPage }
    },
    collectCurrentInventory: collectCurrentInventory
      ? context => collectCurrentInventory(context, currentInventory)
      : async () => currentInventory,
    mutate: async () => { componentWrites.push('component') },
  }), /TOCTOU/)
  assert.deepEqual(contextLog, ['context'])
  assert.deepEqual(componentWrites, [])
}

test('canonical structural snapshot covers every nested record, property, link, marker, owner, and ancestry field independent of object identity', () => {
  assert.equal(typeof plan.canonicalComponentMutationSnapshot, 'function')
  const inventory = completeInventory()
  assert.deepEqual(plan.canonicalComponentMutationSnapshot(inventory), plan.canonicalComponentMutationSnapshot(structuredClone(inventory)))
  const mutations = [
    value => { value.targetPage.id = 'page:other' },
    value => { value.containers[0].owner = '' },
    value => { value.sets[0].parentId = 'section:other' },
    value => { value.sets[0].variants[0].name = 'State=Replaced' },
    value => { value.sets[0].variants[0].roles[0].owner = '' },
    value => { value.sets[0].variants[0].roles[1].characterPropertyKey = 'Label#changed' },
    value => { value.sets[0].componentProperties[0].defaultValue = 'Geändert' },
    value => { value.samples[0].mainComponentId = value.sets[0].variants[1].nodeId },
    value => { value.staging.push({
      nodeId: 'staging:button', name: 'Kind=Primary, State=Default', type: 'COMPONENT', owner: PLUGIN_ORIGIN,
      parentId: 'section:components', parentType: 'SECTION', parentName: '02 · Komponenten',
      containerId: 'section:components', containerType: 'SECTION', containerName: '02 · Komponenten', containerOwner: PLUGIN_ORIGIN,
      containerParentId: 'page:1', containerParentType: 'PAGE', containerParentName: 'Page 1',
      stagingComponent: 'button', stagingVariant: 'Kind=Primary, State=Default', roles: [],
    }) },
  ]
  const baseline = plan.canonicalComponentMutationSnapshot(inventory)
  for (const mutate of mutations) {
    const candidate = structuredClone(inventory)
    mutate(candidate)
    assert.notDeepEqual(plan.canonicalComponentMutationSnapshot(candidate), baseline)
  }
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  assert.match(runtime, /characterPropertyKey:\s*role\.type === 'TEXT' \? role\.componentPropertyReferences\?\.characters \|\| null : null/)
})

test('fresh unchanged empty inventory is collected after context and that current inventory is passed to mutation', async () => {
  const preflightInventory = { targetPage: { id: 'page:1', name: 'Page 1', type: 'PAGE' }, containers: [], sets: [], samples: [], staging: [] }
  const currentInventory = structuredClone(preflightInventory)
  const order = []
  const result = await plan.executeGuardedComponentCommand({
    command: 'component-button',
    phases: PHASES,
    preflight: async () => { order.push('preflight'); return preflightInventory },
    requireContext: async () => { order.push('context'); return { page: currentInventory.targetPage } },
    collectCurrentInventory: async () => { order.push('collect-current'); return currentInventory },
    mutate: async (_context, inventory) => {
      order.push('mutate')
      assert.equal(inventory, currentInventory)
      return 'ok'
    },
  })
  assert.equal(result, 'ok')
  assert.deepEqual(order, ['preflight', 'context', 'collect-current', 'mutate'])
})

test('duplicate set inserted after preflight aborts after context with zero component writes', async () => {
  await expectRaceAbort({
    mutateInventory: inventory => {
      const duplicate = structuredClone(inventory.sets[0])
      duplicate.nodeId = 'set:button:duplicate'
      inventory.sets.push(duplicate)
    },
  })
})

test('duplicate documentation sample inserted after preflight aborts after context with zero component writes', async () => {
  await expectRaceAbort({
    mutateInventory: inventory => {
      const duplicate = structuredClone(inventory.samples[0])
      duplicate.nodeId = 'sample:button:duplicate'
      inventory.samples.push(duplicate)
    },
  })
})

test('staging component inserted after preflight aborts after context with zero component writes', async () => {
  await expectRaceAbort({
    mutateInventory: inventory => {
      const source = inventory.sets[0].variants[0]
      inventory.staging.push({
        ...structuredClone(source),
        parentId: inventory.containers[0].nodeId,
        parentType: 'SECTION',
        parentName: '02 · Komponenten',
        containerId: inventory.containers[0].nodeId,
        containerType: 'SECTION',
        containerName: '02 · Komponenten',
        containerOwner: PLUGIN_ORIGIN,
        containerParentId: 'page:1',
        containerParentType: 'PAGE',
        containerParentName: 'Page 1',
        stagingComponent: 'button',
        stagingVariant: source.name,
      })
    },
  })
})

test('recursive nested lookalike container and descendant inserted after preflight abort before component writes', async () => {
  const directSection = mockNode({ id: 'section:components', name: '02 · Komponenten', type: 'SECTION', owner: PLUGIN_ORIGIN })
  const page = mockNode({ id: 'page:1', name: 'Page 1', type: 'PAGE', children: [directSection] })
  await expectRaceAbort({
    mutateInventory: () => {
      const nestedSet = mockNode({ id: 'set:nested', name: 'Onda/Button', type: 'COMPONENT_SET', owner: PLUGIN_ORIGIN })
      const nestedSection = mockNode({ id: 'section:nested', name: '02 · Komponenten', type: 'SECTION', owner: PLUGIN_ORIGIN, children: [nestedSet] })
      const foreign = mockNode({ id: 'frame:foreign', name: 'Foreign', type: 'FRAME', children: [nestedSection] })
      foreign.parent = page
      page.children.push(foreign)
    },
    collectCurrentInventory: (_context, inventory) => {
      const locations = plan.collectComponentInventoryLocations(page)
      const nested = locations.candidates.find(candidate => candidate.nodeId === 'set:nested')
      return {
        ...inventory,
        targetPage: locations.targetPage,
        containers: locations.containers.map(({ node: _node, ...container }) => container),
        sets: [...inventory.sets, { ...nested, variants: [], componentProperties: [] }],
      }
    },
  })
})

test('same-ID recoverable child, property, and sample-link drift still aborts before mutation', async () => {
  const mutations = [
    inventory => { inventory.sets[0].variants.pop() },
    inventory => { inventory.sets[0].variants[0].roles.pop() },
    inventory => { inventory.sets[0].componentProperties = inventory.sets[0].componentProperties.filter(property => property.type === 'VARIANT') },
    inventory => { inventory.samples[0].mainComponentId = inventory.sets[0].variants[1].nodeId },
  ]
  for (const mutateInventory of mutations) await expectRaceAbort({ mutateInventory })
})

test('known-ID replacement after equal inventories remains rejected before the first component write', async () => {
  const preflightInventory = completeInventory()
  const currentInventory = structuredClone(preflightInventory)
  const writes = []
  await assert.rejects(() => plan.executeGuardedComponentCommand({
    command: 'component-button',
    phases: PHASES,
    preflight: async () => preflightInventory,
    requireContext: async () => ({ page: currentInventory.targetPage }),
    collectCurrentInventory: async () => currentInventory,
    mutate: async (context, inventory) => {
      assert.equal(inventory, currentInventory)
      await plan.revalidateComponentNodeRecords({
        inventory,
        targetPage: context.page,
        getNodeById: async id => ({ id, name: 'replaced', type: 'FRAME', parent: null, getPluginData: () => '' }),
      })
      writes.push('component')
    },
  }), /TOCTOU/)
  assert.deepEqual(writes, [])
})
