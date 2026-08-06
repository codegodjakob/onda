import {
  ALL_ANNOTATION_KINDS,
  ANNOTATION_DEFINITIONS,
  TEXT_ANNOTATION_KINDS,
} from '../../../app/src/annotation-contract.mjs'

export const PLUGIN_ORIGIN = 'onda-one-page'
export const LEDGER_KEY = 'ondaOnePageLedger'
export const TARGET_FILE_KEY = '0DbO0vK6shrVU2qkmWSxIp'
export const TARGET_DOCUMENT_NAME = 'Claude Code'
export const TARGET_PAGE_NAME = 'Page 1'

export const PALETTE = Object.freeze({
  'gray/000': Object.freeze({ r: 1, g: 1, b: 1 }),
  'gray/025': Object.freeze({ r: 0.98, g: 0.98, b: 0.98 }),
  'gray/050': Object.freeze({ r: 0.95, g: 0.95, b: 0.95 }),
  'gray/100': Object.freeze({ r: 0.9, g: 0.9, b: 0.9 }),
  'gray/200': Object.freeze({ r: 0.82, g: 0.82, b: 0.82 }),
  'gray/300': Object.freeze({ r: 0.7, g: 0.7, b: 0.7 }),
  'gray/500': Object.freeze({ r: 0.45, g: 0.45, b: 0.45 }),
  'gray/700': Object.freeze({ r: 0.24, g: 0.24, b: 0.24 }),
  'gray/900': Object.freeze({ r: 0.08, g: 0.08, b: 0.08 }),
  'gray/1000': Object.freeze({ r: 0, g: 0, b: 0 }),
})

export const RADIUS_TOKENS = Object.freeze([
  Object.freeze({ name: 'radius/none', value: 0, geometry: 'RECTANGLE' }),
  Object.freeze({ name: 'radius/control', value: 4, geometry: 'RECTANGLE' }),
  Object.freeze({ name: 'radius/static', value: 6, geometry: 'RECTANGLE' }),
  Object.freeze({ name: 'radius/overlay', value: 8, geometry: 'RECTANGLE' }),
  Object.freeze({ name: 'radius/circle', value: 999, geometry: 'ELLIPSE' }),
])

export const TYPE_SCALE = Object.freeze([
  Object.freeze({ size: 12, lineHeight: 16 }),
  Object.freeze({ size: 15, lineHeight: 22 }),
  Object.freeze({ size: 21, lineHeight: 28 }),
  Object.freeze({ size: 40, lineHeight: 44 }),
])

export const TYPE_WEIGHTS = Object.freeze([400, 500, 700])

export const ANNOTATION_VIEW_NAMES = Object.freeze([
  'Open',
  'Accept · Undo',
  'Reject · Scope',
  'Error · Retry',
  'Responsive · 320 px',
  'Dark',
])

function annotationViews(definition) {
  const acceptDetail = definition.operation
    ? `Übernehmen mit ${definition.operation} · Rückgängig bleibt verfügbar`
    : 'Nicht verfügbar: keine automatische Textoperation · nur als redaktioneller Hinweis behandeln'
  return ANNOTATION_VIEW_NAMES.map(name => Object.freeze({
    name,
    detail: name === 'Open'
      ? `Offen · ${definition.form} · Gültigkeit: ${definition.scope}`
      : name === 'Accept · Undo'
        ? acceptDetail
        : name === 'Reject · Scope'
          ? `Ablehnen · Gültigkeit wählen: nur hier / Dokument / persönlich`
          : name === 'Error · Retry'
            ? 'Fehler · Erneut versuchen · Eingabe bleibt erhalten'
            : name === 'Responsive · 320 px'
              ? 'Schmale Ansicht · 320 px · Aktionen umbrechen lesbar'
              : 'Dunkle Referenz · Status zusätzlich durch Text, Symbol und Linie',
  }))
}

export const ANNOTATION_SECTIONS = Object.freeze(ALL_ANNOTATION_KINDS.map((kind, index) => {
  const definition = ANNOTATION_DEFINITIONS[kind]
  const isText = TEXT_ANNOTATION_KINDS.includes(kind)
  const localIndex = isText ? index + 1 : index - TEXT_ANNOTATION_KINDS.length + 1
  const group = isText ? '05' : '06'
  return Object.freeze({
    ...definition,
    sectionName: `${group}.${String(localIndex).padStart(2, '0')} · ${definition.label}`,
    views: Object.freeze(annotationViews(definition)),
  })
}))

