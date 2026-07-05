// Panels & KI-Interface (Interface-first, Mock-Daten):
// Editor: Mini-Gliederung im Textbereich · kombinierte Struktur+Narrative-Leiste ·
// Formulierungs-Spalte rechts am Text · Coach rechts · reiche Overlays mit Rückfrage-Chat.
// Struktur-Seite (structure.js) nutzt die Exporte hier — eine Struktur, überall synchron.

import { showHomeView, setHomeMode, showStructView } from './ui.js'

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
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  send: '<path d="M4 12h13M17 12l-5-5M17 12l-5 5"/>',
}

// ============================================================
// Mock-Daten — Platzhalter, bis die echte KI angeschlossen wird
// ============================================================

export const MOCK_BLOCKS = [
  { title: 'Einleitung', role: 'Eröffnung', content: 'Calm Technology beschreibt Technik, die in der Peripherie bleibt und Aufmerksamkeit nur beansprucht, wenn es nötig ist.', why: 'Öffnet das Thema über eine Alltagserfahrung und stellt die Leitfrage, bevor Begriffe fallen.', sources: ['Weiser & Brown (1996)'], children: [
    { title: 'Relevanz', role: 'Motivation', content: 'Ständige Benachrichtigungen fragmentieren die Aufmerksamkeit — ruhige Werkzeuge sind die Gegenbewegung.', why: 'Begründet, warum das Thema jetzt wichtig ist.', sources: ['Mark, G. (2023): Attention Span'], children: [] },
    { title: 'Leitfrage', role: 'Frage', content: 'Wie muss ein Schreibwerkzeug gestaltet sein, damit es das Denken unterstützt statt unterbricht?', why: 'Verwandelt die Beobachtung in eine beantwortbare Frage — der Anker des ganzen Textes.', sources: [], children: [] },
  ]},
  { title: 'Hauptteil', role: 'Argumentation', content: '', why: 'Trägt die Argumentation von den Prinzipien zur Anwendung.', sources: [], children: [
    { title: 'Prinzipien', role: 'Fundament', content: 'Weiser und Brown formulierten: Technik soll sich an den Rändern der Aufmerksamkeit bewegen und nahtlos zwischen Zentrum und Peripherie wechseln.', why: 'Setzt den Maßstab, an dem alle Beispiele gemessen werden.', sources: ['Weiser & Brown (1996)', 'Case, A. (2015): Calm Technology'], children: [] },
    { title: 'Beispiele', role: 'Anschauung', content: 'Die Teekanne pfeift erst, wenn es relevant ist. Eine Statusleuchte informiert, ohne zu unterbrechen.', why: 'Macht die abstrakten Prinzipien an vertrauten Objekten greifbar.', sources: ['Case, A. (2015)'], children: [] },
    { title: 'Übertragung aufs Schreiben', role: 'Transfer', content: 'Für Schreibsoftware heißt das: Werkzeuge erscheinen im Kontext, Hinweise sammeln sich leise, nichts drängt sich in den Fluss.', why: 'Führt die Prinzipien in die eigentliche Domäne des Textes — der Kern der Eigenleistung.', sources: [], children: [] },
  ]},
  { title: 'Schluss', role: 'Auflösung', content: 'Ruhige Technik ist kein Verzicht auf Funktionen, sondern eine Haltung: volle Kraft, leise Präsentation.', why: 'Löst die Leitfrage auf und verdichtet die Erkenntnis zu einer Formel.', sources: [], children: [] },
]

// KI-Anmerkung innerhalb der Struktur (dünner roter Strich) — sitzt nach diesem Block
export const MOCK_STRUCT_NOTE = {
  after: 'Beispiele',
  text: 'Hier fehlt der Übergang von den Beispielen zur Schreib-Domäne.',
  why: 'Die Beispiele enden bei physischen Objekten (Teekanne, Statusleuchte), der nächste Baustein springt direkt zur Software. Ein Satz, der das Gemeinsame benennt — „informieren ohne zu unterbrechen“ — würde die Brücke schlagen.',
  fix: 'Was Teekanne und Statusleuchte verbindet, ist ein Entwurfsprinzip: Information ohne Unterbrechung. Genau dieses Prinzip lässt sich auf Software übertragen.',
}

