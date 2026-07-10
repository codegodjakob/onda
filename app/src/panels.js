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

// Faden-Farben (an das App-Palette gekoppelt, hell- und dunkelmodus-fest).
const THREAD_N = 5
function threadColorVar(i) { return 'var(--th' + ((((i % THREAD_N) + THREAD_N) % THREAD_N) + 1) + ')' }
function threadColorOf(t, ti) { return threadColorVar(t.color != null ? t.color : ti) }
// Faden hervorheben (beim Zeigen auf eine Faden-Spalte im Raster).
function highlightThread(ti) {
  document.querySelectorAll('.tl-cell[data-thread]').forEach(c => { c.style.opacity = (ti == null || +c.dataset.thread === ti) ? '1' : '0.32' })
}

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
  ctx.editor.on('update', scheduleAnnoRelayout)
  const scroll = document.getElementById('scroll')
  if (scroll) scroll.addEventListener('scroll', onLaneScroll)
  window.addEventListener('resize', scheduleAnnoRelayout)
  refreshAllPanels()
}

// Baut alle Panels aus dem aktuell aktiven Text neu auf (nach Textwechsel/Boot).
export function refreshAllPanels() {
  ensureIds(blocks())
  applyPanelState()          // erst Sichtbarkeit setzen …
  buildStructPanel()
  renderCoach()
  buildLane()                // … dann die Anmerkungen aufbauen (kennt die richtige Sichtbarkeit)
  refreshToc()
  scheduleAnnoRelayout()     // nach dem Layout noch einmal exakt ausrichten
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
  applyStructWidth()
  // Der Inhalt scrollt in .sp-body — der Ziehgriff sitzt außerhalb und bleibt stehen.
  const body = el('div', 'sp-body')
  const head = el('div', 'sp-head')
  head.appendChild(el('div', 'panel-head', 'Struktur & Narrative'))
  head.appendChild(el('div', 'panel-sub', 'Timeline von oben nach unten. Links deine Bausteine (was passiert), rechts die Metastruktur je Faden — die zieht die KI automatisch nach.'))
  body.appendChild(head)
  const wrap = el('div', 'tl-wrap')
  renderTimelineGrid(wrap, { drag: true, onChange: onStructChanged })
  body.appendChild(wrap)
  p.appendChild(body)
  addResizeHandle(p)
}
function clampWidth(w) { return Math.max(360, Math.min(940, w || 560)) }
function applyStructWidth() {
  const p = document.getElementById('pStruct')
  if (p && ctx) p.style.width = clampWidth(ctx.state.settings.structWidth) + 'px'
}
function addResizeHandle(p) {
  const h = el('div', 'panel-resize')
  h.title = 'Breite ziehen'
  h.addEventListener('mousedown', ev => {
    ev.preventDefault()
    const startX = ev.clientX, startW = p.getBoundingClientRect().width
    document.body.style.cursor = 'col-resize'
    const move = e2 => { p.style.width = clampWidth(startW + (e2.clientX - startX)) + 'px' }
    const up = () => {
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up)
      document.body.style.cursor = ''
      ctx.state.settings.structWidth = clampWidth(Math.round(p.getBoundingClientRect().width)); ctx.persist()
    }
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up)
  })
  p.appendChild(h)
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

