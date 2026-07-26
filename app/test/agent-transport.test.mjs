import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseSseZeilen,
  direktTransport, brueckenTransport, waehleTransport,
  mapHttpStatus, mischeUsage, ergebnisAusAntwortJson, API_KEY_STORAGE,
} from '../src/agent-transport.mjs'

function sse(payload) { return 'data: ' + JSON.stringify(payload) + '\n\n' }

test('text_delta-Events kommen in Reihenfolge als delta heraus', () => {
  const puffer = { rest: '' }
  const chunk =
    'event: content_block_delta\n' + sse({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hal' } }) +
    'event: content_block_delta\n' + sse({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'lo' } })
  const events = parseSseZeilen(puffer, chunk)
  assert.deepEqual(events, [{ typ: 'delta', text: 'Hal' }, { typ: 'delta', text: 'lo' }])
  assert.equal(puffer.rest, '')
})

test('zerrissenes Event über Chunk-Grenzen wird erst nach dem zweiten Chunk geliefert', () => {
  const puffer = { rest: '' }
  const ganz = 'data: ' + JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Grüße' } }) + '\n'
  const schnitt = Math.floor(ganz.length / 2)
  assert.deepEqual(parseSseZeilen(puffer, ganz.slice(0, schnitt)), [])
  assert.equal(puffer.rest, ganz.slice(0, schnitt))
  assert.deepEqual(parseSseZeilen(puffer, ganz.slice(schnitt)), [{ typ: 'delta', text: 'Grüße' }])
  assert.equal(puffer.rest, '')
})

test('Kommentar-, Leer- und event:-Zeilen sowie ping werden verworfen', () => {
  const puffer = { rest: '' }
  const events = parseSseZeilen(puffer, ': keep-alive\n\nevent: ping\ndata: {"type":"ping"}\n\n')
  assert.deepEqual(events, [])
})

test('message_start liefert usage, message_delta liefert usage und stop', () => {
  const puffer = { rest: '' }
  const start = sse({ type: 'message_start', message: { usage: { input_tokens: 120, output_tokens: 1, cache_read_input_tokens: 100, cache_creation_input_tokens: 0 } } })
  const delta = sse({ type: 'message_delta', usage: { output_tokens: 42 }, delta: { stop_reason: 'end_turn' } })
  const events = parseSseZeilen(puffer, start + delta)
  assert.equal(events.length, 3)
  assert.deepEqual(events[0], { typ: 'usage', usage: { input_tokens: 120, output_tokens: 1, cache_read_input_tokens: 100, cache_creation_input_tokens: 0 } })
  assert.deepEqual(events[1], { typ: 'usage', usage: { output_tokens: 42 } })
  assert.deepEqual(events[2], { typ: 'stop', stopReason: 'end_turn' })
})

test('CRLF-Zeilenenden und kaputtes JSON stören den Strom nicht', () => {
  const puffer = { rest: '' }
  const events = parseSseZeilen(puffer, 'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"ok"}}\r\ndata: {kaputt\n')
  assert.deepEqual(events, [{ typ: 'delta', text: 'ok' }])
})

function speicherStub(anfang = {}) {
  const daten = { ...anfang }
  return {
    getItem: k => (k in daten ? daten[k] : null),
    setItem: (k, v) => { daten[k] = String(v) },
    removeItem: k => { delete daten[k] },
  }
}

function sendePromise(transport, anfrage, onDelta) {
  return new Promise((resolve, reject) => {
    transport.sende(anfrage, { onDelta, onFertig: resolve, onFehler: reject })
  })
}

const BASIS_ANFRAGE = Object.freeze({
  url: 'https://api.anthropic.com/v1/messages',
  headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01' },
  body: { model: 'claude-haiku-4-5', max_tokens: 256, system: [], messages: [] },
  stream: false,
})

test('mapHttpStatus: 401 kein-schluessel, 429 ratenlimit, 529/500 ueberlastet, 400 schema', () => {
  assert.equal(mapHttpStatus(401).typ, 'kein-schluessel')
  assert.equal(mapHttpStatus(429).typ, 'ratenlimit')
  assert.equal(mapHttpStatus(529).typ, 'ueberlastet')
  assert.equal(mapHttpStatus(500).typ, 'ueberlastet')
  assert.equal(mapHttpStatus(400).typ, 'schema')
})

test('mischeUsage: letzter Wert je Feld gewinnt, fehlende Felder bleiben', () => {
  const a = mischeUsage(null, { input_tokens: 9, output_tokens: 1, cache_read_input_tokens: 4 })
  const b = mischeUsage(a, { output_tokens: 6 })
  assert.deepEqual(b, { input_tokens: 9, output_tokens: 6, cache_read_input_tokens: 4, cache_creation_input_tokens: 0 })
})

test('ergebnisAusAntwortJson zieht ersten Text-Block, usage und stop_reason', () => {
  const e = ergebnisAusAntwortJson({
    content: [{ type: 'text', text: '{"a":1}' }],
    usage: { input_tokens: 5, output_tokens: 7 },
    stop_reason: 'end_turn',
  })
  assert.equal(e.text, '{"a":1}')
  assert.equal(e.usage.input_tokens, 5)
  assert.equal(e.stopReason, 'end_turn')
})

test('direkt: ohne Schlüssel kommt kein-schluessel, ohne fetch-Aufruf', async () => {
  globalThis.localStorage = speicherStub()
  globalThis.fetch = async () => { throw new Error('darf nicht aufgerufen werden') }
  try {
    await assert.rejects(sendePromise(direktTransport, BASIS_ANFRAGE), f => f.typ === 'kein-schluessel')
  } finally { delete globalThis.localStorage; delete globalThis.fetch }
})

test('direkt: Browser-Header + x-api-key gesetzt, nicht-stream liefert Ergebnis', async () => {
  globalThis.localStorage = speicherStub({ [API_KEY_STORAGE]: 'sk-test' })
  let gesehen = null
  globalThis.fetch = async (url, opts) => {
    gesehen = { url, opts }
    return {
      ok: true, status: 200,
      json: async () => ({ content: [{ type: 'text', text: 'Hallo' }], usage: { input_tokens: 3, output_tokens: 2 }, stop_reason: 'end_turn' }),
    }
  }
  try {
    const e = await sendePromise(direktTransport, BASIS_ANFRAGE)
    assert.equal(gesehen.opts.headers['x-api-key'], 'sk-test')
    assert.equal(gesehen.opts.headers['anthropic-dangerous-direct-browser-access'], 'true')
    assert.equal(e.text, 'Hallo')
    assert.equal(e.stopReason, 'end_turn')
  } finally { delete globalThis.localStorage; delete globalThis.fetch }
})

test('direkt: HTTP 429 wird zu ratenlimit, TypeError zu offline', async () => {
  globalThis.localStorage = speicherStub({ [API_KEY_STORAGE]: 'sk-test' })
  try {
    globalThis.fetch = async () => ({ ok: false, status: 429 })
    await assert.rejects(sendePromise(direktTransport, BASIS_ANFRAGE), f => f.typ === 'ratenlimit')
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch') }
    await assert.rejects(sendePromise(direktTransport, BASIS_ANFRAGE), f => f.typ === 'offline')
  } finally { delete globalThis.localStorage; delete globalThis.fetch }
})

test('direkt: Streaming liest Chunks, reicht Deltas durch und mischt usage', async () => {
  globalThis.localStorage = speicherStub({ [API_KEY_STORAGE]: 'sk-test' })
  const enc = new TextEncoder()
  const strom =
    'data: ' + JSON.stringify({ type: 'message_start', message: { usage: { input_tokens: 9, output_tokens: 1, cache_read_input_tokens: 4, cache_creation_input_tokens: 0 } } }) + '\n\n' +
    'data: ' + JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hal' } }) + '\n\n' +
    'data: ' + JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'lo' } }) + '\n\n' +
    'data: ' + JSON.stringify({ type: 'message_delta', usage: { output_tokens: 6 }, delta: { stop_reason: 'end_turn' } }) + '\n\n'
  const schnitt = Math.floor(strom.length * 0.6) // mitten in einem Event
  const chunks = [enc.encode(strom.slice(0, schnitt)), enc.encode(strom.slice(schnitt))]
  globalThis.fetch = async () => ({
    ok: true, status: 200,
    body: { getReader() { let i = 0; return { async read() { return i < chunks.length ? { done: false, value: chunks[i++] } : { done: true, value: undefined } } } } },
  })
  try {
    const deltas = []
    const e = await sendePromise(direktTransport, { ...BASIS_ANFRAGE, stream: true }, t => deltas.push(t))
    assert.equal(deltas.join(''), 'Hallo')
    assert.equal(e.text, 'Hallo')
    assert.deepEqual(e.usage, { input_tokens: 9, output_tokens: 6, cache_read_input_tokens: 4, cache_creation_input_tokens: 0 })
    assert.equal(e.stopReason, 'end_turn')
  } finally { delete globalThis.localStorage; delete globalThis.fetch }
})

