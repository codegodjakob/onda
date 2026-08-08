#!/usr/bin/env node
// DESIGN-01 bis DESIGN-05 — misst die Gestalt der Arbeitsoberfläche im echten Browser.
//
// Diese Prüfungen sind aus Jakobs eigenen Aussagen vom 31.07.2026 abgeleitet. Sie sagen,
// WAS wahr sein muss, nie WIE es zu erreichen ist — die Gestaltungsentscheidungen bleiben offen.
//
// Am 06.08.2026 auf die neu gebaute Oberfläche nachgezogen, am 08.08.2026 auf den Stand
// der Gestaltungssitzung vom 07./08.08. gehoben. Die Zusagen sind Wort für Wort dieselben
// geblieben; geändert hat sich nur, WORAN gemessen wird. Die Lehre aus diesem Nachziehen
// steht in jedem Abschnitt noch einmal einzeln, weil sie teuer war:
//
//   Ein Klassenname ist kein Anker. Beim Umbau wurde `.local-finding` zu `.onda-annotation`,
//   und aus einer Seitenleiste wurden zwei. Prüfungen, die an Klassennamen hingen, griffen
//   danach ins Leere. Das Schlimmere ist nicht der falsche Alarm, sondern die falsche Ruhe:
//   DESIGN-02 meldete zwei Wochen lang "bestanden", weil es eine ausgeblendete, leere
//   Leiste vermessen hat statt der Struktur-Spalte.
//
// Deshalb misst jeder Abschnitt an dem, was seine Zusage selbst benennt — an der
// Trägerebene der Hinweise, am Strukturbereich, an der Aufklapp-Semantik — und bricht
// LAUT ab, wenn er sein Messobjekt nicht findet. Ein Abschnitt, der nichts findet,
// darf niemals grün melden.

import { chromium } from 'playwright'

const baseUrl = process.env.AIWT_URL || 'http://127.0.0.1:4173/'
const ergebnisse = []

