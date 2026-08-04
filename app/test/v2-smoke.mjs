import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const baseUrl = process.env.AIWT_URL || 'http://127.0.0.1:4173/'
const screenshotDir = process.env.AIWT_SCREENSHOT_DIR || '/tmp'

function assertReachableSurfaceIsV2Only() {
  const reachableFiles = [
    '../index.html',
    '../src/editor.js',
    '../src/ui.js',
  ]
  const reachable = reachableFiles
    .map(path => readFileSync(new URL(path, import.meta.url), 'utf8'))
    .join('\n')
  const forbidden = [
    /from ['"]\.\/panels\.js['"]/,
    /from ['"]\.\/structure\.js['"]/,
    /\binitPanels\s*\(/,
    /\binitStructure\s*\(/,
    /\bbuildRails\s*\(/,
    /\bbuildBubble\s*\(/,
    /\bshowBubble\s*\(/,
    /\bid=["'](?:railL|railR|pCoach|pStruct|structView)["']/,
    /\bid=["'](?:workspaceHeader|workspaceBack|workspacePath|agentPresence|structureShelf|workspaceBody)["']/,
  ]
  forbidden.forEach(pattern => {
    assert.equal(pattern.test(reachable), false, `Alte erreichbare Oberfläche gefunden: ${pattern}`)
  })

  const example = readFileSync(new URL('../src/example.js', import.meta.url), 'utf8')
  assert.match(example, /volle Kraft, leise Präsentation/)

  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  for (const id of ['ondaSidebar', 'structureNav', 'ondaAura', 'pvCard', 'sidebarBack']) {
    assert.match(html, new RegExp(`id=["']${id}["']`), `Neue Rahmenstruktur fehlt: #${id}`)
  }
}

assertReachableSurfaceIsV2Only()

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

async function waitForLocalFeedbackLayout(page, blockId, expectSuggestion = false) {
  await page.waitForFunction(({ blockId: id, expectSuggestion: withSuggestion }) => {
    const note = document.querySelector(`#localAgentLayer .local-finding[data-block-id="${id}"]`)
    const block = document.querySelector(`#editor .ProseMirror > [data-block-id="${id}"]`)
    if (!note || !block || note.hidden || note.getBoundingClientRect().width <= 0) return false

    const noteRect = note.getBoundingClientRect()
    const blockRect = block.getBoundingClientRect()
    if (note.classList.contains('is-below') && noteRect.top < blockRect.bottom - 1) return false
    if (!withSuggestion) return true

    const suggestion = document.querySelector(`#localAgentLayer .local-suggestion[data-block-id="${id}"]`)
    const spacer = block.nextElementSibling
    const nextBlock = spacer?.classList.contains('local-feedback-spacer')
      ? spacer.nextElementSibling
      : spacer
    if (!suggestion || !spacer?.classList.contains('local-feedback-spacer')) return false

    const suggestionRect = suggestion.getBoundingClientRect()
    const nextBlockTop = nextBlock?.getBoundingClientRect().top || Number.POSITIVE_INFINITY
    const agentOverlap = Math.min(suggestionRect.bottom, noteRect.bottom) - Math.max(suggestionRect.top, noteRect.top)
    const surfacesClear = note.classList.contains('is-below')
      ? agentOverlap <= 1 && Math.max(suggestionRect.bottom, noteRect.bottom) <= nextBlockTop + 1
      : suggestionRect.bottom <= nextBlockTop + 1
    return spacer.getBoundingClientRect().height > 0 && surfacesClear
  }, { blockId, expectSuggestion })
}

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
  await page.locator('#sidebarCollapse').click()
  assert.equal(await page.locator('#editorView').evaluate(n => n.classList.contains('is-sidebar-collapsed')), true)
  assert.equal(await page.locator('#sidebarReopen').isVisible(), true)
  assert.equal(await page.evaluate(() => AIWT.state.settings.sidebarCollapsed), true)
  await page.locator('#sidebarReopen').click()
  assert.equal(await page.locator('#editorView').evaluate(n => n.classList.contains('is-sidebar-collapsed')), false)
  assert.equal(await page.locator('#sidebarReopen').isHidden(), true)
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

  // Einfügen läuft ausschließlich über den Editor-Trigger (die Seitenleiste hat keine Insert-Buttons mehr)
  const trigger = page.locator('#blockInsertTrigger')
  assert.equal(await trigger.count(), 1)
  const beforeInsert = await page.locator('#editor .ProseMirror > [data-block-id]').count()
  await trigger.evaluate(node => node.click())
  const shelfMenu = page.locator('.semantic-insert-menu')
  await expectVisible(shelfMenu)
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

  await insertedBlock.hover()
  await expectVisible(trigger)
  const triggerPosition = await trigger.boundingBox()
  const activePosition = await insertedBlock.boundingBox()
  assert.ok(Math.abs(triggerPosition.y - activePosition.y - activePosition.height) < 28)
  await trigger.focus()
  await page.keyboard.press('Enter')
  const editorMenu = page.locator('.semantic-insert-menu')
  await expectVisible(editorMenu)
  assert.equal(await page.locator('.semantic-insert-choice:focus').textContent(), 'Freier Absatz')
  await page.keyboard.press('ArrowDown')
  assert.equal(await page.locator('.semantic-insert-choice:focus').textContent(), 'Kernbehauptung')
  await page.keyboard.press('Escape')
  assert.equal(await editorMenu.count(), 0)
  assert.equal(await trigger.evaluate(node => document.activeElement === node), true)

  const insertedBlockId = await insertedBlock.getAttribute('data-block-id')
  await page.evaluate(blockId => {
    const block = window.AIWT.__blockIdentityTestBridge.getBlocks().find(candidate => candidate.id === blockId)
    window.AIWT.state.editor.commands.setTextSelection(block.pos + 1)
    window.AIWT.state.editor.view.focus()
  }, insertedBlockId)
  await page.keyboard.type('x')
  assert.equal(await trigger.evaluate(node => node.classList.contains('is-typing')), true)
  await page.waitForTimeout(200)
  assert.equal(await trigger.evaluate(node => getComputedStyle(node).opacity), '0')

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
  await page.locator('#sidebarCollapse').click()
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
  await page.locator('#sidebarReopen').click()
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

  for (const selector of [
    '.onda-topbar',
    '#ondaSidebar',
    '#agentWidget',
    '#evidenceWindow',
    '#blockInsertLayer',
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
  assert.doesNotMatch(schemaContract.html, /<(?:strong|em|u|s|code|img)\b|style=/)
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

  // Einfügen läuft über den Editor-Trigger; er fügt hinter dem aktiven Block (secondRule) ein
  await page.locator('#blockInsertTrigger').evaluate(node => node.click())
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

  // Das Trigger-Menü schließt beim Öffnen des Agenten
  await page.locator('#blockInsertTrigger').evaluate(node => node.click())
  await expectVisible(page.locator('.semantic-insert-menu'))
  await page.locator('#ondaAura').click()
  assert.equal(await page.locator('.semantic-insert-menu').count(), 0)
  assert.equal(await page.locator('#agentWidget').isVisible(), true)

  // Das erneute Trigger-Menü schließt den Agenten; die Struktur bleibt dauerhaft sichtbar
  await page.locator('#blockInsertTrigger').evaluate(node => node.click())
  assert.equal(await page.locator('.semantic-insert-menu').count(), 1)
  assert.equal(await page.locator('#agentWidget').isHidden(), true)
  assert.equal(await page.locator('#structureNav .block-preview').count() > 0, true)

  await page.locator('#ondaAura').click()
  assert.equal(await page.locator('.semantic-insert-menu').count(), 0)
  assert.equal(await page.locator('#agentWidget').isVisible(), true)
  await page.locator('#ondaAura').click()

  await page.locator('#blockInsertTrigger').evaluate(node => node.click())
  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.workspace.evidenceFindingId = 'task-4-evidence'
    window.AIWT.state.editor.commands.insertContent(' ')
  })
  assert.equal(await page.locator('.semantic-insert-menu').count(), 0)
  assert.equal(await page.locator('#evidenceWindow').isVisible(), true)

  await page.locator('#blockInsertTrigger').evaluate(node => node.click())
  assert.equal(await page.locator('.semantic-insert-menu').count(), 1)
  assert.equal(await page.locator('#evidenceWindow').isHidden(), true)
  await expectVisible(shelf)

  // Der Trigger ist ein stabiler Einzelknoten; Escape schließt das Menü und gibt ihm den Fokus zurück
  const triggerOpenerConnected = await page.locator('#blockInsertTrigger').evaluate(node => {
    window.__task4TriggerOpener = node
    return node.isConnected
  })
  assert.equal(triggerOpenerConnected, true)
  await page.evaluate(() => {
    const blocks = window.AIWT.__blockIdentityTestBridge.getBlocks()
    window.AIWT.state.editor.commands.setTextSelection(blocks.at(-1).pos + 1)
  })
  assert.equal(await page.evaluate(() => window.__task4TriggerOpener === document.getElementById('blockInsertTrigger')), true)
  await page.keyboard.press('Escape')
  assert.equal(await page.evaluate(() => document.activeElement === window.__task4TriggerOpener), true)

  await page.locator('#blockInsertTrigger').evaluate(node => node.click())
  await page.locator('#scroll').evaluate(node => {
    node.scrollTop += 80
    node.dispatchEvent(new Event('scroll'))
  })
  assert.equal(await page.locator('.semantic-insert-menu').count(), 0)

  await page.locator('#blockInsertTrigger').evaluate(node => node.click())
  await page.evaluate(() => window.dispatchEvent(new Event('resize')))
  assert.equal(await page.locator('.semantic-insert-menu').count(), 0)

  const trigger = page.locator('#blockInsertTrigger')
  await page.locator('#editor .ProseMirror > p').last().hover()
  await page.evaluate(() => {
    const editor = window.AIWT.state.editor.view.dom
    editor.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: 'に' }))
  })
  await page.waitForTimeout(620)
  assert.equal(await trigger.evaluate(node => node.classList.contains('is-typing')), true)
  assert.equal(await trigger.evaluate(node => getComputedStyle(node).opacity), '0')
  await page.evaluate(() => {
    window.AIWT.state.editor.view.dom.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '日本' }))
  })
  await page.waitForTimeout(200)
  assert.equal(await trigger.evaluate(node => node.classList.contains('is-typing')), true)
  await page.waitForTimeout(380)
  assert.equal(await trigger.evaluate(node => node.classList.contains('is-typing')), false)

  await page.close()
}

async function runTask5PassageFeedback(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await openExample(page)

  const localLayer = page.locator('#localAgentLayer')
  const local = localLayer.locator('[data-finding-id]')
  assert.equal(await local.count(), 1)
  assert.equal(await page.locator('#editor .anno-mark, #editor .anno-dot').count(), 0)

  const blockId = await local.getAttribute('data-block-id')
  assert.ok(blockId)
  const block = page.locator(`#editor .ProseMirror > [data-block-id="${blockId}"]`)
  assert.equal(await block.evaluate(node => node.classList.contains('has-local-finding')), true)
  assert.equal(await local.locator('.local-finding-connector').count(), 1)

  const summary = local.locator('.local-finding-summary')
  const editorHtmlBefore = await page.evaluate(() => window.AIWT.state.editor.getHTML())
  const blockIdsBeforeUndo = await page.locator('#editor .ProseMirror > [data-block-id]').evaluateAll(nodes => nodes.map(node => node.dataset.blockId))
  await page.evaluate(id => {
    const editor = window.AIWT.state.editor
    const targetBlock = window.AIWT.__blockIdentityTestBridge.getBlocks().find(candidate => candidate.id === id)
    editor.commands.setTextSelection(targetBlock.pos + targetBlock.nodeSize - 1)
    editor.view.focus()
    window.__task5MetaDispatches = 0
    window.__task5OriginalDispatch = editor.view.dispatch.bind(editor.view)
    editor.view.dispatch = transaction => {
      if (!transaction.docChanged) window.__task5MetaDispatches += 1
      return window.__task5OriginalDispatch(transaction)
    }
  }, blockId)
  await page.keyboard.type('Z')
  assert.notEqual(await page.evaluate(() => window.AIWT.state.editor.getHTML()), editorHtmlBefore)

  await summary.focus()
  const disclosureIds = await summary.evaluate(node => ({
    summaryId: node.id,
    controls: node.getAttribute('aria-controls')?.split(/\s+/).filter(Boolean) || [],
  }))
  assert.ok(disclosureIds.summaryId)
  assert.equal(disclosureIds.controls.length, 0)
  await page.keyboard.press('Enter')
  await expectVisible(local.locator('.local-finding-detail'))
  assert.equal(await summary.evaluate(node => document.activeElement === node), true)
  assert.equal(await summary.getAttribute('aria-expanded'), 'true')
  const detailId = await local.locator('.local-finding-detail').getAttribute('id')
  assert.deepEqual(await summary.getAttribute('aria-controls'), detailId)
  assert.equal(await local.getByText('Beobachtung', { exact: true }).count(), 1)
  assert.equal(await local.getByText('Relevanz', { exact: true }).count(), 1)
  assert.equal(await local.getByText('Folge', { exact: true }).count(), 1)
  assert.equal(await local.getByText('Vorschlag', { exact: true }).count(), 0)
  assert.equal(await local.getByText('Belege', { exact: true }).count(), 0)
  assert.equal(await local.getByText('Besprechen', { exact: true }).count(), 0)

  await summary.focus()
  await page.keyboard.press('Enter')
  const suggestion = localLayer.locator('.local-suggestion')
  await expectVisible(suggestion)
  assert.deepEqual(
    (await summary.getAttribute('aria-controls')).split(/\s+/),
    [detailId, await suggestion.getAttribute('id')],
  )
  assert.equal(await summary.evaluate(node => document.activeElement === node), true)
  await waitForLocalFeedbackLayout(page, blockId, true)
  const spacerHeightBeforeUndo = await block.evaluate(node => (
    node.nextElementSibling?.classList.contains('local-feedback-spacer')
      ? node.nextElementSibling.getBoundingClientRect().height
      : 0
  ))
  assert.ok(spacerHeightBeforeUndo > 0)
  assert.equal(await page.evaluate(() => window.AIWT.state.editor.commands.undo()), true)
  assert.equal(await page.evaluate(() => window.AIWT.state.editor.getHTML()), editorHtmlBefore)
  await expectVisible(suggestion)
  await expectVisible(local.locator('.local-finding-detail'))
  assert.deepEqual(
    await page.locator('#editor .ProseMirror > [data-block-id]').evaluateAll(nodes => nodes.map(node => node.dataset.blockId)),
    blockIdsBeforeUndo,
  )
  await waitForLocalFeedbackLayout(page, blockId, true)

  await summary.focus()
  await page.keyboard.press('Enter')
  assert.equal(await suggestion.count(), 0)
  await expectVisible(local.locator('.local-finding-detail'))
  assert.equal(await summary.evaluate(node => document.activeElement === node), true)
  await page.keyboard.press('Enter')
  await expectVisible(suggestion)
  await page.keyboard.press('Escape')
  assert.equal(await suggestion.count(), 0)
  await expectVisible(local.locator('.local-finding-detail'))
  assert.equal(await summary.getAttribute('aria-expanded'), 'true')
  assert.equal(await summary.evaluate(node => document.activeElement === node), true)
  await page.keyboard.press('Escape')
  assert.equal(await local.locator('.local-finding-detail').count(), 0)
  assert.equal(await summary.getAttribute('aria-expanded'), 'false')
  assert.equal(await summary.evaluate(node => document.activeElement === node), true)

  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await expectVisible(suggestion)
  await waitForLocalFeedbackLayout(page, blockId, true)
  assert.equal(await page.evaluate(() => window.AIWT.state.editor.getHTML()), editorHtmlBefore)
  assert.equal(await suggestion.locator('.suggestion-old-change').count(), 1)
  assert.equal(await suggestion.locator('.suggestion-new-change').count(), 1)
  assert.ok((await suggestion.locator('.suggestion-unchanged').count()) >= 1)

  for (const label of ['Verwerfen', 'Eigene Fassung schreiben', 'Übernehmen']) {
    const action = suggestion.getByRole('button', { name: label, exact: true })
    assert.equal(await action.count(), 1)
    assert.equal(await action.getAttribute('title'), label)
    assert.equal((await action.textContent()).trim().split(/\s+/).length <= 1, true)
  }

  const geometry = await page.evaluate(id => {
    const blockNode = document.querySelector(`#editor .ProseMirror > [data-block-id="${id}"]`)
    const blockRect = blockNode.getBoundingClientRect()
    const suggestionRect = document.querySelector('.local-suggestion').getBoundingClientRect()
    const spacerNode = blockNode.nextElementSibling
    const nextBlockNode = spacerNode?.classList.contains('local-feedback-spacer')
      ? spacerNode.nextElementSibling
      : spacerNode
    return {
      blockBottom: blockRect.bottom,
      suggestionTop: suggestionRect.top,
      suggestionBottom: suggestionRect.bottom,
      spacerHeight: spacerNode?.classList.contains('local-feedback-spacer')
        ? spacerNode.getBoundingClientRect().height
        : 0,
      nextBlockTop: nextBlockNode?.getBoundingClientRect().top || Number.POSITIVE_INFINITY,
    }
  }, blockId)
  assert.ok(geometry.suggestionTop >= geometry.blockBottom)
  assert.ok(geometry.spacerHeight > 0)
  assert.ok(geometry.suggestionBottom <= geometry.nextBlockTop)
  await page.waitForTimeout(350)
  const stableDispatchCount = await page.evaluate(() => window.__task5MetaDispatches)
  await page.waitForTimeout(350)
  assert.equal(await page.evaluate(() => window.__task5MetaDispatches), stableDispatchCount)
  await page.screenshot({ path: `${screenshotDir}/aiwt-v2-task5-desktop.png`, fullPage: true })

  const acceptedFindingId = await local.getAttribute('data-finding-id')
  const expectedNextFindingId = await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.findings
      .filter(finding => finding.id !== id && finding.status === 'open' && finding.placement === 'passage' && finding.target)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || String(a.id).localeCompare(String(b.id), 'de'))[0]?.id || null
  }, acceptedFindingId)
  const target = await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.findings.find(finding => finding.id === id).target
  }, acceptedFindingId)
  const action = await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.findings.find(finding => finding.id === id).action
  }, acceptedFindingId)
  assert.equal((await block.textContent()).includes(target), true)

  await suggestion.getByRole('button', { name: 'Übernehmen', exact: true }).click()
  assert.equal((await block.textContent()).includes(target), false)
  assert.equal((await block.textContent()).includes(action), true)
  const acceptedState = await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    const finding = doc.findings.find(candidate => candidate.id === id)
    const decision = doc.decisions.find(candidate => candidate.findingId === id)
    return { status: finding.status, kind: decision?.kind, appliedText: decision?.appliedText }
  }, acceptedFindingId)
  assert.deepEqual(acceptedState, { status: 'resolved', kind: 'accept', appliedText: action })
  assert.equal(await localLayer.locator('[data-finding-id]').getAttribute('data-finding-id'), expectedNextFindingId)
  await page.waitForFunction(id => {
    const summary = document.querySelector(`#localAgentLayer [data-finding-id="${id}"] .local-finding-summary`)
    return summary && document.activeElement === summary
  }, expectedNextFindingId)

  await page.evaluate(() => window.AIWT.flushSave())
  await page.reload({ waitUntil: 'networkidle' })
  await openExample(page, false)
  const persistedAcceptance = await page.evaluate(id => {
    const stored = JSON.parse(localStorage.getItem('aiwt.v2'))
    const doc = stored.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return {
      body: doc.body,
      findingStatus: doc.findings.find(candidate => candidate.id === id)?.status,
      decisionKind: doc.decisions.find(candidate => candidate.findingId === id)?.kind,
    }
  }, acceptedFindingId)
  assert.equal(persistedAcceptance.body.includes(action), true)
  assert.equal(persistedAcceptance.body.includes(target), false)
  assert.deepEqual(
    { findingStatus: persistedAcceptance.findingStatus, decisionKind: persistedAcceptance.decisionKind },
    { findingStatus: 'resolved', decisionKind: 'accept' },
  )
  assert.notEqual(await localLayer.locator('[data-finding-id]').getAttribute('data-finding-id'), acceptedFindingId)

  await page.close()
}

