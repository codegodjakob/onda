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
  layoutAnnotations()
  // Nach dem nächsten Frame noch einmal ausrichten — der Editor ist beim ersten
  // Aufbau (Ansichtswechsel) oft noch nicht vermessen (coordsAtPos wäre falsch).
  requestAnimationFrame(() => { if (laneInner && !document.getElementById('lane').hasAttribute('hidden')) layoutAnnotations() })
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
  const srect = scroll.getBoundingClientRect()
  const mbr = mb.getBoundingClientRect()
  const prr = page.getBoundingClientRect()
  // Linien starten immer am rechten Textrand (in der Marge) — nie quer durch Text.
  const textRight = prr.right - 40 - mbr.left
  const laneLeft = lane.getBoundingClientRect().left - mbr.left
  const anchors = []
  items.forEach(c => {
    const r = findInDoc(c.target); if (!r) return
    let co
    try { co = ctx.editor.view.coordsAtPos(r.from) } catch (e) { return }
    const yTop = co.top - mbr.top + scroll.scrollTop
    const yMid = (co.top + co.bottom) / 2 - mbr.top + scroll.scrollTop
    anchors.push({ c, r, y: yTop, sx: textRight, sy: yMid })
  })
  anchors.sort((a, b) => a.y - b.y)
  anchors.forEach((a, i) => { a.num = i + 1; a.c._num = i + 1 })   // Nummern in Textreihenfolge
  ctx.editor.commands.setAnnos(anchors.map(a => ({ from: a.r.from, to: a.r.to, kind: a.c.kind || 'form', num: a.num })))
  const h = page.offsetHeight
  laneInner.style.height = h + 'px'
  const NS = 'http://www.w3.org/2000/svg'
  let svg = null
  if (layer) { svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'anno-svg'); svg.setAttribute('width', Math.round(mbr.width)); svg.setAttribute('height', h); layer.appendChild(svg) }
  anchors.sort((a, b) => a.y - b.y)
  let prevBottom = -999
  anchors.forEach(a => {
    const bub = annoBubble(a.c)
    laneInner.appendChild(bub)
    const top = Math.max(Math.round(a.y) - 4, prevBottom + 12)
    bub.style.top = top + 'px'
    prevBottom = top + bub.offsetHeight
    if (svg) {
      const tx = laneLeft + 13, ty = top + 15
      const c1x = a.sx + (tx - a.sx) * 0.45, c2x = a.sx + (tx - a.sx) * 0.6
      const path = document.createElementNS(NS, 'path')
      path.setAttribute('d', 'M' + a.sx + ' ' + a.sy + ' C' + c1x + ' ' + a.sy + ' ' + c2x + ' ' + ty + ' ' + tx + ' ' + ty)
      path.setAttribute('fill', 'none'); path.setAttribute('class', 'lane-conn anno-' + (a.c.kind || 'form'))
      path.dataset.aid = a.c.id
      svg.appendChild(path)
    }
  })
  applyLaneTransform()
}
function applyLaneTransform() {
  const scroll = document.getElementById('scroll')
  const t = 'translateY(' + (-(scroll ? scroll.scrollTop : 0)) + 'px)'
  if (laneInner) laneInner.style.transform = t
  const layer = document.querySelector('#mainBody > .anno-layer')
  if (layer) layer.style.transform = t
}
function annoBubble(c) {
  const b = el('div', 'anno-bubble anno-' + (c.kind || 'form'))
  const head = el('div', 'anno-bhead')
  if (c._num != null) head.appendChild(el('span', 'anno-num anno-' + (c.kind || 'form'), String(c._num)))
  head.appendChild(el('span', 'anno-tag', c.kind === 'inhalt' ? 'Inhalt' : 'Formulierung'))
  b.appendChild(head)
  b.appendChild(el('div', 'anno-short', c.short))
  b.addEventListener('mouseenter', () => emphasizeAnno(c.id, true))
  b.addEventListener('mouseleave', () => emphasizeAnno(c.id, false))
  b.addEventListener('click', () => openAnnoOverlay(c))
  return b
}
// Beim Zeigen auf eine Bubble die zugehörige Textstelle + Linie betonen (und zurück).
function emphasizeAnno(id, on) {
  document.querySelectorAll('.lane-conn').forEach(p => p.classList.toggle('hi', on && p.dataset.aid === id))
  const decos = []
  laneList().filter(c => c.status === 'open').forEach(c => {
    const r = findInDoc(c.target); if (r) decos.push({ from: r.from, to: r.to, kind: c.kind || 'form', num: c._num, hi: on && c.id === id })
  })
  ctx.editor.commands.setAnnos(decos)
}
// Nach Textänderung/Scroll/Größenänderung neu ausrichten (debounced).
let annoTimer = null
export function scheduleAnnoRelayout() { if (annoTimer) clearTimeout(annoTimer); annoTimer = setTimeout(() => { if (laneInner && !document.getElementById('lane').hasAttribute('hidden')) layoutAnnotations() }, 120) }
export function onLaneScroll() { applyLaneTransform() }

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

// Großes Overlay (fast ganze Seite) für Coach- und Text-Anmerkungen.
function overlayShellHuge(label, tone, onA, onR) {
  const box = overlayShell(label, tone, onA, onR)
  box.classList.add('ai-box-huge')
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
  const box = overlayShellHuge(card.type, card.tone,
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
  box.appendChild(el('div', 'ai-title', c.short))
  box.appendChild(el('div', 'panel-head', isForm ? 'Im Text' : 'Betrifft die Passage'))
  box.appendChild(el('div', 'ai-orig', '„' + c.target + '“'))
  box.appendChild(el('div', 'panel-head', 'Warum'))
  box.appendChild(el('div', 'ai-why', c.why))
  box.appendChild(el('div', 'panel-head', isForm ? 'Vorschlag (bearbeitbar)' : 'Vorschlag — als Absatz einfügen (bearbeitbar)'))
  const prop = el('div', 'ai-prop', c.action || '')
  makeEditable(prop, v => { c.action = v || c.action; save() }, { multiline: true })
  box.appendChild(prop)
  // Varianten (nur Formulierung): Klick setzt den Vorschlag.
  if (isForm && (c.variants || []).length) {
    const vv = el('div', 'ai-variants')
    c.variants.forEach(v => {
      const chip = el('button', 'ai-variant', v)
      chip.addEventListener('click', () => { prop.textContent = v; c.action = v; save() })
      vv.appendChild(chip)
    })
    box.appendChild(el('div', 'panel-head', 'Varianten'))
    box.appendChild(vv)
  }
  chatSection(box, c.short)
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
