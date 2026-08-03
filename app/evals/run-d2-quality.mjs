#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import {
  buildAiUsageDeclaration,
  buildAuthorshipProof,
} from '../src/authorship-proof.mjs'
import {
  emptyLocalState,
  exportAllLocalData,
  importAllLocalData,
  validateAllLocalDataExport,
} from '../src/data-control.mjs'
import {
  recordFinalAudit,
  runFinalAudit,
} from '../src/final-audit.mjs'
import {
  buildPublicationDocument,
  renderHtml,
  renderJats,
  renderMarkdown,
} from '../src/publication-export.mjs'
import { D2_QUALITY_FIXTURES } from './fixtures/d2-abschlussqualitaet.mjs'

const REQUIRED_D2_EVALS = Object.freeze([
  'AUDIT-01',
  'AUDIT-02',
  'AUDIT-03',
  'AUDIT-04',
  'AUDIT-05',
  'AUDIT-06',
  'AUDIT-07',
  'SYSTEM-10',
  'SYSTEM-11',
])
const GROUP_ORDER = Object.freeze([
  'integrity',
  'evidence',
  'citation',
  'accepted-risk',
  'other',
  'style',
])
const PROTOCOL_URL = new URL('../../docs/evals/SYSTEM-11-wcag-protokoll.md', import.meta.url)
const AUDIT_UI_URL = new URL('../src/audit-ui.mjs', import.meta.url)
const FORBIDDEN_ORIGIN_LANGUAGE = /(?:KI-Wahrscheinlichkeit|Humanizer|Detektor|kognitiv|Verständniswahrscheinlichkeit|\d+\s*%\s*(?:menschlich|KI))/iu
const READY_VERDICT = /\b(?:freigegeben|publikationsreif|ready)\b/iu
const RAW_UI_OR_SCRIPT = /(?:agentWidget|CANARY-UI|audit-dialog|ProseMirror|(?<!\\)<script\b|(?<!\\)<img\s+src=x)/iu

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function withoutTime(value, key) {
  return { ...value, [key]: 0 }
}

function sorted(values) {
  return [...values].sort((a, b) => String(a).localeCompare(String(b), 'de'))
}

function allTextContains(outputs, canaries) {
  return Object.values(outputs).every(output => (
    canaries.every(canary => output.includes(canary))
  ))
}

function scoreSignals(signals) {
  const values = Object.values(signals)
  return Number((5 * values.filter(Boolean).length / values.length).toFixed(2))
}

function naiveCompletionOutput(fixtures) {
  return {
    audit: {
      status: 'ready',
      score: 98,
      blockers: [],
      rationale: 'Der Stil ist flüssig; der Text ist publikationsreif.',
    },
    authorship: 'KI-Wahrscheinlichkeit 17 %, menschlich verfasst 83 %.',
    publication: `<article class="agentWidget"><script>CANARY-SCRIPT</script>${fixtures.publication.title}</article>`,
    localData: {
      settings: { apiKey: fixtures.localState.settings.apiKey },
    },
  }
}

function evaluateAuditCases() {
  return D2_QUALITY_FIXTURES.auditCases.map(fixture => {
    const first = runFinalAudit({
      project: structuredClone(fixture.project),
      docs: structuredClone(fixture.docs),
      textId: fixture.textId,
      at: 100,
    })
    const second = runFinalAudit({
      project: structuredClone(fixture.project),
      docs: structuredClone(fixture.docs),
      textId: fixture.textId,
      at: 999,
    })
    const common = {
      deterministic: first.fingerprint === second.fingerprint
        && same(withoutTime(first, 'auditedAt'), withoutTime(second, 'auditedAt')),
      noReadyVerdict: !READY_VERDICT.test(JSON.stringify(first)),
      userOwnsDecision: /Nutzer|Nutzerin|Nutzerentscheidung/iu.test(first.userDecisionNotice),
    }
    let contract
    if (fixture.id === 'scientific-integrity') {
      contract = {
        statusCorrect: first.status === fixture.expected.status,
        groupOrderCorrect: same(first.groups.map(group => group.kind), fixture.expected.groupOrder),
        blockersCorrect: same(
          sorted(first.blockers.map(item => item.sourceId)),
          sorted(fixture.expected.blockerSources),
        ),
        allStatusesReachable: fixture.expected.statuses.every(status => (
          Object.hasOwn(first.statusCounts, status)
        )),
        styleNeverBlocks: first.blockers.every(item => !['wording', 'register', 'style'].includes(item.category)),
      }
    } else if (fixture.id === 'accepted-risk') {
      contract = {
        statusCorrect: first.status === fixture.expected.status,
        acceptedRiskCountCorrect: first.acceptedRisks.length === fixture.expected.acceptedRiskCount,
        blockerCountCorrect: first.blockers.length === fixture.expected.blockerCount,
      }
    } else {
      contract = {
        statusCorrect: first.status === fixture.expected.status,
        blockerCountCorrect: first.blockers.length === fixture.expected.blockerCount,
        userDecisionCopyCorrect: fixture.expected.userDecisionPattern.test(first.userDecisionNotice),
      }
    }
    return {
      id: fixture.id,
      output: first,
      evidence: { ...common, ...contract },
      passed: Object.values({ ...common, ...contract }).every(Boolean),
    }
  })
}