function brueckenWelt() {
  const llm = []; const key = []
  globalThis.window = {
    webkit: { messageHandlers: {
      llm: { postMessage(m) { llm.push(m) } },
      llmkey: { postMessage(m) { key.push(m) } },
    } },
  }
  return { llm, key, weg() { delete globalThis.window } }
}

test('bruecke: sende postet ohne x-api-key, puffert Deltas und schließt mit fertig', async () => {
  const welt = brueckenWelt()
  try {
    const deltas = []
    const p = sendePromise(brueckenTransport, { ...BASIS_ANFRAGE, stream: true }, t => deltas.push(t))
    assert.equal(welt.llm.length, 1)
    const id = welt.llm[0].id
    assert.ok(!('x-api-key' in welt.llm[0].headers))
    assert.equal(welt.llm[0].stream, true)
    const z1 = 'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hal"}}\ndata: {"type":"content_block_del'
    const z2 = 'ta","delta":{"type":"text_delta","text":"lo"}}\ndata: ' + JSON.stringify({ type: 'message_delta', usage: { output_tokens: 6 }, delta: { stop_reason: 'end_turn' } }) + '\n'
    globalThis.window.AIWT.llmRueckruf({ id, typ: 'delta', text: z1 })
    globalThis.window.AIWT.llmRueckruf({ id, typ: 'delta', text: z2 })
    globalThis.window.AIWT.llmRueckruf({ id, typ: 'fertig' })
    const e = await p
    assert.deepEqual(deltas, ['Hal', 'lo'])
    assert.equal(e.text, 'Hallo')
    assert.equal(e.usage.output_tokens, 6)
    assert.equal(e.stopReason, 'end_turn')
  } finally { welt.weg() }
})

