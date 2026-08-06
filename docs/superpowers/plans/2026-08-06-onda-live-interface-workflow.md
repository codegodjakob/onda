# Onda Live Interface Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein lokaler `npm run dev`-Arbeitsmodus baut Onda fortlaufend, liefert die Oberfläche ausschließlich auf `127.0.0.1` aus und lädt den eingebauten Browser nach gültigen HTML-, CSS- und JavaScript-Änderungen automatisch neu.

**Architecture:** Ein einzelnes Node-ESM-Modul kapselt statische Auslieferung, sichere Pfadauflösung, einen Server-Sent-Events-Kanal, Dateiüberwachung und den vorhandenen esbuild-Kontext. Der Live-Reload-Client wird ausschließlich in die HTTP-Antwort von `index.html` injiziert; weder Quelldatei noch natives Bundle enthalten Entwicklungscode. Tests starten das Modul gegen temporäre Fixtures und freie Ports, sodass sie keine Nutzerdaten oder laufende Onda-Instanz verändern.

**Tech Stack:** Node.js ESM, `node:http`, `node:fs`, Server-Sent Events, vorhandenes `esbuild` 0.28.x, `node:test`.

## Global Constraints

- Keine neue npm-Abhängigkeit und kein zweites Buildsystem.
- Standardadresse ist exakt `http://127.0.0.1:4173/`.
- Der Server bindet ausschließlich an `127.0.0.1`.
- HTML/CSS laden automatisch neu; JavaScript lädt nur nach erfolgreichem Bundle-Build neu.
- Mehrere Dateisignale werden innerhalb von 80 ms zu einem Reload gebündelt.
- Das letzte gültige Bundle bleibt bei JavaScript-Fehlern verwendbar.
- `app/index.html`, `npm run build` und `mac/build.sh` bleiben frei von Live-Reload-Code.
- Start und kleiner CSS-Reload benötigen im warmen Zustand höchstens zwei Sekunden.
- Grundlage: `docs/superpowers/specs/2026-08-06-onda-live-interface-workflow-design.md`.

---

## Dateistruktur

- Create: `app/scripts/dev-server.mjs` — vollständiger Entwicklungsserver und ausführbarer CLI-Einstieg.
- Create: `app/test/dev-server.test.mjs` — isolierte Server-, Reload-, Fehler- und Shutdown-Tests.
- Modify: `app/package.json` — einziger öffentlicher Einstieg `npm run dev`.
- Modify: `docs/superpowers/plans/2026-08-06-onda-live-interface-workflow.md` — erledigte Schritte und frische Endnachweise.

### Task 1: Sichere statische Vorschau mit reiner Antwort-Injektion

**Files:**
- Create: `app/scripts/dev-server.mjs`
- Create: `app/test/dev-server.test.mjs`

**Interfaces:**
- Produces: `startDevServer(options): Promise<{ host: string, port: number, url: string, close(): Promise<void> }>`
- `options`: `{ root?: string, host?: string, port?: number, debounceMs?: number, logger?: Pick<Console, 'log'|'error'> }`
- Produces: HTTP endpoint `GET /__onda_reload` with `text/event-stream`.

- [x] **Step 1: Write the failing static-server tests**

Create `app/test/dev-server.test.mjs` with the fixture and the first three tests:

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { startDevServer } from '../scripts/dev-server.mjs'

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'onda-dev-server-'))
  await mkdir(resolve(root, 'src'), { recursive: true })
  await mkdir(resolve(root, 'dist'), { recursive: true })
  await writeFile(resolve(root, 'index.html'), '<!doctype html><body><main>Onda</main></body>')
  await writeFile(resolve(root, 'src/style.css'), 'body { color: black; }')
  await writeFile(resolve(root, 'src/editor.js'), 'window.OndaFixture = true')
  t.after(() => rm(root, { recursive: true, force: true }))
  return root
}

