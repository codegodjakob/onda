// Onda-Anmerkungsvertrag: eine Quelle der Wahrheit für Art, Kategorie,
// Priorität, Gestalt und mögliche Textoperation. Kein DOM, vollständig node-testbar.

export const TEXT_ANNOTATION_KINDS = Object.freeze([
  'rechtschreibung',
  'grammatik',
  'zeichensetzung',
  'wortwahl',
  'satzstil',
  'absatzstil',
  'straffen',
  'wiederholung',
  'ton',
  'stilmittel',
  'anglizismus',
  'terminologie',
  'verschieben',
  'uebergang',
  'gliederung',
  'fluss',
  'faden',
  'ueberschrift',
  'anmerkung',
  'beleg',
  'faktencheck',
  'widerspruch',
  'luecke',
  'verstaendlichkeit',
])

export const NOTE_ANNOTATION_KINDS = Object.freeze([
  'ausformulieren',
  'buendeln',
  'nachfrage',
  'ordnen',
  'aufgreifen',
])

export const ALL_ANNOTATION_KINDS = Object.freeze([
  ...TEXT_ANNOTATION_KINDS,
  ...NOTE_ANNOTATION_KINDS,
])

function definition(kind, label, category, priority, form, scope, operation = null) {
  return Object.freeze({ kind, label, category, priority, form, scope, operation })
}

export const ANNOTATION_DEFINITIONS = Object.freeze({
  rechtschreibung: definition('rechtschreibung', 'Rechtschreibung', 'korrektur', 'fehler', 'correction', 'Wort', 'replace-range'),
  grammatik: definition('grammatik', 'Grammatik', 'korrektur', 'fehler', 'correction', 'Satz', 'replace-range'),
  zeichensetzung: definition('zeichensetzung', 'Zeichensetzung', 'korrektur', 'fehler', 'correction', 'Wort', 'replace-range'),
  wortwahl: definition('wortwahl', 'Wortwahl', 'stil', 'geschmack', 'correction', 'Wort', 'replace-range'),
  satzstil: definition('satzstil', 'Satzstil', 'stil', 'empfehlung', 'rewrite', 'Satz', 'replace-range'),
  absatzstil: definition('absatzstil', 'Absatzstil', 'stil', 'geschmack', 'rewrite', 'Absatz', 'replace-range'),
  straffen: definition('straffen', 'Straffen', 'stil', 'empfehlung', 'rewrite', 'Satz', 'replace-range'),
  // Wiederholung ist eine Sammelkarte: jedes Vorkommen wird im Text markiert und
  // durchnummeriert, die Karte fasst zusammen und ersetzt auf einmal. So steht es
  // in annotation.card.html, Beispiel "Wiederholung".
  wiederholung: definition('wiederholung', 'Wiederholung', 'stil', 'geschmack', 'region', 'Absatz', 'replace-many'),
  ton: definition('ton', 'Ton & Register', 'stil', 'geschmack', 'region', 'Abschnitt', 'replace-many'),
  stilmittel: definition('stilmittel', 'Stilmittel', 'stil', 'geschmack', 'insertion', 'Satz', 'insert-at'),
  anglizismus: definition('anglizismus', 'Anglizismus', 'stil', 'geschmack', 'correction', 'Wort', 'replace-range'),
  terminologie: definition('terminologie', 'Terminologie', 'stil', 'empfehlung', 'compare', 'Text', 'replace-many'),
  verschieben: definition('verschieben', 'Verschieben', 'struktur', 'empfehlung', 'slot', 'Absatz', 'move-block'),
  uebergang: definition('uebergang', 'Übergang', 'struktur', 'empfehlung', 'insertion', 'Satz', 'insert-at'),
  gliederung: definition('gliederung', 'Gliederung', 'struktur', 'empfehlung', 'slot', 'Abschnitt', 'insert-heading'),
  fluss: definition('fluss', 'Textfluss', 'struktur', 'empfehlung', 'rewrite', 'Satz', 'replace-range'),
  // Roter Faden hat KEINE Textoperation (letztes Feld leer) — es gibt nichts zu
  // ersetzen, nur etwas zu bedenken. Die Form war bis hierher 'rewrite', also
  // eine Karte, die einen Ersatztext verspricht und keinen liefert. Die Vorlage
  // zeigt hier <Annotation> (annotation.card.html, Beispiel "Roter Faden"):
  // eine gewoehnliche Karte mit einem Satz und einem Knopf "Verstanden".
  faden: definition('faden', 'Roter Faden', 'struktur', 'empfehlung', 'card', 'Text'),
  ueberschrift: definition('ueberschrift', 'Überschrift', 'struktur', 'geschmack', 'title', 'Titel', 'replace-title'),
  anmerkung: definition('anmerkung', 'Anmerkung', 'inhalt', 'geschmack', 'dialogue', 'Satz'),
  beleg: definition('beleg', 'Beleg fehlt', 'inhalt', 'fehler', 'source', 'Satz', 'attach-source'),
  faktencheck: definition('faktencheck', 'Faktencheck', 'inhalt', 'fehler', 'source', 'Satz', 'replace-range'),
  widerspruch: definition('widerspruch', 'Widerspruch', 'inhalt', 'fehler', 'compare', 'Text', 'replace-range'),
  luecke: definition('luecke', 'Gegenargument fehlt', 'inhalt', 'empfehlung', 'dialogue', 'Abschnitt'),
  verstaendlichkeit: definition('verstaendlichkeit', 'Verständlichkeit', 'inhalt', 'empfehlung', 'insertion', 'Satz', 'insert-at'),
  ausformulieren: definition('ausformulieren', 'Ausformulieren', 'notiz', 'empfehlung', 'rewrite', 'Notiz', 'replace-range'),
  buendeln: definition('buendeln', 'Gehört zusammen', 'notiz', 'empfehlung', 'slot', 'Notizen', 'move-block'),
  nachfrage: definition('nachfrage', 'Nachfrage', 'notiz', 'empfehlung', 'dialogue', 'Notiz'),
  ordnen: definition('ordnen', 'Reihenfolge', 'notiz', 'empfehlung', 'slot', 'Notizen', 'move-block'),
  aufgreifen: definition('aufgreifen', 'Offener Faden', 'notiz', 'geschmack', 'dialogue', 'Text'),
})

