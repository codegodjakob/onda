import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MODELLE, TASK_TABLE, PREISE, HINWEISE_SCHEMA, VERSTAENDNIS_SCHEMA, ERWEITERUNGEN_SCHEMA,
  QUELLENTHEMEN_SCHEMA, BAUSTEINARTEN_SCHEMA,
  API_URL, baueAnfrage, schaetzeKostenCents,
} from '../src/agent-tasks.mjs'
import { SYSTEM_COACH } from '../src/agent-prompts.mjs'
import { FUNKTIONEN } from '../src/bausteinarten-vertrag.mjs'

test('TASK_TABLE ist vollstaendig und zeigt auf gueltige Modelle', () => {
  const tasks = [
    'verstaendnis', 'hinweise', 'erweiterungen', 'quellenthemen', 'bausteinarten',
    'chat', 'titel', 'zusammenfassung',
  ]
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
  assert.equal(TASK_TABLE.erweiterungen.schema, ERWEITERUNGEN_SCHEMA)
  assert.equal(TASK_TABLE.quellenthemen.schema, QUELLENTHEMEN_SCHEMA)
  assert.equal(TASK_TABLE.bausteinarten.schema, BAUSTEINARTEN_SCHEMA)
  assert.equal(TASK_TABLE.titel.maxTokens, 256)
  assert.equal(TASK_TABLE.zusammenfassung.maxTokens, 2000)
  assert.equal(MODELLE.stark, 'claude-opus-5')
  assert.equal(MODELLE.routine, 'claude-haiku-4-5')
})

// Fix-Runde 2, Finding 5 (Important): auf claude-opus-5 deckelt max_tokens Denken UND Antwort
// zusammen (adaptives Denken ist auf diesem Modell standardmaessig an). Bei 16000 lief das
// regelmaessig auf stop_reason:'max_tokens', bevor die Antwort fertig war -- das Gateway
// verwirft den Lauf dann komplett, bezahlt und ohne Ergebnis (siehe agent-gateway.test.mjs,
// 'max_tokens: Lauf wird verworfen'). Die drei Opus-Aufgaben brauchen darum deutlich mehr Luft
// als vorher; chat streamt sichtbar und darf grosszuegiger sein als die beiden JSON-Aufgaben.
test('Fix-Runde 2, Finding 5: die drei Opus-Aufgaben haben deutlich mehr Budget als die frühere 16000-Grenze', () => {
  for (const name of ['verstaendnis', 'hinweise', 'erweiterungen', 'chat']) {
    assert.equal(TASK_TABLE[name].modell, 'stark', `Task ${name} sollte auf dem starken Modell laufen`)
    assert.ok(TASK_TABLE[name].maxTokens >= 32000, `Task ${name}: maxTokens (${TASK_TABLE[name].maxTokens}) sollte deutlich über der früheren 16000-Grenze liegen`)
  }
  assert.ok(TASK_TABLE.chat.maxTokens >= TASK_TABLE.hinweise.maxTokens, 'chat streamt und darf grosszuegiger budgetiert sein als die nicht-streamenden JSON-Aufgaben')
})

test('Schemata verbieten Zusatzfelder und verlangen Pflichtfelder', () => {
  assert.equal(HINWEISE_SCHEMA.additionalProperties, false)
  assert.deepEqual(HINWEISE_SCHEMA.required, ['hinweise'])
  const hinweis = HINWEISE_SCHEMA.properties.hinweise.items
  assert.equal(hinweis.additionalProperties, false)
  assert.deepEqual(hinweis.properties.kategorie.enum,
    ['fakt', 'quelle', 'methode', 'logik', 'struktur', 'wirkung', 'erklaerung', 'sprache'])
  assert.deepEqual(hinweis.required,
    ['kategorie', 'anmerkungsart', 'anker', 'beobachtung', 'relevanz', 'folge', 'muster', 'vorschlagsart', 'stilmittelId', 'vorschlag', 'istGrundursache', 'integritaet'])
  assert.deepEqual(hinweis.properties.vorschlagsart.enum, ['keiner', 'formulierung', 'stilmittel'])
  assert.ok(hinweis.properties.stilmittelId.anyOf[0].enum.includes('alliteration'))
  assert.deepEqual(hinweis.properties.stilmittelId.anyOf[1], { type: 'null' })
  assert.equal(VERSTAENDNIS_SCHEMA.additionalProperties, false)
  assert.deepEqual(VERSTAENDNIS_SCHEMA.required,
    ['task', 'audience', 'desiredEffect', 'evidenceStandard', 'protectedIntentions', 'openQuestions', 'antwortText'])
})

