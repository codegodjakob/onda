// Die Quellen am laufenden Programm: der Baum in der Seitenleiste mit seinen zwei
// getrennten Gesten, und das Quellen-Fenster, in dem der Mensch umbenennt, verschiebt,
// Gruppen anlegt und wieder auflöst.
//
// Gemessen wird im Browser, nicht in der Quelle: was im Blatt steht, ist erst dann
// wahr, wenn keine spätere Regel es überschreibt.

import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const mimeByExtension = {
  '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.woff2': 'font/woff2',
}

// Eigener Server auf eigenem Port. Ein fester Port kann einer fremden Sitzung gehören —
// dann misst man deren Code und hält das Ergebnis für seines.
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

const ruhe = locator => locator.evaluate(async node => {
  await Promise.all(node.getAnimations({ subtree: true }).map(bewegung => bewegung.finished.catch(() => {})))
})

// Die Quellen kommen so ins Projekt, wie sie im echten Betrieb aussehen: der Titel
// steckt in metadata.title.value (source-model.mjs normalizeMetadata macht daraus
// IMMER ein Objekt). Genau daran ist die Anzeige schon einmal gescheitert und hat
// „[object Object]" in den Baum geschrieben.
async function projektMitQuellen(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.evaluate(() => {
    window.AIWT.newProject('Quellen-Prüfung')
    window.AIWT.newDoc()
    const state = window.AIWT.state
    const project = state.projects.find(kandidat => kandidat.id === state.activeProject)
    const quelle = (id, titel) => ({
      id,
      projectId: project.id,
      type: 'web',
      origin: { kind: 'url', immutableRef: `https://beispiel.de/${id}`, originalUrl: `https://beispiel.de/${id}` },
      original: { mediaType: 'text/html', sections: [{ id: 'import', heading: 'Abschnitt', text: `Text zu ${titel}.` }] },
      checksumSha256: 'a'.repeat(64),
      importedAt: Date.now(),
      provenance: { actor: 'user', action: 'import' },
      metadata: { title: { value: titel, status: 'user-provided' } },
      derived: {}, status: 'active', locators: [], history: [],
    })
    project.sources = [
      quelle('q1', 'Calm Technology'),
      quelle('q2', 'Die Grenzen der Aufmerksamkeit'),
      quelle('q3', 'Werkzeuge, die verschwinden'),
      quelle('q4', 'Notizen aus dem Archiv'),
    ]
    project.quellenThemen = [
      { id: 'thema-1', name: 'Aufmerksamkeit', warum: 'Beide fragen, worauf Menschen achten.', quellenIds: ['q1', 'q2'], vonKi: true, handverschoben: [] },
      { id: 'thema-2', name: 'Werkzeuggestaltung', warum: 'Wie Geräte in den Hintergrund treten.', quellenIds: ['q3'], vonKi: true, handverschoben: [] },
    ]
    window.AIWT.openDoc(state.active)
  })
  await page.locator('#editor .ProseMirror').waitFor({ state: 'visible' })
}

async function oeffneBaum(page) {
  const klappe = page.locator('#materialTreeToggle')
  if (await klappe.getAttribute('aria-expanded') === 'false') await klappe.click()
  await page.locator('#materialTree').waitFor({ state: 'visible' })
}

