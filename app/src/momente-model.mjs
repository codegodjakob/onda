// Die drei Momente — PUR, node-testbar, kein DOM.
//
// Die Frage, die dieses Modul beantwortet: WANN darf eine Rückmeldung sichtbar werden?
// Nicht: wann läuft der Agent. Das sind zwei verschiedene Dinge, und sie wurden bisher
// verwechselt. Ein Lauf kostet Geld und wird deshalb selten ausgelöst; ob sein Ergebnis
// im selben Augenblick auch erscheinen darf, ist eine Frage des Schreibens.
//
// Vorher war es genau falsch herum: Rechtschreibung lag hinter einem Fenster, das man
// selbst öffnen musste (language-ui.mjs), während Struktur- und Logikkritik alle drei
// Sekunden ansprang. Das Billige war versteckt, das Teure drängte sich auf.
//
// Die Regel dahinter: eine Rückmeldung erscheint in dem Moment, in dem man sie
// BEANTWORTEN kann, ohne den Gedanken zu verlieren.

export const MOMENTE = Object.freeze(['sofort', 'innehalten', 'aufschauen'])

export const MOMENT_LABEL = Object.freeze({
  sofort: 'sofort',
  innehalten: 'beim Innehalten',
  aufschauen: 'beim Aufschauen',
})

// Momente sind aufsteigend, nicht ausschliessend: wer aufschaut, hat auch innegehalten.
// Ohne diese Ordnung wuerde ein Formulierungshinweis wieder verschwinden, sobald man
// die Hand von der Tastatur nimmt -- das waere absurd.
const RANG = Object.freeze({ sofort: 0, innehalten: 1, aufschauen: 2 })

// Die vollständige Tabelle: elf Arten, drei Momente, je eine Begründung.
// Die acht Hinweisarten stammen aus agent-prompts.mjs (SYSTEM_COACH), die drei
// Erweiterungsarten aus erweiterung-model.mjs.
export const ART_MOMENT = Object.freeze({
  sprache: 'sofort',
  fakt: 'innehalten',
  quelle: 'innehalten',
  logik: 'innehalten',
  methode: 'innehalten',
  struktur: 'aufschauen',
  wirkung: 'aufschauen',
  erklaerung: 'aufschauen',
  weiterfuehrung: 'aufschauen',
  feld: 'aufschauen',
  verbindung: 'aufschauen',
})

export const MOMENT_BEGRUENDUNG = Object.freeze({
  sprache: 'Eine Formulierung ist dort am billigsten zu ändern, wo sie steht. Das Aufschauen kostet mehr als die Korrektur selbst.',
  fakt: 'Eine Tatsachenbehauptung prüft man, solange man noch weiß, woher sie kam — aber nicht mitten im Satz.',
  quelle: 'Der fehlende Beleg gehört zu dem Gedanken, den du gerade zu Ende gebracht hast.',
  logik: 'Ein Bruch im Gedankengang zeigt sich erst, wenn der Gedanke fertig ist. Vorher ist er ein halber Satz.',
  methode: 'Was die Daten tragen, entscheidet sich am fertigen Schluss, nicht am halben.',
  struktur: 'Aufbau sieht man nur mit Abstand. Mitten im Absatz ist die Frage gar nicht beantwortbar.',
  wirkung: 'Die Wirkung auf ein Publikum hat der ganze Text, nicht der einzelne Satz.',
  erklaerung: 'Ob ein Begriff eingeführt ist, hängt am ganzen bisherigen Text.',
  weiterfuehrung: 'Ein Angebot mitten im Satz ist eine Unterbrechung, kein Angebot.',
  feld: 'Ein Nachbargebiet betritt man zwischen zwei Arbeitsgängen, nicht innerhalb eines Satzes.',
  verbindung: 'Zwei Stellen sieht man nur, wenn man beide im Blick hat — also nicht beim Schreiben der einen.',
})

