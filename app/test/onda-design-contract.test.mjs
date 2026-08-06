import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const tokensUrl = new URL('../src/onda-tokens.css', import.meta.url)
const styleUrl = new URL('../src/style.css', import.meta.url)
const shellUrl = new URL('../src/onda-shell.css', import.meta.url)
const annotationsUrl = new URL('../src/onda-annotations.css', import.meta.url)
const indexUrl = new URL('../index.html', import.meta.url)
const renderedControlUrls = [
  indexUrl,
  new URL('../src/ui.js', import.meta.url),
  new URL('../src/workspace.js', import.meta.url),
  new URL('../src/source-library-ui.mjs', import.meta.url),
  new URL('../src/research-ui.mjs', import.meta.url),
]

function ruleBody(css, selector) {
  const start = css.indexOf(selector)
  assert.notEqual(start, -1, `CSS-Regel fehlt: ${selector}`)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  return css.slice(open + 1, close)
}

test('Onda-Tokens besitzen genau vier Schriftgrößen und drei Gewichte', async () => {
  const css = await readFile(tokensUrl, 'utf8')
  const sizes = [...css.matchAll(/--text-(?:xs|base|xl|4xl):\s*([^;]+)/g)].map(match => match[1].trim())
  const weights = [...css.matchAll(/--fw-(?:regular|medium|bold):\s*([^;]+)/g)].map(match => match[1].trim())

  assert.deepEqual(sizes, ['12px', '15px', '21px', '40px'])
  assert.deepEqual(weights, ['400', '500', '700'])
  assert.equal(/Hanken|Literata|JetBrains|font-weight:\s*(?:600|800|900)/.test(css), false)
})

