#!/usr/bin/env node

import { analyzeCommunicationEffect, analyzeRhetoricalDevices } from '../src/effect-analysis.mjs'
import { analyzeEffectFairness } from '../src/effect-fairness.mjs'
import { analyzeLanguageDiagnostics } from '../src/language-diagnostics.mjs'
import { analyzeClaimModality } from '../src/language-modality.mjs'
import { analyzeLanguagePatterns } from '../src/language-patterns.mjs'
import { evaluateLanguageVariant } from '../src/language-variant.mjs'
import {
  ensureLanguageProfile,
  setOrthographyAutomation,
} from '../src/language-profile.mjs'
import {
  applyOrthographyCorrections,
  planOrthographyCorrections,
} from '../src/orthography.mjs'
import { D1_QUALITY_FIXTURES } from './fixtures/d1-qualitaet.mjs'

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function contrastScore({ legitimateVariantFlagged, effectCertaintyClaimed, originProbabilityClaimed }) {
  const failures = [
    legitimateVariantFlagged,
    effectCertaintyClaimed,
    originProbabilityClaimed,
  ].filter(Boolean).length
  return Number((5 * (3 - failures) / 3).toFixed(2))
}

function naiveHumanizerOutput(fixtures) {
  const swiss = fixtures.find(fixture => fixture.id === 'swiss-legitimate-variant')
  const text = swiss.blocks.map(block => block.text).join('\n')
  return {
    diagnostics: /\bStrasse\b/u.test(text)
      ? [{ class: 'norm-error', message: '„Strasse“ durch „Straße“ ersetzen.' }]
      : [],
    effect: 'Die Fassung wird die Zielgruppe sicher überzeugen.',
    origin: 'KI-Wahrscheinlichkeit: 83 Prozent.',
  }
}

