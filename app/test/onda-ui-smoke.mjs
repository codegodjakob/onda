import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

import { ALL_ANNOTATION_KINDS } from '../src/annotation-contract.mjs'
import { ensureProjectSidebarOpen } from './helpers/onda-navigation.mjs'

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const requestedSection = process.argv.includes('--section')
  ? process.argv[process.argv.indexOf('--section') + 1]
  : 'all'
const screenshots = process.argv.includes('--screenshots')
const mimeByExtension = {
  '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.woff2': 'font/woff2',
}

let staticServer = null
let baseUrl = process.env.AIWT_URL
if (!baseUrl) {
  staticServer = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
      const target = resolve(appRoot, pathname === '/' ? 'index.html' : pathname.slice(1))
      if (target !== appRoot && !target.startsWith(`${appRoot}${sep}`)) {
        response.writeHead(403).end()
        return
      }
      const content = await readFile(target)
      response.writeHead(200, { 'content-type': mimeByExtension[extname(target)] || 'application/octet-stream' })
      response.end(content)
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise(resolveListening => staticServer.listen(0, '127.0.0.1', resolveListening))
  baseUrl = `http://127.0.0.1:${staticServer.address().port}/`
}

async function runComponents(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const expected = {
    rechtschreibung: 'correction', satzstil: 'rewrite', uebergang: 'insertion',
    verschieben: 'slot', ton: 'region', beleg: 'source', widerspruch: 'compare',
    luecke: 'dialogue', ueberschrift: 'title',
  }
  for (const [kind, form] of Object.entries(expected)) {
    await page.goto(`${baseUrl}annotation-lab.html?kind=${kind}`, { waitUntil: 'networkidle' })
    const surface = page.locator(`[data-annotation-form="${form}"]`)
    assert.equal(await surface.count(), 1, `${kind} muss als ${form} erscheinen`)
    assert.ok((await surface.getAttribute('aria-label'))?.length > 0)
  }
  await page.goto(`${baseUrl}annotation-lab.html?kind=beleg`, { waitUntil: 'networkidle' })
  assert.equal(await page.locator('.aura-note__srcmeta script').count(), 0)
  await page.close()
}

async function runLab(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
  await page.goto(`${baseUrl}annotation-lab.html`, { waitUntil: 'networkidle' })
  const rendered = await page.locator('[data-annotation-kind]').evaluateAll(nodes => (
    nodes.map(node => node.dataset.annotationKind)
  ))
  assert.deepEqual(rendered.sort(), [...ALL_ANNOTATION_KINDS].sort())

  if (screenshots) {
    const directory = resolve(appRoot, 'evals/results/screenshots')
    await mkdir(directory, { recursive: true })
    for (const theme of ['light', 'dark']) {
      for (const width of [1280, 1024, 720, 320]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto(`${baseUrl}annotation-lab.html?theme=${theme}`, { waitUntil: 'networkidle' })
        await page.screenshot({ path: resolve(directory, `annotation-lab-${theme}-${width}.png`), fullPage: true })
      }
    }
  }
  await page.close()
}

async function openExample(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
  await page.locator('#doclist .doc').first().click()
}

