import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as definitions from '../src/definitions.mjs'
import * as plan from '../src/plan.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const OWNER = 'onda-one-page'

const EXPECTED = [
  {
    id: 'button', name: 'Onda/Button', label: 'Button', roles: [['Icon', 'TEXT'], ['Label', 'TEXT']], labelRole: 'Label',
    variants: [
      ['Kind=Primary, State=Default', { Icon: '→', Label: 'Weiter' }],
      ['Kind=Primary, State=Focus', { Icon: '◎', Label: 'Weiter' }],
      ['Kind=Secondary, State=Default', { Icon: '←', Label: 'Zurück' }],
      ['Kind=Secondary, State=Focus', { Icon: '◎', Label: 'Zurück' }],
      ['Kind=Ghost, State=Default', { Icon: '…', Label: 'Mehr anzeigen' }],
      ['Kind=Ghost, State=Focus', { Icon: '◎', Label: 'Mehr anzeigen' }],
      ['Kind=Destructive, State=Default', { Icon: '!', Label: 'Löschen' }],
      ['Kind=Destructive, State=Focus', { Icon: '!', Label: 'Löschen · Fokus' }],
    ],
  },
  {
    id: 'icon-button', name: 'Onda/Icon Button', label: 'Icon Button', roles: [['Icon', 'TEXT'], ['Label', 'TEXT'], ['Description', 'TEXT']], labelRole: 'Label',
    variants: [
      ['State=Default', { Icon: '+', Label: 'Hinzufügen', Description: 'Bereit' }],
      ['State=Hover', { Icon: '+', Label: 'Hinzufügen', Description: 'Zeiger darüber' }],
      ['State=Focus', { Icon: '+', Label: 'Hinzufügen', Description: 'Tastaturfokus' }],
      ['State=Disabled', { Icon: '+', Label: 'Hinzufügen', Description: 'Nicht verfügbar' }],
      ['State=Pressed', { Icon: '+', Label: 'Hinzufügen', Description: 'Wird ausgelöst' }],
    ],
  },
  {
    id: 'status-symbol', name: 'Onda/Status Symbol', label: 'Status Symbol', roles: [['Dot', 'ELLIPSE'], ['Symbol', 'TEXT'], ['Label', 'TEXT']], labelRole: 'Label',
    variants: [
      ['Status=Ready', { Symbol: '✓', Label: 'Bereit' }],
      ['Status=Working', { Symbol: '…', Label: 'Arbeitet' }],
      ['Status=Warning', { Symbol: '!', Label: 'Prüfen' }],
      ['Status=Error', { Symbol: '×', Label: 'Fehler' }],
    ],
  },
  {
    id: 'tag', name: 'Onda/Tag', label: 'Tag', roles: [['Icon', 'TEXT'], ['Label', 'TEXT']], labelRole: 'Label',
    variants: [
      ['Kind=Neutral', { Icon: '—', Label: 'Neutral' }],
      ['Kind=Selected', { Icon: '✓', Label: 'Ausgewählt' }],
      ['Kind=Source', { Icon: '§', Label: 'Quelle' }],
      ['Kind=Warning', { Icon: '!', Label: 'Prüfen' }],
    ],
  },
]

const VARIABLE_IDS = Object.fromEntries([
  ['color/surface', 'variable:surface'], ['color/inverted', 'variable:inverted'],
  ['color/text', 'variable:text'], ['color/on-inverted', 'variable:on-inverted'],
  ['color/border', 'variable:border'], ['spacing/8', 'variable:spacing-8'], ['spacing/12', 'variable:spacing-12'],
  ['spacing/16', 'variable:spacing-16'], ['radius/control', 'variable:radius-control'],
  ['radius/circle', 'variable:radius-circle'],
])

function foundationEvidence() {
  return { variables: Object.entries(VARIABLE_IDS).map(([name, id]) => ({
    id,
    collectionName: name.startsWith('color/') ? 'Onda · Semantic · Light' : 'Onda · Dimension',
    name,
  })) }
}

function fill(variableId, value = 0.08) {
  return [{ index: 0, type: 'SOLID', variableIds: [variableId], color: { r: value, g: value, b: value } }]
}