test('liefert die App lokal aus und injiziert Reload nur in die Antwort', async t => {
  const root = await fixture(t)
  const dev = await startDevServer({ root, port: 0 })
  t.after(() => dev.close())

  assert.equal(dev.host, '127.0.0.1')
  const response = await fetch(dev.url)
  const html = await response.text()
  assert.equal(response.status, 200)
  assert.match(html, /new EventSource\('\/__onda_reload'\)/)
  assert.doesNotMatch(await readFile(resolve(root, 'index.html'), 'utf8'), /__onda_reload/)
})

test('liefert korrekte Inhaltstypen und 404 für fehlende Dateien', async t => {
  const root = await fixture(t)
  const dev = await startDevServer({ root, port: 0 })
  t.after(() => dev.close())

  const css = await fetch(new URL('src/style.css', dev.url))
  assert.match(css.headers.get('content-type'), /^text\/css/)
  assert.equal((await fetch(new URL('fehlt.txt', dev.url))).status, 404)
})

test('gibt keine Datei außerhalb des App-Verzeichnisses aus', async t => {
  const root = await fixture(t)
  const dev = await startDevServer({ root, port: 0 })
  t.after(() => dev.close())

  const response = await fetch(`${dev.url}%2e%2e/%2e%2e/etc/passwd`)
  assert.ok([403, 404].includes(response.status))
  assert.doesNotMatch(await response.text(), /root:/)
})
```

- [x] **Step 2: Run the test and witness RED**

Run:

```bash
cd app && node --test test/dev-server.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/dev-server.mjs`.

- [x] **Step 3: Implement the static server and SSE endpoint**

Create `app/scripts/dev-server.mjs` with these public constants, safety checks and lifecycle semantics:

```js
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const DEFAULT_HOST = '127.0.0.1'
export const DEFAULT_PORT = 4173

const DEFAULT_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const MIME = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.woff2', 'font/woff2'],
])

const LIVE_CLIENT = `<script data-onda-dev-reload>
(() => {
  const events = new EventSource('/__onda_reload')
  events.addEventListener('reload', () => location.reload())
})()
</script>`

function safeTarget(root, pathname) {
  const decoded = decodeURIComponent(pathname)
  const requested = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '')
  const target = resolve(root, requested)
  const inside = relative(root, target)
  if (inside.startsWith(`..${sep}`) || inside === '..' || isAbsolute(inside)) return null
  return target
}

function injectLiveClient(html) {
  return html.includes('</body>')
    ? html.replace('</body>', `${LIVE_CLIENT}</body>`)
    : `${html}${LIVE_CLIENT}`
}

