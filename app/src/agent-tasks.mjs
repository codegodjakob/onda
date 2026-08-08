// Task→Modell-Verteilertabelle + Anfrage-Bau im Anthropic-Wire-Format — PUR, node-testbar.
// Kein DOM, kein Netz. Die Tabelle ist Daten, kein Code-Pfad: jede spätere Router- oder
// Anbieter-Erweiterung ist ein Tabelleneintrag, kein Umbau (Spec §3.1).
// WICHTIG: Dieses Modul kennt NIE den API-Schlüssel. Den setzt der direktTransport
// (x-api-key + anthropic-dangerous-direct-browser-access) bzw. Swift aus der Keychain.

import { SYSTEM_COACH } from './agent-prompts.mjs'
import { STILMITTEL } from './stilmittel.mjs'
import { NOTE_ANNOTATION_KINDS, TEXT_ANNOTATION_KINDS } from './annotation-contract.mjs'
import { KANAELE } from './kanaele.mjs'

export const API_URL = 'https://api.anthropic.com/v1/messages'
export const API_VERSION = '2023-06-01'

export const MODELLE = Object.freeze({
  stark: 'claude-opus-5',
  routine: 'claude-haiku-4-5',
})

// Preis-Momentaufnahme 07/2026 (Anthropic-Preisliste) — regelmäßig prüfen.
// Dollar pro Million Tokens; Cache-Read 0,1x und Cache-Write 1,25x des Input-Preises.
export const PREISE = Object.freeze({
  'claude-opus-5': Object.freeze({ inProMTok: 5, outProMTok: 25 }),
  'claude-haiku-4-5': Object.freeze({ inProMTok: 1, outProMTok: 5 }),
  cacheReadFaktor: 0.1,
  cacheWriteFaktor: 1.25,
})

// muster ist Pflicht, nicht Kür: Ein Hinweis, der nur diese eine Stelle repariert, macht
// diesen einen Text besser. Das Prinzip dahinter macht die Autorin oder den Autor besser.
// Ohne Pflichtfeld KANN das Modell es nicht einmal freiwillig nachreichen — die Feldliste ist
// geschlossen (additionalProperties: false). Es steht bewusst hinter folge und vor vorschlag:
// erst begreifen, warum es zählt, dann verallgemeinern, dann erst eine Fassung anbieten.
// Der Schema-Vertrag verlangt das Muster bei beiden Kanälen. Ältere persistierte Antworten
// bleiben im Verarbeitungsmodell tolerant, neue Modellantworten passieren das Tor nur vollständig.
export const HINWEISE_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    hinweise: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kategorie: {
            type: 'string',
            enum: ['fakt', 'quelle', 'methode', 'logik', 'struktur', 'wirkung', 'erklaerung', 'sprache'],
          },
          anmerkungsart: {
            type: 'string',
            enum: TEXT_ANNOTATION_KINDS,
            description: 'Die genaue Onda-Anmerkungsart. Sie bestimmt die fallgerechte Darstellung; die grobe kategorie bleibt für Integrität und Zeitpunkt erhalten.',
          },
          anker: { type: 'string', description: 'Wörtliches Minimal-Zitat aus dem Text, keine Paraphrase.' },
          beobachtung: { type: 'string' },
          relevanz: { type: 'string' },
          folge: { type: 'string' },
          muster: {
            type: 'string',
            description: 'Das übertragbare Prinzip hinter dem Hinweis — der Satz, der beim nächsten '
              + 'Text von allein wieder anwendbar ist. Keine Wiederholung der Beobachtung.',
          },
          vorschlagsart: {
            type: 'string',
            enum: ['keiner', 'formulierung', 'stilmittel'],
            description: 'keiner bei vorschlag:null; formulierung bei einer normalen Fassung; stilmittel nur bei einem bewusst vorgeschlagenen Stilmittel.',
          },
          stilmittelId: {
            anyOf: [
              { type: 'string', enum: STILMITTEL.map(mittel => mittel.id) },
              { type: 'null' },
            ],
            description: 'Nur bei vorschlagsart:stilmittel die ID aus der vorgegebenen Stilmitteltabelle, sonst null.',
          },
          vorschlag: {
            anyOf: [
              {
                type: 'object',
                properties: { bisher: { type: 'string' }, neu: { type: 'string' } },
                required: ['bisher', 'neu'],
                additionalProperties: false,
              },
              { type: 'null' },
            ],
          },
          istGrundursache: { type: 'boolean' },
          integritaet: { type: 'boolean' },
        },
        required: ['kategorie', 'anmerkungsart', 'anker', 'beobachtung', 'relevanz', 'folge', 'muster', 'vorschlagsart', 'stilmittelId', 'vorschlag', 'istGrundursache', 'integritaet'],
        additionalProperties: false,
      },
    },
  },
  required: ['hinweise'],
  additionalProperties: false,
})