// Auslösebedingungen. Zeit allein reicht nicht: eine Pause mitten im Satz ist Nachdenken,
// eine Pause nach dem Punkt ist ein Innehalten. Deshalb zählt die Satz- oder Absatzgrenze
// mit, und an einer Grenze genügt eine viel kürzere Pause.
export const INNEHALTEN_MS = 3000
export const INNEHALTEN_AN_GRENZE_MS = 300
export const AUFSCHAUEN_MS = 45000

export const AUSLOESER = Object.freeze({
  sofort: 'Immer. Sobald etwas da ist, ist es zu sehen.',
  innehalten: `Satz- oder Absatzende und ${INNEHALTEN_AN_GRENZE_MS} ms Ruhe — oder ${INNEHALTEN_MS / 1000} s Ruhe an beliebiger Stelle.`,
  aufschauen: `${AUFSCHAUEN_MS / 1000} s Ruhe, oder die Schreibansicht verlassen — oder von Hand angefordert.`,
})

// Ein Satzende ist ein EREIGNIS: das Zeichen, das gerade getippt wurde. Nicht der
// Zustand "der Text endet auf einen Punkt" -- sonst zaehlte jeder weitere Tastendruck
// hinter dem Punkt erneut als Satzende. Genau dieser Unterschied hat einen frueheren
// Prototyp aus drei Treffern 122 machen lassen.
const SATZZEICHEN = new Set(['.', '!', '?', '…'])

export function istSatzende(zeichen) {
  return typeof zeichen === 'string' && zeichen.length === 1 && SATZZEICHEN.has(zeichen)
}

export function momentFuerArt(art) {
  return ART_MOMENT[String(art || '')] || 'aufschauen'
}

// Welcher Moment ist gerade erreicht? Gibt immer genau einen zurück; alles Niedrigere
// ist damit ebenfalls erlaubt (siehe darfErscheinen).
export function aktuellerMoment({
  jetzt = Date.now(),
  lastInputAt = null,
  anGrenze = false,
  editorSichtbar = true,
  vonHand = false,
} = {}) {
  // Von Hand angefordert heisst: ich schaue jetzt hin. Das ist per Definition ein
  // Aufschauen, egal wie lange die letzte Taste her ist.
  if (vonHand) return 'aufschauen'
  // Wer die Schreibansicht verlaesst, schaut auf -- staerker geht es nicht.
  if (!editorSichtbar) return 'aufschauen'
  if (!Number.isFinite(lastInputAt)) return 'aufschauen'

  const ruhe = jetzt - lastInputAt
  if (ruhe >= AUFSCHAUEN_MS) return 'aufschauen'
  if (ruhe >= INNEHALTEN_MS) return 'innehalten'
  if (anGrenze && ruhe >= INNEHALTEN_AN_GRENZE_MS) return 'innehalten'
  return 'sofort'
}

export function darfErscheinen(art, moment) {
  const gebraucht = RANG[momentFuerArt(art)]
  const erreicht = RANG[String(moment || '')] ?? RANG.sofort
  return gebraucht <= erreicht
}

// Bequemer Filter für Listen. Der Zugriff auf die Art ist bewusst tolerant: Findings
// tragen sie als kiKategorie/kategorie, Erweiterungen als art.
export function artVon(eintrag) {
  if (!eintrag) return ''
  return String(eintrag.art || eintrag.kiKategorie || eintrag.kategorie || '')
}

export function filtereNachMoment(eintraege, moment) {
  return (eintraege || []).filter(eintrag => darfErscheinen(artVon(eintrag), moment))
}

// Die Tabelle als Daten, für Oberfläche und Dokumentation — damit die Begründung
// an genau einer Stelle steht und nicht im Text daneben noch einmal.
export function momentTabelle() {
  return Object.keys(ART_MOMENT).map(art => ({
    art,
    moment: ART_MOMENT[art],
    momentLabel: MOMENT_LABEL[ART_MOMENT[art]],
    begruendung: MOMENT_BEGRUENDUNG[art],
  }))
}