function pruefe(id, titel, bestanden, befund) {
  ergebnisse.push({ id, titel, bestanden, befund })
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  // Beispielprojekt öffnen — es trägt einen verankerten Hinweis. Die stabile
  // Produktstruktur ist hier absichtlich präziser als ein textbasierter Rundumschlag:
  // Projektzeile und Dokumentzeile können denselben Titel tragen.
  await page.locator('#doclist .doc').filter({ hasText: 'Beispiel: Calm Technology' }).click()
  await page.locator('#doclist .doc').first().click()
  await page.waitForSelector('.ProseMirror', { timeout: 5000 })
  const hinweisGesetzt = await page.evaluate(() => {
    const block = window.AIWT.__blockIdentityTestBridge.getBlocks().find(kandidat => kandidat.text.length > 24)
    if (!block) return false
    const target = block.text.slice(0, Math.min(32, block.text.length))
    window.AIWT.__workspaceTestBridge.injectFinding({
      id: 'gestalt-randhinweis', status: 'open', placement: 'passage', blockId: block.id,
      target, action: `${target} — präzisiert`, short: 'Der Satz lässt sich präziser führen.',
      why: 'Die Kernaussage wird früher sichtbar.', folge: 'Die Aussage bleibt gleich.',
      anmerkungsart: 'satzstil', createdAt: -1,
    })
    return true
  })
  if (hinweisGesetzt) await page.locator('.onda-annotation').waitFor({ state: 'visible' })
  await page.waitForTimeout(600)

  // --- DESIGN-01: Feedback neben der Stelle, nicht darunter ------------------
  // Anker ist die Traegerebene #localAgentLayer: das ist der Ort, an den die App ihre
  // verankerten Hinweise haengt, und sie heisst so, seit es sie gibt. Frueher stand hier
  // eine Liste von Klassennamen (.local-finding, .anno-bubble, [class*=hinweis]); der
  // Umbau hat alle drei fallen lassen, und die Pruefung fand nichts mehr.
  //
  // Die Ebene selbst ist ein <aside> ueber die volle Breite. Sie mitzumessen ergab 1016px
  // und damit ein falsches "zu breit". Gemessen wird deshalb die Karte DARIN.
  //
  // Verglichen wird gegen DIE Textstelle, an der der Hinweis haengt (data-block-id),
  // nicht nur gegen die Textspalte: "neben der Stelle" heisst auch, auf ihrer Hoehe.
  // Eine Karte unten rechts in der Ecke waere seitlich, aber nicht daneben.
  const lage = await page.evaluate(() => {
    const editor = document.querySelector('.ProseMirror')
    if (!editor) return { fehler: 'kein Editor' }
    const traeger = document.getElementById('localAgentLayer')
    if (!traeger) return { fehler: 'Traegerebene #localAgentLayer fehlt — Hinweise haben keinen Ort mehr' }
    const traegtText = e => (e.textContent || '').trim().length > 12
    const karten = [...traeger.children]
      .filter(e => e.offsetParent && e.getBoundingClientRect().height > 10 && traegtText(e))
      .sort((a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width)
    if (!karten.length) return { fehler: 'kein sichtbarer Hinweis gefunden' }
    const karte = karten[0]
    const blockId = karte.dataset.blockId
    if (!blockId) return { fehler: 'der Hinweis ist an keine Textstelle gebunden (kein data-block-id)' }
    // Im Editor suchen: data-block-id tragen auch die Karten der Struktur-Spalte.
    const stelle = editor.querySelector(`[data-block-id="${CSS.escape(blockId)}"]`)
    if (!stelle) return { fehler: `zu ${blockId} gibt es keine Textstelle im Editor` }
    const k = karte.getBoundingClientRect()
    const s = stelle.getBoundingClientRect()
    const ed = editor.getBoundingClientRect()
    return {
      hinweis: { x: Math.round(k.x), rechts: Math.round(k.right), breite: Math.round(k.width) },
      stelle: { x: Math.round(s.x), rechts: Math.round(s.right) },
      ueberlappung: Math.round(Math.min(k.bottom, s.bottom) - Math.max(k.top, s.top)),
      editor: { breite: Math.round(ed.width) },
      klasse: karte.className || karte.tagName,
    }
  })
  if (lage.fehler) {
    pruefe('DESIGN-01', 'Feedback neben der Stelle', false, lage.fehler)
  } else {
    // Seitlich heisst: der Hinweis beginnt rechts (oder links) neben der Textstelle,
    // nicht als Block ueber deren volle Breite.
    const seitlich = lage.hinweis.x >= lage.stelle.rechts || lage.hinweis.rechts <= lage.stelle.x
    const vollbreit = lage.hinweis.breite >= lage.editor.breite * 0.8
    const aufHoehe = lage.ueberlappung > 0
    pruefe('DESIGN-01', 'Feedback neben der Stelle', seitlich && !vollbreit && aufHoehe,
      `Hinweis (${lage.klasse}) x=${lage.hinweis.x} Breite=${lage.hinweis.breite}; `
      + `Textstelle x=${lage.stelle.x}–${lage.stelle.rechts}; senkrechte Ueberlappung ${lage.ueberlappung}px. `
      + (seitlich ? '' : 'Er steht nicht neben der Stelle, sondern in derselben Spalte. ')
      + (vollbreit ? 'Er spannt ueber die Textbreite statt daneben zu stehen. ' : '')
      + (aufHoehe ? '' : 'Er steht nicht auf Hoehe der Stelle, zu der er gehoert.'))
  }

  // --- DESIGN-02: Struktur-Spalte wiederholt den Text nicht ------------------
  // Anker ist #structureNav, der Strukturbereich selbst. Frueher stand hier
  // document.querySelector('[class*=sidebar]'). Seit die Bibliotheksleiste dazukam,
  // liefert dieser Ausdruck die ERSTE Leiste im Dokument — die ausgeblendete, leere
  // Bibliotheksleiste. Die Pruefung mass ein leeres Element, fand null Doppelungen
  // und meldete gruen. Genau dieser Fall soll hier nie wieder moeglich sein, deshalb
  // bricht der Abschnitt ab, wenn der Bereich keine Bausteine traegt.
  //
  // Was die Spalte zeigen DARF, entscheidet die Herkunft des Wortlauts, nicht der
  // Klappzustand: Eine Ueberschrift traegt ihren Wortlaut als Struktur — sie steht
  // im Text und in der Spalte, und das ist Absicht. Ein Absatz-Auszug dagegen ist die
  // Doppelung, um die es geht; erlaubt ist er nur im Baustein, in dem gerade
  // geschrieben wird (aria-current="true").
  //
  // Waere stattdessen — wie zuvor — nur der zugeklappte Zustand geprueft, liesse
  // sich die Zusage durch blosses Aufklappen aushebeln: stuenden alle Bausteine
  // offen, wiederholte die Spalte den ganzen Text, und die Pruefung haette nichts
  // mehr zu messen und gruen gemeldet. Ueber die Herkunft gemessen, geht das nicht.
  const doppelung = await page.evaluate(() => {
    const editor = document.querySelector('.ProseMirror')
    const bloecke = [...(editor?.children || [])]
      .map(e => ({ text: e.textContent.trim(), ueberschrift: /^H[1-6]$/.test(e.tagName) }))
      .filter(b => b.text.length >= 20)
    if (!bloecke.length) return { fehler: 'der Text hat keine Absaetze — nichts, was sich doppeln koennte' }
    const spalte = document.getElementById('structureNav')
    if (!spalte) return { fehler: 'Strukturbereich #structureNav fehlt' }
    const bausteine = [...spalte.querySelectorAll('[aria-expanded][data-block-id]')]
    if (!bausteine.length) return { fehler: 'der Strukturbereich traegt keine Bausteine — hier ist nichts zu messen' }

    const echos = []
    for (const knoten of spalte.querySelectorAll('*')) {
      if (knoten.children.length || !knoten.offsetParent) continue
      const text = knoten.textContent.trim()
      if (text.length < 20) continue
      const anfang = text.replace(/[….]+$/, '').trim().slice(0, 20)
      const quelle = bloecke.find(b => b.text.startsWith(anfang))
      if (!quelle) continue
      const baustein = knoten.closest('[aria-expanded][data-block-id]')
      echos.push({ text, ueberschrift: quelle.ueberschrift, aktiv: baustein?.getAttribute('aria-current') === 'true' })
    }
    const doppelungen = echos.filter(e => !e.ueberschrift && !e.aktiv)
    return {
      bausteine: bausteine.length,
      echos: echos.length,
      anzahl: doppelungen.length,
      beispiele: doppelungen.slice(0, 2).map(e => e.text),
    }
  })
  if (doppelung.fehler) pruefe('DESIGN-02', 'Struktur wiederholt den Text nicht', false, doppelung.fehler)
  else pruefe('DESIGN-02', 'Struktur wiederholt den Text nicht', doppelung.anzahl === 0,
    `${doppelung.anzahl} wiederholte Absaetze in ${doppelung.bausteine} Bausteinen `
    + `(${doppelung.echos} Wortlaute der Spalte stehen auch im Text; Ueberschriften und der `
    + `bearbeitete Baustein zaehlen nicht). `
    + `Beispiel: ${JSON.stringify(doppelung.beispiele[0] || '')}`)

  // --- DESIGN-03: Bausteine oeffnen sich einzeln -----------------------------
  // Geprueft wird die Eigenschaft, um die es geht: EIN Klick veraendert GENAU EINE
  // Karte, und derselbe Klick nimmt sich zurueck. Geklickt wird eine Karte, die
  // zugeklappt DASTEHT — Ueberschriften und der bearbeitete Absatz stehen absichtlich
  // schon offen, an ihnen liesse sich ein Aufklappen gar nicht messen.
  //
  // Anker ist wieder #structureNav, und zwar ueber die Bedeutung statt ueber eine
  // Klasse: ein Knopf, der fuer GENAU EINEN Textbaustein steht (data-block-id) und
  // seinen Klappzustand ansagt (aria-expanded). Der fruehere Ausdruck
  // [class*=block-preview] traf 28 statt 7 Elemente: er fing die Kind-Spans der
  // Karten mit. Deren Hoehe aendert sich beim Aufklappen mit, was die Zusage
  // "die uebrigen bleiben unveraendert" faelschlich gerissen haette. Und der
  // Abschnittspfeil (#structureTree) traegt zwar ebenfalls aria-expanded, steht aber
  // fuer die ganze Spalte statt fuer einen Baustein — deshalb data-block-id dazu.
  const aufklappen = await page.evaluate(async () => {
    const warte = () => new Promise(r => setTimeout(r, 350))
    const spalte = document.getElementById('structureNav')
    if (!spalte) return { fehler: 'Strukturbereich #structureNav fehlt' }
    const karten = [...spalte.querySelectorAll('button[aria-expanded][data-block-id]')]
      .filter(e => e.getBoundingClientRect().height > 20)
    if (karten.length < 2) return { fehler: `nur ${karten.length} Bausteine gefunden` }
    const zu = karten.findIndex(k => k.getAttribute('aria-expanded') === 'false')
    if (zu < 0) return { fehler: 'keine zugeklappte Karte — es gibt nichts aufzuklappen' }

    const hoehen = () => karten.map(k => Math.round(k.getBoundingClientRect().height))
    const vorher = hoehen()
    karten[zu].click()
    await warte()
    const nachher = hoehen()
    karten[zu].click()
    await warte()
    const wiederZu = hoehen()
    return { zu, anzahl: karten.length, vorher, nachher, wiederZu }
  })
  if (aufklappen.fehler) pruefe('DESIGN-03', 'Bausteine oeffnen sich einzeln', false, aufklappen.fehler)
  else {
    const { zu, anzahl, vorher, nachher, wiederZu } = aufklappen
    const waechst = nachher[zu] > vorher[zu]
    const uebrigeGleich = vorher.every((h, i) => i === zu || h === nachher[i])
    const klapptZurueck = wiederZu[zu] === vorher[zu]
    pruefe('DESIGN-03', 'Bausteine oeffnen sich einzeln', waechst && uebrigeGleich && klapptZurueck,
      `Karte ${zu} von ${anzahl}: ${vorher[zu]} → ${nachher[zu]} → ${wiederZu[zu]}px. `
      + (waechst ? '' : 'Der geklickte Baustein waechst nicht — es gibt kein Aufklappen. ')
      + (uebrigeGleich ? '' : 'Andere Karten haben sich mitveraendert. ')
      + (klapptZurueck ? '' : 'Ein zweiter Klick klappt nicht wieder zu.'))
  }

  // --- DESIGN-04: keine Grossbuchstaben-Beschriftungen -----------------------
  const versalien = await page.evaluate(() => {
    // Bis zum 7.8.2026 nahm diese Pruefung Rubriken ausdruecklich aus und war
    // deshalb gruen, obwohl fuenf Versalien-Beschriftungen sichtbar auf dem Schirm
    // standen. Die Ausnahme berief sich auf einen Satz im Design System, den Jakob
    // aufgehoben hat ("ich find, es sieht sehr haesslich aus"). Ohne die Ausnahme
    // prueft DESIGN-04 endlich das, was der Katalog woertlich verlangt: KEIN
    // sichtbares Element wird per text-transform in Grossbuchstaben gesetzt.
    //
    // Damit erledigt sich zugleich das Schlupfloch der alten Fassung: sie liess sich
    // aushebeln, indem man eine grosse Versalien-Ueberschrift "eyebrow" nannte. Wo es
    // keine Ausnahme gibt, gibt es auch keine Tuer, durch die man schluepfen koennte.
    const treffer = [...document.querySelectorAll('*')].filter(e => {
      if (e.children.length || !e.offsetParent) return false
      if (getComputedStyle(e).textTransform !== 'uppercase') return false
      return e.getBoundingClientRect().width > 0
    })
    return {
      anzahl: treffer.length,
      beispiele: treffer.slice(0, 4).map(e => `${e.textContent.trim().slice(0, 22)} (${getComputedStyle(e).fontSize})`),
    }
  })
  pruefe('DESIGN-04', 'Keine Grossbuchstaben-Beschriftungen', versalien.anzahl === 0,
    `${versalien.anzahl} sichtbare Versalien-Beschriftungen: ${versalien.beispiele.join(' · ')}`)

  // --- DESIGN-05: Bibliothek und Schreibansicht sprechen dieselbe Sprache ----
  // Zurueck in die Bibliothek: gemessen wird die Ansicht, um die es geht.
  await page.evaluate(() => document.getElementById('sidebarBack')?.click())
  await page.waitForTimeout(500)

  // Welche Regeln gehoeren zur Bibliothek? Frueher entschied das der Wortlaut des
  // Selektors (/onda-home|onda-lib|library|projekt-karte|home/i). Das ist dasselbe Raten
  // wie bei den Klassennamen oben: von 32 Regeln, die die Startseite wirklich gestalten,
  // erfasste der Wortlaut nur 26 — und ausgerechnet die sechs uebersehenen trugen jeden
  // einzelnen Rohwert. Gefragt wird jetzt der Browser: greift diese Regel auf ein
  // sichtbares Element der Bibliothek?
  //
  // Und zwar in JEDER ihrer Ansichten. Die Bibliothek hat drei Reiter; wer nur den
  // ersten misst, hat zwei Drittel blinden Fleck. Der Kruemelpfad zum Beispiel
  // erscheint ueberhaupt erst im zweiten.
  //
  // Zwei Dinge zaehlen ausdruecklich NICHT als frei gewaehlter Pixel:
  //   · Eine Null. `padding: 0` ist keine Abstandsentscheidung, sondern deren
  //     Abwesenheit. Der alte Ausdruck /\d+px/ schlug darauf an, weil der Browser
  //     `0` als `0px` zurueckgibt — derselbe Fehlalarm wie frueher bei `margin: 0 auto`.
  //   · Regeln, die nur unsichtbare Hilfselemente treffen. Die 1×1-Klasse fuer
  //     Bildschirmleser braucht ihr -1px als Technik, nicht als Mass. Erkannt wird
  //     das an der Groesse des getroffenen Elements, nicht an einer Namensliste.
  const REITER = [
    { knopf: 'libraryProjects', name: 'Projekte' },
    { knopf: 'libraryDocuments', name: 'Dokumente' },
    { knopf: 'libraryArchive', name: 'Papierkorb' },
  ]
  const scanne = () => page.evaluate(() => {
    const EIGENSCHAFTEN = ['padding', 'gap', 'margin', 'font-size', 'border-radius']
    const SICHTBAR_AB_PX = 2
    const bibliothek = document.getElementById('home')
    if (!bibliothek) return { fehler: 'Bibliotheksansicht #home fehlt' }
    if (!bibliothek.offsetParent) return { fehler: 'Bibliotheksansicht ist nicht offen — so laesst sie sich nicht messen' }

    const hatEchteLaenge = wert => [...wert.matchAll(/(-?\d*\.?\d+)px/g)].some(t => Number(t[1]) !== 0)
    const elemente = [bibliothek, ...bibliothek.querySelectorAll('*')]
    const gestaltetSichtbares = selektor => {
      let getroffen
      try { getroffen = elemente.filter(e => e.matches(selektor)) } catch { return false }
      return getroffen.some(e => {
        const r = e.getBoundingClientRect()
        return r.width > SICHTBAR_AB_PX && r.height > SICHTBAR_AB_PX
      })
    }

    const marken = new Set()
    const roh = []
    let geprueft = 0
    for (const blatt of document.styleSheets) {
      let regeln
      try { regeln = blatt.cssRules } catch { continue }
      for (const regel of regeln) {
        if (!regel.style || !regel.selectorText) continue
        const werte = EIGENSCHAFTEN
          .map(eigenschaft => [eigenschaft, regel.style.getPropertyValue(eigenschaft)])
          .filter(([, wert]) => wert)
        if (!werte.length) continue
        if (!gestaltetSichtbares(regel.selectorText)) continue
        geprueft += 1
        for (const [eigenschaft, wert] of werte) {
          if (wert.includes('var(--')) marken.add(wert)
          else if (hatEchteLaenge(wert)) roh.push(`${regel.selectorText.slice(0, 40)} { ${eigenschaft}: ${wert} }`)
        }
      }
    }
    return {
      markenGenutzt: [...marken],
      geprueft,
      festeWerte: roh,
      eintraege: bibliothek.querySelectorAll('#doclist .doc, #trashlist .trash-doc').length,
    }
  })

  const festeWerte = new Set()
  const markenGesamt = new Set()
  let geprueftGesamt = 0
  let scanFehler = null
  let eintraegeGesehen = 0
  for (const reiter of REITER) {
    await page.evaluate(id => document.getElementById(id)?.click(), reiter.knopf)
    await page.waitForTimeout(400)
    const stand = await scanne()
    if (stand.fehler) { scanFehler = `Reiter "${reiter.name}": ${stand.fehler}`; break }
    stand.festeWerte.forEach(w => festeWerte.add(w))
    stand.markenGenutzt.forEach(w => markenGesamt.add(w))
    geprueftGesamt += stand.geprueft
    eintraegeGesehen += stand.eintraege
  }
  // Eine Bibliothek ohne einen einzigen Eintrag traegt kaum Regeln — dann misst
  // dieser Abschnitt fast nichts und darf das nicht als Erfolg ausgeben.
  if (!scanFehler && !eintraegeGesehen) scanFehler = 'kein einziger Eintrag in allen drei Reitern — hier ist nichts zu messen'
  if (scanFehler) pruefe('DESIGN-05', 'Bibliothek folgt derselben Gestaltungssprache', false, scanFehler)
  else pruefe('DESIGN-05', 'Bibliothek folgt derselben Gestaltungssprache', festeWerte.size === 0,
    festeWerte.size
      ? `${festeWerte.size} fest eingetragene Werte in ${geprueftGesamt} Bibliotheksregeln (drei Reiter): `
        + [...festeWerte].slice(0, 5).join(' · ')
      : `alle ${geprueftGesamt} geprueften Bibliotheksregeln stammen aus Gestaltungsmarken (${markenGesamt.size} verschiedene)`)
} finally {
  await browser.close()
}

// --- Bericht -----------------------------------------------------------------
// Diese Datei misst fuenf Zusagen und faellt sie einzeln. Die Ankuendigungszeile sagt
// dem Fertigzustand-Laeufer, dass er die Zeilen darunter als fuenf eigene Urteile lesen
// darf — statt alle fuenf Evals am Ausgang des ganzen Skripts zu messen. Vorher
// verschwanden drei bestandene Zusagen hinter zwei gebrochenen, und am Ergebnisstand
// war nicht zu sehen, WELCHE Zusage gebrochen war.
//
// Die Ankuendigung ist zugleich die Sicherung: Wer hier eine Kennung nennt und ihre
// Ergebniszeile nicht drucken laesst — weil der Abschnitt fehlt oder der Lauf vorher
// abbricht —, bekommt ein Rot, kein stilles Gruen. Kommt eine DESIGN-Zusage dazu,
// gehoert sie in DIESE Zeile; sonst faellt sie mit einem lauten Hinweis durch.
process.stdout.write(`# je-eval: ${ergebnisse.map(e => e.id).join(' ')}\n`)
let fehlgeschlagen = 0
for (const e of ergebnisse) {
  process.stdout.write(`${e.bestanden ? 'ok' : 'not ok'} ${e.id} — ${e.titel}\n`)
  if (!e.bestanden) { fehlgeschlagen++; process.stdout.write(`  # ${e.befund}\n`) }
}
process.stdout.write(`\n${ergebnisse.length - fehlgeschlagen} von ${ergebnisse.length} Gestalt-Evals bestanden.\n`)
if (fehlgeschlagen) process.exitCode = 1
