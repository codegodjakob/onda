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
  // Seit dem 7. August 2026 ist #materialSources kein Listeneintrag mehr, sondern der
  // NAME des Abschnitts (Jakob: drei Abschnitte, zwei Gesten je Kopfzeile). Die
  // Eigenschaft, um die es hier geht, wandert deshalb mit: die Kopfzeile ist eine
  // flache Fläche und kein Kärtchen — kein Rahmen, kein Schatten.
  const name = ruleBody(css, '.onda-side-name {')

  assert.match(list, /gap:\s*0/)
  assert.match(preview, /border-bottom:\s*1px solid var\(--border-subtle\)/)
  assert.match(preview, /border-radius:\s*var\(--radius-none\)/)
  assert.match(preview, /box-shadow:\s*none/)
  assert.match(name, /border:\s*0/)
  assert.match(name, /box-shadow:\s*none/)
  assert.match(name, /background:\s*transparent/)
})

test('Alle kompakten Aktionen behalten mindestens 44 Pixel Trefferfläche', async () => {
  const [shell, annotations, css] = await Promise.all([
    readFile(shellUrl, 'utf8'),
    readFile(annotationsUrl, 'utf8'),
    readFile(styleUrl, 'utf8'),
  ])

  assert.match(ruleBody(shell, '.onda-library-nav__item,'), /min-height:\s*44px/)
  assert.match(ruleBody(shell, '.onda-library-recent__item {'), /min-height:\s*44px/)
  // Der Stift ist klein gezeichnet, aber nicht klein zu treffen: 18px Symbol in einer
  // 44px-Flaeche. Er hat die Trefferflaeche der gesamten Anmerkungsleiste geerbt, die
  // hier bis zum 7. August 2026 stand (docs/PHILOSOPHIE.md §1).
  assert.match(ruleBody(css, '.onda-presence {'), /width:\s*44px;\s*height:\s*44px/)
  assert.match(ruleBody(css, '.agent-chat-send,\n.surface-close'), /width:\s*44px;\s*height:\s*44px/)
  assert.match(ruleBody(css, '.suggestion-action {'), /width:\s*44px;\s*height:\s*44px/)
  assert.match(ruleBody(css, '.onda-btn {'), /min-height:\s*44px/)
  assert.match(ruleBody(css, '.onda-icon-btn {'), /width:\s*44px;\s*height:\s*44px/)
  // Der Quellenbaum wiederholt die zwei Gesten der Abschnittszeile eine Ebene tiefer.
  // Beide Flaechen messen 44px: leichter wird die Gruppenzeile durch Schriftgrad und
  // Farbe, nicht durch eine Trefferflaeche, die der Finger verfehlt.
  assert.match(ruleBody(css, '.onda-baum-pfeil {'), /width:\s*44px;\s*height:\s*44px/)
  assert.match(ruleBody(css, '.onda-baum-name {'), /min-height:\s*44px/)
  // Das Blatt zwischen den beiden Geschwistern: die Quellenzeile ist ein echter Knopf
  // (type=button, aria-haspopup=dialog, sie oeffnet das Quellen-Fenster) und stand
  // trotzdem auf 32px — die einzige Bedienflaeche im Haus unter der eigenen Grenze.
  assert.match(ruleBody(css, '.onda-baum-quelle {'), /min-height:\s*44px/)
})

