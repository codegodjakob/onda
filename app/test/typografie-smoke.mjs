// Typografie am laufenden Programm: keine Versalien auf dem Schirm, drei
// unterscheidbare Überschriftstufen, eine Textgröße — und die Auswahl-Leiste, die
// beim Markieren kommt und mit der Markierung wieder geht.
//
// Gemessen wird im Browser, nicht in der Quelle: was im Blatt steht, ist erst dann
// wahr, wenn keine spätere Regel es überschreibt. Genau daran ist die Schreibspalte
// schon zweimal zerdrückt worden.

import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const mimeByExtension = {
  '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.woff2': 'font/woff2',
}

// Eigener Server auf eigenem Port. Ein fester Port kann einer fremden Sitzung
// gehören — dann misst man deren Code und hält das Ergebnis für seines.
let staticServer = null
let baseUrl = process.env.AIWT_URL
if (!baseUrl) {
  staticServer = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname)
      const target = resolve(appRoot, pathname === '/' ? 'index.html' : pathname.slice(1))
      if (target !== appRoot && !target.startsWith(`${appRoot}${sep}`)) { response.writeHead(403).end(); return }
      const content = await readFile(target)
      response.writeHead(200, { 'content-type': mimeByExtension[extname(target)] || 'application/octet-stream' })
      response.end(content)
    } catch { response.writeHead(404).end() }
  })
  await new Promise(listening => staticServer.listen(0, '127.0.0.1', listening))
  baseUrl = `http://127.0.0.1:${staticServer.address().port}/`
}

async function sichtbareVersalien(page) {
  return page.evaluate(() => [...document.querySelectorAll('*')]
    .filter(node => !node.children.length && node.offsetParent)
    .filter(node => getComputedStyle(node).textTransform === 'uppercase')
    .filter(node => node.getBoundingClientRect().width > 0)
    .map(node => `${node.className || node.tagName}: ${node.textContent.trim().slice(0, 24)}`))
}

async function oeffneBeispiel(page) {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
  await page.locator('#doclist .doc').first().click()
  await page.locator('#editor .ProseMirror').waitFor({ state: 'visible' })
}

// Der rAF-Riegel: die Leiste misst ihre Lage erst im nächsten Bild, also muss die
// Prüfung mindestens ein Bild abwarten, bevor sie urteilt.
const bildwechsel = page => page.evaluate(() => new Promise(fertig => (
  requestAnimationFrame(() => requestAnimationFrame(fertig))
)))
const leisteOffen = page => page.evaluate(() => (
  document.querySelector('.auswahl-leiste')?.classList.contains('open') === true
))
// Mitten im Einblenden steht die Leiste noch verkleinert da; getBoundingClientRect
// gibt die verwandelte Größe zurück. Wer da schon misst, misst die Bewegung.
const ruhe = locator => locator.evaluate(async node => {
  await Promise.all(node.getAnimations({ subtree: true }).map(bewegung => bewegung.finished.catch(() => {})))
})

async function pruefeVersalien(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  // „KEINE VERSALIEN IM GANZEN PROGRAMM." Bibliothek zuerst.
  assert.deepEqual(await sichtbareVersalien(page), [], 'Versalien in der Bibliothek')
  await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
  await page.locator('#doclist .doc').first().click()
  await page.locator('#editor .ProseMirror').waitFor({ state: 'visible' })
  assert.deepEqual(await sichtbareVersalien(page), [], 'Versalien in der Schreibansicht')

  // Und die Rubrik ist trotzdem als Rubrik zu erkennen: kleinster Grad, mittleres
  // Gewicht gegen 400 im Fließtext, zurückgenommene Farbe.
  const rubrik = await page.locator('.onda-eyebrow').first().evaluate(node => {
    const stil = getComputedStyle(node)
    return {
      groesse: stil.fontSize, gewicht: stil.fontWeight, laufweite: stil.letterSpacing,
      farbe: stil.color, fliesstextFarbe: getComputedStyle(document.querySelector('#editor .ProseMirror')).color,
    }
  })
  assert.equal(rubrik.groesse, '12px', `Die Rubrik misst ${rubrik.groesse}`)
  assert.equal(rubrik.gewicht, '500', `Die Rubrik wiegt ${rubrik.gewicht} statt 500`)
  assert.ok(parseFloat(rubrik.laufweite) < 0.5, `Die Rubrik läuft ${rubrik.laufweite} weit — das war die Versalien-Laufweite`)
  assert.notEqual(rubrik.farbe, rubrik.fliesstextFarbe, 'Die Rubrik trägt dieselbe Farbe wie der Fließtext')
  await page.close()
}

