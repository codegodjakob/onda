// Panels & KI-Interface — echte, textgebundene Daten (keine Kulisse mehr).
// Struktur + Erzählfäden + Coach- und Formulierungs-Karten gehören zum Text
// (ctx.activeDoc()); jede Änderung wird gespeichert. Das Material lebt im Projekt.
// Editor: Mini-Gliederung im Textbereich · kombinierte Struktur+Narrative-Leiste ·
// Formulierungs-Spalte rechts am Text · Coach rechts · reiche Overlays mit Rückfrage-Chat.

import { showHomeView, setHomeMode, showStructView, showEditorView } from './ui.js'

let ctx = null

export function el(tag, cls, text) {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (text != null) n.textContent = text
  return n
}
export function icon(paths) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>'
}
export const PIC = {
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/>',
  back: '<path d="M5 12h14M5 12l6-6M5 12l6 6"/>',
  toText: '<path d="M19 12H5M19 12l-6-6M19 12l-6 6"/>',
  struct: '<rect x="4" y="4" width="16" height="5" rx="1.5"/><rect x="7" y="12" width="13" height="4" rx="1.5"/><rect x="7" y="18.5" width="13" height="1.5" rx="0.75"/>',
  coach: '<path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7z"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  check: '<path d="M4.5 12.5 10 18 19.5 7"/>',
  reject: '<circle cx="12" cy="12" r="8.5"/><path d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  send: '<path d="M4 12h13M17 12l-5-5M17 12l-5 5"/>',
  spark: '<path d="M12 4l1.4 3.6L17 9l-3.6 1.4L12 14l-1.4-3.6L7 9l3.6-1.4z"/>',
}

// ============================================================
// Datenzugriff — alles hängt am aktiven Text bzw. am aktiven Projekt
// ============================================================
function doc() { return ctx ? ctx.activeDoc() : null }
function blocks() { const d = doc(); return d ? d.structure : [] }
function narr() { const d = doc(); return d ? d.narrative : [] }
function coachList() { const d = doc(); return d ? d.coach : [] }
function laneList() { const d = doc(); return d ? d.lane : [] }
function save() { if (ctx) ctx.scheduleSave() }

