// Pure Hilfslogik für den echten Agenten-Chat (Etappe A, Bereich C).
// Bewusst ohne DOM-, Editor- oder Netz-Abhängigkeiten — node-testbar.
//
// PFLICHT (Lehre aus V-3/H-2, siehe verstaendnis-kontext.mjs / hinweis-kontext.mjs):
// baueAnfrage (agent-tasks.mjs) konsumiert AUSSCHLIESSLICH {verstaendnis, docText, volatiles,
// verlauf, anfrage}. Ein Kontext-Objekt mit eigenen Feldnamen wie {offeneHinweise,
// entscheidungen, zusatzAnweisung} würde von baueAnfrage stillschweigend ignoriert — das
// Modell bekäme offene Hinweise, Entscheidungen und eine Zusatzanweisung nie zu sehen, während
// Tests, die nur den Zwischenwert prüfen, trotzdem grün blieben. baueChatKontext bündelt
// deshalb offene Hinweise, Entscheidungen und eine optionale Zusatzanweisung in EINEM
// volatiles-Array und bildet den Gesprächsverlauf auf das Anthropic-Rollenschema
// ({role:'user'|'assistant', content}) ab — exakt das, was baueAnfrage tatsächlich liest.

const HINWEIS_BITTE_MUSTER = /schau|prüf|lies|check/i
const MAX_VERLAUF_TURNS = 20
const BEHALTE_TURNS = 8

const MINUTE_MS = 60 * 1000
const STUNDE_MS = 60 * MINUTE_MS
const TAG_MS = 24 * STUNDE_MS

const ENTSCHEIDUNGS_LABELS = Object.freeze({
  angenommen: 'Angenommen',
  eigene: 'Eigene Fassung übernommen',
  verworfen: 'Verworfen',
  risiko: 'Risiko bewusst angenommen',
})

function gueltigeTurns(thread) {
  return (Array.isArray(thread) ? thread : []).filter(message => (
    message
    && (message.role === 'user' || message.role === 'agent')
    && typeof message.text === 'string'
    && message.text.trim()
  ))
}

export function erkenneHinweisBitte(text) {
  return HINWEIS_BITTE_MUSTER.test(String(text || ''))
}

