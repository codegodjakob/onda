import test from 'node:test'
import assert from 'node:assert/strict'
import { aktuellerAgentStatus, beiAgentStatus, setzeAgentStatus, statuszeileFuer } from '../src/agent-status.mjs'

test('statuszeileFuer: offline -> beruhigender Satz + Einstellungen-Knopf, keine Aura', () => {
  const zeile = statuszeileFuer({ zustand: 'offline' })
  assert.equal(zeile.text, 'Agent ist offline — dein Text ist davon unberührt.')
  assert.equal(zeile.knopf, 'einstellungen')
  assert.equal(zeile.aura, false)
})

test('statuszeileFuer: laufender Task -> Aura + Text (Standard und eigener Text)', () => {
  assert.deepEqual(statuszeileFuer({ zustand: 'laeuft' }), { text: 'Agent liest …', knopf: null, aura: true })
  assert.equal(statuszeileFuer({ zustand: 'laeuft', text: 'Agent antwortet …' }).text, 'Agent antwortet …')
})

test('statuszeileFuer: ratenlimit/ueberlastet -> ruhiger Hinweis mit Wiederholungsvermerk', () => {
  const rate = statuszeileFuer({ zustand: 'fehler', fehlerTyp: 'ratenlimit' })
  assert.match(rate.text, /automatisch/)
  assert.equal(rate.knopf, null)
  assert.equal(rate.aura, false)
  const last = statuszeileFuer({ zustand: 'fehler', fehlerTyp: 'ueberlastet' })
  assert.match(last.text, /automatisch/)
  assert.equal(last.aura, false)
})

test('statuszeileFuer: fehler kein-schluessel/offline -> Offline-Zeile mit Knopf', () => {
  assert.equal(statuszeileFuer({ zustand: 'fehler', fehlerTyp: 'offline' }).knopf, 'einstellungen')
  assert.equal(statuszeileFuer({ zustand: 'fehler', fehlerTyp: 'kein-schluessel' }).knopf, 'einstellungen')
})

test('statuszeileFuer: leise Fehler (schema/abgelehnt/abgebrochen) -> keine Zeile', () => {
  assert.equal(statuszeileFuer({ zustand: 'fehler', fehlerTyp: 'schema' }), null)
  assert.equal(statuszeileFuer({ zustand: 'fehler', fehlerTyp: 'abgelehnt' }), null)
  assert.equal(statuszeileFuer({ zustand: 'fehler', fehlerTyp: 'abgebrochen' }), null)
})

test('statuszeileFuer: bereit/unbekannt/null -> keine Zeile (Ruhe ist Normalzustand)', () => {
  assert.equal(statuszeileFuer({ zustand: 'bereit' }), null)
  assert.equal(statuszeileFuer({ zustand: 'unbekannt' }), null)
  assert.equal(statuszeileFuer(null), null)
})

test('setzeAgentStatus benachrichtigt Abonnenten; Abmelden stoppt weitere Rufe', () => {
  const gesehen = []
  const abmelden = beiAgentStatus(status => gesehen.push(status.zustand))
  setzeAgentStatus({ zustand: 'laeuft', text: 'Agent liest …' })
  assert.deepEqual(gesehen, ['laeuft'])
  assert.equal(aktuellerAgentStatus().zustand, 'laeuft')
  abmelden()
  setzeAgentStatus({ zustand: 'bereit' })
  assert.deepEqual(gesehen, ['laeuft'])
  assert.equal(aktuellerAgentStatus().zustand, 'bereit')
})
