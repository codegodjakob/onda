// Reine Umwandlung: KI-Hinweise (deutsches 8-Kategorien-Schema aus HINWEISE_SCHEMA)
// -> Findings in exakt der bestehenden Form (Vorbild: example.js buildExampleLane,
// Normalisierung: reasoning-model.mjs normalizeFinding). Kein DOM, node-testbar.

import { istIntegritaetsfrage, istVonDerTextartAusgeschlossen } from './textart-regeln.mjs'
import { normalizeAnnotationFinding } from './annotation-contract.mjs'
import { WOERTLICH_BEHALTEN, verdichteEntscheidungen } from './lauf-bilanz.mjs'

// Mapping abgeleitet aus dem bestehenden Code (reasoning-model.mjs):
// INTEGRITY_CATEGORIES = fact/source/citation/method/logic; Passage-Findings mit
// kind 'form' tragen 'wording', inhaltliche 'content'; Struktur bleibt 'structure'.
export const KATEGORIE_ZU_CATEGORY = Object.freeze({
  fakt: 'fact',
  quelle: 'source',
  methode: 'method',
  logik: 'logic',
  struktur: 'structure',
  wirkung: 'content',
  erklaerung: 'content',
  sprache: 'wording',
})

const TRENNER = '\n\n'

// Früher stand hier eine feste Liste von vier Kategorien. Jetzt entscheidet die Textart,
// welche Arten Integritätsfragen sind (textart-regeln.mjs) — bei einem Plakattext ist eine
// fehlende Quellenangabe die Form und kein bewusst angenommenes Risiko. Ohne Textart bleibt
// es bei denselben vier wie vorher (fail-closed).
//
// Das Modell-Flag integritaet darf ergänzen, aber nichts zurückholen: Der Prompt legt dem
// Modell integritaet:true für quelle nahe, ohne die Textart zu kennen — bliebe das Flag
// allein maßgeblich, hätte der Plakattext seine Quellenfragen weiterhin.
function istIntegritaet(kategorie, modellFlag, textart) {
  if (istIntegritaetsfrage(textart, kategorie)) return true
  if (modellFlag !== true) return false
  return !istVonDerTextartAusgeschlossen(textart, kategorie)
}

