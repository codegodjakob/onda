import { COMPONENT_DEFINITIONS, PLUGIN_ORIGIN } from '../src/definitions.mjs'

function variableId(foundation, collectionName, name) {
  const variable = foundation.variables.find(item => item.collectionName === collectionName && item.name === name)
  if (!variable) throw new Error(`Fixture variable missing: ${collectionName}/${name}`)
  return variable.id
}

function boundPaint(variableIdValue, value) {
  return [{
    index: 0,
    type: 'SOLID',
    variableIds: [variableIdValue],
    color: { r: value, g: value, b: value },
  }]
}

export function createValidComponentEvidence(foundation) {
  const semantic = name => variableId(foundation, 'Onda · Semantic · Light', name)
  const dimension = name => variableId(foundation, 'Onda · Dimension', name)
  const section = { nodeId: 'section:components', name: '02 · Komponenten', type: 'SECTION' }
  return COMPONENT_DEFINITIONS.map(definition => {
    const labelKey = 'Label#property'
    const variants = definition.variants.map((variantDefinition, variantIndex) => {
      const inverted = variantDefinition.surfaceToken === 'color/inverted'
      return {
        nodeId: `component:${definition.id}:${variantIndex}`,
        name: variantDefinition.name,
        owner: PLUGIN_ORIGIN,
        type: 'COMPONENT',
        parentId: `set:${definition.id}`,
        parentType: 'COMPONENT_SET',
        parentName: definition.name,
        layoutMode: 'HORIZONTAL',
        width: definition.id === 'icon-button' ? 150 : 180,
        height: definition.targetHeight,
        cornerRadius: definition.radius,
        strokeWeight: variantDefinition.name.includes('Focus') ? 2 : 1,
        opacity: variantDefinition.name.includes('Disabled') ? 0.45 : 1,
        fills: boundPaint(semantic(variantDefinition.surfaceToken), inverted ? 0.08 : 1),
        strokes: boundPaint(semantic('color/border'), 0.82),
        effects: [],
        fieldVariableIds: {
          itemSpacing: [dimension('spacing/8')],
          paddingTop: [dimension('spacing/12')],
          paddingLeft: [dimension('spacing/16')],
          paddingRight: [dimension('spacing/16')],
          paddingBottom: [dimension('spacing/12')],
          topLeftRadius: [dimension(definition.radiusToken)],
          topRightRadius: [dimension(definition.radiusToken)],
          bottomLeftRadius: [dimension(definition.radiusToken)],
          bottomRightRadius: [dimension(definition.radiusToken)],
        },
        dimensionValues: { itemSpacing: 8, paddingTop: 12, paddingRight: 16, paddingBottom: 12, paddingLeft: 16, minHeight: 44 },
        roles: definition.roles.map((roleDefinition, roleIndex) => ({
          nodeId: `role:${definition.id}:${variantIndex}:${roleIndex}`,
          name: `Role/${roleDefinition.name}`,
          owner: PLUGIN_ORIGIN,
          type: roleDefinition.type,
          parentId: `component:${definition.id}:${variantIndex}`,
          parentType: 'COMPONENT',
          parentName: variantDefinition.name,
          characters: roleDefinition.type === 'TEXT' ? variantDefinition.copy[roleDefinition.name] : null,
          width: roleDefinition.type === 'ELLIPSE' ? 16 : 80,
          height: roleDefinition.type === 'ELLIPSE' ? 16 : 22,
          fills: boundPaint(semantic(variantDefinition.textToken), inverted ? 1 : 0.08),
          effects: [],
          fieldVariableIds: roleDefinition.type === 'ELLIPSE' ? {
            maxWidth: [dimension('radius/circle')],
            maxHeight: [dimension('radius/circle')],
          } : {},
          characterPropertyKey: roleDefinition.name === definition.labelRole ? labelKey : null,
        })),
      }
    })
    return {
      id: definition.id,
      nodeId: `set:${definition.id}`,
      name: definition.name,
      owner: PLUGIN_ORIGIN,
      type: 'COMPONENT_SET',
      parentId: section.nodeId,
      parentType: section.type,
      parentName: section.name,
      layoutMode: 'HORIZONTAL',
      effects: [],
      componentProperties: [{
        key: labelKey,
        name: 'Label',
        type: 'TEXT',
        defaultValue: definition.variants[0].copy[definition.labelRole],
      }],
      variants,
      sampleCount: 1,
      sample: {
        nodeId: `sample:${definition.id}`,
        name: `${definition.name} / Dokumentationsinstanz`,
        owner: PLUGIN_ORIGIN,
        type: 'INSTANCE',
        parentId: section.nodeId,
        parentType: section.type,
        parentName: section.name,
        mainComponentId: variants[0].nodeId,
        documentation: true,
        repeatedScreen: false,
        effects: [],
      },
    }
  })
}
