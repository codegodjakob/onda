import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import {
  ETAPPE_A_HINWEISE,
  ETAPPE_A_TEXT,
  ETAPPE_A_USAGE,
  ETAPPE_A_VERSTAENDNIS,
} from '../evals/fixtures/etappe-a-transport.mjs'
import { starteAppServer } from './helpers/onda-server.mjs'

const { baseUrl } = await starteAppServer()

async function oeffneFrischeApp(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
}

async function installiereTransport(page) {
  await page.evaluate(({ hinweise, usage, verstaendnis }) => {
    window.__etappeA = { aufrufe: [] }
    window.AIWT.setzeTransportFuerTests({
      async hatSchluessel() { return true },
      async setzeSchluessel() {},
      async loescheSchluessel() {},
      sende(anfrage, handlers) {
        window.__etappeA.aufrufe.push(anfrage)
        const schema = anfrage?.body?.output_config?.format?.schema
        const text = schema?.properties?.antwortText
          ? JSON.stringify(verstaendnis)
          : schema?.properties?.hinweise
            ? JSON.stringify(hinweise)
            : 'EVAL-Antwort'
        queueMicrotask(() => handlers.onFertig({
          text,
          usage: { ...usage },
          stopReason: 'end_turn',
        }))
      },
    })
  }, {
    hinweise: ETAPPE_A_HINWEISE,
    usage: ETAPPE_A_USAGE,
    verstaendnis: ETAPPE_A_VERSTAENDNIS,
  })
}

async function neuesProjekt(page, name) {
  await page.evaluate(projektName => {
    window.AIWT.newProject(projektName)
    window.AIWT.newDoc()
  }, name)
}

async function runGebündelteFrage(browser) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } })
  await oeffneFrischeApp(page)
  await installiereTransport(page)
  await neuesProjekt(page, 'WORK-01')

  const zustand = await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    const project = window.AIWT.state.projects.find(candidate => candidate.id === doc.projectId)
    const messages = doc.workspace.agent.messages.filter(message => message.id === `interview-${project.id}`)
    return {
      anzahl: messages.length,
      text: messages[0]?.text || '',
      transportAufrufe: window.__etappeA.aufrufe.length,
    }
  })
  assert.equal(zustand.anzahl, 1)
  assert.equal((zustand.text.match(/\?/g) || []).length, 1)
  assert.match(zustand.text, /Worum soll es in diesem Text gehen.*für wen schreibst du ihn/)
  assert.equal(zustand.transportAufrufe, 0, 'Die feste Eröffnungsfrage darf keine Kosten auslösen')

  await page.locator('#ondaAura').click()
  const widget = page.locator('#agentWidget')
  await widget.waitFor({ state: 'visible' })
  assert.match(await widget.textContent(), /Worum soll es in diesem Text gehen/)
  await page.close()
}

async function runVerstehenVorHinweisen(browser) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } })
  const errors = []
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', error => errors.push(error.message))
  await oeffneFrischeApp(page)
  await installiereTransport(page)
  await neuesProjekt(page, 'WORK-02')

  await page.evaluate(text => {
    window.AIWT.__blockIdentityTestBridge.setContent([{
      type: 'paragraph',
      content: [{ type: 'text', text }],
    }])
    window.AIWT.flushSave()
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.workspace.agent.messages = []
    const project = window.AIWT.state.projects.find(candidate => candidate.id === doc.projectId)
    project.understanding.entwurfVersuchtAm = null
    window.__etappeA.aufrufe.length = 0
    window.AIWT.__workspaceTestBridge.reinitialize()
  }, ETAPPE_A_TEXT)

  await page.waitForFunction(() => window.__etappeA.aufrufe.length === 1)
  await page.waitForFunction(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    const project = window.AIWT.state.projects.find(candidate => candidate.id === doc.projectId)
    return project.understanding.task === 'Eine belastbare Produktbeschreibung ausarbeiten'
  })

  const ersteRunde = await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    const project = window.AIWT.state.projects.find(candidate => candidate.id === doc.projectId)
    const aufrufe = window.__etappeA.aufrufe
    return {
      aufrufe: aufrufe.length,
      erstesSchema: Boolean(aufrufe[0]?.body?.output_config?.format?.schema?.properties?.antwortText),
      hinweisSchema: aufrufe.some(anfrage => Boolean(anfrage?.body?.output_config?.format?.schema?.properties?.hinweise)),
      body: doc.body,
      task: project.understanding.task,
      offeneFragen: project.understanding.openQuestions,
      usageInput: window.AIWT.state.settings.usage.inputTokens,
    }
  })
  assert.equal(ersteRunde.aufrufe, 1)
  assert.equal(ersteRunde.erstesSchema, true)
  assert.equal(ersteRunde.hinweisSchema, false, 'Hinweise dürfen nicht parallel zum offenen Verständnis starten')
  assert.equal(ersteRunde.body.includes(ETAPPE_A_TEXT), true)
  assert.equal(ersteRunde.task, ETAPPE_A_VERSTAENDNIS.task)
  assert.deepEqual(ersteRunde.offeneFragen, ETAPPE_A_VERSTAENDNIS.openQuestions)
  assert.equal(ersteRunde.usageInput, ETAPPE_A_USAGE.input_tokens)

  const htmlVorHinweisen = await page.evaluate(() => window.AIWT.state.editor.getHTML())
  await page.evaluate(() => window.AIWT.__workspaceTestBridge.reinitialize())
  await page.waitForFunction(() => window.__etappeA.aufrufe.length === 2)
  await page.waitForFunction(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.findings.length === 1
  })
  const zweiteRunde = await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return {
      findings: doc.findings.map(finding => ({ target: finding.target, category: finding.category })),
      usageInput: window.AIWT.state.settings.usage.inputTokens,
      verworfen: doc.workspace.hinweislauf.verworfen,
    }
  })
  assert.deepEqual(zweiteRunde.findings, [{ target: 'erst versteht und dann urteilt', category: 'logic' }])
  assert.equal(zweiteRunde.verworfen, 1)
  assert.equal(zweiteRunde.usageInput, ETAPPE_A_USAGE.input_tokens * 2)
  assert.equal(await page.evaluate(() => window.AIWT.state.editor.getHTML()), htmlVorHinweisen,
    'Verständnis- und Hinweislauf dürfen den Text nicht verändern')
  assert.deepEqual(errors, [])
  await page.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await runGebündelteFrage(browser)
  await runVerstehenVorHinweisen(browser)
  console.log('Etappe-A smoke passed')
} finally {
  await browser.close()
}
