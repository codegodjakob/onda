import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { openMaterialLibrary } from './helpers/onda-navigation.mjs'

const baseUrl = process.env.AIWT_URL || 'http://127.0.0.1:4173/'

async function freshProject(page, name = 'B2 Recherche') {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.evaluate(projectName => {
    window.AIWT.newProject(projectName)
    window.AIWT.newDoc()
  }, name)
}

async function openLibrary(page) {
  await openMaterialLibrary(page)
}

async function installAdapter(page, delay = 0) {
  await page.evaluate(waitMs => {
    window.__researchCalls = window.__researchCalls || []
    const excerptFor = query => {
      if (/Gegenbefund/.test(query)) {
        return {
          id: 'counter',
          relation: 'counters',
          title: 'Unabhängige Replikation',
          text: 'Die Replikation fand nach einer Sitzung keinen belastbaren Unterschied.',
          limitation: '',
        }
      }
      if (/Grenzen/.test(query)) {
        return {
          id: 'limits',
          relation: 'limits',
          title: 'Methodischer Anhang',
          text: 'Die Stichprobe umfasst nur 42 Studierende einer einzelnen Hochschule.',
          limitation: 'Kleine, institutionell enge Stichprobe.',
        }
      }
      return {
        id: 'support',
        relation: 'supports',
        title: 'Originalstudie',
        text: 'In dieser Stichprobe war die Fehlerrate nach einer Sitzung niedriger.',
        limitation: '',
      }
    }
    window.__AIWT_RESEARCH_ADAPTER__ = {
      name: 'b2-browser-fixture',
      version: '2026.07',
      tools: ['search', 'metadata', 'reader', 'import'],
      invoke(_tool, input, { signal }) {
        window.__researchCalls.push({ input: JSON.parse(JSON.stringify(input)) })
        return new Promise((resolve, reject) => {
          const result = excerptFor(input.query || '')
          const finish = () => resolve({
            id: `result-${result.id}`,
            candidates: [{
              id: result.id,
              relation: result.relation,
              accessLevel: 'original-excerpt',
              originalRef: `https://example.org/research/${result.id}`,
              title: result.title,
              sourceType: 'web',
              original: {
                mediaType: 'text/html',
                sections: [{ id: 'results', heading: 'Ergebnis', text: result.text }],
              },
              locator: {
                kind: 'section',
                address: { sectionId: 'results' },
                excerpt: result.text,
              },
              verification: { status: 'verified' },
              limitation: result.limitation,
            }],
          })
          const timer = setTimeout(finish, waitMs)
          signal?.addEventListener('abort', () => {
            clearTimeout(timer)
            const error = new Error('aborted')
            error.name = 'AbortError'
            reject(error)
          }, { once: true })
        })
      },
    }
  }, delay)
}

async function createPlan(page) {
  await page.locator('#researchPlanOpen').click()
  // Die URSACHE des Last-Flakes (deterministisch nachgewiesen auf Zweig
  // claude/cranky-cori-c122aa, dd5a3e1): das Formular fokussiert das Fragefeld
  // verzögert per requestAnimationFrame (research-ui.mjs), und fill() schickt den
  // Text an das gerade fokussierte Element. Feuert der Frame unter Last verspätet
  // mitten im Ausfüllen, zieht er den Fokus zurück aufs Fragefeld — der Aussagetext
  // landet im falschen Feld, das Pflichtfeld bleibt leer, das Speichern wird
  // stumm blockiert. Darum: erst tippen, wenn der Autofokus angekommen ist.
  await page.waitForFunction(() => document.activeElement?.id === 'researchQuestion')
  await page.locator('#researchQuestion').fill('Wie belastbar ist die Wirkung nach einer Sitzung?')
  await page.locator('#researchClaim').fill('In dieser Stichprobe war die Fehlerrate nach einer Sitzung niedriger.')
  await page.locator('#researchBudget').fill('9')
  await page.locator('#researchPlanSubmit').click()
  // Beweissicherung, zusätzlich zur Fokus-Barriere oben: dieser Warteschritt lief
  // unter paralleler Testlast zweimal in ein stummes 30-s-Timeout, weil das
  // Pflichtfeld-Veto des Submits in der Statuszeile landet — und die las niemand.
  // Sollte je wieder ETWAS den Plan blockieren, scheitert der Test jetzt sofort
  // mit dem wörtlichen Grund statt mit einem leeren Timeout:
  // 1. Gewartet wird auf BEIDE möglichen Ausgänge des Submits: den geplanten
  //    Lauf ODER die Fehler-Statuszeile des Formulars.
  // 2. Bei echtem Timeout hängt eine Diagnose (Feldwerte, Statuszeile,
  //    Laufzustand) an der Fehlermeldung.
  // 3. Das Fenster ist grosszuegig (60 s) fuer echte Verhungerung unter Last —
  //    eine echte Regression scheitert bei jedem Fenster, nur eben mit Befund.
  try {
    await page.locator('#researchRunView[data-status="planned"], #researchPlanStatus:not(:empty)')
      .first().waitFor({ timeout: 60_000 })
  } catch (fehler) {
    const diagnose = await page.evaluate(() => ({
      formularDa: !!document.getElementById('researchPlanForm'),
      laufStatus: document.getElementById('researchRunView')?.dataset?.status || null,
      status: document.getElementById('researchPlanStatus')?.textContent || null,
      frage: document.getElementById('researchQuestion')?.value ?? null,
      aussage: document.getElementById('researchClaim')?.value ?? null,
      budget: document.getElementById('researchBudget')?.value ?? null,
    })).catch(evalFehler => ({ diagnoseFehler: evalFehler.message }))
    fehler.message += `\nDiagnose beim Timeout: ${JSON.stringify(diagnose)}`
    throw fehler
  }
  // Direkt aus dem Dokument lesen (kein Locator): im Erfolgsfall ist das Formular
  // samt Statuszeile bereits ersetzt, ein wartender Locator wuerde hier stallen.
  const statusText = await page.evaluate(() => document.getElementById('researchPlanStatus')?.textContent || '')
  assert.equal(statusText.trim(), '',
    `Plan wurde nicht angelegt — die Statuszeile meldet: "${statusText.trim()}"`)
  await page.locator('#researchRunView[data-status="planned"]').waitFor({ timeout: 60_000 })
}

