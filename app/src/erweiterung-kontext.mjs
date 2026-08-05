// Reiner Kontext-Bauer für den Task 'erweiterungen' — PUR, node-testbar, kein DOM.
// Vorbild und Vertrag: hinweis-kontext.mjs. baueAnfrage (agent-tasks.mjs) konsumiert
// ausschliesslich {verstaendnis, docText, volatiles, verlauf, anfrage}; eigene Feldnamen
// wuerden still verschluckt (Lehre aus V-3).
import { ERWEITERUNG_ANWEISUNG } from './agent-prompts.mjs'
import { baueOndaBloecke } from './onda-kontext.mjs'

function kompakteListe(label, liste) {
  const eintraege = Array.isArray(liste) ? liste : []
  if (!eintraege.length) return null
  return `${label}: ${JSON.stringify(eintraege)}`
}

// verstaendnis + docText gehoeren ins Cache-Praefix (baueAnfrage haengt cache_control daran)
// und sind dieselben Bloecke wie beim Hinweislauf -- derselbe Text, dasselbe Verstaendnis,
// also derselbe Praefix und damit ein Cache-Treffer statt einer zweiten vollen Eingabe.
// Alles Kanal-Eigene steht in den volatilen Bloecken dahinter.
//
// onda: {project, doc, docs, memoryStore} — Textsorte, Aussagen-Speicher, die anderen Texte
// des Projekts und das Gedaechtnis (onda-kontext.mjs), ganz hinten in den volatiles.
//
// Fuer diesen Kanal zaehlen zwei davon besonders, und zwar gegenlaeufig:
//   - der Aussagen-Speicher bremst: eine "Weiterfuehrung", die in einem anderen Text des
//     Projekts laengst steht, ist keine Erweiterung, sondern eine Doppelung,
//   - die Nachbartexte oeffnen: eine "verbindung" darf eines ihrer beiden Enden in einem
//     dieser Texte haben. Genau dafuer stehen sie woertlich da — ein Anker muss zitierbar
//     sein, sonst verwirft ihn die Eingangspruefung (erweiterungslauf-model.mjs).
export function baueErweiterungKontext({
  verstaendnis = null,
  docText = '',
  bereitsAngeboten = [],
  onda = null,
} = {}) {
  const volatiles = [ERWEITERUNG_ANWEISUNG]

  const angeboten = kompakteListe(
    'Bereits angebotene Erweiterungen — nicht wiederholen, auch nicht in neuer Verkleidung. '
    + 'zustand "weg" heisst: hat die Autorin oder den Autor nicht interessiert',
    bereitsAngeboten,
  )
  if (angeboten) volatiles.push(angeboten)

  if (onda) volatiles.push(...baueOndaBloecke(onda))

  return { verstaendnis, docText, volatiles }
}