async function runEditor(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await openExample(page)
  const seeded = await page.evaluate(() => {
    const block = window.AIWT.__blockIdentityTestBridge.getBlocks().find(candidate => candidate.text.length > 24)
    if (!block) return null
    const target = block.text.slice(0, Math.min(32, block.text.length))
    const finding = {
      id: 'onda-editor-smoke', status: 'open', placement: 'passage', blockId: block.id,
      target, action: `${target} — präzisiert`, short: 'Der Satz lässt sich präziser führen.',
      why: 'Die Kernaussage wird früher sichtbar.', folge: 'Die Aussage bleibt gleich.',
      anmerkungsart: 'satzstil', createdAt: -1,
    }
    window.AIWT.__workspaceTestBridge.injectFinding(finding)
    return { blockId: block.id, target, action: finding.action }
  })
  assert.ok(seeded)
  await page.locator('[data-annotation-form="rewrite"]').waitFor({ state: 'visible' })
  assert.equal(await page.locator('.local-finding-detail-row').count(), 0)
  // Über dem Text steht nichts (docs/PHILOSOPHIE.md §1 "Der andere Stift"). Geblieben
  // ist ein Stift-Zeichen in der Topbar, das nicht zählt — aber Vorlesegeräten den
  // vollen Wortlaut gibt.
  assert.equal(await page.locator('#annotationReviewBar').count(), 0, 'Die Anmerkungsleiste ist zurück')
  const zeichen = page.locator('#annotationPresence')
  assert.equal(await zeichen.isVisible(), true, 'Ohne Zeichen wäre gar nicht zu sehen, dass jemand mitschreibt')
  assert.equal((await zeichen.textContent()).trim(), '', 'Das Zeichen zeigt eine Zahl — es soll nur ein Stift sein')
  assert.match(await zeichen.getAttribute('aria-label'), /Empfehlung/)

  await page.getByRole('button', { name: /Fassung übernehmen/ }).click()
  assert.equal(await page.locator('#editor .ProseMirror').textContent().then(text => text.includes(seeded.action)), true)
  assert.equal(await page.evaluate(() => window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active).findings.find(item => item.id === 'onda-editor-smoke').status), 'resolved')

  // Rückgängig ohne Knopf. Solange die Anmerkung das Letzte war, was geschah, nimmt
  // Befehl+Z sie zurück — Text UND Vermerk, in einem Schritt.
  await page.locator('#editor .ProseMirror').click()
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
  await page.keyboard.press('ControlOrMeta+z')
  assert.equal(await page.locator('#editor .ProseMirror').textContent().then(text => text.includes(seeded.target)), true)
  assert.equal(await page.evaluate(() => window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active).findings.find(item => item.id === 'onda-editor-smoke').status), 'open')

  // Und die Gegenprobe: wer weiterschreibt, meint mit Befehl+Z sein eigenes Schreiben.
  // Ohne diese Grenze holte die Taste nach zwanzig Wörtern eine Anmerkung von vorhin
  // zurück.
  assert.equal(await page.evaluate(() => window.AIWT.__workspaceTestBridge.gehoertRueckgaengigDerAnmerkung()), false)

  await page.getByRole('button', { name: 'Original behalten' }).click()
  const consequence = page.getByRole('region', { name: 'Folge des Verwerfens wählen' })
  await consequence.waitFor({ state: 'visible' })
  assert.match(await consequence.textContent(), /ähnlicher Hinweis darf später wieder erscheinen/)
  assert.match(await consequence.textContent(), /Andere Texte bleiben unberührt/)
  assert.match(await consequence.textContent(), /anderen Projekten zurück/)
  await consequence.getByRole('button', { name: /In diesem Text nicht mehr/ }).click()
  assert.equal(await page.evaluate(() => window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active).findings.find(item => item.id === 'onda-editor-smoke').status), 'dismissed')
  // Auch das Verwerfen ist eine Entscheidung über eine Anmerkung — dieselbe Taste holt
  // sie zurück. Früher lag dafür ein Link "Entscheidung zurücknehmen" in der Leiste.
  await page.locator('#editor .ProseMirror').click()
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
  await page.keyboard.press('ControlOrMeta+z')
  assert.equal(await page.evaluate(() => window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active).findings.find(item => item.id === 'onda-editor-smoke').status), 'open')

  await page.evaluate(({ blockId, target }) => {
    window.AIWT.__workspaceTestBridge.injectFinding({
      id: 'onda-note-smoke', status: 'open', placement: 'passage', blockId,
      target, short: 'Was genau soll aus dieser Notiz werden?',
      why: 'Die Notiz ist noch offen.', folge: 'Erst die Antwort erlaubt eine Ausformulierung.',
      anmerkungsart: 'nachfrage', createdAt: -2, thread: [],
    })
  }, seeded)
  // Eine Notiz-Anmerkung erscheint OHNE Umschalten. Früher lag "nachfrage" hinter dem
  // Arbeitsmodus "Notizen" und war im Modus "Text" unsichtbar; der Umschalter saß in
  // der Anmerkungsleiste. Beide sind fort (docs/PHILOSOPHIE.md §1) — wer neben dir
  // schreibt, führt keine zwei getrennten Listen.
  await page.locator('[data-annotation-form="dialogue"][data-annotation-kind="nachfrage"]').waitFor({ state: 'visible' })
  assert.equal(await page.locator('[data-annotation-mode]').count(), 0, 'Der Arbeitsmodus-Umschalter ist zurück')
  await page.close()
}