function evaluateReproducibleAuditStore(auditCase) {
  const fixture = D2_QUALITY_FIXTURES.auditCases.find(item => item.id === auditCase.id)
  const project = structuredClone(fixture.project)
  recordFinalAudit({ project, audit: auditCase.output })
  recordFinalAudit({
    project,
    audit: { ...auditCase.output, auditedAt: auditCase.output.auditedAt + 100 },
  })
  return {
    historyCount: project.finalAudits.history.length,
    fingerprint: project.finalAudits.byText[fixture.textId]?.fingerprint,
    passed: project.finalAudits.history.length === 1
      && project.finalAudits.byText[fixture.textId]?.fingerprint === auditCase.output.fingerprint,
  }
}

function evaluateAuthorship() {
  const fixture = D2_QUALITY_FIXTURES.authorship
  const first = buildAuthorshipProof({
    project: structuredClone(fixture.project),
    docs: structuredClone(fixture.docs),
  })
  const second = buildAuthorshipProof({
    project: structuredClone(fixture.project),
    docs: structuredClone(fixture.docs).reverse(),
  })
  const declarationOff = buildAiUsageDeclaration({ proof: first, enabled: false })
  const declarationOn = buildAiUsageDeclaration({ proof: first, enabled: true })
  const observedKinds = sorted(new Set(first.contributions.map(item => item.kind)))
  const expectedKinds = sorted(fixture.expectedKinds)
  const evidence = {
    kindsExact: same(observedKinds, expectedKinds),
    eventBasisOnly: first.contributions.every(item => (
      item.basis === 'local-observable-event'
      && Array.isArray(item.originEventIds)
      && item.originEventIds.length > 0
    )),
    observationLimitExplicit: /nicht beobachtete Beiträge werden nicht geschätzt/iu.test(first.observationLimit),
    noOriginProbability: !FORBIDDEN_ORIGIN_LANGUAGE.test(JSON.stringify(first)),
    deterministic: same(first, second),
    declarationOptional: declarationOff === null,
    declarationTraceable: declarationOn?.basis === 'local-observable-events'
      && declarationOn.sourceEventIds.length >= 4
      && declarationOn.activities.length >= 3,
    declarationMakesNoAuthorshipClaim: !/(?:Text\s+(?:verfasst|generiert)|Wahrscheinlichkeit|\d+\s*%)/iu.test(
      JSON.stringify(declarationOn),
    ),
  }
  return {
    id: 'observable-authorship',
    output: {
      proof: first,
      declarationOff,
      declarationOn,
    },
    evidence,
    passed: Object.values(evidence).every(Boolean),
  }
}

function evaluatePublication() {
  const fixture = D2_QUALITY_FIXTURES.publication
  const firstDocument = buildPublicationDocument(structuredClone(fixture))
  const secondDocument = buildPublicationDocument(structuredClone(fixture))
  const outputs = {
    markdown: renderMarkdown(firstDocument),
    html: renderHtml(firstDocument),
    jats: renderJats(firstDocument),
  }
  const repeated = {
    markdown: renderMarkdown(secondDocument),
    html: renderHtml(secondDocument),
    jats: renderJats(secondDocument),
  }
  const joined = Object.values(outputs).join('\n')
  const evidence = {
    canonicalTreeStable: same(firstDocument, secondDocument),
    serializersByteStable: same(outputs, repeated),
    allStructureCanariesPreserved: allTextContains(outputs, fixture.expectedCanaries),
    uiAndRawScriptsExcluded: !RAW_UI_OR_SCRIPT.test(joined),
    linksPreserved: /\[belegter Link\]\(https:\/\/example\.org\/source\?a=1&b=2\)/u.test(outputs.markdown)
      && /href="https:\/\/example\.org\/source\?a=1&amp;b=2"/u.test(outputs.html),
    footnotesPreserved: /\[\^fn-a\]/u.test(outputs.markdown)
      && /ref-type="fn" rid="fn-a"/u.test(outputs.jats),
    citationsPreserved: /\[@meyer2024, S\. 17\]/u.test(outputs.markdown)
      && /ref-type="bibr" rid="ref-meyer2024"/u.test(outputs.jats),
    hostileMarkupEscaped: !/(?<!\\)<script\b|(?<!\\)<img\s+src=x/iu.test(joined)
      && joined.includes('&lt;script&gt;CANARY-XSS&lt;/script&gt;'),
  }
  return {
    id: 'publication-fidelity',
    output: { document: firstDocument, formats: outputs },
    evidence,
    passed: Object.values(evidence).every(Boolean),
  }
}