async function pruefeStufen(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await oeffneBeispiel(page)
  await page.evaluate(() => window.AIWT.state.editor.commands.setContent(
    '<h1>Groß</h1><p>Fließtext eins</p><h2>Mittel</h2><p>Fließtext zwei</p>'
    + '<h3>Klein</h3><p>Fließtext drei</p><blockquote><p>Ein Zitat</p></blockquote>'
    + '<ul><li><p>Ein Punkt</p></li></ul>',
  ))
  await bildwechsel(page)

  const grade = await page.evaluate(() => {
    const lies = wahl => [...document.querySelectorAll(`#editor .ProseMirror ${wahl}`)]
      .map(node => parseFloat(getComputedStyle(node).fontSize))
    return {
      h1: lies('h1')[0], h2: lies('h2')[0], h3: lies('h3')[0],
      koerper: [...lies('p'), ...lies('li')],
      titel: parseFloat(getComputedStyle(document.getElementById('title')).fontSize),
      spalte: document.querySelector('#editor .ProseMirror').getBoundingClientRect().width,
    }
  })

  // „EINE Textgröße" — Absatz, Zitat und Listeneintrag messen dasselbe.
  assert.deepEqual([...new Set(grade.koerper)], [15], `Der Fließtext hat ${new Set(grade.koerper).size} Größen: ${[...new Set(grade.koerper)]}`)
  assert.equal(grade.titel, 40, `Der Titel misst ${grade.titel}px`)
  assert.ok(grade.spalte >= 640 && grade.spalte <= 680, `Die Schreibspalte ist ${grade.spalte}px breit`)

  // „Drei Überschriftgrößen (groß/mittel/klein)" — und drei, die man auch sieht.
  // Vor dem 7.8.2026 lagen h2 und h3 drei Pixel auseinander, das las niemand als
  // eigene Ebene. Zwischen zwei Überschriften muss ein Fünftel und dreieinhalb Pixel
  // liegen; vom Titel zur größten Überschrift ohnehin mehr.
  assert.ok(grade.titel > grade.h1, `Der Titel (${grade.titel}px) überragt die große Überschrift nicht`)
  for (const [oben, unten] of [[grade.h1, grade.h2], [grade.h2, grade.h3]]) {
    assert.ok(oben / unten >= 1.2, `Stufe ${oben}px über ${unten}px ist nur Faktor ${(oben / unten).toFixed(3)}`)
    assert.ok(oben - unten >= 3.5, `Stufe ${oben}px über ${unten}px sind nur ${(oben - unten).toFixed(1)}px`)
  }
  // Die kleinste Überschrift steht dem Fließtext nah; dort trägt das Gewicht die
  // Unterscheidung. Größer muss sie trotzdem sein, sonst sind es nur zwei Stufen.
  assert.ok(grade.h3 > 15, `Die kleine Überschrift misst ${grade.h3}px wie der Fließtext`)
  const gewichte = await page.evaluate(() => ['h1', 'h2', 'h3', 'p']
    .map(t => getComputedStyle(document.querySelector(`#editor .ProseMirror ${t}`)).fontWeight))
  assert.deepEqual(gewichte, ['700', '700', '700', '400'])
  await page.close()
}

