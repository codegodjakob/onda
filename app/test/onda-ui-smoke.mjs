import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

import { ALL_ANNOTATION_KINDS } from '../src/annotation-contract.mjs'
import { MINDEST_BREITE, MINDEST_HOEHE } from '../src/onda-blase.mjs'
import { ensureProjectSidebarOpen } from './helpers/onda-navigation.mjs'

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const requestedSection = process.argv.includes('--section')
  ? process.argv[process.argv.indexOf('--section') + 1]
  : 'all'
const screenshots = process.argv.includes('--screenshots')
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
  await new Promise(resolveListening => staticServer.listen(0, '127.0.0.1', resolveListening))
  baseUrl = `http://127.0.0.1:${staticServer.address().port}/`
}

async function runComponents(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const expected = {
    rechtschreibung: 'correction', satzstil: 'rewrite', uebergang: 'insertion',
    verschieben: 'slot', ton: 'region', beleg: 'source', widerspruch: 'compare',
    luecke: 'dialogue', ueberschrift: 'title',
  }
  for (const [kind, form] of Object.entries(expected)) {
    await page.goto(`${baseUrl}annotation-lab.html?kind=${kind}`, { waitUntil: 'networkidle' })
    const surface = page.locator(`[data-annotation-form="${form}"]`)
    assert.equal(await surface.count(), 1, `${kind} muss als ${form} erscheinen`)
    assert.ok((await surface.getAttribute('aria-label'))?.length > 0)
  }
  await page.goto(`${baseUrl}annotation-lab.html?kind=beleg`, { waitUntil: 'networkidle' })
  assert.equal(await page.locator('.aura-note__srcmeta script').count(), 0)
  await page.close()
}

async function runLab(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
  await page.goto(`${baseUrl}annotation-lab.html`, { waitUntil: 'networkidle' })
  const rendered = await page.locator('[data-annotation-kind]').evaluateAll(nodes => (
    nodes.map(node => node.dataset.annotationKind)
  ))
  assert.deepEqual(rendered.sort(), [...ALL_ANNOTATION_KINDS].sort())

  if (screenshots) {
    const directory = resolve(appRoot, 'evals/results/screenshots')
    await mkdir(directory, { recursive: true })
    for (const theme of ['light', 'dark']) {
      for (const width of [1280, 1024, 720, 320]) {
        await page.setViewportSize({ width, height: 1000 })
        await page.goto(`${baseUrl}annotation-lab.html?theme=${theme}`, { waitUntil: 'networkidle' })
        await page.screenshot({ path: resolve(directory, `annotation-lab-${theme}-${width}.png`), fullPage: true })
      }
    }
  }
  await page.close()
}

async function openExample(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
  await page.locator('#doclist .doc').first().click()
}

async function runEditor(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await openExample(page)
  const seeded = await page.evaluate(() => {
    // Der Beispieltext bringt seit dem 07.08.2026 alle 29 Anmerkungsarten mit,
    // damit Jakob jeden Anwendungsfall durchklicken kann. Einige davon zaehlen
    // zur Integritaet und stehen deshalb VOR jeder eingesetzten Anmerkung —
    // createdAt: -1 genuegt dann nicht mehr, um vorne zu stehen.
    // Diese Pruefung gilt der Umschreibungs-Form, nicht der Reihenfolge der
    // Warteschlange: sie raeumt die mitgelieferten Anmerkungen deshalb weg und
    // arbeitet mit genau einer eigenen.
    const doc = window.AIWT.state.docs.find(candidate => candidate.id === window.AIWT.state.active)
    doc.findings = []
    doc.lane = []
    const block = window.AIWT.__blockIdentityTestBridge.getBlocks().find(candidate => candidate.text.length > 24)
    if (!block) return null
    const target = block.text.slice(0, Math.min(32, block.text.length))
    const finding = {
      id: 'onda-editor-smoke', status: 'open', placement: 'passage', blockId: block.id,
      target, action: `${target} — präzisiert`, short: 'Der Satz lässt sich präziser führen.',
      why: 'Die Kernaussage wird früher sichtbar.', folge: 'Die Aussage bleibt gleich.',
      anmerkungsart: 'satzstil', createdAt: -1,
    }
    window.AIWT.__workspaceTestBridge.injectFinding(finding)
    return { blockId: block.id, target, action: finding.action }
  })
  assert.ok(seeded)
  await page.locator('[data-annotation-form="rewrite"]').waitFor({ state: 'visible' })
  assert.equal(await page.locator('.local-finding-detail-row').count(), 0)
  // Über dem Text steht nichts (docs/PHILOSOPHIE.md §1 "Der andere Stift"). Geblieben
  // ist ein Stift-Zeichen in der Topbar, das nicht zählt — aber Vorlesegeräten den
  // vollen Wortlaut gibt.
  assert.equal(await page.locator('#annotationReviewBar').count(), 0, 'Die Anmerkungsleiste ist zurück')
  const zeichen = page.locator('#annotationPresence')
  assert.equal(await zeichen.isVisible(), true, 'Ohne Zeichen wäre gar nicht zu sehen, dass jemand mitschreibt')
  assert.equal((await zeichen.textContent()).trim(), '', 'Das Zeichen zeigt eine Zahl — es soll nur ein Stift sein')
  assert.match(await zeichen.getAttribute('aria-label'), /Empfehlung/)

  // Der Knopf hiess "Fassung übernehmen" und heisst seit dem 07.08.2026
  // "Übernehmen" — so steht er im Design System (components/annotation/
  // Rewrite.jsx: acceptLabel='Übernehmen'). Der Knopf wird ueber die Form
  // gesucht, nicht ueber den ganzen Bildschirm: eine Beschriftung, die
  // anderswo nochmal vorkommt, wuerde sonst den falschen treffen.
  await page.locator('[data-annotation-form="rewrite"]')
    .getByRole('button', { name: 'Übernehmen' }).click()
  assert.equal(await page.locator('#editor .ProseMirror').textContent().then(text => text.includes(seeded.action)), true)
  assert.equal(await page.evaluate(() => window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active).findings.find(item => item.id === 'onda-editor-smoke').status), 'resolved')

  // Rückgängig ohne Knopf. Solange die Anmerkung das Letzte war, was geschah, nimmt
  // Befehl+Z sie zurück — Text UND Vermerk, in einem Schritt.
  await page.locator('#editor .ProseMirror').click()
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
  await page.keyboard.press('ControlOrMeta+z')
  assert.equal(await page.locator('#editor .ProseMirror').textContent().then(text => text.includes(seeded.target)), true)
  assert.equal(await page.evaluate(() => window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active).findings.find(item => item.id === 'onda-editor-smoke').status), 'open')

  // Und die Gegenprobe: wer weiterschreibt, meint mit Befehl+Z sein eigenes Schreiben.
  // Ohne diese Grenze holte die Taste nach zwanzig Wörtern eine Anmerkung von vorhin
  // zurück.
  assert.equal(await page.evaluate(() => window.AIWT.__workspaceTestBridge.gehoertRueckgaengigDerAnmerkung()), false)

  // Ein Stilvorschlag verschwindet beim Verwerfen WORTLOS. Hier stand bis zum
  // 8.8.2026 die Frage „Was soll Onda daraus lernen?" mit drei Knöpfen, von denen
  // zwei aus dieser einen Anmerkung eine Dauerregel machten. Eine Anmerkung gilt für
  // eine Stelle in einem Text, einmal (Issue #38) — es gibt nichts zu wählen.
  await page.getByRole('button', { name: 'Original behalten' }).click()
  assert.equal(await page.evaluate(() => window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active).findings.find(item => item.id === 'onda-editor-smoke').status), 'dismissed')
  assert.equal(await page.getByRole('region', { name: 'Folge des Verwerfens wählen' }).count(), 0, 'Die Frage nach dem Verwerfungsumfang ist zurück')
  // Und keine Tafel: ein Satzstil-Vorschlag ist keine Integritätsfrage, ihn zu
  // verwerfen ist keine Risikoannahme.
  assert.equal(await page.locator('.integrity-risk-confirmation').count(), 0, 'Die Risiko-Tafel erscheint bei einem Stilvorschlag')
  // Auch das Verwerfen ist eine Entscheidung über eine Anmerkung — dieselbe Taste holt
  // sie zurück. Früher lag dafür ein Link "Entscheidung zurücknehmen" in der Leiste.
  await page.locator('#editor .ProseMirror').click()
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))))
  await page.keyboard.press('ControlOrMeta+z')
  assert.equal(await page.evaluate(() => window.AIWT.state.docs.find(doc => doc.id === window.AIWT.state.active).findings.find(item => item.id === 'onda-editor-smoke').status), 'open')

  await page.evaluate(({ blockId, target }) => {
    window.AIWT.__workspaceTestBridge.injectFinding({
      id: 'onda-note-smoke', status: 'open', placement: 'passage', blockId,
      target, short: 'Was genau soll aus dieser Notiz werden?',
      why: 'Die Notiz ist noch offen.', folge: 'Erst die Antwort erlaubt eine Ausformulierung.',
      anmerkungsart: 'nachfrage', createdAt: -2, thread: [],
    })
  }, seeded)
  // Eine Notiz-Anmerkung erscheint OHNE Umschalten. Früher lag "nachfrage" hinter dem
  // Arbeitsmodus "Notizen" und war im Modus "Text" unsichtbar; der Umschalter saß in
  // der Anmerkungsleiste. Beide sind fort (docs/PHILOSOPHIE.md §1) — wer neben dir
  // schreibt, führt keine zwei getrennten Listen.
  await page.locator('[data-annotation-form="dialogue"][data-annotation-kind="nachfrage"]').waitFor({ state: 'visible' })
  assert.equal(await page.locator('[data-annotation-mode]').count(), 0, 'Der Arbeitsmodus-Umschalter ist zurück')
  await page.close()
}

