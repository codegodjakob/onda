import test from 'node:test'
import assert from 'node:assert/strict'

const VIEW_NAMES = [
  'Open',
  'Accept · Undo',
  'Reject · Scope',
  'Error · Retry',
  'Responsive · 320 px',
  'Dark',
]

const FORM_VARIANTS = {
  correction: 'Form=Correction',
  rewrite: 'Form=Rewrite',
  insertion: 'Form=Insertion',
  slot: 'Form=Slot',
  region: 'Form=Region',
  source: 'Form=Source',
  compare: 'Form=Compare',
  dialogue: 'Form=Dialogue',
  title: 'Form=Title',
}

const UNSUPPORTED_KINDS = new Set(['faden', 'anmerkung', 'luecke', 'nachfrage', 'aufgreifen'])

function assertDeepFrozen(value, label = 'value') {
  assert.ok(Object.isFrozen(value), `${label} must be frozen`)
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) assertDeepFrozen(child, `${label}.${key}`)
  }
}

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

async function mutatedContract(mutate) {
  const definitions = await import('../src/definitions.mjs')
  const candidate = definitions.ANNOTATION_VIEW_DEFINITIONS.map((annotation, index) => ({
    ...structuredClone(annotation),
    definition: definitions.ANNOTATION_SECTIONS[index],
  }))
  mutate(candidate)
  return { definitions, candidate: deepFreeze(candidate) }
}

function namedView(candidate, kind, viewName) {
  return candidate.find(annotation => annotation.kind === kind).views.find(view => view.name === viewName)
}

function clone(value) {
  return structuredClone(value)
}

function batchPhases(definitions, batchIndex = 0) {
  const prefix = [
    'inspect',
    'foundations',
    ...definitions.COMPONENT_DEFINITIONS.map(component => `component-${component.id}`),
    'core-views',
    ...Array.from({ length: batchIndex }, (_, index) => `annotations-${index + 1}`),
  ]
  return Object.fromEntries(prefix.map(id => [id, { status: 'success' }]))
}

