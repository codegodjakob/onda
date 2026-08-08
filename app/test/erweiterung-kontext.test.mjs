import test from 'node:test'
import assert from 'node:assert/strict'
import { baueErweiterungKontext } from '../src/erweiterung-kontext.mjs'
import { baueAnfrage } from '../src/agent-tasks.mjs'
import { ERWEITERUNG_ANWEISUNG } from '../src/agent-prompts.mjs'
import {
  bilanziereRueckmeldung,
  entscheideRueckkopplung,
  erstelleRueckkopplungsvorschlag,
} from '../src/rueckkopplung-model.mjs'

// PFLICHT (Lehre aus V-3, siehe hinweis-kontext.test.mjs): baueAnfrage (agent-tasks.mjs)
// konsumiert ausschliesslich {verstaendnis, docText, volatiles, verlauf, anfrage}. Ein Block,
// der nur im Zwischenwert steht, aber nie im echten Request-Body landet, waere ein stiller
// Verlust — diese Tests fahren deshalb den echten Weg (baueErweiterungKontext -> baueAnfrage).

const VERSTAENDNIS = { task: 'Essay', audience: ['Studierende'], desiredEffect: 'Verstehen' }

test('ERWEITERUNG_ANWEISUNG und bereits Angebotenes erreichen den echten Request-Body', () => {
  const kontext = baueErweiterungKontext({
    verstaendnis: VERSTAENDNIS,
    docText: 'MARKANTER-DOKTEXT-3f7a Ein Absatz mit einer offenen Wendung.',
    bereitsAngeboten: [{ art: 'feld', gedanke: 'MARKANTER-ANGEBOT-8b2c', zustand: 'weg' }],
  })
  const anfrage = baueAnfrage('erweiterungen', kontext)
  const bodyJson = JSON.stringify(anfrage.body)

  assert.ok(bodyJson.includes(ERWEITERUNG_ANWEISUNG.slice(0, 40)), 'ERWEITERUNG_ANWEISUNG fehlt im Request-Body')
  assert.ok(bodyJson.includes('MARKANTER-ANGEBOT-8b2c'), 'bereits Angebotenes fehlt im Request-Body')
  assert.ok(bodyJson.includes('MARKANTER-DOKTEXT-3f7a'), 'Dokumenttext fehlt im Request-Body')
})

test('ohne bereits Angebotenes nur ERWEITERUNG_ANWEISUNG als Volatile, kein leerer Block', () => {
  const kontext = baueErweiterungKontext({ verstaendnis: null, docText: 'Text', bereitsAngeboten: [] })
  assert.deepEqual(kontext.volatiles, [ERWEITERUNG_ANWEISUNG])
})

test('fehlender Aufruf ohne Argumente wirft nicht und liefert nur ERWEITERUNG_ANWEISUNG', () => {
  const kontext = baueErweiterungKontext()
  assert.deepEqual(kontext.volatiles, [ERWEITERUNG_ANWEISUNG])
  assert.equal(kontext.docText, '')
  assert.equal(kontext.verstaendnis, null)
})

test('baueErweiterungKontext ist pur: gleicher Input ergibt byte-gleiches JSON', () => {
  const eingabe = {
    verstaendnis: VERSTAENDNIS,
    docText: 'Text',
    bereitsAngeboten: [{ art: 'feld', gedanke: 'a', zustand: 'weg' }],
  }
  const a = JSON.stringify(baueErweiterungKontext(eingabe))
  const b = JSON.stringify(baueErweiterungKontext(eingabe))
  assert.equal(a, b)
})

// ---- Rueckkopplung -----------------------------------------------------------
// Derselbe zweite bezahlte Kanal wie im Hinweiskanal (hinweis-kontext.test.mjs): dasselbe
// freigegebene Entscheidungsbild, dieselbe Formulierung (formuliereRueckkopplung wird
// unveraendert wiederverwendet), nur ein zweiter Kanal, den es erreicht.

function machRueckkopplung() {
  const findings = []
  const decisions = []
  const anlegen = (art, status, anzahl) => {
    for (let i = 0; i < anzahl; i += 1) {
      const id = `${art}-${status}-${i}`
      findings.push({ id, kiKategorie: art, status })
      decisions.push({ findingId: id, outcome: status })
    }
  }
  anlegen('struktur', 'dismissed', 18)
  anlegen('struktur', 'resolved', 2)
  anlegen('fakt', 'resolved', 9)
  anlegen('fakt', 'dismissed', 3)
  const vorschlag = erstelleRueckkopplungsvorschlag(
    bilanziereRueckmeldung({ dokumente: [{ findings, decisions }] }),
  )
  return entscheideRueckkopplung(vorschlag, { approved: true, actor: 'user', at: 1 })
}

