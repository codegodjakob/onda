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
  effectStyleName = null,
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
    effectStyleName,
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
  componentDefinition({
    id: 'nav-item', name: 'Onda/Nav Item', label: 'Nav Item', labelRole: 'Label', tier: 1,
    radius: 0, radiusToken: 'radius/none', gap: 12, gapToken: 'spacing/12',
    roles: [componentRole('Icon', 'TEXT'), componentRole('Label', 'TEXT'), componentRole('Count', 'TEXT'), componentRole('Status', 'TEXT')],
    variants: [
      componentVariant('State=Default', { Icon: '▤', Label: 'Dokumente', Count: '12', Status: 'Verfügbar' }),
      componentVariant('State=Active', { Icon: '●', Label: 'Dokumente', Count: '12', Status: 'Aktiv' }, { inverted: true, strokeWeight: 2 }),
      componentVariant('State=Hover', { Icon: '→', Label: 'Dokumente', Count: '12', Status: 'Bereit zum Öffnen' }, { strokeWeight: 2 }),
      componentVariant('State=Collapsed', { Icon: '▤', Label: 'Dokumente', Count: '12', Status: 'Eingeklappt' }, { opacity: 0.6, textToken: 'color/text-muted' }),
    ],
  }),
  componentDefinition({
    id: 'list-row', name: 'Onda/List Row', label: 'List Row', labelRole: 'Title', tier: 1,
    radius: 0, radiusToken: 'radius/none', targetHeight: 52, gap: 12, gapToken: 'spacing/12',
    roles: [componentRole('Leading', 'TEXT'), componentRole('Title', 'TEXT'), componentRole('Meta', 'TEXT'), componentRole('Status', 'TEXT'), componentRole('Action', 'TEXT')],
    variants: [
      componentVariant('State=Default', { Leading: '▤', Title: 'Projekt Nordstern', Meta: '3 Dokumente', Status: 'Zuletzt bearbeitet', Action: 'Öffnen' }),
      componentVariant('State=Selected', { Leading: '●', Title: 'Dokument: Die leise Architektur', Meta: 'Projekt Nordstern', Status: 'Ausgewählt', Action: 'Öffnen' }, { inverted: true, strokeWeight: 2 }),
      componentVariant('State=Hover', { Leading: '→', Title: 'Projekt Nordstern', Meta: '3 Dokumente', Status: 'Bereit', Action: 'Öffnen' }, { strokeWeight: 2 }),
      componentVariant('State=Trash', { Leading: '⌫', Title: 'Dokument: Alte Fassung', Meta: 'Papierkorb', Status: 'Wird gelöscht', Action: 'Endgültig löschen' }, { inverted: true, strokeWeight: 2 }),
      componentVariant('State=Error', { Leading: '!', Title: 'Dokument: Die leise Architektur', Meta: 'Änderungen nicht geladen', Status: 'Fehler', Action: 'Erneut versuchen' }, { strokeWeight: 2 }),
    ],
  }),
  componentDefinition({
    id: 'mode-toggle', name: 'Onda/Mode Toggle', label: 'Mode Toggle', labelRole: 'Text Label', tier: 1,
    roles: [componentRole('Text Label', 'TEXT'), componentRole('Note Label', 'TEXT'), componentRole('Indicator', 'TEXT')],
    variants: [
      componentVariant('Mode=Text, State=Active', { 'Text Label': 'Text', 'Note Label': 'Notiz', Indicator: 'Textmodus aktiv' }, { inverted: true, strokeWeight: 2 }),
      componentVariant('Mode=Notiz, State=Active', { 'Text Label': 'Text', 'Note Label': 'Notiz', Indicator: 'Notizmodus aktiv' }, { strokeWeight: 2 }),
      componentVariant('Mode=Text, State=Disabled', { 'Text Label': 'Text', 'Note Label': 'Notiz', Indicator: 'Textmodus deaktiviert' }, { opacity: 0.45, textToken: 'color/text-muted' }),
    ],
  }),
  componentDefinition({
    id: 'review-bar', name: 'Onda/Review Bar', label: 'Review Bar', labelRole: 'Message', tier: 1,
    radius: 0, radiusToken: 'radius/none', targetHeight: 64, gap: 12, gapToken: 'spacing/12',
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    paddingTokens: { top: 'spacing/16', right: 'spacing/16', bottom: 'spacing/16', left: 'spacing/16' },
    roles: [componentRole('Symbol', 'TEXT'), componentRole('Message', 'TEXT'), componentRole('Primary Action', 'TEXT'), componentRole('Secondary Action', 'TEXT')],
    variants: [
      componentVariant('Status=Open', { Symbol: '◎', Message: '3 Hinweise zur Prüfung', 'Primary Action': 'Nächster Hinweis', 'Secondary Action': 'Alle anzeigen' }),
      componentVariant('Status=Saving', { Symbol: '…', Message: 'Änderungen werden gespeichert …', 'Primary Action': 'Speichern', 'Secondary Action': 'Abbrechen' }, { strokeWeight: 2, opacity: 0.75 }),
      componentVariant('Status=Saved', { Symbol: '✓', Message: 'Änderungen gespeichert', 'Primary Action': 'Weiter prüfen', 'Secondary Action': 'Rückgängig' }, { inverted: true }),
      componentVariant('Status=Error', { Symbol: '!', Message: 'Speichern fehlgeschlagen', 'Primary Action': 'Erneut versuchen', 'Secondary Action': 'Exportieren' }, { inverted: true, strokeWeight: 2 }),
      componentVariant('Status=Quiet', { Symbol: '—', Message: 'Anmerkungen sind ruhig gestellt', 'Primary Action': 'Anmerkungen zeigen', 'Secondary Action': 'Schließen' }, { opacity: 0.6, textToken: 'color/text-muted' }),
    ],
  }),
  componentDefinition({
    id: 'empty-state', name: 'Onda/Empty State', label: 'Empty State', labelRole: 'Title', tier: 1,
    radius: 6, radiusToken: 'radius/static', targetHeight: 160, gap: 16, gapToken: 'spacing/16', direction: 'VERTICAL',
    padding: { top: 32, right: 32, bottom: 32, left: 32 },
    paddingTokens: { top: 'spacing/32', right: 'spacing/32', bottom: 'spacing/32', left: 'spacing/32' },
    roles: [componentRole('Symbol', 'TEXT'), componentRole('Title', 'TEXT'), componentRole('Description', 'TEXT'), componentRole('Action', 'TEXT')],
    variants: [
      componentVariant('Context=Library', { Symbol: '+', Title: 'Noch keine Projekte', Description: 'Erstelle ein Projekt, um Dokumente zu organisieren.', Action: 'Projekt erstellen' }),
      componentVariant('Context=No Active Annotation', { Symbol: '○', Title: 'Keine aktive Anmerkung', Description: 'Wähle eine Anmerkung im Text aus, um sie zu prüfen.', Action: 'Anmerkungen anzeigen' }, { opacity: 0.8, textToken: 'color/text-muted' }),
      componentVariant('Context=Recoverable Error', { Symbol: '!', Title: 'Inhalt konnte nicht geladen werden', Description: 'Deine Eingabe bleibt erhalten. Versuche es erneut.', Action: 'Erneut versuchen' }, { inverted: true, strokeWeight: 2 }),
    ],
  }),
  componentDefinition({
    id: 'annotation-anchor', name: 'Onda/Annotation Anchor', label: 'Annotation Anchor', labelRole: 'Label', tier: 2,
    roles: [componentRole('Symbol', 'TEXT'), componentRole('Label', 'TEXT'), componentRole('Count', 'TEXT')],
    variants: [
      componentVariant('Kind=Text, State=Idle', { Symbol: '¶', Label: 'Textanmerkungen', Count: '3 offen' }),
      componentVariant('Kind=Text, State=Active', { Symbol: '●', Label: 'Textanmerkungen', Count: '3 aktiv' }, { inverted: true, strokeWeight: 2 }),
      componentVariant('Kind=Note, State=Idle', { Symbol: '◇', Label: 'Notizen', Count: '2 offen' }),
      componentVariant('Kind=Note, State=Active', { Symbol: '●', Label: 'Notizen', Count: '2 aktiv' }, { inverted: true, strokeWeight: 2 }),
    ],
  }),
  componentDefinition({
    id: 'annotation-form', name: 'Onda/Annotation Form', label: 'Annotation Form', labelRole: 'Label', tier: 2,
    direction: 'VERTICAL', targetHeight: 180, gap: 12, gapToken: 'spacing/12',
    padding: { top: 24, right: 24, bottom: 24, left: 24 },
    paddingTokens: { top: 'spacing/24', right: 'spacing/24', bottom: 'spacing/24', left: 'spacing/24' },
    roles: [componentRole('Label', 'TEXT'), componentRole('Input', 'TEXT'), componentRole('Preview', 'TEXT'), componentRole('Primary Action', 'TEXT'), componentRole('Secondary Action', 'TEXT'), componentRole('Help', 'TEXT')],
    variants: [
      componentVariant('Form=Correction', { Label: 'Korrektur', Input: 'Originaltext ersetzen', Preview: 'Vorschau der Korrektur', 'Primary Action': 'Korrektur übernehmen', 'Secondary Action': 'Verwerfen', Help: 'Ersetzt nur die markierte Stelle.' }),
      componentVariant('Form=Rewrite', { Label: 'Neu formulieren', Input: 'Alternative Formulierung', Preview: 'Vorschau der Neufassung', 'Primary Action': 'Neufassung übernehmen', 'Secondary Action': 'Original behalten', Help: 'Ersetzt den markierten Textabschnitt.' }),
      componentVariant('Form=Insertion', { Label: 'Einfügung', Input: 'Ergänzenden Text eingeben', Preview: 'Einfügung an der markierten Stelle', 'Primary Action': 'Einfügen', 'Secondary Action': 'Abbrechen', Help: 'Fügt Text ein, ohne vorhandenen Text zu löschen.' }),
      componentVariant('Form=Slot', { Label: 'Position', Input: 'Zielposition wählen', Preview: 'Vorschau der neuen Reihenfolge', 'Primary Action': 'Verschieben', 'Secondary Action': 'Position behalten', Help: 'Verschiebt einen bestehenden Block.' }),
      componentVariant('Form=Region', { Label: 'Mehrere Stellen', Input: 'Betroffene Fundstellen prüfen', Preview: 'Vorschau aller Änderungen', 'Primary Action': 'Alle Änderungen übernehmen', 'Secondary Action': 'Einzeln prüfen', Help: 'Ändert mehrere markierte Stellen.' }),
      componentVariant('Form=Source', { Label: 'Quelle', Input: 'Fundstelle oder Quelle prüfen', Preview: 'Quelle wird am Hinweis verknüpft', 'Primary Action': 'Quelle verknüpfen', 'Secondary Action': 'Quelle öffnen', Help: 'Fundstelle erst nach Prüfung am Original übernehmen.' }),
      componentVariant('Form=Compare', { Label: 'Vergleich', Input: 'Varianten gegenüberstellen', Preview: 'Unterschiede prüfen', 'Primary Action': 'Variante übernehmen', 'Secondary Action': 'Zurück', Help: 'Übernimmt nur die ausgewählte Variante.' }),
      componentVariant('Form=Dialogue', { Label: 'Rückfrage', Input: 'Antwort eingeben', Preview: 'Antwort bleibt als Dialognotiz', 'Primary Action': 'Antwort senden', 'Secondary Action': 'Später', Help: 'Keine automatische Textänderung verfügbar.' }),
      componentVariant('Form=Title', { Label: 'Überschrift', Input: 'Neue Überschrift eingeben', Preview: 'Vorschau der Überschrift', 'Primary Action': 'Überschrift übernehmen', 'Secondary Action': 'Zurücksetzen', Help: 'Ersetzt ausschließlich den Titel.' }),
    ],
  }),
  componentDefinition({
    id: 'annotation-card', name: 'Onda/Annotation Card', label: 'Annotation Card', labelRole: 'Title', tier: 2,
    direction: 'VERTICAL', targetHeight: 220, radius: 8, radiusToken: 'radius/overlay', gap: 12, gapToken: 'spacing/12',
    padding: { top: 24, right: 24, bottom: 24, left: 24 },
    paddingTokens: { top: 'spacing/24', right: 'spacing/24', bottom: 'spacing/24', left: 'spacing/24' },
    effectStyleName: 'Onda/Shadow/Overlay',
    roles: [componentRole('Type', 'TEXT'), componentRole('Title', 'TEXT'), componentRole('Body', 'TEXT'), componentRole('Scope', 'TEXT'), componentRole('Primary Action', 'TEXT'), componentRole('Secondary Action', 'TEXT'), componentRole('Status', 'TEXT')],
    variants: [
      componentVariant('State=Open', { Type: 'Empfehlung', Title: 'Beleg fehlt', Body: 'Diese Aussage braucht eine überprüfbare Quelle.', Scope: 'Nur diesmal', 'Primary Action': 'Übernehmen', 'Secondary Action': 'Ablehnen', Status: 'Offen' }),
      componentVariant('State=Accepted', { Type: 'Korrektur', Title: 'Änderung übernommen', Body: 'Die Änderung wurde in den Text eingesetzt.', Scope: 'Nur diesmal', 'Primary Action': 'Rückgängig', 'Secondary Action': 'Schließen', Status: 'Übernommen' }, { inverted: true, strokeWeight: 2 }),
      componentVariant('State=Rejected', { Type: 'Hinweis', Title: 'Vorschlag abgelehnt', Body: 'Diese Regel gilt für den aktuellen Text nicht mehr.', Scope: 'Nicht mehr in diesem Text', 'Primary Action': 'Rückgängig', 'Secondary Action': 'Schließen', Status: 'Abgelehnt' }, { opacity: 0.7, textToken: 'color/text-muted' }),
      componentVariant('State=Error', { Type: 'Fehler', Title: 'Anmerkung konnte nicht aktualisiert werden', Body: 'Deine Eingabe bleibt erhalten.', Scope: 'Nie vorschlagen', 'Primary Action': 'Erneut versuchen', 'Secondary Action': 'Abbrechen', Status: 'Fehler' }, { inverted: true, strokeWeight: 2 }),
    ],
  }),
  componentDefinition({
    id: 'dialog-action', name: 'Onda/Dialog Action', label: 'Dialog Action', labelRole: 'Label', tier: 2,
    roles: [componentRole('Symbol', 'TEXT'), componentRole('Label', 'TEXT'), componentRole('Hint', 'TEXT')],
    variants: [
      componentVariant('Kind=Primary', { Symbol: '→', Label: 'Weiter', Hint: 'Primäre Aktion' }, { inverted: true }),
      componentVariant('Kind=Secondary', { Symbol: '←', Label: 'Zurück', Hint: 'Sekundäre Aktion' }),
      componentVariant('Kind=Destructive', { Symbol: '!', Label: 'Löschen', Hint: 'Kann nicht rückgängig gemacht werden' }, { inverted: true, strokeWeight: 2 }),
      componentVariant('Kind=Disabled', { Symbol: '×', Label: 'Weiter', Hint: 'Nicht verfügbar' }, { opacity: 0.45, textToken: 'color/text-muted' }),
    ],
  }),
  componentDefinition({
    id: 'dialog', name: 'Onda/Dialog', label: 'Dialog', labelRole: 'Title', tier: 2,
    direction: 'VERTICAL', targetHeight: 280, radius: 8, radiusToken: 'radius/overlay', gap: 16, gapToken: 'spacing/16',
    padding: { top: 24, right: 24, bottom: 24, left: 24 },
    paddingTokens: { top: 'spacing/24', right: 'spacing/24', bottom: 'spacing/24', left: 'spacing/24' },
    effectStyleName: 'Onda/Shadow/Overlay',
    roles: [componentRole('Eyebrow', 'TEXT'), componentRole('Title', 'TEXT'), componentRole('Body', 'TEXT'), componentRole('Status', 'TEXT'), componentRole('Primary Action', 'TEXT'), componentRole('Secondary Action', 'TEXT')],
    variants: [
      componentVariant('Kind=Standard', { Eyebrow: 'Dialog', Title: 'Einstellungen', Body: 'Passe die Ansicht für dieses Dokument an.', Status: 'Bereit', 'Primary Action': 'Speichern', 'Secondary Action': 'Abbrechen' }),
      componentVariant('Kind=Confirmation', { Eyebrow: 'Bestätigung', Title: 'Änderungen übernehmen?', Body: 'Die Änderungen werden lokal gespeichert.', Status: 'Bestätigung erforderlich', 'Primary Action': 'Übernehmen', 'Secondary Action': 'Zurück' }, { strokeWeight: 2 }),
      componentVariant('Kind=Destructive', { Eyebrow: 'Achtung', Title: 'Dokument löschen?', Body: 'Das Dokument wird dauerhaft aus der Bibliothek entfernt.', Status: 'Nicht rückgängig zu machen', 'Primary Action': 'Endgültig löschen', 'Secondary Action': 'Abbrechen' }, { inverted: true, strokeWeight: 2 }),
      componentVariant('State=Error', { Eyebrow: 'Fehler', Title: 'Speichern fehlgeschlagen', Body: 'Deine Eingabe bleibt erhalten.', Status: 'Erneut versuchen möglich', 'Primary Action': 'Erneut versuchen', 'Secondary Action': 'Abbrechen' }, { inverted: true, strokeWeight: 2 }),
      componentVariant('Size=Long', { Eyebrow: 'Information', Title: 'Datenkontrolle und Export', Body: 'Prüfe offene Hinweise, Datenumfang und Exportziel, bevor du fortfährst.', Status: 'Bitte vollständig lesen', 'Primary Action': 'Fortfahren', 'Secondary Action': 'Zurück' }),
    ],
  }),
  componentDefinition({
    id: 'aura', name: 'Onda/Aura', label: 'Aura', labelRole: 'Label', tier: 2,
    radius: 0, radiusToken: 'radius/none',
    roles: [componentRole('Orb', 'ELLIPSE'), componentRole('Symbol', 'TEXT'), componentRole('Label', 'TEXT')],
    variants: [
      componentVariant('State=Idle', { Symbol: '○', Label: 'Aura ist bereit' }),
      componentVariant('State=Working', { Symbol: '…', Label: 'Aura prüft den Auftrag' }, { strokeWeight: 2, opacity: 0.75 }),
      componentVariant('State=Complete', { Symbol: '✓', Label: 'Aura hat den Schritt abgeschlossen' }, { inverted: true }),
      componentVariant('State=Error', { Symbol: '!', Label: 'Aura konnte den Schritt nicht abschließen' }, { inverted: true, strokeWeight: 2 }),
    ],
  }),
  componentDefinition({
    id: 'agent-message', name: 'Onda/Agent Message', label: 'Agent Message', labelRole: 'Body', tier: 2,
    direction: 'VERTICAL', targetHeight: 120, radius: 6, radiusToken: 'radius/static', gap: 12, gapToken: 'spacing/12',
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    paddingTokens: { top: 'spacing/16', right: 'spacing/16', bottom: 'spacing/16', left: 'spacing/16' },
    roles: [componentRole('Avatar', 'ELLIPSE'), componentRole('Author', 'TEXT'), componentRole('Body', 'TEXT'), componentRole('Meta', 'TEXT'), componentRole('Status', 'TEXT')],
    variants: [
      componentVariant('Role=User', { Author: 'Du', Body: 'Prüfe die offenen Quellenhinweise.', Meta: 'Gerade gesendet', Status: 'Gesendet' }),
      componentVariant('Role=Agent', { Author: 'Onda Agent', Body: 'Drei Quellenhinweise warten auf deine Prüfung.', Meta: 'Antwort bereit', Status: 'Zur Prüfung' }, { inverted: true }),
      componentVariant('State=Streaming', { Author: 'Onda Agent', Body: 'Antwort wird schrittweise erstellt …', Meta: 'In Bearbeitung', Status: 'Wird geladen' }, { strokeWeight: 2, opacity: 0.75 }),
      componentVariant('State=Error', { Author: 'Onda Agent', Body: 'Antwort konnte nicht geladen werden. Deine Anfrage bleibt erhalten.', Meta: 'Verbindung unterbrochen', Status: 'Erneut versuchen' }, { inverted: true, strokeWeight: 2 }),
    ],
  }),
  componentDefinition({
    id: 'decision-card', name: 'Onda/Decision Card', label: 'Decision Card', labelRole: 'Decision', tier: 2,
    direction: 'VERTICAL', targetHeight: 140, radius: 6, radiusToken: 'radius/static', gap: 12, gapToken: 'spacing/12',
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    paddingTokens: { top: 'spacing/16', right: 'spacing/16', bottom: 'spacing/16', left: 'spacing/16' },
    roles: [componentRole('Symbol', 'TEXT'), componentRole('Decision', 'TEXT'), componentRole('Rationale', 'TEXT'), componentRole('Actor', 'TEXT'), componentRole('Time', 'TEXT')],
    variants: [
      componentVariant('Status=Pending', { Symbol: '?', Decision: 'Quellenhinweis prüfen', Rationale: 'Die Aussage ist noch nicht belegt.', Actor: 'Noch nicht entschieden', Time: 'Jetzt' }),
      componentVariant('Status=Accepted', { Symbol: '✓', Decision: 'Quellenhinweis übernehmen', Rationale: 'Der Beleg passt zur markierten Aussage.', Actor: 'Von dir bestätigt', Time: 'Gerade eben' }, { inverted: true }),
      componentVariant('Status=Rejected', { Symbol: '×', Decision: 'Quellenhinweis ablehnen', Rationale: 'Der Beleg stützt die Aussage nicht ausreichend.', Actor: 'Von dir abgelehnt', Time: 'Gerade eben' }, { strokeWeight: 2, opacity: 0.65, textToken: 'color/text-muted' }),
      componentVariant('Status=Overridden', { Symbol: '↺', Decision: 'Entscheidung überschrieben', Rationale: 'Eine neuere manuelle Entscheidung gilt.', Actor: 'Von dir geändert', Time: 'Soeben' }, { inverted: true, strokeWeight: 2 }),
    ],
  }),
  componentDefinition({
    id: 'evidence-card', name: 'Onda/Evidence Card', label: 'Evidence Card', labelRole: 'Claim', tier: 2,
    direction: 'VERTICAL', targetHeight: 140, radius: 6, radiusToken: 'radius/static', gap: 12, gapToken: 'spacing/12',
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    paddingTokens: { top: 'spacing/16', right: 'spacing/16', bottom: 'spacing/16', left: 'spacing/16' },
    roles: [componentRole('Symbol', 'TEXT'), componentRole('Claim', 'TEXT'), componentRole('Source', 'TEXT'), componentRole('Confidence', 'TEXT'), componentRole('Action', 'TEXT')],
    variants: [
      componentVariant('Status=Unverified', { Symbol: '?', Claim: 'Aussage ohne geprüften Beleg', Source: 'Quelle noch nicht geprüft', Confidence: 'Einschätzung: offen', Action: 'Quelle prüfen' }),
      componentVariant('Status=Verified', { Symbol: '✓', Claim: 'Aussage durch Quelle gestützt', Source: 'Fundstelle geprüft', Confidence: 'Einschätzung: hoch', Action: 'Quelle öffnen' }, { inverted: true }),
      componentVariant('Status=Conflict', { Symbol: '!', Claim: 'Quellen widersprechen sich', Source: 'Zwei abweichende Fundstellen', Confidence: 'Einschätzung: unklar', Action: 'Konflikt prüfen' }, { inverted: true, strokeWeight: 2 }),
      componentVariant('Status=Missing', { Symbol: '—', Claim: 'Kein Beleg verknüpft', Source: 'Quelle fehlt', Confidence: 'Nicht bewertbar', Action: 'Quelle hinzufügen' }, { opacity: 0.6, textToken: 'color/text-muted' }),
    ],
  }),
  componentDefinition({
    id: 'source-card', name: 'Onda/Source Card', label: 'Source Card', labelRole: 'Title', tier: 2,
    direction: 'VERTICAL', targetHeight: 120, radius: 6, radiusToken: 'radius/static', gap: 12, gapToken: 'spacing/12',
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    paddingTokens: { top: 'spacing/16', right: 'spacing/16', bottom: 'spacing/16', left: 'spacing/16' },
    roles: [componentRole('Type', 'TEXT'), componentRole('Title', 'TEXT'), componentRole('Meta', 'TEXT'), componentRole('Status', 'TEXT'), componentRole('Action', 'TEXT')],
    variants: [
      componentVariant('Status=Ready', { Type: 'Webquelle', Title: 'Studie zur Schreibforschung', Meta: 'Quelle bereit zur Prüfung', Status: 'Bereit', Action: 'Quelle öffnen' }),
      componentVariant('Status=Loading', { Type: 'Webquelle', Title: 'Quelle wird geladen', Meta: 'Metadaten werden angefragt', Status: 'Lädt', Action: 'Abbrechen' }, { strokeWeight: 2, opacity: 0.75 }),
      componentVariant('Status=Invalid', { Type: 'Ungültige Quelle', Title: 'Quelle kann nicht gelesen werden', Meta: 'Adresse oder Format prüfen', Status: 'Ungültig', Action: 'Andere Quelle wählen' }, { inverted: true, strokeWeight: 2 }),
      componentVariant('Status=Offline', { Type: 'Webquelle', Title: 'Quelle derzeit nicht erreichbar', Meta: 'Verbindung ist offline', Status: 'Offline', Action: 'Erneut versuchen' }, { opacity: 0.6, textToken: 'color/text-muted' }),
    ],
  }),
  componentDefinition({
    id: 'import-panel', name: 'Onda/Import Panel', label: 'Import Panel', labelRole: 'Title', tier: 2,
    direction: 'VERTICAL', targetHeight: 160, radius: 6, radiusToken: 'radius/static', gap: 12, gapToken: 'spacing/12',
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    paddingTokens: { top: 'spacing/16', right: 'spacing/16', bottom: 'spacing/16', left: 'spacing/16' },
    roles: [componentRole('Title', 'TEXT'), componentRole('File', 'TEXT'), componentRole('Progress', 'TEXT'), componentRole('Status', 'TEXT'), componentRole('Action', 'TEXT')],
    variants: [
      componentVariant('State=Empty', { Title: 'Quelle importieren', File: 'Noch keine Datei gewählt', Progress: '0 %', Status: 'Bereit', Action: 'Datei wählen' }),
      componentVariant('State=Validating', { Title: 'Import wird geprüft', File: 'recherche.pdf', Progress: 'Prüfung läuft …', Status: 'Datei wird validiert', Action: 'Abbrechen' }, { strokeWeight: 2, opacity: 0.75 }),
      componentVariant('State=Ready', { Title: 'Import bereit', File: 'recherche.pdf', Progress: '100 %', Status: 'Bereit zum Übernehmen', Action: 'Import übernehmen' }, { inverted: true }),
      componentVariant('State=Error', { Title: 'Import fehlgeschlagen', File: 'recherche.pdf', Progress: 'Prüfung abgebrochen', Status: 'Datei blieb unverändert', Action: 'Erneut versuchen' }, { inverted: true, strokeWeight: 2 }),
    ],
  }),
  componentDefinition({
    id: 'reader-panel', name: 'Onda/Reader Panel', label: 'Reader Panel', labelRole: 'Title', tier: 2,
    direction: 'VERTICAL', targetHeight: 180, radius: 6, radiusToken: 'radius/static', gap: 12, gapToken: 'spacing/12',
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    paddingTokens: { top: 'spacing/16', right: 'spacing/16', bottom: 'spacing/16', left: 'spacing/16' },
    roles: [componentRole('Title', 'TEXT'), componentRole('Location', 'TEXT'), componentRole('Excerpt', 'TEXT'), componentRole('Status', 'TEXT'), componentRole('Action', 'TEXT')],
    variants: [
      componentVariant('State=Reading', { Title: 'Quellenleser', Location: 'Seite 12', Excerpt: 'Die markierte Passage wird hier gelesen.', Status: 'Leseansicht', Action: 'Fundstelle markieren' }),
      componentVariant('State=Highlight', { Title: 'Markierte Fundstelle', Location: 'Seite 12 · Absatz 3', Excerpt: 'Diese Passage ist für die Aussage relevant.', Status: 'Zur Prüfung markiert', Action: 'Mit Anmerkung verknüpfen' }, { inverted: true }),
      componentVariant('State=Unavailable', { Title: 'Quelle nicht verfügbar', Location: 'Position gespeichert', Excerpt: 'Inhalt konnte nicht geladen werden.', Status: 'Offline oder Zugriff fehlt', Action: 'Erneut versuchen' }, { inverted: true, strokeWeight: 2 }),
    ],
  }),
  componentDefinition({
    id: 'research-card', name: 'Onda/Research Card', label: 'Research Card', labelRole: 'Query', tier: 2,
    direction: 'VERTICAL', targetHeight: 140, radius: 6, radiusToken: 'radius/static', gap: 12, gapToken: 'spacing/12',
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    paddingTokens: { top: 'spacing/16', right: 'spacing/16', bottom: 'spacing/16', left: 'spacing/16' },
    roles: [componentRole('Query', 'TEXT'), componentRole('Progress', 'TEXT'), componentRole('Sources', 'TEXT'), componentRole('Status', 'TEXT'), componentRole('Action', 'TEXT')],
    variants: [
      componentVariant('Status=Planned', { Query: 'Wirkung von Schreibassistenz', Progress: 'Noch nicht gestartet', Sources: '0 Quellen', Status: 'Geplant', Action: 'Recherche starten' }),
      componentVariant('Status=Running', { Query: 'Wirkung von Schreibassistenz', Progress: '2 von 5 Schritten', Sources: '3 Quellen vorgemerkt', Status: 'Läuft', Action: 'Pausieren' }, { strokeWeight: 2, opacity: 0.75 }),
      componentVariant('Status=Paused', { Query: 'Wirkung von Schreibassistenz', Progress: '2 von 5 Schritten', Sources: '3 Quellen vorgemerkt', Status: 'Pausiert', Action: 'Fortsetzen' }, { opacity: 0.65, textToken: 'color/text-muted' }),
      componentVariant('Status=Ready', { Query: 'Wirkung von Schreibassistenz', Progress: '5 von 5 Schritten', Sources: '6 Quellen zur Prüfung', Status: 'Bereit zur Prüfung', Action: 'Ergebnisse öffnen' }, { inverted: true }),
      componentVariant('Status=Error', { Query: 'Wirkung von Schreibassistenz', Progress: 'Recherche unterbrochen', Sources: 'Quellenstand nicht aktualisiert', Status: 'Verbindung fehlgeschlagen', Action: 'Erneut versuchen' }, { inverted: true, strokeWeight: 2 }),
    ],
  }),
])

