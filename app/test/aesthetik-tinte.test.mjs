// EINE FARBE, UND DIE GEHÖRT DER KI.
//
// Diese Prüfung hält den Entschluss vom 8. August 2026 fest (docs/DIE-AESTHETIK.md).
// Sie ist der Grund, aus dem der Entschluss hält: eine Regel in einem Dokument liest
// man einmal, eine Prüfung fängt den nächsten Griff zur Farbe ab.
//
// Sie ist bewusst der billige, schnelle Wächter — sie liest CSS. Der teure Beweis
// steht in onda-ui-smoke.mjs (assertKeineFarbeAusserDerAura): der misst, was WIRKLICH
// auf dem Schirm landet, über alle erreichbaren Fenster und in beiden Erscheinungen.
// Beide werden gebraucht: das CSS kann farblos aussehen und über eine Marke doch auf
// Farbe zeigen, und eine Marke kann bunt sein, ohne dass sie je gerendert wird.

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const stilUrl = new URL('../src/style.css', import.meta.url)
const markenUrl = new URL('../src/onda-tokens.css', import.meta.url)
const anmerkungenUrl = new URL('../src/onda-annotations.css', import.meta.url)
const huelleUrl = new URL('../src/onda-shell.css', import.meta.url)

// Onda-Graus sind ABSICHTLICH warm: #736d64 hat 15 Abstand zwischen dem stärksten und
// dem schwächsten Kanal, #b6afa4 hat 18. Eine Schwelle von 12 hätte das Papier selbst
// als Farbe gemeldet — genau dieser Fehler ist beim Messen am 8.8.2026 passiert.
// Echte Farbe liegt weit darüber: Sky #8db2c9 hat 60, das alte Rot #b04a3f hat 113.
const WARMES_GRAU_GEHT_BIS = 30

function abstand(wert) {
  let kanaele = null
  const hex = wert.match(/^#([0-9a-fA-F]{3,8})$/)
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map(z => z + z).join('') : hex[1]
    if (h.length < 6) return 0
    kanaele = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
  } else {
    const zahlen = (wert.match(/\d+/g) || []).slice(0, 3).map(Number)
    if (zahlen.length < 3) return 0
    kanaele = zahlen
  }
  return Math.max(...kanaele) - Math.min(...kanaele)
}

// Kommentare zuerst weg. Beim ersten Schreiben dieser Prüfung fehlte das, und sie
// meldete die eigene Erklärung — in der „#8db2c9" als abgeschaffter Wert VORKOMMT.
// Eine Prüfung, die ihre eigene Begründung anzeigt, sagt nichts über die App.
function ohneKommentare(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, mit => mit.replace(/[^\n]/g, ' '))
}

// Nach REGELN suchen, nicht nach Zeilen. Die Aura ist die eine erlaubte Ausnahme, und
// ihre Farbwerte stehen NICHT auf der Zeile mit dem Namen, sondern in den Zeilen
// darunter. Ein Zeilenfilter hätte sie deshalb alle gemeldet — auch das ist beim
// ersten Anlauf passiert.
const AURA = /onda-aura|gradient-aura|shadow-glow|--sky-|--aura-|--focus-ring/

function bunteStellen(css, zusaetzlichErlaubt = /(?!)/) {
  const sauber = ohneKommentare(css)
  const treffer = []
  // Grob, aber für CSS ausreichend: alles bis zur öffnenden Klammer ist der Name der
  // Regel, alles danach bis zur schließenden ihr Inhalt.
  for (const regel of sauber.split('}')) {
    const klammer = regel.indexOf('{')
    const name = klammer >= 0 ? regel.slice(0, klammer) : regel
    const inhalt = klammer >= 0 ? regel.slice(klammer + 1) : regel
    if (AURA.test(name)) continue
    for (const zeile of inhalt.split('\n')) {
      if (AURA.test(zeile) || zusaetzlichErlaubt.test(zeile)) continue
      for (const wert of zeile.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) || []) {
        if (abstand(wert) > WARMES_GRAU_GEHT_BIS) {
          treffer.push(`${wert}  in  ${(name.trim() || '(oberste Ebene)').slice(0, 40)}  →  ${zeile.trim().slice(0, 70)}`)
        }
      }
    }
  }
  return treffer
}

test('Außer der Aura trägt keine Fläche der App eine Farbe', async () => {
  const dateien = await Promise.all([
    readFile(stilUrl, 'utf8'),
    readFile(anmerkungenUrl, 'utf8'),
    readFile(huelleUrl, 'utf8'),
  ])
  const namen = ['style.css', 'onda-annotations.css', 'onda-shell.css']

  // Die Aura ist die eine Ausnahme, und sie ist eine Aussage: das Farbige an der
  // Oberfläche ist die KI selbst. Alles, was sie umgibt, ist Tinte auf Papier.
  dateien.forEach((css, i) => {
    const treffer = bunteStellen(css)
    assert.deepEqual(treffer, [],
      `${namen[i]} bringt wieder Farbe mit:\n  ${treffer.join('\n  ')}`)
  })
})

test('Der Markensatz kennt Farbe nur noch für die Aura', async () => {
  const css = await readFile(markenUrl, 'utf8')
  const treffer = bunteStellen(css)
  assert.deepEqual(treffer, [], `onda-tokens.css bringt wieder Farbe mit:\n  ${treffer.join('\n  ')}`)
})

test('Die Marken, die früher Farbe hießen, zeigen auf Tinte', async () => {
  const css = await readFile(markenUrl, 'utf8')
  // Sie heißen weiter accent/danger/warning, damit nicht siebzig Regeln umgeschrieben
  // werden müssen. Genau deshalb muss hier stehen, worauf sie zeigen — sonst hieße die
  // Marke Akzent, wäre Tinte, und niemand könnte das nachlesen.
  for (const marke of ['accent', 'accent-hover', 'accent-active', 'accent-tint', 'on-accent',
    'danger', 'danger-tint', 'success', 'warning', 'info', 'text-link', 'text-on-accent']) {
    const werte = [...css.matchAll(new RegExp(`--${marke}:\\s*([^;]+);`, 'g'))].map(t => t[1].trim())
    assert.ok(werte.length >= 2, `--${marke} fehlt in Hell oder Dunkel`)
    werte.forEach(wert => assert.match(wert, /var\(--(text|bg|ink|border)/,
      `--${marke} zeigt auf „${wert}" statt auf Tinte, Grund oder Kante`))
  }
})

test('Der löschende Knopf unterscheidet sich in der Form, nicht im Farbton', async () => {
  const css = await readFile(stilUrl, 'utf8')
  const koerper = css.slice(css.indexOf('.onda-btn--danger {'))
    .slice(0, css.slice(css.indexOf('.onda-btn--danger {')).indexOf('}'))

  // Der bestätigende Knopf ist eine gefüllte Fläche. Wäre der löschende das auch, sähen
  // beide nach dem Entfärben gleich aus — die gefährlichste Verwechslung, die es hier
  // gibt. Er ist deshalb ein Umriss.
  assert.match(koerper, /background:\s*transparent/, 'Der löschende Knopf ist wieder eine Fläche')
  assert.match(koerper, /border:\s*1px solid/, 'Dem löschenden Knopf fehlt der Umriss')
  assert.doesNotMatch(koerper, /#fff|white/i, 'Der löschende Knopf trägt wieder eine feste Schriftfarbe')
})
