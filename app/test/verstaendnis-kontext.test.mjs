import test from 'node:test'
import assert from 'node:assert/strict'
import { baueVerstaendnisKontext } from '../src/verstaendnis-kontext.mjs'
import { baueAnfrage } from '../src/agent-tasks.mjs'
import { INTERVIEW_REGELN } from '../src/agent-prompts.mjs'
import { ensureProjectUnderstanding, markiereGeschuetzt } from '../src/reasoning-model.mjs'

// Fix-Runde 1, Finding 1 (Critical): baueAnfrage konsumiert nur
// {verstaendnis, docText, volatiles, verlauf, anfrage}. Das alte Kontext-Objekt aus
// workspace.js ({modus, verstaendnis, geschuetzt, docText, nutzerText, interviewVerlauf})
// liess nutzerText, interviewVerlauf und INTERVIEW_REGELN stillschweigend unter den
// Tisch fallen — das Modell erfuhr nie, dass und was der Nutzer geantwortet hatte. Diese
// Tests fahren genau den Weg, den ein echter Lauf nimmt (baueVerstaendnisKontext ->
// baueAnfrage) und pruefen den tatsaechlichen Request-Body, nicht nur den Zwischenwert.

const VERSTAENDNIS = {
  task: 'Essay',
  audience: ['Studierende'],
  desiredEffect: 'Verstehen',
  evidenceStandard: '',
  protectedIntentions: [],
  openQuestions: [],
}

test('antwort: Nutzertext, INTERVIEW_REGELN und die aktuelle Antwort erreichen den Request-Body; letzte Message ist user', () => {
  const kontext = baueVerstaendnisKontext({
    modus: 'antwort',
    verstaendnis: VERSTAENDNIS,
    geschuetzt: [],
    docText: 'Ein Absatz Dokumenttext.',
    nutzerText: 'MARKANTER-NUTZERTEXT-7f3a',
    interviewVerlauf: [{ role: 'agent', text: 'Worum soll es in diesem Text gehen?' }],
  })
  const anfrage = baueAnfrage('verstaendnis', kontext)
  const bodyJson = JSON.stringify(anfrage.body)

  assert.ok(bodyJson.includes('MARKANTER-NUTZERTEXT-7f3a'), 'Nutzertext fehlt im Request-Body')
  assert.ok(bodyJson.includes(INTERVIEW_REGELN.slice(0, 40)), 'INTERVIEW_REGELN fehlen im Request-Body')

  const messages = anfrage.body.messages
  const letzte = messages[messages.length - 1]
  assert.equal(letzte.role, 'user', 'letzte Message muss user sein (kein Prefill)')
  assert.equal(letzte.content, 'MARKANTER-NUTZERTEXT-7f3a')
})

test('antwort: bisheriger Verlauf steht chronologisch (aeltere zuerst) vor der aktuellen Antwort, Rollen korrekt gemappt', () => {
  const kontext = baueVerstaendnisKontext({
    modus: 'antwort',
    verstaendnis: VERSTAENDNIS,
    geschuetzt: [],
    docText: '',
    nutzerText: 'Zweite Antwort',
    interviewVerlauf: [
      { role: 'agent', text: 'Eroeffnungsfrage' },
      { role: 'user', text: 'Erste Antwort' },
      { role: 'agent', text: 'Rueckfrage' },
    ],
  })
  const anfrage = baueAnfrage('verstaendnis', kontext)
  const messages = anfrage.body.messages
  // messages[0] = Block-Nachricht (verstaendnis+dokument+volatiles), danach der
  // Verlauf in Aufrufreihenfolge, zuletzt die aktuelle Antwort als eigene Message.
  assert.equal(messages.length, 5)
  assert.deepEqual(messages.slice(1).map(m => [m.role, m.content]), [
    ['assistant', 'Eroeffnungsfrage'],
    ['user', 'Erste Antwort'],
    ['assistant', 'Rueckfrage'],
    ['user', 'Zweite Antwort'],
  ])
})

test('entwurf: kein Nutzertext -> kein verlauf, keine anfrage; baueAnfrage wirft nicht; docText und INTERVIEW_REGELN vorhanden', () => {
  const kontext = baueVerstaendnisKontext({
    modus: 'entwurf',
    verstaendnis: VERSTAENDNIS,
    geschuetzt: [],
    docText: 'Text des Dokuments fuer den Entwurf.',
    nutzerText: '',
    interviewVerlauf: [],
  })
  assert.equal('verlauf' in kontext, false, 'entwurf darf kein verlauf mitgeben — baueAnfrage wirft sonst ohne anfrage')
  assert.equal('anfrage' in kontext, false)

  assert.doesNotThrow(() => baueAnfrage('verstaendnis', kontext))
  const anfrage = baueAnfrage('verstaendnis', kontext)
  const bodyJson = JSON.stringify(anfrage.body)
  assert.ok(bodyJson.includes('Text des Dokuments fuer den Entwurf.'))
  assert.ok(bodyJson.includes(INTERVIEW_REGELN.slice(0, 40)))
  assert.equal(anfrage.body.messages.length, 1)
  assert.equal(anfrage.body.messages[0].role, 'user')
})

