// Gate, Signatur und Ablauf des Quellenlaufs — PUR, node-testbar, kein DOM.
// Vorbild und Vertrag: erweiterungslauf-model.mjs. workspace.js liefert nur die
// ctx-gebundenen Werte und uebernimmt das Ergebnis.
//
// Der Lauf ordnet die Quellen eines PROJEKTS nach Thema. Er haengt deshalb an der
// Quellenmenge und nicht am Text: derselbe Text mit denselben Quellen ergibt dieselbe
// Ordnung, und dafuer ein zweites Mal zu bezahlen waere Verschwendung.
import { baueQuellenKontext } from './quellen-kontext.mjs'

// Unter drei Quellen ist die flache Liste selbst schon die Ordnung. Ein Lauf brächte
// dann bestenfalls zwei Gruppen mit je einer Quelle — das ist keine Ordnung, sondern
// eine Umbenennung, und sie kostet einen ganzen Durchgang.
export const MINDEST_QUELLEN = 3

export function pruefeQuellenlaufGate({
  hatProjekt,
  istBeispielprojekt,
  laeuftBereits,
  anzahlQuellen = 0,
  vonHand = false,
}) {
  if (!hatProjekt) return { erlaubt: false, grund: 'kein-projekt' }
  // Im Beispielprojekt liegt keine einzige aufgenommene Quelle (example-seed.mjs). Ein
  // Lauf haette dort nichts zu ordnen und bezahlte die Demo.
  if (istBeispielprojekt) return { erlaubt: false, grund: 'beispielprojekt' }
  if (laeuftBereits) return { erlaubt: false, grund: 'lauf-aktiv' }
  if (!anzahlQuellen) return { erlaubt: false, grund: 'keine-quellen' }
  // Von Hand angefordert zaehlt die Mindestmenge nicht: wer ausdruecklich auf „Nach
  // Thema ordnen" drueckt, darf das auch bei drei Zeilen tun.
  if (!vonHand && anzahlQuellen < MINDEST_QUELLEN) return { erlaubt: false, grund: 'zu-wenige' }
  return { erlaubt: true }
}

// Die Signatur beantwortet genau eine Frage: hat sich die Quellenmenge seit dem letzten
// Lauf geaendert? Sortiert, damit die Reihenfolge der Aufnahme keine Rolle spielt —
// dieselben Quellen sind dieselbe Frage, gleich in welcher Ordnung sie im Speicher
// stehen. Ohne Projektkennung waeren zwei Projekte mit gleich vielen Quellen fuer den
// Vergleich dasselbe.
export function quellenSignatur(projectId, quellen = []) {
  const ids = (Array.isArray(quellen) ? quellen : [])
    .map(quelle => String(quelle?.id || ''))
    .filter(Boolean)
    .sort()
  if (!projectId || !ids.length) return null
  return `${projectId}:${ids.join(',')}`
}

// Fail-closed wie ueberall im Haus: im Zweifel nicht bezahlen. Ohne Signatur (kein
// Projekt, keine Quellen) laeuft nichts automatisch an.
export function darfAutomatischOrdnen(signatur, letzteSignatur) {
  if (!signatur) return false
  return signatur !== letzteSignatur
}

const RESTRUBRIKEN = new Set([
  'sonstiges', 'verschiedenes', 'weitere quellen', 'weiteres', 'rest', 'diverses',
  'allgemein', 'sonstige quellen', 'noch ohne thema', 'ohne thema',
])

