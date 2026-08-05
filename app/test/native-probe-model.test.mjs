import test from 'node:test'
import assert from 'node:assert/strict'

import { pruefeNativeBruecken } from '../src/native-probe-model.mjs'

test('die native Probe wartet auf langsame echte Rueckrufe statt feste Kurzfristen zu erraten', async () => {
  const ergebnis = await pruefeNativeBruecken({
    bildSpeichern: () => new Promise(resolve => setTimeout(() => resolve('aiwt-img://img/probe.png'), 35)),
    zustandSpeichern: () => new Promise(resolve => setTimeout(() => resolve(true), 25)),
    timeoutMs: 100,
  })

  assert.deepEqual(ergebnis, { imgBridge: true, ackOk: true })
})

test('Bild- und Speicherkanal starten parallel, damit beide in die native Gesamtfrist passen', async () => {
  const gestartet = []
  let bildFertig
  let zustandFertig
  const ergebnisPromise = pruefeNativeBruecken({
    bildSpeichern: () => {
      gestartet.push('bild')
      return new Promise(resolve => { bildFertig = resolve })
    },
    zustandSpeichern: () => {
      gestartet.push('zustand')
      return new Promise(resolve => { zustandFertig = resolve })
    },
    timeoutMs: 100,
  })

  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(gestartet.sort(), ['bild', 'zustand'])
  bildFertig('aiwt-img://img/probe.png')
  zustandFertig(true)
  assert.deepEqual(await ergebnisPromise, { imgBridge: true, ackOk: true })
})

test('die native Probe endet bei fehlendem Rueckruf begrenzt und meldet das einzelne Gate falsch', async () => {
  const ergebnis = await pruefeNativeBruecken({
    bildSpeichern: () => new Promise(() => {}),
    zustandSpeichern: async () => true,
    timeoutMs: 15,
  })

  assert.deepEqual(ergebnis, { imgBridge: false, ackOk: true })
})

test('die native Probe unterscheidet eine falsche Bild-URL und eine fehlgeschlagene Speicherung', async () => {
  const ergebnis = await pruefeNativeBruecken({
    bildSpeichern: async () => 'file:///tmp/probe.png',
    zustandSpeichern: async () => false,
    timeoutMs: 100,
  })

  assert.deepEqual(ergebnis, { imgBridge: false, ackOk: false })
})
