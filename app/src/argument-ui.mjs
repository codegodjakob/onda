// Die Oberfläche des Argumentteils: der Abgleich zwischen Text und Argumentmodell und die
// Ansichten dazu. Ein Lauf bringt der Reihe nach das Aussagenregister auf Stand
// (claim-ledger.mjs), zieht die sicheren Beziehungen (argument-projection.mjs), prüft die
// Belegverweise (argument-model.mjs), untersucht den Graphen (argument-graph.mjs) und führt
// die Befunde mit den bisherigen zusammen. Braucht ein document.
//
// Gehört zur Browser-App (src/editor.js): src/workspace.js ruft createArgumentUi auf.
import {
  analyzeArgumentImpact,
  analyzeArgumentGraph,
  mergeArgumentFindings,
  resolveArgumentFinding,
} from './argument-graph.mjs'
import {
  appendDeliberationRound,
  createDeliberationRound,
  generateArgumentPaths,
  selectStrongestCounterargument,
} from './argument-deliberation.mjs'
import {
  ARGUMENT_CONFIDENCE,
  ARGUMENT_CENTRALITY,
  ARGUMENT_CLAIM_KINDS,
  ARGUMENT_RELATION_TYPES,
  ARGUMENT_VALIDITY,
  correctArgumentClaim,
  correctArgumentRelation,
  createArgumentRelation,
  validateArgumentEvidenceRefs,
  validateArgumentModelIntegrity,
} from './argument-model.mjs'
import { deriveSafeBlockRelations } from './argument-projection.mjs'
import { synchronizeClaimLedger } from './claim-ledger.mjs'

const RELATION_LABELS = Object.freeze({
  supports: 'stützt',
  counters: 'widerspricht',
  qualifies: 'begrenzt',
  explains: 'erklärt',
  'depends-on': 'hängt ab von',
})
const CLAIM_KIND_LABELS = Object.freeze({
  fact: 'Tatsachenaussage',
  definition: 'Definition',
  value: 'Wertung',
  inference: 'Schlussfolgerung',
})
const CENTRALITY_LABELS = Object.freeze({ central: 'Kernbehauptung', supporting: 'Stützend' })
const VALIDITY_LABELS = Object.freeze({
  asserted: 'behauptet',
  qualified: 'qualifiziert',
  contested: 'bestritten',
  withdrawn: 'zurückgezogen',
})
const EVIDENCE_LABELS = Object.freeze({
  supported: 'belegt',
  mixed: 'gemischte Beleglage',
  insufficient: 'nicht ausreichend belegt',
  'review-required': 'erneut zu prüfen',
  unverified: 'noch unbelegt',
})
const FINDING_LABELS = Object.freeze({
  gap: 'Unbelegte Kernbehauptung',
  'missing-warrant': 'Fehlende Schlussbrücke',
  'root-cause': 'Gemeinsame Grundursache',
  cycle: 'Möglicher Zirkelschluss',
})
const PATH_LABELS = Object.freeze({
  'evidence-first': 'Vom Beleg aus',
  'objection-first': 'Vom stärksten Einwand aus',
  'definition-first': 'Von der Begriffsgrenze aus',
})

function shortClaim(value, length = 130) {
  const text = String(value || '').trim()
  return text.length > length ? `${text.slice(0, length - 1)}…` : text
}

function selectField(className, label, options, selected = '') {
  const select = document.createElement('select')
  select.className = className
  select.setAttribute('aria-label', label)
  options.forEach(([value, text]) => {
    const option = document.createElement('option')
    option.value = value
    option.textContent = text
    option.selected = value === selected
    select.append(option)
  })
  return select
}

function textareaField(className, label, value = '', rows = 3) {
  const field = document.createElement('textarea')
  field.className = className
  field.setAttribute('aria-label', label)
  field.value = value
  field.rows = rows
  return field
}

function activeClaims(model, textId = null) {
  return model.claims.filter(claim => (
    claim.status !== 'stale' && (!textId || claim.textId === textId)
  ))
}

