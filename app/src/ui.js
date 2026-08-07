// Bedien-Oberfläche: ruhige Toolbar mit Dropdowns und Slash-Menü,
// Seitenleiste (Suche/Papierkorb), Einstellungen, Fokus-Modus.
// Calm Technology: wenig sichtbar, alles im Kontext, Peripherie statt Alarm.

import { refreshOndaShell } from './onda-shell.mjs'
import { ondaIcon } from './onda-icons.mjs'

let ctx = null
let sortMode = 'recent'
let searchQuery = ''
let openPanel = null
const panels = []

const IC = {
  plus: 'plus', sort: 'sort', restore: 'undo', x: 'x', copy: 'copy',
  trash: 'trash', back: 'arrow-left', pencil: 'edit',
}

// ---------- Seiten: Bibliothek (Home) ↔ Schreibansicht ----------
export function showHomeView() {
  document.body.classList.remove('zen', 'zen-peek')
  document.body.classList.add('view-home')
  document.body.classList.remove('view-editor')
  document.dispatchEvent(new CustomEvent('aiwt:viewchange', { detail: { view: 'home' } }))
  closeAllPanels()
  refreshSidebar()
  requestAnimationFrame(() => {
    const search = document.getElementById('search')
    const fallback = document.getElementById('newBtn')
    const target = [search, fallback].find(node => node && node.offsetParent !== null && !node.disabled)
    target?.focus({ preventScroll: true })
  })
}
export function showEditorView() {
  document.body.classList.add('view-editor')
  document.body.classList.remove('view-home')
  document.dispatchEvent(new CustomEvent('aiwt:viewchange', { detail: { view: 'editor' } }))
  // Titelhöhe erst messen, wenn die Ansicht wirklich sichtbar ist.
  if (ctx) requestAnimationFrame(ctx.autoGrowTitle)
}

// ---------- kleine Helfer ----------
function el(tag, cls, text) {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (text != null) n.textContent = text
  return n
}
function closeAllPanels() {
  panels.forEach(p => p.classList.remove('open'))
  openPanel = null
  if (slashActive) closeSlash()
}
function positionPanel(panel, anchorRect, alignRight) {
  panel.style.visibility = 'hidden'
  panel.classList.add('open')
  const w = panel.offsetWidth, h = panel.offsetHeight
  let left = alignRight ? anchorRect.right - w : anchorRect.left
  left = Math.max(8, Math.min(left, window.innerWidth - w - 8))
  let top = anchorRect.bottom + 6
  if (top + h > window.innerHeight - 8) top = Math.max(8, anchorRect.top - h - 6)
  panel.style.left = left + 'px'
  panel.style.top = top + 'px'
  panel.style.visibility = ''
}
function makeDropdown(btn, build, alignRight) {
  const panel = el('div', 'menu')
  document.body.appendChild(panel)
  panels.push(panel)
  btn.addEventListener('mousedown', e => e.preventDefault())
  btn.addEventListener('click', e => {
    e.stopPropagation()
    if (panel.classList.contains('open')) { closeAllPanels(); return }
    closeAllPanels()
    panel.innerHTML = ''
    build(panel)
    positionPanel(panel, btn.getBoundingClientRect(), alignRight)
    openPanel = panel
  })
  panel.addEventListener('click', e => e.stopPropagation())
  return panel
}
function menuItem(panel, label, onRun, opts = {}) {
  const it = el('button', 'mi' + (opts.active ? ' on' : ''))
  const lab = el('span', 'mi-label', label)
  it.appendChild(lab)
  if (opts.kbd) it.appendChild(el('span', 'mi-kbd', opts.kbd))
  it.addEventListener('mousedown', e => e.preventDefault())
  it.addEventListener('click', () => { if (!opts.stay) closeAllPanels(); onRun() })
  panel.appendChild(it)
  return it
}
function menuLabel(panel, text) { panel.appendChild(el('div', 'mi-head', text)) }
function menuDivider(panel) { panel.appendChild(el('div', 'mi-div')) }