test('bruecke: fehler mit HTTP-Status wird gemappt (401 -> kein-schluessel)', async () => {
  const welt = brueckenWelt()
  try {
    const p = sendePromise(brueckenTransport, BASIS_ANFRAGE)
    globalThis.window.AIWT.llmRueckruf({ id: welt.llm[0].id, typ: 'fehler', status: 401 })
    await assert.rejects(p, f => f.typ === 'kein-schluessel')
  } finally { welt.weg() }
})

test('bruecke: hatSchluessel fragt llmkey und löst mit dem Status auf', async () => {
  const welt = brueckenWelt()
  try {
    const p = brueckenTransport.hatSchluessel()
    assert.equal(welt.key[0].aktion, 'status')
    globalThis.window.AIWT.llmRueckruf({ id: welt.key[0].id, typ: 'schluesselstatus', status: true })
    assert.equal(await p, true)
  } finally { welt.weg() }
})

test('waehleTransport: Brücke nur wenn der llm-Handler existiert', () => {
  const welt = brueckenWelt()
  try { assert.equal(waehleTransport(), brueckenTransport) } finally { welt.weg() }
  assert.equal(waehleTransport(), direktTransport)
})

// ---------- S-3: Reihenfolge-Garantie der Rückruf-Registrierung ----------
// window.AIWT.llmRueckruf wird lazy registriert (nicht auf Modul-Ebene, siehe
// Kommentar über registriereRueckruf in agent-transport.mjs): das esbuild-
// Bundle weist window.AIWT erst NACH der Modul-Auswertung zu (--global-name
// =AIWT), eine Registrierung auf Modul-Ebene würde also von dieser Zuweisung
// wieder überschrieben. Diese Tests nageln die tatsächliche Garantie fest:
// registriereRueckruf läuft synchron vor JEDEM postMessage (sende() UND
// sendeLlmKey()), ist idempotent und lässt fremde window.AIWT-Felder (wie sie
// boot() vor dem ersten Transport-Aufruf gesetzt hätte) unangetastet.