async function runTask5OwnershipAndAmbiguity(browser) {
  const page = await browser.newPage({ viewport: { width: 1120, height: 860 } })
  await openExample(page)

  let local = page.locator('#localAgentLayer [data-finding-id]')
  let findingId = await local.getAttribute('data-finding-id')
  await local.locator('.local-finding-summary').click()
  await local.locator('.local-finding-summary').click()
  await page.getByRole('button', { name: 'Eigene Fassung schreiben', exact: true }).click()
  assert.equal(await page.locator('.local-suggestion').count(), 0)
  await page.waitForFunction(() => {
    const editor = window.AIWT.state.editor
    return editor.state.selection.from !== editor.state.selection.to
  })
  const ownVersionState = await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return {
      decision: doc.decisions.find(candidate => candidate.findingId === id) || null,
      editingFinding: doc.workspace.editingFinding,
      selectedText: window.AIWT.state.editor.state.doc.textBetween(
        window.AIWT.state.editor.state.selection.from,
        window.AIWT.state.editor.state.selection.to,
      ),
      target: doc.findings.find(candidate => candidate.id === id).target,
    }
  }, findingId)
  assert.equal(ownVersionState.decision, null)
  assert.equal(ownVersionState.selectedText, ownVersionState.target)
  assert.equal(ownVersionState.editingFinding.findingId, findingId)
  assert.equal(ownVersionState.editingFinding.blockId, await local.getAttribute('data-block-id'))
  assert.ok(ownVersionState.editingFinding.beforeText.includes(ownVersionState.target))
  await expectVisible(page.getByText('Eigene Fassung in Arbeit', { exact: true }))
  assert.equal(await page.getByRole('button', { name: 'Eigene Fassung abschliessen', exact: true }).isDisabled(), true)
  await page.getByRole('button', { name: 'Eigene Fassung abbrechen', exact: true }).click()
  assert.equal(await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.workspace.editingFinding
  }), null)
  assert.equal(await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.decisions.some(candidate => candidate.findingId === id)
  }, findingId), false)

  local = page.locator(`#localAgentLayer [data-finding-id="${findingId}"]`)
  await local.locator('.local-finding-summary').click()
  await page.getByRole('button', { name: 'Eigene Fassung schreiben', exact: true }).click()
  await page.waitForTimeout(1200)
  assert.equal(await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.decisions.some(candidate => candidate.findingId === id)
  }, findingId), false)

  const expectedAfterOwnVersion = await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.findings
      .filter(finding => finding.id !== id && finding.status === 'open' && finding.placement === 'passage' && finding.target)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || String(a.id).localeCompare(String(b.id), 'de'))[0]?.id || null
  }, findingId)
  await page.evaluate(() => window.AIWT.flushSave())
  await page.reload({ waitUntil: 'networkidle' })
  await openExample(page, false)
  const reloadedEditing = await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.workspace.editingFinding
  })
  assert.equal(reloadedEditing.findingId, findingId)
  assert.equal(reloadedEditing.blockId, ownVersionState.editingFinding.blockId)

  await page.evaluate(() => {
    const editor = window.AIWT.state.editor
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    const editing = doc.workspace.editingFinding
    const block = window.AIWT.__blockIdentityTestBridge.getBlocks().find(candidate => candidate.id === editing.blockId)
    const from = block.pos + 1 + editing.prefix.length
    const oldLength = editing.beforeText.length - editing.prefix.length - editing.suffix.length
    editor.commands.setTextSelection({ from, to: from + oldLength })
    editor.view.focus()
  })
  await page.keyboard.type('meine eigene')
  await page.waitForTimeout(1200)
  assert.equal(await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.decisions.some(candidate => candidate.findingId === id)
  }, findingId), false)
  assert.equal(await page.getByText('Eigene Fassung in Arbeit', { exact: true }).count(), 1)
  await page.keyboard.type(' klare Fassung')
  const ownAppliedText = 'meine eigene klare Fassung'
  await page.waitForTimeout(1200)
  const savedBeforeFastReload = await page.evaluate(({ id, appliedText }) => {
    const stored = JSON.parse(localStorage.getItem('aiwt.v2'))
    const doc = stored.docs.find(candidate => candidate.id === stored.active)
    return {
      bodyContainsOwnText: doc.body.includes(appliedText),
      editingFinding: doc.workspace.editingFinding,
      decision: doc.decisions.find(candidate => candidate.findingId === id) || null,
    }
  }, { id: findingId, appliedText: ownAppliedText })
  assert.equal(savedBeforeFastReload.bodyContainsOwnText, true)
  assert.equal(savedBeforeFastReload.editingFinding.findingId, findingId)
  assert.equal(savedBeforeFastReload.decision, null)

  await page.reload({ waitUntil: 'networkidle' })
  await openExample(page, false)
  assert.equal(await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.workspace.editingFinding?.findingId === id
      && !doc.decisions.some(candidate => candidate.findingId === id)
  }, findingId), true)
  await expectVisible(page.getByText('Eigene Fassung in Arbeit', { exact: true }))
  assert.equal(await page.getByRole('button', { name: 'Eigene Fassung abschliessen', exact: true }).isEnabled(), true)
  await page.getByRole('button', { name: 'Eigene Fassung abschliessen', exact: true }).click()
  const decidedOwnVersion = await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    const decision = doc.decisions.find(candidate => candidate.findingId === id)
    return {
      status: doc.findings.find(candidate => candidate.id === id)?.status,
      kind: decision?.kind,
      appliedText: decision?.appliedText,
      editingFinding: doc.workspace.editingFinding,
    }
  }, findingId)
  assert.deepEqual(decidedOwnVersion, {
    status: 'resolved',
    kind: 'accept',
    appliedText: ownAppliedText,
    editingFinding: null,
  })
  assert.equal(await page.locator('#localAgentLayer [data-finding-id]').getAttribute('data-finding-id'), expectedAfterOwnVersion)
  await page.evaluate(() => window.AIWT.flushSave())
  const persistedOwnVersion = await page.evaluate(id => {
    const stored = JSON.parse(localStorage.getItem('aiwt.v2'))
    const doc = stored.docs.find(candidate => candidate.id === stored.active)
    return {
      appliedText: doc.decisions.find(candidate => candidate.findingId === id)?.appliedText,
      findingStatus: doc.findings.find(candidate => candidate.id === id)?.status,
      editingFinding: doc.workspace.editingFinding,
      bodyContainsOwnText: doc.body.includes('meine eigene klare Fassung'),
    }
  }, findingId)
  assert.deepEqual(persistedOwnVersion, {
    appliedText: ownAppliedText,
    findingStatus: 'resolved',
    editingFinding: null,
    bodyContainsOwnText: true,
  })

  local = page.locator('#localAgentLayer [data-finding-id]')
  await local.locator('.local-finding-summary').click()
  await local.locator('.local-finding-summary').click()
  findingId = await local.getAttribute('data-finding-id')
  const expectedAfterReject = await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.findings
      .filter(finding => finding.id !== id && finding.status === 'open' && finding.placement === 'passage' && finding.target)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || String(a.id).localeCompare(String(b.id), 'de'))[0]?.id || null
  }, findingId)
  await page.getByRole('button', { name: 'Verwerfen', exact: true }).click()
  const rejectedState = await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return {
      findingStatus: doc.findings.find(candidate => candidate.id === id)?.status,
      decisionKind: doc.decisions.find(candidate => candidate.findingId === id)?.kind,
    }
  }, findingId)
  assert.deepEqual(rejectedState, { findingStatus: 'dismissed', decisionKind: 'reject' })
  assert.equal(await page.locator('#localAgentLayer [data-finding-id]').getAttribute('data-finding-id'), expectedAfterReject)
  await page.evaluate(() => window.AIWT.flushSave())
  await page.reload({ waitUntil: 'networkidle' })
  await openExample(page, false)
  const persistedReject = await page.evaluate(id => {
    const stored = JSON.parse(localStorage.getItem('aiwt.v2'))
    const doc = stored.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return {
      findingStatus: doc.findings.find(candidate => candidate.id === id)?.status,
      decisionKind: doc.decisions.find(candidate => candidate.findingId === id)?.kind,
    }
  }, findingId)
  assert.deepEqual(persistedReject, rejectedState)

  await page.evaluate(() => {
    const bridge = window.AIWT.__blockIdentityTestBridge
    bridge.setContent({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Gleiche Phrase im ersten Block.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Gleiche Phrase im zweiten Block.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Eindeutiges Ziel im dritten Block.' }] },
      ],
    })
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.findings = [
      {
        id: 'task-5-ambiguous', placement: 'passage', status: 'open', category: 'wording',
        priority: 'critical', createdAt: 0, target: 'Gleiche Phrase',
        short: 'Dieses Ziel ist blockübergreifend mehrdeutig.', why: 'Hier darf nichts geraten werden.', action: 'Einmalig',
      },
      {
        id: 'task-5-stale', placement: 'passage', status: 'open', category: 'wording',
        priority: 'critical', createdAt: 1, blockId: 'geloeschter-block', target: 'Eindeutiges Ziel',
        short: 'Dieser Anker ist gelöscht.', why: 'Ein stale Anker darf nicht umgehängt werden.', action: 'Falsch umgehängt',
      },
      {
        id: 'task-5-visible', placement: 'passage', status: 'open', category: 'wording',
        priority: 'critical', createdAt: 2, target: 'Eindeutiges Ziel',
        short: 'Dieser spätere Hinweis bleibt sichtbar.', why: 'Nicht auflösbare Hinweise blockieren die Queue nicht.', action: 'Klares Ziel',
      },
    ]
    doc.coach = []
    doc.lane = []
    doc.decisions = []
    doc.workspace.editingFinding = null
    doc.workspace.expandedFindingId = null
    doc.workspace.suggestionFindingId = null
    document.getElementById('title').dispatchEvent(new Event('input'))
  })
  local = page.locator('#localAgentLayer [data-finding-id="task-5-visible"]')
  await expectVisible(local)
  const anchorState = await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return {
      ambiguousBlockId: doc.findings.find(finding => finding.id === 'task-5-ambiguous').blockId || null,
      staleBlockId: doc.findings.find(finding => finding.id === 'task-5-stale').blockId,
      visibleBlockId: doc.findings.find(finding => finding.id === 'task-5-visible').blockId,
    }
  })
  assert.equal(anchorState.ambiguousBlockId, null)
  assert.equal(anchorState.staleBlockId, 'geloeschter-block')
  assert.ok(anchorState.visibleBlockId)
  await local.locator('.local-finding-summary').click()
  await local.locator('.local-finding-summary').click()
  const beforeUnauthorizedOwn = await page.evaluate(() => window.AIWT.state.editor.getHTML())
  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.findings.find(finding => finding.id === 'task-5-visible').blockId = 'geloeschter-block'
  })
  await page.getByRole('button', { name: 'Eigene Fassung schreiben', exact: true }).click()
  assert.equal(await page.evaluate(() => window.AIWT.state.editor.getHTML()), beforeUnauthorizedOwn)
  assert.equal(await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.workspace.editingFinding
  }), null)
  await expectVisible(page.locator('.local-finding-error'))
  assert.match(await page.locator('.local-finding-error').textContent(), /nicht eindeutig|nicht sicher/i)

  await page.evaluate(blockId => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.findings.find(finding => finding.id === 'task-5-visible').blockId = blockId
    document.getElementById('title').dispatchEvent(new Event('input'))
  }, anchorState.visibleBlockId)
  local = page.locator('#localAgentLayer [data-finding-id="task-5-visible"]')
  await local.locator('.local-finding-summary').click()
  await local.locator('.local-finding-summary').click()
  const beforeUnauthorizedAccept = await page.evaluate(() => window.AIWT.state.editor.getHTML())
  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.findings.find(finding => finding.id === 'task-5-visible').blockId = 'geloeschter-block'
  })
  await page.getByRole('button', { name: 'Übernehmen', exact: true }).click()
  assert.equal(await page.evaluate(() => window.AIWT.state.editor.getHTML()), beforeUnauthorizedAccept)
  const ambiguousState = await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return {
      statuses: doc.findings.map(finding => [finding.id, finding.status]),
      decisions: doc.decisions.length,
      texts: window.AIWT.__blockIdentityTestBridge.getBlocks().map(block => block.text),
    }
  })
  assert.deepEqual(ambiguousState.statuses, [
    ['task-5-ambiguous', 'open'],
    ['task-5-stale', 'open'],
    ['task-5-visible', 'open'],
  ])
  assert.equal(ambiguousState.decisions, 0)
  assert.deepEqual(ambiguousState.texts, [
    'Gleiche Phrase im ersten Block.',
    'Gleiche Phrase im zweiten Block.',
    'Eindeutiges Ziel im dritten Block.',
  ])

  await page.close()
}