function isInverted(definition, variantName) {
  return (definition.id === 'button' && /Kind=(Primary|Destructive)/.test(variantName))
    || (definition.id === 'icon-button' && variantName === 'State=Pressed')
    || (definition.id === 'tag' && variantName === 'Kind=Selected')
}

function componentEvidenceFixture() {
  const targetPage = { id: 'page:1', name: 'Page 1', type: 'PAGE' }
  const container = {
    nodeId: 'section:components',
    name: '02 · Komponenten',
    owner: OWNER,
    type: 'SECTION',
    parentId: targetPage.id,
    parentType: targetPage.type,
    parentName: targetPage.name,
  }
  const ancestry = {
    containerId: container.nodeId,
    containerType: container.type,
    containerName: container.name,
    containerOwner: container.owner,
    containerParentId: container.parentId,
    containerParentType: container.parentType,
    containerParentName: container.parentName,
  }
  const componentSets = EXPECTED.map((definition, setIndex) => {
    const variants = definition.variants.map(([name, copy], variantIndex) => {
      const inverted = isInverted(definition, name)
      const componentId = `component:${definition.id}:${variantIndex}`
      const roles = definition.roles.map(([roleName, type], roleIndex) => ({
        nodeId: `role:${definition.id}:${variantIndex}:${roleIndex}`,
        name: `Role/${roleName}`,
        owner: OWNER,
        type,
        parentId: componentId,
        parentType: 'COMPONENT',
        parentName: name,
        characters: type === 'TEXT' ? copy[roleName] : null,
        width: type === 'ELLIPSE' ? 16 : 80,
        height: type === 'ELLIPSE' ? 16 : 22,
        fills: fill(inverted ? VARIABLE_IDS['color/on-inverted'] : VARIABLE_IDS['color/text'], inverted ? 1 : 0.08),
        effects: [],
        fieldVariableIds: type === 'ELLIPSE' ? {
          maxWidth: [VARIABLE_IDS['radius/circle']], maxHeight: [VARIABLE_IDS['radius/circle']],
        } : {},
        characterPropertyKey: roleName === definition.labelRole ? 'Label#property' : null,
      }))
      return {
        nodeId: componentId,
        name,
        owner: OWNER,
        type: 'COMPONENT',
        parentId: `set:${definition.id}`,
        parentType: 'COMPONENT_SET',
        parentName: definition.name,
        layoutMode: 'HORIZONTAL',
        width: definition.id === 'icon-button' ? 150 : 180,
        height: 44,
        cornerRadius: 4,
        strokeWeight: name.includes('Focus') ? 2 : 1,
        opacity: name.includes('Disabled') ? 0.45 : 1,
        fills: fill(inverted ? VARIABLE_IDS['color/inverted'] : VARIABLE_IDS['color/surface'], inverted ? 0.08 : 1),
        strokes: fill(VARIABLE_IDS['color/border'], 0.82),
        effects: [],
        fieldVariableIds: {
          itemSpacing: [VARIABLE_IDS['spacing/8']],
          paddingTop: [VARIABLE_IDS['spacing/12']],
          paddingLeft: [VARIABLE_IDS['spacing/16']], paddingRight: [VARIABLE_IDS['spacing/16']],
          paddingBottom: [VARIABLE_IDS['spacing/12']],
          topLeftRadius: [VARIABLE_IDS['radius/control']], topRightRadius: [VARIABLE_IDS['radius/control']],
          bottomLeftRadius: [VARIABLE_IDS['radius/control']], bottomRightRadius: [VARIABLE_IDS['radius/control']],
        },
        dimensionValues: { itemSpacing: 8, paddingTop: 12, paddingRight: 16, paddingBottom: 12, paddingLeft: 16, minHeight: 44 },
        roles,
      }
    })
    return {
      id: definition.id,
      nodeId: `set:${definition.id}`,
      name: definition.name,
      owner: OWNER,
      type: 'COMPONENT_SET',
      parentId: 'section:components',
      parentType: 'SECTION',
      parentName: '02 · Komponenten',
      ...ancestry,
      layoutMode: 'HORIZONTAL',
      effects: [],
      componentProperties: [{ key: 'Label#property', name: 'Label', type: 'TEXT', defaultValue: definition.variants[0][1][definition.labelRole] }],
      variants,
      sample: {
        nodeId: `sample:${definition.id}`,
        name: `${definition.name} / Dokumentationsinstanz`,
        owner: OWNER,
        type: 'INSTANCE',
        parentId: 'section:components',
        parentType: 'SECTION',
        parentName: '02 · Komponenten',
        ...ancestry,
        mainComponentId: variants[0].nodeId,
        documentation: true,
        repeatedScreen: false,
        effects: [],
      },
      setIndex,
    }
  })
  return { componentSets, foundation: foundationEvidence(), targetPage, containers: [container] }
}