function schemaMitAnmerkungsarten(schema, arten) {
  const item = schema.properties.hinweise.items
  return Object.freeze({
    ...schema,
    properties: Object.freeze({
      ...schema.properties,
      hinweise: Object.freeze({
        ...schema.properties.hinweise,
        items: Object.freeze({
          ...item,
          properties: Object.freeze({
            ...item.properties,
            anmerkungsart: Object.freeze({
              ...item.properties.anmerkungsart,
              enum: arten,
            }),
          }),
        }),
      }),
    }),
  })
}

export const HINWEISE_NOTIZ_SCHEMA = schemaMitAnmerkungsarten(HINWEISE_SCHEMA, NOTE_ANNOTATION_KINDS)

export function hinweiseSchemaFuerModus(modus = 'text') {
  return modus === 'notiz' ? HINWEISE_NOTIZ_SCHEMA : HINWEISE_SCHEMA
}

// Der zweite Kanal (Erweiterungen). anker ist hier eine LISTE, weil die Zahl der Stellen
// zur Art gehoert: weiterfuehrung eine, verbindung zwei, feld keine. Ein einzelnes
// anker-Feld wuerde alle drei in dieselbe Form pressen und das Modell dazu einladen,
// fuer feld eine Stelle zu erfinden. Die Zahl wird beim Verarbeiten geprueft, nicht
// geraten (erweiterungslauf-model.mjs).
export const ERWEITERUNGEN_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    erweiterungen: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          art: { type: 'string', enum: ['weiterfuehrung', 'feld', 'verbindung'] },
          anker: {
            type: 'array',
            items: { type: 'string' },
            description: 'Wörtliche Zitate aus dem Text. weiterfuehrung: genau eines. '
              + 'verbindung: genau zwei. feld: leer — es gehört zum Text als Ganzes.',
          },
          gedanke: { type: 'string', description: 'Der weiterführende Gedanke selbst, in zwei bis vier Sätzen.' },
          muster: { type: 'string', description: 'Das Prinzip dahinter, damit es beim nächsten Text von allein wieder anwendbar ist.' },
        },
        required: ['art', 'anker', 'gedanke', 'muster'],
        additionalProperties: false,
      },
    },
  },
  required: ['erweiterungen'],
  additionalProperties: false,
})

// Die Themen, nach denen die Quellen im Projekt stehen. Absichtlich KEIN Feld fuer
// „Sonstiges" und keine Pflicht, jede Quelle unterzubringen: was der Agent nicht
// zuordnen kann, faellt heraus und steht sichtbar unter „Noch ohne Thema"
// (quellen-thema-model.mjs). Eine erzwungene Vollzuordnung waere eine Ordnung, die
// keine ist.
export const QUELLENTHEMEN_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    gruppen: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Zwei bis vier Wörter, benennt den gemeinsamen Gegenstand — nie die Form '
              + '(„PDF-Quellen") und nie eine Restrubrik („Sonstiges").',
          },
          warum: { type: 'string', description: 'Ein Satz: was diese Quellen für dieses Projekt gemeinsam tragen.' },
          quellenIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Ausschließlich Kennungen aus der vorgelegten Liste. Nie eine erfinden, nie eine doppelt vergeben.',
          },
        },
        required: ['name', 'warum', 'quellenIds'],
        additionalProperties: false,
      },
    },
  },
  required: ['gruppen'],
  additionalProperties: false,
})

