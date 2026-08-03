# V2 Interactive Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a usable V2 writing workspace with stable text blocks, a preview-based structure shelf, passage-anchored feedback, inline suggestions, local dialogue, and a separate proactive agent widget.

**Architecture:** Keep the existing local persistence and Tiptap editor, but replace the old editor rails/panels with a focused workspace orchestrator. Pure workspace state and block selectors live in testable `.mjs` modules; Tiptap-specific block identity and editing commands live in one adapter; DOM rendering and interactions live in a dedicated workspace module. The existing home/library remains available, while the old `panels.js` and `structure.js` stop owning the editor surface.

**Tech Stack:** Vanilla JavaScript, Tiptap 2.x/ProseMirror, CSS, Node `node:test`, Playwright smoke tests, esbuild.

## Global Constraints

- The visible product has no provisional product name or brand mark.
- The writing surface has one fixed document typography and no font/size/image controls.
- No status dots, underlined agent findings, permanent bottom-right launcher, permanent review button, or unexplained overflow menu.
- Text changes proposed by the agent require an explicit accept action.
- Local findings stay anchored to one text block; project-level dialogue uses a separate rounded right-side widget.
- The structure shelf shifts the writing canvas and never dims it like a modal.
- Persist visible decisions and open workspace state in `aiwt.v2`.
- Support 1440x1000 and 390x844 without horizontal overflow.
- Honor `prefers-reduced-motion` and never move editor focus when agent UI opens.
- Do not create commits unless the user explicitly requests them; each task ends with tests and `git diff --check` instead.

---

## File Map

- `app/src/workspace-model.mjs`: pure schema migration, block snapshot selectors, agent initiative timing, and persisted workspace state.
- `app/src/block-identity.js`: Tiptap block attributes, stable ID migration, active-block lookup, semantic insertion, and target replacement.
- `app/src/workspace.js`: editor workspace orchestration and all new DOM surfaces.
- `app/src/editor.js`: application state migration, Tiptap extension registration, and workspace initialization.
- `app/src/ui.js`: retain library, formatting bubble, slash menu, title, and global shortcuts; stop building old toolbar/panel navigation.
- `app/src/example.js`: V2 sample agent message and richer source/finding data.
- `app/index.html`: reduced editor shell and accessible surface containers.
- `app/src/style.css`: new V2 visual system; old editor/panel styles become unreachable.
- `app/test/workspace-model.test.mjs`: pure workspace state tests.
- `app/test/v2-smoke.mjs`: end-to-end interactions, persistence, screenshots, and mobile overflow.

---

### Task 1: Persisted Workspace State

**Files:**
- Create: `app/src/workspace-model.mjs`
- Create: `app/test/workspace-model.test.mjs`
- Modify: `app/src/editor.js:139-190`

**Interfaces:**
- Produces: `ensureWorkspaceState(doc) -> WorkspaceState`
- Produces: `collectBlockSnapshots(docJson) -> BlockSnapshot[]`
- Produces: `findBlockForTarget(blocks, target) -> BlockSnapshot | null`
- Produces: `shouldOpenAgentWidget({ now, lastInputAt, message, dismissedIds }) -> boolean`
- Produces: `dismissAgentMessage(workspace, messageId) -> WorkspaceState`

- [ ] **Step 1: Write failing state tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  collectBlockSnapshots,
  dismissAgentMessage,
  ensureWorkspaceState,
  findBlockForTarget,
  shouldOpenAgentWidget,
} from '../src/workspace-model.mjs'

test('workspace migration is stable and preserves existing chat', () => {
  const doc = { workspace: { shelfOpen: true, agent: { messages: [{ id: 'm1' }] } } }
  const first = ensureWorkspaceState(doc)
  const second = ensureWorkspaceState(doc)
  assert.equal(first, second)
  assert.equal(first.shelfOpen, true)
  assert.deepEqual(first.agent.messages, [{ id: 'm1' }])
  assert.deepEqual(first.agent.dismissedIds, [])
})

