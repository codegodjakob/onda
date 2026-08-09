// Reine, node-testbare Einstellungs-Normalisierung — kein DOM, keine Tiptap-Abhaengigkeit.
// Aus editor.js load() und den Tests importiert. Bumpt KEIN Schema (additiv, tolerant).

import { HISTORIE_DECKEL } from './lauf-bilanz.mjs'

export const ACCENTS = Object.freeze(['sky', 'sage', 'blue', 'clay', 'lavender', 'sand'])

// Voreingestellte lokale Monatsgrenze: 10 US-Dollar. Sie ersetzt das verbindliche
// Ausgabenlimit im Anbieter-Konto nicht -- sie kommt frueher. Gemessene Kosten des
// bestehenden Automatiklaufs liegen bei 3,90-22,87 $ je Schreibstunde; ohne lokale
// Bremse faellt das erst auf der Rechnung auf.
export const DEFAULT_KI_MONATSBUDGET_CENTS = 1000

export const DEFAULT_SETTINGS = Object.freeze({
  theme: 'auto',
  spellcheck: false,
  showWords: true,
  structWidth: 620,
  accent: 'sky',
  sidebarCollapsed: false,
  kiMonatsbudgetCents: DEFAULT_KI_MONATSBUDGET_CENTS,
})

// Verbrauchszähler für echte KI-Läufe (Etappe A) — additiv, KEIN Schema-Bump.
// usage steht bewusst NICHT in DEFAULT_SETTINGS: Object.assign kopiert flach,
// ein geteiltes (eingefrorenes) Default-Objekt wäre nicht beschreibbar.
// Bei Monatswechsel wird der Zähler zurückgesetzt (Spec §3.4).

export function aktuellerMonat(datum = new Date()) {
  return `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}`
}

export function leereUsage(monat) {
  return {
    monat,
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    kostenCents: 0,
  }
}

function sichereZahl(wert) {
  const zahl = +wert
  return Number.isFinite(zahl) && zahl >= 0 ? zahl : 0
}

// Drei Faelle, die auseinandergehalten werden muessen:
//   fehlt ganz  -> Voreinstellung. Wer nie etwas gesetzt hat, bekommt eine Bremse.
//   null        -> ausdruecklich abgeschaltet. Das bleibt so; niemand bekommt eine
//                  geloeste Bremse beim naechsten Start wieder untergeschoben.
//   kaputt      -> Voreinstellung. Ein negativer Betrag oder Muell ist Beschaedigung,
//                  keine Absicht -- daraus stillschweigend 'keine Grenze' zu machen
//                  waere die gefaehrlichste aller Auslegungen.
function normalizeKiBudget(wert) {
  if (wert === undefined) return DEFAULT_KI_MONATSBUDGET_CENTS
  if (wert === null) return null
  const zahl = +wert
  return Number.isFinite(zahl) && zahl > 0 ? zahl : DEFAULT_KI_MONATSBUDGET_CENTS
}

function normalizeAutomatikFreigabe(raw, monat) {
  const src = raw && typeof raw === 'object' ? raw : {}
  if (src.monat !== monat) return { monat, verbleibend: 0 }
  const verbleibend = Math.floor(sichereZahl(src.verbleibend))
  // Mehr als genau eine offene Ausnahme waere keine bewusste Einzelfreigabe mehr.
  return { monat, verbleibend: Math.min(1, verbleibend) }
}

function normalizeUsage(raw, monat) {
  const src = raw && typeof raw === 'object' ? raw : {}
  if (src.monat !== monat) return leereUsage(monat)
  return {
    monat,
    inputTokens: sichereZahl(src.inputTokens),
    outputTokens: sichereZahl(src.outputTokens),
    cacheReadTokens: sichereZahl(src.cacheReadTokens),
    cacheWriteTokens: sichereZahl(src.cacheWriteTokens),
    kostenCents: sichereZahl(src.kostenCents),
  }
}

