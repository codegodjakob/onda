// Prüfung 1 aus Issue #17 (fremdes Fehlermodell, Befund 4 der Systemanalyse):
// Netzabriss MITTEN im SSE-Stream — nicht vor dem ersten Byte (dieser Fall war
// schon geprüft), sondern nachdem bereits bezahlte Deltas beim Verbraucher
// angekommen sind. Genau dieser Fall stammt aus keinem eigenen vergangenen
// Fehler: alle bisherigen Netz-Tests reißen die Verbindung VOR der Antwort ab.
//
// Was die Prüfung beim ersten Lauf gefunden hat (und was seither gilt):
// 1. Der Teil-Verbrauch des abgerissenen Laufs (message_start meldet die
//    input_tokens sofort) wurde nirgends gezählt — der Zähler in den
//    Einstellungen log um genau diese Tokens zu niedrig, obwohl der Lauf
//    bezahlt war. Jetzt trägt der offline-Fehler den bis dahin gemeldeten
//    Verbrauch, und der Verteiler verbucht ihn vor der Wiederholung.
// 2. Bei der stillen Wiederholung eines Stream-Laufs bekam der
//    Delta-Verbraucher die Deltas des zweiten Versuchs HINTER die des
//    abgerissenen ersten geliefert — sichtbar doppelter Text im Chat, bis das
//    Endergebnis ihn ersetzte. Jetzt meldet der Verteiler den Neustart
//    (optionen.onNeustart), damit der Verbraucher seinen Puffer leert.

import test from 'node:test'
import assert from 'node:assert/strict'
import { API_KEY_STORAGE, direktTransport } from '../src/agent-transport.mjs'
import { initGateway, runTask } from '../src/agent-gateway.mjs'

function speicherStub(anfang = {}) {
  const daten = { ...anfang }
  return {
    getItem: k => (k in daten ? daten[k] : null),
    setItem: (k, v) => { daten[k] = String(v) },
    removeItem: k => { delete daten[k] },
  }
}

function sse(payload) { return 'data: ' + JSON.stringify(payload) + '\n\n' }

// Ein Leser, der die gegebenen Chunks liefert und DANACH die Verbindung
// verliert — das Fehlerbild eines Routers, der mitten im Stream wegkippt.
function abreissLeser(chunks) {
  const enc = new TextEncoder()
  let i = 0
  return {
    async read() {
      if (i < chunks.length) return { done: false, value: enc.encode(chunks[i++]) }
      throw new TypeError('network error: connection reset')
    },
  }
}

function streamAntwort(chunks) {
  return { ok: true, status: 200, body: { getReader() { return abreissLeser(chunks) } } }
}

const STREAM_ANFRAGE = Object.freeze({
  url: 'https://api.anthropic.com/v1/messages',
  headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01' },
  body: { model: 'claude-haiku-4-5', max_tokens: 256, system: [], messages: [] },
  stream: true,
})

const START_USAGE = Object.freeze({ input_tokens: 9, output_tokens: 1, cache_read_input_tokens: 4, cache_creation_input_tokens: 0 })

test('Abriss mitten im Stream: offline-Fehler, kein onFertig — die Teil-Deltas waren aber schon beim Verbraucher', async () => {
  globalThis.localStorage = speicherStub({ [API_KEY_STORAGE]: 'sk-test' })
  globalThis.fetch = async () => streamAntwort([
    sse({ type: 'message_start', message: { usage: { ...START_USAGE } } }),
    sse({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'Der Anfang ' } }),
    sse({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'ist bezahlt' } }),
  ])
  try {
    const deltas = []
    let fertig = null
    const fehler = await new Promise(resolve => {
      direktTransport.sende(STREAM_ANFRAGE, {
        onDelta: t => deltas.push(t),
        onFertig: e => { fertig = e; resolve(null) },
        onFehler: resolve,
      })
    })
    assert.equal(fertig, null, 'ein abgerissener Lauf darf nie als fertig gelten')
    assert.equal(fehler.typ, 'offline')
    assert.equal(deltas.join(''), 'Der Anfang ist bezahlt',
      'die vor dem Abriss gelieferten Deltas waren bereits sichtbar — das ist der Kern dieses Fehlermodells')
  } finally { delete globalThis.localStorage; delete globalThis.fetch }
})

test('Abriss mitten in einer SSE-Zeile: kein Absturz, die halbe Zeile wird nie als Delta geliefert', async () => {
  globalThis.localStorage = speicherStub({ [API_KEY_STORAGE]: 'sk-test' })
  const ganze = sse({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'vollständig' } })
  const halbe = sse({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'NIE ZU SEHEN' } })
  globalThis.fetch = async () => streamAntwort([ganze, halbe.slice(0, Math.floor(halbe.length / 2))])
  try {
    const deltas = []
    const fehler = await new Promise(resolve => {
      direktTransport.sende(STREAM_ANFRAGE, { onDelta: t => deltas.push(t), onFertig: () => resolve(null), onFehler: resolve })
    })
    assert.equal(fehler?.typ, 'offline')
    assert.deepEqual(deltas, ['vollständig'], 'eine zerrissene Zeile darf weder durchsickern noch den Parser werfen lassen')
  } finally { delete globalThis.localStorage; delete globalThis.fetch }
})

