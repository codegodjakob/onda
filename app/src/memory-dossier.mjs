// Das Projekt-Dossier: was Onda über ein Projekt weiß, in lesbarer Ordnung — PUR,
// node-testbar, kein DOM.
//
// Sammelt die Gedächtnis-Ereignisse (memory-model.mjs) zu Abschnitten wie Zielen,
// bestätigten Begriffen, Quellen und Autorentscheidungen. Jede Zeile bleibt korrigierbar,
// und eine Korrektur überschreibt nichts: sie wird als weiteres Ereignis angehängt.
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js), angezeigt über memory-ui.mjs.
import {
  appendMemoryEvent,
  createMemoryEvent,
  ensureMemoryStore,
  ensureProjectMemoryShape,
} from './memory-model.mjs'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function safeAt(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback
}

function latestHistoryEvent(history) {
  return (Array.isArray(history) ? history : [])
    .slice()
    .sort((a, b) => safeAt(a?.at) - safeAt(b?.at) || String(a?.id || a?.eventId || '').localeCompare(String(b?.id || b?.eventId || '')))
    .at(-1) || null
}

function addEventIfMissing(store, input) {
  if (store.events.some(event => event?.id === input.id)) return store
  return appendMemoryEvent(store, createMemoryEvent(input))
}

function captureEvents({ project, docs, store }) {
  let next = clone(ensureMemoryStore(clone(store)))
  const understanding = project.understanding || {}
  const understandingAt = safeAt(understanding.updatedAt, safeAt(project.created))
  next = addEventIfMissing(next, {
    id: `memory-event:understanding:${project.id}:${understandingAt}`,
    projectId: project.id,
    kind: 'understanding',
    entityId: project.id,
    snapshot: {
      task: text(understanding.task),
      audience: Array.isArray(understanding.audience) ? understanding.audience.map(text).filter(Boolean) : [],
      desiredEffect: text(understanding.desiredEffect),
      evidenceStandard: text(understanding.evidenceStandard),
    },
    provenance: { actor: 'user', action: 'project-understanding' },
    sensitivity: 'standard',
    at: understandingAt,
  })

  ;(project.memoryTerms || []).forEach((term, index) => {
    const at = safeAt(term.updatedAt, index)
    next = addEventIfMissing(next, {
      id: `memory-event:term:${project.id}:${term.id || index}:${at}`,
      projectId: project.id,
      kind: 'term-confirmed',
      entityId: term.id || `term-${index}`,
      snapshot: { term: text(term.term), meaning: text(term.meaning) },
      provenance: { actor: 'user', action: 'term-confirm' },
      sensitivity: 'standard',
      at,
    })
  })

  ;(project.sources || []).forEach((source, index) => {
    const historyEvent = latestHistoryEvent(source.history)
    const at = safeAt(historyEvent?.at, safeAt(source.importedAt, index))
    const revision = historyEvent?.id || source.checksumSha256 || at
    next = addEventIfMissing(next, {
      id: `memory-event:source:${project.id}:${source.id}:${revision}:${source.status || 'active'}`,
      projectId: project.id,
      kind: 'source',
      entityId: source.id,
      snapshot: {
        title: text(source.metadata?.title?.value) || 'Quelle ohne Titel',
        status: source.status || 'active',
        checksumSha256: source.checksumSha256 || null,
        sourceEventId: historyEvent?.id || null,
      },
      provenance: source.provenance || { actor: 'user', action: 'source-import' },
      sensitivity: 'standard',
      at,
    })
  })

  ;(project.evidenceBundles || []).forEach((bundle, index) => {
    const historyEvent = latestHistoryEvent(bundle.history)
    const at = safeAt(historyEvent?.at, safeAt(bundle.createdAt, index))
    const revision = historyEvent?.eventId || historyEvent?.id || `${bundle.status || 'unknown'}:${at}`
    next = addEventIfMissing(next, {
      id: `memory-event:evidence:${project.id}:${bundle.id}:${revision}:${bundle.status || 'unknown'}`,
      projectId: project.id,
      kind: 'evidence',
      entityId: bundle.id,
      snapshot: {
        claimText: text(bundle.claimText),
        status: bundle.status,
        sourceEventId: historyEvent?.eventId || null,
      },
      provenance: bundle.provenance || { actor: 'user', action: 'evidence-assemble' },
      sensitivity: 'standard',
      at,
    })
  })

  docs.filter(doc => doc?.projectId === project.id).forEach(doc => {
    next = addEventIfMissing(next, {
      id: `memory-event:text:${project.id}:${doc.id}:${safeAt(doc.updated)}`,
      projectId: project.id,
      kind: 'text',
      entityId: doc.id,
      snapshot: { title: text(doc.title) || 'Ohne Titel', updatedAt: safeAt(doc.updated) },
      provenance: doc.provenance || { actor: 'user', action: 'document-update' },
      sensitivity: 'sensitive',
      at: safeAt(doc.updated),
    })
    ;(doc.decisions || []).forEach((decision, index) => {
      const at = safeAt(decision.at ?? decision.createdAt, index)
      next = addEventIfMissing(next, {
        id: `memory-event:decision:${project.id}:${doc.id}:${decision.id}:${at}`,
        projectId: project.id,
        kind: decision.riskAccepted ? 'risk-accepted' : 'decision',
        entityId: decision.id,
        snapshot: {
          action: decision.action || decision.type || 'decision',
          resultText: text(decision.resultText || decision.resultingText || decision.ownText),
          reason: text(decision.reason || decision.riskReason),
          textId: doc.id,
        },
        provenance: decision.provenance || { actor: 'user', action: 'decision' },
        sensitivity: 'standard',
        at,
      })
    })
  })

  ;(project.researchRuns || []).forEach((run, index) => {
    const at = safeAt(run.updatedAt, index)
    next = addEventIfMissing(next, {
      id: `memory-event:research:${project.id}:${run.id}:${run.status}:${at}`,
      projectId: project.id,
      kind: 'research',
      entityId: run.id,
      snapshot: { question: text(run.question), status: run.status, review: run.review || null },
      provenance: { actor: 'agent', action: 'research-run' },
      sensitivity: 'standard',
      at,
    })
  })
  return next
}