export function formatiereRelativeZeit(at, now = Date.now()) {
  if (!Number.isFinite(at)) return ''
  const diff = Math.max(0, now - at)
  if (diff < MINUTE_MS) return 'gerade eben'
  if (diff < STUNDE_MS) {
    const minuten = Math.floor(diff / MINUTE_MS)
    return minuten === 1 ? 'vor 1 Minute' : `vor ${minuten} Minuten`
  }
  if (diff < TAG_MS) {
    const stunden = Math.floor(diff / STUNDE_MS)
    return stunden === 1 ? 'vor 1 Stunde' : `vor ${stunden} Stunden`
  }
  if (diff < 2 * TAG_MS) return 'gestern'
  if (diff < 7 * TAG_MS) return `vor ${Math.floor(diff / TAG_MS)} Tagen`
  return new Date(at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function entscheidungsEintraege(doc, now = Date.now()) {
  const decisions = Array.isArray(doc?.decisions) ? doc.decisions : []
  const findings = Array.isArray(doc?.findings) ? doc.findings : []

  return decisions
    .slice()
    .sort((a, b) => (b.at || 0) - (a.at || 0))
    .map(decision => {
      const finding = findings.find(candidate => candidate?.id === decision.findingId) || null
      let art = 'angenommen'
      if (decision.outcome === 'risk-accepted') art = 'risiko'
      else if (decision.outcome === 'dismissed') art = 'verworfen'
      else if (
        decision.kind === 'accept'
        && decision.appliedText
        && finding?.action
        && decision.appliedText !== finding.action
      ) art = 'eigene'
      return {
        id: decision.id,
        art,
        label: ENTSCHEIDUNGS_LABELS[art],
        datumText: formatiereRelativeZeit(decision.at, now),
        kurztext: finding?.short || 'Hinweis nicht mehr vorhanden',
        begruendung: art === 'risiko' ? String(decision.reason || '') : '',
      }
    })
}

export function kurzformEntscheidungen(doc, now = Date.now()) {
  return entscheidungsEintraege(doc, now).map(eintrag => (
    `${eintrag.label}: ${eintrag.kurztext}${eintrag.begruendung ? ` (Begründung: ${eintrag.begruendung})` : ''}`
  ))
}

export function kurzformHinweise(findings) {
  return (Array.isArray(findings) ? findings : [])
    .filter(finding => finding?.status === 'open')
    .map(finding => {
      const kategorie = finding.category || 'hinweis'
      const anker = finding.target ? ` — Anker: »${finding.target}«` : ''
      return `[${kategorie}] ${finding.short || ''}${anker}`.trim()
    })
}

export function verlaufFuerPrompt(thread, verlaufsNotiz = null) {
  const turns = gueltigeTurns(thread)
  const notizText = typeof verlaufsNotiz?.text === 'string' ? verlaufsNotiz.text.trim() : ''
  if (!notizText) return turns.map(message => ({ role: message.role, text: message.text }))
  const grenze = turns.findIndex(message => message.id === verlaufsNotiz.bisMessageId)
  const rest = grenze >= 0 ? turns.slice(grenze + 1) : turns
  return [
    { role: 'agent', text: `Zusammenfassung des bisherigen Gesprächs: ${notizText}` },
    ...rest.map(message => ({ role: message.role, text: message.text })),
  ]
}

// Reine Planungslogik fuer die Verlauf-Verdichtung: entscheidet, WELCHE aelteren Turns bei
// langen Verlaeufen verdichtet werden sollten und WAS als naechste Turns stehen bleibt. Ruft
// den Task 'zusammenfassung' NICHT selbst auf — das ist Sache des Aufrufers (spaetere Tasks).
export function planVerlaufVerdichtung(thread, verlaufsNotiz = null, { maxTurns = MAX_VERLAUF_TURNS, behalte = BEHALTE_TURNS } = {}) {
  const turns = gueltigeTurns(thread)
  const notizText = typeof verlaufsNotiz?.text === 'string' ? verlaufsNotiz.text.trim() : ''
  const grenze = notizText ? turns.findIndex(message => message.id === verlaufsNotiz.bisMessageId) : -1
  const offen = grenze >= 0 ? turns.slice(grenze + 1) : turns
  if (offen.length <= maxTurns) return null
  const zuVerdichten = offen.slice(0, offen.length - behalte)
  if (!zuVerdichten.length) return null
  const gespraech = zuVerdichten
    .map(message => `${message.role === 'user' ? 'Nutzer' : 'Agent'}: ${message.text}`)
    .join('\n')
  const verdichtungsEingabe = notizText
    ? `Bisherige Zusammenfassung:\n${notizText}\n\nNeue Gesprächsabschnitte:\n${gespraech}`
    : gespraech
  return { verdichtungsEingabe, bisMessageId: zuVerdichten[zuVerdichten.length - 1].id }
}

// Ruhige deutsche Meldungen je Gateway-Fehlertyp — Onda-Ton (du-Form, keine Ausrufezeichen,
// keine Emoji), ohne interne Begriffe (keine Etappen-Bezeichnung, keine Codes, keine
// englischen Fehlertypen im sichtbaren Text). Jeder der sieben Fehlertypen bekommt einen
// eigenen Satz statt eines stillen Rückfalls auf die generische Meldung.
export function chatFehlerText(fehler) {
  const typ = fehler?.typ
  if (typ === 'kein-schluessel') return 'Ich bin gerade offline — es ist kein Schlüssel hinterlegt. Dein Text ist davon unberührt.'
  if (typ === 'offline') return 'Ich erreiche das Netz gerade nicht. Dein Text ist davon unberührt — versuch es später noch einmal.'
  if (typ === 'ratenlimit') return 'Gerade sind zu viele Anfragen unterwegs. Warte einen Moment, dann klappt es wieder.'
  if (typ === 'ueberlastet') return 'Der Dienst ist gerade stark ausgelastet. Versuch es gleich noch einmal — dein Text ist davon unberührt.'
  if (typ === 'schema') return 'Die Antwort kam in einer Form zurück, die ich nicht verarbeiten kann. Dein Text ist davon unberührt — versuch es einfach noch einmal.'
  if (typ === 'abgelehnt') return 'Auf diese Bitte kann ich nicht eingehen. Lass uns beim Text weitermachen.'
  if (typ === 'abgebrochen') return 'Der Vorgang wurde abgebrochen. Dein Text ist davon unberührt.'
  return 'Das hat gerade nicht geklappt. Dein Text ist davon unberührt — versuch es einfach noch einmal.'
}

function volatilerBlock(label, eintraege) {
  const liste = Array.isArray(eintraege) ? eintraege : []
  if (!liste.length) return null
  return `${label}: ${JSON.stringify(liste)}`
}

function rolleFuerAnthropic(rolle) {
  return rolle === 'agent' ? 'assistant' : 'user'
}

// Baut den Kontext für den Task 'chat' in exakt dem Vertrag, den baueAnfrage (agent-tasks.mjs)
// tatsächlich liest: {verstaendnis, docText, volatiles, verlauf, anfrage}.
// - verstaendnis + docText -> Cache-Präfix (baueAnfrage hängt cache_control an).
// - offene Hinweise (Kurzform) + Entscheidungen (Kurzform) + optionale Zusatzanweisung ->
//   EIN volatiles-Array ohne cache_control — sie ändern sich mit jeder Autor-Entscheidung
//   bzw. jedem Turn und dürfen den Cache-Präfix nicht ungültig machen.
// - thread (ÄLTERE Turns) -> verlauf im Anthropic-Rollenschema; anfrage ist die AKTUELLE
//   Frage als letzte user-Message. Ohne anfrage gibt es weder verlauf noch anfrage im
//   Ergebnis — baueAnfrage wirft sonst ("anfrage fehlt bei vorhandenem verlauf", G-2-Vertrag).
// Keine Zeitstempel/Zufallswerte im gecachten Präfix: die relative Zeit (formatiereRelativeZeit)
// fließt nur in entscheidungsEintraege für die UI, NICHT in kurzformEntscheidungen/volatiles.
export function baueChatKontext({
  verstaendnis = null,
  docText = '',
  findings = [],
  doc = null,
  thread = [],
  verlaufsNotiz = null,
  anfrage = '',
  zusatzAnweisung = null,
  now = Date.now(),
} = {}) {
  const volatiles = []

  const hinweisBlock = volatilerBlock(
    'Offene Hinweise im Text — nicht doppelt ansprechen, im Gespräch berücksichtigen',
    kurzformHinweise(findings),
  )
  if (hinweisBlock) volatiles.push(hinweisBlock)

  const entscheidungBlock = volatilerBlock(
    'Bereits getroffene Entscheidungen der Autorin oder des Autors — respektieren, nicht erneut zur Diskussion stellen',
    kurzformEntscheidungen(doc, now),
  )
  if (entscheidungBlock) volatiles.push(entscheidungBlock)

  const zusatz = typeof zusatzAnweisung === 'string' ? zusatzAnweisung.trim() : ''
  if (zusatz) volatiles.push(zusatz)

  const kontext = { verstaendnis, docText: String(docText || ''), volatiles }

  const text = String(anfrage || '').trim()
  if (text) {
    kontext.verlauf = verlaufFuerPrompt(thread, verlaufsNotiz).map(eintrag => ({
      role: rolleFuerAnthropic(eintrag.role),
      content: eintrag.text,
    }))
    kontext.anfrage = text
  }

  return kontext
}
