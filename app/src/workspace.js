import { getActiveBlockId, getEditorBlocks, insertSemanticBlock, replaceFindingTarget } from './block-identity.js'
import { decideFinding, getFindingQueue, isIntegrityCategory } from './reasoning-model.mjs'
import {
  appendThreadMessage,
  completeEditingFinding,
  createEditingFindingState,
  dismissAgentMessage,
  ensureWorkspaceState,
  reconcileEditingFinding,
  resolveFindingBlock,
  resolveFindingPlacement,
  shouldOpenAgentWidget,
} from './workspace-model.mjs'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

const BLOCK_TYPES = [
  ['paragraph', 'Freier Absatz'],
  ['claim', 'Kernbehauptung'],
  ['evidence', 'Beleg'],
  ['counterpoint', 'Gegenposition'],
  ['transition', 'Übergang'],
  ['question', 'Offene Frage'],
]

const ROLE_LABELS = new Map([
  ...BLOCK_TYPES,
  ['heading', 'Überschrift'],
])

let ctx = null
let controller = null
let lastContext = null
let renderedDocId = null
let decoratedDocId = null
let decoratedBlockId = null
let insertTrigger = null
let insertMenu = null
let hoveredBlockId = null
let hoverTimer = null
let typingTimer = null
let triggerFrame = null
let isTyping = false
let isComposing = false
let shelfRenderState = null
let localDecoratedDocId = null
let localDecoratedFindingId = null
let localDecoratedBlockId = null
let localDecoratedSpacing = 0
let localFeedbackError = null
let localPositionFrame = null
let localSummaryFocusRequest = null
let agentInitiativeTimer = null
let agentLiveFrame = null
let agentPresenceFocusRequest = false
let pendingParagraphBoundaryDocId = null
let evidenceFocusRequest = false
let evidenceReturnFindingId = null
let riskConfirmationFocusRequest = false

const AGENT_IDLE_MS = 3000
const AGENT_BOUNDARY_IDLE_MS = 300
const MAX_LOCAL_FEEDBACK_SPACING = 440
const MAX_LOCAL_SUGGESTION_SPACING = 640

const activeBlockKey = new PluginKey('workspaceActiveBlock')
const localFindingKey = new PluginKey('workspaceLocalFinding')

function activeBlockPlugin() {
  return new Plugin({
    key: activeBlockKey,
    state: {
      init() { return DecorationSet.empty },
      apply(transaction, decorations) {
        const blockId = transaction.getMeta(activeBlockKey)
        if (blockId === undefined) return decorations.map(transaction.mapping, transaction.doc)
        if (!blockId) return DecorationSet.empty

        const active = []
        transaction.doc.forEach((node, offset) => {
          if (node.attrs.blockId === blockId) {
            active.push(Decoration.node(offset, offset + node.nodeSize, { class: 'is-active-block' }))
          }
        })
        return DecorationSet.create(transaction.doc, active)
      },
    },
    props: {
      decorations(state) { return activeBlockKey.getState(state) },
    },
  })
}

function localFindingPlugin() {
  return new Plugin({
    key: localFindingKey,
    state: {
      init() { return DecorationSet.empty },
      apply(transaction, decorations) {
        const findingState = transaction.getMeta(localFindingKey)
        if (findingState === undefined) return decorations.map(transaction.mapping, transaction.doc)
        if (!findingState?.blockId) return DecorationSet.empty

        const local = []
        transaction.doc.forEach((node, offset) => {
          if (node.attrs.blockId === findingState.blockId) {
            local.push(Decoration.node(offset, offset + node.nodeSize, { class: 'has-local-finding' }))
            if (findingState.spacing > 0) {
              local.push(Decoration.widget(offset + node.nodeSize, () => {
                const spacer = document.createElement('div')
                spacer.className = 'local-feedback-spacer'
                spacer.dataset.localFeedbackBlockId = findingState.blockId
                spacer.style.height = `${findingState.spacing}px`
                spacer.setAttribute('aria-hidden', 'true')
                return spacer
              }, {
                key: `local-feedback-spacer:${findingState.blockId}:${findingState.spacing}`,
                side: -1,
                ignoreSelection: true,
              }))
            }
          }
        })
        return DecorationSet.create(transaction.doc, local)
      },
    },
    props: {
      decorations(state) { return localFindingKey.getState(state) },
    },
  })
}

function setLocalFindingDecoration(blockId, spacing = 0, force = false) {
  const nextSpacing = blockId ? Math.max(0, Math.ceil(spacing)) : 0
  if (!force && localDecoratedBlockId === blockId && localDecoratedSpacing === nextSpacing) return false
  localDecoratedBlockId = blockId
  localDecoratedSpacing = nextSpacing
  ctx.editor.view.dispatch(ctx.editor.state.tr.setMeta(localFindingKey, {
    blockId,
    spacing: nextSpacing,
  }))
  return true
}

function elements() {
  return {
    back: document.getElementById('workspaceBack'),
    path: document.getElementById('workspacePath'),
    body: document.getElementById('workspaceBody'),
    shelf: document.getElementById('structureShelf'),
    main: document.getElementById('main'),
    scroll: document.getElementById('scroll'),
    insertLayer: document.getElementById('blockInsertLayer'),
    localLayer: document.getElementById('localAgentLayer'),
    agentPresence: document.getElementById('agentPresence'),
    agentWidget: document.getElementById('agentWidget'),
    evidenceWindow: document.getElementById('evidenceWindow'),
  }
}

function announceAgentStatus(text) {
  const status = document.getElementById('agentLiveStatus')
  if (!status) return
  if (agentLiveFrame) cancelAnimationFrame(agentLiveFrame)
  status.textContent = ''
  agentLiveFrame = requestAnimationFrame(() => {
    agentLiveFrame = null
    status.textContent = String(text || '')
  })
}

function captureInputState(container, selector) {
  const input = container?.querySelector(selector)
  if (!input) return null
  return {
    focused: document.activeElement === input,
    value: input.value,
    selectionStart: input.selectionStart,
    selectionEnd: input.selectionEnd,
  }
}

function restoreInputState(input, state, forceFocus = false) {
  if (!input || !state) return
  input.value = state.value
  if (!state.focused && !forceFocus) return
  input.focus({ preventScroll: true })
  if (Number.isInteger(state.selectionStart) && Number.isInteger(state.selectionEnd)) {
    input.setSelectionRange(state.selectionStart, state.selectionEnd)
  }
}

function scrollThreadToLatest(messages) {
  if (!messages) return
  messages.scrollTop = messages.scrollHeight
}

function activeWorkspace() {
  const doc = ctx?.activeDoc()
  return doc ? ensureWorkspaceState(doc) : null
}

function persistWorkspace() {
  ctx?.scheduleSave()
}

function setLayerVisibility(node, visible) {
  if (!node) return
  node.hidden = !visible
}

function hasLocalDepth(workspace) {
  return Boolean(
    workspace.expandedFindingId
    || workspace.suggestionFindingId
    || workspace.localThreadFindingId,
  )
}

function closeLocalDepth(workspace) {
  workspace.expandedFindingId = null
  workspace.suggestionFindingId = null
  workspace.localThreadFindingId = null
}

function enforceExclusiveLayers(workspace) {
  if (workspace.evidenceFindingId) {
    closeInsertMenu({ restoreFocus: false })
    workspace.agent.open = false
    workspace.shelfOpen = false
    closeLocalDepth(workspace)
  } else if (workspace.agent.open) {
    closeInsertMenu({ restoreFocus: false })
    workspace.shelfOpen = false
    workspace.evidenceFindingId = null
    closeLocalDepth(workspace)
  } else if (hasLocalDepth(workspace)) {
    closeInsertMenu({ restoreFocus: false })
    workspace.shelfOpen = false
    workspace.agent.open = false
    workspace.evidenceFindingId = null
  }
}

function syncActiveBlock(workspace) {
  const blocks = getEditorBlocks(ctx.editor)
  const currentId = getActiveBlockId(ctx.editor)

  if (renderedDocId !== ctx.activeDoc()?.id) {
    renderedDocId = ctx.activeDoc()?.id || null
    const restored = blocks.find(block => block.id === workspace.activeBlockId)
    if (restored && restored.id !== currentId) {
      selectBlock(restored)
      return restored.id
    }
  }

  if (!workspace.activeBlockId || !blocks.some(block => block.id === workspace.activeBlockId)) {
    workspace.activeBlockId = currentId || blocks[0]?.id || null
  }
  return workspace.activeBlockId
}

