import test from 'node:test'
import assert from 'node:assert/strict'

import {
  HANDWERK_PRO_TEXTART,
  formatiereHandwerk,
  projiziereHandwerk,
} from '../src/handwerk-model.mjs'
import { LANGUAGE_GENRES } from '../src/language-profile.mjs'

test('jede Textart hat genau eine vollständige Handwerksprojektion', () => {
  assert.deepEqual(Object.keys(HANDWERK_PRO_TEXTART).sort(), [...LANGUAGE_GENRES].sort())
  for (const genre of LANGUAGE_GENRES) {
    const handwerk = projiziereHandwerk({ genre })
    assert.equal(handwerk.genre, genre)
    assert.ok(handwerk.ziel.length > 20)
    assert.ok(handwerk.prioritaeten.length >= 3)
    assert.ok(handwerk.prueffragen.length >= 2)
    assert.ok(handwerk.fehlformen.length >= 2)
    assert.ok(['streng', 'beratend', 'offen'].includes(handwerk.direktivitaet))
  }
})

test('derselbe Textteil wird für Wissenschaft, Essay und Prosa verschieden gerahmt', () => {
  const eingabe = { passageFunction: 'Eine überraschende Schlussfolgerung vorbereiten' }
  const wissenschaft = projiziereHandwerk({ ...eingabe, genre: 'scientific' })
  const essay = projiziereHandwerk({ ...eingabe, genre: 'essay' })
  const prosa = projiziereHandwerk({ ...eingabe, genre: 'prosa' })

  assert.match(wissenschaft.prueffragen.join(' '), /Beleg|Methode|nachprüf/iu)
  assert.match(essay.prueffragen.join(' '), /Gedanke|Gegenposition|Spannung/iu)
  assert.match(prosa.prueffragen.join(' '), /Figur|Szene|Erzähl/iu)
  assert.notDeepEqual(wissenschaft.integritaetsArten, essay.integritaetsArten)
  assert.notDeepEqual(essay.tragendeStilmittel, prosa.tragendeStilmittel)
})

test('unbestimmte oder unbekannte Textart bleibt fail-closed und empfiehlt kein Stilmittel', () => {
  for (const genre of ['', 'other', 'nicht-erfunden']) {
    const handwerk = projiziereHandwerk({ genre })
    assert.equal(handwerk.failClosed, true)
    assert.deepEqual(handwerk.tragendeStilmittel, [])
    assert.deepEqual(handwerk.integritaetsArten, ['fakt', 'quelle', 'methode', 'logik'])
  }
})

test('formatierter Handwerksblock nennt Textart, Funktion, Stilzweck und konkrete Prüffragen', () => {
  const block = formatiereHandwerk(projiziereHandwerk({
    genre: 'campaign',
    passageFunction: 'Zum Handeln bewegen',
    activeStyle: { name: 'Plakatstimme', purpose: 'Knapp und erinnerbar', rules: ['Kein Amtsdeutsch'] },
  }))
  assert.match(block, /Kampagnentext/)
  assert.match(block, /Zum Handeln bewegen/)
  assert.match(block, /Plakatstimme/)
  assert.match(block, /Knapp und erinnerbar/)
  assert.match(block, /Prüffragen:/)
  assert.match(block, /Kein Amtsdeutsch/)
})
