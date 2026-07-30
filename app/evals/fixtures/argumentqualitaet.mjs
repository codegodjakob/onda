export const counterargumentQualityFixtures = Object.freeze([
  {
    id: 'science-replication',
    projectId: 'argument-science',
    central: {
      text: 'Die Intervention senkt die Fehlerrate allgemein.',
      evidenceStatus: 'mixed',
    },
    support: {
      text: 'In der Hauptstudie sank die Fehlerrate nach einer Sitzung.',
      evidenceStatus: 'supported',
    },
    counter: {
      text: 'Die unabhängige Replikation fand für denselben Endpunkt keinen belastbaren Unterschied.',
      evidenceStatus: 'mixed',
      limitations: ['Die Replikation ist klein und auf einen Hochschulkontext begrenzt.'],
    },
    definition: {
      text: 'Fehlerrate bezeichnet den Anteil falsch gelöster Aufgaben.',
      evidenceStatus: 'supported',
    },
  },
  {
    id: 'policy-distribution',
    projectId: 'argument-policy',
    central: {
      text: 'Das Förderprogramm verbessert grundsätzlich die kommunale Versorgung.',
      evidenceStatus: 'mixed',
    },
    support: {
      text: 'In den geförderten Zentren stieg die Zahl erreichbarer Beratungsstunden.',
      evidenceStatus: 'supported',
    },
    counter: {
      text: 'In dünn besiedelten Regionen sank die mittlere Anfahrtszeit trotz Förderung nicht.',
      evidenceStatus: 'supported',
      limitations: ['Die Regionalauswertung umfasst nur den ersten Förderzeitraum.'],
    },
    definition: {
      text: 'Versorgung meint hier erreichbare Beratungsstunden und Anfahrtszeit.',
      evidenceStatus: 'supported',
    },
  },
  {
    id: 'essay-narrative-effect',
    projectId: 'argument-essay',
    central: {
      text: 'Die Ich-Erzählung schafft immer größere Nähe zur Hauptfigur.',
      evidenceStatus: 'mixed',
    },
    support: {
      text: 'Die Innensicht macht die unmittelbaren Zweifel der Hauptfigur sichtbar.',
      evidenceStatus: 'supported',
    },
    counter: {
      text: 'Die unzuverlässige Selbstbeschreibung lässt zentrale Motive der Hauptfigur absichtlich offen.',
      evidenceStatus: 'mixed',
      limitations: ['Der Gegenbefund betrifft vor allem die zweite Hälfte des Romans.'],
    },
    definition: {
      text: 'Nähe bezeichnet hier den nachvollziehbaren Zugang zu Motiven.',
      evidenceStatus: 'supported',
    },
  },
  {
    id: 'honest-no-countermaterial',
    projectId: 'argument-abstention',
    central: {
      text: 'Der historische Brief belegt eine bewusste Strategie.',
      evidenceStatus: 'supported',
    },
    support: {
      text: 'Der Brief nennt die beabsichtigte Reihenfolge der öffentlichen Schritte.',
      evidenceStatus: 'supported',
    },
    counter: null,
    definition: null,
  },
])

export const argumentPathQualityFixtures = Object.freeze(
  counterargumentQualityFixtures.filter(fixture => fixture.counter && fixture.definition),
)

export const counterargumentContrast = Object.freeze({
  fixture: counterargumentQualityFixtures[0],
  strawman: {
    status: 'found',
    counterClaim: {
      text: 'Manche Menschen mögen Interventionen grundsätzlich nicht.',
      evidenceRefs: [],
    },
    relation: {
      type: 'counters',
      warrant: 'Das widerspricht der These irgendwie.',
    },
    evidenceRefs: [],
    limitations: [],
    impact: {
      targetClaimId: 'central',
      effect: 'reconsider',
      reason: 'Die These könnte falsch sein.',
    },
  },
  expectedWinner: 'grounded',
})
