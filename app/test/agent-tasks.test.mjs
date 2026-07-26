import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MODELLE, TASK_TABLE, PREISE, HINWEISE_SCHEMA, VERSTAENDNIS_SCHEMA,
  API_URL, baueAnfrage, schaetzeKostenCents,
} from '../src/agent-tasks.mjs'
import { SYSTEM_COACH } from '../src/agent-prompts.mjs'

test('TASK_TABLE ist vollstaendig und zeigt auf gueltige Modelle', () => {
  const tasks = ['verstaendnis', 'hinweise', 'chat', 'titel', 'zusammenfassung']
  assert.deepEqual(Object.keys(TASK_TABLE).sort(), tasks.slice().sort())
  for (const name of tasks) {
    const eintrag = TASK_TABLE[name]
    assert.ok(MODELLE[eintrag.modell], `Task ${name}: Modell ${eintrag.modell} unbekannt`)
    assert.ok(Number.isInteger(eintrag.maxTokens) && eintrag.maxTokens > 0)
    assert.equal(typeof eintrag.stream, 'boolean')
  }
  assert.equal(TASK_TABLE.chat.stream, true)
  assert.equal(TASK_TABLE.verstaendnis.schema, VERSTAENDNIS_SCHEMA)
  assert.equal(TASK_TABLE.hinweise.schema, HINWEISE_SCHEMA)
  assert.equal(TASK_TABLE.titel.maxTokens, 256)
  assert.equal(TASK_TABLE.zusammenfassung.maxTokens, 2000)
  assert.equal(MODELLE.stark, 'claude-opus-5')
  assert.equal(MODELLE.routine, 'claude-haiku-4-5')
})

test('Schemata verbieten Zusatzfelder und verlangen Pflichtfelder', () => {
  assert.equal(HINWEISE_SCHEMA.additionalProperties, false)
  assert.deepEqual(HINWEISE_SCHEMA.required, ['hinweise'])
  const hinweis = HINWEISE_SCHEMA.properties.hinweise.items
  assert.equal(hinweis.additionalProperties, false)
  assert.deepEqual(hinweis.properties.kategorie.enum,
    ['fakt', 'quelle', 'methode', 'logik', 'struktur', 'wirkung', 'erklaerung', 'sprache'])
  assert.deepEqual(hinweis.required,
    ['kategorie', 'anker', 'beobachtung', 'relevanz', 'folge', 'vorschlag', 'istGrundursache', 'integritaet'])
  assert.equal(VERSTAENDNIS_SCHEMA.additionalProperties, false)
  assert.deepEqual(VERSTAENDNIS_SCHEMA.required,
    ['task', 'audience', 'desiredEffect', 'evidenceStandard', 'protectedIntentions', 'openQuestions', 'antwortText'])
})

test('baueAnfrage: Wire-Format und Cache-Praefix-Ordnung exakt nach Vertrag', () => {
  const anfrage = baueAnfrage('hinweise', {
    verstaendnis: { task: 'Essay' },
    docText: 'Ein Absatz.',
    volatiles: ['Entscheidungen: keine', 'Bitte prüfe den Text.'],
  })
  assert.equal(anfrage.url, 'https://api.anthropic.com/v1/messages')
  assert.equal(anfrage.headers['content-type'], 'application/json')
  assert.equal(anfrage.headers['anthropic-version'], '2023-06-01')
  assert.ok(!('x-api-key' in anfrage.headers), 'Schluessel setzen nur die Transporte')
  assert.equal(anfrage.stream, false)
  const body = anfrage.body
  assert.equal(body.model, 'claude-opus-5')
  assert.equal(body.max_tokens, 16000)
  assert.ok(!('temperature' in body) && !('top_p' in body) && !('thinking' in body))
  assert.equal(body.system[0].text, SYSTEM_COACH)
  assert.deepEqual(body.system[0].cache_control, { type: 'ephemeral' })
  const content = body.messages[0].content
  assert.ok(content[0].text.startsWith('<projektverstaendnis>'))
  assert.ok(content[0].text.endsWith('</projektverstaendnis>'))
  assert.deepEqual(content[0].cache_control, { type: 'ephemeral' })
  assert.equal(content[1].text, '<dokument>Ein Absatz.</dokument>')
  assert.deepEqual(content[1].cache_control, { type: 'ephemeral' })
  assert.ok(!('cache_control' in content[2]) && !('cache_control' in content[3]))
  assert.deepEqual(body.output_config, { format: { type: 'json_schema', schema: HINWEISE_SCHEMA } })
  assert.ok(!('stream' in body))
})