async function runFinalFindingRegressions(browser) {
  const page = await browser.newPage({ viewport: { width: 1120, height: 860 } })
  await openExample(page)

  const setup = await page.evaluate(() => {
    const bridge = window.AIWT.__blockIdentityTestBridge
    bridge.setContent({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Diese bekannte Passage wurde vollständig neu formuliert.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Eine doppelte Phrase steht hier.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Auch hier steht eine doppelte Phrase.' }] },
      ],
    })
    const knownBlockId = bridge.getBlocks()[0].id
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.findings = [
      {
        id: 'final-stale-known', placement: 'passage', status: 'open', category: 'wording', priority: 'critical', createdAt: 0,
        blockId: knownBlockId, target: 'Alter Wortlaut', short: 'Alter Hinweistext', why: 'Die Passage hat sich verändert.', action: 'Nicht anwenden',
      },
      {
        id: 'final-ambiguous', placement: 'passage', status: 'open', category: 'wording', priority: 'high', createdAt: 1,
        target: 'doppelte Phrase', short: 'Mehrdeutiger Hinweis', why: 'Keine sichere Textstelle.', action: 'Nicht anwenden',
      },
      {
        id: 'final-unplaced', placement: 'passage', status: 'open', category: 'source', priority: 'high', createdAt: 2,
        blockId: 'b-missing-final', target: 'Nicht vorhandener Wortlaut', short: 'Nicht platzierbarer Hinweis', why: 'Der Block fehlt.', action: 'Nicht anwenden',
      },
    ]
    doc.coach = []
    doc.lane = []
    doc.decisions = []
    Object.assign(doc.workspace, {
      expandedFindingId: null,
      suggestionFindingId: null,
      localThreadFindingId: null,
      evidenceFindingId: null,
      editingFinding: null,
      riskConfirmationFindingId: null,
      riskReason: '',
    })
    document.getElementById('title').dispatchEvent(new Event('input', { bubbles: true }))
    return { knownBlockId }
  })

  let local = page.locator('#localAgentLayer [data-finding-id="final-stale-known"]')
  await expectVisible(local)
  assert.equal(await local.getAttribute('data-block-id'), setup.knownBlockId)
  assert.equal(await local.getByText('Textstelle verändert', { exact: true }).count(), 1)
  await local.locator('.local-finding-summary').click()
  await local.locator('.local-finding-summary').click()
  assert.equal(await page.locator('.local-suggestion').count(), 0)
  assert.equal(await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.findings.find(finding => finding.id === 'final-stale-known').status
  }), 'open')

  await page.locator('#ondaAura').click()
  const agent = page.locator('#agentWidget')
  await expectVisible(agent)
  assert.equal(await agent.getByText('Hinweise ohne sichere Textstelle', { exact: true }).count(), 1)
  assert.equal(await agent.getByText('Mehrdeutiger Hinweis', { exact: true }).count(), 1)
  assert.equal(await agent.getByText('Nicht platzierbarer Hinweis', { exact: true }).count(), 1)
  await agent.locator('[data-close-agent]').click()

  await page.evaluate(() => {
    const bridge = window.AIWT.__blockIdentityTestBridge
    bridge.setContent({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Diese wissenschaftliche Aussage braucht einen Beleg.' }] }],
    })
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.findings = [{
      id: 'final-integrity-risk', placement: 'passage', status: 'open', category: 'source', priority: 'critical', createdAt: 0,
      blockId: bridge.getBlocks()[0].id, target: 'wissenschaftliche Aussage', short: 'Für diese Aussage fehlt ein belastbarer Beleg.',
      why: 'Ohne Beleg bleibt die Aussage wissenschaftlich nicht abgesichert.',
      consequence: 'Die Hausarbeit kann an dieser Stelle eine unbelegte Behauptung enthalten.',
      action: 'wissenschaftlich belegte Aussage',
    }]
    doc.decisions = []
    Object.assign(doc.workspace, {
      expandedFindingId: null,
      suggestionFindingId: null,
      localThreadFindingId: null,
      evidenceFindingId: null,
      editingFinding: null,
      riskConfirmationFindingId: null,
      riskReason: '',
      agent: { ...doc.workspace.agent, open: false },
    })
    document.getElementById('title').dispatchEvent(new Event('input', { bubbles: true }))
  })
  local = page.locator('#localAgentLayer [data-finding-id="final-integrity-risk"]')
  await local.locator('.local-finding-summary').click()
  await local.locator('.local-finding-summary').click()
  await page.getByRole('button', { name: 'Verwerfen', exact: true }).click()
  const afterFirstReject = await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return {
      status: doc.findings[0].status,
      decisions: doc.decisions.length,
      confirmation: doc.workspace.riskConfirmationFindingId,
    }
  })
  assert.deepEqual(afterFirstReject, { status: 'open', decisions: 0, confirmation: 'final-integrity-risk' })
  const confirmation = page.locator('.integrity-risk-confirmation')
  await expectVisible(confirmation)
  assert.equal(await confirmation.locator('.integrity-risk-title').getByText('Wissenschaftliches Risiko bewusst annehmen', { exact: true }).count(), 1)
  assert.match(await confirmation.textContent(), /unbelegte Behauptung/i)
  await confirmation.locator('textarea').fill('Quelle ist für diese Fassung bewusst noch offen.')
  await confirmation.getByRole('button', { name: 'Wissenschaftliches Risiko bewusst annehmen', exact: true }).click()
  await page.waitForFunction(() => window.AIWT.state.editor.view.dom.contains(document.activeElement))
  const confirmed = await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return {
      status: doc.findings[0].status,
      outcome: doc.decisions[0]?.outcome,
      reason: doc.decisions[0]?.reason,
      editing: doc.workspace.riskConfirmationFindingId,
      editorFocused: window.AIWT.state.editor.view.dom.contains(document.activeElement),
    }
  })
  assert.deepEqual(confirmed, {
    status: 'risk-accepted',
    outcome: 'risk-accepted',
    reason: 'Quelle ist für diese Fassung bewusst noch offen.',
    editing: null,
    editorFocused: true,
  })

  await page.close()
}

