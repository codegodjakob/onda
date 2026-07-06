import { Editor, Extension } from '@tiptap/core'
import { EditorState, Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import { initUI, setSaveState, refreshSidebar, applySettings, focusTitle, showEditorView } from './ui.js'
import { initPanels, refreshAllPanels } from './panels.js'
import { initStructure } from './structure.js'
import { buildExampleStructure, buildExampleNarrative, buildExampleCoach, buildExampleLane, buildExampleBody, buildExampleMaterial } from './example.js'

// ---------- Schriftgröße pro Auswahl (Word-granular) ----------
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [{
      types: ['textStyle'],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: el => el.style.fontSize || null,
          renderHTML: attrs => attrs.fontSize ? { style: `font-size:${attrs.fontSize}` } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setFontSize: size => ({ chain }) => chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

// ---------- Bild mit einstellbarer Breite ----------
const ImageX = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: el => el.style.width || null,
        renderHTML: attrs => attrs.width ? { style: `width:${attrs.width}` } : {},
      },
    }
  },
})

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

// ---------- KI-Anmerkungen: dauerhaft sichtbare, aber NICHT gespeicherte Markierungen ----------
// Formulierung (blau, welliger Strich) und Inhalt (grün, sanfte Fläche) — als
// Dekoration aus den Anmerkungsdaten abgeleitet, nie Teil des Dokuments.
const annoKey = new PluginKey('aiwtAnno')
const Annos = Extension.create({
  name: 'aiwtAnnos',
  addProseMirrorPlugins() {
    return [new Plugin({
      key: annoKey,
      state: {
        init() { return DecorationSet.empty },
        apply(tr, old) {
          const meta = tr.getMeta(annoKey)
          if (meta !== undefined) {
            if (!meta || !meta.length) return DecorationSet.empty
            const decos = meta.map(r => Decoration.inline(r.from, r.to, {
              class: 'anno-mark anno-' + r.kind + (r.hi ? ' anno-hi' : ''),
            }))
            return DecorationSet.create(tr.doc, decos)
          }
          return old.map(tr.mapping, tr.doc)
        },
      },
      props: { decorations(state) { return annoKey.getState(state) } },
    })]
  },
  addCommands() {
    return {
      setAnnos: ranges => ({ tr, dispatch }) => { if (dispatch) dispatch(tr.setMeta(annoKey, ranges)); return true },
    }
  },
})

// ---------- Zustand & Speicher ----------
const NATIVE = !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.store)
const DEFAULTS = { theme: 'auto', fontSize: 17, lineWidth: 720, font: 'serif', spellcheck: false, showWords: true, structWidth: 620 }
const TRASH_DAYS = 30
const SCHEMA = 3

export const state = { docs: [], active: null, projects: [], activeProject: null, settings: { ...DEFAULTS }, editor: null, native: NATIVE }

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
  return p
}

function newDocRaw() {
  const d = ensureDocShape({ id: uid(), title: '', body: '', updated: now(), projectId: state.activeProject || (state.projects[0] && state.projects[0].id) })
  state.docs.push(d); state.active = d.id
  return d
}