async function runShell(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  assert.equal(await page.locator('main').count(), 1, 'Die App braucht genau einen Hauptbereich')
  assert.equal(await page.locator('.onda-app-shell').count(), 1, 'Die gemeinsame Onda-Shell fehlt')
  assert.equal(await page.getByRole('navigation', { name: 'Bibliothek' }).isVisible(), true)
  assert.equal(await page.locator('#home .onda-aura').count(), 0, 'Die Bibliothek darf keine dekorative Aura tragen')
  assert.equal(await page.locator('#ondaAura').count(), 1, 'Es darf genau einen KI-Einstieg mit Aura geben')

  await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
  await page.locator('#doclist .doc').first().click()
  assert.equal(await page.getByRole('navigation', { name: 'Projekt' }).isVisible(), true)
  assert.equal(await page.locator('#ondaAura').isVisible(), true, 'Der KI-Einstieg muss im Editor sichtbar sein')

  const editorWidth = await page.locator('#editor .ProseMirror').evaluate(node => node.getBoundingClientRect().width)
  assert.ok(editorWidth >= 640 && editorWidth <= 680, `Die Schreibspalte ist ${editorWidth}px statt 640–680px breit`)
  assert.equal(await page.locator('#title').evaluate(node => getComputedStyle(node).fontSize), '40px')
  assert.equal(await page.locator('.onda-editor-col').evaluate(node => getComputedStyle(node).borderTopRightRadius), '0px')

  if (screenshots) {
    const directory = resolve(appRoot, 'evals/results/screenshots')
    await mkdir(directory, { recursive: true })
    for (const width of [1440, 1024, 720, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.locator('#editorView').evaluate(async node => {
        await Promise.all(node.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})))
      })
      await page.screenshot({ path: resolve(directory, `onda-editor-${width}.png`), fullPage: true })
    }
    await page.setViewportSize({ width: 1280, height: 900 })
    await ensureProjectSidebarOpen(page)
    await page.getByRole('button', { name: 'Zur Projektübersicht' }).click()
    await page.screenshot({ path: resolve(directory, 'onda-library-1280.png'), fullPage: true })
    await page.setViewportSize({ width: 320, height: 760 })
    await page.screenshot({ path: resolve(directory, 'onda-library-320.png'), fullPage: true })
    await page.locator('#doclist .doc').first().click()

    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
    for (const width of [1440, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      if (width === 1440) await ensureProjectSidebarOpen(page)
      await page.locator('#editorView').evaluate(async node => {
        await Promise.all(node.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})))
      })
      await page.screenshot({ path: resolve(directory, `onda-editor-dark-${width}.png`), fullPage: true })
    }
    await page.setViewportSize({ width: 1280, height: 900 })
    await ensureProjectSidebarOpen(page)
    await page.getByRole('button', { name: 'Zur Projektübersicht' }).click()
    await page.screenshot({ path: resolve(directory, 'onda-library-dark-1280.png'), fullPage: true })
    await page.setViewportSize({ width: 320, height: 760 })
    await page.screenshot({ path: resolve(directory, 'onda-library-dark-320.png'), fullPage: true })
    await page.locator('#doclist .doc').first().click()
    await page.evaluate(() => { document.documentElement.dataset.theme = 'light' })
  }

  await assertTextNeverShrinks(page)
  await assertOrbStaysPut(page)

  await page.setViewportSize({ width: 320, height: 760 })
  await page.waitForTimeout(50)
  // Hier wurde geprüft, dass "vorherige" und "nächste Anmerkung" mobil ein Bedienpaar
  // auf einer Höhe bleiben. Beide Knöpfe gibt es nicht mehr (docs/PHILOSOPHIE.md §1).
  // An ihre Stelle tritt die Frage, ob das eine verbliebene Zeichen mobil erreichbar
  // bleibt — nicht abgeschnitten, nicht unter die Fensterkante gerutscht.
  const zeichenMobil = await page.locator('#annotationPresence').evaluate(node => {
    const kasten = node.getBoundingClientRect()
    return { links: Math.round(kasten.left), rechts: Math.round(kasten.right), breite: Math.round(kasten.width) }
  })
  assert.ok(zeichenMobil.breite >= 44, `Das Zeichen ist mobil nur ${zeichenMobil.breite}px breit`)
  assert.ok(zeichenMobil.links >= 0 && zeichenMobil.rechts <= 320, 'Das Zeichen liegt mobil außerhalb des Fensters')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  assert.ok(overflow <= 1, `Die App laeuft mobil ${overflow}px horizontal ueber`)
  assert.equal(await page.locator('#editor .ProseMirror').isVisible(), true)
  await page.close()
}

