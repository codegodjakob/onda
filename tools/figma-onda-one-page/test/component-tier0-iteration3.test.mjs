import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as plan from '../src/plan.mjs'
import { COMPONENT_DEFINITIONS } from '../src/definitions.mjs'
import { createValidFoundationEvidence } from './foundation-fixture.mjs'
import { createValidComponentEvidence } from './component-fixture.mjs'

const ROOT = resolve(import.meta.dirname, '..')

function node({ id, name, type, owner = '', children = [] }) {
  const value = { id, name, type, children, getPluginData: () => owner }
  for (const child of children) child.parent = value
  return value
}

function exactButtonInventory() {
  const foundation = createValidFoundationEvidence()
  const set = createValidComponentEvidence(foundation).find(item => item.id === 'button')
  return { sets: [set], samples: [set.sample] }
}

test('recursive executable collector preserves actual page-root and nested parents and blocks command before context writes', async () => {
  assert.equal(typeof plan.collectComponentCandidateLocations, 'function')
  const nestedSet = node({ id: 'nested-set', name: 'Onda/Button', type: 'COMPONENT_SET', owner: 'onda-one-page' })
  const foreignFrame = node({ id: 'foreign-frame', name: 'Foreign', type: 'FRAME', children: [nestedSet] })
  const rootCollision = node({ id: 'root-collision', name: 'Onda/Button', type: 'FRAME' })
  const page = node({ id: 'page', name: 'Page 1', type: 'PAGE', children: [rootCollision, foreignFrame] })
  const locations = plan.collectComponentCandidateLocations(page)
  assert.deepEqual(locations.map(item => ({ nodeId: item.nodeId, parentId: item.parentId, parentType: item.parentType, parentName: item.parentName })), [
    { nodeId: 'root-collision', parentId: 'page', parentType: 'PAGE', parentName: 'Page 1' },
    { nodeId: 'nested-set', parentId: 'foreign-frame', parentType: 'FRAME', parentName: 'Foreign' },
  ])

  const inventory = {
    sets: locations.map(item => ({ ...item, name: 'Onda/Button', owner: item.node.getPluginData('ondaOrigin'), variants: [], componentProperties: [] })),
    samples: [],
  }
  const writes = []
  await assert.rejects(() => plan.executeGuardedComponentCommand({
    command: 'component-button',
    phases: { inspect: { status: 'success' }, foundations: { status: 'success' } },
    preflight: async () => {
      const result = plan.validateComponentMutationInventory(inventory, 'button')
      if (!result.valid) throw new Error(result.errors.join('\n'))
    },
    requireContext: async () => { writes.push('context'); return {} },
    mutate: async () => { writes.push('component') },
  }))
  assert.deepEqual(writes, [])
})

test('safe owned partial inventory is recoverable while wrong, unowned, duplicate, and extra partials remain rejected', () => {
  const inventory = exactButtonInventory()
  inventory.sets[0].variants = inventory.sets[0].variants.slice(0, 2)
  inventory.sets[0].variants[0].roles.pop()
  inventory.sets[0].componentProperties = []
  inventory.samples = []
  assert.equal(plan.validateComponentMutationInventory(inventory, 'button').valid, true)

  const mutations = [
    value => { value.sets[0].owner = '' },
    value => { value.sets[0].variants[0].type = 'FRAME' },
    value => { value.sets[0].variants.push(structuredClone(value.sets[0].variants[0])) },
    value => { value.sets[0].variants[0].roles.push({ nodeId: 'extra', name: 'Role/Extra', type: 'TEXT', owner: 'onda-one-page', parentId: value.sets[0].variants[0].nodeId, parentType: 'COMPONENT', parentName: value.sets[0].variants[0].name }) },
  ]
  for (const mutate of mutations) {
    const candidate = structuredClone(inventory)
    mutate(candidate)
    assert.equal(plan.validateComponentMutationInventory(candidate, 'button').valid, false)
  }
})

test('failure-injection leaves an owned partial model that retry completes exactly and later rerun is idempotent', () => {
  assert.equal(typeof plan.buildComponentRecoveryActions, 'function')
  const exact = exactButtonInventory()
  const partial = structuredClone(exact)
  partial.sets[0].variants = partial.sets[0].variants.slice(0, 1)
  partial.sets[0].variants[0].roles = partial.sets[0].variants[0].roles.slice(0, 1)
  partial.sets[0].componentProperties = []
  partial.samples = []

  function apply(action) {
    const targetSet = partial.sets[0]
    const exactSet = exact.sets[0]
    if (action.type === 'variant') targetSet.variants.push(structuredClone(exactSet.variants.find(item => item.name === action.variantName)))
    if (action.type === 'role') {
      const variant = targetSet.variants.find(item => item.name === action.variantName)
      const exactVariant = exactSet.variants.find(item => item.name === action.variantName)
      variant.roles.push(structuredClone(exactVariant.roles.find(item => item.name === action.roleName)))
    }
    if (action.type === 'property') targetSet.componentProperties = structuredClone(exactSet.componentProperties)
    if (action.type === 'sample') partial.samples = [structuredClone(exact.samples[0])]
  }

  const firstAttempt = plan.buildComponentRecoveryActions(partial, 'button')
  assert.ok(firstAttempt.length > 2)
  apply(firstAttempt[0])
  apply(firstAttempt[1])
  assert.equal(plan.validateComponentMutationInventory(partial, 'button').valid, true)

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actions = plan.buildComponentRecoveryActions(partial, 'button')
    if (!actions.length) break
    for (const action of actions) apply(action)
  }
  assert.deepEqual(plan.buildComponentRecoveryActions(partial, 'button'), [])
  assert.equal(plan.validateComponentMutationInventory(partial, 'button').valid, true)
  assert.deepEqual(partial, exact)
})

test('runtime resolves only exact direct owned component children and immediately owns repair nodes', () => {
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  const start = runtime.indexOf('async function runComponent')
  const end = runtime.indexOf('\nfunction componentSet', start)
  const source = runtime.slice(start, end)
  assert.doesNotMatch(source, /page\.findOne/)
  assert.match(source, /directChild\(section, definition\.name/)
  assert.match(source, /directChild\(section, sampleName/)
  assert.match(runtime, /setPluginData\(CREATED_MARKER_KEY, PLUGIN_ORIGIN\)/)
  assert.match(runtime, /buildComponentRecoveryActions/)
  assert.deepEqual(COMPONENT_DEFINITIONS.map(item => item.id), ['button', 'icon-button', 'status-symbol', 'tag'])
})