async function pruefeAuswahlLeiste(browser) {
  // Eigener Kontext, weil die axe-Prüfung weiter unten einen braucht — und mit
  // reduzierter Bewegung, weil axe sonst die Anmerkung MITTEN in ihrer Ankunft misst
  // (--dur-ankunft, 720ms) und die halbdurchsichtige Zwischenstufe als Kontrastfehler
  // meldet. Derselbe Grund, aus dem der bestehende Barrierefrei-Lauf es genauso macht.
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await oeffneBeispiel(page)

  // Vor dem Markieren steht über dem Text nichts (docs/PHILOSOPHIE.md §1).
  await bildwechsel(page)
  assert.equal(await leisteOffen(page), false, 'Die Auswahl-Leiste steht, ohne dass etwas markiert ist')

  const vorher = await page.locator('#editor .ProseMirror').evaluate(n => n.getBoundingClientRect().width)

  await page.locator('#editor .ProseMirror p').first().click({ clickCount: 3 })
  await bildwechsel(page)
  await page.waitForFunction(() => document.querySelector('.auswahl-leiste')?.classList.contains('open'))

  // Harte Regel 1: die Schreibspalte gibt kein Pixel ab, auch nicht an die Leiste.
  const nachher = await page.locator('#editor .ProseMirror').evaluate(n => n.getBoundingClientRect().width)
  assert.equal(nachher, vorher, `Die Schreibspalte schrumpfte von ${vorher} auf ${nachher}px`)

  const leiste = page.locator('.auswahl-leiste')
  await ruhe(leiste)
  assert.equal(await leiste.getAttribute('role'), 'toolbar')
  assert.ok((await leiste.getAttribute('aria-label'))?.length > 0, 'Die Leiste hat keinen Namen für Vorlesegeräte')
  assert.equal(await leiste.evaluate(n => getComputedStyle(n).position), 'fixed')

  const knoepfe = await leiste.locator('.auswahl-knopf').evaluateAll(nodes => nodes.map(node => ({
    text: node.textContent.trim(),
    name: node.getAttribute('aria-label') || node.textContent.trim(),
    hoehe: node.getBoundingClientRect().height,
  })))
  assert.equal(knoepfe.length, 4, `Die Leiste hat ${knoepfe.length} Werkzeuge statt vier`)
  knoepfe.forEach(k => {
    assert.ok(k.name.length > 0, 'Ein Werkzeug hat keinen Namen')
    assert.ok(k.hoehe >= 44, `„${k.text}" ist nur ${k.hoehe}px hoch`)
  })
  // Der Format-Knopf sagt, was der Absatz gerade IST — er ersetzt damit die Anzeige,
  // die die alte Werkzeugleiste dafür brauchte.
  assert.match(knoepfe[0].text, /Text|Überschrift/)

  // Die Zurückhaltung gilt den Augen, nicht der Zugänglichkeit: die OFFENE Leiste muss
  // die axe-Prüfung genauso bestehen wie der Rest. Der bestehende Barrierefrei-Lauf
  // markiert nirgends Text und bekommt sie deshalb nie zu sehen. Sie wird hier
  // geprüft, solange sie noch steht — später im Lauf ist sie wieder fort.
  assert.equal(await leisteOffen(page), true, 'Die Leiste war schon zu — die axe-Prüfung sähe sie gar nicht')
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const schwer = axe.violations.filter(fund => ['critical', 'serious'].includes(fund.impact))
  assert.deepEqual(schwer.map(fund => ({ id: fund.id, ziele: fund.nodes.map(n => n.target) })), [])

  // Dieselbe Leiste im dunklen Kleid. Ein neuer Bedienbereich muss in beiden Fassungen
  // lesbar sein, nicht nur in der, in der zufällig geprüft wird.
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark' })
  const axeDunkel = await new AxeBuilder({ page }).include('.auswahl-leiste')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  assert.deepEqual(axeDunkel.violations.map(fund => fund.id), [])
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light' })

  // Pfeiltasten wandern zwischen den Werkzeugen, Escape gibt den Text zurück.
  await leiste.locator('.auswahl-knopf').first().focus()
  await page.keyboard.press('ArrowRight')
  assert.equal(await page.evaluate(() => document.activeElement?.textContent.trim()), 'Kursiv')
  await page.keyboard.press('Escape')
  await bildwechsel(page)
  assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('ProseMirror')), true,
    'Escape gibt den Fokus nicht an den Text zurück')
  assert.equal(await leisteOffen(page), false, 'Escape schließt die Leiste nicht')

  // Kursiv ist die einzige Auszeichnung, die zurückkam.
  await page.locator('#editor .ProseMirror p').first().click({ clickCount: 3 })
  await page.waitForFunction(() => document.querySelector('.auswahl-leiste')?.classList.contains('open'))
  const kursiv = leiste.locator('[data-cmd="italic"]')
  assert.equal(await kursiv.getAttribute('aria-pressed'), 'false')
  await kursiv.click()
  await bildwechsel(page)
  assert.match(await page.evaluate(() => window.AIWT.state.editor.getHTML()), /<em>/)
  assert.equal(await kursiv.getAttribute('aria-pressed'), 'true')

  // Mit der Markierung geht sie wieder. Ein Klick ohne Ziehen setzt nur den Cursor.
  await page.locator('#editor .ProseMirror p').first().click()
  await bildwechsel(page)
  await page.waitForFunction(() => document.querySelector('.auswahl-leiste')?.classList.contains('open') === false)
  // Und sie liegt dann auch nicht mehr im Tastaturweg.
  assert.equal(await leiste.evaluate(n => n.inert), true, 'Die geschlossene Leiste ist noch antabbar')

  // Auf dem schmalsten Fenster darf sie nicht seitlich hinausragen: eine feste Fläche,
  // die über den Rand steht, schiebt das ganze Dokument. Der Format-Knopf trägt dort
  // das längste Wort des Programms ("Überschrift mittel").
  await page.setViewportSize({ width: 320, height: 760 })
  await bildwechsel(page)
  // Ausdrücklich eine Überschrift: nur dort trägt der Format-Knopf das lange Wort,
  // und nur dann wird es überhaupt eng. Auf einem Absatz stünde bloß „Text".
  await page.locator('#editor .ProseMirror h2').first().click({ clickCount: 3 })
  await page.waitForFunction(() => document.querySelector('.auswahl-leiste')?.classList.contains('open'))
  assert.match(await page.locator('.auswahl-knopf-text').first().textContent(), /Überschrift/)
  await ruhe(leiste)
  await bildwechsel(page)
  const ueberlauf = await page.evaluate(() => {
    const l = document.querySelector('.auswahl-leiste').getBoundingClientRect()
    return {
      dokument: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      links: Math.round(l.left), rechts: Math.round(l.right), fenster: window.innerWidth,
    }
  })
  assert.ok(ueberlauf.dokument <= 1, `320px: ${ueberlauf.dokument}px horizontaler Überlauf`)
  assert.ok(ueberlauf.links >= 0 && ueberlauf.rechts <= ueberlauf.fenster,
    `Die Leiste steht bei ${ueberlauf.fenster}px von ${ueberlauf.links} bis ${ueberlauf.rechts}`)
  await page.setViewportSize({ width: 1440, height: 1000 })

  // Und alles andere bleibt aus — auch beim Einfügen von Fremdtext.
  const fremd = await page.evaluate(() => {
    const e = window.AIWT.state.editor
    e.commands.setContent('<p><strong>Fett</strong> <em>Kursiv</em> <s>Weg</s> <code>Code</code></p>')
    return e.getHTML()
  })
  assert.match(fremd, /<em>Kursiv<\/em>/)
  assert.doesNotMatch(fremd, /<(?:strong|s|code)\b/)
  await context.close()
}

