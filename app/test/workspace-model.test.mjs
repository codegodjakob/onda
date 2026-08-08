import test from 'node:test'
import assert from 'node:assert/strict'
import {
  appendThreadMessage,
  collectBlockSnapshots,
  completeEditingFinding,
  createEditingFindingState,
  deriveEditingAppliedText,
  dismissAgentMessage,
  ensureWorkspaceState,
  findBlockForTarget,
  hasUnseenInitiative,
  normalizeThread,
  reconcileEditingFinding,
  resolveEvidenceSources,
  resolveFindingBlock,
  resolveFindingPlacement,
  shouldOpenAgentWidget,
  structureHintMap,
} from '../src/workspace-model.mjs'

test('thread messages receive stable role and timestamp', () => {
  const thread = []
  const message = appendThreadMessage(thread, 'user', 'Ich meine die kognitive Begrenzung.', 42)

  assert.deepEqual(message, {
    id: 'message-42-0',
    role: 'user',
    text: 'Ich meine die kognitive Begrenzung.',
    at: 42,
  })
  assert.deepEqual(thread, [message])
})

test('thread messages reject invalid roles, empty text, and non-finite timestamps', () => {
  const thread = []

  assert.throws(() => appendThreadMessage(thread, 'system', 'Fremde Rolle', 1), /role/i)
  assert.throws(() => appendThreadMessage(thread, 'user', '   ', 1), /text/i)
  assert.throws(() => appendThreadMessage(thread, 'agent', 'Antwort', Number.NaN), /timestamp/i)
  assert.deepEqual(thread, [])
})

test('thread message ids stay unique when timestamps and persisted ids collide', () => {
  const thread = [{ id: 'message-42-1', role: 'agent', text: 'Vorhanden', at: 1 }]
  const first = appendThreadMessage(thread, 'user', 'Eins', 42)
  const second = appendThreadMessage(thread, 'agent', 'Zwei', 42)

  assert.equal(first.id, 'message-42-1-2')
  assert.equal(second.id, 'message-42-2')
  assert.equal(new Set(thread.map(message => message.id)).size, thread.length)
})

test('normalizeThread safely drops malformed messages and repairs duplicate ids stably', () => {
  const normalized = normalizeThread([
    null,
    { id: 'same', role: 'agent', text: 'Erste Aussage', at: 1 },
    { id: 'same', role: 'user', text: 'Antwort', at: 2 },
    { id: '', role: 'agent', text: 'Ohne ID', at: 3 },
    { id: 'foreign', role: 'tool', text: 'Nicht anzeigen', at: 4 },
    { id: 'empty', role: 'user', text: ' ', at: 5 },
    { id: 'time', role: 'agent', text: 'Keine Zeit', at: Number.POSITIVE_INFINITY },
  ])

  assert.deepEqual(normalized, [
    { id: 'same', role: 'agent', text: 'Erste Aussage', at: 1 },
    { id: 'same-2', role: 'user', text: 'Antwort', at: 2 },
    { id: 'message-3-2', role: 'agent', text: 'Ohne ID', at: 3 },
  ])
  assert.deepEqual(normalizeThread(normalized), normalized)
})

test('workspace migration normalizes global and finding threads without losing valid chat', () => {
  const doc = {
    findings: [
      { id: 'f1', thread: [null, { id: 'local', role: 'user', text: 'Lokale Antwort', at: 4 }] },
      { id: 'f2', thread: 'kaputt' },
    ],
    workspace: {
      shelfOpen: true,
      agent: {
        messages: [
          null,
          {
            id: 'm1',
            status: 'new',
            text: 'Frage',
            thread: [
              { id: 'global', role: 'agent', text: 'Globale Frage', at: 1 },
              { id: 'global', role: 'user', text: 'Globale Antwort', at: 2 },
              { id: 'foreign', role: 'system', text: 'Nicht anzeigen', at: 3 },
            ],
          },
        ],
      },
    },
  }
  const first = ensureWorkspaceState(doc)
  const second = ensureWorkspaceState(doc)
  assert.equal(first, second)
  assert.equal(first.shelfOpen, true)
  assert.deepEqual(first.agent.messages[0].thread, [
    { id: 'global', role: 'agent', text: 'Globale Frage', at: 1 },
    { id: 'global-2', role: 'user', text: 'Globale Antwort', at: 2 },
  ])
  assert.equal(first.agent.messages.length, 1)
  assert.deepEqual(doc.findings[0].thread, [{ id: 'local', role: 'user', text: 'Lokale Antwort', at: 4 }])
  assert.deepEqual(doc.findings[1].thread, [])
  assert.deepEqual(first.agent.dismissedIds, [])
  assert.equal(first.agent.activeMessageId, null)
})

