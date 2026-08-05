import test from 'node:test'
import assert from 'node:assert/strict'
import {
  HINWEISE_SCHEMA,
  baueAnfrage,
  hinweiseSchemaFuerModus,
} from '../src/agent-tasks.mjs'
import {
  HINWEIS_ANWEISUNG,
  hinweisAnweisungFuerModus,
} from '../src/agent-prompts.mjs'
import {
  NOTE_ANNOTATION_KINDS,
  TEXT_ANNOTATION_KINDS,
} from '../src/annotation-contract.mjs'
import { verarbeiteHinweisantwort } from '../src/hinweislauf-model.mjs'

test('Textmodus-Schema erlaubt exakt die 24 Textarten und verlangt anmerkungsart', () => {
  const schema = hinweiseSchemaFuerModus('text')
  const item = schema.properties.hinweise.items
  assert.equal(schema, HINWEISE_SCHEMA)
  assert.deepEqual(item.properties.anmerkungsart.enum, TEXT_ANNOTATION_KINDS)
  assert.ok(item.required.includes('anmerkungsart'))
  assert.equal(item.additionalProperties, false)
})

test('Notizmodus-Schema erlaubt ausschließlich die fünf Notizarten', () => {
  const schema = hinweiseSchemaFuerModus('notiz')
  const item = schema.properties.hinweise.items
  assert.deepEqual(item.properties.anmerkungsart.enum, NOTE_ANNOTATION_KINDS)
  assert.ok(item.required.includes('anmerkungsart'))
  assert.notEqual(schema, HINWEISE_SCHEMA)
})

test('Anfrage verwendet das Schema des ausdrücklich gewählten Arbeitsmodus', () => {
  const text = baueAnfrage('hinweise', { docText: 'Text', annotationMode: 'text' })
  const notiz = baueAnfrage('hinweise', { docText: 'Notiz', annotationMode: 'notiz' })
  assert.deepEqual(text.body.output_config.format.schema.properties.hinweise.items.properties.anmerkungsart.enum, TEXT_ANNOTATION_KINDS)
  assert.deepEqual(notiz.body.output_config.format.schema.properties.hinweise.items.properties.anmerkungsart.enum, NOTE_ANNOTATION_KINDS)
})

test('Prompts erklären die genaue Art positiv und schützen lose Notizen vor Korrekturen', () => {
  assert.equal(hinweisAnweisungFuerModus('text'), HINWEIS_ANWEISUNG)
  for (const kind of TEXT_ANNOTATION_KINDS) assert.ok(HINWEIS_ANWEISUNG.includes(kind), `${kind} fehlt`)
  const notiz = hinweisAnweisungFuerModus('notiz')
  for (const kind of NOTE_ANNOTATION_KINDS) assert.ok(notiz.includes(kind), `${kind} fehlt`)
  for (const forbidden of ['Rechtschreibung', 'Grammatik', 'Zeichensetzung']) {
    assert.ok(notiz.includes(`${forbidden} meldest du nicht`))
  }
})

test('Verarbeitung verwirft eine genaue Art aus dem falschen Modus, liest Legacy aber weiter', () => {
  const docText = 'Eine lose Notiz'
  const blocks = [{ id: 'b1', text: docText }]
  const base = {
    kategorie: 'sprache',
    anker: docText,
    beobachtung: 'Test',
    relevanz: 'Test',
    folge: 'Test',
    muster: 'Test',
    vorschlagsart: 'keiner',
    stilmittelId: null,
    vorschlag: null,
    istGrundursache: false,
    integritaet: false,
  }
  const wrong = verarbeiteHinweisantwort({
    geliefert: [{ ...base, anmerkungsart: 'rechtschreibung' }],
    docText,
    blocks,
    annotationMode: 'notiz',
  })
  assert.equal(wrong.uebernommen.length, 0)
  assert.equal(wrong.verworfen, 1)

  const legacy = verarbeiteHinweisantwort({ geliefert: [base], docText, blocks, annotationMode: 'notiz' })
  assert.equal(legacy.uebernommen.length, 1)
})