async function annotationInventoryFixture(batchIndex = 0) {
  const definitions = await import('../src/definitions.mjs')
  const batchStart = batchIndex * 5
  const annotations = definitions.ANNOTATION_VIEW_DEFINITIONS.slice(batchStart, batchStart + 5)
  const semanticNames = ['color/surface', 'color/inverted', 'color/border', 'color/text', 'color/text-muted', 'color/on-inverted']
  const variables = ['Light', 'Dark'].flatMap(theme => semanticNames.map(name => ({
    id: `variable:${theme}:${name}`,
    name,
    type: 'VARIABLE',
    owner: definitions.PLUGIN_ORIGIN,
    collectionId: `collection:${theme}`,
    collectionName: `Onda · Semantic · ${theme}`,
  }))).concat(['spacing/12', 'spacing/16', 'spacing/24', 'radius/6'].map(name => ({
    id: `variable:Dimension:${name}`,
    name,
    type: 'VARIABLE',
    owner: definitions.PLUGIN_ORIGIN,
    collectionId: 'collection:Dimension',
    collectionName: 'Onda · Dimension',
  })))
  const overlayEffects = [{
    type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.16 }, offset: { x: 0, y: 8 },
    radius: 24, spread: 0, visible: true, blendMode: 'NORMAL',
  }]
  const effectStyles = [{
    id: 'effect-overlay', name: 'Onda/Shadow/Overlay', type: 'EFFECT', owner: definitions.PLUGIN_ORIGIN,
    effects: clone(overlayEffects),
  }]
  const components = definitions.COMPONENT_DEFINITIONS
    .filter(component => ['annotation-anchor', 'annotation-form', 'annotation-card', 'status-symbol', 'dialog-action'].includes(component.id))
    .map(component => ({
      id: `set-${component.id}`,
      componentId: component.id,
      name: component.name,
      type: 'COMPONENT_SET',
      owner: definitions.PLUGIN_ORIGIN,
      childIds: component.variants.map(variant => `variant-${component.id}-${variant.name}`),
      childCount: component.variants.length,
      variants: component.variants.map(variant => ({
        id: `variant-${component.id}-${variant.name}`,
        name: variant.name,
        type: 'COMPONENT',
        owner: definitions.PLUGIN_ORIGIN,
        parentId: `set-${component.id}`,
        parentType: 'COMPONENT_SET',
        parentName: component.name,
        surfaceToken: variant.surfaceToken,
        textToken: variant.textToken,
      })),
    }))
  const semanticId = (theme, name) => `variable:${theme}:${name}`
  const dimensionId = name => `variable:Dimension:${name}`
  const dimensionBindings = padding => ({
    itemSpacing: [dimensionId('spacing/12')],
    paddingTop: [dimensionId(`spacing/${padding}`)],
    paddingRight: [dimensionId(`spacing/${padding}`)],
    paddingBottom: [dimensionId(`spacing/${padding}`)],
    paddingLeft: [dimensionId(`spacing/${padding}`)],
    cornerRadius: [dimensionId('radius/6')],
  })
  const paints = theme => theme === 'Dark'
    ? { fills: [{ type: 'SOLID', color: { r: 0.08, g: 0.08, b: 0.08 } }], strokes: [{ type: 'SOLID', color: { r: 0.24, g: 0.24, b: 0.24 } }] }
    : { fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }], strokes: [{ type: 'SOLID', color: { r: 0.82, g: 0.82, b: 0.82 } }] }

  function makeView(annotation, annotationIndex, contract, viewIndex) {
    const viewId = `view-${annotationIndex}-${viewIndex}`
    const displayName = `${annotation.definition.label} / ${contract.name}`
    const regionId = `${viewId}-region-Content`
    const viewX = 100 + viewIndex * 700
    const viewY = 100 + annotationIndex * 1400
    const copyTotal = Object.keys(contract.copyContracts).length
    const contentHeight = contract.padding * 2
      + copyTotal * 22
      + contract.instances.reduce((sum, instance) => sum + instance.expectedHeight, 0)
      + (copyTotal + contract.instances.length - 1) * 12
    const viewPaints = paints(contract.theme)
    const copyNodes = Object.entries(contract.copyContracts).map(([role, characters], index) => ({
      id: `${viewId}-copy-${role}`,
      name: `Copy/${role}`,
      role,
      characters,
      type: 'TEXT',
      owner: definitions.PLUGIN_ORIGIN,
      parentId: regionId,
      parentType: 'FRAME',
      parentName: 'Content',
      order: index,
      width: contract.width - contract.padding * 2,
      height: 22,
      bounds: { x: contract.padding, y: contract.padding + index * 34, width: contract.width - contract.padding * 2, height: 22 },
      absoluteBounds: { x: viewX + contract.padding, y: viewY + contract.padding + index * 34, width: contract.width - contract.padding * 2, height: 22 },
      fills: [{ type: 'SOLID', color: contract.theme === 'Dark' ? { r: 0.92, g: 0.92, b: 0.92 } : { r: 0.08, g: 0.08, b: 0.08 } }],
      strokes: [],
      fillBindings: [semanticId(contract.theme, 'color/text')],
      pluginData: { owner: definitions.PLUGIN_ORIGIN, ondaAnnotationCopy: role },
    }))
    const instances = contract.instances.map((instance, index) => {
      const instanceId = `${viewId}-instance-${instance.name}`
      const component = components.find(candidate => candidate.name === definitions.COMPONENT_DEFINITIONS.find(item => item.id === instance.setId).name)
      const variant = component.variants.find(candidate => candidate.name === instance.variant)
      const componentDefinition = definitions.COMPONENT_DEFINITIONS.find(item => item.id === instance.setId)
      const instanceY = contract.padding + copyTotal * 34 + index * (instance.expectedHeight + 12)
      const roleDescendants = componentDefinition.roles.map((role, roleIndex) => {
        const nested = roleIndex === 0
        const ancestorId = `${instanceId}-role-container-${role.name}`
        const ancestor = {
          id: ancestorId, name: `Role container/${role.name}`, type: 'FRAME', owner: definitions.PLUGIN_ORIGIN,
          parentId: instanceId, parentType: 'INSTANCE', parentName: instance.name,
          childIds: [`${instanceId}-role-${role.name}`], childCount: 1,
        }
        return {
          id: `${instanceId}-role-${role.name}`,
          name: `Role/${role.name}`,
          role: role.name,
          ...(role.type === 'TEXT' ? { characters: instance.roleCopy[role.name] } : {}),
          type: role.type,
          owner: definitions.PLUGIN_ORIGIN,
          parentInstanceId: instanceId,
          parentId: nested ? ancestorId : instanceId,
          parentType: nested ? 'FRAME' : 'INSTANCE',
          parentName: nested ? ancestor.name : instance.name,
          ancestorIds: nested ? [ancestorId, instanceId] : [instanceId],
          ancestorChain: nested ? [ancestor] : [],
          order: roleIndex,
          width: 36,
          height: 18,
          bounds: { x: 8 + roleIndex * 40, y: 8, width: 36, height: 18 },
          absoluteBounds: { x: viewX + contract.padding + 8 + roleIndex * 40, y: viewY + instanceY + 8, width: 36, height: 18 },
          fills: [{ type: 'SOLID', color: contract.theme === 'Dark' ? { r: 0.92, g: 0.92, b: 0.92 } : { r: 0.08, g: 0.08, b: 0.08 } }],
          strokes: [],
          fillBindings: [semanticId(contract.theme, variant.textToken)],
          pluginData: { owner: definitions.PLUGIN_ORIGIN, ondaAnnotationRole: role.name },
        }
      })
      const directRoleIds = roleDescendants.map(role => role.ancestorChain[0]?.id || role.id)
      const componentProperties = Object.fromEntries(Object.entries(instance.roleCopy).map(([role, value]) => [role, { type: 'TEXT', value }]))
      return {
        id: instanceId,
        name: instance.name,
        type: 'INSTANCE',
        owner: definitions.PLUGIN_ORIGIN,
        parentId: regionId,
        parentType: 'FRAME',
        parentName: 'Content',
        order: copyNodes.length + index,
        width: contract.width - contract.padding * 2,
        height: instance.expectedHeight,
        bounds: { x: contract.padding, y: instanceY, width: contract.width - contract.padding * 2, height: instance.expectedHeight },
        absoluteBounds: { x: viewX + contract.padding, y: viewY + instanceY, width: contract.width - contract.padding * 2, height: instance.expectedHeight },
        childIds: directRoleIds,
        childCount: directRoleIds.length,
        mainComponentId: variant.id,
        componentSetId: component.id,
        componentSetName: component.name,
        variantName: instance.variant,
        labelValue: instance.roleCopy.Label ?? null,
        componentProperties,
        roleCopy: clone(instance.roleCopy),
        roleDescendants,
        fills: clone(viewPaints.fills),
        strokes: clone(viewPaints.strokes),
        fillBindings: [semanticId(contract.theme, variant.surfaceToken)],
        strokeBindings: [semanticId(contract.theme, 'color/border')],
        effects: instance.setId === 'annotation-card' ? clone(overlayEffects) : [],
        effectStyleId: instance.setId === 'annotation-card' ? 'effect-overlay' : '',
        pluginData: { owner: definitions.PLUGIN_ORIGIN, ondaAnnotationInstance: instance.name, setId: instance.setId, variant: instance.variant },
      }
    })
    const view = {
      id: viewId,
      name: displayName,
      viewName: contract.name,
      sectionName: annotation.sectionName,
      kind: annotation.kind,
      fixtureId: annotation.fixture.id,
      theme: contract.theme,
      type: 'FRAME',
      owner: definitions.PLUGIN_ORIGIN,
      parentId: `section-${annotation.kind}`,
      parentType: 'SECTION',
      parentName: annotation.sectionName,
      width: contract.width,
      height: contentHeight,
      bounds: { x: viewX, y: viewY, width: contract.width, height: contentHeight },
      absoluteBounds: { x: viewX, y: viewY, width: contract.width, height: contentHeight },
      padding: contract.padding,
      paddingTop: contract.padding,
      paddingRight: contract.padding,
      paddingBottom: contract.padding,
      paddingLeft: contract.padding,
      itemSpacing: 12,
      layoutMode: contract.layoutMode,
      cornerRadius: 6,
      fills: clone(viewPaints.fills),
      strokes: clone(viewPaints.strokes),
      fillBindings: [semanticId(contract.theme, 'color/surface')],
      strokeBindings: [semanticId(contract.theme, 'color/border')],
      fieldVariableIds: dimensionBindings(contract.padding),
      effects: [],
      effectStyleId: '',
      childIds: [regionId],
      childCount: 1,
      pluginData: { owner: definitions.PLUGIN_ORIGIN, ondaAnnotationKind: annotation.kind, ondaAnnotationView: contract.name, fixtureId: annotation.fixture.id },
      layoutRegions: [{
        id: regionId,
        name: 'Content',
        type: 'FRAME',
        owner: definitions.PLUGIN_ORIGIN,
        parentId: viewId,
        parentType: 'FRAME',
        parentName: displayName,
        width: contract.width,
        height: contentHeight,
        bounds: { x: 0, y: 0, width: contract.width, height: contentHeight },
        absoluteBounds: { x: viewX, y: viewY, width: contract.width, height: contentHeight },
        padding: contract.padding,
        paddingTop: contract.padding,
        paddingRight: contract.padding,
        paddingBottom: contract.padding,
        paddingLeft: contract.padding,
        itemSpacing: 12,
        layoutMode: 'VERTICAL',
        fills: clone(viewPaints.fills),
        strokes: clone(viewPaints.strokes),
        fillBindings: [semanticId(contract.theme, 'color/surface')],
        strokeBindings: [semanticId(contract.theme, 'color/border')],
        fieldVariableIds: dimensionBindings(contract.padding),
        childIds: [...copyNodes, ...instances].map(child => child.id),
        childCount: copyNodes.length + instances.length,
        pluginData: { owner: definitions.PLUGIN_ORIGIN, ondaAnnotationRegion: 'Content' },
      }],
      copyNodes,
      instances,
      standIns: [],
    }
    return view
  }

  const trees = definitions.ANNOTATION_VIEW_DEFINITIONS.map((annotation, annotationIndex) => {
    const views = annotation.views.map((contract, viewIndex) => makeView(annotation, annotationIndex, contract, viewIndex))
    return {
      annotation,
      section: {
        id: `section-${annotation.kind}`, name: annotation.sectionName, type: 'SECTION', owner: definitions.PLUGIN_ORIGIN,
        parentId: 'page-1', parentType: 'PAGE', parentName: definitions.TARGET_PAGE_NAME,
        childIds: views.map(view => view.id), childCount: views.length,
        pluginData: { owner: definitions.PLUGIN_ORIGIN, ondaAnnotationKind: annotation.kind },
      },
      views,
    }
  })
  const targetKinds = new Set(annotations.map(annotation => annotation.kind))
  const targetTrees = trees.filter(tree => targetKinds.has(tree.annotation.kind))
  const untouchedTrees = trees.filter(tree => !targetKinds.has(tree.annotation.kind))
  const sections = targetTrees.map(tree => tree.section)
  const views = targetTrees.flatMap(tree => tree.views)
  const untouchedPageChildren = [
    ...untouchedTrees.map(tree => tree.section),
    { id: 'section-08', name: '08 · Dialoge', type: 'SECTION', owner: definitions.PLUGIN_ORIGIN, parentId: 'page-1', parentType: 'PAGE', parentName: definitions.TARGET_PAGE_NAME, childIds: [], childCount: 0 },
  ]
  const untouchedPageDescendants = untouchedTrees.flatMap(tree => tree.views.flatMap(view => {
    const { layoutRegions, copyNodes, instances, standIns: _standIns, ...flatView } = view
    return [
      flatView,
      ...layoutRegions,
      ...copyNodes,
      ...instances.flatMap(instance => {
        const { roleDescendants, ...flatInstance } = instance
        return [flatInstance, ...roleDescendants]
      }),
    ]
  }))
  const pageChildIds = [...trees.map(tree => tree.section.id), 'section-08']
  return {
    batchIndex,
    command: `annotations-${batchIndex + 1}`,
    targetPage: { id: 'page-1', name: definitions.TARGET_PAGE_NAME, type: 'PAGE', childIds: pageChildIds, childCount: pageChildIds.length },
    sections,
    views,
    untouchedPageChildren,
    untouchedPageDescendants,
    components,
    variables,
    effectStyles,
  }
}