test('top-level editor nodes become block previews', () => {
  const blocks = collectBlockSnapshots({
    type: 'doc',
    content: [
      { type: 'heading', attrs: { blockId: 'h1', level: 2 }, content: [{ type: 'text', text: 'Kapitel' }] },
      { type: 'paragraph', attrs: { blockId: 'p1', semanticRole: 'claim' }, content: [{ type: 'text', text: 'Eine tragende Aussage.' }] },
    ],
  })
  assert.deepEqual(blocks.map(({ id, role, excerpt }) => ({ id, role, excerpt })), [
    { id: 'h1', role: 'heading', excerpt: 'Kapitel' },
    { id: 'p1', role: 'claim', excerpt: 'Eine tragende Aussage.' },
  ])
})

test('target matching resolves the narrowest containing block', () => {
  const blocks = [
    { id: 'a', text: 'Ein kurzer Absatz.' },
    { id: 'b', text: 'Hier steht die knappe individuelle Ressource im Mittelpunkt.' },
  ]
  assert.equal(findBlockForTarget(blocks, 'knappe individuelle Ressource').id, 'b')
  assert.equal(findBlockForTarget(blocks, 'nicht vorhanden'), null)
})

test('agent initiative waits for an idle pause and respects dismissal', () => {
  const message = { id: 'm1', status: 'new', earliestAt: 1000 }
  assert.equal(shouldOpenAgentWidget({ now: 4000, lastInputAt: 2500, message, dismissedIds: [] }), false)
  assert.equal(shouldOpenAgentWidget({ now: 6000, lastInputAt: 2500, message, dismissedIds: [] }), true)
  assert.equal(shouldOpenAgentWidget({ now: 6000, lastInputAt: 2500, message, dismissedIds: ['m1'] }), false)
})

test('dismissing a message is idempotent', () => {
  const workspace = ensureWorkspaceState({}).agent
  dismissAgentMessage({ agent: workspace }, 'm1')
  dismissAgentMessage({ agent: workspace }, 'm1')
  assert.deepEqual(workspace.dismissedIds, ['m1'])
})
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd app && npm test`

Expected: FAIL because `workspace-model.mjs` does not exist.

- [ ] **Step 3: Implement the pure workspace model**

```js
const WORKSPACE_VERSION = 1
const IDLE_BEFORE_INITIATIVE_MS = 3000

function textOf(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  return (node.content || []).map(textOf).join('')
}

export function ensureWorkspaceState(doc) {
  const current = doc.workspace && typeof doc.workspace === 'object' ? doc.workspace : {}
  current.version = WORKSPACE_VERSION
  if (typeof current.shelfOpen !== 'boolean') current.shelfOpen = false
  current.activeBlockId = current.activeBlockId || null
  current.expandedFindingId = current.expandedFindingId || null
  current.suggestionFindingId = current.suggestionFindingId || null
  current.localThreadFindingId = current.localThreadFindingId || null
  current.evidenceFindingId = current.evidenceFindingId || null
  const agent = current.agent && typeof current.agent === 'object' ? current.agent : {}
  if (!Array.isArray(agent.messages)) agent.messages = []
  if (!Array.isArray(agent.dismissedIds)) agent.dismissedIds = []
  if (typeof agent.open !== 'boolean') agent.open = false
  current.agent = agent
  doc.workspace = current
  return current
}

export function collectBlockSnapshots(docJson) {
  return (docJson && Array.isArray(docJson.content) ? docJson.content : []).map((node, index) => {
    const text = textOf(node).trim()
    const role = node.type === 'heading' ? 'heading' : (node.attrs && node.attrs.semanticRole) || 'paragraph'
    return {
      id: (node.attrs && node.attrs.blockId) || null,
      index,
      type: node.type,
      role,
      text,
      excerpt: text.slice(0, 160),
    }
  })
}

export function findBlockForTarget(blocks, target) {
  const needle = String(target || '').trim()
  if (!needle) return null
  return (blocks || []).find(block => String(block.text || '').includes(needle)) || null
}

