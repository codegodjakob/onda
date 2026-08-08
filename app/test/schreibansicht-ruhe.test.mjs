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

test('Unten links stehen nur noch Erscheinung und Einstellungen', async () => {
  const html = await readFile(indexUrl, 'utf8')
  // Direkt an der Fußzeile schneiden. Ein Schnitt von <section id="editorView"> bis zum
  // nächsten </section> endet zu früh: die Seitenleiste enthält selbst <section>-Blöcke.
  // Die Bibliothek hat ihre eigene Fußzeile (.onda-library-footer) — die ist hier nicht
  // gemeint und wird von diesem Klassennamen auch nicht getroffen.
  const fusszeile = html.match(/<div class="onda-side-footer">([\s\S]*?)<\/div>/)?.[1] || ''
  assert.ok(fusszeile.trim(), 'Die Fußzeile der Schreibansicht wurde nicht gefunden')

  // Am 7.8.2026 wanderte der Weg zurück in die Fußzeile: „unten links kann an die stelle
  // der pfeil kommen mit dem man zurück zum menü kommt." Am 8.8.2026 hat Jakob das
  // zurückgenommen — nicht die Sache, sondern den Ort: „ich find, es sieht einfach
  // unästhetisch aus." Zwischen Sonne und Zahnrad blieben dem Projektnamen 91 Pixel,
  // und was übrig blieb, war „Beispiel: Ca…". Der Weg zurück steht jetzt oben und trägt
  // den ganzen Namen; hier bleiben zwei Zeichen ohne Wortlaut.
  assert.doesNotMatch(fusszeile, /onda-avatar|onda-side-user/, 'Der eigene Name steht wieder in der Fußzeile')
  assert.doesNotMatch(fusszeile, /id="sidebarBack"/, 'Der Projektname steht wieder unten links, wo er nicht hinpasst')
  assert.match(fusszeile, /id="themeToggle"/)
  assert.match(fusszeile, /id="kiSettings"/)
})

