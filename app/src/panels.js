// Seiten-Panels der Schreibansicht (Interface-first, Mock-Daten):
// links: Navigation (TOC) · Struktur-Bauklötze · Narrative — rechts: Coach.
// Alles ein-/ausklappbar über schmale Rand-Leisten. Calm: standardmäßig ist alles zu.

import { showHomeView, setHomeMode } from './ui.js'

let ctx = null

function el(tag, cls, text) {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (text != null) n.textContent = text
  return n
}
function icon(paths) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>'
}
const PIC = {
  back: '<path d="M5 12h14M5 12l6-6M5 12l6 6"/>',
  toc: '<path d="M4 6h10M4 12h16M4 18h13"/>',
  struct: '<rect x="4" y="4" width="16" height="5" rx="1.5"/><rect x="7" y="12" width="13" height="4" rx="1.5"/><rect x="7" y="18.5" width="13" height="1.5" rx="0.75"/>',
  narr: '<circle cx="6" cy="5" r="1.6"/><circle cx="6" cy="12" r="1.6"/><circle cx="6" cy="19" r="1.6"/><path d="M6 6.6v3.8M6 13.6v3.8M9.5 5h9M9.5 12h9M9.5 19h9"/>',
  coach: '<path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7z"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
}

// ---------- Mock-Daten (Platzhalter, bis die echte KI angeschlossen wird) ----------
const MOCK_BLOCKS = [
  { title: 'Einleitung', content: 'Calm Technology beschreibt Technik, die in der Peripherie bleibt und Aufmerksamkeit nur beansprucht, wenn es nötig ist.', children: [
    { title: 'Relevanz', content: 'Ständige Benachrichtigungen fragmentieren die Aufmerksamkeit — ruhige Werkzeuge sind die Gegenbewegung.', children: [] },
    { title: 'Leitfrage', content: 'Wie muss ein Schreibwerkzeug gestaltet sein, damit es das Denken unterstützt statt unterbricht?', children: [] },
  ]},
  { title: 'Hauptteil', content: '', children: [
    { title: 'Prinzipien', content: 'Weiser und Brown formulierten: Technik soll sich an den Rändern der Aufmerksamkeit bewegen und nahtlos zwischen Zentrum und Peripherie wechseln.', children: [] },
    { title: 'Beispiele', content: 'Die Teekanne pfeift erst, wenn es relevant ist. Eine Statusleuchte informiert, ohne zu unterbrechen.', children: [] },
    { title: 'Übertragung aufs Schreiben', content: 'Für Schreibsoftware heißt das: Werkzeuge erscheinen im Kontext, Hinweise sammeln sich leise, nichts drängt sich in den Fluss.', children: [] },
  ]},
  { title: 'Schluss', content: 'Ruhige Technik ist kein Verzicht auf Funktionen, sondern eine Haltung: volle Kraft, leise Präsentation.', children: [] },
]

const MOCK_NARRATIVE = [
  { label: 'Problem: laute Technik', points: ['wird eröffnet (Einleitung)', 'an Beispielen vertieft', 'im Schluss aufgelöst'] },
  { label: 'These: Peripherie statt Alarm', points: ['angekündigt (Leitfrage)', 'begründet (Prinzipien)', 'noch offen: Rückbindung im Schluss'] },
]

