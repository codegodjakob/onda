import test from 'node:test'
import assert from 'node:assert/strict'
import { SYSTEM_COACH, INTERVIEW_REGELN, HINWEIS_ANWEISUNG, ERWEITERUNG_ANWEISUNG, BAUSTEINARTEN_ANWEISUNG } from '../src/agent-prompts.mjs'
import { HINWEISE_SCHEMA } from '../src/agent-tasks.mjs'
import { FUNKTIONEN } from '../src/bausteinarten-vertrag.mjs'
import {
  FEHLERBILDER,
  MECHANISMEN,
  MECHANISMUS_ERKLAERUNG,
  textartTabelleStilmittel,
  vorsichtsListe,
} from '../src/stilmittel.mjs'

test('SYSTEM_COACH definiert alle acht Hinweisarten mit ihren Schluesseln', () => {
  for (const art of ['fakt', 'quelle', 'methode', 'logik', 'struktur', 'wirkung', 'erklaerung', 'sprache']) {
    assert.ok(SYSTEM_COACH.includes(art), `Hinweisart ${art} fehlt im SYSTEM_COACH`)
  }
})

test('SYSTEM_COACH enthaelt die unverrueckbaren Regeln', () => {
  assert.ok(SYSTEM_COACH.includes('änderst nie selbst den Text'))
  assert.ok(SYSTEM_COACH.includes('erfindest nie Quellen'))
  assert.ok(SYSTEM_COACH.includes('wörtliches'))
  assert.ok(SYSTEM_COACH.includes('Integritätsfragen'))
})

test('Onda-Ton: du-Form, keine Ausrufezeichen in den Prompts', () => {
  for (const text of [SYSTEM_COACH, INTERVIEW_REGELN, HINWEIS_ANWEISUNG]) {
    assert.ok(!text.includes('!'), 'Ausrufezeichen gefunden')
    assert.ok(text.length > 200, 'Prompt ist kein Platzhalter')
  }
  assert.ok(SYSTEM_COACH.includes('Du '))
})

test('INTERVIEW_REGELN: vorschlagen statt ausfragen, eine gebuendelte Nachfrage', () => {
  assert.ok(INTERVIEW_REGELN.includes('Schlage vor'))
  assert.ok(INTERVIEW_REGELN.includes('eine gebündelte Nachfrage'))
  assert.ok(INTERVIEW_REGELN.includes('genau einer offenen Frage'))
  assert.ok(INTERVIEW_REGELN.includes('bindend'))
})

test('HINWEIS_ANWEISUNG: maximal drei, Grundursache zuerst, nichts wiederholen', () => {
  assert.ok(HINWEIS_ANWEISUNG.includes('höchstens drei'))
  assert.ok(HINWEIS_ANWEISUNG.includes('Grundursache zuerst'))
  assert.ok(HINWEIS_ANWEISUNG.includes('Wiederhole nichts'))
  assert.ok(HINWEIS_ANWEISUNG.includes('vorschlag: null'))
})

// Beide Kanaele verlangen das Muster, und beide erklaeren dasselbe darunter: das
// uebertragbare Prinzip, nicht die Beobachtung noch einmal.
test('HINWEIS_ANWEISUNG verlangt das Muster und erklaert, was gemeint ist', () => {
  assert.ok(HINWEIS_ANWEISUNG.includes('muster'), 'muster wird gar nicht verlangt')
  assert.ok(HINWEIS_ANWEISUNG.includes('Prinzip'), 'das Prinzip wird nicht benannt')
  assert.ok(HINWEIS_ANWEISUNG.includes('beim nächsten Text'), 'die Uebertragbarkeit fehlt')
  assert.ok(ERWEITERUNG_ANWEISUNG.includes('muster'), 'der zweite Kanal darf es nicht verlieren')
})

