import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const buildScript = await readFile(new URL('../../mac/build.sh', import.meta.url), 'utf8')
const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8')

// Kommentare zaehlen nicht als Zusage: ein Kommentar, der einen Befehl beim Namen
// nennt, wuerde diese Pruefungen sonst erfuellen, ohne dass der Bau ihn ausfuehrt.
const buildBefehle = buildScript.split('\n').filter(zeile => !/^\s*#/.test(zeile)).join('\n')
const anlaufKoerper = buildBefehle.match(/pruefserver_anlauf\(\) \{([\s\S]*?)\n\}/)?.[1] ?? ''

test('Shell-Variablen vor typografischen Zeichen sind mit Klammern eindeutig begrenzt', () => {
  assert.doesNotMatch(buildScript, /\$[A-Z][A-Z0-9_]*[^\x00-\x7f]/,
    'bash kann ein folgendes Unicode-Zeichen als Teil des Variablennamens lesen')
})

test('Ein belegter Pruefserver-Port beendet den Bau nicht, sondern kostet nur einen Anlauf', () => {
  const anlaeufe = Number(buildBefehle.match(/^PRUEFANLAEUFE=(\d+)$/m)?.[1])
  assert.ok(anlaeufe >= 2,
    'ein einziger Anlauf laesst den Bau am verlorenen Wettlauf um den Port scheitern')
  assert.match(buildBefehle, /for anlauf in \$\(seq 1 "\$PRUEFANLAEUFE"\)/,
    'die Anlaeufe muessen tatsaechlich durchlaufen werden')
})

test('Jeder Anlauf sucht den Port frisch und meidet die schon verbrauchten', () => {
  assert.match(anlaufKoerper, /for kandidat in \$\(seq 4200 4260\)/,
    'die Portsuche gehoert in den Anlauf — sonst nimmt der zweite denselben Port wie der erste')
  assert.match(anlaufKoerper, /case "\$VERBRAUCHTE_PORTS" in \*" \$kandidat "\*\) continue/,
    'ein Port, der frei aussieht und es nicht ist, wuerde sonst jeden Anlauf verschlingen')
  assert.match(anlaufKoerper, /VERBRAUCHTE_PORTS="\$\{VERBRAUCHTE_PORTS\}\$\{PRUEFPORT\} "/,
    'der gerade versuchte Port muss als verbraucht vermerkt werden')
})

test('Ein gestorbener Pruefserver kostet keine Minute Wartezeit', () => {
  assert.match(anlaufKoerper, /kill -0 "\$PRUEFSERVER" 2>\/dev\/null \|\| return 1/,
    'ohne diese Pruefung wartet der Bau 60 Sekunden auf einen Prozess, den es nicht mehr gibt')
})

test('Parallele Bauten ueberschreiben einander das Serverprotokoll nicht', () => {
  assert.doesNotMatch(buildBefehle, /\/tmp\/onda-bau-server\.log/,
    'ein fester Pfad gibt im Fehlerfall das Protokoll des anderen Baus aus')
  assert.match(buildBefehle, /^PRUEFLOG="\/tmp\/onda-bau-server-\$\$\.log"$/m,
    'die Prozessnummer macht das Protokoll je Bau eindeutig')
})

test('Mac-Build nimmt alle lokalen Stylesheets aus der Oberfläche mit', () => {
  const stylesheets = [...indexHtml.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/g)]
    .map(match => match[1])

  assert.ok(stylesheets.length > 1, 'der Vertrag muss die aufgeteilte Onda-CSS-Struktur prüfen')
  assert.ok(stylesheets.every(path => path.startsWith('src/') && path.endsWith('.css')))
  assert.match(buildScript, /cp \.\.\/app\/src\/\*\.css "\$APP\/Contents\/Resources\/src\/"/,
    'der App-Build muss jedes lokale Stylesheet in das native Bundle kopieren')
})