// ---------- Ganze Wörter ----------
// „ich will, dass nirgendwo einfach der Text aufhört" (Jakob, 8.8.2026) gilt nicht nur
// den drei Punkten am Ende. Ein Wort, das mitten entzweigebrochen wird, ist derselbe
// Fehler in anderer Gestalt: Text wird verstümmelt, damit er in einen Kasten passt.
//
// Gemessen wird die VERMEIDBARE Trennung, und die erkennt man an zwei Dingen zugleich:
//
//   1. Das Wort FÄNGT eine Zeile AN und bricht trotzdem. Steht ein Wort mitten in einem
//      Absatz, ist am Zeilenende naturgemäß nur noch ein Rest Platz — dass es dort
//      getrennt wird, ist gewöhnlicher Fließtext und in deutscher Typografie richtig
//      („Über-legung"). Wer eine Zeile anfängt, hat dagegen die ganze Breite vor sich.
//   2. Es hätte in eine volle Zeile der Karte gepasst. Gerechnet wird ausdrücklich gegen
//      die KARTE, nicht gegen die Spalte, in der das Wort gerade steht: Genau die zu
//      schmale Spalte war ja der Fehler. Wer gegen sie prüft, erklärt den Fehler für
//      unvermeidlich und meldet Grün.
//
// Beides zusammen heißt: Der Umbruch hat nichts erspart. Das Wort hatte Platz und wurde
// trotzdem zerteilt. Ein wirklich zu langes Wort — länger als die Karte breit ist —
// bleibt erlaubt; dort setzt die Silbentrennung einen Strich, und der sagt an, dass es
// weitergeht.
const gebrocheneWoerter = page => page.evaluate(() => {
  const karte = [...document.querySelectorAll('.onda-annotation')].find(k => k.offsetParent)
  if (!karte) return { fehler: 'keine sichtbare Anmerkungskarte — hier ist nichts zu messen' }

  // Eine Probe mit demselben Schriftschnitt, die nicht umbrechen darf, sagt, wie breit
  // ein Wort ungebrochen wäre.
  const probe = document.createElement('span')
  probe.style.cssText = 'position:fixed;left:-9999px;top:0;white-space:pre;visibility:hidden'
  document.body.append(probe)
  const natuerlicheBreite = (wort, stil) => {
    probe.style.font = `${stil.fontStyle} ${stil.fontWeight} ${stil.fontSize} / ${stil.lineHeight} ${stil.fontFamily}`
    probe.textContent = wort
    return probe.getBoundingClientRect().width
  }

  // Wie viel Platz HÄTTE das Wort gehabt? Ausdrücklich nicht die Breite der Spalte, in
  // der es gerade steht — die ist ja das Ergebnis des Layouts und damit der Fehler
  // selbst. Gefragt ist die Karte: was bliebe, wenn dem Wort eine ganze Zeile gehörte.
  // Gerechnet wird von der Innenbreite der Karte abwärts, abzüglich der Ränder aller
  // Kästen, die zwischen ihr und dem Wort liegen.
  const karteStil = getComputedStyle(karte)
  const karteInnen = karte.getBoundingClientRect().width
    - parseFloat(karteStil.paddingLeft) - parseFloat(karteStil.paddingRight)
  const platzInDerKarte = element => {
    let abzug = 0
    for (let knoten = element; knoten && knoten !== karte; knoten = knoten.parentElement) {
      const stil = getComputedStyle(knoten)
      if (stil.display.startsWith('inline')) continue
      abzug += parseFloat(stil.paddingLeft) + parseFloat(stil.paddingRight)
        + parseFloat(stil.borderLeftWidth) + parseFloat(stil.borderRightWidth)
        + parseFloat(stil.marginLeft) + parseFloat(stil.marginRight)
    }
    return karteInnen - abzug
  }

  // Fängt das Wort seine Zeile an? Verglichen wird mit der linken Innenkante des Kastens,
  // in dem es steht — dem nächsten Vorfahr, der die Zeilen umbricht.
  const faengtZeileAn = (element, ersteZeile) => {
    let knoten = element
    while (knoten && knoten !== karte && getComputedStyle(knoten).display.startsWith('inline')) {
      knoten = knoten.parentElement
    }
    const stil = getComputedStyle(knoten || element)
    const kante = (knoten || element).getBoundingClientRect().left
      + parseFloat(stil.paddingLeft) + parseFloat(stil.borderLeftWidth)
    return ersteZeile.left <= kante + 1
  }

  const funde = []
  const lauf = document.createTreeWalker(karte, NodeFilter.SHOW_TEXT)
  let knoten
  while ((knoten = lauf.nextNode())) {
    const eltern = knoten.parentElement
    if (!eltern?.offsetParent) continue
    const stil = getComputedStyle(eltern)
    const platz = platzInDerKarte(eltern)
    for (const treffer of (knoten.nodeValue || '').matchAll(/\S{2,}/g)) {
      const bereich = document.createRange()
      bereich.setStart(knoten, treffer.index)
      bereich.setEnd(knoten, treffer.index + treffer[0].length)
      const rechtecke = [...bereich.getClientRects()]
      const zeilen = new Set(rechtecke.map(rechteck => Math.round(rechteck.top)))
      if (zeilen.size < 2) continue
      if (!faengtZeileAn(eltern, rechtecke[0])) continue
      const breite = natuerlicheBreite(treffer[0], stil)
      if (breite > platz) continue
      funde.push(`„${treffer[0]}" in ${eltern.className || eltern.tagName}: `
        + `${Math.round(breite)}px Wort in ${Math.round(platz)}px Platz, trotzdem auf ${zeilen.size} Zeilen`)
    }
  }
  probe.remove()

  // Und nichts läuft seitlich aus der Karte heraus: ein Wort, das nicht gebrochen wird,
  // aber über den Rand steht, wäre nur die andere Hälfte desselben Fehlers.
  const kr = karte.getBoundingClientRect()
  const raus = [...karte.querySelectorAll('*')]
    .filter(kind => kind.getBoundingClientRect().right > kr.right + 1)
    .map(kind => kind.className || kind.tagName)

  return { funde, raus, karteBreite: Math.round(kr.width) }
})

