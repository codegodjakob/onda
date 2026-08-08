import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { collapseProjectSidebar, ensureProjectSidebarOpen } from './helpers/onda-navigation.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const baseUrl = process.env.AIWT_URL || 'http://127.0.0.1:4173/'
const screenshotDir = process.env.AIWT_SCREENSHOT_DIR || '/tmp'

function assertOndaRahmenSteht() {
  const example = readFileSync(new URL('../src/example.js', import.meta.url), 'utf8')
  assert.match(example, /volle Kraft, leise Präsentation/)

  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  for (const id of ['ondaSidebar', 'structureNav', 'ondaAura', 'pvCard', 'sidebarBack']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `Neue Rahmenstruktur fehlt: #${id}`)
  }
}

assertOndaRahmenSteht()

async function openExample(page, clear = true) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  if (clear) {
    await page.evaluate(() => localStorage.clear())
    await page.reload({ waitUntil: 'networkidle' })
  }
  await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
  await page.locator('#doclist .doc').first().click()
}

async function installiereTransportMock(page) {
  await page.evaluate(() => {
    window.__llmMock = {
      aufrufe: [],
      usage: {
        input_tokens: 1200,
        output_tokens: 500,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 900,
      },
    }
    window.AIWT.setzeTransportFuerTests({
      async hatSchluessel() { return true },
      async setzeSchluessel() {},
      async loescheSchluessel() {},
      sende(anfrage, handlers) {
        window.__llmMock.aufrufe.push(anfrage)
        const schema = anfrage?.body?.output_config?.format?.schema
        let text
        if (schema?.properties?.hinweise) {
          text = JSON.stringify({ hinweise: [] })
        } else if (schema?.properties?.antwortText) {
          text = JSON.stringify({
            task: 'Essay schärfen',
            audience: 'interessierte Fachleser',
            desiredEffect: 'ruhig überzeugen',
            evidenceStandard: 'Primärquellen für Tatsachenbehauptungen',
            protectedIntentions: [],
            openQuestions: [],
            antwortText: 'EVAL-Verständnisreaktion',
          })
        } else if (anfrage?.body?.stream === true) {
          const aktuelleFrage = anfrage.body.messages.at(-1)?.content || ''
          text = `EVAL-Agentenreaktion: ${aktuelleFrage}`
        } else {
          text = 'EVAL-Zusammenfassung'
        }
        setTimeout(() => {
          if (anfrage?.body?.stream === true && handlers.onDelta) {
            const mitte = Math.ceil(text.length / 2)
            handlers.onDelta(text.slice(0, mitte))
            handlers.onDelta(text.slice(mitte))
          }
          handlers.onFertig({
            text,
            usage: { ...window.__llmMock.usage },
            stopReason: 'end_turn',
          })
        }, 0)
      },
    })
  })
}

async function expectVisible(locator) {
  assert.equal(await locator.isVisible(), true)
}

// Das Einfügemenü ("Art des Textbausteins") hat seit dem 07.08.2026 keinen sichtbaren
// Öffner mehr: das schwebende Plus am Absatz ist entfallen (c0a8f21), weil es nicht
// erkennen ließ, wofür es steht — Hervorhebung und Angebot sind die Sprache der
// Anmerkung, nicht des eigenen Schreibens (docs/PHILOSOPHIE.md §1). Das Menü selbst
// lebt weiter und bekommt seinen Platz in der Struktur-Ansicht, wo Bausteine
// hinzukommen dürfen. Bis dahin bliebe lebender Code ungeprüft, wenn hier niemand
// aufmachte — deshalb die Klinke über den Testzugang.
//
// `oeffnerSelector` benennt das Element, das nach Escape den Fokus zurückbekommt.
// Genommen wird dafür die Struktur-Karte des Bausteins: sie ist das nächste, was dem
// künftigen Öffner entspricht, und sie überlebt jedes Neuzeichnen der Ansicht.
async function oeffneEinfuegeMenue(page, { afterBlockId = null, oeffnerSelector = null } = {}) {
  await page.evaluate(({ blockId, selector }) => {
    const oeffner = selector ? document.querySelector(selector) : null
    window.__einfuegeOeffner = oeffner
    window.AIWT.__workspaceTestBridge.oeffneEinfuegeMenue(blockId, oeffner)
  }, { blockId: afterBlockId, selector: oeffnerSelector })
  await expectVisible(page.locator('.semantic-insert-menu'))
  // Das offene Menü nimmt den Fokus sofort an sich. Ohne diese Zusage wären alle
  // Escape-Prüfungen weiter unten inhaltsleer -- Escape träfe dann irgendetwas anderes.
  assert.equal(
    await page.evaluate(() => document.querySelector('.semantic-insert-menu')?.contains(document.activeElement)),
    true,
    'Das geöffnete Einfügemenü hat den Fokus nicht übernommen',
  )
}

function strukturKarte(blockId) {
  return `#structureNav .block-preview[data-block-id="${blockId}"]`
}

async function runSeedMigrationRegression(browser) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  const prepared = await page.evaluate(() => {
    const state = window.AIWT.state
    const seed = state.docs.find(doc => doc.exampleSeed === true)
    if (!seed) return { hasSeed: false }
    const originalSignature = seed.exampleSeedSignature
    seed.body += '<p>Nutzerergänzung im editierten Seed.</p>'
    const userDoc = {
      id: 'd-user-example-migration',
      title: 'Mein Beispielprojekt-Text',
      body: '<p>Eigenständiger Nutzertext.</p>',
      projectId: 'p-example',
      updated: Date.now(),
    }
    state.docs.push(userDoc)
    const project = state.projects.find(candidate => candidate.id === 'p-example')
    project.material.push({ id: 'user-material-migration', kind: 'Notiz', text: 'Eigenes Projektmaterial' })
    state.settings.exampleVersion -= 1
    state.active = userDoc.id
    state.activeProject = 'p-example'
    state.editor.commands.setContent(userDoc.body, false)
    document.getElementById('title').value = userDoc.title
    window.AIWT.persist()
    return { hasSeed: true, originalSignature }
  })
  assert.equal(prepared.hasSeed, true)

  await page.reload({ waitUntil: 'networkidle' })
  const migrated = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('aiwt.v2'))
    const edited = stored.docs.find(doc => doc.body?.includes('Nutzerergänzung im editierten Seed.'))
    const userDoc = stored.docs.find(doc => doc.id === 'd-user-example-migration')
    const project = stored.projects.find(candidate => candidate.id === 'p-example')
    return {
      seedCount: stored.docs.filter(doc => doc.exampleSeed === true && doc.exampleSeedKey === 'calm-technology').length,
      editedBody: edited?.body || '',
      editedStillSeed: edited?.exampleSeed === true,
      userBody: userDoc?.body || '',
      userMaterial: project?.material?.find(item => item.id === 'user-material-migration')?.text || '',
      projectCount: stored.projects.filter(candidate => candidate.id === 'p-example').length,
    }
  })
  assert.equal(migrated.seedCount, 1)
  assert.equal(migrated.editedStillSeed, false)
  assert.match(migrated.userBody, /Eigenständiger Nutzertext\./)
  assert.equal(migrated.userMaterial, 'Eigenes Projektmaterial')
  assert.equal(migrated.projectCount, 1)
  assert.match(migrated.editedBody, /Nutzerergänzung im editierten Seed\./)
  await page.close()
}

// ENTFERNT (08.08.2026): waitForLocalFeedbackLayout. Der Helfer wartete, bis Anmerkung
// und Vorschlagskarte der zweistufigen Rückmeldung ihre endgültige Lage gefunden
// hatten: Notiz am oder unter dem Absatz, Vorschlag darunter, dazwischen ein
// Abstandhalter, der den Folgeabsatz freihält, und keine Überdeckung zwischen den
// beiden. Diesen Aufbau gibt es seit dem 05.08.2026 (e4392ce) nicht mehr -- heute
// erscheint eine einzige Anmerkungsfläche ohne zweite Karte. Gebraucht wurde der
// Helfer allein von den drei Task-5-Prüfungen, die mit derselben Oberfläche entfallen
// sind.