function evaluateDataControl() {
  const fixture = structuredClone(D2_QUALITY_FIXTURES.localState)
  const original = structuredClone(fixture)
  const first = exportAllLocalData({ state: fixture, at: 100 })
  const second = exportAllLocalData({ state: fixture, at: 999 })
  const imported = importAllLocalData(first)
  const corrupted = structuredClone(first)
  corrupted.fingerprint = 'invalid'
  const corruptedResult = validateAllLocalDataExport(corrupted)
  const empty = emptyLocalState()
  const serialized = JSON.stringify(first)
  const evidence = {
    validRoundTrip: validateAllLocalDataExport(first).valid && same(imported, first.state),
    allDomainsDeclared: Object.values(first.manifest.domains).every(Boolean),
    expectedCoreCounts: first.manifest.counts.projects === 1
      && first.manifest.counts.texts === 1
      && first.manifest.counts.sources === 1,
    noSecretCanary: !serialized.includes('CANARY-SECRET'),
    deterministic: first.fingerprint === second.fingerprint
      && same(withoutTime(first, 'exportedAt'), withoutTime(second, 'exportedAt')),
    sourceStateUnchanged: same(fixture, original),
    corruptImportRejected: corruptedResult.valid === false
      && corruptedResult.category === 'fingerprint',
    emptyStateComplete: empty.projects.length === 0
      && empty.docs.length === 0
      && empty.active === null
      && empty.activeProject === null
      && empty.memoryStore.records.length === 0,
  }
  return {
    id: 'complete-data-control',
    output: {
      payload: first,
      imported,
      corruptValidation: corruptedResult,
      empty,
    },
    evidence,
    passed: Object.values(evidence).every(Boolean),
  }
}

