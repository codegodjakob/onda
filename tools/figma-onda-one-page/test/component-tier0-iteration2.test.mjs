import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as plan from '../src/plan.mjs'
import { COMPONENT_DEFINITIONS, PLUGIN_ORIGIN } from '../src/definitions.mjs'
import { createValidFoundationEvidence } from './foundation-fixture.mjs'
import { createValidComponentEvidence } from './component-fixture.mjs'

const ROOT = resolve(import.meta.dirname, '..')

function structuredComponentEvidence() {
  const foundation = createValidFoundationEvidence()
  const componentSets = createValidComponentEvidence(foundation)
  const section = { nodeId: 'section:components', name: '02 · Komponenten', type: 'SECTION' }
  for (const set of componentSets) {
    Object.assign(set, { parentId: section.nodeId, parentType: section.type, parentName: section.name })
    for (const variant of set.variants) {
      Object.assign(variant, { parentId: set.nodeId, parentType: set.type, parentName: set.name })
      for (const role of variant.roles) Object.assign(role, { parentId: variant.nodeId, parentType: variant.type, parentName: variant.name })
      Object.assign(variant, {
        dimensionValues: {
          itemSpacing: 8,
          paddingTop: 12,
          paddingRight: 16,
          paddingBottom: 12,
          paddingLeft: 16,
          minHeight: 44,
        },
      })
      variant.fieldVariableIds.paddingTop = [foundation.variables.find(item => item.collectionName === 'Onda · Dimension' && item.name === 'spacing/12').id]
      variant.fieldVariableIds.paddingBottom = [foundation.variables.find(item => item.collectionName === 'Onda · Dimension' && item.name === 'spacing/12').id]
    }
    Object.assign(set.sample, { parentId: section.nodeId, parentType: section.type, parentName: section.name })
  }
  return { componentSets, foundation, section }
}

