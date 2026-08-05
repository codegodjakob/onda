import test from 'node:test'
import assert from 'node:assert/strict'

import {
  entscheideMusterverbindung,
  entscheideStimmenmerkmal,
  gruppiereVerbundeneMuster,
  projiziereAutorentwicklung,
  schlageMusterverbindungVor,
  schlageStimmenmerkmalVor,
  speichereStimmenmerkmal,
  ueberholeStimmenmerkmal,
} from '../src/autorentwicklung-model.mjs'
import { erkanntesListe, schreibeErkanntes } from '../src/erkanntes-model.mjs'
import { buildStyleMemoryContext } from '../src/memory-retrieval.mjs'
import { ensureMemoryStore } from '../src/memory-model.mjs'

function erkanntes() {
  let store = ensureMemoryStore(null)
  store = schreibeErkanntes(store, { satz: 'Ein Beleg gehört an die Behauptung.', dimension: 'beleg', dokumentId: 'd-1', projektId: 'p-1', beleg: 'Anker eins', at: 1 }).store
  store = schreibeErkanntes(store, { satz: 'Ein Beleg gehört an die Behauptung.', dimension: 'beleg', dokumentId: 'd-2', projektId: 'p-2', beleg: 'Anker zwei', at: 2 }).store
  store = schreibeErkanntes(store, { satz: 'Ein Gegenargument schärft die These.', dimension: 'logik', dokumentId: 'd-3', projektId: 'p-1', beleg: 'Anker drei', at: 3 }).store
  return store
}

test('Autorenentwicklung bewahrt Muster, Dimensionen und jede einzelne Herkunft', () => {
  const entwicklung = projiziereAutorentwicklung(erkanntes())
  assert.equal(entwicklung.patterns.length, 2)
  const beleg = entwicklung.patterns.find(pattern => pattern.dimensionen.includes('beleg'))
  assert.equal(beleg.occurrences.length, 2)
  assert.deepEqual(beleg.occurrences.map(item => item.documentId), ['d-1', 'd-2'])
  assert.deepEqual(beleg.occurrences.map(item => item.projectId), ['p-1', 'p-2'])
  assert.deepEqual(beleg.occurrences.map(item => item.anchor), ['Anker eins', 'Anker zwei'])
  assert.ok(entwicklung.masterySignals.some(signal => signal.kind === 'recurrence' && signal.patternKey === beleg.key))
})

test('ähnliche Muster bleiben getrennt, bis die Person eine Verbindung ausdrücklich bestätigt', () => {
  const patterns = projiziereAutorentwicklung(erkanntes()).patterns
  const proposal = schlageMusterverbindungVor({
    patternKeys: patterns.map(pattern => pattern.key),
    label: 'Argumentative Belastbarkeit',
    reason: 'Beide Muster prüfen, was eine These trägt.',
    at: 10,
  })
  assert.equal(proposal.status, 'pending')
  assert.equal(gruppiereVerbundeneMuster(patterns, [proposal]).length, 2)
  assert.throws(() => entscheideMusterverbindung(proposal, { approved: true, actor: 'agent', at: 11 }), /user|Person|Zustimmung/i)
  const approved = entscheideMusterverbindung(proposal, { approved: true, actor: 'user', at: 12 })
  const gruppen = gruppiereVerbundeneMuster(patterns, [approved])
  assert.equal(gruppen.length, 1)
  assert.equal(gruppen[0].label, 'Argumentative Belastbarkeit')
  assert.equal(gruppen[0].patterns.length, 2)
})

test('ein Stimmenmerkmal braucht zwei verschiedene Nutzeranker und bleibt zunächst wirkungslos', () => {
  assert.throws(() => schlageStimmenmerkmalVor({
    trait: 'Beginnt gern mit einem konkreten Bild.',
    anchors: [{ projectId: 'p-1', textId: 'd-1', exact: 'Am Kai', actor: 'user' }],
    at: 10,
  }), /zwei/i)
  assert.throws(() => schlageStimmenmerkmalVor({
    trait: 'Beginnt gern mit einem konkreten Bild.',
    anchors: [
      { projectId: 'p-1', textId: 'd-1', exact: 'Am Kai', actor: 'agent' },
      { projectId: 'p-2', textId: 'd-2', exact: 'Im Regen', actor: 'user' },
    ],
    at: 10,
  }), /Nutzer|user/i)

  const proposal = schlageStimmenmerkmalVor({
    trait: 'Beginnt gern mit einem konkreten Bild.',
    anchors: [
      { projectId: 'p-1', textId: 'd-1', exact: 'Am Kai', actor: 'user' },
      { projectId: 'p-2', textId: 'd-2', exact: 'Im Regen', actor: 'user' },
    ],
    at: 10,
  })
  assert.equal(proposal.status, 'pending')
  assert.throws(() => speichereStimmenmerkmal(ensureMemoryStore(null), proposal), /freigegeben/i)
})

