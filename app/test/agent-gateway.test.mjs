import test from 'node:test'
import assert from 'node:assert/strict'
import { initGateway, runTask, zaehleUsage, pruefePflichtfelder } from '../src/agent-gateway.mjs'
import { TASK_TABLE } from '../src/agent-tasks.mjs'

const USAGE = Object.freeze({ input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 5, cache_creation_input_tokens: 2 })

const GUELTIGER_HINWEIS = {
  hinweise: [{
    kategorie: 'fakt',
    anker: 'wörtliches Zitat',
    beobachtung: 'Zahl ohne Beleg.',
    relevanz: 'Der Leser prüft genau solche Zahlen.',
    folge: 'Vertrauensverlust bei einer falschen Zahl.',
    vorschlag: null,
    istGrundursache: true,
    integritaet: true,
  }],
}

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
  let persists = 0
  initGateway({ getSettings: () => settings, persist: () => { persists++ }, transport, retryWartezeitMs: 1 })
  return { settings, persistCount: () => persists }
}

test('Erfolg: Schema-Task liefert geparste daten und zählt usage in settings', async () => {
  const t = mockTransport([(a, h) => h.onFertig({ text: JSON.stringify(GUELTIGER_HINWEIS), usage: { ...USAGE }, stopReason: 'end_turn' })])
  const welt = frisch(t)
  const { daten, usage } = await runTask('hinweise', { docText: 'x' })
  assert.equal(daten.hinweise[0].kategorie, 'fakt')
  assert.equal(usage.output_tokens, 20)
  assert.equal(welt.settings.usage.inputTokens, 10)
  assert.equal(welt.settings.usage.outputTokens, 20)
  assert.equal(welt.settings.usage.cacheReadTokens, 5)
  assert.equal(welt.settings.usage.cacheWriteTokens, 2)
  assert.ok(welt.settings.usage.kostenCents > 0)
  assert.equal(welt.persistCount(), 1)
  assert.equal(t.aufrufe.length, 1)
})

test('Schema-Müll: kein JSON im Text -> Fehler typ schema', async () => {
  const t = mockTransport([(a, h) => h.onFertig({ text: 'Gern! Hier deine Hinweise …', usage: { ...USAGE }, stopReason: 'end_turn' })])
  frisch(t)
  await assert.rejects(runTask('hinweise', {}), f => f.typ === 'schema')
})

test('Pflichtfeld fehlt -> Fehler typ schema', async () => {
  const kaputt = { hinweise: [{ kategorie: 'fakt' }] }
  const t = mockTransport([(a, h) => h.onFertig({ text: JSON.stringify(kaputt), usage: { ...USAGE }, stopReason: 'end_turn' })])
  frisch(t)
  await assert.rejects(runTask('hinweise', {}), f => f.typ === 'schema')
})

test('Retry: nach ratenlimit kommt genau EIN zweiter Versuch, der gewinnt', async () => {
  const t = mockTransport([
    (a, h) => h.onFehler({ typ: 'ratenlimit', nachricht: '429' }),
    (a, h) => h.onFertig({ text: 'Titel', usage: { ...USAGE }, stopReason: 'end_turn' }),
  ])
  frisch(t)
  const { daten } = await runTask('titel', {})
  assert.equal(daten, 'Titel')
  assert.equal(t.aufrufe.length, 2)
})

test('Retry: zwei Fehler hintereinander -> Fehler nach genau zwei Versuchen', async () => {
  const t = mockTransport([(a, h) => h.onFehler({ typ: 'ueberlastet', nachricht: '529' })])
  frisch(t)
  await assert.rejects(runTask('titel', {}), f => f.typ === 'ueberlastet')
  assert.equal(t.aufrufe.length, 2)
})

test('kein-schluessel wird NICHT wiederholt', async () => {
  const t = mockTransport([(a, h) => h.onFehler({ typ: 'kein-schluessel', nachricht: 'fehlt' })])
  frisch(t)
  await assert.rejects(runTask('titel', {}), f => f.typ === 'kein-schluessel')
  assert.equal(t.aufrufe.length, 1)
})

test('refusal: Fehler typ abgelehnt, usage wird trotzdem gezählt', async () => {
  const t = mockTransport([(a, h) => h.onFertig({ text: '', usage: { ...USAGE }, stopReason: 'refusal' })])
  const welt = frisch(t)
  await assert.rejects(runTask('hinweise', {}), f => f.typ === 'abgelehnt')
  assert.equal(welt.settings.usage.outputTokens, 20)
})

test('max_tokens: Lauf wird verworfen (typ schema), usage gezählt', async () => {
  const t = mockTransport([(a, h) => h.onFertig({ text: JSON.stringify(GUELTIGER_HINWEIS), usage: { ...USAGE }, stopReason: 'max_tokens' })])
  const welt = frisch(t)
  await assert.rejects(runTask('hinweise', {}), f => f.typ === 'schema')
  assert.equal(welt.settings.usage.inputTokens, 10)
})

test('chat: onDelta wird durchgereicht, daten ist der Volltext', async () => {
  const t = mockTransport([(a, h) => {
    assert.equal(a.stream, true)
    h.onDelta('Hal'); h.onDelta('lo')
    h.onFertig({ text: 'Hallo', usage: { ...USAGE }, stopReason: 'end_turn' })
  }])
  frisch(t)
  const deltas = []
  const { daten } = await runTask('chat', {}, { onDelta: x => deltas.push(x) })
  assert.deepEqual(deltas, ['Hal', 'lo'])
  assert.equal(daten, 'Hallo')
})

test('zaehleUsage: Monatswechsel setzt den Zähler zurück', () => {
  const settings = { usage: { monat: '2020-01', inputTokens: 999, outputTokens: 999, cacheReadTokens: 9, cacheWriteTokens: 9, kostenCents: 100 } }
  zaehleUsage(settings, { ...USAGE }, 'claude-haiku-4-5')
  assert.equal(settings.usage.monat, new Date().toISOString().slice(0, 7))
  assert.equal(settings.usage.inputTokens, 10)
  assert.equal(settings.usage.outputTokens, 20)
})

test('pruefePflichtfelder: fehlende und vorhandene Felder, auch in Array-Items', () => {
  const schema = TASK_TABLE.hinweise.schema
  assert.equal(pruefePflichtfelder(GUELTIGER_HINWEIS, schema), true)
  assert.equal(pruefePflichtfelder({ hinweise: [{ kategorie: 'fakt' }] }, schema), false)
  assert.equal(pruefePflichtfelder({}, schema), false)
  assert.equal(pruefePflichtfelder('kein Objekt', schema), false)
})