export const MOCK_NARRATIVE = [
  { title: 'Problem: laute Technik', steps: [
    { h: 'Eröffnung (Einleitung)', p: 'Der Text beginnt mit einer vertrauten Erfahrung: Geräte, die sich ständig melden. Die Leserin erkennt ihr eigenes Genervt-Sein wieder — das Problem braucht keine Statistik, es ist fühlbar.' },
    { h: 'Vertiefung (Beispiele)', p: 'An Teekanne und Statusleuchte wird sichtbar, dass es auch anders geht: dieselbe Information, aber ohne Unterbrechung. Das Problem bekommt eine Kontrastfolie.' },
    { h: 'Auflösung (Schluss)', p: 'Der Schluss kehrt zur Anfangserfahrung zurück und zeigt: Lautheit ist keine Eigenschaft von Technik, sondern eine Design-Entscheidung — sie lässt sich anders treffen.' },
  ]},
  { title: 'These: Peripherie statt Alarm', steps: [
    { h: 'Ankündigung (Leitfrage)', p: 'Die Leitfrage deutet die These bereits an: Ein gutes Werkzeug unterstützt das Denken, statt es zu unterbrechen — Aufmerksamkeit ist die knappe Ressource.' },
    { h: 'Begründung (Prinzipien)', p: 'Mit Weiser und Brown erhält die These ihr Fundament: Technik kann zwischen Zentrum und Peripherie der Aufmerksamkeit wechseln. Ruhe ist machbar, nicht nur wünschenswert.' },
    { h: 'Noch offen: Rückbindung im Schluss', p: 'Die These wird im Schluss bisher nur angedeutet. Es fehlt der Satz, der sie ausdrücklich als Antwort auf die Leitfrage feststellt.', open: true },
  ]},
  { title: 'Methode: vom Prinzip zum Werkzeug', steps: [
    { h: 'Maßstab setzen (Prinzipien)', p: 'Zuerst wird der Bewertungsmaßstab etabliert — was „ruhig“ überhaupt heißt. Ohne ihn wären die Beispiele beliebig.' },
    { h: 'Anwenden (Übertragung)', p: 'Dann wird der Maßstab auf Schreibsoftware angewendet: Werkzeuge im Kontext, Hinweise in der Peripherie. Hier entsteht die Eigenleistung des Textes.' },
  ]},
]

