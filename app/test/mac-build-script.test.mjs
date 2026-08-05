import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const buildScript = await readFile(new URL('../../mac/build.sh', import.meta.url), 'utf8')

test('Shell-Variablen vor typografischen Zeichen sind mit Klammern eindeutig begrenzt', () => {
  assert.doesNotMatch(buildScript, /\$[A-Z][A-Z0-9_]*[^\x00-\x7f]/,
    'bash kann ein folgendes Unicode-Zeichen als Teil des Variablennamens lesen')
})