// Die Tafel „Wissenschaftliches Risiko bewusst annehmen" (workspace.js
// renderIntegrityRiskConfirmation). Wer ein Risiko annimmt, tut es benannt: mit einer
// Begründung, die als Entscheidung stehenbleibt — statt dass eine Integritätsfrage
// still abgelegt wird.
//
// Der Weg dorthin ist seit dem 8.8.2026 (Issue #38) der normale Knopf: Wer eine
// Integritätsfrage verwirft, bekommt die Tafel. Wer einen Stilvorschlag verwirft,
// bekommt sie nicht — das prüft runEditor weiter oben.
//
// Bis dahin musste diese Prüfung den Zustand riskConfirmationFindingId von Hand
// stellen, weil Commit 92190c1 der Tafel ihren Auslöser genommen hatte. Dass sie
// jetzt klicken kann, IST der Beweis, dass der Auslöser zurück ist.
async function runRisikoTafel(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await openExample(page)

  // Setzt eine Integritätsfrage an den Text — mehr nicht. Die Tafel holt sich die
  // Prüfung danach selbst, über den Knopf.
  const setzeIntegritaetsfrage = (findingId, createdAt) => page.evaluate(({ id, at }) => {
    const block = window.AIWT.__blockIdentityTestBridge.getBlocks().find(kandidat => kandidat.text.length > 24)
    window.AIWT.__workspaceTestBridge.injectFinding({
      id, status: 'open', placement: 'passage', blockId: block.id, target: block.text.slice(0, 28),
      // 'source' ohne Textart IST eine Integritätsfrage: eine fehlende Textart bedeutet
      // fail-closed „alle vier" (textart-regeln.mjs integritaetsArten). Nur deshalb endet
      // das Verwerfen in 'risk-accepted' statt in 'dismissed'.
      category: 'source', anmerkungsart: 'beleg', priority: 'critical', createdAt: at,
      short: 'Für diese Aussage fehlt ein belastbarer Beleg.',
      why: 'Ohne Beleg bleibt die Aussage wissenschaftlich nicht abgesichert.',
      consequence: 'Die Arbeit kann an dieser Stelle eine unbelegte Behauptung enthalten.',
    })
  }, { id: findingId, at: createdAt })

  const zustand = findingId => page.evaluate(id => {
    const doc = window.AIWT.state.docs.find(kandidat => kandidat.id === window.AIWT.state.active)
    const entscheidung = doc.decisions.find(eintrag => eintrag.findingId === id)
    return {
      status: doc.findings.find(finding => finding.id === id).status,
      ausgang: entscheidung?.outcome ?? null,
      begruendung: entscheidung?.reason ?? null,
      verweis: doc.workspace.riskConfirmationFindingId,
      feldinhalt: doc.workspace.riskReason,
    }
  }, findingId)

  await setzeIntegritaetsfrage('onda-risiko-annehmen', -20)
  const anmerkung = page.locator('#localAgentLayer [data-finding-id="onda-risiko-annehmen"]')
  await anmerkung.waitFor({ state: 'visible' })
  // Die Tafel hängt IN der heutigen Anmerkung — dem .onda-annotation aus renderAnnotation.
  // Die alten Prüfungen suchten stattdessen die zweistufige Kurzzeile
  // .local-finding-summary; die gibt es seit dem 5.8.2026 nicht mehr, und genau daran
  // sind sie gescheitert.
  assert.equal(await anmerkung.evaluate(node => node.classList.contains('onda-annotation')), true)
  assert.equal(await anmerkung.getAttribute('data-annotation-form'), 'source')

  // Der Auslöser: der ganz normale Verwerfen-Knopf der Anmerkung.
  await anmerkung.getByRole('button', { name: 'Verwerfen', exact: true }).click()
  const tafel = anmerkung.locator('.integrity-risk-confirmation')
  await tafel.waitFor({ state: 'visible' })
  assert.equal(await tafel.getAttribute('aria-label'), 'Wissenschaftliches Risiko bewusst annehmen')
  // Wer ein Risiko annimmt, muss lesen können, welches. Die Folge steht auf der Tafel.
  assert.match(await tafel.textContent(), /unbelegte Behauptung/)
  assert.equal(await tafel.locator('textarea').getAttribute('aria-label'), 'Begründung für die bewusste Risikoannahme')

  // Die Begründung ist PFLICHT. Ohne sie ist der Bestätigungsknopf gesperrt — und der
  // Ausweg ist es nie, sonst wäre die Pflicht eine Sackgasse.
  const annehmen = tafel.getByRole('button', { name: 'Wissenschaftliches Risiko bewusst annehmen', exact: true })
  const abbrechen = tafel.getByRole('button', { name: 'Abbrechen', exact: true })
  assert.equal(await annehmen.isDisabled(), true, 'Ohne Begründung lässt sich das Risiko annehmen')
  assert.equal(await abbrechen.isDisabled(), false, 'Abbrechen ist gesperrt — die Pflicht wird zur Sackgasse')
  assert.equal(await tafel.locator('.integrity-risk-reason-label').textContent(), 'Begründung')
  // Der Ausweg steht zu lesen, nicht bloß im Knopf.
  assert.match(await tafel.textContent(), /Brich ab, dann bleibt die Anmerkung offen/)

  // Leerzeichen sind keine Begründung — sonst wäre die Pflicht mit der Leertaste umgangen.
  await tafel.locator('textarea').fill('    ')
  assert.equal(await annehmen.isDisabled(), true, 'Leerzeichen zählen als Begründung')

  await tafel.locator('textarea').fill('Die Quelle bleibt für diese Fassung bewusst offen.')
  assert.equal(await annehmen.isDisabled(), false, 'Der Knopf bleibt trotz Begründung gesperrt')
  await annehmen.click()
  await anmerkung.waitFor({ state: 'detached' })
  // Der Kern: nicht 'dismissed', sondern 'risk-accepted' — und die getippte Begründung
  // steht in der Entscheidung, nicht bloß im Feld.
  assert.deepEqual(await zustand('onda-risiko-annehmen'), {
    status: 'risk-accepted',
    ausgang: 'risk-accepted',
    begruendung: 'Die Quelle bleibt für diese Fassung bewusst offen.',
    verweis: null,
    feldinhalt: '',
  })

  // Und der andere Weg: Abbrechen nimmt kein Risiko an. Die Anmerkung bleibt offen, es
  // wird nichts festgeschrieben, und die halb getippte Begründung wird nicht heimlich
  // aufbewahrt.
  await setzeIntegritaetsfrage('onda-risiko-abbrechen', -19)
  const zweiteAnmerkung = page.locator('#localAgentLayer [data-finding-id="onda-risiko-abbrechen"]')
  await zweiteAnmerkung.waitFor({ state: 'visible' })
  await zweiteAnmerkung.getByRole('button', { name: 'Verwerfen', exact: true }).click()
  const zweite = zweiteAnmerkung.locator('.integrity-risk-confirmation')
  await zweite.waitFor({ state: 'visible' })
  await zweite.locator('textarea').fill('Doch nicht — ich suche den Beleg.')
  await zweite.getByRole('button', { name: 'Abbrechen', exact: true }).click()
  await page.locator('.integrity-risk-confirmation').waitFor({ state: 'detached' })
  assert.deepEqual(await zustand('onda-risiko-abbrechen'), {
    status: 'open',
    ausgang: null,
    begruendung: null,
    verweis: null,
    feldinhalt: '',
  })
  await page.close()

  // Der Ausweg muss auch auf einem FLACHEN Bildschirm sichtbar sein. „Sichtbar, nicht
  // bloß vorhanden" ist keine Formulierung, sondern eine Messung: Die Tafel ist hoch
  // (Folge, Feld, Hinweiszeile, zwei Knöpfe), und die Anmerkung richtete sich am Absatz
  // aus, ohne den Fensterrand zu kennen. Auf 640px Fensterhöhe lag „Abbrechen" dadurch
  // bei 644–676 — außerhalb des Bildes, und die Fläche rollt nicht. Dabei ist die Tafel
  // nur rund 550px hoch, hätte also gepasst. Ein Pflichtfeld, dessen Ausweg man nicht
  // erreicht, ist eine Sackgasse; genau der Ausweg macht die Pflicht vertretbar (#38).
  const flach = await browser.newPage({ viewport: { width: 1440, height: 640 } })
  await openExample(flach)
  await flach.evaluate(() => {
    const block = window.AIWT.__blockIdentityTestBridge.getBlocks().find(kandidat => kandidat.text.length > 24)
    const doc = window.AIWT.state.docs.find(kandidat => kandidat.id === window.AIWT.state.active)
    doc.findings = []
    doc.lane = []
    doc.coach = []
    doc.decisions = []
    window.AIWT.__workspaceTestBridge.injectFinding({
      id: 'onda-risiko-flach', status: 'open', placement: 'passage', blockId: block.id,
      target: block.text.slice(0, 28), category: 'source', anmerkungsart: 'beleg',
      priority: 'critical', createdAt: -17,
      short: 'Für diese Aussage fehlt ein belastbarer Beleg.',
      why: 'Ohne Beleg bleibt die Aussage wissenschaftlich nicht abgesichert.',
      consequence: 'Die Arbeit kann an dieser Stelle eine unbelegte Behauptung enthalten.',
    })
  })
  const flacheAnmerkung = flach.locator('#localAgentLayer [data-finding-id="onda-risiko-flach"]')
  await flacheAnmerkung.waitFor({ state: 'visible' })
  await flacheAnmerkung.getByRole('button', { name: 'Verwerfen', exact: true }).click()
  await flach.locator('.integrity-risk-confirmation').waitFor({ state: 'visible' })
  const lage = await flach.evaluate(() => {
    const kasten = document.querySelector('.integrity-risk-cancel').getBoundingClientRect()
    return { oben: kasten.top, unten: kasten.bottom, fenster: window.innerHeight }
  })
  assert.ok(
    lage.unten <= lage.fenster && lage.oben >= 0,
    `„Abbrechen" liegt außerhalb des Bildes: ${Math.round(lage.oben)}–${Math.round(lage.unten)} bei ${lage.fenster}px Fensterhöhe`,
  )
  await flach.close()
}

// „Hinweise ohne sichere Textstelle" (workspace.js unplacedPassageFindings /
// renderUnplacedFindingList). Ein Hinweis, dessen Ziel zweimal im Text vorkommt oder
// dessen Absatz gelöscht wurde, verschwindet nicht still — er sammelt sich im
// Agentenfeld. Bisher war das weder im Browser noch am Modell geprüft.
async function runHinweiseOhneStelle(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await openExample(page)

  const bloecke = await page.evaluate(() => {
    const bridge = window.AIWT.__blockIdentityTestBridge
    // Zwei Absätze mit DERSELBEN Wendung: dadurch findet resolveFindingPlacement zwei
    // Treffer und kann sich nicht entscheiden ('ambiguous'). Ein einziger Treffer würde
    // die Stelle festnageln, und der Hinweis stünde am Text statt in der Liste.
    bridge.setContent({
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Eine doppelte Wendung steht hier im ersten Absatz.' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Auch im zweiten Absatz steht eine doppelte Wendung.' }] },
      ],
    })
    const doc = window.AIWT.state.docs.find(kandidat => kandidat.id === window.AIWT.state.active)
    // Leergeräumt, damit die Liste genau die gestellten Fälle zählt. Ohne das kämen die
    // 29 Anmerkungen des Beispieltextes dazu, deren Blöcke der neue Inhalt gerade
    // fortgenommen hat — sie wären selbst unplatziert und würden die Prüfung verwaschen.
    //
    // ALLE DREI Listen müssen fort: ensureReasoningModel (reasoning-model.mjs) füllt
    // doc.findings bei JEDEM Aufruf wieder aus doc.lane und doc.coach nach. Wer nur
    // findings leert, bekommt sie beim nächsten Zeichnen zurück.
    doc.findings = []
    doc.lane = []
    doc.coach = []
    const werkstatt = window.AIWT.__workspaceTestBridge
    werkstatt.injectFinding({
      id: 'onda-mehrdeutig', status: 'open', placement: 'passage', createdAt: -30,
      // KEIN blockId: die Stelle wird über den Wortlaut gesucht — und zweimal gefunden.
      target: 'doppelte Wendung',
      short: 'Diese Wendung wiederholt sich.',
      why: 'Zweimal dieselbe Formulierung schwächt beide Stellen.',
      anmerkungsart: 'satzstil',
    })
    werkstatt.injectFinding({
      id: 'onda-block-fort', status: 'open', placement: 'passage', createdAt: -29,
      // Der Absatz, an dem dieser Hinweis hing, ist gelöscht.
      blockId: 'block-den-es-nicht-mehr-gibt', target: 'ein längst gelöschter Wortlaut',
      short: 'Der Absatz zu diesem Hinweis ist fort.',
      why: 'Der Hinweis hing an einem Block, den es nicht mehr gibt.',
      anmerkungsart: 'satzstil',
    })
    return bridge.getBlocks().map(block => block.id)
  })

  await page.locator('#ondaAura').click()
  const agentenfeld = page.locator('#agentWidget')
  await agentenfeld.waitFor({ state: 'visible' })
  const liste = agentenfeld.locator('.unplaced-findings')
  await liste.waitFor({ state: 'visible' })
  assert.equal(
    await liste.locator('.unplaced-findings-title').textContent(),
    'Hinweise ohne sichere Textstelle',
  )

  const eintraege = () => liste.locator('.unplaced-finding').evaluateAll(knoten => knoten.map(node => ({
    id: node.dataset.findingId,
    grund: node.querySelector('.unplaced-finding-kind').textContent,
    text: node.querySelector('.unplaced-finding-text').textContent,
  })))
  // Beide Gründe stehen dabei, und sie sind unterschiedlich benannt: mehrdeutig ist
  // etwas anderes als verschwunden, und wer die Liste liest, soll das sehen.
  assert.deepEqual(await eintraege(), [
    { id: 'onda-mehrdeutig', grund: 'Mehrere mögliche Stellen', text: 'Diese Wendung wiederholt sich.' },
    { id: 'onda-block-fort', grund: 'Textstelle nicht auffindbar', text: 'Der Absatz zu diesem Hinweis ist fort.' },
  ])

  // Die Gegenprobe. Ohne sie bestünde die Prüfung auch dann noch, wenn die Liste stumpf
  // jeden Hinweis aufzählte: Was eine sichere Stelle hat, gehört an den Text und NICHT
  // in diese Liste.
  await page.evaluate(blockId => {
    window.AIWT.__workspaceTestBridge.injectFinding({
      id: 'onda-sichere-stelle', status: 'open', placement: 'passage', createdAt: -28,
      blockId, target: 'im ersten Absatz',
      short: 'Diese Stelle ist eindeutig.',
      why: 'Der Wortlaut kommt genau einmal vor.',
      anmerkungsart: 'satzstil',
    })
  }, bloecke[0])
  await page.locator('#localAgentLayer [data-finding-id="onda-sichere-stelle"]').waitFor({ state: 'visible' })
  assert.deepEqual((await eintraege()).map(eintrag => eintrag.id), ['onda-mehrdeutig', 'onda-block-fort'])
  await page.close()
}

