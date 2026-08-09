import test from 'node:test'
import assert from 'node:assert/strict'
import { fasseErweiterungenZusammen } from '../src/erweiterung-model.mjs'

// Der Rück-Prompt ("bereits angeboten") ist der einzige Ort, an dem das Modell erfährt,
// was es dem Text schon vorgeschlagen hat. Fehlt darin das Muster, muss das Modell beim
// naechsten Lauf dieselbe Beobachtungsregel neu erfinden statt sie wiederzuerkennen --
// genau der Schema-Bruch aus Issue #14 (die Lieferung selbst verlangt muster als Pflichtfeld,
// siehe erweiterungslauf-model.mjs).
test('fasseErweiterungenZusammen: das Muster reist woertlich mit', () => {
  const doc = {
    erweiterungen: [{
      id: 'e1',
      art: 'feld',
      stellen: [],
      gedanke: 'Instandhaltung fehlt.',
      muster: 'Erhalt ist eine eigene Groesse.',
      createdAt: 1,
    }],
  }
  const [zusammenfassung] = fasseErweiterungenZusammen(doc)
  assert.equal(zusammenfassung.muster, 'Erhalt ist eine eigene Groesse.')
})

test('fasseErweiterungenZusammen: fehlendes oder leeres Muster wird zum leeren String, kein Wurf', () => {
  const doc = {
    erweiterungen: [
      { id: 'e1', art: 'feld', stellen: [], gedanke: 'g', createdAt: 1 },
      { id: 'e2', art: 'feld', stellen: [], gedanke: 'g', muster: '', createdAt: 2 },
    ],
  }
  assert.doesNotThrow(() => fasseErweiterungenZusammen(doc))
  const zusammenfassung = fasseErweiterungenZusammen(doc)
  assert.equal(zusammenfassung[0].muster, '')
  assert.equal(zusammenfassung[1].muster, '')
})
