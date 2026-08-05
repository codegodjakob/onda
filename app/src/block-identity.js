import { Extension } from '@tiptap/core'
import { collectBlockSnapshots } from './workspace-model.mjs'

const BLOCK_TYPES = [
  'paragraph',
  'heading',
  'blockquote',
  'codeBlock',
  'bulletList',
  'orderedList',
  'taskList',
  'horizontalRule',
]

const BLOCK_ID_PATTERN = /^b-[a-z0-9]+(?:-[a-z0-9]+)*$/i

let ensuringBlockIds = false

function createBlockId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return `b-${globalThis.crypto.randomUUID()}`
  }
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export const BlockIdentity = Extension.create({
  name: 'blockIdentity',
  addGlobalAttributes() {
    return [{
      types: BLOCK_TYPES,
      attributes: {
        blockId: {
          default: null,
          keepOnSplit: false,
          parseHTML: element => element.getAttribute('data-block-id'),
          renderHTML: attributes => attributes.blockId ? { 'data-block-id': attributes.blockId } : {},
        },
        semanticRole: {
          default: null,
          keepOnSplit: false,
          parseHTML: element => element.getAttribute('data-semantic-role'),
          renderHTML: attributes => attributes.semanticRole ? { 'data-semantic-role': attributes.semanticRole } : {},
        },
      },
    }]
  },
})

export function ensureTopLevelBlockIds(editor) {
  if (!editor || ensuringBlockIds) return false

  const seen = new Set()
  const tr = editor.state.tr
  let changed = false

  editor.state.doc.forEach((node, offset) => {
    const schemaAttributes = node.type.spec.attrs || {}
    if (!Object.prototype.hasOwnProperty.call(schemaAttributes, 'blockId')) return

    const blockId = node.attrs.blockId
    if (BLOCK_ID_PATTERN.test(String(blockId || '')) && !seen.has(blockId)) {
      seen.add(blockId)
      return
    }

    const nextId = createBlockId()
    seen.add(nextId)
    tr.setNodeMarkup(offset, undefined, { ...node.attrs, blockId: nextId })
    changed = true
  })

  if (!changed) return false

  ensuringBlockIds = true
  try {
    editor.view.dispatch(tr.setMeta('addToHistory', false))
  } finally {
    ensuringBlockIds = false
  }
  return true
}

export function getEditorBlocks(editor) {
  if (!editor) return []
  const snapshots = collectBlockSnapshots(editor.getJSON())
  const blocks = []

  editor.state.doc.forEach((node, pos, index) => {
    const rawText = node.textContent
    const trimmedText = rawText.trim()
    const sourceTextOffset = trimmedText ? rawText.indexOf(trimmedText) : 0
    const protectedRanges = []
    let textOffset = 0
    node.descendants(child => {
      if (child.isText) {
        const start = textOffset - sourceTextOffset
        const end = start + child.text.length
        if (child.marks.some(mark => mark.type.name === 'link')) {
          protectedRanges.push({ start: Math.max(0, start), end: Math.min(trimmedText.length, end), kind: 'link' })
        }
        textOffset += child.text.length
        return
      }
      if (child.isInline && child.isLeaf) textOffset += 1
    })
    if (node.type.name === 'blockquote' || node.type.name === 'codeBlock') {
      protectedRanges.push({ start: 0, end: trimmedText.length, kind: node.type.name })
    }
    blocks.push({
      ...snapshots[index],
      pos,
      nodeSize: node.nodeSize,
      isTextblock: node.isTextblock,
      isAtom: node.isAtom,
      sourceTextOffset,
      protectedRanges: protectedRanges.filter(range => range.end > range.start),
    })
  })

  return blocks
}

export function getActiveBlockId(editor) {
  const { selection } = editor.state
  const { $from } = selection
  if ($from.depth >= 1) return $from.node(1).attrs.blockId || null

  if (selection.node) {
    return getEditorBlocks(editor).find(block => block.pos === selection.from)?.id || null
  }
  return null
}

export function insertSemanticBlock(editor, afterBlockId, semanticRole = 'paragraph') {
  const block = getEditorBlocks(editor).find(item => item.id === afterBlockId)
  if (!block) return null
  const blockId = createBlockId()
  editor.chain().focus().insertContentAt(block.pos + block.nodeSize, {
    type: 'paragraph',
    attrs: { blockId, semanticRole },
  }).run()
  return blockId
}