function newest(events, kind) {
  return events.filter(event => event.kind === kind).sort((a, b) => b.at - a.at)[0] || null
}

function groupedHistory(events, kinds) {
  const accepted = new Set(Array.isArray(kinds) ? kinds : [kinds])
  const grouped = new Map()
  events.filter(event => accepted.has(event.kind)).forEach(event => {
    const history = grouped.get(event.entityId) || []
    history.push(event)
    grouped.set(event.entityId, history)
  })
  return [...grouped.values()].map(history => {
    history.sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))
    return {
      latest: history.at(-1),
      originEventIds: history.map(event => event.id),
    }
  })
}

function item(id, label, value, event, extra = {}) {
  return {
    id,
    label,
    value,
    originEventIds: [event.id],
    ...extra,
  }
}

export function buildProjectDossier({ projectId, store }) {
  const events = (store.events || []).filter(event => event?.projectId === projectId)
  const understanding = newest(events, 'understanding')
  const understandingOriginIds = events
    .filter(event => event.kind === 'understanding')
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))
    .map(event => event.id)
  const goals = []
  if (understanding) {
    const originEventIds = understandingOriginIds
    if (text(understanding.snapshot?.task)) goals.push(item('goal:task', 'Aufgabe', understanding.snapshot.task, understanding, { originEventIds }))
    if (understanding.snapshot?.audience?.length) goals.push(item('goal:audience', 'Zielgruppe', understanding.snapshot.audience.join(', '), understanding, { originEventIds }))
    if (text(understanding.snapshot?.desiredEffect)) goals.push(item('goal:effect', 'Beabsichtigte Wirkung', understanding.snapshot.desiredEffect, understanding, { originEventIds }))
  }
  const terms = groupedHistory(events, 'term-confirmed')
    .filter(({ latest }) => text(latest.snapshot?.term))
    .map(({ latest, originEventIds }) => item(`term:${latest.entityId}`, latest.snapshot.term, latest.snapshot.meaning, latest, { originEventIds }))
  const sources = groupedHistory(events, 'source')
    .map(({ latest, originEventIds }) => item(`source:${latest.entityId}`, latest.snapshot.title, latest.snapshot.status, latest, { originEventIds }))
  const evidence = groupedHistory(events, 'evidence')
    .map(({ latest, originEventIds }) => item(`evidence:${latest.entityId}`, 'Belegte Aussage', latest.snapshot.claimText, latest, {
      originEventIds,
      status: latest.snapshot.status,
    }))
  const decisions = groupedHistory(events, ['decision', 'risk-accepted'])
    .map(({ latest, originEventIds }) => item(`decision:${latest.entityId}`, latest.kind === 'risk-accepted' ? 'Bewusst angenommenes Risiko' : 'Autorentscheidung', latest.snapshot.resultText || latest.snapshot.action, latest, {
      originEventIds,
      reason: latest.snapshot.reason || '',
      riskAccepted: latest.kind === 'risk-accepted',
    }))
  const research = groupedHistory(events, 'research')
    .map(({ latest, originEventIds }) => item(`research:${latest.entityId}`, latest.snapshot.question || 'Recherchelauf', latest.snapshot.status, latest, { originEventIds }))

  const sections = { goals, terms, sources, evidence, decisions, research }
  const corrections = events.filter(event => event.kind === 'dossier-correction').sort((a, b) => a.at - b.at)
  corrections.forEach(correction => {
    Object.values(sections).forEach(entries => {
      const target = entries.find(candidate => candidate.id === correction.snapshot?.targetId)
      if (!target) return
      target.value = correction.snapshot.value
      target.corrected = true
      target.originEventIds = [...new Set([...target.originEventIds, correction.id])]
    })
  })
  return {
    schemaVersion: 1,
    projectId,
    generatedAt: events.reduce((max, event) => Math.max(max, safeAt(event.at)), 0),
    ...sections,
    originEventIds: events.map(event => event.id),
  }
}

