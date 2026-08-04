// Reiner Kontext-Bauer für den Task 'erweiterungen' — PUR, node-testbar, kein DOM.
// Vorbild und Vertrag: hinweis-kontext.mjs. baueAnfrage (agent-tasks.mjs) konsumiert
// ausschliesslich {verstaendnis, docText, volatiles, verlauf, anfrage}; eigene Feldnamen
// wuerden still verschluckt (Lehre aus V-3).
import { ERWEITERUNG_ANWEISUNG } from './agent-prompts.mjs'

function kompakteListe(label, liste) {
  const eintraege = Array.isArray(liste) ? liste : []
  if (!eintraege.length) return null
  return `${label}: ${JSON.stringify(eintraege)}`
}

// verstaendnis + docText gehoeren ins Cache-Praefix (baueAnfrage haengt cache_control daran)
// und sind dieselben Bloecke wie beim Hinweislauf -- derselbe Text, dasselbe Verstaendnis,
// also derselbe Praefix und damit ein Cache-Treffer statt einer zweiten vollen Eingabe.
// Alles Kanal-Eigene steht in den volatilen Bloecken dahinter.
export function baueErweiterungKontext({
  verstaendnis = null,
  docText = '',
  bereitsAngeboten = [],
} = {}) {
  const volatiles = [ERWEITERUNG_ANWEISUNG]

  const angeboten = kompakteListe(
    'Bereits angebotene Erweiterungen — nicht wiederholen, auch nicht in neuer Verkleidung. '
    + 'zustand "weg" heisst: hat die Autorin oder den Autor nicht interessiert',
    bereitsAngeboten,
  )
  if (angeboten) volatiles.push(angeboten)

  return { verstaendnis, docText, volatiles }
}