test('annotation contract is the exact frozen 29 by 6 fixture matrix', async () => {
  const definitions = await import('../src/definitions.mjs')
  const { ANNOTATION_CASES } = await import('../../../app/evals/fixtures/annotation-cases.mjs')

  assert.deepEqual(definitions.ANNOTATION_FORM_VARIANTS, FORM_VARIANTS)
  assert.equal(definitions.ANNOTATION_VIEW_DEFINITIONS.length, 29)
  assert.equal(definitions.ANNOTATION_VIEW_DEFINITIONS.flatMap(item => item.views).length, 174)
  assert.deepEqual(definitions.ANNOTATION_VIEW_DEFINITIONS.map(item => item.kind), ANNOTATION_CASES.map(item => item.anmerkungsart))
  assert.deepEqual(definitions.ANNOTATION_VIEW_DEFINITIONS.map(item => item.fixture), ANNOTATION_CASES)
  assert.deepEqual(definitions.validateAnnotationViewDefinitions(definitions.ANNOTATION_VIEW_DEFINITIONS), [])
  assertDeepFrozen(definitions.ANNOTATION_VIEW_DEFINITIONS)

  for (const [index, annotation] of definitions.ANNOTATION_VIEW_DEFINITIONS.entries()) {
    const fixture = ANNOTATION_CASES[index]
    const source = definitions.ANNOTATION_SECTIONS[index]
    const form = FORM_VARIANTS[source.form]
    assert.equal(annotation.sectionName, source.sectionName)
    assert.equal(annotation.definition, source)
    assert.deepEqual(annotation.views.map(view => view.name), VIEW_NAMES)

    for (const view of annotation.views) {
      assert.deepEqual(Object.keys(view), ['name', 'sectionName', 'kind', 'fixtureId', 'width', 'theme', 'padding', 'layoutMode', 'regions', 'copyContracts', 'instances'])
      assert.equal(view.sectionName, source.sectionName)
      assert.equal(view.kind, fixture.anmerkungsart)
      assert.equal(view.fixtureId, fixture.id)
      assert.equal(view.layoutMode, 'VERTICAL')
      assert.equal(view.width, view.name === 'Responsive · 320 px' ? 320 : 580)
      assert.equal(view.padding, view.name === 'Responsive · 320 px' ? 16 : 24)
      assert.equal(view.theme, view.name === 'Dark' ? 'Dark' : 'Light')
      assert.deepEqual(view.copyContracts, {
        Target: fixture.target,
        Finding: fixture.short,
        Reason: fixture.why,
        Consequence: fixture.folge,
      })
      assert.deepEqual(view.instances.map(instance => instance.setId), [
        'annotation-anchor', 'annotation-form', 'annotation-card', 'status-symbol', 'dialog-action', 'dialog-action',
      ])
      assert.deepEqual(view.instances.map(instance => instance.name), [
        'Anchor', 'Form', 'Card', 'Status', 'Primary Action', 'Secondary Action',
      ])
      assert.ok(view.regions.length > 0)

      const [anchor, annotationForm, card, status, primary, secondary] = view.instances
      assert.equal(anchor.variant, `Kind=${index < 24 ? 'Text' : 'Note'}, State=Active`)
      assert.equal(annotationForm.variant, form)
      assert.equal(annotationForm.roleCopy.Input, fixture.target)
      assert.equal(annotationForm.roleCopy.Preview, fixture.action)
      assert.equal(annotationForm.roleCopy.Help, fixture.why)

      if (UNSUPPORTED_KINDS.has(annotation.kind)) {
        assert.equal(annotationForm.roleCopy['Primary Action'], 'Nicht verfügbar')
        assert.equal(card.roleCopy['Primary Action'], view.name === 'Accept · Undo' ? 'Übernehmen nicht verfügbar' : 'Nicht verfügbar')
        assert.equal('operation' in view, false)
        assert.equal('effectiveOperation' in view, false)
      }

      if (view.name === 'Accept · Undo' && UNSUPPORTED_KINDS.has(annotation.kind)) {
        assert.equal(card.variant, 'State=Open')
        assert.equal(card.roleCopy['Primary Action'], 'Übernehmen nicht verfügbar')
        assert.equal(card.roleCopy.Status, 'Nur redaktioneller Hinweis')
        assert.equal(card.roleCopy.Body, fixture.short)
        assert.equal(primary.variant, 'Kind=Disabled')
        assert.equal(primary.roleCopy.Label, 'Übernehmen nicht verfügbar')
        assert.equal(secondary.roleCopy.Label, 'Als Hinweis behalten')
      }
    }
  }

})

