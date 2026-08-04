import test from 'node:test'
import assert from 'node:assert/strict'
import {
  AUFSCHAUEN_MS,
  ART_MOMENT,
  INNEHALTEN_AN_GRENZE_MS,
  INNEHALTEN_MS,
  MOMENTE,
  MOMENT_BEGRUENDUNG,
  aktuellerMoment,
  artVon,
  darfErscheinen,
  filtereNachMoment,
  istSatzende,
  momentFuerArt,
  momentTabelle,
} from '../src/momente-model.mjs'
import { HINWEISE_SCHEMA } from '../src/agent-tasks.mjs'
import { ERWEITERUNGS_ARTEN } from '../src/erweiterung-model.mjs'

// ---- Vollstaendigkeit der Tabelle -------------------------------------------
// Die Tabelle muss ALLE elf Arten abdecken. Kaeme eine zwoelfte Art dazu, ohne dass
// jemand ihren Moment bestimmt, faellt sie stillschweigend auf 'aufschauen' -- dieser
// Test macht daraus einen sichtbaren Fehlschlag.

test('jede Hinweisart aus dem Schema hat einen Moment', () => {
  const arten = HINWEISE_SCHEMA.properties.hinweise.items.properties.kategorie.enum
  for (const art of arten) {
    assert.ok(ART_MOMENT[art], `Hinweisart ohne Moment: ${art}`)
  }
})

test('jede Erweiterungsart hat einen Moment', () => {
  for (const art of ERWEITERUNGS_ARTEN) {
    assert.ok(ART_MOMENT[art], `Erweiterungsart ohne Moment: ${art}`)
  }
})

test('die Tabelle enthaelt genau elf Zeilen und keine ueberzaehlige', () => {
  const arten = HINWEISE_SCHEMA.properties.hinweise.items.properties.kategorie.enum
  assert.equal(Object.keys(ART_MOMENT).length, arten.length + ERWEITERUNGS_ARTEN.length)
  assert.equal(momentTabelle().length, 11)
})

test('jede Zeile hat eine Begruendung, keine leere Floskel', () => {
  for (const zeile of momentTabelle()) {
    assert.ok(MOMENT_BEGRUENDUNG[zeile.art], `ohne Begruendung: ${zeile.art}`)
    assert.ok(zeile.begruendung.length > 40, `Begruendung zu duenn: ${zeile.art}`)
  }
})

test('jeder Moment kommt in der Tabelle vor -- keiner ist tot', () => {
  const belegt = new Set(momentTabelle().map(zeile => zeile.moment))
  for (const moment of MOMENTE) assert.ok(belegt.has(moment), `Moment ohne Art: ${moment}`)
})

// ---- Die Umkehrung des alten Verhaltens -------------------------------------
// Vorher lag Rechtschreibung hinter einem Fenster, waehrend Strukturkritik alle drei
// Sekunden ansprang. Diese beiden Tests halten fest, dass es jetzt andersherum ist.

test('Sprache erscheint sofort', () => {
  assert.equal(momentFuerArt('sprache'), 'sofort')
  assert.ok(darfErscheinen('sprache', 'sofort'))
})

test('Struktur erscheint erst beim Aufschauen, nicht mitten im Satz', () => {
  assert.equal(momentFuerArt('struktur'), 'aufschauen')
  assert.equal(darfErscheinen('struktur', 'sofort'), false)
  assert.equal(darfErscheinen('struktur', 'innehalten'), false)
  assert.ok(darfErscheinen('struktur', 'aufschauen'))
})

test('Erweiterungen draengen sich nie mitten ins Schreiben', () => {
  for (const art of ERWEITERUNGS_ARTEN) {
    assert.equal(darfErscheinen(art, 'sofort'), false, art)
    assert.equal(darfErscheinen(art, 'innehalten'), false, art)
    assert.ok(darfErscheinen(art, 'aufschauen'), art)
  }
})

test('Momente sind aufsteigend: wer aufschaut, sieht auch das Sofortige', () => {
  assert.ok(darfErscheinen('sprache', 'aufschauen'))
  assert.ok(darfErscheinen('fakt', 'aufschauen'))
})

test('unbekannte Art faellt auf den zurueckhaltendsten Moment', () => {
  assert.equal(momentFuerArt('gibtsnicht'), 'aufschauen')
  assert.equal(darfErscheinen('gibtsnicht', 'sofort'), false)
})

// ---- Der erreichte Moment ----------------------------------------------------

test('waehrend des Schreibens ist der Moment sofort', () => {
  assert.equal(aktuellerMoment({ jetzt: 1000, lastInputAt: 900 }), 'sofort')
})