test('Nur echte Ebenen tragen Schatten', async () => {
  const css = await readFile(styleUrl, 'utf8')
  // #pvCard war eine Kachel, .onda-erw eine Erweiterungs-Karte. Beide Flächen gibt es
  // nicht mehr: die Kachel ist der Abschnittsname geworden, die Karte spricht im Chat.
  // Was bleibt, ist die Regel — in der Seitenleiste liegt nichts übereinander, also
  // trägt dort auch nichts einen Schatten.
  const sectionName = ruleBody(css, '.onda-side-name {')
  const treeEntry = ruleBody(css, '.onda-baum-quelle {')
  const treeGroup = ruleBody(css, '.onda-baum-name {')

  // POSITIV geprueft, nicht negativ. `doesNotMatch(/box-shadow: var(--shadow/)` stand
  // hier einmal fuer beide Baumzeilen — und war nicht zu brechen, weil in keiner der
  // beiden Regeln ueberhaupt eine box-shadow-Zeile steht. Eine Zusicherung, die nicht
  // fehlschlagen kann, nagelt nichts fest. Also muss `box-shadow: none` dastehen: dann
  // faellt die Pruefung, sobald jemand die Zeile herausnimmt oder einen Schatten setzt.
  assert.match(sectionName, /box-shadow:\s*none/)
  assert.match(treeEntry, /box-shadow:\s*none/)
  // Die Gruppenzeile ist eine Flaeche, kein Kaertchen: kein Rahmen, kein Schatten,
  // kein eigener Grund. Die Ebene traegt die Einrueckung, nicht ein Kasten.
  assert.match(treeGroup, /border:\s*0/)
  assert.match(treeGroup, /background:\s*transparent/)
  assert.match(treeGroup, /box-shadow:\s*none/)
})

test('Anmerkungen trennen ruhiges Zeichen von schwebender Detailfläche', async () => {
  const [annotations, css] = await Promise.all([
    readFile(annotationsUrl, 'utf8'),
    readFile(styleUrl, 'utf8'),
  ])
  const zeichen = ruleBody(css, '.onda-presence {')
  const annotation = ruleBody(annotations, '\n.onda-annotation {\n')

  // Das Zeichen ist keine Flaeche: kein Grund, keine Kante, kein Schatten. Es steht in
  // der Topbar wie ein Stift auf dem Tisch (docs/PHILOSOPHIE.md §1).
  assert.match(zeichen, /background:\s*transparent/)
  assert.match(zeichen, /border:\s*0/)
  assert.doesNotMatch(zeichen, /box-shadow:/)

  // Die Anmerkung schwebte bis zum 8.8.2026: Kante, Grund, Schatten. Sie tut es nicht
  // mehr. Der Grund ist nicht Geschmack, sondern eine Aussage, die nicht stimmte —
  // eine schwebende Karte behauptet „hier ist ein Fenster ÜBER deinem Text", und die
  // Anmerkung liegt nicht über dem Text, sie steht daneben. Was sie unterscheidet,
  // sind Spalte, Schriftgröße und Farbe. Seit die Markierung im Text selbst sagt,
  // welche Stelle gemeint ist, muss die Karte es nicht mehr durch Gewicht behaupten.
  // (Entwurf: app/anmerkungs-varianten.html, von Jakob am 8.8.2026 angenommen.)
  assert.match(annotation, /border:\s*0/)
  assert.match(annotation, /background:\s*transparent/)
  assert.match(annotation, /box-shadow:\s*none/)
  assert.doesNotMatch(annotation, /shadow-glow/)

  // Drei Formen liegen WIRKLICH über dem Text — sie erscheinen am Wort, nicht in der
  // Nebenspalte. Ohne eigene Fläche läsen sich zwei Schriften übereinander. Sie holen
  // sich zurück, was die Anmerkung abgelegt hat; ohne diese Prüfung fiele das beim
  // nächsten Aufräumen still mit weg.
  assert.match(ruleBody(annotations, '\n.onda-annotation.aura-corr__pop {'), /background:\s*var\(--bg-surface\)/)
  assert.match(ruleBody(annotations, '\n.onda-annotation.aura-ins__pop {'), /background:\s*var\(--bg-surface\)/)
  assert.match(ruleBody(annotations, '\n.aura-slot {'), /border:\s*1px dashed/)
})

