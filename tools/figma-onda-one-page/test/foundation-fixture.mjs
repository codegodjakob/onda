export const TEST_PALETTE = {
  'gray/000': { r: 1, g: 1, b: 1 },
  'gray/025': { r: 0.98, g: 0.98, b: 0.98 },
  'gray/050': { r: 0.95, g: 0.95, b: 0.95 },
  'gray/100': { r: 0.9, g: 0.9, b: 0.9 },
  'gray/200': { r: 0.82, g: 0.82, b: 0.82 },
  'gray/300': { r: 0.7, g: 0.7, b: 0.7 },
  'gray/500': { r: 0.45, g: 0.45, b: 0.45 },
  'gray/700': { r: 0.24, g: 0.24, b: 0.24 },
  'gray/900': { r: 0.08, g: 0.08, b: 0.08 },
  'gray/1000': { r: 0, g: 0, b: 0 },
}

export const TEST_ROLES = [
  { name: 'color/background', light: 'gray/025', dark: 'gray/1000', scopes: ['FRAME_FILL', 'SHAPE_FILL'] },
  { name: 'color/surface', light: 'gray/000', dark: 'gray/900', scopes: ['FRAME_FILL', 'SHAPE_FILL'] },
  { name: 'color/text', light: 'gray/900', dark: 'gray/000', scopes: ['TEXT_FILL'] },
  { name: 'color/text-muted', light: 'gray/500', dark: 'gray/300', scopes: ['TEXT_FILL'] },
  { name: 'color/border', light: 'gray/200', dark: 'gray/700', scopes: ['STROKE_COLOR'] },
  { name: 'color/inverted', light: 'gray/900', dark: 'gray/000', scopes: ['FRAME_FILL', 'SHAPE_FILL'] },
  { name: 'color/on-inverted', light: 'gray/000', dark: 'gray/900', scopes: ['TEXT_FILL'] },
]

export const TEST_TEXT_STYLES = [
  { role: 'Display', name: 'Onda/Type/Display', size: 40, weight: 700, lineHeight: 44 },
  { role: 'Heading', name: 'Onda/Type/Heading', size: 21, weight: 700, lineHeight: 28 },
  { role: 'Body', name: 'Onda/Type/Body', size: 15, weight: 400, lineHeight: 22 },
  { role: 'Body Strong', name: 'Onda/Type/Body Strong', size: 15, weight: 700, lineHeight: 22 },
  { role: 'Caption', name: 'Onda/Type/Caption', size: 12, weight: 500, lineHeight: 16 },
]

const COLLECTIONS = [
  ['Onda · Primitive', 'Value'],
  ['Onda · Dimension', 'Value'],
  ['Onda · Semantic · Light', 'Light'],
  ['Onda · Semantic · Dark', 'Dark'],
  ['Onda · Typography', 'Value'],
]

function slug(value) {
  return value.replaceAll(' · ', '-').replaceAll('/', '-').replaceAll(' ', '-').toLowerCase()
}

function variableId(collectionName, name) {
  return `variable:${slug(collectionName)}:${slug(name)}`
}

function collectionId(name) {
  return `collection:${slug(name)}`
}

function cssSyntax(collectionName, name) {
  const prefix = {
    'Onda · Primitive': 'primitive',
    'Onda · Dimension': 'dimension',
    'Onda · Semantic · Light': 'semantic-light',
    'Onda · Semantic · Dark': 'semantic-dark',
    'Onda · Typography': 'typography',
  }[collectionName]
  return `var(--${prefix}-${slug(name)})`
}

function labelVariable(layer, paintName) {
  const darkSemantic = layer === 'semantic-dark'
  const darkPaint = TEST_PALETTE[paintName].r < 0.55
  const collectionName = darkSemantic ? 'Onda · Semantic · Dark' : 'Onda · Semantic · Light'
  const name = darkSemantic === darkPaint ? 'color/text' : 'color/on-inverted'
  return variableId(collectionName, name)
}

