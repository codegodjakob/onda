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

export const SPACING_TOKENS = Object.freeze([4, 8, 12, 16, 24, 32, 40].map(value => Object.freeze({
  name: `spacing/${value}`,
  value,
})))

export const SEMANTIC_COLOR_ROLES = Object.freeze([
  Object.freeze({ name: 'color/background', light: 'gray/025', dark: 'gray/1000', scopes: Object.freeze(['FRAME_FILL', 'SHAPE_FILL']) }),
  Object.freeze({ name: 'color/surface', light: 'gray/000', dark: 'gray/900', scopes: Object.freeze(['FRAME_FILL', 'SHAPE_FILL']) }),
  Object.freeze({ name: 'color/text', light: 'gray/900', dark: 'gray/000', scopes: Object.freeze(['TEXT_FILL']) }),
  Object.freeze({ name: 'color/text-muted', light: 'gray/500', dark: 'gray/300', scopes: Object.freeze(['TEXT_FILL']) }),
  Object.freeze({ name: 'color/border', light: 'gray/200', dark: 'gray/700', scopes: Object.freeze(['STROKE_COLOR']) }),
  Object.freeze({ name: 'color/inverted', light: 'gray/900', dark: 'gray/000', scopes: Object.freeze(['FRAME_FILL', 'SHAPE_FILL']) }),
  Object.freeze({ name: 'color/on-inverted', light: 'gray/000', dark: 'gray/900', scopes: Object.freeze(['TEXT_FILL']) }),
])

export const TYPE_SCALE = Object.freeze([
  Object.freeze({ size: 12, lineHeight: 16 }),
  Object.freeze({ size: 15, lineHeight: 22 }),
  Object.freeze({ size: 21, lineHeight: 28 }),
  Object.freeze({ size: 40, lineHeight: 44 }),
])

export const TYPE_WEIGHTS = Object.freeze([400, 500, 700])

export const FOUNDATION_EXPECTATIONS = Object.freeze({
  collections: Object.freeze({
    'Onda · Primitive': Object.freeze({ mode: 'Value', variableCount: 10 }),
    'Onda · Dimension': Object.freeze({ mode: 'Value', variableCount: 12 }),
    'Onda · Semantic · Light': Object.freeze({ mode: 'Light', variableCount: 7 }),
    'Onda · Semantic · Dark': Object.freeze({ mode: 'Dark', variableCount: 7 }),
    'Onda · Typography': Object.freeze({ mode: 'Value', variableCount: 7 }),
  }),
  swatches: Object.freeze({ primitive: 10, semanticLight: 7, semanticDark: 7, bound: 24 }),
  spacingBars: Object.freeze({ total: 7, bound: 7 }),
  radiusSamples: Object.freeze({ total: 5, boundRectangles: 4, ellipses: 1 }),
  textStyles: Object.freeze([
    Object.freeze({ role: 'Display', name: 'Onda/Type/Display', size: 40, weight: 700, lineHeight: 44 }),
    Object.freeze({ role: 'Heading', name: 'Onda/Type/Heading', size: 21, weight: 700, lineHeight: 28 }),
    Object.freeze({ role: 'Body', name: 'Onda/Type/Body', size: 15, weight: 400, lineHeight: 22 }),
    Object.freeze({ role: 'Body Strong', name: 'Onda/Type/Body Strong', size: 15, weight: 700, lineHeight: 22 }),
    Object.freeze({ role: 'Caption', name: 'Onda/Type/Caption', size: 12, weight: 500, lineHeight: 16 }),
  ]),
  effectStyles: Object.freeze(['Onda/Shadow/Overlay']),
})

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

function componentRole(name, type) {
  return Object.freeze({ name, type })
}

function componentVariant(name, copy, options = {}) {
  const settings = typeof options === 'boolean' ? { inverted: options } : options
  const inverted = settings.inverted === true
  return Object.freeze({
    name,
    copy: Object.freeze({ ...copy }),
    surfaceToken: settings.surfaceToken || (inverted ? 'color/inverted' : 'color/surface'),
    textToken: settings.textToken || (inverted ? 'color/on-inverted' : 'color/text'),
    strokeWeight: settings.strokeWeight ?? (name.includes('Focus') ? 2 : 1),
    opacity: settings.opacity ?? (name.includes('Disabled') ? 0.45 : 1),
  })
}

function componentDefinition({
  id,
  name,
  label,
  roles,
  labelRole,
  variants,
  tier = 0,
  radius = 4,
  radiusToken = 'radius/control',
  targetHeight = 44,
  gap = 8,
  gapToken = 'spacing/8',
  padding = { top: 12, right: 16, bottom: 12, left: 16 },
  paddingTokens = { top: 'spacing/12', right: 'spacing/16', bottom: 'spacing/12', left: 'spacing/16' },
  direction = 'HORIZONTAL',
}) {
  return Object.freeze({
    id,
    name,
    label,
    tier,
    roles: Object.freeze(roles),
    labelRole,
    radius,
    radiusToken,
    targetHeight,
    gap,
    gapToken,
    padding: Object.freeze({ ...padding }),
    paddingTokens: Object.freeze({ ...paddingTokens }),
    direction,
    variants: Object.freeze(variants),
  })
}