// --- 1. Der Baum: zwei Gesten, klar getrennt --------------------------------
async function pruefeBaum(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const fehler = []
  page.on('pageerror', error => fehler.push(error.message))
  await projektMitQuellen(page)
  await oeffneBaum(page)

  // Jede Gruppe des Agenten steht mit ihrem Namen da, plus die Quellen, die noch
  // niemand zugeordnet hat — sichtbar, damit sie niemand verliert.
  const gruppen = await page.locator('#materialTree .onda-baum-name-text').allTextContents()
  assert.deepEqual(gruppen, ['Aufmerksamkeit', 'Werkzeuggestaltung', 'Noch ohne Thema'])

  // „[object Object]" wäre das, was ein direkt in einen String gezwungenes
  // metadata.title ergibt. Es darf nirgends stehen.
  // Zugeklappt heißt zugeklappt: vor dem Aufklappen steht keine Quelle auf dem Schirm.
  assert.equal(await page.locator('#materialTree .onda-baum-quelle:visible').count(), 0)
  await page.locator('#materialTree .onda-baum-pfeil').first().click()
  const titel = await page.locator('#materialTree .onda-baum-quelle:visible').allTextContents()
  assert.deepEqual(titel, ['Calm Technology', 'Die Grenzen der Aufmerksamkeit'])

  // Zwei Gesten, zwei Knöpfe: der PFEIL klappt (aria-expanded), der NAME öffnet das
  // Fenster (aria-haspopup). Ein Knopf könnte keins von beidem ankündigen.
  const zeile = page.locator('#materialTree .onda-baum-kopf').first()
  const masse = await zeile.evaluate(node => {
    const pfeil = node.querySelector('.onda-baum-pfeil')
    const name = node.querySelector('.onda-baum-name')
    return {
      pfeilExpanded: pfeil.getAttribute('aria-expanded'),
      pfeilPopup: pfeil.getAttribute('aria-haspopup'),
      pfeilName: pfeil.getAttribute('aria-label'),
      pfeilKasten: pfeil.getBoundingClientRect(),
      namePopup: name.getAttribute('aria-haspopup'),
      nameExpanded: name.getAttribute('aria-expanded'),
      nameName: name.getAttribute('aria-label'),
      nameKasten: name.getBoundingClientRect(),
      steuert: pfeil.getAttribute('aria-controls'),
      kinderId: node.nextElementSibling.id,
    }
  })
  assert.equal(masse.pfeilExpanded, 'true')
  assert.equal(masse.pfeilPopup, null, 'der Pfeil öffnet kein Fenster')
  assert.equal(masse.namePopup, 'dialog')
  assert.equal(masse.nameExpanded, null, 'der Name klappt nichts auf')
  assert.equal(masse.steuert, masse.kinderId, 'der Pfeil zeigt nicht auf die Kinder, die er öffnet')
  assert.ok(masse.pfeilKasten.height >= 44, `Der Pfeil ist ${masse.pfeilKasten.height}px hoch`)
  assert.ok(masse.pfeilKasten.width >= 44, `Der Pfeil ist ${masse.pfeilKasten.width}px breit`)
  assert.ok(masse.nameKasten.height >= 44, `Der Name ist ${masse.nameKasten.height}px hoch`)
  // Die Zurückhaltung gilt den Augen, nicht der Zugänglichkeit: die Zahl steht nicht
  // auf dem Schirm, aber ein Vorlesegerät erfährt sie.
  assert.match(masse.nameName, /Aufmerksamkeit öffnen, 2 Quellen/)
  assert.match(masse.pfeilName, /Aufmerksamkeit zuklappen/)

  // Der Pfeil klappt zu und öffnet dabei kein Fenster.
  await page.locator('#materialTree .onda-baum-pfeil').first().click()
  assert.equal(await page.locator('#materialTree .onda-baum-pfeil').first().getAttribute('aria-expanded'), 'false')
  assert.equal(await page.locator(`#${masse.kinderId}`).isHidden(), true)
  assert.equal(await page.locator('#materialModal').count(), 0, 'der Pfeil hat ein Fenster geöffnet')
  // Der Fokus bleibt am Pfeil — sonst wäre der Baum mit der Tastatur unbrauchbar.
  assert.equal(await page.evaluate(() => document.activeElement?.className), 'onda-baum-pfeil')

  // Der Name öffnet das Fenster bei genau dieser Gruppe.
  await page.locator('#materialTree .onda-baum-name').first().click()
  await page.locator('#materialModal').waitFor({ state: 'visible' })
  assert.equal(
    await page.locator('#materialModal .onda-blaetter__eintrag--gruppe[aria-current="true"] .onda-blaetter__eintrag-name').textContent(),
    'Aufmerksamkeit',
  )

  assert.deepEqual(fehler, [])
  await page.close()
}

