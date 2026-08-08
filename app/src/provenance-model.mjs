// Wer hat was geschrieben — PUR, node-testbar, kein DOM.
//
// Baut die Übersicht über ein Projekt, in der bei jedem Stück steht, woher es kommt:
// eigener Text, Einschätzung des Agenten, übernommenes Wissen. Wo die Herkunft fehlt,
// steht ausdrücklich "unknown" statt einer stillen Annahme.
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js), verwendet von authorship-proof.mjs.
const KNOWLEDGE_STATUSES = new Set(['supported', 'mixed'])

function provenanceOf(candidate, fallbackAction) {
  const value = candidate && typeof candidate === 'object' && !Array.isArray(candidate)
    ? candidate
    : {}
  return {
    actor: typeof value.actor === 'string' && value.actor.trim() ? value.actor.trim() : 'unknown',
    action: typeof value.action === 'string' && value.action.trim() ? value.action.trim() : fallbackAction,
  }
}

function record({ id, projectId, kind, provenance, fallbackAction, createdAt = null, status = null, sourceIds = [] }) {
  const origin = provenanceOf(provenance, fallbackAction)
  return {
    id,
    projectId,
    kind,
    actor: origin.actor,
    action: origin.action,
    createdAt: Number.isFinite(createdAt) ? createdAt : null,
    status,
    sourceIds: [...new Set(sourceIds.filter(value => typeof value === 'string' && value.trim()))],
  }
}

export function buildProjectProvenanceSnapshot({ project, docs = [] } = {}) {
  if (!project?.id) throw new TypeError('Project is required')
  const projectId = project.id
  const records = []

  docs.filter(doc => doc?.projectId === projectId).forEach(doc => {
    records.push(record({
      id: doc.id,
      projectId,
      kind: 'user-text',
      provenance: doc.provenance,
      fallbackAction: 'document-create',
      createdAt: doc.updated,
    }))
    ;(Array.isArray(doc.findings) ? doc.findings : []).forEach(finding => {
      records.push(record({
        id: finding.id,
        projectId,
        kind: 'agent-assessment',
        provenance: finding.provenance,
        fallbackAction: 'assessment',
        createdAt: finding.createdAt,
      }))
    })
  })

  ;(Array.isArray(project.sources) ? project.sources : [])
    .filter(source => source?.projectId === projectId)
    .forEach(source => {
      records.push(record({
        id: source.id,
        projectId,
        kind: 'research-material',
        provenance: source.provenance,
        fallbackAction: 'import',
        createdAt: source.importedAt,
        status: source.status || null,
        sourceIds: [source.id],
      }))
      ;(Array.isArray(source.locators) ? source.locators : [])
        .filter(locator => locator?.projectId === projectId && locator?.sourceId === source.id)
        .forEach(locator => {
          records.push(record({
            id: locator.id,
            projectId,
            kind: 'source-locator',
            provenance: locator.provenance,
            fallbackAction: 'locator-create',
            status: locator.verification?.status || null,
            sourceIds: [source.id],
          }))
        })
    })

  ;(Array.isArray(project.evidenceBundles) ? project.evidenceBundles : [])
    .filter(bundle => bundle?.projectId === projectId)
    .forEach(bundle => {
      const references = [...(bundle.support || []), ...(bundle.counterEvidence || [])]
      const usableSupport = (bundle.support || []).length > 0 && (bundle.support || []).every(reference => reference?.usable === true)
      const verifiedKnowledge = KNOWLEDGE_STATUSES.has(bundle.status) && usableSupport
      records.push(record({
        id: bundle.id,
        projectId,
        kind: verifiedKnowledge ? 'verified-knowledge' : 'evidence-draft',
        provenance: bundle.provenance,
        fallbackAction: 'evidence-assemble',
        createdAt: bundle.createdAt,
        status: bundle.status || null,
        sourceIds: references.map(reference => reference?.sourceId),
      }))
    })

  return {
    schemaVersion: 1,
    projectId,
    generatedFrom: 'local-state',
    records,
  }
}
