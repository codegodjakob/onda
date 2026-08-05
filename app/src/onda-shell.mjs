let shellContext = null

function visibleDocuments(context) {
  return (context?.state?.docs || [])
    .filter(document => !document.trashed)
    .slice()
    .sort((left, right) => (right.updated || 0) - (left.updated || 0))
}

function syncView(view) {
  const app = document.getElementById('app')
  const main = document.getElementById('ondaMain')
  if (!app || !main) return
  app.dataset.view = view
  main.setAttribute('aria-label', view === 'editor' ? 'Schreibraum' : 'Bibliothek')
  syncMobileSidebar(view)
}

function syncMobileSidebar(view = document.body.classList.contains('view-editor') ? 'editor' : 'home') {
  if (view !== 'editor' || !window.matchMedia('(max-width: 800px)').matches) return
  const editorView = document.getElementById('editorView')
  const collapse = document.getElementById('sidebarCollapse')
  const reopen = document.getElementById('sidebarReopen')
  editorView?.classList.add('is-sidebar-collapsed')
  collapse?.setAttribute('aria-expanded', 'false')
  reopen?.setAttribute('aria-expanded', 'false')
  if (reopen) reopen.hidden = false
}

function renderRecent(context) {
  const target = document.getElementById('libraryRecent')
  if (!target) return
  target.replaceChildren()
  visibleDocuments(context).slice(0, 5).forEach(document => {
    const button = window.document.createElement('button')
    button.type = 'button'
    button.className = 'onda-library-recent__item'
    button.textContent = context.docTitle(document)
    button.title = context.docTitle(document)
    button.addEventListener('click', () => context.ops.openDoc(document.id))
    target.append(button)
  })
}

function setActiveLibraryItem(mode) {
  const activeId = mode === 'projects' ? 'libraryProjects' : 'libraryDocuments'
  document.querySelectorAll('.onda-library-nav__item').forEach(button => {
    const active = button.id === activeId
    button.classList.toggle('is-active', active)
    if (active) button.setAttribute('aria-current', 'page')
    else button.removeAttribute('aria-current')
  })
}

export function refreshOndaShell(context = shellContext, { mode = 'projects' } = {}) {
  if (!context) return
  shellContext = context
  const documents = visibleDocuments(context)
  const projects = context.state.projects || []
  const count = document.getElementById('homeCount')
  if (count) {
    count.textContent = mode === 'projects'
      ? `${projects.length} ${projects.length === 1 ? 'Projekt' : 'Projekte'}`
      : `${documents.filter(item => item.projectId === context.state.activeProject).length} Dokumente in diesem Projekt`
  }
  setActiveLibraryItem(mode)
  renderRecent(context)
}

function bindLibraryNavigation() {
  const navigate = mode => document.dispatchEvent(new CustomEvent('aiwt:librarynavigate', { detail: { mode } }))
  document.getElementById('libraryProjects')?.addEventListener('click', () => navigate('projects'))
  document.getElementById('libraryDocuments')?.addEventListener('click', () => navigate('docs'))
  document.getElementById('libraryArchive')?.addEventListener('click', () => navigate('archive'))
}

export function initOndaShell(context) {
  shellContext = context
  bindLibraryNavigation()
  document.addEventListener('aiwt:viewchange', event => syncView(event.detail?.view || 'home'))
  window.addEventListener('resize', () => syncMobileSidebar())
  syncView(document.body.classList.contains('view-editor') ? 'editor' : 'home')
  refreshOndaShell(context)
}