// ---------- Speicher-Punkt (Calm: Punkt statt Text) ----------
let dotEl = null, dotTimer = null, errEl = null, saveErrorActive = false
export function setSaveState(s) {
  const alertEl = document.getElementById('saveAlert') || errEl
  if (s === 'error') saveErrorActive = true
  else if (s === 'saved') saveErrorActive = false
  const visibleState = saveErrorActive && s === 'saving' ? 'error' : s

  if (dotEl) {
    dotEl.classList.remove('saving', 'saved', 'error')
    if (visibleState === 'saving') { dotEl.classList.add('saving'); dotEl.title = 'Speichert …' }
    else if (visibleState === 'saved') {
      dotEl.classList.add('saved')
      dotEl.title = 'Gespeichert'
      if (dotTimer) clearTimeout(dotTimer)
      dotTimer = setTimeout(() => dotEl?.classList.remove('saved'), 1600)
    } else if (visibleState === 'error') {
      dotEl.classList.add('error')
      dotEl.title = 'Speichern fehlgeschlagen'
    }
  }

  if (alertEl) {
    alertEl.textContent = saveErrorActive ? 'Speichern fehlgeschlagen. Bitte exportieren.' : ''
    alertEl.hidden = !saveErrorActive
  }
}

// ---------- Einstellungen anwenden ----------
let mediaBound = false
export function applySettings() {
  const s = ctx.state.settings
  const root = document.documentElement
  const dark = s.theme === 'dark' || (s.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.dataset.theme = dark ? 'dark' : 'light'
  // Die gewaehlte Fassung der Anmerkungszeile ueberlebt den Neustart. Sie liegt
  // bewusst NICHT in den Einstellungen: das hier ist ein Vergleichslauf, keine
  // Produkteinstellung. Sobald die Fassung entschieden ist, faellt beides weg.
  try {
    const bilanz = localStorage.getItem('ondaBilanzVariante')
    if (bilanz) root.dataset.bilanzVariante = bilanz
  } catch { /* kein Speicher, dann eben der Standard */ }
  // Das Designsystem kennt genau einen Akzent. Alte gespeicherte Varianten
  // werden nicht mehr in die Oberflaeche projiziert.
  root.removeAttribute('data-accent')
  // Schreibkoerper kommt jetzt komplett aus dem CSS (Hanken Grotesk 16.5px/1.7) —
  // kein Literata-/18px-Override mehr.
  const pm = document.querySelector('#editor .ProseMirror')
  if (pm) pm.setAttribute('spellcheck', s.spellcheck ? 'true' : 'false')
  const t = document.getElementById('title')
  if (t) t.setAttribute('spellcheck', s.spellcheck ? 'true' : 'false')
  if (!mediaBound) {
    mediaBound = true
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (ctx.state.settings.theme === 'auto') applySettings()
    })
  }
  if (ctx.autoGrowTitle) requestAnimationFrame(ctx.autoGrowTitle)
}
function setSetting(key, value) {
  ctx.state.settings[key] = value
  applySettings()
  ctx.persist()
}

let counterEl = null
// Einstellungen: bleibt beim Ausprobieren offen, Segmente aktualisieren sich an Ort und Stelle.
function buildGearPanel(panel) {
  panel.classList.add('settings')
  const s = ctx.state.settings
  const refresh = () => { panel.innerHTML = ''; buildGearPanel(panel) }
  const segRow = (items, current, apply) => {
    const row = el('div', 'mi-row')
    items.forEach(([lab, v, font]) => {
      const b = el('button', 'mi-seg' + (current === v ? ' on' : ''), lab)
      if (font) b.style.fontFamily = font
      b.addEventListener('mousedown', e => e.preventDefault())
      b.addEventListener('click', () => { apply(v); refresh() })
      row.appendChild(b)
    })
    panel.appendChild(row)
  }

  menuLabel(panel, 'Erscheinung')
  segRow([['Auto', 'auto'], ['Hell', 'light'], ['Dunkel', 'dark']], s.theme, v => setSetting('theme', v))

  menuDivider(panel)
  menuItem(panel, 'Rechtschreibung', () => { setSetting('spellcheck', !ctx.state.settings.spellcheck); refresh() },
    { stay: true, kbd: s.spellcheck ? 'An' : 'Aus' })
  menuItem(panel, 'Wortzahl anzeigen', () => { setSetting('showWords', !ctx.state.settings.showWords); updateToolbarState(); refresh() },
    { stay: true, kbd: s.showWords ? 'An' : 'Aus' })
  menuItem(panel, 'Fokus-Modus', () => toggleZen(), { kbd: '⌘.', active: document.body.classList.contains('zen') })
  menuDivider(panel)
  menuItem(panel, 'Exportieren als Markdown …', () => ctx.exportMd(), { kbd: '⌘E' })
  menuItem(panel, 'Drucken / PDF …', () => requestPrint(), { kbd: '⌘P' })
}