// Die Feldliste im Prompt und die im Schema muessen dieselbe sein: nennt der Prompt ein
// Pflichtfeld nicht, faellt es dem Modell nur durch die Schema-Erzwingung zu -- ohne jede
// Erklaerung, was hineingehoert.
test('HINWEIS_ANWEISUNG nennt jedes Pflichtfeld des Schemas', () => {
  for (const feld of HINWEISE_SCHEMA.properties.hinweise.items.required) {
    assert.ok(HINWEIS_ANWEISUNG.includes(feld), `Pflichtfeld ${feld} fehlt in der Anweisung`)
  }
})

// ---------- Stilmittel -------------------------------------------------------------------
// Die Hinweisart sprache konnte vorher nur "Wortwahl, Register oder Satzbau" sagen. Ein
// Begriff von Stilmitteln fehlte, und damit die Haelfte dessen, was die Art bedeuten soll.

test('Die Art sprache umfasst das ganze sprachliche Handwerk, nicht nur das Register', () => {
  for (const wort of ['Rechtschreibung', 'Grammatik', 'Zeichensetzung', 'Stilmittel']) {
    assert.ok(SYSTEM_COACH.includes(wort), `${wort} fehlt in der Beschreibung der Art sprache`)
  }
  assert.ok(SYSTEM_COACH.includes('Eigennamen'), 'die Ausnahme fuer Eigennamen fehlt')
  assert.ok(SYSTEM_COACH.includes('Strasse'), 'die regionale Variante wird nicht geschuetzt')
})

test('SYSTEM_COACH nennt die drei Mechanismen und alle Fehlerbilder aus der Tabelle', () => {
  for (const mechanismus of MECHANISMEN) {
    assert.ok(SYSTEM_COACH.includes(MECHANISMUS_ERKLAERUNG[mechanismus]),
      `Mechanismus ${mechanismus} steht nicht im Prompt`)
  }
  for (const bild of FEHLERBILDER) {
    assert.ok(SYSTEM_COACH.includes(bild.name), `Fehlerbild ${bild.id} fehlt`)
    assert.ok(SYSTEM_COACH.includes(bild.pruefFrage), `Fehlerbild ${bild.id} ohne Prueffrage`)
  }
})

// Der Kern: dieselbe Figur faellt bei zwei Textarten verschieden aus, und das Modell muss
// beide Seiten kennen — sonst empfiehlt es die Alliteration im Methodenteil.
test('SYSTEM_COACH traegt die Zuordnung Textart zu Stilmittel vollstaendig', () => {
  for (const zeile of textartTabelleStilmittel()) {
    if (!zeile.traegt.length && !zeile.aufgesetzt.length) continue
    assert.ok(SYSTEM_COACH.includes(zeile.name), `Textart ${zeile.textart} fehlt im Prompt`)
    for (const name of [...zeile.traegt, ...zeile.aufgesetzt]) {
      assert.ok(SYSTEM_COACH.includes(name), `${name} fehlt bei ${zeile.textart}`)
    }
  }
  assert.ok(SYSTEM_COACH.includes('Steht die Textart nicht fest, schlägst du gar kein Stilmittel vor'),
    'die Fail-closed-Regel fehlt')
})

test('SYSTEM_COACH warnt vor den Figuren, die ein Sprachmodell ueberstrapaziert', () => {
  for (const mittel of vorsichtsListe()) {
    assert.ok(SYSTEM_COACH.includes(mittel.vorsicht), `Vorsicht zu ${mittel.id} fehlt`)
  }
})

// Ein Etikett ist kein Hinweis. Wer nur "das ist eine Anapher" sagt, macht niemanden besser.
test('HINWEIS_ANWEISUNG verlangt Mechanismus und Prueffrage statt des blossen Etiketts', () => {
  assert.ok(HINWEIS_ANWEISUNG.includes('Stilmittel'))
  assert.ok(HINWEIS_ANWEISUNG.includes('Mechanismus'))
  assert.ok(HINWEIS_ANWEISUNG.includes('Prüffrage'))
  assert.ok(HINWEIS_ANWEISUNG.includes('aufgesetzt'))
  assert.ok(HINWEIS_ANWEISUNG.includes('Etikett'))
})