test('Tier0 component contract is deeply frozen with exact sets, variants, roles, and meaningful state copy', () => {
  const actual = definitions.COMPONENT_DEFINITIONS
  assert.equal(Object.isFrozen(actual), true)
  assert.deepEqual(actual.map(definition => ({
    id: definition.id,
    name: definition.name,
    variants: definition.variants?.map(variant => variant.name),
    roles: definition.roles?.map(role => [role.name, role.type]),
    labelRole: definition.labelRole,
  })), EXPECTED.map(definition => ({
    id: definition.id,
    name: definition.name,
    variants: definition.variants.map(([name]) => name),
    roles: definition.roles,
    labelRole: definition.labelRole,
  })))
  for (const definition of actual) {
    assert.equal(Object.isFrozen(definition), true)
    assert.equal(Object.isFrozen(definition.variants), true)
    assert.equal(Object.isFrozen(definition.roles), true)
    assert.equal(new Set(definition.variants.map(variant => JSON.stringify(variant.copy))).size, definition.variants.length)
    for (const variant of definition.variants) {
      for (const role of definition.roles.filter(role => role.type === 'TEXT')) assert.ok(variant.copy[role.name]?.length > 0)
    }
  }
  const destructive = actual[0].variants.filter(variant => variant.name.includes('Destructive'))
  assert.ok(destructive.every(variant => variant.copy.Icon && variant.copy.Label))
})

test('UI exposes only the four Tier0 commands in dependency order', () => {
  const ui = readFileSync(resolve(ROOT, 'ui.html'), 'utf8')
  const matches = [...ui.matchAll(/data-command="component-([^"]+)"/g)].map(match => match[1])
  assert.deepEqual(matches, EXPECTED.map(definition => definition.id))
})

test('component preflight accepts fresh and exact owned rerun inventory but rejects every ownership, type, variant, role, and sample collision', () => {
  assert.equal(typeof plan.validateComponentMutationInventory, 'function')
  for (const definition of EXPECTED) {
    assert.deepEqual(plan.validateComponentMutationInventory({ sets: [], samples: [] }, definition.id), { valid: true, errors: [] })
    const evidence = componentEvidenceFixture().componentSets.find(set => set.id === definition.id)
    assert.deepEqual(plan.validateComponentMutationInventory({ sets: [evidence], samples: [evidence.sample] }, definition.id), { valid: true, errors: [] })
  }
  const mutations = [
    value => { value.sets[0].owner = '' },
    value => { value.sets.push(structuredClone(value.sets[0])) },
    value => { value.sets[0].type = 'FRAME' },
    value => { value.sets[0].variants.push(structuredClone(value.sets[0].variants[0])) },
    value => { value.sets[0].variants[0].owner = '' },
    value => { value.sets[0].variants[0].type = 'FRAME' },
    value => { value.sets[0].variants[0].roles[0].owner = '' },
    value => { value.sets[0].componentProperties[0].defaultValue = 'Falsch' },
    value => { value.samples[0].owner = '' },
    value => { value.samples.push(structuredClone(value.samples[0])) },
    value => { value.samples[0].type = 'FRAME' },
  ]
  for (const mutate of mutations) {
    const set = componentEvidenceFixture().componentSets[0]
    const inventory = { sets: [set], samples: [set.sample] }
    mutate(inventory)
    assert.equal(plan.validateComponentMutationInventory(inventory, 'button').valid, false)
  }
  const recoverable = [
    value => { value.sets[0].variants.pop() },
    value => { value.sets[0].variants[0].roles.pop() },
    value => { value.sets[0].componentProperties = [] },
    value => { value.samples = [] },
  ]
  for (const mutate of recoverable) {
    const set = componentEvidenceFixture().componentSets[0]
    const inventory = { sets: [set], samples: [set.sample] }
    mutate(inventory)
    assert.equal(plan.validateComponentMutationInventory(inventory, 'button').valid, true)
  }
})

