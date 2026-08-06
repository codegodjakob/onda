import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as plan from '../src/plan.mjs'
import { createValidFoundationEvidence } from './foundation-fixture.mjs'

const ROOT = resolve(import.meta.dirname, '..')

function validate(evidence) {
  assert.equal(typeof plan.validateFoundationEvidence, 'function', 'validateFoundationEvidence must be exported')
  return plan.validateFoundationEvidence(evidence)
}

function expectInvalid(base, mutate, label) {
  const candidate = structuredClone(base)
  mutate(candidate)
  const result = validate(candidate)
  assert.equal(result.valid, false, label)
  assert.ok(result.errors.length > 0, `${label}: error evidence required`)
}

test('strict foundation fixture passes the pure validator with no self-asserted counters', () => {
  assert.deepEqual(validate(createValidFoundationEvidence()), { valid: true, errors: [] })
})

test('every collection mode and every variable syntax, type, scope, value, alias, missing, and duplicate is independently rejected', () => {
  const base = createValidFoundationEvidence()
  for (const [index, collection] of base.collections.entries()) {
    expectInvalid(base, value => { value.collections[index].modes[0].name = 'Wrong' }, `${collection.name}: wrong mode`)
    expectInvalid(base, value => { value.collections.splice(index, 1) }, `${collection.name}: missing`)
    expectInvalid(base, value => { value.collections.push(structuredClone(value.collections[index])) }, `${collection.name}: duplicate`)
  }
  for (const [index, variable] of base.variables.entries()) {
    const label = `${variable.collectionName}/${variable.name}`
    expectInvalid(base, value => { value.variables[index].codeSyntax.WEB = 'var(--wrong)' }, `${label}: wrong code syntax`)
    expectInvalid(base, value => { value.variables[index].resolvedType = variable.resolvedType === 'COLOR' ? 'FLOAT' : 'COLOR' }, `${label}: wrong type`)
    expectInvalid(base, value => { value.variables[index].scopes = ['ALL_SCOPES'] }, `${label}: wrong scopes`)
    expectInvalid(base, value => { value.variables[index].modeId = 'mode:wrong' }, `${label}: wrong mode id`)
    expectInvalid(base, value => {
      const current = value.variables[index].value
      value.variables[index].value = typeof current === 'number'
        ? current + 1
        : current?.type === 'VARIABLE_ALIAS'
          ? { ...current, id: 'variable:wrong' }
          : { ...current, r: current.r === 1 ? 0.99 : current.r + 0.01 }
    }, `${label}: wrong value or alias`)
    expectInvalid(base, value => { value.variables.splice(index, 1) }, `${label}: missing`)
    expectInvalid(base, value => { value.variables.push(structuredClone(value.variables[index])) }, `${label}: duplicate`)
  }
})

test('all 24 swatches reject missing, duplicate, wrong token name, and wrong real fill binding', () => {
  const base = createValidFoundationEvidence()
  for (const [index, swatch] of base.swatches.entries()) {
    expectInvalid(base, value => { value.swatches[index].fillVariableId = 'variable:wrong' }, `${swatch.name}: wrong fill binding`)
    expectInvalid(base, value => { value.swatches[index].labelFillVariableId = 'variable:wrong' }, `${swatch.name}: wrong label binding`)
    expectInvalid(base, value => { value.swatches[index].name = `${swatch.name} wrong` }, `${swatch.name}: wrong token name`)
    expectInvalid(base, value => { value.swatches.splice(index, 1) }, `${swatch.name}: missing`)
    expectInvalid(base, value => { value.swatches.push(structuredClone(value.swatches[index])) }, `${swatch.name}: duplicate`)
  }
})

test('all spacing and radius artifacts reject missing, duplicate, wrong token, geometry, value, and VariableId bindings', () => {
  const base = createValidFoundationEvidence()
  for (const [index, bar] of base.spacingBars.entries()) {
    expectInvalid(base, value => { value.spacingBars[index].widthVariableId = 'variable:wrong' }, `${bar.name}: wrong binding`)
    expectInvalid(base, value => { value.spacingBars[index].width += 1 }, `${bar.name}: wrong width`)
    expectInvalid(base, value => { value.spacingBars[index].name = `${bar.name} wrong` }, `${bar.name}: wrong token`)
    expectInvalid(base, value => { value.spacingBars.splice(index, 1) }, `${bar.name}: missing`)
    expectInvalid(base, value => { value.spacingBars.push(structuredClone(value.spacingBars[index])) }, `${bar.name}: duplicate`)
  }
  for (const [index, sample] of base.radiusSamples.entries()) {
    const field = sample.type === 'ELLIPSE' ? 'maxWidth' : 'topLeftRadius'
    expectInvalid(base, value => { value.radiusSamples[index].boundVariableIds[field] = 'variable:wrong' }, `${sample.name}: wrong binding`)
    expectInvalid(base, value => { value.radiusSamples[index].type = sample.type === 'ELLIPSE' ? 'RECTANGLE' : 'ELLIPSE' }, `${sample.name}: wrong geometry`)
    expectInvalid(base, value => { value.radiusSamples[index].name = `${sample.name} wrong` }, `${sample.name}: wrong token`)
    expectInvalid(base, value => { value.radiusSamples.splice(index, 1) }, `${sample.name}: missing`)
    expectInvalid(base, value => { value.radiusSamples.push(structuredClone(value.radiusSamples[index])) }, `${sample.name}: duplicate`)
  }
})