async function runTask5MobileFeedback(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })
  const page = await context.newPage()
  await openExample(page)
  await page.locator('#sidebarCollapse').click()

  const local = page.locator('#localAgentLayer [data-finding-id]')
  await expectVisible(local)
  const blockId = await local.getAttribute('data-block-id')
  await waitForLocalFeedbackLayout(page, blockId)
  const layout = await page.evaluate(id => {
    const note = document.querySelector('#localAgentLayer [data-finding-id]').getBoundingClientRect()
    const block = document.querySelector(`#editor .ProseMirror > [data-block-id="${id}"]`).getBoundingClientRect()
    return {
      noteLeft: note.left,
      noteRight: note.right,
      noteTop: note.top,
      blockBottom: block.bottom,
      viewportWidth: document.documentElement.clientWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  }, blockId)
  assert.ok(layout.noteLeft >= 0)
  assert.ok(layout.noteRight <= layout.viewportWidth)
  assert.ok(layout.noteTop >= layout.blockBottom)
  assert.ok(layout.overflow <= 1)

  await local.locator('.local-finding-summary').click()
  await local.locator('.local-finding-summary').click()
  await waitForLocalFeedbackLayout(page, blockId, true)
  const overlap = await page.evaluate(() => {
    const suggestion = document.querySelector('.local-suggestion').getBoundingClientRect()
    const note = document.querySelector('#localAgentLayer [data-finding-id]').getBoundingClientRect()
    const block = document.querySelector('.has-local-finding')
    const spacer = block.nextElementSibling
    const nextBlock = spacer?.classList.contains('local-feedback-spacer')
      ? spacer.nextElementSibling
      : spacer
    const nextBlockTop = nextBlock?.getBoundingClientRect().top || Number.POSITIVE_INFINITY
    return {
      agentOverlap: Math.min(suggestion.bottom, note.bottom) - Math.max(suggestion.top, note.top),
      agentBottom: Math.max(suggestion.bottom, note.bottom),
      spacerHeight: spacer?.classList.contains('local-feedback-spacer')
        ? spacer.getBoundingClientRect().height
        : 0,
      nextBlockTop,
    }
  })
  assert.ok(overlap.agentOverlap <= 0)
  assert.ok(overlap.spacerHeight > 0)
  assert.ok(overlap.agentBottom <= overlap.nextBlockTop)
  const trigger = page.locator('#blockInsertTrigger')
  const activeBlock = page.locator(`#editor .ProseMirror > [data-block-id="${blockId}"]`)
  await activeBlock.tap()
  await page.waitForFunction(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.workspace.activeBlockId === id
  }, blockId)
  await page.waitForTimeout(220)
  const touchTriggerStyle = await trigger.evaluate(node => ({
    opacity: Number.parseFloat(getComputedStyle(node).opacity),
    pointerEvents: getComputedStyle(node).pointerEvents,
  }))
  assert.ok(touchTriggerStyle.opacity > 0)
  assert.equal(touchTriggerStyle.pointerEvents, 'auto')
  await trigger.tap()
  await expectVisible(page.locator('.semantic-insert-menu'))
  assert.equal(await page.locator('.local-suggestion').count(), 0)
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('.semantic-insert-menu').count(), 0)
  await local.locator('.local-finding-summary').tap()
  await local.locator('.local-finding-summary').tap()
  await waitForLocalFeedbackLayout(page, blockId, true)
  await page.waitForFunction(id => {
    const triggerRect = document.getElementById('blockInsertTrigger').getBoundingClientRect()
    const blockRect = document.querySelector(`#editor .ProseMirror > [data-block-id="${id}"]`).getBoundingClientRect()
    const noteRect = document.querySelector(`#localAgentLayer .local-finding[data-block-id="${id}"]`).getBoundingClientRect()
    const suggestionRect = document.querySelector(`#localAgentLayer .local-suggestion[data-block-id="${id}"]`).getBoundingClientRect()
    return triggerRect.top >= Math.max(blockRect.bottom, noteRect.bottom, suggestionRect.bottom)
  }, blockId)

  const insertGeometry = await page.evaluate(id => {
    const triggerRect = document.getElementById('blockInsertTrigger').getBoundingClientRect()
    const block = document.querySelector(`#editor .ProseMirror > [data-block-id="${id}"]`)
    const blockRect = block.getBoundingClientRect()
    const noteRect = document.querySelector(`#localAgentLayer .local-finding[data-block-id="${id}"]`).getBoundingClientRect()
    const suggestionRect = document.querySelector(`#localAgentLayer .local-suggestion[data-block-id="${id}"]`).getBoundingClientRect()
    const spacer = block.nextElementSibling
    const nextBlock = spacer?.classList.contains('local-feedback-spacer') ? spacer.nextElementSibling : spacer
    const overlaps = rect => (
      Math.min(triggerRect.right, rect.right) - Math.max(triggerRect.left, rect.left) > 0
      && Math.min(triggerRect.bottom, rect.bottom) - Math.max(triggerRect.top, rect.top) > 0
    )
    return {
      triggerTop: triggerRect.top,
      triggerBottom: triggerRect.bottom,
      contentBottom: Math.max(blockRect.bottom, noteRect.bottom, suggestionRect.bottom),
      nextBlockTop: nextBlock?.getBoundingClientRect().top || Number.POSITIVE_INFINITY,
      blockBottom: blockRect.bottom,
      spacerTop: spacer?.getBoundingClientRect().top || null,
      spacerBottom: spacer?.getBoundingClientRect().bottom || null,
      spacerHeight: spacer?.getBoundingClientRect().height || null,
      spacerStyleHeight: spacer ? getComputedStyle(spacer).height : null,
      nextMarginTop: nextBlock ? getComputedStyle(nextBlock).marginTop : null,
      overlapsBlock: overlaps(blockRect),
      overlapsNote: overlaps(noteRect),
      overlapsSuggestion: overlaps(suggestionRect),
    }
  }, blockId)
  assert.ok(insertGeometry.triggerTop >= insertGeometry.contentBottom)
  assert.ok(
    insertGeometry.triggerBottom <= insertGeometry.nextBlockTop,
    `Mobiler Einfügetrigger ragt in den Folgeblock: ${JSON.stringify(insertGeometry)}`,
  )
  assert.deepEqual(
    [insertGeometry.overlapsBlock, insertGeometry.overlapsNote, insertGeometry.overlapsSuggestion],
    [false, false, false],
  )
  await page.screenshot({ path: `${screenshotDir}/aiwt-v2-task5-mobile.png`, fullPage: true })

  await page.locator('#scroll').evaluate(node => {
    node.scrollTop += 80
    node.dispatchEvent(new Event('scroll'))
  })
  await page.evaluate(() => window.dispatchEvent(new Event('resize')))
  await waitForLocalFeedbackLayout(page, blockId, true)
  const afterReposition = await local.boundingBox()
  assert.ok(afterReposition)
  assert.ok(afterReposition.x >= 0)
  assert.ok(afterReposition.x + afterReposition.width <= 390)

  await context.close()
}