export function componentRenderedHeight(definition) {
  if (!definition) return 0
  const roleHeights = definition.roles.map(role => role.type === 'ELLIPSE' || role.name === 'Description' ? 16 : 22)
  const contentHeight = definition.direction === 'VERTICAL'
    ? roleHeights.reduce((total, height) => total + height, 0) + Math.max(0, roleHeights.length - 1) * definition.gap
    : Math.max(0, ...roleHeights)
  return Math.max(definition.targetHeight, contentHeight + definition.padding.top + definition.padding.bottom)
}

export function estimateCoreTextWidth(characters, roleName = '') {
  const size = roleName === 'Description' ? 12 : 15
  return Math.ceil([...String(characters || '')].reduce((width, character) => {
    if (/\s/.test(character)) return width + size * .32
    if (/[ilI1.,:;!|'`]/.test(character)) return width + size * .3
    if (/[MW@%&]/.test(character)) return width + size * .82
    return width + size * .54
  }, 0))
}

export function componentMinimumWidth(definition, roleCopy = {}) {
  if (!definition) return 0
  const roleWidths = definition.roles.map(role => role.type === 'ELLIPSE' ? 16 : estimateCoreTextWidth(roleCopy[role.name], role.name))
  const contentWidth = definition.direction === 'VERTICAL'
    ? Math.max(0, ...roleWidths)
    : roleWidths.reduce((total, width) => total + width, 0) + Math.max(0, roleWidths.length - 1) * definition.gap
  return Math.ceil(contentWidth + definition.padding.left + definition.padding.right)
}

function coreRoleCopy(name, setId, variantName, label, overrides = {}) {
  const definition = COMPONENT_DEFINITIONS.find(component => component.id === setId)
  const variant = definition?.variants.find(item => item.name === variantName)
  const copy = Object.fromEntries((definition?.roles || []).filter(role => role.type === 'TEXT').map(role => [role.name, variant?.copy?.[role.name] || '']))
  if (definition?.labelRole) copy[definition.labelRole] = label
  if (setId === 'select') Object.assign(copy, { Label: 'Sortieren nach', Value: label })
  if (setId === 'list-row') Object.assign(copy, {
    Title: label,
    Meta: name.startsWith('Nutzer /') ? 'Persönlicher Arbeitsbereich' : name.startsWith('Verlauf /') ? 'Zuletzt bearbeitet · heute' : 'Calm Technology',
  })
  if (setId === 'nav-item') {
    const count = name.endsWith('Projekte') ? '1' : name.endsWith('Dokumente') ? '12' : name.endsWith('Papierkorb') ? '2' : '1'
    Object.assign(copy, { Label: label, Count: count })
    if (name === 'Navigation / Dokument') copy.Count = '1'
    if (variantName === 'State=Collapsed') Object.assign(copy, { Label: '', Count: '', Status: '' })
  }
  Object.assign(copy, overrides)
  for (const [role, characters] of Object.entries(copy)) copy[role] = String(characters).replaceAll('Projekt Nordstern', 'Calm Technology').replace(/\bEssay\b/g, 'Dokument')
  return Object.freeze(copy)
}

function coreInstance(name, setId, variant, label, options = {}) {
  const definition = COMPONENT_DEFINITIONS.find(component => component.id === setId)
  const roleCopy = coreRoleCopy(name, setId, variant, label, options.roleCopy)
  const minimumWidth = componentMinimumWidth(definition, roleCopy)
  const preferredWidths = { search: 520, select: 300, 'icon-button': 208, 'mode-toggle': 280, 'status-symbol': 200, button: 240 }
  return Object.freeze({
    name, setId, variant, label,
    region: options.region || null,
    roleCopy,
    expectedHeight: componentRenderedHeight(definition),
    minimumWidth,
    expectedWidth: Math.max(minimumWidth, options.width || preferredWidths[setId] || 0),
  })
}

function coreRegion(name, parentName, width, height, layoutMode, options = {}) {
  return Object.freeze({
    name, parentName, width, height, layoutMode,
    itemSpacing: options.itemSpacing ?? 16,
    padding: Object.freeze({ ...(options.padding || { top: 16, right: 16, bottom: 16, left: 16 }) }),
  })
}

function libraryRegions(viewName) {
  return Object.freeze([
    coreRegion('Layout / Rail', viewName, 360, 800, 'VERTICAL', { itemSpacing: 8, padding: { top: 24, right: 16, bottom: 24, left: 16 } }),
    coreRegion('Layout / Main', viewName, 1080, 800, 'VERTICAL', { itemSpacing: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } }),
    coreRegion('Layout / Header', 'Layout / Main', 1080, 168, 'VERTICAL', { itemSpacing: 8, padding: { top: 20, right: 32, bottom: 20, left: 32 } }),
    coreRegion('Layout / Toolbar', 'Layout / Main', 1080, 176, 'HORIZONTAL', { itemSpacing: 16, padding: { top: 20, right: 32, bottom: 20, left: 32 } }),
    coreRegion('Layout / Content', 'Layout / Main', 1080, 456, 'VERTICAL', { itemSpacing: 16, padding: { top: 24, right: 32, bottom: 24, left: 32 } }),
  ])
}

function editorRegions(viewName, compact = false) {
  const railWidth = compact ? 96 : 240
  const mainWidth = 1440 - railWidth
  const reviewWidth = 640
  return Object.freeze([
    coreRegion('Layout / Rail', viewName, railWidth, 800, 'VERTICAL', { itemSpacing: 8, padding: compact ? { top: 24, right: 8, bottom: 24, left: 8 } : { top: 24, right: 16, bottom: 24, left: 16 } }),
    coreRegion('Layout / Main', viewName, mainWidth, 800, 'VERTICAL', { itemSpacing: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } }),
    coreRegion('Layout / Toolbar', 'Layout / Main', mainWidth, 104, 'HORIZONTAL', { itemSpacing: 16, padding: { top: 20, right: 24, bottom: 20, left: 24 } }),
    coreRegion('Layout / Body', 'Layout / Main', mainWidth, 696, 'HORIZONTAL', { itemSpacing: 0, padding: { top: 0, right: 0, bottom: 0, left: 0 } }),
    coreRegion('Layout / Document', 'Layout / Body', mainWidth - reviewWidth, 696, 'VERTICAL', { itemSpacing: 12, padding: { top: 40, right: 48, bottom: 40, left: 48 } }),
    coreRegion('Layout / Review', 'Layout / Body', reviewWidth, 696, 'VERTICAL', { itemSpacing: 16, padding: { top: 24, right: 24, bottom: 24, left: 24 } }),
  ])
}

