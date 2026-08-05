import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const tokensUrl = new URL('../src/onda-tokens.css', import.meta.url)
const styleUrl = new URL('../src/style.css', import.meta.url)
const indexUrl = new URL('../index.html', import.meta.url)
const renderedControlUrls = [
  indexUrl,
  new URL('../src/ui.js', import.meta.url),
  new URL('../src/workspace.js', import.meta.url),
  new URL('../src/source-library-ui.mjs', import.meta.url),
  new URL('../src/research-ui.mjs', import.meta.url),
]

test('Onda-Tokens besitzen genau vier Schriftgrößen und drei Gewichte', async () => {
  const css = await readFile(tokensUrl, 'utf8')
  const sizes = [...css.matchAll(/--text-(?:xs|base|xl|4xl):\s*([^;]+)/g)].map(match => match[1].trim())
  const weights = [...css.matchAll(/--fw-(?:regular|medium|bold):\s*([^;]+)/g)].map(match => match[1].trim())

  assert.deepEqual(sizes, ['12px', '15px', '21px', '40px'])
  assert.deepEqual(weights, ['400', '500', '700'])
  assert.equal(/Hanken|Literata|JetBrains|font-weight:\s*(?:600|800|900)/.test(css), false)
})

test('Sky, 24-Pixel-Flächen, Pillen und Aura sind kanonisch definiert', async () => {
  const css = await readFile(tokensUrl, 'utf8')

  assert.match(css, /--sky-500:\s*#8db2c9/i)
  assert.match(css, /--radius-(?:card|panel):\s*24px/)
  assert.match(css, /--radius-control:\s*var\(--radius-full\)/)
  assert.match(css, /--gradient-aura:\s*linear-gradient/)
  assert.match(css, /--danger:\s*var\(--red-500\)/)
})

test('Tokenquelle wird vor Kompatibilitäts- und Komponenten-CSS geladen', async () => {
  const html = await readFile(indexUrl, 'utf8')
  const tokens = html.indexOf('src/onda-tokens.css')
  const legacy = html.indexOf('src/style.css')

  assert.ok(tokens >= 0)
  assert.ok(legacy > tokens)
})

test('Legacy-Styles laden keine zweite Schriftfamilie mehr', async () => {
  const css = await readFile(styleUrl, 'utf8')
  assert.equal(/Hanken Grotesk|Literata|JetBrains Mono/.test(css), false)
  assert.equal(/@font-face/.test(css), false)
})

test('Onda-Icons verwenden die eine Linienregel und zugängliche Namen', async () => {
  const previousDocument = globalThis.document
  class FakeElement {
    constructor(tagName) {
      this.tagName = tagName
      this.attributes = new Map()
      this.children = []
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)) }
    getAttribute(name) { return this.attributes.get(name) ?? null }
    append(...nodes) { this.children.push(...nodes) }
  }
  globalThis.document = { createElementNS: (_namespace, tag) => new FakeElement(tag) }
  try {
    const { ondaIcon } = await import('../src/onda-icons.mjs')
    const icon = ondaIcon('settings', { size: 18, label: 'Einstellungen' })
    assert.equal(icon.tagName, 'svg')
    assert.equal(icon.getAttribute('viewBox'), '0 0 24 24')
    assert.equal(icon.getAttribute('fill'), 'none')
    assert.equal(icon.getAttribute('stroke-width'), '1.75')
    assert.equal(icon.getAttribute('stroke-linecap'), 'round')
    assert.equal(icon.getAttribute('stroke-linejoin'), 'round')
    assert.equal(icon.getAttribute('aria-label'), 'Einstellungen')
  } finally {
    globalThis.document = previousDocument
  }
})

test('Gerenderte Bedienelemente verwenden keine Unicode-Ersatzsymbole', async () => {
  const sources = (await Promise.all(renderedControlUrls.map(url => readFile(url, 'utf8')))).join('\n')
  const forbidden = [
    /<button[^>]*>\s*[‹›☀☾⚙×✓✎→+]\s*</,
    /createNode\(\s*['"]button['"][^\n]*['"][×✓✎→+]['"]\s*\)/,
    /\.textContent\s*=\s*[^\n]*['"][☀☾]['"]/
  ]
  forbidden.forEach(pattern => assert.doesNotMatch(sources, pattern))
})

test('Sky ist der einzige auswählbare Akzent', async () => {
  const [html, css, workspace] = await Promise.all([
    readFile(indexUrl, 'utf8'),
    readFile(styleUrl, 'utf8'),
    readFile(new URL('../src/workspace.js', import.meta.url), 'utf8'),
  ])
  assert.doesNotMatch(`${html}\n${css}\n${workspace}`, /accentToggle|onda-accent-menu|ONDA_ACCENTS|data-accent="(?:sage|blue|clay|lavender|sand)"/)
})
