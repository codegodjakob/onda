// Struktur-Seite: Material sammeln (Canvas) → Bausteine ordnen → Narrative → Coach.
// Material gehört zum Projekt, Struktur/Narrative zum Text — dieselben Daten wie im Editor.

import { el, icon, PIC, renderBlocksInto, renderNarrativeInto, renderCoachInto, openBlockOverlay, notifyStructChanged, addRootBlock } from './panels.js'
import { showHomeView, setHomeMode, showEditorView } from './ui.js'

let ctxS = null
let cardSeq = 0

function material() { const p = ctxS.activeProjectObj(); return p ? (p.material = p.material || []) : [] }
function saveS() { ctxS.scheduleSave() }

export function initStructure(context) {
  ctxS = context
  buildStructRails()
  buildCanvas()
  rebuildStructColumns()
  renderCoachInto(document.getElementById('stCoach'))
  window.__rebuildStructView = () => { buildCanvas(); rebuildStructColumns() }
  window.__renderStructCoach = () => renderCoachInto(document.getElementById('stCoach'))
}

function buildStructRails() {
  const rl = document.getElementById('railSL')
  const rr = document.getElementById('railSR')
  rl.innerHTML = ''; rr.innerHTML = ''
  const mk = (rail, ic, title, onClick) => {
    const b = el('button', 'rail-btn')
    b.innerHTML = icon(ic); b.title = title; b.setAttribute('aria-label', title)
    b.addEventListener('click', onClick)
    rail.appendChild(b); return b
  }
  mk(rl, PIC.home, 'Projekte (Startseite)', () => { ctxS.flushSave(); setHomeMode('projects'); showHomeView() })
  mk(rl, PIC.toText, 'Zum Text', () => { ctxS.flushSave(); showEditorView() })
  const cb = mk(rr, PIC.coach, 'Coach ein-/ausblenden', () => {
    const c = document.getElementById('stCoach')
    const open = c.hasAttribute('hidden')
    if (open) c.removeAttribute('hidden'); else c.setAttribute('hidden', '')
    cb.classList.toggle('on', open)
  })
  cb.classList.add('on')
}

// ---------- Canvas: Material frei anordnen (pro Projekt) ----------
function buildCanvas() {
  const col = document.getElementById('stCanvas')
  if (!col) return
  col.innerHTML = ''
  const head = el('div', 'st-head')
  head.appendChild(el('div', 'panel-head', 'Material'))
  const add = el('button', 'narr-add', '+ Notiz')
  add.addEventListener('click', () => {
    const n = material().length
    material().push({ id: 'm' + Date.now().toString(36) + (cardSeq++), kind: 'Notiz', text: 'Neuer Gedanke …', x: 24 + (n % 4) * 20, y: 24 + (n % 6) * 26 })
    saveS(); buildCanvas()
  })
  head.appendChild(add)
  col.appendChild(head)
  col.appendChild(el('div', 'panel-sub', 'Sammeln und frei anordnen — Notizen, Quellen, Zitate. Aus jedem Stück kann ein Baustein werden.'))
  const cv = el('div', 'cv')
  const list = material()
  if (!list.length) col.appendChild(el('div', 'panel-empty', 'Noch kein Material. „+ Notiz" legt das erste Stück an.'))
  list.forEach(c => cv.appendChild(canvasCard(c, cv)))
  col.appendChild(cv)
}

function canvasCard(c, cv) {
  const card = el('div', 'cv-card cv-' + c.kind.toLowerCase())
  card.style.left = c.x + 'px'; card.style.top = c.y + 'px'
  card.appendChild(el('span', 'cv-kind', c.kind))
  const del = el('button', 'cv-del'); del.innerHTML = icon(PIC.x); del.title = 'Entfernen'
  del.addEventListener('mousedown', ev => ev.stopPropagation())
  del.addEventListener('click', ev => { ev.stopPropagation(); const l = material(); const i = l.indexOf(c); if (i >= 0) l.splice(i, 1); saveS(); buildCanvas() })
  card.appendChild(del)
  const txt = el('div', 'cv-text', c.text)
  txt.contentEditable = 'true'; txt.spellcheck = false
  txt.addEventListener('blur', () => { c.text = txt.textContent.trim() || c.text; saveS() })
  txt.addEventListener('mousedown', ev => ev.stopPropagation())
  txt.addEventListener('keydown', ev => ev.stopPropagation())
  card.appendChild(txt)
  const mk = el('button', 'cv-make', '+ Baustein')
  mk.title = 'Aus diesem Material einen Baustein machen'
  mk.addEventListener('mousedown', ev => ev.stopPropagation())
  mk.addEventListener('click', ev => {
    ev.stopPropagation()
    const nb = {
      title: c.text.split(/[.!?—]/)[0].slice(0, 34) || c.kind,
      role: c.kind === 'Zitat' ? 'Beleg' : '',
      content: c.text,
      why: '', note: null,
      sources: (c.kind === 'PDF' || c.kind === 'YouTube' || c.kind === 'Zitat') ? [c.text.slice(0, 60)] : [],
      children: [],
    }
    addRootBlock(nb)
    openBlockOverlay(nb)
  })
  card.appendChild(mk)
  card.addEventListener('mousedown', ev => {
    if (ev.button !== 0) return
    ev.preventDefault()
    const startX = ev.clientX - c.x, startY = ev.clientY - c.y
    card.classList.add('cv-drag')
    const move = e2 => {
      c.x = Math.max(0, Math.min(e2.clientX - startX, cv.clientWidth - card.offsetWidth))
      c.y = Math.max(0, e2.clientY - startY)
      card.style.left = c.x + 'px'; card.style.top = c.y + 'px'
    }
    const up = () => {
      card.classList.remove('cv-drag'); saveS()
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up)
  })
  return card
}

// ---------- Bausteine + Narrative (dieselben Daten wie im Editor) ----------
function rebuildStructColumns() {
  const s = document.getElementById('stStruct')
  const n = document.getElementById('stNarr')
  if (!s || !n) return
  s.innerHTML = ''
  s.appendChild(el('div', 'panel-head', 'Struktur'))
  s.appendChild(el('div', 'panel-sub', 'Bausteine ordnen — klicken zum Öffnen, ziehen zum Verschieben. Erscheint genauso in der Schreibansicht.'))
  renderBlocksInto(s, { drag: true, note: true, onChange: notifyStructChanged })
  n.innerHTML = ''
  n.appendChild(el('div', 'panel-head', 'Narrative'))
  n.appendChild(el('div', 'panel-sub', 'Die Fäden, die sich durch den Text ziehen — im Einklang mit der Struktur.'))
  renderNarrativeInto(n)
}