let idSeq = 0
function nid(prefix) { return prefix + Date.now().toString(36) + (idSeq++).toString(36) }
function ensureIds(list) { (list || []).forEach(b => { if (!b.id) b.id = nid('b'); if (!Array.isArray(b.children)) b.children = []; ensureIds(b.children) }) }
export function findBlock(list, id) {
  for (const b of list) {
    if (b.id === id) return { arr: list, idx: list.indexOf(b), b }
    const r = findBlock(b.children || [], id); if (r) return r
  }
  return null
}
export function openExternal(url) {
  if (!/^https?:\/\//.test(url)) return
  if (ctx.state.native && window.webkit.messageHandlers.openurl) window.webkit.messageHandlers.openurl.postMessage(url)
  else window.open(url, '_blank', 'noopener')
}
export function getCtx() { return ctx }

// Klick-zum-Bearbeiten. multiline=true erlaubt Absätze im Feld (Enter = Zeilenumbruch).
export function makeEditable(elx, saveFn, opts = {}) {
  elx.contentEditable = 'true'
  elx.spellcheck = false
  elx.addEventListener('keydown', ev => {
    ev.stopPropagation()
    if (ev.key === 'Enter' && !opts.multiline) { ev.preventDefault(); elx.blur() }
    if (ev.key === 'Escape') { ev.preventDefault(); elx.blur() }
  })
  elx.addEventListener('blur', () => saveFn(elx.textContent.trim()))
  elx.addEventListener('click', ev => ev.stopPropagation())
}

// ============================================================
// Init
// ============================================================
export function initPanels(context) {
  ctx = context
  buildRails()
  ctx.editor.on('update', scheduleMapRefresh)
  refreshAllPanels()
}

// Baut alle Panels aus dem aktuell aktiven Text neu auf (nach Textwechsel/Boot).
export function refreshAllPanels() {
  ensureIds(blocks())
  buildStructPanel()
  renderCoach()
  buildLane()
  refreshToc()
  applyPanelState()
  // Struktur-Seite (falls schon initialisiert) an denselben Text/das Projekt angleichen.
  if (window.__rebuildStructView) window.__rebuildStructView()
  if (window.__renderStructCoach) window.__renderStructCoach()
}

// ---------- Leisten-Zustand pro Text merken ----------
let structBtn = null, coachBtn = null
function applyPanelState() {
  const d = doc(); if (!d) return
  const p = d.panels || {}
  const set = (id, on) => { const e = document.getElementById(id); if (!e) return; if (on) e.removeAttribute('hidden'); else e.setAttribute('hidden', '') }
  set('pStruct', p.struct); set('pCoach', p.coach); set('lane', p.lane)
  if (structBtn) structBtn.classList.toggle('on', !!p.struct)
  if (coachBtn) coachBtn.classList.toggle('on', !!p.coach)
  const laneBtn = document.querySelector('.tbtn-lane')
  if (laneBtn) laneBtn.classList.toggle('on', !!p.lane)
}
export function persistPanelState() {
  const d = doc(); if (!d) return
  d.panels = {
    struct: !document.getElementById('pStruct').hasAttribute('hidden'),
    coach: !document.getElementById('pCoach').hasAttribute('hidden'),
    lane: document.getElementById('lane') ? !document.getElementById('lane').hasAttribute('hidden') : false,
  }
  save()
}
function togglePanel(id, btn) {
  const p = document.getElementById(id)
  const open = p.hasAttribute('hidden')
  if (open) p.removeAttribute('hidden')
  else p.setAttribute('hidden', '')
  btn.classList.toggle('on', open)
  persistPanelState()
}
function railBtn(rail, ic, title, onClick) {
  const b = el('button', 'rail-btn')
  b.innerHTML = icon(ic)
  b.title = title
  b.setAttribute('aria-label', title)
  b.addEventListener('click', onClick)
  rail.appendChild(b)
  return b
}
function buildRails() {
  const railL = document.getElementById('railL')
  const railR = document.getElementById('railR')
  railL.innerHTML = ''; railR.innerHTML = ''
  railBtn(railL, PIC.home, 'Projekte (Startseite)', () => { ctx.flushSave(); setHomeMode('projects'); showHomeView() })
  railBtn(railL, PIC.back, 'Zur Struktur-Seite', () => { ctx.flushSave(); showStructView() })
  railL.appendChild(el('div', 'rail-div'))
  structBtn = railBtn(railL, PIC.struct, 'Struktur & Narrative', () => togglePanel('pStruct', structBtn))
  coachBtn = railBtn(railR, PIC.coach, 'Coach (KI-Hinweise)', () => togglePanel('pCoach', coachBtn))
  const badge = el('span', 'rail-badge', ''); badge.id = 'coachBadge'
  coachBtn.appendChild(badge)
  updateCoachBadge()
}

// ============================================================
// Mini-Gliederung im Textbereich (Überschriften + Absatz-Striche)
// ============================================================
let mapTimer = null
function scheduleMapRefresh() {
  if (mapTimer) clearTimeout(mapTimer)
  mapTimer = setTimeout(refreshToc, 400)
}
export function refreshToc() {
  const m = document.getElementById('minimap')
  if (!m || !ctx) return
  m.innerHTML = ''
  const items = []
  ctx.editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') { items.push({ kind: 'h', level: node.attrs.level, text: node.textContent || '…', pos }); return false }
    if (node.type.name === 'paragraph' && node.textContent.trim()) { items.push({ kind: 'p', pos }); return false }
    return true
  })
  items.forEach(it => {
    let row
    if (it.kind === 'h') row = el('button', 'mm-h mm-l' + it.level, it.text)
    else { row = el('button', 'mm-p'); row.setAttribute('aria-label', 'Absatz') }
    row.addEventListener('click', () => {
      const size = ctx.editor.state.doc.content.size
      const pos = Math.min(it.pos + 1, size)
      let dom
      try { dom = ctx.editor.view.domAtPos(pos).node } catch (e) { return }
      const t = dom && dom.nodeType === 1 ? dom : (dom && dom.parentElement)
      if (t && t.scrollIntoView) t.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    m.appendChild(row)
  })
}

// ============================================================
// Kombinierte Leiste: Struktur (Bauklötze) + Narrative — gekoppelt
// ============================================================
export function buildStructPanel() {
  const p = document.getElementById('pStruct')
  if (!p) return
  p.innerHTML = ''
  const wrap = el('div', 'sp-cols')
  const colB = el('div', 'sp-col')
  colB.appendChild(el('div', 'panel-head', 'Struktur'))
  colB.appendChild(el('div', 'panel-sub', 'Dein roter Faden — ziehen zum Verschieben, klicken zum Öffnen.'))
  renderBlocksInto(colB, { drag: true, note: true, onChange: onStructChanged })
  const colN = el('div', 'sp-col sp-col-n')
  colN.appendChild(el('div', 'panel-head', 'Narrative'))
  colN.appendChild(el('div', 'panel-sub', 'Die Fäden, die sich durch den Text ziehen — Struktur und Narrative im Einklang.'))
  renderNarrativeInto(colN)
  wrap.appendChild(colB); wrap.appendChild(colN)
  p.appendChild(wrap)
}

// Einladender Leerzustand + KI-Vorschlag-Knopf (ruht, bis die KI angeschlossen ist).
function emptyKiState(parent, title, hint) {
  const box = el('div', 'ki-empty')
  box.appendChild(el('div', 'ki-empty-title', title))
  box.appendChild(el('div', 'ki-empty-hint', hint))
  parent.appendChild(box)
}
function kiSuggestButton(parent, label) {
  const b = el('button', 'ki-suggest')
  b.innerHTML = icon(PIC.spark) + '<span>' + label + '</span>'
  b.title = 'KI-Vorschlag aus deinem Text'
  b.addEventListener('click', () => {
    b.classList.add('resting')
    const note = b.parentElement.querySelector('.ki-resting-note') || el('div', 'ki-resting-note', 'Kommt, sobald die KI angeschlossen ist — dann liest sie deinen Text und macht einen Vorschlag.')
    note.className = 'ki-resting-note'
    if (!b.parentElement.querySelector('.ki-resting-note')) b.parentElement.appendChild(note)
  })
  parent.appendChild(b)
}

export function renderBlocksInto(parent, opts = {}) {
  const list = blocks()
  ensureIds(list)
  const render = (arr, container, depth) => {
    arr.forEach(b => {
      const wrapEl = el('div', 'blk-wrap')
      const row = el('div', 'blk d' + depth)
      if (opts.drag) row.draggable = true
      row.appendChild(el('span', 'blk-grip', '⠿'))
      const mainCol = el('div', 'blk-main')
      mainCol.appendChild(el('div', 'blk-title', b.title))
      if (b.content) mainCol.appendChild(el('div', 'blk-sub', b.content.slice(0, 76) + (b.content.length > 76 ? '…' : '')))
      row.appendChild(mainCol)
      if ((b.children || []).length) {
        const chev = el('button', 'blk-chev', '▾')
        chev.setAttribute('aria-label', 'Ein-/ausklappen')
        chev.addEventListener('click', ev => { ev.stopPropagation(); wrapEl.classList.toggle('col') })
        row.appendChild(chev)
      }
      row.addEventListener('click', () => openBlockOverlay(b))
      if (opts.drag) attachBlockDrag(row, b, opts)
      wrapEl.appendChild(row)
      if (opts.note && b.note && !b.note.resolved) {
        const note = el('button', 'struct-note')
        note.appendChild(el('span', 'struct-note-line'))
        note.appendChild(el('span', 'struct-note-txt', b.note.text))
        note.addEventListener('click', () => openNoteOverlay(b))
        wrapEl.appendChild(note)
      }
      if ((b.children || []).length) {
        const kids = el('div', 'blk-kids')
        render(b.children, kids, depth + 1)
        wrapEl.appendChild(kids)
      }
      container.appendChild(wrapEl)
    })
  }
  if (!list.length) {
    emptyKiState(parent, 'Noch keine Bausteine.', 'Bau deinen roten Faden Stück für Stück — jeder Baustein ist ein Gedanke, den der Text tragen soll.')
  } else {
    render(list, parent, 0)
    // Ablegen ganz unten hängt einen Baustein ans Ende der obersten Ebene.
    const endZone = el('div', 'blk-endzone')
    if (opts.drag) {
      endZone.addEventListener('dragover', ev => {
        if (Array.from(ev.dataTransfer.types).includes('application/x-blkid')) { ev.preventDefault(); endZone.classList.add('drop-in') }
      })
      endZone.addEventListener('dragleave', () => endZone.classList.remove('drop-in'))
      endZone.addEventListener('drop', ev => {
        endZone.classList.remove('drop-in')
        const id = ev.dataTransfer.getData('application/x-blkid'); if (!id) return
        ev.preventDefault(); ev.stopPropagation()
        const src = findBlock(list, id); if (!src) return
        src.arr.splice(src.idx, 1); list.push(src.b)
        save(); if (opts.onChange) opts.onChange()
      })
    }
    parent.appendChild(endZone)
  }
  const actions = el('div', 'blk-actions')
  const add = el('button', 'narr-add', '+ Baustein')
  add.addEventListener('click', () => {
    const nb = { id: nid('b'), title: 'Neuer Baustein', role: '', content: '', why: '', sources: [], note: null, children: [] }
    list.push(nb); save(); rebuildStructEverywhere(); openBlockOverlay(nb)
  })
  actions.appendChild(add)
  kiSuggestButton(actions, 'Aus Text vorschlagen')
  parent.appendChild(actions)
}

function attachBlockDrag(row, b, opts) {
  row.addEventListener('dragstart', ev => {
    ev.dataTransfer.setData('application/x-baustein', b.content || b.title)
    ev.dataTransfer.setData('application/x-blkid', b.id)
    ev.dataTransfer.effectAllowed = 'copyMove'
    row.classList.add('dragging')
  })
  row.addEventListener('dragend', () => row.classList.remove('dragging'))
  row.addEventListener('dragover', ev => {
    if (Array.from(ev.dataTransfer.types).includes('application/x-blkid')) {
      ev.preventDefault(); ev.stopPropagation(); row.classList.add('drop-above')
    }
  })
  row.addEventListener('dragleave', () => row.classList.remove('drop-above'))
  row.addEventListener('drop', ev => {
    row.classList.remove('drop-above')
    const id = ev.dataTransfer.getData('application/x-blkid')
    if (!id || id === b.id) return
    ev.preventDefault(); ev.stopPropagation()
    const list = blocks()
    const src = findBlock(list, id)
    if (!src || findBlock(src.b.children || [], b.id)) return   // nicht in eigenes Kind ziehen
    src.arr.splice(src.idx, 1)
    const dst = findBlock(list, b.id)
    dst.arr.splice(dst.idx, 0, src.b)
    save(); if (opts.onChange) opts.onChange()
  })
}

export function renderNarrativeInto(parent) {
  const list = narr()
  if (!list.length) {
    emptyKiState(parent, 'Noch keine Erzählfäden.', 'Ein Faden ist eine Linie, die sich durch den ganzen Text zieht — ein Argument, eine Spannung, eine Frage.')
  }
  const strands = el('div', 'narr-strands')
  list.forEach(t => {
    const box = el('div', 'narr-thread')
    const labRow = el('div', 'narr-label-row')
    const lab = el('div', 'narr-label', t.title)
    makeEditable(lab, v => { t.title = v || t.title; save(); syncNarrative() })
    labRow.appendChild(lab)
    const delTh = el('button', 'narr-del'); delTh.innerHTML = icon(PIC.x); delTh.title = 'Faden entfernen'
    delTh.addEventListener('click', () => { const i = list.indexOf(t); if (i >= 0) list.splice(i, 1); save(); rebuildStructEverywhere() })
    labRow.appendChild(delTh)
    box.appendChild(labRow)
    const line = el('div', 'narr-line')
    ;(t.steps || []).forEach(st => {
      const item = el('div', 'narr-pt' + (st.open ? ' open' : ''))
      item.appendChild(el('span', 'narr-dot'))
      const body = el('div', 'narr-body')
      const h = el('div', 'narr-h', st.h)
      makeEditable(h, v => { st.h = v || st.h; save(); syncNarrative() })
      const pEl = el('div', 'narr-p', st.p)
      makeEditable(pEl, v => { st.p = v || st.p; save(); syncNarrative() }, { multiline: true })
      body.appendChild(h); body.appendChild(pEl)
      item.appendChild(body)
      const delPt = el('button', 'narr-del narr-del-pt'); delPt.innerHTML = icon(PIC.x); delPt.title = 'Punkt entfernen'
      delPt.addEventListener('click', () => { const i = t.steps.indexOf(st); if (i >= 0) t.steps.splice(i, 1); save(); rebuildStructEverywhere() })
      item.appendChild(delPt)
      line.appendChild(item)
    })
    const addPt = el('button', 'narr-add', '+ Punkt')
    addPt.addEventListener('click', () => { t.steps = t.steps || []; t.steps.push({ id: nid('s'), h: 'Neuer Punkt', p: 'Beschreibung …' }); save(); rebuildStructEverywhere() })
    line.appendChild(addPt)
    box.appendChild(line)
    strands.appendChild(box)
  })
  parent.appendChild(strands)
  const addTh = el('button', 'narr-add narr-add-thread', '+ Faden')
  addTh.addEventListener('click', () => { list.push({ id: nid('n'), title: 'Neuer Faden', steps: [{ id: nid('s'), h: 'Beginn', p: 'Worum es in diesem Faden geht …' }] }); save(); rebuildStructEverywhere() })
  parent.appendChild(addTh)
}

// Nach einer Umstrukturierung: beide Orte neu bauen + Coach-Hinweis.
function onStructChanged() {
  rebuildStructEverywhere()
  const d = doc(); if (!d) return
  d.coach = d.coach || []
  d.coach.unshift({
    id: nid('c'), type: 'Struktur', tone: 'warn', status: 'open', createdAt: Date.now(),
    text: 'Die Reihenfolge der Bausteine hat sich geändert — passt der Übergang im Text noch?',
    why: 'Beim Umstellen der Struktur verschiebt sich die Argumentationslinie. Prüfe die Überleitungen zwischen den betroffenen Abschnitten, damit der Text der neuen Reihenfolge folgt.',
    narrative: 'Wenn ein Baustein einen anderen überholt, kann ein Erzählfaden an seiner Begründungsstelle brechen — sieh in den Fäden nach, ob die Schritte noch in der richtigen Ordnung stehen.',
    action: null, sources: [],
  })
  save()
  renderCoach()
}
// Struktur und Narrative stehen an zwei Orten — nach einer Änderung beide angleichen.
function syncNarrative() { rebuildStructEverywhere() }

export function rebuildStructEverywhere() {
  buildStructPanel()
  if (window.__rebuildStructView) window.__rebuildStructView()
}
export function notifyStructChanged() { onStructChanged() }
// Struktur-Seite (Canvas → Baustein): einen Baustein zur obersten Ebene hinzufügen.
export function addRootBlock(b) {
  const list = blocks(); if (!b.id) b.id = nid('b'); if (!Array.isArray(b.children)) b.children = []
  list.push(b); save(); rebuildStructEverywhere(); return b
}

// ============================================================
// Coach
// ============================================================
function updateCoachBadge() {
  const n = coachList().filter(c => c.status === 'open').length
  const badge = document.getElementById('coachBadge')
  if (!badge) return
  badge.textContent = n > 0 ? String(n) : ''
  badge.style.display = n > 0 ? '' : 'none'
}
export function renderCoach() {
  renderCoachInto(document.getElementById('pCoach'))
  if (window.__renderStructCoach) window.__renderStructCoach()
  updateCoachBadge()
}
export function renderCoachInto(p) {
  if (!p) return
  p.innerHTML = ''
  p.appendChild(el('div', 'panel-head', 'Coach'))
  const open = coachList().filter(c => c.status === 'open')
  if (!open.length) { p.appendChild(el('div', 'panel-empty', 'Keine Hinweise. Die KI meldet sich, wenn ihr etwas auffällt.')); return }
  open.forEach(c => {
    const card = el('button', 'coach-card tone-' + (c.tone || 'idea'))
    card.appendChild(el('span', 'coach-type', c.type))
    card.appendChild(el('span', 'coach-text', c.text))
    card.addEventListener('click', () => openCardOverlay(c))
    p.appendChild(card)
  })
}

// ============================================================
// Formulierungs-Spalte rechts am Text
// ============================================================
export function buildLane() {
  const lane = document.getElementById('lane')
  if (!lane) return
  lane.innerHTML = ''
  lane.appendChild(el('div', 'panel-head', 'Formulierung'))
  const open = laneList().filter(c => c.status === 'open')
  if (!open.length) lane.appendChild(el('div', 'panel-empty', 'Keine Anmerkungen im Text.'))
  open.forEach(c => {
    const card = el('button', 'lane-card')
    card.appendChild(el('span', 'lane-text', c.short))
    card.addEventListener('mouseenter', () => markTarget(c.target, false))
    card.addEventListener('mouseleave', () => { if (!c._pinned) unmarkTarget() })
    card.addEventListener('click', () => { c._pinned = true; markTarget(c.target, true); openLaneOverlay(c) })
    lane.appendChild(card)
  })
  updateLaneBadge()
}
export function updateLaneBadge() {
  const b = document.getElementById('laneBadge')
  if (!b) return
  const n = laneList().filter(c => c.status === 'open').length
  b.textContent = n > 0 ? String(n) : ''
  b.style.display = n > 0 ? '' : 'none'
}

// Findet eine Passage im ganzen Text — auch über Fett/Kursiv-Grenzen hinweg,
// weil der Text zusammenhängend durchsucht wird (nicht Knoten für Knoten).
export function findInDoc(text) {
  if (!text) return null
  let full = ''
  const map = []
  ctx.editor.state.doc.descendants((node, pos) => {
    if (node.isText) {
      for (let k = 0; k < node.text.length; k++) { full += node.text[k]; map.push(pos + k) }
    } else if (node.isBlock && full.length && full[full.length - 1] !== '\n') {
      full += '\n'; map.push((map.length ? map[map.length - 1] : pos) + 1)
    }
    return true
  })
  const i = full.indexOf(text)
  if (i < 0) return null
  return { from: map[i], to: map[i + text.length - 1] + 1 }
}
// Flüchtige Markierung (Dekoration) — ändert das Dokument NICHT.
export function markTarget(target, scroll) {
  const r = findInDoc(target)
  if (!r) return
  ctx.editor.commands.setCue(r)
  if (scroll) {
    let dom
    try { dom = ctx.editor.view.domAtPos(r.from).node } catch (e) { return }
    const elx = dom && dom.nodeType === 1 ? dom : (dom && dom.parentElement)
    if (elx && elx.scrollIntoView) elx.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
export function unmarkTarget() { if (ctx) ctx.editor.commands.clearCue() }

// ============================================================
// Overlays — ✓ übernehmen · ⊗ verwerfen · ✕ schließen (oben rechts); Chat unten
// ============================================================
let overlayEl = null
export function closeOverlay() { if (overlayEl) { overlayEl.remove(); overlayEl = null } }
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function overlayShell(typeLabel, tone, onAccept, onReject) {
  closeOverlay()
  overlayEl = el('div', 'ai-overlay')
  const box = el('div', 'ai-box')
  const head = el('div', 'ai-head')
  head.appendChild(el('span', 'coach-type', typeLabel))
  const actions = el('div', 'ai-actions')
  if (onAccept) {
    const ok = el('button', 'ai-ico ai-ok'); ok.innerHTML = icon(PIC.check)
    ok.title = 'Übernehmen'; ok.setAttribute('aria-label', 'Übernehmen')
    ok.addEventListener('click', onAccept); actions.appendChild(ok)
  }
  if (onReject) {
    const no = el('button', 'ai-ico ai-no'); no.innerHTML = icon(PIC.reject)
    no.title = 'Verwerfen'; no.setAttribute('aria-label', 'Verwerfen')
    no.addEventListener('click', onReject); actions.appendChild(no)
  }
  const close = el('button', 'ai-ico ai-close'); close.innerHTML = icon(PIC.x)
  close.title = 'Schließen — nur zuklappen, nichts entscheiden'; close.setAttribute('aria-label', 'Schließen')
  close.addEventListener('click', closeOverlay); actions.appendChild(close)
  head.appendChild(actions)
  box.appendChild(head)
  overlayEl.appendChild(box)
  overlayEl.addEventListener('click', ev => { if (ev.target === overlayEl) closeOverlay() })
  document.body.appendChild(overlayEl)
  return box
}

function chatSection(box, topic) {
  box.appendChild(el('div', 'panel-head', 'Rückfrage an die KI'))
  const thread = el('div', 'ai-chat')
  box.appendChild(thread)
  const row = el('div', 'ai-chat-row')
  const inp = el('div', 'ai-chat-input')
  inp.contentEditable = 'true'; inp.spellcheck = false
  inp.setAttribute('data-ph', 'Frag nach — z. B. „Warum ist das besser?“')
  const send = el('button', 'ai-ico'); send.innerHTML = icon(PIC.send); send.title = 'Senden'
  const submit = () => {
    const q = inp.textContent.trim(); if (!q) return
    thread.appendChild(el('div', 'ai-msg ai-msg-user', q))
    inp.textContent = ''
    thread.scrollTop = thread.scrollHeight
    const ai = el('div', 'ai-msg ai-msg-ai ki-resting-note', 'Die Rückfrage-KI ist noch nicht angeschlossen. Sobald sie es ist, antwortet sie hier mit deinem ganzen Projekt als Kontext.')
    thread.appendChild(ai)
    thread.scrollTop = thread.scrollHeight
  }
  send.addEventListener('click', submit)
  inp.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') { ev.preventDefault(); closeOverlay(); return }
    ev.stopPropagation()
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); submit() }
  })
  row.appendChild(inp); row.appendChild(send)
  box.appendChild(row)
}