// Die zweite Hälfte der Regel, und sie braucht eine eigene Messung. Ob ein Umbruch
// mitten im Wort einen Trennstrich gesetzt hat, lässt sich am gezeichneten Text NICHT
// ablesen: der Strich ist kein Zeichen im Dokument, und die Rechtecke eines Bereichs
// zählen ihn nicht mit (nachgemessen 8.8.2026 — Unterschied exakt 0). Gefragt wird
// deshalb die Regel selbst, und zwar die WIRKSAME am laufenden Programm, nicht ihr
// Wortlaut in der Datei: `overflow-wrap: anywhere` ist die Erlaubnis, an jeder
// beliebigen Stelle zu schneiden, `hyphens: auto` die Anweisung, nach Silben zu trennen.
//
// Ausgenommen ist die Web-Adresse einer Quelle. Fehlt einer Quelle der Titel, steht ihre
// nackte Adresse in der Zeile; die hat weder Leerzeichen noch Silben und liefe sonst
// quer aus der Anmerkung. Dort ist „irgendwo brechen" richtig.
const umbruchRegeln = page => page.evaluate(() => {
  const karte = [...document.querySelectorAll('.onda-annotation')].find(k => k.offsetParent)
  if (!karte) return { fehler: 'keine sichtbare Anmerkung — hier ist nichts zu messen' }
  const erlaubt = knoten => knoten.closest('.aura-note__srclink')
  const freibriefe = [karte, ...karte.querySelectorAll('*')]
    .filter(knoten => knoten.offsetParent && !erlaubt(knoten))
    .filter(knoten => getComputedStyle(knoten).overflowWrap === 'anywhere')
    .map(knoten => knoten.className || knoten.tagName)
  return { freibriefe, trennung: getComputedStyle(karte).hyphens }
})

