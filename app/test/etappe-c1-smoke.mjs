import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { ensureProjectSidebarOpen } from './helpers/onda-navigation.mjs'
import { starteAppServer } from './helpers/onda-server.mjs'

const { baseUrl } = await starteAppServer()
const ORIGINAL_TASK = 'CANARY-ALPHA: Eine belastbare Analyse schreiben'
const CORRECTED_TASK = 'Eine eng begrenzte Analyse für Fachpublikum schreiben'

async function freshApp(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
}

async function seedTwoProjects(page) {
  await page.evaluate(({ originalTask }) => {
    const baseTime = Date.now() + 1000
    const alpha = window.AIWT.newProject('C1 Alpha')
    window.AIWT.newDoc()
    const docAlpha = window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active)
    alpha.understanding = {
      task: originalTask,
      audience: ['Fachpublikum'],
      desiredEffect: 'Grenzen und Befunde nachvollziehbar machen',
      evidenceStandard: 'Originalfundstellen',
      protectedIntentions: [],
      openQuestions: [],
      updatedAt: baseTime,
      geschuetzt: [],
      entwurfVersuchtAm: null,
    }
    alpha.memoryTerms = [{
      id: 'term-calm',
      term: 'Calm Technology',
      meaning: 'Technik am Rand der Aufmerksamkeit',
      updatedAt: baseTime + 1,
    }]
    alpha.sources = [{
      id: 'source-alpha',
      projectId: alpha.id,
      checksumSha256: 'alpha-checksum',
      status: 'active',
      importedAt: baseTime + 2,
      metadata: { title: { value: 'Originalstudie Alpha' } },
      locators: [],
      provenance: { actor: 'user', action: 'import' },
    }]
    docAlpha.decisions = [{
      id: 'decision-alpha',
      action: 'accepted',
      findingId: 'finding-alpha',
      resultText: 'Eigene Fassung bleibt maßgeblich.',
      at: baseTime + 3,
      provenance: { actor: 'user', action: 'accepted' },
    }]
    window.AIWT.__blockIdentityTestBridge.setContent([{
      type: 'paragraph',
      content: [{ type: 'text', text: 'Primärtext Alpha bleibt unverändert.' }],
    }])
    window.AIWT.flushSave()

    const beta = window.AIWT.newProject('C1 Beta')
    window.AIWT.newDoc()
    const docBeta = window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active)
    beta.understanding = {
      task: 'Projekt Beta bearbeiten',
      audience: ['Team Beta'],
      desiredEffect: 'Klarheit schaffen',
      evidenceStandard: '',
      protectedIntentions: [],
      openQuestions: [],
      updatedAt: baseTime + 100,
      geschuetzt: [],
      entwurfVersuchtAm: null,
    }
    beta.sources = [{
      id: 'source-beta',
      projectId: beta.id,
      checksumSha256: 'beta-checksum',
      status: 'active',
      importedAt: baseTime + 101,
      metadata: { title: { value: 'Quelle Beta' } },
      locators: [],
      provenance: { actor: 'user', action: 'import' },
    }]
    window.AIWT.__blockIdentityTestBridge.setContent([{
      type: 'paragraph',
      content: [{ type: 'text', text: 'Primärtext Beta bleibt ebenfalls unverändert.' }],
    }])
    window.AIWT.flushSave()
    window.AIWT.openDoc(docAlpha.id)
  }, { originalTask: ORIGINAL_TASK })
}

async function openMemory(page) {
  await ensureProjectSidebarOpen(page)
  await page.locator('#pvCard').click()
  await page.locator('#pvModal').waitFor({ state: 'visible' })
  await page.locator('#memoryOpen').click()
  await page.locator('#memoryModal').waitFor({ state: 'visible' })
}

async function switchToProject(page, name) {
  await page.evaluate(projectName => {
    const project = window.AIWT.state.projects.find(candidate => candidate.name === projectName)
    const doc = window.AIWT.state.docs.find(candidate => candidate.projectId === project.id && !candidate.trashed)
    window.AIWT.openDoc(doc.id)
  }, name)
}