function createNode(tagName, className, text) {
  const node = document.createElement(tagName)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function blockElement(blockId) {
  return [...ctx.editor.view.dom.children].find(node => node.dataset.blockId === blockId) || null
}

function escapedSelectorValue(value) {
  const string = String(value || '')
  if (globalThis.CSS && typeof globalThis.CSS.escape === 'function') return globalThis.CSS.escape(string)
  return string.replace(/["\\]/g, '\\$&')
}

function selectBlock(block) {
  if (block.isTextblock) {
    ctx.editor.commands.setTextSelection(block.pos + 1)
  } else {
    ctx.editor.commands.setNodeSelection(block.pos)
  }
}

function focusBlock(blockId) {
  const block = getEditorBlocks(ctx.editor).find(candidate => candidate.id === blockId)
  if (!block) return
  selectBlock(block)
  const workspace = activeWorkspace()
  if (workspace) workspace.activeBlockId = blockId
  requestAnimationFrame(() => {
    blockElement(blockId)?.scrollIntoView({
      block: 'center',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  })
  refreshWorkspace()
  ctx.editor.view.focus()
  persistWorkspace()
}

function closeInsertMenu({ restoreFocus = true } = {}) {
  if (!insertMenu) return false
  const { node, opener, outsideHandler } = insertMenu
  document.removeEventListener('pointerdown', outsideHandler, true)
  node.remove()
  insertMenu = null
  if (restoreFocus && opener?.isConnected) opener.focus()
  return true
}

function placeInsertMenu(menu, anchor) {
  const anchorRect = anchor.getBoundingClientRect()
  const menuRect = menu.getBoundingClientRect()
  const gutter = 10
  const left = Math.min(
    Math.max(gutter, anchorRect.left),
    window.innerWidth - menuRect.width - gutter,
  )
  const fitsBelow = anchorRect.bottom + 6 + menuRect.height <= window.innerHeight - gutter
  const top = fitsBelow
    ? anchorRect.bottom + 6
    : Math.max(gutter, anchorRect.top - menuRect.height - 6)
  menu.style.left = `${left}px`
  menu.style.top = `${top}px`
}

function insertBlock(afterBlockId, role) {
  const insertedId = insertSemanticBlock(ctx.editor, afterBlockId, role)
  if (!insertedId) return
  const workspace = activeWorkspace()
  if (workspace) workspace.activeBlockId = insertedId
  closeInsertMenu({ restoreFocus: false })
  const block = getEditorBlocks(ctx.editor).find(candidate => candidate.id === insertedId)
  if (block) ctx.editor.commands.setTextSelection(block.pos + 1)
  refreshWorkspace()
  persistWorkspace()
}

function openInsertMenu(afterBlockId, opener) {
  closeInsertMenu({ restoreFocus: false })
  const workspace = activeWorkspace()
  const ui = elements()
  const fromShelf = Boolean(ui.shelf?.contains(opener))
  if (workspace) {
    const changed = workspace.agent.open
      || Boolean(workspace.evidenceFindingId)
      || hasLocalDepth(workspace)
    workspace.agent.open = false
    workspace.evidenceFindingId = null
    closeLocalDepth(workspace)
    if (changed) {
      refreshWorkspace()
      persistWorkspace()
    }
  }
  const menu = createNode('div', 'semantic-insert-menu')
  menu.setAttribute('role', 'menu')
  menu.setAttribute('aria-label', 'Art des Textbausteins')

  BLOCK_TYPES.forEach(([role, label]) => {
    const choice = createNode('button', 'semantic-insert-choice', label)
    choice.type = 'button'
    choice.setAttribute('role', 'menuitem')
    choice.dataset.semanticRole = role
    choice.addEventListener('click', () => insertBlock(afterBlockId, role))
    menu.append(choice)
  })

  const outsideHandler = event => {
    if (menu.contains(event.target) || opener.contains(event.target)) return
    closeInsertMenu({ restoreFocus: false })
  }
  menu.addEventListener('keydown', event => {
    const choices = [...menu.querySelectorAll('button')]
    const current = choices.indexOf(document.activeElement)
    let next = null
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeInsertMenu()
      return
    }
    if (event.key === 'ArrowDown') next = (current + 1) % choices.length
    if (event.key === 'ArrowUp') next = (current - 1 + choices.length) % choices.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = choices.length - 1
    if (next !== null) {
      event.preventDefault()
      choices[next].focus()
    }
  })

  document.getElementById('editorView').append(menu)
  insertMenu = { node: menu, opener, outsideHandler, fromShelf }
  placeInsertMenu(menu, opener)
  document.addEventListener('pointerdown', outsideHandler, true)
  menu.querySelector('button')?.focus()
}

function createShelfBlockNodes(block) {
  const preview = createNode('button', 'block-preview')
  preview.type = 'button'
  preview.dataset.blockId = block.id
  const excerpt = createNode('span', 'block-preview-excerpt')
  const role = createNode('span', 'block-preview-role')
  preview.append(excerpt, role)
  preview.addEventListener('click', () => focusBlock(block.id))

  const insert = createNode('button', 'block-insert', '+')
  insert.type = 'button'
  insert.dataset.afterBlockId = block.id
  insert.setAttribute('aria-label', 'Textbaustein danach einfügen')
  insert.title = 'Textbaustein einfügen'
  insert.addEventListener('click', () => openInsertMenu(block.id, insert))
  return { preview, excerpt, role, insert }
}

function updateShelfBlockNodes(nodes, block, activeBlockId) {
  const roleLabel = ROLE_LABELS.get(block.role) || 'Freier Absatz'
  const excerpt = block.excerpt || 'Noch leer'
  nodes.preview.setAttribute('aria-label', `${roleLabel}: ${excerpt}`)
  if (block.id === activeBlockId) {
    nodes.preview.setAttribute('aria-current', 'true')
  } else {
    nodes.preview.removeAttribute('aria-current')
  }
  nodes.excerpt.textContent = excerpt
  nodes.excerpt.classList.toggle('is-empty', !block.excerpt)
  nodes.role.textContent = roleLabel
}

function rebuildStructureShelf(ui, doc, blocks) {
  const scrollTop = ui.shelf.scrollTop
  const header = createNode('header', 'structure-shelf-header')
  const label = createNode('span', 'structure-shelf-label', 'Strukturablage')
  const title = createNode('strong', 'structure-shelf-title')
  header.append(label, title)

  const list = createNode('div', 'structure-blocks')
  const blockNodes = new Map()
  if (!blocks.length) list.append(createNode('p', 'structure-shelf-empty', 'Noch keine Textabschnitte.'))
  blocks.forEach(block => {
    const nodes = createShelfBlockNodes(block)
    blockNodes.set(block.id, nodes)
    list.append(nodes.preview, nodes.insert)
  })

  ui.shelf.replaceChildren(header, list)
  ui.shelf.scrollTop = scrollTop
  shelfRenderState = {
    docId: doc.id,
    ids: blocks.map(block => block.id),
    title,
    blockNodes,
  }
}

function renderStructureShelf() {
  const ui = elements()
  const workspace = activeWorkspace()
  if (!ui.shelf || !workspace?.shelfOpen) return

  const blocks = getEditorBlocks(ctx.editor).filter(block => block.id)
  const doc = ctx.activeDoc()
  const ids = blocks.map(block => block.id)
  const orderChanged = shelfRenderState?.docId !== doc.id
    || shelfRenderState.ids.length !== ids.length
    || ids.some((id, index) => shelfRenderState.ids[index] !== id)
  if (orderChanged) rebuildStructureShelf(ui, doc, blocks)

  shelfRenderState.title.textContent = ctx.docTitle(doc)
  blocks.forEach(block => {
    updateShelfBlockNodes(shelfRenderState.blockNodes.get(block.id), block, workspace.activeBlockId)
  })
}

function scheduleTriggerRender() {
  if (triggerFrame) cancelAnimationFrame(triggerFrame)
  triggerFrame = requestAnimationFrame(() => {
    triggerFrame = null
    renderInsertTrigger()
  })
}

function renderInsertTrigger() {
  const ui = elements()
  const workspace = activeWorkspace()
  if (!ui.insertLayer || !workspace) return

  if (!insertTrigger) {
    insertTrigger = createNode('button', 'block-insert-trigger', '+')
    insertTrigger.id = 'blockInsertTrigger'
    insertTrigger.type = 'button'
    insertTrigger.title = 'Textbaustein einfügen'
    insertTrigger.setAttribute('aria-label', 'Textbaustein nach dem aktiven Abschnitt einfügen')
    insertTrigger.addEventListener('click', () => {
      const activeBlockId = activeWorkspace()?.activeBlockId
      if (activeBlockId) openInsertMenu(activeBlockId, insertTrigger)
    })
    insertTrigger.addEventListener('pointerenter', () => {
      clearTimeout(hoverTimer)
      hoveredBlockId = activeWorkspace()?.activeBlockId || null
      renderInsertTrigger()
    })
    insertTrigger.addEventListener('pointerleave', () => scheduleHoverClear())
    ui.insertLayer.append(insertTrigger)
  }

  const activeBlock = blockElement(workspace.activeBlockId)
  if (!activeBlock || document.body.classList.contains('view-home')) {
    insertTrigger.hidden = true
    return
  }

  insertTrigger.hidden = false
  insertTrigger.classList.toggle('is-block-hovered', hoveredBlockId === workspace.activeBlockId)
  insertTrigger.classList.toggle('is-typing', isTyping)
  insertTrigger.dataset.afterBlockId = workspace.activeBlockId

  const layerRect = ui.insertLayer.getBoundingClientRect()
  const blockRect = activeBlock.getBoundingClientRect()
  const activeSelectorId = escapedSelectorValue(workspace.activeBlockId)
  const feedbackSurfaces = [...(ui.localLayer?.querySelectorAll(`[data-block-id="${activeSelectorId}"]`) || [])]
    .filter(node => !node.hidden && getComputedStyle(node).visibility !== 'hidden')
    .map(node => node.getBoundingClientRect())
  const boundaryBottom = feedbackSurfaces.reduce(
    (bottom, rect) => Math.max(bottom, rect.bottom),
    blockRect.bottom,
  )
  insertTrigger.style.left = `${Math.max(6, blockRect.left - layerRect.left - 34)}px`
  insertTrigger.style.top = `${boundaryBottom - layerRect.top + 8}px`
}

function scheduleHoverClear() {
  clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => {
    if (insertTrigger?.matches(':hover') || insertTrigger === document.activeElement) return
    hoveredBlockId = null
    renderInsertTrigger()
  }, 120)
}

function markTyping() {
  isTyping = true
  clearTimeout(typingTimer)
  renderInsertTrigger()
  if (isComposing) return
  typingTimer = setTimeout(() => {
    isTyping = false
    renderInsertTrigger()
  }, 520)
}

function initiativeInputState(docId = ctx?.activeDoc()?.id) {
  if (!controller || !docId) return null
  if (!controller.inputByDocument.has(docId)) {
    controller.inputByDocument.set(docId, {
      generation: 0,
      lastInputAt: Number.NaN,
      boundaryAt: Number.NaN,
      boundaryGeneration: null,
      pendingUpdateGeneration: null,
      pendingBoundary: false,
    })
  }
  return controller.inputByDocument.get(docId)
}

function clearAgentInitiativeTimer() {
  if (agentInitiativeTimer) clearTimeout(agentInitiativeTimer)
  agentInitiativeTimer = null
}

function invalidateAgentInitiative({ requireNewInput = false } = {}) {
  clearAgentInitiativeTimer()
  pendingParagraphBoundaryDocId = null
  const state = initiativeInputState()
  if (!state) return
  state.generation += 1
  state.boundaryAt = Number.NaN
  state.boundaryGeneration = null
  state.pendingBoundary = false
  state.pendingUpdateGeneration = null
  if (requireNewInput) state.lastInputAt = Number.NaN
}

function recordRealEditorInput({ paragraphBoundary = false } = {}) {
  const docId = ctx?.activeDoc()?.id
  const state = initiativeInputState(docId)
  if (!state || controller.activeDocumentId !== docId) return
  clearAgentInitiativeTimer()
  state.generation += 1
  state.lastInputAt = Date.now()
  state.boundaryAt = Number.NaN
  state.boundaryGeneration = null
  state.pendingUpdateGeneration = state.generation
  state.pendingBoundary = paragraphBoundary && !isComposing
}

function completeRealEditorUpdate() {
  const state = initiativeInputState()
  if (!state || state.pendingUpdateGeneration !== state.generation) return false
  const at = Date.now()
  state.lastInputAt = at
  if (state.pendingBoundary && !isComposing) {
    state.boundaryAt = at
    state.boundaryGeneration = state.generation
  }
  state.pendingUpdateGeneration = null
  state.pendingBoundary = false
  scheduleAgentInitiative()
  return true
}

function handleEditorKeyDown(event) {
  if (
    event.key !== 'Enter'
    || event.isComposing
    || isComposing
    || event.shiftKey
    || event.metaKey
    || event.ctrlKey
    || event.altKey
  ) return
  pendingParagraphBoundaryDocId = ctx?.activeDoc()?.id || null
  recordRealEditorInput({ paragraphBoundary: true })
}

function handleBeforeInput(event) {
  const docId = ctx?.activeDoc()?.id || null
  const paragraphBoundary = !isComposing && (
    event?.inputType === 'insertParagraph'
    || pendingParagraphBoundaryDocId === docId
  )
  pendingParagraphBoundaryDocId = null
  recordRealEditorInput({ paragraphBoundary })
  markTyping()
}

function startComposition() {
  isComposing = true
  pendingParagraphBoundaryDocId = null
  recordRealEditorInput()
  markTyping()
}

function endComposition() {
  isComposing = false
  recordRealEditorInput()
  completeRealEditorUpdate()
  markTyping()
}

function currentPassageFinding(doc, blocks) {
  const queue = getFindingQueue(doc)
  let migrated = false
  for (const finding of [queue.current, ...queue.upcoming]) {
    if (finding?.placement !== 'passage' || !finding.target) continue
    const hadBlockId = Boolean(finding.blockId)
    const placement = resolveFindingPlacement(finding, blocks)
    if (placement.kind !== 'anchored' && placement.kind !== 'stale') continue
    if (!hadBlockId && finding.blockId) migrated = true
    return { finding, block: placement.block, placementKind: placement.kind, migrated }
  }
  return { finding: null, block: null, placementKind: null, migrated }
}

function unplacedPassageFindings(doc, blocks) {
  const queue = getFindingQueue(doc)
  return [queue.current, ...queue.upcoming]
    .filter(finding => finding?.placement === 'passage' && finding.target)
    .map(finding => ({ finding, placement: resolveFindingPlacement(finding, blocks) }))
    .filter(item => item.placement.kind === 'ambiguous' || item.placement.kind === 'unplaced')
}

function localSurfaceIds(findingId) {
  const token = String(findingId || 'finding').replace(/[^a-zA-Z0-9_-]/g, '-')
  return {
    summary: `local-finding-summary-${token}`,
    detail: `local-finding-detail-${token}`,
    suggestion: `local-finding-suggestion-${token}`,
    dialogue: `local-finding-dialogue-${token}`,
  }
}

function requestLocalSummaryFocus(findingId) {
  localSummaryFocusRequest = findingId || null
}

function findingConsequence(finding) {
  if (finding.consequence) return finding.consequence
  if (finding.folge) return finding.folge
  if (finding.action) return 'Eine Änderung kann die Aussage präzisieren; deine jetzige Fassung bleibt bis zu einer bewussten Entscheidung erhalten.'
  return 'Du kannst den Gedanken prüfen, ohne den Schreibfluss oder die aktuelle Fassung zu verlieren.'
}

function appendDetailRow(detail, label, text) {
  const row = createNode('div', 'local-finding-detail-row')
  row.append(
    createNode('span', 'local-finding-detail-label', label),
    createNode('p', 'local-finding-detail-text', text),
  )
  detail.append(row)
}

function appendThreadMessageNode(parent, message) {
  const item = createNode('div', `agent-message is-${message.role === 'user' ? 'user' : 'agent'}`)
  item.dataset.messageId = message.id
  item.append(
    createNode('span', 'agent-message-role', message.role === 'user' ? 'Du' : 'Agent'),
    createNode('p', 'agent-message-text', message.text),
  )
  parent.append(item)
}

function ensureLocalThread(finding) {
  if (!Array.isArray(finding.thread)) finding.thread = []
  if (!finding.thread.length) {
    appendThreadMessage(
      finding.thread,
      'agent',
      `Ich würde diese Stelle gern genauer verstehen: ${finding.short}`,
      Date.now(),
    )
  }
  return finding.thread
}

function renderLocalDialogue(finding) {
  const workspace = activeWorkspace()
  if (!finding || workspace?.localThreadFindingId !== finding.id) return null

  const dialogue = createNode('section', 'local-dialogue')
  dialogue.id = localSurfaceIds(finding.id).dialogue
  dialogue.setAttribute('aria-label', 'Gespräch zu dieser Textstelle')
  dialogue.append(createNode('p', 'local-dialogue-title', 'Gespräch zu dieser Stelle'))

  const messages = createNode('div', 'local-dialogue-messages')
  ensureLocalThread(finding).forEach(message => appendThreadMessageNode(messages, message))

  const form = createNode('form', 'agent-chat-form')
  const input = createNode('input', 'agent-chat-input')
  input.type = 'text'
  input.placeholder = 'Antworten …'
  input.setAttribute('aria-label', 'Dem Agenten zu dieser Stelle antworten')
  const send = createNode('button', 'agent-chat-send', '→')
  send.type = 'submit'
  send.title = 'Senden'
  send.setAttribute('aria-label', 'Nachricht senden')
  form.append(input, send)
  form.addEventListener('submit', event => {
    event.preventDefault()
    const text = input.value.trim()
    if (!text) return
    const at = Date.now()
    appendThreadMessage(finding.thread, 'user', text, at)
    const reply = 'Beispielreaktion: Verstanden. Dann würde ich die Passage als gestaltete Bedingung lesen und die Verantwortung des Werkzeugs deutlicher machen.'
    appendThreadMessage(
      finding.thread,
      'agent',
      reply,
      at + 1,
    )
    input.value = ''
    announceAgentStatus(reply)
    ctx.persist()
    refreshWorkspace()
  })

  dialogue.append(messages, form)
  scrollThreadToLatest(messages)
  return dialogue
}

function changedWordParts(before, after) {
  const tokenize = value => String(value || '').match(/\s+|[\p{L}\p{N}]+|[^\s\p{L}\p{N}]+/gu) || []
  const oldTokens = tokenize(before)
  const newTokens = tokenize(after)
  let prefix = 0
  while (prefix < oldTokens.length && prefix < newTokens.length && oldTokens[prefix] === newTokens[prefix]) prefix += 1

  let suffix = 0
  while (
    suffix < oldTokens.length - prefix
    && suffix < newTokens.length - prefix
    && oldTokens[oldTokens.length - 1 - suffix] === newTokens[newTokens.length - 1 - suffix]
  ) suffix += 1

  return {
    prefix: oldTokens.slice(0, prefix).join(''),
    oldChanged: oldTokens.slice(prefix, oldTokens.length - suffix).join(''),
    newChanged: newTokens.slice(prefix, newTokens.length - suffix).join(''),
    suffix: suffix ? oldTokens.slice(oldTokens.length - suffix).join('') : '',
  }
}

function appendSuggestionVersion(parent, label, prefix, changed, suffix, changeClass) {
  const row = createNode('div', 'suggestion-version')
  row.append(createNode('span', 'suggestion-version-label', label))
  const text = createNode('p', 'suggestion-version-text')
  if (prefix) text.append(createNode('span', 'suggestion-unchanged', prefix))
  if (changed) text.append(createNode('span', changeClass, changed))
  if (suffix) text.append(createNode('span', 'suggestion-unchanged', suffix))
  row.append(text)
  parent.append(row)
}

function findingActionButton(label, symbol, handler) {
  const button = createNode('button', 'suggestion-action', symbol)
  button.type = 'button'
  button.title = label
  button.setAttribute('aria-label', label)
  button.addEventListener('click', event => {
    event.stopPropagation()
    handler()
  })
  return button
}

function clearFindingWorkspaceState(workspace, findingId) {
  if (workspace.expandedFindingId === findingId) workspace.expandedFindingId = null
  if (workspace.suggestionFindingId === findingId) workspace.suggestionFindingId = null
  if (workspace.localThreadFindingId === findingId) workspace.localThreadFindingId = null
  if (workspace.evidenceFindingId === findingId) workspace.evidenceFindingId = null
  if (workspace.editingFinding?.findingId === findingId) workspace.editingFinding = null
  if (workspace.riskConfirmationFindingId === findingId) {
    workspace.riskConfirmationFindingId = null
    workspace.riskReason = ''
  }
}

function reconcilePersistedEditingFinding() {
  const doc = ctx?.activeDoc()
  const workspace = activeWorkspace()
  const editing = workspace?.editingFinding
  if (!doc || !editing) return { kind: 'none' }

  const finding = doc.findings.find(candidate => candidate.id === editing.findingId)
  if (!finding || finding.status !== 'open') {
    const stale = { ...editing, status: 'stale', staleReason: 'finding-unavailable' }
    const changed = editing.status !== stale.status || editing.staleReason !== stale.staleReason
    workspace.editingFinding = stale
    if (changed) ctx.persist()
    return { kind: 'stale', editingFinding: stale }
  }

  const result = reconcileEditingFinding(editing, getEditorBlocks(ctx.editor))
  const nextEditing = result.editingFinding
  const changed = editing.status !== nextEditing.status || editing.staleReason !== nextEditing.staleReason
  workspace.editingFinding = nextEditing
  if (changed) ctx.persist()
  return result
}

function showLocalFeedbackError(findingId) {
  localFeedbackError = {
    findingId,
    message: 'Diese Stelle ist nicht eindeutig. Ich habe nichts geändert.',
  }
  const suggestion = elements().localLayer?.querySelector('.local-suggestion')
  if (!suggestion) return
  suggestion.querySelector('.local-finding-error')?.remove()
  const error = createNode('p', 'local-finding-error', localFeedbackError.message)
  error.setAttribute('role', 'status')
  suggestion.append(error)
  scheduleLocalPosition(suggestion.dataset.blockId)
}

function textRanges(textblock, blockPos, target) {
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
    if (node.isInline && node.isLeaf) {
      text += '\uFFFC'
      positions.push(blockPos + 1 + relativePos)
    }
  })

  const ranges = []
  let index = text.indexOf(target)
  while (index >= 0) {
    const from = positions[index]
    const last = positions[index + target.length - 1]
    if (Number.isInteger(from) && Number.isInteger(last)) ranges.push({ from, to: last + 1 })
    index = text.indexOf(target, index + 1)
  }
  return ranges
}

function targetDocumentRange(blockId, target) {
  if (!blockId || !target) return null
  const ranges = []
  ctx.editor.state.doc.forEach((topNode, topPos) => {
    if (topNode.attrs.blockId !== blockId) return
    if (topNode.isTextblock) {
      ranges.push(...textRanges(topNode, topPos, target))
      return
    }
    topNode.descendants((node, relativePos) => {
      if (!node.isTextblock) return
      ranges.push(...textRanges(node, topPos + 1 + relativePos, target))
      return false
    })
  })
  return ranges.length === 1 ? ranges[0] : null
}

function decideAndAdvance(finding, decision) {
  const doc = ctx.activeDoc()
  const workspace = activeWorkspace()
  decideFinding(doc, finding.id, decision)
  clearFindingWorkspaceState(workspace, finding.id)
  localFeedbackError = null
  ctx.scheduleSave()
  refreshWorkspace()
  requestAnimationFrame(() => {
    const nextSummary = elements().localLayer?.querySelector('.local-finding-summary')
    if (nextSummary && !elements().localLayer?.classList.contains('is-paused')) {
      nextSummary.focus({ preventScroll: true })
    } else {
      ctx.editor.view.focus()
    }
  })
}

function handleSuggestionReject(finding) {
  if (!isIntegrityCategory(finding.category)) {
    decideAndAdvance(finding, { kind: 'reject' })
    return
  }
  const workspace = activeWorkspace()
  workspace.riskConfirmationFindingId = finding.id
  workspace.riskReason = ''
  riskConfirmationFocusRequest = true
  ctx.scheduleSave()
  refreshWorkspace()
}

function authorizedFindingBlock(finding) {
  if (!finding?.blockId) return null
  return resolveFindingBlock(finding, getEditorBlocks(ctx.editor))
}

function handleSuggestionOwnVersion(finding) {
  const block = authorizedFindingBlock(finding)
  const range = block ? targetDocumentRange(finding.blockId, finding.target) : null
  const editingFinding = block ? createEditingFindingState(finding, block) : null
  if (!range || !editingFinding) {
    showLocalFeedbackError(finding.id)
    return
  }
  const workspace = activeWorkspace()
  workspace.activeBlockId = finding.blockId
  workspace.suggestionFindingId = null
  workspace.editingFinding = editingFinding
  localFeedbackError = null
  ctx.scheduleSave()
  refreshWorkspace()
  requestAnimationFrame(() => {
    ctx.editor.commands.setTextSelection(range)
    ctx.editor.view.focus()
  })
}

function handleSuggestionAccept(finding) {
  const block = authorizedFindingBlock(finding)
  const applied = block
    ? replaceFindingTarget(ctx.editor, finding.target, finding.action, finding.blockId)
    : false
  if (!applied) {
    showLocalFeedbackError(finding.id)
    return
  }
  decideAndAdvance(finding, { kind: 'accept', appliedText: finding.action })
}

function completeOwnVersion(expectedFindingId) {
  const doc = ctx.activeDoc()
  const workspace = activeWorkspace()
  const editing = workspace?.editingFinding
  if (!doc || !editing || editing.findingId !== expectedFindingId) return

  const finding = doc.findings.find(candidate => candidate.id === editing.findingId)
  if (!finding || finding.status !== 'open') return
  const completion = completeEditingFinding(editing, getEditorBlocks(ctx.editor))
  if (completion.kind !== 'accept') return

  workspace.editingFinding = null
  decideAndAdvance(finding, { kind: 'accept', appliedText: completion.appliedText })
}

function cancelOwnVersion(expectedFindingId) {
  const workspace = activeWorkspace()
  const editing = workspace?.editingFinding
  if (!editing || editing.findingId !== expectedFindingId) return
  workspace.editingFinding = null
  localFeedbackError = null
  ctx.scheduleSave()
  refreshWorkspace()
  ctx.editor.view.focus()
}

function renderOwnVersionStatus(finding, blocks) {
  const workspace = activeWorkspace()
  const editing = workspace?.editingFinding
  if (!editing || editing.findingId !== finding.id) return null

  const completion = completeEditingFinding(editing, blocks)
  const status = createNode('section', 'own-version-status')
  status.setAttribute('aria-label', 'Eigene Fassung in Arbeit')
  status.append(createNode('strong', 'own-version-title', 'Eigene Fassung in Arbeit'))
  const message = completion.kind === 'accept'
    ? 'Deine Änderung bleibt offen, bis du sie bewusst abschließt.'
    : completion.kind === 'unchanged'
      ? 'Noch keine Änderung. Der Abschluss wird erst danach verfügbar.'
      : 'Die Textstelle hat sich weiter verändert. Bitte prüfe sie vor dem Abschluss.'
  status.append(createNode('p', 'own-version-message', message))

  const actions = createNode('div', 'own-version-actions')
  const cancel = findingActionButton(
    'Eigene Fassung abbrechen',
    '×',
    () => cancelOwnVersion(finding.id),
  )
  const complete = findingActionButton(
    'Eigene Fassung abschliessen',
    '✓',
    () => completeOwnVersion(finding.id),
  )
  complete.disabled = completion.kind !== 'accept'
  actions.append(cancel, complete)
  status.append(actions)
  return status
}

function renderIntegrityRiskConfirmation(finding) {
  const workspace = activeWorkspace()
  if (workspace?.riskConfirmationFindingId !== finding.id) return null

  const confirmation = createNode('section', 'integrity-risk-confirmation')
  confirmation.setAttribute('aria-label', 'Wissenschaftliches Risiko bewusst annehmen')
  confirmation.append(
    createNode('strong', 'integrity-risk-title', 'Wissenschaftliches Risiko bewusst annehmen'),
    createNode('p', 'integrity-risk-consequence', findingConsequence(finding)),
  )
  const label = createNode('label', 'integrity-risk-reason-label', 'Begründung (optional)')
  const reason = createNode('textarea', 'integrity-risk-reason')
  reason.rows = 2
  reason.value = workspace.riskReason || ''
  reason.setAttribute('aria-label', 'Begründung für die bewusste Risikoannahme')
  reason.addEventListener('input', () => {
    workspace.riskReason = reason.value
    persistWorkspace()
  })
  label.append(reason)

  const actions = createNode('div', 'integrity-risk-actions')
  const cancel = createNode('button', 'integrity-risk-cancel', 'Abbrechen')
  cancel.type = 'button'
  cancel.addEventListener('click', () => {
    workspace.riskConfirmationFindingId = null
    workspace.riskReason = ''
    requestLocalSummaryFocus(finding.id)
    refreshWorkspace()
    persistWorkspace()
  })
  const confirm = createNode('button', 'integrity-risk-confirm', 'Wissenschaftliches Risiko bewusst annehmen')
  confirm.type = 'button'
  confirm.addEventListener('click', () => {
    decideAndAdvance(finding, { kind: 'reject', reason: workspace.riskReason.trim() })
  })
  actions.append(cancel, confirm)
  confirmation.append(label, actions)

  if (riskConfirmationFocusRequest) {
    riskConfirmationFocusRequest = false
    requestAnimationFrame(() => reason.focus({ preventScroll: true }))
  }
  return confirmation
}

function renderSuggestion(finding, blockId) {
  const workspace = activeWorkspace()
  if (!finding?.action || workspace?.suggestionFindingId !== finding.id) return null

  const suggestion = createNode('section', 'local-suggestion')
  suggestion.id = localSurfaceIds(finding.id).suggestion
  suggestion.dataset.blockId = blockId
  suggestion.setAttribute('aria-label', 'Alternative Fassung')

  const parts = changedWordParts(finding.target, finding.action)
  const versions = createNode('div', 'suggestion-versions')
  appendSuggestionVersion(versions, 'Bisher', parts.prefix, parts.oldChanged, parts.suffix, 'suggestion-old-change')
  appendSuggestionVersion(versions, 'Neue Fassung', parts.prefix, parts.newChanged, parts.suffix, 'suggestion-new-change')

  const actions = createNode('div', 'suggestion-actions')
  actions.append(
    findingActionButton('Verwerfen', '×', () => handleSuggestionReject(finding)),
    findingActionButton('Eigene Fassung schreiben', '✎', () => handleSuggestionOwnVersion(finding)),
    findingActionButton('Übernehmen', '✓', () => handleSuggestionAccept(finding)),
  )
  suggestion.append(versions, actions)
  const riskConfirmation = renderIntegrityRiskConfirmation(finding)
  if (riskConfirmation) suggestion.append(riskConfirmation)

  if (localFeedbackError?.findingId === finding.id) {
    const error = createNode('p', 'local-finding-error', localFeedbackError.message)
    error.setAttribute('role', 'status')
    suggestion.append(error)
  }
  return suggestion
}

function scheduleLocalPosition(blockId) {
  if (localPositionFrame) cancelAnimationFrame(localPositionFrame)
  queueMicrotask(() => {
    if (localDecoratedBlockId === blockId) positionLocalSurface(blockId)
  })
  localPositionFrame = requestAnimationFrame(() => {
    positionLocalSurface(blockId)
    localPositionFrame = requestAnimationFrame(() => {
      localPositionFrame = null
      positionLocalSurface(blockId)
    })
  })
}

function positionLocalSurface(blockId) {
  if (!ctx || !controller) return
  const ui = elements()
  const block = blockElement(blockId)
  const selectorId = escapedSelectorValue(blockId)
  const local = ui.localLayer?.querySelector(`.local-finding[data-block-id="${selectorId}"]`)
  const suggestion = ui.localLayer?.querySelector(`.local-suggestion[data-block-id="${selectorId}"]`)
  if (!ui.localLayer || !block || !local) {
    setLocalFindingDecoration(blockId, 0)
    return
  }

  const layerRect = ui.localLayer.getBoundingClientRect()
  const blockRect = block.getBoundingClientRect()
  const scrollRect = ui.scroll?.getBoundingClientRect()
  if (layerRect.width <= 0 || blockRect.width <= 0) return
  const gutter = 16
  const sideWidth = 244
  const availableRight = layerRect.right - blockRect.right
  const below = window.matchMedia('(max-width: 900px)').matches || availableRight < sideWidth + 48
  const localWidth = below
    ? Math.max(0, Math.min(blockRect.width, layerRect.width - gutter * 2))
    : Math.min(sideWidth, availableRight - 42)

  local.classList.toggle('is-below', below)
  local.style.width = `${localWidth}px`
  local.style.left = `${below ? Math.max(gutter, blockRect.left - layerRect.left) : blockRect.right - layerRect.left + 34}px`
  local.style.top = `${below ? blockRect.bottom - layerRect.top + 14 : blockRect.top - layerRect.top}px`
  local.hidden = Boolean(scrollRect && (blockRect.bottom < scrollRect.top || blockRect.top > scrollRect.bottom))

  const localRect = local.getBoundingClientRect()
  let feedbackBottom = below ? localRect.bottom : blockRect.bottom
  if (suggestion) {
    suggestion.style.width = `${Math.min(blockRect.width, layerRect.width - gutter * 2)}px`
    suggestion.style.left = `${Math.max(gutter, blockRect.left - layerRect.left)}px`
    suggestion.style.top = `${blockRect.bottom - layerRect.top + (below ? localRect.height + 28 : 14)}px`
    const suggestionRect = suggestion.getBoundingClientRect()
    feedbackBottom = Math.max(feedbackBottom, suggestionRect.bottom)
  }

  const touchTriggerClearance = Math.max(46, (insertTrigger?.getBoundingClientRect().height || 26) + 8)
  const spacing = feedbackBottom > blockRect.bottom
    ? feedbackBottom - blockRect.bottom + (below ? touchTriggerClearance : 14)
    : 0
  const maxSpacing = suggestion ? MAX_LOCAL_SUGGESTION_SPACING : MAX_LOCAL_FEEDBACK_SPACING
  setLocalFindingDecoration(blockId, Math.min(maxSpacing, spacing))
}

function renderLocalFinding() {
  const ui = elements()
  const doc = ctx.activeDoc()
  const workspace = activeWorkspace()
  if (!ui.localLayer || !doc || !workspace) return
  const previousLocal = ui.localLayer.querySelector('.local-finding')
  const previousFindingId = previousLocal?.dataset.findingId || null
  const inputState = captureInputState(ui.localLayer, '.local-dialogue input')

  const blocks = getEditorBlocks(ctx.editor)
  const resolution = currentPassageFinding(doc, blocks)
  const finding = resolution.finding
  const blockId = resolution.block?.id || null
  const isStale = resolution.placementKind === 'stale'
  if (resolution.migrated) ctx.scheduleSave()

  if (workspace.expandedFindingId && workspace.expandedFindingId !== finding?.id) workspace.expandedFindingId = null
  if (workspace.suggestionFindingId && workspace.suggestionFindingId !== finding?.id) workspace.suggestionFindingId = null
  if (workspace.localThreadFindingId && workspace.localThreadFindingId !== finding?.id) workspace.localThreadFindingId = null
  if (localFeedbackError && localFeedbackError.findingId !== finding?.id) localFeedbackError = null

  if (
    localDecoratedDocId !== doc.id
    || localDecoratedFindingId !== finding?.id
    || localDecoratedBlockId !== blockId
  ) {
    localDecoratedDocId = doc.id
    localDecoratedFindingId = finding?.id || null
    setLocalFindingDecoration(blockId, 0, true)
  }

  ui.localLayer.replaceChildren()
  if (!finding || !blockId) return

  const expanded = workspace.expandedFindingId === finding.id
  const ids = localSurfaceIds(finding.id)
  const surface = createNode('article', `local-finding${expanded ? ' is-expanded' : ''}${isStale ? ' is-stale' : ''}`)
  surface.dataset.findingId = finding.id
  surface.dataset.blockId = blockId

  const connector = createNode('span', 'local-finding-connector')
  connector.setAttribute('aria-hidden', 'true')
  const summary = createNode('button', 'local-finding-summary')
  summary.id = ids.summary
  summary.type = 'button'
  summary.setAttribute('aria-expanded', String(expanded))
  const controls = []
  if (expanded) controls.push(ids.detail)
  if (workspace.suggestionFindingId === finding.id && !isStale) controls.push(ids.suggestion)
  if (workspace.localThreadFindingId === finding.id) controls.push(ids.dialogue)
  if (controls.length) summary.setAttribute('aria-controls', controls.join(' '))
  summary.append(
    createNode('span', 'local-finding-short', isStale ? 'Textstelle verändert' : finding.short),
    createNode('span', 'local-finding-disclosure', expanded ? '↘' : '›'),
  )
  summary.addEventListener('click', () => {
    const isExpanded = workspace.expandedFindingId === finding.id
    const isSuggestionOpen = workspace.suggestionFindingId === finding.id
    if (!isExpanded) {
      workspace.expandedFindingId = finding.id
      workspace.suggestionFindingId = null
      workspace.localThreadFindingId = null
    } else if (isSuggestionOpen) {
      workspace.suggestionFindingId = null
    } else if (finding.action && !isStale) {
      workspace.suggestionFindingId = finding.id
      workspace.localThreadFindingId = null
    } else if (finding.sources?.length) {
      workspace.evidenceFindingId = finding.id
      evidenceReturnFindingId = finding.id
      evidenceFocusRequest = true
    } else {
      ensureLocalThread(finding)
      workspace.localThreadFindingId = finding.id
    }
    localFeedbackError = null
    requestLocalSummaryFocus(finding.id)
    ctx.scheduleSave()
    refreshWorkspace()
  })
  surface.append(connector, summary)

  if (expanded) {
    const detail = createNode('div', 'local-finding-detail')
    detail.id = ids.detail
    appendDetailRow(detail, 'Beobachtung', finding.short)
    if (isStale) appendDetailRow(detail, 'Anker', 'Der frühere Wortlaut ist an diesem Abschnitt nicht mehr vorhanden. Der Hinweis bleibt offen.')
    appendDetailRow(detail, 'Relevanz', finding.why || finding.gesamt || 'Die Stelle beeinflusst, wie klar die Aussage beim Lesen ankommt.')
    appendDetailRow(detail, 'Folge', findingConsequence(finding))
    surface.append(detail)
  }
  const dialogue = renderLocalDialogue(finding)
  if (dialogue) surface.append(dialogue)
  const ownVersion = renderOwnVersionStatus(finding, blocks)
  if (ownVersion) surface.append(ownVersion)

  ui.localLayer.append(surface)
  const suggestion = isStale ? null : renderSuggestion(finding, blockId)
  if (suggestion) ui.localLayer.append(suggestion)
  if (ui.localLayer.classList.contains('is-paused')) {
    setLocalFindingDecoration(blockId, 0)
    return
  }
  positionLocalSurface(blockId)
  scheduleLocalPosition(blockId)
  if (localSummaryFocusRequest === finding.id) {
    localSummaryFocusRequest = null
    summary.focus()
  } else if (previousFindingId === finding.id && inputState) {
    restoreInputState(surface.querySelector('.local-dialogue input'), inputState)
  }
  scrollThreadToLatest(surface.querySelector('.local-dialogue-messages'))
}

function activeAgentMessage(workspace) {
  const messages = workspace.agent.messages
  const selected = messages.find(message => message.id === workspace.agent.activeMessageId)
  const message = selected
    || messages.find(candidate => candidate.status === 'new' && !workspace.agent.dismissedIds.includes(candidate.id))
    || messages[messages.length - 1]
    || null
  if (message) workspace.agent.activeMessageId = message.id
  return message
}

function closeAgentWidget({ dismiss = true, restoreFocus = true } = {}) {
  const workspace = activeWorkspace()
  if (!workspace?.agent.open) return false
  const message = activeAgentMessage(workspace)
  if (dismiss && message) dismissAgentMessage(workspace, message.id)
  else workspace.agent.open = false
  if (restoreFocus) agentPresenceFocusRequest = true
  refreshWorkspace()
  persistWorkspace()
  return true
}

function renderUnplacedFindingList() {
  const doc = ctx?.activeDoc()
  if (!doc) return null
  const items = unplacedPassageFindings(doc, getEditorBlocks(ctx.editor))
  if (!items.length) return null

  const section = createNode('section', 'unplaced-findings')
  section.append(createNode('strong', 'unplaced-findings-title', 'Hinweise ohne sichere Textstelle'))
  items.forEach(({ finding, placement }) => {
    const item = createNode('article', 'unplaced-finding')
    item.dataset.findingId = finding.id
    item.append(
      createNode('span', 'unplaced-finding-kind', placement.kind === 'ambiguous' ? 'Mehrere mögliche Stellen' : 'Textstelle nicht auffindbar'),
      createNode('p', 'unplaced-finding-text', finding.short),
    )
    section.append(item)
  })
  return section
}

function renderAgentWidget() {
  const ui = elements()
  const workspace = activeWorkspace()
  if (!ui.agentWidget || !workspace) return
  const inputState = captureInputState(ui.agentWidget, '.agent-chat-input')
  ui.agentWidget.replaceChildren()
  if (!workspace.agent.open) {
    if (agentPresenceFocusRequest) {
      agentPresenceFocusRequest = false
      ui.agentPresence?.focus({ preventScroll: true })
    }
    return
  }

  const message = activeAgentMessage(workspace)
  const header = createNode('header', 'agent-widget-header')
  header.append(
    createNode('strong', 'agent-widget-title', 'Agent'),
  )
  const close = createNode('button', 'surface-close', '×')
  close.type = 'button'
  close.dataset.closeAgent = ''
  close.title = 'Gespräch schließen'
  close.setAttribute('aria-label', 'Agentengespräch schließen')
  close.addEventListener('click', () => closeAgentWidget())
  header.append(close)
  ui.agentWidget.append(header)

  const unplaced = renderUnplacedFindingList()
  if (unplaced) ui.agentWidget.append(unplaced)

  if (!message) {
    ui.agentWidget.append(createNode('p', 'agent-widget-empty', 'Noch kein allgemeines Gespräch.'))
    return
  }

  if (!Array.isArray(message.thread)) message.thread = []
  if (!message.thread.length && message.text) {
    appendThreadMessage(message.thread, 'agent', message.text, message.earliestAt || 0)
  }
  const messages = createNode('div', 'agent-widget-messages')
  message.thread.forEach(entry => appendThreadMessageNode(messages, entry))

  const form = createNode('form', 'agent-chat-form agent-widget-form')
  const input = createNode('input', 'agent-chat-input')
  input.type = 'text'
  input.placeholder = 'Antworten …'
  input.setAttribute('aria-label', 'Dem Agenten antworten')
  const send = createNode('button', 'agent-chat-send', '→')
  send.type = 'submit'
  send.title = 'Senden'
  send.setAttribute('aria-label', 'Nachricht senden')
  form.append(input, send)
  form.addEventListener('submit', event => {
    event.preventDefault()
    const text = input.value.trim()
    if (!text) return
    const at = Date.now()
    appendThreadMessage(message.thread, 'user', text, at)
    const reply = 'Beispielreaktion: Dann behandle ich Aufmerksamkeit im weiteren Text als gestaltete Bedingung und prüfe, wo die Formulierung noch beim Individuum bleibt.'
    appendThreadMessage(
      message.thread,
      'agent',
      reply,
      at + 1,
    )
    input.value = ''
    announceAgentStatus(reply)
    ctx.persist()
    refreshWorkspace()
  })
  ui.agentWidget.append(messages, form)
  restoreInputState(input, inputState)
  scrollThreadToLatest(messages)
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ''))
    return url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

