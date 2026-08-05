#!/usr/bin/env node

// Die Gesamtbewertung ist kein umetikettierter Testabdeckungswert. Jede Dimension wird aus
// mehreren eigenstaendigen Gold-, Kontrast- oder Vollausgabe-Scorern gebildet. Zwei Werte
// bleiben bewusst bei 4,5 gedeckelt: erlebte Ruhe und assistive Nutzung koennen automatisiert
// sehr gut vorbereitet, aber nicht als menschliche Erfahrung bewiesen werden.

import { assessSourceForClaim } from '../src/evidence-bundle.mjs'
import { aktuellerMoment, darfErscheinen, INNEHALTEN_MS } from '../src/momente-model.mjs'
import { EVIDENZQUALITAET_GOLD, scoreEvidenzqualitaet } from './fixtures/evidenzqualitaet.mjs'
import { researchQualityFixtures } from './fixtures/recherchequalitaet.mjs'
import { argumentPathQualityFixtures, counterargumentQualityFixtures } from './fixtures/argumentqualitaet.mjs'
import { evaluateResearchQuality } from './run-b2-quality.mjs'
import { evaluateArgumentPathQuality, evaluateCounterargumentQuality } from './run-c2-quality.mjs'
import { runD1QualityEvals } from './run-d1-quality.mjs'
import { runD2QualityEvals } from './run-d2-quality.mjs'

function mittel(...werte) {
  return Number((werte.reduce((summe, wert) => summe + wert, 0) / werte.length).toFixed(2))
}

function calmContractScore() {
  const mittenImSchreiben = aktuellerMoment({ jetzt: 1000, lastInputAt: 999 }) === 'sofort'
  const kurzePause = aktuellerMoment({ jetzt: 10_000, lastInputAt: 10_000 - INNEHALTEN_MS + 1 }) === 'sofort'
  const strukturWartet = !darfErscheinen('struktur', 'sofort') && !darfErscheinen('struktur', 'innehalten')
  const spracheBleibt = darfErscheinen('sprache', 'sofort') && darfErscheinen('sprache', 'aufschauen')
  return mittenImSchreiben && kurzePause && strukturWartet && spracheBleibt ? 5 : 0
}

export function runQualityRubric() {
  const evidence = scoreEvidenzqualitaet(EVIDENZQUALITAET_GOLD.map(gold => assessSourceForClaim(gold.input)))
  const research = evaluateResearchQuality(researchQualityFixtures)
  const counterargument = evaluateCounterargumentQuality(counterargumentQualityFixtures)
  const argumentPaths = evaluateArgumentPathQuality(argumentPathQualityFixtures)
  const languageEffect = runD1QualityEvals()
  const completion = runD2QualityEvals()
  const calmContract = calmContractScore()

  const scoredEvalScores = {
    'EVID-04': evidence.score,
    'RESEARCH-05': research.score,
    'ARG-04': counterargument.score,
    'ARG-07': argumentPaths.score,
    'EFFECT-01': languageEffect.dimensions.contextFidelity,
    'EFFECT-02': languageEffect.dimensions.functionAndRhetoricFit,
    'EFFECT-03': mittel(
      languageEffect.dimensions.functionAndRhetoricFit,
      languageEffect.dimensions.fairnessAndHonestUncertainty,
    ),
  }
  const scoredEvalRationales = {
    'EVID-04': `Claim-spezifische Goldfälle und Negativkontraste: ${evidence.score}/5.`,
    'RESEARCH-05': `Recherche-Goldfälle für Priorisierung, Grenzen und Gegenbelege: ${research.score}/5.`,
    'ARG-04': `Kontrastfälle für belegte und faire Gegenargumente: ${counterargument.score}/5.`,
    'ARG-07': `Kontrastfälle für substanziell verschiedene Argumentwege: ${argumentPaths.score}/5.`,
    'EFFECT-01': `Vollausgaben bewahren Textart, Ziel und Passagefunktion: ${scoredEvalScores['EFFECT-01']}/5.`,
    'EFFECT-02': `Vollausgaben treffen Funktion und rhetorische Passung: ${scoredEvalScores['EFFECT-02']}/5.`,
    'EFFECT-03': `Rhetorische Passung und ehrliche Wirkungsunsicherheit kombiniert: ${scoredEvalScores['EFFECT-03']}/5.`,
  }

  const rubricScores = {
    truth: mittel(
      evidence.score,
      research.score,
      languageEffect.dimensions.statusAndEvidenceCalibration,
      languageEffect.dimensions.fairnessAndHonestUncertainty,
    ),
    authorship: mittel(
      languageEffect.dimensions.meaningProtection,
      completion.dimensions.authorshipAndProvenanceHonesty,
    ),
    usefulness: mittel(research.score, counterargument.score, argumentPaths.score),
    calm: Math.min(4.5, mittel(calmContract, completion.dimensions.userControlAccessibilityPrivacy)),
    reliability: mittel(
      evidence.score,
      completion.dimensions.reproducibilityAndVersioning,
      languageEffect.dimensions.statusAndEvidenceCalibration,
    ),
    access_privacy: Math.min(4.5, completion.dimensions.userControlAccessibilityPrivacy),
  }
  const weights = { truth: 0.25, authorship: 0.2, usefulness: 0.15, calm: 0.15, reliability: 0.15, access_privacy: 0.1 }
  const weightedScore = Number(Object.entries(rubricScores)
    .reduce((summe, [id, score]) => summe + score * weights[id], 0).toFixed(2))
  const rubricRationales = {
    truth: 'Goldfälle bewerten claim-spezifische Quellenqualität, aktive Gegenbelegsuche, Evidenzkalibrierung und ehrliche Wirkungsunsicherheit.',
    authorship: 'Bedeutungsschutz und ein vollständiger Autorschaftsnachweis werden an kontrastierenden Vollausgaben geprüft.',
    usefulness: 'Recherchepriorisierung, belegtes Gegenargument und substanziell verschiedene Argumentwege müssen ihre eigenen Rubriken bestehen.',
    calm: 'Der echte Moment-Mechanismus hält Struktur beim Tippen zurück; wegen fehlender Langzeitbeobachtung der erlebten Ruhe ist der Wert auf 4,5 gedeckelt.',
    reliability: 'Claim-spezifische Bewertung, reproduzierbare Audits und Statuskalibrierung werden aus unabhängigen Scorern kombiniert.',
    access_privacy: 'Automatisierte Drei-Engine-, Zoom-, Zielgrößen-, Export- und Geheimnisprüfungen bestehen; echte assistive Nutzung bleibt extern, daher Deckel 4,5.',
  }
  const components = { evidence, research, counterargument, argumentPaths, languageEffect, completion, calmContract }
  const allScoredPass = Object.values(scoredEvalScores).every(score => score >= 4)
  const passed = allScoredPass
    && weightedScore >= 4.5
    && Object.values(rubricScores).every(score => score >= 4)
    && [evidence, research, counterargument, argumentPaths, languageEffect, completion].every(result => result.passed)

  return { scoredEvalScores, scoredEvalRationales, rubricScores, rubricRationales, weightedScore, components, passed }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const ergebnis = runQualityRubric()
  process.stdout.write(`${JSON.stringify(ergebnis, null, 2)}\n`)
  if (!ergebnis.passed) process.exitCode = 1
}