async function runShell(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  assert.equal(await page.locator('main').count(), 1, 'Die App braucht genau einen Hauptbereich')
  assert.equal(await page.locator('.onda-app-shell').count(), 1, 'Die gemeinsame Onda-Shell fehlt')
  assert.equal(await page.getByRole('navigation', { name: 'Bibliothek' }).isVisible(), true)
  assert.equal(await page.locator('#home .onda-aura').count(), 0, 'Die Bibliothek darf keine dekorative Aura tragen')
  assert.equal(await page.locator('#ondaAura').count(), 1, 'Es darf genau einen KI-Einstieg mit Aura geben')

  await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
  await page.locator('#doclist .doc').first().click()
  assert.equal(await page.getByRole('navigation', { name: 'Projekt' }).isVisible(), true)
  assert.equal(await page.locator('#ondaAura').isVisible(), true, 'Der KI-Einstieg muss im Editor sichtbar sein')

  const editorWidth = await page.locator('#editor .ProseMirror').evaluate(node => node.getBoundingClientRect().width)
  assert.ok(editorWidth >= 640 && editorWidth <= 680, `Die Schreibspalte ist ${editorWidth}px statt 640–680px breit`)
  assert.equal(await page.locator('#title').evaluate(node => getComputedStyle(node).fontSize), '40px')
  assert.equal(await page.locator('.onda-editor-col').evaluate(node => getComputedStyle(node).borderTopRightRadius), '0px')

  if (screenshots) {
    const directory = resolve(appRoot, 'evals/results/screenshots')
    await mkdir(directory, { recursive: true })
    for (const width of [1440, 1024, 720, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      await page.locator('#editorView').evaluate(async node => {
        await Promise.all(node.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})))
      })
      await page.screenshot({ path: resolve(directory, `onda-editor-${width}.png`), fullPage: true })
    }
    await page.setViewportSize({ width: 1280, height: 900 })
    await ensureProjectSidebarOpen(page)
    await page.getByRole('button', { name: 'Zur Projektübersicht' }).click()
    await page.screenshot({ path: resolve(directory, 'onda-library-1280.png'), fullPage: true })
    await page.setViewportSize({ width: 320, height: 760 })
    await page.screenshot({ path: resolve(directory, 'onda-library-320.png'), fullPage: true })
    await page.locator('#doclist .doc').first().click()

    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
    for (const width of [1440, 320]) {
      await page.setViewportSize({ width, height: 1000 })
      if (width === 1440) await ensureProjectSidebarOpen(page)
      await page.locator('#editorView').evaluate(async node => {
        await Promise.all(node.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})))
      })
      await page.screenshot({ path: resolve(directory, `onda-editor-dark-${width}.png`), fullPage: true })
    }
    await page.setViewportSize({ width: 1280, height: 900 })
    await ensureProjectSidebarOpen(page)
    await page.getByRole('button', { name: 'Zur Projektübersicht' }).click()
    await page.screenshot({ path: resolve(directory, 'onda-library-dark-1280.png'), fullPage: true })
    await page.setViewportSize({ width: 320, height: 760 })
    await page.screenshot({ path: resolve(directory, 'onda-library-dark-320.png'), fullPage: true })
    await page.locator('#doclist .doc').first().click()
    await page.evaluate(() => { document.documentElement.dataset.theme = 'light' })
  }

  await assertTextNeverShrinks(page)
  await assertOrbStaysPut(page)
  await assertBlaseWaechstAusDemOrb(page)
  await assertKlinkeBleibtStehen(page)
  await assertDreiAbschnitte(page)
  await assertZweiGesten(page)
  await assertTastwegFolgtDemBlick(page)
  await assertBausteinHinzufuegen(page)
  await assertQuellenFensterEineHandschrift(page)
  await assertGesteZeigtAufDieStelle(page)
  await assertOrtswechselZeigtSeinZiel(page)
  await assertAnmerkungOhnePlatte(page)
  await assertAlternativeStehtImSatz(page)
  await assertKeineFarbeAusserDerAura(page)
  await assertEntscheidungOeffnetKeineKette(page)
  await assertWichtigstesZuerst(page)
  await assertRuhigeLage(page)

  await page.setViewportSize({ width: 320, height: 760 })
  await page.waitForTimeout(50)
  // Hier wurde geprüft, dass "vorherige" und "nächste Anmerkung" mobil ein Bedienpaar
  // auf einer Höhe bleiben. Beide Knöpfe gibt es nicht mehr (docs/PHILOSOPHIE.md §1).
  // An ihre Stelle tritt die Frage, ob das eine verbliebene Zeichen mobil erreichbar
  // bleibt — nicht abgeschnitten, nicht unter die Fensterkante gerutscht.
  const zeichenMobil = await page.locator('#annotationPresence').evaluate(node => {
    const kasten = node.getBoundingClientRect()
    return { links: Math.round(kasten.left), rechts: Math.round(kasten.right), breite: Math.round(kasten.width) }
  })
  assert.ok(zeichenMobil.breite >= 44, `Das Zeichen ist mobil nur ${zeichenMobil.breite}px breit`)
  assert.ok(zeichenMobil.links >= 0 && zeichenMobil.rechts <= 320, 'Das Zeichen liegt mobil außerhalb des Fensters')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  assert.ok(overflow <= 1, `Die App laeuft mobil ${overflow}px horizontal ueber`)
  assert.equal(await page.locator('#editor .ProseMirror').isVisible(), true)
  await page.close()
}

// „Der Text behält seine Breite, jede Nebenfläche schwebt oder wartet."
// Die Regel ist nicht verhandelbar, also wird sie gemessen und nicht behauptet.
//
// ACHTUNG bei der Wahl der Breiten: 1000px allein beweist NICHTS. Unter 1041px schaltet
// eine Ausnahme den Anmerkungsrand komplett ab — dort war es auch vorher schon richtig.
// Der Schaden lag zwischen 1041 und 1516px: bei 1100px war die Schreibspalte 400px
// statt 680px, bei 1200px 500px. Genau diese Zone muss die Prüfung treffen.
async function assertTextNeverShrinks(page) {
  const lesebreite = await page.evaluate(() => parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--container-reading'),
  ))
  assert.ok(lesebreite >= 600, `--container-reading ist unerwartet klein: ${lesebreite}px`)

  for (const agentOffen of [false, true]) {
    await page.evaluate(offen => {
      const auf = document.getElementById('editorView').classList.contains('is-agent-open')
      if (auf !== offen) document.getElementById('ondaAura').click()
    }, agentOffen)

    for (const width of [1041, 1100, 1200, 1400, 1516, 1712, 1800]) {
      await page.setViewportSize({ width, height: 900 })
      await page.waitForTimeout(30)
      const gemessen = await page.evaluate(() => {
        const pm = document.querySelector('#editor .ProseMirror')
        const page_ = document.getElementById('page')
        return {
          spalte: Math.round(pm.getBoundingClientRect().width),
          rand: getComputedStyle(page_).paddingRight,
          ueberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        }
      })
      const lage = `${width}px, Agentenfenster ${agentOffen ? 'offen' : 'zu'}`
      assert.ok(
        gemessen.spalte >= lesebreite,
        `Der Text ist bei ${lage} auf ${gemessen.spalte}px zusammengedrückt (soll ${lesebreite}px, Anmerkungsrand ${gemessen.rand})`,
      )
      assert.ok(gemessen.ueberlauf <= 1, `Die App läuft bei ${lage} ${gemessen.ueberlauf}px horizontal über`)
    }
  }

  await page.evaluate(() => {
    if (document.getElementById('editorView').classList.contains('is-agent-open')) {
      document.getElementById('ondaAura').click()
    }
  })
}

// „Der Einklapp-Pfeil springt." Er sprang um 183px zur Seite und 14px nach oben,
// weil es zwei Knöpfe in zwei verschiedenen Kästen waren. Gemessen wird deshalb genau
// das: die Mitte der Klinke, eingeklappt wie ausgeklappt, auf den Pixel gleich.
async function assertKlinkeBleibtStehen(page) {
  const mitte = () => page.evaluate(() => {
    const kasten = document.getElementById('sidebarToggle').getBoundingClientRect()
    return {
      x: Math.round(kasten.left + kasten.width / 2),
      y: Math.round(kasten.top + kasten.height / 2),
      breite: Math.round(kasten.width),
      hoehe: Math.round(kasten.height),
    }
  })
  const stand = async erwartet => page.waitForFunction(
    wert => document.getElementById('sidebarToggle').getAttribute('aria-expanded') === wert,
    erwartet,
  )

  for (const width of [1041, 1280, 1800]) {
    await page.setViewportSize({ width, height: 900 })
    await page.waitForTimeout(30)
    if (await page.locator('#sidebarToggle').getAttribute('aria-expanded') === 'false') {
      await page.locator('#sidebarToggle').click()
    }
    await stand('true')
    await page.locator('#ondaSidebar').evaluate(async node => {
      await Promise.all(node.getAnimations().map(animation => animation.finished.catch(() => {})))
    })
    const ausgeklappt = await mitte()
    assert.ok(ausgeklappt.breite >= 44 && ausgeklappt.hoehe >= 44,
      `Die Klinke ist bei ${width}px nur ${ausgeklappt.breite}×${ausgeklappt.hoehe}px`)

    await page.locator('#sidebarToggle').click()
    await stand('false')
    await page.locator('#ondaSidebar').evaluate(async node => {
      await Promise.all(node.getAnimations().map(animation => animation.finished.catch(() => {})))
    })
    const eingeklappt = await mitte()
    assert.deepEqual(eingeklappt, ausgeklappt,
      `Die Klinke springt bei ${width}px: ausgeklappt ${JSON.stringify(ausgeklappt)}, eingeklappt ${JSON.stringify(eingeklappt)}`)

    await page.locator('#sidebarToggle').click()
    await stand('true')
  }
}

// „Die linke Spalte hat genau drei Abschnitte: Projektverständnis · Struktur · Quellen."
// Erweiterungen und Erkanntes sind fort — sie kommen über Chat und Anmerkung.
async function assertDreiAbschnitte(page) {
  await page.setViewportSize({ width: 1280, height: 900 })
  await ensureProjectSidebarOpen(page)
  const namen = await page.locator('#ondaSidebar .onda-side-name').evaluateAll(nodes => nodes.map(node => ({
    id: node.id,
    text: node.textContent.replace(/\d+$/, '').trim(),
    haspopup: node.getAttribute('aria-haspopup'),
    hoehe: Math.round(node.getBoundingClientRect().height),
  })))
  assert.deepEqual(namen.map(eintrag => eintrag.text), ['Projektverständnis', 'Struktur', 'Quellen'])
  namen.forEach(eintrag => {
    assert.equal(eintrag.haspopup, 'dialog', `${eintrag.id} kündigt kein Fenster an`)
    assert.ok(eintrag.hoehe >= 44, `${eintrag.id} ist nur ${eintrag.hoehe}px hoch`)
  })
  for (const weg of ['#erweiterungen', '#erkanntes', '#zurueckgehalten']) {
    assert.equal(await page.locator(weg).count(), 0, `${weg} steht noch in der Seitenleiste`)
  }
  // Und das Erkannte ist trotzdem erreichbar — im Projektverständnis-Fenster.
  await page.locator('#pvCard').click()
  await page.locator('#pvModal').waitFor({ state: 'visible' })
  await page.locator('#pvModal [data-blatt-id="erkanntes"]').click()
  assert.equal(await page.locator('#pvModal .onda-erk-flaeche').count(), 1,
    'Das Erkannte ist mit der Seitenleiste verschwunden statt umgezogen')
  await page.keyboard.press('Escape')
}

// „Zwei Gesten, klar getrennt. Klick auf den NAMEN öffnet das Overlay, Klick auf den
// PFEIL klappt den Baum auf und zu."
async function assertZweiGesten(page) {
  await page.setViewportSize({ width: 1280, height: 900 })
  await ensureProjectSidebarOpen(page)

  const sichtbar = () => page.locator('#structureNavList').isVisible()
  assert.equal(await sichtbar(), true, 'Die Struktur steht zu Beginn offen')
  await page.locator('#structureTree').click()
  assert.equal(await sichtbar(), false, 'Der Pfeil klappt den Baum nicht zu')
  assert.equal(await page.locator('#strukturModal').count(), 0, 'Der Pfeil hat ein Fenster geöffnet')
  assert.equal(await page.locator('#structureTree').getAttribute('aria-expanded'), 'false')
  await page.locator('#structureTree').click()
  assert.equal(await sichtbar(), true)
  assert.equal(await page.locator('#structureTree').getAttribute('aria-expanded'), 'true')

  await page.locator('#structureOpen').click()
  await page.locator('#strukturModal').waitFor({ state: 'visible' })
  assert.equal(await sichtbar(), true, 'Der Name hat den Baum mit umgeklappt')
  // Der Platz des Einfügemenüs: hier, nicht am Absatz.
  assert.equal(await page.locator('#strukturBausteinNeu').count(), 1)
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#strukturModal').count(), 0)

  // Und die Quellen genauso.
  assert.equal(await page.locator('#materialTree').isVisible(), false)
  await page.locator('#materialTreeToggle').click()
  assert.equal(await page.locator('#materialTree').isVisible(), true)
  assert.equal(await page.locator('#materialModal').count(), 0, 'Der Pfeil hat ein Fenster geöffnet')
  await page.locator('#materialTreeToggle').click()
}

