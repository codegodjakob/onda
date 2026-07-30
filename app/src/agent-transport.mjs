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

// ---------- Gemeinsame pure Bausteine ----------
export function mapHttpStatus(status) {
  if (status === 401 || status === 403) return { typ: 'kein-schluessel', nachricht: 'Der Schlüssel wurde nicht akzeptiert (HTTP ' + status + ').' }
  if (status === 429) return { typ: 'ratenlimit', nachricht: 'Zu viele Anfragen (HTTP 429).' }
  if (status === 529 || status >= 500) return { typ: 'ueberlastet', nachricht: 'Der Dienst ist gerade überlastet (HTTP ' + status + ').' }
  // Sonstige 4xx (z. B. 400 bei fehlerhafter Anfrage): kein Wiederholungsversuch,
  // Lauf wird wie Schema-Müll verworfen und protokolliert (Spec §7).
  return { typ: 'schema', nachricht: 'Die Anfrage wurde abgelehnt (HTTP ' + status + ').' }
}

function leereUsage() {
  return { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
}

// Anthropic-Streaming liefert kumulative Zähler (message_start: input/cache,
// message_delta: output) — darum gewinnt je Feld der zuletzt gemeldete Wert.
export function mischeUsage(bisher, neu) {
  const u = Object.assign(leereUsage(), bisher)
  if (!neu) return u
  for (const k of Object.keys(u)) if (typeof neu[k] === 'number') u[k] = neu[k]
  return u
}

export function ergebnisAusAntwortJson(json) {
  const block = Array.isArray(json && json.content) ? json.content.find(b => b && b.type === 'text') : null
  return {
    text: block ? block.text : '',
    usage: mischeUsage(null, json && json.usage),
    stopReason: (json && json.stop_reason) || null,
  }
}

function lesSchluessel() {
  try { return (localStorage.getItem(API_KEY_STORAGE) || '').trim() } catch (e) { return '' }
}

// Fix-Runde 2, Finding 4: still protokollieren statt werfen — beide Transportwege rufen das
// hier auf, wenn handlers.onDelta selbst einen Fehler wirft (z. B. ein DOM-Bug in der
// UI-Verarbeitung). Der Lauf selbst (Streaming, spaeteres onFertig/onFehler) laeuft normal
// weiter; ein einzelnes onDelta ist nie ein Grund, den ganzen Lauf als kaputt zu melden.
function meldeOnDeltaFehler(fehler) {
  try { console.error('[agent-transport] onDelta-Fehler (ignoriert, kein Netzfehler):', fehler) } catch (e) {}
}

// ---------- Direktweg (Browser: Entwickler-/Rückfallpfad) ----------
export const direktTransport = {
  art: 'direkt',
  async hatSchluessel() { return !!lesSchluessel() },
  async setzeSchluessel(schluessel) { localStorage.setItem(API_KEY_STORAGE, (schluessel || '').trim()) },
  async loescheSchluessel() { localStorage.removeItem(API_KEY_STORAGE) },
  async sende(anfrage, handlers) {
    const schluessel = lesSchluessel()
    if (!schluessel) { handlers.onFehler({ typ: 'kein-schluessel', nachricht: 'Kein API-Schlüssel hinterlegt.' }); return }
    const headers = Object.assign({}, anfrage.headers, {
      'x-api-key': schluessel,
      'anthropic-dangerous-direct-browser-access': 'true',
    })
    let res
    try {
      res = await fetch(anfrage.url, { method: 'POST', headers, body: JSON.stringify(anfrage.body) })
    } catch (e) {
      handlers.onFehler({ typ: 'offline', nachricht: 'Keine Verbindung zum Dienst.' }); return
    }
    if (!res.ok) { handlers.onFehler(mapHttpStatus(res.status)); return }
    if (!anfrage.stream) {
      let json
      try { json = await res.json() } catch (e) { handlers.onFehler({ typ: 'schema', nachricht: 'Die Antwort war kein JSON.' }); return }
      handlers.onFertig(ergebnisAusAntwortJson(json)); return
    }
    const puffer = { rest: '' }
    const decoder = new TextDecoder('utf-8')
    const reader = res.body.getReader()
    let text = ''; let usage = mischeUsage(null, null); let stopReason = null
    const verarbeite = events => {
      for (const ev of events) {
        if (ev.typ === 'delta') {
          text += ev.text
          // Fix-Runde 2, Finding 4 (Important): ein Fehler in der UI-Verarbeitung (onDelta)
          // darf NIE als Netzfehler gelten — sonst faengt der aeussere try/catch (unten) das
          // hier als 'offline' auf, und agent-gateway wiederholt den bereits bezahlten Lauf.
          if (handlers.onDelta) {
            try { handlers.onDelta(ev.text) } catch (fehler) { meldeOnDeltaFehler(fehler) }
          }
        }
        else if (ev.typ === 'usage') usage = mischeUsage(usage, ev.usage)
        else if (ev.typ === 'stop') stopReason = ev.stopReason
      }
    }
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        verarbeite(parseSseZeilen(puffer, decoder.decode(value, { stream: true })))
      }
      verarbeite(parseSseZeilen(puffer, decoder.decode()))
      if (puffer.rest) verarbeite(parseSseZeilen(puffer, '\n'))
    } catch (e) {
      handlers.onFehler({ typ: 'offline', nachricht: 'Die Verbindung ist während des Streamens abgerissen.' }); return
    }
    handlers.onFertig({ text, usage, stopReason })
  },
}

