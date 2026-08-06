import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as plan from '../src/plan.mjs'
import { createValidFoundationEvidence } from './foundation-fixture.mjs'

const ROOT = resolve(import.meta.dirname, '..')

function validInventory() {
  const evidence = createValidFoundationEvidence()
  return {
    collections: evidence.collections,
    variables: evidence.variables,
    textStyles: evidence.textStyles,
    effectStyles: evidence.effectStyles,
  }
}

function validateInventory(inventory) {
  assert.equal(typeof plan.validateFoundationMutationInventory, 'function')
  return plan.validateFoundationMutationInventory(inventory)
}

test('foundation mutation preflight permits a pristine file and exact owned rerun inventory', () => {
  assert.deepEqual(validateInventory({ collections: [], variables: [], textStyles: [], effectStyles: [] }), { valid: true, errors: [] })
  assert.deepEqual(validateInventory(validInventory()), { valid: true, errors: [] })
  const partial = validInventory()
  partial.variables = partial.variables.slice(0, 1)
  partial.textStyles = partial.textStyles.slice(0, 1)
  assert.deepEqual(validateInventory(partial), { valid: true, errors: [] })
})

test('preflight rejects collisions, invalid modes, wrong types, scopes, memberships, inventory extras, and namespace extras', () => {
  const mutations = [
    ['duplicate collection', value => value.collections.push(structuredClone(value.collections[0]))],
    ['unowned expected collection', value => { value.collections[0].owner = '' }],
    ['missing mode', value => { value.collections[0].modes = [] }],
    ['extra mode', value => { value.collections[0].modes.push({ modeId: 'mode:extra', name: 'Extra' }) }],
    ['wrong mode', value => { value.collections[0].modes[0].name = 'Wrong' }],
    ['wrong variable type', value => { value.variables[0].resolvedType = 'FLOAT' }],
    ['wrong variable scope', value => { value.variables[0].scopes = ['GAP'] }],
    ['wrong variable collection', value => { value.variables[0].collectionId = value.collections[1].id; value.variables[0].collectionName = value.collections[1].name }],
    ['unowned variable', value => { value.variables[0].owner = '' }],
    ['duplicate expected variable', value => { value.variables.push({ ...structuredClone(value.variables[0]), id: 'variable:duplicate' }) }],
    ['unexpected owned variable', value => { value.variables.push({ ...structuredClone(value.variables[0]), id: 'variable:extra', name: 'unexpected/token' }) }],
    ['unexpected unowned variable', value => { value.variables.push({ ...structuredClone(value.variables[0]), id: 'variable:extra', name: 'unexpected/token', owner: '' }) }],
    ['collection namespace extra', value => { value.collections.push({ id: 'collection:extra', name: 'Onda · Experimental', owner: 'onda-one-page', modes: [{ modeId: 'mode:extra', name: 'Value' }] }) }],
    ['text style namespace extra', value => { value.textStyles.push({ ...structuredClone(value.textStyles[0]), id: 'style:extra', name: 'Onda/Type/Marketing' }) }],
    ['duplicate expected text style', value => { value.textStyles.push({ ...structuredClone(value.textStyles[0]), id: 'style:duplicate' }) }],
    ['unowned expected text style', value => { value.textStyles[0].owner = '' }],
    ['shadow namespace extra', value => { value.effectStyles.push({ ...structuredClone(value.effectStyles[0]), id: 'effect:extra', name: 'Onda/Shadow/Card' }) }],
    ['duplicate expected shadow style', value => { value.effectStyles.push({ ...structuredClone(value.effectStyles[0]), id: 'effect:duplicate' }) }],
    ['unowned expected shadow style', value => { value.effectStyles[0].owner = '' }],
  ]
  for (const [label, mutate] of mutations) {
    const inventory = structuredClone(validInventory())
    mutate(inventory)
    const result = validateInventory(inventory)
    assert.equal(result.valid, false, label)
    assert.ok(result.errors.length > 0, `${label}: errors required`)
  }
})

test('executable foundation orchestration leaves the write log empty when preflight detects a collision or wrong type', async () => {
  assert.equal(typeof plan.executeFoundationMutation, 'function')
  for (const mutate of [
    value => { value.collections[0].owner = '' },
    value => { value.variables[0].resolvedType = 'FLOAT' },
  ]) {
    const inventory = structuredClone(validInventory())
    mutate(inventory)
    const writes = []
    await assert.rejects(() => plan.executeFoundationMutation({
      preflight: async () => {
        const result = validateInventory(inventory)
        if (!result.valid) throw new Error(result.errors.join('\n'))
      },
      requireContext: async () => { writes.push('baseline/page-plugin-data'); return {} },
      mutate: async () => { writes.push('foundation-mutation') },
    }))
    assert.deepEqual(writes, [])
  }
})

