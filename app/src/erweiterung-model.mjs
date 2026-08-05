// Der zweite Kanal: Erweiterungen. PUR, node-testbar, kein DOM.
//
// Warum ein eigenes Modell und keine weitere Finding-Kategorie:
// Findings sind offene Posten. Sie stehen in einer Warteschlange (getFindingQueue),
// sie werden gezaehlt (pendingCount), sie haben Integritaetsregeln und eine Entscheidung
// mit Konsequenz. Eine Erweiterung ist nichts davon. Sie ist ein Angebot. Waere sie ein
// Finding, bekaeme sie all das automatisch mit -- eine Zahl neben "Fehler" macht aus
// einem Geschenk eine Hausaufgabe. Deshalb ein eigenes Feld, doc.erweiterungen, das
// keine dieser Funktionen beruehrt.
//
// Zwei Gesten, mehr nicht: merken und weglegen. Kein "nur diesmal / nicht mehr in
// diesem Text / nie" wie beim Verwerfen eines Hinweises -- diese Leiter gibt es, weil
// ein Hinweis eine Forderung war, die man abwehren koennen muss. Ein Angebot muss man
// nicht abwehren; man legt es weg. Weggelegtes wird nicht erneut vorgeschlagen, das
// reicht.

export const ERWEITERUNGS_ARTEN = Object.freeze(['weiterfuehrung', 'feld', 'verbindung'])

// Die Zahl der Stellen gehoert zur Art. Sie wird geprueft, nie geraten: lieber eine
// Erweiterung verwerfen als einen Anker erfinden, damit die Form gleichmaessig aussieht.
export const ANKER_ANZAHL = Object.freeze({
  weiterfuehrung: 1,
  feld: 0,
  verbindung: 2,
})

export const ART_LABEL = Object.freeze({
  weiterfuehrung: 'Weiterführung',
  feld: 'Feld',
  verbindung: 'Verbindung',
})

export const ART_ERKLAERUNG = Object.freeze({
  weiterfuehrung: 'Der Gedanke trägt weiter, als du ihn geführt hast.',
  feld: 'Ein Nachbargebiet, das der Text noch nicht betreten hat.',
  verbindung: 'Zwei Stellen gehören zusammen.',
})

const ZUSTAENDE = new Set(['neu', 'gemerkt', 'weg'])

// Eine Stelle liegt entweder im offenen Text oder in einem anderen Text desselben Projekts.
// Die beiden Faelle unterscheiden sich in genau zwei Feldern:
//   - offener Text: blockId zeigt auf den Baustein, docId ist null,
//   - fremder Text: docId nennt das Dokument, blockId ist null (die Bausteinkennung eines
//     fremden Textes gaebe es im offenen Editor nicht — siehe fremdeStelle).
// docTitel ist eine Momentaufnahme des Titels. Sie kostet ein paar Zeichen und macht die
// gespeicherte Stelle selbsterklaerend, auch wenn das Dokument spaeter umbenannt oder
// geloescht wird. Ohne sie waere von einer weggeworfenen Verbindung nur eine Kennung uebrig,
// die auf nichts mehr zeigt.
function sichereStelle(rohe) {
  if (!rohe || typeof rohe !== 'object') return null
  const text = String(rohe.text || '')
  if (!text) return null
  const index = Number.isInteger(rohe.index) && rohe.index >= 0 ? rohe.index : null
  const laenge = Number.isInteger(rohe.laenge) && rohe.laenge > 0 ? rohe.laenge : text.length
  const docId = String(rohe.docId || '') || null
  // Fail-closed gegen einen beschaedigten Speicher: eine Stelle, die zugleich einen fremden
  // Text und einen Baustein des offenen nennt, ist beides nicht. Der fremde Text gewinnt,
  // der Baustein faellt weg — sonst entstuende ein Knopf, der ins Leere spraenge.
  const blockId = docId ? null : (rohe.blockId || null)
  return { text, index, laenge, blockId, docId, docTitel: String(rohe.docTitel || '') }
}

