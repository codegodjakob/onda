// Seiten-Panels der Schreibansicht (Interface-first, Mock-Daten):
// links: Navigation (TOC) · Struktur-Bauklötze · Narrative — rechts: Coach.
// Alles ein-/ausklappbar über schmale Rand-Leisten. Calm: standardmäßig ist alles zu.

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
    text: 'Zur Leitfrage passt Mark Weisers Aufsatz „The Coming Age of Calm Technology" (1996).',
    why: 'Der Text ist die Primärquelle des Begriffs. Ein kurzer Verweis in der Einleitung verankert deine Definition.',
    action: 'Weiser und Brown prägten den Begriff 1996 in „The Coming Age of Calm Technology" — Technik solle sich, so ihre Formel, an den Rändern unserer Aufmerksamkeit bewegen.',
    source: 'Weiser & Brown, 1996 · calmtech.com',
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

export function initPanels(context) {
  ctx = context
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
        ev.dataTransfer.effectAllowed = 'copy'
        row.classList.add('dragging')
      })
      row.addEventListener('dragend', () => row.classList.remove('dragging'))
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

// ---------- Narrative: Meta-Struktur als Fluss (Mock) ----------
function buildNarr() {
  const p = document.getElementById('pNarr')
  p.innerHTML = ''
  p.appendChild(el('div', 'panel-head', 'Narrative'))
  p.appendChild(el('div', 'panel-sub', 'Welche Fäden sich durch den Text ziehen.'))
  MOCK_NARRATIVE.forEach(t => {
    const box = el('div', 'narr-thread')
    box.appendChild(el('div', 'narr-label', t.label))
    const line = el('div', 'narr-line')
    t.points.forEach((pt, i) => {
      const item = el('div', 'narr-pt' + (pt.includes('offen') ? ' open' : ''))
      item.appendChild(el('span', 'narr-dot'))
      item.appendChild(el('span', 'narr-txt', pt))
      line.appendChild(item)
    })
    box.appendChild(line)
    p.appendChild(box)
  })
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
  if (card.source) {
    box.appendChild(el('div', 'panel-head', 'Quelle'))
    box.appendChild(el('div', 'ai-why', card.source))
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