test('geschuetzte Felder erscheinen als klare Anweisung im Body, nicht als stille Rohliste', () => {
  const kontext = baueVerstaendnisKontext({
    modus: 'antwort',
    verstaendnis: VERSTAENDNIS,
    geschuetzt: ['task', 'audience'],
    docText: '',
    nutzerText: 'Antwort',
    interviewVerlauf: [],
  })
  const anfrage = baueAnfrage('verstaendnis', kontext)
  const bodyJson = JSON.stringify(anfrage.body)
  assert.ok(bodyJson.includes('task') && bodyJson.includes('audience'))
  assert.ok(
    bodyJson.includes('nicht überschreiben') || bodyJson.includes('selbst gesetzt'),
    'Hinweistext zu geschuetzten Feldern fehlt',
  )
})

test('V-4: Modal-Korrektur -> markiereGeschuetzt -> baueVerstaendnisKontext -> baueAnfrage — genau das korrigierte Feld erreicht den Request-Body als bindende Anweisung, kein weiteres', () => {
  // Simuliert den tatsaechlichen Weg aus workspace.js: openProjectUnderstandingModal
  // ruft bei jeder Nutzer-Korrektur markiereGeschuetzt(u, feld) auf (V-4); die naechste
  // verstaendnisEingabe reicht u.geschuetzt unveraendert an baueVerstaendnisKontext weiter
  // (geschuetzt: [...(u.geschuetzt || [])]). Ein gestubbter fetch waere hier keine
  // Verifikation (V-3-Lehre) — dieser Test geht bis in den tatsaechlichen Request-Body,
  // ausgehend von echtem markiereGeschuetzt-Output statt einem hart codierten Array.
  const projekt = { understanding: {} }
  const u = ensureProjectUnderstanding(projekt)
  markiereGeschuetzt(u, 'task') // Nutzer korrigiert nur "Aufgabe" im PV-Modal

  const kontext = baueVerstaendnisKontext({
    modus: 'antwort',
    verstaendnis: VERSTAENDNIS,
    geschuetzt: [...u.geschuetzt],
    docText: '',
    nutzerText: 'Antwort',
    interviewVerlauf: [],
  })
  const anfrage = baueAnfrage('verstaendnis', kontext)
  const content = anfrage.body.messages[0].content
  const hinweisBlock = content.find(block => block.text.includes('selbst gesetzt'))

  assert.ok(hinweisBlock, 'Bindend-Hinweis fehlt im Request-Body')
  assert.ok(hinweisBlock.text.includes('task'), 'per markiereGeschuetzt gesetztes Feld "task" fehlt im Hinweis')
  assert.ok(!hinweisBlock.text.includes('audience'), 'nicht korrigierte Felder duerfen nicht als bindend erscheinen')
})

test('ohne geschuetzte Felder kein leerer dritter Hinweis-Block', () => {
  const kontext = baueVerstaendnisKontext({
    modus: 'antwort',
    verstaendnis: VERSTAENDNIS,
    geschuetzt: [],
    docText: '',
    nutzerText: 'Antwort',
    interviewVerlauf: [],
  })
  assert.equal(kontext.volatiles.length, 2, 'nur INTERVIEW_REGELN + Modus-Hinweis, kein leerer Geschuetzt-Block')
})

test('Cache-Praefix bleibt stabil: verstaendnis+dokument zuerst mit cache_control, volatiles danach ohne', () => {
  const kontext = baueVerstaendnisKontext({
    modus: 'antwort',
    verstaendnis: VERSTAENDNIS,
    geschuetzt: [],
    docText: 'Doktext',
    nutzerText: 'Antwort',
    interviewVerlauf: [],
  })
  const anfrage = baueAnfrage('verstaendnis', kontext)
  const content = anfrage.body.messages[0].content
  assert.ok(content[0].text.startsWith('<projektverstaendnis>'))
  assert.deepEqual(content[0].cache_control, { type: 'ephemeral' })
  assert.ok(content[1].text.startsWith('<dokument>'))
  assert.deepEqual(content[1].cache_control, { type: 'ephemeral' })
  for (const block of content.slice(2)) assert.ok(!('cache_control' in block), 'volatiles duerfen kein cache_control tragen')
})

test('baueVerstaendnisKontext ist pur: zweimal mit gleichem Input ergibt byte-gleiches JSON', () => {
  const eingabe = {
    modus: 'antwort',
    verstaendnis: VERSTAENDNIS,
    geschuetzt: ['task'],
    docText: 'Text',
    nutzerText: 'Antwort',
    interviewVerlauf: [{ role: 'agent', text: 'Frage' }],
  }
  const a = JSON.stringify(baueVerstaendnisKontext(eingabe))
  const b = JSON.stringify(baueVerstaendnisKontext(eingabe))
  assert.equal(a, b)
})