// Selbstheilung wie ensureReasoningModel: ein beschaedigtes oder aelteres Dokument
// bekommt ein leeres, gueltiges Feld statt eines Absturzes. Eintraege mit unbekannter
// Art oder falscher Stellenzahl fallen still heraus -- sie waeren nicht darstellbar.
export function ensureErweiterungen(doc) {
  if (!doc || typeof doc !== 'object') return doc
  const rohe = Array.isArray(doc.erweiterungen) ? doc.erweiterungen : []
  const gesehen = new Set()
  doc.erweiterungen = rohe.reduce((liste, eintrag) => {
    if (!eintrag || typeof eintrag !== 'object') return liste
    const art = String(eintrag.art || '')
    if (!ERWEITERUNGS_ARTEN.includes(art)) return liste
    const stellen = (Array.isArray(eintrag.stellen) ? eintrag.stellen : [])
      .map(sichereStelle)
      .filter(Boolean)
    if (stellen.length !== ANKER_ANZAHL[art]) return liste
    const id = String(eintrag.id || '')
    if (!id || gesehen.has(id)) return liste
    gesehen.add(id)
    liste.push({
      ...eintrag,
      id,
      art,
      stellen,
      status: ZUSTAENDE.has(eintrag.status) ? eintrag.status : 'neu',
      gedanke: String(eintrag.gedanke || ''),
      muster: String(eintrag.muster || ''),
      createdAt: Number.isFinite(eintrag.createdAt) ? eintrag.createdAt : 0,
    })
    return liste
  }, [])
  return doc
}

// Was sichtbar ist: neue und gemerkte. Weggelegtes bleibt gespeichert, damit es nicht
// erneut vorgeschlagen wird -- sichtbar ist es nicht mehr.
//
// Gemerktes steht oben. Das ist die Folge, die "merken" ueberhaupt erst zu einer Geste
// macht: ohne sie waere der Knopf eine Farbaenderung und sonst nichts. Neues sammelt
// sich darunter und laesst sich weglegen, ohne dass das Behaltene mitwandert.
const RANG = { gemerkt: 0, neu: 1 }

export function sichtbareErweiterungen(doc) {
  ensureErweiterungen(doc)
  return (doc?.erweiterungen || [])
    .filter(eintrag => eintrag.status !== 'weg')
    .sort((a, b) => (
      (RANG[a.status] ?? 1) - (RANG[b.status] ?? 1)
      || (a.createdAt || 0) - (b.createdAt || 0)
      || String(a.id).localeCompare(String(b.id), 'de')
    ))
}

export function erweiterungenFuerBlock(doc, blockId) {
  if (!blockId) return []
  return sichtbareErweiterungen(doc)
    .filter(eintrag => eintrag.stellen.some(stelle => stelle.blockId === blockId))
}

function setzeZustand(doc, id, status, at) {
  ensureErweiterungen(doc)
  const eintrag = (doc?.erweiterungen || []).find(kandidat => kandidat.id === id)
  if (!eintrag) return null
  eintrag.status = status
  eintrag.entschiedenAt = Number.isFinite(at) ? at : Date.now()
  return eintrag
}

export function merkeErweiterung(doc, id, at = Date.now()) {
  return setzeZustand(doc, id, 'gemerkt', at)
}

export function legeErweiterungWeg(doc, id, at = Date.now()) {
  return setzeZustand(doc, id, 'weg', at)
}

// Volatiler Prompt-Teil: was schon angeboten wurde, kommt nicht noch einmal --
// weder das Gemerkte noch das Weggelegte. Bewusst OHNE Zeitstempel und ohne IDs,
// damit dieser Block den Cache-Praefix nicht mit Rauschen fuellt.
export function fasseErweiterungenZusammen(doc) {
  ensureErweiterungen(doc)
  return (doc?.erweiterungen || []).map(eintrag => ({
    art: eintrag.art,
    stellen: eintrag.stellen.map(stelle => stelle.text),
    gedanke: eintrag.gedanke,
    zustand: eintrag.status,
  }))
}
