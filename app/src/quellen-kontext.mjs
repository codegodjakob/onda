// Reiner Kontext-Bauer für den Task 'quellenthemen' — PUR, node-testbar, kein DOM.
// Vorbild und Vertrag: erweiterung-kontext.mjs. baueAnfrage (agent-tasks.mjs) konsumiert
// ausschliesslich {verstaendnis, docText, volatiles, verlauf, anfrage}; eigene Feldnamen
// wuerden still verschluckt.
import { QUELLENTHEMEN_ANWEISUNG } from './agent-prompts.mjs'
import { baueOndaBloecke } from './onda-kontext.mjs'

// KEIN docText, und das ist eine Entscheidung: nach welchen Themen die Quellen eines
// Projekts stehen, ist eine Frage des Projekts und nicht des gerade offenen Textes.
// Der Text gehoerte hier aus zwei Gruenden nicht hin — er wuerde die Ordnung an den
// Zufall binden, welches Dokument gerade oben liegt, und er kostet bei jeder Aufnahme
// einer Quelle erneut. Das Verstaendnis dagegen gehoert dazu: dieselben zwanzig Quellen
// ordnen sich fuer eine Seminararbeit anders als fuer einen Werbetext.
export const QUELLEN_ANFANG_ZEICHEN = 600
export const QUELLEN_AUSSAGEN_JE_QUELLE = 3

// Der Titel ist der einzige menschenlesbare Name einer Quelle (source-model.mjs:
// metadata.title.value). Aeltere und von Hand gebaute Eintraege tragen ihn manchmal
// flach — beide Formen werden gelesen, damit eine alte Quelle nicht namenlos im
// Prompt steht und deshalb in keine Gruppe kommt.
export function quellenTitel(quelle) {
  const tief = quelle?.metadata?.title
  const wert = (tief && typeof tief === 'object') ? tief.value : tief
  return String(wert ?? quelle?.title ?? '').trim() || 'Quelle ohne Titel'
}

// Nur der Rechnername, nicht der ganze Verweis: eine volle URL mit Pfad und
// Parametern ist lang, kostet bei jeder Quelle und sagt ueber das Thema nichts,
// was der Titel nicht besser sagt.
function herkunft(quelle) {
  const roh = String(quelle?.origin?.originalUrl || '').trim()
  if (!roh) return ''
  try { return new URL(roh).hostname.replace(/^www\./, '') } catch { return '' }
}

// Der gespeicherte Originalausschnitt liegt je nach Typ woanders (Seiten, Abschnitte,
// Text, Transkript). Ohne diesen Anfang haette das Modell nur Titel und Typ — und aus
// einem Titel allein laesst sich kein gemeinsamer Gegenstand erkennen, nur raten.
export function anfangsText(original) {
  if (!original || typeof original !== 'object') return ''
  const teile = []
  if (Array.isArray(original.pages)) teile.push(...original.pages.map(seite => seite?.text))
  if (Array.isArray(original.sections)) teile.push(...original.sections.map(teil => teil?.text))
  if (typeof original.text === 'string') teile.push(original.text)
  if (typeof original.transcript === 'string') teile.push(original.transcript)
  return teile.map(teil => String(teil || '').trim()).filter(Boolean).join(' ').slice(0, QUELLEN_ANFANG_ZEICHEN)
}

function quelleFuerPrompt(quelle) {
  const eintrag = {
    id: String(quelle?.id || ''),
    titel: quellenTitel(quelle),
    typ: String(quelle?.type || 'text'),
  }
  const woher = herkunft(quelle)
  if (woher) eintrag.herkunft = woher
  const anfang = anfangsText(quelle?.original)
  if (anfang) eintrag.anfang = anfang
  // Was die Quelle im Projekt belegen soll, sagt ueber ihr Thema oft mehr als ihr Titel.
  const aussagen = (Array.isArray(quelle?.locators) ? quelle.locators : [])
    .map(ort => String(ort?.claimText || '').trim())
    .filter(Boolean)
    .slice(0, QUELLEN_AUSSAGEN_JE_QUELLE)
  if (aussagen.length) eintrag.aussagen = aussagen
  return eintrag
}

// bestehendeThemen sind die Gruppen, die schon da sind. Zwei verschiedene Rollen,
// und deshalb zwei getrennte Bloecke:
//   - die vom MENSCHEN gesetzten Namen (vonKi === false) sind bindend. Sie stehen
//     woertlich im Prompt, damit das Modell sie uebernimmt statt sie zu „verbessern".
//     Die Uebernahme sichert das trotzdem noch einmal ab (quellen-thema-model.mjs) —
//     ein Prompt ist eine Bitte, kein Riegel,
//   - die vom Agenten gebildeten sind nur ein Vorschlag von letztem Mal. Sie stehen
//     ebenfalls da, damit dieselbe Ordnung nicht bei jedem Lauf neue Namen bekommt.
// onda: {project, doc, docs, memoryStore} — Textsorte, Aussagen-Speicher, Nachbartexte
// und Gedaechtnis (onda-kontext.mjs), ganz hinten in den volatilen Bloecken.
//
// Dieser Kanal ging ohne das Wissen an den Start und war damit ein BLINDER Kanal. Kein
// Unit-Test hat es gemerkt — sie belegen jede Quelle einzeln. Gemeldet hat es die
// Eigenschafts-Pruefung, die ueber ALLE Kanaele laeuft (evals/pruefungen/
// kontext-alle-kanaele.mjs, KONTEXT-01 baulich). Genau dafuer steht sie da.
//
// Fuer die Themenbildung zaehlt vor allem die Textsorte: dieselben zwanzig Quellen ordnen
// sich fuer eine Seminararbeit anders als fuer einen Werbetext. Die Nachbartexte helfen
// mit, weil eine Gruppe, die nur in EINEM Text vorkommt, oft keine Gruppe ist, sondern
// ein Abschnitt.
export function baueQuellenKontext({
  verstaendnis = null,
  quellen = [],
  bestehendeThemen = [],
  onda = null,
} = {}) {
  const volatiles = [QUELLENTHEMEN_ANWEISUNG]

  const liste = (Array.isArray(quellen) ? quellen : []).filter(quelle => quelle?.id).map(quelleFuerPrompt)
  volatiles.push('Quellen im Projekt: ' + JSON.stringify(liste))

  const themen = Array.isArray(bestehendeThemen) ? bestehendeThemen : []
  const gesetzt = themen.filter(thema => thema?.vonKi === false && String(thema?.name || '').trim())
  if (gesetzt.length) {
    volatiles.push(
      'Vom Menschen gesetzte Gruppennamen — übernimm sie wörtlich, benenne sie nie um: '
      + JSON.stringify(gesetzt.map(thema => ({ name: thema.name, warum: String(thema.warum || '') }))),
    )
  }
  const eigene = themen.filter(thema => thema?.vonKi !== false && String(thema?.name || '').trim())
  if (eigene.length) {
    volatiles.push(
      'Deine Gruppen vom letzten Durchgang — behalte den Namen, wo die Gruppe noch trägt: '
      + JSON.stringify(eigene.map(thema => ({ name: thema.name, warum: String(thema.warum || '') }))),
    )
  }

  if (onda) volatiles.push(...baueOndaBloecke(onda))

  return { verstaendnis, volatiles }
}
