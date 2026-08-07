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

  const dishonest = structuredClone(definitions.ANNOTATION_VIEW_DEFINITIONS)
  const unsupportedAccept = dishonest.find(item => item.kind === 'faden').views.find(view => view.name === 'Accept · Undo')
  unsupportedAccept.operation = 'replace-range'
  unsupportedAccept.effectiveOperation = 'replace-range'
  unsupportedAccept.instances[2].roleCopy['Primary Action'] = 'Text ändern'
  assert.ok(definitions.validateAnnotationViewDefinitions(dishonest).some(error => error.includes('unsupported operation is dishonest')))

  const extraRole = structuredClone(definitions.ANNOTATION_VIEW_DEFINITIONS)
  extraRole[0].views[0].instances[0].roleCopy.Unexpected = 'nicht erlaubt'
  assert.ok(definitions.validateAnnotationViewDefinitions(extraRole).some(error => error.includes('incomplete TEXT roles')))
})
