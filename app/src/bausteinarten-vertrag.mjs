// Gemeinsames Vokabular für den Bausteintyp — kein Import, keine Abhängigkeiten.
// Wird von bausteinlauf-model.mjs (Auftrags-Logik), bausteinarten-kontext.mjs
// (Anfrage-Bau) und agent-tasks.mjs (Anfrage-Vertrag) geteilt. Eine Kopie würde
// sie auseinanderdriften lassen: das Verzeichnis würde dem Modell andere Absätze
// zeigen als die Antwort verarbeitet werden kann, oder die Funktionscodes
// würden sich widersprechen.

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

export { benennbar }