async function pruefeGanzeWoerter(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await oeffneBeispiel(page)
  await page.locator('.onda-annotation').first().waitFor({ state: 'visible' })

  const regeln = await umbruchRegeln(page)
  assert.ok(!regeln.fehler, regeln.fehler)
  assert.deepEqual(regeln.freibriefe, [],
    'Diese Teile der Anmerkung dürfen Wörter an jeder beliebigen Stelle zerschneiden '
    + `(overflow-wrap: anywhere): ${regeln.freibriefe.join(', ')}`)
  assert.equal(regeln.trennung, 'auto',
    `Die Anmerkung trennt nicht nach Silben (hyphens: ${regeln.trennung}) — ein zu langes `
    + 'Wort bricht dann ohne Trennstrich um oder läuft seitlich heraus')

  // Der gemeldete Fall: bei 1280px ist die Karte am schmalsten, weil rechts vom Absatz
  // nur der Rest des Randes bleibt. Dort stand „Konzentati / on".
  // Die anderen Breiten stehen daneben, weil die Karte mit dem Rand mitwächst: 1024px
  // stellt sie unter den Text, 1440px gibt ihr die volle Wunschbreite.
  for (const breite of [1280, 1440, 1024]) {
    await page.setViewportSize({ width: breite, height: 900 })
    await bildwechsel(page)
    await page.waitForTimeout(150)
    const stand = await gebrocheneWoerter(page)
    assert.ok(!stand.fehler, `${breite}px: ${stand.fehler}`)
    assert.deepEqual(stand.funde, [],
      `${breite}px (Karte ${stand.karteBreite}px): Wörter mitten entzweigebrochen, obwohl sie ganz gepasst hätten:\n  `
      + stand.funde.join('\n  '))
    assert.deepEqual(stand.raus, [], `${breite}px: Teile der Anmerkung stehen über dem rechten Kartenrand`)
  }

  // Und der harte Fall: ein Wort, das selbst über die volle Kartenbreite nicht passt.
  // Hier ist eine Trennung erlaubt — herauslaufen darf trotzdem nichts.
  await page.setViewportSize({ width: 1280, height: 900 })
  await bildwechsel(page)
  await page.evaluate(() => {
    const block = window.AIWT.__blockIdentityTestBridge.getBlocks().find(kandidat => kandidat.text.length > 24)
    window.AIWT.__workspaceTestBridge.injectFinding({
      id: 'typografie-langes-wort', kind: 'form', anmerkungsart: 'rechtschreibung', status: 'open',
      placement: 'passage', blockId: block.id,
      target: 'Benachrichtigungsunterbrechungen',
      action: 'Aufmerksamkeitsunterbrechungen',
      short: 'Ein Wort, das länger ist als die Karte breit.',
      createdAt: -1,
    })
  })
  await page.waitForTimeout(400)
  const langes = await gebrocheneWoerter(page)
  assert.ok(!langes.fehler, `langes Wort: ${langes.fehler}`)
  assert.deepEqual(langes.funde, [],
    `Langes Wort (Karte ${langes.karteBreite}px): vermeidbare Trennung:\n  ${langes.funde.join('\n  ')}`)
  assert.deepEqual(langes.raus, [], 'Das lange Wort steht über dem rechten Kartenrand')
  await context.close()
}

