// Die Zeile über dem Text — vier Fassungen zum Vergleichen. PUR, node-testbar.
//
// Warum das überhaupt zur Debatte steht: Die heutige Fassung ist eine Bilanz.
// "0 Fehler · 1 Empfehlung · 0 Geschmack" nennt drei Größen, von denen zwei null
// sind, und stellt sie über den Text. Das ist eine Punktetafel, und eine Punktetafel
// hat genau ein Ziel: sie auf null bringen.
//
// Die Philosophie sagt dazu zwei Dinge, die sich hier treffen:
//   - "Eine Zahl neben Fehler macht aus einem Geschenk eine Hausaufgabe."
//     (entschieden für Erweiterungen, gilt für Rückmeldung überhaupt)
//   - "Onda achtet darauf, nie den Nutzer zu überfordern. Onda ist eine Calm
//     Technology."
//
// Die vier Fassungen unterscheiden sich darin, WIE VIEL eine Rückmeldung über sich
// selbst verrät, bevor man sie ansieht — von "alles, als Tabelle" bis "gar nichts".
// Welche richtig ist, entscheidet sich am Schreiben, nicht am Schreibtisch.

export const VARIANTEN = Object.freeze(['bilanz', 'satz', 'punkte', 'still'])

export const VARIANTEN_LABEL = Object.freeze({
  bilanz: 'Bilanz',
  satz: 'Satz',
  punkte: 'Punkte',
  still: 'Still',
})

export const VARIANTEN_ERKLAERUNG = Object.freeze({
  bilanz: 'Alle drei Arten mit Zahl, auch die mit null. Der heutige Stand.',
  satz: 'Ein Satz, der nur nennt, was wirklich da ist. Nullen kommen nicht vor.',
  punkte: 'Ein Punkt je offener Anmerkung, keine Ziffer. Man sieht, dass etwas da ist, nicht wie viel abzuarbeiten wäre.',
  still: 'Gar keine Auskunft. Was da ist, findet man beim Durchgehen.',
})

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

// Obergrenze für die Punkte-Fassung. Darüber wird aus "man sieht, dass etwas da ist"
// wieder eine Menge, die man zählt — und damit genau die Tafel, die vermieden werden
// soll. Sieben ist die Grenze, ab der man Punkte ohnehin nicht mehr auf einen Blick
// erfasst, sondern abzählt.
export const MAX_PUNKTE = 7

// Der Text der Zeile. Gibt null zurück, wenn die Fassung gar keinen Text zeigt —
// dann rendert die Oberfläche nichts, statt eine leere Zeile stehen zu lassen.
export function bilanzText(variante, summary) {
  const z = zahlen(summary)

  if (variante === 'still') return null

  if (!z.total) {
    // Auch der Leerzustand ist eine Entscheidung: "Keine offenen Anmerkungen" nennt
    // das Fehlende und macht daraus wieder eine Bilanz mit dem Wert null. Die
    // ruhigeren Fassungen sagen an dieser Stelle schlicht nichts.
    return variante === 'bilanz' ? 'Keine offenen Anmerkungen' : null
  }

  if (variante === 'bilanz') {
    return [
      `${z.fehler} ${z.fehler === 1 ? EINZAHL.fehler : MEHRZAHL.fehler}`,
      `${z.empfehlungen} ${z.empfehlungen === 1 ? EINZAHL.empfehlungen : MEHRZAHL.empfehlungen}`,
      `${z.geschmack} ${MEHRZAHL.geschmack}`,
    ].join(' · ')
  }

  if (variante === 'satz') {
    // Nur nennen, was wirklich da ist. Eine Null ist keine Auskunft, sondern eine
    // Aufgabe, die es nicht gibt.
    const teile = []
    if (z.fehler) teile.push(`${z.fehler} ${z.fehler === 1 ? EINZAHL.fehler : MEHRZAHL.fehler}`)
    if (z.empfehlungen) teile.push(`${z.empfehlungen} ${z.empfehlungen === 1 ? EINZAHL.empfehlungen : MEHRZAHL.empfehlungen}`)
    if (z.geschmack) teile.push(`${z.geschmack} zu ${MEHRZAHL.geschmack}`)
    if (!teile.length) return null
    if (teile.length === 1) return `${teile[0]} wartet.`
    return `${teile.slice(0, -1).join(', ')} und ${teile.at(-1)} warten.`
  }

  return null // punkte: der Text ist leer, die Punkte kommen aus punkteFuer()
}

// Für die Punkte-Fassung: je Art so viele Punkte, wie offen sind — gedeckelt.
// Die Reihenfolge ist die Rangfolge, damit die Punkte immer gleich stehen.
export function punkteFuer(variante, summary) {
  if (variante !== 'punkte') return []
  const z = zahlen(summary)
  const punkte = []
  for (const art of ['fehler', 'empfehlungen', 'geschmack']) {
    for (let i = 0; i < z[art] && punkte.length < MAX_PUNKTE; i += 1) punkte.push(art)
  }
  return punkte
}

// Vorlesegeräte bekommen IMMER den vollen Wortlaut, auch in der stillen Fassung.
// Die Zurückhaltung ist eine Frage der Augen, nicht der Zugänglichkeit — dieselbe
// Regel wie bei den Struktur-Karten.
export function bilanzVorlesetext(summary) {
  const z = zahlen(summary)
  if (!z.total) return 'Keine offenen Anmerkungen'
  return bilanzText('bilanz', summary)
}

export function istVariante(wert) {
  return VARIANTEN.includes(String(wert || ''))
}

// Fail-closed: ein unbekannter Wert ergibt den heutigen Stand, nicht eine leere Zeile.
// Wer die Fassung falsch schreibt, soll die Auskunft nicht verlieren.
export function normalisiereVariante(wert) {
  return istVariante(wert) ? String(wert) : 'bilanz'
}