// „Was ist die Anmerkung, die die höchste hat zum Gelingen des Textes?" (Jakob, 8.8.2026)
//
// Die Rangfolge selbst ist rein und in hinweis-rangfolge.test.mjs Fall für Fall
// geprüft. Hier geht es um etwas anderes: dass sie auch WIRKLICH auf den Schirm kommt.
// Bis zum 8.8.2026 sortierte die Oberfläche nach einer eigenen, abweichenden Regel —
// eine Änderung am Modell hätte die Anzeige gar nicht erreicht.
async function assertWichtigstesZuerst(page) {
  await page.setViewportSize({ width: 1440, height: 900 })

  const gezeigt = await page.evaluate(async () => {
    const doc = window.AIWT.state.docs.find(kandidat => kandidat.id === window.AIWT.state.active)
    const vorrat = { findings: doc.findings, decisions: doc.decisions, coach: doc.coach, lane: doc.lane }
    doc.findings = []; doc.decisions = []; doc.coach = []; doc.lane = []

    const bausteine = window.AIWT.__blockIdentityTestBridge.getBlocks().filter(k => k.text.length > 40)
    // Der Kommafehler ist ÄLTER und ein Fehler; die Gliederung ist jünger und nur eine
    // Empfehlung. Nach der alten Regel hätte der Kommafehler gewonnen — zweimal.
    doc.findings.push(
      {
        id: 'rang-komma', status: 'open', placement: 'passage', blockId: bausteine[0].id,
        target: bausteine[0].text.slice(0, 20), action: `${bausteine[0].text.slice(0, 20)}.`,
        short: 'Beleg.', why: 'Beleg.', folge: 'Beleg.',
        anmerkungsart: 'zeichensetzung', kiKategorie: 'sprache', priority: 'normal', createdAt: 1,
      },
      {
        id: 'rang-gliederung', status: 'open', placement: 'passage', blockId: bausteine[1].id,
        target: bausteine[1].text.slice(0, 20), action: `${bausteine[1].text.slice(0, 20)} — anders`,
        short: 'Beleg.', why: 'Beleg.', folge: 'Beleg.',
        anmerkungsart: 'gliederung', kiKategorie: 'struktur', priority: 'normal', createdAt: 999,
      },
    )
    window.AIWT.flushSave()
    window.AIWT.__workspaceTestBridge.reinitialize()
    await new Promise(fertig => setTimeout(fertig, 500))

    const welche = document.querySelector('#localAgentLayer .onda-annotation')?.dataset.findingId || null

    doc.findings = vorrat.findings
    doc.decisions = vorrat.decisions
    doc.coach = vorrat.coach
    doc.lane = vorrat.lane
    window.AIWT.flushSave()
    window.AIWT.__workspaceTestBridge.reinitialize()
    return welche
  })
  await page.waitForTimeout(200)

  assert.equal(
    gezeigt,
    'rang-gliederung',
    'Auf dem Schirm steht der Kommafehler statt der Gliederung — die Oberfläche sortiert wieder nach eigener Regel',
  )
}

// „Wenn ich eins wegklick, dann kommt direkt das Nächste. Das soll nicht so sein. […]
// auch wenn die AI mehrere Sachen hat, sollen die eben nach und nach erst kommen."
// (Jakob, 8.8.2026)
//
// Bis dahin loeste das Entscheiden selbst den Moment 'Aufschauen' aus — jedes
// Wegklicken gab damit den naechsten Hinweis frei, und die Kette lief, solange offene
// Hinweise da waren. Die Regel dazu steht in momente-model.mjs und ist dort auch
// einzeln geprueft; hier geht es um den ganzen Weg im Browser.
async function assertEntscheidungOeffnetKeineKette(page) {
  await page.setViewportSize({ width: 1440, height: 900 })

  const vorbereitet = await page.evaluate(async () => {
    const doc = window.AIWT.state.docs.find(kandidat => kandidat.id === window.AIWT.state.active)
    // Leeren UND sichern. Zwei Stolperstellen dabei, beide im Beispielprojekt:
    // die Hinweise stehen nicht nur in findings, sondern werden aus den Altbestaenden
    // coach und lane neu erzeugt (editor.js, ensureDocShape → ensureReasoningModel).
    // Wer nur findings leert, hat sie beim naechsten Zeichnen alle wieder.
    //
    // Vorher WEGLEGEN, nicht wegwerfen: der Beispieltext traegt 35 Hinweise, und die
    // Pruefungen danach in diesem Lauf rechnen mit ihnen. Ohne das Zuruecklegen fiel
    // spaeter die mobile Zeichen-Pruefung mit „nur 0px breit" — an einer Stelle, die
    // mit dem Takt nichts zu tun hat.
    window.__taktVorrat = {
      findings: doc.findings, decisions: doc.decisions, coach: doc.coach, lane: doc.lane,
    }
    doc.findings = []
    doc.decisions = []
    doc.coach = []
    doc.lane = []
    window.AIWT.flushSave()
    const bausteine = window.AIWT.__blockIdentityTestBridge.getBlocks().filter(kandidat => kandidat.text.length > 40)
    if (bausteine.length < 2) return { fehler: 'zu wenige Bausteine im Beispieltext' }

    // Zwei Hinweise, beide mit Moment 'aufschauen' (Kategorie struktur). Waeren sie
    // 'sofort', sagte die Pruefung nichts ueber den Takt.
    //
    // Beide auf EINMAL in den Text legen, nicht nacheinander ueber injectFinding.
    // Der Unterschied ist der Kern der Pruefung: injectFinding zeichnet jedes Mal neu,
    // also stuende zwischendurch der erste Hinweis kurz auf dem Schirm und gaelte
    // danach als „schon gezeigt" — und was einmal stand, darf zu Recht immer wieder
    // stehen (darfErscheinen). Die Pruefung haette sich ihre eigene Ausnahme gebaut.
    // So kommt es auch im Betrieb: EIN Lauf liefert mehrere Hinweise zugleich.
    const bauen = (nummer, baustein) => ({
      id: `takt-${nummer}`, status: 'open', placement: 'passage', blockId: baustein.id,
      target: baustein.text.slice(0, 24), action: `${baustein.text.slice(0, 24)} — anders`,
      short: 'Beleg.', why: 'Beleg.', folge: 'Beleg.',
      anmerkungsart: 'gliederung', kiKategorie: 'struktur', createdAt: nummer,
    })
    doc.findings.push(bauen(1, bausteine[0]), bauen(2, bausteine[1]))
    window.AIWT.flushSave()
    window.AIWT.__workspaceTestBridge.reinitialize()
    await new Promise(fertig => setTimeout(fertig, 400))
    return { offen: doc.findings.filter(f => f.status === 'open').length }
  })
  assert.equal(vorbereitet.fehler, undefined, vorbereitet.fehler)
  assert.equal(vorbereitet.offen, 2, 'Der Prüfstand hat nicht zwei offene Hinweise')

  // Schreiben setzt „ich schaue ausdrücklich hin" zurück — sonst stünde der Moment
  // dauerhaft auf 'aufschauen' und die Prüfung liefe ins Leere.
  await page.locator('#editor .ProseMirror').click()
  await page.keyboard.type(' ')
  await page.waitForTimeout(120)

  const sichtbar = () => page.locator('#localAgentLayer .onda-annotation').count()
  assert.equal(await sichtbar(), 1, 'Vor der Entscheidung steht nicht genau eine Anmerkung')

  // Und jetzt der eigentliche Fall: entscheiden und sofort nachsehen.
  //
  // Die Beschriftung haengt an der Anmerkungsart — bei 'gliederung' heisst das Paar
  // „Gliedern" und „Lassen". Gesucht wird deshalb der zweite Weg ueber seine Rolle in
  // der Karte statt ueber ein geratenes Wort.
  //
  // Das Weglegen war bis zum 8.8.2026 zweistufig — der Knopf oeffnete erst eine
  // Rueckfrage nach dem Grund. Auf main ist sie entfallen: „Lassen" entscheidet direkt.
  // Geprueft wird deshalb ueber den ZUSTAND (unten), nicht ueber die Zahl der Klicks;
  // eine Pruefung, die eine bestimmte Klickfolge festhaelt, ist beim naechsten Umbau
  // wieder rot, ohne dass etwas kaputt ist.
  const wege = page.locator('#localAgentLayer .onda-annotation .aura-note__acts button')
  assert.ok(await wege.count() >= 2, 'Die Anmerkung bietet keine Entscheidung an')
  await wege.nth(1).click()
  await page.waitForTimeout(600)

  assert.equal(
    await sichtbar(),
    0,
    'Nach dem Wegklicken steht sofort die nächste Anmerkung da — die Kette läuft weiter',
  )

  // Der zweite Hinweis ist nicht verloren, nur zurückgehalten: er steht weiter offen.
  const zustaende = await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(kandidat => kandidat.id === window.AIWT.state.active)
    return doc.findings.map(f => f.status)
  })
  assert.equal(zustaende.filter(z => z === 'open').length, 1, 'Der zurückgehaltene Hinweis ist verschwunden statt zu warten')
  assert.ok(zustaende.some(z => z !== 'open'), 'Es wurde gar nichts entschieden — die Prüfung misst nichts')

  // Und den Beispieltext zuruecklegen, wie er war.
  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(kandidat => kandidat.id === window.AIWT.state.active)
    const vorrat = window.__taktVorrat
    if (vorrat) {
      doc.findings = vorrat.findings
      doc.decisions = vorrat.decisions
      doc.coach = vorrat.coach
      doc.lane = vorrat.lane
      delete window.__taktVorrat
    }
    window.AIWT.flushSave()
    window.AIWT.__workspaceTestBridge.reinitialize()
  })
  await page.waitForTimeout(200)
}

// „Ich erkenn dann gar nicht direkt, um was es geht. Ich muss dann lesen, ich muss erst
// mal das richtig zuordnen zum Text." (Jakob, 8.8.2026)
//
// Bis dahin trug der Absatz nur einen Punkt im Rand — an den Woertern stand nichts.
// Jetzt traegt die Stelle selbst eine Geste, und ihre FORM sagt den Umfang: Kontur ums
// Wort, Strich unter den Satz, Klammer am Absatz.
//
// Geprueft wird das, woran alles haengt: Steht die Markierung auf GENAU den Zeichen,
// die die Anmerkung nennt? Ein Strich unter den falschen Woertern waere schlimmer als
// gar keiner — er behauptete eine Stelle.
async function assertGesteZeigtAufDieStelle(page) {
  await page.setViewportSize({ width: 1440, height: 900 })

  const faelle = [
    ['wortwahl', 'wort', 'Peripherie'],
    ['satzstil', 'satz', 'Calm Technology beschreibt Technik'],
    ['absatzstil', 'absatz', 'Calm Technology beschreibt Technik'],
  ]

  for (const [art, gestalt, wortlaut] of faelle) {
    const gesehen = await page.evaluate(async ({ art, wortlaut }) => {
      const doc = window.AIWT.state.docs.find(kandidat => kandidat.id === window.AIWT.state.active)
      doc.findings = []
      const block = window.AIWT.__blockIdentityTestBridge.getBlocks().find(kandidat => kandidat.text.includes(wortlaut))
      if (!block) return { fehler: `kein Baustein mit „${wortlaut}"` }
      window.AIWT.__workspaceTestBridge.injectFinding({
        id: `geste-${art}`, status: 'open', placement: 'passage', blockId: block.id,
        target: wortlaut, action: `${wortlaut} — anders`, short: 'Beleg.', why: 'Beleg.', folge: 'Beleg.',
        anmerkungsart: art, createdAt: -1,
      })
      await new Promise(fertig => setTimeout(fertig, 420))
      const stelle = document.querySelector('#editor .onda-stelle')
      const absatz = document.querySelector('#editor [data-block-id].has-local-finding')
      return {
        markiert: stelle ? stelle.textContent : null,
        klassen: stelle ? stelle.className : '',
        absatzweit: Boolean(absatz && absatz.classList.contains('hat-absatzweite-anmerkung')),
      }
    }, { art, wortlaut })

    assert.equal(gesehen.fehler, undefined, gesehen.fehler)

    if (gestalt === 'absatz') {
      assert.equal(gesehen.absatzweit, true, 'Der Absatz-Hinweis klammert den Absatz nicht')
      assert.equal(gesehen.markiert, null, 'Der Absatz-Hinweis markiert zusätzlich eine einzelne Stelle')
      continue
    }

    assert.ok(
      gesehen.klassen.includes(`onda-stelle--${gestalt}`),
      `${art} trägt die Geste „${gestalt}" nicht (${gesehen.klassen})`,
    )
    // Der Kern: auf den Zeichen, nicht daneben.
    assert.equal(gesehen.markiert, wortlaut, `Die Markierung sitzt auf „${gesehen.markiert}" statt auf „${wortlaut}"`)
    assert.equal(gesehen.absatzweit, false, `${art} klammert fälschlich den ganzen Absatz`)
  }

  // Fail-closed: Wurde der Text seit dem Lauf geändert, entsteht KEINE Markierung.
  // Lieber kein Strich als einer unter den falschen Wörtern.
  const veraltet = await page.evaluate(async () => {
    const doc = window.AIWT.state.docs.find(kandidat => kandidat.id === window.AIWT.state.active)
    doc.findings = []
    const block = window.AIWT.__blockIdentityTestBridge.getBlocks()[0]
    window.AIWT.__workspaceTestBridge.injectFinding({
      id: 'geste-weg', status: 'open', placement: 'passage', blockId: block.id,
      target: 'diesen Wortlaut gibt es im Text nicht', action: 'x', short: 'Beleg.', why: 'Beleg.', folge: 'Beleg.',
      anmerkungsart: 'satzstil', createdAt: -1,
    })
    await new Promise(fertig => setTimeout(fertig, 420))
    return document.querySelectorAll('#editor .onda-stelle').length
  })
  assert.equal(veraltet, 0, 'Ein verschwundener Wortlaut erzeugt trotzdem eine Markierung')

  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(kandidat => kandidat.id === window.AIWT.state.active)
    doc.findings = []
    window.AIWT.__workspaceTestBridge.reinitialize()
  })
}

