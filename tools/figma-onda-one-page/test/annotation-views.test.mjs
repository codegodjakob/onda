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
