import { Editor, Extension } from '@tiptap/core'
import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import { initUI, setSaveState, refreshSidebar, applySettings, focusTitle, showEditorView, showHomeView } from './ui.js'
import { __workspaceTestBridge, initWorkspace, refreshWorkspace } from './workspace.js'
import { ensureProjectUnderstanding, ensureReasoningModel } from './reasoning-model.mjs'
import { ensureWorkspaceState } from './workspace-model.mjs'
import { DEFAULT_SETTINGS, normalizeSettings } from './settings-model.mjs'
import { BlockIdentity, ensureTopLevelBlockIds, getActiveBlockId, getEditorBlocks, insertSemanticBlock, replaceAnchoredText, replaceAnchoredTexts, replaceFindingTarget } from './block-identity.js'
import { buildExampleStructure, buildExampleNarrative, buildExampleCoach, buildExampleLane, buildExampleBody, buildExampleMaterial, buildExampleUnderstanding, buildExampleAgentMessages } from './example.js'
import { EXAMPLE_PROJECT_ID, migrateExampleSeed } from './example-seed.mjs'
import { initGateway, runTask, hatSchluessel, setzeSchluessel, loescheSchluessel } from './agent-gateway.mjs'
import { ensureProjectEvidenceShape } from './source-model.mjs'
import { ensureProjectResearchShape } from './research-run.mjs'
import { ensureMemoryStore, ensureProjectMemoryShape } from './memory-model.mjs'
import { synchronizeProjectMemory } from './memory-dossier.mjs'
import { ensureArgumentModel } from './argument-model.mjs'
import { ensureLanguageProfile } from './language-profile.mjs'
import { ensureLanguageReportStore } from './language-report.mjs'
import { ensureFinalAuditStore } from './final-audit.mjs'
import { emptyLocalState } from './data-control.mjs'

// ---------- Sanfte Markierung (Peripherie): eine flüchtige Dekoration ----------
// Zeigt eine Passage kurz an, OHNE das Dokument zu ändern — sie wird nicht
// gespeichert, landet nicht im Rückgängig-Verlauf und kollidiert nicht mit der
// gelben Nutzer-Markierung. (Der frühere Fehler: echtes Highlight ins Dokument.)
const cueKey = new PluginKey('aiwtCue')
const Cue = Extension.create({
  name: 'aiwtCue',
  addProseMirrorPlugins() {
    return [new Plugin({
      key: cueKey,
      state: {
        init() { return DecorationSet.empty },
        apply(tr, old) {
          const meta = tr.getMeta(cueKey)
          if (meta !== undefined) {
            if (!meta) return DecorationSet.empty
            return DecorationSet.create(tr.doc, [Decoration.inline(meta.from, meta.to, { class: 'cue-mark' })])
          }
          return old.map(tr.mapping, tr.doc)
        },
      },
      props: { decorations(state) { return cueKey.getState(state) } },
    })]
  },
  addCommands() {
    return {
      setCue: range => ({ tr, dispatch }) => { if (dispatch) dispatch(tr.setMeta(cueKey, range)); return true },
      clearCue: () => ({ tr, dispatch }) => { if (dispatch) dispatch(tr.setMeta(cueKey, null)); return true },
    }
  },
})

// ---------- Zustand & Speicher ----------
const NATIVE = !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.store)
const DEFAULTS = DEFAULT_SETTINGS
const TRASH_DAYS = 30
const SCHEMA = 12
const EX_VERSION = 9

// Schmaler Rückkanal der nativen saveimg-Brücke. Der frühere Bildeditor ist
// nicht mehr Teil der Onda-Oberfläche; die Mac-Startprobe prüft diesen
// Infrastrukturvertrag weiterhin, damit Scheme-Handler und JS↔Swift-Rückruf
// nicht unbemerkt veralten.
const imgPending = Object.create(null)
window.__imgSaved__ = function (reqId, url) {
  const callback = imgPending[reqId]
  if (!callback) return
  delete imgPending[reqId]
  callback(url)
}

export const state = {
  docs: [],
  active: null,
  projects: [],
  activeProject: null,
  settings: { ...DEFAULTS },
  memoryStore: ensureMemoryStore(null),
  editor: null,
  native: NATIVE,
}

