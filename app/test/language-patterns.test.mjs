import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeLanguagePatterns } from '../src/language-patterns.mjs'

function context(overrides = {}) {
  return {
    projectId: 'p-a',
    complete: true,
    known: {
      genre: 'project',
      passageFunction: 'explain',
      domain: 'Design',
      audience: ['Projektteam'],
      medium: 'screen',
      goal: 'Entscheidung erklären',
      region: 'DE',
      houseStyle: [],
      ...overrides,
    },
    missing: [],
    sources: {},
  }
}

test('LANG-05: einzelne Gedankenstriche, Passivformen, Nominalisierungen und Dreierfiguren bleiben legitim', () => {
  const report = analyzeLanguagePatterns({
    projectId: 'p-a',
    textId: 'd-a',
    context: context(),
    blocks: [
      { id: 'b-1', role: 'evidence', text: 'Die Daten wurden geprüft — unabhängig und reproduzierbar.' },
      { id: 'b-2', role: 'paragraph', text: 'Die Prüfung der Daten klärt Ursache, Reichweite und Grenze.' },
    ],
    at: 100,
  })
  assert.deepEqual(report.diagnostics, [])
})

test('LANG-05: funktionslose Häufung erzeugt eine begrenzte Diagnose statt Wortverbot', () => {
  const report = analyzeLanguagePatterns({
    projectId: 'p-a',
    textId: 'd-a',
    context: context(),
    blocks: [
      { id: 'b-1', role: 'paragraph', text: 'Darüber hinaus ist der Ansatz relevant.' },
      { id: 'b-2', role: 'paragraph', text: 'Darüber hinaus ist die Lösung innovativ.' },
      { id: 'b-3', role: 'paragraph', text: 'Darüber hinaus ist das Ergebnis bedeutsam.' },
    ],
    at: 100,
  })
  assert.equal(report.diagnostics.length, 1)
  assert.equal(report.diagnostics[0].family, 'anti-slop')
  assert.equal(report.diagnostics[0].class, 'register-observation')
  assert.match(report.diagnostics[0].reason, /Häufung/)
  assert.match(report.diagnostics[0].message, /prüfen/)
  assert.equal(JSON.stringify(report).match(/KI-Wahrscheinlichkeit|Humanizer|Detektor/iu), null)
})

test('LANG-05: derselbe Konnektor bleibt als explizite Übergangsfunktion unangetastet', () => {
  const report = analyzeLanguagePatterns({
    projectId: 'p-a',
    textId: 'd-a',
    context: context({ passageFunction: 'transition' }),
    blocks: [
      { id: 'b-1', role: 'transition', text: 'Darüber hinaus folgt die zweite Einschränkung.' },
      { id: 'b-2', role: 'transition', text: 'Darüber hinaus beginnt der nächste Prüfschritt.' },
    ],
    at: 100,
  })
  assert.deepEqual(report.diagnostics, [])
})

test('LANG-01/05: ohne Genre und Teiltextfunktion enthält sich die Musterdiagnose sichtbar', () => {
  const incomplete = context()
  incomplete.complete = false
  incomplete.known = {}
  incomplete.missing = ['genre', 'passageFunction']
  const report = analyzeLanguagePatterns({
    projectId: 'p-a',
    textId: 'd-a',
    context: incomplete,
    blocks: [
      { id: 'b-1', role: 'paragraph', text: 'Darüber hinaus ist A relevant.' },
      { id: 'b-2', role: 'paragraph', text: 'Darüber hinaus ist B relevant.' },
      { id: 'b-3', role: 'paragraph', text: 'Darüber hinaus ist C relevant.' },
    ],
    at: 100,
  })
  assert.equal(report.status, 'abstained')
  assert.deepEqual(report.missingContext, ['genre', 'passageFunction'])
  assert.deepEqual(report.diagnostics, [])
})
