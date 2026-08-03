#!/usr/bin/env node
// DESIGN-01 bis DESIGN-05 — misst die Gestalt der Arbeitsoberfläche im echten Browser.
//
// Diese Prüfungen sind aus Jakobs eigenen Aussagen vom 31.07.2026 abgeleitet. Sie sagen,
// WAS wahr sein muss, nie WIE es zu erreichen ist — die Gestaltungsentscheidungen bleiben offen.
//
// Sie schlagen beim ersten Lauf fehl. Das ist ihr Zweck: die Gestaltungslücke wird damit
// eine gemessene Größe statt einer Meinung.

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

  // Beispielprojekt öffnen — es trägt einen verankerten Hinweis.
  await page.evaluate(() => {
    const knopf = [...document.querySelectorAll('button[type=button]')]
      .find(b => /Calm Technology/.test(b.textContent) && !b.getAttribute('aria-label'))
    knopf?.click()
  })
  await page.waitForTimeout(400)
  await page.evaluate(() => {
    const eintrag = [...document.querySelectorAll('button[type=button]')]
      .find(b => /Calm Technology/.test(b.textContent))
    eintrag?.click()
  })
  await page.waitForSelector('.ProseMirror', { timeout: 5000 })
  await page.waitForTimeout(600)

  // --- DESIGN-01: Feedback neben der Stelle, nicht darunter ------------------
  const lage = await page.evaluate(() => {
    const editor = document.querySelector('.ProseMirror')
    if (!editor) return { fehler: 'kein Editor' }
    // Den Hinweis ueber seinen Wortlaut finden, nicht ueber eine Klassenvermutung:
    // eine zu weite Auswahl misst irgendein Element und meldet faelschlich Erfolg.
    const traegt = e => {
      const t = (e.textContent || '').trim()
      return t.length > 12 && t.length < 200 && !e.querySelector('.ProseMirror')
    }
    const kandidaten = [...document.querySelectorAll('aside, .anno-bubble, [class*=hinweis], [class*=finding]')]
      .filter(e => e.offsetParent && e.getBoundingClientRect().height > 10 && traegt(e))
      // Das aeusserste passende Element gewinnt: es traegt die tatsaechliche Kastenbreite.
      .sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)
    if (!kandidaten.length) return { fehler: 'kein sichtbarer Hinweis gefunden' }
    const hinweis = kandidaten[0].getBoundingClientRect()
    const ed = editor.getBoundingClientRect()
    return {
      hinweis: { x: Math.round(hinweis.x), breite: Math.round(hinweis.width), y: Math.round(hinweis.y) },
      editor: { x: Math.round(ed.x), breite: Math.round(ed.width) },
      klasse: kandidaten[0].className || kandidaten[0].tagName,
    }
  })
  if (lage.fehler) {
    pruefe('DESIGN-01', 'Feedback neben der Stelle', false, lage.fehler)
  } else {
    // Seitlich heisst: der Hinweis beginnt rechts (oder links) neben der Textspalte,
    // nicht als Block ueber deren volle Breite.
    const seitlich = lage.hinweis.x >= lage.editor.x + lage.editor.breite * 0.8
      || lage.hinweis.x + lage.hinweis.breite <= lage.editor.x + lage.editor.breite * 0.2
    const vollbreit = lage.hinweis.breite >= lage.editor.breite * 0.8
    pruefe('DESIGN-01', 'Feedback neben der Stelle', seitlich && !vollbreit,
      `Hinweis (${lage.klasse}) x=${lage.hinweis.x} Breite=${lage.hinweis.breite}; `
      + `Textspalte x=${lage.editor.x} Breite=${lage.editor.breite}. `
      + (vollbreit ? 'Er spannt ueber die Textbreite statt daneben zu stehen.' : ''))
  }

  // --- DESIGN-02: Struktur-Spalte wiederholt den Text nicht ------------------
  const doppelung = await page.evaluate(() => {
    const editor = document.querySelector('.ProseMirror')
    const absaetze = [...(editor?.children || [])].map(e => e.textContent.trim()).filter(t => t.length >= 20)
    const spalte = document.querySelector('[class*=sidebar]')
    if (!spalte) return { fehler: 'keine Seitenspalte' }
    const texte = [...spalte.querySelectorAll('*')]
      .filter(e => !e.children.length && e.offsetParent)
      .map(e => e.textContent.trim())
      .filter(t => t.length >= 20)
    const treffer = texte.filter(t => absaetze.some(a => a.startsWith(t.replace(/[….]+$/, '').trim().slice(0, 20))))
    return { anzahl: treffer.length, beispiele: treffer.slice(0, 2) }
  })
  if (doppelung.fehler) pruefe('DESIGN-02', 'Struktur wiederholt den Text nicht', false, doppelung.fehler)
  else pruefe('DESIGN-02', 'Struktur wiederholt den Text nicht', doppelung.anzahl === 0,
    `${doppelung.anzahl} Textauszuege aus dem Dokument in der Spalte. Beispiel: ${JSON.stringify(doppelung.beispiele[0] || '')}`)

  // --- DESIGN-03: Bausteine oeffnen sich einzeln -----------------------------
  const aufklappen = await page.evaluate(async () => {
    const spalte = document.querySelector('[class*=sidebar]')
    const karten = [...(spalte?.querySelectorAll('[class*=block-preview]') || [])]
      .filter(e => e.getBoundingClientRect().height > 20)
    if (karten.length < 2) return { fehler: `nur ${karten.length} Bausteine gefunden` }
    const vorher = karten.map(k => Math.round(k.getBoundingClientRect().height))
    karten[0].click()
    await new Promise(r => setTimeout(r, 350))
    const nachher = karten.map(k => Math.round(k.getBoundingClientRect().height))
    return { vorher, nachher }
  })
  if (aufklappen.fehler) pruefe('DESIGN-03', 'Bausteine oeffnen sich einzeln', false, aufklappen.fehler)
  else {
    const ersterWaechst = aufklappen.nachher[0] > aufklappen.vorher[0]
    const uebrigeGleich = aufklappen.vorher.slice(1).every((h, i) => h === aufklappen.nachher[i + 1])
    pruefe('DESIGN-03', 'Bausteine oeffnen sich einzeln', ersterWaechst && uebrigeGleich,
      `Hoehen vorher ${aufklappen.vorher.join(',')} → nachher ${aufklappen.nachher.join(',')}. `
      + (ersterWaechst ? '' : 'Der geklickte Baustein waechst nicht — es gibt kein Aufklappen.'))
  }

  // --- DESIGN-04: keine Grossbuchstaben-Beschriftungen -----------------------
  const versalien = await page.evaluate(() => {
    const treffer = [...document.querySelectorAll('*')].filter(e => {
      if (e.children.length || !e.offsetParent) return false
      if (getComputedStyle(e).textTransform !== 'uppercase') return false
      return e.getBoundingClientRect().width > 0
    })
    return { anzahl: treffer.length, beispiele: treffer.slice(0, 4).map(e => e.textContent.trim().slice(0, 22)) }
  })
  pruefe('DESIGN-04', 'Keine Grossbuchstaben-Beschriftungen', versalien.anzahl === 0,
    `${versalien.anzahl} sichtbare Versalien-Beschriftungen: ${versalien.beispiele.join(' · ')}`)

  // --- DESIGN-05: Bibliothek und Schreibansicht sprechen dieselbe Sprache ----
  const marken = await page.evaluate(() => {
    const sammle = () => {
      const werte = new Set()
      const roh = new Set()
      for (const blatt of document.styleSheets) {
        let regeln
        try { regeln = blatt.cssRules } catch { continue }
        for (const regel of regeln) {
          if (!regel.style || !regel.selectorText) continue
          if (!/onda-home|onda-lib|library|projekt-karte|home/i.test(regel.selectorText)) continue
          for (const eigenschaft of ['padding', 'gap', 'margin', 'font-size', 'border-radius']) {
            const v = regel.style.getPropertyValue(eigenschaft)
            if (!v) continue
            if (v.includes('var(--')) werte.add(v)
            else if (/\d+px/.test(v)) roh.add(`${regel.selectorText.slice(0, 30)} { ${eigenschaft}: ${v} }`)
          }
        }
      }
      return { markenGenutzt: werte.size, festeWerte: [...roh].slice(0, 4) }
    }
    return sammle()
  })
  pruefe('DESIGN-05', 'Bibliothek folgt derselben Gestaltungssprache', marken.festeWerte.length === 0,
    marken.festeWerte.length
      ? `${marken.festeWerte.length} fest eingetragene Werte in Bibliotheks-/Startseitenregeln: ${marken.festeWerte[0]}`
      : `alle geprueften Werte stammen aus Gestaltungsmarken (${marken.markenGenutzt})`)
} finally {
  await browser.close()
}

// --- Bericht -----------------------------------------------------------------
let fehlgeschlagen = 0
for (const e of ergebnisse) {
  process.stdout.write(`${e.bestanden ? 'ok' : 'not ok'} ${e.id} — ${e.titel}\n`)
  if (!e.bestanden) { fehlgeschlagen++; process.stdout.write(`  # ${e.befund}\n`) }
}
process.stdout.write(`\n${ergebnisse.length - fehlgeschlagen} von ${ergebnisse.length} Gestalt-Evals bestanden.\n`)
if (fehlgeschlagen) process.exitCode = 1