function istLeereUsage(usage) {
  return (
    usage.inputTokens === 0 &&
    usage.outputTokens === 0 &&
    usage.cacheReadTokens === 0 &&
    usage.cacheWriteTokens === 0 &&
    usage.kostenCents === 0
  )
}

// Baut aus einem rohen usage-Objekt einen archivierbaren Eintrag, oder null, wenn kein
// brauchbarer Monatsschluessel dransteht (Schutz gegen Muell aus fremden Quellen). Die
// Zahlenfelder laufen dabei durch dieselbe sichereZahl-Saeuberung wie normalizeUsage —
// in der Historie landen nie unbereinigte Werte, egal welcher Aufrufer sie liefert.
function alsArchivierbar(rohUsage) {
  if (!rohUsage || typeof rohUsage !== 'object' || typeof rohUsage.monat !== 'string') return null
  return normalizeUsage(rohUsage, rohUsage.monat)
}

// Haengt einen abgeschlossenen Monat an eine Historie an — das ist die EINE Stelle, die
// die "genau einmal"-Garantie aus dem Vertrag durchsetzt: leere Monate fliegen raus,
// bereits vorhandene Monate (dedupe ueber den monat-Schluessel) werden nicht doppelt
// angehaengt, und der Deckel (HISTORIE_DECKEL) wirft den jeweils aeltesten Eintrag raus.
// Sowohl normalizeSettings (Wechsel bemerkt beim Laden) als auch verbucheUsage (Wechsel
// bemerkt beim Buchen) rufen diesen Helfer — dedupe macht es egal, welcher der beiden
// Pfade den Wechsel zuerst bemerkt.
function archiviereUsage(historie, usage) {
  if (!usage || istLeereUsage(usage)) return historie
  if (historie.some(eintrag => eintrag.monat === usage.monat)) return historie
  const erweitert = [...historie, usage]
  return erweitert.length > HISTORIE_DECKEL
    ? erweitert.slice(erweitert.length - HISTORIE_DECKEL)
    : erweitert
}

// Tolerant: kein Array oder Muell-Eintraege werden bereinigt statt zu werfen. Ein
// Eintrag, dessen monat dem aktuellen Monat entspricht, gehoert NICHT in die Historie —
// Schutz gegen kaputte Daten, die den laufenden Monat schon als abgeschlossen markieren
// wuerden.
function normalizeUsageHistorie(raw, monat) {
  if (!Array.isArray(raw)) return []
  let historie = []
  for (const eintrag of raw) {
    const kandidat = alsArchivierbar(eintrag)
    if (!kandidat || kandidat.monat === monat) continue
    historie = archiviereUsage(historie, kandidat)
  }
  return historie
}

// Verbucht die usage-Zahlen einer API-Antwort (Feldnamen der Anthropic-API)
// plus geschätzte Kosten in Cent. Wirft nie; Müll zählt als 0.
export function verbucheUsage(settings, apiUsage, kostenCents, monat = aktuellerMonat()) {
  if (!settings.usage || settings.usage.monat !== monat) {
    // Wechsel bemerkt: der alte Stand wandert (falls nicht leer, dedupe inklusive) in die
    // Historie, bevor der Zaehler neu beginnt. Siehe archiviereUsage fuer die Garantie.
    const vorheriger = alsArchivierbar(settings.usage)
    if (vorheriger) {
      if (!Array.isArray(settings.usageHistorie)) settings.usageHistorie = []
      settings.usageHistorie = archiviereUsage(settings.usageHistorie, vorheriger)
    }
    settings.usage = leereUsage(monat)
  }
  const usage = settings.usage
  usage.inputTokens += sichereZahl(apiUsage && apiUsage.input_tokens)
  usage.outputTokens += sichereZahl(apiUsage && apiUsage.output_tokens)
  usage.cacheReadTokens += sichereZahl(apiUsage && apiUsage.cache_read_input_tokens)
  usage.cacheWriteTokens += sichereZahl(apiUsage && apiUsage.cache_creation_input_tokens)
  usage.kostenCents += sichereZahl(kostenCents)
  return usage
}

