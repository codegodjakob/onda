import { getActiveBlockId, getEditorBlocks, insertSemanticBlock, replaceAnchoredTexts, replaceFindingTarget } from './block-identity.js'
import { decideFinding, ensureProjectUnderstanding, ensureReasoningModel, getFindingQueue, isIntegrityCategory, istInterviewOffen, loeseSchutz, markiereEntwurfVersucht, markiereGeschuetzt, mergeVerstaendnis } from './reasoning-model.mjs'
import {
  appendThreadMessage,
  completeEditingFinding,
  createEditingFindingState,
  dismissAgentMessage,
  ensureWorkspaceState,
  hasUnseenInitiative,
  reconcileEditingFinding,
  resolveEvidenceSources,
  resolveFindingBlock,
  resolveFindingPlacement,
  shouldOpenAgentWidget,
  structureHintMap,
} from './workspace-model.mjs'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { applySettings } from './ui.js'
import { hatSchluessel, setzeSchluessel, loescheSchluessel, runTask } from './agent-gateway.mjs'
import { aktuellerAgentStatus, beiAgentStatus, setzeAgentStatus, statuszeileFuer } from './agent-status.mjs'
import { EXAMPLE_PROJECT_ID, seedBodySignature } from './example-seed.mjs'
import { MODELLE, TASK_TABLE } from './agent-tasks.mjs'
import { baueVerstaendnisKontext } from './verstaendnis-kontext.mjs'
import { ergaenzeOndaKontext } from './onda-kontext.mjs'
import { erkanntesListe, schreibeErkanntes, ueberholeErkanntes } from './erkanntes-model.mjs'
import {
  interviewNachrichtId,
  istBeispielProjekt,
  planeInterviewNachricht,
  projektZumDokument,
} from './verstaendnis-interview.mjs'
import { baueDocText } from './agent-findings.mjs'
import { pruefePausenAusloeser, versucheHinweislauf } from './hinweislauf-model.mjs'
import { bilanziereRueckmeldung } from './rueckkopplung-model.mjs'
import { darfAutomatischLaufen, versucheErweiterungslauf } from './erweiterungslauf-model.mjs'
import {
  ART_ERKLAERUNG,
  ART_LABEL,
  ensureErweiterungen,
  legeErweiterungWeg,
  merkeErweiterung,
  sichtbareErweiterungen,
} from './erweiterung-model.mjs'
import {
  AUFSCHAUEN_MS,
  INNEHALTEN_AN_GRENZE_MS,
  INNEHALTEN_MS,
  aktuellerMoment,
  artVon,
  darfErscheinen,
  istSatzende,
} from './momente-model.mjs'
import {
  baueChatKontext,
  baueFindingZusatzAnweisung,
  chatFehlerText,
  entscheidungsEintraege,
  erkenneHinweisBitte,
  fuehreChatVorgangAus,
  planVerlaufVerdichtung,
} from './chat-kontext.mjs'
import {
  beansprucheAutomatiklauf,
  budgetStand,
  gibNaechstenAutomatiklaufFrei,
} from './settings-model.mjs'
import { createSourceLibraryUi } from './source-library-ui.mjs'
import { createMemoryUi } from './memory-ui.mjs'
import { createArgumentUi } from './argument-ui.mjs'
import { createLanguageUi } from './language-ui.mjs'
import { analyzeArgumentImpact } from './argument-graph.mjs'
import { createAuditUi } from './audit-ui.mjs'

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
let structureNavState = null
let localDecoratedDocId = null
let localDecoratedFindingId = null
let localDecoratedBlockId = null
let localDecoratedSpacing = 0
let localFeedbackError = null
let localPositionFrame = null
let localSummaryFocusRequest = null
let agentInitiativeTimer = null
// Echter Hinweislauf (Etappe A, Spec §5): genau ein Lauf gleichzeitig; hinweislaufTimer ist
// der Zeitgeber-Griff fuer den Pausen-Ausloeser (planeHinweislauf/clearHinweislaufTimer, H-3).
let hinweislaufAktiv = false
let hinweislaufTimer = null
// Zweiter Kanal (Erweiterungen): eigene Sperre, damit ein Erweiterungslauf und ein
// Hinweislauf einander nicht ausschliessen -- es sind zwei verschiedene Fragen an
// denselben Text, und der Cache-Praefix ist derselbe, also kostet der zweite wenig.
let erweiterungslaufAktiv = false
let erweiterungslaufTimer = null
// Zeitgeber fuer den Momentwechsel: wenn genug Ruhe vergangen ist, darf mehr sichtbar
// werden. Ohne diesen Zeitgeber erschiene das Zurueckgehaltene erst beim naechsten
// Tastendruck -- also genau dann nicht, wenn man aufschaut.
let momentTimer = null
// Von Hand aufgeschaut: gilt bis zum naechsten Tastendruck. Ohne diesen Griff hiesse
// 'zurueckgehalten' in der Praxis 'unauffindbar' -- wer nie 45 Sekunden Pause macht,
// bekaeme eine Strukturfrage nie zu sehen.
let momentVonHand = false
// Was einmal auf dem Schirm stand, bleibt stehen. Der Moment entscheidet ueber das
// ERSTE Erscheinen, nicht ueber das Bleiben — sonst verschwindet eine Karte, die man
// gerade liest, sobald man wieder tippt. Wird mit dem Dokument zurueckgesetzt.
let gezeigteHinweise = { docId: null, ids: new Set() }

function merkeGezeigt(docId, findingId) {
  if (gezeigteHinweise.docId !== docId) gezeigteHinweise = { docId, ids: new Set() }
  if (findingId) gezeigteHinweise.ids.add(findingId)
}

function schonGezeigt(docId, findingId) {
  return gezeigteHinweise.docId === docId && gezeigteHinweise.ids.has(findingId)
}
let agentLiveFrame = null
let agentPresenceFocusRequest = false
let pendingParagraphBoundaryDocId = null
let evidenceFocusRequest = false
let evidenceReturnFindingId = null
let riskConfirmationFocusRequest = false
let ondaDialog = null
let accentMenu = null
// Verständnis-Interview: einmal je Projekt+Dokument prüfen, genau ein Lauf gleichzeitig.
let interviewPruefKey = null
let interviewLaufAktiv = false
let interviewStatus = null // null | 'laeuft' | ruhiger Fehlertext für die Statuszeile
let pausierterAutomatiklauf = null
// Echter Chat (Etappe A, Bereich C): genau ein Lauf gleichzeitig, app-weit (Panel und,
// ab Task C-3, auch die Randkarten-Gespraeche teilen sich dieses Feld ueber fuehreChatLauf).
let laufenderChatLauf = null
const ONDA_ACCENTS = ['sky', 'sage', 'blue', 'clay', 'lavender', 'sand']
const ONDA_ACCENT_LABELS = { sky: 'Himmel', sage: 'Salbei', blue: 'Blau', clay: 'Ton', lavender: 'Lavendel', sand: 'Sand' }

const AGENT_IDLE_MS = 3000
const AGENT_BOUNDARY_IDLE_MS = 300
const CHAT_UI_DROSSEL_MS = 50
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
    view: document.getElementById('editorView'),
    sidebar: document.getElementById('ondaSidebar'),
    back: document.getElementById('sidebarBack'),
    collapse: document.getElementById('sidebarCollapse'),
    reopen: document.getElementById('sidebarReopen'),
    structureNav: document.getElementById('structureNav'),
    scroll: document.getElementById('scroll'),
    insertLayer: document.getElementById('blockInsertLayer'),
    localLayer: document.getElementById('localAgentLayer'),
    agentPresence: document.getElementById('ondaAura'),
    agentWidget: document.getElementById('agentWidget'),
    evidenceWindow: document.getElementById('evidenceWindow'),
    erweiterungen: document.getElementById('erweiterungen'),
    erkanntes: document.getElementById('erkanntes'),
    zurueckgehalten: document.getElementById('zurueckgehalten'),
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

// Das offene Dokument bestimmt sein Projekt — nicht ctx.activeProjectObj().
//
// ctx.activeProjectObj() folgt state.activeProject, und das ist der BROWSE-Zeiger der
// Projektuebersicht: welches Projekt blaettert der Nutzer gerade durch. Das GELADENE
// Dokument (state.active) ist ein zweiter, unabhaengiger Zeiger. Beide duerfen
// auseinanderlaufen — die App startet immer in der Projektuebersicht, und ein
// Projektwechsel dort laesst das geladene Dokument stehen. Schon nach einem frischen
// Start zeigt der eine auf 'Meine Texte' und das andere auf das Beispiel-Dokument.
//
// Dieses Modul ist durchweg EDITOR-gebunden (alles haengt an refreshWorkspace bzw. an
// Bedienelementen der Schreibansicht). Es meint also immer das Projekt des offenen
// Dokuments und loest deshalb ueber doc.projectId auf — wie openDoc und wie
// fuehreHinweislaufAus es bereits tun. Sonst landet der Zustand von Projekt A am
// Dokument von Projekt B.
function dokumentProjekt(doc = ctx?.activeDoc()) {
  return projektZumDokument(ctx?.state.projects, doc)
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
    closeLocalDepth(workspace)
  } else if (workspace.agent.open) {
    closeInsertMenu({ restoreFocus: false })
    workspace.evidenceFindingId = null
    closeLocalDepth(workspace)
  } else if (hasLocalDepth(workspace)) {
    closeInsertMenu({ restoreFocus: false })
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
  insertMenu = { node: menu, opener, outsideHandler }
  placeInsertMenu(menu, opener)
  document.addEventListener('pointerdown', outsideHandler, true)
  menu.querySelector('button')?.focus()
}

// Auf- und Zugeklapptes der Struktur-Spalte. Bewusst NICHT im Dokument gespeichert:
// ob eine Karte gerade offen steht, ist eine Frage des Hinschauens, keine Eigenschaft
// des Textes -- sie gehoert nicht in eine Datei, die man exportiert oder teilt.
// Drei Zustaende je Baustein: nichts gesetzt (Voreinstellung nach Rolle), ausdruecklich
// offen, ausdruecklich zu. Die ausdrueckliche Wahl schlaegt die Voreinstellung.
let strukturKlappen = { docId: null, offen: new Set(), zu: new Set() }

function setzeStrukturDokument(docId) {
  if (strukturKlappen.docId === docId) return
  strukturKlappen = { docId, offen: new Set(), zu: new Set() }
}

// Voreinstellung: Ueberschriften stehen offen — ihr Wortlaut IST die Struktur.
// Alles andere bleibt eine Zeile, bis jemand es anklickt.
//
// Der gerade bearbeitete Absatz klappt sich AUSDRUECKLICH NICHT von allein auf. Zwei
// Gruende: erstens ist genau dieser Auszug der ueberfluessigste von allen — man sieht
// den Absatz zwei Handbreit weiter rechts im Original. Zweitens wuerde die Spalte sich
// dann bei jedem Cursor-Sprung selbst umbauen, waehrend man hinschaut. Wo man steht,
// sagt die Markierung (aria-current, Akzentrand); dafuer braucht es keinen zweiten Text.
function istKarteOffen(block) {
  if (strukturKlappen.zu.has(block.id)) return false
  if (strukturKlappen.offen.has(block.id)) return true
  return NAV_ROLLEN_MIT_EIGENEM_TEXT.has(block.role)
}

function klappeKarte(block) {
  const offen = istKarteOffen(block)
  strukturKlappen.offen.delete(block.id)
  strukturKlappen.zu.delete(block.id)
  if (offen) strukturKlappen.zu.add(block.id)
  else strukturKlappen.offen.add(block.id)
}

function createNavBlockNode(block) {
  const preview = createNode('button', 'block-preview')
  preview.type = 'button'
  preview.dataset.blockId = block.id
  const excerpt = createNode('span', 'block-preview-excerpt')
  const role = createNode('span', 'block-preview-role')
  const hint = createNode('span', 'block-preview-hint')
  hint.setAttribute('aria-hidden', 'true')
  preview.append(excerpt, role, hint)
  // Ein Klick tut beides: er springt an die Stelle UND klappt die Karte um. Beides
  // ist dieselbe Absicht ("ich will zu diesem Baustein"), also braucht es keine
  // zweite Geste. Umklappen zuerst, damit focusBlock den Baustein aktiv setzen darf,
  // ohne die gerade getroffene Wahl zu ueberschreiben.
  preview.addEventListener('click', () => {
    klappeKarte(block)
    focusBlock(block.id)
    renderStructureNav()
  })
  return { preview, excerpt, role, hint }
}

// Ueberschriften SIND die Struktur — ihr Text gehoert in die Spalte.
// Ein Absatz-Auszug dagegen ist eine Doppelung: er wiederholt woertlich, was
// zwei Handbreit weiter rechts schon steht. Sieben Karten mit sieben
// Absatzanfaengen heissen, den Text zweimal zu lesen.
// Die einzige Rolle, deren Wortlaut selbst Struktur ist. Die uebrigen Rollen
// (paragraph, claim, evidence, counterpoint, transition, question) beschreiben
// die Funktion eines Absatzes — ihr Text wiederholt nur den Fliesstext.
const NAV_ROLLEN_MIT_EIGENEM_TEXT = new Set(['heading'])

function updateNavBlockNode(nodes, block, activeBlockId, hintKind) {
  const roleLabel = ROLE_LABELS.get(block.role) || 'Freier Absatz'
  const excerpt = block.excerpt || 'Noch leer'
  const hintLabel = hintKind === 'evidence'
    ? ' — Beleg offen'
    : hintKind === 'style' ? ' — Formulierung offen' : ''
  const istAktiv = block.id === activeBlockId

  // Der Auszug erscheint nur, wo er etwas beitraegt: bei Ueberschriften und im
  // Absatz, in dem gerade geschrieben wird, von allein -- ueberall sonst auf Klick.
  // Ohne das wiederholt die Spalte den Fliesstext ein zweites Mal.
  const zeigeAuszug = istKarteOffen(block)

  // Vorlesegeraete bekommen weiterhin den vollen Wortlaut — die Kuerzung ist
  // eine Frage der Augen, nicht der Zugaenglichkeit.
  nodes.preview.setAttribute('aria-label', `${roleLabel}: ${excerpt}${hintLabel}`)
  nodes.preview.setAttribute('aria-expanded', zeigeAuszug ? 'true' : 'false')
  if (istAktiv) nodes.preview.setAttribute('aria-current', 'true')
  else nodes.preview.removeAttribute('aria-current')

  nodes.excerpt.textContent = zeigeAuszug ? excerpt : ''
  nodes.excerpt.hidden = !zeigeAuszug
  nodes.excerpt.classList.toggle('is-empty', zeigeAuszug && !block.excerpt)
  nodes.preview.classList.toggle('is-offen', zeigeAuszug)

  nodes.role.textContent = roleLabel
  nodes.preview.classList.toggle('has-hint', Boolean(hintKind))
  nodes.hint.dataset.hint = hintKind || ''
}

function rebuildStructureNav(list, doc, blocks) {
  setzeStrukturDokument(doc.id)
  const blockNodes = new Map()
  const children = []
  if (!blocks.length) children.push(createNode('p', 'structure-nav-empty', 'Noch keine Textabschnitte.'))
  blocks.forEach(block => {
    const nodes = createNavBlockNode(block)
    blockNodes.set(block.id, nodes)
    children.push(nodes.preview)
  })
  list.replaceChildren(...children)
  structureNavState = { docId: doc.id, ids: blocks.map(block => block.id), blockNodes }
}