// „Der Text behält seine Breite, jede Nebenfläche schwebt oder wartet."
// Die Regel ist nicht verhandelbar, also wird sie gemessen und nicht behauptet.
//
// ACHTUNG bei der Wahl der Breiten: 1000px allein beweist NICHTS. Unter 1041px schaltet
// eine Ausnahme den Anmerkungsrand komplett ab — dort war es auch vorher schon richtig.
// Der Schaden lag zwischen 1041 und 1516px: bei 1100px war die Schreibspalte 400px
// statt 680px, bei 1200px 500px. Genau diese Zone muss die Prüfung treffen.
async function assertTextNeverShrinks(page) {
  const lesebreite = await page.evaluate(() => parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--container-reading'),
  ))
  assert.ok(lesebreite >= 600, `--container-reading ist unerwartet klein: ${lesebreite}px`)

  for (const agentOffen of [false, true]) {
    await page.evaluate(offen => {
      const auf = document.getElementById('editorView').classList.contains('is-agent-open')
      if (auf !== offen) document.getElementById('ondaAura').click()
    }, agentOffen)

    for (const width of [1041, 1100, 1200, 1400, 1516, 1712, 1800]) {
      await page.setViewportSize({ width, height: 900 })
      await page.waitForTimeout(30)
      const gemessen = await page.evaluate(() => {
        const pm = document.querySelector('#editor .ProseMirror')
        const page_ = document.getElementById('page')
        return {
          spalte: Math.round(pm.getBoundingClientRect().width),
          rand: getComputedStyle(page_).paddingRight,
          ueberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        }
      })
      const lage = `${width}px, Agentenfenster ${agentOffen ? 'offen' : 'zu'}`
      assert.ok(
        gemessen.spalte >= lesebreite,
        `Der Text ist bei ${lage} auf ${gemessen.spalte}px zusammengedrückt (soll ${lesebreite}px, Anmerkungsrand ${gemessen.rand})`,
      )
      assert.ok(gemessen.ueberlauf <= 1, `Die App läuft bei ${lage} ${gemessen.ueberlauf}px horizontal über`)
    }
  }

  await page.evaluate(() => {
    if (document.getElementById('editorView').classList.contains('is-agent-open')) {
      document.getElementById('ondaAura').click()
    }
  })
}

