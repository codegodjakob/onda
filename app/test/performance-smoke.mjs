import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { starteAppServer } from './helpers/onda-server.mjs'

const { baseUrl } = await starteAppServer()
const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
  await page.locator('#doclist .doc').first().click()

  await page.evaluate(() => {
    window.__performanceEval = { aktiv: false, samples: [], longTasks: [] }
    window.AIWT.setzeTransportFuerTests({
      async hatSchluessel() { return true },
      async setzeSchluessel() {},
      async loescheSchluessel() {},
      sende(anfrage, handlers) {
        window.__performanceEval.aktiv = true
        setTimeout(() => {
          const text = 'Langsame EVAL-Antwort, die den Editor nicht blockieren darf.'
          handlers.onDelta?.(text)
          handlers.onFertig({
            text,
            usage: {
              input_tokens: 20,
              output_tokens: 10,
              cache_read_input_tokens: 0,
              cache_creation_input_tokens: 0,
            },
            stopReason: 'end_turn',
          })
          window.__performanceEval.aktiv = false
        }, 1500)
      },
    })

    const editor = window.AIWT.state.editor.view.dom
    editor.addEventListener('beforeinput', () => {
      const start = performance.now()
      requestAnimationFrame(() => {
        window.__performanceEval.samples.push(performance.now() - start)
      })
    })
    try {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => window.__performanceEval.longTasks.push(entry.duration))
      })
      observer.observe({ type: 'longtask', buffered: true })
      window.__performanceEval.observer = observer
    } catch {
      window.__performanceEval.longTaskApiUnavailable = true
    }
  })

  await page.locator('#ondaAura').click()
  const widget = page.locator('#agentWidget')
  await widget.waitFor({ state: 'visible' })
  const input = widget.locator('input')
  await input.fill('Bitte ordne den Schluss ein.')
  await input.press('Enter')
  await page.waitForFunction(() => window.__performanceEval.aktiv === true)

  const editorVorher = await page.evaluate(() => window.AIWT.state.editor.getText())
  await page.evaluate(() => {
    window.AIWT.state.editor.commands.focus('end')
  })
  await page.keyboard.type(' Reaktionsprobe', { delay: 20 })
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))

  const messung = await page.evaluate(() => {
    const samples = [...window.__performanceEval.samples].sort((a, b) => a - b)
    const p95Index = Math.max(0, Math.ceil(samples.length * 0.95) - 1)
    return {
      samples,
      p95: samples[p95Index] || 0,
      maxLongTask: Math.max(0, ...window.__performanceEval.longTasks),
      longTaskApiUnavailable: Boolean(window.__performanceEval.longTaskApiUnavailable),
      agentNochAktiv: window.__performanceEval.aktiv,
      editorFokussiert: document.activeElement === window.AIWT.state.editor.view.dom,
      editorText: window.AIWT.state.editor.getText(),
    }
  })

  assert.equal(messung.agentNochAktiv, true)
  assert.equal(messung.editorFokussiert, true)
  assert.ok(messung.samples.length >= 10, `Zu wenige Eingabeproben: ${messung.samples.length}`)
  assert.ok(messung.p95 < 100, `p95 Eingabe→Frame ist ${messung.p95.toFixed(1)} ms`)
  if (!messung.longTaskApiUnavailable) {
    assert.ok(messung.maxLongTask < 100, `Längster Main-Thread-Block ist ${messung.maxLongTask.toFixed(1)} ms`)
  }
  assert.match(messung.editorText.slice(editorVorher.length), /Reaktionsprobe/)
  console.log(JSON.stringify({
    eval: 'SYSTEM-07',
    samples: messung.samples.length,
    p95InputToFrameMs: Number(messung.p95.toFixed(2)),
    maxLongTaskMs: Number(messung.maxLongTask.toFixed(2)),
    longTaskApiUnavailable: messung.longTaskApiUnavailable,
  }))
} finally {
  await browser.close()
}