function renderStructureNav() {
  const nav = document.getElementById('structureNav')
  const workspace = activeWorkspace()
  if (!nav || !workspace) return
  const doc = ctx.activeDoc()
  if (!doc) return
  let list = nav.querySelector('.structure-nav-list')
  if (!list) { list = createNode('div', 'structure-nav-list'); nav.append(list) }

  const blocks = getEditorBlocks(ctx.editor).filter(block => block.id)
  const ids = blocks.map(block => block.id)
  const orderChanged = structureNavState?.docId !== doc.id
    || structureNavState.ids.length !== ids.length
    || ids.some((id, index) => structureNavState.ids[index] !== id)
  if (orderChanged) rebuildStructureNav(list, doc, blocks)

  const hints = structureHintMap(doc, blocks)
  blocks.forEach(block => {
    const nodes = structureNavState.blockNodes.get(block.id)
    if (nodes) updateNavBlockNode(nodes, block, workspace.activeBlockId, hints.get(block.id) || null)
  })
}

// --- Erweiterungen in der Seitenspalte --------------------------------------
// Warum hier und nicht am Text: eine Erweiterung ist kein offener Posten. Sie darf
// nicht neben der Zeile stehen und darauf warten, entschieden zu werden -- dann waere
// sie eine Forderung wie jede Korrektur. Sie liegt in der Peripherie, findbar, ohne
// sich aufzudraengen, und wer sie anklickt, kommt an die Stelle, um die es geht.
const offeneErweiterungsKarten = new Set()

function erweiterungAnriss(text) {
  const satz = String(text || '').split(/(?<=[.!?])\s/)[0] || ''
  return satz.length > 96 ? `${satz.slice(0, 95).trimEnd()}…` : satz
}

function erweiterungStelleNode(erweiterung, stelle, index) {
  // Eine Stelle liegt entweder im offenen Text oder in einem anderen Text desselben
  // Projekts (erweiterung-model.mjs). Der zweite Fall traegt einen docTitel und KEINE
  // blockId -- der Knopf kann dort nicht hinspringen, weil der Baustein im gerade
  // offenen Editor nicht existiert. Ohne den Titel stuende dort ein stiller Knopf mit
  // einem Zitat, das im sichtbaren Text nirgends vorkommt: die Karte saehe kaputt aus,
  // obwohl sie recht hat. Der Titel ist die Erklaerung dafuer.
  const ausFremdemText = Boolean(stelle.docId)
  const grundLabel = erweiterung.art === 'verbindung'
    ? (index === 0 ? 'Erste Stelle' : 'Zweite Stelle')
    : 'Zur Stelle'
  const label = ausFremdemText
    ? `${grundLabel} — aus „${stelle.docTitel || 'einem anderen Text'}“`
    : grundLabel

  const knopf = createNode('button', 'onda-erw-stelle')
  knopf.type = 'button'
  if (ausFremdemText) knopf.classList.add('is-fremd')
  knopf.append(
    createNode('span', 'onda-erw-stelle-label', label),
    createNode('span', 'onda-erw-stelle-zitat', erweiterungAnriss(stelle.text) || stelle.text),
  )
  knopf.disabled = !stelle.blockId
  if (stelle.blockId) knopf.addEventListener('click', () => focusBlock(stelle.blockId))
  return knopf
}

function erweiterungKarte(doc, erweiterung) {
  const karte = createNode('article', 'onda-erw')
  karte.dataset.art = erweiterung.art
  karte.dataset.erweiterungId = erweiterung.id
  if (erweiterung.status === 'gemerkt') karte.classList.add('is-gemerkt')

  const offen = offeneErweiterungsKarten.has(erweiterung.id)
  const kopf = createNode('button', 'onda-erw-kopf')
  kopf.type = 'button'
  kopf.setAttribute('aria-expanded', offen ? 'true' : 'false')
  kopf.append(createNode('span', 'onda-erw-art', ART_LABEL[erweiterung.art]))
  // Zugeklappt traegt der Kopf den ersten Satz, aufgeklappt nur noch die Art:
  // sonst stuende derselbe Satz zweimal untereinander -- derselbe Fehler wie
  // vorher in der Struktur-Spalte, nur an einer anderen Stelle.
  if (!offen) kopf.append(createNode('span', 'onda-erw-anriss', erweiterungAnriss(erweiterung.gedanke)))
  // Vorlesegeraete bekommen den Anriss immer, auch aufgeklappt — dort ist die
  // Wiederholung keine Doppelung, sondern die Beschriftung des Knopfes.
  kopf.setAttribute('aria-label', `${ART_LABEL[erweiterung.art]}: ${erweiterungAnriss(erweiterung.gedanke)}`)
  kopf.addEventListener('click', () => {
    if (offeneErweiterungsKarten.has(erweiterung.id)) offeneErweiterungsKarten.delete(erweiterung.id)
    else offeneErweiterungsKarten.add(erweiterung.id)
    renderErweiterungen()
  })
  karte.append(kopf)

  if (!offen) return karte

  const koerper = createNode('div', 'onda-erw-koerper')
  koerper.append(createNode('p', 'onda-erw-was', ART_ERKLAERUNG[erweiterung.art]))
  koerper.append(createNode('p', 'onda-erw-gedanke', erweiterung.gedanke))

  // Das Muster ist der eigentliche Ertrag: der Einzelfall hilft einmal, das Prinzip
  // beim naechsten Text von allein.
  const muster = createNode('p', 'onda-erw-muster')
  muster.append(
    createNode('span', 'onda-erw-muster-label', 'Muster'),
    createNode('span', 'onda-erw-muster-text', erweiterung.muster),
  )
  koerper.append(muster)

  if (erweiterung.stellen.length) {
    const stellen = createNode('div', 'onda-erw-stellen')
    erweiterung.stellen.forEach((stelle, index) => {
      stellen.append(erweiterungStelleNode(erweiterung, stelle, index))
    })
    koerper.append(stellen)
  }

  const gesten = createNode('div', 'onda-erw-gesten')
  const merken = createNode('button', 'onda-erw-geste', erweiterung.status === 'gemerkt' ? 'Gemerkt' : 'Merken')
  merken.type = 'button'
  merken.disabled = erweiterung.status === 'gemerkt'
  merken.addEventListener('click', () => {
    merkeErweiterung(doc, erweiterung.id)
    // Das Prinzip starb bisher auf der Karte. Es ist der einzige Teil einer
    // Erweiterung, der beim naechsten Text von allein wieder trueggt -- also gehoert
    // es der Person, nicht dem Dokument.
    merkeErkanntes(erweiterung.muster, 'erweiterung', erweiterung.stellen?.[0]?.text || '')
    ctx?.scheduleSave()
    refreshWorkspace()
  })
  const weglegen = createNode('button', 'onda-erw-geste is-still', 'Weglegen')
  weglegen.type = 'button'
  weglegen.addEventListener('click', () => {
    legeErweiterungWeg(doc, erweiterung.id)
    offeneErweiterungsKarten.delete(erweiterung.id)
    ctx?.scheduleSave()
    renderErweiterungen()
  })
  gesten.append(merken, weglegen)
  koerper.append(gesten)

  karte.append(koerper)
  return karte
}

// Was auf seinen Moment wartet, bleibt auffindbar. Ohne diese Zeile waere die
// Zurueckhaltung eine Unterschlagung: wer nie lange genug pausiert, saehe eine
// Strukturfrage nie. Die Zeile drueckt nicht — sie steht da und laesst sich ziehen.
function renderZurueckgehalten() {
  const ui = elements()
  const bereich = ui.zurueckgehalten
  const doc = ctx?.activeDoc()
  if (!bereich) return
  if (!doc) { bereich.hidden = true; return }

  const moment = momentJetzt(doc.id)
  const wartend = (doc.findings || []).filter(finding => (
    finding?.status === 'open'
    && finding.placement === 'passage'
    && !darfErscheinen(artVon(finding), moment, schonGezeigt(doc.id, finding.id))
  ))

  if (!wartend.length) { bereich.hidden = true; bereich.replaceChildren(); return }

  const knopf = createNode('button', 'onda-zurueck-knopf')
  knopf.type = 'button'
  knopf.append(
    createNode('span', 'onda-zurueck-zahl', String(wartend.length)),
    createNode(
      'span',
      'onda-zurueck-text',
      wartend.length === 1
        ? 'Hinweis wartet aufs Aufschauen — jetzt zeigen'
        : 'Hinweise warten aufs Aufschauen — jetzt zeigen',
    ),
  )
  knopf.addEventListener('click', () => {
    momentVonHand = true
    refreshWorkspace()
  })
  bereich.replaceChildren(knopf)
  bereich.hidden = false
}

// Der einzige Weg, auf dem etwas in den Personen-Speicher gelangt. Bewusst EINE
// Stelle: ein Speicher, der sich an mehreren Stellen selbst fuellt, laesst sich
// spaeter nicht mehr ueberblicken.
function merkeErkanntes(satz, herkunft, beleg = '') {
  const text = String(satz || '').trim()
  if (!text || !ctx?.state) return null
  const doc = ctx.activeDoc()
  const ergebnis = schreibeErkanntes(ctx.state.memoryStore, {
    satz: text,
    herkunft,
    dokumentId: doc?.id || null,
    projektId: doc?.projectId || null,
    beleg,
  })
  ctx.state.memoryStore = ergebnis.store
  return ergebnis.eintrag
}

// Die leiseste Flaeche der Spalte. Kein Angebot, keine Aufgabe — ein Rueckblick.
// Jede Zeile ist mit einer Geste zurueckzunehmen; ohne das wiederholte sich ein
// falscher Satz in jedem kuenftigen Text, und der Speicher vergiftete sich selbst.
function renderErkanntes() {
  const bereich = elements().erkanntes
  if (!bereich || !ctx?.state) return
  const eyebrow = bereich.querySelector('.onda-eyebrow')
  const liste = erkanntesListe(ctx.state.memoryStore)
  const kinder = []

  if (!liste.length) {
    kinder.push(createNode(
      'p',
      'onda-erk-leer',
      'Hier sammelt sich, was du beim Schreiben erkannt hast — je ein Satz, der beim '
      + 'naechsten Text wieder traegt. Er kommt dazu, wenn du eine Erweiterung merkst '
      + 'oder einen Hinweis annimmst.',
    ))
  }

  liste.forEach(gruppe => {
    const zeile = createNode('div', 'onda-erk-zeile')
    zeile.append(createNode('span', 'onda-erk-satz', gruppe.satz))
    // Die Zahl bedeutet hier etwas Gutes: was wiederkam, ist im Begriff, in Fleisch
    // und Blut ueberzugehen. Deshalb Tinte statt Warnfarbe und kein Abzeichen.
    if (gruppe.treffer > 1) {
      zeile.append(createNode('span', 'onda-erk-treffer', `${gruppe.treffer}×`))
    }
    const weg = createNode('button', 'onda-erk-weg', 'Stimmt nicht mehr')
    weg.type = 'button'
    weg.setAttribute('aria-label', `Zuruecknehmen: ${gruppe.satz}`)
    weg.addEventListener('click', () => {
      ctx.state.memoryStore = ueberholeErkanntes(ctx.state.memoryStore, gruppe.schluessel).store
      ctx.scheduleSave()
      renderErkanntes()
    })
    zeile.append(weg)
    kinder.push(zeile)
  })

  bereich.replaceChildren(...(eyebrow ? [eyebrow, ...kinder] : kinder))
}

function renderErweiterungen() {
  const ui = elements()
  const bereich = ui.erweiterungen
  const doc = ctx?.activeDoc()
  if (!bereich || !doc) return
  ensureErweiterungen(doc)

  const eyebrow = bereich.querySelector('.onda-eyebrow')
  const liste = sichtbareErweiterungen(doc)
  const kinder = []

  if (!liste.length) {
    kinder.push(createNode(
      'p',
      'onda-erw-leer',
      'Hier sammelt sich, was der Text noch hergibt: Weiterführungen, Nachbargebiete, '
      + 'Verbindungen. Es kommt beim Aufschauen, nicht beim Schreiben.',
    ))
  } else {
    liste.forEach(erweiterung => kinder.push(erweiterungKarte(doc, erweiterung)))
  }

  // Jeder Moment kann auch von Hand gezogen werden — proaktiv heisst nicht,
  // warten zu muessen.
  const fragen = createNode('button', 'onda-erw-fragen', 'Was fällt dir noch ein?')
  fragen.type = 'button'
  fragen.disabled = erweiterungslaufAktiv || istBeispielDokument(doc)
  fragen.addEventListener('click', () => { starteErweiterungslauf() })
  kinder.push(fragen)

  bereich.replaceChildren(...(eyebrow ? [eyebrow, ...kinder] : kinder))
}

function closeOndaDialog({ restoreFocus = true } = {}) {
  if (!ondaDialog) return false
  const { scrim, opener, keyHandler } = ondaDialog
  document.removeEventListener('keydown', keyHandler, true)
  scrim.remove()
  ondaDialog = null
  if (restoreFocus && opener?.isConnected) opener.focus()
  return true
}

function dialogFocusables(panel) {
  return [...panel.querySelectorAll('button, summary, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')]
    .filter(node => !node.disabled && node.offsetParent !== null)
}

function openOndaDialog({ id, title, opener, build }) {
  closeOndaDialog({ restoreFocus: false })
  const scrim = createNode('div', 'onda-dialog-scrim')
  const panel = createNode('section', 'onda-dialog')
  panel.id = id
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')
  const titleId = `${id}-title`
  panel.setAttribute('aria-labelledby', titleId)

  const header = createNode('header', 'onda-dialog-header')
  const heading = createNode('h2', 'onda-dialog-title', title)
  heading.id = titleId
  const close = createNode('button', 'onda-icon-btn onda-dialog-close', '×')
  close.type = 'button'
  close.setAttribute('aria-label', 'Schließen')
  close.addEventListener('click', () => closeOndaDialog())
  header.append(heading, close)

  const body = createNode('div', 'onda-dialog-body')
  build(body)
  panel.append(header, body)
  scrim.append(panel)
  scrim.addEventListener('pointerdown', event => { if (event.target === scrim) closeOndaDialog() })

  const keyHandler = event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeOndaDialog(); return }
    if (event.key !== 'Tab') return
    const items = dialogFocusables(panel)
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  document.addEventListener('keydown', keyHandler, true)
  document.getElementById('editorView').append(scrim)
  ondaDialog = { scrim, panel, opener: opener || document.activeElement, keyHandler }
  requestAnimationFrame(() => { (dialogFocusables(panel)[0] || close).focus({ preventScroll: true }) })
  return panel
}

function renderMaterialEntry() {
  const button = document.getElementById('materialSources')
  if (!button) return
  const project = dokumentProjekt()
  const count = Array.isArray(project?.sources) ? project.sources.length : 0
  button.setAttribute('aria-haspopup', 'dialog')
  button.replaceChildren(
    createNode('span', 'onda-material-label', 'Quellen im Projekt'),
    createNode('span', 'onda-badge onda-material-count', String(count)),
  )
}

function openProjectSourcesModal(opener) {
  const project = dokumentProjekt()
  const sourceLibrary = createSourceLibraryUi({
    context: ctx,
    createNode,
    onCountChange: renderMaterialEntry,
    safeHttpsUrl,
    openSecureExternal,
  })
  openOndaDialog({ id: 'materialModal', title: 'Quellen im Projekt', opener, build: body => {
    sourceLibrary.renderProjectSourceLibrary(body, project)
  }})
}

// ---------- Einstellungen: KI-Anschluss (Bereich U) ----------
// Der Schluessel wird IMMER vom Nutzer selbst eingetragen. Setzen/Loeschen laeuft
// ausschliesslich ueber die echten, getesteten Gateway-Funktionen (agent-gateway.mjs
// -> agent-transport.mjs) — kein lokaler Nachbau des Bruecken-Protokolls hier.
// Mac: Keychain via Handler 'llm'/'llmkey' (der Schluessel kommt nie an JS zurueck).
// Browser: Dev-Weg in localStorage 'aiwt.apikey' (separat von aiwt.v2, taucht in
// keinem Export auf) — das schreibt bereits direktTransport.setzeSchluessel selbst.

const KI_KONSOLE_URL = 'https://console.anthropic.com'

