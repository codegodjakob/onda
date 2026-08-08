// Der Lauf, der die Quellen nach Thema ordnet: wann er darf, wann er schweigt, und was
// er von einer Modellantwort ueberhaupt annimmt.
//
// Die Vorsicht hier ist nicht Pedanterie. Ein Lauf kostet Geld, und eine Antwort, die
// eine Quellenkennung erfindet, wuerde eine Quelle behaupten, die es nicht gibt.

import test from 'node:test'
import assert from 'node:assert/strict'

import {
  MINDEST_QUELLEN,
  darfAutomatischOrdnen,
  pruefeQuellenlaufGate,
  quellenSignatur,
  verarbeiteQuellenthemen,
  versucheQuellenlauf,
} from '../src/quellenlauf-model.mjs'

const quellen = anzahl => Array.from({ length: anzahl }, (unused, index) => ({ id: `q${index + 1}` }))

test('Das Tor: kein Projekt, kein Beispiel, keine zweite Runde parallel', () => {
  assert.deepEqual(pruefeQuellenlaufGate({ hatProjekt: false, anzahlQuellen: 9 }), { erlaubt: false, grund: 'kein-projekt' })
  assert.deepEqual(
    pruefeQuellenlaufGate({ hatProjekt: true, istBeispielprojekt: true, anzahlQuellen: 9 }),
    { erlaubt: false, grund: 'beispielprojekt' },
  )
  assert.deepEqual(
    pruefeQuellenlaufGate({ hatProjekt: true, laeuftBereits: true, anzahlQuellen: 9 }),
    { erlaubt: false, grund: 'lauf-aktiv' },
  )
  assert.deepEqual(
    pruefeQuellenlaufGate({ hatProjekt: true, anzahlQuellen: 0 }),
    { erlaubt: false, grund: 'keine-quellen' },
  )
})

test('Unter drei Quellen ordnet niemand von allein — von Hand schon', () => {
  const knapp = MINDEST_QUELLEN - 1
  assert.deepEqual(
    pruefeQuellenlaufGate({ hatProjekt: true, anzahlQuellen: knapp }),
    { erlaubt: false, grund: 'zu-wenige' },
  )
  assert.deepEqual(
    pruefeQuellenlaufGate({ hatProjekt: true, anzahlQuellen: knapp, vonHand: true }),
    { erlaubt: true },
  )
  assert.deepEqual(pruefeQuellenlaufGate({ hatProjekt: true, anzahlQuellen: MINDEST_QUELLEN }), { erlaubt: true })
})

test('Die Signatur haengt an der Quellenmenge, nicht an ihrer Reihenfolge', () => {
  const a = quellenSignatur('p1', [{ id: 'q2' }, { id: 'q1' }])
  const b = quellenSignatur('p1', [{ id: 'q1' }, { id: 'q2' }])
  assert.equal(a, b)
  assert.notEqual(a, quellenSignatur('p2', [{ id: 'q1' }, { id: 'q2' }]))
  assert.notEqual(a, quellenSignatur('p1', [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }]))
  assert.equal(quellenSignatur('p1', []), null)
  assert.equal(quellenSignatur(null, [{ id: 'q1' }]), null)
})

test('Dieselbe Quellenmenge wird nicht zweimal bezahlt — und ohne Signatur laeuft nichts', () => {
  assert.equal(darfAutomatischOrdnen('p1:q1,q2', 'p1:q1,q2'), false)
  assert.equal(darfAutomatischOrdnen('p1:q1,q2,q3', 'p1:q1,q2'), true)
  assert.equal(darfAutomatischOrdnen(null, null), false, 'fail-closed: im Zweifel nicht bezahlen')
})

test('Eine erfundene Quellenkennung faellt heraus, statt eine Quelle zu behaupten', () => {
  const ergebnis = verarbeiteQuellenthemen({
    geliefert: [{ name: 'Wahrnehmung', warum: 'Alle drehen sich um Aufmerksamkeit.', quellenIds: ['q1', 'erfunden', 'q2'] }],
    bekannteIds: ['q1', 'q2'],
  })
  assert.deepEqual(ergebnis.gruppen[0].quellenIds, ['q1', 'q2'])
})

test('Eine Quelle liegt in genau einem Thema: die zweite Nennung zaehlt nicht', () => {
  const ergebnis = verarbeiteQuellenthemen({
    geliefert: [
      { name: 'Eins', warum: '', quellenIds: ['q1', 'q2'] },
      { name: 'Zwei', warum: '', quellenIds: ['q2', 'q3'] },
    ],
    bekannteIds: ['q1', 'q2', 'q3'],
  })
  assert.deepEqual(ergebnis.gruppen.map(gruppe => gruppe.quellenIds), [['q1', 'q2'], ['q3']])
})

test('Eine Gruppe ohne gueltige Quelle und eine ohne Namen tragen nichts', () => {
  const ergebnis = verarbeiteQuellenthemen({
    geliefert: [
      { name: 'Leer', warum: '', quellenIds: ['gibtsnicht'] },
      { name: '   ', warum: '', quellenIds: ['q1'] },
      { name: 'Trägt', warum: '', quellenIds: ['q1'] },
    ],
    bekannteIds: ['q1'],
  })
  assert.deepEqual(ergebnis.gruppen.map(gruppe => gruppe.name), ['Trägt'])
  assert.equal(ergebnis.verworfen, 2)
  assert.equal(ergebnis.geliefertAnzahl, 3)
})

