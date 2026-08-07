// Reine Logik fuer den Bausteinlauf — PUR, node-testbar, kein DOM, kein ctx.
// workspace.js (fuehreBausteinlaufAus) orchestriert nur: Dokument/Editor lesen, diese
// Funktionen aufrufen, runTask + Persistenz ausloesen. Vorbild: hinweislauf-model.mjs.

// Die unsichtbare Funktion einer Bausteinart. Bewusst die englischen Schluessel, die die
// vorhandene Rechenlogik zeichengenau vergleicht (claim-ledger.mjs:7, effect-analysis.mjs:46,
// language-patterns.mjs:51). Der SICHTBARE Name ist davon unabhaengig und frei.
export const FUNKTIONEN = Object.freeze(['claim', 'evidence', 'counterpoint', 'transition', 'question'])

// Ab wann gilt ein Absatz als umgeschrieben statt fortgeschrieben? Gemessen an der
// Zeichenzahl seit seiner Benennung. Gesetzt, nicht hergeleitet — deshalb von aussen
// verstellbar und an beiden Raendern geprueft.
export const UMSCHREIB_GRENZE = 0.5

function benennbar(block) {
  if (!block?.id) return false
  if (block.type === 'heading' || block.role === 'heading') return false
  return Boolean(String(block.text || '').trim())
}

// Bestand und Reihenfolge der Absaetze — bewusst OHNE Wortlaut. Wer in einem Absatz
// weiterschreibt, aendert die Signatur nicht; wer einen anlegt, entfernt oder verschiebt,
// aendert sie. Genau das ist der Unterschied, an dem der Lauf haengen soll.
export function strukturSignatur(blocks) {
  return (Array.isArray(blocks) ? blocks : [])
    .filter(block => block?.id)
    .map(block => block.id)
    .join('|')
}

// Wurde nur umsortiert? Gleiche Absaetze, andere Reihenfolge. Das ist der eine Fall, in
// dem ALLE Absaetze neu zu benennen sind, obwohl sich kein einziger Wortlaut geaendert
// hat: Was ein Absatz tut, haengt an seiner Stelle im Text. Derselbe Satz ist am Anfang
// eine These und am Schluss eine Zusammenfassung.
//
// Ein hinzugekommener oder entfernter Absatz aendert die Reihenfolge ebenfalls, ist aber
// NICHT dieser Fall -- sonst loeste jede Eingabetaste eine vollstaendige Neubenennung des
// ganzen Textes aus. Dort reicht, was ohnehin offen ist.
function nurUmsortiert(idsJetzt, idsVorher) {
  if (idsJetzt.length !== idsVorher.length) return false
  const gleich = new Set(idsVorher)
  if (idsJetzt.some(id => !gleich.has(id))) return false
  return idsJetzt.some((id, index) => idsVorher[index] !== id)
}

export function pruefeBausteinBedarf({ blocks, bestand, grenze = UMSCHREIB_GRENZE } = {}) {
  const liste = (Array.isArray(blocks) ? blocks : []).filter(benennbar)
  if (!bestand || !Array.isArray(bestand.arten) || !bestand.arten.length) {
    return { noetig: liste.length > 0, grund: 'kein-bestand', offene: liste.map(block => block.id) }
  }

  const idsJetzt = strukturSignatur(blocks).split('|').filter(Boolean)
  const idsVorher = String(bestand.laufSignatur || '').split('|').filter(Boolean)
  if (nurUmsortiert(idsJetzt, idsVorher)) {
    return { noetig: liste.length > 0, grund: 'umsortiert', offene: liste.map(block => block.id) }
  }

  const zuordnung = bestand.zuordnung && typeof bestand.zuordnung === 'object' ? bestand.zuordnung : {}
  const ohneNamen = []
  const umgeschrieben = []
  liste.forEach(block => {
    const eintrag = zuordnung[block.id]
    if (!eintrag || !eintrag.artId) { ohneNamen.push(block.id); return }
    const alt = Number(eintrag.zeichen) || 0
    const neu = String(block.text || '').trim().length
    if (Math.abs(neu - alt) / Math.max(1, alt) > grenze) umgeschrieben.push(block.id)
  })

  // Ein entfernter Absatz allein loest nichts aus: Er aendert die Reihenfolge, aber kein
  // uebriger Absatz braucht deshalb einen neuen Namen.
  const offene = [...new Set([...ohneNamen, ...umgeschrieben])]
  if (!offene.length) return { noetig: false, grund: 'aktuell', offene: [] }

  return { noetig: true, grund: ohneNamen.length ? 'ohne-namen' : 'umgeschrieben', offene }
}

const ALTE_ROLLEN = Object.freeze({
  claim: 'Kernbehauptung',
  evidence: 'Beleg',
  counterpoint: 'Gegenposition',
  transition: 'Übergang',
  question: 'Offene Frage',
})

function text(wert) {
  return typeof wert === 'string' ? wert.trim() : ''
}