export async function startDevServer({
  root = DEFAULT_ROOT,
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  debounceMs = 80,
  logger = console,
} = {}) {
  const clients = new Set()
  let closed = false
  let reloadTimer = null

  const broadcast = () => {
    reloadTimer = null
    for (const client of clients) client.write('event: reload\ndata: changed\n\n')
  }
  const scheduleReload = () => {
    clearTimeout(reloadTimer)
    reloadTimer = setTimeout(broadcast, debounceMs)
  }

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', `http://${host}`)
      if (url.pathname === '/__onda_reload') {
        response.writeHead(200, {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        })
        response.flushHeaders()
        response.write('retry: 500\n\n')
        clients.add(response)
        request.once('close', () => clients.delete(response))
        return
      }

      const target = safeTarget(root, url.pathname)
      if (!target) return response.writeHead(403).end('Forbidden')
      const data = await readFile(target)
      const body = target === resolve(root, 'index.html')
        ? injectLiveClient(data.toString('utf8'))
        : data
      response.writeHead(200, {
        'content-type': MIME.get(extname(target)) ?? 'application/octet-stream',
        'cache-control': 'no-store',
      })
      response.end(body)
    } catch {
      response.writeHead(404).end('Not found')
    }
  })

  await new Promise((resolveListening, rejectListening) => {
    const onError = error => rejectListening(error)
    server.once('error', onError)
    server.listen(port, host, () => {
      server.off('error', onError)
      resolveListening()
    })
  })

  const address = server.address()
  const actualPort = typeof address === 'object' && address ? address.port : port
  return {
    host,
    port: actualPort,
    url: `http://${host}:${actualPort}/`,
    scheduleReload,
    async close() {
      if (closed) return
      closed = true
      clearTimeout(reloadTimer)
      for (const client of clients) client.end()
      clients.clear()
      await new Promise(resolveClosed => server.close(resolveClosed))
      logger.log?.('Onda Live beendet')
    },
  }
}
```

- [x] **Step 4: Run the tests and verify GREEN**

Run: `cd app && node --test test/dev-server.test.mjs`

Expected: 3 tests, 3 passed, 0 failed.

- [x] **Step 5: Commit the static server slice**

```bash
git add app/scripts/dev-server.mjs app/test/dev-server.test.mjs
git commit -m "feat(dev): sichere lokale Onda-Vorschau bereitstellen"
```

### Task 2: Automatischer Reload und fehlertoleranter esbuild-Watcher

**Files:**
- Modify: `app/scripts/dev-server.mjs`
- Modify: `app/test/dev-server.test.mjs`

**Interfaces:**
- Consumes: `startDevServer(...)` and its `close()` lifecycle from Task 1.
- Produces: SSE event `reload` after HTML/CSS changes or successful JavaScript builds.
- Produces: no event after a failed JavaScript build; recovery after the next valid change.

- [x] **Step 1: Add failing reload and recovery tests**

Append helpers and tests to `app/test/dev-server.test.mjs`:

```js
async function collectReload(dev, trigger, timeoutMs = 2000) {
  const controller = new AbortController()
  const response = await fetch(new URL('__onda_reload', dev.url), { signal: controller.signal })
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let received = ''
  try {
    await trigger()
    const deadline = Date.now() + timeoutMs
    while (!received.includes('event: reload') && Date.now() < deadline) {
      const remaining = deadline - Date.now()
      const result = await Promise.race([
        reader.read(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('reload timeout')), remaining)),
      ])
      if (result.done) break
      received += decoder.decode(result.value, { stream: true })
    }
    return received
  } finally {
    controller.abort()
  }
}

async function expectNoReload(dev, trigger, quietMs = 400) {
  const controller = new AbortController()
  const response = await fetch(new URL('__onda_reload', dev.url), { signal: controller.signal })
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let received = ''
  try {
    await trigger()
    const deadline = Date.now() + quietMs
    while (Date.now() < deadline) {
      const remaining = deadline - Date.now()
      const result = await Promise.race([
        reader.read(),
        new Promise(resolve => setTimeout(() => resolve(null), remaining)),
      ])
      if (!result || result.done) break
      received += decoder.decode(result.value, { stream: true })
      assert.doesNotMatch(received, /event: reload/)
    }
  } finally {
    controller.abort()
  }
}

test('lädt nach HTML und CSS gebündelt neu', async t => {
  const root = await fixture(t)
  const dev = await startDevServer({ root, port: 0, debounceMs: 20 })
  t.after(() => dev.close())

  const event = await collectReload(dev, async () => {
    await writeFile(resolve(root, 'src/style.css'), 'body { color: navy; }')
    await writeFile(resolve(root, 'index.html'), '<!doctype html><body><main>Neu</main></body>')
  })
  assert.match(event, /event: reload/)
})

