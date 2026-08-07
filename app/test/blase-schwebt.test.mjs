// DER TEXT SCHRUMPFT NIE — als Pruefung, nicht als Kommentar.
//
// Jakob hat diese Regel am 07.08.2026 gesetzt, nachdem genau hier etwas
// schiefging: das Agentenfenster reservierte 420px Rand, das Fenster war dann
// breit genug fuer das Fenster, aber nicht mehr fuer die Lesespalte — und die
// Ueberschrift brach mit EINEM Buchstaben pro Zeile um.
//
// Die Regel steht als Kommentar in src/style.css bei @media (min-width: 1712px)
// und als min-width an #editorView #page. Kommentare halten nichts. Diese
// Pruefung misst die Lesespalte mit und ohne offene Blase und besteht nur,
// wenn beide Messungen auf den Pixel gleich sind.
//
// 1000px ist Jakobs echte Fensterbreite. Die anderen Breiten decken die beiden
// Schwellen ab: 1040 (ab hier gibt es einen Anmerkungsrand) und 1712 (ab hier
// darf die Spalte dem Fenster hoeflich ausweichen).
//
// Braucht das gebaute Bundle (npm run build).

import test from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const mimeByExtension = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.mjs': 'text/javascript',
  '.woff2': 'font/woff2',
}

let staticServer = null
let baseUrl = process.env.AIWT_URL
if (!baseUrl) {
  staticServer = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
      const target = resolve(appRoot, pathname === '/' ? 'index.html' : pathname.slice(1))
      if (target !== appRoot && !target.startsWith(`${appRoot}${sep}`)) {
        response.writeHead(403).end()
        return
      }
      const content = await readFile(target)
      response.writeHead(200, { 'content-type': mimeByExtension[extname(target)] || 'application/octet-stream' })
      response.end(content)
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise(fertig => staticServer.listen(0, '127.0.0.1', fertig))
  baseUrl = `http://127.0.0.1:${staticServer.address().port}/`
}

const browser = await chromium.launch({ headless: true })

async function imSchreibraum(breite, arbeit) {
  const seite = await browser.newPage({ viewport: { width: breite, height: 900 } })
  try {
    await seite.goto(baseUrl, { waitUntil: 'load' })
    await seite.evaluate(() => window.AIWT.openDoc(window.AIWT.state.active))
    await seite.locator('#editorView #page').waitFor({ state: 'visible' })
    return await arbeit(seite)
  } finally {
    await seite.close()
  }
}

// Misst die Lesespalte. Die Blase wird ueber den Orb geschaltet — denselben Weg,
// den auch Jakob nimmt.
//
// Gemessen wird die BREITE, nicht der Ort. Die Regel lautet "der Text schrumpft
// nie", nicht "der Text bewegt sich nie": dass die Spalte nach links rueckt,
// wenn die Blase hoeflich Platz bekommt, ist gewollt. Was nie passieren darf,
// ist ein schmalerer Titel — daran ist die vorige Fassung gestorben.
async function lesespalte(seite) {
  return seite.evaluate(() => {
    const seiteEl = document.getElementById('page')
    const titel = document.getElementById('title')
    const absatz = document.querySelector('#editor .ProseMirror')
    return {
      seite: Math.round(seiteEl.getBoundingClientRect().width),
      titel: Math.round(titel.getBoundingClientRect().width),
      absatz: absatz ? Math.round(absatz.getBoundingClientRect().width) : null,
    }
  })
}

async function ortDerSpalte(seite) {
  return seite.evaluate(() => Math.round(document.getElementById('page').getBoundingClientRect().left))
}

async function schalteBlase(seite) {
  await seite.evaluate(() => document.getElementById('ondaAura').click())
  await seite.locator('#editorView').evaluate(async knoten => {
    await Promise.all(knoten.getAnimations({ subtree: true }).map(a => a.finished.catch(() => {})))
  })
}