// ---------- Projekt-Operationen ----------
export function newProject(name) {
  const p = { id: 'p' + Math.random().toString(36).slice(2, 8), name: name || 'Neues Projekt', created: now() }
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
  state.settings = Object.assign({}, DEFAULTS, (d && d.settings) || {})
  // Panel-Breite gegen kaputte/fremde Werte absichern.
  state.settings.structWidth = Math.max(360, Math.min(940, +state.settings.structWidth || 560))
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
  const version = (d && d.schemaVersion) || 0
  if (!state.settings.exampleSeeded) {
    seedExampleProject()
    state.settings.exampleSeeded = true
  }
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
function seedExampleProject() {
  const proj = ensureProjectShape({ id: 'p-example', name: 'Beispiel: Calm Technology', created: now(), example: true })
  proj.material = buildExampleMaterial()
  state.projects.push(proj)
  const struct = buildExampleStructure()
  state.docs.push(ensureDocShape({
    id: uid(), title: 'Calm Technology', body: buildExampleBody(), updated: now(), projectId: proj.id,
    structure: struct, narrative: buildExampleNarrative(struct),
    coach: buildExampleCoach(), lane: buildExampleLane(),
  }))
}

let ackPending = false
export function persist() {
  const payload = JSON.stringify({
    schemaVersion: SCHEMA,
    docs: state.docs, active: state.active,
    projects: state.projects, activeProject: state.activeProject,
    settings: state.settings,
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
  // Undo-History leeren: ⌘Z darf nie Inhalte eines anderen Dokuments zurückholen.
  state.editor.view.updateState(EditorState.create({
    doc: state.editor.state.doc,
    plugins: state.editor.state.plugins,
  }))
  refreshAllPanels()
  persist()
  refreshSidebar()
}
export function openDoc(id) {
  const target = state.docs.find(x => x.id === id)
  if (target && target.projectId) state.activeProject = target.projectId
  if (id !== state.active) {
    flushSave()
    showDoc(id)
  }
  showEditorView()
  state.editor.commands.focus('start')
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

// ---------- Bilder ----------
const imgPending = {}
window.__imgSaved__ = function (reqId, url) {
  const cb = imgPending[reqId]
  if (cb) { delete imgPending[reqId]; cb(url) }
}
export function insertImageFile(file) {
  if (!file || !/^image\//.test(file.type)) return false
  const targetDoc = state.active
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result
    if (NATIVE && window.webkit.messageHandlers.saveimg) {
      const reqId = uid()
      const ext = (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg')
      imgPending[reqId] = (url) => { insertImgNode(url || dataUrl, targetDoc) }
      window.webkit.messageHandlers.saveimg.postMessage(JSON.stringify({
        id: reqId, ext, dataBase64: String(dataUrl).split(',')[1] || '',
      }))
      setTimeout(() => { if (imgPending[reqId]) { delete imgPending[reqId]; insertImgNode(dataUrl, targetDoc) } }, 2000)
    } else {
      insertImgNode(dataUrl, targetDoc)
    }
  }
  reader.readAsDataURL(file)
  return true
}
function insertImgNode(src, targetDoc) {
  // Kam die Antwort erst nach einem Dokumentwechsel, gehört das Bild trotzdem ins Ursprungs-Dokument.
  if (targetDoc && targetDoc !== state.active) {
    const d = state.docs.find(x => x.id === targetDoc)
    if (d) {
      d.body = (d.body || '') + '<img src="' + src + '" style="width:100%">'
      d.updated = now()
      persist(); refreshSidebar()
    }
    return
  }
  state.editor.chain().focus().insertContent({ type: 'image', attrs: { src, width: '100%' } }).run()
  scheduleSave()
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

// ---------- Start ----------
export function boot() {
  load()

  state.editor = new Editor({
    element: document.getElementById('editor'),
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      ImageX,
      TextStyle, FontSize, Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Schreib hier los — „/“ für Befehle …' }),
      CharacterCount,
      Typography,
      Cue,
      Annos,
    ],
    content: (activeDoc() && activeDoc().body) || '',
    editorProps: {
      handlePaste(view, event) {
        const items = event.clipboardData && event.clipboardData.items
        if (!items) return false
        for (const it of items) {
          if (it.kind === 'file' && /^image\//.test(it.type)) {
            insertImageFile(it.getAsFile())
            return true
          }
        }
        return false
      },
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
        const files = event.dataTransfer && event.dataTransfer.files
        if (files && files.length && /^image\//.test(files[0].type)) {
          event.preventDefault()
          insertImageFile(files[0])
          return true
        }
        return false
      },
    },
    onUpdate() { scheduleSave() },
  })

  const ctx = {
    editor: state.editor, state,
    ops: { newDoc, openDoc, duplicateDoc, trashDoc, restoreDoc, deleteForever, newProject, renameProject, openProject },
    persist, scheduleSave, flushSave, exportMd, insertImageFile, docTitle, activeDoc, autoGrowTitle, activeProjectObj,
  }
  initUI(ctx)
  initPanels(ctx)
  initStructure(ctx)
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
    window.addEventListener('beforeunload', flushSave)
    document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave() })
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
