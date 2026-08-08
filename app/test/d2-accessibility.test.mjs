import assert from 'node:assert/strict'
import AxeBuilder from '@axe-core/playwright'
import { chromium } from 'playwright'
import { starteAppServer } from './helpers/onda-server.mjs'

const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

const { baseUrl, stop: serverStoppen } = await starteAppServer()

async function assertAxe(page, state) {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations({ subtree: true }).map(animation => (
      animation.finished.catch(() => {})
    )))
  })
  const results = await new AxeBuilder({ page }).withTags(tags).analyze()
  assert.deepEqual(
    results.violations.map(item => ({
      id: item.id,
      impact: item.impact,
      targets: item.nodes.map(node => node.target),
    })),
    [],
    `${state}: ${JSON.stringify(results.violations, null, 2)}`,
  )
}

// 'networkidle' heisst „das Netz ist ruhig", nicht „die App ist bereit": Das Buendel ist
// dann geladen, aber noch nicht unbedingt ausgefuehrt, und window.AIWT existiert erst
// danach. Unter Last (paralleler Eval-Lauf) reisst diese Luecke auf, und der naechste
// Zugriff scheitert mit „Cannot read properties of undefined (reading 'newProject')" --
// ein Fehler, der wie ein Befund aussieht und keiner ist.
async function warteAufApp(page) {
  await page.waitForFunction(() => Boolean(window.AIWT?.newProject), null, { timeout: 15000 })
}

async function freshApp(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await warteAufApp(page)
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await warteAufApp(page)
}

async function seedAccessibleProject(page) {
  return page.evaluate(() => {
    const project = window.AIWT.newProject('A11y Prüfung')
    window.AIWT.newDoc()
    const doc = window.AIWT.state.docs.find(item => item.id === window.AIWT.state.active)
    project.understanding.task = 'Barrierefreien Abschluss prüfen'
    project.understanding.audience = ['Fachpublikum']
    project.understanding.desiredEffect = 'Befunde nachvollziehen'
    project.languageProfile.genre = 'scientific'
    project.sources = [{
      id: 'source-a11y',
      projectId: project.id,
      type: 'web',
      origin: {
        kind: 'url',
        immutableRef: 'https://example.org/a11y',
        originalUrl: 'https://example.org/a11y',
      },
      original: {
        mediaType: 'text/html',
        sections: [{ id: 'results', heading: 'Ergebnisse', text: 'Der gespeicherte Befund.' }],
      },
      checksumSha256: 'a'.repeat(64),
      importedAt: 1,
      provenance: { actor: 'user', action: 'import' },
      metadata: { title: { value: 'A11y Quelle', status: 'confirmed' } },
      derived: {},
      status: 'active',
      locators: [{
        id: 'locator-a11y',
        projectId: project.id,
        sourceId: 'source-a11y',
        claimId: 'claim-a11y',
        claimText: 'Der Befund ist dokumentiert.',
        kind: 'section',
        address: { sectionId: 'results' },
        excerpt: 'Der gespeicherte Befund.',
        excerptChecksum: 'b'.repeat(64),
        provenance: { actor: 'user', action: 'locator-create' },
        verification: { status: 'unverified', reason: 'Prüfzustand' },
      }],
      history: [],
    }]
    project.evidenceBundles = [{
      id: 'bundle-a11y',
      projectId: project.id,
      claimId: 'claim-a11y',
      claimText: 'Der Befund ist dokumentiert.',
      support: [{ sourceId: 'source-a11y', locatorId: 'locator-a11y', usable: false }],
      counterEvidence: [],
      limitations: ['Kleine Stichprobe'],
      methodologicalDifferences: [],
      scope: 'Prüfkontext',
      uncertainty: 'hoch',
      allowedStrength: 'descriptive',
      notSupported: ['Universelle Aussage'],
      qualityAssessments: [],
      status: 'review-required',
      provenance: { actor: 'user', action: 'evidence-assemble' },
    }]
    project.argumentModel.claims = [{
      id: 'claim-a11y',
      projectId: project.id,
      textId: doc.id,
      blockId: 'b-a11y',
      centrality: 'central',
      evidenceStatus: 'review-required',
      text: 'Der Befund ist dokumentiert.',
    }]
    doc.findings = [{
      id: 'finding-a11y',
      category: 'source',
      status: 'open',
      priority: 'critical',
      short: 'Beleg am Original prüfen',
      target: 'Der Befund ist dokumentiert.',
      provenance: { actor: 'agent', action: 'hinweise' },
      createdAt: 1,
    }]
    window.AIWT.__blockIdentityTestBridge.setContent([
      {
        type: 'heading',
        attrs: { level: 2, blockId: 'b-heading', semanticRole: null },
        content: [{ type: 'text', text: 'Prüfüberschrift' }],
      },
      {
        type: 'paragraph',
        attrs: { blockId: 'b-a11y', semanticRole: 'claim' },
        content: [{ type: 'text', text: 'Der Befund ist dokumentiert.' }],
      },
    ])
    const title = document.getElementById('title')
    title.value = 'A11y Text'
    title.dispatchEvent(new Event('input', { bubbles: true }))
    window.AIWT.flushSave()
    return { projectId: project.id, textId: doc.id }
  })
}

const browser = await chromium.launch({ headless: true })
try {
  const browserContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await browserContext.newPage()
  await freshApp(page)
  await assertAxe(page, 'Bibliothek')
  await seedAccessibleProject(page)
  await assertAxe(page, 'Editor')

  await page.locator('#pvCard').click()
  await page.locator('#pvModal').waitFor({ state: 'visible' })
  await assertAxe(page, 'Projektverständnis')
  await page.keyboard.press('Escape')

  await page.locator('#materialSources').click()
  await page.locator('#materialModal').waitFor({ state: 'visible' })
  await assertAxe(page, 'Quellenbibliothek')
  await page.getByRole('button', { name: /Abschnitt results öffnen/ }).click()
  await page.locator('#sourceReader').waitFor({ state: 'visible' })
  await assertAxe(page, 'Quellenreader')
  await page.keyboard.press('Escape')

  await page.locator('#pvCard').click()
  await page.getByRole('button', { name: 'Sprache und Wirkung prüfen' }).click()
  await page.locator('#languageModal').waitFor({ state: 'visible' })
  await assertAxe(page, 'Sprachdossier')
  await page.keyboard.press('Escape')

  await page.keyboard.press('Control+e')
  await page.locator('#auditModal').waitFor({ state: 'visible' })
  await assertAxe(page, 'Schlussaudit')
  console.log('SYSTEM-11 axe WCAG 2.1 A/AA: PASS')
} finally {
  await browser.close()
  await serverStoppen()
}
