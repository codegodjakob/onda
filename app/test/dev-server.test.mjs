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
