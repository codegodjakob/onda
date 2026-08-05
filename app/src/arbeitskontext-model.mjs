// Budgetierte Projektion des bereits gebauten Arbeitswissens fuer Agentenlaeufe.
// Ein ContextItem behaelt Art, Geltungsbereich, Autoritaet, Unsicherheit und Herkunft;
// erst der Formatter macht daraus knappen Prompt-Text. Dadurch kann kein Kanal aus Versehen
// eine rohe, fremde oder veraltete Sammlung mitschicken.

const STANDARD_MAX_ITEMS = 18
const STANDARD_MAX_CHARS = 4800
const MAX_ITEM_CHARS = 620

function objekt(wert) {
  return Boolean(wert) && typeof wert === 'object' && !Array.isArray(wert)
}

function text(wert) {
  return typeof wert === 'string' ? wert.trim().replace(/\s+/gu, ' ') : ''
}

function liste(wert) {
  return Array.isArray(wert) ? wert.map(eintrag => text(String(eintrag))).filter(Boolean) : []
}

function kuerze(wert, max = MAX_ITEM_CHARS) {
  const sauber = text(wert)
  return sauber.length <= max ? sauber : `${sauber.slice(0, max - 1).trimEnd()}…`
}

function neuesManifest() {
  return {
    totalCandidates: 0,
    included: 0,
    usedChars: 0,
    excluded: { foreign: 0, inactive: 0, malformed: 0, duplicate: 0, budget: 0 },
  }
}

function herkunft(wert, fallback) {
  if (objekt(wert?.provenance)) {
    return [text(wert.provenance.actor), text(wert.provenance.action)].filter(Boolean).join(':') || fallback
  }
  return fallback
}

function item({ kind, id, text: inhalt, priority, authority, uncertainty, provenance, scope }) {
  return {
    kind,
    id: text(id),
    scope,
    authority,
    uncertainty,
    provenance,
    sensitivity: 'standard',
    priority,
    text: kuerze(inhalt),
  }
}

function leer(manifest = neuesManifest()) {
  return { items: [], manifest }
}

function reportSammlungen(report) {
  if (!objekt(report)) return []
  const basis = { scope: 'current-text', authority: 'derived', uncertainty: 'context-dependent' }
  return [
    ...((Array.isArray(report.diagnostics) ? report.diagnostics : []).map(eintrag => item({
      ...basis, kind: 'diagnostic', id: eintrag?.id,
      priority: eintrag?.confidence === 'high' ? 88 : 70,
      uncertainty: text(eintrag?.confidence) || basis.uncertainty,
      provenance: herkunft(eintrag, 'agent:language-diagnostic'),
      text: [eintrag?.label, eintrag?.message, eintrag?.reason, eintrag?.reviewQuestion].map(text).filter(Boolean).join(' — '),
    }))),
    ...((Array.isArray(report.effect?.passages) ? report.effect.passages : []).map(eintrag => item({
      ...basis, kind: 'effect', id: eintrag?.id, priority: 72,
      uncertainty: text(eintrag?.status) || 'hypothesis',
      provenance: herkunft(eintrag, 'agent:effect-analysis'),
      text: [`Funktion ${text(eintrag?.function)}`, eintrag?.rationale, eintrag?.statusReason].map(text).filter(Boolean).join(' — '),
    }))),
    ...((Array.isArray(report.rhetoric?.devices) ? report.rhetoric.devices : []).map(eintrag => item({
      ...basis, kind: 'rhetoric', id: eintrag?.id, priority: 68,
      uncertainty: text(eintrag?.effectStatus) || 'hypothesis',
      provenance: herkunft(eintrag, 'agent:rhetoric-analysis'),
      text: [eintrag?.kind, eintrag?.function, eintrag?.expectedGain, eintrag?.possibleMisconception, eintrag?.reason].map(text).filter(Boolean).join(' — '),
    }))),
    ...((Array.isArray(report.fairness?.findings) ? report.fairness.findings : []).map(eintrag => item({
      ...basis, kind: 'fairness', id: eintrag?.id, priority: 76,
      uncertainty: text(eintrag?.confidence) || basis.uncertainty,
      provenance: herkunft(eintrag, 'agent:fairness-analysis'),
      text: [eintrag?.label, eintrag?.message, eintrag?.reason, eintrag?.reviewQuestion].map(text).filter(Boolean).join(' — '),
    }))),
  ]
}