test('eine Pause mitten im Satz ist noch kein Innehalten', () => {
  const jetzt = 100000
  assert.equal(
    aktuellerMoment({ jetzt, lastInputAt: jetzt - (INNEHALTEN_MS - 1), anGrenze: false }),
    'sofort',
  )
})

test('nach einem Satzende genuegt eine kurze Ruhe fuer das Innehalten', () => {
  const jetzt = 100000
  assert.equal(
    aktuellerMoment({ jetzt, lastInputAt: jetzt - INNEHALTEN_AN_GRENZE_MS, anGrenze: true }),
    'innehalten',
  )
})

test('an einer Grenze OHNE Ruhe ist es noch kein Innehalten -- das waere jeder Tastendruck', () => {
  const jetzt = 100000
  assert.equal(aktuellerMoment({ jetzt, lastInputAt: jetzt - 10, anGrenze: true }), 'sofort')
})

test('lange Ruhe ist ein Aufschauen', () => {
  const jetzt = 500000
  assert.equal(aktuellerMoment({ jetzt, lastInputAt: jetzt - AUFSCHAUEN_MS }), 'aufschauen')
})

test('die Schreibansicht verlassen ist ein Aufschauen, egal wie kurz die Pause ist', () => {
  assert.equal(
    aktuellerMoment({ jetzt: 1000, lastInputAt: 999, editorSichtbar: false }),
    'aufschauen',
  )
})

test('von Hand angefordert ist immer ein Aufschauen', () => {
  assert.equal(aktuellerMoment({ jetzt: 1000, lastInputAt: 999, vonHand: true }), 'aufschauen')
})

test('ohne bekannte letzte Eingabe wird zurueckhaltend auf Aufschauen entschieden', () => {
  assert.equal(aktuellerMoment({ jetzt: 1000, lastInputAt: null }), 'aufschauen')
})

// ---- Filter ------------------------------------------------------------------

test('artVon liest Findings wie Erweiterungen', () => {
  assert.equal(artVon({ kiKategorie: 'sprache' }), 'sprache')
  assert.equal(artVon({ kategorie: 'logik' }), 'logik')
  assert.equal(artVon({ art: 'feld' }), 'feld')
  assert.equal(artVon(null), '')
})

test('filtereNachMoment laesst beim Schreiben nur Sprachliches durch', () => {
  const eintraege = [
    { kiKategorie: 'sprache' },
    { kiKategorie: 'logik' },
    { kiKategorie: 'struktur' },
    { art: 'weiterfuehrung' },
  ]
  assert.equal(filtereNachMoment(eintraege, 'sofort').length, 1)
  assert.equal(filtereNachMoment(eintraege, 'innehalten').length, 2)
  assert.equal(filtereNachMoment(eintraege, 'aufschauen').length, 4)
})

// ---- Satzende als Ereignis ---------------------------------------------------
// Der Auslöser-Text versprach "Satz- oder Absatzende"; gebaut war nur das Absatzende.
// Diese Prüfungen halten fest, dass die Beschriftung jetzt der Wahrheit entspricht --
// und dass es ein Ereignis bleibt, kein Zustand.

test('Punkt, Ausrufe- und Fragezeichen beenden einen Satz', () => {
  for (const zeichen of ['.', '!', '?', '…']) {
    assert.ok(istSatzende(zeichen), zeichen)
  }
})

test('Buchstaben, Leerzeichen und Komma beenden keinen Satz', () => {
  for (const zeichen of ['a', ' ', ',', ';', ':', '-']) {
    assert.equal(istSatzende(zeichen), false, zeichen)
  }
})

test('istSatzende prueft ein EREIGNIS, keinen Zustand', () => {
  // Ein ganzer Satz ist kein Satzende -- sonst zaehlte jeder Tastendruck hinter dem
  // Punkt erneut. Genau dieser Unterschied hat einen frueheren Prototyp aus drei
  // Treffern 122 machen lassen.
  assert.equal(istSatzende('Ein ganzer Satz.'), false)
  assert.equal(istSatzende(''), false)
  assert.equal(istSatzende(null), false)
  assert.equal(istSatzende(undefined), false)
})

test('nach einem Satzende genuegt die kurze Ruhe -- wie nach einem Absatzende', () => {
  const jetzt = 200000
  assert.equal(
    aktuellerMoment({ jetzt, lastInputAt: jetzt - INNEHALTEN_AN_GRENZE_MS, anGrenze: istSatzende('.') }),
    'innehalten',
  )
})
