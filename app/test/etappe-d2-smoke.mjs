import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium, firefox, webkit } from 'playwright'

const baseUrl = process.env.AIWT_URL || 'http://127.0.0.1:4173/'

async function freshApp(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
}

async function seedD2Project(page) {
  return page.evaluate(() => {
    const project = window.AIWT.newProject('D2 Abschluss')
    window.AIWT.newDoc()
    const doc = window.AIWT.state.docs.find(item => item.id === window.AIWT.state.active)
    project.understanding.task = 'Einen wissenschaftlich prüfbaren Text abschließen'
    project.understanding.audience = ['Fachpublikum']
    project.understanding.desiredEffect = 'Befunde und Grenzen nachvollziehbar machen'
    project.languageProfile.genre = 'scientific'
    project.languageProfile.citationStyle = 'APA'
    project.citations = [{
      id: 'cite-a',
      projectId: project.id,
      textId: doc.id,
      key: 'meyer2024',
      label: 'Meyer 2024',
      locator: { page: '17', blockId: 'b-body' },
    }]
    project.bibliography = [{
      key: 'meyer2024',
      textId: doc.id,
      label: 'Meyer 2024',
      title: 'Geprüfte Wirkung',
      authors: ['Meyer, Ada'],
      year: '2024',
      style: 'APA',
    }]
    project.argumentModel.claims = [{
      id: 'claim-a',
      projectId: project.id,
      textId: doc.id,
      blockId: 'b-body',
      centrality: 'central',
      evidenceStatus: 'supported',
      text: 'Die Wirkung ist begrenzt belegt.',
    }]
    doc.footnotes = [{ id: 'fn-a', label: 'A', content: 'Fußnote A dokumentiert die Einschränkung.' }]
    doc.findings = [
      {
        id: 'fact-critical',
        category: 'fact',
        status: 'open',
        priority: 'critical',
        short: 'Zahl noch am Original prüfen',
        target: 'Die Wirkung ist begrenzt belegt.',
        action: 'Die Wirkung ist in dieser Stichprobe begrenzt belegt.',
        provenance: { actor: 'agent', action: 'hinweise' },
        createdAt: 1,
      },
      {
        id: 'logic-root',
        category: 'logic',
        status: 'open',
        priority: 'high',
        short: 'Schluss enger führen',
        target: 'Deshalb gilt der Befund.',
        provenance: { actor: 'agent', action: 'hinweise' },
        createdAt: 2,
      },
      {
        id: 'source-parked',
        category: 'source',
        status: 'open',
        priority: 'critical',
        rootCauseId: 'logic-root',
        short: 'Beleg nach Grundklärung prüfen',
        target: 'Beleg',
        provenance: { actor: 'agent', action: 'hinweise' },
        createdAt: 3,
      },
      {
        id: 'citation-risk',
        category: 'citation',
        status: 'risk-accepted',
        priority: 'critical',
        short: 'Abweichende Ausgabe bewusst akzeptiert',
        target: 'Meyer 2024',
        provenance: { actor: 'agent', action: 'hinweise' },
        createdAt: 4,
      },
      {
        id: 'style-resolved',
        category: 'wording',
        status: 'resolved',
        priority: 'normal',
        short: 'Formulierung geklärt',
        target: 'klar',
        provenance: { actor: 'agent', action: 'hinweise' },
        createdAt: 5,
      },
      {
        id: 'content-dismissed',
        category: 'content',
        status: 'dismissed',
        priority: 'normal',
        short: 'Ergänzung nicht übernommen',
        target: 'Zusatz',
        provenance: { actor: 'agent', action: 'hinweise' },
        createdAt: 6,
      },
      {
        id: 'style-superseded',
        category: 'wording',
        status: 'superseded',
        priority: 'low',
        short: 'Durch neueren Hinweis ersetzt',
        target: 'alt',
        provenance: { actor: 'agent', action: 'hinweise' },
        createdAt: 7,
      },
    ]
    doc.decisions = [{
      id: 'decision-risk',
      findingId: 'citation-risk',
      kind: 'reject',
      outcome: 'risk-accepted',
      appliedText: '',
      resultingText: 'Meyer 2024',
      at: 8,
    }]
    window.AIWT.__blockIdentityTestBridge.setContent([
      {
        type: 'heading',
        attrs: { level: 2, blockId: 'b-heading', semanticRole: null },
        content: [{ type: 'text', text: 'Überschrift' }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'b-body', semanticRole: 'claim' },
        content: [
          { type: 'text', text: 'Die Wirkung ist ' },
          {
            type: 'text',
            text: 'begrenzt belegt',
            marks: [{ type: 'link', attrs: { href: 'https://example.org/source' } }],
          },
          { type: 'text', text: '.' },
        ],
      },
      {
        type: 'bulletList',
        attrs: { blockId: 'b-list', semanticRole: null },
        content: [{
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Listenpunkt' }] }],
        }],
      },
      {
        type: 'blockquote',
        attrs: { blockId: 'b-quote', semanticRole: null },
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Originalzitat' }] }],
      },
    ])
    const title = document.getElementById('title')
    title.value = 'D2 Prüfung'
    title.dispatchEvent(new Event('input', { bubbles: true }))
    window.AIWT.flushSave()
    return { projectId: project.id, textId: doc.id }
  })
}

