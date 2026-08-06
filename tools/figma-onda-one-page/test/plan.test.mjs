import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const definitionsPath = resolve(ROOT, 'src/definitions.mjs')
const planPath = resolve(ROOT, 'src/plan.mjs')

async function loadModules() {
  assert.ok(existsSync(definitionsPath), 'src/definitions.mjs must exist')
  assert.ok(existsSync(planPath), 'src/plan.mjs must exist')
  return Promise.all([
    import(pathToFileURL(definitionsPath)),
    import(pathToFileURL(planPath)),
  ])
}

test('the plan defines exactly the required 39 deterministic top-level sections', async () => {
  const [{ SECTION_DEFINITIONS }, { buildDesignPlan, validateDesignPlan }] = await loadModules()
  const expected = [
    '00 · Übersicht',
    '01 · Foundations',
    '02 · Komponenten',
    '03 · Bibliothek',
    '04 · Editor',
    '05.01 · Rechtschreibung',
    '05.02 · Grammatik',
    '05.03 · Zeichensetzung',
    '05.04 · Wortwahl',
    '05.05 · Satzstil',
    '05.06 · Absatzstil',
    '05.07 · Straffen',
    '05.08 · Wiederholung',
    '05.09 · Ton & Register',
    '05.10 · Stilmittel',
    '05.11 · Anglizismus',
    '05.12 · Terminologie',
    '05.13 · Verschieben',
    '05.14 · Übergang',
    '05.15 · Gliederung',
    '05.16 · Textfluss',
    '05.17 · Roter Faden',
    '05.18 · Überschrift',
    '05.19 · Anmerkung',
    '05.20 · Beleg fehlt',
    '05.21 · Faktencheck',
    '05.22 · Widerspruch',
    '05.23 · Gegenargument fehlt',
    '05.24 · Verständlichkeit',
    '06.01 · Ausformulieren',
    '06.02 · Gehört zusammen',
    '06.03 · Nachfrage',
    '06.04 · Reihenfolge',
    '06.05 · Offener Faden',
    '07 · Agent & Quellen',
    '08 · Dialoge',
    '09 · Menüs & Nebenansichten',
    '10 · Responsive & Dark',
    '11 · Prototyp',
  ]

  assert.deepEqual(SECTION_DEFINITIONS.map(section => section.name), expected)
  assert.equal(new Set(expected).size, 39)
  assert.deepEqual(validateDesignPlan(buildDesignPlan()), [])
})

test('all annotation definitions match the production contract and expose six honest views', async () => {
  const [definitions] = await loadModules()
  const contract = await import('../../../app/src/annotation-contract.mjs')
  const planned = definitions.ANNOTATION_SECTIONS

  assert.deepEqual(planned.map(item => item.kind), [...contract.ALL_ANNOTATION_KINDS])
  assert.deepEqual(planned.map(item => item.label), contract.ALL_ANNOTATION_KINDS.map(kind => contract.ANNOTATION_DEFINITIONS[kind].label))
  assert.deepEqual(definitions.ANNOTATION_VIEW_NAMES, [
    'Open',
    'Accept · Undo',
    'Reject · Scope',
    'Error · Retry',
    'Responsive · 320 px',
    'Dark',
  ])

  for (const annotation of planned) {
    assert.equal(annotation.views.length, 6, annotation.label)
    assert.deepEqual(annotation.views.map(view => view.name), definitions.ANNOTATION_VIEW_NAMES)
    const accept = annotation.views.find(view => view.name === 'Accept · Undo')
    if (contract.ANNOTATION_DEFINITIONS[annotation.kind].operation) {
      assert.match(accept.detail, /Übernehmen.*Rückgängig/)
    } else {
      assert.match(accept.detail, /Nicht verfügbar.*keine automatische Textoperation/)
    }
  }
})

