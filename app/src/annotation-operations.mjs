// Reine, fail-closed Planung für Onda-Anmerkungen. Die Pläne tragen den erwarteten
// Vorher- und Nachher-Zustand und können deshalb vor der echten Editortransaktion noch
// einmal gegen Drift geprüft und danach ohne Raten umgekehrt werden.

import { resolveAnnotationPresentation } from './annotation-contract.mjs'

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

function normalizedSnapshot(snapshot = {}) {
  return {
    title: String(snapshot?.title || ''),
    blocks: Array.isArray(snapshot?.blocks) ? clone(snapshot.blocks) : [],
    sources: Array.isArray(snapshot?.sources) ? clone(snapshot.sources) : [],
  }
}

function fail(reason) {
  return { ok: false, reason }
}

function occurrences(text, target) {
  if (!target) return []
  const indexes = []
  let index = text.indexOf(target)
  while (index >= 0) {
    indexes.push(index)
    index = text.indexOf(target, index + 1)
  }
  return indexes
}

function resolveUniqueTarget(snapshot, target, blockId = null) {
  if (!target) return fail('missing-target')
  const candidates = blockId
    ? snapshot.blocks.filter(block => block.id === blockId)
    : snapshot.blocks
  if (blockId && !candidates.length) return fail('missing-target-block')
  const matches = candidates.flatMap(block => occurrences(String(block.text || ''), target)
    .map(index => ({ block, index })))
  if (!matches.length) return fail('missing-target')
  if (matches.length > 1) return fail('ambiguous-target')
  return { ok: true, ...matches[0] }
}

function completePlan(finding, kind, before, after, targets = []) {
  return Object.freeze({
    ok: true,
    id: `annotation-operation:${String(finding?.id || 'finding')}`,
    findingId: finding?.id || null,
    kind,
    targets: clone(targets),
    before: normalizedSnapshot(before),
    after: normalizedSnapshot(after),
  })
}

function planReplaceRange(finding, snapshot, kind = 'replace-range') {
  if (typeof finding?.action !== 'string' || !finding.action.length) return fail('missing-replacement')
  const match = resolveUniqueTarget(snapshot, String(finding?.target || ''), finding?.blockId || null)
  if (!match.ok) return match
  const after = normalizedSnapshot(snapshot)
  const block = after.blocks.find(candidate => candidate.id === match.block.id)
  block.text = `${block.text.slice(0, match.index)}${finding.action}${block.text.slice(match.index + finding.target.length)}`
  return completePlan(finding, kind, snapshot, after, [{ blockId: block.id, target: finding.target }])
}

function planInsertAt(finding, snapshot) {
  if (typeof finding?.action === 'string' && finding.action.length) {
    return planReplaceRange(finding, snapshot, 'insert-at')
  }
  const insertionText = String(finding?.insertionText || '')
  if (!insertionText) return fail('missing-insertion')
  const match = resolveUniqueTarget(snapshot, String(finding?.target || ''), finding?.blockId || null)
  if (!match.ok) return match
  const after = normalizedSnapshot(snapshot)
  const block = after.blocks.find(candidate => candidate.id === match.block.id)
  const at = finding?.insertionPosition === 'before'
    ? match.index
    : match.index + finding.target.length
  block.text = `${block.text.slice(0, at)}${insertionText}${block.text.slice(at)}`
  return completePlan(finding, 'insert-at', snapshot, after, [{ blockId: block.id, target: finding.target }])
}

function planReplaceTitle(finding, snapshot) {
  if (typeof finding?.action !== 'string' || !finding.action.length) return fail('missing-replacement')
  const expected = String(finding?.target || snapshot.title)
  if (snapshot.title !== expected) return fail('stale-title')
  const after = normalizedSnapshot(snapshot)
  after.title = finding.action
  return completePlan(finding, 'replace-title', snapshot, after, [{ title: expected }])
}

function planMoveBlock(finding, snapshot) {
  const fromId = String(finding?.move?.fromBlockId || finding?.blockId || '')
  const toId = String(finding?.move?.toBlockId || '')
  const fromIndex = snapshot.blocks.findIndex(block => block.id === fromId)
  const toIndex = snapshot.blocks.findIndex(block => block.id === toId)
  if (fromIndex < 0) return fail('missing-source-block')
  if (toIndex < 0) return fail('missing-target-block')
  if (fromId === toId) return fail('same-block')

  const after = normalizedSnapshot(snapshot)
  const [moved] = after.blocks.splice(fromIndex, 1)
  const targetIndex = after.blocks.findIndex(block => block.id === toId)
  const insertionIndex = finding?.move?.position === 'before' ? targetIndex : targetIndex + 1
  after.blocks.splice(insertionIndex, 0, moved)
  return completePlan(finding, 'move-block', snapshot, after, [{ blockId: fromId }, { blockId: toId }])
}