test('each text style and specimen rejects wrong name, font decision, size, line height, typography mapping, link, missing, and duplicate', () => {
  const base = createValidFoundationEvidence()
  for (const [index, style] of base.textStyles.entries()) {
    expectInvalid(base, value => { value.textStyles[index].name = `${style.name} wrong` }, `${style.name}: wrong name`)
    expectInvalid(base, value => { value.textStyles[index].fontName.family = 'Wrong Font' }, `${style.name}: wrong family`)
    expectInvalid(base, value => { value.textStyles[index].fontName.style = 'Wrong Style' }, `${style.name}: wrong style`)
    expectInvalid(base, value => { value.textStyles[index].fontSize += 1 }, `${style.name}: wrong size`)
    expectInvalid(base, value => { value.textStyles[index].lineHeight.value += 1 }, `${style.name}: wrong line height`)
    expectInvalid(base, value => { value.textStyles[index].letterSpacing.value = 1 }, `${style.name}: wrong letter spacing`)
    expectInvalid(base, value => { value.textStyles[index].boundVariableIds.fontSize = 'variable:wrong' }, `${style.name}: wrong size variable`)
    expectInvalid(base, value => { value.textStyles[index].boundVariableIds.fontWeight = 'variable:wrong' }, `${style.name}: wrong weight variable`)
    expectInvalid(base, value => { value.textStyles.splice(index, 1) }, `${style.name}: missing`)
    expectInvalid(base, value => { value.textStyles.push(structuredClone(value.textStyles[index])) }, `${style.name}: duplicate`)
  }
  for (const [index, specimen] of base.textSpecimens.entries()) {
    expectInvalid(base, value => { value.textSpecimens[index].textStyleId = 'text-style:wrong' }, `${specimen.name}: wrong style link`)
    expectInvalid(base, value => { value.textSpecimens[index].boundVariableIds.fontSize = 'variable:wrong' }, `${specimen.name}: wrong size mapping`)
    expectInvalid(base, value => { value.textSpecimens[index].boundVariableIds.fontWeight = 'variable:wrong' }, `${specimen.name}: wrong weight mapping`)
    expectInvalid(base, value => { value.textSpecimens.splice(index, 1) }, `${specimen.name}: missing`)
    expectInvalid(base, value => { value.textSpecimens.push(structuredClone(value.textSpecimens[index])) }, `${specimen.name}: duplicate`)
  }
})

test('overlay effect rejects every wrong style, shadow property, consumer, missing, and duplicate independently', () => {
  const base = createValidFoundationEvidence()
  const mutations = [
    ['wrong name', value => { value.effectStyles[0].name = 'Onda/Shadow/Wrong' }],
    ['wrong effect type', value => { value.effectStyles[0].effects[0].type = 'INNER_SHADOW' }],
    ['non-gray color', value => { value.effectStyles[0].effects[0].color.r = 0.1 }],
    ['wrong alpha', value => { value.effectStyles[0].effects[0].color.a = 0.15 }],
    ['wrong offset x', value => { value.effectStyles[0].effects[0].offset.x = 1 }],
    ['wrong offset y', value => { value.effectStyles[0].effects[0].offset.y = 7 }],
    ['wrong radius', value => { value.effectStyles[0].effects[0].radius = 23 }],
    ['wrong spread', value => { value.effectStyles[0].effects[0].spread = 1 }],
    ['hidden', value => { value.effectStyles[0].effects[0].visible = false }],
    ['wrong blend', value => { value.effectStyles[0].effects[0].blendMode = 'MULTIPLY' }],
    ['extra effect', value => { value.effectStyles[0].effects.push(structuredClone(value.effectStyles[0].effects[0])) }],
    ['missing style', value => { value.effectStyles = [] }],
    ['duplicate style', value => { value.effectStyles.push(structuredClone(value.effectStyles[0])) }],
    ['wrong consumer style', value => { value.effectConsumers[0].effectStyleId = 'effect-style:wrong' }],
    ['wrong consumer name', value => { value.effectConsumers[0].name = 'Static Surface' }],
    ['missing consumer', value => { value.effectConsumers = [] }],
    ['duplicate consumer', value => { value.effectConsumers.push(structuredClone(value.effectConsumers[0])) }],
  ]
  for (const [label, mutate] of mutations) expectInvalid(base, mutate, label)
})

test('verification report hard-gates the pure strict foundation result', () => {
  const source = readFileSync(resolve(ROOT, 'src/plan.mjs'), 'utf8')
  assert.match(source, /validateFoundationEvidence\(foundation\)/)
  assert.match(source, /foundationStrict\.valid/)
})

test('runtime gathers real API properties and deterministic node names instead of trusting artifact pluginData counters', () => {
  const runtime = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  const start = runtime.indexOf('async function collectFoundationEvidence')
  const end = runtime.indexOf('async function runVerify')
  const collector = runtime.slice(start, end)
  assert.match(collector, /valuesByMode/)
  assert.match(collector, /codeSyntax/)
  assert.match(collector, /boundVariables/)
  assert.match(collector, /fontName/)
  assert.match(collector, /lineHeight/)
  assert.match(collector, /getStyleConsumersAsync/)
  assert.doesNotMatch(collector, /ondaBoundVariableId|ondaFoundationLayer|ondaTextStyleName|ondaEffectStyleName/)
})