export const COMPONENT_DEFINITIONS = Object.freeze([
  componentDefinition({
    id: 'button', name: 'Onda/Button', label: 'Button', labelRole: 'Label',
    roles: [componentRole('Icon', 'TEXT'), componentRole('Label', 'TEXT')],
    variants: [
      componentVariant('Kind=Primary, State=Default', { Icon: '→', Label: 'Weiter' }, true),
      componentVariant('Kind=Primary, State=Focus', { Icon: '◎', Label: 'Weiter' }, true),
      componentVariant('Kind=Secondary, State=Default', { Icon: '←', Label: 'Zurück' }),
      componentVariant('Kind=Secondary, State=Focus', { Icon: '◎', Label: 'Zurück' }),
      componentVariant('Kind=Ghost, State=Default', { Icon: '…', Label: 'Mehr anzeigen' }),
      componentVariant('Kind=Ghost, State=Focus', { Icon: '◎', Label: 'Mehr anzeigen' }),
      componentVariant('Kind=Destructive, State=Default', { Icon: '!', Label: 'Löschen' }, true),
      componentVariant('Kind=Destructive, State=Focus', { Icon: '!', Label: 'Löschen · Fokus' }, true),
    ],
  }),
  componentDefinition({
    id: 'icon-button', name: 'Onda/Icon Button', label: 'Icon Button', labelRole: 'Label',
    roles: [componentRole('Icon', 'TEXT'), componentRole('Label', 'TEXT'), componentRole('Description', 'TEXT')],
    variants: [
      componentVariant('State=Default', { Icon: '+', Label: 'Hinzufügen', Description: 'Bereit' }),
      componentVariant('State=Hover', { Icon: '+', Label: 'Hinzufügen', Description: 'Zeiger darüber' }),
      componentVariant('State=Focus', { Icon: '+', Label: 'Hinzufügen', Description: 'Tastaturfokus' }),
      componentVariant('State=Disabled', { Icon: '+', Label: 'Hinzufügen', Description: 'Nicht verfügbar' }),
      componentVariant('State=Pressed', { Icon: '+', Label: 'Hinzufügen', Description: 'Wird ausgelöst' }, true),
    ],
  }),
  componentDefinition({
    id: 'status-symbol', name: 'Onda/Status Symbol', label: 'Status Symbol', labelRole: 'Label',
    roles: [componentRole('Dot', 'ELLIPSE'), componentRole('Symbol', 'TEXT'), componentRole('Label', 'TEXT')],
    variants: [
      componentVariant('Status=Ready', { Symbol: '✓', Label: 'Bereit' }),
      componentVariant('Status=Working', { Symbol: '…', Label: 'Arbeitet' }),
      componentVariant('Status=Warning', { Symbol: '!', Label: 'Prüfen' }),
      componentVariant('Status=Error', { Symbol: '×', Label: 'Fehler' }),
    ],
  }),
  componentDefinition({
    id: 'tag', name: 'Onda/Tag', label: 'Tag', labelRole: 'Label',
    roles: [componentRole('Icon', 'TEXT'), componentRole('Label', 'TEXT')],
    variants: [
      componentVariant('Kind=Neutral', { Icon: '—', Label: 'Neutral' }),
      componentVariant('Kind=Selected', { Icon: '✓', Label: 'Ausgewählt' }, true),
      componentVariant('Kind=Source', { Icon: '§', Label: 'Quelle' }),
      componentVariant('Kind=Warning', { Icon: '!', Label: 'Prüfen' }),
    ],
  }),
  componentDefinition({
    id: 'field', name: 'Onda/Field', label: 'Field', labelRole: 'Label', tier: 1, direction: 'VERTICAL',
    roles: [componentRole('Label', 'TEXT'), componentRole('Input', 'TEXT'), componentRole('Hint', 'TEXT'), componentRole('Status', 'TEXT')],
    variants: [
      componentVariant('State=Empty', { Label: 'Arbeitstitel', Input: 'Arbeitstitel eingeben', Hint: 'Pflichtfeld', Status: '○ Leer' }),
      componentVariant('State=Filled', { Label: 'Arbeitstitel', Input: 'Die leise Architektur', Hint: 'Kann später geändert werden', Status: '✓ Ausgefüllt' }),
      componentVariant('State=Focus', { Label: 'Arbeitstitel', Input: 'Die leise Architektur bearbeiten', Hint: 'Eingabe aktiv', Status: '◎ Fokus' }, { strokeWeight: 2 }),
      componentVariant('State=Error', { Label: 'Arbeitstitel', Input: 'Kein Arbeitstitel', Hint: 'Arbeitstitel ist erforderlich', Status: '! Fehler' }, { strokeWeight: 2 }),
    ],
  }),
  componentDefinition({
    id: 'search', name: 'Onda/Search', label: 'Search', labelRole: 'Input', tier: 1,
    roles: [componentRole('Icon', 'TEXT'), componentRole('Input', 'TEXT'), componentRole('Clear', 'TEXT'), componentRole('Count', 'TEXT')],
    variants: [
      componentVariant('State=Empty', { Icon: '⌕', Input: 'Suche starten', Clear: '—', Count: '0 Treffer' }),
      componentVariant('State=Typing', { Icon: '⌕', Input: 'Argumentation', Clear: '× Löschen', Count: 'Suche läuft' }, { strokeWeight: 2 }),
      componentVariant('State=Results', { Icon: '⌕', Input: 'Argumentation', Clear: '× Löschen', Count: '12 Treffer' }),
      componentVariant('State=No Results', { Icon: '⌕', Input: 'Argumentation', Clear: '× Löschen', Count: '0 Treffer · Suchbegriff ändern' }, { strokeWeight: 2, textToken: 'color/text-muted' }),
    ],
  }),
  componentDefinition({
    id: 'select', name: 'Onda/Select', label: 'Select', labelRole: 'Label', tier: 1, direction: 'VERTICAL',
    roles: [componentRole('Label', 'TEXT'), componentRole('Value', 'TEXT'), componentRole('Chevron', 'TEXT'), componentRole('Status', 'TEXT')],
    variants: [
      componentVariant('State=Closed', { Label: 'Dokumenttyp', Value: 'Typ auswählen', Chevron: '⌄', Status: '○ Geschlossen' }),
      componentVariant('State=Open', { Label: 'Dokumenttyp', Value: 'Essay · Bericht · Notiz', Chevron: '⌃', Status: '◎ Offen' }, { strokeWeight: 2 }),
      componentVariant('State=Selected', { Label: 'Dokumenttyp', Value: 'Essay', Chevron: '⌄', Status: '✓ Ausgewählt' }, { inverted: true, strokeWeight: 2 }),
    ],
  }),
  componentDefinition({
    id: 'composer', name: 'Onda/Composer', label: 'Composer', labelRole: 'Input', tier: 1, direction: 'VERTICAL', targetHeight: 88,
    roles: [componentRole('Prompt', 'TEXT'), componentRole('Input', 'TEXT'), componentRole('Submit', 'TEXT'), componentRole('Status', 'TEXT')],
    variants: [
      componentVariant('State=Empty', { Prompt: 'Nachricht an den Agenten', Input: 'Frage oder Auftrag eingeben', Submit: 'Senden', Status: '○ Bereit' }),
      componentVariant('State=Draft', { Prompt: 'Nachricht an den Agenten', Input: 'Prüfe die Argumentation auf Beleglücken.', Submit: 'Senden', Status: '● Entwurf' }, { strokeWeight: 2 }),
      componentVariant('State=Sending', { Prompt: 'Nachricht an den Agenten', Input: 'Prüfe die Argumentation auf Beleglücken.', Submit: 'Senden', Status: '… Wird gesendet' }, { inverted: true, strokeWeight: 2 }),
      componentVariant('State=Error', { Prompt: 'Nachricht an den Agenten', Input: 'Prüfe die Argumentation auf Beleglücken.', Submit: 'Senden', Status: '! Fehler · Erneut versuchen' }, { strokeWeight: 2 }),
    ],
  }),
  componentDefinition({
    id: 'menu-item', name: 'Onda/Menu Item', label: 'Menu Item', labelRole: 'Label', tier: 1, radius: 0, radiusToken: 'radius/none',
    roles: [componentRole('Icon', 'TEXT'), componentRole('Label', 'TEXT'), componentRole('Shortcut', 'TEXT')],
    variants: [
      componentVariant('State=Default', { Icon: '§', Label: 'Quelle öffnen', Shortcut: '↵' }),
      componentVariant('State=Hover', { Icon: '→', Label: 'Quelle öffnen', Shortcut: '↵ Hover' }, { strokeWeight: 2 }),
      componentVariant('State=Selected', { Icon: '✓', Label: 'Quelle öffnen', Shortcut: '↵ Ausgewählt' }, { inverted: true, strokeWeight: 2 }),
      componentVariant('State=Disabled', { Icon: '×', Label: 'Quelle öffnen', Shortcut: 'Nicht verfügbar' }, { opacity: 0.45, textToken: 'color/text-muted' }),
    ],
  }),
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