async function runDesktop(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', error => errors.push(error.message))

  await openExample(page)

  const blockIds = await page.locator('#editor .ProseMirror > [data-block-id]').evaluateAll(nodes => nodes.map(node => node.dataset.blockId))
  assert.ok(blockIds.length >= 3)
  assert.equal(new Set(blockIds).size, blockIds.length)

  assert.equal(await page.locator('#railL, #railR, #pCoach, #pStruct').count(), 0)
  assert.equal(await page.locator('.onda-topbar').count(), 1)
  assert.equal(await page.locator('#ondaSidebar').isVisible(), true)
  assert.equal(await page.locator('#structureNav').isVisible(), true)
  assert.equal(await page.locator('#ondaAura').count(), 1)
  assert.equal(await page.getByText('Recherche aktuell', { exact: true }).count(), 0)
  assert.equal(await page.getByText('Prüfen', { exact: true }).count(), 0)
  assert.equal(await page.getByTitle('Schriftgröße (Auswahl / Gesamt)').count(), 0)
  assert.equal(await page.getByTitle('Einfügen (Bild)').count(), 0)

  const shelf = page.locator('#structureNav')
  assert.equal(await shelf.locator('.block-preview').count(), blockIds.length)
  assert.equal(await shelf.locator('.black-spine, .status-dot').count(), 0)

  // Seitenleiste einklappen/ausklappen persistiert in settings.sidebarCollapsed
  await collapseProjectSidebar(page)
  assert.equal(await page.locator('#editorView').evaluate(n => n.classList.contains('is-sidebar-collapsed')), true)
  // Seit dem 8. August 2026 gibt es EINE Klinke statt zweier. #sidebarCollapse und
  // #sidebarReopen hingen in verschiedenen Kaesten und konnten deshalb nie an derselben
  // Stelle stehen — das war die Ursache des springenden Pfeils, den Jakob gemeldet hat.
  // Der Zustand steht jetzt am aria-expanded der einen Klinke.
  assert.equal(await page.locator('#sidebarToggle').getAttribute('aria-expanded'), 'false')
  assert.equal(await page.evaluate(() => AIWT.state.settings.sidebarCollapsed), true)
  await ensureProjectSidebarOpen(page)
  assert.equal(await page.locator('#editorView').evaluate(n => n.classList.contains('is-sidebar-collapsed')), false)
  assert.equal(await page.locator('#sidebarToggle').getAttribute('aria-expanded'), 'true')
  assert.equal(await page.evaluate(() => AIWT.state.settings.sidebarCollapsed), false)

  // Seit 04.08.2026 klappen Struktur-Karten nur auf Klick auf; von allein steht nur
  // die Ueberschrift offen. Der Auszug eines ZUGEKLAPPTEN Absatzes ist deshalb leer,
  // und das ist Absicht: er wiederholte woertlich, was zwei Handbreit weiter rechts
  // schon steht. Geprueft wird darum, was die Zusage tatsaechlich ist -- eine Karte,
  // die aufgeklappt einen lesbaren Auszug traegt.
  // Die ID VOR dem Klick festhalten: ein Playwright-Locator loest sich bei jedem
  // Zugriff neu auf, und nach dem Klick passt die Karte nicht mehr auf
  // [aria-expanded="false"] -- der Locator zeigte sonst auf die naechste, noch
  // zugeklappte Karte und maesse deren leeren Auszug.
  const zuklapptId = await shelf.locator('.block-preview[aria-expanded="false"]').first().getAttribute('data-block-id')
  assert.ok(zuklapptId, 'keine zugeklappte Struktur-Karte gefunden')
  await shelf.locator(`.block-preview[data-block-id="${zuklapptId}"]`).click()
  const previewText = await shelf.locator(`.block-preview[data-block-id="${zuklapptId}"] .block-preview-excerpt`).textContent()
  assert.ok(previewText.trim().length > 20, `Auszug zu kurz: ${JSON.stringify(previewText)}`)
  // Vorlesegeraete bekommen den Wortlaut in JEDEM Zustand, auch zugeklappt.
  const zugeklapptesLabel = await shelf.locator('.block-preview[aria-expanded="false"]').first().getAttribute('aria-label')
  assert.ok((zugeklapptesLabel || '').trim().length > 20, 'zugeklappte Karte ohne Wortlaut fuer Vorlesegeraete')

  const previewTargetId = await shelf.locator('.block-preview').nth(1).getAttribute('data-block-id')
  await shelf.locator('.block-preview').nth(1).click()
  assert.equal(await page.locator('#editor .ProseMirror').evaluate(node => node.contains(document.activeElement)), true)
  assert.equal(await page.locator(`#editor .ProseMirror > [data-block-id="${previewTargetId}"]`).evaluate(node => node.classList.contains('is-active-block')), true)

  // ENTFERNT (07.08.2026): die Prüfung, dass genau ein Einfügeknopf am Absatz hängt.
  // Das schwebende Plus gibt es nicht mehr — es sagte nicht, was es anbietet, und
  // schwebte auch dann, wenn niemand etwas einfügen wollte (c0a8f21). Das Angebot
  // wandert in die Struktur-Ansicht. Das Menü dahinter bleibt und wird hier weiter
  // geprüft, nur eben ohne sichtbaren Öffner.
  const beforeInsert = await page.locator('#editor .ProseMirror > [data-block-id]').count()
  await oeffneEinfuegeMenue(page, {
    afterBlockId: previewTargetId,
    oeffnerSelector: strukturKarte(previewTargetId),
  })
  const shelfMenu = page.locator('.semantic-insert-menu')
  assert.deepEqual(await shelfMenu.getByRole('menuitem').allTextContents(), [
    'Freier Absatz',
    'Kernbehauptung',
    'Beleg',
    'Gegenposition',
    'Übergang',
    'Offene Frage',
  ])
  await shelfMenu.getByRole('menuitem', { name: 'Gegenposition', exact: true }).click()
  assert.equal(await page.locator('#editor .ProseMirror > [data-block-id]').count(), beforeInsert + 1)
  const insertedBlock = page.locator('#editor .ProseMirror > [data-semantic-role="counterpoint"]')
  assert.equal(await insertedBlock.count(), 1)

  // Der neue Baustein landet unmittelbar hinter dem gewählten -- nicht am Textende.
  // Das prüfte vorher niemand: der alte Knopf saß immer am aktiven Absatz, also fiel
  // eine falsche Einfügestelle gar nicht auf.
  const insertedBlockId = await insertedBlock.getAttribute('data-block-id')
  const reihenfolge = await page.locator('#editor .ProseMirror > [data-block-id]')
    .evaluateAll(nodes => nodes.map(node => node.dataset.blockId))
  assert.equal(
    reihenfolge.indexOf(insertedBlockId),
    reihenfolge.indexOf(previewTargetId) + 1,
    `Neuer Baustein steht an der falschen Stelle: ${JSON.stringify(reihenfolge)}`,
  )

  // ENTFERNT: Sichtbarkeit des Plus beim Überfahren, sein Abstand zur Unterkante des
  // Absatzes, das Aufklappen mit Eingabetaste sowie sein Verblassen beim Tippen
  // (Klasse is-typing, Deckkraft 0). All das beschrieb den Knopf selbst.
  //
  // Der Tastaturweg IM Menü bleibt geprüft: erster Eintrag hat den Fokus, Pfeiltasten
  // wandern, Escape schließt und gibt den Fokus dem Öffner zurück.
  await page.waitForFunction(
    selector => Boolean(document.querySelector(selector)),
    strukturKarte(insertedBlockId),
  )
  await oeffneEinfuegeMenue(page, {
    afterBlockId: insertedBlockId,
    oeffnerSelector: strukturKarte(insertedBlockId),
  })
  const editorMenu = page.locator('.semantic-insert-menu')
  assert.equal(await page.locator('.semantic-insert-choice:focus').textContent(), 'Freier Absatz')
  await page.keyboard.press('ArrowDown')
  assert.equal(await page.locator('.semantic-insert-choice:focus').textContent(), 'Kernbehauptung')
  await page.keyboard.press('Escape')
  assert.equal(await editorMenu.count(), 0)
  assert.equal(await page.evaluate(() => document.activeElement === window.__einfuegeOeffner), true)

  await page.evaluate(() => window.AIWT.flushSave())
  await page.reload({ waitUntil: 'networkidle' })
  await openExample(page, false)
  await expectVisible(page.locator('#structureNav'))
  assert.equal(await page.locator('#structureNav .block-preview').count(), beforeInsert + 1)
  assert.equal(await page.locator('#editor .ProseMirror > [data-semantic-role="counterpoint"]').count(), 1)
  const insertedPersisted = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('aiwt.v2'))
    const doc = stored.docs.find(candidate => candidate.projectId === 'p-example')
    return doc.body.includes('data-semantic-role="counterpoint"')
  })
  assert.equal(insertedPersisted, true)

  await page.locator('#ondaAura').click()
  assert.equal(await page.locator('#agentWidget').isVisible(), true)
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#agentWidget').isHidden(), true)
  assert.equal(await page.locator('body').evaluate(node => node.classList.contains('view-editor')), true)

  const secondBlock = page.locator('#editor .ProseMirror > [data-block-id]').filter({ hasText: /\S/ }).nth(1)
  const activeBlockId = await secondBlock.getAttribute('data-block-id')
  await secondBlock.click()
  await page.waitForTimeout(450)
  assert.equal(await secondBlock.evaluate(node => node.classList.contains('is-active-block')), true)

  await page.reload({ waitUntil: 'networkidle' })
  await openExample(page, false)
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('aiwt.v2')))
  const exampleDoc = persisted.docs.find(doc => doc.projectId === 'p-example')
  assert.equal(exampleDoc.workspace.activeBlockId, activeBlockId)
  assert.equal(await page.locator(`#editor .ProseMirror > [data-block-id="${activeBlockId}"]`).evaluate(node => node.classList.contains('is-active-block')), true)

  await page.screenshot({ path: `${screenshotDir}/aiwt-v2-desktop.png`, fullPage: true })
  assert.deepEqual(errors, [])
  await page.close()
}