export const DIALOG_FAMILIES = Object.freeze([
  Object.freeze({ name: 'Projektverständnis', states: Object.freeze([
    'Leer · noch ungeklärt', 'Ausgefüllter Stand', 'Geschützte Nutzerkorrektur',
    'Aktive Rückfrage · Interview', 'Offline · Wiederherstellung',
  ]) }),
  Object.freeze({ name: 'Quellen im Projekt', states: Object.freeze([
    'Leere Bibliothek', 'Gefüllte Quellenliste', 'Quellenimport', 'Validierungsfehler beim Import',
    'Quellenleser · Original verifiziert', 'Quelle nicht belastbar · neu prüfen', 'Recherche geplant',
    'Recherche läuft', 'Recherche pausiert', 'Recherche zur Prüfung bereit', 'Recherche fehlgeschlagen',
  ]) }),
  Object.freeze({ name: 'KI-Anschluss', states: Object.freeze([
    'Verbindung wird geprüft', 'Schlüssel fehlt', 'Schlüssel hinterlegt · Verbindung bereit',
    'Verbindungsfehler · Wiederholung oder Einrichtung', 'Monatsbudget normal', 'Monatsbudget erreicht',
    'Einzellauf bewusst freigegeben',
  ]) }),
  Object.freeze({ name: 'Projektgedächtnis', states: Object.freeze([
    'Deaktiviert', 'Leer', 'Gefüllt', 'Freigabe ausstehend', 'Export', 'Löschbestätigung',
    'Wiederaufbau', 'Fehler · Rückkehr möglich',
  ]) }),
  Object.freeze({ name: 'Argumentationsdossier', states: Object.freeze([
    'Noch nicht geprüft', 'Prüfung läuft', 'Gefülltes Dossier', 'Aussage einordnen',
    'Veraltet · Neuprüfung nötig', 'Fehler · Wiederholung',
  ]) }),
  Object.freeze({ name: 'Sprache & Wirkung', states: Object.freeze([
    'Ausgangslage', 'Sprachprofil', 'Ausgefüllte Analyse', 'Wirkungsvergleich',
    'Korrektur · erneute Prüfung', 'Fehler · Wiederholung',
  ]) }),
  Object.freeze({ name: 'Schlussaudit & Export', states: Object.freeze([
    'Export blockiert · offene Hinweise', 'Wissenschaftliche Risiken bewusst angenommen', 'Audit bereit',
    'Exportformat wählen', 'Datenkontrolle', 'Lokale Datenlöschung bestätigen',
  ]) }),
])

export const COMPONENT_DEFINITIONS = Object.freeze([
  Object.freeze({ id: 'button', name: 'Onda/Button', label: 'Button', tier: 0 }),
  Object.freeze({ id: 'icon-button', name: 'Onda/Icon Button', label: 'Icon Button', tier: 0 }),
  Object.freeze({ id: 'status-symbol', name: 'Onda/Status Symbol', label: 'Status Symbol', tier: 0 }),
  Object.freeze({ id: 'tag', name: 'Onda/Tag', label: 'Tag', tier: 0 }),
  Object.freeze({ id: 'field', name: 'Onda/Field', label: 'Field', tier: 1 }),
  Object.freeze({ id: 'menu-item', name: 'Onda/Menu Item', label: 'Menu Item', tier: 1 }),
  Object.freeze({ id: 'annotation-anchor', name: 'Onda/Annotation Anchor', label: 'Annotation Anchor', tier: 1 }),
  Object.freeze({ id: 'annotation-card', name: 'Onda/Annotation Card', label: 'Annotation Card', tier: 2 }),
  Object.freeze({ id: 'source-card', name: 'Onda/Source Card', label: 'Source Card', tier: 2 }),
  Object.freeze({ id: 'dialog', name: 'Onda/Dialog', label: 'Dialog', tier: 2 }),
])

const fixedSections = [
  Object.freeze({ name: '00 · Übersicht', kind: 'overview' }),
  Object.freeze({ name: '01 · Foundations', kind: 'foundations' }),
  Object.freeze({ name: '02 · Komponenten', kind: 'components' }),
  Object.freeze({ name: '03 · Bibliothek', kind: 'library' }),
  Object.freeze({ name: '04 · Editor', kind: 'editor' }),
]
const tailSections = [
  Object.freeze({ name: '07 · Agent & Quellen', kind: 'agent-sources' }),
  Object.freeze({ name: '08 · Dialoge', kind: 'dialogs' }),
  Object.freeze({ name: '09 · Menüs & Nebenansichten', kind: 'menus' }),
  Object.freeze({ name: '10 · Responsive & Dark', kind: 'responsive-dark' }),
  Object.freeze({ name: '11 · Prototyp', kind: 'prototype' }),
]

export const SECTION_DEFINITIONS = Object.freeze([
  ...fixedSections,
  ...ANNOTATION_SECTIONS.map(annotation => Object.freeze({
    name: annotation.sectionName,
    kind: 'annotation',
    annotationKind: annotation.kind,
  })),
  ...tailSections,
])

const componentCommands = COMPONENT_DEFINITIONS.map(component => Object.freeze({
  id: `component-${component.id}`,
  label: component.label,
  kind: 'component',
  componentId: component.id,
}))

export const PHASE_DEFINITIONS = Object.freeze([
  Object.freeze({ id: 'inspect', label: 'Inspect', commands: Object.freeze([{ id: 'inspect', label: 'Inspect', kind: 'read' }]) }),
  Object.freeze({ id: 'foundations', label: 'Foundations', commands: Object.freeze([{ id: 'foundations', label: 'Foundations erzeugen', kind: 'mutation' }]) }),
  Object.freeze({ id: 'components', label: 'Komponenten', commands: Object.freeze(componentCommands) }),
  Object.freeze({ id: 'core', label: 'Kernansichten', commands: Object.freeze([{ id: 'core-views', label: 'Kernansichten erzeugen', kind: 'mutation' }]) }),
  Object.freeze({ id: 'annotations', label: 'Annotation-Batches', commands: Object.freeze(Array.from({ length: 6 }, (_, index) => ({
    id: `annotations-${index + 1}`,
    label: `Batch ${index + 1}`,
    kind: 'annotation-batch',
    batchIndex: index,
  }))) }),
  Object.freeze({ id: 'dialogs', label: 'Dialoge & Nebenansichten', commands: Object.freeze([{ id: 'dialogs-and-secondary', label: 'Dialoge & Nebenansichten erzeugen', kind: 'mutation' }]) }),
  Object.freeze({ id: 'verify', label: 'Verify', commands: Object.freeze([{ id: 'verify', label: 'Verify', kind: 'read' }]) }),
])

export function annotationBatch(batchIndex) {
  const start = batchIndex * 5
  return ANNOTATION_SECTIONS.slice(start, start + 5)
}
