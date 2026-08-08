import test from 'node:test'
import assert from 'node:assert/strict'
import { FUNKTIONEN, UMSCHREIB_GRENZE, benennbar } from '../src/bausteinarten-vertrag.mjs'

test('die Funktionsschluessel bleiben genau die, die die Rechenlogik vergleicht', () => {
  assert.deepEqual([...FUNKTIONEN], ['claim', 'evidence', 'counterpoint', 'transition', 'question'])
})

test('benennbar lehnt Absaetze ohne Kennung ab', () => {
  const block = { type: 'paragraph', role: 'paragraph', text: 'Text' }
  assert.equal(benennbar(block), false)
})

test('benennbar lehnt Ueberschriften ab', () => {
  const heading = { id: 'h1', type: 'heading', role: 'heading', text: 'Ein Titel' }
  assert.equal(benennbar(heading), false)
})

test('benennbar lehnt Absaetze mit nur Whitespace ab', () => {
  const empty = { id: 'b1', type: 'paragraph', role: 'paragraph', text: '   ' }
  assert.equal(benennbar(empty), false)
})

test('benennbar akzeptiert Absaetze mit Kennung und Text', () => {
  const valid = { id: 'b1', type: 'paragraph', role: 'paragraph', text: 'Ein echter Absatz.' }
  assert.equal(benennbar(valid), true)
})

test('UMSCHREIB_GRENZE ist kalibriert', () => {
  assert.equal(UMSCHREIB_GRENZE, 0.5)
})