const ALL_KIND_SET = new Set(ALL_ANNOTATION_KINDS)
const TEXT_KIND_SET = new Set(TEXT_ANNOTATION_KINDS)
const NOTE_KIND_SET = new Set(NOTE_ANNOTATION_KINDS)

const LEGACY_GERMAN_KIND = Object.freeze({
  fakt: 'faktencheck',
  quelle: 'beleg',
  methode: 'anmerkung',
  logik: 'widerspruch',
  struktur: 'faden',
  wirkung: 'anmerkung',
  erklaerung: 'verstaendlichkeit',
  sprache: 'wortwahl',
})

const LEGACY_ENGLISH_KIND = Object.freeze({
  fact: 'faktencheck',
  source: 'beleg',
  citation: 'beleg',
  method: 'anmerkung',
  logic: 'widerspruch',
  structure: 'faden',
  content: 'anmerkung',
  wording: 'wortwahl',
  form: 'wortwahl',
})

export function kindInfo(kind) {
  return ANNOTATION_DEFINITIONS[ALL_KIND_SET.has(kind) ? kind : 'anmerkung']
}

export function annotationKindsForMode(mode = 'text') {
  return mode === 'notiz' ? NOTE_ANNOTATION_KINDS : TEXT_ANNOTATION_KINDS
}

export function isAnnotationKindAllowed(mode, kind) {
  return mode === 'notiz' ? NOTE_KIND_SET.has(kind) : TEXT_KIND_SET.has(kind)
}