export const CORE_EDITOR_DOCUMENT_FIXTURE = Object.freeze({
  title: 'Calm Technology',
  blocks: Object.freeze([
    Object.freeze({ kind: 'paragraph', text: 'Calm Technology beschreibt Technik, die in der Peripherie bleibt und Aufmerksamkeit nur beansprucht, wenn sie wirklich gebraucht wird.' }),
    Object.freeze({ kind: 'heading', text: 'Prinzipien' }),
    Object.freeze({ kind: 'paragraph', text: 'Weiser und Brown formulierten: Technik soll sich an den Rändern der Aufmerksamkeit bewegen und nahtlos zwischen Zentrum und Peripherie wechseln.' }),
    Object.freeze({ kind: 'heading', text: 'Beispiele' }),
    Object.freeze({ kind: 'paragraph', text: 'Die Teekanne pfeift erst, wenn es relevant ist. Eine Statusleuchte informiert, ohne zu unterbrechen.' }),
    Object.freeze({ kind: 'heading', text: 'Übertragung aufs Schreiben' }),
    Object.freeze({ kind: 'paragraph', text: 'Für Schreibsoftware heißt das: Werkzeuge erscheinen im Kontext, Hinweise sammeln sich leise, nichts drängt sich in den Fluss.' }),
    Object.freeze({ kind: 'paragraph', text: 'Ruhige Technik ist kein Verzicht auf Funktionen, sondern eine Haltung: volle Kraft, leise Präsentation.' }),
  ]),
})

