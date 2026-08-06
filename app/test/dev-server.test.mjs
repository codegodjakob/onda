import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { startDevServer } from '../scripts/dev-server.mjs'

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'onda-dev-server-'))
  await mkdir(resolve(root, 'src'), { recursive: true })
  await mkdir(resolve(root, 'dist'), { recursive: true })
  await writeFile(resolve(root, 'index.html'), '<!doctype html><body><main>Onda</main></body>')
  await writeFile(resolve(root, 'src/style.css'), 'body { color: black; }')
  await writeFile(resolve(root, 'src/editor.js'), 'window.OndaFixture = true')
  return root
}

async function servedFixture(t, options = {}) {
  const root = await fixture()
  try {
    const dev = await startDevServer({ root, port: 0, ...options })
    t.after(async () => {
      await dev.close()
      await rm(root, { recursive: true, force: true })
    })
    return { root, dev }
  } catch (error) {
    await rm(root, { recursive: true, force: true })
    throw error
  }
}

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
        new Promise(resolveTimeout => setTimeout(() => resolveTimeout(null), remaining)),
      ])
      if (!result || result.done) break
      received += decoder.decode(result.value, { stream: true })
      assert.doesNotMatch(received, /event: reload/)
    }
  } finally {
    controller.abort()
  }
}

test('liefert die App lokal aus und injiziert Reload nur in die Antwort', async t => {
  const { root, dev } = await servedFixture(t)

  assert.equal(dev.host, '127.0.0.1')
  const response = await fetch(dev.url)
  const html = await response.text()
  assert.equal(response.status, 200)
  assert.match(html, /new EventSource\('\/__onda_reload'\)/)
  assert.doesNotMatch(await readFile(resolve(root, 'index.html'), 'utf8'), /__onda_reload/)
})

test('liefert korrekte Inhaltstypen und 404 für fehlende Dateien', async t => {
  const { dev } = await servedFixture(t)

  const css = await fetch(new URL('src/style.css', dev.url))
  assert.match(css.headers.get('content-type'), /^text\/css/)
  assert.equal((await fetch(new URL('fehlt.txt', dev.url))).status, 404)
})

test('gibt keine Datei außerhalb des App-Verzeichnisses aus', async t => {
  const { dev } = await servedFixture(t)

  const response = await fetch(`${dev.url}%2e%2e/%2e%2e/etc/passwd`)
  assert.ok([403, 404].includes(response.status))
  assert.doesNotMatch(await response.text(), /root:/)
})

test('lädt nach HTML und CSS gebündelt neu', async t => {
  const { root, dev } = await servedFixture(t, { debounceMs: 20 })

  const event = await collectReload(dev, async () => {
    await writeFile(resolve(root, 'src/style.css'), 'body { color: navy; }')
    await writeFile(resolve(root, 'index.html'), '<!doctype html><body><main>Neu</main></body>')
  })
  assert.match(event, /event: reload/)
})

test('lädt JavaScript nur nach erfolgreichem Build und erholt sich', async t => {
  const errors = []
  const { root, dev } = await servedFixture(t, {
    debounceMs: 20,
    logger: { log() {}, error(message) { errors.push(String(message)) } },
  })

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

test('package.json bietet den einen dokumentierten dev-Befehl an', () => {
  assert.equal(packageJson.scripts.dev, 'node scripts/dev-server.mjs')
})

test('ein belegter Port führt zu EADDRINUSE und hinterlässt keine zweite Vorschau', async t => {
  const { root, dev: first } = await servedFixture(t)
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