const MOCK_COACH = [
  {
    type: 'Struktur', tone: 'warn',
    text: 'Der Abschnitt „Beispiele" kommt vor den „Prinzipien" — die Argumentation trägt besser andersherum.',
    why: 'Deine geplante Struktur (Bauklötze) sieht Prinzipien → Beispiele vor. Im Text ist die Reihenfolge aktuell vertauscht; Leser brauchen erst den Maßstab, dann die Anschauung.',
    action: null,
  },
  {
    type: 'Inhalt', tone: 'idea',
    text: 'Zur Leitfrage passt Mark Weisers Aufsatz „The Coming Age of Calm Technology“ (1996).',
    why: 'Der Text ist die Primärquelle des Begriffs — hier wurde „Calm Technology“ zum ersten Mal formuliert. Ein kurzer Verweis in der Einleitung verankert deine Definition historisch: Technik soll zwischen Zentrum und Peripherie der Aufmerksamkeit wechseln können, statt permanent im Zentrum zu stehen.',
    action: 'Weiser und Brown prägten den Begriff 1996 in „The Coming Age of Calm Technology“ — Technik solle sich, so ihre Formel, an den Rändern unserer Aufmerksamkeit bewegen.',
    sources: [
      { label: 'Weiser & Brown (1996): The Coming Age of Calm Technology', url: 'https://calmtech.com/papers' },
      { label: 'calmtech.com — Prinzipien im Überblick', url: 'https://calmtech.com' },
      { label: 'Wikipedia: Calm technology', url: 'https://en.wikipedia.org/wiki/Calm_technology' },
    ],
    image: "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 150'><rect width='400' height='150' fill='#fbfaf7'/><circle cx='200' cy='75' r='34' fill='none' stroke='#3a6ea5' stroke-width='2'/><text x='200' y='79' text-anchor='middle' font-family='sans-serif' font-size='12' fill='#3a6ea5'>Zentrum</text><circle cx='200' cy='75' r='64' fill='none' stroke='#a6a59c' stroke-width='1.5' stroke-dasharray='5 5'/><text x='200' y='22' text-anchor='middle' font-family='sans-serif' font-size='11' fill='#6c6b64'>Peripherie</text><path d='M264 75h60' stroke='#b9831f' stroke-width='2'/><text x='328' y='62' text-anchor='middle' font-family='sans-serif' font-size='10' fill='#854f0b'>Wechsel</text></svg>"),
    imageCaption: 'Weisers Modell: Aufmerksamkeit wandert zwischen Zentrum und Peripherie.',
  },
  {
    type: 'Formulierung', tone: 'style',
    text: 'Ein Satz in der Einleitung lässt sich dichter formulieren.',
    why: 'Doppelte Füllwörter und eine Passiv-Konstruktion — die Aussage verliert Tempo. Vorschlag markiert die Stelle im Text.',
    target: 'Aufmerksamkeit nur beansprucht, wenn es nötig ist',
    action: 'Aufmerksamkeit nur dann beansprucht, wenn sie wirklich gebraucht wird',
  },
]