function openSecureExternal(url) {
  const safeUrl = safeHttpsUrl(url)
  if (!safeUrl) return
  if (ctx.state.native && window.webkit?.messageHandlers?.openurl) {
    window.webkit.messageHandlers.openurl.postMessage(safeUrl)
  } else {
    window.open(safeUrl, '_blank', 'noopener,noreferrer')
  }
}

async function copyCitation(citation, verificationStatus) {
  if (!citation) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(citation)
    } else {
      const field = document.createElement('textarea')
      field.value = citation
      field.setAttribute('readonly', '')
      field.className = 'visually-hidden'
      document.body.append(field)
      field.select()
      document.execCommand('copy')
      field.remove()
    }
    if (verificationStatus === 'verified') {
      announceAgentStatus('Verifizierte Angabe kopiert.')
    } else if (verificationStatus === 'demo') {
      announceAgentStatus('Demo-Angabe kopiert. Vor Verwendung prüfen.')
    } else {
      announceAgentStatus('Ungeprüfte Angabe kopiert. Vor Verwendung prüfen.')
    }
  } catch {
    announceAgentStatus('Die Angabe konnte nicht kopiert werden.')
  }
}

function verificationLabel(status) {
  if (status === 'verified') return 'Verifiziert'
  if (status === 'demo') return 'Demoquelle - nicht live verifiziert'
  return 'Nicht verifiziert'
}

