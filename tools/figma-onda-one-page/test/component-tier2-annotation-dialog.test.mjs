import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as plan from '../src/plan.mjs'
import { COMPONENT_DEFINITIONS, PHASE_DEFINITIONS, PLUGIN_ORIGIN } from '../src/definitions.mjs'
import { createValidFoundationEvidence } from './foundation-fixture.mjs'
import { createValidComponentEvidence } from './component-fixture.mjs'

const ROOT = resolve(import.meta.dirname, '..')
const BASE_IDS = ['button', 'icon-button', 'status-symbol', 'tag', 'field', 'search', 'select', 'composer', 'menu-item', 'nav-item', 'list-row', 'mode-toggle', 'review-bar', 'empty-state']
const TIER2_IDS = ['annotation-anchor', 'annotation-form', 'annotation-card', 'dialog-action', 'dialog']
const ALL_IDS = [...BASE_IDS, ...TIER2_IDS]
const OVERLAY = 'Onda/Shadow/Overlay'

const EXPECTED = Object.freeze([
  Object.freeze({
    id: 'annotation-anchor', name: 'Onda/Annotation Anchor', labelRole: 'Label', roles: ['Symbol', 'Label', 'Count'],
    direction: 'HORIZONTAL', targetHeight: 44, radius: 4, radiusToken: 'radius/control', effectStyleName: null,
    variants: Object.freeze([
      ['Kind=Text, State=Idle', { Symbol: '¶', Label: 'Textanmerkungen', Count: '3 offen' }],
      ['Kind=Text, State=Active', { Symbol: '●', Label: 'Textanmerkungen', Count: '3 aktiv' }],
      ['Kind=Note, State=Idle', { Symbol: '◇', Label: 'Notizen', Count: '2 offen' }],
      ['Kind=Note, State=Active', { Symbol: '●', Label: 'Notizen', Count: '2 aktiv' }],
    ]),
  }),
  Object.freeze({
    id: 'annotation-form', name: 'Onda/Annotation Form', labelRole: 'Label', roles: ['Label', 'Input', 'Preview', 'Primary Action', 'Secondary Action', 'Help'],
    direction: 'VERTICAL', targetHeight: 180, radius: 4, radiusToken: 'radius/control', effectStyleName: null,
    variants: Object.freeze([
      ['Form=Correction', { Label: 'Korrektur', Input: 'Originaltext ersetzen', Preview: 'Vorschau der Korrektur', 'Primary Action': 'Korrektur übernehmen', 'Secondary Action': 'Verwerfen', Help: 'Ersetzt nur die markierte Stelle.' }],
      ['Form=Rewrite', { Label: 'Neu formulieren', Input: 'Alternative Formulierung', Preview: 'Vorschau der Neufassung', 'Primary Action': 'Neufassung übernehmen', 'Secondary Action': 'Original behalten', Help: 'Ersetzt den markierten Textabschnitt.' }],
      ['Form=Insertion', { Label: 'Einfügung', Input: 'Ergänzenden Text eingeben', Preview: 'Einfügung an der markierten Stelle', 'Primary Action': 'Einfügen', 'Secondary Action': 'Abbrechen', Help: 'Fügt Text ein, ohne vorhandenen Text zu löschen.' }],
      ['Form=Slot', { Label: 'Position', Input: 'Zielposition wählen', Preview: 'Vorschau der neuen Reihenfolge', 'Primary Action': 'Verschieben', 'Secondary Action': 'Position behalten', Help: 'Verschiebt einen bestehenden Block.' }],
      ['Form=Region', { Label: 'Mehrere Stellen', Input: 'Betroffene Fundstellen prüfen', Preview: 'Vorschau aller Änderungen', 'Primary Action': 'Alle Änderungen übernehmen', 'Secondary Action': 'Einzeln prüfen', Help: 'Ändert mehrere markierte Stellen.' }],
      ['Form=Source', { Label: 'Quelle', Input: 'Fundstelle oder Quelle prüfen', Preview: 'Quelle wird am Hinweis verknüpft', 'Primary Action': 'Quelle verknüpfen', 'Secondary Action': 'Quelle öffnen', Help: 'Fundstelle erst nach Prüfung am Original übernehmen.' }],
      ['Form=Compare', { Label: 'Vergleich', Input: 'Varianten gegenüberstellen', Preview: 'Unterschiede prüfen', 'Primary Action': 'Variante übernehmen', 'Secondary Action': 'Zurück', Help: 'Übernimmt nur die ausgewählte Variante.' }],
      ['Form=Dialogue', { Label: 'Rückfrage', Input: 'Antwort eingeben', Preview: 'Antwort bleibt als Dialognotiz', 'Primary Action': 'Antwort senden', 'Secondary Action': 'Später', Help: 'Keine automatische Textänderung verfügbar.' }],
      ['Form=Title', { Label: 'Überschrift', Input: 'Neue Überschrift eingeben', Preview: 'Vorschau der Überschrift', 'Primary Action': 'Überschrift übernehmen', 'Secondary Action': 'Zurücksetzen', Help: 'Ersetzt ausschließlich den Titel.' }],
    ]),
  }),
  Object.freeze({
    id: 'annotation-card', name: 'Onda/Annotation Card', labelRole: 'Title', roles: ['Type', 'Title', 'Body', 'Scope', 'Primary Action', 'Secondary Action', 'Status'],
    direction: 'VERTICAL', targetHeight: 220, radius: 8, radiusToken: 'radius/overlay', effectStyleName: OVERLAY,
    variants: Object.freeze([
      ['State=Open', { Type: 'Empfehlung', Title: 'Beleg fehlt', Body: 'Diese Aussage braucht eine überprüfbare Quelle.', Scope: 'Nur diesmal', 'Primary Action': 'Übernehmen', 'Secondary Action': 'Ablehnen', Status: 'Offen' }],
      ['State=Accepted', { Type: 'Korrektur', Title: 'Änderung übernommen', Body: 'Die Änderung wurde in den Text eingesetzt.', Scope: 'Nur diesmal', 'Primary Action': 'Rückgängig', 'Secondary Action': 'Schließen', Status: 'Übernommen' }],
      ['State=Rejected', { Type: 'Hinweis', Title: 'Vorschlag abgelehnt', Body: 'Diese Regel gilt für den aktuellen Text nicht mehr.', Scope: 'Nicht mehr in diesem Text', 'Primary Action': 'Rückgängig', 'Secondary Action': 'Schließen', Status: 'Abgelehnt' }],
      ['State=Error', { Type: 'Fehler', Title: 'Anmerkung konnte nicht aktualisiert werden', Body: 'Deine Eingabe bleibt erhalten.', Scope: 'Nie vorschlagen', 'Primary Action': 'Erneut versuchen', 'Secondary Action': 'Abbrechen', Status: 'Fehler' }],
    ]),
  }),
  Object.freeze({
    id: 'dialog-action', name: 'Onda/Dialog Action', labelRole: 'Label', roles: ['Symbol', 'Label', 'Hint'],
    direction: 'HORIZONTAL', targetHeight: 44, radius: 4, radiusToken: 'radius/control', effectStyleName: null,
    variants: Object.freeze([
      ['Kind=Primary', { Symbol: '→', Label: 'Weiter', Hint: 'Primäre Aktion' }],
      ['Kind=Secondary', { Symbol: '←', Label: 'Zurück', Hint: 'Sekundäre Aktion' }],
      ['Kind=Destructive', { Symbol: '!', Label: 'Löschen', Hint: 'Kann nicht rückgängig gemacht werden' }],
      ['Kind=Disabled', { Symbol: '×', Label: 'Weiter', Hint: 'Nicht verfügbar' }],
    ]),
  }),
  Object.freeze({
    id: 'dialog', name: 'Onda/Dialog', labelRole: 'Title', roles: ['Eyebrow', 'Title', 'Body', 'Status', 'Primary Action', 'Secondary Action'],
    direction: 'VERTICAL', targetHeight: 280, radius: 8, radiusToken: 'radius/overlay', effectStyleName: OVERLAY,
    variants: Object.freeze([
      ['Kind=Standard', { Eyebrow: 'Dialog', Title: 'Einstellungen', Body: 'Passe die Ansicht für dieses Dokument an.', Status: 'Bereit', 'Primary Action': 'Speichern', 'Secondary Action': 'Abbrechen' }],
      ['Kind=Confirmation', { Eyebrow: 'Bestätigung', Title: 'Änderungen übernehmen?', Body: 'Die Änderungen werden lokal gespeichert.', Status: 'Bestätigung erforderlich', 'Primary Action': 'Übernehmen', 'Secondary Action': 'Zurück' }],
      ['Kind=Destructive', { Eyebrow: 'Achtung', Title: 'Dokument löschen?', Body: 'Das Dokument wird dauerhaft aus der Bibliothek entfernt.', Status: 'Nicht rückgängig zu machen', 'Primary Action': 'Endgültig löschen', 'Secondary Action': 'Abbrechen' }],
      ['State=Error', { Eyebrow: 'Fehler', Title: 'Speichern fehlgeschlagen', Body: 'Deine Eingabe bleibt erhalten.', Status: 'Erneut versuchen möglich', 'Primary Action': 'Erneut versuchen', 'Secondary Action': 'Abbrechen' }],
      ['Size=Long', { Eyebrow: 'Information', Title: 'Datenkontrolle und Export', Body: 'Prüfe offene Hinweise, Datenumfang und Exportziel, bevor du fortfährst.', Status: 'Bitte vollständig lesen', 'Primary Action': 'Fortfahren', 'Secondary Action': 'Zurück' }],
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
  return { targetPage: actual.targetPage, containers: actual.containers, sets: actual.componentSets, samples: actual.componentSets.map(set => set.sample), staging: [] }
}

function priorPhases(id) {
  return Object.fromEntries([
    ['inspect', { status: 'success' }],
    ['foundations', { status: 'success' }],
    ...ALL_IDS.slice(0, ALL_IDS.indexOf(id)).map(componentId => [`component-${componentId}`, { status: 'success' }]),
  ])
}

test('contract and workflow append five exact Tier2 annotation/dialog composites after fourteen bases and expose nineteen commands', () => {
  assert.deepEqual(COMPONENT_DEFINITIONS.map(definition => definition.id), ALL_IDS)
  assert.deepEqual(COMPONENT_DEFINITIONS.slice(-5).map(definition => ({
    id: definition.id,
    name: definition.name,
    labelRole: definition.labelRole,
    tier: definition.tier,
    roles: definition.roles.map(role => role.name),
    direction: definition.direction,
    targetHeight: definition.targetHeight,
    radius: definition.radius,
    radiusToken: definition.radiusToken,
    effectStyleName: definition.effectStyleName,
    variants: definition.variants.map(variant => [variant.name, variant.copy]),
  })), EXPECTED.map(item => ({ ...item, tier: 2 })))
  assert.deepEqual(COMPONENT_DEFINITIONS.find(definition => definition.id === 'annotation-form').variants.map(variant => variant.name), [
    'Form=Correction', 'Form=Rewrite', 'Form=Insertion', 'Form=Slot', 'Form=Region', 'Form=Source', 'Form=Compare', 'Form=Dialogue', 'Form=Title',
  ])
  const ui = readFileSync(resolve(ROOT, 'ui.html'), 'utf8')
  const buttons = [...ui.matchAll(/data-command="component-([^"]+)"/g)].map(match => match[1])
  assert.deepEqual(buttons, ALL_IDS)
  assert.deepEqual(PHASE_DEFINITIONS.find(phase => phase.id === 'components').commands.map(command => command.componentId), ALL_IDS)
  for (const forbidden of ['agent-panel', 'source-card', 'source-panel']) assert.doesNotMatch(ui, new RegExp(`component-${forbidden}`))
})

test('strict nineteen-set evidence enforces exact copy, layout, properties, bindings, and overlay linkage with independent corruption per Tier2 set', () => {
  const actual = evidence()
  assert.equal(actual.componentSets.length, 19)
  assert.deepEqual(plan.validateComponentEvidence(actual), { valid: true, errors: [] })
  const overlayId = actual.foundation.effectStyles.find(style => style.name === OVERLAY).id
  for (const id of TIER2_IDS) {
    const definition = COMPONENT_DEFINITIONS.find(item => item.id === id)
    const set = actual.componentSets.find(item => item.id === id)
    assert.deepEqual(set.componentProperties.filter(property => property.type === 'TEXT').map(property => property.name), ['Label'])
    assert.equal(set.componentProperties.find(property => property.name === 'Label').defaultValue, definition.variants[0].copy[definition.labelRole])
    for (const variant of set.variants) {
      assert.equal(variant.layoutMode, definition.direction)
      assert.equal(variant.effectStyleId, definition.effectStyleName ? overlayId : null)
      assert.equal(variant.effects.length, definition.effectStyleName ? 1 : 0)
    }
  }
  const corruptions = new Map([
    ['annotation-anchor', set => { set.variants[0].roles.find(role => role.name === 'Role/Count').characters = 'falsch' }],
    ['annotation-form', set => { set.variants.pop() }],
    ['annotation-card', set => { set.variants[0].effectStyleId = 'effect-style:wrong' }],
    ['dialog-action', set => { set.variants[0].effects.push({ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0 } }) }],
    ['dialog', set => { set.variants[0].cornerRadius = 4 }],
  ])
  for (const [id, corrupt] of corruptions) {
    const candidate = evidence()
    corrupt(candidate.componentSets.find(set => set.id === id))
    assert.equal(plan.validateComponentEvidence(candidate).valid, false, `${id} corruption must fail`)
  }
})

test('foundation evidence requires exactly the owned radius-eight documentation card plus nine allowed overlay component variants', () => {
  const foundation = createValidFoundationEvidence()
  assert.deepEqual(plan.validateFoundationEvidence(foundation), { valid: true, errors: [] })
  assert.equal(foundation.effectConsumers.length, 10)
  const expected = new Set([
    'foundation\u0000Effect / Onda/Shadow/Overlay',
    ...EXPECTED.filter(definition => definition.effectStyleName).flatMap(definition => definition.variants.map(([name]) => `${definition.id}\u0000${name}`)),
  ])
  assert.deepEqual(new Set(foundation.effectConsumers.map(consumer => `${consumer.componentId || 'foundation'}\u0000${consumer.name}`)), expected)
  assert.ok(foundation.effectConsumers.every(consumer => consumer.owner === PLUGIN_ORIGIN && consumer.cornerRadius === 8))

  for (const mutate of [
    value => { value.effectConsumers.pop() },
    value => { value.effectConsumers[1].effectStyleId = 'effect-style:wrong' },
    value => { value.effectConsumers[1].owner = '' },
    value => { value.effectConsumers.push({ ...structuredClone(value.effectConsumers[1]), nodeId: 'flat:consumer', componentId: 'button', name: 'Kind=Primary, State=Default' }) },
  ]) {
    const candidate = createValidFoundationEvidence()
    mutate(candidate)
    assert.equal(plan.validateFoundationEvidence(candidate).valid, false)
  }
})

test('Tier2 exact and safe partial inventories recover idempotently and staging retry reuses exact owned variants', async () => {
  for (const id of TIER2_IDS) {
    const current = inventory()
    const set = current.sets.find(item => item.id === id)
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

  const definition = COMPONENT_DEFINITIONS.find(item => item.id === 'dialog')
  const staging = []
  let creates = 0
  let combines = 0
  const options = {
    staging,
    expectedVariantNames: definition.variants.map(variant => variant.name),
    createVariant: async variantName => ({ variantName, node: { id: `stage:${creates += 1}`, stagingComponent: 'dialog', stagingVariant: variantName } }),
    combine: async entries => { if (combines += 1, combines === 1) throw new Error('combine failed'); return { entries } },
    clearStaging: async entry => { entry.node.stagingComponent = ''; entry.node.stagingVariant = '' },
  }
  await assert.rejects(() => plan.executeStagingAssembly(options), /combine failed/)
  await plan.executeStagingAssembly(options)
  assert.equal(creates, definition.variants.length)
})

test('recursive Tier2 duplicate/effect races and known-ID replacement abort after context before component writes', async () => {
  for (const id of TIER2_IDS) {
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
    assert.deepEqual(log, ['context'])
  }

  const before = inventory()
  const current = structuredClone(before)
  current.sets.find(set => set.id === 'annotation-card').variants[0].effectStyleId = 'effect-style:replaced'
  const writes = []
  await assert.rejects(() => plan.executeGuardedComponentCommand({
    command: 'component-annotation-card', phases: priorPhases('annotation-card'),
    preflight: async () => before,
    requireContext: async () => ({ page: before.targetPage }),
    collectCurrentInventory: async () => current,
    mutate: async () => { writes.push('component') },
  }), /TOCTOU/)
  assert.deepEqual(writes, [])
})

test('effect style identity and runtime component application use async dynamic-page APIs without synchronous effectStyleId access', async () => {
  assert.equal(typeof plan.readEffectStyleId, 'function')
  const node = {
    get effectStyleId() { throw new Error('sync forbidden') },
    async getEffectStyleIdAsync() { return 'effect-style:overlay' },
  }
  assert.equal(await plan.readEffectStyleId(node), 'effect-style:overlay')
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  const planSource = readFileSync(resolve(ROOT, 'src/plan.mjs'), 'utf8')
  assert.match(planSource, /await node\.getEffectStyleIdAsync\(\)/)
  assert.doesNotMatch(runtime, /consumer\.node\.effectStyleId\b/)
  assert.doesNotMatch(runtime, /\bcomponent\.effectStyleId\b/)
  assert.match(runtime, /await component\.setEffectStyleIdAsync\(effectStyle\.id\)/)
  assert.match(runtime, /definition\.effectStyleName/)
})