test('executable foundation orchestration performs context and mutation only after a passing fresh preflight', async () => {
  const events = []
  await plan.executeFoundationMutation({
    preflight: async () => {
      events.push('preflight')
      assert.equal(validateInventory({ collections: [], variables: [], textStyles: [], effectStyles: [] }).valid, true)
    },
    requireContext: async () => { events.push('context'); return { ok: true } },
    mutate: async context => { events.push(`mutate:${context.ok}`) },
  })
  assert.deepEqual(events, ['preflight', 'context', 'mutate:true'])
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  assert.match(runtime, /executeFoundationMutation/)
  assert.match(runtime, /preflightFoundationMutation/)
})

test('pure binding collectors preserve every visible fill, duplicate ID, unbound fill, text range, and field binding', () => {
  assert.equal(typeof plan.collectVisibleFillBindings, 'function')
  assert.equal(typeof plan.collectFieldVariableIds, 'function')
  assert.equal(typeof plan.collectTextRangeBindings, 'function')
  const fills = [
    { type: 'SOLID', boundVariables: { color: { id: 'variable:correct' } } },
    { type: 'SOLID', boundVariables: { color: [{ id: 'variable:correct' }, { id: 'variable:wrong' }] } },
    { type: 'SOLID' },
    { type: 'SOLID', visible: false, boundVariables: { color: { id: 'variable:hidden' } } },
  ]
  assert.deepEqual(plan.collectVisibleFillBindings(fills), [
    { index: 0, type: 'SOLID', variableIds: ['variable:correct'] },
    { index: 1, type: 'SOLID', variableIds: ['variable:correct', 'variable:wrong'] },
    { index: 2, type: 'SOLID', variableIds: [] },
  ])
  assert.deepEqual(plan.collectFieldVariableIds({ boundVariables: {
    fontSize: [{ id: 'variable:size' }, { id: 'variable:size' }],
    fontWeight: [{ id: 'variable:weight' }, { id: 'variable:wrong' }],
  } }, ['fontSize', 'fontWeight', 'lineHeight']), {
    fontSize: ['variable:size', 'variable:size'],
    fontWeight: ['variable:weight', 'variable:wrong'],
    lineHeight: [],
  })
  const textNode = {
    getStyledTextSegments: () => [
      { start: 0, end: 4, fills: [fills[0]] },
      { start: 4, end: 8, fills: [fills[1], fills[2]] },
    ],
  }
  assert.deepEqual(plan.collectTextRangeBindings(textNode), [
    { start: 0, end: 4, fills: [{ index: 0, type: 'SOLID', variableIds: ['variable:correct'] }], fieldVariableIds: { fontSize: [], fontWeight: [] } },
    { start: 4, end: 8, fills: [
      { index: 0, type: 'SOLID', variableIds: ['variable:correct', 'variable:wrong'] },
      { index: 1, type: 'SOLID', variableIds: [] },
    ], fieldVariableIds: { fontSize: [], fontWeight: [] } },
  ])
})

function twoBoundTextSegments() {
  const fill = [{ index: 0, type: 'SOLID', variableIds: ['variable:text'] }]
  return [
    { start: 0, end: 5, fills: structuredClone(fill), fieldVariableIds: { fontSize: ['variable:size'], fontWeight: ['variable:weight'] } },
    { start: 5, end: 10, fills: structuredClone(fill), fieldVariableIds: { fontSize: ['variable:size'], fontWeight: ['variable:weight'] } },
  ]
}

test('text segment collector preserves fontSize and fontWeight aliases for every segment including empty and duplicate arrays', () => {
  const node = {
    getStyledTextSegments: fields => {
      assert.deepEqual(fields, ['fills', 'boundVariables'])
      return [
        {
          start: 0, end: 5,
          fills: [{ type: 'SOLID', boundVariables: { color: { id: 'variable:text' } } }],
          boundVariables: { fontSize: { id: 'variable:size' }, fontWeight: { id: 'variable:weight' } },
        },
        {
          start: 5, end: 10,
          fills: [{ type: 'SOLID', boundVariables: { color: { id: 'variable:text' } } }],
          boundVariables: { fontSize: [], fontWeight: [{ id: 'variable:weight' }, { id: 'variable:weight' }] },
        },
      ]
    },
  }
  assert.deepEqual(plan.collectTextRangeBindings(node), [
    {
      start: 0, end: 5,
      fills: [{ index: 0, type: 'SOLID', variableIds: ['variable:text'] }],
      fieldVariableIds: { fontSize: ['variable:size'], fontWeight: ['variable:weight'] },
    },
    {
      start: 5, end: 10,
      fills: [{ index: 0, type: 'SOLID', variableIds: ['variable:text'] }],
      fieldVariableIds: { fontSize: [], fontWeight: ['variable:weight', 'variable:weight'] },
    },
  ])
})