// Coach: nur Struktur- und Inhalts-Hinweise — Formulierung lebt in der Text-Spalte.
const MOCK_COACH = [
  {
    type: 'Struktur', tone: 'warn',
    text: 'Der Abschnitt „Beispiele“ kommt vor den „Prinzipien“ — die Argumentation trägt besser andersherum.',
    why: 'Deine geplante Struktur (Bauklötze) sieht Prinzipien → Beispiele vor. Im Text ist die Reihenfolge aktuell vertauscht. Leser brauchen erst den Maßstab („was heißt ruhig?“), dann die Anschauung — sonst wirken die Beispiele beliebig und ihre Pointe verpufft.',
    narrative: 'Im Faden „Methode: vom Prinzip zum Werkzeug“ ist der erste Schritt „Maßstab setzen“. Wird er übersprungen, bricht dieser Handlungsstrang an seiner ersten Stelle — die Narrative verlöre ihre Begründungslogik.',
    action: null,
  },
  {
    type: 'Inhalt', tone: 'idea',
    text: 'Zur Leitfrage passt Mark Weisers Aufsatz „The Coming Age of Calm Technology“ (1996).',
    why: 'Der Aufsatz ist die Primärquelle des Begriffs — hier wurde „Calm Technology“ zum ersten Mal formuliert. Weiser (Vater des Ubiquitous Computing) und Brown schrieben ihn am Xerox PARC, als das Büro gerade von piependen Geräten geflutet wurde. Ihre Kernidee: Die knappste Ressource ist nicht Rechenleistung, sondern menschliche Aufmerksamkeit. Gute Technik „engagiert Zentrum und Peripherie der Aufmerksamkeit — und wechselt zwischen beiden“. Ein Verweis in den „Prinzipien“ verankert deine Definition historisch und zeigt, dass die heutige Debatte um Benachrichtigungen eine 30 Jahre alte Wurzel hat.',
    narrative: 'Stärkt den Faden „These: Peripherie statt Alarm“ an seiner Begründungsstelle: Die These bekommt eine zitierfähige Autorität, bevor deine eigenen Beispiele kommen. Für die Bauklötze heißt das: Der Verweis gehört in „Prinzipien“ — in der Einleitung reicht die Alltagserfahrung.',
    action: 'Weiser und Brown prägten den Begriff 1996 in „The Coming Age of Calm Technology“ — Technik solle sich, so ihre Formel, an den Rändern unserer Aufmerksamkeit bewegen.',
    sources: [
      { label: 'Weiser & Brown (1996): The Coming Age of Calm Technology', url: 'https://calmtech.com/papers', preview: 'Originalaufsatz (Xerox PARC). Kernsatz: „The most potentially interesting, challenging, and profound change implied by the ubiquitous computing era is a focus on calm.“ Führt die Unterscheidung Zentrum/Peripherie der Aufmerksamkeit ein.' },
      { label: 'Wikipedia: Calm technology', url: 'https://en.wikipedia.org/wiki/Calm_technology', preview: '„Calm technology is a type of information technology where the interaction between the technology and its user is designed to occur in the user’s periphery rather than constantly at the center of attention.“' },
      { label: 'Case, A. (2015): Calm Technology — Principles', url: 'https://calmtech.com', preview: 'Amber Case destilliert acht Prinzipien, u. a. „Technology should require the smallest possible amount of attention“ und „Technology should inform and create calm“ — die praktische Fortschreibung von Weisers Idee.' },
    ],
    image: "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 150'><rect width='400' height='150' fill='#fbfaf7'/><circle cx='200' cy='75' r='34' fill='none' stroke='#3a6ea5' stroke-width='2'/><text x='200' y='79' text-anchor='middle' font-family='sans-serif' font-size='12' fill='#3a6ea5'>Zentrum</text><circle cx='200' cy='75' r='64' fill='none' stroke='#a6a59c' stroke-width='1.5' stroke-dasharray='5 5'/><text x='200' y='22' text-anchor='middle' font-family='sans-serif' font-size='11' fill='#6c6b64'>Peripherie</text><path d='M264 75h60' stroke='#b9831f' stroke-width='2'/><text x='328' y='62' text-anchor='middle' font-family='sans-serif' font-size='10' fill='#854f0b'>Wechsel</text></svg>"),
    imageCaption: 'Weisers Modell: Aufmerksamkeit wandert zwischen Zentrum und Peripherie.',
  },
]

// Formulierungs-Vorschläge: verankert an Passagen, leben in der Spalte rechts am Text.
const MOCK_LANE = [
  {
    target: 'Aufmerksamkeit nur beansprucht, wenn es nötig ist',
    action: 'Aufmerksamkeit nur dann beansprucht, wenn sie wirklich gebraucht wird',
    short: 'Dichter formulieren — Füllwörter und Passiv kosten Tempo.',
    why: '„wenn es nötig ist“ ist unpersönlich und schwach; „wirklich gebraucht wird“ holt die Leserin in den Satz. Außerdem entfällt die doppelte Abschwächung.',
  },
  {
    target: 'fragmentieren die Aufmerksamkeit',
    action: 'zerteilen die Aufmerksamkeit in immer kleinere Stücke',
    short: 'Konkreteres Verb — „fragmentieren“ bleibt abstrakt.',
    why: 'Ein Bild („in immer kleinere Stücke“) macht den Schaden fühlbar, statt ihn nur zu behaupten. Fachwort raus, Wirkung rein.',
  },
]