// Schmale Test-Bridge fuer zustandsbehaftete ProseMirror-Regressionstests.
// Sie exportiert keine UI und bleibt ausserhalb des produktiven Bedienflusses.
export const __blockIdentityTestBridge = {
  setContent(content, ensureIds = true) {
    state.editor.commands.setContent(content, false)
    if (ensureIds) ensureTopLevelBlockIds(state.editor)
  },
  ensureTopLevelBlockIds() { return ensureTopLevelBlockIds(state.editor) },
  getBlocks() { return getEditorBlocks(state.editor) },
  getActiveBlockId() { return getActiveBlockId(state.editor) },
  insertSemanticBlock(afterBlockId, semanticRole) {
    return insertSemanticBlock(state.editor, afterBlockId, semanticRole)
  },
  getJSON() { return state.editor.getJSON() },
  replaceFindingTarget(target, replacement, blockId = null) {
    return replaceFindingTarget(state.editor, target, replacement, blockId)
  },
  replaceAnchoredText(target) {
    return replaceAnchoredText(state.editor, target)
  },
  replaceAnchoredTexts(targets) {
    return replaceAnchoredTexts(state.editor, targets)
  },
}

export { __workspaceTestBridge }
export { setzeTransportFuerTests } from './agent-gateway.mjs'

function uid() { return 'd' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36) }
function now() { return Date.now() }
export function docTitle(d) { return (d && d.title && d.title.trim()) ? d.title.trim() : 'Ohne Titel' }
export function activeDoc() { return state.docs.find(d => d.id === state.active) }

// Ein Text trägt seine Struktur, seine Erzählfäden, Coach- und Formulierungs-Karten
// und den Zustand seiner Leisten bei sich — alles wird mitgespeichert.
function ensureDocShape(d) {
  if (!Array.isArray(d.structure)) d.structure = []
  if (!Array.isArray(d.narrative)) d.narrative = []
  if (!Array.isArray(d.coach)) d.coach = []
  if (!Array.isArray(d.lane)) d.lane = []
  if (!d.panels || typeof d.panels !== 'object') d.panels = { struct: false, coach: false, lane: false }
  if (!d.provenance || typeof d.provenance !== 'object' || Array.isArray(d.provenance)) {
    d.provenance = { actor: 'user', action: 'document-create', createdAt: Number.isFinite(d.updated) ? d.updated : now() }
  }
  // Jeder Erzählfaden hat eine feste Farbe (Index in der Faden-Palette).
  d.narrative.forEach((t, i) => { if (t.color == null) t.color = i })
  // Alt-Notizen ohne Anker: den Baustein aus dem Titel „… (Baustein)" erkennen
  // und daran heften (dann steht die Notiz in ihrer Zeile statt bei „ohne Baustein").
  d.narrative.forEach(t => (t.steps || []).forEach(s => {
    if (!s.blockId && s.h) {
      const m = /\(([^)]+)\)\s*$/.exec(s.h)
      if (m) { const b = findBlockByTitle(d.structure, m[1].trim()); if (b) { s.blockId = b.id; s.h = s.h.replace(/\s*\([^)]+\)\s*$/, '').trim() } }
    }
  }))
  // Anmerkungen: Standard-Art ist Formulierung.
  d.lane.forEach(c => { if (!c.kind) c.kind = 'form' })
  ensureReasoningModel(d)
  ensureWorkspaceState(d)
  return d
}
function findBlockByTitle(list, title) {
  for (const b of list) {
    if ((b.title || '').trim() === title) return b
    const r = findBlockByTitle(b.children || [], title); if (r) return r
  }
  return null
}
// Ein Projekt trägt sein Material (Canvas) — geteilt über alle Texte des Projekts.
function ensureProjectShape(p) {
  if (!Array.isArray(p.material)) p.material = []
  ensureProjectEvidenceShape(p)
  ensureProjectResearchShape(p)
  ensureProjectMemoryShape(p)
  ensureArgumentModel(p)
  ensureLanguageProfile(p)
  ensureLanguageReportStore(p)
  ensureFinalAuditStore(p)
  ensureProjectUnderstanding(p)
  return p
}

function newDocRaw() {
  const d = ensureDocShape({ id: uid(), title: '', body: '', updated: now(), projectId: state.activeProject || (state.projects[0] && state.projects[0].id) })
  state.docs.push(d); state.active = d.id
  return d
}

// ---------- Projekt-Operationen ----------
export function newProject(name) {
  const p = ensureProjectShape({ id: 'p' + Math.random().toString(36).slice(2, 8), name: name || 'Neues Projekt', created: now() })
  state.projects.push(p)
  state.activeProject = p.id
  persist()
  return p
}
export function renameProject(id, name) {
  const p = state.projects.find(x => x.id === id); if (!p) return
  p.name = (name || '').trim() || p.name
  persist()
}
export function openProject(id) {
  if (!state.projects.some(p => p.id === id)) return
  state.activeProject = id
  persist()
}
export function activeProjectObj() { return state.projects.find(p => p.id === state.activeProject) }