test('Thread-Identität bleibt bei Normalisierung stabil, damit laufende Streams nicht in verwaiste Arrays schreiben', () => {
  const globalThread = [{ id: 'global-1', role: 'agent', text: 'Beginn', at: 1 }]
  const localThread = [{ id: 'local-1', role: 'agent', text: 'Beginn lokal', at: 1 }]
  const globalMessage = globalThread[0]
  const localMessage = localThread[0]
  const doc = {
    findings: [{ id: 'f-1', thread: localThread }],
    workspace: {
      agent: {
        messages: [{ id: 'm-1', text: 'Frage', thread: globalThread }],
        dismissedIds: [],
      },
    },
  }

  ensureWorkspaceState(doc)
  assert.equal(doc.workspace.agent.messages[0].thread, globalThread)
  assert.equal(doc.findings[0].thread, localThread)
  assert.equal(globalThread[0], globalMessage)
  assert.equal(localThread[0], localMessage)

  appendThreadMessage(globalThread, 'user', 'Antwort global', 2)
  appendThreadMessage(localThread, 'user', 'Antwort lokal', 2)
  ensureWorkspaceState(doc)

  assert.equal(doc.workspace.agent.messages[0].thread, globalThread)
  assert.equal(doc.findings[0].thread, localThread)
  assert.equal(globalThread[0], globalMessage)
  assert.equal(localThread[0], localMessage)
  assert.equal(globalThread.at(-1).text, 'Antwort global')
  assert.equal(localThread.at(-1).text, 'Antwort lokal')
})

// Selbstheilung fuer bestehende Installationen: das Interview-Fenster eines FREMDEN
// Projekts wurde frueher in dieses Dokument geschrieben (Startseiten-Zeiger statt
// doc.projectId). Der gespeicherte Zustand traegt es weiter — hier faellt es raus.
test('ensureWorkspaceState entfernt die Interview-Nachricht eines fremden Projekts', () => {
  const doc = {
    projectId: 'p-example',
    workspace: { agent: { messages: [
      { id: 'example-agent-initiative', status: 'new', text: 'Beispiel' },
      { id: 'interview-p-default', status: 'new', text: 'Bevor ich beim Schreiben helfen kann …' },
    ] } },
  }
  const workspace = ensureWorkspaceState(doc)

  assert.deepEqual(workspace.agent.messages.map(message => message.id), ['example-agent-initiative'])
})

test('ensureWorkspaceState behaelt die eigene Interview-Nachricht des Dokuments', () => {
  const doc = {
    projectId: 'p-zwei',
    workspace: { agent: { messages: [{ id: 'interview-p-zwei', status: 'new', text: 'Frage' }] } },
  }
  const workspace = ensureWorkspaceState(doc)

  assert.deepEqual(workspace.agent.messages.map(message => message.id), ['interview-p-zwei'])
})

test('ensureWorkspaceState raeumt ohne bekanntes Projekt nichts weg', () => {
  const doc = { workspace: { agent: { messages: [{ id: 'interview-p-default', status: 'new', text: 'Frage' }] } } }
  const workspace = ensureWorkspaceState(doc)

  assert.deepEqual(workspace.agent.messages.map(message => message.id), ['interview-p-default'])
})

