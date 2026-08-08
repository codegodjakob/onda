// Die Anmerkungen sind aus dem Design System uebernommen, nicht nachempfunden.
//
// Jakob: "übernehme bitte die art und weise der anmerkungen aus dem
// designsystem 1:1 in die app". Vorlage ist "Onda Design System2",
// components/annotation/ — und dort besonders annotation.card.html, wo
// steht, welche Art in welcher Form erscheint.
//
// Diese Pruefung haelt die Masse und Grundsaetze fest, die dabei aus der
// Vorlage kamen. Sie liest das Stylesheet als Text — kein Browser noetig, und
// deshalb laeuft sie bei jedem `npm test` mit, nicht nur im Rauchtest.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALL_ANNOTATION_KINDS, kindInfo } from '../src/annotation-contract.mjs'

const hier = dirname(fileURLToPath(import.meta.url))
const blatt = readFileSync(resolve(hier, '../src/onda-annotations.css'), 'utf8')

function regelFuer(auswahl) {
  const treffer = new RegExp(`${auswahl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(blatt)
  return treffer ? treffer[1] : null
}

function wert(auswahl, eigenschaft) {
  const regel = regelFuer(auswahl)
  if (!regel) return null
  const treffer = new RegExp(`(?:^|;)\\s*${eigenschaft}\\s*:\\s*([^;]+)`).exec(regel)
  return treffer ? treffer[1].trim() : null
}

// ---- Vier Kategorien, vier Prinzipien, KEINE Farbe --------------------------
//
// Aus Mark.jsx: "Vier Kategorien, vier Prinzipien — ohne Farbcode: Rahmen ·
// Fläche · angehobener Block · Akzentfläche". Farbe waere die naheliegende
// Loesung und die falsche: vier Farben im Lesetext zerhacken den Text.

test('die vier Kategorien unterscheiden sich in der ART der Auszeichnung', () => {
  assert.equal(wert('.aura-mark--korrektur', 'border'), '1px solid var(--border-strong)')
  assert.equal(wert('.aura-mark--stil', 'background'), 'var(--bg-sunken)')
  assert.equal(wert('.aura-mark--struktur', 'box-shadow'), 'var(--shadow-md)')
  // Die vierte Art unterschied sich bis zum 8.8.2026 im FARBTON (--accent-tint) statt
  // in der Art der Auszeichnung — der einzige Farbfleck, der das Entfaerben der
  // Anmerkungen ueberlebt hatte. Jetzt eine gepunktete Linie darunter: dieselbe
  // Familie wie der Strich unter dem Satz, und von den drei anderen auf einen Blick
  // zu unterscheiden.
  assert.match(regelFuer('.aura-mark--inhalt, .aura-mark--notiz') || '', /repeating-linear-gradient/)
})

test('keine Kategorie wird ueber eine eigene Farbe unterschieden', () => {
  // Taucht hier je ein Farbwert oder eine zweite Akzentfamilie auf, ist das
  // Prinzip gebrochen — dann liest man die Kategorie an der Farbe ab, und der
  // Text bekommt vier Sorten Buntheit.
  const kategorien = ['korrektur', 'stil', 'struktur', 'inhalt, .aura-mark--notiz']
  kategorien.forEach(name => {
    const regel = regelFuer(`.aura-mark--${name}`) || ''
    assert.doesNotMatch(regel, /#[0-9a-f]{3,8}\b|rgb|hsl/i,
      `.aura-mark--${name} bringt eine eigene Farbe mit: ${regel}`)
  })
})

test('die Marke ist knapp gerundet (0.18em), nicht die alte weiche Fassung', () => {
  // Stand vorher auf .34em. Bei .18em bleibt die Marke eine Auszeichnung;
  // bei .34em wird sie zur Pille und drueckt die Zeile auseinander.
  assert.equal(wert('.aura-mark', 'border-radius'), '.18em')
})

test('die Nummer an der Marke ist 16px, nicht 20', () => {
  // 20px ist die Groesse der Nummer auf der KARTE; an der Marke sitzt sie im
  // Fliesstext und muss kleiner sein, sonst hebt sie die Zeilenhoehe an.
  const regel = regelFuer('.aura-mark__n') || ''
  assert.match(regel, /min-width:\s*16px/)
  assert.match(regel, /height:\s*16px/)
  assert.match(regel, /font-size:\s*var\(--text-xs\)/)
  // Auf der Karte dagegen 20px — beide Groessen stehen in der Vorlage.
  assert.match(regelFuer('.aura-note__n') || '', /min-width:\s*20px/)
})

// ---- Die Formen, die NICHT wie eine Karte aussehen dürfen -------------------

test('die Korrektur ist eine Zeile, keine Karte', () => {
  // Aus annotation.card.html: "Was eindeutig falsch ist, wird am Wort
  // korrigiert." Eine Rechtschreibkorrektur so gross wie eine Belegkarte
  // behauptet eine Wichtigkeit, die sie nicht hat.
  const regel = regelFuer('.onda-annotation.aura-corr__pop') || ''
  assert.match(regel, /flex-direction:\s*row/, 'die Korrektur muss waagerecht laufen')
  assert.match(regel, /width:\s*auto/, 'die Korrektur darf nicht auf Kartenbreite gezogen werden')
})

test('die Einfuegung waechst mit ihrem Inhalt, statt eine Karte zu fuellen', () => {
  // Aus Insertion.jsx: "Der Vorschlag liegt IM Textfluss: er öffnet eine Lücke
  // an der Einfügestelle und verdeckt nichts."
  //
  // Geprueft wird JEDE Regel, die dieser Form eine Breite gibt — nicht nur die
  // erste, die im Blatt steht. Die erste Fassung dieser Pruefung las
  // versehentlich die Layer-Regel weiter oben und haette eine feste
  // Kartenbreite in der Definition durchgehen lassen.
  const breiten = [...blatt.matchAll(/\.aura-(?:ins|corr)__pop[^{]*\{([^}]*)\}/g)]
    .flatMap(treffer => [...treffer[1].matchAll(/(?:^|;)\s*width\s*:\s*([^;]+)/g)].map(w => w[1].trim()))
  assert.ok(breiten.length > 0, 'die kompakten Formen bekommen nirgends eine Breite — dann prueft das hier nichts')
  breiten.forEach(breite => {
    assert.doesNotMatch(breite, /^\d+px$/,
      `eine kompakte Form bekommt die feste Breite ${breite} — dann ist sie wieder eine Karte`)
  })
})

test('der Zielplatz ist gestrichelt und ohne eigene Flaeche', () => {
  // Der Platz ist noch leer. Eine gefuellte Karte wuerde behaupten, dort stehe
  // schon etwas.
  //
  // Seit dem 8.8.2026 steht der Strich in der Kurzform `border: 1px dashed …` statt in
  // `border-style` allein: die Anmerkung darunter hat gar keine Kante mehr (border: 0),
  // von der sich nur noch die Art aendern liesse. Geprueft wird darum, dass er
  // gestrichelt IST — nicht, in welcher Schreibweise das dasteht.
  const regel = regelFuer('.aura-slot') || ''
  assert.match(regel, /border(?:-style)?:\s*(?:1px\s+)?dashed/)
  assert.match(regel, /background:\s*transparent/)
  assert.match(regel, /box-shadow:\s*none/)
})

// ---- Jede Art hat GENAU EINE Form ------------------------------------------

test('jede Anmerkungsart hat genau eine Form — nie zwei', () => {
  // Jakobs Regel aus dem Gedaechtnis: eine Anmerkung hat EINE Gestalt, nie
  // Marke UND Blase UND Absatz gleichzeitig.
  ALL_ANNOTATION_KINDS.forEach(art => {
    const info = kindInfo(art)
    assert.equal(typeof info.form, 'string')
    assert.ok(info.form.length > 0, `${art} hat keine Form`)
  })
})

test('eine Form ohne Textoperation verspricht keine', () => {
  // 'correction', 'rewrite', 'insertion', 'slot' zeigen alle einen Knopf, der
  // etwas am Text tut. Eine Art ohne Operation darf keine solche Form haben,
  // sonst steht dort ein Knopf, der nichts tut.
  const versprechen = new Set(['correction', 'rewrite', 'insertion', 'slot', 'title'])
  ALL_ANNOTATION_KINDS.forEach(art => {
    const info = kindInfo(art)
    if (!info.operation) {
      assert.equal(versprechen.has(info.form), false,
        `${art} hat keine Textoperation, zeigt aber die Form "${info.form}", die eine verspricht`)
    }
  })
})