export function shouldOpenAgentWidget({ now, lastInputAt, message, dismissedIds }) {
  if (!message || message.status !== 'new') return false
  if ((dismissedIds || []).includes(message.id)) return false
  if (now < (message.earliestAt || 0)) return false
  return now - (lastInputAt || 0) >= IDLE_BEFORE_INITIATIVE_MS
}

export function dismissAgentMessage(workspace, messageId) {
  const agent = workspace.agent
  if (!agent.dismissedIds.includes(messageId)) agent.dismissedIds.push(messageId)
  agent.open = false
  return workspace
}
```

Call `ensureWorkspaceState(d)` from `ensureDocShape(d)` in `editor.js` and increment `SCHEMA` to `5`.

- [ ] **Step 4: Run unit tests and verify success**

Run: `cd app && npm test`

Expected: all reasoning-model and workspace-model tests pass.

- [ ] **Step 5: Check the diff**

Run: `git diff --check -- app/src/workspace-model.mjs app/test/workspace-model.test.mjs app/src/editor.js`

Expected: no output.

---

### Task 2: Stable Tiptap Block Identity and Editing Commands

**Files:**
- Create: `app/src/block-identity.js`
- Modify: `app/src/editor.js:1-130,530-580`
- Modify: `app/test/v2-smoke.mjs`

**Interfaces:**
- Consumes: `collectBlockSnapshots(docJson)` from Task 1.
- Produces: `BlockIdentity` Tiptap extension.
- Produces: `ensureTopLevelBlockIds(editor) -> boolean`
- Produces: `getEditorBlocks(editor) -> EditorBlock[]`
- Produces: `getActiveBlockId(editor) -> string | null`
- Produces: `insertSemanticBlock(editor, afterBlockId, semanticRole) -> string | null`
- Produces: `replaceFindingTarget(editor, target, replacement) -> boolean`

- [ ] **Step 1: Add a failing smoke assertion for stable IDs**

Add after `openExample(page)`:

```js
const blockIds = await page.locator('#editor .ProseMirror > [data-block-id]').evaluateAll(nodes => nodes.map(node => node.dataset.blockId))
assert.ok(blockIds.length >= 3)
assert.equal(new Set(blockIds).size, blockIds.length)
```

- [ ] **Step 2: Run the smoke test and verify failure**

Run the app server, then:

```bash
cd app
NODE_PATH="/Users/jakobschlenker/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules" node test/v2-smoke.mjs
```

Expected: FAIL because top-level nodes have no `data-block-id`.

- [ ] **Step 3: Implement the Tiptap adapter**

`BlockIdentity` adds `blockId` and `semanticRole` to `paragraph`, `heading`, `blockquote`, `codeBlock`, `bulletList`, and `orderedList`. Set `keepOnSplit: false` for both attributes. `ensureTopLevelBlockIds()` walks `editor.state.doc.forEach`, calls `tr.setNodeMarkup(offset, undefined, { ...node.attrs, blockId: createBlockId() })` for missing or duplicate IDs, and dispatches one transaction with `addToHistory: false`.

Use these command bodies:

```js
export function getActiveBlockId(editor) {
  const { $from } = editor.state.selection
  if ($from.depth < 1) return null
  return $from.node(1).attrs.blockId || null
}

export function insertSemanticBlock(editor, afterBlockId, semanticRole = 'paragraph') {
  const block = getEditorBlocks(editor).find(item => item.id === afterBlockId)
  if (!block) return null
  const blockId = createBlockId()
  editor.chain().focus().insertContentAt(block.pos + block.nodeSize, {
    type: 'paragraph',
    attrs: { blockId, semanticRole },
  }).run()
  return blockId
}

