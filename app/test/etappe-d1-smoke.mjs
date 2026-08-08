import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium, firefox, webkit } from 'playwright'
import { ensureProjectSidebarOpen } from './helpers/onda-navigation.mjs'

const baseUrl = process.env.AIWT_URL || 'http://127.0.0.1:4173/'
const CENTRAL = 'Das Angebot garantiert jeder Gemeinde warscheinlich sinkende Kosten.'
const SECOND_CANARY = 'CANARY-D1-ZWEITTEXT bleibt ausschließlich im zweiten Text.'
const BETA_CANARY = 'CANARY-D1-BETA bleibt ausschließlich im zweiten Projekt.'

async function freshApp(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
}

async function seedLanguageProjects(page, name = 'D1 Alpha') {
  return page.evaluate(({ name, central, secondCanary, betaCanary }) => {
    const alpha = window.AIWT.newProject(name)
    window.AIWT.newDoc()
    const alphaDoc = window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active)
    alpha.understanding.task = 'Ein nachvollziehbares Angebot für Gemeinden entwickeln'
    alpha.understanding.audience = ['Kommunale Entscheiderinnen und Entscheider']
    alpha.understanding.desiredEffect = 'Nutzen und Grenzen fair abwägen können'
    window.AIWT.__blockIdentityTestBridge.setContent([
      {
        type: 'heading',
        attrs: { level: 2, blockId: 'b-heading', semanticRole: null },
        content: [{ type: 'text', text: 'D1 Prüftext' }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'b-central', semanticRole: 'claim' },
        content: [{ type: 'text', text: central }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'b-link', semanticRole: null },
        content: [
          { type: 'text', text: 'Zur ' },
          {
            type: 'text',
            marks: [{ type: 'link', attrs: { href: 'https://example.org/beleg', target: '_blank', rel: 'noopener noreferrer nofollow', class: null } }],
            text: 'warscheinlich',
          },
          { type: 'text', text: ' mit dem Original.' },
        ],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'b-grammar', semanticRole: null },
        content: [{ type: 'text', text: 'Der der Befund bleibt erklärungsbedürftig.' }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'b-connector-1', semanticRole: null },
        content: [{ type: 'text', text: 'Darüber hinaus beginnt hier ein Gedanke.' }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'b-connector-2', semanticRole: null },
        content: [{ type: 'text', text: 'Darüber hinaus beginnt hier ein weiterer Gedanke.' }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'b-connector-3', semanticRole: null },
        content: [{ type: 'text', text: 'Darüber hinaus beginnt hier noch ein Gedanke.' }],
      },
      {
        type: 'blockquote',
        attrs: { blockId: 'b-image', semanticRole: null },
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: 'Die Reserve ist warscheinlich genau wie ein Sicherheitsnetz für den Haushalt.' }],
        }],
      },
      {
        type: 'bulletList',
        attrs: { blockId: 'b-list', semanticRole: null },
        content: [{
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: 'Ein Vorteil ist nähmlich die planbare Einführung.' }],
          }],
        }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'b-pressure', semanticRole: null },
        content: [{ type: 'text', text: 'Nur heute: Du willst doch nicht schuld am Stillstand sein.' }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'b-protected', semanticRole: null },
        content: [{ type: 'text', text: 'Der Pfad https://example.org/warscheinlich und das Zitat „nähmlich“ bleiben unverändert.' }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'b-proper-name', semanticRole: null },
        content: [{ type: 'text', text: 'Nähmlich GmbH bleibt als registrierter Eigenname unverändert.' }],
      },
    ])
    window.AIWT.flushSave()

    window.AIWT.newDoc()
    const alphaSecondDoc = window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active)
    window.AIWT.__blockIdentityTestBridge.setContent([{
      type: 'paragraph',
      attrs: { blockId: 'b-alpha-second', semanticRole: null },
      content: [{ type: 'text', text: secondCanary }],
    }])
    window.AIWT.flushSave()

    const beta = window.AIWT.newProject('D1 Beta')
    window.AIWT.newDoc()
    const betaDoc = window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active)
    beta.understanding.task = betaCanary
    window.AIWT.__blockIdentityTestBridge.setContent([{
      type: 'paragraph',
      attrs: { blockId: 'b-beta', semanticRole: null },
      content: [{ type: 'text', text: betaCanary }],
    }])
    window.AIWT.flushSave()
    window.AIWT.openDoc(alphaDoc.id)
    return {
      alphaId: alpha.id,
      alphaDocId: alphaDoc.id,
      alphaSecondDocId: alphaSecondDoc.id,
      betaId: beta.id,
      betaDocId: betaDoc.id,
    }
  }, { name, central: CENTRAL, secondCanary: SECOND_CANARY, betaCanary: BETA_CANARY })
}