test('Über dem Text steht keine Leiste — das Zeichen zählt nicht und trägt trotzdem den vollen Wortlaut', async () => {
  const [html, annotations, shell, workspace] = await Promise.all([
    readFile(indexUrl, 'utf8'),
    readFile(annotationsUrl, 'utf8'),
    readFile(shellUrl, 'utf8'),
    readFile(new URL('../src/workspace.js', import.meta.url), 'utf8'),
  ])

  // Der Grundsatz, hart geprüft: die Leiste und alle fünf Bedienelemente sind fort.
  // Was hier wieder auftaucht, hat docs/PHILOSOPHIE.md §1 gebrochen.
  for (const spur of [
    'annotationReviewBar',
    'annotationReviewSummary',
    'annotationQuietToggle',
    'annotationBulkAccept',
    'annotationUndo',
    'annotationPrevious',
    'annotationNext',
    'data-annotation-mode',
  ]) {
    assert.doesNotMatch(html, new RegExp(spur), `Die Anmerkungsleiste ist zurück: ${spur}`)
  }
  for (const regel of ['.onda-review-bar', '.onda-mode-switch', '.onda-review-control']) {
    assert.equal(annotations.includes(`${regel} {`), false, `CSS der Anmerkungsleiste ist zurück: ${regel}`)
    assert.equal(shell.includes(`${regel} {`), false, `CSS der Anmerkungsleiste ist zurück: ${regel}`)
  }

  // Genau EIN Bedienelement für Anmerkungen, und es blendet sie nur aus und ein.
  assert.match(html, /id="annotationPresence"/)
  assert.match(workspace, /getElementById\('annotationPresence'\), 'click', toggleQuietAnnotations/)

  // Für die Augen keine Zahl, für Vorlesegeräte der volle Wortlaut. Beides muss
  // gleichzeitig gelten — sonst ist die Ruhe eine Auslassung.
  const zeichnen = workspace.slice(workspace.indexOf('function renderAnnotationPresence'))
    .slice(0, workspace.slice(workspace.indexOf('function renderAnnotationPresence')).indexOf('\n}\n') + 3)
  assert.doesNotMatch(zeichnen, /textContent\s*=/, 'Das Zeichen schreibt Text — es soll nur ein Stift sein')
  assert.match(zeichnen, /aria-label/)
  assert.match(zeichnen, /bilanzVorlesetext/)
})

