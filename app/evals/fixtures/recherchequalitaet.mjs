export const researchQualityFixtures = Object.freeze([
  {
    id: 'mixed-replication',
    output: {
      searchPaths: ['support', 'counter-evidence', 'limitations'],
      support: ['Die Originalstudie berichtet einen engen positiven Befund.'],
      counterEvidence: ['Eine Replikation findet für denselben Endpunkt keinen belastbaren Unterschied.'],
      limitations: ['Beide Stichproben sind klein und stammen aus Hochschulkontexten.'],
      notes: ['Die Befunde bleiben getrennt; ein Gesamteffekt wird nicht behauptet.'],
      priority: 'Zuerst Population und Messzeitpunkte vergleichen, danach Formulierungsstärke festlegen.',
    },
  },
  {
    id: 'honest-null-search',
    output: {
      searchPaths: ['support', 'counter-evidence', 'limitations'],
      support: ['Eine sichtbare Originalfundstelle stützt den engen historischen Claim.'],
      counterEvidence: [],
      limitations: ['Die Quelle belegt keine heutige Produktwirkung.'],
      notes: ['Die dokumentierte Gegenbelegsuche blieb ohne Fund; das ist kein Beweis für Abwesenheit.'],
      priority: 'Die Aussage auf die historische Zuschreibung begrenzen.',
    },
  },
  {
    id: 'metadata-only',
    output: {
      searchPaths: ['support', 'counter-evidence', 'limitations'],
      support: [],
      counterEvidence: [],
      limitations: ['Nur Metadaten und Abstract sichtbar; kein prüfbarer Originalausschnitt.'],
      notes: ['Nicht ausreichend belegt. Der Treffer bleibt Recherchematerial.'],
      priority: 'Legale Volltextfassung oder alternative Primärquelle suchen.',
    },
  },
])

export const insufficientEvidenceContrast = Object.freeze({
  evidence: {
    accessLevel: 'metadata',
    visibleOriginalExcerpt: null,
  },
  abstention: {
    answer: 'Nicht ausreichend belegt. Der Treffer bleibt Recherchematerial, bis eine Originalfundstelle sichtbar geprüft ist.',
    assertedFacts: [],
  },
  hallucination: {
    answer: 'Die Studie zeigt wahrscheinlich einen deutlichen positiven Effekt.',
    assertedFacts: ['Die Studie zeigt einen deutlichen positiven Effekt.'],
  },
  expectedWinner: 'abstention',
})