// Bewusst dasselbe Kriterium wie waehleTransport() (agent-transport.mjs) — EINE
// Quelle der Wahrheit, welcher Transport (und damit welcher Schluessel-Speicher) greift.
function schluesselOrtIstKeychain() {
  return Boolean(window.webkit?.messageHandlers?.llm)
}

async function speichereApiSchluessel(wert) {
  const schluessel = String(wert || '').trim()
  if (!schluessel) return false
  await setzeSchluessel(schluessel)
  return true
}

async function loescheApiSchluessel() {
  await loescheSchluessel()
}

function openKiSettingsDialog(opener) {
  openOndaDialog({ id: 'kiModal', title: 'KI-Anschluss', opener, build: body => buildKiSettingsBody(body) })
}

function buildKiSettingsBody(body) {
  body.replaceChildren()
  const keychain = schluesselOrtIstKeychain()

  // Schluessel-Status + Ablageort
  const statusRow = createNode('div', 'ki-status-row')
  const statusBadge = createNode('span', 'onda-badge', 'Prüfe …')
  statusRow.append(createNode('span', 'onda-eyebrow', 'Schlüssel'), statusBadge)
  body.append(statusRow)
  body.append(createNode('p', 'ki-ort', keychain
    ? 'Ablageort: macOS-Schlüsselbund — der Schlüssel verlässt die Mac-App nicht.'
    : 'Ablageort: dieser Browser (Entwicklungsweg).'))

  // Eintragen
  const form = createNode('form', 'ki-key-form')
  const input = createNode('input', 'ki-key-input')
  input.type = 'password'
  input.placeholder = 'sk-ant-…'
  input.autocomplete = 'off'
  input.spellcheck = false
  input.setAttribute('aria-label', 'Anthropic-API-Schlüssel eintragen')
  const speichern = createNode('button', 'onda-btn onda-btn--sm', 'Speichern')
  speichern.type = 'submit'
  form.append(input, speichern)
  body.append(form)

  if (!keychain) {
    body.append(createNode('p', 'ki-hinweis',
      'Sicherheitshinweis: Im Browser liegt der Schlüssel unverschlüsselt im lokalen Speicher '
      + '(nur für Entwicklung und Notfall gedacht). Empfohlen ist die Mac-App — dort wandert er '
      + 'in den macOS-Schlüsselbund. In Exporten taucht der Schlüssel nie auf.'))
  }

  const loeschen = createNode('button', 'onda-btn onda-btn--ghost onda-btn--sm', 'Schlüssel löschen')
  loeschen.type = 'button'
  loeschen.hidden = true
  body.append(loeschen)

  const zeigeStatus = vorhanden => {
    statusBadge.textContent = vorhanden ? 'Hinterlegt' : 'Fehlt'
    statusBadge.classList.toggle('onda-badge--success', vorhanden)
    statusBadge.classList.toggle('onda-badge--warning', !vorhanden)
    loeschen.hidden = !vorhanden
  }
  hatSchluessel().then(zeigeStatus).catch(() => zeigeStatus(false))

  form.addEventListener('submit', async event => {
    event.preventDefault()
    if (!(await speichereApiSchluessel(input.value))) return
    input.value = ''
    announceAgentStatus('Schlüssel gespeichert.')
    pruefeAgentVerbindung()
    hatSchluessel().then(zeigeStatus).catch(() => zeigeStatus(false))
  })
  loeschen.addEventListener('click', async () => {
    await loescheApiSchluessel()
    announceAgentStatus('Schlüssel gelöscht.')
    pruefeAgentVerbindung()
    hatSchluessel().then(zeigeStatus).catch(() => zeigeStatus(false))
  })

  // Anleitung (aufklappbar)
  const anleitung = createNode('details', 'ki-anleitung')
  anleitung.append(createNode('summary', null, 'So richtest du den KI-Anschluss ein'))
  const schritte = createNode('ol', 'ki-anleitung-schritte')
  const schritt1 = createNode('li', null, 'Ein Konto anlegen auf ')
  const link = createNode('button', 'ki-link', 'console.anthropic.com')
  link.type = 'button'
  link.addEventListener('click', () => openSecureExternal(KI_KONSOLE_URL))
  schritt1.append(link, document.createTextNode('.'))
  const schritt3 = createNode('li', null, 'Im Anbieter-Konto ein Ausgabenlimit setzen ')
  schritt3.append(createNode('strong', 'ki-pflicht', '(Pflichtschritt — schützt vor unerwarteten Kosten).'))
  schritte.append(
    schritt1,
    createNode('li', null, 'Dort einen API-Schlüssel erzeugen (Bereich „API Keys“).'),
    schritt3,
    createNode('li', null, 'Den Schlüssel oben eintragen und speichern.'),
  )
  anleitung.append(schritte)
  body.append(anleitung)

  // Welches Modell wofür (Abnahme Etappe A, Kriterium 1)
  const modelle = createNode('section', 'ki-modelle')
  body.append(modelle)
  renderKiModelle(modelle)

  // Verbrauch (settings.usage — vom Verteiler nach jedem Lauf verbucht)
  const verbrauch = createNode('section', 'ki-verbrauch')
  body.append(verbrauch)
  renderKiVerbrauch(verbrauch)
  const budget = createNode('section', 'ki-budget')
  body.append(budget)
  renderKiBudget(budget)
  const abmelden = beiAgentStatus(() => {
    if (!verbrauch.isConnected) { abmelden(); return }
    renderKiVerbrauch(verbrauch)
    renderKiBudget(budget)
  })
}

function formatTokenZahl(wert) {
  return (Number.isFinite(+wert) ? +wert : 0).toLocaleString('de-DE')
}

// Klarnamen fuer die Aufgaben aus TASK_TABLE. Nur Beschriftung — welches Modell
// eine Aufgabe bekommt, steht ausschliesslich in agent-tasks.mjs.
const TASK_KLARNAMEN = Object.freeze({
  verstaendnis: 'Projekt verstehen',
  hinweise: 'Hinweise zum Text',
  chat: 'Gespräch',
  titel: 'Titelvorschlag',
  zusammenfassung: 'Zusammenfassung',
})

// Zeigt, welches Modell welche Aufgabe uebernimmt — abgeleitet aus TASK_TABLE,
// damit die Anzeige nicht veralten kann, wenn die Verteilung sich aendert.
function renderKiModelle(container) {
  container.replaceChildren()
  container.append(createNode('span', 'onda-eyebrow', 'Modelle'))

  const proModell = new Map()
  for (const [task, eintrag] of Object.entries(TASK_TABLE)) {
    const modellId = MODELLE[eintrag.modell]
    if (!modellId) continue
    if (!proModell.has(modellId)) proModell.set(modellId, [])
    proModell.get(modellId).push(TASK_KLARNAMEN[task] || task)
  }

  const liste = createNode('dl', 'ki-modell-liste')
  for (const [modellId, aufgaben] of proModell) {
    liste.append(
      createNode('dt', 'ki-modell-name', modellId),
      createNode('dd', 'ki-modell-aufgaben', aufgaben.join(' · ')),
    )
  }
  container.append(liste)
  container.append(createNode('p', 'ki-modell-fuss',
    'Onda wählt das Modell je Aufgabe selbst: das starke für Denkarbeit, '
    + 'das schnelle für Routine. Das hält die Kosten niedrig.'))
}

function renderKiVerbrauch(container) {
  container.replaceChildren()
  container.append(createNode('span', 'onda-eyebrow', 'Verbrauch'))
  const usage = ctx?.state?.settings?.usage
  if (!usage || (!usage.inputTokens && !usage.outputTokens)) {
    container.append(createNode('p', 'ki-verbrauch-leer', 'Diesen Monat noch keine Läufe.'))
    return
  }
  let monatsName = usage.monat
  try {
    monatsName = new Date(usage.monat + '-01T00:00:00').toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  } catch {}
  container.append(
    createNode('p', null, `${monatsName}: ${formatTokenZahl(usage.inputTokens)} Tokens hinein · ${formatTokenZahl(usage.outputTokens)} Tokens heraus`),
    createNode('p', null, `Aus dem Zwischenspeicher gelesen: ${formatTokenZahl(usage.cacheReadTokens)} · hineingeschrieben: ${formatTokenZahl(usage.cacheWriteTokens)}`),
    createNode('p', 'ki-verbrauch-kosten',
      `Geschätzte Kosten: ${((usage.kostenCents || 0) / 100).toLocaleString('de-DE', { style: 'currency', currency: 'USD' })}`
      + ' — Schätzung nach Preisstand 07/2026; verbindlich ist die Abrechnung im Anthropic-Konto.'),
  )
}

function starteBewusstFreigegebenenAutomatiklauf() {
  const pausiert = pausierterAutomatiklauf
  if (pausiert?.typ === 'verstaendnis') {
    // Die Budgetpause hat bereits eine sichtbare Interview-Nachricht angelegt.
    // Der normale Pruefpfad wuerde deshalb bei "Nachricht existiert" abbrechen;
    // die ausdrueckliche Einzelfreigabe nimmt genau den pausierten Lauf direkt
    // wieder auf. starteVerstaendnisEntwurf prueft Dokument und Projekt nach
    // dem asynchronen Schluesselzugriff erneut.
    starteVerstaendnisEntwurf(pausiert.projectId, pausiert.docId)
    return
  }
  if (!pausiert && istInterviewAktiv()) {
    interviewPruefKey = null
    pruefeVerstaendnisInterview()
    return
  }
  fuehreHinweislaufAus({ grund: 'freigabe' })
}

function renderKiBudget(container) {
  container.replaceChildren()
  const settings = ctx?.state?.settings
  if (!settings) return
  const stand = budgetStand(settings)
  container.append(
    createNode('span', 'onda-eyebrow', 'Lokale Monatsgrenze'),
    createNode('p', 'ki-hinweis',
      'Zusätzliche Kostenbremse für selbstständig gestartete KI-Läufe. '
      + 'Das Ausgabenlimit im Anbieter-Konto bleibt der verbindliche Schutz.'),
  )

  const form = createNode('form', 'ki-budget-form')
  const label = createNode('label', 'ki-budget-label', 'Grenze in US-Dollar')
  label.htmlFor = 'kiBudgetInput'
  const input = createNode('input', 'ki-budget-input')
  input.id = 'kiBudgetInput'
  input.name = 'kiBudgetUsd'
  input.type = 'number'
  input.min = '0.01'
  input.step = '0.01'
  input.inputMode = 'decimal'
  input.placeholder = 'z. B. 10,00'
  input.value = stand.konfiguriert ? String(stand.budgetCents / 100) : ''
  const speichern = createNode('button', 'onda-btn onda-btn--sm', 'Grenze speichern')
  speichern.type = 'submit'
  form.append(label, input, speichern)
  container.append(form)

  form.addEventListener('submit', event => {
    event.preventDefault()
    const betrag = Number.parseFloat(String(input.value || '').replace(',', '.'))
    if (!Number.isFinite(betrag) || betrag <= 0) {
      input.setCustomValidity('Bitte gib einen Betrag größer als null ein.')
      input.reportValidity()
      return
    }
    input.setCustomValidity('')
    settings.kiMonatsbudgetCents = Math.round(betrag * 100)
    settings.automatikFreigabe = { monat: settings.usage?.monat, verbleibend: 0 }
    ctx.persist()
    renderKiBudget(container)
    announceAgentStatus('Lokale Monatsgrenze gespeichert.')
  })

  if (stand.konfiguriert) {
    const entfernen = createNode('button', 'onda-btn onda-btn--ghost onda-btn--sm', 'Lokale Grenze entfernen')
    entfernen.type = 'button'
    entfernen.addEventListener('click', () => {
      settings.kiMonatsbudgetCents = null
      settings.automatikFreigabe = { monat: settings.usage?.monat, verbleibend: 0 }
      pausierterAutomatiklauf = null
      ctx.persist()
      renderKiBudget(container)
      announceAgentStatus('Lokale Monatsgrenze entfernt.')
    })
    container.append(entfernen)
  }

  if (!stand.erreicht) {
    const text = stand.konfiguriert
      ? `${(stand.kostenCents / 100).toFixed(2)} von ${(stand.budgetCents / 100).toFixed(2)} US-Dollar geschätzt verbraucht.`
      : 'Keine zusätzliche lokale Grenze gesetzt.'
    container.append(createNode('p', 'ki-budget-status', text))
    return
  }

  container.append(createNode('p', 'ki-budget-status ki-budget-status--paused',
    `Grenze erreicht: ${(stand.kostenCents / 100).toFixed(2)} von ${(stand.budgetCents / 100).toFixed(2)} US-Dollar. `
    + 'Automatische Läufe sind pausiert; selbst gesendete Nachrichten bleiben möglich.'))
  const freigeben = createNode(
    'button',
    'onda-btn onda-btn--sm ki-budget-approve',
    stand.freigaben ? 'Ein automatischer Lauf ist freigegeben' : 'Genau einen automatischen Lauf freigeben',
  )
  freigeben.type = 'button'
  freigeben.disabled = stand.freigaben > 0
  freigeben.addEventListener('click', () => {
    gibNaechstenAutomatiklaufFrei(settings)
    ctx.persist()
    renderKiBudget(container)
    announceAgentStatus('Genau ein automatischer KI-Lauf wurde freigegeben.')
    starteBewusstFreigegebenenAutomatiklauf()
  })
  container.append(freigeben)
}

function syncThemeToggle() {
  const button = document.getElementById('themeToggle')
  if (!button) return
  const dark = document.documentElement.dataset.theme === 'dark'
  button.textContent = dark ? '☀' : '☾'
  button.setAttribute('aria-pressed', String(dark))
  const label = dark ? 'Zu hellem Erscheinungsbild wechseln' : 'Zu dunklem Erscheinungsbild wechseln'
  button.setAttribute('aria-label', label)
  button.title = label
}

function toggleTheme() {
  const settings = ctx.state.settings
  settings.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
  applySettings()
  ctx.persist()
  syncThemeToggle()
}

function closeAccentMenu({ restoreFocus = true } = {}) {
  if (!accentMenu) return false
  const { node, opener, outsideHandler } = accentMenu
  document.removeEventListener('pointerdown', outsideHandler, true)
  node.remove()
  accentMenu = null
  if (restoreFocus && opener?.isConnected) opener.focus()
  return true
}

function openAccentMenu(opener) {
  closeAccentMenu({ restoreFocus: false })
  const settings = ctx.state.settings
  const current = ONDA_ACCENTS.includes(settings.accent) ? settings.accent : 'sky'
  const menu = createNode('div', 'onda-accent-menu')
  menu.setAttribute('role', 'menu')
  menu.setAttribute('aria-label', 'Akzentfarbe wählen')
  ONDA_ACCENTS.forEach(accent => {
    const swatch = createNode('button', 'onda-accent-swatch')
    swatch.type = 'button'
    swatch.setAttribute('role', 'menuitemradio')
    swatch.setAttribute('aria-checked', String(accent === current))
    swatch.dataset.accent = accent
    swatch.title = ONDA_ACCENT_LABELS[accent]
    swatch.setAttribute('aria-label', ONDA_ACCENT_LABELS[accent])
    swatch.classList.toggle('is-current', accent === current)
    swatch.addEventListener('click', () => {
      settings.accent = accent
      applySettings()
      ctx.persist()
      closeAccentMenu()
    })
    menu.append(swatch)
  })
  const outsideHandler = event => {
    if (menu.contains(event.target) || opener.contains(event.target)) return
    closeAccentMenu({ restoreFocus: false })
  }
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeAccentMenu() }
  })
  document.getElementById('editorView').append(menu)
  const rect = opener.getBoundingClientRect()
  const menuRect = menu.getBoundingClientRect()
  menu.style.left = `${Math.max(8, rect.left)}px`
  menu.style.top = `${Math.max(8, rect.top - menuRect.height - 8)}px`
  accentMenu = { node: menu, opener, outsideHandler }
  document.addEventListener('pointerdown', outsideHandler, true)
  menu.querySelector('button')?.focus()
}

