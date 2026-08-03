import {
  createArgumentClaim,
  createArgumentRelation,
  ensureArgumentModel,
} from '../../src/argument-model.mjs'

function context(projectId, known) {
  const required = ['genre', 'passageFunction', 'domain', 'audience', 'medium', 'goal', 'region']
  const missing = required.filter(field => {
    const value = known[field]
    return Array.isArray(value) ? !value.length : !value
  })
  return {
    projectId,
    complete: missing.length === 0,
    known: { houseStyle: [], ...known },
    missing,
    sources: {},
  }
}

function claim({ projectId, textId, id, blockId, text, evidenceStatus, centrality = 'central' }) {
  return createArgumentClaim({
    id,
    projectId,
    textId,
    anchor: { blockId, exact: text, start: 0, end: text.length },
    text,
    kind: 'fact',
    centrality,
    validity: 'asserted',
    evidenceStatus,
    uncertainty: evidenceStatus === 'supported' ? 'low' : 'high',
    evidenceRefs: evidenceStatus === 'supported' ? [{ bundleId: `${id}:bundle` }] : [],
    provenance: { actor: 'user', action: 'fixture-claim' },
    fingerprint: `${id}:fingerprint`,
    createdAt: 1,
  })
}

function scienceFixture() {
  const projectId = 'd1-science'
  const textId = 'd1-science:text'
  const claimText = 'Die Studie beweist zweifellos eine warscheinlich allgemeine Wirkung.'
  const central = claim({
    projectId,
    textId,
    id: 'd1-science:claim',
    blockId: 'd1-science:block:claim',
    text: claimText,
    evidenceStatus: 'unverified',
  })
  return {
    id: 'science-evidence-calibration',
    projectId,
    textId,
    context: context(projectId, {
      genre: 'scientific',
      passageFunction: 'discuss',
      domain: 'Psychologie',
      audience: ['Fachpublikum'],
      medium: 'academic-submission',
      goal: 'Befund und Grenze abwägen',
      region: 'DE',
      audienceState: {
        priorKnowledge: ['Methodische Grundbegriffe'],
        assumptions: ['Replikation ist relevant'],
        resistances: ['Sorge vor Überinterpretation'],
        commonGround: ['Unsicherheit muss sichtbar bleiben'],
      },
    }),
    blocks: [
      { id: central.anchor.blockId, type: 'paragraph', role: 'claim', text: claimText },
      { id: 'd1-science:block:evidence', type: 'paragraph', role: 'evidence', text: 'Die Messreihe zeigt einen Rückgang in einer kleinen Stichprobe.' },
    ],
    argumentModel: ensureArgumentModel({ argumentModel: { claims: [central] } }).argumentModel,
    expected: {
      languageClasses: ['norm-error'],
      modalityDirections: ['too-strong'],
      patternCount: 0,
      functions: ['position', 'substantiate'],
      deviceKinds: [],
      fairnessKinds: [],
    },
  }
}

function essayFixture() {
  const projectId = 'd1-essay'
  const textId = 'd1-essay:text'
  return {
    id: 'essay-functional-image',
    projectId,
    textId,
    context: context(projectId, {
      genre: 'essay',
      passageFunction: 'explain',
      domain: 'Literatur',
      audience: ['interessierte Leserinnen'],
      medium: 'print',
      goal: 'Perspektivwechsel nachvollziehen',
      region: 'AT',
      audienceState: {
        priorKnowledge: [],
        assumptions: ['Innensicht schafft Nähe'],
        resistances: [],
        commonGround: ['Erzählperspektive lenkt Wahrnehmung'],
      },
    }),
    blocks: [
      { id: 'd1-essay:block:one', type: 'paragraph', role: 'paragraph', text: 'Die Erinnerung arbeitet wie ein schmaler Lichtkegel und lässt den Rand bewusst dunkel.' },
      { id: 'd1-essay:block:two', type: 'paragraph', role: 'paragraph', text: 'Die Erzählerin erklärt ihre Entscheidung, weil sie nur diesen Ausschnitt kennt.' },
    ],
    argumentModel: ensureArgumentModel({ argumentModel: {} }).argumentModel,
    expected: {
      languageClasses: [],
      modalityDirections: [],
      patternCount: 0,
      functions: ['inform', 'explain'],
      deviceKinds: ['analogy'],
      fairnessKinds: [],
    },
  }
}

