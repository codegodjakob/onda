import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as plan from '../src/plan.mjs'
import { COMPONENT_DEFINITIONS, PHASE_DEFINITIONS, PLUGIN_ORIGIN } from '../src/definitions.mjs'
import { createValidFoundationEvidence } from './foundation-fixture.mjs'
import { createValidComponentEvidence } from './component-fixture.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const PRIOR_IDS = ['button', 'icon-button', 'status-symbol', 'tag', 'field', 'search', 'select', 'composer', 'menu-item']
const TIER1B_IDS = ['nav-item', 'list-row', 'mode-toggle', 'review-bar', 'empty-state']
const ALL_IDS = [...PRIOR_IDS, ...TIER1B_IDS]

const DEFAULT_PADDING = Object.freeze({ top: 12, right: 16, bottom: 12, left: 16 })
const DEFAULT_PADDING_TOKENS = Object.freeze({ top: 'spacing/12', right: 'spacing/16', bottom: 'spacing/12', left: 'spacing/16' })

const EXPECTED = Object.freeze([
  Object.freeze({
    id: 'nav-item', name: 'Onda/Nav Item', label: 'Nav Item', labelRole: 'Label', tier: 1,
    roles: Object.freeze(['Icon', 'Label', 'Count', 'Status']), direction: 'HORIZONTAL', radius: 0, radiusToken: 'radius/none', targetHeight: 44,
    gap: 12, gapToken: 'spacing/12', padding: DEFAULT_PADDING, paddingTokens: DEFAULT_PADDING_TOKENS,
    variants: Object.freeze([
      Object.freeze(['State=Default', Object.freeze({ Icon: '▤', Label: 'Dokumente', Count: '12', Status: 'Verfügbar' }), 1, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Active', Object.freeze({ Icon: '●', Label: 'Dokumente', Count: '12', Status: 'Aktiv' }), 2, 1, 'color/inverted', 'color/on-inverted']),
      Object.freeze(['State=Hover', Object.freeze({ Icon: '→', Label: 'Dokumente', Count: '12', Status: 'Bereit zum Öffnen' }), 2, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Collapsed', Object.freeze({ Icon: '▤', Label: 'Dokumente', Count: '12', Status: 'Eingeklappt' }), 1, 0.6, 'color/surface', 'color/text-muted']),
    ]),
  }),
  Object.freeze({
    id: 'list-row', name: 'Onda/List Row', label: 'List Row', labelRole: 'Title', tier: 1,
    roles: Object.freeze(['Leading', 'Title', 'Meta', 'Status', 'Action']), direction: 'HORIZONTAL', radius: 0, radiusToken: 'radius/none', targetHeight: 52,
    gap: 12, gapToken: 'spacing/12', padding: DEFAULT_PADDING, paddingTokens: DEFAULT_PADDING_TOKENS,
    variants: Object.freeze([
      Object.freeze(['State=Default', Object.freeze({ Leading: '▤', Title: 'Projekt Nordstern', Meta: '3 Dokumente', Status: 'Zuletzt bearbeitet', Action: 'Öffnen' }), 1, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Selected', Object.freeze({ Leading: '●', Title: 'Dokument: Die leise Architektur', Meta: 'Projekt Nordstern', Status: 'Ausgewählt', Action: 'Öffnen' }), 2, 1, 'color/inverted', 'color/on-inverted']),
      Object.freeze(['State=Hover', Object.freeze({ Leading: '→', Title: 'Projekt Nordstern', Meta: '3 Dokumente', Status: 'Bereit', Action: 'Öffnen' }), 2, 1, 'color/surface', 'color/text']),
      Object.freeze(['State=Trash', Object.freeze({ Leading: '⌫', Title: 'Dokument: Alte Fassung', Meta: 'Papierkorb', Status: 'Wird gelöscht', Action: 'Endgültig löschen' }), 2, 1, 'color/inverted', 'color/on-inverted']),
      Object.freeze(['State=Error', Object.freeze({ Leading: '!', Title: 'Dokument: Die leise Architektur', Meta: 'Änderungen nicht geladen', Status: 'Fehler', Action: 'Erneut versuchen' }), 2, 1, 'color/surface', 'color/text']),
    ]),
  }),
  Object.freeze({
    id: 'mode-toggle', name: 'Onda/Mode Toggle', label: 'Mode Toggle', labelRole: 'Text Label', tier: 1,
    roles: Object.freeze(['Text Label', 'Note Label', 'Indicator']), direction: 'HORIZONTAL', radius: 4, radiusToken: 'radius/control', targetHeight: 44,
    gap: 8, gapToken: 'spacing/8', padding: DEFAULT_PADDING, paddingTokens: DEFAULT_PADDING_TOKENS,
    variants: Object.freeze([
      Object.freeze(['Mode=Text, State=Active', Object.freeze({ 'Text Label': 'Text', 'Note Label': 'Notiz', Indicator: 'Textmodus aktiv' }), 2, 1, 'color/inverted', 'color/on-inverted']),
      Object.freeze(['Mode=Notiz, State=Active', Object.freeze({ 'Text Label': 'Text', 'Note Label': 'Notiz', Indicator: 'Notizmodus aktiv' }), 2, 1, 'color/surface', 'color/text']),
      Object.freeze(['Mode=Text, State=Disabled', Object.freeze({ 'Text Label': 'Text', 'Note Label': 'Notiz', Indicator: 'Textmodus deaktiviert' }), 1, 0.45, 'color/surface', 'color/text-muted']),
    ]),
  }),
  Object.freeze({
    id: 'review-bar', name: 'Onda/Review Bar', label: 'Review Bar', labelRole: 'Message', tier: 1,
    roles: Object.freeze(['Symbol', 'Message', 'Primary Action', 'Secondary Action']), direction: 'HORIZONTAL', radius: 0, radiusToken: 'radius/none', targetHeight: 64,
    gap: 12, gapToken: 'spacing/12', padding: Object.freeze({ top: 16, right: 16, bottom: 16, left: 16 }), paddingTokens: Object.freeze({ top: 'spacing/16', right: 'spacing/16', bottom: 'spacing/16', left: 'spacing/16' }),
    variants: Object.freeze([
      Object.freeze(['Status=Open', Object.freeze({ Symbol: '◎', Message: '3 Hinweise zur Prüfung', 'Primary Action': 'Nächster Hinweis', 'Secondary Action': 'Alle anzeigen' }), 1, 1, 'color/surface', 'color/text']),
      Object.freeze(['Status=Saving', Object.freeze({ Symbol: '…', Message: 'Änderungen werden gespeichert …', 'Primary Action': 'Speichern', 'Secondary Action': 'Abbrechen' }), 2, 0.75, 'color/surface', 'color/text']),
      Object.freeze(['Status=Saved', Object.freeze({ Symbol: '✓', Message: 'Änderungen gespeichert', 'Primary Action': 'Weiter prüfen', 'Secondary Action': 'Rückgängig' }), 1, 1, 'color/inverted', 'color/on-inverted']),
      Object.freeze(['Status=Error', Object.freeze({ Symbol: '!', Message: 'Speichern fehlgeschlagen', 'Primary Action': 'Erneut versuchen', 'Secondary Action': 'Exportieren' }), 2, 1, 'color/inverted', 'color/on-inverted']),
      Object.freeze(['Status=Quiet', Object.freeze({ Symbol: '—', Message: 'Anmerkungen sind ruhig gestellt', 'Primary Action': 'Anmerkungen zeigen', 'Secondary Action': 'Schließen' }), 1, 0.6, 'color/surface', 'color/text-muted']),
    ]),
  }),
  Object.freeze({
    id: 'empty-state', name: 'Onda/Empty State', label: 'Empty State', labelRole: 'Title', tier: 1,
    roles: Object.freeze(['Symbol', 'Title', 'Description', 'Action']), direction: 'VERTICAL', radius: 6, radiusToken: 'radius/static', targetHeight: 160,
    gap: 16, gapToken: 'spacing/16', padding: Object.freeze({ top: 32, right: 32, bottom: 32, left: 32 }), paddingTokens: Object.freeze({ top: 'spacing/32', right: 'spacing/32', bottom: 'spacing/32', left: 'spacing/32' }),
    variants: Object.freeze([
      Object.freeze(['Context=Library', Object.freeze({ Symbol: '+', Title: 'Noch keine Projekte', Description: 'Erstelle ein Projekt, um Dokumente zu organisieren.', Action: 'Projekt erstellen' }), 1, 1, 'color/surface', 'color/text']),
      Object.freeze(['Context=No Active Annotation', Object.freeze({ Symbol: '○', Title: 'Keine aktive Anmerkung', Description: 'Wähle eine Anmerkung im Text aus, um sie zu prüfen.', Action: 'Anmerkungen anzeigen' }), 1, 0.8, 'color/surface', 'color/text-muted']),
      Object.freeze(['Context=Recoverable Error', Object.freeze({ Symbol: '!', Title: 'Inhalt konnte nicht geladen werden', Description: 'Deine Eingabe bleibt erhalten. Versuche es erneut.', Action: 'Erneut versuchen' }), 2, 1, 'color/inverted', 'color/on-inverted']),
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

function inventory(actual = evidence()) {
  return {
    targetPage: actual.targetPage,
    containers: actual.containers,
    sets: actual.componentSets,
    samples: actual.componentSets.map(item => item.sample),
    staging: [],
  }
}

function priorPhases(componentId) {
  const index = ALL_IDS.indexOf(componentId)
  return Object.fromEntries([
    ['inspect', { status: 'success' }],
    ['foundations', { status: 'success' }],
    ...ALL_IDS.slice(0, index).map(id => [`component-${id}`, { status: 'success' }]),
  ])
}

function expectedAxes(definition) {
  const axes = new Map()
  for (const variant of definition.variants) {
    for (const part of variant.name.split(', ')) {
      const [name, value] = part.split('=')
      if (!axes.has(name)) axes.set(name, [])
      if (!axes.get(name).includes(value)) axes.get(name).push(value)
    }
  }
  return axes
}

test('frozen contract and workflow append exactly five Tier1b foundation sets and expose fourteen ordered component commands', () => {
  assert.deepEqual(COMPONENT_DEFINITIONS.map(item => item.id), ALL_IDS)
  const actual = COMPONENT_DEFINITIONS.slice(-5).map(definition => ({
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
  }))
  assert.deepEqual(actual, EXPECTED)
  for (const definition of COMPONENT_DEFINITIONS.slice(-5)) {
    assert.equal(Object.isFrozen(definition), true)
    assert.ok(definition.roles.every(role => role.type === 'TEXT'))
    assert.ok(definition.variants.every(variant => Object.isFrozen(variant) && Object.isFrozen(variant.copy) && variant.surfaceToken.startsWith('color/') && variant.textToken.startsWith('color/')))
  }
  const ui = readFileSync(resolve(ROOT, 'ui.html'), 'utf8')
  const buttons = [...ui.matchAll(/data-command="component-([^"]+)"/g)].map(match => match[1])
  const phase = PHASE_DEFINITIONS.find(item => item.id === 'components')
  const orderedCommands = ui.slice(ui.indexOf('const orderedCommands'), ui.indexOf('const completed'))
  assert.deepEqual(buttons, ALL_IDS)
  assert.deepEqual(phase.commands.map(command => command.componentId), ALL_IDS)
  assert.ok(orderedCommands.indexOf("'component-empty-state'") < orderedCommands.indexOf("'core-views'"))
  for (const forbidden of ['annotation-card', 'agent-panel', 'dialog', 'modal', 'screen']) assert.doesNotMatch(ui, new RegExp(`component-${forbidden}`))
})

test('fourteen-set strict evidence enforces exact properties, bindings, samples, and independent corruption rejection for every Tier1b set', () => {
  const actual = evidence()
  assert.equal(actual.componentSets.length, 14)
  assert.deepEqual(plan.validateComponentEvidence(actual), { valid: true, errors: [] })
  for (const id of TIER1B_IDS) {
    const definition = COMPONENT_DEFINITIONS.find(item => item.id === id)
    const set = actual.componentSets.find(item => item.id === id)
    const textProperties = set.componentProperties.filter(property => property.type === 'TEXT')
    assert.deepEqual(textProperties.map(property => property.name), ['Label'])
    assert.equal(textProperties[0].defaultValue, definition.variants[0].copy[definition.labelRole])
    assert.equal(set.sampleCount, 1)
    assert.equal(set.sample.mainComponentId, set.variants[0].nodeId)
    const axes = expectedAxes(definition)
    const generated = set.componentProperties.filter(property => property.type === 'VARIANT')
    assert.deepEqual(generated.map(property => property.name), [...axes.keys()])
    for (const property of generated) assert.deepEqual(property.variantOptions, axes.get(property.name))
    for (const variant of set.variants) {
      assert.equal(variant.layoutMode, definition.direction)
      assert.equal(variant.effects.length, 0)
      assert.deepEqual(variant.fieldVariableIds.itemSpacing.length, 1)
      for (const field of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) assert.equal(variant.fieldVariableIds[field].length, 1)
    }
  }
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  assert.match(runtime, /\['radiusStatic', 'radius\/static', 'Onda · Dimension'\]/)
  assert.match(runtime, /'radius\/static': variables\.radiusStatic/)
  assert.match(runtime, /\['spacing32', 'spacing\/32', 'Onda · Dimension'\]/)
  assert.match(runtime, /'spacing\/32': variables\.spacing32/)

  const corruptions = new Map([
    ['nav-item', set => { set.variants[3].roles.find(role => role.name === 'Role/Status').characters = 'Aktiv' }],
    ['list-row', set => { set.variants[3].fieldVariableIds.itemSpacing.push('variable:extra') }],
    ['mode-toggle', set => { set.variants[1].cornerRadius = 0 }],
    ['review-bar', set => { set.variants[3].effects.push({ type: 'DROP_SHADOW' }) }],
    ['empty-state', set => { set.variants[0].height = 159; set.variants[0].dimensionValues.minHeight = 159 }],
  ])
  for (const [id, corrupt] of corruptions) {
    const candidate = evidence()
    const set = candidate.componentSets.find(item => item.id === id)
    assert.ok(set, `${id} fixture missing`)
    corrupt(set)
    assert.equal(plan.validateComponentEvidence(candidate).valid, false, `${id} corruption must fail`)
  }
  for (const mutate of [
    set => set.componentProperties.push({ key: 'Visible#extra', name: 'Visible', type: 'BOOLEAN', defaultValue: true }),
    set => { set.componentProperties.find(property => property.type === 'VARIANT').variantOptions = ['Wrong'] },
    set => { set.sample.mainComponentId = 'component:foreign' },
  ]) {
    const candidate = evidence()
    mutate(candidate.componentSets.find(item => item.id === 'review-bar'))
    assert.equal(plan.validateComponentEvidence(candidate).valid, false)
  }
})

test('every Tier1b inventory accepts exact and safe partial states, rejects ancestry drift, and recovers variants, roles, Label, sample, and default link', () => {
  for (const id of TIER1B_IDS) {
    const actual = evidence()
    const current = inventory(actual)
    const set = current.sets.find(item => item.id === id)
    assert.equal(plan.validateComponentMutationInventory(current, id).valid, true)

    set.variants.pop()
    set.variants[0].roles.pop()
    set.componentProperties = set.componentProperties.filter(property => property.type === 'VARIANT')
    current.samples = current.samples.filter(sample => sample.name !== set.sample.name)
    assert.equal(plan.validateComponentMutationInventory(current, id).valid, true)
    const actions = plan.buildComponentRecoveryActions(current, id)
    for (const type of ['variant', 'role', 'property', 'sample']) assert.ok(actions.some(action => action.type === type), `${id} missing ${type} recovery`)

    const wrongAncestry = structuredClone(inventory())
    wrongAncestry.sets.find(item => item.id === id).containerParentType = 'FRAME'
    assert.equal(plan.validateComponentMutationInventory(wrongAncestry, id).valid, false)
  }

  const relink = inventory()
  const mode = relink.sets.find(item => item.id === 'mode-toggle')
  relink.samples.find(sample => sample.name === mode.sample.name).mainComponentId = mode.variants[1].nodeId
  assert.equal(plan.validateComponentMutationInventory(relink, 'mode-toggle').valid, true)
  assert.ok(plan.buildComponentRecoveryActions(relink, 'mode-toggle').some(action => action.type === 'relink-sample' && action.variantName === 'Mode=Text, State=Active'))
})

test('Tier1b staging retries reuse exact variants and subsequent exact inventories are idempotent', async () => {
  for (const id of TIER1B_IDS) {
    const definition = COMPONENT_DEFINITIONS.find(item => item.id === id)
    const staging = []
    let creates = 0
    let combines = 0
    const options = {
      staging,
      expectedVariantNames: definition.variants.map(variant => variant.name),
      createVariant: async variantName => ({ variantName, node: { id: `staging:${id}:${creates += 1}`, stagingComponent: id, stagingVariant: variantName } }),
      combine: async entries => {
        combines += 1
        if (combines === 1) throw new Error(`combine failed: ${id}`)
        return { entries }
      },
      clearStaging: async entry => { entry.node.stagingComponent = ''; entry.node.stagingVariant = '' },
    }
    await assert.rejects(() => plan.executeStagingAssembly(options), /combine failed/)
    const combined = await plan.executeStagingAssembly(options)
    assert.equal(creates, definition.variants.length)
    assert.equal(combined.entries.length, definition.variants.length)
    assert.ok(staging.every(entry => entry.node.stagingComponent === '' && entry.node.stagingVariant === ''))

    const exact = inventory()
    assert.deepEqual(plan.buildComponentRecoveryActions(exact, id), [])
  }
})

test('recursive Tier1b lookalikes retain real ancestry and post-preflight duplicate races abort after context with zero component writes', async () => {
  const nested = { id: 'set:nested', name: 'Onda/Empty State', type: 'COMPONENT_SET', children: [], getPluginData: key => key === 'ondaOrigin' ? PLUGIN_ORIGIN : '' }
  const foreign = { id: 'foreign', name: 'Foreign', type: 'FRAME', children: [nested], getPluginData: () => '' }
  const page = { id: 'page:1', name: 'Page 1', type: 'PAGE', children: [foreign], getPluginData: () => '' }
  nested.parent = foreign
  foreign.parent = page
  const locations = plan.collectComponentInventoryLocations(page)
  assert.deepEqual(locations.candidates.map(candidate => ({ nodeId: candidate.nodeId, parentId: candidate.parentId, parentType: candidate.parentType, containerId: candidate.containerId })), [
    { nodeId: 'set:nested', parentId: 'foreign', parentType: 'FRAME', containerId: null },
  ])

  for (const id of TIER1B_IDS) {
    const before = inventory()
    const current = structuredClone(before)
    const set = current.sets.find(item => item.id === id)
    current.sets.push({ ...structuredClone(set), nodeId: `${set.nodeId}:duplicate` })
    const log = []
    await assert.rejects(() => plan.executeGuardedComponentCommand({
      command: `component-${id}`,
      phases: priorPhases(id),
      preflight: async () => before,
      requireContext: async () => { log.push('context'); return { page: before.targetPage } },
      collectCurrentInventory: async () => current,
      mutate: async () => { log.push('component') },
    }), /TOCTOU/)
    assert.deepEqual(log, ['context'], `${id} race must stop before component write`)
  }
})

test('equal Tier1b inventories still reject known-ID replacement through async dynamic-page revalidation before component writes', async () => {
  const current = inventory()
  const review = current.sets.find(item => item.id === 'review-bar')
  const writes = []
  await assert.rejects(() => plan.executeGuardedComponentCommand({
    command: 'component-review-bar',
    phases: priorPhases('review-bar'),
    preflight: async () => current,
    requireContext: async () => ({ page: current.targetPage }),
    collectCurrentInventory: async () => current,
    mutate: async (context, validatedInventory) => {
      await plan.revalidateComponentNodeRecords({
        inventory: validatedInventory,
        targetPage: context.page,
        getNodeById: async id => ({
          id,
          name: id === review.nodeId ? review.name : 'replaced',
          type: id === review.nodeId ? 'FRAME' : 'FRAME',
          parent: null,
          getPluginData: () => '',
        }),
      })
      writes.push('component')
    },
  }), /TOCTOU/)
  assert.deepEqual(writes, [])
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  const planSource = readFileSync(resolve(ROOT, 'src/plan.mjs'), 'utf8')
  assert.match(runtime, /readMainComponentIdentity/)
  assert.match(planSource, /getMainComponentAsync/)
  assert.doesNotMatch(`${runtime}\n${planSource}`, /\.mainComponent\b/)
  assert.match(runtime, /getNodeByIdAsync/)
})
