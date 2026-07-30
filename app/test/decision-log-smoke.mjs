import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const baseUrl = process.env.AIWT_URL || 'http://127.0.0.1:4173/'
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
    doc.findings = [{
      id: 'eval-decision-finding',
      status: 'dismissed',
      category: 'fakt',
      short: 'Diese Zahl braucht einen belastbaren Beleg.',
      target: 'Mark Weiser',
      action: '',
      placement: 'passage',
      thread: [],
    }]
    doc.decisions = [{
      id: 'eval-decision-risk',
      findingId: 'eval-decision-finding',
      kind: 'reject',
      outcome: 'risk-accepted',
      reason: 'Die Zahl wird vor der Veröffentlichung noch geprüft.',
      appliedText: '',
      at: Date.now(),
    }]
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

  const eintrag = page.locator('.agent-decision[data-decision-id="eval-decision-risk"]')
  await eintrag.waitFor({ state: 'visible' })
  const text = await eintrag.textContent()
  assert.match(text, /Risiko bewusst angenommen/)
  assert.match(text, /Diese Zahl braucht einen belastbaren Beleg/)
  assert.match(text, /gerade eben/)
  assert.match(text, /Die Zahl wird vor der Veröffentlichung noch geprüft/)

  const gespeichert = await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    return doc.workspace.agent.decisionsOpen
  })
  assert.equal(gespeichert, true)
  console.log('decision-log-smoke: ok')
} finally {
  await browser.close()
}