// Wandelt die Modellantwort in etwas um, das uebernimmThemenvorschlag verdauen darf.
// Verworfen wird, statt geraten:
//   - eine Gruppe ohne Namen oder ohne gueltige Quelle traegt nichts,
//   - eine erfundene Kennung gehoert zu keiner Quelle; sie stillschweigend anzulegen
//     hiesse, eine Quelle zu behaupten, die es nicht gibt,
//   - dieselbe Kennung zweimal zaehlt beim ersten Treffer. Eine Quelle liegt in genau
//     einem Thema (quellen-thema-model.mjs) — die zweite Nennung ist ein Modellfehler,
//   - eine Restrubrik ist keine Ordnung. Was nirgends hingehoert, steht sichtbar unter
//     „Noch ohne Thema"; eine Gruppe „Sonstiges" verdeckte genau das.
export function verarbeiteQuellenthemen({ geliefert, bekannteIds = [] }) {
  const bekannt = new Set((Array.isArray(bekannteIds) ? bekannteIds : []).map(id => String(id || '')).filter(Boolean))
  const vergeben = new Set()
  const namen = new Set()
  const gruppen = []
  let verworfen = 0

  for (const roh of (Array.isArray(geliefert) ? geliefert : [])) {
    const name = String(roh?.name || '').trim()
    if (!name || RESTRUBRIKEN.has(name.toLowerCase()) || namen.has(name.toLowerCase())) { verworfen += 1; continue }
    const quellenIds = (Array.isArray(roh?.quellenIds) ? roh.quellenIds : [])
      .map(id => String(id || '').trim())
      .filter(id => {
        if (!bekannt.has(id) || vergeben.has(id)) return false
        vergeben.add(id)
        return true
      })
    if (!quellenIds.length) { verworfen += 1; continue }
    namen.add(name.toLowerCase())
    gruppen.push({ name, warum: String(roh?.warum || '').trim(), quellenIds })
  }

  return { gruppen, verworfen, geliefertAnzahl: Array.isArray(geliefert) ? geliefert.length : 0 }
}

// Ein vollstaendiger Versuch. Dieselbe Reihenfolge und dieselben Sicherungen wie
// versucheErweiterungslauf: Gate -> Sperre SYNCHRON vor dem ersten await -> Schluessel
// -> Konsistenzpruefung nach dem await -> Kostenfreigabe -> Kontext -> runTask.
export async function versucheQuellenlauf({
  hatProjekt,
  istBeispielprojekt,
  laeuftBereits,
  quellen = [],
  bestehendeThemen = [],
  verstaendnis = null,
  vonHand = false,
  sperreSetzen,
  hatSchluessel,
  istNochDasselbeProjekt,
  beansprucheKostenfreigabe,
  runTask,
  setzeAgentStatus,
}) {
  const gate = pruefeQuellenlaufGate({
    hatProjekt, istBeispielprojekt, laeuftBereits, anzahlQuellen: quellen.length, vonHand,
  })
  if (!gate.erlaubt) return { gestartet: false, grund: gate.grund }

  sperreSetzen(true)
  try {
    if (!(await hatSchluessel())) return { gestartet: false, grund: 'kein-schluessel' }
    if (!istNochDasselbeProjekt()) return { gestartet: false, grund: 'projekt-gewechselt' }
    const kostenfreigabe = typeof beansprucheKostenfreigabe === 'function'
      ? beansprucheKostenfreigabe()
      : { erlaubt: true }
    if (!kostenfreigabe?.erlaubt) {
      return { gestartet: false, grund: kostenfreigabe?.grund || 'kostenfreigabe-fehlt' }
    }

    const kontext = baueQuellenKontext({ verstaendnis, quellen, bestehendeThemen })
    setzeAgentStatus({ zustand: 'laeuft' })
    const { daten } = await runTask('quellenthemen', kontext)
    setzeAgentStatus({ zustand: 'bereit' })
    const { gruppen, verworfen, geliefertAnzahl } = verarbeiteQuellenthemen({
      geliefert: daten?.gruppen,
      bekannteIds: quellen.map(quelle => quelle?.id),
    })
    return { gestartet: true, erfolg: true, gruppen, verworfen, geliefertAnzahl }
  } catch (fehler) {
    setzeAgentStatus({ zustand: 'fehler', fehlerTyp: fehler?.typ })
    return { gestartet: true, erfolg: false, fehler: fehler?.typ || 'unbekannt' }
  } finally {
    sperreSetzen(false)
  }
}