test('Oben links stehen Schriftzug und Projektname — beide ungekürzt', async () => {
  const [html, css] = await Promise.all([readFile(indexUrl, 'utf8'), readFile(styleUrl, 'utf8')])

  // „eigentlich sollte oben links auch dieses Logoschrift sein von onda beziehungsweise
  //  onda write, leben." — leben heißt: bleiben. In der Seitenleiste fuhr der Schriftzug
  //  beim Einklappen mit hinaus. Er gehört deshalb in denselben festen Kasten wie die
  //  Klinke, die schon am Fenster hängt.
  const band = html.match(/<div class="onda-topbar__lead">([\s\S]*?)<\/div>/)?.[1] || ''
  assert.match(band, /id="sidebarToggle"/, 'Die Klinke fehlt im festen Band')
  assert.match(band, /id="ondaHome"/, 'Der Schriftzug hängt nicht am Fenster und fährt mit der Leiste weg')

  // Der Projektname ist die oberste Zeile der Leiste — dort hat er die volle Breite.
  const marke = html.match(/<div class="onda-brand">([\s\S]*?)<\/div>/)?.[1] || ''
  assert.match(marke, /id="sidebarBack"/, 'Der Weg zurück steht nicht mehr oben in der Leiste')

  // Die Leiste muss unter dem festen Band anfangen, sonst liegt ihre erste Zeile auf dem
  // Schriftzug. Genau das war beim ersten Versuch der Fall.
  const shell = await readFile(shellUrl, 'utf8')
  assert.match(
    shell.match(/#editorView \.onda-sidebar \{([^}]*)\}/)?.[1] || '',
    /padding:\s*var\(--topbar-height\)/,
    'Die Leiste beginnt wieder auf Höhe des Schriftzugs',
  )
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

test('Nirgends hört Text auf und drei Punkte kommen hinterher', async () => {
  // „außerdem generell die Regel, ich will, dass nirgendwo einfach der Text aufhört und
  //  dann Punkt, Punkt, Punkt kommt. sehr unprofessionell. Es soll ja nie der Fall sein."
  //  (Jakob, 8.8.2026)
  //
  // Die Regel gilt dem, was Jakob liest — nicht dem, was an das Modell geht. Ein Prompt
  // hat ein Zeichenbudget; ein Bildschirm hat Platz zum Umbrechen. Zwei Dateien kürzen
  // ausschließlich für den Prompt und sind deshalb ausgenommen.
  const nurFuerDasModell = new Set(['onda-kontext.mjs', 'arbeitskontext-model.mjs'])
  const ohneKommentare = text => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

  const { readdir } = await import('node:fs/promises')
  const srcUrl = new URL('../src/', import.meta.url)
  const dateien = await readdir(srcUrl)

  const funde = []
  for (const datei of dateien) {
    const inhalt = ohneKommentare(await readFile(new URL(datei, srcUrl), 'utf8'))

    if (datei.endsWith('.css')) {
      // Beides schneidet ab UND setzt die Punkte selbst — line-clamp genauso wie
      // text-overflow. Wer nur das eine verbietet, verschiebt das Problem.
      if (/text-overflow:\s*ellipsis/.test(inhalt)) funde.push(`${datei}: text-overflow: ellipsis`)
      if (/line-clamp/.test(inhalt)) funde.push(`${datei}: line-clamp`)
    }

    if ((datei.endsWith('.js') || datei.endsWith('.mjs')) && !nurFuerDasModell.has(datei)) {
      // Gesucht ist genau eine Form: ein Schnitt nach n Zeichen, dessen Ergebnis in einer
      // Zeichenkette steht, an die ein Auslassungszeichen geklebt wird — `${x.slice(0, n)}…`.
      // Das Muster bleibt bewusst in EINER Zeile. Über den Zeilenumbruch hinweg fing es
      // language-diagnostics.mjs: dort ist `slice(0, start)` der Text VOR einer Stelle,
      // und das … eine Zeile darunter gehört zu einer Zeichenklasse für Satzzeichen.
      if (/(?:slice|substring)\(0,[^)\n]*\)[^\n`]*\}…/.test(inhalt)) {
        funde.push(`${datei}: Schnitt nach Zeichenzahl mit …`)
      }

      // Menüpunkte tragen keine drei Punkte („die menüpunkte auch ohne punkte", Jakob,
      // 8.8.2026). In macOS-Menüs heißen sie „das öffnet noch ein Fenster" — aber das
      // muss man wissen; wer es nicht weiß, sieht abgeschnittenen Text.
      //
      // Nur Beschriftungen, nicht jedes Auslassungszeichen: Platzhalter („Antworten …")
      // und Verlaufsmeldungen („Agent denkt nach …") bleiben. Dort hört kein Text auf —
      // dort läuft etwas.
      for (const [muster, was] of [
        [/menuItem\([^,\n]+,\s*(['"`])[^'"`\n]*…/, 'Menüpunkt mit …'],
        [/\blabel:\s*(['"`])[^'"`\n]*…/, 'Beschriftung mit …'],
      ]) {
        if (muster.test(inhalt)) funde.push(`${datei}: ${was}`)
      }
    }
  }

  assert.deepEqual(funde, [], `Text wird wieder abgeschnitten:\n  ${funde.join('\n  ')}`)
})

test('Der Weg zurück trägt den ganzen Projektnamen', async () => {
  const css = await readFile(styleUrl, 'utf8')
  const zurueck = css.match(/\.onda-side-back \{([^}]*)\}/)?.[1] || ''

  // Volle Breite statt `flex: 1`: der Name teilt sich die Zeile mit niemandem mehr,
  // seit er oben steht. `align-items: flex-start` hält den Pfeil auf der ersten Zeile,
  // wenn der Name auf zwei oder drei geht.
  assert.match(zurueck, /width:\s*100%/, 'Der Weg-zurück-Knopf nimmt sich nicht die ganze Breite')
  assert.match(zurueck, /align-items:\s*flex-start/, 'Bei einem langen Namen schwebt der Pfeil zwischen den Zeilen')
  assert.doesNotMatch(zurueck, /white-space:\s*nowrap/, 'Der Projektname darf umbrechen')
  assert.match(css, /\.onda-side-back-chevron \{[^}]*flex:\s*none/, 'Der Pfeil selbst muss immer sichtbar bleiben')
})

// Task 7: EINE Stelle, an der Blöcke entstehen. Vorher holte workspace.js die Blöcke an gut
// zwanzig Stellen direkt aus dem Editor — eine davon zu vergessen hieße, dort still ohne
// Rollen zu arbeiten, ohne dass ein Test anschlägt. Genau so ist die Lücke entstanden, die
// dieser Umbau schließt, also hält ein Wächter sie zu.
//
// Der reguläre Ausdruck darf hier nirgends im Klartext danebenstehen: Ein Kommentar, der den
// gesuchten Aufruf beim Namen nennt, ließe den Wächter sich selbst finden statt den Code.
test('Blöcke entstehen in workspace.js an genau einer Stelle', async () => {
  const workspace = await readFile(new URL('../src/workspace.js', import.meta.url), 'utf8')
  assert.match(workspace, /function aktuelleBloecke\(/, 'die eine Blockquelle fehlt')
  assert.match(workspace, /function bausteinBestand\(/, 'die Ablage wird nirgends gelesen')
  assert.doesNotMatch(
    workspace,
    /getEditorBlocks\(ctx/,
    'workspace.js holt Blöcke wieder direkt aus dem Editor — dort fehlen dann die Rollen',
  )
})

// Task 9 (Issue #36, Kriterium 2): „Freier Absatz" war ein Etikett ohne Aussage — es sah aus
// wie eine Angabe und war keine. Ein Absatz, den die Erkennung noch nicht gelesen hat und den
// niemand bewusst als etwas angelegt hat, trägt jetzt gar nichts.
//
// Die Auswahl im Menü behält ihr Wort: Dort heißt „Freier Absatz" „lege einen gewöhnlichen
// Absatz an", und das ist eine Aussage. Deshalb prüft der Wächter die BESCHRIFTUNG der Karten
// (ROLE_LABELS), nicht die Menü-Auswahl (BLOCK_TYPES).
test('keine Struktur-Karte trägt mehr „Freier Absatz"', async () => {
  const workspace = await readFile(new URL('../src/workspace.js', import.meta.url), 'utf8')
  assert.doesNotMatch(
    workspace,
    /\|\| 'Freier Absatz'/,
    'eine Karte fällt noch auf „Freier Absatz" zurück',
  )
  assert.match(workspace, /bausteinNamen\(/, 'die Karten lesen die erkannten Namen nicht')
  assert.match(workspace, /'Überschrift'/, 'die Überschrift hat ihr Wort verloren')
  // Die Beschriftungstabelle darf den gewöhnlichen Absatz nicht mehr kennen — sonst käme das
  // Etikett über ROLE_LABELS.get() zurück, nur ohne den Rückfall daneben.
  const tabelle = workspace.match(/const ROLE_LABELS = new Map\(\[([\s\S]*?)\]\)/)?.[1] || ''
  assert.doesNotMatch(tabelle, /paragraph/, 'ROLE_LABELS beschriftet den gewöhnlichen Absatz noch')
})

// Task 8: Der Bausteinlauf hat einen eigenen Takt — Hinweise gehören zu jeder Schreibpause,
// die Art eines Absatzes ändert sich viel seltener. Er hat aber KEINE eigene Sperre mehr:
// die hält das Lauf-Tor (#12), wie bei jedem anderen bezahlten Kanal. Eine sechste
// Kopiervorlage neben dem Tor wäre genau der Rückwachs, den das Tor beenden sollte.
test('der Bausteinlauf läuft durchs Tor und hat einen eigenen Zeitgeber', async () => {
  const workspace = await readFile(new URL('../src/workspace.js', import.meta.url), 'utf8')
  assert.match(workspace, /function fuehreBausteinlaufAus\(/, 'der Lauf wird nirgends ausgeführt')
  assert.match(workspace, /function planeBausteinlauf\(/, 'der Lauf wird nirgends geplant')
  assert.match(workspace, /planeBausteinlauf\(\)/, 'planeBausteinlauf hat keinen Aufrufer')
  assert.match(workspace, /kanal: 'bausteine'/, 'der Lauf geht am Lauf-Tor vorbei')
  // Kein eigener Sperr-Zustand: Das Tor hält die Kanalsperre (kanalGesperrt/fuehreLaufAus).
  assert.doesNotMatch(workspace, /let bausteinlaufAktiv/, 'eine sechste eigene Lauf-Sperre ist zurück')
})

// Entscheidung 2 (Issue #36): Die von Hand gesetzte Textsorte muss den Lauf erreichen,
// sonst denkt sich das Modell eine zweite aus.
test('der Bausteinlauf bekommt das Projektwissen mit', async () => {
  const workspace = await readFile(new URL('../src/workspace.js', import.meta.url), 'utf8')
  const rumpf = workspace.match(/async function fuehreBausteinlaufAus\([\s\S]*?\n\}/)?.[0] || ''
  assert.ok(rumpf, 'fuehreBausteinlaufAus nicht gefunden')
  assert.match(rumpf, /onda/, 'der Lauf reicht kein Projektwissen weiter — die Textsorte wird geraten')
})

// Die Budgetpause merkt sich, WELCHER Lauf angehalten wurde. Die ausdrückliche Freigabe muss
// genau den wieder aufnehmen — sonst gibt jemand einen Lauf frei und bezahlt einen anderen.
// Vor dem Bausteinlauf fiel alles außer 'verstaendnis' auf den Hinweislauf zurück; mit einem
// sechsten Kanal ist dieser Rückfall eine falsche Auskunft.
test('die Budget-Freigabe nimmt den pausierten Lauf wieder auf, nicht irgendeinen', async () => {
  const workspace = await readFile(new URL('../src/workspace.js', import.meta.url), 'utf8')
  const rumpf = workspace.match(/function starteBewusstFreigegebenenAutomatiklauf\([\s\S]*?\n\}/)?.[0] || ''
  assert.ok(rumpf, 'starteBewusstFreigegebenenAutomatiklauf nicht gefunden')
  assert.match(rumpf, /'bausteine'/, 'ein freigegebener Bausteinlauf startet den Hinweislauf statt sich selbst')
  assert.match(rumpf, /fuehreBausteinlaufAus\(/, 'der freigegebene Bausteinlauf wird nirgends ausgeführt')
})