test('Der offline-Fehler trägt den bis zum Abriss gemeldeten Verbrauch — der Lauf war bezahlt', async () => {
  globalThis.localStorage = speicherStub({ [API_KEY_STORAGE]: 'sk-test' })
  globalThis.fetch = async () => streamAntwort([
    sse({ type: 'message_start', message: { usage: { ...START_USAGE } } }),
    sse({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'kurz' } }),
  ])
  try {
    const fehler = await new Promise(resolve => {
      direktTransport.sende(STREAM_ANFRAGE, { onFertig: () => resolve(null), onFehler: resolve })
    })
    assert.equal(fehler?.typ, 'offline')
    assert.deepEqual(fehler.usage, { ...START_USAGE },
      'ohne diesen Verbrauch im Fehler kann der Verteiler den abgerissenen (bezahlten) Lauf nicht zählen')
  } finally { delete globalThis.localStorage; delete globalThis.fetch }
})

// ---------- Verteiler-Ebene: was aus dem Abriss beim Wiederholen wird ----------

function mockTransport(schritte) {
  const aufrufe = []
  return {
    aufrufe,
    async hatSchluessel() { return true },
    async setzeSchluessel() {},
    async loescheSchluessel() {},
    sende(anfrage, handlers) {
      aufrufe.push(anfrage)
      const schritt = schritte[Math.min(aufrufe.length - 1, schritte.length - 1)]
      schritt(anfrage, handlers)
    },
  }
}

function frisch(transport) {
  const settings = {}
  initGateway({ getSettings: () => settings, persist: () => {}, transport, retryWartezeitMs: 1 })
  return settings
}

const ABRISS_USAGE = Object.freeze({ input_tokens: 9, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 })
const VOLL_USAGE = Object.freeze({ input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 5, cache_creation_input_tokens: 2 })

function abrissDannErfolg() {
  return mockTransport([
    (a, h) => {
      h.onDelta && h.onDelta('Erster Ver')
      h.onFehler({ typ: 'offline', nachricht: 'Die Verbindung ist während des Streamens abgerissen.', usage: { ...ABRISS_USAGE } })
    },
    (a, h) => {
      h.onDelta && h.onDelta('Erster Versuch, diesmal ganz.')
      h.onFertig({ text: 'Erster Versuch, diesmal ganz.', usage: { ...VOLL_USAGE }, stopReason: 'end_turn' })
    },
  ])
}

test('Wiederholung nach Abriss: genau ein zweiter Versuch, sein Ergebnis gewinnt', async () => {
  const t = abrissDannErfolg()
  frisch(t)
  const { daten } = await runTask('chat', { docText: 'x' }, { onDelta: () => {} })
  assert.equal(daten, 'Erster Versuch, diesmal ganz.')
  assert.equal(t.aufrufe.length, 2)
})

test('Der Teil-Verbrauch des abgerissenen Laufs wird VOR der Wiederholung verbucht — Verbrauch wird IMMER gezählt', async () => {
  const t = abrissDannErfolg()
  const settings = frisch(t)
  await runTask('chat', { docText: 'x' }, { onDelta: () => {} })
  assert.equal(settings.usage.inputTokens, ABRISS_USAGE.input_tokens + VOLL_USAGE.input_tokens,
    'beide Läufe waren bezahlt — beide gehören in den Zähler')
  assert.equal(settings.usage.outputTokens, ABRISS_USAGE.output_tokens + VOLL_USAGE.output_tokens)
})

test('Scheitern auch beim zweiten Versuch: der Verbrauch BEIDER abgerissener Läufe ist verbucht', async () => {
  const t = mockTransport([
    (a, h) => h.onFehler({ typ: 'offline', nachricht: 'abgerissen', usage: { ...ABRISS_USAGE } }),
  ])
  const settings = frisch(t)
  await assert.rejects(runTask('chat', { docText: 'x' }), f => f.typ === 'offline')
  assert.equal(t.aufrufe.length, 2)
  assert.equal(settings.usage.inputTokens, 2 * ABRISS_USAGE.input_tokens)
})

test('Ein Fehler ohne Verbrauchsangabe (Abriss vor message_start) bleibt verbuchungsfrei — kein Absturz, keine Phantomzahl', async () => {
  const t = mockTransport([
    (a, h) => h.onFehler({ typ: 'offline', nachricht: 'nichts angekommen' }),
    (a, h) => h.onFertig({ text: 'ok', usage: { ...VOLL_USAGE }, stopReason: 'end_turn' }),
  ])
  const settings = frisch(t)
  await runTask('chat', { docText: 'x' })
  assert.equal(settings.usage.inputTokens, VOLL_USAGE.input_tokens)
})

test('Beim Wiederholen eines Stream-Laufs meldet der Verteiler den Neustart, BEVOR neue Deltas kommen — sonst doppelt sich der sichtbare Text', async () => {
  const t = abrissDannErfolg()
  frisch(t)
  let puffer = ''
  let neustarts = 0
  const { daten } = await runTask('chat', { docText: 'x' }, {
    onDelta: text => { puffer += text },
    onNeustart: () => { neustarts += 1; puffer = '' },
  })
  assert.equal(neustarts, 1)
  assert.equal(puffer, 'Erster Versuch, diesmal ganz.',
    'ohne Neustart-Signal stünde hier "Erster VerErster Versuch, diesmal ganz." — der Text des abgerissenen Versuchs klebt davor')
  assert.equal(daten, puffer)
})
