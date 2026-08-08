// Der Zustand der Anmerkungen, ohne jedes Aussehen: Arbeitsbereich normalisieren
// (Anmerkungsmodus, Ruhe, aktive Anmerkung), Reihenfolge nach Dringlichkeit, kurze
// Zusammenfassung, Unterdrücken in drei Reichweiten (einmal / dieser Text / dauerhaft)
// und ein Rückgängig-Stapel von höchstens 20 Schritten. Kein DOM, node-testbar.
//
// Gehört zur Browser-App (src/editor.js): src/workspace-model.mjs und src/workspace.js
// benutzen die Funktionen; gezeichnet wird das Ergebnis von annotation-components.mjs.
import { isAnnotationKindAllowed, resolveAnnotationPresentation } from './annotation-contract.mjs'

const ANNOTATION_MODES = new Set(['text', 'notiz'])
const PRIORITY_RANK = Object.freeze({ fehler: 0, empfehlung: 1, geschmack: 2 })
const SAFE_CORRECTION_KINDS = new Set(['rechtschreibung', 'grammatik', 'zeichensetzung'])
const MAX_UNDO_OPERATIONS = 20
const SUPPRESSION_SCOPES = new Set(['once', 'document', 'personal'])

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
  workspace.annotationSuppressions = Array.isArray(workspace.annotationSuppressions)
    ? workspace.annotationSuppressions.filter(plainObject)
    : []
  workspace.pendingRejectionFindingId = typeof workspace.pendingRejectionFindingId === 'string'
    && workspace.pendingRejectionFindingId.trim()
    ? workspace.pendingRejectionFindingId.trim()
    : null
  workspace.lastAnnotationRejection = plainObject(workspace.lastAnnotationRejection)
    ? workspace.lastAnnotationRejection
    : null
  return workspace
}

export function acceptsKindInMode(mode, kind) {
  return isAnnotationKindAllowed(mode === 'notiz' ? 'notiz' : 'text', kind)
}

export function annotationSignature(finding = {}) {
  const kind = resolveAnnotationPresentation(finding).kind
  const target = String(finding?.target || finding?.short || '')
    .trim()
    .toLocaleLowerCase('de-DE')
    .replace(/\s+/g, ' ')
  return `${kind}|${target}`
}

export function createSuppressionStore({ documentRecords = [], personalRecords = [] } = {}) {
  const documents = Array.isArray(documentRecords) ? documentRecords : []
  const personal = Array.isArray(personalRecords) ? personalRecords : []
  const all = () => [...documents, ...personal].filter(plainObject)

  return {
    reject({ findingId = null, signature, documentId = null, scope = 'once', at = Date.now() } = {}) {
      const normalizedScope = SUPPRESSION_SCOPES.has(scope) ? scope : 'once'
      const record = {
        id: `suppression-${normalizedScope}-${Number(at) || 0}-${all().length}`,
        findingId: typeof findingId === 'string' ? findingId : null,
        signature: String(signature || ''),
        documentId: typeof documentId === 'string' ? documentId : null,
        scope: normalizedScope,
        at: Number.isFinite(at) ? at : Date.now(),
      }
      if (normalizedScope === 'personal') personal.push(record)
      else documents.push(record)
      return record
    },

    suppresses(signature, documentId) {
      return all().some(record => (
        record.signature === signature
        && (
          record.scope === 'personal'
          || (record.scope === 'document' && record.documentId === documentId)
        )
      ))
    },

    revoke(id) {
      for (const records of [documents, personal]) {
        const index = records.findIndex(record => record?.id === id)
        if (index >= 0) {
          records.splice(index, 1)
          return true
        }
      }
      return false
    },

    records() {
      return all().map(record => ({ ...record }))
    },
  }
}

export function orderedAnnotations(findings, _moment = 'aufschauen') {
  return openFindings(findings).sort((left, right) => {
    const leftPresentation = resolveAnnotationPresentation(left)
    const rightPresentation = resolveAnnotationPresentation(right)
    const priority = (PRIORITY_RANK[leftPresentation.priority] ?? PRIORITY_RANK.geschmack)
      - (PRIORITY_RANK[rightPresentation.priority] ?? PRIORITY_RANK.geschmack)
    if (priority) return priority

    const rootCause = Number(Boolean(right.istGrundursache)) - Number(Boolean(left.istGrundursache))
    if (rootCause) return rootCause

    const createdAt = (Number(left.createdAt) || 0) - (Number(right.createdAt) || 0)
    if (createdAt) return createdAt
    return String(left.id || '').localeCompare(String(right.id || ''), 'de')
  })
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