// Der Ortswechsel ist die einzige Anmerkungsart mit ZWEI Enden: „das gehört woanders
// hin" ist ohne ein sichtbares Wohin eine halbe Aussage. Bis zum 8.8.2026 zeigte der
// Text nur das erste Ende — man las den Vorschlag und suchte die Zielstelle selbst.
//
// Geprüft wird beides und ihr Verhältnis: die Fläche am wandernden Absatz, die Marke
// an der Zielstelle, und dass die Marke wirklich DORT sitzt und nicht am Absatz selbst.
async function assertOrtswechselZeigtSeinZiel(page) {
  await page.setViewportSize({ width: 1440, height: 900 })

  const gesehen = await page.evaluate(async () => {
    const doc = window.AIWT.state.docs.find(kandidat => kandidat.id === window.AIWT.state.active)
    const vorrat = { findings: doc.findings, decisions: doc.decisions, coach: doc.coach, lane: doc.lane }
    doc.findings = []
    doc.decisions = []
    doc.coach = []
    doc.lane = []
    const bausteine = window.AIWT.__blockIdentityTestBridge.getBlocks().filter(b => b.text.length > 40)
    if (bausteine.length < 3) return { fehler: 'zu wenige Bausteine im Beispieltext' }
    const quelle = bausteine[2]
    const ziel = bausteine[0]

    // Wo stehen die BUCHSTABEN vor der Markierung? Gemessen wird der Text, nicht der
    // Kasten: die Fläche wächst absichtlich nach außen (negativer Außenabstand in der
    // Größe ihrer Polsterung), der Kasten wird also breiter — der Satzspiegel aber
    // darf sich um kein Pixel bewegen. „Dass da irgendwie dann nichts umspringt oder
    // verdeckt ist" (Jakob, 8.8.2026). Ein Kastenmaß hätte hier falschen Alarm gegeben.
    const messen = id => {
      const knoten = document.querySelector(`#editor [data-block-id="${CSS.escape(id)}"]`)
      const strecke = document.createRange()
      strecke.selectNodeContents(knoten)
      const kasten = strecke.getBoundingClientRect()
      return { links: Math.round(kasten.left), breite: Math.round(kasten.width) }
    }
    const vorher = messen(quelle.id)

    window.AIWT.__workspaceTestBridge.injectFinding({
      id: 'ortswechsel-pruefung', status: 'open', placement: 'passage', blockId: quelle.id,
      target: quelle.text.slice(0, 24), short: 'Beleg.', why: 'Beleg.', folge: 'Beleg.',
      anmerkungsart: 'verschieben', kiKategorie: 'struktur', createdAt: -1,
      move: { fromBlockId: quelle.id, toBlockId: ziel.id, position: 'before', to: 'Vor: Beleg' },
    })
    await new Promise(fertig => setTimeout(fertig, 900))

    const quellKnoten = document.querySelector(`#editor [data-block-id="${CSS.escape(quelle.id)}"]`)
    const zielKnoten = document.querySelector(`#editor [data-block-id="${CSS.escape(ziel.id)}"]`)
    const marke = document.querySelector('#editor .onda-zielmarke')
    const markeKasten = marke ? marke.getBoundingClientRect() : null

    const ergebnis = {
      flaeche: quellKnoten.classList.contains('hat-ortswechsel'),
      klammer: quellKnoten.classList.contains('hat-absatzweite-anmerkung'),
      markeText: marke ? marke.textContent.trim() : null,
      markeHoehe: markeKasten ? Math.round(markeKasten.height) : 0,
      // Sitzt sie über dem Ziel (position 'before') — und nicht am Quellabsatz?
      ueberDemZiel: markeKasten
        ? Math.round(markeKasten.bottom) <= Math.round(zielKnoten.getBoundingClientRect().top) + 2
        : false,
      abstandZurQuelle: markeKasten
        ? Math.round(Math.abs(markeKasten.top - quellKnoten.getBoundingClientRect().top))
        : 0,
      nachher: messen(quelle.id),
      vorher,
      ueberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }

    window.__ortswechselVorrat = vorrat
    return ergebnis
  })

  assert.equal(gesehen.fehler, undefined, gesehen.fehler)
  assert.equal(gesehen.flaeche, true, 'Der wandernde Absatz trägt keine Fläche')
  assert.equal(gesehen.klammer, false, 'Der Ortswechsel bekommt zusätzlich die Absatz-Klammer')
  assert.equal(gesehen.markeText, 'hierher', `Die Zielmarke sagt „${gesehen.markeText}"`)
  // Die Marke öffnet sich aus der Höhe 0 heraus. Bliebe sie dort, gäbe es sie im DOM,
  // aber nicht auf dem Schirm — genau das Ende, das sie zeigen soll.
  assert.ok(gesehen.markeHoehe >= 12, `Die Zielmarke ist nur ${gesehen.markeHoehe}px hoch`)
  assert.equal(gesehen.ueberDemZiel, true, 'Die Zielmarke sitzt nicht an der Zielstelle')
  assert.ok(gesehen.abstandZurQuelle > 40, 'Die Zielmarke klebt am Quellabsatz statt am Ziel')
  // Und der Satzspiegel bleibt, wo er war: die Fläche wächst nach außen.
  assert.equal(gesehen.nachher.links, gesehen.vorher.links, 'Der Text ist beim Markieren zur Seite gesprungen')
  assert.equal(gesehen.nachher.breite, gesehen.vorher.breite, 'Der Text ist beim Markieren schmaler geworden')
  assert.ok(gesehen.ueberlauf <= 1, `Die Fläche lässt die App ${gesehen.ueberlauf}px horizontal überlaufen`)

  // „Ich werd's meistens im Vollbildschirm benutzen, aber wenn ich jetzt irgendwie 'n
  // kleineres Bild hab […] son Drittel oder zwei Drittel des Bildschirms […] dass da
  // irgendwie dann nichts umspringt oder verdeckt ist" (Jakob, 8.8.2026). Die Fläche
  // wächst nach außen — genau dort, wo bei schmalem Fenster am wenigsten Platz ist.
  for (const breite of [1280, 960, 640]) {
    await page.setViewportSize({ width: breite, height: 900 })
    await page.waitForTimeout(80)
    const schmal = await page.evaluate(() => {
      const marke = document.querySelector('#editor .onda-zielmarke')
      const kasten = marke ? marke.getBoundingClientRect() : null
      return {
        markeDa: Boolean(marke),
        markeHoehe: kasten ? Math.round(kasten.height) : 0,
        markeLinks: kasten ? Math.round(kasten.left) : 0,
        markeRechts: kasten ? Math.round(kasten.right) : 0,
        ueberlauf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }
    })
    assert.equal(schmal.markeDa, true, `Bei ${breite}px fehlt die Zielmarke`)
    assert.ok(schmal.markeHoehe >= 12, `Bei ${breite}px ist die Zielmarke nur ${schmal.markeHoehe}px hoch`)
    assert.ok(schmal.markeLinks >= 0 && schmal.markeRechts <= breite,
      `Bei ${breite}px liegt die Zielmarke außerhalb des Fensters (${schmal.markeLinks}–${schmal.markeRechts})`)
    assert.ok(schmal.ueberlauf <= 1, `Bei ${breite}px läuft die App ${schmal.ueberlauf}px horizontal über`)
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.evaluate(async () => {
    const doc = window.AIWT.state.docs.find(kandidat => kandidat.id === window.AIWT.state.active)
    Object.assign(doc, window.__ortswechselVorrat)
    window.AIWT.flushSave()
    window.AIWT.__workspaceTestBridge.reinitialize()
    await new Promise(fertig => setTimeout(fertig, 200))
  })
}

// Die Anmerkung ist keine Platte mehr — und unter dem Text nur noch eine Zeile.
//
// Zwei Dinge, die zusammengehören. Neben dem Text hat die Anmerkung ihre eigene Spalte;
// dort braucht sie keinen Rahmen, um sich vom Text zu unterscheiden. Unter dem Text hat
// sie keine Spalte — dort schob sie bis zum 8.8.2026 den nächsten Absatz um über 300px
// nach unten und stand mitten im Lesefluss. „Dass da irgendwie dann nichts umspringt
// oder verdeckt ist" (Jakob, 8.8.2026) — also bleibt dort eine Zeile stehen.
async function assertAnmerkungOhnePlatte(page) {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForTimeout(200)

  const breit = await page.evaluate(() => {
    const karte = document.querySelector('#localAgentLayer .onda-annotation')
    if (!karte) return { fehler: 'keine Anmerkung sichtbar' }
    const stil = getComputedStyle(karte)
    return {
      unten: karte.classList.contains('is-below'),
      rahmen: stil.borderTopWidth,
      schatten: stil.boxShadow,
      grund: stil.backgroundColor,
    }
  })
  assert.equal(breit.fehler, undefined, breit.fehler)
  assert.equal(breit.unten, false, 'Bei 1440px steht die Anmerkung schon unter dem Text')
  assert.equal(breit.rahmen, '0px', `Die Anmerkung trägt wieder eine Kante (${breit.rahmen})`)
  assert.equal(breit.schatten, 'none', `Die Anmerkung schwebt wieder (${breit.schatten})`)
  // rgba(…, 0) ist die berechnete Form von transparent.
  assert.match(breit.grund, /rgba\(0, 0, 0, 0\)|transparent/, `Die Anmerkung trägt wieder eine Fläche (${breit.grund})`)

  // Zwei Drittel Fensterbreite: hier fällt die Anmerkung unter den Text.
  await page.setViewportSize({ width: 1000, height: 1000 })
  await page.waitForTimeout(250)

  const schmal = await page.evaluate(() => {
    const karte = document.querySelector('#localAgentLayer .onda-annotation')
    const kasten = karte.getBoundingClientRect()
    return {
      unten: karte.classList.contains('is-below'),
      zu: karte.classList.contains('ist-zugeklappt'),
      hoehe: Math.round(kasten.height),
      // Zugeklappt heißt: erreichbar mit der Tastatur, und die Rolle sagt, was passiert.
      rolle: karte.getAttribute('role'),
      offen: karte.getAttribute('aria-expanded'),
      knoepfe: karte.querySelectorAll('button:not([hidden])').length,
      sichtbareKnoepfe: [...karte.querySelectorAll('button')]
        .filter(knopf => knopf.getBoundingClientRect().height > 0).length,
      // Und die Markierung im Absatz bleibt: zugeklappt ist nicht weg.
      markeDa: Boolean(document.querySelector('#editor [data-block-id].has-local-finding')),
    }
  })
  assert.equal(schmal.unten, true, 'Bei 1000px steht die Anmerkung nicht unter dem Text')
  assert.equal(schmal.zu, true, 'Unter dem Text bleibt die Anmerkung in voller Größe stehen')
  assert.ok(schmal.hoehe <= 72, `Die zugeklappte Zeile ist ${schmal.hoehe}px hoch`)
  assert.equal(schmal.rolle, 'button', 'Die zugeklappte Zeile sagt nicht, dass sie sich öffnen lässt')
  assert.equal(schmal.offen, 'false')
  assert.equal(schmal.sichtbareKnoepfe, 0, 'Zugeklappt stehen die Knöpfe trotzdem da')
  assert.equal(schmal.markeDa, true, 'Zugeklappt verliert der Absatz seine Markierung')

  // Und sie lässt sich öffnen — mit der Tastatur, nicht nur mit der Maus.
  await page.locator('#localAgentLayer .onda-annotation').focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(250)
  const geoeffnet = await page.evaluate(() => {
    const karte = document.querySelector('#localAgentLayer .onda-annotation')
    return {
      zu: karte.classList.contains('ist-zugeklappt'),
      hoehe: Math.round(karte.getBoundingClientRect().height),
      sichtbareKnoepfe: [...karte.querySelectorAll('button')]
        .filter(knopf => knopf.getBoundingClientRect().height > 0).length,
    }
  })
  assert.equal(geoeffnet.zu, false, 'Die Zeile lässt sich mit der Tastatur nicht öffnen')
  assert.ok(geoeffnet.hoehe > 100, `Geöffnet ist die Anmerkung nur ${geoeffnet.hoehe}px hoch`)
  assert.ok(geoeffnet.sichtbareKnoepfe >= 2, 'Geöffnet fehlen die Knöpfe')

  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForTimeout(150)
}

// Die andere Fassung steht IM Satz: „gebraucht → benötigt".
//
// Bis zum 8.8.2026 stand sie nur in der Anmerkung daneben — man las dort „benötigt"
// und musste sich selbst vorstellen, wie der Satz damit klingt. Der Vorschlag ist
// jetzt im Satz zu lesen, bevor er im Satz steht.
//
// Drei Dinge, die dabei nicht passieren dürfen: der Dokumenttext darf sich nicht
// ändern (die Zeile ist Verzierung, kein Inhalt), ein zu langer Vorschlag darf die
// Zeile nicht aufbrechen, und eine Satz-Anmerkung bekommt sie gar nicht erst.
async function assertAlternativeStehtImSatz(page) {
  await page.setViewportSize({ width: 1440, height: 1000 })

  const zeige = (art, ziel, fassung) => page.evaluate(async ({ art, ziel, fassung }) => {
    const doc = window.AIWT.state.docs.find(kandidat => kandidat.id === window.AIWT.state.active)
    doc.findings = []
    const block = window.AIWT.__blockIdentityTestBridge.getBlocks().find(kandidat => kandidat.text.includes(ziel))
    if (!block) return { fehler: `kein Baustein mit „${ziel}"` }
    const textVorher = block.text
    window.AIWT.__workspaceTestBridge.injectFinding({
      id: `alt-${art}`, status: 'open', placement: 'passage', blockId: block.id,
      target: ziel, action: fassung, short: 'Beleg.', why: 'Beleg.', folge: 'Beleg.',
      anmerkungsart: art, createdAt: -1,
    })
    await new Promise(fertig => setTimeout(fertig, 700))
    const neu = document.querySelector('#editor .onda-stelle__neu')
    const nachher = window.AIWT.__blockIdentityTestBridge.getBlocks().find(kandidat => kandidat.id === block.id)
    return {
      text: neu ? neu.textContent : null,
      // Verzierung, kein Inhalt: der Dokumenttext darf sich um kein Zeichen ändern.
      // Stünde die Zeile im Dokument, wanderte sie beim nächsten Speichern hinein.
      textUnveraendert: nachher?.text === textVorher,
      // Wer vorlesen lässt, bekäme sonst den eigenen Satz mitten entzwei.
      versteckt: neu ? neu.getAttribute('aria-hidden') : null,
      kursiv: neu ? getComputedStyle(neu).fontStyle : null,
    }
  }, { art, ziel, fassung })

  const wort = await zeige('wortwahl', 'gebraucht', 'benötigt')
  assert.equal(wort.fehler, undefined, wort.fehler)
  assert.equal(wort.text, '→ benötigt', `Die andere Fassung steht nicht im Satz (${wort.text})`)
  assert.equal(wort.textUnveraendert, true, 'Die Verzierung ist in den Dokumenttext gerutscht')
  assert.equal(wort.versteckt, 'true', 'Die Zeile wird mit vorgelesen und zerreißt den Satz')
  assert.equal(wort.kursiv, 'italic', 'Die andere Fassung sieht aus wie der Text selbst')

  // Ein ganzer Satz gehört nicht zwischen zwei Wörter — er stünde dort länger als der
  // Satz selbst. Dann trägt die Anmerkung daneben den Vorschlag, wie bisher.
  const zuLang = await zeige('wortwahl', 'gebraucht',
    'in Anspruch genommen, und zwar dann, wenn es tatsächlich einen Anlass dafür gibt')
  assert.equal(zuLang.text, null, `Ein langer Vorschlag steht trotzdem im Satz (${zuLang.text})`)

  // Und die Satz-Geste bekommt sie nicht: dort ist die markierte Stelle schon ein
  // ganzer Satz, die Alternative wäre ein zweiter daneben.
  const satz = await zeige('satzstil', 'Calm Technology beschreibt Technik', 'Anders gesagt')
  assert.equal(satz.text, null, 'Auch die Satz-Geste bekommt die andere Fassung in den Satz')

  await page.evaluate(() => {
    const doc = window.AIWT.state.docs.find(kandidat => kandidat.id === window.AIWT.state.active)
    doc.findings = []
    window.AIWT.__workspaceTestBridge.reinitialize()
  })
}

// EINE FARBE, UND DIE GEHÖRT DER KI (docs/DIE-AESTHETIK.md, 8.8.2026).
//
// aesthetik-tinte.test.mjs liest das CSS und ist der schnelle Wächter. Das hier ist
// der Beweis: gemessen wird, was WIRKLICH auf dem Schirm steht — über die Fenster,
// die man erreichen kann, und in beiden Erscheinungen. Beides wird gebraucht, denn
// das CSS kann farblos aussehen und über eine Marke doch auf Farbe zeigen.
//
// ACHTUNG bei der Schwelle: Ondas Graus sind ABSICHTLICH warm. #736d64 hat 15 Abstand
// zwischen dem stärksten und dem schwächsten Kanal, #b6afa4 hat 18. Eine Schwelle von
// 12 meldete am 8.8.2026 das Papier selbst als Farbe — der Messfehler saß in der
// Prüfung, nicht in der App. Echte Farbe liegt weit darüber: Sky #8db2c9 hat 60.
async function assertKeineFarbeAusserDerAura(page) {
  const WARMES_GRAU_GEHT_BIS = 30

  const messe = () => page.evaluate(schwelle => {
    const kanal = wert => (wert.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number)
    const bunt = wert => {
      if (!wert || wert === 'none' || wert.includes('gradient')) return false
      const k = kanal(wert)
      if (k.length < 3) return false
      // Fast durchsichtige Werte zählen nicht — sie sind auf dem Schirm keine Farbe.
      if (parseFloat((wert.match(/[\d.]+\)$/) || ['1'])[0]) < 0.05) return false
      return Math.max(...k) - Math.min(...k) > schwelle
    }
    const treffer = []
    for (const el of document.querySelectorAll('body *')) {
      const kasten = el.getBoundingClientRect()
      if (kasten.width < 1 || kasten.height < 1) continue
      // Die Aura ist die eine erlaubte Ausnahme — und eine Aussage: das Farbige an
      // der Oberfläche ist die KI selbst.
      if (el.closest('.onda-aura, #ondaAura')) continue
      const stil = getComputedStyle(el)
      const kandidaten = [
        ['Schrift', stil.color], ['Fläche', stil.backgroundColor],
        ['Kante', stil.borderTopColor], ['Kante', stil.borderLeftColor],
        ['Schreibmarke', stil.caretColor], ['Füllung', stil.fill], ['Strich', stil.stroke],
      ]
      for (const [was, wert] of kandidaten) {
        if (!bunt(wert)) continue
        // Eine Kantenfarbe ohne Kante ist keine Farbe auf dem Schirm.
        if (was === 'Kante' && stil.borderTopWidth === '0px' && stil.borderLeftWidth === '0px') continue
        const name = `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.')}`
        treffer.push(`${was} ${wert} an ${name}`)
        break
      }
    }
    return [...new Set(treffer)]
  }, WARMES_GRAU_GEHT_BIS)

  const pruefe = async ort => {
    const treffer = await messe()
    assert.deepEqual(treffer, [], `Farbe außerhalb der Aura — ${ort}:\n  ${treffer.join('\n  ')}`)
  }

  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForTimeout(150)
  await pruefe('Schreibansicht')

  // Die Fenster einzeln, weil in jedem andere Regeln greifen. Ein Fenster, das sich
  // nicht öffnen lässt, ist ein Fehler in dieser Prüfung und wird gemeldet — still
  // übersprungen hieße: ungeprüft und trotzdem grün.
  for (const [name, oeffner, warte] of [
    ['Struktur-Fenster', '#structureOpen', '#strukturModal'],
    ['Quellen-Fenster', '#materialSources', '#materialModal'],
    ['KI-Anschluss', '#kiSettings', '#kiModal'],
  ]) {
    assert.equal(await page.locator(oeffner).count(), 1, `${name}: ${oeffner} nicht gefunden`)
    await page.locator(oeffner).click()
    await page.locator(warte).waitFor({ state: 'visible' })
    await pruefe(name)
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)
  }

  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
  await page.waitForTimeout(250)
  await pruefe('Dunkelmodus')
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light' })
  await page.waitForTimeout(200)
}