// Timeline-Raster: Zeile = Schritt. Links der Baustein (was passiert),
// rechts je Faden die Metastruktur (warum) — auf exakt gleicher Höhe.
export function renderTimelineGrid(parent, opts = {}) {
  const list = blocks()
  ensureIds(list)
  const threads = narr()

  if (!list.length) {
    emptyKiState(parent, 'Noch keine Bausteine.', 'Bau deinen roten Faden Stück für Stück — jede Zeile ist ein Schritt im Text.')
    const a0 = el('div', 'blk-actions')
    const add0 = el('button', 'narr-add', '+ Baustein')
    add0.addEventListener('click', () => { const nb = newBlockObj(); list.push(nb); save(); rebuildStructEverywhere(); openBlockOverlay(nb) })
    a0.appendChild(add0); kiSuggestButton(a0, 'Aus Text vorschlagen'); parent.appendChild(a0)
    return
  }

  // Flache Zeilenliste in Lese-Reihenfolge, zugeklappte Zweige werden übersprungen.
  const rows = []
  const walk = (arr, depth) => arr.forEach(b => { rows.push({ b, depth }); if ((b.children || []).length && !b.collapsed) walk(b.children, depth + 1) })
  walk(list, 0)

  const grid = el('div', 'tl-grid')
  // Spalten in JS setzen — repeat(0,…) wäre ungültiges CSS und zerbräche das Raster bei 0 Fäden.
  grid.style.gridTemplateColumns = 'minmax(160px, 1.4fr) ' + 'minmax(104px, 1fr) '.repeat(threads.length)

  grid.appendChild(el('div', 'tl-cell tl-h tl-corner', 'Zeit ↓'))
  threads.forEach((t, ti) => grid.appendChild(threadHeaderCell(t, ti)))

  rows.forEach(({ b, depth }, ri) => {
    const rowCells = [blockCell(b, depth)]
    threads.forEach((t, ti) => rowCells.push(threadCell(b, t, ti)))
    // sanftes Zeilen-Aufleuchten zum Nachverfolgen (was passiert ↔ warum, gleiche Höhe)
    rowCells.forEach(c => {
      c.addEventListener('mouseenter', () => rowCells.forEach(x => x.classList.add('tl-rowhi')))
      c.addEventListener('mouseleave', () => rowCells.forEach(x => x.classList.remove('tl-rowhi')))
      grid.appendChild(c)
    })
  })

  if (opts.drag) {
    const end = el('div', 'tl-endzone'); end.style.gridColumn = '1 / -1'
    end.addEventListener('dragover', ev => { if (Array.from(ev.dataTransfer.types).includes('application/x-blkid')) { ev.preventDefault(); end.classList.add('drop-in') } })
    end.addEventListener('dragleave', () => end.classList.remove('drop-in'))
    end.addEventListener('drop', ev => {
      end.classList.remove('drop-in')
      const id = ev.dataTransfer.getData('application/x-blkid'); if (!id) return
      ev.preventDefault()
      const src = findBlock(list, id); if (!src) return
      src.arr.splice(src.idx, 1); list.push(src.b)
      save(); (opts.onChange || rebuildStructEverywhere)()
    })
    grid.appendChild(end)
  }
  parent.appendChild(grid)
  if (threads.length) drawThreadLines(grid, threads)

  // Die KI hat die Fäden noch nicht abgeleitet (leerer/neuer Text) — ruhiger Hinweis.
  if (!threads.length) {
    const rest = el('div', 'tl-ki-rest')
    rest.appendChild(el('div', 'ki-empty-title', 'Die Metastruktur entsteht automatisch.'))
    rest.appendChild(el('div', 'ki-empty-hint', 'Sobald die KI angeschlossen ist, liest sie deinen Text und die Bausteine, zieht die Erzählfäden nach und hält sie aktuell — du musst nichts zuordnen.'))
    parent.appendChild(rest)
  }

  // Verwaiste Notizen sichtbar machen (die KI ordnet sie beim nächsten Durchgang neu ein).
  const liveIds = new Set(); const gather = arr => arr.forEach(b => { liveIds.add(b.id); gather(b.children || []) }); gather(list)
  const orphans = []
  threads.forEach((t, ti) => (t.steps || []).forEach(s => { if (!liveIds.has(s.blockId)) orphans.push({ t, ti, s }) }))
  if (orphans.length) {
    const box = el('div', 'tl-orphans')
    box.appendChild(el('div', 'panel-sub', 'Noch ohne Baustein — die KI ordnet das beim nächsten Durchgang neu ein:'))
    orphans.forEach(o => {
      const row = el('div', 'tl-orphan')
      const sw = el('span', 'narr-swatch'); sw.style.background = threadColorOf(o.t, o.ti); row.appendChild(sw)
      row.appendChild(el('div', 'tl-orphan-txt', ((o.s.h ? o.s.h + ' — ' : '') + (o.s.p || '(leer)'))))
      const del = el('button', 'narr-del'); del.innerHTML = icon(PIC.x); del.title = 'Notiz entfernen'
      del.addEventListener('click', () => { const i = o.t.steps.indexOf(o.s); if (i >= 0) o.t.steps.splice(i, 1); save(); rebuildStructEverywhere() })
      row.appendChild(del)
      box.appendChild(row)
    })
    parent.appendChild(box)
  }

  const actions = el('div', 'blk-actions')
  const add = el('button', 'narr-add', '+ Baustein')
  add.addEventListener('click', () => { const nb = newBlockObj(); list.push(nb); save(); rebuildStructEverywhere(); openBlockOverlay(nb) })
  actions.appendChild(add)
  // Die Metastruktur (Fäden + Warum je Schritt) leitet die KI ab und hält sie aktuell.
  kiSuggestButton(actions, 'Metastruktur aktualisieren')
  parent.appendChild(actions)

  function threadHeaderCell(t, ti) {
    const c = el('div', 'tl-cell tl-h tl-thread-h'); c.dataset.thread = ti
    c.addEventListener('mouseenter', () => highlightThread(ti))
    c.addEventListener('mouseleave', () => highlightThread(null))
    const sw = el('span', 'narr-swatch'); sw.style.background = threadColorOf(t, ti); c.appendChild(sw)
    const lab = el('div', 'tl-thread-name', t.title); lab.style.color = threadColorOf(t, ti); makeEditable(lab, v => { t.title = v || t.title; save() }); c.appendChild(lab)
    const del = el('button', 'narr-del'); del.innerHTML = icon(PIC.x); del.title = 'Faden entfernen'
    del.addEventListener('click', () => { const i = threads.indexOf(t); if (i >= 0) threads.splice(i, 1); save(); rebuildStructEverywhere() })
    c.appendChild(del)
    return c
  }
  function blockCell(b, depth) {
    const c = el('div', 'tl-cell tl-block'); c.dataset.bid = b.id
    c.style.paddingLeft = (10 + depth * 15) + 'px'
    const head = el('div', 'tl-block-head')
    if ((b.children || []).length) {
      const chev = el('button', 'tl-chev' + (b.collapsed ? ' col' : ''))
      chev.innerHTML = icon('<path d="M9 6l6 6-6 6"/>'); chev.title = b.collapsed ? 'Aufklappen' : 'Zuklappen'
      chev.addEventListener('click', ev => { ev.stopPropagation(); b.collapsed = !b.collapsed; save(); rebuildStructEverywhere() })
      head.appendChild(chev)
    } else head.appendChild(el('span', 'tl-chev-spacer'))
    head.appendChild(el('div', 'tl-block-title', b.title))
    if (b.note && !b.note.resolved) {
      const dot = el('button', 'tl-note-dot'); dot.title = b.note.text
      dot.addEventListener('click', ev => { ev.stopPropagation(); openNoteOverlay(b) })
      head.appendChild(dot)
    }
    c.appendChild(head)
    if (b.content) {
      const body = el('div', 'tl-block-body', b.content)
      c.appendChild(body)
      if (b.content.length > 70) {
        const tog = el('button', 'tl-more', 'mehr')
        tog.addEventListener('click', ev => { ev.stopPropagation(); const open = body.classList.toggle('open'); tog.textContent = open ? 'weniger' : 'mehr' })
        c.appendChild(tog)
      }
    }
    c.addEventListener('click', () => openBlockOverlay(b))
    if (opts.drag) { c.draggable = true; attachBlockDrag(c, b, opts) }
    return c
  }
  function threadCell(b, t, ti) {
    const step = (t.steps || []).find(s => s.blockId === b.id)
    const c = el('div', 'tl-cell tl-tcell ' + (step ? 'filled' : 'empty')); c.dataset.thread = ti
    if (step) {
      c.style.borderLeftColor = threadColorOf(t, ti)
      const h = el('div', 'tl-tc-h', step.h); if (!step.h) h.dataset.ph = 'Schritt'; makeEditable(h, v => { step.h = v; save() })
      const p = el('div', 'tl-tc-p', step.p); if (!step.p) p.dataset.ph = 'Was macht dieser Schritt für den Faden?'; makeEditable(p, v => { step.p = v; save() }, { multiline: true })
      c.appendChild(h); c.appendChild(p)
      const del = el('button', 'tl-tc-del'); del.innerHTML = icon(PIC.x); del.title = 'Notiz entfernen'
      del.addEventListener('click', ev => { ev.stopPropagation(); const i = t.steps.indexOf(step); if (i >= 0) t.steps.splice(i, 1); save(); rebuildStructEverywhere() })
      c.appendChild(del)
      c.addEventListener('mouseenter', () => highlightThread(ti))
      c.addEventListener('mouseleave', () => highlightThread(null))
    }
    // Leere Zelle bleibt leer — die KI trägt die Metastruktur hier automatisch ein.
    return c
  }
}
function newBlockObj() { return { id: nid('b'), title: 'Neuer Baustein', role: '', content: '', why: '', sources: [], note: null, collapsed: false, children: [] } }