// 1000 ist Jakobs echte Fensterbreite. 1040 und 1712 sind die beiden Schwellen,
// die es im Stylesheet einmal gab — genau an ihnen brach es. 1750 und 1800
// liegen um die Stelle, an der der Rand voll wird; 2200 ist deutlich darueber.
for (const breite of [1000, 1040, 1280, 1712, 1750, 1800, 2200]) {
  test(`bei ${breite}px verliert die Lesespalte durch die Blase keinen Pixel`, async () => {
    const ergebnis = await imSchreibraum(breite, async seite => {
      const zu = await lesespalte(seite)
      const ortZu = await ortDerSpalte(seite)
      await schalteBlase(seite)
      const offen = await lesespalte(seite)
      const ortOffen = await ortDerSpalte(seite)
      const offenIst = await seite.evaluate(() => !document.getElementById('agentWidget').hidden)
      await schalteBlase(seite)
      const wiederZu = await lesespalte(seite)
      return { zu, offen, wiederZu, offenIst, ortZu, ortOffen }
    })

    assert.equal(ergebnis.offenIst, true, 'die Blase war gar nicht offen — die Messung waere wertlos')
    assert.deepEqual(ergebnis.offen, ergebnis.zu,
      `Die Lesespalte ist schmaler geworden, als die Blase aufging: ${JSON.stringify(ergebnis.zu)} → `
      + `${JSON.stringify(ergebnis.offen)} (sie rueckte dabei von ${ergebnis.ortZu} auf ${ergebnis.ortOffen}). `
      + 'Der Text ist das Produkt; alles andere weicht ihm. '
      + 'Siehe den Kommentar in src/style.css bei "DER TEXT SCHRUMPFT NIE".')
    assert.deepEqual(ergebnis.wiederZu, ergebnis.zu, 'nach dem Schliessen ist die Spalte nicht wieder so breit wie vorher')
    assert.ok(ergebnis.zu.titel > 0 && ergebnis.zu.absatz > 0,
      'Titel oder Absatz wurden mit Breite 0 gemessen — dann prueft der Test nichts')
  })
}

test('die Blase schwebt — sie steht nicht im Fluss der Editor-Spalte', async () => {
  const lage = await imSchreibraum(1000, async seite => {
    await schalteBlase(seite)
    return seite.evaluate(() => getComputedStyle(document.getElementById('agentWidget')).position)
  })
  // position: fixed ist der Grund, warum die Spalte nichts abgeben muss.
  // Wird das je auf static/relative geaendert, schiebt die Blase den Text — und
  // genau daran ist die vorige Fassung gescheitert.
  assert.equal(lage, 'fixed')
})

test('der Sitz der Blase liegt genau auf dem Orb', async () => {
  const mass = await imSchreibraum(1000, async seite => {
    await schalteBlase(seite)
    return seite.evaluate(() => {
      const blase = document.getElementById('agentWidget').getBoundingClientRect()
      const orb = document.getElementById('ondaAura').getBoundingClientRect()
      return {
        // Sitzmitte der Blase: 24 von rechts, 24 von oben (BLASEN_MASSE.sitz).
        sitzX: Math.round(blase.right - 24),
        sitzY: Math.round(blase.top + 24),
        orbX: Math.round(orb.left + orb.width / 2),
        orbY: Math.round(orb.top + orb.height / 2),
      }
    })
  })
  // Faellt das auseinander, haengt die Blase NEBEN dem Orb statt an ihm — und
  // "kommt wie eine Sprechblase aus ihm hervor" stimmt nicht mehr.
  assert.equal(mass.sitzX, mass.orbX, 'Sitz und Orb liegen waagerecht nicht uebereinander')
  assert.equal(mass.sitzY, mass.orbY, 'Sitz und Orb liegen senkrecht nicht uebereinander')
})

test('der Orb liegt ueber der Blase, nicht darunter', async () => {
  const ebenen = await imSchreibraum(1000, async seite => {
    await schalteBlase(seite)
    return seite.evaluate(() => ({
      orb: Number(getComputedStyle(document.getElementById('ondaAura')).zIndex),
      blase: Number(getComputedStyle(document.getElementById('agentWidget')).zIndex),
    }))
  })
  // Die Blase kommt aus dem Orb hervor — also liegt er obenauf. Andersherum
  // verschwindet er hinter seiner eigenen Sprechblase.
  assert.ok(ebenen.orb > ebenen.blase, `Orb ${ebenen.orb} liegt nicht ueber Blase ${ebenen.blase}`)
})

test.after(async () => {
  await browser.close()
  staticServer?.close()
})