function inferLegacyKind(finding) {
  if (finding?.stilmittelId) return 'stilmittel'
  if (Array.isArray(finding?.sources) && finding.sources.length) return 'beleg'
  const german = String(finding?.kiKategorie || finding?.kategorie || '').trim().toLowerCase()
  if (LEGACY_GERMAN_KIND[german]) return LEGACY_GERMAN_KIND[german]
  const english = String(finding?.category || finding?.kind || '').trim().toLowerCase()
  return LEGACY_ENGLISH_KIND[english] || 'anmerkung'
}

export function normalizeAnnotationFinding(finding = {}) {
  const source = finding && typeof finding === 'object' && !Array.isArray(finding) ? finding : {}
  const exact = ALL_KIND_SET.has(source.anmerkungsart) ? source.anmerkungsart : null
  return {
    ...source,
    anmerkungsart: exact || inferLegacyKind(source),
  }
}

export function resolveAnnotationPresentation(finding) {
  const normalized = normalizeAnnotationFinding(finding)
  return kindInfo(normalized.anmerkungsart)
}

// --- Die Geste im Text -------------------------------------------------------
// Bis zum 8.8.2026 trug der Absatz nur einen Punkt im Rand — an den WOERTERN stand
// nichts. Jakob dazu: „ich erkenn dann gar nicht direkt, um was es geht. Ich muss
// dann lesen, ich muss erst mal das richtig zuordnen zum Text."
//
// Die Antwort steht seit jeher im Vertrag, sie wurde nur nie benutzt: jede Art hat
// einen scope. Aus ihm folgt die GESTALT der Markierung, und die sagt den Umfang,
// bevor ein Wort gelesen ist:
//   wort    — geschlossene Kontur um die Wendung
//   satz    — ein Strich darunter, der Satzlaenge folgend
//   absatz  — eine Klammer am linken Rand, ueber die volle Hoehe
//   block   — eine ruhige Flaeche um den ganzen Absatz UND eine Marke an der
//             Zielstelle. Nur der Ortswechsel bekommt sie, denn nur er hat zwei
//             Enden: „das gehoert woanders hin" ohne sichtbares Wohin ist eine
//             halbe Aussage. Die Klammer koennte das Ziel nicht zeigen.
//   keine   — es gibt keine einzelne Stelle: 'Text' meint den ganzen Text, 'Titel'
//             die Ueberschrift, 'Notiz'/'Notizen' stehen gar nicht im Fliesstext.
//             Fuer sie bleibt es beim Punkt im Rand; eine erfundene Strecke waere
//             eine Behauptung ueber den Text.
//
// Farbe kommt in keiner der Gestalten vor (Jakob, 8.8.2026: „keine farben bitte").
// Sie unterscheiden sich durch die Form, und das ist Absicht: haelt die Form allein,
// braucht es Farbe nie — und bleibt fuer spaeter frei.
const GESTE_JE_REICHWEITE = Object.freeze({
  Wort: 'wort',
  Satz: 'satz',
  Absatz: 'absatz',
  Abschnitt: 'absatz',
})

export function markierungsGestalt(kind) {
  const definition = ANNOTATION_DEFINITIONS[kind]
  const ausReichweite = GESTE_JE_REICHWEITE[definition?.scope] || 'keine'
  // Der Ortswechsel bekommt die Flaeche statt der Klammer — aber nur, wo die
  // Reichweite ueberhaupt auf eine Stelle im Fliesstext zeigt. 'buendeln' und
  // 'ordnen' verschieben ebenfalls, meinen aber Notizen; die stehen nicht im Text,
  // und eine Flaeche um nichts waere eine Behauptung.
  if (definition?.operation === 'move-block' && ausReichweite !== 'keine') return 'block'
  return ausReichweite
}

