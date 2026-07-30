function finding(id, category, status, priority = 'normal', overrides = {}) {
  return {
    id,
    category,
    status,
    priority,
    short: `${category} ${status}`,
    target: `${id} Ziel`,
    provenance: { actor: 'agent', action: 'quality-fixture-assessment' },
    createdAt: 10,
    ...overrides,
  }
}

function auditProject(id, genre) {
  return {
    id,
    languageProfile: {
      projectId: id,
      genre,
      citationStyle: '',
    },
    argumentModel: {
      projectId: id,
      claims: [],
      relations: [],
      findings: [],
      events: [],
      deliberationRounds: [],
    },
    sources: [],
    evidenceBundles: [],
    citations: [],
    citationUses: [],
    bibliography: [],
    languageReports: {
      projectId: id,
      byText: {},
      history: [],
      decisions: [],
    },
  }
}

function scientificIntegrityCase() {
  const project = auditProject('d2-science', 'scientific')
  const doc = {
    id: 'd2-science:text',
    projectId: project.id,
    title: 'Wissenschaftlicher Prüftext',
    findings: [
      finding('critical-fact', 'fact', 'open', 'critical'),
      finding('critical-source', 'source', 'open', 'critical'),
      finding('critical-citation', 'citation', 'open', 'critical'),
      finding('critical-method', 'method', 'open', 'critical', { rootCauseId: 'critical-fact' }),
      finding('critical-logic', 'logic', 'open', 'critical'),
      finding('accepted-citation-risk', 'citation', 'risk-accepted', 'critical'),
      finding('resolved-wording', 'wording', 'resolved'),
      finding('dismissed-content', 'content', 'dismissed'),
      finding('superseded-style', 'style', 'superseded'),
    ],
    decisions: [],
  }
  return {
    id: 'scientific-integrity',
    project,
    docs: [doc],
    textId: doc.id,
    expected: {
      status: 'blocked',
      groupOrder: ['integrity', 'evidence', 'citation', 'accepted-risk', 'other', 'style'],
      blockerSources: [
        'critical-citation',
        'critical-fact',
        'critical-logic',
        'critical-method',
        'critical-source',
      ],
      statuses: ['open', 'parked', 'resolved', 'dismissed', 'risk-accepted', 'superseded'],
    },
  }
}

function acceptedRiskCase() {
  const project = auditProject('d2-risk', 'scientific')
  const doc = {
    id: 'd2-risk:text',
    projectId: project.id,
    title: 'Bewusst angenommener Stand',
    findings: [
      finding('risk-source', 'source', 'risk-accepted', 'critical'),
      finding('resolved-style', 'style', 'resolved'),
    ],
    decisions: [],
  }
  return {
    id: 'accepted-risk',
    project,
    docs: [doc],
    textId: doc.id,
    expected: {
      status: 'review-required',
      acceptedRiskCount: 1,
      blockerCount: 0,
    },
  }
}

function cleanEssayCase() {
  const project = auditProject('d2-essay', 'essay')
  const doc = {
    id: 'd2-essay:text',
    projectId: project.id,
    title: 'Blockerfreier Essay',
    findings: [
      finding('resolved-language', 'wording', 'resolved'),
      finding('resolved-structure', 'structure', 'resolved'),
    ],
    decisions: [],
  }
  return {
    id: 'clean-essay',
    project,
    docs: [doc],
    textId: doc.id,
    expected: {
      status: 'clear-of-hard-blockers',
      blockerCount: 0,
      userDecisionPattern: /Publikationsentscheidung bleibt beim Nutzer/iu,
    },
  }
}

function authorshipCase() {
  const project = auditProject('d2-authorship', 'essay')
  project.languageReports.decisions.push({
    id: 'review-effect',
    projectId: project.id,
    textId: 'd2-authorship:text',
    findingId: 'effect-a',
    entityKind: 'effect-passage',
    kind: 'finding-decision',
    decision: 'reviewed',
    provenance: { actor: 'user', action: 'language-finding-review' },
    at: 40,
  })
  const doc = {
    id: 'd2-authorship:text',
    projectId: project.id,
    title: 'Gemischte Beiträge',
    updated: 50,
    provenance: { actor: 'user', action: 'document-create', createdAt: 1 },
    findings: [
      finding('proposal-adopted', 'wording', 'resolved', 'normal', {
        action: 'Wortgleicher Agentenvorschlag.',
      }),
      finding('proposal-edited', 'wording', 'resolved', 'normal', {
        action: 'Ausgangsfassung des Agenten.',
      }),
      finding('proposal-rejected', 'wording', 'dismissed', 'normal', {
        action: 'Nicht übernommener Agentenvorschlag.',
      }),
      finding('analysis-open', 'structure', 'open'),
    ],
    decisions: [
      {
        id: 'decision-adopted',
        findingId: 'proposal-adopted',
        kind: 'accept',
        appliedText: 'Wortgleicher Agentenvorschlag.',
        resultingText: 'Wortgleicher Agentenvorschlag.',
        at: 20,
      },
      {
        id: 'decision-edited',
        findingId: 'proposal-edited',
        kind: 'accept',
        appliedText: 'Vom Nutzer überarbeitete Fassung.',
        resultingText: 'Vom Nutzer überarbeitete Fassung.',
        at: 21,
      },
      {
        id: 'decision-rejected',
        findingId: 'proposal-rejected',
        kind: 'reject',
        appliedText: '',
        resultingText: 'Eigene Fassung.',
        at: 22,
      },
    ],
  }
  return {
    project,
    docs: [doc],
    expectedKinds: [
      'user-original',
      'agent-proposal-adopted',
      'agent-proposal-edited',
      'agent-proposal-not-adopted',
      'agent-analysis',
      'user-review-decision',
    ],
  }
}

