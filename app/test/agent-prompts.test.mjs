import test from 'node:test'
import assert from 'node:assert/strict'
import { SYSTEM_COACH, INTERVIEW_REGELN, HINWEIS_ANWEISUNG } from '../src/agent-prompts.mjs'

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