// Feldnamen exakt wie das Understanding-Modell (reasoning-model.mjs ensureProjectUnderstanding).
// Achtung fuer den Konsumenten: im gespeicherten Modell ist audience eine LISTE —
// der Verteiler zerlegt den String beim Uebernehmen (Vertrag: audience:string).
export const VERSTAENDNIS_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    task: { type: 'string' },
    audience: { type: 'string' },
    desiredEffect: { type: 'string' },
    evidenceStandard: { type: 'string' },
    protectedIntentions: { type: 'array', items: { type: 'string' } },
    openQuestions: { type: 'array', items: { type: 'string' } },
    antwortText: { type: 'string', description: 'Das, was der Agent im Chat sagt — Vorschlag oder Nachfrage.' },
  },
  required: ['task', 'audience', 'desiredEffect', 'evidenceStandard', 'protectedIntentions', 'openQuestions', 'antwortText'],
  additionalProperties: false,
})

// Welches Schema eine Kanal-Aufgabe erfüllen muss. Diese Zuordnung steht hier und nicht im
// Kanal-Register (kanaele.mjs), weil die Schemata selbst hier stehen — direkt neben dem
// Anfragebau, der sie benutzt. Zöge das Register sie zu sich herüber, müsste es aus dieser
// Datei importieren, während diese Datei aus dem Register importiert: ein Ring, und davon
// hat das Projekt bewusst keinen.
//
// Die Tabelle ist ein Namensaufruf: JEDE Aufgabe aus dem Register muss hier vorkommen.
// Fehlt eine, bricht der Start sofort und laut ab, statt dass ein Kanal still ohne
// Schemaprüfung ans Modell geht — die Antwort käme dann als freier Text zurück und würde
// beim Verarbeiten irgendwo weiter hinten zerfallen.
//
// Das Gespräch steht bewusst mit null da: es streamt sichtbaren Fließtext und hat kein
// JSON-Schema. Der Eintrag fehlt also nicht, er ist eine Aussage.
const SCHEMA_JE_AUFGABE = Object.freeze({
  verstaendnis: VERSTAENDNIS_SCHEMA,
  hinweise: HINWEISE_SCHEMA,
  erweiterungen: ERWEITERUNGEN_SCHEMA,
  quellenthemen: QUELLENTHEMEN_SCHEMA,
  chat: null,
})

// Baut die Kanal-Zeilen der Verteilertabelle aus dem Register: Modell, Token-Budget und
// Streaming stehen dort, das Schema steht hier. Vorher war das eine handgeführte Kopie der
// Kanalliste — die vierte im Projekt.
function kanalZeilen() {
  const zeilen = {}
  for (const kanal of KANAELE) {
    if (!(kanal.aufgabe in SCHEMA_JE_AUFGABE)) {
      throw new Error(
        `Kanal „${kanal.aufgabe}" steht im Register, aber in keiner Schema-Zeile von agent-tasks.mjs. `
        + 'Trage ihn in SCHEMA_JE_AUFGABE ein — mit einem Schema, oder mit null, wenn er Fließtext liefert.',
      )
    }
    const schema = SCHEMA_JE_AUFGABE[kanal.aufgabe]
    const zeile = { modell: kanal.modell, maxTokens: kanal.maxTokens, stream: kanal.stream }
    if (schema) zeile.schema = schema
    zeilen[kanal.aufgabe] = Object.freeze(zeile)
  }
  return zeilen
}

// titel und zusammenfassung sind keine Kanäle: sie laufen nicht durchs Lauf-Tor, haben keine
// Sperre und kein Journal, sondern sind kleine Hilfsaufgaben nebenher. Sie laufen deshalb auf
// dem Routine-Modell mit knapper, klar begrenzter Ausgabe und stehen weiterhin von Hand hier.
export const TASK_TABLE = Object.freeze({
  ...kanalZeilen(),
  titel: Object.freeze({ modell: 'routine', maxTokens: 256, stream: false }),
  zusammenfassung: Object.freeze({ modell: 'routine', maxTokens: 2000, stream: false }),
})