function publicationCase() {
  return {
    projectId: 'd2-publication',
    textId: 'd2-publication:text',
    title: 'Prüfung & Publikation',
    editorJson: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2, class: 'agentWidget CANARY-UI' },
          content: [{ type: 'text', text: 'Ergebnisübersicht' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Ein ' },
            {
              type: 'text',
              text: 'belegter Link',
              marks: [{
                type: 'link',
                attrs: {
                  href: 'https://example.org/source?a=1&b=2',
                  onclick: 'CANARY-SCRIPT',
                },
              }],
            },
            { type: 'text', text: ' mit ' },
            {
              type: 'text',
              text: 'Fußnote A',
              marks: [{ type: 'footnoteReference', attrs: { id: 'fn-a' } }],
            },
            { type: 'text', text: ' und ' },
            {
              type: 'text',
              text: 'Meyer 2024',
              marks: [{ type: 'citation', attrs: { key: 'meyer2024' } }],
            },
            { type: 'text', text: '.' },
          ],
        },
        {
          type: 'bulletList',
          content: [{
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Listenpunkt' }],
              },
              {
                type: 'orderedList',
                attrs: { start: 3 },
                content: [{
                  type: 'listItem',
                  content: [{
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Unterpunkt' }],
                  }],
                }],
              },
            ],
          }],
        },
        {
          type: 'blockquote',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: 'Originalzitat' }],
          }],
        },
        {
          type: 'unknownWidget',
          attrs: {
            class: 'audit-dialog',
            html: '<script>CANARY-SCRIPT</script>',
          },
          content: [{ type: 'text', text: 'Erhaltener Klartext' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '<img src=x onerror=CANARY-XSS>' }],
        },
      ],
    },
    footnotes: [{
      id: 'fn-a',
      label: 'A',
      content: 'Fußnote A erklärt den Begriff.',
    }],
    citations: [{
      id: 'citation-a',
      key: 'meyer2024',
      label: 'Meyer 2024',
      locator: { page: '17' },
    }],
    bibliography: [{
      key: 'meyer2024',
      label: 'Meyer 2024',
      title: '<script>CANARY-XSS</script> Quellenlage',
      authors: ['Meyer, Ada'],
      year: '2024',
      url: 'https://example.org/source',
    }],
    expectedCanaries: [
      'Ergebnisübersicht',
      'Listenpunkt',
      'Unterpunkt',
      'Originalzitat',
      'Fußnote A',
      'Meyer 2024',
      'Erhaltener Klartext',
    ],
  }
}

function localStateCase() {
  return {
    schemaVersion: 12,
    active: 'd2-data:text',
    activeProject: 'd2-data',
    settings: {
      theme: 'paper',
      apiKey: 'CANARY-SECRET-API',
      nested: {
        authorization: 'CANARY-SECRET-AUTH',
        calm: true,
      },
    },
    memoryStore: {
      schemaVersion: 1,
      records: [{
        id: 'memory-a',
        projectId: 'd2-data',
        kind: 'understanding',
        snapshot: { task: 'Vollständiger Stand' },
        provenance: { actor: 'user', action: 'confirm' },
      }],
      events: [],
      sessions: [{
        id: 'session-a',
        sessionToken: 'CANARY-SECRET-SESSION',
      }],
    },
    projects: [{
      id: 'd2-data',
      name: 'Datenkontrolle',
      sources: [{
        id: 'source-a',
        projectId: 'd2-data',
        title: 'Quelle A',
        provenance: { actor: 'user', action: 'import' },
      }],
      evidenceBundles: [{
        id: 'bundle-a',
        projectId: 'd2-data',
        status: 'supported',
      }],
      researchRuns: [{
        id: 'research-a',
        projectId: 'd2-data',
        status: 'completed',
      }],
      argumentModel: {
        projectId: 'd2-data',
        claims: [],
        relations: [],
        findings: [],
        events: [{ id: 'argument-event' }],
        deliberationRounds: [],
      },
      languageReports: {
        projectId: 'd2-data',
        byText: {},
        history: [],
        decisions: [{ id: 'language-decision', textId: 'd2-data:text' }],
      },
      finalAudits: {
        projectId: 'd2-data',
        byText: {},
        history: [{ id: 'audit-event', textId: 'd2-data:text' }],
      },
    }],
    docs: [{
      id: 'd2-data:text',
      projectId: 'd2-data',
      title: 'Lokaler Text',
      body: '<p>Text</p>',
      decisions: [{ id: 'decision-a', findingId: 'finding-a', kind: 'accept' }],
      provenance: { actor: 'user', action: 'document-create' },
    }],
  }
}

export const D2_QUALITY_FIXTURES = Object.freeze({
  auditCases: [
    scientificIntegrityCase(),
    acceptedRiskCase(),
    cleanEssayCase(),
  ],
  authorship: authorshipCase(),
  publication: publicationCase(),
  localState: localStateCase(),
  accessibility: {
    automatedViews: 7,
    automatedViolations: 0,
    browserEngines: 3,
    narrowViewportWidth: 390,
    zoomPercent: 200,
    minimumTargetPixels: 44,
  },
})
