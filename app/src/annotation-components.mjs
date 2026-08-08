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

// Die Kopfzeile aus Design System 2 (components/annotation/Annotation.jsx):
// Symbol · Art · Nummer · Anzahl · Rangfolge — und ganz rechts der Geltungsbereich.
// Die Reihenfolge ist die der Vorlage; sie liest sich von "was ist das" ueber
// "wie oft" zu "wie wichtig".
function annotationHeader(finding, presentation, iconName = 'message') {
  const header = element('header', 'aura-note__head')
  header.append(ondaIcon(iconName, { size: 16 }))
  header.append(element('span', 'aura-note__kind', presentation.label))
  if (finding.n != null) header.append(element('span', 'aura-note__n', finding.n))
  if (finding.count != null) header.append(element('span', 'aura-note__count', `${finding.count}×`))
  header.append(element('span', `aura-note__priority aura-note__priority--${presentation.priority}`, PRIORITY_LABELS[presentation.priority]))
  header.append(element('span', 'aura-note__scope', finding.scope || presentation.scope))
  return header
}

// "Warum?" ist in der Vorlage ein Knopf, der auf "Regel ausblenden" umschaltet —
// kein <details> mit Dreieck. Der Unterschied ist nicht kosmetisch: das Dreieck
// verspricht einen Abschnitt, hier kommt ein Satz.
function explanation(finding) {
  if (!finding.why) return null
  const huelle = element('div', 'aura-note__why-block')
  const knopf = element('button', 'aura-note__why', 'Warum?')
  knopf.type = 'button'
  const regel = element('p', 'aura-note__rule', finding.why)
  regel.hidden = true
  knopf.addEventListener('click', event => {
    event.preventDefault()
    event.stopPropagation()
    regel.hidden = !regel.hidden
    knopf.textContent = regel.hidden ? 'Warum?' : 'Regel ausblenden'
  })
  huelle.append(knopf, regel)
  return huelle
}