async function runMobile(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await openExample(page)

  // structure is always in the sidebar drawer
  assert.equal(await page.locator('#structureNav .block-preview').count() > 0, true)

  // collapse -> editor full width, drawer off-canvas, no horizontal overflow
  await collapseProjectSidebar(page)
  await page.waitForFunction(() => document.getElementById('editorView').classList.contains('is-sidebar-collapsed'))
  const collapsed = await page.evaluate(() => {
    const sidebar = document.getElementById('ondaSidebar').getBoundingClientRect()
    return {
      offCanvas: sidebar.right <= 1,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  assert.equal(collapsed.offCanvas, true)
  assert.ok(collapsed.overflow <= 1, `Horizontales Overflow (collapsed): ${collapsed.overflow}px`)

  // reopen the drawer
  await ensureProjectSidebarOpen(page)
  await page.waitForFunction(() => !document.getElementById('editorView').classList.contains('is-sidebar-collapsed'))
  assert.equal(await page.locator('#ondaSidebar').isVisible(), true)

  // agent panel is near-full-width and does not steal focus
  await page.locator('#ondaAura').click()
  assert.equal(await page.locator('#agentWidget').isVisible(), true)
  assert.equal(await page.locator('#agentWidget').evaluate(node => node.contains(document.activeElement)), false)
  const agentBox = await page.locator('#agentWidget').boundingBox()
  assert.ok(agentBox.width >= 390 - 40, `Agent-Panel zu schmal: ${agentBox.width}`)
  await page.keyboard.press('Escape')

  // evidence panel opens near-full-width
  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.workspace.evidenceFindingId = 'mobile-evidence-probe'
    window.AIWT.state.editor.commands.insertContent(' ')
  })
  assert.equal(await page.locator('#evidenceWindow').isVisible(), true)

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  assert.ok(overflow <= 1, `Horizontales Overflow: ${overflow}px`)
  await page.screenshot({ path: `${screenshotDir}/aiwt-v2-mobile.png`, fullPage: true })
  await page.close()
}

async function runSaveAlert(browser) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } })
  await openExample(page)

  const alert = page.locator('#saveAlert')
  assert.equal(await alert.getAttribute('role'), 'alert')
  assert.ok(['assertive', 'polite'].includes(await alert.getAttribute('aria-live')))
  assert.equal(await alert.isHidden(), true)

  await page.locator('#title').fill('Speichertest erfolgreich')
  await page.waitForTimeout(550)
  assert.equal(await alert.isHidden(), true)

  await page.evaluate(() => {
    window.__originalStorageSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = () => { throw new Error('Erzwungener Speicherfehler') }
  })
  await page.locator('#title').fill('Speichertest fehlgeschlagen')
  await page.locator('#sidebarBack').click()
  assert.equal(await page.locator('body').evaluate(node => node.classList.contains('view-home')), true)
  assert.equal(await alert.isVisible(), true)
  assert.match(await alert.textContent(), /Speichern fehlgeschlagen/)
  const alertAppearance = await alert.evaluate(node => ({
    backgroundColor: getComputedStyle(node).backgroundColor,
    borderTopWidth: getComputedStyle(node).borderTopWidth,
  }))
  assert.notEqual(alertAppearance.backgroundColor, 'rgba(0, 0, 0, 0)')
  assert.notEqual(alertAppearance.borderTopWidth, '0px')

  await page.evaluate(() => window.AIWT.scheduleSave())
  assert.equal(await alert.isVisible(), true)
  assert.match(await alert.textContent(), /Speichern fehlgeschlagen/)

  await page.evaluate(() => {
    Storage.prototype.setItem = window.__originalStorageSetItem
    delete window.__originalStorageSetItem
    window.AIWT.persist()
  })
  assert.equal(await alert.isHidden(), true)
  await page.close()
}

async function runPrintLayout(browser) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } })
  await openExample(page)
  await page.evaluate(() => {
    for (const id of ['ondaSidebar', 'agentWidget', 'evidenceWindow']) {
      document.getElementById(id).hidden = false
    }
  })
  await page.emulateMedia({ media: 'print' })

  // ENTFERNT: '#blockInsertLayer' -- die Fläche, auf der das Plus schwebte, ist mit ihm
  // verschwunden (c0a8f21). Die Prüfung liefe zwar grün weiter, denn ein Element, das
  // es nicht gibt, gilt als verborgen; sie prüfte dann aber nichts mehr. Was gedruckt
  // wird und was nicht, bleibt für alles andere geprüft.
  for (const selector of [
    '.onda-topbar',
    '#ondaSidebar',
    '#agentWidget',
    '#evidenceWindow',
    '#localAgentLayer',
    '#saveAlert',
  ]) {
    assert.equal(await page.locator(selector).isHidden(), true, `${selector} wird mitgedruckt`)
  }

  const printLayout = await page.evaluate(() => {
    const styles = id => getComputedStyle(document.getElementById(id))
    const editorCol = getComputedStyle(document.querySelector('.onda-editor-col'))
    return {
      bodyOverflow: getComputedStyle(document.body).overflow,
      editorColDisplay: editorCol.display,
      editorColPosition: editorCol.position,
      scrollOverflow: styles('scroll').overflow,
      pageMaxWidth: styles('page').maxWidth,
      pagePaddingTop: styles('page').paddingTop,
    }
  })
  assert.deepEqual(printLayout, {
    bodyOverflow: 'visible',
    editorColDisplay: 'block',
    editorColPosition: 'static',
    scrollOverflow: 'visible',
    pageMaxWidth: 'none',
    pagePaddingTop: '0px',
  })
  await page.close()
}

async function runHomeFocus(browser) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } })
  await openExample(page)

  await page.locator('#sidebarBack').click()
  await page.waitForFunction(() => document.activeElement?.id === 'search')
  assert.equal(await page.locator('#search').isVisible(), true)

  await openExample(page, false)
  await page.locator('#editor .ProseMirror').click()
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.activeElement?.id === 'search')
  assert.equal(await page.locator('#search').isVisible(), true)
  await page.close()
}

