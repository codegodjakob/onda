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
    blocks.push({
      ...snapshots[index],
      pos,
      nodeSize: node.nodeSize,
      isTextblock: node.isTextblock,
      isAtom: node.isAtom,
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