export function synchronizeProjectMemory({ project, docs = [], store }) {
  if (!project?.id) throw new TypeError('Project is required')
  const memory = ensureProjectMemoryShape(clone(project)).memory
  if (!memory.enabled) return { store: clone(ensureMemoryStore(clone(store))), dossier: null, projectMemory: memory }
  const nextStore = captureEvents({ project, docs, store })
  const dossier = buildProjectDossier({ projectId: project.id, store: nextStore })
  return {
    store: nextStore,
    dossier,
    projectMemory: {
      enabled: true,
      eventIds: dossier.originEventIds,
      dossier,
    },
  }
}

export function correctDossierItem({ project, docs = [], store, targetId, value, at = Date.now() }) {
  const normalized = text(value)
  if (!normalized) throw new TypeError('Dossier correction value is required')
  const synchronized = synchronizeProjectMemory({ project, docs, store })
  const targetExists = ['goals', 'terms', 'sources', 'evidence', 'decisions', 'research']
    .some(section => synchronized.dossier?.[section]?.some(item => item.id === targetId))
  if (!targetExists) throw new TypeError('Dossier correction target is unknown')
  const event = createMemoryEvent({
    id: `memory-event:correction:${project.id}:${targetId}:${at}`,
    projectId: project.id,
    kind: 'dossier-correction',
    entityId: targetId,
    snapshot: { targetId, value: normalized },
    provenance: { actor: 'user', action: 'dossier-correct' },
    sensitivity: 'standard',
    at,
  })
  const nextStore = appendMemoryEvent(synchronized.store, event)
  const dossier = buildProjectDossier({ projectId: project.id, store: nextStore })
  return {
    store: nextStore,
    dossier,
    projectMemory: { enabled: true, eventIds: dossier.originEventIds, dossier },
  }
}