export function createValidFoundationEvidence() {
  const collections = COLLECTIONS.map(([name, modeName]) => ({
    id: collectionId(name),
    name,
    owner: 'onda-one-page',
    modes: [{ modeId: `mode:${slug(name)}`, name: modeName }],
  }))
  const variables = []
  function addVariable(collectionName, name, resolvedType, scopes, value) {
    variables.push({
      id: variableId(collectionName, name),
      collectionId: collectionId(collectionName),
      collectionName,
      name,
      owner: 'onda-one-page',
      resolvedType,
      scopes,
      codeSyntax: { WEB: cssSyntax(collectionName, name) },
      modeId: `mode:${slug(collectionName)}`,
      value,
    })
  }
  for (const [name, value] of Object.entries(TEST_PALETTE)) addVariable('Onda · Primitive', name, 'COLOR', [], value)
  for (const role of TEST_ROLES) {
    addVariable('Onda · Semantic · Light', role.name, 'COLOR', role.scopes, {
      type: 'VARIABLE_ALIAS', id: variableId('Onda · Primitive', role.light),
    })
    addVariable('Onda · Semantic · Dark', role.name, 'COLOR', role.scopes, {
      type: 'VARIABLE_ALIAS', id: variableId('Onda · Primitive', role.dark),
    })
  }
  for (const value of [4, 8, 12, 16, 24, 32, 40]) addVariable('Onda · Dimension', `spacing/${value}`, 'FLOAT', ['GAP'], value)
  for (const [name, value] of [['radius/none', 0], ['radius/control', 4], ['radius/static', 6], ['radius/overlay', 8], ['radius/circle', 999]]) {
    addVariable('Onda · Dimension', name, 'FLOAT', ['CORNER_RADIUS'], value)
  }
  for (const size of [12, 15, 21, 40]) addVariable('Onda · Typography', `font-size/${size}`, 'FLOAT', ['FONT_SIZE'], size)
  for (const weight of [400, 500, 700]) addVariable('Onda · Typography', `font-weight/${weight}`, 'FLOAT', ['FONT_WEIGHT'], weight)

  const swatches = []
  for (const name of Object.keys(TEST_PALETTE)) {
    swatches.push({
      nodeId: `swatch:primitive:${name}`,
      name: `Swatch / ${name}`,
      parentName: 'Foundations / Graustufen',
      type: 'FRAME',
      fillVariableId: variableId('Onda · Primitive', name),
      labelName: `Swatch / ${name} / Label`,
      labelFillVariableId: labelVariable('primitive', name),
    })
  }
  for (const [collectionName, layer, key, parentName] of [
    ['Onda · Semantic · Light', 'semantic-light', 'light', 'Foundations / Semantic Light'],
    ['Onda · Semantic · Dark', 'semantic-dark', 'dark', 'Foundations / Semantic Dark'],
  ]) {
    for (const role of TEST_ROLES) {
      const name = `Swatch / ${layer} / ${role.name}`
      swatches.push({
        nodeId: `swatch:${layer}:${role.name}`,
        name,
        parentName,
        type: 'FRAME',
        fillVariableId: variableId(collectionName, role.name),
        labelName: `${name} / Label`,
        labelFillVariableId: labelVariable(layer, role[key]),
      })
    }
  }

  const spacingBars = [4, 8, 12, 16, 24, 32, 40].map(value => ({
    nodeId: `spacing:${value}`,
    name: `Spacing Bar / ${value}`,
    parentName: `Spacing / ${value}`,
    containerName: 'Foundations / Spacing',
    type: 'RECTANGLE',
    width: value,
    widthVariableId: variableId('Onda · Dimension', `spacing/${value}`),
  }))
  const radiusSamples = [
    ['radius/none', 0], ['radius/control', 4], ['radius/static', 6], ['radius/overlay', 8],
  ].map(([token, value]) => ({
    nodeId: `radius:${value}`,
    name: `Radius / ${value}`,
    parentName: 'Foundations / Radien',
    type: 'RECTANGLE',
    cornerRadius: value,
    boundVariableIds: Object.fromEntries(['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'].map(field => [field, variableId('Onda · Dimension', token)])),
  }))
  radiusSamples.push({
    nodeId: 'radius:999',
    name: 'Radius / 999',
    parentName: 'Foundations / Radien',
    type: 'ELLIPSE',
    width: 112,
    height: 112,
    boundVariableIds: {
      maxWidth: variableId('Onda · Dimension', 'radius/circle'),
      maxHeight: variableId('Onda · Dimension', 'radius/circle'),
    },
  })

  const fontDecision = {
    family: 'ABC Diatype',
    styles: { 400: 'Regular', 500: 'Medium', 700: 'Bold' },
  }
  const textStyles = TEST_TEXT_STYLES.map(definition => ({
    id: `text-style:${slug(definition.role)}`,
    name: definition.name,
    owner: 'onda-one-page',
    fontName: { family: fontDecision.family, style: fontDecision.styles[definition.weight] },
    fontSize: definition.size,
    lineHeight: { unit: 'PIXELS', value: definition.lineHeight },
    letterSpacing: { unit: 'PIXELS', value: 0 },
    textCase: 'ORIGINAL',
    textDecoration: 'NONE',
    boundVariableIds: {
      fontSize: variableId('Onda · Typography', `font-size/${definition.size}`),
      fontWeight: variableId('Onda · Typography', `font-weight/${definition.weight}`),
    },
  }))
  const textSpecimens = TEST_TEXT_STYLES.map((definition, index) => ({
    nodeId: `specimen:${slug(definition.role)}`,
    name: `Typografie / ${definition.role}`,
    parentName: 'Foundations / Typografie',
    type: 'TEXT',
    textStyleId: textStyles[index].id,
    boundVariableIds: { ...textStyles[index].boundVariableIds },
  }))
  const effectStyles = [{
    id: 'effect-style:overlay',
    name: 'Onda/Shadow/Overlay',
    owner: 'onda-one-page',
    effects: [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.16 },
      offset: { x: 0, y: 8 },
      radius: 24,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    }],
  }]
  const effectConsumers = [{
    nodeId: 'effect-card:overlay',
    name: 'Effect / Onda/Shadow/Overlay',
    parentName: 'Foundations / Effects',
    type: 'FRAME',
    effectStyleId: 'effect-style:overlay',
    fields: ['effectStyleId'],
  }]
  return {
    paintsValid: true,
    radiiValid: true,
    effectsValid: true,
    fontsValid: true,
    docsBound: true,
    fontDecision,
    collections,
    variables,
    swatches,
    spacingBars,
    radiusSamples,
    textStyles,
    textSpecimens,
    effectStyles,
    effectConsumers,
  }
}