// Fügt Text sichtbar in den Editor ein — wechselt nötigenfalls erst in die Schreibansicht,
// damit nie unbemerkt in ein verborgenes Dokument geschrieben wird.
function insertIntoText(htmlOrText, asBlock) {
  if (!document.body.classList.contains('view-editor')) showEditorView()
  const content = asBlock ? '<p>' + escHtml(htmlOrText) + '</p>' : escHtml(htmlOrText)
  ctx.editor.chain().focus('end').insertContent(content).run()
  ctx.scheduleSave()
}

export function openCardOverlay(card) {
  const box = overlayShell(card.type, card.tone,
    card.action ? () => {
      const edit = box.querySelector('.ai-prop')
      insertIntoText(edit ? edit.textContent : card.action, true)
      card.status = 'done'; save(); renderCoach(); closeOverlay()
    } : null,
    () => { card.status = 'rejected'; save(); renderCoach(); closeOverlay() })
  box.appendChild(el('div', 'ai-title', card.text))
  box.appendChild(el('div', 'panel-head', 'Warum'))
  box.appendChild(el('div', 'ai-why', card.why))
  if (card.narrative) {
    box.appendChild(el('div', 'panel-head', 'Für deine Narrative'))
    box.appendChild(el('div', 'ai-why ai-narr', card.narrative))
  }
  if (card.image) {
    const img = document.createElement('img')
    img.className = 'ai-img'; img.src = card.image; img.alt = card.imageCaption || ''
    box.appendChild(img)
    if (card.imageCaption) box.appendChild(el('div', 'ai-cap', card.imageCaption))
  }
  if (card.sources && card.sources.length) {
    box.appendChild(el('div', 'panel-head', 'Quellen — direkt reinlesen'))
    card.sources.forEach(s => {
      const sc = el('div', 'ai-source')
      const top = el('button', 'ai-src', (s.label || s) + '  ↗')
      if (s.url) { top.title = s.url; top.addEventListener('click', () => openExternal(s.url)) }
      sc.appendChild(top)
      if (s.preview) sc.appendChild(el('div', 'ai-src-prev', s.preview))
      box.appendChild(sc)
    })
  }
  if (card.action) {
    box.appendChild(el('div', 'panel-head', 'Vorschlag (bearbeitbar)'))
    const prop = el('div', 'ai-prop', card.action)
    makeEditable(prop, v => { card.action = v || card.action; save() }, { multiline: true })
    box.appendChild(prop)
  }
  chatSection(box, card.text)
}

