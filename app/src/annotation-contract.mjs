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
