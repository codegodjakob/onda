// Die DOM-Bausteine einer Anmerkung: aus einem Finding wird die sichtbare Karte am Rand,
// die Marke im Text, der Korrektur-, Umschreib- oder Einfüge-Vorschlag, der Bereichshinweis,
// die Titelkorrektur und das Gespräch. Braucht ein document, läuft also im Browser und nicht
// in node; die Form der Findings kommt aus annotation-contract.mjs.
//
// Gehört zu BEIDEN Einstiegspunkten. Die Browser-App (src/editor.js) zeichnet über
// src/workspace.js damit die Anmerkungen im Text; der zweite Zugang, das Anmerkungslabor
// (annotation-lab.html über src/annotation-lab.mjs), zeigt dieselben Bausteine einzeln.
// Genau deshalb liegt das Zeichnen hier und nicht in einer der beiden Oberflächen.
import { resolveAnnotationPresentation, normalizeAnnotationFinding } from './annotation-contract.mjs'
import { ondaIcon } from './onda-icons.mjs'

const PRIORITY_LABELS = Object.freeze({
  fehler: 'Fehler',
  empfehlung: 'Empfehlung',
  geschmack: 'Geschmack',
})

function element(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined && text !== null) node.textContent = String(text)
  return node
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ''))
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function stop(callback, payload) {
  return event => {
    event.preventDefault()
    event.stopPropagation()
    callback?.(payload, event)
  }
}

function actionButton(label, variant, callback, finding, iconName = null) {
  const button = element('button', `aura-action aura-action--${variant}`)
  button.type = 'button'
  if (iconName) button.append(ondaIcon(iconName, { size: 16 }))
  button.append(element('span', '', label))
  button.addEventListener('click', stop(callback, finding))
  return button
}

function annotationSurface(finding, form, className) {
  const normalized = normalizeAnnotationFinding(finding)
  const presentation = resolveAnnotationPresentation(normalized)
  const surface = element('section', `onda-annotation ${className}`)
  surface.dataset.annotationForm = form
  surface.dataset.annotationKind = normalized.anmerkungsart
  surface.dataset.annotationPriority = presentation.priority
  surface.dataset.state = normalized.fixtureState || normalized.status || 'open'
  surface.setAttribute('role', 'region')
  surface.setAttribute('aria-label', `${presentation.label}: ${normalized.short || normalized.target || 'Anmerkung'}`)
  return { surface, normalized, presentation }
}

function annotationHeader(finding, presentation, iconName = 'message') {
  const header = element('header', 'aura-note__head')
  header.append(ondaIcon(iconName, { size: 16 }))
  header.append(element('span', 'aura-note__kind', presentation.label))
  header.append(element('span', `aura-note__priority aura-note__priority--${presentation.priority}`, PRIORITY_LABELS[presentation.priority]))
  header.append(element('span', 'aura-note__scope', finding.scope || presentation.scope))
  return header
}

function explanation(finding) {
  if (!finding.why) return null
  const details = element('details', 'aura-note__details')
  details.append(element('summary', '', 'Warum?'))
  details.append(element('p', 'aura-note__rule', finding.why))
  return details
}

function actionRow(finding, callbacks, acceptLabel = 'Übernehmen', dismissLabel = 'Verwerfen') {
  const row = element('div', 'aura-note__acts')
  if (callbacks.onAccept) row.append(actionButton(acceptLabel, 'primary', callbacks.onAccept, finding, 'check'))
  if (callbacks.onDismiss) row.append(actionButton(dismissLabel, 'ghost', callbacks.onDismiss, finding, 'x'))
  if (callbacks.onSecondary) row.append(actionButton(callbacks.secondaryLabel || 'Mehr', 'ghost', callbacks.onSecondary, finding))
  return row.children.length ? row : null
}

export function renderAnnotationMark({ finding, text, active = false, index = null, onSelect } = {}) {
  const normalized = normalizeAnnotationFinding(finding)
  const { category, label } = resolveAnnotationPresentation(normalized)
  const mark = element('mark', `aura-mark aura-mark--${category}${active ? ' aura-mark--active' : ''}`)
  mark.dataset.annotationMarkKind = normalized.anmerkungsart
  mark.title = label
  mark.tabIndex = 0
  mark.setAttribute('role', 'button')
  mark.setAttribute('aria-pressed', String(active))
  mark.append(document.createTextNode(String(text ?? normalized.target ?? '')))
  if (index !== null) mark.append(element('span', 'aura-mark__n', index))
  if (onSelect) {
    mark.addEventListener('click', stop(onSelect, normalized))
    mark.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') stop(onSelect, normalized)(event)
    })
  }
  return mark
}