function libraryRailInstances(state) {
  const active = state.startsWith('Dokumente') || state.startsWith('Sortierung') ? 'Dokumente' : state.startsWith('Papierkorb') ? 'Papierkorb' : state.startsWith('Projekte') || state === 'Leerzustand' || state.startsWith('Fehler') ? 'Projekte' : ''
  const empty = state === 'Leerzustand'
  return [
    coreInstance('Navigation / Projekte', 'nav-item', active === 'Projekte' ? 'State=Active' : 'State=Default', 'Projekte', { region: 'Layout / Rail', roleCopy: empty ? { Count: '0' } : undefined }),
    coreInstance('Navigation / Dokumente', 'nav-item', active === 'Dokumente' ? 'State=Active' : 'State=Default', 'Dokumente', { region: 'Layout / Rail', roleCopy: empty ? { Count: '0' } : undefined }),
    coreInstance('Navigation / Papierkorb', 'nav-item', active === 'Papierkorb' ? 'State=Active' : 'State=Default', 'Papierkorb', { region: 'Layout / Rail', roleCopy: empty ? { Count: '0' } : undefined }),
    empty
      ? coreInstance('Verlauf / Leer', 'nav-item', 'State=Default', 'Noch kein Verlauf', { region: 'Layout / Rail', roleCopy: { Icon: '↺', Count: '0', Status: 'Leer' } })
      : coreInstance('Verlauf / Calm Technology', 'nav-item', 'State=Default', 'Calm Technology', { region: 'Layout / Rail', roleCopy: { Icon: '↺', Count: '1', Status: 'Verlauf' } }),
    coreInstance('Nutzer / Jakob', 'nav-item', 'State=Default', 'Jakob', { region: 'Layout / Rail', roleCopy: { Icon: '○', Count: '1', Status: 'Angemeldet' } }),
  ]
}