test('pure text coverage validator accepts contiguous complete multi-segment bindings', () => {
  assert.equal(typeof plan.validateTextRangeBindingCoverage, 'function')
  assert.equal(plan.validateTextRangeBindingCoverage(twoBoundTextSegments(), {
    charactersLength: 10,
    fillVariableId: 'variable:text',
    fontSizeVariableId: 'variable:size',
    fontWeightVariableId: 'variable:weight',
  }), true)
})

test('pure text coverage validator rejects unbound, wrong, duplicate, gap, overlap, zero-length, and extra second ranges', () => {
  assert.equal(typeof plan.validateTextRangeBindingCoverage, 'function')
  const mutations = [
    value => { value[1].fieldVariableIds.fontSize = [] },
    value => { value[1].fieldVariableIds.fontWeight = [] },
    value => { value[1].fieldVariableIds.fontSize[0] = 'variable:wrong' },
    value => { value[1].fieldVariableIds.fontWeight[0] = 'variable:wrong' },
    value => { value[1].fieldVariableIds.fontSize.push('variable:size') },
    value => { value[1].fieldVariableIds.fontWeight.push('variable:weight') },
    value => { value[1].start = 6 },
    value => { value[1].start = 4 },
    value => { value[1].end = value[1].start },
    value => { value.push({ ...structuredClone(value[1]), start: 10, end: 11 }) },
  ]
  for (const mutate of mutations) {
    const ranges = twoBoundTextSegments()
    mutate(ranges)
    assert.equal(plan.validateTextRangeBindingCoverage(ranges, {
      charactersLength: 10,
      fillVariableId: 'variable:text',
      fontSizeVariableId: 'variable:size',
      fontWeightVariableId: 'variable:weight',
    }), false)
  }
})

test('strict foundation evidence accepts correct multi-segment aliases and rejects an unbound second half', () => {
  const evidence = createValidFoundationEvidence()
  const specimen = evidence.textSpecimens[0]
  const original = specimen.textRanges[0]
  const midpoint = Math.floor(specimen.charactersLength / 2)
  specimen.textRanges = [
    { ...structuredClone(original), start: 0, end: midpoint },
    { ...structuredClone(original), start: midpoint, end: specimen.charactersLength },
  ]
  assert.equal(plan.validateFoundationEvidence(evidence).valid, true)
  specimen.textRanges[1].fieldVariableIds.fontSize = []
  assert.equal(plan.validateFoundationEvidence(evidence).valid, false)
})

test('strict validator rejects complete-cardinality attacks instead of accepting the first correct binding', () => {
  const mutations = [
    ['correct plus wrong second swatch fill', value => { value.swatches[0].fills.push({ index: 1, type: 'SOLID', variableIds: ['variable:wrong'] }) }],
    ['duplicate correct swatch fill', value => { value.swatches[0].fills.push(structuredClone(value.swatches[0].fills[0])) }],
    ['unbound extra swatch fill', value => { value.swatches[0].fills.push({ index: 1, type: 'SOLID', variableIds: [] }) }],
    ['mixed label text ranges', value => { value.swatches[0].labelTextRanges.push({ start: 1, end: 2, fills: [{ index: 0, type: 'SOLID', variableIds: ['variable:wrong'] }] }) }],
    ['duplicate spacing field binding', value => { value.spacingBars[0].fieldVariableIds.width.push(value.spacingBars[0].fieldVariableIds.width[0]) }],
    ['extra radius field ID', value => { value.radiusSamples[0].fieldVariableIds.topLeftRadius.push('variable:wrong') }],
    ['mixed typography style binding array', value => { value.textStyles[0].fieldVariableIds.fontSize.push('variable:wrong') }],
    ['mixed specimen range', value => { value.textSpecimens[0].textRanges.push({ start: 2, end: 3, fills: [{ index: 0, type: 'SOLID', variableIds: ['variable:wrong'] }] }) }],
    ['unbound overlay consumer extra fill', value => { value.effectConsumers[0].fills.push({ index: 1, type: 'SOLID', variableIds: [] }) }],
  ]
  for (const [label, mutate] of mutations) {
    const evidence = createValidFoundationEvidence()
    mutate(evidence)
    assert.equal(plan.validateFoundationEvidence(evidence).valid, false, label)
  }
})
