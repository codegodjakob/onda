# Universal Interface Review Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein lokales, wiederverwendbares Web-Overlay lässt Nutzer App-Elemente eindeutig auswählen, reversible Gestaltungs- und Textvarianten erproben und Änderungen oder Notizen so speichern, dass Codex sie sicher in echten Quellcode überführen und verifizieren kann.

**Architecture:** Ein dependency-freies ESM-Toolkit unter `tools/interface-review/` trennt Protokoll, atomaren Dateispeicher, lokalen HTTP-Adapter, CLI und Browser-Client. Der Browser-Client läuft in einem eigenen Shadow DOM; Onda injiziert ihn ausschließlich über `npm run dev`, während eine generische dynamische Fixture-App denselben Adaptervertrag unabhängig von Onda belegt.

**Tech Stack:** Node.js ESM, Node-Test-Runner, Vanilla DOM/Shadow DOM, lokales HTTP/SSE, Playwright und axe-core aus der bestehenden Onda-Entwicklungsumgebung.

## Global Constraints

- Das Toolkit bleibt unabhängig vom Onda-Datenmodell und besitzt im MVP keine Laufzeitabhängigkeit.
- Der MVP unterstützt browserbasierte Apps; SwiftUI und AppKit bleiben in der dokumentierten Ausbau-Roadmap.
- Das Panel ist auf Desktop 320 Pixel breit, rechts angedockt und einklappbar; unter 720 Pixel wird es zu einer unteren Fläche.
- Änderungen bleiben reversible Vorschauen, bis der Nutzer sie ausdrücklich zur Umsetzung freigibt.
- Erlaubte Vorschauen sind auf die in der Spezifikation benannten Layout-, Abstands-, Typografie-, Darstellungs- und einfachen Textwerte begrenzt.
- `.interface-review/` bleibt standardmäßig unversioniert.
- Die Brücke bindet ausschließlich an `127.0.0.1`, prüft Origin und kurzlebigen Sitzungsschlüssel und hat keine externe Netzwerkfunktion.
- Mehrdeutige oder verschwundene Elemente werden niemals geraten.
- Produktionsbuild, `Onda.app`, `app/index.html` und `app/dist/editor.bundle.js` bleiben frei von Overlay-Code und Review-Daten.
- Auswahlfeedback muss bei warmem lokalem Stand innerhalb von 100 Millisekunden erscheinen.
- Die visuelle Eval-Schleife ist auf drei Runden begrenzt; alle fünf Dimensionen müssen mindestens 4,5 von 5 erreichen.

## File Map

```text
tools/interface-review/
  package.json                         Paketgrenze, Exporte und CLI
  bin/interface-review.mjs             ausführbarer CLI-Einstieg
  src/protocol/records.mjs              Record-Schema, Erzeugung und Validierung
  src/protocol/matching.mjs             deterministisches Element-Matching
  src/server/store.mjs                  atomare projektlokale Speicherung
  src/server/adapter.mjs                Injektion, Authentisierung und HTTP-Routen
  src/server/verification.mjs           SSE-Aufträge und Verify-Antworten
  src/cli/run.mjs                       CLI-Parsing, Ausgabe und Exitcodes
  src/browser/index.js                  Browser-Bootstrap und Lebenszyklus
  src/browser/reference.js              DOM-Referenz und Wiederfinden
  src/browser/selection.js              Hover, Klick, Tastatur und Geometrie
  src/browser/preview.js                reversible Vorschau-Deltas
  src/browser/bridge.js                 lokale Browser-Server-Kommunikation
  src/browser/panel.js                  Inspector-Panel und Zustandsdarstellung
  src/browser/records.js                Änderungen, Notizen und Pins
  src/browser/styles.js                 vollständig isolierter Overlay-Stil
  test/protocol.test.mjs                Protokoll- und Matching-Verträge
  test/store.test.mjs                   Speicher- und Recovery-Verträge
  test/adapter.test.mjs                 HTTP-, Auth- und Injektionsverträge
  test/cli.test.mjs                     CLI- und Verify-Verträge
  test/preview.test.mjs                 exaktes Vorschau-/Reset-Verhalten
  test/helpers/served-host.mjs           generischer Host für Browser-Smokes
  test/fixtures/dynamic-app/*            Onda-unabhängige dynamische App
  README.md                              Integration und Bedienung

app/
  scripts/dev-server.mjs                Onda-Adapter und gemeinsamer Shutdown
  test/dev-server.test.mjs              Entwicklungs-/Produktionsabgrenzung
  test/interface-review-smoke.mjs       Browservertrag für Fixture und Onda
  package.json                          vollständige Testsuite

docs/evals/
  interface-review-mvp-evidence.md      harte Tore und maximal drei Eval-Runden
```

---

### Task 1: Versioniertes Review-Protokoll und eindeutiges Matching

**Files:**
- Create: `tools/interface-review/package.json`
- Create: `tools/interface-review/src/protocol/records.mjs`
- Create: `tools/interface-review/src/protocol/matching.mjs`
- Create: `tools/interface-review/test/protocol.test.mjs`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: keine frühere Aufgabe.
- Produces: `createRecord(input, options)`, `validateRecord(value)`, `sanitizeElementReference(value)`, `scoreReference(reference, candidate)` und `resolveReference(reference, candidates, options)`.

- [ ] **Step 1: Write the failing protocol tests**

