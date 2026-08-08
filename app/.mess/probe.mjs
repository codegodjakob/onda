import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { chromium } from 'playwright'

const appRoot = '/Users/jakobschlenker/Documents/AI Writing Tool/app'
const mime = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2' }
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname)
    const target = resolve(appRoot, pathname === '/' ? 'index.html' : pathname.slice(1))
    if (target !== appRoot && !target.startsWith(`${appRoot}${sep}`)) { res.writeHead(403).end(); return }
    res.writeHead(200, { 'content-type': mime[extname(target)] || 'application/octet-stream' })
    res.end(await readFile(target))
  } catch { res.writeHead(404).end() }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const baseUrl = `http://127.0.0.1:${server.address().port}/`

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
await page.locator('#doclist .doc').first().click()
await page.waitForTimeout(300)

const lage = async marke => {
  const werte = await page.evaluate(() => {
    const k = sel => { const n = document.querySelector(sel); if (!n) return null; const r = n.getBoundingClientRect(); const s = getComputedStyle(n); return { y: Math.round(r.y), h: Math.round(r.height), minH: s.minHeight, flex: s.flex, disp: s.display } }
    return {
      nav: k('.onda-project-nav'),
      pv: k('.onda-project-nav > .onda-side-section'),
      struktur: k('#structureNav'),
      strukturListe: k('#structureNavList'),
      quellen: k('#materialNav'),
      quellenName: k('#materialSources'),
      quellenKopf: k('#materialNav .onda-side-kopf'),
      bausteine: window.AIWT.__blockIdentityTestBridge.getBlocks().length,
    }
  })
  console.log(marke, JSON.stringify(werte, null, 1))
}
await lage('VOR dem Einfügen:')

// Baustein hinzufügen über das Struktur-Fenster
await page.locator('#structureOpen').click()
await page.locator('#strukturModal').waitFor({ state: 'visible' })
await page.waitForTimeout(300)
await page.locator('#strukturBausteinNeu').click()
await page.waitForTimeout(200)
await page.locator('.semantic-insert-menu button').first().click()
await page.waitForTimeout(300)
await page.keyboard.press('Escape')
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
await lage('NACH dem Einfügen + zweimal Escape:')
console.log('Leiste:', JSON.stringify(await page.evaluate(() => {
  const s = document.getElementById('ondaSidebar')
  return { klassenView: document.getElementById('editorView').className, inert: s.inert, breite: Math.round(s.getBoundingClientRect().width), x: Math.round(s.getBoundingClientRect().x) }
})))

await browser.close()
server.close()
