// Typografie: keine Versalien, drei sichtbare Überschriftstufen, eine Textgröße,
// und beim Markieren wenige Werkzeuge statt einer Leiste über dem Text.
//
// Jakobs Rückmeldung vom 7. August 2026, wörtlich zitiert an der Stelle, wo sie gilt.
// Wer eine dieser Prüfungen fallen sieht, hat etwas zurückgebaut, das weg sollte.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'

const srcDir = new URL('../src/', import.meta.url)
const tokensUrl = new URL('../src/onda-tokens.css', import.meta.url)
const styleUrl = new URL('../src/style.css', import.meta.url)
const shellUrl = new URL('../src/onda-shell.css', import.meta.url)
const uiUrl = new URL('../src/ui.js', import.meta.url)
const editorUrl = new URL('../src/editor.js', import.meta.url)
const workspaceUrl = new URL('../src/workspace.js', import.meta.url)
const gestaltUrl = new URL('../evals/pruefungen/gestalt.mjs', import.meta.url)

// Kommentare erklären, was fort ist, und nennen es dabei beim Namen. Wer nach toten
// Bezeichnern sucht, muss deshalb den Fließtext des Codes ausblenden — sonst findet
// die Prüfung ihre eigene Begründung und schlägt Alarm.
function ohneKommentare(quelle) {
  return quelle.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|\s)\/\/[^\n]*/g, '$1')
}

// { recursive: true } (Node 22), damit ein künftiger Unterordner unter app/src/ nicht
// stillschweigend übergangen wird: ein flaches Lesen verschluckt Unterverzeichnisse samt
// allem darin — die Prüfung bliebe grün, ohne die neuen Dateien je gesehen zu haben.
// Vorbild: app/test/lauf-tor-waechter.test.mjs:15-24. Die zurückgegebenen Pfade sind
// relativ und mit '/' getrennt, so wie new URL(name, srcDir) sie erwartet.
//
// Die Untergrenze darunter ist der eigentliche Punkt: Ohne sie wäre diese Prüfung auch
// dann grün, wenn app/src/ leer wäre — eine Schleife über null Dateien beschwert sich
// nie. Genau so sieht eine Prüfung aus, die still lügt.
async function alleQuellen() {
  const namen = await readdir(srcDir, { recursive: true })
  const treffer = namen
    .map(name => String(name).split('\\').join('/'))
    .filter(name => /\.(css|js|mjs)$/.test(name))
  const inhalte = await Promise.all(treffer.map(name => readFile(new URL(name, srcDir), 'utf8')))
  const quellen = treffer.map((name, i) => [name, inhalte[i]])
  assert.ok(quellen.length >= 4,
    `Nur ${quellen.length} Quelldateien unter app/src/ gelesen — dort liegen normalerweise `
    + 'Dutzende. Entweder ist der Ordner leer, oder er liegt nicht mehr dort, wo hier gesucht wird.')
  return quellen
}

