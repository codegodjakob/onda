// Wem gehoert das Verstaendnis-Interview? — PUR, node-testbar, kein DOM.
//
// Hintergrund: der Zustand kennt ZWEI Zeiger, die absichtlich auseinanderlaufen
// duerfen. state.activeProject ist der BROWSE-Zeiger der Projektuebersicht (welches
// Projekt blaettert der Nutzer gerade durch), state.active das GELADENE Dokument.
// Die App startet immer in der Projektuebersicht, und ein Projektwechsel dort laesst
// das geladene Dokument stehen — schon nach einem frischen Start zeigt der eine auf
// 'Meine Texte' und das andere auf das Beispiel-Dokument aus 'p-example'.
//
// Wer ein Dokument mit einem Projekt paart, muss deshalb ueber doc.projectId
// aufloesen (so macht es openDoc, so macht es fuehreHinweislaufAus). Wer stattdessen
// den Browse-Zeiger nimmt, schreibt den Zustand von Projekt A in das Dokument von
// Projekt B — beobachtet als 'interview-p-default' in den Nachrichten des
// Beispiel-Dokuments, ohne jede Nutzerinteraktion.
//
// Dieses Modul nimmt den Browse-Zeiger GAR NICHT ERST ENTGEGEN. Die Verwechslung
// ist hier nicht mehr ausdrueckbar.
import { EXAMPLE_PROJECT_ID } from './example-seed.mjs'
import { ensureProjectUnderstanding, istEntwurfVersucht, istInterviewOffen } from './reasoning-model.mjs'

// Ab dieser Textlaenge lohnt der bezahlte Entwurf-Lauf: darunter hat das Modell zu
// wenig Material, und die kostenlose feste Eroeffnungsfrage fuehrt genauso weit.
export const INTERVIEW_ENTWURF_MIN_ZEICHEN = 200

export function projektZumDokument(projects, doc) {
  if (!Array.isArray(projects) || !doc?.projectId) return null
  return projects.find(candidate => candidate?.id === doc.projectId) || null
}

export function istBeispielProjekt(project) {
  return Boolean(project && (project.id === EXAMPLE_PROJECT_ID || project.example === true))
}

const INTERVIEW_PRAEFIX = 'interview-'

export function interviewNachrichtId(projectId) {
  return `${INTERVIEW_PRAEFIX}${projectId}`
}

// Altlast aus dem oben beschriebenen Fehlerbild: bestehende Installationen tragen die
// falsch einsortierte Nachricht bereits im gespeicherten Zustand — der Fix allein
// verhindert nur neue. Ohne bekanntes Projekt wird nichts weggeraeumt; im Zweifel
// bleibt der Nutzerzustand stehen.
export function istFremdeInterviewNachricht(messageId, docProjectId) {
  if (!docProjectId || typeof messageId !== 'string') return false
  if (!messageId.startsWith(INTERVIEW_PRAEFIX)) return false
  return messageId !== interviewNachrichtId(docProjectId)
}

function nichts(grund) {
  return { art: 'nichts', grund }
}

// Entscheidet, welche Interview-Nachricht in DIESES Dokument gehoert. Der Aufrufer
// bleibt duenn: er reicht Dokument, Projektliste, die vorhandenen Nachrichten-IDs und
// die Textlaenge herein und fuehrt die zurueckgegebene Absicht aus.
export function planeInterviewNachricht({
  doc = null,
  projects = [],
  vorhandeneNachrichtIds = [],
  docTextLaenge = 0,
} = {}) {
  if (!doc) return nichts('kein-dokument')
  const project = projektZumDokument(projects, doc)
  if (!project) return nichts('kein-projekt')
  if (istBeispielProjekt(project)) return nichts('beispielprojekt')

  const understanding = ensureProjectUnderstanding(project)
  if (!istInterviewOffen(understanding)) return nichts('interview-geschlossen')

  // Nur die EIGENE Nachricht zaehlt. Eine fremde 'interview-…'-Nachricht (Altlast aus
  // dem oben beschriebenen Fehlerbild) darf das eigene Interview nicht blockieren.
  const nachrichtId = interviewNachrichtId(project.id)
  const ids = Array.isArray(vorhandeneNachrichtIds) ? vorhandeneNachrichtIds : []
  if (ids.includes(nachrichtId)) return nichts('nachricht-vorhanden')

  // Der bezahlte Entwurf-Lauf ist projektweit gesperrt, sobald er einmal versucht
  // wurde (auch bei Fehlschlag — kein Wiederholungs-Sturm ueber mehrere Dokumente
  // desselben Projekts). Die kostenlose feste Eroeffnungsfrage bleibt frei — sie
  // darf in jedem Dokument erscheinen, sie kostet nichts.
  const art = docTextLaenge > INTERVIEW_ENTWURF_MIN_ZEICHEN && !istEntwurfVersucht(understanding)
    ? 'entwurf'
    : 'eroeffnung'
  return { art, projectId: project.id, docId: doc.id, nachrichtId }
}
