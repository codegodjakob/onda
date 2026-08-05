// Ein bewusst schmaler, einmaliger Live-Prüfpfad für die signierte Mac-App.
// Er liest den Schlüssel nie selbst, wiederholt keinen Aufruf und gibt weder
// Eingabe noch Modellausgabe oder Fehlermeldungen zurück. Der persistierbare
// Beleg besteht ausschließlich aus nicht-sensiblen Metadaten.

import { HINWEISE_SCHEMA, MODELLE, TASK_TABLE, baueAnfrage } from './agent-tasks.mjs'
import { TEXT_ANNOTATION_KINDS } from './annotation-contract.mjs'
import { waehleTransport } from './agent-transport.mjs'

const AUFGABE = 'hinweise'
const MODELL = MODELLE[TASK_TABLE[AUFGABE].modell]
const ERLAUBTE_FEHLER = new Set([
  'kein-schluessel', 'offline', 'ratenlimit', 'ueberlastet',
  'schema', 'abgelehnt', 'abgebrochen', 'unbekannt',
])

function leereUsage() {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadInputTokens: 0,
    cacheCreationInputTokens: 0,
  }
}

function sichereUsage(usage) {
  const zahl = wert => Number.isFinite(wert) && wert >= 0 ? Math.round(wert) : 0
  return {
    inputTokens: zahl(usage?.input_tokens),
    outputTokens: zahl(usage?.output_tokens),
    cacheReadInputTokens: zahl(usage?.cache_read_input_tokens),
    cacheCreationInputTokens: zahl(usage?.cache_creation_input_tokens),
  }
}

function basis() {
  return {
    passed: false,
    keyPresent: false,
    requestCount: 0,
    task: AUFGABE,
    model: MODELL,
    durationMs: 0,
    usage: leereUsage(),
    annotationKind: null,
    schemaValid: false,
    errorType: null,
  }
}

function sichererFehlertyp(fehler, fallback = 'unbekannt') {
  const typ = typeof fehler?.typ === 'string' ? fehler.typ : fallback
  return ERLAUBTE_FEHLER.has(typ) ? typ : fallback
}

// Die API erzwingt das Schema bereits. Das Live-Gate prüft es trotzdem lokal
// vollständig, damit sein Beleg nicht von dieser externen Zusage abhängt.
export function entsprichtJsonSchema(wert, schema) {
  if (!schema || typeof schema !== 'object') return true
  if (Array.isArray(schema.anyOf)) {
    return schema.anyOf.some(variante => entsprichtJsonSchema(wert, variante))
  }
  if (Array.isArray(schema.enum) && !schema.enum.some(erlaubt => Object.is(erlaubt, wert))) {
    return false
  }

  if (schema.type === 'null') return wert === null
  if (schema.type === 'string') return typeof wert === 'string'
  if (schema.type === 'boolean') return typeof wert === 'boolean'
  if (schema.type === 'number') return typeof wert === 'number' && Number.isFinite(wert)
  if (schema.type === 'integer') return Number.isInteger(wert)
  if (schema.type === 'array') {
    return Array.isArray(wert)
      && (!schema.items || wert.every(eintrag => entsprichtJsonSchema(eintrag, schema.items)))
  }
  if (schema.type === 'object') {
    if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return false
    const properties = schema.properties || {}
    if ((schema.required || []).some(name => !Object.hasOwn(wert, name))) return false
    if (schema.additionalProperties === false && Object.keys(wert).some(name => !Object.hasOwn(properties, name))) {
      return false
    }
    return Object.entries(properties).every(([name, unterschema]) => (
      !Object.hasOwn(wert, name) || entsprichtJsonSchema(wert[name], unterschema)
    ))
  }
  return true
}

export function sendeEinmalUeberNativeBruecke(anfrage, transport = waehleTransport()) {
  return new Promise((resolve, reject) => {
    transport.sende(anfrage, { onFertig: resolve, onFehler: reject })
  })
}

export async function runLiveNativeProbe({
  hatSchluessel,
  senden,
  jetzt = () => Date.now(),
}) {
  const bericht = basis()
  try {
    bericht.keyPresent = await hatSchluessel() === true
  } catch (fehler) {
    bericht.errorType = sichererFehlertyp(fehler, 'offline')
    return bericht
  }
  if (!bericht.keyPresent) {
    bericht.errorType = 'kein-schluessel'
    return bericht
  }

  // Der Text enthält genau einen offensichtlichen, kontextunabhängigen Fehler.
  // Die aktuelle Frage begrenzt die Antwort zusätzlich auf genau einen Hinweis.
  const anfrage = baueAnfrage(AUFGABE, {
    annotationMode: 'text',
    verstaendnis: {
      task: 'Kurze Qualitätsprüfung eines deutschen Satzes',
      audience: ['Allgemeines Publikum'],
      desiredEffect: 'klar und korrekt',
      evidenceStandard: 'nur der vorliegende Satz',
      protectedIntentions: ['Aussage erhalten'],
      openQuestions: [],
    },
    docText: 'Das Ergebniss ist klar.',
    anfrage: 'Prüfe nur den offensichtlichen Rechtschreibfehler. Gib genau einen Hinweis zurück.',
  })

  const begonnen = jetzt()
  bericht.requestCount = 1
  try {
    const antwort = await senden(anfrage)
    bericht.durationMs = Math.max(0, Math.round(jetzt() - begonnen))
    bericht.usage = sichereUsage(antwort?.usage)
    if (antwort?.stopReason === 'refusal') {
      bericht.errorType = 'abgelehnt'
      return bericht
    }
    if (antwort?.stopReason === 'max_tokens') {
      bericht.errorType = 'schema'
      return bericht
    }
    let daten
    try {
      daten = JSON.parse(antwort?.text || '')
    } catch (fehler) {
      bericht.errorType = 'schema'
      return bericht
    }
    const erster = Array.isArray(daten?.hinweise) ? daten.hinweise[0] : null
    bericht.schemaValid = entsprichtJsonSchema(daten, HINWEISE_SCHEMA)
      && daten.hinweise.length === 1
      && TEXT_ANNOTATION_KINDS.includes(erster?.anmerkungsart)
    bericht.annotationKind = bericht.schemaValid ? erster.anmerkungsart : null
    bericht.passed = bericht.schemaValid
    bericht.errorType = bericht.passed ? null : 'schema'
    return bericht
  } catch (fehler) {
    bericht.durationMs = Math.max(0, Math.round(jetzt() - begonnen))
    bericht.errorType = sichererFehlertyp(fehler)
    return bericht
  }
}
