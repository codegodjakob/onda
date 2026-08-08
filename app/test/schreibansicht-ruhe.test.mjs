// Die Schreibansicht bleibt ruhig: keine Hervorhebung beim Schreiben, kein Plus,
// kein eigener Name in der Fußzeile — und zwei erwartbare Wege zurück zur Übersicht.
//
// Alles hier ist Jakobs Rückmeldung vom 7. August 2026, wörtlich zitiert an der Stelle,
// wo sie gilt. Wer eine dieser Prüfungen fallen sieht, hat etwas zurückgebaut, das
// ausdrücklich weg sollte.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { markierungsGestalt } from '../src/annotation-contract.mjs'

const indexUrl = new URL('../index.html', import.meta.url)
const styleUrl = new URL('../src/style.css', import.meta.url)
const shellUrl = new URL('../src/onda-shell.css', import.meta.url)
const workspaceUrl = new URL('../src/workspace.js', import.meta.url)
const contractUrl = new URL('../src/annotation-contract.mjs', import.meta.url)

test('Beim Schreiben wird kein Absatz hervorgehoben', async () => {
  const css = await readFile(styleUrl, 'utf8')

  // „ich will nicht dass der block sooo deutlich hervorgehoben wird während ich schreibe"
  // .is-active-block darf als Klasse bleiben — die Anmerkung braucht sie zum Anlegen —,
  // aber sie darf keine Fläche mehr tragen.
  const treffer = [...css.matchAll(/\.is-active-block[^{]*\{([^}]*)\}/g)].map(m => m[1])
  for (const koerper of treffer) {
    assert.doesNotMatch(koerper, /background:\s*var\(--bg-(sunken|active|hover)\)/, 'Der aktive Absatz trägt wieder eine Fläche')
    assert.doesNotMatch(koerper, /box-shadow:\s*0 0 0 \d+px/, 'Der aktive Absatz trägt wieder eine Platte')
  }
})

test('Ein Absatz wird nur angedeutet, wenn die Anmerkung ihm als Ganzem gilt', async () => {
  const [css, workspace, contract] = await Promise.all([
    readFile(styleUrl, 'utf8'),
    readFile(workspaceUrl, 'utf8'),
    readFile(contractUrl, 'utf8'),
  ])

  // „blocks sollen nur angedeutet werden […] wenn ich feedback zu einem ganzen block
  // paragraphen bekomme."
  assert.match(css, /\.hat-absatzweite-anmerkung/, 'Die Andeutung für absatzweite Anmerkungen fehlt')
  assert.match(workspace, /function istAbsatzweit\(/)

  // Welche Reichweiten den ganzen Absatz meinen, stand bis zum 8.8.2026 als eigene
  // Menge in workspace.js. Sie ist entfallen: die Zuordnung Reichweite → Geste steht
  // jetzt an EINER Stelle im Vertrag (markierungsGestalt), wo auch die Reichweite
  // selbst herkommt. Geprüft wird deshalb dort — und am Verhalten, nicht am Wortlaut
  // einer Konstante.
  assert.equal(markierungsGestalt('absatzstil'), 'absatz', 'Ein Absatz-Hinweis deutet den Absatz nicht mehr an')
  assert.equal(markierungsGestalt('ton'), 'absatz', 'Ein Abschnitts-Hinweis deutet den Absatz nicht mehr an')
  assert.equal(markierungsGestalt('wortwahl'), 'wort', 'Ein Wort-Hinweis deutet fälschlich den ganzen Absatz an')
  assert.equal(markierungsGestalt('satzstil'), 'satz', 'Ein Satz-Hinweis deutet fälschlich den ganzen Absatz an')

  // Angedeutet heißt angedeutet. Seit dem 8.8.2026 ist die Andeutung eine KLAMMER
  // statt einer Linie: die beiden Haken sagen „von hier bis hier". Was sich dabei
  // nicht ändern darf, ist der Grund, aus dem diese Prüfung existiert — sie steht im
  // Rand und malt keine Fläche auf den Absatz.
  const andeutung = css.match(/\.has-local-finding\.hat-absatzweite-anmerkung::before \{([^}]*)\}/)?.[1] || ''
  assert.ok(andeutung.trim(), 'Die Randmarke für absatzweite Anmerkungen fehlt')
  assert.match(andeutung, /height:\s*auto/, 'Die Andeutung läuft nicht über den ganzen Absatz')
  assert.match(andeutung, /left:\s*-\d+px/, 'Die Andeutung steht nicht im Rand, sondern im Text')
  assert.match(andeutung, /border-right:\s*0/, 'Die Andeutung ist keine Klammer, sondern ein Kasten')
  // „Keine Fläche" heißt: gar keine, oder ausdrücklich durchsichtig. Ein gefüllter
  // Wert an dieser Stelle wäre genau die Platte, gegen die diese Prüfung geschrieben wurde.
  const flaeche = andeutung.match(/background:\s*([^;]+);/)?.[1]?.trim()
  assert.ok(flaeche === undefined || flaeche === 'transparent', `Die Andeutung malt eine Fläche: ${flaeche}`)

  // Und sie darf NICHT als Schatten am Absatz selbst versucht werden: .has-local-finding
  // räumt direkt darüber `box-shadow: none` ab und gewinnt bei gleicher Spezifität,
  // weil es später steht. Genau daran war der erste Versuch still verschwunden.
  const amAbsatz = css.match(/\[data-block-id\]\.hat-absatzweite-anmerkung \{([^}]*)\}/)?.[1]
  assert.equal(amAbsatz, undefined, 'Die Andeutung hängt wieder am Absatz — dort wird sie von .has-local-finding verschluckt')

  // Die Reichweiten müssen im Vertrag auch wirklich vorkommen — sonst deutet nie
  // etwas an, und die Prüfung oben wäre ein Papiertiger.
  assert.match(contract, /'Absatz'/)
  assert.match(contract, /'Abschnitt'/)
})

