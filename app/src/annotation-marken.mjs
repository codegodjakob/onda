// Onda — wo im Text eine Anmerkung markiert wird.
//
// Das Design System markiert die STELLE, nicht den Absatz: "Trotzdem behandeln
// wir sie wie einen Vorrat — ein teurer [Zeit vertreib]." Vier Kategorien, vier
// Prinzipien, ohne Farbcode (components/annotation/Mark.jsx):
//   korrektur — Rahmen           stil      — Flaeche
//   struktur  — angehobener Block inhalt   — Akzentflaeche
//
// Hier steht nur die Rechnung: aus Absatztext und Anmerkung wird ein Bereich.
// Kein DOM, kein ProseMirror — vollstaendig node-testbar.

import { findeAnker } from './anchor-verify.mjs'
import { normalizeAnnotationFinding, resolveAnnotationPresentation } from './annotation-contract.mjs'

// Der Platzhalter, mit dem ProseMirror Nicht-Text-Knoten zaehlt. Ein Bild ist
// eine Position im Dokument, aber null Zeichen im Text — ohne Platzhalter
// verschoeben sich alle Marken dahinter.
export const KNOTEN_PLATZHALTER = '￼'

// Der Bereich, den eine Anmerkung im Absatz markiert. Gibt null, wenn die
// Stelle nicht (mehr) im Text steht — dann wird nichts markiert, statt
// irgendetwas zu markieren.
export function markenBereich(absatzText, finding) {
  const normalisiert = normalizeAnnotationFinding(finding)
  const ziel = String(normalisiert.target || '').trim()
  if (!ziel || typeof absatzText !== 'string' || !absatzText) return null
  const treffer = findeAnker(absatzText, ziel)
  if (!treffer.gefunden || !treffer.laenge) return null
  return {
    von: treffer.index,
    bis: treffer.index + treffer.laenge,
    kategorie: resolveAnnotationPresentation(normalisiert).category,
  }
}

// Mehrere Stellen derselben Anmerkung — "Wiederholung" markiert jedes Vorkommen
// und nummeriert sie (siehe annotation.card.html, Beispiel Wiederholung).
// Ueberlappungen fallen weg: zwei Marken uebereinander ergaeben verschachtelte
// Rahmen, und die Nummerierung waere nicht mehr lesbar.
export function markenBereiche(absatzText, finding) {
  const normalisiert = normalizeAnnotationFinding(finding)
  const kategorie = resolveAnnotationPresentation(normalisiert).category
  const ziele = Array.isArray(normalisiert.targets) && normalisiert.targets.length
    ? normalisiert.targets.map(eintrag => (typeof eintrag === 'string' ? eintrag : eintrag?.text))
    : [normalisiert.target]

  const bereiche = []
  ziele.filter(Boolean).forEach(ziel => {
    let ab = 0
    // Dasselbe Wort kann mehrfach vorkommen; jedes Vorkommen bekommt eine Marke.
    while (ab <= absatzText.length) {
      const rest = absatzText.slice(ab)
      const treffer = findeAnker(rest, String(ziel).trim())
      if (!treffer.gefunden || !treffer.laenge) break
      const von = ab + treffer.index
      const bis = von + treffer.laenge
      if (!bereiche.some(vorhanden => von < vorhanden.bis && bis > vorhanden.von)) {
        bereiche.push({ von, bis, kategorie })
      }
      ab = bis
    }
  })

  return bereiche
    .sort((links, rechts) => links.von - rechts.von)
    .map((bereich, index, alle) => ({ ...bereich, nummer: alle.length > 1 ? index + 1 : null }))
}

// Ob eine Anmerkung ueberhaupt jedes Vorkommen markiert. Nur Arten, die den
// ganzen Text durchmustern, tun das — sonst waere eine Wortwahl-Korrektur an
// fuenf Stellen gleichzeitig offen, und keine davon waere die gemeinte.
const SAMMELT = new Set(['wiederholung', 'terminologie'])

export function markiertAlleVorkommen(finding) {
  return SAMMELT.has(normalizeAnnotationFinding(finding).anmerkungsart)
}