function closeEvidenceWindow({ restoreFocus = true } = {}) {
  const workspace = activeWorkspace()
  if (!workspace?.evidenceFindingId) return false
  workspace.evidenceFindingId = null
  if (restoreFocus && evidenceReturnFindingId) requestLocalSummaryFocus(evidenceReturnFindingId)
  evidenceReturnFindingId = null
  evidenceFocusRequest = false
  refreshWorkspace()
  persistWorkspace()
  return true
}

function appendEvidenceNote(parent, label, value) {
  const values = Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean)
  if (!values.length) return
  const section = createNode('div', 'evidence-source-note')
  section.append(
    createNode('span', 'evidence-source-note-label', label),
    createNode('p', 'evidence-source-note-text', values.join(' ')),
  )
  parent.append(section)
}

function renderEvidenceWindow() {
  const ui = elements()
  const workspace = activeWorkspace()
  const doc = ctx?.activeDoc()
  if (!ui.evidenceWindow || !workspace || !doc) return
  ui.evidenceWindow.replaceChildren()
  if (!workspace.evidenceFindingId) return

  const finding = doc.findings.find(candidate => candidate.id === workspace.evidenceFindingId)
  const header = createNode('header', 'evidence-header')
  header.append(createNode('strong', 'evidence-title', 'Quellen im Kontext'))
  const close = createNode('button', 'surface-close', '×')
  close.type = 'button'
  close.dataset.closeEvidence = ''
  close.title = 'Quellen schließen'
  close.setAttribute('aria-label', 'Quellen schließen')
  close.addEventListener('click', () => closeEvidenceWindow())
  header.append(close)
  ui.evidenceWindow.append(header)

  if (!finding) {
    ui.evidenceWindow.append(createNode('p', 'evidence-empty', 'Die zugehörige Fundstelle ist nicht mehr verfügbar.'))
    return
  }

  const exactClaim = typeof finding.claim === 'string' ? finding.claim.trim() : ''
  const claimSection = createNode('section', 'evidence-context')
  claimSection.append(
    createNode('span', 'evidence-kicker', exactClaim ? 'Zu belegende Aussage' : 'Unvollständiger Belegkontext'),
    createNode(
      'p',
      exactClaim ? 'evidence-claim' : 'evidence-claim evidence-claim-missing',
      exactClaim || 'Zu belegende Aussage noch nicht erfasst',
    ),
  )
  ui.evidenceWindow.append(claimSection)

  const sources = createNode('div', 'evidence-sources')
  ;(finding.sources || []).forEach(source => {
    const sourceUrl = safeHttpsUrl(source.url)
    const verificationStatus = ['demo', 'unverified', 'verified'].includes(source.verificationStatus)
      ? source.verificationStatus
      : 'unverified'
    const item = createNode('article', 'evidence-source')
    const meta = createNode('div', 'evidence-source-meta')
    meta.append(
      createNode('strong', 'evidence-source-label', source.label || 'Quelle'),
      createNode('span', 'evidence-source-type', source.type || 'Quelle'),
      createNode('span', `evidence-source-verification is-${verificationStatus}`, verificationLabel(verificationStatus)),
    )
    item.append(meta)
    const sourceContent = typeof source.content === 'string' && source.content.trim()
      ? source.content
      : (typeof source.preview === 'string' ? source.preview : '')
    const contentType = ['original-excerpt', 'excerpt', 'summary'].includes(source.contentType)
      ? source.contentType
      : 'summary'
    if (sourceContent) {
      item.append(
        createNode('span', 'evidence-excerpt-label', contentType === 'summary' ? 'Zusammenfassung' : 'Auszug'),
        createNode('p', 'evidence-source-preview', sourceContent),
      )
    }
    appendEvidenceNote(item, 'Einordnung', source.context || source.interpretation)
    appendEvidenceNote(item, 'Grenzen / Gegenbelege', source.limits || source.counterEvidence)
    appendEvidenceNote(item, 'Fundstelle', source.locator)
    if (typeof source.citation === 'string' && source.citation.trim()) {
      const citation = createNode('div', 'evidence-citation')
      citation.append(createNode('p', 'evidence-source-citation', source.citation))
      const copy = createNode('button', 'evidence-copy', verificationStatus === 'demo' ? 'Demo-Angabe kopieren' : 'Angabe kopieren')
      copy.type = 'button'
      copy.dataset.copyCitation = ''
      copy.disabled = !exactClaim
      if (exactClaim) {
        copy.addEventListener('click', () => copyCitation(source.citation, verificationStatus))
      } else {
        copy.title = 'Erst verfügbar, wenn die zu belegende Aussage erfasst ist'
      }
      citation.append(copy)
      item.append(citation)
    }
    if (sourceUrl) {
      const link = createNode('a', 'evidence-source-link', 'Original öffnen ↗')
      link.href = sourceUrl
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      if (ctx.state.native) {
        link.addEventListener('click', event => {
          event.preventDefault()
          openSecureExternal(sourceUrl)
        })
      }
      item.append(link)
    }
    sources.append(item)
  })
  if (!sources.children.length) {
    sources.append(createNode('p', 'evidence-empty', 'Für diese Aussage ist noch keine sichere direkte Quelle hinterlegt.'))
  }
  ui.evidenceWindow.append(sources)
  if (evidenceFocusRequest) {
    evidenceFocusRequest = false
    requestAnimationFrame(() => close.focus({ preventScroll: true }))
  }
}