// --- 2. Das Fenster: umbenennen, verschieben, anlegen, auflösen -------------
async function pruefeFenster(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  const fehler = []
  page.on('pageerror', error => fehler.push(error.message))
  await projektMitQuellen(page)

  // Harte Regel 1: die Schreibspalte gibt kein Pixel ab, auch nicht an ein Fenster.
  const vorher = await page.locator('#editor .ProseMirror').evaluate(n => n.getBoundingClientRect().width)
  await page.locator('#materialSources').click()
  const fenster = page.locator('#materialModal')
  await fenster.waitFor({ state: 'visible' })
  await ruhe(fenster)
  const nachher = await page.locator('#editor .ProseMirror').evaluate(n => n.getBoundingClientRect().width)
  assert.equal(nachher, vorher, `Die Schreibspalte schrumpfte von ${vorher} auf ${nachher}px`)

  // Der Text bleibt am Rand sichtbar und abgedunkelt — man weiß, dass man nur nachschaut.
  const schleier = await page.locator('.onda-dialog-scrim').evaluate(node => {
    const stil = getComputedStyle(node)
    return { hintergrund: stil.backgroundColor, polster: stil.padding }
  })
  assert.match(schleier.hintergrund, /rgba/, 'der Schleier ist undurchsichtig')
  assert.notEqual(parseFloat(schleier.polster), 0, 'das Fenster füllt den ganzen Schirm')

  // „KEINE VERSALIEN IM GANZEN PROGRAMM."
  const versalien = await page.evaluate(() => [...document.querySelectorAll('#materialModal *')]
    .filter(node => !node.children.length && node.offsetParent)
    .filter(node => getComputedStyle(node).textTransform === 'uppercase')
    .map(node => node.textContent.trim().slice(0, 24)))
  assert.deepEqual(versalien, [])

  // Eine Gruppe ist ein Eintrag: sie führt zu ihrem Namen und ihrer Begründung.
  await page.locator('#materialModal .onda-blaetter__eintrag--gruppe').first().click()
  const nameFeld = page.locator('#materialModal .onda-blaetter__tiefe .onda-pv-input').first()
  assert.equal(await nameFeld.inputValue(), 'Aufmerksamkeit')
  await nameFeld.fill('Ablenkung')
  await page.locator('#materialModal .onda-blaetter__tiefe').click({ position: { x: 5, y: 5 } })
  assert.equal(
    await page.evaluate(() => window.AIWT.state.projects
      .find(p => p.id === window.AIWT.state.activeProject).quellenThemen[0].name),
    'Ablenkung',
  )
  // Umbenannt heißt: die Gruppe gehört jetzt dem Menschen.
  assert.equal(
    await page.evaluate(() => window.AIWT.state.projects
      .find(p => p.id === window.AIWT.state.activeProject).quellenThemen[0].vonKi),
    false,
  )

  // Verschieben ohne Ziehen: eine Auswahlliste, die auch mit der Tastatur geht.
  await page.locator('#materialModal .onda-blaetter__eintrag--kind').first().click()
  await page.locator('.onda-quellen-thema-wahl').selectOption({ label: 'Werkzeuggestaltung' })
  const nachUmzug = await page.evaluate(() => window.AIWT.state.projects
    .find(p => p.id === window.AIWT.state.activeProject).quellenThemen
    .map(thema => ({ name: thema.name, ids: thema.quellenIds, hand: thema.handverschoben })))
  assert.deepEqual(nachUmzug[0].ids, ['q2'])
  assert.deepEqual(nachUmzug[1].ids, ['q3', 'q1'])
  assert.deepEqual(nachUmzug[1].hand, ['q1'], 'die Handbewegung muss als solche vermerkt sein')

  // Gruppe anlegen: der Fokus landet im Namensfeld — „Neue Gruppe" ist noch keine.
  await page.locator('#quellenGruppeNeu').click()
  await page.waitForFunction(() => document.activeElement?.classList.contains('onda-pv-input'))
  assert.equal(await page.evaluate(() => document.activeElement.value), 'Neue Gruppe')

  // Auflösen nimmt die Kiste, nicht den Inhalt.
  await page.locator('#materialModal .onda-blaetter__eintrag--gruppe').first().click()
  const aufloesen = page.locator('#materialModal .onda-blaetter__eintrag--still')
  assert.match(await aufloesen.getAttribute('aria-label'), /die Quellen bleiben/)
  await aufloesen.click()
  const nachAufloesen = await page.evaluate(() => {
    const project = window.AIWT.state.projects.find(p => p.id === window.AIWT.state.activeProject)
    return { quellen: project.sources.length, themen: project.quellenThemen.map(thema => thema.name) }
  })
  assert.equal(nachAufloesen.quellen, 4, 'eine Quelle ist mit ihrer Gruppe gefallen')
  assert.equal(nachAufloesen.themen.includes('Ablenkung'), false)
  assert.match(await page.locator('#quellenMeldung').textContent(), /aufgelöst/)
  // Die rechte Tafel darf nicht weiter eine Gruppe zeigen, die es nicht mehr gibt.
  // Sie tat es: der Fokus stand auf dem Knopf, und die Tipp-Sperre hielt den Neuaufbau
  // auf. Jetzt steht dort wieder die Bibliothek, und der Fokus an einer Stelle, die es
  // noch gibt — sonst finge das Fenster den Tastaturweg nicht mehr.
  assert.equal(await page.locator('#materialModal .onda-blaetter__eintrag--still').count(), 0)
  assert.equal(await page.locator('#materialModal .source-import-form').count(), 1)
  assert.equal(await page.evaluate(() => document.activeElement?.dataset?.blattId), 'bibliothek')
  // Die freigewordenen Quellen stehen sichtbar unter „Noch ohne Thema" — nicht verloren.
  const nachher2 = await page.locator('#materialModal .onda-blaetter__eintrag--gruppe .onda-blaetter__eintrag-name').allTextContents()
  assert.ok(nachher2.includes('Noch ohne Thema'), `Die Gruppen heißen ${nachher2.join(', ')}`)

  // Die Zurückhaltung gilt den Augen, nicht der Zugänglichkeit.
  const axe = await new AxeBuilder({ page }).include('#materialModal')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const schwer = axe.violations.filter(fund => ['critical', 'serious'].includes(fund.impact))
  assert.deepEqual(schwer.map(fund => ({ id: fund.id, ziele: fund.nodes.map(n => n.target) })), [])

  assert.deepEqual(fehler, [])
  await context.close()
}

// --- 3. Ohne KI-Anschluss bleibt alles stehen, wo es steht ------------------
async function pruefeOhneSchluessel(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await projektMitQuellen(page)
  await page.locator('#materialSources').click()
  await page.locator('#materialModal').waitFor({ state: 'visible' })

  // Der Lauf wird beim Öffnen versucht — ohne Schlüssel passiert nichts, still und
  // ohne Kosten, und die Gruppen bleiben unberührt.
  await page.locator('#quellenOrdnen').click()
  await page.locator('#quellenMeldung').waitFor({ state: 'visible' })
  assert.match(await page.locator('#quellenMeldung').textContent(), /Ohne KI-Anschluss/)
  const themen = await page.evaluate(() => window.AIWT.state.projects
    .find(p => p.id === window.AIWT.state.activeProject).quellenThemen.map(thema => thema.name))
  assert.deepEqual(themen, ['Aufmerksamkeit', 'Werkzeuggestaltung'])
  await page.close()
}

const browser = await chromium.launch()
try {
  await pruefeBaum(browser)
  await pruefeFenster(browser)
  await pruefeOhneSchluessel(browser)
  console.log('Quellen smoke: PASS')
} finally {
  await browser.close()
  staticServer?.close()
}