function projectFixture() {
  const projectId = 'd1-project'
  const textId = 'd1-project:text'
  return {
    id: 'project-empty-connectors',
    projectId,
    textId,
    context: context(projectId, {
      genre: 'project',
      passageFunction: 'explain',
      domain: 'Service Design',
      audience: ['Projektteam'],
      medium: 'screen',
      goal: 'Entscheidungsgrund erklären',
      region: 'CH',
      audienceState: {
        priorKnowledge: ['Projektstatus'],
        assumptions: [],
        resistances: ['Zeitdruck'],
        commonGround: ['Entscheidung braucht Begründung'],
      },
    }),
    blocks: [
      { id: 'd1-project:block:one', type: 'paragraph', role: 'paragraph', text: 'Darüber hinaus ist der Ansatz relevant.' },
      { id: 'd1-project:block:two', type: 'paragraph', role: 'paragraph', text: 'Darüber hinaus ist die Lösung innovativ.' },
      { id: 'd1-project:block:three', type: 'paragraph', role: 'paragraph', text: 'Darüber hinaus ist das Ergebnis bedeutsam.' },
    ],
    argumentModel: ensureArgumentModel({ argumentModel: {} }).argumentModel,
    expected: {
      languageClasses: [],
      modalityDirections: [],
      patternCount: 1,
      functions: ['inform', 'inform', 'inform'],
      deviceKinds: [],
      fairnessKinds: [],
    },
  }
}

function marketingFixture() {
  const projectId = 'd1-marketing'
  const textId = 'd1-marketing:text'
  const centralText = 'Das Angebot garantiert jeder Gemeinde sinkende Kosten.'
  const counterText = 'In kleinen Gemeinden stiegen die Folgekosten im ersten Jahr.'
  const central = claim({
    projectId,
    textId,
    id: 'd1-marketing:central',
    blockId: 'd1-marketing:block:central',
    text: centralText,
    evidenceStatus: 'unverified',
  })
  const counter = claim({
    projectId,
    textId: 'd1-marketing:other-text',
    id: 'd1-marketing:counter',
    blockId: 'd1-marketing:block:counter',
    text: counterText,
    evidenceStatus: 'supported',
    centrality: 'supporting',
  })
  const relation = createArgumentRelation({
    id: 'd1-marketing:counter-relation',
    projectId,
    fromClaimId: counter.id,
    toClaimId: central.id,
    type: 'counters',
    warrant: 'Die Folgekosten widersprechen der universellen Kostenzusage.',
    confidence: 'high',
    provenance: { actor: 'agent', action: 'fixture-relation' },
    createdAt: 2,
  }, { claims: [central, counter] })
  return {
    id: 'marketing-fairness-first',
    projectId,
    textId,
    context: context(projectId, {
      genre: 'marketing',
      passageFunction: 'activate',
      domain: 'kommunale Energie',
      audience: ['kommunale Entscheiderinnen'],
      medium: 'screen',
      goal: 'Angebot sachlich prüfen',
      region: 'DE',
      audienceState: {
        priorKnowledge: ['Beschaffungsprozess'],
        assumptions: ['Kostenkontrolle ist wichtig'],
        resistances: ['Folgekosten'],
        commonGround: ['Versorgungssicherheit'],
      },
    }),
    blocks: [{
      id: central.anchor.blockId,
      type: 'paragraph',
      role: 'claim',
      text: `${centralText} Nur heute: Du willst doch nicht schuld am Scheitern sein.`,
    }],
    argumentModel: ensureArgumentModel({
      argumentModel: { claims: [central, counter], relations: [relation] },
    }).argumentModel,
    expected: {
      languageClasses: [],
      modalityDirections: ['too-strong'],
      patternCount: 0,
      functions: ['position'],
      deviceKinds: [],
      fairnessKinds: [
        'unsupported-intensification',
        'omitted-counterinformation',
        'exploitative-personalization',
      ],
    },
  }
}

function swissFixture() {
  const projectId = 'd1-swiss'
  const textId = 'd1-swiss:text'
  return {
    id: 'swiss-legitimate-variant',
    projectId,
    textId,
    context: context(projectId, {
      genre: 'web',
      passageFunction: 'orient',
      domain: 'Mobilität',
      audience: ['Pendlerinnen'],
      medium: 'screen',
      goal: 'Weg finden',
      region: 'CH',
    }),
    blocks: [{ id: 'd1-swiss:block', type: 'paragraph', role: 'paragraph', text: 'Die Strasse zum Bahnhof bleibt offen — der Weg ist markiert.' }],
    argumentModel: ensureArgumentModel({ argumentModel: {} }).argumentModel,
    expected: {
      languageClasses: [],
      modalityDirections: [],
      patternCount: 0,
      functions: ['inform'],
      deviceKinds: [],
      fairnessKinds: [],
    },
  }
}

export const D1_QUALITY_FIXTURES = Object.freeze([
  scienceFixture(),
  essayFixture(),
  projectFixture(),
  marketingFixture(),
  swissFixture(),
])