// ============================================================
// Zustand & Helfer
// ============================================================
let coachCards = []
let laneItems = []
let blockSeq = 0
export function tagBlocks(list) { list.forEach(b => { if (!b._id) b._id = 'mb' + (++blockSeq); tagBlocks(b.children) }) }
export function findBlock(list, id) {
  for (const b of list) {
    if (b._id === id) return { arr: list, idx: list.indexOf(b), b }
    const r = findBlock(b.children, id); if (r) return r
  }
  return null
}
export function openExternal(url) {
  if (!/^https?:\/\//.test(url)) return
  if (ctx.state.native && window.webkit.messageHandlers.openurl) window.webkit.messageHandlers.openurl.postMessage(url)
  else window.open(url, '_blank', 'noopener')
}
export function getCtx() { return ctx }
export function makeEditable(elx, save) {
  elx.contentEditable = 'true'
  elx.spellcheck = false
  elx.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') { ev.preventDefault(); elx.blur() } })
  elx.addEventListener('blur', () => save(elx.textContent.trim()))
  elx.addEventListener('click', ev => ev.stopPropagation())
}

// ============================================================
// Init
// ============================================================
export function initPanels(context) {
  ctx = context
  tagBlocks(MOCK_BLOCKS)
  coachCards = MOCK_COACH.map(c => ({ ...c, done: false }))
  laneItems = MOCK_LANE.map(c => ({ ...c, done: false }))
  buildRails()
  buildStructPanel()
  renderCoach()
  buildLane()
  ctx.editor.on('update', scheduleMapRefresh)
  refreshToc()
}

function togglePanel(id, btn) {
  const p = document.getElementById(id)
  const open = p.hasAttribute('hidden')
  if (open) p.removeAttribute('hidden')
  else p.setAttribute('hidden', '')
  btn.classList.toggle('on', open)
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
  const sb = railBtn(railL, PIC.struct, 'Struktur & Narrative', () => togglePanel('pStruct', sb))
  const cb = railBtn(railR, PIC.coach, 'Coach (KI-Hinweise)', () => togglePanel('pCoach', cb))
  cb.appendChild(el('span', 'rail-badge', ''))
  updateCoachBadge()
}

// ============================================================
// Mini-Gliederung im Textbereich (Überschriften + Absatz-Striche)
// ============================================================
let mapTimer = null
function scheduleMapRefresh() {
  if (mapTimer) clearTimeout(mapTimer)
  mapTimer = setTimeout(refreshToc, 500)
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
      const dom = ctx.editor.view.domAtPos(it.pos + 1).node
      const t = dom.nodeType === 1 ? dom : dom.parentElement
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
  colB.appendChild(el('div', 'panel-sub', 'Dein roter Faden — ziehen zum Einfügen, klicken zum Öffnen.'))
  renderBlocksInto(colB, { drag: true, note: true, onChange: onStructChanged })
  const colN = el('div', 'sp-col sp-col-n')
  colN.appendChild(el('div', 'panel-head', 'Narrative'))
  const sub = el('div', 'panel-sub', 'Die Fäden, die sich durch den Text ziehen — Struktur und Narrative halten sich im Einklang.')
  colN.appendChild(sub)
  renderNarrativeInto(colN)
  wrap.appendChild(colB)
  wrap.appendChild(colN)
  p.appendChild(wrap)
}

export function renderBlocksInto(parent, opts = {}) {
  const render = (blocks, container, depth) => {
    blocks.forEach(b => {
      const wrapEl = el('div', 'blk-wrap')
      const row = el('div', 'blk d' + depth)
      if (opts.drag) row.draggable = true
      row.appendChild(el('span', 'blk-grip', '⠿'))
      const mainCol = el('div', 'blk-main')
      mainCol.appendChild(el('div', 'blk-title', b.title))
      if (b.content) mainCol.appendChild(el('div', 'blk-sub', b.content.slice(0, 76) + (b.content.length > 76 ? '…' : '')))
      row.appendChild(mainCol)
      if (b.children.length) {
        const chev = el('button', 'blk-chev', '▾')
        chev.setAttribute('aria-label', 'Ein-/ausklappen')
        chev.addEventListener('click', ev => { ev.stopPropagation(); wrapEl.classList.toggle('col') })
        row.appendChild(chev)
      }
      row.addEventListener('click', () => openBlockOverlay(b))
      if (opts.drag) {
        row.addEventListener('dragstart', ev => {
          ev.dataTransfer.setData('application/x-baustein', b.content || b.title)
          ev.dataTransfer.setData('application/x-blkid', b._id)
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
          if (!id || id === b._id) return
          ev.preventDefault(); ev.stopPropagation()
          const srcB = findBlock(MOCK_BLOCKS, id)
          if (!srcB || findBlock(srcB.b.children, b._id)) return
          srcB.arr.splice(srcB.idx, 1)
          const dst = findBlock(MOCK_BLOCKS, b._id)
          dst.arr.splice(dst.idx, 0, srcB.b)
          if (opts.onChange) opts.onChange(srcB.b.title, b.title)
        })
      }
      wrapEl.appendChild(row)
      if (opts.note && MOCK_STRUCT_NOTE.after === b.title) {
        const note = el('button', 'struct-note')
        note.appendChild(el('span', 'struct-note-line'))
        note.appendChild(el('span', 'struct-note-txt', MOCK_STRUCT_NOTE.text))
        note.addEventListener('click', () => openCardOverlay({
          type: 'Struktur', tone: 'warn',
          text: MOCK_STRUCT_NOTE.text, why: MOCK_STRUCT_NOTE.why,
          narrative: 'Betrifft den Faden „Methode: vom Prinzip zum Werkzeug“ — der Schritt „Anwenden“ braucht einen sauberen Absprung.',
          action: MOCK_STRUCT_NOTE.fix, done: false,
        }))
        wrapEl.appendChild(note)
      }
      if (b.children.length) {
        const kids = el('div', 'blk-kids')
        render(b.children, kids, depth + 1)
        wrapEl.appendChild(kids)
      }
      container.appendChild(wrapEl)
    })
  }
  render(MOCK_BLOCKS, parent, 0)
  const add = el('button', 'narr-add', '+ Baustein')
  add.addEventListener('click', () => {
    const nb = { title: 'Neuer Baustein', role: 'Baustein', content: '', why: '', sources: [], children: [] }
    MOCK_BLOCKS.push(nb)
    tagBlocks(MOCK_BLOCKS)
    rebuildStructEverywhere()
    openBlockOverlay(nb)
  })
  parent.appendChild(add)
}

export function renderNarrativeInto(parent) {
  const strands = el('div', 'narr-strands')
  MOCK_NARRATIVE.forEach(t => {
    const box = el('div', 'narr-thread')
    const lab = el('div', 'narr-label', t.title)
    makeEditable(lab, v => { t.title = v || t.title })
    box.appendChild(lab)
    const line = el('div', 'narr-line')
    t.steps.forEach(st => {
      const item = el('div', 'narr-pt' + (st.open ? ' open' : ''))
      item.appendChild(el('span', 'narr-dot'))
      const body = el('div', 'narr-body')
      const h = el('div', 'narr-h', st.h)
      makeEditable(h, v => { st.h = v || st.h })
      const pEl = el('div', 'narr-p', st.p)
      makeEditable(pEl, v => { st.p = v || st.p })
      body.appendChild(h)
      body.appendChild(pEl)
      item.appendChild(body)
      line.appendChild(item)
    })
    const addPt = el('button', 'narr-add', '+ Punkt')
    addPt.addEventListener('click', () => { t.steps.push({ h: 'Neuer Punkt', p: 'Beschreibung …' }); rebuildStructEverywhere() })
    line.appendChild(addPt)
    box.appendChild(line)
    strands.appendChild(box)
  })
  parent.appendChild(strands)
  const addTh = el('button', 'narr-add narr-add-thread', '+ Faden')
  addTh.addEventListener('click', () => { MOCK_NARRATIVE.push({ title: 'Neuer Faden', steps: [{ h: 'Beginn', p: 'Worum es in diesem Faden geht …' }] }); rebuildStructEverywhere() })
  parent.appendChild(addTh)
}

function onStructChanged(moved, before) {
  rebuildStructEverywhere()
  narrSyncPulse()
  coachCards.unshift({
    type: 'Struktur', tone: 'warn',
    text: 'Du hast „' + moved + '“ vor „' + before + '“ geschoben — passt der Übergang im Text noch?',
    why: 'Die Reihenfolge der Bauklötze hat sich geändert. Die Narrative wurde angepasst; im Text sollte die Überleitung zwischen den betroffenen Abschnitten geprüft werden.',
    narrative: 'Die Fäden wurden an die neue Reihenfolge angepasst — offene Schritte sind entsprechend markiert.',
    action: null, done: false,
  })
  renderCoach()
}
export function narrSyncPulse() {
  document.querySelectorAll('.sp-col-n .panel-sub, #stNarr .panel-sub').forEach(sub => {
    const orig = sub.dataset.orig || sub.textContent
    sub.dataset.orig = orig
    sub.textContent = '⟳ An die neue Struktur angepasst.'
    sub.classList.add('narr-sync')
    setTimeout(() => { sub.classList.remove('narr-sync'); sub.textContent = orig }, 4000)
  })
}
export function rebuildStructEverywhere() {
  buildStructPanel()
  if (window.__rebuildStructView) window.__rebuildStructView()
}
export function notifyStructChanged(moved, before) { onStructChanged(moved, before) }

// ============================================================
// Coach
// ============================================================
function updateCoachBadge() {
  const n = coachCards.filter(c => !c.done).length
  document.querySelectorAll('.rail-badge').forEach(badge => {
    badge.textContent = n > 0 ? String(n) : ''
    badge.style.display = n > 0 ? '' : 'none'
  })
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
  const open = coachCards.filter(c => !c.done)
  if (!open.length) p.appendChild(el('div', 'panel-empty', 'Keine Hinweise — gute Reise.'))
  open.forEach(c => {
    const card = el('button', 'coach-card tone-' + c.tone)
    card.appendChild(el('span', 'coach-type', c.type))
    card.appendChild(el('span', 'coach-text', c.text))
    card.addEventListener('click', () => openCardOverlay(c))
    p.appendChild(card)
  })
  p.appendChild(el('div', 'panel-note', 'Platzhalter-Hinweise — die echte KI folgt.'))
}

// ============================================================
// Formulierungs-Spalte rechts am Text
// ============================================================
export function buildLane() {
  const lane = document.getElementById('lane')
  if (!lane) return
  lane.innerHTML = ''
  lane.appendChild(el('div', 'panel-head', 'Formulierung'))
  const open = laneItems.filter(c => !c.done)
  if (!open.length) lane.appendChild(el('div', 'panel-empty', 'Keine Anmerkungen im Text.'))
  open.forEach(c => {
    const card = el('button', 'lane-card')
    card.appendChild(el('span', 'lane-text', c.short))
    card.addEventListener('mouseenter', () => markTarget(c.target, false))
    card.addEventListener('mouseleave', () => { if (!c._pinned) unmarkTargetText(c.target) })
    card.addEventListener('click', () => { c._pinned = true; markTarget(c.target, true); openLaneOverlay(c) })
    lane.appendChild(card)
  })
  lane.appendChild(el('div', 'panel-note', 'Bezieht sich auf markierte Passagen — Platzhalter.'))
  updateLaneBadge()
}
function updateLaneBadge() {
  const b = document.getElementById('laneBadge')
  if (!b) return
  const n = laneItems.filter(c => !c.done).length
  b.textContent = n > 0 ? String(n) : ''
  b.style.display = n > 0 ? '' : 'none'
}
export function findInDoc(text) {
  let found = null
  ctx.editor.state.doc.descendants((node, pos) => {
    if (found || !node.isText) return
    const i = node.text.indexOf(text)
    if (i >= 0) found = { from: pos + i, to: pos + i + text.length }
  })
  return found
}
export function markTarget(target, scroll) {
  const r = findInDoc(target)
  if (!r) return
  ctx.editor.chain().setTextSelection(r).setHighlight({ color: '#eae7dc' }).setTextSelection(r.to).run()
  if (scroll) {
    const dom = ctx.editor.view.domAtPos(r.from).node
    const elx = dom.nodeType === 1 ? dom : dom.parentElement
    if (elx) elx.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
export function unmarkTargetText(target) {
  const r = findInDoc(target)
  if (r) ctx.editor.chain().setTextSelection(r).unsetHighlight().setTextSelection(r.to).run()
}

// ============================================================
// Overlays — ein Formular für alles: ✓ ✗ ✕ oben rechts, Chat unten
// ============================================================
let overlayEl = null
export function closeOverlay() { if (overlayEl) { overlayEl.remove(); overlayEl = null } }

function overlayShell(typeLabel, tone, onAccept, onReject) {
  closeOverlay()
  overlayEl = el('div', 'ai-overlay')
  const box = el('div', 'ai-box')
  const head = el('div', 'ai-head')
  head.appendChild(el('span', 'coach-type', typeLabel))
  const actions = el('div', 'ai-actions')
  if (onAccept) {
    const ok = el('button', 'ai-ico ai-ok')
    ok.innerHTML = icon(PIC.check)
    ok.title = 'Übernehmen'
    ok.setAttribute('aria-label', 'Übernehmen')
    ok.addEventListener('click', onAccept)
    actions.appendChild(ok)
  }
  if (onReject) {
    const no = el('button', 'ai-ico ai-no')
    no.innerHTML = icon(PIC.x)
    no.title = 'Ablehnen'
    no.setAttribute('aria-label', 'Ablehnen')
    no.addEventListener('click', onReject)
    actions.appendChild(no)
  }
  const close = el('button', 'ai-ico ai-close')
  close.innerHTML = icon(PIC.x)
  close.title = 'Schließen — nur zuklappen, nichts entscheiden'
  close.setAttribute('aria-label', 'Schließen')
  close.addEventListener('click', closeOverlay)
  actions.appendChild(close)
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
  inp.contentEditable = 'true'
  inp.spellcheck = false
  inp.setAttribute('data-ph', 'Frag nach — z. B. „Warum ist das besser?“')
  const send = el('button', 'ai-ico')
  send.innerHTML = icon(PIC.send)
  send.title = 'Senden'
  const submit = () => {
    const q = inp.textContent.trim()
    if (!q) return
    thread.appendChild(el('div', 'ai-msg ai-msg-user', q))
    inp.textContent = ''
    thread.scrollTop = thread.scrollHeight
    setTimeout(() => {
      thread.appendChild(el('div', 'ai-msg ai-msg-ai', 'Platzhalter-Antwort zu „' + topic.slice(0, 42) + '…“ — hier antwortet später die echte KI, mit dem gesamten Projekt als Kontext.'))
      thread.scrollTop = thread.scrollHeight
    }, 350)
  }
  send.addEventListener('click', submit)
  inp.addEventListener('keydown', ev => {
    ev.stopPropagation()
    if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); submit() }
  })
  row.appendChild(inp)
  row.appendChild(send)
  box.appendChild(row)
}

export function openCardOverlay(card) {
  const box = overlayShell(card.type, card.tone,
    card.action ? () => {
      const edit = box.querySelector('.ai-prop')
      const escf = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      ctx.editor.chain().focus().insertContent('<p>' + escf(edit ? edit.textContent : card.action) + '</p>').run()
      card.done = true
      renderCoach()
      ctx.scheduleSave()
      closeOverlay()
    } : null,
    () => { card.done = true; renderCoach(); closeOverlay() })
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
      const top = el('button', 'ai-src', s.label + '  ↗')
      top.title = s.url
      top.addEventListener('click', () => openExternal(s.url))
      sc.appendChild(top)
      if (s.preview) sc.appendChild(el('div', 'ai-src-prev', s.preview))
      box.appendChild(sc)
    })
  }
  if (card.action) {
    box.appendChild(el('div', 'panel-head', 'Vorschlag (bearbeitbar)'))
    const prop = el('div', 'ai-prop', card.action)
    makeEditable(prop, v => { card.action = v || card.action })
    box.appendChild(prop)
  }
  chatSection(box, card.text)
}

