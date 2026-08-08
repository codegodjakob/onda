import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { openMaterialLibrary } from './helpers/onda-navigation.mjs'
import { starteAppServer } from './helpers/onda-server.mjs'

const { baseUrl } = await starteAppServer()

async function waitForLibraryReady(page) {
  await page.locator('#materialModal').waitFor({ state: 'visible' })
  await page.locator('#materialModal').evaluate(async node => {
    await Promise.all(node.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})))
  })
}

async function freshProject(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.evaluate(() => {
    window.AIWT.newProject('B1 Evidenz')
    window.AIWT.newDoc()
  })
}

async function openLibrary(page) {
  await openMaterialLibrary(page)
}

async function importSource(page, {
  type,
  title,
  reference = '',
  original,
  claim,
  limitations = 'Nur für den dokumentierten Kontext.',
  scope = 'Der dokumentierte Einzelfall.',
  uncertainty = 'Die Übertragbarkeit bleibt offen.',
  allowedStrength = 'Die Quelle dokumentiert diese Aussage, beweist aber keine allgemeine Wirkung.',
  notSupported = 'Keine Verallgemeinerung über den dokumentierten Kontext hinaus.',
}) {
  await page.locator('#sourceType').selectOption(type)
  await page.locator('#sourceTitle').fill(title)
  await page.locator('#sourceReference').fill(reference)
  await page.locator('#sourceOriginal').fill(original)
  await page.locator('#sourceClaim').fill(claim)
  await page.locator('#sourceEvidenceDetails > summary').click()
  await page.locator('#sourceLimitations').fill(limitations)
  await page.locator('#sourceScope').fill(scope)
  await page.locator('#sourceUncertainty').fill(uncertainty)
  await page.locator('#sourceAllowedStrength').fill(allowedStrength)
  await page.locator('#sourceNotSupported').fill(notSupported)
  await page.locator('#sourceImport').click()
  await page.locator('#sourceImportStatus').filter({ hasText: 'aufgenommen' }).waitFor()
}

async function runImportAndRecovery(browser) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))

  await freshProject(page)
  await openLibrary(page)
  await importSource(page, {
    type: 'text',
    title: 'Projektprotokoll',
    original: 'Originaltext bleibt prüfbar.',
    claim: 'Originaltext bleibt prüfbar.',
  })

  assert.equal(await page.locator('.source-library-item').count(), 1)
  assert.equal(await page.locator('#materialSources .onda-material-count').textContent(), '1')
  const stored = await page.evaluate(() => {
    const project = window.AIWT.state.projects.find(candidate => candidate.id === window.AIWT.state.activeProject)
    const source = project.sources[0]
    return {
      type: source.type,
      checksum: source.checksumSha256,
      original: source.original.text,
      derived: source.derived,
      titleStatus: source.metadata.title.status,
      locatorCount: source.locators.length,
      sourceId: source.id,
      locatorId: source.locators[0].id,
      bundle: project.evidenceBundles[0],
    }
  })
  assert.equal(stored.type, 'text')
  assert.match(stored.checksum, /^[a-f0-9]{64}$/)
  assert.equal(stored.original, 'Originaltext bleibt prüfbar.')
  assert.deepEqual(stored.derived, {})
  assert.equal(stored.titleStatus, 'user-provided')
  assert.equal(stored.locatorCount, 1)
  assert.equal(stored.bundle.status, 'supported')
  assert.equal(stored.bundle.claimText, 'Originaltext bleibt prüfbar.')
  assert.deepEqual(stored.bundle.limitations, ['Nur für den dokumentierten Kontext.'])

  await page.locator('.source-locator-open').click()
  assert.equal(await page.locator('#sourceReader .source-reader-claim').textContent(), 'Originaltext bleibt prüfbar.')
  assert.equal(await page.locator('#sourceReader .source-reader-excerpt').textContent(), 'Originaltext bleibt prüfbar.')
  assert.match(await page.locator('#sourceReader .source-reader-verification').textContent(), /Verifiziert/)
  assert.match(await page.locator('#sourceReader .source-reader-bundle-status').textContent(), /Belegt/)
  assert.match(await page.locator('#sourceReader').textContent(), /Die Übertragbarkeit bleibt offen/)
  assert.match(await page.locator('#sourceReader').textContent(), /Keine Verallgemeinerung/)
  await page.locator('#sourceReaderBack').click()

  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#materialModal').count(), 0)
  assert.equal(await page.locator('#materialSources').evaluate(node => document.activeElement === node), true)

  await page.reload({ waitUntil: 'networkidle' })
  await openLibrary(page)
  assert.equal(await page.locator('.source-library-item').count(), 1)
  assert.match(await page.locator('.source-library-checksum').textContent(), /^SHA-256 [a-f0-9]{12}/)
  const recovery = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('aiwt.v2'))
    const project = stored.projects.find(candidate => candidate.id === stored.activeProject)
    return {
      schemaVersion: stored.schemaVersion,
      sourceCount: project.sources.length,
      bundleCount: project.evidenceBundles.length,
      bundleStatus: project.evidenceBundles[0].status,
      sourceId: project.sources[0].id,
      locatorId: project.sources[0].locators[0].id,
      bundleSupport: project.evidenceBundles[0].support[0],
    }
  })
  assert.equal(recovery.schemaVersion, 12)
  assert.equal(recovery.sourceCount, 1)
  assert.equal(recovery.bundleCount, 1)
  assert.equal(recovery.bundleStatus, 'supported')
  assert.equal(recovery.sourceId, stored.sourceId)
  assert.equal(recovery.locatorId, stored.locatorId)
  assert.deepEqual(recovery.bundleSupport, {
    sourceId: stored.sourceId,
    locatorId: stored.locatorId,
    relation: 'supports',
    usable: true,
  })
  assert.deepEqual(errors, [])
  await page.close()
}