// ---------- Brücke (Mac-App: Handler 'llm'/'llmkey', Schlüssel in der Keychain) ----------
// Registry offener Anfragen nach id; Swift antwortet über window.AIWT.llmRueckruf.
const offen = new Map()
let naechsteId = 1
function neueId(praefix) { return praefix + '-' + Date.now().toString(36) + '-' + (naechsteId++) }

function llmRueckruf(nachricht) {
  const eintrag = offen.get(nachricht.id)
  if (!eintrag) return
  if (nachricht.typ === 'schluesselstatus') {
    offen.delete(nachricht.id)
    eintrag.aufloesen(nachricht)
    return
  }
  if (nachricht.typ === 'delta') {
    // Swift reicht rohe SSE-Zeilen durch — derselbe Parser wie im Direktweg.
    for (const ev of parseSseZeilen(eintrag.puffer, nachricht.text || '')) {
      if (ev.typ === 'delta') {
        eintrag.text += ev.text
        // Fix-Runde 2, Finding 4: ohne dieses try/catch entkommt ein Fehler aus onDelta hier
        // direkt aus llmRueckruf (dem Aufruf aus Swift) — das Streaming faellt dann still aus,
        // ohne dass je onFertig/onFehler laeuft. Still protokollieren, Lauf normal weiter.
        if (eintrag.handlers.onDelta) {
          try { eintrag.handlers.onDelta(ev.text) } catch (fehler) { meldeOnDeltaFehler(fehler) }
        }
      }
      else if (ev.typ === 'usage') eintrag.usage = mischeUsage(eintrag.usage, ev.usage)
      else if (ev.typ === 'stop') eintrag.stopReason = ev.stopReason
    }
    return
  }
  if (nachricht.typ === 'fertig') {
    offen.delete(nachricht.id)
    if (eintrag.stream) {
      eintrag.handlers.onFertig({ text: eintrag.text, usage: eintrag.usage, stopReason: eintrag.stopReason })
    } else {
      let json
      try { json = JSON.parse(nachricht.text || '') } catch (e) {
        eintrag.handlers.onFehler({ typ: 'schema', nachricht: 'Die Antwort war kein JSON.' }); return
      }
      eintrag.handlers.onFertig(ergebnisAusAntwortJson(json))
    }
    return
  }
  if (nachricht.typ === 'fehler') {
    offen.delete(nachricht.id)
    if (typeof nachricht.status === 'number' && nachricht.status > 0) eintrag.handlers.onFehler(mapHttpStatus(nachricht.status))
    else eintrag.handlers.onFehler({ typ: 'offline', nachricht: nachricht.fehler || 'Keine Verbindung zum Dienst.' })
  }
}

// Idempotent und bei jedem Aufruf erneut geprüft: das esbuild-Bundle weist
// window.AIWT erst NACH der Modul-Auswertung zu (--global-name=AIWT), darum
// wird der Rückruf lazy beim ersten Gebrauch angehängt, nie beim Import.
function registriereRueckruf() {
  if (typeof window === 'undefined') return
  if (!window.AIWT || window.AIWT.llmRueckruf !== llmRueckruf) {
    window.AIWT = window.AIWT || {}
    window.AIWT.llmRueckruf = llmRueckruf
  }
}

function sendeLlmKey(aktion, schluessel) {
  registriereRueckruf()
  return new Promise(resolve => {
    const id = neueId('key')
    offen.set(id, { aufloesen: resolve })
    const nachricht = { id, aktion }
    if (schluessel != null) nachricht.schluessel = schluessel
    window.webkit.messageHandlers.llmkey.postMessage(nachricht)
  })
}

export const brueckenTransport = {
  art: 'bruecke',
  // Fix-Runde 2, Finding 1 (Critical): Swift antwortet mit status:{vorhanden:boolean} — ein
  // OBJEKT, also unter !! immer truthy, egal ob vorhanden true oder false ist. Die Mac-App
  // meldete dadurch dauerhaft "Schlüssel vorhanden": die Offline-Statuszeile erschien nie, der
  // Löschen-Knopf wirkte wirkungslos, echte Läufe starteten und scheiterten erst danach.
  // Abwärtskompatibel: kommt irgendwo (noch) ein roher Boolean an, gilt der unverändert.
  async hatSchluessel() {
    const antwort = await sendeLlmKey('status')
    const status = antwort && antwort.status
    if (typeof status === 'boolean') return status
    return status?.vorhanden === true
  },
  async setzeSchluessel(schluessel) { await sendeLlmKey('setzen', schluessel) },
  async loescheSchluessel() { await sendeLlmKey('loeschen') },
  sende(anfrage, handlers) {
    registriereRueckruf()
    const id = neueId('llm')
    offen.set(id, {
      handlers, stream: !!anfrage.stream, puffer: { rest: '' },
      text: '', usage: mischeUsage(null, null), stopReason: null,
    })
    try {
      // headers OHNE Schlüssel — Swift setzt x-api-key aus der Keychain ein.
      window.webkit.messageHandlers.llm.postMessage({
        id, url: anfrage.url, headers: anfrage.headers, body: anfrage.body, stream: !!anfrage.stream,
      })
    } catch (e) {
      offen.delete(id)
      handlers.onFehler({ typ: 'offline', nachricht: 'Die Brücke zur Mac-App antwortet nicht.' })
    }
  },
}

export function waehleTransport() {
  if (typeof window !== 'undefined' && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.llm) {
    return brueckenTransport
  }
  return direktTransport
}
