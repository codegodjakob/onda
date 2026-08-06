import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, relative } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')

function readJson(path) {
  assert.ok(existsSync(path), `${relative(ROOT, path)} must exist`)
  return JSON.parse(readFileSync(path, 'utf8'))
}

function filesBelow(path) {
  if (!existsSync(path)) return []
  return readdirSync(path).flatMap(name => {
    const child = resolve(path, name)
    return statSync(child).isDirectory() ? filesBelow(child) : [child]
  })
}

test('manifest targets only Figma Design and wires the bundled code plus open UI', () => {
  const manifest = readJson(resolve(ROOT, 'manifest.json'))
  assert.deepEqual(manifest.editorType, ['figma'])
  assert.equal(manifest.main, 'dist/code.js')
  assert.equal(manifest.ui, 'ui.html')
  assert.equal(manifest.documentAccess, 'dynamic-page')
})

test('UI exposes each phase, keeps results visible, and never offers an all-in-one mutation', () => {
  const path = resolve(ROOT, 'ui.html')
  assert.ok(existsSync(path), 'ui.html must exist')
  const html = readFileSync(path, 'utf8')
  for (const label of ['Inspect', 'Foundations', 'Komponenten', 'Kernansichten', 'Annotation-Batches', 'Dialoge (?:&|&amp;) Nebenansichten', 'Verify']) {
    assert.match(html, new RegExp(label))
  }
  assert.match(html, /phase-results/)
  assert.doesNotMatch(html, /Alles erzeugen|Generate all|generate-all/i)
})

test('source and bundle never create a page, delete a node, or close the plugin', () => {
  const sourceFiles = filesBelow(resolve(ROOT, 'src'))
  const bundlePath = resolve(ROOT, 'dist/code.js')
  assert.ok(sourceFiles.length > 0, 'plugin source files must exist')
  assert.ok(existsSync(bundlePath), 'dist/code.js must exist')
  const files = [...sourceFiles, bundlePath]
  for (const path of files) {
    const code = readFileSync(path, 'utf8')
    assert.doesNotMatch(code, /figma\s*\.\s*createPage\s*\(/, relative(ROOT, path))
    assert.doesNotMatch(code, /\.\s*remove\s*\(/, relative(ROOT, path))
    assert.doesNotMatch(code, /figma\s*\.\s*closePlugin\s*\(/, relative(ROOT, path))
  }
})

test('runtime uses currentPage and a persisted Onda ledger without renaming foreign nodes', () => {
  const path = resolve(ROOT, 'src/runtime.mjs')
  assert.ok(existsSync(path), 'src/runtime.mjs must exist')
  const source = readFileSync(path, 'utf8')
  const definitions = readFileSync(resolve(ROOT, 'src/definitions.mjs'), 'utf8')
  assert.match(source, /figma\.currentPage/)
  assert.match(definitions, /ondaOnePageLedger/)
  assert.match(source, /setPluginData/)
  assert.doesNotMatch(source, /existing\.name\s*=/)
})

test('recursive baseline includes document/page records and every protected geometry/layout field', () => {
  const path = resolve(ROOT, 'src/runtime.mjs')
  assert.ok(existsSync(path), 'src/runtime.mjs must exist')
  const source = readFileSync(path, 'utf8')
  for (const field of [
    'absoluteRenderBounds', 'absoluteBoundingBox', 'layoutPositioning', 'layoutAlign',
    'layoutGrow', 'constraints', 'childIds', 'mainComponentId', 'componentSetId',
  ]) assert.match(source, new RegExp(field), field)
  assert.match(source, /figma\.loadAllPagesAsync\(\)/)
  assert.match(source, /nodeRecord\(figma\.root/)
  assert.match(source, /nodeRecord\(page/)
})

test('bundle is importable by Figma as classic JavaScript', () => {
  const path = resolve(ROOT, 'dist/code.js')
  assert.ok(existsSync(path), 'dist/code.js must exist')
  const code = readFileSync(path, 'utf8')
  assert.doesNotMatch(code, /^\s*(?:import|export)\s/m)
  assert.match(code, /figma\.showUI/)
  assert.match(code, /figma\.ui\.onmessage/)
})
