import test from 'node:test'
import assert from 'node:assert/strict'
import { SYSTEM_COACH, INTERVIEW_REGELN, HINWEIS_ANWEISUNG, ERWEITERUNG_ANWEISUNG } from '../src/agent-prompts.mjs'
import { HINWEISE_SCHEMA } from '../src/agent-tasks.mjs'

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