export function openLaneOverlay(c) {
  const box = overlayShell('Formulierung', 'style',
    () => {
      const edit = box.querySelector('.ai-prop')
      const r = findInDoc(c.target)
      if (r) {
        const escf = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        ctx.editor.chain().setTextSelection(r).unsetHighlight().insertContent(escf(edit ? edit.textContent : c.action)).run()
      }
      c.done = true; c._pinned = false
      buildLane(); ctx.scheduleSave(); closeOverlay()
    },
    () => { unmarkTargetText(c.target); c.done = true; c._pinned = false; buildLane(); closeOverlay() })
  box.appendChild(el('div', 'ai-title', c.short))
  box.appendChild(el('div', 'panel-head', 'Original'))
  box.appendChild(el('div', 'ai-orig', '„' + c.target + '“'))
  box.appendChild(el('div', 'panel-head', 'Vorschlag (bearbeitbar)'))
  const prop = el('div', 'ai-prop', c.action)
  makeEditable(prop, v => { c.action = v || c.action })
  box.appendChild(prop)
  box.appendChild(el('div', 'panel-head', 'Warum'))
  box.appendChild(el('div', 'ai-why', c.why))
  chatSection(box, c.short)
  const was = overlayEl
  const obs = new MutationObserver(() => {
    if (!document.body.contains(was)) {
      if (!c.done) { c._pinned = false; unmarkTargetText(c.target) }
      obs.disconnect()
    }
  })
  obs.observe(document.body, { childList: true })
}