function nextAgentInitiative(workspace) {
  return workspace.agent.messages.find(message => (
    message.status === 'new'
    && !workspace.agent.dismissedIds.includes(message.id)
  )) || null
}

function agentInitiativeBlocked(workspace) {
  return Boolean(
    isComposing
    || workspace.shelfOpen
    || workspace.evidenceFindingId
    || hasLocalDepth(workspace)
    || insertMenu,
  )
}

function editorViewIsVisibleFor(documentId) {
  return Boolean(
    documentId
    && ctx?.activeDoc()?.id === documentId
    && document.body.classList.contains('view-editor')
    && document.visibilityState === 'visible',
  )
}

function activateInitiativeDocument(documentId) {
  if (!controller || controller.activeDocumentId === documentId) return
  clearAgentInitiativeTimer()
  pendingParagraphBoundaryDocId = null
  controller.activeDocumentId = documentId || null
  if (documentId) {
    controller.inputByDocument.set(documentId, {
      generation: 0,
      lastInputAt: Number.NaN,
      boundaryAt: Number.NaN,
      boundaryGeneration: null,
      pendingUpdateGeneration: null,
      pendingBoundary: false,
    })
  }
}

function scheduleAgentInitiative() {
  clearAgentInitiativeTimer()
  const docId = ctx?.activeDoc()?.id || null
  activateInitiativeDocument(docId)
  const workspace = activeWorkspace()
  const message = workspace ? nextAgentInitiative(workspace) : null
  const inputState = initiativeInputState(docId)
  if (
    !workspace
    || !message
    || workspace.agent.open
    || !controller
    || !inputState
    || !Number.isFinite(inputState.lastInputAt)
    || !editorViewIsVisibleFor(docId)
    || isComposing
  ) return

  const now = Date.now()
  const idleRemaining = AGENT_IDLE_MS - (now - inputState.lastInputAt)
  const boundaryRemaining = inputState.boundaryGeneration === inputState.generation
    && Number.isFinite(inputState.boundaryAt)
    ? AGENT_BOUNDARY_IDLE_MS - (now - inputState.boundaryAt)
    : Number.POSITIVE_INFINITY
  const earliestRemaining = (message.earliestAt || 0) - now
  const delay = Math.max(24, Math.min(idleRemaining, boundaryRemaining), earliestRemaining)
  const scheduledGeneration = inputState.generation
  const scheduledMessageId = message.id
  agentInitiativeTimer = setTimeout(() => {
    agentInitiativeTimer = null
    if (!controller || controller.activeDocumentId !== docId || !editorViewIsVisibleFor(docId)) return
    const currentInputState = initiativeInputState(docId)
    if (!currentInputState || currentInputState.generation !== scheduledGeneration) return
    const currentWorkspace = activeWorkspace()
    const currentMessage = currentWorkspace ? nextAgentInitiative(currentWorkspace) : null
    if (!currentWorkspace || !currentMessage || currentMessage.id !== scheduledMessageId) return
    if (agentInitiativeBlocked(currentWorkspace)) {
      agentInitiativeTimer = setTimeout(() => {
        agentInitiativeTimer = null
        scheduleAgentInitiative()
      }, 400)
      return
    }
    if (!shouldOpenAgentWidget({
      now: Date.now(),
      lastInputAt: currentInputState.lastInputAt,
      boundaryAt: currentInputState.boundaryAt,
      boundaryGeneration: currentInputState.boundaryGeneration,
      inputGeneration: currentInputState.generation,
      message: currentMessage,
      dismissedIds: currentWorkspace.agent.dismissedIds,
      documentId: docId,
      activeDocumentId: ctx.activeDoc()?.id,
      isEditorView: document.body.classList.contains('view-editor'),
      visibilityState: document.visibilityState,
      isComposing,
    })) {
      scheduleAgentInitiative()
      return
    }
    currentWorkspace.agent.activeMessageId = currentMessage.id
    currentWorkspace.agent.open = true
    announceAgentStatus(currentMessage.text)
    refreshWorkspace()
    persistWorkspace()
  }, delay)
}