async function openAudit(page) {
  await page.locator('#pvCard').click()
  await page.locator('#pvModal').waitFor({ state: 'visible' })
  await page.getByRole('button', { name: 'Schlussaudit und Export öffnen' }).click()
  await page.locator('#auditModal').waitFor({ state: 'visible' })
}

async function runCoreFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await freshApp(page)
  const ids = await seedD2Project(page)
  await page.keyboard.press('Control+e')
  await page.locator('#auditModal').waitFor({ state: 'visible' })
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#auditModal').count(), 0)
  await openAudit(page)

  assert.deepEqual(
    await page.locator('.audit-group-title').allTextContents(),
    ['Integrität', 'Belege', 'Zitation', 'Angenommene Risiken', 'Weitere Hinweise', 'Stil'],
  )
  assert.match(await page.locator('.audit-status').textContent(), /nicht freigabereif/i)
  assert.match(await page.locator('#auditModal').textContent(), /Nutzer/)
  const riskExport = page.getByRole('button', { name: 'Trotz Risiko exportieren' })
  assert.equal(await riskExport.isDisabled(), true)
  await page.getByRole('checkbox', { name: /Risiko verstanden/ }).check()
  assert.equal(await riskExport.isEnabled(), true)

  await page.locator('#publicationFormat').selectOption('markdown')
  const downloadPromise = page.waitForEvent('download')
  await riskExport.click()
  const download = await downloadPromise
  const markdown = await readFile(await download.path(), 'utf8')
  assert.match(markdown, /^# D2 Prüfung/m)
  assert.match(markdown, /## Überschrift/)
  assert.match(markdown, /Listenpunkt/)
  assert.match(markdown, /> Originalzitat/)
  assert.match(markdown, /Fußnote A/)
  assert.match(markdown, /Meyer 2024/)
  assert.doesNotMatch(markdown, /Auditblocker|audit-dialog|finding/)
  assert.doesNotMatch(markdown, /Erklärung zur KI-Nutzung/)

  await page.getByRole('checkbox', { name: 'Belegbare KI-Nutzungserklärung aufnehmen' }).check()
  await page.locator('#publicationFormat').selectOption('jats')
  const jatsDownloadPromise = page.waitForEvent('download')
  await riskExport.click()
  const jatsDownload = await jatsDownloadPromise
  const jats = await readFile(await jatsDownload.path(), 'utf8')
  assert.match(jats, /<article[^>]*article-type="research-article"/)
  assert.match(jats, /<sec sec-type="ai-usage">/)
  assert.match(jats, /Textanalyse und Hinweise wurden bereitgestellt/)
  assert.equal(await page.evaluate(xml => (
    new DOMParser().parseFromString(xml, 'application/xml').querySelector('parsererror') === null
  ), jats), true)

  const persisted = await page.evaluate(({ projectId, textId }) => {
    const project = window.AIWT.state.projects.find(item => item.id === projectId)
    return {
      status: project.finalAudits.byText[textId].status,
      history: project.finalAudits.history.length,
    }
  }, ids)
  assert.deepEqual(persisted, { status: 'blocked', history: 1 })

  const beforeInvalidImport = await page.evaluate(() => localStorage.getItem('aiwt.v2'))
  await page.getByLabel('Vollständiges lokales Datenpaket auswählen').setInputFiles({
    name: 'ungueltig.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"kind":"foreign"}'),
  })
  await page.locator('.audit-action-status').filter({ hasText: 'Datenpaket nicht übernommen' }).waitFor()
  assert.equal(await page.evaluate(() => localStorage.getItem('aiwt.v2')), beforeInvalidImport)

  const dataDownloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Gesamtdaten sichern' }).click()
  const dataDownload = await dataDownloadPromise
  const payload = JSON.parse(await readFile(await dataDownload.path(), 'utf8'))
  assert.equal(payload.kind, 'ai-writing-tool-complete-export')
  assert.equal(payload.appStateSchemaVersion, 12)
  assert.equal(JSON.stringify(payload).includes('aiwt.apikey'), false)
  assert.equal(await page.getByRole('button', { name: 'Lokale Daten löschen' }).isEnabled(), true)
  await page.getByRole('button', { name: 'Lokale Daten löschen' }).click()
  assert.equal(await page.getByRole('button', { name: 'Endgültig lokal löschen' }).isDisabled(), true)
  await page.getByRole('button', { name: 'Abbrechen' }).click()

  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#auditModal').count(), 0)
  assert.equal(await page.locator('#pvCard').evaluate(node => document.activeElement === node), true)
  assert.deepEqual(errors, [])
  await page.close()
}