// Der Tastweg folgt dem Blick: was oben steht, kommt zuerst. Und wer ein Fenster mit
// der Tastatur öffnet, bekommt den Fokus zurück, wo er ihn gelassen hat — sonst steht
// man nach dem Schließen am Seitenanfang und muss sich neu zurechtfinden.
async function assertTastwegFolgtDemBlick(page) {
  await page.setViewportSize({ width: 1280, height: 900 })
  await ensureProjectSidebarOpen(page)

  const reihenfolge = await page.evaluate(() => {
    const gesucht = ['pvCard', 'structureOpen', 'structureTree', 'materialSources', 'materialTreeToggle']
    // Nach der Lage im Dokument sortiert — genau das ist die Reihenfolge, in der die
    // Tabulatortaste läuft, solange niemand tabindex verbiegt.
    return gesucht
      .map(id => ({ id, knopf: document.getElementById(id) }))
      .filter(e => e.knopf)
      .sort((a, b) => (a.knopf.compareDocumentPosition(b.knopf) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
      .map(e => e.id)
  })
  assert.deepEqual(
    reihenfolge,
    ['pvCard', 'structureOpen', 'structureTree', 'materialSources', 'materialTreeToggle'],
    'Der Tastweg läuft nicht in der Reihenfolge, in der die Abschnitte dastehen',
  )

  const verbogen = await page.evaluate(() => [...document.querySelectorAll('#ondaSidebar [tabindex]')]
    .map(n => n.getAttribute('tabindex'))
    .filter(v => Number(v) > 0))
  assert.deepEqual(verbogen, [], 'Ein tabindex > 0 in der Seitenleiste bricht die natürliche Reihenfolge')

  // Fokusrückgabe: mit der Tastatur öffnen, mit der Tastatur schließen, und der Fokus
  // steht wieder auf dem Namen, der das Fenster geöffnet hat.
  await page.locator('#structureOpen').focus()
  await page.keyboard.press('Enter')
  await page.locator('#strukturModal').waitFor({ state: 'visible' })
  // Der Dialog setzt den Fokus in einem requestAnimationFrame — direkt nach dem
  // Sichtbarwerden zu messen prüft nur, wie schnell der Testrechner ist. Also warten,
  // bis es wirklich geschehen ist, mit klarer Fehlermeldung, wenn es ausbleibt.
  await page.waitForFunction(
    () => Boolean(document.getElementById('strukturModal')?.contains(document.activeElement)),
    null,
    { timeout: 3000 },
  ).catch(() => {
    assert.fail('Das Fenster nimmt den Fokus beim Öffnen nicht mit')
  })
  await page.keyboard.press('Escape')
  assert.equal(await page.locator('#strukturModal').count(), 0)
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'structureOpen',
    'Nach dem Schließen steht der Fokus nicht mehr auf dem Namen, der geöffnet hat')
}

// Bausteine hinzufügen hat einen neuen Platz: die Struktur-Ansicht. Das schwebende Plus
// am Absatz ist fort (docs/PHILOSOPHIE.md §1) — das Menü dahinter lebt weiter, und hier
// gehört es hin. Geprüft wird nicht nur, DASS der Knopf da ist, sondern dass er wirklich
// einen Baustein einfügt.
async function assertBausteinHinzufuegen(page) {
  await page.setViewportSize({ width: 1280, height: 900 })
  await ensureProjectSidebarOpen(page)

  // Am Absatz darf es kein Plus mehr geben — sonst hätte es zwei Orte für dieselbe Sache.
  assert.equal(await page.locator('#blockInsertTrigger').count(), 0, 'Das Plus am Absatz ist zurück')

  const vorher = await page.locator('#editor .ProseMirror > [data-block-id]').count()
  await page.locator('#structureOpen').click()
  await page.locator('#strukturModal').waitFor({ state: 'visible' })
  await page.locator('#strukturBausteinNeu').click()

  const menue = page.locator('.semantic-insert-menu')
  await menue.waitFor({ state: 'visible' })
  const auswahl = await menue.getByRole('menuitem').allTextContents()
  assert.ok(auswahl.includes('Freier Absatz'), `Das Einfügemenü kennt keinen freien Absatz: ${auswahl.join(', ')}`)

  await menue.getByRole('menuitem', { name: 'Freier Absatz', exact: true }).click()
  await page.waitForFunction(anzahl => (
    document.querySelectorAll('#editor .ProseMirror > [data-block-id]').length === anzahl + 1
  ), vorher)

  if (await page.locator('#strukturModal').count()) await page.keyboard.press('Escape')
}

// Ein Fenster, drei Inhalte: Struktur und Quellen müssen aus derselben Hand kommen.
// Jakob: „das sieht eins zu eins aus wie das bei der Struktur auch das Overlay Fenster,
// da kann man sich eben ein visuelles Template bauen. Das ist alles kohärent aussieht."
async function assertQuellenFensterEineHandschrift(page) {
  await page.setViewportSize({ width: 1280, height: 900 })
  await ensureProjectSidebarOpen(page)

  const gestalt = async (oeffner, fensterId) => {
    await page.locator(oeffner).click()
    await page.locator(fensterId).waitFor({ state: 'visible' })
    const gemessen = await page.locator(fensterId).evaluate(fenster => {
      const koerper = fenster.querySelector('.onda-blaetter')
      const liste = fenster.querySelector('.onda-blaetter__liste')
      const tiefe = fenster.querySelector('.onda-blaetter__tiefe')
      const stil = koerper && getComputedStyle(koerper)
      const fensterStil = getComputedStyle(fenster)
      return {
        hatKoerper: Boolean(koerper),
        // Links die Liste, rechts der vertiefende Text — nicht andersherum.
        listeVorTiefe: Boolean(liste && tiefe
          && liste.getBoundingClientRect().left < tiefe.getBoundingClientRect().left),
        spalten: stil?.gridTemplateColumns ? stil.gridTemplateColumns.split(' ').length : 0,
        ecken: fensterStil.borderRadius,
        breite: Math.round(fenster.getBoundingClientRect().width),
      }
    })
    await page.keyboard.press('Escape')
    return gemessen
  }

  const struktur = await gestalt('#structureOpen', '#strukturModal')
  const quellen = await gestalt('#materialSources', '#materialModal')

  assert.equal(struktur.hatKoerper, true, 'Das Struktur-Fenster nutzt das gemeinsame Template nicht')
  assert.equal(quellen.hatKoerper, true, 'Das Quellen-Fenster nutzt das gemeinsame Template nicht')
  assert.equal(struktur.listeVorTiefe, true, 'Im Struktur-Fenster steht die Liste nicht links')
  assert.equal(quellen.listeVorTiefe, true, 'Im Quellen-Fenster steht die Liste nicht links')
  assert.equal(quellen.spalten, struktur.spalten, 'Die beiden Fenster teilen die Fläche verschieden auf')
  assert.equal(quellen.ecken, struktur.ecken, 'Die beiden Fenster haben verschiedene Ecken')
  assert.equal(quellen.breite, struktur.breite, 'Die beiden Fenster sind verschieden breit')
}

// „Links und rechts eingeklappt = ganz ruhig." Der Stift aus, die Leiste zu: dann
// steht nur noch der Text — und zwar in der Mitte, nicht 230px daneben.
async function assertRuhigeLage(page) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await ensureProjectSidebarOpen(page)
  const lesebreite = await page.evaluate(() => parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--container-reading'),
  ))

  await page.evaluate(() => {
    const stift = document.getElementById('annotationPresence')
    if (stift.getAttribute('aria-pressed') === 'true') stift.click()
  })
  if (await page.locator('#sidebarToggle').getAttribute('aria-expanded') === 'true') {
    await page.locator('#sidebarToggle').click()
  }
  await page.locator('#ondaSidebar').evaluate(async node => {
    await Promise.all(node.getAnimations().map(animation => animation.finished.catch(() => {})))
  })
  await page.waitForTimeout(420)

  const lage = await page.evaluate(() => {
    const spalte = document.querySelector('#editor .ProseMirror').getBoundingClientRect()
    return {
      breite: Math.round(spalte.width),
      versatz: Math.round((spalte.left + spalte.width / 2) - window.innerWidth / 2),
    }
  })
  assert.ok(lage.breite >= lesebreite, `Der Text ist in der ruhigen Lage auf ${lage.breite}px geschrumpft`)
  assert.ok(Math.abs(lage.versatz) <= 2, `Der Text steht in der ruhigen Lage ${lage.versatz}px neben der Mitte`)

  // Und nichts Schwebendes bleibt übrig außer den beiden Zeichen am Fensterrand.
  const uebrig = await page.evaluate(() => [...document.querySelectorAll('#editorView *')]
    .filter(node => {
      // Die eingeklappte Leiste zählt nicht: sie steht außerhalb des Fensters und ist
      // inert. Vorlesetexte zählen auch nicht — Zurückhaltung ist eine Frage der Augen.
      if (node.closest('#ondaSidebar')) return false
      const stil = getComputedStyle(node)
      if (stil.position !== 'fixed' && stil.position !== 'absolute') return false
      if (stil.visibility === 'hidden' || stil.display === 'none') return false
      if (stil.pointerEvents === 'none' || Number(stil.opacity) === 0) return false
      const kasten = node.getBoundingClientRect()
      return kasten.width >= 8 && kasten.height >= 8
    })
    .map(node => node.id || node.className))
  assert.deepEqual(uebrig.sort(), ['onda-topbar__aside', 'onda-topbar__lead'],
    `In der ruhigen Lage schwebt noch etwas: ${JSON.stringify(uebrig)}`)

  await page.evaluate(() => {
    const stift = document.getElementById('annotationPresence')
    if (stift.getAttribute('aria-pressed') === 'false') stift.click()
  })
  if (await page.locator('#sidebarToggle').getAttribute('aria-expanded') === 'false') {
    await page.locator('#sidebarToggle').click()
  }
}