// ---------- Panel-Gerüst ----------
let coachCards = []
let blockSeq = 0
function tagBlocks(list) { list.forEach(b => { if (!b._id) b._id = 'mb' + (++blockSeq); tagBlocks(b.children) }) }
function findBlock(list, id) {
  for (const b of list) {
    if (b._id === id) return { arr: list, idx: list.indexOf(b), b }
    const r = findBlock(b.children, id); if (r) return r
  }
  return null
}
function openExternal(url) {
  if (!/^https?:\/\//.test(url)) return
  if (ctx.state.native && window.webkit.messageHandlers.openurl) window.webkit.messageHandlers.openurl.postMessage(url)
  else window.open(url, '_blank', 'noopener')
}

export function initPanels(context) {
  ctx = context
  tagBlocks(MOCK_BLOCKS)
  buildRails()
  buildStruct()
  buildNarr()
  buildCoach()
  ctx.editor.on('update', scheduleTocRefresh)
  refreshToc()
}

function togglePanel(id, btn) {
  const p = document.getElementById(id)
  const open = p.hasAttribute('hidden')
  if (open) p.removeAttribute('hidden')
  else p.setAttribute('hidden', '')
  btn.classList.toggle('on', open)
}

function railBtn(rail, ic, title, panelId) {
  const b = el('button', 'rail-btn')
  b.innerHTML = icon(ic)
  b.title = title
  b.setAttribute('aria-label', title)
  b.addEventListener('click', () => togglePanel(panelId, b))
  rail.appendChild(b)
  return b
}

function buildRails() {
  const railL = document.getElementById('railL')
  const railR = document.getElementById('railR')
  railL.innerHTML = ''; railR.innerHTML = ''
  const back = el('button', 'rail-btn')
  back.innerHTML = icon(PIC.back)
  back.title = 'Zurück zum Projekt (Esc)'
  back.setAttribute('aria-label', 'Zurück zum Projekt')
  back.addEventListener('click', () => { ctx.flushSave(); setHomeMode('docs'); showHomeView() })
  railL.appendChild(back)
  railL.appendChild(el('div', 'rail-div'))
  railBtn(railL, PIC.toc, 'Navigation (Kapitel)', 'pToc')
  railBtn(railL, PIC.struct, 'Struktur (Bauklötze)', 'pStruct')
  railBtn(railL, PIC.narr, 'Narrative (Meta-Struktur)', 'pNarr')
  const cb = railBtn(railR, PIC.coach, 'Coach (KI-Hinweise)', 'pCoach')
  const badge = el('span', 'rail-badge', '')
  cb.appendChild(badge)
  updateCoachBadge()
}

// ---------- Navigation (echtes Inhaltsverzeichnis aus den Überschriften) ----------
let tocTimer = null
function scheduleTocRefresh() {
  if (tocTimer) clearTimeout(tocTimer)
  tocTimer = setTimeout(refreshToc, 500)
}
export function refreshToc() {
  const p = document.getElementById('pToc')
  if (!p) return
  p.innerHTML = ''
  p.appendChild(el('div', 'panel-head', 'Navigation'))
  const items = []
  ctx.editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') items.push({ level: node.attrs.level, text: node.textContent || '…', pos })
  })
  if (!items.length) {
    p.appendChild(el('div', 'panel-empty', 'Überschriften erscheinen hier als Kapitel-Navigation.'))
    return
  }
  items.forEach(it => {
    const row = el('button', 'toc-item toc-l' + it.level, it.text)
    row.addEventListener('click', () => {
      const dom = ctx.editor.view.domAtPos(it.pos + 1).node
      const target = dom.nodeType === 1 ? dom : dom.parentElement
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    p.appendChild(row)
  })
}

// ---------- Struktur: Bauklötze (Mock) — Drag & Drop in den Text ----------
function buildStruct() {
  const p = document.getElementById('pStruct')
  p.innerHTML = ''
  p.appendChild(el('div', 'panel-head', 'Struktur'))
  p.appendChild(el('div', 'panel-sub', 'Dein roter Faden — Bauklötze in den Text ziehen.'))
  const render = (blocks, parent, depth) => {
    blocks.forEach(b => {
      const wrap = el('div', 'blk-wrap')
      const row = el('div', 'blk d' + depth)
      row.draggable = true
      const grip = el('span', 'blk-grip', '⠿')
      row.appendChild(grip)
      row.appendChild(el('span', 'blk-title', b.title))
      if (b.children.length) {
        const chev = el('button', 'blk-chev', '▾')
        chev.setAttribute('aria-label', 'Ein-/ausklappen')
        chev.addEventListener('click', ev => { ev.stopPropagation(); wrap.classList.toggle('col') })
        row.appendChild(chev)
      }
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
        buildStruct()
        structChanged(srcB.b.title, b.title)
      })
      row.title = b.content ? b.content.slice(0, 140) : b.title
      wrap.appendChild(row)
      if (b.children.length) {
        const kids = el('div', 'blk-kids')
        render(b.children, kids, depth + 1)
        wrap.appendChild(kids)
      }
      parent.appendChild(wrap)
    })
  }
  render(MOCK_BLOCKS, p, 0)
  p.appendChild(el('div', 'panel-note', 'Platzhalter — wird später in der Struktur-Ansicht geplant.'))
}

