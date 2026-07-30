import assert from 'node:assert/strict'
import { chromium, firefox, webkit } from 'playwright'

const baseUrl = process.env.AIWT_URL || 'http://127.0.0.1:4173/'
const CENTRAL = 'Die Intervention senkt die Fehlerrate allgemein.'
const SUPPORT = 'In der Hauptstudie sank die Fehlerrate nach einer Sitzung.'
const COUNTER = 'Die unabhängige Replikation zeigt für denselben Endpunkt keinen belastbaren Unterschied.'
const DEFINITION = 'Fehlerrate bedeutet den Anteil falsch gelöster Aufgaben.'
const CORRECTED_WARRANT = 'Der gemessene Rückgang stützt nur die eng begrenzte Aussage für diese Stichprobe.'

async function freshApp(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
}

async function seedArgumentProjects(page, name = 'C2 Alpha') {
  return page.evaluate(({ name, central, support, counter, definition }) => {
    const alpha = window.AIWT.newProject(name)
    window.AIWT.newDoc()
    const alphaDoc = window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active)
    alpha.understanding.task = 'Eine faire, belegte Wirkungsaussage entwickeln'
    alpha.understanding.audience = ['Fachpublikum']
    alpha.understanding.desiredEffect = 'Befunde und Grenzen nachvollziehbar machen'
    alpha.evidenceBundles = [
      {
        id: 'bundle-support',
        projectId: alpha.id,
        claimText: support,
        status: 'supported',
        support: [{ sourceId: 'source-main', locatorId: 'locator-main' }],
        counterEvidence: [],
        limitations: ['Die Hauptstudie umfasst nur eine Sitzung.'],
      },
      {
        id: 'bundle-counter',
        projectId: alpha.id,
        claimText: counter,
        status: 'mixed',
        support: [],
        counterEvidence: [{ sourceId: 'source-replication', locatorId: 'locator-replication' }],
        limitations: ['Die Replikation ist klein und auf einen Hochschulkontext begrenzt.'],
      },
      {
        id: 'bundle-definition',
        projectId: alpha.id,
        claimText: definition,
        status: 'supported',
        support: [{ sourceId: 'source-method', locatorId: 'locator-method' }],
        counterEvidence: [],
        limitations: [],
      },
    ]
    window.AIWT.__blockIdentityTestBridge.setContent([
      {
        type: 'paragraph',
        attrs: { blockId: 'b-central', semanticRole: 'claim' },
        content: [{ type: 'text', text: central }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'b-support', semanticRole: 'evidence' },
        content: [{ type: 'text', text: support }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'b-counter', semanticRole: 'counterpoint' },
        content: [{ type: 'text', text: counter }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'b-definition', semanticRole: null },
        content: [{ type: 'text', text: definition }],
      },
    ])
    window.AIWT.flushSave()

    const beta = window.AIWT.newProject('C2 Beta')
    window.AIWT.newDoc()
    const betaDoc = window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active)
    beta.understanding.task = 'CANARY-BETA bleibt getrennt'
    window.AIWT.__blockIdentityTestBridge.setContent([{
      type: 'paragraph',
      attrs: { blockId: 'b-beta', semanticRole: 'claim' },
      content: [{ type: 'text', text: 'CANARY-BETA bleibt ausschließlich im zweiten Projekt.' }],
    }])
    window.AIWT.flushSave()
    window.AIWT.openDoc(alphaDoc.id)
    return { alphaId: alpha.id, alphaDocId: alphaDoc.id, betaId: beta.id, betaDocId: betaDoc.id }
  }, { name, central: CENTRAL, support: SUPPORT, counter: COUNTER, definition: DEFINITION })
}

async function openArgumentDossier(page) {
  if (!await page.locator('#pvCard').isVisible()) {
    await page.evaluate(() => window.AIWT.openDoc(window.AIWT.state.active))
  }
  await page.locator('#pvCard').click()
  await page.locator('#pvModal').waitFor({ state: 'visible' })
  await page.locator('#argumentOpen').click()
  await page.locator('#argumentModal').waitFor({ state: 'visible' })
  await page.locator('#argumentModal').evaluate(async node => {
    await Promise.all(node.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})))
  })
}

