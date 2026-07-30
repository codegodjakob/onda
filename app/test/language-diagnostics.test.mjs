import test from 'node:test'
import assert from 'node:assert/strict'
import {
  LANGUAGE_DIAGNOSTIC_CLASSES,
  analyzeLanguageDiagnostics,
  createLanguageDiagnostic,
} from '../src/language-diagnostics.mjs'

function context(overrides = {}) {
  return {
    projectId: 'p-a',
    complete: true,
    known: {
      genre: 'scientific',
      passageFunction: 'discuss',
      domain: 'Linguistik',
      audience: ['Fachpublikum'],
      medium: 'academic-submission',
      goal: 'Befunde abwägen',
      region: 'DE',
      houseStyle: [],
      ...overrides,
    },
    missing: [],
    sources: {},
  }
}

function blocks(texts) {
  return texts.map((text, index) => ({
    id: `b-${index + 1}`,
    index,
    type: 'paragraph',
    role: index === 0 ? 'claim' : 'paragraph',
    text,
  }))
}

test('LANG-02: Norm, Grammatik und Register bleiben getrennte Statusklassen', () => {
  assert.deepEqual(LANGUAGE_DIAGNOSTIC_CLASSES, [
    'norm-error',
    'grammar-observation',
    'register-observation',
    'effect-hypothesis',
    'integrity-warning',
  ])
  const report = analyzeLanguageDiagnostics({
    projectId: 'p-a',
    textId: 'd-a',
    blocks: blocks([
      'Das Ergebnis ist warscheinlich robust.',
      'Der der Befund bleibt erklärungsbedürftig.',
      'Die Methode ist mega präzise.',
    ]),
    context: context(),
    at: 100,
  })
  assert.deepEqual(report.diagnostics.map(item => item.class), [
    'norm-error',
    'grammar-observation',
    'register-observation',
  ])
  assert.equal(report.diagnostics[0].label, 'Normfehler')
  assert.equal(report.diagnostics[1].label.includes('Fehler'), false)
  assert.equal(report.diagnostics[2].label.includes('Fehler'), false)
  assert.equal(report.diagnostics.every(item => item.reason.trim()), true)
  assert.equal(report.diagnostics.every(item => item.anchor.exact), true)
})

test('LANG-03: legitime D-A-CH- und Hausstilvarianten werden nicht zu Normfehlern', () => {
  const fixtures = [
    [context({ region: 'CH' }), 'Die Strasse bleibt im Jänner geöffnet.'],
    [context({ region: 'AT' }), 'Im Jänner steht der Sessel im Vorraum.'],
    [context({ region: 'DE', houseStyle: ['Produktname Standart'] }), 'Produktname Standart bleibt unverändert.'],
  ]
  fixtures.forEach(([profileContext, text]) => {
    const report = analyzeLanguageDiagnostics({
      projectId: 'p-a',
      textId: 'd-a',
      blocks: blocks([text]),
      context: profileContext,
      at: 100,
    })
    assert.equal(report.diagnostics.some(item => item.class === 'norm-error'), false)
  })
})

test('LANG-08: sichtbare URLs und wörtliche Zitate bleiben von der Normautomatik ausgeschlossen', () => {
  const markedLinkBlock = blocks(['warscheinlich verlinkt'])[0]
  markedLinkBlock.protectedRanges = [{ start: 0, end: 13, kind: 'link' }]
  const report = analyzeLanguageDiagnostics({
    projectId: 'p-a',
    textId: 'd-a',
    blocks: [
      markedLinkBlock,
      ...blocks([
      'Der Pfad https://example.org/warscheinlich bleibt als Originalreferenz erhalten.',
      'Das Protokoll zitiert „warscheinlich“ wortgetreu.',
      'Die Form »nähmlich« ist Teil einer dokumentierten Originalquelle.',
      'Nähmlich GmbH ist als Eigenname registriert.',
      'Hotel Nähmlich ist ein eingetragener Eigenname.',
      'Frau Nähmlich hält den Vortrag.',
      ]),
    ],
    context: context(),
    at: 100,
  })
  assert.deepEqual(report.diagnostics.filter(item => item.class === 'norm-error'), [])
})

test('LANG-03: gemischte D-A-CH-Varianten erzeugen eine Konsistenzbeobachtung, keinen Normfehler', () => {
  const report = analyzeLanguageDiagnostics({
    projectId: 'p-a',
    textId: 'd-a',
    blocks: blocks([
      'Die Strasse bleibt offen.',
      'Die Straße wird morgen geprüft.',
    ]),
    context: context({ region: 'CH' }),
    at: 100,
  })
  assert.deepEqual(report.diagnostics.map(item => item.class), ['register-observation'])
  assert.equal(report.diagnostics[0].family, 'variant-consistency')
  assert.match(report.diagnostics[0].reason, /legitime Variante/)
})

test('LANG-08: eindeutige Normkorrekturen bewahren Versal- und Satzanfangsschreibung', () => {
  const report = analyzeLanguageDiagnostics({
    projectId: 'p-a',
    textId: 'd-a',
    blocks: blocks([
      'NÄHMLICH bleibt die Hervorhebung in Versalien.',
      'WIEDERSPIEGELN steht ebenfalls in Versalien.',
    ]),
    context: context(),
    at: 100,
  })
  assert.deepEqual(
    report.diagnostics.map(item => item.suggestion.replacement),
    ['NÄMLICH', 'WIDERSPIEGELN'],
  )
})

test('LANG-01/05: ohne Registergrundlage laufen nur sichere Normsignale; Stilmittel sind nie allein verboten', () => {
  const incomplete = context()
  incomplete.complete = false
  incomplete.known = { region: 'DE', houseStyle: [] }
  incomplete.missing = ['genre', 'passageFunction', 'domain', 'audience', 'medium', 'goal']
  const report = analyzeLanguageDiagnostics({
    projectId: 'p-a',
    textId: 'd-a',
    blocks: blocks([
      'Die Auswertung wurde geprüft — und sie blieb nachvollziehbar.',
      'Die Prüfung der Auswertung erfolgte durch das Team.',
    ]),
    context: incomplete,
    at: 100,
  })
  assert.deepEqual(report.diagnostics, [])
  assert.deepEqual(report.skippedFamilies, ['register', 'anti-slop'])
})

test('Diagnosen validieren Projekt, Textanker und erlaubte Klasse fail-closed', () => {
  const base = {
    id: 'diag-a',
    projectId: 'p-a',
    textId: 'd-a',
    blockId: 'b-a',
    anchor: { exact: 'warscheinlich', start: 17, end: 30 },
    class: 'norm-error',
    family: 'orthography',
    label: 'Normfehler',
    message: 'Wahrscheinlich ist falsch geschrieben.',
    reason: 'Eindeutige Wörterbuchform.',
    reviewQuestion: 'Soll die Schreibweise korrigiert werden?',
    confidence: 'high',
    provenance: { actor: 'agent', action: 'language-analysis' },
    fingerprint: 'fingerprint-a',
    createdAt: 100,
  }
  assert.equal(createLanguageDiagnostic(base).projectId, 'p-a')
  assert.throws(() => createLanguageDiagnostic({ ...base, class: 'ai-score' }), /class/i)
  assert.throws(() => createLanguageDiagnostic({
    ...base,
    anchor: { exact: 'warscheinlich', start: 0, end: 5 },
  }), /anchor/i)
  assert.throws(() => analyzeLanguageDiagnostics({
    projectId: 'p-b',
    textId: 'd-a',
    blocks: blocks(['Das ist warscheinlich falsch.']),
    context: context(),
    at: 100,
  }), /project/i)
})
