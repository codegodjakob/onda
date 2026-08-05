import test from 'node:test'
import assert from 'node:assert/strict'
import { baueHinweisKontext } from '../src/hinweis-kontext.mjs'
import { baueAnfrage } from '../src/agent-tasks.mjs'
import { HINWEIS_ANWEISUNG } from '../src/agent-prompts.mjs'
import {
  bilanziereRueckmeldung,
  entscheideRueckkopplung,
  erstelleRueckkopplungsvorschlag,
} from '../src/rueckkopplung-model.mjs'

// PFLICHT (Lehre aus V-3, Fix-Runde 1, Finding 1): baueAnfrage (agent-tasks.mjs) konsumiert
// ausschliesslich {verstaendnis, docText, volatiles, verlauf, anfrage}. Ein Kontext-Objekt mit
// eigenen Feldnamen wie {entscheidungen, offeneHinweise} wuerde von baueAnfrage stillschweigend
// ignoriert — das Modell bekaeme HINWEIS_ANWEISUNG und die Entscheidungsliste nie zu sehen, und
// alle Unit-Tests waeren trotzdem gruen, wenn sie nur den Zwischenwert pruefen. Diese Tests
// fahren deshalb den echten Weg (baueHinweisKontext -> baueAnfrage) und pruefen den
// TATSAECHLICHEN Request-Body. Ein gestubbter fetch waere hier KEIN Beleg.

const VERSTAENDNIS = { task: 'Essay', audience: ['Studierende'], desiredEffect: 'Verstehen' }

test('HINWEIS_ANWEISUNG, Entscheidungen, offene Hinweise und Dokumenttext erreichen den echten Request-Body', () => {
  const kontext = baueHinweisKontext({
    verstaendnis: VERSTAENDNIS,
    docText: 'MARKANTER-DOKTEXT-9c1b Ein Absatz mit einer steilen These.',
    entscheidungen: [
      { anker: 'steilen These', kategorie: 'logik', kurz: 'zu absolut formuliert', entscheidung: 'dismissed', begruendung: '' },
    ],
    offeneHinweise: [
      { anker: 'MARKANTER-OFFENER-ANKER-4d2e', kategorie: 'quelle', kurz: 'Beleg fehlt' },
    ],
  })
  const anfrage = baueAnfrage('hinweise', kontext)
  const bodyJson = JSON.stringify(anfrage.body)

  assert.ok(bodyJson.includes(HINWEIS_ANWEISUNG.slice(0, 40)), 'HINWEIS_ANWEISUNG fehlt im Request-Body')
  assert.ok(bodyJson.includes('steilen These') && bodyJson.includes('dismissed'), 'Entscheidungsliste fehlt im Request-Body')
  assert.ok(bodyJson.includes('MARKANTER-OFFENER-ANKER-4d2e'), 'offene Hinweise fehlen im Request-Body')
  assert.ok(bodyJson.includes('MARKANTER-DOKTEXT-9c1b'), 'Dokumenttext fehlt im Request-Body')
  assert.equal(anfrage.body.output_config.format.type, 'json_schema', 'hinweise-Task muss schema-erzwungen sein')
})

test('ohne Entscheidungen/offene Hinweise nur HINWEIS_ANWEISUNG als Volatile, kein leerer Block', () => {
  const kontext = baueHinweisKontext({ verstaendnis: null, docText: 'Text', entscheidungen: [], offeneHinweise: [] })
  assert.deepEqual(kontext.volatiles, [HINWEIS_ANWEISUNG])
})

test('Cache-Praefix bleibt stabil: verstaendnis+dokument zuerst mit cache_control, Volatiles danach ohne', () => {
  const kontext = baueHinweisKontext({
    verstaendnis: VERSTAENDNIS,
    docText: 'Doktext',
    entscheidungen: [{ anker: 'a', kategorie: 'fakt' }],
    offeneHinweise: [],
  })
  const anfrage = baueAnfrage('hinweise', kontext)
  const content = anfrage.body.messages[0].content
  assert.ok(content[0].text.startsWith('<projektverstaendnis>'))
  assert.deepEqual(content[0].cache_control, { type: 'ephemeral' })
  assert.ok(content[1].text.startsWith('<dokument>'))
  assert.deepEqual(content[1].cache_control, { type: 'ephemeral' })
  for (const block of content.slice(2)) assert.ok(!('cache_control' in block), 'Volatiles duerfen kein cache_control tragen')
})

