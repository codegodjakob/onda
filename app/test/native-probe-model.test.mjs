import test from 'node:test'
import assert from 'node:assert/strict'

import { pruefeNativeBruecken } from '../src/native-probe-model.mjs'
import { entsprichtJsonSchema, runLiveNativeProbe } from '../src/live-native-probe.mjs'
import { HINWEISE_SCHEMA } from '../src/agent-tasks.mjs'

test('die lokale Live-Prüfung validiert das vollständige geschlossene Antwortschema', () => {
  const hinweis = {
    kategorie: 'sprache',
    anmerkungsart: 'rechtschreibung',
    anker: 'Ergebniss',
    beobachtung: 'Das Wort ist falsch geschrieben.',
    relevanz: 'Korrekte Schreibweise erleichtert das Lesen.',
    folge: 'Der Fehler lenkt vom Inhalt ab.',
    muster: 'Substantive mit dem Suffix -nis enden im Singular auf ein s.',
    vorschlagsart: 'formulierung',
    stilmittelId: null,
    vorschlag: { bisher: 'Ergebniss', neu: 'Ergebnis' },
    istGrundursache: false,
    integritaet: true,
    gewinn: 'schaerft',
    verschiebung: null,
  }

  assert.equal(entsprichtJsonSchema({ hinweise: [hinweis] }, HINWEISE_SCHEMA), true)
  assert.equal(entsprichtJsonSchema({ hinweise: [{ ...hinweis, unerwartet: true }] }, HINWEISE_SCHEMA), false)
  assert.equal(entsprichtJsonSchema({ hinweise: [{ ...hinweis, integritaet: 'ja' }] }, HINWEISE_SCHEMA), false)
  assert.equal(entsprichtJsonSchema({ hinweise: [{ ...hinweis, vorschlag: { bisher: 'a', neu: 3 } }] }, HINWEISE_SCHEMA), false)
})

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

test('die echte Probe sendet genau eine kurze Hinweise-Anfrage und gibt nur sichere Metadaten aus', async () => {
  const anfragen = []
  const ergebnis = await runLiveNativeProbe({
    hatSchluessel: async () => true,
    senden: async anfrage => {
      anfragen.push(anfrage)
      return {
        text: JSON.stringify({ hinweise: [{
          kategorie: 'sprache',
          anmerkungsart: 'rechtschreibung',
          anker: 'Ergebniss',
          beobachtung: 'Das Wort ist falsch geschrieben.',
          relevanz: 'Korrekte Schreibweise erleichtert das Lesen.',
          folge: 'Der Fehler lenkt vom Inhalt ab.',
          muster: 'Substantive mit dem Suffix -nis enden im Singular auf ein s.',
          vorschlagsart: 'formulierung',
          stilmittelId: null,
          vorschlag: { bisher: 'Ergebniss', neu: 'Ergebnis' },
          istGrundursache: false,
          integritaet: true,
          gewinn: 'schaerft',
          verschiebung: null,
        }] }),
        usage: { input_tokens: 41, output_tokens: 67 },
        stopReason: 'end_turn',
      }
    },
    jetzt: (() => { const werte = [1000, 1123]; return () => werte.shift() })(),
  })

  assert.equal(anfragen.length, 1)
  assert.equal(anfragen[0].body.model, 'claude-opus-5')
  assert.equal(anfragen[0].stream, false)
  assert.deepEqual(ergebnis, {
    passed: true,
    keyPresent: true,
    requestCount: 1,
    task: 'hinweise',
    model: 'claude-opus-5',
    durationMs: 123,
    usage: {
      inputTokens: 41,
      outputTokens: 67,
      cacheReadInputTokens: 0,
      cacheCreationInputTokens: 0,
    },
    annotationKind: 'rechtschreibung',
    schemaValid: true,
    errorType: null,
  })
  assert.equal(JSON.stringify(ergebnis).includes('Ergebniss'), false)
  assert.equal(JSON.stringify(ergebnis).includes('Ergebnis'), false)
})

test('die echte Probe beendet sich ohne Netzaufruf, wenn kein Schlüssel vorhanden ist', async () => {
  let aufrufe = 0
  const ergebnis = await runLiveNativeProbe({
    hatSchluessel: async () => false,
    senden: async () => { aufrufe += 1 },
  })

  assert.equal(aufrufe, 0)
  assert.deepEqual(ergebnis, {
    passed: false,
    keyPresent: false,
    requestCount: 0,
    task: 'hinweise',
    model: 'claude-opus-5',
    durationMs: 0,
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadInputTokens: 0,
      cacheCreationInputTokens: 0,
    },
    annotationKind: null,
    schemaValid: false,
    errorType: 'kein-schluessel',
  })
})

test('die echte Probe wiederholt einen fehlgeschlagenen Aufruf nicht und redigiert die Fehlerdetails strukturell weg', async () => {
  let aufrufe = 0
  const ergebnis = await runLiveNativeProbe({
    hatSchluessel: async () => true,
    senden: async () => {
      aufrufe += 1
      throw { typ: 'offline', nachricht: 'Authorization: Bearer sk-ant-test' }
    },
    jetzt: (() => { const werte = [2000, 2050]; return () => werte.shift() })(),
  })

  assert.equal(aufrufe, 1)
  assert.equal(ergebnis.requestCount, 1)
  assert.equal(ergebnis.errorType, 'offline')
  assert.equal(JSON.stringify(ergebnis).includes('sk-ant-test'), false)
})
