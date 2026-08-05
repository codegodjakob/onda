// Reiner Kontext-Bauer für den Task 'hinweise' — PUR, node-testbar, kein DOM.
//
// Hintergrund (Lehre aus V-3, dort Fix-Runde 1 Finding 1, Critical): baueAnfrage
// (agent-tasks.mjs) konsumiert ausschließlich {verstaendnis, docText, volatiles, verlauf,
// anfrage}. Ein Kontext-Objekt mit eigenen Feldnamen wie {entscheidungen, offeneHinweise}
// würde von baueAnfrage stillschweigend ignoriert — das Modell bekäme HINWEIS_ANWEISUNG und
// die Entscheidungsliste nie zu sehen, während alle Unit-Tests trotzdem grün blieben, wenn sie
// nur den Zwischenwert prüfen. Dieses Modul übersetzt die Hinweislauf-Rohdaten auf den
// tatsächlichen baueAnfrage-Vertrag (Vorbild: verstaendnis-kontext.mjs).
import { hinweisAnweisungFuerModus } from './agent-prompts.mjs'
import { baueOndaBloecke } from './onda-kontext.mjs'
import { aktiveRueckkopplung, formuliereRueckkopplung } from './rueckkopplung-model.mjs'

function kompakteListeHinweis(label, liste) {
  const eintraege = Array.isArray(liste) ? liste : []
  if (!eintraege.length) return null
  return `${label}: ${JSON.stringify(eintraege)}`
}

// verstaendnis + docText gehören ins Cache-Präfix (baueAnfrage hängt cache_control daran).
// entscheidungen/offeneHinweise sind volatil — sie ändern sich mit jeder Autor-Entscheidung
// und dürfen den Cache-Präfix nicht ungültig machen (Cache-Präfix-Stabilität, agent-tasks.mjs).
//
// onda: {project, doc, docs, memoryStore} — Textsorte, Aussagen-Speicher und Gedächtnis
// (onda-kontext.mjs). Diese Blöcke stehen bewusst GANZ HINTEN in den volatiles: Anweisung und
// Entscheidungslage sind der Auftrag, das Projektwissen ist der Hintergrund dazu. Ohne onda
// entstehen keine Blöcke, und der Kontext sieht aus wie zuvor.
//
// rueckkopplung: die Bilanz aus rueckkopplung-model.mjs (bilanziereRueckmeldung) über MEHRERE
// Dokumente — welche Hinweisart bei dieser Person bisher getragen hat und welche nicht. Der
// Block steht direkt HINTER der Anweisung und VOR den Listen: Er ist keine Sachinformation
// über das Projekt, sondern eine Nachjustierung des Auftrags selbst ("bei dieser Art
// besonders streng prüfen"), und die gehört neben die Anweisung, auf die sie sich bezieht.
// Volatil bleibt er in jedem Fall — er ändert sich mit jeder Autorentscheidung und dürfte den
// gecachten Präfix nie berühren. Ohne verwertbare Zahlen entsteht KEIN Block (fail-closed,
// siehe formuliereRueckkopplung).
export function baueHinweisKontext({
  verstaendnis = null,
  docText = '',
  entscheidungen = [],
  offeneHinweise = [],
  rueckkopplung = null,
  onda = null,
  annotationMode = 'text',
} = {}) {
  const volatiles = [hinweisAnweisungFuerModus(annotationMode)]

  // Nur eine ausdruecklich freigegebene, versionierte Kalibrierung darf den Auftrag
  // beeinflussen. Eine rohe Bilanz ist Diagnose, keine Policy.
  const freigegebeneBilanz = aktiveRueckkopplung(rueckkopplung)
  const rueckkopplungHinweis = freigegebeneBilanz ? formuliereRueckkopplung(freigegebeneBilanz) : null
  if (rueckkopplungHinweis) volatiles.push(rueckkopplungHinweis)

  const entscheidungenHinweis = kompakteListeHinweis(
    'Bereits entschiedene Hinweise — nicht wiederholen, auch nicht in neuer Verkleidung',
    entscheidungen,
  )
  if (entscheidungenHinweis) volatiles.push(entscheidungenHinweis)

  const offeneHinweiseHinweis = kompakteListeHinweis(
    'Bereits offene, noch nicht entschiedene Hinweise — nicht doppelt anlegen',
    offeneHinweise,
  )
  if (offeneHinweiseHinweis) volatiles.push(offeneHinweiseHinweis)

  if (onda) volatiles.push(...baueOndaBloecke(onda))

  return { verstaendnis, docText, volatiles, annotationMode: annotationMode === 'notiz' ? 'notiz' : 'text' }
}
