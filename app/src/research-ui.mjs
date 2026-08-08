// Die Bedienoberfläche der Recherche — DOM, deshalb nicht node-testbar.
//
// Zeigt den Stand eines Recherchelaufs in deutschen Worten ("Geprüft, bereit zur
// Sichtung"), startet und pausiert ihn und führt durch die Sichtung der Funde.
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js), eingebettet in
// source-library-ui.mjs.
import { createResearchAdapter } from './research-adapter.mjs'
import { executeResearchPaths } from './research-orchestrator.mjs'
import { createResearchPlan, researchPathFingerprint, transitionResearchRun } from './research-run.mjs'
import { buildResearchReview, commitResearchReview } from './research-synthesis.mjs'
import { ondaIcon } from './onda-icons.mjs'

const STATUS_LABELS = Object.freeze({
  planned: 'Geplant',
  running: 'Recherche läuft',
  paused: 'Pausiert',
  'review-ready': 'Geprüft · bereit zur Sichtung',
  completed: 'In Projektwissen übernommen',
  failed: 'Unterbrochen · fortsetzbar',
  cancelled: 'Abgebrochen',
})

const PURPOSE_LABELS = Object.freeze({
  support: 'Stützende Befunde',
  'counter-evidence': 'Gegenbelege',
  limitations: 'Methodische Grenzen',
  access: 'Legaler Zugangsweg',
})

function browserSha256(value) {
  const bytes = new TextEncoder().encode(String(value))
  return crypto.subtle.digest('SHA-256', bytes).then(hash => (
    Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')
  ))
}

function adapterFrom(raw) {
  if (!raw) return null
  try {
    return createResearchAdapter(raw)
  } catch {
    return null
  }
}