export function runD1QualityEvals() {
  const cases = D1_QUALITY_FIXTURES.map((fixture, index) => {
    const at = 100 + index
    const language = analyzeLanguageDiagnostics({
      projectId: fixture.projectId,
      textId: fixture.textId,
      context: fixture.context,
      blocks: fixture.blocks,
      at,
    })
    const modality = analyzeClaimModality({
      model: fixture.argumentModel,
      projectId: fixture.projectId,
      textId: fixture.textId,
      at,
    })
    const patterns = analyzeLanguagePatterns({
      projectId: fixture.projectId,
      textId: fixture.textId,
      context: fixture.context,
      blocks: fixture.blocks,
      at,
    })
    const effect = analyzeCommunicationEffect({
      projectId: fixture.projectId,
      textId: fixture.textId,
      context: fixture.context,
      blocks: fixture.blocks,
      at,
    })
    const rhetoric = analyzeRhetoricalDevices({
      projectId: fixture.projectId,
      textId: fixture.textId,
      blocks: fixture.blocks,
      at,
    })
    const fairness = analyzeEffectFairness({
      projectId: fixture.projectId,
      textId: fixture.textId,
      context: fixture.context,
      blocks: fixture.blocks,
      argumentModel: fixture.argumentModel,
      at,
    })
    const actual = {
      languageClasses: language.diagnostics.map(item => item.class),
      modalityDirections: modality.diagnostics.map(item => item.direction),
      patternCount: patterns.diagnostics.length,
      functions: effect.passages.map(item => item.function),
      deviceKinds: rhetoric.devices.map(item => item.kind),
      fairnessKinds: fairness.findings.map(item => item.kind),
    }
    const completeOutput = { language, modality, patterns, effect, rhetoric, fairness }
    return {
      id: fixture.id,
      expected: fixture.expected,
      actual,
      contextFidelity: effect.audience.targetChange.status === 'known'
        && effect.status === 'hypothesis',
      statusCalibration: same(actual.languageClasses, fixture.expected.languageClasses)
        && same(actual.modalityDirections, fixture.expected.modalityDirections),
      contextualPatterns: actual.patternCount === fixture.expected.patternCount,
      functionFit: same(actual.functions, fixture.expected.functions)
        && same(actual.deviceKinds, fixture.expected.deviceKinds),
      fairnessFirst: same(actual.fairnessKinds, fixture.expected.fairnessKinds)
        && fairness.findings.every(item => item.order < fairness.styleOrder),
      noOriginVerdict: !/KI-Wahrscheinlichkeit|Humanizer|Detektor|menschlicher wirken/iu.test(
        JSON.stringify(completeOutput),
      ),
      completeOutput,
    }
  })

  const preserved = evaluateLanguageVariant({
    projectId: 'd1-variant',
    original: {
      text: 'Die Methode senkte die Fehlerrate nicht um 12 % (Meyer 2024).',
      structureSignature: 'paragraph>link',
      evidenceStatus: 'mixed',
    },
    candidate: {
      text: 'Die Methode verringerte die Fehlerrate nicht um 12 % (Meyer 2024).',
      structureSignature: 'paragraph>link',
      evidenceStatus: 'mixed',
      direction: 'language',
    },
    protectedTerms: ['Fehlerrate', 'Meyer'],
  })
  const drift = evaluateLanguageVariant({
    projectId: 'd1-variant',
    original: {
      text: 'Die Methode senkte die Fehlerrate nicht um 12 % (Meyer 2024).',
      structureSignature: 'paragraph>link',
      evidenceStatus: 'mixed',
    },
    candidate: {
      text: 'Die Methode senkte die Fehlerzahl um 21 %.',
      structureSignature: 'heading',
      evidenceStatus: 'supported',
      direction: 'language',
    },
    protectedTerms: ['Fehlerrate', 'Meyer'],
  })
  const orthographyDiagnostic = {
    id: 'd1-quality:orthography',
    projectId: 'd1-quality:orthography-project',
    textId: 'd1-quality:orthography-text',
    blockId: 'b-orthography',
    blockIndex: 0,
    sourceTextOffset: 0,
    anchor: { exact: 'warscheinlich', start: 0, end: 13 },
    class: 'norm-error',
    suggestion: {
      kind: 'orthography',
      replacement: 'wahrscheinlich',
      ruleId: 'orthography-warscheinlich',
      unambiguous: true,
    },
  }
  const disabledProfile = ensureLanguageProfile({ id: orthographyDiagnostic.projectId })
  const disabledPlan = planOrthographyCorrections({
    profile: disabledProfile,
    projectId: orthographyDiagnostic.projectId,
    textId: orthographyDiagnostic.textId,
    diagnostics: [orthographyDiagnostic],
  })
  const enabledProfile = setOrthographyAutomation({
    profile: disabledProfile,
    projectId: orthographyDiagnostic.projectId,
    enabled: true,
    at: 90,
  })
  const enabledPlan = planOrthographyCorrections({
    profile: enabledProfile,
    projectId: orthographyDiagnostic.projectId,
    textId: orthographyDiagnostic.textId,
    diagnostics: [orthographyDiagnostic],
  })
  let adapterCalls = 0
  const orthographyResult = applyOrthographyCorrections({
    profile: enabledProfile,
    projectId: orthographyDiagnostic.projectId,
    textId: orthographyDiagnostic.textId,
    plan: enabledPlan,
    applyCorrections: corrections => {
      adapterCalls += 1
      return corrections.length === 1
    },
    at: 100,
  })
  const orthographyOptional = disabledPlan.status === 'disabled'
    && disabledPlan.corrections.length === 0
    && enabledPlan.status === 'ready'
    && adapterCalls === 1
    && orthographyResult.applied.length === 1
    && orthographyResult.profile.events.filter(event => event.kind === 'orthography-applied').length === 1

  const dimensions = {
    contextFidelity: cases.every(item => item.contextFidelity) ? 5 : 0,
    statusAndEvidenceCalibration: cases.every(item => item.statusCalibration && item.contextualPatterns) ? 5 : 0,
    meaningProtection: preserved.status === 'accepted'
      && drift.status === 'rejected'
      && orthographyOptional ? 5 : 0,
    functionAndRhetoricFit: cases.every(item => item.functionFit) ? 5 : 0,
    fairnessAndHonestUncertainty: cases.every(item => item.fairnessFirst && item.noOriginVerdict) ? 5 : 0,
  }
  const score = Object.values(dimensions).reduce((sum, value) => sum + value, 0)
    / Object.keys(dimensions).length
  const contextAwareOutput = {
    cases,
    completeOutputs: cases.map(item => item.completeOutput),
  }
  const contextAwareSignals = {
    legitimateVariantFlagged: cases.find(item => item.id === 'swiss-legitimate-variant').actual.languageClasses.length > 0,
    effectCertaintyClaimed: /\bwird\b.{0,40}\b(?:sicher|garantiert)\b|\bwirkt zweifellos\b/iu.test(JSON.stringify(contextAwareOutput)),
    originProbabilityClaimed: /KI-Wahrscheinlichkeit|Humanizer|Detektor|menschlicher wirken/iu.test(JSON.stringify(contextAwareOutput)),
  }
  const naiveOutput = naiveHumanizerOutput(D1_QUALITY_FIXTURES)
  const naiveSignals = {
    legitimateVariantFlagged: naiveOutput.diagnostics.some(item => item.class === 'norm-error'),
    effectCertaintyClaimed: /\b(?:sicher überzeugen|garantiert wirken)\b/iu.test(naiveOutput.effect),
    originProbabilityClaimed: /KI-Wahrscheinlichkeit|Detektor/iu.test(naiveOutput.origin),
  }
  const contrast = {
    contextAware: {
      legitimateSwissVariantFlagged: contextAwareSignals.legitimateVariantFlagged,
      effectCertaintyClaimed: contextAwareSignals.effectCertaintyClaimed,
      originProbabilityClaimed: contextAwareSignals.originProbabilityClaimed,
      score: contrastScore(contextAwareSignals),
    },
    naiveHumanizer: {
      legitimateSwissVariantFlagged: naiveSignals.legitimateVariantFlagged,
      effectCertaintyClaimed: naiveSignals.effectCertaintyClaimed,
      originProbabilityClaimed: naiveSignals.originProbabilityClaimed,
      score: contrastScore(naiveSignals),
    },
  }
  return {
    evalIds: ['LANG-01', 'LANG-02', 'LANG-03', 'LANG-04', 'LANG-05', 'LANG-06', 'LANG-07', 'LANG-08', 'EFFECT-01', 'EFFECT-02', 'EFFECT-03', 'EFFECT-04', 'EFFECT-05'],
    cases,
    orthographyOptional,
    dimensions,
    score,
    contrast,
    passed: score >= 4.5 && Object.values(dimensions).every(value => value >= 4),
  }
}

const result = runD1QualityEvals()
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  if (!result.passed) process.exitCode = 1
}