test('Sky, editoriale Grundflaechen, warme Overlays und Aura sind kanonisch definiert', async () => {
  const css = await readFile(tokensUrl, 'utf8')

  assert.match(css, /--sky-500:\s*#8db2c9/i)
  assert.match(css, /--radius-control:\s*8px/)
  assert.match(css, /--radius-card:\s*10px/)
  assert.match(css, /--radius-panel:\s*10px/)
  assert.match(css, /--radius-overlay:\s*16px/)
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

test('Grundflächen sind flach und Aura bleibt der KI vorbehalten', async () => {
  const [html, shell] = await Promise.all([
    readFile(indexUrl, 'utf8'),
    readFile(shellUrl, 'utf8'),
  ])

  assert.match(shell, /\.onda-app-shell\s*\{[^}]*gap:\s*0;[^}]*padding:\s*0;/s)
  assert.match(shell, /\.onda-library-sidebar\s*\{[^}]*border-right:\s*1px solid var\(--border-subtle\)/s)
  assert.match(shell, /body\.view-home #home\s*\{[^}]*border-radius:\s*var\(--radius-none\)/s)
  assert.match(shell, /#editorView \.onda-editor-col\s*\{[^}]*border-radius:\s*var\(--radius-none\)[^}]*box-shadow:\s*none/s)
  assert.equal((html.match(/class="onda-aura(?:\s|\")/g) || []).length, 1,
    'nur der echte KI-Einstieg #ondaAura darf eine Aura tragen')
})

test('Bibliothekszeilen gliedern sich durch Linien statt Kartenschatten', async () => {
  const shell = await readFile(shellUrl, 'utf8')

  assert.match(shell, /#home #doclist \.doc\s*\{[^}]*border-bottom:\s*1px solid var\(--border-subtle\)[^}]*box-shadow:\s*none/s)
  assert.doesNotMatch(shell, /#home #doclist \.doc:hover[^}]*box-shadow:/s)
})

test('Projektstruktur ist eine ruhige Liste statt eines Kartenstapels', async () => {
  const css = await readFile(styleUrl, 'utf8')
  const list = ruleBody(css, '.structure-nav-list')
  const preview = ruleBody(css, '\n.block-preview {\n  border-bottom:')
  const material = ruleBody(css, '#materialSources')

  assert.match(list, /gap:\s*0/)
  assert.match(preview, /border-bottom:\s*1px solid var\(--border-subtle\)/)
  assert.match(preview, /border-radius:\s*var\(--radius-none\)/)
  assert.match(preview, /box-shadow:\s*none/)
  assert.match(material, /border-radius:\s*var\(--radius-none\)/)
  assert.match(material, /box-shadow:\s*none/)
})

test('Alle kompakten Aktionen behalten mindestens 44 Pixel Trefferfläche', async () => {
  const [shell, annotations, css] = await Promise.all([
    readFile(shellUrl, 'utf8'),
    readFile(annotationsUrl, 'utf8'),
    readFile(styleUrl, 'utf8'),
  ])

  assert.match(ruleBody(shell, '.onda-library-nav__item,'), /min-height:\s*44px/)
  assert.match(ruleBody(shell, '.onda-library-recent__item {'), /min-height:\s*44px/)
  assert.match(ruleBody(annotations, '.onda-mode-switch button'), /min-height:\s*44px/)
  assert.match(ruleBody(annotations, '.onda-review-control, .onda-review-icon'), /min-height:\s*44px/)
  assert.match(ruleBody(css, '.agent-chat-send,\n.surface-close'), /width:\s*44px;\s*height:\s*44px/)
  assert.match(ruleBody(css, '.suggestion-action {'), /width:\s*44px;\s*height:\s*44px/)
  assert.match(ruleBody(css, '.onda-btn {'), /min-height:\s*44px/)
  assert.match(ruleBody(css, '.onda-icon-btn {'), /width:\s*44px;\s*height:\s*44px/)
})

test('Nur echte Ebenen tragen Schatten und der Modusumschalter bleibt eine Pille', async () => {
  const [annotations, css] = await Promise.all([
    readFile(annotationsUrl, 'utf8'),
    readFile(styleUrl, 'utf8'),
  ])
  const modeSwitch = ruleBody(annotations, '.onda-mode-switch {')
  const projectUnderstanding = ruleBody(css, '#pvCard {')
  const extension = ruleBody(css, '.onda-erw {')

  assert.match(modeSwitch, /border-radius:\s*var\(--radius-pill\)/)
  assert.match(projectUnderstanding, /box-shadow:\s*none/)
  assert.match(extension, /box-shadow:\s*none/)
})

test('Anmerkungen trennen ruhige Steuerung von schwebender Detailfläche', async () => {
  const css = await readFile(annotationsUrl, 'utf8')
  const reviewBar = ruleBody(css, '.onda-review-bar')
  const annotation = ruleBody(css, '\n.onda-annotation {\n')

  assert.match(reviewBar, /border-radius:\s*var\(--radius-panel\)/)
  assert.doesNotMatch(reviewBar, /box-shadow:/)
  assert.match(annotation, /border-radius:\s*var\(--radius-overlay\)/)
  assert.match(annotation, /box-shadow:\s*var\(--shadow-md\)/)
  assert.doesNotMatch(annotation, /shadow-glow/)
})

test('Echte Popups nutzen Overlay-Radius und neutrale Tiefe ohne Aura', async () => {
  const css = await readFile(styleUrl, 'utf8')
  const localFinding = ruleBody(css, '.local-finding.is-expanded')
  const floatingTools = ruleBody(css, '#agentWidget,\n#evidenceWindow')
  const dialog = ruleBody(css, '.onda-dialog {')

  for (const [name, body] of [
    ['Anmerkungsdetail', localFinding],
    ['Agentenfenster', floatingTools],
    ['Dialog', dialog],
  ]) {
    assert.match(body, /border-radius:\s*var\(--radius-overlay\)/, `${name} braucht den Overlay-Radius`)
    assert.match(body, /box-shadow:\s*var\(--shadow-(?:md|lg)\)/, `${name} braucht neutrale Tiefe`)
    assert.doesNotMatch(body, /shadow-glow/, `${name} darf nicht wie der KI-Einstieg leuchten`)
  }
})
