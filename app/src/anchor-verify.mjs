// Client-Verifikation der KI-Anker — deterministischer Code, kein Modell (Spec §5).
// PUR, node-testbar: kein DOM, keine Tiptap-Abhängigkeit. Stufen: exakt ->
// normalisiert (Whitespace kollabieren + typografische/gerade Anführungszeichen
// gleichsetzen) -> sonst gefunden:false (Hinweis wird verworfen, nie geraten).

const QUOTE_MAP = Object.freeze({
  '„': '"', // „
  '“': '"', // "
  '”': '"', // "
  '‟': '"', // ‟
  '«': '"', // «
  '»': '"', // »
  '‚': "'", // ‚
  '‘': "'", // '
  '’': "'", // '
  '‛': "'", // ‛
  '‹': "'", // ‹
  '›': "'", // ›
})

// Baut die normalisierte Fassung eines Texts plus eine Karte
// normalisierter Index -> Original-Index. Whitespace-Läufe kollabieren zu
// einem Leerzeichen, das auf das erste Original-Whitespace-Zeichen zeigt.
function normalisiereMitKarte(text) {
  let norm = ''
  const karte = []
  let inWhitespace = false
  for (let i = 0; i < text.length; i += 1) {
    const zeichen = text[i]
    if (/\s/.test(zeichen)) {
      if (!inWhitespace) {
        norm += ' '
        karte.push(i)
        inWhitespace = true
      }
      continue
    }
    inWhitespace = false
    norm += QUOTE_MAP[zeichen] || zeichen
    karte.push(i)
  }
  return { norm, karte }
}

export function findeAnker(docText, anker) {
  if (typeof docText !== 'string' || typeof anker !== 'string' || !anker.trim()) {
    return { gefunden: false, index: null, normalisiert: false }
  }

  const exakt = docText.indexOf(anker)
  if (exakt >= 0) return { gefunden: true, index: exakt, normalisiert: false }

  const doc = normalisiereMitKarte(docText)
  const gesucht = normalisiereMitKarte(anker.trim())
  const treffer = doc.norm.indexOf(gesucht.norm)
  if (treffer < 0) return { gefunden: false, index: null, normalisiert: false }
  return { gefunden: true, index: doc.karte[treffer], normalisiert: true }
}

// Dedupe-Schlüssel: normalisierter Anker + Kategorie (Fuzzy-Varianten desselben
// Zitats gelten als dieselbe Stelle).
function dedupeSchluessel(anker, kategorie) {
  const { norm } = normalisiereMitKarte(String(anker || '').trim())
  return `${norm}␟${String(kategorie || '')}`
}

// Filtert Wiederholungen: gleicher anker+kategorie wie ein vorhandenes Finding
// (egal welcher Status — decideFinding lässt entschiedene Findings in doc.findings)
// ODER wie eine frühere Entscheidung (über decision.findingId aufgelöst).
// Zusätzlich fallen Duplikate innerhalb desselben Laufs weg.
export function dedupeHinweise(neueHinweise, findings = [], decisions = []) {
  const bekannt = new Set()
  const schluesselProFinding = new Map()

  for (const finding of findings) {
    if (!finding) continue
    const anker = finding.anker ?? finding.target ?? ''
    const kategorie = finding.kategorie ?? finding.category ?? ''
    if (!String(anker).trim()) continue
    const schluessel = dedupeSchluessel(anker, kategorie)
    bekannt.add(schluessel)
    if (finding.id) schluesselProFinding.set(finding.id, schluessel)
  }

  for (const decision of decisions) {
    const schluessel = decision && schluesselProFinding.get(decision.findingId)
    if (schluessel) bekannt.add(schluessel)
  }

  const ergebnis = []
  const imLauf = new Set()
  for (const hinweis of (neueHinweise || [])) {
    if (!hinweis) continue
    const schluessel = dedupeSchluessel(hinweis.anker, hinweis.kategorie)
    if (bekannt.has(schluessel) || imLauf.has(schluessel)) continue
    imLauf.add(schluessel)
    ergebnis.push(hinweis)
  }
  return ergebnis
}