export function replaceFindingTarget(editor, target, replacement) {
  let range = null
  editor.state.doc.descendants((node, pos) => {
    if (range || !node.isTextblock) return
    const index = node.textContent.indexOf(target)
    if (index >= 0) range = { from: pos + 1 + index, to: pos + 1 + index + target.length }
  })
  if (!range) return false
  editor.chain().focus().insertContentAt(range, replacement).run()
  return true
}
```

Register `BlockIdentity` in the Tiptap extension list before `Cue`, call `ensureTopLevelBlockIds(state.editor)` after editor creation and on update, and prevent recursive transactions with a module-local guard.

- [ ] **Step 4: Build and rerun smoke**

Run:

```bash
cd app
npm run build
NODE_PATH="/Users/jakobschlenker/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules" node test/v2-smoke.mjs
```

Expected: build succeeds and ID assertion passes.

- [ ] **Step 5: Check the diff**

Run: `git diff --check -- app/src/block-identity.js app/src/editor.js app/test/v2-smoke.mjs`

Expected: no output.

---

### Task 3: Replace the Old Editor Shell

**Files:**
- Modify: `app/index.html`
- Create: `app/src/workspace.js`
- Modify: `app/src/editor.js:15-20,330-370,548-590`
- Modify: `app/src/ui.js:20-45,200-260,826-880`
- Modify: `app/src/style.css`
- Modify: `app/test/v2-smoke.mjs`

**Interfaces:**
- Consumes: `ensureWorkspaceState`, `getEditorBlocks`, `getActiveBlockId`.
- Produces: `initWorkspace(context) -> WorkspaceController`
- Produces: `refreshWorkspace() -> void`
- Produces controller methods: `openShelf()`, `closeShelf()`, `closeTopLayer()`, `recordInput()`.

- [ ] **Step 1: Replace old-shell smoke expectations with the new base state**

```js
assert.equal(await page.locator('#railL, #railR, #pCoach, #pStruct').count(), 0)
assert.equal(await page.locator('#workspaceHeader').count(), 1)
assert.equal(await page.locator('#structureShelf').isHidden(), true)
assert.equal(await page.locator('#agentPresence').count(), 1)
assert.equal(await page.getByText('Recherche aktuell', { exact: true }).count(), 0)
assert.equal(await page.getByText('Prüfen', { exact: true }).count(), 0)
```

- [ ] **Step 2: Run smoke and verify failure**

Expected: FAIL because the old rails and panels still exist.

- [ ] **Step 3: Replace editor markup in `index.html`**

Use this editor skeleton while leaving `#home` unchanged:

```html
<section id="editorView">
  <header id="workspaceHeader">
    <button id="workspaceBack" class="icon-button" title="Zur Projektübersicht" aria-label="Zur Projektübersicht">←</button>
    <button id="workspacePath" class="workspace-path" title="Struktur öffnen"></button>
    <button id="agentPresence" class="icon-button agent-presence" title="Agentengespräch öffnen" aria-label="Agentengespräch öffnen">◌</button>
  </header>
  <div id="workspaceBody">
    <aside id="structureShelf" hidden></aside>
    <main id="main">
      <div id="scroll">
        <div id="page">
          <textarea id="title" rows="1" placeholder="Titel" spellcheck="false"></textarea>
          <div id="editor"></div>
        </div>
      </div>
      <div id="blockInsertLayer"></div>
      <aside id="localAgentLayer" aria-live="polite"></aside>
    </main>
  </div>
  <aside id="agentWidget" hidden aria-label="Agentengespräch"></aside>
  <aside id="evidenceWindow" hidden aria-label="Quellen und Fundstellen"></aside>
</section>
```

- [ ] **Step 4: Implement the workspace controller base**

`initWorkspace(context)` binds back, path, and agent presence buttons, tracks the active block on `selectionUpdate`, syncs `workspace.activeBlockId`, and exposes `window.__workspaceCloseTopLayer`. `refreshWorkspace()` updates breadcrumb copy from `activeProjectObj()` and `activeDoc()`, toggles the shelf, and adds `.is-active-block` only to the selected `[data-block-id]` element.

In `editor.js`, replace `initPanels(ctx)` and `initStructure(ctx)` with `initWorkspace(ctx)`. Replace every `refreshAllPanels()` call with `refreshWorkspace()`.

