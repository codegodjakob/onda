import test from 'node:test'
import assert from 'node:assert/strict'
import { parseSseZeilen } from '../src/agent-transport.mjs'

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
