// Die Geste im Text: Woran erkennt man SOFORT, welche Stelle gemeint ist?
//
// Bis zum 8.8.2026 trug der Absatz einen Punkt im Rand und sonst nichts — an den
// Woertern selbst stand keine Spur. Jakob dazu: „ich erkenn dann gar nicht direkt, um
// was es geht. Ich muss dann lesen, ich muss erst mal das richtig zuordnen zum Text."
//
// Hier steht die reine, DOM-freie Haelfte der Antwort: die Zuordnung Reichweite →
// Geste. Dass die Markierung im Browser auch auf den richtigen Zeichen landet, prueft
// onda-ui-smoke.mjs (assertGesteZeigtAufDieStelle).

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  ALL_ANNOTATION_KINDS,
  ANNOTATION_DEFINITIONS,
  gestaltFuerFinding,
  markierungsGestalt,
} from '../src/annotation-contract.mjs'

const GESTEN = new Set(['wort', 'satz', 'absatz', 'keine'])

test('Jede der 29 Arten bekommt genau eine gueltige Geste', () => {
  assert.equal(ALL_ANNOTATION_KINDS.length, 29, 'Die Zahl der Arten hat sich geaendert — dann auch diese Pruefung ansehen')
  for (const art of ALL_ANNOTATION_KINDS) {
    assert.ok(GESTEN.has(markierungsGestalt(art)), `${art} hat keine gueltige Geste`)
  }
})

test('Die Geste folgt der Reichweite, nicht der Gestalt der Karte', () => {
  // Der Punkt der ganzen Sache: Reichweite entscheidet, was im Text zu sehen ist.
  // Zwei Arten mit derselben Kartenform, aber verschiedener Reichweite, muessen im
  // Text verschieden aussehen — sonst sagt die Markierung nichts.
  assert.equal(ANNOTATION_DEFINITIONS.wortwahl.form, ANNOTATION_DEFINITIONS.grammatik.form)
  assert.notEqual(markierungsGestalt('wortwahl'), markierungsGestalt('grammatik'))

  assert.equal(markierungsGestalt('wortwahl'), 'wort')
  assert.equal(markierungsGestalt('satzstil'), 'satz')
  assert.equal(markierungsGestalt('absatzstil'), 'absatz')
  assert.equal(markierungsGestalt('ton'), 'absatz', 'Abschnitt gilt dem Absatz als Ganzem')
})

test('Wo es keine einzelne Stelle gibt, entsteht auch keine Markierung', () => {
  // 'Text' meint den ganzen Text, 'Titel' die Ueberschrift, die Notizarten stehen
  // ueberhaupt nicht im Fliesstext. Eine Strecke zu markieren hiesse hier, eine
  // Stelle zu behaupten, die niemand benannt hat.
  for (const art of ['terminologie', 'faden', 'widerspruch', 'ueberschrift', 'nachfrage', 'ordnen']) {
    assert.equal(markierungsGestalt(art), 'keine', `${art} markiert faelschlich eine Stelle`)
  }
})

test('Auch ein aelterer Eintrag ohne anmerkungsart bekommt seine Geste', () => {
  // Findings aus der Zeit vor dem Vertrag tragen ihre Art als kiKategorie. Ohne die
  // Toleranz von normalizeAnnotationFinding blieben sie fuer immer ohne Markierung.
  assert.equal(gestaltFuerFinding({ anmerkungsart: 'satzstil' }), 'satz')
  assert.equal(gestaltFuerFinding({ kiKategorie: 'sprache' }), markierungsGestalt(
    // Was die Altlast-Zuordnung daraus macht, entscheidet der Vertrag; hier zaehlt
    // nur, dass ueberhaupt etwas Gueltiges herauskommt und nichts abstuerzt.
    Object.keys(ANNOTATION_DEFINITIONS).find(art => gestaltFuerFinding({ kiKategorie: 'sprache' }) === markierungsGestalt(art)),
  ))
  assert.ok(GESTEN.has(gestaltFuerFinding({})), 'Ein leeres Finding bringt das Programm durcheinander')
  assert.ok(GESTEN.has(gestaltFuerFinding(null)), 'null bringt das Programm durcheinander')
})

test('Fuer jede Geste gibt es auch wirklich eine Gestalt im Stylesheet', () => {
  // Eine Geste ohne Regel waere unsichtbar — und niemand faende heraus, warum.
  return Promise.all([
    readFile(new URL('../src/style.css', import.meta.url), 'utf8'),
  ]).then(([css]) => {
    assert.match(css, /\.onda-stelle--wort\s*\{/, 'Die Wort-Kontur fehlt im Stylesheet')
    assert.match(css, /\.onda-stelle--satz\s*\{/, 'Der Satz-Strich fehlt im Stylesheet')
    assert.match(css, /\.hat-absatzweite-anmerkung::before\s*\{/, 'Die Absatz-Klammer fehlt im Stylesheet')

    // Und keine davon benutzt Farbe (Jakob, 8.8.2026: „keine farben bitte").
    // Gezaehlt wird bewusst NICHT: dieselbe Geste hat mehrere Regeln, unter anderem
    // eine im Ruhe-Modus (prefers-reduced-motion). Eine feste Zahl waere rot geworden,
    // sobald jemand eine legitime Regel dazuschreibt — und haette nichts gesagt.
    const gesten = css.match(/\.onda-stelle--(wort|satz)\s*\{[^}]*\}/g) || []
    assert.ok(gesten.length >= 2, 'Die Gesten haben gar keine eigenen Regeln')
    for (const regel of gesten) {
      assert.doesNotMatch(regel, /var\(--accent/, `Eine Geste greift wieder zur Farbe: ${regel.slice(0, 60)}`)
    }
    const klammer = css.match(/\.hat-absatzweite-anmerkung::before\s*\{[^}]*\}/g) || []
    for (const regel of klammer) {
      assert.doesNotMatch(regel, /var\(--accent/, 'Die Absatz-Klammer greift wieder zur Farbe')
    }
  })
})
