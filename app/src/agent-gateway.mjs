// Der Verteiler: JEDER KI-Aufruf läuft hier durch. Schlägt den Task in der
// Tabelle nach (agent-tasks), sendet über den gewählten Transport, prüft
// stop_reason VOR dem Inhalt, validiert Schema-Antworten und zählt den
// Verbrauch monatsweise in settings.usage (additiv, tolerant — kein Schema-Bump).
import { MODELLE, TASK_TABLE, baueAnfrage, schaetzeKostenCents } from './agent-tasks.mjs'
import { waehleTransport } from './agent-transport.mjs'

const STANDARD_HOOKS = { getSettings: null, persist: null, transport: null, retryWartezeitMs: 2000 }
let hooks = { ...STANDARD_HOOKS }

export function initGateway(konfiguration) {
  hooks = Object.assign({ ...STANDARD_HOOKS }, konfiguration)
}

// Lazy je Aufruf: die Brücke kann erst nach dem App-Start verfügbar sein.
function aktiverTransport() { return hooks.transport || waehleTransport() }

export function hatSchluessel() { return aktiverTransport().hatSchluessel() }
export function setzeSchluessel(schluessel) { return aktiverTransport().setzeSchluessel(schluessel) }
export function loescheSchluessel() { return aktiverTransport().loescheSchluessel() }

const WIEDERHOLBAR = new Set(['offline', 'ratenlimit', 'ueberlastet'])

function warte(ms) { return new Promise(r => setTimeout(r, ms)) }

function sendeEinmal(anfrage, onDelta) {
  return new Promise((resolve, reject) => {
    aktiverTransport().sende(anfrage, { onDelta, onFertig: resolve, onFehler: reject })
  })
}

// Monats-Zählung (Muster wie accent in settings-model.mjs: additiv und tolerant).
export function zaehleUsage(settings, usage, modellId) {
  if (!settings || !usage) return
  const monat = new Date().toISOString().slice(0, 7) // 'JJJJ-MM'
  let u = settings.usage
  if (!u || typeof u !== 'object' || u.monat !== monat) {
    u = { monat, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, kostenCents: 0 }
    settings.usage = u
  }
  u.inputTokens += usage.input_tokens || 0
  u.outputTokens += usage.output_tokens || 0
  u.cacheReadTokens += usage.cache_read_input_tokens || 0
  u.cacheWriteTokens += usage.cache_creation_input_tokens || 0
  u.kostenCents += schaetzeKostenCents(usage, modellId)
}

// Pflichtfelder aus dem JSON-Schema prüfen (Objekte rekursiv, Array-Items) —
// bewusst schlank: fehlende Pflichtfelder sind der realistische „Müll trotz
// Erzwingung"; Typ-Feinheiten erzwingt das Schema bereits serverseitig.
export function pruefePflichtfelder(daten, schema) {
  if (!schema || typeof schema !== 'object') return true
  if (schema.type === 'object') {
    if (!daten || typeof daten !== 'object' || Array.isArray(daten)) return false
    for (const feld of schema.required || []) {
      if (!(feld in daten)) return false
      const unter = schema.properties && schema.properties[feld]
      if (unter && !pruefePflichtfelder(daten[feld], unter)) return false
    }
    return true
  }
  if (schema.type === 'array') {
    if (!Array.isArray(daten)) return false
    if (schema.items) { for (const el of daten) if (!pruefePflichtfelder(el, schema.items)) return false }
    return true
  }
  return daten !== undefined
}

export async function runTask(taskName, eingabe, optionen = {}) {
  const eintrag = TASK_TABLE[taskName]
  if (!eintrag) throw new Error('Unbekannter Task: ' + taskName)
  const kontext = { ...eingabe }
  if (!kontext.verstaendnis && typeof kontext.docText !== 'string' && (!kontext.volatiles || !kontext.volatiles.length)) {
    kontext.docText = ''
  }
  const anfrage = baueAnfrage(taskName, kontext)
  const onDelta = eintrag.stream ? optionen.onDelta : undefined

  let ergebnis
  try {
    ergebnis = await sendeEinmal(anfrage, onDelta)
  } catch (fehler) {
    if (!WIEDERHOLBAR.has(fehler && fehler.typ)) throw fehler
    await warte(hooks.retryWartezeitMs) // EIN stiller Wiederholungsversuch (Spec §7)
    ergebnis = await sendeEinmal(anfrage, onDelta)
  }

  // Verbrauch IMMER zählen — auch bei refusal/max_tokens wurden Tokens verbraucht.
  const settings = hooks.getSettings ? hooks.getSettings() : null
  zaehleUsage(settings, ergebnis.usage, MODELLE[eintrag.modell])
  if (hooks.persist) hooks.persist()

  // stop_reason VOR dem Inhalt prüfen (Vertrag).
  if (ergebnis.stopReason === 'refusal') {
    console.info('[agent] Lauf abgelehnt (refusal) — Task', taskName) // leise, kein Alarm
    throw { typ: 'abgelehnt', nachricht: 'Der Agent hat diese Anfrage abgelehnt.' }
  }
  if (ergebnis.stopReason === 'max_tokens') {
    console.info('[agent] Lauf verworfen (max_tokens, Antwort abgeschnitten) — Task', taskName)
    throw { typ: 'schema', nachricht: 'Die Antwort wurde abgeschnitten (max_tokens) und verworfen.' }
  }

  if (eintrag.schema) {
    let daten
    try { daten = JSON.parse(ergebnis.text) } catch (e) {
      throw { typ: 'schema', nachricht: 'Die Antwort war kein gültiges JSON.' }
    }
    if (!pruefePflichtfelder(daten, eintrag.schema)) {
      throw { typ: 'schema', nachricht: 'In der Antwort fehlen Pflichtfelder.' }
    }
    return { daten, usage: ergebnis.usage }
  }
  return { daten: ergebnis.text, usage: ergebnis.usage }
}