async function injectTask6PassageFinding(page, withSources = false) {
  return page.evaluate(({ withSources: includeSources }) => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    const block = window.AIWT.__blockIdentityTestBridge.getBlocks()
      .find(candidate => candidate.text.includes('Calm Technology beschreibt Technik'))
    const existing = doc.findings.find(finding => finding.id === 'task-6-local-dialogue')
    const finding = existing || {
      id: 'task-6-local-dialogue',
      placement: 'passage',
      category: 'content',
      priority: 'critical',
      status: 'open',
      createdAt: -100,
      blockId: block.id,
      target: 'Calm Technology beschreibt Technik',
      claim: 'Calm Technology kann Aufmerksamkeit schonen, indem Technik zwischen Zentrum und Peripherie wechselt.',
      short: 'Ist Aufmerksamkeit hier Fähigkeit oder gestaltete Bedingung?',
      why: 'Die Entscheidung verändert, wem der Text Verantwortung zuschreibt.',
      consequence: 'Als gestaltete Bedingung rückt die Verantwortung stärker zum Werkzeug.',
      sources: [],
    }
    if (!existing) doc.findings.unshift(finding)
    finding.action = null
    finding.sources = includeSources
      ? [
        {
          label: 'Weiser & Brown (1996): The Coming Age of Calm Technology',
          type: 'Primärquelle',
          url: 'https://calmtech.com/papers',
          contentType: 'original-excerpt',
          content: 'The most potentially interesting, challenging, and profound change implied by the ubiquitous computing era is a focus on calm.',
          citation: 'Weiser, M., & Brown, J. S. (1996). The Coming Age of Calm Technology.',
          verificationStatus: 'demo',
          locator: 'Demo-Fundstelle, Absatz 1',
          context: 'Der Satz formuliert den historischen Ausgangspunkt des Calm-Technology-Ansatzes.',
          limits: 'Der Aufsatz belegt das Gestaltungsprinzip, nicht automatisch seine Wirkung in jeder Schreibsoftware.',
        },
        {
          label: 'Redaktionelle Einordnung',
          type: 'Arbeitsnotiz',
          url: 'https://calmtech.com/papers',
          contentType: 'summary',
          content: 'Der Aufsatz verbindet ruhige Technik mit einem Wechsel zwischen zentraler und peripherer Aufmerksamkeit.',
          citation: 'Eigene Zusammenfassung nach Weiser & Brown (1996).',
          verificationStatus: 'unverified',
          locator: 'Arbeitsnotiz ohne live geprüfte Fundstelle',
        },
      ]
      : []
    doc.workspace.expandedFindingId = null
    doc.workspace.suggestionFindingId = null
    doc.workspace.localThreadFindingId = null
    doc.workspace.evidenceFindingId = null
    doc.workspace.agent.open = false
    document.getElementById('title').dispatchEvent(new Event('input'))
    return { findingId: finding.id, blockId: block.id, target: finding.target }
  }, { withSources })
}

async function runTask6DialogueAndEvidence(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', error => errors.push(error.message))
  await openExample(page)
  await installiereTransportMock(page)

  assert.equal(await page.evaluate(() => window.AIWT.state.settings.exampleVersion), 9)
  assert.equal(await page.locator('#agentWidget').isHidden(), true)
  assert.equal(await page.locator('[data-agent-launcher]').count(), 0)
  assert.equal(await page.locator('#ondaAura').count(), 1)

  await page.evaluate(() => {
    const blocks = window.AIWT.__blockIdentityTestBridge.getBlocks()
    const block = blocks[blocks.length - 1]
    window.AIWT.state.editor.commands.setTextSelection(block.pos + block.nodeSize - 1)
    window.AIWT.state.editor.view.focus()
  })
  const focusBefore = await page.evaluate(() => document.activeElement === window.AIWT.state.editor.view.dom)
  assert.equal(focusBefore, true)
  await page.waitForTimeout(1600)
  await page.keyboard.type('x')
  const selectionBefore = await page.evaluate(() => window.AIWT.state.editor.state.selection.from)
  await page.waitForTimeout(1700)
  assert.equal(await page.locator('#agentWidget').isHidden(), true)
  await page.waitForTimeout(1600)
  const widget = page.locator('#agentWidget')
  await expectVisible(widget)
  const selectionAfter = await page.evaluate(() => window.AIWT.state.editor.state.selection.from)
  assert.equal(selectionAfter, selectionBefore)
  assert.equal(await page.evaluate(() => document.activeElement === window.AIWT.state.editor.view.dom), true)
  assert.match(await widget.textContent(), /allgemeinere Frage/i)

  const widgetGeometry = await widget.evaluate(node => {
    const rect = node.getBoundingClientRect()
    return {
      width: rect.width,
      height: rect.height,
      rightInset: innerWidth - rect.right,
      viewportHeight: innerHeight,
      radius: getComputedStyle(node).borderRadius,
      radiusToken: getComputedStyle(document.documentElement).getPropertyValue('--radius-panel').trim(),
    }
  })
  assert.ok(widgetGeometry.width >= 360 && widgetGeometry.width <= 400)
  assert.ok(widgetGeometry.height < widgetGeometry.viewportHeight - 100)
  assert.ok(widgetGeometry.rightInset >= 16)
  assert.equal(widgetGeometry.radius, widgetGeometry.radiusToken)

  const globalForm = widget.locator('form')
  const globalInput = globalForm.locator('input')
  await globalInput.focus()
  await globalInput.fill('Die gestaltete Bedingung.')
  await globalInput.press('Enter')
  assert.match(await widget.textContent(), /Die gestaltete Bedingung\./)
  try {
    await widget.getByText(/EVAL-Agentenreaktion/).waitFor({ timeout: 5000 })
  } catch {
    const diagnose = await page.evaluate(() => {
      const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
      const message = doc?.workspace?.agent?.messages
        ?.find(candidate => candidate.id === doc.workspace.agent.activeMessageId)
      return {
        activeProject: window.AIWT.state.activeProject,
        mockAufrufe: window.__llmMock?.aufrufe?.length ?? null,
        mockStreams: window.__llmMock?.aufrufe?.map(anfrage => anfrage?.body?.stream === true) ?? [],
        thread: message?.thread ?? null,
        liveStatus: document.getElementById('agentLiveStatus')?.textContent || '',
        widgetText: document.getElementById('agentWidget')?.textContent || '',
      }
    })
    assert.fail(`EVAL-Agentenreaktion fehlt: ${JSON.stringify(diagnose)}`)
  }
  assert.ok((await widget.locator('.agent-message').count()) >= 3)
  assert.equal(await widget.locator('input').evaluate(node => document.activeElement === node), true)
  assert.equal(await widget.locator('input').inputValue(), '')
  assert.equal(await widget.locator('.agent-widget-messages').getAttribute('aria-live'), null)
  await page.waitForFunction(() => /EVAL-Agentenreaktion/.test(document.getElementById('agentLiveStatus')?.textContent || ''))
  assert.match(await page.locator('#agentLiveStatus').textContent(), /EVAL-Agentenreaktion/)
  await page.keyboard.press('Escape')
  assert.equal(await widget.isHidden(), true)
  assert.equal(await page.locator('#ondaAura').evaluate(node => document.activeElement === node), true)
  await page.evaluate(() => window.AIWT.flushSave())
  await page.reload({ waitUntil: 'networkidle' })
  await openExample(page, false)
  await installiereTransportMock(page)
  await page.waitForTimeout(3300)
  assert.equal(await page.locator('#agentWidget').isHidden(), true)
  const persistedGlobal = await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    const message = doc.workspace.agent.messages.find(candidate => candidate.id === 'example-agent-initiative')
    return {
      dismissed: doc.workspace.agent.dismissedIds.includes(message.id),
      texts: message.thread.map(entry => entry.text),
    }
  })
  assert.equal(persistedGlobal.dismissed, true)
  assert.ok(persistedGlobal.texts.includes('Die gestaltete Bedingung.'))

  await page.locator('#ondaAura').click()
  await expectVisible(page.locator('#agentWidget'))
  await page.locator('#agentWidget [data-close-agent]').focus()
  await page.keyboard.press('Enter')
  assert.equal(await page.locator('#ondaAura').evaluate(node => document.activeElement === node), true)

  const fixture = await injectTask6PassageFinding(page, false)
  let local = page.locator(`#localAgentLayer [data-finding-id="${fixture.findingId}"]`)
  await expectVisible(local)
  await local.locator('.local-finding-summary').focus()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  const localDialogue = local.locator('.local-dialogue')
  await expectVisible(localDialogue)
  assert.equal(await local.locator('.local-finding-connector').count(), 1)
  assert.equal(await page.locator('#agentWidget').isHidden(), true)
  assert.equal(await page.locator('#structureNav .block-preview').count() > 0, true)
  assert.equal(await page.locator('.semantic-insert-menu').count(), 0)
  assert.equal(await localDialogue.locator('form input').count(), 1)
  await localDialogue.locator('input').focus()
  await localDialogue.locator('input').fill('Als gestaltete Bedingung.')
  await localDialogue.locator('input').press('Enter')
  await localDialogue.getByText(/EVAL-Agentenreaktion/i).waitFor()
  assert.match(await localDialogue.textContent(), /EVAL-Agentenreaktion/i)
  assert.match(await localDialogue.textContent(), /Als gestaltete Bedingung\./)
  assert.equal(await localDialogue.locator('input').evaluate(node => document.activeElement === node), true)
  assert.equal(await localDialogue.locator('input').inputValue(), '')
  assert.equal(await page.locator('#localAgentLayer').getAttribute('aria-live'), null)
  await page.keyboard.press('Escape')
  assert.equal(await localDialogue.count(), 0)
  assert.equal(await local.locator('.local-finding-summary').evaluate(node => document.activeElement === node), true)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(260)
  await page.screenshot({ path: `${screenshotDir}/aiwt-v2-task6-local-dialogue.png`, fullPage: true })

  await page.evaluate(() => window.AIWT.flushSave())
  await page.reload({ waitUntil: 'networkidle' })
  await openExample(page, false)
  await installiereTransportMock(page)
  local = page.locator(`#localAgentLayer [data-finding-id="${fixture.findingId}"]`)
  await expectVisible(local.locator('.local-dialogue'))
  const persistedLocal = await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.findings.find(finding => finding.id === id).thread.map(message => message.text)
  }, fixture.findingId)
  assert.ok(persistedLocal.includes('Als gestaltete Bedingung.'))

  await injectTask6PassageFinding(page, true)
  local = page.locator(`#localAgentLayer [data-finding-id="${fixture.findingId}"]`)
  await local.locator('.local-finding-summary').press('Enter')
  await local.locator('.local-finding-summary').focus()
  await local.locator('.local-finding-summary').press('Enter')
  const evidence = page.locator('#evidenceWindow')
  await expectVisible(evidence)
  assert.equal(await evidence.locator('[data-close-evidence]').evaluate(node => document.activeElement === node), true)
  assert.equal(
    (await evidence.locator('.evidence-claim').textContent()).trim(),
    'Calm Technology kann Aufmerksamkeit schonen, indem Technik zwischen Zentrum und Peripherie wechselt.',
  )
  assert.equal(await evidence.getByText('Primärquelle', { exact: true }).count(), 1)
  assert.equal(await evidence.getByText('Auszug', { exact: true }).count(), 1)
  assert.equal(await evidence.getByText('Zusammenfassung', { exact: true }).count(), 1)
  assert.equal(await evidence.getByText('Demoquelle - nicht live verifiziert', { exact: true }).count(), 1)
  assert.equal(await evidence.getByText('Nicht verifiziert', { exact: true }).count(), 1)
  assert.equal(await evidence.locator('[data-copy-citation]').nth(1).isDisabled(), true)
  assert.match(await evidence.locator('[data-copy-citation]').nth(1).textContent(), /erst nach Prüfung/i)
  assert.equal(await evidence.getByText('Fundstelle', { exact: true }).count(), 2)
  assert.equal(await evidence.getByText('Demo-Fundstelle, Absatz 1', { exact: true }).count(), 1)
  assert.equal(
    (await evidence.locator('.evidence-source-preview').first().textContent()).trim(),
    'The most potentially interesting, challenging, and profound change implied by the ubiquitous computing era is a focus on calm.',
  )
  assert.equal(await evidence.getByText('Einordnung', { exact: true }).count(), 1)
  assert.equal(await evidence.getByText('Grenzen / Gegenbelege', { exact: true }).count(), 1)
  assert.equal(
    (await evidence.locator('.evidence-source-citation').first().textContent()).trim(),
    'Weiser, M., & Brown, J. S. (1996). The Coming Age of Calm Technology.',
  )
  await page.evaluate(() => {
    window.__copiedCitation = null
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async value => { window.__copiedCitation = value } },
    })
  })
  await evidence.locator('[data-copy-citation]').first().click()
  assert.equal(
    await page.evaluate(() => window.__copiedCitation),
    'Weiser, M., & Brown, J. S. (1996). The Coming Age of Calm Technology.',
  )
  await page.waitForFunction(() => /kopiert/i.test(document.getElementById('agentLiveStatus')?.textContent || ''))
  assert.match(await page.locator('#agentLiveStatus').textContent(), /Demo-Angabe.*prüfen/i)
  assert.doesNotMatch(await page.locator('#agentLiveStatus').textContent(), /zitierfähig/i)
  assert.equal(await evidence.locator('a[href="https://calmtech.com/papers"]').count(), 2)
  assert.equal(await page.locator('#agentWidget').isHidden(), true)
  assert.equal(await page.locator('#structureNav .block-preview').count() > 0, true)
  assert.equal(await page.locator('.local-dialogue').count(), 0)
  const evidenceGeometry = await evidence.evaluate(node => {
    const rect = node.getBoundingClientRect()
    const editorRect = document.querySelector('#editor .ProseMirror').getBoundingClientRect()
    return {
      height: rect.height,
      viewportHeight: innerHeight,
      left: rect.left,
      right: rect.right,
      editorRight: editorRect.right,
      viewportWidth: innerWidth,
    }
  })
  assert.ok(evidenceGeometry.height < evidenceGeometry.viewportHeight - 140)
  assert.ok(evidenceGeometry.right <= evidenceGeometry.viewportWidth - 16)
  assert.ok(evidenceGeometry.left >= evidenceGeometry.editorRight + 8)
  await page.waitForTimeout(280)
  await page.screenshot({ path: `${screenshotDir}/aiwt-v2-task6-evidence.png`, fullPage: true })
  await evidence.locator('[data-close-evidence]').click()
  assert.equal(await evidence.isHidden(), true)
  assert.equal(await local.locator('.local-finding-summary').evaluate(node => document.activeElement === node), true)

  await page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    const finding = doc.findings.find(candidate => candidate.id === id)
    delete finding.claim
    finding.target = 'Calm Technology beschreibt Technik'
    finding.short = 'Ist Aufmerksamkeit hier Fähigkeit oder gestaltete Bedingung?'
    doc.workspace.evidenceFindingId = id
    document.getElementById('title').dispatchEvent(new Event('input'))
  }, fixture.findingId)
  await expectVisible(evidence)
  assert.equal(
    (await evidence.locator('.evidence-claim').textContent()).trim(),
    'Zu belegende Aussage noch nicht erfasst',
  )
  assert.equal(await evidence.getByText('Zu belegende Aussage', { exact: true }).count(), 0)
  assert.equal(await evidence.getByText('Calm Technology beschreibt Technik', { exact: true }).count(), 0)
  assert.equal(await evidence.getByText('Ist Aufmerksamkeit hier Fähigkeit oder gestaltete Bedingung?', { exact: true }).count(), 0)
  assert.equal(await evidence.getByText('Weiser & Brown (1996): The Coming Age of Calm Technology', { exact: true }).count(), 1)
  assert.equal(await evidence.locator('[data-copy-citation]:enabled').count(), 0)
  assert.equal(await evidence.locator('[data-copy-citation]:disabled').count(), 2)
  await evidence.locator('[data-close-evidence]').click()

  assert.deepEqual(errors, [])
  await page.close()
}