async function runBlockIdentityRegressions(browser) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await openExample(page)

  const switchedIds = await page.evaluate(() => {
    const source = window.AIWT.state.docs.find(doc => !doc.trashed)
    const switched = JSON.parse(JSON.stringify(source))
    switched.id = 'd-block-switch-regression'
    switched.title = 'Blockwechsel Regression'
    switched.body = '<p>Erster Absatz ohne gespeicherte ID.</p><p>Zweiter Absatz ohne gespeicherte ID.</p>'
    window.AIWT.state.docs.push(switched)
    window.AIWT.openDoc(switched.id)
    return [...document.querySelectorAll('#editor .ProseMirror > [data-block-id]')].map(node => node.dataset.blockId)
  })
  assert.equal(switchedIds.length, 2)
  assert.equal(new Set(switchedIds).size, switchedIds.length)

  const hardBreakResult = await page.evaluate(() => {
    const bridge = window.AIWT.__blockIdentityTestBridge
    bridge.setContent({
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Davor' },
          { type: 'hardBreak' },
          { type: 'text', text: 'Zieltext danach' },
        ],
      }],
    })
    const replaced = bridge.replaceFindingTarget('Zieltext', 'Ersetzt')
    return { replaced, json: bridge.getJSON() }
  })
  assert.equal(hardBreakResult.replaced, true)
  assert.deepEqual(hardBreakResult.json.content[0].content, [
    { type: 'text', text: 'Davor' },
    { type: 'hardBreak' },
    { type: 'text', text: 'Ersetzt danach' },
  ])

  const duplicateResult = await page.evaluate(() => {
    const bridge = window.AIWT.__blockIdentityTestBridge
    bridge.setContent({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Gleicher Zieltext zuerst.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Gleicher Zieltext danach.' }] },
      ],
    })
    const [first, second] = bridge.getBlocks()
    const anchored = bridge.replaceFindingTarget('Gleicher Zieltext', 'Gezielt ersetzt', second.id)
    const afterAnchored = bridge.getJSON()
    bridge.setContent({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Doppelt bleibt hier.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Doppelt bleibt dort.' }] },
      ],
    })
    const unanchored = bridge.replaceFindingTarget('Doppelt', 'Falsch')
    return { first, second, anchored, afterAnchored, unanchored, afterUnanchored: bridge.getJSON() }
  })
  assert.notEqual(duplicateResult.first.id, duplicateResult.second.id)
  assert.equal(duplicateResult.anchored, true)
  assert.equal(duplicateResult.afterAnchored.content[0].content[0].text, 'Gleicher Zieltext zuerst.')
  assert.equal(duplicateResult.afterAnchored.content[1].content[0].text, 'Gezielt ersetzt danach.')
  assert.equal(duplicateResult.unanchored, false)
  assert.equal(duplicateResult.afterUnanchored.content[0].content[0].text, 'Doppelt bleibt hier.')
  assert.equal(duplicateResult.afterUnanchored.content[1].content[0].text, 'Doppelt bleibt dort.')

  const nestedListResult = await page.evaluate(() => {
    const bridge = window.AIWT.__blockIdentityTestBridge
    bridge.setContent({
      type: 'doc',
      content: [{
        type: 'bulletList',
        attrs: { blockId: 'b-list-top-level', semanticRole: 'evidence' },
        content: [{
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: 'Auswahl in verschachtelter Liste' }],
          }],
        }],
      }],
    })
    window.AIWT.state.editor.commands.setTextSelection(4)
    return {
      activeBlockId: bridge.getActiveBlockId(),
      topLevelBlockId: bridge.getBlocks()[0].id,
    }
  })
  assert.equal(nestedListResult.topLevelBlockId, 'b-list-top-level')
  assert.equal(nestedListResult.activeBlockId, nestedListResult.topLevelBlockId)

  const insertResult = await page.evaluate(() => {
    const bridge = window.AIWT.__blockIdentityTestBridge
    bridge.setContent({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Erster Block' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Letzter Block' }] },
      ],
    })
    const before = bridge.getBlocks()
    const insertedId = bridge.insertSemanticBlock(before.at(-1).id, 'counterargument')
    return { before, insertedId, after: bridge.getJSON() }
  })
  assert.equal(insertResult.before.length, 2)
  assert.equal(insertResult.after.content.length, 3)
  assert.equal(insertResult.after.content[2].type, 'paragraph')
  assert.equal(insertResult.after.content[2].attrs.blockId, insertResult.insertedId)
  assert.equal(insertResult.after.content[2].attrs.semanticRole, 'counterargument')
  assert.equal(new Set(insertResult.after.content.map(node => node.attrs.blockId)).size, 3)

  const anchoredAmbiguityResult = await page.evaluate(() => {
    const bridge = window.AIWT.__blockIdentityTestBridge
    bridge.setContent({
      type: 'doc',
      content: [{
        type: 'paragraph',
        content: [{ type: 'text', text: 'Doppelt bleibt hier, Doppelt bleibt dort.' }],
      }],
    })
    const blockId = bridge.getBlocks()[0].id
    const before = bridge.getJSON()
    const replaced = bridge.replaceFindingTarget('Doppelt', 'Falsch', blockId)
    return { before, replaced, after: bridge.getJSON() }
  })
  assert.equal(anchoredAmbiguityResult.replaced, false)
  assert.deepEqual(anchoredAmbiguityResult.after, anchoredAmbiguityResult.before)

  const plainTextResult = await page.evaluate(() => {
    const bridge = window.AIWT.__blockIdentityTestBridge
    const replacement = '<strong>Ruhige & klare Technik</strong> https://example.com/?a=1&b=2'
    bridge.setContent({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Vorher Zieltext nachher' }] }],
    })
    const blockId = bridge.getBlocks()[0].id
    const replaced = bridge.replaceFindingTarget('Zieltext', replacement, blockId)
    return { replaced, replacement, json: bridge.getJSON(), html: window.AIWT.state.editor.getHTML() }
  })
  assert.equal(plainTextResult.replaced, true)
  assert.equal(plainTextResult.json.content[0].content[0].text, `Vorher ${plainTextResult.replacement} nachher`)
  assert.equal(plainTextResult.json.content[0].content[0].marks, undefined)
  assert.match(plainTextResult.html, /&lt;strong&gt;Ruhige &amp; klare Technik&lt;\/strong&gt;/)
  assert.doesNotMatch(plainTextResult.html, /<strong>|<a\b/)

  const hardenedId = await page.evaluate(() => {
    const bridge = window.AIWT.__blockIdentityTestBridge
    bridge.setContent({
      type: 'doc',
      content: [{
        type: 'paragraph',
        attrs: { blockId: 'bad"]', semanticRole: 'claim' },
        content: [{ type: 'text', text: 'Ungültige persistierte ID.' }],
      }],
    })
    document.getElementById('title').dispatchEvent(new Event('input', { bubbles: true }))
    return bridge.getBlocks()[0].id
  })
  assert.match(hardenedId, /^b-[a-z0-9]+(?:-[a-z0-9]+)*$/i)
  assert.notEqual(hardenedId, 'bad"]')

  const schemaContract = await page.evaluate(() => {
    const bridge = window.AIWT.__blockIdentityTestBridge
    bridge.setContent('<p style="color:red;text-align:center"><strong>Fett</strong> <em>Kursiv</em> <u>Unterstrichen</u> <s>Gestrichen</s> <code>Code</code> <span style="font-size:40px;background:yellow">Farbe</span> <a href="https://example.com">Link</a><img src="https://example.com/tracker.png"></p>')
    return {
      html: window.AIWT.state.editor.getHTML(),
      json: bridge.getJSON(),
      commands: Object.keys(window.AIWT.state.editor.commands),
    }
  })
  // Kursiv ist seit dem 7. August 2026 die EINZIGE Auszeichnung, die zurueckkommt
  // (editor.js: StarterKit mit bold/strike/code aus). Ein wissenschaftlicher deutscher
  // Text braucht sie fuer Werktitel und fremdsprachige Ausdruecke. Fett, durchgestrichen
  // und Inline-Code sind Betonung — die gehoert in den Satzbau, nicht in eine Leiste.
  assert.doesNotMatch(schemaContract.html, /<(?:strong|u|s|code|img)\b|style=/)
  assert.match(schemaContract.html, /<em\b/, 'Kursiv wird verschluckt — es ist die eine erlaubte Auszeichnung')
  assert.match(schemaContract.html, /<a\b[^>]*href="https:\/\/example\.com"/)
  assert.deepEqual(
    schemaContract.commands.filter(name => [
      'setFontSize', 'unsetFontSize', 'setColor', 'toggleHighlight', 'setTextAlign',
      'toggleUnderline', 'setAnnos', 'setImage',
    ].includes(name)),
    [],
  )

  const repairedLeafBlocks = await page.evaluate(() => {
    const bridge = window.AIWT.__blockIdentityTestBridge
    bridge.setContent({
      type: 'doc',
      content: [
        {
          type: 'taskList',
          content: [{
            type: 'taskItem',
            attrs: { checked: false },
            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Prüfpunkt' }] }],
          }],
        },
        { type: 'horizontalRule' },
      ],
    }, false)
    let transactions = 0
    const countTransaction = () => { transactions += 1 }
    window.AIWT.state.editor.on('transaction', countTransaction)
    const firstRepair = bridge.ensureTopLevelBlockIds()
    const transactionsAfterFirstRepair = transactions
    const secondRepair = bridge.ensureTopLevelBlockIds()
    window.AIWT.state.editor.off('transaction', countTransaction)
    return {
      firstRepair,
      secondRepair,
      transactions,
      transactionsAfterFirstRepair,
      blocks: bridge.getBlocks(),
      json: bridge.getJSON(),
    }
  })
  assert.equal(repairedLeafBlocks.firstRepair, true)
  assert.equal(repairedLeafBlocks.secondRepair, false)
  assert.ok(repairedLeafBlocks.transactionsAfterFirstRepair >= 1)
  assert.equal(repairedLeafBlocks.transactions, repairedLeafBlocks.transactionsAfterFirstRepair)
  assert.deepEqual(repairedLeafBlocks.blocks.map(block => block.type), ['taskList', 'horizontalRule'])
  assert.equal(repairedLeafBlocks.blocks.every(block => typeof block.id === 'string' && block.id.length > 0), true)
  assert.equal(new Set(repairedLeafBlocks.blocks.map(block => block.id)).size, 2)
  assert.equal(repairedLeafBlocks.json.content.every(node => node.attrs.blockId !== null), true)

  assert.deepEqual(errors, [])
  await page.close()
}

