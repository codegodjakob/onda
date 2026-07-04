// Bedien-Oberfläche: ruhige Toolbar mit Dropdowns, Bubble, Slash-Menü,
// Seitenleiste (Suche/Papierkorb), Einstellungen, Fokus-Modus.
// Calm Technology: wenig sichtbar, alles im Kontext, Peripherie statt Alarm.

let ctx = null
let sortMode = 'recent'
let searchQuery = ''
let openPanel = null
const panels = []

// Prinzip „begrenzte Auswahl": wenige, gut gewählte Optionen statt vieler Nuancen.
const COLORS = [
  { label: 'Standard', value: null },
  { label: 'Rot', value: '#a3402a' },
  { label: 'Bernstein', value: '#b9831f' },
  { label: 'Blau', value: '#3a6ea5' },
  { label: 'Grün', value: '#256d4f' },
]
const HIGHLIGHTS = [
  { label: 'Keine', value: null },
  { label: 'Gelb', value: '#f6e7a9' },
  { label: 'Grün', value: '#d9ecd4' },
  { label: 'Blau', value: '#d7e6f7' },
]

// Schlichte Linien-Icons (einheitlicher Strich, keine Deko)
function icon(paths) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>'
}
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  gear: '<circle cx="15" cy="6" r="2"/><path d="M4 6h9M19 6h1"/><circle cx="9" cy="12" r="2"/><path d="M4 12h3M13 12h7"/><circle cx="16" cy="18" r="2"/><path d="M4 18h10"/>',
  sort: '<path d="M7 4v13M7 4 4 7M7 4l3 3"/><path d="M17 20V7M17 20l-3-3M17 20l3-3"/>',
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
    hideBubble()
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
  it.addEventListener('click', () => { closeAllPanels(); onRun() })
  panel.appendChild(it)
  return it
}
function menuLabel(panel, text) { panel.appendChild(el('div', 'mi-head', text)) }
function menuDivider(panel) { panel.appendChild(el('div', 'mi-div')) }

// ---------- Speicher-Punkt (Calm: Punkt statt Text) ----------
let dotEl = null, dotTimer = null, errEl = null
export function setSaveState(s) {
  if (!dotEl) return
  dotEl.classList.remove('saving', 'saved', 'error')
  errEl.textContent = ''
  if (s === 'saving') dotEl.classList.add('saving')
  else if (s === 'saved') {
    dotEl.classList.add('saved')
    if (dotTimer) clearTimeout(dotTimer)
    dotTimer = setTimeout(() => dotEl.classList.remove('saved'), 1600)
  } else if (s === 'error') {
    dotEl.classList.add('error')
    errEl.textContent = 'Speichern fehlgeschlagen — bitte exportieren'
  }
}

