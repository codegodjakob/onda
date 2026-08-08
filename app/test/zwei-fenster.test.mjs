// Prüfung 2 aus Issue #17 (fremdes Fehlermodell, Befund 4 der Systemanalyse):
// ZWEI Fenster/Tabs auf demselben Dokument. Onda ist als Ein-Fenster-App gebaut —
// aber nichts hindert einen zweiten Tab, und genau solche ungeplanten Wege sind
// das Fehlermodell, das aus keinem eigenen vergangenen Fehler stammt.
//
// Was die Prüfung beim ersten Lauf gefunden und DOKUMENTIERT hat (Befund, kein Fix):
// Der gesamte Zustand (alle Projekte, alle Texte) wird als EIN Block gespeichert
// ('aiwt.v2'), und kein Fenster hört auf Änderungen des anderen (kein
// 'storage'-Ereignis im ganzen Quellcode). Drei Stufen desselben Problems:
// 1. Fenster B erfährt nie, was Fenster A schreibt — kein Abgleich.
// 2. Speichert B, gewinnt der letzte Schreiber: A's Satz ist still weg.
// 3. Und schärfer, als die Prüfung selbst vorhergesagt hatte: beim Verlassen
//    der Seite speichert JEDES Fenster noch einmal seinen ganzen alten Stand
//    (beforeunload -> flushSave, editor.js). Schon das Neuladen oder Schließen
//    eines vergessenen zweiten Tabs überschreibt damit alles, was seither
//    irgendwo gespeichert wurde. Kein Absturz, kein kaputtes JSON — nur Verlust.
// Dieser Test schreibt das BEOBACHTETE Verhalten fest: baut später jemand einen
// Fensterabgleich oder eine Konfliktwarnung, wird dieser Test rot und muss dann
// bewusst umgeschrieben werden — genau so soll es sein. Der offene Umbau ist als
// Issue #25 erfasst.
//
// Läuft wie d2-accessibility.test.mjs: eigener statischer Server, echtes Chromium,
// EIN Browser-Kontext (zwei Tabs teilen sich localStorage wie im echten Browser).
// Braucht das gebaute Bundle (npm run build).

import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { ZWEITER_SEED_ABSAETZE } from '../evals/fixtures/zweiter-seed.mjs'
import { starteAppServer } from './helpers/onda-server.mjs'


const { baseUrl, stop: serverStoppen } = await starteAppServer()

// Der Ausgangstext kommt aus dem zweiten Seed (anderes Genre) — damit auch diese
// Prüfung nicht am einen Beispieltext „Calm Technology" hängt.
const AUSGANG = ZWEITER_SEED_ABSAETZE[0]
const SATZ_A = 'Fenster A hat diesen Satz ergänzt und gespeichert.'
const SATZ_B = 'Fenster B hat stattdessen diesen Satz ergänzt.'

function absatz(blockId, text) {
  return { type: 'paragraph', attrs: { blockId, semanticRole: null }, content: [{ type: 'text', text }] }
}

// Schreibt die gegebenen Absätze in den Editor des Fensters und speichert sofort —
// derselbe Weg, den d2-accessibility.test.mjs benutzt (Test-Brücke + flushSave).
async function schreibeUndSpeichere(page, absaetze) {
  await page.evaluate(inhalt => {
    window.AIWT.__blockIdentityTestBridge.setContent(inhalt)
    window.AIWT.flushSave()
  }, absaetze)
}

function editorText(page) {
  return page.evaluate(() => document.querySelector('#editor .ProseMirror').innerText)
}