// Rote KI-Anmerkung in der Struktur: Begründung + Korrekturvorschlag.
function openNoteOverlay(block) {
  const note = block.note
  const box = overlayShell('Struktur', 'warn',
    () => { insertIntoText(box.querySelector('.ai-prop').textContent || note.fix, true); note.resolved = true; save(); rebuildStructEverywhere(); closeOverlay() },
    () => { note.resolved = true; save(); rebuildStructEverywhere(); closeOverlay() })
  box.appendChild(el('div', 'ai-title', note.text))
  box.appendChild(el('div', 'panel-head', 'Warum'))
  box.appendChild(el('div', 'ai-why', note.why))
  box.appendChild(el('div', 'panel-head', 'Vorschlag (bearbeitbar)'))
  const prop = el('div', 'ai-prop', note.fix)
  makeEditable(prop, v => { note.fix = v || note.fix; save() }, { multiline: true })
  box.appendChild(prop)
  chatSection(box, note.text)
}

export function openLaneOverlay(c) {
  const box = overlayShell('Formulierung', 'style',
    () => {
      const edit = box.querySelector('.ai-prop')
      const r = findInDoc(c.target)
      if (!r) {
        let warn = box.querySelector('.ai-warn')
        if (!warn) { warn = el('div', 'ai-warn', 'Diese Passage steht so nicht mehr im Text — vielleicht schon geändert. Der Vorschlag bleibt offen.'); box.querySelector('.ai-prop').after(warn) }
        return
      }
      ctx.editor.commands.clearCue()
      ctx.editor.chain().setTextSelection(r).insertContent(escHtml(edit ? edit.textContent : c.action)).run()
      c.status = 'done'; c._pinned = false
      buildLane(); ctx.scheduleSave(); closeOverlay()
    },
    () => { unmarkTarget(); c.status = 'rejected'; c._pinned = false; buildLane(); save(); closeOverlay() })
  box.appendChild(el('div', 'ai-title', c.short))
  box.appendChild(el('div', 'panel-head', 'Original'))
  box.appendChild(el('div', 'ai-orig', '„' + c.target + '“'))
  box.appendChild(el('div', 'panel-head', 'Vorschlag (bearbeitbar)'))
  const prop = el('div', 'ai-prop', c.action)
  makeEditable(prop, v => { c.action = v || c.action; save() }, { multiline: true })
  box.appendChild(prop)
  box.appendChild(el('div', 'panel-head', 'Warum'))
  box.appendChild(el('div', 'ai-why', c.why))
  chatSection(box, c.short)
  // Beim Schließen ohne Entscheidung die Markierung wieder aufheben.
  const was = overlayEl
  const obs = new MutationObserver(() => {
    if (!document.body.contains(was)) {
      if (c.status === 'open') { c._pinned = false; unmarkTarget() }
      obs.disconnect()
    }
  })
  obs.observe(document.body, { childList: true })
}