export function purgeTrash() {
  const cutoff = now() - TRASH_DAYS * 24 * 3600 * 1000
  state.docs = state.docs.filter(d => !(d.trashed && (d.trashedAt || 0) < cutoff))
}

function load() {
  let d = null
  if (NATIVE) {
    d = window.__NATIVE_DATA__
  } else {
    try { d = JSON.parse(localStorage.getItem('aiwt.v2') || 'null') } catch (e) {}
    if (!d) {
      try {
        const old = JSON.parse(localStorage.getItem('aiwt.docs.v1') || 'null')
        if (old) d = { docs: old, active: localStorage.getItem('aiwt.active.v1') }
      } catch (e) {}
    }
  }
  state.docs = (d && Array.isArray(d.docs)) ? d.docs : []
  state.active = d ? d.active : null
  state.settings = normalizeSettings(d && d.settings)
  state.memoryStore = ensureMemoryStore(d && d.memoryStore)
  // Projekte: bestehende Texte wandern in ein Standard-Projekt (Migration).
  state.projects = (d && Array.isArray(d.projects) && d.projects.length) ? d.projects : []
  if (!state.projects.length) {
    state.projects = [{ id: 'p-default', name: 'Meine Texte', created: now() }]
  }
  state.docs.forEach(x => {
    if (!x.projectId || !state.projects.some(p => p.id === x.projectId)) x.projectId = state.projects[0].id
  })
  // Struktur/Narrative/Material sind neu (Schema 3) — bestehende Texte bekommen leere Felder,
  // das „Calm Technology"-Beispiel wandert einmalig in ein eigenes, echtes Projekt.
  state.projects.forEach(ensureProjectShape)
  state.docs.forEach(ensureDocShape)
  migrateExampleSeed({
    docs: state.docs,
    projects: state.projects,
    settings: state.settings,
    targetVersion: EX_VERSION,
    legacyBody: buildExampleBody(),
    createProject: buildExampleProjectSeed,
    createSeed: buildExampleDocumentSeed,
  })
  state.activeProject = (d && d.activeProject && state.projects.some(p => p.id === d.activeProject))
    ? d.activeProject : state.projects[0].id
  purgeTrash()
  if (!state.docs.some(x => !x.trashed)) newDocRaw()
  if (!state.docs.some(x => x.id === state.active && !x.trashed)) {
    state.active = state.docs.find(x => !x.trashed).id
  }
}

// Legt „Beispiel: Calm Technology" als vollständiges, editierbares Projekt an —
// einmalig, klar als Beispiel benannt, jederzeit löschbar. Kein Mock über echten Texten.
function buildExampleProjectSeed() {
  const project = ensureProjectShape({
    id: EXAMPLE_PROJECT_ID,
    name: 'Beispiel: Calm Technology',
    created: now(),
    example: true,
    understanding: buildExampleUnderstanding(),
  })
  project.material = buildExampleMaterial()
  return project
}

function buildExampleDocumentSeed() {
  const struct = buildExampleStructure()
  return ensureDocShape({
    id: uid(), title: 'Calm Technology', body: buildExampleBody(), updated: now(), projectId: EXAMPLE_PROJECT_ID,
    structure: struct, narrative: buildExampleNarrative(struct),
    coach: buildExampleCoach(), lane: buildExampleLane(),
    provenance: { actor: 'demo', action: 'example-seed', createdAt: now() },
    workspace: { agent: { messages: buildExampleAgentMessages() } },
  })
}

let ackPending = false
let replacingPersistedState = false
function synchronizeAllProjectMemory() {
  state.projects.forEach(project => {
    const result = synchronizeProjectMemory({
      project,
      docs: state.docs,
      store: state.memoryStore,
    })
    state.memoryStore = result.store
    project.memory = result.projectMemory
  })
}

export function persist() {
  synchronizeAllProjectMemory()
  const payload = JSON.stringify({
    schemaVersion: SCHEMA,
    docs: state.docs, active: state.active,
    projects: state.projects, activeProject: state.activeProject,
    settings: state.settings,
    memoryStore: state.memoryStore,
  })
  if (NATIVE) {
    ackPending = true
    try { window.webkit.messageHandlers.store.postMessage(payload) }
    catch (e) { ackPending = false; setSaveState('error') }
  } else {
    try { localStorage.setItem('aiwt.v2', payload); setSaveState('saved') }
    catch (e) { setSaveState('error') }
  }
}
window.__nativeSaveOk__ = function () { ackPending = false; setSaveState('saved') }
window.__nativeSaveFail__ = function () { ackPending = false; setSaveState('error') }

