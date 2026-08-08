import { isIntegrityCategory } from './reasoning-model.mjs'
import { istFremdeInterviewNachricht } from './verstaendnis-interview.mjs'
import { normalizeAnnotationWorkspace } from './annotation-controller.mjs'
import { normalisiereBausteinarten } from './bausteinlauf-model.mjs'

const WORKSPACE_VERSION = 3
const IDLE_BEFORE_INITIATIVE_MS = 3000
const BOUNDARY_BEFORE_INITIATIVE_MS = 300
const THREAD_ROLES = new Set(['user', 'agent'])

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function textOf(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  return (node.content || []).map(textOf).join('')
}

function uniqueMessageId(preferredId, usedIds) {
  const base = preferredId
  let id = base
  let suffix = 2
  while (usedIds.has(id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }
  usedIds.add(id)
  return id
}

export function normalizeThread(value) {
  if (!Array.isArray(value)) return []
  const normalized = []
  const usedIds = new Set()

  value.forEach(candidate => {
    if (!isPlainObject(candidate)) return
    if (!THREAD_ROLES.has(candidate.role)) return
    if (typeof candidate.text !== 'string' || !candidate.text.trim()) return
    if (!Number.isFinite(candidate.at)) return

    const preferredId = typeof candidate.id === 'string' && candidate.id.trim()
      ? candidate.id.trim()
      : `message-${candidate.at}-${normalized.length}`
    normalized.push({
      id: uniqueMessageId(preferredId, usedIds),
      role: candidate.role,
      text: candidate.text,
      at: candidate.at,
    })
  })

  return normalized
}

// Render-/Persistenz-Normalisierung muss Referenzen erhalten: laufende Streams
// halten sowohl das Thread-Array als auch die gerade wachsende Nachricht fest.
// Ein Austausch durch strukturgleiche Kopien würde weitere Deltas und den
// finalen Text in verwaiste Objekte schreiben.
function normalizeThreadInPlace(value) {
  if (!Array.isArray(value)) return []
  const normalized = []
  const usedIds = new Set()

  value.forEach(candidate => {
    if (!isPlainObject(candidate)) return
    if (!THREAD_ROLES.has(candidate.role)) return
    if (typeof candidate.text !== 'string' || !candidate.text.trim()) return
    if (!Number.isFinite(candidate.at)) return

    const preferredId = typeof candidate.id === 'string' && candidate.id.trim()
      ? candidate.id.trim()
      : `message-${candidate.at}-${normalized.length}`
    candidate.id = uniqueMessageId(preferredId, usedIds)
    normalized.push(candidate)
  })

  value.splice(0, value.length, ...normalized)
  return value
}

function normalizeAgentMessages(value, docProjectId) {
  if (!Array.isArray(value)) return []
  const normalized = []
  const usedIds = new Set()

  value.forEach((candidate, index) => {
    if (!isPlainObject(candidate)) return
    const preferredId = typeof candidate.id === 'string' && candidate.id.trim()
      ? candidate.id.trim()
      : `agent-message-${index}`
    // Selbstheilung: das Interview-Fenster eines FREMDEN Projekts gehoert nicht in
    // dieses Dokument (siehe verstaendnis-interview.mjs).
    if (istFremdeInterviewNachricht(preferredId, docProjectId)) return
    const message = candidate
    message.id = uniqueMessageId(preferredId, usedIds)
    message.thread = normalizeThreadInPlace(candidate.thread)
    if (typeof message.text !== 'string') message.text = ''
    normalized.push(message)
  })
  return normalized
}

export function ensureWorkspaceState(doc) {
  const current = normalizeAnnotationWorkspace(isPlainObject(doc.workspace) ? doc.workspace : {})
  current.version = WORKSPACE_VERSION
  if (typeof current.shelfOpen !== 'boolean') current.shelfOpen = false
  current.activeBlockId = current.activeBlockId || null
  current.expandedFindingId = current.expandedFindingId || null
  current.suggestionFindingId = current.suggestionFindingId || null
  current.localThreadFindingId = current.localThreadFindingId || null
  current.evidenceFindingId = current.evidenceFindingId || null
  current.editingFinding = isPlainObject(current.editingFinding) ? current.editingFinding : null
  current.riskConfirmationFindingId = current.riskConfirmationFindingId || null
  current.riskReason = typeof current.riskReason === 'string' ? current.riskReason : ''

  const agent = isPlainObject(current.agent) ? current.agent : {}
  agent.messages = normalizeAgentMessages(agent.messages, doc.projectId)
  agent.dismissedIds = Array.isArray(agent.dismissedIds)
    ? [...new Set(agent.dismissedIds.filter(id => typeof id === 'string' && id.trim()).map(id => id.trim()))]
    : []
  if (typeof agent.open !== 'boolean') agent.open = false
  if (typeof agent.decisionsOpen !== 'boolean') agent.decisionsOpen = false
  agent.activeMessageId = typeof agent.activeMessageId === 'string'
    && agent.messages.some(message => message.id === agent.activeMessageId)
    ? agent.activeMessageId
    : null
  current.agent = agent

  if (Array.isArray(doc.findings)) {
    doc.findings.forEach(finding => {
      if (!isPlainObject(finding) || !Object.hasOwn(finding, 'thread')) return
      finding.thread = normalizeThreadInPlace(finding.thread)
    })
  }

  // Die erkannten Bausteinarten liegen NEBEN dem Text (Spec: "Wo es liegt"). Was hier
  // ankommt, kann aus einer aelteren Fassung stammen -- entweder es ist vollstaendig
  // gueltig, oder es ist null. Eine halbe Ablage waere schlimmer als keine.
  current.bausteinarten = normalisiereBausteinarten(current.bausteinarten)

  doc.workspace = current
  return current
}

// rollen: Map<blockId, funktion> aus doc.workspace.bausteinarten (bausteinlauf-model.mjs).
// Das alte Merkmal node.attrs.semanticRole wird bewusst NICHT mehr gelesen: Seit dem
// 7. August 2026 liegen die Bausteinarten neben dem Text, und zwei Quellen für dieselbe
// Angabe sind eine Quelle zu viel. Bestehende Dokumente verlieren nichts —
// bestandAusAltenRollen hebt alte Merkmale beim ersten Laden in die Ablage.
export function collectBlockSnapshots(docJson, rollen = null) {
  return (docJson && Array.isArray(docJson.content) ? docJson.content : []).map((node, index) => {
    const text = textOf(node).trim()
    const id = (node.attrs && node.attrs.blockId) || null
    const role = node.type === 'heading'
      ? 'heading'
      : (id && rollen && rollen.get(id)) || 'paragraph'
    return { id, index, type: node.type, role, text, excerpt: text.slice(0, 160) }
  })
}

export function findBlockForTarget(blocks, target) {
  const needle = String(target || '').trim()
  if (!needle) return null

  return (blocks || []).reduce((best, block) => {
    const text = String(block.text || '')
    if (!text.includes(needle)) return best
    if (!best || text.length < String(best.text || '').length) return block
    return best
  }, null)
}

export function resolveFindingBlock(finding, blocks) {
  const placement = resolveFindingPlacement(finding, blocks)
  return placement.kind === 'anchored' ? placement.block : null
}

export function resolveFindingPlacement(finding, blocks) {
  const target = String(finding?.target || '')
  if (!finding || !target) return { kind: 'unplaced', block: null }

  if (finding.blockId) {
    const anchored = (blocks || []).find(block => block.id === finding.blockId)
    if (!anchored) return { kind: 'unplaced', block: null }
    return String(anchored.text || '').includes(target)
      ? { kind: 'anchored', block: anchored }
      : { kind: 'stale', block: anchored }
  }

  const matches = (blocks || []).filter(block => String(block.text || '').includes(target))
  if (matches.length > 1) return { kind: 'ambiguous', block: null }
  if (matches.length !== 1 || !matches[0].id) return { kind: 'unplaced', block: null }
  finding.blockId = matches[0].id
  return { kind: 'anchored', block: matches[0] }
}

// Pro Baustein: hat er einen offenen Passage-Hinweis? 'evidence' (Beleg/Integrität)
// schlägt 'style' (Formulierung/Übergang). Rein — für die Struktur-Punkte in der Seitenleiste.
export function structureHintMap(doc, blocks) {
  const map = new Map()
  const findings = doc && Array.isArray(doc.findings) ? doc.findings : []
  for (const finding of findings) {
    if (finding.status !== 'open' || finding.placement !== 'passage' || !finding.target) continue
    const placement = resolveFindingPlacement(finding, blocks)
    if (placement.kind !== 'anchored') continue
    const kind = (Array.isArray(finding.sources) && finding.sources.length) || isIntegrityCategory(finding.category)
      ? 'evidence'
      : 'style'
    if (map.get(placement.block.id) !== 'evidence') map.set(placement.block.id, kind)
  }
  return map
}

// Belegfenster-Guard (Etappe A, H-4): Demo-Quellen (verificationStatus 'demo')
// gehoeren exklusiv zum Beispielprojekt -- alles andere waere eine Falschbehauptung
// gegenueber der Autorin/dem Autor. Echte Findings haben ohnehin sources: [] (H-1,
// die Quellensuche kommt erst in Etappe B); diese reine Funktion sichert zusaetzlich
// jeden anderen Weg ins Belegfenster ab, falls doch einmal eine Demo-Quelle an einem
// echten Finding haengen bliebe.
export function resolveEvidenceSources(sources, istBeispielprojekt) {
  const list = Array.isArray(sources) ? sources : []
  if (istBeispielprojekt) return list
  return list.filter(source => source?.verificationStatus !== 'demo')
}

export function createEditingFindingState(finding, block, startedAt = Date.now()) {
  if (!finding?.id || !finding.blockId || finding.blockId !== block?.id) return null
  const beforeText = String(block.text || '')
  const target = String(finding.target || '')
  const start = beforeText.indexOf(target)
  if (!target || start < 0 || beforeText.indexOf(target, start + 1) >= 0) return null

  return {
    findingId: finding.id,
    blockId: finding.blockId,
    beforeText,
    prefix: beforeText.slice(0, start),
    suffix: beforeText.slice(start + target.length),
    startedAt,
  }
}

export function deriveEditingAppliedText(editingFinding, currentBlockText) {
  if (!isPlainObject(editingFinding)) return null
  const current = String(currentBlockText || '')
  if (current === editingFinding.beforeText) return null
  const prefix = String(editingFinding.prefix || '')
  const suffix = String(editingFinding.suffix || '')
  if (!current.startsWith(prefix) || !current.endsWith(suffix)) return null
  if (current.length < prefix.length + suffix.length) return null
  return current.slice(prefix.length, current.length - suffix.length)
}

function editingFindingWithStatus(editingFinding, status, staleReason = null) {
  const next = { ...editingFinding, status }
  delete next.staleReason
  if (status === 'stale') next.staleReason = staleReason
  return next
}

export function reconcileEditingFinding(editingFinding, blocks) {
  if (!isPlainObject(editingFinding)) return { kind: 'none', editingFinding: null }

  const block = (blocks || []).find(candidate => candidate.id === editingFinding.blockId)
  if (!block) {
    return {
      kind: 'stale',
      editingFinding: editingFindingWithStatus(editingFinding, 'stale', 'block-missing'),
    }
  }

  const currentBlockText = String(block.text || '')
  if (currentBlockText === editingFinding.beforeText) {
    return {
      kind: 'pending',
      editingFinding: editingFindingWithStatus(editingFinding, 'pending'),
    }
  }

  const appliedText = deriveEditingAppliedText(editingFinding, currentBlockText)
  if (appliedText !== null) {
    return {
      kind: 'ready',
      appliedText,
      editingFinding: editingFindingWithStatus(editingFinding, 'ready'),
    }
  }

  return {
    kind: 'stale',
    editingFinding: editingFindingWithStatus(editingFinding, 'stale', 'text-diverged'),
  }
}

export function completeEditingFinding(editingFinding, blocks) {
  const result = reconcileEditingFinding(editingFinding, blocks)
  if (result.kind === 'ready') return { kind: 'accept', appliedText: result.appliedText }
  if (result.kind === 'pending') return { kind: 'unchanged' }
  return { kind: 'stale', reason: result.editingFinding?.staleReason || 'unavailable' }
}

export function shouldOpenAgentWidget({
  now,
  lastInputAt,
  boundaryAt,
  boundaryGeneration,
  inputGeneration,
  message,
  dismissedIds,
  documentId,
  activeDocumentId,
  isEditorView,
  visibilityState,
  isComposing,
}) {
  if (!message || message.status !== 'new') return false
  if ((dismissedIds || []).includes(message.id)) return false
  if (!documentId || documentId !== activeDocumentId) return false
  if (isEditorView !== true || visibilityState !== 'visible') return false
  if (isComposing === true) return false
  if (!Number.isFinite(now)) return false
  if (now < (message.earliestAt || 0)) return false
  if (!Number.isFinite(lastInputAt)) return false
  const idlePauseReady = now - lastInputAt >= IDLE_BEFORE_INITIATIVE_MS
  const paragraphBoundaryReady = Number.isFinite(boundaryAt)
    && boundaryGeneration === inputGeneration
    && now - boundaryAt >= BOUNDARY_BEFORE_INITIATIVE_MS
  return idlePauseReady || paragraphBoundaryReady
}

export function appendThreadMessage(thread, role, text, at = Date.now()) {
  if (!Array.isArray(thread)) throw new TypeError('Thread must be an array')
  if (!THREAD_ROLES.has(role)) throw new TypeError('Message role must be user or agent')
  if (typeof text !== 'string' || !text.trim()) throw new TypeError('Message text must be a nonempty string')
  if (!Number.isFinite(at)) throw new TypeError('Message timestamp must be finite')
  const usedIds = new Set(thread.map(message => message?.id).filter(id => typeof id === 'string' && id))
  const message = {
    id: uniqueMessageId(`message-${at}-${thread.length}`, usedIds),
    role,
    text,
    at,
  }
  thread.push(message)
  return message
}

export function dismissAgentMessage(workspace, messageId) {
  const agent = workspace.agent
  if (!agent.dismissedIds.includes(messageId)) agent.dismissedIds.push(messageId)
  agent.open = false
  return workspace
}

export function hasUnseenInitiative(workspace) {
  const agent = workspace?.agent
  if (!agent || agent.open) return false
  const dismissed = agent.dismissedIds || []
  return (agent.messages || []).some(
    message => message.status === 'new' && !dismissed.includes(message.id),
  )
}
