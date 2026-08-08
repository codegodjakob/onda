// Die Bausteinarten am laufenden Programm (Issue #36).
//
// Drei Nähte, die keine Einheitsprüfung erreicht:
//   1. Das Beispielprojekt zeigt erkannte Namen — ohne Schlüssel, ohne Anfrage — und
//      die Namen überstehen ein Neuladen.
//   2. Eine Schreibpause stößt den Bausteinlauf tatsächlich an. Das ist die Naht
//      zwischen Zeitgeber, Lauf-Tor und Modell; im Quelltext ist sie sichtbar, in der
//      laufenden App war sie bis hierhin unbelegt.
//   3. Was das Modell antwortet, steht danach in der Struktur-Spalte — und die
//      unsichtbare Funktion speist die Rechenlogik, sodass die Argumentations-
//      projektion zum ersten Mal etwas zu tun bekommt.
//
// Eigener Server auf einem FREIEN Port (listen(0)). Ein fester Port kann einer fremden
// Sitzung gehören — dann misst man deren Code und hält das Ergebnis für seines.

import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const mimeByExtension = {
  '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.woff2': 'font/woff2',
}

let staticServer = null
let baseUrl = process.env.AIWT_URL
if (!baseUrl) {
  staticServer = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
      const target = resolve(appRoot, pathname === '/' ? 'index.html' : pathname.slice(1))
      if (target !== appRoot && !target.startsWith(`${appRoot}${sep}`)) { response.writeHead(403).end(); return }
      const content = await readFile(target)
      response.writeHead(200, { 'content-type': mimeByExtension[extname(target)] || 'application/octet-stream' })
      response.end(content)
    } catch { response.writeHead(404).end() }
  })
  await new Promise(listening => staticServer.listen(0, '127.0.0.1', listening))
  baseUrl = `http://127.0.0.1:${staticServer.address().port}/`
}

// 'networkidle' heisst „das Netz ist ruhig", nicht „das Buendel ist ausgefuehrt".
async function warteAufApp(page) {
  await page.waitForFunction(() => Boolean(window.AIWT?.newProject), null, { timeout: 15000 })
}

async function frischeApp(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await warteAufApp(page)
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await warteAufApp(page)
}

// Auf VORHANDENSEIN warten, nicht auf Sichtbarkeit: Nach einem Neuladen stehen die Karten
// im Baum, die Struktur-Spalte kann aber eingeklappt sein. Geprueft wird hier, was die Spalte
// SAGT, nicht ob sie gerade aufgeklappt ist.
async function warteAufKarten(page) {
  await page.waitForFunction(() => document.querySelectorAll('.block-preview').length > 0, null, { timeout: 20000 })
}

async function kartenNamen(page) {
  return page.evaluate(() => [...document.querySelectorAll('.block-preview')]
    .map(karte => karte.querySelector('.block-preview-role')?.textContent || ''))
}

// ---------- 1. Das Beispielprojekt spricht ohne Schluessel ----------

async function pruefeBeispiel(browser) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await frischeApp(page)

  await page.evaluate(() => {
    const A = window.AIWT
    const beispiel = A.state.docs.find(doc => doc.exampleSeed) || A.state.docs[0]
    A.openDoc(beispiel.id)
  })
  await warteAufKarten(page)

  const namen = await kartenNamen(page)
  const benannt = namen.filter(Boolean)
  assert.ok(namen.length >= 20, `zu wenige Struktur-Karten: ${namen.length}`)
  assert.equal(benannt.length, namen.length, 'nicht jede Karte des Beispiels traegt einen Namen')

  // Die Namen sind die DIESES Textes, nicht die allgemeine Sechserliste.
  for (const erwartet of ['Anlass', 'Begründung', 'Einwand', 'Notiz']) {
    assert.ok(namen.includes(erwartet), `„${erwartet}" fehlt in der Struktur-Spalte: ${JSON.stringify([...new Set(benannt)])}`)
  }

  // „Freier Absatz" war ein Etikett ohne Aussage — es sah aus wie eine Angabe und war keine.
  const text = await page.evaluate(() => document.body.innerText)
  assert.ok(!text.includes('Freier Absatz'), '„Freier Absatz" steht wieder auf dem Schirm')

  // Kein Schluessel, keine Anfrage: eine Vorfuehrung soll nichts kosten.
  const laeufe = await page.evaluate(() => (window.AIWT.state.laufJournal?.eintraege || []).length)
  assert.equal(laeufe, 0, 'das Beispielprojekt hat einen bezahlten Lauf ausgeloest')

  // Und die Namen ueberstehen ein Neuladen — sie liegen neben dem Text, nicht im Text.
  await page.reload({ waitUntil: 'networkidle' })
  await warteAufApp(page)
  await warteAufKarten(page)
  const nachNeuladen = (await kartenNamen(page)).filter(Boolean)
  assert.equal(nachNeuladen.length, benannt.length, 'nach dem Neuladen fehlen Namen')

  await context.close()
}

// ---------- 2. + 3. Die Schreibpause stoesst den Lauf an ----------

