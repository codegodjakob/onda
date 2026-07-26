// Transporte zum Anthropic-Endpunkt: Browser-Direktweg (fetch) und Mac-Brücke
// (WKWebView-Handler 'llm'/'llmkey'). Beide liefern dieselbe Schnittstelle:
//   sende(anfrage, handlers) mit handlers = { onDelta?(text), onFertig(ergebnis), onFehler(fehler) }
//   ergebnis = { text, usage:{input_tokens,output_tokens,cache_read_input_tokens,cache_creation_input_tokens}, stopReason }
//   fehler   = { typ:'kein-schluessel'|'offline'|'ratenlimit'|'ueberlastet'|'schema'|'abgelehnt'|'abgebrochen', nachricht }
// parseSseZeilen ist PUR (node-testbar): ein Zeilenpuffer-Parser für SSE-Chunks —
// Events können über Chunk-Grenzen zerrissen ankommen, der Puffer hält den Rest.

export const API_KEY_STORAGE = 'aiwt.apikey'

// pufferObjekt: { rest: '' } — die letzte, evtl. unvollständige Zeile überlebt den Aufruf.
// 'event:'-Zeilen werden ignoriert: der Ereignistyp steht bei Anthropic im JSON ('type').
export function parseSseZeilen(pufferObjekt, chunkText) {
  const events = []
  const gesamt = (pufferObjekt.rest || '') + (chunkText || '')
  const zeilen = gesamt.split('\n')
  pufferObjekt.rest = zeilen.pop()
  for (let zeile of zeilen) {
    if (zeile.endsWith('\r')) zeile = zeile.slice(0, -1)
    if (!zeile || zeile.startsWith(':')) continue // leer / SSE-Kommentar
    if (!zeile.startsWith('data:')) continue
    const roh = zeile.slice(5).trim()
    if (!roh) continue
    let data
    try { data = JSON.parse(roh) } catch (e) { continue } // kaputte Zeile: still überspringen
    if (data.type === 'content_block_delta' && data.delta && data.delta.type === 'text_delta') {
      events.push({ typ: 'delta', text: data.delta.text })
    } else if (data.type === 'message_start' && data.message && data.message.usage) {
      events.push({ typ: 'usage', usage: data.message.usage })
    } else if (data.type === 'message_delta') {
      if (data.usage) events.push({ typ: 'usage', usage: data.usage })
      if (data.delta && data.delta.stop_reason) events.push({ typ: 'stop', stopReason: data.delta.stop_reason })
    }
  }
  return events
}
