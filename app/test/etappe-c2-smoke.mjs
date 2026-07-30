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
    const source = ({ id, title, locatorId, excerpt, checksum }) => ({
      id,
      projectId: alpha.id,
      type: 'web',
      origin: {
        kind: 'url',
        immutableRef: `https://example.org/${id}`,
        originalUrl: `https://example.org/${id}`,
      },
      original: {
        mediaType: 'text/html',
        sections: [{ id: 'results', heading: 'Ergebnisse', text: excerpt }],
      },
      checksumSha256: checksum.repeat(64),
      importedAt: 1,
      provenance: { actor: 'user', action: 'import' },
      metadata: { title: { value: title, status: 'confirmed' } },
      derived: {},
      status: 'active',
      locators: [{
        id: locatorId,
        projectId: alpha.id,
        sourceId: id,
        claimId: `source-claim:${id}`,
        claimText: excerpt,
        kind: 'section',
        address: { sectionId: 'results' },
        excerpt,
        excerptChecksum: checksum.repeat(64),
        provenance: { actor: 'user', action: 'locator-create' },
        verification: { status: 'verified', reason: null },
      }],
      history: [],
    })
    const alpha = window.AIWT.newProject(name)
    window.AIWT.newDoc()
    const alphaDoc = window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active)
    alpha.understanding.task = 'Eine faire, belegte Wirkungsaussage entwickeln'
    alpha.understanding.audience = ['Fachpublikum']
    alpha.understanding.desiredEffect = 'Befunde und Grenzen nachvollziehbar machen'
    alpha.sources = [
      source({
        id: 'source-main',
        title: 'Hauptstudie',
        locatorId: 'locator-main',
        excerpt: support,
        checksum: 'a',
      }),
      source({
        id: 'source-replication',
        title: 'Unabhängige Replikation',
        locatorId: 'locator-replication',
        excerpt: counter,
        checksum: 'b',
      }),
      source({
        id: 'source-method',
        title: 'Methodendefinition',
        locatorId: 'locator-method',
        excerpt: definition,
        checksum: 'c',
      }),
    ]
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

    window.AIWT.newDoc()
    const alphaSecondDoc = window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active)
    window.AIWT.__blockIdentityTestBridge.setContent([{
      type: 'paragraph',
      attrs: { blockId: 'b-alpha-second', semanticRole: 'claim' },
      content: [{ type: 'text', text: 'CANARY-ALPHA-ZWEITTEXT bleibt nur im zweiten Text.' }],
    }])
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
    return {
      alphaId: alpha.id,
      alphaDocId: alphaDoc.id,
      alphaSecondDocId: alphaSecondDoc.id,
      betaId: beta.id,
      betaDocId: betaDoc.id,
    }
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

  await page.evaluate(docId => window.AIWT.openDoc(docId), ids.alphaSecondDocId)
  await openArgumentDossier(page)
  const secondDocumentText = await page.locator('#argumentModal').textContent()
  assert.match(secondDocumentText, /CANARY-ALPHA-ZWEITTEXT/)
  assert.equal(secondDocumentText.includes(CENTRAL), false)
  await page.keyboard.press('Escape')

  await page.evaluate(docId => window.AIWT.openDoc(docId), ids.alphaDocId)
  const beforeText = await page.evaluate(() => window.AIWT.state.editor.getHTML())
  await openArgumentDossier(page)

  const dossierText = await page.locator('#argumentModal').textContent()
  assert.match(dossierText, /Aussagen · 4/)
  assert.match(dossierText, /Beziehungen · 2/)
  assert.match(dossierText, /Stärkster fairer Einwand/)
  assert.match(dossierText, new RegExp(COUNTER))
  assert.match(dossierText, /Die Replikation ist klein/)
  assert.equal(dossierText.includes('CANARY-BETA'), false)
  assert.equal(dossierText.includes('CANARY-ALPHA-ZWEITTEXT'), false)
  assert.equal(await page.locator('.argument-path').count(), 2)
  assert.deepEqual(await page.locator('.argument-path .argument-tag').allTextContents(), [
    'Vom Beleg aus',
    'Vom stärksten Einwand aus',
  ])
  const accessibility = await page.locator('#argumentModal').evaluate(modal => {
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
    const essentialText = [...modal.querySelectorAll('.argument-origin, .argument-kicker')].map(node => {
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
  const relationComposer = page.locator('.argument-compose')
  await relationComposer.locator('summary').focus()
  await page.keyboard.press('Enter')
  assert.equal(await relationComposer.evaluate(node => node.open), true)
  await page.keyboard.press('Enter')
  assert.equal(await relationComposer.evaluate(node => node.open), false)

  const centralClaim = page.locator('.argument-claim').filter({ hasText: CENTRAL }).first()
  await centralClaim.getByRole('button', { name: 'Aussage einordnen' }).click()
  await page.locator('.argument-claim-correction [aria-label="Aussageart"]').selectOption('inference')
  await page.locator('.argument-claim-correction [aria-label="Gültigkeit"]').selectOption('qualified')
  await page.locator('.argument-claim-correction').getByRole('button', { name: 'Claim-Korrektur speichern' }).click()
  await page.locator('.argument-status').filter({ hasText: 'Aussage korrigiert' }).waitFor()
  await page.waitForFunction(() => document.activeElement?.classList.contains('argument-status'))
  assert.equal(await page.locator('.argument-status').evaluate(node => document.activeElement === node), true)
  assert.match(await page.locator('#argumentModal').textContent(), /Nutzerkorrektur aktiv/)

  const supportRelation = page.locator('.argument-relation').filter({ hasText: SUPPORT }).first()
  await supportRelation.getByRole('button', { name: 'Korrigieren' }).click()
  await page.locator('.argument-relation-correction [aria-label="Schlussbrücke"]').fill(CORRECTED_WARRANT)
  await page.locator('.argument-relation-correction').getByRole('button', { name: 'Korrektur speichern' }).click()
  await page.locator('.argument-status').waitFor()
  assert.match(await page.locator('.argument-status').textContent(), /Herkunft/)
  assert.match(await page.locator('#argumentModal').textContent(), new RegExp(CORRECTED_WARRANT))
  assert.match(await page.locator('#argumentModal').textContent(), /Nutzerkorrektur aktiv/)
  await page.waitForFunction(() => document.activeElement?.classList.contains('argument-status'))
  assert.equal(await page.locator('.argument-status').evaluate(node => document.activeElement === node), true)

  const openFinding = page.locator('.argument-finding.is-open').first()
  await openFinding.getByRole('button', { name: 'Als geklärt markieren' }).click()
  await page.locator('[aria-label="Klärung dokumentieren"]').fill('Die Beleggrenze wurde bewusst geprüft und im Audit festgehalten.')
  await page.getByRole('button', { name: 'Als geklärt speichern' }).click()
  await page.locator('.argument-status').filter({ hasText: 'Befund als geklärt' }).waitFor()
  await page.waitForFunction(() => document.activeElement?.classList.contains('argument-status'))
  assert.equal(await page.locator('.argument-status').evaluate(node => document.activeElement === node), true)
  assert.match(await page.locator('#argumentModal').textContent(), /Strukturprüfung · 0/)

  await page.locator('[aria-label="Kritik oder Einwand"]').fill('Die These verallgemeinert über die untersuchte Population hinaus.')
  await page.locator('[aria-label="Autorenantwort"]').fill('Ich möchte die Aussage auf den untersuchten Kontext begrenzen.')
  await page.locator('[aria-label="Mögliche Revision"]').fill('In der untersuchten Population sank die Fehlerrate nach einer Sitzung.')
  await page.getByRole('button', { name: 'Prüfrunde dokumentieren' }).click()
  await page.locator('.argument-status').filter({ hasText: 'Text blieb unverändert' }).waitFor()
  assert.equal(await page.locator('.argument-round').count(), 1)
  assert.deepEqual(await page.locator('.argument-round-kind').allTextContents(), ['Kritik', 'Autorenantwort', 'Mögliche Revision'])
  assert.ok(await page.locator('.argument-audit-details').count() >= 2)
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
  const stored = await page.evaluate(({ alphaId, alphaDocId }) => {
    const data = JSON.parse(localStorage.getItem('aiwt.v2'))
    const alpha = data.projects.find(project => project.id === alphaId)
    return {
      schemaVersion: data.schemaVersion,
      claims: alpha.argumentModel.claims.length,
      relations: alpha.argumentModel.relations.length,
      claimCorrections: alpha.argumentModel.claims.reduce((sum, claim) => sum + claim.corrections.length, 0),
      relationCorrections: alpha.argumentModel.relations.reduce((sum, relation) => sum + relation.corrections.length, 0),
      deliberations: alpha.argumentModel.deliberations.length,
      resolvedFindings: alpha.argumentModel.findings.filter(finding => finding.status === 'resolved').length,
      textBody: data.docs.find(doc => doc.id === alphaDocId).body,
    }
  }, { alphaId: ids.alphaId, alphaDocId: ids.alphaDocId })
  assert.deepEqual({
    schemaVersion: stored.schemaVersion,
    claims: stored.claims,
    relations: stored.relations,
    claimCorrections: stored.claimCorrections,
    relationCorrections: stored.relationCorrections,
    deliberations: stored.deliberations,
    resolvedFindings: stored.resolvedFindings,
  }, {
    schemaVersion: 12,
    claims: 5,
    relations: 2,
    claimCorrections: 1,
    relationCorrections: 1,
    deliberations: 1,
    resolvedFindings: 1,
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

  await page.keyboard.press('Escape')
  await page.evaluate(docId => window.AIWT.openDoc(docId), ids.alphaDocId)
  await page.locator('#materialSources').click()
  await page.locator('#materialModal').waitFor({ state: 'visible' })
  const replicationSource = page.locator('.source-library-item').filter({ hasText: 'Unabhängige Replikation' })
  await replicationSource.getByRole('button', { name: 'Als zurückgezogen markieren' }).click()
  await page.locator('#materialModal .source-library-status.is-retracted').waitFor({ state: 'visible' })
  await page.locator('#materialModal').getByRole('button', { name: 'Schließen' }).click()
  await openArgumentDossier(page)
  const retractedText = await page.locator('#argumentModal').textContent()
  assert.match(retractedText, /Kein direkt belegtes Gegenargument/)
  const retractionState = await page.evaluate(({ alphaId, counter }) => {
    const alpha = window.AIWT.state.projects.find(project => project.id === alphaId)
    const counterClaim = alpha.argumentModel.claims.find(claim => claim.text === counter)
    const centralClaim = alpha.argumentModel.claims.find(claim => claim.text === 'Die Intervention senkt die Fehlerrate allgemein.')
    const counterRelation = alpha.argumentModel.relations.find(relation => (
      relation.type === 'counters' && relation.fromClaimId === counterClaim.id
    ))
    return {
      sourceStatus: alpha.sources.find(source => source.id === 'source-replication').status,
      evidenceStatus: counterClaim.evidenceStatus,
      counterReviewReason: counterClaim.review?.reason || null,
      centralReviewReason: centralClaim.review?.reason || null,
      counterRelationReview: counterRelation.review || null,
      impactEvents: alpha.argumentModel.events.filter(event => (
        event.kind === 'impact-analyzed'
        && event.entityId === 'source-replication'
      )).length,
    }
  }, { alphaId: ids.alphaId, counter: COUNTER })
  assert.equal(retractionState.sourceStatus, 'retracted')
  assert.equal(retractionState.evidenceStatus, 'review-required')
  assert.match(retractionState.counterReviewReason, /zurückgezogen/)
  assert.equal(retractionState.centralReviewReason?.includes('Quelle'), false)
  assert.equal(retractionState.counterRelationReview, null)
  assert.equal(retractionState.impactEvents, 1)
  assert.equal(await page.evaluate(() => window.AIWT.state.editor.getHTML()), beforeText)

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
  await page.evaluate(() => { document.documentElement.style.zoom = '2' })
  await page.waitForTimeout(50)
  const zoomedGeometry = await page.locator('#argumentModal').evaluate(node => {
    const body = node.querySelector('.onda-dialog-body')
    return {
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
      viewportWidth: innerWidth,
      rect: node.getBoundingClientRect().toJSON(),
      offenders: [...body.querySelectorAll('*')]
        .filter(candidate => candidate.scrollWidth > candidate.clientWidth + 1)
        .map(candidate => ({
          className: candidate.className,
          tag: candidate.tagName,
          scrollWidth: candidate.scrollWidth,
          clientWidth: candidate.clientWidth,
        }))
        .slice(0, 10),
    }
  })
  assert.ok(
    zoomedGeometry.bodyScrollWidth <= zoomedGeometry.bodyClientWidth + 1,
    JSON.stringify(zoomedGeometry),
  )
  assert.ok(zoomedGeometry.rect.left >= 0, JSON.stringify(zoomedGeometry))
  assert.ok(zoomedGeometry.rect.right <= zoomedGeometry.viewportWidth, JSON.stringify(zoomedGeometry))
  await page.evaluate(() => { document.documentElement.style.zoom = '' })
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