async function runTask4InteractionRegressions(browser) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } })
  await openExample(page)

  const horizontalRuleSetup = await page.evaluate(() => {
    const bridge = window.AIWT.__blockIdentityTestBridge
    bridge.setContent({
      type: 'doc',
      content: [
        { type: 'horizontalRule' },
        { type: 'horizontalRule' },
        { type: 'paragraph', content: [{ type: 'text', text: 'Absatz danach' }] },
      ],
    })
    return bridge.getBlocks()
  })
  assert.deepEqual(horizontalRuleSetup.map(block => block.type), ['horizontalRule', 'horizontalRule', 'paragraph'])
  assert.equal(horizontalRuleSetup.every(block => block.id), true)

  // Struktur ist dauerhaft in der Seitenleiste sichtbar (kein Shelf-Toggle mehr)
  const shelf = page.locator('#structureNav')
  await expectVisible(shelf)
  await page.waitForFunction(() => document.querySelectorAll('#structureNav .block-preview').length === 3)
  assert.equal(await shelf.locator('.block-preview').count(), 3)
  assert.equal(await shelf.locator('[data-block-id="null"]').count(), 0)

  const secondRuleId = horizontalRuleSetup[1].id
  await shelf.locator('.block-preview').nth(1).click()
  const ruleSelection = await page.evaluate(() => ({
    selectedNodeType: window.AIWT.state.editor.state.selection.node?.type.name || null,
    activeBlockId: window.AIWT.__blockIdentityTestBridge.getActiveBlockId(),
  }))
  assert.equal(ruleSelection.selectedNodeType, 'horizontalRule')
  assert.equal(ruleSelection.activeBlockId, secondRuleId)

  // Ohne ausdrücklich genanntes Ziel fügt das Menü hinter dem AKTIVEN Baustein ein --
  // hier hinter der zweiten Linie, nicht am Textende.
  await oeffneEinfuegeMenue(page)
  await page.locator('.semantic-insert-choice[data-semantic-role="counterpoint"]').click()
  const insertedAfterSecondRule = await page.evaluate(() => window.AIWT.__blockIdentityTestBridge.getJSON())
  assert.deepEqual(insertedAfterSecondRule.content.map(node => node.type), [
    'horizontalRule',
    'horizontalRule',
    'paragraph',
    'paragraph',
  ])
  assert.equal(insertedAfterSecondRule.content[2].attrs.semanticRole, 'counterpoint')
  assert.equal(insertedAfterSecondRule.content[3].content[0].text, 'Absatz danach')

  // Strukturkarten behalten ihre Knotenidentität über Auswahl- und Textänderungen
  const stableShelf = await page.evaluate(() => {
    const previews = [...document.querySelectorAll('#structureNav .block-preview')]
    window.__task4ShelfNodes = { previews }
    const blocks = window.AIWT.__blockIdentityTestBridge.getBlocks()
    window.AIWT.state.editor.commands.setTextSelection(blocks.at(-1).pos + 1)
    return {
      previewsStable: previews.every((node, index) => node === document.querySelectorAll('#structureNav .block-preview')[index]),
    }
  })
  assert.deepEqual(stableShelf, { previewsStable: true })

  const afterSelectionIdentity = await page.evaluate(() => ({
    previewsStable: window.__task4ShelfNodes.previews.every((node, index) => node === document.querySelectorAll('#structureNav .block-preview')[index]),
  }))
  assert.deepEqual(afterSelectionIdentity, { previewsStable: true })

  await page.evaluate(() => window.AIWT.state.editor.commands.insertContent('Neu '))
  // Der Wortlaut wird am aria-label geprueft, nicht am sichtbaren Auszug: seit dem
  // 04.08.2026 steht ein Absatz-Auszug nur offen, wenn jemand die Karte angeklickt
  // hat. Das aria-label traegt ihn IMMER -- die Kuerzung ist eine Frage der Augen,
  // nicht der Zugaenglichkeit. Geprueft wird damit dieselbe Zusage wie vorher: die
  // Karte folgt dem Text beim Tippen, ohne dass die Knoten neu gebaut werden.
  const afterTextIdentity = await page.evaluate(() => ({
    previewsStable: window.__task4ShelfNodes.previews.every((node, index) => node === document.querySelectorAll('#structureNav .block-preview')[index]),
    wortlaut: window.__task4ShelfNodes.previews.at(-1).getAttribute('aria-label'),
  }))
  assert.equal(afterTextIdentity.previewsStable, true)
  assert.match(afterTextIdentity.wortlaut || '', /Neu Absatz danach/)

  // Nur EINE große Fläche steht offen: das Einfügemenü und der Agent weichen einander
  // aus, in beide Richtungen.
  const aktiverBlockId = await page.evaluate(() => window.AIWT.__blockIdentityTestBridge.getActiveBlockId())
  await oeffneEinfuegeMenue(page, { oeffnerSelector: strukturKarte(aktiverBlockId) })
  await page.locator('#ondaAura').click()
  assert.equal(await page.locator('.semantic-insert-menu').count(), 0)
  assert.equal(await page.locator('#agentWidget').isVisible(), true)

  // Das erneut geöffnete Menü schließt den Agenten; die Struktur bleibt dauerhaft sichtbar
  await oeffneEinfuegeMenue(page, { oeffnerSelector: strukturKarte(aktiverBlockId) })
  assert.equal(await page.locator('.semantic-insert-menu').count(), 1)
  assert.equal(await page.locator('#agentWidget').isHidden(), true)
  assert.equal(await page.locator('#structureNav .block-preview').count() > 0, true)

  await page.locator('#ondaAura').click()
  assert.equal(await page.locator('.semantic-insert-menu').count(), 0)
  assert.equal(await page.locator('#agentWidget').isVisible(), true)
  await page.locator('#ondaAura').click()

  // Dasselbe gegenüber dem Belegfenster
  await oeffneEinfuegeMenue(page, { oeffnerSelector: strukturKarte(aktiverBlockId) })
  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.workspace.evidenceFindingId = 'task-4-evidence'
    window.AIWT.state.editor.commands.insertContent(' ')
  })
  assert.equal(await page.locator('.semantic-insert-menu').count(), 0)
  assert.equal(await page.locator('#evidenceWindow').isVisible(), true)

  await oeffneEinfuegeMenue(page, { oeffnerSelector: strukturKarte(aktiverBlockId) })
  assert.equal(await page.locator('.semantic-insert-menu').count(), 1)
  assert.equal(await page.locator('#evidenceWindow').isHidden(), true)
  await expectVisible(shelf)

  // ENTFERNT: dass der Einfügeknopf über Auswahlwechsel hinweg derselbe Knoten bleibt.
  // Den Knopf gibt es nicht mehr; dieselbe Zusage gilt jetzt der Struktur-Karte und
  // wird oben bei previewsStable geprüft.
  //
  // Was bleibt: Escape schließt das Menü und gibt den Fokus dorthin zurück, woher es
  // geöffnet wurde -- auch wenn sich zwischendurch die Auswahl im Text verschiebt.
  await page.evaluate(() => {
    const blocks = window.AIWT.__blockIdentityTestBridge.getBlocks()
    window.AIWT.state.editor.commands.setTextSelection(blocks.at(-1).pos + 1)
  })
  assert.equal(await page.evaluate(() => window.__einfuegeOeffner?.isConnected), true)
  await page.keyboard.press('Escape')
  assert.equal(await page.evaluate(() => document.activeElement === window.__einfuegeOeffner), true)

  // Scrollen und Größenänderung schließen das Menü: es steht an einer gemerkten
  // Stelle im Fenster, die nach beidem nicht mehr stimmt.
  await oeffneEinfuegeMenue(page, { oeffnerSelector: strukturKarte(aktiverBlockId) })
  await page.locator('#scroll').evaluate(node => {
    node.scrollTop += 80
    node.dispatchEvent(new Event('scroll'))
  })
  assert.equal(await page.locator('.semantic-insert-menu').count(), 0)

  await oeffneEinfuegeMenue(page, { oeffnerSelector: strukturKarte(aktiverBlockId) })
  await page.evaluate(() => window.dispatchEvent(new Event('resize')))
  assert.equal(await page.locator('.semantic-insert-menu').count(), 0)

  // ENTFERNT: das Verhalten des Einfügeknopfes während einer Zeichenkomposition
  // (japanische Eingabe) -- er trug dabei die Klasse is-typing und verblasste auf
  // Deckkraft 0, und hielt das bis kurz nach dem Ende der Komposition durch. Geprüft
  // wurde ausschließlich der Knopf; ohne ihn bleibt davon nichts übrig.

  await page.close()
}

// ENTFERNT (08.08.2026): runTask5PassageFeedback. Geprüft wurde die zweistufige
// Rückmeldung am Absatz: eine Kurzzeile mit Verbindungsstrich zum Absatz, die sich per
// Eingabetaste zu den drei Feldern Beobachtung, Relevanz und Folge öffnete und beim
// zweiten Druck die Vorschlagskarte mit Wortlaut-Vergleich (bisher gegen neu)
// nachschob. Dazu die Aufklapp-Zusagen für Vorleseprogramme (aria-expanded,
// aria-controls), die Escape-Leiter wieder zurück, die Lage von Karte und
// Abstandhalter zum Folgeabsatz, dass ein Rückgängig im Text die Karten nicht wegriss,
// dass die Ansicht danach zur Ruhe kommt, und schließlich das Übernehmen: Zielwortlaut
// ersetzt, Entscheidung festgehalten, nächster Hinweis im Fokus, alles über einen
// Neustart hinweg gespeichert.
//
// DIESE OBERFLÄCHE GIBT ES SEIT DEM 05.08.2026 NICHT MEHR (e4392ce, „semantische
// Onda-Anmerkungen integrieren"). An ihre Stelle trat eine einzige Fläche
// (`.onda-annotation`), die ohne Aufklappstufen erscheint und ihre Knöpfe sofort
// zeigt. Die alten Erzeuger renderSuggestion, renderLocalDialogue und appendDetailRow
// stehen zwar noch in src/workspace.js, werden dort aber von niemandem mehr aufgerufen.
// Derselbe Commit hat auch den Aufruf dieser Funktion entfernt -- seither war sie
// definiert, lief aber nie. Gemessen am 07.08.2026: rot schon in der dritten Zeile,
// weil die Anmerkungsebene keine Kurzzeile mehr hergibt.
//
// WEITER GEPRÜFT: alle 29 Anmerkungsarten in ihren drei Formen (Markierung, Blase,
// Absatz) in test/beispieltext-anmerkungsarten.test.mjs und test/onda-ui-smoke.mjs;
// die Übernahme als Textänderung und Entscheidung am Modell in
// test/annotation-operations.test.mjs und test/decision-log-smoke.mjs.
// NICHT MEHR GEPRÜFT im Browser: dass ein Rückgängig im Text die offene Anmerkung
// stehen lässt, und dass die Anmerkungsebene nach dem Zeichnen zur Ruhe kommt (die
// alte Zusage: keine endlosen Nachzeichnungen).

// ENTFERNT (08.08.2026): runTask5OwnershipAndAmbiguity. Geprüft wurde, wem der Text
// gehört, wenn man einen Vorschlag nicht einfach übernimmt: „Eigene Fassung schreiben"
// wählt die Zielstelle aus, hält den Zwischenstand als `editingFinding` über einen
// Neustart hinweg, schreibt dabei aber noch keine Entscheidung fest -- erst
// „Eigene Fassung abschliessen" macht daraus eine Entscheidung mit dem selbst
// getippten Wortlaut. Dazu die Abbruchmöglichkeit ohne Spuren, das Verwerfen als
// eigene Entscheidungsart, und drei Sicherungen gegen Raten: ein blockübergreifend
// mehrdeutiges Ziel bekommt keinen Anker, ein veralteter Anker wird nicht umgehängt,
// und weder Übernehmen noch eigene Fassung dürfen etwas am Text ändern, wenn die
// Stelle nicht eindeutig ist -- stattdessen erscheint eine Fehlermeldung.
//
// Angesteuert wurde all das über die zweistufige Kurzzeile, die es seit dem 05.08.2026
// (e4392ce) nicht mehr gibt (siehe die Erklärung bei runTask5PassageFeedback). Auch
// die Beschriftung stimmt nicht mehr: der Knopf heißt heute „Eigene Fassung", nicht
// „Eigene Fassung schreiben". Gemessen am 07.08.2026: rot an der Kurzzeile.
//
// WEITER GEPRÜFT: `editingFinding` in test/workspace-model.test.mjs; dass ein
// mehrdeutiges oder fehlendes Ziel keine Änderung plant, in
// test/annotation-operations.test.mjs; die Entscheidungsarten in
// test/decision-log-smoke.mjs.
// NICHT MEHR GEPRÜFT im Browser: der Weg „eigene Fassung schreiben -> Neustart ->
// abschliessen" von Anfang bis Ende.