// Das Versprechen: hinter jeder Rueckmeldung wird das dahinterliegende System sichtbar.
// Der Erweiterungs-Kanal hatte dafuer ein Pflichtfeld, die acht Hinweisarten keines -- und
// weil die Feldliste geschlossen ist (additionalProperties: false), konnte das Modell ein
// Prinzip nicht einmal freiwillig nachreichen. Beide Kanaele verlangen es jetzt.
test('muster ist in BEIDEN Kanaelen Pflicht — nicht nur bei den Erweiterungen', () => {
  const hinweis = HINWEISE_SCHEMA.properties.hinweise.items
  const erweiterung = ERWEITERUNGEN_SCHEMA.properties.erweiterungen.items
  for (const [name, eintrag] of [['hinweise', hinweis], ['erweiterungen', erweiterung]]) {
    assert.ok(eintrag.required.includes('muster'), `Kanal ${name}: muster fehlt in required`)
    assert.equal(eintrag.properties.muster.type, 'string', `Kanal ${name}: muster ist kein Text`)
    assert.ok(eintrag.properties.muster.description.length > 20, `Kanal ${name}: muster ohne Erklaerung`)
  }
  // Reihenfolge zaehlt bei strukturierter Ausgabe: erst folge, dann muster, dann vorschlag --
  // erst begreifen, warum es zaehlt, dann verallgemeinern, dann eine Fassung anbieten.
  const felder = hinweis.required
  assert.ok(felder.indexOf('muster') > felder.indexOf('folge'))
  assert.ok(felder.indexOf('muster') < felder.indexOf('vorschlagsart'))
  assert.ok(felder.indexOf('stilmittelId') < felder.indexOf('vorschlag'))
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
  assert.equal(body.max_tokens, TASK_TABLE.hinweise.maxTokens)
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

// Der Wert des Erweiterungs-Kanals haengt ganz daran, das Naheliegende zu erkennen und zu
// verwerfen. Genau das kann ein Routine-Modell nicht -- es liefert zuverlaessig den
// erwartbaren Gedanken, also den einen, den die Autorin oder der Autor schon hatte.
// Ein Routine-Modell liefert bei einer Quellenliste zuverlaessig die Bibliotheksrubrik
// („Web-Quellen", „Sonstiges") — genau die Ordnung, die jeder Mensch selbst hinbekommt
// und die deshalb nichts wert ist. Das Budget darf klein sein: die Ausgabe sind Namen,
// ein Satz und Kennungen, gedacht wird viel mehr als geschrieben.
test('Quellenthemen laufen auf dem starken Modell, mit knapper Ausgabe', () => {
  assert.equal(TASK_TABLE.quellenthemen.modell, 'stark')
  assert.equal(TASK_TABLE.quellenthemen.stream, false)
  assert.ok(TASK_TABLE.quellenthemen.maxTokens >= 4000, 'zu knapp fuer Denken plus Antwort')
  assert.ok(TASK_TABLE.quellenthemen.maxTokens < TASK_TABLE.erweiterungen.maxTokens)
})

test('QUELLENTHEMEN_SCHEMA verlangt Name, Begruendung und Kennungen — und verbietet Zusatzfelder', () => {
  const gruppe = QUELLENTHEMEN_SCHEMA.properties.gruppen.items
  assert.deepEqual(gruppe.required.slice().sort(), ['name', 'quellenIds', 'warum'])
  assert.equal(gruppe.additionalProperties, false)
  assert.equal(QUELLENTHEMEN_SCHEMA.additionalProperties, false)
  assert.deepEqual(QUELLENTHEMEN_SCHEMA.required, ['gruppen'])
  // Die Beschreibungen tragen die eigentliche Weisung: keine Formatrubrik, keine
  // erfundene Kennung. Ohne sie waere das Schema nur eine Form.
  assert.match(gruppe.properties.name.description, /nie die Form|Restrubrik/)
  assert.match(gruppe.properties.quellenIds.description, /erfinden/)
})

test('Erweiterungen laufen auf dem starken Modell', () => {
  assert.equal(TASK_TABLE.erweiterungen.modell, 'stark')
  assert.equal(TASK_TABLE.erweiterungen.stream, false)
})

test('ERWEITERUNGEN_SCHEMA kennt genau die drei Arten und verlangt alle vier Felder', () => {
  const eintrag = ERWEITERUNGEN_SCHEMA.properties.erweiterungen.items
  assert.deepEqual(eintrag.properties.art.enum, ['weiterfuehrung', 'feld', 'verbindung'])
  assert.deepEqual(eintrag.required.slice().sort(), ['anker', 'art', 'gedanke', 'muster'])
  assert.equal(eintrag.additionalProperties, false)
  // anker ist eine LISTE: die Zahl der Stellen gehoert zur Art. Ein einzelnes Feld wuerde
  // das Modell einladen, fuer 'feld' eine Stelle zu erfinden.
  assert.equal(eintrag.properties.anker.type, 'array')
})

test('der Task bausteinarten laeuft auf dem starken Modell, ohne Strom', () => {
  const eintrag = TASK_TABLE.bausteinarten
  assert.equal(eintrag.modell, 'stark')
  assert.equal(eintrag.stream, false)
  assert.equal(eintrag.schema, BAUSTEINARTEN_SCHEMA)
})

test('das Schema laesst genau die Funktionen zu, die die Rechenlogik kennt — und null', () => {
  const funktion = BAUSTEINARTEN_SCHEMA.properties.arten.items.properties.funktion
  const erlaubt = funktion.anyOf.find(zweig => Array.isArray(zweig.enum))
  assert.deepEqual(erlaubt.enum, [...FUNKTIONEN])
  assert.ok(funktion.anyOf.some(zweig => zweig.type === 'null'))
})

test('das Schema ist geschlossen: keine erfundenen Felder, alle Felder Pflicht', () => {
  assert.equal(BAUSTEINARTEN_SCHEMA.additionalProperties, false)
  assert.deepEqual(BAUSTEINARTEN_SCHEMA.required, ['textsorte', 'arten', 'zuordnung'])
  const art = BAUSTEINARTEN_SCHEMA.properties.arten.items
  assert.equal(art.additionalProperties, false)
  assert.deepEqual(art.required, ['name', 'beschreibung', 'funktion'])
  const zu = BAUSTEINARTEN_SCHEMA.properties.zuordnung.items
  assert.equal(zu.additionalProperties, false)
  assert.deepEqual(zu.required, ['blockId', 'art'])
})

test('die Anfrage traegt das Schema und den gecachten Praefix', () => {
  const anfrage = baueAnfrage('bausteinarten', {
    verstaendnis: { thema: 'Calm Technology' },
    docText: 'Ein Absatz.',
    volatiles: ['Auftrag'],
  })
  assert.equal(anfrage.body.output_config.format.schema, BAUSTEINARTEN_SCHEMA)
  assert.equal(anfrage.body.model, 'claude-opus-5')
  assert.equal(anfrage.body.stream, undefined)
  const gecacht = anfrage.body.messages[0].content.filter(block => block.cache_control)
  assert.equal(gecacht.length, 2)
})
