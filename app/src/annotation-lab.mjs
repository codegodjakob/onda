// DER ZWEITE EINSTIEGSPUNKT — kein Fehlläufer, kein Überbleibsel.
//
// Diese Datei ist das Modul, das annotation-lab.html lädt: das Anmerkungslabor. Es zeigt
// jede Anmerkungsart einmal an einem festen Beispiel (aus evals/fixtures/annotation-cases.mjs),
// hell oder dunkel über ?theme=, einzeln wählbar über ?kind= und ?state=. Dadurch lassen
// sich Aussehen und Verhalten einer Anmerkung prüfen, ohne die ganze Schreibumgebung
// hochzufahren — und die Bild-Prüfungen haben eine Seite, die sich nie von selbst ändert.
//
// Es ist also NICHT so, dass hier eine Datei am Einstiegspunkt src/editor.js vorbeiläuft.
// Onda hat zwei Einstiegspunkte, und das hier ist der zweite. Gezeichnet wird mit denselben
// Bausteinen wie in der App: annotation-components.mjs.
import { ANNOTATION_CASES, annotationCase } from '../evals/fixtures/annotation-cases.mjs'
import { kindInfo } from './annotation-contract.mjs'
import { renderAnnotation, renderAnnotationMark } from './annotation-components.mjs'

const params = new URLSearchParams(window.location.search)
const theme = params.get('theme') === 'dark' ? 'dark' : 'light'
const requestedKind = params.get('kind')
const requestedState = params.get('state')
document.documentElement.dataset.theme = theme

const root = document.getElementById('annotationLab')
const statuses = new Map()

function textElement(tag, className, text) {
  const node = document.createElement(tag)
  if (className) node.className = className
  node.textContent = text
  return node
}

function callbacks(status) {
  return {
    onAccept: finding => {
      status.textContent = `${kindInfo(finding.anmerkungsart).label}: übernommen. Rückgängig bleibt möglich.`
      status.parentElement.querySelector('.onda-annotation').dataset.state = 'applied'
    },
    onDismiss: finding => {
      status.textContent = `${kindInfo(finding.anmerkungsart).label}: verworfen. Die Entscheidung kann geändert werden.`
      status.parentElement.querySelector('.onda-annotation').dataset.state = 'rejected'
    },
    onReply: (finding, text) => {
      status.textContent = `${kindInfo(finding.anmerkungsart).label}: Antwort „${text}“ ist an der Anmerkung notiert.`
    },
  }
}

function renderCase(finding, index) {
  const wrapper = document.createElement('article')
  wrapper.className = 'lab__case'
  const sample = document.createElement('p')
  sample.className = 'lab__sample'
  sample.append('Im Text erscheint ')
  sample.append(renderAnnotationMark({ finding, text: finding.target, index: index + 1 }))
  sample.append(' genau an der betroffenen Stelle.')
  wrapper.append(sample)

  const status = textElement('p', 'lab__status', '')
  status.id = `lab-status-${finding.id}`
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  statuses.set(finding.id, status)
  const displayed = requestedState ? { ...finding, fixtureState: requestedState } : finding
  wrapper.append(renderAnnotation(displayed, callbacks(status)))
  wrapper.append(status)
  return wrapper
}

function groupLabel(finding) {
  if (kindInfo(finding.anmerkungsart).category === 'notiz') return 'Notizmodus'
  const priority = kindInfo(finding.anmerkungsart).priority
  if (priority === 'fehler') return 'Fehler'
  if (priority === 'empfehlung') return 'Empfehlungen'
  return 'Geschmack'
}

root.append(textElement('div', 'lab__aura', ''))
root.append(textElement('h1', 'lab__title', 'Anmerkungen, die zum Fall passen'))
root.append(textElement('p', 'lab__intro', 'Jede Rückmeldung zeigt ihre eigene Handlung: korrigieren, umschreiben, einfügen, verschieben, vergleichen, belegen oder gemeinsam klären.'))

const single = requestedKind ? annotationCase(requestedKind) : null
const cases = single ? [single] : ANNOTATION_CASES
const groups = new Map()
cases.forEach(finding => {
  const label = groupLabel(finding)
  if (!groups.has(label)) groups.set(label, [])
  groups.get(label).push(finding)
})

for (const label of ['Fehler', 'Empfehlungen', 'Geschmack', 'Notizmodus']) {
  const findings = groups.get(label)
  if (!findings?.length) continue
  const section = document.createElement('section')
  section.className = 'lab__group'
  section.append(textElement('h2', 'lab__group-title', label))
  const grid = document.createElement('div')
  grid.className = 'lab__grid'
  findings.forEach(finding => grid.append(renderCase(finding, ANNOTATION_CASES.indexOf(finding))))
  section.append(grid)
  root.append(section)
}