test('baueAnfrage: chat streamt, Verlauf vor die aktuelle Frage, letzte Message nie assistant', () => {
  const anfrage = baueAnfrage('chat', {
    verstaendnis: { task: 'Essay' },
    docText: 'Text',
    volatiles: ['Frage der Autorin'],
    verlauf: [
      { role: 'user', content: 'alte Frage' },
      { role: 'assistant', content: 'alte Antwort' },
    ],
    anfrage: 'neue Frage',
  })
  assert.equal(anfrage.stream, true)
  assert.equal(anfrage.body.stream, true)
  assert.equal(anfrage.body.messages.length, 4)
  assert.equal(anfrage.body.messages[0].role, 'user')
  assert.ok(anfrage.body.messages[0].content[0].cache_control)
  assert.equal(anfrage.body.messages[1].role, 'user')
  assert.equal(anfrage.body.messages[1].content, 'alte Frage')
  assert.equal(anfrage.body.messages[2].role, 'assistant')
  assert.equal(anfrage.body.messages[2].content, 'alte Antwort')
  assert.equal(anfrage.body.messages[3].role, 'user')
  assert.equal(anfrage.body.messages[3].content, 'neue Frage')
  assert.ok(!('output_config' in anfrage.body))
})

test('baueAnfrage: letzte Message ist nie assistant (kein Prefill)', () => {
  const anfrage = baueAnfrage('chat', {
    docText: 'Text',
    verlauf: [
      { role: 'user', content: 'Q1' },
      { role: 'assistant', content: 'A1' },
    ],
    anfrage: 'Q2',
  })
  const msgs = anfrage.body.messages
  const lastMsg = msgs[msgs.length - 1]
  assert.equal(lastMsg.role, 'user', 'letzte Message muss user sein')
  assert.equal(lastMsg.content, 'Q2')
})

test('baueAnfrage wirft wenn Verlauf ohne anfrage', () => {
  assert.throws(
    () => baueAnfrage('chat', {
      docText: 'Text',
      verlauf: [{ role: 'user', content: 'Alte Frage' }],
    }),
    /anfrage fehlt bei vorhandenem verlauf/
  )
})

test('baueAnfrage ist deterministisch: zweimal bauen ergibt byte-gleiches JSON', () => {
  const kontext = { verstaendnis: { task: 'Essay', audience: 'Fachpublikum' }, docText: 'Absatz eins.' }
  const a = JSON.stringify(baueAnfrage('verstaendnis', kontext))
  const b = JSON.stringify(baueAnfrage('verstaendnis', kontext))
  assert.equal(a, b)
})

test('schaetzeKostenCents rechnet mit den Preiskonstanten', () => {
  // 1M In + 1M Out auf Opus 5: 5 $ + 25 $ = 30 $ = 3000 Cent
  assert.equal(schaetzeKostenCents({ input_tokens: 1_000_000, output_tokens: 1_000_000 }, 'claude-opus-5'), 3000)
  // Cache-Read 0,1x und Cache-Write 1,25x des Input-Preises: 0,5 $ + 6,25 $ = 675 Cent
  const nurCache = schaetzeKostenCents({
    input_tokens: 0, output_tokens: 0,
    cache_read_input_tokens: 1_000_000, cache_creation_input_tokens: 1_000_000,
  }, 'claude-opus-5')
  assert.ok(Math.abs(nurCache - 675) < 1e-9)
  // Haiku: 1 $ + 5 $ = 600 Cent
  assert.equal(schaetzeKostenCents({ input_tokens: 1_000_000, output_tokens: 1_000_000 }, 'claude-haiku-4-5'), 600)
  // Unbekanntes Modell und fehlende Felder werfen nie
  assert.equal(schaetzeKostenCents({}, 'unbekannt'), 0)
  assert.equal(schaetzeKostenCents(undefined, 'claude-opus-5'), 0)
})

test('baueAnfrage wirft bei unbekanntem Task und leerem Kontext', () => {
  assert.throws(() => baueAnfrage('quatsch', { docText: 'x' }), /Unbekannter Task/)
  assert.throws(() => baueAnfrage('chat', {}), /ohne Inhalt/)
})