// ---------- Bausteinarten ------------------------------------------------------------------
// Der dritte Kanal. Seine Staerke liegt darin, die Textsorte zuerst zu finden, dann daraus
// die Arten abzuleiten -- nicht umgekehrt in eine allgemeine Schubladenliste zu sortieren.

test('BAUSTEINARTEN_ANWEISUNG hat vier Schritte in der richtigen Reihenfolge', () => {
  const schritt1 = BAUSTEINARTEN_ANWEISUNG.indexOf('Schritt 1')
  const schritt2 = BAUSTEINARTEN_ANWEISUNG.indexOf('Schritt 2')
  const schritt3 = BAUSTEINARTEN_ANWEISUNG.indexOf('Schritt 3')
  const schritt4 = BAUSTEINARTEN_ANWEISUNG.indexOf('Schritt 4')
  assert.ok(schritt1 >= 0 && schritt2 > schritt1 && schritt3 > schritt2 && schritt4 > schritt3,
    'Die vier Schritte muessen vorhanden und in Reihenfolge sein')
})

test('BAUSTEINARTEN_ANWEISUNG ordnet Textsorte zuerst, dann Arten aus dieser ab', () => {
  const textsorte = BAUSTEINARTEN_ANWEISUNG.indexOf('Textsorte')
  const arten = BAUSTEINARTEN_ANWEISUNG.indexOf('Arten')
  const reihenfolgeSatz = 'Textsorte zuerst'
  assert.ok(BAUSTEINARTEN_ANWEISUNG.includes('Textsorte: Bestimme zuerst'), 'Textsorte wird nicht eindeutig zuerst genannt')
  assert.ok(BAUSTEINARTEN_ANWEISUNG.includes('Leite daraus die Bausteinarten ab'), 'die Ableitung aus der Textsorte ist nicht genannt')
  assert.ok(textsorte < arten, 'Textsorte muss in der Anweisung vor Arten erscheinen')
})

test('BAUSTEINARTEN_ANWEISUNG nennt die Obergrenze: Hoechstens acht Arten', () => {
  assert.ok(BAUSTEINARTEN_ANWEISUNG.includes('Höchstens acht Arten'), 'die Obergrenze fehlt')
  assert.ok(BAUSTEINARTEN_ANWEISUNG.includes('mehr heißt, dass zu fein unterschieden wurde'), 'die Begruendung fehlt')
})

test('BAUSTEINARTEN_ANWEISUNG nennt alle Funktionen aus der Rechenlogik', () => {
  for (const funktion of FUNKTIONEN) {
    assert.ok(BAUSTEINARTEN_ANWEISUNG.includes(funktion), `Funktion ${funktion} fehlt`)
  }
})

test('BAUSTEINARTEN_ANWEISUNG lehrt die zwei Waechter: null ist richtig, hoechstens ONE claim', () => {
  assert.ok(BAUSTEINARTEN_ANWEISUNG.includes('null ist die richtige'), 'die Lehre, dass null richtig ist, fehlt')
  assert.ok(BAUSTEINARTEN_ANWEISUNG.includes('Höchstens EINE Art trägt claim'), 'die Eins-Claim-Regel fehlt')
})

test('BAUSTEINARTEN_ANWEISUNG schliesst Ueberschriften aus und loest Unsicherheit durch Weglassen', () => {
  assert.ok(BAUSTEINARTEN_ANWEISUNG.includes('Überschriften bekommen\nkeine Art'), 'Ueberschriften-Ausschluss fehlt')
  assert.ok(BAUSTEINARTEN_ANWEISUNG.includes('Bist du dir bei einem Absatz nicht sicher, lass ihn weg'), 'die Loesung via Weglassen fehlt')
})