// „Der Orb bleibt oben rechts. Fest, nicht mitwandernd."
// Er wanderte aus zwei Gründen: der Stift schob ihn beim Erscheinen um 44px, und ab
// 1712px schob ihn das Agentenfenster über padding-right an .onda-editor-col um 420px.
// Gemessen wird der Abstand zur RECHTEN Fensterkante — der darf sich unter keinem
// Zustandswechsel ändern.
async function assertOrbStaysPut(page) {
  // Gemessen wird der Anker (.onda-topbar__aside), nicht der Orb selbst: der Orb trägt
  // ein hover-scale(1.04), das seinen Kasten um ~1px verändert. Das ist eine Rückmeldung
  // auf den Zeiger, kein Wandern. Die rechte Kante des Ankers IST die rechte Kante des
  // Orbs — er ist das letzte Kind.
  const abstand = () => page.evaluate(() => {
    const kasten = document.querySelector('.onda-topbar__aside').getBoundingClientRect()
    return { rechts: Math.round(window.innerWidth - kasten.right), oben: Math.round(kasten.top) }
  })

  for (const width of [1200, 1800]) {
    await page.setViewportSize({ width, height: 900 })
    await page.waitForTimeout(30)
    const ruhe = await abstand()

    // Der Stift kommt und geht
    await page.evaluate(() => { document.getElementById('annotationPresence').hidden = true })
    assert.deepEqual(await abstand(), ruhe, `Der Orb wandert bei ${width}px, wenn der Stift verschwindet`)
    await page.evaluate(() => { document.getElementById('annotationPresence').hidden = false })
    assert.deepEqual(await abstand(), ruhe, `Der Orb wandert bei ${width}px, wenn der Stift erscheint`)

    // Das Agentenfenster geht auf und zu
    await page.locator('#ondaAura').click()
    await page.waitForTimeout(30)
    assert.deepEqual(await abstand(), ruhe, `Der Orb wandert bei ${width}px, wenn das Agentenfenster aufgeht`)
    await page.locator('#ondaAura').click()
    await page.waitForTimeout(30)
    assert.deepEqual(await abstand(), ruhe, `Der Orb wandert bei ${width}px, wenn das Agentenfenster zugeht`)
  }
}

// „Der Chat wächst aus dem Orb — nicht einblenden, nicht aufklappen, HERAUSWACHSEN."
// Das ist keine Stimmung, das ist messbar: der Sitzkreis der Silhouette muss auf der
// Tastfläche des Orbs liegen, und die zwei Kanten, an denen er sie berührt, dürfen
// sich während des ganzen Wachsens nicht bewegen. Bewegen sie sich, ist es ein Zoom
// mit transform-origin und kein Wachsen — genau der Fehler, den der Aufbau vermeidet.
async function assertBlaseWaechstAusDemOrb(page) {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.waitForTimeout(30)
  // Erst in den geschlossenen Zustand und die Faltung ganz abwarten. Wer den
  // Mitschreiber vorher anwirft, zeichnet die Bilder des Zugehens mit auf und prüft
  // hinterher die falsche Bewegung — dort führt die Höhe, hier soll die Breite führen.
  await page.evaluate(() => {
    if (document.getElementById('editorView').classList.contains('is-agent-open')) {
      document.getElementById('ondaAura').click()
    }
  })
  await page.waitForTimeout(500)
  await page.evaluate(() => {
    // Jedes gezeichnete Zwischenbild mitschreiben — geprüft wird die Bewegung, nicht
    // nur ihr Ergebnis.
    window.__blasenBilder = []
    const pfad = document.querySelector('.onda-blase__pfad')
    const beobachter = new MutationObserver(() => window.__blasenBilder.push(pfad.getAttribute('d')))
    beobachter.observe(pfad, { attributes: true, attributeFilter: ['d'] })
  })

  await page.locator('#ondaAura').click()
  await page.waitForTimeout(600)

  const lage = await page.evaluate(() => {
    const kasten = wahl => {
      const r = document.querySelector(wahl).getBoundingClientRect()
      return { links: r.left, oben: r.top, rechts: r.right, unten: r.bottom, breite: r.width, hoehe: r.height }
    }
    const orb = document.getElementById('ondaAura').getBoundingClientRect()
    return {
      blase: kasten('#ondaBlase'),
      fenster: kasten('#agentWidget'),
      // Der Orb trägt ein scale(1.04) — sein gemessener Kasten ist also gut 1px zu
      // groß. Die Mitte verschiebt eine Skalierung nicht, also wird von dort aus
      // gerechnet: die Tastfläche ist 44px, der Sitzradius folglich 22px.
      orbMitte: { x: (orb.left + orb.right) / 2, y: (orb.top + orb.bottom) / 2 },
      bilder: window.__blasenBilder || [],
      obenAuf: document.elementFromPoint((orb.left + orb.right) / 2, (orb.top + orb.bottom) / 2)?.id,
    }
  })

  const nah = (a, b, toleranz, was) => assert.ok(
    Math.abs(a - b) <= toleranz,
    `${was}: ${a.toFixed(2)} gegen ${b.toFixed(2)} (erlaubt ${toleranz}px)`,
  )

  // (a) Kontur und Fenster teilen sich exakt denselben Kasten. Nur so decken sich ihre
  //     Koordinatensysteme, und nur dann schneidet der Pfad den Inhalt richtig zu.
  for (const kante of ['links', 'oben', 'rechts', 'unten']) {
    nah(lage.blase[kante], lage.fenster[kante], 0.5, `Kontur und Fenster stehen auseinander (${kante})`)
  }

  // (b) Die zwei Kanten, die der Sitz berührt, sind die Kanten der Orb-Tastfläche.
  nah(lage.fenster.rechts, lage.orbMitte.x + 22, 0.5, 'Die Blase sitzt nicht an der rechten Orb-Kante')
  nah(lage.fenster.oben, lage.orbMitte.y - 22, 0.5, 'Die Blase sitzt nicht an der oberen Orb-Kante')

  // (c) Der gezeichnete Sitzkreis liegt auf dem Orb. Aus dem Pfad gelesen: die beiden
  //     letzten Bögen enden am obersten und am rechtesten Punkt des Sitzes.
  const sitzAusPfad = d => {
    const boegen = [...d.matchAll(/A 22 22 0 0 1 (-?[\d.]+) (-?[\d.]+)/g)]
    assert.equal(boegen.length, 2, `Der Pfad hat ${boegen.length} Sitzbögen statt zwei: ${d}`)
    return { x: Number(boegen[0][1]), y: Number(boegen[1][2]) }
  }
  assert.ok(lage.bilder.length >= 10, `Nur ${lage.bilder.length} Zwischenbilder — die Blase springt statt zu wachsen`)
  const letztes = sitzAusPfad(lage.bilder[lage.bilder.length - 1])
  nah(lage.blase.links + letztes.x, lage.orbMitte.x, 1, 'Der Sitzkreis sitzt nicht auf dem Orb (x)')
  nah(lage.blase.oben + letztes.y, lage.orbMitte.y, 1, 'Der Sitzkreis sitzt nicht auf dem Orb (y)')

  // (d) Und er sitzt dort in JEDEM Zwischenbild. Der Ursprung ist nicht ein Punkt, an
  //     dem eine Transformation ansetzt, sondern die zwei Kanten, die konstant bleiben.
  const sitze = lage.bilder.map(sitzAusPfad)
  const xWerte = new Set(sitze.map(punkt => punkt.x))
  const yWerte = new Set(sitze.map(punkt => punkt.y))
  assert.equal(xWerte.size, 1, `Der Sitz wandert waagerecht: ${[...xWerte].join(', ')}`)
  assert.equal(yWerte.size, 1, `Der Sitz wandert senkrecht: ${[...yWerte].join(', ')}`)

  // (e) Beim Wachsen führt die Breite. Beide starten gleichzeitig, die Breite hat die
  //     kürzere Strecke — daraus wird ein Aufblühen zur Seite und dann nach unten.
  const anteile = lage.bilder.map(d => {
    // Die beiden 16er-Bögen sind die untere rechte und die untere linke Ecke: der eine
    // endet auf der Unterkante, der andere auf der linken Kante.
    const ecken = [...d.matchAll(/A 16 16 0 0 1 (-?[\d.]+) (-?[\d.]+)/g)]
    const unten = Number(ecken[0][2])
    const links = Number(ecken[1][1])
    const spanne = (ist, klein, gross) => (ist - klein) / (gross - klein)
    return {
      breite: spanne(lage.blase.breite - 0.5 - links, MINDEST_BREITE, lage.blase.breite - 1),
      hoehe: spanne(unten - 0.5, MINDEST_HOEHE, lage.blase.hoehe - 1),
    }
  }).filter(anteil => anteil.breite > 0.05 && anteil.breite < 0.95)
  assert.ok(anteile.length >= 3, 'Zu wenige Zwischenbilder, um die Reihenfolge zu prüfen')
  assert.ok(
    anteile.every(anteil => anteil.breite >= anteil.hoehe - 0.02),
    `Die Höhe läuft der Breite davon: ${JSON.stringify(anteile.slice(0, 4))}`,
  )

  // (f) Der Orb bleibt der Ursprung und liegt über der Blase — sonst verschluckte sie
  //     genau die Schaltfläche, aus der sie kommt.
  assert.equal(lage.obenAuf, 'ondaAura', `Über dem Orb liegt "${lage.obenAuf}"`)

  // (g) Und danach ist nichts übrig: keine Kontur, keine Klassen am Fenster.
  await page.locator('#ondaAura').click()
  await page.waitForTimeout(500)
  const danach = await page.evaluate(() => ({
    konturVersteckt: document.getElementById('ondaBlase').hasAttribute('hidden'),
    klassen: document.getElementById('agentWidget').className,
  }))
  assert.equal(danach.konturVersteckt, true, 'Die Kontur bleibt nach dem Schließen stehen')
  assert.equal(danach.klassen, '', `Am Fenster bleibt "${danach.klassen}" hängen`)
}

