// Die Bedienoberfläche des Gedächtnisses — DOM, deshalb nicht node-testbar.
//
// Zeigt das Projekt-Dossier (memory-dossier.mjs), lässt einzelne Zeilen richtigstellen,
// Einträge von Hand anlegen, Übertragungen zwischen Projekten entscheiden und den ganzen
// Speicher ausgeben oder löschen (memory-portability.mjs).
//
// Gehört zur Browser-App (Einstiegspunkt src/editor.js), aufgebaut von src/workspace.js.
import { ERKANNTES_TYP } from './erkanntes-model.mjs'
import { correctDossierItem, synchronizeProjectMemory } from './memory-dossier.mjs'
import { createMemoryEntry } from './memory-model.mjs'
import { deleteMemoryScope, exportMemory } from './memory-portability.mjs'
import { createTransferRequest, decideMemoryTransfer, retrieveMemoryContext } from './memory-retrieval.mjs'

const SECTION_LABELS = Object.freeze({
  goals: 'Ziele und Wirkung',
  terms: 'Bestätigte Begriffe',
  sources: 'Quellen',
  evidence: 'Belegte Aussagen',
  decisions: 'Autorentscheidungen und Risiken',
  research: 'Recherchelagen',
})

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function createMemoryUi({ context, createNode, openDialog }) {
  function synchronize(project) {
    const result = synchronizeProjectMemory({
      project,
      docs: context.state.docs,
      store: context.state.memoryStore,
    })
    context.state.memoryStore = result.store
    project.memory = result.projectMemory
    return result.dossier
  }

  function projectName(id) {
    return context.state.projects.find(project => project.id === id)?.name || 'Anderes Projekt'
  }

  function persistMemory() {
    context.persist()
  }

  function renderCorrection(body, project, dossier, item, render) {
    const form = createNode('form', 'memory-correction-form')
    const input = document.createElement('textarea')
    input.className = 'memory-correction-input'
    input.rows = 3
    input.value = item.value
    input.setAttribute('aria-label', `${item.label} korrigieren`)
    const save = createNode('button', 'memory-primary', 'Korrektur speichern')
    save.type = 'submit'
    const cancel = createNode('button', 'memory-action', 'Abbrechen')
    cancel.type = 'button'
    cancel.addEventListener('click', () => render(body, project))
    form.append(input, save, cancel)
    form.addEventListener('submit', event => {
      event.preventDefault()
      const result = correctDossierItem({
        project,
        docs: context.state.docs,
        store: context.state.memoryStore,
        targetId: item.id,
        value: input.value,
        at: Date.now(),
      })
      context.state.memoryStore = result.store
      project.memory = result.projectMemory
      persistMemory()
      render(body, project, 'Korrektur gespeichert. Der ursprüngliche Projektzustand blieb unverändert.')
    })
    body.replaceChildren(form)
    requestAnimationFrame(() => input.focus({ preventScroll: true }))
  }

  function renderDossierSection(parent, key, items, body, project, dossier, render) {
    const section = createNode('section', 'memory-section')
    section.append(createNode('h3', 'memory-section-title', SECTION_LABELS[key]))
    if (!items.length) {
      section.append(createNode('p', 'memory-empty', 'Noch kein bestätigter Eintrag.'))
    } else {
      items.forEach(item => {
        const card = createNode('article', 'memory-item')
        const copy = createNode('div', 'memory-item-copy')
        copy.append(
          createNode('strong', 'memory-item-label', item.label),
          createNode('p', 'memory-item-value', item.value),
          createNode('span', 'memory-item-origin', `${item.originEventIds.length} Ursprungsereignis${item.originEventIds.length === 1 ? '' : 'se'}`),
        )
        if (item.corrected) copy.append(createNode('span', 'memory-corrected', 'Nutzerkorrektur aktiv'))
        card.append(copy)
        if (['goals', 'terms'].includes(key)) {
          const correct = createNode('button', 'memory-action', 'Korrigieren')
          correct.type = 'button'
          correct.addEventListener('click', () => renderCorrection(body, project, dossier, item, render))
          card.append(correct)
        }
        section.append(card)
      })
    }
    parent.append(section)
  }

  function renderPendingTransfers(parent, body, project, render) {
    const pending = context.state.memoryStore.transfers.filter(transfer => (
      transfer.toProjectId === project.id && transfer.status === 'pending'
    ))
    if (!pending.length) return
    const section = createNode('section', 'memory-section memory-consent-section')
    section.append(
      createNode('span', 'memory-kicker', 'Projektübergreifende Erinnerung'),
      createNode('h3', 'memory-section-title', `Freigabe prüfen · ${pending.length}`),
    )
    pending.forEach(transfer => {
      const card = createNode('article', 'memory-consent-card')
      const sensitive = transfer.sensitivity !== 'standard'
      card.append(
        createNode('strong', 'memory-item-label', `Aus ${projectName(transfer.fromProjectId)}`),
        createNode('p', 'memory-item-value', sensitive
          ? 'Der Inhalt ist als sensibel markiert. Er wird erst nach deiner ausdrücklichen Freigabe in dieses Projekt übernommen.'
          : transfer.contentPreview),
        createNode('span', `memory-sensitivity is-${transfer.sensitivity}`, sensitive ? 'sensibel' : 'normal'),
      )
      const actions = createNode('div', 'memory-consent-actions')
      const approve = createNode('button', 'memory-primary', 'Für dieses Projekt freigeben')
      approve.type = 'button'
      approve.addEventListener('click', () => {
        context.state.memoryStore = decideMemoryTransfer(context.state.memoryStore, transfer.id, {
          approved: true,
          actor: 'user',
          at: Date.now(),
        })
        persistMemory()
        render(body, project, 'Erinnerung wurde nur für dieses Projekt freigegeben.')
      })
      const reject = createNode('button', 'memory-action', 'Nicht übernehmen')
      reject.type = 'button'
      reject.addEventListener('click', () => {
        context.state.memoryStore = decideMemoryTransfer(context.state.memoryStore, transfer.id, {
          approved: false,
          actor: 'user',
          at: Date.now(),
        })
        persistMemory()
        render(body, project, 'Vorschlag abgelehnt. Es wurde keine Erinnerung übernommen.')
      })
      actions.append(approve, reject)
      card.append(actions)
      section.append(card)
    })
    parent.append(section)
  }

  function ensureProjectEntry(project, item, dossier) {
    const id = `memory-project:${project.id}:${item.id}`
    let entry = context.state.memoryStore.entries.find(candidate => candidate.id === id)
    if (entry) return entry
    entry = createMemoryEntry({
      id,
      level: 'project',
      type: item.id.includes('voice') ? 'voice' : 'knowledge',
      content: item.value,
      scope: { projectId: project.id },
      provenance: {
        actor: 'user',
        action: 'share-proposal',
        originEventIds: item.originEventIds,
      },
      sensitivity: 'sensitive',
      deletionRule: 'with-project',
      createdAt: Date.now(),
    })
    context.state.memoryStore.entries.push(entry)
    return entry
  }

  function renderTransferComposer(parent, body, project, dossier, render) {
    const targets = context.state.projects.filter(candidate => candidate.id !== project.id && !candidate.example)
    const goal = dossier.goals[0]
    if (!targets.length || !goal) return
    const details = createNode('details', 'memory-transfer-compose')
    const summary = document.createElement('summary')
    summary.textContent = 'Eine bestätigte Erinnerung für ein anderes Projekt vorschlagen'
    const form = createNode('form', 'memory-transfer-form')
    const target = document.createElement('select')
    target.className = 'memory-select'
    target.setAttribute('aria-label', 'Zielprojekt')
    targets.forEach(project => {
      const option = document.createElement('option')
      option.value = project.id
      option.textContent = project.name
      target.append(option)
    })
    const level = document.createElement('select')
    level.className = 'memory-select'
    level.setAttribute('aria-label', 'Erinnerungsebene')
    ;[['topic', 'Themenwissen'], ['personal', 'Persönliche Präferenz']].forEach(([value, label]) => {
      const option = document.createElement('option')
      option.value = value
      option.textContent = label
      level.append(option)
    })
    const submit = createNode('button', 'memory-primary', 'Freigabe vorschlagen')
    submit.type = 'submit'
    form.append(
      createNode('p', 'memory-transfer-preview', `${goal.label}: ${goal.value}`),
      target,
      level,
      submit,
    )
    form.addEventListener('submit', event => {
      event.preventDefault()
      try {
        const entry = ensureProjectEntry(project, goal, dossier)
        context.state.memoryStore = createTransferRequest(context.state.memoryStore, {
          id: `memory-transfer:${entry.id}:${target.value}:${Date.now()}`,
          entryId: entry.id,
          fromProjectId: project.id,
          toProjectId: target.value,
          suggestedLevel: level.value,
          at: Date.now(),
        })
        persistMemory()
        render(body, project, `Freigabevorschlag für ${projectName(target.value)} gespeichert.`)
      } catch (error) {
        render(body, project, error?.message || 'Freigabevorschlag konnte nicht gespeichert werden.')
      }
    })
    details.append(summary, form)
    parent.append(details)
  }

  function renderSharedMemory(parent, project) {
    const available = retrieveMemoryContext({
      store: context.state.memoryStore,
      projectId: project.id,
      textId: context.activeDoc()?.id || null,
    }).records
    // Die Ebene allein reicht als Filter nicht: ein erkanntes Prinzip liegt ebenfalls auf
    // 'personal'. Hier wäre es dreifach falsch — als "Persönliche Präferenz" beschriftet,
    // mit einer Projektfreigabe begründet, die niemand erteilt hat (ein Prinzip gilt
    // projektübergreifend), und einmal je Begegnung untereinander. Sein Ort ist der eigene
    // Abschnitt, den renderErkanntes in workspace.js über erkanntesListe gruppiert zeigt.
    const records = available.filter(record => (
      ['topic', 'personal'].includes(record.entry.level) && record.entry.type !== ERKANNTES_TYP
    ))
    if (!records.length) return
    const section = createNode('section', 'memory-section memory-shared-section')
    section.append(createNode('h3', 'memory-section-title', 'Freigegebene Erinnerungen'))
    records.forEach(record => {
      const item = createNode('article', 'memory-item')
      const copy = createNode('div', 'memory-item-copy')
      copy.append(
        createNode('strong', 'memory-item-label', record.entry.level === 'personal' ? 'Persönliche Präferenz' : 'Themenwissen'),
        createNode('p', 'memory-item-value', record.entry.content),
        createNode('span', 'memory-item-origin', record.reason),
      )
      item.append(copy)
      section.append(item)
    })
    parent.append(section)
  }

  function downloadProjectMemory(project) {
    const payload = exportMemory({
      store: context.state.memoryStore,
      projects: context.state.projects,
      scope: { kind: 'project', projectId: project.id },
    })
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${(project.name || 'projekt').replace(/[^\p{L}\p{N}-]+/gu, '-')}-gedaechtnis.json`
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  function renderDangerZone(parent, body, project, render) {
    const section = createNode('section', 'memory-portability')
    const exportButton = createNode('button', 'memory-action', 'Projektgedächtnis exportieren')
    exportButton.id = 'memoryExport'
    exportButton.type = 'button'
    exportButton.addEventListener('click', () => downloadProjectMemory(project))
    const remove = createNode('button', 'memory-action memory-delete', 'Projektgedächtnis löschen')
    remove.id = 'memoryDelete'
    remove.type = 'button'
    remove.addEventListener('click', () => {
      const confirmation = createNode('div', 'memory-delete-confirmation')
      confirmation.append(createNode('p', '', 'Das Dossier, seine Ereignisse und offenen Freigaben werden gelöscht. Texte und Quellen bleiben erhalten.'))
      const confirm = createNode('button', 'memory-delete-confirm', 'Gedächtnis endgültig löschen')
      confirm.id = 'memoryDeleteConfirm'
      confirm.type = 'button'
      confirm.addEventListener('click', () => {
        const result = deleteMemoryScope({
          store: context.state.memoryStore,
          projects: context.state.projects,
          scope: { kind: 'project', projectId: project.id },
        })
        context.state.memoryStore = result.store
        context.state.projects.splice(0, context.state.projects.length, ...result.projects)
        persistMemory()
        const updated = context.state.projects.find(candidate => candidate.id === project.id)
        render(body, updated, 'Projektgedächtnis gelöscht. Texte und Quellen blieben erhalten.')
      })
      const cancel = createNode('button', 'memory-action', 'Abbrechen')
      cancel.type = 'button'
      cancel.addEventListener('click', () => confirmation.remove())
      confirmation.append(confirm, cancel)
      section.append(confirmation)
      confirm.focus()
    })
    section.append(exportButton, remove)
    parent.append(section)
  }

  function renderDisabled(body, project, message, render) {
    const section = createNode('section', 'memory-disabled')
    section.append(
      createNode('h3', 'memory-section-title', 'Projektgedächtnis ist gelöscht'),
      createNode('p', 'memory-empty', 'Es wird nicht still neu aufgebaut. Texte, Quellen und Entscheidungen bleiben davon unberührt.'),
    )
    const rebuild = createNode('button', 'memory-primary', 'Gedächtnis neu aufbauen')
    rebuild.id = 'memoryRebuild'
    rebuild.type = 'button'
    rebuild.addEventListener('click', () => {
      project.memory.enabled = true
      persistMemory()
      render(body, project, 'Projektgedächtnis wurde aus den unveränderten Primärdaten neu aufgebaut.')
    })
    section.append(rebuild)
    body.append(section)
    if (message) body.prepend(createNode('p', 'memory-status', message))
  }

  function render(body, project, message = '') {
    body.replaceChildren()
    if (!project.memory?.enabled) {
      renderDisabled(body, project, message, render)
      return
    }
    const dossier = synchronize(project)
    if (message) {
      const status = createNode('p', 'memory-status', message)
      status.setAttribute('role', 'status')
      body.append(status)
    }
    const intro = createNode('section', 'memory-intro')
    intro.append(
      createNode('span', 'memory-kicker', 'Abgeleitet · lokal · korrigierbar'),
      createNode('p', 'memory-intro-copy', 'Dieses Dossier verdichtet bestätigte Projektzustände. Quellen, Entscheidungen und Ursprungsereignisse bleiben unverändert.'),
      createNode('span', 'memory-event-count', `${dossier.originEventIds.length} Ursprungsereignisse`),
    )
    body.append(intro)
    renderPendingTransfers(body, body, project, render)
    renderSharedMemory(body, project)
    for (const key of ['goals', 'terms', 'sources', 'evidence', 'decisions', 'research']) {
      renderDossierSection(body, key, dossier[key], body, project, dossier, render)
    }
    renderTransferComposer(body, body, project, dossier, render)
    renderDangerZone(body, body, project, render)
    body.scrollTop = 0
  }

  function open(project, opener) {
    openDialog({
      id: 'memoryModal',
      title: 'Projektgedächtnis',
      opener,
      build: body => render(body, project),
    })
  }

  return { open, render }
}