function coreRegionForInstance(section, setId) {
  if (setId === 'nav-item') return 'Layout / Rail'
  if (section === 'Bibliothek') return ['search', 'select'].includes(setId) ? 'Layout / Toolbar' : 'Layout / Content'
  return ['review-bar', 'annotation-anchor', 'empty-state'].includes(setId) ? 'Layout / Review' : 'Layout / Toolbar'
}

function coreView({ name, section, state, copy, instances }) {
  const regions = section === 'Bibliothek' ? libraryRegions(name) : editorRegions(name, ['Seitenleiste · Eingeklappt', 'Fokusmodus'].includes(state))
  const screenInstances = section === 'Bibliothek'
    ? [...libraryRailInstances(state), ...instances.filter(instance => instance.setId !== 'nav-item')]
    : instances
  const screenCopyContracts = Object.entries(copy).map(([role, characters]) => Object.freeze({
    role,
    characters,
    region: section === 'Bibliothek' ? 'Layout / Header' : ['title', 'body'].includes(role) ? 'Layout / Document' : 'Layout / Review',
  }))
  const documentCopyContracts = section === 'Editor' ? [
    Object.freeze({ role: 'document-title', characters: CORE_EDITOR_DOCUMENT_FIXTURE.title, region: 'Layout / Document', kind: 'title' }),
    ...CORE_EDITOR_DOCUMENT_FIXTURE.blocks.map((block, index) => Object.freeze({ role: `document-${index + 1}`, characters: block.text, region: 'Layout / Document', kind: block.kind })),
  ] : []
  const copyContracts = Object.freeze([...screenCopyContracts, ...documentCopyContracts])
  return Object.freeze({
    name,
    section,
    sectionName: section === 'Bibliothek' ? '03 · Bibliothek' : '04 · Editor',
    state,
    width: 1440,
    height: 800,
    radius: 0,
    layoutMode: 'HORIZONTAL',
    effects: Object.freeze([]),
    regions,
    copy: Object.freeze({ ...copy }),
    copyContracts,
    document: section === 'Editor' ? CORE_EDITOR_DOCUMENT_FIXTURE : null,
    reviewContext: section === 'Editor' ? Object.freeze({ state, relation: `${state} ↔ Calm Technology` }) : null,
    instances: Object.freeze(screenInstances.map(instance => Object.freeze({
      ...instance,
      region: instance.region || coreRegionForInstance(section, instance.setId),
    }))),
  })
}