// Der Vergleichsblock der Vorlage: alt durchgestrichen, neu darunter.
function suggestionBlock(from, to) {
  const block = element('div', 'aura-note__block')
  if (from) block.append(element('span', 'aura-note__from', from))
  if (to) block.append(element('span', 'aura-note__to', to))
  return block
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

// Korrektur — die kompakteste Form der Vorlage (components/annotation/Correction.jsx).
// Was objektiv falsch ist, braucht keine Karte mit Kopfzeile und Rangfolge: eine
// Zeile "alt → neu" und ein Klick genuegen. In der Vorlage ist das ein Popover
// direkt unter der markierten Stelle, nicht eine Karte am Rand.
//
// Der Grund steht in annotation.card.html: "Was eindeutig falsch ist, wird am
// Wort korrigiert." Eine Rechtschreibkorrektur, die so gross ist wie eine
// Belegkarte, behauptet eine Wichtigkeit, die sie nicht hat.
export function renderCorrection(finding, callbacks = {}) {
  const { surface, normalized } = annotationSurface(finding, 'correction', 'aura-corr__pop')
  const ersatz = normalized.action || normalized.suggestion
  if (ersatz) {
    surface.append(element('span', 'aura-corr__from', normalized.target))
    const pfeil = element('span', 'aura-corr__sep')
    pfeil.append(ondaIcon('chevron-right', { size: 14 }))
    surface.append(pfeil)
    surface.append(element('span', 'aura-corr__to', ersatz))
  }
  if (normalized.short) surface.append(element('span', 'aura-corr__note', normalized.short))
  if (callbacks.onAccept) {
    const ok = element('button', 'aura-corr__ok', 'Übernehmen')
    ok.type = 'button'
    ok.addEventListener('click', stop(callbacks.onAccept, normalized))
    surface.append(ok)
  }
  if (callbacks.onDismiss) {
    const weg = element('button', 'aura-corr__x')
    weg.type = 'button'
    weg.setAttribute('aria-label', 'Verwerfen')
    weg.append(ondaIcon('x', { size: 14 }))
    weg.addEventListener('click', stop(callbacks.onDismiss, normalized))
    surface.append(weg)
  }
  return surface
}

// Umschreibung — Vorschlagskarte neben der markierten Stelle
// (components/annotation/Rewrite.jsx). Neu gegenueber vorher: die Kopfzeile
// traegt rechts ein `meta` — in der Vorlage steht dort der Beweis, warum die
// neue Fassung besser ist: "24 → 12 Wörter", "4 → 1 Satz". Eine Behauptung
// ohne Zahl waere nur Geschmack; mit Zahl ist sie nachpruefbar.
export function renderRewrite(finding, callbacks = {}) {
  const { surface, normalized, presentation } = annotationSurface(finding, 'rewrite', 'aura-rewrite')
  const label = element('div', 'aura-rewrite__label')
  label.append(element('span', '', normalized.label || presentation.label))
  if (normalized.meta) label.append(element('span', 'aura-rewrite__meta', normalized.meta))
  surface.append(label)
  if (normalized.short) surface.append(element('p', 'aura-rewrite__note', normalized.short))
  const ersatz = normalized.action || normalized.suggestion
  if (ersatz) surface.append(element('p', 'aura-rewrite__text', ersatz))
  const why = explanation(normalized)
  if (why) surface.append(why)
  const actions = actionRow(normalized, callbacks, normalized.acceptLabel || 'Übernehmen', 'Original behalten')
  if (actions) surface.append(actions)
  return surface
}

// Einfuegung — der Vorschlag liegt IM Textfluss und oeffnet eine Luecke an der
// Einfuegestelle, statt etwas zu verdecken (components/annotation/Insertion.jsx).
// Deshalb hat diese Form keine Kopfzeile mit Rangfolge: sie steht mitten im
// Satz, und alles, was dort nicht der Vorschlag selbst ist, stoert beim Lesen.
export function renderInsertion(finding, callbacks = {}) {
  const { surface, normalized, presentation } = annotationSurface(finding, 'insertion', 'aura-ins__pop')
  surface.append(element('span', 'aura-ins__label', normalized.label || presentation.label))
  const ersatz = normalized.action || normalized.suggestion
  if (ersatz) surface.append(element('span', 'aura-ins__ghost', ersatz))
  if (normalized.short) surface.append(element('span', 'aura-ins__note', normalized.short))
  const acts = element('span', 'aura-ins__acts')
  if (callbacks.onAccept) {
    const ok = element('button', 'aura-ins__ok', normalized.acceptLabel || 'Einfügen')
    ok.type = 'button'
    ok.addEventListener('click', stop(callbacks.onAccept, normalized))
    acts.append(ok)
  }
  if (callbacks.onDismiss) {
    const nein = element('button', 'aura-ins__no', 'Verwerfen')
    nein.type = 'button'
    nein.addEventListener('click', stop(callbacks.onDismiss, normalized))
    acts.append(nein)
  }
  if (acts.children.length) surface.append(acts)
  return surface
}

// Zielplatz — ein gestrichelter Rahmen dort, wo etwas HIN soll
// (components/annotation/Slot.jsx). Gestrichelt und ohne eigene Flaeche, weil
// der Platz noch leer ist: eine gefuellte Karte wuerde behaupten, dort stehe
// schon etwas.
export function renderSlot(finding, callbacks = {}) {
  const { surface, normalized, presentation } = annotationSurface(finding, 'slot', 'aura-slot')
  const gliedern = presentation.operation === 'insert-heading'
  surface.append(element('span', 'aura-slot__label', normalized.label || (gliedern ? 'Zwischentitel hier' : 'Hierher verschieben')))
  const ziel = normalized.move?.to || normalized.action || normalized.target
  if (ziel) surface.append(element('p', 'aura-slot__text', ziel))
  if (normalized.short) surface.append(element('p', 'aura-slot__note', normalized.short))
  const actions = actionRow(normalized, callbacks, gliedern ? 'Gliedern' : 'Verschieben', 'Lassen')
  if (actions) surface.append(actions)
  return surface
}

// Sammelkarte — eine Anmerkung, viele Stellen (Wiederholung, Ton & Register).
// Die Stellen selbst sind im Text markiert und durchnummeriert; hier steht die
// Zusammenfassung mit Anzahl und ein Vorschlag fuer alle auf einmal. In der
// Vorlage ist das <Annotation count={3} suggestion={{from,to}}>.
export function renderRegion(finding, callbacks = {}) {
  const { surface, normalized, presentation } = annotationSurface(finding, 'region', 'aura-note')
  const stellen = Array.isArray(normalized.targets) ? normalized.targets.length : null
  surface.append(annotationHeader(
    { ...normalized, count: normalized.count ?? stellen },
    presentation,
    'sparkle',
  ))
  if (normalized.short) surface.append(element('p', 'aura-note__body', normalized.short))
  const von = normalized.suggestion?.from || (Array.isArray(normalized.targets)
    ? normalized.targets.map(ziel => ziel.text).filter(Boolean).join(' · ')
    : normalized.target)
  const nach = normalized.suggestion?.to || normalized.action
  if (von || nach) surface.append(suggestionBlock(von, nach))
  const why = explanation(normalized)
  if (why) surface.append(why)
  const actions = actionRow(normalized, callbacks, normalized.acceptLabel || 'Alle ersetzen')
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

// Die gewoehnliche Karte. Sie zeigt alles, was die Vorlage kennt, aber nur,
// wenn es da ist: Vorschlag, Verschiebeziel, Ausschlussvermerk.
export function renderAnnotationCard(finding, callbacks = {}) {
  const form = resolveAnnotationPresentation(finding).form
  if (form === 'source') return renderSource(finding, callbacks)
  if (form === 'compare') return renderCompare(finding, callbacks)
  const { surface, normalized, presentation } = annotationSurface(finding, form, 'aura-note')
  surface.append(annotationHeader(normalized, presentation))
  if (normalized.short) surface.append(element('p', 'aura-note__body', normalized.short))
  if (normalized.suggestion?.from || normalized.suggestion?.to) {
    surface.append(suggestionBlock(normalized.suggestion.from, normalized.suggestion.to))
  }
  if (normalized.move?.to) {
    const block = element('div', 'aura-note__block')
    const zeile = element('span', 'aura-note__move')
    zeile.append(ondaIcon('arrow-right', { size: 13 }))
    zeile.append(element('span', '', normalized.move.to))
    block.append(zeile)
    surface.append(block)
  }
  // "Schliesst aus": zwei Vorschlaege koennen einander widersprechen. Wer den
  // einen nimmt, kann den anderen nicht mehr nehmen — das gehoert dazugesagt,
  // bevor geklickt wird, nicht danach.
  if (normalized.conflict) surface.append(element('span', 'aura-note__conflict', `Schließt aus: ${normalized.conflict}`))
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