function evaluateAccessibilityAndUiContract() {
  const expected = D2_QUALITY_FIXTURES.accessibility
  const protocol = readFileSync(PROTOCOL_URL, 'utf8')
  const auditUi = readFileSync(AUDIT_UI_URL, 'utf8')
  const output = {
    automatedViews: (protocol.match(/\|\s*(?:Bibliothek|Editor|Projektverständnis|Quellenbibliothek|Quellenreader|Sprachdossier|Schlussaudit)\s*\|\s*0\s*\|\s*bestanden\s*\|/gu) || []).length,
    automatedViolations: /null Verstöße/iu.test(protocol) ? 0 : null,
    browserEngines: /Chromium, Firefox und WebKit/iu.test(protocol) ? 3 : 0,
    narrowViewportWidth: /390\s*[×x]\s*844/iu.test(protocol) ? 390 : null,
    zoomPercent: /200\s*Prozent/iu.test(protocol) ? 200 : null,
    minimumTargetPixels: /mindestens\s+44\s+Pixel/iu.test(protocol) ? 44 : null,
    realAssistiveTechnologyStudiesOpen: /bewusst offene reale Studien/iu.test(protocol)
      && /VoiceOver/iu.test(protocol)
      && /NVDA|JAWS/iu.test(protocol),
    riskConfirmationContract: /riskConfirmed\?\.addEventListener\('change'/u.test(auditUi)
      && /exportButton\.disabled = Boolean\(requiresRiskConfirmation\)/u.test(auditUi)
      && /if \(requiresRiskConfirmation && !riskConfirmed\?\.checked\) return/u.test(auditUi),
    auditStatusPreservedCopy: /Der Auditstatus blieb/u.test(auditUi),
    deletionGuardedByValidatedExport: /deleteLocal\.disabled = true/u.test(auditUi)
      && /securedExportFingerprint/u.test(auditUi)
      && /validateAllLocalDataExport/u.test(auditUi)
      && /LÖSCHEN/u.test(auditUi),
  }
  const evidence = {
    measuredValuesMatchProtocol: output.automatedViews === expected.automatedViews
      && output.automatedViolations === expected.automatedViolations
      && output.browserEngines === expected.browserEngines
      && output.narrowViewportWidth === expected.narrowViewportWidth
      && output.zoomPercent === expected.zoomPercent
      && output.minimumTargetPixels === expected.minimumTargetPixels,
    limitationsHonest: output.realAssistiveTechnologyStudiesOpen,
    riskRequiresExplicitConfirmation: output.riskConfirmationContract,
    riskDoesNotRewriteAudit: output.auditStatusPreservedCopy,
    deletionIsGuarded: output.deletionGuardedByValidatedExport,
  }
  return {
    id: 'accessible-controlled-workflow',
    output,
    evidence,
    passed: Object.values(evidence).every(Boolean),
  }
}

function contextContrast({ cases, publication, authorship, dataControl }) {
  const scientific = cases.find(item => item.id === 'scientific-integrity')?.output
  const publicationText = Object.values(publication.output.formats).join('\n')
  const dataText = JSON.stringify(dataControl.output.payload)
  const contextSignals = {
    criticalBlockerOverridesStyle: scientific?.status === 'blocked'
      && scientific.blockers.length >= 5
      && scientific.blockers.every(item => !['wording', 'register', 'style'].includes(item.category)),
    readyVerdictClaimed: READY_VERDICT.test(JSON.stringify(scientific)),
    originProbabilityClaimed: FORBIDDEN_ORIGIN_LANGUAGE.test(JSON.stringify(authorship.output)),
    rawUiOrScriptExported: RAW_UI_OR_SCRIPT.test(publicationText),
    secretExported: dataText.includes('CANARY-SECRET'),
  }
  const naiveOutput = naiveCompletionOutput(D2_QUALITY_FIXTURES)
  const naiveText = JSON.stringify(naiveOutput)
  const naiveSignals = {
    criticalBlockerOverridesStyle: naiveOutput.audit.status === 'blocked'
      && naiveOutput.audit.blockers.length > 0,
    readyVerdictClaimed: READY_VERDICT.test(naiveText),
    originProbabilityClaimed: FORBIDDEN_ORIGIN_LANGUAGE.test(naiveText),
    rawUiOrScriptExported: RAW_UI_OR_SCRIPT.test(naiveText),
    secretExported: naiveText.includes('CANARY-SECRET'),
  }
  const positive = signals => ({
    criticalBlockerOverridesStyle: signals.criticalBlockerOverridesStyle,
    noReadyVerdict: !signals.readyVerdictClaimed,
    noOriginProbability: !signals.originProbabilityClaimed,
    uiFreeSafePublication: !signals.rawUiOrScriptExported,
    secretFreeData: !signals.secretExported,
  })
  return {
    contextAware: {
      ...contextSignals,
      score: scoreSignals(positive(contextSignals)),
    },
    naiveCompletion: {
      ...naiveSignals,
      output: naiveOutput,
      score: scoreSignals(positive(naiveSignals)),
    },
  }
}

export function runD2QualityEvals() {
  const auditCases = evaluateAuditCases()
  const store = evaluateReproducibleAuditStore(
    auditCases.find(item => item.id === 'scientific-integrity'),
  )
  const authorship = evaluateAuthorship()
  const publication = evaluatePublication()
  const dataControl = evaluateDataControl()
  const accessibilityCase = evaluateAccessibilityAndUiContract()
  const cases = [
    ...auditCases,
    authorship,
    publication,
    dataControl,
    accessibilityCase,
  ]
  const dimensions = {
    integrityGateCorrectness: auditCases.every(item => item.passed)
      && accessibilityCase.evidence.riskRequiresExplicitConfirmation
      && accessibilityCase.evidence.riskDoesNotRewriteAudit ? 5 : 0,
    reproducibilityAndVersioning: auditCases.every(item => item.evidence.deterministic)
      && store.passed
      && publication.evidence.serializersByteStable
      && dataControl.evidence.deterministic ? 5 : 0,
    authorshipAndProvenanceHonesty: authorship.passed ? 5 : 0,
    publicationFidelity: publication.passed ? 5 : 0,
    userControlAccessibilityPrivacy: dataControl.passed && accessibilityCase.passed ? 5 : 0,
  }
  const score = Number((
    Object.values(dimensions).reduce((sum, value) => sum + value, 0)
    / Object.keys(dimensions).length
  ).toFixed(2))
  const contrast = contextContrast({ cases: auditCases, publication, authorship, dataControl })
  const accessibility = accessibilityCase.output
  const completeOutputs = cases.map(item => item.output)
  const passed = score >= 4.5
    && Object.values(dimensions).every(value => value >= 4)
    && cases.every(item => item.passed)
    && contrast.contextAware.score >= 4.5
    && contrast.naiveCompletion.score <= 1
  return {
    evalIds: [...REQUIRED_D2_EVALS],
    cases,
    store,
    dimensions,
    score,
    contrast,
    accessibility,
    completeOutputs,
    passed,
  }
}

const result = runD2QualityEvals()
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  if (!result.passed) process.exitCode = 1
}
