import test from 'node:test'
import assert from 'node:assert/strict'
import {
  analyzeCommunicationEffect,
  analyzeRhetoricalDevices,
} from '../src/effect-analysis.mjs'

function context(overrides = {}) {
  return {
    projectId: 'p-a',
    complete: true,
    known: {
      genre: 'project',
      passageFunction: 'explain',
      domain: 'Energiesysteme',
      audience: ['kommunale Entscheiderinnen'],
      medium: 'screen',
      goal: 'Unsicherheit verstehen und eine Prüfentscheidung treffen',
      region: 'DE',
      audienceState: {
        priorKnowledge: ['Grundlagen der Beschaffung'],
        assumptions: ['Planbarkeit ist wichtiger als Maximalleistung'],
        resistances: ['Sorge vor Folgekosten'],
        commonGround: ['Versorgungssicherheit ist notwendig'],
      },
      ...overrides,
    },
    missing: [],
    sources: {},
  }
}

test('EFFECT-01: Publikumsmodell trennt Ausgangs- und Zielzustand statt statischem Label', () => {
  const report = analyzeCommunicationEffect({
    projectId: 'p-a',
    textId: 'd-a',
    context: context(),
    blocks: [{ id: 'b-1', role: 'paragraph', text: 'Die Reserve erklärt die verbleibende Unsicherheit.' }],
    at: 100,
  })
  assert.deepEqual(report.audience.label, ['kommunale Entscheiderinnen'])
  assert.deepEqual(report.audience.priorKnowledge.values, ['Grundlagen der Beschaffung'])
  assert.deepEqual(report.audience.assumptions.values, ['Planbarkeit ist wichtiger als Maximalleistung'])
  assert.deepEqual(report.audience.resistances.values, ['Sorge vor Folgekosten'])
  assert.deepEqual(report.audience.commonGround.values, ['Versorgungssicherheit ist notwendig'])
  assert.equal(report.audience.targetChange.value, 'Unsicherheit verstehen und eine Prüfentscheidung treffen')
  assert.equal(report.audience.targetChange.status, 'known')
})

test('EFFECT-01/04: fehlende Publikumsdaten bleiben unbekannt und Wirkung bleibt Hypothese', () => {
  const sparse = context({ audienceState: undefined })
  const report = analyzeCommunicationEffect({
    projectId: 'p-a',
    textId: 'd-a',
    context: sparse,
    blocks: [{ id: 'b-1', role: 'paragraph', text: 'Die Reserve erklärt die verbleibende Unsicherheit.' }],
    at: 100,
  })
  assert.equal(report.audience.priorKnowledge.status, 'unknown')
  assert.equal(report.audience.assumptions.status, 'unknown')
  assert.equal(report.audience.resistances.status, 'unknown')
  assert.equal(report.audience.commonGround.status, 'unknown')
  assert.equal(report.status, 'hypothesis')
  assert.equal(JSON.stringify(report).match(/wird sicher|garantiert|bewirkt zwingend/iu), null)
})

test('EFFECT-02: Passagefunktionen werden lokal aus Rolle und Wortlaut begründet', () => {
  const report = analyzeCommunicationEffect({
    projectId: 'p-a',
    textId: 'd-a',
    context: context(),
    blocks: [
      { id: 'orient', type: 'heading', role: 'heading', text: 'Warum die Reserve zählt' },
      { id: 'define', type: 'paragraph', role: 'paragraph', text: 'Reserve bedeutet hier verfügbare Leistung binnen fünf Minuten.' },
      { id: 'explain', type: 'paragraph', role: 'paragraph', text: 'Die Schwankung bleibt beherrschbar, weil die Reserve kurzfristig einspringt.' },
      { id: 'evidence', type: 'paragraph', role: 'evidence', text: 'Die Messreihe zeigt 18 stabile Abrufe.' },
      { id: 'activate', type: 'paragraph', role: 'paragraph', text: 'Prüfen Sie vor der Freigabe die vertragliche Abrufzeit.' },
    ],
    at: 100,
  })
  assert.deepEqual(report.passages.map(item => item.function), [
    'orient',
    'define',
    'explain',
    'substantiate',
    'activate',
  ])
  assert.equal(report.passages.every(item => item.rationale.trim()), true)
  assert.equal(report.passages.every(item => item.status === 'hypothesis'), true)
  assert.equal(report.passages.every(item => item.discourseRelation), true)
  assert.equal(report.passages.every(item => item.id && item.projectId === 'p-a' && item.textId === 'd-a'), true)
})

test('EFFECT-02: dekorative oder unklare Passage wird als Hypothese markiert statt sicher abgewertet', () => {
  const report = analyzeCommunicationEffect({
    projectId: 'p-a',
    textId: 'd-a',
    context: context(),
    blocks: [{ id: 'decorative', role: 'paragraph', text: 'Eine neue Ära. Grenzenlose Möglichkeiten.' }],
    at: 100,
  })
  assert.equal(report.passages[0].function, 'unclear')
  assert.equal(report.passages[0].possibleDecorative, true)
  assert.equal(report.passages[0].status, 'hypothesis')
  assert.equal(report.passages[0].confidence, 'low')
})

test('EFFECT-03/04: rhetorische Mittel nennen Gewinn, Fehlvorstellung und Sicherheit', () => {
  const report = analyzeRhetoricalDevices({
    projectId: 'p-a',
    textId: 'd-a',
    blocks: [
      { id: 'example', role: 'paragraph', text: 'Zum Beispiel deckt die Batterie den Lastsprung am Morgen.' },
      { id: 'analogy', role: 'paragraph', text: 'Die Reserve ist genau wie ein Sicherheitsnetz und fängt jeden Ausfall vollständig auf.' },
    ],
    at: 100,
  })
  assert.deepEqual(report.devices.map(item => item.kind), ['example', 'analogy'])
  assert.equal(report.devices.every(item => item.function), true)
  assert.equal(report.devices.every(item => item.expectedGain), true)
  assert.equal(report.devices.every(item => item.possibleMisconception), true)
  assert.equal(report.devices.every(item => item.effectStatus === 'hypothesis'), true)
  assert.equal(report.devices[1].directVersionPreferred, true)
  assert.match(report.devices[1].possibleMisconception, /Grenze|vollständig/)
})

test('EFFECT-03: Kontrast, Metapher, Frame und Direktheit werden als begrenzte Strategien erkannt', () => {
  const report = analyzeRhetoricalDevices({
    projectId: 'p-a',
    textId: 'd-a',
    blocks: [
      { id: 'b-contrast', text: 'Der Pilot wirkt lokal, hingegen bleibt die Übertragung offen.' },
      { id: 'b-metaphor', text: 'Das Register ist ein Kompass für die Überarbeitung.' },
      { id: 'b-frame', text: 'Die Umstellung erscheint als Investition in Wartbarkeit.' },
      { id: 'b-direct', text: 'Prüfe zuerst die belegte Einschränkung.' },
    ],
    at: 100,
  })
  assert.deepEqual(report.devices.map(item => item.kind), [
    'contrast',
    'metaphor',
    'frame',
    'directness',
  ])
  assert.equal(report.devices.every(item => item.effectStatus === 'hypothesis'), true)
  assert.equal(report.devices.every(item => item.expectedGain && item.possibleMisconception), true)
  assert.ok(report.coveredStrategies.includes('directness'))
})

test('Wirkungsanalyse weist fremden Kontext fail-closed ab', () => {
  assert.throws(() => analyzeCommunicationEffect({
    projectId: 'p-b',
    textId: 'd-a',
    context: context(),
    blocks: [],
    at: 100,
  }), /project/i)
})