// Verbundene Faden-Linien im Raster: je Faden eine Linie von der ersten bis zur
// letzten Notiz mit Punkten — man sieht, wann ein Faden beginnt und endet.
function drawThreadLines(grid, threads) {
  const NS = 'http://www.w3.org/2000/svg'
  const draw = () => {
    const old = grid.querySelector(':scope > .tl-lines'); if (old) old.remove()
    if (!grid.offsetHeight) return
    const grect = grid.getBoundingClientRect()
    const svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('class', 'tl-lines'); svg.setAttribute('width', grid.clientWidth); svg.setAttribute('height', grid.scrollHeight)
    threads.forEach((t, ti) => {
      const cells = grid.querySelectorAll('.tl-tcell.filled[data-thread="' + ti + '"]')
      if (!cells.length) return
      const color = threadColorOf(t, ti)
      const x = cells[0].getBoundingClientRect().left - grect.left + 8
      const ys = Array.from(cells).map(c => {
        const hh = c.querySelector('.tl-tc-h'); const rr = (hh || c).getBoundingClientRect()
        return rr.top - grect.top + (hh ? rr.height / 2 : 11)
      })
      const g = document.createElementNS(NS, 'g'); g.setAttribute('data-thread', ti)
      if (ys.length > 1) {
        const ln = document.createElementNS(NS, 'line')
        ln.setAttribute('x1', x); ln.setAttribute('x2', x)
        ln.setAttribute('y1', Math.min.apply(null, ys)); ln.setAttribute('y2', Math.max.apply(null, ys))
        ln.setAttribute('stroke-width', '2'); ln.setAttribute('stroke-linecap', 'round'); ln.style.stroke = color
        g.appendChild(ln)
      }
      ys.forEach(y => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', '3.5'); c.style.fill = color; g.appendChild(c) })
      svg.appendChild(g)
    })
    grid.appendChild(svg)
  }
  requestAnimationFrame(draw)
  if (grid._ro) grid._ro.disconnect()
  grid._ro = new ResizeObserver(() => requestAnimationFrame(draw))
  grid._ro.observe(grid)
}

// Alle IDs eines Baustein-Teilbaums (für die Bereinigung beim Löschen).
function collectIds(b, out) { out = out || []; out.push(b.id); (b.children || []).forEach(c => collectIds(c, out)); return out }
// Faden-Notizen entfernen, die auf gelöschte Bausteine zeigen — keine Karteileichen.
function pruneNarrativeSteps(ids) { const set = new Set(ids); narr().forEach(t => { t.steps = (t.steps || []).filter(s => !set.has(s.blockId)) }) }


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

// Nach einer Umstrukturierung beide Orte neu bauen. Die Metastruktur-Zellen
// bleiben zeilengleich mit ihren Bausteinen (dasselbe Raster) — echt gekoppelt.
function onStructChanged() { rebuildStructEverywhere(); save() }

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
// KI-Anmerkungen: schwebende Rand-Bubbles an ihrer Textstelle (immer sichtbar).
// Formulierung (blau) + Inhalt (grün) in einer Spalte; Linie zur Stelle, Passage
// dezent markiert; Klick → großes Overlay. Von der KI erzeugt, nicht manuell.
// ============================================================
let laneInner = null
export function buildLane() {
  const lane = document.getElementById('lane')
  if (!lane) return
  lane.innerHTML = ''
  if (lane.hasAttribute('hidden')) {
    laneInner = null
    if (ctx) ctx.editor.commands.setAnnos([])
    const layer = document.querySelector('#mainBody > .anno-layer'); if (layer) layer.innerHTML = ''
    updateLaneBadge(); return
  }
  laneInner = el('div', 'lane-inner')
  lane.appendChild(laneInner)
  bindMarkClicks()
  layoutAnnotations()
  // Nach dem nächsten Frame noch einmal ausrichten — der Editor ist beim ersten
  // Aufbau (Ansichtswechsel) oft noch nicht vermessen (coordsAtPos wäre falsch).
  requestAnimationFrame(() => { if (laneInner && !document.getElementById('lane').hasAttribute('hidden')) layoutAnnotations() })
  updateLaneBadge()
}
// Klick auf eine Text-Markierung ('mark'-Form) öffnet das große Overlay — einmalig gebunden.
let markClickBound = false
function bindMarkClicks() {
  if (markClickBound || !ctx || !ctx.editor) return
  markClickBound = true
  ctx.editor.view.dom.addEventListener('click', e => {
    const m = e.target.closest && e.target.closest('.anno-mark[data-aid]')
    if (!m) return
    const c = laneList().find(x => x.id === m.getAttribute('data-aid'))
    if (c) { e.preventDefault(); openAnnoOverlay(c) }
  })
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
// Ebene über dem ganzen Textbereich für die Verbindungslinien (bis zur echten Stelle).
function getAnnoLayer() {
  const mb = document.getElementById('mainBody'); if (!mb) return null
  let l = mb.querySelector(':scope > .anno-layer')
  if (!l) { l = el('div', 'anno-layer'); mb.appendChild(l) }
  return l
}
// Bubbles an die Höhe ihrer Passage setzen, Passagen markieren (Dekoration, nicht
// gespeichert), Linien von der Textstelle bis zur Bubble ziehen; Überlappungen weichen.
function layoutAnnotations() {
  if (!laneInner || !ctx) return
  laneInner.innerHTML = ''
  const layer = getAnnoLayer(); if (layer) layer.innerHTML = ''
  const scroll = document.getElementById('scroll')
  const page = document.getElementById('page')
  const mb = document.getElementById('mainBody')
  const lane = document.getElementById('lane')
  const items = laneList().filter(c => c.status === 'open')
  if (!scroll || !page || !mb || !page.offsetHeight) { ctx.editor.commands.setAnnos([]); return }
  const mbr = mb.getBoundingClientRect()
  const prr = page.getBoundingClientRect()
  // Rand rechts vom Text — Linien/Klammern leben hier, nie quer durch Text.
  const textRight = prr.right - 40 - mbr.left
  const laneLeft = lane.getBoundingClientRect().left - mbr.left

  // Dekoration im Text: 'mark' = Markierung, 'note' = Anker-Punkt, 'para' = nichts.
  ctx.editor.commands.setAnnos(annoDecos(null))

  // Nur Bubble-Formen (note = Linie zur Stelle, para = Klammer um den Absatz) sammeln.
  const bubbleAnchors = []
  items.forEach(c => {
    const form = c.form || 'note'
    if (form === 'mark') return
    const r = findInDoc(c.target); if (!r) return
    if (form === 'para') {
      const ext = paragraphExtent(r.from); if (!ext) return
      const yTop = ext.top - mbr.top + scroll.scrollTop
      const yBot = ext.bottom - mbr.top + scroll.scrollTop
      bubbleAnchors.push({ c, form, sx: textRight, yTop, yBot, sy: (yTop + yBot) / 2 })
    } else {
      let co; try { co = ctx.editor.view.coordsAtPos(r.from) } catch (e) { return }
      const sy = (co.top + co.bottom) / 2 - mbr.top + scroll.scrollTop
      bubbleAnchors.push({ c, form: 'note', sx: textRight, sy })
    }
  })

  const h = page.offsetHeight
  laneInner.style.height = h + 'px'
  const NS = 'http://www.w3.org/2000/svg'
  let svg = null
  if (layer) { svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'anno-svg'); svg.setAttribute('width', Math.round(mbr.width)); svg.setAttribute('height', h); layer.appendChild(svg) }

  bubbleAnchors.sort((a, b) => a.sy - b.sy)
  let prevBottom = -999
  bubbleAnchors.forEach(a => {
    const bub = annoBubble(a.c)
    laneInner.appendChild(bub)
    const top = Math.max(Math.round(a.sy) - 14, prevBottom + 12)
    bub.style.top = top + 'px'
    prevBottom = top + bub.offsetHeight
    if (svg) {
      const tx = laneLeft + 13, ty = top + 16
      if (a.form === 'para') drawBracket(svg, a, tx, ty)
      else drawConnector(svg, a.sx, a.sy, tx, ty, a.c)
    }
  })
  applyLaneTransform()
}
// Dekorationen je nach Form. hiId = hervorgehobene Anmerkung (Hover) oder null.
function annoDecos(hiId) {
  const decos = []
  laneList().filter(c => c.status === 'open').forEach(c => {
    const form = c.form || 'note'
    if (form === 'para') return                       // Absatz-Form: keine Text-Dekoration
    const r = findInDoc(c.target); if (!r) return
    if (form === 'mark') decos.push({ from: r.from, to: r.to, kind: c.kind || 'form', type: 'mark', id: c.id, hi: c.id === hiId })
    else decos.push({ to: r.to, kind: c.kind || 'form', type: 'dot', id: c.id, hi: c.id === hiId })
  })
  return decos
}
// Vertikale Ausdehnung des Absatz-Blocks an einer Position — für die Absatz-Klammer.
function paragraphExtent(pos) {
  try {
    const pm = ctx.editor.view.dom
    const node = ctx.editor.view.domAtPos(pos).node
    let elx = node.nodeType === 3 ? node.parentElement : node
    while (elx && elx.parentElement && elx.parentElement !== pm) elx = elx.parentElement
    if (!elx) return null
    const r = elx.getBoundingClientRect()
    return { top: r.top, bottom: r.bottom }
  } catch (e) { return null }
}
// Weiche Linie von der Stelle (am Rand) zur Bubble.
function drawConnector(svg, sx, sy, tx, ty, c) {
  const NS = 'http://www.w3.org/2000/svg'
  const c1x = sx + (tx - sx) * 0.45, c2x = sx + (tx - sx) * 0.6
  const path = document.createElementNS(NS, 'path')
  path.setAttribute('d', 'M' + sx + ' ' + sy + ' C' + c1x + ' ' + sy + ' ' + c2x + ' ' + ty + ' ' + tx + ' ' + ty)
  path.setAttribute('fill', 'none'); path.setAttribute('class', 'lane-conn anno-' + (c.kind || 'form'))
  path.dataset.aid = c.id
  svg.appendChild(path)
}
// Absatz-Klammer: senkrechter Strich mit Ticks oben/unten + weiche Linie zur Bubble.
function drawBracket(svg, a, tx, ty) {
  const NS = 'http://www.w3.org/2000/svg'
  const x = a.sx
  const yTop = a.yTop + 2, yBot = a.yBot - 2
  const br = document.createElementNS(NS, 'path')
  br.setAttribute('d', 'M' + (x - 7) + ' ' + yTop + ' L' + x + ' ' + yTop + ' L' + x + ' ' + yBot + ' L' + (x - 7) + ' ' + yBot)
  br.setAttribute('fill', 'none'); br.setAttribute('class', 'lane-conn lane-bracket anno-' + (a.c.kind || 'form'))
  br.dataset.aid = a.c.id
  svg.appendChild(br)
  const midY = (yTop + yBot) / 2
  const c1x = x + (tx - x) * 0.45, c2x = x + (tx - x) * 0.6
  const conn = document.createElementNS(NS, 'path')
  conn.setAttribute('d', 'M' + x + ' ' + midY + ' C' + c1x + ' ' + midY + ' ' + c2x + ' ' + ty + ' ' + tx + ' ' + ty)
  conn.setAttribute('fill', 'none'); conn.setAttribute('class', 'lane-conn anno-' + (a.c.kind || 'form'))
  conn.dataset.aid = a.c.id
  svg.appendChild(conn)
}
function applyLaneTransform() {
  const scroll = document.getElementById('scroll')
  const t = 'translateY(' + (-(scroll ? scroll.scrollTop : 0)) + 'px)'
  if (laneInner) laneInner.style.transform = t
  const layer = document.querySelector('#mainBody > .anno-layer')
  if (layer) layer.style.transform = t
}
// Klickbare Nicht-Buttons per Tastatur bedienbar machen (Enter/Leertaste).
function activateOnKey(elm, fn) {
  elm.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn() } })
}
function annoBubble(c) {
  const b = el('div', 'anno-bubble anno-' + (c.kind || 'form'))
  b.setAttribute('role', 'button'); b.tabIndex = 0
  b.setAttribute('aria-label', (c.kind === 'inhalt' ? 'Inhalt' : 'Formulierung') + ': ' + c.short)
  const head = el('div', 'anno-bhead')
  head.appendChild(el('span', 'anno-tag', c.kind === 'inhalt' ? 'Inhalt' : 'Formulierung'))
  if ((c.form || 'note') === 'para') head.appendChild(el('span', 'anno-scope', 'Absatz'))
  b.appendChild(head)
  b.appendChild(el('div', 'anno-short', c.short))
  b.addEventListener('mouseenter', () => emphasizeAnno(c.id, true))
  b.addEventListener('mouseleave', () => emphasizeAnno(c.id, false))
  b.addEventListener('focus', () => emphasizeAnno(c.id, true))
  b.addEventListener('blur', () => emphasizeAnno(c.id, false))
  b.addEventListener('click', () => openAnnoOverlay(c))
  activateOnKey(b, () => openAnnoOverlay(c))
  return b
}
// Beim Zeigen auf eine Bubble die zugehörige Textstelle + Linie betonen (und zurück).
function emphasizeAnno(id, on) {
  document.querySelectorAll('.lane-conn').forEach(p => p.classList.toggle('hi', on && p.dataset.aid === id))
  ctx.editor.commands.setAnnos(annoDecos(on ? id : null))
}
// Nach Textänderung/Scroll/Größenänderung neu ausrichten (debounced).
let annoTimer = null
export function scheduleAnnoRelayout() { if (annoTimer) clearTimeout(annoTimer); annoTimer = setTimeout(() => { if (laneInner && !document.getElementById('lane').hasAttribute('hidden')) layoutAnnotations() }, 120) }
export function onLaneScroll() { applyLaneTransform() }