function requestPrint() {
  if (ctx.state.native && window.webkit.messageHandlers.printreq) {
    window.webkit.messageHandlers.printreq.postMessage('')
  } else {
    window.print()
  }
}
function updateToolbarState() {
  const lab = document.getElementById('blockLabel')
  if (lab) {
    const b = currentBlock()
    if (lab.dataset.ic !== b.name) {
      lab.dataset.ic = b.name
      lab.replaceChildren(ondaIcon('text', { size: 16 }))
    }
    if (blockBtn) blockBtn.title = 'Absatzformat: ' + b.name
  }
  if (counterEl && ctx.editor.storage.characterCount) {
    const w = ctx.editor.storage.characterCount.words()
    counterEl.textContent = w + (w === 1 ? ' Wort' : ' Wörter')
  }
  if (counterEl) counterEl.style.display = ctx.state.settings.showWords ? '' : 'none'
}

// ---------- Link-Dialog ----------
let linkEl = null
function openLinkDialog() {
  closeAllPanels()
  if (!linkEl) {
    linkEl = el('div', 'menu linkbox')
    document.body.appendChild(linkEl)
    panels.push(linkEl)
    linkEl.addEventListener('click', e => e.stopPropagation())
  }
  linkEl.innerHTML = ''
  menuLabel(linkEl, 'Link')
  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = 'https://…'
  input.className = 'mi-input'
  input.value = ctx.editor.getAttributes('link').href || ''
  linkEl.appendChild(input)
  const row = el('div', 'mi-row')
  const ok = el('button', 'mi-seg on', 'Übernehmen')
  ok.addEventListener('click', () => {
    let url = input.value.trim()
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url
    const sel = ctx.editor.state.selection
    if (url && sel.empty && !ctx.editor.isActive('link')) {
      // Nichts markiert: Link als Text einfügen, sonst sähe man keine Wirkung.
      ctx.editor.chain().focus().insertContent({
        type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }],
      }).insertContent(' ').run()
    } else if (url) {
      ctx.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    } else {
      ctx.editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
    closeAllPanels()
  })
  const rm = el('button', 'mi-seg', 'Entfernen')
  rm.addEventListener('click', () => {
    ctx.editor.chain().focus().extendMarkRange('link').unsetLink().run()
    closeAllPanels()
  })
  row.appendChild(ok); row.appendChild(rm)
  linkEl.appendChild(row)
  const sel = ctx.editor.state.selection
  const c = ctx.editor.view.coordsAtPos(sel.from)
  positionPanel(linkEl, { left: c.left, right: c.left, top: c.top, bottom: c.bottom })
  openPanel = linkEl
  input.focus()
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); ok.click() }
    if (e.key === 'Escape') { e.stopPropagation(); closeAllPanels(); ctx.editor.commands.focus() }
  })
}

