import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildBaselineShards,
  buildVerificationReport,
  computeOndaOrigin,
  isGrayColor,
  restoreBaselineShards,
  selectFontDecision,
  validatePhaseTransition,
} from '../src/plan.mjs'
import {
  ANNOTATION_SECTIONS,
  COMPONENT_DEFINITIONS,
  DIALOG_FAMILIES,
  SECTION_DEFINITIONS,
} from '../src/definitions.mjs'

const ROOT = resolve(import.meta.dirname, '..')

test('build path resolves from the plugin and private fileKey API is enabled', () => {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'))
  const manifest = JSON.parse(readFileSync(resolve(ROOT, 'manifest.json'), 'utf8'))
  assert.match(pkg.scripts.build, /^\.\.\/\.\.\/app\/node_modules\/\.bin\/esbuild\b/)
  assert.equal(manifest.enablePrivatePluginApi, true)
})

test('baseline sharding round-trips more than 2000 records below 80KB per plugin-data value', () => {
  const records = Array.from({ length: 2501 }, (_, index) => ({
    id: `node-${index}`,
    name: `Foreign node ${index}`,
    type: index % 7 === 0 ? 'TEXT' : 'FRAME',
    characters: 'Bestehender Inhalt '.repeat(index % 23),
    absoluteRenderBounds: { x: index * 3, y: index, width: 500, height: 120 },
  }))
  const shards = buildBaselineShards(records)
  assert.ok(shards.length > 1)
  for (const shard of shards) assert.ok(Buffer.byteLength(shard, 'utf8') < 80_000)
  assert.deepEqual(restoreBaselineShards(shards), records)
})

test('origin includes recursive overhanging absolute render bounds and persisted origin wins', () => {
  const nodes = [{
    x: 0, width: 100,
    absoluteRenderBounds: { x: 0, y: 0, width: 140, height: 100 },
    children: [{ x: 20, width: 20, absoluteRenderBounds: { x: 5900, y: 0, width: 250, height: 20 } }],
  }]
  assert.equal(computeOndaOrigin(nodes), 8200)
  assert.equal(computeOndaOrigin(nodes, 4100), 4100)
})

test('grayscale accepts only the 0.002 channel tolerance', () => {
  assert.equal(isGrayColor({ r: .5, g: .501, b: .502 }), true)
  assert.equal(isGrayColor({ r: .5, g: .501, b: .5021 }), false)
})

test('ABC Diatype is exact only with suitable 400, 500 and 700 styles', () => {
  const complete = selectFontDecision([
    { fontName: { family: 'ABC Diatype', style: 'Regular' } },
    { fontName: { family: 'ABC Diatype', style: 'Medium' } },
    { fontName: { family: 'ABC Diatype', style: 'Bold' } },
  ])
  assert.equal(complete.exact, true)
  assert.deepEqual(complete.styles, { 400: 'Regular', 500: 'Medium', 700: 'Bold' })
  const incomplete = selectFontDecision([
    { fontName: { family: 'ABC Diatype', style: 'Regular' } },
    { fontName: { family: 'ABC Diatype', style: 'Bold' } },
    { fontName: { family: 'Inter', style: 'Regular' } },
    { fontName: { family: 'Inter', style: 'Medium' } },
    { fontName: { family: 'Inter', style: 'Bold' } },
  ])
  assert.equal(incomplete.exact, false)
  assert.equal(incomplete.family, 'Inter')
  assert.match(incomplete.warning, /ABC Diatype.*500/)
})

test('phase order permits only the next command including component tier order and six batches', () => {
  const completed = {}
  assert.equal(validatePhaseTransition('foundations', completed).ok, false)
  completed.inspect = { status: 'success' }
  assert.equal(validatePhaseTransition('foundations', completed).ok, true)
  completed.foundations = { status: 'success' }
  const firstComponent = `component-${COMPONENT_DEFINITIONS[0].id}`
  assert.equal(validatePhaseTransition(firstComponent, completed).ok, true)
  assert.equal(validatePhaseTransition(`component-${COMPONENT_DEFINITIONS[1].id}`, completed).ok, false)
  for (const component of COMPONENT_DEFINITIONS) completed[`component-${component.id}`] = { status: 'success' }
  assert.equal(validatePhaseTransition('core-views', completed).ok, true)
  completed['core-views'] = { status: 'success' }
  assert.equal(validatePhaseTransition('annotations-2', completed).ok, false)
  completed['annotations-1'] = { status: 'success' }
  assert.equal(validatePhaseTransition('annotations-2', completed).ok, true)
  for (let index = 2; index <= 6; index += 1) completed[`annotations-${index}`] = { status: 'success' }
  assert.equal(validatePhaseTransition('dialogs-and-secondary', completed).ok, true)
  completed['dialogs-and-secondary'] = { status: 'success' }
  assert.equal(validatePhaseTransition('verify', completed).ok, true)
})