// Aus einer gespeicherten Datei kommt Verdachtsmaterial: aeltere Fassung, von Hand
// bearbeitet, halb geschrieben. Entweder wird daraus eine vollstaendig gueltige Ablage
// oder null — nie eine halbe, an der spaeter etwas stillschweigend fehlt.
export function normalisiereBausteinarten(wert) {
  if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
  if (!Array.isArray(wert.arten)) return null

  const arten = []
  const nachName = new Map()
  const umleitung = new Map()
  wert.arten.forEach((roh, index) => {
    if (!roh || typeof roh !== 'object') return
    const name = text(roh.name)
    if (!name) return
    const id = text(roh.id) || `art-${index + 1}`

    // Bei doppelten Ids gewinnt der erste Eintrag — die zweite Art faellt weg.
    // umleitung ist die vollstaendige Liste aller verbrauchten Ids, ob direkt oder via Namensumleitung.
    if (umleitung.has(id)) {
      return
    }

    const schluessel = name.toLocaleLowerCase('de')
    const bekannt = nachName.get(schluessel)
    if (bekannt) { umleitung.set(id, bekannt); return }
    const art = {
      id,
      name,
      beschreibung: text(roh.beschreibung),
      funktion: FUNKTIONEN.includes(roh.funktion) ? roh.funktion : null,
    }
    arten.push(art)
    nachName.set(schluessel, id)
    umleitung.set(id, id)
  })
  if (!arten.length) return null

  const zuordnung = {}
  const roheZuordnung = wert.zuordnung && typeof wert.zuordnung === 'object' ? wert.zuordnung : {}
  Object.entries(roheZuordnung).forEach(([blockId, eintrag]) => {
    if (!text(blockId) || !eintrag || typeof eintrag !== 'object') return
    const artId = umleitung.get(text(eintrag.artId))
    if (!artId) return
    zuordnung[blockId] = { artId, zeichen: Math.max(0, Number(eintrag.zeichen) || 0) }
  })

  return {
    textsorte: text(wert.textsorte) || null,
    arten,
    zuordnung,
    laufSignatur: typeof wert.laufSignatur === 'string' ? wert.laufSignatur : '',
    standAt: Number(wert.standAt) || 0,
  }
}

function knotenText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.text || ''
  return (Array.isArray(node.content) ? node.content : []).map(knotenText).join('')
}

// Ein Dokument aus der Sechser-Zeit verliert seine Rollen nicht: Sie werden mit ihren
// alten deutschen Woertern zum Anfangsbestand. Der naechste Lauf ersetzt ihn.
// 'paragraph' war die Voreinstellung, keine Entscheidung — daraus entsteht nichts.
//
// WICHTIG: Diese Funktion nimmt das ROHE Tiptap-JSON, nicht die Bloecke aus
// collectBlockSnapshots. Seit dem 7. August 2026 liest collectBlockSnapshots das alte
// Merkmal semanticRole nicht mehr (die Bausteinart liegt neben dem Text). Ueber Bloecke
// gefuettert fände diese Funktion also NIE eine alte Rolle und waere ein stiller No-Op.
// Sie ist die einzige Stelle im Programm, die das Alt-Merkmal noch kennt -- genau das
// ist ihre Aufgabe.
export function bestandAusAltenRollen(docJson, jetzt = Date.now()) {
  const knoten = docJson && Array.isArray(docJson.content) ? docJson.content : []
  const arten = []
  const nachRolle = new Map()
  const zuordnung = {}
  const kennungen = []

  knoten.forEach(node => {
    const id = node?.attrs?.blockId
    if (!id) return
    kennungen.push(id)
    if (node.type === 'heading') return
    const rolle = node?.attrs?.semanticRole
    if (!Object.hasOwn(ALTE_ROLLEN, rolle)) return
    const name = ALTE_ROLLEN[rolle]
    const inhalt = knotenText(node).trim()
    if (!inhalt) return
    if (!nachRolle.has(rolle)) {
      const art = { id: `art-alt-${rolle}`, name, beschreibung: '', funktion: rolle }
      arten.push(art)
      nachRolle.set(rolle, art.id)
    }
    zuordnung[id] = { artId: nachRolle.get(rolle), zeichen: inhalt.length }
  })

  if (!arten.length) return null
  return {
    textsorte: null,
    arten,
    zuordnung,
    laufSignatur: kennungen.join('|'),
    standAt: Number(jetzt) || 0,
  }
}

// Zwei getrennte Karten, weil zwei getrennte Zwecke: Die Funktion speist block.role und
// damit die Rechenlogik; der Name steht in der Struktur-Spalte. Eine Art ohne Funktion
// hat trotzdem einen Namen — sie taucht nur in der Rechenlogik nicht auf.
function bausteinKarte(bestand, feld) {
  const karte = new Map()
  const gueltig = normalisiereBausteinarten(bestand)
  if (!gueltig) return karte
  const werte = new Map(gueltig.arten.map(art => [art.id, art[feld]]))
  Object.entries(gueltig.zuordnung).forEach(([blockId, eintrag]) => {
    const wert = werte.get(eintrag.artId)
    if (wert) karte.set(blockId, wert)
  })
  return karte
}

export function bausteinRollen(bestand) { return bausteinKarte(bestand, 'funktion') }

export function bausteinNamen(bestand) { return bausteinKarte(bestand, 'name') }
