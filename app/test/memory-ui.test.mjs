import test from 'node:test'
import assert from 'node:assert/strict'

import { createMemoryUi } from '../src/memory-ui.mjs'
import { createMemoryEntry, ensureMemoryStore } from '../src/memory-model.mjs'
import { schreibeErkanntes } from '../src/erkanntes-model.mjs'
import { createTransferRequest, decideMemoryTransfer } from '../src/memory-retrieval.mjs'

// memory-ui bekommt seinen Knoten-Bauer von aussen gereicht (in der App aus
// workspace.js). Hier genuegt ein Doppelgaenger, der anhaengen und Text ablesen kann --
// so laeuft die echte Zeichenroutine ohne Browser.
class Knoten {
  constructor(tagName, className = '', text = undefined) {
    this.tagName = tagName
    this.className = className
    this.text = text
    this.kinder = []
    this.attribute = {}
  }

  append(...kinder) { this.kinder.push(...kinder) }
  prepend(...kinder) { this.kinder.unshift(...kinder) }
  replaceChildren(...kinder) { this.kinder = [...kinder] }
  addEventListener() {}
  setAttribute(name, wert) { this.attribute[name] = wert }
  focus() {}
  remove() {}

  get inhalt() {
    return [this.text ?? '', ...this.kinder.map(kind => kind.inhalt)]
      .filter(teil => teil !== '')
      .join(' ')
  }
}

const createNode = (tagName, className, text) => new Knoten(tagName, className, text)

const PROJEKT = { id: 'p-ziel', name: 'Ziel', memory: { enabled: true } }

// Zeichnet den Dialog "Projektgedaechtnis" fuer ein Projekt und gibt den Wurzelknoten
// zurueck. Genau ein Projekt im Zustand: dann faellt der Freigabe-Vorschlag am Ende
// des Dialogs weg, der als einziger Teil ein echtes document braeuchte.
function zeichneGedaechtnis(store, projekte = [PROJEKT]) {
  const context = {
    state: { memoryStore: store, docs: [], projects: projekte },
    activeDoc: () => null,
    persist: () => {},
  }
  const ui = createMemoryUi({ context, createNode, openDialog: () => {} })
  const body = new Knoten('div')
  ui.render(body, projekte.find(projekt => projekt.id === PROJEKT.id))
  return body
}

function abschnitt(body, titel) {
  return body.kinder.find(kind => kind.kinder.some(enkel => enkel.text === titel)) || null
}

// Baut eine Erinnerung so, wie sie im Dialog wirklich entsteht: erst ein Projekteintrag,
// dann ein Freigabevorschlag, dann die ausdrueckliche Zustimmung.
function gibFrei(satz, ebene) {
  let store = ensureMemoryStore(null)
  store.entries.push(createMemoryEntry({
    id: 'memory-project:p-quelle:goal',
    level: 'project',
    type: 'knowledge',
    content: satz,
    scope: { projectId: 'p-quelle' },
    provenance: { actor: 'user', action: 'share-proposal', originEventIds: ['ereignis-1'] },
    sensitivity: 'standard',
    deletionRule: 'with-project',
    createdAt: 500,
  }))
  store = createTransferRequest(store, {
    id: 'memory-transfer:goal',
    entryId: 'memory-project:p-quelle:goal',
    fromProjectId: 'p-quelle',
    toProjectId: PROJEKT.id,
    suggestedLevel: ebene,
    at: 600,
  })
  return decideMemoryTransfer(store, 'memory-transfer:goal', { approved: true, actor: 'user', at: 700 })
}

// Der Fehler: der Abschnitt filterte nur nach Ebene. Ein erkanntes Prinzip liegt auf
// 'personal' und lief deshalb mit -- mit dem Etikett "Persoenliche Praeferenz", mit der
// Begruendung "wurde ausdruecklich fuer dieses Projekt freigegeben" (die niemand erteilt
// hat) und einmal je Begegnung untereinander. Prinzipien haben ihren eigenen Ort:
// renderErkanntes in workspace.js.
test('ein erkanntes Prinzip steht nicht unter den freigegebenen Erinnerungen', () => {
  const satz = 'Eine Zahl braucht ihre Herkunft im Satz daneben.'
  let store = ensureMemoryStore(null)
  store = schreibeErkanntes(store, { satz, at: 1000 }).store
  store = schreibeErkanntes(store, { satz, at: 2000 }).store

  const body = zeichneGedaechtnis(store)

  assert.equal(abschnitt(body, 'Freigegebene Erinnerungen'), null)
  assert.doesNotMatch(body.inhalt, /Eine Zahl braucht ihre Herkunft/)
  assert.doesNotMatch(body.inhalt, /Persönliche Präferenz wurde ausdrücklich für dieses Projekt freigegeben/)
})

// Die Gegenprobe: was wirklich freigegeben wurde, muss weiter zu sehen sein. Sonst
// heilte die Korrektur den Fehler, indem sie den ganzen Abschnitt leerraeumt.
test('eine ausdruecklich freigegebene persoenliche Erinnerung bleibt sichtbar', () => {
  const satz = 'Kurze Sätze zuerst.'
  const body = zeichneGedaechtnis(gibFrei(satz, 'personal'))

  const freigegeben = abschnitt(body, 'Freigegebene Erinnerungen')
  assert.ok(freigegeben, 'der Abschnitt fehlt')
  assert.match(freigegeben.inhalt, /Persönliche Präferenz/)
  assert.match(freigegeben.inhalt, /Kurze Sätze zuerst/)
})

test('freigegebenes Themenwissen bleibt sichtbar', () => {
  const satz = 'Das Fachwort Kohärenz meint hier den Textzusammenhang.'
  const body = zeichneGedaechtnis(gibFrei(satz, 'topic'))

  const freigegeben = abschnitt(body, 'Freigegebene Erinnerungen')
  assert.ok(freigegeben, 'der Abschnitt fehlt')
  assert.match(freigegeben.inhalt, /Themenwissen/)
  assert.match(freigegeben.inhalt, /Das Fachwort Kohärenz/)
})