export function renderCorrection(finding, callbacks = {}) {
  const { surface, normalized, presentation } = annotationSurface(finding, 'correction', 'aura-correction')
  surface.append(annotationHeader(normalized, presentation, presentation.priority === 'fehler' ? 'edit' : 'sparkle'))
  if (normalized.short) surface.append(element('p', 'aura-note__body', normalized.short))
  const comparison = element('div', 'aura-correction__comparison')
  comparison.append(element('span', 'aura-note__from', normalized.target))
  comparison.append(ondaIcon('chevron-right', { size: 16 }))
  comparison.append(element('span', 'aura-note__to', normalized.action || normalized.suggestion))
  surface.append(comparison)
  const why = explanation(normalized)
  if (why) surface.append(why)
  const actions = actionRow(normalized, callbacks)
  if (actions) surface.append(actions)
  return surface
}

export function renderRewrite(finding, callbacks = {}) {
  const { surface, normalized, presentation } = annotationSurface(finding, 'rewrite', 'aura-rewrite')
  surface.append(annotationHeader(normalized, presentation, 'sparkle'))
  if (normalized.short) surface.append(element('p', 'aura-note__body', normalized.short))
  surface.append(element('p', 'aura-rewrite__text', normalized.action || normalized.suggestion))
  const why = explanation(normalized)
  if (why) surface.append(why)
  const actions = actionRow(normalized, callbacks, normalized.acceptLabel || 'Fassung übernehmen', 'Original behalten')
  if (actions) surface.append(actions)
  return surface
}

export function renderInsertion(finding, callbacks = {}) {
  const { surface, normalized, presentation } = annotationSurface(finding, 'insertion', 'aura-insertion')
  surface.append(annotationHeader(normalized, presentation, 'plus'))
  if (normalized.short) surface.append(element('p', 'aura-note__body', normalized.short))
  const flow = element('div', 'aura-insertion__flow')
  flow.append(element('span', 'aura-insertion__caret'))
  flow.append(element('p', 'aura-insertion__text', normalized.action || normalized.suggestion))
  surface.append(flow)
  const actions = actionRow(normalized, callbacks, 'Einfügen')
  if (actions) surface.append(actions)
  return surface
}

export function renderSlot(finding, callbacks = {}) {
  const { surface, normalized, presentation } = annotationSurface(finding, 'slot', 'aura-slot')
  surface.append(annotationHeader(normalized, presentation, 'arrow-right'))
  if (normalized.short) surface.append(element('p', 'aura-note__body', normalized.short))
  const destination = normalized.move?.to || normalized.action || 'An die vorgeschlagene Stelle'
  surface.append(element('p', 'aura-slot__text', destination))
  const actions = actionRow(normalized, callbacks, presentation.operation === 'insert-heading' ? 'Gliedern' : 'Verschieben', 'Lassen')
  if (actions) surface.append(actions)
  return surface
}

export function renderRegion(finding, callbacks = {}) {
  const { surface, normalized, presentation } = annotationSurface(finding, 'region', 'aura-region')
  surface.append(annotationHeader(normalized, presentation, 'sparkle'))
  surface.append(element('p', 'aura-note__body', normalized.short))
  const samples = element('div', 'aura-region__samples')
  const targets = Array.isArray(normalized.targets) && normalized.targets.length
    ? normalized.targets
    : [{ text: normalized.target }]
  targets.forEach(target => samples.append(element('span', 'aura-region__sample', target.text)))
  surface.append(samples)
  if (normalized.action) surface.append(element('p', 'aura-region__proposal', normalized.action))
  const actions = actionRow(normalized, callbacks, 'Änderungen übernehmen')
  if (actions) surface.append(actions)
  return surface
}

function renderSource(finding, callbacks = {}) {
  const { surface, normalized, presentation } = annotationSurface(finding, 'source', 'aura-source')
  surface.append(annotationHeader(normalized, presentation, 'source'))
  surface.append(element('p', 'aura-note__body', normalized.short))
  const source = Array.isArray(normalized.sources) ? normalized.sources[0] : null
  if (source) {
    const block = element('div', 'aura-note__source')
    const href = safeUrl(source.url)
    const title = href ? element('a', 'aura-note__srclink', source.label || source.title || href) : element('span', 'aura-note__srclink', source.label || source.title)
    if (href) {
      title.href = href
      title.target = '_blank'
      title.rel = 'noreferrer'
    }
    title.prepend(ondaIcon('source', { size: 16 }))
    block.append(title)
    if (source.content || source.excerpt) block.append(element('blockquote', 'aura-note__excerpt', source.content || source.excerpt))
    const metadata = [source.citation, source.locator, source.limits].filter(Boolean).join(' · ')
    if (metadata) block.append(element('span', 'aura-note__srcmeta', metadata))
    surface.append(block)
  }
  const why = explanation(normalized)
  if (why) surface.append(why)
  const actions = actionRow(normalized, callbacks, source ? 'Beleg einfügen' : 'Quelle suchen')
  if (actions) surface.append(actions)
  return surface
}