// ============================================================
// Overlays — ✓ übernehmen · ⊗ verwerfen · ✕ schließen (oben rechts); Chat unten
// ============================================================
let overlayEl = null
let overlayPrevFocus = null
export function closeOverlay() {
  if (!overlayEl) return
  const b = overlayEl.querySelector('.ai-box-bento'); if (b && b._bentoRO) b._bentoRO.disconnect()
  overlayEl.remove(); overlayEl = null
  if (overlayPrevFocus && overlayPrevFocus.focus) { try { overlayPrevFocus.focus() } catch (e) {} }
  overlayPrevFocus = null
}
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function overlayShell(typeLabel, tone, onAccept, onReject) {
  const prev = document.activeElement
  closeOverlay()
  overlayPrevFocus = (prev && prev !== document.body) ? prev : null
  overlayEl = el('div', 'ai-overlay')
  const box = el('div', 'ai-box')
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', typeLabel)
  box.tabIndex = -1
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
  requestAnimationFrame(() => box.focus())   // Fokus in den Dialog (Tastatur/Screenreader)
  return box
}

// Großes Overlay (fast ganze Seite) für Coach- und Text-Anmerkungen.
function overlayShellHuge(label, tone, onA, onR) {
  const box = overlayShell(label, tone, onA, onR)
  box.classList.add('ai-box-huge')
  return box
}
function chatSection(box, topic) {
  box.appendChild(el('div', 'panel-head', 'Rückfrage an die KI'))
  const thread = el('div', 'ai-chat')
  thread.setAttribute('aria-live', 'polite')
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

// Coach-Overlay als Bento: Widget-Kacheln links (nach Wichtigkeit), KI-Chat als feste Säule rechts.
export function openCardOverlay(card) {
  const box = overlayShellHuge(card.type, card.tone,
    card.action ? () => {
      const edit = box.querySelector('.ai-prop')
      insertIntoText(edit ? edit.textContent : card.action, true)
      card.status = 'done'; save(); renderCoach(); closeOverlay()
    } : null,
    () => { card.status = 'rejected'; save(); renderCoach(); closeOverlay() })
  box.classList.add('ai-box-bento')
  box.appendChild(el('div', 'ai-title', card.text))
  renderBento(box, card)
}

// Baut das Bento-Raster + die Chat-Säule. Widgets in Jakobs Prioritäts-Reihenfolge;
// fehlt ein Inhalt, entfällt die Kachel (der Satz „es kommt auf den Kontext an“).
function renderBento(box, card) {
  const stage = el('div', 'bento-ov-stage')
  const grid = el('div', 'bento-ov-grid')
  const add = t => { if (t) grid.appendChild(t) }
  if (card.gesamt) add(bText('Gesamt-Bild', card.gesamt, 'gross'))
  else if (card.why) add(bText('Warum', card.why, 'gross'))
  if (card.narrative) add(bNarr(card))
  if (card.action != null) add(bVorschlag(card))
  if (card.definition) add(bDef(card))
  if (card.procontra) add(bProContra(card))
  if (card.contra) add(bText('Gegenargument', card.contra, 'breit'))
  if (card.quote) add(bQuote(card))
  if (card.related && card.related.length) add(bRelated(card))
  if (card.sources && card.sources.length) add(bSources(card))
  if (card.timeline && card.timeline.length) add(bTimeline(card))
  if (card.image) add(bDiagram(card))
  stage.appendChild(grid)
  stage.appendChild(bChatCol())
  box.appendChild(stage)
  finishBento(box, grid)
}
// Chat-Toggle + Masonry-Nachmessen — identisch für Coach- und Anmerkungs-Bento.
function finishBento(box, grid) {
  addChatToggle(box)                       // Chat-Säule ein-/ausklappbar (Standard: aus)
  let raf = 0
  const relayout = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; layoutBento(grid) }) }
  box._bentoRelayout = relayout
  box._bentoLayoutNow = () => layoutBento(grid)   // synchron (getBoundingClientRect erzwingt Reflow)
  requestAnimationFrame(() => { layoutBento(grid); requestAnimationFrame(() => layoutBento(grid)) })
  setTimeout(() => layoutBento(grid), 140)   // nachmessen, wenn Bilder/Schriften fertig sind
  box.querySelectorAll('.bento-img, .bento-src-shot').forEach(img => { img.addEventListener('load', relayout); img.addEventListener('error', relayout) })
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(relayout)
    grid.querySelectorAll('.bento-tile-in').forEach(inr => ro.observe(inr))
    box._bentoRO = ro
  }
}
// Ausgeglichenes 2-Spalten-Masonry: jede Kachel so hoch wie ihr Inhalt, breite Kacheln über beide Spalten,
// schmale in die jeweils kürzere Spalte — so bleiben die Spalten gleich hoch.
function layoutBento(grid) {
  if (!grid) return
  const rowH = 4, gap = 14, unit = rowH + gap
  const cols = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length)
  const next = new Array(cols).fill(1)   // nächste freie Rasterzeile je Spalte (1-basiert)
  grid.querySelectorAll('.bento-tile').forEach(t => {
    const inner = t._in || t.querySelector('.bento-tile-in'); if (!inner) return
    const span = Math.max(1, Math.ceil((inner.getBoundingClientRect().height + gap) / unit))
    const wide = cols > 1 && t.classList.contains('b-gross')   // nur „gross“ über beide Spalten (Hero)
    if (wide) {
      const start = Math.max.apply(null, next)
      t.style.gridColumn = '1 / span ' + cols
      t.style.gridRow = start + ' / span ' + span
      for (let i = 0; i < cols; i++) next[i] = start + span
    } else {
      let c = 0; for (let i = 1; i < cols; i++) if (next[i] < next[c]) c = i
      t.style.gridColumn = (c + 1) + ' / span 1'
      t.style.gridRow = next[c] + ' / span ' + span
      next[c] += span
    }
  })
}
function addChatToggle(box) {
  const actions = box.querySelector('.ai-actions'); if (!actions) return
  const b = el('button', 'ai-ico bento-chat-toggle')
  b.innerHTML = icon('<path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>')
  b.title = 'KI-Chat ein-/ausblenden'; b.setAttribute('aria-label', 'KI-Chat ein-/ausblenden')
  b.addEventListener('click', () => {
    box.classList.toggle('chat-open')
    b.classList.toggle('on', box.classList.contains('chat-open'))
    if (box._bentoLayoutNow) { box._bentoLayoutNow(); setTimeout(box._bentoLayoutNow, 50) }
  })
  actions.insertBefore(b, actions.firstChild)
}
function bTile(size, title) {
  const t = el('div', 'bento-tile b-' + size)
  const inner = el('div', 'bento-tile-in')
  inner.appendChild(el('div', 'bento-th', title))
  t.appendChild(inner); t._in = inner
  return t
}
function bText(title, text, size) {
  const t = bTile(size || 'breit', title)
  t._in.appendChild(el('div', 'bento-p', text))
  return t
}
function bNarr(card) {
  const t = bTile('breit', 'Für deine Narrative')
  t._in.appendChild(el('div', 'bento-p', card.narrative))
  if (card.thread) {
    const wrap = el('div', 'bento-chiprow')
    wrap.appendChild(el('span', 'bento-chip-lbl', 'stützt'))
    wrap.appendChild(el('span', 'bento-thread', card.thread))
    t._in.appendChild(wrap)
  }
  return t
}
function bVorschlag(card) {
  const t = bTile('breit', 'Textvorschlag')
  const prop = el('div', 'ai-prop bento-prop', card.action || '')
  makeEditable(prop, v => { card.action = v || card.action; save() }, { multiline: true })
  t._in.appendChild(prop)
  const row = el('div', 'bento-actions')
  const ins = el('button', 'bento-btn bento-btn-pri', 'Übernehmen')
  ins.addEventListener('click', () => { insertIntoText(prop.textContent, true); card.status = 'done'; save(); renderCoach(); closeOverlay() })
  row.appendChild(ins)
  t._in.appendChild(row)
  return t
}
function bQuote(card) {
  const t = bTile('breit', 'Zitat')
  t._in.appendChild(el('div', 'bento-quote', '„' + card.quote.text + '“'))
  if (card.quote.by) t._in.appendChild(el('div', 'bento-quote-by', '— ' + card.quote.by))
  return t
}
function bDef(card) {
  const t = bTile('klein', 'Begriff')
  t._in.appendChild(el('div', 'bento-term', card.definition.term))
  t._in.appendChild(el('div', 'bento-p', card.definition.text))
  return t
}
function bProContra(card) {
  const t = bTile('gross', 'Pro und Contra')
  const cols = el('div', 'bento-pc')
  const mk = (label, items, cls) => {
    const c = el('div', 'bento-pc-col ' + cls)
    c.appendChild(el('div', 'bento-pc-h', label))
    ;(items || []).forEach(x => c.appendChild(el('div', 'bento-pc-item', x)))
    return c
  }
  cols.appendChild(mk('Dafür', card.procontra.pro, 'pc-pro'))
  cols.appendChild(mk('Dagegen', card.procontra.contra, 'pc-con'))
  t._in.appendChild(cols)
  return t
}
function bRelated(card) {
  const t = bTile('breit', 'Verwandte Stellen in deinem Text')
  const list = el('div', 'bento-related')
  card.related.forEach(r => list.appendChild(el('div', 'bento-rel-item', r)))
  t._in.appendChild(list)
  return t
}
function bTimeline(card) {
  const t = bTile('breit', 'Zeitliche Einordnung')
  const tl = el('div', 'bento-timeline')
  card.timeline.forEach(s => {
    const row = el('div', 'bento-tl-row')
    row.appendChild(el('span', 'bento-tl-when', s.when))
    row.appendChild(el('span', 'bento-tl-what', s.what))
    tl.appendChild(row)
  })
  t._in.appendChild(tl)
  return t
}
function bSources(card) {
  const t = bTile('gross', 'Quellen — mehrere zum Reinlesen')
  const list = el('div', 'bento-srclist')
  card.sources.forEach(s => {
    const sc = el('div', 'bento-src')
    const img = document.createElement('img')
    img.className = 'bento-src-shot'; img.src = s.shot || sourceThumb(s); img.alt = ''
    sc.appendChild(img)
    const body = el('div', 'bento-src-body')
    const title = el('button', 'bento-src-title', (s.label || s) + '  ↗')
    if (s.url) { title.title = s.url; title.addEventListener('click', () => openExternal(s.url)) }
    body.appendChild(title)
    if (s.type) body.appendChild(el('span', 'bento-src-type', s.type))
    if (s.preview) body.appendChild(el('div', 'bento-src-prev', s.preview))
    sc.appendChild(body)
    list.appendChild(sc)
  })
  t._in.appendChild(list)
  return t
}
// Platzhalter-Vorschau einer Quelle (faux „Screenshot“) — wird später durch echte Ausschnitte ersetzt.
function sourceThumb(s) {
  const c = s.type === 'Primärquelle' ? '#3a6ea5' : s.type === 'Enzyklopädie' ? '#5a8f4e' : s.type === 'Buch' ? '#b9831f' : '#7a5aa8'
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='96' viewBox='0 0 320 96'>"
    + "<rect width='320' height='96' fill='#f4f2ec'/>"
    + "<rect width='320' height='26' fill='" + c + "'/>"
    + "<rect x='12' y='9' width='120' height='8' rx='4' fill='#ffffff' opacity='0.9'/>"
    + "<rect x='12' y='40' width='296' height='6' rx='3' fill='#cfccc2'/>"
    + "<rect x='12' y='54' width='296' height='6' rx='3' fill='#cfccc2'/>"
    + "<rect x='12' y='68' width='200' height='6' rx='3' fill='#d9d6cd'/>"
    + "<rect x='12' y='82' width='250' height='6' rx='3' fill='#d9d6cd'/>"
    + "</svg>"
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}
function bDiagram(card) {
  const t = bTile('breit', 'Diagramm / Konzept')
  const img = document.createElement('img')
  img.className = 'bento-img'; img.src = card.image; img.alt = card.imageCaption || ''
  t._in.appendChild(img)
  if (card.imageCaption) t._in.appendChild(el('div', 'bento-cap', card.imageCaption))
  return t
}
function bChatCol() {
  const col = el('div', 'bento-chat-col')
  col.appendChild(el('div', 'bento-th', 'KI-Chat'))
  const thread = el('div', 'bento-chat-thread')
  thread.setAttribute('aria-live', 'polite')
  const hint = el('div', 'bento-chat-empty', 'Stell hier Rückfragen zu dieser Anmerkung — die KI antwortet mit deinem ganzen Projekt als Kontext.')
  thread.appendChild(hint)
  col.appendChild(thread)
  const row = el('div', 'bento-chat-row')
  const inp = el('div', 'ai-chat-input'); inp.contentEditable = 'true'; inp.spellcheck = false
  inp.setAttribute('data-ph', 'Frag nach …')
  const send = el('button', 'ai-ico'); send.innerHTML = icon(PIC.send); send.title = 'Senden'
  const submit = () => {
    const q = inp.textContent.trim(); if (!q) return
    if (hint.parentNode) hint.remove()
    thread.appendChild(el('div', 'ai-msg ai-msg-user', q)); inp.textContent = ''
    thread.appendChild(el('div', 'ai-msg ai-msg-ai ki-resting-note', 'Die Rückfrage-KI ist noch nicht angeschlossen. Sobald sie es ist, antwortet sie hier mit deinem ganzen Projekt als Kontext.'))
    thread.scrollTop = thread.scrollHeight
  }
  send.addEventListener('click', submit)
  inp.addEventListener('keydown', ev => { if (ev.key === 'Escape') { ev.preventDefault(); closeOverlay(); return } ev.stopPropagation(); if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); submit() } })
  row.appendChild(inp); row.appendChild(send)
  col.appendChild(row)
  return col
}
// Text-Anmerkung als Bento (gleiche Sprache wie Coach): Stelle · Warum · Vorschlag/Varianten · Chat.
function renderAnnoBento(box, c, isForm) {
  const stage = el('div', 'bento-ov-stage')
  const grid = el('div', 'bento-ov-grid')
  const add = t => { if (t) grid.appendChild(t) }
  add(bText(isForm ? 'Im Text' : 'Betrifft die Passage', '„' + c.target + '“', 'gross'))
  if (c.why) add(bText('Warum', c.why, 'breit'))
  add(bAnnoProp(c, isForm))
  stage.appendChild(grid)
  stage.appendChild(bChatCol())
  box.appendChild(stage)
  finishBento(box, grid)
}
function bAnnoProp(c, isForm) {
  const t = bTile('breit', isForm ? 'Vorschlag — ersetzt die Stelle' : 'Vorschlag — als Absatz einfügen')
  const prop = el('div', 'ai-prop bento-prop', c.action || '')
  makeEditable(prop, v => { c.action = v || c.action; save() }, { multiline: true })
  t._in.appendChild(prop)
  if (isForm && (c.variants || []).length) {
    t._in.appendChild(el('div', 'bento-th', 'Varianten'))
    const vv = el('div', 'ai-variants')
    c.variants.forEach(v => {
      const chip = el('button', 'ai-variant', v)
      chip.addEventListener('click', () => { prop.textContent = v; c.action = v; save() })
      vv.appendChild(chip)
    })
    t._in.appendChild(vv)
  }
  return t
}

