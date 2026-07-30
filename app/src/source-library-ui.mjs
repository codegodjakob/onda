import { importSource, recordSourceEvent } from './source-model.mjs'
import { createLocator, resolveLocator } from './locator-model.mjs'
import { buildEvidenceBundle, propagateSourceEvent } from './evidence-bundle.mjs'

export function createSourceLibraryUi({
  context,
  createNode,
  onCountChange,
  safeHttpsUrl,
  openSecureExternal,
}) {
  const SOURCE_TYPE_LABELS = Object.freeze({
    pdf: 'PDF',
    web: 'Web / URL',
    doi: 'DOI',
    text: 'Text',
    audio: 'Audio',
    video: 'Video',
  })
  
  const SOURCE_STATUS_LABELS = Object.freeze({
    active: 'Aktiv',
    corrected: 'Korrigiert · neu prüfen',
    retracted: 'Zurückgezogen',
    superseded: 'Ersetzt',
  })
  
  async function sha256Browser(value) {
    const bytes = new TextEncoder().encode(String(value))
    const hash = await crypto.subtle.digest('SHA-256', bytes)
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  function sourceTitle(source) {
    const value = source?.metadata?.title?.value
    return typeof value === 'string' && value.trim() ? value.trim() : 'Quelle ohne Titel'
  }
  
  function locatorLabel(locator) {
    if (locator.kind === 'page') return `Seite ${locator.address.page}`
    if (locator.kind === 'section') return `Abschnitt ${locator.address.sectionId}`
    if (locator.kind === 'time') {
      const timeLabel = milliseconds => {
        const seconds = Math.max(0, Math.floor(milliseconds / 1000))
        return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
      }
      return `Zeitcode ${timeLabel(locator.address.startMs)}–${timeLabel(locator.address.endMs)}`
    }
    return `Textstelle ${locator.address.start}–${locator.address.end}`
  }
  
  function buildImportedOriginal(type, originalText) {
    if (type === 'pdf') {
      return { mediaType: 'application/pdf', pages: [{ page: 1, text: originalText }] }
    }
    if (type === 'web') {
      return {
        mediaType: 'text/html',
        sections: [{ id: 'import', heading: 'Importierter Abschnitt', text: originalText }],
      }
    }
    if (type === 'audio' || type === 'video') {
      const endMs = Math.max(1000, originalText.length * 50)
      return {
        mediaType: type === 'audio' ? 'audio/*' : 'video/*',
        transcript: originalText,
        segments: [{ startMs: 0, endMs, text: originalText }],
      }
    }
    return {
      mediaType: type === 'doi' ? 'application/metadata+json' : 'text/plain',
      text: originalText,
    }
  }
  
  function buildImportedLocator(source, claimText) {
    const excerpt = source.type === 'pdf'
      ? source.original.pages[0].text
      : source.type === 'web'
        ? source.original.sections[0].text
        : (source.original.text || source.original.transcript)
    const kind = source.type === 'pdf'
      ? 'page'
      : source.type === 'web'
        ? 'section'
        : (source.type === 'audio' || source.type === 'video') ? 'time' : 'text'
    const address = kind === 'page'
      ? { page: 1 }
      : kind === 'section'
        ? { sectionId: 'import' }
        : kind === 'time'
          ? { startMs: 0, endMs: source.original.segments[0].endMs }
          : { start: 0, end: excerpt.length }
    return { excerpt, kind, address, claimText }
  }
  
  function sourceOrigin(type, reference, sourceId) {
    if (type === 'text') {
      return { kind: 'pasted-text', immutableRef: reference || `text://original/${sourceId}` }
    }
    if (type === 'doi') return { kind: 'doi', immutableRef: reference, originalUrl: reference }
    if (type === 'web') return { kind: 'url', immutableRef: reference, originalUrl: reference }
    if (/^https:\/\//.test(reference)) return { kind: 'url', immutableRef: reference, originalUrl: reference }
    return { kind: 'file', immutableRef: reference, fileName: reference.split('/').at(-1) || reference }
  }
  
  function sourceFormField(id, label, node) {
    const field = createNode('label', 'source-form-field')
    const labelNode = createNode('span', 'source-form-label', label)
    node.id = id
    field.append(labelNode, node)
    return field
  }
  
  function buildSourceImportForm(body, project, statusText = '') {
    const form = createNode('form', 'source-import-form')
    form.setAttribute('aria-label', 'Quelle aufnehmen')
    const heading = createNode('h3', 'source-section-title', 'Quelle aufnehmen')
    const type = createNode('select', 'source-form-control')
    Object.entries(SOURCE_TYPE_LABELS).forEach(([value, label]) => {
      const option = document.createElement('option')
      option.value = value
      option.textContent = label
      type.append(option)
    })
    const title = createNode('input', 'source-form-control')
    title.type = 'text'
    title.required = true
    title.autocomplete = 'off'
    const reference = createNode('input', 'source-form-control')
    reference.type = 'text'
    reference.autocomplete = 'off'
    reference.placeholder = 'https://… oder unveränderlicher Dateiverweis'
    const original = createNode('textarea', 'source-form-control source-form-text')
    original.required = true
    original.rows = 3
    original.placeholder = 'Originaltext oder geprüftes Transkript'
    const claim = createNode('textarea', 'source-form-control source-form-text')
    claim.required = true
    claim.rows = 2
    claim.placeholder = 'Welche genaue Aussage soll diese Stelle stützen?'
    const limitations = createNode('textarea', 'source-form-control source-form-text')
    limitations.rows = 2
    limitations.placeholder = 'Zum Beispiel: kleine Stichprobe oder nur eine Version'
    const scope = createNode('textarea', 'source-form-control source-form-text')
    scope.rows = 2
    scope.placeholder = 'Für welchen Fall oder welche Gruppe gilt die Aussage?'
    const uncertainty = createNode('textarea', 'source-form-control source-form-text')
    uncertainty.rows = 2
    uncertainty.placeholder = 'Was bleibt trotz dieses Belegs offen?'
    const allowedStrength = createNode('textarea', 'source-form-control source-form-text')
    allowedStrength.rows = 2
    allowedStrength.placeholder = 'Wie stark darf der Text die Aussage formulieren?'
    const notSupported = createNode('textarea', 'source-form-control source-form-text')
    notSupported.rows = 2
    notSupported.placeholder = 'Welche naheliegende Aussage trägt diese Quelle ausdrücklich nicht?'
    const submit = createNode('button', 'source-import-submit', 'Quelle aufnehmen')
    submit.id = 'sourceImport'
    submit.type = 'submit'
    const status = createNode('p', 'source-import-status', statusText)
    status.id = 'sourceImportStatus'
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')
    const evidenceDetails = createNode('details', 'source-evidence-details')
    evidenceDetails.id = 'sourceEvidenceDetails'
    const evidenceSummary = document.createElement('summary')
    evidenceSummary.textContent = 'Beleggrenzen genauer beschreiben · empfohlen'
    const evidenceFields = createNode('div', 'source-evidence-fields')
    evidenceFields.append(
      sourceFormField('sourceLimitations', 'Grenzen', limitations),
      sourceFormField('sourceScope', 'Reichweite', scope),
      sourceFormField('sourceUncertainty', 'Verbleibende Unsicherheit', uncertainty),
      sourceFormField('sourceAllowedStrength', 'Erlaubte Formulierungsstärke', allowedStrength),
      sourceFormField('sourceNotSupported', 'Nicht belegt', notSupported),
    )
    evidenceDetails.append(evidenceSummary, evidenceFields)
    form.append(
      heading,
      sourceFormField('sourceType', 'Typ', type),
      sourceFormField('sourceTitle', 'Titel', title),
      sourceFormField('sourceReference', 'Original oder unveränderlicher Verweis', reference),
      sourceFormField('sourceOriginal', 'Originalausschnitt', original),
      sourceFormField('sourceClaim', 'Zu belegende Aussage', claim),
      evidenceDetails,
      submit,
      status,
    )
  
    type.addEventListener('change', () => {
      reference.required = type.value !== 'text'
    })
    reference.required = type.value !== 'text'
    form.addEventListener('submit', async event => {
      event.preventDefault()
      if (submit.disabled) return
      const sourceType = type.value
      const sourceReference = reference.value.trim()
      if (sourceType !== 'text' && !sourceReference) {
        status.textContent = 'Für diesen Typ fehlt der unveränderliche Verweis.'
        reference.focus()
        return
      }
      submit.disabled = true
      status.textContent = 'Prüfsumme wird gebildet …'
      try {
        const importedAt = Date.now()
        const sourceId = `source-${importedAt}-${Math.random().toString(36).slice(2, 8)}`
        const source = await importSource({
          id: sourceId,
          projectId: project.id,
          type: sourceType,
          origin: sourceOrigin(sourceType, sourceReference, sourceId),
          original: buildImportedOriginal(sourceType, original.value.trim()),
          metadata: { title: { value: title.value.trim(), status: 'user-provided' } },
          importedAt,
          provenance: { actor: 'user', action: 'import' },
        }, { sha256: sha256Browser })
        const locatorInput = buildImportedLocator(source, claim.value.trim())
        const locator = await createLocator({
          id: `locator-${source.id}-1`,
          projectId: project.id,
          sourceId: source.id,
          claimId: `claim-${source.id}-1`,
          ...locatorInput,
        }, { sha256: sha256Browser })
        const resolved = await resolveLocator({ projectId: project.id, source, locator, sha256: sha256Browser })
        locator.verification = resolved.verification
        source.locators.push(locator)
        const bundle = buildEvidenceBundle({
          id: `bundle-${source.id}-1`,
          projectId: project.id,
          claimId: locator.claimId,
          claimText: claim.value.trim(),
          support: [{ sourceId: source.id, locatorId: locator.id, relation: 'supports' }],
          counterEvidence: [],
          limitations: limitations.value.split('\n').map(value => value.trim()).filter(Boolean),
          methodologicalDifferences: [],
          scope: scope.value.trim(),
          uncertainty: uncertainty.value.trim(),
          allowedStrength: allowedStrength.value.trim(),
          notSupported: notSupported.value.split('\n').map(value => value.trim()).filter(Boolean),
          qualityAssessments: [],
          createdAt: importedAt,
        }, { sources: [source], locators: [locator] })
        project.sources.push(source)
        project.evidenceBundles.push(bundle)
        context.persist()
        onCountChange()
        renderProjectSourceLibrary(body, project, `${sourceTitle(source)} wurde aufgenommen.`)
      } catch (error) {
        status.textContent = `Quelle konnte nicht aufgenommen werden: ${error?.message || 'unbekannter Fehler'}`
        submit.disabled = false
      }
    })
    return form
  }
  
  async function renderSourceReader(body, project, source, locator) {
    body.replaceChildren()
    const resolved = await resolveLocator({ projectId: project.id, source, locator, sha256: sha256Browser })
    const persistedLocator = source.locators.find(candidate => candidate.id === locator.id)
    if (persistedLocator) persistedLocator.verification = resolved.verification
    context.scheduleSave()
  
    const reader = createNode('section', 'source-reader')
    reader.id = 'sourceReader'
    reader.dataset.locatorKind = locator.kind
    const back = createNode('button', 'source-reader-back', '‹ Zur Quellenliste')
    back.id = 'sourceReaderBack'
    back.type = 'button'
    back.addEventListener('click', () => renderProjectSourceLibrary(body, project))
    const statusOk = resolved.status === 'verified'
    reader.append(
      back,
      createNode('span', 'source-reader-kicker', 'Zu belegende Aussage'),
      createNode('p', 'source-reader-claim', locator.claimText || 'Aussage nicht erfasst'),
      createNode('h3', 'source-reader-title', sourceTitle(source)),
      createNode('span', 'source-reader-locator', locatorLabel(locator)),
      createNode(
        'span',
        `source-reader-verification ${statusOk ? 'is-verified' : 'is-unverified'}`,
        statusOk ? 'Verifiziert am gespeicherten Original' : 'Nicht belastbar',
      ),
      createNode('blockquote', 'source-reader-excerpt', locator.excerpt),
    )
    const bundle = project.evidenceBundles.find(candidate => candidate.claimId === locator.claimId)
    if (bundle) {
      const bundleStatusLabel = bundle.status === 'supported'
        ? 'Belegt'
        : bundle.status === 'mixed'
          ? 'Gemischte Beleglage'
          : bundle.status === 'review-required'
            ? 'Neu prüfen'
            : 'Belegbündel unvollständig'
      reader.append(createNode(
        'span',
        `source-reader-bundle-status is-${bundle.status}`,
        bundleStatusLabel,
      ))
      const details = [
        ['Grenzen', bundle.limitations],
        ['Methodische Unterschiede', bundle.methodologicalDifferences],
        ['Reichweite', bundle.scope],
        ['Verbleibende Unsicherheit', bundle.uncertainty],
        ['Erlaubte Formulierungsstärke', bundle.allowedStrength],
        ['Nicht belegt', bundle.notSupported],
      ]
      details.forEach(([label, value]) => {
        const values = Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean)
        if (!values.length) return
        const detail = createNode('div', 'source-reader-detail')
        detail.append(
          createNode('span', 'source-reader-detail-label', label),
          createNode('p', 'source-reader-detail-text', values.join(' ')),
        )
        reader.append(detail)
      })
    }
    if (source.status !== 'active') {
      reader.append(createNode(
        'p',
        'source-reader-warning',
        source.status === 'retracted'
          ? 'Diese Quelle wurde zurückgezogen. Die historische Fundstelle bleibt sichtbar, stützt die Aussage aber nicht mehr.'
          : 'Diese Quellenversion muss neu geprüft werden.',
      ))
    } else if (!statusOk) {
      reader.append(createNode('p', 'source-reader-warning', 'Der Ausschnitt konnte nicht am gespeicherten Original bestätigt werden.'))
    }
    const originalUrl = safeHttpsUrl(source.origin?.originalUrl)
    if (originalUrl) {
      const link = createNode('a', 'source-reader-link', 'Original öffnen ↗')
      link.href = originalUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      if (context.state.native) {
        link.addEventListener('click', event => {
          event.preventDefault()
          openSecureExternal(originalUrl)
        })
      }
      reader.append(link)
    }
    body.append(reader)
    requestAnimationFrame(() => back.focus({ preventScroll: true }))
  }
  
  function buildSourceLibraryList(body, project) {
    const section = createNode('section', 'source-library')
    section.append(createNode('h3', 'source-section-title', `Aufgenommene Quellen · ${project.sources.length}`))
    if (!project.sources.length) {
      section.append(createNode('p', 'onda-material-empty', 'Noch keine überprüfbare Quelle aufgenommen.'))
    }
    const list = createNode('div', 'source-library-list')
    project.sources.forEach(source => {
      const item = createNode('article', 'source-library-item')
      item.dataset.sourceId = source.id
      const header = createNode('div', 'source-library-header')
      const identity = createNode('div', 'source-library-identity')
      identity.append(
        createNode('span', 'onda-tag source-library-type', SOURCE_TYPE_LABELS[source.type] || source.type),
        createNode('strong', 'source-library-title', sourceTitle(source)),
      )
      header.append(
        identity,
        createNode(
          'span',
          `source-library-status is-${source.status}`,
          SOURCE_STATUS_LABELS[source.status] || 'Neu prüfen',
        ),
      )
      item.append(
        header,
        createNode('span', 'source-library-checksum', `SHA-256 ${String(source.checksumSha256 || '').slice(0, 12)}`),
      )
      const locators = createNode('div', 'source-library-locators')
      ;(source.locators || []).forEach(locator => {
        const open = createNode('button', 'source-locator-open', `${locatorLabel(locator)} öffnen`)
        open.type = 'button'
        open.dataset.locatorKind = locator.kind
        open.addEventListener('click', () => renderSourceReader(body, project, source, locator))
        locators.append(open)
      })
      if (!locators.children.length) locators.append(createNode('span', 'onda-material-empty', 'Noch keine Fundstelle.'))
      item.append(locators)
      const bundle = project.evidenceBundles.find(candidate => (
        (source.locators || []).some(locator => locator.claimId === candidate.claimId)
      ))
      if (bundle) {
        item.append(createNode(
          'span',
          `source-bundle-status is-${bundle.status}`,
          bundle.status === 'supported'
            ? 'Belegbündel vollständig'
            : bundle.status === 'mixed'
              ? 'Beleglage gemischt'
              : bundle.status === 'review-required'
                ? 'Belegbündel neu prüfen'
                : `Belegbündel unvollständig · ${bundle.missingFields.join(', ')}`,
        ))
      }
      if (source.status === 'active') {
        const retract = createNode('button', 'source-retract', 'Als zurückgezogen markieren')
        retract.type = 'button'
        retract.addEventListener('click', () => {
          const event = {
            id: `source-event-${Date.now()}-${source.id}`,
            sourceId: source.id,
            kind: 'retracted',
            at: Date.now(),
            reason: 'Vom Nutzer als zurückgezogen markiert',
          }
          const index = project.sources.findIndex(candidate => candidate.id === source.id)
          project.sources[index] = recordSourceEvent(source, event)
          project.evidenceBundles = propagateSourceEvent(project.evidenceBundles, event)
          context.persist()
          renderProjectSourceLibrary(body, project, `${sourceTitle(source)} gilt nicht mehr als belastbare Quelle.`)
        })
        item.append(retract)
      }
      list.append(item)
    })
    section.append(list)
    return section
  }
  
  function buildLegacyMaterial(project) {
    if (!Array.isArray(project.material) || !project.material.length) return null
    const details = createNode('details', 'source-legacy-material')
    const summary = document.createElement('summary')
    summary.textContent = `Bisheriges Material · ${project.material.length}`
    details.append(summary)
    const list = createNode('div', 'onda-material-list')
    project.material.forEach(item => {
      const entry = createNode('article', 'onda-material-item')
      entry.append(
        createNode('span', 'onda-tag onda-material-kind', item.kind || 'Material'),
        createNode('p', 'onda-material-text', item.text || ''),
      )
      list.append(entry)
    })
    details.append(list)
    return details
  }
  
  function renderProjectSourceLibrary(body, project, statusText = '') {
    body.replaceChildren()
    body.append(buildSourceLibraryList(body, project))
    body.append(buildSourceImportForm(body, project, statusText))
    const legacy = buildLegacyMaterial(project)
    if (legacy) body.append(legacy)
    body.scrollTop = 0
  }
  

  return { renderProjectSourceLibrary }
}
