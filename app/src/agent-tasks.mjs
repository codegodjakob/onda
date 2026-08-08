// Task→Modell-Verteilertabelle + Anfrage-Bau im Anthropic-Wire-Format — PUR, node-testbar.
// Kein DOM, kein Netz. Die Tabelle ist Daten, kein Code-Pfad: jede spätere Router- oder
// Anbieter-Erweiterung ist ein Tabelleneintrag, kein Umbau (Spec §3.1).
// WICHTIG: Dieses Modul kennt NIE den API-Schlüssel. Den setzt der direktTransport
// (x-api-key + anthropic-dangerous-direct-browser-access) bzw. Swift aus der Keychain.

import { SYSTEM_COACH } from './agent-prompts.mjs'
import { STILMITTEL } from './stilmittel.mjs'
import { NOTE_ANNOTATION_KINDS, TEXT_ANNOTATION_KINDS } from './annotation-contract.mjs'
import { FUNKTIONEN } from './bausteinarten-vertrag.mjs'

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
          // Was der Text GEWINNT, wenn dieser Hinweis umgesetzt wird — als Stufe, nicht
          // als Satz. Die Prosa dazu steht schon in folge („was passiert, wenn es
          // bleibt"); ein zweiter Satz waere bei jedem Hinweis erneut zu bezahlen und
          // sagte dasselbe in die andere Richtung.
          //
          // Diese Stufe entscheidet die Reihenfolge VOR der Tragweite (reasoning-model,
          // vergleicheHinweise). Das ist ihr ganzer Zweck: die Tragweite ordnet ARTEN
          // („eine Gliederungsfrage reicht weiter als eine Wortwahl"), die Stufe ordnet
          // FAELLE — sie ist der Ort, an dem das Modell sagen darf, dass ausgerechnet
          // dieses eine Wort den Text traegt.
          gewinn: {
            type: 'string',
            enum: ['traegt', 'schaerft', 'glaettet'],
            description: 'traegt = der Text sagt danach, was er vorher nur behauptet; hoechstens EIN Hinweis je Durchgang darf das beanspruchen. '
              + 'schaerft = die Aussage wird genauer. glaettet = es liest sich besser. Im Zweifel schaerft.',
          },
        },
        required: ['kategorie', 'anmerkungsart', 'anker', 'beobachtung', 'relevanz', 'folge', 'muster', 'vorschlagsart', 'stilmittelId', 'vorschlag', 'istGrundursache', 'integritaet', 'gewinn'],
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

// Der dritte Kanal (Bausteinarten). Die Zuordnung nennt die Art bei ihrem NAMEN, nicht
// bei einer Kennung: Das Modell soll keine IDs erfinden, die dann irgendwo aufgelöst
// werden müssten. Die IDs vergibt bausteinlauf-model.mjs beim Verarbeiten.
export const BAUSTEINARTEN_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    textsorte: {
      type: 'string',
      description: 'Knapp, was für ein Text das ist. Bestimmt, welche Arten überhaupt in Frage kommen.',
    },
    arten: {
      type: 'array',
      maxItems: 8,
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Ein bis zwei Wörter im Deutschen, so wie eine Lektorin die Art im Gespräch nennt.',
          },
          beschreibung: { type: 'string', description: 'Ein Satz, wozu diese Art in diesem Text dient.' },
          funktion: {
            anyOf: [
              { type: 'string', enum: [...FUNKTIONEN] },
              { type: 'null' },
            ],
            description: 'Die Rolle im Argument, oder null. null ist richtig, wenn keine passt — nicht raten.',
          },
        },
        required: ['name', 'beschreibung', 'funktion'],
        additionalProperties: false,
      },
    },
    zuordnung: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          blockId: { type: 'string', description: 'Die Kennung des Absatzes aus dem gelieferten Absatzverzeichnis.' },
          art: { type: 'string', description: 'Der Name einer Art aus arten, zeichengenau.' },
        },
        required: ['blockId', 'art'],
        additionalProperties: false,
      },
    },
  },
  required: ['textsorte', 'arten', 'zuordnung'],
  additionalProperties: false,
})

// Fix-Runde 2, Finding 5 (Important): auf claude-opus-5 ist adaptives Denken standardmaessig AN,
// und max_tokens deckelt DENKEN + ANTWORT zusammen (kein separates Denk-Budget wie bei
// extended thinking mit explizitem budget_tokens). Bei 16000 lief das regelmaessig auf
// stop_reason:'max_tokens', bevor die eigentliche Antwort fertig war -- das Gateway verwirft
// den Lauf dann komplett (agent-gateway.mjs), bezahlt und ohne Ergebnis. verstaendnis/hinweise
// bekommen deshalb deutlich mehr Luft (32000); chat streamt ohnehin sichtbar fuer die Autorin
// oder den Autor, ein hoher Wert ist dort unkritisch (64000). titel/zusammenfassung laufen auf
// dem Routine-Modell mit knapper, klar begrenzter Ausgabe und bleiben unveraendert.
export const TASK_TABLE = Object.freeze({
  verstaendnis: Object.freeze({ modell: 'stark', maxTokens: 32000, stream: false, schema: VERSTAENDNIS_SCHEMA }),
  hinweise: Object.freeze({ modell: 'stark', maxTokens: 32000, stream: false, schema: HINWEISE_SCHEMA }),
  // Erweiterungen laufen bewusst auf dem starken Modell: der ganze Wert dieses Kanals
  // haengt daran, das Naheliegende zu erkennen und zu verwerfen. Genau das ist die
  // Faehigkeit, die ein Routine-Modell nicht hat -- es liefert zuverlaessig den
  // erwartbaren Gedanken, also den einen, den die Autorin oder der Autor schon hatte.
  erweiterungen: Object.freeze({ modell: 'stark', maxTokens: 32000, stream: false, schema: ERWEITERUNGEN_SCHEMA }),
  // Quellenthemen laufen aus demselben Grund auf dem starken Modell wie die
  // Erweiterungen: der ganze Wert haengt daran, die naheliegende Ordnung zu
  // verwerfen. Ein Routine-Modell liefert zuverlaessig „Web-Quellen" und
  // „Sonstiges" — die Bibliotheksrubrik, die jeder Mensch selbst hinbekommt.
  // Die Ausgabe ist klein (Namen, ein Satz, Kennungen), 8000 reichen weit; nur
  // gedacht wird viel, und das teilt sich das Budget (siehe oben).
  quellenthemen: Object.freeze({ modell: 'stark', maxTokens: 8000, stream: false, schema: QUELLENTHEMEN_SCHEMA }),
  // Bausteinarten laufen auf dem starken Modell: Die Aufgabe ist nicht, Absätze in
  // bekannte Schubladen zu sortieren, sondern für DIESEN Text erst die passenden
  // Schubladen zu finden. Genau das kann ein Routine-Modell nicht -- es liefert
  // zuverlässig die allgemeine Liste, also die, die wir gerade abgeschafft haben.
  // 8000 Tokens reichen: acht Arten plus eine Zuordnungszeile je Absatz.
  bausteinarten: Object.freeze({ modell: 'stark', maxTokens: 8000, stream: false, schema: BAUSTEINARTEN_SCHEMA }),
  chat: Object.freeze({ modell: 'stark', maxTokens: 64000, stream: true }),
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