// ---------- Slash-Menü ----------
let slashEl = null, slashActive = false, slashFrom = 0
function slashItems() {
  const e = ctx.editor
  return [
    { label: 'Text', run: () => e.chain().focus().setParagraph().run() },
    { label: 'Überschrift 1', run: () => e.chain().focus().setHeading({ level: 1 }).run() },
    { label: 'Überschrift 2', run: () => e.chain().focus().setHeading({ level: 2 }).run() },
    { label: 'Überschrift 3', run: () => e.chain().focus().setHeading({ level: 3 }).run() },
    { label: 'Aufzählung', run: () => e.chain().focus().toggleBulletList().run() },
    { label: 'Nummerierte Liste', run: () => e.chain().focus().toggleOrderedList().run() },
    { label: 'Checkliste', run: () => e.chain().focus().toggleTaskList().run() },
    { label: 'Zitat', run: () => e.chain().focus().toggleBlockquote().run() },
    { label: 'Trennlinie', run: () => e.chain().focus().setHorizontalRule().run() },
    { label: 'Link …', run: () => openLinkDialog() },
  ]
}
let slashSel = 0
function slashQuery() {
  const e = ctx.editor
  try { return e.state.doc.textBetween(slashFrom + 1, e.state.selection.from).toLowerCase() }
  catch (err) { return null }
}
function renderSlash() {
  const q = slashQuery()
  if (q === null) { closeSlash(); return }
  const items = slashItems().filter(it => it.label.toLowerCase().includes(q))
  if (!items.length) { closeSlash(); return }
  slashSel = Math.min(slashSel, items.length - 1)
  slashEl.innerHTML = ''
  items.forEach((it, i) => {
    const b = el('button', 'mi' + (i === slashSel ? ' sel' : ''))
    b.appendChild(el('span', 'mi-label', it.label))
    b.addEventListener('mousedown', e => e.preventDefault())
    b.addEventListener('click', () => execSlash(it))
    slashEl.appendChild(b)
  })
  slashEl._items = items
}
function execSlash(item) {
  const e = ctx.editor
  e.chain().focus().deleteRange({ from: slashFrom, to: e.state.selection.from }).run()
  closeSlash()
  item.run()
}
function openSlash() {
  if (!slashEl) {
    slashEl = el('div', 'menu slash')
    document.body.appendChild(slashEl)
    panels.push(slashEl)
  }
  slashActive = true
  slashSel = 0
  renderSlash()
  const c = ctx.editor.view.coordsAtPos(ctx.editor.state.selection.from)
  positionPanel(slashEl, { left: c.left, right: c.left, top: c.top, bottom: c.bottom })
  openPanel = slashEl
}
function closeSlash() {
  slashActive = false
  if (slashEl) slashEl.classList.remove('open')
  if (openPanel === slashEl) openPanel = null
}
function bindSlash() {
  // handleKeyDown läuft VOR den Editor-Tastenkürzeln — Enter/Pfeile gehören dann dem Menü.
  ctx.editor.view.setProps({
    handleKeyDown(view, e) {
      if (!slashActive) {
        if (e.key === '/') {
          const { $from, empty } = ctx.editor.state.selection
          if (empty && $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0) {
            slashFrom = ctx.editor.state.selection.from
            setTimeout(openSlash, 0)
          }
        }
        return false
      }
      if (e.key === 'ArrowDown') { slashSel++; renderSlash(); return true }
      if (e.key === 'ArrowUp') { slashSel = Math.max(0, slashSel - 1); renderSlash(); return true }
      if (e.key === 'Enter') {
        const q = slashQuery()
        if (q === null) { closeSlash(); return false }
        const items = slashEl._items || []
        if (items[slashSel]) execSlash(items[slashSel])
        return true
      }
      if (e.key === 'Escape') { e.stopPropagation(); closeSlash(); return true }
      if (e.key === 'Backspace') {
        const q = slashQuery()
        if (!q) closeSlash()
        else setTimeout(renderSlash, 0)
        return false
      }
      if (e.key.length === 1) setTimeout(renderSlash, 0)
      return false
    },
  })
}