// „Der Orb bleibt oben rechts. Fest, nicht mitwandernd."
// Er wanderte aus zwei Gründen: der Stift schob ihn beim Erscheinen um 44px, und ab
// 1712px schob ihn das Agentenfenster über padding-right an .onda-editor-col um 420px.
// Gemessen wird der Abstand zur RECHTEN Fensterkante — der darf sich unter keinem
// Zustandswechsel ändern.
async function assertOrbStaysPut(page) {
  // Gemessen wird der Anker (.onda-topbar__aside), nicht der Orb selbst: der Orb trägt
  // ein hover-scale(1.04), das seinen Kasten um ~1px verändert. Das ist eine Rückmeldung
  // auf den Zeiger, kein Wandern. Die rechte Kante des Ankers IST die rechte Kante des
  // Orbs — er ist das letzte Kind.
  const abstand = () => page.evaluate(() => {
    const kasten = document.querySelector('.onda-topbar__aside').getBoundingClientRect()
    return { rechts: Math.round(window.innerWidth - kasten.right), oben: Math.round(kasten.top) }
  })

  for (const width of [1200, 1800]) {
    await page.setViewportSize({ width, height: 900 })
    await page.waitForTimeout(30)
    const ruhe = await abstand()

    // Der Stift kommt und geht
    await page.evaluate(() => { document.getElementById('annotationPresence').hidden = true })
    assert.deepEqual(await abstand(), ruhe, `Der Orb wandert bei ${width}px, wenn der Stift verschwindet`)
    await page.evaluate(() => { document.getElementById('annotationPresence').hidden = false })
    assert.deepEqual(await abstand(), ruhe, `Der Orb wandert bei ${width}px, wenn der Stift erscheint`)

    // Das Agentenfenster geht auf und zu
    await page.locator('#ondaAura').click()
    await page.waitForTimeout(30)
    assert.deepEqual(await abstand(), ruhe, `Der Orb wandert bei ${width}px, wenn das Agentenfenster aufgeht`)
    await page.locator('#ondaAura').click()
    await page.waitForTimeout(30)
    assert.deepEqual(await abstand(), ruhe, `Der Orb wandert bei ${width}px, wenn das Agentenfenster zugeht`)
  }
}

async function assertOndaSurface(locator, name, { radius = '0px' } = {}) {
  const contract = await locator.evaluate(node => {
    const style = getComputedStyle(node)
    return {
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      radius: style.borderTopLeftRadius,
    }
  })
  assert.match(contract.fontFamily, /ABC Diatype/, `${name} verwendet nicht ABC Diatype`)
  assert.ok(['400', '500', '700'].includes(contract.fontWeight), `${name} verwendet Gewicht ${contract.fontWeight}`)
  assert.equal(contract.radius, radius, `${name} verwendet Radius ${contract.radius}`)
}