// ---------- Einstellungen anwenden ----------
const SERIF = '"Literata", "Iowan Old Style", Georgia, serif'
const SANS = '"Diatype", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
let mediaBound = false
export function applySettings() {
  const s = ctx.state.settings
  const root = document.documentElement
  const dark = s.theme === 'dark' || (s.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.dataset.theme = dark ? 'dark' : 'light'
  root.style.setProperty('--doc-size', s.fontSize + 'px')
  root.style.setProperty('--doc-width', s.lineWidth + 'px')
  root.style.setProperty('--doc-font', s.font === 'sans' ? SANS : SERIF)
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

// ---------- Toolbar ----------
let blockBtn = null, counterEl = null
function currentBlockLabel() {
  const e = ctx.editor
  if (e.isActive('heading', { level: 1 })) return 'Überschrift 1'
  if (e.isActive('heading', { level: 2 })) return 'Überschrift 2'
  if (e.isActive('heading', { level: 3 })) return 'Überschrift 3'
  if (e.isActive('taskList')) return 'Checkliste'
  if (e.isActive('bulletList')) return 'Aufzählung'
  if (e.isActive('orderedList')) return 'Nummeriert'
  if (e.isActive('blockquote')) return 'Zitat'
  if (e.isActive('codeBlock')) return 'Code'
  return 'Text'
}
function curFontSize() {
  const v = ctx.editor.getAttributes('textStyle').fontSize
  return v ? parseInt(v, 10) : ctx.state.settings.fontSize
}
function bumpFontSize(delta) {
  const size = Math.max(10, Math.min(48, curFontSize() + delta))
  ctx.editor.chain().focus().setFontSize(size + 'px').run()
}
function blockItems(panel) {
  const e = ctx.editor
  menuItem(panel, 'Text', () => e.chain().focus().setParagraph().run(), { active: currentBlockLabel() === 'Text' })
  menuItem(panel, 'Überschrift 1', () => e.chain().focus().toggleHeading({ level: 1 }).run(), { active: e.isActive('heading', { level: 1 }), kbd: '#' })
  menuItem(panel, 'Überschrift 2', () => e.chain().focus().toggleHeading({ level: 2 }).run(), { active: e.isActive('heading', { level: 2 }), kbd: '##' })
  menuItem(panel, 'Überschrift 3', () => e.chain().focus().toggleHeading({ level: 3 }).run(), { active: e.isActive('heading', { level: 3 }), kbd: '###' })
  menuDivider(panel)
  menuItem(panel, 'Aufzählung', () => e.chain().focus().toggleBulletList().run(), { active: e.isActive('bulletList'), kbd: '-' })
  menuItem(panel, 'Nummerierte Liste', () => e.chain().focus().toggleOrderedList().run(), { active: e.isActive('orderedList'), kbd: '1.' })
  menuItem(panel, 'Checkliste', () => e.chain().focus().toggleTaskList().run(), { active: e.isActive('taskList') })
  menuItem(panel, 'Zitat', () => e.chain().focus().toggleBlockquote().run(), { active: e.isActive('blockquote'), kbd: '>' })
}
function buildToolbar() {
  const bar = document.getElementById('bar')
  bar.innerHTML = ''
  const left = el('div', 'bar-group')
  const right = el('div', 'bar-group bar-right')

  blockBtn = el('button', 'tbtn tbtn-label tbtn-block')
  blockBtn.title = 'Blocktyp'
  blockBtn.innerHTML = '<span id="blockLabel">Text</span>'
  makeDropdown(blockBtn, blockItems)
  left.appendChild(blockBtn)
  left.appendChild(el('span', 'bar-sep'))

  const bBtn = el('button', 'tbtn', 'B'); bBtn.style.fontWeight = '700'
  bBtn.title = 'Fett (⌘B)'
  bBtn.addEventListener('mousedown', e => e.preventDefault())
  bBtn.addEventListener('click', () => ctx.editor.chain().focus().toggleBold().run())
  left.appendChild(bBtn)

  const iBtn = el('button', 'tbtn', 'I'); iBtn.style.fontStyle = 'italic'
  iBtn.title = 'Kursiv (⌘I)'
  iBtn.addEventListener('mousedown', e => e.preventDefault())
  iBtn.addEventListener('click', () => ctx.editor.chain().focus().toggleItalic().run())
  left.appendChild(iBtn)
  left.appendChild(el('span', 'bar-sep'))

  const aaBtn = el('button', 'tbtn tbtn-label')
  aaBtn.innerHTML = '<span>Aa</span>'
  aaBtn.title = 'Format (Größe, Farbe, Ausrichtung)'
  makeDropdown(aaBtn, panel => {
    const e = ctx.editor
    menuLabel(panel, 'Schriftgröße')
    const row = el('div', 'mi-row')
    const minus = el('button', 'mi-step', '−')
    const val = el('span', 'mi-val', curFontSize() + '')
    const plus = el('button', 'mi-step', '+')
    minus.addEventListener('click', () => { bumpFontSize(-1); val.textContent = curFontSize() + '' })
    plus.addEventListener('click', () => { bumpFontSize(1); val.textContent = curFontSize() + '' })
    ;[minus, plus].forEach(b => b.addEventListener('mousedown', ev => ev.preventDefault()))
    row.appendChild(minus); row.appendChild(val); row.appendChild(plus)
    const presets = el('span', 'mi-presets')
    ;[14, 17, 21].forEach(px => {
      const p = el('button', 'mi-preset', px + '')
      p.addEventListener('mousedown', ev => ev.preventDefault())
      p.addEventListener('click', () => { e.chain().focus().setFontSize(px + 'px').run(); val.textContent = px + '' })
      presets.appendChild(p)
    })
    row.appendChild(presets)
    panel.appendChild(row)
    menuDivider(panel)
    menuItem(panel, 'Unterstrichen', () => e.chain().focus().toggleUnderline().run(), { active: e.isActive('underline'), kbd: '⌘U' })
    menuItem(panel, 'Durchgestrichen', () => e.chain().focus().toggleStrike().run(), { active: e.isActive('strike') })
    menuDivider(panel)
    menuLabel(panel, 'Textfarbe')
    const crow = el('div', 'mi-swatches')
    COLORS.forEach(c => {
      const sw = el('button', 'swatch' + (c.value ? '' : ' swatch-none'))
      if (c.value) sw.style.background = c.value
      sw.title = c.label
      sw.addEventListener('mousedown', ev => ev.preventDefault())
      sw.addEventListener('click', () => {
        if (c.value) e.chain().focus().setColor(c.value).run()
        else e.chain().focus().unsetColor().run()
      })
      crow.appendChild(sw)
    })
    panel.appendChild(crow)
    menuLabel(panel, 'Markierung')
    const hrow = el('div', 'mi-swatches')
    HIGHLIGHTS.forEach(c => {
      const sw = el('button', 'swatch' + (c.value ? '' : ' swatch-none'))
      if (c.value) sw.style.background = c.value
      sw.title = c.label
      sw.addEventListener('mousedown', ev => ev.preventDefault())
      sw.addEventListener('click', () => {
        if (c.value) e.chain().focus().setHighlight({ color: c.value }).run()
        else e.chain().focus().unsetHighlight().run()
      })
      hrow.appendChild(sw)
    })
    panel.appendChild(hrow)
    menuDivider(panel)
    menuLabel(panel, 'Ausrichtung')
    const arow = el('div', 'mi-row')
    ;[['Links', 'left'], ['Mitte', 'center'], ['Rechts', 'right']].forEach(([lab, alg]) => {
      const b = el('button', 'mi-seg' + (e.isActive({ textAlign: alg }) ? ' on' : ''), lab)
      b.addEventListener('mousedown', ev => ev.preventDefault())
      b.addEventListener('click', () => { e.chain().focus().setTextAlign(alg).run(); closeAllPanels() })
      arow.appendChild(b)
    })
    panel.appendChild(arow)
  })
  left.appendChild(aaBtn)

  const plusBtn = el('button', 'tbtn')
  plusBtn.innerHTML = icon(IC.plus)
  plusBtn.title = 'Einfügen (Link, Bild, Trennlinie …)'
  makeDropdown(plusBtn, panel => {
    const e = ctx.editor
    menuItem(panel, 'Link …', () => openLinkDialog(), { kbd: '⌘K' })
    menuItem(panel, 'Bild …', () => imgInput.click())
    menuDivider(panel)
    menuItem(panel, 'Checkliste', () => e.chain().focus().toggleTaskList().run())
    menuItem(panel, 'Zitat', () => e.chain().focus().toggleBlockquote().run())
    menuItem(panel, 'Trennlinie', () => e.chain().focus().setHorizontalRule().run(), { kbd: '---' })
  })
  left.appendChild(plusBtn)

  counterEl = el('span', 'counter', '')
  right.appendChild(counterEl)
  dotEl = el('span', 'savedot')
  dotEl.title = 'Automatisch gespeichert'
  right.appendChild(dotEl)
  errEl = el('span', 'saveerr', '')
  right.appendChild(errEl)

  const gearBtn = el('button', 'tbtn')
  gearBtn.innerHTML = icon(IC.gear)
  gearBtn.title = 'Einstellungen'
  makeDropdown(gearBtn, panel => {
    const s = ctx.state.settings
    menuLabel(panel, 'Erscheinung')
    const trow = el('div', 'mi-row')
    ;[['Auto', 'auto'], ['Hell', 'light'], ['Dunkel', 'dark']].forEach(([lab, v]) => {
      const b = el('button', 'mi-seg' + (s.theme === v ? ' on' : ''), lab)
      b.addEventListener('click', () => { setSetting('theme', v); closeAllPanels() })
      trow.appendChild(b)
    })
    panel.appendChild(trow)
    menuLabel(panel, 'Schrift')
    const frow = el('div', 'mi-row')
    ;[['Serif', 'serif'], ['Sans', 'sans']].forEach(([lab, v]) => {
      const b = el('button', 'mi-seg' + (s.font === v ? ' on' : ''), lab)
      b.style.fontFamily = v === 'serif' ? SERIF : SANS
      b.addEventListener('click', () => { setSetting('font', v); closeAllPanels() })
      frow.appendChild(b)
    })
    panel.appendChild(frow)
    menuLabel(panel, 'Textgröße')
    const grow = el('div', 'mi-row')
    const gm = el('button', 'mi-step', '−')
    const gv = el('span', 'mi-val', s.fontSize + '')
    const gp = el('button', 'mi-step', '+')
    gm.addEventListener('click', () => { setSetting('fontSize', Math.max(15, s.fontSize - 1)); gv.textContent = ctx.state.settings.fontSize + '' })
    gp.addEventListener('click', () => { setSetting('fontSize', Math.min(22, s.fontSize + 1)); gv.textContent = ctx.state.settings.fontSize + '' })
    grow.appendChild(gm); grow.appendChild(gv); grow.appendChild(gp)
    panel.appendChild(grow)
    menuLabel(panel, 'Zeilenbreite')
    const wrow = el('div', 'mi-row')
    ;[['Schmal', 600], ['Mittel', 720], ['Breit', 900]].forEach(([lab, v]) => {
      const b = el('button', 'mi-seg' + (s.lineWidth === v ? ' on' : ''), lab)
      b.addEventListener('click', () => { setSetting('lineWidth', v); closeAllPanels() })
      wrow.appendChild(b)
    })
    panel.appendChild(wrow)
    menuDivider(panel)
    menuItem(panel, s.spellcheck ? 'Rechtschreibung: An' : 'Rechtschreibung: Aus',
      () => setSetting('spellcheck', !s.spellcheck))
    menuItem(panel, 'Fokus-Modus', () => toggleZen(), { kbd: '⌘.', active: document.body.classList.contains('zen') })
    menuDivider(panel)
    menuItem(panel, 'Exportieren als Markdown …', () => ctx.exportMd(), { kbd: '⌘E' })
    menuItem(panel, 'Drucken / PDF …', () => requestPrint(), { kbd: '⌘P' })
  }, true)
  right.appendChild(gearBtn)

  bar.appendChild(left)
  bar.appendChild(right)

  // verstecktes Datei-Feld für "Bild …"
  var imgInput = document.createElement('input')
  imgInput.type = 'file'
  imgInput.accept = 'image/*'
  imgInput.style.display = 'none'
  imgInput.addEventListener('change', () => {
    if (imgInput.files && imgInput.files[0]) ctx.insertImageFile(imgInput.files[0])
    imgInput.value = ''
  })
  document.body.appendChild(imgInput)
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
  if (lab) lab.textContent = currentBlockLabel()
  if (counterEl && ctx.editor.storage.characterCount) {
    const w = ctx.editor.storage.characterCount.words()
    counterEl.textContent = w + (w === 1 ? ' Wort' : ' Wörter')
  }
}

// ---------- Auswahl-Bubble ----------
let bubbleEl = null
function buildBubble() {
  bubbleEl = el('div', 'bubble')
  const mk = (label, title, run, cls) => {
    const b = el('button', 'bb' + (cls ? ' ' + cls : ''), label)
    b.title = title
    b.addEventListener('mousedown', e => e.preventDefault())
    b.addEventListener('click', run)
    bubbleEl.appendChild(b)
    return b
  }
  mk('B', 'Fett', () => ctx.editor.chain().focus().toggleBold().run(), 'bb-b')
  mk('I', 'Kursiv', () => ctx.editor.chain().focus().toggleItalic().run(), 'bb-i')
  mk('U', 'Unterstrichen', () => ctx.editor.chain().focus().toggleUnderline().run(), 'bb-u')
  mk('S', 'Durchgestrichen', () => ctx.editor.chain().focus().toggleStrike().run(), 'bb-s')
  bubbleEl.appendChild(el('span', 'bb-div'))
  mk('−', 'Kleiner', () => bumpFontSize(-1))
  mk('+', 'Größer', () => bumpFontSize(1))
  bubbleEl.appendChild(el('span', 'bb-div'))
  mk('🔗', 'Link (⌘K)', () => openLinkDialog())
  document.body.appendChild(bubbleEl)
}
function showBubble() {
  const e = ctx.editor
  const sel = e.state.selection
  if (sel.empty || sel.node) { hideBubble(); return }
  if (openPanel) return
  const from = e.view.coordsAtPos(sel.from)
  const to = e.view.coordsAtPos(sel.to)
  bubbleEl.classList.add('open')
  const w = bubbleEl.offsetWidth
  let left = (from.left + to.left) / 2 - w / 2
  left = Math.max(8, Math.min(left, window.innerWidth - w - 8))
  let top = Math.min(from.top, to.top) - bubbleEl.offsetHeight - 8
  if (top < 54) top = Math.max(from.bottom, to.bottom) + 8
  bubbleEl.style.left = left + 'px'
  bubbleEl.style.top = top + 'px'
}
function hideBubble() { if (bubbleEl) bubbleEl.classList.remove('open') }

// ---------- Link-Dialog ----------
let linkEl = null
function openLinkDialog() {
  closeAllPanels(); hideBubble()
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
    if (url) ctx.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    else ctx.editor.chain().focus().extendMarkRange('link').unsetLink().run()
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
    if (e.key === 'Escape') closeAllPanels()
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
    { label: 'Bild …', run: () => document.querySelector('input[type=file][accept^=image]').click() },
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
        const items = slashEl._items || []
        if (items[slashSel]) execSlash(items[slashSel])
        return true
      }
      if (e.key === 'Escape') { closeSlash(); return true }
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
  handleEl.title = 'Breite ziehen'
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
let rowPanels = []
export function refreshSidebar() {
  if (!ctx) return
  // alte Zeilen-Menüs aufräumen (sonst sammeln sie sich an)
  rowPanels.forEach(p => { const i = panels.indexOf(p); if (i >= 0) panels.splice(i, 1); p.remove() })
  rowPanels = []
  const listEl = document.getElementById('doclist')
  const trashListEl = document.getElementById('trashlist')
  const trashCountEl = document.getElementById('trashCount')
  if (!listEl) return
  const q = searchQuery.trim().toLowerCase()

  let docs = ctx.state.docs.filter(d => !d.trashed)
  if (q) docs = docs.filter(d =>
    ctx.docTitle(d).toLowerCase().includes(q) || stripHtml(d.body).toLowerCase().includes(q))
  docs = docs.slice().sort((a, b) => sortMode === 'title'
    ? ctx.docTitle(a).localeCompare(ctx.docTitle(b), 'de')
    : (b.updated || 0) - (a.updated || 0))

  listEl.innerHTML = ''
  if (!docs.length) {
    listEl.appendChild(el('div', 'empty', q ? 'Nichts gefunden.' : 'Noch kein Text — ⌘N beginnt einen neuen.'))
  }
  docs.forEach(d => {
    const item = el('div', 'doc' + (d.id === ctx.state.active ? ' on' : ''))
    const tt = el('div', 'dt')
    tt.appendChild(highlightMatch(ctx.docTitle(d), q))
    item.appendChild(tt)
    item.appendChild(el('div', 'dd', fmtDate(d.updated)))
    const more = el('button', 'doc-more', '…')
    more.title = 'Mehr'
    item.appendChild(more)
    rowPanels.push(makeDropdown(more, panel => {
      menuItem(panel, 'Duplizieren', () => ctx.ops.duplicateDoc(d.id))
      menuDivider(panel)
      menuItem(panel, 'In den Papierkorb', () => ctx.ops.trashDoc(d.id))
    }))
    item.addEventListener('click', e => {
      if (e.target === more || more.contains(e.target)) return
      if (d.id !== ctx.state.active) ctx.ops.openDoc(d.id)
    })
    listEl.appendChild(item)
  })

  const trash = ctx.state.docs.filter(d => d.trashed)
  trashCountEl.textContent = trash.length ? String(trash.length) : ''
  document.getElementById('trash').style.display = trash.length ? '' : 'none'
  trashListEl.innerHTML = ''
  trash.sort((a, b) => (b.trashedAt || 0) - (a.trashedAt || 0)).forEach(d => {
    const item = el('div', 'doc trash-doc')
    item.appendChild(el('div', 'dt', ctx.docTitle(d)))
    const acts = el('div', 'trash-acts')
    const re = el('button', 'ghost', 'Wiederherstellen')
    re.addEventListener('click', () => ctx.ops.restoreDoc(d.id))
    const del = el('button', 'ghost ghost-danger', 'Endgültig löschen')
    del.addEventListener('click', () => {
      if (confirm('„' + ctx.docTitle(d) + '" endgültig löschen? Das kann nicht rückgängig gemacht werden.'))
        ctx.ops.deleteForever(d.id)
    })
    acts.appendChild(re); acts.appendChild(del)
    item.appendChild(acts)
    trashListEl.appendChild(item)
  })
}
function bindSidebar() {
  const nb = document.getElementById('newBtn')
  nb.innerHTML = icon(IC.plus)
  nb.addEventListener('click', () => ctx.ops.newDoc())
  document.getElementById('sortBtn').innerHTML = icon(IC.sort)
  const search = document.getElementById('search')
  search.addEventListener('input', () => { searchQuery = search.value; refreshSidebar() })
  search.addEventListener('keydown', e => {
    if (e.key === 'Escape') { search.value = ''; searchQuery = ''; refreshSidebar(); search.blur() }
  })
  const sortBtn = document.getElementById('sortBtn')
  const syncSortTitle = () => { sortBtn.title = sortMode === 'recent' ? 'Sortiert: zuletzt bearbeitet' : 'Sortiert: Titel A–Z' }
  syncSortTitle()
  sortBtn.addEventListener('click', () => {
    sortMode = sortMode === 'recent' ? 'title' : 'recent'
    syncSortTitle(); refreshSidebar()
  })
  const tgl = document.getElementById('trashToggle')
  tgl.addEventListener('click', () => {
    const l = document.getElementById('trashlist')
    l.hidden = !l.hidden
    tgl.classList.toggle('openT', !l.hidden)
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
    if (mod && e.key === 'k') { e.preventDefault(); openLinkDialog() }
    else if (mod && e.key === '.') { e.preventDefault(); toggleZen() }
    else if (mod && e.key === 'e') { e.preventDefault(); ctx.exportMd() }
    else if (mod && e.key === 'p') { e.preventDefault(); requestPrint() }
    else if (mod && e.key === 'n' && !ctx.state.native) { e.preventDefault(); ctx.ops.newDoc() }
    else if (e.key === 'Escape') {
      if (openPanel) closeAllPanels()
      else if (document.body.classList.contains('zen')) toggleZen()
    }
  })
  document.addEventListener('click', () => closeAllPanels())
}

// ---------- Init ----------
export function initUI(context) {
  ctx = context
  buildToolbar()
  buildBubble()
  bindSlash()
  bindImageResize()
  bindSidebar()
  bindTitle()
  bindKeys()
  updateToolbarState()
  ctx.editor.on('selectionUpdate', () => { updateToolbarState(); showBubble(); markZenBlock() })
  ctx.editor.on('update', () => { updateToolbarState(); markZenBlock() })
  ctx.editor.on('blur', () => setTimeout(() => { if (!openPanel) hideBubble() }, 150))
  document.getElementById('scroll').addEventListener('scroll', () => { hideBubble() })
}