function planInsertHeading(finding, snapshot) {
  const heading = finding?.heading
  const afterId = String(heading?.afterBlockId || finding?.blockId || '')
  const targetIndex = snapshot.blocks.findIndex(block => block.id === afterId)
  if (targetIndex < 0) return fail('missing-target-block')
  const id = String(heading?.id || '')
  const text = String(heading?.text || finding?.action || '')
  if (!id || !text) return fail('missing-heading')
  if (snapshot.blocks.some(block => block.id === id)) return fail('duplicate-block-id')
  const level = Number.isInteger(heading?.level) && heading.level >= 1 && heading.level <= 3
    ? heading.level
    : 2
  const after = normalizedSnapshot(snapshot)
  after.blocks.splice(targetIndex + 1, 0, { id, type: 'heading', level, text })
  return completePlan(finding, 'insert-heading', snapshot, after, [{ blockId: afterId }, { blockId: id }])
}

function planReplaceMany(finding, snapshot) {
  if (!Array.isArray(finding?.targets) || !finding.targets.length) return fail('missing-targets')
  const after = normalizedSnapshot(snapshot)
  const seenBlocks = new Set()
  for (const target of finding.targets) {
    const blockId = String(target?.blockId || '')
    const exact = String(target?.text || '')
    const replacement = typeof target?.replacement === 'string' ? target.replacement : finding?.action
    if (typeof replacement !== 'string') return fail('missing-replacement')
    if (seenBlocks.has(`${blockId}|${exact}`)) return fail('duplicate-target')
    seenBlocks.add(`${blockId}|${exact}`)
    const block = after.blocks.find(candidate => candidate.id === blockId)
    if (!block) return fail('missing-target-block')
    const indexes = occurrences(String(block.text || ''), exact)
    if (!indexes.length) return fail('missing-target')
    if (indexes.length > 1) return fail('ambiguous-target')
    const index = indexes[0]
    block.text = `${block.text.slice(0, index)}${replacement}${block.text.slice(index + exact.length)}`
  }
  return completePlan(finding, 'replace-many', snapshot, after, finding.targets)
}

function planAttachSource(finding, snapshot) {
  const source = Array.isArray(finding?.sources) ? finding.sources[0] : null
  if (!source || typeof source !== 'object' || Array.isArray(source)) return fail('missing-source')
  const after = normalizedSnapshot(snapshot)
  after.sources.push(clone(source))
  return completePlan(finding, 'attach-source', snapshot, after, [{ source: source.label || source.url || 'Quelle' }])
}

const PLANNERS = Object.freeze({
  'replace-range': planReplaceRange,
  'insert-at': planInsertAt,
  'replace-title': planReplaceTitle,
  'move-block': planMoveBlock,
  'insert-heading': planInsertHeading,
  'replace-many': planReplaceMany,
  'attach-source': planAttachSource,
})

export function planAnnotationOperation(finding, documentSnapshot) {
  const snapshot = normalizedSnapshot(documentSnapshot)
  const operation = resolveAnnotationPresentation(finding).operation
  if (!operation || !PLANNERS[operation]) return fail('no-operation')
  return PLANNERS[operation](finding, snapshot)
}

export function validateAnnotationOperation(plan, currentSnapshot) {
  if (!plan?.ok) return plan || fail('missing-plan')
  const current = normalizedSnapshot(currentSnapshot)
  return JSON.stringify(current) === JSON.stringify(plan.before)
    ? { ok: true, resolvedTargets: clone(plan.targets || []) }
    : fail('stale-target')
}

export function applyAnnotationOperation(snapshot, plan) {
  if (!plan?.ok) return normalizedSnapshot(snapshot)
  return normalizedSnapshot(plan.after)
}

export function invertAnnotationOperation(applied) {
  if (!applied?.ok) return applied || fail('missing-plan')
  return Object.freeze({
    ...applied,
    id: `${applied.id}:undo`,
    inverseOf: applied.id,
    before: normalizedSnapshot(applied.after),
    after: normalizedSnapshot(applied.before),
  })
}
