// Reiner Kontext-Bauer für den Task 'bausteinarten' — PUR, node-testbar, kein DOM.
// Übersetzt die Rohdaten auf den tatsächlichen baueAnfrage-Vertrag
// ({verstaendnis, docText, volatiles}). Vorbild: hinweis-kontext.mjs.
import { BAUSTEINARTEN_ANWEISUNG } from './agent-prompts.mjs'
import { benennbar } from './bausteinarten-vertrag.mjs'

export const ANRISS_ZEICHEN = 120

// Das Absatzverzeichnis ist volatil, nicht gecacht: Es ändert sich mit jedem neuen
// Absatz, während der Dokumenttext im Cache-Präfix liegt und dort stabil bleiben muss
// (Cache-Präfix-Stabilität; siehe agent-tasks.mjs).
//
// Der Anriss statt des vollen Absatzes: Der ganze Wortlaut steht bereits im <dokument>.
// Das Verzeichnis hat nur die Aufgabe, Kennung und Absatz zusammenzubringen -- dafür
// reichen die ersten Zeichen, und der Auftrag bleibt kurz genug, um im Blick zu bleiben.
//
// Aufgeführt werden NUR die offenen Absätze (pruefeBausteinBedarf). Die übrigen behalten
// ihren Namen; sie hier zu nennen hieße, das Modell für nichts arbeiten zu lassen und die
// Antwort um Zeilen zu verlängern, die ohnehin verworfen würden. Ohne offene-Liste stehen
// alle benennbaren Absätze drin — der Fall des ersten Laufs.
function absatzVerzeichnis(blocks, offene) {
  const nurDiese = Array.isArray(offene) && offene.length ? new Set(offene) : null
  const eintraege = (Array.isArray(blocks) ? blocks : [])
    .filter(benennbar)
    .filter(block => !nurDiese || nurDiese.has(block.id))
    .map(block => ({
      blockId: block.id,
      anriss: String(block.text || '').trim().slice(0, ANRISS_ZEICHEN),
    }))
  return eintraege.length ? `Absätze: ${JSON.stringify(eintraege)}` : null
}

// Der bisherige Stand reist mit, damit die Namen zwischen zwei Läufen nicht wandern:
// Was schon "Befund" hieß, soll nicht beim nächsten Lauf "Ergebnis" heißen, nur weil
// beides passt. Ohne bisherigen Stand entsteht kein Block.
function bisherigerStand(bestand) {
  if (!bestand || !Array.isArray(bestand.arten) || !bestand.arten.length) return null
  const arten = bestand.arten.map(art => ({ name: art.name, funktion: art.funktion }))
  return 'Bisher erkannt: '
    + `Textsorte ${JSON.stringify(bestand.textsorte || 'unbekannt')}, Arten ${JSON.stringify(arten)}. `
    + 'Behalte diese Namen bei, wo sie weiter passen — benenne nur um, wenn der alte Name falsch geworden ist.'
}

export function baueBausteinKontext({
  verstaendnis = null,
  docText = '',
  blocks = [],
  bestand = null,
  offene = null,
} = {}) {
  const volatiles = [BAUSTEINARTEN_ANWEISUNG]
  const stand = bisherigerStand(bestand)
  if (stand) volatiles.push(stand)
  const verzeichnis = absatzVerzeichnis(blocks, offene)
  if (verzeichnis) volatiles.push(verzeichnis)
  return { verstaendnis, docText, volatiles }
}
