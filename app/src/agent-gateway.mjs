// Der Verteiler: JEDER KI-Aufruf läuft hier durch. Schlägt den Task in der
// Tabelle nach (agent-tasks), sendet über den gewählten Transport, prüft
// stop_reason VOR dem Inhalt, validiert Schema-Antworten und zählt den
// Verbrauch monatsweise in settings.usage (additiv, tolerant — kein Schema-Bump).
import { MODELLE, TASK_TABLE, baueAnfrage, schaetzeKostenCents } from './agent-tasks.mjs'
import { waehleTransport } from './agent-transport.mjs'
import { verbucheUsage } from './settings-model.mjs'

const STANDARD_HOOKS = { getSettings: null, persist: null, transport: null, retryWartezeitMs: 2000 }
let hooks = { ...STANDARD_HOOKS }
let testTransport = null

export function initGateway(konfiguration) {
  hooks = Object.assign({ ...STANDARD_HOOKS }, konfiguration)
  testTransport = null
}

// Lazy je Aufruf: die Brücke kann erst nach dem App-Start verfügbar sein.
function aktiverTransport() { return testTransport || hooks.transport || waehleTransport() }

// Browser-Eval-Brücke: ersetzt ausschließlich den Netztransport. Requestbau,
// Verifikation, Usage, Persistenz und UI bleiben der echte Produktpfad.
// null stellt die durch initGateway konfigurierte beziehungsweise automatisch
// gewählte Transportauswahl wieder her.
export function setzeTransportFuerTests(transport) {
  testTransport = transport || null
}

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

// Verbrauchszählung nutzt verbucheUsage aus settings-model.mjs —
// das kümmert sich um Zeitzone/lokalen Monat und fehlertoleranz.

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

// Netzabriss-Prüfung (Issue #17): reißt die Verbindung MITTEN im Stream ab, hat
// message_start den Verbrauch längst gemeldet — der Lauf war bezahlt. Der Transport
// legt diesen Teil-Verbrauch in fehler.usage; hier wird er gezählt, denn der
// Grundsatz gilt auch für gescheiterte Läufe: Verbrauch IMMER zählen.
function bucheFehlerVerbrauch(fehler, eintrag) {
  if (!fehler || !fehler.usage) return
  const settings = hooks.getSettings ? hooks.getSettings() : null
  if (!settings) return
  const kostenCents = schaetzeKostenCents(fehler.usage, MODELLE[eintrag.modell])
  verbucheUsage(settings, fehler.usage, kostenCents)
  if (hooks.persist) hooks.persist()
}

export async function runTask(taskName, eingabe, optionen = {}) {
  const eintrag = TASK_TABLE[taskName]
  if (!eintrag) throw new Error('Unbekannter Task: ' + taskName)
  const kontext = { ...eingabe }
  // Fallback: baueAnfrage wirft 'Anfrage ohne Inhalt', wenn weder verstaendnis,
  // docText noch volatiles vorhanden sind. Die vorgeschriebenen Tests rufen
  // runTask mit leerem kontext auf und müssen den Mock erreichen.
  if (!kontext.verstaendnis && typeof kontext.docText !== 'string' && (!kontext.volatiles || !kontext.volatiles.length)) {
    kontext.docText = ''
  }
  const anfrage = baueAnfrage(taskName, kontext)
  const onDelta = eintrag.stream ? optionen.onDelta : undefined

  let ergebnis
  try {
    ergebnis = await sendeEinmal(anfrage, onDelta)
  } catch (fehler) {
    bucheFehlerVerbrauch(fehler, eintrag)
    if (!WIEDERHOLBAR.has(fehler && fehler.typ)) throw fehler
    await warte(hooks.retryWartezeitMs) // EIN stiller Wiederholungsversuch (Spec §7)
    // Netzabriss-Prüfung (Issue #17): bei einem Stream-Task hat der Verbraucher die
    // Deltas des abgerissenen Versuchs womöglich schon angezeigt. Ohne dieses Signal
    // klebten die Deltas des zweiten Versuchs dahinter — sichtbar doppelter Text.
    if (eintrag.stream && optionen.onNeustart) optionen.onNeustart()
    try {
      ergebnis = await sendeEinmal(anfrage, onDelta)
    } catch (zweiterFehler) {
      bucheFehlerVerbrauch(zweiterFehler, eintrag)
      throw zweiterFehler
    }
  }

  // Verbrauch IMMER zählen — auch bei refusal/max_tokens wurden Tokens verbraucht.
  const settings = hooks.getSettings ? hooks.getSettings() : null
  if (settings) {
    const kostenCents = schaetzeKostenCents(ergebnis.usage, MODELLE[eintrag.modell])
    verbucheUsage(settings, ergebnis.usage, kostenCents)
  }
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