// Baut die komplette Anfrage in stabiler Cache-Präfix-Ordnung:
// (1) System (SYSTEM_COACH) -> (2) Projektverständnis -> (3) Dokumenttext -> [Breakpoints]
// -> (4) volatile Blöcke (Entscheidungsliste) OHNE cache_control -> [verlauf] -> (5) aktuelle Frage.
// Nachrichtenordnung: messages[0] = gecachte Blöcke + volatile (OHNE aktuelle Frage),
// danach älter Gesprächsverlauf chronologisch, zuletzt aktuelle Frage als user-Message.
// Invariante: letzte Message ist NIE role:'assistant' (kein Prefill — 400 auf Opus 5).
// Keine Zeitstempel, keine IDs im Präfix; maximal 3 cache_control-Breakpoints.
// KEIN thinking-Parameter (Opus 5 denkt adaptiv von selbst), KEINE temperature/top_p
// (auf Opus 5 ein 400-Fehler), kein Assistant-Prefill.
export function baueAnfrage(task, kontext = {}) {
  const eintrag = TASK_TABLE[task]
  if (!eintrag) throw new Error(`Unbekannter Task: ${task}`)

  const bloecke = []
  if (kontext.verstaendnis !== undefined) {
    bloecke.push({
      type: 'text',
      text: '<projektverstaendnis>' + JSON.stringify(kontext.verstaendnis) + '</projektverstaendnis>',
      cache_control: { type: 'ephemeral' },
    })
  }
  if (typeof kontext.docText === 'string') {
    bloecke.push({
      type: 'text',
      text: '<dokument>' + kontext.docText + '</dokument>',
      cache_control: { type: 'ephemeral' },
    })
  }
  for (const volatil of (kontext.volatiles || [])) {
    bloecke.push({ type: 'text', text: String(volatil) })
  }
  if (!bloecke.length) throw new Error('Anfrage ohne Inhalt: kontext braucht verstaendnis, docText oder volatiles')

  // Nachrichtenarrays: (1) Gecachte Blöcke + Volatiles, (2) ältere Konversation, (3) aktuelle Frage
  const messages = [{ role: 'user', content: bloecke }]
  if (kontext.verlauf) {
    if (!kontext.anfrage) throw new Error('chat: anfrage fehlt bei vorhandenem verlauf')
    messages.push(...kontext.verlauf)
  }
  if (kontext.anfrage) {
    messages.push({ role: 'user', content: kontext.anfrage })
  }

  const body = {
    model: MODELLE[eintrag.modell],
    max_tokens: eintrag.maxTokens,
    system: [{ type: 'text', text: SYSTEM_COACH, cache_control: { type: 'ephemeral' } }],
    messages,
  }
  if (eintrag.stream) body.stream = true
  const schema = task === 'hinweise' ? hinweiseSchemaFuerModus(kontext.annotationMode) : eintrag.schema
  if (schema) body.output_config = { format: { type: 'json_schema', schema } }

  return {
    url: API_URL,
    headers: { 'content-type': 'application/json', 'anthropic-version': API_VERSION },
    body,
    stream: !!eintrag.stream,
  }
}

// Schätzt die Kosten einer Antwort in Cent aus den usage-Zahlen der API.
// Wirft nie: unbekanntes Modell oder fehlende Felder ergeben 0.
export function schaetzeKostenCents(usage, modellId) {
  const preis = PREISE[modellId]
  if (!preis || !usage) return 0
  const inTok = usage.input_tokens || 0
  const outTok = usage.output_tokens || 0
  const cacheRead = usage.cache_read_input_tokens || 0
  const cacheWrite = usage.cache_creation_input_tokens || 0
  const dollar = (
    inTok * preis.inProMTok
    + outTok * preis.outProMTok
    + cacheRead * preis.inProMTok * PREISE.cacheReadFaktor
    + cacheWrite * preis.inProMTok * PREISE.cacheWriteFaktor
  ) / 1_000_000
  return dollar * 100
}