function structChanged(moved, before) {
  // Kopplung sichtbar machen: Narrative reagiert, Coach merkt an (Mock).
  const sub = document.querySelector('#pNarr .panel-sub')
  if (sub) {
    sub.textContent = '⟳ An die neue Bauklotz-Reihenfolge angepasst.'
    sub.classList.add('narr-sync')
    setTimeout(() => { sub.classList.remove('narr-sync'); sub.textContent = 'Welche Fäden sich durch den Text ziehen.' }, 4000)
  }
  coachCards.unshift({
    type: 'Struktur', tone: 'warn',
    text: 'Du hast „' + moved + '“ vor „' + before + '“ geschoben — passt der Übergang im Text noch?',
    why: 'Die Reihenfolge der Bauklötze hat sich geändert. Die Narrative wurde angepasst; im Text sollte die Überleitung zwischen den betroffenen Abschnitten geprüft werden.',
    action: null, done: false,
  })
  renderCoach()
}

// ---------- Narrative: Meta-Struktur als Fluss (Mock) ----------
function buildNarr() {
  const p = document.getElementById('pNarr')
  p.innerHTML = ''
  p.appendChild(el('div', 'panel-head', 'Narrative'))
  p.appendChild(el('div', 'panel-sub', 'Welche Fäden sich durch den Text ziehen.'))
  const editable = (elx, save) => {
    elx.contentEditable = 'true'
    elx.spellcheck = false
    elx.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') { ev.preventDefault(); elx.blur() } })
    elx.addEventListener('blur', () => save(elx.textContent.trim()))
  }
  MOCK_NARRATIVE.forEach(t => {
    const box = el('div', 'narr-thread')
    const lab = el('div', 'narr-label', t.label)
    editable(lab, v => { t.label = v || t.label })
    box.appendChild(lab)
    const line = el('div', 'narr-line')
    t.points.forEach((pt, i) => {
      const item = el('div', 'narr-pt' + (pt.includes('offen') ? ' open' : ''))
      item.appendChild(el('span', 'narr-dot'))
      const txt = el('span', 'narr-txt', pt)
      editable(txt, v => { t.points[i] = v || t.points[i] })
      item.appendChild(txt)
      line.appendChild(item)
    })
    const addPt = el('button', 'narr-add', '+ Punkt')
    addPt.addEventListener('click', () => { t.points.push('neuer Punkt'); buildNarr() })
    line.appendChild(addPt)
    box.appendChild(line)
    p.appendChild(box)
  })
  const addTh = el('button', 'narr-add narr-add-thread', '+ Faden')
  addTh.addEventListener('click', () => { MOCK_NARRATIVE.push({ label: 'Neuer Faden', points: ['beginnt hier'] }); buildNarr() })
  p.appendChild(addTh)
  p.appendChild(el('div', 'panel-note', 'Platzhalter — wächst später aus dem echten Text.'))
}

// ---------- Coach (rechts): Karten + Overlay ----------
function updateCoachBadge() {
  const badge = document.querySelector('#railR .rail-badge')
  if (!badge) return
  const n = coachCards.filter(c => !c.done).length
  badge.textContent = n > 0 ? String(n) : ''
  badge.style.display = n > 0 ? '' : 'none'
}

function buildCoach() {
  coachCards = MOCK_COACH.map(c => ({ ...c, done: false }))
  renderCoach()
}

function renderCoach() {
  const p = document.getElementById('pCoach')
  p.innerHTML = ''
  p.appendChild(el('div', 'panel-head', 'Coach'))
  const open = coachCards.filter(c => !c.done)
  if (!open.length) {
    p.appendChild(el('div', 'panel-empty', 'Keine Hinweise — gute Reise.'))
  }
  open.forEach(c => {
    const card = el('button', 'coach-card tone-' + c.tone)
    card.appendChild(el('span', 'coach-type', c.type))
    card.appendChild(el('span', 'coach-text', c.text))
    card.addEventListener('click', () => openOverlay(c))
    p.appendChild(card)
  })
  p.appendChild(el('div', 'panel-note', 'Platzhalter-Hinweise — die echte KI folgt.'))
  updateCoachBadge()
}