// ---------- Bild-Resize ----------
let handleEl = null, dragging = false
function bindImageResize() {
  handleEl = el('div', 'img-handle')
  handleEl.title = 'Bildbreite anpassen (ziehen)'
  document.body.appendChild(handleEl)
  const update = () => {
    const selNode = document.querySelector('#editor .ProseMirror-selectednode')
    if (selNode && selNode.tagName === 'IMG' && !dragging) {
      const r = selNode.getBoundingClientRect()
      handleEl.style.left = (r.right - 6) + 'px'
      handleEl.style.top = (r.top + r.height / 2 - 14) + 'px'
      handleEl.classList.add('open')
    } else if (!dragging) {
      handleEl.classList.remove('open')
    }
  }
  ctx.editor.on('selectionUpdate', () => setTimeout(update, 0))
  ctx.editor.on('update', () => setTimeout(update, 0))
  document.getElementById('scroll').addEventListener('scroll', update)
  handleEl.addEventListener('mousedown', e => {
    e.preventDefault()
    dragging = true
    const img = document.querySelector('#editor .ProseMirror-selectednode')
    if (!img) { dragging = false; return }
    const page = document.getElementById('page')
    const pw = page.clientWidth - 80
    const left = img.getBoundingClientRect().left
    const move = ev => {
      let pct = Math.round(((ev.clientX - left) / pw) * 20) * 5
      pct = Math.max(25, Math.min(100, pct))
      ctx.editor.commands.updateAttributes('image', { width: pct + '%' })
      const r = img.getBoundingClientRect()
      handleEl.style.left = (r.right - 6) + 'px'
      handleEl.style.top = (r.top + r.height / 2 - 14) + 'px'
    }
    const up = () => {
      dragging = false
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
      ctx.scheduleSave()
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  })
}

// ---------- Fokus-Modus ----------
let lastZenBlock = null
function toggleZen() {
  document.body.classList.toggle('zen')
  document.body.classList.remove('zen-peek')
  markZenBlock()
}
function markZenBlock() {
  if (!document.body.classList.contains('zen')) {
    if (lastZenBlock) { lastZenBlock.classList.remove('now'); lastZenBlock = null }
    return
  }
  try {
    const { $from } = ctx.editor.state.selection
    const pos = $from.before(1)
    const dom = ctx.editor.view.nodeDOM(pos)
    if (dom && dom.nodeType === 1) {
      if (lastZenBlock && lastZenBlock !== dom) lastZenBlock.classList.remove('now')
      dom.classList.add('now')
      lastZenBlock = dom
    }
  } catch (e) {}
}

// ---------- Seitenleiste ----------
function fmtDate(t) {
  try {
    const d = new Date(t)
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) + ' ' +
           d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  } catch (e) { return '' }
}
function stripHtml(html) {
  try { return new DOMParser().parseFromString(html || '', 'text/html').body.textContent || '' }
  catch (e) { return '' }
}
function highlightMatch(text, q) {
  if (!q) return document.createTextNode(text)
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return document.createTextNode(text)
  const frag = document.createDocumentFragment()
  frag.appendChild(document.createTextNode(text.slice(0, idx)))
  const m = el('mark', null, text.slice(idx, idx + q.length))
  frag.appendChild(m)
  frag.appendChild(document.createTextNode(text.slice(idx + q.length)))
  return frag
}
let homeMode = 'projects'
export function setHomeMode(m) { homeMode = m }