function findTextRanges(textblock, blockPos, target) {
  let text = ''
  const positions = []

  textblock.descendants((node, relativePos) => {
    if (node.isText) {
      text += node.text
      for (let index = 0; index < node.text.length; index += 1) {
        positions.push(blockPos + 1 + relativePos + index)
      }
      return
    }

    // Inline leaf nodes occupy a ProseMirror position but are not part of
    // textContent. A sentinel keeps every later character mapped correctly.
    if (node.isInline && node.isLeaf) {
      text += '\uFFFC'
      positions.push(blockPos + 1 + relativePos)
    }
  })

  const ranges = []
  let index = text.indexOf(target)
  while (index >= 0) {
    const lastIndex = index + target.length - 1
    const from = positions[index]
    const last = positions[lastIndex]
    if (Number.isInteger(from) && Number.isInteger(last)) {
      ranges.push({ from, to: last + 1 })
    }
    index = text.indexOf(target, index + 1)
  }
  return ranges
}

export function replaceFindingTarget(editor, target, replacement, blockId = null) {
  if (!editor || typeof target !== 'string' || !target.length) return false

  const ranges = []
  editor.state.doc.forEach((topNode, topPos) => {
    if (blockId && topNode.attrs.blockId !== blockId) return

    if (topNode.isTextblock) {
      ranges.push(...findTextRanges(topNode, topPos, target))
      return
    }

    topNode.descendants((node, relativePos) => {
      if (!node.isTextblock) return
      ranges.push(...findTextRanges(node, topPos + 1 + relativePos, target))
      return false
    })
  })

  if (ranges.length !== 1) return false
  const value = String(replacement ?? '')
  const tr = value
    ? editor.state.tr.replaceWith(ranges[0].from, ranges[0].to, editor.state.schema.text(value))
    : editor.state.tr.delete(ranges[0].from, ranges[0].to)
  editor.view.dispatch(tr.scrollIntoView())
  editor.view.focus()
  return true
}

export function insertAnchoredText(editor, {
  blockId = null,
  target,
  text,
  position = 'after',
} = {}) {
  if (typeof target !== 'string' || !target || typeof text !== 'string' || !text) return false
  const replacement = position === 'before' ? `${text}${target}` : `${target}${text}`
  return replaceFindingTarget(editor, target, replacement, blockId)
}

export function applyAnchoredReplacements(editor, replacements = []) {
  if (!editor || !Array.isArray(replacements) || !replacements.length) return false
  const ranges = []
  for (const replacement of replacements) {
    const target = String(replacement?.target || '')
    const blockId = String(replacement?.blockId || '')
    if (!target || !blockId || typeof replacement?.replacement !== 'string') return false
    const matches = []
    editor.state.doc.forEach((topNode, topPos) => {
      if (topNode.attrs.blockId !== blockId) return
      if (topNode.isTextblock) matches.push(...findTextRanges(topNode, topPos, target))
      else {
        topNode.descendants((node, relativePos) => {
          if (!node.isTextblock) return
          matches.push(...findTextRanges(node, topPos + 1 + relativePos, target))
          return false
        })
      }
    })
    if (matches.length !== 1) return false
    ranges.push({ ...matches[0], replacement: replacement.replacement })
  }
  ranges.sort((left, right) => right.from - left.from)
  if (ranges.some((range, index) => index > 0 && range.to > ranges[index - 1].from)) return false
  const tr = ranges.reduce(
    (transaction, range) => transaction.insertText(range.replacement, range.from, range.to),
    editor.state.tr,
  )
  editor.view.dispatch(tr.scrollIntoView())
  editor.view.focus()
  return true
}

