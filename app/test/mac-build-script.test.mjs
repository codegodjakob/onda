import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const buildScript = await readFile(new URL('../../mac/build.sh', import.meta.url), 'utf8')
const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')

test('Shell-Variablen vor typografischen Zeichen sind mit Klammern eindeutig begrenzt', () => {
  assert.doesNotMatch(buildScript, /\$[A-Z][A-Z0-9_]*[^\x00-\x7f]/,
    'bash kann ein folgendes Unicode-Zeichen als Teil des Variablennamens lesen')
})

test('Mac-Build nimmt alle lokalen Stylesheets aus der Oberfläche mit', () => {
  const stylesheets = [...indexHtml.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)]
    .map(match => match[1])

  assert.ok(stylesheets.length > 1, 'der Vertrag muss die aufgeteilte Onda-CSS-Struktur prüfen')
  assert.ok(stylesheets.every(path => path.startsWith('src/') && path.endsWith('.css')))
  assert.match(buildScript, /cp \.\.\/app\/src\/\*\.css "\$APP\/Contents\/Resources\/src\/"/,
    'der App-Build muss jedes lokale Stylesheet in das native Bundle kopieren')
})