// „Sonstiges" ist die Rubrik, die entsteht, wenn ein Modell die Aufgabe nicht loesen
// kann, aber trotzdem etwas abliefern will. Sie verdeckt genau das, was der Mensch
// sehen muesste: dass diese Quellen noch ohne Thema sind.
test('Eine Restrubrik ist keine Ordnung und wird verworfen', () => {
  const ergebnis = verarbeiteQuellenthemen({
    geliefert: [
      { name: 'Sonstiges', warum: '', quellenIds: ['q1'] },
      { name: 'Weitere Quellen', warum: '', quellenIds: ['q2'] },
      { name: 'Ohne Thema', warum: '', quellenIds: ['q3'] },
    ],
    bekannteIds: ['q1', 'q2', 'q3'],
  })
  assert.deepEqual(ergebnis.gruppen, [])
  assert.equal(ergebnis.verworfen, 3)
})

test('Zweimal derselbe Gruppenname ist eine Gruppe, nicht zwei', () => {
  const ergebnis = verarbeiteQuellenthemen({
    geliefert: [
      { name: 'Wahrnehmung', warum: '', quellenIds: ['q1'] },
      { name: 'wahrnehmung', warum: '', quellenIds: ['q2'] },
    ],
    bekannteIds: ['q1', 'q2'],
  })
  assert.deepEqual(ergebnis.gruppen.map(gruppe => gruppe.name), ['Wahrnehmung'])
})

test('Kaputte Antworten sprengen nichts', () => {
  assert.deepEqual(verarbeiteQuellenthemen({ geliefert: null, bekannteIds: ['q1'] }).gruppen, [])
  assert.deepEqual(verarbeiteQuellenthemen({ geliefert: ['kaputt', 42], bekannteIds: ['q1'] }).gruppen, [])
  assert.deepEqual(verarbeiteQuellenthemen({ geliefert: [{ name: 'A', quellenIds: 'q1' }], bekannteIds: ['q1'] }).gruppen, [])
})

function laufWerkzeug(overrides = {}) {
  const protokoll = []
  return {
    protokoll,
    argumente: {
      hatProjekt: true,
      istBeispielprojekt: false,
      laeuftBereits: false,
      quellen: quellen(4),
      bestehendeThemen: [],
      verstaendnis: { task: 'Seminararbeit' },
      sperreSetzen: wert => protokoll.push(`sperre:${wert}`),
      hatSchluessel: async () => { protokoll.push('schluessel'); return true },
      istNochDasselbeProjekt: () => { protokoll.push('projekt'); return true },
      beansprucheKostenfreigabe: () => { protokoll.push('kosten'); return { erlaubt: true } },
      runTask: async (task, kontext) => {
        protokoll.push(`runTask:${task}`)
        assert.equal(kontext.verstaendnis.task, 'Seminararbeit')
        assert.equal(kontext.docText, undefined, 'Der Text gehoert nicht in diese Frage')
        return { daten: { gruppen: [{ name: 'Wahrnehmung', warum: 'Aufmerksamkeit.', quellenIds: ['q1', 'q2'] }] } }
      },
      setzeAgentStatus: zustand => protokoll.push(`status:${zustand.zustand}`),
      ...overrides,
    },
  }
}

test('Der Ablauf: Sperre vor dem ersten await, dann Schluessel, Projekt, Kosten, Lauf', async () => {
  const { protokoll, argumente } = laufWerkzeug()
  const ergebnis = await versucheQuellenlauf(argumente)
  assert.deepEqual(protokoll, [
    'sperre:true', 'schluessel', 'projekt', 'kosten',
    'status:laeuft', 'runTask:quellenthemen', 'status:bereit', 'sperre:false',
  ])
  assert.equal(ergebnis.erfolg, true)
  assert.deepEqual(ergebnis.gruppen.map(gruppe => gruppe.name), ['Wahrnehmung'])
})

test('Ohne Schluessel kostet der Lauf nichts und die Sperre faellt wieder', async () => {
  const { protokoll, argumente } = laufWerkzeug({ hatSchluessel: async () => false })
  const ergebnis = await versucheQuellenlauf(argumente)
  assert.deepEqual(ergebnis, { gestartet: false, grund: 'kein-schluessel' })
  assert.deepEqual(protokoll, ['sperre:true', 'sperre:false'])
})

test('Wer das Projekt waehrend des Laufs wechselt, bezahlt nicht fuer das alte', async () => {
  const { protokoll, argumente } = laufWerkzeug({ istNochDasselbeProjekt: () => false })
  const ergebnis = await versucheQuellenlauf(argumente)
  assert.equal(ergebnis.grund, 'projekt-gewechselt')
  assert.equal(protokoll.includes('kosten'), false, 'nach dem Projektwechsel darf nichts mehr beansprucht werden')
})

test('Verweigerte Kostenfreigabe haelt den Lauf auf', async () => {
  const { protokoll, argumente } = laufWerkzeug({
    beansprucheKostenfreigabe: () => ({ erlaubt: false, grund: 'monatsbudget-erreicht' }),
  })
  const ergebnis = await versucheQuellenlauf(argumente)
  assert.deepEqual(ergebnis, { gestartet: false, grund: 'monatsbudget-erreicht' })
  assert.equal(protokoll.some(schritt => schritt.startsWith('runTask')), false)
})

test('Ein Fehler im Lauf laesst die bestehenden Gruppen unberuehrt und loest die Sperre', async () => {
  const { protokoll, argumente } = laufWerkzeug({
    runTask: async () => { const fehler = new Error('offline'); fehler.typ = 'netz'; throw fehler },
  })
  const ergebnis = await versucheQuellenlauf(argumente)
  assert.deepEqual(ergebnis, { gestartet: true, erfolg: false, fehler: 'netz' })
  assert.equal(protokoll.at(-1), 'sperre:false')
  assert.ok(protokoll.includes('status:fehler'))
})