async function assertOndaSurface(locator, name, { radius = '0px' } = {}) {
  const contract = await locator.evaluate(node => {
    const style = getComputedStyle(node)
    return {
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      radius: style.borderTopLeftRadius,
    }
  })
  assert.match(contract.fontFamily, /ABC Diatype/, `${name} verwendet nicht ABC Diatype`)
  assert.ok(['400', '500', '700'].includes(contract.fontWeight), `${name} verwendet Gewicht ${contract.fontWeight}`)
  assert.equal(contract.radius, radius, `${name} verwendet Radius ${contract.radius}`)
}

async function runSurfaces(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const screenshotDirectory = resolve(appRoot, 'evals/results/screenshots')
  if (screenshots) await mkdir(screenshotDirectory, { recursive: true })
  const captureSurface = async filename => {
    await page.locator('body').evaluate(async node => {
      await Promise.all(node.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})))
    })
    await page.screenshot({ path: resolve(screenshotDirectory, filename), fullPage: true })
  }
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await assertOndaSurface(page.locator('#home'), 'Bibliothek')

  await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
  await page.locator('#doclist .doc').first().click()
  await assertOndaSurface(page.locator('.onda-editor-col'), 'Schreibblatt')
  await assertOndaSurface(page.locator('.onda-sidebar'), 'Projektnavigation')

  await page.getByRole('button', { name: 'KI-Anschluss einrichten' }).click()
  await assertOndaSurface(page.locator('#kiModal'), 'KI-Anschluss', { radius: '16px' })
  if (screenshots) await captureSurface('onda-overlay-ki.png')
  await page.locator('#kiModal').getByRole('button', { name: 'Schließen' }).click()

  await page.getByRole('button', { name: 'Agentengespräch öffnen' }).click()
  await assertOndaSurface(page.locator('#agentWidget'), 'Agentengespräch', { radius: '16px' })
  if (screenshots) await captureSurface('onda-overlay-agent.png')
  await page.locator('#agentWidget').getByRole('button', { name: /schließen/i }).click()

  await page.locator('#pvCard').click()
  await page.locator('#argumentOpen').click()
  await assertOndaSurface(page.locator('#argumentModal'), 'Argumentationsdossier', { radius: '16px' })
  if (screenshots) await captureSurface('onda-overlay-argument.png')
  await page.locator('#argumentModal').getByRole('button', { name: 'Schließen' }).click()

  await page.locator('#pvCard').click()
  await page.locator('#auditOpen').click()
  await assertOndaSurface(page.locator('#auditModal'), 'Schlussaudit', { radius: '16px' })
  if (screenshots) await captureSurface('onda-overlay-audit.png')
  await page.locator('#auditModal').getByRole('button', { name: 'Schließen' }).click()
  await page.close()
}

async function runAccessibility(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await openExample(page)
  const seeded = await page.evaluate(() => {
    const block = window.AIWT.__blockIdentityTestBridge.getBlocks().find(candidate => candidate.text.length > 24)
    const target = block.text.slice(0, 28)
    window.AIWT.__workspaceTestBridge.injectFinding({
      id: 'onda-a11y', status: 'open', placement: 'passage', blockId: block.id,
      target, action: `${target} präzise`, short: 'Diese Formulierung kann genauer werden.',
      why: 'Die Aussage wird schneller verständlich.', folge: 'Die Bedeutung bleibt erhalten.',
      anmerkungsart: 'satzstil', createdAt: -5,
    })
    return block.id
  })
  assert.ok(seeded)

  for (const width of [1280, 1024, 720, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await page.waitForTimeout(30)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    assert.ok(overflow <= 1, `${width}px: ${overflow}px horizontaler Überlauf`)
    assert.equal(await page.locator('#editor .ProseMirror').isVisible(), true)
  }

  const mobileTargets = await page.locator('#sidebarToggle, #ondaAura, #structureTree, #materialTreeToggle')
    .evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect()
      return { id: node.id, width: rect.width, height: rect.height }
    }))
  assert.equal(mobileTargets.length, 4, 'Klinke, Orb und die beiden Baum-Pfeile müssen da sein')
  mobileTargets.forEach(target => {
    assert.ok(target.width >= 44 && target.height >= 44, `${target.id}: ${target.width}×${target.height}px`)
  })

  // EIN Knopf für beide Richtungen, tastaturbedienbar in beiden. Erst in einen
  // bekannten Zustand bringen, sonst misst die Prüfung, was der Zufall gerade zeigt.
  const klinkeSteht = async erwartet => {
    await page.waitForFunction(
      wert => document.getElementById('sidebarToggle').getAttribute('aria-expanded') === wert,
      erwartet,
    )
  }
  const klinkeDruecken = async () => {
    await page.locator('#sidebarToggle').focus()
    await page.keyboard.press('Enter')
  }
  if (await page.locator('#sidebarToggle').getAttribute('aria-expanded') === 'false') await klinkeDruecken()
  await klinkeSteht('true')
  assert.equal(await page.locator('#ondaSidebar').isVisible(), true)
  await klinkeDruecken()
  await klinkeSteht('false')
  // Eingeklappt ist die Leiste auch nicht mehr zu ertasten — sonst wanderte der Fokus
  // durch die Bedienelemente einer Fläche, die niemand sieht.
  assert.equal(await page.locator('#ondaSidebar').evaluate(node => node.inert), true)
  await klinkeDruecken()
  await klinkeSteht('true')
  assert.equal(await page.locator('#ondaSidebar').evaluate(node => node.inert), false)

  const motion = await page.locator('[data-annotation-form]').first().evaluate(node => getComputedStyle(node).animationDuration)
  assert.ok(parseFloat(motion) <= 0.001, `Reduzierte Bewegung dauert ${motion}`)

  // Wer keine Bewegung will, bekommt keine — auch nicht das Wachsen der Sprechblase.
  // Bei einer JS-Animation greift CSS nicht, also muss der Antrieb selbst nachfragen.
  // Verlangt wird nicht weniger Bewegung, sondern KEINE: ein einziges gezeichnetes
  // Bild, und zwar sofort das endgültige. Der Inhalt geht dabei nicht verloren — die
  // Blase sieht identisch aus, sie kommt nur nicht.
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.evaluate(() => {
    window.__blasenBilder = []
    const pfad = document.querySelector('.onda-blase__pfad')
    const beobachter = new MutationObserver(() => window.__blasenBilder.push(pfad.getAttribute('d')))
    beobachter.observe(pfad, { attributes: true, attributeFilter: ['d'] })
  })
  await page.locator('#ondaAura').click()
  await page.waitForTimeout(400)
  const ruhig = await page.evaluate(() => {
    const fenster = document.getElementById('agentWidget')
    const kasten = fenster.getBoundingClientRect()
    return {
      bilder: window.__blasenBilder,
      klassen: fenster.className,
      breite: kasten.width,
      hoehe: kasten.height,
      // assertReducedTransition in v2-smoke.mjs liest genau das — auf #agentWidget darf
      // deshalb keine CSS-transition liegen, nur Animationen und rAF.
      transition: getComputedStyle(fenster).transitionDuration,
    }
  })
  assert.equal(ruhig.bilder.length, 1, `Die Blase zeichnet ${ruhig.bilder.length} Bilder statt einem`)
  assert.equal(ruhig.klassen, 'hat-kontur', `Der Zuschnitt bleibt hängen: "${ruhig.klassen}"`)
  assert.ok(parseFloat(ruhig.transition) <= 0.001, `Das Agentenfenster überblendet ${ruhig.transition}`)
  const ecken = [...ruhig.bilder[0].matchAll(/A 16 16 0 0 1 (-?[\d.]+) (-?[\d.]+)/g)]
  assert.ok(Math.abs(Number(ecken[1][1]) - 0.5) < 0.01, `Die Blase steht links bei ${ecken[1][1]} statt in Endgröße`)
  assert.ok(Math.abs(Number(ecken[0][2]) - (ruhig.hoehe - 0.5)) < 0.01, `Die Blase steht unten bei ${ecken[0][2]} statt bei ${ruhig.hoehe - 0.5}`)
  await page.locator('#ondaAura').click()

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const severe = axe.violations.filter(item => ['critical', 'serious'].includes(item.impact))
  assert.deepEqual(severe.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), [])
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  if (requestedSection === 'all' || requestedSection === 'components') await runComponents(browser)
  if (requestedSection === 'all' || requestedSection === 'lab') await runLab(browser)
  if (requestedSection === 'all' || requestedSection === 'editor') await runEditor(browser)
  if (requestedSection === 'all' || requestedSection === 'risiko') await runRisikoTafel(browser)
  if (requestedSection === 'all' || requestedSection === 'unplatziert') await runHinweiseOhneStelle(browser)
  if (requestedSection === 'all' || requestedSection === 'shell') await runShell(browser)
  if (requestedSection === 'all' || requestedSection === 'surfaces') await runSurfaces(browser)
  if (requestedSection === 'all' || requestedSection === 'accessibility') await runAccessibility(browser)
  console.log(`ONDA UI ${requestedSection}: PASS`)
} finally {
  await browser.close()
  if (staticServer) await new Promise(resolveClose => staticServer.close(resolveClose))
}