```js
// tools/interface-review/test/protocol.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createRecord, validateRecord, sanitizeElementReference,
} from '../src/protocol/records.mjs'
import { resolveReference } from '../src/protocol/matching.mjs'

const element = {
  role: 'region', name: 'Wortwahl', tag: 'aside', pathname: '/',
  textHint: 'Doppelt abgeschwächt', stableAttributes: { 'data-testid': 'annotation' },
  ancestors: [{ role: 'main', name: 'Schreibraum' }],
}

test('Änderung erhält Status und validierte Vorschau', () => {
  const record = createRecord({
    projectId: 'onda', kind: 'change', element,
    request: 'Weniger Rundung',
    preview: [{ property: 'border-radius', before: '8px', after: '4px' }],
  }, { id: () => 'ir_test', now: () => '2026-08-06T21:00:00.000Z' })
  assert.equal(record.id, 'ir_test')
  assert.equal(record.status, 'open')
  assert.equal(validateRecord(record).ok, true)
})

test('Notiz besitzt absichtlich keinen Arbeitsstatus', () => {
  const record = createRecord({ projectId: 'onda', kind: 'note', element, request: 'Wirkt schwer' })
  assert.equal('status' in record, false)
  assert.equal(validateRecord(record).ok, true)
})

test('sensible und überlange Elementwerte werden nicht gespeichert', () => {
  const safe = sanitizeElementReference({
    ...element,
    value: 'sk-ant-secret',
    inputType: 'password',
    textHint: 'x'.repeat(400),
  })
  assert.equal('value' in safe, false)
  assert.equal(safe.textHint.length, 160)
})

test('Matching akzeptiert nur einen deutlichen besten Treffer', () => {
  const exact = { ...element, key: 'exact' }
  const weak = { ...element, key: 'weak', name: 'Andere Karte', textHint: 'Anderer Text' }
  assert.equal(resolveReference(element, [weak, exact]).match.key, 'exact')
  assert.equal(resolveReference(element, [exact, { ...exact, key: 'copy' }]).state, 'ambiguous')
  assert.equal(resolveReference(element, []).state, 'not_found')
})
```

- [ ] **Step 2: Run the focused test and witness RED**

Run: `node --test tools/interface-review/test/protocol.test.mjs`

Expected: FAIL because the protocol modules do not exist.

- [ ] **Step 3: Implement the protocol boundary**

Create `tools/interface-review/package.json`:

```json
{
  "name": "@local/interface-review",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "exports": {
    "./protocol": "./src/protocol/records.mjs",
    "./matching": "./src/protocol/matching.mjs",
    "./server": "./src/server/adapter.mjs"
  },
  "bin": { "interface-review": "./bin/interface-review.mjs" },
  "scripts": { "test": "node --test test/*.test.mjs" }
}
```

Implement `records.mjs` with these exact limits and states:

```js
export const PROTOCOL_VERSION = 1
export const CHANGE_STATUSES = Object.freeze(['open', 'in_progress', 'resolved'])
export const PREVIEW_PROPERTIES = Object.freeze([
  'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'gap',
  'align-items', 'align-self', 'justify-content', 'justify-self',
  'font-size', 'font-weight', 'line-height', 'letter-spacing',
  'color', 'background-color', 'border-color', 'border-width', 'border-style',
  'border-radius', 'opacity', 'text-content',
])
export const MAX_TEXT_HINT = 160
export const MAX_REQUEST = 4000

export function sanitizeElementReference(input) {
  const textHint = String(input?.textHint ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_HINT)
  const stableAttributes = Object.fromEntries(Object.entries(input?.stableAttributes ?? {})
    .filter(([key, value]) => ['id', 'data-testid', 'data-interface-review-id'].includes(key) && String(value).length <= 120))
  return {
    pathname: String(input?.pathname || '/'), tag: String(input?.tag || '').toLowerCase(),
    role: String(input?.role || ''), name: String(input?.name || '').slice(0, 160),
    textHint, stableAttributes,
    ancestors: Array.isArray(input?.ancestors) ? input.ancestors.slice(0, 4).map(item => ({
      role: String(item?.role || ''), name: String(item?.name || '').slice(0, 120),
    })) : [],
  }
}

export function createRecord(input, {
  id = () => `ir_${crypto.randomUUID()}`,
  now = () => new Date().toISOString(),
} = {}) {
  const timestamp = now()
  const record = {
    protocolVersion: PROTOCOL_VERSION,
    id: id(), projectId: String(input.projectId), kind: input.kind,
    page: { pathname: String(input.element?.pathname || '/') },
    element: sanitizeElementReference(input.element),
    request: String(input.request || '').trim().slice(0, MAX_REQUEST),
    preview: Array.isArray(input.preview) ? input.preview.map(delta => ({
      property: String(delta.property), before: String(delta.before), after: String(delta.after),
    })) : [],
    resolution: { state: 'matched', score: 1 },
    createdAt: timestamp, updatedAt: timestamp,
  }
  if (input.kind === 'change') record.status = 'open'
  const validation = validateRecord(record)
  if (!validation.ok) throw new TypeError(validation.errors.join('; '))
  return record
}
```

Complete `validateRecord` so it rejects unknown versions, kinds outside `change|note`, missing IDs/project IDs/requests, status on notes, missing valid status on changes, preview properties outside `PREVIEW_PROPERTIES` and non-string deltas. Implement `matching.mjs` with fixed weighted signals (`review-id 0.45`, unique id/test-id `0.30`, role/name `0.15`, text `0.07`, ancestors `0.03`), default `minScore: 0.82` and `ambiguityGap: 0.08`.

Add `.interface-review/` to `.gitignore` on its own line.

- [ ] **Step 4: Run the protocol tests and verify GREEN**

Run: `node --test tools/interface-review/test/protocol.test.mjs`

Expected: 4 tests, 4 passed, 0 failed.

- [ ] **Step 5: Commit the protocol**

```bash
git add .gitignore tools/interface-review/package.json tools/interface-review/src/protocol tools/interface-review/test/protocol.test.mjs
git commit -m "feat(review): versioniertes Overlay-Protokoll anlegen"
```

---

### Task 2: Atomarer projektlokaler Speicher

**Files:**
- Create: `tools/interface-review/src/server/store.mjs`
- Create: `tools/interface-review/test/store.test.mjs`

**Interfaces:**
- Consumes: `validateRecord(value)` aus Task 1.
- Produces: `createReviewStore({ projectRoot, now })` mit `initialize`, `writeCurrent`, `readCurrent`, `create`, `get`, `list`, `setStatus`, `setResolution`, `writeSession`, `readSession` und `closeSession`.