function projectRows(listEl) {
  const projects = ctx.state.projects.slice().sort((a, b) => (b.created || 0) - (a.created || 0))
  projects.forEach(p => {
    const count = ctx.state.docs.filter(d => d.projectId === p.id && !d.trashed).length
    const item = el('div', 'doc')
    const main = el('button', 'doc-main')
    main.type = 'button'
    main.appendChild(el('div', 'dt', p.name))
    main.appendChild(el('div', 'doc-status', count + (count === 1 ? ' Text' : ' Texte')))
    main.appendChild(el('div', 'dd', fmtDate(p.created)))
    main.addEventListener('click', () => { ctx.ops.openProject(p.id); homeMode = 'docs'; refreshSidebar() })
    item.appendChild(main)
    const acts = el('div', 'trash-acts')
    const ren = el('button', 'tico')
    ren.replaceChildren(ondaIcon(IC.pencil, { size: 16 }))
    ren.title = 'Umbenennen'
    ren.setAttribute('aria-label', 'Projekt umbenennen')
    ren.addEventListener('click', ev => { ev.stopPropagation(); startRename(item, p) })
    acts.appendChild(ren)
    item.appendChild(acts)
    listEl.appendChild(item)
  })
}
function startRename(item, p) {
  const main = item.querySelector('.doc-main')
  if (!main) return
  const input = document.createElement('input')
  input.className = 'rename-input'
  input.value = p.name
  main.replaceWith(input)
  input.focus(); input.select()
  let committed = false
  const done = () => {
    if (committed) return
    committed = true
    ctx.ops.renameProject(p.id, input.value)
    refreshSidebar()
  }
  input.addEventListener('blur', done)
  input.addEventListener('keydown', ev => {
    ev.stopPropagation()
    if (ev.key === 'Enter') { ev.preventDefault(); done() }
    if (ev.key === 'Escape') { input.value = p.name; done() }
  })
  input.addEventListener('click', ev => ev.stopPropagation())
}