test('validator names a non-null unsupported operation independently', async () => {
  const { definitions, candidate } = await mutatedContract(contract => {
    namedView(contract, 'faden', 'Accept · Undo').operation = 'replace-range'
  })
  assert.deepEqual(definitions.validateAnnotationViewDefinitions(candidate), [
    'faden/Accept · Undo: unsupported operation must be null',
  ])
})

test('validator names a non-null unsupported effective operation independently', async () => {
  const { definitions, candidate } = await mutatedContract(contract => {
    namedView(contract, 'faden', 'Accept · Undo').effectiveOperation = 'replace-range'
  })
  assert.deepEqual(definitions.validateAnnotationViewDefinitions(candidate), [
    'faden/Accept · Undo: unsupported effectiveOperation must be null',
  ])
})

test('validator names an unsupported Card text-change claim independently', async () => {
  const { definitions, candidate } = await mutatedContract(contract => {
    namedView(contract, 'faden', 'Accept · Undo').instances[2].roleCopy['Primary Action'] = 'Text ändern'
  })
  assert.deepEqual(definitions.validateAnnotationViewDefinitions(candidate), [
    'faden/Accept · Undo: unsupported Card action claims a text change',
  ])
})

test('validator names a missing TEXT Role independently', async () => {
  const { definitions, candidate } = await mutatedContract(contract => {
    delete namedView(contract, 'rechtschreibung', 'Open').instances[0].roleCopy.Count
  })
  assert.deepEqual(definitions.validateAnnotationViewDefinitions(candidate), [
    'rechtschreibung/Open: Anchor is missing TEXT Role Count',
  ])
})