// ENTFERNT (08.08.2026): runFinalFindingRegressions. Geprüft wurden drei Fälle, in
// denen ein Hinweis nicht einfach angewendet werden darf: (1) ein Anker, dessen
// Passage inzwischen umgeschrieben wurde -- die Anmerkung meldet „Textstelle
// verändert" und bietet keinen Vorschlag mehr an; (2) Hinweise ohne sichere Textstelle
// (mehrdeutig oder Block gelöscht) -- sie verschwinden nicht, sondern sammeln sich im
// Agentenfeld unter „Hinweise ohne sichere Textstelle"; (3) das Verwerfen einer
// Integritätsfrage -- statt einer stillen Ablage erscheint die Tafel
// „Wissenschaftliches Risiko bewusst annehmen", verlangt eine Begründung und schreibt
// den Status `risk-accepted` mit dieser Begründung fest.
//
// Fall 2 und 3 wurden über die zweistufige Kurzzeile angesteuert, die es seit dem
// 05.08.2026 (e4392ce) nicht mehr gibt; zum Schließen des Agentenfelds diente
// `[data-close-agent]`, das im Quellcode ebenfalls nicht mehr vorkommt. Gemessen am
// 07.08.2026: rot an der Kurzzeile.
//
// WEITER GEPRÜFT: der Status `risk-accepted` samt Begründung am Modell in
// test/agent-findings.test.mjs, test/anchor-verify.test.mjs und
// test/decision-log-smoke.mjs; dass ein mehrdeutiges Ziel keine Änderung plant, in
// test/annotation-operations.test.mjs („replace-range scheitert bei demselben Ziel in
// mehreren Blöcken geschlossen").
// NICHT MEHR GEPRÜFT im Browser: dass die Risiko-Tafel überhaupt erscheint, wenn man
// eine Integritätsfrage verwirft (`.integrity-risk-confirmation`,
// `riskConfirmationFindingId`), und dass unplatzierbare Hinweise im Agentenfeld
// auftauchen. Für beides gibt es derzeit nirgends sonst einen Beleg.

// ENTFERNT (08.08.2026): runTask5MobileFeedback. Geprüft wurde die zweistufige
// Rückmeldung auf dem Tastgerät (390 Punkt): dass Anmerkung und Vorschlagskarte im
// Bild bleiben, einander nicht überdecken, unterhalb des Absatzes sitzen, den
// Folgeabsatz über einen Abstandhalter freihalten, und dass sie nach Rollen und
// Größenänderung wieder richtig sitzen. Zuletzt (07.08.2026, c0a8f21) waren hier schon
// die Prüfungen zum entfallenen Einfügeknopf herausgenommen worden -- an einer
// Funktion, die zu diesem Zeitpunkt längst niemand mehr aufrief.
//
// Die Oberfläche gibt es seit dem 05.08.2026 (e4392ce) nicht mehr (siehe die Erklärung
// bei runTask5PassageFeedback). Gemessen am 07.08.2026: rot, weil schon der Aufbau
// aus Notiz, Vorschlag und Abstandhalter nie zustande kommt.
//
// WEITER GEPRÜFT: dass die Anmerkungsfläche auf schmalem Bild nicht überläuft, prüft
// test/onda-ui-smoke.mjs. GERETTET wurde aus dieser Funktion nichts: dass das
// Einfügemenü den Vorschlag beiseiteräumt, hing an genau der Vorschlagskarte, die weg
// ist; das Menü selbst prüft runTask4InteractionRegressions weiter.

// ENTFERNT (08.08.2026): injectTask6PassageFinding. Der Helfer setzte dem Beispieltext
// eine Anmerkung an die Stelle „Calm Technology beschreibt Technik" -- wahlweise mit
// zwei Belegen (geprüfte Primärquelle und ungeprüfte Arbeitsnotiz), um das Belegfenster
// zu füllen. Gebraucht wurde er nur von runTask6Mobile, prepareTask7Scenario und
// runTask7KeyboardAndMotion; alle drei sind mit der zweistufigen Oberfläche entfallen.
// Die Belege selbst prüft heute test/evidence-bundle.test.mjs am Modell.

// ENTFERNT (07.08.2026): runTask6DialogueAndEvidence. Die Funktion war seit dem
// Umbau der Rückmeldungs-Oberfläche definiert, aber von niemandem mehr aufgerufen --
// sie lief also nie und prüfte nichts. Was sie beschrieb (Gespräch am Absatz,
// Belegfenster), prüft der semantische Onda-Smoke über alle Formen hinweg.

// ENTFERNT (08.08.2026): runTask6Mobile. Geprüft wurde die Rückmeldung auf dem
// Tastgerät (390 Punkt): dass das Agentenfeld mit seinem Eingabefeld vollständig im
// Bild bleibt, dass das Gespräch am Absatz nach acht Antworten nicht aus dem Bild
// wächst, dass die Nachrichtenliste dabei selbst rollt statt die Karte zu strecken,
// der Abstandhalter unter dem Absatz höchstens 460 Punkt misst und das Eingabefeld
// den Fokus behält.
//
// Der Weg dorthin führte über die zweistufige Kurzzeile und die Gesprächskarte
// `.local-dialogue`; beide gibt es seit dem 05.08.2026 (e4392ce) nicht mehr -- der
// Erzeuger renderLocalDialogue steht noch in src/workspace.js, ruft aber niemand mehr
// auf. Auch `[data-close-agent]`, mit dem die Funktion das Agentenfeld schloss, kommt
// im Quellcode nicht mehr vor. Gemessen am 07.08.2026: rot an der Kurzzeile.
//
// NICHT MEHR GEPRÜFT: dass ein langes Gespräch am Absatz auf schmalem Bild nicht
// überläuft. Das Gespräch lebt heute in der Anmerkungsfläche (`.aura-dialogue`).

async function runTask6InitiativeAndLifecycle(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await openExample(page)

  const typeAtEnd = async text => {
    await page.evaluate(() => {
      const blocks = window.AIWT.__blockIdentityTestBridge.getBlocks()
      const block = blocks.at(-1)
      window.AIWT.state.editor.commands.setTextSelection(block.pos + block.nodeSize - 1)
      window.AIWT.state.editor.view.focus()
    })
    await page.keyboard.type(text)
  }

  await typeAtEnd('h')
  await page.locator('#sidebarBack').click()
  await page.waitForTimeout(3300)
  assert.equal(await page.locator('#agentWidget').isHidden(), true)
  assert.equal(await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.workspace.agent.open
  }), false)

  await openExample(page, false)
  await typeAtEnd('d')
  const switchedId = await page.evaluate(() => {
    const source = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    const copy = JSON.parse(JSON.stringify(source))
    copy.id = `task-6-switch-${Date.now()}`
    copy.title = 'Initiative Dokumentwechsel'
    copy.workspace.agent.open = false
    copy.workspace.agent.activeMessageId = null
    copy.workspace.agent.dismissedIds = []
    window.AIWT.state.docs.push(copy)
    window.AIWT.openDoc(copy.id)
    return copy.id
  })
  await page.waitForTimeout(3300)
  assert.equal(await page.locator('#agentWidget').isHidden(), true)
  assert.equal(await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === id)
    return doc.workspace.agent.open
  }, switchedId), false)

  await typeAtEnd('v')
  await page.evaluate(() => {
    window.__task6Visibility = 'hidden'
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => window.__task6Visibility,
    })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.waitForTimeout(3300)
  assert.equal(await page.locator('#agentWidget').isHidden(), true)
  await page.evaluate(() => {
    window.__task6Visibility = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
  })

  await typeAtEnd('a')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(420)
  assert.equal(await page.locator('#agentWidget').isVisible(), true)
  await page.keyboard.press('Escape')

  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.workspace.agent.open = false
    doc.workspace.agent.dismissedIds = []
    window.AIWT.__workspaceTestBridge.invalidateInitiative()
  })
  await typeAtEnd('b')
  await page.keyboard.press('Enter')
  await page.keyboard.type('Folgeeingabe')
  await page.waitForTimeout(420)
  assert.equal(await page.locator('#agentWidget').isHidden(), true)

  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.workspace.agent.open = false
    doc.workspace.agent.dismissedIds = []
    window.AIWT.__workspaceTestBridge.invalidateInitiative()
  })
  await typeAtEnd('c')
  await page.keyboard.press('Shift+Enter')
  await page.waitForTimeout(450)
  assert.equal(await page.locator('#agentWidget').isHidden(), true)

  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.workspace.agent.open = false
    doc.workspace.agent.dismissedIds = []
    window.AIWT.__workspaceTestBridge.invalidateInitiative()
  })
  await typeAtEnd('d')
  await page.evaluate(() => {
    const editor = window.AIWT.state.editor.view.dom
    editor.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '日' }))
  })
  await page.waitForTimeout(3350)
  assert.equal(await page.locator('#agentWidget').isHidden(), true)
  await page.evaluate(() => {
    const editor = window.AIWT.state.editor.view.dom
    editor.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '日' }))
  })
  await page.waitForTimeout(450)
  assert.equal(await page.locator('#agentWidget').isHidden(), true)

  const lifecycle = await page.evaluate(() => {
    const bridge = window.AIWT.__workspaceTestBridge
    bridge.reinitialize()
    bridge.reinitialize()
    const pluginCountAfterDoubleInit = window.AIWT.state.editor.state.plugins
      .filter(plugin => plugin.key.startsWith('workspaceActiveBlock$') || plugin.key.startsWith('workspaceLocalFinding$')).length
    bridge.destroy()
    const pluginCountAfterDestroy = window.AIWT.state.editor.state.plugins
      .filter(plugin => plugin.key.startsWith('workspaceActiveBlock$') || plugin.key.startsWith('workspaceLocalFinding$')).length
    const closeHookAfterDestroy = typeof window.__workspaceCloseTopLayer
    bridge.reinitialize()
    return { pluginCountAfterDoubleInit, pluginCountAfterDestroy, closeHookAfterDestroy }
  })
  assert.deepEqual(lifecycle, {
    pluginCountAfterDoubleInit: 2,
    pluginCountAfterDestroy: 0,
    closeHookAfterDestroy: 'undefined',
  })

  const generationBefore = await page.evaluate(() => window.AIWT.__workspaceTestBridge.snapshot().inputGeneration)
  await typeAtEnd('z')
  const generationAfter = await page.evaluate(() => window.AIWT.__workspaceTestBridge.snapshot().inputGeneration)
  assert.equal(generationAfter, generationBefore + 1)
  await page.close()
}

