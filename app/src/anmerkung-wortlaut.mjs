// Was ein Vorlesegerät über die offenen Anmerkungen erfährt. PUR, node-testbar.
//
// Für die Augen steht über dem Text nichts — kein Zähler, keine Bilanz, keine Leiste.
// Das ist der Grundsatz "Der andere Stift" (docs/PHILOSOPHIE.md §1): wer neben dir
// schreibt, sagt nicht, wie viele Anmerkungen er noch hat.
//
// Für ein Vorlesegerät gilt das Gegenteil. Wer nicht SIEHT, dass jemand mitschreibt,
// muss es gesagt bekommen — sonst ist die Ruhe keine Zurückhaltung mehr, sondern eine
// Auslassung. Deshalb trägt das Stift-Zeichen in der Topbar den vollen Wortlaut, den
// dieses Modul erzeugt.
//
// Vorgänger dieser Datei war `bilanz-varianten.mjs` mit vier Fassungen einer
// Anmerkungszeile. Jakob wählte am 7. August 2026 keine davon, sondern die Abschaffung
// der Zeile. Geblieben ist genau diese eine Funktion.

const EINZAHL = Object.freeze({
  fehler: 'Fehler',
  empfehlungen: 'Empfehlung',
  geschmack: 'Geschmack',
})
const MEHRZAHL = Object.freeze({
  fehler: 'Fehler',
  empfehlungen: 'Empfehlungen',
  geschmack: 'Geschmack',
})

function zahlen(summary) {
  const s = summary && typeof summary === 'object' ? summary : {}
  return {
    fehler: Number(s.fehler) || 0,
    empfehlungen: Number(s.empfehlungen) || 0,
    geschmack: Number(s.geschmack) || 0,
    total: Number(s.total) || 0,
  }
}

// Der volle Wortlaut. Nennt alle drei Arten mit Zahl — für ein Vorlesegerät ist die
// Vollständigkeit die Höflichkeit, nicht die Zurückhaltung.
export function bilanzVorlesetext(summary) {
  const z = zahlen(summary)
  if (!z.total) return 'Keine offenen Anmerkungen'
  return [
    `${z.fehler} ${z.fehler === 1 ? EINZAHL.fehler : MEHRZAHL.fehler}`,
    `${z.empfehlungen} ${z.empfehlungen === 1 ? EINZAHL.empfehlungen : MEHRZAHL.empfehlungen}`,
    `${z.geschmack} ${MEHRZAHL.geschmack}`,
  ].join(' · ')
}