// ---------- Beschriftung gegen Eintrag ----------
// Ohne Versalien trägt allein die Mischung aus Grad, Gewicht und Farbe. Ein einziger
// Gewichtsschritt reicht nicht: am 7.8.2026 waren „Struktur" und „Warum es wichtig ist"
// darunter beide 15px und beide rgb(28,26,23) — im Bild las sich der Eintrag mindestens
// so stark wie die Beschriftung. Gemessen wird am laufenden Programm, weil erst hier
// feststeht, welche Regel gewinnt.
const gemessen = (page, wahl) => page.evaluate(sel => {
  const node = document.querySelector(sel)
  if (!node) return null
  const stil = getComputedStyle(node)
  return {
    grad: parseFloat(stil.fontSize), gewicht: Number(stil.fontWeight), farbe: stil.color,
    text: node.textContent.trim().slice(0, 28),
  }
}, wahl)

function pruefePaar(ort, beschriftung, eintrag) {
  assert.ok(beschriftung && eintrag, `${ort}: eine der beiden Zeilen steht gar nicht auf dem Schirm`)
  assert.equal(beschriftung.gewicht, 500, `${ort}: „${beschriftung.text}" wiegt ${beschriftung.gewicht} statt 500`)
  assert.equal(eintrag.gewicht, 400, `${ort}: „${eintrag.text}" wiegt ${eintrag.gewicht} statt 400`)
  assert.ok(beschriftung.grad !== eintrag.grad || beschriftung.farbe !== eintrag.farbe,
    `${ort}: „${beschriftung.text}" und „${eintrag.text}" unterscheidet nur das Gewicht — `
    + `beide ${beschriftung.grad}px, beide ${beschriftung.farbe}`)
}