function einfacherHash(value) {
  let hash = 2166136261
  const text = String(value || '')
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

// Dieselbe Textbasis für die Anfrage an das Modell UND für findeAnker —
// nur so zeigen Anker-Indizes auf dieselben Stellen.
export function baueDocText(blocks) {
  return (blocks || []).map(block => String(block.text || '')).join(TRENNER)
}

// Bildet einen Fundstellen-Index aus baueDocText auf den Baustein ab.
// Indizes im Trennerbereich fallen dem folgenden Baustein zu.
export function blockFuerAnkerIndex(blocks, index) {
  if (!Number.isInteger(index) || index < 0) return null
  let offset = 0
  for (const block of blocks || []) {
    const text = String(block.text || '')
    if (index < offset + text.length) return block.id || null
    offset += text.length + TRENNER.length
  }
  return null
}

// Fix-Runde 2, Finding 3 (Important): target (und claim) sind jetzt der ECHTE Wortlaut aus dem
// Dokument (docText.slice(index, index+laenge)), nicht mehr die Modell-Schreibweise (anker).
// Bei einem normalisierten Treffer koennen sich beide unterscheiden (typografische vs. gerade
// Anfuehrungszeichen, kollabiertes Whitespace) -- mit der Modell-Schreibweise als target
// scheiterten spaeter "annehmen"/"eigene Fassung" und die Markierung rendert nicht, weil target
// nicht wortwoertlich im Dokument vorkommt. Fail-closed: ist die Laenge nicht ermittelbar (oder
// der Index ungueltig), wird der Hinweis verworfen statt geraten -- passt zum bestehenden
// Vertrag dieser Funktion (gibt bei nicht verwertbaren Eingaben bereits null zurueck).
// bisher/neu/action bleiben bewusst auf anker bezogen: der Vorschlag des Modells zitiert sich
// selbst (bisher ist per Vertrag ein Teilstring von anker), ein Wechsel auf target koennte den
// Abgleich allein durch die Anfuehrungszeichen-Normalisierung unnoetig scheitern lassen.
//
// textart ist zusaetzlich und optional: Aufrufer, die sie nicht kennen, bekommen genau das
// Verhalten von vorher. Sie wird ans Finding geschrieben, damit spaetere Entscheidungen
// (reasoning-model.mjs decideFinding) dieselbe Regel anwenden wie die Umwandlung hier --
// sonst waere ein Hinweis keine Integritaetsfrage, sein Verwerfen aber trotzdem ein
// "bewusst angenommenes Risiko".
export function hinweisZuFinding(hinweis, ankerErgebnis, blockId, docText, jetzt = Date.now(), textart = '') {
  if (!hinweis || ankerErgebnis?.gefunden !== true) return null
  const anker = String(hinweis.anker || '')
  if (!anker) return null

  const { index, laenge } = ankerErgebnis
  if (!Number.isInteger(index) || index < 0 || !Number.isInteger(laenge) || laenge <= 0) return null
  const target = String(docText || '').slice(index, index + laenge)
  if (!target) return null

  const category = KATEGORIE_ZU_CATEGORY[hinweis.kategorie] || 'content'
  const vorschlag = hinweis.vorschlag && typeof hinweis.vorschlag === 'object' ? hinweis.vorschlag : null
  const bisher = vorschlag ? String(vorschlag.bisher || '') : ''
  const neu = vorschlag ? String(vorschlag.neu || '') : ''
  const vorschlagAnwendbar = Boolean(bisher && neu && anker.includes(bisher))
  const action = vorschlagAnwendbar ? anker.replace(bisher, neu) : ''

  const finding = {
    id: `ki-${jetzt.toString(36)}-${einfacherHash(`${hinweis.kategorie}|${hinweis.anmerkungsart || ''}|${anker}`)}`,
    kind: hinweis.kategorie === 'sprache' ? 'form' : 'inhalt',
    form: vorschlagAnwendbar ? 'mark' : 'note',
    status: 'open',
    placement: 'passage',
    target,
    short: String(hinweis.beobachtung || ''),
    why: String(hinweis.relevanz || ''),
    folge: String(hinweis.folge || ''),
    // Das uebertragbare Prinzip. Fehlt es, bleibt es leer -- ein Hinweis ohne Muster ist
    // immer noch ein gueltiger Hinweis. (Anders bei den Erweiterungen: dort IST das Muster
    // der Ertrag, und ein fehlendes verwirft den Eintrag, siehe erweiterungslauf-model.mjs.)
    muster: String(hinweis.muster || '').trim(),
    action,
    variants: vorschlagAnwendbar ? [action] : [],
    category,
    kategorie: String(hinweis.kategorie || ''),
    kiKategorie: String(hinweis.kategorie || ''),
    anmerkungsart: hinweis.anmerkungsart == null ? undefined : String(hinweis.anmerkungsart),
    textart: String(textart || ''),
    vorschlagsart: String(hinweis.vorschlagsart || (vorschlag ? 'formulierung' : 'keiner')),
    stilmittelId: hinweis.stilmittelId == null ? null : String(hinweis.stilmittelId),
    istGrundursache: hinweis.istGrundursache === true,
    priority: hinweis.istGrundursache === true ? 'high' : 'normal',
    createdAt: jetzt,
    provenance: { actor: 'agent', action: 'hinweise', createdAt: jetzt },
    blockId: blockId || null,
    sources: [],
    thread: [],
  }
  if (istIntegritaet(hinweis.kategorie, hinweis.integritaet, textart)) {
    finding.claim = target
  }
  return normalizeAnnotationFinding(finding)
}

// Volatiler Prompt-Teil: was bereits entschieden wurde, darf nie wieder
// vorgeschlagen werden (Spec §5). Kompakt, ohne Zeitstempel im Cache-Präfix.
//
// WICHTIG (Issue #13, Task 2): Die harte Garantie gegen wiederholte Hinweise ist NICHT diese
// Liste, sondern der CLIENTSEITIGE Dedupe (`dedupeHinweise`, anchor-verify.mjs). Der arbeitet
// in `verarbeiteHinweisantwort` (hinweislauf-model.mjs) weiterhin auf der VOLLEN
// findings/decisions-Liste dieses Dokuments -- er ruft diese Funktion gar nicht auf und bleibt
// von der folgenden Verdichtung unberuehrt. Was hier folgt, ist reine Heuristik fuer den
// PROMPT ans Modell: eine Erinnerungshilfe, kein Tor. Eine Verdichtung dieser Liste kann also
// nie eine Wiederholung DURCHLASSEN, die der Dedupe sonst gestoppt haette.
//
// Frueher wuchs diese Liste linear mit der Entscheidungsgeschichte (ein Eintrag pro je
// entschiedenem Finding, fuer immer). Jetzt bleiben nur die WOERTLICH_BEHALTEN juengsten
// Entscheidungen einzeln lesbar (per `verdichteEntscheidungen`, lauf-bilanz.mjs); alles
// Aeltere faellt je Kategorie in eine Summenzeile `{ kategorie, summe: { angenommen,
// verworfen } }`. Beide Zeilenarten leben im SELBEN Ausgabe-Array -- die Funktionssignatur
// (ein Array) bleibt unveraendert, nur die Elemente ab dem 13. aeltesten sind jetzt Summen
// statt Einzelzeilen. Eine einzelne Zeile hat `entscheidung` (Status-String), eine Summenzeile
// hat stattdessen `summe` (Zaehlobjekt) -- am Feldnamen ist die Art einer Zeile eindeutig zu
// erkennen, ohne dass ein drittes Unterscheidungsfeld noetig waere.
export function fasseEntscheidungenZusammen(findings, decisions) {
  const proFinding = new Map()
  ;(decisions || []).forEach(decision => {
    if (decision?.findingId) proFinding.set(decision.findingId, decision)
  })
  const eintraege = (findings || [])
    .filter(finding => finding && finding.status && finding.status !== 'open')
    .map(finding => ({
      anker: String(finding.target || ''),
      kategorie: String(finding.kiKategorie || finding.category || ''),
      kurz: String(finding.short || finding.text || ''),
      entscheidung: String(finding.status || ''),
      begruendung: String(proFinding.get(finding.id)?.reason || ''),
      // Nur fuer die Alterssortierung in verdichteEntscheidungen -- wird dort wieder
      // entfernt, bevor die woertlichen Zeilen zurueckkommen (kein Zeitstempel im Prompt).
      at: proFinding.get(finding.id)?.at,
    }))

  const { woertlich, summen } = verdichteEntscheidungen(eintraege, WOERTLICH_BEHALTEN)
  const summenZeilen = summen.map(({ kategorie, angenommen, verworfen }) => ({
    kategorie,
    summe: { angenommen, verworfen },
  }))
  return [...woertlich, ...summenZeilen]
}

export function fasseOffeneHinweiseZusammen(findings) {
  return (findings || [])
    .filter(finding => finding && finding.status === 'open')
    .map(finding => ({
      anker: String(finding.target || ''),
      kategorie: String(finding.kiKategorie || finding.category || ''),
      kurz: String(finding.short || finding.text || ''),
    }))
}