- [ ] **Step 1: Write failing store and recovery tests**

```js
// tools/interface-review/test/store.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createRecord } from '../src/protocol/records.mjs'
import { createReviewStore } from '../src/server/store.mjs'

const reference = { pathname: '/', role: 'button', name: 'Neu', tag: 'button' }

test('Speicher schreibt Current und Records atomar', async t => {
  const root = await mkdtemp(join(tmpdir(), 'interface-review-store-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const store = createReviewStore({ projectRoot: root })
  await store.initialize()
  await store.writeCurrent(reference)
  const record = createRecord({ projectId: 'fixture', kind: 'note', element: reference, request: 'Prüfen' })
  await store.create(record)
  assert.equal((await store.readCurrent()).name, 'Neu')
  assert.equal((await store.get(record.id)).request, 'Prüfen')
  assert.equal((await store.list()).length, 1)
  assert.equal((await readFile(resolve(root, '.interface-review/records', `${record.id}.json`), 'utf8')).includes('Prüfen'), true)
})

test('beschädigter Record bleibt isoliert', async t => {
  const root = await mkdtemp(join(tmpdir(), 'interface-review-corrupt-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const store = createReviewStore({ projectRoot: root })
  await store.initialize()
  await writeFile(resolve(root, '.interface-review/records/broken.json'), '{')
  const result = await store.list({ includeInvalid: true })
  assert.equal(result[0].valid, false)
})

test('Notiz kann keinen Arbeitsstatus erhalten', async t => {
  const root = await mkdtemp(join(tmpdir(), 'interface-review-status-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const store = createReviewStore({ projectRoot: root })
  await store.initialize()
  const note = createRecord({ projectId: 'fixture', kind: 'note', element: reference, request: 'Merken' })
  await store.create(note)
  await assert.rejects(store.setStatus(note.id, 'resolved'), /Notiz/)
})
```

- [ ] **Step 2: Run the focused store test and witness RED**

Run: `node --test tools/interface-review/test/store.test.mjs`

Expected: FAIL because `store.mjs` does not exist.

- [ ] **Step 3: Implement the atomic store**

Use one private `atomicJson(path, value)` function:

```js
async function atomicJson(target, value) {
  const temporary = `${target}.${process.pid}.${crypto.randomUUID()}.tmp`
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 })
  await rename(temporary, target)
}
```

`initialize()` creates `.interface-review/records` and `.interface-review/archive`. `list({ kind, status, includeInvalid = false } = {})` sorts valid records by `createdAt`, applies optional kind/status filters and returns invalid files only when `includeInvalid` is true. `setStatus()` permits only the three Task-1 states on `kind: change`. `setResolution()` only accepts `matched|ambiguous|not_found|invalid`. `writeSession()` stores `{ protocolVersion, projectId, baseUrl, token, pid, startedAt }` with mode `0600`; `closeSession()` removes only `session.json`.

- [ ] **Step 4: Run store plus protocol tests and verify GREEN**

Run: `node --test tools/interface-review/test/protocol.test.mjs tools/interface-review/test/store.test.mjs`

Expected: 7 tests, 7 passed, 0 failed.

- [ ] **Step 5: Commit the store**

```bash
git add tools/interface-review/src/server/store.mjs tools/interface-review/test/store.test.mjs
git commit -m "feat(review): lokale Review-Daten atomar speichern"
```

---

### Task 3: Sicherer Host-Adapter und Browsermodul-Auslieferung

**Files:**
- Create: `tools/interface-review/src/server/adapter.mjs`
- Create: `tools/interface-review/src/server/verification.mjs`
- Create: `tools/interface-review/test/adapter.test.mjs`
- Create: `tools/interface-review/src/browser/index.js`

**Interfaces:**
- Consumes: `createReviewStore` aus Task 2.
- Produces: `createInterfaceReviewAdapter({ projectRoot, projectId, allowedOrigin, token, logger })` mit `inject(html)`, `handle(request, response)`, `attach(baseUrl)` und `close()`.

- [ ] **Step 1: Write failing injection, auth and path tests**

```js
// zentrale Assertions in tools/interface-review/test/adapter.test.mjs
import { createServer } from 'node:http'

async function serveAdapter(adapter) {
  const http = createServer(async (request, response) => {
    if (await adapter.handle(request, response)) return
    response.writeHead(404).end()
  })
  await new Promise(resolveListening => http.listen(0, '127.0.0.1', resolveListening))
  const url = `http://127.0.0.1:${http.address().port}/`
  return { url, close: () => new Promise(resolveClosed => http.close(resolveClosed)) }
}

const adapter = await createInterfaceReviewAdapter({
  projectRoot: root, projectId: 'fixture', token: 'test-token',
})
const server = await serveAdapter(adapter)
await adapter.attach(server.url)
assert.match(adapter.inject('<body><main>App</main></body>'), /data-interface-review-client/)
assert.doesNotMatch('<body><main>App</main></body>', /interface-review/)

const unauthorized = await fetch(new URL('__interface_review/api/current', server.url))
assert.equal(unauthorized.status, 401)

const authorized = await fetch(new URL('__interface_review/api/current', server.url), {
  headers: { 'x-interface-review-token': 'test-token', origin: new URL(server.url).origin },
})
assert.equal(authorized.status, 204)