// ---------- Vorschlag-Overlay: einsehen → bearbeiten → übernehmen/ablehnen ----------
let overlayEl = null
function openOverlay(card) {
  closeOverlay()
  overlayEl = el('div', 'ai-overlay')
  const box = el('div', 'ai-box')
  box.appendChild(el('div', 'coach-type', card.type))
  box.appendChild(el('div', 'ai-title', card.text))
  box.appendChild(el('div', 'panel-head', 'Warum'))
  box.appendChild(el('div', 'ai-why', card.why))
  if (card.image) {
    const img = document.createElement('img')
    img.className = 'ai-img'
    img.src = card.image
    img.alt = card.imageCaption || ''
    box.appendChild(img)
    if (card.imageCaption) box.appendChild(el('div', 'ai-cap', card.imageCaption))
  }
  if (card.sources && card.sources.length) {
    box.appendChild(el('div', 'panel-head', 'Quellen'))
    card.sources.forEach(s => {
      const a = el('button', 'ai-src', s.label + '  ↗')
      a.title = s.url
      a.addEventListener('click', () => openExternal(s.url))
      box.appendChild(a)
    })
  }
  let ta = null
  if (card.action) {
    box.appendChild(el('div', 'panel-head', 'Vorschlag (bearbeitbar)'))
    ta = document.createElement('textarea')
    ta.className = 'ai-edit'
    ta.value = card.action
    box.appendChild(ta)
  }
  if (card.target) {
    const show = el('button', 'mi-seg', 'Im Text zeigen')
    show.addEventListener('click', () => markTarget(card.target))
    box.appendChild(show)
  }
  const row = el('div', 'mi-row')
  if (card.action) {
    const okB = el('button', 'mi-seg on', 'Übernehmen')
    okB.addEventListener('click', () => {
      acceptCard(card, ta ? ta.value : card.action)
      closeOverlay()
    })
    row.appendChild(okB)
  }
  const noB = el('button', 'mi-seg', 'Ablehnen')
  noB.addEventListener('click', () => { card.done = true; unmarkTarget(card); renderCoach(); closeOverlay() })
  row.appendChild(noB)
  const clB = el('button', 'mi-seg', 'Schließen')
  clB.addEventListener('click', closeOverlay)
  row.appendChild(clB)
  box.appendChild(row)
  overlayEl.appendChild(box)
  overlayEl.addEventListener('click', ev => { if (ev.target === overlayEl) closeOverlay() })
  document.body.appendChild(overlayEl)
}
function closeOverlay() { if (overlayEl) { overlayEl.remove(); overlayEl = null } }

function findInDoc(text) {
  let found = null
  ctx.editor.state.doc.descendants((node, pos) => {
    if (found || !node.isText) return
    const i = node.text.indexOf(text)
    if (i >= 0) found = { from: pos + i, to: pos + i + text.length }
  })
  return found
}
function markTarget(target) {
  const r = findInDoc(target)
  if (!r) return
  ctx.editor.chain().setTextSelection(r).setHighlight({ color: '#f2d3cd' }).setTextSelection(r.to).run()
  const dom = ctx.editor.view.domAtPos(r.from).node
  const elx = dom.nodeType === 1 ? dom : dom.parentElement
  if (elx) elx.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
function unmarkTarget(card) {
  if (!card.target) return
  const r = findInDoc(card.target)
  if (r) ctx.editor.chain().setTextSelection(r).unsetHighlight().setTextSelection(r.to).run()
}
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function acceptCard(card, text) {
  if (card.target) {
    const r = findInDoc(card.target)
    if (r) ctx.editor.chain().setTextSelection(r).unsetHighlight().insertContent(escapeHtml(text)).run()
  } else {
    ctx.editor.chain().focus().insertContent('<p>' + escapeHtml(text) + '</p>').run()
  }
  card.done = true
  renderCoach()
  ctx.scheduleSave()
}