const browser = await chromium.launch({ headless: true })
try {
  const kontext = await browser.newContext({ viewport: { width: 1280, height: 900 } })

  // Fenster A: frische App, ein eigenes Dokument mit dem Ausgangstext, gespeichert.
  const fensterA = await kontext.newPage()
  await fensterA.goto(baseUrl, { waitUntil: 'networkidle' })
  await fensterA.evaluate(() => localStorage.clear())
  await fensterA.reload({ waitUntil: 'networkidle' })
  const docId = await fensterA.evaluate(() => {
    window.AIWT.newProject('Zwei Fenster')
    window.AIWT.newDoc()
    return window.AIWT.state.active
  })
  await schreibeUndSpeichere(fensterA, [absatz('zf-ausgang', AUSGANG)])

  // Fenster B: zweiter Tab im selben Browser, öffnet DASSELBE Dokument.
  const fensterB = await kontext.newPage()
  await fensterB.goto(baseUrl, { waitUntil: 'networkidle' })
  await fensterB.evaluate(id => window.AIWT.openDoc(id), docId)
  assert.match(await editorText(fensterB), /MODERATORIN/, 'Fenster B sieht den gespeicherten Ausgangstext')

  // Fenster A ergänzt einen Satz und speichert. Der Speicher hat ihn jetzt.
  await schreibeUndSpeichere(fensterA, [absatz('zf-ausgang', AUSGANG), absatz('zf-a', SATZ_A)])
  const nachA = await fensterA.evaluate(() => JSON.parse(localStorage.getItem('aiwt.v2')))
  assert.match(nachA.docs.find(d => d.id === docId).body, /Fenster A/, 'nach dem Speichern von A steht Satz A im Speicher')

  // BEFUND, Teil 1: Fenster B erfährt davon nichts — kein Abgleich zwischen Fenstern.
  const textB = await editorText(fensterB)
  assert.doesNotMatch(textB, /Fenster A/,
    'dokumentiertes Verhalten: kein storage-Listener, Fenster B zeigt weiter seinen alten Stand')

  // Fenster B ergänzt — ahnungslos auf seinem alten Stand — einen anderen Satz und speichert.
  await schreibeUndSpeichere(fensterB, [absatz('zf-ausgang', AUSGANG), absatz('zf-b', SATZ_B)])

  // BEFUND, Teil 2: der letzte Schreiber gewinnt. Satz A ist still verloren —
  // kein Fehler, keine Warnung, kein kaputter Speicher. Einfach weg.
  const nachB = await fensterB.evaluate(() => JSON.parse(localStorage.getItem('aiwt.v2')))
  const koerper = nachB.docs.find(d => d.id === docId).body
  assert.match(koerper, /Fenster B/, 'Satz B ist gespeichert')
  assert.doesNotMatch(koerper, /Fenster A/,
    'dokumentiertes Verhalten (stiller Textverlust): B hat den ganzen Zustand aus SEINEM Gedächtnis geschrieben — ohne Satz A')
  assert.equal(typeof nachB.schemaVersion, 'number', 'der Speicher bleibt formal intakt — der Verlust ist lautlos')

  // BEFUND, Teil 3 — die Überraschung des ersten Laufs: Fenster A lädt neu und
  // sieht … wieder den EIGENEN Satz. Denn beim Verlassen der Seite speichert A
  // per beforeunload noch einmal seinen ganzen (alten) Stand und überschreibt
  // damit B's Speicherung. Der bloße Reload eines veralteten Fensters macht die
  // Arbeit des anderen rückgängig.
  await fensterA.reload({ waitUntil: 'networkidle' })
  await fensterA.evaluate(id => window.AIWT.openDoc(id), docId)
  const textAdanach = await editorText(fensterA)
  assert.match(textAdanach, /Fenster A hat/,
    'dokumentiertes Verhalten: A\'s Abschieds-Speicherung (beforeunload -> flushSave) hat B\'s Stand überschrieben')
  assert.doesNotMatch(textAdanach, /Fenster B/,
    'B\'s Satz ist durch das bloße Neuladen von Fenster A verloren gegangen — ohne dass in B irgendwer speicherte')
  const amEnde = await fensterA.evaluate(() => JSON.parse(localStorage.getItem('aiwt.v2')))
  assert.equal(typeof amEnde.schemaVersion, 'number', 'der Speicher bleibt auch nach dem Hin und Her formal intakt')

  console.log('Zwei-Fenster-Prüfung: Verhalten dokumentiert — letzter Schreiber gewinnt, sogar beim bloßen Verlassen der Seite; der Verlust bleibt lautlos.')
} finally {
  await browser.close()
  await serverStoppen()
}