// Rote KI-Anmerkung in der Struktur: Begründung + Korrekturvorschlag.
function openNoteOverlay(block) {
  const note = block.note
  const box = overlayShellHuge('Struktur', 'warn',
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

export function openAnnoOverlay(c) {
  const isForm = (c.kind || 'form') === 'form'
  const box = overlayShellHuge(isForm ? 'Formulierung' : 'Inhalt', isForm ? 'style' : 'idea',
    () => {
      const edit = box.querySelector('.ai-prop')
      const text = edit ? edit.textContent : c.action
      const r = findInDoc(c.target)
      if (isForm) {
        if (!r) { flagNotFound(box); return }
        ctx.editor.chain().setTextSelection(r).insertContent(escHtml(text)).run()   // Passage ersetzen
      } else {
        // Inhaltlicher Vorschlag: als neuen Absatz hinter der Passage einfügen (nicht ersetzen).
        const at = r ? r.to : ctx.editor.state.doc.content.size
        ctx.editor.chain().insertContentAt(at, '<p>' + escHtml(text) + '</p>').run()
      }
      c.status = 'done'; buildLane(); ctx.scheduleSave(); closeOverlay()
    },
    () => { c.status = 'rejected'; buildLane(); save(); closeOverlay() })
  box.classList.add('ai-box-bento')
  box.appendChild(el('div', 'ai-title', c.short))
  renderAnnoBento(box, c, isForm)
}
function flagNotFound(box) {
  if (box.querySelector('.ai-warn')) return
  const warn = el('div', 'ai-warn', 'Diese Passage steht so nicht mehr im Text — vielleicht schon geändert. Die KI aktualisiert die Anmerkung beim nächsten Durchgang.')
  box.querySelector('.ai-prop').after(warn)
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
    if (f) { pruneNarrativeSteps(collectIds(b)); f.arr.splice(f.idx, 1); save(); rebuildStructEverywhere(); closeOverlay() }
  })
  foot.appendChild(del)
  box.appendChild(foot)
}
