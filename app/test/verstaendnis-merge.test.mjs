import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ensureProjectUnderstanding,
  istEntwurfVersucht,
  istInterviewOffen,
  markiereEntwurfVersucht,
  markiereGeschuetzt,
  loeseSchutz,
  mergeVerstaendnis,
} from '../src/reasoning-model.mjs'

function basisVerstaendnis() {
  return {
    task: 'Essay über Calm Technology',
    audience: ['Designerinnen'],
    desiredEffect: 'Prinzip verstehen',
    evidenceStandard: 'Primärquellen',
    protectedIntentions: ['Schlussformel erhalten'],
    openQuestions: ['Wissenschaftlich oder essayistisch?'],
    geschuetzt: [],
    updatedAt: 100,
  }
}

test('mergeVerstaendnis übernimmt nur nicht-leere Felder', () => {
  const alt = basisVerstaendnis()
  const neu = { task: 'Reportage über Stadtplanung', desiredEffect: '', evidenceStandard: '   ', antwortText: 'Verstanden.' }

  const ergebnis = mergeVerstaendnis(alt, neu, [], 200)

  assert.equal(ergebnis.task, 'Reportage über Stadtplanung')
  assert.equal(ergebnis.desiredEffect, 'Prinzip verstehen')
  assert.equal(ergebnis.evidenceStandard, 'Primärquellen')
  assert.equal(Object.hasOwn(ergebnis, 'antwortText'), false)
})

test('mergeVerstaendnis ist pur — das alte Objekt bleibt unverändert', () => {
  const alt = basisVerstaendnis()
  const schnappschuss = JSON.parse(JSON.stringify(alt))

  mergeVerstaendnis(alt, { task: 'Etwas ganz anderes' }, [], 200)

  assert.deepEqual(alt, schnappschuss)
})

test('mergeVerstaendnis splittet audience aus dem Schema-String in die Listen-Form', () => {
  const ergebnis = mergeVerstaendnis(basisVerstaendnis(), { audience: 'Studierende, Lehrende ' }, [], 200)
  assert.deepEqual(ergebnis.audience, ['Studierende', 'Lehrende'])
})

test('mergeVerstaendnis lässt audience bei leerem String unangetastet', () => {
  const ergebnis = mergeVerstaendnis(basisVerstaendnis(), { audience: '  ' }, [], 200)
  assert.deepEqual(ergebnis.audience, ['Designerinnen'])
})

test('mergeVerstaendnis überschreibt geschützte Felder nie', () => {
  const ergebnis = mergeVerstaendnis(
    basisVerstaendnis(),
    { task: 'Umgeschrieben', audience: 'Alle', desiredEffect: 'Anders' },
    ['task', 'audience'],
    200,
  )
  assert.equal(ergebnis.task, 'Essay über Calm Technology')
  assert.deepEqual(ergebnis.audience, ['Designerinnen'])
  assert.equal(ergebnis.desiredEffect, 'Anders')
})

test('mergeVerstaendnis schützt ALLE sechs Felder wenn markiert', () => {
  const alt = basisVerstaendnis()
  const neu = {
    task: 'Neu',
    audience: 'Neue',
    desiredEffect: 'Neue Wirkung',
    evidenceStandard: 'Neue Evidenz',
    protectedIntentions: ['Neue Intention'],
    openQuestions: ['Neue Frage'],
  }
  const ergebnis = mergeVerstaendnis(
    alt,
    neu,
    ['task', 'audience', 'desiredEffect', 'evidenceStandard', 'protectedIntentions', 'openQuestions'],
    200,
  )
  assert.equal(ergebnis.task, alt.task)
  assert.deepEqual(ergebnis.audience, alt.audience)
  assert.equal(ergebnis.desiredEffect, alt.desiredEffect)
  assert.equal(ergebnis.evidenceStandard, alt.evidenceStandard)
  assert.deepEqual(ergebnis.protectedIntentions, alt.protectedIntentions)
  assert.deepEqual(ergebnis.openQuestions, alt.openQuestions)
})

test('mergeVerstaendnis akzeptiert geschuetzt auch als Set', () => {
  const gesperrtSet = new Set(['task', 'audience'])
  const ergebnis = mergeVerstaendnis(
    basisVerstaendnis(),
    { task: 'Neu', audience: 'Alle', desiredEffect: 'Neu' },
    gesperrtSet,
    200,
  )
  assert.equal(ergebnis.task, 'Essay über Calm Technology')
  assert.deepEqual(ergebnis.audience, ['Designerinnen'])
  assert.equal(ergebnis.desiredEffect, 'Neu')
})