test('lädt JavaScript nur nach erfolgreichem Build und erholt sich', async t => {
  const root = await fixture(t)
  const errors = []
  const dev = await startDevServer({
    root,
    port: 0,
    debounceMs: 20,
    logger: { log() {}, error(message) { errors.push(String(message)) } },
  })
  t.after(() => dev.close())

  await expectNoReload(dev, () => (
    writeFile(resolve(root, 'src/editor.js'), 'export const =')
  ))
  assert.ok(errors.length > 0)

  const event = await collectReload(dev, () => (
    writeFile(resolve(root, 'src/editor.js'), 'window.OndaFixture = "recovered"')
  ))
  assert.match(event, /event: reload/)
  assert.match(await readFile(resolve(root, 'dist/editor.bundle.js'), 'utf8'), /recovered/)
})
```

- [x] **Step 2: Run the focused test and witness RED**

Run: `cd app && node --test test/dev-server.test.mjs`

Expected: the original 3 tests pass; the new reload tests fail because no file or build watcher exists.

- [x] **Step 3: Add esbuild and file-watch lifecycles**

Extend imports in `app/scripts/dev-server.mjs`:

```js
import { context as createBuildContext } from 'esbuild'
import { watch } from 'node:fs'
```

Inside `startDevServer`, before `server.listen`, create the build context and HTML/CSS/JavaScript watchers. Tests showed that `context.watch()` can report a second startup build; therefore the filesystem watcher deliberately triggers one controlled `context.rebuild()`. Only its successful result schedules reload:

```js
  const buildContext = await createBuildContext({
    entryPoints: [resolve(root, 'src/editor.js')],
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'AIWT',
    outfile: resolve(root, 'dist/editor.bundle.js'),
    logLevel: 'silent',
  })
  await buildContext.rebuild()

  let buildTimer = null
  let buildQueue = Promise.resolve()
  const scheduleJavaScriptBuild = () => {
    clearTimeout(buildTimer)
    buildTimer = setTimeout(() => {
      buildQueue = buildQueue.then(async () => {
        try {
          const result = await buildContext.rebuild()
          if (!result.errors.length) scheduleReload()
        } catch (error) {
          for (const detail of error.errors ?? [error]) logger.error?.(detail.text ?? detail.message)
        }
      })
    }, Math.max(debounceMs, 80))
  }

  const fileWatchers = [
    watch(resolve(root, 'index.html'), scheduleReload),
    watch(resolve(root, 'src'), { recursive: true }, (_event, filename) => {
      if (filename?.endsWith('.css')) scheduleReload()
      else if (filename && /\.(?:[cm]?js)$/.test(filename)) scheduleJavaScriptBuild()
    }),
  ]
```

Make startup transactional: if `server.listen` fails, close both file watchers and `buildContext` before rethrowing. Extend `close()` in this exact order:

```js
      for (const watcher of fileWatchers) watcher.close()
      for (const client of clients) client.end()
      clients.clear()
      await new Promise(resolveClosed => server.close(resolveClosed))
      await buildQueue
      await buildContext.dispose()
```

- [x] **Step 4: Run focused tests and verify GREEN**

Run: `cd app && node --test test/dev-server.test.mjs`

Expected: 5 tests, 5 passed, 0 failed; no handles remain open after the process exits.

- [x] **Step 5: Commit the reload slice**

```bash
git add app/scripts/dev-server.mjs app/test/dev-server.test.mjs
git commit -m "feat(dev): Onda-Aenderungen automatisch neu laden"
```

### Task 3: CLI, Portfehler und öffentlicher npm-Befehl

**Files:**
- Modify: `app/scripts/dev-server.mjs`
- Modify: `app/test/dev-server.test.mjs`
- Modify: `app/package.json`

**Interfaces:**
- Consumes: `startDevServer(...)` from Tasks 1–2.
- Produces: `npm run dev` on port 4173.
- Produces: test-only CLI override `--port=0` without changing the documented default.

- [ ] **Step 1: Add failing CLI and port-conflict tests**

Add imports and tests to `app/test/dev-server.test.mjs`:

```js
import { spawn } from 'node:child_process'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

test('package.json bietet den einen dokumentierten dev-Befehl an', () => {
  assert.equal(packageJson.scripts.dev, 'node scripts/dev-server.mjs')
})

test('ein belegter Port führt zu EADDRINUSE und hinterlässt keine zweite Vorschau', async t => {
  const root = await fixture(t)
  const first = await startDevServer({ root, port: 0 })
  t.after(() => first.close())
  await assert.rejects(
    startDevServer({ root, port: first.port }),
    error => error?.code === 'EADDRINUSE',
  )
})