test('validator names an extra TEXT Role independently', async () => {
  const { definitions, candidate } = await mutatedContract(contract => {
    namedView(contract, 'rechtschreibung', 'Open').instances[0].roleCopy.Unexpected = 'nicht erlaubt'
  })
  assert.deepEqual(definitions.validateAnnotationViewDefinitions(candidate), [
    'rechtschreibung/Open: Anchor has extra TEXT Role Unexpected',
  ])
})

test('validator names a non-vertical region independently', async () => {
  const { definitions, candidate } = await mutatedContract(contract => {
    namedView(contract, 'rechtschreibung', 'Open').regions[0].layoutMode = 'HORIZONTAL'
  })
  assert.deepEqual(definitions.validateAnnotationViewDefinitions(candidate), [
    'rechtschreibung/Open: Content region layoutMode must be VERTICAL',
  ])
})

test('validator names a wrong region width independently', async () => {
  const { definitions, candidate } = await mutatedContract(contract => {
    namedView(contract, 'rechtschreibung', 'Open').regions[0].width = 579
  })
  assert.deepEqual(definitions.validateAnnotationViewDefinitions(candidate), [
    'rechtschreibung/Open: Content region width must be 580',
  ])
})

test('validator names a wrong region padding independently', async () => {
  const { definitions, candidate } = await mutatedContract(contract => {
    namedView(contract, 'rechtschreibung', 'Open').regions[0].padding = 23
  })
  assert.deepEqual(definitions.validateAnnotationViewDefinitions(candidate), [
    'rechtschreibung/Open: Content region padding must be 24',
  ])
})