let saveTimer = null
export function scheduleSave() {
  setSaveState('saving')
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(flushSave, 400)
}
export function flushSave() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
  saveCurrent()
  persist()
  refreshSidebar()
}
function saveCurrent() {
  const d = activeDoc()
  if (!d || !state.editor) return
  const t = document.getElementById('title')
  const title = t ? t.value : d.title
  const body = state.editor.getHTML()
  if (title === d.title && body === d.body) return
  d.title = title
  d.body = body
  d.updated = now()
}

export function autoGrowTitle() {
  const t = document.getElementById('title')
  if (!t) return
  t.style.height = '0px'
  t.style.height = t.scrollHeight + 'px'
}

// ---------- Dokument-Operationen ----------
// Grundregel: flushSave() nur solange state.active noch zum DOM-Inhalt passt.
// showDoc() lädt danach ohne erneutes Speichern des alten Zustands.
function showDoc(id) {
  state.active = id
  const d = activeDoc()
  const t = document.getElementById('title')
  if (t) { t.value = d.title || '' }
  autoGrowTitle()
  state.editor.commands.setContent(d.body || '', false)
  ensureTopLevelBlockIds(state.editor)
  // Undo-History leeren: ⌘Z darf nie Inhalte eines anderen Dokuments zurückholen.
  state.editor.view.updateState(EditorState.create({
    doc: state.editor.state.doc,
    plugins: state.editor.state.plugins,
  }))
  refreshWorkspace({ reconcileEditing: true })
  persist()
  refreshSidebar()
}
export function openDoc(id) {
  const target = state.docs.find(x => x.id === id)
  if (target && target.projectId) state.activeProject = target.projectId
  if (id !== state.active) {
    flushSave()
    showDoc(id)
  } else {
    persist()
    refreshSidebar()
    refreshWorkspace({ reconcileEditing: true })
  }
  showEditorView()
  state.editor.commands.focus()
}
export function newDoc() {
  flushSave()
  const d = ensureDocShape({ id: uid(), title: '', body: '', updated: now(), projectId: state.activeProject })
  state.docs.push(d)
  showDoc(d.id)
  showEditorView()
  focusTitle()
}
export function duplicateDoc(id) {
  flushSave()
  const src = state.docs.find(x => x.id === id); if (!src) return
  // Eine Kopie erbt auch die Struktur, die Erzählfäden und die Hinweise des Textes.
  const clone = obj => JSON.parse(JSON.stringify(obj || []))
  const copy = ensureDocShape({
    id: uid(), title: (src.title ? src.title + ' Kopie' : 'Kopie'), body: src.body, updated: now(), projectId: src.projectId,
    structure: clone(src.structure), narrative: clone(src.narrative), coach: clone(src.coach), lane: clone(src.lane),
    findings: clone(src.findings), decisions: clone(src.decisions),
    panels: Object.assign({ struct: false, coach: false, lane: false }, src.panels),
  })
  state.docs.push(copy)
  showDoc(copy.id)
  showEditorView()
}
export function trashDoc(id) {
  const d = state.docs.find(x => x.id === id); if (!d) return
  if (id === state.active) flushSave()
  d.trashed = true; d.trashedAt = now()
  if (!state.docs.some(x => !x.trashed)) {
    state.docs.push(ensureDocShape({ id: uid(), title: '', body: '', updated: now(), projectId: state.activeProject }))
  }
  if (state.active === id) {
    showDoc(state.docs.find(x => !x.trashed).id)
  } else {
    persist(); refreshSidebar()
  }
}
export function restoreDoc(id) {
  const d = state.docs.find(x => x.id === id); if (!d) return
  flushSave()
  d.trashed = false; delete d.trashedAt
  showDoc(id)
}
export function deleteForever(id) {
  const wasActive = state.active === id
  if (!wasActive) flushSave()
  state.docs = state.docs.filter(x => x.id !== id)
  if (!state.docs.some(x => !x.trashed)) {
    state.docs.push(ensureDocShape({ id: uid(), title: '', body: '', updated: now(), projectId: state.activeProject }))
  }
  if (wasActive) {
    showDoc(state.docs.find(x => !x.trashed).id)
  } else {
    persist(); refreshSidebar()
  }
}