// Bequemer Weg von einem rohen Finding aus — dieselbe Toleranz wie ueberall sonst:
// aeltere Eintraege tragen ihre Art als kiKategorie oder kategorie.
export function gestaltFuerFinding(finding) {
  return markierungsGestalt(normalizeAnnotationFinding(finding).anmerkungsart)
}

// --- Was zuerst drankommt ----------------------------------------------------
// „Was ist die Anmerkung, die die hoechste hat zum Gelingen des Textes? Also was ist
// die Aufgabe, die die am meisten Impact hat, die man als Naechstes umsetzen sollte?"
// (Jakob, 8.8.2026)
//
// Bis dahin sortierte die Warteschlange nach Grundursache, Integritaet und dann ALTER.
// Ein Kommafehler und eine zerfallende Gliederung standen gleichauf, sobald beides
// gleich alt war. Wirkung kam nicht vor.
//
// Zwei Masse, beide aus Feldern, die jede Art ohnehin traegt — nichts wird geraten und
// nichts kostet einen zusaetzlichen Modellaufruf:
//
// TRAGWEITE: Wie weit reicht die Frage in den Text? Ein zerrissener roter Faden trifft
// alles, eine Wortwahl ein Wort. Die Reihenfolge deckt sich mit dem, was die
// Schreibzentrums-Didaktik seit vierzig Jahren sagt — Higher-Order Concerns
// (These, Aufbau, Argumentation) vor Lower-Order Concerns (Grammatik, Wortwahl) —,
// und zwar nicht zufaellig: hoehere Ordnung heisst weitere Reichweite. Die Begruendung
// ist doppelt (docs/research/2026-08-05-feld-feedback-didaktik.md, Abschnitt 3):
// HOC-Probleme zerstoeren das Verstehen, LOC-Probleme nur den Eindruck — und Arbeit an
// Saetzen, die eine Umstellung ohnehin loescht, ist verschwendet.
//
// VERBINDLICHKEIT: Wie sehr ist es eine Frage von richtig und falsch? Ein Fehler ist
// keine Meinung, eine Empfehlung schon eher, Geschmack ganz. Sie entscheidet ERST bei
// gleicher Tragweite — sonst kaeme der Kommafehler wieder vor der Gliederung.
const TRAGWEITE_JE_REICHWEITE = Object.freeze({
  Text: 0,        // der ganze Text: roter Faden, Widerspruch, Terminologie
  Titel: 1,       // die Ueberschrift nennt den ganzen Text
  Abschnitt: 2,
  Absatz: 3,
  Satz: 4,
  Wort: 5,
  Notiz: 6,       // steht gar nicht im Fliesstext
  Notizen: 6,
})

const VERBINDLICHKEIT_JE_PRIORITAET = Object.freeze({
  fehler: 0,
  empfehlung: 1,
  geschmack: 2,
})

// Unbekanntes landet hinten, nie vorn. Eine Art, die niemand kennt, darf sich nicht an
// die Spitze schieben — fail-closed wie ueberall im Haus.
export function tragweite(kind) {
  const reichweite = ANNOTATION_DEFINITIONS[kind]?.scope
  return TRAGWEITE_JE_REICHWEITE[reichweite] ?? 9
}

export function verbindlichkeit(kind) {
  const prioritaet = ANNOTATION_DEFINITIONS[kind]?.priority
  return VERBINDLICHKEIT_JE_PRIORITAET[prioritaet] ?? 9
}

// Nur die Art, ohne das ganze Finding zu kopieren. normalizeAnnotationFinding legt bei
// jedem Aufruf ein neues Objekt an; beim Sortieren geschieht das n·log n mal.
export function anmerkungsartVon(finding) {
  const source = finding && typeof finding === 'object' && !Array.isArray(finding) ? finding : {}
  return ALL_KIND_SET.has(source.anmerkungsart) ? source.anmerkungsart : inferLegacyKind(source)
}
