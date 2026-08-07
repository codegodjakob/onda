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