test('annotation batches expose guarded recovery interfaces before any write', async () => {
  const plan = await import('../src/plan.mjs')
  for (const name of [
    'validateAnnotationViewMutationInventory',
    'buildAnnotationViewRecoveryActions',
    'canonicalAnnotationViewMutationSnapshot',
    'executeGuardedAnnotationViewBatch',
  ]) assert.equal(typeof plan[name], 'function', `${name} must be exported`)
})

test('annotation recovery accepts exact batches and converges safe owned partials idempotently', async () => {
  const plan = await import('../src/plan.mjs')
  for (const [batchIndex, expectedKinds] of [5, 5, 5, 5, 5, 4].entries()) {
    const exact = await annotationInventoryFixture(batchIndex)
    assert.equal(plan.validateAnnotationViewMutationInventory(exact).valid, true)
    assert.equal(exact.sections.length, expectedKinds)
    assert.equal(exact.views.length, expectedKinds * 6)
    assert.deepEqual(plan.buildAnnotationViewRecoveryActions(exact), [])
  }

  const partial = await annotationInventoryFixture(0)
  partial.views[0].instances = partial.views[0].instances.filter(instance => instance.name !== 'Card')
  partial.views[0].layoutRegions[0].childIds = partial.views[0].layoutRegions[0].childIds.filter(id => !id.endsWith('-instance-Card'))
  assert.equal(plan.validateAnnotationViewMutationInventory(partial).valid, true)
  assert.deepEqual(plan.buildAnnotationViewRecoveryActions(partial), [{
    type: 'create-instance', viewName: 'Rechtschreibung / Open', instanceName: 'Card',
  }])
})