function validSnapshot() {
  return {
    targetAuthorized: true,
    pageCount: 1,
    pageName: 'Page 1',
    sections: SECTION_DEFINITIONS.map(item => ({ name: item.name, type: 'SECTION', parentType: 'PAGE', parentName: 'Page 1', owner: 'onda-one-page' })),
    annotationViews: ANNOTATION_SECTIONS.flatMap(annotation => annotation.views.map(view => ({ kind: annotation.kind, view: view.name }))),
    dialogStates: DIALOG_FAMILIES.flatMap(family => family.states.map(state => ({ family: family.name, state }))),
    componentSets: COMPONENT_DEFINITIONS.map(component => ({ id: component.id, variants: 2, autoLayout: true, bound: true })),
    instanceCount: 20,
    repeatedScreenInstanceCount: 8,
    foundation: { paintsValid: true, radiiValid: true, effectsValid: true, fontsValid: true, docsBound: true },
    intersections: [],
    clearance: 2000,
    overflowNodes: [],
    undersizedHitTargets: [],
    reactionCount: 4,
    requiredReactionCount: 4,
    baselineHash: 'abc',
    currentBaselineHash: 'abc',
    baselineMismatches: [],
    baselinePages: [{ id: 'page', name: 'Page 1', index: 0 }],
    currentPages: [{ id: 'page', name: 'Page 1', index: 0 }],
    phases: Object.fromEntries([
      'inspect', 'foundations', ...COMPONENT_DEFINITIONS.map(component => `component-${component.id}`),
      'core-views', ...Array.from({ length: 6 }, (_, index) => `annotations-${index + 1}`), 'dialogs-and-secondary',
    ].map(id => [id, { status: 'success' }])),
  }
}

test('verify hard pass closes every structural and safety false-pass independently', () => {
  const valid = validSnapshot()
  assert.equal(buildVerificationReport(valid).hardPass, true)
  const mutations = [
    snapshot => { snapshot.targetAuthorized = false },
    snapshot => { snapshot.pageCount = 2 },
    snapshot => { snapshot.currentBaselineHash = 'changed' },
    snapshot => { snapshot.sections[0].owner = '' },
    snapshot => { snapshot.sections[0].type = 'FRAME' },
    snapshot => { snapshot.sections[0].parentType = 'SECTION' },
    snapshot => { snapshot.annotationViews.pop() },
    snapshot => { snapshot.dialogStates.pop() },
    snapshot => { snapshot.componentSets[0].autoLayout = false },
    snapshot => { snapshot.instanceCount = 9 },
    snapshot => { snapshot.repeatedScreenInstanceCount = 0 },
    snapshot => { snapshot.foundation.docsBound = false },
    snapshot => { snapshot.intersections.push(['a', 'b']) },
    snapshot => { snapshot.clearance = 1999 },
    snapshot => { snapshot.overflowNodes.push('overflow') },
    snapshot => { snapshot.undersizedHitTargets.push('small') },
    snapshot => { snapshot.reactionCount = 3 },
    snapshot => { delete snapshot.phases['annotations-6'] },
  ]
  for (const mutate of mutations) {
    const snapshot = structuredClone(valid)
    mutate(snapshot)
    assert.equal(buildVerificationReport(snapshot).hardPass, false)
  }
})

test('foundation and component regeneration are update-or-create, never unconditional sample append', () => {
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  assert.match(runtime, /ensureRadiusSample/)
  assert.match(runtime, /rebindExistingComponent/)
  assert.doesNotMatch(runtime, /for \(const token of RADIUS_TOKENS\) \{\s*const sample = token\.geometry/s)
})

test('mutation context re-inspects when the current document or page changed after Inspect', () => {
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  assert.match(runtime, /documentId:\s*figma\.root\.id/)
  assert.match(runtime, /pageId:\s*page\.id/)
  assert.match(runtime, /inspection\.documentId\s*!==\s*figma\.root\.id/)
  assert.match(runtime, /inspection\.pageId\s*!==\s*page\.id/)
})