In `ui.js`, stop calling `buildToolbar()`, change Escape to call `window.__workspaceCloseTopLayer?.()` before leaving the editor, and keep the formatting bubble, slash menu, library, title, and shortcuts.

- [ ] **Step 5: Add the new visual foundation**

At the end of `style.css`, add a V2 section that owns `#editorView`, `#workspaceHeader`, `#workspaceBody`, `#main`, `#scroll`, `#page`, `.ProseMirror`, `.is-active-block`, `.icon-button`, `.workspace-path`, and reduced-motion behavior. Use fixed `--doc-size: 18px`, `--doc-width: 700px`, 8px maximum radii, cool neutral surfaces, mint and peach only for transient meaning.

- [ ] **Step 6: Build and run smoke**

Run:

```bash
cd app
npm run build
npm test
NODE_PATH="/Users/jakobschlenker/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules" node test/v2-smoke.mjs
```

Expected: base shell assertions pass; no console or page errors.

- [ ] **Step 7: Check the diff**

Run: `git diff --check -- app/index.html app/src/workspace.js app/src/editor.js app/src/ui.js app/src/style.css app/test/v2-smoke.mjs`

Expected: no output.

---

### Task 4: Preview-Based Structure Shelf and Block Creation

**Files:**
- Modify: `app/src/workspace.js`
- Modify: `app/src/style.css`
- Modify: `app/test/v2-smoke.mjs`

**Interfaces:**
- Consumes: `getEditorBlocks(editor)`, `insertSemanticBlock(editor, afterBlockId, role)`.
- Produces internal renderers: `renderStructureShelf()`, `renderInsertTrigger()`, `openInsertMenu(afterBlockId)`.

- [ ] **Step 1: Add failing shelf interaction tests**

```js
await page.locator('#workspacePath').click()
await expectVisible(page.locator('#structureShelf'))
assert.equal(await page.locator('#structureShelf .block-preview').count(), blockIds.length)
assert.equal(await page.locator('#structureShelf .black-spine, #structureShelf .status-dot').count(), 0)

const before = await page.locator('#editor .ProseMirror > [data-block-id]').count()
await page.locator('#structureShelf .block-insert').first().click()
await page.getByRole('button', { name: 'Gegenposition' }).click()
assert.equal(await page.locator('#editor .ProseMirror > [data-block-id]').count(), before + 1)
```

Define local helper:

```js
async function expectVisible(locator) {
  assert.equal(await locator.isVisible(), true)
}
```

- [ ] **Step 2: Run smoke and verify failure**

Expected: FAIL because the shelf has no previews or insertion controls.

- [ ] **Step 3: Render the non-modal shelf**

Each `.block-preview` is a button with `data-block-id`, a two-to-four-line real excerpt, and one secondary role line. Clicking it focuses the corresponding Tiptap node and scrolls it into view. Insert controls render between previews and call `openInsertMenu()`.

Use exactly these semantic choices:

```js
const BLOCK_TYPES = [
  ['paragraph', 'Freier Absatz'],
  ['claim', 'Kernbehauptung'],
  ['evidence', 'Beleg'],
  ['counterpoint', 'Gegenposition'],
  ['transition', 'Übergang'],
  ['question', 'Offene Frage'],
]
```

When the shelf opens, add `.shelf-open` to `#workspaceBody`; CSS changes the grid from `1fr` to `340px minmax(0, 1fr)` over 240ms. Never add a backdrop.

- [ ] **Step 4: Render the editor insertion trigger**

Place one `#blockInsertTrigger` relative to the active block's lower-left edge. Recompute its position on selection, editor update, scroll, and resize. Hide it while typing and reveal it on active-block hover or keyboard focus. Activating it uses the same semantic menu as the shelf.

- [ ] **Step 5: Verify creation and persistence**

Reload after insertion, reopen the shelf, and assert that the new preview and `semanticRole: 'counterpoint'` remain in stored HTML.

- [ ] **Step 6: Run all checks**

Run build, unit tests, smoke, and `git diff --check` for the modified files.

Expected: all pass.

---