async function runTask6Mobile(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  })
  const page = await context.newPage()
  await openExample(page)

  await page.locator('#ondaAura').tap()
  const widget = page.locator('#agentWidget')
  await expectVisible(widget)
  const widgetLayout = await widget.evaluate(node => {
    const rect = node.getBoundingClientRect()
    const input = node.querySelector('input').getBoundingClientRect()
    return {
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      inputBottom: input.bottom,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  assert.ok(widgetLayout.left >= 8)
  assert.ok(widgetLayout.right <= widgetLayout.viewportWidth - 8)
  assert.ok(widgetLayout.bottom <= widgetLayout.viewportHeight - 8)
  assert.ok(widgetLayout.inputBottom <= widgetLayout.viewportHeight - 12)
  assert.ok(widgetLayout.overflow <= 1)
  await page.waitForTimeout(260)
  await page.screenshot({ path: `${screenshotDir}/aiwt-v2-task6-mobile-widget.png`, fullPage: true })
  await widget.locator('[data-close-agent]').tap()
  await page.locator('#sidebarCollapse').tap()

  const fixture = await injectTask6PassageFinding(page, false)
  const local = page.locator(`#localAgentLayer [data-finding-id="${fixture.findingId}"]`)
  await local.locator('.local-finding-summary').tap()
  await local.locator('.local-finding-summary').tap()
  await expectVisible(local.locator('.local-dialogue'))
  await local.locator('input').scrollIntoViewIfNeeded()
  const localLayout = await local.evaluate(node => {
    const rect = node.getBoundingClientRect()
    const input = node.querySelector('.local-dialogue input').getBoundingClientRect()
    return {
      left: rect.left,
      right: rect.right,
      inputTop: input.top,
      inputBottom: input.bottom,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  assert.ok(localLayout.left >= 0)
  assert.ok(localLayout.right <= localLayout.viewportWidth)
  assert.ok(localLayout.inputTop >= 0)
  assert.ok(localLayout.inputBottom <= localLayout.viewportHeight)
  assert.ok(localLayout.overflow <= 1)
  await local.locator('input').fill('Als Bedingung.')
  await local.locator('form').press('Enter')
  for (let turn = 2; turn <= 8; turn += 1) {
    const input = local.locator('input')
    await input.fill(`Mobile Antwort ${turn}.`)
    await input.press('Enter')
  }
  await local.locator('input').scrollIntoViewIfNeeded()
  const multiTurnLayout = await local.evaluate(node => {
    const messages = node.querySelector('.local-dialogue-messages')
    const input = node.querySelector('.local-dialogue input')
    const spacer = document.querySelector('.local-feedback-spacer')
    const inputRect = input.getBoundingClientRect()
    return {
      inputTop: inputRect.top,
      inputBottom: inputRect.bottom,
      viewportHeight: innerHeight,
      messageClientHeight: messages.clientHeight,
      messageScrollHeight: messages.scrollHeight,
      messageScrollTop: messages.scrollTop,
      spacerHeight: spacer?.getBoundingClientRect().height || 0,
      focused: document.activeElement === input,
    }
  })
  assert.ok(multiTurnLayout.inputTop >= 0, JSON.stringify(multiTurnLayout))
  assert.ok(multiTurnLayout.inputBottom <= multiTurnLayout.viewportHeight + 1, JSON.stringify(multiTurnLayout))
  assert.ok(multiTurnLayout.messageScrollHeight > multiTurnLayout.messageClientHeight)
  assert.ok(multiTurnLayout.messageScrollTop > 0)
  assert.ok(multiTurnLayout.spacerHeight > 0 && multiTurnLayout.spacerHeight <= 460)
  assert.equal(multiTurnLayout.focused, true)
  await local.locator('input').tap()
  assert.equal(await local.locator('input').evaluate(node => document.activeElement === node), true)
  await page.waitForTimeout(260)
  await page.screenshot({ path: `${screenshotDir}/aiwt-v2-task6-mobile-dialogue.png`, fullPage: true })

  await context.close()
}

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

const TASK7_SCENARIOS = ['base', 'shelf', 'finding', 'suggestion', 'local-dialogue', 'agent', 'evidence']

async function parkPassageFindings(page) {
  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.findings.forEach(finding => {
      if (finding.placement === 'passage') finding.status = 'parked'
    })
    doc.workspace.currentFindingId = null
    doc.workspace.expandedFindingId = null
    doc.workspace.suggestionFindingId = null
    doc.workspace.localThreadFindingId = null
    doc.workspace.evidenceFindingId = null
    doc.workspace.agent.open = false
    document.getElementById('title').dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function captureTask7PassageState(page) {
  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    const findingId = document.querySelector('#localAgentLayer .local-finding')?.dataset.findingId || null
    const finding = doc.findings.find(candidate => candidate.id === findingId)
    window.__task7PassageState = { findingId, status: finding?.status || null }
  })
}

async function prepareTask7Scenario(page, name) {
  if (name === 'base') await parkPassageFindings(page)

  if (name === 'shelf') {
    await expectVisible(page.locator('#localAgentLayer [data-finding-id]'))
    await captureTask7PassageState(page)
  } else if (name === 'local-dialogue') {
    const fixture = await injectTask6PassageFinding(page, false)
    const local = page.locator(`#localAgentLayer [data-finding-id="${fixture.findingId}"]`)
    await local.locator('.local-finding-summary').click()
    await local.locator('.local-finding-summary').click()
    await expectVisible(local.locator('.local-dialogue'))
  } else if (name === 'suggestion') {
    const local = page.locator('#localAgentLayer [data-finding-id]').first()
    await expectVisible(local)
    await local.locator('.local-finding-summary').click()
    await local.locator('.local-finding-summary').click()
    await expectVisible(page.locator('#localAgentLayer .local-suggestion'))
  } else if (name === 'agent') {
    await expectVisible(page.locator('#localAgentLayer [data-finding-id]'))
    await captureTask7PassageState(page)
    await page.locator('#ondaAura').click()
  } else if (name === 'evidence') {
    const fixture = await injectTask6PassageFinding(page, true)
    const local = page.locator(`#localAgentLayer [data-finding-id="${fixture.findingId}"]`)
    await captureTask7PassageState(page)
    await local.locator('.local-finding-summary').click()
    await local.locator('.local-finding-summary').click()
    await expectVisible(page.locator('#evidenceWindow'))
  } else if (name === 'finding') {
    await expectVisible(page.locator('#localAgentLayer [data-finding-id]'))
  }
  await page.waitForTimeout(280)
}

async function assertTask7IconControls(page, label) {
  const selectors = [
    '.icon-button',
    '.surface-close',
    '.agent-chat-send',
    '.suggestion-action',
    '.block-insert-trigger',
    '#newBtn',
    '#sortBtn',
    '.tico',
  ].join(',')
  const controls = page.locator(selectors)
  const report = []
  for (let index = 0; index < await controls.count(); index += 1) {
    const control = controls.nth(index)
    const visible = await control.evaluate(node => {
      const style = getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number.parseFloat(style.opacity) > 0.01
        && rect.width > 0
        && rect.height > 0
    })
    if (!visible) continue
    const item = await control.evaluate((node, itemIndex) => {
      const labelledBy = (node.getAttribute('aria-labelledby') || '')
        .split(/\s+/)
        .filter(Boolean)
        .map(id => document.getElementById(id)?.textContent?.trim() || '')
        .join(' ')
        .trim()
      const name = (
        node.getAttribute('aria-label')
        || labelledBy
        || node.getAttribute('title')
        || ''
      ).trim()
      return {
        index: itemIndex,
        className: node.className,
        name,
      }
    }, index)
    await control.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    const focus = await control.evaluate(node => {
      const style = getComputedStyle(node)
      return {
        active: document.activeElement === node,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      }
    })
    report.push({ ...item, ...focus })
  }
  const unnamed = report.filter(item => !item.name)
  assert.deepEqual(unnamed, [], `${label}: Symbolbuttons ohne zugänglichen Namen`)
  const invisibleFocus = report.filter(item => (
    !item.active || item.outlineStyle === 'none' || Number.parseFloat(item.outlineWidth) <= 0
  ))
  assert.deepEqual(invisibleFocus, [], `${label}: Symbolbuttons ohne sichtbaren Fokus`)
}

async function assertVisibleTabSequence(page, startSelector, steps, label) {
  await page.locator(startSelector).focus()
  const sequence = []
  for (let index = 0; index < steps; index += 1) {
    await page.keyboard.press('Tab')
    sequence.push(await page.evaluate(() => {
      const node = document.activeElement
      if (!(node instanceof HTMLElement)) return { visible: false, name: '' }
      let current = node
      let visible = true
      while (current) {
        const style = getComputedStyle(current)
        if (
          style.display === 'none'
          || style.visibility === 'hidden'
          || Number.parseFloat(style.opacity) <= .01
        ) {
          visible = false
          break
        }
        current = current.parentElement
      }
      const rect = node.getBoundingClientRect()
      visible = visible && rect.width > 0 && rect.height > 0
      return {
        visible,
        name: node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent?.trim() || node.id,
        className: node.className,
      }
    }))
  }
  assert.equal(sequence.length, steps)
  assert.deepEqual(sequence.filter(item => !item.visible), [], `${label}: unsichtbare Ziele in der Tabfolge`)
  assert.deepEqual(
    sequence.filter(item => /\bbb(?:-|\b)|bubble/.test(String(item.className))),
    [],
    `${label}: alte Formatierungsaktionen in der Tabfolge`,
  )
}

async function assertTask7MobileHitboxes(page, name) {
  const required = {
    base: ['#sidebarBack', '#ondaAura', '#blockInsertTrigger'],
    shelf: ['#sidebarBack', '#ondaAura', '#structureNav .block-preview'],
    finding: ['#sidebarReopen', '#ondaAura', '#blockInsertTrigger'],
    suggestion: ['#sidebarReopen', '#ondaAura', '.suggestion-action'],
    'local-dialogue': ['#sidebarReopen', '#ondaAura', '.local-dialogue .agent-chat-send'],
    agent: ['#sidebarReopen', '#ondaAura', '#agentWidget .surface-close', '#agentWidget .agent-chat-send'],
    evidence: ['#sidebarReopen', '#ondaAura', '#evidenceWindow .surface-close'],
  }[name] || []

  for (const selector of required) {
    const controls = page.locator(selector)
    assert.ok(await controls.count(), `mobile ${name}: ${selector} fehlt`)
    for (let index = 0; index < await controls.count(); index += 1) {
      const box = await controls.nth(index).boundingBox()
      assert.ok(box, `mobile ${name}: ${selector} hat keine Trefferfläche`)
      assert.ok(box.width >= 43.5, `mobile ${name}: ${selector} ist nur ${box.width}px breit`)
      assert.ok(box.height >= 43.5, `mobile ${name}: ${selector} ist nur ${box.height}px hoch`)
    }
  }

  for (const selector of ['#blockInsertTrigger']) {
    const control = page.locator(selector).first()
    if (!await control.count() || !await control.isVisible()) continue
    const contrast = await control.evaluate(node => {
      const rgb = value => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
      const linear = value => {
        const channel = value / 255
        return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
      }
      const luminance = color => .2126 * linear(color[0]) + .7152 * linear(color[1]) + .0722 * linear(color[2])
      const style = getComputedStyle(node)
      const foreground = rgb(style.color)
      let parent = node.parentElement
      let background = [255, 255, 255]
      while (parent) {
        const value = getComputedStyle(parent).backgroundColor
        if (value && !/rgba?\(0, 0, 0(?:, 0)?\)/.test(value) && value !== 'transparent') {
          background = rgb(value)
          break
        }
        parent = parent.parentElement
      }
      const alpha = Number.parseFloat(style.opacity)
      const composite = foreground.map((channel, index) => channel * alpha + background[index] * (1 - alpha))
      const a = luminance(composite)
      const b = luminance(background)
      return (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
    })
    assert.ok(contrast >= 3, `${name}: Plus-Kontrast ${contrast.toFixed(2)}:1`)
  }
}

async function assertTask7CommonLayout(page, name, mobile) {
  const layout = await page.evaluate(() => {
    const visibleRects = [...document.querySelectorAll(
      '#structureNav, #agentWidget, #evidenceWindow, #localAgentLayer .local-finding, #localAgentLayer .local-suggestion',
    )]
      .filter(node => {
        const style = getComputedStyle(node)
        if (
          node.closest('#ondaSidebar')
          && document.getElementById('editorView')?.classList.contains('is-sidebar-collapsed')
        ) return false
        return !node.hidden && style.display !== 'none' && style.visibility !== 'hidden'
      })
      .map(node => ({
        selector: node.id || node.className,
        left: node.getBoundingClientRect().left,
        right: node.getBoundingClientRect().right,
      }))
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      viewportWidth: document.documentElement.clientWidth,
      visibleRects,
      // Struktur ist dauerhaft in der Seitenleiste; nur Agent/Belege sind konkurrierende Overlays
      openMajorLayers: [...document.querySelectorAll('#agentWidget, #evidenceWindow')]
        .filter(node => !node.hidden && getComputedStyle(node).display !== 'none').length,
    }
  })
  assert.ok(layout.overflow <= 1, `${mobile ? 'mobile' : 'desktop'} ${name}: horizontales Overflow ${layout.overflow}px`)
  layout.visibleRects.forEach(rect => {
    assert.ok(rect.left >= -1, `${name}: ${rect.selector} ragt links heraus`)
    assert.ok(rect.right <= layout.viewportWidth + 1, `${name}: ${rect.selector} ragt rechts heraus`)
  })
  assert.ok(layout.openMajorLayers <= 1, `${name}: konkurrierende Hauptflächen sind gleichzeitig offen`)

  if (['agent', 'evidence'].includes(name)) {
    const localPause = await page.evaluate(() => {
      const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
      const layer = document.getElementById('localAgentLayer')
      const local = layer.querySelector('.local-finding')
      const before = window.__task7PassageState
      const current = doc.findings.find(finding => finding.id === before?.findingId)
      const style = local ? getComputedStyle(local) : null
      return {
        paused: layer.classList.contains('is-paused'),
        ariaHidden: layer.getAttribute('aria-hidden'),
        findingId: local?.dataset.findingId || null,
        beforeFindingId: before?.findingId || null,
        beforeStatus: before?.status || null,
        currentStatus: current?.status || null,
        localVisibility: style?.visibility || null,
      }
    })
    assert.equal(localPause.paused, true, `${name}: lokaler Hinweis ist nicht visuell pausiert`)
    assert.equal(localPause.ariaHidden, 'true')
    assert.equal(localPause.findingId, localPause.beforeFindingId)
    assert.equal(localPause.currentStatus, localPause.beforeStatus)
    assert.equal(localPause.currentStatus, 'open')
    assert.equal(localPause.localVisibility, 'hidden')
  }

  if (!mobile && ['agent', 'evidence'].includes(name)) {
    const panelClearance = await page.evaluate(panelName => {
      const panelId = panelName === 'agent' ? 'agentWidget' : 'evidenceWindow'
      const openClass = panelName === 'agent' ? 'is-agent-open' : 'is-evidence-open'
      const widget = document.getElementById(panelId).getBoundingClientRect()
      const blocks = [...document.querySelectorAll('#editor .ProseMirror > [data-block-id]')]
        .map(node => node.getBoundingClientRect())
      const local = document.querySelector('#localAgentLayer .local-finding')
      const localRect = local?.getBoundingClientRect() || null
      const localVisible = Boolean(local && getComputedStyle(local).visibility !== 'hidden')
      const localOverlap = localVisible && localRect
        ? Math.max(0, Math.min(localRect.right, widget.right) - Math.max(localRect.left, widget.left))
          * Math.max(0, Math.min(localRect.bottom, widget.bottom) - Math.max(localRect.top, widget.top))
        : 0
      return {
        bodyClass: document.getElementById('editorView').classList.contains(openClass),
        widgetLeft: widget.left,
        textRight: Math.max(...blocks.map(rect => rect.right)),
        localOverlap,
      }
    }, name)
    assert.equal(panelClearance.bodyClass, true)
    assert.ok(panelClearance.textRight <= panelClearance.widgetLeft - 8, `${name} schneidet Text um ${panelClearance.textRight - panelClearance.widgetLeft}px`)
    assert.equal(panelClearance.localOverlap, 0)
  }

  if (name === 'shelf') {
    // Struktur lebt dauerhaft in der Seitenleiste — als Karten, ohne modales Backdrop
    const shelfLayout = await page.evaluate(() => ({
      previews: document.querySelectorAll('#structureNav .block-preview').length,
      backdropCount: document.querySelectorAll('.workspace-backdrop, [data-workspace-backdrop]').length,
    }))
    assert.ok(shelfLayout.previews > 0)
    assert.equal(shelfLayout.backdropCount, 0)
  }

  if (mobile && ['finding', 'local-dialogue'].includes(name)) {
    const localLayout = await page.evaluate(() => {
      const note = document.querySelector('#localAgentLayer .local-finding')
      const block = note && document.querySelector(`#editor .ProseMirror > [data-block-id="${note.dataset.blockId}"]`)
      if (!note || !block) return null
      const noteRect = note.getBoundingClientRect()
      const blockRect = block.getBoundingClientRect()
      return {
        belowClass: note.classList.contains('is-below'),
        noteTop: noteRect.top,
        blockBottom: blockRect.bottom,
      }
    })
    assert.ok(localLayout)
    assert.equal(localLayout.belowClass, true)
    assert.ok(localLayout.noteTop >= localLayout.blockBottom - 1)
  }

  if (mobile && ['agent', 'evidence'].includes(name)) {
    const selector = name === 'agent' ? '#agentWidget' : '#evidenceWindow'
    const widget = await page.locator(selector).evaluate(node => {
      const rect = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      return {
        left: rect.left,
        rightInset: innerWidth - rect.right,
        height: rect.height,
        maxHeight: Number.parseFloat(style.maxHeight),
        viewportHeight: innerHeight,
      }
    })
    assert.ok(widget.left >= 11.5, `${name}: linker Abstand ${widget.left}px`)
    assert.ok(widget.rightInset >= 11.5, `${name}: rechter Abstand ${widget.rightInset}px`)
    assert.ok(widget.maxHeight <= widget.viewportHeight * .7 + 1, `${name}: max-height ${widget.maxHeight}px`)
    assert.ok(widget.height <= widget.viewportHeight * .7 + 1, `${name}: Höhe ${widget.height}px`)
  }

  const overlaps = await page.evaluate(() => {
    const pairs = [
      ['.agent-widget-title', '#agentWidget .surface-close'],
      ['#agentWidget .agent-chat-input', '#agentWidget .agent-chat-send'],
      ['.evidence-title', '#evidenceWindow .surface-close'],
      ['.local-finding-short', '.local-finding-disclosure'],
    ]
    return pairs.flatMap(([leftSelector, rightSelector]) => {
      const left = document.querySelector(leftSelector)
      const right = document.querySelector(rightSelector)
      if (!left || !right || left.offsetParent === null || right.offsetParent === null) return []
      const a = left.getBoundingClientRect()
      const b = right.getBoundingClientRect()
      const width = Math.min(a.right, b.right) - Math.max(a.left, b.left)
      const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
      return width > 1 && height > 1 ? [`${leftSelector} / ${rightSelector}`] : []
    })
  })
  assert.deepEqual(overlaps, [], `${name}: Text oder Controls überlappen`)
  await assertTask7IconControls(page, `${mobile ? 'mobile' : 'desktop'} ${name}`)
  if (mobile) await assertTask7MobileHitboxes(page, name)
}

async function runTask7Scenarios(browser, mobile) {
  const viewport = mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }
  for (const name of TASK7_SCENARIOS) {
    const context = await browser.newContext({
      viewport,
      hasTouch: mobile,
      isMobile: mobile,
    })
    const page = await context.newPage()
    const errors = []
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', error => errors.push(error.message))
    await openExample(page)
    if (mobile && !['base', 'shelf'].includes(name)) {
      await page.locator('#sidebarCollapse').tap()
    }
    await prepareTask7Scenario(page, name)
    await assertTask7CommonLayout(page, name, mobile)
    await page.mouse.move(0, 0)
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      document.getElementById('structureNav').scrollTop = 0
      document.getElementById('scroll').scrollTop = 0
      document.getElementById('title').dispatchEvent(new Event('input', { bubbles: true }))
    })
    await page.waitForTimeout(80)
    await page.screenshot({
      path: `${screenshotDir}/aiwt-v2-task7-${mobile ? 'mobile' : 'desktop'}-${name}.png`,
      fullPage: true,
    })
    assert.deepEqual(errors, [], `${mobile ? 'mobile' : 'desktop'} ${name}: Browserfehler`)
    await context.close()
  }
}

async function runTask7Intermediate(browser) {
  for (const name of ['finding', 'agent', 'evidence']) {
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 } })
    const page = await context.newPage()
    const errors = []
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', error => errors.push(error.message))
    await openExample(page)
    await prepareTask7Scenario(page, name)
    await assertTask7CommonLayout(page, name, false)
    await page.screenshot({
      path: `${screenshotDir}/aiwt-v2-task7-1024-${name}.png`,
      fullPage: true,
    })
    assert.deepEqual(errors, [], `1024 ${name}: Browserfehler`)
    await context.close()
  }
}