test('eine freigegebene Rueckkopplung erreicht den echten Request-Body und steht direkt hinter der Anweisung', () => {
  const kontext = baueErweiterungKontext({
    verstaendnis: VERSTAENDNIS,
    docText: 'Text',
    bereitsAngeboten: [{ art: 'feld', gedanke: 'a', zustand: 'weg' }],
    rueckkopplung: machRueckkopplung(),
  })
  assert.equal(kontext.volatiles[0], ERWEITERUNG_ANWEISUNG)
  assert.ok(kontext.volatiles[1].includes('struktur: 18 von 20'), kontext.volatiles[1])
  // Wortlautdisziplin: „prüfe hier besonders streng", NIE eine Streichung nahelegen.
  assert.ok(kontext.volatiles[1].includes('besonders streng'), kontext.volatiles[1])
  assert.ok(!kontext.volatiles[1].toLowerCase().includes('gib diese art nicht mehr'), kontext.volatiles[1])

  const bodyJson = JSON.stringify(baueAnfrage('erweiterungen', kontext).body)
  assert.ok(bodyJson.includes('struktur: 18 von 20'), 'die Bilanz fehlt im Request-Body')
  assert.ok(bodyJson.includes('NÜTZLICHKEIT'), 'der Unterschied Nuetzlichkeit/Richtigkeit fehlt im Request-Body')
})

test('die Rueckkopplung steht vor den bereits angebotenen Erweiterungen', () => {
  const kontext = baueErweiterungKontext({
    verstaendnis: VERSTAENDNIS,
    docText: 'Text',
    bereitsAngeboten: [{ art: 'feld', gedanke: 'MARKANTES-ANGEBOT-2a', zustand: 'weg' }],
    rueckkopplung: machRueckkopplung(),
  })
  const rueckkopplungIndex = kontext.volatiles.findIndex(block => block.includes('struktur: 18 von 20'))
  const angebotenIndex = kontext.volatiles.findIndex(block => block.includes('MARKANTES-ANGEBOT-2a'))
  assert.ok(rueckkopplungIndex >= 0 && angebotenIndex >= 0)
  assert.ok(rueckkopplungIndex < angebotenIndex, 'die Rueckkopplung muss vor den Listen stehen')
})

test('die Rueckkopplung bleibt volatil: kein cache_control, Praefix unveraendert', () => {
  const kontext = baueErweiterungKontext({ verstaendnis: VERSTAENDNIS, docText: 'Doktext', rueckkopplung: machRueckkopplung() })
  const content = baueAnfrage('erweiterungen', kontext).body.messages[0].content
  assert.ok(content[0].text.startsWith('<projektverstaendnis>'))
  assert.ok(content[1].text.startsWith('<dokument>'))
  for (const block of content.slice(2)) assert.ok(!('cache_control' in block), 'Volatiles duerfen kein cache_control tragen')
})

test('eine Bilanz ohne verwertbare Zahlen erzeugt KEINEN leeren Block', () => {
  const leer = bilanziereRueckmeldung({ dokumente: [{ findings: [{ id: 'x', kiKategorie: 'struktur', status: 'dismissed' }], decisions: [] }] })
  const kontext = baueErweiterungKontext({ verstaendnis: null, docText: 'Text', rueckkopplung: leer })
  assert.deepEqual(kontext.volatiles, [ERWEITERUNG_ANWEISUNG])
  assert.deepEqual(baueErweiterungKontext({ docText: 'Text', rueckkopplung: null }).volatiles, [ERWEITERUNG_ANWEISUNG])
})

test('eine rohe, nur vorgeschlagene oder abgelehnte Bilanz beeinflusst den Auftrag nicht (fail-closed)', () => {
  const freigegeben = machRueckkopplung()
  const roh = freigegeben.bilanz
  const pending = { ...freigegeben, status: 'pending' }
  const abgelehnt = { ...freigegeben, status: 'rejected' }
  assert.deepEqual(baueErweiterungKontext({ docText: 'Text', rueckkopplung: roh }).volatiles, [ERWEITERUNG_ANWEISUNG])
  assert.deepEqual(baueErweiterungKontext({ docText: 'Text', rueckkopplung: pending }).volatiles, [ERWEITERUNG_ANWEISUNG])
  assert.deepEqual(baueErweiterungKontext({ docText: 'Text', rueckkopplung: abgelehnt }).volatiles, [ERWEITERUNG_ANWEISUNG])
})