test('Das Plus am Absatz ist fort, das Einfüge-Menü bleibt für die Struktur', async () => {
  const [html, css, shell, workspace] = await Promise.all([
    readFile(indexUrl, 'utf8'),
    readFile(styleUrl, 'utf8'),
    readFile(shellUrl, 'utf8'),
    readFile(workspaceUrl, 'utf8'),
  ])

  // „das plus ergibt zudem überhaupt keinen sinn für mich."
  for (const [name, inhalt] of [['index.html', html], ['style.css', css], ['onda-shell.css', shell], ['workspace.js', workspace]]) {
    assert.doesNotMatch(inhalt, /block-insert-trigger|blockInsertLayer/, `Das Plus ist in ${name} zurück`)
  }

  // Das Menü selbst bleibt: die Struktur-Ansicht soll Bausteine hinzufügen können.
  assert.match(workspace, /function openInsertMenu\(/, 'Das Einfüge-Menü wurde mit dem Plus gelöscht')
  assert.match(workspace, /function insertBlock\(|const insertBlock/, 'Das Einfügen selbst wurde mit dem Plus gelöscht')
})

test('Unten links steht der Weg zurück, nicht der eigene Name', async () => {
  const html = await readFile(indexUrl, 'utf8')
  // Direkt an der Fußzeile schneiden. Ein Schnitt von <section id="editorView"> bis zum
  // nächsten </section> endet zu früh: die Seitenleiste enthält selbst <section>-Blöcke.
  // Die Bibliothek hat ihre eigene Fußzeile (.onda-library-footer) — die ist hier nicht
  // gemeint und wird von diesem Klassennamen auch nicht getroffen.
  const fusszeile = html.match(/<div class="onda-side-footer">([\s\S]*?)<\/div>/)?.[1] || ''
  assert.ok(fusszeile.trim(), 'Die Fußzeile der Schreibansicht wurde nicht gefunden')

  // „entferne den nutzer unten links in der schreibansicht den braucht man da nicht.
  //  nur einstellungen und dark/ligth modus. unten links kann an die stelle der pfeil
  //  kommen mit dem man zurück zum menü kommt."
  assert.doesNotMatch(fusszeile, /onda-avatar|onda-side-user/, 'Der eigene Name steht wieder in der Fußzeile')
  assert.match(fusszeile, /id="sidebarBack"/, 'Der Weg zurück fehlt in der Fußzeile')
  assert.match(fusszeile, /id="themeToggle"/)
  assert.match(fusszeile, /id="kiSettings"/)
})

test('Der Schriftzug oben links führt zur Übersicht', async () => {
  const [html, workspace] = await Promise.all([
    readFile(indexUrl, 'utf8'),
    readFile(workspaceUrl, 'utf8'),
  ])

  // „außerdem sollte man zurück zum menü kommen wenn man einfach oben links auf onda
  //  klickt."
  assert.match(html, /id="ondaHome"[^>]*class="onda-wordmark onda-wordmark-btn"/)
  // Derselbe Weg wie der Pfeil — nicht ein zweiter, der sich anders verhält.
  assert.match(workspace, /getElementById\('ondaHome'\), 'click', onBack/)
  assert.match(workspace, /listen\(ui\.back, 'click', onBack\)/)
})

test('Der Projektname weicht, bevor Erscheinung und Einstellungen verschwinden', async () => {
  const css = await readFile(styleUrl, 'utf8')
  const zurueck = css.match(/\.onda-side-back \{([^}]*)\}/)?.[1] || ''

  // Ohne min-width:0 weigert sich ein Flex-Kind zu schrumpfen, auch wenn text-overflow
  // gesetzt ist — genau daran fehlte das Zahnrad in der Fußzeile.
  assert.match(zurueck, /flex:\s*1/, 'Der Weg-zurück-Knopf nimmt sich keinen Platz')
  assert.match(zurueck, /min-width:\s*0/, 'Ohne min-width:0 verdrängt der Projektname die Knöpfe rechts')
  assert.match(css, /\.onda-side-back-label \{[^}]*text-overflow:\s*ellipsis/)
  assert.match(css, /\.onda-side-back-chevron \{[^}]*flex:\s*none/, 'Der Pfeil selbst muss immer sichtbar bleiben')
})
