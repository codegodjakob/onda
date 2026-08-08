// Die Oberfläche für den Schluss eines Textes und für die Datenhoheit. Sie zeigt die
// Schlussprüfung nach Gruppen (final-audit.mjs), den Autorschaftsnachweis und die Erklärung
// zur KI-Nutzung (authorship-proof.mjs), gibt den Text in Markdown, HTML oder JATS aus
// (publication-export.mjs) und bedient Voll-Export, Einspielen und Alles-Löschen
// (data-control.mjs). Braucht ein document.
//
// Gehört zur Browser-App (src/editor.js): src/workspace.js ruft createAuditUi auf.
import { buildAiUsageDeclaration, buildAuthorshipProof } from './authorship-proof.mjs'
import {
  exportAllLocalData,
  importAllLocalData,
  validateAllLocalDataExport,
} from './data-control.mjs'
import { recordFinalAudit, runFinalAudit } from './final-audit.mjs'
import {
  buildPublicationDocument,
  publicationFilename,
  renderHtml,
  renderJats,
  renderMarkdown,
} from './publication-export.mjs'

const FORMAT_META = Object.freeze({
  markdown: { label: 'Markdown', mime: 'text/markdown;charset=utf-8' },
  html: { label: 'HTML', mime: 'text/html;charset=utf-8' },
  jats: { label: 'JATS XML', mime: 'application/xml;charset=utf-8' },
})

function appendAiDeclaration(format, content, declaration) {
  if (!declaration) return content
  const activities = declaration.activities.join(' ')
  if (format === 'markdown') {
    return `${content.trimEnd()}\n\n## Erklärung zur KI-Nutzung\n\n${activities}\n`
  }
  if (format === 'html') {
    const section = `<section aria-labelledby="ai-usage-heading"><h2 id="ai-usage-heading">Erklärung zur KI-Nutzung</h2><p>${escapeMarkup(activities)}</p></section>`
    return content.replace('</article>', `${section}</article>`)
  }
  const section = `<sec sec-type="ai-usage"><title>Erklärung zur KI-Nutzung</title><p>${escapeMarkup(activities)}</p></sec>`
  return content.replace('</body>', `${section}</body>`)
}

