import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as plan from '../src/plan.mjs'
import { COMPONENT_DEFINITIONS, PHASE_DEFINITIONS, PLUGIN_ORIGIN } from '../src/definitions.mjs'
import { createValidFoundationEvidence } from './foundation-fixture.mjs'
import { createValidComponentEvidence } from './component-fixture.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const PRIOR_IDS = [
  'button', 'icon-button', 'status-symbol', 'tag', 'field', 'search', 'select', 'composer', 'menu-item',
  'nav-item', 'list-row', 'mode-toggle', 'review-bar', 'empty-state',
  'annotation-anchor', 'annotation-form', 'annotation-card', 'dialog-action', 'dialog',
]
const FINAL_IDS = ['aura', 'agent-message', 'decision-card', 'evidence-card', 'source-card', 'import-panel', 'reader-panel', 'research-card']
const ALL_IDS = [...PRIOR_IDS, ...FINAL_IDS]
const CARD_PADDING = { top: 16, right: 16, bottom: 16, left: 16 }
const CARD_PADDING_TOKENS = { top: 'spacing/16', right: 'spacing/16', bottom: 'spacing/16', left: 'spacing/16' }

const EXPECTED = Object.freeze([
  Object.freeze({
    id: 'aura', name: 'Onda/Aura', label: 'Aura', labelRole: 'Label',
    roles: [['Orb', 'ELLIPSE'], ['Symbol', 'TEXT'], ['Label', 'TEXT']], direction: 'HORIZONTAL', targetHeight: 44,
    radius: 0, radiusToken: 'radius/none', gap: 8, gapToken: 'spacing/8',
    padding: { top: 12, right: 16, bottom: 12, left: 16 },
    paddingTokens: { top: 'spacing/12', right: 'spacing/16', bottom: 'spacing/12', left: 'spacing/16' },
    variants: [
      ['State=Idle', { Symbol: '○', Label: 'Aura ist bereit' }, 1, 1, 'color/surface', 'color/text'],
      ['State=Working', { Symbol: '…', Label: 'Aura prüft den Auftrag' }, 2, 0.75, 'color/surface', 'color/text'],
      ['State=Complete', { Symbol: '✓', Label: 'Aura hat den Schritt abgeschlossen' }, 1, 1, 'color/inverted', 'color/on-inverted'],
      ['State=Error', { Symbol: '!', Label: 'Aura konnte den Schritt nicht abschließen' }, 2, 1, 'color/inverted', 'color/on-inverted'],
    ],
  }),
  Object.freeze({
    id: 'agent-message', name: 'Onda/Agent Message', label: 'Agent Message', labelRole: 'Body',
    roles: [['Avatar', 'ELLIPSE'], ['Author', 'TEXT'], ['Body', 'TEXT'], ['Meta', 'TEXT'], ['Status', 'TEXT']], direction: 'VERTICAL', targetHeight: 120,
    radius: 6, radiusToken: 'radius/static', gap: 12, gapToken: 'spacing/12', padding: CARD_PADDING, paddingTokens: CARD_PADDING_TOKENS,
    variants: [
      ['Role=User', { Author: 'Du', Body: 'Prüfe die offenen Quellenhinweise.', Meta: 'Gerade gesendet', Status: 'Gesendet' }, 1, 1, 'color/surface', 'color/text'],
      ['Role=Agent', { Author: 'Onda Agent', Body: 'Drei Quellenhinweise warten auf deine Prüfung.', Meta: 'Antwort bereit', Status: 'Zur Prüfung' }, 1, 1, 'color/inverted', 'color/on-inverted'],
      ['State=Streaming', { Author: 'Onda Agent', Body: 'Antwort wird schrittweise erstellt …', Meta: 'In Bearbeitung', Status: 'Wird geladen' }, 2, 0.75, 'color/surface', 'color/text'],
      ['State=Error', { Author: 'Onda Agent', Body: 'Antwort konnte nicht geladen werden. Deine Anfrage bleibt erhalten.', Meta: 'Verbindung unterbrochen', Status: 'Erneut versuchen' }, 2, 1, 'color/inverted', 'color/on-inverted'],
    ],
  }),
  Object.freeze({
    id: 'decision-card', name: 'Onda/Decision Card', label: 'Decision Card', labelRole: 'Decision',
    roles: [['Symbol', 'TEXT'], ['Decision', 'TEXT'], ['Rationale', 'TEXT'], ['Actor', 'TEXT'], ['Time', 'TEXT']], direction: 'VERTICAL', targetHeight: 140,
    radius: 6, radiusToken: 'radius/static', gap: 12, gapToken: 'spacing/12', padding: CARD_PADDING, paddingTokens: CARD_PADDING_TOKENS,
    variants: [
      ['Status=Pending', { Symbol: '?', Decision: 'Quellenhinweis prüfen', Rationale: 'Die Aussage ist noch nicht belegt.', Actor: 'Noch nicht entschieden', Time: 'Jetzt' }, 1, 1, 'color/surface', 'color/text'],
      ['Status=Accepted', { Symbol: '✓', Decision: 'Quellenhinweis übernehmen', Rationale: 'Der Beleg passt zur markierten Aussage.', Actor: 'Von dir bestätigt', Time: 'Gerade eben' }, 1, 1, 'color/inverted', 'color/on-inverted'],
      ['Status=Rejected', { Symbol: '×', Decision: 'Quellenhinweis ablehnen', Rationale: 'Der Beleg stützt die Aussage nicht ausreichend.', Actor: 'Von dir abgelehnt', Time: 'Gerade eben' }, 2, 0.65, 'color/surface', 'color/text-muted'],
      ['Status=Overridden', { Symbol: '↺', Decision: 'Entscheidung überschrieben', Rationale: 'Eine neuere manuelle Entscheidung gilt.', Actor: 'Von dir geändert', Time: 'Soeben' }, 2, 1, 'color/inverted', 'color/on-inverted'],
    ],
  }),
  Object.freeze({
    id: 'evidence-card', name: 'Onda/Evidence Card', label: 'Evidence Card', labelRole: 'Claim',
    roles: [['Symbol', 'TEXT'], ['Claim', 'TEXT'], ['Source', 'TEXT'], ['Confidence', 'TEXT'], ['Action', 'TEXT']], direction: 'VERTICAL', targetHeight: 140,
    radius: 6, radiusToken: 'radius/static', gap: 12, gapToken: 'spacing/12', padding: CARD_PADDING, paddingTokens: CARD_PADDING_TOKENS,
    variants: [
      ['Status=Unverified', { Symbol: '?', Claim: 'Aussage ohne geprüften Beleg', Source: 'Quelle noch nicht geprüft', Confidence: 'Einschätzung: offen', Action: 'Quelle prüfen' }, 1, 1, 'color/surface', 'color/text'],
      ['Status=Verified', { Symbol: '✓', Claim: 'Aussage durch Quelle gestützt', Source: 'Fundstelle geprüft', Confidence: 'Einschätzung: hoch', Action: 'Quelle öffnen' }, 1, 1, 'color/inverted', 'color/on-inverted'],
      ['Status=Conflict', { Symbol: '!', Claim: 'Quellen widersprechen sich', Source: 'Zwei abweichende Fundstellen', Confidence: 'Einschätzung: unklar', Action: 'Konflikt prüfen' }, 2, 1, 'color/inverted', 'color/on-inverted'],
      ['Status=Missing', { Symbol: '—', Claim: 'Kein Beleg verknüpft', Source: 'Quelle fehlt', Confidence: 'Nicht bewertbar', Action: 'Quelle hinzufügen' }, 1, 0.6, 'color/surface', 'color/text-muted'],
    ],
  }),
  Object.freeze({
    id: 'source-card', name: 'Onda/Source Card', label: 'Source Card', labelRole: 'Title',
    roles: [['Type', 'TEXT'], ['Title', 'TEXT'], ['Meta', 'TEXT'], ['Status', 'TEXT'], ['Action', 'TEXT']], direction: 'VERTICAL', targetHeight: 120,
    radius: 6, radiusToken: 'radius/static', gap: 12, gapToken: 'spacing/12', padding: CARD_PADDING, paddingTokens: CARD_PADDING_TOKENS,
    variants: [
      ['Status=Ready', { Type: 'Webquelle', Title: 'Studie zur Schreibforschung', Meta: 'Quelle bereit zur Prüfung', Status: 'Bereit', Action: 'Quelle öffnen' }, 1, 1, 'color/surface', 'color/text'],
      ['Status=Loading', { Type: 'Webquelle', Title: 'Quelle wird geladen', Meta: 'Metadaten werden angefragt', Status: 'Lädt', Action: 'Abbrechen' }, 2, 0.75, 'color/surface', 'color/text'],
      ['Status=Invalid', { Type: 'Ungültige Quelle', Title: 'Quelle kann nicht gelesen werden', Meta: 'Adresse oder Format prüfen', Status: 'Ungültig', Action: 'Andere Quelle wählen' }, 2, 1, 'color/inverted', 'color/on-inverted'],
      ['Status=Offline', { Type: 'Webquelle', Title: 'Quelle derzeit nicht erreichbar', Meta: 'Verbindung ist offline', Status: 'Offline', Action: 'Erneut versuchen' }, 1, 0.6, 'color/surface', 'color/text-muted'],
    ],
  }),
  Object.freeze({
    id: 'import-panel', name: 'Onda/Import Panel', label: 'Import Panel', labelRole: 'Title',
    roles: [['Title', 'TEXT'], ['File', 'TEXT'], ['Progress', 'TEXT'], ['Status', 'TEXT'], ['Action', 'TEXT']], direction: 'VERTICAL', targetHeight: 160,
    radius: 6, radiusToken: 'radius/static', gap: 12, gapToken: 'spacing/12', padding: CARD_PADDING, paddingTokens: CARD_PADDING_TOKENS,
    variants: [
      ['State=Empty', { Title: 'Quelle importieren', File: 'Noch keine Datei gewählt', Progress: '0 %', Status: 'Bereit', Action: 'Datei wählen' }, 1, 1, 'color/surface', 'color/text'],
      ['State=Validating', { Title: 'Import wird geprüft', File: 'recherche.pdf', Progress: 'Prüfung läuft …', Status: 'Datei wird validiert', Action: 'Abbrechen' }, 2, 0.75, 'color/surface', 'color/text'],
      ['State=Ready', { Title: 'Import bereit', File: 'recherche.pdf', Progress: '100 %', Status: 'Bereit zum Übernehmen', Action: 'Import übernehmen' }, 1, 1, 'color/inverted', 'color/on-inverted'],
      ['State=Error', { Title: 'Import fehlgeschlagen', File: 'recherche.pdf', Progress: 'Prüfung abgebrochen', Status: 'Datei blieb unverändert', Action: 'Erneut versuchen' }, 2, 1, 'color/inverted', 'color/on-inverted'],
    ],
  }),
  Object.freeze({
    id: 'reader-panel', name: 'Onda/Reader Panel', label: 'Reader Panel', labelRole: 'Title',
    roles: [['Title', 'TEXT'], ['Location', 'TEXT'], ['Excerpt', 'TEXT'], ['Status', 'TEXT'], ['Action', 'TEXT']], direction: 'VERTICAL', targetHeight: 180,
    radius: 6, radiusToken: 'radius/static', gap: 12, gapToken: 'spacing/12', padding: CARD_PADDING, paddingTokens: CARD_PADDING_TOKENS,
    variants: [
      ['State=Reading', { Title: 'Quellenleser', Location: 'Seite 12', Excerpt: 'Die markierte Passage wird hier gelesen.', Status: 'Leseansicht', Action: 'Fundstelle markieren' }, 1, 1, 'color/surface', 'color/text'],
      ['State=Highlight', { Title: 'Markierte Fundstelle', Location: 'Seite 12 · Absatz 3', Excerpt: 'Diese Passage ist für die Aussage relevant.', Status: 'Zur Prüfung markiert', Action: 'Mit Anmerkung verknüpfen' }, 1, 1, 'color/inverted', 'color/on-inverted'],
      ['State=Unavailable', { Title: 'Quelle nicht verfügbar', Location: 'Position gespeichert', Excerpt: 'Inhalt konnte nicht geladen werden.', Status: 'Offline oder Zugriff fehlt', Action: 'Erneut versuchen' }, 2, 1, 'color/inverted', 'color/on-inverted'],
    ],
  }),
  Object.freeze({
    id: 'research-card', name: 'Onda/Research Card', label: 'Research Card', labelRole: 'Query',
    roles: [['Query', 'TEXT'], ['Progress', 'TEXT'], ['Sources', 'TEXT'], ['Status', 'TEXT'], ['Action', 'TEXT']], direction: 'VERTICAL', targetHeight: 140,
    radius: 6, radiusToken: 'radius/static', gap: 12, gapToken: 'spacing/12', padding: CARD_PADDING, paddingTokens: CARD_PADDING_TOKENS,
    variants: [
      ['Status=Planned', { Query: 'Wirkung von Schreibassistenz', Progress: 'Noch nicht gestartet', Sources: '0 Quellen', Status: 'Geplant', Action: 'Recherche starten' }, 1, 1, 'color/surface', 'color/text'],
      ['Status=Running', { Query: 'Wirkung von Schreibassistenz', Progress: '2 von 5 Schritten', Sources: '3 Quellen vorgemerkt', Status: 'Läuft', Action: 'Pausieren' }, 2, 0.75, 'color/surface', 'color/text'],
      ['Status=Paused', { Query: 'Wirkung von Schreibassistenz', Progress: '2 von 5 Schritten', Sources: '3 Quellen vorgemerkt', Status: 'Pausiert', Action: 'Fortsetzen' }, 1, 0.65, 'color/surface', 'color/text-muted'],
      ['Status=Ready', { Query: 'Wirkung von Schreibassistenz', Progress: '5 von 5 Schritten', Sources: '6 Quellen zur Prüfung', Status: 'Bereit zur Prüfung', Action: 'Ergebnisse öffnen' }, 1, 1, 'color/inverted', 'color/on-inverted'],
      ['Status=Error', { Query: 'Wirkung von Schreibassistenz', Progress: 'Recherche unterbrochen', Sources: 'Quellenstand nicht aktualisiert', Status: 'Verbindung fehlgeschlagen', Action: 'Erneut versuchen' }, 2, 1, 'color/inverted', 'color/on-inverted'],
    ],
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
  return { targetPage: actual.targetPage, containers: actual.containers, sets: actual.componentSets, samples: actual.componentSets.map(set => set.sample), staging: [] }
}

function priorPhases(id) {
  return Object.fromEntries([
    ['inspect', { status: 'success' }],
    ['foundations', { status: 'success' }],
    ...ALL_IDS.slice(0, ALL_IDS.indexOf(id)).map(componentId => [`component-${componentId}`, { status: 'success' }]),
  ])
}

test('contract and workflow append eight exact final Tier2 agent/source composites after nineteen sets and expose twenty-seven commands', () => {
  assert.equal(EXPECTED.reduce((sum, definition) => sum + definition.variants.length, 0), 32)
  assert.deepEqual(COMPONENT_DEFINITIONS.map(definition => definition.id), ALL_IDS)
  assert.deepEqual(COMPONENT_DEFINITIONS.slice(-8).map(definition => ({
    id: definition.id,
    name: definition.name,
    label: definition.label,
    labelRole: definition.labelRole,
    tier: definition.tier,
    roles: definition.roles.map(role => [role.name, role.type]),
    direction: definition.direction,
    targetHeight: definition.targetHeight,
    radius: definition.radius,
    radiusToken: definition.radiusToken,
    gap: definition.gap,
    gapToken: definition.gapToken,
    padding: definition.padding,
    paddingTokens: definition.paddingTokens,
    effectStyleName: definition.effectStyleName,
    variants: definition.variants.map(variant => [variant.name, variant.copy, variant.strokeWeight, variant.opacity, variant.surfaceToken, variant.textToken]),
  })), EXPECTED.map(definition => ({ ...definition, tier: 2, effectStyleName: null })))
  const allCopy = EXPECTED.flatMap(definition => definition.variants.flatMap(([, copy]) => Object.values(copy))).join('\n')
  assert.doesNotMatch(allCopy, /automatisch (?:geändert|übernommen)|garantiert|vollständig recherchiert/i)
  assert.match(allCopy, /Erneut versuchen/)
  assert.match(allCopy, /Offline/)
  const ui = readFileSync(resolve(ROOT, 'ui.html'), 'utf8')
  const buttons = [...ui.matchAll(/data-command="component-([^"]+)"/g)].map(match => match[1])
  assert.deepEqual(buttons, ALL_IDS)
  assert.deepEqual(PHASE_DEFINITIONS.find(phase => phase.id === 'components').commands.map(command => command.componentId), ALL_IDS)
  const orderedCommands = ui.slice(ui.indexOf('const orderedCommands'), ui.indexOf('const completed'))
  assert.ok(orderedCommands.indexOf("'component-research-card'") < orderedCommands.indexOf("'core-views'"))
  for (const forbidden of ['agent-panel', 'source-panel', 'research-panel']) assert.doesNotMatch(ui, new RegExp(`component-${forbidden}`))
})

test('strict twenty-seven-set evidence enforces exact copy, properties, bindings, geometry, and one independent corruption per final Tier2 set', () => {
  const actual = evidence()
  assert.equal(actual.componentSets.length, 27)
  assert.deepEqual(plan.validateComponentEvidence(actual), { valid: true, errors: [] })
  for (const expected of EXPECTED) {
    const definition = COMPONENT_DEFINITIONS.find(item => item.id === expected.id)
    const set = actual.componentSets.find(item => item.id === expected.id)
    assert.deepEqual(set.componentProperties.filter(property => property.type === 'TEXT').map(property => property.name), ['Label'])
    assert.equal(set.componentProperties.find(property => property.name === 'Label').defaultValue, definition.variants[0].copy[definition.labelRole])
    assert.equal(set.sampleCount, 1)
    assert.equal(set.sample.mainComponentId, set.variants[0].nodeId)
    for (const variant of set.variants) {
      assert.equal(variant.layoutMode, definition.direction)
      assert.equal(variant.height, definition.targetHeight)
      assert.equal(variant.cornerRadius, definition.radius)
      assert.equal(variant.effectStyleId, null)
      assert.deepEqual(variant.effects, [])
    }
  }
  for (const [id, corrupt] of new Map([
    ['aura', set => { set.variants[0].roles.find(role => role.name === 'Role/Orb').type = 'RECTANGLE' }],
    ['agent-message', set => { set.variants[0].roles.find(role => role.name === 'Role/Avatar').fieldVariableIds.maxWidth.push('variable:wrong') }],
    ['decision-card', set => { set.variants[0].roles.find(role => role.name === 'Role/Decision').characters = 'Generische Entscheidung' }],
    ['evidence-card', set => { set.variants[0].fills[0].variableIds = ['variable:wrong'] }],
    ['source-card', set => { set.variants[0].effects.push({ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0 } }) }],
    ['import-panel', set => { set.componentProperties.push({ key: 'Extra#property', name: 'Extra', type: 'TEXT', defaultValue: 'Extra' }) }],
    ['reader-panel', set => { set.sample.mainComponentId = 'component:foreign' }],
    ['research-card', set => { set.variants.pop() }],
  ])) {
    const candidate = evidence()
    corrupt(candidate.componentSets.find(set => set.id === id))
    assert.equal(plan.validateComponentEvidence(candidate).valid, false, `${id} corruption must fail`)
  }
})

test('Aura Orb and Agent Avatar remain exact bound circles while all final Tier2 variants stay flat and overlay consumer cardinality stays ten', () => {
  assert.equal(COMPONENT_DEFINITIONS.filter(definition => FINAL_IDS.includes(definition.id)).length, 8)
  const actual = evidence()
  const circleId = actual.foundation.variables.find(variable => variable.collectionName === 'Onda · Dimension' && variable.name === 'radius/circle').id
  for (const [setId, roleName] of [['aura', 'Orb'], ['agent-message', 'Avatar']]) {
    const set = actual.componentSets.find(item => item.id === setId)
    for (const variant of set.variants) {
      const role = variant.roles.find(item => item.name === `Role/${roleName}`)
      assert.equal(role.type, 'ELLIPSE')
      assert.equal(role.width, 16)
      assert.equal(role.height, 16)
      assert.deepEqual(role.fieldVariableIds, { maxWidth: [circleId], maxHeight: [circleId] })
    }
  }
  for (const id of FINAL_IDS) {
    const set = actual.componentSets.find(item => item.id === id)
    assert.ok(set.variants.every(variant => variant.effectStyleId === null && variant.effects.length === 0))
    const corrupted = evidence()
    corrupted.componentSets.find(item => item.id === id).variants[0].effectStyleId = 'effect-style:overlay'
    assert.equal(plan.validateComponentEvidence(corrupted).valid, false, `${id} effect style must fail`)
  }
  assert.equal(actual.foundation.effectConsumers.length, 10)
  assert.deepEqual(plan.validateFoundationEvidence(actual.foundation), { valid: true, errors: [] })
  assert.ok(actual.foundation.effectConsumers.every(consumer => !FINAL_IDS.includes(consumer.componentId)))
})

test('all final Tier2 exact and safe partial inventories recover idempotently and staging retry reuses exact owned variants', async () => {
  for (const id of FINAL_IDS) {
    const current = inventory()
    const set = current.sets.find(item => item.id === id)
    assert.ok(set, `${id} fixture missing`)
    assert.equal(plan.validateComponentMutationInventory(current, id).valid, true)
    set.variants.pop()
    set.variants[0].roles.pop()
    set.componentProperties = set.componentProperties.filter(property => property.type === 'VARIANT')
    current.samples = current.samples.filter(sample => sample.name !== set.sample.name)
    assert.equal(plan.validateComponentMutationInventory(current, id).valid, true)
    const actions = plan.buildComponentRecoveryActions(current, id)
    for (const type of ['variant', 'role', 'property', 'sample']) assert.ok(actions.some(action => action.type === type), `${id}: ${type}`)
    assert.deepEqual(plan.buildComponentRecoveryActions(inventory(), id), [])
  }

  const definition = COMPONENT_DEFINITIONS.find(item => item.id === 'research-card')
  const staging = []
  let creates = 0
  let combines = 0
  const options = {
    staging,
    expectedVariantNames: definition.variants.map(variant => variant.name),
    createVariant: async variantName => ({ variantName, node: { id: `stage:${creates += 1}`, stagingComponent: 'research-card', stagingVariant: variantName } }),
    combine: async entries => { if (combines += 1, combines === 1) throw new Error('combine failed'); return { entries } },
    clearStaging: async entry => { entry.node.stagingComponent = ''; entry.node.stagingVariant = '' },
  }
  await assert.rejects(() => plan.executeStagingAssembly(options), /combine failed/)
  await plan.executeStagingAssembly(options)
  assert.equal(creates, definition.variants.length)
})

test('final Tier2 ancestry drift, recursive duplicates, current-inventory races, and known-ID replacement abort before component writes', async () => {
  for (const id of FINAL_IDS) {
    const exact = inventory()
    const wrongAncestry = structuredClone(exact)
    const wrongSet = wrongAncestry.sets.find(set => set.id === id)
    assert.ok(wrongSet, `${id} fixture missing`)
    wrongSet.containerParentId = 'page:foreign'
    assert.equal(plan.validateComponentMutationInventory(wrongAncestry, id).valid, false)

    const current = structuredClone(exact)
    const set = current.sets.find(item => item.id === id)
    current.sets.push({ ...structuredClone(set), nodeId: `${set.nodeId}:nested-duplicate`, parentId: 'section:nested' })
    const log = []
    await assert.rejects(() => plan.executeGuardedComponentCommand({
      command: `component-${id}`,
      phases: priorPhases(id),
      preflight: async () => exact,
      requireContext: async () => { log.push('context'); return { page: exact.targetPage } },
      collectCurrentInventory: async () => current,
      mutate: async () => { log.push('component') },
    }), /TOCTOU/)
    assert.deepEqual(log, ['context'])
  }

  const before = inventory()
  const current = structuredClone(before)
  current.sets.find(set => set.id === 'agent-message').variants[0].nodeId = 'component:agent-message:replacement'
  const writes = []
  await assert.rejects(() => plan.executeGuardedComponentCommand({
    command: 'component-agent-message', phases: priorPhases('agent-message'),
    preflight: async () => before,
    requireContext: async () => ({ page: before.targetPage }),
    collectCurrentInventory: async () => current,
    mutate: async () => { writes.push('component') },
  }), /TOCTOU/)
  assert.deepEqual(writes, [])
})

test('generic runtime keeps final Tier2 label roles, ellipse creation, circle binding, and sample identity on dynamic-page async APIs', async () => {
  assert.equal(COMPONENT_DEFINITIONS.filter(definition => FINAL_IDS.includes(definition.id)).length, 8)
  const labelRoles = Object.fromEntries(EXPECTED.map(definition => [definition.id, definition.labelRole]))
  assert.deepEqual(labelRoles, {
    aura: 'Label', 'agent-message': 'Body', 'decision-card': 'Decision', 'evidence-card': 'Claim',
    'source-card': 'Title', 'import-panel': 'Title', 'reader-panel': 'Title', 'research-card': 'Query',
  })
  const instance = {
    get mainComponent() { throw new Error('sync forbidden') },
    async getMainComponentAsync() { return { id: 'component:aura:0', key: 'aura-key' } },
  }
  assert.deepEqual(await plan.readMainComponentIdentity(instance), { id: 'component:aura:0', key: 'aura-key' })
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  assert.doesNotMatch(runtime, /\b(?:sample|node|instance)\.mainComponent\b/)
  assert.match(runtime, /roleDefinition\.type === 'TEXT' \? figma\.createText\(\) : figma\.createEllipse\(\)/)
  assert.match(runtime, /role\.setBoundVariable\('maxWidth', variables\.radiusCircle\)/)
  assert.match(runtime, /role\.setBoundVariable\('maxHeight', variables\.radiusCircle\)/)
  assert.match(runtime, /definition\.variants\[0\]\.copy\[definition\.labelRole\]/)
})