export const CORE_OVERVIEW_DEFINITION = Object.freeze({
  name: 'Übersicht / Coverage',
  width: 1940,
  radius: 6,
  effects: Object.freeze([]),
  lines: Object.freeze([
    'Onda Write · Produktübersicht',
    'Bibliothek · 8 Produktansichten',
    'Editor · 10 Produktansichten',
    'Komponenten · 27 Component Sets',
  ]),
})

export const CORE_VIEW_DEFINITIONS = Object.freeze([
  coreView({
    name: 'Bibliothek / Projekte · Gefüllt', section: 'Bibliothek', state: 'Projekte · Gefüllt',
    copy: { title: 'Onda Write · Projekte', body: 'Projekt „Beispiel: Calm Technology“ mit 12 Dokumenten.', status: 'Projekte sind bereit.', action: 'Projekt öffnen' },
    instances: [
      coreInstance('Navigation / Projekte', 'nav-item', 'State=Active', 'Projekte'),
      coreInstance('Suche / Projekte', 'search', 'State=Empty', 'Projekte und Dokumente durchsuchen'),
      coreInstance('Sortierung / Projekte', 'select', 'State=Selected', 'Zuletzt bearbeitet'),
      coreInstance('Projekt / Calm Technology', 'list-row', 'State=Selected', 'Beispiel: Calm Technology'),
      coreInstance('Aktion / Projekt öffnen', 'button', 'Kind=Primary, State=Default', 'Projekt öffnen'),
    ],
  }),
  coreView({
    name: 'Bibliothek / Dokumente · Gefüllt', section: 'Bibliothek', state: 'Dokumente · Gefüllt',
    copy: { title: 'Onda Write · Dokumente', body: '„Beispiel: Calm Technology“ · 12 Dokumente, zuletzt „Die leise Architektur eines Arguments“.', status: 'Nach „Zuletzt bearbeitet“ sortiert.', action: 'Dokument öffnen' },
    instances: [
      coreInstance('Navigation / Dokumente', 'nav-item', 'State=Active', 'Dokumente'),
      coreInstance('Suche / Dokumente', 'search', 'State=Empty', 'Dokumente durchsuchen'),
      coreInstance('Sortierung / Dokumente', 'select', 'State=Selected', 'Zuletzt bearbeitet'),
      coreInstance('Dokument / Leise Architektur', 'list-row', 'State=Selected', 'Die leise Architektur eines Arguments'),
      coreInstance('Dokument / Quellen', 'list-row', 'State=Default', 'Quellen und Belege'),
    ],
  }),
  coreView({
    name: 'Bibliothek / Papierkorb · Gefüllt', section: 'Bibliothek', state: 'Papierkorb · Gefüllt',
    copy: { title: 'Onda Write · Papierkorb', body: 'Zwei Dokumente können wiederhergestellt oder bewusst endgültig gelöscht werden.', status: 'Papierkorb · 2 Dokumente', action: 'Auswahl wiederherstellen oder endgültig löschen' },
    instances: [
      coreInstance('Navigation / Papierkorb', 'nav-item', 'State=Active', 'Papierkorb'),
      coreInstance('Suche / Papierkorb', 'search', 'State=Empty', 'Papierkorb durchsuchen'),
      coreInstance('Sortierung / Papierkorb', 'select', 'State=Selected', 'Zuletzt bearbeitet'),
      coreInstance('Dokument / Alte Fassung', 'list-row', 'State=Trash', 'Alte Fassung'),
      coreInstance('Aktion / Wiederherstellen', 'button', 'Kind=Primary, State=Default', 'Wiederherstellen'),
      coreInstance('Aktion / Endgültig löschen', 'button', 'Kind=Destructive, State=Default', 'Endgültig löschen'),
    ],
  }),
  coreView({
    name: 'Bibliothek / Suche · Treffer', section: 'Bibliothek', state: 'Suche · Treffer',
    copy: { title: 'Onda Write · Suche', body: 'Suchbegriff „calm“ findet das Projekt „Beispiel: Calm Technology“.', status: '3 Treffer', action: 'Treffer öffnen' },
    instances: [
      coreInstance('Navigation / Suche', 'nav-item', 'State=Active', 'Suche'),
      coreInstance('Suche / Calm', 'search', 'State=Results', 'calm', { roleCopy: { Count: '3 Treffer' } }),
      coreInstance('Sortierung / Treffer', 'select', 'State=Selected', 'Zuletzt bearbeitet'),
      coreInstance('Treffer / Calm Technology', 'list-row', 'State=Selected', 'Beispiel: Calm Technology'),
      coreInstance('Status / Treffer', 'status-symbol', 'Status=Ready', '3 Treffer'),
    ],
  }),
  coreView({
    name: 'Bibliothek / Suche · Keine Treffer', section: 'Bibliothek', state: 'Suche · Keine Treffer',
    copy: { title: 'Onda Write · Suche', body: 'Für den Suchbegriff „unruhe“ wurden keine Projekte oder Dokumente gefunden.', status: 'Keine Treffer', action: 'Suche löschen' },
    instances: [
      coreInstance('Navigation / Suche', 'nav-item', 'State=Active', 'Suche'),
      coreInstance('Suche / Ohne Treffer', 'search', 'State=No Results', 'unruhe'),
      coreInstance('Sortierung / Ohne Treffer', 'select', 'State=Selected', 'Titel'),
      coreInstance('Leerzustand / Suche', 'empty-state', 'Context=Library', 'Keine Treffer', { roleCopy: { Symbol: '○', Description: 'Suchbegriff ändern', Action: 'Suche löschen' } }),
      coreInstance('Aktion / Suche löschen', 'button', 'Kind=Secondary, State=Default', 'Suche löschen'),
    ],
  }),
  coreView({
    name: 'Bibliothek / Sortierung · Menü offen', section: 'Bibliothek', state: 'Sortierung · Menü offen',
    copy: { title: 'Onda Write · Sortierung', body: 'Sortieroptionen: Zuletzt bearbeitet, Titel oder Erstellt.', status: 'Menü geöffnet', action: 'Sortierung auswählen' },
    instances: [
      coreInstance('Navigation / Dokumente', 'nav-item', 'State=Active', 'Dokumente'),
      coreInstance('Suche / Sortierung', 'search', 'State=Empty', 'Dokumente durchsuchen'),
      coreInstance('Sortierung / Geöffnet', 'select', 'State=Open', 'Sortierung geöffnet'),
      coreInstance('Option / Zuletzt bearbeitet', 'menu-item', 'State=Selected', 'Zuletzt bearbeitet'),
      coreInstance('Option / Titel', 'menu-item', 'State=Default', 'Titel'),
      coreInstance('Option / Erstellt', 'menu-item', 'State=Default', 'Erstellt'),
    ],
  }),
  coreView({
    name: 'Bibliothek / Leerzustand', section: 'Bibliothek', state: 'Leerzustand',
    copy: { title: 'Onda Write · Projekte', body: 'Noch keine Projekte. Ein neues Projekt bündelt Dokumente und Quellen.', status: 'Bibliothek ist leer', action: 'Projekt erstellen' },
    instances: [
      coreInstance('Navigation / Projekte', 'nav-item', 'State=Active', 'Projekte'),
      coreInstance('Leerzustand / Projekte', 'empty-state', 'Context=Library', 'Noch keine Projekte'),
      coreInstance('Aktion / Projekt erstellen', 'button', 'Kind=Primary, State=Default', 'Projekt erstellen'),
    ],
  }),
  coreView({
    name: 'Bibliothek / Fehler · Wiederholen', section: 'Bibliothek', state: 'Fehler · Wiederholen',
    copy: { title: 'Onda Write · Bibliothek', body: 'Projekte konnten nicht geladen werden. Sucheingabe und bereits sichtbare Daten bleiben erhalten.', status: 'Laden fehlgeschlagen', action: 'Erneut versuchen' },
    instances: [
      coreInstance('Navigation / Projekte', 'nav-item', 'State=Active', 'Projekte'),
      coreInstance('Fehler / Bibliothek', 'empty-state', 'Context=Recoverable Error', 'Projekte konnten nicht geladen werden'),
      coreInstance('Status / Fehler', 'status-symbol', 'Status=Error', 'Laden fehlgeschlagen'),
      coreInstance('Aktion / Wiederholen', 'button', 'Kind=Primary, State=Default', 'Erneut versuchen'),
    ],
  }),
  coreView({
    name: 'Editor / Textmodus · Bereit', section: 'Editor', state: 'Textmodus · Bereit',
    copy: { title: 'Onda Write · Textmodus', body: '„Die leise Architektur eines Arguments“ ist als Fließtext geöffnet.', status: 'Textmodus · Bereit', action: 'Text prüfen' },
    instances: [
      coreInstance('Navigation / Dokument', 'nav-item', 'State=Active', 'Dokument'),
      coreInstance('Modus / Text', 'mode-toggle', 'Mode=Text, State=Active', 'Text'),
      coreInstance('Anmerkungen / Text', 'annotation-anchor', 'Kind=Text, State=Idle', 'Textanmerkungen'),
      coreInstance('Aktion / Text prüfen', 'button', 'Kind=Primary, State=Default', 'Text prüfen'),
      coreInstance('Aktion / Hinzufügen', 'icon-button', 'State=Default', 'Hinzufügen'),
    ],
  }),
  coreView({
    name: 'Editor / Notizmodus · Bereit', section: 'Editor', state: 'Notizmodus · Bereit',
    copy: { title: 'Onda Write · Notizmodus', body: 'Notizen bleiben vom Dokumenttext getrennt und können gezielt ergänzt werden.', status: 'Notizmodus · Bereit', action: 'Notiz hinzufügen' },
    instances: [
      coreInstance('Navigation / Dokument', 'nav-item', 'State=Active', 'Dokument'),
      coreInstance('Modus / Notiz', 'mode-toggle', 'Mode=Notiz, State=Active', 'Text'),
      coreInstance('Anmerkungen / Notiz', 'annotation-anchor', 'Kind=Note, State=Active', 'Notizen'),
      coreInstance('Aktion / Notiz hinzufügen', 'button', 'Kind=Primary, State=Default', 'Notiz hinzufügen'),
      coreInstance('Aktion / Hinzufügen', 'icon-button', 'State=Default', 'Hinzufügen'),
    ],
  }),
  coreView({
    name: 'Editor / Review · Offen', section: 'Editor', state: 'Review · Offen',
    copy: { title: 'Onda Write · Review', body: 'Drei Hinweise warten auf eine bewusste redaktionelle Entscheidung.', status: 'Review offen · 3 Hinweise', action: 'Nächsten Hinweis prüfen' },
    instances: [
      coreInstance('Navigation / Dokument', 'nav-item', 'State=Active', 'Dokument'),
      coreInstance('Modus / Text', 'mode-toggle', 'Mode=Text, State=Active', 'Text'),
      coreInstance('Review / Offen', 'review-bar', 'Status=Open', '3 Hinweise zur Prüfung'),
      coreInstance('Anmerkungen / Aktiv', 'annotation-anchor', 'Kind=Text, State=Active', 'Textanmerkungen'),
      coreInstance('Aktion / Nächster Hinweis', 'button', 'Kind=Primary, State=Default', 'Nächsten Hinweis prüfen'),
    ],
  }),
  coreView({
    name: 'Editor / Ruhig · Anmerkungen verborgen', section: 'Editor', state: 'Ruhig · Anmerkungen verborgen',
    copy: { title: 'Onda Write · Ruhiger Modus', body: 'Anmerkungen sind nur verborgen; der Text und alle Entscheidungen bleiben erhalten.', status: 'Anmerkungen verborgen', action: 'Anmerkungen wieder anzeigen' },
    instances: [
      coreInstance('Navigation / Dokument', 'nav-item', 'State=Active', 'Dokument'),
      coreInstance('Modus / Text', 'mode-toggle', 'Mode=Text, State=Active', 'Text'),
      coreInstance('Review / Ruhig', 'review-bar', 'Status=Quiet', 'Anmerkungen sind verborgen'),
      coreInstance('Anmerkungen / Verborgen', 'annotation-anchor', 'Kind=Text, State=Idle', 'Textanmerkungen'),
      coreInstance('Aktion / Anmerkungen zeigen', 'button', 'Kind=Secondary, State=Default', 'Anmerkungen wieder anzeigen'),
    ],
  }),
  coreView({
    name: 'Editor / Seitenleiste · Eingeklappt', section: 'Editor', state: 'Seitenleiste · Eingeklappt',
    copy: { title: 'Onda Write · Editor', body: 'Die linke Navigation ist eingeklappt und die Schreibfläche bleibt vollständig nutzbar.', status: 'Seitenleiste eingeklappt', action: 'Seitenleiste öffnen' },
    instances: [
      coreInstance('Navigation / Eingeklappt', 'nav-item', 'State=Collapsed', ''),
      coreInstance('Modus / Text', 'mode-toggle', 'Mode=Text, State=Active', 'Text'),
      coreInstance('Anmerkungen / Text', 'annotation-anchor', 'Kind=Text, State=Idle', 'Textanmerkungen'),
      coreInstance('Aktion / Seitenleiste öffnen', 'icon-button', 'State=Default', 'Seitenleiste öffnen', { roleCopy: { Icon: '☰' } }),
    ],
  }),
  coreView({
    name: 'Editor / Fokusmodus', section: 'Editor', state: 'Fokusmodus',
    copy: { title: 'Onda Write · Fokusmodus', body: 'Navigation und Hinweise treten zurück, damit die breite Schreibfläche im Mittelpunkt steht.', status: 'Fokusmodus aktiv', action: 'Fokusmodus verlassen' },
    instances: [
      coreInstance('Navigation / Eingeklappt', 'nav-item', 'State=Collapsed', ''),
      coreInstance('Modus / Text', 'mode-toggle', 'Mode=Text, State=Active', 'Text'),
      coreInstance('Anmerkungen / Ruhig', 'annotation-anchor', 'Kind=Text, State=Idle', 'Textanmerkungen'),
      coreInstance('Aktion / Fokus verlassen', 'button', 'Kind=Secondary, State=Default', 'Fokusmodus verlassen'),
    ],
  }),
  coreView({
    name: 'Editor / Speichern · Läuft', section: 'Editor', state: 'Speichern · Läuft',
    copy: { title: 'Onda Write · Speichern', body: 'Die aktuelle Fassung wird gespeichert; der Inhalt bleibt währenddessen sichtbar.', status: 'Speichern läuft …', action: 'Weiter schreiben' },
    instances: [
      coreInstance('Navigation / Dokument', 'nav-item', 'State=Active', 'Dokument'),
      coreInstance('Modus / Text', 'mode-toggle', 'Mode=Text, State=Active', 'Text'),
      coreInstance('Review / Speichern', 'review-bar', 'Status=Saving', 'Änderungen werden gespeichert …'),
      coreInstance('Status / Speichern', 'status-symbol', 'Status=Working', 'Speichert'),
      coreInstance('Aktion / Weiter schreiben', 'button', 'Kind=Secondary, State=Default', 'Weiter schreiben'),
    ],
  }),
  coreView({
    name: 'Editor / Speichern · Gespeichert', section: 'Editor', state: 'Speichern · Gespeichert',
    copy: { title: 'Onda Write · Gespeichert', body: 'Die aktuelle Fassung wurde gespeichert.', status: 'Gespeichert', action: 'Weiter schreiben' },
    instances: [
      coreInstance('Navigation / Dokument', 'nav-item', 'State=Active', 'Dokument'),
      coreInstance('Modus / Text', 'mode-toggle', 'Mode=Text, State=Active', 'Text'),
      coreInstance('Review / Gespeichert', 'review-bar', 'Status=Saved', 'Änderungen gespeichert'),
      coreInstance('Status / Gespeichert', 'status-symbol', 'Status=Ready', 'Gespeichert'),
      coreInstance('Aktion / Weiter schreiben', 'button', 'Kind=Secondary, State=Default', 'Weiter schreiben'),
    ],
  }),
  coreView({
    name: 'Editor / Speichern · Fehler', section: 'Editor', state: 'Speichern · Fehler',
    copy: { title: 'Onda Write · Speichern', body: 'Speichern ist fehlgeschlagen. Der Inhalt bleibt lokal sichtbar und erhalten.', status: 'Speichern fehlgeschlagen', action: 'Erneut versuchen' },
    instances: [
      coreInstance('Navigation / Dokument', 'nav-item', 'State=Active', 'Dokument'),
      coreInstance('Modus / Text', 'mode-toggle', 'Mode=Text, State=Active', 'Text'),
      coreInstance('Review / Fehler', 'review-bar', 'Status=Error', 'Speichern fehlgeschlagen'),
      coreInstance('Status / Fehler', 'status-symbol', 'Status=Error', 'Speichern fehlgeschlagen'),
      coreInstance('Aktion / Wiederholen', 'button', 'Kind=Primary, State=Default', 'Erneut versuchen'),
    ],
  }),
  coreView({
    name: 'Editor / Keine aktive Anmerkung', section: 'Editor', state: 'Keine aktive Anmerkung',
    copy: { title: 'Onda Write · Editor', body: 'Keine Anmerkung ist ausgewählt. Der Dokumenttext bleibt bearbeitbar.', status: 'Keine aktive Anmerkung', action: 'Anmerkungen anzeigen' },
    instances: [
      coreInstance('Navigation / Dokument', 'nav-item', 'State=Active', 'Dokument'),
      coreInstance('Modus / Text', 'mode-toggle', 'Mode=Text, State=Active', 'Text'),
      coreInstance('Leerzustand / Anmerkung', 'empty-state', 'Context=No Active Annotation', 'Keine aktive Anmerkung'),
      coreInstance('Anmerkungen / Text', 'annotation-anchor', 'Kind=Text, State=Idle', 'Textanmerkungen'),
      coreInstance('Aktion / Anmerkungen zeigen', 'button', 'Kind=Secondary, State=Default', 'Anmerkungen anzeigen'),
    ],
  }),
])

