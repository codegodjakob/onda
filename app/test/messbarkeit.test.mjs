// Diese Prüfung bewacht den Wächter.
//
// src/messbarkeit.mjs entscheidet, ob ein rotes Ergebnis ein Befund an der App ist oder
// nur eine Messung, die nie stattgefunden hat. Beide Richtungen können weh tun:
//
//  · Erkennt sie zu WENIG, meldet der Prüflauf wieder Mängel, die es nicht gibt — am
//    9.8.2026 waren es 25 auf einmal, darunter alle sieben DESIGN-Zusagen.
//  · Erkennt sie zu VIEL, verschwindet ein echter Fehler hinter „war ja nur die
//    Umgebung". Das wäre die schlimmere Richtung.
//
// Deshalb steht hier beides: dass die bekannten Umgebungsausfälle erkannt werden, und
// dass ein echter Fehlschlag durchkommt.

import test from 'node:test'
import assert from 'node:assert/strict'
import { standDerPruefung, umgebungsFehler } from '../src/messbarkeit.mjs'

test('Ein toter Server auf 4173 ist kein Mangel an der App', () => {
  // Genau diese Ausgabe stand am 9.8.2026 dreiundzwanzig Mal im Protokoll.
  const echt = 'page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/\n'
    + 'Call log:\n  - navigating to "http://127.0.0.1:4173/", waiting until "networkidle"'
  const stand = standDerPruefung({ ok: false, ausgabe: echt })
  assert.equal(stand.stand, 'nicht-messbar')
  assert.match(stand.abhilfe, /4173/, 'Die Abhilfe muss sagen, was zu tun ist')
})

test('Ein fehlender Browser ist kein Mangel an der App', () => {
  const echt = "browserType.launch: Executable doesn't exist at /opt/pw-browsers/firefox-1538/firefox/firefox"
  assert.equal(standDerPruefung({ ok: false, ausgabe: echt }).stand, 'nicht-messbar')
})

test('Ein echter Fehlschlag kommt durch — und wird NICHT wegerklärt', () => {
  // Die wichtigste Zeile dieser Datei. Wäre sie rot, verstecken sich Fehler.
  const echt = 'not ok 3 - die Klammer sitzt am falschen Absatz\n  expected: 2\n  actual: 5'
  assert.equal(standDerPruefung({ ok: false, ausgabe: echt }).stand, 'fehlgeschlagen')
})

test('Eine grüne Prüfung bleibt grün, auch wenn das Wort im Protokoll steht', () => {
  // Eine Prüfung darf einen Verbindungsabbruch absichtlich herbeiführen und bestehen.
  // Ihr Protokoll enthält dann das Erkennungswort, ohne dass die Umgebung kaputt war.
  const stand = standDerPruefung({ ok: true, ausgabe: 'geprüft: bei ERR_CONNECTION_REFUSED zeigt Onda den Hinweis' })
  assert.equal(stand.stand, 'gelaufen')
})

test('Eine Prüfung darf selbst sagen, dass sie nichts messen konnte', () => {
  // Die verlässlichste Auskunft, weil sie nicht aus einer Fehlermeldung geraten ist.
  // DESIGN-06 liest den Stand einer anderen Prüfung; lief die nicht, weiß es nichts.
  const stand = standDerPruefung({ ok: false, ausgabe: 'NICHT MESSBAR: Die Gestalt-Prüfung hat kein Ergebnis gemeldet.' })
  assert.equal(stand.stand, 'nicht-messbar')
  assert.match(stand.grund, /Gestalt-Prüfung/)
})

test('Der echte DESIGN-06-Mangel bleibt ein Mangel', () => {
  // Die Gegenprobe zur Selbstauskunft: Wenn die Zuordnung Punkt→Eval wirklich nicht mehr
  // greift, ist das ein Befund an der App und muss rot bleiben.
  const echt = 'DESIGN-06 FEHLGESCHLAGEN:\n  Kein einziger umgesetzter Punkt gefunden — die Zuordnung greift nicht mehr.'
  assert.equal(standDerPruefung({ ok: false, ausgabe: echt }).stand, 'fehlgeschlagen')
})

test('Ohne Ausgabe wird nichts wegerklärt', () => {
  assert.equal(umgebungsFehler(''), null)
  assert.equal(umgebungsFehler(undefined), null)
  assert.equal(standDerPruefung({ ok: false, ausgabe: '' }).stand, 'fehlgeschlagen')
})

test('„nicht gemessen" ist nirgends dasselbe wie „bestanden"', async () => {
  // Der eigentliche Vertrag: Der Prüflauf darf ein ungemessenes Eval nie grün zählen.
  // Steht das nicht im Läufer, ist die ganze Unterscheidung eine Beruhigungspille.
  const { readFile } = await import('node:fs/promises')
  const laeufer = await readFile(new URL('../evals/run-fertigzustand.mjs', import.meta.url), 'utf8')
  assert.match(laeufer, /status: 'not-measurable'/, 'Der Läufer kennt den eigenen Stand nicht')
  // Der Gate-Fehler muss auch bei ungemessenen Evals ausgelöst werden, sonst wäre
  // Schweigen grün — die Falle, die dieses Projekt schon einmal zugeschnappt hat.
  assert.match(laeufer, /if \(zaehler\['not-measurable'\]\) \{\s*\n?\s*const gruende/,
    'Ungemessene Evals lösen keinen Gate-Fehler aus')
})
