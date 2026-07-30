import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyOrthographyCorrections,
  planOrthographyCorrections,
} from '../src/orthography.mjs'
import {
  ensureLanguageProfile,
  setOrthographyAutomation,
} from '../src/language-profile.mjs'

function diagnostic(id, blockId, start, exact, replacement, overrides = {}) {
  const ruleId = exact.toLocaleLowerCase('de-DE').startsWith('warscheinlich')
    ? 'orthography-warscheinlich'
    : 'orthography-naehmlich'
  return {
    id,
    projectId: 'p-a',
    textId: 'd-a',
    blockId,
    blockIndex: blockId === 'b-1' ? 0 : 1,
    sourceTextOffset: 0,
    anchor: { exact, start, end: start + exact.length },
    class: 'norm-error',
    suggestion: {
      kind: 'orthography',
      replacement,
      ruleId,
      unambiguous: true,
    },
    ...overrides,
  }
}

test('LANG-08: ausgeschaltete Normautomatik plant und ändert nichts', () => {
  const profile = ensureLanguageProfile({ id: 'p-a' })
  const plan = planOrthographyCorrections({
    profile,
    projectId: 'p-a',
    textId: 'd-a',
    diagnostics: [diagnostic('a', 'b-1', 4, 'warscheinlich', 'wahrscheinlich')],
  })
  assert.equal(plan.status, 'disabled')
  assert.deepEqual(plan.corrections, [])
  let calls = 0
  const result = applyOrthographyCorrections({
    profile,
    projectId: 'p-a',
    textId: 'd-a',
    plan,
    at: 100,
    applyCorrections: () => { calls += 1; return true },
  })
  assert.equal(calls, 0)
  assert.equal(result.profile.events.length, 0)
})

test('LANG-08: Opt-in wendet nur eindeutige Fälle rückwärts an und protokolliert jede echte Änderung', () => {
  const initial = ensureLanguageProfile({ id: 'p-a' })
  const profile = setOrthographyAutomation({
    profile: initial,
    projectId: 'p-a',
    enabled: true,
    at: 90,
  })
  const diagnostics = [
    diagnostic('first', 'b-1', 2, 'warscheinlich', 'wahrscheinlich'),
    diagnostic('second', 'b-1', 20, 'nähmlich', 'nämlich'),
    diagnostic('ambiguous', 'b-2', 3, 'dass', 'das', {
      suggestion: {
        kind: 'orthography',
        replacement: 'das',
        ruleId: 'orthography-naehmlich',
        unambiguous: false,
      },
    }),
  ]
  const plan = planOrthographyCorrections({
    profile,
    projectId: 'p-a',
    textId: 'd-a',
    diagnostics,
  })
  assert.equal(plan.status, 'ready')
  assert.deepEqual(plan.corrections.map(item => item.diagnosticId), ['second', 'first'])
  const applied = []
  const result = applyOrthographyCorrections({
    profile,
    projectId: 'p-a',
    textId: 'd-a',
    plan,
    at: 100,
    applyCorrections: corrections => {
      applied.push(...corrections.map(correction => correction.diagnosticId))
      return true
    },
  })
  assert.deepEqual(applied, ['second', 'first'])
  assert.deepEqual(result.applied.map(item => item.diagnosticId), ['second', 'first'])
  assert.deepEqual(result.skipped, [])
  assert.equal(result.profile.events.filter(event => event.kind === 'orthography-applied').length, 2)
  assert.deepEqual(
    result.profile.events
      .filter(event => event.kind === 'orthography-applied')
      .map(event => [event.oldText, event.newText]),
    [['nähmlich', 'nämlich'], ['warscheinlich', 'wahrscheinlich']],
  )
})

test('LANG-08: ein eindeutiger Fehler am Satzanfang bleibt ausführbar', () => {
  const profile = setOrthographyAutomation({
    profile: ensureLanguageProfile({ id: 'p-a' }),
    projectId: 'p-a',
    enabled: true,
    at: 90,
  })
  const plan = planOrthographyCorrections({
    profile,
    projectId: 'p-a',
    textId: 'd-a',
    diagnostics: [diagnostic('sentence-start', 'b-1', 0, 'Warscheinlich', 'Wahrscheinlich')],
  })
  assert.equal(plan.status, 'ready')
  assert.deepEqual(plan.corrections.map(item => item.diagnosticId), ['sentence-start'])
})

test('Normkorrekturen weisen fremde Projekte und Texte fail-closed ab', () => {
  const profile = setOrthographyAutomation({
    profile: ensureLanguageProfile({ id: 'p-a' }),
    projectId: 'p-a',
    enabled: true,
    at: 90,
  })
  assert.throws(() => planOrthographyCorrections({
    profile,
    projectId: 'p-b',
    textId: 'd-a',
    diagnostics: [],
  }), /project/i)
  assert.throws(() => planOrthographyCorrections({
    profile,
    projectId: 'p-a',
    textId: 'd-a',
    diagnostics: [diagnostic('foreign-text', 'b-1', 0, 'nähmlich', 'nämlich', { textId: 'd-b' })],
  }), /text/i)
})

test('Normkorrekturen weisen manipulierte Regeln und Korrekturumfänge vor dem Editoradapter zurück', () => {
  const profile = setOrthographyAutomation({
    profile: ensureLanguageProfile({ id: 'p-a' }),
    projectId: 'p-a',
    enabled: true,
    at: 90,
  })
  const plan = planOrthographyCorrections({
    profile,
    projectId: 'p-a',
    textId: 'd-a',
    diagnostics: [diagnostic('safe', 'b-1', 0, 'warscheinlich', 'wahrscheinlich')],
  })
  const forged = {
    ...plan,
    corrections: [{
      ...plan.corrections[0],
      replacement: 'garantiert',
    }],
  }
  let calls = 0
  assert.throws(() => applyOrthographyCorrections({
    profile,
    projectId: 'p-a',
    textId: 'd-a',
    plan: forged,
    applyCorrections: () => { calls += 1; return true },
    at: 100,
  }), /invalid correction/i)
  assert.equal(calls, 0)
})