export function refreshSidebar() {
  if (!ctx) return
  if (counterEl && ctx.editor) updateToolbarState()
  const listEl = document.getElementById('doclist')
  const trashListEl = document.getElementById('trashlist')
  const trashCountEl = document.getElementById('trashCount')
  if (!listEl) return

  const crumb = document.getElementById('crumb')
  const titleEl2 = document.getElementById('homeTitle')
  const tools = document.querySelector('.home-tools')
  const trashSec = document.getElementById('trash')
  const isProjects = homeMode === 'projects'
  crumb.hidden = isProjects
  tools.style.display = isProjects ? 'none' : ''
  const proj = ctx.activeProjectObj()
  titleEl2.textContent = isProjects ? 'Projekte' : (proj ? proj.name : 'Texte')
  document.getElementById('newBtn').title = isProjects ? 'Neues Projekt' : 'Neuer Text (\u2318N)'

  listEl.innerHTML = ''
  listEl.classList.toggle('grid', isProjects)
  if (isProjects) {
    trashSec.style.display = 'none'
    projectRows(listEl)
    if (!ctx.state.projects.length) listEl.appendChild(el('div', 'empty', 'Noch kein Projekt.'))
    refreshOndaShell(ctx, { mode: homeMode })
    return
  }

  const q = searchQuery.trim().toLowerCase()
  let docs = ctx.state.docs.filter(d => !d.trashed && d.projectId === ctx.state.activeProject)
  if (q) docs = docs.filter(d =>
    ctx.docTitle(d).toLowerCase().includes(q) || stripHtml(d.body).toLowerCase().includes(q))
  if (!docs.some(d => d.id === ctx.state.active)) {
    const a = ctx.state.docs.find(d => d.id === ctx.state.active && !d.trashed && d.projectId === ctx.state.activeProject)
    if (a) docs.unshift(a)
  }
  docs = docs.slice().sort((a, b) => sortMode === 'title'
    ? ctx.docTitle(a).localeCompare(ctx.docTitle(b), 'de')
    : (b.updated || 0) - (a.updated || 0))

  if (!docs.length) {
    listEl.appendChild(el('div', 'empty', q ? 'Nichts gefunden.' : 'Noch kein Text \u2014 \u2318N beginnt einen neuen.'))
  }
  docs.forEach(d => {
    const item = el('div', 'doc')
    const main = el('button', 'doc-main')
    main.type = 'button'
    const tt = el('div', 'dt')
    tt.appendChild(highlightMatch(ctx.docTitle(d), q))
    main.appendChild(tt)
    main.appendChild(el('div', 'doc-status', 'In Arbeit'))
    const preview = stripHtml(d.body).trim().slice(0, 90)
    const date = el('div', 'dd', fmtDate(d.updated))
    if (preview) date.title = preview
    main.appendChild(date)
    main.addEventListener('click', () => ctx.ops.openDoc(d.id))
    item.appendChild(main)
    const acts = el('div', 'trash-acts')
    const dup = el('button', 'tico')
    dup.replaceChildren(ondaIcon(IC.copy, { size: 16 }))
    dup.title = 'Duplizieren'
    dup.setAttribute('aria-label', 'Duplizieren')
    dup.addEventListener('click', ev => { ev.stopPropagation(); ctx.ops.duplicateDoc(d.id) })
    const tr = el('button', 'tico tico-danger')
    tr.replaceChildren(ondaIcon(IC.trash, { size: 16 }))
    tr.title = 'In den Papierkorb'
    tr.setAttribute('aria-label', 'In den Papierkorb')
    tr.addEventListener('click', ev => { ev.stopPropagation(); ctx.ops.trashDoc(d.id) })
    acts.appendChild(dup); acts.appendChild(tr)
    item.appendChild(acts)
    listEl.appendChild(item)
  })

  const trash = ctx.state.docs.filter(d => d.trashed && d.projectId === ctx.state.activeProject)
  trashCountEl.textContent = trash.length ? String(trash.length) : ''
  trashSec.style.display = trash.length ? '' : 'none'
  trashListEl.innerHTML = ''
  trash.sort((a, b) => (b.trashedAt || 0) - (a.trashedAt || 0)).forEach(d => {
    const item = el('div', 'trash-doc')
    item.appendChild(el('div', 'dt', ctx.docTitle(d)))
    const acts = el('div', 'trash-acts')
    const re = el('button', 'tico')
    re.replaceChildren(ondaIcon(IC.restore, { size: 16 }))
    re.title = 'Wiederherstellen'
    re.setAttribute('aria-label', 'Wiederherstellen')
    re.addEventListener('click', () => ctx.ops.restoreDoc(d.id))
    const del = el('button', 'tico tico-danger')
    del.replaceChildren(ondaIcon(IC.x, { size: 16 }))
    del.title = 'Endg\u00fcltig l\u00f6schen'
    del.setAttribute('aria-label', 'Endg\u00fcltig l\u00f6schen')
    del.addEventListener('click', () => {
      if (confirm('\u201e' + ctx.docTitle(d) + '\u201c endg\u00fcltig l\u00f6schen? Das kann nicht r\u00fcckg\u00e4ngig gemacht werden.'))
        ctx.ops.deleteForever(d.id)
    })
    acts.appendChild(re); acts.appendChild(del)
    item.appendChild(acts)
    trashListEl.appendChild(item)
  })
  if (trash.length) {
    trashListEl.appendChild(el('div', 'trash-note', 'Wird nach 30 Tagen automatisch endg\u00fcltig gel\u00f6scht.'))
  }
  refreshOndaShell(ctx, { mode: homeMode })
}
function bindSidebar() {
  const nb = document.getElementById('newBtn')
  nb.prepend(ondaIcon(IC.plus, { size: 18 }))
  nb.setAttribute('aria-label', 'Neu')
  nb.addEventListener('click', () => {
    if (homeMode === 'projects') {
      const p = ctx.ops.newProject('Neues Projekt')
      refreshSidebar()
      const rows = document.querySelectorAll('#doclist .doc')
      if (rows[0]) startRename(rows[0], p)
    } else {
      ctx.ops.newDoc()
    }
  })
  const crumb = document.getElementById('crumb')
  crumb.prepend(ondaIcon(IC.back, { size: 16 }))
  crumb.addEventListener('click', () => { homeMode = 'projects'; refreshSidebar() })
  const sb = document.getElementById('sortBtn')
  sb.replaceChildren(ondaIcon(IC.sort, { size: 18 }))
  sb.setAttribute('aria-label', 'Sortierung wechseln')
  document.getElementById('trashToggle').title = 'Einträge werden nach 30 Tagen endgültig gelöscht'
  const search = document.getElementById('search')
  search.addEventListener('input', () => { searchQuery = search.value; refreshSidebar() })
  search.addEventListener('keydown', e => {
    if (e.key === 'Escape') { search.value = ''; searchQuery = ''; refreshSidebar(); search.blur() }
  })
  const sortBtn = document.getElementById('sortBtn')
  const syncSortTitle = () => {
    sortBtn.title = sortMode === 'recent' ? 'Sortiert: zuletzt bearbeitet' : 'Sortiert: Titel A–Z'
    sortBtn.classList.toggle('on', sortMode === 'title')
    sortBtn.setAttribute('aria-pressed', sortMode === 'title' ? 'true' : 'false')
  }
  syncSortTitle()
  sortBtn.addEventListener('click', () => {
    sortMode = sortMode === 'recent' ? 'title' : 'recent'
    syncSortTitle(); refreshSidebar()
  })
  const tgl = document.getElementById('trashToggle')
  tgl.addEventListener('click', () => {
    const l = document.getElementById('trashlist')
    l.hidden = !l.hidden
  })
  document.addEventListener('aiwt:librarynavigate', event => {
    const mode = event.detail?.mode
    if (mode === 'projects') homeMode = 'projects'
    if (mode === 'docs' || mode === 'archive') homeMode = 'docs'
    refreshSidebar()
    if (mode === 'archive') {
      const list = document.getElementById('trashlist')
      if (list && list.closest('#trash')?.style.display !== 'none') list.hidden = false
    }
  })
}