test('nur die Person kann ein Stimmenmerkmal freigeben; danach erreicht es den Stilkontext reversibel', () => {
  const proposal = schlageStimmenmerkmalVor({
    trait: 'Beginnt gern mit einem konkreten Bild.',
    anchors: [
      { projectId: 'p-1', textId: 'd-1', exact: 'Am Kai', actor: 'user' },
      { projectId: 'p-2', textId: 'd-2', exact: 'Im Regen', actor: 'user' },
    ],
    at: 10,
  })
  assert.throws(() => entscheideStimmenmerkmal(proposal, { approved: true, actor: 'agent', at: 11 }), /user|Person|Zustimmung/i)
  const approved = entscheideStimmenmerkmal(proposal, { approved: true, actor: 'user', at: 12 })
  const store = speichereStimmenmerkmal(ensureMemoryStore(null), approved)
  assert.deepEqual(buildStyleMemoryContext({ store, projectId: 'p-9' }).personalPreferences, [proposal.trait])
  const entry = store.entries[0]
  assert.equal(entry.provenance.actor, 'user')
  assert.equal(entry.deletionRule, 'manual')
  assert.equal(entry.scope.allProjects, true)
  const danach = ueberholeStimmenmerkmal(store, entry.id, 13)
  assert.deepEqual(buildStyleMemoryContext({ store: danach, projectId: 'p-9' }).personalPreferences, [])
  assert.equal(danach.entries[0].status, 'superseded')

  const erneutVorgeschlagen = schlageStimmenmerkmalVor({
    trait: proposal.trait,
    anchors: proposal.anchors,
    at: 14,
  })
  const erneutFreigegeben = entscheideStimmenmerkmal(erneutVorgeschlagen, {
    approved: true, actor: 'user', at: 15,
  })
  const wiederAktiv = speichereStimmenmerkmal(danach, erneutFreigegeben)
  assert.deepEqual(buildStyleMemoryContext({ store: wiederAktiv, projectId: 'p-9' }).personalPreferences, [proposal.trait])
  assert.equal(wiederAktiv.entries.filter(eintrag => eintrag.type === 'voice').length, 2,
    'erneute Zustimmung muss die alte überholte Herkunft bewahren und einen neuen Eintrag anlegen')
})

test('Kompetenzsignale entstehen nur aus beobachtbaren Ereignissen, nie aus Ablehnungen', () => {
  const store = erkanntes()
  store.events.push(
    { id: 'self-1', kind: 'author-self-correction', entityId: 'd-1', snapshot: {}, provenance: { actor: 'user', action: 'edit' }, at: 5 },
    { id: 'own-1', kind: 'author-own-version', entityId: 'd-2', snapshot: {}, provenance: { actor: 'user', action: 'rewrite' }, at: 6 },
    { id: 'reject-1', kind: 'suggestion-rejected', entityId: 'f-1', snapshot: {}, provenance: { actor: 'user', action: 'reject' }, at: 7 },
  )
  const signalKinds = projiziereAutorentwicklung(store).masterySignals.map(signal => signal.kind)
  assert.ok(signalKinds.includes('self-correction'))
  assert.ok(signalKinds.includes('own-version'))
  assert.equal(signalKinds.includes('rejection'), false)
})

test('erkanntesListe macht die fachlichen Dimensionen sichtbar', () => {
  const liste = erkanntesListe(erkanntes())
  assert.ok(liste.some(gruppe => gruppe.dimensionen.includes('beleg')))
  assert.ok(liste.some(gruppe => gruppe.dimensionen.includes('logik')))
})