export function createArgumentUi({ context, createNode, openDialog, getBlocks }) {
  const selectedCentralByProject = new Map()

  function synchronize(project) {
    const doc = context.activeDoc()
    if (!doc || doc.projectId !== project.id) throw new TypeError('Der aktive Text gehört nicht zu diesem Projekt.')
    const at = Date.now()
    const blocks = getBlocks()
    validateArgumentModelIntegrity({
      model: project.argumentModel,
      projectId: project.id,
    })
    let model = synchronizeClaimLedger({
      projectId: project.id,
      model: project.argumentModel,
      texts: [{
        textId: doc.id,
        projectId: project.id,
        blocks,
      }],
      evidenceBundles: project.evidenceBundles || [],
      at,
    })
    model = deriveSafeBlockRelations({
      model,
      projectId: project.id,
      blocks,
      at,
    })
    validateArgumentEvidenceRefs({
      model,
      projectId: project.id,
      sources: project.sources || [],
      evidenceBundles: project.evidenceBundles || [],
    })
    const analysis = analyzeArgumentGraph(model, { projectId: project.id, at })
    model.findings = mergeArgumentFindings({
      previous: model.findings,
      analyzed: analysis.findings,
      projectId: project.id,
      at,
    })
    project.argumentModel = model
    return { model, blocks, cycles: analysis.cycles }
  }

  function selectedCentral(project, claims) {
    const selected = selectedCentralByProject.get(project.id)
    const activeDocumentId = context.activeDoc()?.id
    const central = claims.filter(claim => (
      claim.centrality === 'central' && claim.textId === activeDocumentId
    ))
    const fallback = central[0] || claims.find(claim => claim.centrality === 'central') || null
    const result = central.find(claim => claim.id === selected) || fallback
    if (result) selectedCentralByProject.set(project.id, result.id)
    return result
  }

  function persist(project) {
    context.persist()
    return project.argumentModel
  }

  function section(parent, title, intro = '') {
    const node = createNode('section', 'argument-section')
    node.append(createNode('h3', 'argument-section-title', title))
    if (intro) node.append(createNode('p', 'argument-section-intro', intro))
    parent.append(node)
    return node
  }

  function renderClaimCorrection(card, body, project, claim, render) {
    const form = createNode('form', 'argument-form argument-claim-correction')
    const kind = selectField(
      'argument-select',
      'Aussageart',
      ARGUMENT_CLAIM_KINDS.map(value => [value, CLAIM_KIND_LABELS[value]]),
      claim.kind,
    )
    const centrality = selectField(
      'argument-select',
      'Zentralität',
      ARGUMENT_CENTRALITY.map(value => [value, CENTRALITY_LABELS[value]]),
      claim.centrality,
    )
    const validity = selectField(
      'argument-select',
      'Gültigkeit',
      ARGUMENT_VALIDITY.map(value => [value, VALIDITY_LABELS[value]]),
      claim.validity,
    )
    const save = createNode('button', 'argument-primary', 'Claim-Korrektur speichern')
    save.type = 'submit'
    const cancel = createNode('button', 'argument-action', 'Abbrechen')
    cancel.type = 'button'
    cancel.addEventListener('click', () => render(body, project))
    form.append(
      createNode('p', 'argument-claim-text', claim.text),
      kind,
      centrality,
      validity,
      save,
      cancel,
    )
    form.addEventListener('submit', event => {
      event.preventDefault()
      try {
        project.argumentModel = correctArgumentClaim({
          model: project.argumentModel,
          claimId: claim.id,
          projectId: project.id,
          kind: kind.value,
          centrality: centrality.value,
          validity: validity.value,
          at: Date.now(),
        })
        const impactAt = Date.now()
        const impact = analyzeArgumentImpact({
          model: project.argumentModel,
          projectId: project.id,
          change: {
            kind: kind.value === 'definition' || claim.origin?.kind === 'definition' ? 'definition' : 'claim',
            entityId: claim.id,
            fingerprint: [
              claim.id,
              kind.value,
              centrality.value,
              validity.value,
              impactAt,
            ].join(':'),
            reason: 'Die Einordnung dieser Aussage wurde vom Nutzer korrigiert.',
          },
          at: impactAt,
        })
        project.argumentModel = impact.model
        persist(project)
        render(body, project, 'Aussage korrigiert. Textanker und ursprüngliche Einordnung bleiben erhalten.')
      } catch (error) {
        render(body, project, error?.message || 'Die Aussagekorrektur konnte nicht gespeichert werden.')
      }
    })
    card.replaceChildren(form)
    requestAnimationFrame(() => kind.focus({ preventScroll: true }))
  }

  function renderClaimLedger(parent, body, project, claims, staleClaims, render) {
    const allClaims = [...claims, ...staleClaims]
    const area = section(
      parent,
      `Aussagen · ${allClaims.length}${staleClaims.length ? ` · ${staleClaims.length} zu prüfen` : ''}`,
      'Jede Aussage bleibt an ihrer exakten Passage verankert. „Unbelegt“ heißt nur, dass noch keine geprüfte Quelle zugeordnet ist.',
    )
    if (!allClaims.length) {
      area.append(createNode('p', 'argument-empty', 'In diesem Text wurde noch keine vollständige Aussage erkannt.'))
      return
    }
    const list = createNode('div', 'argument-claim-list')
    allClaims.forEach(claim => {
      const stale = claim.status === 'stale'
      const card = createNode('article', `argument-claim is-${claim.centrality}${stale ? ' is-stale' : ''}`)
      const meta = createNode('div', 'argument-meta')
      meta.append(
        createNode('span', 'argument-tag', claim.centrality === 'central' ? 'Kernbehauptung' : CLAIM_KIND_LABELS[claim.kind]),
        createNode('span', `argument-tag is-evidence-${claim.evidenceStatus}`, stale ? 'Textanker veraltet' : EVIDENCE_LABELS[claim.evidenceStatus]),
        createNode('span', 'argument-tag', `Unsicherheit: ${claim.uncertainty}`),
      )
      card.append(
        meta,
        createNode('p', 'argument-claim-text', claim.text),
        createNode('span', 'argument-origin', `Passage ${claim.anchor.blockId} · Zeichen ${claim.anchor.start + 1}–${claim.anchor.end}`),
      )
      if (claim.corrections?.length) card.append(createNode('span', 'argument-origin', 'Nutzerkorrektur aktiv · Textanker unverändert'))
      if (stale) {
        card.append(createNode('p', 'argument-finding-copy', 'Die ursprüngliche Passage ist nicht mehr vorhanden. Die frühere Einordnung bleibt im Prüfpfad erhalten.'))
      } else {
        const correct = createNode('button', 'argument-action', 'Aussage einordnen')
        correct.type = 'button'
        correct.addEventListener('click', () => renderClaimCorrection(card, body, project, claim, render))
        card.append(correct)
      }
      list.append(card)
    })
    area.append(list)
  }

  function relationOptions(claims) {
    return claims.map(claim => [claim.id, shortClaim(claim.text, 80)])
  }

  function renderRelationCorrection(card, body, project, relation, render) {
    const form = createNode('form', 'argument-form argument-relation-correction')
    const type = selectField(
      'argument-select',
      'Beziehungsart',
      ARGUMENT_RELATION_TYPES.map(value => [value, RELATION_LABELS[value]]),
      relation.type,
    )
    const confidence = selectField(
      'argument-select',
      'Sicherheit',
      ARGUMENT_CONFIDENCE.map(value => [value, value]),
      relation.confidence,
    )
    const warrant = textareaField('argument-input', 'Schlussbrücke', relation.warrant)
    const save = createNode('button', 'argument-primary', 'Korrektur speichern')
    save.type = 'submit'
    const cancel = createNode('button', 'argument-action', 'Abbrechen')
    cancel.type = 'button'
    cancel.addEventListener('click', () => render(body, project))
    form.append(type, confidence, warrant, save, cancel)
    form.addEventListener('submit', event => {
      event.preventDefault()
      try {
        project.argumentModel = correctArgumentRelation({
          model: project.argumentModel,
          relationId: relation.id,
          projectId: project.id,
          type: type.value,
          warrant: warrant.value,
          confidence: confidence.value,
          at: Date.now(),
        })
        const impactAt = Date.now()
        const impact = analyzeArgumentImpact({
          model: project.argumentModel,
          projectId: project.id,
          change: {
            kind: 'relation',
            entityId: relation.id,
            fingerprint: [
              relation.id,
              type.value,
              confidence.value,
              warrant.value,
              impactAt,
            ].join(':'),
            reason: 'Die Schlussbeziehung wurde vom Nutzer korrigiert.',
          },
          at: impactAt,
        })
        project.argumentModel = impact.model
        persist(project)
        render(body, project, 'Beziehung korrigiert. Der ursprüngliche Vorschlag bleibt in der Herkunft erhalten.')
      } catch (error) {
        render(body, project, error?.message || 'Die Korrektur konnte nicht gespeichert werden.')
      }
    })
    card.replaceChildren(form)
    requestAnimationFrame(() => warrant.focus({ preventScroll: true }))
  }

  function renderRelationComposer(parent, body, project, claims, render) {
    if (claims.length < 2) return
    const details = createNode('details', 'argument-compose')
    const summary = document.createElement('summary')
    summary.textContent = 'Beziehung selbst festlegen'
    const form = createNode('form', 'argument-form')
    const options = relationOptions(claims)
    const from = selectField('argument-select', 'Ausgangsaussage', options)
    const to = selectField('argument-select', 'Zielaussage', options, options[1]?.[0])
    const type = selectField(
      'argument-select',
      'Beziehungsart',
      ARGUMENT_RELATION_TYPES.map(value => [value, RELATION_LABELS[value]]),
    )
    const confidence = selectField(
      'argument-select',
      'Sicherheit',
      ARGUMENT_CONFIDENCE.map(value => [value, value]),
      'medium',
    )
    const warrant = textareaField('argument-input', 'Warum folgt diese Beziehung?', '', 2)
    const submit = createNode('button', 'argument-primary', 'Beziehung hinzufügen')
    submit.type = 'submit'
    form.append(from, to, type, confidence, warrant, submit)
    form.addEventListener('submit', event => {
      event.preventDefault()
      try {
        const relation = createArgumentRelation({
          id: `argument-relation:user:${project.id}:${Date.now()}`,
          projectId: project.id,
          fromClaimId: from.value,
          toClaimId: to.value,
          type: type.value,
          warrant: warrant.value,
          confidence: confidence.value,
          provenance: { actor: 'user', action: 'relation-create' },
          createdAt: Date.now(),
        }, { claims })
        project.argumentModel.relations.push(relation)
        persist(project)
        render(body, project, 'Beziehung gespeichert.')
      } catch (error) {
        render(body, project, error?.message || 'Die Beziehung konnte nicht gespeichert werden.')
      }
    })
    details.append(summary, form)
    parent.append(details)
  }

  function renderRelations(parent, body, project, claims, render) {
    const relations = project.argumentModel.relations.filter(relation => (
      claims.some(claim => claim.id === relation.fromClaimId)
      && claims.some(claim => claim.id === relation.toClaimId)
    ))
    const byId = new Map(claims.map(claim => [claim.id, claim]))
    const area = section(
      parent,
      `Beziehungen · ${relations.length}`,
      'Die Schlussbrücke ist immer sichtbar und kann bindend korrigiert werden.',
    )
    if (!relations.length) area.append(createNode('p', 'argument-empty', 'Noch keine eindeutige Beziehung. Bei Mehrdeutigkeit wird nichts geraten.'))
    relations.forEach(relation => {
      const card = createNode('article', 'argument-relation')
      const header = createNode('div', 'argument-relation-header')
      header.append(
        createNode('span', 'argument-relation-flow', `${shortClaim(byId.get(relation.fromClaimId)?.text, 72)} ${RELATION_LABELS[relation.type]} ${shortClaim(byId.get(relation.toClaimId)?.text, 72)}`),
        createNode('span', 'argument-tag', `Sicherheit: ${relation.confidence}`),
      )
      const correct = createNode('button', 'argument-action', 'Korrigieren')
      correct.type = 'button'
      correct.addEventListener('click', () => renderRelationCorrection(card, body, project, relation, render))
      card.append(
        header,
        createNode('p', 'argument-warrant', relation.warrant),
        createNode('span', 'argument-origin', relation.corrections?.length ? 'Nutzerkorrektur aktiv · Ursprung erhalten' : 'Abgeleitete Zuordnung · korrigierbar'),
        correct,
      )
      area.append(card)
    })
    renderRelationComposer(area, body, project, claims, render)
  }

  function renderFindingResolution(card, body, project, finding, render) {
    const form = createNode('form', 'argument-form argument-finding-resolution')
    const resolution = textareaField('argument-input', 'Klärung dokumentieren', '', 2)
    const save = createNode('button', 'argument-primary', 'Als geklärt speichern')
    save.type = 'submit'
    const cancel = createNode('button', 'argument-action', 'Abbrechen')
    cancel.type = 'button'
    cancel.addEventListener('click', () => render(body, project))
    form.append(resolution, save, cancel)
    form.addEventListener('submit', event => {
      event.preventDefault()
      try {
        project.argumentModel = resolveArgumentFinding({
          model: project.argumentModel,
          projectId: project.id,
          findingId: finding.id,
          resolution: resolution.value,
          at: Date.now(),
        })
        persist(project)
        render(body, project, 'Befund als geklärt dokumentiert. Die Grundlage bleibt für spätere Regressionen erhalten.')
      } catch (error) {
        render(body, project, error?.message || 'Der Befund konnte nicht abgeschlossen werden.')
      }
    })
    card.replaceChildren(form)
    requestAnimationFrame(() => resolution.focus({ preventScroll: true }))
  }

  function renderFindings(parent, body, project, model, claims, cycles, render) {
    const claimIds = new Set(claims.map(claim => claim.id))
    const findings = model.findings.filter(finding => (
      finding.status !== 'resolved'
      && (
        claimIds.has(finding.claimId)
        || claimIds.has(finding.rootCauseClaimId)
        || (finding.claimIds || []).some(id => claimIds.has(id))
      )
    ))
    const area = section(
      parent,
      `Strukturprüfung · ${findings.length}`,
      'Gemeinsame Ursachen werden vor abhängigen Einzelproblemen gezeigt. Geschlossene Kreise erscheinen als vollständiger Pfad.',
    )
    if (!findings.length) {
      area.append(createNode('p', 'argument-empty', 'Keine strukturelle Lücke auf der aktuellen Grundlage.'))
      return
    }
    findings.forEach(finding => {
      const card = createNode('article', `argument-finding is-${finding.status}`)
      card.append(
        createNode('strong', 'argument-finding-title', FINDING_LABELS[finding.kind] || finding.kind),
        createNode('span', 'argument-origin', finding.status === 'parked' ? 'Geparkt unter einer gemeinsamen Grundursache' : 'Offen auf aktueller Grundlage'),
      )
      if (finding.kind === 'root-cause') {
        card.append(createNode('p', 'argument-finding-copy', `${finding.dependentFindingIds.length} abhängige Lücken führen auf dieselbe ungeklärte Aussage zurück.`))
      }
      if (finding.kind === 'cycle') {
        card.append(createNode('p', 'argument-finding-copy', finding.cycle.join(' → ')))
      }
      if (finding.status === 'open') {
        const resolve = createNode('button', 'argument-action', 'Als geklärt markieren')
        resolve.type = 'button'
        resolve.addEventListener('click', () => renderFindingResolution(card, body, project, finding, render))
        card.append(resolve)
      }
      area.append(card)
    })
    void cycles
  }

  function renderCounterargument(parent, project, central) {
    const area = section(
      parent,
      'Stärkster fairer Einwand',
      'Es wird nur direkt zugeordnetes, belegtes Gegenmaterial verwendet. Fehlt es, bleibt die Stelle ausdrücklich leer.',
    )
    if (!central) {
      area.append(createNode('p', 'argument-empty', 'Noch keine Kernbehauptung vorhanden.'))
      return null
    }
    const result = selectStrongestCounterargument({
      model: project.argumentModel,
      projectId: project.id,
      centralClaimId: central.id,
      evidenceBundles: project.evidenceBundles || [],
    })
    if (result.status !== 'found') {
      area.append(createNode('p', 'argument-empty', result.reason))
      return result
    }
    const card = createNode('article', 'argument-counter')
    card.append(
      createNode('p', 'argument-counter-text', result.counterClaim.text),
      createNode('p', 'argument-warrant', result.relation.warrant),
      createNode('span', 'argument-origin', `${result.evidenceRefs.length} Belegreferenz${result.evidenceRefs.length === 1 ? '' : 'en'} · Wirkung: ${result.impact.effect}`),
      createNode('p', 'argument-finding-copy', result.impact.reason),
    )
    if (result.limitations.length) {
      const limits = createNode('ul', 'argument-limitations')
      result.limitations.forEach(limit => limits.append(createNode('li', '', limit)))
      card.append(limits)
    }
    area.append(card)
    return result
  }

  function renderPaths(parent, project, central, counterargument) {
    const area = section(
      parent,
      'Alternative Argumentationswege',
      'Jeder Weg beginnt anders, nutzt eine andere Belegstrategie und nennt Wirkung sowie Risiko.',
    )
    if (!central) {
      area.append(createNode('p', 'argument-empty', 'Noch keine Kernbehauptung vorhanden.'))
      return
    }
    const result = generateArgumentPaths({
      model: project.argumentModel,
      projectId: project.id,
      centralClaimId: central.id,
      counterargument,
    })
    project.argumentModel.paths = [
      ...project.argumentModel.paths.filter(path => path.centralClaimId !== central.id),
      ...(result.status === 'ready' ? result.paths : []),
    ]
    if (result.status !== 'ready') {
      area.append(createNode('p', 'argument-empty', result.reason))
      return
    }
    const list = createNode('div', 'argument-path-list')
    result.paths.forEach(path => {
      const card = createNode('article', 'argument-path')
      card.append(
        createNode('span', 'argument-tag', PATH_LABELS[path.strategy] || path.strategy),
        createNode('strong', 'argument-path-premise', path.premise),
        createNode('p', 'argument-warrant', path.bridge),
        createNode('p', 'argument-path-copy', path.evidenceStrategy),
        createNode('p', 'argument-path-impact', `Wirkung · ${path.impact}`),
        createNode('p', 'argument-path-risk', `Risiko · ${path.risk}`),
      )
      list.append(card)
    })
    area.append(list)
  }

  function renderDeliberation(parent, body, project, claims, central, render) {
    const area = section(
      parent,
      'Prüfrunden und Ereignisse',
      'Frühere Runden und die Herkunft aller Änderungen bleiben eingeklappt erreichbar. Der Text wird dabei nicht verändert.',
    )
    if (!central) {
      area.append(createNode('p', 'argument-empty', 'Noch keine Kernbehauptung vorhanden.'))
      return
    }
    const rounds = project.argumentModel.deliberations.filter(round => round.claimId === central.id)
    if (rounds.length) {
      const details = createNode('details', 'argument-audit-details')
      const summary = document.createElement('summary')
      summary.textContent = `${rounds.length} frühere Prüfrunde${rounds.length === 1 ? '' : 'n'}`
      rounds.forEach(round => {
        const card = createNode('article', 'argument-round')
        round.entries.forEach(entry => {
          card.append(
            createNode('span', 'argument-round-kind', {
              critique: 'Kritik',
              response: 'Autorenantwort',
              revision: 'Mögliche Revision',
            }[entry.kind]),
            createNode('p', 'argument-round-text', entry.text),
          )
        })
        details.append(card)
      })
      details.prepend(summary)
      area.append(details)
    }
    const scopeIds = new Set([
      ...claims.map(claim => claim.id),
      ...project.argumentModel.relations
        .filter(relation => claims.some(claim => claim.id === relation.fromClaimId || claim.id === relation.toClaimId))
        .map(relation => relation.id),
      ...rounds.map(round => round.id),
    ])
    const events = project.argumentModel.events.filter(event => (
      event.projectId === project.id
      && (scopeIds.has(event.entityId) || event.kind === 'impact-analyzed' || event.kind === 'finding-resolved')
    ))
    if (events.length) {
      const details = createNode('details', 'argument-audit-details argument-event-details')
      const summary = document.createElement('summary')
      summary.textContent = `${events.length} Herkunftsereignis${events.length === 1 ? '' : 'se'}`
      const list = createNode('ol', 'argument-event-list')
      events.forEach(event => {
        list.append(createNode('li', 'argument-event', `${event.kind} · ${new Date(event.at).toLocaleString('de-DE')}`))
      })
      details.append(summary, list)
      area.append(details)
    }
    const form = createNode('form', 'argument-form argument-deliberation-form')
    const critique = textareaField('argument-input', 'Kritik oder Einwand', '', 2)
    const response = textareaField('argument-input', 'Autorenantwort', '', 2)
    const revision = textareaField('argument-input', 'Mögliche Revision', '', 2)
    const submit = createNode('button', 'argument-primary', 'Prüfrunde dokumentieren')
    submit.type = 'submit'
    form.append(critique, response, revision, submit)
    form.addEventListener('submit', event => {
      event.preventDefault()
      try {
        const at = Date.now()
        const round = createDeliberationRound({
          id: `argument-round:${project.id}:${at}`,
          projectId: project.id,
          claimId: central.id,
          critique: { text: critique.value, actor: 'user', at },
          response: { text: response.value, actor: 'user', at: at + 1 },
          revision: { text: revision.value, actor: 'user', at: at + 2 },
        }, { claims: project.argumentModel.claims })
        project.argumentModel = appendDeliberationRound(project.argumentModel, round)
        persist(project)
        render(body, project, 'Prüfrunde gespeichert. Der Text blieb unverändert.')
      } catch (error) {
        render(body, project, error?.message || 'Die Prüfrunde konnte nicht gespeichert werden.')
      }
    })
    area.append(form)
  }

  function render(body, project, message = '') {
    const scrollTop = body.scrollTop
    body.replaceChildren()
    try {
      const { model, cycles } = synchronize(project)
      const activeTextId = context.activeDoc()?.id || null
      const claims = activeClaims(model, activeTextId)
      const staleClaims = model.claims.filter(claim => (
        claim.status === 'stale' && claim.textId === activeTextId
      ))
      const centralClaims = claims.filter(claim => claim.centrality === 'central')
      const central = selectedCentral(project, claims)
      let status = null
      if (message) {
        status = createNode('p', 'argument-status', message)
        status.setAttribute('role', 'status')
        status.tabIndex = -1
        body.append(status)
      }
      const intro = createNode('section', 'argument-intro')
      const introCopy = createNode('div', 'argument-intro-copy')
      introCopy.append(
        createNode('span', 'argument-kicker', `Textnah · begründet · korrigierbar · Stand ${new Date(model.lastAnalysis?.at || Date.now()).toLocaleString('de-DE')}`),
        createNode('p', '', 'Dieses Dossier zeigt Aussagen, Schlussbrücken und Prüflücken. Es schreibt nichts automatisch in deinen Text.'),
      )
      const refresh = createNode('button', 'argument-action', 'Neu prüfen')
      refresh.id = 'argumentRefresh'
      refresh.type = 'button'
      refresh.addEventListener('click', () => {
        render(body, project, 'Argumentation auf der aktuellen Text- und Beleggrundlage neu geprüft.')
      })
      intro.append(introCopy, refresh)
      body.append(intro)
      if (centralClaims.length > 1) {
        const chooser = createNode('div', 'argument-central-chooser')
        chooser.append(createNode('span', 'argument-field-label', 'Kernbehauptung für Einwand und Wege'))
        const select = selectField(
          'argument-select',
          'Kernbehauptung auswählen',
          centralClaims.map(claim => [claim.id, shortClaim(claim.text, 96)]),
          central?.id,
        )
        select.addEventListener('change', () => {
          selectedCentralByProject.set(project.id, select.value)
          render(body, project)
        })
        chooser.append(select)
        body.append(chooser)
      }
      renderClaimLedger(body, body, project, claims, staleClaims, render)
      const counterargument = renderCounterargument(body, project, central)
      renderRelations(body, body, project, claims, render)
      renderFindings(body, body, project, model, claims, cycles, render)
      renderPaths(body, project, central, counterargument)
      renderDeliberation(body, body, project, claims, central, render)
      persist(project)
      body.scrollTop = message ? scrollTop : 0
      if (status) requestAnimationFrame(() => status.focus({ preventScroll: true }))
    } catch (error) {
      const status = createNode('p', 'argument-status is-error', error?.message || 'Das Argumentationsdossier konnte nicht geöffnet werden.')
      status.setAttribute('role', 'alert')
      status.tabIndex = -1
      body.append(status)
      requestAnimationFrame(() => status.focus({ preventScroll: true }))
    }
  }

  function open(project, opener) {
    openDialog({
      id: 'argumentModal',
      title: 'Argumentationsdossier',
      opener,
      build: body => render(body, project),
    })
  }

  return { open, render }
}