test('mergeVerstaendnis wird fail-closed bei kaputtem geschuetzt-Wert (String)', () => {
  const ergebnis = mergeVerstaendnis(
    basisVerstaendnis(),
    { task: 'Neu', desiredEffect: 'Neu' },
    'kaputt',
    200,
  )
  // Bei kaputtem Wert: alle Felder geschützt, nichts übernommen
  assert.equal(ergebnis.task, 'Essay über Calm Technology')
  assert.equal(ergebnis.desiredEffect, 'Prinzip verstehen')
  assert.deepEqual(ergebnis.audience, ['Designerinnen'])
})

test('mergeVerstaendnis wird fail-closed bei kaputtem geschuetzt-Wert (Objekt)', () => {
  const ergebnis = mergeVerstaendnis(
    basisVerstaendnis(),
    { task: 'Neu', desiredEffect: 'Neu' },
    { task: true },
    200,
  )
  // Bei kaputtem Wert: alle Felder geschützt, nichts übernommen
  assert.equal(ergebnis.task, 'Essay über Calm Technology')
  assert.equal(ergebnis.desiredEffect, 'Prinzip verstehen')
})

test('mergeVerstaendnis mit null/undefined geschuetzt verhält sich wie nichts geschützt', () => {
  const ergebnisNull = mergeVerstaendnis(
    basisVerstaendnis(),
    { task: 'Neu', desiredEffect: 'Neu' },
    null,
    200,
  )
  const ergebnisUndefined = mergeVerstaendnis(
    basisVerstaendnis(),
    { task: 'Neu', desiredEffect: 'Neu' },
    undefined,
    200,
  )
  assert.equal(ergebnisNull.task, 'Neu')
  assert.equal(ergebnisNull.desiredEffect, 'Neu')
  assert.equal(ergebnisUndefined.task, 'Neu')
  assert.equal(ergebnisUndefined.desiredEffect, 'Neu')
})

test('mergeVerstaendnis vereinigt protectedIntentions ohne Duplikate', () => {
  const ergebnis = mergeVerstaendnis(
    basisVerstaendnis(),
    { protectedIntentions: ['Schlussformel erhalten', 'Ich-Perspektive behalten'] },
    [],
    200,
  )
  assert.deepEqual(ergebnis.protectedIntentions, ['Schlussformel erhalten', 'Ich-Perspektive behalten'])
})

test('mergeVerstaendnis ersetzt openQuestions auch durch eine leere Liste', () => {
  const ergebnis = mergeVerstaendnis(basisVerstaendnis(), { openQuestions: [] }, [], 200)
  assert.deepEqual(ergebnis.openQuestions, [])
})

test('mergeVerstaendnis behält openQuestions, wenn das Feld in neu fehlt', () => {
  const ergebnis = mergeVerstaendnis(basisVerstaendnis(), { task: 'Neu' }, [], 200)
  assert.deepEqual(ergebnis.openQuestions, ['Wissenschaftlich oder essayistisch?'])
})

test('mergeVerstaendnis setzt updatedAt nur bei tatsächlicher Änderung', () => {
  const unveraendert = mergeVerstaendnis(basisVerstaendnis(), { task: '' }, [], 200)
  const veraendert = mergeVerstaendnis(basisVerstaendnis(), { task: 'Neu' }, [], 200)
  assert.equal(unveraendert.updatedAt, 100)
  assert.equal(veraendert.updatedAt, 200)
})

test('istInterviewOffen erkennt fehlende Kernfelder', () => {
  assert.equal(istInterviewOffen(null), true)
  assert.equal(istInterviewOffen({ task: 'Essay', audience: [], desiredEffect: 'Wirken' }), true)
  assert.equal(istInterviewOffen({ task: 'Essay', audience: ['Leser'], desiredEffect: '' }), true)
  assert.equal(istInterviewOffen({ task: 'Essay', audience: ['Leser'], desiredEffect: 'Wirken' }), false)
})

test('markiereGeschuetzt setzt den Merker einmalig und ignoriert unbekannte Felder', () => {
  const u = { geschuetzt: [] }
  markiereGeschuetzt(u, 'task')
  markiereGeschuetzt(u, 'task')
  markiereGeschuetzt(u, 'gibtEsNicht')
  assert.deepEqual(u.geschuetzt, ['task'])
})