export function refreshWorkspace({ reconcileEditing = false } = {}) {
  if (!ctx) return
  const doc = ctx.activeDoc()
  const workspace = activeWorkspace()
  if (!doc || !workspace) return
  if (reconcileEditing) reconcilePersistedEditingFinding()
  enforceExclusiveLayers(workspace)

  const project = ctx.activeProjectObj()
  const ui = elements()
  const liveTitle = document.getElementById('title')?.value.trim()
  const documentTitle = liveTitle || ctx.docTitle(doc)
  if (ui.path) ui.path.textContent = `${project?.name || 'Projekt'} / ${documentTitle}`

  setLayerVisibility(ui.shelf, workspace.shelfOpen)
  ui.body?.classList.toggle('is-shelf-open', workspace.shelfOpen)
  ui.body?.classList.toggle('is-agent-open', workspace.agent.open)
  ui.body?.classList.toggle('is-evidence-open', Boolean(workspace.evidenceFindingId))
  ui.path?.setAttribute('aria-expanded', String(workspace.shelfOpen))

  setLayerVisibility(ui.agentWidget, workspace.agent.open)
  ui.agentPresence?.setAttribute('aria-expanded', String(workspace.agent.open))
  setLayerVisibility(ui.evidenceWindow, Boolean(workspace.evidenceFindingId))
  const localPaused = Boolean(workspace.shelfOpen || workspace.agent.open || workspace.evidenceFindingId)
  ui.localLayer?.classList.toggle('is-paused', localPaused)
  ui.localLayer?.setAttribute('aria-hidden', String(localPaused))

  const activeBlockId = syncActiveBlock(workspace)
  if (decoratedDocId !== doc.id || decoratedBlockId !== activeBlockId) {
    decoratedDocId = doc.id
    decoratedBlockId = activeBlockId
    ctx.editor.view.dispatch(ctx.editor.state.tr.setMeta(activeBlockKey, activeBlockId))
  }

  renderStructureShelf()
  renderLocalFinding()
  renderAgentWidget()
  renderEvidenceWindow()
  scheduleTriggerRender()
  scheduleAgentInitiative()
}