async function runLocatorFamiliesAndRetraction(browser) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
  await freshProject(page)
  await openLibrary(page)

  await importSource(page, {
    type: 'pdf',
    title: 'Studie als PDF',
    reference: 'project://b1/studie.pdf',
    original: 'Die Stichprobe umfasst 84 Personen.',
    claim: 'Die Stichprobe umfasst 84 Personen.',
  })
  await importSource(page, {
    type: 'web',
    title: 'Ergebnisabschnitt',
    reference: 'https://example.org/report',
    original: 'Die Fehlerrate sank um zwölf Prozent.',
    claim: 'Die Fehlerrate sank um zwölf Prozent.',
  })
  await importSource(page, {
    type: 'audio',
    title: 'Interview',
    reference: 'project://b1/interview.wav',
    original: 'Aufmerksamkeit ist eine gestaltete Bedingung.',
    claim: 'Aufmerksamkeit ist eine gestaltete Bedingung.',
  })

  const kinds = await page.locator('.source-locator-open').evaluateAll(buttons => buttons.map(button => button.dataset.locatorKind))
  assert.deepEqual(kinds.sort(), ['page', 'section', 'time'])

  for (const kind of ['page', 'section', 'time']) {
    await page.locator(`.source-locator-open[data-locator-kind="${kind}"]`).click()
    assert.equal(await page.locator('#sourceReader').getAttribute('data-locator-kind'), kind)
    assert.match(await page.locator('.source-reader-verification').textContent(), /Verifiziert/)
    await page.locator('#sourceReaderBack').click()
  }

  await page.locator('.source-library-item').first().locator('.source-retract').click()
  assert.match(await page.locator('.source-library-item').first().locator('.source-library-status').textContent(), /Zurückgezogen/)
  await page.locator('.source-library-item').first().locator('.source-locator-open').click()
  assert.match(await page.locator('.source-reader-verification').textContent(), /Nicht belastbar/)
  assert.match(await page.locator('.source-reader-warning').textContent(), /zurückgezogen/)

  const state = await page.evaluate(() => {
    const project = window.AIWT.state.projects.find(candidate => candidate.id === window.AIWT.state.activeProject)
    return {
      status: project.sources[0].status,
      history: project.sources[0].history,
      otherStatuses: project.sources.slice(1).map(source => source.status),
      bundleStatuses: project.evidenceBundles.map(bundle => bundle.status),
    }
  })
  assert.equal(state.status, 'retracted')
  assert.equal(state.history.length, 1)
  assert.deepEqual(state.otherStatuses, ['active', 'active'])
  assert.equal(state.bundleStatuses[0], 'review-required')
  await page.close()
}

async function runResponsiveKeyboardFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await freshProject(page)
  await openLibrary(page)
  await importSource(page, {
    type: 'text',
    title: 'Tastaturquelle',
    original: 'Diese Fundstelle bleibt auch im schmalen Fenster lesbar.',
    claim: 'Diese Fundstelle bleibt im schmalen Fenster lesbar.',
  })
  const geometry = await page.locator('#materialModal').evaluate(node => {
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

  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#materialSources').evaluate(node => document.activeElement === node), true)
  await page.keyboard.press('Enter')
  await waitForLibraryReady(page)
  const locatorButton = page.locator('.source-locator-open')
  await locatorButton.focus()
  await page.keyboard.press('Enter')
  await page.locator('#sourceReader').waitFor({ state: 'visible' })
  await page.waitForFunction(() => document.activeElement?.id === 'sourceReaderBack')
  assert.equal(await page.locator('#sourceReaderBack').evaluate(node => document.activeElement === node), true)
  assert.match(await page.locator('.source-reader-verification').textContent(), /Verifiziert/)
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#materialModal').count(), 0)
  assert.equal(await page.locator('#materialSources').evaluate(node => document.activeElement === node), true)
  await page.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await runImportAndRecovery(browser)
  await runLocatorFamiliesAndRetraction(browser)
  await runResponsiveKeyboardFlow(browser)
  console.log('Etappe-B1 smoke passed')
} finally {
  await browser.close()
}