test('component command orchestration proves malformed inventory causes zero writes', async () => {
  assert.equal(typeof plan.executeComponentMutation, 'function')
  const set = componentEvidenceFixture().componentSets[0]
  set.owner = ''
  const writes = []
  await assert.rejects(() => plan.executeComponentMutation({
    preflight: async () => {
      const result = plan.validateComponentMutationInventory({ sets: [set], samples: [set.sample] }, 'button')
      if (!result.valid) throw new Error(result.errors.join('\n'))
    },
    requireContext: async () => { writes.push('page-plugin-data'); return {} },
    mutate: async () => { writes.push('component') },
  }))
  assert.deepEqual(writes, [])
})

test('strict Tier0 evidence validates exact runtime inventory', () => {
  assert.equal(typeof plan.validateComponentEvidence, 'function')
  assert.deepEqual(plan.validateComponentEvidence(componentEvidenceFixture()), { valid: true, errors: [] })
})

test('strict Tier0 evidence rejects single inventory, geometry, binding, visual, property, and sample corruptions', () => {
  assert.equal(typeof plan.validateComponentEvidence, 'function')
  const mutations = [
    value => { value.componentSets.pop() },
    value => { value.componentSets.push(structuredClone(value.componentSets[0])) },
    value => { value.componentSets[0].owner = '' },
    value => { value.componentSets[0].variants.pop() },
    value => { value.componentSets[0].variants[0].name = 'State=Wrong' },
    value => { value.componentSets[0].variants[0].roles.pop() },
    value => { value.componentSets[0].variants[0].layoutMode = 'NONE' },
    value => { value.componentSets[0].variants[0].height = 43 },
    value => { value.componentSets[0].variants[0].cornerRadius = 8 },
    value => { value.componentSets[0].variants[1].strokeWeight = 1 },
    value => { value.componentSets[1].variants[3].opacity = 1 },
    value => { value.componentSets[0].variants[0].fills.push(structuredClone(value.componentSets[0].variants[0].fills[0])) },
    value => { value.componentSets[0].variants[0].fills[0].variableIds[0] = 'variable:wrong' },
    value => { value.componentSets[0].variants[0].fills[0].color.r = 0.2 },
    value => { value.componentSets[0].variants[0].fieldVariableIds.itemSpacing.push('variable:wrong') },
    value => { value.componentSets[0].variants[0].effects.push({ type: 'DROP_SHADOW' }) },
    value => { value.componentSets[0].variants[0].roles[0].characters = 'Generisch' },
    value => { value.componentSets[0].componentProperties = [] },
    value => { value.componentSets[0].sample.mainComponentId = 'component:wrong' },
    value => { value.componentSets[0].sample.repeatedScreen = true },
    value => { value.componentSets[2].variants[0].roles[0].type = 'RECTANGLE' },
    value => { value.componentSets[2].variants[0].roles[0].fieldVariableIds.maxWidth = [] },
  ]
  for (const mutate of mutations) {
    const evidence = componentEvidenceFixture()
    mutate(evidence)
    const result = plan.validateComponentEvidence(evidence)
    assert.equal(result.valid, false)
    assert.ok(result.errors.length > 0)
  }
})

test('runtime replaces the generic marker generator with preflight, contract rendering, evidence collection, and separate documentation samples', () => {
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  assert.doesNotMatch(runtime, /function componentVariant\(/)
  assert.match(runtime, /preflightComponentMutation/)
  assert.match(runtime, /collectComponentEvidence/)
  assert.match(runtime, /ondaDocumentationInstance/)
  assert.match(runtime, /executeComponentMutation/)
})

test('verification report hard-gates strict Tier0 component evidence', () => {
  const source = readFileSync(resolve(ROOT, 'src/plan.mjs'), 'utf8')
  assert.match(source, /validateComponentEvidence/)
  assert.match(source, /componentStrict\.valid/)
})