test('main-component identity uses only the dynamic-page async API, including mocks that throw on synchronous access', async () => {
  assert.equal(typeof plan.readMainComponentIdentity, 'function')
  const instance = {
    get mainComponent() { throw new Error('Synchronous mainComponent access is forbidden') },
    async getMainComponentAsync() { return { id: 'component:async', key: 'key:async' } },
  }
  assert.deepEqual(await plan.readMainComponentIdentity(instance), { id: 'component:async', key: 'key:async' })
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  const planSource = readFileSync(resolve(ROOT, 'src/plan.mjs'), 'utf8')
  assert.doesNotMatch(`${runtime}\n${planSource}`, /\.\s*mainComponent\b/)
  assert.match(planSource, /await\s+instance\.getMainComponentAsync\(\)/)
  assert.match(runtime, /await readMainComponentIdentity\(/)
  assert.match(runtime, /async function collectComponentEvidence/)
  assert.match(runtime, /await collectComponentEvidence\(page\)/)
})

test('component inventory and strict evidence retain wrong-type and wrongly-parented candidates instead of filtering them away', () => {
  const { componentSets } = structuredComponentEvidence()
  const button = componentSets[0]
  const validInventory = { sets: [button], samples: [button.sample] }
  assert.equal(plan.validateComponentMutationInventory(validInventory, 'button').valid, true)

  const wrongSetParent = structuredClone(validInventory)
  wrongSetParent.sets[0].parentName = 'Foreign'
  assert.equal(plan.validateComponentMutationInventory(wrongSetParent, 'button').valid, false)

  const wrongVariantParent = structuredClone(validInventory)
  wrongVariantParent.sets[0].variants[0].parentId = 'set:foreign'
  assert.equal(plan.validateComponentMutationInventory(wrongVariantParent, 'button').valid, false)

  const frameSet = structuredClone(validInventory)
  Object.assign(frameSet.sets[0], { type: 'FRAME', variants: [] })
  assert.equal(plan.validateComponentMutationInventory(frameSet, 'button').valid, false)

  const frameVariant = structuredClone(validInventory)
  frameVariant.sets[0].variants.push({
    nodeId: 'frame:extra', name: 'Decorative child', type: 'FRAME', owner: PLUGIN_ORIGIN,
    parentId: frameVariant.sets[0].nodeId, parentType: 'COMPONENT_SET', parentName: 'Onda/Button', roles: [],
  })
  assert.equal(plan.validateComponentMutationInventory(frameVariant, 'button').valid, false)

  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  assert.match(runtime, /collectComponentSectionCandidates/)
  assert.doesNotMatch(runtime, /findAll\(node => node\.type === 'COMPONENT_SET' && node\.name\.startsWith\('Onda\/'\)\)/)
  assert.doesNotMatch(runtime, /set\.children\.filter\(node => node\.type === 'COMPONENT'\)/)
})

test('strict evidence requires raw component dimensions and every spacing/radius alias with exact single cardinality', () => {
  const evidence = structuredComponentEvidence()
  assert.equal(plan.validateComponentEvidence(evidence).valid, true)
  const dimensionFields = ['itemSpacing', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']
  const radiusFields = ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']
  for (const field of [...dimensionFields, ...radiusFields]) {
    for (const mutate of [
      value => { value.componentSets[0].variants[0].fieldVariableIds[field] = [] },
      value => { value.componentSets[0].variants[0].fieldVariableIds[field].push('variable:extra') },
      value => { value.componentSets[0].variants[0].fieldVariableIds[field][0] = 'variable:wrong' },
    ]) {
      const candidate = structuredComponentEvidence()
      mutate(candidate)
      assert.equal(plan.validateComponentEvidence(candidate).valid, false, `${field} alias must be exact`)
    }
  }
  for (const [field, wrong] of Object.entries({
    itemSpacing: 7, paddingTop: 11, paddingRight: 15, paddingBottom: 11, paddingLeft: 15, minHeight: 43,
  })) {
    const candidate = structuredComponentEvidence()
    candidate.componentSets[0].variants[0].dimensionValues[field] = wrong
    assert.equal(plan.validateComponentEvidence(candidate).valid, false, `${field} raw value must be exact`)
  }
})

test('premature component phase aborts before preflight, context, ledger, or component writes', async () => {
  assert.equal(typeof plan.executeGuardedComponentCommand, 'function')
  const writes = []
  await assert.rejects(() => plan.executeGuardedComponentCommand({
    command: 'component-button',
    phases: { inspect: { status: 'success' } },
    preflight: async () => { writes.push('preflight') },
    requireContext: async () => { writes.push('ledger'); return {} },
    mutate: async () => { writes.push('component') },
  }))
  assert.deepEqual(writes, [])
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  assert.match(runtime, /executeGuardedComponentCommand/)
})

test('Icon Button keeps one action across states and Status Symbol exposes distinct grayscale symbols plus labels', () => {
  const iconButton = COMPONENT_DEFINITIONS.find(definition => definition.id === 'icon-button')
  assert.deepEqual(iconButton.roles.map(role => role.name), ['Icon', 'Label', 'Description'])
  assert.deepEqual(new Set(iconButton.variants.map(variant => variant.copy.Icon)), new Set(['+']))
  assert.deepEqual(new Set(iconButton.variants.map(variant => variant.copy.Label)), new Set(['Hinzufügen']))
  assert.equal(iconButton.variants.find(variant => variant.name === 'State=Disabled').copy.Description, 'Nicht verfügbar')

  const status = COMPONENT_DEFINITIONS.find(definition => definition.id === 'status-symbol')
  assert.deepEqual(status.roles.map(role => [role.name, role.type]), [['Dot', 'ELLIPSE'], ['Symbol', 'TEXT'], ['Label', 'TEXT']])
  assert.deepEqual(status.variants.map(variant => variant.copy.Symbol), ['✓', '…', '!', '×'])
  assert.deepEqual(status.variants.map(variant => variant.copy.Label), ['Bereit', 'Arbeitet', 'Prüfen', 'Fehler'])
})