async function proposeToBeta(page) {
  const details = page.locator('.memory-transfer-compose')
  if (!await details.getAttribute('open')) await details.locator('summary').click()
  await details.locator('[aria-label="Zielprojekt"]').selectOption({ label: 'C1 Beta' })
  await details.locator('[aria-label="Erinnerungsebene"]').selectOption('topic')
  await details.getByRole('button', { name: 'Freigabe vorschlagen' }).click()
  await page.locator('.memory-status').filter({ hasText: 'C1 Beta' }).waitFor()
}

async function runMemoryFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 920 } })
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  await freshApp(page)
  await seedTwoProjects(page)
  await openMemory(page)

  const text = await page.locator('#memoryModal').textContent()
  assert.match(text, /Ziele und Wirkung/)
  assert.match(text, /Calm Technology/)
  assert.match(text, /Originalstudie Alpha/)
  assert.match(text, /Eigene Fassung bleibt maßgeblich/)
  assert.match(text, /Ursprungsereignisse/)

  const goals = page.getByRole('heading', { name: 'Ziele und Wirkung' }).locator('..')
  await goals.locator('.memory-item').first().getByRole('button', { name: 'Korrigieren' }).click()
  await page.locator('.memory-correction-input').fill(CORRECTED_TASK)
  await page.getByRole('button', { name: 'Korrektur speichern' }).click()
  await page.locator('.memory-status').filter({ hasText: 'Korrektur gespeichert' }).waitFor()
  assert.match(await page.locator('#memoryModal').textContent(), new RegExp(CORRECTED_TASK))
  assert.match(await page.locator('#memoryModal').textContent(), /Nutzerkorrektur aktiv/)
  if (process.env.AIWT_SCREENSHOTS) {
    await page.screenshot({ path: '/tmp/c1-memory-dossier.png', fullPage: true })
  }
  assert.equal(await page.evaluate(() => (
    window.AIWT.state.projects.find(project => project.name === 'C1 Alpha').understanding.task
  )), ORIGINAL_TASK)

  const downloadPromise = page.waitForEvent('download')
  await page.locator('#memoryExport').click()
  const download = await downloadPromise
  assert.match(download.suggestedFilename(), /C1-Alpha-gedaechtnis\.json$/)
  const stream = await download.createReadStream()
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  const exported = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  assert.equal(exported.schemaVersion, 1)
  assert.deepEqual(exported.projects.map(project => project.name), ['C1 Alpha'])

  await proposeToBeta(page)
  await page.keyboard.press('Escape')
  await switchToProject(page, 'C1 Beta')
  await openMemory(page)
  const pending = page.locator('.memory-consent-card')
  assert.equal(await pending.count(), 1)
  assert.equal((await pending.textContent()).includes(ORIGINAL_TASK), false)
  assert.equal((await pending.textContent()).includes(CORRECTED_TASK), false)
  assert.match(await pending.textContent(), /sensibel/)
  const beforeConsent = await page.evaluate(() => {
    const beta = window.AIWT.state.projects.find(project => project.name === 'C1 Beta')
    return JSON.stringify({
      entries: window.AIWT.state.memoryStore.entries.filter(entry => entry.scope?.projectIds?.includes(beta.id)),
      transfers: window.AIWT.state.memoryStore.transfers.filter(transfer => transfer.toProjectId === beta.id),
    })
  })
  assert.equal(beforeConsent.includes('CANARY-ALPHA'), false)
  assert.equal(beforeConsent.includes(CORRECTED_TASK), false)
  await pending.getByRole('button', { name: 'Für dieses Projekt freigeben' }).click()
  await page.locator('.memory-status').filter({ hasText: 'nur für dieses Projekt' }).waitFor()
  assert.match(await page.locator('.memory-shared-section').textContent(), new RegExp(CORRECTED_TASK))

  await page.keyboard.press('Escape')
  await switchToProject(page, 'C1 Alpha')
  await openMemory(page)
  await proposeToBeta(page)
  await page.keyboard.press('Escape')
  await switchToProject(page, 'C1 Beta')
  await openMemory(page)
  await page.locator('.memory-consent-card').getByRole('button', { name: 'Nicht übernehmen' }).click()
  await page.locator('.memory-status').filter({ hasText: 'keine Erinnerung übernommen' }).waitFor()
  const transferState = await page.evaluate(() => ({
    approved: window.AIWT.state.memoryStore.transfers.filter(transfer => transfer.status === 'approved').length,
    rejected: window.AIWT.state.memoryStore.transfers.filter(transfer => transfer.status === 'rejected').length,
    shared: window.AIWT.state.memoryStore.entries.filter(entry => ['topic', 'personal'].includes(entry.level)).length,
  }))
  assert.deepEqual(transferState, { approved: 1, rejected: 1, shared: 1 })

  const beforeDelete = await page.evaluate(() => {
    const project = window.AIWT.state.projects.find(candidate => candidate.name === 'C1 Beta')
    const doc = window.AIWT.state.docs.find(candidate => candidate.projectId === project.id)
    return { sourceCount: project.sources.length, body: doc.body }
  })
  await page.locator('#memoryDelete').click()
  await page.locator('#memoryDeleteConfirm').click()
  await page.locator('.memory-disabled').waitFor()
  const deleted = await page.evaluate(() => {
    const project = window.AIWT.state.projects.find(candidate => candidate.name === 'C1 Beta')
    const doc = window.AIWT.state.docs.find(candidate => candidate.projectId === project.id)
    return {
      enabled: project.memory.enabled,
      eventCount: window.AIWT.state.memoryStore.events.filter(event => event.projectId === project.id).length,
      sourceCount: project.sources.length,
      body: doc.body,
    }
  })
  assert.deepEqual(deleted, {
    enabled: false,
    eventCount: 0,
    sourceCount: beforeDelete.sourceCount,
    body: beforeDelete.body,
  })

  await page.keyboard.press('Escape')
  await page.reload({ waitUntil: 'networkidle' })
  await switchToProject(page, 'C1 Beta')
  await openMemory(page)
  assert.equal(await page.locator('.memory-disabled').count(), 1)
  assert.equal(await page.locator('#memoryRebuild').count(), 1)
  const stored = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('aiwt.v2'))
    const beta = data.projects.find(project => project.name === 'C1 Beta')
    return { schemaVersion: data.schemaVersion, enabled: beta.memory.enabled }
  })
  assert.deepEqual(stored, { schemaVersion: 12, enabled: false })
  assert.deepEqual(errors, [])
  await page.close()
}

