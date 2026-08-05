// Das Lauf-Journal — reine, node-testbare Buchführung über jeden bezahlten KI-Lauf.
// Kein DOM, kein Netz, kein Date.now() -- Zeit kommt immer als `jetzt`-Parameter herein
// (Vorbild `settings-model.mjs`: tolerante Normalisierung, wirft nie bei Müll).
//
// Ablageort: Dieses Modul kennt nur die FORM des Journals, nicht wo es liegt. Der Ort
// (eigener Bereich `laufJournal` in data.json, neben `settings`/`memoryStore`) ist die
// offene Designfrage aus dem Umsetzungsplan und wird erst in der Verdrahtung entschieden
// (docs/superpowers/plans/2026-08-05-lauf-tor.md, Task 4) -- hier zählt nur, dass jedes
// Journal, gleich woher es kommt, durch `normalisiereLaufJournal` tolerant hereinkommt.
//
// Das Journal ist zugleich der MESSPUNKT für Issue #13 (Wertzahlen): jeder Eintrag trägt
// schon jetzt geliefert/uebernommen/verworfen, auch wenn dieses Paket sie nur durchreicht
// und noch nicht auswertet.

import { MODELLE, TASK_TABLE, schaetzeKostenCents } from './agent-tasks.mjs'
import { SYSTEM_COACH, INTERVIEW_REGELN, HINWEIS_ANWEISUNG, ERWEITERUNG_ANWEISUNG } from './agent-prompts.mjs'
import { INNEHALTEN_MS, INNEHALTEN_AN_GRENZE_MS, AUFSCHAUEN_MS, ART_MOMENT } from './momente-model.mjs'

export const JOURNAL_DECKEL = 200 // Einträge, danach verdichten die ältesten zu Monatssummen.
export const GEZEIGT_DECKEL = 500 // gezeigt-Ereignisse, gleiche Verdichtung.