function transitionSeconds(value) {
  return String(value || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => part.endsWith('ms') ? Number.parseFloat(part) / 1000 : Number.parseFloat(part))
}

async function assertReducedTransition(page, selector) {
  const duration = await page.locator(selector).evaluate(node => getComputedStyle(node).transitionDuration)
  const seconds = transitionSeconds(duration)
  assert.ok(seconds.length > 0)
  assert.ok(seconds.every(value => Number.isFinite(value) && value <= .01), `${selector}: ${duration}`)
}

async function runTask7KeyboardAndMotion(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openExample(page)

  await page.locator('#editor .ProseMirror').evaluate(node => {
    const text = node.querySelector('p')?.firstChild
    if (!text || text.nodeType !== Node.TEXT_NODE || text.textContent.length < 2) return
    const selection = getSelection()
    const range = document.createRange()
    range.setStart(text, 0)
    range.setEnd(text, 2)
    selection.removeAllRanges()
    selection.addRange(range)
    node.dispatchEvent(new Event('mouseup', { bubbles: true }))
  })
  assert.equal(await page.locator('.bubble, .bb-b, .bb-i, .bb-u, .bb-s, .bb-hl').count(), 0)

  await page.locator('#sidebarCollapse').click()
  await assertReducedTransition(page, '#ondaSidebar')
  await page.locator('#sidebarReopen').click()
  await page.locator('#sidebarCollapse').click()

  const finding = page.locator('#localAgentLayer [data-finding-id]')
  await finding.locator('.local-finding-summary').click()
  await finding.locator('.local-finding-summary').click()
  await assertReducedTransition(page, '.local-finding-summary')
  await assertReducedTransition(page, '.local-suggestion')
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')

  await page.locator('#ondaAura').click()
  await assertReducedTransition(page, '#agentWidget')
  await page.keyboard.press('Escape')

  const fixture = await injectTask6PassageFinding(page, true)
  const evidenceFinding = page.locator(`#localAgentLayer [data-finding-id="${fixture.findingId}"]`)
  await evidenceFinding.locator('.local-finding-summary').click()
  await evidenceFinding.locator('.local-finding-summary').click()
  await assertReducedTransition(page, '#evidenceWindow')
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#evidenceWindow').isHidden(), true)

  await page.locator('#ondaAura').click()
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#agentWidget').isHidden(), true)

  await page.locator('#sidebarReopen').click()
  await page.locator('#pvCard').click()
  await expectVisible(page.locator('#pvModal[role="dialog"]'))
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#pvModal').isHidden(), true)
  assert.equal(await page.locator('#pvCard').evaluate(node => document.activeElement === node), true)

  await page.locator('#editor .ProseMirror').focus()
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.body.classList.contains('view-home'))
  await page.waitForFunction(() => document.activeElement === document.getElementById('search'))
  assert.equal(await page.locator('#search').evaluate(node => document.activeElement === node), true)
  await assertTask7IconControls(page, 'home')

  await page.locator('#crumb').click()
  const projectMain = page.locator('#doclist button.doc-main').filter({ hasText: 'Beispiel: Calm Technology' })
  assert.equal(await projectMain.count(), 1)
  assert.equal(await page.locator('#doclist button.doc-main button, #doclist button.doc-main input').count(), 0)
  await assertVisibleTabSequence(page, '#newBtn', 5, 'Projektübersicht')
  const projectAction = projectMain.locator('xpath=following-sibling::*[contains(@class, "trash-acts")]//button').first()
  await projectAction.focus()
  assert.equal(await projectAction.locator('xpath=..').evaluate(node => Number.parseFloat(getComputedStyle(node).opacity) > .99), true)
  await projectMain.focus()
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.getElementById('homeTitle')?.textContent?.includes('Beispiel: Calm Technology'))

  const textMain = page.locator('#doclist button.doc-main').first()
  assert.equal(await textMain.count(), 1)
  assert.equal(await page.locator('#doclist button.doc-main button, #doclist button.doc-main input').count(), 0)
  const textAction = textMain.locator('xpath=following-sibling::*[contains(@class, "trash-acts")]//button').first()
  await textAction.focus()
  assert.equal(await textAction.locator('xpath=..').evaluate(node => Number.parseFloat(getComputedStyle(node).opacity) > .99), true)
  await textMain.focus()
  await page.keyboard.press('Space')
  await page.waitForFunction(() => document.body.classList.contains('view-editor'))
  await page.close()
}

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
    window.AIWT.__workspaceTestBridge.reinitialize()
  })
  await page.waitForTimeout(100)
  assert.equal(await page.evaluate(() => window.__llmMock.aufrufe.length), 0,
    'Oberhalb der Monatsgrenze darf kein automatischer Netzwerkaufruf starten')

  await page.locator('#kiSettings').click()
  await expectVisible(dialog)
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

const browser = await chromium.launch({ headless: true })
try {
  if (process.env.AIWT_SYSTEM8_ONLY === '1') {
    await runSystem8BudgetGate(browser)
  } else {
    if (process.env.AIWT_TASK7_ONLY !== '1') {
      await runSeedMigrationRegression(browser)
      await runDesktop(browser)
      await runBlockIdentityRegressions(browser)
      await runTask4InteractionRegressions(browser)
      await runTask5PassageFeedback(browser)
      await runTask5OwnershipAndAmbiguity(browser)
      await runFinalFindingRegressions(browser)
      await runSaveAlert(browser)
      await runPrintLayout(browser)
      await runHomeFocus(browser)
      await runMobile(browser)
      await runTask5MobileFeedback(browser)
      await runTask6DialogueAndEvidence(browser)
      await runTask6Mobile(browser)
      await runTask6InitiativeAndLifecycle(browser)
      await runSystem8BudgetGate(browser)
    }
    await runTask7Scenarios(browser, false)
    await runTask7Scenarios(browser, true)
    await runTask7Intermediate(browser)
    await runTask7KeyboardAndMotion(browser)
  }
  console.log('V2 smoke passed')
} finally {
  await browser.close()
}