### Task 5: Passage-Anchored Feedback and Explicit Suggestions

**Files:**
- Modify: `app/src/workspace.js`
- Modify: `app/src/style.css`
- Modify: `app/test/v2-smoke.mjs`

**Interfaces:**
- Consumes: `getFindingQueue(doc)`, `findBlockForTarget(blocks, target)`, `replaceFindingTarget(editor, target, replacement)`, `decideFinding(doc, id, decision)`.
- Produces internal renderers: `renderLocalFinding()`, `renderSuggestion(finding)`, `positionLocalSurface(blockId)`.

- [ ] **Step 1: Add failing local-feedback tests**

```js
const local = page.locator('#localAgentLayer [data-finding-id]')
assert.equal(await local.count(), 1)
assert.equal(await page.locator('#editor .anno-mark, #editor .anno-dot').count(), 0)
assert.equal(await local.getAttribute('data-block-id') !== null, true)

await local.click()
assert.equal(await local.locator('.local-finding-detail').isVisible(), true)
assert.equal(await local.getByText('Vorschlag', { exact: true }).count(), 0)
assert.equal(await local.getByText('Belege', { exact: true }).count(), 0)
assert.equal(await local.getByText('Besprechen', { exact: true }).count(), 0)
```

- [ ] **Step 2: Run smoke and verify failure**

Expected: FAIL because local feedback is not rendered by the new workspace.

- [ ] **Step 3: Render one current local finding**

Select the first ready passage finding from `getFindingQueue`. Resolve its block from actual editor snapshots. Add `.has-local-finding` to the full block, not an inline underline. Position a short natural-language note beside that block with one fine neutral connector. Clicking expands observation, relevance, and consequences.

For the prototype, a second click on a finding with `action` opens the suggestion; a finding with sources opens evidence; otherwise it opens local dialogue. Do not render three parallel labeled buttons.

- [ ] **Step 4: Render and apply the suggestion**

The suggestion stays below the block. Mark only old/new word groups with background fills. Use icon-only buttons with titles `Verwerfen`, `Eigene Fassung schreiben`, and `Übernehmen`.

On accept:

```js
const applied = replaceFindingTarget(ctx.editor, finding.target, finding.action)
if (applied) {
  decideFinding(doc, finding.id, { kind: 'accept', appliedText: finding.action })
  workspace.suggestionFindingId = null
  ctx.scheduleSave()
  refreshWorkspace()
}
```

On reject, call `decideFinding` with `{ kind: 'reject' }`; integrity findings become accepted risks through the existing model.

- [ ] **Step 5: Verify ownership and persistence**

Test that opening a suggestion does not change editor HTML, accepting changes exactly the target phrase, a decision is stored, and reload keeps the changed text and queue state.

- [ ] **Step 6: Run all checks**

Run build, unit tests, smoke, and `git diff --check`.

Expected: all pass.

---

### Task 6: Local Dialogue, Global Agent Widget, and Evidence Window

**Files:**
- Modify: `app/src/workspace-model.mjs`
- Modify: `app/src/example.js`
- Modify: `app/src/workspace.js`
- Modify: `app/src/style.css`
- Modify: `app/test/workspace-model.test.mjs`
- Modify: `app/test/v2-smoke.mjs`

**Interfaces:**
- Consumes: persisted `workspace.agent`, `shouldOpenAgentWidget`, finding sources.
- Produces: `appendThreadMessage(thread, role, text, at) -> message`
- Produces internal renderers: `renderLocalDialogue(finding)`, `renderAgentWidget()`, `renderEvidenceWindow(finding)`.

- [ ] **Step 1: Extend unit tests for chat message persistence**

```js
test('thread messages receive stable role and timestamp', () => {
  const thread = []
  const message = appendThreadMessage(thread, 'user', 'Ich meine die kognitive Begrenzung.', 42)
  assert.deepEqual(message, { id: 'message-42-0', role: 'user', text: 'Ich meine die kognitive Begrenzung.', at: 42 })
  assert.deepEqual(thread, [message])
})
```

