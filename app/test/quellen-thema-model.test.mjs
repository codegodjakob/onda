// „Quellen nach Thema, von der KI gebildet und benannt; der Mensch kann umbenennen,
// verschieben, Gruppen anlegen — wie bei der Struktur." (Jakob, 7. August 2026)
//
// Der harte Teil daran ist nicht das Gruppieren, sondern das Standhalten: was der
// Mensch entschieden hat, darf der nächste Lauf des Agenten nicht widerrufen.

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  OHNE_THEMA,
  OHNE_THEMA_NAME,
  benenneThemaUm,
  beschreibeThema,
  ensureQuellenThemen,
  legeThemaAn,
  loescheThema,
  themenBaum,
  uebernimmThemenvorschlag,
  verschiebeQuelle,
} from '../src/quellen-thema-model.mjs'

function projekt(anzahl = 3) {
  return {
    id: 'p1',
    sources: Array.from({ length: anzahl }, (unused, index) => ({
      id: `q${index + 1}`,
      metadata: { title: `Quelle ${index + 1}` },
    })),
  }
}

test('Ohne Zuordnung stehen alle Quellen sichtbar in einer eigenen Gruppe', () => {
  const p = projekt()
  const baum = themenBaum(p)
  assert.equal(baum.length, 1)
  assert.equal(baum[0].id, OHNE_THEMA)
  assert.equal(baum[0].name, OHNE_THEMA_NAME)
  assert.deepEqual(baum[0].quellen.map(q => q.id), ['q1', 'q2', 'q3'])
  // Die Gruppe ist die Abwesenheit einer Zuordnung, kein Thema — sie wird nicht abgelegt.
  assert.deepEqual(p.quellenThemen, [])
})

test('Der Agent bildet und benennt die Themen', () => {
  const p = projekt()
  uebernimmThemenvorschlag(p, [
    { name: 'Aufmerksamkeit', quellenIds: ['q1', 'q3'] },
    { name: 'Werkzeuggestaltung', quellenIds: ['q2'] },
  ])
  const baum = themenBaum(p)
  assert.deepEqual(baum.map(gruppe => gruppe.name), ['Aufmerksamkeit', 'Werkzeuggestaltung'])
  assert.deepEqual(baum[0].quellen.map(q => q.id), ['q1', 'q3'])
  assert.equal(baum.some(gruppe => gruppe.id === OHNE_THEMA), false)
  assert.equal(baum[0].vonKi, true)
})

test('Eine Quelle liegt in genau einem Thema', () => {
  const p = projekt()
  uebernimmThemenvorschlag(p, [
    { name: 'Eins', quellenIds: ['q1', 'q2'] },
    { name: 'Zwei', quellenIds: ['q2'] },
  ])
  const zuordnungen = p.quellenThemen.flatMap(thema => thema.quellenIds)
  assert.equal(zuordnungen.filter(id => id === 'q2').length, 1)
})

test('Der Mensch benennt um, verschiebt und legt Gruppen an', () => {
  const p = projekt()
  uebernimmThemenvorschlag(p, [{ name: 'Aufmerksamkeit', quellenIds: ['q1', 'q2', 'q3'] }])
  const [thema] = p.quellenThemen

  benenneThemaUm(p, thema.id, 'Ablenkung')
  assert.equal(themenBaum(p)[0].name, 'Ablenkung')

  const eigene = legeThemaAn(p, 'Meine Fundstücke')
  verschiebeQuelle(p, 'q3', eigene.id)
  const baum = themenBaum(p)
  assert.deepEqual(baum.map(gruppe => gruppe.name), ['Ablenkung', 'Meine Fundstücke'])
  assert.deepEqual(baum[1].quellen.map(q => q.id), ['q3'])
  assert.deepEqual(baum[0].quellen.map(q => q.id), ['q1', 'q2'])
})

test('Der nächste Lauf des Agenten holt eine von Hand verschobene Quelle nicht zurück', () => {
  const p = projekt()
  uebernimmThemenvorschlag(p, [{ name: 'Aufmerksamkeit', quellenIds: ['q1', 'q2', 'q3'] }])
  const eigene = legeThemaAn(p, 'Meine Fundstücke')
  verschiebeQuelle(p, 'q3', eigene.id)

  // Derselbe Vorschlag noch einmal. Ohne den Schutz läge q3 wieder in der Gruppe des
  // Agenten — dann wäre Sortieren eine Arbeit, die man endlos wiederholt.
  uebernimmThemenvorschlag(p, [{ name: 'Aufmerksamkeit', quellenIds: ['q1', 'q2', 'q3'] }])
  const baum = themenBaum(p)
  assert.deepEqual(baum.find(gruppe => gruppe.name === 'Meine Fundstücke').quellen.map(q => q.id), ['q3'])
  assert.deepEqual(baum.find(gruppe => gruppe.name === 'Aufmerksamkeit').quellen.map(q => q.id), ['q1', 'q2'])
})

test('Ein umbenanntes Thema behält seinen Namen', () => {
  const p = projekt()
  uebernimmThemenvorschlag(p, [{ name: 'Aufmerksamkeit', quellenIds: ['q1', 'q2'] }])
  const themaId = p.quellenThemen[0].id
  benenneThemaUm(p, themaId, 'Ablenkung')
  // Umbenannt heißt: die Gruppe gehört jetzt dem Menschen. (Frisch nachlesen — die
  // Selbstheilung baut die Liste bei jedem Zugriff neu auf.)
  assert.equal(p.quellenThemen[0].vonKi, false)

  uebernimmThemenvorschlag(p, [{ name: 'Ablenkung', quellenIds: ['q1', 'q2', 'q3'] }])
  const baum = themenBaum(p)
  assert.deepEqual(baum.map(gruppe => gruppe.name), ['Ablenkung'])
  assert.deepEqual(baum[0].quellen.map(q => q.id), ['q1', 'q2', 'q3'])
})