// ---------- Markdown-Export ----------
function inlineMd(node) {
  let out = ''
  node.childNodes.forEach(n => {
    if (n.nodeType === 3) { out += n.nodeValue; return }
    if (n.nodeType !== 1) return
    const tag = n.tagName.toLowerCase()
    if (tag === 'strong' || tag === 'b') out += '**' + inlineMd(n) + '**'
    else if (tag === 'em' || tag === 'i') out += '*' + inlineMd(n) + '*'
    else if (tag === 'u') out += inlineMd(n)
    else if (tag === 's' || tag === 'strike' || tag === 'del') out += '~~' + inlineMd(n) + '~~'
    else if (tag === 'code') out += '`' + inlineMd(n) + '`'
    else if (tag === 'a') out += '[' + inlineMd(n) + '](' + (n.getAttribute('href') || '') + ')'
    else if (tag === 'img') out += '![](' + (n.getAttribute('src') || '') + ')'
    else if (tag === 'br') out += '\n'
    else out += inlineMd(n)
  })
  return out
}
function blockMd(node) {
  let out = ''
  node.childNodes.forEach(n => {
    if (n.nodeType !== 1) { const t = (n.nodeValue || '').trim(); if (t) out += t + '\n\n'; return }
    const tag = n.tagName.toLowerCase()
    if (tag === 'h1') out += '# ' + inlineMd(n).trim() + '\n\n'
    else if (tag === 'h2') out += '## ' + inlineMd(n).trim() + '\n\n'
    else if (tag === 'h3') out += '### ' + inlineMd(n).trim() + '\n\n'
    else if (tag === 'blockquote') out += '> ' + blockMd(n).trim().replace(/\n/g, '\n> ') + '\n\n'
    else if (tag === 'pre') out += '```\n' + n.textContent.replace(/\n$/, '') + '\n```\n\n'
    else if (tag === 'hr') out += '---\n\n'
    else if (tag === 'img') out += '![](' + (n.getAttribute('src') || '') + ')\n\n'
    else if (tag === 'ul' && n.getAttribute('data-type') === 'taskList') {
      n.querySelectorAll(':scope > li').forEach(li => {
        const checked = li.getAttribute('data-checked') === 'true'
        const content = li.querySelector(':scope > div') || li
        out += (checked ? '- [x] ' : '- [ ] ') + inlineMd(content).trim() + '\n'
      })
      out += '\n'
    }
    else if (tag === 'ul') { n.querySelectorAll(':scope > li').forEach(li => { out += '- ' + blockMd(li).trim().replace(/\n\n/g, '\n  ') + '\n' }); out += '\n' }
    else if (tag === 'ol') { let i = 1; n.querySelectorAll(':scope > li').forEach(li => { out += (i++) + '. ' + blockMd(li).trim().replace(/\n\n/g, '\n   ') + '\n' }); out += '\n' }
    else if (tag === 'p' || tag === 'div') { const c = inlineMd(n).trim(); if (c) out += c + '\n\n' }
    else { const x = inlineMd(n).trim(); if (x) out += x + '\n\n' }
  })
  return out
}
export function exportMd() {
  flushSave()
  const d = activeDoc(); if (!d) return
  const el = document.querySelector('#editor .ProseMirror'); if (!el) return
  const md = '# ' + docTitle(d) + '\n\n' + blockMd(el).trim() + '\n'
  const fname = (docTitle(d).replace(/[^\wäöüÄÖÜß \-]/g, '').trim() || 'text') + '.md'
  if (NATIVE && window.webkit.messageHandlers.exportmd) {
    window.webkit.messageHandlers.exportmd.postMessage(JSON.stringify({ filename: fname, content: md }))
    return
  }
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = fname
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export function downloadFile(filename, content, mime = 'text/plain;charset=utf-8') {
  const safeFilename = String(filename || 'export.txt').replace(/[\/\\\0]/g, '-')
  const safeContent = String(content ?? '')
  if (NATIVE && window.webkit.messageHandlers.exportmd) {
    window.webkit.messageHandlers.exportmd.postMessage(JSON.stringify({
      filename: safeFilename,
      content: safeContent,
      mime,
    }))
    return
  }
  const blob = new Blob([safeContent], { type: mime })
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(blob)
  anchor.download = safeFilename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000)
}

