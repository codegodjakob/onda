import { isAnnotationKindAllowed, resolveAnnotationPresentation } from './annotation-contract.mjs'
import { vergleicheHinweise } from './reasoning-model.mjs'

const ANNOTATION_MODES = new Set(['text', 'notiz'])
const SAFE_CORRECTION_KINDS = new Set(['rechtschreibung', 'grammatik', 'zeichensetzung'])
const MAX_UNDO_OPERATIONS = 20

function plainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function findingsFrom(value) {
  return Array.isArray(value) ? value.filter(plainObject) : []
}

function openFindings(value) {
  return findingsFrom(value).filter(finding => finding.status === 'open')
}

export function normalizeAnnotationWorkspace(value = {}) {
  const workspace = plainObject(value) ? value : {}
  workspace.annotationMode = ANNOTATION_MODES.has(workspace.annotationMode)
    ? workspace.annotationMode
    : 'text'
  workspace.quietAnnotations = typeof workspace.quietAnnotations === 'boolean'
    ? workspace.quietAnnotations
    : false
  workspace.activeAnnotationId = typeof workspace.activeAnnotationId === 'string'
    && workspace.activeAnnotationId.trim()
    ? workspace.activeAnnotationId.trim()
    : null
  workspace.undoStack = Array.isArray(workspace.undoStack)
    ? workspace.undoStack.filter(plainObject).slice(-MAX_UNDO_OPERATIONS)
    : []
  workspace.suppressedAnnotations = Array.isArray(workspace.suppressedAnnotations)
    ? [...new Set(workspace.suppressedAnnotations.filter(id => typeof id === 'string' && id.trim()))]
    : []
  // annotationSuppressions und pendingRejectionFindingId standen hier, bis Issue #38
  // die Frage "Was soll Onda daraus lernen?" abschaffte. Alte gespeicherte Werte
  // werden dadurch schlicht nicht mehr gelesen — das ist die Absicht: was jemand
  // frueher stumm geschaltet hat, darf wieder erscheinen.
  workspace.lastAnnotationRejection = plainObject(workspace.lastAnnotationRejection)
    ? workspace.lastAnnotationRejection
    : null
  return workspace
}

export function acceptsKindInMode(mode, kind) {
  return isAnnotationKindAllowed(mode === 'notiz' ? 'notiz' : 'text', kind)
}

// Hier lagen annotationSignature() und createSuppressionStore(): ein Speicher, der
// sich merkte, welche ART Hinweis in welchem Text oder in allen Projekten nicht mehr
// erscheinen darf. Beides ist fort (Issue #38).
//
// Eine Anmerkung gilt fuer eine Stelle in einem Text, EINMAL — sie zur Dauerregel
// hochzurechnen war ein Kategorienfehler. Der Speicher hatte genau einen Erzeuger:
// die zwei Knoepfe "in diesem Text nicht mehr" und "als persoenliche Praeferenz" der
// Frage "Was soll Onda daraus lernen?". Mit ihnen faellt er weg, sonst filterte er
// fuer immer gegen eine leere Liste.

// EINE Rangfolge, nicht zwei. Bis zum 8.8.2026 sortierte diese Stelle anders als die
// Warteschlange im Modell (reasoning-model.mjs): hier stand die Verbindlichkeit vorn
// und die Grundursache erst danach, dort war es umgekehrt — und von Tragweite wusste
// keine von beiden. Auf dem Schirm entschied diese hier, gemessen wurde die andere.
//
// Zwei Sortierungen fuer dieselbe Frage sind zwei Wahrheiten. Der Vergleich liegt jetzt
// im Modell, das die Hinweise besitzt, und wird von hier nur benutzt.
export function orderedAnnotations(findings, _moment = 'aufschauen') {
  return openFindings(findings).sort(vergleicheHinweise)
}

