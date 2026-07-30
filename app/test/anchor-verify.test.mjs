import test from 'node:test'
import assert from 'node:assert/strict'
import { findeAnker, dedupeHinweise } from '../src/anchor-verify.mjs'

test('findeAnker: exakter Treffer liefert Original-Index, Laenge und normalisiert=false', () => {
  const doc = 'Der Anfang. Die mittlere Passage steht hier. Das Ende.'
  const treffer = findeAnker(doc, 'Passage steht hier')
  assert.deepEqual(treffer, {
    gefunden: true,
    index: doc.indexOf('Passage steht hier'),
    normalisiert: false,
    laenge: 'Passage steht hier'.length,
  })
  assert.equal(doc.slice(treffer.index, treffer.index + treffer.laenge), 'Passage steht hier')
})

test('findeAnker: kollabiertes Whitespace wird normalisiert gefunden, Index+Laenge zeigen auf den echten Originaltext', () => {
  const doc = 'Ein Satz mit  doppeltem\n Leerraum im Text.'
  const treffer = findeAnker(doc, 'mit doppeltem Leerraum')
  assert.equal(treffer.gefunden, true)
  assert.equal(treffer.normalisiert, true)
  assert.equal(doc.slice(treffer.index, treffer.index + 3), 'mit')
  // Fix-Runde 2, Finding 3: laenge deckt den GESAMTEN Treffer im Originaltext ab (inklusive des
  // kollabierten Leerraums), nicht nur die Laenge des gesuchten (normalisierten) Ankers -- der
  // Originaltext ist hier LAENGER als der normalisierte Anker, weil "  " und "\n " zu je einem
  // Leerzeichen kollabieren.
  assert.equal(doc.slice(treffer.index, treffer.index + treffer.laenge), 'mit  doppeltem\n Leerraum')
  assert.ok(treffer.laenge > 'mit doppeltem Leerraum'.length)
})

test('findeAnker: typografische und gerade Anfuehrungszeichen gelten als gleich, Laenge deckt die echten (typografischen) Zeichen ab', () => {
  const doc = 'Sie nannte es „ein stilles Werkzeug“ und blieb dabei.'
  const gerade = findeAnker(doc, '"ein stilles Werkzeug"')
  assert.equal(gerade.gefunden, true)
  assert.equal(gerade.normalisiert, true)
  const wortlaut = doc.slice(gerade.index, gerade.index + gerade.laenge)
  assert.equal(wortlaut, '„ein stilles Werkzeug“')
  assert.notEqual(wortlaut, '"ein stilles Werkzeug"', 'der echte Dokument-Wortlaut traegt typografische, keine geraden Anfuehrungszeichen')
  assert.ok(doc.includes(wortlaut), 'target muss woertlich im Dokument vorkommen')

  const einfach = findeAnker('Er sagte ‚ja‘ und ging.', "'ja'")
  assert.equal(einfach.gefunden, true)
  assert.equal(einfach.normalisiert, true)
  assert.equal('Er sagte ‚ja‘ und ging.'.slice(einfach.index, einfach.index + einfach.laenge), '‚ja‘')
})

test('findeAnker: nicht vorhandene, leere oder kaputte Anker werden verworfen', () => {
  assert.deepEqual(findeAnker('Kurzer Text.', 'erfundenes Zitat'),
    { gefunden: false, index: null, normalisiert: false, laenge: null })
  assert.equal(findeAnker('Kurzer Text.', '   ').gefunden, false)
  assert.equal(findeAnker('Kurzer Text.', '').gefunden, false)
  assert.equal(findeAnker(null, 'x').gefunden, false)
  assert.equal(findeAnker('Kurzer Text.', 'erfundenes Zitat').laenge, null)
})

test('dedupeHinweise: gleicher Anker+Kategorie wie ein vorhandenes Finding fliegt raus', () => {
  const findings = [{ id: 'f-1', anker: 'diese Stelle', kategorie: 'logik', status: 'open' }]
  const neu = [
    { anker: 'diese Stelle', kategorie: 'logik' },
    { anker: 'diese Stelle', kategorie: 'sprache' },
    { anker: 'andere Stelle', kategorie: 'logik' },
  ]
  const ergebnis = dedupeHinweise(neu, findings, [])
  assert.equal(ergebnis.length, 2)
  assert.equal(ergebnis[0].kategorie, 'sprache')
  assert.equal(ergebnis[1].anker, 'andere Stelle')
})

test('dedupeHinweise: Bestands-Findings mit target/category zaehlen ebenfalls', () => {
  const findings = [{ id: 'f-2', target: 'alte Stelle', category: 'wording', status: 'dismissed' }]
  const ergebnis = dedupeHinweise([{ anker: 'alte Stelle', kategorie: 'wording' }], findings, [])
  assert.equal(ergebnis.length, 0)
})

test('dedupeHinweise: fruehere Entscheidung blockt, Duplikate im selben Lauf ebenso', () => {
  const findings = [{ id: 'f-3', anker: 'entschiedene Stelle', kategorie: 'fakt', status: 'risk-accepted' }]
  const decisions = [{ id: 'd-1', findingId: 'f-3', kind: 'reject', outcome: 'risk-accepted' }]
  const neu = [
    { anker: 'entschiedene Stelle', kategorie: 'fakt' },
    { anker: 'frische Stelle', kategorie: 'fakt' },
    { anker: 'frische  Stelle', kategorie: 'fakt' },
  ]
  const ergebnis = dedupeHinweise(neu, findings, decisions)
  assert.equal(ergebnis.length, 1)
  assert.equal(ergebnis[0].anker, 'frische Stelle')
})