test('dialog families provide every approved, exactly named state', async () => {
  const [{ DIALOG_FAMILIES }] = await loadModules()
  assert.deepEqual(Object.fromEntries(DIALOG_FAMILIES.map(dialog => [dialog.name, [...dialog.states]])), {
    'Projektverständnis': [
      'Leer · noch ungeklärt',
      'Ausgefüllter Stand',
      'Geschützte Nutzerkorrektur',
      'Aktive Rückfrage · Interview',
      'Offline · Wiederherstellung',
    ],
    'Quellen im Projekt': [
      'Leere Bibliothek',
      'Gefüllte Quellenliste',
      'Quellenimport',
      'Validierungsfehler beim Import',
      'Quellenleser · Original verifiziert',
      'Quelle nicht belastbar · neu prüfen',
      'Recherche geplant',
      'Recherche läuft',
      'Recherche pausiert',
      'Recherche zur Prüfung bereit',
      'Recherche fehlgeschlagen',
    ],
    'KI-Anschluss': [
      'Verbindung wird geprüft',
      'Schlüssel fehlt',
      'Schlüssel hinterlegt · Verbindung bereit',
      'Verbindungsfehler · Wiederholung oder Einrichtung',
      'Monatsbudget normal',
      'Monatsbudget erreicht',
      'Einzellauf bewusst freigegeben',
    ],
    'Projektgedächtnis': [
      'Deaktiviert',
      'Leer',
      'Gefüllt',
      'Freigabe ausstehend',
      'Export',
      'Löschbestätigung',
      'Wiederaufbau',
      'Fehler · Rückkehr möglich',
    ],
    'Argumentationsdossier': [
      'Noch nicht geprüft',
      'Prüfung läuft',
      'Gefülltes Dossier',
      'Aussage einordnen',
      'Veraltet · Neuprüfung nötig',
      'Fehler · Wiederholung',
    ],
    'Sprache & Wirkung': [
      'Ausgangslage',
      'Sprachprofil',
      'Ausgefüllte Analyse',
      'Wirkungsvergleich',
      'Korrektur · erneute Prüfung',
      'Fehler · Wiederholung',
    ],
    'Schlussaudit & Export': [
      'Export blockiert · offene Hinweise',
      'Wissenschaftliche Risiken bewusst angenommen',
      'Audit bereit',
      'Exportformat wählen',
      'Datenkontrolle',
      'Lokale Datenlöschung bestätigen',
    ],
  })
})

test('palette is grayscale and radii are restricted with 999 reserved for circles', async () => {
  const [{ PALETTE, RADIUS_TOKENS }, { isGrayColor, isValidRadius }] = await loadModules()
  for (const [name, color] of Object.entries(PALETTE)) {
    assert.equal(isGrayColor(color), true, name)
  }
  assert.deepEqual(RADIUS_TOKENS.map(token => token.value), [0, 4, 6, 8, 999])
  for (const token of RADIUS_TOKENS) {
    assert.equal(isValidRadius(token.value, token.geometry), true, token.name)
  }
  assert.equal(isValidRadius(999, 'RECTANGLE'), false)
  assert.equal(isValidRadius(10, 'RECTANGLE'), false)
})

test('origin is rounded rightward once and a persisted origin always wins', async () => {
  const [, { computeOndaOrigin }] = await loadModules()
  const children = [
    { x: -200, width: 100 },
    { x: 1425, width: 775 },
    { x: 100, width: 80 },
  ]
  assert.equal(computeOndaOrigin(children), 4200)
  assert.equal(computeOndaOrigin([{ x: 99999, width: 1 }], 4200), 4200)
  assert.equal(computeOndaOrigin([], undefined), 2000)
})