// ============================================================
// Baustein-Overlay (groß, dreispaltig): Meta · Inhalt · Quellen
// ============================================================
export function openBlockOverlay(b) {
  b.sources = b.sources || []; b.children = b.children || []
  const box = overlayShell('Baustein', null, null, null)
  box.classList.add('ai-box-wide')
  const cols = el('div', 'blk-ov-cols')

  const c1 = el('div', 'blk-ov-col')
  c1.appendChild(el('div', 'panel-head', 'Meta-Struktur — warum dieser Baustein?'))
  const why = el('div', 'ai-prop', b.why || '')
  if (!b.why) why.dataset.ph = 'Wozu trägt dieser Baustein im Text bei? (Die KI hilft später.)'
  why.classList.toggle('is-empty', !b.why)
  makeEditable(why, v => { b.why = v; why.classList.toggle('is-empty', !v); save() }, { multiline: true })
  c1.appendChild(why)
  c1.appendChild(el('div', 'panel-head', 'Rolle'))
  const role = el('div', 'ai-prop', b.role || '')
  if (!b.role) role.dataset.ph = 'z. B. These, Beleg, Überleitung …'
  role.classList.toggle('is-empty', !b.role)
  makeEditable(role, v => { b.role = v; role.classList.toggle('is-empty', !v); save(); rebuildStructEverywhere() })
  c1.appendChild(role)
  if (b.children.length) {
    c1.appendChild(el('div', 'panel-head', 'Interne Struktur'))
    b.children.forEach(k => {
      const kb = el('button', 'ai-src', '· ' + k.title)
      kb.addEventListener('click', () => openBlockOverlay(k))
      c1.appendChild(kb)
    })
  }

  const c2 = el('div', 'blk-ov-col blk-ov-main')
  c2.appendChild(el('div', 'panel-head', 'Inhalt'))
  const titleEl = el('div', 'blk-ov-title', b.title)
  makeEditable(titleEl, v => { b.title = v || b.title; save(); rebuildStructEverywhere() })
  c2.appendChild(titleEl)
  const body = el('div', 'blk-ov-body ai-prop', b.content || '')
  if (!b.content) body.dataset.ph = 'Was steht in diesem Baustein? Gedanken hier festhalten oder vom Canvas übernehmen.'
  body.classList.toggle('is-empty', !b.content)
  makeEditable(body, v => { b.content = v; body.classList.toggle('is-empty', !v); save(); rebuildStructEverywhere() }, { multiline: true })
  c2.appendChild(body)

  const c3 = el('div', 'blk-ov-col')
  c3.appendChild(el('div', 'panel-head', 'Quellen'))
  if (!b.sources.length) c3.appendChild(el('div', 'panel-empty', 'Noch keine Quellen verknüpft.'))
  b.sources.forEach((s, i) => {
    const wrap = el('div', 'ai-source')
    const label = el('div', 'ai-src-prev', typeof s === 'string' ? s : (s.label || ''))
    makeEditable(label, v => { b.sources[i] = (typeof s === 'string') ? v : Object.assign({}, s, { label: v }); save() })
    wrap.appendChild(label)
    c3.appendChild(wrap)
  })
  const addSrc = el('button', 'narr-add', '+ Quelle')
  addSrc.addEventListener('click', () => { b.sources.push(''); save(); closeOverlay(); openBlockOverlay(b) })
  c3.appendChild(addSrc)
  if (b.note && !b.note.resolved) {
    c3.appendChild(el('div', 'panel-head', 'KI-Hinweis'))
    const kh = el('button', 'ai-why ai-note-link', b.note.text)
    kh.addEventListener('click', () => openNoteOverlay(b))
    c3.appendChild(kh)
  }

  cols.appendChild(c1); cols.appendChild(c2); cols.appendChild(c3)
  box.appendChild(cols)

  const foot = el('div', 'blk-ov-foot')
  const del = el('button', 'blk-del', 'Baustein entfernen')
  del.addEventListener('click', () => {
    const f = findBlock(blocks(), b.id)
    if (f) { f.arr.splice(f.idx, 1); save(); rebuildStructEverywhere(); closeOverlay() }
  })
  foot.appendChild(del)
  box.appendChild(foot)
}