async function openLanguageDossier(page) {
  if (!await page.locator('#pvCard').isVisible()) {
    await page.evaluate(() => window.AIWT.openDoc(window.AIWT.state.active))
  }
  await ensureProjectSidebarOpen(page)
  await page.locator('#pvCard').click()
  await page.locator('#pvModal').waitFor({ state: 'visible' })
  await page.locator('#languageOpen').click()
  await page.locator('#languageModal').waitFor({ state: 'visible' })
  await page.locator('#languageModal').evaluate(async node => {
    await Promise.all(node.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})))
  })
  // Ohne Animationen resolved das sofort, waehrend der rAF-Fokus aus openOndaDialog noch
  // aussteht — der koennte sonst ein fill() im Kontextprofil bestehlen. Erst warten, bis
  // der Dialog-Fokus wirklich angekommen ist.
  await page.waitForFunction(() => document.activeElement?.closest('#languageModal'))
}

async function completeProfile(page) {
  const details = page.locator('.language-profile-editor')
  await details.locator('summary').click()
  await page.locator('[aria-label="Textsorte"]').selectOption('marketing')
  await page.locator('[aria-label="Teiltextfunktion"]').fill('Angebot fair einordnen')
  await page.locator('[aria-label="Fach oder Markt"]').fill('Kommunale Beschaffung')
  await page.locator('[aria-label="Zielgruppe"]').fill('Kommunale Entscheiderinnen und Entscheider')
  await page.locator('[aria-label="Medium"]').selectOption('screen')
  await page.locator('[aria-label="Zielzustand beim Publikum"]').fill('Nutzen und Grenzen fair abwägen können')
  await page.locator('[aria-label="Sprachregion"]').selectOption('DE')
  await page.locator('[aria-label="Vorwissen"]').fill('Kennt die Haushaltslage')
  await page.locator('[aria-label="Annahmen"]').fill('Erwartet belastbare Kostenangaben')
  await page.locator('[aria-label="Widerstände"]').fill('Fürchtet Folgekosten')
  await page.locator('[aria-label="Geteilte Grundlage"]').fill('Öffentliche Mittel sollen nachvollziehbar eingesetzt werden')
  await page.getByRole('button', { name: 'Kontextprofil speichern' }).click()
  await page.locator('.language-status').filter({ hasText: 'Kontextprofil gespeichert' }).waitFor()
}