const moduleResponse = await fetch(new URL('__interface_review/modules/index.js', server.url))
assert.match(moduleResponse.headers.get('content-type'), /^text\/javascript/)
assert.equal((await fetch(new URL('__interface_review/modules/%2e%2e/server/store.mjs', server.url))).status, 403)
```

Add separate tests for body limit `64 KiB`, wrong Origin, `POST /api/current`, and `close()` removing `session.json`.

- [ ] **Step 2: Run the adapter test and witness RED**

Run: `node --test tools/interface-review/test/adapter.test.mjs`

Expected: FAIL because adapter and verification modules do not exist.

- [ ] **Step 3: Implement the adapter contract**

Use these routes only:

```text
GET  /__interface_review/modules/<browser-module>
GET  /__interface_review/protocol/<protocol-module>
GET  /__interface_review/api/current
POST /__interface_review/api/current
GET  /__interface_review/api/records
POST /__interface_review/api/records
GET  /__interface_review/api/records/<id>
PATCH /__interface_review/api/records/<id>/status
GET  /__interface_review/events?token=<session-token>
POST /__interface_review/api/verify/<id>
POST /__interface_review/api/verification/<request-id>
```

`inject(html)` adds exactly one module script before `</body>`:

```html
<script type="module" data-interface-review-client
  data-project-id="fixture" data-token="SESSION_TOKEN"
  src="/__interface_review/modules/index.js"></script>
```

Serve browser modules only after `resolve(browserRoot, relative)` remains within `browserRoot`, and protocol modules only after the equivalent check within `protocolRoot`; accept only `.js` and `.mjs`. All API routes except module delivery require the correct token; mutating routes also require exact allowed Origin. `attach(baseUrl)` validates a loopback HTTP URL, establishes the exact allowed Origin and writes the session file. `verification.mjs` owns SSE clients, pending request IDs and a 2-second timeout.

Keep the initial `browser/index.js` side effect limited to:

```js
const script = document.querySelector('script[data-interface-review-client]')
if (script && !window.__interfaceReviewLoaded) {
  window.__interfaceReviewLoaded = true
  document.documentElement.dataset.interfaceReviewAvailable = 'true'
}
```

- [ ] **Step 4: Run all Node contracts and verify GREEN**

Run: `node --test tools/interface-review/test/*.test.mjs`

Expected: all protocol, store and adapter tests pass with zero failures.

- [ ] **Step 5: Commit the server adapter**

```bash
git add tools/interface-review/src/server tools/interface-review/src/browser/index.js tools/interface-review/test/adapter.test.mjs
git commit -m "feat(review): sicheren lokalen Overlay-Adapter bereitstellen"
```

---

### Task 4: Agentenfähige CLI und Verify-Rückkanal

**Files:**
- Create: `tools/interface-review/src/cli/run.mjs`
- Create: `tools/interface-review/bin/interface-review.mjs`
- Create: `tools/interface-review/test/cli.test.mjs`
- Modify: `tools/interface-review/src/server/adapter.mjs`
- Modify: `tools/interface-review/src/server/verification.mjs`

**Interfaces:**
- Consumes: Store-API und Review-HTTP-Vertrag aus Tasks 2–3.
- Produces: `runCli(argv, { cwd, stdout, stderr, fetchImpl }) => Promise<number>` und die fünf dokumentierten CLI-Befehle.

- [ ] **Step 1: Write failing CLI behavior tests**

Test human and `--json` output for `current`, `list`, `show`, `status`; assert exit codes:

```js
export const EXIT = Object.freeze({
  ok: 0, notFound: 2, ambiguous: 3, invalid: 4, bridgeUnavailable: 5,
})
```

For `verify`, start the adapter, open its SSE stream in the test, read one `event: verify`, post `{ requestId, recordId, state: 'matched', score: 1, satisfied: true }`, and assert that the CLI returns `0` and changes the record to `resolved`. A timed-out bridge must return `5` and leave status unchanged.

- [ ] **Step 2: Run the CLI test and witness RED**

Run: `node --test tools/interface-review/test/cli.test.mjs`

Expected: FAIL because the CLI modules do not exist.

- [ ] **Step 3: Implement command parsing and verification**

`runCli` accepts only these shapes:

```text
current [--json]
list [--status open|in_progress|resolved] [--kind change|note] [--json]
show <id> [--json]
verify <id> [--json]
status <id> <open|in_progress|resolved>
```

Unknown flags or missing operands print one-line usage to stderr and return `4`. JSON mode writes one JSON value plus newline and no prose. `verify` reads `.interface-review/session.json`, sends the stored token in `x-interface-review-token`, and maps server states to `EXIT`. Only `{ state:'matched', satisfied:true }` invokes `store.setStatus(id, 'resolved')` inside the adapter.

The executable entry is exactly:

```js
#!/usr/bin/env node
import { runCli } from '../src/cli/run.mjs'
process.exitCode = await runCli(process.argv.slice(2), {
  cwd: process.cwd(), stdout: process.stdout, stderr: process.stderr, fetchImpl: fetch,
})
```

Set the executable bit with `chmod +x tools/interface-review/bin/interface-review.mjs` before the focused test.

- [ ] **Step 4: Run all Node contracts and verify GREEN**

Run: `node --test tools/interface-review/test/*.test.mjs`

Expected: all tests pass; verify timeout and success paths leave no pending handles.

- [ ] **Step 5: Commit the CLI**

```bash
git add tools/interface-review/bin tools/interface-review/src/cli tools/interface-review/src/server tools/interface-review/test/cli.test.mjs
git commit -m "feat(review): Auswahl und Auftraege per CLI zugaenglich machen"
```

---

### Task 5: DOM-Referenz, Auswahlmodus und Wiederfinden

**Files:**
- Create: `tools/interface-review/src/browser/reference.js`
- Create: `tools/interface-review/src/browser/selection.js`
- Create: `tools/interface-review/src/browser/bridge.js`
- Create: `tools/interface-review/test/helpers/served-host.mjs`
- Create: `tools/interface-review/test/fixtures/dynamic-app/index.html`
- Create: `tools/interface-review/test/fixtures/dynamic-app/app.js`
- Create: `tools/interface-review/test/fixtures/dynamic-app/style.css`
- Create: `app/test/interface-review-smoke.mjs`
- Modify: `tools/interface-review/src/browser/index.js`

**Interfaces:**
- Consumes: module routes and `POST /api/current` aus Task 3; Matching aus Task 1 wird als Browsermodul ausgeliefert.
- Produces: `referenceForElement(element)`, `resolveInDocument(reference)`, `createSelectionController(options)` und `createBridge(config)`.

- [ ] **Step 1: Create a failing browser selection smoke**

The fixture contains a real button, two similar cards, an excluded subtree and a `replace target` action. The smoke must assert:

```js
await page.goto(server.url)
await page.keyboard.press('Meta+Shift+E')
await page.locator('[data-interface-review-id="primary-card"]').click()
await page.locator('[data-interface-review-panel]').waitFor({ state: 'visible' })
const current = await store.readCurrent()
assert.equal(current.stableAttributes['data-interface-review-id'], 'primary-card')
assert.equal(current.role, 'region')

await page.keyboard.press('Meta+Shift+E')
await page.getByRole('button', { name: 'Ziel ersetzen' }).click()
await page.keyboard.press('Meta+Shift+E')
const resolution = await page.evaluate(reference => window.__interfaceReview.resolve(reference), current)
assert.equal(resolution.state, 'matched')
```

Use the open Shadow DOM defined by the spec for inspectability and accessibility testing. Treat it as diagnostics surface, not as a public integration API.

- [ ] **Step 2: Run the browser smoke and witness RED**

Run: `cd app && node test/interface-review-smoke.mjs --section selection`

Expected: FAIL because the selection controller and panel marker do not exist.

- [ ] **Step 3: Implement reference and selection behavior**

`referenceForElement` must:

- derive role from explicit role or native semantics
- derive accessible name from `aria-label`, associated label, `alt`, title or normalized text
- keep only `id`, `data-testid` and `data-interface-review-id`
- exclude values from `input[type=password]` and marked secret fields
- capture at most four semantic ancestors

`createSelectionController` installs listeners through one `AbortController`. `⌘⇧E` toggles; `Escape` clears; pointer hover draws a rectangle; click in design mode prevents the host action and calls `onSelect`. Holding Space sets pass-through unless an input, textarea or contenteditable owns focus. `destroy()` aborts every listener and removes markers.

Create the fixture with this behavior:

```html
<!-- test/fixtures/dynamic-app/index.html -->
<main>
  <section data-interface-review-id="primary-card" aria-label="Primary card"><p id="target-copy">Calm interface</p></section>
  <section aria-label="Similar card"><p>Calm interface</p></section>
  <button id="replaceTarget">Ziel ersetzen</button>
  <div data-interface-review-exclude><button>Overlay-fremd</button></div>
</main>
<link rel="stylesheet" href="./style.css">
<script type="module" src="./app.js"></script>
```

```js
// test/fixtures/dynamic-app/app.js
document.querySelector('#replaceTarget').addEventListener('click', () => {
  const current = document.querySelector('[data-interface-review-id="primary-card"]')
  const replacement = current.cloneNode(true)
  replacement.querySelector('p').textContent = 'Calm interface, replaced'
  current.replaceWith(replacement)
  history.pushState({}, '', '/replaced')
})
```

```css
/* test/fixtures/dynamic-app/style.css */
* { box-sizing: border-box; }
section { width: 280px; margin: 24px; padding: 24px; border: 1px solid #333; border-radius: 8px; }
[data-hostile-css] * { all: unset !important; color: magenta !important; }
```

`served-host.mjs` must expose the same adapter contract without Onda:

```js
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, relative, resolve } from 'node:path'
import { createInterfaceReviewAdapter } from '../../src/server/adapter.mjs'