function renderProjectUnderstandingCard() {
  const card = document.getElementById('pvCard')
  if (!card) return
  const project = dokumentProjekt()
  const understanding = project ? ensureProjectUnderstanding(project) : null
  const task = understanding?.task?.trim() || ''
  const effect = understanding?.desiredEffect?.trim() || ''
  card.setAttribute('aria-haspopup', 'dialog')
  card.classList.toggle('is-empty', !task)
  card.replaceChildren(
    createNode('span', 'onda-pv-card-title', task || 'Projektverständnis öffnen'),
    createNode('span', 'onda-pv-card-claim', effect || 'Aufgabe, Zielgruppe und beabsichtigte Wirkung festhalten'),
  )
}

function splitList(value, byLine) {
  return String(value || '').split(byLine ? /\r?\n/ : ',').map(part => part.trim()).filter(Boolean)
}

function currentAuditUi() {
  return createAuditUi({
    context: ctx,
    createNode,
    openDialog: openOndaDialog,
    getEditorJson: () => ctx.editor.getJSON(),
    download: ctx.downloadFile,
    importLocalState: ctx.importLocalState,
    deleteAllLocalData: ctx.deleteAllLocalData,
  })
}

export function openFinalAudit(opener = null) {
  const project = dokumentProjekt()
  if (!project || !ctx?.activeDoc()) return null
  return currentAuditUi().open(project, opener || document.getElementById('pvCard'))
}

// geschuetzt: dezenter Hinweis, dass dieses Feld eine bindende Nutzer-Korrektur trägt
// (siehe openProjectUnderstandingModal) — ruhiger Onda-Ton, keine Warnfarbe, kein
// Ausrufezeichen; nur ein zusätzliches, kleines Tag neben dem Feldlabel.
//
// Das Tag ist zugleich der Rueckweg: ein Klick gibt das Feld wieder fuer den Agenten
// frei. Ohne ihn waere jede Handkorrektur endgueltig -- der Mensch koennte weiter
// editieren, der Agent aber nie wieder dazulernen.
//
// Die Anzeige wird beim Tippen sofort nachgezogen, aber NUR am Tag, nie am Textfeld:
// ein Neuaufbau des Textfeldes wuerde den Cursor wegspringen lassen.
function understandingField(body, label, value, onCommit, { line = false, geschuetzt = false, onLoesen = null } = {}) {
  const row = createNode('div', 'onda-pv-field')
  const labelRow = createNode('div', 'onda-pv-label-row')
  labelRow.append(createNode('span', 'onda-pv-label', label))

  const field = createNode('textarea', 'onda-pv-input')
  const tag = createNode('button', 'onda-tag onda-tag--loesbar', 'bindend')
  tag.type = 'button'
  tag.title = 'Wieder für den Agenten freigeben'
  tag.setAttribute('aria-label', `${label}: bindend — freigeben, damit der Agent wieder anpassen darf`)

  const zeigeSchutz = an => {
    tag.hidden = !an
    field.setAttribute('aria-label', an ? `${label}, bindend` : label)
  }
  tag.addEventListener('click', () => {
    if (!onLoesen) return
    onLoesen()
    zeigeSchutz(false)
  })
  labelRow.append(tag)
  row.append(labelRow)

  field.rows = line ? 3 : 2
  field.value = value
  zeigeSchutz(geschuetzt)
  field.addEventListener('input', () => { onCommit(field.value); zeigeSchutz(true) })
  row.append(field)
  body.append(row)
}

function openProjectUnderstandingModal(opener) {
  const project = dokumentProjekt()
  if (!project) return
  const u = ensureProjectUnderstanding(project)
  // Jede Nutzer-Korrektur im Modal ist bindend: der geschuetzt-Merker sorgt dafür,
  // dass die KI dieses Feld in Folge-Läufen nie mehr überschreibt (mergeVerstaendnis
  // liest ihn; verstaendnisEingabe gibt ihn über baueVerstaendnisKontext mit).
  const commit = feld => {
    markiereGeschuetzt(u, feld)
    ctx.scheduleSave()
    renderProjectUnderstandingCard()
  }
  // Gegenstueck zu commit: gibt das Feld wieder fuer den Agenten frei. Der Text bleibt
  // stehen -- nur der Schreibschutz faellt, damit der Agent dort wieder dazulernen darf.
  const loesen = feld => {
    loeseSchutz(u, feld)
    ctx.scheduleSave()
    renderProjectUnderstandingCard()
  }
  const istGeschuetzt = feld => u.geschuetzt.includes(feld)
  const memoryUi = createMemoryUi({ context: ctx, createNode, openDialog: openOndaDialog })
  const argumentUi = createArgumentUi({
    context: ctx,
    createNode,
    openDialog: openOndaDialog,
    getBlocks: () => getEditorBlocks(ctx.editor),
  })
  const languageUi = createLanguageUi({
    context: ctx,
    createNode,
    openDialog: openOndaDialog,
    getBlocks: () => getEditorBlocks(ctx.editor),
    applyCorrections: corrections => replaceAnchoredTexts(ctx.editor, corrections),
  })
  openOndaDialog({ id: 'pvModal', title: 'Projektverständnis', opener, build: body => {
    understandingField(body, 'Aufgabe', u.task, value => { u.task = value; commit('task') }, { geschuetzt: istGeschuetzt('task'), onLoesen: () => loesen('task') })
    understandingField(body, 'Zielgruppe', u.audience.join(', '), value => { u.audience = splitList(value, false); commit('audience') }, { geschuetzt: istGeschuetzt('audience'), onLoesen: () => loesen('audience') })
    understandingField(body, 'Beabsichtigte Wirkung', u.desiredEffect, value => { u.desiredEffect = value; commit('desiredEffect') }, { geschuetzt: istGeschuetzt('desiredEffect'), onLoesen: () => loesen('desiredEffect') })
    understandingField(body, 'Belegstandard', u.evidenceStandard, value => { u.evidenceStandard = value; commit('evidenceStandard') }, { geschuetzt: istGeschuetzt('evidenceStandard'), onLoesen: () => loesen('evidenceStandard') })
    understandingField(body, 'Geschützte Absicht', u.protectedIntentions.join('\n'), value => { u.protectedIntentions = splitList(value, true); commit('protectedIntentions') }, { line: true, geschuetzt: istGeschuetzt('protectedIntentions'), onLoesen: () => loesen('protectedIntentions') })
    understandingField(body, 'Offene Frage', u.openQuestions.join('\n'), value => { u.openQuestions = splitList(value, true); commit('openQuestions') }, { line: true, geschuetzt: istGeschuetzt('openQuestions'), onLoesen: () => loesen('openQuestions') })
    const tools = createNode('div', 'onda-pv-tools')
    const memory = createNode('button', 'onda-pv-memory', 'Projektgedächtnis öffnen')
    memory.id = 'memoryOpen'
    memory.type = 'button'
    memory.addEventListener('click', () => memoryUi.open(project, document.getElementById('pvCard')))
    const argument = createNode('button', 'onda-pv-argument', 'Argumentation prüfen')
    argument.id = 'argumentOpen'
    argument.type = 'button'
    argument.addEventListener('click', () => argumentUi.open(project, document.getElementById('pvCard')))
    const language = createNode('button', 'onda-pv-language', 'Sprache und Wirkung prüfen')
    language.id = 'languageOpen'
    language.type = 'button'
    language.addEventListener('click', () => languageUi.open(project, document.getElementById('pvCard')))
    const audit = createNode('button', 'onda-pv-audit', 'Schlussaudit und Export öffnen')
    audit.id = 'auditOpen'
    audit.type = 'button'
    audit.addEventListener('click', () => openFinalAudit(document.getElementById('pvCard')))
    tools.append(memory, argument, language, audit)
    body.append(tools)
  }})
}

// ---------- Verständnis-Interview (Etappe A, Fähigkeit 1) ----------
// Neues Projekt: der Agent eröffnet mit genau EINER gebündelten offenen Frage
// (fester Text, kein API-Aufruf). Existiert schon Text (> 200 Zeichen), leitet
// er stattdessen per runTask('verstaendnis') einen Entwurf aus dem Text ab.
// Das Beispielprojekt bleibt Demo: dort startet nie ein Interview.
const INTERVIEW_EROEFFNUNG = 'Bevor ich beim Schreiben helfen kann, würde ich das Projekt gern verstehen: Worum soll es in diesem Text gehen — und für wen schreibst du ihn?'
const INTERVIEW_OFFLINE_TEXT = 'Agent ist offline — dein Text ist davon unberührt.'
const BUDGET_PAUSE_TEXT = 'Die lokale Monatsgrenze ist erreicht. Selbst gesendete Nachrichten bleiben möglich; unter „KI-Anschluss“ kannst du genau einen automatischen Lauf bewusst freigeben.'

function interviewMessageId(project) {
  return interviewNachrichtId(project.id)
}

function beansprucheAutomatikKosten(typ, referenz = {}) {
  const ergebnis = beansprucheAutomatiklauf(ctx?.state?.settings)
  if (!ergebnis.erlaubt) {
    pausierterAutomatiklauf = { typ, ...referenz }
    // Die normalisierte Null-Freigabe gehoert zum gespeicherten Sicherheitszustand.
    ctx?.persist()
    return ergebnis
  }
  if (ergebnis.freigabeVerbraucht) {
    pausierterAutomatiklauf = null
    ctx?.persist()
  }
  return ergebnis
}

function zeigeBudgetPause(workspace) {
  if (!workspace) return
  const monat = ctx?.state?.settings?.usage?.monat || 'aktuell'
  const id = `budget-pause-${monat}`
  let message = workspace.agent.messages.find(candidate => candidate.id === id)
  if (!message) {
    message = { id, status: 'new', earliestAt: 0, text: BUDGET_PAUSE_TEXT, thread: [] }
    workspace.agent.messages.push(message)
  } else {
    message.status = 'new'
    message.text = BUDGET_PAUSE_TEXT
  }
  announceAgentStatus(BUDGET_PAUSE_TEXT)
}

function docPlainText() {
  return getEditorBlocks(ctx.editor)
    .map(block => String(block.text || '').trim())
    .filter(Boolean)
    .join('\n\n')
}

export function istInterviewAktiv() {
  const project = dokumentProjekt()
  if (!project || istBeispielProjekt(project)) return false
  return istInterviewOffen(ensureProjectUnderstanding(project))
}

function ensureInterviewMessage(workspace, project) {
  const id = interviewMessageId(project)
  let message = workspace.agent.messages.find(candidate => candidate.id === id)
  if (!message) {
    message = { id, status: 'new', earliestAt: 0, text: '', thread: [] }
    workspace.agent.messages.push(message)
  }
  return message
}

// Sammelt die Quellen, aus denen onda-kontext.mjs seine Wissensbloecke baut: Textsorte und
// Stilprofil (project.languageProfile), den dokumentuebergreifenden Aussagen-Speicher
// (project.argumentModel), die anderen Texte desselben Projekts (state.docs) und das
// Gedaechtnis (state.memoryStore). Rein lesend und synchron — die Bloecke selbst entstehen
// erst im Kontext-Bauer, ohne DOM und ohne Uhr.
//
// docs traegt die VOLLSTAENDIGEN Dokumente, nicht nur Kennung und Titel. Das ist kein
// Versehen und darf nicht "aufgeraeumt" werden: onda-kontext.mjs baut daraus die
// Geschwistertexte (baueNachbartexte) und liest dafuer doc.body, doc.updated und
// doc.trashed. Ohne den Koerper saehe jede Anfrage weiterhin genau ein Dokument, und eine
// Querverbindung zwischen zwei Texten waere nicht bloss ungebaut, sondern unmoeglich.
// Gekostet wird davon nichts: welcher Teil eines Nachbartextes in den Prompt geraet und wie
// viel, entscheidet allein die Obergrenze in onda-kontext.mjs.
//
// Gefiltert wird dort, nicht hier: state.docs enthaelt die Texte ALLER Projekte samt
// Papierkorb, und die Auswahl gehoert in die pure, node-getestete Funktion.
function ondaQuellen(doc = ctx?.activeDoc(), project = dokumentProjekt(doc)) {
  if (!project) return null
  return {
    project,
    doc: doc || null,
    docs: ctx?.state?.docs || [],
    memoryStore: ctx?.state?.memoryStore || null,
  }
}

function verstaendnisEingabe(modus, nutzerText = '') {
  const project = dokumentProjekt()
  const u = ensureProjectUnderstanding(project)
  const workspace = activeWorkspace()
  const message = workspace?.agent.messages.find(candidate => candidate.id === interviewMessageId(project)) || null
  const thread = message?.thread || []
  const text = String(nutzerText || '').trim()
  // sendeInterviewAntwort haengt die aktuelle Antwort VOR diesem Aufruf bereits an
  // message.thread an (siehe dort) — hier abschneiden, sonst stuende sie doppelt im
  // Kontext: einmal als letzter Verlauf-Eintrag, einmal als eigenstaendige `anfrage`
  // (baueVerstaendnisKontext erwartet interviewVerlauf als reine Vorgeschichte).
  const bisherigerVerlauf = text && thread.length && thread[thread.length - 1]?.role === 'user'
    ? thread.slice(0, -1)
    : thread
  return baueVerstaendnisKontext({
    modus,
    verstaendnis: {
      task: u.task,
      audience: u.audience,
      desiredEffect: u.desiredEffect,
      evidenceStandard: u.evidenceStandard,
      protectedIntentions: u.protectedIntentions,
      openQuestions: u.openQuestions,
    },
    geschuetzt: [...(u.geschuetzt || [])],
    docText: docPlainText(),
    nutzerText,
    interviewVerlauf: bisherigerVerlauf.map(entry => ({ role: entry.role, text: entry.text })),
    onda: ondaQuellen(ctx?.activeDoc(), project),
  })
}

function interviewFehlerText(fehler) {
  const typ = fehler?.typ
  if (typ === 'kein-schluessel' || typ === 'offline') return INTERVIEW_OFFLINE_TEXT
  if (typ === 'ratenlimit' || typ === 'ueberlastet') return 'Der Agent ist gerade überlastet — er meldet sich, sobald es wieder geht.'
  if (typ === 'abgelehnt') return 'Der Agent hat auf diese Anfrage keine Antwort gegeben.'
  return 'Die Antwort des Agenten ist verloren gegangen. Deine Angaben sind gespeichert — versuch es gleich noch einmal.'
}

// Merged eine KI-Antwort in das Understanding, OHNE die Objekt-Identität zu
// brechen (offene Modal-Closures schreiben weiter in dasselbe Objekt).
function uebernimmVerstaendnis(project, daten) {
  const u = ensureProjectUnderstanding(project)
  Object.assign(u, mergeVerstaendnis(u, daten, u.geschuetzt))
  return u
}

function refreshProjectUnderstandingModal() {
  if (!ondaDialog || ondaDialog.panel?.id !== 'pvModal') return
  // Tippt der Nutzer gerade im Modal, nicht neu aufbauen — seine Eingabe ist bindend.
  if (ondaDialog.panel.contains(document.activeElement)) return
  openProjectUnderstandingModal(ondaDialog.opener)
}

// Duenner Aufrufer: die gesamte Entscheidung (Beispielprojekt-Sperre, offenes
// Interview, schon vorhandene Nachricht, Kostenbremse) steckt in
// planeInterviewNachricht (verstaendnis-interview.mjs, node-getestet — u.a. gegen
// genau den Fall, dass die Projektuebersicht auf ein anderes Projekt zeigt als das
// geladene Dokument). Hier wird nur noch ctx-Gebundenes eingesammelt und die
// zurueckgegebene Absicht ausgefuehrt.
function pruefeVerstaendnisInterview() {
  const doc = ctx?.activeDoc()
  const workspace = activeWorkspace()
  if (!doc || !workspace) return
  const pruefKey = `${doc.projectId}:${doc.id}`
  if (interviewPruefKey === pruefKey) return
  interviewPruefKey = pruefKey

  const plan = planeInterviewNachricht({
    doc,
    projects: ctx.state.projects,
    vorhandeneNachrichtIds: workspace.agent.messages.map(message => message.id),
    docTextLaenge: docPlainText().length,
  })
  if (plan.art === 'nichts') return
  if (plan.art === 'entwurf') {
    starteVerstaendnisEntwurf(plan.projectId, plan.docId)
    return
  }
  const message = ensureInterviewMessage(workspace, dokumentProjekt(doc))
  message.text = INTERVIEW_EROEFFNUNG
  persistWorkspace()
}