export function validateCoreRoleCopySemantics(views = CORE_VIEW_DEFINITIONS) {
  const errors = []
  let checked = 0
  for (const view of views) for (const instance of view.instances || []) {
    checked += 1
    const component = COMPONENT_DEFINITIONS.find(item => item.id === instance.setId)
    const textRoles = (component?.roles || []).filter(role => role.type === 'TEXT').map(role => role.name).sort()
    const actualRoles = Object.keys(instance.roleCopy || {}).sort()
    if (JSON.stringify(textRoles) !== JSON.stringify(actualRoles)) errors.push(`${view.name}/${instance.name}: unvollständige Textrollen`)
    const collapsed = instance.setId === 'nav-item' && instance.variant === 'State=Collapsed'
    for (const [role, characters] of Object.entries(instance.roleCopy || {})) {
      if (!collapsed && !characters) errors.push(`${view.name}/${instance.name}/${role}: leere sichtbare Rolle`)
      if (/Projekt Nordstern|\bEssay\b|Generisch|12 Treffer/.test(characters)) errors.push(`${view.name}/${instance.name}/${role}: generische oder widersprüchliche Copy`)
    }
    if (!collapsed && component?.labelRole && instance.setId !== 'select' && instance.roleCopy?.[component.labelRole] !== instance.label) errors.push(`${view.name}/${instance.name}: Label stimmt nicht mit Screen-Vertrag überein`)
    if (instance.setId === 'select' && instance.roleCopy?.Value !== instance.label) errors.push(`${view.name}/${instance.name}: Select-Wert stimmt nicht mit Screen-Vertrag überein`)
  }
  const results = views.find(view => view.name === 'Bibliothek / Suche · Treffer')?.instances.find(instance => instance.setId === 'search')
  if (results?.roleCopy?.Count !== '3 Treffer') errors.push('Bibliothek / Suche · Treffer: Count muss exakt 3 Treffer sein')
  const noResults = views.find(view => view.name === 'Bibliothek / Suche · Keine Treffer')
  const empty = noResults?.instances.find(instance => instance.setId === 'empty-state')
  if (JSON.stringify(empty?.roleCopy) !== JSON.stringify({ Symbol: '○', Title: 'Keine Treffer', Description: 'Suchbegriff ändern', Action: 'Suche löschen' })) errors.push('Bibliothek / Suche · Keine Treffer: Empty-State-Copy widersprüchlich')
  const emptyLibrary = views.find(view => view.name === 'Bibliothek / Leerzustand')
  for (const name of ['Navigation / Projekte', 'Navigation / Dokumente', 'Navigation / Papierkorb']) {
    if (emptyLibrary?.instances.find(instance => instance.name === name)?.roleCopy?.Count !== '0') errors.push(`Bibliothek / Leerzustand: ${name} muss Count 0 zeigen`)
  }
  const emptyHistory = emptyLibrary?.instances.find(instance => instance.region === 'Layout / Rail' && instance.name.startsWith('Verlauf /'))
  if (emptyHistory?.name !== 'Verlauf / Leer'
    || JSON.stringify(emptyHistory.roleCopy) !== JSON.stringify({ Icon: '↺', Label: 'Noch kein Verlauf', Count: '0', Status: 'Leer' })) errors.push('Bibliothek / Leerzustand: Verlauf muss ehrlich leer sein')
  const collapsedEditor = views.find(view => view.name === 'Editor / Seitenleiste · Eingeklappt')
  if (collapsedEditor?.instances.find(instance => instance.name === 'Aktion / Seitenleiste öffnen')?.roleCopy?.Icon !== '☰') errors.push('Editor / Seitenleiste · Eingeklappt: Sidebar-Öffnen-Icon muss semantisch sein')
  return { valid: errors.length === 0, errors, checked }
}

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
