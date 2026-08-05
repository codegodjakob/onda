const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const ICONS = Object.freeze({
  plus: [['path', { d: 'M12 5v14M5 12h14' }]],
  settings: [
    ['path', { d: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z' }],
    ['path', { d: 'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3V9.6h.09A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.16.38.37.72.6 1 .28.31.67.5 1.1.5h.09v4h-.09c-.43 0-.82.19-1.1.5-.23.28-.44.62-.6 1Z' }],
  ],
  moon: [['path', { d: 'M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5 8.5 8.5 0 1 0 20.5 14.1Z' }]],
  sun: [
    ['circle', { cx: '12', cy: '12', r: '4' }],
    ['path', { d: 'M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42' }],
  ],
  'chevron-left': [['path', { d: 'm15 18-6-6 6-6' }]],
  'chevron-right': [['path', { d: 'm9 18 6-6-6-6' }]],
  'arrow-left': [['path', { d: 'M19 12H5M12 19l-7-7 7-7' }]],
  'arrow-right': [['path', { d: 'M5 12h14M12 5l7 7-7 7' }]],
  check: [['path', { d: 'm20 6-11 11-5-5' }]],
  x: [['path', { d: 'M18 6 6 18M6 6l12 12' }]],
  undo: [['path', { d: 'M9 14 4 9l5-5M4 9h9.5a6.5 6.5 0 0 1 0 13H10' }]],
  trash: [['path', { d: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3' }]],
  edit: [['path', { d: 'M4 20l1-4L16 5l3 3L8 19l-4 1ZM13.5 7.5l3 3' }]],
  search: [
    ['circle', { cx: '11', cy: '11', r: '7' }],
    ['path', { d: 'm20 20-4-4' }],
  ],
  message: [['path', { d: 'M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z' }]],
  source: [
    ['path', { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5Z' }],
    ['path', { d: 'M4 5.5v14M8 7h8M8 11h6' }],
  ],
  sparkle: [['path', { d: 'm12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2ZM19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7ZM5 14l.7 2.3L8 17l-2.3.7L5 20l-.7-2.3L2 17l2.3-.7Z' }]],
})

function svgElement(name, attributes = {}) {
  const node = document.createElementNS(SVG_NAMESPACE, name)
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value))
  return node
}

export function ondaIcon(name, { size = 20, label = '' } = {}) {
  const definition = ICONS[name]
  if (!definition) throw new Error(`Unbekanntes Onda-Symbol: ${name}`)
  const dimension = Number.isFinite(Number(size)) ? String(Number(size)) : '20'
  const svg = svgElement('svg', {
    viewBox: '0 0 24 24',
    width: dimension,
    height: dimension,
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '1.75',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    focusable: 'false',
  })
  if (label) {
    svg.setAttribute('role', 'img')
    svg.setAttribute('aria-label', label)
  } else {
    svg.setAttribute('aria-hidden', 'true')
  }
  definition.forEach(([tag, attributes]) => svg.append(svgElement(tag, attributes)))
  return svg
}

export function ondaIconNames() {
  return Object.freeze(Object.keys(ICONS))
}