export function moveTopLevelBlock(editor, {
  fromBlockId,
  toBlockId,
  position = 'after',
} = {}) {
  if (!editor || !fromBlockId || !toBlockId || fromBlockId === toBlockId) return false
  let source = null
  let target = null
  editor.state.doc.forEach((node, pos) => {
    if (node.attrs.blockId === fromBlockId) source = { node, pos }
    if (node.attrs.blockId === toBlockId) target = { node, pos }
  })
  if (!source || !target) return false

  const tr = editor.state.tr.delete(source.pos, source.pos + source.node.nodeSize)
  const mappedTargetPos = tr.mapping.map(target.pos, -1)
  const mappedTarget = tr.doc.nodeAt(mappedTargetPos)
  if (!mappedTarget) return false
  const insertionPos = position === 'before'
    ? mappedTargetPos
    : mappedTargetPos + mappedTarget.nodeSize
  tr.insert(insertionPos, source.node)
  editor.view.dispatch(tr.scrollIntoView())
  editor.view.focus()
  return true
}

export function insertSemanticHeading(editor, {
  afterBlockId,
  blockId = createBlockId(),
  text,
  level = 2,
} = {}) {
  if (!editor || !afterBlockId || !String(text || '').trim()) return null
  const block = getEditorBlocks(editor).find(item => item.id === afterBlockId)
  if (!block || getEditorBlocks(editor).some(item => item.id === blockId)) return null
  const headingType = editor.state.schema.nodes.heading
  if (!headingType) return null
  const safeLevel = Number.isInteger(level) && level >= 1 && level <= 3 ? level : 2
  const node = headingType.create(
    { blockId, semanticRole: 'heading', level: safeLevel },
    editor.state.schema.text(String(text).trim()),
  )
  editor.view.dispatch(editor.state.tr.insert(block.pos + block.nodeSize, node).scrollIntoView())
  editor.view.focus()
  return blockId
}

export function replaceAnchoredText(editor, {
  blockId,
  start,
  end,
  exact,
  replacement,
} = {}) {
  return replaceAnchoredTexts(editor, [{
    blockId,
    anchor: { start, end, exact },
    replacement,
  }])
}

function resolveAnchoredRange(editor, correction) {
  const {
    blockId,
    anchor,
    replacement,
    sourceTextOffset = 0,
  } = correction || {}
  const { start, end, exact } = anchor || {}
  if (
    typeof blockId !== 'string'
    || !Number.isInteger(start)
    || !Number.isInteger(end)
    || !Number.isInteger(sourceTextOffset)
    || sourceTextOffset < 0
    || start < 0
    || end <= start
    || typeof exact !== 'string'
    || end - start !== exact.length
    || typeof replacement !== 'string'
  ) return null

  let range = null
  editor.state.doc.forEach((topNode, topPos) => {
    if (
      range
      || topNode.attrs.blockId !== blockId
      || topNode.type.name === 'codeBlock'
      || topNode.type.name === 'blockquote'
    ) return
    let text = ''
    const positions = []
    const protectedTextIndexes = new Set()
    topNode.descendants((node, relativePos) => {
      if (node.isText) {
        const offset = text.length
        text += node.text
        for (let index = 0; index < node.text.length; index += 1) {
          positions.push(topPos + 1 + relativePos + index)
          if (node.marks.some(mark => mark.type.name === 'link')) {
            protectedTextIndexes.add(offset + index)
          }
        }
        return
      }
      if (node.isInline && node.isLeaf) {
        text += '\uFFFC'
        positions.push(topPos + 1 + relativePos)
      }
    })
    const rawStart = start + sourceTextOffset
    const rawEnd = end + sourceTextOffset
    if (text.slice(rawStart, rawEnd) !== exact) return
    if ([...protectedTextIndexes].some(index => index >= rawStart && index < rawEnd)) return
    const from = positions[rawStart]
    const last = positions[rawEnd - 1]
    if (Number.isInteger(from) && Number.isInteger(last)) range = { from, to: last + 1 }
  })
  return range ? { ...range, replacement, blockId } : null
}

export function replaceAnchoredTexts(editor, corrections = []) {
  if (!editor || !Array.isArray(corrections) || !corrections.length) return false
  const ranges = corrections.map(correction => resolveAnchoredRange(editor, correction))
  if (ranges.some(range => !range)) return false
  ranges.sort((left, right) => right.from - left.from)
  if (ranges.some((range, index) => index > 0 && range.to > ranges[index - 1].from)) return false
  const tr = ranges.reduce(
    (transaction, range) => transaction.insertText(range.replacement, range.from, range.to),
    editor.state.tr,
  )
  editor.view.dispatch(tr.setMeta('languageOrthography', true))
  return true
}