async function runResearchFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
  const errors = []
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', error => errors.push(error.message))
  await freshProject(page)
  await installAdapter(page, 150)
  await openLibrary(page)
  await createPlan(page)

  assert.equal(await page.evaluate(() => window.__researchCalls.length), 0, 'Plan muss vor dem ersten Werkzeugaufruf existieren')
  const planned = await page.evaluate(() => {
    const project = window.AIWT.state.projects.find(candidate => candidate.id === window.AIWT.state.activeProject)
    const run = project.researchRuns[0]
    return {
      status: run.status,
      paths: run.searchPaths.map(path => path.purpose),
      events: run.toolEvents.length,
      maxCalls: run.stopConditions.maxToolCalls,
    }
  })
  assert.deepEqual(planned, {
    status: 'planned',
    paths: ['support', 'counter-evidence', 'limitations'],
    events: 0,
    maxCalls: 9,
  })

  await page.locator('#researchStart').click()
  await page.locator('#researchRunView[data-status="running"]').waitFor()
  await page.locator('#researchPause').click()
  await page.locator('#researchRunView[data-status="paused"]').waitFor()
  const paused = await page.evaluate(() => {
    const project = window.AIWT.state.projects.find(candidate => candidate.id === window.AIWT.state.activeProject)
    const run = project.researchRuns[0]
    return { status: run.status, eventStatus: run.toolEvents[0].status, sourceCount: project.sources.length }
  })
  assert.deepEqual(paused, { status: 'paused', eventStatus: 'cancelled', sourceCount: 0 })

  await installAdapter(page, 0)
  await page.locator('#researchResume').click()
  await page.locator('#researchRunView[data-status="review-ready"]').waitFor()
  assert.equal(await page.locator('#researchReview .research-result-group').count(), 3)
  assert.match(await page.locator('#researchReview').textContent(), /Unabhängige Replikation/)
  assert.match(await page.locator('#researchReview').textContent(), /Kleine, institutionell enge Stichprobe/)
  assert.match(await page.locator('#researchReview').textContent(), /Beleglage ist gemischt/)
  if (process.env.AIWT_SCREENSHOTS) {
    await page.screenshot({ path: '/tmp/b2-research-review.png', fullPage: true })
  }
  await page.locator('#researchToolLog > summary').click()
  assert.equal(await page.locator('.research-tool-event').count(), 4)
  assert.match(await page.locator('#researchToolLog').textContent(), /b2-browser-fixture 2026.07/)

  await page.locator('#researchCommit').click()
  await page.locator('#researchRunView[data-status="completed"]').waitFor()
  const committed = await page.evaluate(() => {
    const project = window.AIWT.state.projects.find(candidate => candidate.id === window.AIWT.state.activeProject)
    return {
      runStatus: project.researchRuns[0].status,
      sourceCount: project.sources.length,
      bundleCount: project.evidenceBundles.length,
      bundleStatus: project.evidenceBundles[0].status,
      provenance: project.evidenceBundles[0].provenance,
    }
  })
  assert.deepEqual(committed, {
    runStatus: 'completed',
    sourceCount: 3,
    bundleCount: 1,
    bundleStatus: 'mixed',
    provenance: { actor: 'agent', action: 'research-commit' },
  })

  await page.locator('#researchRunBack').click()
  assert.equal(await page.locator('.source-library-item').count(), 3)
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#materialSources').evaluate(node => document.activeElement === node), true)

  await page.reload({ waitUntil: 'networkidle' })
  await openLibrary(page)
  assert.equal(await page.locator('.research-run-card').count(), 1)
  assert.match(await page.locator('.research-run-card').textContent(), /In Projektwissen übernommen/)
  const stored = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('aiwt.v2'))
    const project = data.projects.find(candidate => candidate.id === data.activeProject)
    return {
      schemaVersion: data.schemaVersion,
      runCount: project.researchRuns.length,
      status: project.researchRuns[0].status,
      sourceCount: project.sources.length,
      hasSecret: JSON.stringify(project.researchRuns).includes('CANARY-super-secret'),
    }
  })
  assert.deepEqual(stored, {
    schemaVersion: 12,
    runCount: 1,
    status: 'completed',
    sourceCount: 3,
    hasSecret: false,
  })
  assert.deepEqual(errors, [])
  await page.close()
}

async function runOfflineResponsiveFlow(browser) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await freshProject(page, 'B2 Offline')
  await openLibrary(page)
  await createPlan(page)
  assert.equal(await page.locator('#researchStart').isDisabled(), true)
  assert.match(await page.locator('.research-adapter-note').textContent(), /keine Ergebnisse simuliert/)
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
  if (process.env.AIWT_SCREENSHOTS) {
    await page.screenshot({ path: '/tmp/b2-research-mobile.png', fullPage: true })
  }
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#materialModal').count(), 0)
  assert.equal(await page.locator('#materialSources').evaluate(node => document.activeElement === node), true)
  await page.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await runResearchFlow(browser)
  await runOfflineResponsiveFlow(browser)
  console.log('Etappe-B2 smoke passed')
} finally {
  await browser.close()
}