export function annotationSummary(findings) {
  const result = { fehler: 0, empfehlungen: 0, geschmack: 0, total: 0 }
  openFindings(findings).forEach(finding => {
    const { priority } = resolveAnnotationPresentation(finding)
    if (priority === 'fehler') result.fehler += 1
    else if (priority === 'empfehlung') result.empfehlungen += 1
    else result.geschmack += 1
    result.total += 1
  })
  return result
}

export function createAnnotationController(adapter = {}) {
  const getFindings = () => findingsFrom(
    typeof adapter.getFindings === 'function' ? adapter.getFindings() : [],
  )
  const getWorkspace = () => normalizeAnnotationWorkspace(
    typeof adapter.getWorkspace === 'function' ? adapter.getWorkspace() : {},
  )
  const persist = () => {
    if (typeof adapter.persist === 'function') adapter.persist()
  }

  const selectAt = (offset, moment) => {
    const workspace = getWorkspace()
    if (workspace.quietAnnotations) return null
    const annotations = orderedAnnotations(getFindings(), moment)
    if (!annotations.length) {
      workspace.activeAnnotationId = null
      return null
    }
    const currentIndex = annotations.findIndex(item => item.id === workspace.activeAnnotationId)
    const base = currentIndex < 0 ? 0 : currentIndex
    const index = (base + offset + annotations.length) % annotations.length
    workspace.activeAnnotationId = annotations[index].id
    return annotations[index]
  }

  const pushUndo = operation => {
    if (!plainObject(operation) || operation.ok !== true) return false
    const workspace = getWorkspace()
    workspace.undoStack.push(operation)
    workspace.undoStack.splice(0, Math.max(0, workspace.undoStack.length - MAX_UNDO_OPERATIONS))
    persist()
    return true
  }

  return {
    summary() {
      return annotationSummary(getFindings())
    },

    current(moment = 'aufschauen') {
      return selectAt(0, moment)
    },

    select(id, moment = 'aufschauen') {
      const workspace = getWorkspace()
      const chosen = orderedAnnotations(getFindings(), moment).find(item => item.id === id) || null
      workspace.activeAnnotationId = chosen?.id || null
      persist()
      return chosen
    },

    next(moment = 'aufschauen') {
      return selectAt(1, moment)
    },

    previous(moment = 'aufschauen') {
      return selectAt(-1, moment)
    },

    setMode(mode) {
      const workspace = getWorkspace()
      workspace.annotationMode = ANNOTATION_MODES.has(mode) ? mode : 'text'
      workspace.activeAnnotationId = null
      persist()
      return workspace.annotationMode
    },

    setQuiet(quiet) {
      const workspace = getWorkspace()
      workspace.quietAnnotations = quiet === true
      persist()
      return workspace.quietAnnotations
    },

    pushUndo,

    undoLast() {
      const workspace = getWorkspace()
      const operation = workspace.undoStack.pop()
      if (!operation) return { ok: false, reason: 'nothing-to-undo' }
      if (typeof adapter.undo !== 'function') {
        workspace.undoStack.push(operation)
        return { ok: false, reason: 'undo-unavailable' }
      }
      const result = adapter.undo(operation)
      if (!result || result.ok !== true) {
        workspace.undoStack.push(operation)
        return result || { ok: false, reason: 'undo-failed' }
      }
      persist()
      return result
    },

    acceptAllSafeCorrections() {
      if (typeof adapter.accept !== 'function') {
        return { ok: false, reason: 'no-safe-corrections' }
      }
      const safe = getFindings().filter(finding => (
        finding.status === 'open'
        && SAFE_CORRECTION_KINDS.has(finding.anmerkungsart)
        && finding.action
      ))
      if (!safe.length) return { ok: false, reason: 'no-safe-corrections' }

      let count = 0
      safe.forEach(finding => {
        const result = adapter.accept(finding)
        if (result?.ok === true) {
          pushUndo(result)
          count += 1
        }
      })
      return count
        ? { ok: true, count }
        : { ok: false, reason: 'no-safe-corrections' }
    },
  }
}