test('letzte Message ist user, kein Prefill — hinweise hat keinen verlauf/anfrage', () => {
  const kontext = baueHinweisKontext({ verstaendnis: null, docText: 'Text', entscheidungen: [], offeneHinweise: [] })
  const anfrage = baueAnfrage('hinweise', kontext)
  assert.equal(anfrage.body.messages.length, 1)
  assert.equal(anfrage.body.messages[0].role, 'user')
})

test('baueHinweisKontext ist pur: gleicher Input ergibt byte-gleiches JSON', () => {
  const eingabe = {
    verstaendnis: VERSTAENDNIS,
    docText: 'Text',
    entscheidungen: [{ anker: 'a', kategorie: 'fakt' }],
    offeneHinweise: [{ anker: 'b', kategorie: 'quelle' }],
  }
  const a = JSON.stringify(baueHinweisKontext(eingabe))
  const b = JSON.stringify(baueHinweisKontext(eingabe))
  assert.equal(a, b)
})

test('fehlender Aufruf ohne Argumente wirft nicht und liefert nur HINWEIS_ANWEISUNG', () => {
  const kontext = baueHinweisKontext()
  assert.deepEqual(kontext.volatiles, [HINWEIS_ANWEISUNG])
  assert.equal(kontext.docText, '')
  assert.equal(kontext.verstaendnis, null)
})

// ---- Rueckkopplung -----------------------------------------------------------
// Dieselbe Pflicht wie oben: Der Weg wird bis zum ECHTEN Request-Body gefahren. Eine
// Bilanz, die nur in kontext.volatiles landet, aber von baueAnfrage nie ausgegeben wuerde,
// waere genau der Fehler, gegen den diese Datei geschrieben ist.

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

test('die Rueckkopplung erreicht den echten Request-Body und steht direkt hinter der Anweisung', () => {
  const kontext = baueHinweisKontext({
    verstaendnis: VERSTAENDNIS,
    docText: 'Text',
    entscheidungen: [{ anker: 'a', kategorie: 'fakt' }],
    rueckkopplung: machRueckkopplung(),
  })
  assert.equal(kontext.volatiles[0], HINWEIS_ANWEISUNG)
  assert.ok(kontext.volatiles[1].includes('struktur: 18 von 20'), kontext.volatiles[1])

  const bodyJson = JSON.stringify(baueAnfrage('hinweise', kontext).body)
  assert.ok(bodyJson.includes('struktur: 18 von 20'), 'die Bilanz fehlt im Request-Body')
  assert.ok(bodyJson.includes('NÜTZLICHKEIT'), 'der Unterschied Nuetzlichkeit/Richtigkeit fehlt im Request-Body')
})

test('die Rueckkopplung bleibt volatil: kein cache_control, Praefix unveraendert', () => {
  const kontext = baueHinweisKontext({ verstaendnis: VERSTAENDNIS, docText: 'Doktext', rueckkopplung: machRueckkopplung() })
  const content = baueAnfrage('hinweise', kontext).body.messages[0].content
  assert.ok(content[0].text.startsWith('<projektverstaendnis>'))
  assert.ok(content[1].text.startsWith('<dokument>'))
  for (const block of content.slice(2)) assert.ok(!('cache_control' in block), 'Volatiles duerfen kein cache_control tragen')
})

test('eine Bilanz ohne verwertbare Zahlen erzeugt KEINEN leeren Block', () => {
  const leer = bilanziereRueckmeldung({ dokumente: [{ findings: [{ id: 'x', kiKategorie: 'struktur', status: 'dismissed' }], decisions: [] }] })
  const kontext = baueHinweisKontext({ verstaendnis: null, docText: 'Text', rueckkopplung: leer })
  assert.deepEqual(kontext.volatiles, [HINWEIS_ANWEISUNG])
  assert.deepEqual(baueHinweisKontext({ docText: 'Text', rueckkopplung: null }).volatiles, [HINWEIS_ANWEISUNG])
})

test('eine rohe oder nur vorgeschlagene Bilanz beeinflusst den Auftrag nicht', () => {
  const freigegeben = machRueckkopplung()
  const roh = freigegeben.bilanz
  const pending = { ...freigegeben, status: 'pending' }
  assert.deepEqual(baueHinweisKontext({ docText: 'Text', rueckkopplung: roh }).volatiles, [HINWEIS_ANWEISUNG])
  assert.deepEqual(baueHinweisKontext({ docText: 'Text', rueckkopplung: pending }).volatiles, [HINWEIS_ANWEISUNG])
})