export function budgetStand(settings, monat = aktuellerMonat()) {
  const src = settings && typeof settings === 'object' ? settings : {}
  const budgetCents = normalizeKiBudget(src.kiMonatsbudgetCents)
  const usage = src.usage?.monat === monat ? src.usage : leereUsage(monat)
  const freigabe = normalizeAutomatikFreigabe(src.automatikFreigabe, monat)
  const kostenCents = sichereZahl(usage.kostenCents)
  return {
    konfiguriert: budgetCents !== null,
    erreicht: budgetCents !== null && kostenCents >= budgetCents,
    budgetCents,
    kostenCents,
    freigaben: freigabe.verbleibend,
  }
}

// Eine Einzelfreigabe wird synchron beansprucht. So koennen zwei nahezu
// gleichzeitige Automatik-Ausloeser niemals dieselbe Zustimmung verwenden.
export function beansprucheAutomatiklauf(settings, monat = aktuellerMonat()) {
  const stand = budgetStand(settings, monat)
  if (!stand.konfiguriert) {
    return { erlaubt: true, grund: 'kein-budget', freigabeVerbraucht: false }
  }
  if (!stand.erreicht) {
    return { erlaubt: true, grund: 'unter-budget', freigabeVerbraucht: false }
  }
  const freigabe = normalizeAutomatikFreigabe(settings?.automatikFreigabe, monat)
  if (freigabe.verbleibend > 0) {
    freigabe.verbleibend -= 1
    settings.automatikFreigabe = freigabe
    return { erlaubt: true, grund: 'einmal-freigegeben', freigabeVerbraucht: true }
  }
  if (settings && typeof settings === 'object') settings.automatikFreigabe = freigabe
  return { erlaubt: false, grund: 'monatsbudget-erreicht', freigabeVerbraucht: false }
}

export function gibNaechstenAutomatiklaufFrei(settings, monat = aktuellerMonat()) {
  if (!settings || typeof settings !== 'object') return null
  settings.automatikFreigabe = { monat, verbleibend: 1 }
  return settings.automatikFreigabe
}

// Unbekannte/kaputte Werte fallen auf sichere Standards zurueck; zusaetzlich
// gespeicherte Felder bleiben erhalten (vorwaertskompatibel).
export function normalizeSettings(raw, monat = aktuellerMonat()) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const s = Object.assign({}, DEFAULT_SETTINGS, src)
  s.structWidth = Math.max(360, Math.min(940, +s.structWidth || 560))
  s.accent = ACCENTS.includes(s.accent) ? s.accent : 'sky'
  s.sidebarCollapsed = !!s.sidebarCollapsed
  s.kiMonatsbudgetCents = normalizeKiBudget(src.kiMonatsbudgetCents)
  // Historie zuerst aus den Rohdaten saeubern, dann - falls der geladene usage-Stand aus
  // einem anderen, nicht-leeren Monat stammt - EINMAL archivieren, bevor normalizeUsage
  // ihn unten verwirft. archiviereUsage dedupet ueber den monat-Schluessel: hat eine
  // vorherige Sitzung diesen Monat beim Buchen (verbucheUsage) schon archiviert, passiert
  // hier nichts doppelt — das ist die "genau einmal"-Garantie aus dem Vertrag.
  let historie = normalizeUsageHistorie(src.usageHistorie, monat)
  const vorherigerStand = alsArchivierbar(src.usage)
  if (vorherigerStand && vorherigerStand.monat !== monat) {
    historie = archiviereUsage(historie, vorherigerStand)
  }
  s.usageHistorie = historie
  s.usage = normalizeUsage(src.usage, monat)
  s.automatikFreigabe = normalizeAutomatikFreigabe(src.automatikFreigabe, monat)
  return s
}