async function runResponsiveFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await freshApp(page)
  await seedD2Project(page)
  await openAudit(page)
  const layout = await page.locator('#auditModal').evaluate(modal => {
    const targets = [...modal.querySelectorAll(
      'button, select, input[type="text"], label.audit-check-row, label.audit-import-label, summary',
    )].filter(node => (
      node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0
    )).map(node => ({
      target: node.getAttribute('aria-label') || node.textContent.trim() || node.tagName,
      width: node.getBoundingClientRect().width,
      height: node.getBoundingClientRect().height,
    }))
    return {
      modalWidth: modal.getBoundingClientRect().width,
      viewportWidth: document.documentElement.clientWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      minTarget: Math.min(...targets.map(node => Math.min(node.width, node.height))),
      targets,
    }
  })
  assert.equal(layout.overflow <= 1, true, JSON.stringify(layout))
  assert.equal(layout.modalWidth <= layout.viewportWidth, true, JSON.stringify(layout))
  assert.equal(layout.minTarget >= 43.5, true, JSON.stringify(layout))
  await page.close()
}

async function runKeyboardAndZoomFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await freshApp(page)
  await seedD2Project(page)
  await page.keyboard.press('Control+e')
  await page.locator('#auditModal').waitFor({ state: 'visible' })
  assert.equal(await page.getByRole('button', { name: 'Schließen', exact: true }).evaluate(node => (
    document.activeElement === node
  )), true)
  await page.keyboard.press('Tab')
  assert.equal(await page.getByText('Privater Autorschaftsnachweis', { exact: true }).evaluate(node => (
    document.activeElement === node
  )), true)
  const focusVisible = await page.evaluate(() => {
    const active = document.activeElement
    const style = getComputedStyle(active)
    return style.outlineStyle !== 'none' || style.boxShadow !== 'none'
  })
  assert.equal(focusVisible, true)
  await page.evaluate(() => { document.documentElement.style.zoom = '2' })
  const zoomLayout = await page.locator('#auditModal').evaluate(modal => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    modalRight: modal.getBoundingClientRect().right,
    viewportWidth: document.documentElement.clientWidth,
  }))
  assert.equal(zoomLayout.overflow <= 1, true, JSON.stringify(zoomLayout))
  assert.equal(zoomLayout.modalRight <= zoomLayout.viewportWidth + 1, true, JSON.stringify(zoomLayout))
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#pvCard').evaluate(node => document.activeElement === node), true)
  await page.close()
}

async function runDeletionFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 800 } })
  await freshApp(page)
  await seedD2Project(page)
  await page.evaluate(() => localStorage.setItem('aiwt.apikey', 'CANARY-SECRET-D2'))
  await openAudit(page)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Gesamtdaten sichern' }).click()
  await downloadPromise
  await page.getByRole('button', { name: 'Lokale Daten löschen' }).click()
  await page.locator('#deleteAllConfirmation').fill('LÖSCHEN')
  const reloadPromise = page.waitForEvent('load')
  await page.getByRole('button', { name: 'Endgültig lokal löschen' }).click()
  await reloadPromise
  const cleared = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('aiwt.v2'))
    return {
      apiKey: localStorage.getItem('aiwt.apikey'),
      schemaVersion: stored.schemaVersion,
      projects: stored.projects.length,
      docs: stored.docs.length,
      containsCanary: JSON.stringify(stored).includes('D2 Abschluss'),
    }
  })
  assert.deepEqual(cleared, {
    apiKey: null,
    schemaVersion: 12,
    projects: 0,
    docs: 0,
    containsCanary: false,
  })
  await page.close()
}

const browsers = { chromium, firefox, webkit }
const selected = process.env.AIWT_BROWSER
  ? [[process.env.AIWT_BROWSER, browsers[process.env.AIWT_BROWSER]]]
  : Object.entries(browsers)

for (const [name, launcher] of selected) {
  if (!launcher) throw new Error(`Unbekannter Browser: ${name}`)
  const browser = await launcher.launch({ headless: true })
  try {
    await runCoreFlow(browser)
    await runResponsiveFlow(browser)
    await runKeyboardAndZoomFlow(browser)
    await runDeletionFlow(browser)
    console.log(`Etappe D2 smoke (${name}): PASS`)
  } finally {
    await browser.close()
  }
}