test('annotation inventory rejects unsafe ownership ancestry identity and visible residue', async t => {
  const plan = await import('../src/plan.mjs')
  const cases = [
    ['unknown marked view', inventory => { inventory.views.push({ ...clone(inventory.views[0]), id: 'unknown-view', name: 'Unbekannt / Open', kind: 'unknown' }) }],
    ['duplicate identity', inventory => { inventory.views.push(clone(inventory.views[0])) }],
    ['unowned view', inventory => { inventory.views[0].owner = 'foreign' }],
    ['wrong type', inventory => { inventory.views[0].type = 'TEXT' }],
    ['wrong parent', inventory => { inventory.views[0].parentId = 'section-08' }],
    ['visible residue', inventory => { inventory.views[0].standIns.push({ id: 'residue', name: 'Legacy', type: 'TEXT', owner: 'onda-one-page', parentId: inventory.views[0].id, visible: true }) }],
  ]
  for (const [name, mutate] of cases) await t.test(name, async () => {
    const inventory = await annotationInventoryFixture(0)
    mutate(inventory)
    assert.equal(plan.validateAnnotationViewMutationInventory(inventory).valid, false)
  })
})

test('annotation recovery names exact owned copy binding effect geometry marker and order repairs', async t => {
  const plan = await import('../src/plan.mjs')
  const cases = [
    ['view geometry', inventory => { inventory.views[0].width = 999 }, 'repair-view-geometry'],
    ['view marker', inventory => { inventory.views[0].pluginData.ondaAnnotationView = 'falsch' }, 'repair-view-marker'],
    ['view binding', inventory => { inventory.views[0].fillBindings = ['light-text'] }, 'repair-view-bindings'],
    ['copy', inventory => { inventory.views[0].copyNodes[0].characters = 'falsch' }, 'repair-copy'],
    ['instance copy', inventory => { inventory.views[0].instances[0].roleCopy.Label = 'falsch' }, 'repair-instance-copy'],
    ['instance effect', inventory => { inventory.views[0].instances[2].effectStyleId = '' }, 'repair-instance-effect'],
    ['child order', inventory => { inventory.views[0].layoutRegions[0].childIds.reverse() }, 'repair-child-order'],
  ]
  for (const [name, mutate, expectedType] of cases) await t.test(name, async () => {
    const inventory = await annotationInventoryFixture(0)
    mutate(inventory)
    assert.equal(plan.validateAnnotationViewMutationInventory(inventory).valid, true)
    assert.ok(plan.buildAnnotationViewRecoveryActions(inventory).some(action => action.type === expectedType))
  })
})

test('canonical annotation snapshot and final barrier detect same-ID recursive drift with zero writes', async () => {
  const definitions = await import('../src/definitions.mjs')
  const plan = await import('../src/plan.mjs')
  const exact = await annotationInventoryFixture(0)
  const changed = clone(exact)
  changed.views[0].instances[0].roleDescendants[0].characters = 'drift'
  assert.notDeepEqual(plan.canonicalAnnotationViewMutationSnapshot(exact), plan.canonicalAnnotationViewMutationSnapshot(changed))

  let collection = 0
  let writes = 0
  await assert.rejects(plan.executeGuardedAnnotationViewBatch({
    command: 'annotations-1',
    phases: batchPhases(definitions),
    preflight: async () => clone(exact),
    requireContext: async () => ({ ready: true }),
    collectCurrentInventory: async () => (++collection === 1 ? clone(exact) : changed),
    resolveInventoryNodes: async () => ({ resolved: true }),
    mutate: async () => { writes += 1 },
  }), /before annotation write barrier/)
  assert.equal(collection, 2)
  assert.equal(writes, 0)
})
