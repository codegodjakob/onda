import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as plan from '../src/plan.mjs'
import { COMPONENT_DEFINITIONS, PHASE_DEFINITIONS, PLUGIN_ORIGIN } from '../src/definitions.mjs'
import { createValidFoundationEvidence } from './foundation-fixture.mjs'
import { createValidComponentEvidence } from './component-fixture.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const TIER1A_IDS = ['field', 'search', 'select', 'composer', 'menu-item']
const ALL_IDS = ['button', 'icon-button', 'status-symbol', 'tag', ...TIER1A_IDS]
const LAYOUT = Object.freeze({
  gap: 8,
  gapToken: 'spacing/8',
  padding: Object.freeze({ top: 12, right: 16, bottom: 12, left: 16 }),
  paddingTokens: Object.freeze({ top: 'spacing/12', right: 'spacing/16', bottom: 'spacing/12', left: 'spacing/16' }),
})

const EXPECTED = Object.freeze([
  Object.freeze({
    id: 'field', name: 'Onda/Field', label: 'Field', labelRole: 'Label', tier: 1,
    roles: Object.freeze(['Label', 'Input', 'Hint', 'Status']), direction: 'VERTICAL', radius: 4, radiusToken: 'radius/control', targetHeight: 44,
    variants: Object.freeze([
      Object.freeze(['State=Empty', Object.freeze({ Label: 'Arbeitstitel', Input: 'Arbeitstitel eingeben', Hint: 'Pflichtfeld', Status: '○ Leer' }), 1, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Filled', Object.freeze({ Label: 'Arbeitstitel', Input: 'Die leise Architektur', Hint: 'Kann später geändert werden', Status: '✓ Ausgefüllt' }), 1, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Focus', Object.freeze({ Label: 'Arbeitstitel', Input: 'Die leise Architektur bearbeiten', Hint: 'Eingabe aktiv', Status: '◎ Fokus' }), 2, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Error', Object.freeze({ Label: 'Arbeitstitel', Input: 'Kein Arbeitstitel', Hint: 'Arbeitstitel ist erforderlich', Status: '! Fehler' }), 2, 1, 'color/surface', 'color/text']),
    ]),
  }),
  Object.freeze({
    id: 'search', name: 'Onda/Search', label: 'Search', labelRole: 'Input', tier: 1,
    roles: Object.freeze(['Icon', 'Input', 'Clear', 'Count']), direction: 'HORIZONTAL', radius: 4, radiusToken: 'radius/control', targetHeight: 44,
    variants: Object.freeze([
      Object.freeze(['State=Empty', Object.freeze({ Icon: '⌕', Input: 'Suche starten', Clear: '—', Count: '0 Treffer' }), 1, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Typing', Object.freeze({ Icon: '⌕', Input: 'Argumentation', Clear: '× Löschen', Count: 'Suche läuft' }), 2, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Results', Object.freeze({ Icon: '⌕', Input: 'Argumentation', Clear: '× Löschen', Count: '12 Treffer' }), 1, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=No Results', Object.freeze({ Icon: '⌕', Input: 'Argumentation', Clear: '× Löschen', Count: '0 Treffer · Suchbegriff ändern' }), 2, 1, 'color/surface', 'color/text-muted']),
    ]),
  }),
  Object.freeze({
    id: 'select', name: 'Onda/Select', label: 'Select', labelRole: 'Label', tier: 1,
    roles: Object.freeze(['Label', 'Value', 'Chevron', 'Status']), direction: 'VERTICAL', radius: 4, radiusToken: 'radius/control', targetHeight: 44,
    variants: Object.freeze([
      Object.freeze(['State=Closed', Object.freeze({ Label: 'Dokumenttyp', Value: 'Typ auswählen', Chevron: '⌄', Status: '○ Geschlossen' }), 1, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Open', Object.freeze({ Label: 'Dokumenttyp', Value: 'Essay · Bericht · Notiz', Chevron: '⌃', Status: '◎ Offen' }), 2, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Selected', Object.freeze({ Label: 'Dokumenttyp', Value: 'Essay', Chevron: '⌄', Status: '✓ Ausgewählt' }), 2, 1, 'color/inverted', 'color/on-inverted']),
    ]),
  }),
  Object.freeze({
    id: 'composer', name: 'Onda/Composer', label: 'Composer', labelRole: 'Input', tier: 1,
    roles: Object.freeze(['Prompt', 'Input', 'Submit', 'Status']), direction: 'VERTICAL', radius: 4, radiusToken: 'radius/control', targetHeight: 88,
    variants: Object.freeze([
      Object.freeze(['State=Empty', Object.freeze({ Prompt: 'Nachricht an den Agenten', Input: 'Frage oder Auftrag eingeben', Submit: 'Senden', Status: '○ Bereit' }), 1, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Draft', Object.freeze({ Prompt: 'Nachricht an den Agenten', Input: 'Prüfe die Argumentation auf Beleglücken.', Submit: 'Senden', Status: '● Entwurf' }), 2, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Sending', Object.freeze({ Prompt: 'Nachricht an den Agenten', Input: 'Prüfe die Argumentation auf Beleglücken.', Submit: 'Senden', Status: '… Wird gesendet' }), 2, 1, 'color/inverted', 'color/on-inverted']),
      Object.freeze(['State=Error', Object.freeze({ Prompt: 'Nachricht an den Agenten', Input: 'Prüfe die Argumentation auf Beleglücken.', Submit: 'Senden', Status: '! Fehler · Erneut versuchen' }), 2, 1, 'color/surface', 'color/text']),
    ]),
  }),
  Object.freeze({
    id: 'menu-item', name: 'Onda/Menu Item', label: 'Menu Item', labelRole: 'Label', tier: 1,
    roles: Object.freeze(['Icon', 'Label', 'Shortcut']), direction: 'HORIZONTAL', radius: 0, radiusToken: 'radius/none', targetHeight: 44,
    variants: Object.freeze([
      Object.freeze(['State=Default', Object.freeze({ Icon: '§', Label: 'Quelle öffnen', Shortcut: '↵' }), 1, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Hover', Object.freeze({ Icon: '→', Label: 'Quelle öffnen', Shortcut: '↵ Hover' }), 2, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Selected', Object.freeze({ Icon: '✓', Label: 'Quelle öffnen', Shortcut: '↵ Ausgewählt' }), 2, 1, 'color/inverted', 'color/on-inverted']),
      Object.freeze(['State=Disabled', Object.freeze({ Icon: '×', Label: 'Quelle öffnen', Shortcut: 'Nicht verfügbar' }), 1, 0.45, 'color/surface', 'color/text-muted']),
    ]),
  }),
])

function evidence() {
  const foundation = createValidFoundationEvidence()
  return {
    foundation,
    componentSets: createValidComponentEvidence(foundation),
    targetPage: { id: 'page:1', name: 'Page 1', type: 'PAGE' },
    containers: [{ nodeId: 'section:components', name: '02 · Komponenten', type: 'SECTION', owner: PLUGIN_ORIGIN, parentId: 'page:1', parentType: 'PAGE', parentName: 'Page 1' }],
  }
}

function expectedAxes(definition) {
  const result = new Map()
  for (const variant of definition.variants) {
    for (const part of variant.name.split(', ')) {
      const [name, value] = part.split('=')
      if (!result.has(name)) result.set(name, [])
      if (!result.get(name).includes(value)) result.get(name).push(value)
    }
  }
  return result
}

test('frozen contract adds exactly five Tier1a definitions with exact roles, copy, layout, and visual state attributes', () => {
  assert.deepEqual(COMPONENT_DEFINITIONS.map(item => item.id), ALL_IDS)
  assert.deepEqual(COMPONENT_DEFINITIONS.filter(item => item.tier === 1).map(definition => ({
    id: definition.id,
    name: definition.name,
    label: definition.label,
    labelRole: definition.labelRole,
    tier: definition.tier,
    roles: definition.roles.map(role => role.name),
    direction: definition.direction,
    radius: definition.radius,
    radiusToken: definition.radiusToken,
    targetHeight: definition.targetHeight,
    gap: definition.gap,
    gapToken: definition.gapToken,
    padding: definition.padding,
    paddingTokens: definition.paddingTokens,
    variants: definition.variants.map(variant => [variant.name, variant.copy, variant.strokeWeight, variant.opacity, variant.surfaceToken, variant.textToken]),
  })), EXPECTED.map(item => ({ ...item, ...LAYOUT })))
  for (const definition of COMPONENT_DEFINITIONS) {
    assert.equal(Object.isFrozen(definition), true)
    for (const field of ['roles', 'variants', 'padding', 'paddingTokens']) assert.equal(Object.isFrozen(definition[field]), true)
    for (const variant of definition.variants) {
      assert.equal(Object.isFrozen(variant), true)
      assert.equal(Object.isFrozen(variant.copy), true)
    }
  }
})

test('UI and phase contract expose exactly nine component commands in dependency order and no Tier1b names', () => {
  const ui = readFileSync(resolve(ROOT, 'ui.html'), 'utf8')
  const buttons = [...ui.matchAll(/data-command="component-([^"]+)"/g)].map(match => match[1])
  const phase = PHASE_DEFINITIONS.find(item => item.id === 'components')
  assert.deepEqual(buttons, ALL_IDS)
  assert.deepEqual(phase.commands.map(command => command.componentId), ALL_IDS)
  for (const forbidden of ['checkbox', 'radio', 'tabs', 'tooltip', 'modal', 'toast']) assert.doesNotMatch(ui.toLowerCase(), new RegExp(`component-${forbidden}`))
})

test('executable nine-set fixture passes strict evidence and generated VARIANT properties are exact with Label as the only TEXT property', () => {
  const actual = evidence()
  assert.equal(actual.componentSets.length, 9)
  assert.deepEqual(plan.validateComponentEvidence(actual), { valid: true, errors: [] })
  for (const set of actual.componentSets) {
    const definition = COMPONENT_DEFINITIONS.find(item => item.id === set.id)
    const label = set.componentProperties.filter(property => property.type === 'TEXT')
    assert.deepEqual(label.map(property => property.name), ['Label'])
    assert.equal(label[0].defaultValue, definition.variants[0].copy[definition.labelRole])
    const axes = expectedAxes(definition)
    const generated = set.componentProperties.filter(property => property.type === 'VARIANT')
    assert.deepEqual(generated.map(property => property.name), [...axes.keys()])
    for (const property of generated) assert.deepEqual(property.variantOptions, axes.get(property.name))
  }
})

test('strict evidence independently rejects copy, binding, geometry, height, and role corruption across the five Tier1a sets', () => {
  const corruptions = new Map([
    ['field', set => { set.variants[0].roles.find(role => role.name === 'Role/Status').characters = 'Fehler' }],
    ['search', set => { set.variants[1].fieldVariableIds.itemSpacing.push('variable:extra') }],
    ['select', set => { set.variants[2].cornerRadius = 0 }],
    ['composer', set => { set.variants[0].height = 87; set.variants[0].dimensionValues.minHeight = 87 }],
    ['menu-item', set => { set.variants[0].roles.pop() }],
  ])
  for (const [id, corrupt] of corruptions) {
    const candidate = evidence()
    const set = candidate.componentSets.find(item => item.id === id)
    assert.ok(set, `${id} fixture missing`)
    corrupt(set)
    assert.equal(plan.validateComponentEvidence(candidate).valid, false, `${id} corruption must fail`)
  }
  for (const mutate of [
    set => set.componentProperties.push({ key: 'Enabled#extra', name: 'Enabled', type: 'BOOLEAN', defaultValue: true }),
    set => { set.componentProperties.find(property => property.name === 'State').variantOptions = ['Wrong'] },
    set => { set.sample.mainComponentId = 'component:foreign' },
  ]) {
    const candidate = evidence()
    mutate(candidate.componentSets.find(item => item.id === 'field'))
    assert.equal(plan.validateComponentEvidence(candidate).valid, false)
  }
})

test('all Tier1a mutation inventories accept exact and safe partial states while recovery converges to missing variants, roles, properties, samples, and Default links', () => {
  for (const id of TIER1A_IDS) {
    const actual = evidence()
    const set = actual.componentSets.find(item => item.id === id)
    assert.ok(set, `${id} fixture missing`)
    const inventory = {
      targetPage: actual.targetPage,
      containers: actual.containers,
      sets: actual.componentSets,
      samples: actual.componentSets.map(item => item.sample),
      staging: [],
    }
    assert.equal(plan.validateComponentMutationInventory(inventory, id).valid, true)
    set.variants.pop()
    set.variants[0].roles.pop()
    set.componentProperties = set.componentProperties.filter(property => property.type === 'VARIANT')
    inventory.samples = inventory.samples.filter(sample => sample.name !== set.sample.name)
    assert.equal(plan.validateComponentMutationInventory(inventory, id).valid, true)
    const actions = plan.buildComponentRecoveryActions(inventory, id)
    assert.ok(actions.some(action => action.type === 'variant'))
    assert.ok(actions.some(action => action.type === 'role'))
    assert.ok(actions.some(action => action.type === 'property'))
    assert.ok(actions.some(action => action.type === 'sample'))
  }
})

test('Tier1a staging retry and sample relink are idempotent, and ID replacement aborts after preflight with zero component writes', async () => {
  const composer = COMPONENT_DEFINITIONS.find(item => item.id === 'composer')
  assert.ok(composer)
  const staging = []
  let creates = 0
  let combines = 0
  const options = {
    staging,
    expectedVariantNames: composer.variants.map(variant => variant.name),
    createVariant: async variantName => ({ variantName, node: { id: `staging:${creates += 1}`, marked: true } }),
    combine: async entries => {
      combines += 1
      if (combines === 1) throw new Error('combine failed')
      return { entries }
    },
    clearStaging: async entry => { entry.node.marked = false },
  }
  await assert.rejects(() => plan.executeStagingAssembly(options), /combine failed/)
  const combined = await plan.executeStagingAssembly(options)
  assert.equal(creates, composer.variants.length)
  assert.equal(combined.entries.length, composer.variants.length)
  assert.ok(staging.every(entry => entry.node.marked === false))

  const actual = evidence()
  const search = actual.componentSets.find(item => item.id === 'search')
  const results = search.variants.find(variant => variant.name === 'State=Results')
  search.sample.mainComponentId = results.nodeId
  const recoveryInventory = { targetPage: actual.targetPage, containers: actual.containers, sets: actual.componentSets, samples: actual.componentSets.map(item => item.sample), staging: [] }
  assert.equal(plan.validateComponentMutationInventory(recoveryInventory, 'search').valid, true)
  assert.ok(plan.buildComponentRecoveryActions(recoveryInventory, 'search').some(action => action.type === 'relink-sample' && action.variantName === 'State=Empty'))

  const priorPhases = Object.fromEntries(['inspect', 'foundations', 'button', 'icon-button', 'status-symbol', 'tag'].map(id => [id.startsWith('component-') || ['inspect', 'foundations'].includes(id) ? id : `component-${id}`, { status: 'success' }]))
  const inventory = { targetPage: actual.targetPage, containers: actual.containers, sets: actual.componentSets, samples: actual.componentSets.map(item => item.sample), staging: [] }
  let preflights = 0
  const writes = []
  await assert.rejects(() => plan.executeGuardedComponentCommand({
    command: 'component-field',
    phases: priorPhases,
    preflight: async () => { preflights += 1; return inventory },
    requireContext: async () => ({ page: actual.targetPage }),
    mutate: async (_context, validatedInventory) => {
      await plan.revalidateComponentNodeRecords({
        inventory: validatedInventory,
        targetPage: actual.targetPage,
        getNodeById: async id => ({ id, name: 'replaced', type: 'FRAME', parent: null, getPluginData: () => '' }),
      })
      writes.push('component')
    },
  }), /TOCTOU/)
  assert.equal(preflights, 1)
  assert.deepEqual(writes, [])
})