export function createResearchUi({
  context,
  createNode,
  getAdapter = () => window.__AIWT_RESEARCH_ADAPTER__ || null,
  onProjectChanged = () => {},
}) {
  const executions = new Map()
  const cancelledRuns = new Set()

  function replaceRun(project, nextRun) {
    if (!Array.isArray(project.researchRuns)) project.researchRuns = []
    const index = project.researchRuns.findIndex(run => run?.id === nextRun.id)
    if (index >= 0) project.researchRuns[index] = nextRun
    else project.researchRuns.push(nextRun)
  }

  function persistRun(project, run) {
    replaceRun(project, run)
    context.persist()
  }

  function actionButton(label, className = '') {
    const button = createNode('button', `onda-blaetter__eintrag research-action ${className}`.trim(), label)
    button.type = 'button'
    return button
  }

  function renderPlanForm(body, project, renderLibrary) {
    body.replaceChildren()
    const form = createNode('form', 'research-plan-form')
    form.id = 'researchPlanForm'
    form.setAttribute('aria-label', 'Recherche planen')
    const back = actionButton('Zur Quellenliste', 'research-back')
    back.prepend(ondaIcon('arrow-left', { size: 16 }))
    back.id = 'researchPlanBack'
    back.addEventListener('click', () => renderLibrary())
    const question = document.createElement('textarea')
    question.id = 'researchQuestion'
    question.className = 'source-form-control source-form-text'
    question.rows = 2
    question.required = true
    question.placeholder = 'Welche konkrete Wissenslücke soll der Lauf klären?'
    const claim = document.createElement('textarea')
    claim.id = 'researchClaim'
    claim.className = 'source-form-control source-form-text'
    claim.rows = 2
    claim.required = true
    claim.placeholder = 'Welche genaue Aussage soll geprüft werden?'
    const budget = document.createElement('input')
    budget.id = 'researchBudget'
    budget.className = 'source-form-control'
    budget.type = 'number'
    budget.min = '3'
    budget.max = '30'
    budget.value = '12'
    const status = createNode('p', 'research-status-line', '')
    status.id = 'researchPlanStatus'
    status.setAttribute('role', 'status')
    const submit = createNode('button', 'onda-blaetter__eintrag research-primary', 'Plan speichern')
    submit.id = 'researchPlanSubmit'
    submit.type = 'submit'

    const field = (label, control) => {
      const wrapper = createNode('label', 'source-form-field')
      wrapper.append(createNode('span', 'source-form-label', label), control)
      return wrapper
    }
    const pathPreview = createNode('div', 'research-plan-preview')
    pathPreview.append(
      createNode('strong', 'research-plan-preview-title', 'Der Lauf prüft drei Richtungen'),
      createNode('span', 'research-plan-preview-item', '1 · stützende Originalbefunde'),
      createNode('span', 'research-plan-preview-item', '2 · widersprechende Befunde und Replikationen'),
      createNode('span', 'research-plan-preview-item', '3 · methodische Grenzen und Reichweite'),
    )
    form.append(
      back,
      createNode('span', 'source-reader-kicker', 'Begrenzter Recherchelauf'),
      createNode('h3', 'onda-blaetter__tiefe-titel source-reader-title', 'Recherche planen'),
      createNode('p', 'research-intro', 'Der Plan wird lokal gespeichert, bevor ein Werkzeug aufgerufen wird. Ergebnisse gelten erst nach Prüfung am Original als belegt.'),
      field('Prüfbare Frage', question),
      field('Zu prüfende Aussage', claim),
      field('Höchstens Werkzeugaufrufe', budget),
      pathPreview,
      submit,
      status,
    )
    form.addEventListener('submit', event => {
      event.preventDefault()
      try {
        const createdAt = Date.now()
        const claimText = claim.value.trim()
        const queryBase = claimText.replace(/\s+/g, ' ')
        const run = createResearchPlan({
          id: `research-${createdAt}-${Math.random().toString(36).slice(2, 7)}`,
          projectId: project.id,
          question: question.value.trim(),
          claimId: `research-claim-${createdAt}`,
          claimText,
          allowedTools: ['search', 'metadata', 'reader', 'import'],
          searchPaths: [
            { id: 'support', purpose: 'support', tool: 'search', input: { query: `${queryBase} Originalstudie Befund` } },
            { id: 'counter', purpose: 'counter-evidence', tool: 'search', input: { query: `${queryBase} Gegenbefund Replikation kein Effekt` } },
            { id: 'limits', purpose: 'limitations', tool: 'search', input: { query: `${queryBase} methodische Grenzen Stichprobe` } },
          ],
          stopConditions: {
            maxToolCalls: Number(budget.value),
            maxSources: 8,
            maxConsecutiveFailures: 3,
          },
          createdAt,
        })
        persistRun(project, run)
        renderResearchRun(body, project, run, renderLibrary)
      } catch (error) {
        status.textContent = `Plan unvollständig: ${error?.message || 'Eingaben prüfen'}`
      }
    })
    body.append(form)
    requestAnimationFrame(() => question.focus({ preventScroll: true }))
  }

  function renderCandidateGroup(parent, title, candidates, emptyText) {
    const section = createNode('section', 'research-result-group')
    section.append(createNode('h4', 'research-result-title', title))
    if (!candidates.length) {
      section.append(createNode('p', 'research-result-empty', emptyText))
    } else {
      candidates.forEach(candidate => {
        const item = createNode('article', 'research-candidate')
        const access = candidate.usableAsEvidence
          ? 'Originalfundstelle geprüft'
          : candidate.accessLevel === 'metadata'
            ? 'Nur Metadaten'
            : candidate.accessLevel === 'abstract'
              ? 'Nur Abstract'
              : 'Nicht als Beleg nutzbar'
        item.append(
          createNode('strong', 'research-candidate-title', candidate.title || candidate.originalRef || 'Recherchefund'),
          createNode('span', `research-candidate-access ${candidate.usableAsEvidence ? 'is-verified' : 'is-limited'}`, access),
        )
        if (candidate.locator?.excerpt) {
          item.append(createNode('p', 'research-candidate-excerpt', candidate.locator.excerpt))
        }
        if (candidate.limitation) {
          item.append(createNode('p', 'research-candidate-limitation', `Grenze: ${candidate.limitation}`))
        }
        section.append(item)
      })
    }
    parent.append(section)
  }

  function renderReview(parent, run) {
    const review = buildResearchReview({
      run,
      candidates: run.candidates || [],
      searchOutcomes: run.searchOutcomes || [],
    })
    const section = createNode('section', 'research-review')
    section.id = 'researchReview'
    section.append(createNode('h3', 'onda-blaetter__tiefe-titel source-section-title', 'Geprüfte Recherchelage'))
    renderCandidateGroup(section, 'Widersprechende Befunde', review.counterEvidence, (
      review.notes.find(note => /Gegenbeleg/.test(note)) || 'Gegenbelegsuche noch nicht abgeschlossen.'
    ))
    renderCandidateGroup(section, 'Methodische Grenzen', review.limitations, (
      review.notes.find(note => /Grenzensuche/.test(note)) || 'Grenzensuche noch nicht abgeschlossen.'
    ))
    renderCandidateGroup(section, 'Stützende Befunde', review.support, 'Noch keine stützende Originalfundstelle.')
    if (review.openGaps.length) {
      section.append(createNode('p', 'research-review-warning', `Noch offen: ${review.openGaps.map(value => PURPOSE_LABELS[value]).join(', ')}.`))
    }
    if (review.conflictStatus === 'mixed') {
      section.append(createNode('p', 'research-review-mixed', 'Die Beleglage ist gemischt. Widersprüche bleiben im Belegbündel sichtbar.'))
    }
    parent.append(section)
    return review
  }

  function renderToolLog(parent, run) {
    const details = createNode('details', 'research-tool-log')
    details.id = 'researchToolLog'
    const summary = document.createElement('summary')
    summary.textContent = `Werkzeugprotokoll · ${(run.toolEvents || []).length}`
    details.append(summary)
    const list = createNode('ol', 'research-tool-events')
    ;(run.toolEvents || []).forEach(event => {
      const query = event.input?.query || event.input?.doi || 'normalisierte Eingabe'
      const item = createNode('li', 'research-tool-event')
      item.append(
        createNode('strong', '', `${event.tool} · ${event.status}`),
        createNode('span', '', query),
        createNode('span', '', `${event.adapter?.name || 'Adapter'} ${event.adapter?.version || ''}`.trim()),
      )
      list.append(item)
    })
    if (!list.children.length) list.append(createNode('li', 'research-result-empty', 'Noch kein Werkzeug aufgerufen.'))
    details.append(list)
    parent.append(details)
  }

  async function beginOrResume(body, project, run, renderLibrary) {
    const adapter = adapterFrom(getAdapter())
    if (!adapter) {
      renderResearchRun(body, project, run, renderLibrary, 'Kein Recherchezugang verbunden. Der lokale Plan bleibt erhalten.')
      return
    }
    let running
    try {
      running = transitionResearchRun(run, 'running', {
        at: Date.now(),
        reason: run.status === 'planned' ? 'user-start' : 'user-resume',
      })
    } catch (error) {
      renderResearchRun(body, project, run, renderLibrary, error?.message || 'Lauf kann nicht gestartet werden.')
      return
    }
    persistRun(project, running)
    const controller = new AbortController()
    executions.set(run.id, controller)
    renderResearchRun(body, project, running, renderLibrary)
    try {
      const finalRun = await executeResearchPaths(running, {
        adapter,
        signal: controller.signal,
        onProgress: progress => {
          if (cancelledRuns.has(run.id)) return
          persistRun(project, progress)
          renderResearchRun(body, project, progress, renderLibrary)
        },
      })
      if (!cancelledRuns.has(run.id)) {
        persistRun(project, finalRun)
        renderResearchRun(body, project, finalRun, renderLibrary)
      }
    } catch (error) {
      if (!cancelledRuns.has(run.id)) {
        const failed = transitionResearchRun(running, 'failed', { at: Date.now(), reason: 'orchestrator-error' })
        persistRun(project, failed)
        renderResearchRun(body, project, failed, renderLibrary, error?.message || 'Recherche unterbrochen.')
      }
    } finally {
      executions.delete(run.id)
      cancelledRuns.delete(run.id)
    }
  }

  async function commitReview(body, project, run, review, renderLibrary) {
    const outcome = await commitResearchReview({
      project,
      run,
      review,
      at: Date.now(),
    }, { sha256: browserSha256 })
    if (!outcome.committed) {
      renderResearchRun(body, project, run, renderLibrary, `Noch nicht übernehmbar: ${outcome.error}.`)
      return
    }
    project.sources = outcome.project.sources
    project.evidenceBundles = outcome.project.evidenceBundles
    project.researchRuns = outcome.project.researchRuns
    context.persist()
    onProjectChanged()
    renderResearchRun(body, project, outcome.run, renderLibrary, 'Geprüfte Fundstellen wurden in das Projektwissen übernommen.')
  }

  function cancelRun(body, project, run, renderLibrary) {
    cancelledRuns.add(run.id)
    executions.get(run.id)?.abort()
    const cancelled = transitionResearchRun(run, 'cancelled', { at: Date.now(), reason: 'user-cancel' })
    persistRun(project, cancelled)
    renderResearchRun(body, project, cancelled, renderLibrary)
  }

  function renderResearchRun(body, project, run, renderLibrary, message = '') {
    body.replaceChildren()
    const current = project.researchRuns.find(candidate => candidate.id === run.id) || run
    const section = createNode('section', 'research-run-view')
    section.id = 'researchRunView'
    section.dataset.status = current.status
      const back = actionButton('Zur Quellenliste', 'research-back')
      back.prepend(ondaIcon('arrow-left', { size: 16 }))
    back.id = 'researchRunBack'
    back.addEventListener('click', () => renderLibrary())
    const status = createNode('span', `research-run-status is-${current.status}`, STATUS_LABELS[current.status] || current.status)
    const header = createNode('div', 'research-run-header')
    header.append(
      createNode('span', 'source-reader-kicker', 'Recherchefrage'),
      createNode('h3', 'research-run-question', current.question),
      createNode('p', 'research-run-claim', current.claimText),
      status,
      createNode('span', 'research-run-budget', `${current.budget?.toolCalls || 0} von ${current.stopConditions.maxToolCalls} Werkzeugaufrufen · ${current.candidates?.length || 0} Funde`),
    )
    section.append(back, header)
    if (message) {
      const live = createNode('p', 'research-status-line', message)
      live.id = 'researchRunMessage'
      live.setAttribute('role', 'status')
      section.append(live)
    }

    const paths = createNode('ol', 'research-path-list')
    current.searchPaths.forEach(path => {
      const completed = (current.toolEvents || []).some(event => (
        event.status === 'completed' && event.pathFingerprint === researchPathFingerprint(path)
      ))
      const item = createNode('li', `research-path ${completed ? 'is-complete' : ''}`)
      item.append(
        createNode('strong', '', PURPOSE_LABELS[path.purpose] || path.purpose),
        createNode('span', '', completed ? 'geprüft' : 'offen'),
      )
      paths.append(item)
    })
    section.append(paths)

    let review = null
    if ((current.candidates || []).length || ['review-ready', 'completed'].includes(current.status)) {
      review = renderReview(section, current)
    }
    renderToolLog(section, current)

    const controls = createNode('div', 'research-controls')
    const adapterAvailable = Boolean(adapterFrom(getAdapter()))
    if (['planned', 'paused', 'failed'].includes(current.status)) {
      const start = actionButton(current.status === 'planned' ? 'Recherche starten' : 'Recherche fortsetzen', 'research-primary')
      start.id = current.status === 'planned' ? 'researchStart' : 'researchResume'
      start.disabled = !adapterAvailable
      start.title = adapterAvailable ? '' : 'Noch kein Recherchezugang verbunden'
      start.addEventListener('click', () => beginOrResume(body, project, current, renderLibrary))
      controls.append(start)
    }
    if (current.status === 'running') {
      const pause = actionButton('Pausieren')
      pause.id = 'researchPause'
      pause.addEventListener('click', () => executions.get(current.id)?.abort())
      controls.append(pause)
    }
    if (current.status === 'review-ready' && review) {
      const usableSupport = review.support.some(candidate => candidate.usableAsEvidence)
      const commit = actionButton('Geprüfte Fundstellen übernehmen', 'research-primary')
      commit.id = 'researchCommit'
      commit.disabled = !usableSupport || review.openGaps.length > 0
      commit.title = !usableSupport
        ? 'Mindestens eine geprüfte stützende Originalfundstelle ist erforderlich'
        : review.openGaps.length ? 'Gegenbelege und Grenzen müssen zuerst geprüft werden' : ''
      commit.addEventListener('click', () => commitReview(body, project, current, review, renderLibrary))
      controls.append(commit)
    }
    if (['planned', 'running', 'paused', 'review-ready', 'failed'].includes(current.status)) {
      const cancel = actionButton('Lauf abbrechen', 'research-cancel')
      cancel.id = 'researchCancel'
      cancel.addEventListener('click', () => cancelRun(body, project, current, renderLibrary))
      controls.append(cancel)
    }
    section.append(controls)
    if (!adapterAvailable && ['planned', 'paused', 'failed'].includes(current.status)) {
      section.append(createNode('p', 'research-adapter-note', 'Recherchezugang nicht verbunden. Der Plan ist lokal gespeichert; es werden keine Ergebnisse simuliert.'))
    }
    body.append(section)
    requestAnimationFrame(() => back.focus({ preventScroll: true }))
  }

  function buildResearchOverview(body, project, renderLibrary) {
    const section = createNode('section', 'research-overview')
    section.id = 'researchOverview'
    const header = createNode('div', 'research-overview-header')
    const title = createNode('div')
    title.append(
      // Kein Zaehler in der Ueberschrift: die Liste darunter sagt selbst, wie viele es sind.
      createNode('h3', 'onda-blaetter__tiefe-titel source-section-title', 'Rechercheläufe'),
      createNode('p', 'research-overview-copy', 'Begrenzte Suchwege mit Gegenbelegen, Grenzen und vollständigem Werkzeugprotokoll.'),
    )
    const create = actionButton('Recherche planen', 'research-primary')
    create.id = 'researchPlanOpen'
    create.addEventListener('click', () => renderPlanForm(body, project, renderLibrary))
    header.append(title, create)
    section.append(header)
    if (project.researchRuns.length) {
      const list = createNode('div', 'research-run-list')
      project.researchRuns.slice().reverse().forEach(run => {
        const item = createNode('article', 'research-run-card')
        item.dataset.researchRunId = run.id
        const identity = createNode('div', 'research-run-card-copy')
        identity.append(
          createNode('strong', 'research-run-card-question', run.question),
          createNode('span', 'research-run-card-claim', run.claimText),
          createNode('span', `research-run-status is-${run.status}`, STATUS_LABELS[run.status] || run.status),
        )
        const open = actionButton('Öffnen')
        open.addEventListener('click', () => renderResearchRun(body, project, run, renderLibrary))
        item.append(identity, open)
        list.append(item)
      })
      section.append(list)
    }
    return section
  }

  return { buildResearchOverview, renderPlanForm, renderResearchRun }
}