// ENTFERNT (08.08.2026): der ganze Task-7-Block -- TASK7_SCENARIOS, parkPassageFindings,
// captureTask7PassageState, prepareTask7Scenario, assertTask7IconControls,
// assertVisibleTabSequence, assertTask7MobileHitboxes, assertTask7CommonLayout,
// runTask7Scenarios, runTask7Intermediate, transitionSeconds, assertReducedTransition
// und runTask7KeyboardAndMotion.
//
// Geprüft wurde eine Matrix aus sieben Lagen (leer, Struktur, Anmerkung, Vorschlag,
// Gespräch, Agent, Belege) mal drei Breiten (390, 1024, 1440): kein waagerechtes
// Überlaufen, keine zwei Hauptflächen gleichzeitig offen, der lokale Hinweis wird
// pausiert statt gelöscht, während Agent oder Belege offen sind, 44-Punkt-Trefferflächen
// auf dem Tastgerät, zugängliche Namen und sichtbarer Fokus an allen Symbolknöpfen,
// eine Tabfolge ohne unsichtbare Ziele, sowie bei „Bewegung reduzieren" fast
// abgeschaltete Übergänge. Dazu die Escape-Leiter (Vorschlag, Agent, Belege, Projekt-
// fenster) und die Rückkehr in die Übersicht.
//
// Vier der sieben Lagen -- Anmerkung, Vorschlag, Gespräch, Belege -- wurden über die
// zweistufige Kurzzeile hergestellt, die es seit dem 05.08.2026 (e4392ce) nicht mehr
// gibt (siehe die Erklärung bei runTask5PassageFeedback). Ohne sie lassen sich die
// Lagen nicht mehr aufbauen, und die Prüfungen auf `.local-finding`,
// `.local-finding-short`, `.local-finding-disclosure` und `.suggestion-action` zielen
// auf Klassen, die niemand mehr erzeugt. Gemessen am 07.08.2026: alle drei Läufe rot,
// jeder an genau dieser Stelle.
//
// ACHTUNG für die Nachwelt: Commit 94c0c81 vom 08.08.2026 hat in
// assertTask7MobileHitboxes noch `#sidebarReopen` auf `#sidebarToggle` nachgezogen --
// an einer Funktion, die zu diesem Zeitpunkt schon drei Tage lang nie lief. Genau so
// entsteht der Eindruck von Absicherung, wo keine ist. Die Verschärfung ist damit
// gegenstandslos geworden; die übrigen drei aus demselben Commit (eine Klinke statt
// zweier, Kursiv als einzige Auszeichnung, „Erkanntes" im Projektverständnis-Fenster)
// liegen in Funktionen, die laufen, und sind unangetastet.
//
// WEITER GEPRÜFT: Breitenverhalten, Trefferflächen, Fokus, Kontrast und die
// Escape-Leiter der heutigen Oberfläche in test/onda-ui-smoke.mjs (Abschnitte shell,
// surfaces, accessibility) und test/etappe-d2-smoke.mjs über drei Browser-Motoren.
// NICHT MEHR GEPRÜFT: dass der lokale Hinweis pausiert statt verschwindet, solange
// Agentenfeld oder Belegfenster offen sind (`is-paused`, `aria-hidden`), und dass der
// Text rechts nicht unter das Agentenfeld läuft.

async function runSystem8BudgetGate(browser) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 850 } })
  const errors = []
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', error => errors.push(error.message))
  await openExample(page)
  await installiereTransportMock(page)

  await page.evaluate(() => {
    window.AIWT.newProject('SYSTEM-08 Budget-Eval')
    window.AIWT.newDoc()
    window.AIWT.__blockIdentityTestBridge.setContent([
      {
        type: 'paragraph',
        content: [{
          type: 'text',
          text: 'Dieser vorhandene Text ist absichtlich deutlich länger als zweihundert Zeichen. '
            + 'Er beschreibt eine ruhige Schreibumgebung, in der automatische Hinweise nur dann '
            + 'laufen sollen, wenn die Kostenbremse dies erlaubt. Die Passage wird verlängert, '
            + 'damit beim erneuten Öffnen ein automatischer Verständnisentwurf vorgesehen ist.',
        }],
      },
    ])
    window.AIWT.flushSave()
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.workspace.agent.messages = []
    const project = window.AIWT.state.projects.find(candidate => candidate.id === doc.projectId)
    project.understanding.entwurfVersuchtAm = null
    window.AIWT.state.settings.usage.kostenCents = 100
    window.__llmMock.aufrufe.length = 0
    window.AIWT.persist()
  })

  await page.locator('#kiSettings').click()
  const dialog = page.locator('#kiModal[role="dialog"]')
  await expectVisible(dialog)

  // Issue #13 (Task 4): der Ertrag-Abschnitt steht zwischen Verbrauch und Budget. Frisches
  // Projekt, noch keine einzige Entscheidung — hier MUSS der ehrliche "noch zu wenig"-Satz
  // stehen, nie eine Quote aus zu wenigen Fällen.
  const ertrag = dialog.locator('.ki-ertrag')
  await expectVisible(ertrag)
  assert.match(await ertrag.locator('.onda-eyebrow').textContent(), /^Ertrag$/)
  assert.match(await ertrag.textContent(), /Diesen Monat/, 'Der Monats-Satz fehlt im frischen Zustand')
  assert.match(
    await ertrag.textContent(),
    /Noch zu wenig entschieden/,
    'Ohne Entscheidungen muss der ehrliche "noch zu wenig"-Satz stehen, keine Quote',
  )

  await dialog.locator('#kiBudgetInput').fill('0.50')
  await dialog.locator('.ki-budget-form').getByRole('button', { name: 'Grenze speichern', exact: true }).click()
  assert.match(await dialog.locator('.ki-budget-status').textContent(), /Grenze erreicht/)
  await page.keyboard.press('Escape')

  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.workspace.agent.messages = []
    const project = window.AIWT.state.projects.find(candidate => candidate.id === doc.projectId)
    project.understanding.entwurfVersuchtAm = null
    window.__llmMock.aufrufe.length = 0

    // Zwölf entschiedene Hinweise — über der Mindestzahl (10) aus lauf-bilanz.mjs. Ab
    // hier darf der Ertrag-Abschnitt eine echte Quote mit Basis zeigen statt des
    // "noch zu wenig"-Satzes.
    const jetzt = Date.now()
    doc.findings = Array.from({ length: 12 }, (_, index) => ({
      id: `ertrag-finding-${index}`,
      kiKategorie: 'fakt',
      status: 'resolved',
    }))
    doc.decisions = doc.findings.map(finding => ({
      id: `decision-${finding.id}-${jetzt}`,
      findingId: finding.id,
      kind: 'accept',
      outcome: 'resolved',
      at: jetzt,
    }))
    window.AIWT.persist()
    window.AIWT.__workspaceTestBridge.reinitialize()
  })
  await page.waitForTimeout(100)
  assert.equal(await page.evaluate(() => window.__llmMock.aufrufe.length), 0,
    'Oberhalb der Monatsgrenze darf kein automatischer Netzwerkaufruf starten')

  await page.locator('#kiSettings').click()
  await expectVisible(dialog)

  // Mit den zwölf entschiedenen Hinweisen zeigt der Ertrag-Abschnitt jetzt eine Zeile mit
  // sichtbarer Basis ("X von Y") statt des "noch zu wenig"-Satzes.
  const ertragMitBasis = await dialog.locator('.ki-ertrag').textContent()
  assert.match(ertragMitBasis, /\d+ von \d+ angenommen/, 'Die Quote mit Basis fehlt trotz zwölf entschiedener Hinweise')
  assert.doesNotMatch(ertragMitBasis, /Noch zu wenig entschieden für eine ehrliche Quote/)

  assert.match(await dialog.locator('.ki-budget-status--paused').textContent(), /Automatische Läufe sind pausiert/)
  await dialog.getByRole('button', { name: 'Genau einen automatischen Lauf freigeben', exact: true }).click()
  await page.waitForFunction(() => window.__llmMock.aufrufe.length === 1)
  await page.waitForTimeout(100)
  const nachFreigabe = await page.evaluate(() => ({
    aufrufe: window.__llmMock.aufrufe.length,
    freigaben: window.AIWT.state.settings.automatikFreigabe.verbleibend,
    budget: window.AIWT.state.settings.kiMonatsbudgetCents,
  }))
  assert.deepEqual(nachFreigabe, { aufrufe: 1, freigaben: 0, budget: 50 })
  assert.deepEqual(errors, [])
  await page.close()
}

