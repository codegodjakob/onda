import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { starteAppServer } from './helpers/onda-server.mjs'

const { baseUrl } = await starteAppServer()
const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
  await page.locator('#doclist .doc').first().click()

  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    const basis = {
      status: 'resolved',
      category: 'sprache',
      placement: 'passage',
      thread: [],
    }
    doc.findings = [
      {
        ...basis,
        id: 'eval-finding-accept',
        short: 'Der Satz kann knapper werden.',
        target: 'ursprünglich lang',
        action: 'Klar und kurz.',
      },
      {
        ...basis,
        id: 'eval-finding-own',
        short: 'Die Aussage braucht eine eigene Fassung.',
        target: 'ursprüngliche Aussage',
        action: 'KI-Vorschlag.',
      },
      {
        ...basis,
        id: 'eval-finding-dismiss',
        status: 'dismissed',
        short: 'Diese stilistische Empfehlung passt hier nicht.',
        target: 'Bewusster Originalton',
        action: '',
      },
      {
        ...basis,
        id: 'eval-finding-risk',
        status: 'risk-accepted',
        category: 'fakt',
        short: 'Diese Zahl braucht einen belastbaren Beleg.',
        target: 'Mark Weiser',
        action: '',
      },
    ]
    const at = Date.now()
    doc.decisions = [
      {
        id: 'eval-decision-accept',
        findingId: 'eval-finding-accept',
        kind: 'accept',
        outcome: 'resolved',
        reason: '',
        appliedText: 'Klar und kurz.',
        resultingText: 'Klar und kurz.',
        at: at - 3000,
      },
      {
        id: 'eval-decision-own',
        findingId: 'eval-finding-own',
        kind: 'accept',
        outcome: 'resolved',
        reason: '',
        appliedText: 'Meine eigene klare Fassung.',
        resultingText: 'Meine eigene klare Fassung.',
        at: at - 2000,
      },
      {
        id: 'eval-decision-dismiss',
        findingId: 'eval-finding-dismiss',
        kind: 'reject',
        outcome: 'dismissed',
        reason: '',
        appliedText: '',
        resultingText: 'Bewusster Originalton',
        at: at - 1000,
      },
      {
        id: 'eval-decision-risk',
        findingId: 'eval-finding-risk',
        kind: 'reject',
        outcome: 'risk-accepted',
        reason: 'Die Zahl wird vor der Veröffentlichung noch geprüft.',
        appliedText: '',
        resultingText: 'Mark Weiser',
        at,
      },
    ]
    doc.workspace.agent.open = true
    doc.workspace.agent.messages = []
    window.AIWT.persist()
    window.AIWT.__workspaceTestBridge.reinitialize()
  })

  const toggle = page.locator('#agentDecisionsToggle')
  await toggle.waitFor({ state: 'visible' })
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
  assert.match(await toggle.textContent(), /Entscheidungsverlauf/)
  await toggle.click()

  const erwartungen = new Map([
    ['eval-decision-accept', [/Angenommen/, /Klar und kurz\./]],
    ['eval-decision-own', [/Eigene Fassung übernommen/, /Meine eigene klare Fassung\./]],
    ['eval-decision-dismiss', [/Verworfen/, /Bewusster Originalton/]],
    ['eval-decision-risk', [/Risiko bewusst angenommen/, /Mark Weiser/, /Die Zahl wird vor der Veröffentlichung noch geprüft/]],
  ])
  for (const [id, muster] of erwartungen) {
    const eintrag = page.locator(`.agent-decision[data-decision-id="${id}"]`)
    await eintrag.waitFor({ state: 'visible' })
    const text = await eintrag.textContent()
    muster.forEach(pattern => assert.match(text, pattern))
    assert.match(text, /gerade eben/)
  }

  const gespeichert = await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.workspace.agent.decisionsOpen
  })
  assert.equal(gespeichert, true)

  await page.evaluate(() => window.AIWT.flushSave())
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
  await page.locator('#doclist .doc').first().click()
  const toggleNachReload = page.locator('#agentDecisionsToggle')
  await toggleNachReload.waitFor({ state: 'visible' })
  assert.equal(await toggleNachReload.getAttribute('aria-expanded'), 'true')
  assert.equal(await page.locator('.agent-decision').count(), 4)
  for (const [id, muster] of erwartungen) {
    const text = await page.locator(`.agent-decision[data-decision-id="${id}"]`).textContent()
    muster.forEach(pattern => assert.match(text, pattern))
  }
  console.log('decision-log-smoke: ok')
} finally {
  await browser.close()
}