async function starteVerstaendnisEntwurf(projectId, docId) {
  if (interviewLaufAktiv) return
  interviewLaufAktiv = true
  interviewStatus = 'laeuft'
  // Ausserhalb des try deklariert, damit der catch-Zweig bei einem fehlgeschlagenen
  // Lauf noch weiss, fuer welches Projekt/welche Nachricht der Fehlertext sichtbar
  // gemacht werden muss (Fix-Runde 1, Finding 1).
  let project = null
  try {
    const schluesselDa = await hatSchluessel()
    if (!ctx || ctx.activeDoc()?.id !== docId) { interviewStatus = null; return }
    project = ctx.state.projects.find(candidate => candidate.id === projectId)
    const workspace = activeWorkspace()
    if (!project || !workspace) { interviewStatus = null; return }
    if (!schluesselDa) {
      // Offline-Würde: kein Entwurf möglich — die feste Eröffnungsfrage steht
      // trotzdem bereit; die Antwort darauf scheitert später ruhig per Statuszeile.
      interviewStatus = null
      const message = ensureInterviewMessage(workspace, project)
      if (!message.text) message.text = INTERVIEW_EROEFFNUNG
      persistWorkspace()
      return
    }
    const kostenfreigabe = beansprucheAutomatikKosten('verstaendnis', { projectId, docId })
    if (!kostenfreigabe.erlaubt) {
      interviewStatus = BUDGET_PAUSE_TEXT
      const message = ensureInterviewMessage(workspace, project)
      message.text = BUDGET_PAUSE_TEXT
      persistWorkspace()
      return
    }
    // Projektweite Kostenbremse (Fix-Runde 1, Finding 2): VOR dem bezahlten Aufruf
    // setzen und sofort persistieren, damit sie auch bei einem Fehlschlag gilt —
    // kein zweiter bezahlter Versuch über weitere Dokumente desselben Projekts.
    markiereEntwurfVersucht(ensureProjectUnderstanding(project))
    persistWorkspace()
    // Bereich W (Aura/Statuszeile) atmet ausschliesslich am echten Gateway-Zustand
    // (applyAuraState liest aktuellerAgentStatus().zustand === 'laeuft') — dieser
    // Aufruf ist der erste echte runTask-Aufruf im Panel, darum wird er hier gesetzt.
    setzeAgentStatus({ zustand: 'laeuft' })
    const { daten } = await runTask('verstaendnis', verstaendnisEingabe('entwurf'))
    setzeAgentStatus({ zustand: 'bereit' })
    if (!ctx) return
    uebernimmVerstaendnis(project, daten)
    interviewStatus = null
    const antwort = String(daten.antwortText || '').trim()
    if (antwort && ctx.activeDoc()?.id === docId) {
      const message = ensureInterviewMessage(activeWorkspace(), project)
      message.text = antwort
      appendThreadMessage(message.thread, 'agent', antwort, Date.now())
      announceAgentStatus(antwort)
    }
    ctx.persist()
    refreshProjectUnderstandingModal()
  } catch (fehler) {
    interviewStatus = interviewFehlerText(fehler)
    setzeAgentStatus({ zustand: 'fehler', fehlerTyp: fehler?.typ })
    // Sichtbarkeit erzwingen (Fix-Runde 1, Finding 1): ohne eine existierende
    // Nachricht kehrt renderAgentWidget vor dem interviewStatus-Absatz zurück, und
    // der Fehlertext bliebe unsichtbar — bei bereits gesetztem Prüf-Gate ohne jede
    // Wiederholmöglichkeit. Der Nutzer bekommt so den ruhigen Fehlertext UND das
    // Eingabefeld; kein automatischer Retry, kein Kosten-Risiko.
    if (ctx && project && ctx.activeDoc()?.id === docId) {
      const workspace = activeWorkspace()
      if (workspace) {
        ensureInterviewMessage(workspace, project)
        persistWorkspace()
      }
    }
  } finally {
    interviewLaufAktiv = false
    if (ctx) refreshWorkspace()
  }
}

// Composer-Routing: solange istInterviewAktiv() wahr ist, gehört jede Eingabe im
// Agenten-Panel dem Interview (siehe Submit-Handler in renderAgentWidget). Anders als
// starteVerstaendnisEntwurf ist das hier KEIN automatischer, kostenpflichtiger Lauf,
// den entwurfVersuchtAm bremsen dürfte — der Nutzer hat aktiv geantwortet, das zählt
// nicht als der bezahlte Automatik-Entwurf und bleibt vom Merker unberührt.
async function sendeInterviewAntwort(message, text) {
  // Projekt VOR jedem await ueber das Dokument aufloesen: die Antwort gehoert dem
  // Projekt, fuer das sie gestellt wurde — auch wenn danach umgeblaettert wird.
  const project = dokumentProjekt()
  if (!project || interviewLaufAktiv) return
  appendThreadMessage(message.thread, 'user', text, Date.now())
  interviewLaufAktiv = true
  interviewStatus = 'laeuft'
  announceAgentStatus('Agent denkt nach …')
  persistWorkspace()
  refreshWorkspace()
  try {
    // Bereich W (Aura/Statuszeile) atmet ausschliesslich am echten Gateway-Zustand
    // (applyAuraState liest aktuellerAgentStatus().zustand === 'laeuft') — wie in
    // starteVerstaendnisEntwurf muss jeder echte runTask-Aufruf ihn setzen (U-5-Aura).
    setzeAgentStatus({ zustand: 'laeuft' })
    const { daten } = await runTask('verstaendnis', verstaendnisEingabe('antwort', text))
    setzeAgentStatus({ zustand: 'bereit' })
    if (!ctx) return
    uebernimmVerstaendnis(project, daten)
    interviewStatus = null
    const antwort = String(daten.antwortText || '').trim()
    if (antwort) {
      appendThreadMessage(message.thread, 'agent', antwort, Date.now())
      message.text = antwort
      announceAgentStatus(antwort)
    }
    // Sind task + audience + desiredEffect jetzt gefüllt, ist das Interview
    // abgeschlossen — der nächste Composer-Beitrag geht in den normalen Chat.
    ctx.persist()
    refreshProjectUnderstandingModal()
  } catch (fehler) {
    interviewStatus = interviewFehlerText(fehler)
    setzeAgentStatus({ zustand: 'fehler', fehlerTyp: fehler?.typ })
    announceAgentStatus(interviewStatus)
  } finally {
    interviewLaufAktiv = false
    if (ctx) refreshWorkspace()
  }
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
      satzendeAt: Number.NaN,
      satzendeGeneration: null,
      pendingUpdateGeneration: null,
      pendingBoundary: false,
      pendingSatzende: false,
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
  clearHinweislaufTimer()
  clearErweiterungslaufTimer()
  clearMomentTimer()
  pendingParagraphBoundaryDocId = null
  const state = initiativeInputState()
  if (!state) return
  state.generation += 1
  state.boundaryAt = Number.NaN
  state.boundaryGeneration = null
  state.satzendeAt = Number.NaN
  state.satzendeGeneration = null
  state.pendingBoundary = false
  state.pendingSatzende = false
  state.pendingUpdateGeneration = null
  if (requireNewInput) state.lastInputAt = Number.NaN
}