const MIME = Object.freeze({ '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript' })
const mimeFor = target => `${MIME[extname(target)] || 'application/octet-stream'}; charset=utf-8`

export async function startServedHost({ fixtureRoot, projectRoot, projectId = 'fixture' }) {
  const adapter = await createInterfaceReviewAdapter({ projectRoot, projectId })
  const server = createServer(async (request, response) => {
    if (await adapter.handle(request, response)) return
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
    const requested = pathname === '/' || pathname === '/replaced' ? 'index.html' : pathname.slice(1)
    const target = resolve(fixtureRoot, requested)
    if (relative(fixtureRoot, target).startsWith('..')) {
      response.writeHead(403).end()
      return
    }
    try {
      const source = await readFile(target)
      const body = target.endsWith('index.html') ? adapter.inject(source.toString('utf8')) : source
      response.writeHead(200, { 'content-type': mimeFor(target) }).end(body)
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise(resolveListening => server.listen(0, '127.0.0.1', resolveListening))
  const url = `http://127.0.0.1:${server.address().port}/`
  await adapter.attach(url)
  return {
    url,
    adapter,
    store: adapter.store,
    async close() {
      await adapter.close()
      await new Promise(resolveClosed => server.close(resolveClosed))
    },
  }
}
```

Expose only this diagnostics object for local tooling and tests:

```js
window.__interfaceReview = Object.freeze({
  get active() { return controller.active },
  resolve: reference => resolveInDocument(reference),
})
```

- [ ] **Step 4: Run focused Node and browser tests**

Run:

```bash
node --test tools/interface-review/test/*.test.mjs
cd app && node test/interface-review-smoke.mjs --section selection
```

Expected: all Node tests pass and the selection smoke prints `INTERFACE REVIEW selection: PASS`.

- [ ] **Step 5: Commit selection**

```bash
git add tools/interface-review/src/browser tools/interface-review/test/helpers tools/interface-review/test/fixtures app/test/interface-review-smoke.mjs
git commit -m "feat(review): App-Elemente eindeutig auswaehlen"
```

---

### Task 6: Reversible und begrenzte Vorschau-Engine

**Files:**
- Create: `tools/interface-review/src/browser/preview.js`
- Create: `tools/interface-review/test/preview.test.mjs`
- Modify: `app/test/interface-review-smoke.mjs`

**Interfaces:**
- Consumes: aktuell ausgewähltes Element aus Task 5.
- Produces: `createPreviewSession(element, options)` mit `applyStyle`, `applyText`, `resetProperty`, `resetAll`, `deltas` und `destroy`.

- [ ] **Step 1: Write failing pure preview tests**

Use a small fake element/style object and assert:

```js
const session = createPreviewSession(element)
assert.equal(session.applyStyle('border-radius', '4px').ok, true)
assert.equal(element.style.getPropertyValue('border-radius'), '4px')
assert.deepEqual(session.deltas, [{ property: 'border-radius', before: '8px', after: '4px' }])
session.resetAll()
assert.equal(element.style.getPropertyValue('border-radius'), '8px')

assert.equal(session.applyStyle('background-image', 'url(https://example.com/x)').ok, false)
assert.equal(session.applyStyle('position', 'absolute').ok, false)
assert.equal(session.applyText('<b>Nein</b>').ok, true)
assert.equal(element.textContent, '<b>Nein</b>')
```

Add tests for empty values, `calc()` rejection, numeric range limits, per-property reset and exact restoration of an originally absent inline property.

- [ ] **Step 2: Run the preview test and witness RED**

Run: `node --test tools/interface-review/test/preview.test.mjs`

Expected: FAIL because `preview.js` does not exist.

- [ ] **Step 3: Implement allowlisted preview parsing**

Import `PREVIEW_PROPERTIES` from the protocol module and build a frozen `PROPERTY_RULES` map that covers exactly that list. Length values accept `px|rem|em|%|ch|vw|vh` within `-2000..4000`; opacity accepts `0..1`; color accepts hex, rgb(a), hsl(a), `transparent`, `currentColor` and CSS custom properties matching `var(--safe-name)`. Reject semicolons, braces, URLs, `calc`, `expression` and control characters before property-specific parsing.

Store both original inline value and priority. Text preview is only allowed when the element has no child element and is not input, textarea, script, style or contenteditable. `resetAll` runs in reverse delta order and clears the delta list.

- [ ] **Step 4: Run preview contracts and browser reset smoke**

Run:

```bash
node --test tools/interface-review/test/preview.test.mjs
cd app && node test/interface-review-smoke.mjs --section preview
```

Expected: all preview tests pass; browser smoke proves immediate visual change and exact reset.

- [ ] **Step 5: Commit the preview engine**

```bash
git add tools/interface-review/src/browser/preview.js tools/interface-review/test/preview.test.mjs app/test/interface-review-smoke.mjs
git commit -m "feat(review): reversible Interface-Vorschauen ermoeglichen"
```

---

### Task 7: Festes zugängliches Inspector-Panel

**Files:**
- Create: `tools/interface-review/src/browser/panel.js`
- Create: `tools/interface-review/src/browser/styles.js`
- Modify: `tools/interface-review/src/browser/index.js`
- Modify: `tools/interface-review/src/browser/selection.js`
- Modify: `app/test/interface-review-smoke.mjs`

**Interfaces:**
- Consumes: Selection Controller und Preview Session aus Tasks 5–6.
- Produces: `createInspectorPanel({ onPreview, onReset, onCreateRecord, onClose })` mit `showSelection`, `showConnection`, `showRecords`, `collapse` und `destroy`.

- [ ] **Step 1: Extend the browser smoke with failing panel assertions**

Assert accessible regions and behavior through the open Shadow DOM:

```js
const panel = page.locator('[data-interface-review-root]').locator('[data-interface-review-panel]')
assert.equal(await panel.getByRole('heading', { name: 'Auswahl' }).isVisible(), true)
assert.equal(await panel.getByLabel('Breite').inputValue(), expectedWidth)
await panel.getByLabel('Radius').fill('4px')
await panel.getByRole('button', { name: 'Zurücksetzen' }).click()
await panel.getByRole('button', { name: 'Panel einklappen' }).click()
assert.equal(await panel.getAttribute('data-collapsed'), 'true')
```

At 320 pixels assert the panel has `data-placement="bottom"`; at 200 percent browser zoom assert Close, Reset and Comment actions remain in the viewport.

- [ ] **Step 2: Run the panel smoke and witness RED**

Run: `cd app && node test/interface-review-smoke.mjs --section panel`

Expected: FAIL because the real panel and controls do not exist.

- [ ] **Step 3: Build the isolated panel**

`styles.js` exports one CSS string rooted at `:host` with its own system font, neutral color tokens, focus ring, 320-pixel fixed right panel and `@media (max-width: 719px)` bottom placement. Set `all: initial` only on the top overlay container, then explicitly restore box sizing and inherited typography inside the Shadow DOM.

`panel.js` builds DOM with `createElement`, never `innerHTML` from app or comment content. It exposes these labels verbatim: `Designmodus`, `Auswahl`, `Gestaltung`, `Inhalt`, `Kommentare`, `Sitzung`, `Panel einklappen`, `Designmodus schließen`, `Zurücksetzen`, `Zur Umsetzung freigeben`.

Controls render only when the selected property is meaningful. Every control reports validation next to the field through `aria-describedby`. Panel focus stays inside only while a modal confirmation is visible; normal panel navigation is not a focus trap.

- [ ] **Step 4: Run browser, accessibility and host-collision checks**

Run: `cd app && node test/interface-review-smoke.mjs --section panel`

Expected: `INTERFACE REVIEW panel: PASS`, no axe serious/critical violations, host CSS collision fixture leaves panel contract values unchanged.

- [ ] **Step 5: Commit the panel**

```bash
git add tools/interface-review/src/browser app/test/interface-review-smoke.mjs
git commit -m "feat(review): festes Inspector-Panel hinzufuegen"
```

---

### Task 8: Änderungen, Notizen, Pins und Offline-Erholung

**Files:**
- Create: `tools/interface-review/src/browser/records.js`
- Modify: `tools/interface-review/src/browser/bridge.js`
- Modify: `tools/interface-review/src/browser/panel.js`
- Modify: `tools/interface-review/src/browser/index.js`
- Modify: `app/test/interface-review-smoke.mjs`

**Interfaces:**
- Consumes: Records-API aus Task 3, Preview-Deltas aus Task 6 und Panel aus Task 7.
- Produces: `createRecordController({ bridge, panel, locate, layer })` mit `load`, `createChange`, `createNote`, `refreshPins`, `setStatus` und `destroy`.

- [ ] **Step 1: Add failing persistence and offline browser scenarios**

The smoke creates one preview change and one note, reloads, and asserts:

```js
assert.equal((await store.list({ kind: 'change' })).length, 1)
assert.equal((await store.list({ kind: 'note' })).length, 1)
await page.reload()
assert.equal(await page.locator('[data-interface-review-pin]').count(), 2)
assert.match(await page.getByRole('region', { name: 'Sitzung' }).textContent(), /1 offene Änderung/)
```

Then close the adapter while the page remains open. Selection and preview must still work; `Zur Umsetzung freigeben` is disabled, `Lokal getrennt` is visible, and `Review-Datensatz als JSON kopieren` remains enabled.

- [ ] **Step 2: Run the records smoke and witness RED**

Run: `cd app && node test/interface-review-smoke.mjs --section records`

Expected: FAIL because no record controller or pins exist.

- [ ] **Step 3: Implement records and recovery behavior**

`bridge.js` wraps fetch with a 1500-millisecond timeout and returns discriminated results:

```js
{ ok: true, value }
{ ok: false, reason: 'offline' | 'unauthorized' | 'invalid' | 'server', message }
```

Never retry mutations automatically. `records.js` creates a change only when preview deltas exist and request text is non-empty; a note requires request text and ignores status. Pins render the record index and accessible label, use `pointer-events:auto`, and update after scroll/resize through one animation-frame scheduler. Ambiguous/not-found records move into the session list with `Element erneut auswählen` and no pin.

JSON copy output passes through `validateRecord` and excludes session token, port and full origin.

- [ ] **Step 4: Run complete generic browser smoke**

Run: `cd app && node test/interface-review-smoke.mjs --section records`

Expected: persistence, reload, pin positioning and offline recovery all pass without console errors.

- [ ] **Step 5: Commit review records**

```bash
git add tools/interface-review/src/browser app/test/interface-review-smoke.mjs
git commit -m "feat(review): Aenderungen und Notizen am Element speichern"
```

---

### Task 9: Dynamische Wiederzuordnung und End-to-End-Verifikation

**Files:**
- Modify: `tools/interface-review/src/browser/reference.js`
- Modify: `tools/interface-review/src/browser/records.js`
- Modify: `tools/interface-review/src/browser/bridge.js`
- Modify: `tools/interface-review/src/server/verification.mjs`
- Modify: `tools/interface-review/test/fixtures/dynamic-app/app.js`
- Modify: `app/test/interface-review-smoke.mjs`

**Interfaces:**
- Consumes: SSE-Verify-Protokoll aus Task 4 und Browser-Resolver aus Task 5.
- Produces: vollständiger `verify`-Ablauf mit `matched+satisfied`, `matched+unsatisfied`, `ambiguous`, `not_found` und `bridge_unavailable`.

- [ ] **Step 1: Add failing dynamic and verify scenarios**

Test these independent cases:

1. Framework-like DOM replacement preserves `data-interface-review-id` and remaps the pin.
2. Removing the target yields `not_found`.
3. Duplicating an equally strong target yields `ambiguous`.
4. A CLI verify request arrives through SSE and the browser posts exactly one result.
5. Expected style/text mismatch returns `satisfied:false` and leaves the record open.
6. Client-side `history.pushState` changes route and refreshes record visibility.

- [ ] **Step 2: Run dynamic smoke and witness RED**

Run: `cd app && node test/interface-review-smoke.mjs --section recovery`

Expected: at least the SSE verification and route-change scenarios fail.

- [ ] **Step 3: Complete resolver lifecycle and verification**

Listen to `popstate` and patch `history.pushState`/`replaceState` with wrappers that dispatch one private navigation event while preserving return values and `this`. Use one `MutationObserver` only while Design Mode or unresolved records are present, debounced to one animation frame.

The verification event payload contains only `requestId`, `recordId`, `page` and sanitized element/preview expectations. Browser response must be:

```js
{
  requestId, recordId,
  state: 'matched' | 'ambiguous' | 'not_found' | 'invalid',
  score, satisfied,
  observed: [{ property, value }],
}
```

`observed` is limited to requested properties. Server rejects duplicate, expired or unknown request IDs.

- [ ] **Step 4: Run CLI, adapter and recovery verification**

Run:

```bash
node --test tools/interface-review/test/adapter.test.mjs tools/interface-review/test/cli.test.mjs
cd app && node test/interface-review-smoke.mjs --section recovery
```

Expected: all paths pass; no request remains pending after success, timeout or shutdown.

- [ ] **Step 5: Commit dynamic recovery**

```bash
git add tools/interface-review/src tools/interface-review/test/fixtures app/test/interface-review-smoke.mjs
git commit -m "feat(review): dynamische Auswahlen sicher wiederfinden"
```

---

### Task 10: Onda-Adapter und vollständige Produktionsabgrenzung

**Files:**
- Modify: `app/scripts/dev-server.mjs`
- Modify: `app/test/dev-server.test.mjs`
- Modify: `app/test/interface-review-smoke.mjs`
- Modify: `app/package.json`

**Interfaces:**
- Consumes: `createInterfaceReviewAdapter` aus Task 3 und vollständigen Browser-Client aus Tasks 5–9.
- Produces: Onda `npm run dev` mit Live-Reload und Review-Overlay, ohne Änderung am normalen `npm run build` oder `mac/build.sh`.

- [ ] **Step 1: Add failing Onda integration contracts**

Extend `servedFixture` to expose its temporary `.interface-review` store. Assert:

```js
const html = await (await fetch(dev.url)).text()
assert.match(html, /data-interface-review-client/)
assert.match(html, /data-onda-dev-reload/)
assert.doesNotMatch(await readFile(resolve(root, 'index.html'), 'utf8'), /interface-review/)
assert.equal((await fetch(new URL('__interface_review/modules/index.js', dev.url))).status, 200)
```

Add port, Origin, close/session cleanup and malformed Review request tests. In the Onda browser section, open the Calm Technology document, select the active annotation card, create a note, run the CLI `current --json`, and assert role/name/text identify that card.

- [ ] **Step 2: Run focused Onda tests and witness RED**

Run:

```bash
cd app
node --test test/dev-server.test.mjs
node test/interface-review-smoke.mjs --section onda
```

Expected: failures for missing Onda adapter injection and endpoint.

- [ ] **Step 3: Integrate adapter transactionally**

At `startDevServer` startup:

```js
const review = await createInterfaceReviewAdapter({
  projectRoot: reviewProjectRoot,
  projectId: 'onda',
  logger,
})
```

Add `reviewProjectRoot = resolve(root, '..')` to `startDevServer` options; isolated tests pass their temporary root explicitly. Because `port:0` is resolved only after listen, call `review.attach(url)` after the actual address is known and set exact Origin there. Route each request through `await review.handle(request, response)` before static file resolution. Apply `review.inject` after the existing live-reload injection so each script appears once. On every startup failure and `close()`, close review before disposing the build context.

Modify `app/package.json`:

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:interface-review && npm run test:smoke",
    "test:interface-review": "node --test ../tools/interface-review/test/*.test.mjs"
  }
}
```

- [ ] **Step 4: Prove development and production separation**

Run:

```bash
cd app
node --test test/dev-server.test.mjs
node test/interface-review-smoke.mjs --section onda
npm run build
if rg -n "interface-review|__interface_review|interfaceReview" index.html dist/editor.bundle.js; then exit 1; fi
```

Expected: all focused tests pass and the final grep finds nothing.

- [ ] **Step 5: Commit Onda integration**

```bash
git add app/scripts/dev-server.mjs app/test/dev-server.test.mjs app/test/interface-review-smoke.mjs app/package.json
git commit -m "feat(review): universelles Overlay in Onda integrieren"
```

---

### Task 11: Dokumentation, harte Tore und maximal drei Eval-Runden

**Files:**
- Create: `tools/interface-review/README.md`
- Create: `docs/evals/interface-review-mvp-evidence.md`
- Modify: `docs/superpowers/plans/2026-08-06-universelles-interface-review-overlay.md`

**Interfaces:**
- Consumes: vollständiges MVP aus Tasks 1–10.
- Produces: reproduzierbare Einrichtung, AC-1–AC-15-Nachweis und visueller Score mit höchstens drei Runden.

- [ ] **Step 1: Write the README as an executable contract**

Document exactly:

```text
1. Host imports createInterfaceReviewAdapter from @local/interface-review/server.
2. Host calls handle before static routing and inject only for development HTML.
3. Host calls attach with the actual loopback URL and close during shutdown.
4. User activates with Command-Shift-E, selects one element, previews, resets or releases.
5. Agent uses interface-review current/list/show/verify/status.
6. .interface-review is local; production must contain no client marker or endpoint.
```

Include one complete generic server example and one Onda-specific command sequence. Do not document any future roadmap feature as available.

- [ ] **Step 2: Run the complete fresh verification suite**

Run:

```bash
cd app
npm test
npm run build
cd ..
bash mac/build.sh
if find Onda.app/Contents/Resources -type f | rg "interface-review|__interface_review|\.interface-review"; then exit 1; fi
git diff --check
```

Expected: all Node and browser tests pass, build exits 0, diff check is silent.

- [ ] **Step 3: Run the visual evaluation loop**

For each round, capture Fixture and Onda at 1440, 1024, 720 and 320 pixels, plus one 200-percent zoom and one hostile-CSS frame. Score exactly:

```json
{
  "selectionClarity": 0,
  "panelHierarchy": 0,
  "comprehensibility": 0,
  "nonInterference": 0,
  "stateClarity": 0
}
```

Replace zeros with observed 1–5 scores and record concrete failures and fixes in `docs/evals/interface-review-mvp-evidence.md`. Stop when every score is at least `4.5`, every hard gate AC-1–AC-15 passes, or after round 3. If a hard gate remains red after round 3, do not claim completion.

- [ ] **Step 4: Verify every acceptance criterion against fresh evidence**

The evidence document must map:

| Criteria | Evidence |
|---|---|
| AC-1, AC-2 | selection/preview browser sections and timing |
| AC-3, AC-4 | records smoke and CLI JSON |
| AC-5 | verify success and mismatch tests |
| AC-6, AC-7 | recovery smoke |
| AC-8 | responsive/zoom captures and assertions |
| AC-9, AC-10, AC-11 | offline, invalid value and corrupt record tests |
| AC-12 | hostile-CSS screenshot plus computed contract |
| AC-13 | adapter auth/path/body tests and loopback socket check |
| AC-14 | build grep and Mac resource manifest |
| AC-15 | Fixture and Onda smoke using the same browser client |

Run the full suite again after the last visual correction, not before it.

- [ ] **Step 5: Commit final MVP evidence**

```bash
git add tools/interface-review/README.md docs/evals/interface-review-mvp-evidence.md docs/superpowers/plans/2026-08-06-universelles-interface-review-overlay.md
git commit -m "docs(review): MVP-Abnahme und Ausbauanschluss belegen"
```

## Completion State

The MVP is complete only when every checkbox above is checked, all AC-1–AC-15 hard gates have fresh evidence, the latest visual round scores every dimension at least 4.5, `npm test` and `npm run build` exit 0, production grep is empty, and the worktree contains no uncommitted product change. The expansion roadmap remains in `docs/superpowers/specs/2026-08-06-universelles-interface-review-overlay-design.md`; none of its later stages is silently pulled into this plan.