test('loeseSchutz nimmt den Merker zurueck und ist gutmuetig', () => {
  const u = { geschuetzt: ['task', 'audience'] }
  loeseSchutz(u, 'task')
  assert.deepEqual(u.geschuetzt, ['audience'], 'nur das genannte Feld wird frei')
  loeseSchutz(u, 'task')
  assert.deepEqual(u.geschuetzt, ['audience'], 'zweimal loesen aendert nichts')
  loeseSchutz(u, 'gibtEsNicht')
  assert.deepEqual(u.geschuetzt, ['audience'], 'unbekannte Felder bleiben wirkungslos')
  assert.equal(loeseSchutz(null, 'task'), null, 'kein Objekt: unveraendert zurueck')
})

test('nach loeseSchutz darf die KI das Feld wieder schreiben', () => {
  const alt = { task: 'Meine eigene Formulierung', audience: ['Leser'], desiredEffect: 'Wirken' }
  const neu = { task: 'Vorschlag der KI', audience: ['Leser'], desiredEffect: 'Wirken' }

  const gesperrt = mergeVerstaendnis(alt, neu, ['task'])
  assert.equal(gesperrt.task, 'Meine eigene Formulierung', 'solange geschuetzt: Korrektur haelt')

  const u = { geschuetzt: ['task'] }
  loeseSchutz(u, 'task')
  const frei = mergeVerstaendnis(alt, neu, u.geschuetzt)
  assert.equal(frei.task, 'Vorschlag der KI', 'nach dem Loesen greift die KI wieder')
})

test('ensureProjectUnderstanding normalisiert geschuetzt tolerant', () => {
  const projekt = { understanding: { task: 'Essay', geschuetzt: 'kaputt' } }
  const u = ensureProjectUnderstanding(projekt)
  assert.deepEqual(u.geschuetzt, [])

  const projekt2 = { understanding: { geschuetzt: [' task ', ''] } }
  assert.deepEqual(ensureProjectUnderstanding(projekt2).geschuetzt, ['task'])
})

// ---------- Projektweite Sperre für den bezahlten Entwurf-Lauf (Fix-Runde 1, Finding 2) ----------

test('ensureProjectUnderstanding ergänzt entwurfVersuchtAm additiv als null (alte Projekte ohne Feld)', () => {
  const projekt = { understanding: { task: 'Essay' } }
  const u = ensureProjectUnderstanding(projekt)
  assert.equal(u.entwurfVersuchtAm, null)
})

test('istEntwurfVersucht erkennt fehlenden oder leeren Merker als „noch nicht versucht"', () => {
  assert.equal(istEntwurfVersucht(null), false)
  assert.equal(istEntwurfVersucht(undefined), false)
  assert.equal(istEntwurfVersucht({}), false)
  assert.equal(istEntwurfVersucht({ entwurfVersuchtAm: null }), false)
})

test('markiereEntwurfVersucht setzt den Zeitstempel, istEntwurfVersucht erkennt ihn danach', () => {
  const u = {}
  markiereEntwurfVersucht(u, 12345)
  assert.equal(u.entwurfVersuchtAm, 12345)
  assert.equal(istEntwurfVersucht(u), true)
})

test('markiereEntwurfVersucht ist defensiv bei kaputter Eingabe', () => {
  assert.equal(markiereEntwurfVersucht(null), null)
  assert.equal(markiereEntwurfVersucht('kaputt'), 'kaputt')
})

test('mergeVerstaendnis lässt entwurfVersuchtAm unangetastet — kein Verständnisfeld, wird nie überschrieben oder gelöscht', () => {
  const alt = { ...basisVerstaendnis(), entwurfVersuchtAm: 555 }
  const neu = { task: 'Neu', entwurfVersuchtAm: 999999 } // eine KI-Antwort enthält dieses Feld nie, aber sicherheitshalber geprüft
  const ergebnis = mergeVerstaendnis(alt, neu, [], 200)
  assert.equal(ergebnis.entwurfVersuchtAm, 555)
})

test('istInterviewOffen bleibt von entwurfVersuchtAm unbeeinflusst — Merker ist kein Kernfeld', () => {
  // Versucht, aber Kernfelder weiterhin leer: Interview bleibt offen.
  assert.equal(istInterviewOffen({ entwurfVersuchtAm: Date.now() }), true)
  // Versucht UND Kernfelder vollständig: Interview gilt als geschlossen — wie ohne Merker.
  assert.equal(
    istInterviewOffen({ task: 'Essay', audience: ['Leser'], desiredEffect: 'Wirken', entwurfVersuchtAm: Date.now() }),
    false,
  )
})