- [ ] **Step 2: Seed one clearly exemplary global message**

Add `buildExampleAgentMessages()` in `example.js`:

```js
export function buildExampleAgentMessages() {
  return [{
    id: 'example-agent-initiative',
    status: 'new',
    earliestAt: 0,
    text: 'Beim Weiterlesen ist mir eine allgemeinere Frage aufgefallen: Soll der Text Aufmerksamkeit als individuelle Fähigkeit oder als gestaltete Bedingung behandeln?',
    thread: [{ id: 'message-example-0', role: 'agent', text: 'Beim Weiterlesen ist mir eine allgemeinere Frage aufgefallen: Soll der Text Aufmerksamkeit als individuelle Fähigkeit oder als gestaltete Bedingung behandeln?', at: 0 }],
  }]
}
```

Assign it to the example document's `workspace.agent.messages` during seeding. Increment `EX_VERSION` to `7`.

- [ ] **Step 3: Implement local dialogue**

The local thread grows from the passage note, keeps its connector, and contains agent/user messages plus one input. Submitting appends the user message and a clearly exemplary canned agent response. It persists in `finding.thread`. No global launcher appears.

- [ ] **Step 4: Implement the global widget**

The top-right `#agentPresence` is the only persistent agent affordance. The widget is 360-400px wide, rounded, inset from the right edge, and never full height. On a new message, schedule evaluation after editor input; open only when `shouldOpenAgentWidget` returns true. Record input time on every Tiptap update. Closing adds the message ID to `dismissedIds`; clicking the header icon reopens it manually.

Before and after opening, capture `editor.state.selection.from` and assert it is unchanged. Do not call `.focus()` from widget rendering.

- [ ] **Step 5: Implement contextual evidence**

Render the exact claim/target, source label/type, source excerpt, and direct source link in `#evidenceWindow`. It floats beside the writing canvas with rounded corners and no viewport-height panel styling. Clicking external links uses the existing safe `openExternal()` behavior or an equivalent `https?` guard.

- [ ] **Step 6: Add smoke coverage**

Test:

```js
const selectionBefore = await page.evaluate(() => AIWT.state.editor.state.selection.from)
await page.waitForTimeout(3300)
assert.equal(await page.locator('#agentWidget').isVisible(), true)
const selectionAfter = await page.evaluate(() => AIWT.state.editor.state.selection.from)
assert.equal(selectionAfter, selectionBefore)

await page.locator('#agentWidget input').fill('Die gestaltete Bedingung.')
await page.locator('#agentWidget form').press('Enter')
await page.locator('#agentWidget [data-close-agent]').click()
await page.reload({ waitUntil: 'networkidle' })
assert.equal(await page.locator('#agentWidget').isHidden(), true)
```

Also open a local dialogue and evidence window, then capture screenshots.

- [ ] **Step 7: Run all checks**

Run build, unit tests, smoke, and `git diff --check`.

Expected: all pass.

---

### Task 7: Responsive, Accessibility, and Final Regression Pass

**Files:**
- Modify: `app/src/style.css`
- Modify: `app/src/workspace.js`
- Modify: `app/test/v2-smoke.mjs`
- Modify: `CONTEXT.md`

**Interfaces:**
- Consumes all prior workspace interfaces.
- Produces the completed first interactive UI slice.

- [ ] **Step 1: Expand desktop and mobile smoke scenarios**

Cover these states at both viewports:

```js
const scenarios = [
  ['base', async page => {}],
  ['shelf', async page => page.locator('#workspacePath').click()],
  ['finding', async page => page.locator('#localAgentLayer [data-finding-id]').click()],
  ['agent', async page => page.locator('#agentPresence').click()],
  ['evidence', async page => page.locator('[data-open-evidence]').click()],
]
```

For each state assert:

```js
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
assert.ok(overflow <= 1, `Horizontal overflow in ${name}: ${overflow}px`)
```

- [ ] **Step 2: Add keyboard and reduced-motion checks**

