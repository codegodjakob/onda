// Reiner Kontext-Bauer für den Task 'erweiterungen' — PUR, node-testbar, kein DOM.
// Vorbild und Vertrag: hinweis-kontext.mjs. baueAnfrage (agent-tasks.mjs) konsumiert
// ausschliesslich {verstaendnis, docText, volatiles, verlauf, anfrage}; eigene Feldnamen
// wuerden still verschluckt (Lehre aus V-3).
import { ERWEITERUNG_ANWEISUNG } from './agent-prompts.mjs'
import { baueOndaBloecke } from './onda-kontext.mjs'
import { aktiveRueckkopplung, formuliereRueckkopplung } from './rueckkopplung-model.mjs'

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
//
// rueckkopplung: dieselbe freigegebene Bilanz wie im Hinweiskanal (hinweis-kontext.mjs) —
// EIN Entscheidungsbild ueber MEHRERE Dokumente, hier nur ein zweiter bezahlter Kanal dafuer.
// Der Block steht aus demselben Grund direkt HINTER der Anweisung und VOR den Listen: Er ist
// keine Sachinformation, sondern eine Nachjustierung des Auftrags, an den er sich haengt.
// Volatil bleibt er in jedem Fall, und ohne verwertbare Zahlen entsteht KEIN Block
// (fail-closed, siehe formuliereRueckkopplung) — dieselbe Wortlautdisziplin, dieselbe Funktion.
export function baueErweiterungKontext({
  verstaendnis = null,
  docText = '',
  bereitsAngeboten = [],
  rueckkopplung = null,
  onda = null,
} = {}) {
  const volatiles = [ERWEITERUNG_ANWEISUNG]

  const freigegebeneBilanz = aktiveRueckkopplung(rueckkopplung)
  const rueckkopplungHinweis = freigegebeneBilanz ? formuliereRueckkopplung(freigegebeneBilanz) : null
  if (rueckkopplungHinweis) volatiles.push(rueckkopplungHinweis)

  const angeboten = kompakteListe(
    'Bereits angebotene Erweiterungen — nicht wiederholen, auch nicht in neuer Verkleidung. '
    + 'zustand "weg" heisst: hat die Autorin oder den Autor nicht interessiert',
    bereitsAngeboten,
  )
  if (angeboten) volatiles.push(angeboten)

  if (onda) volatiles.push(...baueOndaBloecke(onda))

  return { verstaendnis, docText, volatiles }
}