function replacePersistedState(nextState) {
  replacingPersistedState = true
  const payload = JSON.stringify(nextState)
  if (NATIVE) {
    window.webkit.messageHandlers.store.postMessage(payload)
    window.__NATIVE_DATA__ = nextState
  } else {
    localStorage.setItem('aiwt.v2', payload)
  }
  setTimeout(() => window.location.reload(), NATIVE ? 250 : 0)
}

export async function importLocalState(nextState) {
  replacePersistedState(nextState)
}

export async function deleteAllLocalData() {
  await loescheSchluessel()
  if (!NATIVE) {
    localStorage.removeItem('aiwt.v2')
    localStorage.removeItem('aiwt.docs.v1')
    localStorage.removeItem('aiwt.active.v1')
  }
  replacePersistedState(emptyLocalState())
}

// ---------- Start ----------
export function boot() {
  load()

  state.editor = new Editor({
    element: document.getElementById('editor'),
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bold: false,
        italic: false,
        strike: false,
        code: false,
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: 'Schreib hier los — „/“ für Befehle …' }),
      CharacterCount,
      Typography,
      BlockIdentity,
      Cue,
    ],
    content: (activeDoc() && activeDoc().body) || '',
    editorProps: {
      handleDrop(view, event) {
        // Baustein aus dem Struktur-Panel: Inhalt als Absatz an der Zielstelle einfügen.
        const block = event.dataTransfer && event.dataTransfer.getData('application/x-baustein')
        if (block) {
          event.preventDefault()
          const posInfo = view.posAtCoords({ left: event.clientX, top: event.clientY })
          const safe = block.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          if (posInfo) state.editor.chain().focus().insertContentAt(posInfo.pos, '<p>' + safe + '</p>').run()
          else state.editor.chain().focus('end').insertContent('<p>' + safe + '</p>').run()
          scheduleSave()
          return true
        }
        return false
      },
    },
    onUpdate({ editor }) {
      ensureTopLevelBlockIds(editor)
      scheduleSave()
    },
  })

  ensureTopLevelBlockIds(state.editor)

  // KI-Verteiler: liest settings für die Verbrauchszählung, speichert über persist.
  // Der Transport wird je Aufruf gewählt (Mac-Brücke, sonst Browser-Direktweg).
  initGateway({ getSettings: () => state.settings, persist })

  const ctx = {
    editor: state.editor, state,
    ops: { newDoc, openDoc, duplicateDoc, trashDoc, restoreDoc, deleteForever, newProject, renameProject, openProject },
    persist, scheduleSave, flushSave, exportMd, downloadFile, importLocalState, deleteAllLocalData,
    docTitle, activeDoc, autoGrowTitle, activeProjectObj, showHomeView,
    gateway: { runTask, hatSchluessel, setzeSchluessel, loescheSchluessel },
  }
  initUI(ctx)
  initWorkspace(ctx)
  applySettings()
  refreshSidebar()

  const t = document.getElementById('title')
  if (t) { t.value = activeDoc().title || '' }
  autoGrowTitle()
  requestAnimationFrame(autoGrowTitle)
  window.addEventListener('resize', autoGrowTitle)

  window.__flushForQuit__ = flushSave
  window.__newDocFromMenu__ = newDoc
  window.__exportFromMenu__ = exportMd

  if (!NATIVE) {
    window.addEventListener('beforeunload', () => { if (!replacingPersistedState) flushSave() })
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !replacingPersistedState) flushSave()
    })
  }

  // Selbsttest-Modus der Mac-App
  if (NATIVE && window.__PROBE__ && window.webkit.messageHandlers.probe) {
    setTimeout(() => {
      let imgBridge = false
      const done = () => {
        persist()
        setTimeout(() => {
          window.webkit.messageHandlers.probe.postMessage(JSON.stringify({
            docCount: state.docs.length,
            firstTitle: docTitle(state.docs[0]),
            activeOk: !!activeDoc(),
            ackOk: !ackPending,
            editorOk: !!state.editor && state.editor.isEditable,
            imgBridge,
            storageOk: true,
          }))
        }, 500)
      }
      if (window.webkit.messageHandlers.saveimg) {
        const reqId = 'probe-img'
        imgPending[reqId] = (url) => { imgBridge = !!(url && url.indexOf('aiwt-img://') === 0); done() }
        window.webkit.messageHandlers.saveimg.postMessage(JSON.stringify({
          id: reqId, ext: 'png',
          dataBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        }))
        setTimeout(() => { if (imgPending[reqId]) { delete imgPending[reqId]; done() } }, 1500)
      } else { done() }
    }, 300)
  }
}