async function assertAccessibility(page) {
  const accessibility = await page.locator('#languageModal').evaluate(modal => {
    const rgba = value => (value.match(/[\d.]+/g) || []).map(Number)
    const luminance = value => {
      const [red, green, blue] = rgba(value).slice(0, 3).map(channel => {
        const normalized = channel / 255
        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue
    }
    const contrast = (foreground, background) => {
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
      return (values[0] + 0.05) / (values[1] + 0.05)
    }
    const opaqueBackground = node => {
      let current = node
      while (current) {
        const color = getComputedStyle(current).backgroundColor
        const channels = rgba(color)
        if (channels.length === 3 || channels[3] > 0.98) return color
        current = current.parentElement
      }
      return 'rgb(255, 255, 255)'
    }
    const controls = [...modal.querySelectorAll('button, summary, textarea, select')]
      .filter(node => node.offsetParent !== null)
      .map(node => {
        const rect = node.getBoundingClientRect()
        return {
          name: node.getAttribute('aria-label') || node.textContent.trim(),
          width: rect.width,
          height: rect.height,
        }
      })
    const essentialText = [...modal.querySelectorAll('.language-origin, .language-kicker, .language-tag')]
      .filter(node => node.offsetParent !== null)
      .map(node => {
        const style = getComputedStyle(node)
        return {
          text: node.textContent.trim(),
          ratio: contrast(style.color, opaqueBackground(node)),
        }
      })
    const labelledBy = modal.getAttribute('aria-labelledby')
    return {
      role: modal.getAttribute('role'),
      modal: modal.getAttribute('aria-modal'),
      labelled: Boolean(labelledBy && document.getElementById(labelledBy)?.textContent.trim()),
      controls,
      essentialText,
      summariesFocusable: [...modal.querySelectorAll('summary')].every(node => node.tabIndex >= 0),
    }
  })
  assert.deepEqual({
    role: accessibility.role,
    modal: accessibility.modal,
    labelled: accessibility.labelled,
    summariesFocusable: accessibility.summariesFocusable,
  }, {
    role: 'dialog',
    modal: 'true',
    labelled: true,
    summariesFocusable: true,
  })
  assert.equal(
    accessibility.controls.every(control => control.width >= 43.9 && control.height >= 43.9),
    true,
    JSON.stringify(accessibility.controls),
  )
  assert.equal(
    accessibility.essentialText.every(item => item.ratio >= 4.5),
    true,
    JSON.stringify(accessibility.essentialText),
  )
}

async function runLanguageFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 940 } })
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  await freshApp(page)
  const ids = await seedLanguageProjects(page)

  await page.evaluate(docId => window.AIWT.openDoc(docId), ids.alphaSecondDocId)
  await openLanguageDossier(page)
  const secondText = await page.locator('#languageModal').textContent()
  assert.match(secondText, new RegExp(SECOND_CANARY))
  assert.equal(secondText.includes(CENTRAL), false)
  await page.keyboard.press('Escape')

  await page.evaluate(docId => window.AIWT.openDoc(docId), ids.alphaDocId)
  const beforeHtml = await page.evaluate(() => window.AIWT.state.editor.getHTML())
  await openLanguageDossier(page)
  const initialText = await page.locator('#languageModal').textContent()
  assert.match(initialText, /Kontextprofil · 5 Angaben offen/)
  assert.match(initialText, /Eindeutige Normfälle · 2/)
  assert.match(initialText, /Normautomatik ausgeschaltet/)
  assert.match(initialText, /Integrität vor Stil · 2/)
  assert.match(initialText, /Die Textsorte fehlt/)
  assert.equal(initialText.includes(BETA_CANARY), false)
  assert.equal(await page.getByRole('button', { name: 'Eindeutige Normfälle anwenden' }).isDisabled(), true)
  assert.equal(await page.evaluate(() => window.AIWT.state.editor.getHTML()), beforeHtml)

  await completeProfile(page)
  const profiledText = await page.locator('#languageModal').textContent()
  assert.match(profiledText, /Kontextprofil · vollständig/)
  assert.match(profiledText, /Integrität vor Stil · 2/)
  assert.match(profiledText, /persuasive Zuspitzung/)
  assert.match(profiledText, /Druck, Schuld oder künstliche Dringlichkeit/)
  assert.match(profiledText, /Grammatische Beobachtung/)
  assert.match(profiledText, /wiederholte Übergangsformel/)
  assert.match(profiledText, /Publikum · Ausgang und Ziel/)
  assert.match(profiledText, /Wirkungshypothese · analogy/)
  assert.ok(await page.locator('.language-section.is-integrity').count() === 1)
  assert.equal(await page.evaluate(() => window.AIWT.state.editor.getHTML()), beforeHtml)

  await assertAccessibility(page)
  const grammarCard = page.locator('.language-card.is-grammar-observation').first()
  await grammarCard.getByRole('button', { name: 'Als geprüft markieren' }).click()
  await page.locator('.language-status').filter({ hasText: 'Als geprüft markieren' }).waitFor()
  assert.match(await page.locator('#languageModal').textContent(), /Vom Nutzer geprüft/)
  const passageCard = page.locator('.language-card.language-passage').first()
  await passageCard.getByLabel('Funktion korrigieren').selectOption('explain')
  await passageCard.getByRole('button', { name: 'Funktion korrigieren' }).click()
  await page.locator('.language-status').filter({ hasText: 'Funktion korrigieren' }).waitFor()
  assert.match(await page.locator('#languageModal').textContent(), /Nutzerkorrektur · erklärt/)
  const rhetoricCard = page.locator('.language-card.language-rhetoric').first()
  await rhetoricCard.getByRole('button', { name: 'Zuordnung enthalten' }).click()
  await page.locator('.language-status').filter({ hasText: 'Zuordnung enthalten' }).waitFor()
  assert.match(await page.locator('#languageModal').textContent(), /bewusst nicht zugeordnet/)
  // Jeder Status-Render fokussiert die Statuszeile per requestAnimationFrame (language-ui.mjs).
  // Erst wenn dieser Fokus angekommen ist, kann er den gleich gesetzten Fokus auf dem
  // Profil-Summary nicht mehr bestehlen — sonst laeuft das Enter ins Leere.
  await page.waitForFunction(() => document.activeElement?.classList.contains('language-status'))
  const profileDetails = page.locator('.language-profile-editor')
  await profileDetails.locator('summary').focus()
  await page.keyboard.press('Enter')
  assert.equal(await profileDetails.evaluate(node => node.open), true)
  await profileDetails.locator('summary').click()
  assert.equal(await profileDetails.evaluate(node => node.open), false)

  await page.locator('.language-switch').click()
  await page.locator('.language-status').filter({ hasText: 'bewusst eingeschaltet' }).waitFor()
  const apply = page.getByRole('button', { name: 'Eindeutige Normfälle anwenden' })
  assert.equal(await apply.isEnabled(), true)
  await apply.click()
  await page.locator('.language-status').filter({ hasText: '2 eindeutige Normkorrekturen angewendet' }).waitFor()
  await page.waitForFunction(() => document.activeElement?.classList.contains('language-status'))
  const corrected = await page.evaluate(() => {
    window.AIWT.flushSave()
    const json = window.AIWT.__blockIdentityTestBridge.getJSON()
    const central = json.content.find(node => node.attrs?.blockId === 'b-central')
    const linkBlock = json.content.find(node => node.attrs?.blockId === 'b-link')
    const list = json.content.find(node => node.attrs?.blockId === 'b-list')
    const heading = json.content.find(node => node.attrs?.blockId === 'b-heading')
    const linked = linkBlock.content.find(node => node.text === 'warscheinlich')
    const project = window.AIWT.state.projects.find(item => item.id === window.AIWT.state.activeProject)
    return {
      html: window.AIWT.state.editor.getHTML(),
      centralText: central.content.map(node => node.text || '').join(''),
      linkedMarks: linked?.marks || [],
      listType: list.type,
      listText: list.content[0].content[0].content.map(node => node.text || '').join(''),
      headingType: heading.type,
      headingLevel: heading.attrs.level,
      profileEvents: project.languageProfile.events.map(event => event.kind),
    }
  })
  assert.match(corrected.centralText, /wahrscheinlich/)
  assert.equal(corrected.centralText.includes('warscheinlich'), false)
  assert.equal(corrected.linkedMarks.some(mark => mark.type === 'link'), true)
  assert.equal(corrected.listType, 'bulletList')
  assert.match(corrected.listText, /nämlich/)
  assert.equal(corrected.headingType, 'heading')
  assert.equal(corrected.headingLevel, 2)
  assert.equal(corrected.profileEvents.filter(kind => kind === 'orthography-applied').length, 2)
  assert.ok(corrected.profileEvents.includes('profile-corrected'))
  assert.ok(corrected.profileEvents.includes('orthography-setting-changed'))
  assert.match(corrected.html, /href="https:\/\/example\.org\/beleg"/)
  assert.match(corrected.html, /https:\/\/example\.org\/warscheinlich/)
  assert.match(corrected.html, /„nähmlich“/)
  assert.match(corrected.html, /Reserve ist warscheinlich/)
  assert.match(corrected.html, /Nähmlich GmbH/)

  const undoRedo = await page.evaluate(() => {
    const editor = window.AIWT.state.editor
    const blockText = blockId => {
      const node = editor.getJSON().content.find(item => item.attrs?.blockId === blockId)
      const collect = value => [
        value.text || '',
        ...(value.content || []).map(collect),
      ].join('')
      return node ? collect(node) : ''
    }
    const beforeUndo = editor.getHTML()
    let undoCount = 0
    while (
      undoCount < 2
      && (
        !blockText('b-central').includes('warscheinlich')
        || !blockText('b-list').includes('nähmlich')
      )
    ) {
      if (!editor.commands.undo()) break
      undoCount += 1
    }
    const afterUndo = editor.getHTML()
    const afterUndoCentral = blockText('b-central')
    const afterUndoList = blockText('b-list')
    let redoCount = 0
    while (redoCount < undoCount) {
      if (!editor.commands.redo()) break
      redoCount += 1
    }
    return {
      beforeUndo,
      afterUndo,
      afterRedo: editor.getHTML(),
      afterUndoCentral,
      afterUndoList,
      undoCount,
      redoCount,
    }
  })
  assert.equal(undoRedo.undoCount, 1)
  assert.equal(undoRedo.redoCount, undoRedo.undoCount)
  assert.match(undoRedo.afterUndoCentral, /warscheinlich/)
  assert.match(undoRedo.afterUndoList, /nähmlich/)
  assert.equal(undoRedo.afterRedo, undoRedo.beforeUndo)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Dossier als JSON exportieren' }).click()
  const download = await downloadPromise
  assert.match(download.suggestedFilename(), /^sprache-wirkung-.+\.json$/)
  const downloadedPath = await download.path()
  const exportedDossier = JSON.parse(await readFile(downloadedPath, 'utf8'))
  assert.equal(exportedDossier.kind, 'aiwt-language-dossier')
  assert.equal(exportedDossier.textId, ids.alphaDocId)
  assert.equal(exportedDossier.decisions.length, 3)
  assert.equal(exportedDossier.decisions.some(event => (
    event.entityKind === 'effect-passage'
    && event.decision === 'corrected'
    && event.correction?.next === 'explain'
  )), true)
  assert.equal(exportedDossier.decisions.some(event => (
    event.entityKind === 'rhetorical-device'
    && event.decision === 'abstained'
  )), true)
  assert.equal(JSON.stringify(exportedDossier).includes(BETA_CANARY), false)
  assert.equal(JSON.stringify(exportedDossier).includes(SECOND_CANARY), false)

  if (process.env.AIWT_SCREENSHOTS) {
    await page.locator('#languageModal .onda-dialog-body').evaluate(node => { node.scrollTop = 0 })
    await page.waitForTimeout(200)
    await page.screenshot({ path: '/tmp/d1-language-dossier.png', fullPage: true })
  }

  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#pvCard').evaluate(node => document.activeElement === node), true)
  await page.reload({ waitUntil: 'networkidle' })
  await openLanguageDossier(page)
  const persistedText = await page.locator('#languageModal').textContent()
  assert.match(persistedText, /Kontextprofil · vollständig/)
  assert.match(persistedText, /Normautomatik eingeschaltet/)
  assert.match(persistedText, /Eindeutige Normfälle · 0/)
  const stored = await page.evaluate(({ alphaId, betaId, alphaDocId, betaCanary }) => {
    const data = JSON.parse(localStorage.getItem('aiwt.v2'))
    const alpha = data.projects.find(project => project.id === alphaId)
    const beta = data.projects.find(project => project.id === betaId)
    return {
      schemaVersion: data.schemaVersion,
      alphaProfileProjectId: alpha.languageProfile.projectId,
      alphaGenre: alpha.languageProfile.genre,
      betaGenre: beta.languageProfile.genre,
      betaProfileEvents: beta.languageProfile.events.length,
      correctionEvents: alpha.languageProfile.events.filter(event => event.kind === 'orthography-applied').length,
      reportTextIds: Object.keys(alpha.languageReports.byText).sort(),
      languageDecisions: alpha.languageReports.decisions.length,
      body: data.docs.find(doc => doc.id === alphaDocId).body,
      alphaContainsBeta: JSON.stringify(alpha.languageProfile).includes(betaCanary),
    }
  }, { ...ids, betaCanary: BETA_CANARY })
  assert.deepEqual({
    schemaVersion: stored.schemaVersion,
    alphaProfileProjectId: stored.alphaProfileProjectId,
    alphaGenre: stored.alphaGenre,
    betaGenre: stored.betaGenre,
    betaProfileEvents: stored.betaProfileEvents,
    correctionEvents: stored.correctionEvents,
    reportTextIds: stored.reportTextIds,
    languageDecisions: stored.languageDecisions,
    alphaContainsBeta: stored.alphaContainsBeta,
  }, {
    schemaVersion: 12,
    alphaProfileProjectId: ids.alphaId,
    alphaGenre: 'marketing',
    betaGenre: '',
    betaProfileEvents: 0,
    correctionEvents: 2,
    reportTextIds: [ids.alphaDocId, ids.alphaSecondDocId].sort(),
    languageDecisions: 3,
    alphaContainsBeta: false,
  })
  assert.match(stored.body, /wahrscheinlich/)
  assert.match(stored.body, /nämlich/)
  assert.match(stored.body, /https:\/\/example\.org\/warscheinlich/)
  assert.match(stored.body, /„nähmlich“/)
  assert.match(stored.body, /Reserve ist warscheinlich/)
  assert.match(stored.body, /Nähmlich GmbH/)
  assert.equal(stored.body.includes('Gemeinde warscheinlich'), false)

  await page.keyboard.press('Escape')
  await page.evaluate(betaDocId => window.AIWT.openDoc(betaDocId), ids.betaDocId)
  await openLanguageDossier(page)
  const betaText = await page.locator('#languageModal').textContent()
  assert.match(betaText, new RegExp(BETA_CANARY))
  assert.equal(betaText.includes('Kommunale Beschaffung'), false)
  assert.deepEqual(errors, [])
  await page.close()
}