async function runFinalStateLearningAndCrossDocument(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', error => errors.push(error.message))
  await openExample(page)

  const fixture = await page.evaluate(() => {
    window.AIWT.newProject('Fertigzustand: Lernen und Verbindungen')
    window.AIWT.newDoc()
    window.AIWT.__blockIdentityTestBridge.setContent([{
      type: 'paragraph',
      content: [{
        type: 'text',
        text: 'Die Instandhaltung der Leitungen wurde über Jahrzehnte aufgeschoben.',
      }],
    }])
    window.AIWT.flushSave()
    const target = window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active)
    target.title = 'Instandhaltung'
    const targetBlockId = window.AIWT.__blockIdentityTestBridge.getBlocks()[0].id

    window.AIWT.newDoc()
    window.AIWT.__blockIdentityTestBridge.setContent([{
      type: 'paragraph',
      content: [{ type: 'text', text: 'Die Stadt wuchs schneller als ihre Leitungen.' }],
    }])
    window.AIWT.flushSave()
    const source = window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active)
    source.title = 'Wachstum'
    const projectId = source.projectId

    source.erweiterungen = [{
      id: 'eval-verbindung',
      art: 'verbindung',
      status: 'neu',
      createdAt: 1,
      gedanke: 'Wachstum und aufgeschobene Instandhaltung gehören zusammen.',
      muster: 'Wo ein Text Tempo nennt, lohnt der Blick auf dessen Rechnung.',
      stellen: [
        { text: 'Die Stadt wuchs schneller als ihre Leitungen.', blockId: window.AIWT.__blockIdentityTestBridge.getBlocks()[0].id },
        {
          text: 'Die Instandhaltung der Leitungen wurde über Jahrzehnte aufgeschoben.',
          blockId: null,
          docId: target.id,
          docTitel: target.title,
        },
      ],
    }]

    const prinzip = 'Ein ruhiger Satz trägt den Gedanken ohne ihn auszurufen.'
    window.AIWT.state.memoryStore.entries.push(...[
      { id: 'eval-prinzip-1', createdAt: 10, documentId: source.id, anchor: 'Die Stadt wuchs schneller als ihre Leitungen.' },
      { id: 'eval-prinzip-2', createdAt: 20, documentId: target.id, anchor: 'Die Instandhaltung der Leitungen wurde über Jahrzehnte aufgeschoben.' },
    ].map(eintrag => ({
      id: eintrag.id,
      level: 'personal',
      type: 'prinzip',
      content: prinzip,
      scope: { ownerId: 'local-author', allProjects: true },
      provenance: { actor: 'user', action: 'erkanntes-hand', originEventIds: [eintrag.documentId] },
      sensitivity: 'personal',
      deletionRule: 'manual',
      createdAt: eintrag.createdAt,
      status: 'active',
      person: {
        dimension: 'sprache',
        occurrence: { projectId, documentId: eintrag.documentId, anchor: eintrag.anchor },
      },
    })))

    const findings = []
    const decisions = []
    for (let index = 0; index < 5; index += 1) {
      const id = `eval-sprache-${index}`
      findings.push({ id, kiKategorie: 'sprache', status: 'dismissed' })
      decisions.push({ id: `entscheidung-${id}`, findingId: id, action: 'reject', outcome: 'dismissed', at: 100 + index })
    }
    for (let index = 0; index < 10; index += 1) {
      const id = `eval-struktur-${index}`
      findings.push({ id, kiKategorie: 'struktur', status: 'resolved' })
      decisions.push({ id: `entscheidung-${id}`, findingId: id, action: 'accept', outcome: 'resolved', at: 200 + index })
    }
    source.findings = findings
    source.decisions = decisions
    window.AIWT.persist()
    window.AIWT.__workspaceTestBridge.reinitialize()
    return { sourceId: source.id, targetId: target.id, targetBlockId, prinzip }
  })

  // „Erkanntes" stand bis zum 8. August 2026 als eigener Abschnitt in der Seitenleiste.
  // Die Leiste hat jetzt genau drei Abschnitte (Jakob: Erkanntes und Erweiterungen sind
  // "sachen die der agent im chat oder als anmerkung kommuniziert"). Erkanntes ist aber
  // KEIN proaktives Angebot, sondern ein Blick zurueck auf den Personenspeicher —
  // deshalb liegt es jetzt im Projektverstaendnis-Fenster, wo auch das Projektgedaechtnis
  // liegt. Der Inhalt ist derselbe geblieben, nur der Weg dorthin ist ein anderer.
  await ensureProjectSidebarOpen(page)
  await page.locator('#pvCard').click()
  await page.locator('#pvModal').waitFor({ state: 'visible' })
  await page.locator('#pvModal').getByRole('button', { name: 'Erkanntes', exact: true }).click()
  const erkanntes = page.locator('#pvModal .onda-erk-flaeche')
  await erkanntes.getByRole('button', { name: 'Als Stimme prüfen', exact: true }).waitFor()
  assert.match(await erkanntes.textContent(), /Sprache/)
  assert.match(await erkanntes.textContent(), /2×/)
  assert.match(await erkanntes.textContent(), /Beobachtbare Entwicklung/)
  assert.equal(await erkanntes.locator('progress, meter, [role="progressbar"]').count(), 0)
  assert.doesNotMatch(await erkanntes.textContent(), /Punktestand|Erfolgsquote/i)

  await erkanntes.getByRole('button', { name: 'Als Stimme prüfen', exact: true }).click()
  await erkanntes.getByRole('button', { name: 'Als Stimme bestätigen', exact: true }).click()
  const aktiveStimme = erkanntes.getByRole('button', { name: 'Teil deiner Stimme', exact: true })
  await aktiveStimme.waitFor()
  assert.equal(await page.evaluate(prinzip => window.AIWT.state.memoryStore.entries.some(eintrag => (
    eintrag.type === 'voice' && eintrag.status === 'active' && eintrag.content === prinzip
  )), fixture.prinzip), true)
  await aktiveStimme.click()
  assert.equal(await page.evaluate(prinzip => window.AIWT.state.memoryStore.entries.some(eintrag => (
    eintrag.type === 'voice' && eintrag.status === 'active' && eintrag.content === prinzip
  )), fixture.prinzip), false)

  const rueckkopplung = erkanntes.locator('details.onda-rueckkopplung')
  await rueckkopplung.waitFor()
  await rueckkopplung.locator('summary').click()
  await rueckkopplung.getByRole('button', { name: 'Bei der Darreichung berücksichtigen', exact: true }).click()
  assert.equal(await page.evaluate(() => window.AIWT.state.rueckkopplung?.status), 'approved')
  await rueckkopplung.locator('summary').click()
  await rueckkopplung.getByRole('button', { name: 'Nicht mehr berücksichtigen', exact: true }).click()
  assert.equal(await page.evaluate(() => window.AIWT.state.rueckkopplung?.status), 'rejected')

  // Erweiterungen haben seit dem 8. August 2026 keine eigene Spalte mehr. Jakob:
  // "erweiterungsanmerkungen sind sachen die der agent im chat oder als anmerkung
  // kommuniziert". Der Kanal spricht jetzt im Chat — eine Erweiterung ist etwas, das
  // jemand SAGT, kein Posten in einem Regal.
  await page.waitForFunction(() => {
    const doc = window.AIWT.state.docs.find(d => d.id === window.AIWT.state.active)
    return (doc?.workspace?.agent?.messages || []).some(m => String(m.id).startsWith('erweiterung-'))
  }, null, { timeout: 10000 }).catch(() => {
    assert.fail('Keine Erweiterung ist im Chat angekommen')
  })
  const erweiterungImChat = await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(d => d.id === window.AIWT.state.active)
    return (doc?.workspace?.agent?.messages || [])
      .filter(m => String(m.id).startsWith('erweiterung-'))
      .map(m => m.text)
  })
  assert.ok(
    erweiterungImChat.some(text => /Verbindung|Weiterführung|Feld/.test(text)),
    `Die Erweiterung nennt ihre Art nicht: ${erweiterungImChat.join(' | ')}`,
  )

  // OFFENE LÜCKE, absichtlich hier festgehalten statt still übergangen: die alte Spalte
  // hatte für eine "Verbindung" einen Knopf zur ZWEITEN Stelle — auch über
  // Dokumentgrenzen hinweg. Chat-Nachrichten tragen heute nur Text und keine Handlung,
  // also gibt es diesen Sprung nicht mehr. Eine Verbindung, die man nicht aufsuchen
  // kann, ist eine halbe Verbindung. Wer das behebt, ersetzt diesen Kommentar durch die
  // Prüfung, die den Sprung wieder belegt.
  assert.deepEqual(errors, [])
  await page.close()
}

const browser = await chromium.launch({ headless: true })
try {
  if (process.env.AIWT_FINALSTATE_ONLY === '1') {
    await runFinalStateLearningAndCrossDocument(browser)
  } else if (process.env.AIWT_SYSTEM8_ONLY === '1') {
    await runSystem8BudgetGate(browser)
  } else {
    // Jede hier aufgeführte Prüfung läuft auch wirklich. Wer eine Funktion in dieser
    // Datei anlegt, ohne sie hier einzutragen, baut eine Kulisse: die Datei sähe nach
    // Absicherung aus, ein Teil davon liefe nie. Genau das war zwischen dem 05. und
    // dem 08.08.2026 der Fall -- neun Funktionen mit rund tausend Zeilen standen
    // stumm herum, und eine spätere Sitzung hat sogar noch eine davon "verschärft".
    // Ihre Stellen sind oben als ENTFERNT-Kommentare vermerkt.
    await runSeedMigrationRegression(browser)
    await runDesktop(browser)
    await runBlockIdentityRegressions(browser)
    await runTask4InteractionRegressions(browser)
    // Die frühere zweistufige Oberfläche aus Kurzzeile, Beobachtung/Relevanz/Folge
    // und separater Vorschlagskarte existiert absichtlich nicht mehr. Ihre
    // Interaktionspfade werden im semantischen Onda-Smoke über alle Formen geprüft.
    await runSaveAlert(browser)
    await runPrintLayout(browser)
    await runHomeFocus(browser)
    await runMobile(browser)
    // Die Zurückhaltung des Agentenfelds und der Lebenslauf der Editor-Erweiterungen.
    // Hing nie an der entfernten Kartenstruktur und lief am 07.08.2026 auf Anhieb
    // grün; docs/ABNAHME-ETAPPE-A.md beruft sich darauf, also muss der Lauf sie auch
    // ausführen.
    await runTask6InitiativeAndLifecycle(browser)
    await runSystem8BudgetGate(browser)
    await runFinalStateLearningAndCrossDocument(browser)
    // Die alten Task-7-Screenshots beschrieben dieselbe entfernte Kartenstruktur.
    // Die neue Matrix lebt in onda-ui-smoke.mjs und annotation-lab.html.
    // Der Schalter AIWT_TASK7_ONLY ist mit ihnen entfallen: er hätte zuletzt gar
    // nichts mehr ausgeführt und trotzdem „V2 smoke passed" gemeldet.
  }
  console.log('V2 smoke passed')
} finally {
  await browser.close()
}