test('array workspace is replaced with state that survives a JSON roundtrip', () => {
  const doc = { workspace: [] }
  const migrated = ensureWorkspaceState(doc)

  assert.equal(Array.isArray(migrated), false)
  assert.equal(migrated.version, 3)
  assert.equal(migrated.annotationMode, 'text')
  assert.equal(migrated.quietAnnotations, false)
  assert.equal(migrated.activeAnnotationId, null)
  assert.deepEqual(migrated.undoStack, [])

  const reloaded = JSON.parse(JSON.stringify(doc))
  const restored = ensureWorkspaceState(reloaded)
  assert.equal(restored.version, 3)
  assert.equal(restored.shelfOpen, false)
  assert.deepEqual(restored.agent.messages, [])
})

test('annotation workspace migration preserves valid mode, quiet state and recent undo operations', () => {
  const undoStack = Array.from({ length: 22 }, (_, index) => ({ ok: true, id: `op-${index}` }))
  const doc = { workspace: {
    annotationMode: 'notiz',
    quietAnnotations: true,
    activeAnnotationId: 'finding-7',
    undoStack,
    suppressedAnnotations: ['a', 'a', 'b'],
  } }

  const workspace = ensureWorkspaceState(doc)

  assert.equal(workspace.annotationMode, 'notiz')
  assert.equal(workspace.quietAnnotations, true)
  assert.equal(workspace.activeAnnotationId, 'finding-7')
  assert.equal(workspace.undoStack.length, 20)
  assert.equal(workspace.undoStack[0].id, 'op-2')
  assert.deepEqual(workspace.suppressedAnnotations, ['a', 'b'])
})

test('array agent is replaced with state that survives a JSON roundtrip', () => {
  const doc = { workspace: { shelfOpen: true, agent: [] } }
  const migrated = ensureWorkspaceState(doc)

  assert.equal(Array.isArray(migrated.agent), false)
  assert.equal(migrated.agent.open, false)

  const reloaded = JSON.parse(JSON.stringify(doc))
  const restored = ensureWorkspaceState(reloaded)
  assert.equal(restored.shelfOpen, true)
  assert.deepEqual(restored.agent.messages, [])
  assert.deepEqual(restored.agent.dismissedIds, [])
})

test('ensureWorkspaceState ergänzt decisionsOpen additiv und erhält gespeicherte Werte', () => {
  const doc = { workspace: { agent: { messages: [], dismissedIds: [] } } }
  const workspace = ensureWorkspaceState(doc)
  assert.equal(workspace.agent.decisionsOpen, false)

  workspace.agent.decisionsOpen = true
  const wieder = ensureWorkspaceState(doc)
  assert.equal(wieder.agent.decisionsOpen, true)
})

test('top-level editor nodes become block previews', () => {
  // Die Rolle von p1 kommt seit Task 7 aus der Rollenkarte, nicht mehr aus einem
  // Tiptap-Merkmal am Knoten -- die Karte speist collectBlockSnapshots als zweites Argument.
  const blocks = collectBlockSnapshots({
    type: 'doc',
    content: [
      { type: 'heading', attrs: { blockId: 'h1', level: 2 }, content: [{ type: 'text', text: 'Kapitel' }] },
      { type: 'paragraph', attrs: { blockId: 'p1' }, content: [{ type: 'text', text: 'Eine tragende Aussage.' }] },
    ],
  }, new Map([['p1', 'claim']]))
  assert.deepEqual(blocks.map(({ id, role, excerpt }) => ({ id, role, excerpt })), [
    { id: 'h1', role: 'heading', excerpt: 'Kapitel' },
    { id: 'p1', role: 'claim', excerpt: 'Eine tragende Aussage.' },
  ])
})

test('target matching resolves the narrowest containing block', () => {
  const blocks = [
    { id: 'a', text: 'Der laengere Kontext erklaert, warum die knappe individuelle Ressource im Mittelpunkt steht.' },
    { id: 'b', text: 'Die knappe individuelle Ressource zaehlt.' },
  ]
  assert.equal(findBlockForTarget(blocks, 'knappe individuelle Ressource').id, 'b')
  assert.equal(findBlockForTarget(blocks, 'nicht vorhanden'), null)
})

