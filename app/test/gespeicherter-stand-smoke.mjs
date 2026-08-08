// Der ganze Ladeweg — im echten Browser, mit der echten App.
//
// Der Unit-Test daneben (gespeicherter-stand.test.mjs) prueft die vier Zurechtbiege-
// Funktionen einzeln. Diese Pruefung geht den Weg, den Jakobs Rechner wirklich geht:
// ein alter Stand liegt in localStorage['aiwt.v2'], die App startet, und danach muss
// jeder Text, jedes Projekt und jede Einstellung wieder da sein.
//
// Sie deckt damit auch die zwei Schritte ab, die von aussen nicht importierbar sind
// (ensureDocShape und ensureProjectShape, heute noch lokal in src/editor.js).
//
// Die drei Staende liegen in app/test/gespeicherte-staende/; LIESMICH.md dort sagt,
// woher jeder stammt. Vorbild fuer das Vorgehen: app/test/etappe-b1-smoke.mjs.
//
// Voraussetzung: ein Server auf 4173 — `node scripts/dev-server.mjs --port=4173`.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const baseUrl = process.env.AIWT_URL || 'http://127.0.0.1:4173/'

const STAENDE = ['stand-schema-08.json', 'stand-schema-10.json', 'stand-schema-12.json']

function ladeStand(datei) {
  const pfad = fileURLToPath(new URL(`./gespeicherte-staende/${datei}`, import.meta.url))
  return JSON.parse(readFileSync(pfad, 'utf8'))
}

// Legt den Stand in den Browser-Speicher, BEVOR die App startet.
//
// Warum als Startskript und nicht per evaluate() nach dem ersten Aufruf: die App
// speichert nach dem Start von selbst. Wer den alten Stand erst danach hineinlegt und
// dann neu laedt, riskiert, dass die App ihn in der Zwischenzeit ueberschreibt — die
// Pruefung waere dann gruen, ohne je einen alten Stand gesehen zu haben.
// Der Riegel in sessionStorage sorgt dafuer, dass nur der erste Aufruf den Stand legt;
// ein spaeteres Neuladen sieht dann, was die App selbst geschrieben hat.
async function starteMitStand(page, stand) {
  await page.addInitScript(nutzlast => {
    if (sessionStorage.getItem('onda-stand-gelegt')) return
    sessionStorage.setItem('onda-stand-gelegt', 'ja')
    localStorage.clear()
    localStorage.setItem('aiwt.v2', nutzlast)
  }, JSON.stringify(stand))
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => !!(window.AIWT && window.AIWT.state && window.AIWT.state.editor))
}

async function lieszustand(page) {
  return page.evaluate(() => ({
    docs: window.AIWT.state.docs.map(d => ({
      id: d.id,
      title: d.title,
      body: d.body,
      projectId: d.projectId,
      exampleSeed: d.exampleSeed === true,
      laneKinds: (d.lane || []).map(c => c.kind),
    })),
    projects: window.AIWT.state.projects.map(p => ({ id: p.id, name: p.name })),
    activeProject: window.AIWT.state.activeProject,
    settings: window.AIWT.state.settings,
    memoryEventIds: (window.AIWT.state.memoryStore.events || []).map(e => e.id),
    memoryEntryIds: (window.AIWT.state.memoryStore.entries || []).map(e => e.id),
    laufGezeigt: (window.AIWT.state.laufJournal.gezeigt || []).map(g => g.findingId),
  }))
}