test('ownership guard reuses only Onda-owned nodes and filters only direct Onda page siblings', async () => {
  const [, { canReuseOwnedNode, protectedChildIds }] = await loadModules()
  const baselineIds = new Set(['foreign-frame', 'foreign-child'])
  assert.equal(canReuseOwnedNode({ id: 'onda', owner: 'onda-one-page' }, baselineIds), true)
  assert.equal(canReuseOwnedNode({ id: 'foreign-frame', owner: '' }, baselineIds), false)
  assert.deepEqual(protectedChildIds({
    nodeType: 'PAGE',
    children: [
      { id: 'foreign-frame', owner: '' },
      { id: 'onda', owner: 'onda-one-page' },
      { id: 'new-foreign', owner: '' },
    ],
    baselineIds,
  }), ['foreign-frame', 'new-foreign'])
  assert.deepEqual(protectedChildIds({
    nodeType: 'FRAME',
    children: [
      { id: 'foreign-child', owner: '' },
      { id: 'unexpected-new-child', owner: 'onda-one-page' },
    ],
    baselineIds,
  }), ['foreign-child', 'unexpected-new-child'])
})

test('target guard pins mutations to Claude Code Page 1 and prefers the exact file key', async () => {
  const [{ TARGET_DOCUMENT_NAME, TARGET_FILE_KEY, TARGET_PAGE_NAME }, { validateTargetContext }] = await loadModules()
  assert.equal(TARGET_FILE_KEY, '0DbO0vK6shrVU2qkmWSxIp')
  assert.equal(TARGET_DOCUMENT_NAME, 'Claude Code')
  assert.equal(TARGET_PAGE_NAME, 'Page 1')
  assert.deepEqual(validateTargetContext({
    fileKey: TARGET_FILE_KEY,
    documentName: 'Anything',
    pageName: TARGET_PAGE_NAME,
  }), { ok: true, fallback: false, warning: '' })
  assert.equal(validateTargetContext({
    fileKey: 'wrong',
    documentName: TARGET_DOCUMENT_NAME,
    pageName: TARGET_PAGE_NAME,
  }).ok, false)
  assert.deepEqual(validateTargetContext({
    fileKey: undefined,
    documentName: TARGET_DOCUMENT_NAME,
    pageName: TARGET_PAGE_NAME,
  }), {
    ok: true,
    fallback: true,
    warning: 'Dateischlüssel nicht verfügbar; Ziel über „Claude Code“ und „Page 1“ geprüft.',
  })
  assert.equal(validateTargetContext({
    fileKey: undefined,
    documentName: 'Other',
    pageName: TARGET_PAGE_NAME,
  }).ok, false)
})

test('workflow has no all-in-one mutation and exposes inspect, individual components, six annotation batches, and verify', async () => {
  const [{ PHASE_DEFINITIONS, COMPONENT_DEFINITIONS }] = await loadModules()
  const commands = PHASE_DEFINITIONS.flatMap(phase => phase.commands)
  assert.equal(commands.some(command => /all|alles|generate-all/i.test(command.id)), false)
  assert.equal(commands[0].id, 'inspect')
  assert.equal(commands.at(-1).id, 'verify')
  assert.equal(commands.filter(command => command.kind === 'component').length, COMPONENT_DEFINITIONS.length)
  assert.deepEqual(commands.filter(command => command.kind === 'annotation-batch').map(command => command.id), [
    'annotations-1',
    'annotations-2',
    'annotations-3',
    'annotations-4',
    'annotations-5',
    'annotations-6',
  ])
})