async function runArgumentFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 940 } })
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  await freshApp(page)
  const ids = await seedArgumentProjects(page)
  const beforeText = await page.evaluate(() => window.AIWT.state.editor.getHTML())
  await openArgumentDossier(page)

  const dossierText = await page.locator('#argumentModal').textContent()
  assert.match(dossierText, /Aussagen · 4/)
  assert.match(dossierText, /Beziehungen · 3/)
  assert.match(dossierText, /Stärkster fairer Einwand/)
  assert.match(dossierText, new RegExp(COUNTER))
  assert.match(dossierText, /Die Replikation ist klein/)
  assert.equal(dossierText.includes('CANARY-BETA'), false)
  assert.equal(await page.locator('.argument-path').count(), 3)
  assert.deepEqual(await page.locator('.argument-path .argument-tag').allTextContents(), [
    'Vom Beleg aus',
    'Vom stärksten Einwand aus',
    'Von der Begriffsgrenze aus',
  ])

  const supportRelation = page.locator('.argument-relation').filter({ hasText: SUPPORT }).first()
  await supportRelation.getByRole('button', { name: 'Korrigieren' }).click()
  await page.locator('.argument-relation-correction [aria-label="Schlussbrücke"]').fill(CORRECTED_WARRANT)
  await page.locator('.argument-relation-correction').getByRole('button', { name: 'Korrektur speichern' }).click()
  await page.locator('.argument-status').waitFor()
  assert.match(await page.locator('.argument-status').textContent(), /Herkunft/)
  assert.match(await page.locator('#argumentModal').textContent(), new RegExp(CORRECTED_WARRANT))
  assert.match(await page.locator('#argumentModal').textContent(), /Nutzerkorrektur aktiv/)

  await page.locator('[aria-label="Kritik oder Einwand"]').fill('Die These verallgemeinert über die untersuchte Population hinaus.')
  await page.locator('[aria-label="Autorenantwort"]').fill('Ich möchte die Aussage auf den untersuchten Kontext begrenzen.')
  await page.locator('[aria-label="Mögliche Revision"]').fill('In der untersuchten Population sank die Fehlerrate nach einer Sitzung.')
  await page.getByRole('button', { name: 'Prüfrunde dokumentieren' }).click()
  await page.locator('.argument-status').filter({ hasText: 'Text blieb unverändert' }).waitFor()
  assert.equal(await page.locator('.argument-round').count(), 1)
  assert.deepEqual(await page.locator('.argument-round-kind').allTextContents(), ['Kritik', 'Autorenantwort', 'Mögliche Revision'])
  assert.equal(await page.evaluate(() => window.AIWT.state.editor.getHTML()), beforeText)

  if (process.env.AIWT_SCREENSHOTS) {
    await page.locator('#argumentModal .onda-dialog-body').evaluate(node => { node.scrollTop = 0 })
    await page.waitForTimeout(200)
    await page.screenshot({ path: '/tmp/c2-argument-dossier.png', fullPage: true })
  }

  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#pvCard').evaluate(node => document.activeElement === node), true)
  await page.reload({ waitUntil: 'networkidle' })
  await openArgumentDossier(page)
  const persistedText = await page.locator('#argumentModal').textContent()
  assert.match(persistedText, new RegExp(CORRECTED_WARRANT))
  assert.match(persistedText, /Nutzerkorrektur aktiv/)
  assert.equal(await page.locator('.argument-round').count(), 1)
  const stored = await page.evaluate(alphaId => {
    const data = JSON.parse(localStorage.getItem('aiwt.v2'))
    const alpha = data.projects.find(project => project.id === alphaId)
    return {
      schemaVersion: data.schemaVersion,
      claims: alpha.argumentModel.claims.length,
      relations: alpha.argumentModel.relations.length,
      corrections: alpha.argumentModel.relations.reduce((sum, relation) => sum + relation.corrections.length, 0),
      deliberations: alpha.argumentModel.deliberations.length,
      textBody: data.docs.find(doc => doc.projectId === alphaId).body,
    }
  }, ids.alphaId)
  assert.deepEqual({
    schemaVersion: stored.schemaVersion,
    claims: stored.claims,
    relations: stored.relations,
    corrections: stored.corrections,
    deliberations: stored.deliberations,
  }, {
    schemaVersion: 10,
    claims: 4,
    relations: 3,
    corrections: 1,
    deliberations: 1,
  })
  assert.equal(stored.textBody, beforeText)

  await page.keyboard.press('Escape')
  await page.evaluate(betaDocId => window.AIWT.openDoc(betaDocId), ids.betaDocId)
  await openArgumentDossier(page)
  const betaText = await page.locator('#argumentModal').textContent()
  assert.match(betaText, /CANARY-BETA/)
  assert.equal(betaText.includes(CENTRAL), false)
  const isolation = await page.evaluate(({ alphaId, betaId }) => {
    const alpha = window.AIWT.state.projects.find(project => project.id === alphaId)
    const beta = window.AIWT.state.projects.find(project => project.id === betaId)
    return {
      alphaForeign: JSON.stringify(alpha.argumentModel).includes('CANARY-BETA'),
      betaForeign: JSON.stringify(beta.argumentModel).includes('Die Intervention senkt'),
    }
  }, ids)
  assert.deepEqual(isolation, { alphaForeign: false, betaForeign: false })
  assert.deepEqual(errors, [])
  await page.close()
}

async function runResponsiveFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await freshApp(page)
  await seedArgumentProjects(page, 'C2 Mobile')
  await openArgumentDossier(page)
  await page.getByText(CENTRAL, { exact: true }).first().waitFor()
  const geometry = await page.locator('#argumentModal').evaluate(node => {
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
    await page.screenshot({ path: '/tmp/c2-argument-mobile.png', fullPage: true })
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
  await runArgumentFlow(browser)
  await runResponsiveFlow(browser)
  console.log(`Etappe-C2 smoke passed · ${browserName}`)
} finally {
  await browser.close()
}