function recordRealEditorInput({ paragraphBoundary = false, satzende = false } = {}) {
  const docId = ctx?.activeDoc()?.id
  const state = initiativeInputState(docId)
  if (!state || controller.activeDocumentId !== docId) return
  // Wer wieder schreibt, schaut nicht mehr auf.
  momentVonHand = false
  clearAgentInitiativeTimer()
  state.generation += 1
  state.lastInputAt = Date.now()
  state.boundaryAt = Number.NaN
  state.boundaryGeneration = null
  state.pendingUpdateGeneration = state.generation
  state.pendingBoundary = paragraphBoundary && !isComposing
  // Das Satzende zaehlt NUR fuer den Moment, nie fuer den Hinweislauf. Wuerde es
  // pendingBoundary mitsetzen, liefe nach jedem Punkt 300 ms spaeter ein bezahlter
  // Lauf an -- aus einer Frage des Hinschauens waere eine Frage der Rechnung geworden.
  state.pendingSatzende = satzende && !isComposing
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
  if ((state.pendingSatzende || state.pendingBoundary) && !isComposing) {
    state.satzendeAt = at
    state.satzendeGeneration = state.generation
  }
  state.pendingUpdateGeneration = null
  state.pendingBoundary = false
  state.pendingSatzende = false
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
  // Ein EREIGNIS, kein Zustand: geprueft wird das gerade eingegebene Zeichen, nicht,
  // ob der Text zufaellig auf einen Punkt endet. Sonst zaehlte jeder weitere
  // Tastendruck hinter dem Punkt erneut als Satzende (Lehre aus dem Prototyp #4).
  const satzende = !isComposing
    && event?.inputType === 'insertText'
    && istSatzende(event.data)
  pendingParagraphBoundaryDocId = null
  recordRealEditorInput({ paragraphBoundary, satzende })
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

// Welcher Moment ist gerade erreicht (momente-model.mjs)? Liest nur die ohnehin
// gefuehrten Eingabezeiten -- kein eigener Zustand, damit es keine zweite Wahrheit
// darueber gibt, wann zuletzt getippt wurde.
function momentJetzt(docId = ctx?.activeDoc()?.id) {
  const inputState = initiativeInputState(docId)
  // Eine Grenze ist beides: das Absatzende (Enter) und das Satzende (Punkt, Frage-,
  // Ausrufezeichen). Beide sind der Augenblick, in dem ein Gedanke fertig ist.
  const anGrenze = Boolean(
    inputState
    && inputState.satzendeGeneration === inputState.generation
    && Number.isFinite(inputState.satzendeAt),
  )
  return aktuellerMoment({
    jetzt: Date.now(),
    lastInputAt: inputState?.lastInputAt,
    anGrenze,
    editorSichtbar: editorViewIsVisibleFor(docId),
    vonHand: momentVonHand,
  })
}

function clearMomentTimer() {
  if (momentTimer) { clearTimeout(momentTimer); momentTimer = null }
}

// Plant die naechste Neuzeichnung auf den naechsten Schwellenwert. Ohne das bliebe
// ein zurueckgehaltener Hinweis liegen, bis zufaellig etwas anderes neu zeichnet.
function planeMomentwechsel() {
  clearMomentTimer()
  const docId = ctx?.activeDoc()?.id || null
  const inputState = initiativeInputState(docId)
  if (!docId || !inputState || !Number.isFinite(inputState.lastInputAt)) return
  if (!editorViewIsVisibleFor(docId)) return

  const ruhe = Date.now() - inputState.lastInputAt
  const anGrenze = inputState.boundaryGeneration === inputState.generation
    && Number.isFinite(inputState.boundaryAt)
  const schwellen = [anGrenze ? INNEHALTEN_AN_GRENZE_MS : INNEHALTEN_MS, AUFSCHAUEN_MS]
  const naechste = schwellen.find(schwelle => schwelle > ruhe)
  if (naechste === undefined) return

  const generation = inputState.generation
  momentTimer = setTimeout(() => {
    momentTimer = null
    const aktuell = initiativeInputState(docId)
    if (!aktuell || aktuell.generation !== generation) return
    if (!editorViewIsVisibleFor(docId)) return
    renderLocalFinding()
    // Muss mit: sonst behauptet die Zeile weiter "1 Hinweis wartet", waehrend der
    // Hinweis daneben schon sichtbar ist. Ausgerechnet der wahrscheinlichste Weg
    // zum Aufschauen -- Nichtstun -- war der nicht abgedeckte.
    renderZurueckgehalten()
    renderErweiterungen()
    planeErweiterungslauf()
    planeMomentwechsel()
  }, Math.max(24, naechste - ruhe))
}

function currentPassageFinding(doc, blocks) {
  const queue = getFindingQueue(doc)
  const moment = momentJetzt(doc?.id)
  let migrated = false
  for (const finding of [queue.current, ...queue.upcoming]) {
    // Der Rhythmus folgt der Art, nicht dem Kanal (momente-model.mjs): eine
    // Formulierung darf sofort erscheinen, eine Strukturfrage erst beim Aufschauen.
    // Zurueckgehalten heisst nur zurueckgehalten -- der Hinweis bleibt bestehen und
    // erscheint, sobald sein Moment da ist. Was einmal stand, bleibt stehen.
    if (!darfErscheinen(artVon(finding), moment, schonGezeigt(doc?.id, finding?.id))) continue
    if (finding?.placement !== 'passage' || !finding.target) continue
    const hadBlockId = Boolean(finding.blockId)
    const placement = resolveFindingPlacement(finding, blocks)
    if (placement.kind !== 'anchored' && placement.kind !== 'stale') continue
    if (!hadBlockId && finding.blockId) migrated = true
    merkeGezeigt(doc?.id, finding.id)
    return { finding, block: placement.block, placementKind: placement.kind, migrated }
  }
  return { finding: null, block: null, placementKind: null, migrated }
}

function unplacedPassageFindings(doc, blocks) {
  const queue = getFindingQueue(doc)
  const moment = momentJetzt(doc?.id)
  return [queue.current, ...queue.upcoming]
    .filter(finding => darfErscheinen(artVon(finding), moment, schonGezeigt(doc?.id, finding?.id)))
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
  send.disabled = Boolean(laufenderChatLauf)
  form.append(input, send)
  form.addEventListener('submit', event => {
    event.preventDefault()
    const text = input.value.trim()
    if (!text || laufenderChatLauf) return
    // Echter, gestreamter Chat mit Finding-Kontext (Bereich C, Task C-3) — die Kulisse ist weg.
    input.value = ''
    appendThreadMessage(finding.thread, 'user', text, Date.now())
    ctx.persist()
    refreshWorkspace()
    sendeLocalChat(finding, text)
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
  // Ueber einen Hinweis zu entscheiden IST ein Aufschauen. Wer gerade Rueckmeldung
  // durcharbeitet, schreibt nicht — der naechste Hinweis darf sofort folgen, statt
  // 45 Sekunden Ruhe abzuwarten. Gilt bis zum naechsten Tastendruck; sobald wieder
  // getippt wird, setzt recordRealEditorInput es zurueck.
  momentVonHand = true
  // Angenommen heisst: das hat gestimmt. Dann traegt auch das Prinzip dahinter.
  // Verworfenes wandert NICHT in den Speicher -- ein zurueckgewiesener Hinweis ist
  // keine Erkenntnis, und ihn trotzdem zu behalten waere das Gegenteil von
  // "Autorentscheidungen sind bindend".
  if (decision?.kind === 'accept') merkeErkanntes(finding.muster, 'hinweis', finding.target || '')
  decideFinding(doc, finding.id, decision)
  const project = dokumentProjekt(doc)
  const recorded = doc.decisions.at(-1)
  if (project?.argumentModel && recorded) {
    project.argumentModel = analyzeArgumentImpact({
      model: project.argumentModel,
      projectId: project.id,
      change: {
        kind: 'decision',
        entityId: recorded.id,
        textId: doc.id,
        blockId: finding.blockId || finding.anchor?.blockId || null,
        fingerprint: `${recorded.id}:${recorded.kind}:${recorded.outcome}:${recorded.at}`,
        reason: 'Eine Nutzerentscheidung zu einem Texthinweis hat die argumentative Grundlage verändert.',
      },
      at: recorded.at,
    }).model
  }
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
    // Das Muster ist der eigentliche Ertrag: die Beobachtung hilft diesem einen Text,
    // das Prinzip dahinter hilft beim naechsten. Es steht ZULETZT, weil man es erst
    // versteht, wenn man den Einzelfall begriffen hat. Fehlt es, steht keine leere
    // Zeile da — ein Hinweis ohne Prinzip ist immer noch ein gueltiger Hinweis.
    if (finding.muster) appendDetailRow(detail, 'Muster', finding.muster)
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

function applyAuraState() {
  const orb = elements().agentPresence
  if (!orb) return
  const workspace = activeWorkspace()
  // Quelle echt: Die Aura atmet nur, wenn wirklich ein Gateway-Task laeuft —
  // nicht mehr bloss, weil das Panel offen ist (die Attrappen-Quelle ist weg).
  const laeuft = aktuellerAgentStatus().zustand === 'laeuft'
  const unseen = hasUnseenInitiative(workspace)
  orb.classList.toggle('is-thinking', laeuft)
  orb.classList.toggle('is-quiet', !laeuft)
  orb.classList.toggle('has-unseen', unseen)
  orb.setAttribute(
    'aria-label',
    unseen ? 'Agentengespräch öffnen (neue Anmerkung)' : 'Agentengespräch öffnen',
  )
}

// Prueft die Schluessel-Lage und setzt den ruhigen Grundzustand des Agenten.
// Laufende Tasks werden nie ueberschrieben (Bereich W setzt 'laeuft'/'fehler').
async function pruefeAgentVerbindung() {
  let vorhanden = false
  try {
    vorhanden = await hatSchluessel()
  } catch {
    vorhanden = false
  }
  if (aktuellerAgentStatus().zustand === 'laeuft') return
  setzeAgentStatus(vorhanden ? { zustand: 'bereit' } : { zustand: 'offline' })
}

// Ruhige Statuszeile im Agenten-Panel: offline / Lauf aktiv / Fehler.
// Ersetzt nur die Kinder des Containers — nie Modals, nie Fokusraub.
function renderAgentStatuszeile() {
  const host = document.getElementById('agentStatusline')
  if (!host) return
  const zeile = statuszeileFuer(aktuellerAgentStatus())
  host.replaceChildren()
  host.hidden = !zeile
  if (!zeile) return
  if (zeile.aura) {
    const orb = createNode('span', 'onda-aura onda-aura--xs is-thinking')
    orb.setAttribute('aria-hidden', 'true')
    host.append(orb)
  }
  host.append(createNode('span', 'agent-statusline-text', zeile.text))
  if (zeile.knopf === 'einstellungen') {
    const oeffnen = createNode('button', 'onda-btn onda-btn--ghost onda-btn--sm', 'Einstellungen öffnen')
    oeffnen.type = 'button'
    oeffnen.addEventListener('click', event => openKiSettingsDialog(event.currentTarget))
    host.append(oeffnen)
  }
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

// Gleicher Text wie fuer das Verstaendnis-Interview (docPlainText, siehe dort) — nur unter
// dem Namen, den der Chat-Kontext und (modulintern, Task C-3) die Randkarten-Gespraeche
// erwarten. Bewusst KEIN zweiter Weg, den Dokumenttext zu lesen.
function dokumentText() {
  return docPlainText()
}

function chatNachrichtenTextKnoten(messageId) {
  const selectorId = escapedSelectorValue(messageId)
  return document.querySelector(`.agent-message[data-message-id="${selectorId}"] .agent-message-text`)
}

// Streamt EINE Agenten-Antwort in den übergebenen Thread: die Nachricht entsteht beim
// ersten Delta (per refreshWorkspace, damit der DOM-Knoten überhaupt existiert), wächst
// danach gedrosselt (~50 ms) per direktem Text-Update — nie per Voll-Rerender, damit der
// Fokus im Eingabefeld unangetastet bleibt und der Editor bedienbar bleibt. Modulintern
// auch für Task C-3 (Randkarten-Gespräch) gedacht — deshalb der doppelte Container-Selektor
// in scrollThreadToLatest weiter unten.
// Fix-Runde 1, Finding 2 (Important): jeder echte runTask-Aufruf muss setzeAgentStatus
// setzen (Bereich W/Aura atmet ausschliesslich am echten Gateway-Zustand) — Vorbild:
// starteVerstaendnisEntwurf/sendeInterviewAntwort (dieselbe Datei), versucheHinweislauf
// (hinweislauf-model.mjs). fuehreChatLauf setzt 'laeuft'/'bereit'/'fehler' hier vollstaendig
// SELBST, weil es auch direkt (ohne sendeAgentenChat/fuehreChatVorgangAus) aufgerufen wird —
// modulintern fuer Task C-3 (Randkarten-Gespräch, keine Verdichtung dort).
//
// Fix-Runde 1, Finding 1 (Critical): erzeugt KEIN eigenes Sperr-Objekt mehr, sondern
// uebernimmt ein von sendeAgentenChat bereits gesetztes (laufenderChatLauf ist zu diesem
// Zeitpunkt schon non-null, siehe dort) — bei einem direkten Aufruf (C-3) erzeugt es weiterhin
// selbst eins. Zwei verschiedene Sperr-Objekte fuer denselben Lauf waren die Ueberschreib-
// Luecke, durch die ein dritter Submit moeglich wurde.
async function fuehreChatLauf(thread, kontext) {
  const lauf = laufenderChatLauf || { agentMessage: null, puffer: '', flushTimer: null }
  laufenderChatLauf = lauf
  const flush = () => {
    lauf.flushTimer = null
    if (!lauf.agentMessage) return
    lauf.agentMessage.text = lauf.puffer
    const node = chatNachrichtenTextKnoten(lauf.agentMessage.id)
    if (!node) return
    node.textContent = lauf.puffer
    scrollThreadToLatest(node.closest('.agent-widget-messages, .local-dialogue-messages'))
  }
  try {
    setzeAgentStatus({ zustand: 'laeuft' })
    const { daten } = await runTask('chat', kontext, {
      onDelta: text => {
        lauf.puffer += String(text || '')
        if (!lauf.agentMessage) {
          // Fix-Runde 2, Finding 4: appendThreadMessage wirft bei leerem/reinem
          // Whitespace-Text (workspace-model.mjs, gewollt fuer den allgemeinen Fall). Der
          // allererste Delta-Chunk kann aber leer oder Whitespace-only sein, bevor sichtbarer
          // Text ankommt -- ohne diese Absicherung wuerde genau dieser Wurf im Transport
          // (agent-transport.mjs) als Netzfehler ('offline') fehlklassifiziert und einen
          // bereits bezahlten Lauf erneut auslösen. Einfach auf mehr Text warten, statt zu werfen.
          if (!lauf.puffer.trim()) return
          lauf.agentMessage = appendThreadMessage(thread, 'agent', lauf.puffer)
          refreshWorkspace()
          return
        }
        if (!lauf.flushTimer) lauf.flushTimer = setTimeout(flush, CHAT_UI_DROSSEL_MS)
      },
    })
    setzeAgentStatus({ zustand: 'bereit' })
    if (lauf.flushTimer) clearTimeout(lauf.flushTimer)
    const antwort = typeof daten === 'string' && daten.trim() ? daten : lauf.puffer
    if (!antwort.trim()) return
    if (lauf.agentMessage) lauf.agentMessage.text = antwort
    else appendThreadMessage(thread, 'agent', antwort)
    announceAgentStatus(antwort)
  } catch (fehler) {
    if (lauf.flushTimer) clearTimeout(lauf.flushTimer)
    setzeAgentStatus({ zustand: 'fehler', fehlerTyp: fehler?.typ })
    if (fehler?.typ === 'abgebrochen') return
    const meldung = chatFehlerText(fehler)
    if (lauf.agentMessage) lauf.agentMessage.text = meldung
    else appendThreadMessage(thread, 'agent', meldung)
    announceAgentStatus(meldung)
  } finally {
    laufenderChatLauf = null
    ctx?.persist()
    refreshWorkspace()
  }
}

// Baut den Chat-Kontext aus dem Live-Zustand und startet fuehreChatLauf — orchestriert ueber
// fuehreChatVorgangAus (chat-kontext.mjs, Fix-Runde 1), das die Sperre SYNCHRON vor jedem
// await setzt (Finding 1) und den ganzen Vorgang inklusive Verdichtung als 'laeuft' meldet
// (Finding 2). doc/project werden VOR der Sperre gelesen (reiner, synchroner Zugriff ohne
// Risiko) und in den Callbacks weiterverwendet, damit chatte() IMMER fuehreChatLauf erreicht
// — kein frueher Return mehr, der die Sperre/den Status haengen lassen koennte.
//
// Der Chat selbst ist ueberall echt, auch im Beispielprojekt (Spec) — istBeispielProjekt
// sperrt hier NUR den automatischen Hinweislauf, den eine Chat-Bitte sonst ausloesen wuerde
// (der Seed bleibt unveraenderte Demo); starteHinweislauf/versucheHinweislauf sperren das
// Beispielprojekt ohnehin zusaetzlich autoritativ (istBeispielprojekt-Gate dort), diese
// Pruefung hier vermeidet nur den unnoetigen Zusatzsatz in der Antwort.
async function sendeAgentenChat(message, anfrage) {
  const doc = ctx.activeDoc()
  const project = dokumentProjekt(doc)
  if (!doc || !project) return

  await fuehreChatVorgangAus({
    laeuftBereits: () => Boolean(laufenderChatLauf),
    sperreSetzen: wert => {
      laufenderChatLauf = wert ? (laufenderChatLauf || { agentMessage: null, puffer: '', flushTimer: null }) : null
      refreshWorkspace() // Senden-Knopf sofort sichtbar deaktivieren (schliesst die Luecke aus Finding 1)
    },
    setzeStatus: setzeAgentStatus,
    verdichte: async () => {
      const plan = planVerlaufVerdichtung(message.thread, message.verlaufsNotiz || null)
      if (!plan) return
      try {
        const { daten } = await runTask('zusammenfassung', { anfrage: plan.verdichtungsEingabe })
        if (typeof daten === 'string' && daten.trim()) {
          message.verlaufsNotiz = { text: daten.trim(), bisMessageId: plan.bisMessageId, erstelltAt: Date.now() }
          ctx?.persist()
        }
      } catch {
        // Die Verdichtung ist Komfort: scheitert sie, läuft der Chat mit vollem Verlauf weiter.
      }
    },
    chatte: async () => {
      const hinweisBitte = !istBeispielProjekt(project) && erkenneHinweisBitte(anfrage)
      if (hinweisBitte) starteHinweislauf({ grund: 'chat' })

      const kontext = baueChatKontext({
        verstaendnis: ensureProjectUnderstanding(project),
        docText: dokumentText(),
        findings: doc.findings,
        doc,
        thread: message.thread.slice(0, -1), // der aktuelle Nutzer-Turn geht separat als `anfrage` mit
        verlaufsNotiz: message.verlaufsNotiz || null,
        anfrage,
        zusatzAnweisung: hinweisBitte
          ? 'Der Nutzer hat um eine Durchsicht gebeten. Ein Hinweislauf über den Text wurde soeben gestartet — erwähne kurz, dass du den Text jetzt durchgehst und dass Hinweise am Rand erscheinen, sobald etwas Belastbares dabei ist.'
          : null,
        onda: ondaQuellen(doc, project),
      })
      await fuehreChatLauf(message.thread, kontext)
    },
  })
}

// Startet den echten Chat-Lauf FÜR EIN FINDING an der Randkarte (Task C-3) — dieselbe
// Sperr-/Status-Disziplin wie sendeAgentenChat: fuehreChatVorgangAus setzt die Sperre SYNCHRON
// vor jedem await (kein zweiter, ungesicherter Pfad, kein doppelter bezahlter Lauf — siehe
// Fix-Runde 1 zu C-2, chat-kontext.mjs). laufenderChatLauf ist app-weit EIN Feld (siehe
// Deklaration oben) — ein laufendes Panel-Gespräch blockiert ein Randkarten-Gespräch und
// umgekehrt. Anders als sendeAgentenChat: keine Verlaufs-Verdichtung (Randkarten-Gespräche
// bleiben kurz, Findings kennen kein verlaufsNotiz-Feld) und keine Hinweisbitte-Erkennung —
// das Gespräch soll bei GENAU dieser Stelle bleiben (baueFindingZusatzAnweisung weist das
// Modell entsprechend an).
async function sendeLocalChat(finding, anfrage) {
  const doc = ctx.activeDoc()
  const project = dokumentProjekt(doc)
  if (!doc || !project) return

  await fuehreChatVorgangAus({
    laeuftBereits: () => Boolean(laufenderChatLauf),
    sperreSetzen: wert => {
      laufenderChatLauf = wert ? (laufenderChatLauf || { agentMessage: null, puffer: '', flushTimer: null }) : null
      refreshWorkspace() // Senden-Knopf an der Randkarte sofort sichtbar deaktivieren
    },
    setzeStatus: setzeAgentStatus,
    verdichte: async () => {},
    chatte: async () => {
      const kontext = baueChatKontext({
        verstaendnis: ensureProjectUnderstanding(project),
        docText: dokumentText(),
        findings: doc.findings,
        doc,
        thread: finding.thread.slice(0, -1), // der aktuelle Nutzer-Turn geht separat als `anfrage` mit
        anfrage,
        zusatzAnweisung: baueFindingZusatzAnweisung(finding),
        onda: ondaQuellen(doc, project),
      })
      await fuehreChatLauf(finding.thread, kontext)
    },
  })
}

// Echte Initiative-Quelle, additiv zum bestehenden Aura-/Pausen-Mechanismus: eine Nachricht
// in dieser Form haelt hasUnseenInitiative (Aura-Punkt) und scheduleAgentInitiative
// (Pausen-/Dismiss-Regeln, kein Fokus-Raub) unveraendert; nur die Quelle ist echt.
// Hinweis: Bereich H hat fuer denselben Zweck (echter Hinweislauf findet Grundursache oder
// Integritaetsthema) bereits eine eigene, gleichwertige interne Loesung (ergaenzeEchteInitiative
// in fuehreHinweislaufAus) — die war noetig, bevor dieser Hook hier existierte, und bleibt hier
// unangetastet (ausserhalb des Datei-Scopes von Task C-2). Dieser Export ist additiv fuer
// zukuenftige Aufrufer außerhalb dieses Moduls bzw. eine spaetere Konsolidierung.
export function meldeAgentInitiative(text, { earliestAt = Date.now() } = {}) {
  const workspace = activeWorkspace()
  if (!workspace || typeof text !== 'string' || !text.trim()) return null
  const message = {
    id: `initiative-${Date.now()}-${workspace.agent.messages.length}`,
    text: text.trim(),
    status: 'new',
    earliestAt,
    thread: [],
  }
  workspace.agent.messages.push(message)
  persistWorkspace()
  refreshWorkspace()
  return message
}

function renderEntscheidungsverlauf(workspace) {
  const doc = ctx?.activeDoc()
  if (!doc) return null
  const eintraege = entscheidungsEintraege(doc)
  if (!eintraege.length) return null

  const section = createNode('section', 'agent-decisions')
  section.setAttribute('aria-label', 'Entscheidungsverlauf')
  const offen = Boolean(workspace.agent.decisionsOpen)
  const toggle = createNode('button', 'agent-decisions-toggle')
  toggle.type = 'button'
  toggle.id = 'agentDecisionsToggle'
  toggle.setAttribute('aria-expanded', String(offen))
  toggle.setAttribute('aria-controls', 'agentDecisionsList')
  toggle.append(
    createNode('span', 'agent-decisions-title', 'Entscheidungsverlauf'),
    createNode('span', 'onda-badge agent-decisions-count', String(eintraege.length)),
    createNode('span', 'agent-decisions-disclosure', offen ? '↘' : '›'),
  )
  toggle.addEventListener('click', () => {
    workspace.agent.decisionsOpen = !workspace.agent.decisionsOpen
    persistWorkspace()
    refreshWorkspace()
  })
  section.append(toggle)

  if (offen) {
    const list = createNode('div', 'agent-decisions-list')
    list.id = 'agentDecisionsList'
    eintraege.forEach(eintrag => {
      const item = createNode('article', 'agent-decision')
      item.dataset.decisionId = eintrag.id
      const meta = createNode('div', 'agent-decision-meta')
      meta.append(
        createNode('span', `agent-decision-label is-${eintrag.art}`, eintrag.label),
        createNode('span', 'agent-decision-date', eintrag.datumText),
      )
      item.append(meta, createNode('p', 'agent-decision-short', eintrag.kurztext))
      if (eintrag.resultierenderWortlaut) {
        item.append(createNode('p', 'agent-decision-result', `Resultierender Wortlaut: ${eintrag.resultierenderWortlaut}`))
      }
      if (eintrag.begruendung) {
        item.append(createNode('p', 'agent-decision-reason', `Begründung: ${eintrag.begruendung}`))
      }
      list.append(item)
    })
    section.append(list)
  }
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

  const statusline = createNode('div', 'agent-statusline')
  statusline.id = 'agentStatusline'
  statusline.hidden = true
  ui.agentWidget.append(statusline)
  renderAgentStatuszeile()

  const unplaced = renderUnplacedFindingList()
  if (unplaced) ui.agentWidget.append(unplaced)

  const decisions = renderEntscheidungsverlauf(workspace)
  if (decisions) ui.agentWidget.append(decisions)

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
  send.disabled = Boolean(laufenderChatLauf)
  form.append(input, send)
  form.addEventListener('submit', event => {
    event.preventDefault()
    const text = input.value.trim()
    if (!text || laufenderChatLauf) return
    if (istInterviewAktiv()) {
      if (interviewLaufAktiv) return // ein Lauf zur Zeit; die Eingabe bleibt stehen
      input.value = ''
      sendeInterviewAntwort(message, text)
      return
    }
    // Echter, gestreamter Chat (Bereich C) — die Kulisse ist weg.
    input.value = ''
    appendThreadMessage(message.thread, 'user', text, Date.now())
    ctx.persist()
    refreshWorkspace()
    sendeAgentenChat(message, text)
  })
  ui.agentWidget.append(messages)
  if (interviewStatus) {
    ui.agentWidget.append(createNode(
      'p',
      'agent-widget-status',
      interviewStatus === 'laeuft' ? 'Agent denkt nach …' : interviewStatus,
    ))
  }
  ui.agentWidget.append(form)
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
  // Etappe-A-Guard (H-4): In echten Projekten zeigt das Belegfenster nur den
  // Hinweis-Kontext -- Demo-Quellen bleiben exklusiv im Beispielprojekt. Welche
  // Quellen sichtbar sind, entscheidet die reine, node-getestete Funktion
  // resolveEvidenceSources (workspace-model.mjs, siehe workspace-model.test.mjs).
  const istBeispielprojekt = istBeispielDokument(doc)
  const sichtbareQuellen = resolveEvidenceSources(finding.sources, istBeispielprojekt)
  sichtbareQuellen.forEach(source => {
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
      const copyLabel = verificationStatus === 'demo'
        ? 'Demo-Angabe kopieren'
        : verificationStatus === 'verified'
          ? 'Angabe kopieren'
          : 'Angabe erst nach Prüfung kopierbar'
      const copy = createNode('button', 'evidence-copy', copyLabel)
      copy.type = 'button'
      copy.dataset.copyCitation = ''
      copy.disabled = !exactClaim || verificationStatus === 'unverified'
      if (exactClaim && verificationStatus !== 'unverified') {
        copy.addEventListener('click', () => copyCitation(source.citation, verificationStatus))
      } else {
        copy.title = !exactClaim
          ? 'Erst verfügbar, wenn die zu belegende Aussage erfasst ist'
          : 'Erst nach Prüfung am Original verfügbar'
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
    sources.append(createNode('p', 'evidence-empty', istBeispielprojekt
      ? 'Für diese Aussage ist noch keine sichere direkte Quelle hinterlegt.'
      : 'Dieser Hinweis stützt sich allein auf deinen Text — Quellen sucht der Agent dafür noch nicht.'))
  }
  ui.evidenceWindow.append(sources)
  if (evidenceFocusRequest) {
    evidenceFocusRequest = false
    requestAnimationFrame(() => close.focus({ preventScroll: true }))
  }
}

// ---- Echte Hinweis-Läufe (Etappe A, Spec §5) -------------------------------
// Gate, Sperre, Kontextbau, runTask-Aufruf und Modellantwort-Verarbeitung stecken
// vollstaendig in versucheHinweislauf (hinweislauf-model.mjs, node-getestet, inkl.
// Kollisions- und Kontext-Drift-Schutz — Fix-Runde 1). Diese Funktionen hier sind die
// duenne ctx/DOM-Klammer: Dokument/Editor lesen, versucheHinweislauf aufrufen, Ergebnis
// in doc.findings + workspace.hinweislauf uebernehmen, Panel aktualisieren.

function istBeispielDokument(doc) {
  return doc?.projectId === EXAMPLE_PROJECT_ID
}

// Das Laufprotokoll traegt zweierlei: die Werte des LETZTEN Laufs (gestartet/verworfen/
// uebernommen -- die ueberschreibt jeder neue Lauf, so war es immer) und daneben die
// Summen ueber ALLE Laeufe dieses Dokuments. Die Summen sind neu und der Grund, warum es
// dieses Protokoll ueberhaupt gibt: Bisher schrieb Onda seine eigene Trefferquote mit und
// las davon nur die Signatur zur Entprellung. bilanziereRueckmeldung
// (rueckkopplung-model.mjs) wertet sie jetzt aus -- siehe rueckkopplungsDaten unten.
function hinweislaufProtokoll(workspace) {
  if (!workspace.hinweislauf || typeof workspace.hinweislauf !== 'object') {
    workspace.hinweislauf = {
      signatur: null,
      beendetAt: null,
      gestartet: 0,
      verworfen: 0,
      uebernommen: 0,
      fehler: null,
      laeufe: 0,
      summeGeliefert: 0,
      summeVerworfen: 0,
      summeUebernommen: 0,
    }
  }
  return workspace.hinweislauf
}

// Was Onda ueber die eigene Trefferquote weiss -- ueber ALLE eigenen Dokumente hinweg.
//
// Das Beispielprojekt bleibt bewusst draussen: Seine Hinweise sind vorgefertigt und seine
// Entscheidungen sind Probeklicks in einer Vorfuehrung. Sie als Vorlieben dieser Person zu
// lesen, waere schlicht falsch -- dieselbe Grenze, die schon istBeispielDokument im Gate
// zieht. Dokumente ohne Arbeitsflaeche (workspace) liefern nur ihre Findings; ein fehlendes
// Protokoll ist kein Fehler, sondern ein Dokument, in dem noch kein Lauf stattfand.
function rueckkopplungsDaten() {
  return (ctx?.state?.docs || [])
    .filter(doc => doc && doc.projectId !== EXAMPLE_PROJECT_ID)
    .map(doc => ({
      findings: doc.findings,
      decisions: doc.decisions,
      hinweislauf: doc.workspace?.hinweislauf || null,
    }))
}

// Echte Initiative-Quelle: nach einem Lauf mit Grundursache oder Integritätsthema
// entsteht eine Agenten-Nachricht. Anzeige-Gates (shouldOpenAgentWidget,
// hasUnseenInitiative, Dismiss-Regeln) bleiben unverändert die bestehenden — nur
// die Quelle wird echt (Spec §6: "die Quelle wird echt").
function ergaenzeEchteInitiative(workspace, finding, jetzt) {
  const offenVorhanden = workspace.agent.messages.some(message => (
    message.status === 'new' && !workspace.agent.dismissedIds.includes(message.id)
  ))
  if (offenVorhanden) return
  const text = finding.istGrundursache
    ? `Beim Lesen ist mir etwas Grundsätzliches aufgefallen: ${finding.short}`
    : `Ein Hinweis betrifft die Verlässlichkeit deines Textes: ${finding.short}`
  workspace.agent.messages.push({
    id: `initiative-${jetzt.toString(36)}`,
    status: 'new',
    earliestAt: jetzt,
    text,
    thread: [],
  })
}

// fuehreHinweislaufAus ist modulintern. Die drei Ausloeser aus Spec §5 rufen sie auf:
// Schreibpause ueber planeHinweislauf, Dokument-oeffnen ueber onViewChange/initWorkspace
// (H-3), und die Chat-Bitte ueber den bereits exportierten Hook starteHinweislauf.
//
// Die gesamte Ablauflogik (Gate, Sperre-vor-jedem-await, Kontext, runTask, Antwort-
// Verarbeitung) steckt in versucheHinweislauf (hinweislauf-model.mjs, node-getestet, u.a.
// gegen Kollision zweier Ausloeser und Dokument-/Projekt-Drift ueber den Schluessel-Check
// hinweg — Fix-Runde 1, Finding 1+2). Diese Funktion hier sammelt nur noch ctx-gebundene
// Werte SYNCHRON VOR dem Aufruf ein (Dokument-ID, Projekt ueber doc.projectId statt ueber
// den jederzeit verschiebbaren ctx.activeProjectObj()-Zeiger) und uebernimmt danach das
// Ergebnis in doc.findings + workspace.hinweislauf + Panel.
async function fuehreHinweislaufAus({ grund = 'pause' } = {}) {
  const doc = ctx?.activeDoc()
  const workspace = activeWorkspace()
  const blocks = doc ? getEditorBlocks(ctx.editor) : []
  const docText = doc ? baueDocText(blocks) : ''
  const protokoll = workspace ? hinweislaufProtokoll(workspace) : null
  const signatur = seedBodySignature(docText)
  if (doc) ensureReasoningModel(doc) // Selbstheilung wie decideFinding: doc.findings/decisions sicher als Arrays
  const docId = doc?.id ?? null
  // Ueber doc.projectId aufloesen (VOR jedem await erfasst), nicht ueber den
  // Startseiten-Zeiger -- siehe dokumentProjekt (Fix-Runde 1, Finding 2).
  const project = dokumentProjekt(doc)
  const verstaendnis = project ? ensureProjectUnderstanding(project) : null
  // Wie alle anderen Werte hier SYNCHRON vor dem Aufruf eingesammelt (Fix-Runde 1, Finding 2).
  const ondaWissen = ondaQuellen(doc, project)
  // Die Rueckkopplung: was bei dieser Person bisher getragen hat. Dokumentuebergreifend --
  // deshalb hier und nicht in versucheHinweislauf, das nur das aktuelle Dokument sieht.
  const rueckkopplung = bilanziereRueckmeldung({ dokumente: rueckkopplungsDaten() })

  const ergebnis = await versucheHinweislauf({
    hatDokument: Boolean(doc && workspace),
    istBeispielprojekt: istBeispielDokument(doc),
    verstaendnisOffen: verstaendnis ? istInterviewOffen(verstaendnis) : false,
    laeuftBereits: hinweislaufAktiv,
    docText,
    signatur,
    letzteSignatur: protokoll?.signatur ?? null,
    sperreSetzen: wert => { hinweislaufAktiv = wert },
    hatSchluessel,
    istNochDasselbeDokument: () => ctx.activeDoc()?.id === docId,
    // Fix-Runde 2, Finding 2b (Important): der Chat-Auslöser umging bisher die Monatsbremse
    // komplett (beansprucheKostenfreigabe:null -> versucheHinweislauf nimmt dann {erlaubt:true}
    // an, siehe hinweislauf-model.mjs). Die Oberfläche behauptet aber "Automatische Läufe sind
    // pausiert" OHNE Ausnahme für den Chat-Hinweislauf -- das war schlicht nicht wahr. Der
    // reine Chat (die Antwort des Agenten, sendeAgentenChat/fuehreChatLauf) ist davon NICHT
    // betroffen: das hier ist ausschliesslich der zusätzliche Hintergrund-Hinweislauf, den eine
    // Chat-Bitte ("schau mal drüber") zusätzlich anstößt (siehe starteHinweislauf-Aufruf in
    // sendeAgentenChat) -- genau der soll wie jeder andere automatische Lauf der Bremse
    // unterliegen; die Chat-Antwort selbst läuft unabhängig davon immer weiter.
    beansprucheKostenfreigabe: () => beansprucheAutomatikKosten('hinweis', { docId, grund }),
    verstaendnis,
    blocks,
    findings: doc?.findings,
    decisions: doc?.decisions,
    // Die Textart entscheidet, welche Hinweisarten Integritaetsfragen sind
    // (textart-regeln.mjs). Bei einem Plakattext ist eine fehlende Quellenangabe keine
    // Frage der Wahrhaftigkeit, und ihr Verwerfen kein "bewusst angenommenes Risiko".
    // Fehlt das Profil, bleibt es beim vorsichtigen Fall: alle vier binden.
    textart: project?.languageProfile?.genre || '',
    rueckkopplung,
    // Textsorte, Aussagen-Speicher und Gedaechtnis (onda-kontext.mjs) kommen hier eine Ebene
    // spaeter dazu als bei Interview und Chat: den Kontext dieses Kanals baut
    // versucheHinweislauf selbst (hinweislauf-model.mjs), und diese Datei kann ihm nichts
    // durchreichen. ergaenzeOndaKontext haengt die Bloecke HINTEN an kontext.volatiles — also
    // hinter Anweisung und Entscheidungsliste und weit hinter den gecachten Praefix, dessen
    // Stabilitaet damit unberuehrt bleibt. versucheHinweislauf ruft runTask genau einmal, mit
    // genau diesem Kontext; sobald hinweislauf-model.mjs einen onda-Parameter durchreicht,
    // faellt diese Klammer ersatzlos weg (baueHinweisKontext kennt ihn bereits).
    runTask: (task, kontext, optionen) => runTask(task, ergaenzeOndaKontext(kontext, ondaWissen), optionen),
    setzeAgentStatus,
  })

  if (!ergebnis.gestartet) {
    if (ergebnis.grund === 'monatsbudget-erreicht') {
      zeigeBudgetPause(workspace)
      persistWorkspace()
      refreshWorkspace()
    }
    return ergebnis // Gate/Dokumentwechsel/Budget hat blockiert -- nichts zu protokollieren
  }

  if (!ergebnis.erfolg) {
    // Spec §7: Schema-Muell/Abbruch -> Lauf verwerfen, still protokollieren, beim naechsten
    // Ausloeser neu. signatur bleibt unveraendert -> derselbe Text darf erneut versucht werden.
    Object.assign(protokoll, { beendetAt: Date.now(), fehler: ergebnis.fehler })
    ctx?.scheduleSave()
    return { gestartet: true, fehler: ergebnis.fehler }
  }

  ergebnis.uebernommen.forEach(finding => doc.findings.push(finding))
  Object.assign(protokoll, {
    signatur,
    beendetAt: ergebnis.zeit,
    gestartet: ergebnis.geliefertAnzahl,
    verworfen: ergebnis.verworfen,
    uebernommen: ergebnis.uebernommen.length,
    fehler: null,
    // Die Summen daneben, damit die Trefferquote nicht bei jedem Lauf vergessen wird.
    // Vorher standen hier nur die drei Werte des letzten Laufs, und jeder neue Lauf
    // ueberschrieb sie: Das Protokoll war eine Momentaufnahme, aus der sich nichts
    // ableiten liess. `|| 0` faengt alte, gespeicherte Arbeitsflaechen ohne diese Felder ab.
    laeufe: (Number(protokoll.laeufe) || 0) + 1,
    summeGeliefert: (Number(protokoll.summeGeliefert) || 0) + ergebnis.geliefertAnzahl,
    summeVerworfen: (Number(protokoll.summeVerworfen) || 0) + ergebnis.verworfen,
    summeUebernommen: (Number(protokoll.summeUebernommen) || 0) + ergebnis.uebernommen.length,
  })
  const initiativeAnlass = ergebnis.grundursache
    || ergebnis.uebernommen.find(finding => isIntegrityCategory(finding.category))
  if (initiativeAnlass) ergaenzeEchteInitiative(workspace, initiativeAnlass, ergebnis.zeit)
  ctx.scheduleSave()
  refreshWorkspace()
  return { gestartet: true, uebernommen: ergebnis.uebernommen.length, verworfen: ergebnis.verworfen }
}

// Chat-Bitte-Hook („schau nochmal drüber") — Bereich C ruft diese Funktion.
export function starteHinweislauf(optionen = {}) {
  return fuehreHinweislaufAus({ grund: optionen.grund || 'chat' })
}

// --- Zweiter Kanal: Erweiterungen -------------------------------------------
// Dieselbe duenne ctx/DOM-Klammer wie fuehreHinweislaufAus: alle Werte SYNCHRON vor
// dem Aufruf einsammeln, die Ablauflogik steckt in versucheErweiterungslauf
// (erweiterungslauf-model.mjs, node-getestet).
async function fuehreErweiterungslaufAus({ vonHand = false } = {}) {
  const doc = ctx?.activeDoc()
  const workspace = activeWorkspace()
  if (doc) ensureErweiterungen(doc)
  const blocks = doc ? getEditorBlocks(ctx.editor) : []
  const docText = doc ? baueDocText(blocks) : ''
  const docId = doc?.id ?? null
  const project = dokumentProjekt(doc)
  const verstaendnis = project ? ensureProjectUnderstanding(project) : null
  const ondaWissen = ondaQuellen(doc, project)

  const ergebnis = await versucheErweiterungslauf({
    hatDokument: Boolean(doc && workspace),
    istBeispielprojekt: istBeispielDokument(doc),
    verstaendnisOffen: verstaendnis ? istInterviewOffen(verstaendnis) : false,
    laeuftBereits: erweiterungslaufAktiv,
    docText,
    vonHand,
    sperreSetzen: wert => { erweiterungslaufAktiv = wert },
    hatSchluessel,
    istNochDasselbeDokument: () => ctx.activeDoc()?.id === docId,
    beansprucheKostenfreigabe: () => beansprucheAutomatikKosten('erweiterung', { docId, grund: vonHand ? 'hand' : 'aufschauen' }),
    verstaendnis,
    blocks,
    doc,
    // Dasselbe Buendel zweimal, mit Absicht und in beide Richtungen:
    //   - hier als onda, damit versucheErweiterungslauf daraus die Geschwistertexte ableitet
    //     und einen Anker, der in einem von ihnen steht, wiederfindet statt ihn zu verwerfen,
    //   - unten im runTask-Umschlag, damit dieselben Texte auch im Prompt stehen.
    // Beides muss aus DERSELBEN Quelle kommen: sonst zeigte der Prompt andere Texte, als die
    // Pruefung durchsucht, und jede Querverbindung fiele stillschweigend heraus.
    onda: ondaWissen,
    // Dieselbe Klammer wie im Hinweislauf: den Kontext baut versucheErweiterungslauf selbst
    // (erweiterungslauf-model.mjs), die Wissensbloecke kommen an der Uebergabestelle zum
    // Gateway hinten an die volatiles. Fuer diesen Kanal ist vor allem der Aussagen-Speicher
    // wichtig — eine Weiterfuehrung, die in einem anderen Text des Projekts schon steht, ist
    // keine Erweiterung, sondern eine Doppelung.
    runTask: (task, kontext, optionen) => runTask(task, ergaenzeOndaKontext(kontext, ondaWissen), optionen),
    setzeAgentStatus,
  })

  if (!ergebnis.gestartet) {
    if (ergebnis.grund === 'monatsbudget-erreicht') {
      zeigeBudgetPause(workspace)
      persistWorkspace()
      refreshWorkspace()
    }
    return ergebnis
  }
  if (!ergebnis.erfolg) return ergebnis

  // Nach JEDEM erfolgreichen Lauf, gleich welcher Ausloeser ihn startete -- genau wie
  // beim Hinweislauf, wo protokoll.signatur in fuehreHinweislaufAus selbst gesetzt wird.
  // Vorher stand die Fortschreibung nur im automatischen Zweig, und ein Lauf von Hand
  // setzte sie sogar auf null zurueck: dann sah der Zeitgeber 24 ms spaeter einen
  // unveraenderten Text mit unbekannter Signatur und bezahlte ihn ein zweites Mal.
  letzteErweiterungsSignatur = erweiterungsSignatur(docId, docText)
  ergebnis.uebernommen.forEach(erweiterung => doc.erweiterungen.push(erweiterung))
  // Bewusst KEIN ergaenzeEchteInitiative und keine Zahl irgendwo: eine Erweiterung
  // klopft nicht an. Sie liegt in der Seitenspalte, bis jemand hinschaut.
  ctx.scheduleSave()
  refreshWorkspace()
  return { gestartet: true, uebernommen: ergebnis.uebernommen.length, verworfen: ergebnis.verworfen }
}

function clearErweiterungslaufTimer() {
  if (erweiterungslaufTimer) { clearTimeout(erweiterungslaufTimer); erweiterungslaufTimer = null }
}

// Der Erweiterungslauf gehoert zum Moment des Aufschauens (momente-model.mjs).
// Er wird deshalb genau dann geplant, wenn die lange Ruhe erreicht ist -- nicht bei
// jeder Schreibpause. Ein Lauf je Textstand: die Signatur merkt sich, wozu schon
// gefragt wurde, damit dieselbe Ruhe nicht zweimal bezahlt wird.
let letzteErweiterungsSignatur = null

function erweiterungsSignatur(docId, docText) {
  return `${docId}:${seedBodySignature(docText)}`
}

function planeErweiterungslauf() {
  clearErweiterungslaufTimer()
  const docId = ctx?.activeDoc()?.id || null
  const inputState = initiativeInputState(docId)
  if (!docId || !inputState || !Number.isFinite(inputState.lastInputAt)) return
  if (erweiterungslaufAktiv || isComposing || !editorViewIsVisibleFor(docId)) return

  const restzeit = AUFSCHAUEN_MS - (Date.now() - inputState.lastInputAt)
  const generation = inputState.generation
  erweiterungslaufTimer = setTimeout(() => {
    erweiterungslaufTimer = null
    const aktuell = initiativeInputState(docId)
    if (!aktuell || aktuell.generation !== generation) return
    if (!editorViewIsVisibleFor(docId) || isComposing) return
    const signatur = erweiterungsSignatur(docId, baueDocText(getEditorBlocks(ctx.editor)))
    if (!darfAutomatischLaufen(signatur, letzteErweiterungsSignatur)) return
    fuehreErweiterungslaufAus({ vonHand: false })
  }, Math.max(24, restzeit))
}

// Von Hand: „Was faellt dir noch ein?" Jeder Moment muss auch gezogen werden koennen —
// proaktiv darf nicht heissen, warten zu muessen.
export function starteErweiterungslauf() {
  // Kein Zuruecksetzen der Signatur: der Weg von Hand fragt sie ohnehin nie ab
  // (nur der Zeitgeber tut das). Sie auf null zu setzen hiess, dem Zeitgeber
  // direkt danach denselben Text als unbekannt zu praesentieren.
  return fuehreErweiterungslaufAus({ vonHand: true })
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

function clearHinweislaufTimer() {
  if (hinweislaufTimer) clearTimeout(hinweislaufTimer)
  hinweislaufTimer = null
}

// Auslöser (a): dieselbe Pausen-Erkennung, die bisher nur die Attrappen-Anzeige fuetterte,
// stoesst jetzt den echten Lauf an. Die Entscheidung (ob + nach wie viel ms) liegt PUR und
// node-getestet in pruefePausenAusloeser (hinweislauf-model.mjs); hier werden nur die
// ctx/DOM-gebundenen Werte eingesammelt (Muster wie fuehreHinweislaufAus). Die autoritative
// Gate-Pruefung (inkl. Signatur, Beispielprojekt, Schluessel) bleibt zusaetzlich beim
// tatsaechlichen Start in fuehreHinweislaufAus/versucheHinweislauf -- diese Funktion vermeidet
// nur unnoetige Zeitgeber.
function planeHinweislauf() {
  clearHinweislaufTimer()
  const doc = ctx?.activeDoc()
  const docId = doc?.id || null
  const inputState = initiativeInputState(docId)
  const workspace = activeWorkspace()
  const entscheidung = pruefePausenAusloeser({
    hatDokument: Boolean(doc && workspace),
    istBeispielprojekt: istBeispielDokument(doc),
    laeuftBereits: hinweislaufAktiv,
    hatEingabeStatus: Boolean(inputState),
    lastInputAt: inputState?.lastInputAt,
    editorSichtbar: editorViewIsVisibleFor(docId),
    isComposing,
    leseSignatur: () => seedBodySignature(baueDocText(getEditorBlocks(ctx.editor))),
    letzteSignatur: workspace ? hinweislaufProtokoll(workspace).signatur : null,
    idleMs: AGENT_IDLE_MS,
  })
  if (!entscheidung.planen) return

  const scheduledGeneration = inputState.generation
  hinweislaufTimer = setTimeout(() => {
    hinweislaufTimer = null
    const currentInputState = initiativeInputState(docId)
    if (!currentInputState || currentInputState.generation !== scheduledGeneration) return
    if (!editorViewIsVisibleFor(docId) || isComposing) return
    fuehreHinweislaufAus({ grund: 'pause' })
  }, entscheidung.verzoegerungMs)
}

function scheduleAgentInitiative() {
  clearAgentInitiativeTimer()
  const docId = ctx?.activeDoc()?.id || null
  activateInitiativeDocument(docId)
  planeHinweislauf()
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

  const ui = elements()
  const project = dokumentProjekt(doc)
  const backLabel = ui.back?.querySelector('.onda-side-back-label')
  if (backLabel) backLabel.textContent = project?.name || 'Projekt'

  ui.view?.classList.toggle('is-agent-open', workspace.agent.open)
  ui.view?.classList.toggle('is-evidence-open', Boolean(workspace.evidenceFindingId))

  setLayerVisibility(ui.agentWidget, workspace.agent.open)
  ui.agentPresence?.setAttribute('aria-expanded', String(workspace.agent.open))
  applyAuraState()
  setLayerVisibility(ui.evidenceWindow, Boolean(workspace.evidenceFindingId))
  const localPaused = Boolean(workspace.agent.open || workspace.evidenceFindingId)
  ui.localLayer?.classList.toggle('is-paused', localPaused)
  ui.localLayer?.setAttribute('aria-hidden', String(localPaused))

  const activeBlockId = syncActiveBlock(workspace)
  if (decoratedDocId !== doc.id || decoratedBlockId !== activeBlockId) {
    decoratedDocId = doc.id
    decoratedBlockId = activeBlockId
    ctx.editor.view.dispatch(ctx.editor.state.tr.setMeta(activeBlockKey, activeBlockId))
  }

  pruefeVerstaendnisInterview()
  renderStructureNav()
  renderZurueckgehalten()
  renderErweiterungen()
  renderErkanntes()
  planeMomentwechsel()
  planeErweiterungslauf()
  renderProjectUnderstandingCard()
  renderMaterialEntry()
  syncThemeToggle()
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

  const closeTopLayer = () => {
    const workspace = activeWorkspace()
    if (!workspace) return false
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
    } else {
      return false
    }
    refreshWorkspace()
    persistWorkspace()
    return true
  }

  const instance = {
    activeDocumentId: null,
    inputByDocument: new Map(),
    destroyed: false,
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
    workspace.evidenceFindingId = null
    closeLocalDepth(workspace)
    closeInsertMenu({ restoreFocus: false })
    refreshWorkspace()
    persistWorkspace()
  }

  const applySidebarCollapsed = collapsed => {
    ui.view?.classList.toggle('is-sidebar-collapsed', collapsed)
    ui.collapse?.setAttribute('aria-expanded', String(!collapsed))
    ui.reopen?.setAttribute('aria-expanded', String(!collapsed))
    if (ui.reopen) ui.reopen.hidden = !collapsed
  }
  const setSidebarCollapsed = collapsed => {
    if (Boolean(ctx.state.settings.sidebarCollapsed) !== collapsed) {
      ctx.state.settings.sidebarCollapsed = collapsed
      ctx.persist()
    }
    applySidebarCollapsed(collapsed)
  }
  const onSidebarCollapse = () => setSidebarCollapsed(true)
  const onSidebarReopen = () => setSidebarCollapsed(false)
  applySidebarCollapsed(Boolean(ctx.state.settings.sidebarCollapsed))

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
    fuehreHinweislaufAus({ grund: 'oeffnen' })
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
  listen(ui.agentPresence, 'click', onAgentPresence)
  listen(ui.collapse, 'click', onSidebarCollapse)
  listen(ui.reopen, 'click', onSidebarReopen)
  listen(ctx.editor.view.dom, 'pointerover', onPointerOver)
  listen(ctx.editor.view.dom, 'pointerout', onPointerOut)
  listen(ctx.editor.view.dom, 'keydown', handleEditorKeyDown, true)
  listen(ctx.editor.view.dom, 'beforeinput', handleBeforeInput)
  listen(ctx.editor.view.dom, 'compositionstart', startComposition)
  listen(ctx.editor.view.dom, 'compositionend', endComposition)
  listen(ui.scroll, 'scroll', onEditorScroll, { passive: true })
  listen(ui.sidebar, 'scroll', onShelfScroll, { passive: true })
  listen(window, 'resize', onResize)
  listen(document, 'aiwt:viewchange', onViewChange)
  listen(document, 'visibilitychange', onVisibilityChange)
  listen(document.getElementById('title'), 'input', refreshWorkspace)
  listen(document.getElementById('pvCard'), 'click', event => openProjectUnderstandingModal(event.currentTarget))
  listen(document.getElementById('materialSources'), 'click', event => openProjectSourcesModal(event.currentTarget))
  listen(document.getElementById('themeToggle'), 'click', toggleTheme)
  listen(document.getElementById('accentToggle'), 'click', event => openAccentMenu(event.currentTarget))
  listen(document.getElementById('kiSettings'), 'click', event => openKiSettingsDialog(event.currentTarget))
  listenEditor('selectionUpdate', onSelectionUpdate)
  listenEditor('update', onEditorUpdate)

  // Status-Abo: Statuszeile und Aura folgen dem echten Agenten-Zustand.
  cleanups.push(beiAgentStatus(() => {
    renderAgentStatuszeile()
    applyAuraState()
  }))
  pruefeAgentVerbindung()

  instance.destroy = () => {
    if (instance.destroyed) return
    instance.destroyed = true
    clearAgentInitiativeTimer()
    clearHinweislaufTimer()
    clearErweiterungslaufTimer()
    clearMomentTimer()
    closeInsertMenu({ restoreFocus: false })
    closeOndaDialog({ restoreFocus: false })
    closeAccentMenu({ restoreFocus: false })
    cleanups.splice(0).reverse().forEach(cleanup => cleanup())

    clearTimeout(hoverTimer)
    clearTimeout(typingTimer)
    if (laufenderChatLauf?.flushTimer) clearTimeout(laufenderChatLauf.flushTimer)
    laufenderChatLauf = null
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
    structureNavState = null
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
    interviewPruefKey = null
    interviewLaufAktiv = false
    interviewStatus = null
    pausierterAutomatiklauf = null
  }

  window.__workspaceCloseTopLayer = closeTopLayer
  refreshWorkspace({ reconcileEditing: true })
  // Auslöser (b) beim Workspace-Aufbau selbst (z.B. Neuladen der App mitten im Dokument):
  // onViewChange greift nur bei einem ECHTEN 'aiwt:viewchange'-Ereignis (openDoc & Co.), nicht
  // beim initialen Aufbau der bereits aktiven Ansicht.
  if (editorViewIsVisibleFor(ctx.activeDoc()?.id)) fuehreHinweislaufAus({ grund: 'oeffnen' })
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