Use `page.emulateMedia({ reducedMotion: 'reduce' })`, open shelf/widget, and assert computed transition duration is `0s` or at most `0.01s`. Tab to every icon-only control and assert it has a non-empty accessible name. Press Escape in order: evidence, agent widget, shelf, then editor-to-home.

- [ ] **Step 3: Polish responsive layout**

At widths below 760px:

- shelf is a binding first row in the workspace grid flow, never an overlay; it uses the full available width, no backdrop, and at most `min(38vh, 300px)` height;
- local notes flow below their block;
- agent and evidence widgets use left/right 12px and max-height 70%;
- header path truncates with ellipsis;
- no text or controls overlap.

At widths from 760px through 1199px, an open agent or evidence widget reserves a right-side layout track before it can collide with the writing canvas. The same clearance remains valid at wider desktop sizes.

Add `@media (prefers-reduced-motion: reduce)` covering shelf, local notes, suggestions, agent widget, evidence window, and active-block transitions.

- [ ] **Step 4: Remove unreachable old-surface initialization and stale copy**

Search:

```bash
rg -n "Cognit|Recherche aktuell|volle Kraft|railL|railR|pCoach|pStruct|buildRails\(|initPanels\(|initStructure\(" app/index.html app/src
```

Expected in reachable code: no provisional brand, status copy, rails, or old initialization. Old unused modules may remain for reference in this slice, but no import or DOM path may execute them.

- [ ] **Step 5: Update project context**

Add the implemented workspace architecture, interaction rules, test commands, and remaining mocked boundaries to `CONTEXT.md`. State explicitly that autonomous research and memory are not yet connected.

- [ ] **Step 6: Run final verification**

Run:

```bash
cd app
npm test
npm run build
NODE_PATH="/Users/jakobschlenker/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules" node test/v2-smoke.mjs
cd ..
git diff --check
```

Expected:

- all unit tests pass;
- esbuild succeeds;
- smoke prints `V2 smoke passed`;
- desktop/mobile screenshots exist for base, shelf, local finding, local dialogue, global agent widget, and evidence;
- `git diff --check` prints nothing.

- [ ] **Step 7: Start the local server for user testing**

Run: `cd app && python3 -m http.server 4173`

If port 4173 is occupied, choose the next free port. Report the exact URL and the deliberately mocked parts to the user.

---

## Self-Review Record

- **Spec coverage:** The plan covers reduced shell, block identity, framed preview shelf, block creation, local feedback depth, suggestion ownership, local dialogue, global agent initiative, evidence, persistence, motion, keyboard, and responsive behavior. Project foundation and final audit remain represented by existing data/spec but are intentionally deferred beyond this first combined interaction slice.
- **Scope:** Productive research, memory, consensus, final branding, full source import, and export profiles remain separate subsystems as required by the design spec.
- **Type consistency:** `WorkspaceState`, `BlockSnapshot`, editor block IDs, finding IDs, and agent message IDs have one owner and matching names across tasks.
- **Placeholder scan:** Every deferred subsystem is named under scope rather than left unspecified.

---

### Final Review Hardening: Ownership, Integrity, and Migration

Implemented after the final whole-slice review:

- example seeds use `exampleSeed`, `exampleSeedKey`, version, and body-signature markers; updates replace only untouched seed fixtures, preserve other project texts/material, and preserve an edited seed as user text before adding a fresh fixture;
- own-version editing persists across pauses and reloads and can only be decided through the explicit `Eigene Fassung abschliessen` action;
- suggestion replacements are inserted as plain ProseMirror text nodes;
- stale known anchors remain local, while ambiguous or missing anchors remain reachable in the global widget;
- rejecting integrity findings requires a separate, named risk confirmation and optional rationale;
- block IDs are validated and selector values are escaped;
- demo, unverified, and verified source states plus locators are explicit;
- the live editor schema excludes visual marks, image insertion, color, highlight, alignment, underline, and annotation commands;
- regression coverage includes seed upgrades, slow own-version editing, HTML-like replacement text, integrity confirmation, focus return, invalid IDs, source provenance, and 1024px collision checks.
