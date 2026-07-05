// Struktur-Seite: Material sammeln (Canvas) → Bausteine ordnen → Narrative → Coach.
// Nutzt dieselben Bausteine und Fäden wie die Schreibansicht — eine Struktur, zwei Orte.

import { el, icon, PIC, MOCK_BLOCKS, tagBlocks, renderBlocksInto, renderNarrativeInto, renderCoachInto, openBlockOverlay, rebuildStructEverywhere, notifyStructChanged } from './panels.js'
import { showHomeView, setHomeMode, showEditorView } from './ui.js'

// Mock-Material auf dem Canvas — später: echte Notizen, PDFs, Videos, Bilder.
const MOCK_CANVAS = [
  { kind: 'Notiz', text: 'Ruhige Technik = volle Kraft, leise Präsentation. Vielleicht als Schlussformel?', x: 24, y: 46 },
  { kind: 'PDF', text: 'Weiser & Brown (1996): The Coming Age of Calm Technology — Originalaufsatz, 8 Seiten.', x: 150, y: 170 },
  { kind: 'YouTube', text: 'Amber Case: „Calm Technology“ — Vortrag, gute Beispiele ab Minute 12.', x: 40, y: 305 },
  { kind: 'Zitat', text: '„Technology should require the smallest possible amount of attention.“ — Case, Prinzip 1', x: 170, y: 430 },
]

let ctxS = null

export function initStructure(context) {
  ctxS = context
  buildStructRails()
  buildCanvas()
  rebuildStructColumns()
  renderCoachInto(document.getElementById('stCoach'))
  window.__rebuildStructView = rebuildStructColumns
  window.__renderStructCoach = () => renderCoachInto(document.getElementById('stCoach'))
}

function buildStructRails() {
  const rl = document.getElementById('railSL')
  const rr = document.getElementById('railSR')
  rl.innerHTML = ''; rr.innerHTML = ''
  const mk = (rail, ic, title, onClick) => {
    const b = el('button', 'rail-btn')
    b.innerHTML = icon(ic)
    b.title = title
    b.setAttribute('aria-label', title)
    b.addEventListener('click', onClick)
    rail.appendChild(b)
    return b
  }
  mk(rl, PIC.home, 'Projekte (Startseite)', () => { setHomeMode('projects'); showHomeView() })
  mk(rl, PIC.toText, 'Zum Text', () => showEditorView())
}

// ---------- Canvas: Material frei anordnen ----------
function buildCanvas() {
  const col = document.getElementById('stCanvas')
  col.innerHTML = ''
  const head = el('div', 'st-head')
  head.appendChild(el('div', 'panel-head', 'Material'))
  const add = el('button', 'narr-add', '+ Notiz')
  add.addEventListener('click', () => {
    MOCK_CANVAS.push({ kind: 'Notiz', text: 'Neuer Gedanke …', x: 30, y: 30 })
    buildCanvas()
  })
  head.appendChild(add)
  col.appendChild(head)
  col.appendChild(el('div', 'panel-sub', 'Sammeln und frei anordnen — Notizen, PDFs, Videos, Zitate. Aus jedem Stück kann ein Baustein werden.'))
  const cv = el('div', 'cv')
  MOCK_CANVAS.forEach(c => cv.appendChild(canvasCard(c, cv)))
  col.appendChild(cv)
}

function canvasCard(c, cv) {
  const card = el('div', 'cv-card cv-' + c.kind.toLowerCase())
  card.style.left = c.x + 'px'
  card.style.top = c.y + 'px'
  card.appendChild(el('span', 'cv-kind', c.kind))
  const txt = el('div', 'cv-text', c.text)
  txt.contentEditable = 'true'
  txt.spellcheck = false
  txt.addEventListener('blur', () => { c.text = txt.textContent.trim() || c.text })
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
      role: c.kind === 'Zitat' ? 'Beleg' : 'Baustein',
      content: c.text,
      why: 'Aus dem Material übernommen — die Begründung kann hier ergänzt werden.',
      sources: c.kind === 'PDF' || c.kind === 'YouTube' || c.kind === 'Zitat' ? [c.text.slice(0, 60)] : [],
      children: [],
    }
    MOCK_BLOCKS.push(nb)
    tagBlocks(MOCK_BLOCKS)
    rebuildStructEverywhere()
    openBlockOverlay(nb)
  })
  card.appendChild(mk)
  // Frei verschieben mit der Maus
  card.addEventListener('mousedown', ev => {
    if (ev.button !== 0) return
    ev.preventDefault()
    const startX = ev.clientX - c.x, startY = ev.clientY - c.y
    card.classList.add('cv-drag')
    const move = e2 => {
      c.x = Math.max(0, Math.min(e2.clientX - startX, cv.clientWidth - card.offsetWidth))
      c.y = Math.max(0, e2.clientY - startY)
      card.style.left = c.x + 'px'
      card.style.top = c.y + 'px'
    }
    const up = () => {
      card.classList.remove('cv-drag')
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  })
  return card
}

// ---------- Bausteine + Narrative (dieselben wie in der Schreibansicht) ----------
function rebuildStructColumns() {
  const s = document.getElementById('stStruct')
  const n = document.getElementById('stNarr')
  if (!s || !n) return
  s.innerHTML = ''
  s.appendChild(el('div', 'panel-head', 'Struktur'))
  s.appendChild(el('div', 'panel-sub', 'Bausteine ordnen — klicken zum Öffnen, ziehen zum Verschieben. Alles hier erscheint genauso in der Schreibansicht.'))
  renderBlocksInto(s, { drag: true, note: true, onChange: notifyStructChanged })
  n.innerHTML = ''
  n.appendChild(el('div', 'panel-head', 'Narrative'))
  n.appendChild(el('div', 'panel-sub', 'Die Fäden, die sich durch den Text ziehen — Struktur und Narrative halten sich im Einklang.'))
  renderNarrativeInto(n)
}