// ---------- Titel ----------
export function focusTitle() {
  const t = document.getElementById('title')
  if (t) t.focus()
}
function bindTitle() {
  const t = document.getElementById('title')
  t.addEventListener('input', () => {
    ctx.autoGrowTitle()
    ctx.scheduleSave()
  })
  t.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); ctx.editor.commands.focus('start') }
  })
}

// ---------- Tastatur global ----------
function bindKeys() {
  document.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey
    const inEditor = document.body.classList.contains('view-editor')
    // Text-bezogene Kürzel wirken nur in der Schreibansicht — nie auf ein verborgenes Dokument.
    if (mod && e.key === 'k') { if (inEditor) { e.preventDefault(); openLinkDialog() } }
    else if (mod && e.key === '.') { if (inEditor) { e.preventDefault(); toggleZen() } }
    else if (mod && e.key === 'e') { if (inEditor) { e.preventDefault(); ctx.exportMd() } }
    else if (mod && e.key === 'p') { if (inEditor) { e.preventDefault(); requestPrint() } }
    else if (mod && e.key === 'n' && !ctx.state.native) { e.preventDefault(); ctx.ops.newDoc() }
    else if (e.key === 'Escape') {
      const overlay = document.querySelector('.ai-overlay')
      if (overlay) overlay.querySelector('.ai-close')?.click()
      else if (openPanel) closeAllPanels()
      else if (document.body.classList.contains('zen')) toggleZen()
      else if (document.body.classList.contains('view-editor') && window.__workspaceCloseTopLayer?.()) {}
      else if (document.body.classList.contains('view-editor')) { ctx.flushSave(); showHomeView() }
    }
  })
  document.addEventListener('click', () => closeAllPanels())
}

// ---------- Init ----------
export function initUI(context) {
  ctx = context
  bindSlash()
  bindSidebar()
  bindTitle()
  bindKeys()
  updateToolbarState()
  ctx.editor.on('selectionUpdate', () => { updateToolbarState(); markZenBlock() })
  ctx.editor.on('update', () => { updateToolbarState(); markZenBlock() })
  document.getElementById('scroll').addEventListener('scroll', () => {
    if (openPanel) closeAllPanels()
  })
  // Fokus-Modus: Maus an den oberen Rand holt die Leiste kurz zurück.
  document.addEventListener('mousemove', ev => {
    if (!document.body.classList.contains('zen')) return
    if (ev.clientY <= 8) document.body.classList.add('zen-peek')
    else if (ev.clientY > 70) document.body.classList.remove('zen-peek')
  })
}