test('Kein einziges Element im Programm wird großgeschrieben', async () => {
  // „KEINE VERSALIEN IM GANZEN PROGRAMM. Ich find, es sieht sehr hässlich aus."
  const [quellen, html] = await Promise.all([
    alleQuellen(),
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
  ])
  for (const [name, inhalt] of [...quellen, ['index.html', html]]) {
    assert.doesNotMatch(inhalt, /text-transform:\s*uppercase/i, `Versalien per CSS in ${name}`)
    assert.doesNotMatch(inhalt, /\.toUpperCase\(/, `Versalien per JS in ${name}`)
  }
})

test('Die Rubrik trägt Gewicht und Farbe statt Großschreibung', async () => {
  const [tokens, css] = await Promise.all([readFile(tokensUrl, 'utf8'), readFile(styleUrl, 'utf8')])

  // Der Ersatz ist ein eigener Marker, damit alle fünf Fundstellen dieselbe Mischung
  // tragen und nicht fünfmal einzeln driften.
  assert.match(tokens, /--type-rubrik:\s*var\(--fw-medium\) var\(--text-xs\)\/var\(--leading-snug\) var\(--font-sans\)/)

  for (const selektor of [
    '.onda-eyebrow', '.source-form-label,\n.source-reader-kicker',
    '.memory-kicker', '.argument-kicker', '.language-kicker',
  ]) {
    const koerper = css.match(new RegExp(`${selektor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1]
    assert.ok(koerper, `Regel fehlt: ${selektor}`)
    assert.match(koerper, /font:\s*var\(--type-rubrik\)/, `${selektor} trägt nicht die Rubrik-Mischung`)
    // --tracking-wider (0.08em) gab es nur für Versalien; auf Kleinbuchstaben liest
    // es sich wie ein Satzfehler.
    assert.doesNotMatch(koerper, /--tracking-wider/, `${selektor} läuft noch versalien-weit`)
  }
})

test('Die drei Überschriftstufen liegen weit genug auseinander', async () => {
  const css = await readFile(styleUrl, 'utf8')
  const grad = ebene => {
    const koerper = css.match(new RegExp(`#editor \\.ProseMirror ${ebene} \\{([^}]*)\\}`))?.[1] || ''
    return parseFloat(koerper.match(/font-size:\s*([\d.]+)em/)?.[1] || '0')
  }
  const [h1, h2, h3] = ['h1', 'h2', 'h3'].map(grad)
  assert.ok(h1 > 0 && h2 > 0 && h3 > 0, 'Eine der drei Stufen ist verschwunden')
  assert.ok(h1 > h2 && h2 > h3 && h3 > 1, 'Die Stufen stehen nicht mehr der Größe nach')

  // Der Befund vom 7.8.2026: bei 15px Grundgröße lagen h2 (20,3px) und h3 (17,3px)
  // drei Pixel auseinander — ein Fünftel weniger, das im Fließsatz niemand mehr als
  // eigene Ebene liest. Es gab drei Ebenen im Schema und zwei im Auge. Zwischen zwei
  // Überschriften muss deshalb mindestens ein Fünftel UND mindestens dreieinhalb
  // Pixel liegen. Die alten 1,62/1,35/1,15 fallen an beidem.
  for (const [oben, unten] of [[h1, h2], [h2, h3]]) {
    assert.ok(oben / unten >= 1.2, `Stufe ${oben}em über ${unten}em ist nur Faktor ${(oben / unten).toFixed(3)}`)
    assert.ok((oben - unten) * 15 >= 3.5, `Stufe ${oben}em über ${unten}em sind nur ${((oben - unten) * 15).toFixed(1)}px`)
  }

  // Die kleinste Überschrift steht dem Fließtext naturgemäß nah — dort trägt nicht
  // die Größe die Unterscheidung, sondern das Gewicht. Sie muss trotzdem größer sein,
  // sonst wären es nur zwei Überschriftgrößen und nicht drei.
  const gewicht = ebene => (css.match(new RegExp(`#editor \\.ProseMirror ${ebene} \\{([^}]*)\\}`))?.[1] || '')
    .match(/font-weight:\s*(\d+)/)?.[1]
  assert.deepEqual(['h1', 'h2', 'h3'].map(gewicht), ['700', '700', '700'])

  // Der obere Abstand kündigt jede Stufe an — auch die kleine. Der Absatzabstand
  // beträgt .8em von 15px, also 12px; das Doppelte ist die Untergrenze.
  for (const ebene of ['h1', 'h2', 'h3']) {
    const koerper = css.match(new RegExp(`#editor \\.ProseMirror ${ebene} \\{([^}]*)\\}`))?.[1] || ''
    const [obenEm] = koerper.match(/margin:\s*([\d.]+)em/)?.slice(1) || []
    const eigenerGrad = grad(ebene) * 15
    assert.ok(parseFloat(obenEm) * eigenerGrad >= 24, `${ebene} kündigt sich nur ${(parseFloat(obenEm) * eigenerGrad).toFixed(1)}px vorher an`)
  }
})

test('Es gibt genau eine Textgröße — auch für eingefügten Fremdtext', async () => {
  const css = await readFile(styleUrl, 'utf8')
  // Der zweite Satz Regeln für #title und die Schreibspalte war tot: onda-shell.css
  // hat dieselben Selektoren bei gleicher Spezifität und wird später geladen. Er darf
  // nicht zurückkommen, sonst streiten wieder zwei Regeln um dieselbe Größe.
  const spalte = css.match(/#editorView #editor \.ProseMirror \{([^}]*)\}/)?.[1] || ''
  assert.doesNotMatch(spalte, /font-size/, 'style.css setzt wieder eine eigene Textgröße')
  assert.doesNotMatch(spalte, /width|max-width/, 'style.css streitet wieder um die Spaltenbreite')
  const titel = css.match(/#editorView #title \{([^}]*)\}/)?.[1] || ''
  assert.doesNotMatch(titel, /font-size|font-weight/, 'style.css setzt wieder einen eigenen Titelgrad')

  assert.match(css, /span\[style\*="font-size"\]\s*\{\s*font-size:\s*inherit\s*!important/,
    'Eingefügter Fremdtext darf keine zweite Textgröße mitbringen')
})

test('Kursiv lebt, alles andere an Auszeichnung bleibt aus', async () => {
  const js = await readFile(editorUrl, 'utf8')
  const konfiguration = js.match(/StarterKit\.configure\(\{([\s\S]*?)\}\)/)?.[1] || ''
  assert.ok(konfiguration, 'Die Schema-Konfiguration wurde nicht gefunden')

  // „kursiv, zitat und was schon da ist" — kursiv ist die einzige Auszeichnung, die
  // ein wissenschaftlicher deutscher Text braucht (Werktitel, fremdsprachige Wörter).
  assert.doesNotMatch(konfiguration, /italic:\s*false/, 'Kursiv ist wieder abgeschaltet')
  // „NICHTS dazuerfinden, nur reduzieren."
  for (const aus of ['bold', 'strike', 'code']) {
    assert.match(konfiguration, new RegExp(`${aus}:\\s*false`), `${aus} ist wieder eingeschaltet`)
  }
})

test('Beim Markieren erscheinen vier Werkzeuge, sonst keins', async () => {
  const [js, css] = await Promise.all([readFile(uiUrl, 'utf8'), readFile(styleUrl, 'utf8')])

  // Sie darf nichts verdrängen: position:fixed liegt außerhalb jedes Flusses.
  const leiste = css.match(/\.auswahl-leiste \{([^}]*)\}/)?.[1] || ''
  assert.match(leiste, /position:\s*fixed/, 'Die Auswahl-Leiste steht im Fluss und könnte den Text verdrängen')
  assert.match(leiste, /var\(--dur-quick\)/, 'Bewegung ohne Marke greift prefers-reduced-motion nicht ab')
  assert.doesNotMatch(leiste, /--ease-spring/, '--ease-spring ist der Aura vorbehalten, nicht funktionaler UI')

  // Vier Werkzeuge, keins mehr — Aufzählung, Liste, Checkliste und Trennlinie bleiben
  // im Slash-Menü, wo sie hingehören.
  const bau = js.match(/function baueAuswahlLeiste\(\)\{?([\s\S]*?)\n\}/)?.[1] || ''
  assert.ok(bau, 'Die Auswahl-Leiste wird nirgends gebaut')
  assert.equal((bau.match(/auswahlKnopf\(/g) || []).length, 4, 'Die Leiste hat nicht genau vier Werkzeuge')
  assert.match(bau, /role', 'toolbar/)
  assert.match(bau, /toggleItalic|dataset\.cmd = 'italic'/)
  assert.match(bau, /toggleBlockquote/)
  assert.match(bau, /openLinkDialog/)

  // Das Slash-Menü und der Format-Knopf zeigen dieselben vier Absatzformate.
  assert.match(js, /function blockFormate\(\)/, 'Die Absatzformate stehen wieder an zwei Stellen')
  assert.match(js, /\.\.\.blockFormate\(\)\.map/, 'Das Slash-Menü führt eine eigene zweite Liste')
  // Jakobs Worte statt Nummern: „groß/mittel/klein".
  for (const name of ['Überschrift groß', 'Überschrift mittel', 'Überschrift klein']) {
    assert.match(js, new RegExp(name))
  }
})

test('Die Reste der alten Werkzeugleiste sind fort', async () => {
  const [rohJs, rohCss] = await Promise.all([readFile(uiUrl, 'utf8'), readFile(styleUrl, 'utf8')])
  const js = ohneKommentare(rohJs)
  const css = ohneKommentare(rohCss)

  // updateToolbarState() griff auf #blockLabel zu — das Element gibt es seit c0a8f21
  // nicht mehr — und rief darin currentBlock() und blockBtn auf, die nirgends
  // deklariert waren. Ein ReferenceError hinter einem `if`, das nie wahr wurde.
  assert.doesNotMatch(js, /getElementById\('blockLabel'\)/)
  assert.doesNotMatch(js, /\bcurrentBlock\(\)/)
  assert.doesNotMatch(js, /\bblockBtn\b/)
  for (const tot of ['.tbtn', '.tbtn-label', '.tbtn-block', '.tbtn-lane', '.bar-group', '.bar-sep']) {
    assert.doesNotMatch(css, new RegExp(`\\${tot}\\s*[,{:]`), `Tote Regel ${tot} steht wieder im Blatt`)
  }
})

test('DESIGN-04 nimmt Rubriken nicht mehr von der Versalien-Prüfung aus', async () => {
  const js = await readFile(gestaltUrl, 'utf8')
  // Die Ausnahme berief sich auf einen Satz im Design System, den Jakob aufgehoben
  // hat. Mit ihr war DESIGN-04 grün, während fünf Versalien-Beschriftungen sichtbar
  // auf dem Schirm standen.
  assert.doesNotMatch(js, /istRubrik/, 'DESIGN-04 misst wieder an den Rubriken vorbei')
  assert.match(js, /textTransform !== 'uppercase'/)
})

// ---------- Beschriftung gegen Eintrag ----------
// Ohne Versalien muss die Auszeichnung aus Grad, Gewicht und Farbe kommen. Ein
// einziger Gewichtsschritt bei gleicher Größe und gleicher Farbe reicht nicht: genau
// so stand die Seitenleiste am 7.8.2026 da, und „Warum es wichtig ist" las sich
// mindestens so stark wie „Struktur" darüber. Die Regel steht bei --type-rubrik in
// onda-tokens.css und gilt an jedem Ort gleich.

// Löst die Marken auf, die in einer Regel stehen — sonst prüfte man Namen statt Werte.
function markenTabelle(tokens) {
  const wert = name => tokens.match(new RegExp(`--${name}:\\s*([^;]+)`))?.[1].trim()
  const grade = Object.fromEntries(['xs', 'base', 'xl', '4xl'].map(k => [`--text-${k}`, parseFloat(wert(`text-${k}`))]))
  const gewichte = Object.fromEntries(['regular', 'medium', 'bold'].map(k => [`--fw-${k}`, Number(wert(`fw-${k}`))]))
  const mischungen = {}
  for (const name of ['display', 'title', 'body', 'label', 'caption', 'rubrik']) {
    const roh = wert(`type-${name}`) || ''
    mischungen[`--type-${name}`] = {
      gewicht: gewichte[roh.match(/var\((--fw-[a-z]+)\)/)?.[1]],
      grad: grade[roh.match(/var\((--text-[a-z\d]+)\)/)?.[1]],
    }
  }
  return { grade, gewichte, mischungen }
}

function regelKoerper(blaetter, selektor) {
  for (const css of blaetter) {
    const start = css.indexOf(`\n${selektor}`)
    if (start === -1) continue
    const auf = css.indexOf('{', start)
    return css.slice(auf + 1, css.indexOf('}', auf))
  }
  throw new Error(`CSS-Regel fehlt: ${selektor}`)
}

// Mehrere Regeln in Kaskadenreihenfolge: die spätere überschreibt, was sie nennt.
function mischung(blaetter, marken, selektoren) {
  const ergebnis = { grad: null, gewicht: null, farbe: null }
  for (const selektor of selektoren) {
    const koerper = regelKoerper(blaetter, selektor)
    const typ = koerper.match(/font:\s*var\((--type-[a-z]+)\)/)?.[1]
    if (typ) Object.assign(ergebnis, marken.mischungen[typ])
    const rohGrad = koerper.match(/font:[^;]*var\((--text-[a-z\d]+)\)/)?.[1]
    if (rohGrad) ergebnis.grad = marken.grade[rohGrad]
    const rohGewicht = koerper.match(/font(?:-weight)?:\s*var\((--fw-[a-z]+)\)/)?.[1]
    if (rohGewicht) ergebnis.gewicht = marken.gewichte[rohGewicht]
    const farbe = koerper.match(/(?:^|[;{\s])color:\s*var\((--text-(?:primary|secondary|tertiary))\)/)?.[1]
    if (farbe) ergebnis.farbe = farbe
  }
  return ergebnis
}

test('Beschriftung und Eintrag trennen Gewicht plus Grad oder Farbe — überall dieselbe Antwort', async () => {
  const [tokens, style, shell] = await Promise.all([
    readFile(tokensUrl, 'utf8'), readFile(styleUrl, 'utf8'), readFile(shellUrl, 'utf8'),
  ])
  const marken = markenTabelle(tokens)
  const blaetter = [style, shell]

  const paare = [
    ['Seitenleiste, Abschnitt', ['.onda-side-name {'], ['.block-preview-excerpt {']],
    ['Seitenleiste, Quellenbaum', ['.onda-baum-name {'], ['.onda-baum-quelle {']],
    ['Fenster, Gruppe', ['.onda-blaetter__gruppe {'], ['.onda-blaetter__eintrag {']],
    ['Fenster, Quellengruppe',
      ['.onda-blaetter__eintrag {', '.onda-blaetter__eintrag--gruppe {'],
      ['.onda-blaetter__eintrag {', '.onda-blaetter__eintrag--kind {']],
    // „Zuletzt bearbeitet" über den Einträgen daneben. Nav- und Recent-Einträge teilen
    // sich eine Regel, deshalb steht hier der gemeinsame Selektor.
    ['Bibliothek', ['.onda-eyebrow {'], ['.onda-library-nav__item,']],
  ]

  for (const [ort, oben, unten] of paare) {
    const beschriftung = mischung(blaetter, marken, oben)
    const eintrag = mischung(blaetter, marken, unten)
    assert.equal(beschriftung.gewicht, marken.gewichte['--fw-medium'],
      `${ort}: die Beschriftung wiegt ${beschriftung.gewicht} statt 500`)
    assert.equal(eintrag.gewicht, marken.gewichte['--fw-regular'],
      `${ort}: der Eintrag wiegt ${eintrag.gewicht} statt 400`)
    const zweites = beschriftung.grad !== eintrag.grad || beschriftung.farbe !== eintrag.farbe
    assert.ok(zweites, `${ort}: Beschriftung und Eintrag unterscheidet nur das Gewicht `
      + `(${beschriftung.grad}px/${beschriftung.farbe} gegen ${eintrag.grad}px/${eintrag.farbe})`)
  }

  // Mittleres Gewicht ist für zweierlei reserviert: für eine Beschriftung und für das,
  // was gerade gewählt ist. Ohne diese zweite Verwendung ginge der gewählte Eintrag in
  // der Liste unter, sobald die Einträge auf 400 ruhen.
  assert.match(regelKoerper(blaetter, '.onda-blaetter__eintrag[aria-current="true"] {'),
    /font-weight:\s*var\(--fw-medium\)/, 'Der gewählte Eintrag hebt sich nicht mehr ab')
  assert.match(regelKoerper(blaetter, '.onda-library-nav__item.is-active {'),
    /font-weight:\s*var\(--fw-medium\)/, 'Der aktive Bibliothekseintrag hebt sich nicht mehr ab')
})

test('Der Fenstername ist größer als die Überschrift darunter und trägt einen Hausgrad', async () => {
  const [tokens, style] = await Promise.all([readFile(tokensUrl, 'utf8'), readFile(styleUrl, 'utf8')])
  const marken = markenTabelle(tokens)
  const name = mischung([style], marken, ['.onda-dialog-title {'])
  const tiefe = mischung([style], marken, ['.onda-blaetter__tiefe-titel {'])

  // 18px war der Grad des Fensternamens — keiner der vier Hausgrade, und kleiner als
  // die Überschrift der rechten Spalte darunter. „Aufgabe" las sich größer als
  // „Projektverständnis": die Hierarchie stand auf dem Kopf.
  const hausgrade = Object.values(marken.grade)
  assert.ok(hausgrade.includes(name.grad), `Der Fenstername misst ${name.grad}px — kein Hausgrad`)
  assert.ok(hausgrade.includes(tiefe.grad), `Die Überschrift misst ${tiefe.grad}px — kein Hausgrad`)
  assert.ok(name.grad > tiefe.grad,
    `Der Fenstername (${name.grad}px) überragt die Überschrift darunter (${tiefe.grad}px) nicht`)
  for (const selektor of ['.onda-dialog-title {', '.onda-blaetter__tiefe-titel {']) {
    assert.doesNotMatch(regelKoerper([style], selektor), /font(?:-size)?:[^;]*\b\d+px/,
      `${selektor} setzt wieder einen rohen Grad statt einer Marke`)
  }
})

test('Im Projektverständnis steht der Wortlaut nicht zweimal untereinander', async () => {
  const js = await readFile(workspaceUrl, 'utf8')
  const tabelle = js.slice(js.indexOf('const PV_FELDER = ['), js.indexOf(']', js.indexOf('const PV_FELDER = [')))
  const felder = [...tabelle.matchAll(/label: '([^']+)',\s*feld: '([^']+)'/g)].map(t => [t[1], t[2]])

  assert.equal(felder.length, 6, `Es sind ${felder.length} Felder mit eigenem Feldnamen statt sechs`)
  for (const [ueberschrift, feldname] of felder) {
    // Die Struktur-Ansicht macht es vor: „Freier Absatz" sagt, WO man ist, „Text dieses
    // Bausteins" sagt, WAS man schreibt. Im Verständnis-Fenster stand beides gleich.
    assert.notEqual(feldname, ueberschrift, `„${ueberschrift}" steht zweimal untereinander`)
  }
  // Und die Überschrift kommt aus label, das Feld aus feld — nicht beide aus label.
  assert.match(js, /createNode\('h3', 'onda-blaetter__tiefe-titel', feld\.label\)/)
  assert.match(js, /bearbeitbaresFeld\(tief, feld\.feld,/)
})