// ============================================================
// Baustein-Overlay (groß, dreispaltig): Meta · Inhalt · Quellen
// ============================================================
export function openBlockOverlay(b) {
  const box = overlayShell('Baustein', null, null, null)
  box.classList.add('ai-box-wide')
  const cols = el('div', 'blk-ov-cols')

  const c1 = el('div', 'blk-ov-col')
  c1.appendChild(el('div', 'panel-head', 'Meta-Struktur — warum dieser Baustein?'))
  const why = el('div', 'ai-why', b.why || 'Noch keine Begründung — hier hilft später die KI.')
  makeEditable(why, v => { b.why = v })
  c1.appendChild(why)
  c1.appendChild(el('div', 'panel-head', 'Rolle'))
  const role = el('div', 'ai-why', b.role || '—')
  makeEditable(role, v => { b.role = v })
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
  makeEditable(titleEl, v => { b.title = v || b.title; rebuildStructEverywhere() })
  c2.appendChild(titleEl)
  const body = el('div', 'blk-ov-body', b.content || 'Noch leer — Gedanken hier festhalten oder vom Canvas übernehmen.')
  makeEditable(body, v => { b.content = v; rebuildStructEverywhere() })
  c2.appendChild(body)

  const c3 = el('div', 'blk-ov-col')
  c3.appendChild(el('div', 'panel-head', 'Quellen'))
  if (!(b.sources || []).length) c3.appendChild(el('div', 'panel-empty', 'Noch keine Quellen verknüpft.'))
  ;(b.sources || []).forEach(s => c3.appendChild(el('div', 'ai-src-prev', s)))
  const addSrc = el('button', 'narr-add', '+ Quelle hinzufügen')
  addSrc.addEventListener('click', () => { (b.sources = b.sources || []).push('Neue Quelle …'); closeOverlay(); openBlockOverlay(b) })
  c3.appendChild(addSrc)
  c3.appendChild(el('div', 'panel-head', 'KI-Hinweis'))
  c3.appendChild(el('div', 'ai-why', b.title === 'Beispiele'
    ? 'Dieser Baustein braucht eine Brücke zum nächsten — siehe rote Anmerkung in der Struktur.'
    : 'Wirkt stimmig zur Narrative. (Platzhalter)'))

  cols.appendChild(c1); cols.appendChild(c2); cols.appendChild(c3)
  box.appendChild(cols)
}