async function pruefeBeschriftungen(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  // Bibliothek: „Zuletzt bearbeitet" über den Texten darunter.
  pruefePaar('Bibliothek',
    await gemessen(page, '#libraryRecentTitle'),
    await gemessen(page, '.onda-library-recent__item'))

  await oeffneBeispiel(page)

  // Seitenleiste: der Abschnittsname über den Bausteinen.
  pruefePaar('Seitenleiste',
    await gemessen(page, '#ondaSidebar .onda-side-name'),
    await gemessen(page, '#ondaSidebar .block-preview-excerpt'))

  // Quellenbaum: dieselbe Frage eine Ebene tiefer. Der Beispieltext hat keine Quellen,
  // also kommen sie so herein, wie sie im Betrieb aussehen (source-model.mjs macht aus
  // metadata.title IMMER ein Objekt).
  await page.evaluate(() => {
    const state = window.AIWT.state
    const projekt = state.projects.find(kandidat => kandidat.id === state.activeProject)
    projekt.sources = [1, 2].map(nummer => ({
      id: `q${nummer}`, projectId: projekt.id, type: 'web',
      origin: { kind: 'url', immutableRef: `https://beispiel.de/q${nummer}`, originalUrl: `https://beispiel.de/q${nummer}` },
      original: { mediaType: 'text/html', sections: [{ id: 'import', heading: 'Abschnitt', text: 'Text.' }] },
      checksumSha256: 'a'.repeat(64), importedAt: Date.now(),
      provenance: { actor: 'user', action: 'import' },
      metadata: { title: { value: `Quelle ${nummer}`, status: 'user-provided' } },
      derived: {}, status: 'active', locators: [], history: [],
    }))
    projekt.quellenThemen = [{
      id: 'thema-1', name: 'Aufmerksamkeit', warum: 'Beide fragen, worauf Menschen achten.',
      quellenIds: ['q1', 'q2'], vonKi: true, handverschoben: [],
    }]
    window.AIWT.openDoc(state.active)
  })
  await page.locator('#editor .ProseMirror').waitFor({ state: 'visible' })
  await page.locator('#materialTreeToggle').click()
  // Zwei Ebenen: erst der Baum, dann die Gruppe darin — die Quellen sitzen eingeklappt
  // unter ihrem eigenen Pfeil.
  await page.locator('#materialTree .onda-baum-pfeil').first().click()
  await page.locator('#materialTree .onda-baum-quelle').first().waitFor({ state: 'visible' })
  pruefePaar('Quellenbaum',
    await gemessen(page, '#materialTree .onda-baum-name'),
    await gemessen(page, '#materialTree .onda-baum-quelle'))

  // Die zurückgenommene Farbe darf die Zeile nicht unlesbar machen — Zurückhaltung
  // gilt den Augen, nicht der Zugänglichkeit.
  const axeBaum = await new AxeBuilder({ page }).include('#ondaSidebar')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  assert.deepEqual(axeBaum.violations.map(fund => fund.id), [])

  // Fenster: die Gruppenbeschriftung über den Einträgen. Gemessen wird ein RUHENDER
  // Eintrag — der gewählte trägt bewusst 500, sonst ginge er in der Liste unter.
  await page.locator('#pvCard').click()
  await page.locator('#pvModal').waitFor({ state: 'visible' })
  pruefePaar('Fenster',
    await gemessen(page, '#pvModal .onda-blaetter__gruppe'),
    await gemessen(page, '#pvModal .onda-blaetter__eintrag:not([aria-current="true"])'))
  const gewaehlt = await gemessen(page, '#pvModal .onda-blaetter__eintrag[aria-current="true"]')
  assert.equal(gewaehlt.gewicht, 500, `Der gewählte Eintrag wiegt ${gewaehlt.gewicht} wie die ruhenden`)

  // Und die Hierarchie im Fenster steht richtig herum: „Aufgabe" las sich bis zum
  // 7.8.2026 größer als „Projektverständnis", weil der Fenstername auf 18px stand —
  // einem Grad, den das Haus gar nicht kennt.
  const fenstername = await gemessen(page, '#pvModal .onda-dialog-title')
  const ueberschrift = await gemessen(page, '#pvModal .onda-blaetter__tiefe-titel')
  assert.ok(fenstername.grad > ueberschrift.grad,
    `„${fenstername.text}" (${fenstername.grad}px) überragt „${ueberschrift.text}" (${ueberschrift.grad}px) nicht`)
  for (const zeile of [fenstername, ueberschrift]) {
    assert.ok([12, 15, 21, 40].includes(zeile.grad), `„${zeile.text}" misst ${zeile.grad}px — kein Hausgrad`)
  }

  // Und der Wortlaut steht nicht zweimal untereinander: Überschrift „Aufgabe",
  // Feldname „Was dieser Text leisten soll".
  const feldname = await gemessen(page, '#pvModal .onda-pv-label')
  assert.notEqual(feldname.text, ueberschrift.text,
    `„${ueberschrift.text}" steht im Fenster zweimal untereinander`)
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await pruefeVersalien(browser)
  await pruefeStufen(browser)
  await pruefeAuswahlLeiste(browser)
  await pruefeGanzeWoerter(browser)
  await pruefeBeschriftungen(browser)
  console.log('Typografie smoke: PASS')
} finally {
  await browser.close()
  if (staticServer) await new Promise(closed => staticServer.close(closed))
}