// Der Wortlaut ohne die technischen Bausteinkennungen. Die App vergibt beim Oeffnen
// data-block-id-Anker; das ist kein Verlust und keine Aenderung am Text. Genau diese
// Kennungen blendet auch seedBodySignature() in src/example-seed.mjs aus.
function wortlaut(body) {
  return String(body || '').replace(/\sdata-block-id=("[^"]*"|'[^']*')/g, '')
}

function pruefeTexteUndProjekteSindDa(stand, zustand, datei) {
  // Der Beispieltext darf durch die aktuelle Fassung ersetzt werden — jeder
  // andere Text ist Jakobs Arbeit und muss Wort fuer Wort wieder da sein.
  const eigene = stand.docs.filter(d => d.title !== 'Calm Technology')
  for (const original of eigene) {
    const danach = zustand.docs.find(d => d.id === original.id)
    assert.ok(danach, `${datei}: der Text „${original.title || 'Ohne Titel'}" (${original.id}) ist nach dem Laden weg`)
    assert.equal(wortlaut(danach.body), wortlaut(original.body), `${datei}: der Wortlaut von ${original.id} hat sich beim Laden geaendert`)
    assert.equal(danach.title, original.title, `${datei}: der Titel von ${original.id} hat sich beim Laden geaendert`)
    assert.ok(danach.projectId, `${datei}: ${original.id} haengt an keinem Projekt`)
    assert.ok(
      zustand.projects.some(p => p.id === danach.projectId),
      `${datei}: ${original.id} haengt an einem Projekt, das es nicht gibt`,
    )
  }
  for (const original of stand.projects) {
    const danach = zustand.projects.find(p => p.id === original.id)
    assert.ok(danach, `${datei}: das Projekt „${original.name}" (${original.id}) ist nach dem Laden weg`)
    assert.equal(danach.name, original.name, `${datei}: das Projekt ${original.id} heisst plotzlich anders`)
  }
}

// ---------- Schema 8 ----------

async function pruefeSchemaAcht(browser) {
  const datei = 'stand-schema-08.json'
  const stand = ladeStand(datei)
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
  const fehler = []
  page.on('pageerror', error => fehler.push(error.message))

  await starteMitStand(page, stand)
  const zustand = await lieszustand(page)

  pruefeTexteUndProjekteSindDa(stand, zustand, datei)

  // Die Einstellungen: was gesetzt war, bleibt gesetzt.
  assert.equal(zustand.settings.theme, 'dark', `${datei}: das gewaehlte Erscheinungsbild ist weg`)
  assert.equal(zustand.settings.spellcheck, true, `${datei}: die Rechtschreibpruefung ist weg`)
  assert.equal(zustand.settings.showWords, false, `${datei}: die Wortzahl-Einstellung ist weg`)
  // Was kaputt war, ist repariert — nicht geloescht.
  assert.equal(zustand.settings.structWidth, 940, `${datei}: die unmoegliche Spaltenbreite wurde nicht auf das Maximum gezogen`)
  assert.equal(zustand.settings.accent, 'sky', `${datei}: der unbekannte Farbton faellt nicht auf den Standard zurueck`)
  // Was es damals nicht gab, entsteht sicher: eine Kostenbremse, kein geloester Zaehler.
  assert.equal(zustand.settings.kiMonatsbudgetCents, 1000, `${datei}: die lokale Kostenbremse fehlt`)
  assert.equal(typeof zustand.settings.usage.monat, 'string', `${datei}: der Verbrauchszaehler fehlt`)

  // Der Text ohne Projekt bekommt eines, statt unsichtbar zu werden.
  const notizen = zustand.docs.find(d => d.id === 'd-alt-notizen')
  assert.ok(notizen, `${datei}: der Text ohne Projektzuordnung ist verschwunden`)
  assert.ok(notizen.projectId, `${datei}: der Text ohne Projektzuordnung haengt weiter im Nichts`)

  // Die Anmerkung ohne Art bekommt die Standard-Art, statt zu verschwinden.
  const hausarbeit = zustand.docs.find(d => d.id === 'd-alt-hausarbeit')
  assert.deepEqual(hausarbeit.laneKinds, ['form'], `${datei}: die Anmerkung ohne Art hat den Ladeweg nicht ueberlebt`)

  // Der fehlende Gedaechtnisspeicher und das fehlende Lauf-Journal entstehen sicher.
  // Ereignisse leitet die App aus den vorhandenen Texten selbst ab — Eintraege dagegen
  // sind einwilligungsgebundener Inhalt und duerfen aus dem Nichts nicht entstehen.
  assert.ok(Array.isArray(zustand.memoryEventIds), `${datei}: der Gedaechtnisspeicher fehlt`)
  assert.deepEqual(zustand.memoryEntryIds, [], `${datei}: aus dem Nichts kamen Gedaechtnis-Eintraege`)
  assert.ok(Array.isArray(zustand.laufGezeigt), `${datei}: das Lauf-Journal fehlt`)

  assert.deepEqual(fehler, [], `${datei}: die Seite hat beim Laden Fehler geworfen`)
  await page.close()
}

// ---------- Schema 10 ----------

async function pruefeSchemaZehn(browser) {
  const datei = 'stand-schema-10.json'
  const stand = ladeStand(datei)
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
  const fehler = []
  page.on('pageerror', error => fehler.push(error.message))

  await starteMitStand(page, stand)
  const zustand = await lieszustand(page)

  pruefeTexteUndProjekteSindDa(stand, zustand, datei)

  assert.equal(zustand.settings.theme, 'light', `${datei}: das gewaehlte Erscheinungsbild ist weg`)
  assert.equal(zustand.settings.accent, 'clay', `${datei}: der gewaehlte Farbton ist weg`)
  assert.equal(zustand.settings.structWidth, 620, `${datei}: die gewaehlte Spaltenbreite ist weg`)
  assert.equal(zustand.settings.sidebarCollapsed, true, `${datei}: die eingeklappte Seitenleiste ist weg`)

  // Das Gedaechtnis: jedes gespeicherte Ereignis, jeder Eintrag wieder da. Die App legt
  // beim Laden zusaetzlich abgeleitete Ereignisse an — die alten duerfen dabei nicht
  // verdraengt werden.
  for (const ereignis of stand.memoryStore.events) {
    assert.ok(zustand.memoryEventIds.includes(ereignis.id), `${datei}: das Gedaechtnis-Ereignis ${ereignis.id} ist verlorengegangen`)
  }
  assert.deepEqual(zustand.memoryEntryIds, ['me-zehn-1'], `${datei}: ein Gedaechtnis-Eintrag ist verlorengegangen`)

  // Der alte Beispieltext wird wiedererkannt und ersetzt — nicht verdoppelt.
  const beispiele = zustand.docs.filter(d => d.title === 'Calm Technology')
  assert.equal(beispiele.length, 1, `${datei}: der alte Beispieltext wurde nicht wiedererkannt — es liegen jetzt ${beispiele.length} da`)
  assert.equal(beispiele[0].exampleSeed, true, `${datei}: der Beispieltext traegt keine Saat-Markierung`)
  assert.equal(zustand.settings.exampleVersion, 10, `${datei}: die Beispielversion wurde nicht nachgezogen`)

  // Die Quellen des Projekts sind noch da.
  const quellen = await page.evaluate(() => {
    const p = window.AIWT.state.projects.find(x => x.id === 'p-essay')
    return { ids: (p.sources || []).map(q => q.id), titel: (p.sources || []).map(q => q.title) }
  })
  assert.deepEqual(quellen.ids, ['q-zehn-1'], `${datei}: die Quelle des Projekts ist verlorengegangen`)
  assert.deepEqual(quellen.titel, ['Weiser & Brown (1996)'], `${datei}: der Titel der Quelle ist verlorengegangen`)

  assert.deepEqual(fehler, [], `${datei}: die Seite hat beim Laden Fehler geworfen`)
  await page.close()
}

// ---------- Schema 12 ----------

async function pruefeSchemaZwoelf(browser) {
  const datei = 'stand-schema-12.json'
  const stand = ladeStand(datei)
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
  const fehler = []
  page.on('pageerror', error => fehler.push(error.message))

  await starteMitStand(page, stand)
  const zustand = await lieszustand(page)

  pruefeTexteUndProjekteSindDa(stand, zustand, datei)

  assert.equal(zustand.settings.accent, 'sage', `${datei}: der gewaehlte Farbton ist weg`)
  assert.equal(zustand.settings.structWidth, 700, `${datei}: die gewaehlte Spaltenbreite ist weg`)
  assert.equal(zustand.settings.theme, stand.settings.theme, `${datei}: das Erscheinungsbild hat sich geaendert`)

  // Das Lauf-Journal traegt die bereits gezeigten Anmerkungen — geht es verloren,
  // bekommt Jakob jeden Hinweis ein zweites Mal.
  assert.deepEqual(
    zustand.laufGezeigt,
    stand.laufJournal.gezeigt.map(g => g.findingId),
    `${datei}: die bereits gezeigten Anmerkungen sind verlorengegangen`,
  )
  assert.ok(zustand.laufGezeigt.length >= 29, `${datei}: es sind weniger als 29 gezeigte Anmerkungen uebrig`)

  assert.equal(zustand.activeProject, stand.activeProject, `${datei}: das zuletzt geoeffnete Projekt ist ein anderes`)

  assert.deepEqual(fehler, [], `${datei}: die Seite hat beim Laden Fehler geworfen`)
  await page.close()
}

// ---------- Rueckweg: laden, speichern, wieder laden ----------

// Der gefaehrlichste Fall: der Ladeweg verliert etwas, und der naechste Speichervorgang
// schreibt die verkuerzte Fassung zurueck. Danach ist es endgueltig weg. Diese Pruefung
// geht deshalb einmal hin und einmal zurueck.
async function pruefeSpeicherRueckweg(browser) {
  for (const datei of STAENDE) {
    const stand = ladeStand(datei)
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
    await starteMitStand(page, stand)
    await page.evaluate(() => window.AIWT.persist())
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForFunction(() => !!(window.AIWT && window.AIWT.state && window.AIWT.state.editor))
    const zustand = await lieszustand(page)

    pruefeTexteUndProjekteSindDa(stand, zustand, `${datei} (nach Speichern und erneutem Laden)`)

    const gespeichert = await page.evaluate(() => JSON.parse(localStorage.getItem('aiwt.v2')))
    assert.equal(gespeichert.schemaVersion, 12, `${datei}: der zurueckgeschriebene Stand traegt nicht die heutige Schema-Nummer`)
    for (const feld of ['docs', 'projects', 'settings', 'memoryStore', 'laufJournal', 'active', 'activeProject']) {
      assert.ok(feld in gespeichert, `${datei}: das Feld ${feld} fehlt im zurueckgeschriebenen Stand`)
    }
    await page.close()
  }
}

const browser = await chromium.launch()
try {
  await pruefeSchemaAcht(browser)
  await pruefeSchemaZehn(browser)
  await pruefeSchemaZwoelf(browser)
  await pruefeSpeicherRueckweg(browser)
  console.log('Gespeicherte Staende: Schema 8, 10 und 12 laden vollstaendig — Texte, Projekte, Einstellungen.')
} finally {
  await browser.close()
}