async function runResponsiveFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await freshApp(page)
  await page.evaluate(() => {
    const project = window.AIWT.newProject('C1 Mobile')
    window.AIWT.newDoc()
    project.understanding.task = 'Mobiles Dossier prüfen'
    project.understanding.audience = ['Mobile Lesende']
    project.understanding.desiredEffect = 'Ruhig lesbar bleiben'
    project.understanding.updatedAt = Date.now() + 1_000
    window.AIWT.persist()
  })
  await openMemory(page)
  await page.getByText('Mobiles Dossier prüfen', { exact: true }).waitFor()
  const geometry = await page.locator('#memoryModal').evaluate(node => {
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
  assert.ok(geometry.left >= 8)
  assert.ok(geometry.right <= geometry.viewportWidth - 8)
  assert.ok(geometry.bodyScrollWidth <= geometry.bodyClientWidth + 1)
  if (process.env.AIWT_SCREENSHOTS) {
    await page.waitForTimeout(300)
    await page.screenshot({ path: '/tmp/c1-memory-mobile.png', fullPage: true })
  }
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#pvCard').evaluate(node => document.activeElement === node), true)
  await page.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await runMemoryFlow(browser)
  await runResponsiveFlow(browser)
  console.log('Etappe-C1 smoke passed')
} finally {
  await browser.close()
}