function renderCompare(finding, callbacks = {}) {
  const { surface, normalized, presentation } = annotationSurface(finding, 'compare', 'aura-compare')
  surface.append(annotationHeader(normalized, presentation, 'source'))
  surface.append(element('p', 'aura-note__body', normalized.short))
  const comparison = element('div', 'aura-note__compare')
  const entries = Array.isArray(normalized.compare) ? normalized.compare : []
  entries.forEach(entry => {
    const row = element('div', 'aura-note__cmp')
    row.append(element('span', 'aura-note__cmpref', entry.ref))
    row.append(element('span', 'aura-note__cmptext', entry.text))
    comparison.append(row)
  })
  surface.append(comparison)
  const why = explanation(normalized)
  if (why) surface.append(why)
  const actions = actionRow(normalized, callbacks, normalized.action ? 'Konsistent machen' : 'Prüfen')
  if (actions) surface.append(actions)
  return surface
}

export function renderAnnotationCard(finding, callbacks = {}) {
  const form = resolveAnnotationPresentation(finding).form
  if (form === 'source') return renderSource(finding, callbacks)
  if (form === 'compare') return renderCompare(finding, callbacks)
  const { surface, normalized, presentation } = annotationSurface(finding, form, 'aura-note')
  surface.append(annotationHeader(normalized, presentation))
  surface.append(element('p', 'aura-note__body', normalized.short))
  const why = explanation(normalized)
  if (why) surface.append(why)
  const actions = actionRow(normalized, callbacks)
  if (actions) surface.append(actions)
  return surface
}

export function renderDialogue(finding, callbacks = {}) {
  const { surface, normalized, presentation } = annotationSurface(finding, 'dialogue', 'aura-dialogue')
  surface.append(annotationHeader(normalized, presentation, 'message'))
  const bubble = element('p', 'aura-dialogue__bubble', normalized.short || normalized.why)
  surface.append(bubble)
  const replies = Array.isArray(normalized.thread) ? normalized.thread : []
  replies.forEach(reply => surface.append(element('p', `aura-dialogue__reply aura-dialogue__reply--${reply.role || 'user'}`, reply.text)))
  if (callbacks.onReply) {
    const form = element('form', 'aura-dialogue__composer')
    const input = element('input', 'aura-dialogue__input')
    input.name = 'reply'
    input.placeholder = 'Antworten …'
    input.setAttribute('aria-label', 'Auf die Anmerkung antworten')
    const submit = actionButton('Senden', 'primary', null, normalized, 'arrow-right')
    submit.type = 'submit'
    form.append(input, submit)
    form.addEventListener('submit', event => {
      event.preventDefault()
      event.stopPropagation()
      const text = input.value.trim()
      if (!text) return
      callbacks.onReply(normalized, text, event)
      input.value = ''
    })
    surface.append(form)
  }
  const actions = actionRow(normalized, { onDismiss: callbacks.onDismiss }, '', 'Nicht weiterverfolgen')
  if (actions) surface.append(actions)
  return surface
}

export function renderTitleCorrection(finding, callbacks = {}) {
  const { surface, normalized, presentation } = annotationSurface(finding, 'title', 'aura-title-correction')
  surface.append(annotationHeader(normalized, presentation, 'edit'))
  if (normalized.short) surface.append(element('p', 'aura-note__body', normalized.short))
  const field = element('label', 'aura-title-correction__field')
  field.append(element('span', 'aura-title-correction__label', 'Vorgeschlagener Titel'))
  const input = element('input', 'aura-title-correction__input')
  input.value = normalized.action || ''
  field.append(input)
  surface.append(field)
  const wrappedCallbacks = {
    ...callbacks,
    onAccept: callbacks.onAccept
      ? (_finding, event) => callbacks.onAccept({ ...normalized, action: input.value.trim() }, event)
      : null,
  }
  const actions = actionRow(normalized, wrappedCallbacks, 'Titel übernehmen', 'Titel behalten')
  if (actions) surface.append(actions)
  return surface
}

export function renderAnnotation(finding, callbacks = {}) {
  const form = resolveAnnotationPresentation(finding).form
  const renderers = {
    correction: renderCorrection,
    rewrite: renderRewrite,
    insertion: renderInsertion,
    slot: renderSlot,
    region: renderRegion,
    source: renderSource,
    compare: renderCompare,
    dialogue: renderDialogue,
    title: renderTitleCorrection,
  }
  return (renderers[form] || renderAnnotationCard)(finding, callbacks)
}
