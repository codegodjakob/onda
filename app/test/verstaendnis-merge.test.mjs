import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ensureProjectUnderstanding,
  istInterviewOffen,
  markiereGeschuetzt,
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

test('ensureProjectUnderstanding normalisiert geschuetzt tolerant', () => {
  const projekt = { understanding: { task: 'Essay', geschuetzt: 'kaputt' } }
  const u = ensureProjectUnderstanding(projekt)
  assert.deepEqual(u.geschuetzt, [])

  const projekt2 = { understanding: { geschuetzt: [' task ', ''] } }
  assert.deepEqual(ensureProjectUnderstanding(projekt2).geschuetzt, ['task'])
})