function brueckenWeltMitVorbesetztemAIWT(vorbesetzt) {
  const llm = []; const key = []
  globalThis.window = {
    webkit: { messageHandlers: {
      llm: { postMessage(m) { llm.push(m) } },
      llmkey: { postMessage(m) { key.push(m) } },
    } },
    AIWT: { ...vorbesetzt },
  }
  return { llm, key, weg() { delete globalThis.window } }
}

test('bruecke: llmRueckruf existiert bereits nach dem ersten sende(), bevor Swift antworten kann', async () => {
  const welt = brueckenWelt()
  try {
    assert.equal(globalThis.window.AIWT, undefined)
    const p = sendePromise(brueckenTransport, BASIS_ANFRAGE)
    // postMessage ist synchron oben schon abgesetzt (welt.llm.length === 1) —
    // die Registrierung muss VOR dieser Stelle passiert sein, denn Swift kann
    // frühestens jetzt (asynchron) zurückrufen.
    assert.equal(welt.llm.length, 1)
    assert.equal(typeof globalThis.window.AIWT.llmRueckruf, 'function')
    globalThis.window.AIWT.llmRueckruf({
      id: welt.llm[0].id, typ: 'fertig',
      text: JSON.stringify({ content: [{ type: 'text', text: 'ok' }], usage: {}, stop_reason: 'end_turn' }),
    })
    await p
  } finally { welt.weg() }
})

test('bruecke: llmRueckruf existiert bereits nach dem ersten sendeLlmKey() (Panel-Schlüsselstatus beim Start)', async () => {
  const welt = brueckenWelt()
  try {
    assert.equal(globalThis.window.AIWT, undefined)
    const p = brueckenTransport.hatSchluessel()
    assert.equal(welt.key.length, 1)
    assert.equal(typeof globalThis.window.AIWT.llmRueckruf, 'function')
    globalThis.window.AIWT.llmRueckruf({ id: welt.key[0].id, typ: 'schluesselstatus', status: false })
    await p
  } finally { welt.weg() }
})

test('bruecke: registriereRueckruf ist idempotent und lässt fremde window.AIWT-Felder unangetastet', async () => {
  const fremdesBoot = () => 'boot-ergebnis'
  const welt = brueckenWeltMitVorbesetztemAIWT({ boot: fremdesBoot, fremdesFeld: 42 })
  try {
    // Vor jedem Transport-Aufruf: window.AIWT existiert (von "boot()" gesetzt),
    // aber ohne llmRueckruf.
    assert.equal(globalThis.window.AIWT.llmRueckruf, undefined)

    const p1 = sendePromise(brueckenTransport, BASIS_ANFRAGE)
    const ersteRueckrufFn = globalThis.window.AIWT.llmRueckruf
    assert.equal(typeof ersteRueckrufFn, 'function')
    assert.equal(globalThis.window.AIWT.boot, fremdesBoot)
    assert.equal(globalThis.window.AIWT.fremdesFeld, 42)
    globalThis.window.AIWT.llmRueckruf({
      id: welt.llm[0].id, typ: 'fertig',
      text: JSON.stringify({ content: [{ type: 'text', text: 'ok' }], usage: {}, stop_reason: 'end_turn' }),
    })
    await p1

    // Zweiter Aufruf über den anderen Kanal (sendeLlmKey) registriert erneut —
    // muss dieselbe Funktionsreferenz stehen lassen, keine Neuzuweisung, keine
    // Duplikate, und die fremden Felder bleiben weiter unverändert.
    const p2 = brueckenTransport.hatSchluessel()
    assert.equal(globalThis.window.AIWT.llmRueckruf, ersteRueckrufFn)
    assert.equal(globalThis.window.AIWT.boot, fremdesBoot)
    assert.equal(globalThis.window.AIWT.fremdesFeld, 42)
    globalThis.window.AIWT.llmRueckruf({ id: welt.key[0].id, typ: 'schluesselstatus', status: false })
    await p2
    assert.equal(globalThis.window.AIWT.llmRueckruf, ersteRueckrufFn)
  } finally { welt.weg() }
})
