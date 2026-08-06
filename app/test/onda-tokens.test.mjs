import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const blatt = readFileSync(resolve(hier, '../src/onda-tokens.css'), 'utf8')

function marke(name) {
  const treffer = new RegExp(`--${name}\\s*:\\s*([^;]+);`).exec(blatt)
  return treffer ? treffer[1].trim() : null
}

// ---- Editoriale Grundflaeche, warme Overlays --------------------------------
//
// Jakob hat am 06.08.2026 Richtung A fuer die Arbeitsoberflaeche und die weichere
// Overlayform aus Richtung C gewaehlt. Statische Flaechen bleiben deshalb knapp;
// nur echte schwebende Ebenen werden merklich weicher. Diese Pruefung verhindert,
// dass Controls wieder zu Pillen oder alle Flaechen wieder gleich rund werden.
//
// Wer sie ändern will, ändert sie bewusst. Genau das ist der Zweck.

const ECKEN = Object.freeze({
  'radius-control': '8px',
  'radius-card': '10px',
  'radius-panel': '10px',
  'radius-overlay': '16px',
})

test('die Ecken sind knapp, nicht rund', () => {
  for (const [name, erwartet] of Object.entries(ECKEN)) {
    assert.equal(marke(name), erwartet,
      `--${name} steht auf "${marke(name)}", entschieden war "${erwartet}". `
      + 'Siehe den Kommentar in src/onda-tokens.css: das Design System widerspricht '
      + 'sich hier, und es gilt der Abschnitt "Ecken".')
  }
})

test('kein Eckenmass ist eine Pille — ausser dem, das eine sein soll', () => {
  // --radius-pill und --radius-full duerfen 999px sein; sie heissen so.
  // Alles andere waere die runde Fassung durch die Hintertuer.
  for (const name of Object.keys(ECKEN)) {
    const wert = marke(name)
    assert.ok(!/999|var\(--radius-full\)|var\(--radius-pill\)/.test(wert || ''),
      `--${name} zeigt auf eine Pille: "${wert}"`)
  }
  assert.equal(marke('radius-full'), '999px')
  assert.equal(marke('radius-pill'), 'var(--radius-full)')
})

test('nur echte Overlays sind weicher als die statische Arbeitsoberflaeche', () => {
  assert.ok(Number.parseInt(marke('radius-control'), 10) < Number.parseInt(marke('radius-card'), 10))
  assert.equal(marke('radius-card'), marke('radius-panel'))
  assert.ok(Number.parseInt(marke('radius-overlay'), 10) > Number.parseInt(marke('radius-panel'), 10))
})

test('die bestaetigte A-C-Kombination ist im Blatt vermerkt', () => {
  assert.match(blatt, /Richtung A/i)
  assert.match(blatt, /Overlays? aus Richtung C/i)
})