test('agent initiative waits for an idle pause and respects dismissal', () => {
  const message = { id: 'm1', status: 'new', earliestAt: 1000 }
  const context = {
    message,
    dismissedIds: [],
    documentId: 'doc-a',
    activeDocumentId: 'doc-a',
    isEditorView: true,
    visibilityState: 'visible',
    inputGeneration: 1,
  }
  assert.equal(shouldOpenAgentWidget({ ...context, now: 4000, lastInputAt: 2500 }), false)
  assert.equal(shouldOpenAgentWidget({ ...context, now: 6000, lastInputAt: 2500 }), true)
  assert.equal(shouldOpenAgentWidget({ ...context, now: 6000, lastInputAt: 2500, dismissedIds: ['m1'] }), false)
})

test('agent initiative requires a finite last input timestamp', () => {
  const message = { id: 'm1', status: 'new', earliestAt: 1000 }

  for (const lastInputAt of [undefined, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.equal(shouldOpenAgentWidget({
      now: 6000,
      lastInputAt,
      message,
      dismissedIds: [],
      documentId: 'doc-a',
      activeDocumentId: 'doc-a',
      isEditorView: true,
      visibilityState: 'visible',
      inputGeneration: 1,
    }), false)
  }
})

test('agent initiative is bound to the visible editor and active document', () => {
  const base = {
    now: 6000,
    lastInputAt: 2000,
    message: { id: 'm1', status: 'new', earliestAt: 0 },
    dismissedIds: [],
    documentId: 'doc-a',
    activeDocumentId: 'doc-a',
    isEditorView: true,
    visibilityState: 'visible',
    inputGeneration: 2,
  }

  assert.equal(shouldOpenAgentWidget({ ...base, isEditorView: false }), false)
  assert.equal(shouldOpenAgentWidget({ ...base, visibilityState: 'hidden' }), false)
  assert.equal(shouldOpenAgentWidget({ ...base, activeDocumentId: 'doc-b' }), false)
  assert.equal(shouldOpenAgentWidget(base), true)
})

test('a matching paragraph boundary can release a waiting initiative after a short pause', () => {
  const base = {
    message: { id: 'm1', status: 'new', earliestAt: 0 },
    dismissedIds: [],
    documentId: 'doc-a',
    activeDocumentId: 'doc-a',
    isEditorView: true,
    visibilityState: 'visible',
    lastInputAt: 1000,
    boundaryAt: 1000,
    boundaryGeneration: 4,
    inputGeneration: 4,
  }

  assert.equal(shouldOpenAgentWidget({ ...base, now: 1299 }), false)
  assert.equal(shouldOpenAgentWidget({ ...base, now: 1300 }), true)
  assert.equal(shouldOpenAgentWidget({ ...base, now: 1600, inputGeneration: 5 }), false)
  assert.equal(shouldOpenAgentWidget({ ...base, now: 1600, boundaryGeneration: null }), false)
})

test('composition blocks idle and paragraph-boundary initiatives', () => {
  const base = {
    now: 6000,
    lastInputAt: 1000,
    message: { id: 'm1', status: 'new', earliestAt: 0 },
    dismissedIds: [],
    documentId: 'doc-a',
    activeDocumentId: 'doc-a',
    isEditorView: true,
    visibilityState: 'visible',
    isComposing: true,
    inputGeneration: 4,
  }

  assert.equal(shouldOpenAgentWidget(base), false)
  assert.equal(shouldOpenAgentWidget({
    ...base,
    now: 1400,
    lastInputAt: 1000,
    boundaryAt: 1000,
    boundaryGeneration: 4,
  }), false)
})

test('dismissing a message is idempotent', () => {
  const workspace = ensureWorkspaceState({}).agent
  dismissAgentMessage({ agent: workspace }, 'm1')
  dismissAgentMessage({ agent: workspace }, 'm1')
  assert.deepEqual(workspace.dismissedIds, ['m1'])
})

test('legacy finding receives a block anchor only for one top-level match', () => {
  const finding = { id: 'f1', target: 'gemeinsame Phrase' }
  const blocks = [
    { id: 'a', text: 'Hier steht die gemeinsame Phrase.' },
    { id: 'b', text: 'Ein anderer Absatz.' },
  ]

  assert.equal(resolveFindingBlock(finding, blocks)?.id, 'a')
  assert.equal(finding.blockId, 'a')
})

test('legacy finding stays unanchored when the phrase occurs in two blocks', () => {
  const finding = { id: 'f1', target: 'gleiche Phrase' }
  const blocks = [
    { id: 'a', text: 'Die gleiche Phrase steht hier.' },
    { id: 'b', text: 'Auch hier steht die gleiche Phrase.' },
  ]

  assert.equal(resolveFindingBlock(finding, blocks), null)
  assert.equal(Object.hasOwn(finding, 'blockId'), false)
})

test('stale persisted block anchor never falls back to text matching', () => {
  const finding = { id: 'f1', blockId: 'deleted', target: 'eindeutige Phrase' }
  const blocks = [{ id: 'live', text: 'Die eindeutige Phrase steht nun woanders.' }]

  assert.equal(resolveFindingBlock(finding, blocks), null)
  assert.equal(finding.blockId, 'deleted')
})

test('known stale and ambiguous findings remain explicitly classifiable', () => {
  const blocks = [
    { id: 'b-known', text: 'Die Passage wurde inzwischen neu geschrieben.' },
    { id: 'b-a', text: 'Eine doppelte Phrase steht hier.' },
    { id: 'b-b', text: 'Auch hier steht eine doppelte Phrase.' },
  ]

  assert.deepEqual(
    resolveFindingPlacement({ id: 'stale', blockId: 'b-known', target: 'alter Wortlaut' }, blocks),
    { kind: 'stale', block: blocks[0] },
  )
  assert.deepEqual(
    resolveFindingPlacement({ id: 'ambiguous', target: 'doppelte Phrase' }, blocks),
    { kind: 'ambiguous', block: null },
  )
  assert.deepEqual(
    resolveFindingPlacement({ id: 'missing', blockId: 'b-gone', target: 'alter Wortlaut' }, blocks),
    { kind: 'unplaced', block: null },
  )
})

test('editing finding survives reload and derives the actual user wording', () => {
  const doc = {}
  const workspace = ensureWorkspaceState(doc)
  workspace.editingFinding = createEditingFindingState(
    { id: 'f1', blockId: 'b1', target: 'alte Worte' },
    { id: 'b1', text: 'Praefix alte Worte Suffix' },
    123,
  )

  const restored = ensureWorkspaceState(JSON.parse(JSON.stringify(doc)))
  assert.deepEqual(restored.editingFinding, {
    findingId: 'f1',
    blockId: 'b1',
    beforeText: 'Praefix alte Worte Suffix',
    prefix: 'Praefix ',
    suffix: ' Suffix',
    startedAt: 123,
  })
  assert.equal(
    deriveEditingAppliedText(restored.editingFinding, 'Praefix eigene klare Worte Suffix'),
    'eigene klare Worte',
  )
  assert.equal(deriveEditingAppliedText(restored.editingFinding, 'Praefix alte Worte Suffix'), null)
})

test('persisted editing finding remains open with an exact completion candidate', () => {
  const editingFinding = {
    findingId: 'f1',
    blockId: 'b1',
    beforeText: 'Praefix alte Worte Suffix',
    prefix: 'Praefix ',
    suffix: ' Suffix',
    startedAt: 123,
  }

  assert.deepEqual(
    reconcileEditingFinding(editingFinding, [{ id: 'b1', text: 'Praefix meine eigene klare Fassung Suffix' }]),
    {
      kind: 'ready',
      appliedText: 'meine eigene klare Fassung',
      editingFinding: { ...editingFinding, status: 'ready' },
    },
  )
  assert.deepEqual(
    completeEditingFinding(editingFinding, [{ id: 'b1', text: 'Praefix meine eigene klare Fassung Suffix' }]),
    { kind: 'accept', appliedText: 'meine eigene klare Fassung' },
  )
})

test('unchanged own version cannot be completed', () => {
  const editingFinding = {
    findingId: 'f1',
    blockId: 'b1',
    beforeText: 'Praefix alte Worte Suffix',
    prefix: 'Praefix ',
    suffix: ' Suffix',
    startedAt: 123,
  }

  assert.deepEqual(
    completeEditingFinding(editingFinding, [{ id: 'b1', text: editingFinding.beforeText }]),
    { kind: 'unchanged' },
  )
})

test('persisted editing finding stays pending while its block text is unchanged', () => {
  const editingFinding = {
    findingId: 'f1',
    blockId: 'b1',
    beforeText: 'Praefix alte Worte Suffix',
    prefix: 'Praefix ',
    suffix: ' Suffix',
    startedAt: 123,
  }

  assert.deepEqual(
    reconcileEditingFinding(editingFinding, [{ id: 'b1', text: editingFinding.beforeText }]),
    { kind: 'pending', editingFinding: { ...editingFinding, status: 'pending' } },
  )
})

test('persisted editing finding keeps a deleted block explicitly stale without guessing', () => {
  const editingFinding = {
    findingId: 'f1',
    blockId: 'deleted',
    beforeText: 'Praefix alte Worte Suffix',
    prefix: 'Praefix ',
    suffix: ' Suffix',
    startedAt: 123,
  }

  assert.deepEqual(
    reconcileEditingFinding(editingFinding, [{ id: 'live', text: 'Praefix eigene Worte Suffix' }]),
    {
      kind: 'stale',
      editingFinding: { ...editingFinding, status: 'stale', staleReason: 'block-missing' },
    },
  )
})

test('persisted editing finding keeps divergent block text explicitly stale', () => {
  const editingFinding = {
    findingId: 'f1',
    blockId: 'b1',
    beforeText: 'Praefix alte Worte Suffix',
    prefix: 'Praefix ',
    suffix: ' Suffix',
    startedAt: 123,
  }

  assert.deepEqual(
    reconcileEditingFinding(editingFinding, [{ id: 'b1', text: 'Vollstaendig umgebauter Absatz' }]),
    {
      kind: 'stale',
      editingFinding: { ...editingFinding, status: 'stale', staleReason: 'text-diverged' },
    },
  )
})

test('hasUnseenInitiative flags a new, undismissed message while the widget is closed', () => {
  const workspace = {
    agent: {
      open: false,
      dismissedIds: [],
      messages: [{ id: 'm1', status: 'new', text: 'Hinweis', thread: [] }],
    },
  }
  assert.equal(hasUnseenInitiative(workspace), true)

  workspace.agent.open = true
  assert.equal(hasUnseenInitiative(workspace), false, 'open widget is already seen')

  workspace.agent.open = false
  workspace.agent.dismissedIds = ['m1']
  assert.equal(hasUnseenInitiative(workspace), false, 'dismissed message is not unseen')

  workspace.agent.dismissedIds = []
  workspace.agent.messages[0].status = 'seen'
  assert.equal(hasUnseenInitiative(workspace), false, 'non-new message is not unseen')

  assert.equal(hasUnseenInitiative(null), false)
})

test('structureHintMap: evidence dot beats style dot per block', () => {
  const blocks = [
    { id: 'b-1', text: 'Weiser und Brown prägten den Begriff 1996.' },
    { id: 'b-2', text: 'Der Satz schwächt gleich zweifach ab.' },
    { id: 'b-3', text: 'Kein Hinweis hier.' },
  ]
  const doc = { findings: [
    { id: 'f1', status: 'open', placement: 'passage', target: '1996', blockId: 'b-1', category: 'source', sources: [{ label: 'x' }] },
    { id: 'f2', status: 'open', placement: 'passage', target: 'zweifach ab', blockId: 'b-2', category: 'wording' },
    { id: 'f3', status: 'open', placement: 'passage', target: 'prägten', blockId: 'b-1', category: 'wording' }, // style on same block as evidence
    { id: 'f4', status: 'resolved', placement: 'passage', target: 'Kein Hinweis', blockId: 'b-3', category: 'source', sources: [{ label: 'y' }] }, // not open -> ignored
  ] }
  const map = structureHintMap(doc, blocks)
  assert.equal(map.get('b-1'), 'evidence') // evidence wins over the later style finding
  assert.equal(map.get('b-2'), 'style')
  assert.equal(map.has('b-3'), false)
})

// Belegfenster-Guard (H-4): Demo-Quellen (verificationStatus 'demo') gehoeren
// exklusiv zum Beispielprojekt. Echte Findings haben ohnehin sources: [] (H-1) --
// diese Funktion sichert zusaetzlich jeden anderen Weg ins Belegfenster ab.
test('resolveEvidenceSources keeps every source inside the example project, demo or not', () => {
  const sources = [
    { label: 'Demo-Quelle', verificationStatus: 'demo' },
    { label: 'Gepruefte Quelle', verificationStatus: 'verified' },
  ]
  assert.deepEqual(resolveEvidenceSources(sources, true), sources)
})

test('resolveEvidenceSources filters demo sources out of real projects', () => {
  const verified = { label: 'Gepruefte Quelle', verificationStatus: 'verified' }
  const sources = [
    { label: 'Demo-Quelle A', verificationStatus: 'demo' },
    verified,
    { label: 'Demo-Quelle B', verificationStatus: 'demo' },
  ]
  assert.deepEqual(resolveEvidenceSources(sources, false), [verified])
})

test('resolveEvidenceSources keeps sources without an explicit verification status in real projects', () => {
  const legacy = { label: 'Quelle ohne Statusfeld' }
  assert.deepEqual(resolveEvidenceSources([legacy], false), [legacy])
})

test('resolveEvidenceSources treats a missing or malformed source list as empty', () => {
  assert.deepEqual(resolveEvidenceSources(undefined, false), [])
  assert.deepEqual(resolveEvidenceSources(null, true), [])
  assert.deepEqual(resolveEvidenceSources('kaputt', false), [])
})

test('resolveEvidenceSources never throws on a malformed entry inside an otherwise real list', () => {
  const malformed = [null, undefined, 'x']
  assert.deepEqual(resolveEvidenceSources(malformed, false), malformed)
})

test('ohne Rollenkarte ist jeder Absatz ein gewoehnlicher Absatz', () => {
  const blocks = collectBlockSnapshots({
    content: [
      { type: 'heading', attrs: { level: 2, blockId: 'h1' }, content: [{ type: 'text', text: 'Titel' }] },
      { type: 'paragraph', attrs: { blockId: 'b1' }, content: [{ type: 'text', text: 'Ein Absatz.' }] },
    ],
  })
  assert.deepEqual(blocks.map(block => block.role), ['heading', 'paragraph'])
})

test('die Rollenkarte speist block.role, das alte Merkmal nicht mehr', () => {
  const docJson = {
    content: [
      { type: 'heading', attrs: { level: 2, blockId: 'h1' }, content: [{ type: 'text', text: 'Titel' }] },
      { type: 'paragraph', attrs: { blockId: 'b1', semanticRole: 'claim' }, content: [{ type: 'text', text: 'Alt.' }] },
      { type: 'paragraph', attrs: { blockId: 'b2' }, content: [{ type: 'text', text: 'Neu.' }] },
    ],
  }
  const blocks = collectBlockSnapshots(docJson, new Map([['b2', 'counterpoint']]))
  assert.deepEqual(blocks.map(block => block.role), ['heading', 'paragraph', 'counterpoint'])
})