test('Verschieben auf „ohne Thema" nimmt die Quelle aus jeder Gruppe', () => {
  const p = projekt()
  uebernimmThemenvorschlag(p, [{ name: 'Eins', quellenIds: ['q1', 'q2', 'q3'] }])
  verschiebeQuelle(p, 'q2', OHNE_THEMA)
  const baum = themenBaum(p)
  assert.deepEqual(baum.find(gruppe => gruppe.id === OHNE_THEMA).quellen.map(q => q.id), ['q2'])
})

test('Eine gelöschte Quelle verschwindet aus ihrem Thema', () => {
  const p = projekt()
  uebernimmThemenvorschlag(p, [{ name: 'Eins', quellenIds: ['q1', 'q2'] }])
  p.sources = p.sources.filter(quelle => quelle.id !== 'q1')
  assert.deepEqual(ensureQuellenThemen(p)[0].quellenIds, ['q2'])
})

test('Eine beschädigte Ablage heilt sich, statt den Baum zu sprengen', () => {
  const p = projekt()
  p.quellenThemen = [
    { id: '', name: '', quellenIds: ['q1', 'q1', 'unbekannt'] },
    { id: '', name: 'Zwei', quellenIds: ['q1', 'q2'] },
    'kaputt',
  ]
  const themen = ensureQuellenThemen(p)
  assert.equal(themen.length, 2)
  assert.equal(new Set(themen.map(thema => thema.id)).size, 2)
  assert.deepEqual(themen[0].quellenIds, ['q1'])
  assert.deepEqual(themen[1].quellenIds, ['q2'])
  assert.equal(themen[0].name, 'Ohne Namen')
})

test('Der Agent begründet seine Gruppen in einem Satz', () => {
  const p = projekt()
  uebernimmThemenvorschlag(p, [
    { name: 'Aufmerksamkeit', warum: 'Alle drei fragen, worauf Menschen achten.', quellenIds: ['q1', 'q2'] },
  ])
  assert.equal(themenBaum(p)[0].warum, 'Alle drei fragen, worauf Menschen achten.')
})

test('Wer die Begründung von Hand ändert, übernimmt die Gruppe', () => {
  const p = projekt()
  uebernimmThemenvorschlag(p, [{ name: 'Aufmerksamkeit', warum: 'Vom Agenten.', quellenIds: ['q1', 'q2'] }])
  const themaId = p.quellenThemen[0].id
  beschreibeThema(p, themaId, 'Weil ich sie zusammen gelesen habe.')
  assert.equal(p.quellenThemen[0].vonKi, false)

  // Derselbe Vorschlag noch einmal: der Name bleibt, die Begründung auch. Ohne diesen
  // Schutz schriebe der nächste Lauf den eigenen Satz still um.
  uebernimmThemenvorschlag(p, [{ name: 'Aufmerksamkeit', warum: 'Vom Agenten.', quellenIds: ['q1', 'q2'] }])
  assert.equal(p.quellenThemen[0].warum, 'Weil ich sie zusammen gelesen habe.')
})

test('Eine Gruppe auflösen lässt die Quellen stehen — sie fallen nur zurück ins Offene', () => {
  const p = projekt()
  uebernimmThemenvorschlag(p, [
    { name: 'Eins', warum: '', quellenIds: ['q1', 'q2'] },
    { name: 'Zwei', warum: '', quellenIds: ['q3'] },
  ])
  const themaId = p.quellenThemen[0].id
  const ergebnis = loescheThema(p, themaId)

  assert.deepEqual(ergebnis, { name: 'Eins', freigewordene: ['q1', 'q2'] })
  assert.equal(p.sources.length, 3, 'keine Quelle darf mit ihrer Gruppe fallen')
  const baum = themenBaum(p)
  assert.deepEqual(baum.map(gruppe => gruppe.name), ['Zwei', OHNE_THEMA_NAME])
  assert.deepEqual(baum[1].quellen.map(q => q.id), ['q1', 'q2'])
})

test('Eine unbekannte Gruppe aufzulösen tut nichts', () => {
  const p = projekt()
  uebernimmThemenvorschlag(p, [{ name: 'Eins', warum: '', quellenIds: ['q1'] }])
  assert.equal(loescheThema(p, 'gibtsnicht'), null)
  assert.equal(p.quellenThemen.length, 1)
})

test('Eine leergeräumte Gruppe des Agenten verschwindet, eine eigene bleibt stehen', () => {
  const p = projekt()
  uebernimmThemenvorschlag(p, [{ name: 'Aufmerksamkeit', warum: '', quellenIds: ['q1', 'q2', 'q3'] }])
  const eigene = legeThemaAn(p, 'Meine Fundstücke')

  // Der Agent ordnet alles um: seine alte Gruppe ist leer und damit kein Thema mehr.
  // Die selbst angelegte bleibt — dort hat jemand ausdrücklich Platz gemeint.
  uebernimmThemenvorschlag(p, [{ name: 'Werkzeuge', warum: '', quellenIds: ['q1', 'q2', 'q3'] }])
  const namen = p.quellenThemen.map(thema => thema.name)
  assert.equal(namen.includes('Aufmerksamkeit'), false)
  assert.deepEqual(namen.slice().sort(), ['Meine Fundstücke', 'Werkzeuge'])
  assert.equal(p.quellenThemen.find(thema => thema.id === eigene.id).quellenIds.length, 0)
})