export function initWorkspace(context) {
  controller?.destroy()
  lastContext = context
  ctx = context
  ctx.editor.registerPlugin(activeBlockPlugin())
  ctx.editor.registerPlugin(localFindingPlugin())
  const ui = elements()
  const cleanups = []

  const listen = (target, type, handler, options) => {
    if (!target) return
    target.addEventListener(type, handler, options)
    cleanups.push(() => target.removeEventListener(type, handler, options))
  }

  const listenEditor = (type, handler) => {
    ctx.editor.on(type, handler)
    cleanups.push(() => ctx?.editor?.off(type, handler))
  }

  const openShelf = () => {
    const workspace = activeWorkspace()
    if (!workspace) return
    const changed = !workspace.shelfOpen
      || workspace.agent.open
      || Boolean(workspace.evidenceFindingId)
      || hasLocalDepth(workspace)
    workspace.shelfOpen = true
    workspace.agent.open = false
    workspace.evidenceFindingId = null
    closeLocalDepth(workspace)
    if (!changed) return
    closeInsertMenu({ restoreFocus: false })
    refreshWorkspace()
    persistWorkspace()
  }

  const closeShelf = () => {
    const workspace = activeWorkspace()
    if (!workspace || !workspace.shelfOpen) return false
    workspace.shelfOpen = false
    closeInsertMenu({ restoreFocus: false })
    refreshWorkspace()
    persistWorkspace()
    return true
  }

  const closeTopLayer = () => {
    const workspace = activeWorkspace()
    if (!workspace) return false
    let restoreShelfFocus = false
    if (workspace.suggestionFindingId) {
      const findingId = workspace.suggestionFindingId
      workspace.suggestionFindingId = null
      requestLocalSummaryFocus(findingId)
    } else if (workspace.expandedFindingId) {
      const findingId = workspace.expandedFindingId
      workspace.expandedFindingId = null
      workspace.suggestionFindingId = null
      workspace.localThreadFindingId = null
      requestLocalSummaryFocus(findingId)
    } else if (closeInsertMenu()) {
      return true
    } else if (workspace.evidenceFindingId) {
      return closeEvidenceWindow()
    } else if (workspace.agent.open) {
      const message = activeAgentMessage(workspace)
      if (message) dismissAgentMessage(workspace, message.id)
      else workspace.agent.open = false
      agentPresenceFocusRequest = true
    } else if (workspace.shelfOpen) {
      restoreShelfFocus = Boolean(ui.shelf?.contains(document.activeElement))
      workspace.shelfOpen = false
    } else {
      return false
    }
    refreshWorkspace()
    if (restoreShelfFocus) ui.path?.focus({ preventScroll: true })
    persistWorkspace()
    return true
  }

  const instance = {
    activeDocumentId: null,
    inputByDocument: new Map(),
    destroyed: false,
    openShelf,
    closeShelf,
    closeTopLayer,
    invalidateInitiative(options) {
      invalidateAgentInitiative(options)
    },
    snapshot() {
      const state = initiativeInputState(instance.activeDocumentId)
      return {
        activeDocumentId: instance.activeDocumentId,
        inputGeneration: state?.generation || 0,
        lastInputAt: state?.lastInputAt ?? Number.NaN,
        boundaryAt: state?.boundaryAt ?? Number.NaN,
        boundaryGeneration: state?.boundaryGeneration ?? null,
      }
    },
  }
  controller = instance
  activateInitiativeDocument(ctx.activeDoc()?.id || null)

  const onBack = () => {
    invalidateAgentInitiative({ requireNewInput: true })
    ctx.flushSave()
    ctx.showHomeView()
  }
  const onPath = () => {
    if (!closeShelf()) openShelf()
  }
  const onAgentPresence = () => {
    const workspace = activeWorkspace()
    if (!workspace) return
    const opening = !workspace.agent.open
    if (!opening) {
      closeAgentWidget()
      return
    }
    workspace.agent.open = true
    activeAgentMessage(workspace)
    workspace.shelfOpen = false
    workspace.evidenceFindingId = null
    closeLocalDepth(workspace)
    closeInsertMenu({ restoreFocus: false })
    refreshWorkspace()
    persistWorkspace()
  }

  const onPointerOver = event => {
    const block = event.target.closest('[data-block-id]')
    const activeBlockId = activeWorkspace()?.activeBlockId
    if (!block || block.dataset.blockId !== activeBlockId) return
    clearTimeout(hoverTimer)
    hoveredBlockId = activeBlockId
    renderInsertTrigger()
  }
  const onPointerOut = event => {
    const block = event.target.closest('[data-block-id]')
    if (!block || block.dataset.blockId !== hoveredBlockId) return
    if (block.contains(event.relatedTarget) || insertTrigger?.contains(event.relatedTarget)) return
    scheduleHoverClear()
  }
  const onEditorScroll = () => {
    closeInsertMenu({ restoreFocus: false })
    scheduleTriggerRender()
    if (localDecoratedBlockId) scheduleLocalPosition(localDecoratedBlockId)
  }
  const onShelfScroll = () => {
    closeInsertMenu({ restoreFocus: false })
  }
  const onResize = () => {
    closeInsertMenu({ restoreFocus: false })
    scheduleTriggerRender()
    if (localDecoratedBlockId) scheduleLocalPosition(localDecoratedBlockId)
  }
  const onViewChange = event => {
    if (event.detail?.view !== 'editor') {
      invalidateAgentInitiative({ requireNewInput: true })
      return
    }
    activateInitiativeDocument(ctx.activeDoc()?.id || null)
    scheduleAgentInitiative()
  }
  const onVisibilityChange = () => {
    if (document.visibilityState !== 'visible') {
      invalidateAgentInitiative({ requireNewInput: true })
      return
    }
    scheduleAgentInitiative()
  }

  const onSelectionUpdate = () => {
    const workspace = activeWorkspace()
    const activeBlockId = getActiveBlockId(ctx.editor)
    if (!workspace || !activeBlockId || workspace.activeBlockId === activeBlockId) {
      refreshWorkspace()
      return
    }
    workspace.activeBlockId = activeBlockId
    hoveredBlockId = null
    refreshWorkspace()
    persistWorkspace()
  }
  const onEditorUpdate = () => {
    completeRealEditorUpdate()
    reconcilePersistedEditingFinding()
    refreshWorkspace()
  }

  listen(ui.back, 'click', onBack)
  listen(ui.path, 'click', onPath)
  listen(ui.agentPresence, 'click', onAgentPresence)
  listen(ctx.editor.view.dom, 'pointerover', onPointerOver)
  listen(ctx.editor.view.dom, 'pointerout', onPointerOut)
  listen(ctx.editor.view.dom, 'keydown', handleEditorKeyDown, true)
  listen(ctx.editor.view.dom, 'beforeinput', handleBeforeInput)
  listen(ctx.editor.view.dom, 'compositionstart', startComposition)
  listen(ctx.editor.view.dom, 'compositionend', endComposition)
  listen(ui.scroll, 'scroll', onEditorScroll, { passive: true })
  listen(ui.shelf, 'scroll', onShelfScroll, { passive: true })
  listen(window, 'resize', onResize)
  listen(document, 'aiwt:viewchange', onViewChange)
  listen(document, 'visibilitychange', onVisibilityChange)
  listen(document.getElementById('title'), 'input', refreshWorkspace)
  listenEditor('selectionUpdate', onSelectionUpdate)
  listenEditor('update', onEditorUpdate)

  instance.destroy = () => {
    if (instance.destroyed) return
    instance.destroyed = true
    clearAgentInitiativeTimer()
    closeInsertMenu({ restoreFocus: false })
    cleanups.splice(0).reverse().forEach(cleanup => cleanup())

    clearTimeout(hoverTimer)
    clearTimeout(typingTimer)
    if (triggerFrame) cancelAnimationFrame(triggerFrame)
    if (localPositionFrame) cancelAnimationFrame(localPositionFrame)
    if (agentLiveFrame) cancelAnimationFrame(agentLiveFrame)

    context.editor.unregisterPlugin(activeBlockKey)
    context.editor.unregisterPlugin(localFindingKey)
    insertTrigger?.remove()
    elements().localLayer?.replaceChildren()
    elements().agentWidget?.replaceChildren()
    elements().evidenceWindow?.replaceChildren()

    if (window.__workspaceCloseTopLayer === closeTopLayer) delete window.__workspaceCloseTopLayer
    if (controller === instance) controller = null
    if (ctx === context) ctx = null

    renderedDocId = null
    decoratedDocId = null
    decoratedBlockId = null
    insertTrigger = null
    hoveredBlockId = null
    hoverTimer = null
    typingTimer = null
    triggerFrame = null
    isTyping = false
    isComposing = false
    shelfRenderState = null
    localDecoratedDocId = null
    localDecoratedFindingId = null
    localDecoratedBlockId = null
    localDecoratedSpacing = 0
    localFeedbackError = null
    localPositionFrame = null
    localSummaryFocusRequest = null
    evidenceFocusRequest = false
    evidenceReturnFindingId = null
    riskConfirmationFocusRequest = false
    pendingParagraphBoundaryDocId = null
    agentLiveFrame = null
    agentPresenceFocusRequest = false
  }

  window.__workspaceCloseTopLayer = closeTopLayer
  refreshWorkspace({ reconcileEditing: true })
  return instance
}

export const __workspaceTestBridge = {
  destroy() {
    controller?.destroy()
  },
  reinitialize() {
    if (!lastContext) return null
    return initWorkspace(lastContext)
  },
  invalidateInitiative() {
    controller?.invalidateInitiative({ requireNewInput: true })
  },
  snapshot() {
    return controller?.snapshot() || {
      activeDocumentId: null,
      inputGeneration: 0,
      lastInputAt: Number.NaN,
      boundaryAt: Number.NaN,
      boundaryGeneration: null,
    }
  },
}