async function pruefeLauf(browser) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await frischeApp(page)

  // Fester Fake-Transport: NUR der Bausteinarten-Kanal antwortet mit Inhalt, alle
  // anderen mit leeren Listen. So bleibt eindeutig, welcher Lauf was bewirkt hat.
  await page.evaluate(() => {
    window.__bausteinAufrufe = []
    window.AIWT.setzeTransportFuerTests({
      async hatSchluessel() { return true },
      async setzeSchluessel() {},
      async loescheSchluessel() {},
      sende(anfrage, handlers) {
        const schema = anfrage?.body?.output_config?.format?.schema
        let text = '{}'
        if (schema?.properties?.arten) {
          window.__bausteinAufrufe.push(anfrage)
          text = JSON.stringify({
            textsorte: 'Essay',
            arten: [
              { name: 'These', beschreibung: 'Die tragende Behauptung.', funktion: 'claim' },
              { name: 'Einwand', beschreibung: 'Spricht dagegen.', funktion: 'counterpoint' },
            ],
            zuordnung: [
              { blockId: 'b-these', art: 'These' },
              { blockId: 'b-einwand', art: 'Einwand' },
            ],
          })
        } else if (schema?.properties?.hinweise) {
          text = JSON.stringify({ hinweise: [] })
        } else if (schema?.properties?.erweiterungen) {
          text = JSON.stringify({ erweiterungen: [] })
        }
        setTimeout(() => handlers.onFertig({
          text,
          usage: { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
          stopReason: 'end_turn',
        }), 5)
      },
    })
  })

  // Ein EIGENES Projekt: im Beispiel ist der Lauf ausgeschlossen.
  await page.evaluate(() => {
    const A = window.AIWT
    const projekt = A.newProject('Bausteinlauf-Probe')
    A.newDoc()
    const doc = A.state.docs.find(item => item.id === A.state.active)
    doc.projectId = projekt.id
    A.__blockIdentityTestBridge.setContent([
      { type: 'paragraph', attrs: { blockId: 'b-these' }, content: [{ type: 'text', text: 'Ruhige Technik bleibt in der Peripherie und meldet sich nur, wenn es zaehlt.' }] },
      { type: 'paragraph', attrs: { blockId: 'b-einwand' }, content: [{ type: 'text', text: 'So absolut laesst sich das nicht halten, ein Rauchmelder muss laut sein.' }] },
    ])
    A.flushSave()
  })

  // Echtes Tippen — nur das setzt den Eingabe-Zeitstempel, an dem der Pausen-Ausloeser haengt.
  await page.click('.ProseMirror')
  await page.keyboard.press('End')
  await page.keyboard.type(' Und noch ein Halbsatz.')

  // Der Ausloeser wartet AGENT_IDLE_MS (3000 ms) nach der letzten Eingabe.
  await page.waitForFunction(
    () => (window.AIWT.state.laufJournal?.eintraege || []).some(eintrag => eintrag.kanal === 'bausteine'),
    null,
    { timeout: 20000 },
  ).catch(() => {})

  const journal = await page.evaluate(() => (window.AIWT.state.laufJournal?.eintraege || [])
    .map(eintrag => ({ kanal: eintrag.kanal, ausloeser: eintrag.ausloeser })))
  assert.ok(
    journal.some(eintrag => eintrag.kanal === 'bausteine'),
    `die Schreibpause hat keinen Bausteinlauf ausgeloest — Journal: ${JSON.stringify(journal)}`,
  )

  // Der Auftrag traegt das Projektwissen: die Textsorte wird nicht geraten (Entscheidung 2).
  const auftrag = await page.evaluate(() => {
    const anfrage = window.__bausteinAufrufe[0]
    return anfrage ? JSON.stringify(anfrage.body.messages[0].content.map(teil => teil.text)) : ''
  })
  assert.ok(auftrag.includes('Absätze'), 'das Absatzverzeichnis fehlt im Auftrag')

  // Und die Antwort steht danach in der Ablage — neben dem Text, nicht im Text.
  const ablage = await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(item => item.id === window.AIWT.state.active)
    const bestand = doc?.workspace?.bausteinarten
    return bestand ? {
      textsorte: bestand.textsorte,
      arten: bestand.arten.map(art => art.name),
      claimArten: bestand.arten.filter(art => art.funktion === 'claim').map(art => art.name),
      zugeordnet: Object.keys(bestand.zuordnung).length,
    } : null
  })
  assert.ok(ablage, 'nach dem Lauf liegt keine Ablage am Dokument')
  assert.equal(ablage.textsorte, 'Essay')
  assert.deepEqual(ablage.arten, ['These', 'Einwand'])
  assert.equal(ablage.zugeordnet, 2, 'nicht beide Absaetze wurden zugeordnet')
  // Genau eine zentrale Aussage — argument-projection.mjs verlangt genau eine und kehrt
  // sonst wirkungslos zurueck.
  assert.deepEqual(ablage.claimArten, ['These'])

  // Die erkannten Namen erscheinen in der Struktur-Spalte.
  const namen = (await kartenNamen(page)).filter(Boolean)
  assert.ok(namen.includes('These'), `„These" fehlt in der Struktur-Spalte: ${JSON.stringify(namen)}`)
  assert.ok(namen.includes('Einwand'), `„Einwand" fehlt in der Struktur-Spalte: ${JSON.stringify(namen)}`)

  // Die unsichtbare Funktion speist block.role und damit die Rechenlogik.
  const rollen = await page.evaluate(() => window.AIWT.__workspaceTestBridge.snapshot?.()?.blocks?.map(b => b.role) || null)
  if (rollen) assert.ok(rollen.includes('claim'), `keine zentrale Aussage in block.role: ${JSON.stringify(rollen)}`)

  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await pruefeBeispiel(browser)
  await pruefeLauf(browser)
  console.log('Bausteine smoke: PASS')
} finally {
  await browser.close()
  if (staticServer) await new Promise(closed => staticServer.close(closed))
}
