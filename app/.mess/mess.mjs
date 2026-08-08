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
    const content = await readFile(target)
    res.writeHead(200, { 'content-type': mime[extname(target)] || 'application/octet-stream' })
    res.end(content)
  } catch { res.writeHead(404).end() }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const baseUrl = `http://127.0.0.1:${server.address().port}/`
console.log('server', baseUrl)

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto(baseUrl, { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
await page.locator('#doclist .doc').first().click()
await page.waitForTimeout(300)

// --- D3: sind alle drei Kopfzeilen sichtbar?
const abschnitte = await page.evaluate(() => {
  const nav = document.querySelector('.onda-project-nav')
  const n = nav.getBoundingClientRect()
  return {
    nav: { top: Math.round(n.top), bottom: Math.round(n.bottom), scrollH: nav.scrollHeight, clientH: nav.clientHeight },
    namen: [...document.querySelectorAll('#ondaSidebar .onda-side-name')].map(b => {
      const r = b.getBoundingClientRect()
      return { id: b.id, top: Math.round(r.top), bottom: Math.round(r.bottom) }
    }),
  }
})
console.log('D3 Abschnitte:', JSON.stringify(abschnitte, null, 1))

// --- D6: .onda-baum-quelle Höhe
await page.locator('#materialTreeToggle').click()
await page.waitForTimeout(150)
const quellen = await page.locator('.onda-baum-quelle').evaluateAll(ns => ns.map(n => Math.round(n.getBoundingClientRect().height)))
console.log('D6 Quellenzeilen-Höhen:', JSON.stringify(quellen))
await page.locator('#materialTreeToggle').click()

// --- D9: Auszeichnung Abschnittsbeschriftung gegen Eintrag
const auszeichnung = await page.evaluate(() => {
  const lies = sel => {
    const n = document.querySelector(sel)
    if (!n) return null
    const s = getComputedStyle(n)
    return { sel, size: s.fontSize, weight: s.fontWeight, color: s.color, text: n.textContent.trim().slice(0, 30) }
  }
  return [lies('#structureOpen'), lies('#pvCard'), lies('#pvClaim'), lies('.block-preview'), lies('.block-preview-role'), lies('.block-preview-excerpt')]
})
console.log('D9 Auszeichnung:', JSON.stringify(auszeichnung, null, 1))

// --- D4 + D1: Struktur-Fenster
await page.locator('#structureOpen').click()
await page.locator('#strukturModal').waitFor({ state: 'visible' })
await page.waitForTimeout(400)
const strukturLage = await page.evaluate(() => {
  const kasten = sel => { const n = document.querySelector(sel); if (!n) return null; const r = n.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }
  return {
    panel: kasten('#strukturModal'),
    liste: kasten('.onda-blaetter__liste'),
    fuss: kasten('.onda-blaetter__fuss'),
    knopf: kasten('#strukturBausteinNeu'),
    titelFenster: (() => { const n = document.querySelector('.onda-dialog-title'); const s = getComputedStyle(n); return { size: s.fontSize, weight: s.fontWeight } })(),
    titelTiefe: (() => { const n = document.querySelector('.onda-blaetter__tiefe-titel'); if (!n) return null; const s = getComputedStyle(n); return { size: s.fontSize, weight: s.fontWeight } })(),
  }
})
console.log('D4 Struktur-Fenster:', JSON.stringify(strukturLage, null, 1))

// D1: Menü klickbar?
await page.evaluate(() => document.querySelector('.onda-blaetter__liste').scrollTo(0, 99999))
await page.waitForTimeout(150)
const vorher = await page.evaluate(() => window.AIWT.__blockIdentityTestBridge.getBlocks().length)
await page.locator('#strukturBausteinNeu').click()
await page.waitForTimeout(200)
const menuLage = await page.evaluate(() => {
  const m = document.querySelector('.semantic-insert-menu')
  if (!m) return null
  const r = m.getBoundingClientRect()
  const mitte = document.elementFromPoint(r.x + r.width / 2, r.y + 30)
  return {
    kasten: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
    zIndexMenu: getComputedStyle(m).zIndex,
    zIndexScrim: getComputedStyle(document.querySelector('.onda-dialog-scrim')).zIndex,
    obenAuf: mitte ? (mitte.className || mitte.id || mitte.tagName) : null,
  }
})
console.log('D1 Einfügemenü:', JSON.stringify(menuLage, null, 1))
let klickOk = 'nicht versucht'
try {
  await page.locator('.semantic-insert-menu button').first().click({ timeout: 2500 })
  klickOk = 'geklickt'
} catch (fehler) { klickOk = `Timeout: ${String(fehler).slice(0, 80)}` }
await page.waitForTimeout(300)
const nachher = await page.evaluate(() => window.AIWT.__blockIdentityTestBridge.getBlocks().length)
console.log('D1 Mausklick:', klickOk, `Bausteine ${vorher} -> ${nachher}`)
await page.keyboard.press('Escape')
await page.waitForTimeout(200)

// --- D2: Quellen-Fenster Handschrift
await page.locator('#materialSources').click()
await page.locator('#materialModal').waitFor({ state: 'visible' })
await page.waitForTimeout(300)
const quellenFenster = await page.evaluate(() => {
  const panel = document.querySelector('#materialModal')
  const knoepfe = [...panel.querySelectorAll('button')].map(b => {
    const r = b.getBoundingClientRect(); const s = getComputedStyle(b)
    return { text: b.textContent.trim().slice(0, 34), h: Math.round(r.height), bg: s.backgroundColor, cls: b.className }
  }).filter(b => b.h > 0)
  const titel = [...panel.querySelectorAll('h1,h2,h3,h4,p')].slice(0, 20).map(n => {
    const s = getComputedStyle(n)
    return { tag: n.tagName, cls: n.className, size: s.fontSize, weight: s.fontWeight, text: n.textContent.trim().slice(0, 40) }
  })
  return { knoepfe, titel }
})
console.log('D2 Quellen-Fenster:', JSON.stringify(quellenFenster, null, 1))
await page.keyboard.press('Escape')

// --- D5: Tab-Reihenfolge
await page.waitForTimeout(200)
await page.evaluate(() => document.getElementById('sidebarToggle').focus())
const folge = ['sidebarToggle']
for (let i = 0; i < 3; i += 1) {
  await page.keyboard.press('Tab')
  folge.push(await page.evaluate(() => document.activeElement.id || document.activeElement.className))
}
await page.evaluate(() => document.getElementById('sidebarToggle').focus())
await page.keyboard.press('Shift+Tab')
const davor = await page.evaluate(() => document.activeElement.id || document.activeElement.tagName)
console.log('D5 Tab-Folge ab Klinke:', JSON.stringify(folge), 'davor:', davor)
console.log('D5 Sichtbare Reihenfolge:', JSON.stringify(await page.evaluate(() => ['sidebarToggle', 'ondaHome', 'pvCard'].map(id => {
  const r = document.getElementById(id).getBoundingClientRect()
  return { id, x: Math.round(r.x), y: Math.round(r.y) }
}))))

await page.screenshot({ path: '/private/tmp/claude-501/-Users-jakobschlenker-Documents-AI-Writing-Tool/d2923dea-88a8-4c3a-8506-951fa8f2db83/scratchpad/vorher-seitenleiste.png' })

await browser.close()
server.close()
