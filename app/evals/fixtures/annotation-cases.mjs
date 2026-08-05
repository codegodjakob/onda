import {
  ALL_ANNOTATION_KINDS,
  kindInfo,
} from '../../src/annotation-contract.mjs'

const CONTENT = Object.freeze({
  source: {
    sources: [{
      label: 'Attention Residue and Task Switching',
      url: 'https://example.test/attention',
      content: 'Nach einer Unterbrechung bleibt ein Teil der Aufmerksamkeit bei der vorherigen Aufgabe.',
      citation: 'Leroy (2009)',
      locator: 'S. 170',
      verificationStatus: 'fixture',
      limits: 'Das Fixture belegt keine konkrete Zeitangabe.',
    }],
  },
  compare: {
    compare: [
      { ref: 'Absatz 2', text: '23 Minuten' },
      { ref: 'Absatz 4', text: 'eine ganze Stunde' },
    ],
  },
  slot: {
    move: { fromBlockId: 'fixture-source', toBlockId: 'fixture-target', to: 'Nach dem Abschnitt „Was hilft“' },
  },
  region: {
    targets: [
      { blockId: 'fixture-a', text: 'Aufmerksamkeit' },
      { blockId: 'fixture-b', text: 'Aufmerksamkeit' },
    ],
  },
  dialogue: {
    thread: [],
  },
})

export const ANNOTATION_CASES = Object.freeze(ALL_ANNOTATION_KINDS.map((kind, index) => {
  const info = kindInfo(kind)
  const extra = CONTENT[info.form] || {}
  return Object.freeze({
    id: `annotation-fixture-${String(index + 1).padStart(2, '0')}`,
    anmerkungsart: kind,
    status: 'open',
    placement: 'passage',
    blockId: 'fixture-a',
    target: `${info.label} – bisherige Fassung`,
    short: `${info.label} zeigt genau die passende Onda-Gestalt.`,
    why: `Die Rückmeldung betrifft ${info.scope.toLowerCase()} und gehört zur Kategorie ${info.category}.`,
    folge: 'Die Entscheidung bleibt bei der Autorin oder dem Autor.',
    action: `${info.label} – neue Fassung`,
    priority: info.priority,
    ...extra,
  })
}))

export function annotationCase(kind) {
  return ANNOTATION_CASES.find(candidate => candidate.anmerkungsart === kind) || null
}