function escapeMarkup(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function statusLabel(status) {
  return {
    open: 'offen',
    parked: 'geparkt',
    resolved: 'gelöst',
    dismissed: 'verworfen',
    'risk-accepted': 'Risiko angenommen',
    superseded: 'ersetzt',
  }[status] || status
}

function publicationOutput(format, document) {
  if (format === 'markdown') return renderMarkdown(document)
  if (format === 'html') return renderHtml(document)
  if (format === 'jats') return renderJats(document)
  throw new TypeError('Publication format is invalid')
}

export function createAuditUi({
  context,
  createNode,
  openDialog,
  getEditorJson,
  download,
  importLocalState,
  deleteAllLocalData,
} = {}) {
  if (!context || typeof createNode !== 'function' || typeof openDialog !== 'function') {
    throw new TypeError('Audit UI context is required')
  }
  let securedExportFingerprint = null

  function renderAuditGroups(container, audit) {
    const groups = createNode('div', 'audit-groups')
    audit.groups.forEach(group => {
      const section = createNode('section', 'audit-group')
      const header = createNode('div', 'audit-group-header')
      const heading = createNode('h3', 'audit-group-title', group.label)
      const count = createNode('span', 'audit-group-count', String(group.count))
      count.setAttribute('aria-label', `${group.count} Einträge`)
      header.append(heading, count)
      section.append(header)
      if (!group.entries.length) {
        section.append(createNode('p', 'audit-empty', 'Keine Einträge'))
      } else {
        const list = createNode('ul', 'audit-entry-list')
        group.entries.forEach(entry => {
          const item = createNode('li', `audit-entry is-${entry.status}`)
          const label = createNode('span', 'audit-entry-message', entry.message || entry.code || entry.category)
          const meta = createNode(
            'span',
            'audit-entry-meta',
            `${statusLabel(entry.status)} · ${entry.priority}${entry.hardBlocker ? ' · harter Blocker' : ''}`,
          )
          item.append(label, meta)
          list.append(item)
        })
        section.append(list)
      }
      groups.append(section)
    })
    container.append(groups)
  }

  function renderAuthorship(container, proof) {
    const details = createNode('details', 'audit-authorship')
    const summary = createNode('summary', '', 'Privater Autorschaftsnachweis')
    details.append(summary)
    details.append(createNode('p', 'audit-muted', proof.observationLimit))
    const list = createNode('ul', 'audit-contribution-list')
    proof.contributions.forEach(item => {
      list.append(createNode('li', '', item.activity))
    })
    if (!proof.contributions.length) list.append(createNode('li', '', 'Keine beobachtbaren Beitragsereignisse vorhanden.'))
    details.append(list)
    container.append(details)
  }

  function open(project, opener) {
    const doc = context.activeDoc()
    if (!project || !doc || doc.projectId !== project.id) return null
    context.flushSave?.()
    const audit = runFinalAudit({
      project,
      docs: context.state.docs,
      textId: doc.id,
      at: Date.now(),
    })
    recordFinalAudit({ project, audit })
    context.persist()
    const proof = buildAuthorshipProof({ project, docs: context.state.docs })
    const requiresRiskConfirmation = audit.status === 'blocked' || audit.acceptedRisks.length > 0

    return openDialog({
      id: 'auditModal',
      title: 'Schlussaudit & Export',
      opener,
      build: body => {
        const intro = createNode('section', 'audit-overview')
        const status = createNode('p', `audit-status is-${audit.status}`, audit.statusLabel)
        status.setAttribute('role', 'status')
        intro.append(status, createNode('p', 'audit-decision-notice', audit.userDecisionNotice))
        const versions = createNode(
          'p',
          'audit-versions',
          `Regeln ${audit.ruleVersion} · Modell ${audit.modelVersion} · Daten ${audit.dataVersion} · ${audit.fingerprint}`,
        )
        intro.append(versions)
        body.append(intro)
        renderAuditGroups(body, audit)
        renderAuthorship(body, proof)

        const publication = createNode('section', 'audit-publication')
        publication.append(createNode('h3', '', 'Publikation'))
        const formatLabel = createNode('label', 'audit-field-label', 'Format')
        formatLabel.htmlFor = 'publicationFormat'
        const format = createNode('select', 'audit-select')
        format.id = 'publicationFormat'
        Object.entries(FORMAT_META).forEach(([value, meta]) => {
          const option = createNode('option', '', meta.label)
          option.value = value
          format.append(option)
        })
        publication.append(formatLabel, format)

        const aiRow = createNode('label', 'audit-check-row')
        const aiEnabled = createNode('input')
        aiEnabled.type = 'checkbox'
        aiEnabled.id = 'aiUsageDeclaration'
        aiRow.append(aiEnabled, createNode('span', '', 'Belegbare KI-Nutzungserklärung aufnehmen'))
        publication.append(aiRow)

        let riskConfirmed = null
        if (requiresRiskConfirmation) {
          const riskNotice = createNode(
            'p',
            'audit-risk-notice',
            'Der Export enthält einen nicht freigabereifen Stand oder angenommene Risiken. Der Auditstatus bleibt unverändert.',
          )
          const riskRow = createNode('label', 'audit-check-row audit-risk-confirmation')
          riskConfirmed = createNode('input')
          riskConfirmed.type = 'checkbox'
          riskConfirmed.setAttribute('aria-label', 'Risiko verstanden und Export bewusst bestätigen')
          riskRow.append(riskConfirmed, createNode('span', '', 'Risiko verstanden; diesen Stand bewusst exportieren'))
          publication.append(riskNotice, riskRow)
        }

        const publicationStatus = createNode('p', 'audit-action-status')
        publicationStatus.setAttribute('role', 'status')
        const exportButton = createNode(
          'button',
          'onda-btn audit-export-button',
          requiresRiskConfirmation ? 'Trotz Risiko exportieren' : 'Publikation exportieren',
        )
        exportButton.type = 'button'
        exportButton.disabled = Boolean(requiresRiskConfirmation)
        riskConfirmed?.addEventListener('change', () => {
          exportButton.disabled = !riskConfirmed.checked
        })
        exportButton.addEventListener('click', () => {
          if (requiresRiskConfirmation && !riskConfirmed?.checked) return
          const selectedFormat = format.value
          const publicationDocument = buildPublicationDocument({
            projectId: project.id,
            textId: doc.id,
            title: context.docTitle(doc),
            editorJson: getEditorJson(),
            footnotes: doc.footnotes || [],
            citations: (project.citations || []).filter(item => !item?.textId || item.textId === doc.id),
            bibliography: (project.bibliography || []).filter(item => !item?.textId || item.textId === doc.id),
          })
          const declaration = buildAiUsageDeclaration({ proof, enabled: aiEnabled.checked })
          const output = appendAiDeclaration(
            selectedFormat,
            publicationOutput(selectedFormat, publicationDocument),
            declaration,
          )
          download(
            publicationFilename(context.docTitle(doc), selectedFormat),
            output,
            FORMAT_META[selectedFormat].mime,
          )
          publicationStatus.textContent = `${FORMAT_META[selectedFormat].label} wurde lokal vorbereitet. Der Auditstatus blieb ${audit.statusLabel}.`
        })
        publication.append(exportButton, publicationStatus)
        body.append(publication)

        const data = createNode('section', 'audit-data-control')
        data.append(createNode('h3', '', 'Lokale Datenkontrolle'))
        data.append(createNode(
          'p',
          'audit-muted',
          'Sichere den vollständigen lokalen Bestand, prüfe ein Datenpaket oder lösche ihn nach einer gültigen Sicherung.',
        ))
        const dataStatus = createNode('p', 'audit-action-status')
        dataStatus.setAttribute('role', 'status')
        const controls = createNode('div', 'audit-data-actions')
        const exportAll = createNode('button', 'onda-btn onda-btn--ghost', 'Gesamtdaten sichern')
        exportAll.type = 'button'
        const deleteLocal = createNode('button', 'onda-btn onda-btn--ghost audit-delete-start', 'Lokale Daten löschen')
        deleteLocal.type = 'button'
        deleteLocal.disabled = true
        const importLabel = createNode('label', 'onda-btn onda-btn--ghost audit-import-label', 'Datenpaket einlesen')
        const importInput = createNode('input', 'visually-hidden')
        importInput.type = 'file'
        importInput.accept = 'application/json,.json'
        importInput.setAttribute('aria-label', 'Vollständiges lokales Datenpaket auswählen')
        importLabel.append(importInput)
        controls.append(exportAll, importLabel, deleteLocal)
        data.append(controls, dataStatus)

        exportAll.addEventListener('click', () => {
          context.flushSave?.()
          const payload = exportAllLocalData({ state: context.state, at: Date.now() })
          const result = validateAllLocalDataExport(payload)
          if (!result.valid) {
            securedExportFingerprint = null
            deleteLocal.disabled = true
            dataStatus.textContent = `Sicherung nicht gültig: ${result.errors.join(' ')}`
            return
          }
          securedExportFingerprint = payload.fingerprint
          download(
            `onda-gesamtdaten-${new Date(payload.exportedAt).toISOString().slice(0, 10)}.json`,
            `${JSON.stringify(payload, null, 2)}\n`,
            'application/json;charset=utf-8',
          )
          deleteLocal.disabled = false
          dataStatus.textContent = 'Vollständige lokale Sicherung wurde erzeugt und geprüft.'
        })

        importInput.addEventListener('change', async () => {
          const file = importInput.files?.[0]
          if (!file) return
          try {
            const payload = JSON.parse(await file.text())
            const nextState = importAllLocalData(payload)
            await importLocalState(nextState)
          } catch (error) {
            dataStatus.textContent = `Datenpaket nicht übernommen: ${text(error?.message) || 'ungültiges Format'}`
            importInput.value = ''
          }
        })

        const confirm = createNode('section', 'audit-delete-confirmation')
        confirm.hidden = true
        confirm.append(createNode(
          'p',
          'audit-risk-notice',
          'Dieser Schritt entfernt Texte, Projekte, Quellen, Verläufe, Erinnerung und den gespeicherten API-Schlüssel nur von diesem Gerät.',
        ))
        const deleteLabel = createNode('label', 'audit-field-label', 'Zur Bestätigung LÖSCHEN eingeben')
        deleteLabel.htmlFor = 'deleteAllConfirmation'
        const deleteInput = createNode('input', 'audit-delete-input')
        deleteInput.id = 'deleteAllConfirmation'
        deleteInput.autocomplete = 'off'
        const finalDelete = createNode('button', 'onda-btn audit-delete-final', 'Endgültig lokal löschen')
        finalDelete.type = 'button'
        finalDelete.disabled = true
        const cancel = createNode('button', 'onda-btn onda-btn--ghost', 'Abbrechen')
        cancel.type = 'button'
        deleteInput.addEventListener('input', () => {
          finalDelete.disabled = deleteInput.value.trim() !== 'LÖSCHEN'
        })
        cancel.addEventListener('click', () => {
          confirm.hidden = true
          deleteInput.value = ''
          finalDelete.disabled = true
          deleteLocal.focus()
        })
        finalDelete.addEventListener('click', async () => {
          context.flushSave?.()
          const current = exportAllLocalData({ state: context.state, at: Date.now() })
          if (!securedExportFingerprint || current.fingerprint !== securedExportFingerprint) {
            securedExportFingerprint = null
            deleteLocal.disabled = true
            confirm.hidden = true
            dataStatus.textContent = 'Der Bestand hat sich seit der Sicherung geändert. Bitte erneut sichern.'
            return
          }
          finalDelete.disabled = true
          dataStatus.textContent = 'Lokale Daten werden gelöscht …'
          await deleteAllLocalData()
        })
        confirm.append(deleteLabel, deleteInput, finalDelete, cancel)
        data.append(confirm)
        deleteLocal.addEventListener('click', () => {
          context.flushSave?.()
          const current = exportAllLocalData({ state: context.state, at: Date.now() })
          if (!securedExportFingerprint || current.fingerprint !== securedExportFingerprint) {
            securedExportFingerprint = null
            deleteLocal.disabled = true
            dataStatus.textContent = 'Bitte zuerst den aktuellen vollständigen Bestand sichern.'
            return
          }
          confirm.hidden = false
          deleteInput.focus()
        })
        body.append(data)
      },
    })
  }

  return { open }
}