export function baueArbeitskontext({
  project,
  doc,
  maxItems = STANDARD_MAX_ITEMS,
  maxChars = STANDARD_MAX_CHARS,
} = {}) {
  const manifest = neuesManifest()
  const projektId = text(project?.id)
  const textId = text(doc?.id)
  if (!objekt(project) || !projektId || !objekt(doc) || !textId) return leer(manifest)
  if (text(doc.projectId) && doc.projectId !== projektId) {
    manifest.excluded.foreign += 1
    return leer(manifest)
  }

  const kandidaten = []
  const aufnehmen = kandidat => {
    manifest.totalCandidates += 1
    if (!kandidat?.id || !kandidat?.text) { manifest.excluded.malformed += 1; return }
    kandidaten.push(kandidat)
  }
  const ausschliessen = grund => {
    manifest.totalCandidates += 1
    manifest.excluded[grund] += 1
  }

  ;(Array.isArray(project.sources) ? project.sources : []).forEach(source => {
    if (!objekt(source) || (text(source.projectId) && source.projectId !== projektId)) { ausschliessen('foreign'); return }
    if (['retracted', 'superseded', 'stale', 'withdrawn'].includes(text(source.status))) { ausschliessen('inactive'); return }
    const titel = text(source.metadata?.title?.value) || text(source.title) || 'Quelle ohne Titel'
    aufnehmen(item({
      kind: 'source', id: source.id, priority: 78, scope: 'project', authority: 'original',
      uncertainty: text(source.status) || 'active', provenance: text(source.origin?.immutableRef) || herkunft(source, 'user:source-import'),
      text: `${titel}${text(source.type) ? ` · ${text(source.type)}` : ''}`,
    }))
  })

  ;(Array.isArray(project.evidenceBundles) ? project.evidenceBundles : []).forEach(bundle => {
    if (!objekt(bundle) || (text(bundle.projectId) && bundle.projectId !== projektId)) { ausschliessen('foreign'); return }
    if (['stale', 'withdrawn'].includes(text(bundle.status))) { ausschliessen('inactive'); return }
    const details = [
      text(bundle.claimText),
      `Belegstand: ${text(bundle.status) || 'unbestimmt'}`,
      ...liste(bundle.limitations).map(wert => `Grenze: ${wert}`),
      text(bundle.uncertainty) ? `Unsicherheit: ${text(bundle.uncertainty)}` : '',
      Array.isArray(bundle.counterEvidence) && bundle.counterEvidence.length ? `${bundle.counterEvidence.length} Gegenbeleg(e)` : '',
    ].filter(Boolean)
    aufnehmen(item({
      kind: 'evidence', id: bundle.id, priority: 96, scope: 'claim', authority: 'assembled-evidence',
      uncertainty: text(bundle.status) || 'unknown', provenance: herkunft(bundle, 'user:evidence-assemble'),
      text: details.join(' — '),
    }))
  })

  const claims = Array.isArray(project.argumentModel?.claims) ? project.argumentModel.claims : []
  const aktiveClaims = new Map(claims.filter(claim => (
    objekt(claim)
    && (!text(claim.projectId) || claim.projectId === projektId)
    && !['stale', 'withdrawn'].includes(text(claim.status))
    && text(claim.validity) !== 'withdrawn'
  )).map(claim => [text(claim.id), claim]))

  ;(Array.isArray(project.argumentModel?.relations) ? project.argumentModel.relations : []).forEach(relation => {
    if (!objekt(relation) || (text(relation.projectId) && relation.projectId !== projektId)) { ausschliessen('foreign'); return }
    const von = aktiveClaims.get(text(relation.fromClaimId))
    const zu = aktiveClaims.get(text(relation.toClaimId))
    if (!von || !zu) { ausschliessen('inactive'); return }
    const lokal = von.textId === textId || zu.textId === textId
    aufnehmen(item({
      kind: 'relation', id: relation.id, priority: lokal ? 92 : 64, scope: lokal ? 'current-text' : 'project',
      authority: 'derived-relation', uncertainty: text(relation.confidence) || 'unknown',
      provenance: herkunft(relation, 'agent:argument-derived'),
      text: `${text(von.text)} — ${text(relation.type) || 'verbunden'} → ${text(zu.text)}${text(relation.warrant) ? ` — Begründung: ${text(relation.warrant)}` : ''}`,
    }))
  })

  const report = project.languageReports?.byText?.[textId]
  if (objekt(report)) {
    if (report.projectId !== projektId || report.textId !== textId) {
      ausschliessen('foreign')
    } else {
      reportSammlungen(report).forEach(eintrag => aufnehmen(eintrag))
    }
  }
  Object.entries(objekt(project.languageReports?.byText) ? project.languageReports.byText : {})
    .filter(([andererTextId]) => andererTextId !== textId)
    .forEach(() => ausschliessen('foreign'))

  kandidaten.sort((a, b) => b.priority - a.priority || a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id))
  const gesehen = new Set()
  const items = []
  const itemLimit = Number.isInteger(maxItems) && maxItems > 0 ? maxItems : STANDARD_MAX_ITEMS
  const charLimit = Number.isInteger(maxChars) && maxChars > 0 ? maxChars : STANDARD_MAX_CHARS
  for (const kandidat of kandidaten) {
    const schluessel = `${kandidat.kind}:${kandidat.id}`
    if (gesehen.has(schluessel)) { manifest.excluded.duplicate += 1; continue }
    gesehen.add(schluessel)
    if (items.length >= itemLimit || manifest.usedChars + kandidat.text.length > charLimit) {
      manifest.excluded.budget += 1
      continue
    }
    items.push(kandidat)
    manifest.usedChars += kandidat.text.length
  }
  manifest.included = items.length
  return { items, manifest }
}

const LABEL = Object.freeze({
  source: 'Quelle',
  evidence: 'Belegbündel',
  relation: 'Argumentbeziehung',
  diagnostic: 'Sprachdiagnose',
  effect: 'Wirkungshypothese',
  rhetoric: 'Rhetorische Wirkung',
  fairness: 'Fairnesshinweis',
})

export function formatiereArbeitskontext(ergebnis) {
  const items = Array.isArray(ergebnis?.items) ? ergebnis.items : []
  if (!items.length) return ''
  const zeilen = items.map(eintrag => (
    `- ${LABEL[eintrag.kind] || eintrag.kind}: ${eintrag.text} `
    + `[Geltung: ${eintrag.scope}; Sicherheit: ${eintrag.uncertainty}; Herkunft: ${eintrag.provenance}]`
  ))
  const ausgelassen = Object.values(ergebnis.manifest?.excluded || {}).reduce((summe, anzahl) => summe + anzahl, 0)
  return 'Arbeitsdossier — nur aktives, projektzugehöriges und budgetiertes Wissen. '
    + 'Wirkungs- und Rhetorikaussagen bleiben Hypothesen; Quellen- und Belegstand nie hochstufen.\n'
    + zeilen.join('\n')
    + (ausgelassen ? `\nManifest: ${items.length} enthalten, ${ausgelassen} ausgeschlossen oder gekürzt.` : '')
}