test('der CLI meldet URL und beendet sich sauber mit SIGTERM', async () => {
  const child = spawn(process.execPath, ['scripts/dev-server.mjs', '--port=0'], {
    cwd: resolve(import.meta.dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.setEncoding('utf8')
  child.stdout.on('data', chunk => { output += chunk })
  const url = await new Promise((resolveUrl, rejectUrl) => {
    const deadline = setTimeout(() => rejectUrl(new Error(output || 'CLI timeout')), 3000)
    child.stdout.on('data', () => {
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+\//)
      if (!match) return
      clearTimeout(deadline)
      resolveUrl(match[0])
    })
  })
  assert.equal((await fetch(url)).status, 200)
  child.kill('SIGTERM')
  const code = await new Promise(resolveExit => child.once('exit', resolveExit))
  assert.equal(code, 0)
})
```

- [ ] **Step 2: Run the focused test and witness RED**

Run: `cd app && node --test test/dev-server.test.mjs`

Expected: failures for the missing `dev` script and missing CLI output/shutdown behavior.

- [ ] **Step 3: Add CLI parsing and graceful shutdown**

Append to `app/scripts/dev-server.mjs`:

```js
function cliPort(args) {
  const token = args.find(argument => argument.startsWith('--port='))
  if (!token) return DEFAULT_PORT
  const port = Number(token.slice('--port='.length))
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Ungültiger Port: ${token}`)
  }
  return port
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  let running = null
  try {
    running = await startDevServer({ port: cliPort(process.argv.slice(2)) })
    console.log(`Onda Live: ${running.url}`)
    const stop = async () => {
      await running.close()
      process.exit(0)
    }
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
  } catch (error) {
    const portText = error?.code === 'EADDRINUSE' ? `Port ${cliPort(process.argv.slice(2))} ist belegt. ` : ''
    console.error(`Onda Live konnte nicht starten. ${portText}${error.message}`)
    process.exitCode = 1
  }
}
```

Modify `app/package.json` scripts:

```json
"scripts": {
  "dev": "node scripts/dev-server.mjs",
  "build": "esbuild src/editor.js --bundle --minify --format=iife --global-name=AIWT --outfile=dist/editor.bundle.js"
}
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `cd app && node --test test/dev-server.test.mjs`

Expected: 8 tests, 8 passed, 0 failed.

- [ ] **Step 5: Commit CLI and npm integration**

```bash
git add app/package.json app/scripts/dev-server.mjs app/test/dev-server.test.mjs
git commit -m "feat(dev): Onda-Live-Arbeitsmodus anbieten"
```

### Task 4: Vollständige Verifikation und geöffnete Live-Vorschau

**Files:**
- Modify: `docs/superpowers/plans/2026-08-06-onda-live-interface-workflow.md`

**Interfaces:**
- Consumes: `npm run dev` from Task 3.
- Produces: laufende Vorschau in the in-app browser at `http://127.0.0.1:4173/`.

- [ ] **Step 1: Run the complete unit and contract suite**

Run:

```bash
cd app && npm run test:unit
```

Expected: all unit/contract tests pass, including all 8 dev-server tests.

- [ ] **Step 2: Run browser smokes against the live server**

Start `npm run dev` in a persistent terminal. In a second command run:

```bash
cd app && AIWT_URL=http://127.0.0.1:4173/ node test/onda-ui-smoke.mjs
```

Expected: `ONDA UI all: PASS`.

- [ ] **Step 3: Verify production separation**

Run:

```bash
cd app && npm run build
rg -n "__onda_reload|EventSource" index.html dist/editor.bundle.js
```

Expected: build succeeds; `rg` exits 1 with no matches.

- [ ] **Step 4: Open and visibly inspect the live preview**

Navigate the in-app browser to `http://127.0.0.1:4173/`. Verify library and editor render, then make a reversible CSS fixture change during the automated test or use the SSE test evidence; do not alter saved user content merely to prove reload.

Expected: the browser is on the HTTP URL, the interface is styled, and one `npm run dev` process owns port 4173.

- [ ] **Step 5: Mark this plan complete and commit the final evidence state**

Check every box in this plan, then run:

```bash
git diff --check
git status --short
git add docs/superpowers/plans/2026-08-06-onda-live-interface-workflow.md
git commit -m "docs(dev): Live-Arbeitsmodus abnehmen"
```

Expected: only the pre-existing user-owned `.scratch/rueckmeldung/` files remain untracked; no product change is left uncommitted.
