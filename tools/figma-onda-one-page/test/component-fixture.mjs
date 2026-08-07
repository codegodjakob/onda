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

function variantProperties(definition) {
  const axes = new Map()
  for (const variant of definition.variants) {
    for (const part of variant.name.split(', ')) {
      const [name, value] = part.split('=')
      if (!axes.has(name)) axes.set(name, { key: `${name}#variant`, name, type: 'VARIANT', defaultValue: value, variantOptions: [] })
      if (!axes.get(name).variantOptions.includes(value)) axes.get(name).variantOptions.push(value)
    }
  }
  return [...axes.values()]
}

export function createValidComponentEvidence(foundation, definitions = COMPONENT_DEFINITIONS) {
  const semantic = name => variableId(foundation, 'Onda · Semantic · Light', name)
  const dimension = name => variableId(foundation, 'Onda · Dimension', name)
  const overlayStyle = foundation.effectStyles?.find(style => style.name === 'Onda/Shadow/Overlay' && style.owner === PLUGIN_ORIGIN) || null
  const section = { nodeId: 'section:components', name: '02 · Komponenten', type: 'SECTION', owner: PLUGIN_ORIGIN, parentId: 'page:1', parentType: 'PAGE', parentName: 'Page 1' }
  const ancestry = {
    containerId: section.nodeId, containerType: section.type, containerName: section.name, containerOwner: section.owner,
    containerParentId: section.parentId, containerParentType: section.parentType, containerParentName: section.parentName,
  }
  return definitions.map(definition => {
    const labelKey = 'Label#property'
    const variants = definition.variants.map((variantDefinition, variantIndex) => {
      const inverted = variantDefinition.surfaceToken === 'color/inverted'
      const textValue = variantDefinition.textToken === 'color/on-inverted' ? 1 : variantDefinition.textToken === 'color/text-muted' ? 0.45 : 0.08
      return {
        nodeId: `component:${definition.id}:${variantIndex}`,
        name: variantDefinition.name,
        owner: PLUGIN_ORIGIN,
        type: 'COMPONENT',
        parentId: `set:${definition.id}`,
        parentType: 'COMPONENT_SET',
        parentName: definition.name,
        layoutMode: definition.direction,
        width: definition.id === 'icon-button' ? 150 : 180,
        height: definition.targetHeight,
        cornerRadius: definition.radius,
        strokeWeight: variantDefinition.strokeWeight,
        opacity: variantDefinition.opacity,
        fills: boundPaint(semantic(variantDefinition.surfaceToken), inverted ? 0.08 : 1),
        strokes: boundPaint(semantic('color/border'), 0.82),
        effects: definition.effectStyleName ? structuredClone(overlayStyle?.effects || []) : [],
        effectStyleId: definition.effectStyleName ? overlayStyle?.id || null : null,
        effectStyleName: definition.effectStyleName || null,
        effectStyleOwner: definition.effectStyleName ? overlayStyle?.owner || null : null,
        fieldVariableIds: {
          itemSpacing: [dimension(definition.gapToken)],
          paddingTop: [dimension(definition.paddingTokens.top)],
          paddingLeft: [dimension(definition.paddingTokens.left)],
          paddingRight: [dimension(definition.paddingTokens.right)],
          paddingBottom: [dimension(definition.paddingTokens.bottom)],
          topLeftRadius: [dimension(definition.radiusToken)],
          topRightRadius: [dimension(definition.radiusToken)],
          bottomLeftRadius: [dimension(definition.radiusToken)],
          bottomRightRadius: [dimension(definition.radiusToken)],
        },
        dimensionValues: {
          itemSpacing: definition.gap,
          paddingTop: definition.padding.top,
          paddingRight: definition.padding.right,
          paddingBottom: definition.padding.bottom,
          paddingLeft: definition.padding.left,
          minHeight: definition.targetHeight,
        },
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
          fills: boundPaint(semantic(variantDefinition.textToken), textValue),
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
      ...ancestry,
      layoutMode: 'HORIZONTAL',
      effects: [],
      componentProperties: [{
        key: labelKey,
        name: 'Label',
        type: 'TEXT',
        defaultValue: definition.variants[0].copy[definition.labelRole],
      }, ...variantProperties(definition)],
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
        ...ancestry,
        mainComponentId: variants[0].nodeId,
        documentation: true,
        repeatedScreen: false,
        effects: [],
      },
    }
  })
}