test('verification reports every required structural metric', async () => {
  const [{ SECTION_DEFINITIONS, ANNOTATION_SECTIONS, DIALOG_FAMILIES }, { buildVerificationReport }] = await loadModules()
  const snapshot = {
    pageCount: 1,
    sectionNames: SECTION_DEFINITIONS.map(item => item.name),
    annotationKinds: ANNOTATION_SECTIONS.map(item => item.kind),
    dialogFamilies: DIALOG_FAMILIES.map(item => item.name),
    paints: [{ r: 0.5, g: 0.5, b: 0.5 }],
    radii: [{ value: 8, geometry: 'RECTANGLE' }, { value: 999, geometry: 'ELLIPSE' }],
    topLevelNames: SECTION_DEFINITIONS.map(item => item.name),
    baselineTopLevelCount: 17,
    preservedTopLevelCount: 17,
    baselineHash: 'baseline-abc',
    currentBaselineHash: 'baseline-abc',
    baselineMismatches: [],
    baselinePages: [{ id: '0:0', name: 'Page 1', index: 0 }],
    currentPages: [{ id: '0:0', name: 'Page 1', index: 0 }],
  }
  assert.deepEqual(buildVerificationReport(snapshot), {
    pageCount: 1,
    sectionCount: 39,
    missingSections: [],
    annotationCount: 29,
    dialogFamilyCount: 7,
    nonGrayPaints: 0,
    invalidRadii: 0,
    duplicateNames: [],
    preservedBaselineTopLevelCount: 17,
    preservedBaselineHash: true,
    baselineMismatches: [],
    pageInvariant: true,
  })
})

test('baseline hashing detects recursive foreign-node and page-order mutations deterministically', async () => {
  const [, { hashBaselineRecords, compareBaselineState, orderRecordsByBaselineIds }] = await loadModules()
  const records = [
    {
      id: '1:1', name: 'Existing', type: 'FRAME', parentId: '0:1', index: 0,
      bounds: { x: 10, y: 20, width: 300, height: 200 }, visible: true, opacity: 1,
      text: null, childIds: ['1:2'], fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
      strokes: [], effects: [], mainComponentId: null, componentSetId: null,
      absoluteRenderBounds: { x: 10, y: 20, width: 300, height: 205 },
      absoluteBoundingBox: { x: 10, y: 20, width: 300, height: 200 },
      autoLayout: { layoutMode: 'VERTICAL', itemSpacing: 8, paddingTop: 16 },
      layoutChild: { layoutPositioning: 'AUTO', layoutAlign: 'INHERIT', layoutGrow: 0, constraints: { horizontal: 'MIN', vertical: 'MIN' } },
    },
    {
      id: '1:2', name: 'Title', type: 'TEXT', parentId: '1:1', index: 0,
      bounds: { x: 16, y: 16, width: 120, height: 22 }, visible: true, opacity: 1,
      text: 'Unverändert', childIds: [], fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }],
      strokes: [], effects: [], mainComponentId: null, componentSetId: null, autoLayout: null,
      absoluteRenderBounds: { x: 26, y: 36, width: 120, height: 22 },
      absoluteBoundingBox: { x: 26, y: 36, width: 120, height: 22 },
      layoutChild: { layoutPositioning: 'AUTO', layoutAlign: 'INHERIT', layoutGrow: 0, constraints: { horizontal: 'MIN', vertical: 'MIN' } },
    },
  ]
  const baselineHash = hashBaselineRecords(records)
  assert.equal(baselineHash, hashBaselineRecords(structuredClone(records)))
  assert.deepEqual(orderRecordsByBaselineIds([records[1], records[0]], ['1:1', '1:2']), records)

  const pages = [{ id: '0:1', name: 'Page 1', index: 0 }]
  assert.deepEqual(compareBaselineState({ records, pages }, { records: structuredClone(records), pages: structuredClone(pages) }), {
    preservedBaselineHash: true,
    baselineHash,
    currentBaselineHash: baselineHash,
    baselineMismatches: [],
    pageInvariant: true,
  })

  const changed = structuredClone(records)
  changed[1].layoutChild.constraints.horizontal = 'MAX'
  const comparison = compareBaselineState({ records, pages }, { records: changed, pages })
  assert.equal(comparison.preservedBaselineHash, false)
  assert.deepEqual(comparison.baselineMismatches, ['1:2'])
  assert.equal(compareBaselineState({ records, pages }, {
    records,
    pages: [{ id: '0:1', name: 'Umbenannt', index: 0 }],
  }).pageInvariant, false)
})