async function runResponsiveFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await freshApp(page)
  await seedLanguageProjects(page, 'D1 Mobile')
  await openLanguageDossier(page)
  await completeProfile(page)
  const geometry = await page.locator('#languageModal').evaluate(node => {
    const rect = node.getBoundingClientRect()
    const body = node.querySelector('.onda-dialog-body')
    return {
      left: rect.left,
      right: rect.right,
      viewportWidth: innerWidth,
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
    }
  })
  assert.ok(geometry.left >= 8, JSON.stringify(geometry))
  assert.ok(geometry.right <= geometry.viewportWidth - 8, JSON.stringify(geometry))
  assert.ok(geometry.bodyScrollWidth <= geometry.bodyClientWidth + 1, JSON.stringify(geometry))
  await page.evaluate(() => { document.documentElement.style.zoom = '2' })
  await page.waitForTimeout(50)
  const zoomed = await page.locator('#languageModal').evaluate(node => {
    const body = node.querySelector('.onda-dialog-body')
    const rect = node.getBoundingClientRect()
    return {
      left: rect.left,
      right: rect.right,
      viewportWidth: innerWidth,
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
      offenders: [...body.querySelectorAll('*')]
        .filter(candidate => candidate.scrollWidth > candidate.clientWidth + 1)
        .map(candidate => ({
          className: candidate.className,
          tag: candidate.tagName,
          scrollWidth: candidate.scrollWidth,
          clientWidth: candidate.clientWidth,
          minWidth: getComputedStyle(candidate).minWidth,
          width: getComputedStyle(candidate).width,
          display: getComputedStyle(candidate).display,
          flexWrap: getComputedStyle(candidate).flexWrap,
          children: [...candidate.children].map(child => ({
            tag: child.tagName,
            className: child.className,
            scrollWidth: child.scrollWidth,
            clientWidth: child.clientWidth,
            minWidth: getComputedStyle(child).minWidth,
            width: getComputedStyle(child).width,
            flexBasis: getComputedStyle(child).flexBasis,
            rect: {
              left: child.getBoundingClientRect().left,
              right: child.getBoundingClientRect().right,
            },
          })),
        }))
        .slice(0, 10),
    }
  })
  assert.ok(zoomed.bodyScrollWidth <= zoomed.bodyClientWidth + 1, JSON.stringify(zoomed))
  assert.ok(zoomed.left >= 0, JSON.stringify(zoomed))
  assert.ok(zoomed.right <= zoomed.viewportWidth, JSON.stringify(zoomed))
  await page.evaluate(() => { document.documentElement.style.zoom = '' })
  if (process.env.AIWT_SCREENSHOTS) {
    await page.waitForTimeout(200)
    await page.screenshot({ path: '/tmp/d1-language-mobile.png', fullPage: true })
  }
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#pvCard').evaluate(node => document.activeElement === node), true)
  await page.close()
}

const browserName = process.env.AIWT_BROWSER || 'chromium'
const browserType = { chromium, firefox, webkit }[browserName]
if (!browserType) throw new TypeError(`Unsupported browser: ${browserName}`)
const browser = await browserType.launch({ headless: true })
try {
  await runLanguageFlow(browser)
  await runResponsiveFlow(browser)
  console.log(`Etappe-D1 smoke passed · ${browserName}`)
} finally {
  await browser.close()
}