test('Die Ankunft einer Anmerkung ist langsamer als jede andere Bewegung im Haus', async () => {
  const [tokens, annotations, css] = await Promise.all([
    readFile(tokensUrl, 'utf8'),
    readFile(annotationsUrl, 'utf8'),
    readFile(styleUrl, 'utf8'),
  ])

  const dauer = Number(tokens.match(/--dur-ankunft:\s*(\d+)ms/)?.[1])
  const versatz = Number(tokens.match(/--versatz-ankunft:\s*(\d+)ms/)?.[1])
  const langsamste = Math.max(...[...tokens.matchAll(/--dur-(?:fast|quick|normal|slow|slower):\s*(\d+)ms/g)]
    .map(treffer => Number(treffer[1])))

  // "Das soll nicht so plötzlich kommen" — messbar gemacht: die Ankunft ist länger als
  // jede andere Dauer im Haus (docs/PHILOSOPHIE.md §1).
  assert.ok(dauer > langsamste, `Die Ankunft (${dauer}ms) ist nicht langsamer als --dur-slower (${langsamste}ms)`)
  assert.ok(versatz > 0, 'Ohne Versatz erscheinen Punkt und Anmerkung gleichzeitig')

  // Der Versatz gehört der Anmerkung, nicht dem Punkt: erst zeichnet der Stift im
  // Text, dann tritt die Anmerkung daneben.
  assert.match(ruleBody(annotations, '\n.onda-annotation {\n'), /animation:\s*onda-annotation-in[^;]*var\(--versatz-ankunft\)/)
  assert.match(ruleBody(css, '.has-local-finding::before'), /animation:\s*onda-ankunft-punkt/)

  // Wer keine Bewegung will, bekommt keine — auch nicht diese.
  const ruhe = tokens.slice(tokens.indexOf('prefers-reduced-motion'))
  assert.match(ruhe, /--dur-ankunft:\s*1ms/)
  assert.match(ruhe, /--versatz-ankunft:\s*0ms/)
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

test('Die Sprechblase trägt dieselbe Fläche, Linie und Tiefe wie das Fenster, das sie ersetzt', async () => {
  const [css, tokens, html] = await Promise.all([
    readFile(styleUrl, 'utf8'),
    readFile(tokensUrl, 'utf8'),
    readFile(indexUrl, 'utf8'),
  ])

  // Das Gerüst steht im HTML, nicht im JavaScript: ohne JS ist #agentWidget genau das
  // rechteckige Fenster von vorher, und die leere Kontur stört dabei nicht.
  assert.match(html, /id="ondaBlase"[^>]*hidden/, 'Die Kontur muss versteckt beginnen')
  assert.match(html, /clipPathUnits="userSpaceOnUse"/)
  assert.match(html, /class="onda-blase__schnitt"/)
  assert.match(html, /class="onda-blase__pfad"/)

  // Fläche und Haarlinie sind dieselben Werte wie am Fenster — sonst sähe man beim
  // Umschalten zwischen Kontur und Fenster einen Sprung in der Farbe.
  const pfad = ruleBody(css, '.onda-blase__pfad')
  assert.match(pfad, /fill:\s*var\(--bg-surface\)/)
  assert.match(pfad, /stroke:\s*var\(--border-subtle\)/)
  assert.match(pfad, /stroke-width:\s*1\b/)
  assert.doesNotMatch(pfad, /shadow-glow/, 'Die Blase leuchtet nicht — nur der Orb leuchtet')

  // Zwei Schreibweisen desselben Schattens: box-shadow am Fenster, drop-shadow an der
  // Kontur. Laufen die Zahlen auseinander, wechselt die Tiefe beim Umschalten.
  const schattenTeile = wert => [...wert.matchAll(/(-?[\d.]+\w*)\s+(-?[\d.]+\w*)\s+(-?[\d.]+\w*)\s+(rgba?\([^)]*\))/g)]
    .map(treffer => treffer.slice(1).join(' ').replace(/\s+/g, '').toLowerCase())
  const tokenSchatten = bereich => schattenTeile(bereich.match(/--shadow-lg:([^;]+)/)[1])
  const blasenSchatten = bereich => schattenTeile(bereich.match(/--blase-schatten:([^;]+)/)[1])

  const hellTokens = tokens.slice(0, tokens.indexOf('[data-theme="dark"]'))
  const dunkelTokens = tokens.slice(tokens.indexOf('[data-theme="dark"]'))
  const dunkelStart = css.indexOf('[data-theme="dark"] #editorView')
  assert.notEqual(dunkelStart, -1, 'Die Blase hat keinen dunklen Schatten')

  assert.deepEqual(blasenSchatten(css.slice(0, dunkelStart)), tokenSchatten(hellTokens),
    'Der helle Blasenschatten weicht von --shadow-lg ab')
  assert.deepEqual(blasenSchatten(css.slice(dunkelStart)), tokenSchatten(dunkelTokens),
    'Der dunkle Blasenschatten weicht von --shadow-lg ab')

  // Der Fehler, den man garantiert übersieht: ondaHintIn verschiebt den ganzen Kasten
  // um 6px und koppelte den Sitz für 240ms vom Orb ab.
  const konturFenster = ruleBody(css, '#agentWidget.hat-kontur')
  assert.match(konturFenster, /animation:\s*none/, 'Die Ankunftsbewegung reißt den Sitz vom Orb los')
  assert.match(konturFenster, /background:\s*transparent/)
  assert.doesNotMatch(konturFenster, /border-radius/, 'Der Radius bleibt am Fenster stehen — er ist die Rückfallebene')
})