async function runSurfaces(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const screenshotDirectory = resolve(appRoot, 'evals/results/screenshots')
  if (screenshots) await mkdir(screenshotDirectory, { recursive: true })
  const captureSurface = async filename => {
    await page.locator('body').evaluate(async node => {
      await Promise.all(node.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})))
    })
    await page.screenshot({ path: resolve(screenshotDirectory, filename), fullPage: true })
  }
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await assertOndaSurface(page.locator('#home'), 'Bibliothek')

  await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
  await page.locator('#doclist .doc').first().click()
  await assertOndaSurface(page.locator('.onda-editor-col'), 'Schreibblatt')
  await assertOndaSurface(page.locator('.onda-sidebar'), 'Projektnavigation')

  await page.getByRole('button', { name: 'KI-Anschluss einrichten' }).click()
  await assertOndaSurface(page.locator('#kiModal'), 'KI-Anschluss', { radius: '16px' })
  if (screenshots) await captureSurface('onda-overlay-ki.png')
  await page.locator('#kiModal').getByRole('button', { name: 'Schließen' }).click()

  await page.getByRole('button', { name: 'Agentengespräch öffnen' }).click()
  await assertOndaSurface(page.locator('#agentWidget'), 'Agentengespräch', { radius: '16px' })
  if (screenshots) await captureSurface('onda-overlay-agent.png')
  await page.locator('#agentWidget').getByRole('button', { name: /schließen/i }).click()

  await page.locator('#pvCard').click()
  await page.locator('#argumentOpen').click()
  await assertOndaSurface(page.locator('#argumentModal'), 'Argumentationsdossier', { radius: '16px' })
  if (screenshots) await captureSurface('onda-overlay-argument.png')
  await page.locator('#argumentModal').getByRole('button', { name: 'Schließen' }).click()

  await page.locator('#pvCard').click()
  await page.locator('#auditOpen').click()
  await assertOndaSurface(page.locator('#auditModal'), 'Schlussaudit', { radius: '16px' })
  if (screenshots) await captureSurface('onda-overlay-audit.png')
  await page.locator('#auditModal').getByRole('button', { name: 'Schließen' }).click()
  await page.close()
}

async function runAccessibility(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await openExample(page)
  const seeded = await page.evaluate(() => {
    const block = window.AIWT.__blockIdentityTestBridge.getBlocks().find(candidate => candidate.text.length > 24)
    const target = block.text.slice(0, 28)
    window.AIWT.__workspaceTestBridge.injectFinding({
      id: 'onda-a11y', status: 'open', placement: 'passage', blockId: block.id,
      target, action: `${target} präzise`, short: 'Diese Formulierung kann genauer werden.',
      why: 'Die Aussage wird schneller verständlich.', folge: 'Die Bedeutung bleibt erhalten.',
      anmerkungsart: 'satzstil', createdAt: -5,
    })
    return block.id
  })
  assert.ok(seeded)

  for (const width of [1280, 1024, 720, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await page.waitForTimeout(30)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    assert.ok(overflow <= 1, `${width}px: ${overflow}px horizontaler Überlauf`)
    assert.equal(await page.locator('#editor .ProseMirror').isVisible(), true)
  }

  const mobileTargets = await page.locator('#sidebarReopen, #ondaAura').evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect()
    return { id: node.id, width: rect.width, height: rect.height }
  }))
  mobileTargets.forEach(target => {
    assert.ok(target.width >= 44 && target.height >= 44, `${target.id}: ${target.width}×${target.height}px`)
  })

  await page.locator('#sidebarReopen').focus()
  await page.keyboard.press('Enter')
  assert.equal(await page.locator('#ondaSidebar').isVisible(), true)
  await page.locator('#sidebarCollapse').focus()
  await page.keyboard.press('Enter')
  await page.locator('#sidebarReopen').waitFor({ state: 'visible' })

  const motion = await page.locator('[data-annotation-form]').first().evaluate(node => getComputedStyle(node).animationDuration)
  assert.ok(parseFloat(motion) <= 0.001, `Reduzierte Bewegung dauert ${motion}`)

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const severe = axe.violations.filter(item => ['critical', 'serious'].includes(item.impact))
  assert.deepEqual(severe.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), [])
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  if (requestedSection === 'all' || requestedSection === 'components') await runComponents(browser)
  if (requestedSection === 'all' || requestedSection === 'lab') await runLab(browser)
  if (requestedSection === 'all' || requestedSection === 'editor') await runEditor(browser)
  if (requestedSection === 'all' || requestedSection === 'shell') await runShell(browser)
  if (requestedSection === 'all' || requestedSection === 'surfaces') await runSurfaces(browser)
  if (requestedSection === 'all' || requestedSection === 'accessibility') await runAccessibility(browser)
  console.log(`ONDA UI ${requestedSection}: PASS`)
} finally {
  await browser.close()
  if (staticServer) await new Promise(resolveClose => staticServer.close(resolveClose))
}