// FNV-1a, lokal (Vorbild `example-seed.mjs` seedBodySignature) -- absichtlich NICHT von
// dort importiert: dieses Modul braucht keine Doc-Signatur-Semantik, nur einen kurzen,
// stabilen Fingerabdruck über Text. Rückgabe als Basis-36-String (kompakter als Hex).
function fnvHash(text) {
  const value = String(text ?? '')
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

// promptHash/momenteHash hängen nur von den Quellkonstanten ab, nicht vom Task -- einmal
// beim Laden berechnet statt bei jedem baueStand()-Aufruf neu.
const PROMPT_HASH = fnvHash(SYSTEM_COACH + INTERVIEW_REGELN + HINWEIS_ANWEISUNG + ERWEITERUNG_ANWEISUNG)
const MOMENTE_HASH = fnvHash(JSON.stringify({ INNEHALTEN_MS, INNEHALTEN_AN_GRENZE_MS, AUFSCHAUEN_MS, ART_MOMENT }))

export function leeresJournal() {
  return { eintraege: [], monate: [], gezeigt: [] }
}

function sichereZahl(wert) {
  const zahl = +wert
  return Number.isFinite(zahl) && zahl >= 0 ? zahl : 0
}

// Monatsschlüssel 'YYYY-MM' aus einem Zeitstempel, lokale Zeit (Vorbild `aktuellerMonat`
// in settings-model.mjs) -- Journal-Zeiten sind Wanduhrzeiten der Autorin oder des Autors,
// keine UTC-Buchhaltung.
function monatVon(zeitstempel) {
  const datum = new Date(zeitstempel)
  return `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}`
}

function findeOderErzeugeMonat(monate, monatSchluessel) {
  let eintrag = monate.find(m => m && m.monat === monatSchluessel)
  if (!eintrag) {
    eintrag = {
      monat: monatSchluessel,
      laeufe: 0,
      kostenCents: 0,
      tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      jeKanal: {},
      gezeigt: {},
    }
    monate.push(eintrag)
  }
  return eintrag
}

// Verdichtet die ältesten Einträge über den Deckel hinaus zu Monatssummen -- die rohe
// Liste bleibt sonst unbegrenzt groß, obwohl fast niemand alte Einzelläufe braucht.
function wendeEintraegeDeckelAn(journal) {
  while (journal.eintraege.length > JOURNAL_DECKEL) {
    const alt = journal.eintraege.shift()
    const monat = findeOderErzeugeMonat(journal.monate, monatVon(alt.begonnenAt))
    monat.laeufe += 1
    monat.kostenCents += sichereZahl(alt.kostenCents)
    monat.tokens.input += sichereZahl(alt.tokens && alt.tokens.input)
    monat.tokens.output += sichereZahl(alt.tokens && alt.tokens.output)
    monat.tokens.cacheRead += sichereZahl(alt.tokens && alt.tokens.cacheRead)
    monat.tokens.cacheWrite += sichereZahl(alt.tokens && alt.tokens.cacheWrite)
    const kanalSchluessel = alt.kanal || 'unbekannt'
    if (!monat.jeKanal[kanalSchluessel]) monat.jeKanal[kanalSchluessel] = { laeufe: 0, kostenCents: 0 }
    monat.jeKanal[kanalSchluessel].laeufe += 1
    monat.jeKanal[kanalSchluessel].kostenCents += sichereZahl(alt.kostenCents)
  }
}

function wendeGezeigtDeckelAn(journal) {
  while (journal.gezeigt.length > GEZEIGT_DECKEL) {
    const alt = journal.gezeigt.shift()
    const monat = findeOderErzeugeMonat(journal.monate, monatVon(alt.jetzt))
    const momentSchluessel = alt.moment || 'unbekannt'
    monat.gezeigt[momentSchluessel] = (monat.gezeigt[momentSchluessel] || 0) + 1
  }
}

// Baut den Stand, den ein Task gerade bezahlt: Modell + Fingerabdruck der Prompt- und
// Momente-Konstanten. Nachträglich ist das nicht rekonstruierbar, sobald Text oder
// Schwellen sich ändern -- deshalb hält jeder Lauf seinen eigenen Stand. Unbekannter
// Task wirft nie; modell wird dann null (Kosten laufen ohnehin über schaetzeKostenCents
// tolerant gegen unbekannte Modell-IDs).
export function baueStand(task) {
  const taskEintrag = TASK_TABLE[task]
  const modell = taskEintrag ? MODELLE[taskEintrag.modell] || null : null
  return { modell, promptHash: PROMPT_HASH, momenteHash: MOMENTE_HASH }
}

let laufZaehler = 0

// Baut einen neuen Eintrag -- HÄNGT IHN NOCH NICHT ANS JOURNAL. Wer ihn beginnt, kann
// zwischendurch noch abbrechen (kein Schlüssel, Budget, Dokument gewechselt) ohne dass
// je etwas im Journal landet: nur `schliesseLauf` hängt tatsächlich an.
export function beginneLauf({ kanal, ausloeser, signatur, einmalJeSignatur, jetzt }) {
  laufZaehler += 1
  const begonnenAt36 = Number.isFinite(jetzt) ? jetzt.toString(36) : '0'
  return {
    id: `lauf-${begonnenAt36}-${laufZaehler}`,
    begonnenAt: jetzt,
    beendetAt: null,
    kanal,
    ausloeser,
    signatur,
    einmalJeSignatur: !!einmalJeSignatur,
    stand: null,
    tasks: [],
    tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    kostenCents: 0,
    ergebnis: null,
    fehlerTyp: null,
    geliefert: null,
    uebernommen: null,
    verworfen: null,
  }
}

// Verbucht einen bezahlten Gateway-Aufruf in einen noch offenen Eintrag: Task-Name,
// Stand (nur beim ersten bezahlten Aufruf -- der Stand gilt für den ganzen Lauf), Tokens
// und geschätzte Kosten. Wirft nie: Müll-usage zählt als 0, unbekannter Task-Name lässt
// die Kosten bei 0, summiert aber weiterhin die (dann leeren) Tokens.
export function verbucheImEintrag(eintrag, task, usage) {
  if (!eintrag || typeof eintrag !== 'object') return eintrag
  eintrag.tasks.push(task)
  if (!eintrag.stand) eintrag.stand = baueStand(task)
  eintrag.tokens.input += sichereZahl(usage && usage.input_tokens)
  eintrag.tokens.output += sichereZahl(usage && usage.output_tokens)
  eintrag.tokens.cacheRead += sichereZahl(usage && usage.cache_read_input_tokens)
  eintrag.tokens.cacheWrite += sichereZahl(usage && usage.cache_creation_input_tokens)
  const taskEintrag = TASK_TABLE[task]
  const modellId = taskEintrag ? MODELLE[taskEintrag.modell] : null
  eintrag.kostenCents += sichereZahl(schaetzeKostenCents(usage, modellId))
  return eintrag
}

// Schließt einen Eintrag ab, hängt ihn ans Journal und wendet danach den Deckel an.
// `bewertung` trägt ergebnis/fehlerTyp/geliefert/uebernommen/verworfen -- alle optional,
// fehlende Felder fallen auf null (fehlerTyp) bzw. bleiben null (die Wertzahlen).
export function schliesseLauf(journal, eintrag, bewertung, jetzt) {
  const b = bewertung && typeof bewertung === 'object' ? bewertung : {}
  eintrag.beendetAt = jetzt
  eintrag.ergebnis = b.ergebnis ?? null
  eintrag.fehlerTyp = b.fehlerTyp ?? null
  eintrag.geliefert = b.geliefert ?? null
  eintrag.uebernommen = b.uebernommen ?? null
  eintrag.verworfen = b.verworfen ?? null
  journal.eintraege.push(eintrag)
  wendeEintraegeDeckelAn(journal)
  return eintrag
}

// Der jüngste bezahlte (nicht-fehlgeschlagene) Eintrag eines Kanals -- die Grundlage für
// die Signatur-Prüfung im Lauf-Tor (Task 3): "wurde genau dieser Text schon bezahlt?"
export function letzteBezahlteSignatur(journal, kanal) {
  const eintraege = journal && journal.eintraege
  if (!Array.isArray(eintraege)) return null
  for (let index = eintraege.length - 1; index >= 0; index -= 1) {
    const eintrag = eintraege[index]
    if (eintrag && eintrag.kanal === kanal && eintrag.ergebnis !== 'fehler') {
      return eintrag.signatur ?? null
    }
  }
  return null
}

// Abnahme #2: kein Eintrag mit einmalJeSignatur===true darf dieselbe Signatur tragen wie
// der VORHERIGE bezahlte (nicht-fehlgeschlagene) Eintrag desselben Kanals. Fehlläufe
// werden komplett übersprungen -- sie aktualisieren die zuletzt gesehene Signatur nicht
// (derselbe Text darf nach einem Fehler erneut versucht werden, bestehendes Verhalten aus
// workspace.js: "signatur bleibt unveraendert"). Läufe von Hand (einmalJeSignatur: false)
// verletzen die Regel nie -- wer ausdrücklich fragt, darf denselben Stand erneut vorlegen.
export function pruefeJournalInvariante(journal) {
  const eintraege = journal && journal.eintraege
  if (!Array.isArray(eintraege)) return []
  const letzteSignaturJeKanal = {}
  const verstoesse = []
  for (const eintrag of eintraege) {
    if (!eintrag || eintrag.ergebnis === 'fehler') continue
    const letzte = letzteSignaturJeKanal[eintrag.kanal]
    if (eintrag.einmalJeSignatur === true && letzte !== undefined && letzte === eintrag.signatur) {
      verstoesse.push(eintrag.id)
    }
    letzteSignaturJeKanal[eintrag.kanal] = eintrag.signatur
  }
  return verstoesse
}

// Merkt sich, dass eine Karte (Hinweis oder Erweiterung) zum ersten Mal erschienen ist --
// der Messpunkt für die spätere Momente-Kalibrierung (Task 9). Dedupliziert je findingId:
// ein zweites Erscheinen derselben Karte ist kein neues Ereignis. Fehlende findingId ist
// ein no-op statt eines Fehlers -- der Aufrufer (Render-Pfad) soll nie deswegen abstürzen.
export function merkeGezeigt(journal, { findingId, art, moment, jetzt } = {}) {
  if (!findingId) return false
  if (!journal || !Array.isArray(journal.gezeigt)) return false
  if (journal.gezeigt.some(g => g && g.findingId === findingId)) return false
  journal.gezeigt.push({ findingId, art, moment, jetzt })
  wendeGezeigtDeckelAn(journal)
  return true
}

// Tolerante Normalisierung (Vorbild `normalizeSettings`): fehlt eine der drei Listen oder
// ist raw insgesamt kein Objekt, kommt ein leeres Journal heraus. Bestehende Einträge
// werden NICHT einzeln tiefengeprüft -- das wäre eine zweite Wahrheit über die Eintragsform
// neben `beginneLauf`/`schliesseLauf`, die hier leicht auseinanderdriften könnte.
export function normalisiereLaufJournal(raw) {
  if (!raw || typeof raw !== 'object') return leeresJournal()
  return {
    eintraege: Array.isArray(raw.eintraege) ? raw.eintraege : [],
    monate: Array.isArray(raw.monate) ? raw.monate : [],
    gezeigt: Array.isArray(raw.gezeigt) ? raw.gezeigt : [],
  }
}
